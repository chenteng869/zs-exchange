## 14. 路由索引与开发规范

### 14.1 管理后台路由索引

#### 14.1.1 `/admin/login` 至 `/admin/system/monitor` 完整路由表

管理后台（Admin Web）端共包含 55 个页面，覆盖核心量化模块、四大生态联动模块及后台通用支撑页面。下表以路由路径为主键聚合，将同一路由下的多个子视图合并为一行呈现，便于开发人员快速定位目标页面的实现位置与开发优先级。Phase 标注遵循分阶段实施计划：P0 为 MVP 最小可行产品（26 页），P1 为核心能力完善（42 页），P3 为生态壁垒构建（52 页）。

| 路由路径 | 页面编号 | 页面名称 | Phase |
|----------|----------|----------|-------|
| `/admin/login` | W49 | 登录页 | P0 |
| `/admin/quant/dashboard` | W01–W05 | 仪表盘（5 子视图：资产概览/近期分析/热力图/雷达图） | P0/P1 |
| `/admin/quant/analysis` | W06–W09 | 智能分析（4 子视图：控制台/矩阵表/风控/决策） | P0/P1 |
| `/admin/quant/analysis/[task_id]` | W10–W11 | 分析任务详情 + 发布弹窗 | P0 |
| `/admin/quant/portfolio` | W12–W14 | 投资组合（3 子视图：持仓/饼图/流水） | P0 |
| `/admin/quant/backtest` | W15–W17 | 回测中心（3 子视图：配置/结果/对比） | P1 |
| `/admin/quant/agents` | W18–W19 | 智能体面板（2 子视图：大师网格/推理详情） | P1/P3 |
| `/admin/quant/settings` | W20–W21 | 系统设置（2 子视图：API 密钥/模型配置） | P0 |
| `/admin/quant/strategy-market` | W22–W23 | 策略市场（2 子视图：列表/订阅） | P1 |
| `/admin/quant/copy-trading` | W24–W25 | 跟单中心（2 子视图：配置/绩效） | P1 |
| `/admin/quant/token-score` | W26–W31 | 代币评分系统（6 页面：总览/详情/审计/链上/定价/预警） | P3 |
| `/admin/quant/enterprise-advisor` | W32–W37 | 企业投研助手（6 页面：看板/报告/对标/供应链/工具/成熟度） | P3 |
| `/admin/quant/distribution` | W38–W42 | 策略分销中心（5 子视图：产品化/网络/漏斗/流量/结算） | P3 |
| `/admin/quant/ipo-assessment` | W43–W48 | IPO 评估系统（6 页面：Pipeline/评分/DCF/可比公司/模拟器/路演） | P3 |
| `/admin/users` | W54 | 用户管理 | P0 |
| `/admin/roles` | W55 | 角色权限管理 | P1 |
| `/admin/audit-logs` | W56 | 操作审计日志 | P1 |
| `/admin/alerts` | W57 | 全局告警通知 | P3 |
| `/admin/system/monitor` | W58 | 系统监控面板 | P3 |
| `/admin/404` | W51 | 404 错误页 | P3 |
| `/admin/403` | W53 | 无权限页 | P3 |
| `/admin/export` | W59 | 数据导出中心 | P3 |

管理后台路由采用层次化命名约定：`/admin/quant/` 前缀下挂载全部量化交易相关模块，四大联动模块（代币评分、企业投研、策略分销、IPO 评估）作为 `/admin/quant/` 的二级子路由存在。通用支撑页面（登录、用户管理、角色权限、审计日志等）则直接挂载于 `/admin/` 根路径下。W50（全局布局框架）和 W60（消息通知中心）为 Layout 级别组件，不对应独立路由，故未列入上表。开发人员在新增后台页面时，应遵循此路由层级约定，避免在 `/admin/` 根路径下直接创建量化模块页面。

### 14.2 H5 移动端路由索引

#### 14.2.1 `/h5` 至 `/h5/copy-trading/profits` 完整路由表

