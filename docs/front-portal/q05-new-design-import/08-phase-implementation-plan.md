# 08 - 分阶段实施计划（Phase Implementation Plan）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 08
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读规划，**不修改任何业务代码**

---

## 0. 总览

| 阶段 | 名称 | 工作量 | 周期 | 风险 |
|---|---|---|---|---|
| **P1** | 静态预览门户 | 8-12d | 第 1-2 周 | 低 |
| **P2** | 接公告/帮助/下载/费率 | 5-8d | 第 3 周 | 低 |
| **P3** | 接行情/交易入口/钱包入口 | 8-12d | 第 4-5 周 | 中 |
| **P4** | 接用户态/资产态/资金流水 | 10-15d | 第 6-8 周 | 中高 |
| **P5** | 灰度切换旧首页 | 3-5d | 第 9 周 | 中 |
| **P6** | 正式替换官网首页 | 5-8d | 第 10 周 | 高 |

> **总工作量预估**：约 40-60 人天（5-7 人 × 2 月）

---

## 1. P1 - 静态预览门户

### 1.1 目标

- 新首页静态预览（无真实数据 + 全部"数据接入中/内测中"标签）
- 公告/帮助/下载/费率/风险/合规/关于/牌照 8 个静态页
- H5 预览首页 + 底部 Tab
- 验证 Stitch 设计还原度

### 1.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 1.1 | `src/app/portal-preview/layout.tsx` 独立 layout | 0.5d | 不污染旧 layout |
| 1.2 | `Header` `Footer` `MegaMenu` 3 组件 | 2d | TypeScript 严格通过 |
| 1.3 | `Hero` `Ticker` `StatGrid` `ProductMatrix` 4 组件 | 2d | 空状态规范统一 |
| 1.4 | `EmptyState` `StatusBadge` 2 基础组件 | 1d | 5 类标签可识别 |
| 1.5 | `/portal-preview` 预览首页 | 1d | 仅展示，无数据 |
| 1.6 | `/portal-preview/about` 关于 | 0.5d | 静态 |
| 1.7 | `/portal-preview/compliance` 合规 | 0.5d | 静态 |
| 1.8 | `/portal-preview/risk` 风险提示 | 0.5d | 静态 |
| 1.9 | `/portal-preview/announcement` 公告（占位） | 0.5d | "暂无数据" 标签 |
| 1.10 | `/portal-preview/help` 帮助（占位） | 0.5d | 静态 FAQ |
| 1.11 | `/portal-preview/fees` 费率（占位） | 0.5d | 静态 |
| 1.12 | `/portal-preview/privacy` 隐私 | 0.5d | 静态 |
| 1.13 | `/portal-preview/terms` 用户协议 | 0.5d | 静态 |
| 1.14 | `/h5/portal-preview` H5 预览首页 | 1d | 仅展示 |
| 1.15 | `MobileHeader` `MobileBottomTabs` 2 组件 | 1d | — |
| 1.16 | `RiskNotice` 风险提示组件 | 0.5d | 必显 |
| 1.17 | lint / type-check | 0.5d | 0 error / 0 warning |
| 1.18 | 浏览器验收 | 0.5d | 桌面 + H5 双端 |

### 1.3 风险与缓解

- **Stitch 原始资产未到** → 用文字描述 + 现有截图做参考，标注"待 Stitch 原稿确认"
- **设计 token 未到** → 沿用现有品牌色（`#1652F0` 等）
- **没有 H5 端 Stitch 设计** → 沿用现有 H5 视觉，仅做局部升级

### 1.4 验收标准

- [ ] 14 个 `/portal-preview/*` 路由可访问
- [ ] 1 个 `/h5/portal-preview` 路由可访问
- [ ] 所有"未接入"模块显示 5 类标签之一
- [ ] 不修改任何 `src/app/(root)/**` `src/app/h5/(原)/**` `src/app/admin/**`
- [ ] TypeScript 严格编译通过
- [ ] 浏览器 console 无 fatal error
- [ ] 浏览器 network 5xx/401 正常

### 1.5 退出条件

- 设计还原度 ≥ 80%（视觉对比）
- 所有 5 类标签可识别
- 桌面 + H5 双端可访问

---

## 2. P2 - 接公告/帮助/下载/费率

### 2.1 目标

- 公告 API 新增
- 帮助 API 新增
- 费率/牌照 静态化升级
- 客户端下载页升级

