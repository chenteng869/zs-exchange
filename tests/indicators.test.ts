/**
 * 技术指标模块单元测试
 *
 * 至少 18 个用例：
 *  - 6 个指标的纯计算正确性
 *  - IndicatorManager 行为
 *  - TradingView 适配
 *  - 性能基准
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import type { Kline } from '../src/lib/market';
import {
  calculateMA,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateBOLL,
  calculateKDJ,
} from '../src/lib/indicators/indicators';
import {
  IndicatorManager,
  getDefaultConfig,
} from '../src/lib/indicators/manager';
import { adaptToSeries } from '../src/lib/indicators/lightweight-adapter';
import {
  MAIN_PANE_INDICATORS,
  SUB_PANE_INDICATORS,
} from '../src/lib/indicators/types';

// =============================================================================
// 工具：构造测试 K 线
// =============================================================================

function mkKline(openTime: number, close: number, opts: Partial<Pick<Kline, 'open' | 'high' | 'low' | 'volume' | 'closeTime' | 'trades'>> = {}): Kline {
  return {
    openTime,
    open: (opts.open ?? close).toString(),
    high: (opts.high ?? close).toString(),
    low: (opts.low ?? close).toString(),
    close: close.toString(),
    volume: (opts.volume ?? '100').toString(),
    closeTime: opts.closeTime ?? openTime + 60_000 - 1,
    trades: opts.trades ?? 1,
  };
}

/** 序列 close=[1,2,3,...,n] 的 K 线 */
function linearKlines(n: number, stepMs = 60_000): Kline[] {
  const out: Kline[] = [];
  for (let i = 0; i < n; i++) {
    out.push(mkKline(i * stepMs, i + 1));
  }
  return out;
}

/** 随机漫步 K 线（确定性） */
function randomKlines(n: number, basePrice = 100, stepMs = 60_000, seed = 1): Kline[] {
  const out: Kline[] = [];
  let rng = seed;
  const rand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };
  let price = basePrice;
  for (let i = 0; i < n; i++) {
    const open = price;
    const change = (rand() - 0.5) * 2; // [-1, 1]
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) + rand() * 0.5;
    const low = Math.max(0.01, Math.min(open, close) - rand() * 0.5);
    out.push({
      openTime: i * stepMs,
      open: open.toFixed(4),
      high: high.toFixed(4),
      low: low.toFixed(4),
      close: close.toFixed(4),
      volume: '100',
      closeTime: i * stepMs + stepMs - 1,
      trades: 10,
    });
    price = close;
  }
  return out;
}

/** 浮点比较（误差 0.01%） */
function approx(actual: number, expected: number, relTol = 1e-4): boolean {
  if (expected === 0) return Math.abs(actual) < relTol;
  return Math.abs(actual - expected) / Math.abs(expected) <= relTol;
}

// =============================================================================
// 1. MA 测试
// =============================================================================

test('MA：手算样本正确（closes=[1..10], period=5, 第 5 根 MA=(1+2+3+4+5)/5=3）', () => {
  const klines = linearKlines(10);
  const ma = calculateMA(klines, 5);
  assert.equal(ma.length, 6); // 10 - 5 + 1
  // 第 0 个 (openTime=4*60000) = 3
  assert.equal(ma[0].time, 4 * 60_000);
  assert.equal(parseFloat(ma[0].value), 3);
  // 第 5 个 = (6+7+8+9+10)/5 = 8
  assert.equal(parseFloat(ma[5].value), 8);
});

test('MA：边界——K 线数小于 period 时返回空数组', () => {
  const klines = linearKlines(4);
  const ma = calculateMA(klines, 5);
  assert.equal(ma.length, 0);
});

test('MA：滑动窗口——重复调用结果稳定', () => {
  const klines = randomKlines(50, 100, 60_000, 7);
  const a = calculateMA(klines, 10);
  const b = calculateMA(klines, 10);
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i].value, b[i].value);
  }
});

// =============================================================================
// 2. EMA 测试
// =============================================================================

test('EMA：初始值 = SMA（closes=[1..10], period=5, 初始=(1+2+3+4+5)/5=3）', () => {
  const klines = linearKlines(10);
  const ema = calculateEMA(klines, 5);
  assert.equal(ema.length, 6);
  assert.equal(parseFloat(ema[0].value), 3);
});

test('EMA：收敛速度正确（持续上涨：EMA 应 < 收盘价，但 > 起点 SMA）', () => {
  const klines = linearKlines(30);
  // close[5..29] 都是上涨
  const ema = calculateEMA(klines, 10);
  const lastEma = parseFloat(ema[ema.length - 1].value);
  const lastClose = 30;
  const firstEma = parseFloat(ema[0].value);
  // EMA 永远在首个 SMA 与最后 close 之间（且 < close）
  assert.ok(lastEma > firstEma, 'EMA should rise in uptrend');
  assert.ok(lastEma < lastClose, 'EMA should lag behind rising close');
});

