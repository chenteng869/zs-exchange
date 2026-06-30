/**
 * 量化策略系统测试
 *
 * 至少 18 个用例：
 *  - 7 指标正确性
 *  - 5 策略信号
 *  - 回测引擎
 *  - 实时信号
 *  - 组合管理
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SMA,
  EMA,
  MACD,
  RSI,
  BollingerBands,
  KDJ,
  ATR,
  TwoMAStrategy,
  MACDStrategy,
  GridStrategy,
  PairTradingStrategy,
  BreakoutStrategy,
  BacktestEngine,
  LiveSignalEngine,
  PortfolioManager,
} from '../src/lib/quant';
import type { Candle } from '../src/lib/quant';

// =============================================================================
// 工具：构造测试 K 线
// =============================================================================

function mkCandle(
  time: number,
  close: number,
  opts: Partial<Pick<Candle, 'open' | 'high' | 'low' | 'volume'>> = {},
): Candle {
  return {
    time,
    open: opts.open ?? close,
    high: opts.high ?? close,
    low: opts.low ?? close,
    close,
    volume: opts.volume ?? 100,
  };
}

/** 序列 close=[1,2,3,...,n] 的 K 线 */
function linearCandles(n: number, stepMs = 60_000): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    out.push(mkCandle(i * stepMs, i + 1));
  }
  return out;
}

/** 上涨趋势 K 线（base + 步进） */
function upTrendCandles(n: number, start = 100, step = 2): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const c = start + i * step;
    out.push(mkCandle(i * 60_000, c, { high: c + 1, low: c - 1, open: c - 0.5 }));
  }
  return out;
}

/** 先跌后涨 V 形 */
function vShapeCandles(n: number): Candle[] {
  const out: Candle[] = [];
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const c = i < mid ? 100 - i : 50 + (i - mid) * 2;
    out.push(mkCandle(i * 60_000, c, { high: c + 1, low: c - 1, open: c - 0.5 }));
  }
  return out;
}

// =============================================================================
// 1. SMA 计算正确
// =============================================================================

test('SMA 计算正确（前 period-1 个 NaN，后续等于窗口均值）', () => {
  const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const out = SMA(prices, 5);
  assert.equal(out.length, 10);
  for (let i = 0; i < 4; i++) assert.ok(isNaN(out[i]), `index ${i} 应为 NaN`);
  assert.ok(Math.abs(out[4] - 3) < 1e-9, 'out[4]=3');
  assert.ok(Math.abs(out[9] - 8) < 1e-9, 'out[9]=8');
});

// =============================================================================
// 2. EMA 计算正确
// =============================================================================

test('EMA 计算正确（初值为 SMA）', () => {
  const prices = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20];
  const out = EMA(prices, 5);
  // 前 4 个 NaN
  for (let i = 0; i < 4; i++) assert.ok(isNaN(out[i]));
  // 第 5 个（index 4）等于 SMA = 10
  assert.ok(Math.abs(out[4] - 10) < 1e-9);
  // 后续 5 个会逐渐上升（因为价格从 10 → 20）
  assert.ok(out[5] > out[4]);
  assert.ok(out[9] > out[5]);
});

// =============================================================================
// 3. MACD histogram 在 0 附近
// =============================================================================

test('MACD：histogram 在零附近震荡（横盘序列）', () => {
  const prices = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 2);
  const points = MACD(prices, 12, 26, 9);
  const valid = points.filter((p) => !isNaN(p.histogram));
  assert.ok(valid.length > 30, `valid length=${valid.length}`);
  for (const p of valid) {
    assert.ok(Math.abs(p.histogram) < 20, `hist=${p.histogram} 过大`);
  }
});

// =============================================================================
// 4. RSI 范围 0-100
// =============================================================================

test('RSI 范围 0-100（上涨序列接近 100）', () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
  const out = RSI(prices, 14);
  for (let i = 14; i < out.length; i++) {
    assert.ok(out[i] >= 0 && out[i] <= 100, `RSI[${i}]=${out[i]}`);
  }
  assert.ok(out[out.length - 1] > 80, '单边上涨 RSI 应 > 80');
});

// =============================================================================
// 5. BollingerBands upper > lower
// =============================================================================

test('BollingerBands：upper > middle > lower', () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 3) * 5);
  const out = BollingerBands(prices, 20, 2);
  for (let i = 19; i < out.length; i++) {
    const b = out[i];
    assert.ok(b.upper > b.middle);
    assert.ok(b.middle > b.lower);
    // 带宽 > 0
    assert.ok(b.upper - b.lower > 0);
  }
});

// =============================================================================
// 6. KDJ K/D/J 范围合理
// =============================================================================

