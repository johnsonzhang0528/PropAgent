import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip
} from 'recharts';
import { Card, Typography, Spin, Empty } from 'antd';

const { Title } = Typography;

interface CustomerStatusData {
  status: string;
  count: number;
}

interface CustomerStatusChartProps {
  data: CustomerStatusData[];
  loading?: boolean;
  title?: string;
}

const COLORS = {
  'active': '#52c41a',
  'inactive': '#faad14', 
  'completed': '#1890ff',
  'lost': '#ff4d4f'
};

const STATUS_LABELS = {
  'active': '活躍',
  'inactive': '非活躍',
  'completed': '已成交',
  'lost': '流失'
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          {data.displayName}
        </p>
        <p style={{ margin: 0, color: '#666' }}>
          數量: <span style={{ fontWeight: 'bold' }}>{data.count}</span>
        </p>
        <p style={{ margin: 0, color: '#666' }}>
          占比: <span style={{ fontWeight: 'bold' }}>{data.percentage?.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomerStatusChart: React.FC<CustomerStatusChartProps> = ({ 
  data, 
  loading = false, 
  title = "客戶狀態分布" 
}) => {
  // 數據驗證和處理
  const hasValidData = data && Array.isArray(data) && data.length > 0;
  
  let processedData: any[] = [];
  let total = 0;
  
  if (hasValidData) {
    total = data.reduce((sum, item) => sum + (item.count || 0), 0);
    processedData = data
      .filter(item => item.count > 0) // 過濾掉 0 值
      .map(item => ({
        ...item,
        displayName: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
        color: COLORS[item.status as keyof typeof COLORS] || '#8884d8',
        percentage: total > 0 ? (item.count / total) * 100 : 0
      }));
  }

  const renderCustomLabel = (entry: any) => {
    const percentage = entry.percentage || 0;
    if (percentage < 5) return ''; // 不顯示太小的標籤
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <Card title={title} style={{ height: '400px' }}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Spin size="large" tip="正在載入客戶狀態數據..." />
        </div>
      ) : !hasValidData || total === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Empty 
            description="暫無客戶狀態數據" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </div>
      ) : (
        <div>
          <PieChart width={700} height={280}>
            <Pie
              data={processedData}
              cx={350}
              cy={140}
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              innerRadius={0}
              fill="#8884d8"
              dataKey="count"
              animationBegin={0}
              animationDuration={800}
            >
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {entry.payload?.displayName || value}
                </span>
              )}
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: '12px'
              }}
            />
          </PieChart>
          
          <div style={{ 
            textAlign: 'center', 
            marginTop: 8, 
            color: '#666',
            fontSize: '12px'
          }}>
            總計: {total.toLocaleString()} 位客戶
          </div>
        </div>
      )}
    </Card>
  );
};

export default CustomerStatusChart;