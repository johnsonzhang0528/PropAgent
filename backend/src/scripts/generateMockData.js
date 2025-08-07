const mongoose = require('mongoose');

// MongoDB 連接
mongoose.connect('mongodb://localhost:27017/propagent');

// 模擬數據生成工具函數
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成 Customer 模擬數據
async function generateCustomers() {
  const customerSchema = new mongoose.Schema({
    agent_id: mongoose.Schema.Types.ObjectId,
    company_id: mongoose.Schema.Types.ObjectId,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    line_id: String,
    wechat_id: String,
    gender: String,
    age: Number,
    occupation: String,
    annual_income: Number,
    marital_status: String,
    family_members: Number,
    source: String,
    referral_source: String,
    status: String,
    tags: [String],
    notes: String,
    purchase_intent_score: Number,
    last_contact_at: Date,
    created_at: Date,
    updated_at: Date
  });

  const Customer = mongoose.model('Customer', customerSchema);
  
  // 獲取現有的 agent_id 和 company_id
  const existingCustomer = await Customer.findOne();
  const agentId = existingCustomer?.agent_id || new mongoose.Types.ObjectId();
  const companyId = existingCustomer?.company_id || new mongoose.Types.ObjectId();
  
  const firstNames = ['王小明', '李美麗', '張志偉', '陳淑芬', '林建宏', '黃雅婷', '郭文華', '劉志豪', '蔡美玲', '許志強',
                     '楊淑惠', '賴建成', '謝雅雯', '洪志明', '呂美娟', '鄭文傑', '徐淑美', '羅建宏', '莊雅芳', '葉志偉',
                     '潘美麗', '施建華', '顏淑玲', '詹志豪', '范美惠', '凃文明', '戴雅婷', '曾志強', '薛美玲', '韓建成'];
  
  const lastNames = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                     '', '', '', '', '', '', '', '', '', ''];
  
  const occupations = ['工程師', '教師', '醫師', '護理師', '會計師', '律師', '公務員', '業務員', '經理', '主管',
                      '設計師', '建築師', '藥師', '記者', '銀行員', '保險員', '房仲', '自營商', '學生', '退休'];
  
  const sources = ['網路廣告', '朋友介紹', '電話行銷', '展場活動', '社群媒體', '官網諮詢', '報紙廣告', '傳單'];
  const statuses = ['active', 'inactive', 'completed', 'lost'];
  const genders = ['male', 'female'];
  const maritalStatuses = ['單身', '已婚', '離婚', '喪偶'];
  
  const customers = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  for (let i = 0; i < 60; i++) {
    const firstName = randomChoice(firstNames);
    const createdAt = randomDate(sixMonthsAgo, new Date());
    const lastContactAt = randomDate(createdAt, new Date());
    
    customers.push({
      agent_id: agentId,
      company_id: companyId,
      first_name: firstName,
      last_name: '',
      email: `${firstName.toLowerCase()}${randomInt(100, 999)}@gmail.com`,
      phone: `09${randomInt(10000000, 99999999)}`,
      line_id: Math.random() > 0.6 ? `${firstName}${randomInt(100, 999)}` : undefined,
      wechat_id: Math.random() > 0.7 ? `${firstName}${randomInt(100, 999)}` : undefined,
      gender: randomChoice(genders),
      age: randomInt(25, 65),
      occupation: randomChoice(occupations),
      annual_income: randomInt(400000, 2000000),
      marital_status: randomChoice(maritalStatuses),
      family_members: randomInt(1, 6),
      source: randomChoice(sources),
      referral_source: Math.random() > 0.7 ? randomChoice(firstNames) : undefined,
      status: randomChoice(statuses),
      tags: Math.random() > 0.5 ? [randomChoice(['VIP', '首購族', '投資客', '換屋族', '重點客戶'])] : [],
      notes: Math.random() > 0.6 ? `${randomChoice(['積極尋找', '預算充足', '時間彈性', '地段重要', '價格敏感'])}的客戶` : undefined,
      purchase_intent_score: randomInt(1, 10),
      last_contact_at: lastContactAt,
      created_at: createdAt,
      updated_at: lastContactAt
    });
  }
  
  await Customer.insertMany(customers);
  console.log(`已生成 ${customers.length} 筆 Customer 數據`);
}

