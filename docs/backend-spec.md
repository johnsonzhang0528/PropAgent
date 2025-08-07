# 後端API設計和資料庫架構 - PropAgent Pro

## 整體架構設計

### 技術棧選擇
- **程式語言**：Node.js + TypeScript
- **框架**：Express.js + Fastify (高效能API)
- **資料庫**：PostgreSQL (主資料庫) + Redis (快取/會話)
- **訊息佇列**：Redis + Bull Queue
- **文件儲存**：AWS S3 / Google Cloud Storage
- **即時通訊**：Socket.io
- **搜尋引擎**：Elasticsearch (可選)

### 微服務架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │ Customer Service│
│   (nginx/envoy) │    │  (JWT/OAuth)    │    │   (客戶管理)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Schedule Service │    │Property Service │    │Analytics Service│
│   (排程管理)     │    │   (物件管理)     │    │   (數據分析)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Notification Svc │    │   File Service  │    │  Report Service │
│   (通知系統)     │    │   (檔案管理)     │    │   (報表生成)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 資料庫設計

### 主要資料表結構

#### 1. 使用者相關表

```sql
-- 使用者表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('agent', 'manager', 'admin')),
    company_id UUID REFERENCES companies(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 公司表
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    subscription_plan VARCHAR(20) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 使用者設定表
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    notification_preferences JSONB DEFAULT '{}',
    working_hours JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    dashboard_layout JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. 客戶管理表

```sql
-- 客戶表
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    line_id VARCHAR(100),
    wechat_id VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    age INTEGER,
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    marital_status VARCHAR(20),
    family_members INTEGER,
    source VARCHAR(50), -- 客戶來源
    referral_source VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'lost')),
    tags TEXT[], -- 標籤陣列
    notes TEXT,
    purchase_intent_score DECIMAL(3,2) DEFAULT 0, -- 購買意願評分 0-10
    last_contact_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 客戶需求表
