#!/bin/bash

# =============================================================================
# Claude Code 成本監控和最佳化檢查清單
# =============================================================================
# 功能：監控Token使用量，提供成本最佳化建議
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/cost-config.json"
USAGE_LOG="${SCRIPT_DIR}/token-usage.log"
REPORT_DIR="${SCRIPT_DIR}/reports"
ALERTS_FILE="${SCRIPT_DIR}/cost-alerts.log"

# Token 價格 (以美元計算，每1000個token)
CLAUDE_SONNET_INPUT_COST=0.003
CLAUDE_SONNET_OUTPUT_COST=0.015
CLAUDE_HAIKU_INPUT_COST=0.00025
CLAUDE_HAIKU_OUTPUT_COST=0.00125

# 預警閾值
DAILY_TOKEN_WARNING=100000
DAILY_COST_WARNING=50.0
HOURLY_TOKEN_WARNING=10000

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# 日誌函數
log_info() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$USAGE_LOG"
}

log_warning() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$USAGE_LOG"
    echo "$msg" >> "$ALERTS_FILE"
}

log_error() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$USAGE_LOG"
    echo "$msg" >> "$ALERTS_FILE"
}

log_success() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$USAGE_LOG"
}

log_cost() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [COST] $1"
    echo -e "${PURPLE}${msg}${NC}"
    echo "$msg" >> "$USAGE_LOG"
}

# 顯示使用說明
show_usage() {
    cat << EOF
${CYAN}Claude Code 成本監控和最佳化工具${NC}

使用方法：
  $0 [命令] [選項]

命令：
  ${GREEN}monitor${NC}           - 即時監控token使用量
  ${GREEN}analyze${NC} FILE      - 分析指定文件的token使用量
  ${GREEN}report${NC}            - 生成成本使用報告
  ${GREEN}optimize${NC}          - 顯示最佳化建議
  ${GREEN}estimate${NC} COMMAND  - 估算命令的token消耗
  ${GREEN}alert${NC}             - 檢查成本預警
  ${GREEN}dashboard${NC}         - 顯示成本儀表板
  ${GREEN}export${NC}            - 匯出使用數據

選項：
  -p, --period DAYS       分析週期（默認：7天）
  -f, --format FORMAT     報告格式：text|json|csv（默認：text）
  -o, --output FILE       輸出報告到文件
  -t, --threshold VALUE   設置預警閾值
  -m, --model MODEL       指定模型：sonnet|haiku（默認：sonnet）
  -v, --verbose           詳細輸出模式
  -h, --help              顯示此說明

範例：
  $0 monitor --verbose
  $0 analyze large-file.ts
  $0 report --period 30 --format json
  $0 estimate "claude search pattern *.ts"
  $0 optimize --model haiku
  $0 dashboard

進階功能：
  $0 alert --threshold 75.0
  $0 export --format csv --output usage-data.csv

EOF
}

# 初始化配置
init_config() {
    mkdir -p "$REPORT_DIR"
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "創建成本監控配置文件"
        cat > "$CONFIG_FILE" << EOF
{
  "pricing": {
    "models": {
      "claude-sonnet": {
        "inputCostPer1k": $CLAUDE_SONNET_INPUT_COST,
        "outputCostPer1k": $CLAUDE_SONNET_OUTPUT_COST
      },
      "claude-haiku": {
        "inputCostPer1k": $CLAUDE_HAIKU_INPUT_COST,
        "outputCostPer1k": $CLAUDE_HAIKU_OUTPUT_COST
      }
    }
  },
  "thresholds": {
    "dailyTokenWarning": $DAILY_TOKEN_WARNING,
    "dailyCostWarning": $DAILY_COST_WARNING,
    "hourlyTokenWarning": $HOURLY_TOKEN_WARNING
  },
  "optimization": {
    "maxFilesPerBatch": 5,
    "maxTokensPerRequest": 8000,
    "recommendedHeadLimit": 50,
    "costEfficiencyTargets": {
      "tokensPerDollar": 1000,
      "averageResponseTime": 10
    }
  },
  "monitoring": {
    "enableRealTimeAlerts": true,
    "reportInterval": "daily",
    "retentionDays": 30
  }
}
EOF
        log_info "配置文件已創建"
    fi
}

