# 🤖 Orchestrator 開發命令手冊

## 當前任務：PropAgent Pro 編排者
負責整體項目協調、CI/CD 管理和品質控制

## 🎯 立即執行的命令

### 1. 項目狀態檢查
```bash
# 檢查項目結構
ls -la
tree -L 3

# 檢查規格文件完整性
wc -l docs/*.md
echo "✅ 規格文件檢查完成"
```

### 2. 設置 Git 倉庫和 CI/CD
```bash
# 初始化 Git 倉庫
git init
git add .
git commit -m "🎉 Initial commit: PropAgent Pro 專案啟動"

# 設置 GitHub Actions
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: PropAgent Pro CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Run tests
        run: |
          cd frontend && npm run test
          cd ../backend && npm run test
      - name: Build applications
        run: |
          cd frontend && npm run build
          cd ../backend && npm run build
EOF

echo "✅ CI/CD 流水線配置完成"
```

### 3. 設置 Docker 環境
```bash
# 創建根目錄 docker-compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: propagent_dev
      POSTGRES_USER: propagent
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://propagent:dev_password@postgres:5432/propagent_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
EOF

echo "✅ Docker 配置完成"
```

### 4. 監控和日誌設置
```bash
# 創建監控目錄
mkdir -p monitoring/{prometheus,grafana,logs}

# 設置 Prometheus 配置
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'propagent-backend'
    static_configs:
      - targets: ['backend:3000']
  - job_name: 'propagent-frontend'
    static_configs:
      - targets: ['frontend:5173']
EOF

echo "✅ 監控配置完成"
```

## 🔄 持續執行的監控命令

### 實時項目狀態
```bash
# 監控開發進度
watch -n 5 'echo "=== PropAgent Pro 開發狀態 ===" && 
echo "前端狀態:" && tmux capture-pane -t ai-dev-my-first-project:2 -p | tail -3 &&
echo "後端狀態:" && tmux capture-pane -t ai-dev-my-first-project:3 -p | tail -3 &&
echo "文檔狀態:" && tmux capture-pane -t ai-dev-my-first-project:4 -p | tail -3'
```

### Git 提交監控
```bash
# 監控代碼提交
watch -n 10 'git log --oneline -5 && echo "總提交數: $(git rev-list --count HEAD)"'
```

## 📊 每日報告生成
```bash
# 生成每日開發報告
cat > generate-daily-report.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
REPORT_FILE="reports/daily-report-$DATE.md"

mkdir -p reports

cat > $REPORT_FILE << REPORT
# PropAgent Pro 每日開發報告 - $DATE

## 📈 開發進度
- 前端進度: $(cd frontend && git log --since="1 day ago" --oneline | wc -l) commits
- 後端進度: $(cd backend && git log --since="1 day ago" --oneline | wc -l) commits  
- 文檔更新: $(cd docs && git log --since="1 day ago" --oneline | wc -l) commits

## 🧪 測試狀態
- 前端測試: $(cd frontend && npm run test:silent 2>/dev/null | grep -o "[0-9]* passing" || echo "未執行")
- 後端測試: $(cd backend && npm run test:silent 2>/dev/null | grep -o "[0-9]* passing" || echo "未執行")

## 📋 今日完成任務
- [ ] 項目初始化
- [ ] 基礎架構設置
- [ ] CI/CD 配置
- [ ] 開發環境準備

## 🎯 明日計劃
- [ ] 開始核心功能開發
- [ ] API 設計實現
- [ ] 前端頁面開發
- [ ] 資料庫設計實現

## ⚠️ 風險和阻礙
- 無

## 📊 關鍵指標
- 程式碼覆蓋率: 待測量
- 建置成功率: 待測量
- 部署頻率: 每日目標 > 3次

REPORT

echo "✅ 每日報告已生成: $REPORT_FILE"
EOF

chmod +x generate-daily-report.sh
echo "✅ 每日報告生成器已設置"
```

## 🚨 緊急情況處理
```bash
# 快速健康檢查
alias health-check='echo "🔍 系統健康檢查" && 
docker-compose ps 2>/dev/null || echo "Docker 未啟動" &&
git status --porcelain | wc -l | xargs echo "未提交變更:" &&
ps aux | grep -E "(node|npm)" | wc -l | xargs echo "Node 進程數:"'

# 快速重啟所有服務
alias restart-all='docker-compose down && docker-compose up -d && echo "✅ 所有服務已重啟"'
```

## 💬 團隊協調命令
```bash
# 向其他窗口發送協調訊息
send-to-frontend() {
    tmux send-keys -t ai-dev-my-first-project:2 "echo '📢 編排者訊息: $1'" C-m
}

send-to-backend() {
    tmux send-keys -t ai-dev-my-first-project:3 "echo '📢 編排者訊息: $1'" C-m
}

send-to-docs() {
    tmux send-keys -t ai-dev-my-first-project:4 "echo '📢 編排者訊息: $1'" C-m
}

# 使用範例
# send-to-frontend "請開始實現登入頁面"
# send-to-backend "請實現用戶認證 API"
```

---

**🎯 現在開始執行：複製上面的命令到當前 orchestrator 窗口中執行！**
