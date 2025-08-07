import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface INotification extends MongoDocument {
  type: 'email' | 'sms' | 'push' | 'system';
  category: 'customer' | 'property' | 'document' | 'system' | 'reminder';
  title: string;
  message: string;
  recipient: {
    type: 'user' | 'customer';
    id: mongoose.Types.ObjectId;
    email?: string;
    phone?: string;
  };
  sender?: mongoose.Types.ObjectId;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  metadata?: {
    emailId?: string;
    smsId?: string;
    pushId?: string;
    retryCount?: number;
    relatedEntityType?: string;
    relatedEntityId?: mongoose.Types.ObjectId;
    templateUsed?: string;
    attachments?: string[];
  };
  isRead: boolean;
  isArchived: boolean;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'system'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['customer', 'property', 'document', 'system', 'reminder'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  recipient: {
    type: {
      type: String,
      enum: ['user', 'customer'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipient.type'
    },
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: '無效的郵箱格式'
      }
    },
    phone: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^09\d{8}$/.test(v);
        },
        message: '無效的電話號碼格式'
      }
    }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  failureReason: {
    type: String,
    maxlength: 500
  },
  metadata: {
    emailId: String,
    smsId: String,
    pushId: String,
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    relatedEntityType: {
      type: String,
      enum: ['customer', 'property', 'document', 'user']
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    templateUsed: String,
    attachments: [String]
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// 複合索引
NotificationSchema.index({ 'recipient.id': 1, createdAt: -1 });
NotificationSchema.index({ 'recipient.id': 1, isRead: 1, isArchived: 1 });
NotificationSchema.index({ type: 1, status: 1, scheduledAt: 1 });
NotificationSchema.index({ category: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: -1 });

// 虛擬欄位
NotificationSchema.virtual('isOverdue').get(function() {
  if (!this.scheduledAt) return false;
  return this.status === 'pending' && this.scheduledAt < new Date();
});

NotificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

NotificationSchema.virtual('deliveryDuration').get(function() {
  if (!this.sentAt || !this.deliveredAt) return null;
  return this.deliveredAt.getTime() - this.sentAt.getTime();
});

// 中間件
NotificationSchema.pre('save', function(next) {
  // 自動設置到期時間
  if (this.isNew && !this.expiresAt) {
    const expiryDays = this.priority === 'low' ? 30 : this.priority === 'normal' ? 60 : 90;
    this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  }
  
  // 自動設置已讀時間
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// 靜態方法
NotificationSchema.statics.findUnread = function(recipientId: string) {
  return this.find({
    'recipient.id': recipientId,
    isRead: false,
    isArchived: false
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.findByRecipient = function(recipientId: string, options: {
  limit?: number;
  page?: number;
  category?: string;
  type?: string;
  isRead?: boolean;
} = {}) {
  const query: any = {
    'recipient.id': recipientId,
    isArchived: false
  };
  
  if (options.category) query.category = options.category;
  if (options.type) query.type = options.type;
  if (options.isRead !== undefined) query.isRead = options.isRead;
  
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name email')
    .populate('recipient.id');
};

NotificationSchema.statics.findPending = function() {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } }
    ]
  }).sort({ priority: -1, scheduledAt: 1 });
};

NotificationSchema.statics.findFailed = function() {
  return this.find({
    status: 'failed',
    'metadata.retryCount': { $lt: 3 }
  }).sort({ createdAt: 1 });
};

NotificationSchema.statics.getStatsByRecipient = function(recipientId: string) {
  return this.aggregate([
    {
      $match: {
        'recipient.id': new mongoose.Types.ObjectId(recipientId),
        isArchived: false
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$isRead', false] }, 1, 0]
          }
        },
        urgent: {
          $sum: {
            $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// 實例方法
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsArchived = function() {
  this.isArchived = true;
  return this.save();
};

NotificationSchema.methods.markAsSent = function(externalId?: string) {
  this.status = 'sent';
  this.sentAt = new Date();
  
  if (externalId) {
    if (!this.metadata) this.metadata = {};
    
    switch (this.type) {
      case 'email':
        this.metadata.emailId = externalId;
        break;
      case 'sms':
        this.metadata.smsId = externalId;
        break;
      case 'push':
        this.metadata.pushId = externalId;
        break;
    }
  }
  
  return this.save();
};

NotificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsFailed = function(reason: string) {
  this.status = 'failed';
  this.failureReason = reason;
  
  if (!this.metadata) this.metadata = {};
  this.metadata.retryCount = (this.metadata.retryCount || 0) + 1;
  
  return this.save();
};

NotificationSchema.methods.retry = function() {
  if (this.status !== 'failed') {
    throw new Error('只能重試失敗的通知');
  }
  
  if ((this.metadata?.retryCount || 0) >= 3) {
    throw new Error('重試次數已達上限');
  }
  
  this.status = 'pending';
  this.failureReason = undefined;
  this.scheduledAt = new Date();
  
  return this.save();
};

NotificationSchema.methods.schedule = function(scheduleTime: Date) {
  this.scheduledAt = scheduleTime;
  this.status = 'pending';
  return this.save();
};

// 設置 JSON 輸出
NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);