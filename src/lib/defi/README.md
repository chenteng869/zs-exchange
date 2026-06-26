# DeFiLlama 公共数据模块（P1 G-01 / G-02 / G-03）

本文档介绍 SMY 交易所的 DeFiLlama 数据接入层，包含 3 个独立可组合的子模块：

- **G-01 TVL 服务**（`tvl-service.ts`）— 协议 / 链 / 历史 TVL
- **G-02 DEX 交易量服务**（`dex-volume-service.ts`）— DEX 24h 交易量 / 历史
- **G-03 稳定币服务**（`stablecoin-service.ts`）— 市值 / 流通量 / 链分布 / peg 健康度

公共基座：
- **DeFiLlama 客户端**（`defillama-client.ts`）— 多端点 + 5 req/s 限流 + 5xx/TIMEOUT 重试 + 断网降级
- **统一导出**（`index.ts`）— 全部模块从 `@/lib/defi` 即可引入

---

## 1. 架构图

```
┌────────────────────────────────────────────────────────────────────────┐
│                       src/lib/defi/  (DeFi 模块)                       │
│                                                                        │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│   │  TvlService      │    │ DexVolumeService │    │StablecoinService │ │
│   │  (G-01)          │    │  (G-02)          │    │  (G-03)          │ │
│   │                  │    │                  │    │                  │ │
│   │ listProtocols    │    │ listDexes        │    │ listStablecoins  │ │
│   │ getProtocol      │    │ getDex           │    │ getStablecoin    │ │
│   │ getChainTvl      │    │ getTopByVolume   │    │ getTopByCircul.  │ │
│   │ getTopByTvl      │    │ getChainDexVol.  │    │ getPegHealth     │ │
│   │ searchProtocols  │    │ getDexVolHistory │    │ getTotalMktCap   │ │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘ │
│            │                       │                       │           │
│            └───────────┬───────────┴───────────┬───────────┘           │
│                        ▼                       ▼                       │
│            ┌───────────────────────────────────────────────┐           │
│            │   TtlCache (内存 LRU / TTL 1 ~ 5 min)         │           │
│            └─────────────────────┬─────────────────────────┘           │
│                                  ▼                                     │
│            ┌───────────────────────────────────────────────┐           │
│            │   DeFiLlamaClient  (多端点 / 限流 / 重试)      │           │
│            │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │           │
│            │  │ api.llama.fi│ │coins.llama  │ │  失败    │ │           │
│            │  │  (主源)     │ │  .fi (备源) │ │  降级    │ │           │
│            │  └──────┬──────┘ └──────┬──────┘ └────┬─────┘ │           │
│            └─────────┼───────────────┼─────────────┼───────┘           │
└──────────────────────┼───────────────┼─────────────┼───────────────────┘
                       ▼               ▼             ▼
              ┌─────────────────────────────────────────────┐
              │  DeFiLlama Public API  (https://api.llama.fi) │
              │  - /protocols, /protocol/{slug}              │
              │  - /v2/chains, /v2/historicalChainTvl         │
              │  - /overview/dexs, /overview/dexs/{slug}      │
              │  - /stablecoins, /stablecoin/{id}            │
              │  - /stablecoincharts/{id}                    │
              └─────────────────────────────────────────────┘
```

---

## 2. 快速调用示例

### 2.1 G-01 TVL 服务

```ts
import { TvlService } from '@/lib/defi';

const tvl = new TvlService();

// 全部协议
const list = await tvl.listProtocols();

// Top 20 协议（按 TVL 倒序）
const top = await tvl.getTopByTvl(20);

// 按类别过滤
const dexes = await tvl.getTopByTvl(20, 'Dexes');

// 单个协议详情（含按链分布 + 时间序列）
const lido = await tvl.getProtocol('lido');
// lido.currentChainTvls => { Ethereum: 31.8e9, ... }
// lido.tvlHistory      => [{ date: 1700000000000, tvl: 30000000000 }, ...]

// 模糊搜索
const found = await tvl.searchProtocols('eth');

// 链 TVL
const eth = await tvl.getChainTvl('Ethereum');
const allChains = await tvl.listChainTvls();

// 全局 TVL（所有链求和 + 加权 1d 变化）
const g = await tvl.getGlobalTvl();
// g.total     => 76090000000
// g.change_1d => 0.42
```

### 2.2 G-02 DEX 交易量服务

