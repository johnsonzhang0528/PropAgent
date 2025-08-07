import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  TooltipProps
} from 'recharts';
import { Card, Typography, Spin } from 'antd';

const { Title } = Typography;

interface PropertyPriceData {
  priceRange: string;
  count: number;
}

interface PropertyPriceChartProps {
  data: PropertyPriceData[];
  loading?: boolean;
  title?: string;
}

const RANGE_ORDER = [
  '100萬以下',
  '100-200萬', 
  '200-300萬',
  '300-500萬',
  '500-1000萬',
  '1000萬以上'
];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          價格區間: {label}
        </p>
        <p style={{ margin: 0, color: '#666' }}>
          房產數量: <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const PropertyPriceChart: React.FC<PropertyPriceChartProps> = ({ 
  data, 
  loading = false, 
  title = "房產價格分布" 
}) => {
  // 按照價格順序排序數據
  const sortedData = (data && Array.isArray(data) ? [...data] : []).sort((a, b) => {
    const indexA = RANGE_ORDER.indexOf(a.priceRange);
    const indexB = RANGE_ORDER.indexOf(b.priceRange);
    return indexA - indexB;
  });

  const maxValue = sortedData.length > 0 ? Math.max(...sortedData.map(item => item.count)) : 0;
  const yAxisMax = Math.ceil(maxValue * 1.2) || 10;

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24, textAlign: 'center' }}>
        {title}
      </Title>
      
      <div style={{ position: 'relative', height: 300 }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Spin size="large" />
          </div>
        ) : (
          <AreaChart
            width={700}
            height={300}
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="priceRange"
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
              tick={{ fontSize: 12 }}
              domain={[0, yAxisMax]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#1890ff"
              strokeWidth={2}
              fill="url(#colorPrice)"
              fillOpacity={1}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#1890ff', strokeWidth: 2 }}
              animationBegin={0}
              animationDuration={800}
            />
          </AreaChart>
        )}
      </div>
      
      {!loading && sortedData.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 16, 
          color: '#666',
          fontSize: '14px'
        }}>
          總房產數量: {sortedData.reduce((sum, item) => sum + item.count, 0)} 個
        </div>
      )}
    </Card>
  );
};

export default PropertyPriceChart;