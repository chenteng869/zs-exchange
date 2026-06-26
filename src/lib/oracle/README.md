# SMY 交易所 — Chainlink 预言机模块

> 任务 P2 · 链上价格预言机（Chainlink Price Feed）集成
> 工作目录：`src/lib/oracle/`

---

## 1. 背景

DeFi / 衍生品 / 资产估值等业务场景需要可靠的价格源。Chainlink 是去中心化预言机网络（DON）的行业标准：

- **覆盖 7+ 链**：Ethereum / BSC / Polygon / Arbitrum / Optimism / Avalanche / Base
- **价格聚合自 7+ 独立数据源**（CoinGecko、Kraken、Binance 等）
- **链上可信**：所有数据存储在 `AggregatorV3Interface` 合约，公开可验证
- **心跳保护**：超过 `heartbeat` 仍不更新 → 视为 stale

---

## 2. 架构

```
┌───────────────────────────────────────────────────────────────┐
│                    OracleService  (业务层)                     │
│   - 30s 内存缓存                                                │
│   - 资产估值（USD / CNY / EUR / JPY）                            │
│   - 订阅推送 (subscribePriceUpdates)                            │
│   - 异常告警 (onPriceAnomaly)                                   │
│   - 健康度报告 (getStalenessReport)                             │
└─────────────────────────┬─────────────────────────────────────┘
                          │
        ┌─────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐
│ PriceAggregator  │               │ ChainlinkClient  │
│ - 多链聚合        │               │ - eth_call       │
│ - 中位数 / 异常    │               │ - ABI 解码       │
│ - confidence     │               │ - 历史轮次        │
│ - 价格对比        │               │ - 多链 RPC 切换   │
└────────┬─────────┘               └────────┬─────────┘
         │                                  │
         └────────────┬─────────────────────┘
                      ▼
              ┌──────────────────┐
              │  feed-registry   │
              │  50+ PriceFeed   │
              │  7+ chains       │
              └──────────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │  复用: RpcClient /       │
         │  EvmChainService (wallet)│
         └──────────────────────────┘
                      │
                      ▼
       ┌──────────────────────────────────┐
       │  Chainlink AggregatorV3 合约      │
       │  7+ 链 EVM 节点                   │
       └──────────────────────────────────┘
```

### 2.1 层次职责

| 层级 | 文件 | 职责 |
|------|------|------|
| **types** | `chainlink/types.ts` | 类型 + 常量 + ABI selector |
| **registry** | `chainlink/feed-registry.ts` | 50+ 主流 PriceFeed 静态表 |
| **client** | `chainlink/chainlink-client.ts` | 链上读取（eth_call）+ 多链 RPC 切换 |
| **aggregator** | `chainlink/aggregator.ts` | 多源聚合（median / outlier / confidence） |
| **service** | `oracle-service.ts` | 业务封装（缓存 / 订阅 / 估值 / 告警） |
| **index** | `index.ts` | 统一导出 |

---

## 3. Chainlink 介绍

**Chainlink Price Feed** 是去中心化预言机网络（DON）发布的价格合约：

