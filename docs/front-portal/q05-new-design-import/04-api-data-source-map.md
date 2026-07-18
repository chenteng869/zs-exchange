# 04 - API 数据源对齐（API & Data Source Map）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 04
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读盘点，**不修改任何业务代码**

---

## 0. 数据源现状摘要

| 维度 | 现状 |
|---|---|
| API route.ts 总数 | 330（参考 04-api-route-inventory.md） |
| Admin API 总数 | 48（v1/admin 24 + legacy 24） |
| withAdminAuth 覆盖 | 47/47 = 100% |
| B1 真实化 API | 11/11 = 100% |
| Prisma model 总数 | 255 |
| 钱包主余额表 | `WalletUserAssetBalance`（b1） |
| 主流水表 | `WalletUserAssetLedger`（b1） |
| 历史账户表并存 | 4 套（TradeBalance / WalletUserAssetBalance / SpotAccount / PerpAccount） |
| 历史 ledger 并存 | ≥ 11 套 |

---

## 1. 行情数据来源

### 1.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 行情 ticker | `/api/v1/crypto/stream`（**SSE 客户端 mock**） | 🟡 mock 命中 |
| 行情深度 | `/api/v1/crypto/depth` | 🟡 |
| 行情聚合 | `/api/v1/crypto/*` | 部分真实 |
| 现货行情 | `/api/v1/spot/*` | 部分真实 |
| 合约行情 | `/api/v1/perp/market` | 部分真实 |
| 交易对管理 | admin/cex/pairs | 真实 |

### 1.2 真实数据源

- 内部撮合引擎（如果存在）
- 第三方行情聚合商（CryptoCompare / CoinGecko / Binance public API）— **当前未确认**
- Alchemy Prices API — 已集成

### 1.3 缺口

- `/api/v1/crypto/stream` 显式声明"演示用 mock"，**未真实接入**

### 1.4 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 首页 ticker | 内部撮合 + 行情聚合 | 真实接入或"数据接入中"标签 |
| 行情页表格 | 同上 | 真实接入或"内测中"标签 |
| 深度图 | `/api/v1/crypto/depth` | 真实 |
| K 线 | （待确认） | 需新增或第三方 |

---

## 2. 用户资产数据来源

### 2.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 钱包用户态 | `/api/v1/user/wallet/*` | ✅ 真实 |
| 用户资产 | `/api/v1/user/assets/*` | 部分真实 |
| 钱包用户资产 | `WalletUserAssetBalance`（Prisma） | ✅ b1 真实 |
| 钱包流水 | `WalletUserAssetLedger` | ✅ b1 真实 |

### 2.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 用户钱包卡片 | b1 wallet API | ✅ 真实 |
| 总资产 | b1 wallet API | ✅ 真实 |
| 各币种余额 | b1 wallet API | ✅ 真实 |
| 冻结/可用 | b1 wallet API | ✅ 真实 |

---

## 3. 钱包余额数据来源

### 3.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 钱包余额 | `/api/v1/admin/wallet/transactions` | ✅ b1 真实 |
| 钱包流水 | `WalletUserAssetLedger` | ✅ b1 真实 |
| 跨表对账 | `WalletReconciliationRecord`（缺 worker） | 🟡 缺触发器 |
| 老表 `WalletWithdrawal` | `/admin/transactions/withdraw` 走老表 | ⚠️ 与新表 `WalletWithdrawalRecord` 并轨缺口 |
| 4 套账户并存 | TradeBalance / WalletUserAssetBalance / SpotAccount / PerpAccount | ⚠️ 数据一致性高风险 |

### 3.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 钱包首页 | b1 wallet API | ✅ 真实 |
| 各币种余额 | b1 wallet API | ✅ 真实 |
| 钱包流水 | b1 wallet-transactions API | ✅ 真实 |
| 对账页面 | `WalletReconciliationRecord` | **暂无数据** 标签（缺 worker） |

