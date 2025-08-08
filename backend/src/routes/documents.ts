import express from 'express';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Document } from '../models/Document';
import { 
  upload, 
  validateFile, 
  calculateChecksum, 
  cleanupTempFiles,
  getFileIcon,
  ensureUploadDirs
} from '../utils/fileUpload';

const router = express.Router();

// 確保上傳目錄存在
ensureUploadDirs();

// 上傳文件
router.post('/upload', authMiddleware, upload.array('files', 10), async (req: any, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { category = 'other', description, tags, relatedType, relatedId, isPublic = false } = req.body;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '沒有文件被上傳' 
      });
    }

    const uploadResults = [];
    const failedUploads = [];

    for (const file of files) {
      try {
        // 驗證文件
        const validation = validateFile(file);
        if (!validation.valid) {
          failedUploads.push({
            filename: file.originalname,
            error: validation.error
          });
          // 清理失敗的文件
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          continue;
        }

        // 計算文件校驗和
        const checksum = await calculateChecksum(file.path);

        // 檢查是否有重複文件
        const existingDoc = await Document.findOne({ 
          checksum, 
          status: 'active' 
        });

        if (existingDoc) {
          // 刪除重複文件
          fs.unlinkSync(file.path);
          
          uploadResults.push({
            filename: file.originalname,
            document: existingDoc,
            isDuplicate: true,
            message: '文件已存在'
          });
          continue;
        }

        // 創建文檔記錄
        const document = new Document({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedBy: userId,
          description,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          category,
          relatedTo: relatedType && relatedId ? {
            type: relatedType,
            id: relatedId
          } : undefined,
          isPublic: isPublic === 'true' || isPublic === true,
          checksum
        });

        await document.save();

        uploadResults.push({
          filename: file.originalname,
          document: document.toJSON(),
          isDuplicate: false,
          message: '上傳成功'
        });

      } catch (error) {
        console.error(`處理文件 ${file.originalname} 時發生錯誤:`, error);
        failedUploads.push({
          filename: file.originalname,
          error: '服務器處理錯誤'
        });

        // 清理失敗的文件
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      message: `處理完成：成功 ${uploadResults.length} 個，失敗 ${failedUploads.length} 個`,
      results: uploadResults,
      failed: failedUploads,
      total: files.length,
      successful: uploadResults.length,
      failed_count: failedUploads.length
    });

  } catch (error) {
    console.error('文件上傳錯誤:', error);
    
    // 清理所有上傳的文件
    if (req.files) {
      cleanupTempFiles(req.files as Express.Multer.File[]);
    }

    res.status(500).json({
      success: false,
      message: '文件上傳失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 獲取文檔列表（增強搜尋）
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tags,
      search,
      relatedType,
      relatedId,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      fileType, // 新增：按文件類型過濾
      dateFrom, // 新增：開始日期
      dateTo,   // 新增：結束日期
      sizeMin,  // 新增：最小文件大小
      sizeMax,  // 新增：最大文件大小
      uploader  // 新增：上傳者過濾
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // 構建查詢條件
    const query: any = { status: 'active' };

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // 增強搜尋功能
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { originalName: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { filename: searchRegex } // 新增：搜尋檔案名
      ];
    }

    // 文件類型過濾
    if (fileType) {
      switch (fileType) {
        case 'image':
          query.mimetype = { $regex: '^image/', $options: 'i' };
          break;
        case 'document':
          query.$or = [
            { mimetype: { $regex: 'pdf', $options: 'i' } },
            { mimetype: { $regex: 'word', $options: 'i' } },
            { mimetype: { $regex: 'excel', $options: 'i' } },
            { mimetype: { $regex: 'powerpoint', $options: 'i' } },
            { mimetype: { $regex: 'text', $options: 'i' } }
          ];
          break;
        case 'video':
          query.mimetype = { $regex: '^video/', $options: 'i' };
          break;
        case 'audio':
          query.mimetype = { $regex: '^audio/', $options: 'i' };
          break;
        case 'archive':
          query.$or = [
            { mimetype: { $regex: 'zip', $options: 'i' } },
            { mimetype: { $regex: 'rar', $options: 'i' } },
            { mimetype: { $regex: '7z', $options: 'i' } }
          ];
          break;
      }
    }

    // 日期範圍過濾
    if (dateFrom || dateTo) {
      query.uploadedAt = {};
      if (dateFrom) {
        query.uploadedAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.uploadedAt.$lte = new Date(dateTo as string);
      }
    }

    // 文件大小過濾
    if (sizeMin || sizeMax) {
      query.size = {};
      if (sizeMin) {
        query.size.$gte = parseInt(sizeMin as string);
      }
      if (sizeMax) {
        query.size.$lte = parseInt(sizeMax as string);
      }
    }

    // 上傳者過濾
    if (uploader) {
      query.uploadedBy = uploader;
    }

    if (relatedType && relatedId) {
      query['relatedTo.type'] = relatedType;
      query['relatedTo.id'] = relatedId;
    }

    // 構建排序
    const sort: any = {};
    const allowedSortFields = ['uploadedAt', 'originalName', 'size', 'category'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'uploadedAt';
    sort[sortField as string] = sortOrder === 'desc' ? -1 : 1;

    // 執行查詢
    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('uploadedBy', 'name email')
        .populate('relatedTo.id')
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),
      Document.countDocuments(query)
    ]);

    // 添加圖標信息和額外的元數據
    const documentsWithIcons = documents.map(doc => ({
      ...doc.toJSON(),
      icon: getFileIcon(doc.mimetype, doc.originalName),
      downloadUrl: `/api/documents/${doc._id}/download`,
      previewUrl: doc.mimetype.startsWith('image/') || doc.mimetype === 'application/pdf' 
        ? `/api/documents/${doc._id}/preview` : null
    }));

    res.json({
      success: true,
      documents: documentsWithIcons,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
        hasNext: pageNumber < Math.ceil(total / limitNumber),
        hasPrev: pageNumber > 1
      },
      filters: {
        category,
        tags,
        search,
        fileType,
        dateFrom,
        dateTo,
        sizeMin,
        sizeMax,
        uploader,
        sortBy: sortField,
        sortOrder
      }
    });

  } catch (error) {
    console.error('獲取文檔列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取文檔列表失敗'
    });
  }
});

