import fs from 'fs';
import path from 'path';

interface LogLevel {
  ERROR: 'ERROR';
  WARN: 'WARN';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
  }

  private writeToFile(formattedMessage: string) {
    try {
      fs.appendFileSync(this.logFile, formattedMessage);
    } catch (error) {
      console.error('寫入日誌檔案失敗:', error);
    }
  }

  private log(level: string, message: string, meta?: any) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // 寫入檔案
    this.writeToFile(formattedMessage);
    
    // 開發環境同時輸出到控制台
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage.trim());
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage.trim());
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage.trim());
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage.trim());
          break;
      }
    }
  }

  error(message: string, meta?: any) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message: string, meta?: any) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // HTTP 請求日誌
  logRequest(req: any, res: any, responseTime: number) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    this.info(`${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`, logData);
  }

  // 資料庫操作日誌
  logDatabase(operation: string, collection: string, query?: any, result?: any) {
    const logData = {
      operation,
      collection,
      query,
      result: result ? { count: Array.isArray(result) ? result.length : 1 } : null
    };

    this.info(`DB操作: ${operation} on ${collection}`, logData);
  }

  // 認證日誌
  logAuth(action: string, userId?: string, success: boolean = true, reason?: string) {
    const logData = {
      action,
      userId,
      success,
      reason
    };

    if (success) {
      this.info(`認證成功: ${action}`, logData);
    } else {
      this.warn(`認證失敗: ${action} - ${reason}`, logData);
    }
  }

  // 業務邏輯日誌
  logBusiness(event: string, data?: any) {
    this.info(`業務事件: ${event}`, data);
  }
}

// 創建單例實例
const logger = new Logger();

export default logger;