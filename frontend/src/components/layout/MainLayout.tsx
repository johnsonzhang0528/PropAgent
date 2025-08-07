import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { useMobile } from '../../hooks/useMobile';
import { useTranslation } from '../../hooks/useTranslation';
import MobileLayout from './MobileLayout';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isMobile } = useMobile();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  // 移動端使用專用布局
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  const menuItems = [
    {
      key: '/',
      icon: '📊',
      label: t('navigation.dashboard', '儀表板'),
      path: '/'
    },
    {
      key: '/customers',
      icon: '👥',
      label: t('navigation.customers', '客戶管理'),
      path: '/customers'
    },
    {
      key: '/properties',
      icon: '🏠',
      label: t('navigation.properties', '房產管理'),
      path: '/properties'
    },
    {
      key: '/analytics',
      icon: '📈',
      label: t('navigation.analytics', '數據分析'),
      path: '/analytics'
    },
    {
      key: '/map',
      icon: '🗺️',
      label: t('navigation.map', '房產地圖'),
      path: '/map'
    },
    {
      key: '/documents',
      icon: '📄',
      label: t('navigation.documents', '文件管理'),
      path: '/documents'
    },
    {
      key: '/backup',
      icon: '☁️',
      label: t('navigation.backup', '備份管理'),
      path: '/backup'
    },
    {
      key: '/security',
      icon: '🔒',
      label: t('navigation.security', '安全設置'),
      path: '/security'
    }
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* 側邊欄 - Glassmorphism 樣式 */}
      <div 
        style={{ 
          width: collapsed ? '80px' : '256px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.15)',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '4px 0 24px rgba(37, 99, 235, 0.15)'
        }}
      >
        {/* 側邊欄裝飾性漸層 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.05) 100%)',
          pointerEvents: 'none'
        }}></div>
        {/* Logo 區域 - 玻璃效果 */}
        <div style={{ 
          padding: 'var(--space-lg)', 
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>🏠</span>
            </div>
            {!collapsed && (
              <div style={{ marginLeft: 'var(--space-md)' }}>
                <h1 style={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '18px', 
                  margin: 0,
                  fontFamily: 'var(--font-family)'
                }}>PropAgent</h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '14px', 
                  margin: 0,
                  fontFamily: 'var(--font-family)'
                }}>Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* 導航選單 - 玻璃效果導航 */}
        <nav style={{ 
          flex: 1, 
          padding: 'var(--space-md)',
          position: 'relative',
          zIndex: 2
        }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--space-md) var(--space-md)',
                    borderRadius: '16px',
                    textAlign: 'left',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    background: currentPath === item.path 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)' 
                      : 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: currentPath === item.path 
                      ? '1px solid rgba(255,255,255,0.3)' 
                      : '1px solid rgba(255,255,255,0.1)',
                    color: currentPath === item.path ? 'white' : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    marginBottom: 'var(--space-sm)',
                    boxShadow: currentPath === item.path 
                      ? '0 6px 20px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'var(--font-family)',
                    fontWeight: currentPath === item.path ? '600' : '500',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPath !== item.path) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPath !== item.path) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                      e.currentTarget.style.transform = 'translateX(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px', minWidth: '20px' }}>{item.icon}</span>
                  {!collapsed && <span style={{ marginLeft: 'var(--space-md)', fontWeight: '500' }}>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 用戶資訊 - 玻璃效果 */}
        <div style={{ 
          padding: 'var(--space-md)', 
          borderTop: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: 'white', fontWeight: '500' }}>
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div style={{ marginLeft: 'var(--space-md)', flex: 1 }}>
                <p style={{ 
                  color: 'white', 
                  fontWeight: '500', 
                  fontSize: '14px', 
                  margin: 0,
                  fontFamily: 'var(--font-family)'
                }}>{user?.name || '用戶'}</p>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '12px', 
                  margin: 0,
                  fontFamily: 'var(--font-family)'
                }}>{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                color: 'white',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span style={{ marginRight: 'var(--space-sm)' }}>🚪</span>
              登出
            </button>
          )}
        </div>
      </div>

      {/* 主內容區域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 頂部工具欄 - Glassmorphism 樣式 */}
        <header style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.8) 100%)', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.3)', 
          padding: 'var(--space-md) var(--space-lg)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          position: 'relative',
          zIndex: 10
        }}>
          {/* 頂部工具欄裝飾線 */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.3) 50%, transparent 100%)'
          }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                padding: 'var(--space-sm)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                color: 'var(--text-primary)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '20px' }}>{collapsed ? '▶️' : '◀️'}</span>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <LanguageSwitcher />
              <button 
                style={{
                  padding: 'var(--space-sm)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '20px' }}>🔔</span>
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)',
                  color: 'white',
                  fontSize: '11px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontFamily: 'var(--font-family)',
                  boxShadow: '0 3px 8px rgba(239, 68, 68, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}>
                  3
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* 頁面內容 - 透明背景讓漸層顯示 */}
        <main style={{ 
          flex: 1, 
          overflow: 'auto',
          background: 'transparent',
          position: 'relative'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;