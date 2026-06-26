# 算法交易系统 (Algo Trading)

> SMY 交易所 - 大单拆小单 / 算法执行模块
> 支持 6 大经典策略：TWAP / VWAP / Iceberg / Sniper / TWAP-Stop / Trailing Stop

---

## 1. 概述

大额委托容易冲击市场，本模块将"大单"拆成"小单"在时间维度 / 成交量维度上慢慢成交，
从而获得更优的均价、降低市场冲击、隐藏真实意图。

所有金额 / 数量 / 价格均以 **string** 表示，复用 `src/lib/matching/decimal.ts` 的
bigint 字符串运算，避免 JS 浮点精度问题。

### 设计原则

| 原则 | 说明 |
| ---- | ---- |
| **零外部依赖** | 不依赖 cron / moment / lodash，调度器 / 时间窗 / 随机化全部自研 |
| **复用撮合引擎** | 子单直接调用 `OrderEngine.submitMarketOrder / submitLimitOrder` |
| **事件驱动** | `algoUpdate` / `childFilled` 通过 `EventEmitter` 暴露，外部可订阅 |
| **类型安全** | 严格 TypeScript，6 大策略共用 `AlgoOrder` / `AlgoChildOrder` |

### 模块文件

```
src/lib/algo/
├── types.ts              # 核心类型 + 默认配置
├── scheduler.ts          # AlgoScheduler 轻量定时调度器
├── algo-engine.ts        # AlgoEngine 业务层入口
├── index.ts              # 统一导出
└── strategies/
    ├── twap.ts           # TWAP / TWAP-Stop
    ├── vwap.ts           # VWAP
    ├── iceberg.ts        # Iceberg
    ├── sniper.ts         # Sniper
    └── trailing-stop.ts  # Trailing Stop
```

---

## 2. 6 大策略对比

| 策略 | 触发方式 | 拆单规则 | 适用场景 | 关键参数 |
| ---- | -------- | -------- | -------- | -------- |
| **TWAP** | 定时 | 等时间间隔等量拆单 | 想要时间均匀的均价 | `durationSec` `intervalSec` |
| **VWAP** | 定时 + 成交量桶 | 时间窗 + 用户喂入的 `volumeProfile` | 跟随市场真实成交量节奏 | `volumeProfile[]` |
| **Iceberg** | 成交后补单 | `displayQuantity` 单次最多挂出 | 隐藏大单意图 | `displayQuantity` `variance` |
| **Sniper** | 价格触发 | 单笔市价 / 限价 | 新币上线 / 突破位 | `triggerPrice` `triggerDirection` |
| **TWAP-Stop** | 定时 + 止损 | TWAP + `stopLossPrice` | 拆单途中跌破止损立即清仓 | 同 TWAP + `stopLossPrice` |
| **Trailing Stop** | 价格追踪 | peak / trough ± `callbackRate` | 止盈 + 让利润奔跑 | `activationPrice` `callbackRate` `trailingSide` |

---

## 3. 核心 API

### 3.1 AlgoEngine（业务层入口）

```typescript
import { AlgoEngine } from '@/lib/algo';
import { OrderEngine } from '@/lib/matching/engine';

const oe = new OrderEngine(/* ... */);
const engine = new AlgoEngine({ orderEngine: oe });

// 1. 创建（不启动，status = pending）
const algo = engine.createAlgo({
  userId: 'u1',
  type: 'twap',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',     // 10 BTC
  durationSec: 600,         // 10 分钟
  intervalSec: 30,         // 每 30s 一单
  // limitPrice: '67000',  // 可选：限价
});

// 2. 启动
await engine.startAlgo(algo.id);

// 3. 查询
const a = engine.getAlgo(algo.id);
const myAlgos = engine.getUserAlgos('u1', 'running');
const children = engine.getAlgoChildren(algo.id);

// 4. 取消
engine.cancelAlgo(algo.id);

// 5. 统计
const stats = engine.getUserStats('u1');
// { algoCount, totalVolume, avgSlippage, totalFilled, byType, byStatus }

// 6. 订阅事件
const off = engine.onAlgoUpdate((a) => console.log('algo', a.id, a.status));
const off2 = engine.onChildOrderFilled((parent, child) =>
  console.log('child filled', child.id, child.filledQuantity)
);
```

