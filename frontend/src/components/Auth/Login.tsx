import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Tabs, Checkbox, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { loginUser, sendSmsCode, loginWithSms } from '../../store/slices/authSlice';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

interface SmsLoginFormData {
  phone: string;
  smsCode: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      await dispatch(loginUser(values)).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '登錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const onSmsFinish = async (values: SmsLoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      await dispatch(loginWithSms(values)).unwrap();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '手機驗證登錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const sendSms = async (phone: string) => {
    setSmsLoading(true);
    setError(null);
    
    try {
      await dispatch(sendSmsCode({ phone })).unwrap();
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || '發送驗證碼失敗');
    } finally {
      setSmsLoading(false);
    }
  };

  const emailLoginForm = (
    <Form
      name="login"
      onFinish={onFinish}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '請輸入郵箱地址' },
          { type: 'email', message: '請輸入有效的郵箱地址' }
        ]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#10b981' }} />}
          placeholder="郵箱地址"
          style={{
            borderRadius: 12,
            height: 48,
            border: '2px solid #d1fae5',
            fontSize: '16px',
            fontWeight: 500
          }}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '請輸入密碼' },
          { min: 6, message: '密碼至少6位' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#10b981' }} />}
          placeholder="密碼"
          style={{
            borderRadius: 12,
            height: 48,
            border: '2px solid #d1fae5',
            fontSize: '16px',
            fontWeight: 500
          }}
        />
      </Form.Item>

      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>記住登錄狀態</Checkbox>
        </Form.Item>
        <a style={{ float: 'right' }} href="/forgot-password">
          忘記密碼？
        </a>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          style={{
            height: 52,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)'
          }}
        >
          登錄
        </Button>
      </Form.Item>
    </Form>
  );

  const smsLoginForm = (
    <Form
      name="sms-login"
      onFinish={onSmsFinish}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="phone"
        rules={[
          { required: true, message: '請輸入手機號碼' },
          { pattern: /^09\d{8}$/, message: '請輸入有效的台灣手機號碼' }
        ]}
      >
        <Input
          prefix={<MobileOutlined style={{ color: '#10b981' }} />}
          placeholder="手機號碼"
          style={{
            borderRadius: 12,
            height: 48,
            border: '2px solid #d1fae5',
            fontSize: '16px',
            fontWeight: 500
          }}
        />
      </Form.Item>

      <Form.Item>
        <Input.Group compact>
          <Form.Item
            name="smsCode"
            noStyle
            rules={[
              { required: true, message: '請輸入驗證碼' },
              { len: 6, message: '驗證碼為6位數字' }
            ]}
          >
            <Input
              style={{ 
                width: '60%',
                borderRadius: '12px 0 0 12px',
                height: 48,
                border: '2px solid #d1fae5',
                fontSize: '16px',
                fontWeight: 500
              }}
              prefix={<MessageOutlined style={{ color: '#10b981' }} />}
              placeholder="驗證碼"
            />
          </Form.Item>
          <Button
            style={{ 
              width: '40%',
              height: 48,
              borderRadius: '0 12px 12px 0',
              background: countdown > 0 || smsLoading ? '#f3f4f6' : 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
              border: '2px solid #d1fae5',
              fontSize: '14px',
              fontWeight: 600,
              color: countdown > 0 || smsLoading ? '#6b7280' : 'white'
            }}
            disabled={countdown > 0 || smsLoading}
            loading={smsLoading}
            onClick={() => {
              const form = document.forms.namedItem('sms-login') as HTMLFormElement;
              const formData = new FormData(form);
              const phone = formData.get('phone') as string;
              if (phone && /^09\d{8}$/.test(phone)) {
                sendSms(phone);
              }
            }}
          >
            {countdown > 0 ? `${countdown}秒後重新發送` : '發送驗證碼'}
          </Button>
        </Input.Group>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          style={{
            height: 52,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)'
          }}
        >
          手機驗證登錄
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="login-container">
      <Card className="login-card" style={{
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 8px 25px rgba(16, 185, 129, 0.1)',
        border: 'none',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          {/* Logo 和標題區域 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '20px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)'
            }}>
              🏠
            </div>
            <Title level={2} style={{
              color: '#064e3b',
              marginBottom: 8,
              fontWeight: 700,
              fontSize: '28px',
              background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              PropAgent Pro 登錄
            </Title>
            <Text style={{
              color: '#4b5563',
              fontSize: '14px',
              fontWeight: 400
            }}>
              專業房地產 CRM 管理系統
            </Text>
          </div>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ 
                marginBottom: 24,
                borderRadius: 12,
                border: '1px solid #fecaca'
              }}
              onClose={() => setError(null)}
            />
          )}
          
          <Tabs
            defaultActiveKey="email"
            centered
            style={{ width: '100%' }}
            items={[
              {
                key: 'email',
                label: <span style={{ fontWeight: 500 }}>📧 郵箱登錄</span>,
                children: emailLoginForm,
              },
              {
                key: 'sms',
                label: <span style={{ fontWeight: 500 }}>📱 手機驗證</span>,
                children: smsLoginForm,
              },
            ]}
          />
          
          <div className="login-footer">
            <Text style={{ color: '#059669', fontWeight: 600 }}>
              還沒有帳號？<a href="/register" style={{ color: '#10b981', fontWeight: 700 }}>立即註冊</a>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
