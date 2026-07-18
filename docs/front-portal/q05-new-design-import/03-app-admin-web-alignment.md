# 03 - Web / H5 / APP / Admin 四端菜单对齐

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 03
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读盘点，**不修改任何业务代码**

---

## 0. 四端定义

| 端 | 入口 | 路由数 | 鉴权 |
|---|---|---|---|
| 桌面 Web | `/` 根路由体系 | 80+ | 部分需登录 |
| H5 移动 | `/h5/*` 独立 layout | 110+ | 部分需登录 |
| APP | **无独立工程** | — | — |
| Admin 后台 | `/admin/*` 独立 layout | 278 | 100% 需登录 |

> **关键事实**：本项目**没有独立原生 APP 工程**，所谓"APP 入口"实际为 H5 WebView 壳。

---

## 1. 四端菜单对齐矩阵

> **状态标签**：`✅ 已上线` / `🟡 部分` / `❌ 缺` / `🆕 需新增` / `⏸️ 暂无数据`

### 1.1 核心业务入口对齐

| 业务 | 桌面 Web | H5 | APP（无） | Admin | 接口 | 数据 | 状态 |
|---|---|---|---|---|---|---|---|
| 首页 | `/` | `/h5` | — | `/admin/dashboard` | ✅ | ✅ | ✅ |
| 关于中萨 | `/about` | `/h5/profile/about` | — | — | 静态 | 静态 | ✅ |
| 行情 | `/markets` | `/h5/markets` `/h5/markets/list` `/h5/markets/detail` | — | `/admin/cex/pairs` | `/api/v1/crypto/*` | 部分真实 | 🟡 |
| 现货交易 | `/trade/spot` | `/h5/trade/spot` | — | `/admin/cex/spot` | spot API | 部分真实 | 🟡 |
| 合约交易 | `/trade/futures` | `/h5/trade/futures` | — | `/admin/cex/futures` | perp API | 部分真实 | 🟡 |
| 杠杆交易 | `/trade/margin` | — | — | `/admin/cex/margin` | perp API | 部分真实 | 🟡 |
| 交易对 | `/trade/pairs` | — | — | `/admin/cex/pairs` | ✅ | ✅ | ✅ |
| 订单记录 | `/trade/orders` | `/h5/trade/orders` | — | `/admin/cex/orders` | ✅ | ✅ | ✅ |
| 钱包（总） | `/user/wallet` | `/h5/wallet` | — | `/admin/wallet/*` | b1 | b1 真实 | ✅ |
| 充值 | — | `/h5/wallet/deposit` | — | `/admin/transactions/deposit`（待确认） | wallet-deposit API | 真实 | ✅ |
| 提现 | — | `/h5/wallet/withdraw` | — | `/admin/transactions/withdraw` | b1 | b1 真实 | ✅ |
| 资金流水 | `/user/wallet/assets` | `/h5/wallet/history` | — | `/admin/wallet/transactions` | b1 | b1 真实 | ✅ |
| 转账 | — | `/h5/wallet/transfer` | — | — | wallet-transfer | 真实 | ✅ |
| 安全 | — | `/h5/wallet/security` | — | `/admin/security/*` | b1 | b1 真实 | ✅ |
| KYC | — | `/h5/profile/kyc` | — | `/admin/users/kyc` | b1 | b1 真实 | ✅ |
| 用户等级 | — | `/h5/member` | — | `/admin/users/levels` | b1 | b1 真实 | ✅ |
| 邀请返佣 | — | `/h5/profile/invite` | — | `/admin/users/invite` | referral API | 真实 | ✅ |
| 通知 | — | `/h5/profile/notifications` | — | `/admin/notifications`（待确认） | notification API | 真实 | ✅ |
| 通知设置 | — | `/h5/profile/settings` | — | — | settings API | 真实 | ✅ |
| 银行卡 | — | `/h5/profile/bank` | — | — | bank API | 真实 | ✅ |
| DID 身份 | — | `/h5/profile/did-identity` | — | `/admin/did` | did API | 真实 | ✅ |
| 个人资料 | — | `/h5/profile/edit` | — | — | user API | 真实 | ✅ |
| 反馈 | — | `/h5/profile/feedback` | — | — | feedback API | 真实 | ✅ |
| 关于 H5 | — | `/h5/profile/about` | — | — | 静态 | 静态 | ✅ |
| 用户协议 | — | `/h5/profile/terms` | — | — | 静态 | 静态 | ✅ |
| 帮助 | — | `/h5/profile/help` | — | `/admin/content`（部分） | **缺** | **缺** | 🆕 |
| 公告 | — | `/h5/news` | — | `/admin/content` | **缺独立 API** | **缺** | 🆕 |
| NFT | — | `/h5/nft/*` | — | `/admin/nfts/*` | nft API | 真实 | ✅ |
| NFT 市场 | — | `/h5/nft/market` | — | `/admin/nfts` | ✅ | ✅ | ✅ |
| 我的 NFT | — | `/h5/nft/my` | — | `/admin/wallet/nfts` | ✅ | ✅ | ✅ |
| NFT 铸造 | — | `/h5/nft/mint` | — | `/admin/nfts/mint` | ✅ | ✅ | ✅ |
| NFT 活动 | — | `/h5/nft/activity` | — | — | ✅ | ✅ | ✅ |
| IDO | `/ido` | `/h5/ido/*` | — | `/admin/ido` | ido API | 真实 | ✅ |
| IDO 项目 | `/ido` | `/h5/ido/projects` `/h5/ido/list` | — | `/admin/ido/projects` | ✅ | ✅ | ✅ |
| IDO 详情 | — | `/h5/ido/detail/[id]` | — | — | ✅ | ✅ | ✅ |
| 我的 IDO | — | `/h5/ido/my` | — | `/admin/ido/unlock` | ✅ | ✅ | ✅ |
| 参与 IDO | — | `/h5/ido/participate` | — | — | ✅ | ✅ | ✅ |
| 释放计划 | — | `/h5/ido/vesting` | — | `/admin/ido/unlock` | ✅ | ✅ | ✅ |
| DeFi | — | `/h5/defi/*` | — | `/admin/defi/*` | defi API | 真实 | ✅ |
| DeFi 池 | — | `/h5/defi/pools` | — | `/admin/dex/pools` | ✅ | ✅ | ✅ |
| DeFi 添加 | — | `/h5/defi/add` | — | `/admin/dex/pools` | ✅ | ✅ | ✅ |
| DeFi 移除 | — | `/h5/defi/remove` | — | `/admin/dex/pools` | ✅ | ✅ | ✅ |
| DeFi 兑换 | — | `/h5/defi/swap` | — | `/admin/dex/swap` | ✅ | ✅ | ✅ |
| DeFi 农场 | — | `/h5/defi/farm` | — | `/admin/defi/staking` | ✅ | ✅ | ✅ |
| DeFi 收益 | — | `/h5/defi/earn` | — | `/admin/defi/rewards` | ✅ | ✅ | ✅ |
| DeFi 质押 | — | `/h5/defi/stake` | — | `/admin/defi/staking` | ✅ | ✅ | ✅ |
| DeFi 头寸 | — | `/h5/defi/positions` | — | — | ✅ | ✅ | ✅ |
| DeFi 历史 | — | `/h5/defi/history` | — | — | ✅ | ✅ | ✅ |
| DeFi 池详情 | — | `/h5/defi/pool/[id]` | — | — | ✅ | ✅ | ✅ |
| DEX | — | `/h5/dex/*` | — | `/admin/dex/*` | dex API | 真实 | ✅ |
| DEX 池详情 | — | `/h5/dex/pool/[id]` | — | — | ✅ | ✅ | ✅ |
| DEX 交易 | — | `/h5/dex/trade` | — | `/admin/dex/swap` | ✅ | ✅ | ✅ |
| DEX 收益 | — | `/h5/dex/yield` | — | — | ✅ | ✅ | ✅ |
| OTC | — | `/h5/otc/*` | — | `/admin/otc` | otc API | 真实 | ✅ |
| OTC 市场 | — | `/h5/otc/market` | — | `/admin/otc` | ✅ | ✅ | ✅ |
| OTC 购买 | — | `/h5/otc/buy` | — | — | ✅ | ✅ | ✅ |
| OTC 出售 | — | `/h5/otc/sell` | — | — | ✅ | ✅ | ✅ |
| OTC 订单 | — | `/h5/otc/orders` | — | `/admin/otc` | ✅ | ✅ | ✅ |
| OTC 聊天 | — | `/h5/otc/chat` | — | — | chat API | 真实 | ✅ |
| OTC 商户 | — | `/h5/otc/merchant/[id]` | — | — | ✅ | ✅ | ✅ |
| 商城 | — | `/h5/shop/*` | — | `/admin/mall` | mall API | 真实 | ✅ |
| 商城首页 | — | `/h5/shop/home` | — | — | ✅ | ✅ | ✅ |
| 商城分类 | — | `/h5/shop/category` | — | — | ✅ | ✅ | ✅ |
| 商城频道 | — | `/h5/shop/channel` | — | `/admin/shop/channel` | ✅ | ✅ | ✅ |
| 商城会员 | — | `/h5/shop/member` | — | `/admin/shop/member` | ✅ | ✅ | ✅ |
| 商城购物车 | — | `/h5/shop/cart` | — | — | ✅ | ✅ | ✅ |
| 商城结算 | — | `/h5/shop/checkout` | — | — | ✅ | ✅ | ✅ |
| 商城优惠券 | — | `/h5/shop/coupons` | — | — | ✅ | ✅ | ✅ |
| 商城心愿单 | — | `/h5/shop/wishlist` | — | — | ✅ | ✅ | ✅ |
| 商城订单 | `/shop/orders` | `/h5/shop/orders` | — | `/admin/shop/orders` | ✅ | ✅ | ✅ |
| 商城利润 | `/shop/profits` | `/h5/shop/profits` | — | `/admin/shop/profits` | ✅ | ✅ | ✅ |
| 商城商品 | — | `/h5/shop/product/[id]` | — | — | ✅ | ✅ | ✅ |
| 商城商户 | — | `/h5/shop/merchant/[id]` | — | — | ✅ | ✅ | ✅ |
| 质押 | — | `/h5/stake/*` | — | `/admin/defi/staking` | staking API | 真实 | ✅ |
| 质押列表 | — | `/h5/stake/list` | — | — | ✅ | ✅ | ✅ |
| 质押操作 | — | `/h5/stake/stake` | — | — | ✅ | ✅ | ✅ |
| 解除质押 | — | `/h5/stake/unstake` | — | — | ✅ | ✅ | ✅ |
| 质押奖励 | — | `/h5/stake/rewards` | — | — | ✅ | ✅ | ✅ |
| 储蓄 | — | `/h5/savings/*` | — | `/admin/defi/staking` | savings API | 真实 | ✅ |
| 储蓄灵活 | — | `/h5/savings/flexible` | — | — | ✅ | ✅ | ✅ |
| 储蓄定期 | — | `/h5/savings/fixed` | — | — | ✅ | ✅ | ✅ |
| 储蓄产品 | — | `/h5/savings/products` | — | — | ✅ | ✅ | ✅ |
| 资产管理 | — | `/h5/assets/*` | — | `/admin/wallet/*` | b1 | b1 真实 | ✅ |
| 资产总览 | — | `/h5/assets` | — | — | ✅ | ✅ | ✅ |
| 资产管理 | — | `/h5/assets/manage` | — | — | ✅ | ✅ | ✅ |
| 资金划转 | — | `/h5/assets/fund` | — | — | ✅ | ✅ | ✅ |
| 跨链桥 | — | `/h5/assets/bridge` | — | `/admin/chain/bridge` | ✅ | ✅ | ✅ |
| 资产收益 | — | `/h5/assets/earn` | — | `/admin/defi/rewards` | ✅ | ✅ | ✅ |
| 资产合约 | — | `/h5/assets/futures` | — | `/admin/cex/futures` | ✅ | ✅ | ✅ |
| AI 中心 | — | `/h5/ai/*` | — | `/admin/ai-*` | ai API | 部分真实 | 🟡 |
| AI 顾问 | — | `/h5/ai/advisor` | — | — | ai API | 真实 | ✅ |
| AI 顾问测试 | — | `/h5/ai/advisor/test` | — | — | ai API | 真实 | ✅ |
| AI 分析 | — | `/h5/ai/analyze` | — | — | ai API | 真实 | ✅ |
| AI 聊天 | — | `/h5/ai/chat` | — | — | ai API | 真实 | ✅ |
| AI 聊天历史 | — | `/h5/ai/chat/history` | — | — | ai API | 真实 | ✅ |
| AI 内容 | — | `/h5/ai/content` | — | — | ai API | 真实 | ✅ |
| AI 量化 | — | `/h5/ai/quant` | — | `/admin/quant/agents` | quant API | 真实 | ✅ |
| AI 风控 | — | `/h5/ai/risk` | — | `/admin/quant/risk` | risk API | 真实 | ✅ |
| AI 情绪 | — | `/h5/ai/sentiment` | — | `/admin/sentiment` | sentiment API | 真实 | ✅ |
| AI 信号 | — | `/h5/ai/signal` | — | — | signal API | 真实 | ✅ |
| 内容/视频 | — | `/h5/content/*` | — | `/admin/content` | content API | 真实 | ✅ |
| 内容 feed | — | `/h5/content/feed` | — | — | ✅ | ✅ | ✅ |
| 内容搜索 | — | `/h5/content/search` | — | — | ✅ | ✅ | ✅ |
| 内容话题 | — | `/h5/content/topics` | — | — | ✅ | ✅ | ✅ |
| 视频列表 | — | `/h5/content/videos` | — | — | ✅ | ✅ | ✅ |
| 视频详情 | — | `/h5/content/video/[id]` | — | — | ✅ | ✅ | ✅ |
| 直播 | — | `/h5/content/live` | — | — | live API | 真实 | ✅ |
| 直播详情 | — | `/h5/content/live/[id]` | — | — | live API | 真实 | ✅ |
| 播客 | — | `/h5/content/podcasts` | — | — | podcast API | 真实 | ✅ |
| 播客详情 | — | `/h5/content/podcast/[id]` | — | — | podcast API | 真实 | ✅ |
| 文章 | — | `/h5/content/article` | — | — | article API | 真实 | ✅ |
| 文章详情 | — | `/h5/content/article/[id]` | — | — | article API | 真实 | ✅ |
| 游戏 | — | `/h5/game/*` | — | `/admin/game` | game API | 真实 | ✅ |
| 游戏中心 | — | `/h5/game/hub` | — | — | ✅ | ✅ | ✅ |
| 游戏列表 | — | `/h5/game/list` | — | — | ✅ | ✅ | ✅ |
| 游戏详情 | — | `/h5/game/game/[id]` | — | — | ✅ | ✅ | ✅ |
| 游戏排行榜 | — | `/h5/game/rank` | — | — | ✅ | ✅ | ✅ |
| 游戏成就 | — | `/h5/game/achievements` | — | — | ✅ | ✅ | ✅ |
| 游戏好友 | — | `/h5/game/friends` | — | — | ✅ | ✅ | ✅ |
| 游戏库存 | — | `/h5/game/inventory` | — | — | ✅ | ✅ | ✅ |
| 锦标赛 | — | `/h5/game/tournaments` | — | — | ✅ | ✅ | ✅ |
| 锦标赛详情 | — | `/h5/game/tournament/[id]` | — | — | ✅ | ✅ | ✅ |
| 复制交易 | — | `/h5/trade/copy` | — | — | copy API | 真实 | ✅ |
| 期权 | — | `/h5/trade/options` | — | — | options API | 真实 | ✅ |
| P2P | — | `/h5/trade/p2p` | — | — | p2p API | 真实 | ✅ |
| 现货 | — | `/h5/trade/spot` | — | — | spot API | 真实 | ✅ |
| 合约 | — | `/h5/trade/futures` | — | — | perp API | 真实 | ✅ |
| 交易历史 | — | `/h5/trade/history` | — | — | ✅ | ✅ | ✅ |
| 牌照 | `/licenses` | `/h5/licenses` | — | `/admin/compliance` | 静态 | 静态 | ✅ |
| 会员 | — | `/h5/member` | — | `/admin/users/levels` | b1 | b1 真实 | ✅ |
| DApp 浏览器 | — | `/h5/discover/dapp-browser` | — | `/admin/dapps` `/admin/web3/dapps` | dapp API | 真实 | ✅ |
| 子门户（anime 等） | `/portal/*` | — | — | — | 静态 | 静态 | ✅ |
| 金融服务 | `/finance` | — | — | `/admin/finance` | 静态 + finance API | 真实 | ✅ |
| 商业 AI | `/business/aiopc` | — | — | `/admin/aiopc/*` | 真实 | 真实 | ✅ |
| 客户端下载 | `/download` | — | — | — | 静态 | 静态 | ✅ |
| 用户仪表盘 | `/dashboard` | — | — | `/admin/dashboard` | ✅ | ✅ | ✅ |
| 注册 | `/register` `/auth/register` | `/h5/register` | — | — | ✅ | ✅ | ✅ |
| 登录 | `/auth/login` | `/h5/login` | — | `/admin/login` | ✅ | ✅ | ✅ |

