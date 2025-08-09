import express from 'express';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 安全狀態監控
interface SecurityMetrics {
  rateLimitHits: number;
  blockedIPs: Set<string>;
  suspiciousActivity: Array<{
    ip: string;
    timestamp: Date;
    reason: string;
    userAgent?: string;
  }>;
  lastReset: Date;
}

class SecurityMonitor {
  private metrics: SecurityMetrics = {
    rateLimitHits: 0,
    blockedIPs: new Set(),
    suspiciousActivity: [],
    lastReset: new Date()
  };

  // 記錄速率限制觸發
  recordRateLimitHit(ip: string, userAgent?: string) {
    this.metrics.rateLimitHits++;
    this.addSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', userAgent);
  }

  // 記錄可疑活動
  addSuspiciousActivity(ip: string, reason: string, userAgent?: string) {
    this.metrics.suspiciousActivity.push({
      ip,
      timestamp: new Date(),
      reason,
      userAgent
    });

    // 保留最近 1000 條記錄
    if (this.metrics.suspiciousActivity.length > 1000) {
      this.metrics.suspiciousActivity = this.metrics.suspiciousActivity.slice(-1000);
    }

    // 檢查是否需要自動封鎖 IP
    this.checkForAutoBlock(ip);
  }

  // 檢查是否需要自動封鎖 IP
  private checkForAutoBlock(ip: string) {
    const recentActivity = this.metrics.suspiciousActivity
      .filter(activity => 
        activity.ip === ip && 
        Date.now() - activity.timestamp.getTime() < 60 * 60 * 1000 // 1 小時內
      );

    // 如果 1 小時內有超過 10 次可疑活動，自動封鎖
    if (recentActivity.length >= 10) {
      this.blockIP(ip);
      console.log(`🚫 自動封鎖 IP: ${ip} (可疑活動次數: ${recentActivity.length})`);
    }
  }

  // 封鎖 IP
  blockIP(ip: string) {
    this.metrics.blockedIPs.add(ip);
  }

  // 解除封鎖 IP
  unblockIP(ip: string) {
    this.metrics.blockedIPs.delete(ip);
  }

  // 檢查 IP 是否被封鎖
  isIPBlocked(ip: string): boolean {
    return this.metrics.blockedIPs.has(ip);
  }

  // 獲取安全統計
  getSecurityStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentActivity = this.metrics.suspiciousActivity.filter(
      activity => activity.timestamp > oneHourAgo
    );

    const dailyActivity = this.metrics.suspiciousActivity.filter(
      activity => activity.timestamp > oneDayAgo
    );