### 3.2 AlgoScheduler（调度器）

```typescript
import { AlgoScheduler } from '@/lib/algo';

const scheduler = new AlgoScheduler(100); // tick 间隔 100ms
scheduler.start();

// 一次性任务
scheduler.scheduleJob('myJob', Date.now() + 5000, () => {
  console.log('fired once');
}, { algoId: 'a1', tag: 'twap' });

// 重复任务
scheduler.scheduleRepeating('myPoll', Date.now(), 1000, () => {
  console.log('tick');
});

// 取消
scheduler.cancelJob('myJob');
scheduler.cancelByAlgo('a1');
scheduler.cancelByTag('twap');
```

---

## 4. 各策略用法

### 4.1 TWAP（时间加权平均价）

```typescript
const algo = engine.createAlgo({
  userId: 'u1',
  type: 'twap',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',
  durationSec: 600,   // 10 分钟
  intervalSec: 30,    // 每 30s 一单 → 20 个子单，每单 0.5 BTC
});
await engine.startAlgo(algo.id);
```

**计划预览（不启动）：**

```typescript
import { TwapStrategy } from '@/lib/algo';

const plan = TwapStrategy.plan(
  '10',                       // totalQty
  Date.now(),                 // startTime
  Date.now() + 600_000,       // endTime
  30,                         // intervalSec
  engine.getConfig(),
  { side: 'buy', randomize: false }
);
console.log(plan.childCount);  // 20
console.log(plan.children[0]); // { index: 0, scheduledAt: ..., quantity: '0.5' }
```

### 4.2 VWAP（成交量加权平均价）

```typescript
const algo = engine.createAlgo({
  userId: 'u1',
  type: 'vwap',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',
  durationSec: 180,           // 3 分钟
  intervalSec: 30,            // 每 30s 一单 → 6 个子单
  volumeProfile: [
    { startOffsetSec: 0,   endOffsetSec: 60,  weight: 0.2 }, // 低峰
    { startOffsetSec: 60,  endOffsetSec: 120, weight: 0.6 }, // 高峰
    { startOffsetSec: 120, endOffsetSec: 180, weight: 0.2 }, // 低峰
  ],
});
await engine.startAlgo(algo.id);
```

> 如果没有喂入 `volumeProfile`，VWAP 自动退化为 TWAP。

### 4.3 Iceberg（冰山单）

```typescript
const algo = engine.createAlgo({
  userId: 'u1',
  type: 'iceberg',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',         // 真实总量 10 BTC
  durationSec: 600,            // 10 分钟内慢慢成交
  displayQuantity: '0.5',      // 每次只挂 0.5 BTC
  variance: 0.1,               // ±10% 抖动，更难识别
  // limitPrice: '67000',     // 可选：挂限价；不填则市价
});
await engine.startAlgo(algo.id);
```

**机制：** 子单成交后立即补下一单（由 `IcebergStrategy.onChildFilled` 触发）。

### 4.4 Sniper（狙击手）

```typescript
const priceFeed = /* 实现 PriceFeed 接口 */;
const engine = new AlgoEngine({ orderEngine: oe, priceFeed });

const algo = engine.createAlgo({
  userId: 'u1',
  type: 'sniper',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '1',
  durationSec: 60,             // 1 分钟窗口
  triggerPrice: '65000',       // 跌破 65000 立即抄底
  triggerDirection: 'lte',     // price <= trigger 时触发
  // sniperLimitPrice: '65500', // 可选：触发后挂限价；不填则市价
});
await engine.startAlgo(algo.id);
```

`triggerDirection`：
- `'lte'`：价格 ≤ 触发价 → 触发（抄底）
- `'gte'`：价格 ≥ 触发价 → 触发（追涨）

### 4.5 TWAP-Stop（带止损的 TWAP）

```typescript
const algo = engine.createAlgo({
  userId: 'u1',
  type: 'twap_stop',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',
  durationSec: 600,
  intervalSec: 30,
  stopLossPrice: '64000',      // 价格 ≤ 64000 立即市价清仓
  takeProfitPrice: '70000',    // 价格 ≥ 70000 立即市价止盈
});
await engine.startAlgo(algo.id);
```