# 估算文件的token數量
estimate_file_tokens() {
    local file_path="$1"
    
    if [[ ! -f "$file_path" ]]; then
        echo "0"
        return
    fi
    
    local char_count=$(wc -c < "$file_path" 2>/dev/null || echo "0")
    local line_count=$(wc -l < "$file_path" 2>/dev/null || echo "0")
    local word_count=$(wc -w < "$file_path" 2>/dev/null || echo "0")
    
    # 使用改進的token估算公式
    # 考慮不同類型文件的token密度
    local file_ext="${file_path##*.}"
    local token_multiplier=1.0
    
    case "$file_ext" in
        ts|tsx|js|jsx)
            token_multiplier=0.8  # 代碼文件通常token密度較高
            ;;
        json)
            token_multiplier=0.6  # JSON格式較緊湊
            ;;
        md|txt)
            token_multiplier=1.2  # 純文本token密度較低
            ;;
        *)
            token_multiplier=1.0
            ;;
    esac
    
    # 基於字符數的估算（1個token約4個字符）+ 行數補償
    local estimated_tokens=$(echo "scale=0; ($char_count / 4 + $line_count * 0.5) * $token_multiplier" | bc -l 2>/dev/null || echo "$((char_count / 4))")
    
    echo "${estimated_tokens%.*}"  # 移除小數部分
}

# 計算成本
calculate_cost() {
    local input_tokens="$1"
    local output_tokens="$2"
    local model="${3:-sonnet}"
    
    local input_cost output_cost
    
    case "$model" in
        haiku)
            input_cost=$(echo "scale=6; $input_tokens * $CLAUDE_HAIKU_INPUT_COST / 1000" | bc -l)
            output_cost=$(echo "scale=6; $output_tokens * $CLAUDE_HAIKU_OUTPUT_COST / 1000" | bc -l)
            ;;
        sonnet|*)
            input_cost=$(echo "scale=6; $input_tokens * $CLAUDE_SONNET_INPUT_COST / 1000" | bc -l)
            output_cost=$(echo "scale=6; $output_tokens * $CLAUDE_SONNET_OUTPUT_COST / 1000" | bc -l)
            ;;
    esac
    
    local total_cost=$(echo "scale=6; $input_cost + $output_cost" | bc -l)
    echo "$total_cost"
}

# 分析文件token使用量
analyze_file() {
    local file_path="$1"
    local model="${2:-sonnet}"
    
    log_info "分析文件：$file_path"
    
    if [[ ! -f "$file_path" ]]; then
        log_error "文件不存在：$file_path"
        return 1
    fi
    
    local file_size=$(du -h "$file_path" | cut -f1)
    local line_count=$(wc -l < "$file_path")
    local char_count=$(wc -c < "$file_path")
    local estimated_tokens=$(estimate_file_tokens "$file_path")
    
    # 假設輸出token為輸入token的20%
    local estimated_output_tokens=$((estimated_tokens / 5))
    local estimated_cost=$(calculate_cost "$estimated_tokens" "$estimated_output_tokens" "$model")
    
    echo -e "${CYAN}文件分析報告：${NC}"
    echo "  文件路徑：$file_path"
    echo "  文件大小：$file_size"
    echo "  行數：$line_count"
    echo "  字符數：$char_count"
    echo "  預估輸入Token：$estimated_tokens"
    echo "  預估輸出Token：$estimated_output_tokens"
    echo "  預估成本：\$${estimated_cost} USD"
    
    # 提供最佳化建議
    if [[ $estimated_tokens -gt 8000 ]]; then
        log_warning "文件過大！建議分批處理或使用head_limit限制"
        echo -e "${YELLOW}最佳化建議：${NC}"
        echo "  - 使用 --head-limit 50 限制輸出"
        echo "  - 將文件分為 $((estimated_tokens / 8000 + 1)) 個批次處理"
        echo "  - 考慮使用更具體的搜尋條件"
    fi
    
    # 記錄到使用日誌
    log_cost "文件分析 $file_path: ${estimated_tokens}token, \$${estimated_cost}"
}

