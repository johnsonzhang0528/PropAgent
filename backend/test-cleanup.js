const fs = require('fs');
const path = require('path');

async function testCleanup(retentionDays = 30) {
  try {
    const backupPath = path.join(__dirname, 'backups');
    
    if (!fs.existsSync(backupPath)) {
      console.log('📁 備份目錄不存在，無需清理');
      return;
    }
    
    console.log(`🧹 開始清理過期備份（保留天數: ${retentionDays} 天）`);
    console.log(`📂 備份目錄: ${backupPath}`);
    
    const files = fs.readdirSync(backupPath);
    console.log(`📄 找到檔案: ${files.length} 個`);
    
    if (files.length === 0) {
      console.log('📭 沒有檔案需要清理');
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`⏰ 截止日期: ${cutoffDate.toLocaleString('zh-TW')}`);
    console.log(`\n📋 檔案檢查:`);

    let deletedCount = 0;
    let totalSize = 0;
    let deletedSize = 0;

    for (const file of files) {
      const filePath = path.join(backupPath, file);
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      totalSize += fileSize;
      
      const isExpired = stats.mtime < cutoffDate;
      const statusIcon = isExpired ? '🗑️' : '✅';
      const sizeStr = (fileSize / 1024).toFixed(2) + ' KB';
      
      console.log(`  ${statusIcon} ${file}`);
      console.log(`    📅 修改時間: ${stats.mtime.toLocaleString('zh-TW')}`);
      console.log(`    📦 大小: ${sizeStr}`);
      console.log(`    ${isExpired ? '❌ 已過期，將刪除' : '⏳ 未過期，保留'}`);
      
      if (isExpired) {
        try {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
          deletedSize += fileSize;
          console.log(`    ✅ 已刪除`);
        } catch (deleteError) {
          console.log(`    ❌ 刪除失敗: ${deleteError.message}`);
        }
      }
      console.log('');
    }

    console.log(`\n📊 清理統計:`);
    console.log(`  - 總檔案數: ${files.length} 個`);
    console.log(`  - 刪除檔案: ${deletedCount} 個`);
    console.log(`  - 保留檔案: ${files.length - deletedCount} 個`);
    console.log(`  - 總大小: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`  - 釋放空間: ${(deletedSize / 1024).toFixed(2)} KB`);
    
    if (deletedCount > 0) {
      console.log(`✅ 清理完成，釋放了 ${(deletedSize / 1024).toFixed(2)} KB 空間`);
    } else {
      console.log(`📝 無需清理，所有檔案都在保留期限內`);
    }

  } catch (error) {
    console.error('❌ 清理失敗:', error.message);
    throw error;
  }
}

async function createTestOldFiles() {
  try {
    console.log('🧪 創建測試用的舊檔案...');
    
    const backupPath = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // 創建一些"舊"的測試檔案
    const testFiles = [
      {
        name: 'old-backup-1.json',
        content: '{"test": "old backup 1"}',
        daysOld: 40 // 比預設保留期（30天）還舊
      },
      {
        name: 'old-backup-2.json',
        content: '{"test": "old backup 2"}',
        daysOld: 35
      },
      {
        name: 'recent-backup.json',
        content: '{"test": "recent backup"}',
        daysOld: 5 // 比預設保留期新
      }
    ];
    
    for (const testFile of testFiles) {
      const filePath = path.join(backupPath, testFile.name);
      fs.writeFileSync(filePath, testFile.content);
      
      // 修改檔案時間，讓它看起來像舊檔案
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - testFile.daysOld);
      fs.utimesSync(filePath, oldDate, oldDate);
      
      console.log(`  📄 ${testFile.name} (${testFile.daysOld} 天前)`);
    }
    
    console.log('✅ 測試檔案創建完成\n');
    
  } catch (error) {
    console.error('❌ 創建測試檔案失敗:', error.message);
    throw error;
  }
}

async function runCleanupTest() {
  try {
    // 先創建一些測試用的舊檔案
    await createTestOldFiles();
    
    // 顯示清理前的狀態
    console.log('📋 清理前的備份目錄內容:');
    const backupPath = path.join(__dirname, 'backups');
    const filesBefore = fs.readdirSync(backupPath);
    filesBefore.forEach(file => {
      const filePath = path.join(backupPath, file);
      const stats = fs.statSync(filePath);
      console.log(`  📄 ${file} - ${stats.mtime.toLocaleString('zh-TW')}`);
    });
    console.log('');
    
    // 執行清理（預設保留30天）
    await testCleanup(30);
    
    // 顯示清理後的狀態
    console.log('\n📋 清理後的備份目錄內容:');
    const filesAfter = fs.readdirSync(backupPath);
    if (filesAfter.length > 0) {
      filesAfter.forEach(file => {
        const filePath = path.join(backupPath, file);
        const stats = fs.statSync(filePath);
        console.log(`  📄 ${file} - ${stats.mtime.toLocaleString('zh-TW')}`);
      });
    } else {
      console.log('  📭 目錄為空');
    }
    
  } catch (error) {
    console.error('❌ 清理測試失敗:', error.message);
  }
}

// 執行清理測試
runCleanupTest();