// 獲取單個文檔信息
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('relatedTo.id');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    const documentWithIcon = {
      ...document.toJSON(),
      icon: getFileIcon(document.mimetype, document.originalName)
    };

    res.json({
      success: true,
      document: documentWithIcon
    });

  } catch (error) {
    console.error('獲取文檔錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取文檔失敗'
    });
  }
});

// 下載文件（增強權限控制）
router.get('/:id/download', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', '_id name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    // 權限檢查：公開文檔或自己上傳的文檔
    const canAccess = document.isPublic || 
                     document.uploadedBy._id.toString() === userId ||
                     req.user?.role === 'admin'; // 管理員可訪問所有文檔

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: '沒有權限下載此文檔'
      });
    }

    if (!fs.existsSync(document.path)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在於服務器'
      });
    }

    // 記錄下載日誌（可選）
    console.log(`文件下載: ${document.originalName} by ${req.user?.name || req.user?.email}`);

    // 設置下載頭
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimetype);
    res.setHeader('Content-Length', document.size.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 創建文件流並處理錯誤
    const fileStream = fs.createReadStream(document.path);
    
    fileStream.on('error', (error) => {
      console.error('文件流錯誤:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '文件讀取錯誤'
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('下載文件錯誤:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '下載文件失敗'
      });
    }
  }
});

// 預覽文件（用於圖片等）
router.get('/:id/preview', authMiddleware, async (req: any, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    if (!fs.existsSync(document.path)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 只允許預覽圖片和 PDF
    if (!document.mimetype.startsWith('image/') && document.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: '該文件類型不支持預覽'
      });
    }

    // 設置預覽頭
    res.setHeader('Content-Type', document.mimetype);
    res.setHeader('Content-Length', document.size.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小時緩存

    // 創建文件流
    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('預覽文件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '預覽文件失敗'
    });
  }
});

// 更新文檔信息
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { description, tags, category, isPublic, relatedType, relatedId } = req.body;
    const userId = req.user?.id;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    // 檢查權限（只有上傳者可以修改）
    if (document.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '沒有權限修改此文檔'
      });
    }

    // 更新文檔信息
    if (description !== undefined) document.description = description;
    if (tags !== undefined) {
      document.tags = typeof tags === 'string' ? 
        tags.split(',').map((tag: string) => tag.trim()) : tags;
    }
    if (category !== undefined) document.category = category;
    if (isPublic !== undefined) document.isPublic = isPublic;
    
    if (relatedType && relatedId) {
      document.relatedTo = {
        type: relatedType,
        id: relatedId
      };
    } else if (relatedType === null || relatedId === null) {
      document.relatedTo = undefined;
    }

    await document.save();

    res.json({
      success: true,
      message: '文檔信息更新成功',
      document: document.toJSON()
    });

  } catch (error) {
    console.error('更新文檔錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新文檔失敗'
    });
  }
});