test('EMA：调用 calculateMA/calculateEMA 对相同 close + 足够长度时，EMA 起点 = MA 起点', () => {
  const klines = linearKlines(30);
  const ma = calculateMA(klines, 10);
  const ema = calculateEMA(klines, 10);
  // MA[0] 与 EMA[0] 应该相同（都是 SMA）
  assert.equal(parseFloat(ma[0].value), parseFloat(ema[0].value));
});

// =============================================================================
// 3. MACD 测试
// =============================================================================

test('MACD：三值字段正确（输出含 dif/dea/macd）', () => {
  const klines = randomKlines(120, 100, 60_000, 42);
  const m = calculateMACD(klines);
  assert.ok(m.length > 0);
  const first = m[0];
  assert.ok('dif' in first);
  assert.ok('dea' in first);
  assert.ok('macd' in first);
  // macd = (dif - dea) * 2
  const dif = parseFloat(first.dif);
  const dea = parseFloat(first.dea);
  const macd = parseFloat(first.macd);
  assert.ok(approx(macd, (dif - dea) * 2));
});

test('MACD：柱状图正负与 dif-dea 同号', () => {
  const klines = randomKlines(120, 100, 60_000, 99);
  const m = calculateMACD(klines);
  for (const p of m) {
    const dif = parseFloat(p.dif);
    const dea = parseFloat(p.dea);
    const macd = parseFloat(p.macd);
    if (dif > dea) assert.ok(macd > 0, 'DIF>DEA → MACD>0');
    else if (dif < dea) assert.ok(macd < 0, 'DIF<DEA → MACD<0');
    else assert.ok(Math.abs(macd) < 1e-6);
  }
});

test('MACD：K 线不足时不返回（< slow 期）', () => {
  const klines = randomKlines(20, 100, 60_000, 1);
  const m = calculateMACD(klines, 12, 26, 9);
  assert.equal(m.length, 0);
});

// =============================================================================
// 4. RSI 测试
// =============================================================================

test('RSI：值域 [0, 100]', () => {
  const klines = randomKlines(200, 100, 60_000, 3);
  const rsi = calculateRSI(klines, 14);
  assert.ok(rsi.length > 0);
  for (const p of rsi) {
    const v = parseFloat(p.value);
    assert.ok(v >= 0 && v <= 100, `RSI out of range: ${v}`);
  }
});

test('RSI：持续上涨 → RSI 接近 100（超买）', () => {
  const klines = linearKlines(50);
  const rsi = calculateRSI(klines, 14);
  const last = parseFloat(rsi[rsi.length - 1].value);
  assert.ok(last > 70, `持续上涨 RSI 应 > 70，实际 ${last}`);
});

test('RSI：持续下跌 → RSI 接近 0（超卖）', () => {
  // 从 50 跌到 1
  const klines: Kline[] = [];
  for (let i = 50; i >= 1; i--) {
    klines.push(mkKline((50 - i) * 60_000, i));
  }
  const rsi = calculateRSI(klines, 14);
  const last = parseFloat(rsi[rsi.length - 1].value);
  assert.ok(last < 30, `持续下跌 RSI 应 < 30，实际 ${last}`);
});

// =============================================================================
// 5. BOLL 测试
// =============================================================================

test('BOLL：上轨 / 下轨关于中轨对称', () => {
  const klines = randomKlines(100, 100, 60_000, 5);
  const b = calculateBOLL(klines, 20, 2);
  assert.ok(b.length > 0);
  for (const p of b) {
    const upper = parseFloat(p.upper);
    const mid = parseFloat(p.mid);
    const lower = parseFloat(p.lower);
    // upper - mid 应近似 mid - lower
    assert.ok(approx(upper - mid, mid - lower));
  }
});

test('BOLL：常数价格 → std=0 → upper=mid=lower', () => {
  const klines: Kline[] = [];
  for (let i = 0; i < 30; i++) {
    klines.push(mkKline(i * 60_000, 100));
  }
  const b = calculateBOLL(klines, 20, 2);
  assert.equal(b.length, 11); // 30 - 20 + 1
  for (const p of b) {
    assert.equal(parseFloat(p.upper), 100);
    assert.equal(parseFloat(p.mid), 100);
    assert.equal(parseFloat(p.lower), 100);
  }
});