    // 按原因分組統計
    const activityByReason = recentActivity.reduce((acc, activity) => {
      acc[activity.reason] = (acc[activity.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 按 IP 分組統計
    const activityByIP = recentActivity.reduce((acc, activity) => {
      acc[activity.ip] = (acc[activity.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        totalRateLimitHits: this.metrics.rateLimitHits,
        blockedIPsCount: this.metrics.blockedIPs.size,
        recentSuspiciousActivity: recentActivity.length,
        dailySuspiciousActivity: dailyActivity.length,
        lastReset: this.metrics.lastReset
      },
      blockedIPs: Array.from(this.metrics.blockedIPs),
      activityByReason,
      activityByIP: Object.entries(activityByIP)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [ip, count]) => {
          acc[ip] = count;
          return acc;
        }, {} as Record<string, number>),
      recentActivity: recentActivity.slice(-50) // 最近 50 條記錄
    };
  }

  // 重置統計
  resetStats() {
    this.metrics = {
      rateLimitHits: 0,
      blockedIPs: new Set(),
      suspiciousActivity: [],
      lastReset: new Date()
    };
  }

  // 獲取威脅等級
  getThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const recentActivity = this.metrics.suspiciousActivity.filter(
      activity => Date.now() - activity.timestamp.getTime() < 60 * 60 * 1000
    );

    if (recentActivity.length >= 100) return 'critical';
    if (recentActivity.length >= 50) return 'high';
    if (recentActivity.length >= 20) return 'medium';
    return 'low';
  }
}

// 創建安全監控實例
export const securityMonitor = new SecurityMonitor();

// IP 封鎖中間件
export const ipBlockMiddleware = (req: Request, res: Response, next: express.NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  
  if (securityMonitor.isIPBlocked(clientIP)) {
    securityMonitor.addSuspiciousActivity(clientIP, 'BLOCKED_IP_ACCESS_ATTEMPT', req.get('User-Agent'));
    
    return res.status(403).json({
      success: false,
      message: '您的 IP 已被封鎖',
      error: 'IP_BLOCKED'
    });
  }
  
  next();
};

// 管理員速率限制
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '管理操作請求過於頻繁',
    error: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

// 路由

// 獲取安全統計
router.get('/stats', adminLimiter, (req, res) => {
  try {
    const stats = securityMonitor.getSecurityStats();
    const threatLevel = securityMonitor.getThreatLevel();
    
    res.json({
      success: true,
      data: {
        ...stats,
        threatLevel,
        systemStatus: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取安全統計失敗',
      error: 'SECURITY_STATS_ERROR'
    });
  }
});

// 封鎖 IP
router.post('/block-ip', adminLimiter, (req, res) => {
  try {
    const { ip, reason = 'Manual block' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: '請提供要封鎖的 IP 地址'
      });
    }

    securityMonitor.blockIP(ip);
    securityMonitor.addSuspiciousActivity(ip, `MANUAL_BLOCK: ${reason}`);
    
    console.log(`🚫 手動封鎖 IP: ${ip} - 原因: ${reason}`);
    
    res.json({
      success: true,
      message: `IP ${ip} 已被封鎖`,
      data: { ip, reason }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '封鎖 IP 失敗',
      error: 'BLOCK_IP_ERROR'
    });
  }
});

// 解除封鎖 IP (POST)
router.post('/unblock-ip', adminLimiter, (req, res) => {
  try {
    const { ip, reason = '手動解除封鎖' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: '請提供要解除封鎖的 IP 地址'
      });
    }

    // 檢查 IP 是否真的被封鎖
    if (!securityMonitor.isIPBlocked(ip)) {
      return res.status(400).json({
        success: false,
        message: `IP ${ip} 並未被封鎖`
      });
    }

    securityMonitor.unblockIP(ip);
    securityMonitor.addSuspiciousActivity(ip, `MANUAL_UNBLOCK: ${reason}`);
    
    console.log(`✅ 解除封鎖 IP: ${ip} - 原因: ${reason}`);
    
    res.json({
      success: true,
      message: `IP ${ip} 已解除封鎖`,
      data: { ip, reason, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '解除封鎖 IP 失敗',
      error: 'UNBLOCK_IP_ERROR'
    });
  }
});

// 解除封鎖 IP (DELETE) - 備用端點
router.delete('/unblock-ip/:ip', adminLimiter, (req, res) => {
  try {
    const { ip } = req.params;
    const { reason = '管理員解除' } = req.query;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: '請提供要解除封鎖的 IP 地址'
      });
    }

    // 檢查 IP 是否真的被封鎖
    if (!securityMonitor.isIPBlocked(ip)) {
      return res.status(400).json({
        success: false,
        message: `IP ${ip} 並未被封鎖`
      });
    }

    securityMonitor.unblockIP(ip);
    securityMonitor.addSuspiciousActivity(ip, `UNBLOCK: ${reason}`);
    
    console.log(`✅ 解除封鎖 IP: ${ip} - 原因: ${reason}`);
    
    res.json({
      success: true,
      message: `IP ${ip} 已解除封鎖`,
      data: { ip, reason, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '解除封鎖 IP 失敗',
      error: 'UNBLOCK_IP_ERROR'
    });
  }
});

