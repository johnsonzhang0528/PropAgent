# ⚙️ Backend Developer 角色配置

## 角色職責
負責 PropAgent Pro 後端系統開發，實現可擴展的微服務架構和高效能的 API 服務。

## 技術棧
- **語言**: Node.js + TypeScript
- **框架**: Express.js + Fastify
- **資料庫**: PostgreSQL + Redis
- **ORM**: Prisma / TypeORM
- **認證**: JWT + OAuth 2.0
- **訊息佇列**: Redis + Bull Queue
- **檔案儲存**: AWS S3 / Google Cloud Storage
- **即時通訊**: Socket.io
- **API 文件**: OpenAPI/Swagger

## 核心開發任務

### Phase 1: 基礎架構建置 (Week 1-2)
- [ ] 初始化 Node.js + TypeScript 專案
- [ ] 配置 PostgreSQL 資料庫和連接池
- [ ] 設置 Redis 快取和會話管理
- [ ] 建立基礎 Express 服務器和中介層
- [ ] 配置 JWT 認證和權限管理

### Phase 2: 核心 API 開發 (Week 3-6)
- [ ] 使用者註冊登入和權限管理 API
- [ ] 客戶資訊管理 CRUD API
- [ ] 客戶互動記錄和追蹤 API
- [ ] 排程管理和衝突檢測 API
- [ ] 檔案上傳和管理 API

### Phase 3: 進階功能開發 (Week 7-10)
- [ ] 物件管理和搜尋 API
- [ ] 智能客戶意願評分算法
- [ ] 客戶物件配對推薦引擎
- [ ] 即時通訊和通知系統
- [ ] 業績統計和分析 API

### Phase 4: 最佳化和監控 (Week 11-12)
- [ ] API 效能優化和快取策略
- [ ] 資料庫查詢優化和索引調整
- [ ] 監控日誌和 APM 整合
- [ ] 負載測試和容量規劃
- [ ] 安全漏洞掃描和修復

## 專案結構

```
backend/
├── src/
│   ├── controllers/        # 控制器層
│   │   ├── auth/          # 認證相關
│   │   ├── customers/     # 客戶管理
│   │   ├── properties/    # 物件管理
│   │   ├── schedules/     # 排程管理
│   │   └── analytics/     # 數據分析
│   ├── services/          # 業務邏輯層
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── property.service.ts
│   │   └── analytics.service.ts
│   ├── repositories/      # 資料存取層
│   │   ├── user.repository.ts
│   │   ├── customer.repository.ts
│   │   └── property.repository.ts
│   ├── models/            # 資料模型
│   │   ├── User.ts
│   │   ├── Customer.ts
│   │   └── Property.ts
│   ├── middleware/        # 中介層
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── logging.middleware.ts
│   ├── utils/             # 工具函數
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── logger.ts
│   ├── types/             # TypeScript 型別
│   └── config/            # 配置文件
├── tests/                 # 測試文件
├── docs/                  # API 文件
└── docker/               # Docker 配置
```

## 資料庫設計和管理

