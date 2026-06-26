# 指标模块（indicators）

为 K 线图提供 6 个常用技术指标 + TradingView Lightweight Charts 适配层 + 状态管理。

## 目录结构

```
src/lib/indicators/
├── types.ts               # 类型定义（IndicatorPoint / MACDPoint / BOLLPoint / KDJPoint / IndicatorConfig ...）
├── indicators.ts          # 纯函数计算（MA / EMA / MACD / RSI / BOLL / KDJ）
├── lightweight-adapter.ts # TradingView Lightweight Charts 适配层
├── manager.ts             # IndicatorManager 状态管理 + 默认配置
└── index.ts               # 统一导出
```

## 设计原则

- **纯函数**：所有 `calculate*` 函数都是无状态、零依赖的纯函数
- **string 精度**：所有输出数值都用 `string`（8 位小数，参考项目约定）保留精度
- **不足 period 不抛错**：直接返回空数组，前端可据此判断是否绘制
- **零外部依赖**：不引 `technicalindicators` / `TA-Lib` / `decimal.js` / `big.js`
- **可替换**：通过 `IndicatorManager` 增删指标，UI 可一键切换

## 6 个指标公式

### 1. MA（简单移动平均线）

```
MA(n) = (C1 + C2 + ... + Cn) / n
```

### 2. EMA（指数移动平均线）

```
alpha = 2 / (period + 1)
EMA_t = alpha * close_t + (1 - alpha) * EMA_{t-1}
EMA_0 = SMA(close[0..period-1])
```

### 3. MACD

```
DIF  = EMA(close, fast)  -  EMA(close, slow)
DEA  = EMA(DIF, signal)
MACD = (DIF - DEA) * multiplier    // multiplier=2 与中文软件一致
```

默认参数：fast=12, slow=26, signal=9, multiplier=2。

### 4. RSI（相对强弱指数，使用 Wilder 平滑）

```
delta   = close_t - close_{t-1}
gain    = max(delta, 0)
loss    = max(-delta, 0)
avgGain = (prevAvgGain * (period-1) + gain) / period
avgLoss = (prevAvgLoss * (period-1) + loss) / period
RS      = avgGain / avgLoss
RSI     = 100 - 100 / (1 + RS)
```

首点使用简单平均：avgGain = mean(gains[0..period-1])，avgLoss 同理。

### 5. BOLL（布林带）

```
mid   = MA(close, period)
std   = sqrt( E[(close - mid)^2] )  // 总体标准差（除以 n）
upper = mid + k * std
lower = mid - k * std
```

默认：period=20, k=2。

### 6. KDJ（随机指标）

```
RSV = (close - low_n) / (high_n - low_n) * 100
K   = (m1-1)/m1 * prevK + 1/m1 * RSV
D   = (m2-1)/m2 * prevD + 1/m2 * K
J   = 3K - 2D
```

初始：K = 50, D = 50。  
横盘时（high_n == low_n）RSV 置为 50。  
K/D 在 [0, 100]；J 可超界（>100 强超买，<0 强超卖）。

## TradingView Lightweight Charts 集成

```tsx
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';
import { IndicatorManager, adaptToSeries } from '@/lib/indicators';
import { generateHistoricalKlines } from '@/lib/market';

const klines = generateHistoricalKlines('BTC/USDT', '1h', 500);
const mgr = IndicatorManager.withDefaults('1h');

const chart = createChart(container, { width: 800, height: 600 });

// 主图：蜡烛（项目内已有） + 指标
const mainSeries = mgr.getSeriesData(klines).filter(s => s.pane === 'main');
for (const s of mainSeries) {
  if (s.pane === 'main' && 'data' in s) {
    // MA / EMA
    const line = chart.addSeries(LineSeries, { color: s.color, lineWidth: 2 });
    line.setData(s.data);
  } else if (s.pane === 'main' && 'lines' in s) {
    // BOLL（三线）
    for (const ln of s.lines) {
      const line = chart.addSeries(LineSeries, { color: ln.color, lineWidth: 1 });
      line.setData(ln.data);
    }
  }
}

// 副图：MACD / RSI / KDJ
const subPaneConfigs = mgr.getSubPaneConfigs();
for (const { id, config } of subPaneConfigs) {
  const sub = mgr.getSeries(id, '1h', klines);
  if (!sub || !('lines' in sub)) continue;
  // 1) 折线
  for (const ln of sub.lines) {
    const line = chart.addSeries(LineSeries, { color: ln.color, lineWidth: 1 });
    line.setData(ln.data);
  }
  // 2) 柱状图
  for (const h of sub.histograms ?? []) {
    const hist = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } });
    hist.setData(h.data);
  }
  // 3) 参考线
  for (const ref of sub.referenceLines ?? []) {
    const line = chart.addSeries(LineSeries, { color: ref.color, lineStyle: 2, lineWidth: 1 });
    line.setData([
      { time: klines[0].openTime, value: ref.value },
      { time: klines[klines.length - 1].openTime, value: ref.value },
    ]);
  }
}
```

