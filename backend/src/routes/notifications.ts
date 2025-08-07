import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import emailService from '../utils/emailService';

const router = express.Router();

// 獲取用戶通知列表
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 20,
      category,
      type,
      isRead,
      priority
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    const query: any = {
      'recipient.id': userId,
      isArchived: false
    };

    if (category) query.category = category;
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate('sender', 'name email'),
      Notification.countDocuments(query)
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
        hasNext: pageNumber < Math.ceil(total / limitNumber),
        hasPrev: pageNumber > 1
      }
    });

  } catch (error) {
    console.error('獲取通知列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知列表失敗'
    });
  }
});

// 獲取未讀通知數量
router.get('/unread-count', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const unreadCount = await Notification.countDocuments({
      'recipient.id': userId,
      isRead: false,
      isArchived: false
    });

    res.json({
      success: true,
      count: unreadCount
    });

  } catch (error) {
    console.error('獲取未讀通知數量錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取未讀通知數量失敗'
    });
  }
});

// 獲取通知統計
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const stats = await Notification.getStatsByRecipient(userId);

    res.json({
      success: true,
      stats: stats[0] || {
        total: 0,
        unread: 0,
        urgent: 0,
        failed: 0
      }
    });

  } catch (error) {
    console.error('獲取通知統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知統計失敗'
    });
  }
});

// 標記通知為已讀
router.put('/:id/read', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const notification = await Notification.findOne({
      _id: req.params.id,
      'recipient.id': userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: '通知已標記為已讀',
      notification
    });

  } catch (error) {
    console.error('標記通知已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '標記通知已讀失敗'
    });
  }
});

// 批量標記為已讀
router.put('/batch/read', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的通知ID列表'
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: ids },
        'recipient.id': userId
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `成功標記 ${result.modifiedCount} 個通知為已讀`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('批量標記已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批量標記已讀失敗'
    });
  }
});

// 歸檔通知
router.put('/:id/archive', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const notification = await Notification.findOne({
      _id: req.params.id,
      'recipient.id': userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.markAsArchived();

    res.json({
      success: true,
      message: '通知已歸檔',
      notification
    });

  } catch (error) {
    console.error('歸檔通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '歸檔通知失敗'
    });
  }
});

// 發送自定義通知
router.post('/send', authMiddleware, async (req: any, res) => {
  try {
    const {
      type = 'system',
      category,
      title,
      message,
      recipientId,
      recipientType = 'user',
      priority = 'normal',
      scheduledAt,
      expiresAt
    } = req.body;

    // 驗證必需字段
    if (!title || !message || !recipientId || !category) {
      return res.status(400).json({
        success: false,
        message: '請提供所有必需字段：title, message, recipientId, category'
      });
    }

    // 創建通知
    const notification = new Notification({
      type,
      category,
      title,
      message,
      recipient: {
        type: recipientType,
        id: recipientId
      },
      sender: req.user?.id,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await notification.save();

    // 如果是即時發送的郵件通知，立即發送
    if (type === 'email' && !scheduledAt) {
      try {
        // 這裡需要獲取收件人郵箱
        // 實際實現中應該從 User 或 Customer 模型中獲取
        const recipientEmail = req.body.recipientEmail;
        
        if (recipientEmail) {
          const success = await emailService.sendEmail({
            to: recipientEmail,
            subject: title,
            html: `<div style="font-family: Arial, sans-serif;">${message}</div>`
          });

          if (success) {
            await notification.markAsSent();
          } else {
            await notification.markAsFailed('郵件發送失敗');
          }
        }
      } catch (emailError) {
        console.error('發送郵件失敗:', emailError);
        await notification.markAsFailed('郵件發送異常');
      }
    }

    res.json({
      success: true,
      message: '通知創建成功',
      notification
    });

  } catch (error) {
    console.error('發送通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '發送通知失敗'
    });
  }
});

// 重試失敗的通知
router.post('/:id/retry', authMiddleware, async (req: any, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    if (notification.status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: '只能重試失敗的通知'
      });
    }

    await notification.retry();

    res.json({
      success: true,
      message: '通知已重新加入發送隊列',
      notification
    });

  } catch (error) {
    console.error('重試通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '重試通知失敗'
    });
  }
});

// 獲取通知模板
router.get('/templates', authMiddleware, async (req: any, res) => {
  try {
    const templates = [
      {
        id: 'new_customer',
        name: '新客戶註冊',
        category: 'customer',
        description: '當有新客戶註冊時發送通知'
      },
      {
        id: 'customer_status_change',
        name: '客戶狀態變更',
        category: 'customer',
        description: '當客戶狀態發生變更時發送通知'
      },
      {
        id: 'new_property',
        name: '新房產上架',
        category: 'property',
        description: '當有新房產上架時發送通知'
      },
      {
        id: 'price_change',
        name: '房產價格變更',
        category: 'property',
        description: '當房產價格發生變更時發送通知'
      },
      {
        id: 'follow_up_reminder',
        name: '跟進提醒',
        category: 'reminder',
        description: '客戶跟進提醒通知'
      },
      {
        id: 'contract_expiry',
        name: '合約到期提醒',
        category: 'reminder',
        description: '合約即將到期提醒'
      },
      {
        id: 'document_upload',
        name: '文檔上傳通知',
        category: 'document',
        description: '當有新文檔上傳時發送通知'
      },
      {
        id: 'maintenance_notice',
        name: '系統維護通知',
        category: 'system',
        description: '系統維護相關通知'
      }
    ];

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('獲取通知模板錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知模板失敗'
    });
  }
});

// 測試郵件服務
router.post('/test-email', authMiddleware, async (req: any, res) => {
  try {
    const { to, subject = '測試郵件', message = '這是一封測試郵件' } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: '請提供收件人郵箱'
      });
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">PropAgent Pro 測試郵件</h2>
          <p>${message}</p>
          <p style="color: #666; font-size: 12px;">
            發送時間: ${new Date().toLocaleString('zh-TW')}
          </p>
        </div>
      `,
      text: `PropAgent Pro 測試郵件: ${message}`
    });

    res.json({
      success,
      message: success ? '測試郵件發送成功' : '測試郵件發送失敗'
    });

  } catch (error) {
    console.error('測試郵件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '測試郵件發送失敗'
    });
  }
});

export default router;