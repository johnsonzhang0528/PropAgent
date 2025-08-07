import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Space, 
  Typography, 
  Drawer,
  Button,
  Grid
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  UserOutlined, 
  HomeOutlined, 
  BarChartOutlined,
  FileOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const screens = useBreakpoint();
  
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // 檢測是否為移動設備
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // 響應式處理
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
      setMobileDrawerVisible(false);
    } else if (isTablet) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile, isTablet]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '儀表板'
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: '客戶管理'
    },
    {
      key: '/properties',
      icon: <HomeOutlined />,
      label: '房產管理'
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '分析報告'
    },
    {
      key: '/documents',
      icon: <FileOutlined />,
      label: '文檔管理'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '個人設置'
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout
    }
  ];

  const SidebarContent = () => (
    <>
      <div style={{ 
        padding: collapsed && !isMobile ? '16px 8px' : '16px', 
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '16px'
      }}>
        {!collapsed || isMobile ? (
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            PropAgent Pro
          </Text>
        ) : (
          <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
            PP
          </Text>
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        inlineCollapsed={collapsed && !isMobile}
        style={{ border: 'none' }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端側邊欄 */}
      {!isMobile && (
        <Sider 
          width={200}
          collapsedWidth={80}
          collapsed={collapsed}
          theme="light"
          style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            zIndex: 100
          }}
          trigger={null}
        >
          <SidebarContent />
        </Sider>
      )}
      
      {/* 移動端抽屜 */}
      <Drawer
        title="導航菜單"
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        width={250}
        bodyStyle={{ padding: 0 }}
        style={{ display: isMobile ? 'block' : 'none' }}
      >
        <SidebarContent />
      </Drawer>
      
      <Layout style={{ marginLeft: 0 }}>
        <Header style={{ 
          background: '#fff', 
          padding: isMobile ? '0 16px' : '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Space align="center">
            {/* 移動端菜單按鈕 */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                style={{ fontSize: '16px' }}
              />
            )}
            
            {/* 桌面端折疊按鈕 */}
            {!isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px' }}
              />
            )}
            
            {/* 標題 - 響應式顯示 */}
            {!isMobile && (
              <Text style={{ 
                fontSize: isTablet ? '14px' : '16px', 
                fontWeight: 500,
                marginLeft: '8px'
              }}>
                房地產智能客戶管理系統
              </Text>
            )}
          </Space>
          
          {/* 用戶信息 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar 
                icon={<UserOutlined />} 
                size={isMobile ? 'small' : 'default'}
              />
              {!isMobile && (
                <Text style={{ fontSize: isMobile ? '12px' : '14px' }}>
                  {user?.name || '用戶'}
                </Text>
              )}
            </Space>
          </Dropdown>
        </Header>
        
        <Content style={{ 
          margin: 0,
          padding: isMobile ? '16px' : '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ResponsiveLayout;