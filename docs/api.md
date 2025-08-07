# PropAgent Pro API 文檔

PropAgent Pro 是一個智能房地產 CRM 系統的完整 API 文檔。本文檔涵蓋了所有可用的 API 端點、請求/回應格式、認證方式和錯誤處理。

## 目錄

- [基本資訊](#基本資訊)
- [認證系統](#認證系統)
- [用戶認證 API](#用戶認證-api)
- [客戶管理 API](#客戶管理-api)
- [房產管理 API](#房產管理-api)
- [數據分析 API](#數據分析-api)
- [文檔管理 API](#文檔管理-api)
- [通知系統 API](#通知系統-api)
- [備份管理 API](#備份管理-api)
- [安全管理 API](#安全管理-api)
- [錯誤處理](#錯誤處理)

---

## 基本資訊

- **Base URL**: `http://localhost:3000/api`
- **API 版本**: v1
- **內容類型**: `application/json`
- **字元編碼**: UTF-8
- **時區**: UTC+8 (台北時間)

---

## 認證系統

所有 API 請求（除了登錄和註冊）都需要 JWT 認證。在請求標頭中包含：

```http
Authorization: Bearer <your-jwt-token>
```

### Token 格式
- **Access Token**: 有效期 15 分鐘
- **Refresh Token**: 有效期 7 天
- **格式**: JWT (JSON Web Token)

---

## 用戶認證 API

基路由：`/api/auth`

### 1. 用戶註冊

**POST** `/auth/register`

註冊新用戶帳號。

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "張三",
  "role": "agent"
}
```

**成功回應 (201)**:
```json
{
  "message": "註冊成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "648f8c8e9a8b4c8d8e8f8g8h",
    "email": "user@example.com",
    "name": "張三",
    "role": "agent"
  }
}
```

**錯誤回應 (400)**:
```json
{
  "message": "郵箱已被註冊"
}
```

### 2. 用戶登錄

**POST** `/auth/login`

使用郵箱和密碼登錄，支援開發模式臨時登錄。

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900,
    "user": {
      "id": "648f8c8e9a8b4c8d8e8f8g8h",
      "email": "user@example.com",
      "name": "張三",
      "role": "agent",
      "company_id": "648f8c8e9a8b4c8d8e8f8g8i"
    }
  }
}
```

**開發模式測試憑證**:
- 郵箱: `test@example.com`
- 密碼: `test123`

### 3. 發送手機驗證碼

**POST** `/auth/send-sms`

向指定手機號發送驗證碼。

**請求體**:
```json
{
  "phone": "+886912345678"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "message": "驗證碼已發送",
    "expires_in": 300
  }
}
```

### 4. 手機驗證碼登錄

**POST** `/auth/login-sms`

使用手機號和驗證碼登錄。

**請求體**:
```json
{
  "phone": "+886912345678",
  "smsCode": "123456"
}
```

**成功回應格式與普通登錄相同**

### 5. 獲取當前用戶信息

**GET** `/auth/me`

獲取當前登錄用戶的詳細信息。

**請求標頭**:
```http
Authorization: Bearer <token>
```

**成功回應 (200)**:
```json
{
  "id": "648f8c8e9a8b4c8d8e8f8g8h",
  "email": "user@example.com",
  "name": "張三",
  "role": "agent",
  "company_id": "648f8c8e9a8b4c8d8e8f8g8i",
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_login_at": "2024-01-15T08:30:00.000Z"
}
```

### 6. 刷新訪問令牌

**POST** `/auth/refresh`

使用 Refresh Token 獲取新的 Access Token。

**請求體**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

### 7. 忘記密碼

**POST** `/auth/forgot-password`

發送密碼重置郵件。

**請求體**:
```json
{
  "email": "user@example.com"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "message": "如果該郵箱已註冊，將收到重置密碼郵件"
  }
}
```

### 8. 重置密碼

**POST** `/auth/reset-password`

使用重置令牌設置新密碼。

**請求體**:
```json
{
  "token": "reset-token-here",
  "new_password": "newpassword123"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "message": "密碼重置成功"
  }
}
```

---

## 客戶管理 API

基路由：`/api/customers`

### 1. 獲取客戶列表

**GET** `/customers`

獲取客戶列表，支援分頁、搜尋和篩選。

**查詢參數**:
```
page=1&limit=10&search=張&status=active&agent_id=648f8c8e9a8b4c8d8e8f8g8h&tags=VIP,高意願&sort_by=last_contact_at&sort_order=desc
```

- `page` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20，最大 100
- `search` (可選): 搜尋關鍵字（姓名、電話、郵箱）
- `status` (可選): 客戶狀態 (active, completed, lost, inactive)
- `agent_id` (可選): 業務員 ID
- `tags` (可選): 標籤篩選，逗號分隔
- `sort_by` (可選): 排序欄位，預設 created_at
- `sort_order` (可選): 排序方向，預設 desc

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "648f8c8e9a8b4c8d8e8f8g8h",
        "first_name": "張",
        "last_name": "三",
        "phone": "+886912345678",
        "email": "zhang@example.com",
        "status": "active",
        "purchase_intent_score": 8,
        "tags": ["VIP", "高意願"],
        "agent_id": {
          "first_name": "李",
          "last_name": "四",
          "email": "agent@example.com"
        },
        "created_at": "2024-01-01T00:00:00.000Z",
        "last_contact_at": "2024-01-15T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "total_pages": 16
    }
  }
}
```

### 2. 獲取單個客戶詳情

**GET** `/customers/:id`

獲取指定客戶的詳細信息。

**路徑參數**:
- `id`: 客戶 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "648f8c8e9a8b4c8d8e8f8g8h",
      "first_name": "張",
      "last_name": "三",
      "phone": "+886912345678",
      "email": "zhang@example.com",
      "line_id": "zhangsan123",
      "wechat_id": "zhangsan_wechat",
      "gender": "male",
      "age": 35,
      "occupation": "工程師",
      "annual_income": 1200000,
      "marital_status": "married",
      "family_members": 3,
      "source": "website",
      "referral_source": "Google",
      "status": "active",
      "purchase_intent_score": 8,
      "tags": ["VIP", "高意願"],
      "notes": "對市中心物件有興趣",
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com",
        "phone": "+886987654321"
      },
      "company_id": {
        "name": "PropAgent Pro 房仲"
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "last_contact_at": "2024-01-15T08:30:00.000Z"
    }
  }
}
```

**錯誤回應 (404)**:
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "客戶不存在"
  }
}
```

### 3. 創建新客戶

**POST** `/customers`

創建新的客戶記錄。

**請求體**:
```json
{
  "first_name": "王",
  "last_name": "五",
  "phone": "+886911111111",
  "email": "wang@example.com",
  "line_id": "wangwu123",
  "wechat_id": "wangwu_wechat",
  "gender": "female",
  "age": 28,
  "occupation": "設計師",
  "annual_income": 800000,
  "marital_status": "single",
  "family_members": 1,
  "source": "referral",
  "referral_source": "朋友介紹",
  "tags": ["首購族"],
  "notes": "預算 2000 萬以內"
}
```

**成功回應 (201)**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "648f8c8e9a8b4c8d8e8f8g8j",
      "first_name": "王",
      "last_name": "五",
      "phone": "+886911111111",
      "email": "wang@example.com",
      "status": "active",
      "purchase_intent_score": 5,
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com"
      },
      "created_at": "2024-01-15T09:00:00.000Z",
      "last_contact_at": "2024-01-15T09:00:00.000Z"
    }
  }
}
```

**錯誤回應 (400)**:
```json
{
  "success": false,
  "error": {
    "code": "PHONE_EXISTS",
    "message": "該手機號已被其他客戶使用"
  }
}
```

### 4. 更新客戶信息

**PUT** `/customers/:id`

更新指定客戶的信息。

**路徑參數**:
- `id`: 客戶 ID

**請求體** (可包含任何客戶欄位):
```json
{
  "purchase_intent_score": 9,
  "tags": ["VIP", "高意願", "即將成交"],
  "notes": "已看過 3 個物件，對 A 案最有興趣",
  "annual_income": 1500000,
  "status": "active"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "648f8c8e9a8b4c8d8e8f8g8h",
      "first_name": "張",
      "last_name": "三",
      "purchase_intent_score": 9,
      "tags": ["VIP", "高意願", "即將成交"],
      "annual_income": 1500000,
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com"
      }
    }
  }
}
```

### 5. 刪除客戶

**DELETE** `/customers/:id`

軟刪除指定客戶（僅管理員可執行）。

**路徑參數**:
- `id`: 客戶 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "message": "客戶已刪除"
  }
}
```

**錯誤回應 (403)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "沒有權限刪除客戶"
  }
}
```

### 6. 更新客戶意願評分

**PATCH** `/customers/:id/intent-score`

更新客戶的購買意願評分。

**路徑參數**:
- `id`: 客戶 ID

**請求體**:
```json
{
  "score": 9,
  "reason": "已確定購買意向，正在選擇物件"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "customer_id": "648f8c8e9a8b4c8d8e8f8g8h",
    "new_score": 9,
    "message": "意願評分已更新"
  }
}
```

**錯誤回應 (400)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SCORE",
    "message": "評分必須是0-10之間的數字"
  }
}
```

### 7. 客戶統計概覽

**GET** `/customers/stats/overview`

獲取客戶統計概覽。

**查詢參數**:
- `agent_id` (可選): 業務員 ID（管理員和經理可使用）

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "total_customers": 256,
    "active_customers": 198,
    "completed_customers": 45,
    "lost_customers": 13,
    "high_intent_customers": 67,
    "average_intent_score": 6.8,
    "conversion_rate": "17.58"
  }
}
```

