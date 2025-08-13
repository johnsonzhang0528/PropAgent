#!/bin/bash

# =============================================================================
# Claude Code API 速率限制避免策略 - 主工具腳本
# =============================================================================
# 功能：整合所有最佳化工具的主入口腳本
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$SCRIPT_DIR"

# 工具腳本路徑
BATCH_HELPER="${TOOLS_DIR}/batch-tool-helper.sh"
SEARCH_TEMPLATES="${TOOLS_DIR}/search-templates.sh"
TASK_PROCESSOR="${TOOLS_DIR}/task-batch-processor.sh"
RATE_CONTROLLER="${TOOLS_DIR}/rate-limit-controller.sh"
COST_MONITOR="${TOOLS_DIR}/cost-monitor.sh"

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# 版本資訊
VERSION="1.0.0"
BUILD_DATE="2025-08-13"

# 日誌函數
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 顯示標題
show_banner() {
    echo -e "${CYAN}${BOLD}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║             Claude Code API 速率限制避免策略               ║
║                     最佳化工具套件                        ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "版本：${GREEN}$VERSION${NC} | 建置日期：${YELLOW}$BUILD_DATE${NC}"
    echo ""
}

# 顯示使用說明
show_usage() {
    show_banner
    
    cat << EOF
${CYAN}使用方法：${NC}
  $0 [工具名稱] [選項...]

${CYAN}可用工具：${NC}
  ${GREEN}batch${NC}            - 批次工具調用助手
  ${GREEN}search${NC}           - 精確搜尋模板工具
  ${GREEN}task${NC}             - 任務分批處理工具
  ${GREEN}rate${NC}             - 速率限制控制器
  ${GREEN}cost${NC}             - 成本監控和最佳化
  ${GREEN}quick${NC}            - 快速最佳化檢查
  ${GREEN}demo${NC}             - 演示所有工具功能

${CYAN}全域選項：${NC}
  -h, --help        顯示此說明
  -v, --version     顯示版本資訊
  --check           檢查工具依賴性
  --install-deps    安裝必要依賴

${CYAN}快速範例：${NC}
  $0 batch search "*.ts" "function.*Error"
  $0 search errors src/ --count-only
  $0 task file-analysis frontend/ --batch-size 3
  $0 rate exec "claude search pattern"
  $0 cost analyze large-file.ts
  $0 quick

${CYAN}進階使用：${NC}
  $0 demo                    # 查看所有工具演示
  $0 cost monitor &          # 背景監控成本
  $0 rate monitor &          # 背景監控速率限制

更多詳細說明請參考：
  $0 [工具名稱] --help

EOF
}