H5 移动端共 40 个页面，按优先级划分为 P0（14 页）、P1（18 页）、P2（8 页）三个层级。P0 页面覆盖 AI 策略大脑主入口、发现页聚合入口、首页增强及底部导航改造等核心体验路径；P1 页面覆盖代币详情增强、算法交易、发币服务、上市申请等差异化功能；P2 页面则为 AI 对话助手、企业诊断报告移动端等高级功能。路由设计上，Tab 型页面采用查询参数区分子视图（如 `/h5/ai-strategy?tab=signals`），独立页面则采用 RESTful 路径（如 `/h5/signal/[signal_id]`）。

| 路由路径 | 页面编号 | 页面名称 | Phase |
|----------|----------|----------|-------|
| `/h5` | H12–H14 | 首页增强 + 底部导航扩展 + 业务矩阵入口 | P0 |
| `/h5/ai-strategy` | H01–H05 | AI 策略大脑（5 子视图：信号/跟单/大师/订阅） | P0 |
| `/h5/discover` | H06–H11 | 发现页（6 子视图：新币/IPO/产业园/策略/电商） | P0/P1 |
| `/h5/assets` | H17 | 资产页 — AI 建议嵌入 | P0 |
| `/h5/token/[symbol]` | H15–H16 | 代币详情 — AI 分析 Tab + 完整评分报告 | P1 |
| `/h5/profile` | H18 | 我的页 — 生态入口扩展 | P1 |
| `/h5/algo-trading` | H19 | 算法交易管理（TWAP/VWAP） | P1 |
| `/h5/token-issue` | H20 | 发币服务入口 | P1 |
| `/h5/listing` | H21 | 上市申请入口 | P1 |
| `/h5/signal/[signal_id]` | H22 | 信号详情页 | P1 |
| `/h5/strategy/[strategy_id]` | H23 | 策略详情页 | P1 |
| `/h5/copy-trade/[trade_id]` | H24 | 跟单详情页 | P1 |
| `/h5/subscribe/confirm` | H25 | 订阅确认页 | P1 |
| `/h5/ai-chat` | H33–H35 | AI 对话助手（3 子视图：主页/内嵌卡片/历史） | P2 |
| `/h5/enterprise-report` | H36–H37 | 企业诊断报告 + 分享下载 | P2 |
| `/h5/masters/following` | H38 | 大师关注管理 | P2 |
| `/h5/commission` | H39 | 推广佣金页面 | P2 |
| `/h5/copy-trading/profits` | H40 | 跟单收益明细 | P2 |

H5 移动端路由遵循轻量级 RESTful 设计原则：聚合型入口页面（AI 策略大脑、发现页）通过查询参数 `?tab=` 实现内部 Tab 切换，避免路由层级过深；详情型页面（信号、策略、跟单）则采用动态路由段 `[id]` 以支持深层链接和分享跳转。H26–H29 为推送通知触发的跳转目标页，它们复用 H22、H24 等已有路由，不独立占用路由条目。H30–H32 为全局弹窗组件，同样不对应独立路由。

### 14.3 User PC 端路由索引

#### 14.3.1 `/user/dashboard` 至 `/user/quant/analytics` 完整路由表

User PC 端共 15 个页面，分为两类：9 个现有页面的量化增强（U01–U09，Phase P1）和 6 个新增独立页面（U10–U15，Phase P3）。增强类页面在已有交易、资产、订单等页面中嵌入 AI 信号提示条、量化策略绩效卡片、跟单持仓分组等组件，开发方式为"增量插入"而非页面重写。新增独立页面则构成 PC 端专属的量化中心生态，提供更宽屏幕下的多列布局和更高信息密度。

