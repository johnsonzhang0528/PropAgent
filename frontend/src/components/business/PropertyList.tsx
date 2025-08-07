import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Avatar,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  Upload,
  message,
  Dropdown,
  Menu,
  Switch,
  Pagination,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
  Image,
  Divider,
  Empty,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  StarOutlined,
  HeartOutlined,
  ShareAltOutlined,
  FileImageOutlined,
  CarOutlined,
  BellOutlined,
  AreaChartOutlined,
  BuildOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 物件類型定義
interface Property {
  _id: string;
  property_type: 'apartment' | 'house' | 'office' | 'land' | 'other';
  listing_type: 'sale' | 'rent';
  title: string;
  description?: string;
  address: string;
  district: string;
  city: string;
  postal_code?: string;
  price: number;
  area: number;
  area_unit: 'ping' | 'sqm' | 'sqft';
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  floor?: number;
  total_floors?: number;
  building_age?: number;
  features: string[];
  amenities: string[];
  status: 'available' | 'sold' | 'rented' | 'withdrawn';
  available_from?: string;
  images: string[];
  documents: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  transport_info?: {
    mrt_stations: string[];
    distance_to_mrt: number;
  };
  agent_id: {
    _id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  company_id?: string;
  created_at: string;
  updated_at: string;
  views_count?: number;
  favorites_count?: number;
}

interface PropertySearchParams {
  search?: string;
  property_type?: string;
  listing_type?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  district?: string;
  agent_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface PropertyStats {
  total_properties: number;
  available_properties: number;
  sold_properties: number;
  rented_properties: number;
  average_price: number;
  total_portfolio_value: number;
  success_rate: string;
}

const PropertyList: React.FC = () => {
  // 狀態管理
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<PropertySearchParams>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [total, setTotal] = useState<number>(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [form] = Form.useForm();

  // 載入物件列表
  const loadProperties = useCallback(async (params: PropertySearchParams = searchParams) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/properties?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.data.properties);
        setTotal(data.data.pagination.total);
      } else {
        message.error('載入物件列表失敗');
      }
    } catch (error) {
      console.error('載入物件列表錯誤:', error);
      message.error('網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 載入統計數據
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/properties/stats/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('載入統計數據錯誤:', error);
    }
  }, []);

  // 組件載入時執行
  useEffect(() => {
    loadProperties();
    loadStats();
  }, [loadProperties, loadStats]);

  // 搜索處理
  const handleSearch = (values: any) => {
    const newParams = { ...searchParams, ...values, page: 1 };
    setSearchParams(newParams);
    loadProperties(newParams);
  };

  // 重置搜索
  const handleReset = () => {
    const defaultParams: PropertySearchParams = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    setSearchParams(defaultParams);
    loadProperties(defaultParams);
  };

