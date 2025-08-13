#!/bin/bash

# =============================================================================
# Claude Code 任務分批處理腳本
# =============================================================================
# 功能：自動將大型任務分解為小任務，避免token消耗過大
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/batch-config.json"
BATCH_LOG="${SCRIPT_DIR}/batch-processing.log"
MAX_FILES_PER_BATCH=5
MAX_TASKS_PER_BATCH=3
DEFAULT_DELAY=3

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 日誌函數
log_info() { 
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "$msg" >> "$BATCH_LOG"
}

log_success() { 
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "$msg" >> "$BATCH_LOG"
}

log_warning() { 
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "$msg" >> "$BATCH_LOG"
}

log_error() { 
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "$msg" >> "$BATCH_LOG"
}

log_batch() {
    local batch_num="$1"
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [BATCH-$batch_num] $2"
    echo -e "${PURPLE}${msg}${NC}"
    echo "$msg" >> "$BATCH_LOG"
}

# 顯示使用說明
show_usage() {
    cat << EOF
${CYAN}Claude Code 任務分批處理工具${NC}

使用方法：
  $0 [任務類型] [選項] [參數...]

任務類型：
  ${GREEN}file-analysis${NC}    - 文件分析任務（按文件數量分批）
  ${GREEN}search-tasks${NC}     - 搜尋任務（按搜尋範圍分批）
  ${GREEN}refactor-tasks${NC}   - 重構任務（按模組分批）
  ${GREEN}test-tasks${NC}       - 測試任務（按測試套件分批）
  ${GREEN}custom-tasks${NC}     - 自定義任務（手動配置分批）

選項：
  -s, --batch-size N    每批次處理的項目數量（預設：$MAX_FILES_PER_BATCH）
  -d, --delay SECS      批次間延遲時間（預設：$DEFAULT_DELAY秒）
  -p, --parallel        啟用並行處理（實驗性功能）
  -o, --output DIR      輸出結果到指定目錄
  -r, --resume BATCH    從指定批次號碼繼續執行
  -v, --verbose         詳細輸出模式
  -n, --dry-run         試運行模式（不執行實際命令）
  -h, --help            顯示此說明

範例：
  $0 file-analysis src/ --batch-size 3 --delay 2
  $0 search-tasks "TODO|FIXME" --parallel
  $0 refactor-tasks frontend/src/ --output results/
  $0 test-tasks tests/ --resume 3

進階使用：
  $0 custom-tasks task1.txt task2.txt --batch-size 2
  $0 file-analysis large-project/ --dry-run --verbose

EOF
}

# 初始化配置
init_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "創建批次處理配置文件"
        cat > "$CONFIG_FILE" << EOF
{
  "batchSizes": {
    "file-analysis": $MAX_FILES_PER_BATCH,
    "search-tasks": 10,
    "refactor-tasks": 3,
    "test-tasks": 8,
    "custom-tasks": 5
  },
  "delays": {
    "default": $DEFAULT_DELAY,
    "heavy-tasks": 5,
    "light-tasks": 1
  },
  "tokenLimits": {
    "perBatch": 8000,
    "perFile": 2000,
    "warning": 6000
  },
  "retrySettings": {
    "maxRetries": 3,
    "retryDelay": 10
  }
}
EOF
    fi
}

# 估算token使用量
estimate_token_usage() {
    local files=("$@")
    local total_tokens=0
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
            local chars=$(wc -c < "$file" 2>/dev/null || echo "0")
            # 粗略估算：每個字符約0.75個token
            local file_tokens=$((chars * 3 / 4))
            total_tokens=$((total_tokens + file_tokens))
        fi
    done
    
    echo "$total_tokens"
}

