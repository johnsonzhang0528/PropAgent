# Claude Code API 速率限制避免策略

## 專案概述

本工具套件提供了一套完整的Claude Code API速率限制避免策略，包含自動化腳本和配置文件，幫助開發者最佳化token使用、控制請求頻率，並監控成本消耗。

## 🚀 功能特性

### 核心功能
- **批次工具調用助手** - 自動將多個操作合併為單一請求
- **精確搜尋模板** - 預定義搜尋模式，提高搜尋效率
- **任務分批處理** - 自動將大型任務分解為小批次執行
- **速率限制控制** - 智能管理API請求頻率
- **成本監控系統** - 即時監控token使用量和成本

### 進階特性
- **指數退避重試** - 智能重試機制避免速率限制
- **熔斷器保護** - 防止持續失敗的請求
- **成本預警系統** - 超出預算時自動告警
- **詳細使用報告** - 多格式使用統計報告
- **即時監控儀表板** - 視覺化監控介面

## 📦 安裝和設置

### 系統要求
- Linux/Unix 系統（支援 WSL2）
- Bash 4.0+
- 基本工具：bc, grep, awk, sed, find

### 快速安裝
```bash
# 1. 克隆或複製工具到本地
cd /path/to/tmux-orchestrator/tools/claude-optimization

# 2. 檢查依賴
./claude-optimizer.sh --check

# 3. 安裝缺失依賴
./claude-optimizer.sh --install-deps

# 4. 執行快速檢查
./claude-optimizer.sh quick
```

### 可選依賴
```bash
# 安裝 jq (JSON 處理，推薦)
sudo apt-get install jq

# 安裝 Claude CLI (必要)
# 請參考 Claude Code 官方文檔
```

## 🛠️ 工具說明

### 1. 主工具腳本 (claude-optimizer.sh)
整合所有工具的主入口腳本。

```bash
# 顯示所有可用工具
./claude-optimizer.sh --help

# 快速最佳化檢查
./claude-optimizer.sh quick

# 查看功能演示
./claude-optimizer.sh demo
```

### 2. 批次工具調用助手 (batch-tool-helper.sh)
將多個Claude工具操作合併為單一請求，大幅降低API調用次數。

```bash
# 批次搜尋
./claude-optimizer.sh batch search "*.ts" "function.*Error" --size 5

# 批次讀取文件
./claude-optimizer.sh batch read file1.ts file2.ts file3.ts

# 批次編輯操作
./claude-optimizer.sh batch edit replace "oldText" "newText" file1.ts file2.ts
```

### 3. 精確搜尋模板 (search-templates.sh)
提供預定義的搜尋模式，提高搜尋精度並減少token消耗。

```bash
# 列出所有可用模板
./claude-optimizer.sh search --list

# 搜尋錯誤處理代碼
./claude-optimizer.sh search errors src/

# 搜尋React組件
./claude-optimizer.sh search components frontend/src/components/

# 搜尋TODO註釋（僅顯示計數）
./claude-optimizer.sh search todos . --count-only
```

**可用模板：**
- `errors` - 錯誤和異常處理
- `functions` - 函數定義
- `components` - React組件
- `types` - TypeScript類型定義
- `imports` - Import語句
- `todos` - TODO和FIXME註釋
- `configs` - 配置文件
- `tests` - 測試文件
- `apis` - API相關代碼
- `security` - 安全相關代碼
- `performance` - 性能相關代碼
- `deprecated` - 廢棄代碼

### 4. 任務分批處理器 (task-batch-processor.sh)
自動將大型任務分解為多個小批次，避免單次請求token過多。

```bash
# 文件分析任務
./claude-optimizer.sh task file-analysis src/ --batch-size 3 --delay 2

# 搜尋任務
./claude-optimizer.sh task search-tasks "TODO|FIXME" --parallel

# 重構任務
./claude-optimizer.sh task refactor-tasks frontend/src/ --output results/

# 從指定批次繼續執行
./claude-optimizer.sh task file-analysis src/ --resume 3
```

### 5. 速率限制控制器 (rate-limit-controller.sh)
智能管理API請求頻率，包含重試機制和熔斷器保護。

