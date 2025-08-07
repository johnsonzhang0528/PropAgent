import express from 'express';
import { Property } from '../models/Property';
import { Customer } from '../models/Customer';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 獲取物件列表
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      property_type,
      listing_type,
      min_price,
      max_price,
      min_area,
      max_area,
      district,
      bedrooms,
      status = 'available',
      agent_id,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // 構建查詢條件
    const query: any = { status };

    // 權限控制
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.agent_id = req.user.id;
    } else if (agent_id) {
      query.agent_id = agent_id;
    }

    // 篩選條件
    if (property_type) query.property_type = property_type;
    if (listing_type) query.listing_type = listing_type;
    if (district) query.district = { $regex: district, $options: 'i' };
    if (bedrooms) query.bedrooms = parseInt(bedrooms as string);

    // 價格範圍
    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = parseFloat(min_price as string);
      if (max_price) query.price.$lte = parseFloat(max_price as string);
    }

    // 面積範圍
    if (min_area || max_area) {
      query.area = {};
      if (min_area) query.area.$gte = parseFloat(min_area as string);
      if (max_area) query.area.$lte = parseFloat(max_area as string);
    }

    // 排序
    const sortOptions: any = {};
    sortOptions[sort_by as string] = sort_order === 'desc' ? -1 : 1;

    // 分頁
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 查詢物件
    const properties = await Property.find(query)
      .populate('agent_id', 'first_name last_name email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 總數
    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('獲取物件列表錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 獲取單個物件詳細信息
router.get('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id)
      .populate('agent_id', 'first_name last_name email phone')
      .populate('company_id', 'name');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: '物件不存在' }
      });
    }

    res.json({
      success: true,
      data: { property }
    });
  } catch (error) {
    console.error('獲取物件詳情錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 創建新物件
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const {
      property_type,
      listing_type,
      title,
      description,
      address,
      district,
      city,
      postal_code,
      coordinates,
      price,
      area,
      area_unit,
      bedrooms,
      bathrooms,
      parking_spots,
      floor,
      total_floors,
      building_age,
      features,
      amenities,
      transport_info,
      school_district,
      available_from,
      images,
      documents,
      virtual_tour_url,
      listing_expires_at
    } = req.body;

    // 創建物件
    const property = new Property({
      agent_id: req.user.id,
      company_id: req.user.company_id,
      property_type,
      listing_type,
      title,
      description,
      address,
      district,
      city,
      postal_code,
      coordinates,
      price,
      area,
      area_unit: area_unit || 'ping',
      bedrooms,
      bathrooms,
      parking_spots,
      floor,
      total_floors,
      building_age,
      features: features || [],
      amenities: amenities || [],
      transport_info: transport_info || {},
      school_district,
      available_from,
      images: images || [],
      documents: documents || [],
      virtual_tour_url,
      listing_expires_at
    });

    await property.save();

    // 返回創建的物件信息
    const populatedProperty = await Property.findById(property._id)
      .populate('agent_id', 'first_name last_name email');

    res.status(201).json({
      success: true,
      data: { property: populatedProperty }
    });
  } catch (error) {
    console.error('創建物件錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 更新物件信息
router.put('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 查找物件
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: '物件不存在' }
      });
    }

    // 檢查權限
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        property.agent_id?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限修改此物件' }
      });
    }

    // 不允許修改的字段
    delete updateData.agent_id;
    delete updateData.company_id;
    delete updateData.created_at;

    // 更新物件
    Object.assign(property, updateData);
    await property.save();

    // 返回更新後的物件信息
    const updatedProperty = await Property.findById(id)
      .populate('agent_id', 'first_name last_name email');

    res.json({
      success: true,
      data: { property: updatedProperty }
    });
  } catch (error) {
    console.error('更新物件錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 刪除物件
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    // 查找物件
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: '物件不存在' }
      });
    }

    // 檢查權限
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        property.agent_id?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '沒有權限刪除此物件' }
      });
    }

    // 軟刪除：將狀態設為 withdrawn
    property.status = 'withdrawn';
    await property.save();

    res.json({
      success: true,
      data: { message: '物件已刪除' }
    });
  } catch (error) {
    console.error('刪除物件錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 智能客戶配對
router.get('/:id/matches', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    // 查找物件
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROPERTY_NOT_FOUND', message: '物件不存在' }
      });
    }

    // 構建客戶匹配查詢條件
    const matchQuery: any = {
      status: 'active'
    };

    // 根據物件屬性匹配客戶需求
    const customerMatches = await Customer.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          match_score: {
            $add: [
              // 基礎分數
              { $cond: [{ $eq: ['$status', 'active'] }, 20, 0] },
              // 購買意願評分 (0-50分)
              { $multiply: ['$purchase_intent_score', 5] },
              // 最近聯繫時間 (0-20分)
              {
                $cond: [
                  { $gte: ['$last_contact_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                  20,
                  { $cond: [
                    { $gte: ['$last_contact_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                    10,
                    0
                  ]}
                ]
              },
              // 高意願客戶加分 (0-10分)
              { $cond: [{ $gte: ['$purchase_intent_score', 7] }, 10, 0] }
            ]
          }
        }
      },
      { $match: { match_score: { $gte: 30 } } },
      { $sort: { match_score: -1 } },
      { $limit: parseInt(limit as string) },
      {
        $lookup: {
          from: 'users',
          localField: 'agent_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          phone: 1,
          email: 1,
          purchase_intent_score: 1,
          tags: 1,
          last_contact_at: 1,
          match_score: 1,
          agent: { $arrayElemAt: ['$agent', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        property_id: property._id,
        property_title: property.title,
        matched_customers: customerMatches,
        total_matches: customerMatches.length
      }
    });
  } catch (error) {
    console.error('客戶配對錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

// 物件統計數據
router.get('/stats/overview', authMiddleware, async (req: any, res) => {
  try {
    const { agent_id } = req.query;
    
    // 構建查詢條件
    const baseQuery: any = {};
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      baseQuery.agent_id = req.user.id;
    } else if (agent_id) {
      baseQuery.agent_id = agent_id;
    }

    // 並行查詢統計數據
    const [
      totalCount,
      availableCount,
      soldCount,
      rentedCount,
      averagePrice,
      totalValue
    ] = await Promise.all([
      Property.countDocuments(baseQuery),
      Property.countDocuments({ ...baseQuery, status: 'available' }),
      Property.countDocuments({ ...baseQuery, status: 'sold' }),
      Property.countDocuments({ ...baseQuery, status: 'rented' }),
      Property.aggregate([
        { $match: { ...baseQuery, status: 'available' } },
        { $group: { _id: null, avgPrice: { $avg: '$price' } } }
      ]),
      Property.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, totalValue: { $sum: '$price' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_properties: totalCount,
        available_properties: availableCount,
        sold_properties: soldCount,
        rented_properties: rentedCount,
        average_price: averagePrice[0]?.avgPrice || 0,
        total_portfolio_value: totalValue[0]?.totalValue || 0,
        success_rate: totalCount > 0 ? ((soldCount + rentedCount) / totalCount * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('獲取物件統計錯誤:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器錯誤' }
    });
  }
});

export default router;