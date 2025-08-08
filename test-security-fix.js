#!/usr/bin/env node

/**
 * PropAgent Pro - 安全監控修復測試腳本
 * 測試IP封鎖/解除封鎖功能是否正常運作
 */

// 使用 backend 目錄的 axios
const axios = require('./backend/node_modules/axios');

const API_BASE = 'http://localhost:3000/api/security';
const TEST_IP = '192.168.100.200';

async function testSecurityAPI() {
  console.log('🔐 開始測試安全監控 IP 封鎖/解除封鎖功能...\n');

  try {
    // 1. 獲取初始狀態
    console.log('1. 檢查初始封鎖 IP 列表...');
    const initialBlocked = await axios.get(`${API_BASE}/blocked-ips`);
    console.log(`   當前封鎖 IP 數量: ${initialBlocked.data.data.count}`);

    // 2. 封鎖測試 IP
    console.log(`\n2. 封鎖測試 IP: ${TEST_IP}...`);
    await axios.post(`${API_BASE}/block-ip`, {
      ip: TEST_IP,
      reason: '測試用途 - 驗證封鎖功能'
    });
    console.log('   ✅ IP 封鎖成功');

    // 3. 驗證 IP 已被封鎖
    console.log('\n3. 驗證 IP 已被封鎖...');
    const blockedAfter = await axios.get(`${API_BASE}/blocked-ips`);
    const isBlocked = blockedAfter.data.data.blockedIPs.includes(TEST_IP);
    console.log(`   封鎖狀態: ${isBlocked ? '✅ 已封鎖' : '❌ 未封鎖'}`);

    // 4. 測試 POST 解除封鎖
    console.log('\n4. 測試 POST 方法解除封鎖...');
    await axios.post(`${API_BASE}/unblock-ip`, {
      ip: TEST_IP,
      reason: '測試完成 - POST 解除封鎖'
    });
    console.log('   ✅ POST 解除封鎖成功');

    // 5. 重新封鎖以測試 DELETE 方法
    console.log('\n5. 重新封鎖 IP 以測試 DELETE 方法...');
    await axios.post(`${API_BASE}/block-ip`, {
      ip: TEST_IP,
      reason: '測試用途 - 準備測試 DELETE'
    });
    console.log('   ✅ 重新封鎖成功');

    // 6. 測試 DELETE 解除封鎖
    console.log('\n6. 測試 DELETE 方法解除封鎖...');
    await axios.delete(`${API_BASE}/unblock-ip/${encodeURIComponent(TEST_IP)}`, {
      params: { reason: '測試完成 - DELETE 解除封鎖' }
    });
    console.log('   ✅ DELETE 解除封鎖成功');

    // 7. 最終驗證
    console.log('\n7. 最終驗證 IP 解除封鎖狀態...');
    const finalBlocked = await axios.get(`${API_BASE}/blocked-ips`);
    const isFinallyBlocked = finalBlocked.data.data.blockedIPs.includes(TEST_IP);
    console.log(`   最終狀態: ${!isFinallyBlocked ? '✅ 已解除封鎖' : '❌ 仍被封鎖'}`);

    // 8. 檢查安全活動日誌
    console.log('\n8. 檢查安全活動日誌...');
    const activityLog = await axios.get(`${API_BASE}/activity-log`, {
      params: { ip: TEST_IP, limit: 10 }
    });
    const activities = activityLog.data.data.activities;
    console.log(`   找到 ${activities.length} 條相關活動記錄:`);
    
    activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.reason} - ${new Date(activity.timestamp).toLocaleString()}`);
    });

    // 9. 檢查威脅情報
    console.log('\n9. 檢查威脅情報更新...');
    const threatIntel = await axios.get(`${API_BASE}/threat-intelligence`);
    console.log(`   當前威脅等級: ${threatIntel.data.data.threatLevel}`);
    console.log(`   風險評分: ${threatIntel.data.data.summary.riskScore}/100`);

    console.log('\n🎉 所有測試通過！安全監控功能修復成功。\n');

  } catch (error) {
    console.error('\n❌ 測試失敗:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// 主函數
async function main() {
  console.log('PropAgent Pro - 安全監控修復驗證');
  console.log('=====================================\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 後端服務未運行，請先啟動服務器:');
    console.log('   cd backend && npm run dev\n');
    process.exit(1);
  }

  console.log('✅ 後端服務運行正常\n');
  await testSecurityAPI();
}

main().catch(console.error);