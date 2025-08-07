import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography, Card, Input, Select, Avatar, Row, Col, Statistic, Image } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  HomeOutlined,
  DollarOutlined,
  ExpandOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  BuildOutlined,
  HeartOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const PropertyPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const columns = [
    {
      title: '房產資訊',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: `url(${record.image}) center/cover`,
            marginRight: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#262626', marginBottom: '4px' }}>
              {text}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '4px', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>{record.location}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: '房產詳情',
      dataIndex: 'details',
      key: 'details',
      render: (text: string, record: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
            <DollarOutlined style={{ color: '#52c41a', marginRight: '6px' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a' }}>
              NT$ {record.price.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <ExpandOutlined style={{ color: '#1890ff', marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#262626' }}>{record.area} 坪</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BuildOutlined style={{ color: '#fa8c16', marginRight: '6px' }} />
            <span style={{ fontSize: '13px', color: '#666' }}>{record.rooms}房{record.bathrooms}衛</span>
          </div>
        </div>
      ),
    },
    {
      title: '房產類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: any) => {
        const typeConfig = {
          '公寓': { color: '#1890ff', bg: '#e6f7ff' },
          '電梯大樓': { color: '#52c41a', bg: '#f6ffed' },
          '透天厝': { color: '#fa8c16', bg: '#fff7e6' },
          '別墅': { color: '#722ed1', bg: '#f9f0ff' }
        };
        const config = typeConfig[type as keyof typeof typeConfig] || { color: '#666', bg: '#f5f5f5' };
        return (
          <div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: config.bg,
              border: `1px solid ${config.color}20`,
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 500,
              color: config.color,
              marginBottom: '6px'
            }}>
              <HomeOutlined style={{ marginRight: '4px' }} />
              {type}
            </div>
            <div style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: record.status === '可售' ? '#f6ffed' : '#fff1f0',
              border: `1px solid ${record.status === '可售' ? '#52c41a' : '#ff4d4f'}20`,
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 500,
              color: record.status === '可售' ? '#52c41a' : '#ff4d4f'
            }}>
              {record.status}
            </div>
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
            icon={<EyeOutlined />}
            style={{ borderRadius: '6px' }}
          >
            查看
          </Button>
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
      id: 'PR001',
      title: '台北市中正區精品公寓',
      location: '台北市中正區忠孝東路',
      price: 25000000,
      area: 30,
      rooms: 2,
      bathrooms: 2,
      type: '公寓',
      status: '可售',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop&crop=center'
    },
    {
      key: '2',
      id: 'PR002',
      title: '新北市板橋區現代電梯大樓',
      location: '新北市板橋區文化路',
      price: 18000000,
      area: 45,
      rooms: 3,
      bathrooms: 2,
      type: '電梯大樓',
      status: '可售',
      image: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=100&h=100&fit=crop&crop=center'
    },
    {
      key: '3',
      id: 'PR003',
      title: '桃園市中壢區溫馨透天厝',
      location: '桃園市中壢區中正路',
      price: 12800000,
      area: 38,
      rooms: 4,
      bathrooms: 3,
      type: '透天厝',
      status: '可售',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=100&h=100&fit=crop&crop=center'
    },
    {
      key: '4',
      id: 'PR004',
      title: '台中市西屯區豪華別墅',
      location: '台中市西屯區台灣大道',
      price: 35000000,
      area: 65,
      rooms: 5,
      bathrooms: 4,
      type: '別墅',
      status: '已售',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=100&h=100&fit=crop&crop=center'
    },
  ];

  const totalProperties = data.length;
  const availableProperties = data.filter(item => item.status === '可售').length;
  const soldProperties = data.filter(item => item.status === '已售').length;
  const averagePrice = Math.round(data.reduce((sum, item) => sum + item.price, 0) / data.length);

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 統計卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    總房產數
                  </div>
                }
                value={totalProperties}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                suffix="件"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <HeartOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                    可售房產
                  </div>
                }
                value={availableProperties}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                suffix="件"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <BuildOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                    已售房產
                  </div>
                }
                value={soldProperties}
                valueStyle={{ color: '#fa8c16', fontSize: '28px', fontWeight: 'bold' }}
                suffix="件"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Statistic
                title={
                  <div style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <DollarOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                    平均價格
                  </div>
                }
                value={averagePrice}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
                formatter={(value) => `NT$ ${Number(value).toLocaleString()}`}
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
                  房產管理
                </Title>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  管理您的房產清單，追蹤房產狀態與銷售資訊
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
                新增房產
              </Button>
            </div>
            
            {/* 搜索和篩選 */}
            <div className="search-filters-container">
              <div className="search-row">
                <div className="search-input-container">
                  <Input
                    placeholder="搜索房產標題或地址"
                    prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="form-input"
                    style={{
                      borderRadius: '8px',
                      height: '44px',
                      border: '2px solid #f0f0f0',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div className="filter-container">
                  <Select
                    placeholder="房產類型"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    className="form-input"
                    style={{ 
                      width: '100%', 
                      height: '44px',
                      minWidth: '120px'
                    }}
                    suffixIcon={<FilterOutlined style={{ color: '#1890ff' }} />}
                  >
                    <Select.Option value="all">全部類型</Select.Option>
                    <Select.Option value="公寓">公寓</Select.Option>
                    <Select.Option value="電梯大樓">電梯大樓</Select.Option>
                    <Select.Option value="透天厝">透天厝</Select.Option>
                    <Select.Option value="別墅">別墅</Select.Option>
                  </Select>
                </div>
                <div className="filter-container">
                  <Select
                    placeholder="價格範圍"
                    value={priceRange}
                    onChange={setPriceRange}
                    className="form-input"
                    style={{ 
                      width: '100%', 
                      height: '44px',
                      minWidth: '120px'
                    }}
                    suffixIcon={<DollarOutlined style={{ color: '#1890ff' }} />}
                  >
                    <Select.Option value="all">全部價格</Select.Option>
                    <Select.Option value="0-1000">1000萬以下</Select.Option>
                    <Select.Option value="1000-2000">1000-2000萬</Select.Option>
                    <Select.Option value="2000-3000">2000-3000萬</Select.Option>
                    <Select.Option value="3000+">3000萬以上</Select.Option>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={data}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條記錄`,
            }}
            rowClassName={() => 'property-table-row'}
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

export default PropertyPage;
