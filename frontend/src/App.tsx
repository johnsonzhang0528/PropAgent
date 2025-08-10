import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { Suspense } from 'react';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import enUS from 'antd/locale/en_US';
import { useTranslation } from './hooks/useTranslation';
import { theme } from './styles/theme';
import { store } from './store';
import { useAppSelector } from './store/hooks';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomerPage from './pages/customer/CustomerPage';
import PropertyPage from './pages/property/PropertyPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import DocumentPage from './pages/document/DocumentPage';
import PropertyMapPage from './pages/PropertyMapPage';
import BackupPage from './pages/backup/BackupPage';
import SecurityPage from './pages/security/SecurityPage';
import TestPage from './pages/test/TestPage';
import TasksPage from './pages/tasks/TasksPage';
import './styles/global.css';

function AppContent() {
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);
  const { i18n } = useTranslation();
  

  // 根據當前語言設置 Ant Design locale
  const getAntdLocale = () => {
    switch (i18n.language) {
      case 'zh-CN':
        return zhCN;
      case 'zh-TW':
        return zhTW;
      case 'en':
        return enUS;
      default:
        return zhTW;
    }
  };

  return (
    <ConfigProvider theme={theme} locale={getAntdLocale()}>
      <Router>
        <div className="App">
          <Routes>
            {/* 登入頁面 */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            
            
            {/* 主應用路由 */}
            <Route 
              path="/*" 
              element={
                isAuthenticated ? (
                  <MainLayout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/customers" element={<CustomerPage />} />
                      <Route path="/properties" element={<PropertyPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/documents" element={<DocumentPage />} />
                      <Route path="/map" element={<PropertyMapPage />} />
                      <Route path="/backup" element={<BackupPage />} />
                      <Route path="/security" element={<SecurityPage />} />
                      <Route path="/test" element={<TestPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MainLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
        <AppContent />
      </Suspense>
    </Provider>
  );
}
