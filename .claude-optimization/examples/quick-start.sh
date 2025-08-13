#!/bin/bash

# =============================================================================
# Claude Code API 速率限制避免策略 - 快速開始範例
# =============================================================================
# 功能：演示工具套件的基本使用方法
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 設定工具路徑
TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPTIMIZER="${TOOLS_DIR}/claude-optimizer.sh"

# 顏色配置
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}=== Claude Code API 最佳化工具快速開始 ===${NC}"
echo ""

# 步驟 1: 檢查系統狀態
echo -e "${GREEN}步驟 1: 檢查系統狀態${NC}"
echo "執行快速最佳化檢查..."
"$OPTIMIZER" quick
echo ""

# 步驟 2: 演示搜尋模板
echo -e "${GREEN}步驟 2: 演示精確搜尋模板${NC}"
echo "列出所有可用的搜尋模板："
"$OPTIMIZER" search --list
echo ""

# 步驟 3: 演示批次工具
echo -e "${GREEN}步驟 3: 演示批次工具助手${NC}"
echo "生成批次搜尋命令範例："
"$OPTIMIZER" batch search "*.ts" "function.*Error" --size 5
echo ""

# 步驟 4: 演示成本分析
echo -e "${GREEN}步驟 4: 演示成本分析${NC}"
echo "顯示最佳化建議："
"$OPTIMIZER" cost optimize --model sonnet
echo ""

# 步驟 5: 演示速率控制
echo -e "${GREEN}步驟 5: 演示速率限制控制${NC}"
echo "顯示速率限制狀態："
"$OPTIMIZER" rate status
echo ""

# 完成
echo -e "${YELLOW}快速開始演示完成！${NC}"
echo ""
echo -e "${CYAN}接下來您可以：${NC}"
echo "  1. 使用 '$OPTIMIZER search errors .' 搜尋專案中的錯誤"
echo "  2. 使用 '$OPTIMIZER cost dashboard' 開啟成本監控儀表板"
echo "  3. 使用 '$OPTIMIZER rate monitor &' 開啟背景速率監控"
echo "  4. 閱讀完整文檔：less ${TOOLS_DIR}/README.md"