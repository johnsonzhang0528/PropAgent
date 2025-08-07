import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 直接定义翻译资源，避免JSON导入问题
const resources = {
  'zh-TW': {
    translation: {
      "common": {
        "appName": "PropAgent Pro",
        "appSubtitle": "歡迎使用 PropAgent Pro 企業級房地產管理系統",
        "welcome": "歡迎",
        "login": "登入",
        "logout": "登出",
        "testUser": "測試用戶",
        "testEmail": "test@example.com"
      },
      "navigation": {
        "dashboard": "儀表板",
        "customers": "客戶管理",
        "properties": "房產管理",
        "map": "地圖搜尋",
        "analytics": "分析報告",
        "documents": "文檔管理",
        "backup": "備份管理",
        "security": "安全監控",
        "profile": "個人檔案"
      },
      "auth": {
        "loginTitle": "登入 PropAgent Pro",
        "loginSubtitle": "歡迎回來！請登入您的帳戶",
        "email": "電子郵件",
        "password": "密碼",
        "rememberMe": "記住我",
        "forgotPassword": "忘記密碼？",
        "loginButton": "登入",
        "registerLink": "還沒有帳戶？立即註冊",
        "loginError": "登入失敗",
        "emailRequired": "請輸入郵箱!",
        "passwordRequired": "請輸入密碼!",
        "emailInvalid": "請輸入有效的郵箱格式!",
        "testAccount": "測試帳號資訊"
      },
      "dashboard": {
        "title": "儀表板",
        "welcome": "歡迎，{{name}}！",
        "totalCustomers": "總客戶數",
        "totalProperties": "總房產數",
        "totalRevenue": "總營收",
        "totalDeals": "成交數"
      },
      "messages": {
        "networkError": "網絡錯誤，請檢查後端服務是否啟動"
      },
      "placeholders": {
        "enterEmail": "請輸入電子郵件",
        "enterPassword": "請輸入密碼"
      }
    }
  },
  'zh-CN': {
    translation: {
      "common": {
        "appName": "PropAgent Pro",
        "appSubtitle": "欢迎使用 PropAgent Pro 企业级房地产管理系统",
        "welcome": "欢迎",
        "login": "登录",
        "logout": "退出",
        "testUser": "测试用户",
        "testEmail": "test@example.com"
      },
      "navigation": {
        "dashboard": "仪表板",
        "customers": "客户管理",
        "properties": "房产管理",
        "analytics": "分析报告",
        "map": "房产地图",
        "documents": "文档管理",
        "backup": "备份管理",
        "security": "安全监控",
        "profile": "个人档案"
      },
      "auth": {
        "loginTitle": "登录 PropAgent Pro",
        "loginSubtitle": "欢迎回来！请登录您的账户",
        "email": "电子邮箱",
        "password": "密码",
        "rememberMe": "记住我",
        "forgotPassword": "忘记密码？",
        "loginButton": "登录",
        "registerLink": "还没有账户？立即注册",
        "loginError": "登录失败", 
        "emailRequired": "请输入邮箱!",
        "passwordRequired": "请输入密码!",
        "emailInvalid": "请输入有效的邮箱格式!",
        "testAccount": "测试账号信息"
      },
      "dashboard": {
        "title": "仪表板",
        "welcome": "欢迎，{{name}}！",
        "totalCustomers": "客户总数",
        "totalProperties": "房产总数",
        "totalRevenue": "总营收",
        "totalDeals": "成交数"
      },
      "messages": {
        "networkError": "网络错误，请检查后端服务是否启动"
      },
      "placeholders": {
        "enterEmail": "请输入电子邮箱",
        "enterPassword": "请输入密码"
      }
    }
  },
  'en': {
    translation: {
      "common": {
        "appName": "PropAgent Pro",
        "appSubtitle": "Welcome to PropAgent Pro Enterprise Real Estate Management System",
        "welcome": "Welcome",
        "login": "Login",
        "logout": "Logout",
        "testUser": "Test User",
        "testEmail": "test@example.com"
      },
      "navigation": {
        "dashboard": "Dashboard",
        "customers": "Customer Management",
        "properties": "Property Management",
        "analytics": "Analytics",
        "map": "Property Map",
        "documents": "Document Management",
        "backup": "Backup Management",
        "security": "Security Monitoring",
        "profile": "Profile"
      },
      "auth": {
        "loginTitle": "Login to PropAgent Pro",
        "loginSubtitle": "Welcome back! Please login to your account",
        "email": "Email",
        "password": "Password",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot password?",
        "loginButton": "Login",
        "registerLink": "Don't have an account? Register now",
        "loginError": "Login failed",
        "emailRequired": "Please enter your email!",
        "passwordRequired": "Please enter your password!",
        "emailInvalid": "Please enter a valid email format!",
        "testAccount": "Test Account Info"
      },
      "dashboard": {
        "title": "Dashboard",
        "welcome": "Welcome, {{name}}!",
        "totalCustomers": "Total Customers",
        "totalProperties": "Total Properties",
        "totalRevenue": "Total Revenue",
        "totalDeals": "Total Deals"
      },
      "messages": {
        "networkError": "Network error, please check if backend service is running"
      },
      "placeholders": {
        "enterEmail": "Enter your email",
        "enterPassword": "Enter your password"
      }
    }
  }
};

console.log('Hardcoded i18n resources:', resources);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-TW',
    fallbackLng: 'zh-TW',
    debug: true,
    
    interpolation: {
      escapeValue: false
    },
    
    ns: ['translation'],
    defaultNS: 'translation'
  });

console.log('Hardcoded i18n initialization completed');

export default i18n;