| 路由路径 | 页面编号 | 页面名称 | Phase |
|----------|----------|----------|-------|
| `/user/dashboard` | U01 | Dashboard — 量化策略绩效卡片 | P1 |
| `/user/trading/spot` | U02 | 现货交易 — AI 信号提示条 | P1 |
| `/user/trading/futures` | U03 | 合约交易 — AI 信号提示条 | P1 |
| `/user/trading/margin` | U04 | 杠杆交易 — AI 信号提示条 | P1 |
| `/user/assets` | U05 | 资产页 — 跟单持仓分组 + AI 评分标签 | P1 |
| `/user/wallet/deposit` | U06 | 充值页 — 策略订阅费支付入口 | P1 |
| `/user/trading/orders` | U07 | 订单管理 — 来源列 + 策略筛选 | P1 |
| `/user/profile` | U08 | 个人中心 — VIP 等级与量化权限 | P1 |
| `/user/ido` | U09 | IDO 申购 — AI 评分标签 | P1 |
| `/user/quant/center` | U10 | PC 端 AI 策略中心 | P3 |
| `/user/quant/copy-trades` | U11 | PC 端跟单管理 | P3 |
| `/user/quant/marketplace` | U12 | PC 端策略市场浏览 | P3 |
| `/user/quant/masters` | U13 | PC 端大师观点墙 | P3 |
| `/user/quant/reports` | U14 | PC 端报告库 | P3 |
| `/user/quant/analytics` | U15 | PC 端收益分析仪表板 | P3 |

User PC 端新增独立页面统一挂载于 `/user/quant/` 路径前缀下，形成独立的量化子模块命名空间。这一设计使得 PC 端量化功能与现有交易系统解耦，便于后续独立迭代和权限控制。9 个增强页面的开发工作量相对较轻（标记为"低"或"中"复杂度），主要工作在于复用 H5 端已有的 AI 评分和信号数据接口，以横幅、标签、分组等形式嵌入现有 UI。

### 14.4 开发规范速查

#### 14.4.1 页面复杂度判定标准与工时估算方法

页面复杂度是排期和资源分配的核心依据。复杂度判定采用多维度加权模型，从数据交互深度、视觉密度、实时性要求三个方向综合评估，最终将每个页面归类为高、中、低三个等级。

| 复杂度等级 | 判定标准 | 工时估算 | 典型特征 |
|------------|----------|----------|----------|
| **高** | 图表 ≥3 个 + 多 Tab 切换 + 实时数据 + AI 交互 | 3–5 倍标准工时 | 仪表盘点、信号矩阵、AI 对话、收益分析等；需 Chart.js/ECharts 深度定制、WebSocket 实时推送、AI 流式输出 |
| **中** | 表单 + 列表 + 筛选 + 简单交互 | 1.5–2 倍标准工时 | 持仓表格、策略列表、订阅管理、大师网格等；以数据展示和 CRUD 操作为主 |
| **低** | 纯展示 / 配置 / 静态内容 | 0.5–1 倍标准工时 | 登录页、404/403 页、设置表单、空状态、弹窗确认等；以静态渲染和基础交互为主 |

工时估算以"标准页面"为基准单位，一个标准页面定义为：单一表单或列表，无复杂图表，无实时数据，开发工时约 8–12 小时（含自测）。全量 120 个页面按复杂度加权后，总工时约等价于 160–180 个标准页面。高复杂度页面（28 个，占比 23%）是项目风险的主要来源，建议在 Phase 内优先安排其 API 接口和图表组件预研，避免阻塞后续联调。

#### 14.4.2 前端组件复用建议（跨模块共享组件清单）

量化模块与交易所现有系统之间存在大量 UI 层面的可复用点。以下清单梳理了跨模块共享的通用组件及其复用策略，旨在减少重复开发并保持多端体验一致性。

