const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 連接到MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/propagent';

async function testBackup() {
  try {
    console.log('🔗 連接到 MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');
    
    // 創建備份目錄
    const backupPath = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
      console.log('📁 創建備份目錄:', backupPath);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `test-backup-${timestamp}.json`);
    
    console.log('🗃️  開始數據庫備份...');
    
    // 獲取所有集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📄 發現集合:', collections.map(c => c.name));
    
    const backupData = {
      database: 'propagent',
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
        console.log(`✅ 集合 ${collectionName}: ${data.length} 筆記錄`);
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
    console.log(`📊 備份統計:`);
    
    Object.entries(backupData.collections).forEach(([name, data]) => {
      console.log(`  - ${name}: ${data.count} 筆記錄`);
    });
    
    // 檢查文件大小
    const stats = fs.statSync(backupFile);
    console.log(`📦 備份文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ 備份失敗:', error);
  } finally {
    mongoose.disconnect();
  }
}

testBackup();