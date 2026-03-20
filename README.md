# hl-frontend

Hyperliquid 链上数据分析 SaaS 前端项目（Next.js 14 + TypeScript + Tailwind CSS + App Router + shadcn/ui 风格组件）。

## 启动

1. 安装依赖

```bash
npm install
```


2. 配置环境变量

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

## 登录与鉴权

- `middleware` 对 `/dashboard/:path*` 做登录态保护
- 前端使用 `hl_access_token` cookie 判断登录态
- `useApi` 内置 401 自动续期逻辑：调用 `/auth/refresh` 成功后自动重试原请求
- 建议后端将 `refresh_token` 作为 HttpOnly Cookie 下发（前端不直接读取）
- 请求层支持 `AbortController`，页面切换会自动取消旧请求
- `useApiQuery` 支持 `staleTimeMs` 与 `pollingIntervalMs`，适配实时看板页面

## 主要接口约定（可按后端实际调整）

- `POST /auth/login` -> `{ accessToken: string }`
- `POST /auth/refresh` -> `{ accessToken: string }`
- `GET /analytics/overview` -> `DashboardOverview`
- `GET /smart-money/leaderboard?page=1&pageSize=10&sortBy=roi&search=0x...` -> `LeaderboardResponse`
- `GET /wallets/:address/analysis` -> `WalletAnalysis`
- `GET /wallets/:address/analysis?page=1&pageSize=8&side=long|short` -> `WalletAnalysis`
- `GET /liquidations/heatmap` -> `LiquidationHeatmapResponse`
- `GET /alerts/rules` -> `AlertsResponse`
- `POST /alerts/rules` -> 创建规则
- `PATCH /alerts/rules/:id` -> 启停规则
- `DELETE /alerts/rules/:id` -> 删除规则

## 可视化

- `/dashboard`：`recharts` PnL 趋势折线图
- `/dashboard/liquidations`：`recharts` 清算强度柱状图
- `/dashboard/leaderboard`：地址搜索、排序、分页
- `/dashboard/wallet/[address]`：服务端分页 + 仓位方向筛选
- 全局 Toast：统一成功/失败反馈
- Alerts 新建规则：使用 `zod` 做前端参数校验
