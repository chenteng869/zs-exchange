# 量化策略系统（Quant Engine）

> 完整量化策略系统：7 大技术指标 + 5 大经典策略 + 回测引擎 + 实时信号 + 组合管理。
>
> 零外部依赖、自实现所有数学函数、可直接与现有 order-engine 集成。

## 目录结构

```
src/lib/quant/
├── types.ts              # 全部类型定义（K 线 / 信号 / 仓位 / 回测 / 绩效）
├── indicators.ts         # 7 大技术指标
├── backtest-engine.ts    # 回测引擎（含缓存 / runMany / runPair）
├── live-signal.ts        # 实时信号引擎
├── portfolio.ts          # 组合管理（VaR / Beta / Sharpe / 再平衡）
├── index.ts              # 统一出口
└── strategies/
    ├── two-ma.ts         # 双均线
    ├── macd-strategy.ts  # MACD
    ├── grid.ts           # 网格
    ├── pair-trading.ts   # 配对交易
    └── breakout.ts       # 突破
```

## 7 大技术指标

### 1. SMA（Simple Moving Average）

```
SMA_t = (P_t + P_{t-1} + ... + P_{t-n+1}) / n
```

```ts
import { SMA } from '@/lib/quant';
const out = SMA([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
// out[4] === 3
```

### 2. EMA（Exponential Moving Average）

```
alpha = 2 / (n + 1)
EMA_t = alpha * P_t + (1 - alpha) * EMA_{t-1}
初值 = SMA(P[0..n-1])
```

```ts
import { EMA } from '@/lib/quant';
const out = EMA(prices, 21);
```

### 3. MACD（Moving Average Convergence Divergence）

```
DIF    = EMA(P, fast) - EMA(P, slow)
Signal = EMA(DIF, signal)
Hist   = (DIF - Signal) * 2
```

默认参数：fast=12, slow=26, signal=9。

```ts
import { MACD } from '@/lib/quant';
const points = MACD(prices); // [{macd, signal, histogram}, ...]
```

### 4. RSI（Relative Strength Index）

使用 Wilder 平滑（与 TradingView 一致）：

```
delta  = P_t - P_{t-1}
gain   = max(delta, 0)
loss   = max(-delta, 0)
avgGain = (prevAvgGain * (n-1) + gain) / n
avgLoss = (prevAvgLoss * (n-1) + loss) / n
RSI    = 100 - 100 / (1 + avgGain/avgLoss)
```

```ts
import { RSI } from '@/lib/quant';
const out = RSI(prices, 14);
```

### 5. Bollinger Bands（布林带）

```
mid   = SMA(P, n)
std   = sqrt(Σ(P_i - mid)² / n)
upper = mid + k * std
lower = mid - k * std
```

```ts
import { BollingerBands } from '@/lib/quant';
const bands = BollingerBands(prices, 20, 2);
```

### 6. KDJ（随机指标）

```
RSV = (close - lowest_n) / (highest_n - lowest_n) * 100
K   = (m1-1)/m1 * prevK + 1/m1 * RSV
D   = (m2-1)/m2 * prevD + 1/m2 * K
J   = 3K - 2D
初值 K = D = 50
```

```ts
import { KDJ } from '@/lib/quant';
const out = KDJ(highs, lows, closes, 9, 3, 3);
```

### 7. ATR（Average True Range）

```
TR_t = max(high-low, |high - prevClose|, |low - prevClose|)
ATR_t = Wilder 平滑的 TR
```

```ts
import { ATR } from '@/lib/quant';
const out = ATR(highs, lows, closes, 14);
```

## 5 大经典策略

| 策略 ID         | 类名              | 核心信号                       | 适用场景     |
| --------------- | ----------------- | ------------------------------ | ------------ |
| `two-ma`        | `TwoMAStrategy`   | 快线上穿/下穿慢线              | 趋势跟随     |
| `macd`          | `MACDStrategy`    | MACD 柱由负转正 / 由正转负     | 趋势反转     |
| `grid`          | `GridStrategy`    | 价格突破网格层                 | 震荡行情     |
| `pair-trading`  | `PairTradingStrategy` | 价差 z-score 越过阈值      | 统计套利     |
| `breakout`      | `BreakoutStrategy` | 突破 N 日新高/新低             | 强趋势启动   |

### 双均线

```ts
import { TwoMAStrategy } from '@/lib/quant';
const strat = new TwoMAStrategy({ fastPeriod: 5, slowPeriod: 20 });
const signal = strat.evaluate(candles, index);
```

### MACD

```ts
import { MACDStrategy } from '@/lib/quant';
const strat = new MACDStrategy({ fast: 12, slow: 26, signal: 9 });
```

### 网格

```ts
import { GridStrategy } from '@/lib/quant';
const strat = new GridStrategy({ lower: 100, upper: 110, levels: 10 });
```

### 配对交易

```ts
import { PairTradingStrategy } from '@/lib/quant';
const strat = new PairTradingStrategy({ threshold: 2, window: 30 });
const sig = strat.evaluatePair(candlesA, candlesB, index);
```

### 突破

```ts
import { BreakoutStrategy } from '@/lib/quant';
const strat = new BreakoutStrategy({ lookback: 20, atrMultiplier: 2 });
```

## 回测示例