---

## 房產管理 API

基路由：`/api/properties`

### 1. 獲取房產列表

**GET** `/properties`

獲取房產列表，支援分頁、搜尋和篩選。

**查詢參數**:
```
page=1&limit=20&property_type=apartment&listing_type=sale&min_price=10000000&max_price=50000000&min_area=20&max_area=60&district=信義區&bedrooms=3&status=available&agent_id=648f8c8e9a8b4c8d8e8f8g8h&sort_by=price&sort_order=asc
```

- `page` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20
- `property_type` (可選): 房產類型 (apartment, house, villa, office, etc.)
- `listing_type` (可選): 交易類型 (sale, rent)
- `min_price`, `max_price` (可選): 價格範圍
- `min_area`, `max_area` (可選): 面積範圍
- `district` (可選): 行政區（支援模糊搜尋）
- `bedrooms` (可選): 房間數
- `status` (可選): 狀態，預設 available (available, sold, rented, withdrawn)
- `agent_id` (可選): 業務員 ID
- `sort_by` (可選): 排序欄位，預設 created_at
- `sort_order` (可選): 排序方向，預設 desc

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "648f8c8e9a8b4c8d8e8f8g8k",
        "property_type": "apartment",
        "listing_type": "sale",
        "title": "市中心精華三房",
        "description": "交通便利，生活機能完善",
        "address": "台北市中正區忠孝東路一段123號",
        "district": "中正區",
        "city": "台北市",
        "price": 25000000,
        "area": 35.5,
        "area_unit": "ping",
        "bedrooms": 3,
        "bathrooms": 2,
        "parking_spots": 1,
        "floor": 8,
        "total_floors": 15,
        "building_age": 5,
        "status": "available",
        "features": ["電梯", "陽台", "停車位"],
        "amenities": ["健身房", "游泳池", "管理員"],
        "agent_id": {
          "first_name": "李",
          "last_name": "四",
          "email": "agent@example.com",
          "phone": "+886987654321"
        },
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 89,
      "total_pages": 5
    }
  }
}
```

### 2. 獲取單個房產詳情

**GET** `/properties/:id`

獲取指定房產的詳細信息。

**路徑參數**:
- `id`: 房產 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "648f8c8e9a8b4c8d8e8f8g8k",
      "property_type": "apartment",
      "listing_type": "sale",
      "title": "豪華四房景觀宅",
      "description": "市中心精華地段，360度景觀視野",
      "address": "台北市信義區基隆路一段456號",
      "district": "信義區",
      "city": "台北市",
      "postal_code": "110",
      "coordinates": {
        "latitude": 25.0330,
        "longitude": 121.5654
      },
      "price": 45000000,
      "area": 50.2,
      "area_unit": "ping",
      "bedrooms": 4,
      "bathrooms": 3,
      "parking_spots": 2,
      "floor": 20,
      "total_floors": 25,
      "building_age": 2,
      "status": "available",
      "features": ["電梯", "陽台", "雙停車位", "景觀"],
      "amenities": ["健身房", "游泳池", "管理員", "會議室"],
      "transport_info": {
        "mrt_stations": ["市政府站", "信義安和站"],
        "bus_stops": ["基隆路口", "信義路口"],
        "distance_to_station": 300
      },
      "school_district": "信義國小, 信義國中",
      "available_from": "2024-02-01",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "documents": [
        {
          "id": "648f8c8e9a8b4c8d8e8f8g8l",
          "name": "權狀.pdf",
          "type": "ownership"
        }
      ],
      "virtual_tour_url": "https://example.com/tour/123",
      "listing_expires_at": "2024-12-31T23:59:59.000Z",
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com",
        "phone": "+886987654321"
      },
      "company_id": {
        "name": "PropAgent Pro 房仲"
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T08:30:00.000Z"
    }
  }
}
```

