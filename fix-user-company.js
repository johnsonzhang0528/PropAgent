#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

async function fixUserCompany() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('📡 連接到 MongoDB');
    
    const db = client.db('propagent');
    const usersCollection = db.collection('users');
    const companiesCollection = db.collection('companies');
    
    // 查找admin用戶
    const adminUser = await usersCollection.findOne({ email: 'admin@propagent.com' });
    console.log('👤 找到admin用戶:', adminUser ? '✅' : '❌');
    
    if (!adminUser) {
      console.log('❌ 未找到admin用戶');
      return;
    }
    
    // 創建或查找默認公司
    let company = await companiesCollection.findOne({ name: 'PropAgent Pro' });
    
    if (!company) {
      console.log('🏢 創建默認公司...');
      const result = await companiesCollection.insertOne({
        name: 'PropAgent Pro',
        email: 'admin@propagent.com',
        phone: '+886-2-1234-5678',
        address: '台北市信義區信義路五段7號',
        website: 'https://propagent.pro',
        license_number: 'RE001234',
        description: '專業房地產代理公司',
        status: 'active',
        subscription_plan: 'pro',
        subscription_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
        created_by: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      company = { _id: result.insertedId };
      console.log('✅ 公司創建成功');
    } else {
      console.log('✅ 找到現有公司');
    }
    
    // 更新admin用戶的company_id
    const updateResult = await usersCollection.updateOne(
      { _id: adminUser._id },
      { 
        $set: { 
          company_id: company._id,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('📝 用戶更新結果:', updateResult.modifiedCount > 0 ? '✅ 成功' : '❌ 失敗');
    
    // 驗證更新
    const updatedUser = await usersCollection.findOne({ _id: adminUser._id });
    console.log('🔍 驗證用戶更新:', updatedUser.company_id ? '✅ 已關聯公司' : '❌ 仍未關聯');
    
  } catch (error) {
    console.error('❌ 修復過程中出錯:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB 連接已關閉');
  }
}

// 檢查是否有 mongodb 依賴
try {
  require('mongodb');
  fixUserCompany();
} catch (error) {
  console.log('❌ 請先安裝 mongodb 依賴:');
  console.log('npm install mongodb');
  process.exit(1);
}