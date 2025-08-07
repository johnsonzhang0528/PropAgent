import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Button, 
  message,
  Spin,
  Alert,
  Grid
} from 'antd';
import {
  ReloadOutlined,
  RiseOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined
} from '@ant-design/icons';

import CustomerStatusChart from '../charts/CustomerStatusChart';
import PurchaseIntentChart from '../charts/PurchaseIntentChart';
import PropertyPriceChart from '../charts/PropertyPriceChart';
import MonthlyTrendsChart from '../charts/MonthlyTrendsChart';

import { analyticsService, type CustomerStats, type PropertyStats } from '../../services/analyticsService';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface AnalyticsData {
  customerStats: CustomerStats;
  customerStatusDistribution: any[];
  purchaseIntentDistribution: any[];
  propertyStats: PropertyStats;
  priceRangeDistribution: any[];
  monthlyTrends: any;
  locationDistribution: any;
}

const AnalyticsDashboard: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // Redux 狀態
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // 載入分析數據
  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const analyticsData = await analyticsService.getAllAnalyticsData();
      setData(analyticsData);
    } catch (error: any) {
      console.error('載入分析數據失敗:', error);
      
      // 在開發模式下顯示詳細錯誤信息
      if (import.meta.env.DEV) {
        console.error('詳細錯誤信息:', error.response || error);
        setError(`開發模式錯誤: ${error.message}`);
        message.error(`API錯誤: ${error.response?.status || 'Network Error'}`);
      } else {
        // 檢查是否為認證錯誤
        if (error.response?.status === 401) {
          setError('認證已過期，請重新登入後再試');
          message.error('認證已過期，請重新登入');
        } else if (error.response?.status >= 500) {
          setError('服務器暫時無法使用，請稍後再試');
          message.error('服務器錯誤');
        } else {
          setError('載入分析數據失敗，請檢查網路連接');
          message.error('載入分析數據失敗');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // 刷新數據
  const handleRefresh = () => {
    loadAnalyticsData();
  };

  // 格式化數字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}萬`;
    }
    return num.toLocaleString();
  };

  // 格式化價格
  const formatPrice = (price: number): string => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(1)}萬`;
    }
    return formatNumber(price);
  };

  if (loading && !data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="載入失敗"
          description={error}
          type="error"
          action={
            <Button size="small" onClick={handleRefresh}>
              重試
            </Button>
          }
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="無數據"
          description="暫無分析數據可顯示"
          type="warning"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      {/* 標題和操作按鈕 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Title level={2} style={{ margin: 0 }}>
          數據分析儀表板
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            size={isMobile ? 'small' : 'large'}
            disabled={!isAuthenticated && !import.meta.env.DEV}
          >
            刷新數據
          </Button>
          {!isAuthenticated && (
            <Button 
              type="default" 
              onClick={() => window.location.href = '/login'}
              size={isMobile ? 'small' : 'large'}
            >
              登入
            </Button>
          )}
        </Space>
      </div>

      {/* 關鍵指標統計卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="總客戶數"
              value={data.customerStats.total_customers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }}
              formatter={formatNumber}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活躍客戶"
              value={data.customerStats.active_customers}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? '18px' : '24px' }}
              formatter={formatNumber}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="總房產數"
              value={data.propertyStats.total_properties}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#722ed1', fontSize: isMobile ? '18px' : '24px' }}
              formatter={formatNumber}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均房價"
              value={data.propertyStats.average_price}
              prefix={<DollarOutlined />}
              suffix="萬"
              valueStyle={{ color: '#fa8c16', fontSize: isMobile ? '18px' : '24px' }}
              formatter={(value) => formatPrice(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* 成功率和高意願客戶 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="成交成功率"
              value={parseFloat(data.customerStats.success_rate)}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#eb2f96', fontSize: isMobile ? '20px' : '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="高意願客戶"
              value={data.customerStats.potential_customers}
              suffix="人"
              valueStyle={{ color: '#13c2c2', fontSize: isMobile ? '20px' : '28px' }}
              formatter={formatNumber}
            />
          </Card>
        </Col>
      </Row>

      {/* 圖表區域 */}
      <Row gutter={[16, 16]}>
        {/* 客戶狀態分布 */}
        <Col xs={24} lg={12}>
          <CustomerStatusChart 
            data={data.customerStatusDistribution}
            loading={loading}
          />
        </Col>

        {/* 購買意願分布 */}
        <Col xs={24} lg={12}>
          <PurchaseIntentChart 
            data={data.purchaseIntentDistribution}
            loading={loading}
          />
        </Col>

        {/* 房產價格分布 */}
        <Col xs={24} lg={12}>
          <PropertyPriceChart 
            data={data.priceRangeDistribution}
            loading={loading}
          />
        </Col>

        {/* 月度趨勢 */}
        <Col xs={24} lg={12}>
          <MonthlyTrendsChart 
            data={data.monthlyTrends}
            loading={loading}
          />
        </Col>
      </Row>

      {/* 額外統計信息 */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="詳細統計" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>房產狀態</div>
                  <div>可售: <strong>{data.propertyStats.available_properties}</strong></div>
                  <div>已售: <strong>{data.propertyStats.sold_properties}</strong></div>
                  <div>預訂: <strong>{data.propertyStats.reserved_properties}</strong></div>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>客戶概況</div>
                  <div>已成交: <strong>{data.customerStats.completed_customers}</strong></div>
                  <div>成交率: <strong>{data.customerStats.success_rate}%</strong></div>
                  <div>高意願比例: <strong>
                    {data.customerStats.total_customers > 0 
                      ? ((data.customerStats.potential_customers / data.customerStats.total_customers) * 100).toFixed(1)
                      : 0}%
                  </strong></div>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>數據更新</div>
                  <div>更新時間: <strong>{new Date().toLocaleString('zh-TW')}</strong></div>
                  <div>數據來源: <strong>即時數據庫</strong></div>
                  <div>刷新間隔: <strong>手動刷新</strong></div>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;