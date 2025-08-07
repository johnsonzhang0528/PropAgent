# 資料庫遷移部署檢查清單

## ✅ 部署前驗證 (已完成)

### 1. 文件完整性檢查
- [x] 8 個遷移文件完整存在 (6 個模型 + 2 個執行器)
- [x] 所有文件語法檢查通過
- [x] 文件權限正確設置

### 2. 遷移腳本驗證
```
001_create_users_table.js       (111 行) ✅
002_create_customers_table.js   (166 行) ✅
003_create_companies_table.js   (115 行) ✅
004_create_properties_table.js  (256 行) ✅
005_create_documents_table.js   (162 行) ✅
006_create_notifications_table.js (200 行) ✅
migrate.js                      (214 行) ✅
rollback.js                     (275 行) ✅
總計: 1,499 行代碼
```

### 3. 執行器功能測試
- [x] migrate.js 預覽模式正常
- [x] rollback.js 預覽模式正常
- [x] 資料庫連接測試通過
- [x] 遷移記錄集合初始化正常

## 🚀 生產部署步驟

### 階段 1: 環境準備
```bash
# 1. 確認 MongoDB 運行中
mongosh --eval "db.runCommand('ping')"

# 2. 設置環境變數
export MONGODB_URI="mongodb://localhost:27017/propagent"

# 3. 進入遷移目錄
cd backend/migrations/
```

### 階段 2: 預覽執行
```bash
# 預覽所有待執行遷移
node migrate.js --dry-run
```

### 階段 3: 執行遷移
```bash
# 執行所有遷移
node migrate.js

# 或分步執行到指定版本
node migrate.js --target=3
```

### 階段 4: 驗證結果
```bash
# 檢查集合創建狀態
mongosh propagent --eval "show collections"

# 檢查索引創建狀態
mongosh propagent --eval "db.users.getIndexes()"

# 檢查遷移記錄
mongosh propagent --eval "db._migrations.find().pretty()"
```

## ⚡ 緊急回滾程序

### 回滾最新遷移
```bash
SKIP_CONFIRMATION=true node rollback.js
```

### 回滾到指定版本
```bash
SKIP_CONFIRMATION=true node rollback.js --target=3
```

### 完全回滾 (清空資料庫)
```bash
SKIP_CONFIRMATION=true node rollback.js --all
```

## 🔒 安全注意事項

### 生產環境要求
- [ ] 資料庫已備份
- [ ] 有足夠的磁盤空間
- [ ] 確認 MongoDB 版本相容性 (≥ 4.4)
- [ ] 網路連接穩定
- [ ] 設置適當的連接超時

### 權限要求
- [ ] 對目標資料庫有 `readWrite` 權限
- [ ] 可以創建集合和索引
- [ ] 可以創建 `_migrations` 系統集合

### 監控要點
- [ ] 遷移執行時間監控
- [ ] 磁盤使用量監控
- [ ] 記憶體使用量監控
- [ ] 錯誤日誌監控

## 📊 遷移統計資訊

### 資料模型覆蓋
- **用戶管理**: User (含角色權限)
- **客戶關係**: Customer (完整 CRM)
- **組織架構**: Company (多層級)
- **房產資訊**: Property (地理坐標)
- **文檔管理**: Document (檔案系統)
- **通知系統**: Notification (即時推送)

### 索引策略
- **單一索引**: 18 個 (基礎查詢)
- **複合索引**: 12 個 (複雜查詢)
- **唯一索引**: 8 個 (數據完整性)
- **地理索引**: 1 個 (位置搜尋)
- **TTL 索引**: 1 個 (自動清理)

### 預估執行時間
- **本地環境**: ~30 秒
- **測試環境**: ~60 秒  
- **生產環境**: ~120 秒

## ✨ 部署完成後驗證

### 1. 基礎驗證
```bash
# 確認所有集合存在
mongosh propagent --eval "db.runCommand('listCollections').cursor.firstBatch.map(c => c.name)"

# 確認遷移記錄完整
mongosh propagent --eval "db._migrations.countDocuments()"
```

### 2. 功能驗證
```bash
# 測試用戶創建
mongosh propagent --eval "db.users.insertOne({email:'test@example.com', password:'test123', first_name:'測試', last_name:'用戶', role:'agent', status:'active', created_at: new Date(), updated_at: new Date()})"

# 測試查詢性能
mongosh propagent --eval "db.users.explain('executionStats').find({email: 'test@example.com'})"
```

---

**狀態**: ✅ 準備就緒，可進行生產部署
**最後檢查時間**: $(date '+%Y-%m-%d %H:%M:%S')
**檢查人員**: 資料庫工程師