### 2.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 2.1 | **新增** `GET /api/v1/announcements` | 1d | 返回公告列表 |
| 2.2 | **新增** `GET /api/v1/announcements/[id]` | 0.5d | 返回详情 |
| 2.3 | **新增** `GET /api/v1/help/categories` | 0.5d | 分类列表 |
| 2.4 | **新增** `GET /api/v1/help/articles` | 0.5d | 文章列表 |
| 2.5 | **新增** `GET /api/v1/help/articles/[id]` | 0.5d | 文章详情 |
| 2.6 | Prisma `Announcement` `HelpArticle` 模型（**已有则不增**） | 0.5d | 复用 |
| 2.7 | `/portal-preview/announcement` 接入 API | 1d | 列表+详情 |
| 2.8 | `/portal-preview/help` 接入 API | 1d | 分类+文章 |
| 2.9 | `/portal-preview/fees` 静态费率表 | 0.5d | — |
| 2.10 | `/portal-preview/licenses` 牌照列表 | 0.5d | 静态 |
| 2.11 | `/portal-preview/download` 客户端下载 | 0.5d | 静态 |
| 2.12 | 桌面 `/news` 跳转 `/portal-preview/announcement` | 0.5d | 不删旧 `/news` |
| 2.13 | 桌面 `/help` 跳转 `/portal-preview/help` | 0.5d | 不删旧 `/help` |
| 2.14 | lint / type-check | 0.5d | 0 error / 0 warning |
| 2.15 | 浏览器验收 | 0.5d | — |

### 2.3 关键决策

- **是否新增 Prisma 模型**？
  - 如果已有 `Announcement` `HelpArticle` → 复用，不增
  - 如果没有 → **新增到独立 schema**（不污染主 `schema.prisma`）
- **API 路径**：`/api/v1/announcements`（不是 `/api/v1/portal-preview/announcements`，方便 admin 复用）

### 2.4 验收标准

- [ ] 5 个新 API 端到端通过
- [ ] 公告/帮助/费率/牌照/下载 5 个页面接入数据
- [ ] 桌面 `/news` `/help` 仍可访问（重定向到新预览）
- [ ] API 走 `withUserAuth` 或公开访问（公告/帮助公开）

### 2.5 退出条件

- 公告列表/详情能查能看
- 帮助分类/文章能查能看
- 旧 `/news` `/help` 仍可访问

---

## 3. P3 - 接行情/交易入口/钱包入口

### 3.1 目标

- 行情 ticker 真实化（或"数据接入中"标签）
- 行情页接入（仅展示，不做交易）
- 交易入口跳转（跳转旧 `/trade/*`）
- 钱包入口跳转（跳转旧 `/user/wallet`）
- 行情数据源真实化

### 3.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 3.1 | `MarketTable` 组件 | 1-2d | 真实/空状态 |
| 3.2 | `/portal-preview/markets` 行情页 | 1-2d | 真实 ticker |
| 3.3 | `/portal-preview/markets/[symbol]` 行情详情 | 1d | 真实 ticker |
| 3.4 | 行情 ticker 真实化（**或"数据接入中"标签**） | 1-2d | 客户验收 |
| 3.5 | `/portal-preview/trade` 交易入口 | 1d | 跳转 `/trade/spot` |
| 3.6 | `/portal-preview/trade/spot` `/futures` `/margin` | 1d | 跳转 |
| 3.7 | `/portal-preview/wallet` 钱包入口 | 1d | 跳转 `/user/wallet` |
| 3.8 | `/portal-preview/wallet/deposit` `/withdraw` | 1d | 跳转 |
| 3.9 | `/portal-preview/security` 安全中心 | 1d | 跳转 `/h5/wallet/security` |
| 3.10 | H5 `/h5/portal-preview/markets` | 1d | 真实/空 |
| 3.11 | H5 `/h5/portal-preview/wallet` | 1d | 跳转 |
| 3.12 | H5 视觉升级（**保留路由**） | 2-3d | 5 类标签 |
| 3.13 | lint / type-check | 0.5d | — |
| 3.14 | 浏览器验收 | 0.5d | 桌面 + H5 |

### 3.3 关键决策

- **行情数据源**？
  - 选项 A：内部撮合 + 行情聚合（**真实但工程量大**）
  - 选项 B：第三方公开 API（CoinGecko / CryptoCompare）— **成本低**
  - 选项 C：保留 mock + "数据接入中"标签（**最安全**）
- **建议**：C 起步，A 后续替换

### 3.4 验收标准