### 主要資料表
```sql
-- 使用者表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    company_id UUID REFERENCES companies(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 客戶表
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    purchase_intent_score DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 物件表
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    property_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 資料庫最佳化
```typescript
// 連接池配置
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 查詢最佳化
const getCustomersWithPagination = async (
  page: number,
  limit: number,
  filters: CustomerFilters
) => {
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT c.*, u.first_name as agent_name
    FROM customers c
    LEFT JOIN users u ON c.agent_id = u.id
    WHERE ($1::varchar IS NULL OR c.status = $1)
    AND ($2::varchar IS NULL OR c.first_name ILIKE $2)
    ORDER BY c.created_at DESC
    LIMIT $3 OFFSET $4
  `;
  
  return await pool.query(query, [
    filters.status,
    filters.name ? `%${filters.name}%` : null,
    limit,
    offset
  ]);
};
```

## API 設計和實現

### RESTful API 結構
```typescript
// 客戶管理 API
app.get('/api/v1/customers', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  
  try {
    const customers = await customerService.getCustomers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      search: search as string,
      agentId: req.user.id
    });
    
    res.json({
      success: true,
      data: customers.data,
      meta: {
        page: customers.page,
        limit: customers.limit,
        total: customers.total,
        pages: Math.ceil(customers.total / customers.limit)
      }
    });
  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 客戶詳情 API
app.get('/api/v1/customers/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(
      req.params.id,
      req.user.id
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

### GraphQL 支援
```typescript
// GraphQL Schema
const typeDefs = gql`
  type Customer {
    id: ID!
    firstName: String!
    lastName: String!
    email: String
    phone: String!
    purchaseIntentScore: Float
    status: CustomerStatus!
    interactions: [Interaction!]!
    properties: [Property!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    customers(
      page: Int = 1
      limit: Int = 20
      status: CustomerStatus
      search: String
    ): CustomerConnection!
    
    customer(id: ID!): Customer
  }

  type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer!
    updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    customers: async (_, args, context) => {
      return await customerService.getCustomers({
        ...args,
        agentId: context.user.id
      });
    },
    customer: async (_, { id }, context) => {
      return await customerService.getCustomerById(id, context.user.id);
    }
  },
  
  Mutation: {
    createCustomer: async (_, { input }, context) => {
      return await customerService.createCustomer({
        ...input,
        agentId: context.user.id
      });
    }
  }
};
```

## 認證和授權系統

### JWT 認證實現
```typescript
// JWT 工具函數
export const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// 認證中介層
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};
```

### 權限控制
```typescript
// 角色權限配置
const PERMISSIONS = {
  admin: ['*'],
  manager: [
    'customers:read',
    'customers:write',
    'properties:read',
    'properties:write',
    'analytics:read',
    'team:read'
  ],
  agent: [
    'customers:read',
    'customers:write',
    'properties:read',
    'schedules:read',
    'schedules:write'
  ]
};

// 權限檢查中介層
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
  };
};
```

## 智能算法實現

### 客戶意願評分算法
```typescript
interface CustomerIntentFactors {
  interactionFrequency: number;    // 互動頻率
  responseSpeed: number;           // 回應速度
  propertyViewCount: number;       // 看房次數
  budgetMatch: number;             // 預算匹配度
  timelineUrgency: number;         // 時間急迫性
  referralSource: number;          // 推薦來源權重
}

export class CustomerIntentScorer {
  private weights = {
    interactionFrequency: 0.25,
    responseSpeed: 0.15,
    propertyViewCount: 0.20,
    budgetMatch: 0.20,
    timelineUrgency: 0.15,
    referralSource: 0.05
  };

  calculateScore(factors: CustomerIntentFactors): number {
    let score = 0;
    
    // 正規化各項因子到 0-1 範圍
    const normalizedFactors = {
      interactionFrequency: Math.min(factors.interactionFrequency / 10, 1),
      responseSpeed: Math.min(factors.responseSpeed / 24, 1), // 24小時內回應為滿分
      propertyViewCount: Math.min(factors.propertyViewCount / 5, 1),
      budgetMatch: factors.budgetMatch, // 已經是 0-1 範圍
      timelineUrgency: factors.timelineUrgency, // 已經是 0-1 範圍
      referralSource: factors.referralSource // 已經是 0-1 範圍
    };

    // 加權計算總分
    for (const [factor, value] of Object.entries(normalizedFactors)) {
      score += value * this.weights[factor as keyof typeof this.weights];
    }

    return Math.round(score * 10 * 100) / 100; // 轉換為 0-10 分制，保留兩位小數
  }

  async updateCustomerScore(customerId: string): Promise<void> {
    const customer = await customerRepository.findById(customerId);
    const interactions = await interactionRepository.findByCustomerId(customerId);
    const propertyViews = await propertyViewRepository.findByCustomerId(customerId);

    const factors = this.calculateFactors(customer, interactions, propertyViews);
    const score = this.calculateScore(factors);

    await customerRepository.updateIntentScore(customerId, score);
  }
}
```

### 物件推薦引擎
```typescript
export class PropertyRecommendationEngine {
  async getRecommendations(
    customerId: string,
    limit: number = 10
  ): Promise<PropertyRecommendation[]> {
    const customer = await customerRepository.findById(customerId);
    const requirements = await customerRequirementRepository.findByCustomerId(customerId);
    const viewHistory = await propertyViewRepository.findByCustomerId(customerId);

    // 基於需求的篩選
    const candidateProperties = await this.filterPropertiesByRequirements(requirements);

    // 計算匹配分數
    const scoredProperties = candidateProperties.map(property => ({
      property,
      score: this.calculateMatchScore(customer, requirements, property, viewHistory)
    }));

    // 排序並返回推薦結果
    return scoredProperties
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        property: item.property,
        matchScore: item.score,
        matchReasons: this.getMatchReasons(requirements, item.property)
      }));
  }

  private calculateMatchScore(
    customer: Customer,
    requirements: CustomerRequirement,
    property: Property,
    viewHistory: PropertyView[]
  ): number {
    let score = 0;

    // 價格匹配度 (30%)
    const priceMatch = this.calculatePriceMatch(requirements, property);
    score += priceMatch * 0.3;

    // 區域偏好 (25%)
    const locationMatch = this.calculateLocationMatch(requirements, property);
    score += locationMatch * 0.25;

    // 房型匹配度 (20%)
    const typeMatch = this.calculateTypeMatch(requirements, property);
    score += typeMatch * 0.2;

    // 特徵匹配度 (15%)
    const featureMatch = this.calculateFeatureMatch(requirements, property);
    score += featureMatch * 0.15;

    // 瀏覽歷史相似度 (10%)
    const historyMatch = this.calculateHistoryMatch(viewHistory, property);
    score += historyMatch * 0.1;

    return Math.round(score * 100) / 100;
  }
}
```

## 即時通訊系統

### Socket.io 實現
```typescript
// Socket.io 服務器設置
export class RealtimeService {
  private io: Server;

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Socket 認證中介層
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await userRepository.findById(decoded.userId);
        
        if (user) {
          socket.userId = user.id;
          socket.companyId = user.companyId;
          next();
        } else {
          next(new Error('Authentication error'));
        }
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);

      // 加入公司房間
      socket.join(`company:${socket.companyId}`);

      // 客戶更新事件
      socket.on('customer:update', async (data) => {
        try {
          const customer = await customerService.updateCustomer(data.id, data.updates);
          
          // 廣播給同公司其他用戶
          socket.to(`company:${socket.companyId}`).emit('customer:updated', {
            customer,
            updatedBy: socket.userId
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to update customer' });
        }
      });

      // 排程衝突檢測
      socket.on('schedule:check', async (data) => {
        try {
          const conflicts = await scheduleService.checkConflicts(data.schedule);
          socket.emit('schedule:conflicts', conflicts);
        } catch (error) {
          socket.emit('error', { message: 'Failed to check schedule conflicts' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  // 推送通知給特定用戶
  notifyUser(userId: string, event: string, data: any) {
    this.io.to(userId).emit(event, data);
  }

  // 推送通知給公司所有用戶
  notifyCompany(companyId: string, event: string, data: any) {
    this.io.to(`company:${companyId}`).emit(event, data);
  }
}
```

## 效能監控和最佳化

### APM 整合
```typescript
// New Relic / DataDog 整合
import newrelic from 'newrelic';

// 自定義指標記錄
export const recordCustomMetric = (name: string, value: number) => {
  newrelic.recordMetric(name, value);
};

// API 效能監控
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    recordCustomMetric(`API/Response/${req.method}${req.route?.path}`, duration);
    
    if (duration > 2000) { // 超過 2 秒的請求記錄警告
      logger.warn(`Slow API request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
};
```

### 快取策略
```typescript
// Redis 快取服務
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  // 快取裝飾器
  cache(ttl: number = 3600) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        
        let result = await cacheService.get(cacheKey);
        if (result === null) {
          result = await method.apply(this, args);
          await cacheService.set(cacheKey, result, ttl);
        }

        return result;
      };
    };
  }
}
```

## 協作要點

### 與前端團隊
- API 介面規範和文檔維護
- 資料格式和錯誤處理統一
- 即時通訊協議和事件定義
- 效能要求和響應時間優化

### 與 DevOps 團隊
- 部署配置和環境變數管理
- 監控指標和告警設置
- 資料庫遷移和備份策略
- 負載測試和容量規劃

### 與產品團隊
- 業務邏輯確認和演算法調整
- 資料模型設計和關聯關係
- 效能指標和 SLA 定義
- 功能優先級和開發排程
