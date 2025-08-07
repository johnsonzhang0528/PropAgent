/**
 * MongoDB 遷移腳本: 003_create_companies_table
 * 創建公司集合和相關索引
 * 基於 src/models/Company.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 companies 集合和索引...');
    
    // 創建 companies 集合
    await db.createCollection('companies', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'status'],
          properties: {
            name: {
              bsonType: 'string',
              maxLength: 100,
              description: '公司名稱，最大長度 100'
            },
            description: {
              bsonType: ['string', 'null'],
              maxLength: 500,
              description: '公司描述，最大長度 500'
            },
            address: {
              bsonType: ['string', 'null'],
              maxLength: 255,
              description: '公司地址'
            },
            phone: {
              bsonType: ['string', 'null'],
              maxLength: 20,
              description: '公司電話'
            },
            email: {
              bsonType: ['string', 'null'],
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: '有效的電子郵件格式'
            },
            website: {
              bsonType: ['string', 'null'],
              maxLength: 255,
              description: '公司網站'
            },
            logo_url: {
              bsonType: ['string', 'null'],
              maxLength: 255,
              description: '公司 Logo URL'
            },
            license_number: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: '營業執照號碼'
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'inactive'],
              description: '公司狀態'
            },
            settings: {
              bsonType: 'object',
              required: ['timezone', 'currency', 'language'],
              properties: {
                timezone: {
                  bsonType: 'string',
                  description: '時區設置'
                },
                currency: {
                  bsonType: 'string',
                  description: '貨幣設置'
                },
                language: {
                  bsonType: 'string',
                  description: '語言設置'
                }
              },
              description: '公司設置'
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
      db.collection('companies').createIndex({ name: 1 }, { name: 'name_index' }),
      db.collection('companies').createIndex({ status: 1 }, { name: 'status_index' }),
      db.collection('companies').createIndex({ created_at: -1 }, { name: 'created_at_desc' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ companies 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 companies 集合...');
    await db.dropCollection('companies');
    console.log('✅ companies 集合刪除完成');
  }
};

module.exports = migration;