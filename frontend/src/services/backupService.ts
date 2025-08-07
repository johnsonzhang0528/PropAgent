import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface BackupItem {
  name: string;
  path: string;
  size: number;
  created: Date;
  type: 'database' | 'files' | 'full' | 'json' | 'csv' | 'unknown';
}

export interface BackupConfig {
  backupPath: string;
  retention: number;
  compression: boolean;
  includeFiles: boolean;
}

export interface BackupResult {
  database?: string;
  files?: string;
  compressed?: string;
}

class BackupService {
  private apiUrl = `${API_BASE_URL}/backup`;

  // 創建備份
  async createBackup(type: 'database' | 'files' | 'full' = 'full'): Promise<BackupResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/create`, { type });
      return response.data.data;
    } catch (error) {
      console.error('創建備份失敗:', error);
      throw new Error('創建備份失敗');
    }
  }

  // 獲取備份列表
  async getBackupList(): Promise<BackupItem[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/list`);
      return response.data.data.map((item: any) => ({
        ...item,
        created: new Date(item.created)
      }));
    } catch (error) {
      console.error('獲取備份列表失敗:', error);
      throw new Error('獲取備份列表失敗');
    }
  }

  // 下載備份文件
  async downloadBackup(filename: string): Promise<void> {
    try {
      const response = await axios.get(`${this.apiUrl}/download/${filename}`, {
        responseType: 'blob'
      });

      // 創建下載鏈接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下載備份失敗:', error);
      throw new Error('下載備份失敗');
    }
  }

  // 恢復數據庫
  async restoreDatabase(backupPath: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/restore`, { backupPath });
    } catch (error) {
      console.error('恢復數據庫失敗:', error);
      throw new Error('恢復數據庫失敗');
    }
  }

  // 導出數據
  async exportData(format: 'json' | 'csv', collection?: string): Promise<string> {
    try {
      const response = await axios.post(`${this.apiUrl}/export`, {
        format,
        collection
      });
      return response.data.data.path;
    } catch (error) {
      console.error('導出數據失敗:', error);
      throw new Error('導出數據失敗');
    }
  }

  // 刪除備份
  async deleteBackup(filename: string): Promise<void> {
    try {
      await axios.delete(`${this.apiUrl}/${filename}`);
    } catch (error) {
      console.error('刪除備份失敗:', error);
      throw new Error('刪除備份失敗');
    }
  }

  // 清理過期備份
  async cleanupOldBackups(): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/cleanup`);
    } catch (error) {
      console.error('清理過期備份失敗:', error);
      throw new Error('清理過期備份失敗');
    }
  }

  // 獲取備份配置
  async getBackupConfig(): Promise<BackupConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/config`);
      return response.data.data;
    } catch (error) {
      console.error('獲取備份配置失敗:', error);
      throw new Error('獲取備份配置失敗');
    }
  }

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 格式化備份類型
  formatBackupType(type: string): string {
    const typeMap = {
      database: '數據庫備份',
      files: '文件備份',
      full: '完整備份',
      json: 'JSON 導出',
      csv: 'CSV 導出',
      unknown: '未知類型'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  }

  // 獲取備份類型圖標
  getBackupTypeIcon(type: string): string {
    const iconMap = {
      database: '🗄️',
      files: '📁',
      full: '📦',
      json: '📄',
      csv: '📊',
      unknown: '❓'
    };
    return iconMap[type as keyof typeof iconMap] || '📄';
  }

  // 計算備份統計
  calculateBackupStats(backups: BackupItem[]): {
    totalSize: number;
    totalCount: number;
    typeStats: Record<string, number>;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  } {
    if (backups.length === 0) {
      return {
        totalSize: 0,
        totalCount: 0,
        typeStats: {},
        oldestBackup: null,
        newestBackup: null
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const typeStats: Record<string, number> = {};
    
    backups.forEach(backup => {
      typeStats[backup.type] = (typeStats[backup.type] || 0) + 1;
    });

    const dates = backups.map(backup => backup.created);
    const oldestBackup = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestBackup = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalSize,
      totalCount: backups.length,
      typeStats,
      oldestBackup,
      newestBackup
    };
  }
}

export const backupService = new BackupService();
export default backupService;