import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  license_number?: string;
  status: 'active' | 'inactive';
  settings: {
    timezone: string;
    currency: string;
    language: string;
  };
  created_at: Date;
  updated_at: Date;
}

const CompanySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  address: {
    type: String,
    trim: true,
    maxlength: 255
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
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
  website: {
    type: String,
    trim: true,
    maxlength: 255
  },
  logo_url: {
    type: String,
    trim: true,
    maxlength: 255
  },
  license_number: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Taipei'
    },
    currency: {
      type: String,
      default: 'TWD'
    },
    language: {
      type: String,
      default: 'zh-TW'
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 索引
CompanySchema.index({ name: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ created_at: -1 });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);