> TWAP-Stop = TWAP 拆单 + 紧急止损/止盈。止损/止盈通过子单价格轮询实现。

### 4.6 Trailing Stop（追踪止损）

```typescript
const priceFeed = /* 实现 PriceFeed 接口 */;
const engine = new AlgoEngine({ orderEngine: oe, priceFeed });

const algo = engine.createAlgo({
  userId: 'u1',
  type: 'trailing_stop',
  symbol: 'BTCUSDT',
  side: 'sell',                // 卖 = 平多头
  totalQuantity: '1',          // 1 BTC
  durationSec: 3600,           // 1 小时窗口
  activationPrice: '68000',    // 涨到 68000 才激活追踪
  callbackRate: 0.005,         // 从最高点回落 0.5% 触发平仓
  // trailingSide: 'long',    // 可选：默认 side=buy→long, sell→short
});
await engine.startAlgo(algo.id);
```

**追踪机制：**
- 持多 (`long`)：记录 `peak = max(peak, price)`；当 `price ≤ peak * (1 - callbackRate)` 触发市价平仓
- 持空 (`short`)：记录 `trough = min(trough, price)`；当 `price ≥ trough * (1 + callbackRate)` 触发市价平仓

---

## 5. 完整调用示例

```typescript
import { AlgoEngine, AlgoScheduler, AlgoError } from '@/lib/algo';
import { OrderEngine } from '@/lib/matching/engine';
import { MockPriceFeed } from './mockPriceFeed';   // 你的实现

// 1. 准备撮合引擎 + 价格源
const oe = new OrderEngine({ /* 撮合配置 */ });
const pf = new MockPriceFeed();
pf.set('BTCUSDT', '67000');

// 2. 启动 AlgoEngine
const engine = new AlgoEngine({
  orderEngine: oe,
  priceFeed: pf,
  config: {
    randomizeSize: true,        // ±10% 数量抖动
    randomizeTime: true,        // ±10% 时间抖动
    schedulerTickMs: 100,
    pricePollIntervalMs: 1000,
  },
});

// 3. 订阅事件
engine.onAlgoUpdate((algo) => {
  console.log(`[algo] ${algo.id} → ${algo.status} (filled ${algo.executedQuantity}/${algo.totalQuantity})`);
});
engine.onChildOrderFilled((parent, child) => {
  console.log(`[child] ${child.id} filled ${child.filledQuantity} @ ${child.avgPrice}`);
});

// 4. 场景 A：TWAP 买入 10 BTC
const twap = engine.createAlgo({
  userId: 'u1',
  type: 'twap',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '10',
  durationSec: 600,
  intervalSec: 30,
});
await engine.startAlgo(twap.id);

// 5. 场景 B：Sniper 抄底 1 BTC（65000 触发）
const sniper = engine.createAlgo({
  userId: 'u1',
  type: 'sniper',
  symbol: 'BTCUSDT',
  side: 'buy',
  totalQuantity: '1',
  durationSec: 60,
  triggerPrice: '65000',
  triggerDirection: 'lte',
});
await engine.startAlgo(sniper.id);

// 6. 场景 C：Iceberg 卖出 5 BTC
const iceberg = engine.createAlgo({
  userId: 'u1',
  type: 'iceberg',
  symbol: 'BTCUSDT',
  side: 'sell',
  totalQuantity: '5',
  durationSec: 300,
  displayQuantity: '0.1',
  variance: 0.1,
});
await engine.startAlgo(iceberg.id);

// 7. 查询
setTimeout(() => {
  const stats = engine.getUserStats('u1');
  console.log('[stats]', {
    algoCount: stats.algoCount,
    totalVolume: stats.totalVolume,
    avgSlippage: stats.avgSlippage,
  });
}, 5000);

// 8. 主动取消
engine.cancelAlgo(iceberg.id);

// 9. 关闭
process.on('SIGINT', () => {
  engine.shutdown();
  process.exit(0);
});
```

---

## 6. 接口与扩展点

### 6.1 PriceFeed（价格源抽象）