### 3. 創建新房產

**POST** `/properties`

創建新的房產記錄。

**請求體**:
```json
{
  "property_type": "apartment",
  "listing_type": "sale",
  "title": "豪華四房景觀宅",
  "description": "市中心精華地段，360度景觀視野",
  "address": "台北市信義區基隆路一段456號",
  "district": "信義區",
  "city": "台北市",
  "postal_code": "110",
  "coordinates": {
    "latitude": 25.0330,
    "longitude": 121.5654
  },
  "price": 45000000,
  "area": 50.2,
  "area_unit": "ping",
  "bedrooms": 4,
  "bathrooms": 3,
  "parking_spots": 2,
  "floor": 20,
  "total_floors": 25,
  "building_age": 2,
  "features": ["電梯", "陽台", "雙停車位", "景觀"],
  "amenities": ["健身房", "游泳池", "管理員", "會議室"],
  "transport_info": {
    "mrt_stations": ["市政府站", "信義安和站"],
    "bus_stops": ["基隆路口", "信義路口"],
    "distance_to_station": 300
  },
  "school_district": "信義國小, 信義國中",
  "available_from": "2024-02-01",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "documents": [],
  "virtual_tour_url": "https://example.com/tour/123",
  "listing_expires_at": "2024-12-31"
}
```

**成功回應 (201)**:
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "648f8c8e9a8b4c8d8e8f8g8k",
      "title": "豪華四房景觀宅",
      "price": 45000000,
      "status": "available",
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com"
      },
      "created_at": "2024-01-15T09:00:00.000Z"
    }
  }
}
```

### 4. 更新房產信息

**PUT** `/properties/:id`

更新指定房產的信息。

**路徑參數**:
- `id`: 房產 ID

**請求體** (可包含任何房產欄位):
```json
{
  "price": 48000000,
  "status": "available",
  "description": "市中心精華地段，360度景觀視野，近期降價",
  "listing_expires_at": "2024-12-31"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "648f8c8e9a8b4c8d8e8f8g8k",
      "title": "豪華四房景觀宅",
      "price": 48000000,
      "status": "available",
      "agent_id": {
        "first_name": "李",
        "last_name": "四",
        "email": "agent@example.com"
      },
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 5. 刪除房產

**DELETE** `/properties/:id`

軟刪除指定房產（狀態改為 withdrawn）。

**路徑參數**:
- `id`: 房產 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "message": "物件已刪除"
  }
}
```

### 6. 智能客戶配對

**GET** `/properties/:id/matches`

為指定房產匹配最合適的客戶。

**路徑參數**:
- `id`: 房產 ID

**查詢參數**:
- `limit` (可選): 返回結果數量，預設 10

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "property_id": "648f8c8e9a8b4c8d8e8f8g8k",
    "property_title": "市中心精華三房",
    "matched_customers": [
      {
        "_id": "648f8c8e9a8b4c8d8e8f8g8h",
        "first_name": "張",
        "last_name": "三",
        "phone": "+886912345678",
        "email": "zhang@example.com",
        "purchase_intent_score": 9,
        "tags": ["VIP", "高意願"],
        "last_contact_at": "2024-01-15T08:30:00.000Z",
        "match_score": 85,
        "agent": {
          "first_name": "李",
          "last_name": "四"
        }
      }
    ],
    "total_matches": 12
  }
}
```

**配對評分算法**:
- 基礎分數 (活躍客戶): 20 分
- 購買意願評分: 0-50 分 (意願分數 × 5)
- 最近聯繫時間: 0-20 分 (7 天內 20 分，30 天內 10 分)
- 高意願客戶加分: 0-10 分 (意願分數 ≥ 7)

### 7. 房產統計概覽

**GET** `/properties/stats/overview`

獲取房產統計概覽。

