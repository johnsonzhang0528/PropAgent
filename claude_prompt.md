# PropAgent Pro Claude Code AI團隊指令
# 基於Hassan Trabelsi真正實現的Tmux Orchestrator

## 🎯 Claude Code執行環境
**工作目錄**: `/home/johnson/ai-dev-projects/Tmux-Orchestrator/projects/my-first-project`
**Specs目錄**: `./docs/`
**啟動模式**: `claude --dangerously-skip-permissions`

## 👥 建立自主AI團隊

### 前端團隊
- **Frontend PM** (窗口1): 讀取 `frontend_spec.md`，協調UI開發
- **Frontend Dev** (窗口2): 實際編寫React/TypeScript代碼
- **Frontend Server** (窗口3): 運行 `npm run dev`，監控構建

### 後端團隊  
- **Backend PM** (窗口4): 讀取 `backend_spec.md`，協調API開發
- **Backend Dev** (窗口5): 實際編寫Node.js/Express代碼
- **Backend Server** (窗口6): 運行 `npm run dev`，API測試

### 整合團隊
- **Integration PM** (窗口7): 讀取 `integration_spec.md`，跨團隊協調
- **QA Engineer** (窗口8): 運行測試套件，品質檢查
- **DevOps** (窗口9): 監控部署，系統狀態

## ⏰ 自主協調時間表

### 15分鐘檢查循環
```
:00 分 - PM檢查spec文件，分配新任務
:15 分 - 開發者報告當前進度
:30 分 - 執行提交循環 (git add, commit, push)
:45 分 - 跨團隊依賴協調
```

### 30分鐘提交循環
1. **代碼審查**: PM檢查開發者代碼品質
2. **測試運行**: QA執行自動化測試
3. **Git提交**: 自動提交通過的代碼
4. **進度更新**: 更新項目狀態

### 60分鐘編排器同步
- 整體進度評估
- 階段目標檢查
- 資源重新分配
- 下一階段準備

## 🚀 立即執行指令

**第一階段 (0-60分鐘)**: 所有團隊同時啟動基礎設施建設
- Frontend: 認證組件開發
- Backend: API路由和認證中間件  
- Integration: 前後端API整合

**自主權限**: 
✅ 創建/編輯任何項目文件
✅ 運行npm install/build/test命令
✅ 執行git操作 (add/commit/push)
✅ 啟動/停止開發服務器
✅ 修復代碼錯誤和bug

## 🎼 編排器責任

監控所有窗口的AI代理：
- 確保每個代理按時完成任務
- 解決跨團隊衝突和依賴
- 調整優先級和資源分配
- 協調階段性里程碑

**目標**: 180分鐘內完成完整的PropAgent Pro系統，實現完全自主開發。
