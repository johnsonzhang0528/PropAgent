import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  UserOutlined, 
  HomeOutlined, 
  BarChartOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { useMobile } from '../../hooks/useMobile';

const { Header, Content } = Layout;
const { Text } = Typography;

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isMobile, isSmallMobile } = useMobile();
  
  const [drawerVisible, setDrawerVisible] = useState(false);

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
      key: '/map',
      icon: <EnvironmentOutlined />,
      label: '地圖搜索'
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '分析報告'
    },
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: '文檔管理'
    },
    {
      key: '/backup',
      icon: <CloudServerOutlined />,
      label: '備份管理'
    },
    {
      key: '/security',
      icon: <SecurityScanOutlined />,
      label: '安全監控'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setDrawerVisible(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setDrawerVisible(false);
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

  // 監聽路由變化自動關閉抽屜
  useEffect(() => {
    setDrawerVisible(false);
  }, [location.pathname]);

  // 為移動端優化的標題
  const getPageTitle = () => {
    const currentMenuItem = menuItems.find(item => item.key === location.pathname);
    return currentMenuItem?.label || 'PropAgent Pro';
  };

  if (!isMobile) {
    return null; // 非移動端不渲染此組件
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移動端頂部導航 */}
      <Header 
        style={{ 
          background: '#fff', 
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          height: '56px',
          lineHeight: '56px'
        }}
      >
        {/* 左側選單按鈕 */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{
            fontSize: '18px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />

        {/* 中間標題 */}
        <Text strong style={{ 
          fontSize: isSmallMobile ? '14px' : '16px',
          flex: 1,
          textAlign: 'center',
          margin: '0 16px'
        }}>
          {getPageTitle()}
        </Text>
          
        {/* 右側用戶選單 */}
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight"
          trigger={['click']}
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar 
              icon={<UserOutlined />} 
              size={isSmallMobile ? 28 : 32}
            />
          </Space>
        </Dropdown>
      </Header>

      {/* 側邊選單抽屜 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              PropAgent Pro
            </Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
              style={{ marginRight: '-8px' }}
            />
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ 
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '16px'
        }}
        closeIcon={null}
      >
        {/* 用戶信息 */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <Space>
            <Avatar icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{user?.name || '用戶'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {user?.email || 'user@example.com'}
              </div>
            </div>
          </Space>
        </div>

        {/* 導航選單 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            height: 'calc(100vh - 140px)',
            overflowY: 'auto'
          }}
        />

        {/* 底部操作區 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          background: '#fff'
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              icon={<SettingOutlined />}
              type="text"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => {
                setDrawerVisible(false);
                // TODO: 導航到設置頁面
              }}
            >
              個人設置
            </Button>
            <Button 
              icon={<LogoutOutlined />}
              type="text"
              danger
              style={{ width: '100%', textAlign: 'left' }}
              onClick={handleLogout}
            >
              登出
            </Button>
          </Space>
        </div>
      </Drawer>

      {/* 主要內容區域 */}
      <Content 
        style={{ 
          marginTop: '56px',
          padding: isSmallMobile ? '12px' : '16px',
          minHeight: 'calc(100vh - 56px)',
          background: '#f0f2f5'
        }}
      >
        {children}
      </Content>

      {/* 遮罩層 (當抽屜打開時) */}
      {drawerVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 998
          }}
          onClick={() => setDrawerVisible(false)}
        />
      )}
    </Layout>
  );
};

export default MobileLayout;