# 創建文件分析批次
create_file_analysis_batches() {
    local target_dir="$1"
    local batch_size="$2"
    local output_dir="$3"
    
    log_info "創建文件分析批次：目錄=$target_dir，批次大小=$batch_size"
    
    # 找到所有相關文件
    local files=()
    while IFS= read -r -d '' file; do
        files+=("$file")
    done < <(find "$target_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)
    
    local total_files=${#files[@]}
    local total_batches=$(((total_files + batch_size - 1) / batch_size))
    
    log_info "找到 $total_files 個檔案，將分為 $total_batches 個批次"
    
    # 創建批次腳本
    for ((batch=1; batch<=total_batches; batch++)); do
        local start_idx=$(((batch - 1) * batch_size))
        local end_idx=$((start_idx + batch_size - 1))
        
        if [[ $end_idx -ge $total_files ]]; then
            end_idx=$((total_files - 1))
        fi
        
        local batch_files=("${files[@]:$start_idx:$batch_size}")
        local estimated_tokens=$(estimate_token_usage "${batch_files[@]}")
        
        log_batch "$batch" "處理檔案 $((start_idx + 1))-$((end_idx + 1))，預估token：$estimated_tokens"
        
        # 生成批次腳本
        local batch_script="${output_dir}/batch-${batch}-analysis.sh"
        mkdir -p "$(dirname "$batch_script")"
        
        cat > "$batch_script" << EOF
#!/bin/bash
# 批次 $batch - 檔案分析
# 處理檔案：$((start_idx + 1)) 到 $((end_idx + 1))
# 預估token使用量：$estimated_tokens

echo "開始執行批次 $batch 檔案分析..."

# 並行讀取檔案
claude --batch << 'BATCH_END'
{
  "description": "批次 $batch - 檔案分析和代碼審查",
  "tools": [
EOF
        
        # 添加讀取檔案的工具調用
        local first_file=true
        for file in "${batch_files[@]}"; do
            if [[ ! $first_file ]]; then
                echo "    }," >> "$batch_script"
            fi
            first_file=false
            
            cat >> "$batch_script" << EOF
    {
      "name": "Read",
      "parameters": {
        "file_path": "$file"
      }
EOF
        done
        
        cat >> "$batch_script" << EOF
    }
  ]
}
BATCH_END

echo "批次 $batch 完成"
sleep $DEFAULT_DELAY
EOF
        
        chmod +x "$batch_script"
        log_success "創建批次腳本：$batch_script"
    done
}

# 創建搜尋任務批次
create_search_task_batches() {
    local search_pattern="$1"
    local target_paths=("${@:2}")
    local batch_size="$2"
    local output_dir="$3"
    
    log_info "創建搜尋任務批次：模式='$search_pattern'"
    
    # 按路徑分組
    local path_groups=()
    local current_group=()
    local group_size=0
    
    for path in "${target_paths[@]}"; do
        current_group+=("$path")
        ((group_size++))
        
        if [[ $group_size -ge $batch_size ]]; then
            path_groups+=("$(IFS='|'; echo "${current_group[*]}")")
            current_group=()
            group_size=0
        fi
    done
    
    # 添加剩餘的路徑
    if [[ $group_size -gt 0 ]]; then
        path_groups+=("$(IFS='|'; echo "${current_group[*]}")")
    fi
    
    # 創建批次搜尋腳本
    for ((batch=1; batch<=${#path_groups[@]}; batch++)); do
        IFS='|' read -ra batch_paths <<< "${path_groups[$((batch-1))]}"
        
        local batch_script="${output_dir}/batch-${batch}-search.sh"
        mkdir -p "$(dirname "$batch_script")"
        
        log_batch "$batch" "搜尋路徑：${batch_paths[*]}"
        
        cat > "$batch_script" << EOF
#!/bin/bash
# 批次 $batch - 搜尋任務
# 搜尋模式：$search_pattern
# 目標路徑：${batch_paths[*]}

echo "開始執行批次 $batch 搜尋任務..."

claude --batch << 'BATCH_END'
{
  "description": "批次 $batch - 搜尋 '$search_pattern'",
  "tools": [
EOF
        
        # 為每個路徑添加搜尋工具調用
        local tool_count=0
        for path in "${batch_paths[@]}"; do
            if [[ $tool_count -gt 0 ]]; then
                echo "    }," >> "$batch_script"
            fi
            
            cat >> "$batch_script" << EOF
    {
      "name": "Grep",
      "parameters": {
        "pattern": "$search_pattern",
        "path": "$path",
        "output_mode": "files_with_matches",
        "head_limit": 30
      }
    },
    {
      "name": "Grep", 
      "parameters": {
        "pattern": "$search_pattern",
        "path": "$path",
        "output_mode": "content",
        "head_limit": 15,
        "-n": true,
        "-C": 2
      }
EOF
            ((tool_count++))
        done
        
        cat >> "$batch_script" << EOF
    }
  ]
}
BATCH_END

echo "批次 $batch 搜尋完成"
sleep $DEFAULT_DELAY
EOF
        
        chmod +x "$batch_script"
        log_success "創建搜尋批次腳本：$batch_script"
    done
}

# 創建重構任務批次
create_refactor_task_batches() {
    local target_dir="$1"
    local batch_size="$2"
    local output_dir="$3"
    
    log_info "創建重構任務批次：目標=$target_dir"
    
    # 按模組分組文件
    local modules=()
    while IFS= read -r -d '' dir; do
        if [[ -d "$dir" && $(find "$dir" -maxdepth 1 -name "*.ts" -o -name "*.tsx" | wc -l) -gt 0 ]]; then
            modules+=("$dir")
        fi
    done < <(find "$target_dir" -type d -print0)
    
    local total_modules=${#modules[@]}
    local total_batches=$(((total_modules + batch_size - 1) / batch_size))
    
    log_info "找到 $total_modules 個模組，將分為 $total_batches 個批次"
    
    for ((batch=1; batch<=total_batches; batch++)); do
        local start_idx=$(((batch - 1) * batch_size))
        local end_idx=$((start_idx + batch_size - 1))
        
        if [[ $end_idx -ge $total_modules ]]; then
            end_idx=$((total_modules - 1))
        fi
        
        local batch_modules=("${modules[@]:$start_idx:$batch_size}")
        
        log_batch "$batch" "重構模組：${batch_modules[*]}"
        
        local batch_script="${output_dir}/batch-${batch}-refactor.sh"
        mkdir -p "$(dirname "$batch_script")"
        
        cat > "$batch_script" << EOF
#!/bin/bash
# 批次 $batch - 重構任務
# 目標模組：${batch_modules[*]}

echo "開始執行批次 $batch 重構任務..."

for module in ${batch_modules[@]}; do
    echo "分析模組：\$module"
    claude --batch << "BATCH_END"
{
  "description": "模組 \$module 重構分析",
  "tools": [
    {
      "name": "LS",
      "parameters": {
        "path": "\$module"
      }
    },
    {
      "name": "Grep",
      "parameters": {
        "pattern": "(function|class|interface|export)",
        "path": "\$module",
        "output_mode": "content",
        "head_limit": 25,
        "-n": true
      }
    }
  ]
}
BATCH_END
    
    sleep 1
done

echo "批次 $batch 重構分析完成"
sleep $DEFAULT_DELAY
EOF
        
        chmod +x "$batch_script"
        log_success "創建重構批次腳本：$batch_script"
    done
}

# 執行批次處理
execute_batches() {
    local output_dir="$1"
    local start_batch="${2:-1}"
    local dry_run="${3:-false}"
    local parallel="${4:-false}"
    
    log_info "開始執行批次處理，起始批次：$start_batch"
    
    local batch_scripts=("$output_dir"/batch-*-*.sh)
    local total_batches=${#batch_scripts[@]}
    
    if [[ $total_batches -eq 0 ]]; then
        log_error "沒有找到批次腳本"
        return 1
    fi
    
    log_info "找到 $total_batches 個批次腳本"
    
    for ((i=start_batch-1; i<total_batches; i++)); do
        local batch_script="${batch_scripts[i]}"
        local batch_num=$((i + 1))
        
        log_batch "$batch_num" "執行批次腳本：$(basename "$batch_script")"
        
        if [[ "$dry_run" == "true" ]]; then
            log_info "[DRY-RUN] 將執行：$batch_script"
            cat "$batch_script"
            echo "----------------------------------------"
        else
            if [[ "$parallel" == "true" ]]; then
                bash "$batch_script" &
            else
                if ! bash "$batch_script"; then
                    log_error "批次 $batch_num 執行失敗"
                    return 1
                fi
            fi
        fi
        
        # 如果是並行模式，每5個批次等待一次
        if [[ "$parallel" == "true" && $((batch_num % 5)) -eq 0 ]]; then
            log_info "等待並行批次完成..."
            wait
        fi
    done
    
    # 等待所有並行任務完成
    if [[ "$parallel" == "true" ]]; then
        wait
        log_success "所有並行批次執行完成"
    fi
}

# 主要處理邏輯  
main() {
    local task_type=""
    local batch_size=""
    local delay="$DEFAULT_DELAY"
    local parallel="false"
    local output_dir="./batches"
    local resume_batch="1"
    local verbose="false"
    local dry_run="false"
    
    # 初始化配置
    init_config
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--batch-size)
                batch_size="$2"
                shift 2
                ;;
            -d|--delay)
                delay="$2"
                shift 2
                ;;
            -p|--parallel)
                parallel="true"
                shift
                ;;
            -o|--output)
                output_dir="$2"
                shift 2
                ;;
            -r|--resume)
                resume_batch="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            -n|--dry-run)
                dry_run="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            file-analysis|search-tasks|refactor-tasks|test-tasks|custom-tasks)
                task_type="$1"
                shift
                break
                ;;
            *)
                log_error "未知選項：$1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$task_type" ]]; then
        log_error "請指定任務類型"
        show_usage
        exit 1
    fi
    
    # 設置默認批次大小
    if [[ -z "$batch_size" ]]; then
        case $task_type in
            file-analysis) batch_size=$MAX_FILES_PER_BATCH ;;
            search-tasks) batch_size=10 ;;
            refactor-tasks) batch_size=3 ;;
            test-tasks) batch_size=8 ;;
            custom-tasks) batch_size=5 ;;
        esac
    fi
    
    log_info "任務類型：$task_type，批次大小：$batch_size，輸出目錄：$output_dir"
    
    # 根據任務類型創建批次
    case $task_type in
        file-analysis)
            if [[ $# -lt 1 ]]; then
                log_error "檔案分析需要指定目標目錄"
                exit 1
            fi
            create_file_analysis_batches "$1" "$batch_size" "$output_dir"
            ;;
        search-tasks)
            if [[ $# -lt 1 ]]; then
                log_error "搜尋任務需要指定搜尋模式"
                exit 1
            fi
            local search_pattern="$1"
            shift
            create_search_task_batches "$search_pattern" "$@" "$batch_size" "$output_dir"
            ;;
        refactor-tasks)
            if [[ $# -lt 1 ]]; then
                log_error "重構任務需要指定目標目錄"
                exit 1
            fi
            create_refactor_task_batches "$1" "$batch_size" "$output_dir"
            ;;
        test-tasks)
            log_info "測試任務批次處理（開發中）"
            ;;
        custom-tasks)
            log_info "自定義任務批次處理（開發中）"
            ;;
    esac
    
    # 執行批次處理
    if [[ "$dry_run" != "true" ]]; then
        read -p "是否要立即執行批次處理？ [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            execute_batches "$output_dir" "$resume_batch" "$dry_run" "$parallel"
        else
            log_info "批次腳本已創建在 $output_dir 目錄中"
            log_info "稍後可使用以下命令執行："
            echo "  $0 execute-batches $output_dir"
        fi
    else
        execute_batches "$output_dir" "$resume_batch" "$dry_run" "$parallel"
    fi
}

# 處理特殊命令
if [[ "$1" == "execute-batches" ]]; then
    shift
    execute_batches "$@"
    exit $?
fi

# 執行主函數
main "$@"