import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Image,
  Descriptions,
  Spin,
  message,
  Breadcrumb,
  Divider,
  Avatar,
  Tooltip,
  FloatButton
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  HomeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShareAltOutlined,
  HeartOutlined,
  StarOutlined,
  CalendarOutlined,
  AreaChartOutlined,
  CarOutlined,
  BellOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { propertyService, type Property } from '../../services/propertyService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageIndex, setImageIndex] = useState<number>(0);

  // 載入房產詳情
  useEffect(() => {
    if (id) {
      loadPropertyDetail(id);
    }
  }, [id]);

  const loadPropertyDetail = async (propertyId: string) => {
    setLoading(true);
    try {
      const response = await propertyService.getProperty(propertyId);
      setProperty(response.data.property);
    } catch (error) {
      console.error('載入房產詳情錯誤:', error);
      message.error('載入房產詳情失敗');
      navigate('/properties'); // 載入失敗時返回列表頁
    } finally {
      setLoading(false);
    }
  };

  // 在地圖上查看房產
  const handleViewOnMap = () => {
    if (!property) return;
    
    // 導航到地圖頁面並傳遞房產ID參數
    const lat = property.coordinates?.latitude || 25.0330;
    const lng = property.coordinates?.longitude || 121.5654;
    navigate(`/map?property=${property._id}&lat=${lat}&lng=${lng}`);
    message.info(`正在地圖上定位 ${property.title}`);
  };

  // 聯絡業務員
  const handleContact = () => {
    if (!property) return;
    
    const phone = property.agent_id.phone;
    const email = property.agent_id.email || 'contact@propagent.pro';
    const subject = `詢問房產: ${property.title}`;
    const body = `您好，我對以下房產有興趣：

房產名稱: ${property.title}
地址: ${property.location.address}
價格: NT$ ${formatPrice(property.price)}

請提供更多詳細資訊，謝謝。`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    message.info(`業務員聯絡電話: ${phone}`);
  };

  // 分享房產
  const handleShare = () => {
    if (!property) return;
    
    const shareUrl = window.location.href;
    const shareText = `${property.title} - NT$ ${formatPrice(property.price)}`;
    
    if (navigator.share) {
      navigator.share({
        title: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      message.success('房產連結已複製到剪貼板');
    }
  };

  // 格式化價格
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}萬`;
    }
    return price.toLocaleString();
  };

  // 獲取狀態配置
  const getStatusConfig = (status: string) => {
    const statusMap = {
      available: { color: 'green', text: '可售/租' },
      sold: { color: 'red', text: '已售' },
      rented: { color: 'blue', text: '已租' },
      withdrawn: { color: 'default', text: '下架' }
    };
    return statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '50px' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>房產不存在</Title>
            <Button type="primary" onClick={() => navigate('/properties')}>
              返回房產列表
            </Button>
          </div>
        </Content>
      </Layout>
    );
  }

  const statusConfig = getStatusConfig(property.status);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* 麵包屑導航 */}
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item href="/properties">
            <HomeOutlined /> 房產管理
          </Breadcrumb.Item>
          <Breadcrumb.Item>{property.title}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 返回按鈕 */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/properties')}
          style={{ marginBottom: '16px' }}
        >
          返回列表
        </Button>

        <Row gutter={[24, 24]}>
          {/* 左側：圖片和基本資訊 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 房產圖片 */}
              <Card bodyStyle={{ padding: 0 }}>
                {property.images.length > 0 ? (
                  <Image.PreviewGroup>
                    <div style={{ position: 'relative' }}>
                      <Image
                        width="100%"
                        height={400}
                        src={property.images[imageIndex]}
                        style={{ objectFit: 'cover' }}
                        preview={true}
                      />
                      {property.images.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 16,
                          right: 16,
                          display: 'flex',
                          gap: '8px'
                        }}>
                          {property.images.map((_, index) => (
                            <div
                              key={index}
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: index === imageIndex ? '#1890ff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer'
                              }}
                              onClick={() => setImageIndex(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {property.images.slice(1).map((image, index) => (
                      <Image key={index + 1} src={image} style={{ display: 'none' }} />
                    ))}
                  </Image.PreviewGroup>
                ) : (
                  <div style={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <HomeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                  </div>
                )}
              </Card>

              {/* 房產詳細資訊 */}
              <Card title="房產詳情">
                <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered>
                  <Descriptions.Item label="物件標題" span={3}>
                    <Title level={4} style={{ margin: 0 }}>{property.title}</Title>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="狀態">
                    <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="物件類型">
                    {propertyService.getPropertyTypeText(property.property_type)}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="交易類型">
                    {propertyService.getListingTypeText(property.listing_type)}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="價格">
                    <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      NT$ {formatPrice(property.price)}
                    </Text>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="面積">
                    <Space>
                      <AreaChartOutlined />
                      {property.area} {property.area_unit === 'ping' ? '坪' : '平方米'}
                    </Space>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="房型配置">
                    <Space>
                      {property.bedrooms && (
                        <span><BellOutlined /> {property.bedrooms}房</span>
                      )}
                      {property.bathrooms && (
                        <span>{property.bathrooms}衛</span>
                      )}
                      {property.parking_spots && (
                        <span><CarOutlined /> {property.parking_spots}車位</span>
                      )}
                    </Space>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="地址" span={3}>
                    <Space>
                      <EnvironmentOutlined />
                      {property.address}
                    </Space>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="行政區">
                    {property.district}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="城市">
                    {property.city}
                  </Descriptions.Item>
                  
                  {property.floor && (
                    <Descriptions.Item label="樓層">
                      {property.floor}F
                      {property.total_floors && `/${property.total_floors}F`}
                    </Descriptions.Item>
                  )}
                  
                  {property.building_age && (
                    <Descriptions.Item label="屋齡">
                      {property.building_age}年
                    </Descriptions.Item>
                  )}
                  
                  <Descriptions.Item label="發布時間">
                    <Space>
                      <CalendarOutlined />
                      {new Date(property.created_at).toLocaleDateString('zh-TW')}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 房產描述 */}
              {property.description && (
                <Card title="房產描述">
                  <Paragraph>{property.description}</Paragraph>
                </Card>
              )}

              {/* 特色和設施 */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card title="房產特色" size="small">
                    <Space wrap>
                      {property.features.map((feature, index) => (
                        <Tag key={index} color="blue">{feature}</Tag>
                      ))}
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card title="社區設施" size="small">
                    <Space wrap>
                      {property.amenities.map((amenity, index) => (
                        <Tag key={index} color="green">{amenity}</Tag>
                      ))}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </Col>

          {/* 右側：業務員資訊和操作按鈕 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 業務員資訊 */}
              <Card title="業務員資訊">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Avatar size={80} icon={<UserOutlined />} />
                  <Title level={4} style={{ margin: '8px 0' }}>
                    {property.agent_id.first_name} {property.agent_id.last_name}
                  </Title>
                  <Text type="secondary">房產專員</Text>
                </div>
                
                <Divider />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhoneOutlined />
                    <Text>{property.agent_id.phone}</Text>
                  </div>
                  {property.agent_id.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MailOutlined />
                      <Text>{property.agent_id.email}</Text>
                    </div>
                  )}
                </Space>
                
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: '16px' }}
                  onClick={handleContact}
                >
                  聯絡業務員
                </Button>
              </Card>

              {/* 操作按鈕 */}
              <Card title="房產操作">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<EnvironmentOutlined />}
                    onClick={handleViewOnMap}
                  >
                    在地圖上查看
                  </Button>
                  
                  <Button
                    size="large"
                    block
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  >
                    分享房產
                  </Button>
                  
                  <Button
                    size="large"
                    block
                    icon={<HeartOutlined />}
                  >
                    加入收藏
                  </Button>
                  
                  <Button
                    size="large"
                    block
                    icon={<EyeOutlined />}
                  >
                    查看相似房產
                  </Button>
                </Space>
              </Card>

              {/* 快速資訊 */}
              <Card title="快速資訊" size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>每坪單價</Text>
                    <Text strong>
                      NT$ {Math.round(property.price / property.area).toLocaleString()}
                    </Text>
                  </div>
                  {property.management_fee && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>管理費</Text>
                      <Text>NT$ {property.management_fee}/月</Text>
                    </div>
                  )}
                  {property.parking_fee && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>停車費</Text>
                      <Text>NT$ {property.parking_fee}/月</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>

        {/* 浮動操作按鈕 */}
        <FloatButton.Group
          trigger="hover"
          type="primary"
          style={{ right: 24 }}
          icon={<EnvironmentOutlined />}
        >
          <FloatButton
            icon={<EnvironmentOutlined />}
            tooltip="在地圖上查看"
            onClick={handleViewOnMap}
          />
          <FloatButton
            icon={<PhoneOutlined />}
            tooltip="聯絡業務員"
            onClick={handleContact}
          />
          <FloatButton
            icon={<ShareAltOutlined />}
            tooltip="分享房產"
            onClick={handleShare}
          />
        </FloatButton.Group>
      </Content>
    </Layout>
  );
};

export default PropertyDetailPage;