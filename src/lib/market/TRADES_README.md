# Trades 模块（逐笔成交）使用文档

> SMY 交易所行情子系统 · B-05 任务交付物
> 路径：`src/lib/market/trades-feed.ts` + `src/lib/market/binance-client.ts`

本模块在 Binance 真实逐笔成交（`@trade`）之上提供：

- 实时 WebSocket 订阅（自动重连 + 指数退避）
- 历史 REST 拉取
- 内存缓存（每交易对最近 200 笔，环形裁剪）
- 多订阅者（同一 symbol 可挂多个 callback）
- 断网降级：自动 emit 5 笔 mock 成交，保证前端 UI 永远有数据
- 标准化输出：`NormalizedTrade`（价格/数量全部使用 string，零浮点精度丢失）

---

## 1. 类型定义

```ts
export interface NormalizedTrade {
  symbol: string;        // "BTC/USDT"
  price: string;         // 字符串，保留 8 位小数
  qty: string;           // 字符串
  time: number;          // 毫秒时间戳
  isBuyerMaker: boolean; // true = 主动卖
  tradeId: string;       // Binance tradeId（string 化）
  source: 'ws' | 'rest' | 'mock';
}
```

> ⚠️ **精度约束**：`price` / `qty` 必须保持 `string` 形态。禁止 `parseFloat` 之后再做 `+`/`*`，
> 否则会丢失 wei / satoshi 精度（参见项目统一规则）。

---

## 2. 快速开始

### 2.1 创建实例

```ts
import { createTradesFeed } from '@/lib/market';

const feed = createTradesFeed({
  cacheSize: 200,                 // 每 symbol 保留 200 笔
  mockTradesPerSymbol: 5,         // 降级时 5 笔 mock
  staleThresholdMs: 30_000,       // 30s 无推送视为断流
  rest: { timeoutMs: 10_000 },
  ws: { heartbeatMs: 30_000 },
  onFallback: (symbol, reason) => {
    console.warn(`[TradesFeed] fallback ${symbol}: ${reason}`);
  },
});

feed.start();   // 启动 WebSocket 连接
```

### 2.2 订阅逐笔成交

```ts
// 示例 1：单订阅
const unsub = feed.subscribe('BTC/USDT', (t) => {
  console.log(`${t.symbol} ${t.side} ${t.qty} @ ${t.price}`);
  // 推送到 UI / Vuex / Zustand
});

// 示例 2：多订阅者
feed.subscribe('BTC/USDT', (t) => updateChart(t));
feed.subscribe('BTC/USDT', (t) => updateOrderBook(t));

// 示例 3：取消订阅
unsub();
```

### 2.3 读取历史（REST）

```ts
// 单交易对
const trades = await feed.fetchRecentTrades('BTC/USDT', 100);
// trades: NormalizedTrade[]（按时间正序）

// 或者直接调底层 REST 客户端
import { createBinanceRestClient } from '@/lib/market';
const rest = createBinanceRestClient();
const raw = await rest.getRecentTradesRaw('BTC/USDT', 500);
```

### 2.4 读取缓存

```ts
// 从内存缓存读取最近 50 笔（不发起网络请求）
const recent = feed.getRecent('BTC/USDT', 50);
```

### 2.5 关闭

```ts
feed.stop();  // 关闭 WS、清空缓存、清空订阅者
```

---

## 3. 底层 API（无需 TradesFeed）

如果只需要 raw Binance 客户端：

```ts
import { BinanceWsClient, BinanceRestClient } from '@/lib/market';

// 实时：批量订阅并自动标准化
const ws = new BinanceWsClient();
ws.connect();

const unsub = ws.subscribeTrades(['BTC/USDT', 'ETH/USDT'], (t) => {
  // t: NormalizedTrade
});

unsub();
ws.disconnect();

// REST
const rest = new BinanceRestClient();
const trades = await rest.fetchRecentTrades('BTC/USDT', 50);
```

---

## 4. 限流说明

| 接口 | 权重 | 单 IP 限速 | 备注 |
|------|------|-----------|------|
| `GET /api/v3/trades` | **5** | 6000/min | 短时间高频调用易触发 429 |
| `ws://stream.binance.com:9443/stream` | - | 5 msg/s | 单连接订阅流数 ≤ 200 |
| `<sym>@trade` 流 | - | 无单独限速 | 走综合 stream 即可 |

