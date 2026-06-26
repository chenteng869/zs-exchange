# Kaiko 机构级行情集成 (P2 Kaiko)

> SMY 交易所 / 数字资产交易平台的机构级行情数据源
>
> 用于：合约标的价 / 资产估值 / 历史回测 / 风控基准

---

## 1. 架构

```
+------------------------------------------------------------+
|                    KaikoService (业务层)                    |
|  getBestPrice / getIndexPrice / getHistoricalData / ...     |
+----------------------------+-------------------------------+
                             |
       +---------------------+----------------------+
       |                                            |
+------v-------+                            +-------v------+
| KaikoClient  |  <------ HTTP REST ------> |  Kaiko API   |
|  (REST)      |  - Multi-region failover  |  US / EU / AP |
|              |  - Rate-limit 90 req/min  |              |
|              |  - 5xx retry backoff      |              |
|              |  - TTL cache              |              |
+------+-------+  - Mock fallback           +--------------+
       |
       |                                    +--------------+
+------v-------+  <------ WebSocket ------> |  Kaiko WS    |
|  WS Client   |  - Auto-reconnect         |  Real-time   |
|              |  - Multiplex subscribe    |              |
|              |  - Mock fallback          |              |
+------+-------+                            +--------------+
       |
       v
+------------------------------------------------------------+
| 业务输出：BBO / Index / VWAP / TWAP / OHLCV / FX / Trades  |
+------------------------------------------------------------+
```

## 2. Kaiko 申请 + API Key

1. 访问 https://www.kaiko.com/
2. 注册企业账号（机构级 KYC）
3. 选择 Pro 套餐（100 req/min，Tier 1 数据）
4. 在 Dashboard → API Keys 创建 **Market Data API Key**
5. 妥善保存（仅显示一次）

环境变量：

```bash
# .env.local
KAIKO_API_KEY=kk_live_xxxxxxxxxxxxxxxxxxxxxxxx
KAIKO_REGION=us           # us | eu | ap | global
```

> 演示 / 测试：使用 `mock` 关键字的 API Key 会自动启用 mock 模式（无需网络）
> ```ts
> const client = new KaikoClient({ apiKey: 'mock-key' });
> ```

## 3. 区域选择

| 区域 | 端点 | 适用 |
| --- | --- | --- |
| US | `https://us.market-api.kaiko.io` | 北美 / 拉美客户 |
| EU | `https://eu.market-api.kaiko.io` | 欧洲（GDPR 合规） |
| AP | `https://ap.market-api.kaiko.io` | 亚太 |
| Global | `https://market-api.kaiko.io` | 全球（默认回退） |

客户端默认 **US**，自动按 `US → EU → Global` 降级。

## 4. 完整调用示例

### 4.1 REST 客户端

```ts
import { KaikoClient } from '@/lib/market/kaiko';

const client = new KaikoClient({
  apiKey: process.env.KAIKO_API_KEY!,
  region: 'us',
});

// 资产列表
const assets = await client.getAssets('crypto');

// 交易所列表
const exchanges = await client.getExchanges();

// 单交易所 ticker
const ticker = await client.getTicker('cbse', 'btc-usd');

// 历史 OHLCV（10 年 BTC）
const ohlcv = await client.getOHLCV({
  exchange: 'cbse',
  pair: 'btc-usd',
  interval: '1d',
  startTime: Date.now() - 365 * 24 * 60 * 60_000, // 1 年
  limit: 365,
});

// VWAP
const vwap = await client.getVWAP({ pair: 'btc-usd', window: '1h' });

// 法币参考价
const fx = await client.getFXRate('usd', 'cny'); // 7.18

// 市值
const mcap = await client.getMarketCap('btc');

// 盘口
const ob = await client.getOrderBook('cbse', 'btc-usd', 20);

// 成交
const trades = await client.getTrades({
  exchange: 'cbse',
  pair: 'btc-usd',
  startTime: Date.now() - 60_000,
  limit: 100,
});
```

### 4.2 WebSocket 客户端

```ts
import { KaikoWebSocketClient } from '@/lib/market/kaiko';

const ws = new KaikoWebSocketClient({ apiKey: process.env.KAIKO_API_KEY! });
ws.connect();

// 订阅逐笔成交
const unsubTrades = ws.subscribe('trades.cbse.btc-usd', (msg) => {
  console.log('trade:', msg.data);
});

// 订阅盘口
const unsubOb = ws.subscribe('orderbook.cbse.btc-usd', (msg) => {
  console.log('orderbook:', msg.data);
});

// 订阅价格
ws.subscribe('price.cbse.btc-usd', (msg) => {
  console.log('price:', msg.data);
});

// 订阅跨交易所聚合价
ws.subscribe('price.aggregated.btc-usd', (msg) => {
  console.log('aggregated:', msg.data);
});

// 主动断开
// unsubTrades();
// unsubOb();
// ws.disconnect();
```

