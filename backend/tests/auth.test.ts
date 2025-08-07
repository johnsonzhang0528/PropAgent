import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { User } from '../src/models/User';
import authRoutes from '../src/routes/auth';
import { createTestUser, generateTestToken } from './setup';

// 創建測試 Express 應用
const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('應該成功註冊新用戶', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: '新用戶',
        role: 'agent'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', '註冊成功');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: userData.role
      });

      // 驗證用戶已保存到數據庫
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser!.email).toBe(userData.email);
    });

    it('應該拒絕已存在的郵箱', async () => {
      // 先創建一個用戶
      await createTestUser({ email: 'existing@test.com' });

      const userData = {
        email: 'existing@test.com',
        password: 'password123',
        name: '重複用戶'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', '郵箱已被註冊');
    });

    it('應該驗證必填字段', async () => {
      const incompleteData = {
        email: 'test@test.com'
        // 缺少 password 和 name
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(500);

      expect(response.body).toHaveProperty('message', '服務器錯誤');
    });

    it('應該加密密碼', async () => {
      const userData = {
        email: 'encrypted@test.com',
        password: 'plaintext123',
        name: '加密測試'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser!.password).not.toBe(userData.password);
      expect(savedUser!.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@test.com',
        password: '$2a$10$5YgF.XcVNV8mOW8hOJ3TGO3B.YJ2QxgpL.Fw8OVOl7mEJ4QVL1kq2', // password123
        first_name: '登錄',
        last_name: '測試'
      });
    });

    it('應該成功登錄有效用戶', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data).toHaveProperty('expires_in');
      expect(response.body.data.user).toMatchObject({
        email: testUser.email,
        role: testUser.role
      });
    });

    it('應該拒絕錯誤密碼', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('郵箱或密碼錯誤');
    });

    it('應該拒絕不存在的用戶', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('應該拒絕被停用的用戶', async () => {
      // 停用用戶
      await User.findByIdAndUpdate(testUser._id, { status: 'inactive' });

      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
    });

    it('應該更新最後登錄時間', async () => {
      const oldLoginTime = testUser.last_login_at;

      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser!.last_login_at).not.toEqual(oldLoginTime);
      expect(new Date(updatedUser!.last_login_at!)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/auth/send-sms', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        phone: '0912345678',
        email: 'sms@test.com'
      });
    });

    it('應該發送SMS驗證碼給存在的手機號', async () => {
      const smsData = {
        phone: '0912345678'
      };

      const response = await request(app)
        .post('/api/auth/send-sms')
        .send(smsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', '驗證碼已發送');
      expect(response.body.data).toHaveProperty('expires_in', 300);
    });

    it('應該拒絕無效的手機號格式', async () => {
      const smsData = {
        phone: '123456789' // 無效格式
      };

      const response = await request(app)
        .post('/api/auth/send-sms')
        .send(smsData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });

    it('應該拒絕未註冊的手機號', async () => {
      const smsData = {
        phone: '0987654321' // 未註冊的手機號
      };

      const response = await request(app)
        .post('/api/auth/send-sms')
        .send(smsData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('POST /api/auth/login-sms', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        phone: '0912345678',
        email: 'smslogin@test.com'
      });
      
      // 模擬發送驗證碼
      await request(app)
        .post('/api/auth/send-sms')
        .send({ phone: '0912345678' });
    });

    it('應該拒絕無效的驗證碼', async () => {
      const loginData = {
        phone: '0912345678',
        smsCode: '999999' // 錯誤的驗證碼
      };

      const response = await request(app)
        .post('/api/auth/login-sms')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SMS_CODE');
    });

    it('應該拒絕無效的手機號', async () => {
      const loginData = {
        phone: '123456789', // 無效格式
        smsCode: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login-sms')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser._id.toString(), testUser.role);
    });

    it('應該返回當前用戶信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', testUser._id.toString());
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('應該拒絕無 token 的請求', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('應該拒絕無效 token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('應該拒絕缺少刷新令牌的請求', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REFRESH_TOKEN');
    });

    it('應該拒絕無效的刷新令牌', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({ email: 'forgot@test.com' });
    });

    it('應該為存在的郵箱發送重置密碼指令', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('重置密碼郵件');
    });

    it('應該為不存在的郵箱返回相同響應（安全考量）', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('重置密碼郵件');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('應該拒絕無效的重置令牌', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          new_password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Error Handling', () => {
    it('應該處理數據庫連接錯誤', async () => {
      // 暫時斷開數據庫連接
      await require('mongoose').connection.close();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});