```bash
# 執行命令並應用速率限制
./claude-optimizer.sh rate exec "claude search pattern *.ts"

# 顯示速率限制狀態
./claude-optimizer.sh rate status

# 重置速率限制狀態
./claude-optimizer.sh rate reset

# 啟動即時監控
./claude-optimizer.sh rate monitor &

# 測試速率限制機制
./claude-optimizer.sh rate test --verbose
```

### 6. 成本監控器 (cost-monitor.sh)
監控token使用量和成本，提供詳細的使用報告和最佳化建議。

```bash
# 分析單個文件的成本
./claude-optimizer.sh cost analyze large-file.ts

# 生成成本報告
./claude-optimizer.sh cost report --period 30 --format json

# 顯示最佳化建議
./claude-optimizer.sh cost optimize

# 估算命令成本
./claude-optimizer.sh cost estimate "claude search pattern *.ts"

# 檢查成本預警
./claude-optimizer.sh cost alert --threshold 75.0

# 顯示即時儀表板
./claude-optimizer.sh cost dashboard
```

## 📊 配置文件

### 批次配置 (batch-config.json)
```json
{
  "batchSizeLimit": 10,
  "defaultDelay": 2,
  "enableCostOptimization": true,
  "templates": {
    "search": {
      "maxFiles": 20,
      "defaultGlob": "**/*.{ts,tsx,js,jsx}",
      "headLimit": 50
    }
  }
}
```

### 速率限制配置 (rate-limit-config.json)
```json
{
  "rateLimits": {
    "requestsPerMinute": 20,
    "requestsPerHour": 600,
    "burstSize": 5
  },
  "delays": {
    "base": 3,
    "exponential": true,
    "jitter": true,
    "maxDelay": 60
  }
}
```

### 成本配置 (cost-config.json)
```json
{
  "pricing": {
    "models": {
      "claude-sonnet": {
        "inputCostPer1k": 0.003,
        "outputCostPer1k": 0.015
      },
      "claude-haiku": {
        "inputCostPer1k": 0.00025,
        "outputCostPer1k": 0.00125
      }
    }
  },
  "thresholds": {
    "dailyTokenWarning": 100000,
    "dailyCostWarning": 50.0
  }
}
```

## 💡 最佳實踐

### Token使用最佳化
1. **精確任務範圍**
   - ✅ 指定具體的檔案、目錄或功能範圍
   - ❌ 避免「檢查整個專案的所有問題」
   - ✅ 使用「檢查 src/components/ 目錄下的 TypeScript 錯誤」

2. **分批處理策略**
   - 將大型任務分解為 3-5 個小任務
   - 每次只處理 1-3 個相關檔案
   - 完成一批後再處理下一批

3. **工具使用效率**
   - 優先使用 Grep 和 Glob 進行精確搜尋
   - 使用 `head_limit` 參數限制輸出
   - 批次執行多個 Bash 命令

### 成本控制策略
1. **回應簡潔性**
   - 回應控制在 4 行以內（除非明確要求詳細）
   - 避免不必要的解釋和總結
   - 直接回答問題，不加前綴後綴

2. **禁止的高成本行為**
   - ❌ 讀取完整的 node_modules 內容
   - ❌ 分析大型構建輸出或日誌
   - ❌ 重複說明已知的專案結構
   - ❌ 生成冗長的解釋文檔

3. **模型選擇建議**
   - **Haiku**: 適合簡單搜尋和讀取任務（成本低 83%）
   - **Sonnet**: 適合複雜分析和重構任務（成本較高）

## 🔧 使用範例

### 範例 1: 批次分析多個檔案
```bash
# 1. 分析檔案token使用量
./claude-optimizer.sh cost analyze src/components/Header.tsx

# 2. 創建批次分析任務
./claude-optimizer.sh task file-analysis src/components/ --batch-size 3

# 3. 監控執行過程
./claude-optimizer.sh rate monitor &
```

