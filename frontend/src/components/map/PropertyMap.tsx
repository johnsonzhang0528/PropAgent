import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import { Icon, divIcon, LatLngBounds } from 'leaflet';
import { Card, Button, Space, Typography, Tag, Avatar, Tooltip, Badge } from 'antd';
import { 
  EnvironmentOutlined, 
  HomeOutlined, 
  DollarOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { locationService, type Coordinates } from '../../services/locationService';
import 'leaflet/dist/leaflet.css';

const { Text, Title } = Typography;

// 修復 Leaflet 默認圖標問題
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 房產數據介面
interface Property {
  _id: string;
  title: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
    address: string;
    district: string;
  };
  price: number;
  type: string;
  area: number;
  status: 'available' | 'sold' | 'reserved';
  images?: string[];
}

interface PropertyMapProps {
  properties: Property[];
  center?: Coordinates;
  zoom?: number;
  height?: string | number;
  showSearch?: boolean;
  showRadius?: boolean;
  radiusCenter?: Coordinates;
  radiusKm?: number;
  onPropertyClick?: (property: Property) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
  selectedPropertyId?: string;
  showCurrentLocation?: boolean;
}

// 地圖事件處理組件
const MapEvents: React.FC<{
  onMapClick?: (coordinates: Coordinates) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
}> = ({ onMapClick, onBoundsChange }) => {
  const map = useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
    moveend: () => {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    },
    zoomend: () => {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    }
  });
  return null;
};

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  center = { lat: 25.0330, lng: 121.5654 }, // 台北市中心
  zoom = 12,
  height = 400,
  showSearch = false,
  showRadius = false,
  radiusCenter,
  radiusKm = 1,
  onPropertyClick,
  onMapClick,
  onBoundsChange,
  selectedPropertyId,
  showCurrentLocation = false
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef<any>(null);

  // 檢測移動設備
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 獲取當前位置
  useEffect(() => {
    if (showCurrentLocation) {
      locationService.getCurrentPosition()
        .then(setCurrentLocation)
        .catch(console.error);
    }
  }, [showCurrentLocation]);

  // 創建房產標記圖標
  const createPropertyIcon = (property: Property, isSelected: boolean = false) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'available': return '#52c41a';
        case 'sold': return '#ff4d4f';
        case 'reserved': return '#faad14';
        default: return '#d9d9d9';
      }
    };

    const color = getStatusColor(property.status);
    const size = isSelected ? 40 : 30;
    const borderWidth = isSelected ? 3 : 2;

    return divIcon({
      html: `
        <div class="property-marker" style="
          background: ${color};
          width: ${size}px;
          height: ${size}px;
          border: ${borderWidth}px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          <div style="
            color: white;
            font-size: ${size * 0.4}px;
            font-weight: bold;
          ">
            🏠
          </div>
        </div>
        <style>
          .property-marker:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
            z-index: 1000;
          }
        </style>
      `,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // 創建當前位置圖標
  const currentLocationIcon = divIcon({
    html: `
      <div style="
        background: #1890ff;
        width: 20px;
        height: 20px;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(24, 144, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
        }
      </style>
    `,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  // 格式化價格
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}萬`;
    }
    return price.toLocaleString();
  };

  // 獲取狀態標籤
  const getStatusTag = (status: string) => {
    const statusMap = {
      available: { text: '可售', color: 'green' },
      sold: { text: '已售', color: 'red' },
      reserved: { text: '預訂', color: 'orange' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 切換全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 適應所有標記
  const fitAllMarkers = () => {
    if (mapRef.current && properties.length > 0) {
      const bounds = new LatLngBounds([]);
      properties.forEach(property => {
        bounds.extend([property.location.coordinates[1], property.location.coordinates[0]]);
      });
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const mapStyle: React.CSSProperties = {
    height: isFullscreen ? '100vh' : height,
    width: '100%',
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : 'auto',
    left: isFullscreen ? 0 : 'auto',
    zIndex: isFullscreen ? 9999 : 'auto',
    minHeight: '300px'
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 地圖控制按鈕 */}
      <div style={{
        position: 'absolute',
        top: isMobile ? 60 : 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Button
          size="small"
          icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={toggleFullscreen}
          style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        
        <Button
          size="small"
          icon={<EnvironmentOutlined />}
          onClick={fitAllMarkers}
          style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          title="顯示所有房產"
        />
      </div>

      {/* 房產統計資訊 */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'white',
        padding: isMobile ? '8px 12px' : '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        minWidth: isMobile ? '150px' : '200px',
        fontSize: isMobile ? '12px' : '14px'
      }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HomeOutlined />
            <Text strong>總計 {properties.length} 個房產</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
              <span>可售: {properties.filter(p => p.status === 'available').length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#faad14', borderRadius: '50%' }}></div>
              <span>預訂: {properties.filter(p => p.status === 'reserved').length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#ff4d4f', borderRadius: '50%' }}></div>
              <span>已售: {properties.filter(p => p.status === 'sold').length}</span>
            </div>
          </div>
        </Space>
      </div>

      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={mapStyle}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 地圖事件處理 */}
        <MapEvents onMapClick={onMapClick} onBoundsChange={onBoundsChange} />

        {/* 搜索半徑圓圈 */}
        {showRadius && radiusCenter && (
          <Circle
            center={[radiusCenter.lat, radiusCenter.lng]}
            radius={radiusKm * 1000} // 轉換為公尺
            fillColor="#1890ff"
            fillOpacity={0.1}
            color="#1890ff"
            weight={2}
          />
        )}

        {/* 當前位置標記 */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <Title level={5}>您的當前位置</Title>
                <Text type="secondary">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </Text>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 房產標記 */}
        {properties.map((property) => {
          const isSelected = selectedPropertyId === property._id;
          const [lat, lng] = [property.location.coordinates[1], property.location.coordinates[0]];
          
          return (
            <Marker
              key={property._id}
              position={[lat, lng]}
              icon={createPropertyIcon(property, isSelected)}
              eventHandlers={{
                click: () => onPropertyClick?.(property)
              }}
            >
              <Popup maxWidth={300}>
                <div style={{ minWidth: '250px' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Title level={5} style={{ margin: 0, flex: 1 }}>
                        {property.title}
                      </Title>
                      {getStatusTag(property.status)}
                    </div>
                    
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <EnvironmentOutlined style={{ color: '#1890ff' }} />
                        <Text type="secondary">{property.location.address}</Text>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarOutlined style={{ color: '#52c41a' }} />
                        <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                          NT$ {formatPrice(property.price)}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">類型: {property.type}</Text>
                        <Text type="secondary">面積: {property.area} 坪</Text>
                      </div>
                    </Space>

                    <Button 
                      type="primary" 
                      size="small" 
                      style={{ width: '100%' }}
                      onClick={() => onPropertyClick?.(property)}
                    >
                      查看詳情
                    </Button>
                  </Space>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 全屏模式下的關閉按鈕 */}
      {isFullscreen && (
        <Button
          type="primary"
          size="large"
          onClick={toggleFullscreen}
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 10000
          }}
        >
          返回
        </Button>
      )}
    </div>
  );
};

export default PropertyMap;