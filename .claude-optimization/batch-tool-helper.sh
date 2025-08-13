#!/bin/bash

# =============================================================================
# Claude Code 批次工具調用助手腳本
# =============================================================================
# 功能：自動將多個操作合併為單一請求，避免API速率限制
# 作者：Tmux Orchestrator Team
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/batch-config.json"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
BATCH_SIZE_LIMIT=10
DEFAULT_DELAY=2

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 顯示使用說明
show_usage() {
    cat << EOF
使用方法：
  $0 [選項] [命令類型] [參數...]

選項：
  -h, --help          顯示此說明
  -c, --config FILE   指定配置文件
  -d, --delay SECS    設置請求間延遲（秒）
  -s, --size LIMIT    設置批次大小限制
  -v, --verbose       詳細輸出模式

命令類型：
  search              批次搜尋操作
  read                批次讀取檔案
  edit                批次編輯操作
  analyze             批次分析操作
  custom              自定義批次操作

範例：
  $0 search "*.ts" "function.*Error" --size 5
  $0 read file1.ts file2.ts file3.ts
  $0 edit replace "oldText" "newText" file1.ts file2.ts
  $0 analyze complexity src/components/

EOF
}

# 初始化配置
init_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "創建默認配置文件：$CONFIG_FILE"
        cat > "$CONFIG_FILE" << EOF
{
  "batchSizeLimit": $BATCH_SIZE_LIMIT,
  "defaultDelay": $DEFAULT_DELAY,
  "enableCostOptimization": true,
  "templates": {
    "search": {
      "maxFiles": 20,
      "defaultGlob": "**/*.{ts,tsx,js,jsx}",
      "headLimit": 50
    },
    "read": {
      "maxFiles": 10,
      "chunkSize": 2000
    },
    "edit": {
      "maxFiles": 5,
      "backupEnabled": true
    }
  }
}
EOF
        log_success "配置文件已創建"
    fi
}

# 創建批次搜尋命令
create_batch_search() {
    local glob_pattern="$1"
    local search_pattern="$2"
    local size_limit="$3"
    
    log_info "準備批次搜尋：模式='$search_pattern' 檔案='$glob_pattern'"
    
    cat << EOF
# 批次搜尋操作 - 自動合併為單一請求
# 搜尋模式：$search_pattern
# 檔案模式：$glob_pattern
# 批次大小：$size_limit

claude --batch << 'BATCH_END'
{
  "tools": [
    {
      "name": "Glob",
      "parameters": {
        "pattern": "$glob_pattern"
      }
    },
    {
      "name": "Grep", 
      "parameters": {
        "pattern": "$search_pattern",
        "glob": "$glob_pattern",
        "output_mode": "files_with_matches",
        "head_limit": ${size_limit:-50}
      }
    },
    {
      "name": "Grep",
      "parameters": {
        "pattern": "$search_pattern", 
        "glob": "$glob_pattern",
        "output_mode": "content",
        "head_limit": ${size_limit:-20},
        "-n": true,
        "-C": 2
      }
    }
  ]
}
BATCH_END
EOF
}