### 範例 2: 高效搜尋和最佳化
```bash
# 1. 使用模板搜尋錯誤處理
./claude-optimizer.sh search errors src/ --output error-report.txt

# 2. 搜尋TODO項目
./claude-optimizer.sh search todos . --count-only

# 3. 檢查搜尋成本
./claude-optimizer.sh cost estimate "claude search 'TODO' --glob '**/*.ts'"
```

### 範例 3: 大型專案重構
```bash
# 1. 創建重構任務批次
./claude-optimizer.sh task refactor-tasks frontend/src/ --output refactor-batches/

# 2. 設置速率限制
./claude-optimizer.sh rate config --rpm 15 --delay 5

# 3. 執行重構批次
./claude-optimizer.sh task execute-batches refactor-batches/

# 4. 監控成本
./claude-optimizer.sh cost monitor &
```

## 📈 監控和報告

### 即時監控
```bash
# 速率限制監控
./claude-optimizer.sh rate monitor

# 成本監控儀表板
./claude-optimizer.sh cost dashboard
```

### 報告生成
```bash
# 文本格式報告
./claude-optimizer.sh cost report --period 7 --format text

# JSON格式報告
./claude-optimizer.sh cost report --period 30 --format json --output monthly-report.json

# CSV格式報告（適合Excel分析）
./claude-optimizer.sh cost export --format csv --output usage-data.csv
```

### 預警系統
```bash
# 設置成本預警
./claude-optimizer.sh cost alert --threshold 50.0

# 檢查速率限制狀態
./claude-optimizer.sh rate status
```

## 🚨 故障排除

### 常見問題

1. **權限錯誤**
   ```bash
   # 確保腳本有執行權限
   chmod +x *.sh
   ```

2. **依賴缺失**
   ```bash
   # 檢查並安裝依賴
   ./claude-optimizer.sh --check
   ./claude-optimizer.sh --install-deps
   ```

3. **配置文件缺失**
   ```bash
   # 工具會自動創建配置文件
   ./claude-optimizer.sh quick
   ```

4. **Claude CLI 不可用**
   ```bash
   # 檢查Claude CLI安裝
   which claude
   claude --version
   ```

### 日誌文件位置
- **批次處理日誌**: `batch-processing.log`
- **速率限制日誌**: `rate-limit.log`
- **成本使用日誌**: `token-usage.log`
- **成本預警日誌**: `cost-alerts.log`

### 重置工具狀態
```bash
# 重置速率限制狀態
./claude-optimizer.sh rate reset

# 清理所有日誌文件
rm -f *.log

# 重新初始化配置
rm -f *-config.json && ./claude-optimizer.sh quick
```

## 🤝 貢獻指南

### 開發環境設置
```bash
# 克隆專案
git clone <repository-url>
cd tmux-orchestrator/tools/claude-optimization

# 檢查開發環境
./claude-optimizer.sh --check

# 執行測試
./claude-optimizer.sh rate test
```

### 添加新功能
1. 創建新的工具腳本
2. 更新主工具腳本 `claude-optimizer.sh`
3. 添加配置選項到相應的JSON文件
4. 更新README文檔

### 測試
```bash
# 功能測試
./claude-optimizer.sh demo

# 速率限制測試
./claude-optimizer.sh rate test --verbose

# 成本估算測試
./claude-optimizer.sh cost estimate "echo test"
```

## 📝 版本歷史

### v1.0.0 (2025-08-13)
- ✅ 初始版本發布
- ✅ 批次工具調用助手
- ✅ 精確搜尋模板系統
- ✅ 任務分批處理器
- ✅ 速率限制控制器
- ✅ 成本監控和最佳化系統
- ✅ 完整的文檔和使用範例

## 📞 支援和回饋

如果您在使用過程中遇到問題或有改進建議，請：

1. 查看本文檔的故障排除章節
2. 執行 `./claude-optimizer.sh quick` 進行系統檢查
3. 查看相關日誌文件獲取詳細錯誤資訊
4. 聯繫 Tmux Orchestrator Team

## 📄 授權條款

本工具套件屬於 Tmux Orchestrator 專案的一部分，遵循專案的開源授權條款。

---

**注意**: 本工具套件旨在幫助開發者更高效地使用Claude Code API，請確保遵循Anthropic的使用條款和API限制。