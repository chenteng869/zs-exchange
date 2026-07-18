# 00 - 当前前台基线（Current Frontsite Baseline）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 00
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读盘点，**不修改任何业务代码**

---

## 1. Git 基线

| 项 | 值 |
|---|---|
| branch | `main` |
| HEAD | `afa6c9debca704e1fd7ae177ae50a81bd7a974f4`（简称 `afa6c9d`） |
| origin/main | `cfd22d91b76e923f5855b764f707d32a3e10b17b` |
| origin/HEAD | `cfd22d91b76e923f5855b764f707d32a3e10b17b` |
| ahead / behind | ahead 1, behind 0 |
| working tree dirty | 443 行（≈ 442 baseline + 1 IDE 抖动） |
| 远程网络 | github:443 沙箱不可达，push 暂缓（用户决策 D 方案） |
| dev server | port 3200 启动正常（PID 24080） |

> **重要**：本任务**不 commit、不 push、不处理 historical dirty**，仅产出 `docs/front-portal/q05-new-design-import/` 文档。

---

## 2. 官网入口盘点（桌面端）

### 2.1 根目录 `/`（主官网首页）

- **服务端入口**：`src/app/page.tsx`（Next.js 13+ App Router Server Component）
- **客户端入口**：`src/app/HomepageContent.tsx`（主交互区 client component）
- **layout**：`src/app/layout.tsx`（根 layout，全局 metadata + providers）
- **全局样式**：`src/app/globals.css`
- **metadata 关键值**：
  - title：`ZS Exchange | 中萨数字科技交易所 — 萨摩亚持牌 · 全球数字金融新枢纽`
  - description：持有🇼🇸萨摩亚政府颁发的交易所+证券交易所双牌照
  - organization schema：3 个办公地址（海口/Apia/中环）
- **JSON-LD**：Organization + 自定义结构化数据，地址、电话、Logo
- **现状**：当前已是 v7 版本（home-v5 / v6 / v7 截图均存在 `docs/screenshots/`），是一套**完整可上线**的官网首页，**不是简单占位**

### 2.2 桌面端顶级路由（`src/app/` 下一级）

| 路由 | 名称 | 文件 | 状态 |
|---|---|---|---|
| `/` | 首页 | `page.tsx` + `HomepageContent.tsx` | ✅ 已上线 |
| `/about` | 关于中萨 | `about/ClientPage.tsx` | ✅ 已上线 |
| `/markets` | 行情 | `markets/ClientPage.tsx` | ✅ 已上线 |
| `/trade/*` | 交易（spot/futures/orders/margin/pairs） | `trade/*` 6 路由 | ✅ 已上线 |
| `/user/*` | 用户中心（dashboard/wallet/defi/did/ido/nft/trading） | `user/*` 12 路由 | ✅ 已上线 |
| `/wallet/...` | 钱包用户态 | `user/wallet/*` | ✅ 已上线 |
| `/download` | 客户端下载 | `download/ClientPage.tsx` | ✅ 已上线 |
| `/finance` | 金融服务 | `finance/ClientPage.tsx` | ✅ 已上线 |
| `/ido` | IDO 平台 | `ido/ClientPage.tsx` | ✅ 已上线 |
| `/licenses` | 牌照 | `licenses/ClientPage.tsx` | ✅ 已上线 |
| `/shop/*` | 商城（orders/profits/channel） | `shop/*` 4 路由 | ✅ 已上线 |
| `/portal/*` | 子门户（anime/culture/ecommerce/forum/gaming） | `portal/*` 6 路由 | ✅ 已上线 |
| `/auth/login` `/auth/register` | 登录注册 | `auth/*` | ✅ 已上线 |
| `/admin/*` | 管理员后台 | `admin/*` 278 路由 | ✅ 已上线（独立 layout） |
| `/h5/*` | H5 移动版 | `h5/*` 100+ 路由 | ✅ 已上线（独立 layout） |
| `/business/aiopc` | 商业 AI OPC 入口 | `business/aiopc/page.tsx` | ✅ 已上线 |
| `/dashboard` | 用户仪表盘 | `dashboard/ClientPage.tsx` | ✅ 已上线 |
| `/register` | 注册 | `register/ClientPage.tsx` | ✅ 已上线 |

### 2.3 桌面端总路由数

