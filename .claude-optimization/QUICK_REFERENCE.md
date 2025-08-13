# Claude Code API 速率限制避免策略 - 快速參考

## 🚀 快速開始

```bash
# 1. 進入工具目錄
cd /home/johnson/ai-dev-projects/Tmux-Orchestrator/tools/claude-optimization

# 2. 檢查系統狀態
./claude-optimizer.sh quick

# 3. 執行快速演示
./examples/quick-start.sh

# 4. 開始使用工具
./claude-optimizer.sh --help
```

## 📋 常用命令速查

### 主工具命令
```bash
./claude-optimizer.sh quick                    # 快速最佳化檢查
./claude-optimizer.sh demo                     # 查看功能演示
./claude-optimizer.sh --check                  # 檢查依賴
./claude-optimizer.sh --install-deps           # 安裝依賴
```

### 批次工具
```bash
# 批次搜尋
./claude-optimizer.sh batch search "*.ts" "function.*Error" --size 5

# 批次讀取
./claude-optimizer.sh batch read file1.ts file2.ts file3.ts

# 批次編輯
./claude-optimizer.sh batch edit replace "old" "new" file1.ts file2.ts
```

### 搜尋模板
```bash
./claude-optimizer.sh search --list            # 列出所有模板
./claude-optimizer.sh search errors src/       # 搜尋錯誤處理
./claude-optimizer.sh search components ui/    # 搜尋React組件
./claude-optimizer.sh search todos . --count   # 統計TODO數量
```

### 任務分批處理
```bash
# 文件分析
./claude-optimizer.sh task file-analysis src/ --batch-size 3

# 搜尋任務
./claude-optimizer.sh task search-tasks "TODO|FIXME" --parallel

# 重構任務
./claude-optimizer.sh task refactor-tasks frontend/ --output results/
```

### 速率限制控制
```bash
./claude-optimizer.sh rate status              # 查看狀態
./claude-optimizer.sh rate reset               # 重置狀態
./claude-optimizer.sh rate monitor             # 即時監控
./claude-optimizer.sh rate exec "command"      # 執行命令
```

### 成本監控
```bash
./claude-optimizer.sh cost analyze file.ts     # 分析文件成本
./claude-optimizer.sh cost dashboard           # 成本儀表板
./claude-optimizer.sh cost optimize            # 最佳化建議
./claude-optimizer.sh cost report              # 生成報告
./claude-optimizer.sh cost alert               # 檢查預警
```

## 🎯 最佳化原則

### ✅ 推薦做法
- 指定具體檔案和目錄範圍
- 使用預定義搜尋模板
- 設置適當的 head_limit
- 批次處理多個操作
- 定期監控成本使用

### ❌ 避免做法
- 搜尋整個專案所有文件
- 處理超大文件不設限制
- 忽略速率限制警告
- 不監控token消耗
- 重複執行相同操作

## 📊 Token 使用估算

| 操作類型 | 預估Token | 適用場景 |
|---------|----------|---------|
| 簡單搜尋 | 100-500 | 精確pattern搜尋 |
| 文件讀取 | 1000-3000 | 中小型文件分析 |
| 批次操作 | 3000-8000 | 多文件處理 |
| 複雜分析 | 5000-15000 | 代碼架構分析 |

## 🔧 快速故障排除

### 權限問題
```bash
chmod +x *.sh                    # 設置執行權限
```

### 依賴缺失
```bash
./claude-optimizer.sh --check    # 檢查依賴
sudo apt-get install bc jq       # 安裝基本依賴
```

### 配置重置
```bash
rm -f *-config.json              # 刪除配置文件
./claude-optimizer.sh quick      # 重新初始化
```

### 清理日誌
```bash
rm -f *.log                      # 清理所有日誌
```

## 📱 監控儀表板

### 即時監控
```bash
# 終端 1: 速率監控
./claude-optimizer.sh rate monitor

# 終端 2: 成本監控  
./claude-optimizer.sh cost dashboard

# 終端 3: 執行工作
./claude-optimizer.sh batch search "*.ts" "error"
```

## 🎪 使用流程建議

### 新專案分析流程
```bash
# 1. 快速檢查
./claude-optimizer.sh quick

# 2. 初步搜尋
./claude-optimizer.sh search todos .
./claude-optimizer.sh search errors src/

# 3. 深入分析（分批處理）
./claude-optimizer.sh task file-analysis src/ --batch-size 3

# 4. 監控執行
./claude-optimizer.sh cost monitor &
```

### 日常維護流程
```bash
# 1. 檢查昨日成本
./claude-optimizer.sh cost report --period 1

# 2. 清理過期日誌
find . -name "*.log" -mtime +7 -delete

# 3. 更新配置（如需要）
./claude-optimizer.sh rate config --rpm 20

# 4. 執行預警檢查
./claude-optimizer.sh cost alert --threshold 50
```

## 📞 取得幫助

```bash
# 工具幫助
./claude-optimizer.sh --help
./claude-optimizer.sh [tool] --help

# 查看詳細文檔
less README.md

# 執行系統檢查
./claude-optimizer.sh quick --verbose

# 查看日誌
tail -f token-usage.log
```

## 🔄 版本更新

```bash
# 檢查工具版本
./claude-optimizer.sh --version

# 備份現有配置
cp *-config.json backup/

# 更新工具（如有新版本）
git pull origin main

# 恢復配置
cp backup/*-config.json .
```