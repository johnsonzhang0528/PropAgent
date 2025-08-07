#!/usr/bin/env tsx
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Property } from '../models/Property';
import { Company } from '../models/Company';

// 連接到 MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/propagent';
    await mongoose.connect(mongoURI);
    console.log('✅ 數據庫連接成功');
  } catch (error) {
    console.error('❌ 數據庫連接失敗:', error);
    process.exit(1);
  }
};

// 創建測試公司
const createTestCompany = async () => {
  console.log('📝 創建測試公司...');
  
  const companyData = {
    name: 'PropAgent Pro 不動產',
    description: '台灣領先的不動產仲介公司，提供專業的房地產買賣、租賃服務',
    address: '台北市大安區忠孝東路四段200號15樓',
    phone: '02-2345-6789',
    email: 'info@propagent.com',
    website: 'https://www.propagent.com',
    license_number: 'RE-2024-001',
    status: 'active'
  };

  try {
    const existingCompany = await Company.findOne({ name: companyData.name });
    if (!existingCompany) {
      const company = await Company.create(companyData);
      console.log(`✅ 公司創建成功: ${companyData.name}`);
      return company;
    } else {
      console.log(`ℹ️  公司已存在: ${companyData.name}`);
      return existingCompany;
    }
  } catch (error) {
    console.error(`❌ 創建公司失敗:`, error);
    throw error;
  }
};

// 創建測試用戶
const createTestUsers = async (company: any) => {
  console.log('📝 創建測試用戶...');
  
  const testUsers = [
    {
      email: 'test@example.com',
      password: await bcrypt.hash('test123', 10),
      first_name: '測試',
      last_name: '用戶',
      role: 'agent',
      phone: '0912345678',
      status: 'active',
      company_id: company._id
    },
    {
      email: 'admin@propagent.com',
      password: await bcrypt.hash('admin123', 10),
      first_name: '系統',
      last_name: '管理員',
      role: 'admin',
      phone: '0987654321',
      status: 'active',
      company_id: company._id
    },
    {
      email: 'manager@propagent.com',
      password: await bcrypt.hash('manager123', 10),
      first_name: '業務',
      last_name: '經理',
      role: 'manager',
      phone: '0911111111',
      status: 'active',
      company_id: company._id
    }
  ];

  for (const userData of testUsers) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`✅ 用戶創建成功: ${userData.email}`);
      } else {
        console.log(`ℹ️  用戶已存在: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ 創建用戶失敗 ${userData.email}:`, error);
    }
  }
};

// 創建測試客戶
const createTestCustomers = async (company: any) => {
  console.log('📝 創建測試客戶...');
  
  // 找一個代理商用戶
  const agent = await User.findOne({ role: 'agent' });
  if (!agent) {
    console.log('⚠️  找不到代理商用戶，跳過客戶創建');
    return;
  }

  const testCustomers = [
    {
      first_name: '張',
      last_name: '小明',
      email: 'zhang@example.com',
      phone: '0912000001',
      gender: 'male',
      age: 30,
      budget_min: 2000000,
      budget_max: 3000000,
      preferred_location: ['大安區', '信義區'],
      property_type_interest: ['apartment'],
      bedrooms_required: 2,
      bathrooms_required: 1,
      notes: '尋找大安區2房公寓，預算300萬以內',
      status: 'active',
      source: 'website',
      agent_id: agent._id,
      purchase_intent_score: 8.5,
      company_id: company._id
    },
    {
      first_name: '李',
      last_name: '美女',
      email: 'li@example.com',
      phone: '0912000002',
      gender: 'female',
      age: 28,
      budget_min: 1500000,
      budget_max: 2500000,
      preferred_location: ['松山區', '中山區'],
      property_type_interest: ['apartment', 'house'],
      bedrooms_required: 3,
      bathrooms_required: 2,
      notes: '新婚夫妻，希望找到3房的住宅',
      status: 'active',
      source: 'referral',
      agent_id: agent._id,
      purchase_intent_score: 9.2,
      company_id: company._id
    },
    {
      first_name: '王',
      last_name: '總',
      email: 'wang@example.com',
      phone: '0912000003',
      gender: 'male',
      age: 45,
      budget_min: 5000000,
      budget_max: 10000000,
      preferred_location: ['信義區', '大安區'],
      property_type_interest: ['apartment', 'office'],
      bedrooms_required: 4,
      bathrooms_required: 3,
      notes: '企業老闆，尋找高級住宅或辦公空間',
      status: 'active',
      source: 'advertisement',
      agent_id: agent._id,
      purchase_intent_score: 7.8,
      company_id: company._id
    }
  ];

  for (const customerData of testCustomers) {
    try {
      const existingCustomer = await Customer.findOne({ email: customerData.email });
      if (!existingCustomer) {
        await Customer.create(customerData);
        console.log(`✅ 客戶創建成功: ${customerData.first_name}${customerData.last_name}`);
      } else {
        console.log(`ℹ️  客戶已存在: ${customerData.first_name}${customerData.last_name}`);
      }
    } catch (error) {
      console.error(`❌ 創建客戶失敗:`, error);
    }
  }
};

