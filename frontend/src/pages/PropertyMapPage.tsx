import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    coordinates: {
      latitude: 25.0876,
      longitude: 121.5258
    },
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
    coordinates: {
      latitude: 25.0694,
      longitude: 121.5944
    },
    price: 18200000,
    type: '大樓',
    area: 55,
    status: 'available' as const,
    images: []
  }
];

const PropertyMapPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // 處理URL參數和自動定位
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const propertyId = searchParams.get('property');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // 如果有房產ID，自動選中該房產
    if (propertyId) {
      const targetProperty = properties.find(p => p._id === propertyId);
      if (targetProperty) {
        console.log('🎯 Auto-selecting property from URL:', targetProperty.title);
        setSelectedProperty(targetProperty);
        setShowPropertyDrawer(true);
        
        // 更新地圖中心位置
        const propertyCenter = {
          lat: targetProperty.location.coordinates[1],
          lng: targetProperty.location.coordinates[0]
        };
        setMapCenter(propertyCenter);
        setSearchCenter(propertyCenter);
        
        message.success(`已定位到房產: ${targetProperty.title}`);
        
        // 清理URL參數（可選）
        window.history.replaceState({}, document.title, location.pathname);
      }
    } else if (lat && lng) {
      // 如果只有座標，直接定位到該座標
      const coords = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      setMapCenter(coords);
      setSearchCenter(coords);
      message.info('已定位到指定位置');
      
      // 清理URL參數
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.search, properties]);

  // 處理房產點擊
  const handlePropertyClick = useCallback((property: typeof mockProperties[0]) => {
    console.log('🏠 Property clicked:', property.title); // 調試日誌
    setSelectedProperty(property);
    setShowPropertyDrawer(true);
    
    // 更新地圖中心位置以高亮選中的房產
    const propertyCenter = {
      lat: property.location.coordinates[1],
      lng: property.location.coordinates[0]
    };
    setMapCenter(propertyCenter);
    
    message.info(`已選中: ${property.title}`);
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
                    height={window.innerWidth <= 768 ? "50vh" : "70vh"}
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
                  if (selectedProperty) {
                    const newCenter = {
                      lat: selectedProperty.location.coordinates[1],
                      lng: selectedProperty.location.coordinates[0]
                    };
                    setMapCenter(newCenter);
                    setSearchCenter(newCenter);
                    
                    // 關閉侧邊欄以顯示地圖
                    if (window.innerWidth <= 768) {
                      setShowPropertyDrawer(false);
                    }
                    
                    message.success(`已定位到: ${selectedProperty.title}`);
                  }
                }}
              >
                在地圖上查看
              </Button>
              <Button 
                style={{ flex: 1 }}
                onClick={() => {
                  // 開啟聯絡窗口或跳轉聯絡頁面
                  const phone = '0987-654-321';
                  const email = 'contact@propagent.pro';
                  const subject = `詢問房產: ${selectedProperty.title}`;
                  const body = `您好，我對以下房產有興趣：\n\n房產名稱: ${selectedProperty.title}\n地址: ${selectedProperty.location.address}\n價格: NT$ ${formatPrice(selectedProperty.price)}\n\n請提供更多詳細資訊，謝謝。`;
                  
                  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  
                  // 顯示聯絡選項
                  const contactOptions = [
                    { label: '發送郵件', action: () => window.open(mailtoLink) },
                    { label: '撥打電話', action: () => window.open(`tel:${phone}`) },
                    { label: '複製聯絡資訊', action: () => {
                      navigator.clipboard.writeText(`電話: ${phone}\n郵箱: ${email}`);
                      message.success('聯絡資訊已複製到剪貼板');
                    }}
                  ];
                  
                  // 這裡可以改成彈出選項菜單
                  window.open(mailtoLink);
                  message.info(`聯絡電話: ${phone}`);
                }}
              >
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