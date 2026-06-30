/**
 * 投资组合引擎测试
 *
 * 至少 18 个用例，覆盖：
 *  - AssetAggregator（4）：addAsset / getUserAssets / calculateMarketValue / calculateUnrealizedPnl
 *  - RiskEngine（8）：Volatility / Sharpe / Sortino / VaR / CVaR / MaxDrawdown / HHI / EffectiveAssets
 *  - AllocationEngine（3）：equalWeight / riskParity / sixtyForty
 *  - RebalanceEngine（2）：generatePlan / executePlan
 *  - AttributionEngine（1）：Brinson
 *  - PortfolioEngine（3）：getPortfolio / getRiskMetrics / 再平衡触发
 *
 * 运行：node --import tsx tests/portfolio-engine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AssetAggregator,
  RiskEngine,
  AllocationEngine,
  RebalanceEngine,
  AttributionEngine,
  PortfolioEngine,
  makeAsset,
  createPortfolioEngine,
  combineReturns,
  returnsFromPrices,
  CONCENTRATION_WARNING,
  MAX_DRAWDOWN_ALERT,
  DEFAULT_DRIFT_THRESHOLD,
  type PortfolioAsset,
  type AllocationTarget,
  type RebalancePlan,
} from '../src/lib/portfolio';

// =============================================================================
// 工具：构造测试数据
// =============================================================================

function mkAsset(
  sym: string,
  assetClass: PortfolioAsset['assetClass'],
  opts: Partial<PortfolioAsset> = {},
): PortfolioAsset {
  return makeAsset({
    userId: 'u1',
    symbol: sym,
    assetClass,
    quantity: opts.quantity ?? '0',
    avgCost: opts.avgCost ?? '0',
    markPrice: opts.markPrice ?? '0',
    marketValue: opts.marketValue,
    unrealizedPnl: opts.unrealizedPnl,
    unrealizedPnlPct: opts.unrealizedPnlPct,
    allocation: opts.allocation,
    meta: opts.meta,
  });
}

/** 上涨趋势日收益 */
function upTrend(n: number, mu = 0.001, sigma = 0.01): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(mu + sigma * Math.sin(i * 0.7));
  }
  return out;
}

/** 波动性日收益（正态近似） */
function volatileReturns(n: number, sigma = 0.05, mu = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(mu + sigma * Math.sin(i) * Math.cos(i * 0.3));
  }
  return out;
}

/** 上升权益曲线（带小回撤） */
function risingEquityWithDD(n: number, start = 100, end = 200, dd = 0.1): number[] {
  const out: number[] = [];
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    if (i < mid) {
      // 前半段：先小幅回撤再涨
      const peak = start + (end - start) * 0.2;
      const trough = peak * (1 - dd);
      const t = i / Math.max(1, mid - 1);
      out.push(peak - (peak - trough) * t);
    } else {
      // 后半段：恢复 + 继续上涨
      const trough = start * (1 - dd) + (end - start) * 0.2;
      const t = (i - mid) / Math.max(1, n - 1 - mid);
      out.push(trough + (end - trough) * t);
    }
  }
  return out;
}

/** V 形权益曲线（最大回撤已知） */
function vShapeEquity(n: number): number[] {
  // 100 → 60 → 100  → maxDD = 40/100 = 0.4
  const out: number[] = [];
  const mid = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    if (i < mid) {
      out.push(100 - (40 * i) / Math.max(1, mid - 1));
    } else {
      out.push(60 + (40 * (i - mid)) / Math.max(1, n - 1 - mid));
    }
  }
  return out;
}

// =============================================================================
// 1. AssetAggregator.addAsset / getUserAssets
// =============================================================================

test('AssetAggregator: addAsset + getUserAssets', () => {
  const agg = new AssetAggregator();
  agg.addAsset(mkAsset('BTC', 'spot', { quantity: '1', avgCost: '30000', markPrice: '65000' }));
  agg.addAsset(mkAsset('ETH', 'spot', { quantity: '5', avgCost: '2500', markPrice: '3500' }));
  agg.addAsset(mkAsset('USDC', 'fiat', { quantity: '10000', avgCost: '1', markPrice: '1' }));
  const list = agg.getUserAssets('u1');
  assert.equal(list.length, 3);
  assert.ok(list.find((a) => a.symbol === 'BTC'));
  assert.ok(list.find((a) => a.symbol === 'ETH'));
});

