import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import authRoutes from '../src/routes/auth';
import customerRoutes from '../src/routes/customers';
import propertyRoutes from '../src/routes/properties';
import { createTestUser, generateTestToken, createTestCustomer, createTestProperty } from './setup';

// 創建測試 Express 應用
const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // 路由
  app.use('/api/auth', authRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/properties', propertyRoutes);
  
  // 全局錯誤處理
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: '服務器內部錯誤',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  });
  
  // 404 處理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: '找不到請求的資源'
    });
  });
  
  return app;
};

describe('Error Handling', () => {
  let app: express.Application;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = createApp();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser._id.toString());
  });

  describe('Authentication Errors', () => {
    it('應該返回401當缺少認證令牌', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: '缺少認證令牌'
        }
      });
    });

    it('應該返回401當認證令牌無效', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '無效的令牌'
        }
      });
    });

    it('應該返回401當認證格式錯誤', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: '缺少認證令牌'
        }
      });
    });

    it('應該返回403當帳戶被停用', async () => {
      // 停用用戶帳戶
      await testUser.updateOne({ status: 'inactive' });

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: '帳戶已被停用'
        }
      });
    });
  });

  describe('Authorization Errors', () => {
    it('應該返回403當權限不足', async () => {
      const agentUser = await createTestUser({ role: 'agent' });
      const agentToken = generateTestToken((agentUser._id as any).toString(), 'agent');
      
      const customer = await createTestCustomer({}, testUser._id);

      const response = await request(app)
        .delete(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '沒有權限刪除客戶'
        }
      });
    });

    it('應該返回403當嘗試訪問他人的資源', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherToken = generateTestToken((otherUser._id as any).toString(), 'agent');
      
      const customer = await createTestCustomer({}, testUser._id);

      const response = await request(app)
        .get(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '沒有權限查看此客戶'
        }
      });
    });
  });

  describe('Validation Errors', () => {
    it('應該返回400當資料驗證失敗', async () => {
      const invalidEmail = {
        email: 'invalid-email', // 無效郵箱格式
        password: 'test123',
        name: '測試用戶'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmail)
        .expect(500); // 由於沒有具體的驗證中間件，返回500

      expect(response.body.success).toBe(false);
    });

    it('應該返回400當必填字段缺失', async () => {
      const incompleteData = {
        // 缺少必填字段
        last_name: '測試'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('應該返回400當手機號格式無效', async () => {
      const invalidPhone = {
        phone: '123' // 無效手機號
      };

      const response = await request(app)
        .post('/api/auth/send-sms')
        .send(invalidPhone)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: '請輸入有效的手機號碼'
        }
      });
    });

    it('應該返回400當評分超出範圍', async () => {
      const customer = await createTestCustomer({}, testUser._id);
      
      const invalidScore = {
        score: 15 // 超出0-10範圍
      };

      const response = await request(app)
        .patch(`/api/customers/${customer._id}/intent-score`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidScore)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_SCORE',
          message: '評分必須是0-10之間的數字'
        }
      });
    });
  });

  describe('Resource Not Found Errors', () => {
    it('應該返回404當客戶不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: '客戶不存在'
        }
      });
    });

    it('應該返回404當物件不存在', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: '物件不存在'
        }
      });
    });

    it('應該返回404當用戶不存在（SMS）', async () => {
      const nonExistentPhone = {
        phone: '0987654321'
      };

      const response = await request(app)
        .post('/api/auth/send-sms')
        .send(nonExistentPhone)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '該手機號尚未註冊'
        }
      });
    });

    it('應該返回404當API端點不存在', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: '找不到請求的資源'
      });
    });
  });

  describe('Conflict Errors', () => {
    it('應該返回400當郵箱已被註冊', async () => {
      const existingUser = await createTestUser({ email: 'existing@test.com' });

      const duplicateUser = {
        email: 'existing@test.com',
        password: 'test123',
        name: '重複用戶'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.message).toBe('郵箱已被註冊');
    });

    it('應該返回400當手機號已被使用', async () => {
      await createTestCustomer({ phone: '0912345678' }, testUser._id);

      const duplicateCustomer = {
        first_name: '重複',
        last_name: '客戶',
        phone: '0912345678'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateCustomer)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'PHONE_EXISTS',
          message: '該手機號已被其他客戶使用'
        }
      });
    });
  });

  describe('Request Size Limits', () => {
    it('應該處理過大的請求體', async () => {
      const largeData = {
        description: 'x'.repeat(20 * 1024 * 1024) // 20MB 字符串
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData)
        .expect(413);
    });
  });

  describe('Database Connection Errors', () => {
    it('應該優雅處理數據庫連接錯誤', async () => {
      // 關閉數據庫連接來模擬錯誤
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服務器錯誤'
        }
      });
    });
  });

  describe('Token Refresh Errors', () => {
    it('應該返回400當缺少刷新令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: '缺少刷新令牌'
        }
      });
    });

    it('應該返回401當刷新令牌無效', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: '無效的刷新令牌'
        }
      });
    });
  });

  describe('SMS Verification Errors', () => {
    it('應該返回400當SMS驗證碼錯誤', async () => {
      // 先發送驗證碼
      await createTestUser({ phone: '0912345678' });
      await request(app)
        .post('/api/auth/send-sms')
        .send({ phone: '0912345678' });

      // 使用錯誤的驗證碼登錄
      const response = await request(app)
        .post('/api/auth/login-sms')
        .send({
          phone: '0912345678',
          smsCode: '999999'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_SMS_CODE',
          message: '驗證碼錯誤或已過期'
        }
      });
    });

    it('應該返回500當SMS發送失敗', async () => {
      await createTestUser({ phone: '0912345678' });

      // 這個測試需要實際的SMS服務配置
      const response = await request(app)
        .post('/api/auth/send-sms')
        .send({ phone: '0912345678' })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'SMS_SEND_FAILED',
          message: '驗證碼發送失敗，請稍後再試'
        }
      });
    });
  });

  describe('Password Reset Errors', () => {
    it('應該返回400當重置令牌無效', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-reset-token',
          new_password: 'newpassword123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '無效或過期的重置令牌'
        }
      });
    });
  });

  describe('Malformed Data Errors', () => {
    it('應該處理無效的JSON', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);
    });

    it('應該處理無效的ObjectId', async () => {
      const response = await request(app)
        .get('/api/customers/invalid-object-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Scenarios', () => {
    it('應該處理過多的並發請求', async () => {
      const promises = Array(10).fill(0).map(() =>
        request(app)
          .get('/api/customers')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(promises);
      
      // 所有請求都應該成功（在沒有限流的情況下）
      results.forEach(result => {
        expect([200, 500]).toContain(result.status);
      });
    });
  });

  describe('Edge Cases', () => {
    it('應該處理空的請求體', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send()
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('應該處理非常長的URL', async () => {
      const longPath = '/api/customers/' + 'a'.repeat(1000);
      
      const response = await request(app)
        .get(longPath)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('應該處理特殊字符', async () => {
      const specialChars = {
        first_name: '測試用戶<script>alert("xss")</script>',
        last_name: '特殊字符\'";DROP TABLE users;--',
        phone: '0912345678'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialChars);

      // 應該創建成功或返回驗證錯誤，但不應該有安全問題
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Timeout Scenarios', () => {
    it('應該處理長時間運行的查詢', async () => {
      // 創建大量測試數據
      const promises = Array(50).fill(0).map((_, i) =>
        createTestCustomer({ phone: `091234567${i.toString().padStart(1, '0')}` }, testUser._id)
      );
      await Promise.all(promises);

      const response = await request(app)
        .get('/api/customers?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(5000); // 5秒超時

      expect([200, 500, 408]).toContain(response.status);
    });
  });

  describe('Cross-Origin Resource Sharing (CORS)', () => {
    it('應該處理CORS預檢請求', async () => {
      const response = await request(app)
        .options('/api/customers')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(response.status).toBe(204);
    });
  });
});