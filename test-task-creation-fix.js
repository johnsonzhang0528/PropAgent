#!/usr/bin/env node

/**
 * 任務創建功能修復驗證腳本
 * 測試修復後的任務創建 API 是否正常工作
 */

// 使用內置 fetch API (Node.js 18+)

const API_BASE = 'http://localhost:3000/api';
const FRONTEND_BASE = 'http://localhost:5175';

// 測試配置
const TEST_USER = {
  email: 'admin@propagent.com',
  password: 'admin123'
};

const TEST_TASK = {
  title: '測試任務修復',
  description: '這是修復後的任務創建測試',
  priority: 'high',
  category: '其他', // 使用有效分類
  notes: '驗證修復是否成功'
};

let authToken = null;

async function login() {
  console.log('🔐 開始登錄...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    const result = await response.json();
    
    if (result.success) {
      authToken = result.data.access_token;
      console.log('✅ 登錄成功');
      console.log('👤 用戶:', result.data.user.email);
      console.log('🏢 公司ID:', result.data.user.company_id || '無');
      return true;
    } else {
      console.error('❌ 登錄失敗:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 登錄網絡錯誤:', error.message);
    return false;
  }
}

async function testTaskCreation() {
  if (!authToken) {
    console.error('❌ 無認證 token，跳過任務創建測試');
    return false;
  }

  console.log('\n🚀 開始測試任務創建...');
  
  try {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_TASK)
    });

    console.log('📊 響應狀態:', response.status, response.statusText);

    const result = await response.json();
    console.log('📥 響應數據:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ 任務創建成功！');
      console.log('📝 創建的任務:', {
        id: result.data.task._id,
        title: result.data.task.title,
        category: result.data.task.category,
        priority: result.data.task.priority,
        status: result.data.task.status
      });
      return result.data.task;
    } else {
      console.error('❌ 任務創建失敗:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 任務創建網絡錯誤:', error.message);
    return false;
  }
}

async function testTaskList() {
  if (!authToken) {
    console.error('❌ 無認證 token，跳過任務列表測試');
    return false;
  }

  console.log('\n📋 測試獲取任務列表...');
  
  try {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 任務列表獲取成功');
      console.log('📊 任務數量:', result.data.tasks.length);
      
      if (result.data.tasks.length > 0) {
        console.log('📝 最新任務:', {
          title: result.data.tasks[0].title,
          status: result.data.tasks[0].status,
          category: result.data.tasks[0].category
        });
      }
      
      return result.data.tasks;
    } else {
      console.error('❌ 任務列表獲取失敗:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 任務列表網絡錯誤:', error.message);
    return false;
  }
}

async function testTaskStats() {
  if (!authToken) {
    console.error('❌ 無認證 token，跳過統計測試');
    return false;
  }

  console.log('\n📈 測試任務統計...');
  
  try {
    const response = await fetch(`${API_BASE}/tasks/stats/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ 任務統計獲取成功');
      console.log('📊 統計數據:', result.data);
      return result.data;
    } else {
      console.error('❌ 任務統計獲取失敗:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ 任務統計網絡錯誤:', error.message);
    return false;
  }
}

async function checkBackendHealth() {
  console.log('🏥 檢查後端健康狀態...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    
    // 只要有響應就說明後端在運行
    if (response.status === 400 || response.status === 401 || response.status === 404) {
      console.log('✅ 後端服務正常運行');
      return true;
    } else {
      console.error('❌ 後端服務響應異常:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 無法連接到後端:', error.message);
    return false;
  }
}

async function checkFrontendHealth() {
  console.log('🌐 檢查前端健康狀態...');
  
  try {
    const response = await fetch(FRONTEND_BASE);
    
    if (response.ok) {
      console.log('✅ 前端服務正常運行');
      return true;
    } else {
      console.error('❌ 前端服務響應異常:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 無法連接到前端:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 PropAgent Pro - 任務創建功能修復驗證');
  console.log('='.repeat(50));
  
  // 健康檢查
  const backendHealthy = await checkBackendHealth();
  const frontendHealthy = await checkFrontendHealth();
  
  if (!backendHealthy) {
    console.log('\n❌ 後端服務未啟動，請先運行: npm run dev (在 backend 目錄)');
    return;
  }
  
  if (!frontendHealthy) {
    console.log('\n⚠️ 前端服務未啟動，建議運行: npm run dev (在 frontend 目錄)');
  }
  
  // 核心測試流程
  console.log('\n' + '='.repeat(30));
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ 登錄失敗，無法繼續測試');
    return;
  }
  
  const taskCreated = await testTaskCreation();
  const taskList = await testTaskList();
  const taskStats = await testTaskStats();
  
  // 測試結果總結
  console.log('\n' + '='.repeat(30));
  console.log('📋 測試結果總結:');
  console.log('='.repeat(30));
  
  console.log(`🔐 用戶登錄: ${loginSuccess ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`🚀 任務創建: ${taskCreated ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`📋 任務列表: ${taskList ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`📈 任務統計: ${taskStats ? '✅ 通過' : '❌ 失敗'}`);
  
  if (taskCreated && taskList && taskStats) {
    console.log('\n🎉 所有測試通過！任務創建功能修復成功！');
  } else {
    console.log('\n⚠️ 部分測試失敗，請檢查修復情況');
  }
  
  console.log('\n💡 提示: 現在可以訪問前端進行手動測試');
  console.log(`   前端地址: ${FRONTEND_BASE}`);
  console.log(`   測試路徑: ${FRONTEND_BASE}/#/tasks`);
}

// 運行測試
runTests().catch(console.error);