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

// 獲取文檔列表
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
      sortOrder = 'desc'
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

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    if (relatedType && relatedId) {
      query['relatedTo.type'] = relatedType;
      query['relatedTo.id'] = relatedId;
    }

    // 構建排序
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

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

    // 添加圖標信息
    const documentsWithIcons = documents.map(doc => ({
      ...doc.toJSON(),
      icon: getFileIcon(doc.mimetype, doc.originalName)
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

// 下載文件
router.get('/:id/download', authMiddleware, async (req: any, res) => {
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

    // 設置下載頭
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('Content-Type', document.mimetype);
    res.setHeader('Content-Length', document.size.toString());

    // 創建文件流
    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('下載文件錯誤:', error);
    res.status(500).json({
      success: false,
      message: '下載文件失敗'
    });
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

// 刪除文檔（軟刪除）
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文檔不存在'
      });
    }

    // 檢查權限
    if (document.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '沒有權限刪除此文檔'
      });
    }

    // 軟刪除
    await document.softDelete();

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