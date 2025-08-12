# GitHub Copilot Token計費配置指南

## 📖 概述

本指南詳細說明如何將GitHub Copilot從訂閱制改為Token方式計費，包含完整的操作步驟、配置選項和注意事項。

## 🔧 操作步驟

### 1. 檢查當前計費設定
```bash
# 查看當前GitHub Copilot配置
claude --version
claude config list
```

### 2. 登出並重新配置
```bash
# 登出當前帳戶
claude auth logout

# 重新登入並選擇計費方式
claude auth login
```

### 3. 設定API Key（Token計費模式）
```bash
# 如果使用API Key方式（通常是Token計費）
claude config set api-key YOUR_API_KEY

# 或者設定為使用API計費模式
claude config set billing-mode token
```

### 4. 確認設定
```bash
# 驗證新的計費設定
claude config show
claude auth status
```

## 📋 具體配置選項

### 環境變數設定
您也可以透過環境變數來設定：
```bash
# 在您的 .bashrc 或 .zshrc 中添加
export ANTHROPIC_API_KEY="your-api-key-here"
export CLAUDE_BILLING_MODE="token"
```

### 配置檔案位置
GitHub Copilot的配置檔案通常位於：
- **Linux/macOS**: `~/.config/claude/config.toml`
- **Windows**: `%APPDATA%\claude\config.toml`

## 🔍 檢查Token使用量

### 基本使用量查詢
```bash
# 查看當前Token使用統計
claude usage show

# 查看本月使用量
claude usage current-month

# 查看詳細使用歷史
claude usage history

# 設定使用量警告
claude config set usage-warning-threshold 1000000
```

### 使用量報告
```bash
# 生成使用量報告
claude usage report --format json > usage-report.json
claude usage report --format csv > usage-report.csv

# 查看特定日期範圍的使用量
claude usage show --from 2024-01-01 --to 2024-01-31
```

## ⚙️ 進階設定

### 1. 設定Token限制
```bash
# 設定每日Token使用上限
claude config set daily-token-limit 100000

# 設定每月Token使用上限  
claude config set monthly-token-limit 3000000

# 設定單次請求Token上限
claude config set max-tokens-per-request 8192
```

### 2. 成本控制設定
```bash
# 設定成本警告閾值（美元）
claude config set cost-warning-threshold 50.00

# 設定自動停止閾值
claude config set auto-stop-threshold 100.00

# 設定每日成本上限
claude config set daily-cost-limit 20.00
```

### 3. 通知設定
```bash
# 設定Email通知
claude config set notification-email your-email@example.com

# 設定Slack通知
claude config set slack-webhook-url https://hooks.slack.com/your-webhook

# 設定通知觸發條件
claude config set notify-when-usage-exceeds 80
```

## 📊 計費模式比較

| 計費方式 | 優點 | 缺點 | 適用場景 |
|---------|------|------|----------|
| **訂閱制** | • 固定成本，預算可控<br>• 無限使用量<br>• 無需監控Token | • 月費較高<br>• 輕度使用可能浪費<br>• 缺乏使用量意識 | • 重度使用者<br>• 企業團隊<br>• 持續開發專案 |
| **Token計費** | • 按實際使用付費<br>• 成本透明<br>• 靈活彈性 | • 需要監控使用量<br>• 成本不可預測<br>• 需要管理API Key | • 輕度到中度使用<br>• 個人開發者<br>• 專案型使用 |

## 🚨 重要注意事項

### 1. 計費切換影響
- ⚠️ 切換到Token計費後，原有的訂閱可能需要取消
- ✅ 確認切換後的計費週期和結算方式
- 📊 保留原有的使用數據和歷史記錄
- 💳 檢查信用卡或付款方式設定

### 2. 使用量監控腳本
```bash
# 建議設定定期檢查使用量的腳本
cat > ~/check-claude-usage.sh << 'EOF'
#!/bin/bash

# GitHub Copilot使用量監控腳本
echo "=== GitHub Copilot 使用量檢查 ==="
echo "檢查時間: $(date)"
echo

# 查看當月使用量
echo "📊 當月使用量："
claude usage current-month

# 查看今日使用量
echo -e "\n📈 今日使用量："
claude usage show --today

# 檢查是否接近限制
echo -e "\n⚠️  限制檢查："
claude config show | grep -E "(limit|threshold|warning)"

# 預估本月成本
echo -e "\n💰 預估成本："
claude usage cost-estimate

echo -e "\n✅ 檢查完成"
EOF

chmod +x ~/check-claude-usage.sh

# 添加到crontab中，每日上午9點檢查
(crontab -l 2>/dev/null; echo "0 9 * * * ~/check-claude-usage.sh >> ~/claude-usage.log 2>&1") | crontab -
```