// 獲取封鎖的 IP 列表
router.get('/blocked-ips', adminLimiter, (req, res) => {
  try {
    const blockedIPs = Array.from(securityMonitor['metrics'].blockedIPs);
    
    res.json({
      success: true,
      data: {
        blockedIPs,
        count: blockedIPs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取封鎖 IP 列表失敗',
      error: 'GET_BLOCKED_IPS_ERROR'
    });
  }
});

// 清除所有封鎖的 IP
router.post('/clear-blocked-ips', adminLimiter, (req, res) => {
  try {
    const count = securityMonitor['metrics'].blockedIPs.size;
    securityMonitor['metrics'].blockedIPs.clear();
    
    console.log(`🧹 清除了 ${count} 個封鎖的 IP`);
    
    res.json({
      success: true,
      message: `已清除 ${count} 個封鎖的 IP`,
      data: { clearedCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清除封鎖 IP 失敗',
      error: 'CLEAR_BLOCKED_IPS_ERROR'
    });
  }
});

// 重置安全統計
router.post('/reset-stats', adminLimiter, (req, res) => {
  try {
    securityMonitor.resetStats();
    
    console.log('📊 安全統計已重置');
    
    res.json({
      success: true,
      message: '安全統計已重置'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置統計失敗',
      error: 'RESET_STATS_ERROR'
    });
  }
});

// 獲取可疑活動日誌
router.get('/activity-log', adminLimiter, (req, res) => {
  try {
    const { limit = 100, offset = 0, ip, reason } = req.query;
    
    let activities = securityMonitor['metrics'].suspiciousActivity;
    
    // 按 IP 過濾
    if (ip) {
      activities = activities.filter(activity => activity.ip === ip);
    }
    
    // 按原因過濾
    if (reason) {
      activities = activities.filter(activity => activity.reason.includes(reason as string));
    }
    
    // 排序（最新的在前面）
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // 分頁
    const total = activities.length;
    const paginatedActivities = activities.slice(
      Number(offset), 
      Number(offset) + Number(limit)
    );
    
    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取活動日誌失敗',
      error: 'GET_ACTIVITY_LOG_ERROR'
    });
  }
});

// 安全健康檢查
router.get('/health', (req, res) => {
  try {
    const threatLevel = securityMonitor.getThreatLevel();
    const stats = securityMonitor.getSecurityStats();
    
    const healthStatus = {
      status: threatLevel === 'critical' ? 'unhealthy' : 'healthy',
      threatLevel,
      blockedIPs: stats.overview.blockedIPsCount,
      recentActivity: stats.overview.recentSuspiciousActivity,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '安全健康檢查失敗',
      error: 'SECURITY_HEALTH_CHECK_ERROR'
    });
  }
});

// 威脅情報
router.get('/threat-intelligence', adminLimiter, (req, res) => {
  try {
    const stats = securityMonitor.getSecurityStats();
    const threatLevel = securityMonitor.getThreatLevel();
    
    // 分析最常見的攻擊類型
    const topThreats = Object.entries(stats.activityByReason)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
    
    // 分析最活躍的惡意 IP
    const topMaliciousIPs = Object.entries(stats.activityByIP)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
    
    res.json({
      success: true,
      data: {
        threatLevel,
        summary: {
          totalIncidents: stats.overview.recentSuspiciousActivity,
          blockedIPs: stats.overview.blockedIPsCount,
          riskScore: calculateRiskScore(stats)
        },
        topThreats,
        topMaliciousIPs,
        recommendations: generateSecurityRecommendations(threatLevel, stats)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '獲取威脅情報失敗',
      error: 'THREAT_INTELLIGENCE_ERROR'
    });
  }
});

// 計算風險評分
function calculateRiskScore(stats: any): number {
  const recentActivity = stats.overview.recentSuspiciousActivity;
  const blockedIPs = stats.overview.blockedIPsCount;
  
  // 基礎評分 (0-100)
  let score = 0;
  
  // 基於最近活動
  if (recentActivity > 100) score += 40;
  else if (recentActivity > 50) score += 25;
  else if (recentActivity > 20) score += 10;
  
  // 基於封鎖的 IP 數量
  if (blockedIPs > 50) score += 30;
  else if (blockedIPs > 20) score += 20;
  else if (blockedIPs > 5) score += 10;
  
  // 基於活動類型多樣性
  const reasonCount = Object.keys(stats.activityByReason).length;
  if (reasonCount > 5) score += 20;
  else if (reasonCount > 3) score += 10;
  
  return Math.min(score, 100);
}

// 生成安全建議
function generateSecurityRecommendations(threatLevel: string, stats: any): string[] {
  const recommendations = [];
  
  if (threatLevel === 'critical') {
    recommendations.push('立即檢查系統安全設置');
    recommendations.push('考慮暫時啟用更嚴格的速率限制');
    recommendations.push('檢查最近的可疑活動並採取相應措施');
  }
  
  if (stats.overview.blockedIPsCount > 20) {
    recommendations.push('定期清理過期的 IP 封鎖');
    recommendations.push('檢查封鎖 IP 的地理分佈');
  }
  
  if (stats.overview.recentSuspiciousActivity > 50) {
    recommendations.push('加強監控和警報機制');
    recommendations.push('考慮實施更強的身份驗證');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('系統安全狀況良好，建議定期檢查');
  }
  
  return recommendations;
}

export default router;