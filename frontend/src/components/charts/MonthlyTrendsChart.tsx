import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  TooltipProps
} from 'recharts';
import { Card, Typography, Spin } from 'antd';

const { Title } = Typography;

interface MonthlyTrendData {
  year: number;
  month: number;
  count: number;
}

interface MonthlyTrendsData {
  customer_trends: MonthlyTrendData[];
  property_trends: MonthlyTrendData[];
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendsData;
  loading?: boolean;
  title?: string;
}

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
          時間: {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: <span style={{ fontWeight: 'bold' }}>
              {entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ 
  data, 
  loading = false, 
  title = "月度趨勢分析" 
}) => {
  // 合併並格式化數據
  const formatData = () => {
    if (!data || !data.customer_trends || !data.property_trends) {
      return [];
    }
    
    const allMonths = new Set<string>();
    
    // 收集所有月份
    data.customer_trends.forEach(item => {
      allMonths.add(`${item.year}-${item.month.toString().padStart(2, '0')}`);
    });
    data.property_trends.forEach(item => {
      allMonths.add(`${item.year}-${item.month.toString().padStart(2, '0')}`);
    });
    
    // 創建完整的數據結構
    const sortedMonths = Array.from(allMonths).sort();
    
    return sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      const customerData = data.customer_trends.find(
        item => item.year === yearNum && item.month === monthNum
      );
      const propertyData = data.property_trends.find(
        item => item.year === yearNum && item.month === monthNum
      );
      
      return {
        month: `${year}/${month}`,
        customers: customerData?.count || 0,
        properties: propertyData?.count || 0
      };
    });
  };

  const chartData = formatData();
  const maxCustomers = chartData.length > 0 ? Math.max(...chartData.map(item => item.customers)) : 0;
  const maxProperties = chartData.length > 0 ? Math.max(...chartData.map(item => item.properties)) : 0;
  const maxValue = Math.max(maxCustomers, maxProperties);
  const yAxisMax = Math.ceil(maxValue * 1.2) || 10;

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24, textAlign: 'center' }}>
        {title}
      </Title>
      
      <div style={{ position: 'relative', height: 350 }}>
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
          <LineChart
            width={700}
            height={350}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month"
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={{ stroke: '#d9d9d9' }}
              tickLine={{ stroke: '#d9d9d9' }}
              tick={{ fontSize: 12 }}
              domain={[0, yAxisMax]}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="line"
              wrapperStyle={{ 
                paddingTop: '10px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#52c41a"
              strokeWidth={3}
              dot={{ fill: '#52c41a', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#52c41a', strokeWidth: 2 }}
              name="新增客戶"
              animationBegin={0}
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="properties"
              stroke="#1890ff"
              strokeWidth={3}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#1890ff', strokeWidth: 2 }}
              name="新增房產"
              animationBegin={200}
              animationDuration={800}
            />
          </LineChart>
        )}
      </div>
      
      {!loading && chartData.length > 0 && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: 16,
          padding: '16px',
          backgroundColor: '#fafafa',
          borderRadius: '6px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>累計客戶</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
              {chartData.reduce((sum, item) => sum + item.customers, 0)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>累計房產</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              {chartData.reduce((sum, item) => sum + item.properties, 0)}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MonthlyTrendsChart;