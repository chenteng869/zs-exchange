# 06 - 组件映射方案（Component Mapping Plan）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 06
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读规划，**不修改任何业务代码**

---

## 0. 范围声明

本任务**仅产出组件映射方案**，**不实现**任何新组件。所有组件归口 `src/app/portal-preview/components/**`（独立目录，不污染既有 `src/components/**`）。

---

## 1. 核心公共组件清单

> **来源**：用户文档 §06 + 推断的 Stitch 新设计组件

| 序 | 组件 | 桌面端 | H5 端 | 状态 |
|---|---|---|---|---|
| 1 | `Header` | ✅ | — | 桌面顶导 |
| 2 | `MegaMenu` | ✅ | — | 桌面悬停下拉 |
| 3 | `MobileHeader` | — | ✅ | H5 顶导 |
| 4 | `MobileBottomTabs` | — | ✅ | H5 底 Tab |
| 5 | `MarketTable` | ✅ | ✅ | 行情表格 |
| 6 | `WalletCard` | ✅ | ✅ | 钱包卡片 |
| 7 | `ProductMatrix` | ✅ | — | 产品矩阵 |
| 8 | `AnnouncementCard` | ✅ | ✅ | 公告卡 |
| 9 | `RiskNotice` | ✅ | ✅ | 风险提示 |
| 10 | `EmptyState` | ✅ | ✅ | 空状态 |
| 11 | `StatusBadge` | ✅ | ✅ | 状态徽章 |
| 12 | `Footer` | ✅ | — | 页脚 |
| 13 | `Hero` | ✅ | — | 首屏 hero |
| 14 | `Ticker` | ✅ | — | 滚动 ticker |
| 15 | `StatGrid` | ✅ | — | 数据网格 |
| 16 | `CTAButton` | ✅ | ✅ | CTA 按钮 |
| 17 | `FormField` | ✅ | ✅ | 表单字段 |
| 18 | `Modal` / `Drawer` | ✅ | ✅ | 弹层 |
| 19 | `Tabs` | ✅ | ✅ | 标签页 |
| 20 | `Toast` | ✅ | ✅ | 提示 |

---

## 2. 组件详细规格

### 2.1 `Header` 桌面顶导

- **位置**：`src/app/portal-preview/components/Header.tsx`
- **职责**：
  - Logo（左）
  - MegaMenu（中）
  - 登录 / 注册 / 我的（右）
  - 语言切换（占位）
  - 客服入口
- **Props**：
  - `transparent?: boolean`（首页透明顶导）
  - `user?: { username, avatar, level } | null`
- **现有参考**：
  - 旧官网 `src/app/layout.tsx` + `src/components/site-header/*`（待确认）
  - Admin `src/app/admin/layout.tsx` 顶部
- **新设计差异**：
  - Logo 位置 / 配色 / 字体
  - MegaMenu 展开方式
  - 登录按钮位置
- **依赖**：
  - `next/link`
  - `next/navigation`（usePathname）
  - 不依赖任何 store / API

### 2.2 `MegaMenu` 桌面悬停下拉

- **位置**：`src/app/portal-preview/components/MegaMenu.tsx`
- **职责**：
  - 一级菜单 hover 展开二级面板
  - 14 大类入口（产品矩阵）
  - 二级入口分组（行情/交易/钱包/资讯/关于）
- **Props**：
  - `items: MegaMenuItem[]`
  - `MegaMenuItem = { label, href, icon?, children?: MegaMenuItem[] }`
- **状态**：
  - `useState` 跟踪当前 hover 项
  - `useEffect` 监听键盘 Esc 关闭
- **依赖**：
  - `@/components/ui/*`（待确认）
  - 不依赖 store
- **键盘快捷键**：
  - `Esc` 关闭
  - `Tab` 焦点循环

### 2.3 `MobileHeader` H5 顶导

- **位置**：`src/app/portal-preview/components/MobileHeader.tsx`
- **职责**：
  - 汉堡 / 返回 / Logo / 搜索 / 通知
- **Props**：
  - `title?: string`
  - `showBack?: boolean`
  - `transparent?: boolean`
- **现有参考**：
  - 旧 H5 `src/app/h5/layout.tsx` 顶部
- **依赖**：
  - `react-icons/*` 或 `lucide-react`（待确认）

### 2.4 `MobileBottomTabs` H5 底 Tab

- **位置**：`src/app/portal-preview/components/MobileBottomTabs.tsx`
- **职责**：
  - 4-5 个底部 Tab（首页 / 行情 / 交易 / 钱包 / 我的）
  - 选中状态 + 路由跳转
- **Props**：
  - `tabs: BottomTab[]`
  - `BottomTab = { label, href, icon: React.ReactNode }`
- **现有参考**：
  - 旧 H5 `src/app/h5/layout.tsx` 底部
