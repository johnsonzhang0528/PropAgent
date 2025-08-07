import express from 'express';
import { Customer } from '../models/Customer';
import { Property } from '../models/Property';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 獲取客戶統計數據
router.get('/customer-stats', authMiddleware, async (req: any, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const potentialCustomers = await Customer.countDocuments({ 
      purchase_intent_score: { $gte: 8 } 
    });
    const completedCustomers = await Customer.countDocuments({ status: 'completed' });
    
    const successRate = totalCustomers > 0 
      ? ((completedCustomers / totalCustomers) * 100).toFixed(1)
      : '0.0';

    res.json({
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      potential_customers: potentialCustomers,
      completed_customers: completedCustomers,
      success_rate: successRate
    });
  } catch (error) {
    console.error('獲取客戶統計數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取客戶狀態分布數據
router.get('/customer-status-distribution', authMiddleware, async (req: any, res) => {
  try {
    const statusDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(statusDistribution);
  } catch (error) {
    console.error('獲取客戶狀態分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取意願分數分布數據
router.get('/purchase-intent-distribution', authMiddleware, async (req: any, res) => {
  try {
    const intentDistribution = await Customer.aggregate([
      {
        $project: {
          scoreRange: {
            $switch: {
              branches: [
                { case: { $gte: ['$purchase_intent_score', 9] }, then: '9-10' },
                { case: { $gte: ['$purchase_intent_score', 8] }, then: '8-9' },
                { case: { $gte: ['$purchase_intent_score', 7] }, then: '7-8' },
                { case: { $gte: ['$purchase_intent_score', 6] }, then: '6-7' },
                { case: { $gte: ['$purchase_intent_score', 5] }, then: '5-6' }
              ],
              default: '0-5'
            }
          }
        }
      },
      {
        $group: {
          _id: '$scoreRange',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          scoreRange: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { scoreRange: -1 }
      }
    ]);

    res.json(intentDistribution);
  } catch (error) {
    console.error('獲取意願分數分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取房產統計數據
router.get('/property-stats', authMiddleware, async (req: any, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const availableProperties = await Property.countDocuments({ 
      status: 'available' 
    });
    const soldProperties = await Property.countDocuments({ 
      status: 'sold' 
    });
    const reservedProperties = await Property.countDocuments({ 
      status: 'reserved' 
    });

    const averagePrice = await Property.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    res.json({
      total_properties: totalProperties,
      available_properties: availableProperties,
      sold_properties: soldProperties,
      reserved_properties: reservedProperties,
      average_price: averagePrice.length > 0 ? Math.round(averagePrice[0].avgPrice) : 0
    });
  } catch (error) {
    console.error('獲取房產統計數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取價格區間分布
router.get('/price-range-distribution', authMiddleware, async (req: any, res) => {
  try {
    const priceDistribution = await Property.aggregate([
      {
        $project: {
          priceRange: {
            $switch: {
              branches: [
                { case: { $gte: ['$price', 10000000] }, then: '1000萬以上' },
                { case: { $gte: ['$price', 5000000] }, then: '500-1000萬' },
                { case: { $gte: ['$price', 3000000] }, then: '300-500萬' },
                { case: { $gte: ['$price', 2000000] }, then: '200-300萬' },
                { case: { $gte: ['$price', 1000000] }, then: '100-200萬' }
              ],
              default: '100萬以下'
            }
          }
        }
      },
      {
        $group: {
          _id: '$priceRange',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          priceRange: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(priceDistribution);
  } catch (error) {
    console.error('獲取價格區間分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取時間趨勢數據
router.get('/monthly-trends', authMiddleware, async (req: any, res) => {
  try {
    const customerTrends = await Customer.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    const propertyTrends = await Property.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { year: 1, month: 1 }
      }
    ]);

    res.json({
      customer_trends: customerTrends,
      property_trends: propertyTrends
    });
  } catch (error) {
    console.error('獲取時間趨勢數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 獲取地區分布數據
router.get('/location-distribution', authMiddleware, async (req: any, res) => {
  try {
    const propertyLocationDistribution = await Property.aggregate([
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          district: '$_id',
          count: 1,
          averagePrice: { $round: ['$averagePrice', 0] },
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      property_distribution: propertyLocationDistribution
    });
  } catch (error) {
    console.error('獲取地區分布數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

export default router;