# 生成成本報告
generate_report() {
    local period="${1:-7}"
    local format="${2:-text}"
    local output_file="$3"
    
    local report_file="${output_file:-${REPORT_DIR}/cost-report-$(date +%Y%m%d).${format}}"
    local start_date=$(date -d "$period days ago" +%Y-%m-%d)
    
    log_info "生成 $period 天成本報告，格式：$format"
    
    case "$format" in
        json)
            generate_json_report "$period" "$report_file"
            ;;
        csv)
            generate_csv_report "$period" "$report_file"
            ;;
        text|*)
            generate_text_report "$period" "$report_file"
            ;;
    esac
    
    log_success "報告已生成：$report_file"
}

# 生成文本格式報告
generate_text_report() {
    local period="$1"
    local report_file="$2"
    
    {
        echo "=============================================="
        echo "Claude Code 成本使用報告"
        echo "生成時間：$(date)"
        echo "分析週期：最近 $period 天"
        echo "=============================================="
        echo ""
        
        echo "## 概要統計"
        if [[ -f "$USAGE_LOG" ]]; then
            local total_requests=$(grep -c "\[COST\]" "$USAGE_LOG" 2>/dev/null || echo "0")
            local total_cost=$(grep "\[COST\]" "$USAGE_LOG" 2>/dev/null | grep -oE '\$[0-9]*\.[0-9]*' | sed 's/\$//' | awk '{sum+=$1} END {printf "%.6f", sum}')
            
            echo "  總請求數：$total_requests"
            echo "  總成本：\$${total_cost:-0.000000} USD"
            echo "  平均每請求成本：\$$(echo "scale=6; ${total_cost:-0} / ($total_requests + 0.000001)" | bc -l) USD"
        else
            echo "  無使用記錄"
        fi
        
        echo ""
        echo "## 成本分析"
        echo "  高成本操作警告："
        
        if [[ -f "$ALERTS_FILE" ]]; then
            local high_cost_count=$(grep -c "WARNING" "$ALERTS_FILE" 2>/dev/null || echo "0")
            echo "    - 共發現 $high_cost_count 個高成本操作警告"
            
            if [[ $high_cost_count -gt 0 ]]; then
                echo "  最近的警告："
                tail -5 "$ALERTS_FILE" 2>/dev/null | sed 's/^/    /'
            fi
        else
            echo "    - 無高成本操作警告"
        fi
        
        echo ""
        echo "## 最佳化建議"
        echo "  1. 使用批次工具合併多個操作"
        echo "  2. 設置適當的head_limit值"
        echo "  3. 使用精確的搜尋模式"
        echo "  4. 避免處理過大的文件"
        echo "  5. 優先使用Haiku模型處理簡單任務"
        
        echo ""
        echo "## 詳細使用記錄"
        if [[ -f "$USAGE_LOG" ]]; then
            tail -20 "$USAGE_LOG" 2>/dev/null | sed 's/^/  /'
        else
            echo "  無詳細記錄"
        fi
        
    } > "$report_file"
}

# 生成JSON格式報告
generate_json_report() {
    local period="$1" 
    local report_file="$2"
    
    local total_requests=0
    local total_cost="0.000000"
    local warning_count=0
    
    if [[ -f "$USAGE_LOG" ]]; then
        total_requests=$(grep -c "\[COST\]" "$USAGE_LOG" 2>/dev/null || echo "0")
        total_cost=$(grep "\[COST\]" "$USAGE_LOG" 2>/dev/null | grep -oE '\$[0-9]*\.[0-9]*' | sed 's/\$//' | awk '{sum+=$1} END {printf "%.6f", sum}')
    fi
    
    if [[ -f "$ALERTS_FILE" ]]; then
        warning_count=$(grep -c "WARNING" "$ALERTS_FILE" 2>/dev/null || echo "0")
    fi
    
    cat > "$report_file" << EOF
{
  "reportGenerated": "$(date -Iseconds)",
  "period": "$period days",
  "summary": {
    "totalRequests": $total_requests,
    "totalCost": ${total_cost:-0.000000},
    "averageCostPerRequest": $(echo "scale=6; ${total_cost:-0} / ($total_requests + 0.000001)" | bc -l),
    "warningCount": $warning_count
  },
  "costBreakdown": {
    "inputTokens": "estimated",
    "outputTokens": "estimated",
    "modelUsage": {
      "sonnet": "primary",
      "haiku": "secondary"
    }
  },
  "optimization": {
    "recommendations": [
      "Use batch processing for multiple operations",
      "Set appropriate head_limit values", 
      "Use precise search patterns",
      "Avoid processing oversized files",
      "Prefer Haiku model for simple tasks"
    ],
    "potentialSavings": "estimated 20-40%"
  }
}
EOF
}

