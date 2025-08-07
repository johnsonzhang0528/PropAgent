import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  Card,
  List,
  Space,
  Typography,
  AutoComplete,
  Slider,
  Row,
  Col,
  Tag,
  Tooltip,
  message,
  Spin
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  AimOutlined,
  ClearOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { locationService, type Coordinates, type SearchResult } from '../../services/locationService';

const { Text } = Typography;

interface LocationSearchProps {
  onLocationSelect?: (location: Coordinates, address: string) => void;
  onRadiusChange?: (radius: number) => void;
  placeholder?: string;
  showRadius?: boolean;
  initialRadius?: number;
  maxRadius?: number;
  showFavorites?: boolean;
  disabled?: boolean;
}

interface FavoriteLocation {
  name: string;
  address: string;
  coordinates: Coordinates;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  onRadiusChange,
  placeholder = "搜索地點...",
  showRadius = false,
  initialRadius = 1,
  maxRadius = 10,
  showFavorites = false,
  disabled = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(initialRadius);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 載入本地存儲的數據
  useEffect(() => {
    const saved = localStorage.getItem('location_search_recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('載入搜索歷史失敗:', error);
      }
    }

    const savedFavorites = localStorage.getItem('location_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('載入收藏地點失敗:', error);
      }
    }
  }, []);

  // 搜索地點
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await locationService.searchPlaces(query);
      setSearchResults(results);
      setShowSuggestions(true);
      
      // 添加到搜索歷史
      addToRecentSearches(query);
    } catch (error) {
      console.error('搜索地點失敗:', error);
      message.error('搜索失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // 防抖搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 500) as NodeJS.Timeout;
  };

  // 選擇搜索結果
  const handleResultSelect = (result: SearchResult) => {
    setSearchText(result.display_name);
    setShowSuggestions(false);
    onLocationSelect?.(result.coordinates, result.display_name);
    addToRecentSearches(result.display_name);
  };

  // 獲取當前位置
  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const coordinates = await locationService.getCurrentPosition();
      const locationInfo = await locationService.reverseGeocode(coordinates);
      
      setSearchText(locationInfo.address);
      onLocationSelect?.(coordinates, locationInfo.address);
      message.success('已定位到當前位置');
    } catch (error) {
      console.error('獲取當前位置失敗:', error);
      message.error('無法獲取當前位置');
    } finally {
      setLoading(false);
    }
  };

  // 添加到搜索歷史
  const addToRecentSearches = (query: string) => {
    const newRecent = [query, ...recentSearches.filter(item => item !== query)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('location_search_recent', JSON.stringify(newRecent));
  };

  // 清除搜索歷史
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('location_search_recent');
  };

  // 添加到收藏
  const addToFavorites = (name: string, address: string, coordinates: Coordinates) => {
    const newFavorite: FavoriteLocation = { name, address, coordinates };
    const newFavorites = [newFavorite, ...favorites.filter(item => 
      item.coordinates.lat !== coordinates.lat || item.coordinates.lng !== coordinates.lng
    )].slice(0, 10);
    
    setFavorites(newFavorites);
    localStorage.setItem('location_favorites', JSON.stringify(newFavorites));
    message.success('已添加到收藏');
  };

  // 從收藏中移除
  const removeFromFavorites = (coordinates: Coordinates) => {
    const newFavorites = favorites.filter(item => 
      item.coordinates.lat !== coordinates.lat || item.coordinates.lng !== coordinates.lng
    );
    setFavorites(newFavorites);
    localStorage.setItem('location_favorites', JSON.stringify(newFavorites));
    message.success('已從收藏中移除');
  };

  // 檢查是否在收藏中
  const isFavorite = (coordinates: Coordinates) => {
    return favorites.some(item => 
      item.coordinates.lat === coordinates.lat && item.coordinates.lng === coordinates.lng
    );
  };

  // 半徑變化處理
  const handleRadiusChange = (value: number) => {
    setRadius(value);
    onRadiusChange?.(value);
  };

  // 獲取AutoComplete選項
  const getAutoCompleteOptions = () => {
    const options = [];

    // 搜索結果
    if (searchResults.length > 0 && showSuggestions) {
      options.push({
        label: '搜索結果',
        options: searchResults.map(result => ({
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>{result.display_name}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {result.type} • 重要度: {(result.importance * 100).toFixed(0)}%
                </Text>
              </div>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={isFavorite(result.coordinates) ? <StarFilled /> : <StarOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFavorite(result.coordinates)) {
                      removeFromFavorites(result.coordinates);
                    } else {
                      addToFavorites(result.display_name, result.display_name, result.coordinates);
                    }
                  }}
                />
              </Space>
            </div>
          ),
          value: result.display_name,
          result
        }))
      });
    }

    // 收藏地點
    if (showFavorites && favorites.length > 0 && !searchText.trim()) {
      options.push({
        label: '收藏地點',
        options: favorites.map(fav => ({
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>{fav.name}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>{fav.address}</Text>
              </div>
              <StarFilled style={{ color: '#faad14' }} />
            </div>
          ),
          value: fav.address,
          result: {
            display_name: fav.address,
            coordinates: fav.coordinates
          }
        }))
      });
    }

    // 搜索歷史
    if (recentSearches.length > 0 && !searchText.trim()) {
      options.push({
        label: '最近搜索',
        options: recentSearches.map(recent => ({
          label: recent,
          value: recent
        }))
      });
    }

    return options;
  };

  return (
    <Card size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 搜索輸入框 */}
        <Row gutter={[8, 8]} align="middle">
          <Col flex="auto">
            <AutoComplete
              style={{ width: '100%' }}
              options={getAutoCompleteOptions()}
              value={searchText}
              onChange={handleSearch}
              onSelect={(value, option: any) => {
                if (option.result) {
                  handleResultSelect(option.result);
                } else {
                  // 搜索歷史項
                  setSearchText(value);
                  searchLocations(value);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
            >
              <Input
                prefix={<SearchOutlined />}
                suffix={
                  loading ? (
                    <Spin size="small" />
                  ) : (
                    searchText && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setSearchText('');
                          setSearchResults([]);
                          setShowSuggestions(false);
                        }}
                      />
                    )
                  )
                }
                allowClear
              />
            </AutoComplete>
          </Col>
          
          <Col>
            <Tooltip title="使用當前位置">
              <Button
                icon={<AimOutlined />}
                onClick={getCurrentLocation}
                loading={loading}
                disabled={disabled}
              />
            </Tooltip>
          </Col>
        </Row>

        {/* 搜索半徑控制 */}
        {showRadius && (
          <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
              <Text>搜索半徑</Text>
              <Text strong>{radius} 公里</Text>
            </Row>
            <Slider
              min={0.5}
              max={maxRadius}
              step={0.5}
              value={radius}
              onChange={handleRadiusChange}
              marks={{
                0.5: '0.5km',
                [maxRadius / 2]: `${maxRadius / 2}km`,
                [maxRadius]: `${maxRadius}km`
              }}
              disabled={disabled}
            />
          </div>
        )}

        {/* 快速選擇標籤 */}
        <div>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
            熱門地點
          </Text>
          <Space wrap>
            {locationService.getTaipeiDistricts().slice(0, 6).map(district => (
              <Tag
                key={district.name}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSearchText(district.name);
                  onLocationSelect?.(district.coordinates, district.name);
                }}
              >
                {district.name}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 搜索歷史管理 */}
        {recentSearches.length > 0 && (
          <div>
            <Row justify="space-between" align="middle">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                最近搜索
              </Text>
              <Button
                type="text"
                size="small"
                onClick={clearRecentSearches}
              >
                清除
              </Button>
            </Row>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default LocationSearch;