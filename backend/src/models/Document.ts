import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface IDocument extends MongoDocument {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  description?: string;
  tags?: string[];
  category: 'property' | 'customer' | 'contract' | 'other';
  relatedTo?: {
    type: 'property' | 'customer';
    id: mongoose.Types.ObjectId;
  };
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  checksum: string;
  version: number;
  parentDocument?: mongoose.Types.ObjectId;
  status: 'active' | 'archived' | 'deleted';
}

const DocumentSchema = new Schema<IDocument>({
  filename: {
    type: String,
    required: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  path: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  category: {
    type: String,
    enum: ['property', 'customer', 'contract', 'other'],
    required: true,
    index: true
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['property', 'customer']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.type'
    }
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    pages: Number
  },
  checksum: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// 複合索引
DocumentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
DocumentSchema.index({ category: 1, status: 1 });
DocumentSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
DocumentSchema.index({ tags: 1 });

// 虛擬欄位
DocumentSchema.virtual('url').get(function() {
  return `/api/documents/${this._id}/download`;
});

DocumentSchema.virtual('thumbnailUrl').get(function() {
  if (this.mimetype.startsWith('image/')) {
    return `/api/documents/${this._id}/thumbnail`;
  }
  return null;
});

DocumentSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// 中間件
DocumentSchema.pre('save', function(next) {
  if (this.isNew) {
    // 新文檔時設置版本號
    if (!this.version) {
      this.version = 1;
    }
  }
  next();
});

DocumentSchema.pre('find', function() {
  this.where({ status: { $ne: 'deleted' } });
});

DocumentSchema.pre('findOne', function() {
  this.where({ status: { $ne: 'deleted' } });
});

DocumentSchema.pre('findOneAndUpdate', function() {
  this.where({ status: { $ne: 'deleted' } });
});

// 靜態方法
DocumentSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, status: 'active' }).sort({ uploadedAt: -1 });
};

DocumentSchema.statics.findByRelated = function(type: string, id: string) {
  return this.find({ 
    'relatedTo.type': type, 
    'relatedTo.id': id,
    status: 'active' 
  }).sort({ uploadedAt: -1 });
};

DocumentSchema.statics.findByUploader = function(uploaderId: string) {
  return this.find({ 
    uploadedBy: uploaderId,
    status: 'active' 
  }).sort({ uploadedAt: -1 });
};

// 實例方法
DocumentSchema.methods.softDelete = function() {
  this.status = 'deleted';
  return this.save();
};

DocumentSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

DocumentSchema.methods.restore = function() {
  this.status = 'active';
  return this.save();
};

DocumentSchema.methods.createVersion = function(newDocumentData: Partial<IDocument>) {
  const newVersion = new Document({
    ...newDocumentData,
    parentDocument: this._id,
    version: this.version + 1,
    uploadedBy: this.uploadedBy
  });
  
  return newVersion.save();
};

// 設置 JSON 輸出
DocumentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.path; // 不在 JSON 中暴露實際文件路徑
    return ret;
  }
});

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);