// 刪除文檔（增強權限控制）
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    // 權限檢查：上傳者或管理員可刪除
    const canDelete = document.uploadedBy.toString() === userId || userRole === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: '沒有權限刪除此文檔'
      });
    }

    // 軟刪除
    await document.softDelete();

    // 記錄刪除日誌
    console.log(`文檔刪除: ${document.originalName} by ${req.user?.name || req.user?.email}`);

    res.json({
      success: true,
      message: '文檔刪除成功'
    });

  } catch (error) {
    console.error('刪除文檔錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除文檔失敗'
    });
  }
});

// 批量刪除文檔
router.post('/batch/delete', authMiddleware, async (req: any, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供要刪除的文檔ID列表'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const id of ids) {
      try {
        const document = await Document.findById(id);
        
        if (!document) {
          results.failed++;
          results.errors.push(`文檔 ${id} 不存在`);
          continue;
        }

        // 權限檢查
        const canDelete = document.uploadedBy.toString() === userId || userRole === 'admin';
        
        if (!canDelete) {
          results.failed++;
          results.errors.push(`沒有權限刪除文檔: ${document.originalName}`);
          continue;
        }

        await document.softDelete();
        results.success++;
        
        console.log(`批量刪除: ${document.originalName} by ${req.user?.name || req.user?.email}`);
        
      } catch (error) {
        results.failed++;
        results.errors.push(`刪除文檔 ${id} 時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }

    res.json({
      success: true,
      message: `批量刪除完成：成功 ${results.success} 個，失敗 ${results.failed} 個`,
      results
    });

  } catch (error) {
    console.error('批量刪除錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批量刪除失敗'
    });
  }
});

// 恢復已刪除的文檔（管理員功能）
router.post('/:id/restore', authMiddleware, async (req: any, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理員可以恢復文檔'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    if (document.status !== 'deleted') {
      return res.status(400).json({
        success: false,
        message: '文檔未被刪除，無需恢復'
      });
    }

    await document.restore();

    console.log(`文檔恢復: ${document.originalName} by ${req.user?.name || req.user?.email}`);

    res.json({
      success: true,
      message: '文檔恢復成功'
    });

  } catch (error) {
    console.error('恢復文檔錯誤:', error);
    res.status(500).json({
      success: false,
      message: '恢復文檔失敗'
    });
  }
});

// 快速搜尋（新增）
router.get('/search/quick', authMiddleware, async (req: any, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || (q as string).trim().length < 2) {
      return res.json({
        success: true,
        documents: [],
        message: '搜尋關鍵字至少需要2個字符'
      });
    }
    
    const searchTerm = (q as string).trim();
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    
    const documents = await Document.find({
      status: 'active',
      $or: [
        { originalName: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    })
    .populate('uploadedBy', 'name')
    .sort({ uploadedAt: -1 })
    .limit(parseInt(limit as string));
    
    const results = documents.map(doc => ({
      _id: doc._id,
      originalName: doc.originalName,
      description: doc.description,
      category: doc.category,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy,
      icon: getFileIcon(doc.mimetype, doc.originalName),
      sizeFormatted: doc.sizeFormatted
    }));
    
    res.json({
      success: true,
      documents: results,
      total: results.length
    });
    
  } catch (error) {
    console.error('快速搜尋錯誤:', error);
    res.status(500).json({
      success: false,
      message: '搜尋失敗'
    });
  }
});

// 獲取文檔統計
router.get('/stats/summary', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;

    const [
      totalDocuments,
      userDocuments,
      categoriesStats,
      recentDocuments,
      storageUsed
    ] = await Promise.all([
      Document.countDocuments({ status: 'active' }),
      Document.countDocuments({ uploadedBy: userId, status: 'active' }),
      Document.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$size' } } }
      ]),
      Document.find({ status: 'active' })
        .sort({ uploadedAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name'),
      Document.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    const totalStorage = storageUsed.length > 0 ? storageUsed[0].totalSize : 0;

    res.json({
      success: true,
      stats: {
        totalDocuments,
        userDocuments,
        totalStorage,
        totalStorageFormatted: formatBytes(totalStorage),
        categoriesStats,
        recentDocuments: recentDocuments.map(doc => ({
          ...doc.toJSON(),
          icon: getFileIcon(doc.mimetype, doc.originalName)
        }))
      }
    });

  } catch (error) {
    console.error('獲取文檔統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取統計信息失敗'
    });
  }
});

// 輔助函數：格式化文件大小
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;