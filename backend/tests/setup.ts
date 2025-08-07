import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Customer } from '../src/models/Customer';
import { Property } from '../src/models/Property';
import { Company } from '../src/models/Company';

let mongoServer: MongoMemoryServer;

// 測試開始前設置
beforeAll(async () => {
  // 啟動內存中的 MongoDB 實例
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // 連接到測試數據庫
  await mongoose.connect(mongoUri);
  
  // 設置測試環境變量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

// 每個測試之間清理數據庫
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 測試結束後清理
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// 測試用的公司創建輔助函數
export const createTestCompany = async (companyData: any = {}) => {
  const defaultCompany = {
    name: '測試公司',
    status: 'active',
    settings: {
      timezone: 'Asia/Taipei',
      currency: 'TWD',
      language: 'zh-TW'
    },
    ...companyData
  };
  
  const company = new Company(defaultCompany);
  return await company.save();
};

// 測試用的用戶創建輔助函數
export const createTestUser = async (userData: any = {}) => {
  // 創建或使用提供的公司
  let testCompany;
  if (userData.company_id) {
    testCompany = { _id: userData.company_id };
  } else {
    testCompany = await createTestCompany();
  }
  
  const defaultUser = {
    email: 'test@example.com',
    password: '$2a$10$5YgF.XcVNV8mOW8hOJ3TGO3B.YJ2QxgpL.Fw8OVOl7mEJ4QVL1kq2', // hashed 'password123'
    first_name: '測試',
    last_name: '用戶',
    role: 'agent',
    status: 'active',
    company_id: testCompany._id,
    ...userData
  };
  
  const user = new User(defaultUser);
  return await user.save();
};

// 測試用的客戶創建輔助函數
export const createTestCustomer = async (customData: any = {}, agentId?: string) => {
  // 創建或使用提供的公司
  let testCompany;
  if (customData.company_id) {
    testCompany = { _id: customData.company_id };
  } else {
    testCompany = await createTestCompany();
  }
  
  const defaultCustomer = {
    agent_id: agentId || new mongoose.Types.ObjectId(),
    company_id: testCompany._id,
    first_name: '測試',
    last_name: '客戶',
    phone: '0912345678',
    email: 'customer@test.com',
    status: 'active',
    purchase_intent_score: 5,
    source: 'referral',
    tags: [],
    last_contact_at: new Date(),
    ...customData
  };
  
  const customer = new Customer(defaultCustomer);
  return await customer.save();
};

// 測試用的物件創建輔助函數
export const createTestProperty = async (propertyData: any = {}, agentId?: string) => {
  // 創建或使用提供的公司
  let testCompany;
  if (propertyData.company_id) {
    testCompany = { _id: propertyData.company_id };
  } else {
    testCompany = await createTestCompany();
  }
  
  const defaultProperty = {
    agent_id: agentId || new mongoose.Types.ObjectId(),
    company_id: testCompany._id,
    property_type: 'apartment',
    listing_type: 'sale',
    title: '測試物件',
    description: '這是一個測試物件',
    address: '台北市信義區信義路五段7號',
    district: '信義區',
    city: '台北市',
    price: 50000000,
    area: 30,
    area_unit: 'ping',
    bedrooms: 2,
    bathrooms: 1,
    status: 'available',
    tags: [],
    ...propertyData
  };
  
  const property = new Property(defaultProperty);
  return await property.save();
};

// JWT token 生成輔助函數
export const generateTestToken = (userId: string, role: string = 'agent') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};