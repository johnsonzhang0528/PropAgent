import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateTokens, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt';
import { sendSMS, generateSMSCode, verifySMSCode, sendVerificationSMS, validatePhoneNumber } from '../utils/sms';

const router = express.Router();

// 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'agent' } = req.body;

    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '郵箱已被註冊' });
    }

    // 密碼加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 創建新用戶
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role
    });

    await user.save();

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '註冊成功',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({ message: '服務器錯誤' });
  }
});

// 用戶登錄
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // 檢查數據庫連接狀態
    const mongoose = require('mongoose');
    const isDBConnected = mongoose.connection.readyState === 1;
    
    if (!isDBConnected) {
      // 開發模式：數據庫未連接時的臨時登錄
      console.log('開發模式：使用臨時登錄（數據庫未連接）');
      
      // 創建臨時測試用戶
      const testUser = {
        _id: '507f1f77bcf86cd799439011',
        email: email,
        name: '測試用戶',
        role: 'agent',
        company_id: null,
        status: 'active'
      };

      // 簡單的測試憑證驗證
      if (email === 'test@example.com' && password === 'test123') {
        const { accessToken, refreshToken } = generateTokens(testUser);
        
        return res.json({
          success: true,
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 15 * 60, // 15 minutes
            user: {
              id: testUser._id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
              company_id: testUser.company_id
            }
          }
        });
      } else {
        return res.status(400).json({ 
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: '開發模式：請使用 test@example.com / test123' }
        });
      }
    }

    // 正常模式：查找用戶
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '郵箱或密碼錯誤' }
      });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '郵箱或密碼錯誤' }
      });
    }

    // 檢查用戶狀態
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用' }
      });
    }

    // 更新最後登錄時間
    user.last_login_at = new Date();
    await user.save();

    // 生成JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 15 * 60, // 15 minutes
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          company_id: user.company_id
        }
      }
    });
  } catch (error) {
    console.error('登錄錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 發送手機驗證碼
router.post('/send-sms', async (req, res) => {
  try {
    const { phone } = req.body;

    // 驗證手機號格式
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: '請輸入有效的手機號碼' }
      });
    }

    // 檢查是否存在該手機號的用戶
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '該手機號尚未註冊' }
      });
    }

    // 發送驗證碼
    const code = await sendVerificationSMS(phone);
    if (!code) {
      return res.status(500).json({
        success: false,
        error: { code: 'SMS_SEND_FAILED', message: '驗證碼發送失敗，請稍後再試' }
      });
    }

    res.json({
      success: true,
      data: {
        message: '驗證碼已發送',
        expires_in: 300 // 5 minutes
      }
    });
  } catch (error) {
    console.error('發送驗證碼錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 手機驗證碼登錄
router.post('/login-sms', async (req, res) => {
  try {
    const { phone, smsCode } = req.body;

    // 驗證手機號格式
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: '請輸入有效的手機號碼' }
      });
    }

    // 驗證驗證碼
    if (!verifySMSCode(phone, smsCode)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SMS_CODE', message: '驗證碼錯誤或已過期' }
      });
    }

    // 查找用戶
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '該手機號尚未註冊' }
      });
    }

    // 檢查用戶狀態
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: '帳戶已被停用' }
      });
    }

    // 更新最後登錄時間
    user.last_login_at = new Date();
    await user.save();

    // 生成JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 15 * 60, // 15 minutes
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          company_id: user.company_id
        }
      }
    });
  } catch (error) {
    console.error('手機驗證登錄錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 獲取當前用戶信息
router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('獲取用戶信息錯誤:', error);
    res.status(500).json({ message: '服務器錯誤' });
  }
});

// 刷新token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REFRESH_TOKEN', message: '缺少刷新令牌' }
      });
    }

    // 驗證刷新令牌
    const payload = verifyRefreshToken(refresh_token);
    
    // 查找用戶
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_USER', message: '無效的用戶' }
      });
    }

    // 生成新的訪問令牌
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 15 * 60 // 15 minutes
      }
    });
  } catch (error) {
    console.error('刷新token錯誤:', error);
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: '無效的刷新令牌' }
    });
  }
});

// 忘記密碼
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // 為了安全，即使用戶不存在也返回成功
      return res.json({
        success: true,
        data: { message: '如果該郵箱已註冊，將收到重置密碼郵件' }
      });
    }

    const resetToken = generateResetToken((user._id as any).toString());
    
    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      data: { message: '如果該郵箱已註冊，將收到重置密碼郵件' }
    });
  } catch (error) {
    console.error('忘記密碼錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 重置密碼
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    // 驗證重置令牌
    const payload = verifyResetToken(token);
    
    if (payload.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: '無效的重置令牌' }
      });
    }

    // 查找用戶
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用戶不存在' }
      });
    }

    // 更新密碼
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    res.json({
      success: true,
      data: { message: '密碼重置成功' }
    });
  } catch (error) {
    console.error('重置密碼錯誤:', error);
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: '無效或過期的重置令牌' }
    });
  }
});

export default router;
