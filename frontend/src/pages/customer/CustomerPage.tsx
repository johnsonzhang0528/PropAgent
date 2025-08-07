import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography, Card, Input, Select, Avatar, Row, Col, Statistic } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  FilterOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const CustomerPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const columns = [
    {
      title: '客戶資訊',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              marginRight: '12px'
            }}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: '#262626' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              ID: {record.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '聯絡方式',
      dataIndex: 'contact',
      key: 'contact',
      render: (text: string, record: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <PhoneOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#262626' }}>{record.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MailOutlined style={{ color: '#52c41a', marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#666' }}>{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: '客戶狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          '潛在客戶': { color: '#1890ff', bg: '#e6f7ff', icon: <ClockCircleOutlined /> },
          '正式客戶': { color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined /> }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: config.bg,
            border: `1px solid ${config.color}20`,
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 500,
            color: config.color
          }}>
            {config.icon}
            <span style={{ marginLeft: '4px' }}>{status}</span>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            size="small"
            icon={<EditOutlined />}
            style={{ borderRadius: '6px' }}
          >
            編輯
          </Button>
          <Button 
            type="primary" 
            danger 
            ghost
            size="small"
            icon={<DeleteOutlined />}
            style={{ borderRadius: '6px' }}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      id: 'CU001',
      name: '張先生',
      phone: '0912-345-678',
      email: 'zhang@example.com',
      status: '潛在客戶',
    },
    {
      key: '2',
      id: 'CU002',
      name: '李女士',
      phone: '0987-654-321',
      email: 'li@example.com',
      status: '正式客戶',
    },
    {
      key: '3',
      id: 'CU003',
      name: '王經理',
      phone: '0955-123-456',
      email: 'wang@company.com',
      status: '正式客戶',
    },
    {
      key: '4',
      id: 'CU004',
      name: '陳小姐',
      phone: '0966-789-012',
      email: 'chen@email.com',
      status: '潛在客戶',
    },
  ];

  const totalCustomers = data.length;
  const activeCustomers = data.filter(item => item.status === '正式客戶').length;
  const potentialCustomers = data.filter(item => item.status === '潛在客戶').length;

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 統計卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    總客戶數
                  </div>
                }
                value={totalCustomers}
                valueStyle={{ color: '#1890ff', fontSize: '32px', fontWeight: 'bold' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                    正式客戶
                  </div>
                }
                value={activeCustomers}
                valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
                suffix="人"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <ClockCircleOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                    潛在客戶
                  </div>
                }
                value={potentialCustomers}
                valueStyle={{ color: '#fa8c16', fontSize: '32px', fontWeight: 'bold' }}
                suffix="人"
              />
            </Card>
          </Col>
        </Row>

        {/* 主要操作區域 */}
        <Card 
          style={{ 
            borderRadius: '16px', 
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <Title level={3} style={{ margin: 0, color: '#1e3c72', fontWeight: 600 }}>
                  客戶管理
                </Title>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  管理您的客戶資訊，追蹤客戶狀態與聯絡記錄
                </div>
              </div>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                style={{
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)',
                  height: '44px',
                  padding: '0 24px',
                  fontWeight: 500
                }}
              >
                新增客戶
              </Button>
            </div>
            
            {/* 搜索和篩選 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="搜索客戶姓名、電話或郵箱"
                  prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    height: '40px',
                    border: '2px solid #f0f0f0'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="客戶狀態"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%', height: '40px' }}
                  suffixIcon={<FilterOutlined style={{ color: '#1890ff' }} />}
                >
                  <Select.Option value="all">全部狀態</Select.Option>
                  <Select.Option value="潛在客戶">潛在客戶</Select.Option>
                  <Select.Option value="正式客戶">正式客戶</Select.Option>
                </Select>
              </Col>
            </Row>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={data}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條記錄`,
            }}
            style={{
              background: 'white',
              borderRadius: '12px'
            }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default CustomerPage;
