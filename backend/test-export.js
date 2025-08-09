const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017/propagent';

async function testJsonExport() {
  try {
    console.log('🔗 連接到 MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 連接成功');
    
    const backupPath = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(backupPath, `export-${timestamp}.json`);

    console.log('📤 開始 JSON 導出...');

    // 獲取所有集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    const exportData = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`📄 導出集合: ${collectionName}`);
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      exportData[collectionName] = data;
      console.log(`✅ ${collectionName}: ${data.length} 筆記錄`);
    }

    // 寫入文件
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    const stats = fs.statSync(exportPath);
    console.log(`✅ JSON 導出完成: ${exportPath}`);
    console.log(`📦 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    return exportPath;
    
  } catch (error) {
    console.error('❌ JSON 導出失敗:', error);
    throw error;
  }
}

async function testCsvExport(collectionName) {
  try {
    console.log(`📤 開始 CSV 導出集合: ${collectionName}`);
    
    const backupPath = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(backupPath, `${collectionName}-${timestamp}.csv`);

    const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
    
    if (data.length === 0) {
      throw new Error('沒有數據可導出');
    }

    console.log(`📊 處理 ${data.length} 筆記錄`);

    // 獲取所有欄位
    const headers = new Set();
    data.forEach(doc => {
      Object.keys(doc).forEach(key => headers.add(key));
    });

    console.log(`📋 發現欄位:`, Array.from(headers));

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

    const stats = fs.statSync(exportPath);
    console.log(`✅ CSV 導出完成: ${exportPath}`);
    console.log(`📦 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    return exportPath;
    
  } catch (error) {
    console.error(`❌ CSV 導出失敗:`, error);
    throw error;
  }
}

async function runExportTests() {
  try {
    // 測試 JSON 導出
    await testJsonExport();
    
    // 測試 CSV 導出 - 測試有數據的集合
    const testCollections = ['customers', 'properties', 'users'];
    
    for (const collection of testCollections) {
      try {
        await testCsvExport(collection);
      } catch (error) {
        console.log(`⚠️  集合 ${collection} CSV 導出跳過:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 導出測試失敗:', error);
  } finally {
    mongoose.disconnect();
  }
}

runExportTests();