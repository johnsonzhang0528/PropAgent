// 地理位置服務
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationInfo {
  coordinates: Coordinates;
  address: string;
  district: string;
  city: string;
  country: string;
  postcode?: string;
}

export interface SearchResult {
  place_id: string;
  display_name: string;
  coordinates: Coordinates;
  address: string;
  type: string;
  importance: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

class LocationService {
  private apiKey: string | null = null;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分鐘緩存

  constructor() {
    this.apiKey = import.meta.env.VITE_MAP_API_KEY || null;
  }

  // 獲取用戶當前位置
  async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('瀏覽器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`定位失敗: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // 地址轉換為坐標 (地理編碼)
  async geocodeAddress(address: string): Promise<LocationInfo[]> {
    const cacheKey = `geocode:${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 使用 Nominatim (OpenStreetMap) 免費地理編碼服務
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&countrycodes=tw&addressdetails=1&accept-language=zh-TW,zh,en`
      );

      if (!response.ok) {
        throw new Error('地理編碼服務請求失敗');
      }

      const data = await response.json();
      
      const results: LocationInfo[] = data.map((item: any) => ({
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        address: item.display_name,
        district: item.address?.suburb || item.address?.neighbourhood || '',
        city: item.address?.city || item.address?.town || item.address?.county || '台北市',
        country: item.address?.country || '台灣',
        postcode: item.address?.postcode
      }));

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('地理編碼錯誤:', error);
      throw error;
    }
  }

  // 坐標轉換為地址 (反向地理編碼)
  async reverseGeocode(coordinates: Coordinates): Promise<LocationInfo> {
    const cacheKey = `reverse:${coordinates.lat},${coordinates.lng}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&accept-language=zh-TW,zh,en`
      );

      if (!response.ok) {
        throw new Error('反向地理編碼服務請求失敗');
      }

      const data = await response.json();
      