---

## 4. 充值数据来源

### 4.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 充值链上 tx | wallet-deposit API | ✅ 真实 |
| 充值链类型 | `DepositChain`（仅 ETH/BSC/TRON） | ⚠️ 不全 |
| 充值监听 | `chain-registry` 6 链默认 | 部分 |
| 充值审核 | admin/transactions/deposit（待确认） | 待确认 |
| Alchemy webhook | address-activity 端到端通过 | ✅ 真实 |
| Alchemy 其他 webhook | 4 类就绪但 signing key 缺失 | 🟡 待密钥 |

### 4.2 缺口

- 实际服务链类型仅 `EvmChain = 'ETH' | 'BSC'`（`withdrawal-broadcaster.ts:35` 显式限制）
- Bitcoin/Cosmos 适配器存在但未注册
- 树图公链 100% 缺失

### 4.3 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 充值页面 | wallet-deposit API | ✅ 真实 |
| 充值二维码 | 内部生成 | ✅ 真实 |
| 充值记录 | wallet-deposit API | ✅ 真实 |
| 充值确认数 | 链上查询 | ✅ 真实 |
| 充值到账通知 | wallet-deposit | ✅ 真实 |

---

## 5. 提现数据来源

### 5.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 提现提交 | wallet-withdraw API | ✅ 真实 |
| 提现记录 | `/api/v1/admin/transactions/withdraw` | ✅ b1 真实 |
| 提现审核 | admin（**写接口未启**） | 🟡 状态 |
| 提现广播 | `withdrawal-broadcaster.ts` | ✅ 真实（仅 ETH/BSC） |
| 链服务实际类型 | `EvmChain = 'ETH' \| 'BSC'` | ⚠️ |
| 老表 `WalletWithdrawal` | 4 字段 string status | ⚠️ |
| 新表 `WalletWithdrawalRecord` | 13 态 enum | ⚠️ 并轨缺口 |

### 5.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 提现页面 | wallet-withdraw API | ✅ 真实 |
| 提现记录 | b1 withdraw API | ✅ 真实 |
| 提现状态 | b1 withdraw API | ✅ 真实 |
| 提现审核 | 待启写接口 | "内测中" 标签 |
| 提现到账 | 链上查询 | ✅ 真实 |

---

## 6. 资金流水数据来源

### 6.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 用户资金流水 | `/api/v1/user/wallet/history` | ✅ 真实 |
| 钱包 ledger | `WalletUserAssetLedger`（b1） | ✅ 真实 |
| 跨域流水 | 11 套 ledger 并存 | ⚠️ 数据漂移风险 |

### 6.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 流水列表 | b1 wallet-transactions API | ✅ 真实 |
| 流水详情 | b1 wallet-transactions API | ✅ 真实 |
| 流水过滤 | b1 wallet-transactions API | ✅ 真实 |
| 流水导出 | 待新增 | "内测中" 标签 |

---

## 7. 公告数据来源

### 7.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 桌面端公告 | **无独立 API** | 🆕 缺 |
| H5 公告 | `/h5/news`（**静态或 mock**） | 🟡 |
| Admin 公告 | `/admin/content` | 部分 |
| 公告模型 | `Announcement`（Prisma 待确认） | 部分 |

### 7.2 缺口

- **桌面端无公告独立 API**（新设计必填）
- H5 `/h5/news` 当前**可能是 mock**

### 7.3 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 桌面端公告 | **需新增 `/api/v1/announcements` GET** | 必填 |
| H5 公告 | 同上 | 必填 |
| 公告详情 | 同上 | 必填 |
| Admin 公告管理 | admin/content | 已存在 |

---

## 8. 帮助中心数据来源

### 8.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 桌面端帮助 | **无独立 API** | 🆕 缺 |
| H5 帮助 | `/h5/profile/help`（**静态或 mock**） | 🟡 |
| Admin 帮助 | `/admin/content`（部分） | 部分 |
| FAQ 数据 | `@/lib/constants.ts` 已有 `FAQ_DATA` | ✅ 静态 |
| 帮助模型 | `HelpArticle`（Prisma 待确认） | 部分 |