// =============================================================================
// 2. AssetAggregator 按资产类汇总
// =============================================================================

test('AssetAggregator: getByClass 按资产类汇总', () => {
  const agg = new AssetAggregator();
  agg.addAsset(mkAsset('BTC', 'spot', { quantity: '1' }));
  agg.addAsset(mkAsset('ETH', 'spot', { quantity: '5' }));
  agg.addAsset(mkAsset('USDC', 'fiat', { quantity: '100' }));
  agg.addAsset(mkAsset('BTCPERP', 'perp', { quantity: '0.5', markPrice: '65000' }));
  const spot = agg.getByClass('u1', 'spot');
  const perp = agg.getByClass('u1', 'perp');
  const fiat = agg.getByClass('u1', 'fiat');
  assert.equal(spot.length, 2);
  assert.equal(perp.length, 1);
  assert.equal(fiat.length, 1);
});

// =============================================================================
// 3. AssetAggregator calculateMarketValue
// =============================================================================

test('AssetAggregator: calculateMarketValue = qty × markPrice', () => {
  const agg = new AssetAggregator();
  const a = mkAsset('BTC', 'spot', { quantity: '2', markPrice: '50000' });
  const mv = agg.calculateMarketValue(a);
  assert.equal(mv, '100000');
});

// =============================================================================
// 4. AssetAggregator calculateUnrealizedPnl
// =============================================================================

test('AssetAggregator: calculateUnrealizedPnl = (mark - avg) × qty', () => {
  const agg = new AssetAggregator();
  const a = mkAsset('BTC', 'spot', { quantity: '1', avgCost: '30000', markPrice: '50000' });
  const pnl = agg.calculateUnrealizedPnl(a);
  assert.equal(pnl, '20000');
});

// =============================================================================
// 5. RiskEngine calculateVolatility
// =============================================================================

test('RiskEngine: calculateVolatility 年化波动率', () => {
  const risk = new RiskEngine();
  const rets = volatileReturns(100, 0.05);
  const v = risk.calculateVolatility(rets);
  assert.ok(v > 0);
  assert.ok(v < 5); // sanity
});

// =============================================================================
// 6. RiskEngine calculateSharpe > 0
// =============================================================================

test('RiskEngine: calculateSharpe 上涨序列 Sharpe > 0', () => {
  const risk = new RiskEngine();
  const rets = upTrend(252, 0.005, 0.01); // 日均 0.5%，波动 1%
  const s = risk.calculateSharpe(rets);
  assert.ok(s > 0, `Sharpe should be > 0, got ${s}`);
});

// =============================================================================
// 7. RiskEngine calculateSortino
// =============================================================================

test('RiskEngine: calculateSortino 上涨序列 > 0', () => {
  const risk = new RiskEngine();
  const rets = upTrend(252, 0.003, 0.02);
  const s = risk.calculateSortino(rets);
  assert.ok(s > 0, `Sortino should be > 0, got ${s}`);
});

// =============================================================================
// 8. RiskEngine calculateVaR
// =============================================================================

test('RiskEngine: calculateVaR 95% 损失为正', () => {
  const risk = new RiskEngine();
  const rets = volatileReturns(500, 0.05, 0);
  const var95 = risk.calculateVaR(rets, 0.95);
  assert.ok(var95 > 0, `VaR95 should be > 0, got ${var95}`);
  const var99 = risk.calculateVaR(rets, 0.99);
  assert.ok(var99 >= var95, 'VaR99 >= VaR95');
});

// =============================================================================
// 9. RiskEngine calculateCVaR
// =============================================================================

test('RiskEngine: calculateCVaR >= VaR', () => {
  const risk = new RiskEngine();
  const rets = volatileReturns(500, 0.05, 0);
  const var95 = risk.calculateVaR(rets, 0.95);
  const cvar = risk.calculateCVaR(rets, 0.95);
  assert.ok(cvar >= var95, `CVaR (${cvar}) should be >= VaR (${var95})`);
});

// =============================================================================
// 10. RiskEngine calculateMaxDrawdown
// =============================================================================

