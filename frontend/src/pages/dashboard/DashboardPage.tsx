import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Space, List, Progress, Avatar, Button, Tag, Grid, Spin } from 'antd';
import { 
  UserOutlined, 
  HomeOutlined, 
  DollarOutlined, 
  TrophyOutlined, 
  PhoneOutlined, 
  PlusOutlined, 
  CheckOutlined, 
  MailOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  CalendarOutlined, 
  RightOutlined,
  TeamOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [showTodayTasks, setShowTodayTasks] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const recentActivities = [
    { 
      icon: <PhoneOutlined style={{ color: '#1890ff' }} />, 
      text: '與張先生通話討論房產需求', 
      time: '2 小時前',
      type: 'call'
    },
    { 
      icon: <PlusOutlined style={{ color: '#52c41a' }} />, 
      text: '新增大安區公寓房產信息', 
      time: '3 小時前',
      type: 'add'
    },
    { 
      icon: <CheckOutlined style={{ color: '#52c41a' }} />, 
      text: '完成李女士看房安排', 
      time: '5 小時前',
      type: 'complete'
    },
    { 
      icon: <MailOutlined style={{ color: '#fa8c16' }} />, 
      text: '發送本週市場分析報告', 
      time: '1 天前',
      type: 'email'
    },
  ];

  const todoItems = [
    { 
      icon: <UserOutlined style={{ color: '#1890ff' }} />, 
      text: '明天 10:00 - 王先生看房預約', 
      priority: 'high',
      time: '明天 10:00'
    },
    { 
      icon: <PhoneOutlined style={{ color: '#fa8c16' }} />, 
      text: '回電陳女士房價詢問', 
      priority: 'medium',
      time: '今天 15:00'
    },
    { 
      icon: <HomeOutlined style={{ color: '#52c41a' }} />, 
      text: '更新信義區房產照片', 
      priority: 'medium',
      time: '本週內'
    },
    { 
      icon: <TrophyOutlined style={{ color: '#722ed1' }} />, 
      text: '準備月度業績報告', 
      priority: 'low',
      time: '下週五'
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#fa8c16';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '普通';
    }
  };

  // 模擬載入圖表數據
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartData({
        salesTrend: [
          { month: '1月', sales: 20, customers: 15 },
          { month: '2月', sales: 35, customers: 28 },
          { month: '3月', sales: 28, customers: 22 },
          { month: '4月', sales: 45, customers: 35 },
          { month: '5月', sales: 52, customers: 42 },
          { month: '6月', sales: 38, customers: 30 }
        ],
        propertyTypes: [
          { name: '公寓', value: 45, color: '#1890ff' },
          { name: '別墅', value: 25, color: '#52c41a' },
          { name: '商業', value: 20, color: '#faad14' },
          { name: '工業', value: 10, color: '#f5222d' }
        ],
        regionSales: [
          { region: '信義區', sales: 85 },
          { region: '大安區', sales: 72 },
          { region: '松山區', sales: 65 },
          { region: '內湖區', sales: 58 },
          { region: '南港區', value: 45 }
        ]
      });
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: isMobile ? '16px' : '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 歡迎標題區域 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '20px',
          padding: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%'
          }} />
          <Row align="middle">
            <Col span={18}>
              <Title level={2} style={{ color: 'white', marginBottom: '8px', fontSize: '32px' }}>
                歡迎回來，測試用戶 👋
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                今日是美好的一天，讓我們一起創造更多成果！
              </Text>
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  ghost 
                  size="large"
                  onClick={() => setShowTodayTasks(!showTodayTasks)}
                  style={{ 
                    borderRadius: '8px',
                    borderColor: 'rgba(255,255,255,0.6)',
                    color: 'white'
                  }}
                >
                  {showTodayTasks ? '隱藏今日任務' : '查看今日任務'} <RightOutlined />
                </Button>
              </div>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '64px', opacity: 0.8 }}>🏠</div>
            </Col>
          </Row>
        </div>

        {/* 今日任務區域 */}
        {showTodayTasks && (
          <Card 
            title="今日任務" 
            style={{ 
              borderRadius: '16px', 
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)'
            }}
          >
            <Row gutter={[16, 16]}>
              {todoItems.filter(item => item.time.includes('今天')).map((task, index) => (
                <Col key={index} xs={24} md={12} lg={8}>
                  <div style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    border: `2px solid ${getPriorityColor(task.priority)}33`,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{ marginRight: '12px' }}>{task.icon}</div>
                    <div>
                      <Text strong style={{ display: 'block', fontSize: '14px' }}>{task.text}</Text>
                      <Text style={{ color: '#666', fontSize: '12px' }}>{task.time}</Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 統計卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              style={{ 
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(82, 196, 26, 0.3)'
                  }}>
                    <TeamOutlined style={{ color: 'white', fontSize: '24px' }} />
                  </div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>總客戶數</Text>
                  <Text style={{ color: '#262626', fontSize: '32px', fontWeight: 'bold', display: 'block' }}>156</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color="green" icon={<ArrowUpOutlined />} style={{ borderRadius: '6px' }}>+12%</Tag>
                  <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>本月增長</Text>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              style={{ 
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(24, 144, 255, 0.3)'
                  }}>
                    <HomeOutlined style={{ color: 'white', fontSize: '24px' }} />
                  </div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>可售房產</Text>
                  <Text style={{ color: '#262626', fontSize: '32px', fontWeight: 'bold', display: 'block' }}>89</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color="blue" icon={<ArrowUpOutlined />} style={{ borderRadius: '6px' }}>+8%</Tag>
                  <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>新增房源</Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              style={{ 
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(250, 140, 22, 0.3)'
                  }}>
                    <DollarOutlined style={{ color: 'white', fontSize: '24px' }} />
                  </div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>本月成交</Text>
                  <Text style={{ color: '#262626', fontSize: '32px', fontWeight: 'bold', display: 'block' }}>12</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color="orange" icon={<ArrowUpOutlined />} style={{ borderRadius: '6px' }}>+25%</Tag>
                  <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>業績成長</Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              style={{ 
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(114, 46, 209, 0.3)'
                  }}>
                    <TrophyOutlined style={{ color: 'white', fontSize: '24px' }} />
                  </div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>總收入</Text>
                  <Text style={{ color: '#262626', fontSize: '32px', fontWeight: 'bold', display: 'block' }}>2.8M</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag color="purple" icon={<ArrowUpOutlined />} style={{ borderRadius: '6px' }}>+18%</Tag>
                  <Text style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>月收入增長</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 主要內容區域 */}
        <Row gutter={[24, 24]}>
          {/* 最近活動 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>最近活動</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentActivities}
                renderItem={item => (
                  <List.Item style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: `${item.icon.props.style.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                      }
                      title={<Text strong style={{ fontSize: '14px' }}>{item.text}</Text>}
                      description={<Text style={{ color: '#999', fontSize: '12px' }}>{item.time}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 待辦事項 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>待辦事項</span>
                  </div>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => navigate('/tasks')}
                  >
                    查看全部
                  </Button>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={todoItems}
                renderItem={item => (
                  <List.Item style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: `${item.icon.props.style.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.icon}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: '14px' }}>{item.text}</Text>
                          <Tag 
                            color={getPriorityColor(item.priority)} 
                            style={{ borderRadius: '4px', fontSize: '10px' }}
                          >
                            {getPriorityText(item.priority)}
                          </Tag>
                        </div>
                      }
                      description={<Text style={{ color: '#999', fontSize: '12px' }}>{item.time}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* 數據可視化圖表區域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {/* 銷售趨勢圖 */}
          <Col xs={24} xl={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <LineChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600 }}>銷售趨勢分析</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ height: isMobile ? 250 : 300 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData?.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        fontSize={isMobile ? 11 : 12}
                      />
                      <YAxis fontSize={isMobile ? 11 : 12} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#1890ff" 
                        strokeWidth={2}
                        name="銷售額"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="customers" 
                        stroke="#52c41a" 
                        strokeWidth={2}
                        name="新客戶"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>

          {/* 房產類型分布 */}
          <Col xs={24} xl={12}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PieChartOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                  <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600 }}>房產類型分布</span>
                </div>
              }
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ height: isMobile ? 250 : 300 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData?.propertyTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={isMobile ? 60 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData?.propertyTypes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend fontSize={isMobile ? 11 : 12} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 區域銷售排行 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card 
              title="熱門區域銷售排行"
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ height: isMobile ? 200 : 250 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData?.regionSales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="region" 
                        fontSize={isMobile ? 11 : 12}
                      />
                      <YAxis fontSize={isMobile ? 11 : 12} />
                      <Tooltip />
                      <Bar 
                        dataKey="sales" 
                        fill="#1890ff" 
                        name="銷售量"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 進度條區域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card 
              title="本月目標完成度"
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ textAlign: 'center' }}
            >
              <Progress
                type="circle"
                percent={75}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#096dd9',
                }}
                size={isMobile ? 100 : 120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ fontSize: '14px', color: '#666' }}>目標: 16筆成交</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title="客戶滿意度"
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ textAlign: 'center' }}
            >
              <Progress
                type="circle"
                percent={92}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#389e0d',
                }}
                size={isMobile ? 100 : 120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ fontSize: '14px', color: '#666' }}>基於23份評價</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title="房源更新率"
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
              bodyStyle={{ textAlign: 'center' }}
            >
              <Progress
                type="circle"
                percent={88}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#fa8c16',
                  '100%': '#d46b08',
                }}
                size={isMobile ? 100 : 120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text style={{ fontSize: '14px', color: '#666' }}>本週已更新</Text>
              </div>
            </Card>
          </Col>
        </Row>

      </Space>
    </div>
  );
};

export default DashboardPage;