  // 創建物件
  const handleCreate = async (values: any) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('物件創建成功');
        setShowCreateModal(false);
        form.resetFields();
        loadProperties();
        loadStats();
      } else {
        const error = await response.json();
        message.error(error.message || '創建失敗');
      }
    } catch (error) {
      console.error('創建物件錯誤:', error);
      message.error('網絡錯誤，請稍後再試');
    }
  };

  // 更新物件
  const handleUpdate = async (values: any) => {
    if (!currentProperty) return;

    try {
      const response = await fetch(`/api/properties/${currentProperty._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('物件更新成功');
        setShowEditModal(false);
        setCurrentProperty(null);
        form.resetFields();
        loadProperties();
        loadStats();
      } else {
        const error = await response.json();
        message.error(error.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新物件錯誤:', error);
      message.error('網絡錯誤，請稍後再試');
    }
  };

  // 刪除物件
  const handleDelete = async (propertyId: string) => {
    Modal.confirm({
      title: '確認刪除',
      content: '確定要刪除這個物件嗎？此操作不可撤銷。',
      okText: '確認',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });

          if (response.ok) {
            message.success('物件刪除成功');
            loadProperties();
            loadStats();
          } else {
            const error = await response.json();
            message.error(error.message || '刪除失敗');
          }
        } catch (error) {
          console.error('刪除物件錯誤:', error);
          message.error('網絡錯誤，請稍後再試');
        }
      }
    });
  };

  // 查看客戶匹配
  const handleViewMatches = async (property: Property) => {
    try {
      const response = await fetch(`/api/properties/${property._id}/matches?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        Modal.info({
          title: `${property.title} - 客戶匹配`,
          width: 800,
          content: (
            <div>
              <p>找到 {data.data.total_matches} 個匹配客戶</p>
              <Table
                size="small"
                dataSource={data.data.matched_customers}
                columns={[
                  { title: '客戶姓名', dataIndex: 'first_name', key: 'name' },
                  { title: '匹配分數', dataIndex: 'match_score', key: 'score', render: (score) => `${score}分` },
                  { title: '意願評分', dataIndex: 'purchase_intent_score', key: 'intent' },
                  { title: '狀態', dataIndex: 'status', key: 'status' }
                ]}
                pagination={false}
              />
            </div>
          )
        });
      }
    } catch (error) {
      console.error('查看匹配錯誤:', error);
      message.error('載入匹配數據失敗');
    }
  };

  // 表格列定義
  const columns: ColumnsType<Property> = [
    {
      title: '物件信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            size={64}
            shape="square"
            src={record.images[0]}
            icon={<HomeOutlined />}
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {record.title}
            </div>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              {record.district} · {record.city}
            </div>
            <div style={{ fontSize: 12 }}>
              <Tag color={record.property_type === 'apartment' ? 'blue' : 'green'}>
                {record.property_type === 'apartment' ? '公寓' : '房屋'}
              </Tag>
              <Tag color={record.listing_type === 'sale' ? 'orange' : 'purple'}>
                {record.listing_type === 'sale' ? '出售' : '出租'}
              </Tag>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: true,
      render: (price, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>
            NT$ {price.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.listing_type === 'sale' ? '總價' : '月租'}
          </div>
        </div>
      )
    },
    {
      title: '面積/房型',
      key: 'details',
      width: 120,
      render: (_, record) => (
        <div>
          <div>
            <AreaChartOutlined style={{ marginRight: 4 }} />
            {record.area} {record.area_unit === 'ping' ? '坪' : '平方米'}
          </div>
          {record.bedrooms && (
            <div style={{ marginTop: 4 }}>
              <BellOutlined style={{ marginRight: 4 }} />
              {record.bedrooms}房{record.bathrooms ? `${record.bathrooms}衛` : ''}
            </div>
          )}
          {record.parking_spots && (
            <div style={{ marginTop: 4 }}>
              <CarOutlined style={{ marginRight: 4 }} />
              {record.parking_spots}車位
            </div>
          )}
        </div>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '可售/租', value: 'available' },
        { text: '已售', value: 'sold' },
        { text: '已租', value: 'rented' },
        { text: '下架', value: 'withdrawn' }
      ],
      render: (status) => {
        const statusConfig = {
          available: { color: 'green', text: '可售/租' },
          sold: { color: 'red', text: '已售' },
          rented: { color: 'blue', text: '已租' },
          withdrawn: { color: 'default', text: '下架' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '業務員',
      key: 'agent',
      width: 120,
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ marginBottom: 4 }} />
          <div style={{ fontSize: 12 }}>
            {record.agent_id.first_name} {record.agent_id.last_name}
          </div>
        </div>
      )
    },
    {
      title: '發布時間',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      sorter: true,
      render: (date) => dayjs(date).format('MM/DD')
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看詳情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentProperty(record);
                setShowDetailModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="編輯">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentProperty(record);
                form.setFieldsValue(record);
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="matches" 
                  icon={<UserOutlined />}
                  onClick={() => handleViewMatches(record)}
                >
                  查看客戶匹配
                </Menu.Item>
                <Menu.Item key="share" icon={<ShareAltOutlined />}>
                  分享物件
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  key="delete" 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDelete(record._id)}
                >
                  刪除物件
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  // 物件表單組件
  const PropertyForm: React.FC<{ property?: Property }> = ({ property }) => (
    <Form
      form={form}
      layout="vertical"
      initialValues={property}
      onFinish={property ? handleUpdate : handleCreate}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="title" label="物件標題" rules={[{ required: true }]}>
            <Input placeholder="請輸入物件標題" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="property_type" label="物件類型" rules={[{ required: true }]}>
            <Select placeholder="選擇物件類型">
              <Option value="apartment">公寓</Option>
              <Option value="house">房屋</Option>
              <Option value="office">辦公室</Option>
              <Option value="land">土地</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="listing_type" label="交易類型" rules={[{ required: true }]}>
            <Select placeholder="選擇交易類型">
              <Option value="sale">出售</Option>
              <Option value="rent">出租</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Form.Item name="address" label="詳細地址" rules={[{ required: true }]}>
            <Input placeholder="請輸入詳細地址" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="district" label="行政區">
            <Input placeholder="行政區" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="city" label="城市">
            <Input placeholder="城市" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="price" label="價格" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="請輸入價格"
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="area" label="面積" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="請輸入面積"
              addonAfter={
                <Form.Item name="area_unit" noStyle>
                  <Select defaultValue="ping" style={{ width: 60 }}>
                    <Option value="ping">坪</Option>
                    <Option value="sqm">m²</Option>
                  </Select>
                </Form.Item>
              }
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="bedrooms" label="房間數">
            <InputNumber style={{ width: '100%' }} placeholder="房" min={0} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="bathrooms" label="衛浴數">
            <InputNumber style={{ width: '100%' }} placeholder="衛" min={0} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="parking_spots" label="車位">
            <InputNumber style={{ width: '100%' }} placeholder="車位" min={0} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="floor" label="樓層">
            <InputNumber style={{ width: '100%' }} placeholder="樓層" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="total_floors" label="總樓層">
            <InputNumber style={{ width: '100%' }} placeholder="總樓層" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="building_age" label="屋齡">
            <InputNumber style={{ width: '100%' }} placeholder="年" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="status" label="狀態">
            <Select placeholder="選擇狀態">
              <Option value="available">可售/租</Option>
              <Option value="sold">已售</Option>
              <Option value="rented">已租</Option>
              <Option value="withdrawn">下架</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="物件描述">
        <TextArea rows={4} placeholder="請輸入物件詳細描述" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="features" label="物件特色">
            <Select mode="tags" placeholder="請輸入物件特色標籤">
              <Option value="陽台">陽台</Option>
              <Option value="電梯">電梯</Option>
              <Option value="管理員">管理員</Option>
              <Option value="裝潢">裝潢</Option>
              <Option value="採光佳">採光佳</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="amenities" label="社區設施">
            <Select mode="tags" placeholder="請輸入社區設施">
              <Option value="健身房">健身房</Option>
              <Option value="游泳池">游泳池</Option>
              <Option value="停車場">停車場</Option>
              <Option value="花園">花園</Option>
              <Option value="會議室">會議室</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* 統計卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="總物件數"
                value={stats.total_properties}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="可售/租"
                value={stats.available_properties}
                prefix={<BuildOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均價格"
                value={stats.average_price}
                prefix={<DollarOutlined />}
                formatter={(value) => `NT$ ${Number(value).toLocaleString()}`}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成交率"
                value={stats.success_rate}
                suffix="%"
                prefix={<StarOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和篩選 */}
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="search">
            <Input
              placeholder="搜索物件標題、地址"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="property_type">
            <Select placeholder="物件類型" style={{ width: 120 }} allowClear>
              <Option value="apartment">公寓</Option>
              <Option value="house">房屋</Option>
              <Option value="office">辦公室</Option>
              <Option value="land">土地</Option>
            </Select>
          </Form.Item>
          <Form.Item name="listing_type">
            <Select placeholder="交易類型" style={{ width: 100 }} allowClear>
              <Option value="sale">出售</Option>
              <Option value="rent">出租</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="狀態" style={{ width: 100 }} allowClear>
              <Option value="available">可售/租</Option>
              <Option value="sold">已售</Option>
              <Option value="rented">已租</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              新增物件
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 物件列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={properties}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
            onChange: (page, pageSize) => {
              const newParams = { ...searchParams, page, limit: pageSize };
              setSearchParams(newParams);
              loadProperties(newParams);
            }
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys.map(String)),
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE
            ]
          }}
        />
      </Card>

      {/* 創建物件模態框 */}
      <Modal
        title="新增物件"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateModal(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            創建
          </Button>
        ]}
      >
        <PropertyForm />
      </Modal>

      {/* 編輯物件模態框 */}
      <Modal
        title="編輯物件"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setCurrentProperty(null);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setShowEditModal(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            更新
          </Button>
        ]}
      >
        <PropertyForm property={currentProperty || undefined} />
      </Modal>

      {/* 物件詳情模態框 */}
      <Modal
        title="物件詳情"
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setCurrentProperty(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            關閉
          </Button>
        ]}
      >
        {currentProperty && (
          <div>
            {/* 物件圖片 */}
            {currentProperty.images.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Image.PreviewGroup>
                  {currentProperty.images.map((image, index) => (
                    <Image
                      key={index}
                      width={200}
                      height={150}
                      src={image}
                      style={{ marginRight: 8, objectFit: 'cover' }}
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            {/* 基本信息 */}
            <Descriptions title="基本信息" column={2} bordered>
              <Descriptions.Item label="物件標題" span={2}>
                {currentProperty.title}
              </Descriptions.Item>
              <Descriptions.Item label="物件類型">
                {currentProperty.property_type === 'apartment' ? '公寓' : '房屋'}
              </Descriptions.Item>
              <Descriptions.Item label="交易類型">
                {currentProperty.listing_type === 'sale' ? '出售' : '出租'}
              </Descriptions.Item>
              <Descriptions.Item label="價格">
                NT$ {currentProperty.price.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="面積">
                {currentProperty.area} {currentProperty.area_unit === 'ping' ? '坪' : '平方米'}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {currentProperty.address}
              </Descriptions.Item>
              <Descriptions.Item label="房間配置">
                {currentProperty.bedrooms}房{currentProperty.bathrooms}衛
                {currentProperty.parking_spots && ` ${currentProperty.parking_spots}車位`}
              </Descriptions.Item>
              <Descriptions.Item label="樓層">
                {currentProperty.floor && currentProperty.total_floors 
                  ? `${currentProperty.floor}F/${currentProperty.total_floors}F`
                  : '未提供'
                }
              </Descriptions.Item>
              <Descriptions.Item label="建築年齡">
                {currentProperty.building_age ? `${currentProperty.building_age}年` : '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="狀態">
                <Tag color={currentProperty.status === 'available' ? 'green' : 'red'}>
                  {currentProperty.status === 'available' ? '可售/租' : '已成交'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="業務員">
                {currentProperty.agent_id.first_name} {currentProperty.agent_id.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="聯繫電話">
                {currentProperty.agent_id.phone}
              </Descriptions.Item>
            </Descriptions>

            {/* 描述 */}
            {currentProperty.description && (
              <div style={{ marginTop: 16 }}>
                <h4>物件描述</h4>
                <p>{currentProperty.description}</p>
              </div>
            )}

            {/* 特色和設施 */}
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <h4>物件特色</h4>
                <div>
                  {currentProperty.features.map((feature, index) => (
                    <Tag key={index} style={{ marginBottom: 4 }}>
                      {feature}
                    </Tag>
                  ))}
                </div>
              </Col>
              <Col span={12}>
                <h4>社區設施</h4>
                <div>
                  {currentProperty.amenities.map((amenity, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                      {amenity}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PropertyList;