**查詢參數**:
- `agent_id` (可選): 業務員 ID（管理員和經理可使用）

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "total_properties": 89,
    "available_properties": 72,
    "sold_properties": 12,
    "rented_properties": 5,
    "average_price": 28500000,
    "total_portfolio_value": 2536500000,
    "success_rate": "19.10"
  }
}
```

---

## 數據分析 API

基路由：`/api/analytics`

### 1. 客戶統計數據

**GET** `/analytics/customer-stats`

獲取客戶相關統計數據。

**成功回應 (200)**:
```json
{
  "total_customers": 256,
  "active_customers": 198,
  "potential_customers": 67,
  "completed_customers": 45,
  "success_rate": "17.6"
}
```

### 2. 客戶狀態分布

**GET** `/analytics/customer-status-distribution`

獲取客戶狀態分布數據。

**成功回應 (200)**:
```json
[
  {
    "status": "active",
    "count": 198
  },
  {
    "status": "completed",
    "count": 45
  },
  {
    "status": "lost",
    "count": 13
  }
]
```

### 3. 購買意願分數分布

**GET** `/analytics/purchase-intent-distribution`

獲取客戶購買意願評分分布。

**成功回應 (200)**:
```json
[
  {
    "scoreRange": "9-10",
    "count": 23
  },
  {
    "scoreRange": "8-9",
    "count": 44
  },
  {
    "scoreRange": "7-8",
    "count": 67
  },
  {
    "scoreRange": "6-7",
    "count": 45
  },
  {
    "scoreRange": "5-6",
    "count": 32
  },
  {
    "scoreRange": "0-5",
    "count": 45
  }
]
```

### 4. 房產統計數據

**GET** `/analytics/property-stats`

獲取房產相關統計數據。

**成功回應 (200)**:
```json
{
  "total_properties": 89,
  "available_properties": 72,
  "sold_properties": 12,
  "reserved_properties": 5,
  "average_price": 28500000
}
```

### 5. 價格區間分布

**GET** `/analytics/price-range-distribution`

獲取房產價格區間分布。

**成功回應 (200)**:
```json
[
  {
    "priceRange": "1000萬以上",
    "count": 25
  },
  {
    "priceRange": "500-1000萬",
    "count": 32
  },
  {
    "priceRange": "300-500萬",
    "count": 18
  },
  {
    "priceRange": "200-300萬",
    "count": 8
  },
  {
    "priceRange": "100-200萬",
    "count": 4
  },
  {
    "priceRange": "100萬以下",
    "count": 2
  }
]
```

### 6. 月度趨勢數據

**GET** `/analytics/monthly-trends`

獲取客戶和房產的月度趨勢數據。

**成功回應 (200)**:
```json
{
  "customer_trends": [
    {
      "year": 2024,
      "month": 1,
      "count": 23
    },
    {
      "year": 2024,
      "month": 2,
      "count": 18
    }
  ],
  "property_trends": [
    {
      "year": 2024,
      "month": 1,
      "count": 12
    },
    {
      "year": 2024,
      "month": 2,
      "count": 8
    }
  ]
}
```

### 7. 地區分布數據

**GET** `/analytics/location-distribution`

獲取房產地區分布統計。

**成功回應 (200)**:
```json
{
  "property_distribution": [
    {
      "district": "信義區",
      "count": 25,
      "averagePrice": 45000000
    },
    {
      "district": "大安區",
      "count": 18,
      "averagePrice": 38000000
    },
    {
      "district": "中正區",
      "count": 12,
      "averagePrice": 32000000
    }
  ]
}
```

---

## 文檔管理 API

基路由：`/api/documents`

### 1. 上傳文檔

**POST** `/documents/upload`

上傳一個或多個文檔文件。

**請求格式**: `multipart/form-data`

**請求參數**:
- `files`: 文件 (支援多檔案上傳，最多 10 個)
- `category` (可選): 文檔類別，預設 "other"
- `description` (可選): 文檔描述
- `tags` (可選): 標籤，以逗號分隔
- `relatedType` (可選): 關聯類型 (customer, property, contract, etc.)
- `relatedId` (可選): 關聯對象 ID
- `isPublic` (可選): 是否公開，預設 false

**CURL 範例**:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@contract.pdf" \
  -F "files=@floor_plan.jpg" \
  -F "category=contract" \
  -F "description=客戶合約和平面圖" \
  -F "tags=重要,合約,平面圖" \
  -F "relatedType=customer" \
  -F "relatedId=648f8c8e9a8b4c8d8e8f8g8h" \
  -F "isPublic=false"
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "處理完成：成功 2 個，失敗 0 個",
  "results": [
    {
      "filename": "contract.pdf",
      "document": {
        "id": "648f8c8e9a8b4c8d8e8f8g8l",
        "filename": "contract_1705123456789.pdf",
        "originalName": "contract.pdf",
        "mimetype": "application/pdf",
        "size": 2048576,
        "description": "客戶合約",
        "category": "contract",
        "tags": ["重要", "合約"],
        "uploadedBy": "648f8c8e9a8b4c8d8e8f8g8h",
        "isPublic": false,
        "checksum": "abc123def456ghi789",
        "uploadedAt": "2024-01-15T10:00:00.000Z"
      },
      "isDuplicate": false,
      "message": "上傳成功"
    }
  ],
  "failed": [],
  "total": 2,
  "successful": 2,
  "failed_count": 0
}
```

**支援的文件類型**:
- **圖片**: jpg, jpeg, png, gif, webp
- **文檔**: pdf, doc, docx, xls, xlsx, ppt, pptx
- **壓縮檔**: zip, rar
- **其他**: txt, csv

**文件大小限制**:
- 單個檔案最大: 50MB
- 圖片檔案最大: 10MB

### 2. 獲取文檔列表

**GET** `/documents`

獲取文檔列表，支援分頁和篩選。

**查詢參數**:
```
page=1&limit=20&category=contract&tags=重要,合約&search=客戶&relatedType=customer&relatedId=648f8c8e9a8b4c8d8e8f8g8h&sortBy=uploadedAt&sortOrder=desc
```

- `page` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20
- `category` (可選): 文檔類別篩選
- `tags` (可選): 標籤篩選，以逗號分隔
- `search` (可選): 搜尋關鍵字（檔名、描述、標籤）
- `relatedType` (可選): 關聯類型
- `relatedId` (可選): 關聯對象 ID
- `sortBy` (可選): 排序欄位，預設 uploadedAt
- `sortOrder` (可選): 排序方向，預設 desc

**成功回應 (200)**:
```json
{
  "success": true,
  "documents": [
    {
      "id": "648f8c8e9a8b4c8d8e8f8g8l",
      "filename": "contract_1705123456789.pdf",
      "originalName": "contract.pdf",
      "mimetype": "application/pdf",
      "size": 2048576,
      "description": "客戶合約",
      "category": "contract",
      "tags": ["重要", "合約"],
      "isPublic": false,
      "uploadedBy": {
        "name": "李四",
        "email": "agent@example.com"
      },
      "relatedTo": {
        "type": "customer",
        "id": {
          "first_name": "張",
          "last_name": "三"
        }
      },
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "icon": "pdf"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. 獲取文檔詳情

**GET** `/documents/:id`

獲取指定文檔的詳細信息。

**路徑參數**:
- `id`: 文檔 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "document": {
    "id": "648f8c8e9a8b4c8d8e8f8g8l",
    "filename": "contract_1705123456789.pdf",
    "originalName": "contract.pdf",
    "mimetype": "application/pdf",
    "size": 2048576,
    "path": "/uploads/contracts/contract_1705123456789.pdf",
    "description": "客戶合約",
    "category": "contract",
    "tags": ["重要", "合約"],
    "isPublic": false,
    "checksum": "abc123def456ghi789",
    "uploadedBy": {
      "name": "李四",
      "email": "agent@example.com"
    },
    "relatedTo": {
      "type": "customer",
      "id": {
        "first_name": "張",
        "last_name": "三",
        "email": "zhang@example.com"
      }
    },
    "uploadedAt": "2024-01-15T10:00:00.000Z",
    "icon": "pdf"
  }
}
```

