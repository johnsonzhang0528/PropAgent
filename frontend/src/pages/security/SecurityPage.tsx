import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Alert,
  Progress,
  Tooltip,
  Popconfirm,
  Badge,
  Divider
} from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  BugOutlined,
  LockOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { securityService, type SecurityStats, type ThreatIntelligence } from '../../services/securityService';
import MobileChart from '../../components/common/MobileCharts';
import { useMobile } from '../../hooks/useMobile';

const { Content } = Layout;
const { Title, Text } = Typography;

const SecurityPage: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { isMobile } = useMobile();

  // 載入數據
  useEffect(() => {
    loadSecurityData();
    
    // 每 30 秒自動刷新
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [statsData, threatData] = await Promise.all([
        securityService.getSecurityStats(),
        securityService.getThreatIntelligence()
      ]);
      setStats(statsData);
      setThreatIntel(threatData);
    } catch (error) {
      message.error('載入安全數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 封鎖 IP
  const handleBlockIP = async (values: { ip: string; reason: string }) => {
    try {
      await securityService.blockIP(values.ip, values.reason);
      message.success(`IP ${values.ip} 已被封鎖`);
      setBlockModalVisible(false);
      form.resetFields();
      loadSecurityData();
    } catch (error) {
      message.error('封鎖 IP 失敗');
    }
  };

  // 解除封鎖 IP
  const handleUnblockIP = async (ip: string) => {
    try {
      await securityService.unblockIP(ip);
      message.success(`IP ${ip} 已解除封鎖`);
      loadSecurityData();
    } catch (error) {
      message.error('解除封鎖失敗');
    }
  };

  // 清除所有封鎖的 IP
  const handleClearBlockedIPs = async () => {
    try {
      const result = await securityService.clearBlockedIPs();
      message.success(`已清除 ${result.clearedCount} 個封鎖的 IP`);
      loadSecurityData();
    } catch (error) {
      message.error('清除封鎖 IP 失敗');
    }
  };

  // 重置統計
  const handleResetStats = async () => {
    try {
      await securityService.resetStats();
      message.success('安全統計已重置');
      loadSecurityData();
    } catch (error) {
      message.error('重置統計失敗');
    }
  };

  // 封鎖 IP 表格列
  const blockedIPColumns = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => (
        <Space>
          <Text code>{ip}</Text>
          <Tag color="blue">{securityService.getIPRegion(ip)}</Tag>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (ip: string) => (
        <Popconfirm
          title="確定要解除封鎖這個 IP 嗎？"
          onConfirm={() => handleUnblockIP(ip)}
          okText="確定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            解除封鎖
          </Button>
        </Popconfirm>
      )
    }
  ];

  // 可疑活動表格列
  const activityColumns = [
    {
      title: '時間',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(timestamp).toLocaleString('zh-TW')}
        </Text>
      )
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <Text code>{ip}</Text>
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Tag color="red" style={{ fontSize: '11px' }}>
          {securityService.formatAttackType(reason)}
        </Tag>
      )
    }
  ];

  if (!stats || !threatIntel) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: isMobile ? '16px' : '24px' }}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <SecurityScanOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <div style={{ marginTop: '16px' }}>載入安全數據中...</div>
          </div>
        </Content>
      </Layout>
    );
  }

  const threatLevelInfo = securityService.formatThreatLevel(threatIntel.threatLevel);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: isMobile ? '16px' : '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 頁面標題 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              <SafetyCertificateOutlined /> 安全監控
            </Title>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadSecurityData}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setBlockModalVisible(true)}
              >
                封鎖 IP
              </Button>
            </Space>
          </div>

          {/* 威脅等級警報 */}
          {threatIntel.threatLevel !== 'low' && (
            <Alert
              message={`當前威脅等級: ${threatLevelInfo.text}`}
              description={`風險評分: ${threatIntel.summary.riskScore}/100 - ${threatIntel.recommendations[0]}`}
              type={threatIntel.threatLevel === 'critical' ? 'error' : 'warning'}
              showIcon
              banner
            />
          )}

          {/* 安全統計卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="威脅等級"
                  value={threatLevelInfo.text}
                  valueStyle={{ color: threatLevelInfo.color }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="風險評分"
                  value={threatIntel.summary.riskScore}
                  suffix="/100"
                  valueStyle={{ color: securityService.getRiskColor(threatIntel.summary.riskScore) }}
                  prefix={<BugOutlined />}
                />
                <Progress 
                  percent={threatIntel.summary.riskScore} 
                  strokeColor={securityService.getRiskColor(threatIntel.summary.riskScore)}
                  size="small"
                  style={{ marginTop: '8px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="封鎖 IP 數量"
                  value={stats.overview.blockedIPsCount}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<LockOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="今日威脅事件"
                  value={stats.overview.dailySuspiciousActivity}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<EyeOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 系統狀態 */}
          <Card title="系統狀態" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="運行時間"
                  value={securityService.formatUptime(stats.systemStatus.uptime)}
                  prefix={<SafetyOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="記憶體使用"
                  value={securityService.formatMemoryUsage(stats.systemStatus.memory.heapUsed)}
                  suffix={`/ ${securityService.formatMemoryUsage(stats.systemStatus.memory.heapTotal)}`}
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="速率限制觸發"
                  value={stats.overview.totalRateLimitHits}
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 威脅分析 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="主要威脅類型" size="small">
                {threatIntel.topThreats.length > 0 ? (
                  <MobileChart
                    data={threatIntel.topThreats.map(threat => ({
                      name: securityService.formatAttackType(threat.reason),
                      value: threat.count
                    }))}
                    type="pie"
                    height={250}
                    showLegend={true}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <SafetyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>暫無威脅數據</div>
                  </div>
                )}
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="活躍惡意 IP" size="small">
                {threatIntel.topMaliciousIPs.length > 0 ? (
                  <MobileChart
                    data={threatIntel.topMaliciousIPs.map(ip => ({
                      name: ip.ip,
                      value: ip.count
                    }))}
                    type="bar"
                    height={250}
                    showLegend={false}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>暫無惡意 IP</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* 封鎖的 IP 列表 */}
          <Card 
            title={
              <Space>
                封鎖的 IP 地址
                <Badge count={stats.blockedIPs.length} style={{ backgroundColor: '#f5222d' }} />
              </Space>
            }
            extra={
              stats.blockedIPs.length > 0 && (
                <Popconfirm
                  title="確定要清除所有封鎖的 IP 嗎？"
                  onConfirm={handleClearBlockedIPs}
                  okText="確定"
                  cancelText="取消"
                >
                  <Button size="small" danger>
                    清除全部
                  </Button>
                </Popconfirm>
              )
            }
          >
            <Table
              columns={blockedIPColumns}
              dataSource={stats.blockedIPs.map(ip => ({ ip }))}
              rowKey="ip"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 個封鎖的 IP`
              }}
              locale={{
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <SafetyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>暫無封鎖的 IP</div>
                  </div>
                )
              }}
            />
          </Card>

          {/* 最近可疑活動 */}
          <Card 
            title="最近可疑活動"
            extra={
              <Button 
                size="small"
                onClick={() => setActivityModalVisible(true)}
              >
                查看全部
              </Button>
            }
          >
            <Table
              columns={activityColumns}
              dataSource={stats.recentActivity.slice(0, 10)}
              rowKey={(record, index) => `${record.ip}-${index}`}
              size="small"
              pagination={false}
              locale={{
                emptyText: (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <SafetyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px' }}>暫無可疑活動</div>
                  </div>
                )
              }}
            />
          </Card>

          {/* 安全建議 */}
          <Card title="安全建議">
            <Space direction="vertical" style={{ width: '100%' }}>
              {threatIntel.recommendations.map((recommendation, index) => (
                <Alert
                  key={index}
                  message={recommendation}
                  type="info"
                  showIcon
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </Space>
          </Card>

          {/* 操作按鈕 */}
          <Card>
            <Space wrap>
              <Popconfirm
                title="確定要重置所有安全統計嗎？"
                onConfirm={handleResetStats}
                okText="確定"
                cancelText="取消"
              >
                <Button icon={<DeleteOutlined />} danger>
                  重置統計
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        </Space>

        {/* 封鎖 IP 對話框 */}
        <Modal
          title="封鎖 IP 地址"
          open={blockModalVisible}
          onCancel={() => setBlockModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleBlockIP}
          >
            <Form.Item
              name="ip"
              label="IP 地址"
              rules={[
                { required: true, message: '請輸入 IP 地址' },
                { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '請輸入有效的 IP 地址' }
              ]}
            >
              <Input placeholder="例如: 192.168.1.100" />
            </Form.Item>
            
            <Form.Item
              name="reason"
              label="封鎖原因"
              rules={[{ required: true, message: '請輸入封鎖原因' }]}
            >
              <Input.TextArea 
                placeholder="請描述封鎖此 IP 的原因..."
                rows={3}
              />
            </Form.Item>
            
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setBlockModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" danger>
                封鎖 IP
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* 活動詳情對話框 */}
        <Modal
          title="可疑活動詳情"
          open={activityModalVisible}
          onCancel={() => setActivityModalVisible(false)}
          width={800}
          footer={null}
        >
          <Table
            columns={[
              ...activityColumns,
              {
                title: '用戶代理',
                dataIndex: 'userAgent',
                key: 'userAgent',
                render: (userAgent: string) => (
                  <Tooltip title={userAgent}>
                    <Text ellipsis style={{ maxWidth: '200px' }}>
                      {userAgent || '未知'}
                    </Text>
                  </Tooltip>
                )
              }
            ]}
            dataSource={stats.recentActivity}
            rowKey={(record, index) => `${record.ip}-${index}`}
            size="small"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 條記錄`
            }}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default SecurityPage;