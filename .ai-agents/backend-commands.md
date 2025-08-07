# ⚙️ Backend 開發命令手冊

## 當前任務：PropAgent Pro 後端 API 開發
使用 Node.js + TypeScript + Express + PostgreSQL 開發可擴展的後端服務

## 🚀 立即執行：項目初始化

### 1. 創建 Node.js + TypeScript 項目
```bash
# 初始化 Node.js 項目
npm init -y

# 安裝核心依賴
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken
npm install pg redis ioredis
npm install @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/morgan @types/pg @types/node
npm install -D typescript ts-node nodemon @types/node

# 安裝開發工具
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier jest @types/jest ts-jest supertest @types/supertest

echo "✅ Node.js 項目依賴安裝完成"
```

### 2. 配置 TypeScript
```bash
# 創建 TypeScript 配置
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# 配置 package.json scripts
cat > package.json << 'EOF'
{
  "name": "propagent-backend",
  "version": "1.0.0",
  "description": "PropAgent Pro Backend API",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "keywords": ["real-estate", "crm", "api"],
  "author": "PropAgent Team",
  "license": "MIT"
}
EOF

echo "✅ TypeScript 配置完成"
```

### 3. 設置項目結構
```bash
# 創建標準目錄結構
mkdir -p src/{controllers,services,repositories,models,middleware,utils,config,types}
mkdir -p src/controllers/{auth,customers,properties,schedules,analytics}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs/api

echo "✅ 項目結構創建完成"
```

### 4. 配置環境和資料庫
```bash
# 創建環境配置
cat > .env.example << 'EOF'
# 服務配置
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 資料庫配置
DATABASE_URL=postgresql://propagent:dev_password@localhost:5432/propagent_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=propagent_dev
DB_USER=propagent
DB_PASSWORD=dev_password

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 檔案儲存
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 外部服務
EMAIL_SERVICE_API_KEY=your-email-service-key
SMS_SERVICE_API_KEY=your-sms-service-key
EOF

# 複製環境配置
cp .env.example .env

echo "✅ 環境配置完成"
```

### 5. 建立基礎服務器
```bash
# 創建主要服務器文件
cat > src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './controllers/auth/authController';
import { customerRoutes } from './controllers/customers/customerController';
import { propertyRoutes } from './controllers/properties/propertyController';

// 載入環境變數
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 中介層配置
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API 路由
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/properties`, propertyRoutes);

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// 錯誤處理
app.use(errorHandler);

// 啟動服務器
async function startServer() {
  try {
    // 連接資料庫
    await connectDatabase();
    console.log('✅ 資料庫連接成功');

    // 連接 Redis
    await connectRedis();
    console.log('✅ Redis 連接成功');

    // 啟動服務器
    app.listen(PORT, () => {
      console.log(`🚀 PropAgent Pro API 服務器啟動成功`);
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📖 API 文檔: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 健康檢查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在優雅關閉...');
  process.exit(0);
});

startServer();
EOF

echo "✅ 基礎服務器設置完成"
```

## 🗄️ 資料庫設計實現

### 1. 資料庫連接配置
```bash
# 創建資料庫配置
cat > src/config/database.ts << 'EOF'
import { Pool } from 'pg';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 測試連接
    await pool.query('SELECT NOW()');
    console.log('資料庫連接池建立成功');
  } catch (error) {
    console.error('資料庫連接失敗:', error);
    throw error;
  }
};

export const getDB = (): Pool => {
  if (!pool) {
    throw new Error('資料庫未初始化');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    console.log('資料庫連接已關閉');
  }
};
EOF

echo "✅ 資料庫配置完成"
```

### 2. 創建資料表
```bash
# 創建資料庫遷移腳本
mkdir -p migrations

cat > migrations/001_create_tables.sql << 'EOF'
-- 公司表
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 使用者表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 客戶表
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    source VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'lost')),
    tags TEXT[],
    notes TEXT,
    purchase_intent_score DECIMAL(3,2) DEFAULT 0,
    last_contact_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 物件表
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    property_type VARCHAR(20) NOT NULL,
    listing_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    district VARCHAR(50),
    city VARCHAR(50),
    price DECIMAL(15,2) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spots INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    features TEXT[],
    status VARCHAR(20) DEFAULT 'available',
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 客戶互動記錄表
CREATE TABLE customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    interaction_type VARCHAR(20) NOT NULL,
    interaction_method VARCHAR(20),
    subject VARCHAR(255),
    content TEXT,
    duration_minutes INTEGER,
    outcome VARCHAR(20),
    next_follow_up_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 排程表
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 創建索引
CREATE INDEX idx_customers_agent_id ON customers(agent_id);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_schedules_agent_id ON schedules(agent_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);