// 生成 Property 模擬數據
async function generateProperties() {
  const propertySchema = new mongoose.Schema({
    agent_id: mongoose.Schema.Types.ObjectId,
    company_id: mongoose.Schema.Types.ObjectId,
    property_type: String,
    listing_type: String,
    title: String,
    description: String,
    address: String,
    district: String,
    city: String,
    postal_code: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    price: Number,
    area: Number,
    area_unit: String,
    bedrooms: Number,
    bathrooms: Number,
    parking_spots: Number,
    floor: Number,
    total_floors: Number,
    building_age: Number,
    features: [String],
    amenities: [String],
    transport_info: {
      mrt_stations: [String],
      bus_stops: [String],
      distance_to_mrt: Number
    },
    school_district: String,
    status: String,
    available_from: Date,
    images: [String],
    documents: [String],
    virtual_tour_url: String,
    listing_expires_at: Date,
    created_at: Date,
    updated_at: Date
  });

  const Property = mongoose.model('Property', propertySchema);
  
  // 獲取現有的 agent_id 和 company_id
  const existingProperty = await Property.findOne();
  const agentId = existingProperty?.agent_id || new mongoose.Types.ObjectId();
  const companyId = existingProperty?.company_id || new mongoose.Types.ObjectId();
  
  const propertyTypes = ['apartment', 'house', 'commercial', 'land'];
  const listingTypes = ['sale', 'rent'];
  const statuses = ['available', 'pending', 'sold', 'rented', 'withdrawn'];
  
  const cities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
  const districts = {
    '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
    '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區'],
    '桃園市': ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '大園區', '龜山區', '八德區', '龍潭區', '平鎮區'],
    '台中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區'],
    '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區'],
    '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區']
  };
  
  const mrtStations = ['台北車站', '忠孝復興', '市政府', '信義安和', '松江南京', '中山國中', '劍南路', '文湖線', '淡水信義線'];
  const features = ['採光良好', '通風佳', '格局方正', '近捷運', '學區優', '商圈便利', '景觀好', '安全社區'];
  const amenities = ['游泳池', '健身房', '管理室', '停車場', '花園', '會議室', '兒童遊戲區', '烤肉區'];
  
  const properties = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  for (let i = 0; i < 40; i++) {
    const city = randomChoice(cities);
    const district = randomChoice(districts[city]);
    const propertyType = randomChoice(propertyTypes);
    const listingType = randomChoice(listingTypes);
    const createdAt = randomDate(sixMonthsAgo, new Date());
    
    // 根據類型設定價格範圍
    let priceRange;
    if (listingType === 'rent') {
      priceRange = propertyType === 'apartment' ? [15000, 50000] : [20000, 80000];
    } else {
      switch (city) {
        case '台北市':
          priceRange = [8000000, 50000000];
          break;
        case '新北市':
          priceRange = [4000000, 25000000];
          break;
        case '桃園市':
          priceRange = [3000000, 15000000];
          break;
        default:
          priceRange = [2000000, 20000000];
      }
    }
    
    const price = randomInt(priceRange[0], priceRange[1]);
    const area = randomInt(15, 80);
    const bedrooms = propertyType === 'apartment' ? randomInt(1, 4) : randomInt(2, 5);
    const bathrooms = Math.min(bedrooms, randomInt(1, 3));
    
    properties.push({
      agent_id: agentId,
      company_id: companyId,
      property_type: propertyType,
      listing_type: listingType,
      title: `${city}${district}${propertyType === 'apartment' ? '公寓' : propertyType === 'house' ? '透天' : '商用'}${area}坪`,
      description: `位於${city}${district}，${randomChoice(features)}，${randomChoice(['適合自住', '投資首選', '稀有釋出'])}`,
      address: `${city}${district}${randomChoice(['中正路', '民權路', '建國路', '中山路', '忠孝路'])}${randomInt(1, 500)}號`,
      district: district,
      city: city,
      postal_code: `${randomInt(100, 999)}`,
      coordinates: {
        latitude: 25.0330 + (Math.random() - 0.5) * 0.5,
        longitude: 121.5654 + (Math.random() - 0.5) * 0.5
      },
      price: price,
      area: area,
      area_unit: 'ping',
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      parking_spots: Math.random() > 0.5 ? randomInt(1, 2) : 0,
      floor: randomInt(1, 20),
      total_floors: randomInt(5, 25),
      building_age: randomInt(0, 30),
      features: [randomChoice(features), randomChoice(features)],
      amenities: Math.random() > 0.6 ? [randomChoice(amenities)] : [],
      transport_info: {
        mrt_stations: [randomChoice(mrtStations)],
        bus_stops: [`${randomChoice(['市政府', '火車站', '學校', '醫院'])}站`],
        distance_to_mrt: randomInt(50, 1000)
      },
      school_district: `${district}${randomChoice(['國小', '國中', '高中'])}學區`,
      status: randomChoice(statuses),
      available_from: randomDate(createdAt, new Date()),
      images: [`property_${i}_1.jpg`, `property_${i}_2.jpg`],
      documents: [`contract_${i}.pdf`],
      virtual_tour_url: Math.random() > 0.7 ? `https://virtualtour.com/property_${i}` : undefined,
      listing_expires_at: randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      created_at: createdAt,
      updated_at: randomDate(createdAt, new Date())
    });
  }
  
  await Property.insertMany(properties);
  console.log(`已生成 ${properties.length} 筆 Property 數據`);
}

// 主要執行函數
async function main() {
  try {
    console.log('開始生成模擬數據...');
    
    await generateCustomers();
    await generateProperties();
    
    console.log('模擬數據生成完成！');
    
    // 驗證數據量
    const customerCount = await mongoose.connection.db.collection('customers').countDocuments();
    const propertyCount = await mongoose.connection.db.collection('properties').countDocuments();
    console.log(`\n最終數據量:`);
    console.log(`Customer: ${customerCount} 筆`);
    console.log(`Property: ${propertyCount} 筆`);
    
    process.exit(0);
  } catch (error) {
    console.error('生成模擬數據時發生錯誤:', error);
    process.exit(1);
  }
}

main();