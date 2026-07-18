# 01 - Stitch 新设计稿资产盘点（Stitch New Design Inventory）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 01
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读盘点，**不修改任何业务代码**

---

## 0. 输入物状态声明

> **重要**：本任务盘点时刻，**仓库内未发现 Stitch 原始设计稿文件**（`find *titch*` = 0 命中）。
>
> 本文档基于 `docs/中萨数字科技交易-全新版本01.md` 用户文档中**文字描述**的 Stitch 输出范围进行**二手抽象**，每条结论都标注"待 Stitch 原稿确认"。

---

## 1. 设计稿资产清单

### 1.1 仓库内现状

| 资产 | 路径 | 状态 |
|---|---|---|
| Stitch 导出截图 | `docs/stitch/**` | **不存在** |
| Stitch 页面 JSON | `docs/stitch/**` | **不存在** |
| 设计 token 文件 | `docs/stitch/tokens.json` | **不存在** |
| 桌面端 / 移动端双稿 | 暂无独立目录 | **不存在** |
| 现有首页迭代截图 | `docs/screenshots/home-v5/6/7-*.png`（16 张） | 已存在（**不是** Stitch 输出） |
| 现有 admin 截图 | `docs/screenshots/admin-*.png`（20 张） | 已存在（**不是** Stitch 输出） |

### 1.2 待补充输入（**阻塞后续阶段**）

1. **Stitch 导出的桌面端截图**（建议命名 `stitch/desktop/{page}-desktop.png`）
2. **Stitch 导出的 H5 截图**（建议命名 `stitch/mobile/{page}-mobile.png`）
3. **Stitch 页面结构树**（页面名称 / 路由建议 / 组件树）
4. **Stitch 设计 token**（colors / typography / spacing / radius / shadow）
5. **Stitch 组件清单**（Header / MegaMenu / MarketTable / WalletCard 等）
6. **Stitch 状态标签**（内测中 / 即将开放 / 数据接入中 / 暂无数据 / 维护中）

---

## 2. 桌面端页面清单（基于用户文档推断）

> **来源**：`docs/中萨数字科技交易-全新版本01.md` 第 9 行
> "做了一整套交易所前台体系：官网、H5、行情、交易、钱包、项目、公告、安全、API、帮助、机构、合规、风险等页面"

### 2.1 推断的桌面端页面（共 14 大类）

| 序 | 页面类别 | 推断页面 | 状态标签 | 数据来源 |
|---|---|---|---|---|
| 1 | 官网首页 | `/` | — | 静态 + 行情 ticker |
| 2 | 行情 | `/markets` | — | 行情 API |
| 3 | 交易 | `/trade/spot` `/trade/futures` `/trade/orders` `/trade/margin` `/trade/pairs` | 登录后查看 | trade API |
| 4 | 钱包 | `/user/wallet/assets` `/user/wallet/ClientPage` | 登录后查看 | b1 wallet API |
| 5 | 项目 | `/ido` `/ido/projects` | 数据接入中 | IDO API |
| 6 | 公告 | `/news` | 可立即做（暂无内容） | 需新增公告 API |
| 7 | 安全 | `/security-center` | 数据接入中 | b1 security API |
| 8 | API 文档 | `/api-docs` | 数据接入中 | OpenAPI 静态 |
| 9 | 帮助 | `/help` `/faq` | 可立即做 | 静态 |
| 10 | 机构 | `/institution` | 内测中 | 静态 + 咨询表单 |
| 11 | 合规 | `/licenses` `/compliance` | 已上线 | 静态（已存在） |
| 12 | 风险 | `/risk-disclosure` | 可立即做 | 静态 |
| 13 | 关于中萨 | `/about` | 已上线 | 静态（已存在） |
| 14 | 客户端下载 | `/download` | 已上线 | 静态（已存在） |

### 2.2 推断的桌面端辅助页面

| 页面 | 推断路由 | 状态 |
|---|---|---|
| 服务费率 | `/fees` | 可立即做 |
| 隐私政策 | `/privacy` | 可立即做 |
| 用户协议 | `/terms` | 可立即做 |
| 联系客服 | `/contact` | 可立即做 |
| 商务合作 | `/business` | 已上线 |
| 加入我们 | `/careers` | 可立即做 |

---

## 3. H5 移动端页面清单