- **桌面端 Next.js page.tsx 文件数**：约 80+ 路由
- **含 `[id]` 动态路由**：article/live/podcast/video/game/ido/nft/otc/shop/merchant/dex/defi/pool/tournament 等
- **layout 体系**：
  - `src/app/layout.tsx` 根 layout
  - `src/app/h5/layout.tsx` H5 独立 layout
  - `src/app/admin/layout.tsx` Admin 独立 layout
  - `src/app/auth/layout.tsx` 鉴权 layout

---

## 3. H5 入口盘点（移动端）

- **layout**：`src/app/h5/layout.tsx`（独立 H5 layout）
- **顶级入口**：`src/app/h5/page.tsx`
- **登录注册**：`/h5/login`、`/h5/register`
- **H5 子域（共 16 大模块）**：

| 子域 | 路由前缀 | 子页数 | 备注 |
|---|---|---|---|
| AI | `/h5/ai/*` | 8 | advisor/analyze/chat/content/quant/risk/sentiment/signal |
| Assets | `/h5/assets/*` | 5 | bridge/earn/fund/futures/manage |
| Content | `/h5/content/*` | 6 | article/[id]/feed/live/podcast/search/topics/video |
| DeFi | `/h5/defi/*` | 9 | add/earn/farm/history/pool/[id]/pools/positions/remove/stake/swap |
| DEX | `/h5/dex/*` | 5 | add/pool/[id]/remove/trade/yield |
| Discover | `/h5/discover/*` | 1 | dapp-browser |
| Game | `/h5/game/*` | 7 | achievements/friends/game/[id]/hub/inventory/list/rank/tournament/[id]/tournaments |
| IDO | `/h5/ido/*` | 6 | detail/[id]/list/my/participate/projects/vesting |
| Markets | `/h5/markets/*` | 3 | detail/futures/list |
| NFT | `/h5/nft/*` | 5 | activity/detail/[id]/market/mint/my |
| OTC | `/h5/otc/*` | 6 | buy/chat/market/merchant/[id]/orders/sell |
| Profile | `/h5/profile/*` | 12 | about/bank/commission/did-identity/edit/feedback/help/invite/kyc/notifications/security/settings/terms |
| Savings | `/h5/savings/*` | 3 | fixed/flexible/products |
| Shop | `/h5/shop/*` | 11 | cart/category/channel/checkout/coupons/home/member/merchant/[id]/orders/product/[id]/profits/wishlist |
| Stake | `/h5/stake/*` | 4 | list/rewards/stake/unstake |
| Trade | `/h5/trade/*` | 7 | copy/futures/history/options/orders/otc/p2p/spot |
| Wallet | `/h5/wallet/*` | 6 | address/deposit/history/security/transfer/withdraw |
| **小计** | | **约 110+ 路由** | 全部已上线 |

> **观察**：H5 已经是一个**完整的移动端交易 App 体系**，并非雏形。

---

## 4. Admin 后台入口盘点

- **layout**：`src/app/admin/layout.tsx`
- **顶级入口**：`src/app/admin/page.tsx`（dashboard）
- **总 admin page.tsx 数**：278（参考 `docs/industrial-masterplan/_inventory/06-admin-page-inventory.md`）
- **已真实化 page**：11/278 ≈ 3.96%（参考 b1 + b2.1 完成项）
- **b1 安全路径 11 个**：
  - `transactions/withdraw`
  - `users/levels`
  - `users/kyc`
  - `wallet/transactions`
  - `audit-logs`
  - `mfa/policy`
  - `alchemy/{status,usage,billing,webhooks}`
  - `bpm/monitoring`
  - `security/{overview,incident-response}`
  - `fujian/{identity,orders,products}`
- **历史 dirty baseline**：265/278 = 95% 仍为占位/mock

---

## 5. APP 入口盘点

> **重点声明**：本仓库**未包含移动端 APP 原生工程**（无 `ios/`、`android/`、`rn/`、`expo/` 等目录）。APP 入口仅通过以下方式间接存在：

| 形态 | 入口 | 备注 |
|---|---|---|
| H5 嵌入壳 | `/h5/*` 路由 | 100+ 路由，可被 WebView/小程序壳直接嵌入 |
| Web App | `manifest.json` 等 PWA 资源 | 需进一步确认是否配置 |
| 原生 APP | **无独立工程** | 当前项目结构无 `ios/` `android/` `react-native/` 目录 |
| 小程序 | **无独立工程** | 当前项目结构无 `miniprogram/` 目录 |
| 客户端下载页 | `/download` | 是 download/ClientPage.tsx 展示页 |

**结论**：当前所谓"APP"实际上是 **H5 移动版 + 桌面 Web** 双端，**没有独立的原生 APP 工程**。Stitch 新设计若需要原生 APP 化，需新增独立工程（不在本任务范围）。

