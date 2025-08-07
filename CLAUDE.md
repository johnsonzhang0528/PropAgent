# PropAgent Pro - 專案特定配置

## 專案資訊
- **名稱**: PropAgent Pro - 智能房地產 CRM 系統
- **技術棧**: React 19 + Node.js + MongoDB + Socket.io
- **狀態**: 開發完成，功能齊全

## 專案架構
```
├── frontend/          # React + TypeScript + Vite + Ant Design
├── backend/           # Node.js + Express + MongoDB + Socket.io  
├── docs/              # 專案文檔和規格
└── mongodb/           # 本地 MongoDB 實例
```

## 快速命令
```bash
./deploy.sh           # 一鍵部署
./stop.sh             # 停止所有服務
cd frontend && npm run dev    # 前端開發 (端口 5175)
cd backend && npm run dev     # 後端開發 (端口 3000)
```

## 已知配置
- **Frontend**: React 19 + TypeScript + Vite + Ant Design
- **Backend**: Node.js + Express + MongoDB + Socket.io
- **測試**: Jest + Playwright + Supertest
- **資料庫**: MongoDB (localhost:27017/propagent)
- **API**: http://localhost:3000
- **前端**: http://localhost:5175