- [ ] 行情页可访问（真实/空状态）
- [ ] 交易/钱包入口跳转正常
- [ ] H5 视觉升级不破坏路由
- [ ] 5 类标签全站统一

### 3.5 退出条件

- 行情页/详情可访问
- 交易/钱包/安全入口跳转正常
- H5 视觉升级无回归

---

## 4. P4 - 接用户态/资产态/资金流水

### 4.1 目标

- 登录态展示
- 真实资产卡片（不显示假数据）
- 真实资金流水
- 用户中心入口整合

### 4.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 4.1 | `WalletCard` 组件（真实资产） | 1-2d | 真实/空状态 |
| 4.2 | `/portal-preview/wallet` 真实化 | 1-2d | b1 API |
| 4.3 | `/portal-preview/wallet/balance` 总资产 | 1d | 真实 |
| 4.4 | `/portal-preview/wallet/assets` 各币种 | 1d | 真实 |
| 4.5 | `/portal-preview/wallet/history` 资金流水 | 1-2d | b1 API |
| 4.6 | `/portal-preview/user/dashboard` 用户中心 | 1d | 真实/空 |
| 4.7 | `/portal-preview/user/kyc` KYC 入口 | 0.5d | 跳转 |
| 4.8 | `/portal-preview/user/level` 等级 | 0.5d | b1 API |
| 4.9 | `/portal-preview/user/invite` 邀请 | 0.5d | 真实 |
| 4.10 | `/portal-preview/user/notifications` 通知 | 0.5d | 真实 |
| 4.11 | `/portal-preview/user/security` 安全 | 0.5d | b1 API |
| 4.12 | H5 `/h5/portal-preview/wallet` 真实化 | 1-2d | b1 API |
| 4.13 | H5 `/h5/portal-preview/profile` 真实化 | 1-2d | 真实/空 |
| 4.14 | 登录态（auth 集成） | 1d | 不修改 `src/middleware.ts` |
| 4.15 | lint / type-check | 0.5d | — |
| 4.16 | 浏览器验收（含登录态） | 1d | 桌面 + H5 |

### 4.3 关键决策

- **鉴权**？
  - 选项 A：复用 `src/middleware.ts`（**禁止修改**）
  - 选项 B：客户端读 localStorage（admin_token 模式）
  - 选项 C：仅 layout 判定（推荐）
- **建议**：C + B 组合

### 4.4 验收标准

- [ ] 登录后看到真实资产
- [ ] 未登录看到"登录后查看"标签
- [ ] 资金流水真实
- [ ] 用户中心各入口跳转正常

### 4.5 退出条件

- 资产/流水真实可查
- 用户中心入口整合
- 登录态判定无副作用

---

## 5. P5 - 灰度切换旧首页

### 5.1 目标

- `/portal-preview` 与旧 `/` 双轨运行
- 灰度切流 10% → 50% → 100%
- 监控 7 天

### 5.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 5.1 | nginx 切流配置（10% → 50% → 100%） | 1d | 灰度生效 |
| 5.2 | `/` 顶部 banner 提示"新版预览" | 0.5d | 30 天可关 |
| 5.3 | 监控指标埋点 | 1d | PV/UV/错误率 |
| 5.4 | 客户/内部反馈收集 | 0.5d | 1 周内汇总 |
| 5.5 | 应急回滚预案 | 0.5d | 1 分钟内回滚 |
| 5.6 | 灰度观察（24-72 小时） | 1d | 0 critical error |
| 5.7 | 灰度 50% 观察 | 1d | 0 P0 error |
| 5.8 | 灰度 100% 观察 | 1d | 0 P0 error |
| 5.9 | 旧首页保留可回滚 | 0.5d | 7 天保留期 |

### 5.3 关键决策

- **切流方式**？
  - 选项 A：nginx 权重（推荐）
  - 选项 B：Next.js rewrite
  - 选项 C：客户端 cookie 判定
- **建议**：A 灰度，**不修改 `next.config.*`**

### 5.4 验收标准

- [ ] 10% 流量到新首页，0 critical error
- [ ] 50% 流量，0 P0 error
- [ ] 100% 流量，0 P0 error
- [ ] 旧 `/` 仍可访问（保留 7 天）

### 5.5 退出条件

- 灰度 100% 通过 7 天观察
- 客户/内部无 P0 反馈
- 旧首页可 1 分钟回滚

---

## 6. P6 - 正式替换官网首页

### 6.1 目标

- 旧 `/` 归档
- 新 `/` = `/portal-preview` 主入口
- 全量切流 100%
- 文档归档