# 創建批次讀取命令
create_batch_read() {
    local files=("$@")
    local chunk_size=5
    
    log_info "準備批次讀取 ${#files[@]} 個檔案"
    
    for ((i=0; i<${#files[@]}; i+=chunk_size)); do
        local chunk=("${files[@]:i:chunk_size}")
        
        echo "# 批次讀取 - 第 $((i/chunk_size + 1)) 批"
        echo "claude --batch << 'BATCH_END'"
        echo "{"
        echo '  "tools": ['
        
        for ((j=0; j<${#chunk[@]}; j++)); do
            local file="${chunk[j]}"
            echo "    {"
            echo '      "name": "Read",'
            echo "      \"parameters\": {"
            echo "        \"file_path\": \"$file\""
            echo "      }"
            echo -n "    }"
            [[ $j -lt $((${#chunk[@]} - 1)) ]] && echo ","
        done
        
        echo ""
        echo "  ]"
        echo "}"
        echo "BATCH_END"
        echo ""
    done
}

# 創建批次編輯命令
create_batch_edit() {
    local operation="$1"
    shift
    local old_text="$1"
    local new_text="$2"
    shift 2
    local files=("$@")
    
    log_info "準備批次編輯操作：$operation"
    
    echo "# 批次編輯操作 - $operation"
    echo "claude --batch << 'BATCH_END'"
    echo "{"
    echo '  "tools": ['
    
    # 首先讀取所有檔案
    for ((i=0; i<${#files[@]}; i++)); do
        local file="${files[i]}"
        echo "    {"
        echo '      "name": "Read",'
        echo "      \"parameters\": {"
        echo "        \"file_path\": \"$file\""
        echo "      }"
        echo "    },"
    done
    
    # 然後執行編輯操作
    for ((i=0; i<${#files[@]}; i++)); do
        local file="${files[i]}"
        echo "    {"
        echo '      "name": "Edit",'
        echo "      \"parameters\": {"
        echo "        \"file_path\": \"$file\","
        echo "        \"old_string\": \"$old_text\","
        echo "        \"new_string\": \"$new_text\""
        echo "      }"
        echo -n "    }"
        [[ $i -lt $((${#files[@]} - 1)) ]] && echo ","
    done
    
    echo ""
    echo "  ]"
    echo "}"
    echo "BATCH_END"
}

# 創建批次分析命令
create_batch_analyze() {
    local target_dir="$1"
    local analysis_type="${2:-complexity}"
    
    log_info "準備批次分析：目錄='$target_dir' 類型='$analysis_type'"
    
    cat << EOF
# 批次分析操作 - $analysis_type
claude --batch << 'BATCH_END'
{
  "tools": [
    {
      "name": "LS",
      "parameters": {
        "path": "$target_dir"
      }
    },
    {
      "name": "Glob",
      "parameters": {
        "pattern": "$target_dir/**/*.{ts,tsx,js,jsx}",
        "path": "$target_dir"
      }
    },
    {
      "name": "Grep",
      "parameters": {
        "pattern": "(function|class|interface|type)\\s+\\w+",
        "path": "$target_dir",
        "output_mode": "count",
        "head_limit": 100
      }
    },
    {
      "name": "Grep",
      "parameters": {
        "pattern": "TODO|FIXME|BUG|HACK",
        "path": "$target_dir", 
        "output_mode": "content",
        "head_limit": 50,
        "-n": true,
        "-i": true
      }
    }
  ]
}
BATCH_END
EOF
}

# 執行命令延遲
execute_with_delay() {
    local delay="$1"
    local command="$2"
    
    if [[ $delay -gt 0 ]]; then
        log_info "等待 $delay 秒以避免速率限制..."
        sleep "$delay"
    fi
    
    log_info "執行批次命令..."
    eval "$command"
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "批次操作完成"
    else
        log_error "批次操作失敗，錯誤代碼：$exit_code"
    fi
    
    return $exit_code
}

# 主要處理邏輯
main() {
    local delay="$DEFAULT_DELAY"
    local size_limit="$BATCH_SIZE_LIMIT"
    local verbose=false
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -d|--delay)
                delay="$2"
                shift 2
                ;;
            -s|--size)
                size_limit="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            search)
                shift
                create_batch_search "$1" "$2" "$size_limit"
                exit 0
                ;;
            read)
                shift
                create_batch_read "$@"
                exit 0
                ;;
            edit)
                shift
                create_batch_edit "$@"
                exit 0
                ;;
            analyze)
                shift
                create_batch_analyze "$1" "$2"
                exit 0
                ;;
            *)
                log_error "未知選項：$1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    show_usage
}

# 初始化和執行
init_config
main "$@"