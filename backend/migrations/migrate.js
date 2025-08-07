#!/usr/bin/env node

/**
 * MongoDB 遷移執行器
 * 用於執行資料庫遷移腳本
 * 
 * 使用方式:
 * node migrate.js              # 執行所有未執行的遷移
 * node migrate.js --target=3   # 執行到指定版本的遷移
 * node migrate.js --dry-run    # 預覽模式，不實際執行
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
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

  async initMigrationsCollection() {
    const collections = await this.db.listCollections({ name: this.migrationsCollection }).toArray();
    
    if (collections.length === 0) {
      console.log('📋 初始化遷移記錄集合...');
      await this.db.createCollection(this.migrationsCollection);
      await this.db.collection(this.migrationsCollection).createIndex({ version: 1 }, { unique: true });
    }
  }

  async getExecutedMigrations() {
    const executed = await this.db.collection(this.migrationsCollection)
      .find({}, { projection: { version: 1, _id: 0 } })
      .sort({ version: 1 })
      .toArray();
    
    return executed.map(m => m.version);
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

  async executeMigration(migration, isDryRun = false) {
    console.log(`📦 載入遷移: ${migration.filename}`);
    
    try {
      const migrationModule = require(migration.filepath);
      
      if (typeof migrationModule.up !== 'function') {
        throw new Error(`遷移 ${migration.filename} 缺少 up() 方法`);
      }

      if (isDryRun) {
        console.log(`🔍 [預覽模式] 將執行: ${migration.filename}`);
        return;
      }

      console.log(`⚡ 執行遷移: ${migration.filename}`);
      
      // 在事務中執行遷移
      const session = this.client.startSession();
      
      try {
        await session.withTransaction(async () => {
          await migrationModule.up(this.db);
          
          // 記錄遷移執行狀態
          await this.db.collection(this.migrationsCollection).insertOne({
            version: migration.version,
            filename: migration.filename,
            executed_at: new Date(),
            execution_time_ms: Date.now() - startTime
          });
        });
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ 遷移完成: ${migration.filename} (${executionTime}ms)`);
        
      } finally {
        await session.endSession();
      }
      
    } catch (error) {
      console.error(`❌ 遷移失敗: ${migration.filename}`);
      console.error('錯誤詳情:', error.message);
      throw error;
    }
  }

  async run(options = {}) {
    const { target, dryRun = false } = options;
    
    try {
      await this.connect();
      await this.initMigrationsCollection();

      const allMigrations = this.getMigrationFiles();
      const executedVersions = await this.getExecutedMigrations();
      
      console.log(`📊 狀態概覽:`);
      console.log(`   - 總遷移數: ${allMigrations.length}`);
      console.log(`   - 已執行: ${executedVersions.length}`);
      console.log(`   - 待執行: ${allMigrations.length - executedVersions.length}`);
      
      if (dryRun) {
        console.log(`\n🔍 預覽模式 - 不會實際執行遷移`);
      }

      // 篩選需要執行的遷移
      let migrationsToRun = allMigrations.filter(m => !executedVersions.includes(m.version));
      
      if (target) {
        migrationsToRun = migrationsToRun.filter(m => m.version <= target);
        console.log(`🎯 目標版本: ${target}`);
      }

      if (migrationsToRun.length === 0) {
        console.log('✨ 沒有需要執行的遷移');
        return;
      }

      console.log(`\n🚀 準備執行 ${migrationsToRun.length} 個遷移:`);
      migrationsToRun.forEach(m => {
        console.log(`   - ${m.filename}`);
      });

      if (!dryRun) {
        console.log('\n開始執行遷移...');
      }

      // 逐一執行遷移
      for (const migration of migrationsToRun) {
        const startTime = Date.now();
        await this.executeMigration(migration, dryRun);
      }

      if (!dryRun) {
        console.log(`\n🎉 所有遷移執行完成！`);
      } else {
        console.log(`\n👀 預覽完成！使用 node migrate.js 執行實際遷移`);
      }

    } catch (error) {
      console.error('\n💥 遷移執行失敗:');
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
    target: null
  };

  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--target=')) {
      options.target = parseInt(arg.split('=')[1]);
    }
  });

  return options;
}

// 主程序
if (require.main === module) {
  const options = parseArgs();
  const runner = new MigrationRunner();
  
  console.log('🛠️  PropAgent Pro 資料庫遷移工具\n');
  
  runner.run(options).catch(error => {
    console.error('❌ 未處理的錯誤:', error);
    process.exit(1);
  });
}

module.exports = MigrationRunner;