### 8.2 缺口

- **桌面端无帮助独立 API**（新设计必填）

### 8.3 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 桌面端帮助首页 | 静态 + FAQ_DATA | ✅ 立即可做 |
| 帮助分类 | 静态 | ✅ 立即可做 |
| 帮助详情 | 静态 | ✅ 立即可做 |
| 搜索 | 客户端搜索 | ✅ 立即可做 |
| 工单提交 | **需新增 API** | 后续 |

---

## 9. 安全中心数据来源

### 9.1 当前数据流

| 来源 | 接口 | 状态 |
|---|---|---|
| 桌面端安全 | **无独立页** | 🆕 缺 |
| H5 安全 | `/h5/wallet/security` `/h5/profile/security` | 部分真实 |
| Admin 安全 | `/admin/security/*` | ✅ b1 真实 |
| 安全模型 | `SecurityIncident`（Prisma） | 真实 |
| MFA 策略 | `/admin/mfa/policy` | ✅ b1 真实 |
| WAF 管理 | `/admin/security/waf` | 部分 |

### 9.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 桌面端安全首页 | b1 security API | ✅ 真实 |
| MFA 状态 | b1 mfa API | ✅ 真实 |
| 设备管理 | 静态 + b1 | ✅ 真实 |
| 风控规则 | b1 risk API | ✅ 真实 |
| 安全公告 | 静态 | ✅ 立即可做 |

---

## 10. API 文档数据来源

### 10.1 当前数据流

| 来源 | 状态 |
|---|---|
| `/api/v1/docs` | ✅ 已有（OpenAPI 静态） |
| `docs/openapi/complete-openapi.json` | ✅ 已有 |
| `docs/openapi/fjn-openapi.json` | ✅ 已有 |
| `fjn-openapi.json` | ✅ 福建老酒 23 Service |

### 10.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| API 文档首页 | 静态 OpenAPI | ✅ 立即可做 |
| API 列表 | 静态 OpenAPI | ✅ 立即可做 |
| API 详情 | 静态 OpenAPI | ✅ 立即可做 |
| SDK 下载 | 静态 | ✅ 立即可做 |
| 接入指南 | 静态 | ✅ 立即可做 |

---

## 11. 树图公链数据来源

> **关键事实**：树图公链业务代码 **0 命中**（参考 18-treegraph-capability-gap-draft.md）

### 11.1 现状

| 项 | 状态 |
|---|---|
| `TREEGRAPH_RPC_URL` 环境变量 | ❌ 无 |
| `treegraph\|conflux\|树图` 代码命中 | ❌ 0 |
| ChainRegistry 注册 | ❌ 未注册 |
| EvmChain 含 | ❌ 不含 |
| DepositChain 含 | ❌ 不含 |
| 16 项核心能力 | ❌ 100% 缺失 |

### 11.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 树图公链专区 | **100% 缺失** | **禁止上线** 或 **"即将开放"标签** |
| TreeGraph RPC | 无 | **"即将开放"标签** |
| TreeGraph 浏览器 | 无 | **"即将开放"标签** |
| TreeGraph 资产 | 无 | **"即将开放"标签** |

> **强制约束**：树图公链专区**绝对不能**以"已上线"状态出现，**必须**打"即将开放 / 数据接入中"标签。

---

## 12. 储备金证明数据来源

### 12.1 现状

- 业务代码 0 命中
- 币安对标等级 0（完全缺失）

### 12.2 新设计建议

| 新设计模块 | 数据源 | 建议 |
|---|---|---|
| 储备金证明 | **100% 缺失** | **禁止上线** 或 **"即将开放"标签** |
| PoR 审计 | 无 | **"即将开放"标签** |
| Merkle Tree 验证 | 无 | **"即将开放"标签** |