# 生成CSV格式報告
generate_csv_report() {
    local period="$1"
    local report_file="$2"
    
    {
        echo "timestamp,operation,tokens,cost,model,notes"
        
        if [[ -f "$USAGE_LOG" ]]; then
            grep "\[COST\]" "$USAGE_LOG" | while IFS= read -r line; do
                local timestamp=$(echo "$line" | grep -oE '^\[[^]]+\]' | sed 's/\[//; s/\]//')
                local operation=$(echo "$line" | sed 's/.*\[COST\] //' | cut -d: -f1)
                local tokens=$(echo "$line" | grep -oE '[0-9]+token' | sed 's/token//')
                local cost=$(echo "$line" | grep -oE '\$[0-9]*\.[0-9]*' | sed 's/\$//')
                
                echo "$timestamp,\"$operation\",${tokens:-0},${cost:-0.000000},sonnet,standard"
            done
        fi
    } > "$report_file"
}

# 顯示最佳化建議
show_optimization_suggestions() {
    local model="${1:-sonnet}"
    
    echo -e "${BOLD}${CYAN}Claude Code 成本最佳化建議${NC}"
    echo ""
    
    echo -e "${GREEN}🎯 精確任務範圍${NC}"
    echo "  ✓ 指定具體的檔案、目錄或功能範圍"
    echo "  ✗ 避免 '檢查整個專案的所有問題'"
    echo "  ✓ 使用 '檢查 src/components/ 目錄下的 TypeScript 錯誤'"
    echo ""
    
    echo -e "${GREEN}📊 分批處理策略${NC}"
    echo "  ✓ 將大型任務分解為 3-5 個小任務"
    echo "  ✓ 每次只處理 1-3 個相關檔案"
    echo "  ✓ 使用 batch-tool-helper.sh 腳本"
    echo ""
    
    echo -e "${GREEN}🔧 工具使用效率${NC}"
    echo "  ✓ 優先使用 Grep 和 Glob 進行精確搜尋"
    echo "  ✓ 使用 head_limit 參數限制輸出"
    echo "  ✓ 批次執行多個 Bash 命令"
    echo ""
    
    echo -e "${GREEN}📝 回應簡潔性${NC}"
    echo "  ✓ 回應控制在 4 行以內"
    echo "  ✓ 避免不必要的解釋和總結"
    echo "  ✓ 直接回答問題，不加前綴後綴"
    echo ""
    
    echo -e "${GREEN}🚫 禁止的高成本行為${NC}"
    echo "  ❌ 讀取完整的 node_modules 內容"
    echo "  ❌ 分析大型構建輸出或日誌"
    echo "  ❌ 重複說明已知的專案結構"
    echo "  ❌ 生成冗長的解釋文檔"
    echo ""
    
    if [[ "$model" == "haiku" ]]; then
        echo -e "${PURPLE}🏃 Haiku 模型建議${NC}"
        echo "  ✓ 適合簡單的搜尋和讀取任務"
        echo "  ✓ 成本比 Sonnet 低 83%"
        echo "  ✓ 適合批次處理小文件"
    else
        echo -e "${PURPLE}🧠 Sonnet 模型建議${NC}"
        echo "  ✓ 適合複雜的分析和重構任務"
        echo "  ✓ 更好的代碼理解能力"
        echo "  ⚠️ 成本較高，謹慎使用"
    fi
    
    echo ""
    echo -e "${YELLOW}💡 實用工具推薦${NC}"
    echo "  • batch-tool-helper.sh - 批次工具調用"
    echo "  • search-templates.sh - 精確搜尋模板"
    echo "  • task-batch-processor.sh - 任務分批處理"
    echo "  • rate-limit-controller.sh - 速率限制控制"
}