- 每个 feed 是一个 Solidity 合约，地址公开（[data.chain.link](https://data.chain.link/)）
- 数据源是 7+ 独立节点运营商 + 7+ 交易所 / 数据聚合商
- 数据通过链上交易更新（gas 由 Chainlink 节点支付）
- 失败 / 偏离超阈值 → 暂停更新（可通过 `latestRoundData.updatedAt` 检测）

### 3.1 AggregatorV3Interface ABI

```solidity
function latestRoundData() external view returns (
    uint80 roundId,        // 轮次 ID
    int256 answer,         // 价格（已按 decimals 放大）
    uint256 startedAt,     // 轮次开始时间
    uint256 updatedAt,     // 最后更新时间
    uint80 answeredInRound // 实际回答的轮次
);
function getRoundData(uint80 roundId) external view returns (...);
function decimals() external view returns (uint8);
function description() external view returns (string memory);
```

### 3.2 ABI 选择器

| 函数 | selector |
|------|----------|
| `latestRoundData()` | `0xfeaf968c` |
| `getRoundData(uint80)` | `0x9a6fc8f5` |
| `decimals()` | `0x313ce567` |
| `description()` | `0x7284e416` |

---

## 4. 50+ 主流 Feed 列表（节选）

| Pair | Chain | Decimals | Heartbeat | 描述 |
|------|-------|----------|-----------|------|
| ETH/USD | ethereum | 8 | 1h | 以太坊 / 美元 |
| BTC/USD | ethereum | 8 | 1h | 比特币 / 美元 |
| USDC/USD | ethereum | 8 | 24h | USD Coin / 美元 |
| USDT/USD | ethereum | 8 | 24h | Tether / 美元 |
| DAI/USD | ethereum | 8 | 24h | DAI / 美元 |
| LINK/USD | ethereum | 8 | 1h | Chainlink / 美元 |
| UNI/USD | ethereum | 8 | 1h | Uniswap / 美元 |
| AAVE/USD | ethereum | 8 | 1h | Aave / 美元 |
| SOL/USD | ethereum | 8 | 1m | Solana / 美元 |
| AVAX/USD | ethereum | 8 | 1h | Avalanche / 美元 |
| DOGE/USD | ethereum | 8 | 1h | Dogecoin / 美元 |
| XAU/USD | ethereum | 8 | 1h | 黄金 / 美元 |
| XAG/USD | ethereum | 8 | 1h | 白银 / 美元 |
| EUR/USD | ethereum | 8 | 24h | 欧元 / 美元 |
| JPY/USD | ethereum | 8 | 24h | 日元 / 美元 |
| ... | ... | ... | ... | 共 53+ feeds |

> 完整列表见 `src/lib/oracle/chainlink/feed-registry.ts` 的 `PRICE_FEEDS` 数组。

---

## 5. 多链支持矩阵

| 链 | ETH | BNB | MATIC | ARB | OP | AVAX | Base |
|---|---|---|---|---|---|---|---|
| ETH/USD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BTC/USD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| USDC/USD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| USDT/USD | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| DAI/USD | ✓ | ✓ | ✓ | - | - | - | - |
| LINK/USD | ✓ | - | - | ✓ | ✓ | - | - |
| AAVE/USD | ✓ | - | ✓ | - | - | - | - |
| 原生币 | - | BNB | MATIC | ARB | OP | AVAX | - |

> `-` 表示该链官方未发布该交易对 feed。
> `cbETH` 仅 Base 链提供。

---

## 6. 完整调用示例

### 6.1 单价格查询

```ts
import { createOracleService } from '@/lib/oracle';

const oracle = createOracleService({
  apiKeys: { ethereum: process.env.INFURA_API_KEY },
});
oracle.start();

const eth = await oracle.getPrice('ETH/USD');
console.log(`ETH = $${eth.formatted} (age=${eth.age}s, source=${eth.source})`);

// 指定链
const ethBnb = await oracle.getPrice('ETH/USD', 'bsc');
```

### 6.2 多价格并行

```ts
const prices = await oracle.getPrices(['ETH/USD', 'BTC/USD', 'LINK/USD']);
for (const [pair, data] of Object.entries(prices)) {
  console.log(`${pair} = $${data.formatted}`);
}
```

### 6.3 多链聚合（高可信）

```ts
import { createPriceAggregator } from '@/lib/oracle';

const agg = createPriceAggregator();
const trusted = await agg.getTrustedPrice('ETH/USD');
console.log(`Trusted ETH = $${trusted?.price} (confidence=${trusted?.confidence})`);

// 自定义链
const custom = await agg.aggregatePrice('ETH/USD', ['ethereum', 'bsc', 'polygon']);
console.log({
  median: custom.median,
  mean: custom.mean,
  min: custom.min,
  max: custom.max,
  deviation: custom.deviation, // 0 ~ 1
  sources: custom.sources.length,
});
```

### 6.4 资产估值

```ts
// 1.5 ETH = 多少 USD / CNY / EUR / JPY？
const v1 = await oracle.getAssetValuation('ETH', '1.5', 'USD');
const v2 = await oracle.getAssetValuation('ETH', '1.5', 'CNY');
const v3 = await oracle.getAssetValuation('ETH', '1.5', 'EUR');
const v4 = await oracle.getAssetValuation('ETH', '1.5', 'JPY');
```

### 6.5 价格对比（本地 vs 链上）

```ts
const agg = createPriceAggregator();
const localPrice = '3520.50'; // CEX 撮合价
const onchain = await oracle.getPrice('ETH/USD');
const result = agg.comparePrices(localPrice, onchain.formatted, 'ETH/USD');
if (!result.isReasonable) {
  console.warn(`Price deviation ${(result.deviation * 100).toFixed(2)}% — investigation needed`);
}
```

### 6.6 历史价格回溯

```ts
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;
const ethFeed = getFeedByPair('ETH/USD', 'ethereum');
const history = await oracle.getClient().getHistoricalPrices(
  ethFeed!,
  oneDayAgo,
  now,
  3600, // 每 1 小时一个点
);
for (const round of history) {
  console.log(new Date(round.updatedAt * 1000), round.formatted);
}
```

### 6.7 实时订阅

```ts
const unsubscribe = oracle.subscribePriceUpdates(
  'ETH/USD',
  (data) => {
    console.log(`ETH update: $${data.formatted} (age=${data.age}s)`);
  },
  30_000, // 30s 轮询
);

// 业务不再需要时取消
setTimeout(unsubscribe, 600_000);
```

### 6.8 异常告警

```ts
const off = oracle.onPriceAnomaly((event) => {
  if (event.type === 'stale') {
    console.warn(`[STALE] ${event.pair} age=${event.context.age}s`);
  } else if (event.type === 'deviation') {
    console.warn(`[DEVIATION] ${event.pair} ${event.context.expected} vs ${event.context.actual}`);
  }
});
```

### 6.9 健康度报告

```ts
// 拉一批价格，让缓存里有数据
await oracle.getPrices(['ETH/USD', 'BTC/USD', 'USDC/USD']);
const report = oracle.getStalenessReport();
for (const r of report) {
  console.log(`${r.pair} (${r.chain}): age=${r.age}s, stale=${r.isStale}`);
}
```

---

## 7. 数据验证（多链交叉）

```ts
import { createPriceAggregator } from '@/lib/oracle';

const agg = createPriceAggregator();

// 跨 4 链查 ETH
const result = await agg.aggregatePrice('ETH/USD', ['ethereum', 'bsc', 'polygon', 'arbitrum']);
if (result.deviation > 0.02) {
  // 偏离 > 2% → 报警（可能是某链节点故障 / 数据被操纵）
  await alertSlack(`ETH price deviation: ${(result.deviation * 100).toFixed(2)}%`);
}
const price = result.median; // 用中位数（抗异常）
```

---

## 8. 异常告警

| 类型 | 触发条件 | 严重度 |
|------|----------|--------|
| `stale` | `age > heartbeat × 2` | 警告 |
| `deviation` | `source === 'fallback'`（降级到 mock） | 警告 |
| `outlier` | 聚合时被剔除（> 5% 偏离 median） | 信息 |
| `subscription_error` | 轮询 RPC 失败 | 警告 |

---

## 9. 资产估值用法

```ts
// 1. 给定资产 + 数量 + 目标法币，返回估值
const v = await oracle.getAssetValuation('BTC', '0.5', 'CNY');
console.log(`0.5 BTC ≈ ¥${v.value} (rate: 1 USD = ${v.fiatRate} CNY)`);

// 2. 批量估值（如账户总资产）
const positions = [
  { asset: 'BTC', amount: '0.5' },
  { asset: 'ETH', amount: '10' },
  { asset: 'USDC', amount: '5000' },
];
let totalUsd = 0;
for (const p of positions) {
  const v = await oracle.getAssetValuation(p.asset, p.amount, 'USD');
  totalUsd += parseFloat(v.value);
}
console.log(`Total ≈ $${totalUsd.toFixed(2)}`);
```

---

## 10. 与现有 chain-service 集成

预言机模块与 `src/lib/wallet/chain-service.ts` 完全解耦，但复用其底层能力：

- `ChainlinkClient` 内部为 ETH/BSC 维护 `EvmChainService` 实例，复用：
  - 公共 RPC 端点（`ETH_PUBLIC_RPCS` / `BSC_PUBLIC_RPCS`）
  - 演示降级（`fallbackToDemo`）
  - 健康检查
- 业务层可以共用一个 `OracleService` + `ChainRegistry`：

```ts
import { createDefaultRegistry } from '@/lib/wallet';
import { createOracleService } from '@/lib/oracle';

const registry = createDefaultRegistry({ autoStart: true });
const oracle = createOracleService();
oracle.start();

// 查询某钱包 USD 估值
async function getWalletUsdValue(address: string) {
  const balances = await registry.getBalances(address, [
    { chain: 'ETH' }, { chain: 'BSC' },
  ]);
  let total = 0;
  for (const b of balances) {
    const v = await oracle.getAssetValuation(b.symbol, b.balance, 'USD');
    total += parseFloat(v.value);
  }
  return total;
}
```

---

## 11. 关键常量

```ts
ORACLE_CACHE_TTL_MS = 30_000;           // 30s 缓存
ORACLE_STALE_THRESHOLD_FACTOR = 2;      // 2 × heartbeat 即 stale
ORACLE_DEVIATION_THRESHOLD = 0.05;      // 5% 偏离报警
ORACLE_RPC_BATCH_SIZE = 10;              // 每批最多 10 个查询
```

---

## 12. 测试

```bash
npx tsx --test tests/chainlink.test.ts
```

测试覆盖：feed 查询、ABI 解码、价格换算、历史轮次、stale 检测、多链聚合、中位数、异常剔除、价格对比、缓存、并行查询、资产估值、异常告警、stale 报告、订阅推送、工厂函数、常量、降级。

> 详细测试矩阵见 `tests/chainlink.test.ts`。

---

## 13. 限制与未来工作

- **archive node**：历史价格回溯依赖支持 archive query 的节点（Alchemy / Infura），公共端点可能返回不到非常老的轮次
- **法币汇率**：USD → CNY / EUR / JPY 使用静态演示值，生产应接入 ECB / 央行 API
- **WebSocket**：当前只支持轮询。Chainlink 在某些链上提供 `PriceEvents` event，可通过 `eth_subscribe` 推送
- **更多链**：未来可加 Solana（Chainlink Pyth）、Cosmos IBC 等
