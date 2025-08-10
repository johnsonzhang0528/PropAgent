import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user: {
    id: string;
    userId: string;
    email: string;
    role: string;
    company_id?: string;
  };
}

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 認證中間件開始驗證:', {
      authHeader: req.headers.authorization?.substring(0, 30) + '...',
      method: req.method,
      path: req.path
    });

    // 從 Authorization header 獲取 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ 缺少或無效的 Authorization header:', authHeader);
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: '缺少認證令牌' }
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🎟️ 提取到 token:', token.substring(0, 20) + '...');
    
    // 驗證 JWT token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret') as any;
    console.log('✅ Token 驗證成功:', {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      company_id: decoded.company_id
    });
    
    // 設置用戶信息
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || 'agent', // 預設角色
      company_id: decoded.company_id // 允許為空
    };

    console.log('✅ 認證中間件成功，用戶信息:', req.user);
    next();
    return;

    // 查找用戶 (暫時注釋掉)
    /*
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: '無效的令牌' }
      });
    }

    // 檢查用戶狀態
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用' }
      });
    }

    // 將用戶信息添加到請求對象
    req.user = {
      id: (user._id as any).toString(),
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      company_id: user.company_id?.toString()
    };

    next();
    */
  } catch (error) {
    console.error('認證中間件錯誤:', error);
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: '無效的令牌' }
    });
  }
};

// 角色權限中間件
export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未認證' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: '權限不足' }
      });
    }

    next();
  };
};

// 管理員權限中間件
export const requireAdmin = requireRole(['admin']);

// 管理員或經理權限中間件
export const requireManagerOrAdmin = requireRole(['admin', 'manager']);