# 估算命令成本
estimate_command_cost() {
    local command="$1"
    local model="${2:-sonnet}"
    
    log_info "估算命令成本：$command"
    
    local estimated_tokens=0
    
    # 根據命令類型估算token使用量
    if [[ "$command" =~ "grep".*"--glob".*"\*\*/" ]]; then
        estimated_tokens=5000  # 大範圍搜尋
    elif [[ "$command" =~ "read" ]]; then
        # 從命令中提取文件路徑並估算
        local files=$(echo "$command" | grep -oE '[a-zA-Z0-9/_.-]+\.(ts|tsx|js|jsx|json|md)')
        for file in $files; do
            if [[ -f "$file" ]]; then
                local file_tokens=$(estimate_file_tokens "$file")
                estimated_tokens=$((estimated_tokens + file_tokens))
            fi
        done
    elif [[ "$command" =~ "batch" ]]; then
        estimated_tokens=8000  # 批次操作
    else
        estimated_tokens=2000  # 一般命令
    fi
    
    local estimated_output_tokens=$((estimated_tokens / 5))
    local estimated_cost=$(calculate_cost "$estimated_tokens" "$estimated_output_tokens" "$model")
    
    echo -e "${CYAN}命令成本估算：${NC}"
    echo "  命令：$command"
    echo "  模型：$model"
    echo "  預估輸入Token：$estimated_tokens"
    echo "  預估輸出Token：$estimated_output_tokens"
    echo "  預估成本：\$${estimated_cost} USD"
    
    # 提供成本最佳化建議
    if (( $(echo "$estimated_cost > 0.05" | bc -l) )); then
        log_warning "高成本操作！成本估算：\$${estimated_cost}"
        echo -e "${YELLOW}建議：${NC}"
        echo "  - 考慮分批處理"
        echo "  - 使用更精確的搜尋條件"
        echo "  - 考慮使用 Haiku 模型（成本降低 83%）"
    fi
    
    # 記錄估算結果
    log_cost "命令估算 $command: ${estimated_tokens}token, \$${estimated_cost}"
}

# 檢查成本預警
check_cost_alerts() {
    local threshold="${1:-50.0}"
    
    log_info "檢查成本預警，閾值：\$${threshold}"
    
    if [[ ! -f "$USAGE_LOG" ]]; then
        log_info "無使用記錄"
        return 0
    fi
    
    # 計算今日成本
    local today=$(date +%Y-%m-%d)
    local today_cost=$(grep "$today.*\[COST\]" "$USAGE_LOG" 2>/dev/null | grep -oE '\$[0-9]*\.[0-9]*' | sed 's/\$//' | awk '{sum+=$1} END {printf "%.2f", sum}')
    
    echo -e "${CYAN}成本預警檢查：${NC}"
    echo "  今日成本：\$${today_cost:-0.00} USD"
    echo "  預警閾值：\$${threshold} USD"
    
    if (( $(echo "${today_cost:-0} > $threshold" | bc -l) )); then
        log_warning "今日成本已超過預警閾值！"
        echo -e "${RED}⚠️ 成本預警觸發${NC}"
        echo "  建議立即檢視使用情況並實施成本控制措施"
    else
        log_success "成本在正常範圍內"
        echo -e "${GREEN}✓ 成本正常${NC}"
    fi
}

