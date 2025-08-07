import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Space, Button, Typography, Spin, message, Drawer } from 'antd';
import { FilterOutlined, MenuOutlined } from '@ant-design/icons';
import PropertyMap from '../components/map/PropertyMap';
import LocationSearch from '../components/map/LocationSearch';
import { Coordinates } from '../services/locationService';

const { Content } = Layout;
const { Title } = Typography;

// 模擬房產數據
const mockProperties = [
  {
    _id: '1',
    title: '台北101景觀豪宅',
    location: {
      coordinates: [121.5654, 25.0330] as [number, number],
      address: '台北市信義區信義路五段7號',
      district: '信義區'
    },
    price: 15800000,
    type: '公寓',
    area: 45,
    status: 'available' as const,
    images: []
  },
  {
    _id: '2',
    title: '東區精品公寓',
    location: {
      coordinates: [121.5436, 25.0265] as [number, number],
      address: '台北市大安區忠孝東路四段216號',
      district: '大安區'
    },
    price: 12500000,
    type: '公寓',
    area: 38,
    status: 'available' as const,
    images: []
  },
  {
    _id: '3',
    title: '西門町商圈套房',
    location: {
      coordinates: [121.5077, 25.0329] as [number, number],
      address: '台北市萬華區成都路27號',
      district: '萬華區'
    },
    price: 8800000,
    type: '套房',
    area: 25,
    status: 'sold' as const,
    images: []
  },
  {
    _id: '4',
    title: '士林夜市附近透天',
    location: {
      coordinates: [121.5258, 25.0876] as [number, number],
      address: '台北市士林區大東路18號',
      district: '士林區'
    },
    price: 25000000,
    type: '透天厝',
    area: 80,
    status: 'reserved' as const,
    images: []
  },
  {
    _id: '5',
    title: '內湖科技園區住宅',
    location: {
      coordinates: [121.5944, 25.0694] as [number, number],
      address: '台北市內湖區瑞光路188號',
      district: '內湖區'
    },
    price: 18200000,
    type: '大樓',
    area: 55,
    status: 'available' as const,
    images: []
  }
];

const PropertyMapPage: React.FC = () => {
  const [properties] = useState(mockProperties);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<typeof mockProperties[0] | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 25.0330, lng: 121.5654 });
  const [searchRadius, setSearchRadius] = useState<number>(2);
  const [searchCenter, setSearchCenter] = useState<Coordinates | null>(null);
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 處理地點選擇
  const handleLocationSelect = useCallback((coordinates: Coordinates, address: string) => {
    setMapCenter(coordinates);
    setSearchCenter(coordinates);
    message.success(`已定位到: ${address}`);
  }, []);

  // 處理半徑變化
  const handleRadiusChange = useCallback((radius: number) => {
    setSearchRadius(radius);
  }, []);

  // 處理房產點擊
  const handlePropertyClick = useCallback((property: typeof mockProperties[0]) => {
    setSelectedProperty(property);
    setShowPropertyDrawer(true);
  }, []);

  // 處理地圖點擊
  const handleMapClick = useCallback((coordinates: Coordinates) => {
    console.log('地圖點擊位置:', coordinates);
  }, []);

  // 格式化價格
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}萬`;
    }
    return price.toLocaleString();
  };

  // 獲取狀態文字
  const getStatusText = (status: string) => {
    const statusMap = {
      available: '可售',
      sold: '已售',
      reserved: '預訂'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 標題區域 */}
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                房產地圖搜索
              </Title>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  type={showFilters ? 'primary' : 'default'}
                >
                  搜索選項
                </Button>
                <Button 
                  icon={<MenuOutlined />}
                  onClick={() => setShowPropertyDrawer(true)}
                >
                  房產列表 ({properties.length})
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 主要內容區域 */}
          <Row gutter={[16, 16]}>
            {/* 搜索面板 */}
            {showFilters && (
              <Col xs={24} lg={8}>
                <Card title="地點搜索" size="small">
                  <LocationSearch
                    onLocationSelect={handleLocationSelect}
                    onRadiusChange={handleRadiusChange}
                    showRadius={true}
                    showFavorites={true}
                    initialRadius={searchRadius}
                    maxRadius={10}
                    placeholder="輸入地址或地標..."
                  />
                </Card>
              </Col>
            )}

            {/* 地圖區域 */}
            <Col xs={24} lg={showFilters ? 16 : 24}>
              <Card 
                bodyStyle={{ padding: 0 }} 
                style={{ overflow: 'hidden' }}
              >
                <Spin spinning={loading}>
                  <PropertyMap
                    properties={properties}
                    center={mapCenter}
                    zoom={13}
                    height="70vh"
                    showRadius={!!searchCenter}
                    radiusCenter={searchCenter || undefined}
                    radiusKm={searchRadius}
                    onPropertyClick={handlePropertyClick}
                    onMapClick={handleMapClick}
                    selectedPropertyId={selectedProperty?._id}
                    showCurrentLocation={true}
                  />
                </Spin>
              </Card>
            </Col>
          </Row>
        </Space>
      </Content>

      {/* 房產詳情側邊欄 */}
      <Drawer
        title="房產詳情"
        placement="right"
        onClose={() => setShowPropertyDrawer(false)}
        open={showPropertyDrawer}
        width={400}
      >
        {selectedProperty ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Title level={4}>{selectedProperty.title}</Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>狀態:</span>
                  <span style={{ 
                    color: selectedProperty.status === 'available' ? '#52c41a' : 
                           selectedProperty.status === 'sold' ? '#ff4d4f' : '#faad14'
                  }}>
                    {getStatusText(selectedProperty.status)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>價格:</span>
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    NT$ {formatPrice(selectedProperty.price)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>類型:</span>
                  <span>{selectedProperty.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>面積:</span>
                  <span>{selectedProperty.area} 坪</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>地址:</span>
                  <span style={{ textAlign: 'right', flex: 1, marginLeft: '8px' }}>
                    {selectedProperty.location.address}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>行政區:</span>
                  <span>{selectedProperty.location.district}</span>
                </div>
              </Space>
            </div>

            <Space style={{ width: '100%' }}>
              <Button 
                type="primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setMapCenter({
                    lat: selectedProperty.location.coordinates[1],
                    lng: selectedProperty.location.coordinates[0]
                  });
                  message.success('已定位到房產位置');
                }}
              >
                在地圖上查看
              </Button>
              <Button style={{ flex: 1 }}>
                聯絡我們
              </Button>
            </Space>
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p>請在地圖上選擇一個房產查看詳情</p>
            <Button 
              type="primary"
              onClick={() => setShowPropertyDrawer(false)}
            >
              關閉
            </Button>
          </div>
        )}

        {/* 所有房產列表 */}
        <div style={{ marginTop: '40px' }}>
          <Title level={5}>所有房產 ({properties.length})</Title>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {properties.map((property) => (
              <Card 
                key={property._id}
                size="small"
                bodyStyle={{ padding: '12px' }}
                onClick={() => setSelectedProperty(property)}
                style={{ 
                  cursor: 'pointer',
                  border: selectedProperty?._id === property._id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                }}
                hoverable
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {property.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {property.location.district} • {property.type} • {property.area}坪
                  </div>
                  <div style={{ 
                    color: '#52c41a', 
                    fontWeight: 'bold',
                    marginTop: '4px'
                  }}>
                    NT$ {formatPrice(property.price)}
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </Drawer>
    </Layout>
  );
};

export default PropertyMapPage;