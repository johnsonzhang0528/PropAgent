import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { loginSuccess } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          dispatch(loginSuccess({
            user: result.data.user,
            token: result.data.access_token,
            refreshToken: result.data.refresh_token
          }));
          
          navigate('/');
        } else {
          setError(result.error?.message || t('auth.loginError', '登入失敗'));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || errorData.message || t('auth.loginError', '登入失敗'));
      }
    } catch (err) {
      setError(t('messages.networkError', '網路連接錯誤'));
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = () => {
    setFormData({
      email: 'test@example.com',
      password: 'test123'
    });
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      {/* 語言切換器 */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      {/* 登入卡片 */}
      <div className="card w-full max-w-md">
        {/* 標題區域 */}
        <div className="card-header text-center">
          <div className="w-16 h-16 bg-primary-blue rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">PropAgent Pro</h1>
          <p className="text-secondary">{t('auth.loginSubtitle', '登入您的帳戶')}</p>
        </div>

        {/* 表單區域 */}
        <div className="card-body">
          {error && (
            <div className="mb-6 p-4 bg-error-bg border border-error/20 rounded-lg">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t('auth.email', '電子郵件')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder={t('placeholders.enterEmail', '請輸入電子郵件')}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t('auth.password', '密碼')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder={t('placeholders.enterPassword', '請輸入密碼')}
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? '登入中...' : t('auth.loginButton', '登入')}
            </button>
          </form>

          {/* 測試帳號區域 */}
          <div className="mt-6 p-4 bg-info-bg border border-info/20 rounded-lg">
            <p className="text-info text-sm mb-3">
              {t('auth.testAccount', '測試帳號')}:
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">test@example.com</p>
                <p className="text-secondary">test123</p>
              </div>
              <button
                type="button"
                onClick={fillTestAccount}
                className="btn btn-secondary btn-sm"
              >
                快速填入
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;