### 4. 下載文檔

**GET** `/documents/:id/download`

下載指定文檔。

**路徑參數**:
- `id`: 文檔 ID

**成功回應**: 
- 狀態碼: 200
- 內容類型: 文檔原始 MIME 類型
- 標頭: `Content-Disposition: attachment; filename="original_filename"`
- 內容: 文件二進制數據

**錯誤回應 (404)**:
```json
{
  "success": false,
  "message": "文檔不存在"
}
```

### 5. 預覽文檔

**GET** `/documents/:id/preview`

預覽文檔（僅支援圖片和 PDF）。

**路徑參數**:
- `id`: 文檔 ID

**成功回應**: 
- 狀態碼: 200
- 內容類型: 文檔 MIME 類型
- 標頭: `Cache-Control: public, max-age=3600`
- 內容: 文件二進制數據

**錯誤回應 (400)**:
```json
{
  "success": false,
  "message": "該文件類型不支持預覽"
}
```

### 6. 更新文檔信息

**PUT** `/documents/:id`

更新文檔的元數據信息。

**路徑參數**:
- `id`: 文檔 ID

**請求體**:
```json
{
  "description": "更新後的客戶合約描述",
  "tags": ["重要", "合約", "已簽署"],
  "category": "signed_contract",
  "isPublic": false,
  "relatedType": "customer",
  "relatedId": "648f8c8e9a8b4c8d8e8f8g8h"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "文檔信息更新成功",
  "document": {
    "id": "648f8c8e9a8b4c8d8e8f8g8l",
    "description": "更新後的客戶合約描述",
    "tags": ["重要", "合約", "已簽署"],
    "category": "signed_contract",
    "uploadedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### 7. 刪除文檔

**DELETE** `/documents/:id`

軟刪除指定文檔（僅上傳者可刪除）。

**路徑參數**:
- `id`: 文檔 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "文檔刪除成功"
}
```

**錯誤回應 (403)**:
```json
{
  "success": false,
  "message": "沒有權限刪除此文檔"
}
```

### 8. 文檔統計

**GET** `/documents/stats/summary`

獲取文檔統計摘要。

**成功回應 (200)**:
```json
{
  "success": true,
  "stats": {
    "totalDocuments": 245,
    "userDocuments": 67,
    "totalStorage": 1073741824,
    "totalStorageFormatted": "1.00 GB",
    "categoriesStats": [
      {
        "_id": "contract",
        "count": 89,
        "size": 456789123
      },
      {
        "_id": "photo",
        "count": 134,
        "size": 523456789
      }
    ],
    "recentDocuments": [
      {
        "id": "648f8c8e9a8b4c8d8e8f8g8l",
        "originalName": "latest_contract.pdf",
        "uploadedAt": "2024-01-15T10:00:00.000Z",
        "uploadedBy": {
          "name": "李四"
        },
        "icon": "pdf"
      }
    ]
  }
}
```

---

## 通知系統 API

基路由：`/api/notifications`

### 1. 獲取通知列表

**GET** `/notifications`

獲取用戶的通知列表。

**查詢參數**:
```
page=1&limit=20&category=customer&type=email&isRead=false&priority=high
```

- `page` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20
- `category` (可選): 通知類別 (customer, property, system, reminder, document)
- `type` (可選): 通知類型 (system, email, sms)
- `isRead` (可選): 是否已讀 (true/false)
- `priority` (可選): 優先級 (low, normal, high, urgent)