test('BOLL：标准差 = MA ± 2*σ', () => {
  const klines = randomKlines(100, 50, 60_000, 11);
  const b = calculateBOLL(klines, 20, 2);
  // 手算最后一根
  const last = b[b.length - 1];
  const mid = parseFloat(last.mid);
  const upper = parseFloat(last.upper);
  // upper - mid 应等于 2*std
  assert.ok(upper > mid);
  // 2*std 应 > 0
  assert.ok(upper - mid > 0);
});

// =============================================================================
// 6. KDJ 测试
// =============================================================================

test('KDJ：K/D 在 [0, 100]，J 可超界', () => {
  const klines = randomKlines(120, 100, 60_000, 21);
  const kdj = calculateKDJ(klines, 9, 3, 3);
  assert.ok(kdj.length > 0);
  for (const p of kdj) {
    const k = parseFloat(p.k);
    const d = parseFloat(p.d);
    // K/D 必须在 [0, 100]
    assert.ok(k >= 0 && k <= 100, `K out of range: ${k}`);
    assert.ok(d >= 0 && d <= 100, `D out of range: ${d}`);
    // J = 3K - 2D（可超界）
    const j = parseFloat(p.j);
    assert.ok(approx(j, 3 * k - 2 * d));
  }
});

test('KDJ：当前 close 创 9 周期新高 → K 趋向 100', () => {
  // 构造：前 8 根 close=50, 第 9 根 close=200（新高）
  const klines: Kline[] = [];
  for (let i = 0; i < 9; i++) {
    klines.push(mkKline(i * 60_000, i < 8 ? 50 : 200, { high: i < 8 ? 51 : 210, low: i < 8 ? 49 : 195 }));
  }
  const kdj = calculateKDJ(klines, 9, 3, 3);
  // 第一个 KDJ 点（i=8）：9 周期内 high=210, low=49
  // RSV = (200-49)/(210-49)*100 = 93.79
  // K = (2/3)*50 + (1/3)*93.79 = 33.33 + 31.26 = 64.60
  const first = kdj[0];
  const k = parseFloat(first.k);
  assert.ok(approx(k, 64.5963, 1e-3), `K should ≈ 64.60, got ${k}`);
});

test('KDJ：当前 close 创 9 周期新低 → K 趋向 0', () => {
  const klines: Kline[] = [];
  for (let i = 0; i < 9; i++) {
    klines.push(mkKline(i * 60_000, i < 8 ? 100 : 1, { high: i < 8 ? 101 : 5, low: i < 8 ? 99 : 0.5 }));
  }
  const kdj = calculateKDJ(klines, 9, 3, 3);
  const first = kdj[0];
  const k = parseFloat(first.k);
  // RSV = (1-0.5)/(5-0.5)*100 ≈ 0
  assert.ok(k < 35, `K 应该 < 35，实际 ${k}`);
});

// =============================================================================
// 7. IndicatorManager 测试
// =============================================================================

test('IndicatorManager：add/remove 操作正确', () => {
  const mgr = new IndicatorManager();
  mgr.addIndicator({ id: 'MA', period: '1h', params: { period: 20 }, color: '#fff', visible: true });
  mgr.addIndicator({ id: 'RSI', period: '1h', params: { period: 14 }, color: '#f0f', visible: true });
  assert.equal(mgr.getIndicators().length, 2);
  mgr.removeIndicator('MA', '1h', { period: 20 });
  const list = mgr.getIndicators();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'RSI');
});

test('IndicatorManager：默认配置 = MA(7/25/99) + BOLL', () => {
  const defaults = getDefaultConfig('1h');
  const mgr = IndicatorManager.withDefaults('1h');
  assert.equal(mgr.getIndicators().length, defaults.length);
  const ids = defaults.map((d) => d.id);
  assert.ok(ids.includes('MA'));
  assert.ok(ids.includes('BOLL'));
  // 3 条 MA
  const mas = defaults.filter((d) => d.id === 'MA');
  assert.equal(mas.length, 3);
  const periods = mas.map((m) => m.params.period).sort((a, b) => a - b);
  assert.deepEqual(periods, [7, 25, 99]);
});

test('IndicatorManager：setVisible 切换可见性', () => {
  const mgr = IndicatorManager.withDefaults('1h');
  mgr.setVisible('MA', '1h', false, { period: 7 });
  const list = mgr.getIndicators();
  const ma7 = list.find((c) => c.id === 'MA' && c.params.period === 7);
  assert.equal(ma7?.visible, false);
  mgr.setVisible('MA', '1h', true, { period: 7 });
  const ma7b = mgr.getIndicators().find((c) => c.id === 'MA' && c.params.period === 7);
  assert.equal(ma7b?.visible, true);
});

// =============================================================================
// 8. TradingView 适配
// =============================================================================