---

## 2. Admin 后台菜单总览

### 2.1 Admin 总数

- 278 个 page.tsx（参考 06-admin-page-inventory.md）
- 48 个 API route（24 v1/admin + 24 legacy /api/admin）
- 47/47 admin API 已 `withAdminAuth` 鉴权

### 2.2 Admin 主要子域

| 子域 | 路由前缀 | 页数 | 真实化 |
|---|---|---|---|
| 仪表盘 | `/admin/dashboard` | 1 | 100% |
| 用户管理 | `/admin/users/*` | 4 | b1 真实 |
| 交易管理 | `/admin/transactions/*` `/admin/cex/*` | 10+ | b1 真实 |
| 钱包管理 | `/admin/wallet/*` | 2 | b1 真实 |
| 提现审核 | `/admin/transactions/withdraw` | 1 | b1 真实 |
| KYC 审核 | `/admin/users/kyc` | 1 | b1 真实 |
| 审计日志 | `/admin/audit-logs` | 1 | b1 真实 |
| MFA 策略 | `/admin/mfa/policy` | 1 | b1 真实 |
| Alchemy | `/admin/alchemy/*` | 4 | b1 真实 |
| BPM 监控 | `/admin/bpm/*` | 3 | b1 真实 |
| 安全运营 | `/admin/security/*` | 2 | b1 真实 |
| 福建老酒 | `/admin/fujian/*` | 6 | b1 真实 |
| AI 中心 | `/admin/ai-*` `/admin/aiopc/*` | 12 | 部分真实 |
| 量化 | `/admin/quant/*` | 3 | 部分真实 |
| 福建/链上 | `/admin/chain/*` | 2 | 部分真实 |
| 行情 | `/admin/cex/*` | 7 | 部分真实 |
| DEX/DeFi | `/admin/dex/*` `/admin/defi/*` | 6 | 部分真实 |
| NFT | `/admin/nfts/*` | 3 | 部分真实 |
| IDO | `/admin/ido/*` | 2 | 部分真实 |
| 角色权限 | `/admin/roles` | 1 | 部分真实 |
| 节点/链 | `/admin/chain/*` `/admin/blockchain/*` | 2 | 部分真实 |
| 通知/告警 | `/admin/alerts/*` `/admin/notifications/*` | 多 | 部分真实 |
| 内容 | `/admin/content/*` | 2 | 部分真实 |
| 工作流 | `/admin/n8n/*` `/admin/bpm/*` | 5 | 部分真实 |
| 上币 | `/admin/listing/*` | 1 | 部分真实 |
| Maker | `/admin/maker` | 1 | 部分真实 |
| 投资组合 | `/admin/portfolio` | 1 | 部分真实 |
| Menu 配置 | `/admin/menu` | 1 | 部分真实 |
| 仪表盘配置 | `/admin/dashboard` | 1 | 100% |
| 系统设置 | `/admin/settings` `/admin/system` | 2 | 部分真实 |
| 登录 | `/admin/login` | 1 | 100% |

