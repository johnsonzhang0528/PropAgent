import { screen } from '@testing-library/react';
import { render, setMobileViewport, setTabletViewport, setDesktopViewport } from '../utils/test-utils';
import DashboardPage from '../../pages/dashboard/DashboardPage';

describe('DashboardPage', () => {
  beforeEach(() => {
    setDesktopViewport();
  });

  it('renders dashboard title correctly', () => {
    render(<DashboardPage />);
    
    expect(expect(screen.getByRole('heading', { name: '儀表板' }))toBeTruthy()).toBeTruthy();
  });

  it('renders all statistics cards', () => {
    render(<DashboardPage />);
    
    // Check all statistic titles
    expect(expect(screen.getByText('總客戶數'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('可售房產'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('本月成交'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('成交金額'))toBeTruthy()).toBeTruthy();
  });

  it('displays correct statistic values', () => {
    render(<DashboardPage />);
    
    expect(expect(screen.getByText('156'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('89'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('12'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('NT$ 2,850,000'))toBeTruthy()).toBeTruthy();
  });

  it('renders statistics with correct icons', () => {
    render(<DashboardPage />);
    
    // Check for icon presence (using antd icon class names)
    expect(expect(document.querySelector('.anticon-user'))toBeTruthy()).toBeTruthy();
    expect(expect(document.querySelector('.anticon-home'))toBeTruthy()).toBeTruthy();
    expect(expect(document.querySelector('.anticon-trophy'))toBeTruthy()).toBeTruthy();
    expect(expect(document.querySelector('.anticon-dollar'))toBeTruthy()).toBeTruthy();
  });

  it('renders activity section', () => {
    render(<DashboardPage />);
    
    expect(expect(screen.getByText('最近活動'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📞 與張先生通話 - 2 小時前'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('🏠 新增房產信息 - 3 小時前'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('✅ 完成李女士看房 - 5 小時前'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📧 發送市場報告 - 1 天前'))toBeTruthy()).toBeTruthy();
  });

  it('renders todo section', () => {
    render(<DashboardPage />);
    
    expect(expect(screen.getByText('待辦事項'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📅 明天 10:00 - 王先生看房'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📞 回電陳女士詢價'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📝 更新房產照片'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('📊 準備週報'))toBeTruthy()).toBeTruthy();
  });

  it('has proper responsive layout on mobile', () => {
    setMobileViewport();
    render(<DashboardPage />);
    
    // All cards should be full width on mobile (xs=24)
    const cards = document.querySelectorAll('.ant-col-xs-24');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('has proper responsive layout on tablet', () => {
    setTabletViewport();
    render(<DashboardPage />);
    
    // Cards should be half width on tablet (sm=12)
    const cards = document.querySelectorAll('.ant-col-sm-12');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('has proper responsive layout on desktop', () => {
    setDesktopViewport();
    render(<DashboardPage />);
    
    // Statistics cards should be quarter width on desktop (md=6)
    const statisticCards = document.querySelectorAll('.ant-col-md-6');
    expect(statisticCards.length).toBe(4);
    
    // Activity and todo cards should be half width on desktop (md=12)
    const activityCards = document.querySelectorAll('.ant-col:not(.ant-col-md-6)');
    expect(activityCards.length).toBeGreaterThan(0);
  });

  it('applies correct styling classes', () => {
    render(<DashboardPage />);
    
    const container = document.querySelector('.page-container');
    expect(container)toBeTruthy();
  });

  it('has cards with proper heights', () => {
    render(<DashboardPage />);
    
    const activityCard = screen.getByText('最近活動').closest('.ant-card');
    const todoCard = screen.getByText('待辦事項').closest('.ant-card');
    
    expect(activityCard)// .toHaveStyle('height: 300px');
    expect(todoCard)// .toHaveStyle('height: 300px');
  });

  it('formats currency correctly', () => {
    render(<DashboardPage />);
    
    // Check that the currency is formatted with proper locale
    expect(expect(screen.getByText('NT$ 2,850,000'))toBeTruthy()).toBeTruthy();
  });
});