| 组件名称 | 来源模块 | 复用目标 | 复用方式 | 适配成本 |
|----------|----------|----------|----------|----------|
| 玻璃卡片（Glass Card） | UI 设计系统 V7 | 全部 120 页 | 直接复用 `Card.tsx`（4 变体） | 低 |
| 按钮系统（Button V4） | UI 设计系统 V7 | 全部 120 页 | 直接复用 `Button.tsx`（8 变体） | 低 |
| 图表封装（Chart Wrapper） | 公共组件 S09 | 管理后台 28 高复杂度页 + PC 端 6 页 | 复用 Chart.js/ECharts 封装，配置金融暗色主题 | 中 |
| H5 壳组件（H5Layout） | H5 移动端 | 全部 40 个 H5 页面 | 复用顶栏 + 底 Tab + 极光光带，扩展 5Tab→7Tab | 中 |
| 评分环（Score Ring） | 代币评分 W27 | H15 代币详情页、H02 信号推荐、U09 IDO 增强 | 提取为独立组件，支持 5 维雷达数据传入 | 低 |
| KPI 数字卡片 | 仪表盘 W01 | 管理后台全部高复杂度页 + PC 端 U10/U15 | 提取为独立组件，支持动画数字滚动 | 低 |
| 权限拦截组件 | 角色管理 W55 | 全部管理后台页面 | 复用 RBAC 封装，注入用户角色和权限矩阵 | 低 |
| 数据导出组件 | 导出中心 W59 | 策略分销、IPO 评估、审计日志等 | 复用 Excel/CSV/PDF 导出封装 | 低 |
| 推送通知组件 | 公共系统 S06 | H26–H29 通知跳转页 | 复用 WebSocket 连接管理和通知 UI | 低 |

复用优先级以"直接复用"为第一选择，仅在目标模块有明确差异化需求时才进行组件扩展。评分环和 KPI 数字卡片虽然初始仅在特定页面使用，但其数据展示模式在多个高复杂度页面中重复出现，建议尽早抽象为独立组件。H5Layout 的 5Tab→7Tab 改造（H13）涉及底部导航的结构性变更，需在设计阶段同步评估对现有页面 safe-area 适配的影响。

#### 14.4.3 跨端设计一致性要求（三端 Token 统一）

中萨交易所采用三端并行架构：管理后台（Light Admin 浅色主题）、H5 移动端（Aurora Premium 深色主题）、User PC 端（Aurora Premium 深色主题）。三端共享同一套 Design Tokens 基础层，但在语义层根据各自场景做主题映射。

跨端一致性要求的核心在于确保"同一业务概念在不同端呈现相同视觉语义"。具体执行规则如下：品牌蓝（`#1677FF`）在三端均映射为主操作色（主按钮、链接、活跃状态）；皇家金（`#F0B90B`）在三端均映射为 VIP/财富/重要提示色；涨跌色的跨端映射存在差异——Web/H5 端使用 `#16C784`（上涨）和 `#EA3943`（下跌），Admin 后台使用 `#16A34A` 和 `#DC2626`，此差异基于交易终端与后台系统的视觉传统而设定，需在组件层通过主题切换自动适配。字体栈方面，三端共享同一套回退顺序（Inter → PingFang SC → Microsoft YaHei → 系统默认），但 Admin 端正文基准字号采用 14px，Web/H5 端采用 16px，以适配后台更高信息密度的场景。间距系统基于 4px 基准网格统一，三端均遵循 `Token = n×4px` 的换算规则。开发人员在使用 Tailwind 类名时，应优先通过 `theme()` 函数引用 Token 值，而非硬编码色值或尺寸，以确保主题切换时样式正确联动。

---

## 附录 A：UI 组件速查表

### A.1 CSS 类名索引（按类别组织）

以下类名索引覆盖 Aurora Premium v7 设计系统中的全部工具类，按功能类别分组。开发人员可通过类名前缀快速定位目标样式，避免在代码中重复书写冗长的 CSS 声明。

