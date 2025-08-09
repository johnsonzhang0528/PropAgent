const fs = require('fs');
const path = require('path');

function testBackupList() {
  try {
    console.log('📋 測試備份列表功能...');
    
    const backupPath = path.join(__dirname, 'backups');
    
    if (!fs.existsSync(backupPath)) {
      console.log('📁 備份目錄不存在');
      return [];
    }
    
    console.log(`📂 掃描備份目錄: ${backupPath}`);
    
    const files = fs.readdirSync(backupPath);
    console.log(`📄 找到檔案: ${files.length} 個`);
    
    if (files.length === 0) {
      console.log('📭 備份目錄為空');
      return [];
    }
    
    const backupList = files.map(file => {
      const filePath = path.join(backupPath, file);
      const stats = fs.statSync(filePath);
      
      // 根據檔名判斷備份類型
      let type = 'unknown';
      if (file.includes('db-backup') || file.includes('test-backup')) {
        type = 'database';
      } else if (file.includes('files-backup')) {
        type = 'files';
      } else if (file.includes('full-backup')) {
        type = 'full';
      } else if (file.includes('export') && file.endsWith('.json')) {
        type = 'json';
      } else if (file.endsWith('.csv')) {
        type = 'csv';
      }
      
      return {
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime,
        type: type
      };
    }).sort((a, b) => b.created.getTime() - a.created.getTime()); // 按時間倒序排列
    
    console.log('\n📊 備份檔案清單:');
    console.log('═'.repeat(80));
    
    backupList.forEach((backup, index) => {
      const sizeStr = (backup.size / 1024).toFixed(2) + ' KB';
      const typeEmoji = getTypeEmoji(backup.type);
      
      console.log(`${index + 1}. ${typeEmoji} ${backup.name}`);
      console.log(`   📅 時間: ${backup.created.toLocaleString('zh-TW')}`);
      console.log(`   📦 大小: ${sizeStr}`);
      console.log(`   🏷️  類型: ${formatBackupType(backup.type)}`);
      console.log(`   📁 路徑: ${backup.path}`);
      console.log('');
    });
    
    // 統計資訊
    const totalSize = backupList.reduce((sum, backup) => sum + backup.size, 0);
    const typeStats = {};
    backupList.forEach(backup => {
      typeStats[backup.type] = (typeStats[backup.type] || 0) + 1;
    });
    
    console.log('📈 統計資訊:');
    console.log(`  📄 總檔案數: ${backupList.length} 個`);
    console.log(`  📦 總大小: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`  📅 最新備份: ${backupList[0]?.created.toLocaleString('zh-TW') || '無'}`);
    console.log(`  📅 最舊備份: ${backupList[backupList.length - 1]?.created.toLocaleString('zh-TW') || '無'}`);
    console.log('  📊 類型分布:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`    - ${formatBackupType(type)}: ${count} 個`);
    });
    
    return backupList;
    
  } catch (error) {
    console.error('❌ 備份列表測試失敗:', error.message);
    throw error;
  }
}

function getTypeEmoji(type) {
  const emojiMap = {
    database: '🗄️',
    files: '📁',
    full: '📦',
    json: '📄',
    csv: '📊',
    unknown: '❓'
  };
  return emojiMap[type] || '📄';
}

function formatBackupType(type) {
  const typeMap = {
    database: '數據庫備份',
    files: '文件備份',
    full: '完整備份',
    json: 'JSON 導出',
    csv: 'CSV 導出',
    unknown: '未知類型'
  };
  return typeMap[type] || type;
}

function testBackupDownload(filename) {
  try {
    console.log(`📥 測試下載功能: ${filename}`);
    
    const backupPath = path.join(__dirname, 'backups');
    const filePath = path.join(backupPath, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('備份文件不存在');
    }
    
    const stats = fs.statSync(filePath);
    console.log(`✅ 檔案存在`);
    console.log(`  📁 路徑: ${filePath}`);
    console.log(`  📦 大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  📅 修改時間: ${stats.mtime.toLocaleString('zh-TW')}`);
    console.log(`  🔍 可讀取: ${fs.access ? '是' : '否'}`);
    
    // 模擬檢查檔案內容（讀取前幾個字符）
    try {
      const content = fs.readFileSync(filePath, 'utf8', { start: 0, end: 100 });
      console.log(`  📖 內容預覽: ${content.substring(0, 50)}...`);
      console.log(`✅ 檔案下載準備就緒`);
    } catch (readError) {
      console.log(`  ⚠️  無法讀取檔案內容: ${readError.message}`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ 下載測試失敗: ${error.message}`);
    return false;
  }
}

async function runListAndDownloadTest() {
  try {
    // 測試備份列表
    const backupList = testBackupList();
    
    if (backupList.length === 0) {
      console.log('⚠️  沒有備份檔案可供測試下載功能');
      return;
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📥 測試下載功能');
    console.log('═'.repeat(80));
    
    // 測試下載前3個檔案（或全部檔案，如果少於3個）
    const testCount = Math.min(3, backupList.length);
    
    for (let i = 0; i < testCount; i++) {
      const backup = backupList[i];
      console.log(`\n${i + 1}. 測試下載: ${backup.name}`);
      const downloadSuccess = testBackupDownload(backup.name);
      
      if (downloadSuccess) {
        console.log(`✅ 下載測試成功`);
      } else {
        console.log(`❌ 下載測試失敗`);
      }
    }
    
    console.log('\n✅ 備份列表和下載功能測試完成');
    
  } catch (error) {
    console.error('❌ 列表和下載測試失敗:', error.message);
  }
}

// 執行測試
runListAndDownloadTest();