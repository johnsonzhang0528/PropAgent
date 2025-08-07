/**
 * MongoDB 遷移腳本: 006_create_notifications_table
 * 創建通知集合和相關索引
 * 基於 src/models/Notification.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 notifications 集合和索引...');
    
    // 創建 notifications 集合
    await db.createCollection('notifications', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['type', 'category', 'title', 'message', 'recipient', 'status', 'priority'],
          properties: {
            type: {
              bsonType: 'string',
              enum: ['email', 'sms', 'push', 'system'],
              description: '通知類型'
            },
            category: {
              bsonType: 'string',
              enum: ['customer', 'property', 'document', 'system', 'reminder'],
              description: '通知分類'
            },
            title: {
              bsonType: 'string',
              maxLength: 200,
              description: '通知標題'
            },
            message: {
              bsonType: 'string',
              maxLength: 2000,
              description: '通知內容'
            },
            recipient: {
              bsonType: 'object',
              required: ['type', 'id'],
              properties: {
                type: {
                  bsonType: 'string',
                  enum: ['user', 'customer'],
                  description: '接收者類型'
                },
                id: {
                  bsonType: 'objectId',
                  description: '接收者 ID'
                },
                email: {
                  bsonType: ['string', 'null'],
                  pattern: '^\\S+@\\S+\\.\\S+$',
                  description: '接收者郵箱'
                },
                phone: {
                  bsonType: ['string', 'null'],
                  pattern: '^09\\d{8}$',
                  description: '接收者電話'
                }
              },
              description: '接收者資訊'
            },
            sender: {
              bsonType: ['objectId', 'null'],
              description: '發送者 ID'
            },
            status: {
              bsonType: 'string',
              enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
              description: '通知狀態'
            },
            priority: {
              bsonType: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              description: '優先級'
            },
            scheduledAt: {
              bsonType: ['date', 'null'],
              description: '預定發送時間'
            },
            sentAt: {
              bsonType: ['date', 'null'],
              description: '實際發送時間'
            },
            deliveredAt: {
              bsonType: ['date', 'null'],
              description: '到達時間'
            },
            readAt: {
              bsonType: ['date', 'null'],
              description: '閱讀時間'
            },
            failureReason: {
              bsonType: ['string', 'null'],
              maxLength: 500,
              description: '失敗原因'
            },
            metadata: {
              bsonType: ['object', 'null'],
              properties: {
                emailId: {
                  bsonType: ['string', 'null'],
                  description: '外部郵件 ID'
                },
                smsId: {
                  bsonType: ['string', 'null'],
                  description: '外部 SMS ID'
                },
                pushId: {
                  bsonType: ['string', 'null'],
                  description: '外部推送 ID'
                },
                retryCount: {
                  bsonType: ['number', 'null'],
                  minimum: 0,
                  maximum: 5,
                  description: '重試次數'
                },
                relatedEntityType: {
                  bsonType: ['string', 'null'],
                  enum: ['customer', 'property', 'document', 'user'],
                  description: '關聯實體類型'
                },
                relatedEntityId: {
                  bsonType: ['objectId', 'null'],
                  description: '關聯實體 ID'
                },
                templateUsed: {
                  bsonType: ['string', 'null'],
                  description: '使用的模板'
                },
                attachments: {
                  bsonType: ['array', 'null'],
                  items: {
                    bsonType: 'string'
                  },
                  description: '附件'
                }
              },
              description: '元資料'
            },
            isRead: {
              bsonType: 'bool',
              description: '是否已讀'
            },
            isArchived: {
              bsonType: 'bool',
              description: '是否已歸檔'
            },
            expiresAt: {
              bsonType: ['date', 'null'],
              description: '過期時間'
            },
            createdAt: {
              bsonType: 'date',
              description: '創建時間'
            },
            updatedAt: {
              bsonType: 'date',
              description: '更新時間'
            }
          }
        }
      }
    });

    // 創建索引
    const indexPromises = [
      db.collection('notifications').createIndex({ type: 1 }, { name: 'type_index' }),
      db.collection('notifications').createIndex({ category: 1 }, { name: 'category_index' }),
      db.collection('notifications').createIndex({ status: 1 }, { name: 'status_index' }),
      db.collection('notifications').createIndex({ priority: 1 }, { name: 'priority_index' }),
      db.collection('notifications').createIndex({ scheduledAt: 1 }, { name: 'scheduledAt_index' }),
      db.collection('notifications').createIndex({ sentAt: 1 }, { name: 'sentAt_index' }),
      db.collection('notifications').createIndex({ isRead: 1 }, { name: 'isRead_index' }),
      db.collection('notifications').createIndex({ isArchived: 1 }, { name: 'isArchived_index' }),
      db.collection('notifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expiresAt_ttl' }),
      // 複合索引
      db.collection('notifications').createIndex({ 'recipient.id': 1, createdAt: -1 }, { name: 'recipient_created_compound' }),
      db.collection('notifications').createIndex({ 'recipient.id': 1, isRead: 1, isArchived: 1 }, { name: 'recipient_read_archived_compound' }),
      db.collection('notifications').createIndex({ type: 1, status: 1, scheduledAt: 1 }, { name: 'type_status_scheduled_compound' }),
      db.collection('notifications').createIndex({ category: 1, priority: 1, createdAt: -1 }, { name: 'category_priority_created_compound' }),
      db.collection('notifications').createIndex({ status: 1, createdAt: -1 }, { name: 'status_created_compound' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ notifications 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 notifications 集合...');
    await db.dropCollection('notifications');
    console.log('✅ notifications 集合刪除完成');
  }
};

module.exports = migration;