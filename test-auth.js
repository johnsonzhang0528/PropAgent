const axios = require('axios');

async function testAuth() {
  try {
    // 登入獲取 token
    console.log('嘗試登入...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.access_token;
      console.log('登入成功，獲得 token');
      
      // 測試分析 API
      console.log('\n測試分析 API...');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 測試客戶統計
      try {
        const customerStats = await axios.get('http://localhost:3000/api/analytics/customer-stats', { headers });
        console.log('客戶統計:', customerStats.data);
      } catch (error) {
        console.error('客戶統計錯誤:', error.response?.data || error.message);
      }

      // 測試客戶狀態分布
      try {
        const statusDist = await axios.get('http://localhost:3000/api/analytics/customer-status-distribution', { headers });
        console.log('客戶狀態分布:', statusDist.data);
      } catch (error) {
        console.error('狀態分布錯誤:', error.response?.data || error.message);
      }

      // 測試購買意願分布
      try {
        const intentDist = await axios.get('http://localhost:3000/api/analytics/purchase-intent-distribution', { headers });
        console.log('購買意願分布:', intentDist.data);
      } catch (error) {
        console.error('意願分布錯誤:', error.response?.data || error.message);
      }

    } else {
      console.log('登入失敗:', loginResponse.data);
    }
  } catch (error) {
    console.error('登入錯誤:', error.response?.data || error.message);
  }
}

testAuth();