```ts
import { DexVolumeService } from '@/lib/defi';

const dex = new DexVolumeService();

// 全部 DEX
const list = await dex.listDexes();

// Top 20（按 24h 交易量）
const top = await dex.getTopByVolume(20);

// 按链过滤
const ethDexes = await dex.getTopByVolume(20, 'Ethereum');

// 单个 DEX 详情
const uni = await dex.getDex('uniswap-v3');
// uni.total24h      => 1.28e9
// uni.change_24h    => 5.4
// uni.volumeHistory => [{ date, volume }, ...]

// 全局 24h 交易量
const total = await dex.getDexVolume24h();
// total.total24h      => 3.5e9
// total.totalChange24h => 4.2
// total.breakdown     => Dex[]

// 链聚合
const ethVol = await dex.getChainDexVolume('Ethereum');
// ethVol.total24h => 1.5e9
```

### 2.3 G-03 稳定币服务

```ts
import { StablecoinService } from '@/lib/defi';

const stable = new StablecoinService();

// 全部稳定币
const list = await stable.listStablecoins();

// 按 peg 类型 Top 20
const usdTop = await stable.getTopByCirculating(20, 'USD');

// 单个稳定币详情
const usdt = await stable.getStablecoin('1');
// usdt.currentChainBalances => { Ethereum: 65e9, Tron: 28e9, ... }
// usdt.circulatingPools     => [{ pool: 'Curve 3pool', amount: 3.5e9 }, ...]
// usdt.history              => [{ date, circulating }, ...]

// 历史市值
const hist = await stable.getStablecoinCirculatingHistory('1', 30);

// 全局市值
const total = await stable.getTotalStablecoinMarketCap();
// total.total => 170e9
// total.change_7d => 0.42

// peg 健康度评估
const health = await stable.getPegHealth();
// health[i].health => 'healthy' | 'warning' | 'critical'
// 默认阈值：|deviation| >= 0.5% = warning, >= 1% = critical
```

### 2.4 自定义降级 mock

```ts
import { TvlService, type MockTvlData } from '@/lib/defi';

const myMock: MockTvlData = {
  protocols: [/* ... */],
  chainTvls: [/* ... */],
  globalTvl: { total: 1e9, change_1d: 0, updatedAt: Date.now() },
};

const tvl = new TvlService({ mockProvider: () => myMock });
```

### 2.5 共享 DeFiLlamaClient

```ts
import { createDefiLlamaClient, TvlService, DexVolumeService, StablecoinService } from '@/lib/defi';

const client = createDefiLlamaClient({ rateLimitPerSec: 5, maxRetries: 3 });
const tvl = new TvlService({ client });
const dex = new DexVolumeService({ client });
const stable = new StablecoinService({ client });
```

---

## 3. 缓存策略

| 模块                | TTL            | 说明                                  |
|--------------------|----------------|---------------------------------------|
| `TvlService`        | 5 min（默认）  | `TVL_CACHE_TTL_MS = 5 * 60_000`       |
| `DexVolumeService`  | 1 min（默认）  | `DEX_VOLUME_CACHE_TTL_MS = 60_000`    |
| `StablecoinService` | 5 min（默认）  | `STABLE_CACHE_TTL_MS = 5 * 60_000`    |

- 内存 LRU 缓存（`TtlCache`），key 为 `protocols:all` / `protocol:{slug}` / `chains:all` / `dexes:all` 等。
- 可通过 `cacheTtlMs: 0` 关闭缓存。
- 可通过 `svc.clearCache()` 主动清空。
- 生产环境建议接入 Redis，将 5 min 缓存下沉到 Redis，进程内只做短期回源保护。

```ts
// Redis 5 min TTL（参考实现）
const REDIS_TTL_SEC = 5 * 60;
const cached = await redis.get(`defillama:protocols:all`);
if (cached) return JSON.parse(cached);
const data = await tvl.listProtocols();
await redis.set(`defillama:protocols:all`, JSON.stringify(data), 'EX', REDIS_TTL_SEC);
```

---

## 4. 降级策略

| 故障场景      | 行为                                                         |
|--------------|--------------------------------------------------------------|
| 4xx          | 立即抛出 `DefiLlamaError`（不重试）                          |
| 5xx          | 指数退避重试最多 3 次                                         |
| TIMEOUT      | 退避重试，超过 `timeoutMs` 视为失败                           |
| 全部端点失败  | 抛 `ALL_ENDPOINTS_FAILED`，服务层捕获后返回内置 mock 数据     |
| 关闭降级     | `enableFallback: false` → 返回空数组，调用方需自行处理        |