| 类别 | 类名 | 效果说明 |
|------|------|----------|
| **背景类** | `.aurora-bg` | 多层极光渐变网格背景（金/青/紫/翠/粉五色光晕层叠） |
| **背景类** | `.starfield-bg` | 星空点缀背景（随机分布的白色小点，模拟星空） |
| **背景类** | `.grid-aurora` | 极光点阵网格（作为背景装饰层使用） |
| **背景类** | `.bg-up` / `.bg-down` | 涨跌色背景（上涨 `#16C784` / 下跌 `#EA3943`） |
| **卡片类** | `.glass-aurora` | 标准极光玻璃卡片（`backdrop-filter: blur(24px) saturate(180%)`，透明度 55%–70%） |
| **卡片类** | `.glass-aurora-light` | 轻量玻璃卡片（`blur(20px)`，用于次要卡片） |
| **卡片类** | `.glass-aurora-hover` | 卡片悬浮效果（边框金色 + 背景提亮 + 微上浮 2px） |
| **卡片类** | `.card-aurora` | 极光卡片 + 顶部金色高光线（最常用通用卡片） |
| **卡片类** | `.card-aurora-cyan` | 顶部青色高光线（科技/行情模块专用） |
| **卡片类** | `.card-aurora-violet` | 顶部紫色高光线（AI/Web3 模块专用） |
| **卡片类** | `.card-aurora-rainbow` | 顶部彩虹（金→青→紫）高光线（VIP/核心功能） |
| **卡片类** | `.card-royal` | 皇家卡片（85%/95% 不透明度 + 金色边框，Admin 场景） |
| **卡片类** | `.card-deep` | 深色实底卡片 + 基础边框（数据密集型表格容器） |
| **卡片类** | `.card-light` | 白色底 + 浅灰边框（Admin 浅色主题专用） |
| **按钮类** | `.btn-aurora-cta` | 蓝→紫渐变 + 青色辉光 + hover 闪光扫过效果 |
| **按钮类** | `.btn-aurora-gold` | 金色渐变 + 金色辉光 + hover 闪光扫过效果 |
| **按钮类** | `.btn-royal-gold` | 皇家金渐变 + 金色辉光（Admin/Web 跨端通用） |
| **文字类** | `.gradient-text-aurora` | 极光标题渐变文字（`135deg, #FCD535 → #38BDF8 → #A78BFA`） |
| **文字类** | `.gradient-text-gold` | 金色渐变文字（`135deg, #FEF3C7 → #FCD535 → #F0B90B → #E8A317`） |
| **文字类** | `.number-gold` | 金色数字样式（价格、资产金额等高亮数字） |
| **文字类** | `.text-up` / `.text-down` | 涨跌色文字（上涨绿 / 下跌红） |
| **光效类** | `.glow-aurora-gold` | 皇家金色发光（`0 0 32px rgba(240,185,11,0.35)`） |
| **光效类** | `.glow-aurora-cyan` | 极光青色聚焦发光（`0 0 24px rgba(56,189,248,0.35)`） |
| **光效类** | `.glow-aurora-violet` | 极光紫色聚焦发光（`0 0 24px rgba(167,139,250,0.35)`） |
| **光效类** | `.glow-blue` / `.glow-purple` | 品牌蓝辉光 / Web3 紫辉光 |
| **边框类** | `.border-aurora-gold` | 极光金色边框 |
| **边框类** | `.border-aurora-cyan` | 极光青色边框 |
| **边框类** | `.border-aurora-violet` | 极光紫色边框 |
| **装饰类** | `.gold-top-line` | 金色顶部装饰线（`border-image` 渐变实现） |
| **装饰类** | `.gold-bottom-line` | 金色底部装饰线 |
| **装饰类** | `.gold-underline` | 金色下划线（文字装饰） |
| **装饰类** | `.aurora-orb-*` | 极光光斑装饰（6 种颜色变体，`*` 替换为 gold/cyan/violet/emerald/rose/blue） |
| **图表类** | `.kline-candle-up` / `.kline-candle-down` | K 线蜡烛图样式（上涨/下跌） |
| **图表类** | `.kline-grid` | K 线图表网格线样式 |
| **动画类** | `.anim-aurora-flow` | 光流体动画（缩放 + 位移 + 透明度循环，周期 12–14s） |
| **动画类** | `.anim-aurora-drift` | 光斑慢漂移动画（周期 18s） |
| **动画类** | `.anim-aurora-rise` | 光斑上升动画（上下浮动，周期 22s） |
| **动画类** | `.anim-gold-shine` | 金色脉冲动画（box-shadow 呼吸闪烁，周期 3s） |
| **动画类** | `.anim-fade-in-up` | 页面进入动画（透明 + 上移 10px → 可见 + 原位） |
| **其他** | `.badge-aurora` | 极光玻璃徽章（状态标签、评级徽标） |
| **其他** | `.divider-aurora` | 极光渐变分隔线（替代纯色分隔线） |
| **其他** | `.aurora-top-band` | 顶部 2px 极光光带（透明→金→青→紫→透明） |