test('RiskEngine: calculateMaxDrawdown V 形 = 0.4', () => {
  const risk = new RiskEngine();
  const eq = vShapeEquity(100);
  const mdd = risk.calculateMaxDrawdown(eq);
  assert.ok(Math.abs(mdd - 0.4) < 1e-6, `MDD should be 0.4, got ${mdd}`);
});

// =============================================================================
// 11. RiskEngine calculateHHI (1 资产 = 1)
// =============================================================================

test('RiskEngine: calculateHHI 单资产 = 1，等权 = 1/N', () => {
  const risk = new RiskEngine();
  assert.equal(risk.calculateHHI([1]), 1);
  assert.equal(risk.calculateHHI([0.5, 0.5]), 0.5);
  assert.equal(risk.calculateHHI([1 / 3, 1 / 3, 1 / 3]), 1 / 3);
  assert.equal(risk.calculateHHI([0.6, 0.4]), 0.52);
});

// =============================================================================
// 12. RiskEngine calculateEffectiveAssets
// =============================================================================

test('RiskEngine: calculateEffectiveAssets 1/HHI', () => {
  const risk = new RiskEngine();
  assert.equal(risk.calculateEffectiveAssets([1]), 1);
  assert.equal(risk.calculateEffectiveAssets([0.5, 0.5]), 2);
  assert.ok(Math.abs(risk.calculateEffectiveAssets([1 / 3, 1 / 3, 1 / 3]) - 3) < 1e-6);
});

// =============================================================================
// 13. AllocationEngine equalWeight
// =============================================================================

test('AllocationEngine: equalWeight 等分', () => {
  const ae = new AllocationEngine();
  const targets = ae.equalWeight(['BTC', 'ETH', 'SOL', 'USDC']);
  assert.equal(targets.length, 4);
  const sum = targets.reduce((s, t) => s + Number(t.targetWeight), 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `sum=${sum}`);
  for (const t of targets) assert.equal(Number(t.targetWeight), 0.25);
});

// =============================================================================
// 14. AllocationEngine riskParity
// =============================================================================

test('AllocationEngine: riskParity 高波动资产权重更低', () => {
  const ae = new AllocationEngine();
  // 资产 A 波动大，资产 B 稳定
  const retA = volatileReturns(100, 0.10, 0);
  const retB = volatileReturns(100, 0.01, 0);
  const tg = ae.riskParity([retA, retB]);
  assert.equal(tg.length, 2);
  const wA = Number(tg[0].targetWeight);
  const wB = Number(tg[1].targetWeight);
  assert.ok(wB > wA, `稳定资产权重 ${wB} 应大于波动资产 ${wA}`);
  // 合计 ≈ 1
  const sum = wA + wB;
  assert.ok(Math.abs(sum - 1) < 1e-6, `sum=${sum}`);
});

// =============================================================================
// 15. AllocationEngine 60-40
// =============================================================================

test('AllocationEngine: sixtyForty 60/40 配比', () => {
  const ae = new AllocationEngine();
  const tg = ae.sixtyForty(['SPY', 'BTC'], ['AGG', 'USDC']);
  const sum = tg.reduce((s, t) => s + Number(t.targetWeight), 0);
  assert.ok(Math.abs(sum - 1) < 1e-6);
  // equity 合计 = 0.6
  const eqSum = tg.filter((t) => ['SPY', 'BTC'].includes(t.symbol)).reduce((s, t) => s + Number(t.targetWeight), 0);
  const bdSum = tg.filter((t) => ['AGG', 'USDC'].includes(t.symbol)).reduce((s, t) => s + Number(t.targetWeight), 0);
  assert.ok(Math.abs(eqSum - 0.6) < 1e-6);
  assert.ok(Math.abs(bdSum - 0.4) < 1e-6);
});

// =============================================================================
// 16. RebalanceEngine generatePlan
// =============================================================================

