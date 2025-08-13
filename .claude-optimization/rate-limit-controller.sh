#!/bin/bash

# =============================================================================
# Claude Code API 速率限制控制器
# =============================================================================
# 功能：管理API請求頻率，包含延遲、重試和熔斷機制
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/rate-limit-config.json"
STATE_FILE="${SCRIPT_DIR}/.rate-limit-state"
LOG_FILE="${SCRIPT_DIR}/rate-limit.log"

# 默認設置
DEFAULT_REQUESTS_PER_MINUTE=20
DEFAULT_REQUESTS_PER_HOUR=600
DEFAULT_BASE_DELAY=3
DEFAULT_MAX_RETRIES=5
DEFAULT_CIRCUIT_BREAKER_THRESHOLD=10

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 狀態變數
declare -A request_timestamps=()
declare -A retry_counts=()
declare -A circuit_breaker_failures=()

# 日誌函數
log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [DEBUG] $1"
        echo -e "${BLUE}${msg}${NC}" >&2
        echo "$msg" >> "$LOG_FILE"
    fi
}

log_info() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_warning() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_error() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

log_rate_limit() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [RATE-LIMIT] $1"
    echo -e "${PURPLE}${msg}${NC}"
    echo "$msg" >> "$LOG_FILE"
}

# 顯示使用說明
show_usage() {
    cat << EOF
${CYAN}Claude Code API 速率限制控制器${NC}

使用方法：
  $0 [命令] [選項]

命令：
  ${GREEN}exec${NC} COMMAND      - 執行命令並應用速率限制
  ${GREEN}status${NC}            - 顯示當前速率限制狀態
  ${GREEN}reset${NC}             - 重置速率限制狀態
  ${GREEN}config${NC}            - 顯示或修改配置
  ${GREEN}monitor${NC}           - 啟動即時監控模式
  ${GREEN}test${NC}              - 測試速率限制機制

選項：
  -r, --rpm LIMIT         每分鐘請求限制（默認：$DEFAULT_REQUESTS_PER_MINUTE）
  -h, --rph LIMIT         每小時請求限制（默認：$DEFAULT_REQUESTS_PER_HOUR）
  -d, --delay SECONDS     基礎延遲時間（默認：$DEFAULT_BASE_DELAY秒）
  -m, --max-retries N     最大重試次數（默認：$DEFAULT_MAX_RETRIES）
  -c, --circuit-threshold 熔斷器閾值（默認：$DEFAULT_CIRCUIT_BREAKER_THRESHOLD）
  -f, --force             忽略速率限制強制執行
  -v, --verbose           詳細輸出模式
  --help                  顯示此說明

範例：
  $0 exec "claude --batch file1.ts file2.ts"
  $0 exec --delay 5 --max-retries 3 "claude search pattern"
  $0 status
  $0 reset
  $0 monitor &
  $0 config --rpm 15 --rph 450

進階使用：
  export RATE_LIMIT_DEBUG=true
  $0 test --verbose
  $0 exec --force "emergency-command"

EOF
}

# 初始化配置
init_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "創建速率限制配置文件"
        cat > "$CONFIG_FILE" << EOF
{
  "rateLimits": {
    "requestsPerMinute": $DEFAULT_REQUESTS_PER_MINUTE,
    "requestsPerHour": $DEFAULT_REQUESTS_PER_HOUR,
    "burstSize": 5
  },
  "delays": {
    "base": $DEFAULT_BASE_DELAY,
    "exponential": true,
    "jitter": true,
    "maxDelay": 60
  },
  "retry": {
    "maxRetries": $DEFAULT_MAX_RETRIES,
    "backoffMultiplier": 2.0,
    "retryableErrors": [
      "rate_limit_exceeded",
      "timeout",
      "connection_error"
    ]
  },
  "circuitBreaker": {
    "failureThreshold": $DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
    "recoveryTimeout": 300,
    "halfOpenMaxCalls": 3
  },
  "monitoring": {
    "enableMetrics": true,
    "metricsRetentionDays": 7,
    "alertThresholds": {
      "errorRate": 0.1,
      "responseTime": 30
    }
  }
}
EOF
        log_info "配置文件已創建：$CONFIG_FILE"
    fi
    
    # 加載配置
    if command -v jq > /dev/null; then
        REQUESTS_PER_MINUTE=$(jq -r '.rateLimits.requestsPerMinute' "$CONFIG_FILE")
        REQUESTS_PER_HOUR=$(jq -r '.rateLimits.requestsPerHour' "$CONFIG_FILE")
        BASE_DELAY=$(jq -r '.delays.base' "$CONFIG_FILE")
        MAX_RETRIES=$(jq -r '.retry.maxRetries' "$CONFIG_FILE")
        CIRCUIT_BREAKER_THRESHOLD=$(jq -r '.circuitBreaker.failureThreshold' "$CONFIG_FILE")
    else
        # Fallback如果沒有jq
        REQUESTS_PER_MINUTE=$DEFAULT_REQUESTS_PER_MINUTE
        REQUESTS_PER_HOUR=$DEFAULT_REQUESTS_PER_HOUR
        BASE_DELAY=$DEFAULT_BASE_DELAY
        MAX_RETRIES=$DEFAULT_MAX_RETRIES
        CIRCUIT_BREAKER_THRESHOLD=$DEFAULT_CIRCUIT_BREAKER_THRESHOLD
    fi
}

