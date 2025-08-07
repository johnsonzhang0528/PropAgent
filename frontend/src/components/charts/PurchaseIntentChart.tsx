import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import { Card, Typography, Spin, Empty } from 'antd';

const { Title } = Typography;

interface PurchaseIntentData {
  scoreRange: string;
  count: number;
}

interface PurchaseIntentChartProps {
  data: PurchaseIntentData[];
  loading?: boolean;
  title?: string;
}

const COLORS = ['#ff4d4f', '#faad14', '#1890ff', '#52c41a', '#13c2c2', '#722ed1'];
const RANGE_ORDER = ['0-5', '5-6', '6-7', '7-8', '8-9', '9-10'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          意願評分: {label}
        </p>
        <p style={{ margin: 0, color: '#666' }}>
          客戶數量: <span style={{ fontWeight: 'bold' }}>{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PurchaseIntentChart: React.FC<PurchaseIntentChartProps> = ({ 
  data, 
  loading = false, 
  title = "購買意願分布" 
}) => {
  // 數據驗證
  const hasValidData = data && Array.isArray(data) && data.length > 0;
  const total = hasValidData ? data.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

  // 排序數據 - 保留所有數據包括 count = 0
  const sortedData = hasValidData ? data
    .sort((a, b) => {
      const aIndex = RANGE_ORDER.indexOf(a.scoreRange);
      const bIndex = RANGE_ORDER.indexOf(b.scoreRange);
      return aIndex - bIndex;
    }) : [];

  // 獲取最大值用於設置 Y 軸
  const maxCount = hasValidData ? Math.max(...data.map(item => item.count || 0)) : 0;

  return (
    <Card title={title} style={{ height: '420px' }}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Spin size="large" tip="正在載入購買意願數據..." />
        </div>
      ) : !hasValidData || total === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Empty 
            description="暫無購買意願數據" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </div>
      ) : (
        <div>
          <BarChart
            width={700}
            height={300}
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="scoreRange" 
              tick={{ fontSize: 12 }}
              angle={-15}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, Math.max(maxCount * 1.1, 1)]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
              minPointSize={2}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>

          <div style={{ 
            textAlign: 'center', 
            marginTop: 8, 
            color: '#666',
            fontSize: '12px'
          }}>
            高意願客戶 (8-10分): {
              sortedData
                .filter(item => ['8-9', '9-10'].includes(item.scoreRange))
                .reduce((sum, item) => sum + item.count, 0)
            } 人 | 總計: {total.toLocaleString()} 人
          </div>
        </div>
      )}
    </Card>
  );
};

export default PurchaseIntentChart;