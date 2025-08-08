#!/bin/bash

# PropAgent Pro 備份功能測試腳本
# 測試所有備份相關的API端點

echo "🧪 PropAgent Pro 備份功能測試"
echo "=================================="

# API基本配置
API_BASE="http://localhost:3000/api"
BACKUP_API="$API_BASE/backup"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試結果計數
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 測試函數
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    echo -e "\n${BLUE}🔍 測試: $test_name${NC}"
    echo "命令: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 執行測試命令並獲取狀態碼
    response=$(eval "$test_command" 2>&1)
    status_code=$(echo "$response" | tail -1 | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' "')
    
    # 檢查結果
    if [[ "$response" == *"$expected_status"* ]] || [[ "$status_code" == "true" && "$expected_status" == "success" ]]; then
        echo -e "${GREEN}✅ 通過${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失敗${NC}"
        echo "回應: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 登入測試帳號獲取管理員token
echo -e "\n${YELLOW}📋 準備測試環境...${NC}"

# 創建測試管理員用戶（如果不存在）
echo "創建測試管理員用戶..."
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "name": "測試管理員",
    "role": "admin"
  }' > /dev/null 2>&1

# 登入獲取token
echo "登入獲取管理員令牌..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }')

# 提取token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 無法獲取管理員令牌，跳過需要認證的測試${NC}"
    AUTH_HEADER=""
else
    echo -e "${GREEN}✅ 已獲取管理員令牌${NC}"
    AUTH_HEADER="-H \"Authorization: Bearer $TOKEN\""
fi

echo -e "\n${YELLOW}🧪 開始備份功能測試...${NC}"

# 測試 1: 獲取備份配置
run_test "獲取備份配置" \
    "curl -s -X GET \"$BACKUP_API/config\" $AUTH_HEADER" \
    "success"

# 測試 2: 獲取備份列表  
run_test "獲取備份列表" \
    "curl -s -X GET \"$BACKUP_API/list\" $AUTH_HEADER" \
    "success"

# 測試 3: 創建數據庫備份
run_test "創建數據庫備份" \
    "curl -s -X POST \"$BACKUP_API/create\" $AUTH_HEADER -H \"Content-Type: application/json\" -d '{\"type\": \"database\"}'" \
    "success"

# 測試 4: 導出JSON數據
run_test "導出JSON數據" \
    "curl -s -X POST \"$BACKUP_API/export\" $AUTH_HEADER -H \"Content-Type: application/json\" -d '{\"format\": \"json\"}'" \
    "success"

# 測試 5: 導出CSV數據（客戶資料）
run_test "導出CSV數據-客戶資料" \
    "curl -s -X POST \"$BACKUP_API/export\" $AUTH_HEADER -H \"Content-Type: application/json\" -d '{\"format\": \"csv\", \"collection\": \"customers\"}'" \
    "success"

# 測試 6: 清理過期備份
run_test "清理過期備份" \
    "curl -s -X POST \"$BACKUP_API/cleanup\" $AUTH_HEADER -H \"Content-Type: application/json\" -d '{}'" \
    "success"

# 測試 7: 無權限訪問測試
echo -e "\n${BLUE}🔒 安全性測試${NC}"
run_test "無令牌訪問備份配置（應該失敗）" \
    "curl -s -X GET \"$BACKUP_API/config\"" \
    "MISSING_TOKEN"

# 測試 8: 錯誤格式測試
run_test "錯誤格式導出測試" \
    "curl -s -X POST \"$BACKUP_API/export\" $AUTH_HEADER -H \"Content-Type: application/json\" -d '{\"format\": \"xml\"}'" \
    "不支持的導出格式"

# 檢查備份目錄
echo -e "\n${BLUE}📁 檢查備份目錄${NC}"
BACKUP_DIR="../backups"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}✅ 備份目錄存在${NC}"
    echo "備份文件列表:"
    ls -la "$BACKUP_DIR" | head -10
    
    # 計算備份文件大小
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo "備份目錄總大小: $BACKUP_SIZE"
else
    echo -e "${YELLOW}⚠️ 備份目錄不存在: $BACKUP_DIR${NC}"
fi

# 檢查MongoDB連接
echo -e "\n${BLUE}🗄️ 檢查MongoDB連接${NC}"
if command -v mongosh &> /dev/null; then
    MONGO_STATUS=$(mongosh --quiet --eval "db.runCommand('ping').ok" mongodb://localhost:27017/propagent 2>/dev/null)
    if [ "$MONGO_STATUS" = "1" ]; then
        echo -e "${GREEN}✅ MongoDB 連接正常${NC}"
        # 檢查集合
        echo "資料庫集合:"
        mongosh --quiet --eval "db.adminCommand('listCollections').cursor.firstBatch.forEach(function(collection) { print(collection.name) })" mongodb://localhost:27017/propagent 2>/dev/null | head -5
    else
        echo -e "${RED}❌ MongoDB 連接失敗${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ mongosh 不可用，跳過MongoDB檢查${NC}"
fi

# 輸出測試結果摘要
echo -e "\n${YELLOW}📊 測試結果摘要${NC}"
echo "=================================="
echo "總測試數: $TOTAL_TESTS"
echo -e "通過: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失敗: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有測試通過！備份功能正常運作${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ 有 $FAILED_TESTS 個測試失敗，請檢查備份功能${NC}"
    exit 1
fi