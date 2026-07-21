# Q05-FrontPortal-P4-Core-Portal-Skeleton Plan

> 任务编号：`Q05-FrontPortal-P4-Core-Portal-Skeleton`
> 文档版本：v1（2026-07-21 起草）
> 上游规划：[`5000-page-architecture-plan.md`](./5000-page-architecture-plan.md)
> 设计基线：[`src/components/portal-preview/SPEC.md`](../../../src/components/portal-preview/SPEC.md)（v6 纯黑无色相）
> 品牌色系：[`src/components/portal-preview/brand.ts`](../../../src/components/portal-preview/brand.ts)
> 项目记忆：[`project_memory.md`](../../../../../c:/Users/HUAWEI/.trae-cn/memory/projects/-d-3--------trae-projects-Stock-Exchange-dapp20260608-01/project_memory.md)

---

## 第 1 章：P4 阶段定位

### 1.1 任务定义
P4 = **300 页核心门户骨架建设**。本阶段不实现 300 个完整页面，而是建立：
- 300 页核心门户页面清单（编号 + 元数据）
- 核心模块路由规划（A-J 共 10 个模块）
- 页面模板分层（10 类模板）
- 动态内容生成策略（静态生成 / 模板生成 / 内容驱动）
- 导航结构（顶部 + 侧栏 + 移动端）
- sitemap 分层策略
- 合规审核标记规则
- 首批可运行骨架页面（10-20 个静态入口）
- 与 5000 页容量池的映射关系

### 1.2 P4 在 Q05 中的位置
```
Q05-FrontPortal（新官网主线）
├─ P1 已完成（基础脚手架）
├─ P2 已完成（合规与设计基线）
├─ P3 已完成 49 个全新页面（P3.2-P3.49）
├─ P4 启动中（300 页核心门户骨架）          ← 当前阶段
├─ P5 待启动（1000 页核心产品矩阵）
├─ ...
└─ P48 待启动（产业资产扩展 + 福建老酒369 落地）
```

### 1.3 P4 与 5000 页容量池的关系
- 5000 页 = 理论容量上限（content + module + dynamic 三层合计）
- P4 的 300 页 = 5000 页中的**核心门户骨架子集**
- P4 编号 `P4-0001` ~ `P4-0300` 是这 300 页在 5000 页池中的**首批正式编号占用**
- 后续 P5-P48 不会再占用 0001-0300 编号段
- 福建老酒369 真实业务页（4501-5000）属于 P48 阶段，不在 P4 落地

### 1.4 P4 的硬性边界
| 维度 | 允许 | 禁止 |
|------|------|------|
| 页面数量 | 10-20 个静态骨架入口 | 一次性写 300 个完整页面 |
| 业务深度 | 入口级骨架 + 说明文案 | 接真实交易/资金/KYC |
| 福建老酒369 | 入口 + 风险披露 + 边界说明 | 接发行/发币/通证/认购/资产登记 |
| 设计系统 | 沿用 v6 纯黑无色相 | 改 v5 暖黑 / 硬编码非规范色 |
| 文件范围 | 新增 P4 文档/配置/模板/骨架页 | 改 APP/Admin/API/数据库/middleware |
| 历史 dirty | 不触碰 | 不擅自清理 / 修复 / commit |
| 旧官网 | 不移动 | 不删除 / 不当主线 |
| git | 不 commit | 不 push |

---

## 第 2 章：P4 与 P3 / P5 / 5000 页规划的关系

### 2.1 与 P3 的关系
- P3 已完成 49 个全新页面（P3.2 起始编号），覆盖：about / academy / advisor / aggregator / analytics / announcement / api-platform / bridge / buy-crypto / community / compliance / defi / derivatives / developer / discover / earn / ecosystem / explorer / fees / growth / institution / kyc / kyc-guide / launch / lrt / maker / market / mobile / monitor / nft / nft-market / otc / portfolio / privacy / provenance / quant / research / reserves / risk / risk-disclosure / rwa / security / spot-guide / support / trade / validator / wallet / watchlist / yield
- P3 页面保留在 `/portal-preview/*` 路由下，**P4 不得删除、修改、重命名 P3 任何文件**
- P4 路由新增在 `/portal-preview/markets` `/portal-preview/trade` `/portal-preview/assets` `/portal-preview/account` `/portal-preview/help` `/portal-preview/announcements` `/portal-preview/legal` `/portal-preview/industry` 等"入口聚合"路径
- P3 单页面（如 `/portal-preview/market`）与 P4 入口聚合页（如 `/portal-preview/markets`）路由不冲突，分别保留
- P3 单一组件（如 `PortalMarket.tsx`）与 P4 模板（如 `MarketEntryTemplate.tsx`）通过 props 组合复用，**不重复造轮子**

### 2.2 与 P5 的关系
- P5 = 1000 页核心产品矩阵（含现货/合约/理财/支付/借贷等深度产品页）
- P4 建立的 10 类模板会在 P5 阶段被批量实例化
- P4 建立的编号规则（`P4-XXXX`）和路由前缀（`/portal-preview/...`）会在 P5 沿用
- P4 的合规审核标记规则会在 P5 强制接入

