/**
 * 期权交易系统单元测试
 *
 * 至少 16 个用例：
 *  - BSM call/put 价格（已知值校验）
 *  - BSM Greeks（delta call 接近 0.5 ATM）
 *  - BSM 隐含波动率反推
 *  - 数学函数：N(0) = 0.5, erf(0) = 0
 *  - Call 价格随标的价格上升
 *  - Put 价格随标的价格下降
 *  - 期权链生成（11 strikes × 2 types）
 *  - SettlementEngine isExercisable / cashSettlement / physicalSettlement / autoExercise
 *  - OptionsEngine 开仓 / PnL / 持仓 Greeks / 卖方保证金
 *  - 看涨期权到期收益图
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BlackScholes,
  erf,
  normalCDF,
  OptionChainService,
  OptionsEngine,
  RISK_FREE_RATE,
  SettlementEngine,
  type Option,
  type OptionType,
} from '../src/lib/options';
import {
  DEFAULT_CONTRACT_SIZE,
  DEFAULT_IV,
  BSM_REFERENCE,
  OPTION_STRIKE_PCT_RANGE,
} from '../src/lib/options/types';

// =============================================================================
// 工具
// =============================================================================

const bsm = new BlackScholes();

function approx(actual: number, expected: number, eps = 0.001, label = ''): void {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `${label} expected ≈ ${expected}, got ${actual}, diff ${Math.abs(actual - expected)}`,
  );
}

/** 构造一个 7 天后到期的 BTC 期权（strike=70000, call） */
function buildOption(overrides: Partial<Option> = {}): Option {
  return {
    id: 'BTC-2026-06-27-70000-C',
    underlying: 'BTC',
    quoteAsset: 'USDT',
    optionType: 'call',
    exerciseStyle: 'european',
    strikePrice: '70000',
    expirationTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
    contractSize: DEFAULT_CONTRACT_SIZE,
    settlementType: 'cash',
    status: 'active',
    listedAt: Date.now(),
    ...overrides,
  };
}

// =============================================================================
// 1. BSM 价格
// =============================================================================

test('BSM：Call 价格 (S=100,K=100,T=1,r=0.05,σ=0.2) ≈ 10.4506', () => {
  const p = bsm.price(
    { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 },
    'call',
  );
  approx(p, BSM_REFERENCE.call, 0.001, 'call');
});

test('BSM：Put 价格 (S=100,K=100,T=1,r=0.05,σ=0.2) ≈ 5.5735', () => {
  const p = bsm.price(
    { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 },
    'put',
  );
  approx(p, BSM_REFERENCE.put, 0.001, 'put');
});

test('BSM：Call + Put 满足 Put-Call Parity', () => {
  const inputs = { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 };
  const c = bsm.price(inputs, 'call');
  const p = bsm.price(inputs, 'put');
  const parity = bsm.putCallParityCheck(c, p, inputs);
  assert.equal(parity.valid, true, `parity failed: ${JSON.stringify(parity)}`);
});

// =============================================================================
// 2. BSM Greeks
// =============================================================================

test('BSM：Greeks (ATM call) delta ≈ 0.6368, gamma ≈ 0.0188', () => {
  const g = bsm.greeks(
    { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 },
    'call',
  );
  approx(g.delta, BSM_REFERENCE.deltaCall, 0.001, 'delta');
  approx(g.gamma, BSM_REFERENCE.gamma, 0.001, 'gamma');
  approx(g.theta, BSM_REFERENCE.thetaCall, 0.001, 'theta');
  approx(g.vega, BSM_REFERENCE.vega, 0.001, 'vega');
  approx(g.rho, BSM_REFERENCE.rhoCall, 0.001, 'rho');
});

test('BSM：Call delta 随 spot 上升单调增', () => {
  let prev = -Infinity;
  for (const s of [80, 90, 100, 110, 120, 140]) {
    const g = bsm.greeks({ spot: s, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 }, 'call');
    assert.ok(g.delta > prev, `delta should increase: s=${s}, delta=${g.delta} <= prev=${prev}`);
    prev = g.delta;
  }
});

// =============================================================================
// 3. 隐含波动率反推
// =============================================================================

test('BSM：反推 IV（用 call 价格反推 → σ≈0.2）', () => {
  const marketPrice = BSM_REFERENCE.call;
  const iv = bsm.impliedVolatility(
    marketPrice,
    { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05 },
    'call',
    0.0001,
    100,
  );
  approx(iv, 0.2, 0.001, 'iv');
});

