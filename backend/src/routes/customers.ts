import express from 'express';
import { Customer } from '../models/Customer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../socket';

const router = express.Router();

// 獲取客戶列表
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      agent_id,
      tags,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // 構建查詢條件
    const query: any = {};
    
    // 如果不是管理員，只能查看自己的客戶
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.agent_id = req.user.id;
    } else if (agent_id) {
      query.agent_id = agent_id;
    }

    // 搜尋條件
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 狀態篩選
    if (status) {
      query.status = status;
    }

    // 標籤篩選
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // 排序
    const sortOptions: any = {};
    sortOptions[sort_by as string] = sort_order === 'desc' ? -1 : 1;

    // 分頁計算
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查詢客戶
    const customers = await Customer.find(query)
      .populate('agent_id', 'first_name last_name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 總數
    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取客戶列表錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 獲取單個客戶詳細信息
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id)
      .populate('agent_id', 'first_name last_name email phone')
      .populate('company_id', 'name');

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: '客戶不存在' }
      });
    }

    // 檢查權限：只有客戶的負責業務員、經理或管理員可以查看
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        customer.agent_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限查看此客戶' }
      });
    }

    res.json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    console.error('獲取客戶詳情錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 創建新客戶
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      line_id,
      wechat_id,
      gender,
      age,
      occupation,
      annual_income,
      marital_status,
      family_members,
      source,
      referral_source,
      tags,
      notes
    } = req.body;

    // 檢查手機號是否已存在
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: { code: 'PHONE_EXISTS', message: '該手機號已被其他客戶使用' }
      });
    }

    // 創建客戶
    const customer = new Customer({
      agent_id: req.user.id,
      company_id: req.user.company_id || '688f20e8a0a4bbe897634833', // 使用默認公司ID
      first_name,
      last_name,
      phone,
      email,
      line_id,
      wechat_id,
      gender,
      age,
      occupation,
      annual_income,
      marital_status,
      family_members,
      source,
      referral_source,
      tags: tags || [],
      notes,
      last_contact_at: new Date()
    });

    await customer.save();

    // 返回創建的客戶信息
    const populatedCustomer = await Customer.findById(customer._id)
      .populate('agent_id', 'first_name last_name email');

    res.status(201).json({
      success: true,
      data: { customer: populatedCustomer }
    });
  } catch (error) {
    console.error('創建客戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 更新客戶信息
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 查找客戶
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: '客戶不存在' }
      });
    }

    // 檢查權限
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        customer.agent_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限修改此客戶' }
      });
    }

    // 如果更新手機號，檢查是否已存在
    if (updateData.phone && updateData.phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ 
        phone: updateData.phone,
        _id: { $ne: id }
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: { code: 'PHONE_EXISTS', message: '該手機號已被其他客戶使用' }
        });
      }
    }

    // 不允許修改的字段
    delete updateData.agent_id;
    delete updateData.company_id;
    delete updateData.created_at;

    // 更新客戶
    Object.assign(customer, updateData);
    await customer.save();

    // 返回更新後的客戶信息
    const updatedCustomer = await Customer.findById(id)
      .populate('agent_id', 'first_name last_name email');

    res.json({
      success: true,
      data: { customer: updatedCustomer }
    });
  } catch (error) {
    console.error('更新客戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 刪除客戶
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 查找客戶
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: '客戶不存在' }
      });
    }

    // 檢查權限（只有管理員可以刪除客戶）
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限刪除客戶' }
      });
    }

    // 軟刪除：將狀態設為 inactive
    customer.status = 'inactive';
    await customer.save();

    res.json({
      success: true,
      data: { message: '客戶已刪除' }
    });
  } catch (error) {
    console.error('刪除客戶錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 更新客戶意願評分
router.patch('/:id/intent-score', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { score, reason } = req.body;

    if (typeof score !== 'number' || score < 0 || score > 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SCORE', message: '評分必須是0-10之間的數字' }
      });
    }

    // 查找客戶
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: '客戶不存在' }
      });
    }

    // 檢查權限
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        customer.agent_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限修改此客戶' }
      });
    }

    // 更新評分
    customer.purchase_intent_score = score;
    if (reason) {
      customer.notes = customer.notes ? 
        `${customer.notes}\n\n評分更新: ${score}分 - ${reason}` :
        `評分更新: ${score}分 - ${reason}`;
    }
    await customer.save();

    res.json({
      success: true,
      data: { 
        customer_id: customer._id,
        new_score: score,
        message: '意願評分已更新'
      }
    });
  } catch (error) {
    console.error('更新客戶評分錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 客戶統計數據
router.get('/stats/overview', authMiddleware, async (req: any, res) => {
  try {
    const { agent_id } = req.query;
    
    // 構建查詢條件
    const baseQuery: any = {};
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      baseQuery.agent_id = req.user.id;
    } else if (agent_id) {
      baseQuery.agent_id = agent_id;
    }

    // 並行查詢統計數據
    const [
      totalCount,
      activeCount,
      completedCount,
      lostCount,
      highIntentCount,
      avgIntentScore
    ] = await Promise.all([
      Customer.countDocuments(baseQuery),
      Customer.countDocuments({ ...baseQuery, status: 'active' }),
      Customer.countDocuments({ ...baseQuery, status: 'completed' }),
      Customer.countDocuments({ ...baseQuery, status: 'lost' }),
      Customer.countDocuments({ ...baseQuery, purchase_intent_score: { $gte: 7 } }),
      Customer.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, avgScore: { $avg: '$purchase_intent_score' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_customers: totalCount,
        active_customers: activeCount,
        completed_customers: completedCount,
        lost_customers: lostCount,
        high_intent_customers: highIntentCount,
        average_intent_score: avgIntentScore[0]?.avgScore || 0,
        conversion_rate: totalCount > 0 ? (completedCount / totalCount * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('獲取客戶統計錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

export default router;