> **当前 H5 已有 110+ 路由**（见 `00-current-frontsite-baseline.md` §3）。Stitch 新设计如果是为 H5 重做，则**映射现有 17 子域**：

| H5 子域 | 现有路由数 | Stitch 新设计映射 | 状态 |
|---|---|---|---|
| `/h5/markets/*` | 3 | 行情 | 已上线 |
| `/h5/trade/*` | 7 | 交易 | 已上线（spot/futures/options/p2p/otc/copy） |
| `/h5/wallet/*` | 6 | 钱包 | 已上线 |
| `/h5/ai/*` | 8 | AI 中心 | 已上线 |
| `/h5/defi/*` / `/h5/dex/*` | 14 | DeFi / DEX | 已上线 |
| `/h5/nft/*` | 5 | NFT 市场 | 已上线 |
| `/h5/game/*` | 7 | 游戏中心 | 已上线 |
| `/h5/ido/*` | 6 | IDO | 已上线 |
| `/h5/otc/*` | 6 | OTC | 已上线 |
| `/h5/shop/*` | 11 | 商城 | 已上线 |
| `/h5/stake/*` / `/h5/savings/*` | 7 | 质押/储蓄 | 已上线 |
| `/h5/assets/*` | 5 | 资产管理 | 已上线 |
| `/h5/profile/*` | 12 | 个人中心 | 已上线 |
| `/h5/content/*` | 6 | 内容/直播/播客/视频 | 已上线 |
| `/h5/licenses` | 1 | 牌照 | 已上线 |
| `/h5/member` | 1 | 会员中心 | 已上线 |
| `/h5/news` | 1 | 公告 | 已上线 |
| `/h5/discover/dapp-browser` | 1 | DApp 浏览器 | 已上线 |

> **观察**：H5 已经是**完整覆盖**的移动端交易 App，Stitch 新设计若 H5 端**完全推倒重做**，**代价巨大**（110+ 路由全部重写），建议**视觉升级 + 保留路由 + 局部重构**。

---

## 4. 公共组件清单（基于用户文档 §06）

| 组件 | 推断职责 | 现有映射 |
|---|---|---|
| `Header` | 桌面端顶部导航 + Logo + 登录注册 | `src/app/layout.tsx` + `src/components/site-header/*`（待确认） |
| `MegaMenu` | 桌面端悬停下拉（交易/钱包/金融/资讯） | 无独立组件，散落在 nav 数组 |
| `MobileHeader` | H5 顶部（汉堡 / Logo / 搜索） | `src/app/h5/layout.tsx` |
| `MobileBottomTabs` | H5 底部 4-5 个 Tab | `src/app/h5/layout.tsx` 已有 |
| `MarketTable` | 行情表格 | `src/components/MarketsTable/*`（待确认） |
| `WalletCard` | 钱包卡片（余额/充值/提现/转账） | `src/app/user/wallet/*` |
| `ProductMatrix` | 产品矩阵（币种/合约/DeFi/NFT） | 暂无独立组件 |
| `AnnouncementCard` | 公告卡片 | 暂无独立组件 |
| `RiskNotice` | 风险提示条 | 暂无独立组件 |
| `EmptyState` | 空状态（暂无数据/内测中） | 需新增（统一空状态规范） |
| `StatusBadge` | 状态徽章（内测中/即将开放） | 需新增（统一标签规范） |

---

## 5. 业务模块清单（基于用户文档 §05）

