import React from 'react';
import { Card, Space, Typography } from 'antd';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useMobile } from '../../hooks/useMobile';

const { Title, Text } = Typography;

interface MobileChartProps {
  title?: string;
  data: any[];
  type: 'pie' | 'bar' | 'line';
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  dataKey?: string;
  nameKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
}

const defaultColors = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', 
  '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
];

const MobileChart: React.FC<MobileChartProps> = ({
  title,
  data,
  type,
  height = 300,
  colors = defaultColors,
  showLegend = true,
  dataKey = 'value',
  nameKey = 'name',
  xAxisKey = 'name',
  yAxisKey = 'value'
}) => {
  const { isMobile, isSmallMobile } = useMobile();

  const chartHeight = isMobile ? (isSmallMobile ? 250 : 280) : height;
  const fontSize = isSmallMobile ? 11 : 12;
  const legendFontSize = isSmallMobile ? 10 : 12;

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          fontSize: fontSize,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {props.payload.map((entry: any, index: number) => (
            <div key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <PieChart width={500} height={chartHeight}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={!isSmallMobile ? ({ name, percent }: any) => 
                `${name} ${(percent * 100).toFixed(0)}%` : false}
              outerRadius={isSmallMobile ? 60 : 80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
            {showLegend && (
              <Legend 
                wrapperStyle={{ fontSize: legendFontSize }}
                iconSize={legendFontSize}
              />
            )}
          </PieChart>
        );
      
      case 'bar':
        return (
          <BarChart
            width={500}
            height={chartHeight}
            data={data}
            margin={{
              top: 5,
              right: isMobile ? 10 : 30,
              left: isMobile ? 10 : 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxisKey} 
              fontSize={fontSize}
              angle={isSmallMobile ? -45 : 0}
              textAnchor={isSmallMobile ? 'end' : 'middle'}
              height={isSmallMobile ? 60 : 30}
            />
            <YAxis fontSize={fontSize} />
            <Tooltip content={renderTooltip} />
            {showLegend && (
              <Legend 
                wrapperStyle={{ fontSize: legendFontSize }}
                iconSize={legendFontSize}
              />
            )}
            <Bar dataKey={yAxisKey} fill={colors[0]} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart
            width={500}
            height={chartHeight}
            data={data}
            margin={{
              top: 5,
              right: isMobile ? 10 : 30,
              left: isMobile ? 10 : 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxisKey} 
              fontSize={fontSize}
              angle={isSmallMobile ? -45 : 0}
              textAnchor={isSmallMobile ? 'end' : 'middle'}
              height={isSmallMobile ? 60 : 30}
            />
            <YAxis fontSize={fontSize} />
            <Tooltip content={renderTooltip} />
            {showLegend && (
              <Legend 
                wrapperStyle={{ fontSize: legendFontSize }}
                iconSize={legendFontSize}
              />
            )}
            <Line 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ r: isSmallMobile ? 3 : 4 }}
            />
          </LineChart>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card 
      title={title}
      style={{ marginBottom: '16px' }}
      bodyStyle={{ 
        padding: isMobile ? '12px' : '24px',
        textAlign: 'center'
      }}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        {renderChart()}
      </ResponsiveContainer>
      
      {/* 移動端數據摘要 */}
      {isMobile && type === 'pie' && (
        <div style={{ marginTop: '16px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {data.slice(0, 3).map((item: any, index: number) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: colors[index % colors.length],
                      marginRight: '8px',
                      borderRadius: '2px'
                    }} 
                  />
                  <Text style={{ fontSize: '12px' }}>{item[nameKey]}</Text>
                </div>
                <Text strong style={{ fontSize: '12px' }}>
                  {item[dataKey]}
                </Text>
              </div>
            ))}
            {data.length > 3 && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                還有 {data.length - 3} 項數據...
              </Text>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

// 移動端儀表板統計卡片
interface MobileStatCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
}

export const MobileStatCard: React.FC<MobileStatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  color = '#1890ff'
}) => {
  const { isSmallMobile } = useMobile();

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#52c41a';
      case 'down': return '#f5222d';
      default: return '#faad14';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Card 
      style={{ 
        textAlign: 'center',
        marginBottom: '12px'
      }}
      bodyStyle={{ 
        padding: isSmallMobile ? '16px 12px' : '20px 16px'
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text 
          type="secondary" 
          style={{ 
            fontSize: isSmallMobile ? '11px' : '12px',
            display: 'block'
          }}
        >
          {title}
        </Text>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {prefix}
          <Text 
            strong 
            style={{ 
              fontSize: isSmallMobile ? '18px' : '24px',
              color: color,
              margin: '0 4px'
            }}
          >
            {value}
          </Text>
          {suffix}
        </div>
        
        {trend && trendValue && (
          <div style={{ 
            fontSize: isSmallMobile ? '10px' : '11px',
            color: getTrendColor()
          }}>
            {getTrendIcon()} {trendValue}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default MobileChart;