CREATE TABLE customer_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    property_type VARCHAR(20) NOT NULL, -- 'apartment', 'house', 'commercial'
    min_price DECIMAL(15,2),
    max_price DECIMAL(15,2),
    min_area DECIMAL(10,2),
    max_area DECIMAL(10,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spots INTEGER,
    preferred_districts TEXT[],
    preferred_features TEXT[],
    must_have_features TEXT[],
    deal_breakers TEXT[],
    timeline VARCHAR(20), -- 'urgent', 'within_month', 'within_quarter', 'flexible'
    financing_method VARCHAR(20), -- 'cash', 'mortgage', 'mixed'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 客戶互動記錄表
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    interaction_type VARCHAR(20) NOT NULL, -- 'call', 'message', 'email', 'meeting', 'property_viewing'
    interaction_method VARCHAR(20), -- 'phone', 'line', 'wechat', 'email', 'in_person'
    subject VARCHAR(255),
    content TEXT,
    duration_minutes INTEGER,
    outcome VARCHAR(20), -- 'positive', 'neutral', 'negative', 'no_answer'
    next_follow_up_at TIMESTAMP,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. 物件管理表

```sql
-- 物件表
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    property_type VARCHAR(20) NOT NULL, -- 'apartment', 'house', 'commercial', 'land'
    listing_type VARCHAR(20) NOT NULL, -- 'sale', 'rent'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    district VARCHAR(50),
    city VARCHAR(50),
    postal_code VARCHAR(10),
    coordinates POINT, -- PostGIS支援
    price DECIMAL(15,2) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    area_unit VARCHAR(10) DEFAULT 'ping',
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spots INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    features TEXT[],
    amenities TEXT[],
    transport_info JSONB DEFAULT '{}',
    school_district VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'pending', 'sold', 'rented', 'withdrawn'
    available_from DATE,
    images JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    virtual_tour_url TEXT,
    listing_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 物件圖片表
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    image_url TEXT NOT NULL,
    image_type VARCHAR(20), -- 'exterior', 'interior', 'floor_plan', 'view'
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 物件訪問記錄表
CREATE TABLE property_viewings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    customer_feedback TEXT,
    agent_notes TEXT,
    interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. 排程管理表

```sql
-- 排程表
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(20) NOT NULL, -- 'viewing', 'meeting', 'call', 'personal'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location TEXT,
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 提醒設定表
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    reminder_type VARCHAR(20) NOT NULL, -- 'follow_up', 'birthday', 'contract_expiry', 'custom'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    trigger_time TIMESTAMP NOT NULL,
    recurring_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly', null for one-time
    related_customer_id UUID REFERENCES customers(id),
    related_property_id UUID REFERENCES properties(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'dismissed'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API設計規格

### RESTful API結構

#### 1. 認證與授權API

```typescript
// POST /api/auth/login
interface LoginRequest {
  phone: string;
  password: string;
  remember_me?: boolean;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    company_id: string;
  };
  expires_in: number;
}

// POST /api/auth/refresh
interface RefreshTokenRequest {
  refresh_token: string;
}

// POST /api/auth/logout
interface LogoutRequest {
  refresh_token: string;
}

// POST /api/auth/forgot-password
interface ForgotPasswordRequest {
  email: string;
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
```

#### 2. 客戶管理API

```typescript
// GET /api/customers
interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'completed' | 'lost';
  agent_id?: string;
  tags?: string[];
  sort_by?: 'created_at' | 'last_contact_at' | 'name';
  sort_order?: 'asc' | 'desc';
}

interface GetCustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// POST /api/customers
interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  source?: string;
  requirements?: CustomerRequirement;
  notes?: string;
}

// GET /api/customers/:id
interface GetCustomerResponse {
  customer: Customer;
  interactions: CustomerInteraction[];
  viewings: PropertyViewing[];
  requirements: CustomerRequirement;
}

// PUT /api/customers/:id
interface UpdateCustomerRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  tags?: string[];
  notes?: string;
  purchase_intent_score?: number;
}

// POST /api/customers/:id/interactions
interface CreateInteractionRequest {
  interaction_type: string;
  interaction_method?: string;
  subject?: string;
  content: string;
  duration_minutes?: number;
  outcome?: string;
  next_follow_up_at?: string;
}
```

#### 3. 物件管理API

```typescript
// GET /api/properties
interface GetPropertiesQuery {
  page?: number;
  limit?: number;
  property_type?: string;
  listing_type?: 'sale' | 'rent';
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  district?: string;
  bedrooms?: number;
  status?: 'available' | 'pending' | 'sold' | 'rented';
  agent_id?: string;
}

// POST /api/properties
interface CreatePropertyRequest {
  property_type: string;
  listing_type: string;
  title: string;
  description?: string;
  address: string;
  district: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  images?: string[];
}

// GET /api/properties/:id/matches
interface GetPropertyMatchesQuery {
  limit?: number;
}

interface PropertyMatch {
  customer: Customer;
  match_score: number;
  matching_criteria: string[];
}

// POST /api/properties/:id/viewings
interface CreateViewingRequest {
  customer_id: string;
  scheduled_at: string;
  notes?: string;
}
```

#### 4. 排程管理API

```typescript
// GET /api/schedules
interface GetSchedulesQuery {
  start_date: string;
  end_date: string;
  event_type?: string;
  status?: string;
}

// POST /api/schedules
interface CreateScheduleRequest {
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  customer_id?: string;
  property_id?: string;
  reminder_time?: string;
}

// PUT /api/schedules/:id
interface UpdateScheduleRequest {
  title?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
}

// GET /api/reminders
interface GetRemindersResponse {
  reminders: Reminder[];
  overdue_count: number;
  today_count: number;
}

// POST /api/reminders
interface CreateReminderRequest {
  reminder_type: string;
  title: string;
  message?: string;
  trigger_time: string;
  recurring_pattern?: string;
  related_customer_id?: string;
}
```

## 快取策略

### Redis快取設計

```typescript
// 快取鍵命名規範
const CacheKeys = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  USER_PERMISSIONS: (userId: string) => `permissions:${userId}`,
  CUSTOMER_DETAILS: (customerId: string) => `customer:${customerId}`,
  PROPERTY_DETAILS: (propertyId: string) => `property:${propertyId}`,
  PROPERTY_SEARCH: (hash: string) => `search:properties:${hash}`,
  CUSTOMER_INTERACTIONS: (customerId: string) => `interactions:${customerId}`,
  DASHBOARD_DATA: (userId: string) => `dashboard:${userId}`,
  ANALYTICS_CACHE: (type: string, period: string) => `analytics:${type}:${period}`
};

// 快取策略
const CacheStrategies = {
  // 使用者會話 - 短期快取
  userSession: {
    ttl: 24 * 60 * 60, // 24小時
    strategy: 'write-through'
  },
  
  // 客戶詳細資料 - 中期快取
  customerDetails: {
    ttl: 4 * 60 * 60, // 4小時
    strategy: 'cache-aside'
  },
  
  // 物件搜尋結果 - 短期快取
  propertySearch: {
    ttl: 30 * 60, // 30分鐘
    strategy: 'cache-aside'
  },
  
  // 儀表板數據 - 短期快取
  dashboardData: {
    ttl: 15 * 60, // 15分鐘
    strategy: 'write-behind'
  }
};
```

### 快取實現範例

```typescript
class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
```

## 即時通訊系統

### Socket.io整合

```typescript
// Socket事件定義
interface SocketEvents {
  // 客戶端到伺服器
  'join_room': (data: { room: string }) => void;
  'leave_room': (data: { room: string }) => void;
  'send_message': (data: ChatMessage) => void;
  'customer_status_update': (data: CustomerStatusUpdate) => void;
  'viewing_reminder': (data: ViewingReminder) => void;
  
  // 伺服器到客戶端
  'message_received': (data: ChatMessage) => void;
  'customer_updated': (data: Customer) => void;
  'new_notification': (data: Notification) => void;
  'system_alert': (data: SystemAlert) => void;
}

// Socket服務實現
class SocketService {
  private io: Server;
  
  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const user = await this.verifyToken(token);
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.id} connected`);
      
      // 加入使用者專屬房間
      socket.join(`user:${socket.user.id}`);
      socket.join(`company:${socket.user.company_id}`);
      
      // 客戶狀態更新
      socket.on('customer_status_update', async (data) => {
        await this.handleCustomerStatusUpdate(socket, data);
      });
      
      // 即時聊天
      socket.on('send_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });
      
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.id} disconnected`);
      });
    });
  }
  
  // 發送通知給特定使用者
  notifyUser(userId: string, notification: Notification) {
    this.io.to(`user:${userId}`).emit('new_notification', notification);
  }
  
  // 發送系統廣播
  broadcastToCompany(companyId: string, alert: SystemAlert) {
    this.io.to(`company:${companyId}`).emit('system_alert', alert);
  }
}
```

## 安全性設計

### JWT認證機制

```typescript
// JWT工具類
class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
  }
  
  generateTokens(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    };
    
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: '15m'
    });
    
    const refreshToken = jwt.sign(
      { id: user.id }, 
      this.refreshTokenSecret, 
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
  }
  
  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
  }
}

// 認證中間件
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const payload = jwtService.verifyAccessToken(token);
    const user = await userService.findById(payload.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### 角色權限控制

```typescript
// 權限定義
enum Permission {
  // 客戶管理
  CREATE_CUSTOMER = 'create_customer',
  READ_CUSTOMER = 'read_customer',
  UPDATE_CUSTOMER = 'update_customer',
  DELETE_CUSTOMER = 'delete_customer',
  READ_ALL_CUSTOMERS = 'read_all_customers',
  
  // 物件管理
  CREATE_PROPERTY = 'create_property',
  READ_PROPERTY = 'read_property',
  UPDATE_PROPERTY = 'update_property',
  DELETE_PROPERTY = 'delete_property',
  
  // 系統管理
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  SYSTEM_CONFIG = 'system_config'
}

// 角色權限映射
const RolePermissions = {
  agent: [
    Permission.CREATE_CUSTOMER,
    Permission.READ_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.CREATE_PROPERTY,
    Permission.READ_PROPERTY,
    Permission.UPDATE_PROPERTY
  ],
  
  manager: [
    ...RolePermissions.agent,
    Permission.READ_ALL_CUSTOMERS,
    Permission.DELETE_CUSTOMER,
    Permission.DELETE_PROPERTY,
    Permission.VIEW_ANALYTICS
  ],
  
  admin: [
    ...RolePermissions.manager,
    Permission.MANAGE_USERS,
    Permission.SYSTEM_CONFIG
  ]
};

// 權限檢查中間件
const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const userPermissions = RolePermissions[user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

## 效能監控

### 監控指標收集

```typescript
// Prometheus指標定義
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

collectDefaultMetrics();

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});

const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

// 監控中間件
const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route)
      .observe(duration);
  });
  
  next();
};

// 健康檢查端點
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      elasticsearch: await checkElasticsearchHealth()
    }
  };
  
  const allServicesHealthy = Object.values(health.services).every(
    service => service.status === 'healthy'
  );
  
  res.status(allServicesHealthy ? 200 : 503).json(health);
});

// 指標端點
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### 日誌管理

```typescript
// Winston日誌配置
import winston from 'winston';
import 'winston-elasticsearch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'propagent-api',
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// 生產環境添加Elasticsearch transport
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Elasticsearch({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL
    },
    index: 'propagent-logs'
  }));
}

// 開發環境添加控制台輸出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 請求日誌中間件
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
};
```

## 部署配置

### Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 複製package文件
COPY package*.json ./
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 建置應用
RUN npm run build

# 創建非root使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 設定權限
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/propagent
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - propagent-network

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=propagent
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - propagent-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - propagent-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - api
    networks:
      - propagent-network

volumes:
  postgres_data:
  redis_data:

networks:
  propagent-network:
    driver: bridge
```

### Kubernetes部署配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: propagent-api
  labels:
    app: propagent-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: propagent-api
  template:
    metadata:
      labels:
        app: propagent-api
    spec:
      containers:
      - name: api
        image: propagent/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: propagent-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: propagent-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: propagent-api-service
spec:
  selector:
    app: propagent-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

這個後端規格文件涵蓋了PropAgent Pro房仲智能客戶管理系統的完整後端架構設計，包括資料庫設計、API設計、快取策略、即時通訊、安全性、效能監控和部署配置。系統採用現代化的微服務架構，確保可擴展性和維護性，同時提供完整的房仲業務功能支援。
