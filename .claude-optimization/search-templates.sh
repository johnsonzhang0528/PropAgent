#!/bin/bash

# =============================================================================
# Claude Code 精確搜尋模板腳本
# =============================================================================
# 功能：提供預定義的搜尋模式和配置，最佳化token使用
# 作者：Tmux Orchestrator Team  
# 版本：1.0.0
# 日期：2025-08-13
# =============================================================================

# 配置變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"

# 顏色配置
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日誌函數
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 顯示使用說明
show_usage() {
    cat << EOF
${CYAN}Claude Code 精確搜尋模板工具${NC}

使用方法：
  $0 [模板名稱] [目標路徑] [搜尋參數...]

可用模板：
  ${GREEN}errors${NC}         - 搜尋錯誤和異常處理
  ${GREEN}functions${NC}      - 搜尋函數定義
  ${GREEN}components${NC}     - 搜尋React組件
  ${GREEN}types${NC}          - 搜尋TypeScript類型定義
  ${GREEN}imports${NC}        - 搜尋import語句
  ${GREEN}todos${NC}          - 搜尋TODO和FIXME註釋
  ${GREEN}configs${NC}        - 搜尋配置文件
  ${GREEN}tests${NC}          - 搜尋測試文件
  ${GREEN}apis${NC}           - 搜尋API相關代碼
  ${GREEN}security${NC}       - 搜尋安全相關代碼
  ${GREEN}performance${NC}    - 搜尋性能相關代碼
  ${GREEN}deprecated${NC}     - 搜尋廢棄代碼

選項：
  -l, --list          列出所有可用模板
  -d, --describe      顯示模板詳細描述
  -o, --output FILE   將結果輸出到文件
  -c, --count-only    只顯示匹配計數
  -v, --verbose       詳細輸出模式
  -h, --help          顯示此說明

範例：
  $0 errors src/
  $0 components frontend/src/components/
  $0 todos . --count-only
  $0 types backend/src/models/ --output type-analysis.txt

EOF
}

