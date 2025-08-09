#!/usr/bin/env node

const http = require('http');

// 首先登錄獲取token
const loginData = {
  email: "admin@propagent.com",
  password: "admin123"
};

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testTaskCreation() {
  try {
    console.log('🔐 步驟1: 用戶登錄...');
    
    // 登錄請求
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log(`📊 登錄狀態碼: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ 登錄失敗:', loginResponse.data);
      return;
    }
    
    const loginResult = JSON.parse(loginResponse.data);
    const token = loginResult.data?.access_token || loginResult.token;
    
    if (!token) {
      console.log('❌ 未獲取到token:', loginResponse.data);
      return;
    }
    
    console.log('✅ 登錄成功，獲取到token');
    
    // 測試任務創建
    console.log('🧪 步驟2: 創建任務...');
    
    const taskData = {
      title: "API測試任務",
      description: "通過API創建的測試任務",
      category: "預約",
      priority: "medium",
      notes: "這是一個測試備註"
    };
    
    const taskOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const taskResponse = await makeRequest(taskOptions, taskData);
    console.log(`📊 任務創建狀態碼: ${taskResponse.statusCode}`);
    
    const taskResult = JSON.parse(taskResponse.data);
    console.log('📥 任務創建響應:', JSON.stringify(taskResult, null, 2));
    
    if (taskResponse.statusCode === 201) {
      console.log('✅ 任務創建成功！');
    } else {
      console.log('❌ 任務創建失敗');
      console.log('❗ 錯誤信息:', taskResult.message || taskResult.error?.message);
    }
    
  } catch (error) {
    console.log('❌ 測試過程中發生錯誤:', error.message);
  }
}

testTaskCreation();