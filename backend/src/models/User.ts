import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  name: string; // computed field: first_name + last_name
  role: 'admin' | 'manager' | 'agent';
  phone?: string;
  line_id?: string;
  wechat_id?: string;
  company_id?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'agent'],
    default: 'agent'
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^09\d{8}$/.test(v);
      },
      message: '請輸入有效的台灣手機號碼'
    }
  },
  line_id: {
    type: String,
    trim: true,
    maxlength: 100
  },
  wechat_id: {
    type: String,
    trim: true,
    maxlength: 100
  },
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  avatar_url: {
    type: String,
    trim: true
  },
  last_login_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual field for full name
UserSchema.virtual('name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// 設置 JSON 輸出包含虛擬字段
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// 索引 (移除重複的 email 和 phone 索引，因為已在 schema 定義中設置 unique: true)
// UserSchema.index({ email: 1 }); // 已通過 unique: true 自動建立
// UserSchema.index({ phone: 1 }); // 已通過 unique: true 自動建立
UserSchema.index({ role: 1 });
UserSchema.index({ company_id: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ created_at: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
