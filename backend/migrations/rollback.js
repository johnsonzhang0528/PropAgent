#!/usr/bin/env node

/**
 * MongoDB 遷移回滾器
 * 用於回滾已執行的資料庫遷移
 * 
 * 使用方式:
 * node rollback.js             # 回滾最後一個遷移
 * node rollback.js --target=2  # 回滾到指定版本
 * node rollback.js --all       # 回滾所有遷移
 * node rollback.js --dry-run   # 預覽模式，不實際執行
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

class MigrationRollback {
  constructor() {
    this.mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/propagent';
    this.migrationsDir = __dirname;
    this.migrationsCollection = '_migrations';
  }

  async connect() {
    console.log('🔗 連接資料庫...');
    this.client = new MongoClient(this.mongoUrl);
    await this.client.connect();
    this.db = this.client.db();
    console.log('✅ 資料庫連接成功');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 資料庫連接已關閉');
    }
  }

  async getExecutedMigrations() {
    const collections = await this.db.listCollections({ name: this.migrationsCollection }).toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  找不到遷移記錄集合，可能尚未執行任何遷移');
      return [];
    }

    const executed = await this.db.collection(this.migrationsCollection)
      .find({})
      .sort({ version: -1 })
      .toArray();
    
    return executed;
  }

  getMigrationFiles() {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.match(/^\d{3}_.*\.js$/) && !file.includes('migrate.js') && !file.includes('rollback.js'))
      .sort();
    
    return files.map(file => {
      const version = parseInt(file.substring(0, 3));
      return {
        version,
        filename: file,
        filepath: path.join(this.migrationsDir, file)
      };
    });
  }

  async rollbackMigration(migration, isDryRun = false) {
    console.log(`📦 載入遷移: ${migration.filename}`);
    
    try {
      const migrationModule = require(migration.filepath);
      
      if (typeof migrationModule.down !== 'function') {
        throw new Error(`遷移 ${migration.filename} 缺少 down() 方法`);
      }

      if (isDryRun) {
        console.log(`🔍 [預覽模式] 將回滾: ${migration.filename}`);
        return;
      }

      console.log(`⚡ 回滾遷移: ${migration.filename}`);
      const startTime = Date.now();
      
      // 在事務中執行回滾
      const session = this.client.startSession();
      
      try {
        await session.withTransaction(async () => {
          await migrationModule.down(this.db);
          
          // 刪除遷移記錄
          await this.db.collection(this.migrationsCollection).deleteOne({
            version: migration.version
          });
        });
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ 回滾完成: ${migration.filename} (${executionTime}ms)`);
        
      } finally {
        await session.endSession();
      }
      
    } catch (error) {
      console.error(`❌ 回滾失敗: ${migration.filename}`);
      console.error('錯誤詳情:', error.message);
      throw error;
    }
  }

  async run(options = {}) {
    const { target, all = false, dryRun = false } = options;
    
    try {
      await this.connect();

      const allMigrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        console.log('✨ 沒有已執行的遷移可以回滾');
        return;
      }

      console.log(`📊 狀態概覽:`);
      console.log(`   - 總遷移數: ${allMigrationFiles.length}`);
      console.log(`   - 已執行: ${executedMigrations.length}`);
      
      if (dryRun) {
        console.log(`\n🔍 預覽模式 - 不會實際執行回滾`);
      }

      // 決定要回滾的遷移
      let migrationsToRollback = [];

      if (all) {
        // 回滾所有遷移
        migrationsToRollback = executedMigrations.map(m => {
          const file = allMigrationFiles.find(f => f.version === m.version);
          return {
            version: m.version,
            filename: m.filename,
            filepath: file ? file.filepath : null,
            executed_at: m.executed_at
          };
        });
        console.log(`🎯 目標: 回滾所有遷移`);
        
      } else if (target !== null) {
        // 回滾到指定版本
        migrationsToRollback = executedMigrations
          .filter(m => m.version > target)
          .map(m => {
            const file = allMigrationFiles.find(f => f.version === m.version);
            return {
              version: m.version,
              filename: m.filename,
              filepath: file ? file.filepath : null,
              executed_at: m.executed_at
            };
          });
        console.log(`🎯 目標版本: ${target}`);
        
      } else {
        // 只回滾最後一個遷移
        const lastMigration = executedMigrations[0];
        const file = allMigrationFiles.find(f => f.version === lastMigration.version);
        migrationsToRollback = [{
          version: lastMigration.version,
          filename: lastMigration.filename,
          filepath: file ? file.filepath : null,
          executed_at: lastMigration.executed_at
        }];
        console.log(`🎯 回滾最後一個遷移`);
      }

      // 檢查遷移文件是否存在
      const missingFiles = migrationsToRollback.filter(m => !m.filepath || !fs.existsSync(m.filepath));
      if (missingFiles.length > 0) {
        console.error('❌ 找不到以下遷移文件:');
        missingFiles.forEach(m => console.error(`   - ${m.filename}`));
        throw new Error('遷移文件缺失');
      }

      if (migrationsToRollback.length === 0) {
        console.log('✨ 沒有需要回滾的遷移');
        return;
      }

      console.log(`\n🚀 準備回滾 ${migrationsToRollback.length} 個遷移:`);
      migrationsToRollback.forEach(m => {
        console.log(`   - ${m.filename} (執行於: ${new Date(m.executed_at).toLocaleString('zh-TW')})`);
      });

      // 確認回滾操作
      if (!dryRun && !process.env.SKIP_CONFIRMATION) {
        console.log('\n⚠️  警告: 回滾操作可能會導致資料遺失！');
        console.log('請確認您已經備份重要資料。');
        console.log('如要繼續，請設置環境變數 SKIP_CONFIRMATION=true');
        return;
      }

      if (!dryRun) {
        console.log('\n開始執行回滾...');
      }

      // 按照版本倒序執行回滾（最新的先回滾）
      for (const migration of migrationsToRollback) {
        await this.rollbackMigration(migration, dryRun);
      }

      if (!dryRun) {
        console.log(`\n🎉 所有回滾操作執行完成！`);
        
        // 顯示當前狀態
        const remainingMigrations = await this.getExecutedMigrations();
        if (remainingMigrations.length > 0) {
          console.log(`📊 當前資料庫版本: ${remainingMigrations[0].version} (${remainingMigrations[0].filename})`);
        } else {
          console.log('📊 資料庫已回滾到初始狀態');
        }
      } else {
        console.log(`\n👀 預覽完成！使用 SKIP_CONFIRMATION=true node rollback.js 執行實際回滾`);
      }

    } catch (error) {
      console.error('\n💥 回滾執行失敗:');
      console.error(error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// 命令行參數解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    target: null,
    all: false
  };

  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--target=')) {
      options.target = parseInt(arg.split('=')[1]);
    }
  });

  return options;
}

// 主程序
if (require.main === module) {
  const options = parseArgs();
  const rollback = new MigrationRollback();
  
  console.log('🔄 PropAgent Pro 資料庫回滾工具\n');
  
  rollback.run(options).catch(error => {
    console.error('❌ 未處理的錯誤:', error);
    process.exit(1);
  });
}

module.exports = MigrationRollback;