### A.2 Tailwind 自定义颜色使用方式

设计系统通过 Tailwind CSS 的 `theme.extend` 配置将 Design Tokens 注册为工具类，开发人员可在 JSX 中直接以 Tailwind 类名的方式引用。

```tsx
// 背景色
<div className="bg-aurora-base">           {/* 皇家深蓝 #0F1B3D */}
<div className="bg-aurora-card">           {/* 玻璃卡片底色 rgba(26,36,86,0.55) */}
<div className="bg-aurora-deep">           {/* 深色实底 #1A2456 */}

// 文字色
<div className="text-text-primary">        {/* 雪白主文字 #F8FAFC */}
<div className="text-text-secondary">      {/* 次文字 #B4C0E0 */}
<div className="text-text-muted">          {/* 辅助文字 #7B89B8 */}

// 边框
<div className="border-aurora-border">     {/* 标准玻璃边框 rgba(148,163,184,0.18) */}

// 功能色
<div className="text-up">                  {/* 上涨绿 #16C784 */}
<div className="text-down">                {/* 下跌红 #EA3943 */}
<button className="btn-aurora-gold">       {/* 金色主按钮 */}
<div className="card-aurora">              {/* 极光卡片 + 顶部金线 */}

// 渐变文字
<span className="gradient-text-aurora">极光标题</span>
<span className="gradient-text-gold">128,456.78</span>
<span className="number-gold">资产数字</span>

// 发光效果
<div className="glow-aurora-gold">金色发光元素</div>
<div className="glow-aurora-cyan">青色发光元素</div>
```

### A.3 CSS 变量直接引用

在自定义 CSS/SCSS 或内联样式中，可通过 CSS 自定义属性（Custom Properties）直接引用 Design Tokens 值。以下列出最常用的变量映射。

```css
/* 核心色彩 */
.my-element {
  color: var(--text-primary);              /* #F8FAFC — 主文字 */
  color: var(--text-secondary);            /* #B4C0E0 — 次文字 */
  color: var(--brand-gold);                /* #F0B90B — 皇家金 */
  color: var(--brand-blue);                /* #1677FF — 品牌蓝 */
  color: var(--color-up);                  /* #16C784 — 上涨绿 */
  color: var(--color-down);                /* #EA3943 — 下跌红 */

  /* 背景 */
  background: var(--bg-aurora-base);       /* #0F1B3D — 皇家深蓝 */
  background: var(--bg-aurora-card);       /* rgba(26,36,86,0.55) — 玻璃卡片 */
  background: var(--bg-aurora-deep);       /* #15224A — 星空靛 */

  /* 边框 */
  border-color: var(--border-aurora);      /* rgba(148,163,184,0.18) */
  border-color: var(--border-aurora-subtle); /* rgba(148,163,184,0.10) */

  /* 阴影 */
  box-shadow: var(--shadow-aurora-card);   /* 三层复合极光卡片阴影 */
  box-shadow: var(--shadow-glow-gold);     /* 金色辉光 */
  box-shadow: var(--shadow-glow-aurora);   /* 极光合辉 */
}
```

CSS 变量在 `design-tokens.ts`（483 行，双主题）中以 TypeScript 接口定义，并在运行时根据当前主题（Aurora Premium / Dark Trading / Light Admin）自动注入对应的变量值。开发人员在编写自定义样式时，应优先使用变量引用而非硬编码色值，以确保主题切换和后期 Token 调整的兼容性。

---

## 附录 B：源文件索引

### B.1 核心源文件清单

以下 8 个源文件构成中萨交易所 UI 设计系统的全部代码资产，覆盖 Design Tokens、全局样式、Tailwind 配置及核心组件实现。文件按依赖层级排序，底层 Token 文件位于列表前方，组件实现位于后方。