test('RebalanceEngine: generatePlan 偏离超阈值生成交易', () => {
  const rb = new RebalanceEngine({ driftThreshold: 0.05 });
  const assets: PortfolioAsset[] = [
    mkAsset('BTC', 'spot', { quantity: '1', markPrice: '50000', marketValue: '50000' }),
    mkAsset('ETH', 'spot', { quantity: '100', markPrice: '3000', marketValue: '30000' }),
    mkAsset('USDC', 'fiat', { quantity: '20000', markPrice: '1', marketValue: '20000' }),
  ];
  // 重算 allocation（让 marketValue 与 allocation 一致）
  let total = 0;
  for (const a of assets) total += Number(a.marketValue);
  for (const a of assets) {
    a.allocation = (Number(a.marketValue) / total).toString();
  }
  // 当前权重 50/30/20，目标改为 30/30/40 → BTC 偏离 20% > 5%，USDC 偏离 20% > 5%
  const targets: AllocationTarget[] = [
    { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.3' },
    { symbol: 'ETH', assetClass: 'spot', targetWeight: '0.3' },
    { symbol: 'USDC', assetClass: 'fiat', targetWeight: '0.4' },
  ];
  const plan = rb.generatePlan('u1', assets, targets, 'threshold');
  assert.ok(plan.trades.length > 0, 'should generate at least 1 trade');
  assert.equal(plan.userId, 'u1');
  assert.equal(plan.status, 'pending');
});

// =============================================================================
// 17. RebalanceEngine executePlan
// =============================================================================

test('RebalanceEngine: executePlan 无 orderPlacer 时模拟执行', async () => {
  const rb = new RebalanceEngine({ driftThreshold: 0.05 });
  const assets: PortfolioAsset[] = [
    mkAsset('BTC', 'spot', { quantity: '0.1', markPrice: '50000', marketValue: '5000' }),
    mkAsset('USDC', 'fiat', { quantity: '95000', markPrice: '1', marketValue: '95000' }),
  ];
  let total = 0;
  for (const a of assets) total += Number(a.marketValue);
  for (const a of assets) {
    a.allocation = (Number(a.marketValue) / total).toString();
  }
  const targets: AllocationTarget[] = [
    { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.5' },
    { symbol: 'USDC', assetClass: 'fiat', targetWeight: '0.5' },
  ];
  const plan = rb.generatePlan('u1', assets, targets, 'threshold');
  const executed = await rb.executePlan(plan.id);
  assert.equal(executed.status, 'executed');
  assert.ok(executed.executedAt);
});

// =============================================================================
// 18. AttributionEngine Brinson
// =============================================================================

test('AttributionEngine: Brinson 三因素归因', () => {
  const at = new AttributionEngine();
  const result = at.brinsonAttribution(
    { start: 0, end: 1000 },
    {
      portfolioWeights: { BTC: 0.5, ETH: 0.3, USDC: 0.2 },
      benchmarkWeights: { BTC: 0.4, ETH: 0.4, USDC: 0.2 },
      portfolioReturns: { BTC: 0.1, ETH: 0.15, USDC: 0.02 },
      benchmarkReturns: { BTC: 0.08, ETH: 0.1, USDC: 0.02 },
    },
  );
  // 配置效应 = (0.5-0.4)*0.08 + (0.3-0.4)*0.1 + (0.2-0.2)*0.02 = 0.008 - 0.01 + 0 = -0.002
  assert.ok(Math.abs(Number(result.allocationEffect) - (-0.002)) < 1e-9);
  // 选股效应 = 0.4*(0.1-0.08) + 0.4*(0.15-0.1) + 0.2*(0.02-0.02) = 0.008 + 0.02 + 0 = 0.028
  assert.ok(Math.abs(Number(result.selectionEffect) - 0.028) < 1e-9);
  // 交互效应 = (0.5-0.4)*(0.1-0.08) + (0.3-0.4)*(0.15-0.1) + 0 = 0.002 - 0.005 = -0.003
  assert.ok(Math.abs(Number(result.interactionEffect) - (-0.003)) < 1e-9);
  // 总收益 = 0.5*0.1 + 0.3*0.15 + 0.2*0.02 = 0.05 + 0.045 + 0.004 = 0.099
  assert.ok(Math.abs(Number(result.totalReturn) - 0.099) < 1e-9);
});

// =============================================================================
// 19. PortfolioEngine getPortfolio
// =============================================================================

test('PortfolioEngine: getPortfolio 汇总多资产类', () => {
  const engine = createPortfolioEngine();
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'BTC',
      assetClass: 'spot',
      quantity: '1',
      avgCost: '30000',
      markPrice: '65000',
    }),
  );
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'ETH',
      assetClass: 'spot',
      quantity: '5',
      avgCost: '2500',
      markPrice: '3500',
    }),
  );
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'USDC',
      assetClass: 'fiat',
      quantity: '10000',
      avgCost: '1',
      markPrice: '1',
    }),
  );
  const p = engine.getPortfolio('u1');
  assert.equal(p.assets.length, 3);
  // 总价值 = 65000 + 5*3500 + 10000 = 65000 + 17500 + 10000 = 92500
  assert.equal(p.totalValue, '92500');
  // 总成本 = 30000 + 5*2500 + 10000 = 30000 + 12500 + 10000 = 52500
  assert.equal(p.totalCost, '52500');
  // 总 PnL = 92500 - 52500 = 40000
  assert.equal(p.totalPnl, '40000');
  // byAssetClass 至少包含 spot 与 fiat
  assert.ok(p.byAssetClass.spot);
  assert.ok(p.byAssetClass.fiat);
});