// 創建測試物件
const createTestProperties = async (company: any) => {
  console.log('📝 創建測試物件...');
  
  // 找一個代理商用戶
  const agent = await User.findOne({ role: 'agent' });
  if (!agent) {
    console.log('⚠️  找不到代理商用戶，跳過物件創建');
    return;
  }

  const testProperties = [
    {
      property_type: 'apartment',
      listing_type: 'sale',
      title: '大安區精華地段2房美宅',
      description: '位於大安區精華地段，交通便利，生活機能完善。室內採光良好，格局方正實用。',
      address: '台北市大安區忠孝東路四段100號',
      district: '大安區',
      city: '台北市',
      postal_code: '106',
      price: 2800000,
      area: 25,
      area_unit: 'ping',
      bedrooms: 2,
      bathrooms: 1,
      parking_spots: 1,
      floor: 8,
      total_floors: 15,
      building_age: 5,
      features: ['電梯', '陽台', '採光佳', '管理員'],
      amenities: ['停車場', '花園', '會議室'],
      status: 'available',
      available_from: new Date().toISOString(),
      images: [
        'https://via.placeholder.com/400x300/4CAF50/white?text=客廳',
        'https://via.placeholder.com/400x300/2196F3/white?text=臥室',
        'https://via.placeholder.com/400x300/FF9800/white?text=廚房'
      ],
      agent_id: agent._id,
      company_id: company._id,
      transport_info: {
        mrt_stations: ['忠孝敦化站', '國父紀念館站'],
        distance_to_mrt: 500
      }
    },
    {
      property_type: 'house',
      listing_type: 'rent',
      title: '信義區豪華3房透天厝',
      description: '信義區稀有透天厝，空間寬敞，適合大家庭居住。鄰近101大樓，生活便利。',
      address: '台北市信義區信義路五段200號',
      district: '信義區',
      city: '台北市',
      postal_code: '110',
      price: 80000,
      area: 45,
      area_unit: 'ping',
      bedrooms: 3,
      bathrooms: 2,
      parking_spots: 2,
      floor: 1,
      total_floors: 3,
      building_age: 8,
      features: ['花園', '車庫', '露台', '採光佳'],
      amenities: ['社區公園', '健身房'],
      status: 'available',
      available_from: new Date().toISOString(),
      images: [
        'https://via.placeholder.com/400x300/E91E63/white?text=外觀',
        'https://via.placeholder.com/400x300/9C27B0/white?text=客廳',
        'https://via.placeholder.com/400x300/673AB7/white?text=花園'
      ],
      agent_id: agent._id,
      company_id: company._id,
      transport_info: {
        mrt_stations: ['台北101/世貿站', '市政府站'],
        distance_to_mrt: 800
      }
    },
    {
      property_type: 'commercial',
      listing_type: 'sale',
      title: '松山區現代化辦公空間',
      description: '松山區新興商業區，現代化辦公大樓，適合中小企業設立總部。',
      address: '台北市松山區南京東路四段300號',
      district: '松山區',
      city: '台北市',
      postal_code: '105',
      price: 15000000,
      area: 80,
      area_unit: 'ping',
      bedrooms: 0,
      bathrooms: 3,
      parking_spots: 5,
      floor: 12,
      total_floors: 20,
      building_age: 3,
      features: ['電梯', '空調', '會議室', '接待區'],
      amenities: ['停車場', '24小時保全', '商務中心'],
      status: 'available',
      available_from: new Date().toISOString(),
      images: [
        'https://via.placeholder.com/400x300/607D8B/white?text=辦公室',
        'https://via.placeholder.com/400x300/795548/white?text=會議室',
        'https://via.placeholder.com/400x300/FF5722/white?text=接待區'
      ],
      agent_id: agent._id,
      company_id: company._id,
      transport_info: {
        mrt_stations: ['南京復興站', '松山機場站'],
        distance_to_mrt: 300
      }
    }
  ];

  for (const propertyData of testProperties) {
    try {
      const existingProperty = await Property.findOne({ 
        title: propertyData.title,
        agent_id: propertyData.agent_id 
      });
      if (!existingProperty) {
        await Property.create(propertyData);
        console.log(`✅ 物件創建成功: ${propertyData.title}`);
      } else {
        console.log(`ℹ️  物件已存在: ${propertyData.title}`);
      }
    } catch (error) {
      console.error(`❌ 創建物件失敗:`, error);
    }
  }
};

// 主程序
const initDatabase = async () => {
  console.log('🚀 PropAgent Pro - 初始化數據庫');
  console.log('================================');
  
  try {
    await connectDB();
    
    const company = await createTestCompany();
    await createTestUsers(company);
    await createTestCustomers(company);
    await createTestProperties(company);
    
    console.log('');
    console.log('✅ 數據庫初始化完成！');
    console.log('');
    console.log('🔑 測試登錄賬號:');
    console.log('  - test@example.com / test123 (代理商)');
    console.log('  - admin@propagent.com / admin123 (管理員)');
    console.log('  - manager@propagent.com / manager123 (經理)');
    console.log('');
    
  } catch (error) {
    console.error('❌ 數據庫初始化失敗:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 數據庫連接已關閉');
    process.exit(0);
  }
};

// 如果是直接運行此文件
if (require.main === module) {
  initDatabase();
}

export { initDatabase };