**生产建议**：

1. 不要每秒钟 REST 拉取历史 —— 走 WS `@trade` 流拿实时
2. 批量订阅用 `subscribeTrades([...symbols])`，避免开多条 WS
3. 单个 TradesFeed 实例服务多个订阅者，不要为每个页面创建独立实例
4. 限制 `cacheSize` ≤ 500，避免内存爆炸

---

## 5. 降级策略

当以下情况发生时，TradesFeed 会自动降级：

1. **首次拉取失败**（REST bootstrap）
   - 立即 emit `mockTradesPerSymbol`（默认 5）笔 mock 成交
   - 缓存写入 `source: 'mock'`
   - 触发 `onFallback(symbol, reason)` 回调

2. **WS 长时间无推送**（> `staleThresholdMs`）
   - 当前实现：**仅首次 bootstrap 触发降级**
   - 未来增强：基于 `lastPushAt` 定时巡检（v1.1 计划）

3. **WS 断线 + 重连**
   - 不直接降级 —— 等待重连成功
   - 重连成功后会重新订阅所有 stream（指数退避 500ms → 10s）

4. **真实推送恢复**
   - 收到第一条非 mock 推送后自动清除 `fallenBack` 标记

### Mock 数据生成

```ts
generateMockTrades({
  symbol: 'BTC/USDT',
  count: 5,
  basePrice: 67000,   // 可选；缺省时按 symbol 自动选基准价
});
```

> mock 价格使用几何布朗运动（GBM），与 `MarketFeed` 风格一致，
> 默认波动率 `σ = 0.0015`（单笔 ≈ 0.15% 波动），不会给前端造成跳变错觉。

---

## 6. 已知问题

| # | 问题 | 影响 | 缓解 |
|---|------|------|------|
| 1 | `staleThresholdMs` 阈值未自动触发降级 | 长静默场景下不切换到 mock | 计划 v1.1 增加定时巡检 |
| 2 | REST 拉取不分类重试 | 一次失败直接 fallback | 可结合 429 / 5xx 指数退避 |
| 3 | `mockTradesPerSymbol` 写死默认 5 | 演示场景下单次推送过密 | 调整为定时 emit（v1.1） |
| 4 | Binance 行情来自 fapi / spot 不同域名 | 当前仅实现 spot | 合约逐笔成交需走 `fapi.binance.com` |
| 5 | 重连时可能丢失中间若干笔 | WS 断线期间的成交丢失 | 建议重连后立即 REST 拉一次补齐 |
| 6 | `isBuyerMaker` 字段语义易混淆 | 文档需说明 | 已在 `NormalizedTrade` JSDoc 注明 |

---

## 7. 与现有模块的关系

```
TradesFeed
  ├── BinanceWsClient  （实时 stream）
  │     └── subscribeTrades / subscribeTrade
  └── BinanceRestClient（历史 REST）
        └── fetchRecentTrades / getRecentTradesRaw
```

- `MarketFeed`（`feed.ts`） —— 模拟行情（不依赖 Binance）
- `BinanceMarketFeed`（`binance-adapter.ts`） —— 适配器：把 ticker / depth / trade 包装成 `MarketFeed` 兼容接口
- **`TradesFeed`（`trades-feed.ts`） —— 本模块：专门处理逐笔成交的多 symbol 聚合 + 缓存 + 降级**

> 推荐用法：UI 列表 / 深度图表用 `TradesFeed`；统一行情入口用 `BinanceMarketFeed`。

---

## 8. 单元测试

```bash
npx tsx --test tests/market-trades.test.ts
```

覆盖 11 个用例：

1. ✅ 解析单笔 trade 消息（`normalizeTradeWs`）
2. ✅ 解析组合流（combined stream）的 trade
3. ✅ WebSocket 订阅 + 取消订阅
4. ✅ TradesFeed 多订阅者
5. ✅ 缓存最近 200 笔（环形裁剪）
6. ✅ 自动重连（指数退避）
7. ✅ 降级到 mock
8. ✅ REST 拉取历史
9. ✅ 模拟 5 笔推送正常解析
10. ✅ 工厂函数 + 常量
11. ✅ Test runner cleanup

---

## 9. 修改记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-20 | v1.0 | 初版：实现 subscribeTrades / fetchRecentTrades / TradesFeed |

