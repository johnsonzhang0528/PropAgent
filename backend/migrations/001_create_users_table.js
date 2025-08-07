/**
 * MongoDB 遷移腳本: 001_create_users_table
 * 創建用戶集合和相關索引
 * 基於 src/models/User.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 users 集合和索引...');
    
    // 創建 users 集合
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'first_name', 'last_name', 'role', 'status'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: '必須是有效的電子郵件格式'
            },
            password: {
              bsonType: 'string',
              minLength: 6,
              description: '密碼長度至少 6 個字符'
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
            role: {
              bsonType: 'string',
              enum: ['admin', 'manager', 'agent'],
              description: '用戶角色'
            },
            phone: {
              bsonType: ['string', 'null'],
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
            company_id: {
              bsonType: ['objectId', 'null'],
              description: '關聯的公司 ID'
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: '用戶狀態'
            },
            avatar_url: {
              bsonType: ['string', 'null'],
              description: '頭像 URL'
            },
            last_login_at: {
              bsonType: ['date', 'null'],
              description: '最後登入時間'
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
      db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'email_unique' }),
      db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_unique' }),
      db.collection('users').createIndex({ role: 1 }, { name: 'role_index' }),
      db.collection('users').createIndex({ company_id: 1 }, { name: 'company_id_index' }),
      db.collection('users').createIndex({ status: 1 }, { name: 'status_index' }),
      db.collection('users').createIndex({ created_at: -1 }, { name: 'created_at_desc' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ users 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 users 集合...');
    await db.dropCollection('users');
    console.log('✅ users 集合刪除完成');
  }
};

module.exports = migration;