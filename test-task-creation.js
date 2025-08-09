#!/usr/bin/env node

const http = require('http');

// 測試數據
const testData = {
  title: "測試任務創建",
  description: "這是一個用來測試任務創建功能的測試任務",
  category: "預約", 
  priority: "medium",
  notes: "測試備註"
};

// 模擬請求
const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token'
  }
};

console.log('🧪 測試任務創建API...');
console.log('📤 請求數據:', testData);

const req = http.request(options, (res) => {
  console.log(`📊 狀態碼: ${res.statusCode}`);
  console.log(`📋 響應頭:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📥 響應數據:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 201) {
        console.log('✅ 任務創建測試成功');
      } else {
        console.log('❌ 任務創建測試失敗');
        console.log('❗ 錯誤信息:', response.message || response.error?.message);
      }
    } catch (error) {
      console.log('❌ 解析響應失敗:', error.message);
      console.log('🔍 原始響應:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 請求錯誤:', error.message);
});

req.write(postData);
req.end();