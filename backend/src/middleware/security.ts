import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { Request, Response, NextFunction } from 'express';

// 基本速率限制 - API 通用
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 1000, // 每個 IP 每 15 分鐘最多 1000 次請求
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試',
    error: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.log(`API 速率限制觸發 - IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: '請求過於頻繁，請稍後再試',
      error: 'TOO_MANY_REQUESTS',
      retryAfter: Math.round(req.rateLimit?.resetTime / 1000) || 300
    });
  }
});

// 登入速率限制 - 更嚴格
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5, // 每個 IP 每 15 分鐘最多 5 次登入嘗試
  skipSuccessfulRequests: true, // 成功的請求不計入限制
  message: {
    success: false,
    message: '登入嘗試過於頻繁，請 15 分鐘後再試',
    error: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    console.log(`登入速率限制觸發 - IP: ${req.ip}, User: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      success: false,
      message: '登入嘗試過於頻繁，請 15 分鐘後再試',
      error: 'LOGIN_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit?.resetTime / 1000) || 900
    });
  }
});

// 註冊速率限制
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 3, // 每個 IP 每小時最多 3 次註冊
  message: {
    success: false,
    message: '註冊嘗試過於頻繁，請 1 小時後再試',
    error: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    console.log(`註冊速率限制觸發 - IP: ${req.ip}, Email: ${req.body?.email || 'unknown'}`);
    res.status(429).json({
      success: false,
      message: '註冊嘗試過於頻繁，請 1 小時後再試',
      error: 'REGISTER_RATE_LIMIT_EXCEEDED'
    });
  }
});

// 密碼重置速率限制
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 3, // 每個 IP 每小時最多 3 次密碼重置請求
  message: {
    success: false,
    message: '密碼重置請求過於頻繁，請 1 小時後再試',
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  }
});

// 文件上傳速率限制
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 50, // 每個 IP 每小時最多 50 次上傳
  message: {
    success: false,
    message: '文件上傳過於頻繁，請稍後再試',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

// 搜索速率限制
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 30, // 每個 IP 每分鐘最多 30 次搜索
  message: {
    success: false,
    message: '搜索請求過於頻繁，請稍後再試',
    error: 'SEARCH_RATE_LIMIT_EXCEEDED'
  }
});

// 備份操作速率限制
export const backupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 10, // 每個 IP 每小時最多 10 次備份操作
  message: {
    success: false,
    message: '備份操作過於頻繁，請稍後再試',
    error: 'BACKUP_RATE_LIMIT_EXCEEDED'
  }
});

// 漸進式速度控制 - 對頻繁請求進行減速
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  delayAfter: 100, // 前 100 個請求不延遲
  delayMs: 500, // 之後每個請求延遲 500ms
  maxDelayMs: 10000, // 最大延遲 10 秒
  skipFailedRequests: true
});

// 安全標頭配置
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// MongoDB 注入防護
export const mongoSanitizer = mongoSanitize({
  replaceWith: '_'
});

// HTTP 參數污染防護
export const parameterPollutionProtection = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'filter']
});

// IP 白名單中間件
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.log(`IP 訪問被拒絕: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: '訪問被拒絕',
        error: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

// 請求大小限制
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / 1024 / 1024;
      const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          success: false,
          message: `請求數據過大，最大允許 ${maxSize}`,
          error: 'REQUEST_TOO_LARGE'
        });
      }
    }
    
    next();
  };
};

// API 密鑰驗證中間件
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return next(); // 如果沒有設置 API_KEY，跳過驗證
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'API 密鑰無效',
      error: 'INVALID_API_KEY'
    });
  }
  
  next();
};

// 用戶代理黑名單
const blockedUserAgents = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i
];

export const userAgentFilter = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // 檢查是否在黑名單中
  const isBlocked = blockedUserAgents.some(pattern => pattern.test(userAgent));
  
  if (isBlocked) {
    console.log(`阻止可疑用戶代理: ${userAgent} - IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: '訪問被拒絕',
      error: 'USER_AGENT_BLOCKED'
    });
  }
  
  next();
};

// CORS 安全配置
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5179',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // 允許沒有 origin 的請求（如移動應用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS 阻止來源: ${origin}`);
      callback(new Error('CORS 政策不允許此來源'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

// 安全日誌記錄
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };
    
    // 記錄可疑活動
    if (res.statusCode >= 400 || duration > 5000) {
      console.log('🔍 安全日誌:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
};

// 綜合安全中間件
export const applySecurity = () => {
  const middlewares = [
    securityHeaders,
    mongoSanitizer,
    parameterPollutionProtection,
    requestSizeLimit(),
    userAgentFilter,
    securityLogger,
    speedLimiter
  ];
  
  return middlewares;
};