---

## 6. 当前官网设计迭代轨迹

- **docs/screenshots/home-v5-***：4 张（hero/features/full/bottom），**前一代**
- **docs/screenshots/home-v6-***：5 张（hero/features/full/bottom/licenses），**当前一代**
- **docs/screenshots/home-v7-***：6 张（hero/features/full/bottom/licenses/mid/ticker），**最新一代**

> **观察**：当前 `/` 首页已经经历过至少 3 轮设计迭代（v5→v6→v7），每一轮都有完整截图证据，**Stitch 新设计是第 4 轮**，必须明确"再升级"vs"颠覆"。

---

## 7. 路由结构依赖

### 7.1 Next.js App Router 路由分组

```
src/app/
├── (root)  ──────────  /, /about, /markets, /trade/*, /user/*, /download
├── /admin  ──────────  /admin/* (独立 layout + 鉴权)
├── /h5     ──────────  /h5/* (独立 layout + 移动端 H5 适配)
├── /auth   ──────────  /auth/login, /auth/register
├── /api    ──────────  /api/* (后端 API 路由)
└── (其他子域)  ────  /ido /portal /shop /finance /business /licenses /dashboard
```

### 7.2 关键依赖

- **全局 layout**：`src/app/layout.tsx`（含 i18n provider, theme provider, auth provider）
- **全局 metadata**：`src/app/page.tsx` export const metadata
- **SEO 工具**：`@/lib/security/xss-guard`、`@/lib/seo/*`（待确认）
- **i18n**：`@/lib/i18n/*`（当前仅中文）
- **鉴权中间件**：`src/middleware.ts`（包含 H5/Admin 鉴权判断）
- **常量**：`@/lib/constants.ts`（FAQ_DATA 等）

---

## 8. 当前页面依赖盘点（高层）

| 依赖类别 | 代表文件 | 备注 |
|---|---|---|
| 行情数据 | `/api/v1/crypto/*`、`/api/v1/spot/*` | 行情聚合，部分 mock |
| 公告数据 | 暂无独立 API（参考 admin/content） | 需扩展 |
| 帮助中心 | 暂无独立 API | 需扩展 |
| 资产数据 | `/api/v1/user/wallet/*` | b1 已完成，11/11 真实 |
| 钱包流水 | `/api/v1/admin/wallet/transactions` | b1 真实 |
| 提现数据 | `/api/v1/admin/transactions/withdraw` | b1 真实 |
| 用户数据 | `/api/v1/admin/users/levels` | b1 真实 |
| KYC 数据 | `/api/v1/admin/users/kyc` | b1 真实 |
| 审计日志 | `/api/v1/admin/audit-logs` | b1 真实 |
| 安全中心 | `/api/v1/admin/security/*` | b1 真实 |
| 树图公链 | 0 命中 | 100% 缺失 |
| 储备金证明 | 0 命中 | 100% 缺失 |

---

## 9. 当前状态总览

- ✅ **桌面端官网**：`/` 已上线，v7 迭代完成
- ✅ **H5 移动版**：`/h5` 110+ 路由全部上线
- ✅ **管理员后台**：`/admin` 278 路由，b1 11/11 真实化
- ✅ **API 路由**：约 330 个 route.ts，47/47 admin route 已鉴权
- ✅ **Dev server**：port 3200 启动正常
- ❌ **原生 APP 工程**：**不存在**
- ❌ **小程序工程**：**不存在**
- ❌ **Stitch 设计稿**：**仓库内未发现**（无 `*titch*` 命中）
- ❌ **树图公链**：业务代码 0 命中
- ❌ **储备金证明**：业务代码 0 命中

---

## 10. 下一阶段输入物

为生成 01-stitch-new-design-inventory.md，需要以下输入（**当前缺失**）：

1. **Stitch 导出的页面截图**（桌面 + 移动）
2. **Stitch 输出的页面结构**（页面名称 / 路由建议 / 组件树 / 状态标签）
3. **Stitch 输出的设计 token**（色彩 / 字体 / 间距 / 圆角 / 阴影）
4. **Stitch 输出的组件清单**（Header / MegaMenu / MobileBottomTabs / MarketTable / WalletCard 等）

> 若输入缺失，本文档后续阶段将基于**用户文字描述**（`docs/中萨数字科技交易-全新版本01.md`）的二手抽象进行推断，并显式标注"待 Stitch 原稿确认"。

---

> **本文件为只读盘点。未对任何业务代码、schema、seed、配置进行修改。**