# 顯示成本儀表板
show_dashboard() {
    clear
    echo -e "${BOLD}${CYAN}═══ Claude Code 成本監控儀表板 ═══${NC}"
    echo "更新時間：$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 今日統計
    local today=$(date +%Y-%m-%d)
    if [[ -f "$USAGE_LOG" ]]; then
        local today_requests=$(grep "$today.*\[COST\]" "$USAGE_LOG" 2>/dev/null | wc -l)
        local today_cost=$(grep "$today.*\[COST\]" "$USAGE_LOG" 2>/dev/null | grep -oE '\$[0-9]*\.[0-9]*' | sed 's/\$//' | awk '{sum+=$1} END {printf "%.6f", sum}')
        
        echo -e "${CYAN}📊 今日統計${NC}"
        echo "  請求次數：$today_requests"
        echo "  總成本：\$${today_cost:-0.000000} USD"
        echo "  平均成本：\$$(echo "scale=6; ${today_cost:-0} / ($today_requests + 0.000001)" | bc -l) USD/請求"
    else
        echo -e "${CYAN}📊 今日統計${NC}"
        echo "  無使用記錄"
    fi
    
    echo ""
    
    # 成本警告
    local warning_count=0
    if [[ -f "$ALERTS_FILE" ]]; then
        warning_count=$(grep "$today.*WARNING" "$ALERTS_FILE" 2>/dev/null | wc -l)
    fi
    
    echo -e "${CYAN}⚠️ 預警狀態${NC}"
    if [[ $warning_count -gt 0 ]]; then
        echo -e "  ${RED}發現 $warning_count 個高成本操作警告${NC}"
    else
        echo -e "  ${GREEN}無成本預警${NC}"
    fi
    
    echo ""
    
    # 最佳化建議摘要
    echo -e "${CYAN}💡 快速最佳化檢查${NC}"
    echo "  ✓ 使用批次處理工具"
    echo "  ✓ 設置 head_limit 限制"
    echo "  ✓ 避免大文件處理"
    echo "  ✓ 優先考慮 Haiku 模型"
    
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 退出監控${NC}"
}

# 導出使用數據
export_data() {
    local format="${1:-csv}"
    local output_file="${2:-usage-export-$(date +%Y%m%d).${format}}"
    
    log_info "導出使用數據，格式：$format"
    
    case "$format" in
        csv)
            generate_csv_report "30" "$output_file"
            ;;
        json)
            generate_json_report "30" "$output_file"
            ;;
        *)
            log_error "不支援的格式：$format"
            return 1
            ;;
    esac
    
    log_success "數據已導出：$output_file"
}

# 即時監控模式
monitor_mode() {
    log_info "啟動即時成本監控（按 Ctrl+C 停止）"
    
    while true; do
        show_dashboard
        sleep 10
    done
}

# 主要處理邏輯
main() {
    local command=""
    local period="7"
    local format="text"
    local output_file=""
    local threshold=""
    local model="sonnet"
    local verbose="false"
    
    # 初始化配置
    init_config
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            monitor)
                monitor_mode
                exit 0
                ;;
            analyze)
                command="analyze"
                shift
                ;;
            report)
                command="report"
                shift
                ;;
            optimize)
                show_optimization_suggestions "$model"
                exit 0
                ;;
            estimate)
                command="estimate"
                shift
                ;;
            alert)
                command="alert"
                shift
                ;;
            dashboard)
                show_dashboard
                exit 0
                ;;
            export)
                command="export"
                shift
                ;;
            -p|--period)
                period="$2"
                shift 2
                ;;
            -f|--format)
                format="$2"
                shift 2
                ;;
            -o|--output)
                output_file="$2"
                shift 2
                ;;
            -t|--threshold)
                threshold="$2"
                shift 2
                ;;
            -m|--model)
                model="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    case "$command" in
        analyze)
            if [[ $# -eq 0 ]]; then
                log_error "請指定要分析的文件"
                exit 1
            fi
            analyze_file "$1" "$model"
            ;;
        report)
            generate_report "$period" "$format" "$output_file"
            ;;
        estimate)
            if [[ $# -eq 0 ]]; then
                log_error "請提供要估算的命令"
                exit 1
            fi
            estimate_command_cost "$*" "$model"
            ;;
        alert)
            check_cost_alerts "${threshold:-50.0}"
            ;;
        export)
            export_data "$format" "$output_file"
            ;;
        "")
            show_usage
            ;;
        *)
            log_error "未知命令：$command"
            show_usage
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"