```ts
import { BacktestEngine, type BacktestConfig, type Candle } from '@/lib/quant';

const config: BacktestConfig = {
  symbol: 'BTCUSDT',
  startTime: 0,
  endTime: 0,
  initialCapital: 10000,
  commission: 0.001,    // 0.1%
  slippage: 0.0005,     // 0.05%
  leverage: 1,
  strategy: 'two-ma',
  params: { fastPeriod: 5, slowPeriod: 20 },
};

const engine = new BacktestEngine();
const result = engine.run(config, candles);

console.log(result.metrics);
// {
//   totalReturn: 0.234,
//   sharpeRatio: 1.85,
//   maxDrawdown: 0.123,
//   winRate: 0.58,
//   profitFactor: 2.1,
//   totalTrades: 42,
//   ...
// }
```

### 多策略批量回测

```ts
const results = engine.runMany([
  { config: { strategy: 'two-ma', ... }, candles },
  { config: { strategy: 'macd', ... }, candles },
]);
```

### 配对交易回测

```ts
const result = engine.runPair(pairConfig, candlesA, candlesB);
```

### 缓存

相同 `config + candles` 二次运行直接命中缓存（`Map<string, BacktestResult>`）。

## 实时信号

```ts
import { LiveSignalEngine } from '@/lib/quant';

const engine = new LiveSignalEngine();
const unsubscribe = engine.subscribe('BTCUSDT', 'two-ma', (signal) => {
  console.log(signal.type, signal.price, signal.reason);
}, { fastPeriod: 5, slowPeriod: 20 });

// 喂入新 K 线（建议用收盘后调用）
engine.onKline('BTCUSDT', candle);

// 预热历史
engine.preload('BTCUSDT', 'two-ma', historicalCandles);

// 取消订阅
unsubscribe();

// 取最近一次信号
const latest = engine.getLatestSignal('BTCUSDT', 'two-ma');
```

## 组合管理

```ts
import { PortfolioManager } from '@/lib/quant';

const pm = new PortfolioManager();

pm.addPosition({
  symbol: 'BTCUSDT',
  side: 'long',
  entryPrice: 100,
  quantity: 1,
  entryTime: Date.now(),
  unrealizedPnl: 0,
});

pm.updatePosition('BTCUSDT', { stopLoss: 95, takeProfit: 120 });

// 风险指标
const returns = [0.01, 0.02, -0.005, 0.015, ...];
const sharpe = pm.calculateSharpe(returns, 0.02, 252);
const var95 = pm.calculateVaR(returns, 0.95);
const beta = pm.calculateBeta(assetReturns, marketReturns);

// 风险敞口
const { long, short, net } = pm.getExposure({ BTCUSDT: 105, ETHUSDT: 2500 });

// 调仓（偏离 > 5% 触发）
const { trades } = pm.rebalance(
  [
    { symbol: 'BTCUSDT', weight: 0.5 },
    { symbol: 'ETHUSDT', weight: 0.5 },
  ],
  totalEquity,
  0.05,
);
```

## 绩效指标（PerformanceMetrics）

| 指标              | 含义                  |
| ----------------- | --------------------- |
| `totalReturn`     | 总收益（0-1）         |
| `annualizedReturn`| 年化收益              |
| `sharpeRatio`     | 夏普比率              |
| `sortinoRatio`    | 索提诺比率            |
| `maxDrawdown`     | 最大回撤（0-1）       |
| `winRate`         | 胜率（0-1）           |
| `profitFactor`    | 盈亏比                |
| `totalTrades`     | 交易笔数              |
| `avgTrade`        | 平均盈亏              |
| `avgWin` / `avgLoss` | 平均盈利 / 亏损    |
| `largestWin` / `largestLoss` | 最大盈利 / 亏损 |

## 风险指标

| 指标          | 公式                       | 说明                            |
| ------------- | -------------------------- | ------------------------------- |
| **VaR**       | μ - z·σ                    | 参数法历史 VaR（95% / 99%）     |
| **Beta**      | Cov(asset, market) / Var(m) | 系统性风险                      |
| **Sharpe**    | (μ - r_f) / σ · √N         | 风险调整后收益                  |
| **Sortino**   | (μ - r_f) / σ_d · √N       | 只看下行波动                    |

## 关键常量

```ts
import {
  SMA_DEFAULT_PERIOD,    // 20
  EMA_DEFAULT_PERIOD,    // 21
  RSI_DEFAULT_PERIOD,    // 14
  MACD_FAST,             // 12
  MACD_SLOW,             // 26
  MACD_SIGNAL,           // 9
  BOLLINGER_STDDEV,      // 2
  GRID_DEFAULT_LEVELS,   // 10
  PAIR_ZSCORE_THRESHOLD, // 2.0
  BREAKOUT_LOOKBACK,     // 20
} from '@/lib/quant';
```

## 测试

```bash
npx tsx --test tests/quant-engine.test.ts
```

至少 22 个用例覆盖：7 指标 + 5 策略 + 回测引擎 + 实时信号 + 组合管理。

## 设计原则

- **零外部依赖**：所有数学函数自实现（sqrt / pow 等基础运算除外）。
- **可复用**：策略、引擎、组合管理完全解耦，可与现有 `order-engine` 集成。
- **类型安全**：所有接口强类型，编译期发现错误。
- **可测试**：纯函数为主，便于单元测试。
- **可扩展**：新增策略只需实现 `Strategy` 接口并注册到 `createStrategy`。
