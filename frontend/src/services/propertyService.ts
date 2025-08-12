// 房產服務 - 統一管理所有房產相關的 API 請求

const API_BASE_URL = '/api';

// 房產資料介面
export interface Property {
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

export interface PropertySearchParams {
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

export interface PropertyStats {
  total_properties: number;
  available_properties: number;
  sold_properties: number;
  rented_properties: number;
  average_price: number;
  total_portfolio_value: number;
  success_rate: string;
}

export interface PropertyListResponse {
  success: boolean;
  data: {
    properties: Property[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface PropertyResponse {
  success: boolean;
  data: {
    property: Property;
  };
}

export interface PropertyStatsResponse {
  success: boolean;
  data: PropertyStats;
}

export interface CustomerMatch {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  purchase_intent_score: number;
  tags: string[];
  last_contact_at: string;
  match_score: number;
  agent: {
    first_name: string;
    last_name: string;
  };
}

export interface CustomerMatchResponse {
  success: boolean;
  data: {
    property_id: string;
    property_title: string;
    matched_customers: CustomerMatch[];
    total_matches: number;
  };
}

// 獲取認證header
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

class PropertyService {
  // 獲取房產列表
  async getProperties(params: PropertySearchParams = {}): Promise<PropertyListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${API_BASE_URL}/properties?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取房產列表失敗:', error);
      throw this.handleError(error);
    }
  }

  // 獲取單個房產詳情
  async getProperty(id: string): Promise<PropertyResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${id}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取房產詳情失敗:', error);
      throw this.handleError(error);
    }
  }

  // 創建房產
  async createProperty(propertyData: Partial<Property>): Promise<PropertyResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(propertyData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('創建房產失敗:', error);
      throw this.handleError(error);
    }
  }

  // 更新房產
  async updateProperty(id: string, propertyData: Partial<Property>): Promise<PropertyResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(propertyData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新房產失敗:', error);
      throw this.handleError(error);
    }
  }

  // 刪除房產
  async deleteProperty(id: string): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('刪除房產失敗:', error);
      throw this.handleError(error);
    }
  }

  // 獲取房產統計
  async getPropertyStats(agentId?: string): Promise<PropertyStatsResponse> {
    try {
      const params = agentId ? `?agent_id=${agentId}` : '';
      const response = await fetch(
        `${API_BASE_URL}/properties/stats/overview${params}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取房產統計失敗:', error);
      throw this.handleError(error);
    }
  }

  // 獲取客戶匹配
  async getCustomerMatches(propertyId: string, limit: number = 10): Promise<CustomerMatchResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/matches?limit=${limit}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取客戶匹配失敗:', error);
      throw this.handleError(error);
    }
  }

  // 上傳房產圖片
  async uploadPropertyImages(files: File[], propertyId?: string): Promise<{ urls: string[] }> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      if (propertyId) {
        formData.append('propertyId', propertyId);
      }

      const response = await fetch(
        `${API_BASE_URL}/upload/property-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('上傳房產圖片失敗:', error);
      throw this.handleError(error);
    }
  }

  // 格式化價格
  formatPrice(price: number, listingType: 'sale' | 'rent' = 'sale'): string {
    const formatted = price.toLocaleString('zh-TW');
    return listingType === 'sale' ? `NT$ ${formatted}` : `NT$ ${formatted}/月`;
  }

  // 格式化面積
  formatArea(area: number, unit: 'ping' | 'sqm' | 'sqft' = 'ping'): string {
    const unitText = {
      ping: '坪',
      sqm: '平方米',
      sqft: '平方英尺'
    };
    return `${area} ${unitText[unit]}`;
  }

  // 格式化房型
  formatRoomInfo(bedrooms?: number, bathrooms?: number, parkingSpots?: number): string {
    const parts = [];
    if (bedrooms) parts.push(`${bedrooms}房`);
    if (bathrooms) parts.push(`${bathrooms}衛`);
    if (parkingSpots) parts.push(`${parkingSpots}車位`);
    return parts.join('');
  }

  // 獲取房產類型顯示文字
  getPropertyTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      apartment: '公寓',
      house: '房屋',
      office: '辦公室',
      land: '土地',
      other: '其他'
    };
    return typeMap[type] || type;
  }

  // 獲取交易類型顯示文字
  getListingTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      sale: '出售',
      rent: '出租'
    };
    return typeMap[type] || type;
  }

  // 獲取狀態顯示文字和顏色
  getStatusConfig(status: string): { text: string; color: string } {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      available: { text: '可售/租', color: 'green' },
      sold: { text: '已售', color: 'red' },
      rented: { text: '已租', color: 'blue' },
      withdrawn: { text: '下架', color: 'default' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  }

  // 錯誤處理
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('未知錯誤');
  }
}

export const propertyService = new PropertyService();
export default propertyService;