test('KDJ：K/D 在 0-100 附近，J 范围更大', () => {
  const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 3) * 5);
  const highs = closes.map((c) => c + 1);
  const lows = closes.map((c) => c - 1);
  const out = KDJ(highs, lows, closes, 9, 3, 3);
  for (let i = 8; i < out.length; i++) {
    const p = out[i];
    assert.ok(p.k >= -50 && p.k <= 150, `K=${p.k}`);
    assert.ok(p.d >= -50 && p.d <= 150, `D=${p.d}`);
    // J = 3K - 2D
    assert.ok(Math.abs(p.j - (3 * p.k - 2 * p.d)) < 1e-6);
  }
});

// =============================================================================
// 7. ATR > 0
// =============================================================================

test('ATR > 0（除初始 NaN 外）', () => {
  const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
  const highs = closes.map((c) => c + 2);
  const lows = closes.map((c) => c - 2);
  const out = ATR(highs, lows, closes, 14);
  for (let i = 14; i < out.length; i++) {
    assert.ok(out[i] > 0, `ATR[${i}]=${out[i]}`);
  }
  for (let i = 0; i < 13; i++) {
    assert.ok(isNaN(out[i]), `ATR[${i}] 应为 NaN`);
  }
});

// =============================================================================
// 8. 双均线策略：金叉/死叉
// =============================================================================

test('双均线策略：V 形走势产生金叉', () => {
  const candles = vShapeCandles(60);
  const strat = new TwoMAStrategy({ fastPeriod: 5, slowPeriod: 20 });
  let foundBuy = false;
  for (let i = 25; i < candles.length; i++) {
    const sig = strat.evaluate(candles, i);
    if (sig && sig.type === 'buy') {
      foundBuy = true;
      break;
    }
  }
  assert.ok(foundBuy, 'V 形回升阶段应出现金叉买入信号');
});

// =============================================================================
// 9. MACD 策略：金叉/死叉
// =============================================================================

test('MACD 策略：先跌后涨出现买入信号', () => {
  // V 形：先下跌再上涨，让 MACD 柱状从负转正
  const candles: Candle[] = [];
  const n = 120;
  const mid = 50;
  for (let i = 0; i < n; i++) {
    // 加入小幅随机扰动，避免完全线性
    const noise = Math.sin(i * 1.7) * 1.5 + Math.cos(i * 0.7) * 0.8;
    const c = i < mid ? 200 - i * 2 + noise : 100 + (i - mid) * 2 + noise;
    candles.push(mkCandle(i * 60_000, c, { high: c + 1, low: c - 1, open: c - 0.5 }));
  }
  const strat = new MACDStrategy({ fast: 12, slow: 26, signal: 9 });
  let foundBuy = false;
  for (let i = 30; i < candles.length; i++) {
    const sig = strat.evaluate(candles, i);
    if (sig && sig.type === 'buy') {
      foundBuy = true;
      break;
    }
  }
  assert.ok(foundBuy, 'V 形回升阶段 MACD 策略应出现买入');
});

// =============================================================================
// 10. 网格策略：低买高卖
// =============================================================================

test('网格策略：区间震荡时产生买卖信号', () => {
  // 构造一个在 [100, 110] 震荡的序列
  const candles: Candle[] = [];
  for (let i = 0; i < 60; i++) {
    const c = 105 + Math.sin(i / 3) * 4;
    candles.push(mkCandle(i * 60_000, c, { high: c + 0.5, low: c - 0.5, open: c }));
  }
  const strat = new GridStrategy({ lower: 100, upper: 110, levels: 10 });
  let buy = 0;
  let sell = 0;
  for (let i = 1; i < candles.length; i++) {
    const sig = strat.evaluate(candles, i);
    if (sig?.type === 'buy') buy++;
    if (sig?.type === 'sell') sell++;
  }
  assert.ok(buy + sell > 0, '震荡区间内网格应至少触发一次信号');
});

// =============================================================================
// 11. 配对交易：z-score 信号
// =============================================================================

test('配对交易：价差发散时产生开仓信号', () => {
  const n = 80;
  // A 平稳，B 同步，最后 5 根 B 突然拉高
  const candlesA: Candle[] = [];
  const candlesB: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const a = 100 + Math.sin(i / 5) * 2;
    let b = 100 + Math.sin(i / 5) * 2;
    if (i > n - 10) b += 10; // 拉高 B
    candlesA.push(mkCandle(i * 60_000, a));
    candlesB.push(mkCandle(i * 60_000, b));
  }
  const strat = new PairTradingStrategy({ threshold: 2, window: 30 });
  let foundSignal = false;
  for (let i = 35; i < n; i++) {
    const sig = strat.evaluatePair(candlesA, candlesB, i);
    if (sig) {
      foundSignal = true;
      break;
    }
  }
  assert.ok(foundSignal, 'B 拉高时 spread z 应越过阈值');
});

