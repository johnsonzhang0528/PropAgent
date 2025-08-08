import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import * as cron from 'node-cron';
import { promisify } from 'util';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth';
import { backupLimiter } from '../middleware/security';

const router = express.Router();
const execAsync = promisify(exec);

interface BackupConfig {
  mongoUri: string;
  backupPath: string;
  retention: number; // 保留天數
  compression: boolean;
  includeFiles: boolean;
}

class BackupService {
  private config: BackupConfig;
  private backupJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.config = {
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/propagent',
      backupPath: process.env.BACKUP_PATH || path.join(process.cwd(), 'backups'),
      retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compression: process.env.BACKUP_COMPRESSION === 'true',
      includeFiles: process.env.BACKUP_INCLUDE_FILES === 'true'
    };

    // 確保備份目錄存在
    this.ensureBackupDirectory();
    
    // 啟動定時備份
    this.scheduleBackups();
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.config.backupPath)) {
      fs.mkdirSync(this.config.backupPath, { recursive: true });
      console.log(`📁 創建備份目錄: ${this.config.backupPath}`);
    }
  }

  // 創建數據庫備份
  async createDatabaseBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.config.backupPath, `db-backup-${timestamp}.json`);
    
    try {
      const databaseName = this.getDatabaseName();
      console.log(`🗃️  開始數據庫備份: ${databaseName}`);
      
      // 獲取所有集合
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backupData: any = {
        database: databaseName,
        timestamp: new Date().toISOString(),
        collections: {}
      };

      // 備份每個集合的數據
      for (const collection of collections) {
        const collectionName = collection.name;
        console.log(`📄 備份集合: ${collectionName}`);
        
        try {
          const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
          backupData.collections[collectionName] = {
            count: data.length,
            data: data
          };
        } catch (collectionError) {
          console.warn(`⚠️  集合 ${collectionName} 備份失敗:`, collectionError);
          backupData.collections[collectionName] = {
            error: collectionError.message,
            count: 0,
            data: []
          };
        }
      }

      // 寫入備份文件
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ 數據庫備份完成: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ 數據庫備份失敗:', error);
      throw new Error(`數據庫備份失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 創建文件備份
  async createFilesBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupPath, `files-backup-${timestamp}.zip`);
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 上傳目錄不存在，跳過文件備份');
        return '';
      }

      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ 文件備份完成: ${backupPath} (${archive.pointer()} bytes)`);
          resolve(backupPath);
        });

        archive.on('error', (err) => {
          console.error('❌ 文件備份失敗:', err);
          reject(err);
        });

        archive.pipe(output);
        archive.directory(uploadsDir, 'uploads');
        archive.finalize();
      });
    } catch (error) {
      console.error('❌ 文件備份失敗:', error);
      throw new Error(`文件備份失敗: ${error.message}`);
    }
  }

  // 創建完整備份
  async createFullBackup(): Promise<{ database: string; files?: string; compressed?: string }> {
    try {
      console.log('🚀 開始完整備份...');
      
      const databaseBackup = await this.createDatabaseBackup();
      let filesBackup = '';
      
      if (this.config.includeFiles) {
        filesBackup = await this.createFilesBackup();
      }

      let compressedBackup = '';
      if (this.config.compression) {
        compressedBackup = await this.compressBackup(databaseBackup, filesBackup);
      }

      // 清理過期備份
      await this.cleanupOldBackups();

      console.log('🎉 完整備份完成');
      return {
        database: databaseBackup,
        files: filesBackup,
        compressed: compressedBackup
      };
    } catch (error) {
      console.error('❌ 完整備份失敗:', error);
      throw error;
    }
  }

  // 壓縮備份
  private async compressBackup(databasePath: string, filesPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const compressedPath = path.join(this.config.backupPath, `full-backup-${timestamp}.zip`);

    try {
      const output = fs.createWriteStream(compressedPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ 備份壓縮完成: ${compressedPath}`);
          
          // 清理臨時文件
          this.cleanupTempFiles(databasePath, filesPath);
          resolve(compressedPath);
        });

        archive.on('error', reject);
        archive.pipe(output);

        // 添加數據庫備份文件（現在是JSON文件）
        if (fs.existsSync(databasePath)) {
          archive.file(databasePath, { name: 'database.json' });
        }
        
        // 添加文件備份
        if (filesPath && fs.existsSync(filesPath)) {
          archive.file(filesPath, { name: 'files.zip' });
        }

        archive.finalize();
      });
    } catch (error) {
      console.error('❌ 備份壓縮失敗:', error);
      throw new Error(`備份壓縮失敗: ${error.message}`);
    }
  }

  // 清理臨時文件
  private cleanupTempFiles(databasePath: string, filesPath?: string): void {
    try {
      if (fs.existsSync(databasePath)) {
        fs.rmSync(databasePath, { recursive: true, force: true });
      }
      if (filesPath && fs.existsSync(filesPath)) {
        fs.unlinkSync(filesPath);
      }
    } catch (error) {
      console.error('⚠️  清理臨時文件失敗:', error);
    }
  }

  // 清理過期備份
  async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.backupPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️  清理了 ${deletedCount} 個過期備份文件`);
      }
    } catch (error) {
      console.error('⚠️  清理過期備份失敗:', error);
    }
  }

  // 恢復數據庫
  async restoreDatabase(backupPath: string): Promise<void> {
    try {
      console.log(`🔄 開始恢復數據庫: ${backupPath}`);
      
      // 讀取備份文件
      if (!fs.existsSync(backupPath)) {
        throw new Error('備份文件不存在');
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      if (!backupData.collections) {
        throw new Error('無效的備份文件格式');
      }

      // 恢復每個集合
      for (const [collectionName, collectionData] of Object.entries(backupData.collections as any)) {
        if (collectionData.error) {
          console.warn(`⚠️  跳過有錯誤的集合: ${collectionName}`);
          continue;
        }

        console.log(`📄 恢復集合: ${collectionName} (${collectionData.count} 筆記錄)`);
        
        try {
          // 先清空集合
          await mongoose.connection.db.collection(collectionName).deleteMany({});
          
          // 插入備份數據
          if (collectionData.data && collectionData.data.length > 0) {
            await mongoose.connection.db.collection(collectionName).insertMany(collectionData.data);
          }
          
          console.log(`✅ 集合 ${collectionName} 恢復完成`);
        } catch (collectionError) {
          console.error(`❌ 集合 ${collectionName} 恢復失敗:`, collectionError);
          throw new Error(`集合 ${collectionName} 恢復失敗: ${collectionError.message}`);
        }
      }
      
      console.log('✅ 數據庫恢復完成');
    } catch (error) {
      console.error('❌ 數據庫恢復失敗:', error);
      throw new Error(`數據庫恢復失敗: ${error.message}`);
    }
  }

  // 導出數據為 JSON
  async exportToJson(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportPath = path.join(this.config.backupPath, `export-${timestamp}.json`);

      // 獲取所有集合
      const collections = await mongoose.connection.db.listCollections().toArray();
      const exportData: any = {};

      for (const collection of collections) {
        const collectionName = collection.name;
        const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
        exportData[collectionName] = data;
      }

      // 寫入文件
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ JSON 導出完成: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('❌ JSON 導出失敗:', error);
      throw new Error(`JSON 導出失敗: ${error.message}`);
    }
  }

  // 導出數據為 CSV
  async exportToCSV(collectionName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportPath = path.join(this.config.backupPath, `${collectionName}-${timestamp}.csv`);

      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      if (data.length === 0) {
        throw new Error('沒有數據可導出');
      }

      // 獲取所有欄位
      const headers = new Set<string>();
      data.forEach(doc => {
        Object.keys(doc).forEach(key => headers.add(key));
      });

      // 創建 CSV 內容
      const csvHeaders = Array.from(headers).join(',');
      const csvRows = data.map(doc => {
        return Array.from(headers).map(header => {
          const value = doc[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/"/g, '""');
        }).map(val => `"${val}"`).join(',');
      });

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      fs.writeFileSync(exportPath, csvContent);

      console.log(`✅ CSV 導出完成: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('❌ CSV 導出失敗:', error);
      throw new Error(`CSV 導出失敗: ${error.message}`);
    }
  }

  // 獲取備份列表
  getBackupList(): Array<{ name: string; path: string; size: number; created: Date; type: string }> {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      
      return files.map(file => {
        const filePath = path.join(this.config.backupPath, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          type: this.getBackupType(file)
        };
      }).sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('❌ 獲取備份列表失敗:', error);
      return [];
    }
  }

  // 定時備份
  scheduleBackups(): void {
    // 每日備份 (凌晨 2 點)
    const dailyBackup = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🕐 開始定時備份...');
        await this.createFullBackup();
      } catch (error) {
        console.error('❌ 定時備份失敗:', error);
      }
    });

    this.backupJobs.set('daily', dailyBackup);
    console.log('⏰ 定時備份已設置: 每日凌晨 2 點');
  }

  // 停止定時備份
  stopScheduledBackups(): void {
    this.backupJobs.forEach(job => job.stop());
    this.backupJobs.clear();
    console.log('⏹️  定時備份已停止');
  }

  private getDatabaseName(): string {
    return this.config.mongoUri.split('/').pop()?.split('?')[0] || 'propagent';
  }

  private getBackupType(filename: string): string {
    if (filename.includes('db-backup')) return 'database';
    if (filename.includes('files-backup')) return 'files';
    if (filename.includes('full-backup')) return 'full';
    if (filename.includes('export') && filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.csv')) return 'csv';
    return 'unknown';
  }
}

// 創建備份服務實例
const backupService = new BackupService();

// 路由 - 加入安全性和權限控制

// 手動創建備份 (需要管理員權限)
router.post('/create', authMiddleware, backupLimiter, async (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可執行備份操作'
    });
  }
  try {
    const { type = 'full' } = req.body;
    
    let result;
    switch (type) {
      case 'database':
        result = { database: await backupService.createDatabaseBackup() };
        break;
      case 'files':
        result = { files: await backupService.createFilesBackup() };
        break;
      case 'full':
      default:
        result = await backupService.createFullBackup();
        break;
    }

    res.json({
      success: true,
      message: '備份創建成功',
      data: result
    });
  } catch (error) {
    console.error('備份創建失敗:', error);
    res.status(500).json({
      success: false,
      message: '備份創建失敗',
      error: error.message
    });
  }
});

// 獲取備份列表 (需要登入即可)
router.get('/list', authMiddleware, (req: any, res) => {
  try {
    const backups = backupService.getBackupList();
    
    res.json({
      success: true,
      data: backups,
      total: backups.length
    });
  } catch (error) {
    console.error('獲取備份列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取備份列表失敗',
      error: error.message
    });
  }
});

// 下載備份文件 (需要管理員權限)
router.get('/download/:filename', authMiddleware, (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可下載備份文件'
    });
  }
  try {
    const { filename } = req.params;
    const filePath = path.join((backupService as any).config.backupPath, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '備份文件不存在'
      });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('下載備份文件失敗:', error);
    res.status(500).json({
      success: false,
      message: '下載失敗',
      error: error.message
    });
  }
});

// 恢復數據庫 (需要超級管理員權限)
router.post('/restore', authMiddleware, backupLimiter, async (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅超級管理員可執行數據庫恢復操作'
    });
  }
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: '請提供備份路徑'
      });
    }

    await backupService.restoreDatabase(backupPath);
    
    res.json({
      success: true,
      message: '數據庫恢復成功'
    });
  } catch (error) {
    console.error('數據庫恢復失敗:', error);
    res.status(500).json({
      success: false,
      message: '數據庫恢復失敗',
      error: error.message
    });
  }
});

// 導出數據 (需要管理員權限)
router.post('/export', authMiddleware, backupLimiter, async (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可執行數據導出操作'
    });
  }
  try {
    const { format = 'json', collection } = req.body;
    
    let result;
    switch (format.toLowerCase()) {
      case 'json':
        result = await backupService.exportToJson();
        break;
      case 'csv':
        if (!collection) {
          return res.status(400).json({
            success: false,
            message: 'CSV 導出需要指定集合名稱'
          });
        }
        result = await backupService.exportToCSV(collection);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的導出格式'
        });
    }

    res.json({
      success: true,
      message: '數據導出成功',
      data: { path: result }
    });
  } catch (error) {
    console.error('數據導出失敗:', error);
    res.status(500).json({
      success: false,
      message: '數據導出失敗',
      error: error.message
    });
  }
});

// 刪除備份 (需要管理員權限)
router.delete('/:filename', authMiddleware, (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可刪除備份文件'
    });
  }
  try {
    const { filename } = req.params;
    const filePath = path.join((backupService as any).config.backupPath, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '備份文件不存在'
      });
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: '備份文件已刪除'
    });
  } catch (error) {
    console.error('刪除備份文件失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除失敗',
      error: error.message
    });
  }
});

// 清理過期備份 (需要管理員權限)
router.post('/cleanup', authMiddleware, backupLimiter, async (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可執行備份清理操作'
    });
  }
  try {
    await backupService.cleanupOldBackups();
    
    res.json({
      success: true,
      message: '過期備份清理完成'
    });
  } catch (error) {
    console.error('清理過期備份失敗:', error);
    res.status(500).json({
      success: false,
      message: '清理失敗',
      error: error.message
    });
  }
});

// 獲取備份配置 (需要管理員權限)
router.get('/config', authMiddleware, (req: any, res) => {
  // 檢查用戶權限
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '權限不足，僅管理員可查看備份配置'
    });
  }
  res.json({
    success: true,
    data: {
      backupPath: (backupService as any).config.backupPath,
      retention: (backupService as any).config.retention,
      compression: (backupService as any).config.compression,
      includeFiles: (backupService as any).config.includeFiles
    }
  });
});

export { backupService };
export default router;