# 檢查工具依賴
check_dependencies() {
    log_info "檢查工具依賴性"
    
    local missing_deps=()
    local optional_deps=()
    
    # 必要工具
    if ! command -v bc >/dev/null; then
        missing_deps+=("bc")
    fi
    
    if ! command -v date >/dev/null; then
        missing_deps+=("coreutils")
    fi
    
    # 可選工具
    if ! command -v jq >/dev/null; then
        optional_deps+=("jq")
    fi
    
    if ! command -v claude >/dev/null; then
        optional_deps+=("claude")
    fi
    
    # 報告結果
    if [[ ${#missing_deps[@]} -eq 0 ]]; then
        log_success "所有必要依賴已滿足"
    else
        log_error "缺少必要依賴：${missing_deps[*]}"
        echo "請執行：sudo apt-get install ${missing_deps[*]}"
        return 1
    fi
    
    if [[ ${#optional_deps[@]} -gt 0 ]]; then
        log_warning "缺少可選依賴：${optional_deps[*]}"
        echo "建議安裝以獲得完整功能"
    fi
    
    # 檢查工具腳本
    local tools=("$BATCH_HELPER" "$SEARCH_TEMPLATES" "$TASK_PROCESSOR" "$RATE_CONTROLLER" "$COST_MONITOR")
    for tool in "${tools[@]}"; do
        if [[ ! -x "$tool" ]]; then
            log_error "工具腳本不存在或無執行權限：$(basename "$tool")"
            return 1
        fi
    done
    
    log_success "所有工具腳本檢查通過"
    return 0
}

# 安裝依賴
install_dependencies() {
    log_info "安裝必要依賴"
    
    # 檢查包管理器
    if command -v apt-get >/dev/null; then
        sudo apt-get update
        sudo apt-get install -y bc jq curl
    elif command -v yum >/dev/null; then
        sudo yum install -y bc jq curl
    elif command -v brew >/dev/null; then
        brew install bc jq
    else
        log_error "無法識別包管理器，請手動安裝：bc, jq"
        return 1
    fi
    
    log_success "依賴安裝完成"
}

# 快速最佳化檢查
quick_optimization_check() {
    echo -e "${BOLD}${CYAN}Claude Code 快速最佳化檢查${NC}"
    echo ""
    
    local score=0
    local max_score=10
    
    # 檢查1：工具腳本存在性
    echo -e "${CYAN}🔧 檢查工具可用性...${NC}"
    if check_dependencies >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ 所有工具正常可用${NC}"
        ((score++))
    else
        echo -e "  ${RED}✗ 工具依賴不完整${NC}"
    fi
    
    # 檢查2：配置文件
    echo -e "${CYAN}⚙️ 檢查配置文件...${NC}"
    local configs=("${TOOLS_DIR}/batch-config.json" "${TOOLS_DIR}/rate-limit-config.json" "${TOOLS_DIR}/cost-config.json")
    local config_count=0
    for config in "${configs[@]}"; do
        if [[ -f "$config" ]]; then
            ((config_count++))
        fi
    done
    
    if [[ $config_count -gt 1 ]]; then
        echo -e "  ${GREEN}✓ 配置文件已初始化 ($config_count/3)${NC}"
        ((score++))
    else
        echo -e "  ${YELLOW}⚠ 部分配置文件缺失 ($config_count/3)${NC}"
    fi
    
    # 檢查3：使用記錄
    echo -e "${CYAN}📊 檢查使用記錄...${NC}"
    if [[ -f "${TOOLS_DIR}/token-usage.log" ]]; then
        local log_lines=$(wc -l < "${TOOLS_DIR}/token-usage.log")
        if [[ $log_lines -gt 0 ]]; then
            echo -e "  ${GREEN}✓ 發現使用記錄 ($log_lines 條)${NC}"
            ((score++))
        else
            echo -e "  ${YELLOW}⚠ 使用記錄為空${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠ 無使用記錄${NC}"
    fi
    
    # 檢查4：模板文件
    echo -e "${CYAN}📝 檢查搜尋模板...${NC}"
    if [[ -d "${TOOLS_DIR}/templates" ]]; then
        local template_count=$(find "${TOOLS_DIR}/templates" -name "*.json" | wc -l)
        if [[ $template_count -gt 5 ]]; then
            echo -e "  ${GREEN}✓ 搜尋模板豐富 ($template_count 個)${NC}"
            ((score+=2))
        else
            echo -e "  ${YELLOW}⚠ 搜尋模板較少 ($template_count 個)${NC}"
            ((score++))
        fi
    else
        echo -e "  ${RED}✗ 搜尋模板目錄不存在${NC}"
    fi
    
    # 檢查5：批次處理腳本
    echo -e "${CYAN}📦 檢查批次處理能力...${NC}"
    if [[ -x "$BATCH_HELPER" ]]; then
        echo -e "  ${GREEN}✓ 批次工具助手可用${NC}"
        ((score++))
    else
        echo -e "  ${RED}✗ 批次工具助手不可用${NC}"
    fi
    
    if [[ -x "$TASK_PROCESSOR" ]]; then
        echo -e "  ${GREEN}✓ 任務分批處理器可用${NC}"
        ((score++))
    else
        echo -e "  ${RED}✗ 任務分批處理器不可用${NC}"
    fi
    
    # 檢查6：速率控制
    echo -e "${CYAN}⏱️ 檢查速率控制...${NC}"
    if [[ -x "$RATE_CONTROLLER" ]]; then
        echo -e "  ${GREEN}✓ 速率限制控制器可用${NC}"
        ((score++))
    else
        echo -e "  ${RED}✗ 速率限制控制器不可用${NC}"
    fi
    
    # 檢查7：成本監控
    echo -e "${CYAN}💰 檢查成本監控...${NC}"
    if [[ -x "$COST_MONITOR" ]]; then
        echo -e "  ${GREEN}✓ 成本監控工具可用${NC}"
        ((score++))
    else
        echo -e "  ${RED}✗ 成本監控工具不可用${NC}"
    fi
    
    # 計算分數和建議
    echo ""
    echo -e "${BOLD}評分結果：${score}/${max_score}${NC}"
    
    local percentage=$((score * 100 / max_score))
    
    if [[ $percentage -ge 80 ]]; then
        echo -e "${GREEN}🎉 優秀！您的Claude Code最佳化配置非常完善${NC}"
    elif [[ $percentage -ge 60 ]]; then
        echo -e "${YELLOW}👍 良好！大部分最佳化功能已配置${NC}"
        echo -e "${CYAN}建議：${NC}完善缺失的配置以獲得更好的最佳化效果"
    else
        echo -e "${RED}⚠️ 需要改進！請完善最佳化工具配置${NC}"
        echo -e "${CYAN}建議：${NC}執行 $0 --install-deps 安裝依賴"
    fi
    
    echo ""
    echo -e "${CYAN}💡 快速改進建議：${NC}"
    echo "  1. 執行各工具的初始化命令"
    echo "  2. 設置適合的配置參數"
    echo "  3. 開始使用批次處理功能"
    echo "  4. 定期檢查成本監控報告"
}

# 演示所有工具功能
demo_tools() {
    show_banner
    echo -e "${CYAN}${BOLD}工具功能演示${NC}"
    echo ""
    
    echo -e "${GREEN}1. 批次工具調用助手${NC}"
    echo "   用途：將多個操作合併為單一請求"
    echo "   範例：$0 batch search '*.ts' 'function.*Error' --size 5"
    echo ""
    
    echo -e "${GREEN}2. 精確搜尋模板工具${NC}"
    echo "   用途：使用預定義模板進行高效搜尋"
    echo "   範例：$0 search errors src/ --count-only"
    echo "   可用模板：errors, functions, components, types, imports, todos"
    echo ""
    
    echo -e "${GREEN}3. 任務分批處理工具${NC}"
    echo "   用途：將大型任務自動分解為小批次"
    echo "   範例：$0 task file-analysis frontend/ --batch-size 3"
    echo ""
    
    echo -e "${GREEN}4. 速率限制控制器${NC}"
    echo "   用途：管理API請求頻率，避免超出限制"
    echo "   範例：$0 rate exec 'claude search pattern'"
    echo "   監控：$0 rate monitor"
    echo ""
    
    echo -e "${GREEN}5. 成本監控和最佳化${NC}"
    echo "   用途：監控token使用量和成本"
    echo "   範例：$0 cost analyze large-file.ts"
    echo "   儀表板：$0 cost dashboard"
    echo ""
    
    echo -e "${YELLOW}想要詳細了解特定工具？${NC}"
    echo "執行：$0 [工具名稱] --help"
    echo ""
    
    echo -e "${CYAN}建議的使用流程：${NC}"
    echo "  1. 使用 'quick' 檢查配置狀態"
    echo "  2. 使用 'search' 工具快速定位代碼"
    echo "  3. 使用 'batch' 工具合併操作"
    echo "  4. 使用 'rate' 控制請求頻率"
    echo "  5. 使用 'cost' 監控使用情況"
}

# 顯示版本資訊
show_version() {
    show_banner
    echo -e "${CYAN}版本詳情：${NC}"
    echo "  版本號：$VERSION"
    echo "  建置日期：$BUILD_DATE"
    echo "  作者：Tmux Orchestrator Team"
    echo "  專案：Claude Code API 速率限制避免策略"
    echo ""
    echo -e "${CYAN}包含工具：${NC}"
    echo "  • batch-tool-helper.sh - 批次工具調用助手"
    echo "  • search-templates.sh - 精確搜尋模板工具"
    echo "  • task-batch-processor.sh - 任務分批處理工具"
    echo "  • rate-limit-controller.sh - 速率限制控制器"
    echo "  • cost-monitor.sh - 成本監控和最佳化"
}

# 主要處理邏輯
main() {
    # 如果沒有參數，顯示使用說明
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 0
    fi
    
    # 解析全域選項
    case "$1" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--version)
            show_version
            exit 0
            ;;
        --check)
            check_dependencies
            exit $?
            ;;
        --install-deps)
            install_dependencies
            exit $?
            ;;
        quick)
            quick_optimization_check
            exit 0
            ;;
        demo)
            demo_tools
            exit 0
            ;;
        batch)
            shift
            exec "$BATCH_HELPER" "$@"
            ;;
        search)
            shift
            exec "$SEARCH_TEMPLATES" "$@"
            ;;
        task)
            shift
            exec "$TASK_PROCESSOR" "$@"
            ;;
        rate)
            shift
            exec "$RATE_CONTROLLER" "$@"
            ;;
        cost)
            shift
            exec "$COST_MONITOR" "$@"
            ;;
        *)
            log_error "未知工具或選項：$1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"