### 3. 配置檔案備份
```bash
# 備份當前配置（切換前）
mkdir -p ~/.config/claude/backups
cp ~/.config/claude/config.toml ~/.config/claude/backups/config-$(date +%Y%m%d).toml.backup

# 創建配置管理腳本
cat > ~/manage-claude-config.sh << 'EOF'
#!/bin/bash

case "$1" in
    backup)
        cp ~/.config/claude/config.toml ~/.config/claude/backups/config-$(date +%Y%m%d-%H%M).toml.backup
        echo "✅ 配置已備份"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "❌ 請指定要恢復的備份檔案"
            ls ~/.config/claude/backups/
            exit 1
        fi
        cp ~/.config/claude/backups/$2 ~/.config/claude/config.toml
        echo "✅ 配置已恢復"
        ;;
    list)
        echo "📁 可用的備份檔案："
        ls -la ~/.config/claude/backups/
        ;;
    *)
        echo "使用方式: $0 {backup|restore|list}"
        echo "  backup  - 備份當前配置"
        echo "  restore - 恢復指定備份 (需指定檔案名)"
        echo "  list    - 列出所有備份檔案"
        ;;
esac
EOF

chmod +x ~/manage-claude-config.sh
```

## 📞 獲取支援和故障排除

### 基本診斷命令
```bash
# 查看說明文檔
claude help config
claude help auth
claude help usage

# 檢查連線狀態
claude ping

# 驗證API Key
claude auth validate

# 檢查配置完整性
claude config validate

# 查看詳細錯誤日誌
claude logs show --level error

# 測試Token計費功能
claude test billing
```

### 常見問題解決

#### 問題1：API Key無效
```bash
# 解決方案
claude auth logout
claude auth login
# 重新輸入正確的API Key
```

#### 問題2：使用量統計不更新
```bash
# 解決方案
claude cache clear
claude usage refresh
```

#### 問題3：計費模式切換失敗
```bash
# 解決方案
claude config reset
claude auth login
claude config set billing-mode token
```

## 🔄 恢復原設定

如果需要恢復到訂閱制：
```bash
# 方法1：恢復備份的配置
~/manage-claude-config.sh restore config-YYYYMMDD.toml.backup

# 方法2：重新配置
claude auth logout
claude auth login
claude config set billing-mode subscription

# 驗證恢復結果
claude config show
claude auth status
```

## 📈 最佳實踐建議

### 1. 成本優化策略
- 🎯 **設定合理的Token限制**：根據實際需求設定每日/每月上限
- 📊 **定期檢查使用模式**：分析高消耗的操作，優化使用方式
- ⏰ **使用時間管理**：在非必要時段暫停自動化任務
- 🔍 **監控異常使用**：設定警告機制，及時發現異常消耗

### 2. 安全性建議
- 🔐 **API Key管理**：定期更換API Key，避免洩露
- 🚫 **權限控制**：為不同用途設定不同的API Key和權限
- 📝 **使用記錄**：保持詳細的使用日誌，便於審計
- 🛡️ **網路安全**：確保API Key在安全的網路環境中使用

### 3. 效率提升技巧
- 🚀 **批次處理**：合併多個小請求為單個大請求
- 📦 **快取機制**：對重複查詢使用本地快取
- 🎛️ **參數調優**：根據任務需求調整Token參數
- 📋 **任務優先級**：優先處理重要任務，延後非緊急任務

## 📋 配置檢查清單

在完成配置後，請檢查以下項目：

- [ ] ✅ API Key已正確設定並驗證
- [ ] ✅ 計費模式已切換為Token計費
- [ ] ✅ 使用量限制已按需求設定
- [ ] ✅ 成本警告閾值已設定
- [ ] ✅ 通知機制已配置
- [ ] ✅ 監控腳本已設定並測試
- [ ] ✅ 配置檔案已備份
- [ ] ✅ 使用量查詢功能正常
- [ ] ✅ 文檔和支援資源已瞭解

## 📚 相關資源

- 📖 [GitHub Copilot官方文檔](https://docs.anthropic.com/claude/docs/claude-code)
- 💰 [Anthropic計費說明](https://docs.anthropic.com/claude/docs/billing)
- 🔧 [API使用指南](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- 🆘 [技術支援](https://support.anthropic.com/)

---

**最後更新**：2025年8月4日  
**文檔版本**：v1.0  
**適用於**：GitHub Copilot v2.0+

完成這些設定後，您的GitHub Copilot將會使用Token計費方式運作，您可以更精確地控制使用成本並監控Token消耗量。建議定期檢查使用量統計，並根據實際使用模式調整配置參數。