test('BSM：反推 IV（put 价格反推 → σ≈0.2）', () => {
  const marketPrice = BSM_REFERENCE.put;
  const iv = bsm.impliedVolatility(
    marketPrice,
    { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05 },
    'put',
  );
  approx(iv, 0.2, 0.001, 'iv (put)');
});

// =============================================================================
// 4. 数学函数
// =============================================================================

test('Math：N(0) = 0.5', () => {
  approx(normalCDF(0), 0.5, 1e-7, 'N(0)');
});

test('Math：erf(0) = 0', () => {
  approx(erf(0), 0, 1e-7, 'erf(0)');
});

test('Math：erf(1) ≈ 0.8427', () => {
  approx(erf(1), 0.8427, 0.001, 'erf(1)');
});

test('Math：erf(-x) = -erf(x)', () => {
  approx(erf(-1.5) + erf(1.5), 0, 1e-7, 'erf odd');
});

// =============================================================================
// 5. 单调性
// =============================================================================

test('BSM：Call 价格随 spot 上升单调增', () => {
  let prev = -Infinity;
  for (const s of [80, 90, 100, 110, 120, 140]) {
    const p = bsm.price({ spot: s, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 }, 'call');
    assert.ok(p > prev, `call price should increase: s=${s}, p=${p} <= prev=${prev}`);
    prev = p;
  }
});

test('BSM：Put 价格随 spot 上升单调减', () => {
  let prev = Infinity;
  for (const s of [80, 90, 100, 110, 120, 140]) {
    const p = bsm.price({ spot: s, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 }, 'put');
    assert.ok(p < prev, `put price should decrease: s=${s}, p=${p} >= prev=${prev}`);
    prev = p;
  }
});

// =============================================================================
// 6. 期权链
// =============================================================================

test('OptionChain：generateChain 生成 11 strikes × 2 types = 22 期权', () => {
  const chain = new OptionChainService();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const opts = chain.generateChain('BTC', exp, 70000, DEFAULT_IV);
  assert.equal(opts.length, 22);
  assert.equal(chain.getAllOptions('BTC').length, 22);
  const calls = opts.filter((o) => o.optionType === 'call');
  const puts = opts.filter((o) => o.optionType === 'put');
  assert.equal(calls.length, 11);
  assert.equal(puts.length, 11);
});

test('OptionChain：getChain 返回 calls/puts 各 11', () => {
  const chain = new OptionChainService();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  chain.generateChain('ETH', exp, 3000, DEFAULT_IV);
  const c = chain.getChain('ETH', exp, 3000, DEFAULT_IV);
  assert.equal(c.calls.length, 11);
  assert.equal(c.puts.length, 11);
});

test('OptionChain：getExpirations 返回唯一到期时间', () => {
  const chain = new OptionChainService();
  const exp1 = Date.now() + 24 * 60 * 60 * 1000;
  const exp2 = Date.now() + 7 * 24 * 60 * 60 * 1000;
  chain.generateChain('BTC', exp1, 70000, DEFAULT_IV);
  chain.generateChain('BTC', exp2, 70000, DEFAULT_IV);
  const exps = chain.getExpirations('BTC');
  assert.ok(exps.includes(exp1));
  assert.ok(exps.includes(exp2));
  assert.equal(exps.length, 2);
});

// =============================================================================
// 7. SettlementEngine
// =============================================================================

test('Settlement：isInTheMoney call (spot>strike) / put (spot<strike)', () => {
  const se = new SettlementEngine();
  const call = buildOption({ optionType: 'call', strikePrice: '70000' });
  const put = buildOption({ optionType: 'put', strikePrice: '70000' });
  assert.equal(se.isInTheMoney(call, 71000), true);
  assert.equal(se.isInTheMoney(call, 69000), false);
  assert.equal(se.isInTheMoney(put, 69000), true);
  assert.equal(se.isInTheMoney(put, 71000), false);
});

test('Settlement：isExercisable European 仅到期日可行权', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ exerciseStyle: 'european', strikePrice: '70000' });
  const now = Date.now();
  // 未到期
  assert.equal(se.isExercisable(opt, now, 71000), false);
  // 到期后 1h
  assert.equal(se.isExercisable(opt, opt.expirationTime + 3600 * 1000, 71000), true);
  // 到期后 1h 但价外
  assert.equal(se.isExercisable(opt, opt.expirationTime + 3600 * 1000, 69000), false);
});