| 模块 | 桌面端 | H5 端 | Admin 后台 | 数据源 |
|---|---|---|---|---|
| 行情 | ✅ | ✅ | ✅ admin/cex/pairs | 行情 API + 部分 mock |
| 现货交易 | ✅ | ✅ | ✅ admin/cex/spot | trade API |
| 合约交易 | ✅ | ✅ | ✅ admin/cex/futures | perp API |
| 钱包 | ✅ | ✅ | ✅ admin/wallet/* | b1 wallet API（11 真实） |
| 充值 | ✅ | ✅ | ✅ admin/transactions/deposit（待确认） | wallet-deposit API |
| 提现 | ✅ | ✅ | ✅ admin/transactions/withdraw | b1 withdraw API（11 真实） |
| 资产 | ✅ | ✅ | ✅ admin/wallet/transactions | b1 wallet-transactions API |
| NFT | ✅ | ✅ | ✅ admin/nfts/* | nft API |
| OTC | ✅ | ✅ | ✅ admin/otc | otc API |
| IDO | ✅ | ✅ | ✅ admin/ido | ido API |
| DeFi | ✅ | ✅ | ✅ admin/defi | defi API |
| DEX | ✅ | ✅ | ✅ admin/dex | dex API |
| Game | — | ✅ | ✅ admin/game（待确认） | game API |
| 商城 | ✅ | ✅ | ✅ admin/mall | mall API |
| Stake | — | ✅ | ✅ admin/defi/staking | staking API |
| Savings | — | ✅ | ✅ admin/defi/staking | savings API |
| 公告 | ❌ | ✅ | ✅ admin/content | **缺独立 API** |
| 帮助 | ❌ | ❌ | ✅ admin/content（部分） | **缺独立 API** |
| 安全 | ❌ | ❌ | ✅ admin/security/* | b1 security API |
| API 文档 | ❌ | ❌ | — | OpenAPI 静态 |
| 机构 | ❌ | ❌ | — | 需新增 |
| 合规 | ✅ | ❌ | ✅ admin/compliance | 静态 |
| 风险 | ❌ | ❌ | ✅ admin/risk（待确认） | risk API |

---

## 6. 状态标签清单（基于用户文档 §12）

> **强制约束**：所有未接入数据统一显示以下 5 类标签之一，**禁止伪造数据**。

| 状态标签 | 触发场景 | UI 颜色建议 |
|---|---|---|
| `暂无数据` | 数据库无记录（如用户未登录/未交易） | `slate-500` 灰 |
| `数据接入中` | 接口已规划但未实现 | `amber-500` 黄 |
| `内测中` | 接口已实现但未公开/仅灰度 | `purple-500` 紫 |
| `即将开放` | 已规划但未开始开发 | `cyan-500` 青 |
| `维护中` | 接口/服务正在维护 | `rose-500` 红 |

> 颜色待 Stitch 原稿确认后调整；本表为**业务约束**而非**视觉规范**。

---

## 7. 公共依赖清单

### 7.1 设计 token（待 Stitch 提供）

- 色彩：主色 / 辅色 / 状态色 / 中性色 / 文本色 / 背景色 / 边框色
- 字体：标题 / 正文 / 数字 / 等宽 / 字号梯度
- 间距：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
- 圆角：4 / 8 / 12 / 16 / 24 / 999（pill）
- 阴影：sm / md / lg / xl

### 7.2 当前已有 token（用于参考）

参考 admin 实际使用的：
- 品牌色：`#1652F0`（primary）/ `#059669`（success）/ `#D97706`（gold）/ `#7C3AED`（purple）/ `#0891B2`（cyan）/ `#E11D48`（rose）
- 中性：`#0F172A` / `#64748B` / `#94A3B8` / `#E2E8F0` / `#F1F5F9` / `#F8FAFC` / `#FFFFFF`

> **建议**：Stitch token 到达后，与现有 token 做对照，决定**沿用 / 替换 / 渐变切换**策略。

---

## 8. 下一步输入物清单

| 输入物 | 路径建议 | 是否阻塞后续 |
|---|---|---|
| Stitch 桌面端截图 | `docs/stitch/desktop/*.png` | **是** |
| Stitch H5 截图 | `docs/stitch/mobile/*.png` | **是** |
| Stitch 页面结构树 | `docs/stitch/pages-tree.json` | **是** |
| Stitch 设计 token | `docs/stitch/tokens.json` | 是 |
| Stitch 组件清单 | `docs/stitch/components.json` | 是 |
| Stitch 状态标签规范 | `docs/stitch/status-badges.md` | 否（已有规范） |

---

## 9. 风险与待澄清点

1. **Stitch 原始资产缺失** → 本盘点基于用户文字描述的二手抽象，**所有页面清单均为推断**，需 Stitch 原稿确认。
2. **现有 16 张 home 截图（v5/v6/v7）** → 是否在 Stitch 设计**前**还是**后**生成？需用户澄清。
3. **H5 110+ 路由** → 是否全部推倒重做？建议**视觉升级 + 保留路由**。
4. **APP 入口缺失** → 仓库无独立原生 APP 工程，Stitch 是否要求新增？
5. **设计 token 兼容性** → 现有品牌色 vs Stitch 配色方案的差异评估**未做**。

---

> **本文件为只读盘点。未对任何业务代码、schema、seed、配置进行修改。**
