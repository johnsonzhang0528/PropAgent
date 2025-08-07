import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  Grid,
  Pagination,
  Drawer,
  Descriptions,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
  EditOutlined,
  FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

// 客戶介面定義
interface Customer {
  _id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  status: 'active' | 'inactive' | 'completed' | 'lost';
  purchase_intent_score: number;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string[];
  notes?: string;
  created_at: string;
  last_contact_at?: string;
}

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  potential_customers: number;
  success_rate: string;
}

const ResponsiveCustomerList: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // 狀態管理
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(isMobile ? 5 : 10);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);

  // 響應式處理
  useEffect(() => {
    setPageSize(isMobile ? 5 : isTablet ? 8 : 10);
  }, [isMobile, isTablet]);

  // 載入客戶列表
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockCustomers: Customer[] = [
        {
          _id: '1',
          first_name: '張',
          last_name: '小明',
          email: 'zhang@example.com',
          phone: '0912000001',
          status: 'active',
          purchase_intent_score: 8.5,
          budget_min: 2000000,
          budget_max: 3000000,
          preferred_location: ['大安區', '信義區'],
          notes: '尋找大安區2房公寓',
          created_at: '2024-01-15',
          last_contact_at: '2024-03-01'
        },
        {
          _id: '2',
          first_name: '李',
          last_name: '美女',
          email: 'li@example.com',
          phone: '0912000002',
          status: 'active',
          purchase_intent_score: 9.2,
          budget_min: 1500000,
          budget_max: 2500000,
          preferred_location: ['松山區', '中山區'],
          notes: '新婚夫妻，希望找到3房住宅',
          created_at: '2024-01-20',
          last_contact_at: '2024-02-28'
        },
        {
          _id: '3',
          first_name: '王',
          last_name: '總',
          email: 'wang@example.com',
          phone: '0912000003',
          status: 'completed',
          purchase_intent_score: 7.8,
          budget_min: 5000000,
          budget_max: 10000000,
          preferred_location: ['信義區', '大安區'],
          notes: '企業老闆，已成交高級住宅',
          created_at: '2024-01-10',
          last_contact_at: '2024-02-15'
        }
      ];

      const filteredCustomers = mockCustomers.filter(customer => {
        const matchSearch = !searchText || 
          customer.first_name.includes(searchText) ||
          customer.last_name.includes(searchText) ||
          customer.phone.includes(searchText);
        const matchStatus = !statusFilter || customer.status === statusFilter;
        return matchSearch && matchStatus;
      });

      setCustomers(filteredCustomers);
      setTotal(filteredCustomers.length);
      
      // 模擬統計數據
      setStats({
        total_customers: mockCustomers.length,
        active_customers: mockCustomers.filter(c => c.status === 'active').length,
        potential_customers: mockCustomers.filter(c => c.purchase_intent_score > 8).length,
        success_rate: '65.2'
      });
      
    } catch (error) {
      console.error('載入客戶列表錯誤:', error);
      message.error('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 搜索處理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // 狀態篩選
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // 查看詳情
  const handleViewDetail = (customer: Customer) => {
    setCurrentCustomer(customer);
    setShowDetail(true);
  };

  // 狀態標籤顏色
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'orange',
      completed: 'blue',
      lost: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // 狀態文字
  const getStatusText = (status: string) => {
    const texts = {
      active: '活躍',
      inactive: '非活躍',
      completed: '已成交',
      lost: '流失'
    };
    return texts[status as keyof typeof texts] || status;
  };

  // 桌面端表格列定義
  const columns: ColumnsType<Customer> = [
    {
      title: '客戶信息',
      key: 'customer',
      width: isMobile ? 200 : 250,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.first_name}{record.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.phone}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '意願分數',
      dataIndex: 'purchase_intent_score',
      key: 'score',
      width: 100,
      render: (score) => (
        <Badge 
          count={score} 
          style={{ 
            backgroundColor: score > 8 ? '#52c41a' : score > 6 ? '#faad14' : '#ff4d4f' 
          }} 
        />
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
          />
        </Space>
      )
    }
  ];

  // 移動端列表項渲染
  const renderMobileItem = (customer: Customer) => (
    <List.Item
      key={customer._id}
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(customer)}
        />
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <Space>
            <Text strong>{customer.first_name}{customer.last_name}</Text>
            <Tag color={getStatusColor(customer.status)}>
              {getStatusText(customer.status)}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">
              <PhoneOutlined style={{ marginRight: 4 }} />
              {customer.phone}
            </Text>
            <Space>
              <Text type="secondary">意願分數:</Text>
              <Badge 
                count={customer.purchase_intent_score} 
                style={{ 
                  backgroundColor: customer.purchase_intent_score > 8 ? '#52c41a' : 
                                  customer.purchase_intent_score > 6 ? '#faad14' : '#ff4d4f' 
                }} 
              />
            </Space>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      {/* 統計卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="總客戶數"
                value={stats.total_customers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="活躍客戶"
                value={stats.active_customers}
                valueStyle={{ color: '#52c41a', fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="高意願客戶"
                value={stats.potential_customers}
                valueStyle={{ color: '#faad14', fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="成功率"
                value={stats.success_rate}
                suffix="%"
                valueStyle={{ color: '#eb2f96', fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和篩選 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              placeholder="搜索客戶姓名或電話"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6}>
            <Select
              placeholder="狀態篩選"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilter}
              allowClear
            >
              <Option value="active">活躍</Option>
              <Option value="inactive">非活躍</Option>
              <Option value="completed">已成交</Option>
              <Option value="lost">流失</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              {isMobile ? '新增' : '新增客戶'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 客戶列表 - 響應式顯示 */}
      <Card>
        {isMobile ? (
          <List
            loading={loading}
            dataSource={customers}
            renderItem={renderMobileItem}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: false,
              showQuickJumper: false,
              simple: true,
              onChange: (page) => setCurrentPage(page)
            }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 600 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: !isTablet,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || pageSize);
              }
            }}
          />
        )}
      </Card>

      {/* 客戶詳情抽屜 */}
      <Drawer
        title="客戶詳情"
        width={isMobile ? '100%' : 600}
        onClose={() => setShowDetail(false)}
        open={showDetail}
      >
        {currentCustomer && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="基本信息" column={isMobile ? 1 : 2} bordered>
              <Descriptions.Item label="姓名">
                {currentCustomer.first_name}{currentCustomer.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="電話">
                {currentCustomer.phone}
              </Descriptions.Item>
              <Descriptions.Item label="郵箱">
                {currentCustomer.email || '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="狀態">
                <Tag color={getStatusColor(currentCustomer.status)}>
                  {getStatusText(currentCustomer.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="意願分數">
                <Badge 
                  count={currentCustomer.purchase_intent_score} 
                  style={{ 
                    backgroundColor: currentCustomer.purchase_intent_score > 8 ? '#52c41a' : 
                                    currentCustomer.purchase_intent_score > 6 ? '#faad14' : '#ff4d4f' 
                  }} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="預算範圍">
                {currentCustomer.budget_min && currentCustomer.budget_max 
                  ? `NT$ ${currentCustomer.budget_min.toLocaleString()} - ${currentCustomer.budget_max.toLocaleString()}`
                  : '未設定'
                }
              </Descriptions.Item>
              <Descriptions.Item label="偏好地區" span={isMobile ? 1 : 2}>
                {currentCustomer.preferred_location?.map(location => (
                  <Tag key={location}>{location}</Tag>
                )) || '未設定'}
              </Descriptions.Item>
              <Descriptions.Item label="備註" span={isMobile ? 1 : 2}>
                {currentCustomer.notes || '無'}
              </Descriptions.Item>
            </Descriptions>

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button type="primary" icon={<EditOutlined />}>
                編輯客戶
              </Button>
              <Button icon={<PhoneOutlined />}>
                撥打電話
              </Button>
              <Button icon={<MailOutlined />}>
                發送郵件
              </Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default ResponsiveCustomerList;