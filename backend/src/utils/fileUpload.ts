import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// 文件類型配置
export const ALLOWED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  archives: ['.zip', '.rar', '.7z'],
  videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
  audio: ['.mp3', '.wav', '.flac', '.aac']
};

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.archives,
  ...ALLOWED_FILE_TYPES.videos,
  ...ALLOWED_FILE_TYPES.audio
];

// 文件大小限制（字節）
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB
  document: 50 * 1024 * 1024, // 50MB
  video: 100 * 1024 * 1024,   // 100MB
  audio: 20 * 1024 * 1024,    // 20MB
  archive: 100 * 1024 * 1024, // 100MB
  default: 10 * 1024 * 1024   // 10MB
};

// 上傳目錄配置
export const UPLOAD_DIRS = {
  documents: 'uploads/documents',
  images: 'uploads/images',
  videos: 'uploads/videos',
  audio: 'uploads/audio',
  archives: 'uploads/archives',
  temp: 'uploads/temp'
};

// 確保上傳目錄存在
export const ensureUploadDirs = () => {
  Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 獲取文件類型
export const getFileCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || 
      mimetype.includes('word') || 
      mimetype.includes('excel') || 
      mimetype.includes('powerpoint') ||
      mimetype.includes('text')) return 'document';
  if (mimetype.includes('zip') || 
      mimetype.includes('rar') || 
      mimetype.includes('archive')) return 'archive';
  return 'default';
};

// 獲取上傳目錄
export const getUploadDir = (mimetype: string): string => {
  const category = getFileCategory(mimetype);
  switch (category) {
    case 'image': return UPLOAD_DIRS.images;
    case 'video': return UPLOAD_DIRS.videos;
    case 'audio': return UPLOAD_DIRS.audio;
    case 'archive': return UPLOAD_DIRS.archives;
    default: return UPLOAD_DIRS.documents;
  }
};

// 生成唯一文件名
export const generateUniqueFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
};

// 計算文件校驗和
export const calculateChecksum = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// 文件過濾器
export const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALL_ALLOWED_TYPES.includes(ext)) {
    return callback(new Error(`不支持的文件類型: ${ext}`));
  }
  
  callback(null, true);
};

// 存儲配置
export const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, callback) => {
    const uploadDir = getUploadDir(file.mimetype);
    ensureUploadDirs();
    callback(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, callback) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    callback(null, uniqueName);
  }
});

// 文件大小限制檢查
export const getSizeLimit = (mimetype: string): number => {
  const category = getFileCategory(mimetype);
  return FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
};

// 動態大小限制
export const dynamicLimits = (req: Request, file: Express.Multer.File): number => {
  return getSizeLimit(file.mimetype);
};

// Multer 配置
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 最大限制
    files: 10, // 最多10個文件
    fields: 20, // 最多20個表單字段
    fieldSize: 1024 * 1024 // 1MB 字段大小
  }
});

// 驗證文件
export const validateFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  const ext = path.extname(file.originalname).toLowerCase();
  const category = getFileCategory(file.mimetype);
  const sizeLimit = getSizeLimit(file.mimetype);
  
  // 檢查文件類型
  if (!ALL_ALLOWED_TYPES.includes(ext)) {
    return { valid: false, error: `不支持的文件類型: ${ext}` };
  }
  
  // 檢查文件大小
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / 1024 / 1024);
    return { valid: false, error: `文件大小超過限制 (${limitMB}MB)` };
  }
  
  // 檢查 MIME 類型匹配
  const expectedMimeTypes: { [key: string]: string[] } = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.mp4': ['video/mp4'],
    '.zip': ['application/zip']
  };
  
  const expectedTypes = expectedMimeTypes[ext];
  if (expectedTypes && !expectedTypes.includes(file.mimetype)) {
    return { valid: false, error: '文件類型與副檔名不匹配' };
  }
  
  return { valid: true };
};

// 清理臨時文件
export const cleanupTempFiles = (files: Express.Multer.File[]) => {
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// 獲取文件圖標
export const getFileIcon = (mimetype: string, filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  
  switch (ext) {
    case '.pdf': return '📄';
    case '.doc':
    case '.docx': return '📝';
    case '.xls':
    case '.xlsx': return '📊';
    case '.ppt':
    case '.pptx': return '📋';
    case '.zip':
    case '.rar':
    case '.7z': return '📦';
    case '.txt': return '📃';
    default: return '📁';
  }
};

// 檢查磁盤空間
export const checkDiskSpace = async (requiredSpace: number): Promise<boolean> => {
  try {
    const stats = fs.statSync('.');
    // 簡化實現，實際應用中應該檢查真實磁盤空間
    return true;
  } catch (error) {
    console.error('檢查磁盤空間錯誤:', error);
    return false;
  }
};

// 生成縮略圖（圖片）
export const generateThumbnail = async (imagePath: string, outputPath: string): Promise<void> => {
  // 這裡應該使用圖像處理庫如 sharp 來生成縮略圖
  // 簡化實現，實際應用中需要安裝和配置 sharp
  console.log(`生成縮略圖: ${imagePath} -> ${outputPath}`);
  
  // 模擬縮略圖生成
  fs.copyFileSync(imagePath, outputPath);
};

export default {
  upload,
  validateFile,
  calculateChecksum,
  generateUniqueFilename,
  getFileCategory,
  getUploadDir,
  ensureUploadDirs,
  cleanupTempFiles,
  getFileIcon,
  checkDiskSpace,
  generateThumbnail
};