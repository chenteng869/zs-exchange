/**
 * 永续合约（USDT-M Perpetual）单元测试
 *
 *  - ContractRegistry: getContract / list
 *  - MarginCalculator:  initial / maintenance / PnL / liq / marginRatio / markPrice
 *  - FundingEngine:      getCurrentRate / funding payment / 多方付空方
 *  - LiquidationEngine:  checkLiquidatable / liquidate / 注入保险基金 / ADL
 *  - PerpEngine:         开多/空 / 加权平均 / 调杠杆 / 调保证金 / 平仓 / 强平 / settleFunding / 账户 / 隔离 vs 跨仓
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ContractRegistry,
  DEFAULT_CONTRACTS,
  globalContractRegistry,
  MarginCalculator,
  FundingEngine,
  LiquidationEngine,
  PerpEngine,
  PerpError,
  INSURANCE_FUND_INITIAL,
  LIQUIDATION_FEE_RATE,
  decCmp,
} from '../src/lib/perp';

// ============================================================================
// 1. ContractRegistry
// ============================================================================

test('ContractRegistry: 默认预定义 5 个合约', () => {
  const reg = new ContractRegistry();
  const all = reg.getAllContracts();
  assert.ok(all.length >= 5);
  const symbols = all.map((c) => c.symbol);
  assert.ok(symbols.includes('BTCUSDT'));
  assert.ok(symbols.includes('ETHUSDT'));
  assert.ok(symbols.includes('SOLUSDT'));
  assert.ok(symbols.includes('BNBUSDT'));
  assert.ok(symbols.includes('XRPUSDT'));
});

test('ContractRegistry: getContract 返回活跃合约', () => {
  const reg = new ContractRegistry();
  const btc = reg.getContract('BTCUSDT');
  assert.ok(btc);
  assert.equal(btc!.baseAsset, 'BTC');
  assert.equal(btc!.quoteAsset, 'USDT');
  assert.equal(btc!.maxLeverage, 125);
});

test('ContractRegistry: getContract 对未激活返回 null', () => {
  const reg = new ContractRegistry();
  reg.updateContract('BTCUSDT', { isActive: false });
  const r = reg.getContract('BTCUSDT');
  assert.equal(r, null);
});

test('ContractRegistry: updateContract 可更新参数', () => {
  const reg = new ContractRegistry();
  const updated = reg.updateContract('BTCUSDT', { maxLeverage: 100, makerFee: 0.0003 });
  assert.equal(updated.maxLeverage, 100);
  assert.equal(updated.makerFee, 0.0003);
});

// ============================================================================
// 2. MarginCalculator
// ============================================================================

test('MarginCalculator: initialMargin 隔离 = notional / leverage', () => {
  const c = new MarginCalculator();
  const reg = new ContractRegistry();
  const btc = reg.getContract('BTCUSDT')!;
  // 0.1 BTC @ 30000 = 3000 notional, 10x -> 300
  const im = c.calculateInitialMargin('3000', 10, 'isolated', btc);
  assert.equal(im, '300');
});

test('MarginCalculator: initialMargin 跨仓 = notional * imr', () => {
  const c = new MarginCalculator();
  const reg = new ContractRegistry();
  const btc = reg.getContract('BTCUSDT')!; // imr = 0.01
  const im = c.calculateInitialMargin('1000', 20, 'cross', btc);
  assert.equal(im, '10');
});

test('MarginCalculator: maintenanceMargin = notional * mmr', () => {
  const c = new MarginCalculator();
  const reg = new ContractRegistry();
  const btc = reg.getContract('BTCUSDT')!; // mmr = 0.005
  const mm = c.calculateMaintenanceMargin('10000', btc);
  assert.equal(mm, '50');
});

test('MarginCalculator: unrealizedPnl long 上涨为正', () => {
  const c = new MarginCalculator();
  // long 0.5 @ 30000 -> 31000: 0.5 * 1000 = 500
  const pnl = c.calculateUnrealizedPnl('long', '0.5', '30000', '31000');
  assert.equal(pnl, '500');
});

test('MarginCalculator: unrealizedPnl short 上涨为负', () => {
  const c = new MarginCalculator();
  // short 0.5 @ 30000 -> 31000: 0.5 * -1000 = -500
  const pnl = c.calculateUnrealizedPnl('short', '0.5', '30000', '31000');
  assert.equal(pnl, '-500');
});

test('MarginCalculator: liquidationPrice long @ 20x, mmr 0.5%', () => {
  const c = new MarginCalculator();
  // long 20x, mmr 0.5% = 0.005
  // factor = 1 - 1/20 + 0.005 = 1 - 0.05 + 0.005 = 0.955
  // liq = 30000 * 0.955 = 28650
  const liq = c.calculateLiquidationPrice('long', '30000', 20, 0.005, 'isolated');
  assert.equal(decCmp(liq, '28650') === 0, true);
});

test('MarginCalculator: liquidationPrice short @ 20x', () => {
  const c = new MarginCalculator();
  // short factor = 1 + 0.05 - 0.005 = 1.045
  // liq = 30000 * 1.045 = 31350
  const liq = c.calculateLiquidationPrice('short', '30000', 20, 0.005, 'isolated');
  assert.equal(decCmp(liq, '31350') === 0, true);
});

test('MarginCalculator: marginRatio = (margin+pnl) / value', () => {
  const c = new MarginCalculator();
  // margin=1000, pnl=200, value=12000 -> (1200)/12000 = 0.1
  const r = c.calculateMarginRatio('1000', '200', '12000');
  assert.equal(decCmp(r, '0.1') === 0, true);
});

test('MarginCalculator: markPrice = median(last, index, funding)', () => {
  const c = new MarginCalculator();
  // 三个数 100, 200, 300 -> 中位数 200
  assert.equal(c.calculateMarkPrice('100', '200', '300'), '200');
  assert.equal(c.calculateMarkPrice('300', '200', '100'), '200');
  assert.equal(c.calculateMarkPrice('200', '100', '300'), '200');
});

test('MarginCalculator: funding rate 在 ±cap 范围内', () => {
  const c = new MarginCalculator();
  // mark=30300, index=30000, interest=0.0001
  // premium = 0.01
  // inner = 0.0001 - 0.01 = -0.0099 (clamp to -0.0005)
  // raw = 0.01 + (-0.0005) = 0.0095 -> clamp to 0.0075
  const rate = c.calculateFundingRate('30300', '30000', 0.0001);
  assert.equal(rate, '0.0075');
});

test('MarginCalculator: funding rate 负向同理', () => {
  const c = new MarginCalculator();
  // mark=29700, index=30000 -> premium = -0.01
  // inner = 0.0001 - (-0.01) = 0.0101 (clamp to 0.0005)
  // raw = -0.01 + 0.0005 = -0.0095 -> clamp to -0.0075
  const rate = c.calculateFundingRate('29700', '30000', 0.0001);
  assert.equal(rate, '-0.0075');
});

// ============================================================================
// 3. FundingEngine
// ============================================================================

test('FundingEngine: getCurrentRate 初始为 null', () => {
  const reg = new ContractRegistry();
  const f = new FundingEngine(reg);
  assert.equal(f.getCurrentRate('BTCUSDT'), null);
});

test('FundingEngine: getPredictedRate 即时计算', () => {
  const reg = new ContractRegistry();
  const f = new FundingEngine(reg);
  const r = f.getPredictedRate('BTCUSDT', '30000', '30000');
  // mark == index, premium = 0, inner = interest = 0.0001, in range
  assert.equal(decCmp(r, '0.0001') === 0, true);
});

test('FundingEngine: processFunding 多方付给空方 (rate>0)', () => {
  const reg = new ContractRegistry();
  const f = new FundingEngine(reg);
  // 构造两个仓位：long + short 各 0.1 BTC @ mark 30000
  const longPos = {
    id: 'p1', userId: 'u1', symbol: 'BTCUSDT', side: 'long' as const,
    marginMode: 'isolated' as const, size: '0.1',
    entryPrice: '30000', markPrice: '30000', liquidationPrice: '28500',
    leverage: 20, margin: '150', unrealizedPnl: '0', unrealizedPnlRate: '0',
    marginRatio: '0.05', maintenanceMargin: '15', createdAt: 0, updatedAt: 0, status: 'open' as const,
  };
  const shortPos = {
    id: 'p2', userId: 'u2', symbol: 'BTCUSDT', side: 'short' as const,
    marginMode: 'isolated' as const, size: '0.1',
    entryPrice: '30000', markPrice: '30000', liquidationPrice: '31500',
    leverage: 20, margin: '150', unrealizedPnl: '0', unrealizedPnlRate: '0',
    marginRatio: '0.05', maintenanceMargin: '15', createdAt: 0, updatedAt: 0, status: 'open' as const,
  };
  // mark 30500 -> premium > 0
  const r = f.processFunding('BTCUSDT', [longPos, shortPos], '30500', '30000', undefined);
  assert.equal(r.payments.length, 2);
  const longPay = r.payments.find((p) => p.positionId === 'p1')!;
  const shortPay = r.payments.find((p) => p.positionId === 'p2')!;
  // long 应当支付（负数），short 应当收取（正数）
  assert.equal(longPay.amount.startsWith('-'), true, 'long 应当支付');
  assert.equal(shortPay.amount.startsWith('-'), false, 'short 应当收取');
  // 数量级匹配：payment ≈ 0.1 * 30500 * 0.0075 ≈ 22.875
  assert.equal(Math.abs(Number(longPay.amount)) > 0, true);
  assert.equal(Math.abs(Number(shortPay.amount)) > 0, true);
});

test('FundingEngine: scheduleNextFunding 锚定 8h 周期', () => {
  const reg = new ContractRegistry();
  const f = new FundingEngine(reg);
  // 任意时间
  const t = f.scheduleNextFunding('BTCUSDT', Date.parse('2024-01-01T05:00:00Z'));
  // 下一期应是 08:00 UTC
  const next = new Date(t);
  assert.equal(next.getUTCHours(), 8);
  assert.equal(next.getUTCMinutes(), 0);
});

// ============================================================================
// 4. LiquidationEngine
// ============================================================================

test('LiquidationEngine: checkLiquidatable - marginRatio < mmr 触发', () => {
  const reg = new ContractRegistry();
  const le = new LiquidationEngine(reg);
  const btc = reg.getContract('BTCUSDT')!; // mmr = 0.005
  // value=30000, margin=100, pnl=-50 -> equity=50, ratio=50/30000=0.00167 < 0.005
  const pos = mkPos({ margin: '100', unrealizedPnl: '-50', size: '1', entryPrice: '30000' });
  const ok = le.checkLiquidatable(pos, '30000', btc);
  assert.equal(ok, true);
});

test('LiquidationEngine: checkLiquidatable - 健康仓位不触发', () => {
  const reg = new ContractRegistry();
  const le = new LiquidationEngine(reg);
  const btc = reg.getContract('BTCUSDT')!;
  // value=30000, margin=1500, pnl=0 -> 0.05 > 0.005
  const pos = mkPos({ margin: '1500', unrealizedPnl: '0', size: '1', entryPrice: '30000' });
  assert.equal(le.checkLiquidatable(pos, '30000', btc), false);
});

test('LiquidationEngine: liquidate 强平后注入保险基金', () => {
  const reg = new ContractRegistry();
  const le = new LiquidationEngine(reg);
  const btc = reg.getContract('BTCUSDT')!;
  // 构造一个健康仓位（虽然有亏损但还未触发强平）
  // 手动让 marginRatio 极低：margin=1, pnl=-29999, value=30000, ratio≈0
  const pos = mkPos({ margin: '1', unrealizedPnl: '-29999', size: '1', entryPrice: '30000', side: 'long' });
  const orderBook = {
    bids: [{ price: '29000', quantity: '10' }],
    asks: [{ price: '29000', quantity: '10' }],
  };
  const fund = { symbol: 'BTCUSDT', balance: '1000', totalContributed: '1000', totalUsed: '0' };
  const r = le.liquidate(pos, btc, orderBook, '29000', fund, []);
  // 强平后 remainingMargin 应该 >= 0（穿仓时为 0）
  // 罚金 = 29000 * 0.005 = 145
  assert.equal(Number(r.liquidation.penalty) > 0, true);
  // 保险基金状态更新
  assert.ok(r.insuranceFund);
});

test('LiquidationEngine: 极端穿仓触发 ADL', () => {
  const reg = new ContractRegistry();
  const le = new LiquidationEngine(reg);
  const btc = reg.getContract('BTCUSDT')!;
  // 极端穿仓：mark=20000, entry=30000, size=1, margin=1
  // pnl = -10000, penalty = 20000*0.005=100
  // remaining = 1 + (-10000) - 100 = -10099 (穿仓)
  const pos = mkPos({ margin: '1', unrealizedPnl: '-10000', size: '1', entryPrice: '30000', side: 'long' });
  const ob = { bids: [{ price: '20000', quantity: '1' }], asks: [{ price: '20000', quantity: '1' }] };
  // 保险基金不足
  const fund = { symbol: 'BTCUSDT', balance: '10', totalContributed: '10', totalUsed: '0' };
  // 提供对手方仓位
  const counterparty = mkPos({
    id: 'cp1', userId: 'u2', margin: '1500', unrealizedPnl: '3000',
    size: '0.5', entryPrice: '20000', side: 'short', markPrice: '20000',
  });
  const r = le.liquidate(pos, btc, ob, '20000', fund, [counterparty]);
  assert.equal(r.adlTriggered, true);
  assert.equal(r.adlPositions.length > 0, true);
});

test('LiquidationEngine: adlRank 按 score 降序', () => {
  const reg = new ContractRegistry();
  const le = new LiquidationEngine(reg);
  // 构造三个仓位：score = leverage * (pnlRate + 1)
  const p1 = mkPos({ id: 'p1', pnlRate: '0.1', leverage: 10 }); // score = 11
  const p2 = mkPos({ id: 'p2', pnlRate: '0.5', leverage: 20 }); // score = 30
  const p3 = mkPos({ id: 'p3', pnlRate: '0.2', leverage: 5 });  // score = 6
  const ranks = le.adlRank([p1, p2, p3]);
  assert.equal(ranks[0].position.id, 'p2');
  assert.equal(ranks[1].position.id, 'p1');
  assert.equal(ranks[2].position.id, 'p3');
});

// ============================================================================
// 5. PerpEngine
// ============================================================================

test('PerpEngine: 开多仓（隔离）并冻结保证金', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const pos = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '0.5', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  assert.equal(pos.side, 'long');
  assert.equal(pos.size, '0.5');
  assert.equal(pos.entryPrice, '30000');
  assert.equal(pos.leverage, 20);
  // notional = 15000, im = 15000/20 = 750
  assert.equal(pos.margin, '750');
  // wallet 应减少 750（隔离模式 IM 冻结到仓位）
  const acc = e.getAccount('u1');
  assert.equal(decCmp(acc.totalWalletBalance, '9250') === 0, true);
  assert.equal(decCmp(acc.availableBalance, '9250') === 0, true);
});

test('PerpEngine: 开空仓并正确设置强平价', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const pos = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'short',
    quantity: '0.1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  assert.equal(pos.side, 'short');
  // short 20x, mmr 0.5%: liq = 30000 * 1.045 = 31350
  assert.equal(decCmp(pos.liquidationPrice, '31350') === 0, true);
});

test('PerpEngine: 同向加仓按加权平均重算 entryPrice', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '0.4', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  assert.equal(p1.entryPrice, '30000');

  // 加仓 0.6 @ 33000
  const p2 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '0.6', price: '33000', leverage: 20, marginMode: 'isolated',
  });
  // 加权: (0.4*30000 + 0.6*33000) / 1.0 = (12000 + 19800) / 1 = 31800
  assert.equal(p2.size, '1');
  assert.equal(p2.entryPrice, '31800');
  // 保证金 = 0.4*30000/20 + 0.6*33000/20 = 600 + 990 = 1590
  assert.equal(p2.margin, '1590');
});

test('PerpEngine: 调整杠杆（提杠杆追加 IM）', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 10, marginMode: 'isolated',
  });
  // notional=30000, im@10x=3000
  assert.equal(p1.margin, '3000');

  // 调整到 20x: im@20x=1500 -> diff = -1500, 应返还 1500
  const p2 = e.adjustLeverage(p1.id, 20);
  assert.equal(p2.leverage, 20);
  assert.equal(p2.margin, '1500');

  // 调整到 30x: im@30x=1000 -> diff = -500, 再返还 500
  const p3 = e.adjustLeverage(p1.id, 30);
  assert.equal(p3.leverage, 30);
  assert.equal(p3.margin, '1000');
});

test('PerpEngine: 调整保证金（追加 / 提取）', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  // im = 1500
  const p2 = e.adjustMargin(p1.id, '500');
  assert.equal(p2.margin, '2000');

  // 提取 500
  const p3 = e.adjustMargin(p1.id, '-500');
  assert.equal(p3.margin, '1500');
});

test('PerpEngine: 平仓（全部）计算 PnL', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  // 上涨 5%
  const r = e.closePosition(p1.id, '31500');
  // pnl = 1 * 1500 = 1500
  assert.equal(r.pnl, '1500');
  assert.equal(r.position.status, 'closed');
  assert.equal(r.position.size, '0');
});

test('PerpEngine: 平仓（部分）按比例减仓', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  // 平 0.4 @ 33000
  const r = e.closePosition(p1.id, '33000', '0.4');
  // pnl = 0.4 * 3000 = 1200
  assert.equal(r.pnl, '1200');
  assert.equal(r.position.size, '0.6');
});

test('PerpEngine: 触发强平（marginRatio 跌破 mmr）', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '1000');
  e.updateMarkPrices('BTCUSDT', '30000');
  // 1 BTC @ 30000, 30x -> im = 1000
  const p1 = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 30, marginMode: 'isolated',
  });
  // mark 跌到 28500: pnl = -1500, equity = 1000 - 1500 = -500
  // 应当触发强平
  e.updateMarkPrices('BTCUSDT', '28500');
  const liqs = e.monitorAndLiquidate();
  assert.equal(liqs.length, 1);
  assert.equal(liqs[0].userId, 'u1');
});

test('PerpEngine: settleFunding 8h 周期产生 FundingPayment', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.transferIn('u2', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  e.updateIndexPrice('BTCUSDT', '30000');
  e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '0.1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  e.openPosition({
    userId: 'u2', symbol: 'BTCUSDT', side: 'short',
    quantity: '0.1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  // mark > index: rate > 0
  e.updateMarkPrices('BTCUSDT', '30300');
  const payments = e.settleFunding('BTCUSDT');
  assert.equal(payments.length, 2);
  const longPay = payments.find((p) => p.userId === 'u1')!;
  const shortPay = payments.find((p) => p.userId === 'u2')!;
  // long 应当支付（负数），short 应当收取（正数）
  assert.equal(longPay.amount.startsWith('-'), true);
  assert.equal(shortPay.amount.startsWith('-'), false);
});

test('PerpEngine: 账户余额计算（跨仓）', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 10, marginMode: 'cross',
  });
  const acc = e.getAccount('u1');
  assert.equal(decCmp(acc.totalWalletBalance, '10000') === 0, true);
  // cross: 跨仓初始保证金按 imr 计算 (0.01 * 30000 = 300)
  assert.equal(decCmp(acc.totalPositionInitialMargin, '300') === 0, true);
  // available = 10000 - 300 = 9700
  assert.equal(decCmp(acc.availableBalance, '9700') === 0, true);
});

test('PerpEngine: 隔离 vs 跨仓', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');

  // 隔离
  const iso = e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 10, marginMode: 'isolated',
  });
  // 跨仓
  const cross = e.openPosition({
    userId: 'u1', symbol: 'ETHUSDT', side: 'long',
    quantity: '5', price: '2000', leverage: 10, marginMode: 'cross',
  });
  // 隔离 notional=30000 / 10 = 3000
  assert.equal(iso.margin, '3000');
  // 跨仓 notional=10000 * 0.01 = 100
  assert.equal(cross.margin, '100');
});

test('PerpEngine: 保证金率监控（getAccountRisk）', () => {
  const e = new PerpEngine();
  // notional=30000 / 20 = 1500
  e.transferIn('u1', 'USDT', '5000');
  e.updateMarkPrices('BTCUSDT', '30000');
  e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  const risk = e.getAccountRisk('u1');
  assert.ok(risk.riskLevel);
  assert.ok(['safe', 'warning', 'danger', 'critical'].includes(risk.riskLevel));
});

test('PerpEngine: 下单 + 撮合（市价）自动开仓', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  const ord = e.placeOrder({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    type: 'market', quantity: '0.5', leverage: 20, marginMode: 'isolated',
  });
  assert.equal(ord.status, 'open');
  const filled = e.matchOrder(ord.id, '30000');
  assert.equal(filled.status, 'filled');
  assert.equal(decCmp(filled.avgFillPrice, '30000') === 0, true);
  assert.equal(decCmp(filled.fee, '7.5') === 0, true); // 0.5*30000*0.0005
  // 仓位已开
  const pos = e.getUserPositions('u1', 'BTCUSDT');
  assert.equal(pos.length, 1);
  assert.equal(pos[0].size, '0.5');
});

test('PerpEngine: reduceOnly 减仓单', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  e.updateMarkPrices('BTCUSDT', '30000');
  e.openPosition({
    userId: 'u1', symbol: 'BTCUSDT', side: 'long',
    quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
  });
  // 卖出 reduceOnly
  const ord = e.placeOrder({
    userId: 'u1', symbol: 'BTCUSDT', side: 'short',
    type: 'market', quantity: '0.3', leverage: 20,
    marginMode: 'isolated', reduceOnly: true,
  });
  const filled = e.matchOrder(ord.id, '30500');
  assert.equal(filled.status, 'filled');
  // 仓位减少
  const pos = e.getUserPositions('u1', 'BTCUSDT');
  assert.equal(decCmp(pos[0].size, '0.7') === 0, true);
});

test('PerpEngine: 保险基金初始 100 万 USDT', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '1000');
  const f = e.getInsuranceFund('BTCUSDT');
  assert.equal(f!.balance, INSURANCE_FUND_INITIAL);
});

test('PerpEngine: 错误 - 余额不足', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '100');
  e.updateMarkPrices('BTCUSDT', '30000');
  assert.throws(
    () =>
      e.openPosition({
        userId: 'u1', symbol: 'BTCUSDT', side: 'long',
        quantity: '1', price: '30000', leverage: 20, marginMode: 'isolated',
      }),
    PerpError
  );
});

test('PerpEngine: 错误 - 未知 symbol', () => {
  const e = new PerpEngine();
  e.transferIn('u1', 'USDT', '10000');
  assert.throws(
    () =>
      e.openPosition({
        userId: 'u1', symbol: 'DOGEUSDT', side: 'long',
        quantity: '1', price: '0.1', leverage: 20, marginMode: 'isolated',
      }),
    PerpError
  );
});

// ============================================================================
// 工具
// ============================================================================

interface PosOverrides {
  id?: string;
  userId?: string;
  symbol?: string;
  side?: 'long' | 'short';
  marginMode?: 'isolated' | 'cross';
  size?: string;
  entryPrice?: string;
  markPrice?: string;
  liquidationPrice?: string;
  leverage?: number;
  margin?: string;
  unrealizedPnl?: string;
  pnlRate?: string;
  marginRatio?: string;
  maintenanceMargin?: string;
  status?: 'open' | 'closed' | 'liquidated';
}

function mkPos(o: PosOverrides = {}) {
  return {
    id: o.id || 'pos1',
    userId: o.userId || 'u1',
    symbol: o.symbol || 'BTCUSDT',
    side: o.side || 'long',
    marginMode: o.marginMode || 'isolated',
    size: o.size || '0.1',
    entryPrice: o.entryPrice || '30000',
    markPrice: o.markPrice || '30000',
    liquidationPrice: o.liquidationPrice || '28500',
    leverage: o.leverage || 20,
    margin: o.margin || '150',
    unrealizedPnl: o.unrealizedPnl || '0',
    unrealizedPnlRate: o.pnlRate || '0',
    marginRatio: o.marginRatio || '0.05',
    maintenanceMargin: o.maintenanceMargin || '15',
    createdAt: 0,
    updatedAt: 0,
    status: o.status || ('open' as const),
  };
}

function e2setup(_e: PerpEngine, _userId: string, _amount: number) {
  // placeholder kept for backwards compatibility
}

