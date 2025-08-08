# PropAgent Pro - 生產部署指南

## 📋 部署清單檢查

### ✅ 已完成項目
- [x] Git 倉庫推送成功 (299 files, 115,361 lines)
- [x] GitHub 倉庫可正常訪問: https://github.com/johnsonzhang0528/PropAgent.git
- [x] README.md 文檔完整
- [x] 資料庫遷移腳本準備完成 (8 files, 1,499 lines)
- [x] .gitignore 配置正確 (排除大型檔案)

### ⚠️ 待確認項目
- [ ] 伺服器環境準備
- [ ] 域名 DNS 配置
- [ ] SSL 憑證安裝
- [ ] 環境變數配置
- [ ] MongoDB 生產實例

## 🚀 生產部署步驟

### 1. 伺服器環境準備

```bash
# 系統依賴安裝
sudo apt update
sudo apt install -y nodejs npm mongodb nginx

# Node.js 版本確認 (需要 >= 18.0)
node --version
npm --version

# MongoDB 服務啟動
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. 專案部署

```bash
# 1. 克隆專案
git clone https://github.com/johnsonzhang0528/PropAgent.git
cd PropAgent

# 2. 後端部署
cd backend
npm install --production
npm run build

# 3. 前端部署
cd ../frontend
npm install --production
npm run build
```

### 3. 資料庫初始化

```bash
# 執行資料庫遷移
cd backend/migrations
export MONGODB_URI="mongodb://localhost:27017/propagent_prod"

# 預覽遷移
node migrate.js --dry-run

# 執行遷移
node migrate.js
```

### 4. 環境變數配置

#### 後端 (.env)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/propagent_prod
JWT_SECRET=your_super_secure_jwt_secret_here
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://yourdomain.com
```

#### 前端 (.env)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_UPLOAD_URL=https://api.yourdomain.com/api/upload
```

### 5. 反向代理設置 (Nginx)

```nginx
# /etc/nginx/sites-available/propagent
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # 前端靜態檔案
    location / {
        root /var/www/PropAgent/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 後端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 檔案上傳
    location /uploads {
        alias /var/www/uploads;
        expires 30d;
    }
}
```

### 6. 進程管理 (PM2)

```bash
# 安裝 PM2
npm install -g pm2

# 啟動後端服務
cd backend
pm2 start npm --name "propagent-api" -- run start

# 設置自啟動
pm2 startup
pm2 save
```

## 🔒 安全配置

### 1. 防火牆設置
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000  # 不對外開放後端端口
sudo ufw deny 27017  # 不對外開放 MongoDB 端口
```

### 2. MongoDB 安全
```bash
# 創建管理用戶
mongosh admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

# 創建應用用戶
use propagent_prod
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: ["readWrite"]
})
```

### 3. 日誌監控
```bash
# Nginx 日誌
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2 日誌
pm2 logs propagent-api

# MongoDB 日誌
tail -f /var/log/mongodb/mongod.log
```

## 📊 性能監控

### 1. 系統監控指標
- CPU 使用率 < 70%
- 記憶體使用率 < 80%
- 磁盤使用率 < 85%
- 網路延遲 < 100ms

### 2. 應用監控指標
- API 回應時間 < 500ms
- 資料庫查詢時間 < 200ms
- 檔案上傳速度 > 1MB/s
- 錯誤率 < 1%

### 3. 健康檢查端點
```bash
# API 健康檢查
curl https://api.yourdomain.com/health

# 資料庫連線檢查
curl https://api.yourdomain.com/api/ping
```

## 🔄 備份策略

### 1. 資料庫備份
```bash
#!/bin/bash
# 每日自動備份腳本
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --db propagent_prod --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# 保留最近 30 天備份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 2. 檔案備份
```bash
# 上傳檔案備份
rsync -av /var/www/uploads/ /var/backups/uploads/

# 配置檔案備份
cp /etc/nginx/sites-available/propagent /var/backups/config/
cp backend/.env /var/backups/config/backend.env
cp frontend/.env /var/backups/config/frontend.env
```

## 🚨 故障排除

### 常見問題 1: 服務無法啟動
```bash
# 檢查端口占用
netstat -tulpn | grep :3000

# 檢查進程狀態
pm2 status
pm2 logs propagent-api

# 重啟服務
pm2 restart propagent-api
```

### 常見問題 2: 資料庫連接失敗
```bash
# 檢查 MongoDB 服務
sudo systemctl status mongodb

# 檢查連接
mongosh mongodb://localhost:27017/propagent_prod

# 檢查日誌
tail -f /var/log/mongodb/mongod.log
```

### 常見問題 3: 前端無法載入
```bash
# 檢查 Nginx 配置
sudo nginx -t

# 重載 Nginx
sudo nginx -s reload

# 檢查靜態檔案
ls -la /var/www/PropAgent/frontend/dist/
```

## 📞 緊急聯絡

- **系統管理員**: admin@company.com
- **開發團隊**: dev@company.com
- **監控告警**: alerts@company.com

## 🎯 部署後驗證清單

### 功能驗證
- [ ] 用戶註冊/登入正常
- [ ] 客戶管理功能正常
- [ ] 房產資訊顯示正確
- [ ] 檔案上傳下載正常
- [ ] 數據分析圖表顯示
- [ ] 通知系統運作正常

### 性能驗證
- [ ] 頁面載入速度 < 3 秒
- [ ] API 回應時間 < 500ms
- [ ] 大型檔案上傳正常
- [ ] 並發用戶處理能力

### 安全驗證
- [ ] HTTPS 憑證正確
- [ ] 資料庫訪問限制
- [ ] 檔案上傳安全檢查
- [ ] 用戶權限控制正確

---

**部署完成日期**: _待填寫_
**部署人員**: _待填寫_
**版本號**: v1.0.0
**狀態**: ✅ 準備就緒