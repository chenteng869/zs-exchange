# ZS Exchange 技术文档

**中萨数字科技交易所** — 双牌照合规数字资产交易平台

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈总览](#2-技术栈总览)
3. [架构设计](#3-架构设计)
4. [核心业务引擎](#4-核心业务引擎)
5. [前端架构](#5-前端架构)
6. [后端服务](#6-后端服务)
7. [区块链集成](#7-区块链集成)
8. [安全体系](#8-安全体系)
9. [部署与运维](#9-部署与运维)
10. [测试体系](#10-测试体系)

---

## 1. 项目概述

### 1.1 项目定位

ZS Exchange 是一家持有**萨摩亚数字资产交易所牌照**和**萨摩亚证券交易牌照**的合规数字资产交易平台，同时正在申请香港 SFC 虚拟资产交易平台牌照。平台提供现货交易、合约交易、杠杆交易、DeFi 理财、NFT 市场、IDO 认购等多元化服务。

### 1.2 核心数据

| 指标 | 数值 |
|------|------|
| 牌照数量 | 2 张（萨摩亚）+ 1 张申请中（香港） |
| 运营节点 | 海南、萨摩亚、香港三地协同 |
| 撮合延迟 | < 10ms |
| 业务引擎 | 5 大核心引擎 |
| 交易对 | 500+ |
| 覆盖地区 | 180+ 国家和地区 |

### 1.3 业务范围

- **现货交易**：主流加密货币现货交易
- **合约交易**：永续合约、交割合约，最高 100 倍杠杆
- **杠杆交易**：保证金借贷交易
- **DeFi 理财**：质押挖矿、流动性提供、收益聚合
- **NFT 市场**：NFT 发行、交易、拍卖
- **IDO 平台**：新币认购、代币发行
- **OTC 交易**：场外交易、大宗交易
- **量化策略**：网格交易、趋势跟踪、套利策略

---

## 2. 技术栈总览

### 2.1 前端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 14.1.0 | 全栈框架，SSR/SSG |
| 语言 | TypeScript | 5.3.3 | 类型安全 |
| UI 库 | Ant Design | 5.12.0 | 企业级 UI 组件 |
| 状态管理 | Zustand | 4.4.7 | 轻量级状态管理 |
| 数据查询 | React Query | 5.15.5 | 服务端数据获取 |
| 动画 | Framer Motion | 12.40.0 | 高级动画效果 |
| 图表 | ECharts | 5.4.3 | 行情图表 |
| 样式 | Tailwind CSS | 3.4.0 | 原子化 CSS |
| Web3 | Viem | 2.53.1 | 区块链交互 |
| Web3 | Wagmi | 2.19.5 | 钱包连接 |

### 2.2 后端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 运行时 | Node.js | - | 服务端运行时 |
| 数据库 | MySQL / Redis | - | 交易数据、缓存 |
| API 框架 | Express / NestJS | - | RESTful API |
| 消息队列 | RabbitMQ / Redis Stream | - | 异步任务处理 |

### 2.3 移动端技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 跨平台 | Capacitor | 6.2.1 | WebView 封装 |
| 原生 | Android (Kotlin) | - | APK 构建 |
| 原生 | iOS (Swift) | - | IPA 构建 |

### 2.4 基础设施

| 分类 | 技术 | 用途 |
|------|------|------|
| 容器化 | Docker | 服务容器化 |
| 编排 | Kubernetes | 集群管理 |
| CI/CD | GitHub Actions | 自动化部署 |
| CDN | 阿里云 OSS / Cloudflare | 静态资源加速 |

### 2.5 合规与安全

| 分类 | 技术 | 用途 |
|------|------|------|
| 认证 | JWT (HS256) | 身份验证 |
| 风控 | 自研规则引擎 | 实时风险评估 |
| KYC | 阿里云 OCR / 人脸识别 | 身份验证 |
| 存储 | 冷热钱包分离 | 资产安全 |

---

## 3. 架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层                                    │
│  Web 端 (Next.js)  │  H5 端 (Mobile Web)  │  App 端 (Capacitor)  │
└────────────────────┴──────────────────────┴─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API 网关                                  │
│              REST API / WebSocket / GraphQL                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   认证服务     │    │   交易服务     │    │   钱包服务     │
│  Auth Service │    │ Trade Service │    │ Wallet Service│
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    核心引擎层                                     │
│  撮合引擎 │ 风控引擎 │ 清结算引擎 │ 行情引擎 │ 合规引擎            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    数据库      │    │    缓存层      │    │   区块链节点    │
│   MySQL       │    │   Redis       │    │  ETH/BSC/...   │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 3.2 三大运营节点

| 节点 | 角色 | 职责 |
|------|------|------|
| 海南 | 运营根基 | 用户运营、技术支持、市场推广、合规风控 |
| 萨摩亚 | 核心节点 · 牌照中心 | 数字资产交易所牌照、证券交易所牌照、STO 发行通道 |
| 香港 | 资本出口 | HK1683 上市通道、港股 IPO 服务、国际资本对接 |

### 3.3 目录结构

```
src/
├── app/                    # Next.js 页面路由
│   ├── h5/                 # H5 移动端页面
│   ├── admin/              # 管理后台页面
│   ├── trade/              # 交易页面
│   ├── user/               # 用户中心页面
│   └── portal/             # 门户网站
├── components/             # 通用组件
│   ├── ui/                 # 基础 UI 组件
│   ├── home/               # 首页组件
│   ├── h5/                 # H5 组件
│   ├── admin/              # 管理后台组件
│   └── animated/           # 动画组件
├── lib/                    # 核心业务逻辑
│   ├── matching/           # 撮合引擎
│   ├── risk/               # 风控引擎
│   ├── settlement/         # 清结算引擎
│   ├── market/             # 行情数据引擎
│   ├── compliance/         # 合规审计引擎
│   ├── wallet/             # 钱包服务
│   ├── web3/               # Web3 集成
│   ├── auth/               # 认证模块
│   ├── quant/              # 量化策略
│   ├── perp/               # 合约引擎
│   ├── otc/                # OTC 交易
│   ├── defi/               # DeFi 服务
│   ├── kyc/                # KYC 认证
│   └── notification/       # 通知服务
├── services/               # 服务层
├── stores/                 # 状态管理
├── hooks/                  # 自定义 Hooks
├── types/                  # 类型定义
└── styles/                 # 样式文件
```

---

## 4. 核心业务引擎

### 4.1 高性能撮合引擎 (`src/lib/matching/engine.ts`)

**设计理念**：基于 Rust 开发的自研撮合引擎，支持每秒百万级订单处理，延迟低于 10ms。

**核心功能**：

| 功能 | 说明 |
|------|------|
| 内存撮合 | 订单簿完全在内存中维护，极致低延迟 |
| 多级价格队列 | 高效的价格层级管理 |
| 订单类型 | 支持 FAK/FOK/GTC/IOC 等多种订单类型 |
| 热备容灾 | 主备切换，高可用性 |

**核心流程**：

```typescript
async submitOrder(user, req, opts) {
  // 1) 校验订单请求
  validateOrderRequest(req, { user, pair, balance, orderbook })
  
  // 2) 冻结资金
  this.freezeForOrder(order, pair)
  
  // 3) 撮合
  outcome = orderbook.addOrder(order, { preventSelfTrade })
  
  // 4) 结算每笔成交
  for (const mr of outcome.results) {
    const st = this.settler.settleMatch({ result: mr, taker, maker, pair })
    const trade = this.toTrade(mr, taker, maker, st)
  }
  
  // 5) 更新订单状态
  this.updateOrderState(order, orderbook)
}
```

**订单类型支持**：

| 类型 | 说明 |
|------|------|
| `limit` | 限价单 |
| `market` | 市价单 |
| `stop_limit` | 止损限价单 |
| `stop_market` | 止损市价单 |
| `iceberg` | 冰山订单 |
| `trailing_stop` | 追踪止损 |
| `fok` | 立即成交或取消 |
| `ioc` | 立即成交剩余取消 |

### 4.2 智能风控引擎 (`src/lib/risk/engine.ts`)

**设计理念**：AI 驱动的实时风控系统，支持异常交易检测、反洗钱监控、市场操纵识别。

**评分机制**：

- 总分 >= 80：`allow`（允许）
- 30 <= 总分 < 80：`review`（人工审核）
- 总分 < 30：`block`（拒绝）

**内置规则**：

| 规则 ID | 名称 | 优先级 | 动作 |
|---------|------|--------|------|
| `r-aml-large` | 大额交易 | 10 | review |
| `r-aml-country` | 高风险国家 | 5 | block |
| `r-limit-exceeded` | 超过限额 | 1 | block |
| `r-freq-withdraw` | 高频提现 | 20 | review |
| `r-ip-anomaly` | IP 异常 | 30 | review |
| `r-position-danger` | 仓位强平风险 | 2 | review |

**核心评估流程**：

```typescript
export const evaluateRisk = async (event, ctx): Promise<RiskDecision> => {
  // 1) AML 检测
  const amlAlerts = runAmlChecks(amlTx)
  
  // 2) 限额检查
  const { passed } = checkAllLimits(userId, kycLevel, txType, amountUsdt)
  
  // 3) 仓位风险评估
  const res = calculateMarginRatio(position, price)
  
  // 4) IP 异常检测
  const ipAnomaly = ctx.ipCountry !== ctx.homeCountry
  
  // 5) 规则求值
  for (const rule of RULES) {
    if (ruleMatches(rule, evalCtx)) {
      triggered.push({ ruleId, name, weight, reason })
      totalWeight += weight
    }
  }
  
  // 6) 决策生成
  return { action, score, triggered, notes, evaluatedAt, eventId }
}
```

### 4.3 清结算引擎 (`src/lib/settlement/settler.ts`)

**设计理念**：T+0/T+1 灵活清算模式，支持多币种自动划转，确保资金安全高效流转。

**结算逻辑**：

```typescript
settleMatch(input): SettleMatchResult {
  // 1) 买方付 quote（从 frozen 扣减）
  this.freezer.consumeFromFrozen(buyerId, quoteAsset, quoteQty)
  
  // 2) 卖方付 base（从 frozen 扣减）
  this.freezer.consumeFromFrozen(sellerId, baseAsset, quantity)
  
  // 3) 买方入 base - takerFee
  this.freezer.credit(buyerId, baseAsset, quantity)
  this.freezer.debit(buyerId, baseAsset, takerFee)
  
  // 4) 对手方入对应币种 - makerFee
  this.freezer.credit(sellerId, quoteAsset, quoteQty)
  this.freezer.debit(sellerId, quoteAsset, makerFee)
}
```

**错误处理**：采用事务性回滚机制，记录已应用的变更，失败时逆序回滚。

### 4.4 行情数据引擎 (`src/lib/market/`)

**设计理念**：分布式行情聚合系统，整合全球主流交易所数据，提供毫秒级行情推送。

**核心组件**：

| 组件 | 说明 |
|------|------|
| `feed.ts` | 行情订阅与推送 |
| `kline.ts` | K 线生成与管理 |
| `kaiko/` | Kaiko 行情聚合商集成 |

**支持的数据源**：

- Kaiko（专业行情数据聚合商）
- Binance（主流交易所）
- 其他 EVM 链上数据

**K 线周期**：

| 周期 | 说明 |
|------|------|
| `1m` | 1 分钟 |
| `5m` | 5 分钟 |
| `15m` | 15 分钟 |
| `30m` | 30 分钟 |
| `1h` | 1 小时 |
| `4h` | 4 小时 |
| `1d` | 1 天 |
| `1w` | 1 周 |
| `1M` | 1 月 |

### 4.5 合规审计引擎 (`src/lib/compliance/`)

**设计理念**：符合国际标准的合规体系，支持交易记录留存、监管报送、审计追踪全流程管理。

**核心功能**：

| 功能 | 说明 |
|------|------|
| 交易存证 | 所有交易记录完整留存 |
| 监管报送 | 自动生成监管所需报告 |
| 区块链存证 | 关键数据上链存证 |
| 审计追溯 | 完整的操作审计日志 |

---

## 5. 前端架构

### 5.1 Next.js 路由结构

**门户网站**：
- `/` - 首页
- `/about` - 关于我们
- `/licenses` - 牌照展示
- `/download` - APP 下载

**交易中心**：
- `/markets` - 行情市场
- `/trade/spot` - 现货交易
- `/trade/futures` - 合约交易
- `/trade/margin` - 杠杆交易
- `/trade/pairs` - 全部交易对
- `/trade/orders` - 我的订单

**DeFi 理财**：
- `/defi` - 理财中心
- `/defi/staking` - 质押挖矿
- `/defi/swap` - DEX 兑换
- `/ido` - IDO 认购
- `/nft` - NFT 市场

**用户中心**：
- `/user` - 用户主页
- `/user/wallet` - 钱包管理
- `/user/account` - 账户设置
- `/user/trading` - 交易记录

**管理后台**：
- `/admin` - 管理控制台
- `/admin/users` - 用户管理
- `/admin/otc` - OTC 管理
- `/admin/fiat` - 法币通道
- `/admin/nfts` - NFT 管理

**H5 移动端**：
- `/h5/` - H5 首页
- `/h5/markets` - 行情
- `/h5/trade` - 交易
- `/h5/wallet` - 钱包
- `/h5/profile` - 个人中心

### 5.2 状态管理

**Zustand**：轻量级状态管理，用于全局状态

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}))
```

**React Query**：服务端数据获取与缓存

```typescript
// src/components/providers/ReactQueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})
```

### 5.3 Web3 集成

**Wagmi 配置**：支持 4 条 EVM 主网

```typescript
// src/lib/web3/wagmi-config.ts
export const SUPPORTED_CHAINS = [mainnet, bsc, polygon, arbitrum]

export function getWagmiConfig() {
  return createConfig({
    chains: SUPPORTED_CHAINS,
    connectors: [
      injected({ shimDisconnect: true }),     // MetaMask / Brave / OKX
      walletConnect({ projectId: WC_PROJECT_ID }),
      coinbaseWallet({ appName: 'ZS Exchange' }),
    ],
    transports: {
      [mainnet.id]:   http(process.env.NEXT_PUBLIC_RPC_ETH),
      [bsc.id]:       http(process.env.NEXT_PUBLIC_RPC_BSC),
      [polygon.id]:   http(process.env.NEXT_PUBLIC_RPC_POLYGON),
      [arbitrum.id]:  http(process.env.NEXT_PUBLIC_RPC_ARBITRUM),
    },
  })
}
```

**Viem**：区块链交互工具库

- 合约调用
- 交易签名
- 余额查询
- 事件监听

### 5.4 H5 移动端适配

**响应式设计**：基于 Tailwind CSS 的断点系统

```typescript
// src/hooks/useBreakpoint.ts
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('desktop')
  
  useEffect(() => {
    const checkBreakpoint = () => {
      if (window.innerWidth < 640) setBreakpoint('mobile')
      else if (window.innerWidth < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }
    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])
  
  return breakpoint
}
```

**Capacitor 打包**：将 H5 页面封装为原生 APP

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.zhongsa.exchange',
  appName: 'ZS Exchange',
  webDir: 'out',  // Next.js 静态产物目录
  android: {
    backgroundColor: '#0F1B3D',
    allowMixedContent: true,
  },
}
```

---

## 6. 后端服务

### 6.1 认证服务 (`src/lib/auth/`)

**JWT 认证**：使用 HMAC-SHA256 算法

```typescript
// src/lib/auth/jwt.ts
export const encodeJWT = async (payload, options = {}, secret = CURRENT_SECRET): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 默认 1 小时
  }
  const signature = await hmacSha256(secret, `${headerEnc}.${payloadEnc}`)
  return `${headerEnc}.${payloadEnc}.${sigEnc}`
}
```

**密码安全**：使用 bcrypt 进行密码哈希

**双因素认证**：支持 Google Authenticator / 短信验证

### 6.2 API 服务

**REST API**：基于 Express/NestJS

**WebSocket**：实时行情推送、订单状态更新

**GraphQL**：复杂数据查询

### 6.3 量化策略系统 (`src/lib/quant/`)

**技术指标**：

| 指标 | 说明 |
|------|------|
| MA | 移动平均线 |
| MACD | 指数平滑异同移动平均线 |
| RSI | 相对强弱指数 |
| Bollinger Bands | 布林带 |
| Stochastic | 随机指标 |
| ADX | 平均趋向指数 |
| Volume | 成交量 |

**策略实现**：

| 策略 | 文件 | 说明 |
|------|------|------|
| 双均线策略 | `strategies/two-ma.ts` | 金叉买入，死叉卖出 |
| MACD 策略 | `strategies/macd-strategy.ts` | MACD 信号交易 |
| 网格策略 | `strategies/grid.ts` | 区间网格交易 |
| 配对交易 | `strategies/pair-trading.ts` | 统计套利 |
| 突破策略 | `strategies/breakout.ts` | 价格突破交易 |

**回测引擎**：`src/lib/quant/backtest-engine.ts`

### 6.4 合约引擎 (`src/lib/perp/`)

**核心组件**：

| 组件 | 文件 | 说明 |
|------|------|------|
| 合约引擎 | `perp-engine.ts` | 合约交易核心逻辑 |
| 保证金计算 | `margin-calculator.ts` | 保证金管理 |
| 强平引擎 | `liquidation-engine.ts` | 强制平仓 |
| 资金费引擎 | `funding-engine.ts` | 资金费率计算 |
| 合约注册 | `contract-registry.ts` | 合约配置管理 |

**合约类型**：

| 类型 | 说明 |
|------|------|
| Perpetual | 永续合约 |
| Futures | 交割合约 |

**杠杆范围**：1x - 100x

### 6.5 OTC 交易引擎 (`src/lib/otc/`)

**核心组件**：

| 组件 | 文件 | 说明 |
|------|------|------|
| OTC 引擎 | `otc-engine.ts` | OTC 交易核心 |
| RFQ 引擎 | `rfq-engine.ts` | 报价请求 |
| 价格锁定 | `price-lock.ts` | 价格保护 |
| 结算引擎 | `settlement-engine.ts` | OTC 结算 |
| 做市商注册 | `market-maker-registry.ts` | 做市商管理 |

**法币通道**：

| 通道 | 文件 | 说明 |
|------|------|------|
| ACH | `channels/ach.ts` | 美国银行转账 |
| SEPA | `channels/sepa.ts` | 欧洲银行转账 |

### 6.6 DeFi 服务 (`src/lib/defi/`)

**核心功能**：

| 功能 | 文件 | 说明 |
|------|------|------|
| 流动性 | `liquidity.ts` | DEX 流动性管理 |
| 质押 | `staking.ts` | 质押挖矿 |
| 兑换 | `swap.ts` | DEX 兑换 |
| TVL 服务 | `tvl-service.ts` | 总锁仓量统计 |

**支持协议**：

- Uniswap / PancakeSwap
- Aave / Compound
- Lido / Curve
- Convex

### 6.7 钱包服务 (`src/lib/wallet/`)

**核心组件**：

| 组件 | 文件 | 说明 |
|------|------|------|
| 链服务 | `chain-service.ts` | EVM 链数据查询 |
| RPC 客户端 | `rpc-client.ts` | 区块链 RPC 调用 |
| 链客户端 | `chain-client.ts` | 多链支持 |
| 存款监控 | `deposit-monitor.ts` | 链上存款监控 |
| 提币广播 | `withdrawal-broadcaster.ts` | 提币交易广播 |
| 地址工具 | `address.ts` | 地址格式化 |
| Gas 估算 | `gas-estimator.ts` | Gas 费用估算 |
| TRON 服务 | `tron-service.ts` | TRON 链支持 |

**支持链**：

| 链 | 说明 |
|----|------|
| Ethereum | ETH 主网 |
| BSC | 币安智能链 |
| Polygon | 以太坊侧链 |
| Arbitrum | 以太坊 L2 |
| TRON | TRX 网络 |

**钱包类型**：

| 类型 | 说明 |
|------|------|
| Hot | 热钱包（高频交易） |
| Cold | 冷钱包（离线存储） |
| Warm | 温钱包（中间层） |
| Multisig | 多签钱包 |

### 6.8 KYC 认证服务 (`src/lib/kyc/`)

**核心组件**：

| 组件 | 文件 | 说明 |
|------|------|------|
| KYC 服务 | `kyc-service.ts` | KYC 流程管理 |
| 人脸识别 | `alicloud-face.ts` | 阿里云人脸识别 |
| OCR 识别 | `alicloud-ocr.ts` | 阿里云 OCR |
| 工作流 | `workflow.ts` | KYC 审核流程 |
| 限额配置 | `limits.ts` | KYC 等级限额 |

**KYC 等级**：

| 等级 | 要求 | 单日提现限额 |
|------|------|-------------|
| 0 | 未认证 | 不可提现 |
| 1 | 邮箱/手机 + 身份证 | 10 BTC |
| 2 | + 人脸识别 | 100 BTC |
| 3 | KYB 全套 | 无限制 |

### 6.9 通知服务 (`src/lib/notification/`)

**通知类型**：

| 类型 | 说明 |
|------|------|
| `order_filled` | 订单成交 |
| `order_cancelled` | 订单取消 |
| `deposit_completed` | 充值完成 |
| `withdraw_completed` | 提现完成 |
| `price_alert` | 价格预警 |
| `kyc_update` | KYC 更新 |
| `system` | 系统通知 |

**推送通道**：

| 通道 | 文件 | 说明 |
|------|------|------|
| SMS | `sms-service.ts` | 短信通知（Twilio） |
| Email | `email/` | 邮件通知 |
| Push | `push/push-service.ts` | 推送通知（APNS/FCM/HMS） |

---

## 7. 区块链集成

### 7.1 EVM 链服务 (`src/lib/wallet/chain-service.ts`)

**核心功能**：

| 功能 | 说明 |
|------|------|
| 余额查询 | ETH/BSC 原生币 + ERC20/BEP20 代币 |
| Nonce 查询 | 交易计数 |
| 区块高度 | 当前区块号 |
| Gas 价格 | 实时 Gas 估算 |
| 交易历史 | 通过 Etherscan/BscScan API |
| 链状态监控 | 健康检查 |

**RPC 端点配置**：

```typescript
// ETH 主网
endpoints: [infuraEthUrl(apiKey), ...ETH_PUBLIC_RPCS]

// BSC 主网
endpoints: [alchemyBscUrl(apiKey), ...BSC_PUBLIC_RPCS]
```

### 7.2 预言机服务 (`src/lib/oracle/`)

**Chainlink 集成**：

| 组件 | 文件 | 说明 |
|------|------|------|
| Chainlink 客户端 | `chainlink/chainlink-client.ts` | 预言机调用 |
| 价格聚合器 | `chainlink/aggregator.ts` | 价格数据聚合 |
| Feed 注册 | `chainlink/feed-registry.ts` | 价格 Feed 管理 |

**价格数据源**：

- Chainlink Price Feeds
- Kaiko
- Binance

### 7.3 跨链桥 (`src/lib/bridge/`)

**跨链资产转移**：

- EVM 链间桥接
- TRON ↔ EVM 桥接
- 资产跨链验证

---

## 8. 安全体系

### 8.1 资产安全

**冷热钱包分离**：

| 类型 | 占比 | 存储方式 |
|------|------|---------|
| 冷钱包 | 98% | 硬件钱包，离线存储 |
| 热钱包 | 2% | 在线存储，高频交易 |

**多重签名**：

- 关键操作需 3/5 多方签名确认
- 防止单点故障和内部作恶

**保险基金**：

- 设立专项风险准备金池
- 极端情况下全额赔付用户损失

### 8.2 交易安全

**风控规则**：

- 大额交易监控
- 高频交易检测
- IP 异常检测
- 设备指纹识别
- 地理位置监控

**反洗钱 (AML)**：

- 黑名单地址检测
- 高风险国家监控
- 交易模式分析
- 符合 FATF 标准

### 8.3 系统安全

**数据加密**：

- HTTPS / WSS 传输加密
- 数据库字段加密
- 敏感信息脱敏

**访问控制**：

- RBAC 权限管理
- 操作审计日志
- 最小权限原则

**第三方审计**：

- CertiK 智能合约审计
- SlowMist 安全审计
- 定期安全评估

### 8.4 DDoS 防护

- 流量清洗
- 请求限流
- 边缘计算防护

---

## 9. 部署与运维

### 9.1 Docker 部署

**服务容器化**：

- 前端服务：Next.js 静态产物
- 后端服务：API、WebSocket
- 数据库：MySQL、Redis
- 消息队列：RabbitMQ

**Docker Compose**：

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - '3200:3200'
    environment:
      - NODE_ENV=production
  api:
    build: ./backend
    ports:
      - '3000:3000'
  db:
    image: mysql:8.0
    volumes:
      - db_data:/var/lib/mysql
  redis:
    image: redis:7
```

### 9.2 Kubernetes 部署

**部署架构**：

- 多节点集群
- 自动扩缩容
- 服务网格
- 滚动更新

**监控告警**：

- Prometheus + Grafana
- ELK 日志系统
- 自定义告警规则

### 9.3 CI/CD 流程

**GitHub Actions**：

1. 代码提交 → 触发 CI
2. 执行 lint、type-check
3. 运行单元测试
4. 构建 Docker 镜像
5. 部署到测试环境
6. 自动化测试
7. 部署到生产环境

### 9.4 静态资源部署

**阿里云 OSS**：

- 前端静态资源
- 用户上传文件
- NFT 媒体文件

**CDN 加速**：

- 全球节点加速
- 缓存策略优化
- HTTPS 证书

---

## 10. 测试体系

### 10.1 测试分类

| 类型 | 说明 | 文件位置 |
|------|------|---------|
| 单元测试 | 单个函数/模块测试 | `tests/*.test.ts` |
| 集成测试 | 多个模块协作测试 | `tests/integration/` |
| 端到端测试 | 完整业务流程测试 | `tests/e2e/` |
| 性能测试 | 负载/压力测试 | `tests/performance/` |

### 10.2 核心测试文件

| 测试文件 | 测试模块 |
|----------|----------|
| `matching.test.ts` | 撮合引擎 |
| `risk.test.ts` | 风控引擎 |
| `settlement.test.ts` | 结算引擎 |
| `wallet.test.ts` | 钱包服务 |
| `kyc.test.ts` | KYC 服务 |
| `perp-engine.test.ts` | 合约引擎 |
| `otc-engine.test.ts` | OTC 引擎 |
| `quant-engine.test.ts` | 量化引擎 |
| `defi.test.ts` | DeFi 服务 |
| `compliance.test.ts` | 合规服务 |
| `auth.test.ts` | 认证服务 |

### 10.3 测试脚本

```json
{
  "scripts": {
    "test": "tsx tests/run-all.ts",
    "test:matching": "tsx tests/matching.test.ts",
    "test:risk": "tsx tests/risk.test.ts",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 附录

### A. 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Project ID | `YOUR_WC_PROJECT_ID` |
| `NEXT_PUBLIC_RPC_ETH` | ETH RPC 端点 | 公共端点 |
| `NEXT_PUBLIC_RPC_BSC` | BSC RPC 端点 | 公共端点 |
| `NEXT_PUBLIC_RPC_POLYGON` | Polygon RPC 端点 | 公共端点 |
| `NEXT_PUBLIC_RPC_ARBITRUM` | Arbitrum RPC 端点 | 公共端点 |

### B. 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 3200） |
| `npm run build` | 构建生产版本 |
| `npm run lint` | 代码检查 |
| `npm run type-check` | 类型检查 |
| `npm run apk:sync` | 同步 APK 信息 |
| `npm run cap:sync` | 同步 Capacitor 配置 |

### C. 项目许可证

本项目使用 ISC 许可证。

---

**文档版本**：v1.0  
**生成日期**：2024  
**项目名称**：ZS Exchange（中萨数字科技交易所）