- **新设计差异**：
  - Tab 数量 / 顺序 / 图标
  - 中间按钮（FAB）位置
- **依赖**：
  - `next/navigation`（usePathname）

### 2.5 `MarketTable` 行情表格

- **位置**：`src/app/portal-preview/components/MarketTable.tsx`
- **职责**：
  - 币种 / 价格 / 24h 涨跌 / 24h 成交额
  - 排序（价格 / 涨跌 / 成交额）
  - 过滤（涨幅榜 / 跌幅榜 / 成交榜 / 自选）
  - 收藏 / 取消收藏
  - 跳转交易对详情
- **Props**：
  - `data: Market[]`
  - `sortable?: boolean`
  - `favorites?: string[]`
  - `onToggleFavorite?: (symbol) => void`
- **数据源**：
  - `/api/v1/crypto/markets`（待确认）
  - 行情 ticker SSE（**当前 mock**）
- **新设计差异**：
  - 列数 / 列顺序
  - 涨跌色
  - 收藏入口

### 2.6 `WalletCard` 钱包卡片

- **位置**：`src/app/portal-preview/components/WalletCard.tsx`
- **职责**：
  - 总资产（折算 USDT/CNY）
  - 24h 涨跌
  - 充值 / 提现 / 转账 / 兑换 入口
  - 资产列表（按币种）
- **Props**：
  - `userId: string`
  - `compact?: boolean`（首页卡片 vs 钱包页大卡）
- **数据源**：
  - `/api/v1/user/wallet/balance`（b1）
  - `/api/v1/user/wallet/assets`（b1）
- **新设计差异**：
  - 是否包含"理财"入口
  - 24h 涨跌展示

### 2.7 `ProductMatrix` 产品矩阵

- **位置**：`src/app/portal-preview/components/ProductMatrix.tsx`
- **职责**：
  - 网格 / 列表 展示产品入口
  - 现货 / 合约 / 杠杆 / DeFi / NFT / Game / Shop
- **Props**：
  - `products: Product[]`
  - `layout: 'grid' | 'list'`
- **新设计差异**：
  - 网格密度
  - 是否包含"新手引导"

### 2.8 `AnnouncementCard` 公告卡

- **位置**：`src/app/portal-preview/components/AnnouncementCard.tsx`
- **职责**：
  - 标题 / 摘要 / 发布时间 / 分类
  - 跳转详情
- **Props**：
  - `announcement: Announcement`
  - `compact?: boolean`
- **数据源**：
  - **`/api/v1/announcements`**（**待新增 API**）
- **新设计差异**：
  - 分类标签
  - 置顶 / 重要标识

### 2.9 `RiskNotice` 风险提示

- **位置**：`src/app/portal-preview/components/RiskNotice.tsx`
- **职责**：
  - 通用风险提示（数字资产风险 / 市场波动 / 监管变化）
  - 强制阅读 + 已读确认
- **Props**：
  - `type: 'general' | 'futures' | 'leverage' | 'otc'`
  - `forceAck?: boolean`
- **数据源**：
  - 静态文案（`src/app/portal-preview/data/risk-disclosure.json`）

### 2.10 `EmptyState` 空状态

- **位置**：`src/app/portal-preview/components/EmptyState.tsx`
- **职责**：
  - 5 类状态文案：暂无数据 / 数据接入中 / 内测中 / 即将开放 / 维护中
  - 图标 + 文案 + 可选 CTA
- **Props**：
  - `status: 'none' | 'loading' | 'beta' | 'coming' | 'maintain'`
  - `title?: string`
  - `description?: string`
  - `action?: { label, href }`
- **样式 token**：
  - `none`: `text-slate-500`
  - `loading`: `text-amber-500`
  - `beta`: `text-purple-500`
  - `coming`: `text-cyan-500`
  - `maintain`: `text-rose-500`

### 2.11 `StatusBadge` 状态徽章

- **位置**：`src/app/portal-preview/components/StatusBadge.tsx`
- **职责**：
  - 业务状态展示（已完成 / 进行中 / 已取消 / 失败）
  - 模块状态（内测中 / 即将开放 / 数据接入中 / 暂无数据 / 维护中）
- **Props**：
  - `kind: 'business' | 'module'`
  - `value: string`
  - `size?: 'sm' | 'md' | 'lg'`
- **业务状态映射**：
  - `pending` → 待处理（amber）
  - `processing` → 进行中（cyan）
  - `completed` → 已完成（green）
  - `failed` → 失败（rose）
  - `cancelled` → 已取消（slate）

### 2.12 `Footer` 页脚

- **位置**：`src/app/portal-preview/components/Footer.tsx`
- **职责**：
  - 公司信息
  - 友情链接
  - 备案号
  - 风险提示
  - 订阅
