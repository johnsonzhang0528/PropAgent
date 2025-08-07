import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardStats {
  totalCustomers: number;
  totalProperties: number;
  totalRevenue: number;
  totalDeals: number;
  monthlyGrowth: number;
  activeListings: number;
  avgDealValue: number;
  conversionRate: number;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    totalDeals: 0,
    monthlyGrowth: 0,
    activeListings: 0,
    avgDealValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // 模擬API調用
    setStats({
      totalCustomers: 156,
      totalProperties: 89,
      totalRevenue: 2580000,
      totalDeals: 23,
      monthlyGrowth: 12.5,
      activeListings: 34,
      avgDealValue: 1120000,
      conversionRate: 26.5
    });
  }, []);

  const recentDeals = [
    { key: 1, customer: '張先生', property: '信義區豪宅', amount: 15000000, date: '2025-08-01', status: 'completed', type: 'sale' },
    { key: 2, customer: '李小姐', property: '松山區公寓', amount: 8500000, date: '2025-08-02', status: 'completed', type: 'rent' },
    { key: 3, customer: '王總', property: '大安區店面', amount: 25000000, date: '2025-08-03', status: 'pending', type: 'sale' },
    { key: 4, customer: '陳總監', property: '內湖科技園區辦公室', amount: 18000000, date: '2025-08-04', status: 'completed', type: 'rent' },
    { key: 5, customer: '林董事長', property: '南港豪華住宅', amount: 32000000, date: '2025-08-04', status: 'negotiating', type: 'sale' }
  ];

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { className: 'badge-success', text: '已完成' },
      pending: { className: 'badge-warning', text: '待處理' },
      negotiating: { className: 'badge-info', text: '協商中' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { className: 'badge-info', text: status };
    return <span className={`badge ${config.className}`}>{config.text}</span>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className={`badge ${type === 'sale' ? 'badge-success' : 'badge-info'}`}>
        {type === 'sale' ? '買賣' : '租賃'}
      </span>
    );
  };

  return (
    <div className="container mt-8">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">{t('dashboard.title', '儀表板')}</h1>
        <p className="text-secondary">歡迎回到 PropAgent Pro 管理後台</p>
      </div>

      {/* 統計卡片網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-number">{stats.totalCustomers}</div>
          <div className="stat-label">{t('dashboard.totalCustomers', '總客戶數')}</div>
          <div className="stat-change positive">+{stats.monthlyGrowth}%</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.totalProperties}</div>
          <div className="stat-label">{t('dashboard.totalProperties', '總房產數')}</div>
          <div className="stat-change positive">活躍 {stats.activeListings}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-label">{t('dashboard.totalRevenue', '總營收')}</div>
          <div className="stat-change positive">平均 {formatCurrency(stats.avgDealValue)}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.totalDeals}</div>
          <div className="stat-label">{t('dashboard.totalDeals', '成交數')}</div>
          <div className="stat-change positive">轉換率 {stats.conversionRate}%</div>
        </div>
      </div>

      {/* 最近交易表格 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary">
              {t('dashboard.recentDeals', '最近成交記錄')}
            </h2>
            <a href="/deals" className="text-sm font-medium text-primary-blue transition cursor-pointer">
              查看全部 →
            </a>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>客戶</th>
                  <th>房產</th>
                  <th>類型</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                {recentDeals.map((deal) => (
                  <tr key={deal.key}>
                    <td className="font-medium">{deal.customer}</td>
                    <td className="text-secondary">{deal.property}</td>
                    <td>{getTypeBadge(deal.type)}</td>
                    <td className="font-semibold text-primary">{formatCurrency(deal.amount)}</td>
                    <td>{getStatusBadge(deal.status)}</td>
                    <td className="text-secondary">{deal.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;