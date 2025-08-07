#!/bin/bash

# 視覺回歸測試運行腳本
# Visual Regression Test Runner for PropAgent Pro

set -e

echo "🎨 PropAgent Pro - 視覺回歸測試"
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：打印彩色消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 檢查必要的依賴
check_dependencies() {
    print_message "📋 檢查依賴項..." $BLUE
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        print_message "❌ Node.js 未安裝" $RED
        exit 1
    fi
    
    # 檢查 npm
    if ! command -v npm &> /dev/null; then
        print_message "❌ npm 未安裝" $RED
        exit 1
    fi
    
    # 檢查 Playwright
    if ! npm list @playwright/test &> /dev/null; then
        print_message "❌ Playwright 未安裝" $RED
        print_message "💡 請運行: npm install @playwright/test" $YELLOW
        exit 1
    fi
    
    print_message "✅ 依賴項檢查完成" $GREEN
}

# 安裝 Playwright 瀏覽器
install_browsers() {
    print_message "🌐 安裝 Playwright 瀏覽器..." $BLUE
    npx playwright install
    print_message "✅ 瀏覽器安裝完成" $GREEN
}

# 啟動開發服務器
start_dev_server() {
    print_message "🚀 啟動開發服務器..." $BLUE
    
    # 檢查端口 5173 是否已被占用
    if lsof -i:5173 &> /dev/null; then
        print_message "⚠️  端口 5173 已被占用，跳過服務器啟動" $YELLOW
    else
        # 後台啟動開發服務器
        npm run dev &
        DEV_SERVER_PID=$!
        
        # 等待服務器啟動
        print_message "⏳ 等待開發服務器啟動..." $YELLOW
        sleep 10
        
        # 檢查服務器是否成功啟動
        if curl -s http://localhost:5173 > /dev/null; then
            print_message "✅ 開發服務器啟動成功" $GREEN
        else
            print_message "❌ 開發服務器啟動失敗" $RED
            kill $DEV_SERVER_PID 2>/dev/null || true
            exit 1
        fi
    fi
}

# 運行視覺測試
run_visual_tests() {
    print_message "🎨 運行視覺回歸測試..." $BLUE
    
    # 設置測試環境變量
    export CI=false
    export PLAYWRIGHT_HTML_REPORT=playwright-report
    
    # 運行視覺測試
    if npx playwright test --project=visual --reporter=html; then
        print_message "✅ 視覺測試完成" $GREEN
        return 0
    else
        print_message "❌ 視覺測試失敗" $RED
        return 1
    fi
}

# 生成測試報告
generate_report() {
    print_message "📊 生成測試報告..." $BLUE
    
    # 檢查報告目錄是否存在
    if [ -d "playwright-report" ]; then
        print_message "📁 測試報告已生成: playwright-report/" $GREEN
        print_message "🌐 查看報告: npx playwright show-report" $BLUE
    else
        print_message "⚠️  未找到測試報告" $YELLOW
    fi
}

# 清理資源
cleanup() {
    print_message "🧹 清理資源..." $BLUE
    
    # 停止開發服務器
    if [ ! -z "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID 2>/dev/null || true
        print_message "🛑 開發服務器已停止" $YELLOW
    fi
}

# 主函數
main() {
    # 設置清理陷阱
    trap cleanup EXIT
    
    print_message "🎯 開始視覺回歸測試流程" $BLUE
    echo ""
    
    # 執行測試步驟
    check_dependencies
    echo ""
    
    # 選項處理
    INSTALL_BROWSERS=false
    UPDATE_SCREENSHOTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-browsers)
                INSTALL_BROWSERS=true
                shift
                ;;
            --update-screenshots)
                UPDATE_SCREENSHOTS=true
                shift
                ;;
            --help)
                echo "使用方法: $0 [選項]"
                echo ""
                echo "選項:"
                echo "  --install-browsers    安裝 Playwright 瀏覽器"
                echo "  --update-screenshots  更新基準截圖"
                echo "  --help               顯示此幫助信息"
                echo ""
                echo "範例:"
                echo "  $0                          # 運行視覺測試"
                echo "  $0 --install-browsers       # 安裝瀏覽器並運行測試"
                echo "  $0 --update-screenshots     # 更新基準截圖"
                exit 0
                ;;
            *)
                print_message "❌ 未知選項: $1" $RED
                print_message "💡 使用 --help 查看可用選項" $YELLOW
                exit 1
                ;;
        esac
    done
    
    # 安裝瀏覽器（如果需要）
    if [ "$INSTALL_BROWSERS" = true ]; then
        install_browsers
        echo ""
    fi
    
    # 啟動開發服務器
    start_dev_server
    echo ""
    
    # 運行視覺測試
    if [ "$UPDATE_SCREENSHOTS" = true ]; then
        print_message "📸 更新基準截圖模式" $YELLOW
        npx playwright test --project=visual --update-snapshots
        TEST_RESULT=$?
    else
        run_visual_tests
        TEST_RESULT=$?
    fi
    
    echo ""
    
    # 生成報告
    generate_report
    echo ""
    
    # 測試結果總結
    if [ $TEST_RESULT -eq 0 ]; then
        print_message "🎉 視覺回歸測試成功完成！" $GREEN
        print_message "📊 詳細報告: npx playwright show-report" $BLUE
    else
        print_message "💥 視覺回歸測試失敗" $RED
        print_message "🔍 檢查測試報告了解詳情" $YELLOW
        print_message "📊 查看報告: npx playwright show-report" $BLUE
        exit 1
    fi
}

# 運行主函數
main "$@"