// =============================================================================
// 20. PortfolioEngine getRiskMetrics
// =============================================================================

test('PortfolioEngine: getRiskMetrics 风险指标计算', () => {
  const engine = createPortfolioEngine();
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'BTC',
      assetClass: 'spot',
      quantity: '1',
      avgCost: '30000',
      markPrice: '65000',
    }),
  );
  // 注入历史收益
  engine.pushReturns('BTC', volatileReturns(100, 0.04));
  engine.pushMarketReturns(volatileReturns(100, 0.05));
  // 注入快照
  for (let i = 0; i < 100; i++) {
    engine.pushSnapshot('u1', (60000 + i * 50).toString());
  }
  // 注入组合收益
  for (const r of volatileReturns(100, 0.04)) {
    engine.pushPortfolioReturn('u1', r);
  }
  const m = engine.getRiskMetrics('u1');
  assert.ok(typeof m.sharpeRatio === 'number');
  assert.ok(typeof m.maxDrawdown === 'number');
  assert.ok(m.volatility > 0);
  assert.ok(typeof m.concentration === 'number');
});

// =============================================================================
// 21. PortfolioEngine 再平衡触发
// =============================================================================

test('PortfolioEngine: 再平衡生成计划 + executeRebalance', async () => {
  const engine = createPortfolioEngine();
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'BTC',
      assetClass: 'spot',
      quantity: '0.1',
      avgCost: '30000',
      markPrice: '50000',
      marketValue: '5000',
    }),
  );
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'USDC',
      assetClass: 'fiat',
      quantity: '95000',
      avgCost: '1',
      markPrice: '1',
      marketValue: '95000',
    }),
  );
  // 50/50 目标
  engine.setAllocation('u1', [
    { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.5' },
    { symbol: 'USDC', assetClass: 'fiat', targetWeight: '0.5' },
  ]);
  // 监听 rebalance 事件
  const events: RebalancePlan[] = [];
  engine.onRebalanceTrigger((p) => events.push(p));
  const plan = engine.rebalance('u1', 'threshold');
  assert.ok(plan.id);
  assert.ok(plan.trades.length > 0, '偏离 95% → 50% 应产生交易');
  // 执行
  const executed = await engine.executeRebalance(plan.id);
  assert.equal(executed.status, 'executed');
  assert.equal(events.length, 1, 'rebalance 事件被触发一次');
});

// =============================================================================
// 22. 附加：组合相关性与 Beta
// =============================================================================

test('RiskEngine: calculateBeta 自身 Beta = 1', () => {
  const risk = new RiskEngine();
  const mkt = volatileReturns(200, 0.04);
  const beta = risk.calculateBeta(mkt, mkt);
  assert.ok(Math.abs(beta - 1) < 1e-6);
});

test('RiskEngine: calculateBeta 不相关 = 0', () => {
  const risk = new RiskEngine();
  const mkt = volatileReturns(200, 0.04);
  // 反向序列
  const neg = mkt.map((v) => -v);
  const beta = risk.calculateBeta(neg, mkt);
  assert.ok(Math.abs(beta + 1) < 0.2, `负相关 Beta 应接近 -1, got ${beta}`);
});

// =============================================================================
// 23. 附加：Calmar
// =============================================================================