### 颜色 / 样式

通过 `IndicatorConfig` 自定义：

```ts
mgr.addIndicator({
  id: 'MA',
  period: '1h',
  params: { period: 20 },
  color: '#fbbf24',   // 琥珀色
  visible: true,
});
```

BOLL 颜色可分别指定：

```ts
mgr.addIndicator({
  id: 'BOLL',
  period: '1h',
  params: {
    period: 20,
    stdDev: 2,
    upperColor: '#a78bfa',   // 上轨紫色
    lowerColor: '#a78bfa',   // 下轨紫色
  },
  color: '#34d399',          // 中轨绿色
  visible: true,
});
```

MACD 颜色可分别指定：

```ts
mgr.addIndicator({
  id: 'MACD',
  period: '1h',
  params: {
    fast: 12, slow: 26, signal: 9,
    difColor: '#fbbf24',     // DIF 黄色
    posColor: '#ef4444',     // 上涨红
    negColor: '#22c55e',     // 下跌绿
  },
  color: '#f472b6',          // DEA 粉色
  visible: true,
});
```

## 性能基准

测试环境：Windows + Node.js，1000 根 1h K 线：

| 操作 | 耗时 |
| --- | --- |
| `calculateMA(klines, 20)` × 10 | ~5-10ms |
| 6 指标各 5 轮（共 30 次计算） | ~20-30ms |
| 1000 根 K 线 6 指标全套 | < 50ms（远低于 100ms 目标） |

> 实测在 1000 根 K 线下，所有 6 指标 + 适配层总耗时 < 50ms。

## 默认配置

`IndicatorManager.withDefaults()` 开启：

- MA(7) - 琥珀
- MA(25) - 蓝
- MA(99) - 粉
- BOLL(20, 2) - 绿中轨 / 紫上下轨

## 添加自定义指标

要在管理器里加入更多指标：

```ts
const mgr = IndicatorManager.withDefaults('1h');

// 添加 MACD + RSI + KDJ
mgr.addIndicator({ id: 'MACD', period: '1h', params: { fast: 12, slow: 26, signal: 9 }, color: '#f472b6', visible: true });
mgr.addIndicator({ id: 'RSI',  period: '1h', params: { period: 14 }, color: '#a78bfa', visible: true });
mgr.addIndicator({ id: 'KDJ',  period: '1h', params: { n: 9, m1: 3, m2: 3 }, color: '#fb923c', visible: true });

// 切换可见性
mgr.setVisible('MACD', '1h', false);
mgr.setVisible('MACD', '1h', true, { fast: 12, slow: 26, signal: 9 });

// 移除
mgr.removeIndicator('MA', '1h', { period: 99 });
```

要实现自定义指标（如 SAR、CCI、WR）：

1. 在 `indicators.ts` 增加一个 `calculate*` 纯函数
2. 在 `types.ts` 的 `IndicatorId` 联合类型中追加新 ID
3. 在 `MAIN_PANE_INDICATORS` / `SUB_PANE_INDICATORS` 注册
4. 在 `lightweight-adapter.ts` 的 `adaptToSeries` 增加 `case`
5. 在 `manager.ts` 的 `DEFAULT_COLORS` 加上默认色

## 主图 vs 副图

- **主图（pane='main'）**：MA / EMA / BOLL（与蜡烛图共享 y 轴）
- **副图（pane='sub'）**：MACD / RSI / KDJ（独立 y 轴）

通过 `IndicatorManager.getPaneConfig(id)` 获取副图默认高度：

| 指标 | 副图高度 |
| --- | --- |
| MACD | 120px |
| RSI  | 100px |
| KDJ  | 120px |

## 测试

```bash
npx tsx --test tests/indicators.test.ts
```

29 个用例：6 指标计算 + IndicatorManager 行为 + TradingView 适配 + 性能基准 + 健壮性。