降级 mock 数据**合理非全 0**：
- TVL mock：Lido 32.45B、Aave 12.35B、Uniswap 6.8B 等
- DEX mock：Uniswap V3 1.28B、PancakeSwap 0.85B、Hyperliquid 1.12B 等
- Stable mock：USDT 118.5B、USDC 35.4B、DAI 5.35B、WBTC 8.5B 等

可监听 `client.on('error', ...)` 收集降级告警：

```ts
const client = createDefiLlamaClient();
client.on('error', ({ op, err }) => {
  logger.warn(`DeFiLlama fallback op=${op}`, { err: err.message });
});
```

---

## 5. 与首页 / Web3 板块的集成

### 5.1 首页 DeFi 行情（Web3 板块）

```tsx
// src/app/web3/defi/page.tsx
import { TvlService, DexVolumeService, StablecoinService } from '@/lib/defi';

export default async function DefiPage() {
  const tvl = new TvlService();
  const dex = new DexVolumeService();
  const stable = new StablecoinService();

  const [topProtocols, topDexes, pegHealth] = await Promise.all([
    tvl.getTopByTvl(10),
    dex.getTopByVolume(10),
    stable.getPegHealth(),
  ]);

  return (
    <div>
      <h2>DeFi 行情</h2>
      <ProtocolTable items={topProtocols} />
      <DexTable items={topDexes} />
      <PegHealthList items={pegHealth.filter(p => p.health !== 'healthy')} />
    </div>
  );
}
```

### 5.2 API 路由

```ts
// src/app/api/defi/tvl/route.ts
import { TvlService } from '@/lib/defi';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const tvl = new TvlService();
  const data = await tvl.getTopByTvl(limit, category);
  return NextResponse.json({ ok: true, data });
}
```

### 5.3 周期性刷新（cron / scheduler）

```ts
// scripts/refresh-defi-cache.ts
import { TvlService, DexVolumeService, StablecoinService } from '@/lib/defi';

async function refreshAll() {
  const tvl = new TvlService();
  const dex = new DexVolumeService();
  const stable = new StablecoinService();

  await Promise.all([
    tvl.listProtocols(),
    tvl.listChainTvls(),
    tvl.getGlobalTvl(),
    dex.listDexes(),
    dex.getAllChainDexVolume(),
    stable.listStablecoins(),
    stable.getTotalStablecoinMarketCap(),
    stable.getPegHealth(),
  ]);
  console.log('DeFi cache refreshed at', new Date().toISOString());
}

// 配合 node-cron 每 5 分钟执行一次
```

---

## 6. 关键常量

```ts
import {
  TVL_CACHE_TTL_MS,         // 5 * 60_000
  DEX_VOLUME_CACHE_TTL_MS,  // 60_000
  STABLE_CACHE_TTL_MS,      // 5 * 60_000
  DEFILLAMA_RATE_LIMIT_PER_SEC,  // 5
  DEFILLAMA_API_BASE,       // 'https://api.llama.fi'
  DEFILLAMA_COINS_BASE,     // 'https://coins.llama.fi'
  PEG_HEALTH_WARNING_THRESHOLD,  // 0.005 (0.5%)
  PEG_HEALTH_CRITICAL_THRESHOLD, // 0.01  (1%)
} from '@/lib/defi';
```

---

## 7. 错误码

| 错误码                  | 含义                                   |
|------------------------|----------------------------------------|
| `NO_FETCH`              | 环境中没有 fetch 实现                   |
| `HTTP_4xx`              | 4xx 响应（不重试）                      |
| `HTTP_5xx`              | 5xx 响应（重试 3 次）                   |
| `TIMEOUT`               | 请求超时                                |
| `NETWORK`               | 网络层错误（DNS / TCP 等）              |
| `PARSE_ERROR`           | 响应非 JSON                             |
| `ALL_ENDPOINTS_FAILED`  | 所有端点都失败，已降级或向上抛出         |

---

## 8. 测试

```bash
npx tsx --test tests/defillama.test.ts
```

覆盖 45 个用例（远超 15 个要求）：
- 客户端：限流 / 4xx / 5xx / TIMEOUT / probe / 默认端点
- G-01 TVL：list / get / history / chain / top / search / global / 缓存 / 降级
- G-02 DEX：list / get / volume24h / top / chain / 缓存 / 降级
- G-03 Stable：list / get / history / top / pegType / pegHealth / total / 降级
- 集成：限流 5 req/s 降速、TTL=0 关闭缓存
