import express from 'express';
import { Task } from '../models/Task';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../middleware/errorHandler';
import logger from '../utils/logger';
import mongoose from 'mongoose';

const router = express.Router();

// 獲取任務列表
router.get('/', authMiddleware, catchAsync(async (req: any, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    category,
    search,
    dueDate,
    assignedTo,
    customerId,
    propertyId,
    sort_by = 'createdAt',
    sort_order = 'desc',
    includeCompleted = 'true'
  } = req.query;

  // 構建查詢條件
  const query: any = {};

  // 權限控制：普通用戶只能看到自己創建或分配給自己的任務
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    query.$or = [
      { createdBy: req.user.id },
      { assignedTo: req.user.id }
    ];
  } else {
    // 管理員可以查看公司內所有任務
    query.company_id = req.user.company_id;
  }

  // 篩選條件
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (assignedTo) query.assignedTo = assignedTo;
  if (customerId) query.customerId = customerId;
  if (propertyId) query.propertyId = propertyId;
  
  // 是否包含已完成任務
  if (includeCompleted === 'false') {
    query.status = { $ne: 'completed' };
  }

  // 搜索條件
  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // 截止日期篩選
  if (dueDate) {
    const date = new Date(dueDate as string);
    if (!isNaN(date.getTime())) {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      query.dueDate = {
        $gte: date,
        $lt: nextDay
      };
    }
  }

  // 分頁驗證
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  // 排序配置
  const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
  const sortField = allowedSortFields.includes(sort_by as string) ? sort_by as string : 'createdAt';
  const sortDirection = sort_order === 'asc' ? 1 : -1;
  
  const sortOptions: any = {};
  sortOptions[sortField] = sortDirection;
  
  // 優先級排序輔助
  if (sortField === 'priority') {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    // MongoDB 中需要用聚合管道來處理自定義排序
  }

  // 並行查詢任務和總數
  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('createdBy', 'first_name last_name email')
      .populate('assignedTo', 'first_name last_name email')
      .populate('customerId', 'first_name last_name phone email')
      .populate('propertyId', 'title address')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    }
  });

  logger.logBusiness('獲取任務列表', { 
    query: req.query, 
    resultCount: tasks.length, 
    userId: req.user.id 
  });
}));

// 獲取單個任務詳情
router.get('/:id', authMiddleware, catchAsync(async (req: any, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('無效的任務ID格式', 400);
  }

  const task = await Task.findById(id)
    .populate('createdBy', 'first_name last_name email')
    .populate('assignedTo', 'first_name last_name email')
    .populate('customerId', 'first_name last_name phone email')
    .populate('propertyId', 'title address price');

  if (!task) {
    throw new AppError('任務不存在', 404);
  }

  // 權限檢查
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    if (task.createdBy?._id.toString() !== req.user.id && 
        task.assignedTo?._id.toString() !== req.user.id) {
      throw new AppError('沒有權限查看此任務', 403);
    }
  }

  res.json({
    success: true,
    data: { task }
  });

  logger.logBusiness('獲取任務詳情', { taskId: id, userId: req.user.id });
}));

