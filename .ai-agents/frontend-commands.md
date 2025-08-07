# 🎨 Frontend 開發命令手冊

## 當前任務：PropAgent Pro 前端開發
使用 React + TypeScript + Ant Design 開發現代化房仲管理系統

## 🚀 立即執行：項目初始化

### 1. 創建 React + TypeScript 項目
```bash
# 使用 Vite 創建項目
npm create vite@latest . -- --template react-ts
npm install

# 安裝核心依賴
npm install antd @reduxjs/toolkit react-redux react-router-dom
npm install @types/node lucide-react recharts
npm install -D @types/react @types/react-dom

echo "✅ React 項目初始化完成"
```

### 2. 配置開發環境
```bash
# 配置 ESLint 和 Prettier
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-plugin-react eslint-plugin-react-hooks

# 創建 ESLint 配置
cat > .eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2020": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react", "@typescript-eslint"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
EOF

# 配置 Prettier
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF

echo "✅ 開發環境配置完成"
```

### 3. 設置項目結構
```bash
# 創建標準目錄結構
mkdir -p src/{components,pages,hooks,services,store,utils,styles,types}
mkdir -p src/components/{ui,business,layout}
mkdir -p src/pages/{auth,dashboard,customers,schedule,properties,analytics}
mkdir -p src/store/{slices,api}

echo "✅ 項目結構創建完成"
```

### 4. 配置 Ant Design 主題
```bash
# 創建主題配置
cat > src/styles/theme.ts << 'EOF'
import { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // 主色調
    colorPrimary: '#1890FF',
    colorSuccess: '#52C41A',
    colorWarning: '#FA8C16',
    colorError: '#FF4D4F',
    
    // 字體
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: 14,
    
    // 圓角
    borderRadius: 8,
    
    // 間距
    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
  },
};
EOF

echo "✅ Ant Design 主題配置完成"
```

### 5. 設置 Redux Store
```bash
# 創建 Redux 配置
cat > src/store/index.ts << 'EOF'
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api/api';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
EOF

# 創建認證 Slice
cat > src/store/slices/authSlice.ts << 'EOF'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<{user: User; token: string}>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
EOF

echo "✅ Redux Store 配置完成"
```

## 🎯 核心頁面開發

### 1. 登入頁面
```bash
# 創建登入頁面
cat > src/pages/auth/LoginPage.tsx << 'EOF'
import React from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { loginStart, loginSuccess } from '../../store/slices/authSlice';

const { Title, Text } = Typography;

interface LoginForm {
  phone: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  const handleLogin = async (values: LoginForm) => {
    dispatch(loginStart());
    
    try {
      // TODO: 整合後端 API
      // const response = await authAPI.login(values);
      
      // 模擬登入成功
      setTimeout(() => {
        dispatch(loginSuccess({
          user: {
            id: '1',
            email: 'demo@propagent.com',
            firstName: '示範',
            lastName: '用戶',
            role: 'agent'
          },
          token: 'demo-token'
        }));
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: '#1890FF', marginBottom: 8 }}>
              PropAgent Pro
            </Title>
            <Text type="secondary">房仲智能客戶管理系統</Text>
          </div>

          <Form form={form} onFinish={handleLogin} layout="vertical">
            <Form.Item
              name="phone"
              rules={[{ required: true, message: '請輸入手機號碼' }]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="手機號碼"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '請輸入密碼' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密碼"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                登入
              </Button>
            </Form.Item>
          </Form>

          <Divider>或</Divider>

          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button block icon={<UserOutlined />}>
              使用 Line 登入
            </Button>
            <Button block icon={<UserOutlined />}>
              使用微信登入
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};
EOF

echo "✅ 登入頁面開發完成"
```

### 2. 主儀表板
```bash
# 創建儀表板頁面
cat > src/pages/dashboard/DashboardPage.tsx << 'EOF'
import React from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Tag, Button } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  HomeOutlined, 
  TrophyOutlined,
  PhoneOutlined,
  MessageOutlined 
} from '@ant-design/icons';

export const DashboardPage: React.FC = () => {
  // 模擬數據
  const todayTasks = [
    { id: 1, client: '王小明', task: '預約看房', time: '10:00', priority: 'high' },
    { id: 2, client: '李小姐', task: '回電諮詢', time: '14:00', priority: 'medium' },
    { id: 3, client: '張先生', task: '合約簽署', time: '16:00', priority: 'high' },
  ];

  const recentActivities = [
    { id: 1, client: '陳太太', action: '查看信義區物件', time: '2小時前' },
    { id: 2, client: '林先生', action: '來電詢問價格', time: '4小時前' },
    { id: 3, client: '黃小姐', action: '預約明日看房', time: '昨日' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 統計卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月成交"
              value={3}
              suffix="/ 5"
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={60} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活躍客戶"
              value={28}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
            <div style={{ color: '#52c41a', marginTop: 8 }}>
              ↑ 12% 本週增長
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日看房"
              value={5}
              prefix={<HomeOutlined style={{ color: '#fa8c16' }} />}
            />
            <div style={{ color: '#fa8c16', marginTop: 8 }}>
              3 個待確認
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="業績達成"
              value={450}
              suffix="/ 800萬"
              prefix="¥"
            />
            <Progress percent={56} strokeColor="#722ed1" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 今日待辦 */}
        <Col xs={24} lg={12}>
          <Card 
            title="今日待辦事項" 
            extra={<Button type="primary" size="small">新增任務</Button>}
          >
            <List
              dataSource={todayTasks}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button icon={<PhoneOutlined />} size="small" />,
                    <Button icon={<MessageOutlined />} size="small" />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div>
                        {item.client} - {item.task}
                        <Tag 
                          color={item.priority === 'high' ? 'red' : 'orange'}
                          style={{ marginLeft: 8 }}
                        >
                          {item.priority === 'high' ? '緊急' : '一般'}
                        </Tag>
                      </div>
                    }
                    description={`時間: ${item.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 最近活動 */}
        <Col xs={24} lg={12}>
          <Card title="客戶動態">
            <List
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                    title={item.client}
                    description={`${item.action} • ${item.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
EOF

echo "✅ 儀表板頁面開發完成"
```

### 3. 設置路由系統
```bash
# 創建路由配置
cat > src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import { theme } from './styles/theme';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MainLayout } from './components/layout/MainLayout';
import { useAppSelector } from './hooks/redux';
import './styles/global.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* 其他路由將在後續添加 */}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme} locale={zhCN}>
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
}

export default App;
EOF

echo "✅ 路由系統配置完成"
```

## 🏃‍♂️ 啟動開發服務器

```bash
# 啟動開發服務器
npm run dev

# 在新終端中執行代碼檢查
npm run lint

echo "🎉 PropAgent Pro 前端開發環境已啟動！"
echo "📱 訪問: http://localhost:5173"
echo "🔑 測試登入: 任意手機號碼 + 任意密碼"
```

## 📋 後續開發任務

### 今日目標
1. ✅ 項目初始化和環境配置
2. ✅ 登入頁面開發
3. ✅ 儀表板基礎結構
4. 🔄 客戶管理頁面開發
5. 🔄 與後端 API 整合

### 明日計劃
1. 客戶詳情頁面
2. 排程管理介面
3. 物件管理功能
4. 響應式設計優化

---

**🚀 現在立即執行：複製上面的命令到 frontend 窗口開始開發！**
