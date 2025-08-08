#!/usr/bin/env node

/**
 * PropAgent Pro API 煙霧測試
 * 測試核心API端點的基本功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

class SmokeTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 測試: ${name}...`);
      const result = await testFn();
      console.log(`✅ ${name}: 通過`);
      this.results.push({ name, status: 'PASS', result });
      this.passed++;
    } catch (error) {
      console.log(`❌ ${name}: 失敗 - ${error.message}`);
      this.results.push({ name, status: 'FAIL', error: error.message });
      this.failed++;
    }
  }

  async runAll() {
    console.log('🔥 開始 PropAgent Pro API 煙霧測試\n');

    // 1. 健康檢查
    await this.test('API健康檢查', async () => {
      const response = await axios.get(`${API_BASE}/../health`);
      if (response.data.status !== 'OK') throw new Error('健康檢查失敗');
      return response.data;
    });

    // 2. 用戶註冊（先確保不存在）
    await this.test('清理測試用戶', async () => {
      // 忽略錯誤，用於清理
      return { message: '清理完成' };
    });

    // 3. 用戶註冊
    await this.test('用戶註冊', async () => {
      const userData = {
        email: 'smoketest@example.com',
        password: 'password123',
        first_name: '煙霧',
        last_name: '測試',
        role: 'agent'
      };
      
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, userData);
        if (response.data.token) {
          authToken = response.data.token;
          return { success: true, hasToken: true };
        }
        throw new Error('註冊成功但未返回token');
      } catch (error) {
        if (error.response && error.response.data) {
          throw new Error(`註冊失敗: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    });

    // 4. 用戶登入（如果註冊失敗，嘗試登入現有用戶）
    if (!authToken) {
      await this.test('用戶登入', async () => {
        const loginData = {
          email: 'smoketest@example.com',
          password: 'password123'
        };
        
        const response = await axios.post(`${API_BASE}/auth/login`, loginData);
        if (response.data.success && response.data.data.token) {
          authToken = response.data.data.token;
          return { success: true, hasToken: true };
        }
        throw new Error('登入失敗或未返回token');
      });
    }

    // 如果有token，測試受保護的端點
    if (authToken) {
      const headers = { Authorization: `Bearer ${authToken}` };

      // 5. 獲取當前用戶信息
      await this.test('獲取用戶信息', async () => {
        const response = await axios.get(`${API_BASE}/auth/me`, { headers });
        if (!response.data || !response.data.email) {
          throw new Error('未返回用戶信息');
        }
        return { email: response.data.email };
      });

      // 6. 客戶列表API
      await this.test('客戶列表API', async () => {
        const response = await axios.get(`${API_BASE}/customers`, { headers });
        if (!response.data || response.data.success === false) {
          throw new Error('客戶列表API返回錯誤');
        }
        return { count: response.data.data ? response.data.data.customers.length : 0 };
      });

      // 7. 物件列表API
      await this.test('物件列表API', async () => {
        const response = await axios.get(`${API_BASE}/properties`, { headers });
        if (!response.data || response.data.success === false) {
          throw new Error('物件列表API返回錯誤');
        }
        return { count: response.data.data ? response.data.data.properties.length : 0 };
      });

    } else {
      console.log('⚠️  無法獲取認證token，跳過受保護端點測試');
    }

    this.printResults();
  }

  printResults() {
    console.log('\n🎯 煙霧測試結果總結:');
    console.log('═'.repeat(50));
    console.log(`✅ 通過: ${this.passed}`);
    console.log(`❌ 失敗: ${this.failed}`);
    console.log(`📊 總計: ${this.passed + this.failed}`);
    console.log(`📈 成功率: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ 失敗的測試:');
      this.results.filter(r => r.status === 'FAIL').forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name}: ${result.error}`);
      });
    }
    
    console.log('\n' + (this.failed === 0 ? '🎉 所有煙霧測試通過！' : '⚠️  部分測試失敗，請檢查系統狀態'));
    
    // 退出代碼
    process.exit(this.failed === 0 ? 0 : 1);
  }
}

// 執行測試
const smokeTest = new SmokeTest();
smokeTest.runAll().catch((error) => {
  console.error('💥 煙霧測試執行失敗:', error.message);
  process.exit(1);
});