- **Props**：
  - `variant?: 'simple' | 'full'`
- **数据源**：静态

### 2.13 `Hero` 首屏

- **位置**：`src/app/portal-preview/components/Hero.tsx`
- **职责**：
  - 大标题 + 副标题 + CTA
  - 背景图 / 视频
  - 倒计时（如有活动）
- **Props**：
  - `title: string`
  - `subtitle?: string`
  - `cta?: { label, href, variant }`
  - `background?: { type: 'image' | 'video' | 'gradient', src?: string }`
- **现有参考**：
  - 旧首页 `src/app/HomepageContent.tsx` Hero 区（v5/v6/v7 截图）

### 2.14 `Ticker` 滚动 ticker

- **位置**：`src/app/portal-preview/components/Ticker.tsx`
- **职责**：
  - 横向滚动展示行情
  - 涨绿跌红
  - 自动 + 手动滚动
- **Props**：
  - `data: TickerItem[]`
  - `speed?: number`（像素/秒）
- **数据源**：
  - `/api/v1/crypto/stream`（**当前 mock 命中**）

### 2.15 `StatGrid` 数据网格

- **位置**：`src/app/portal-preview/components/StatGrid.tsx`
- **职责**：
  - 平台数据：注册用户 / 24h 成交 / 上线币种 / 累计交易
  - 数字 + 图标 + 趋势
  - CountUp 数字滚动
- **Props**：
  - `stats: Stat[]`
  - `columns?: 2 | 3 | 4`

### 2.16 `CTAButton` CTA 按钮

- **位置**：`src/app/portal-preview/components/CTAButton.tsx`
- **职责**：
  - 主按钮 / 次按钮 / 危险按钮
  - loading 状态
  - icon + text
