import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  dueDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  tags?: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  completedAt?: Date;
  isOverdue: boolean;
  daysRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema({
  title: {
    type: String,
    required: [true, '任務標題為必填項目'],
    trim: true,
    maxlength: [200, '任務標題不能超過200個字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '任務描述不能超過1000個字符']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
    required: [true, '優先級為必填項目']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
    required: [true, '任務狀態為必填項目']
  },
  category: {
    type: String,
    required: [true, '任務分類為必填項目'],
    enum: ['預約', '聯絡', '維護', '報告', '跟進', '其他']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v >= new Date();
      },
      message: '截止日期不能早於當前時間'
    }
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, '備註不能超過2000個字符']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虛擬欄位：是否逾期
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// 虛擬欄位：剩餘天數
TaskSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate || this.status === 'completed') return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// 索引優化
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ company_id: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });
TaskSchema.index({ priority: 1, status: 1 });
TaskSchema.index({ category: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

// 複合索引
TaskSchema.index({ company_id: 1, createdBy: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1, priority: -1 });

// 中間件：更新時設置 updatedBy
TaskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// 靜態方法：獲取用戶統計
TaskSchema.statics.getUserStats = function(userId: mongoose.Types.ObjectId, companyId?: mongoose.Types.ObjectId) {
  const matchQuery: any = { createdBy: userId };
  if (companyId) matchQuery.company_id = companyId;

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// 靜態方法：獲取逾期任務
TaskSchema.statics.getOverdueTasks = function(userId: mongoose.Types.ObjectId, companyId?: mongoose.Types.ObjectId) {
  const matchQuery: any = {
    createdBy: userId,
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() }
  };
  if (companyId) matchQuery.company_id = companyId;

  return this.find(matchQuery)
    .populate('assignedTo', 'first_name last_name')
    .populate('customerId', 'first_name last_name')
    .populate('propertyId', 'title')
    .sort({ dueDate: 1 });
};

export const Task = mongoose.model<ITask>('Task', TaskSchema);