import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  agent_id: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  first_name: string;
  last_name: string;
  name: string; // computed field
  email?: string;
  phone: string;
  line_id?: string;
  wechat_id?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  occupation?: string;
  annual_income?: number;
  marital_status?: string;
  family_members?: number;
  source?: string;
  referral_source?: string;
  status: 'active' | 'inactive' | 'completed' | 'lost';
  tags: string[];
  notes?: string;
  purchase_intent_score: number; // 0-10
  last_contact_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const CustomerSchema: Schema = new Schema({
  agent_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
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
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /\S+@\S+\.\S+/.test(v);
      },
      message: '請輸入有效的郵箱地址'
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^09\d{8}$/.test(v);
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
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number,
    min: 18,
    max: 120
  },
  occupation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  annual_income: {
    type: Number,
    min: 0
  },
  marital_status: {
    type: String,
    trim: true,
    maxlength: 20
  },
  family_members: {
    type: Number,
    min: 1,
    max: 20
  },
  source: {
    type: String,
    trim: true,
    maxlength: 50
  },
  referral_source: {
    type: String,
    trim: true,
    maxlength: 255
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'lost'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  purchase_intent_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  last_contact_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual field for full name
CustomerSchema.virtual('name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// 索引
CustomerSchema.index({ agent_id: 1 });
CustomerSchema.index({ company_id: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ purchase_intent_score: -1 });
CustomerSchema.index({ created_at: -1 });
CustomerSchema.index({ last_contact_at: -1 });

// 複合索引
CustomerSchema.index({ agent_id: 1, status: 1 });
CustomerSchema.index({ company_id: 1, status: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);