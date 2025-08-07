#!/bin/bash

# PropAgent Pro 簡化部署腳本
# 專注於快速啟動開發環境

set -e

echo "🚀 PropAgent Pro 快速部署開始..."
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 檢查基本依賴
check_dependencies() {
    log_info "檢查系統依賴..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝，請先安裝 Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安裝"
        exit 1
    fi
    
    log_success "依賴檢查完成"
}

# 停止現有服務
stop_existing_services() {
    log_info "停止現有服務..."
    
    # 停止可能運行的進程
    pkill -f "tsx watch" 2>/dev/null || true
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    
    # 等待進程結束
    sleep 2
    
    log_success "現有服務已停止"
}

# 安裝依賴
install_dependencies() {
    log_info "安裝項目依賴..."
    
    # 安裝後端依賴
    log_info "安裝後端依賴..."
    cd backend
    npm install --silent
    cd ..
    
    # 安裝前端依賴
    log_info "安裝前端依賴..."
    cd frontend
    npm install --silent
    cd ..
    
    log_success "依賴安裝完成"
}

# 設置環境變量
setup_environment() {
    log_info "設置環境變量..."
    
    # 後端環境變量
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5176

# JWT 密鑰
JWT_ACCESS_SECRET=your-super-secret-access-key-for-development
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development

# MongoDB 連接 (開發環境可選)
MONGODB_URI=mongodb://localhost:27017/propagent
EOF
    fi
    
    # 前端環境變量
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
EOF
    fi
    
    log_success "環境變量設置完成"
}

# 啟動後端服務
start_backend() {
    log_info "啟動後端服務..."
    
    cd backend
    
    # 檢查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口 3000 已被占用，嘗試停止..."
        pkill -f "node.*3000" 2>/dev/null || true
        sleep 2
    fi
    
    # 啟動後端 (後台運行)
    nohup npx tsx watch src/index.ts > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    # 等待後端啟動
    log_info "等待後端服務啟動..."
    sleep 5
    
    # 檢查後端是否成功啟動
    for i in {1..10}; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            log_success "後端服務啟動成功 (PID: $BACKEND_PID)"
            return 0
        fi
        log_info "等待後端啟動... ($i/10)"
        sleep 2
    done
    
    log_error "後端服務啟動失敗"
    return 1
}

# 啟動前端服務
start_frontend() {
    log_info "啟動前端服務..."
    
    cd frontend
    
    # 啟動前端 (後台運行)
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ..
    
    # 等待前端啟動
    log_info "等待前端服務啟動..."
    sleep 8
    
    # 檢查前端端口
    for port in 5173 5174 5175 5176 5177; do
        if curl -f http://localhost:$port >/dev/null 2>&1; then
            log_success "前端服務啟動成功 (PID: $FRONTEND_PID, Port: $port)"
            echo "http://localhost:$port" > frontend.url
            return 0
        fi
    done
    
    log_warning "前端服務可能仍在啟動中..."
    return 0
}

# 顯示部署結果
show_deployment_info() {
    echo ""
    echo "🎉 PropAgent Pro 部署完成！"
    echo "=================================="
    
    # 後端狀態
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ 後端 API: http://localhost:3000"
        echo "📋 健康檢查: http://localhost:3000/health"
    else
        echo "❌ 後端服務未正常運行"
    fi
    
    # 前端狀態
    FRONTEND_URL=""
    for port in 5173 5174 5175 5176 5177; do
        if curl -f http://localhost:$port >/dev/null 2>&1; then
            FRONTEND_URL="http://localhost:$port"
            break
        fi
    done
    
    if [ -n "$FRONTEND_URL" ]; then
        echo "✅ 前端應用: $FRONTEND_URL"
    else
        echo "⚠️  前端服務可能仍在啟動中..."
    fi
    
    echo "🔌 Socket.io: 已啟用"
    echo ""
    
    # 顯示進程信息
    if [ -f backend.pid ]; then
        echo "📋 後端進程 ID: $(cat backend.pid)"
    fi
    if [ -f frontend.pid ]; then
        echo "📋 前端進程 ID: $(cat frontend.pid)"
    fi
    
    echo ""
    echo "🛑 停止服務: ./stop.sh"
    echo "📜 後端日誌: tail -f backend.log"
    echo "📜 前端日誌: tail -f frontend.log"
    echo ""
    
    if [ -n "$FRONTEND_URL" ]; then
        echo "🌐 立即開始使用: $FRONTEND_URL"
    fi
}

# 主執行流程
main() {
    echo "🏢 PropAgent Pro - 房地產 CRM 系統"
    echo "📅 部署時間: $(date)"
    echo "👤 執行用戶: $(whoami)"
    echo "📁 工作目錄: $(pwd)"
    echo ""
    
    check_dependencies
    stop_existing_services
    setup_environment
    install_dependencies
    
    if start_backend; then
        start_frontend
        show_deployment_info
        
        echo "✅ 部署完成！系統已準備就緒。"
        echo ""
        echo "💡 提示: 如果前端尚未啟動，請稍等幾秒鐘再訪問"
    else
        log_error "部署失敗，請檢查後端日誌: tail -f backend.log"
        exit 1
    fi
}

# 錯誤處理
trap 'log_error "部署過程中發生錯誤"; exit 1' ERR

# 執行部署
main "$@"