const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017/propagent';

async function testRestore(backupPath) {
  try {
    console.log('🔗 連接到 MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');
    
    console.log(`🔄 開始恢復數據庫: ${backupPath}`);
    
    // 驗證備份文件存在
    if (!fs.existsSync(backupPath)) {
      throw new Error('備份文件不存在');
    }
    
    console.log('📖 讀取備份文件...');
    
    // 讀取備份文件
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!backupData.collections) {
      throw new Error('無效的備份文件格式');
    }
    
    console.log('📊 備份文件資訊:');
    console.log('  - 數據庫:', backupData.database || 'Unknown');
    console.log('  - 備份時間:', backupData.timestamp || 'Unknown');
    console.log('  - 集合數量:', Object.keys(backupData.collections).length);

    // 顯示將要恢復的數據統計
    console.log('\n📋 恢復數據統計:');
    Object.entries(backupData.collections).forEach(([collectionName, collectionData]) => {
      if (collectionData.error) {
        console.log(`  ⚠️  ${collectionName}: 錯誤 - ${collectionData.error}`);
      } else {
        console.log(`  📄 ${collectionName}: ${collectionData.count || collectionData.data?.length || 0} 筆記錄`);
      }
    });
    
    // 警告：這是危險操作
    console.log('\n⚠️  警告: 這將覆蓋現有數據！');
    console.log('⏳ 等待 3 秒後開始恢復...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 恢復每個集合
    let restoredCollections = 0;
    let restoredRecords = 0;
    
    for (const [collectionName, collectionData] of Object.entries(backupData.collections)) {
      if (collectionData.error) {
        console.log(`⚠️  跳過有錯誤的集合: ${collectionName}`);
        continue;
      }

      console.log(`📄 恢復集合: ${collectionName} (${collectionData.count || collectionData.data?.length || 0} 筆記錄)`);
      
      try {
        // 先清空集合
        const deleteResult = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`  🗑️  刪除現有記錄: ${deleteResult.deletedCount} 筆`);
        
        // 插入備份數據
        const dataToInsert = collectionData.data || [];
        if (dataToInsert.length > 0) {
          const insertResult = await mongoose.connection.db.collection(collectionName).insertMany(dataToInsert);
          console.log(`  ✅ 插入記錄: ${insertResult.insertedCount} 筆`);
          restoredRecords += insertResult.insertedCount;
        } else {
          console.log(`  📝 集合為空，跳過插入`);
        }
        
        restoredCollections++;
        
      } catch (collectionError) {
        console.error(`  ❌ 集合 ${collectionName} 恢復失敗:`, collectionError.message);
        // 繼續處理其他集合，不拋出錯誤
      }
    }
    
    console.log(`\n✅ 數據庫恢復完成`);
    console.log(`📊 恢復統計:`);
    console.log(`  - 恢復集合: ${restoredCollections} 個`);
    console.log(`  - 恢復記錄: ${restoredRecords} 筆`);
    
    // 驗證恢復結果
    console.log('\n🔍 驗證恢復結果:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      console.log(`  📄 ${collectionName}: ${count} 筆記錄`);
    }
    
  } catch (error) {
    console.error('❌ 數據庫恢復失敗:', error.message);
    throw error;
  } finally {
    mongoose.disconnect();
  }
}

async function runRestoreTest() {
  try {
    // 查找最新的備份文件
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error('備份目錄不存在');
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('test-backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stat: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);
    
    if (backupFiles.length === 0) {
      throw new Error('找不到備份文件，請先執行 node test-backup.js');
    }
    
    const latestBackup = backupFiles[0];
    console.log(`🎯 使用最新備份文件: ${latestBackup.name}`);
    console.log(`📅 備份時間: ${latestBackup.stat.mtime.toLocaleString('zh-TW')}`);
    
    await testRestore(latestBackup.path);
    
  } catch (error) {
    console.error('❌ 恢復測試失敗:', error.message);
  }
}

// 執行恢復測試
runRestoreTest();