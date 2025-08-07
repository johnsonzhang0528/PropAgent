#!/bin/bash

# PropAgent Pro 停止腳本

echo "🛑 正在停止 PropAgent Pro 服務..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 從 PID 文件停止服務
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_info "停止後端服務 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        log_success "後端服務已停止"
    else
        log_info "後端服務已經停止"
    fi
    rm -f backend.pid
fi

if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_info "停止前端服務 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        log_success "前端服務已停止"
    else
        log_info "前端服務已經停止"
    fi
    rm -f frontend.pid
fi

# 強制停止相關進程
log_info "清理殘留進程..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# 清理日誌文件
rm -f backend.log frontend.log frontend.url

log_success "所有 PropAgent Pro 服務已停止"