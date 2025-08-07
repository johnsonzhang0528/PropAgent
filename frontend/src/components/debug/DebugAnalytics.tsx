import React, { useState, useEffect } from 'react';
import { Button, Card, Alert } from 'antd';
import { analyticsService } from '../../services/analyticsService';

const DebugAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setData(null);
    
    try {
      console.log('=== 開始測試 Analytics API ===');
      
      // 測試客戶狀態分布
      console.log('1. 測試客戶狀態分布...');
      const statusData = await analyticsService.getCustomerStatusDistribution();
      console.log('客戶狀態分布數據:', statusData);
      
      // 測試購買意願分布
      console.log('2. 測試購買意願分布...');
      const intentData = await analyticsService.getPurchaseIntentDistribution();
      console.log('購買意願分布數據:', intentData);
      
      // 測試房產價格分布
      console.log('3. 測試房產價格分布...');
      const priceData = await analyticsService.getPriceRangeDistribution();
      console.log('房產價格分布數據:', priceData);
      
      // 測試月度趨勢
      console.log('4. 測試月度趨勢...');
      const trendsData = await analyticsService.getMonthlyTrends();
      console.log('月度趨勢數據:', trendsData);
      
      console.log('=== API 測試完成 ===');
      
      setData({
        statusData,
        intentData,
        priceData,
        trendsData
      });
      
    } catch (error: any) {
      console.error('API 測試錯誤:', error);
      setError(`錯誤: ${error.message} | 狀態碼: ${error.response?.status || 'N/A'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Analytics API 調試工具">
        <Button 
          type="primary" 
          onClick={testAPI} 
          loading={loading}
          style={{ marginBottom: '16px' }}
        >
          測試 API 調用
        </Button>
        
        {error && (
          <Alert 
            message="API 錯誤" 
            description={error} 
            type="error" 
            style={{ marginBottom: '16px' }}
          />
        )}
        
        {data && (
          <div>
            <Alert 
              message="API 測試成功!" 
              type="success" 
              style={{ marginBottom: '16px' }}
            />
            
            <Card size="small" title="客戶狀態分布" style={{ marginBottom: '8px' }}>
              <pre>{JSON.stringify(data.statusData, null, 2)}</pre>
            </Card>
            
            <Card size="small" title="購買意願分布" style={{ marginBottom: '8px' }}>
              <pre>{JSON.stringify(data.intentData, null, 2)}</pre>
            </Card>
            
            <Card size="small" title="價格分布" style={{ marginBottom: '8px' }}>
              <pre>{JSON.stringify(data.priceData, null, 2)}</pre>
            </Card>
            
            <Card size="small" title="月度趨勢" style={{ marginBottom: '8px' }}>
              <pre>{JSON.stringify(data.trendsData, null, 2)}</pre>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DebugAnalytics;