- **Props**：
  - `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `loading?: boolean`
  - `icon?: React.ReactNode`

### 2.17 `FormField` 表单字段

- **位置**：`src/app/portal-preview/components/FormField.tsx`
- **职责**：
  - label + input/select/textarea + error
  - 支持前后 icon
- **Props**：
  - `label: string`
  - `name: string`
  - `type?: 'text' | 'password' | 'email' | 'tel' | 'number' | 'select' | 'textarea'`
  - `value: any`
  - `onChange: (v) => void`
  - `error?: string`
  - `required?: boolean`
  - `prefix?: React.ReactNode`
  - `suffix?: React.ReactNode`

### 2.18 `Modal` / `Drawer` 弹层

- **位置**：`src/app/portal-preview/components/Modal.tsx` + `Drawer.tsx`
- **职责**：
  - Modal 居中弹层
  - Drawer 右侧抽屉
  - 遮罩 + 关闭按钮
- **Props**：
  - `open: boolean`
  - `onClose: () => void`
  - `title?: string`
  - `width?: number | string`
  - `position?: 'center' | 'right' | 'bottom'`

### 2.19 `Tabs` 标签页

- **位置**：`src/app/portal-preview/components/Tabs.tsx`
- **职责**：
  - 横向 / 纵向 Tab
  - 键盘左右切换
- **Props**：
  - `tabs: { key, label, content }[]`
  - `value: string`
  - `onChange: (k) => void`

### 2.20 `Toast` 提示

- **位置**：`src/app/portal-preview/components/Toast.tsx`
- **职责**：
  - 全局提示
  - 4 类：success / info / warning / error
  - 自动消失 + 手动关闭
- **API**：
  - `toast.success(msg)`
  - `toast.error(msg)`
  - `toast.warning(msg)`
  - `toast.info(msg)`

---

## 3. 组件依赖矩阵

| 组件 | 依赖其他组件 | 依赖外部包 |
|---|---|---|
| `Header` | `MegaMenu` `StatusBadge` | `next/link`, `next/navigation` |
| `MegaMenu` | `StatusBadge` | `react` (useState) |
| `MobileHeader` | `EmptyState`（搜索无结果） | `react-icons` / `lucide-react` |
| `MobileBottomTabs` | — | `next/navigation` |
| `MarketTable` | `EmptyState` `StatusBadge` | `react` (useMemo, useState) |
| `WalletCard` | `EmptyState` `StatusBadge` `CTAButton` | `react-countup` |
| `ProductMatrix` | `StatusBadge` | `next/link` |
| `AnnouncementCard` | `StatusBadge` | `next/link` |
| `RiskNotice` | `CTAButton` | `react` (useState) |
| `EmptyState` | — | `lucide-react` |
| `StatusBadge` | — | `clsx` |
| `Footer` | `StatusBadge` | `next/link` |
| `Hero` | `CTAButton` | `react-countup` |
| `Ticker` | — | `react` (useEffect, useState) |
| `StatGrid` | `EmptyState` | `react-countup` |
| `CTAButton` | — | `clsx` |
| `FormField` | — | `react` (useState) |
| `Modal` / `Drawer` | — | `react` (useEffect), `framer-motion`（待确认） |
| `Tabs` | — | `react` (useState) |
| `Toast` | — | `react` (createContext), `framer-motion`（待确认） |

---

## 4. 现有组件复用清单

> **目标**：尽可能复用既有组件，减少新代码量

| 新组件 | 现有可复用 | 复用方式 | 备注 |
|---|---|---|---|
| `Header` | 旧官网 nav 数组 | 引用 `src/lib/constants.ts`（只读） | 不修改 |
| `MegaMenu` | 无 | 全新 | — |
| `MobileHeader` | `src/app/h5/layout.tsx` 顶部 | 复制（不修改原文件） | 同源 |
| `MobileBottomTabs` | `src/app/h5/layout.tsx` 底部 | 复制 | 同源 |
| `MarketTable` | 旧 `/markets` 表格 | 引用为参考 | 不修改 |
| `WalletCard` | 旧 `/user/wallet` 卡片 | 引用为参考 | 不修改 |
| `StatusBadge` | 无 | 全新 | 必填 |
| `EmptyState` | 散落在各 page | 全新（统一规范） | 必填 |
| `Toast` | antd `message` API | 不复用（独立） | 独立 |

> **复用策略**：**只读参考**，不修改原文件。如需复用，复制到 `src/app/portal-preview/components/`。

---

## 5. 组件实现优先级

| 序 | 组件 | 优先级 | 工作量 |
|---|---|---|---|
| 1 | `EmptyState` | **P0** | 0.5d |
| 2 | `StatusBadge` | **P0** | 0.5d |
| 3 | `CTAButton` | **P0** | 0.5d |
| 4 | `Header` | **P0** | 1d |
| 5 | `MegaMenu` | **P0** | 1-2d |
| 6 | `Footer` | **P0** | 0.5d |
| 7 | `Hero` | **P0** | 1d |
| 8 | `Ticker` | **P0** | 1d |
| 9 | `MarketTable` | **P0** | 1-2d |
| 10 | `WalletCard` | **P0** | 1d |
| 11 | `AnnouncementCard` | P1 | 0.5d |
| 12 | `RiskNotice` | P1 | 0.5d |
| 13 | `StatGrid` | P1 | 0.5d |
| 14 | `FormField` | P1 | 1d |
| 15 | `Modal` / `Drawer` | P1 | 1d |
| 16 | `Tabs` | P1 | 0.5d |
| 17 | `Toast` | P1 | 0.5d |
| 18 | `MobileHeader` | P1 | 0.5d |
| 19 | `MobileBottomTabs` | P1 | 0.5d |
| 20 | `ProductMatrix` | P2 | 0.5d |

---

## 6. 关键决策点

### 6.1 样式方案

| 候选 | 优点 | 缺点 | 推荐 |
|---|---|---|---|
| Tailwind CSS | 与旧官网一致 | 类名冗长 | ⭐⭐⭐⭐ |
| CSS Modules | 局部作用域 | 与旧官网不一致 | ⭐⭐⭐ |
| styled-components | 灵活 | 引入新依赖 | ⭐⭐ |
| 内联 style | 简单 | 难维护 | ⭐ |

> **推荐**：**Tailwind CSS**（与旧官网一致），**不修改** `tailwind.config.*`（独立 class prefix）。

### 6.2 状态管理

| 候选 | 推荐 |
|---|---|
| React Context（轻量） | ✅ |
| Zustand | ⭐⭐⭐⭐（如需复杂状态） |
| Redux | ❌（过度设计） |
| Recoil / Jotai | ❌（避免新依赖） |

> **推荐**：**React Context + useState/useReducer** 为主，**仅在跨页面复杂状态时引入 Zustand**。

### 6.3 动效

| 候选 | 推荐 |
|---|---|
| CSS animation | ✅（首选） |
| framer-motion | ⭐⭐⭐⭐（如需复杂） |
| react-spring | ⭐⭐ |
| GSAP | ❌（避免新依赖） |

> **推荐**：**CSS animation 为主，framer-motion 仅在 stagger 编排时引入**。

---

## 7. 验证清单（组件完成后）

- [ ] 20 个组件全部就绪
- [ ] 组件级 TypeScript 严格编译通过
- [ ] 组件级 Storybook（如引入）可独立运行
- [ ] 不修改任何 `src/components/**` 既有文件
- [ ] 不修改任何 `src/lib/**` 既有文件
- [ ] 不修改 `package.json` 依赖（或**最小化**新增）
- [ ] 不修改 `tailwind.config.*` / `tsconfig.json`

---

> **本文件为只读规划。未对任何业务代码、schema、seed、配置进行修改。**
