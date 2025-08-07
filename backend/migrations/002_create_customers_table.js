/**
 * MongoDB 遷移腳本: 002_create_customers_table
 * 創建客戶集合和相關索引
 * 基於 src/models/Customer.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 customers 集合和索引...');
    
    // 創建 customers 集合
    await db.createCollection('customers', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['agent_id', 'company_id', 'first_name', 'last_name', 'phone', 'status'],
          properties: {
            agent_id: {
              bsonType: 'objectId',
              description: '關聯的代理人 ID'
            },
            company_id: {
              bsonType: 'objectId',
              description: '關聯的公司 ID'
            },
            first_name: {
              bsonType: 'string',
              maxLength: 50,
              description: '姓氏，最大長度 50'
            },
            last_name: {
              bsonType: 'string',
              maxLength: 50,
              description: '名字，最大長度 50'
            },
            email: {
              bsonType: ['string', 'null'],
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: '有效的電子郵件格式'
            },
            phone: {
              bsonType: 'string',
              pattern: '^09\\d{8}$',
              description: '台灣手機號碼格式'
            },
            line_id: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: 'LINE ID'
            },
            wechat_id: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: '微信 ID'
            },
            gender: {
              bsonType: ['string', 'null'],
              enum: ['male', 'female', 'other'],
              description: '性別'
            },
            age: {
              bsonType: ['number', 'null'],
              minimum: 18,
              maximum: 120,
              description: '年齡，18-120 歲'
            },
            occupation: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: '職業'
            },
            annual_income: {
              bsonType: ['number', 'null'],
              minimum: 0,
              description: '年收入'
            },
            marital_status: {
              bsonType: ['string', 'null'],
              maxLength: 20,
              description: '婚姻狀態'
            },
            family_members: {
              bsonType: ['number', 'null'],
              minimum: 1,
              maximum: 20,
              description: '家庭成員數量'
            },
            source: {
              bsonType: ['string', 'null'],
              maxLength: 50,
              description: '客戶來源'
            },
            referral_source: {
              bsonType: ['string', 'null'],
              maxLength: 255,
              description: '推薦來源'
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'inactive', 'completed', 'lost'],
              description: '客戶狀態'
            },
            tags: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: '標籤數組'
            },
            notes: {
              bsonType: ['string', 'null'],
              description: '備註'
            },
            purchase_intent_score: {
              bsonType: 'number',
              minimum: 0,
              maximum: 10,
              description: '購買意向得分 0-10'
            },
            last_contact_at: {
              bsonType: ['date', 'null'],
              description: '最後聯絡時間'
            },
            created_at: {
              bsonType: 'date',
              description: '創建時間'
            },
            updated_at: {
              bsonType: 'date',
              description: '更新時間'
            }
          }
        }
      }
    });

    // 創建索引
    const indexPromises = [
      db.collection('customers').createIndex({ agent_id: 1 }, { name: 'agent_id_index' }),
      db.collection('customers').createIndex({ company_id: 1 }, { name: 'company_id_index' }),
      db.collection('customers').createIndex({ phone: 1 }, { name: 'phone_index' }),
      db.collection('customers').createIndex({ email: 1 }, { name: 'email_index' }),
      db.collection('customers').createIndex({ status: 1 }, { name: 'status_index' }),
      db.collection('customers').createIndex({ tags: 1 }, { name: 'tags_index' }),
      db.collection('customers').createIndex({ purchase_intent_score: -1 }, { name: 'purchase_intent_score_desc' }),
      db.collection('customers').createIndex({ created_at: -1 }, { name: 'created_at_desc' }),
      db.collection('customers').createIndex({ last_contact_at: -1 }, { name: 'last_contact_at_desc' }),
      // 複合索引
      db.collection('customers').createIndex({ agent_id: 1, status: 1 }, { name: 'agent_status_compound' }),
      db.collection('customers').createIndex({ company_id: 1, status: 1 }, { name: 'company_status_compound' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ customers 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 customers 集合...');
    await db.dropCollection('customers');
    console.log('✅ customers 集合刪除完成');
  }
};

module.exports = migration;