-- 插入測試數據
INSERT INTO companies (name, license_number, address, phone) VALUES
('示範房仲公司', 'DEMO-001', '台北市信義區信義路五段7號', '02-2345-6789');

INSERT INTO users (email, phone, password_hash, first_name, last_name, role, company_id) VALUES
('demo@propagent.com', '0912345678', '$2b$10$dummy.hash.for.demo', '示範', '業務員', 'agent', 
 (SELECT id FROM companies WHERE license_number = 'DEMO-001'));
EOF

echo "✅ 資料庫遷移腳本創建完成"
```

## 🔐 認證系統實現

### 1. JWT 認證服務
```bash
# 創建認證服務
cat > src/services/authService.ts << 'EOF'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/database';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const db = getDB();
    
    // 查找用戶
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1 AND status = $2',
      [credentials.phone, 'active']
    );

    if (userResult.rows.length === 0) {
      throw new Error('用戶不存在或已被停用');
    }

    const userRow = userResult.rows[0];

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(credentials.password, userRow.password_hash);
    if (!isPasswordValid) {
      throw new Error('密碼錯誤');
    }

    // 更新最後登入時間
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userRow.id]
    );

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      phone: userRow.phone,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      role: userRow.role,
      companyId: userRow.company_id,
    };

    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  async register(userData: any): Promise<{ user: User; tokens: AuthTokens }> {
    const db = getDB();
    
    // 檢查用戶是否已存在
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [userData.email, userData.phone]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('用戶已存在');
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // 創建用戶
    const userResult = await db.query(`
      INSERT INTO users (email, phone, password_hash, first_name, last_name, role, company_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userData.email,
      userData.phone,
      passwordHash,
      userData.firstName,
      userData.lastName,
      userData.role || 'agent',
      userData.companyId
    ]);

    const userRow = userResult.rows[0];
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      phone: userRow.phone,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      role: userRow.role,
      companyId: userRow.company_id,
    };

    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // 查找用戶
      const db = getDB();
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1 AND status = $2',
        [decoded.userId, 'active']
      );

      if (userResult.rows.length === 0) {
        throw new Error('用戶不存在');
      }

      const userRow = userResult.rows[0];
      const user: User = {
        id: userRow.id,
        email: userRow.email,
        phone: userRow.phone,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        role: userRow.role,
        companyId: userRow.company_id,
      };

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Refresh token 無效');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      this.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      const db = getDB();
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1 AND status = $2',
        [decoded.userId, 'active']
      );

      if (userResult.rows.length === 0) {
        throw new Error('用戶不存在');
      }

      const userRow = userResult.rows[0];
      return {
        id: userRow.id,
        email: userRow.email,
        phone: userRow.phone,
        firstName: userRow.first_name,
        lastName: userRow.last_name,
        role: userRow.role,
        companyId: userRow.company_id,
      };
    } catch (error) {
      throw new Error('Token 無效');
    }
  }
}
EOF

echo "✅ 認證服務實現完成"
```

### 2. 認證控制器
```bash
# 創建認證控制器
cat > src/controllers/auth/authController.ts << 'EOF'
import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/authService';

const router = Router();
const authService = new AuthService();

// 登入
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: '手機號碼和密碼為必填項目'
      });
    }

    const result = await authService.login({ phone, password });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// 註冊
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 刷新 Token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token 為必填項目'
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// 登出
router.post('/logout', (req: Request, res: Response) => {
  // 客戶端需要清除儲存的 token
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 獲取當前用戶資訊
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供認證 token'
      });
    }

    const user = await authService.verifyToken(token);

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

export { router as authRoutes };
EOF

echo "✅ 認證控制器實現完成"
```

## 🏃‍♂️ 啟動開發服務器

```bash
# 運行資料庫遷移（需要先啟動 PostgreSQL）
# 注意：需要確保 PostgreSQL 正在運行
echo "創建資料庫和執行遷移..."

# 啟動開發服務器
npm run dev

echo "🎉 PropAgent Pro 後端服務已啟動！"
echo "🌐 API 服務: http://localhost:3000"
echo "🔍 健康檢查: http://localhost:3000/health"
echo "📖 API 端點:"
echo "  POST /api/v1/auth/login - 用戶登入"
echo "  POST /api/v1/auth/register - 用戶註冊"
echo "  GET  /api/v1/auth/me - 獲取用戶資訊"
```

## 📋 後續開發任務

### 今日目標
1. ✅ 項目初始化和環境配置
2. ✅ 資料庫設計和連接
3. ✅ 認證系統實現
4. 🔄 客戶管理 API 開發
5. 🔄 與前端 API 整合測試

### 明日計劃
1. 物件管理 API
2. 排程管理 API
3. 智能算法實現
4. 即時通訊系統
5. 檔案上傳功能

---

**🚀 現在立即執行：複製上面的命令到 backend 窗口開始開發！**
