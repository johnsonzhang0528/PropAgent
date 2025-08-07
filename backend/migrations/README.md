# PropAgent Pro 資料庫遷移系統

## 概述

本遷移系統為 PropAgent Pro 專案提供完整的 MongoDB 資料庫結構管理，包含 6 個核心數據模型的集合創建、索引配置和資料驗證規則。

## 📁 文件結構

```
migrations/
├── 001_create_users_table.js        # 用戶管理
├── 002_create_customers_table.js    # 客戶關係管理  
├── 003_create_companies_table.js    # 公司組織架構
├── 004_create_properties_table.js   # 房產資訊管理
├── 005_create_documents_table.js    # 文檔管理系統
├── 006_create_notifications_table.js # 通知推送系統
├── migrate.js                       # 遷移執行器
├── rollback.js                      # 回滾執行器
├── README.md                        # 使用說明
└── DEPLOYMENT_CHECKLIST.md         # 部署檢查清單
```

## 🚀 快速開始

### 1. 環境需求
- Node.js ≥ 16.0
- MongoDB ≥ 4.4
- 確保 MongoDB 服務運行中

### 2. 基礎使用

#### 執行所有遷移
```bash
cd backend/migrations/
node migrate.js
```

#### 預覽模式（推薦先執行）
```bash
node migrate.js --dry-run
```

#### 執行到指定版本
```bash
node migrate.js --target=3
```

### 3. 回滾操作

#### 回滾最新遷移
```bash
SKIP_CONFIRMATION=true node rollback.js
```

#### 回滾到指定版本
```bash
SKIP_CONFIRMATION=true node rollback.js --target=2
```

#### 預覽回滾
```bash
node rollback.js --dry-run
```

## 📊 資料模型說明

### 001 - Users (用戶管理)
- **功能**: 系統用戶、角色權限、登入記錄
- **關鍵欄位**: email, role, company_id, status
- **索引**: email(unique), phone(unique), role, company_id, status

### 002 - Customers (客戶管理)
- **功能**: CRM 客戶資料、需求偏好、互動記錄
- **關鍵欄位**: contact_info, preferences, assigned_agent
- **索引**: phone(unique), email(unique), assigned_agent, status

### 003 - Companies (公司管理)  
- **功能**: 組織架構、公司設置、分層管理
- **關鍵欄位**: name, settings, subscription_plan
- **索引**: name(unique), status, created_at

### 004 - Properties (房產管理)
- **功能**: 房產資訊、地理坐標、交通資訊
- **關鍵欄位**: address, coordinates, price, features
- **索引**: coordinates(2d), status, price_range, company_id

### 005 - Documents (文檔管理)
- **功能**: 檔案上傳、元資料管理、關聯對象
- **關鍵欄位**: file_path, metadata, related_entity
- **索引**: related_entity, file_type, uploaded_by

### 006 - Notifications (通知系統)
- **功能**: 即時推送、狀態追蹤、自動過期
- **關鍵欄位**: recipient_id, message, type, status
- **索引**: recipient_id+status, created_at(TTL), type

## 🔧 進階配置

### 環境變數
```bash
# MongoDB 連接字串 (預設: mongodb://localhost:27017/propagent)
export MONGODB_URI="mongodb://username:password@host:port/database"

# 跳過回滾確認 (生產環境謹慎使用)
export SKIP_CONFIRMATION=true
```

### 自訂配置
可以修改各遷移腳本中的驗證規則、索引配置等：

```javascript
// 範例：修改用戶密碼長度要求
password: {
  bsonType: 'string',
  minLength: 8,  // 改為 8 位
  description: '密碼長度至少 8 個字符'
}
```

## 📈 監控與維護

### 檢查遷移狀態
```bash
mongosh propagent --eval "db._migrations.find().pretty()"
```

### 檢查集合統計
```bash
mongosh propagent --eval "
  ['users', 'customers', 'companies', 'properties', 'documents', 'notifications'].forEach(col => {
    const stats = db[col].stats();
    print(\`\${col}: \${stats.count} 文檔, \${stats.totalIndexSize} bytes 索引\`);
  })
"
```

### 索引使用分析
```bash
mongosh propagent --eval "
  db.users.aggregate([{\$indexStats: {}}]).forEach(printjson)
"
```

## 🚨 故障排除

### 常見問題

#### 1. 連接失敗
```
錯誤: MongoServerError: Authentication failed
解決: 檢查 MONGODB_URI 中的用戶名密碼
```

#### 2. 權限不足
```
錯誤: not authorized on propagent to execute command
解決: 確保用戶有 readWrite 權限
```

#### 3. 重複執行
```
錯誤: E11000 duplicate key error collection
解決: 遷移已執行，檢查 db._migrations 記錄
```

#### 4. 磁盤空間不足
```
錯誤: No space left on device
解決: 清理磁盤空間或調整資料庫配置
```

### 恢復程序

#### 從備份恢復
```bash
# 停止應用程式
./stop.sh

# 恢復資料庫
mongorestore --db propagent /path/to/backup

# 重新執行遷移
cd migrations && node migrate.js
```

#### 重建索引
```bash
mongosh propagent --eval "
  db.runCommand({reIndex: 'users'});
  db.runCommand({reIndex: 'customers'});
  // ... 其他集合
"
```

## 📝 維護日誌

### 版本歷史
- **v1.0** (2024-08-07): 初始版本，6 個核心模型
- **v1.1** (未來): 計劃新增分析和報表模型

### 待辦事項
- [ ] 新增資料驗證單元測試
- [ ] 實現自動備份功能  
- [ ] 新增效能監控指標
- [ ] 建立 CI/CD 整合流程

## 🔗 相關連結

- [MongoDB 官方文檔](https://docs.mongodb.com/)
- [JSON Schema 驗證](https://docs.mongodb.com/manual/core/schema-validation/)
- [PropAgent Pro 專案文檔](../../README.md)

---

**製作**: PropAgent Pro 開發團隊  
**維護**: 資料庫工程師  
**最後更新**: 2024-08-07