// =============================================================================
// 12. 突破策略：新高/新低
// =============================================================================

test('突破策略：突破前高产生买入', () => {
  // 先盘整 20 根，再突然一根大阳线突破
  const candles: Candle[] = [];
  for (let i = 0; i < 20; i++) {
    candles.push(mkCandle(i * 60_000, 100 + (i % 2), { high: 102, low: 99 }));
  }
  candles.push(mkCandle(20 * 60_000, 110, { high: 115, low: 109, open: 109 }));
  const strat = new BreakoutStrategy({ lookback: 20 });
  const sig = strat.evaluate(candles, 20);
  assert.ok(sig !== null, '应产生突破信号');
  assert.equal(sig!.type, 'buy');
});

// =============================================================================
// 13. BacktestEngine run 完整回测
// =============================================================================

test('BacktestEngine.run：完整跑完无异常', () => {
  const candles = upTrendCandles(120, 100, 1);
  const engine = new BacktestEngine();
  const result = engine.run(
    {
      symbol: 'BTCUSDT',
      startTime: 0,
      endTime: 0,
      initialCapital: 10000,
      commission: 0.001,
      slippage: 0.0005,
      leverage: 1,
      strategy: 'two-ma',
      params: { fastPeriod: 5, slowPeriod: 20 },
    },
    candles,
  );
  assert.ok(result.equity.length === candles.length);
  assert.ok(result.metrics.totalTrades >= 0);
  assert.ok(typeof result.metrics.sharpeRatio === 'number');
});

// =============================================================================
// 14. BacktestResult 总收益 > 0（强上涨趋势）
// =============================================================================

test('BacktestResult：上涨震荡趋势总收益 > 0', () => {
  // 上涨 + 强震荡，让 MA 多次交叉
  const candles: Candle[] = [];
  for (let i = 0; i < 200; i++) {
    const trend = 100 + i * 0.5;
    const osc = Math.sin(i / 4) * 6 + Math.sin(i / 11) * 3;
    const c = trend + osc;
    candles.push(mkCandle(i * 60_000, c, { high: c + 1, low: c - 1, open: c - 0.5 }));
  }
  const engine = new BacktestEngine();
  const result = engine.run(
    {
      symbol: 'BTCUSDT',
      startTime: 0,
      endTime: 0,
      initialCapital: 10000,
      commission: 0.0005,
      slippage: 0.0002,
      leverage: 1,
      strategy: 'two-ma',
      params: { fastPeriod: 5, slowPeriod: 15 },
    },
    candles,
  );
  assert.ok(result.metrics.totalReturn > 0, `totalReturn=${result.metrics.totalReturn}`);
});

// =============================================================================
// 15. PerformanceMetrics sharpe 合理
// =============================================================================

test('PerformanceMetrics：sharpeRatio 是有限数字', () => {
  const candles = upTrendCandles(200, 100, 1);
  const engine = new BacktestEngine();
  const result = engine.run(
    {
      symbol: 'BTCUSDT',
      startTime: 0,
      endTime: 0,
      initialCapital: 10000,
      commission: 0,
      slippage: 0,
      leverage: 1,
      strategy: 'macd',
      params: {},
    },
    candles,
  );
  assert.ok(Number.isFinite(result.metrics.sharpeRatio));
  assert.ok(result.metrics.maxDrawdown >= 0 && result.metrics.maxDrawdown <= 1);
  assert.ok(result.metrics.winRate >= 0 && result.metrics.winRate <= 1);
});

// =============================================================================
// 16. LiveSignalEngine 实时信号
// =============================================================================

test('LiveSignalEngine：喂入 K 线触发订阅回调', () => {
  const engine = new LiveSignalEngine();
  const received: any[] = [];
  engine.subscribe('BTCUSDT', 'two-ma', (sig) => received.push(sig), {
    fastPeriod: 3,
    slowPeriod: 8,
  });
  // 先喂历史
  const history = vShapeCandles(40);
  for (const c of history) engine.onKline('BTCUSDT', c);
  // 至少要产生过信号
  assert.ok(received.length > 0, '实时信号引擎应产生至少 1 个信号');
  // 取消订阅
  const unsub = engine.subscribe('ETHUSDT', 'two-ma', () => {});
  unsub();
  assert.equal(engine.size(), 1);
});

// =============================================================================
// 17. PortfolioManager calculateSharpe
// =============================================================================