**成功回應 (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "648f8c8e9a8b4c8d8e8f8g8m",
      "type": "system",
      "category": "customer",
      "title": "新客戶註冊",
      "message": "客戶張三已完成註冊，請及時跟進",
      "priority": "normal",
      "isRead": false,
      "isArchived": false,
      "sender": {
        "name": "系統",
        "email": "system@propagent.com"
      },
      "recipient": {
        "type": "user",
        "id": "648f8c8e9a8b4c8d8e8f8g8h"
      },
      "scheduledAt": null,
      "expiresAt": "2024-01-22T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "readAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 67,
    "pages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. 獲取未讀通知數量

**GET** `/notifications/unread-count`

獲取當前用戶的未讀通知數量。

**成功回應 (200)**:
```json
{
  "success": true,
  "count": 12
}
```

### 3. 獲取通知統計

**GET** `/notifications/stats`

獲取用戶通知統計信息。

**成功回應 (200)**:
```json
{
  "success": true,
  "stats": {
    "total": 156,
    "unread": 12,
    "urgent": 3,
    "failed": 2
  }
}
```

### 4. 標記通知為已讀

**PUT** `/notifications/:id/read`

標記指定通知為已讀。

**路徑參數**:
- `id`: 通知 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "通知已標記為已讀",
  "notification": {
    "id": "648f8c8e9a8b4c8d8e8f8g8m",
    "isRead": true,
    "readAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5. 批量標記為已讀

**PUT** `/notifications/batch/read`

批量標記多個通知為已讀。

**請求體**:
```json
{
  "ids": [
    "648f8c8e9a8b4c8d8e8f8g8m",
    "648f8c8e9a8b4c8d8e8f8g8n",
    "648f8c8e9a8b4c8d8e8f8g8o"
  ]
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "成功標記 3 個通知為已讀",
  "modifiedCount": 3
}
```

### 6. 歸檔通知

**PUT** `/notifications/:id/archive`

歸檔指定通知。

**路徑參數**:
- `id`: 通知 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "通知已歸檔",
  "notification": {
    "id": "648f8c8e9a8b4c8d8e8f8g8m",
    "isArchived": true,
    "archivedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### 7. 發送自定義通知

**POST** `/notifications/send`

發送自定義通知。

**請求體**:
```json
{
  "type": "email",
  "category": "reminder",
  "title": "跟進提醒",
  "message": "請記得今天下午 3 點聯繫客戶王五討論購房意向",
  "recipientId": "648f8c8e9a8b4c8d8e8f8g8h",
  "recipientType": "user",
  "priority": "high",
  "recipientEmail": "agent@example.com",
  "scheduledAt": "2024-01-16T15:00:00.000Z",
  "expiresAt": "2024-01-20T00:00:00.000Z"
}
```

**可用選項**:
- `type`: "system", "email", "sms"
- `category`: "customer", "property", "system", "reminder", "document"
- `priority`: "low", "normal", "high", "urgent"
- `recipientType`: "user", "customer", "all"

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "通知創建成功",
  "notification": {
    "id": "648f8c8e9a8b4c8d8e8f8g8p",
    "type": "email",
    "title": "跟進提醒",
    "status": "scheduled",
    "scheduledAt": "2024-01-16T15:00:00.000Z",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 8. 重試失敗的通知

**POST** `/notifications/:id/retry`

重新發送失敗的通知。

**路徑參數**:
- `id`: 通知 ID

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "通知已重新加入發送隊列",
  "notification": {
    "id": "648f8c8e9a8b4c8d8e8f8g8m",
    "status": "pending",
    "retryCount": 1
  }
}
```

### 9. 獲取通知模板

**GET** `/notifications/templates`

獲取可用的通知模板列表。

**成功回應 (200)**:
```json
{
  "success": true,
  "templates": [
    {
      "id": "new_customer",
      "name": "新客戶註冊",
      "category": "customer",
      "description": "當有新客戶註冊時發送通知"
    },
    {
      "id": "customer_status_change",
      "name": "客戶狀態變更",
      "category": "customer",
      "description": "當客戶狀態發生變更時發送通知"
    },
    {
      "id": "new_property",
      "name": "新房產上架",
      "category": "property",
      "description": "當有新房產上架時發送通知"
    },
    {
      "id": "price_change",
      "name": "房產價格變更",
      "category": "property",
      "description": "當房產價格發生變更時發送通知"
    },
    {
      "id": "follow_up_reminder",
      "name": "跟進提醒",
      "category": "reminder",
      "description": "客戶跟進提醒通知"
    },
    {
      "id": "contract_expiry",
      "name": "合約到期提醒",
      "category": "reminder",
      "description": "合約即將到期提醒"
    }
  ]
}
```

### 10. 測試郵件服務

**POST** `/notifications/test-email`

發送測試郵件。

**請求體**:
```json
{
  "to": "test@example.com",
  "subject": "測試郵件",
  "message": "這是一封測試郵件，用於驗證郵件服務是否正常工作"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "測試郵件發送成功"
}
```

---

## 備份管理 API

基路由：`/api/backup`

### 1. 創建備份

**POST** `/backup/create`

手動創建系統備份。

**請求體**:
```json
{
  "type": "full"
}
```

**可用類型**:
- `full`: 完整備份 (數據庫 + 文件 + 壓縮)
- `database`: 僅數據庫備份
- `files`: 僅文件備份

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "備份創建成功",
  "data": {
    "database": "/app/backups/db-backup-2024-01-15T10-00-00-000Z",
    "files": "/app/backups/files-backup-2024-01-15T10-00-00-000Z.zip",
    "compressed": "/app/backups/full-backup-2024-01-15T10-00-00-000Z.zip"
  }
}
```

### 2. 獲取備份列表

**GET** `/backup/list`

獲取所有備份文件列表。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": [
    {
      "name": "full-backup-2024-01-15T10-00-00-000Z.zip",
      "path": "/app/backups/full-backup-2024-01-15T10-00-00-000Z.zip",
      "size": 1073741824,
      "created": "2024-01-15T10:00:00.000Z",
      "type": "full"
    },
    {
      "name": "db-backup-2024-01-14T02-00-00-000Z",
      "path": "/app/backups/db-backup-2024-01-14T02-00-00-000Z",
      "size": 524288000,
      "created": "2024-01-14T02:00:00.000Z",
      "type": "database"
    }
  ],
  "total": 12
}
```

### 3. 下載備份文件

**GET** `/backup/download/:filename`

下載指定的備份文件。

**路徑參數**:
- `filename`: 備份文件名

**成功回應**: 
- 狀態碼: 200
- 內容類型: `application/octet-stream`
- 標頭: `Content-Disposition: attachment; filename="backup_filename"`
- 內容: 備份文件二進制數據

### 4. 恢復數據庫

**POST** `/backup/restore`

從備份恢復數據庫。

**請求體**:
```json
{
  "backupPath": "/app/backups/db-backup-2024-01-15T10-00-00-000Z"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "數據庫恢復成功"
}
```

**⚠️ 警告**: 此操作會覆蓋現有數據庫，請謹慎使用。

### 5. 導出數據

**POST** `/backup/export`

導出數據為 JSON 或 CSV 格式。

**JSON 導出請求體**:
```json
{
  "format": "json"
}
```

**CSV 導出請求體**:
```json
{
  "format": "csv",
  "collection": "customers"
}
```

**可用集合**:
- `customers`: 客戶數據
- `properties`: 房產數據
- `users`: 用戶數據
- `documents`: 文檔數據
- `notifications`: 通知數據

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "數據導出成功",
  "data": {
    "path": "/app/backups/export-2024-01-15T10-30-00-000Z.json"
  }
}
```

### 6. 刪除備份

**DELETE** `/backup/:filename`

刪除指定的備份文件。

**路徑參數**:
- `filename`: 備份文件名

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "備份文件已刪除"
}
```

### 7. 清理過期備份

**POST** `/backup/cleanup`

清理過期的備份文件（根據配置的保留天數）。

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "過期備份清理完成"
}
```

### 8. 獲取備份配置

**GET** `/backup/config`

