import express from 'express';
import { Customer } from '../models/Customer';
import { Property } from '../models/Property';

const router = express.Router();

// 測試路由 - 繞過認證
router.get('/test/customer-stats', async (req, res) => {
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

// 客戶狀態分布
router.get('/test/customer-status-distribution', async (req, res) => {
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

    console.log('客戶狀態分布數據:', statusDistribution);
    res.json(statusDistribution);
  } catch (error) {
    console.error('獲取客戶狀態分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 購買意願分布
router.get('/test/purchase-intent-distribution', async (req, res) => {
  try {
    const intentDistribution = await Customer.aggregate([
      {
        $project: {
          scoreRange: {
            $switch: {
              branches: [
                { case: { $lte: ['$purchase_intent_score', 5] }, then: '0-5' },
                { case: { $lte: ['$purchase_intent_score', 6] }, then: '5-6' },
                { case: { $lte: ['$purchase_intent_score', 7] }, then: '6-7' },
                { case: { $lte: ['$purchase_intent_score', 8] }, then: '7-8' },
                { case: { $lte: ['$purchase_intent_score', 9] }, then: '8-9' }
              ],
              default: '9-10'
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
        $sort: { scoreRange: 1 }
      }
    ]);

    console.log('購買意願分布數據:', intentDistribution);
    res.json(intentDistribution);
  } catch (error) {
    console.error('獲取購買意願分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 房產統計數據
router.get('/test/property-stats', async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const availableProperties = await Property.countDocuments({ status: 'available' });
    const soldProperties = await Property.countDocuments({ status: { $in: ['sold', 'rented'] } });
    const reservedProperties = await Property.countDocuments({ status: 'pending' });

    // 計算平均價格
    const avgPriceResult = await Property.aggregate([
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' }
        }
      }
    ]);
    
    const averagePrice = avgPriceResult.length > 0 ? Math.round(avgPriceResult[0].averagePrice) : 0;

    res.json({
      total_properties: totalProperties,
      available_properties: availableProperties,
      sold_properties: soldProperties,
      reserved_properties: reservedProperties,
      average_price: averagePrice
    });
  } catch (error) {
    console.error('獲取房產統計數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 價格區間分布
router.get('/test/price-range-distribution', async (req, res) => {
  try {
    const priceDistribution = await Property.aggregate([
      {
        $project: {
          priceRange: {
            $switch: {
              branches: [
                { case: { $lt: ['$price', 1000000] }, then: '100萬以下' },
                { case: { $lt: ['$price', 2000000] }, then: '100-200萬' },
                { case: { $lt: ['$price', 3000000] }, then: '200-300萬' },
                { case: { $lt: ['$price', 5000000] }, then: '300-500萬' },
                { case: { $lt: ['$price', 10000000] }, then: '500-1000萬' }
              ],
              default: '1000萬以上'
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

    console.log('價格區間分布數據:', priceDistribution);
    res.json(priceDistribution);
  } catch (error) {
    console.error('獲取價格區間分布錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 月度趨勢數據
router.get('/test/monthly-trends', async (req, res) => {
  try {
    const customerTrends = await Customer.aggregate([
      {
        $project: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          count: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
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
        $project: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
          count: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
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

    console.log('月度趨勢數據:', { customerTrends, propertyTrends });
    res.json({
      customer_trends: customerTrends,
      property_trends: propertyTrends
    });
  } catch (error) {
    console.error('獲取月度趨勢數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 地區分布數據
router.get('/test/location-distribution', async (req, res) => {
  try {
    const propertyDistribution = await Property.aggregate([
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

    // 模擬客戶偏好數據
    const customerPreferences = [
      { location: '台北市', count: 45 },
      { location: '新北市', count: 38 },
      { location: '桃園市', count: 23 },
      { location: '台中市', count: 18 },
      { location: '高雄市', count: 12 }
    ];

    console.log('地區分布數據:', { propertyDistribution, customerPreferences });
    res.json({
      property_distribution: propertyDistribution,
      customer_preferences: customerPreferences
    });
  } catch (error) {
    console.error('獲取地區分布數據錯誤:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

export default router;