> **强制约束**：储备金证明模块**绝不能**伪造数据上线。客户一眼识破 = 工业级失败。

---

## 13. 数据源总表

| 业务模块 | 数据源 | 状态 | 新设计建议 |
|---|---|---|---|
| 首页 ticker | `/api/v1/crypto/stream`（mock） | 🟡 | 真实接入或"接入中" |
| 首页 Features | 静态 | ✅ | 立即可做 |
| 行情 | `/api/v1/crypto/*` `/api/v1/spot/*` | 🟡 | 真实 |
| 现货交易 | spot API | 🟡 | 真实 |
| 合约交易 | perp API | 🟡 | 真实 |
| 钱包余额 | b1 wallet API | ✅ | 真实 |
| 充值 | wallet-deposit API | ✅ | 真实 |
| 提现 | b1 withdraw API | ✅ | 真实 |
| 资金流水 | b1 wallet-transactions API | ✅ | 真实 |
| KYC | b1 kyc API | ✅ | 真实 |
| 用户等级 | b1 users/levels API | ✅ | 真实 |
| 邀请返佣 | referral API | ✅ | 真实 |
| 通知 | notification API | ✅ | 真实 |
| NFT | nft API | ✅ | 真实 |
| IDO | ido API | ✅ | 真实 |
| DeFi | defi API | ✅ | 真实 |
| DEX | dex API | ✅ | 真实 |
| OTC | otc API | ✅ | 真实 |
| Shop | mall API | ✅ | 真实 |
| Stake | staking API | ✅ | 真实 |
| Savings | savings API | ✅ | 真实 |
| AI 中心 | ai API | 🟡 | 部分真实 |
| 内容/视频/直播 | content/live/podcast/video API | ✅ | 真实 |
| 游戏 | game API | ✅ | 真实 |
| 子门户 | 静态 | ✅ | 立即可做 |
| 牌照 | 静态 | ✅ | 立即可做 |
| 关于 | 静态 | ✅ | 立即可做 |
| 客户端下载 | 静态 | ✅ | 立即可做 |
| 公告 | **缺独立 API** | 🆕 | 必填 |
| 帮助 | **缺独立 API** | 🆕 | 必填 |
| 风险 | 静态 | ✅ | 立即可做 |
| 合规 | 静态 | ✅ | 立即可做 |
| 机构 | 静态 + 咨询表单 | 🆕 | 必填 |
| API 文档 | 静态 OpenAPI | ✅ | 立即可做 |
| 安全 | b1 security API | ✅ | 真实 |
| MFA | b1 mfa API | ✅ | 真实 |
| 树图公链 | **0 命中** | ❌ | **"即将开放"** |
| 储备金证明 | **0 命中** | ❌ | **"即将开放"** |
| P2P | p2p API | ✅ | 真实 |
| 复制交易 | copy API | ✅ | 真实 |
| 期权 | options API | ✅ | 真实 |

---

## 14. 必须新增的 API（落地新设计必填）

| 序 | API 路径 | 用途 | 优先级 |
|---|---|---|---|
| 1 | `GET /api/v1/announcements` | 公告列表 | P0 |
| 2 | `GET /api/v1/announcements/[id]` | 公告详情 | P0 |
| 3 | `GET /api/v1/help/categories` | 帮助分类 | P1 |
| 4 | `GET /api/v1/help/articles` | 帮助文章 | P1 |
| 5 | `POST /api/v1/institution/inquiry` | 机构咨询表单 | P2 |
| 6 | `GET /api/v1/fees` | 费率表 | P1 |
| 7 | `GET /api/v1/risk-disclosure` | 风险提示（静态即可） | P1 |
| 8 | `GET /api/v1/compliance/licenses` | 牌照列表（静态） | P1 |

---

> **本文件为只读盘点。未对任何业务代码、schema、seed、配置进行修改。**