獲取備份系統的配置信息。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "backupPath": "/app/backups",
    "retention": 30,
    "compression": true,
    "includeFiles": true
  }
}
```

**配置說明**:
- `backupPath`: 備份文件存儲路徑
- `retention`: 備份文件保留天數
- `compression`: 是否啟用壓縮
- `includeFiles`: 是否包含文件備份

**自動備份排程**:
- 每日凌晨 2 點自動執行完整備份
- 自動清理超過保留期的備份文件

---

## 安全管理 API

基路由：`/api/security`

### 1. 獲取安全統計

**GET** `/security/stats`

獲取系統安全統計信息。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRateLimitHits": 145,
      "blockedIPsCount": 8,
      "recentSuspiciousActivity": 23,
      "dailySuspiciousActivity": 67,
      "lastReset": "2024-01-15T00:00:00.000Z"
    },
    "blockedIPs": ["192.168.1.100", "10.0.0.50"],
    "activityByReason": {
      "RATE_LIMIT_EXCEEDED": 89,
      "INVALID_CREDENTIALS": 34,
      "SUSPICIOUS_REQUEST": 12,
      "BLOCKED_IP_ACCESS_ATTEMPT": 8
    },
    "activityByIP": {
      "192.168.1.100": 45,
      "10.0.0.50": 23,
      "203.0.113.15": 12
    },
    "recentActivity": [
      {
        "ip": "192.168.1.100",
        "timestamp": "2024-01-15T11:30:00.000Z",
        "reason": "RATE_LIMIT_EXCEEDED",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ],
    "threatLevel": "medium",
    "systemStatus": {
      "uptime": 86400,
      "memory": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 45678901,
        "heapFree": 21429963,
        "external": 2345678
      },
      "timestamp": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 2. 封鎖 IP

**POST** `/security/block-ip`

手動封鎖指定 IP 地址。

**請求體**:
```json
{
  "ip": "192.168.1.100",
  "reason": "惡意攻擊嘗試"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "IP 192.168.1.100 已被封鎖",
  "data": {
    "ip": "192.168.1.100",
    "reason": "惡意攻擊嘗試"
  }
}
```

### 3. 解除封鎖 IP

**POST** `/security/unblock-ip`

解除對指定 IP 的封鎖。

**請求體**:
```json
{
  "ip": "192.168.1.100"
}
```

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "IP 192.168.1.100 已解除封鎖",
  "data": {
    "ip": "192.168.1.100"
  }
}
```

### 4. 獲取封鎖的 IP 列表

**GET** `/security/blocked-ips`

獲取所有被封鎖的 IP 地址列表。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "blockedIPs": [
      "192.168.1.100",
      "10.0.0.50",
      "203.0.113.15"
    ],
    "count": 3
  }
}
```

### 5. 清除所有封鎖的 IP

**POST** `/security/clear-blocked-ips`

清除所有被封鎖的 IP 地址。

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "已清除 8 個封鎖的 IP",
  "data": {
    "clearedCount": 8
  }
}
```

### 6. 重置安全統計

**POST** `/security/reset-stats`

重置安全統計數據。

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "安全統計已重置"
}
```

### 7. 獲取可疑活動日誌

**GET** `/security/activity-log`

獲取可疑活動的詳細日誌。

**查詢參數**:
```
limit=100&offset=0&ip=192.168.1.100&reason=RATE_LIMIT
```

- `limit` (可選): 限制返回數量，預設 100
- `offset` (可選): 偏移量，預設 0
- `ip` (可選): 按 IP 篩選
- `reason` (可選): 按原因關鍵字篩選

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "ip": "192.168.1.100",
        "timestamp": "2024-01-15T11:30:00.000Z",
        "reason": "RATE_LIMIT_EXCEEDED",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        "ip": "10.0.0.50",
        "timestamp": "2024-01-15T11:25:00.000Z",
        "reason": "INVALID_CREDENTIALS",
        "userAgent": "curl/7.68.0"
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 8. 安全健康檢查

**GET** `/security/health`

檢查系統安全健康狀況。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "threatLevel": "low",
    "blockedIPs": 2,
    "recentActivity": 5,
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

**威脅等級**:
- `low`: 正常狀態
- `medium`: 中等威脅
- `high`: 高威脅
- `critical`: 嚴重威脅

### 9. 威脅情報

**GET** `/security/threat-intelligence`

獲取威脅情報分析報告。

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "threatLevel": "medium",
    "summary": {
      "totalIncidents": 23,
      "blockedIPs": 8,
      "riskScore": 45
    },
    "topThreats": [
      {
        "reason": "RATE_LIMIT_EXCEEDED",
        "count": 89
      },
      {
        "reason": "INVALID_CREDENTIALS",
        "count": 34
      },
      {
        "reason": "SUSPICIOUS_REQUEST",
        "count": 12
      }
    ],
    "topMaliciousIPs": [
      {
        "ip": "192.168.1.100",
        "count": 45
      },
      {
        "ip": "10.0.0.50",
        "count": 23
      }
    ],
    "recommendations": [
      "定期清理過期的 IP 封鎖",
      "檢查封鎖 IP 的地理分佈",
      "加強監控和警報機制"
    ]
  }
}
```

**風險評分算法**:
- 最近活動: 0-40 分
- 封鎖 IP 數量: 0-30 分
- 活動類型多樣性: 0-20 分
- 其他因素: 0-10 分

**自動封鎖規則**:
- 1 小時內同一 IP 超過 10 次可疑活動自動封鎖
- 支援手動封鎖和解除封鎖
- 封鎖記錄會保留在可疑活動日誌中

---

## 錯誤處理

### HTTP 狀態碼

| 狀態碼 | 說明 | 使用場景 |
|--------|------|----------|
| 200 | OK | 請求成功 |
| 201 | Created | 資源創建成功 |
| 400 | Bad Request | 請求格式錯誤或缺少必要參數 |
| 401 | Unauthorized | 未授權，需要登錄 |
| 403 | Forbidden | 禁止訪問，權限不足 |
| 404 | Not Found | 資源不存在 |
| 409 | Conflict | 資源衝突（如重複數據） |
| 422 | Unprocessable Entity | 請求格式正確但包含語義錯誤 |
| 429 | Too Many Requests | 請求過於頻繁，觸發速率限制 |
| 500 | Internal Server Error | 服務器內部錯誤 |
| 503 | Service Unavailable | 服務不可用 |

### 錯誤回應格式

所有錯誤回應都遵循統一格式：

```json
{
  "success": false,
  "message": "用戶友好的錯誤描述",
  "error": {
    "code": "ERROR_CODE",
    "message": "詳細錯誤信息",
    "details": {
      "field": "錯誤相關的欄位信息",
      "value": "導致錯誤的值"
    }
  }
}
```

### 常見錯誤碼

#### 認證相關
| 錯誤碼 | 說明 |
|--------|------|
| `INVALID_CREDENTIALS` | 無效的登錄憑證 |
| `TOKEN_EXPIRED` | 訪問令牌已過期 |
| `INVALID_REFRESH_TOKEN` | 無效的刷新令牌 |
| `ACCOUNT_DISABLED` | 帳戶已被停用 |
| `INVALID_SMS_CODE` | 驗證碼錯誤或已過期 |