| 文件名称 | 路径 | 行数 | 内容说明 |
|----------|------|------|----------|
| Design Tokens v7 | `src/styles/tokens.ts` | 543 行 | 完整设计令牌定义，含色系、字体、间距、圆角、阴影、动画时长、Z-Index 层级、Tailwind 扩展配置 |
| Design Tokens（双主题） | `src/styles/design-tokens.ts` | 483 行 | 暗色/亮色双主题令牌，含 TypeScript 接口定义与 CSS 变量生成逻辑，支持运行时主题切换 |
| 全局 CSS | `src/app/globals.css` | 905 行 | Aurora Premium 完整全局样式，含全部工具类定义、动画 @keyframes、玻璃拟态基础配方、无障碍减弱动效媒体查询 |
| Tailwind 配置 | `tailwind.config.ts` | — | 集成 Design Tokens 的 Tailwind 配置文件，暗色模式通过 `class` 策略切换，自定义颜色/间距/圆角/阴影均映射至 Token |
| H5 布局组件 | `src/components/h5/H5Layout.tsx` | 222 行 | H5 壳组件，实现固定顶栏（Logo + 通知铃铛 + 极光光带）、固定底部 Tab 导航（5→7 Tab）、safe-area 安全区适配、内容滚动区布局 |
| H5 首页组件 | `src/components/h5/H5Home.tsx` | 349 行 | H5 首页完整 UI 实现，含资产总览卡、实时行情区、业务矩阵入口（6→8 扩展）、热点资讯、牌照信任区的实际样式代码 |
| Button 组件 V4 | `src/components/ui/Button.tsx` | 285 行 | 按钮系统第四版实现，支持 8 种变体（primary/secondary/cta/success/danger/warning/ghost/link）、双主题适配、3 种尺寸（sm/md/lg）、加载/禁用状态 |
| Card 组件 V4 | `src/components/ui/Button.tsx` | 83 行 | 卡片系统第四版实现，支持 4 种变体（glass-aurora/card-aurora/card-deep/card-light）、双主题适配、Hover 交互效果、顶部高光线装饰 |

上述 8 个文件的代码量合计约 2,870 行（不含 Tailwind 配置文件），构成整个设计系统的运行时基础。`tokens.ts` 与 `design-tokens.ts` 的关系为：前者定义单主题（Aurora Premium）的完整 Token 值，后者在此基础上扩展为双主题体系并增加 CSS 变量生成能力。全局 CSS（905 行）是代码量最大的单个文件，其中动画 @keyframes 定义和玻璃拟态配方占据主要篇幅。H5Layout 和 H5Home 是 H5 端开发的两个核心参考实现，所有后续 H5 页面的布局结构均应以它们为模板。Button 和 Card 组件是使用率最高的两个基础组件，覆盖了 120 个页面中超过 90% 的按钮和卡片场景。

---

## 附录 C：术语表与参考

### C.1 术语表

以下术语按所属领域分为设计术语、行业术语和技术术语三类，涵盖中萨交易所设计规格说明书和量化交易模块中涉及的全部专业词汇。