```typescript
interface PriceFeed {
  getPrice(symbol: string): string | null;
  getLastTradePrice?(symbol: string): { price: string; side: AlgoSide; ts: number } | null;
  subscribe?(symbol: string, listener: (price: string) => void): () => void;
}
```

**实现建议：**
- 接 REST 轮询：实现 `getPrice` 即可
- 接 WebSocket：实现 `subscribe`，并在 Sniper / TrailingStop 内启用
- 接内部撮合：直接复用撮合引擎的最新成交价

### 6.2 OrderEngineLike（撮合引擎抽象）

```typescript
interface OrderEngineLike {
  submitMarketOrder(params): { orderId; filledQuantity; avgPrice; status };
  submitLimitOrder(params): { orderId; filledQuantity; avgPrice; status };
  cancelOrder?(orderId): boolean;
}
```

只要实现这 3 个方法，AlgoEngine 即可对接任意撮合后端。

### 6.3 自定义策略

实现 5 个策略的方法即可挂入 AlgoEngine：

```typescript
class MyStrategy {
  start(algo, scheduler, orderEngine, config, /* priceFeed? */, onChildUpdate, /* onAlgoUpdate? */) { /* ... */ }
  cancel(algo, scheduler) { /* ... */ }
}

// 在 algo-engine.ts 的 switch 中加入 case 即可
```

---

## 7. 滑点（Slippage）算法

```
slippage = (avgPrice - startPrice) / startPrice
```

| 方向 | 含义 |
| ---- | ---- |
| `buy`  | 正数 = 买贵，负数 = 买便宜 |
| `sell` | 正数 = 卖便宜，负数 = 卖贵（对 seller 来说"卖贵"是好事） |

**实现细节** (`algo-engine.ts::recalculateAlgo`)：

```typescript
if (decIsPositive(algo.startPrice) && decIsPositive(algo.avgPrice)) {
  const diff = decSub(algo.avgPrice, algo.startPrice);
  const slipRaw = decDiv(diff, algo.startPrice, 8);
  if (algo.side === 'sell') {
    algo.slippage = decTruncate(decMul(slipRaw, '-1'), 8); // sell 取负
  } else {
    algo.slippage = decTruncate(slipRaw, 8);
  }
}
```

所有计算走 `decAdd / decSub / decMul / decDiv` (string bigint)，零浮点误差。

---

## 8. 测试

```
tests/algo-engine.test.ts   # 21 个用例，覆盖 6 大策略 + 调度器 + 边界
```

运行：

```bash
npx tsx --test tests/algo-engine.test.ts
```

---

## 9. 错误码

| Code | 含义 |
| ---- | ---- |
| `ALGO_NOT_FOUND` | algoId 不存在 |
| `ALGO_NOT_PENDING` | 启动时 algo 状态不是 pending（重复启动 / 已结束） |
| `INVALID_USER` | userId 缺失 |
| `INVALID_SYMBOL` | symbol 缺失 |
| `INVALID_SIDE` | side 缺失 |
| `INVALID_QTY` | totalQuantity ≤ 0 |
| `INVALID_DURATION` | durationSec ≤ 0 |
| `INVALID_CONFIG` | 策略必填参数缺失（如 Iceberg 缺 displayQuantity、Sniper 缺 triggerPrice） |
| `UNKNOWN_TYPE` | 未识别的 algo.type |

---

## 10. 限制与注意事项

1. **TWAP 子单数上限 1000**（`ALGO_MAX_CHILD_ORDERS`），超过会被截断
2. **子单最小间隔 5 秒**（`ALGO_MIN_CHILD_INTERVAL_SEC`），避免被交易所 rate limit
3. **VWAP 没有 volumeProfile 自动退化为 TWAP**（不会报错）
4. **Sniper 触发后只能成交 1 笔**，status = `triggered`
5. **TrailingStop 触发后只能平仓 1 笔**，status = `triggered`
6. **Iceberg 单笔数量不会超过 `displayQuantity`**，但允许 ±variance 抖动
7. **调度器 tick 间隔默认 100ms**，高频策略（Sniper/TrailingStop）建议压到 20-50ms
8. **断网 / 进程崩溃** → AlgoEngine 实例化时未持久化，恢复需要重新创建；生产环境应接入 Redis
