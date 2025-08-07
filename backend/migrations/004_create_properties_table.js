/**
 * MongoDB 遷移腳本: 004_create_properties_table
 * 創建房產集合和相關索引
 * 基於 src/models/Property.ts 模型
 */

const { MongoClient } = require('mongodb');

const migration = {
  async up(db) {
    console.log('正在創建 properties 集合和索引...');
    
    // 創建 properties 集合
    await db.createCollection('properties', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['company_id', 'property_type', 'listing_type', 'title', 'address', 'district', 'city', 'price', 'area', 'status'],
          properties: {
            agent_id: {
              bsonType: ['objectId', 'null'],
              description: '關聯的代理人 ID'
            },
            company_id: {
              bsonType: 'objectId',
              description: '關聯的公司 ID'
            },
            property_type: {
              bsonType: 'string',
              enum: ['apartment', 'house', 'commercial', 'land'],
              description: '房產類型'
            },
            listing_type: {
              bsonType: 'string',
              enum: ['sale', 'rent'],
              description: '交易類型'
            },
            title: {
              bsonType: 'string',
              maxLength: 255,
              description: '房產標題'
            },
            description: {
              bsonType: ['string', 'null'],
              description: '房產描述'
            },
            address: {
              bsonType: 'string',
              description: '完整地址'
            },
            district: {
              bsonType: 'string',
              maxLength: 50,
              description: '行政區'
            },
            city: {
              bsonType: 'string',
              maxLength: 50,
              description: '城市'
            },
            postal_code: {
              bsonType: ['string', 'null'],
              maxLength: 10,
              description: '郵遞區號'
            },
            coordinates: {
              bsonType: ['object', 'null'],
              properties: {
                latitude: {
                  bsonType: 'number',
                  minimum: -90,
                  maximum: 90,
                  description: '緯度'
                },
                longitude: {
                  bsonType: 'number',
                  minimum: -180,
                  maximum: 180,
                  description: '經度'
                }
              },
              description: '地理坐標'
            },
            price: {
              bsonType: 'number',
              minimum: 0,
              description: '價格'
            },
            area: {
              bsonType: 'number',
              minimum: 0,
              description: '面積'
            },
            area_unit: {
              bsonType: 'string',
              enum: ['ping', 'sqm', 'sqft'],
              description: '面積單位'
            },
            bedrooms: {
              bsonType: ['number', 'null'],
              minimum: 0,
              maximum: 20,
              description: '房間數'
            },
            bathrooms: {
              bsonType: ['number', 'null'],
              minimum: 0,
              maximum: 20,
              description: '浴室數'
            },
            parking_spots: {
              bsonType: ['number', 'null'],
              minimum: 0,
              maximum: 10,
              description: '停車位數'
            },
            floor: {
              bsonType: ['number', 'null'],
              minimum: -5,
              maximum: 200,
              description: '樓層'
            },
            total_floors: {
              bsonType: ['number', 'null'],
              minimum: 1,
              maximum: 200,
              description: '總樓層'
            },
            building_age: {
              bsonType: ['number', 'null'],
              minimum: 0,
              maximum: 100,
              description: '屋齡'
            },
            features: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: '房產特色'
            },
            amenities: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: '設施'
            },
            transport_info: {
              bsonType: 'object',
              properties: {
                mrt_stations: {
                  bsonType: ['array', 'null'],
                  items: {
                    bsonType: 'string'
                  },
                  description: '捷運站'
                },
                bus_stops: {
                  bsonType: ['array', 'null'],
                  items: {
                    bsonType: 'string'
                  },
                  description: '公車站'
                },
                distance_to_mrt: {
                  bsonType: ['number', 'null'],
                  minimum: 0,
                  description: '距離捷運站距離（公尺）'
                }
              },
              description: '交通資訊'
            },
            school_district: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: '學區'
            },
            status: {
              bsonType: 'string',
              enum: ['available', 'pending', 'sold', 'rented', 'withdrawn'],
              description: '房產狀態'
            },
            available_from: {
              bsonType: ['date', 'null'],
              description: '可入住/看房日期'
            },
            images: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: '房產圖片'
            },
            documents: {
              bsonType: 'array',
              items: {
                bsonType: 'string'
              },
              description: '相關文件'
            },
            virtual_tour_url: {
              bsonType: ['string', 'null'],
              description: '虛擬看房 URL'
            },
            listing_expires_at: {
              bsonType: ['date', 'null'],
              description: '刊登到期日'
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
      db.collection('properties').createIndex({ property_type: 1 }, { name: 'property_type_index' }),
      db.collection('properties').createIndex({ listing_type: 1 }, { name: 'listing_type_index' }),
      db.collection('properties').createIndex({ district: 1 }, { name: 'district_index' }),
      db.collection('properties').createIndex({ city: 1 }, { name: 'city_index' }),
      db.collection('properties').createIndex({ price: 1 }, { name: 'price_index' }),
      db.collection('properties').createIndex({ area: 1 }, { name: 'area_index' }),
      db.collection('properties').createIndex({ status: 1 }, { name: 'status_index' }),
      db.collection('properties').createIndex({ bedrooms: 1 }, { name: 'bedrooms_index' }),
      db.collection('properties').createIndex({ agent_id: 1 }, { name: 'agent_id_index' }),
      db.collection('properties').createIndex({ company_id: 1 }, { name: 'company_id_index' }),
      db.collection('properties').createIndex({ created_at: -1 }, { name: 'created_at_desc' }),
      // 複合索引
      db.collection('properties').createIndex({ property_type: 1, listing_type: 1 }, { name: 'property_listing_type_compound' }),
      db.collection('properties').createIndex({ district: 1, property_type: 1 }, { name: 'district_property_type_compound' }),
      db.collection('properties').createIndex({ price: 1, area: 1 }, { name: 'price_area_compound' }),
      db.collection('properties').createIndex({ status: 1, listing_type: 1 }, { name: 'status_listing_type_compound' }),
      // 地理位置索引
      db.collection('properties').createIndex({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 }, { name: 'coordinates_2d' })
    ];

    await Promise.all(indexPromises);
    
    console.log('✅ properties 集合和索引創建完成');
  },

  async down(db) {
    console.log('正在刪除 properties 集合...');
    await db.dropCollection('properties');
    console.log('✅ properties 集合刪除完成');
  }
};

module.exports = migration;