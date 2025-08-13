#!/bin/bash
# Claude Code 最佳化工具別名
# 在您的 .bashrc 或 .zshrc 中添加：source /home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/aliases.sh

# 基本別名
alias claude-opt="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh"
alias claude-batch="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh batch"
alias claude-search="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh search"
alias claude-cost="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh cost"
alias claude-rate="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh rate"

# 專案特定別名
alias my-first-project-analyze="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh task file-analysis ."
alias my-first-project-search-errors="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh search errors ."
alias my-first-project-search-todos="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh search todos ."
alias my-first-project-cost-check="/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project/.claude-optimization/claude-optimizer.sh cost dashboard"

echo "Claude Code 最佳化工具別名已載入"
echo "可用命令：claude-opt, claude-batch, claude-search, claude-cost, claude-rate"
echo "專案命令：my-first-project-analyze, my-first-project-search-errors, my-first-project-cost-check"