test('Settlement：isExercisable American 到期前任意价内时间', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ exerciseStyle: 'american', strikePrice: '70000' });
  const now = Date.now();
  assert.equal(se.isExercisable(opt, now, 71000), true);
  // 到期后 American 不可行权
  assert.equal(se.isExercisable(opt, opt.expirationTime + 1000, 71000), false);
});

test('Settlement：cashSettlement call long (S=71000,K=70000,qty=1,size=1) = 1000', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ optionType: 'call', strikePrice: '70000', settlementType: 'cash' });
  const s = se.cashSettlement(opt, 1, 71000, 'u1');
  assert.equal(parseFloat(s.payoff), 1000);
  assert.equal(s.settlementType, 'cash');
});

test('Settlement：cashSettlement put long (S=69000,K=70000,qty=2,size=1) = 2000', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ optionType: 'put', strikePrice: '70000', settlementType: 'cash' });
  const s = se.cashSettlement(opt, 2, 69000, 'u1');
  assert.equal(parseFloat(s.payoff), 2000);
});

test('Settlement：physicalSettlement call long (S=71000,K=70000,qty=1) payoff=-70000', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ optionType: 'call', strikePrice: '70000', settlementType: 'physical' });
  const s = se.physicalSettlement(opt, 1, 71000, 'u1');
  assert.equal(parseFloat(s.payoff), -70000);
});

test('Settlement：autoExercise 价内期权自动行权', () => {
  const se = new SettlementEngine();
  const exp = Date.now() - 1000;  // 已到期
  const call = buildOption({ optionType: 'call', strikePrice: '70000', expirationTime: exp });
  const put = buildOption({ id: 'BTC-2026-06-27-70000-P', optionType: 'put', strikePrice: '70000', expirationTime: exp });
  const result = se.autoExercise([call, put], 71000, exp + 100, 'u1');
  assert.equal(result.length, 1);   // 仅 call 价内
  assert.equal(result[0].optionId, call.id);
});

test('Settlement：expirationPayoff call long 收益图', () => {
  const se = new SettlementEngine();
  const opt = buildOption({ optionType: 'call', strikePrice: '70000' });
  const points = se.expirationPayoff(opt, [60000, 70000, 80000]);
  assert.equal(Math.abs(points[0].long), 0);
  assert.equal(Math.abs(points[1].long), 0);
  assert.equal(points[2].long, 10000);
  assert.equal(Math.abs(points[0].short), 0);
  assert.equal(points[2].short, -10000);
});

// =============================================================================
// 8. OptionsEngine
// =============================================================================

test('OptionsEngine：placeOrder + matchOrder 开 long 仓位', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);

  const order = engine.placeOrder({
    userId: 'u1', optionId: opt.id, side: 'buy', type: 'market', quantity: 5,
  });
  assert.equal(order.status, 'pending');
  const filled = engine.matchOrder(order.id);
  assert.equal(filled.status, 'filled');
  assert.equal(filled.filledQty, 5);

  const positions = engine.getUserPositions('u1');
  assert.equal(positions.length, 1);
  assert.equal(positions[0].side, 'long');
  assert.equal(positions[0].quantity, 5);
});

test('OptionsEngine：calculatePositionPnl long (mark>entry) 为正', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({ userId: 'u1', optionId: opt.id, side: 'buy', type: 'market', quantity: 1 });
  engine.matchOrder(o.id);
  const pos = engine.getUserPositions('u1')[0];
  const pnl = parseFloat(engine.calculatePositionPnl(pos, parseFloat(pos.entryPrice) + 100));
  assert.ok(pnl > 0, `expected positive PnL, got ${pnl}`);
});

test('OptionsEngine：calculatePositionPnl short (mark>entry) 为负', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({ userId: 'u1', optionId: opt.id, side: 'sell', type: 'market', quantity: 1 });
  engine.matchOrder(o.id);
  const pos = engine.getUserPositions('u1')[0];
  assert.equal(pos.side, 'short');
  const pnl = parseFloat(engine.calculatePositionPnl(pos, parseFloat(pos.entryPrice) + 100));
  assert.ok(pnl < 0, `expected negative PnL, got ${pnl}`);
});

test('OptionsEngine：getPortfolioGreeks 汇总', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({ userId: 'u1', optionId: opt.id, side: 'buy', type: 'market', quantity: 3 });
  engine.matchOrder(o.id);
  const g = engine.getPortfolioGreeks('u1');
  // 3 张 long call，delta 应该 > 0
  assert.ok(g.delta > 0, `portfolio delta should be positive, got ${g.delta}`);
});

