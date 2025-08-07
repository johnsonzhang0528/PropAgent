#!/bin/bash
echo "📊 檢查MongoDB狀態..."
if pgrep -f mongod > /dev/null; then
    echo "✅ MongoDB正在運行"
    echo "📊 進程信息:"
    pgrep -f mongod | head -5
else
    echo "❌ MongoDB未運行"
fi

echo ""
echo "📝 最近的日誌:"
if [ -f "/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/mongodb/logs/mongod.log" ]; then
    tail -10 "/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/mongodb/logs/mongod.log"
else
    echo "日誌文件不存在"
fi
