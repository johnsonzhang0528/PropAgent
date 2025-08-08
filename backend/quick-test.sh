#!/bin/bash

echo "🧪 快速功能測試開始..."

# 1. 獲取認證token
echo "🔐 正在獲取認證token..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@propagent.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 無法獲取認證token"
    exit 1
fi

echo "✅ 認證成功"

# 2. 測試任務API
echo "📋 測試任務管理API..."
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/tasks | \
  grep -o '"total":[0-9]*' && echo " ✅ 任務API正常"

# 3. 測試客戶API
echo "👥 測試客戶管理API..."
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/customers | \
  grep -o '"total":[0-9]*' && echo " ✅ 客戶API正常"

# 4. 測試房產API  
echo "🏠 測試房產管理API..."
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/properties?limit=1" | \
  grep -o '"total":[0-9]*' && echo " ✅ 房產API正常"

# 5. 測試文檔API
echo "📄 測試文檔管理API..."
DOC_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/documents)

if echo $DOC_RESULT | grep -q "success"; then
    echo " ✅ 文檔API可訪問"
else
    echo " ⚠️ 文檔API可能需要檢查"
fi

# 6. 測試備份API
echo "💾 測試備份管理API..."
BACKUP_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/backup/status)

if echo $BACKUP_RESULT | grep -q "success"; then
    echo " ✅ 備份API可訪問"
else
    echo " ⚠️ 備份API可能需要檢查"
fi

# 7. 測試安全API
echo "🔒 測試安全管理API..."
SECURITY_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/security/stats)

if echo $SECURITY_RESULT | grep -q "success"; then
    echo " ✅ 安全API可訪問"
else
    echo " ⚠️ 安全API可能需要檢查"  
fi

echo "🎉 快速功能測試完成！"