// 創建新任務
router.post('/', authMiddleware, catchAsync(async (req: any, res) => {
  console.log('🎯 後端接收創建任務請求:', {
    body: req.body,
    user: req.user,
    headers: req.headers.authorization?.substring(0, 30) + '...'
  });

  const {
    title,
    description,
    priority = 'medium',
    category,
    dueDate,
    assignedTo,
    customerId,
    propertyId,
    tags,
    notes
  } = req.body;

  // 增強驗證和調試
  console.log('🔍 驗證輸入數據:', { title, category, priority, dueDate });

  // 驗證必填欄位
  if (!title || !category) {
    console.error('❌ 必填欄位驗證失敗:', { title, category });
    throw new AppError('任務標題和分類為必填項目', 400);
  }

  if (!title.trim()) {
    console.error('❌ 標題為空字符串');
    throw new AppError('任務標題不能為空', 400);
  }

  // 驗證分類是否有效
  const validCategories = ['預約', '聯絡', '維護', '報告', '跟進', '其他'];
  if (!validCategories.includes(category)) {
    console.error('❌ 無效分類:', category, '有效分類:', validCategories);
    throw new AppError('無效的任務分類', 400);
  }

  // 驗證優先級
  const validPriorities = ['high', 'medium', 'low'];
  if (!validPriorities.includes(priority)) {
    console.error('❌ 無效優先級:', priority);
    throw new AppError('無效的優先級', 400);
  }

  // 確保用戶有 company_id (臨時跳過這個驗證)
  // if (!req.user.company_id) {
  //   console.error('❌ 用戶沒有 company_id:', req.user);
  //   throw new AppError('用戶未關聯公司，無法創建任務', 400);
  // }
  
  // 如果沒有 company_id，創建一個臨時的
  const companyId = req.user.company_id || new mongoose.Types.ObjectId();
  console.log('🏢 使用 company_id:', companyId);

  // 驗證分配對象是否存在（如果提供）
  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    console.error('❌ 無效的 assignedTo ID:', assignedTo);
    throw new AppError('無效的分配用戶ID', 400);
  }

  // 處理日期格式
  let parsedDueDate;
  if (dueDate) {
    try {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new Error('Invalid date');
      }
      console.log('📅 解析截止日期:', dueDate, '->', parsedDueDate);
    } catch (error) {
      console.error('❌ 日期解析錯誤:', dueDate, error);
      throw new AppError('無效的日期格式', 400);
    }
  }

  // 創建任務數據
  const taskData = {
    title: title.trim(),
    description: description?.trim(),
    priority,
    category,
    dueDate: parsedDueDate,
    assignedTo: assignedTo || req.user.id,
    customerId,
    propertyId,
    tags: tags || [],
    notes: notes?.trim(),
    createdBy: req.user.id,
    company_id: companyId
  };

  console.log('💾 準備保存任務數據:', taskData);

  // 創建任務
  const task = new Task(taskData);

  try {
    await task.save();
    console.log('✅ 任務保存成功:', task._id);
  } catch (saveError) {
    console.error('❌ 任務保存失敗:', saveError);
    throw new AppError('任務保存失敗: ' + (saveError as Error).message, 500);
  }

  // 返回創建的任務信息（簡化版，避免populate錯誤）
  let populatedTask;
  try {
    populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'first_name last_name email')
      .populate('assignedTo', 'first_name last_name email')
      .lean(); // 使用 lean() 提高性能
    
    console.log('✅ 任務數據填充成功');
  } catch (populateError) {
    console.warn('⚠️ 任務數據填充失敗，返回基本數據:', populateError);
    populatedTask = task.toObject();
  }

  const response = {
    success: true,
    data: { task: populatedTask }
  };

  console.log('📤 返回創建結果:', {
    success: response.success,
    taskId: response.data.task._id,
    title: response.data.task.title
  });

  res.status(201).json(response);

  logger.logBusiness('創建新任務', { 
    title, 
    category, 
    priority, 
    assignedTo: assignedTo || req.user.id,
    userId: req.user.id 
  });
}));

// 更新任務
router.put('/:id', authMiddleware, catchAsync(async (req: any, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('無效的任務ID格式', 400);
  }

  // 查找任務
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError('任務不存在', 404);
  }

  // 權限檢查
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
      task.createdBy?.toString() !== req.user.id) {
    throw new AppError('沒有權限修改此任務', 403);
  }

  // 驗證更新數據
  if (updateData.category && !['預約', '聯絡', '維護', '報告', '跟進', '其他'].includes(updateData.category)) {
    throw new AppError('無效的任務分類', 400);
  }

  if (updateData.priority && !['high', 'medium', 'low'].includes(updateData.priority)) {
    throw new AppError('無效的優先級', 400);
  }

  if (updateData.status && !['pending', 'in_progress', 'completed'].includes(updateData.status)) {
    throw new AppError('無效的任務狀態', 400);
  }

  // 不允許修改的字段
  delete updateData.createdBy;
  delete updateData.company_id;
  delete updateData.createdAt;

  // 設置更新者
  updateData.updatedBy = req.user.id;

  // 如果更新截止日期，驗證格式
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
    if (isNaN(updateData.dueDate.getTime())) {
      throw new AppError('無效的截止日期格式', 400);
    }
  }

  // 更新任務
  Object.assign(task, updateData);
  await task.save();

  // 返回更新後的任務信息
  const updatedTask = await Task.findById(id)
    .populate('createdBy', 'first_name last_name email')
    .populate('assignedTo', 'first_name last_name email')
    .populate('customerId', 'first_name last_name phone')
    .populate('propertyId', 'title address');

  res.json({
    success: true,
    data: { task: updatedTask }
  });

  logger.logBusiness('更新任務信息', { 
    taskId: id, 
    changes: Object.keys(updateData), 
    userId: req.user.id 
  });
}));