# 加載狀態
load_state() {
    if [[ -f "$STATE_FILE" ]]; then
        source "$STATE_FILE" 2>/dev/null || true
    fi
}

# 保存狀態
save_state() {
    {
        echo "# Rate Limit State - $(date)"
        declare -p request_timestamps 2>/dev/null || true
        declare -p retry_counts 2>/dev/null || true
        declare -p circuit_breaker_failures 2>/dev/null || true
    } > "$STATE_FILE"
}

# 獲取當前時間戳
get_timestamp() {
    date +%s
}

# 清理過期的請求記錄
cleanup_old_requests() {
    local current_time=$(get_timestamp)
    local hour_ago=$((current_time - 3600))
    local minute_ago=$((current_time - 60))
    
    # 清理超過1小時的記錄
    for key in "${!request_timestamps[@]}"; do
        if [[ "${request_timestamps[$key]}" -lt "$hour_ago" ]]; then
            unset request_timestamps["$key"]
        fi
    done
}

# 計算當前請求頻率
get_current_request_rate() {
    local current_time=$(get_timestamp)
    local minute_ago=$((current_time - 60))
    local hour_ago=$((current_time - 3600))
    
    local requests_last_minute=0
    local requests_last_hour=0
    
    for timestamp in "${request_timestamps[@]}"; do
        if [[ "$timestamp" -gt "$minute_ago" ]]; then
            ((requests_last_minute++))
        fi
        if [[ "$timestamp" -gt "$hour_ago" ]]; then
            ((requests_last_hour++))
        fi
    done
    
    echo "$requests_last_minute $requests_last_hour"
}

# 檢查是否可以執行請求
can_make_request() {
    local current_rates=($(get_current_request_rate))
    local requests_last_minute=${current_rates[0]}
    local requests_last_hour=${current_rates[1]}
    
    log_debug "當前請求頻率：每分鐘 $requests_last_minute/$REQUESTS_PER_MINUTE，每小時 $requests_last_hour/$REQUESTS_PER_HOUR"
    
    if [[ "$requests_last_minute" -ge "$REQUESTS_PER_MINUTE" ]]; then
        log_rate_limit "每分鐘請求限制已達到：$requests_last_minute/$REQUESTS_PER_MINUTE"
        return 1
    fi
    
    if [[ "$requests_last_hour" -ge "$REQUESTS_PER_HOUR" ]]; then
        log_rate_limit "每小時請求限制已達到：$requests_last_hour/$REQUESTS_PER_HOUR"
        return 1
    fi
    
    return 0
}

# 記錄請求
record_request() {
    local request_id="$1"
    local current_time=$(get_timestamp)
    
    request_timestamps["$request_id"]="$current_time"
    cleanup_old_requests
    save_state
    
    log_debug "記錄請求：$request_id 於 $current_time"
}

# 計算延遲時間
calculate_delay() {
    local attempt="$1"
    local base_delay="$2"
    
    # 指數退避算法
    local delay=$((base_delay * (2 ** (attempt - 1))))
    
    # 添加隨機抖動（±20%）
    local jitter=$((RANDOM % (delay / 5 + 1)))
    local sign=$((RANDOM % 2))
    
    if [[ $sign -eq 0 ]]; then
        delay=$((delay - jitter))
    else
        delay=$((delay + jitter))
    fi
    
    # 確保不超過最大延遲
    local max_delay=60
    if [[ $delay -gt $max_delay ]]; then
        delay=$max_delay
    fi
    
    # 確保最小延遲
    if [[ $delay -lt $base_delay ]]; then
        delay=$base_delay
    fi
    
    echo "$delay"
}

