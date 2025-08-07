import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Customer } from '../src/models/Customer';
import customerRoutes from '../src/routes/customers';
import { authMiddleware } from '../src/middleware/auth';
import { createTestUser, createTestCustomer, generateTestToken } from './setup';

// 創建測試 Express 應用
const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/customers', customerRoutes);
  return app;
};

describe('Customer Management API', () => {
  let app: express.Application;
  let testAgent: any;
  let testManager: any;
  let testAdmin: any;
  let agentToken: string;
  let managerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    app = createApp();
    
    // 創建測試用戶
    testAgent = await createTestUser({
      email: 'agent@test.com',
      role: 'agent',
      first_name: '業務',
      last_name: '員工'
    });
    
    testManager = await createTestUser({
      email: 'manager@test.com',
      role: 'manager',
      first_name: '經理',
      last_name: '用戶'
    });
    
    testAdmin = await createTestUser({
      email: 'admin@test.com',
      role: 'admin',
      first_name: '管理',
      last_name: '員'
    });

    // 生成認證 token
    agentToken = generateTestToken(testAgent._id.toString(), 'agent');
    managerToken = generateTestToken(testManager._id.toString(), 'manager');
    adminToken = generateTestToken(testAdmin._id.toString(), 'admin');
  });

  describe('GET /api/customers', () => {
    beforeEach(async () => {
      // 創建測試客戶
      await createTestCustomer({ 
        first_name: '張', 
        last_name: '三',
        phone: '0912345678'
      }, testAgent._id);
      
      await createTestCustomer({ 
        first_name: '李', 
        last_name: '四',
        phone: '0923456789'
      }, testAgent._id);
      
      await createTestCustomer({ 
        first_name: '王', 
        last_name: '五',
        phone: '0934567890'
      }, testManager._id);
    });

    it('業務員應該只能查看自己的客戶', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      
      // 驗證返回的客戶都屬於該業務員
      response.body.data.customers.forEach((customer: any) => {
        expect(customer.agent_id._id).toBe(testAgent._id.toString());
      });
    });

    it('經理應該能查看所有客戶', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('應該支持分頁查詢', async () => {
      const response = await request(app)
        .get('/api/customers?page=1&limit=1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.customers).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 3,
        total_pages: 3
      });
    });

    it('應該支持搜索功能', async () => {
      const response = await request(app)
        .get('/api/customers?search=張')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.customers).toHaveLength(1);
      expect(response.body.data.customers[0].first_name).toBe('張');
    });

    it('應該支持狀態篩選', async () => {
      // 創建一個非活躍客戶
      await createTestCustomer({ 
        first_name: '非活躍',
        status: 'inactive',
        phone: '0945678901'
      }, testAgent._id);

      const response = await request(app)
        .get('/api/customers?status=active')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.data.customers).toHaveLength(2);
      response.body.data.customers.forEach((customer: any) => {
        expect(customer.status).toBe('active');
      });
    });

    it('應該支持按業務員篩選（經理權限）', async () => {
      const response = await request(app)
        .get(`/api/customers?agent_id=${testAgent._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.customers).toHaveLength(2);
      response.body.data.customers.forEach((customer: any) => {
        expect(customer.agent_id._id).toBe(testAgent._id.toString());
      });
    });

    it('應該拒絕未認證的請求', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/customers/:id', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await createTestCustomer({
        first_name: '詳情',
        last_name: '測試',
        phone: '0956789012'
      }, testAgent._id);
    });

    it('應該返回客戶詳細信息', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toMatchObject({
        _id: testCustomer._id.toString(),
        first_name: '詳情',
        last_name: '測試',
        phone: '0956789012'
      });
    });

    it('應該拒絕無權限的業務員查看他人客戶', async () => {
      const otherAgent = await createTestUser({
        email: 'other@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent._id as any).toString(), 'agent');

      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('經理應該能查看任何客戶', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('應該返回404當客戶不存在', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CUSTOMER_NOT_FOUND');
    });
  });

  describe('POST /api/customers', () => {
    const newCustomerData = {
      first_name: '新',
      last_name: '客戶',
      phone: '0967890123',
      email: 'new@customer.com',
      gender: 'male',
      age: 30,
      occupation: '工程師',
      annual_income: 1000000,
      source: 'website',
      tags: ['高意願', 'VIP'],
      notes: '這是一個測試客戶'
    };

    it('應該成功創建新客戶', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newCustomerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toMatchObject({
        first_name: '新',
        last_name: '客戶',
        phone: '0967890123',
        email: 'new@customer.com'
      });

      // 驗證客戶已保存到數據庫
      const savedCustomer = await Customer.findById(response.body.data.customer._id);
      expect(savedCustomer).toBeTruthy();
      expect(savedCustomer!.agent_id.toString()).toBe(testAgent._id.toString());
    });

    it('應該拒絕重複的手機號', async () => {
      // 先創建一個客戶
      await createTestCustomer({ phone: '0967890123' }, testAgent._id);

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newCustomerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_EXISTS');
    });

    it('應該自動設置業務員ID', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newCustomerData)
        .expect(201);

      expect(response.body.data.customer.agent_id._id).toBe(testAgent._id.toString());
    });

    it('應該設置默認值', async () => {
      const minimalData = {
        first_name: '最小',
        last_name: '數據',
        phone: '0978901234'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(minimalData)
        .expect(201);

      expect(response.body.data.customer).toMatchObject({
        status: 'active',
        tags: [],
        purchase_intent_score: undefined // 默認沒有評分
      });
    });
  });

  describe('PUT /api/customers/:id', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await createTestCustomer({
        first_name: '更新',
        last_name: '測試',
        phone: '0989012345'
      }, testAgent._id);
    });

    it('應該成功更新客戶信息', async () => {
      const updateData = {
        first_name: '已更新',
        annual_income: 1500000,
        notes: '更新後的備註'
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer).toMatchObject({
        first_name: '已更新',
        annual_income: 1500000,
        notes: '更新後的備註'
      });
    });

    it('應該拒絕更新為重複的手機號', async () => {
      // 創建另一個客戶
      await createTestCustomer({ phone: '0990123456' }, testAgent._id);

      const updateData = {
        phone: '0990123456' // 嘗試更新為已存在的手機號
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PHONE_EXISTS');
    });

    it('應該拒絕無權限的用戶更新', async () => {
      const otherAgent = await createTestUser({
        email: 'other2@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent._id as any).toString(), 'agent');

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ first_name: '非法更新' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('應該忽略不允許修改的字段', async () => {
      const updateData = {
        agent_id: testManager._id, // 不允許修改
        company_id: 'fake-id', // 不允許修改
        created_at: new Date(), // 不允許修改
        first_name: '合法更新'
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.customer.agent_id._id).toBe(testAgent._id.toString());
      expect(response.body.data.customer.first_name).toBe('合法更新');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await createTestCustomer({
        first_name: '刪除',
        last_name: '測試',
        phone: '0901234567'
      }, testAgent._id);
    });

    it('管理員應該能刪除客戶', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('客戶已刪除');

      // 驗證客戶被軟刪除
      const deletedCustomer = await Customer.findById(testCustomer._id);
      expect(deletedCustomer!.status).toBe('inactive');
    });

    it('業務員不應該能刪除客戶', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('經理不應該能刪除客戶', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/customers/:id/intent-score', () => {
    let testCustomer: any;

    beforeEach(async () => {
      testCustomer = await createTestCustomer({
        first_name: '評分',
        last_name: '測試',
        phone: '0912345678',
        purchase_intent_score: 5
      }, testAgent._id);
    });

    it('應該成功更新意願評分', async () => {
      const scoreData = {
        score: 8,
        reason: '客戶表現出強烈的購買意願'
      };

      const response = await request(app)
        .patch(`/api/customers/${testCustomer._id}/intent-score`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(scoreData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.new_score).toBe(8);

      // 驗證評分已更新
      const updatedCustomer = await Customer.findById(testCustomer._id);
      expect(updatedCustomer!.purchase_intent_score).toBe(8);
    });

    it('應該拒絕無效的評分', async () => {
      const invalidScores = [-1, 11, 'abc', null];

      for (const score of invalidScores) {
        const response = await request(app)
          .patch(`/api/customers/${testCustomer._id}/intent-score`)
          .set('Authorization', `Bearer ${agentToken}`)
          .send({ score })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_SCORE');
      }
    });

    it('應該在備註中記錄評分變更', async () => {
      const scoreData = {
        score: 9,
        reason: '客戶已確認購買決定'
      };

      await request(app)
        .patch(`/api/customers/${testCustomer._id}/intent-score`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(scoreData)
        .expect(200);

      const updatedCustomer = await Customer.findById(testCustomer._id);
      expect(updatedCustomer!.notes).toContain('評分更新: 9分');
      expect(updatedCustomer!.notes).toContain('客戶已確認購買決定');
    });
  });

  describe('GET /api/customers/stats/overview', () => {
    beforeEach(async () => {
      // 創建不同狀態的客戶
      await createTestCustomer({ 
        status: 'active', 
        purchase_intent_score: 8,
        phone: '0911111111' 
      }, testAgent._id);
      
      await createTestCustomer({ 
        status: 'completed', 
        purchase_intent_score: 9,
        phone: '0922222222' 
      }, testAgent._id);
      
      await createTestCustomer({ 
        status: 'lost', 
        purchase_intent_score: 3,
        phone: '0933333333' 
      }, testAgent._id);
      
      await createTestCustomer({ 
        status: 'active', 
        purchase_intent_score: 5,
        phone: '0944444444' 
      }, testManager._id);
    });

    it('業務員應該能查看自己的統計數據', async () => {
      const response = await request(app)
        .get('/api/customers/stats/overview')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total_customers: 3,
        active_customers: 1,
        completed_customers: 1,
        lost_customers: 1,
        high_intent_customers: 2, // score >= 7
        conversion_rate: '33.33' // 1/3 completed
      });
    });

    it('經理應該能查看全部統計數據', async () => {
      const response = await request(app)
        .get('/api/customers/stats/overview')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total_customers: 4,
        active_customers: 2,
        completed_customers: 1,
        lost_customers: 1
      });
    });

    it('應該支持按業務員篩選統計', async () => {
      const response = await request(app)
        .get(`/api/customers/stats/overview?agent_id=${testAgent._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.total_customers).toBe(3);
    });
  });

  describe('Authentication & Authorization', () => {
    it('所有端點都應該要求認證', async () => {
      const endpoints = [
        { method: 'get', path: '/api/customers' },
        { method: 'get', path: '/api/customers/123' },
        { method: 'post', path: '/api/customers' },
        { method: 'put', path: '/api/customers/123' },
        { method: 'delete', path: '/api/customers/123' },
        { method: 'patch', path: '/api/customers/123/intent-score' },
        { method: 'get', path: '/api/customers/stats/overview' }
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app) as any)[endpoint.method](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      }
    });
  });
});