test('PortfolioManager.calculateSharpe：稳定正收益 > 稳定负收益', () => {
  const pm = new PortfolioManager();
  const goodReturns = Array.from({ length: 50 }, () => 0.005);
  const badReturns = Array.from({ length: 50 }, () => -0.005);
  const sGood = pm.calculateSharpe(goodReturns);
  const sBad = pm.calculateSharpe(badReturns);
  assert.ok(sGood > 0);
  assert.ok(sBad < 0);
  assert.ok(sGood > sBad);
});

// =============================================================================
// 18. PortfolioManager calculateVaR
// =============================================================================

test('PortfolioManager.calculateVaR：95% 置信度返回正损失', () => {
  const pm = new PortfolioManager();
  const returns = Array.from({ length: 100 }, (_, i) => (Math.random() - 0.5) * 0.04);
  // 用固定 seed 序列，避免随机性
  const fixed = Array.from({ length: 100 }, (_, i) => Math.sin(i) * 0.02);
  const var95 = pm.calculateVaR(fixed, 0.95);
  assert.ok(var95 >= 0, 'VaR 95% 应为正损失');
  const var99 = pm.calculateVaR(fixed, 0.99);
  assert.ok(var99 >= var95, '99% VaR ≥ 95% VaR');
});

// =============================================================================
// 19. PortfolioManager rebalance
// =============================================================================

test('PortfolioManager.rebalance：偏离 > 5% 触发调仓', () => {
  const pm = new PortfolioManager();
  pm.addPosition({
    symbol: 'BTCUSDT',
    side: 'long',
    entryPrice: 100,
    quantity: 10,
    entryTime: 0,
    unrealizedPnl: 0,
  });
  pm.addPosition({
    symbol: 'ETHUSDT',
    side: 'long',
    entryPrice: 100,
    quantity: 100,
    entryTime: 0,
    unrealizedPnl: 0,
  });
  const totalEquity = 100 * 10 + 100 * 100; // BTC 占 ~9%, ETH 占 ~91%
  const { trades } = pm.rebalance(
    [
      { symbol: 'BTCUSDT', weight: 0.5 },
      { symbol: 'ETHUSDT', weight: 0.5 },
    ],
    totalEquity,
    0.05,
  );
  assert.ok(trades.length > 0, '偏离 5% 以上应触发调仓');
  assert.ok(trades.some((t) => t.symbol === 'BTCUSDT'));
});

// =============================================================================
// 20. 缓存命中
// =============================================================================

test('BacktestEngine：相同 config 二次运行命中缓存', () => {
  const candles = upTrendCandles(60);
  const engine = new BacktestEngine();
  const config = {
    symbol: 'BTCUSDT',
    startTime: 0,
    endTime: 0,
    initialCapital: 10000,
    commission: 0.001,
    slippage: 0.0005,
    leverage: 1,
    strategy: 'macd' as const,
    params: {},
  };
  const r1 = engine.run(config, candles);
  const r2 = engine.run(config, candles);
  assert.strictEqual(r1, r2, '相同 config 应返回同一 result 引用');
});

// =============================================================================
// 21. 多策略多周期 runMany
// =============================================================================

test('BacktestEngine.runMany：批量回测', () => {
  const candles = upTrendCandles(80);
  const engine = new BacktestEngine();
  const results = engine.runMany([
    {
      config: {
        symbol: 'BTCUSDT',
        startTime: 0,
        endTime: 0,
        initialCapital: 10000,
        commission: 0.001,
        slippage: 0.0005,
        leverage: 1,
        strategy: 'two-ma',
        params: { fastPeriod: 5, slowPeriod: 20 },
      },
      candles,
    },
    {
      config: {
        symbol: 'BTCUSDT',
        startTime: 0,
        endTime: 0,
        initialCapital: 10000,
        commission: 0.001,
        slippage: 0.0005,
        leverage: 1,
        strategy: 'macd',
        params: {},
      },
      candles,
    },
  ]);
  assert.equal(results.length, 2);
  assert.ok(results[0].equity.length > 0);
  assert.ok(results[1].equity.length > 0);
});

// =============================================================================
// 22. 突破策略：新低卖出
// =============================================================================

test('突破策略：跌破前低产生 close/sell 信号', () => {
  const candles: Candle[] = [];
  for (let i = 0; i < 20; i++) {
    candles.push(mkCandle(i * 60_000, 100 + (i % 2), { high: 102, low: 99 }));
  }
  // 突然大阴线
  candles.push(mkCandle(20 * 60_000, 90, { high: 91, low: 85, open: 95 }));
  const strat = new BreakoutStrategy({ lookback: 20, shortable: false });
  const sig = strat.evaluate(candles, 20);
  assert.ok(sig !== null);
  assert.equal(sig!.type, 'close');
});