test('OptionsEngine：calculateShortMargin > 0', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption({ optionType: 'put', strikePrice: '70000' });
  chain.addOption(opt);
  const m = parseFloat(engine.calculateShortMargin(opt, 70000));
  assert.ok(m > 0, `margin should be > 0, got ${m}`);
});

test('OptionsEngine：cancelOrder 状态变 cancelled', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({
    userId: 'u1', optionId: opt.id, side: 'buy', type: 'limit', price: '500', quantity: 1,
  });
  const c = engine.cancelOrder(o.id);
  assert.equal(c.status, 'cancelled');
});

test('OptionsEngine：closePosition 返回 pnl', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);
  const opt = buildOption();
  chain.addOption(opt);
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({ userId: 'u1', optionId: opt.id, side: 'buy', type: 'market', quantity: 1 });
  engine.matchOrder(o.id);
  const pos = engine.getUserPositions('u1')[0];
  const closePrice = parseFloat(pos.entryPrice) + 200;
  const r = engine.closePosition(pos.id, closePrice);
  assert.equal(parseFloat(r.pnl), 200);
  assert.equal(r.position.status, 'exercised');
});

// =============================================================================
// 9. 期权链与 PnL 综合
// =============================================================================

test('Integration：完整生命周期（链 → 订单 → 持仓 → PnL → 行权）', () => {
  const chain = new OptionChainService();
  const settler = new SettlementEngine();
  const engine = new OptionsEngine(chain, settler);

  // 生成 1 天后到期的链
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const opts = chain.generateChain('BTC', exp, 70000, DEFAULT_IV);
  assert.equal(opts.length, 22);

  // 找 ATM call
  const atm = opts.find((o) => o.optionType === 'call' && o.strikePrice === '70000.00')!;
  assert.ok(atm);

  // 下市价买单
  engine.setSpot('BTC', 70000);
  const o = engine.placeOrder({ userId: 'u1', optionId: atm.id, side: 'buy', type: 'market', quantity: 2 });
  const filled = engine.matchOrder(o.id);
  assert.equal(filled.status, 'filled');

  // 验证持仓存在
  const positions = engine.getUserPositions('u1');
  assert.equal(positions.length, 1);
  assert.equal(positions[0].quantity, 2);

  // mark price 上涨后 PnL
  const pnl = parseFloat(engine.calculatePositionPnl(positions[0], parseFloat(positions[0].entryPrice) + 50));
  assert.ok(pnl > 0);

  // 卖方保证金
  const put = opts.find((o) => o.optionType === 'put' && o.strikePrice === '70000.00')!;
  const margin = parseFloat(engine.calculateShortMargin(put, 70000));
  assert.ok(margin > 0);
});

// =============================================================================
// 10. 期权链行权价范围
// =============================================================================

test('OptionChain：默认 11 档覆盖 0.5x ~ 1.5x spot', () => {
  const chain = new OptionChainService();
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const opts = chain.generateChain('BTC', exp, 1000, DEFAULT_IV);
  // 检查 strike 范围
  const strikes = new Set<number>();
  for (const o of opts) strikes.add(parseFloat(o.strikePrice));
  assert.equal(strikes.size, 11);
  const min = Math.min(...strikes);
  const max = Math.max(...strikes);
  assert.equal(min, 1000 * 0.5);
  assert.equal(max, 1000 * 1.5);
});

test('OptionChain：getOptionByStrikeRange 验证 strike 步进', () => {
  assert.equal(OPTION_STRIKE_PCT_RANGE.length, 11);
  assert.equal(OPTION_STRIKE_PCT_RANGE[0], 0.5);
  assert.equal(OPTION_STRIKE_PCT_RANGE[10], 1.5);
});

// =============================================================================
// 11. 参考常量
// =============================================================================

test('Constants：BSM_REFERENCE 与已知值一致', () => {
  assert.equal(BSM_REFERENCE.call, 10.4506);
  assert.equal(BSM_REFERENCE.put, 5.5735);
  assert.equal(BSM_REFERENCE.deltaCall, 0.6368);
});

test('Constants：RISK_FREE_RATE = 0.05', () => {
  assert.equal(RISK_FREE_RATE, 0.05);
});

test('Constants：DEFAULT_IV = 0.6', () => {
  assert.equal(DEFAULT_IV, 0.6);
});
