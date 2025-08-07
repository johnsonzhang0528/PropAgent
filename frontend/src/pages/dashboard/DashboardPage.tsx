import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space, List, Progress, Avatar, Button, Tag } from 'antd';
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
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
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

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
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
                  style={{ 
                    borderRadius: '8px',
                    borderColor: 'rgba(255,255,255,0.6)',
                    color: 'white'
                  }}
                >
                  查看今日任务 <RightOutlined />
                </Button>
              </div>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '64px', opacity: 0.8 }}>🏠</div>
            </Col>
          </Row>
        </div>

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
                  <Button type="link" size="small">查看全部</Button>
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

        {/* 進度條區域 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card 
              title="本月目標完成度"
              style={{ 
                borderRadius: '16px', 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Progress
                type="circle"
                percent={75}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#096dd9',
                }}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
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
            >
              <Progress
                type="circle"
                percent={92}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#389e0d',
                }}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
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
            >
              <Progress
                type="circle"
                percent={88}
                format={percent => `${percent}%`}
                strokeColor={{
                  '0%': '#fa8c16',
                  '100%': '#d46b08',
                }}
                size={120}
              />
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
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