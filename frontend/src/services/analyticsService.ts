import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 創建 axios 實例
const analyticsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/analytics`,
  timeout: 10000,
});

// 請求攔截器 - 添加認證 token
analyticsApi.interceptors.request.use(
  (config) => {
    // 在開發模式下，如果是測試端點，跳過認證
    if (import.meta.env.DEV && config.url?.includes('/test/')) {
      return config;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理錯誤和token刷新
analyticsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是401錯誤且還沒嘗試過刷新token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (refreshResponse.ok) {
            const result = await refreshResponse.json();
            if (result.success) {
              localStorage.setItem('access_token', result.data.access_token);
              localStorage.setItem('refresh_token', result.data.refresh_token);
              
              // 重試原始請求
              originalRequest.headers.Authorization = `Bearer ${result.data.access_token}`;
              return analyticsApi(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error('Token刷新失敗:', refreshError);
      }
    }
    
    // 如果是認證失敗，在開發模式下跳過重定向，生產模式才重定向
    if (error.response?.status === 401 && !import.meta.env.DEV) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    console.error('Analytics API 錯誤:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 介面定義
export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  potential_customers: number;
  completed_customers: number;
  success_rate: string;
}

export interface CustomerStatusDistribution {
  status: string;
  count: number;
}

export interface PurchaseIntentDistribution {
  scoreRange: string;
  count: number;
}

export interface PropertyStats {
  total_properties: number;
  available_properties: number;
  sold_properties: number;
  reserved_properties: number;
  average_price: number;
}

export interface PriceRangeDistribution {
  priceRange: string;
  count: number;
}

export interface MonthlyTrendData {
  year: number;
  month: number;
  count: number;
}

export interface MonthlyTrends {
  customer_trends: MonthlyTrendData[];
  property_trends: MonthlyTrendData[];
}

export interface LocationDistribution {
  property_distribution: {
    district: string;
    count: number;
    averagePrice: number;
  }[];
  customer_preferences: {
    location: string;
    count: number;
  }[];
}

// API 服務函數
export const analyticsService = {
  // 獲取客戶統計數據
  async getCustomerStats(): Promise<CustomerStats> {
    const endpoint = import.meta.env.DEV ? '/test/customer-stats' : '/customer-stats';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取客戶狀態分布
  async getCustomerStatusDistribution(): Promise<CustomerStatusDistribution[]> {
    const endpoint = import.meta.env.DEV ? '/test/customer-status-distribution' : '/customer-status-distribution';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取購買意願分布
  async getPurchaseIntentDistribution(): Promise<PurchaseIntentDistribution[]> {
    const endpoint = import.meta.env.DEV ? '/test/purchase-intent-distribution' : '/purchase-intent-distribution';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取房產統計數據
  async getPropertyStats(): Promise<PropertyStats> {
    const endpoint = import.meta.env.DEV ? '/test/property-stats' : '/property-stats';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取價格區間分布
  async getPriceRangeDistribution(): Promise<PriceRangeDistribution[]> {
    const endpoint = import.meta.env.DEV ? '/test/price-range-distribution' : '/price-range-distribution';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取月度趨勢數據
  async getMonthlyTrends(): Promise<MonthlyTrends> {
    const endpoint = import.meta.env.DEV ? '/test/monthly-trends' : '/monthly-trends';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取地區分布數據
  async getLocationDistribution(): Promise<LocationDistribution> {
    const endpoint = import.meta.env.DEV ? '/test/location-distribution' : '/location-distribution';
    const response = await analyticsApi.get(endpoint);
    return response.data;
  },

  // 獲取所有分析數據（一次性獲取）
  async getAllAnalyticsData() {
    try {
      const [
        customerStats,
        customerStatusDistribution,
        purchaseIntentDistribution,
        propertyStats,
        priceRangeDistribution,
        monthlyTrends,
        locationDistribution
      ] = await Promise.all([
        this.getCustomerStats(),
        this.getCustomerStatusDistribution(),
        this.getPurchaseIntentDistribution(),
        this.getPropertyStats(),
        this.getPriceRangeDistribution(),
        this.getMonthlyTrends(),
        this.getLocationDistribution()
      ]);

      return {
        customerStats,
        customerStatusDistribution,
        purchaseIntentDistribution,
        propertyStats,
        priceRangeDistribution,
        monthlyTrends,
        locationDistribution
      };
    } catch (error) {
      console.error('獲取分析數據失敗:', error);
      throw error;
    }
  }
};

export default analyticsService;