### 2.3 与 5000 页规划的关系
- 5000 页 = 模块（A-P 共 16 个）× 深度（每模块多页）× 动态（`[symbol]` `[slug]` 等动态路由）
- P4 的 300 页只占用 A-J 共 10 个**核心入口**模块
- K-P 模块（API 平台/学院/研究/行业资讯/产业资产扩展等）的页面**不在 P4 范围内**，留给后续 P5-P48
- 福建老酒369 在 5000 页规划中位于 P 模块（产业资产扩展），范围 4501-5000，但在 P4 阶段仅在 J 模块（产业资产入口）下提供**单层入口骨架**，不进入 P 模块的 500 页深度建设

---

## 第 3 章：300 页核心门户模块分布

### 3.1 模块清单（A-J 共 10 个）

| 模块 | 编号段 | 页面数 | 说明 |
|------|--------|--------|------|
| A. 首页与品牌门户 | 0001-0030 | 30 | 首页 hero、品牌故事、生态、下载、联系、安全、机构、全球 |
| B. 行情与市场入口 | 0031-0070 | 40 | 大盘总览、现货榜、合约榜、新币榜、热搜榜、动态 `[symbol]` |
| C. 交易产品入口 | 0071-0110 | 40 | 现货入口、合约入口、杠杆入口、费率页、规则页、风险披露 |
| D. 账户与安全入口 | 0111-0145 | 35 | 登录、注册、KYC、安全中心、设备管理、反钓鱼、风控 |
| E. 资产与钱包入口 | 0146-0180 | 35 | 资产总览、钱包、充值、提现、转账、历史、费率、风险披露 |
| F. 机构业务入口 | 0181-0205 | 25 | VIP、做市商、项目方、API、托管、机构申请 |
| G. 帮助中心入口 | 0206-0240 | 35 | 新手入门、账户帮助、KYC 帮助、充值提现、交易帮助、安全、FAQ、动态 `[slug]` |
| H. 公告与规则入口 | 0241-0265 | 25 | 最新公告、上新公告、维护公告、规则公告、风险公告、动态 `[slug]` |
| I. 合规与风险披露入口 | 0266-0285 | 20 | 用户协议、隐私政策、Cookie、风险披露、免责声明、限制区域、AML/KYC、合规研究 |
| J. 产业资产入口（含福建老酒369） | 0286-0300 | 15 | 产业资产总览、福建老酒369 入口、关于、H5 入口、产品介绍、合规、风险披露 |

### 3.2 合计
**300 页核心门户骨架**，覆盖 10 个核心入口模块。

### 3.3 模块优先级
- P4 阶段首批实现 10-20 个静态骨架页面，**仅覆盖每个模块的"入口聚合页 + 关键说明页"**
- 高优先级：J 模块福建老酒369 入口（4501-5000 规划的提前曝光）+ I 模块合规披露（合规底线优先）
- 中优先级：B / C / E / G / H 五个高频模块入口
- 低优先级：A / D / F 三个低频模块入口（先聚合页，详细页留 P5）

---

## 第 4 章：300 页编号规则

### 4.1 编号格式
- 格式：`P4-XXXX`
- 范围：0001-0300
- 总数：300

### 4.2 编号段分配

| 编号段 | 模块 | 页面数 | 起始 | 结束 |
|--------|------|--------|------|------|
| P4-A | 首页与品牌门户 | 30 | 0001 | 0030 |
| P4-B | 行情与市场入口 | 40 | 0031 | 0070 |
| P4-C | 交易产品入口 | 40 | 0071 | 0110 |
| P4-D | 账户与安全入口 | 35 | 0111 | 0145 |
| P4-E | 资产与钱包入口 | 35 | 0146 | 0180 |
| P4-F | 机构业务入口 | 25 | 0181 | 0205 |
| P4-G | 帮助中心入口 | 35 | 0206 | 0240 |
| P4-H | 公告与规则入口 | 25 | 0241 | 0265 |
| P4-I | 合规与风险披露入口 | 20 | 0266 | 0285 |
| P4-J | 产业资产入口 | 15 | 0286 | 0300 |

### 4.3 每页元数据（共 12 个字段）
每个 P4 页面必须在 `p4-core-pages.ts` 中记录以下 12 个元数据字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | `P4-XXXX` 格式 |
| module | 'A'\|'B'\|...\|'J' | 所属模块 |
| title | string | 页面标题（中文） |
| slug | string | URL slug |
| route | string | 完整路由（含动态段） |
| pageType | enum | 入口聚合 / 详情页 / 列表页 / 表单页 / 说明页 / 状态页 |
| isHandwritten | boolean | 是否手写页面（true=需要写 TSX，false=可由模板生成） |
| isTemplate | boolean | 是否基于模板生成 |
| isContentDriven | boolean | 是否内容驱动（MDX/Markdown/JSON） |
| requiresAuth | boolean | 是否需要登录态 |
| isFundsRelated | boolean | 是否资金相关 |
| isTradingRelated | boolean | 是否交易相关 |
| isKycRelated | boolean | 是否 KYC 相关 |
| requiresStrictCompliance | boolean | 是否强合规审核 |
| canStaticPreview | boolean | 是否可静态预览（无需后端） |
| includeInSitemap | boolean | 是否纳入 sitemap |

### 4.4 编号段与路由对应示例