# 創建搜尋模板文件
create_templates() {
    mkdir -p "$TEMPLATES_DIR"
    
    # 錯誤搜尋模板
    cat > "${TEMPLATES_DIR}/errors.json" << 'EOF'
{
  "name": "錯誤和異常處理搜尋",
  "description": "搜尋錯誤處理、異常拋出和catch語句",
  "patterns": [
    "try\\s*\\{[\\s\\S]*?catch",
    "throw\\s+new\\s+\\w*Error",
    "console\\.(error|warn)",
    "\\.catch\\s*\\(",
    "Error\\s*\\(",
    "reject\\s*\\("
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 30,
  "context_lines": 3,
  "case_insensitive": false
}
EOF

    # 函數搜尋模板
    cat > "${TEMPLATES_DIR}/functions.json" << 'EOF'
{
  "name": "函數定義搜尋",
  "description": "搜尋各種函數定義形式",
  "patterns": [
    "function\\s+\\w+\\s*\\(",
    "const\\s+\\w+\\s*=\\s*\\(",
    "const\\s+\\w+\\s*=\\s*async\\s*\\(",
    "export\\s+(function|const)\\s+\\w+",
    "\\w+\\s*:\\s*\\([^)]*\\)\\s*=>",
    "async\\s+function\\s+\\w+"
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 50,
  "context_lines": 2,
  "case_insensitive": false
}
EOF

    # React組件搜尋模板
    cat > "${TEMPLATES_DIR}/components.json" << 'EOF'
{
  "name": "React組件搜尋",
  "description": "搜尋React組件定義和使用",
  "patterns": [
    "export\\s+(default\\s+)?function\\s+[A-Z]\\w*",
    "const\\s+[A-Z]\\w*\\s*[=:]\\s*\\(",
    "interface\\s+[A-Z]\\w*Props",
    "type\\s+[A-Z]\\w*Props\\s*=",
    "React\\.FC<",
    "useState\\s*\\(",
    "useEffect\\s*\\(",
    "Props\\s*>"
  ],
  "globs": ["**/*.{tsx,jsx}"],
  "head_limit": 40,
  "context_lines": 3,
  "case_insensitive": false
}
EOF

    # TypeScript類型搜尋模板
    cat > "${TEMPLATES_DIR}/types.json" << 'EOF'
{
  "name": "TypeScript類型定義搜尋",
  "description": "搜尋interface、type、enum等類型定義",
  "patterns": [
    "interface\\s+\\w+\\s*\\{",
    "type\\s+\\w+\\s*=",
    "enum\\s+\\w+\\s*\\{",
    "class\\s+\\w+\\s*[\\{implements]",
    "extends\\s+\\w+",
    "implements\\s+\\w+",
    ":\\s*\\w+\\[\\]",
    "<[A-Z]\\w*>"
  ],
  "globs": ["**/*.{ts,tsx}"],
  "head_limit": 35,
  "context_lines": 2,
  "case_insensitive": false
}
EOF

    # Import語句搜尋模板
    cat > "${TEMPLATES_DIR}/imports.json" << 'EOF'
{
  "name": "Import語句搜尋",
  "description": "搜尋各種import和require語句",
  "patterns": [
    "import\\s+.*from\\s+['\"]",
    "import\\s*\\{[^}]+\\}\\s*from",
    "import\\s*\\*\\s*as\\s+\\w+",
    "const\\s+.*=\\s*require\\s*\\(",
    "import\\s*\\(['\"]",
    "export\\s*\\{[^}]+\\}\\s*from"
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 100,
  "context_lines": 1,
  "case_insensitive": false
}
EOF

    # TODO和FIXME搜尋模板
    cat > "${TEMPLATES_DIR}/todos.json" << 'EOF'
{
  "name": "TODO和註釋搜尋",
  "description": "搜尋代碼中的TODO、FIXME、HACK等註釋",
  "patterns": [
    "TODO[:\\s]",
    "FIXME[:\\s]", 
    "HACK[:\\s]",
    "BUG[:\\s]",
    "NOTE[:\\s]",
    "WARNING[:\\s]",
    "@deprecated",
    "eslint-disable"
  ],
  "globs": ["**/*.{ts,tsx,js,jsx,md}"],
  "head_limit": 50,
  "context_lines": 2,
  "case_insensitive": true
}
EOF

    # 配置文件搜尋模板
    cat > "${TEMPLATES_DIR}/configs.json" << 'EOF'
{
  "name": "配置文件搜尋",
  "description": "搜尋各種配置文件和設置",
  "patterns": [
    "\"scripts\"\\s*:",
    "\"dependencies\"\\s*:",
    "\"devDependencies\"\\s*:",
    "module\\.exports",
    "export\\s+default\\s*\\{",
    "process\\.env\\.",
    "NODE_ENV",
    "PORT"
  ],
  "globs": [
    "**/package.json",
    "**/*.config.{js,ts}",
    "**/.*rc",
    "**/.env*",
    "**/tsconfig*.json",
    "**/vite.config.*",
    "**/jest.config.*"
  ],
  "head_limit": 25,
  "context_lines": 3,
  "case_insensitive": false
}
EOF

    # 測試文件搜尋模板
    cat > "${TEMPLATES_DIR}/tests.json" << 'EOF'
{
  "name": "測試文件搜尋",
  "description": "搜尋測試相關代碼和函數",
  "patterns": [
    "describe\\s*\\(",
    "it\\s*\\(",
    "test\\s*\\(",
    "expect\\s*\\(",
    "beforeEach\\s*\\(",
    "afterEach\\s*\\(",
    "jest\\.\\w+",
    "cy\\.\\w+",
    "\\.test\\.",
    "\\.spec\\."
  ],
  "globs": [
    "**/*.{test,spec}.{ts,tsx,js,jsx}",
    "**/test/**/*",
    "**/tests/**/*",
    "**/__tests__/**/*"
  ],
  "head_limit": 40,
  "context_lines": 2,
  "case_insensitive": false
}
EOF

    # API相關搜尋模板
    cat > "${TEMPLATES_DIR}/apis.json" << 'EOF'
{
  "name": "API相關代碼搜尋",
  "description": "搜尋API路由、HTTP請求等",
  "patterns": [
    "app\\.(get|post|put|delete|patch)",
    "router\\.(get|post|put|delete|patch)",
    "fetch\\s*\\(",
    "axios\\.",
    "\\.(get|post|put|delete)\\s*\\(",
    "async/await",
    "req\\.",
    "res\\.",
    "next\\s*\\(",
    "middleware"
  ],
  "globs": ["**/*.{ts,js}"],
  "head_limit": 35,
  "context_lines": 3,
  "case_insensitive": false
}
EOF

    # 安全相關搜尋模板
    cat > "${TEMPLATES_DIR}/security.json" << 'EOF'
{
  "name": "安全相關代碼搜尋",
  "description": "搜尋安全相關代碼和潛在風險",
  "patterns": [
    "password",
    "token",
    "secret",
    "auth",
    "jwt",
    "bcrypt",
    "crypto",
    "validate",
    "sanitize",
    "xss",
    "sql.*injection",
    "cors"
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 30,
  "context_lines": 2,
  "case_insensitive": true
}
EOF

    # 性能相關搜尋模板
    cat > "${TEMPLATES_DIR}/performance.json" << 'EOF'
{
  "name": "性能相關代碼搜尋",
  "description": "搜尋性能相關的代碼和最佳化",
  "patterns": [
    "useMemo\\s*\\(",
    "useCallback\\s*\\(",
    "React\\.memo\\s*\\(",
    "shouldComponentUpdate",
    "lazy\\s*\\(",
    "Suspense",
    "console\\.time",
    "performance\\.",
    "setTimeout",
    "setInterval",
    "debounce",
    "throttle"
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 25,
  "context_lines": 3,
  "case_insensitive": false
}
EOF

    # 廢棄代碼搜尋模板  
    cat > "${TEMPLATES_DIR}/deprecated.json" << 'EOF'
{
  "name": "廢棄代碼搜尋",
  "description": "搜尋廢棄的API和過時的代碼",
  "patterns": [
    "@deprecated",
    "DEPRECATED",
    "componentWillMount",
    "componentWillReceiveProps", 
    "componentWillUpdate",
    "findDOMNode",
    "ReactDOM\\.render",
    "UNSAFE_",
    "var\\s+\\w+",
    "function\\s*\\(",
    "require\\s*\\("
  ],
  "globs": ["**/*.{ts,tsx,js,jsx}"],
  "head_limit": 20,
  "context_lines": 2,
  "case_insensitive": true
}
EOF

    log_success "所有搜尋模板已創建完成"
}

# 列出所有模板
list_templates() {
    log_info "可用的搜尋模板："
    echo ""
    
    for template_file in "${TEMPLATES_DIR}"/*.json; do
        if [[ -f "$template_file" ]]; then
            local template_name=$(basename "$template_file" .json)
            local description=$(jq -r '.description' "$template_file" 2>/dev/null || echo "無描述")
            printf "  ${GREEN}%-15s${NC} - %s\n" "$template_name" "$description"
        fi
    done
    echo ""
}

# 描述指定模板
describe_template() {
    local template_name="$1"
    local template_file="${TEMPLATES_DIR}/${template_name}.json"
    
    if [[ ! -f "$template_file" ]]; then
        log_error "模板文件不存在：$template_name"
        return 1
    fi
    
    local name=$(jq -r '.name' "$template_file")
    local description=$(jq -r '.description' "$template_file")
    local patterns=$(jq -r '.patterns[]' "$template_file")
    local globs=$(jq -r '.globs[]' "$template_file")
    local head_limit=$(jq -r '.head_limit' "$template_file")
    
    echo -e "${CYAN}模板名稱：${NC}$name"
    echo -e "${CYAN}描述：${NC}$description"
    echo -e "${CYAN}匹配模式：${NC}"
    echo "$patterns" | sed 's/^/  - /'
    echo -e "${CYAN}文件類型：${NC}"
    echo "$globs" | sed 's/^/  - /'
    echo -e "${CYAN}結果限制：${NC}$head_limit 項"
    echo ""
}

# 執行模板搜尋
execute_template_search() {
    local template_name="$1"
    local target_path="$2"
    local count_only="$3"
    local output_file="$4"
    
    local template_file="${TEMPLATES_DIR}/${template_name}.json"
    
    if [[ ! -f "$template_file" ]]; then
        log_error "模板文件不存在：$template_name"
        return 1
    fi
    
    local patterns=($(jq -r '.patterns[]' "$template_file"))
    local globs=($(jq -r '.globs[]' "$template_file"))
    local head_limit=$(jq -r '.head_limit' "$template_file")
    local context_lines=$(jq -r '.context_lines' "$template_file")
    local case_insensitive=$(jq -r '.case_insensitive' "$template_file")
    
    log_info "執行模板搜尋：$template_name"
    log_info "目標路徑：$target_path"
    
    local search_command=""
    local output_mode="content"
    
    if [[ "$count_only" == "true" ]]; then
        output_mode="count"
    fi
    
    # 構建搜尋命令
    for pattern in "${patterns[@]}"; do
        for glob in "${globs[@]}"; do
            local grep_cmd="claude-grep"
            grep_cmd+=" --pattern '$pattern'"
            grep_cmd+=" --glob '$glob'"
            grep_cmd+=" --path '$target_path'"
            grep_cmd+=" --output_mode '$output_mode'"
            grep_cmd+=" --head_limit $head_limit"
            
            if [[ "$output_mode" == "content" ]]; then
                grep_cmd+=" -n -C $context_lines"
            fi
            
            if [[ "$case_insensitive" == "true" ]]; then
                grep_cmd+=" -i"
            fi
            
            if [[ -n "$output_file" ]]; then
                grep_cmd+=" >> '$output_file'"
            fi
            
            echo "$grep_cmd"
        done
    done
}

# 主要處理邏輯
main() {
    local template_name=""
    local target_path="."
    local count_only="false"
    local output_file=""
    local verbose="false"
    
    # 確保模板目錄存在
    create_templates
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_templates
                exit 0
                ;;
            -d|--describe)
                if [[ -n "$2" ]]; then
                    describe_template "$2"
                    exit 0
                else
                    log_error "請指定要描述的模板名稱"
                    exit 1
                fi
                ;;
            -o|--output)
                output_file="$2"
                shift 2
                ;;
            -c|--count-only)
                count_only="true"
                shift
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "未知選項：$1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$template_name" ]]; then
                    template_name="$1"
                elif [[ -z "$target_path" || "$target_path" == "." ]]; then
                    target_path="$1"
                fi
                shift
                ;;
        esac
    done
    
    if [[ -z "$template_name" ]]; then
        log_error "請指定搜尋模板名稱"
        show_usage
        exit 1
    fi
    
    execute_template_search "$template_name" "$target_path" "$count_only" "$output_file"
}

# 執行主函數
main "$@"