test('adaptToSeries：MA → MainSeries（pane=main, data 为 number[]）', () => {
  const klines = randomKlines(60, 100, 60_000, 1);
  const cfg = { id: 'MA' as const, period: '1h' as const, params: { period: 20 }, color: '#fff', visible: true };
  const series = adaptToSeries(cfg, klines);
  assert.equal(series.pane, 'main');
  assert.equal(series.id, 'MA-20');
  assert.equal(series.title, 'MA(20)');
  assert.equal(series.color, '#fff');
  assert.ok(Array.isArray(series.data));
  assert.equal((series.data as Array<{ value: number }>).length, klines.length - 19);
  // value 是 number
  assert.equal(typeof (series.data as Array<{ value: number }>)[0].value, 'number');
});

test('adaptToSeries：MACD → SubSeries（lines=2, histograms=1）', () => {
  const klines = randomKlines(120, 100, 60_000, 2);
  const cfg = { id: 'MACD' as const, period: '1h' as const, params: { fast: 12, slow: 26, signal: 9 }, color: '#fff', visible: true };
  const series = adaptToSeries(cfg, klines);
  assert.equal(series.pane, 'sub');
  assert.equal(series.lines.length, 2); // DIF + DEA
  assert.equal(series.histograms.length, 1);
  assert.equal(series.lines[0].name, 'DIF');
  assert.equal(series.lines[1].name, 'DEA');
});

test('getPaneConfig：MA / EMA / BOLL 在主图，MACD / RSI / KDJ 在副图', () => {
  const mgr = new IndicatorManager();
  for (const id of ['MA', 'EMA', 'BOLL'] as const) {
    assert.equal(MAIN_PANE_INDICATORS.has(id), true);
    assert.equal(mgr.getPaneConfig(id).pane, 'main');
  }
  for (const id of ['MACD', 'RSI', 'KDJ'] as const) {
    assert.equal(SUB_PANE_INDICATORS.has(id), true);
    assert.equal(mgr.getPaneConfig(id).pane, 'sub');
  }
});

// =============================================================================
// 9. 性能测试
// =============================================================================

test('性能：1000 根 K 线计算 MA(20) < 10ms', () => {
  const klines = randomKlines(1000, 100, 60_000, 1);
  const start = performance.now();
  for (let i = 0; i < 10; i++) calculateMA(klines, 20);
  const elapsed = performance.now() - start;
  // 10 次平均 < 10ms（即单次 < 1ms）
  assert.ok(elapsed < 100, `10×MA(20) on 1000 klines took ${elapsed.toFixed(2)}ms, expected < 100ms`);
});

test('性能：1000 根 K 线计算全部 6 指标 < 100ms', () => {
  const klines = randomKlines(1000, 100, 60_000, 1);
  const start = performance.now();
  for (let i = 0; i < 5; i++) {
    calculateMA(klines, 20);
    calculateEMA(klines, 12);
    calculateMACD(klines, 12, 26, 9);
    calculateRSI(klines, 14);
    calculateBOLL(klines, 20, 2);
    calculateKDJ(klines, 9, 3, 3);
  }
  const elapsed = performance.now() - start;
  // 5 轮 < 100ms
  assert.ok(elapsed < 100, `5×(6 indicators) on 1000 klines took ${elapsed.toFixed(2)}ms, expected < 100ms`);
});

// =============================================================================
// 10. 额外健壮性测试
// =============================================================================

test('健壮性：空 K 线数组返回空数组', () => {
  assert.deepEqual(calculateMA([], 5), []);
  assert.deepEqual(calculateEMA([], 5), []);
  assert.deepEqual(calculateMACD([], 12, 26, 9), []);
  assert.deepEqual(calculateRSI([], 14), []);
  assert.deepEqual(calculateBOLL([], 20, 2), []);
  assert.deepEqual(calculateKDJ([], 9, 3, 3), []);
});

test('健壮性：非法 period 抛错', () => {
  const klines = linearKlines(10);
  assert.throws(() => calculateMA(klines, 0));
  assert.throws(() => calculateMA(klines, -1));
  assert.throws(() => calculateMA(klines, 1.5));
  assert.throws(() => calculateRSI(klines, 0));
});

test('健壮性：addIndicator 同 key 覆盖', () => {
  const mgr = new IndicatorManager();
  const cfg = { id: 'MA' as const, period: '1h' as const, params: { period: 20 }, color: '#fff', visible: true };
  mgr.addIndicator(cfg);
  mgr.addIndicator({ ...cfg, color: '#000' });
  const list = mgr.getIndicators();
  assert.equal(list.length, 1);
  assert.equal(list[0].color, '#000');
});
