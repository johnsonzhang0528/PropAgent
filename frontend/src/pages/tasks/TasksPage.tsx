import React, { useState } from 'react';
import { Card, List, Tag, Button, Space, Typography, Row, Col, Input, Select, DatePicker } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  TrophyOutlined,
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Task {
  id: string;
  icon: React.ReactNode;
  text: string;
  priority: 'high' | 'medium' | 'low';
  time: string;
  status: 'pending' | 'completed' | 'in_progress';
  category: string;
}

const TasksPage: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const allTasks: Task[] = [
    { 
      id: '1',
      icon: <UserOutlined style={{ color: '#1890ff' }} />, 
      text: '明天 10:00 - 王先生看房預約', 
      priority: 'high',
      time: '明天 10:00',
      status: 'pending',
      category: '預約'
    },
    { 
      id: '2',
      icon: <PhoneOutlined style={{ color: '#fa8c16' }} />, 
      text: '回電陳女士房價詢問', 
      priority: 'medium',
      time: '今天 15:00',
      status: 'pending',
      category: '聯絡'
    },
    { 
      id: '3',
      icon: <HomeOutlined style={{ color: '#52c41a' }} />, 
      text: '更新信義區房產照片', 
      priority: 'medium',
      time: '本週內',
      status: 'in_progress',
      category: '維護'
    },
    { 
      id: '4',
      icon: <TrophyOutlined style={{ color: '#722ed1' }} />, 
      text: '準備月度業績報告', 
      priority: 'low',
      time: '下週五',
      status: 'pending',
      category: '報告'
    },
    { 
      id: '5',
      icon: <PhoneOutlined style={{ color: '#1890ff' }} />, 
      text: '聯絡新客戶李先生', 
      priority: 'high',
      time: '今天 14:00',
      status: 'completed',
      category: '聯絡'
    },
    { 
      id: '6',
      icon: <UserOutlined style={{ color: '#52c41a' }} />, 
      text: '帶看房產 - 大安區公寓', 
      priority: 'high',
      time: '昨天 16:00',
      status: 'completed',
      category: '預約'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fa8c16';
      case 'completed': return '#52c41a';
      case 'in_progress': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'completed': return '已完成';
      case 'in_progress': return '進行中';
      default: return '未知';
    }
  };

  const filteredTasks = allTasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.text.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = allTasks.filter(task => task.status === 'in_progress').length;

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 頁面標題 */}
        <div>
          <Title level={2} style={{ marginBottom: '8px' }}>任務管理</Title>
          <Text style={{ color: '#666', fontSize: '16px' }}>
            管理您的所有待辦事項和已完成任務
          </Text>
        </div>

        {/* 統計卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>
                {pendingTasks}
              </div>
              <Text style={{ color: '#666' }}>待處理任務</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                {inProgressTasks}
              </div>
              <Text style={{ color: '#666' }}>進行中任務</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                {completedTasks}
              </div>
              <Text style={{ color: '#666' }}>已完成任務</Text>
            </Card>
          </Col>
        </Row>

        {/* 搜尋和篩選 */}
        <Card style={{ borderRadius: '12px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜尋任務..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={filter}
                onChange={setFilter}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">全部任務</Option>
                <Option value="pending">待處理</Option>
                <Option value="in_progress">進行中</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* 任務列表 */}
        <Card 
          title={`任務列表 (${filteredTasks.length})`}
          style={{ borderRadius: '12px' }}
        >
          <List
            itemLayout="horizontal"
            dataSource={filteredTasks}
            renderItem={task => (
              <List.Item 
                style={{ 
                  borderBottom: '1px solid #f0f0f0', 
                  paddingBottom: '16px', 
                  marginBottom: '16px',
                  opacity: task.status === 'completed' ? 0.7 : 1
                }}
                actions={[
                  <Button 
                    type="text" 
                    icon={<CheckCircleOutlined />}
                    disabled={task.status === 'completed'}
                  >
                    標記完成
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${(task.icon as any).props?.style?.color || '#1890ff'}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {task.icon}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: '16px',
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                        }}
                      >
                        {task.text}
                      </Text>
                      <Space>
                        <Tag color={getStatusColor(task.status)} style={{ borderRadius: '6px' }}>
                          {getStatusText(task.status)}
                        </Tag>
                        <Tag color={getPriorityColor(task.priority)} style={{ borderRadius: '6px' }}>
                          {getPriorityText(task.priority)}
                        </Tag>
                      </Space>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: '8px' }}>
                      <Text style={{ color: '#999', fontSize: '14px', marginRight: '16px' }}>
                        <CalendarOutlined style={{ marginRight: '4px' }} />
                        {task.time}
                      </Text>
                      <Tag style={{ borderRadius: '4px' }}>{task.category}</Tag>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

      </Space>
    </div>
  );
};

export default TasksPage;