```text
P4-A 0001-0030
  P4-0001  → /portal-preview
  P4-0002  → /portal-preview/about
  P4-0003  → /portal-preview/products
  P4-0004  → /portal-preview/ecosystem
  P4-0005  → /portal-preview/download
  P4-0006  → /portal-preview/contact
  P4-0007  → /portal-preview/brand
  P4-0008  → /portal-preview/security
  P4-0009  → /portal-preview/institutional
  P4-0010  → /portal-preview/global
  P4-0011 ~ P4-0030  → 后续扩展占位

P4-B 0031-0070
  P4-0031  → /portal-preview/markets              （入口聚合）
  P4-0032  → /portal-preview/markets/overview
  P4-0033  → /portal-preview/markets/spot
  P4-0034  → /portal-preview/markets/futures
  P4-0035  → /portal-preview/markets/rankings
  P4-0036  → /portal-preview/markets/new
  P4-0037  → /portal-preview/markets/trending
  P4-0038  → /portal-preview/markets/[symbol]      （动态）
  P4-0039 ~ P4-0070  → 后续扩展

P4-C 0071-0110
  P4-0071  → /portal-preview/trade
  P4-0072  → /portal-preview/trade/spot
  P4-0073  → /portal-preview/trade/futures
  P4-0074  → /portal-preview/trade/margin
  P4-0075  → /portal-preview/trade/fees
  P4-0076  → /portal-preview/trade/rules
  P4-0077  → /portal-preview/trade/risk-disclosure
  P4-0078 ~ P4-0110  → 后续扩展

P4-D 0111-0145
  P4-0111  → /portal-preview/account
  P4-0112  → /portal-preview/account/login
  P4-0113  → /portal-preview/account/register
  P4-0114  → /portal-preview/account/kyc
  P4-0115  → /portal-preview/account/security
  P4-0116  → /portal-preview/account/devices
  P4-0117  → /portal-preview/account/anti-phishing
  P4-0118  → /portal-preview/account/risk-control
  P4-0119 ~ P4-0145  → 后续扩展

P4-E 0146-0180
  P4-0146  → /portal-preview/assets
  P4-0147  → /portal-preview/assets/overview
  P4-0148  → /portal-preview/assets/wallet
  P4-0149  → /portal-preview/assets/deposit
  P4-0150  → /portal-preview/assets/withdraw
  P4-0151  → /portal-preview/assets/transfer
  P4-0152  → /portal-preview/assets/history
  P4-0153  → /portal-preview/assets/fees
  P4-0154  → /portal-preview/assets/risk-disclosure
  P4-0155 ~ P4-0180  → 后续扩展

P4-F 0181-0205
  P4-0181  → /portal-preview/institutional
  P4-0182  → /portal-preview/institutional/vip
  P4-0183  → /portal-preview/institutional/market-maker
  P4-0184  → /portal-preview/institutional/project
  P4-0185  → /portal-preview/institutional/api
  P4-0186  → /portal-preview/institutional/custody
  P4-0187  → /portal-preview/institutional/apply
  P4-0188 ~ P4-0205  → 后续扩展

P4-G 0206-0240
  P4-0206  → /portal-preview/help
  P4-0207  → /portal-preview/help/getting-started
  P4-0208  → /portal-preview/help/account
  P4-0209  → /portal-preview/help/kyc
  P4-0210  → /portal-preview/help/deposit
  P4-0211  → /portal-preview/help/withdraw
  P4-0212  → /portal-preview/help/trading
  P4-0213  → /portal-preview/help/security
  P4-0214  → /portal-preview/help/faq
  P4-0215  → /portal-preview/help/[slug]           （动态）
  P4-0216 ~ P4-0240  → 后续扩展

P4-H 0241-0265
  P4-0241  → /portal-preview/announcements
  P4-0242  → /portal-preview/announcements/latest
  P4-0243  → /portal-preview/announcements/listings
  P4-0244  → /portal-preview/announcements/maintenance
  P4-0245  → /portal-preview/announcements/rules
  P4-0246  → /portal-preview/announcements/risk
  P4-0247  → /portal-preview/announcements/[slug]  （动态）
  P4-0248 ~ P4-0265  → 后续扩展

P4-I 0266-0285
  P4-0266  → /portal-preview/legal
  P4-0267  → /portal-preview/legal/terms
  P4-0268  → /portal-preview/legal/privacy
  P4-0269  → /portal-preview/legal/cookie
  P4-0270  → /portal-preview/legal/risk-disclosure
  P4-0271  → /portal-preview/legal/disclaimer
  P4-0272  → /portal-preview/legal/restricted-regions
  P4-0273  → /portal-preview/legal/aml-kyc
  P4-0274  → /portal-preview/legal/compliance-research
  P4-0275 ~ P4-0285  → 后续扩展

P4-J 0286-0300
  P4-0286  → /portal-preview/industry
  P4-0287  → /portal-preview/industry/fujian-laojiu-369
  P4-0288  → /portal-preview/industry/fujian-laojiu-369/about
  P4-0289  → /portal-preview/industry/fujian-laojiu-369/h5
  P4-0290  → /portal-preview/industry/fujian-laojiu-369/products
  P4-0291  → /portal-preview/industry/fujian-laojiu-369/issuance
  P4-0292  → /portal-preview/industry/fujian-laojiu-369/token
  P4-0293  → /portal-preview/industry/fujian-laojiu-369/compliance
  P4-0294  → /portal-preview/industry/fujian-laojiu-369/risk-disclosure
  P4-0295 ~ P4-0300  → 后续扩展（含其他产业资产入口）
```

---

## 第 5 章：核心路由规划

### 5.1 路由命名规范
- 一律使用 kebab-case（短横线分隔）
- 入口聚合页用复数（`/markets` `/assets` `/announcements`）
- 详情页用单数或 ID（`/markets/[symbol]`）
- 严格禁止中文路径
- 严格禁止大写字母
- 严格禁止下划线

