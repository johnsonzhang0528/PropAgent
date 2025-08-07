import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { initializeSocket } from '../src/socket';
import authRoutes from '../src/routes/auth';
import customerRoutes from '../src/routes/customers';
import propertyRoutes from '../src/routes/properties';
import { createTestUser, createTestCustomer, createTestProperty, generateTestToken } from './setup';

// 創建完整的測試應用
const createTestApp = () => {
  const app = express();
  const server = createServer(app);
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  
  app.use('/api/auth', authRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/properties', propertyRoutes);
  
  const io = initializeSocket(server);
  
  return { app, server, io };
};

describe('PropAgent Pro Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let io: Server;
  let testUser: any;
  let authToken: string;
  let clientSocket: any;

  beforeAll(async () => {
    const testApp = createTestApp();
    app = testApp.app;
    server = testApp.server;
    io = testApp.io;
    
    // 啟動測試服務器
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // 創建測試用戶
    testUser = await createTestUser({
      email: 'integration@test.com',
      role: 'agent',
      first_name: 'Integration',
      last_name: 'Test'
    });
    authToken = generateTestToken(testUser._id.toString(), 'agent');
  });

  describe('完整用戶流程測試', () => {
    it('應該完成完整的用戶註冊、登錄和資料操作流程', async () => {
      // 1. 註冊新用戶
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'fullflow@test.com',
          password: 'password123',
          first_name: '完整',
          last_name: '測試',
          role: 'agent'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.token).toBeTruthy();

      // 2. 登錄用戶
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'fullflow@test.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.access_token).toBeTruthy();
      
      const userToken = loginResponse.body.data.access_token;

      // 3. 創建客戶
      const customerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          first_name: '流程',
          last_name: '客戶',
          phone: '0987654321',
          email: 'flowcustomer@test.com'
        });

      expect(customerResponse.status).toBe(201);
      const customerId = customerResponse.body.data.customer._id;

      // 4. 創建物件
      const propertyResponse = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          property_type: 'apartment',
          listing_type: 'sale',
          title: '流程測試物件',
          address: '台北市信義區信義路五段7號',
          price: 30000000,
          area: 25
        });

      expect(propertyResponse.status).toBe(201);
      const propertyId = propertyResponse.body.data.property._id;

      // 5. 查看客戶列表
      const customersResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(customersResponse.status).toBe(200);
      expect(customersResponse.body.data.customers.length).toBeGreaterThan(0);

      // 6. 查看物件列表
      const propertiesResponse = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${userToken}`);

      expect(propertiesResponse.status).toBe(200);
      expect(propertiesResponse.body.data.properties.length).toBeGreaterThan(0);

      // 7. 客戶匹配
      const matchResponse = await request(app)
        .get(`/api/properties/${propertyId}/matches`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(matchResponse.status).toBe(200);
      expect(matchResponse.body.data.property_id).toBe(propertyId);

      // 8. 更新客戶意願評分
      const scoreResponse = await request(app)
        .patch(`/api/customers/${customerId}/intent-score`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          score: 8,
          reason: '客戶表現出強烈購買意願'
        });

      expect(scoreResponse.status).toBe(200);
      expect(scoreResponse.body.data.new_score).toBe(8);

      // 9. 獲取統計數據
      const customerStatsResponse = await request(app)
        .get('/api/customers/stats/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(customerStatsResponse.status).toBe(200);
      expect(customerStatsResponse.body.data.total_customers).toBeGreaterThan(0);

      const propertyStatsResponse = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(propertyStatsResponse.status).toBe(200);
      expect(propertyStatsResponse.body.data.total_properties).toBeGreaterThan(0);
    });
  });

  describe('Socket.io 實時功能測試', () => {
    it('應該建立Socket.io連接並接收通知', (done) => {
      const port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: authToken
        }
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
      });

      clientSocket.on('welcome', (data: any) => {
        expect(data.message).toContain('PropAgent Pro');
        expect(data.user.name).toContain('Integration Test');
        done();
      });

      clientSocket.on('connect_error', (error: any) => {
        done(error);
      });
    });

    it('應該能夠訂閱和接收客戶更新', (done) => {
      const port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`, {
        auth: {
          token: authToken
        }
      });

      let connected = false;
      let subscribed = false;

      clientSocket.on('connect', () => {
        connected = true;
        
        // 訂閱客戶更新
        clientSocket.emit('customer:subscribe', 'test-customer-id');
        subscribed = true;

        // 模擬客戶更新事件
        setTimeout(() => {
          io.to('customer:test-customer-id').emit('customer:updated', {
            customer: { _id: 'test-customer-id', name: 'Test Customer' },
            changes: ['name'],
            timestamp: new Date().toISOString()
          });
        }, 100);
      });

      clientSocket.on('customer:updated', (data: any) => {
        expect(connected).toBe(true);
        expect(subscribed).toBe(true);
        expect(data.customer._id).toBe('test-customer-id');
        expect(data.changes).toContain('name');
        done();
      });
    });
  });

  describe('錯誤處理和邊界情況', () => {
    it('應該正確處理無效的認證令牌', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('應該正確處理不存在的資源', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const customerResponse = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(customerResponse.status).toBe(404);
      expect(customerResponse.body.error.code).toBe('CUSTOMER_NOT_FOUND');

      const propertyResponse = await request(app)
        .get(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(propertyResponse.status).toBe(404);
      expect(propertyResponse.body.error.code).toBe('PROPERTY_NOT_FOUND');
    });

    it('應該驗證必填字段', async () => {
      const incompleteCustomer = {
        first_name: '不完整'
        // 缺少 last_name 和 phone
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteCustomer);

      expect(response.status).toBe(500); // 資料庫驗證失敗
      expect(response.body.success).toBe(false);
    });

    it('應該處理重複資料', async () => {
      // 先創建一個客戶
      await createTestCustomer({ phone: '0912345678' }, testUser._id);

      // 嘗試創建重複手機號的客戶
      const duplicateResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: '重複',
          last_name: '客戶',
          phone: '0912345678'
        });

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.error.code).toBe('PHONE_EXISTS');
    });
  });

  describe('權限和安全性測試', () => {
    it('業務員應該只能查看自己的客戶', async () => {
      // 創建另一個業務員
      const otherAgent = await createTestUser({
        email: 'other@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent as any)._id.toString(), 'agent');

      // 為第一個業務員創建客戶
      const customer = await createTestCustomer({}, testUser._id);

      // 第二個業務員嘗試查看第一個業務員的客戶
      const response = await request(app)
        .get(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('應該正確實施角色權限', async () => {
      const customer = await createTestCustomer({}, testUser._id);

      // 業務員嘗試刪除客戶（應該被拒絕）
      const deleteResponse = await request(app)
        .delete(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('性能和負載測試', () => {
    it('應該能處理並發請求', async () => {
      const promises = Array(10).fill(0).map((_, index) =>
        request(app)
          .post('/api/customers')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            first_name: `並發${index}`,
            last_name: '測試',
            phone: `091234567${index}`
          })
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect([201, 400, 500]).toContain(result.status);
      });

      // 檢查成功創建的數量
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('分頁查詢應該有合理的響應時間', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers?page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // 2秒內
    });
  });

  describe('API 一致性測試', () => {
    it('所有成功響應都應該有一致的格式', async () => {
      const responses = await Promise.all([
        request(app).get('/api/customers').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/properties').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/customers/stats/overview').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/properties/stats/overview').set('Authorization', `Bearer ${authToken}`)
      ]);

      responses.forEach(response => {
        if (response.status === 200) {
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('data');
          expect(response.body.data).toBeDefined();
        }
      });
    });

    it('所有錯誤響應都應該有一致的格式', async () => {
      const errorResponses = await Promise.all([
        request(app).get('/api/customers').expect(401),
        request(app).get('/api/customers/nonexistent').set('Authorization', `Bearer ${authToken}`),
        request(app).post('/api/customers').set('Authorization', `Bearer ${authToken}`).send({})
      ]);

      errorResponses.forEach(response => {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        if (response.body.error) {
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');
        }
      });
    });
  });
});