---

## 3. 业务入口命名一致性检查

### 3.1 命名冲突

| 业务 | 桌面 | H5 | Admin | 是否一致 |
|---|---|---|---|---|
| 钱包 | 钱包 | 钱包 | 钱包 | ✅ |
| 提现 | 提现 | 提现 | 提现 | ✅ |
| 行情 | 行情 | 行情 | 行情 | ✅ |
| 现货 | 现货 | 现货 | 现货 | ✅ |
| 合约 | 合约 | 合约 | 合约 | ✅ |
| KYC | KYC | KYC | KYC | ✅ |
| NFT | NFT | NFT | NFT | ✅ |
| OTC | OTC | OTC | OTC | ✅ |
| IDO | IDO | IDO | IDO | ✅ |
| 公告 | ❌ 缺 | 新闻 | 公告 | ❌ **冲突** |
| 帮助 | ❌ 缺 | 帮助 | 内容管理 | ❌ **冲突** |

> **新设计落地时需统一**：官网的"新闻"vs Admin 的"公告"vs H5 的"news"，命名要统一。

### 3.2 业务路径统一建议

| 业务 | 统一名称 | 桌面路由 | H5 路由 | Admin 路由 |
|---|---|---|---|---|
| 公告 | 公告 | `/news` | `/h5/news` | `/admin/announcements`（待新增） |
| 帮助 | 帮助 | `/help` | `/h5/profile/help` | `/admin/help`（待新增） |
| 风险 | 风险 | `/risk` | `/h5/profile/risk`（待新增） | `/admin/risk`（待确认） |