### 6.2 必做清单

| 序 | 任务 | 工作量 | 验收 |
|---|---|---|---|
| 6.1 | 旧 `src/app/page.tsx` 归档为 `src/app/_archive/old-home/page.tsx` | 0.5d | 仍可访问 |
| 6.2 | 新 `src/app/page.tsx` = `src/app/portal-preview/page.tsx` | 0.5d | — |
| 6.3 | nginx 切流 100% | 0.5d | 全量 |
| 6.4 | 移除 banner 提示 | 0.5d | — |
| 6.5 | SEO metadata 迁移 | 1d | 完整 |
| 6.6 | sitemap.xml 提交 | 0.5d | 搜索引擎 |
| 6.7 | 旧首页保留 30 天 | 0.5d | — |
| 6.8 | 监控 7×24 | 1d | 0 P0 |
| 6.9 | 客户验收（外部） | 1d | 签字 |
| 6.10 | 项目归档 | 0.5d | docs |

### 6.3 关键决策

- **是否删除旧首页**？
  - 选项 A：保留 30 天后归档（推荐）
  - 选项 B：立即删除
  - **建议**：A
- **新首页归属**？
  - 选项 A：`/portal-preview` 升级为 `/`
  - 选项 B：保留 `/portal-preview` + 复制到 `/`
  - **建议**：A（更干净）

### 6.4 验收标准

- [ ] 新 `/` 完整可用
- [ ] SEO 完整迁移
- [ ] 旧首页 30 天可访问
- [ ] 监控 0 P0 error
- [ ] 客户签字

### 6.5 退出条件

- 新 `/` 上线
- 旧首页归档
- 客户验收通过

---

## 7. 资源需求

### 7.1 人力

| 角色 | 人数 | 周期 |
|---|---|---|
| 前端（全栈） | 2-3 人 | P1-P6 |
| 后端 | 1-2 人 | P2-P4 |
| 设计 | 1 人 | P1-P2（兼职） |
| QA | 1 人 | P5-P6 |
| 运维 | 0.5 人 | P5-P6 |
| 产品 | 0.5 人 | 全程 |
| **总计** | **5-7 人** | **2 月** |

### 7.2 工作量

| 阶段 | 人天 |
|---|---|
| P1 | 8-12d |
| P2 | 5-8d |
| P3 | 8-12d |
| P4 | 10-15d |
| P5 | 3-5d |
| P6 | 5-8d |
| **总计** | **40-60d** |

### 7.3 依赖

- Stitch 原始资产提供（**P1 启动前必填**）
- 客户对 R-1.1, R-2.1, R-2.2, R-6.1, R-6.2 决策
- 现有 b1 API 保持稳定

---

## 8. 关键里程碑

| 里程碑 | 日期（参考） | 验收 |
|---|---|---|
| M1：P1 完成（静态预览） | 第 2 周末 | 14 路由可访问 |
| M2：P2 完成（公告帮助） | 第 3 周末 | 5 API 上线 |
| M3：P3 完成（行情入口） | 第 5 周末 | 行情真实/空 |
| M4：P4 完成（用户资产） | 第 8 周末 | 资产真实 |
| M5：P5 完成（灰度切流） | 第 9 周末 | 灰度 100% |
| M6：P6 完成（正式替换） | 第 10 周末 | 客户签字 |

---

## 9. 风险与决策点

| 决策点 | 时限 | 决策人 |
|---|---|---|
| Stitch 原始资产是否在 P1 启动前提供 | **P1 启动前** | 用户 |
| 储备金 / 树图是否在 P1 上线 | **P1 启动前** | 用户 |
| APP / 小程序化是否需要 | **P1 启动前** | 用户 |
| 行情数据源选型 | **P3 启动前** | 全栈 |
| 鉴权方案（不改 middleware） | **P4 启动前** | 全栈 |
| 切流方式 | **P5 启动前** | 运维 |
| 旧首页保留时长 | **P6 启动前** | 用户 |

---

## 10. 退出条件（最终）

- [ ] 客户/内部对新官网视觉验收通过
- [ ] 所有"未接入"模块打 5 类标签
- [ ] 真实数据 0 假数据
- [ ] TypeScript 严格编译通过
- [ ] 浏览器 0 fatal error
- [ ] 监控 0 P0
- [ ] 灰度 7 天稳定
- [ ] 旧首页 30 天保留
- [ ] 文档归档

---

> **本文件为只读规划。未对任何业务代码、schema、seed、配置进行修改。**