| 术语 | 英文 | 定义 | 所属领域 |
|------|------|------|----------|
| **Aurora Premium** | — | 极光尊享主题，中萨交易所 v7 核心视觉主题。以皇家深蓝 `#0F1B3D` 为底色，叠加金/青/紫/翠/粉五色极光光晕，营造深邃通透的金融级科技感 | 设计术语 |
| **Glassmorphism 2.0** | — | 玻璃拟态 2.0，v7 卡片质感标准。通过 `backdrop-filter: blur(24px) saturate(180%)` 配合 55%–70% 透明度、顶部高光线装饰和金属感边框，实现比传统 Glassmorphism 更强的层次感和质感 | 设计术语 |
| **Design Tokens** | — | 设计令牌，将颜色、字体、间距、圆角、阴影等视觉属性抽象为具名变量，以代码形式存储并在设计和开发之间共享，确保跨平台一致性 | 设计术语 |
| **极光五色呼吸** | Aurora Five-Color Breathing | v7 核心光效机制，六种颜色（皇家金/钻石青/紫罗兰/翠绿/玫瑰粉/暮蓝）以不同周期和透明度在背景中缓慢呼吸移动，营造动态光晕效果 | 设计术语 |
| **光流体动画** | aurora-flow | 背景光斑的复合动画，同时执行缩放（0.7→1.15→0.95）、位移和透明度循环，周期 12–14 秒 | 设计术语 |
| **AIOPC** | AI-Oriented Productivity City | 人工智能导向的生产力城市，陈氏集团旗下的产业园生态品牌，为入驻企业提供 AI 工具和数字化赋能服务 | 行业术语 |
| **CEX** | Centralized Exchange | 中心化交易所，由中心化机构运营和管理的加密货币交易平台，与 DEX（去中心化交易所）相对 | 行业术语 |
| **DCF** | Discounted Cash Flow | 现金流折现法，一种通过预测未来自由现金流并以适当折现率折算到现值来评估企业或资产内在价值的财务模型 | 行业术语 |
| **IDO** | Initial DEX Offering | 首次去中心化交易所发行，一种通过去中心化交易所进行代币首次公开发行的融资方式 | 行业术语 |
| **KYC** | Know Your Customer | 了解你的客户，金融机构用于验证客户身份的合规流程，包含身份认证、地址证明、面部识别等步骤 | 行业术语 |
| **AML** | Anti-Money Laundering | 反洗钱，防止通过金融系统将非法所得洗白为合法收入的法律法规和内部控制体系 | 行业术语 |
| **RBAC** | Role-Based Access Control | 基于角色的访问控制，一种权限管理模型，通过为用户分配角色并为角色授予权限来实现访问控制 | 技术术语 |
| **TWAP** | Time-Weighted Average Price | 时间加权平均价格算法，一种将大额订单在指定时间段内均匀拆分为多笔小额订单执行的算法交易策略，以降低市场冲击成本 | 技术术语 |
| **VWAP** | Volume-Weighted Average Price | 成交量加权平均价格算法，一种根据历史成交量分布来拆分大额订单的算法交易策略，使执行价格尽可能接近市场 VWAP | 技术术语 |
| **WOPC** | World Online Productivity City | 世界在线生产力城市，AIOPC 的全球化线上平台品牌 | 行业术语 |
| **JWT** | JSON Web Token | 一种基于 JSON 的开放标准（RFC 7519），用于在各方之间安全地传输信息，常用于身份认证和授权 | 技术术语 |
| **夏普比率** | Sharpe Ratio | 衡量投资组合风险调整后收益的指标，计算公式为（投资组合预期收益率 - 无风险利率）/ 投资组合收益率标准差 | 行业术语 |
| **蒙特卡洛模拟** | Monte Carlo Simulation | 一种通过重复随机采样来预测可能结果范围的统计方法，在 IPO 定价模拟器中用于生成上市后股价走势概率分布 | 行业术语 |

### C.2 外部参考来源

中萨交易所 Aurora Premium v7 设计系统的视觉语言和技术方案参考了以下行业领先平台的最新设计规范，以确保与国际一流金融科技产品的用户体验对齐。

| 参考来源 | 版本/时间 | 参考价值 |
|----------|-----------|----------|
| **Stripe** | 2026 | 支付流程的极简交互设计、表单体验优化、空状态插画风格 |
| **Coinbase Advanced** | 2024–2025 | 交易终端的信息密度控制、专业级图表配色、订单簿深度可视化 |
| **OKX Web3** | 2024–2025 | Web3 模块的视觉语言（紫色调、科技感图标）、钱包连接交互模式 |
| **Kraken Pro** | 2024–2025 | 专业交易界面的布局框架、多栏响应式适配、暗色主题对比度控制 |
| **Bybit V5** | 2024–2025 | 衍生品交易 UI 的复杂度管理、高级订单类型表单设计、实时数据推送的动效处理 |

上述外部参考并非直接复用，而是作为设计决策的基准和灵感来源。Aurora Premium 的"皇家深蓝 + 极光五色"配色体系、Glassmorphism 2.0 卡片质感以及光流体动画均为中萨交易所的原创设计表达，在行业内具有独特的视觉识别度。