#### 權限相關
| 錯誤碼 | 說明 |
|--------|------|
| `FORBIDDEN` | 沒有權限執行此操作 |
| `INSUFFICIENT_PERMISSIONS` | 權限不足 |
| `IP_BLOCKED` | IP 地址已被封鎖 |

#### 數據驗證
| 錯誤碼 | 說明 |
|--------|------|
| `VALIDATION_ERROR` | 數據驗證失敗 |
| `MISSING_REQUIRED_FIELD` | 缺少必需欄位 |
| `INVALID_FORMAT` | 數據格式錯誤 |
| `DUPLICATE_ENTRY` | 重複數據 |
| `INVALID_PHONE` | 無效的手機號格式 |
| `INVALID_SCORE` | 無效的評分值 |

#### 資源相關
| 錯誤碼 | 說明 |
|--------|------|
| `RESOURCE_NOT_FOUND` | 資源不存在 |
| `CUSTOMER_NOT_FOUND` | 客戶不存在 |
| `PROPERTY_NOT_FOUND` | 房產不存在 |
| `DOCUMENT_NOT_FOUND` | 文檔不存在 |
| `USER_NOT_FOUND` | 用戶不存在 |

#### 業務邏輯
| 錯誤碼 | 說明 |
|--------|------|
| `PHONE_EXISTS` | 手機號已被使用 |
| `EMAIL_EXISTS` | 郵箱已被註冊 |
| `FILE_TOO_LARGE` | 文件大小超過限制 |
| `UNSUPPORTED_FILE_TYPE` | 不支援的文件類型 |
| `UPLOAD_FAILED` | 文件上傳失敗 |

#### 系統相關
| 錯誤碼 | 說明 |
|--------|------|
| `INTERNAL_ERROR` | 服務器內部錯誤 |
| `DATABASE_ERROR` | 資料庫錯誤 |
| `EMAIL_SEND_FAILED` | 郵件發送失敗 |
| `BACKUP_FAILED` | 備份操作失敗 |
| `RESTORE_FAILED` | 恢復操作失敗 |

### 速率限制

不同端點有不同的速率限制：

| API 類型 | 時間窗口 | 限制次數 | 說明 |
|----------|----------|----------|------|
| 一般 API | 15 分鐘 | 1000 次 | 大部分 API 端點 |
| 登錄 API | 15 分鐘 | 10 次 | 失敗登錄嘗試 |
| 發送簡訊 | 1 小時 | 5 次 | SMS 驗證碼 |
| 文件上傳 | 1 分鐘 | 10 次 | 文檔上傳 |
| 管理 API | 15 分鐘 | 100 次 | 管理員操作 |

當超過速率限制時，將返回 `429 Too Many Requests` 狀態碼：

```json
{
  "success": false,
  "message": "請求過於頻繁",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "超過速率限制",
    "details": {
      "limit": 1000,
      "window": "15 minutes",
      "retryAfter": 300
    }
  }
}
```

### 錯誤處理最佳實踐

#### 客戶端錯誤處理
```javascript
try {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });

  const data = await response.json();

  if (!response.ok) {
    // 處理錯誤
    switch (data.error?.code) {
      case 'PHONE_EXISTS':
        showError('該手機號已被使用，請使用其他號碼');
        break;
      case 'TOKEN_EXPIRED':
        // 自動刷新 token
        await refreshToken();
        // 重試請求
        break;
      case 'VALIDATION_ERROR':
        showValidationErrors(data.error.details);
        break;
      default:
        showError(data.message || '操作失敗，請稍後再試');
    }
    return;
  }

  // 處理成功回應
  console.log('客戶創建成功:', data.data.customer);
} catch (error) {
  console.error('網路錯誤:', error);
  showError('網路連接失敗，請檢查網路設定');
}
```

#### 重試機制
對於臨時性錯誤（如網路問題、服務暫時不可用），建議實施重試機制：

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status >= 500 && i < maxRetries - 1) {
        // 服務器錯誤，等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // 網路錯誤，等待後重試
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 開發者注意事項

### 1. 時間格式
所有時間都使用 ISO 8601 格式，並以 UTC+8 (台北時間) 為準：
```
2024-01-15T10:30:00.000Z
```

### 2. 分頁參數
統一使用以下分頁參數：
- `page`: 頁碼（從 1 開始）
- `limit`: 每頁數量
- `total`: 總數量
- `total_pages`: 總頁數

### 3. 排序參數
統一使用以下排序參數：
- `sort_by`: 排序欄位
- `sort_order`: 排序方向（`asc` 或 `desc`）

### 4. 搜尋功能
支援模糊搜尋，使用 `search` 參數進行關鍵字搜尋。

### 5. 檔案限制
- 單個檔案最大: 50MB
- 圖片檔案最大: 10MB
- 同時上傳最多: 10 個檔案

### 6. 支援的檔案類型
- **圖片**: jpg, jpeg, png, gif, webp
- **文檔**: pdf, doc, docx, xls, xlsx, ppt, pptx
- **壓縮檔**: zip, rar
- **其他**: txt, csv

### 7. 權限級別
- **admin**: 最高權限，可執行所有操作
- **manager**: 管理級權限，可管理下屬業務員的數據
- **agent**: 業務員權限，只能操作自己的數據

### 8. 開發模式
系統支援開發模式，當資料庫未連接時：
- 登錄端點會使用臨時測試用戶
- 測試憑證：`test@example.com` / `test123`

### 9. 安全特性
- JWT 訪問令牌有效期 15 分鐘
- JWT 刷新令牌有效期 7 天
- 自動 IP 封鎖機制
- 速率限制保護
- 文件上傳校驗和重複檢查

### 10. 監控和日誌
- 所有 API 調用都會記錄
- 可疑活動會自動記錄並分析
- 支援威脅情報分析
- 自動備份和健康檢查

---

## 版本歷史

- **v1.0.0** (2024-01-15): 初始版本發布
  - 用戶認證系統
  - 客戶和房產管理
  - 文檔上傳和管理
  - 通知系統
  - 數據分析和統計
  - 備份和恢復功能
  - 安全監控和管理

---

## 聯繫方式

如有問題或建議，請聯繫開發團隊：
- **郵箱**: dev@propagent.com
- **技術支援**: support@propagent.com
- **文檔更新**: docs@propagent.com

---

*本文檔最後更新時間: 2024-01-15*

*API 版本: v1.0.0*

*系統狀態: 穩定運行*