### 5.2 路由分组与优先级

#### 5.2.1 首批必实现路由（P4 阶段 10-20 个静态骨架页面）
| 优先级 | 路由 | 所属模块 | 页面性质 | 状态 |
|--------|------|----------|----------|------|
| P0 | `/portal-preview/markets` | B | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/trade` | C | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/assets` | E | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/account` | D | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/help` | G | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/announcements` | H | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/legal` | I | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/industry` | J | 入口聚合 | 静态骨架 |
| P0 | `/portal-preview/industry/fujian-laojiu-369` | J | 产业资产入口 | 静态骨架 |
| P0 | `/portal-preview/industry/fujian-laojiu-369/risk-disclosure` | J | 风险披露 | 静态骨架 |

#### 5.2.2 次批实现路由（留 P5）
- `/portal-preview/markets/overview` `/spot` `/futures` `/rankings` `/new` `/trending` `/[symbol]`
- `/portal-preview/trade/spot` `/futures` `/margin` `/fees` `/rules` `/risk-disclosure`
- `/portal-preview/assets/overview` `/wallet` `/deposit` `/withdraw` `/transfer` `/history` `/fees` `/risk-disclosure`
- `/portal-preview/account/login` `/register` `/kyc` `/security` `/devices` `/anti-phishing` `/risk-control`
- `/portal-preview/help/getting-started` `/account` `/kyc` `/deposit` `/withdraw` `/trading` `/security` `/faq` `/[slug]`
- `/portal-preview/announcements/latest` `/listings` `/maintenance` `/rules` `/risk` `/[slug]`
- `/portal-preview/legal/terms` `/privacy` `/cookie` `/risk-disclosure` `/disclaimer` `/restricted-regions` `/aml-kyc` `/compliance-research`
- `/portal-preview/industry/fujian-laojiu-369/about` `/h5` `/products` `/issuance` `/token` `/compliance`
- `/portal-preview/institutional` `/vip` `/market-maker` `/project` `/api` `/custody` `/apply`
- 首页聚合相关 `/portal-preview/about` `/products` `/ecosystem` `/download` `/contact` `/brand` `/security` `/institutional` `/global`

### 5.3 动态路由策略
- 行情：`[symbol]` 大写字母数字组合（`BTCUSDT`）
- 帮助：`[slug]` 短横线小写（`how-to-buy-bitcoin`）
- 公告：`[slug]` 短横线小写（`2026-07-21-btc-listing`）
- 产业资产：`[series]` `[sku]` `[assetId]` `[batchNo]`

### 5.4 路由守卫
- 静态骨架页面：无需守卫
- 涉及登录/资金/交易/KYC：P5 阶段统一接入 `withAuth` 中间件
- 福建老酒369 风险披露：P4 阶段必须可公开访问

---

## 第 6 章：页面模板分层

### 6.1 10 类模板

| 模板 | 文件 | 用途 | 复用范围 |
|------|------|------|----------|
| 1. PortalLandingTemplate | `templates/PortalLandingTemplate.tsx` | 首页、品牌页、生态页、机构入口页 | A / F 模块 |
| 2. MarketEntryTemplate | `templates/MarketEntryTemplate.tsx` | 行情入口、市场榜单、币种列表 | B 模块 |
| 3. ProductEntryTemplate | `templates/ProductEntryTemplate.tsx` | 交易产品、现货、合约、费率、规则入口 | C 模块 |
| 4. AccountEntryTemplate | `templates/AccountEntryTemplate.tsx` | 登录、注册、KYC、安全中心等入口说明 | D 模块 |
| 5. AssetEntryTemplate | `templates/AssetEntryTemplate.tsx` | 资产、钱包、充值提现入口说明 | E 模块 |
| 6. HelpCenterTemplate | `templates/HelpCenterTemplate.tsx` | 帮助中心、FAQ、教程类内容 | G 模块 |
| 7. AnnouncementTemplate | `templates/AnnouncementTemplate.tsx` | 公告列表、公告详情、规则公告 | H 模块 |
| 8. LegalDisclosureTemplate | `templates/LegalDisclosureTemplate.tsx` | 法律条款、风险披露、免责声明 | I 模块 |
| 9. IndustryAssetTemplate | `templates/IndustryAssetTemplate.tsx` | 福建老酒369 及未来产业资产入口页 | J 模块 |
| 10. ErrorStateTemplate | `templates/ErrorStateTemplate.tsx` | 404、访问受限、维护中等状态页 | 全站 |

### 6.2 模板规范
- 所有模板统一基于 v6 纯黑无色相设计系统
- 所有模板 props 至少包含：`title` / `description` / `breadcrumbs` / `actions` / `children`
- 模板内部不接真实数据，仅展示 props 与 children
- 模板复用 P3 已有的 `BRAND` / `STATUS` 常量
- 模板不允许硬编码颜色，**全部从 `brand.ts` 导入**
- 模板文件大小：建议 8-15KB（中等复杂度）

### 6.3 模板与 P3 组件的关系
- 模板不重复实现 P3 已有组件功能
- 模板可以 `import` P3 组件作为子组件使用
- 例如 `MarketEntryTemplate` 可以 import `PortalMarket` 作为 hero 区块

---

## 第 7 章：导航与入口结构

### 7.1 顶部导航（Header）
基于 P3 已有的 `PortalHeader.tsx`，新增以下 P4 模块入口（与 P3 入口并存）：

```text
首页 (/) | 行情 (/portal-preview/markets) | 交易 (/portal-preview/trade) | 资产 (/portal-preview/assets)
| 账户 (/portal-preview/account) | 机构 (/portal-preview/institutional) | 产业 (/portal-preview/industry)
| 帮助 (/portal-preview/help) | 公告 (/portal-preview/announcements) | 规则 (/portal-preview/legal)
```

P3 已有的入口（`/portal-preview/market` `/wallet` `/trade` 等单数路径）保留在二级菜单或合并到 P4 入口聚合页下。

### 7.2 侧栏导航
- 仅在 4 类页面显示：合规披露页 / 帮助中心详情 / 公告详情 / 产业资产详情
- 数据源：`p4-navigation.ts` 中 `sidebarMenus` 配置

### 7.3 移动端底部 Tab
基于 P3 已有的 `PortalMobileBottomTabs.tsx`，P4 阶段保留 5 个 Tab：
1. 首页
2. 行情
3. 交易
4. 资产
5. 我的

新增"产业"Tab 不在 P4 首批实现范围。

### 7.4 面包屑
所有 P4 页面统一通过 `Breadcrumbs` 组件展示路径：
- 首页 > 行情 > 现货榜单
- 首页 > 产业资产 > 福建老酒369 > 风险披露

---

## 第 8 章：sitemap 分层策略

### 8.1 sitemap 分层

| sitemap | 路径 | 包含内容 | 优先级 |
|---------|------|----------|--------|
| 主 sitemap | `/sitemap.xml` | 所有可公开访问的 P4 + P3 页面 | 1.0 |
| P4 子 sitemap | `/portal-preview/sitemap-p4.xml` | 仅 300 页核心门户 | 0.9 |
| 公告 sitemap | `/portal-preview/announcements/sitemap.xml` | 公告动态 `[slug]` | 0.6 |
| 帮助 sitemap | `/portal-preview/help/sitemap.xml` | 帮助动态 `[slug]` | 0.6 |
| 行情 sitemap | `/portal-preview/markets/sitemap.xml` | 行情动态 `[symbol]` | 0.5 |
| 合规 sitemap | `/portal-preview/legal/sitemap.xml` | 合规与披露页 | 0.4 |
| 产业 sitemap | `/portal-preview/industry/sitemap.xml` | 福建老酒369 及未来产业资产 | 0.7 |

### 8.2 sitemap 字段
- `loc` 完整 URL
- `lastmod` ISO 8601
- `changefreq` daily / weekly / monthly
- `priority` 0.0-1.0
- `xhtml:link` hreflang 备用（P5 阶段启用国际化时）

### 8.3 排除规则
- 登录页（`/portal-preview/account/login`）不纳入 sitemap
- 注册页（`/portal-preview/account/register`）不纳入 sitemap
- KYC 详情页不纳入 sitemap
- 资金/交易内部子步骤不纳入 sitemap
- 任何需要 `requiresAuth=true` 的页面不纳入主 sitemap

### 8.4 robots.txt 配套
- 禁止爬取 `/api/*` `/admin/*` `/portal-preview/internal/*`
- 允许爬取 `/portal-preview/*`（除上述排除项）

---

## 第 9 章：合规审核标记规则

### 9.1 强合规审核场景（15 类）
| # | 场景 | 适用页面 |
|---|------|----------|
| 1 | 用户协议 | `/legal/terms` |
| 2 | 隐私政策 | `/legal/privacy` |
| 3 | 风险披露 | `/legal/risk-disclosure` `/trade/risk-disclosure` `/assets/risk-disclosure` |
| 4 | 免责声明 | `/legal/disclaimer` |
| 5 | 限制区域声明 | `/legal/restricted-regions` |
| 6 | AML/KYC 政策 | `/legal/aml-kyc` |
| 7 | KYC 流程说明 | `/account/kyc` `/help/kyc` |
| 8 | 资金费率说明 | `/trade/fees` `/assets/fees` |
| 9 | 充提现规则 | `/assets/deposit` `/assets/withdraw` `/help/deposit` `/help/withdraw` |
| 10 | 交易规则 | `/trade/rules` |
| 11 | 投资风险提示 | `/announcements/risk` |
| 12 | 产业资产风险披露 | `/industry/fujian-laojiu-369/risk-disclosure` |
| 13 | 产业资产合规说明 | `/industry/fujian-laojiu-369/compliance` |
| 14 | 产业资产发币/通证说明 | `/industry/fujian-laojiu-369/issuance` `/token` |
| 15 | 产业资产产品介绍 | `/industry/fujian-laojiu-369/products` |

### 9.2 18 个允许中性表达
- 合规研究
- 市场观察
- 风险披露
- 用户自行判断风险
- 区域市场观察
- 数字资产服务能力规划
- 产业资产信息化展示
- 链上存证与溯源能力规划
- 重点市场与合规研究方向
- 国际化合规观察方向
- 持牌主体研究
- 牌照申请研究
- 沙盒监管研究
- 数字资产交易合规研究
- 行业惯例参考
- 信息公示
- 用户协议与免责声明
- 数据来源说明

### 9.3 25 个禁止表达
| # | 禁止 |
|---|------|
| 1 | 萨摩亚持牌 |
| 2 | 萨摩亚牌照 |
| 3 | MSA 监管 |
| 4 | 已获萨摩亚监管许可 |
| 5 | Samoa licensed exchange |
| 6 | licensed in Samoa |
| 7 | regulated by Samoa |
| 8 | 全球合法运营 |
| 9 | 已获得多国监管许可 |
| 10 | 收益保障 |
| 11 | 保本收益 |
| 12 | 稳定收益 |
| 13 | 年化收益 |
| 14 | 资产绝对安全 |
| 15 | 零风险 |
| 16 | 稳赚 |
| 17 | 官方背书 |
| 18 | 监管认可 |
| 19 | 香港持牌 |
| 20 | 新加坡持牌 |
| 21 | 迪拜持牌 |
| 22 | 马耳他持牌 |
| 23 | 美国持牌 |
| 24 | 已取得多国监管 |
| 25 | 持牌身份 |

### 9.4 福建老酒369 强禁词（额外 15 个）
| # | 禁止 |
|---|------|
| 1 | 保收益 |
| 2 | 分红承诺 |
| 3 | 升值空间 |
| 4 | 必然升值 |
| 5 | 投资回报 |
| 6 | 持牌发行 |
| 7 | 合规发行保证 |
| 8 | 发币即上市 |
| 9 | 上线必涨 |
| 10 | 平台兜底 |
| 11 | 承诺回购 |
| 12 | 无风险认购 |
| 13 | 酒资产稳赚 |
| 14 | 保证可交易 |
| 15 | 保证可提现 |

### 9.5 合规审核标记位
每个 P4 页面在 `p4-core-pages.ts` 中通过 `requiresStrictCompliance` 字段标注。
- `true` = 强合规审核
- `false` = 普通审核

强合规页面在 `compliance-audit` 阶段必须由合规专员 + 工程 + 产品三方签字。

---

## 第 10 章：福建老酒369在 P4 阶段的边界

### 10.1 P4 允许的范围
仅建立**入口级骨架 + 风险披露 + 边界说明**，不接任何真实业务：

| 允许 | 路由 | 内容 |
|------|------|------|
| 产业资产总览 | `/portal-preview/industry` | 产业资产入口聚合页 |
| 福建老酒369 主页 | `/portal-preview/industry/fujian-laojiu-369` | 品牌介绍 + 边界说明 + 风险链接 |
| 关于 | `/portal-preview/industry/fujian-laojiu-369/about` | 福建老酒369 项目背景、文化价值 |
| H5 入口 | `/portal-preview/industry/fujian-laojiu-369/h5` | **仅展示"H5 已经做好，移动端 H5 入口已具备"的入口链接占位**，不嵌入真实 H5 业务 |
| 风险披露 | `/portal-preview/industry/fujian-laojiu-369/risk-disclosure` | 完整风险披露、免责声明 |
| 合规说明 | `/portal-preview/industry/fujian-laojiu-369/compliance` | 合规研究、监管观察说明 |

### 10.2 P4 禁止的范围
以下路由虽然规划存在，但 P4 阶段**不实现真实页面**（路由可保留 404/Coming Soon 状态）：

| 禁止 | 路由 | 原因 |
|------|------|------|
| 发行流程 | `/portal-preview/industry/fujian-laojiu-369/issuance` | 涉及真实发行系统 |
| 发币/通证 | `/portal-preview/industry/fujian-laojiu-369/token` | 涉及真实链上合约 |
| 产品购买 | `/portal-preview/industry/fujian-laojiu-369/products` | 涉及真实认购和资金 |

### 10.3 福建老酒369 H5 边界
- 福建老酒369 系统已经写好
- 福建老酒369 H5 已经做好
- P4 阶段仅在入口页说明"H5 已经做好，移动端 H5 入口已具备"
- **不接入真实 H5 业务逻辑**
- **不模拟 H5 操作**
- **不接真实资产登记**
- **不接真实认购**
- **不接真实钱包**

### 10.4 文档映射
- 福建老酒369 的 500 页深度规划（4501-5000）属于 P 模块（产业资产扩展），由 P48 阶段承担
- P4 阶段在 `p4-navigation.ts` 中为 `/industry/fujian-laojiu-369` 配置合规标签
- P4 阶段在 `p4-core-pages.ts` 中为所有 J 模块页面设置 `requiresStrictCompliance=true`

---

## 第 11 章：首批骨架页面开发计划

### 11.1 首批实现 10 个静态骨架页面

| # | 路由 | 模板 | 数据源 | 大小目标 |
|---|------|------|--------|----------|
| 1 | `/portal-preview/markets` | MarketEntryTemplate | 静态 mock | 30-50KB |
| 2 | `/portal-preview/trade` | ProductEntryTemplate | 静态 mock | 30-50KB |
| 3 | `/portal-preview/assets` | AssetEntryTemplate | 静态 mock | 30-50KB |
| 4 | `/portal-preview/account` | AccountEntryTemplate | 静态 mock | 30-50KB |
| 5 | `/portal-preview/help` | HelpCenterTemplate | 静态 mock | 30-50KB |
| 6 | `/portal-preview/announcements` | AnnouncementTemplate | 静态 mock | 30-50KB |
| 7 | `/portal-preview/legal` | LegalDisclosureTemplate | 静态 mock | 30-50KB |
| 8 | `/portal-preview/industry` | IndustryAssetTemplate | 静态 mock | 30-50KB |
| 9 | `/portal-preview/industry/fujian-laojiu-369` | IndustryAssetTemplate | 静态 mock | 40-60KB |
| 10 | `/portal-preview/industry/fujian-laojiu-369/risk-disclosure` | LegalDisclosureTemplate | 静态 mock | 30-50KB |

### 11.2 首批实现原则
- 仅展示静态入口和说明文案
- 不接真实数据接口
- 不接真实 API
- 不接真实表单提交
- 7 大交互（CountUp/Stagger/实时波动/Tab/Drawer/排序/快捷键）保留**至少 3 项**作为骨架活跃度
- 文案中所有"数据"必须标注"示例数据"或"规划中"

### 11.3 后续批次
- 11-20 个：补齐 `/markets/overview` `/trade/spot` `/assets/overview` `/account/login` `/help/getting-started` `/announcements/latest` `/legal/terms` 等
- 21-50 个：补齐所有 P4-A/P4-F 模块的入口聚合页
- 51-100 个：补齐所有列表页与详情页骨架
- 101-300 个：补齐所有动态路由和扩展占位

---

## 第 12 章：执行边界与禁止事项

### 12.1 允许范围
1. 新增 `docs/front-portal/q05/p4-core-portal-skeleton-plan.md`
2. 新增 `src/components/portal-preview/core/config/p4-core-pages.ts`
3. 新增 `src/components/portal-preview/core/config/p4-navigation.ts`
4. 新增 10 个模板组件 `src/components/portal-preview/core/templates/*.tsx`
5. 新增 10-20 个静态骨架入口页面 `src/app/portal-preview/.../page.tsx`
6. 复用现有 portal-preview 设计系统（`brand.ts` / `SPEC.md`）
7. 执行 `npx tsc --noEmit` 检查
8. 执行合规禁词搜索
9. 输出 `git status`

### 12.2 禁止范围（17 类）
1. 不要一次性写 300 个完整页面
2. 不要开发 5000 页
3. 不要开发福建老酒369 真实发行功能
4. 不要开发发币/通证真实业务
5. 不要接真实交易
6. 不要接真实资金
7. 不要接真实 KYC
8. 不要改数据库
9. 不要改 Admin
10. 不要改 APP
11. 不要改 API
12. 不要改 middleware
13. 不要移动旧官网
14. 不要删除旧官网
15. 不要修改旧官网为主线
16. 不要提交 commit
17. 不要 push

### 12.3 历史 dirty 处理
- 不擅自修复历史 dirty
- 不擅自清理历史 dirty
- 不擅自 commit 历史 dirty
- 仅在 P4 完成回报中说明 dirty 数量

---

## 第 13 章：验收标准

### 13.1 文档验收
- [ ] `docs/front-portal/q05/p4-core-portal-skeleton-plan.md` 已新增
- [ ] 文档包含 14 章全部内容
- [ ] 300 页编号规则 0001-0300 全部覆盖
- [ ] 10 个模块（A-J）路由全部列出
- [ ] 10 类模板全部说明
- [ ] sitemap 7 层结构完整
- [ ] 合规审核 15 类场景 + 18 个允许 + 25 个禁止 + 15 个福建老酒369 强禁词
- [ ] 福建老酒369 P4 边界清晰

### 13.2 配置验收
- [ ] `p4-core-pages.ts` 已新增
- [ ] 至少 30 个核心页面的元数据（10-20 个骨架页 + 10-20 个规划占位）
- [ ] 每个页面 12 字段完整
- [ ] `p4-navigation.ts` 已新增
- [ ] 顶部导航 + 侧栏 + 移动 Tab + 面包屑配置完整

### 13.3 模板验收
- [ ] 10 个模板组件文件已新增
- [ ] 模板 props 接口一致
- [ ] 模板使用 v6 纯黑无色相设计系统
- [ ] 模板不硬编码颜色（全部从 `brand.ts` 导入）

### 13.4 骨架页面验收
- [ ] 10-20 个静态骨架入口页面已新增
- [ ] 每个页面包含至少 3 项 7 大交互
- [ ] 每个页面使用对应模板
- [ ] 福建老酒369 风险披露页内容完整

### 13.5 视觉与合规
- [ ] v6 纯黑无色相设计系统已遵守
- [ ] 暖黑/暖金/金色系已禁止
- [ ] 合规禁词搜索已执行
- [ ] P4 新增文件 0 命中合规禁词
- [ ] 历史范围外命中仅记录不修复

### 13.6 边界验收
- [ ] APP / Admin / API / 数据库 / middleware 未修改
- [ ] 旧官网未移动
- [ ] 未提交 commit
- [ ] 未 push
- [ ] 福建老酒369 真实业务未开发
- [ ] 真实交易/资金/KYC 未接入

### 13.7 检查命令
```bash
# TypeScript 检查
npx tsc --noEmit

# 合规禁词搜索
rg -n "萨摩亚持牌|萨摩亚牌照|MSA 监管|已获萨摩亚监管许可|Samoa licensed exchange|licensed in Samoa|regulated by Samoa|全球合法运营|已获得多国监管许可|收益保障|保本收益|稳定收益|年化收益|资产绝对安全|零风险|稳赚|官方背书|监管认可|保收益|分红承诺|升值空间|必然升值|投资回报|持牌发行|合规发行保证|发币即上市|上线必涨|平台兜底|承诺回购|无风险认购|酒资产稳赚|保证可交易|保证可提现" \
  src/components/portal-preview/core \
  src/app/portal-preview/markets \
  src/app/portal-preview/trade \
  src/app/portal-preview/assets \
  src/app/portal-preview/account \
  src/app/portal-preview/help \
  src/app/portal-preview/announcements \
  src/app/portal-preview/legal \
  src/app/portal-preview/industry \
  docs/front-portal/q05/p4-core-portal-skeleton-plan.md
```

### 13.8 完成回报（按格式）
完整回报必须按本文件第十五节格式输出（详见 `5000-page-architecture-plan.md` 第 15 节）。

---

## 第 14 章：下一阶段 P5 衔接

### 14.1 P5 启动条件
- P4 完成回报通过验收（PASS / PASS WITH UI NOTES）
- P4 commit 已 freeze（可独立 commit 或并入 P3 收尾 commit）
- 福建老酒369 真实业务边界已明确

### 14.2 P5 范围预告
- P5 = 1000 页核心产品矩阵
- 模块：B / C / E / G / H 深度产品页
- 模板实例化：基于 P4 建立的 10 类模板批量生成
- 动态路由实例化：`[symbol]` `[slug]` 等动态路由接入 mock 数据
- 合规审核：基于 P4 建立的 15 类强合规场景执行

### 14.3 P5 与 P4 的衔接点
| 衔接点 | P4 交付物 | P5 接收方 |
|--------|----------|----------|
| 编号规则 | P4-0001 ~ P4-0300 | P5-0001 ~ P5-1000（继承编号格式） |
| 路由前缀 | `/portal-preview/...` | 沿用，不变 |
| 模板体系 | 10 类模板 | 模板实例化 + 新增产品页模板 |
| 合规规则 | 15 类强合规 + 25 禁词 + 15 老酒369 禁词 | 全量沿用 + 扩充 |
| 导航结构 | 顶部 + 侧栏 + 移动 Tab | 沿用，扩展二三级菜单 |
| sitemap | 7 层结构 | 扩充产业/教育/研究子 sitemap |

### 14.4 与 5000 页规划的最终映射
```
5000 页规划（A-P 共 16 模块）
├─ A 首页与品牌门户  →  P4 30 页 + P5 100 页
├─ B 行情与市场入口  →  P4 40 页 + P5 200 页
├─ C 交易产品入口    →  P4 40 页 + P5 200 页
├─ D 账户与安全入口  →  P4 35 页 + P5 100 页
├─ E 资产与钱包入口  →  P4 35 页 + P5 150 页
├─ F 机构业务入口    →  P4 25 页 + P5 100 页
├─ G 帮助中心入口    →  P4 35 页 + P5 50 页
├─ H 公告与规则入口  →  P4 25 页 + P5 50 页
├─ I 合规与风险披露  →  P4 20 页 + P5 50 页
├─ J 产业资产入口    →  P4 15 页 + P5 50 页（含老酒369 入口）
├─ K API 平台        →  P6 阶段
├─ L 学院            →  P7 阶段
├─ M 研究            →  P8 阶段
├─ N 行业资讯        →  P9 阶段
├─ O 区域合规        →  P10 阶段
└─ P 产业资产扩展    →  P48 阶段（含老酒369 4501-5000）
```

---

## 附录 A：P4 文件清单

### A.1 文档文件
- `docs/front-portal/q05/p4-core-portal-skeleton-plan.md`（本文档）

### A.2 配置文件
- `src/components/portal-preview/core/config/p4-core-pages.ts`
- `src/components/portal-preview/core/config/p4-navigation.ts`

### A.3 模板文件
- `src/components/portal-preview/core/templates/PortalLandingTemplate.tsx`
- `src/components/portal-preview/core/templates/MarketEntryTemplate.tsx`
- `src/components/portal-preview/core/templates/ProductEntryTemplate.tsx`
- `src/components/portal-preview/core/templates/AccountEntryTemplate.tsx`
- `src/components/portal-preview/core/templates/AssetEntryTemplate.tsx`
- `src/components/portal-preview/core/templates/HelpCenterTemplate.tsx`
- `src/components/portal-preview/core/templates/AnnouncementTemplate.tsx`
- `src/components/portal-preview/core/templates/LegalDisclosureTemplate.tsx`
- `src/components/portal-preview/core/templates/IndustryAssetTemplate.tsx`
- `src/components/portal-preview/core/templates/ErrorStateTemplate.tsx`

### A.4 骨架页面文件
- `src/app/portal-preview/markets/page.tsx`
- `src/app/portal-preview/trade/page.tsx`
- `src/app/portal-preview/assets/page.tsx`
- `src/app/portal-preview/account/page.tsx`
- `src/app/portal-preview/help/page.tsx`
- `src/app/portal-preview/announcements/page.tsx`
- `src/app/portal-preview/legal/page.tsx`
- `src/app/portal-preview/industry/page.tsx`
- `src/app/portal-preview/industry/fujian-laojiu-369/page.tsx`
- `src/app/portal-preview/industry/fujian-laojiu-369/risk-disclosure/page.tsx`

### A.5 复用文件（不修改）
- `src/components/portal-preview/brand.ts`（品牌色系）
- `src/components/portal-preview/SPEC.md`（设计规范）
- 已有 P3 组件（`PortalMarket` `PortalTrade` `PortalWallet` 等）

---

## 附录 B：版本与变更记录

| 版本 | 日期 | 变更 | 作者 |
|------|------|------|------|
| v1 | 2026-07-21 | 首次起草 P4 阶段 300 页核心门户骨架规划 | Trae CN Solo |

---

**文档状态：Draft v1**
**下一步：等待 P4 阶段执行回报 + 验收**