---

## 4. 状态对齐（"已开放 / 内测中 / 即将开放 / 暂无数据"）

### 4.1 已开放（✅）

- 首页 / 行情 / 现货 / 合约 / 钱包 / 充值 / 提现 / 资金流水 / KYC / NFT / IDO / DeFi / DEX / OTC / Shop / Stake / Savings / 复制交易 / 期权 / P2P / 视频 / 直播 / 播客 / 文章 / 游戏 / 子门户 / 牌照 / 注册 / 登录

### 4.2 内测中（🟡）

- 资产收益（部分）
- 量化策略
- AI 中心（部分能力）
- 部分 admin 子域（**非客户验收安全路径**）

### 4.3 即将开放（🆕）

- 储备金证明（**100% 缺失**）
- 树图公链专区（**100% 缺失**）
- 机构服务展示
- 桌面端公告/帮助/风险

### 4.4 暂无数据（⏸️）

- 桌面端公告（接口已规划）
- 桌面端帮助（接口已规划）
- 桌面端 API 文档（静态即可）

---

## 5. 待用户澄清点

1. 桌面端"新闻" vs Admin "公告" vs H5 "news" 是否统一为"公告"？
2. 桌面端是否新增"帮助中心"独立页（当前散落在 H5 profile）？
3. 新设计是否要求新增"API 文档"独立页（当前 OpenAPI 静态）？
4. 新设计是否要求新增"机构服务"独立页（当前无）？

---

> **本文件为只读盘点。未对任何业务代码、schema、seed、配置进行修改。**