### 4.3 业务层

```ts
import { KaikoService } from '@/lib/market/kaiko';

const svc = new KaikoService({
  apiKey: process.env.KAIKO_API_KEY!,
  bboExchanges: ['cbse', 'bnce', 'krkn', 'binc', 'okex', 'huob'],
});

// 跨交易所最优买价
const best = await svc.getBestPrice('btc-usd', 'buy');
// { price: '67051.0', source: 'kaiko-aggregated', side: 'buy', exchanges: ['cbse'], ... }

// 指数价（VWAP 聚合 6 家交易所）
const index = await svc.getIndexPrice('btc-usd');
// { pair: 'btc-usd', price: '67050.1234', source: 'vwap', exchangeCount: 6, exchanges: [...] }

// 历史数据（自动分页）
const hist = await svc.getHistoricalData('btc-usd', '1d', 365); // 1 年

// 法币转换
const rate = await svc.getReferenceFX('usd', 'cny');

// 数据质量校验
const validation = svc.validateTicker(bestTicker);
// { valid: true, issues: [] }
```

## 5. 限流规则

| 套餐 | 限制 | 客户端配置 |
| --- | --- | --- |
| Free | 30 req/min | 25 req/min |
| Pro | 100 req/min | **90 req/min**（默认，留 buffer） |
| Enterprise | 自定义 | 联系销售 |

限流通过 `KaikoRateLimiter`（滑动窗口 60s）实现，触发后自动 sleep。

## 6. 缓存策略

| 数据类型 | TTL | 理由 |
| --- | --- | --- |
| Ticker | **5s** | 价格变化快，缓存不能太长 |
| OHLCV | **1h** | 历史数据稳定 |
| VWAP | **1h** | 计算结果稳定 |
| FX | **1min** | 汇率变化中等 |
| 市值 | **1h** | 几乎不变 |
| OrderBook | **5s** | 同 ticker |
| Trades | **5s** | 同 ticker |

调用 `clearCache()` 可手动清空。

## 7. 与 Binance 数据源融合

```ts
import { KaikoService } from '@/lib/market/kaiko/kaiko-service';
import { BinanceRestClient } from '@/lib/market/binance-client';

const kaiko = new KaikoService({ apiKey: KAIKO_KEY });
const binance = new BinanceRestClient();

async function getInstitutionalPrice(symbol: string) {
  const [kaikoIndex, binanceTicker] = await Promise.all([
    kaiko.getIndexPrice(symbol).catch(() => null),
    binance.get24hTicker(symbol).catch(() => null),
  ]);

  // 主用 Kaiko（VWAP 跨交易所聚合）
  if (kaikoIndex) return { source: 'kaiko', price: kaikoIndex.price };

  // 降级到 Binance（单交易所）
  if (binanceTicker) return { source: 'binance', price: binanceTicker.lastPrice };

  return null;
}
```

## 8. 数据质量对比

| 维度 | Kaiko | Binance |
| --- | --- | --- |
| 报价来源 | **6+ 交易所 VWAP 聚合** | 单交易所 |
| 异常剔除 | ✅ 实时风控 | ❌ |
| 历史深度 | **2013 年起** | 2017 年起 |
| OHLCV 完整性 | ✅ 99.9% | 偶有缺漏 |
| 法币参考价 | ✅ USD/EUR/CNY/JPY | ❌ |
| 数据延迟 | < 50ms | < 100ms |
| 价格操纵抵抗 | ✅ 强 | ❌ 弱 |

**结论**：资产估值 / 合约标的价 / 风控基准 **必须用 Kaiko**；Binance 用于零售行情展示。

## 9. 错误处理

```ts
try {
  const ticker = await client.getTicker('cbse', 'btc-usd');
  if (!ticker) {
    // 404 / 不存在的 pair
  }
} catch (err) {
  if (err instanceof KaikoError) {
    switch (err.code) {
      case 'HTTP_429': // 限流（理论上不会触发，限流器在客户端）
      case 'HTTP_4xx': // 客户端错误（不重试）
      case 'HTTP_5xx': // 服务端错误（已自动重试 3 次）
      case 'TIMEOUT':  // 超时
      case 'NETWORK':  // 网络错误
      case 'ALL_ENDPOINTS_FAILED': // 所有端点失败
    }
  }
}
```

## 10. 测试

```bash
node --import tsx --test tests/kaiko.test.ts
```

测试覆盖 18+ 用例，包括限流、重试、降级、跨交易所聚合、FX 转换等。

---

**版本**: v1.0
**更新日期**: 2026-06-20
**维护**: SMY 交易所后端组
