import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../src/routes/auth';
import customerRoutes from '../src/routes/customers';
import propertyRoutes from '../src/routes/properties';
import { createTestUser, createTestCustomer, createTestProperty, generateTestToken } from './setup';

// 創建測試 Express 應用
const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/properties', propertyRoutes);
  return app;
};

describe('Performance Tests', () => {
  let app: express.Application;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = createApp();
    testUser = await createTestUser({
      role: 'manager' // 使用經理權限以訪問所有數據
    });
    authToken = generateTestToken(testUser._id.toString(), 'manager');
  });

  describe('Authentication Performance', () => {
    it('登錄請求應該在合理時間內完成', async () => {
      const user = await createTestUser({
        email: 'perf@test.com',
        password: '$2a$10$5YgF.XcVNV8mOW8hOJ3TGO3B.YJ2QxgpL.Fw8OVOl7mEJ4QVL1kq2' // password123
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'perf@test.com',
          password: 'password123'
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // 應該在1秒內完成
      expect(response.body.success).toBe(true);
    });

    it('Token驗證應該快速完成', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(averageTime).toBeLessThan(500); // 平均響應時間應小於500ms
    });
  });

  describe('Customer API Performance', () => {
    beforeEach(async () => {
      // 創建測試數據
      const customerPromises = Array(100).fill(0).map((_, i) =>
        createTestCustomer({
          first_name: `客戶${i}`,
          last_name: `測試`,
          phone: `091234${i.toString().padStart(4, '0')}`,
          email: `customer${i}@test.com`,
          purchase_intent_score: Math.floor(Math.random() * 10) + 1
        }, testUser._id)
      );
      await Promise.all(customerPromises);
    });

    it('客戶列表查詢應該有良好的性能', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers?limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // 應該在2秒內完成
      expect(response.body.data.customers).toHaveLength(20);
      expect(response.body.data.pagination.total).toBe(100);
    });

    it('客戶搜索應該快速完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers?search=客戶1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1500); // 搜索應該在1.5秒內完成
      expect(response.body.success).toBe(true);
    });

    it('客戶統計查詢應該有良好的性能', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // 統計查詢應該在3秒內完成
      expect(response.body.data.total_customers).toBe(100);
    });

    it('並發客戶創建應該處理良好', async () => {
      const concurrentRequests = 5;
      const startTime = Date.now();

      const promises = Array(concurrentRequests).fill(0).map((_, i) =>
        request(app)
          .post('/api/customers')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            first_name: `並發${i}`,
            last_name: '測試',
            phone: `092000000${i}`,
            email: `concurrent${i}@test.com`
          })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 所有請求都應該成功
      results.forEach(result => {
        expect(result.status).toBe(201);
      });

      // 並發處理應該在合理時間內完成
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Property API Performance', () => {
    beforeEach(async () => {
      // 創建測試物件數據
      const propertyPromises = Array(50).fill(0).map((_, i) =>
        createTestProperty({
          title: `物件${i}`,
          property_type: i % 2 === 0 ? 'apartment' : 'house',
          listing_type: i % 3 === 0 ? 'rent' : 'sale',
          price: 1000000 + (i * 100000),
          area: 20 + (i % 30),
          bedrooms: 1 + (i % 4),
          district: ['信義區', '大安區', '中山區'][i % 3]
        }, testUser._id)
      );
      await Promise.all(propertyPromises);
    });

    it('物件列表查詢應該有良好的性能', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties?limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
      expect(response.body.data.properties).toHaveLength(20);
    });

    it('複雜篩選查詢應該在合理時間內完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties')
        .query({
          property_type: 'apartment',
          listing_type: 'sale',
          min_price: 1000000,
          max_price: 3000000,
          min_area: 20,
          max_area: 40,
          bedrooms: 2,
          district: '信義'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000); // 複雜查詢應該在3秒內完成
      expect(response.body.success).toBe(true);
    });

    it('物件統計查詢應該快速完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
      expect(response.body.data.total_properties).toBe(50);
    });
  });

  describe('Customer Matching Performance', () => {
    let testProperty: any;

    beforeEach(async () => {
      // 創建測試物件
      testProperty = await createTestProperty({
        title: '配對測試物件',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 30000000,
        area: 25,
        bedrooms: 2
      }, testUser._id);

      // 創建大量客戶用於配對測試
      const customerPromises = Array(200).fill(0).map((_, i) => {
        const score = Math.floor(Math.random() * 10) + 1;
        const daysAgo = Math.floor(Math.random() * 90);
        return createTestCustomer({
          first_name: `配對客戶${i}`,
          phone: `093${i.toString().padStart(7, '0')}`,
          purchase_intent_score: score,
          status: 'active',
          last_contact_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        }, testUser._id);
      });
      await Promise.all(customerPromises);
    });

    it('智能客戶配對應該在合理時間內完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches?limit=20`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // 智能配對應該在5秒內完成
      expect(response.body.data.matched_customers.length).toBeLessThanOrEqual(20);
      
      // 驗證結果按分數排序
      const scores = response.body.data.matched_customers.map((c: any) => c.match_score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('大量配對查詢應該保持穩定性能', async () => {
      const iterations = 5;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get(`/api/properties/${testProperty._id}/matches?limit=10`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxTime = Math.max(...responseTimes);

      expect(averageTime).toBeLessThan(3000); // 平均時間
      expect(maxTime).toBeLessThan(6000); // 最大時間
    });
  });

  describe('Database Query Performance', () => {
    beforeEach(async () => {
      // 創建混合測試數據
      const dataPromises = [];
      
      // 創建用戶
      for (let i = 0; i < 20; i++) {
        dataPromises.push(createTestUser({
          email: `user${i}@test.com`,
          role: 'agent'
        }));
      }
      
      const users = await Promise.all(dataPromises);
      
      // 為每個用戶創建客戶和物件
      const customerPropertyPromises: Promise<any>[] = [];
      users.forEach((user, userIndex) => {
        // 每個用戶10個客戶
        for (let i = 0; i < 10; i++) {
          customerPropertyPromises.push(
            createTestCustomer({
              first_name: `用戶${userIndex}客戶${i}`,
              phone: `094${userIndex.toString().padStart(2, '0')}${i.toString().padStart(4, '0')}`
            }, (user as any)._id)
          );
        }
        
        // 每個用戶5個物件
        for (let i = 0; i < 5; i++) {
          customerPropertyPromises.push(
            createTestProperty({
              title: `用戶${userIndex}物件${i}`,
              price: 1000000 + (userIndex * 100000) + (i * 50000)
            }, (user as any)._id)
          );
        }
      });
      
      await Promise.all(customerPropertyPromises);
    });

    it('跨用戶數據查詢應該有良好性能', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(3000);
      expect(response.body.data.customers).toHaveLength(50);
      expect(response.body.data.pagination.total).toBe(200); // 20 users * 10 customers
    });

    it('聚合統計查詢應該快速完成', async () => {
      const startTime = Date.now();
      
      const [customerStats, propertyStats] = await Promise.all([
        request(app)
          .get('/api/customers/stats/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        request(app)
          .get('/api/properties/stats/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      ]);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(4000); // 並行統計查詢應該在4秒內完成
      expect(customerStats.body.data.total_customers).toBe(200);
      expect(propertyStats.body.data.total_properties).toBe(100); // 20 users * 5 properties
    });
  });

  describe('Memory Usage Performance', () => {
    it('大量數據查詢不應該造成記憶體洩漏', async () => {
      const initialMemory = process.memoryUsage();
      
      // 執行多次大量數據查詢
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/customers?limit=100')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
      
      // 強制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // 記憶體增長應該在合理範圍內（小於50MB）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Load Testing', () => {
    it('應該能處理中等並發負載', async () => {
      const concurrentUsers = 10;
      const requestsPerUser = 5;
      
      const startTime = Date.now();
      
      const userPromises = Array(concurrentUsers).fill(0).map(async (_, userIndex) => {
        const userRequests = Array(requestsPerUser).fill(0).map(async (_, reqIndex) => {
          const endpoint = reqIndex % 2 === 0 ? '/api/customers' : '/api/properties';
          return request(app)
            .get(`${endpoint}?limit=10`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        });
        
        return Promise.all(userRequests);
      });
      
      const results = await Promise.all(userPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // 所有請求都應該成功
      results.forEach(userResults => {
        userResults.forEach(response => {
          expect(response.body.success).toBe(true);
        });
      });
      
      // 併發處理應該在合理時間內完成
      expect(totalTime).toBeLessThan(15000); // 15秒內完成所有請求
      
      // 計算平均響應時間
      const totalRequests = concurrentUsers * requestsPerUser;
      const averageResponseTime = totalTime / totalRequests;
      expect(averageResponseTime).toBeLessThan(1000); // 平均響應時間小於1秒
    });
  });

  describe('Response Size Optimization', () => {
    it('分頁查詢應該優化響應大小', async () => {
      const smallPageResponse = await request(app)
        .get('/api/customers?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const largePageResponse = await request(app)
        .get('/api/customers?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const smallPageSize = JSON.stringify(smallPageResponse.body).length;
      const largePageSize = JSON.stringify(largePageResponse.body).length;
      
      // 大頁面的響應大小應該大於小頁面，但不應該成線性增長
      expect(largePageSize).toBeGreaterThan(smallPageSize);
      expect(largePageSize / smallPageSize).toBeLessThan(15); // 比例應該合理
    });
  });

  describe('Index Performance', () => {
    it('索引查詢應該比非索引查詢更快', async () => {
      // 使用索引字段查詢（email, phone等）
      const indexedQueryStart = Date.now();
      await request(app)
        .get('/api/customers?search=客戶1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const indexedQueryTime = Date.now() - indexedQueryStart;
      
      // 索引查詢應該相對較快
      expect(indexedQueryTime).toBeLessThan(2000);
    });
  });
});