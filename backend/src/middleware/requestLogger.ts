import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface RequestWithStartTime extends Request {
  startTime?: number;
}

const requestLogger = (req: RequestWithStartTime, res: Response, next: NextFunction) => {
  // 記錄請求開始時間
  req.startTime = Date.now();

  // 監聽回應完成事件
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || 0);
    
    // 記錄請求日誌
    logger.logRequest(req, res, responseTime);

    // 如果是錯誤狀態碼，額外記錄錯誤
    if (res.statusCode >= 400) {
      logger.warn(`HTTP錯誤回應: ${req.method} ${req.url}`, {
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        responseTime: `${responseTime}ms`
      });
    }
  });

  next();
};

export default requestLogger;