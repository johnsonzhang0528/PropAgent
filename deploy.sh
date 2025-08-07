#!/bin/bash

# PropAgent Pro Deployment Script
# 一鍵部署腳本

set -e

echo "🚀 PropAgent Pro 自動部署開始..."
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查依賴
check_dependencies() {
    log_info "檢查系統依賴..."
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝，請先安裝 Node.js 18+"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js 版本過低，需要 18+，當前版本: $(node -v)"
        exit 1
    fi
    
    # 檢查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安裝"
        exit 1
    fi
    
    log_success "依賴檢查完成"
}

# 設置環境變量
setup_environment() {
    log_info "設置環境變量..."
    
    # 後端環境變量
    cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5175

# JWT 密鑰 (生產環境請更換)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# MongoDB 連接 (可選)
MONGODB_URI=mongodb://localhost:27017/propagent

# SMS 服務配置 (生產環境配置)
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret

# 郵件服務配置 (生產環境配置)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

    # 前端環境變量
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
EOF

    log_success "環境變量設置完成"
}

# 安裝依賴
install_dependencies() {
    log_info "安裝後端依賴..."
    cd backend
    npm install --production
    cd ..
    
    log_info "安裝前端依賴..."
    cd frontend
    npm install
    cd ..
    
    log_success "依賴安裝完成"
}

# 構建應用 (開發模式跳過)
build_application() {
    log_info "跳過構建步驟 (開發模式)..."
    log_success "開發模式：無需構建"
}

# 運行測試
run_tests() {
    log_info "運行後端測試..."
    cd backend
    npm test -- --passWithNoTests --silent
    cd ..
    
    log_success "測試運行完成"
}

# 啟動服務
start_services() {
    log_info "啟動服務..."
    
    # 檢查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 3000 已被占用，嘗試終止現有進程..."
        pkill -f "node.*3000" || true
        sleep 2
    fi
    
    if lsof -Pi :5175 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 5175 已被占用，嘗試終止現有進程..."
        pkill -f "vite.*5175" || true
        sleep 2
    fi
    
    # 啟動後端服務
    log_info "啟動後端服務..."
    cd backend
    nohup npx tsx watch src/index.ts > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待後端啟動
    sleep 3
    
    # 檢查後端是否啟動成功
    if ! curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log_error "後端服務啟動失敗"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # 啟動前端服務
    log_info "啟動前端服務..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端啟動
    sleep 5
    
    log_success "服務啟動完成"
    
    echo ""
    echo "🎉 PropAgent Pro 部署成功！"
    echo "=================================="
    echo "📡 後端 API: http://localhost:3000"
    echo "🌐 前端應用: http://localhost:5175"
    echo "📝 API 文檔: http://localhost:3000/health"
    echo "🔌 Socket.io 已啟用"
    echo ""
    echo "📋 進程 ID:"
    echo "   後端: $BACKEND_PID"
    echo "   前端: $FRONTEND_PID"
    echo ""
    echo "🛑 停止服務: kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    
    # 保存 PID 到文件
    echo "$BACKEND_PID" > .backend.pid
    echo "$FRONTEND_PID" > .frontend.pid
    
    log_info "服務已在背景運行，按 Ctrl+C 或運行 ./stop.sh 停止服務"
}

# 健康檢查
health_check() {
    log_info "執行健康檢查..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            log_success "後端服務健康檢查通過"
            break
        fi
        
        log_warning "健康檢查失敗，重試 $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "健康檢查失敗，服務可能未正常啟動"
        return 1
    fi
    
    # 檢查前端
    if curl -f http://localhost:5175 >/dev/null 2>&1; then
        log_success "前端服務健康檢查通過"
    else
        log_warning "前端服務可能尚未完全啟動"
    fi
}

# 主函數
main() {
    echo "🏢 PropAgent Pro - 房地產 CRM 系統"
    echo "📅 部署時間: $(date)"
    echo "👤 執行用戶: $(whoami)"
    echo "📁 工作目錄: $(pwd)"
    echo ""
    
    check_dependencies
    setup_environment
    install_dependencies
    build_application
    run_tests
    start_services
    health_check
    
    echo ""
    echo "✅ 部署完成！系統已準備就緒。"
    echo ""
    echo "🔧 快速操作:"
    echo "   查看後端日誌: cd backend && npm run dev"
    echo "   查看前端日誌: cd frontend && npm run dev"  
    echo "   停止所有服務: ./stop.sh"
    echo "   重新部署: ./deploy.sh"
    echo ""
}

# 錯誤處理
trap 'log_error "部署過程中發生錯誤，正在清理..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 1' ERR

# 執行主函數
main "$@"