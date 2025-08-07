import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Property } from '../src/models/Property';
import { Customer } from '../src/models/Customer';
import propertyRoutes from '../src/routes/properties';
import { authMiddleware } from '../src/middleware/auth';
import { createTestUser, createTestCustomer, createTestProperty, generateTestToken } from './setup';

// 創建測試 Express 應用
const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/properties', propertyRoutes);
  return app;
};

describe('Property Management API', () => {
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
      email: 'agent@property.com',
      role: 'agent',
      first_name: '物件',
      last_name: '業務員'
    });
    
    testManager = await createTestUser({
      email: 'manager@property.com',
      role: 'manager',
      first_name: '物件',
      last_name: '經理'
    });
    
    testAdmin = await createTestUser({
      email: 'admin@property.com',
      role: 'admin',
      first_name: '物件',
      last_name: '管理員'
    });

    // 生成認證 token
    agentToken = generateTestToken(testAgent._id.toString(), 'agent');
    managerToken = generateTestToken(testManager._id.toString(), 'manager');
    adminToken = generateTestToken(testAdmin._id.toString(), 'admin');
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      // 創建測試物件
      await createTestProperty({
        title: '信義區豪宅',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 50000000,
        area: 30,
        bedrooms: 3,
        district: '信義區'
      }, testAgent._id);
      
      await createTestProperty({
        title: '大安區公寓',
        property_type: 'apartment',
        listing_type: 'rent',
        price: 45000,
        area: 25,
        bedrooms: 2,
        district: '大安區'
      }, testAgent._id);
      
      await createTestProperty({
        title: '中山區別墅',
        property_type: 'house',
        listing_type: 'sale',
        price: 80000000,
        area: 50,
        bedrooms: 4,
        district: '中山區'
      }, testManager._id);
    });

    it('業務員應該只能查看自己的物件', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      
      // 驗證返回的物件都屬於該業務員
      response.body.data.properties.forEach((property: any) => {
        expect(property.agent_id._id).toBe(testAgent._id.toString());
      });
    });

    it('經理應該能查看所有物件', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.properties).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('應該支持物件類型篩選', async () => {
      const response = await request(app)
        .get('/api/properties?property_type=apartment')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(2);
      response.body.data.properties.forEach((property: any) => {
        expect(property.property_type).toBe('apartment');
      });
    });

    it('應該支持交易類型篩選', async () => {
      const response = await request(app)
        .get('/api/properties?listing_type=sale')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(2);
      response.body.data.properties.forEach((property: any) => {
        expect(property.listing_type).toBe('sale');
      });
    });

    it('應該支持價格範圍篩選', async () => {
      const response = await request(app)
        .get('/api/properties?min_price=40000000&max_price=60000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].title).toBe('信義區豪宅');
    });

    it('應該支持面積範圍篩選', async () => {
      const response = await request(app)
        .get('/api/properties?min_area=25&max_area=35')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(2);
      response.body.data.properties.forEach((property: any) => {
        expect(property.area).toBeGreaterThanOrEqual(25);
        expect(property.area).toBeLessThanOrEqual(35);
      });
    });

    it('應該支持地區搜索', async () => {
      const response = await request(app)
        .get('/api/properties?district=信義')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].district).toBe('信義區');
    });

    it('應該支持房間數篩選', async () => {
      const response = await request(app)
        .get('/api/properties?bedrooms=3')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].bedrooms).toBe(3);
    });

    it('應該支持分頁查詢', async () => {
      const response = await request(app)
        .get('/api/properties?page=1&limit=2')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        total_pages: 2
      });
    });

    it('應該支持排序', async () => {
      const response = await request(app)
        .get('/api/properties?sort_by=price&sort_order=asc')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const prices = response.body.data.properties.map((p: any) => p.price);
      expect(prices).toEqual(prices.slice().sort((a: number, b: number) => a - b));
    });
  });

  describe('GET /api/properties/:id', () => {
    let testProperty: any;

    beforeEach(async () => {
      testProperty = await createTestProperty({
        title: '測試物件詳情',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 30000000,
        area: 20
      }, testAgent._id);
    });

    it('應該返回物件詳細信息', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property).toMatchObject({
        _id: testProperty._id.toString(),
        title: '測試物件詳情',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 30000000
      });
    });

    it('任何認證用戶都應該能查看物件詳情', async () => {
      const otherAgent = await createTestUser({
        email: 'other@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent._id as any).toString(), 'agent');

      const response = await request(app)
        .get(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('應該返回404當物件不存在', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/properties/${fakeId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROPERTY_NOT_FOUND');
    });
  });

  describe('POST /api/properties', () => {
    const newPropertyData = {
      property_type: 'apartment',
      listing_type: 'sale',
      title: '全新豪華公寓',
      description: '位於黃金地段的全新豪華公寓',
      address: '台北市中正區忠孝東路一段1號',
      district: '中正區',
      city: '台北市',
      postal_code: '100',
      price: 35000000,
      area: 28,
      area_unit: 'ping',
      bedrooms: 2,
      bathrooms: 2,
      parking_spots: 1,
      floor: 15,
      total_floors: 20,
      building_age: 1,
      features: ['陽台', '電梯', '管理員'],
      amenities: ['健身房', '游泳池', '停車場'],
      available_from: new Date(),
      images: ['image1.jpg', 'image2.jpg']
    };

    it('應該成功創建新物件', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newPropertyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property).toMatchObject({
        title: '全新豪華公寓',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 35000000,
        area: 28,
        bedrooms: 2
      });

      // 驗證物件已保存到數據庫
      const savedProperty = await Property.findById(response.body.data.property._id);
      expect(savedProperty).toBeTruthy();
      expect(savedProperty!.agent_id?.toString()).toBe(testAgent._id.toString());
    });

    it('應該自動設置業務員ID和公司ID', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(newPropertyData)
        .expect(201);

      expect(response.body.data.property.agent_id._id).toBe(testAgent._id.toString());
    });

    it('應該設置默認值', async () => {
      const minimalData = {
        property_type: 'apartment',
        listing_type: 'sale',
        title: '最小物件數據',
        address: '台北市信義區',
        price: 10000000,
        area: 15
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(minimalData)
        .expect(201);

      expect(response.body.data.property).toMatchObject({
        status: 'available',
        area_unit: 'ping',
        features: [],
        amenities: [],
        images: [],
        documents: []
      });
    });

    it('應該驗證必填字段', async () => {
      const incompleteData = {
        property_type: 'apartment'
        // 缺少其他必填字段
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(incompleteData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/properties/:id', () => {
    let testProperty: any;

    beforeEach(async () => {
      testProperty = await createTestProperty({
        title: '待更新物件',
        price: 25000000,
        area: 20
      }, testAgent._id);
    });

    it('應該成功更新物件信息', async () => {
      const updateData = {
        title: '已更新物件',
        price: 28000000,
        description: '更新後的描述'
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property).toMatchObject({
        title: '已更新物件',
        price: 28000000,
        description: '更新後的描述'
      });
    });

    it('應該拒絕無權限的用戶更新', async () => {
      const otherAgent = await createTestUser({
        email: 'other2@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent._id as any).toString(), 'agent');

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: '非法更新' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('經理應該能更新任何物件', async () => {
      const updateData = {
        title: '經理更新的物件'
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.property.title).toBe('經理更新的物件');
    });

    it('應該忽略不允許修改的字段', async () => {
      const updateData = {
        agent_id: testManager._id, // 不允許修改
        company_id: 'fake-id', // 不允許修改
        created_at: new Date(), // 不允許修改
        title: '合法更新'
      };

      const response = await request(app)
        .put(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.property.agent_id._id).toBe(testAgent._id.toString());
      expect(response.body.data.property.title).toBe('合法更新');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    let testProperty: any;

    beforeEach(async () => {
      testProperty = await createTestProperty({
        title: '待刪除物件'
      }, testAgent._id);
    });

    it('業務員應該能刪除自己的物件', async () => {
      const response = await request(app)
        .delete(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('物件已刪除');

      // 驗證物件被軟刪除
      const deletedProperty = await Property.findById(testProperty._id);
      expect(deletedProperty!.status).toBe('withdrawn');
    });

    it('經理應該能刪除任何物件', async () => {
      const response = await request(app)
        .delete(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('應該拒絕無權限的用戶刪除', async () => {
      const otherAgent = await createTestUser({
        email: 'other3@test.com',
        role: 'agent'
      });
      const otherToken = generateTestToken((otherAgent._id as any).toString(), 'agent');

      const response = await request(app)
        .delete(`/api/properties/${testProperty._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/properties/:id/matches', () => {
    let testProperty: any;
    let highIntentCustomer: any;
    let mediumIntentCustomer: any;
    let lowIntentCustomer: any;
    let inactiveCustomer: any;

    beforeEach(async () => {
      testProperty = await createTestProperty({
        title: '配對測試物件',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 30000000,
        area: 25,
        bedrooms: 2
      }, testAgent._id);

      // 創建不同意願程度的客戶
      highIntentCustomer = await createTestCustomer({
        first_name: '高意願',
        last_name: '客戶',
        phone: '0911111111',
        purchase_intent_score: 9,
        status: 'active',
        last_contact_at: new Date() // 最近聯繫
      }, testAgent._id);

      mediumIntentCustomer = await createTestCustomer({
        first_name: '中等意願',
        last_name: '客戶',
        phone: '0922222222',
        purchase_intent_score: 6,
        status: 'active',
        last_contact_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15天前聯繫
      }, testAgent._id);

      lowIntentCustomer = await createTestCustomer({
        first_name: '低意願',
        last_name: '客戶',
        phone: '0933333333',
        purchase_intent_score: 3,
        status: 'active',
        last_contact_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60天前聯繫
      }, testAgent._id);

      inactiveCustomer = await createTestCustomer({
        first_name: '非活躍',
        last_name: '客戶',
        phone: '0944444444',
        purchase_intent_score: 8,
        status: 'inactive' // 非活躍狀態
      }, testAgent._id);
    });

    it('應該返回匹配的客戶列表', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('property_id');
      expect(response.body.data).toHaveProperty('property_title');
      expect(response.body.data).toHaveProperty('matched_customers');
      expect(response.body.data).toHaveProperty('total_matches');
    });

    it('應該按匹配分數排序客戶', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      
      // 驗證客戶是按匹配分數降序排列
      for (let i = 0; i < customers.length - 1; i++) {
        expect(customers[i].match_score).toBeGreaterThanOrEqual(customers[i + 1].match_score);
      }
    });

    it('應該只返回活躍客戶', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      customers.forEach((customer: any) => {
        expect(customer).not.toHaveProperty('status', 'inactive');
      });

      // 確認非活躍客戶不在結果中
      const customerNames = customers.map((c: any) => c.first_name);
      expect(customerNames).not.toContain('非活躍');
    });

    it('高意願客戶應該有更高的匹配分數', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      const highIntentMatch = customers.find((c: any) => c.first_name === '高意願');
      const lowIntentMatch = customers.find((c: any) => c.first_name === '低意願');

      if (highIntentMatch && lowIntentMatch) {
        expect(highIntentMatch.match_score).toBeGreaterThan(lowIntentMatch.match_score);
      }
    });

    it('應該支持限制返回數量', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches?limit=2`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.data.matched_customers.length).toBeLessThanOrEqual(2);
    });

    it('應該只返回達到最低匹配分數的客戶', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      customers.forEach((customer: any) => {
        expect(customer.match_score).toBeGreaterThanOrEqual(30); // 最低門檻分數
      });
    });

    it('應該包含客戶的業務員信息', async () => {
      const response = await request(app)
        .get(`/api/properties/${testProperty._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      if (customers.length > 0) {
        expect(customers[0]).toHaveProperty('agent');
        expect(customers[0].agent).toHaveProperty('_id');
      }
    });

    it('應該處理不存在的物件', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/properties/${fakeId}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROPERTY_NOT_FOUND');
    });
  });

  describe('GET /api/properties/stats/overview', () => {
    beforeEach(async () => {
      // 創建不同狀態的物件
      await createTestProperty({
        title: '可售物件1',
        status: 'available',
        listing_type: 'sale',
        price: 30000000
      }, testAgent._id);

      await createTestProperty({
        title: '可售物件2',
        status: 'available',
        listing_type: 'sale',
        price: 40000000
      }, testAgent._id);

      await createTestProperty({
        title: '已售物件',
        status: 'sold',
        listing_type: 'sale',
        price: 35000000
      }, testAgent._id);

      await createTestProperty({
        title: '已租物件',
        status: 'rented',
        listing_type: 'rent',
        price: 50000
      }, testAgent._id);

      await createTestProperty({
        title: '經理物件',
        status: 'available',
        listing_type: 'sale',
        price: 60000000
      }, testManager._id);
    });

    it('業務員應該能查看自己的統計數據', async () => {
      const response = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total_properties: 4,
        available_properties: 2,
        sold_properties: 1,
        rented_properties: 1,
        success_rate: '50.00' // (1 sold + 1 rented) / 4 total
      });
    });

    it('經理應該能查看全部統計數據', async () => {
      const response = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total_properties: 5,
        available_properties: 3,
        sold_properties: 1,
        rented_properties: 1
      });
    });

    it('應該正確計算平均價格', async () => {
      const response = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      // 可售物件平均價格: (30000000 + 40000000) / 2 = 35000000
      expect(response.body.data.average_price).toBe(35000000);
    });

    it('應該正確計算總投資組合價值', async () => {
      const response = await request(app)
        .get('/api/properties/stats/overview')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      // 總價值: 30000000 + 40000000 + 35000000 + 50000 = 105050000
      expect(response.body.data.total_portfolio_value).toBe(105050000);
    });

    it('應該支持按業務員篩選統計', async () => {
      const response = await request(app)
        .get(`/api/properties/stats/overview?agent_id=${testAgent._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.data.total_properties).toBe(4);
    });
  });

  describe('Authentication & Authorization', () => {
    it('所有端點都應該要求認證', async () => {
      const endpoints = [
        { method: 'get', path: '/api/properties' },
        { method: 'get', path: '/api/properties/123' },
        { method: 'post', path: '/api/properties' },
        { method: 'put', path: '/api/properties/123' },
        { method: 'delete', path: '/api/properties/123' },
        { method: 'get', path: '/api/properties/123/matches' },
        { method: 'get', path: '/api/properties/stats/overview' }
      ];

      for (const endpoint of endpoints) {
        const response = await (request(app) as any)[endpoint.method](endpoint.path)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('MISSING_TOKEN');
      }
    });
  });

  describe('Complex Scenarios', () => {
    it('應該正確處理複雜的篩選組合', async () => {
      // 創建多個測試物件
      await createTestProperty({
        title: '符合條件的物件',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 45000000,
        area: 30,
        bedrooms: 3,
        district: '信義區'
      }, testAgent._id);

      await createTestProperty({
        title: '不符合價格條件',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 70000000, // 超出價格範圍
        area: 30,
        bedrooms: 3,
        district: '信義區'
      }, testAgent._id);

      const response = await request(app)
        .get('/api/properties')
        .query({
          property_type: 'apartment',
          listing_type: 'sale',
          min_price: 40000000,
          max_price: 50000000,
          min_area: 25,
          bedrooms: 3,
          district: '信義'
        })
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0].title).toBe('符合條件的物件');
    });

    it('智能配對應該考慮多個因素', async () => {
      const property = await createTestProperty({
        title: '高端公寓',
        property_type: 'apartment',
        listing_type: 'sale',
        price: 50000000,
        bedrooms: 3
      }, testAgent._id);

      // 創建最近聯繫且高意願的客戶
      await createTestCustomer({
        first_name: '最佳',
        last_name: '匹配',
        phone: '0911111111',
        purchase_intent_score: 9,
        status: 'active',
        last_contact_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2天前
      }, testAgent._id);

      // 創建很久沒聯繫但高意願的客戶
      await createTestCustomer({
        first_name: '久未',
        last_name: '聯繫',
        phone: '0922222222',
        purchase_intent_score: 9,
        status: 'active',
        last_contact_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45天前
      }, testAgent._id);

      const response = await request(app)
        .get(`/api/properties/${property._id}/matches`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      const customers = response.body.data.matched_customers;
      expect(customers.length).toBeGreaterThan(0);

      // 最近聯繫的客戶應該有更高分數
      const recentCustomer = customers.find((c: any) => c.first_name === '最佳');
      const oldCustomer = customers.find((c: any) => c.first_name === '久未');

      if (recentCustomer && oldCustomer) {
        expect(recentCustomer.match_score).toBeGreaterThan(oldCustomer.match_score);
      }
    });
  });
});