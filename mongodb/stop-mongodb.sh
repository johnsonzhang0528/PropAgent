#!/bin/bash
echo "⏹️  停止MongoDB服務器..."
if [ -f "/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/mongodb/mongod.pid" ]; then
    PID=$(cat "/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/mongodb/mongod.pid")
    kill $PID
    echo "MongoDB已停止 (PID: $PID)"
else
    echo "找不到MongoDB PID文件"
fi
