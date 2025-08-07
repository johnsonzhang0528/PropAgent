#!/bin/bash

echo "🚀 PropAgent Pro - MongoDB本地安裝腳本"
echo "======================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create MongoDB directory
MONGODB_DIR="$PWD/mongodb"
MONGODB_DATA_DIR="$MONGODB_DIR/data"
MONGODB_LOG_DIR="$MONGODB_DIR/logs"

echo "📁 創建MongoDB目錄結構..."
mkdir -p "$MONGODB_DATA_DIR"
mkdir -p "$MONGODB_LOG_DIR"

print_success "MongoDB目錄創建完成: $MONGODB_DIR"

# Check system architecture
ARCH=$(uname -m)
echo "🔍 檢測系統架構: $ARCH"

if [ "$ARCH" = "x86_64" ]; then
    MONGODB_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2404-8.0.4.tgz"
    MONGODB_ARCHIVE="mongodb-linux-x86_64-ubuntu2404-8.0.4.tgz"
    MONGODB_FOLDER="mongodb-linux-x86_64-ubuntu2404-8.0.4"
else
    print_error "不支持的架構: $ARCH"
    exit 1
fi

# Download MongoDB if not exists
if [ ! -f "$MONGODB_DIR/$MONGODB_ARCHIVE" ]; then
    echo "📥 下載MongoDB 8.0.4..."
    cd "$MONGODB_DIR"
    
    if curl -O "$MONGODB_URL"; then
        print_success "MongoDB下載完成"
    else
        print_error "MongoDB下載失敗"
        exit 1
    fi
else
    print_info "MongoDB已存在，跳過下載"
    cd "$MONGODB_DIR"
fi

# Extract MongoDB
if [ ! -d "$MONGODB_DIR/$MONGODB_FOLDER" ]; then
    echo "📦 解壓MongoDB..."
    tar -xzf "$MONGODB_ARCHIVE"
    print_success "MongoDB解壓完成"
else
    print_info "MongoDB已解壓，跳過解壓步驟"
fi

# Create symbolic links for easier access
if [ ! -L "$MONGODB_DIR/bin" ]; then
    ln -s "$MONGODB_FOLDER/bin" "$MONGODB_DIR/bin"
    print_success "創建bin目錄軟鏈接"
fi

# Create MongoDB configuration file
cat > "$MONGODB_DIR/mongod.conf" << EOF
# MongoDB配置文件
storage:
  dbPath: $MONGODB_DATA_DIR
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: $MONGODB_LOG_DIR/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  fork: false
  pidFilePath: $MONGODB_DIR/mongod.pid
EOF

print_success "MongoDB配置文件創建完成"

# Create start script
cat > "$MONGODB_DIR/start-mongodb.sh" << EOF
#!/bin/bash
echo "🚀 啟動MongoDB服務器..."
cd "$MONGODB_DIR"
./bin/mongod --config mongod.conf
EOF

chmod +x "$MONGODB_DIR/start-mongodb.sh"

# Create stop script
cat > "$MONGODB_DIR/stop-mongodb.sh" << EOF
#!/bin/bash
echo "⏹️  停止MongoDB服務器..."
if [ -f "$MONGODB_DIR/mongod.pid" ]; then
    PID=\$(cat "$MONGODB_DIR/mongod.pid")
    kill \$PID
    echo "MongoDB已停止 (PID: \$PID)"
else
    echo "找不到MongoDB PID文件"
fi
EOF

chmod +x "$MONGODB_DIR/stop-mongodb.sh"

# Create client connection script
cat > "$MONGODB_DIR/connect-mongodb.sh" << EOF
#!/bin/bash
echo "🔌 連接到MongoDB..."
cd "$MONGODB_DIR"
./bin/mongosh
EOF

chmod +x "$MONGODB_DIR/connect-mongodb.sh"

# Create status check script
cat > "$MONGODB_DIR/status-mongodb.sh" << EOF
#!/bin/bash
echo "📊 檢查MongoDB狀態..."
if pgrep -f mongod > /dev/null; then
    echo "✅ MongoDB正在運行"
    echo "📊 進程信息:"
    pgrep -f mongod | head -5
else
    echo "❌ MongoDB未運行"
fi

echo ""
echo "📝 最近的日誌:"
if [ -f "$MONGODB_LOG_DIR/mongod.log" ]; then
    tail -10 "$MONGODB_LOG_DIR/mongod.log"
else
    echo "日誌文件不存在"
fi
EOF

chmod +x "$MONGODB_DIR/status-mongodb.sh"

echo ""
print_success "🎉 MongoDB安裝完成！"
echo ""
print_info "📍 安裝位置: $MONGODB_DIR"
print_info "📊 數據目錄: $MONGODB_DATA_DIR"
print_info "📝 日誌目錄: $MONGODB_LOG_DIR"
echo ""
print_info "🚀 可用命令:"
echo "   啟動: $MONGODB_DIR/start-mongodb.sh"
echo "   停止: $MONGODB_DIR/stop-mongodb.sh"
echo "   連接: $MONGODB_DIR/connect-mongodb.sh"
echo "   狀態: $MONGODB_DIR/status-mongodb.sh"
echo ""
print_warning "⚠️  注意: 首次啟動可能需要一些時間來初始化數據庫"
echo ""
echo "🔧 下一步:"
echo "1. 運行: $MONGODB_DIR/start-mongodb.sh"
echo "2. 等待啟動完成"
echo "3. 新終端中運行: $MONGODB_DIR/connect-mongodb.sh 測試連接"