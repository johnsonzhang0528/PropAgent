/**
 * MongoDB 遷移腳本: 005_create_documents_table
 * 創建文件集合和相關索引
 * 基於 src/models/Document.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 documents 集合和索引...');
    
    // 創建 documents 集合
    await db.createCollection('documents', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['filename', 'originalName', 'mimetype', 'size', 'path', 'uploadedBy', 'category', 'checksum', 'status'],
          properties: {
            filename: {
              bsonType: 'string',
              description: '文件名稱'
            },
            originalName: {
              bsonType: 'string',
              description: '原始文件名稱'
            },
            mimetype: {
              bsonType: 'string',
              description: 'MIME 類型'
            },
            size: {
              bsonType: 'number',
              minimum: 0,
              description: '文件大小（位元組）'
            },
            path: {
              bsonType: 'string',
              description: '文件路徑'
            },
            uploadedBy: {
              bsonType: 'objectId',
              description: '上傳者 ID'
            },
            uploadedAt: {
              bsonType: 'date',
              description: '上傳時間'
            },
            description: {
              bsonType: ['string', 'null'],
              maxLength: 1000,
              description: '文件描述'
            },
            tags: {
              bsonType: ['array', 'null'],
              items: {
                bsonType: 'string'
              },
              description: '標籤'
            },
            category: {
              bsonType: 'string',
              enum: ['property', 'customer', 'contract', 'other'],
              description: '文件分類'
            },
            relatedTo: {
              bsonType: ['object', 'null'],
              properties: {
                type: {
                  bsonType: 'string',
                  enum: ['property', 'customer']
                },
                id: {
                  bsonType: 'objectId'
                }
              },
              description: '關聯對象'
            },
            isPublic: {
              bsonType: 'bool',
              description: '是否公開'
            },
            metadata: {
              bsonType: ['object', 'null'],
              properties: {
                width: {
                  bsonType: ['number', 'null'],
                  description: '圖片寬度'
                },
                height: {
                  bsonType: ['number', 'null'],
                  description: '圖片高度'
                },
                duration: {
                  bsonType: ['number', 'null'],
                  description: '影片/音檔時長'
                },
                pages: {
                  bsonType: ['number', 'null'],
                  description: '頁數'
                }
              },
              description: '文件元資料'
            },
            checksum: {
              bsonType: 'string',
              description: '校驗和'
            },
            version: {
              bsonType: 'number',
              minimum: 1,
              description: '版本號'
            },
            parentDocument: {
              bsonType: ['objectId', 'null'],
              description: '父文件 ID'
            },
            status: {
              bsonType: 'string',
              enum: ['active', 'archived', 'deleted'],
              description: '文件狀態'
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
      db.collection('documents').createIndex({ filename: 1 }, { name: 'filename_index' }),
      db.collection('documents').createIndex({ uploadedAt: -1 }, { name: 'uploadedAt_desc' }),
      db.collection('documents').createIndex({ category: 1 }, { name: 'category_index' }),
      db.collection('documents').createIndex({ isPublic: 1 }, { name: 'isPublic_index' }),
      db.collection('documents').createIndex({ checksum: 1 }, { name: 'checksum_index' }),
      db.collection('documents').createIndex({ status: 1 }, { name: 'status_index' }),
      // 複合索引
      db.collection('documents').createIndex({ uploadedBy: 1, uploadedAt: -1 }, { name: 'uploadedBy_uploadedAt_compound' }),
      db.collection('documents').createIndex({ category: 1, status: 1 }, { name: 'category_status_compound' }),
      db.collection('documents').createIndex({ 'relatedTo.type': 1, 'relatedTo.id': 1 }, { name: 'relatedTo_compound' }),
      db.collection('documents').createIndex({ tags: 1 }, { name: 'tags_index' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ documents 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 documents 集合...');
    await db.dropCollection('documents');
    console.log('✅ documents 集合刪除完成');
  }
};

module.exports = migration;