test('RiskEngine: calculateCalmar 上升序列（带回撤） > 0', () => {
  const risk = new RiskEngine();
  const eq = risingEquityWithDD(365, 100, 200, 0.1);
  const c = risk.calculateCalmar(eq);
  assert.ok(c > 0, `Calmar should be > 0, got ${c}`);
});

// =============================================================================
// 24. 附加：HHI 集中度警告
// =============================================================================

test('RiskEngine: 集中度警告阈值 0.3', () => {
  assert.equal(CONCENTRATION_WARNING, 0.3);
  const risk = new RiskEngine();
  assert.ok(risk.isConcentrationWarning(0.5));
  assert.ok(!risk.isConcentrationWarning(0.2));
});

// =============================================================================
// 25. 附加：回测
// =============================================================================

test('PortfolioEngine: backtestAllocation 生成权益曲线', async () => {
  const engine = createPortfolioEngine();
  // 注入 90 天收益
  engine.pushReturns('BTC', volatileReturns(90, 0.04, 0.001));
  engine.pushReturns('ETH', volatileReturns(90, 0.05, 0.0008));
  const targets: AllocationTarget[] = [
    { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.6' },
    { symbol: 'ETH', assetClass: 'spot', targetWeight: '0.4' },
  ];
  const result = await engine.backtestAllocation('u1', targets, {
    start: Date.now() - 90 * 86_400_000,
    end: Date.now(),
  });
  assert.ok(result.equityCurve.length > 0);
  assert.ok(Number(result.finalValue) > 0);
  assert.ok(typeof result.sharpeRatio === 'number');
});

// =============================================================================
// 26. 附加：常量
// =============================================================================

test('常量：DEFAULT_DRIFT_THRESHOLD = 0.05', () => {
  assert.equal(DEFAULT_DRIFT_THRESHOLD, 0.05);
});
test('常量：MAX_DRAWDOWN_ALERT = 0.2', () => {
  assert.equal(MAX_DRAWDOWN_ALERT, 0.2);
});

// =============================================================================
// 27. 附加：组合收益
// =============================================================================

test('combineReturns 加权组合收益', () => {
  const w = [0.5, 0.5];
  const rets = [
    [0.01, 0.02, 0.03],
    [0.01, 0.01, 0.01],
  ];
  const out = combineReturns(w, rets);
  assert.equal(out.length, 3);
  assert.ok(Math.abs(out[0] - 0.01) < 1e-9);
  assert.ok(Math.abs(out[1] - 0.015) < 1e-9);
});

test('returnsFromPrices 简单收益率', () => {
  const prices = [100, 110, 121];
  const rets = returnsFromPrices(prices);
  assert.equal(rets.length, 2);
  assert.ok(Math.abs(rets[0] - 0.1) < 1e-9);
  assert.ok(Math.abs(rets[1] - 0.1) < 1e-9);
});

// =============================================================================
// 28. 附加：事件订阅
// =============================================================================

test('PortfolioEngine: onPortfolioUpdate 订阅与取消', () => {
  const engine = createPortfolioEngine();
  let called = 0;
  const off = engine.onPortfolioUpdate(() => called++);
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'BTC',
      assetClass: 'spot',
      quantity: '1',
      avgCost: '30000',
      markPrice: '60000',
    }),
  );
  assert.ok(called > 0, 'update 事件被触发');
  off();
  const before = called;
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'ETH',
      assetClass: 'spot',
      quantity: '5',
      avgCost: '2500',
      markPrice: '3500',
    }),
  );
  assert.equal(called, before, 'unsubscribe 后不再触发');
});

// =============================================================================
// 29. 附加：generateReport
// =============================================================================

test('PortfolioEngine: generateReport 完整报表', () => {
  const engine = createPortfolioEngine();
  engine.addAsset(
    makeAsset({
      userId: 'u1',
      symbol: 'BTC',
      assetClass: 'spot',
      quantity: '1',
      avgCost: '30000',
      markPrice: '65000',
    }),
  );
  engine.setAllocationByProfile('u1', 'balanced');
  const report = engine.generateReport('u1', { start: 0, end: Date.now() });
  assert.ok(report.portfolio);
  assert.ok(report.riskMetrics);
  assert.ok(report.attribution);
  assert.ok(report.summary);
  assert.equal(report.userId, 'u1');
});
