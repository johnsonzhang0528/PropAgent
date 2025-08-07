import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
export const handlers = [
  // Login endpoint
  http.post('http://localhost:3000/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'test123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: '1',
            name: '測試用戶',
            email: 'test@example.com',
            role: 'admin'
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token'
        }
      });
    }
    
    return HttpResponse.json({
      success: false,
      error: {
        message: '登錄失敗'
      }
    }, { status: 401 });
  }),

  // Customers endpoint
  http.get('http://localhost:3000/api/customers', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: '王小明',
          email: 'wang@example.com',
          phone: '0912345678',
          status: 'active'
        },
        {
          id: '2',
          name: '李小華',
          email: 'li@example.com',
          phone: '0987654321',
          status: 'pending'
        }
      ]
    });
  }),

  // Properties endpoint
  http.get('http://localhost:3000/api/properties', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          title: '信義區豪宅',
          address: '台北市信義區信義路五段',
          price: 15000000,
          type: 'apartment',
          status: 'available'
        },
        {
          id: '2',
          title: '大安區公寓',
          address: '台北市大安區敦化南路',
          price: 8000000,
          type: 'apartment',
          status: 'sold'
        }
      ]
    });
  }),

  // Analytics endpoint
  http.get('http://localhost:3000/api/analytics/overview', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalCustomers: 125,
        totalProperties: 45,
        totalSales: 12,
        revenue: 180000000,
        monthlyGrowth: 15.5
      }
    });
  })
];

// Setup requests interception using the given handlers
export const server = setupServer(...handlers);