# 執行帶重試的請求
execute_with_retry() {
    local command="$1"
    local max_retries="$2"
    local request_id="req_$(date +%s)_$$"
    
    log_info "執行請求：$command"
    
    for ((attempt=1; attempt<=max_retries; attempt++)); do
        log_debug "嘗試第 $attempt 次執行"
        
        # 檢查速率限制
        if ! can_make_request; then
            local delay=$(calculate_delay $attempt $BASE_DELAY)
            log_rate_limit "等待 $delay 秒後重試..."
            sleep "$delay"
            continue
        fi
        
        # 記錄請求
        record_request "$request_id"
        
        # 執行命令
        local start_time=$(get_timestamp)
        if eval "$command"; then
            local end_time=$(get_timestamp)
            local duration=$((end_time - start_time))
            log_info "請求成功執行，耗時 $duration 秒"
            
            # 重置重試計數
            unset retry_counts["$command"]
            unset circuit_breaker_failures["$command"]
            return 0
        else
            local exit_code=$?
            local end_time=$(get_timestamp)
            local duration=$((end_time - start_time))
            
            log_error "請求執行失敗（第 $attempt 次），耗時 $duration 秒，退出碼：$exit_code"
            
            # 記錄失敗
            retry_counts["$command"]=$attempt
            circuit_breaker_failures["$command"]=$((${circuit_breaker_failures["$command"]:-0} + 1))
            
            # 檢查熔斷器
            if [[ ${circuit_breaker_failures["$command"]} -ge $CIRCUIT_BREAKER_THRESHOLD ]]; then
                log_error "熔斷器觸發：$command 失敗次數過多"
                return $exit_code
            fi
            
            # 如果不是最後一次嘗試，等待後重試
            if [[ $attempt -lt $max_retries ]]; then
                local delay=$(calculate_delay $attempt $BASE_DELAY)
                log_warning "將在 $delay 秒後重試第 $((attempt + 1)) 次..."
                sleep "$delay"
            fi
        fi
    done
    
    log_error "所有重試嘗試均失敗"
    return 1
}

# 顯示狀態
show_status() {
    log_info "Claude Code API 速率限制狀態"
    echo ""
    
    local current_rates=($(get_current_request_rate))
    local requests_last_minute=${current_rates[0]}
    local requests_last_hour=${current_rates[1]}
    
    echo -e "${CYAN}請求頻率統計：${NC}"
    echo "  每分鐘請求：$requests_last_minute / $REQUESTS_PER_MINUTE"
    echo "  每小時請求：$requests_last_hour / $REQUESTS_PER_HOUR"
    echo ""
    
    echo -e "${CYAN}配置設定：${NC}"
    echo "  基礎延遲：$BASE_DELAY 秒"
    echo "  最大重試：$MAX_RETRIES 次"
    echo "  熔斷器閾值：$CIRCUIT_BREAKER_THRESHOLD 次失敗"
    echo ""
    
    if [[ ${#retry_counts[@]} -gt 0 ]]; then
        echo -e "${CYAN}重試統計：${NC}"
        for cmd in "${!retry_counts[@]}"; do
            echo "  $(echo "$cmd" | cut -c1-50)... : ${retry_counts[$cmd]} 次重試"
        done
        echo ""
    fi
    
    if [[ ${#circuit_breaker_failures[@]} -gt 0 ]]; then
        echo -e "${CYAN}熔斷器狀態：${NC}"
        for cmd in "${!circuit_breaker_failures[@]}"; do
            local failures=${circuit_breaker_failures[$cmd]}
            local status="正常"
            if [[ $failures -ge $CIRCUIT_BREAKER_THRESHOLD ]]; then
                status="熔斷"
            fi
            echo "  $(echo "$cmd" | cut -c1-50)... : $failures 次失敗 ($status)"
        done
    fi
}

# 重置狀態
reset_state() {
    log_info "重置速率限制狀態"
    
    request_timestamps=()
    retry_counts=()
    circuit_breaker_failures=()
    
    rm -f "$STATE_FILE"
    log_info "狀態已重置"
}

# 監控模式
monitor_mode() {
    log_info "啟動速率限制監控模式 (Ctrl+C 停止)"
    
    while true; do
        clear
        echo -e "${CYAN}=== Claude Code API 速率限制監控 ===${NC}"
        echo "更新時間：$(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        show_status
        
        sleep 5
    done
}

# 測試模式
test_mode() {
    local verbose="$1"
    
    log_info "執行速率限制測試"
    
    # 測試1：正常請求
    echo -e "${CYAN}測試1：正常請求${NC}"
    execute_with_retry "echo 'Test command 1'" "$MAX_RETRIES"
    
    # 測試2：快速連續請求
    echo -e "${CYAN}測試2：快速連續請求${NC}"
    for i in {1..5}; do
        execute_with_retry "echo 'Rapid test $i'" "$MAX_RETRIES" &
    done
    wait
    
    # 測試3：模擬失敗命令
    echo -e "${CYAN}測試3：模擬失敗命令${NC}"
    execute_with_retry "false" 3
    
    echo -e "${GREEN}測試完成${NC}"
    show_status
}

# 更新配置
update_config() {
    local param="$1"
    local value="$2"
    
    if ! command -v jq > /dev/null; then
        log_error "需要 jq 工具來更新配置"
        return 1
    fi
    
    case $param in
        rpm|requests-per-minute)
            jq ".rateLimits.requestsPerMinute = $value" "$CONFIG_FILE" > tmp.$$ && mv tmp.$$ "$CONFIG_FILE"
            ;;
        rph|requests-per-hour)
            jq ".rateLimits.requestsPerHour = $value" "$CONFIG_FILE" > tmp.$$ && mv tmp.$$ "$CONFIG_FILE"
            ;;
        delay)
            jq ".delays.base = $value" "$CONFIG_FILE" > tmp.$$ && mv tmp.$$ "$CONFIG_FILE"
            ;;
        max-retries)
            jq ".retry.maxRetries = $value" "$CONFIG_FILE" > tmp.$$ && mv tmp.$$ "$CONFIG_FILE"
            ;;
        circuit-threshold)
            jq ".circuitBreaker.failureThreshold = $value" "$CONFIG_FILE" > tmp.$$ && mv tmp.$$ "$CONFIG_FILE"
            ;;
        *)
            log_error "未知配置參數：$param"
            return 1
            ;;
    esac
    
    log_info "配置已更新：$param = $value"
    init_config  # 重新加載配置
}

