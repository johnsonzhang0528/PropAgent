import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SecurityStats {
  overview: {
    totalRateLimitHits: number;
    blockedIPsCount: number;
    recentSuspiciousActivity: number;
    dailySuspiciousActivity: number;
    lastReset: Date;
  };
  blockedIPs: string[];
  activityByReason: Record<string, number>;
  activityByIP: Record<string, number>;
  recentActivity: Array<{
    ip: string;
    timestamp: Date;
    reason: string;
    userAgent?: string;
  }>;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  systemStatus: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    timestamp: string;
  };
}

export interface ThreatIntelligence {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: {
    totalIncidents: number;
    blockedIPs: number;
    riskScore: number;
  };
  topThreats: Array<{
    reason: string;
    count: number;
  }>;
  topMaliciousIPs: Array<{
    ip: string;
    count: number;
  }>;
  recommendations: string[];
}

export interface SecurityActivity {
  ip: string;
  timestamp: Date;
  reason: string;
  userAgent?: string;
}

export interface ActivityLogResponse {
  activities: SecurityActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class SecurityService {
  private apiUrl = `${API_BASE_URL}/api/security`;

  // 獲取安全統計
  async getSecurityStats(): Promise<SecurityStats> {
    try {
      const response = await axios.get(`${this.apiUrl}/stats`);
      return {
        ...response.data.data,
        overview: {
          ...response.data.data.overview,
          lastReset: new Date(response.data.data.overview.lastReset)
        },
        recentActivity: response.data.data.recentActivity.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };
    } catch (error) {
      console.error('獲取安全統計失敗:', error);
      throw new Error('獲取安全統計失敗');
    }
  }

  // 封鎖 IP
  async blockIP(ip: string, reason: string = '手動封鎖'): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/block-ip`, { ip, reason });
    } catch (error) {
      console.error('封鎖 IP 失敗:', error);
      throw new Error('封鎖 IP 失敗');
    }
  }

  // 解除封鎖 IP (POST 方法，支援原因說明)
  async unblockIP(ip: string, reason?: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/unblock-ip`, { ip, reason });
    } catch (error) {
      console.error('解除封鎖 IP 失敗:', error);
      throw new Error('解除封鎖 IP 失敗');
    }
  }


  // 獲取封鎖的 IP 列表
  async getBlockedIPs(): Promise<{ blockedIPs: string[]; count: number }> {
    try {
      const response = await axios.get(`${this.apiUrl}/blocked-ips`);
      return response.data.data;
    } catch (error) {
      console.error('獲取封鎖 IP 列表失敗:', error);
      throw new Error('獲取封鎖 IP 列表失敗');
    }
  }

  // 清除所有封鎖的 IP
  async clearBlockedIPs(): Promise<{ clearedCount: number }> {
    try {
      const response = await axios.post(`${this.apiUrl}/clear-blocked-ips`);
      return response.data.data;
    } catch (error) {
      console.error('清除封鎖 IP 失敗:', error);
      throw new Error('清除封鎖 IP 失敗');
    }
  }

  // 重置安全統計
  async resetStats(): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/reset-stats`);
    } catch (error) {
      console.error('重置統計失敗:', error);
      throw new Error('重置統計失敗');
    }
  }

  // 獲取可疑活動日誌
  async getActivityLog(params: {
    limit?: number;
    offset?: number;
    ip?: string;
    reason?: string;
  } = {}): Promise<ActivityLogResponse> {
    try {
      const response = await axios.get(`${this.apiUrl}/activity-log`, { params });
      return {
        ...response.data.data,
        activities: response.data.data.activities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      };
    } catch (error) {
      console.error('獲取活動日誌失敗:', error);
      throw new Error('獲取活動日誌失敗');
    }
  }

  // 安全健康檢查
  async getSecurityHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    blockedIPs: number;
    recentActivity: number;
    timestamp: string;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/health`);
      return response.data.data;
    } catch (error) {
      console.error('安全健康檢查失敗:', error);
      throw new Error('安全健康檢查失敗');
    }
  }

  // 獲取威脅情報
  async getThreatIntelligence(): Promise<ThreatIntelligence> {
    try {
      const response = await axios.get(`${this.apiUrl}/threat-intelligence`);
      return response.data.data;
    } catch (error) {
      console.error('獲取威脅情報失敗:', error);
      throw new Error('獲取威脅情報失敗');
    }
  }

  // 格式化威脅等級
  formatThreatLevel(level: string): { text: string; color: string } {
    const levels = {
      low: { text: '低風險', color: '#52c41a' },
      medium: { text: '中等風險', color: '#faad14' },
      high: { text: '高風險', color: '#fa8c16' },
      critical: { text: '嚴重威脅', color: '#f5222d' }
    };
    return levels[level as keyof typeof levels] || { text: '未知', color: '#d9d9d9' };
  }

  // 格式化攻擊類型
  formatAttackType(reason: string): string {
    const reasonMap: Record<string, string> = {
      'RATE_LIMIT_EXCEEDED': '速率限制超出',
      'LOGIN_RATE_LIMIT_EXCEEDED': '登入嘗試過頻',
      'REGISTER_RATE_LIMIT_EXCEEDED': '註冊嘗試過頻',
      'PASSWORD_RESET_RATE_LIMIT_EXCEEDED': '密碼重置過頻',
      'UPLOAD_RATE_LIMIT_EXCEEDED': '文件上傳過頻',
      'SEARCH_RATE_LIMIT_EXCEEDED': '搜索請求過頻',
      'BACKUP_RATE_LIMIT_EXCEEDED': '備份操作過頻',
      'BLOCKED_IP_ACCESS_ATTEMPT': '已封鎖 IP 嘗試存取',
      'IP_NOT_ALLOWED': 'IP 不在白名單',
      'INVALID_API_KEY': 'API 金鑰無效',
      'USER_AGENT_BLOCKED': '用戶代理被封鎖',
      'REQUEST_TOO_LARGE': '請求數據過大',
      'MANUAL_BLOCK': '手動封鎖',
      'AUTO_BLOCK': '自動封鎖',
      'MANUAL_UNBLOCK': '手動解除封鎖',
      'DELETE_UNBLOCK': '管理員刪除封鎖'
    };
    
    // 處理包含前綴的原因
    for (const [key, value] of Object.entries(reasonMap)) {
      if (reason.includes(key)) {
        return value;
      }
    }
    
    return reason;
  }

  // 獲取風險等級顏色
  getRiskColor(score: number): string {
    if (score >= 80) return '#f5222d'; // 紅色
    if (score >= 60) return '#fa8c16'; // 橙色
    if (score >= 40) return '#faad14'; // 黃色
    if (score >= 20) return '#1890ff'; // 藍色
    return '#52c41a'; // 綠色
  }

  // 格式化記憶體使用量
  formatMemoryUsage(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 格式化運行時間
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} 天 ${hours} 小時 ${minutes} 分鐘`;
    } else if (hours > 0) {
      return `${hours} 小時 ${minutes} 分鐘`;
    } else {
      return `${minutes} 分鐘`;
    }
  }

  // 獲取 IP 地理位置信息（簡單的區域判斷）
  getIPRegion(ip: string): string {
    // 這裡可以集成真實的 IP 地理位置服務
    // 目前只是簡單的示例
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return '本地網路';
    }
    if (ip.startsWith('203.') || ip.startsWith('61.')) {
      return '台灣';
    }
    if (ip.startsWith('114.') || ip.startsWith('222.')) {
      return '中國大陸';
    }
    return '未知地區';
  }

  // 計算威脅趨勢
  calculateThreatTrend(activities: SecurityActivity[]): Array<{
    time: string;
    count: number;
  }> {
    // 按小時分組活動
    const hourlyActivity = activities.reduce((acc, activity) => {
      const hour = new Date(activity.timestamp).toISOString().slice(0, 13);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 轉換為圖表數據
    return Object.entries(hourlyActivity)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({
        time: new Date(hour + ':00:00').toLocaleString('zh-TW', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric'
        }),
        count
      }));
  }
}

export const securityService = new SecurityService();
export default securityService;