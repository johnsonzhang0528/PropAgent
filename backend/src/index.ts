import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initializeSocket, NotificationService } from './socket';
import { globalErrorHandler } from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import propertyRoutes from './routes/properties';
import analyticsRoutes from './routes/analytics';
import analyticsTestRoutes from './routes/analytics-test';
import documentRoutes from './routes/documents';
import notificationRoutes from './routes/notifications';
import backupRoutes from './routes/backup';
import securityRoutes from './routes/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 數據庫連接
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/propagent';
    
    logger.info('嘗試連接到 MongoDB', { uri: mongoURI });
    console.log(`🔗 嘗試連接到 MongoDB: ${mongoURI}`);
    
    // 設置連接選項
    const options = {
      serverSelectionTimeoutMS: 5000, // 5秒超時
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      writeConcern: {
        w: 'majority'
      }
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB 連接成功');
    console.log(`📂 數據庫: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 主機: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // 監聽連接事件
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose 已連接到 MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 連接錯誤:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose 連接已斷開');
    });
    
  } catch (error) {
    console.error('❌ 數據庫連接失敗:', error);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 生產環境數據庫連接失敗，服務器將退出');
      process.exit(1);
    } else {
      console.log('⚠️  開發模式：數據庫連接失敗，但服務器繼續運行');
      console.log('💡 提示: 請確保 MongoDB 服務器正在運行');
      console.log('🔧 啟動 MongoDB: ./mongodb/start-mongodb.sh');
    }
  }
};

connectDB();

// 中間件
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5179',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌中間件
app.use(requestLogger);

// 健康檢查端點
app.get('/health', async (req, res) => {
  try {
    // 檢查數據庫連接
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'OK',
      message: 'PropAgent Pro API Server Running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        api: 'healthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsTestRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/security', securityRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '歡迎使用 PropAgent Pro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      customers: '/api/customers/*',
      properties: '/api/properties/*',
      analytics: '/api/analytics/*',
      documents: '/api/documents/*',
      notifications: '/api/notifications/*',
      backup: '/api/backup/*',
      security: '/api/security/*'
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源'
  });
});

// 全局錯誤處理中間件 (必須放在最後)
app.use(globalErrorHandler);

// 創建 HTTP 服務器
const server = createServer(app);

// 初始化 Socket.io
const io = initializeSocket(server);
NotificationService.initialize(io);

server.listen(PORT, () => {
  console.log();
  console.log('🚀 PropAgent Pro API Server');
  console.log(`📡 HTTP 服務器運行在 http://localhost:${PORT}`);
  console.log(`🔌 Socket.io 服務器已啟動`);
  console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:5175'}`);
  console.log(`📝 API文檔: http://localhost:${PORT}/health`);
  console.log(`⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
  console.log();
});