# 主要處理邏輯
main() {
    local command=""
    local force="false"
    local verbose="false"
    
    # 初始化
    init_config
    load_state
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            exec)
                command="exec"
                shift
                break
                ;;
            status)
                show_status
                exit 0
                ;;
            reset)
                reset_state
                exit 0
                ;;
            config)
                command="config"
                shift
                ;;
            monitor)
                monitor_mode
                exit 0
                ;;
            test)
                command="test"
                shift
                ;;
            -r|--rpm)
                REQUESTS_PER_MINUTE="$2"
                shift 2
                ;;
            -h|--rph)
                REQUESTS_PER_HOUR="$2"
                shift 2
                ;;
            -d|--delay)
                BASE_DELAY="$2"
                shift 2
                ;;
            -m|--max-retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            -c|--circuit-threshold)
                CIRCUIT_BREAKER_THRESHOLD="$2"
                shift 2
                ;;
            -f|--force)
                force="true"
                shift
                ;;
            -v|--verbose)
                verbose="true"
                DEBUG="true"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    case $command in
        exec)
            if [[ $# -eq 0 ]]; then
                log_error "請提供要執行的命令"
                exit 1
            fi
            
            local target_command="$*"
            
            if [[ "$force" == "true" ]]; then
                log_warning "強制執行模式，忽略速率限制"
                eval "$target_command"
            else
                execute_with_retry "$target_command" "$MAX_RETRIES"
            fi
            ;;
        config)
            if [[ $# -eq 0 ]]; then
                # 顯示配置
                if [[ -f "$CONFIG_FILE" ]]; then
                    cat "$CONFIG_FILE"
                else
                    log_error "配置文件不存在"
                fi
            else
                # 更新配置
                while [[ $# -gt 0 ]]; do
                    case $1 in
                        --rpm)
                            update_config "rpm" "$2"
                            shift 2
                            ;;
                        --rph)
                            update_config "rph" "$2"
                            shift 2
                            ;;
                        --delay)
                            update_config "delay" "$2"
                            shift 2
                            ;;
                        --max-retries)
                            update_config "max-retries" "$2"
                            shift 2
                            ;;
                        --circuit-threshold)
                            update_config "circuit-threshold" "$2"
                            shift 2
                            ;;
                        *)
                            log_error "未知配置選項：$1"
                            shift
                            ;;
                    esac
                done
            fi
            ;;
        test)
            test_mode "$verbose"
            ;;
        *)
            log_error "請指定命令：exec, status, reset, config, monitor, test"
            show_usage
            exit 1
            ;;
    esac
}

# 信號處理
trap 'save_state; exit 0' EXIT
trap 'log_info "收到中斷信號"; save_state; exit 1' INT TERM

# 執行主函數
main "$@"