// 更新任務狀態
router.patch('/:id/status', authMiddleware, catchAsync(async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('無效的任務ID格式', 400);
  }

  if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
    throw new AppError('無效的任務狀態', 400);
  }

  // 查找任務
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError('任務不存在', 404);
  }

  // 權限檢查：創建者或分配者可以更新狀態
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    if (task.createdBy?.toString() !== req.user.id && 
        task.assignedTo?.toString() !== req.user.id) {
      throw new AppError('沒有權限修改此任務狀態', 403);
    }
  }

  // 更新狀態
  task.status = status;
  task.updatedBy = req.user.id;
  
  if (status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
  }

  await task.save();

  res.json({
    success: true,
    data: { 
      message: '任務狀態更新成功',
      status: task.status,
      completedAt: task.completedAt
    }
  });

  logger.logBusiness('更新任務狀態', { 
    taskId: id, 
    newStatus: status, 
    userId: req.user.id 
  });
}));

// 刪除任務
router.delete('/:id', authMiddleware, catchAsync(async (req: any, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('無效的任務ID格式', 400);
  }

  // 查找任務
  const task = await Task.findById(id);
  if (!task) {
    throw new AppError('任務不存在', 404);
  }

  // 權限檢查
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
      task.createdBy?.toString() !== req.user.id) {
    throw new AppError('沒有權限刪除此任務', 403);
  }

  // 硬刪除任務
  await Task.findByIdAndDelete(id);

  res.json({
    success: true,
    data: { message: '任務已刪除' }
  });

  logger.logBusiness('刪除任務', { 
    taskId: id, 
    title: task.title, 
    userId: req.user.id 
  });
}));

// 獲取任務統計
router.get('/stats/summary', authMiddleware, catchAsync(async (req: any, res) => {
  // 構建查詢條件
  const baseQuery: any = {};
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    baseQuery.$or = [
      { createdBy: req.user.id },
      { assignedTo: req.user.id }
    ];
  } else {
    baseQuery.company_id = req.user.company_id;
  }

  // 並行查詢各種統計數據
  const [
    totalCount,
    pendingCount,
    inProgressCount,
    completedCount,
    overdueCount,
    highPriorityCount
  ] = await Promise.all([
    Task.countDocuments(baseQuery),
    Task.countDocuments({ ...baseQuery, status: 'pending' }),
    Task.countDocuments({ ...baseQuery, status: 'in_progress' }),
    Task.countDocuments({ ...baseQuery, status: 'completed' }),
    Task.countDocuments({ 
      ...baseQuery, 
      status: { $ne: 'completed' }, 
      dueDate: { $lt: new Date() } 
    }),
    Task.countDocuments({ ...baseQuery, priority: 'high', status: { $ne: 'completed' } })
  ]);

  // 計算完成率
  const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      total: totalCount,
      pending: pendingCount,
      in_progress: inProgressCount,
      completed: completedCount,
      overdue: overdueCount,
      high_priority: highPriorityCount,
      completion_rate: parseFloat(completionRate as string)
    }
  });

  logger.logBusiness('獲取任務統計', { userId: req.user.id });
}));

// 獲取即將到期的任務
router.get('/stats/upcoming', authMiddleware, catchAsync(async (req: any, res) => {
  const { days = 7 } = req.query;
  
  const daysNum = parseInt(days as string) || 7;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + daysNum);

  // 構建查詢條件
  const baseQuery: any = {
    status: { $ne: 'completed' },
    dueDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    baseQuery.$or = [
      { createdBy: req.user.id },
      { assignedTo: req.user.id }
    ];
  } else {
    baseQuery.company_id = req.user.company_id;
  }

  const upcomingTasks = await Task.find(baseQuery)
    .populate('assignedTo', 'first_name last_name')
    .populate('customerId', 'first_name last_name')
    .populate('propertyId', 'title')
    .sort({ dueDate: 1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      upcoming_tasks: upcomingTasks,
      count: upcomingTasks.length,
      period_days: daysNum
    }
  });

  logger.logBusiness('獲取即將到期任務', { days: daysNum, userId: req.user.id });
}));

export default router;