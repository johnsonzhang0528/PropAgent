#!/bin/bash

# 顔色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== PropAgent Pro API 完整測試 ===${NC}"

# 獲取認證Token
echo -e "${YELLOW}1. 測試用戶認證${NC}"
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}')

TOKEN=$(echo $LOGIN_RESP | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ 登入成功${NC}"
else
    echo -e "${RED}❌ 登入失敗${NC}"
    exit 1
fi

# 測試健康檢查
echo -e "${YELLOW}2. 測試API健康檢查${NC}"
HEALTH_RESP=$(curl -s http://localhost:3000/health)
if echo $HEALTH_RESP | grep -q '"status":"OK"'; then
    echo -e "${GREEN}✅ API健康檢查通過${NC}"
else
    echo -e "${RED}❌ API健康檢查失敗${NC}"
fi

# 測試客戶管理
echo -e "${YELLOW}3. 測試客戶管理API${NC}"

# 獲取客戶列表
CUSTOMERS_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/customers?limit=2")
if echo $CUSTOMERS_RESP | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 獲取客戶列表成功${NC}"
else
    echo -e "${RED}❌ 獲取客戶列表失敗${NC}"
fi

# 創建新客戶
CREATE_RESP=$(curl -s -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "測試腳本",
    "last_name": "客戶",
    "email": "script.test@example.com",
    "phone": "0912888999",
    "age": 30,
    "gender": "female",
    "source": "api",
    "notes": "腳本測試創建"
  }')

if echo $CREATE_RESP | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 創建客戶成功${NC}"
    NEW_CUSTOMER_ID=$(echo $CREATE_RESP | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
else
    echo -e "${RED}❌ 創建客戶失敗${NC}"
fi

# 測試房產管理
echo -e "${YELLOW}4. 測試房產管理API${NC}"

# 獲取房產列表
PROPERTIES_RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/properties?limit=2")
if echo $PROPERTIES_RESP | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 獲取房產列表成功${NC}"
else
    echo -e "${RED}❌ 獲取房產列表失敗${NC}"
fi

# 測試分析API
echo -e "${YELLOW}5. 測試數據分析API${NC}"

# 客戶統計
CUSTOMER_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/analytics/customer-stats")
if echo $CUSTOMER_STATS | grep -q '"total_customers"'; then
    echo -e "${GREEN}✅ 客戶統計API成功${NC}"
else
    echo -e "${RED}❌ 客戶統計API失敗${NC}"
fi

# 房產統計
PROPERTY_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/analytics/property-stats")
if echo $PROPERTY_STATS | grep -q '"total_properties"'; then
    echo -e "${GREEN}✅ 房產統計API成功${NC}"
else
    echo -e "${RED}❌ 房產統計API失敗${NC}"
fi

# 測試備份功能
echo -e "${YELLOW}6. 測試備份功能${NC}"
BACKUP_LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/backup")
if echo $BACKUP_LIST | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 備份列表API成功${NC}"
else
    echo -e "${RED}❌ 備份列表API失敗${NC}"
fi

# 測試安全監控
echo -e "${YELLOW}7. 測試安全監控API${NC}"
SECURITY_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/security/stats")
if echo $SECURITY_STATS | grep -q '"success":true' || echo $SECURITY_STATS | grep -q '"system_status"'; then
    echo -e "${GREEN}✅ 安全監控API成功${NC}"
else
    echo -e "${RED}❌ 安全監控API失敗${NC}"
fi

# 測試前端服務
echo -e "${YELLOW}8. 測試前端服務${NC}"
FRONTEND_RESP=$(curl -s -I http://localhost:5173 | grep "HTTP")
if echo $FRONTEND_RESP | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 前端服務運行正常${NC}"
else
    echo -e "${RED}❌ 前端服務異常${NC}"
fi

echo -e "${BLUE}=== 測試完成 ===${NC}"

# 清理測試數據（如果創建了新客戶）
if [ -n "$NEW_CUSTOMER_ID" ]; then
    echo -e "${YELLOW}清理測試數據...${NC}"
    curl -s -X DELETE "http://localhost:3000/api/customers/$NEW_CUSTOMER_ID" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    echo -e "${GREEN}✅ 測試數據已清理${NC}"
fi