      const result: LocationInfo = {
        coordinates,
        address: data.display_name,
        district: data.address?.suburb || data.address?.neighbourhood || '',
        city: data.address?.city || data.address?.town || data.address?.county || '台北市',
        country: data.address?.country || '台灣',
        postcode: data.address?.postcode
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('反向地理編碼錯誤:', error);
      throw error;
    }
  }

  // 搜索地點
  async searchPlaces(query: string, bounds?: MapBounds): Promise<SearchResult[]> {
    const cacheKey = `search:${query}:${bounds ? JSON.stringify(bounds) : 'nobounds'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&countrycodes=tw&addressdetails=1&accept-language=zh-TW,zh,en`;
      
      if (bounds) {
        url += `&bounded=1&viewbox=${bounds.west},${bounds.north},${bounds.east},${bounds.south}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('地點搜索服務請求失敗');
      }

      const data = await response.json();
      
      const results: SearchResult[] = data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        address: item.display_name,
        type: item.type || 'unknown',
        importance: parseFloat(item.importance || '0')
      }));

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('地點搜索錯誤:', error);
      throw error;
    }
  }

  // 計算兩點間距離 (公里)
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // 地球半徑 (公里)
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLng = this.deg2rad(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // 保留兩位小數
  }

  // 檢查點是否在邊界內
  isPointInBounds(point: Coordinates, bounds: MapBounds): boolean {
    return point.lat >= bounds.south && 
           point.lat <= bounds.north && 
           point.lng >= bounds.west && 
           point.lng <= bounds.east;
  }

  // 獲取台灣主要城市列表
  getTaiwanCities(): Array<{name: string, coordinates: Coordinates}> {
    return [
      { name: '台北市', coordinates: { lat: 25.0330, lng: 121.5654 } },
      { name: '新北市', coordinates: { lat: 25.0122, lng: 121.4654 } },
      { name: '桃園市', coordinates: { lat: 24.9937, lng: 121.3009 } },
      { name: '台中市', coordinates: { lat: 24.1477, lng: 120.6736 } },
      { name: '台南市', coordinates: { lat: 22.9999, lng: 120.2269 } },
      { name: '高雄市', coordinates: { lat: 22.6273, lng: 120.3014 } },
      { name: '新竹市', coordinates: { lat: 24.8014, lng: 120.9714 } },
      { name: '基隆市', coordinates: { lat: 25.1276, lng: 121.7392 } },
      { name: '嘉義市', coordinates: { lat: 23.4801, lng: 120.4491 } },
      { name: '新竹縣', coordinates: { lat: 24.8387, lng: 121.0177 } },
      { name: '苗栗縣', coordinates: { lat: 24.5602, lng: 120.8214 } },
      { name: '彰化縣', coordinates: { lat: 24.0518, lng: 120.5161 } },
      { name: '南投縣', coordinates: { lat: 23.9609, lng: 120.9718 } },
      { name: '雲林縣', coordinates: { lat: 23.7092, lng: 120.4313 } },
      { name: '嘉義縣', coordinates: { lat: 23.4518, lng: 120.2554 } },
      { name: '屏東縣', coordinates: { lat: 22.5519, lng: 120.5487 } },
      { name: '宜蘭縣', coordinates: { lat: 24.7021, lng: 121.7378 } },
      { name: '花蓮縣', coordinates: { lat: 23.9871, lng: 121.6015 } },
      { name: '台東縣', coordinates: { lat: 22.7972, lng: 121.1713 } },
      { name: '澎湖縣', coordinates: { lat: 23.5714, lng: 119.5793 } },
      { name: '金門縣', coordinates: { lat: 24.4492, lng: 118.3765 } },
      { name: '連江縣', coordinates: { lat: 26.1605, lng: 119.9297 } }
    ];
  }

  // 獲取台北市主要行政區
  getTaipeiDistricts(): Array<{name: string, coordinates: Coordinates}> {
    return [
      { name: '中正區', coordinates: { lat: 25.0320, lng: 121.5186 } },
      { name: '大同區', coordinates: { lat: 25.0634, lng: 121.5114 } },
      { name: '中山區', coordinates: { lat: 25.0636, lng: 121.5264 } },
      { name: '松山區', coordinates: { lat: 25.0496, lng: 121.5780 } },
      { name: '大安區', coordinates: { lat: 25.0265, lng: 121.5436 } },
      { name: '萬華區', coordinates: { lat: 25.0329, lng: 121.5077 } },
      { name: '信義區', coordinates: { lat: 25.0308, lng: 121.5645 } },
      { name: '士林區', coordinates: { lat: 25.0876, lng: 121.5258 } },
      { name: '北投區', coordinates: { lat: 25.1378, lng: 121.5069 } },
      { name: '內湖區', coordinates: { lat: 25.0694, lng: 121.5944 } },
      { name: '南港區', coordinates: { lat: 25.0558, lng: 121.6078 } },
      { name: '文山區', coordinates: { lat: 24.9888, lng: 121.5707 } }
    ];
  }

  // 格式化距離顯示
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}公尺`;
    } else {
      return `${distance.toFixed(1)}公里`;
    }
  }

  // 輔助方法
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 清理過期緩存
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.forEach(([cacheKey, value]) => {
        if (Date.now() - value.timestamp > this.cacheTimeout) {
          this.cache.delete(cacheKey);
        }
      });
    }
  }

  // 清除緩存
  clearCache(): void {
    this.cache.clear();
  }

  // 預載入常用地點
  async preloadCommonLocations(): Promise<void> {
    try {
      const commonQueries = ['台北車站', '101大樓', '松山機場', '桃園機場'];
      await Promise.all(commonQueries.map(query => this.searchPlaces(query)));
    } catch (error) {
      console.warn('預載入常用地點失敗:', error);
    }
  }
}

// 創建單例實例
export const locationService = new LocationService();

export default locationService;