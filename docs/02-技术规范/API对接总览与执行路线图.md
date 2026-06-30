# API 对接总览与执行路线图

> **文档版本**：v1.0  
> **生效日期**：2026-06-19  
> **适用范围**：萨摩亚合规数字资产交易所 (SMY Exchange) 全产品线  
> **前置文档**：[加密货币行情数据聚合商](./加密货币行情数据聚合商.md) · [萨摩亚交易所开发施工标准](./萨摩亚交易所开发施工标准.md)  
> **文档目的**：系统梳理交易所运作所需的**全部 API 对接任务**，按功能模块与优先级分类排序，明确每项任务的目标、技术要求与验收标准，作为 API 对接工作的**执行路线图**。

---

## 目录

- [第一章 · 设计原则与总体策略](#第一章--设计原则与总体策略)
- [第二章 · Market Data Service 行情中台架构](#第二章--market-data-service-行情中台架构)
- [第三章 · API 对接菜单总览（按模块）](#第三章--api-对接菜单总览按模块)
- [第四章 · P0 紧急对接清单（影响演示）](#第四章--p0-紧急对接清单影响演示)
- [第五章 · P1 内测期对接清单](#第五章--p1-内测期对接清单)
- [第六章 · P2 正式生产对接清单](#第六章--p2-正式生产对接清单)
- [第七章 · P3 长期演进清单](#第七章--p3-长期演进清单)
- [第八章 · 模块化任务卡](#第八章--模块化任务卡)
  - [A. 行情聚合数据](#a-行情聚合数据)
  - [B. 交易所实时行情](#b-交易所实时行情)
  - [C. 链上数据 RPC](#c-链上数据-rpc)
  - [D. 钱包与充值提现](#d-钱包与充值提现)
  - [E. 预言机与价格源](#e-预言机与价格源)
  - [F. K线与图表](#f-k线与图表)
  - [G. DeFi / Web3 行情](#g-defi--web3-行情)
  - [H. 新闻 / 情绪 / 社交](#h-新闻--情绪--社交)
  - [I. 法币汇率](#i-法币汇率)
  - [J. KYC / 合规 / AML](#j-kyc--合规--aml)
  - [K. 支付 / 法币入金](#k-支付--法币入金)
  - [L. 推送 / 通知 / 短信 / 邮件](#l-推送--通知--短信--邮件)
  - [M. 监控 / 日志 / 告警](#m-监控--日志--告警)
  - [N. 撮合与风控（自有）](#n-撮合与风控自有)
- [第九章 · 标准化数据契约](#第九章--标准化数据契约)
- [第十章 · 异常处理与降级策略](#第十章--异常处理与降级策略)
- [第十一章 · 验收矩阵与门禁](#第十一章--验收矩阵与门禁)
- [第十二章 · 实施时间表](#第十二章--实施时间表)
- [第十三章 · 风险登记册](#第十三章--风险登记册)
- [附录 A · API Key 申请清单](#附录-a--api-key-申请清单)
- [附录 B · 已落地模块索引](#附录-b--已落地模块索引)

---

## 第一章 · 设计原则与总体策略

### 1.1 三大铁律

1. **App 不直连第三方**：所有 App（Flutter Mobile / H5 / Web）**必须**通过本交易所自建的 **Market Data Service 行情中台** 间接访问外部数据源，严禁前端直接调用 CoinGecko / Binance / 链上 RPC。
2. **多源备份 + 单点真相**：每个关键数据点（价格 / K线 / 余额）至少接 **2 个独立数据源**，由中台做加权、异常过滤、降级切换；中台对外只暴露一种标准化格式。
3. **展示行情 ≠ 撮合成交价**：前端展示价 / 指数价 / 标记价 / 撮合价必须分开标注，绝不允许混用。

### 1.2 整体接入策略

| 阶段 | 目标 | 时间窗 | 数据源组合 |
|------|------|--------|------------|
| **P0 演示** | 跑通端到端，能上台演示 | 第 1-2 周 | CoinGecko + Binance + OKX + Infura + Alchemy（已部分实现） |
| **P1 内测** | 真实数据 + 7×24 稳定 | 第 3-6 周 | P0 + CCXT + CryptoCompare + DeFiLlama + 法币汇率 + 短信/邮件 |
| **P2 正式生产** | 机构级 + 多活容灾 | 第 7-12 周 | P1 + Kaiko/CoinAPI + Chainlink/Pyth + 多节点冗余 + 自有撮合 |
| **P3 长期演进** | 数据中台 + AI 增强 | 第 13 周+ | P2 + Dune + Glassnode + Nansen + TradingView Pro |

### 1.3 文档驱动开发的最小集

每个对接任务都必须满足以下最小集，才能进入联调阶段：

- [x] **API Key 申请**（公共 API 可豁免）
- [x] **SDK / 客户端封装**（`src/lib/<module>/`）
- [x] **数据契约**（TypeScript interface / JSON Schema）
- [x] **健康检查端点**（`/health/<module>`）
- [x] **单元测试 ≥ 80% 覆盖**（happy path + 至少 3 个异常分支）
- [x] **演示环境**断网可降级（必须有 mock fallback）
- [x] **熔断 + 重试** 策略（指数退避，最大 3 次）
- [x] **告警规则**（延迟 / 失败率 / 价格偏离）
- [x] **README**（含调用示例、限流说明）

---

## 第二章 · Market Data Service 行情中台架构

### 2.1 分层架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                  第三方数据源 (External Data Sources)              │
├──────────────────────────────────────────────────────────────────┤
│  CoinGecko · CoinMarketCap · CryptoCompare · CoinAPI · Kaiko    │
│  Binance · OKX · Bybit · Coinbase · Kraken · Gate · KuCoin       │
│  Infura · Alchemy · QuickNode · Moralis · Covalent              │
│  Chainlink · Pyth · RedStone                                     │
│  DeFiLlama · Dune · Glassnode · Nansen                           │
│  CryptoPanic · LunarCrush · Messari                              │
│  Open Exchange Rates · Fixer · ExchangeRate-API                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│               数据采集层 (Ingestion Layer)                        │
│  ┌─────────────┬─────────────┬─────────────┬──────────────────┐  │
│  │ REST Poller │ WS Collector│ On-chain    │ Oracle Reader    │  │
│  │  · 1m/5m    │  · !ticker   │  Indexer    │  · Chainlink     │  │
│  │  · 24h T    │  · !kline   │  · EVM Log  │  · Pyth          │  │
│  │  · /klines  │  · !depth   │  · BTC/ETH  │  · RedStone      │  │
│  └─────────────┴─────────────┴─────────────┴──────────────────┘  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              标准化层 (Normalization Layer)                       │
│  · Symbol Normalize (BTCUSDT → BTC/USDT)                         │
│  · Price Normalize (string ↔ Decimal, 8 位精度)                  │
│  · Volume Normalize (USDT 计价 / 原始币种)                        │
│  · Timestamp Normalize (ISO 8601 UTC)                            │
│  · Source Weighting (Binance 60% / OKX 30% / CoinGecko 10%)      │
│  · Anomaly Filter (偏离中位数 > 3% 自动剔除)                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                存储层 (Storage Layer)                             │
│  · Redis        实时 ticker / 订单簿 / 最近 K 线 (TTL 30s-1h)   │
│  · PostgreSQL   币种资料 / 交易对配置 / 用户偏好                  │
│  · TimescaleDB  K 线历史 (1m/5m/15m/1h/4h/1d/1w)                │
│  · ClickHouse   成交 / 链上交易 / 大数据分析                     │
│  · S3 / MinIO   冷数据归档 / 审计日志 / 快照                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                服务层 (Service Layer)                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│  │ Ticker API   │ Kline API    │ OrderBook    │ Metadata API │   │
│  │ Depth API    │ News API     │ FX API       │ Oracle API   │   │
│  │ WebSocket    │ Admin API    │ Health API   │ Audit API    │   │
│  └──────────────┴──────────────┴──────────────┴──────────────┘   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                  前端 / 客户端 (Consumers)                        │
│  · Flutter App (Mobile)   · H5 / Web   · Admin Dashboard          │
│  · 后台监控               · 内部 BI    · 第三方合作方             │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向优先级

| 优先级 | 业务场景 | 主源 | 备源 1 | 备源 2 |
|--------|----------|------|--------|--------|
| P0-CRITICAL | 撮合成交价 | 自有撮合 | Binance | OKX |
| P0-CRITICAL | 充值到账监听 | Infura | Alchemy | 自建 ETH/BSC 节点 |
| P0-HIGH | 行情展示价 | Binance | OKX | CoinGecko |
| P0-HIGH | 钱包余额 | Infura | Alchemy | Covalent |
| P1-MED | K 线 | Binance | OKX | CryptoCompare |
| P1-MED | 链上 Gas | Etherscan | Infura | Alchemy |
| P2-NICE | DeFi TVL | DeFiLlama | Dune | 自建子图 |
| P3-AI | 情绪 / 新闻 | CryptoPanic | LunarCrush | Messari |

---

## 第三章 · API 对接菜单总览（按模块）

> **读法**：每一行 = 一个最小可交付任务（MVP-粒度）。  
> 优先级：`P0 紧急` / `P1 内测` / `P2 生产` / `P3 演进`  
> 工作量：`S ≤ 1d` · `M 2-5d` · `L 1-2w` · `XL ≥ 2w`  
> 状态：`⬜ 未开始` · `🟡 进行中` · `✅ 已完成`

### 3.1 任务总表

| # | 模块 | 任务名 | 主源 API | 优先级 | 工作量 | 状态 | 责任人 |
|---|------|--------|----------|--------|--------|------|--------|
| **A. 行情聚合数据** |
| A-01 | 行情聚合 | 币价 / 24h 涨跌 / 市值 | CoinGecko | P0 | S | ✅ | backend |
| A-02 | 行情聚合 | 主流币 K线 (1d/1h) | CoinGecko | P0 | S | ✅ | backend |
| A-03 | 行情聚合 | 币种 Logo + 资料 | CoinGecko | P0 | S | ✅ | backend |
| A-04 | 行情聚合 | 长尾币 / 静态信息 | CoinMarketCap | P1 | M | ⬜ | backend |
| A-05 | 行情聚合 | 历史 K线 (5y+) | CryptoCompare | P1 | M | ⬜ | backend |
| A-06 | 行情聚合 | 多源价格中位数 | 自研加权 | P1 | M | ⬜ | backend |
| **B. 交易所实时行情** |
| B-01 | 实时行情 | 24h Ticker + 涨跌幅 | Binance Public | P0 | M | ✅ | backend |
| B-02 | 实时行情 | WebSocket 实时推送 | Binance WS | P0 | M | ✅ | backend |
| B-03 | 实时行情 | 深度 OrderBook | Binance + OKX | P0 | M | ✅ | backend |
| B-04 | 实时行情 | OKX 备源 (灾备) | OKX Public | P0 | S | ✅ | backend |
| B-05 | 实时行情 | 逐笔成交 Trades | Binance + OKX | P0 | S | 🟡 | backend |
| B-06 | 实时行情 | 合约 / 资金费率 (U 本位) | OKX / Bybit | P1 | M | ⬜ | quant |
| B-07 | 实时行情 | 多交易所统一 API | CCXT | P1 | M | ⬜ | backend |
| B-08 | 实时行情 | 现货 + 合约综合行情 | CCXT Pro | P2 | L | ⬜ | quant |
| B-09 | 实时行情 | 机构级深度数据 | Kaiko | P2 | L | ⬜ | quant |
| B-10 | 实时行情 | 跨交易所指数 | 自研 + CoinAPI | P2 | L | ⬜ | backend |
| **C. 链上数据 RPC** |
| C-01 | 链上 RPC | ETH 主网 RPC | Infura | P0 | S | ✅ | backend |
| C-02 | 链上 RPC | BSC RPC | Alchemy | P0 | S | ✅ | backend |
| C-03 | 链上 RPC | Polygon RPC | Infura | P0 | S | ✅ | backend |
| C-04 | 链上 RPC | Arbitrum RPC | Infura | P0 | S | ✅ | backend |
| C-05 | 链上 RPC | Solana RPC | QuickNode | P0 | S | ✅ | backend |
| C-06 | 链上 RPC | 多节点健康检查 + 自动切换 | 自研 | P0 | M | ✅ | backend |
| C-07 | 链上 RPC | 自建 ETH 归档节点 (Geth) | 自建 | P2 | XL | ⬜ | infra |
| C-08 | 链上 RPC | 自建 BTC 节点 (Bitcoin Core) | 自建 | P2 | XL | ⬜ | infra |
| C-09 | 链上 RPC | Tron RPC (TRC20 USDT) | TronGrid | P0 | M | 🟡 | backend |
| C-10 | 链上 RPC | 多链统一 SDK | web3.js / viem | P0 | M | 🟡 | backend |
| **D. 钱包与充值提现** |
| D-01 | 钱包 | ETH/BSC 余额查询 | Infura + Alchemy | P0 | S | ✅ | backend |
| D-02 | 钱包 | ERC20 代币余额 (USDT/USDC) | Infura | P0 | S | ✅ | backend |
| D-03 | 钱包 | 交易历史拉取 | Infura | P0 | M | ✅ | backend |
| D-04 | 钱包 | TRC20 USDT 余额 | TronGrid | P0 | M | 🟡 | backend |
| D-05 | 钱包 | 充值到账监听 (WebHook) | Alchemy Notify | P0 | L | ⬜ | backend |
| D-06 | 钱包 | 提现广播 + 跟踪 | Infura + Etherscan | P0 | L | ⬜ | backend |
| D-07 | 钱包 | 多链资产聚合 (Covalent) | Covalent | P1 | M | ⬜ | backend |
| D-08 | 钱包 | NFT 资产展示 | Moralis / Alchemy NFT | P1 | M | ⬜ | web3 |
| D-09 | 钱包 | 钱包地址校验 (BTC/ETH/TRX/SOL) | 自研 + BIP-39 | P0 | M | ✅ | backend |
| D-10 | 钱包 | Gas 价格预测 (EIP-1559) | Etherscan | P1 | S | ⬜ | backend |
| **E. 预言机与价格源** |
| E-01 | 预言机 | Chainlink 主流币价格 | Chainlink | P2 | M | ⬜ | defi |
| E-02 | 预言机 | Pyth 高频价格 | Pyth | P2 | M | ⬜ | defi |
| E-03 | 预言机 | RedStone 模块化价格 | RedStone | P3 | M | ⬜ | defi |
| E-04 | 价格源 | 自研 VWAP 指数 | 自研 | P2 | L | ⬜ | quant |
| **F. K线与图表** |
| F-01 | K线组件 | TradingView Lightweight Charts | TV OSS | P0 | M | ✅ | frontend |
| F-02 | K线组件 | 自研 K线聚合 (trades → kline) | 自研 | P0 | M | ✅ | backend |
| F-03 | K线组件 | KLineCharts (备选) | KLineCharts | P1 | M | ⬜ | frontend |
| F-04 | K线组件 | TradingView Pro (需授权) | TV Pro | P3 | L | ⬜ | frontend |
| F-05 | K线组件 | 后台 ECharts 看板 | ECharts | P1 | M | ⬜ | frontend |
| F-06 | K线组件 | 技术指标 (MA/MACD/RSI) | 自研 / TA-Lib | P1 | L | ⬜ | quant |
| **G. DeFi / Web3 行情** |
| G-01 | DeFi | DeFi 协议 TVL | DeFiLlama | P1 | S | ⬜ | defi |
| G-02 | DeFi | DEX 交易量 | DeFiLlama | P1 | S | ⬜ | defi |
| G-03 | DeFi | 稳定币数据 | DeFiLlama | P1 | S | ⬜ | defi |
| G-04 | DeFi | 自定义子图 (The Graph) | The Graph | P1 | L | ⬜ | defi |
| G-05 | DeFi | 跨链数据 (Dune) | Dune | P2 | L | ⬜ | analyst |
| G-06 | DeFi | 钱包画像 / 聪明钱 | Nansen | P3 | XL | ⬜ | quant |
| G-07 | 链上指标 | BTC/ETH 链上指标 | Glassnode | P2 | L | ⬜ | analyst |
| G-08 | 链上指标 | 链上数据 SQL | Bitquery | P2 | L | ⬜ | analyst |
| **H. 新闻 / 情绪 / 社交** |
| H-01 | 新闻 | 加密新闻聚合 | CryptoPanic | P1 | S | ⬜ | content |
| H-02 | 新闻 | 社交热度 | LunarCrush | P1 | S | ⬜ | content |
| H-03 | 新闻 | 项目研究 / 资料 | Messari | P2 | M | ⬜ | content |
| H-04 | 新闻 | 市场情绪指数 | 自研 | P2 | M | ⬜ | quant |
| **I. 法币汇率** |
| I-01 | 汇率 | USD/CNY/JPY/KRW/EUR | Open Exchange Rates | P1 | S | ⬜ | backend |
| I-02 | 汇率 | 汇率兜底 | ExchangeRate-API | P1 | S | ⬜ | backend |
| I-03 | 汇率 | 加密法币对 (USD/BTC 等) | CoinGecko | P0 | S | ✅ | backend |
| **J. KYC / 合规 / AML** |
| J-01 | KYC | 身份证 OCR + 人脸 | 旷视 / 阿里云 | P1 | L | ⬜ | compliance |
| J-02 | KYC | 活体检测 | 旷视 | P1 | L | ⬜ | compliance |
| J-03 | AML | 链上地址风险 (Chainalysis) | Chainalysis | P2 | XL | ⬜ | compliance |
| J-04 | AML | 制裁名单 OFAC | OpenSanctions | P1 | S | ⬜ | compliance |
| J-05 | KYC | 投资者适当性 (萨摩亚) | 自研 | P0 | M | ✅ | compliance |
| J-06 | 合规 | FATF Travel Rule | Sumsub / Notabene | P2 | L | ⬜ | compliance |
| **K. 支付 / 法币入金** |
| K-01 | 法币 | 银行卡支付 | Stripe / Adyen | P1 | L | ⬜ | finance |
| K-02 | 法币 | P2P / OTC 撮合 | 自研 | P1 | XL | ⬜ | finance |
| K-03 | 法币 | 第三方支付 (USDT 买币) | MoonPay / Banxa | P1 | L | ⬜ | finance |
| K-04 | 法币 | SWIFT 跨境 | Wise / 银行 | P2 | L | ⬜ | finance |
| K-05 | 法币 | 数字人民币 (试点) | 央行接口 | P3 | XL | ⬜ | finance |
| **L. 推送 / 通知 / 短信 / 邮件** |
| L-01 | 推送 | Firebase Cloud Messaging | FCM | P1 | S | ⬜ | mobile |
| L-02 | 推送 | Apple Push | APNs | P1 | S | ⬜ | mobile |
| L-03 | 推送 | 华为推送 | HMS | P1 | S | ⬜ | mobile |
| L-04 | 短信 | Twilio / 阿里云 | Twilio | P1 | S | ⬜ | backend |
| L-05 | 邮件 | SendGrid / 阿里云 | SendGrid | P1 | S | ⬜ | backend |
| L-06 | OTP | 邮箱 / 手机验证码 | 自建 + Twilio | P0 | M | ✅ | backend |
| **M. 监控 / 日志 / 告警** |
| M-01 | 监控 | Prometheus 指标采集 | 自建 | P0 | M | ✅ | infra |
| M-02 | 监控 | Grafana 看板 | 自建 | P0 | M | ✅ | infra |
| M-03 | 监控 | Loki 日志聚合 | 自建 | P0 | M | ✅ | infra |
| M-04 | 告警 | PagerDuty / 钉钉 | PagerDuty | P0 | S | ✅ | infra |
| M-05 | 监控 | API 延迟 / 失败率大盘 | 自研 + Grafana | P0 | M | ✅ | infra |
| M-06 | 监控 | 链上数据延迟告警 | 自研 | P0 | M | 🟡 | infra |
| M-07 | 监控 | 异常价格偏离告警 | 自研 | P0 | M | 🟡 | quant |
| **N. 撮合与风控（自有）** |
| N-01 | 撮合 | 现货撮合引擎 | 自研 | P0 | XL | ✅ | backend |
| N-02 | 撮合 | 订单簿管理 | 自研 | P0 | L | ✅ | backend |
| N-03 | 风控 | 限额 / 限速 | 自研 | P0 | M | ✅ | risk |
| N-04 | 风控 | AML 链上扫描 | Chainalysis + 自研 | P2 | L | ⬜ | risk |
| N-05 | 清算 | 资金结算 / 账本 | 自研 | P0 | L | ✅ | settlement |
| N-06 | 清算 | 提现审核工作流 | 自研 | P0 | M | ✅ | settlement |

### 3.2 任务数量统计

| 优先级 | 总数 | 已完成 | 进行中 | 未开始 |
|--------|------|--------|--------|--------|
| P0 紧急 | 41 | 22 | 5 | 14 |
| P1 内测 | 27 | 0 | 0 | 27 |
| P2 生产 | 14 | 0 | 0 | 14 |
| P3 演进 | 5 | 0 | 0 | 5 |
| **合计** | **87** | **22** | **5** | **60** |

---

## 第四章 · P0 紧急对接清单（影响演示）

> **截止时间**：2 周内（演示前必须完成）  
> **筛选原则**：演示中能直接看到，或影响核心交易链路的功能

### 4.1 P0 已完成 ✅

| # | 任务 | 验收 |
|---|------|------|
| ✅ N-01 | 现货撮合引擎 | 单测 ≥ 90%，撮合结果正确 |
| ✅ N-02 | 订单簿管理 | 深度图 / 盘口实时更新 |
| ✅ N-03 | 限额 / 限速 | 防止刷单 / 操纵 |
| ✅ N-05 | 资金结算 / 账本 | 借贷平衡 |
| ✅ A-01 | CoinGecko 币价 | 5 个币种对接成功 |
| ✅ A-02 | CoinGecko K线 | 1d / 1h 正常 |
| ✅ A-03 | CoinGecko Logo | 头像正常 |
| ✅ B-01 | Binance 24h Ticker | 10+ 交易对正常 |
| ✅ B-02 | Binance WebSocket | 心跳 + 重连 OK |
| ✅ B-03 | Binance 深度 | 盘口正常 |
| ✅ B-04 | OKX 备源 | 降级切换正常 |
| ✅ C-01~C-05 | 5 条链 RPC | 健康检查通过 |
| ✅ C-06 | 多节点自动切换 | 5xx 切换 OK |
| ✅ D-01 | ETH/BSC 余额 | 精度正确 |
| ✅ D-02 | ERC20 余额 | USDT/USDC 正常 |
| ✅ D-03 | 交易历史 | 拉取最近 20 条 |
| ✅ D-09 | 地址校验 | BTC/ETH/TRX/SOL 全通过 |
| ✅ F-01 | TradingView Lightweight | 渲染正常 |
| ✅ F-02 | 自研 K线聚合 | 1m/5m/15m/1h/4h/1d/1w |
| ✅ J-05 | 萨摩亚投资者适当性 | 5 题问卷 |
| ✅ L-06 | OTP 验证码 | 6 位数字 |
| ✅ M-01~M-05 | 监控告警 | Grafana 看板 |

### 4.2 P0 进行中 🟡（需 1 周内完成）

| # | 任务 | 阻塞点 | 计划 |
|---|------|--------|------|
| 🟡 B-05 | 逐笔成交 Trades | 需解析 Binance 增量帧 | 3 天 |
| 🟡 C-09 | TronGrid RPC | 中文文档解析 | 2 天 |
| 🟡 C-10 | 多链统一 SDK | web3.js 升级到 viem | 3 天 |
| 🟡 D-04 | TRC20 USDT 余额 | Tron 私链测试 | 2 天 |
| 🟡 M-06 | 链上延迟告警 | 阈值调优 | 1 天 |
| 🟡 M-07 | 异常价格告警 | 历史样本不足 | 1 天 |

### 4.3 P0 未开始 ⬜（2 周内必须完成）

| # | 任务 | 风险 | 措施 |
|---|------|------|------|
| D-05 | 充值到账监听 (Alchemy Notify) | Webhook 配置复杂 | 优先用轮询，Webhook 异步 |
| D-06 | 提现广播 + 跟踪 | 需要热钱包签名 | 安全审计后上线 |
| D-10 | Gas 价格预测 | Etherscan 限流 | 加缓存 + 兜底 |

---

## 第五章 · P1 内测期对接清单

> **截止时间**：第 3-6 周  
> **目标**：真实数据 + 7×24 稳定 + 移动端体验完善

### 5.1 P1 关键路径

```
Week 3  ━━▶ 短信 / 邮件 / 推送（F-04, F-05, F-01-03） 
Week 3  ━━▶ 银行卡支付（K-01, K-03）启动
Week 4  ━━▶ KYC OCR + 活体（J-01, J-02）联调
Week 4  ━━▶ DeFiLlama 接入（G-01, G-02, G-03）
Week 5  ━━▶ 法币汇率（I-01, I-02）+ 多币种资产
Week 5  ━━▶ K线技术指标（F-06）
Week 6  ━━▶ AML 制裁名单（J-04）
Week 6  ━━▶ P2P 撮合（K-02）灰度
```

---

## 第六章 · P2 正式生产对接清单

> **截止时间**：第 7-12 周  
> **目标**：机构级 + 多活容灾 + 合规审计

### 6.1 P2 关键路径

```
Week 7   ━━▶ Kaiko / CoinAPI 机构级行情（B-09, B-10）
Week 8   ━━▶ CCXT Pro 多交易所（B-08）
Week 9   ━━▶ Chainlink / Pyth 预言机（E-01, E-02）
Week 10  ━━▶ Dune / Glassnode 链上分析（G-05, G-07）
Week 11  ━━▶ AML Chainalysis（J-03, N-04）
Week 12  ━━▶ FATF Travel Rule（J-06）
Week 12  ━━▶ 自建 ETH 归档节点（C-07）+ BTC 节点（C-08）
```

---

## 第七章 · P3 长期演进清单

> **截止时间**：第 13 周+  
> **目标**：数据中台 + AI 增强 + Web3 深耕

| # | 任务 | 目标 |
|---|------|------|
| P3-01 | RedStone 模块化预言机 | DeFi 场景多 |
| P3-02 | TradingView Pro 授权 | Web 端专业图表 |
| P3-03 | Nansen 聪明钱追踪 | 跟单策略 |
| P3-04 | 自研市场情绪 AI | 首页情绪指数 |
| P3-05 | 数字人民币接入 | 试点 |

---

## 第八章 · 模块化任务卡

> 每张任务卡 = 一个 PR / 一个 Sprint Item  
> 格式：**目标** / **技术要求** / **验收标准** / **依赖** / **负责人**

### A. 行情聚合数据

#### A-01 ✅ CoinGecko 币价（已完成）

- **目标**：聚合 5-10 个主流币（BTC/ETH/BNB/SOL/XRP/ADA/DOGE/AVAX）的实时价格、24h 涨跌、市值。
- **技术要求**：
  - REST API：`GET /coins/markets?vs_currency=usd&ids=...`
  - 限流：10-30 req/min（免费版）
  - 缓存：Redis 60s TTL
  - 字段映射：CoinGecko → 内部 `Coin` model
- **验收标准**：
  - 5 个币种价格误差 < 0.1%
  - 24h 涨跌颜色与官方一致
  - 断网时自动 fallback 到 mock data
- **代码**：`src/lib/market/binance-adapter.ts`

#### A-04 ⬜ CoinMarketCap 元数据

- **目标**：补充长尾币（约 200+ 币种）的资料、Logo、合约地址
- **技术要求**：
  - REST API：`GET /v1/cryptocurrency/info`
  - API Key：Basic 计划（$29/月）
  - 限流：333 req/day
  - 缓存：PostgreSQL + Redis 24h TTL
- **验收标准**：
  - 200 个币种 Logo 正常显示
  - 合约地址可在区块浏览器打开
  - API Key 超限时降级到 CoinGecko
- **依赖**：A-01（共享 normalize 层）
- **预估工作量**：M（2-3 天）

#### A-06 ⬜ 多源价格中位数

- **目标**：综合 Binance + OKX + CoinGecko，计算加权中位数作为"指数价"
- **技术要求**：
  - 权重：流动性 60% + 波动率倒数 30% + 延迟 10%
  - 异常过滤：偏离中位数 > 3% 自动剔除
  - 至少 2 个源才输出，否则保留最近一次
- **验收标准**：
  - 主流币价格偏离 < 0.05%
  - 异常源自动隔离（5 分钟）
  - 输出符合"指数价"标准 JSON 契约
- **预估工作量**：M（3-5 天）

### B. 交易所实时行情

#### B-01 ✅ Binance 24h Ticker

- **目标**：拉取 100+ 交易对的 24h 行情
- **技术要求**：
  - REST：`GET /api/v3/ticker/24hr`
  - WebSocket：`!ticker@arr`（100ms 推送）
  - 限流：1200 req/min
- **验收标准**：见 [加密货币行情数据聚合商.md 第 322-355 行](./加密货币行情数据聚合商.md)
- **代码**：`src/lib/market/binance-client.ts`

#### B-05 🟡 逐笔成交 Trades

- **目标**：WebSocket 实时推送 BTC/USDT 等主流币的逐笔成交
- **技术要求**：
  - Binance WS：`btcusdt@trade`（每笔成交立即推送）
  - 字段：price, qty, time, isBuyerMaker
  - 限流：单连接 5 streams
- **验收标准**：
  - 100ms 内推送
  - 5 分钟测试无丢帧
  - 自研 K 线聚合成 1m/5m/15m/1h 正常
- **当前阻塞**：Binance 增量帧解析（partial book depth）
- **预估工作量**：S（1-2 天）

#### B-07 ⬜ CCXT 多交易所统一

- **目标**：用 CCXT 统一拉取 Binance + OKX + Bybit + Kraken 的 Ticker
- **技术要求**：
  - Node SDK：`ccxt` ≥ 4.0
  - 公共方法：`fetchTicker(symbol)` / `fetchOHLCV(symbol, timeframe)`
  - 限流：按交易所自动管理
- **验收标准**：
  - 4 个交易所代码量减少 50%
  - 切换交易所仅改 1 个参数
  - WebSocket 仍用各交易所原生（CCXT Pro 付费）
- **预估工作量**：M（2-3 天）

### C. 链上数据 RPC

#### C-01 ✅ Infura ETH RPC（已完成）

- **目标**：通过 Infura 访问 Ethereum 主网
- **技术要求**：
  - HTTPS：`https://mainnet.infura.io/v3/{KEY}`
  - WebSocket：`wss://mainnet.infura.io/ws/v3/{KEY}`
  - 限流：100K req/day（免费）
  - 方法：`eth_getBalance` / `eth_getTransactionCount` / `eth_call` / `eth_getLogs`
- **验收标准**：
  - 余额查询精度正确（BigInt 处理 wei）
  - 5xx / TIMEOUT 自动切换到 Alchemy
  - 健康检查端点 `/health/eth`
- **代码**：`src/lib/wallet/rpc-client.ts` + `src/lib/wallet/chain-service.ts`
- **测试**：`tests/wallet-rpc.test.ts`（33 个用例）

#### C-09 🟡 TronGrid RPC

- **目标**：通过 TronGrid 访问 Tron 主网，支持 TRC20 USDT 余额与转账监听
- **技术要求**：
  - HTTPS：`https://api.trongrid.io`
  - 方法：`/v1/accounts/{address}` / `/v1/accounts/{address}/transactions/trc20`
  - 限流：免费版 5 req/s
  - 字段：balance（sun → USDT 6 位）
- **验收标准**：
  - TRC20 USDT 余额误差 = 0
  - 转账监听 30s 内触发
  - 与 ETH/BSC 余额并列展示
- **当前阻塞**：中文文档解析
- **预估工作量**：M（2-3 天）

### D. 钱包与充值提现

#### D-05 ⬜ Alchemy Notify 充值到账监听

- **目标**：用户充值 USDT/ETH 到平台地址后，30s 内自动到账
- **技术要求**：
  - Alchemy Webhook：`Address Activity` 类型
  - 过滤条件：`to = 平台地址` 且 `value >= 最小金额`
  - 安全：HMAC-SHA256 签名校验
  - 重试：失败任务入队（BullMQ）
- **验收标准**：
  - 真实充值 30s 内入账
  - 重复入账防护（txHash 唯一索引）
  - 失败时人工审核工单
- **安全要求**：
  - Webhook 仅接受 Alchemy IP 段
  - 私钥管理走 HSM
- **预估工作量**：L（1 周）

#### D-06 ⬜ 提现广播 + 跟踪

- **目标**：用户发起提现 → 后台签名 → 广播到链上 → 跟踪确认数
- **技术要求**：
  - 热钱包签名（HSM / AWS KMS）
  - EIP-1559 gas 估算
  - 确认数：ETH 12 块 / BSC 15 块 / TRX 19 块
  - 失败回滚（nonce 用过但交易失败）
- **验收标准**：
  - 提现到账时间：ETH < 3min / BSC < 1min / TRX < 1min
  - 失败交易自动重试 1 次
  - 大额提现人工审核
- **安全要求**：
  - 冷热钱包分离（95% 冷钱包）
  - 多签（2/3 或 3/5）
  - 每日提现限额
- **预估工作量**：L（1-2 周）

### E. 预言机与价格源

#### E-01 ⬜ Chainlink 主流币价格

- **目标**：从 Chainlink 拉取 BTC/ETH/BNB 等的链上可信价格
- **技术要求**：
  - 合约地址（ETH Mainnet）：ETH/USD `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
  - 方法：`latestRoundData()` / `decimals()`
  - 多源 fallback：Chainlink 主，OKX 备
- **验收标准**：
  - 价格延迟 < 1 min
  - 偏离市场价 > 1% 触发告警
  - 清算场景价格精度 8 位
- **使用场景**：
  - 抵押借贷
  - 永续合约标记价
  - DeFi 仓位估值
- **预估工作量**：M（2-3 天）

### F. K线与图表

#### F-01 ✅ TradingView Lightweight Charts

- **目标**：在 H5 和 Flutter WebView 中渲染专业 K 线
- **技术要求**：
  - 版本：lightweight-charts ≥ 4.2
  - 主题：自定义深色（背景 #050B1A）
  - 周期：1m / 5m / 15m / 1h / 4h / 1d / 1w
  - 成交量副图
  - 十字光标 + 实时更新
- **验收标准**：
  - K 线 1s 内渲染完成
  - 切换周期无闪烁
  - 移动端触摸操作流畅
- **代码**：`src/components/home/TickerTapeLive.tsx` + `src/lib/market/kline.ts`

#### F-06 ⬜ 技术指标

- **目标**：在 K 线上叠加 MA / EMA / MACD / RSI / BOLL / KDJ
- **技术要求**：
  - 库：`technicalindicators` (NPM) 或自研 + TA-Lib WASM
  - 计算：客户端实时计算
  - 切换指标：右键菜单
  - 参数自定义：周期 / 颜色
- **验收标准**：
  - 6 个指标计算正确（用历史数据回测）
  - 性能：1w K 线 1000 根 渲染 < 500ms
  - 提示线显示当前值
- **预估工作量**：L（1 周）

### G. DeFi / Web3 行情

#### G-01 ⬜ DeFiLlama TVL

- **目标**：首页 Web3 板块展示 DeFi 协议 TVL 排名
- **技术要求**：
  - API：`https://api.llama.fi/protocols`
  - 限流：免费无限
  - 字段：name, tvl, chain, category, change_1d
  - 缓存：Redis 5 min TTL
- **验收标准**：
  - Top 20 协议展示
  - 涨跌幅色标注
  - 点击进入协议详情
- **预估工作量**：S（1 天）

### H. 新闻 / 情绪 / 社交

#### H-01 ⬜ CryptoPanic 新闻

- **目标**：首页和币种详情页展示加密新闻
- **技术要求**：
  - API：`https://cryptopanic.com/api/v1/posts/`
  - 限流：免费 200 req/h
  - 过滤：按币种 symbol 过滤
  - 缓存：PostgreSQL 30 min
- **验收标准**：
  - 每 30 min 拉取 1 次
  - 新闻标题 + 来源 + 时间 + 标签
  - 情绪标签（bullish/bearish/neutral）色标
- **预估工作量**：S（1-2 天）

### I. 法币汇率

#### I-01 ⬜ Open Exchange Rates

- **目标**：资产页支持 6 种法币（USD/CNY/JPY/KRW/EUR/BRL）切换
- **技术要求**：
  - API：`https://openexchangerates.org/api/latest.json`
  - API Key：免费 1000 req/月
  - 限流：1 req/h 拉取
  - 缓存：Redis 1 h TTL
- **验收标准**：
  - 6 种法币正常切换
  - 汇率误差 < 0.5%
  - 离线时显示最近一次
- **预估工作量**：S（1 天）

### J. KYC / 合规 / AML

#### J-01 ⬜ 身份证 OCR + 人脸

- **目标**：用户在 KYC 流程中上传身份证 + 人脸视频，完成实名认证
- **技术要求**：
  - 厂商：阿里云 / 旷视 FaceID
  - 模式：OCR 提取姓名 + 身份证号
  - 活体：静默 + 动作（眨眼/转头）
  - 加密：身份证号 AES-256 存储
- **验收标准**：
  - OCR 准确率 > 98%
  - 活体通过率 > 95% / 误识率 < 0.01%
  - 整体认证 3 min 内完成
- **合规要求**：
  - 用户签署授权书
  - 数据保留 5 年
- **预估工作量**：L（1-2 周）

### K. 支付 / 法币入金

#### K-03 ⬜ MoonPay / Banxa 第三方买币

- **目标**：用户用信用卡直接买 USDT/USDC 到平台
- **技术要求**：
  - 集成方式：iframe / 弹窗 / 重定向
  - 回调：成功 / 失败 / 取消 Webhook
  - KYC：复用内部 KYC
- **验收标准**：
  - Visa / Mastercard 支持
  - 50+ 国家可用
  - 平均到账 < 5 min
- **预估工作量**：L（1 周）

### L. 推送 / 通知

#### L-04 ⬜ Twilio 短信

- **目标**：注册 / 登录 / 提现 / 安全事件 短信通知
- **技术要求**：
  - 厂商：Twilio / 阿里云
  - 模板：审核通过（合规）
  - 限流：1 用户 1 分钟 1 条
- **验收标准**：
  - 国内 +86 + 国际号码
  - 发送成功率 > 99%
  - 失败重试 1 次
- **预估工作量**：S（1 天）

### M. 监控告警

#### M-05 ✅ API 延迟 / 失败率大盘

- **目标**：Grafana 实时展示所有 API 的 P50 / P99 / 失败率
- **技术要求**：
  - Prometheus 抓取：`histogram_quantile(0.99, ...)`
  - 告警：失败率 > 5% 持续 5 min 触发
  - 看板：Grafana JSON 模板
- **验收标准**：
  - 50+ API 指标
  - 看板每 30s 刷新
  - 钉钉 / 企微机器人告警
- **代码**：`infra/grafana/dashboards/api-overview.json`

### N. 撮合与风控（自有）

#### N-01 ✅ 现货撮合引擎

- **目标**：处理用户现货下单，按价格时间优先撮合
- **技术要求**：
  - 价格时间优先（FIFO）
  - 支持限价 / 市价 / 止损 / IOC / FOK
  - Decimal 精度（10 位小数）
  - 撮合吞吐量：≥ 5000 笔/秒
- **验收标准**：
  - 单元测试 ≥ 90%
  - 并发 100 用户无丢失
  - 撮合结果可回放
- **代码**：`src/lib/matching/engine.ts` + `orderbook.ts`
- **测试**：`tests/matching.test.ts`（已通过）

---

## 第九章 · 标准化数据契约

### 9.1 Ticker

```typescript
// src/lib/market/feed.ts
export interface Ticker {
  symbol: string;        // "BTC/USDT"
  base: string;          // "BTC"
  quote: string;         // "USDT"
  price: string;         // "104500.25"  // Decimal as string
  change24h: string;     // "2.35"       // 百分比
  high24h: string;       // "105200.00"
  low24h: string;        // "101800.00"
  volume24h: string;     // "28451.32"
  source: string;        // "binance" | "okx" | "coingecko"
  updatedAt: string;     // ISO 8601 UTC
}
```

### 9.2 Kline

```typescript
export interface Kline {
  symbol: string;        // "BTC/USDT"
  interval: KlineInterval; // "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
  openTime: number;      // 1780000000000
  open: string;          // "104000.00"
  high: string;          // "104600.00"
  low: string;           // "103900.00"
  close: string;         // "104500.00"
  volume: string;        // "125.42"
  closeTime: number;
  trades: number;
  source: string;
}
```

### 9.3 OrderBook

```typescript
export interface OrderBook {
  symbol: string;
  bids: [string, string][];  // [price, qty]
  asks: [string, string][];
  source: string;
  updatedAt: string;
}
```

### 9.4 链上余额

```typescript
export interface ChainBalance {
  chain: 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'solana' | 'tron';
  address: string;
  symbol: string;        // "USDT" | "ETH" | ...
  balance: string;       // "12450.67"
  decimals: number;
  contractAddress?: string;
  updatedAt: string;
}
```

---

## 第十章 · 异常处理与降级策略

### 10.1 故障分类与响应

| 故障类型 | 检测方式 | 响应策略 | 降级目标 |
|----------|----------|----------|----------|
| **网络断** | curl 健康检查 | 切到备源 | OKX / CCXT |
| **限流 429** | 响应头 X-RateLimit | 指数退避 60s | 缓存数据 |
| **5xx 错误** | HTTP 状态 | 切到备源 + 告警 | OKX / Alchemy |
| **价格偏离 > 3%** | 多源对比 | 剔除异常源 | 标记异常 |
| **维护公告** | 主动探测 | 提前 24h 切源 | CoinGecko |
| **数据格式变化** | Schema 校验失败 | 回滚到稳定版本 + 告警 | 上一版 SDK |
| **链重组 (Reorg)** | 多节点对比 | 等待 12 块确认 | 暂缓入账 |

### 10.2 降级路径（按优先级）

```
Binance 主源（健康）
  ↓ Binance 5xx
OKX 备源
  ↓ OKX 5xx
CCXT 备源
  ↓ CCXT 5xx
本地缓存（Redis）
  ↓ 缓存过期
Mock Data
```

### 10.3 告警级别

| 级别 | 触发 | 通知 | 响应 |
|------|------|------|------|
| **P0 紧急** | 撮合停摆 / 充值不到账 | 电话 + 短信 | 5 min 内 |
| **P1 高** | 主源全挂 | 钉钉 + 短信 | 30 min 内 |
| **P2 中** | 单一源挂 | 钉钉 | 4 h 内 |
| **P3 低** | 延迟偏高 | 邮件 | 24 h 内 |

---

## 第十一章 · 验收矩阵与门禁

### 11.1 任务验收 4 维度

每个任务必须通过以下 4 个维度才能"完成"：

| 维度 | 必达 | 评分 |
|------|------|------|
| **功能完整性 (30%)** | 全部验收标准 ✅ | S/A/B/C/D |
| **代码质量 (30%)** | 单测 ≥ 80% / 无 lint error / 无类型错误 | S/A/B/C/D |
| **技术合理性 (20%)** | 符合架构 / 可扩展 / 可观测 | S/A/B/C/D |
| **安全性 (20%)** | 无密钥泄露 / 权限最小 / 审计日志 | S/A/B/C/D |

### 11.2 总分 ≥ 80 + 单维度 ≥ 60 才能合并

### 11.3 各阶段准入准出门禁

| 阶段 | 准入 | 准出 |
|------|------|------|
| **P0 → 演示** | 任务卡全部创建 | P0 任务 100% 验收通过 |
| **P1 → 内测** | P0 100% | P1 任务 ≥ 80% + P0 稳定运行 1 周 |
| **P2 → 正式** | P1 ≥ 80% | P2 任务 ≥ 70% + 通过安全审计 |
| **P3 → 长期** | P2 100% | 业务方签字 |

---

## 第十二章 · 实施时间表

### 12.1 甘特图（文本版）

```
         W1   W2   W3   W4   W5   W6   W7   W8   W9   W10  W11  W12
P0       ████ ████
  Demo               ▼ 演示交付
P1            ░░░░ ░░░░ ░░░░ ░░░░
  Beta                                ▼ 内测发布
P2                          ▒▒▒▒ ▒▒▒▒ ▒▒▒▒ ▒▒▒▒ ▒▒▒▒
  Prod                                            ▼ 正式生产
P3                                              ▓▓▓▓ ▓▓▓▓ ▓▓▓▓
  Evolve                                                    ▼
```

### 12.2 里程碑

- **M1 - 演示就绪**（2 周内）：22 个 P0 任务全部 ✅
- **M2 - 内测发布**（6 周内）：41+27 = 68 任务 ≥ 80% 完成
- **M3 - 正式生产**（12 周内）：82 任务 ≥ 90% 完成 + 安全审计
- **M4 - 长期演进**（持续）：87 任务全完成 + AI 增强

---

## 第十三章 · 风险登记册

| # | 风险 | 等级 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|------|----------|
| R-01 | Binance 限流 429 | 中 | 高 | 中 | 加缓存 + OKX 备源 |
| R-02 | Infura 配额耗尽 | 中 | 中 | 高 | Alchemy 备源 + 监控告警 |
| R-03 | KYC 厂商宕机 | 高 | 低 | 高 | 双厂商 + 人工审核 |
| R-04 | 充值 Webhook 漏单 | 中 | 中 | 高 | 兜底轮询 + txHash 唯一索引 |
| R-05 | 链上 Reorg 重复入账 | 高 | 低 | 高 | 12 块确认 + 回滚机制 |
| R-06 | 短信 / 邮件被刷 | 高 | 中 | 中 | 频率限制 + 图形验证码 |
| R-07 | 第三方 API 收费超预算 | 中 | 中 | 中 | 用量监控 + 自动降级 |
| R-08 | 自建节点同步失败 | 中 | 中 | 高 | 归档节点 + 多供应商 |
| R-09 | MoonPay 合规拒绝 | 高 | 中 | 中 | 多通道 + 人工审核 |
| R-10 | 监管政策变化 | 高 | 中 | 极高 | 法务跟踪 + 灰度发布 |

---

## 附录 A · API Key 申请清单

| # | 服务 | 用途 | 计划 | 申请状态 | 备注 |
|---|------|------|------|----------|------|
| 1 | CoinGecko Demo | 行情聚合 | Free | ✅ | `CG-xxx` |
| 2 | CoinGecko Pro | 内测期 | $129/月 | ⬜ | 申请地址：coingecko.com/en/api/pricing |
| 3 | CoinMarketCap | 长尾币 | Basic $29/月 | ⬜ | 需实名 |
| 4 | CryptoCompare | 历史 K线 | $79/月 | ⬜ | |
| 5 | Infura | ETH RPC | Free → $50/月 | 🟡 | 已有 |
| 6 | Alchemy | BSC + Webhook | Free → $49/月 | 🟡 | 已有 |
| 7 | QuickNode | 多链 | $49/月 | ⬜ | |
| 8 | TronGrid | TRX | Free | ⬜ | |
| 9 | Etherscan | Gas + 查询 | Free | ⬜ | |
| 10 | TradingView Lightweight | K 线 | 开源 | ✅ | 无需 key |
| 11 | FCM | 推送 | Free | ⬜ | 需 Firebase 项目 |
| 12 | APNs | 推送 | Free | ⬜ | 需 Apple Developer |
| 13 | Twilio | 短信 | Pay-as-go | ⬜ | 需企业认证 |
| 14 | SendGrid | 邮件 | Free 100/天 | ⬜ | |
| 15 | Open Exchange Rates | 汇率 | Free 1000/月 | ⬜ | |
| 16 | CryptoPanic | 新闻 | $49/月 | ⬜ | |
| 17 | DeFiLlama | TVL | 开源免费 | ✅ | 无需 key |
| 18 | Chainlink | 预言机 | 主网免费 | ⬜ | |
| 19 | Kaiko | 机构数据 | 企业版 | ⬜ | 高门槛 |
| 20 | MoonPay | 法币入金 | 按交易 | ⬜ | 需商户申请 |

---

## 附录 B · 已落地模块索引

> 截至 2026-06-19，本路线图已完成的 P0 关键模块代码位置：

| 模块 | 文件 | 行数 | 测试 |
|------|------|------|------|
| **Binance REST 客户端** | [src/lib/market/binance-client.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/binance-client.ts) | ~450 | ✅ |
| **Binance WebSocket** | [src/lib/market/binance-client.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/binance-client.ts) | 同上 | ✅ |
| **Binance 适配器** | [src/lib/market/binance-adapter.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/binance-adapter.ts) | ~150 | ✅ |
| **网络探测** | [src/lib/market/binance-probe.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/binance-probe.ts) | ~100 | ✅ |
| **市场数据标准化** | [src/lib/market/feed.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/feed.ts) | ~120 | ✅ |
| **K线聚合器** | [src/lib/market/kline.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/kline.ts) | ~100 | ✅ |
| **市场模块入口** | [src/lib/market/index.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/market/index.ts) | ~50 | ✅ |
| **多链 RPC 客户端** | [src/lib/wallet/rpc-client.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/wallet/rpc-client.ts) | ~350 | ✅ 33 用例 |
| **EVM 链服务** | [src/lib/wallet/chain-service.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/wallet/chain-service.ts) | ~300 | ✅ |
| **钱包地址校验** | [src/lib/wallet/address.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/wallet/address.ts) | ~250 | ✅ |
| **钱包管理器** | [src/lib/wallet/manager.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/wallet/manager.ts) | ~150 | ✅ |
| **充值监听** | [src/lib/wallet/deposit.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/wallet/deposit.ts) | ~200 | ✅ |
| **现货撮合引擎** | [src/lib/matching/engine.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/matching/engine.ts) | ~400 | ✅ |
| **订单簿管理** | [src/lib/matching/orderbook.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/matching/orderbook.ts) | ~200 | ✅ |
| **资金结算** | [src/lib/settlement/settler.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/settlement/settler.ts) | ~250 | ✅ |
| **账本系统** | [src/lib/settlement/ledger.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/settlement/ledger.ts) | ~200 | ✅ |
| **风控引擎** | [src/lib/risk/engine.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/risk/engine.ts) | ~200 | ✅ |
| **AML 检测** | [src/lib/risk/aml.ts](file:///D:/3、系统项目开发/trae_projects/Stock%20Exchange%20dapp20260608-01/src/lib/risk/aml.ts) | ~150 | ✅ |
| **Flutter APP** | [C:\src\mobile_app\build\web](file:///C:/src/mobile_app/build/web) | 200 页 | ✅ 编译通过 |

---

## 文档维护

| 角色 | 职责 |
|------|------|
| **作者** | API 平台架构师 |
| **审核** | CTO + 业务负责人 |
| **更新频率** | 每周一上午 |
| **变更记录** | 在文档末尾追加 PR 号 + 日期 |
| **关联文档** | [加密货币行情数据聚合商](./加密货币行情数据聚合商.md) · [萨摩亚交易所开发施工标准](./萨摩亚交易所开发施工标准.md) |

---

> **一句话总结**：以 **P0 演示 → P1 内测 → P2 生产 → P3 演进** 4 阶段推进，共 **87 项 API 对接任务**（22 已完成 / 5 进行中 / 60 待启动），全部通过**自建 Market Data Service 中台**对外提供标准化数据，确保 App 不直连第三方，交易所跑得稳、演得好、合规达标。
