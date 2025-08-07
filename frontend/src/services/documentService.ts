import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 創建 axios 實例
const documentApi = axios.create({
  baseURL: `${API_BASE_URL}/documents`,
  timeout: 30000, // 30秒超時（文件上傳需要更長時間）
});

// 請求攔截器 - 添加認證 token
documentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理錯誤
documentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期，清除本地存儲並重定向到登入頁
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 介面定義
export interface DocumentInfo {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  description?: string;
  tags?: string[];
  category: 'property' | 'customer' | 'contract' | 'other';
  relatedTo?: {
    type: 'property' | 'customer';
    id: string;
  };
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  version: number;
  status: 'active' | 'archived' | 'deleted';
  url: string;
  thumbnailUrl?: string;
  sizeFormatted: string;
  icon?: string;
}

export interface UploadResult {
  filename: string;
  document?: DocumentInfo;
  isDuplicate: boolean;
  message: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  results: UploadResult[];
  failed: Array<{ filename: string; error: string }>;
  total: number;
  successful: number;
  failed_count: number;
}

export interface DocumentListResponse {
  success: boolean;
  documents: DocumentInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DocumentStats {
  totalDocuments: number;
  userDocuments: number;
  totalStorage: number;
  totalStorageFormatted: string;
  categoriesStats: Array<{
    _id: string;
    count: number;
    size: number;
  }>;
  recentDocuments: DocumentInfo[];
}

export interface UploadOptions {
  category?: string;
  description?: string;
  tags?: string;
  relatedType?: string;
  relatedId?: string;
  isPublic?: boolean;
  onProgress?: (progress: number) => void;
}

// API 服務函數
export const documentService = {
  // 上傳文件
  async uploadFiles(files: FileList | File[], options: UploadOptions = {}): Promise<UploadResponse> {
    const formData = new FormData();
    
    // 添加文件
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    // 添加選項
    if (options.category) formData.append('category', options.category);
    if (options.description) formData.append('description', options.description);
    if (options.tags) formData.append('tags', options.tags);
    if (options.relatedType) formData.append('relatedType', options.relatedType);
    if (options.relatedId) formData.append('relatedId', options.relatedId);
    if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    };
    
    const response = await documentApi.post('/upload', formData, config);
    return response.data;
  },

  // 獲取文檔列表
  async getDocuments(params: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string;
    search?: string;
    relatedType?: string;
    relatedId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<DocumentListResponse> {
    const response = await documentApi.get('/', { params });
    return response.data;
  },

  // 獲取單個文檔信息
  async getDocument(id: string): Promise<{ success: boolean; document: DocumentInfo }> {
    const response = await documentApi.get(`/${id}`);
    return response.data;
  },

  // 下載文件
  async downloadDocument(id: string, filename?: string): Promise<void> {
    const response = await documentApi.get(`/${id}/download`, {
      responseType: 'blob',
    });
    
    // 創建下載鏈接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // 設置文件名
    const disposition = response.headers['content-disposition'];
    let downloadFilename = filename;
    
    if (disposition && disposition.includes('filename=')) {
      const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        downloadFilename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }
    
    link.setAttribute('download', downloadFilename || 'download');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 獲取預覽 URL
  getPreviewUrl(id: string): string {
    const token = localStorage.getItem('access_token');
    return `${API_BASE_URL}/documents/${id}/preview?token=${token}`;
  },

  // 更新文檔信息
  async updateDocument(id: string, data: {
    description?: string;
    tags?: string[];
    category?: string;
    isPublic?: boolean;
    relatedType?: string;
    relatedId?: string;
  }): Promise<{ success: boolean; message: string; document: DocumentInfo }> {
    const response = await documentApi.put(`/${id}`, data);
    return response.data;
  },

  // 刪除文檔
  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await documentApi.delete(`/${id}`);
    return response.data;
  },

  // 獲取文檔統計
  async getDocumentStats(): Promise<{ success: boolean; stats: DocumentStats }> {
    const response = await documentApi.get('/stats/summary');
    return response.data;
  },

  // 根據關聯對象獲取文檔
  async getRelatedDocuments(type: 'property' | 'customer', id: string): Promise<DocumentInfo[]> {
    const response = await this.getDocuments({
      relatedType: type,
      relatedId: id,
      limit: 100
    });
    return response.documents;
  },

  // 根據分類獲取文檔
  async getDocumentsByCategory(category: string): Promise<DocumentInfo[]> {
    const response = await this.getDocuments({
      category,
      limit: 100
    });
    return response.documents;
  },

  // 搜索文檔
  async searchDocuments(query: string, filters: {
    category?: string;
    tags?: string[];
  } = {}): Promise<DocumentInfo[]> {
    const params: any = {
      search: query,
      limit: 100
    };
    
    if (filters.category) params.category = filters.category;
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }
    
    const response = await this.getDocuments(params);
    return response.documents;
  },

  // 批量刪除文檔
  async deleteDocuments(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      ids.map(id => this.deleteDocument(id))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason?.message || '未知錯誤');
    
    return {
      success: successful,
      failed,
      errors
    };
  },

  // 檢查文件類型
  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  },

  isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  },

  isDocumentFile(mimetype: string): boolean {
    return mimetype.includes('pdf') || 
           mimetype.includes('word') || 
           mimetype.includes('excel') || 
           mimetype.includes('powerpoint') ||
           mimetype.includes('text');
  },

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 獲取文件圖標
  getFileIcon(mimetype: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📋';
      case 'zip':
      case 'rar':
      case '7z': return '📦';
      case 'txt': return '📃';
      default: return '📁';
    }
  }
};

export default documentService;