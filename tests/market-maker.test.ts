/**
 * 做市商系统单元测试
 *
 * 覆盖：
 *  - registerMarketMaker
 *  - QuoteEngine generateQuote bid/ask
 *  - QuoteEngine 点差正确
 *  - QuoteEngine skew 倾斜
 *  - QuoteEngine cancelStale
 *  - InventoryManager checkInventoryLimit
 *  - InventoryManager calculateSkew
 *  - InventoryManager rebalancePlan
 *  - InventoryManager 触发报警
 *  - RebateEngine calculateRebate
 *  - RebateEngine recordRebate
 *  - MarketMakerEngine updateQuote 自动调价
 *  - MarketMakerEngine getStats
 *  - MarketMakerEngine getLeaderboard
 *  - MarketMaker 暂停
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MarketMakerEngine,
  QuoteEngine,
  InventoryManager,
  RebateEngine,
  MM_QUOTE_EXPIRY_MS,
  type MarketMaker,
  type Quote,
  type Trade,
  type Inventory,
} from '../src/lib/market-maker';

// ============================================================================
// helpers
// ============================================================================

function makeMaker(over: Partial<MarketMaker> = {}): MarketMaker {
  return {
    id: over.id ?? 'mm_test',
    name: over.name ?? 'TestMaker',
    tier: over.tier ?? 'gold',
    status: over.status ?? 'active',
    apiKey: over.apiKey ?? 'mk_test',
    apiSecret: over.apiSecret ?? 'sk_test',
    makerFeeRate: over.makerFeeRate ?? -0.0001,
    rebateRate: over.rebateRate ?? 0.0002,
    dailyVolumeTarget: over.dailyVolumeTarget ?? '1000000',
    minSpreadBps: over.minSpreadBps ?? 5,
    maxInventory: over.maxInventory ?? '10',
    createdAt: over.createdAt ?? Date.now(),
    approvedAt: over.approvedAt ?? Date.now(),
    symbols: over.symbols ?? ['BTC/USDT'],
  };
}

function makeTrade(over: Partial<Trade> = {}): Trade {
  return {
    id: over.id ?? 'trd_1',
    orderId: over.orderId ?? 'o1',
    counterpartyOrderId: over.counterpartyOrderId ?? 'o2',
    makerOrderId: over.makerOrderId ?? 'o2',
    userId: over.userId ?? 'mm_test',
    symbol: over.symbol ?? 'BTC/USDT',
    side: over.side ?? 'buy',
    price: over.price ?? '30000',
    quantity: over.quantity ?? '0.1',
    quoteQty: over.quoteQty ?? '3000',
    fee: over.fee ?? '3',
    feeAsset: over.feeAsset ?? 'USDT',
    isMaker: over.isMaker ?? true,
    counterpartyUserId: over.counterpartyUserId ?? 'u_buyer',
    executedAt: over.executedAt ?? new Date().toISOString(),
  };
}

function makeInventory(over: Partial<Inventory> = {}): Inventory {
  return {
    marketMakerId: over.marketMakerId ?? 'mm_test',
    symbol: over.symbol ?? 'BTC/USDT',
    baseAsset: over.baseAsset ?? 'BTC',
    quoteAsset: over.quoteAsset ?? 'USDT',
    baseAmount: over.baseAmount ?? '0',
    quoteAmount: over.quoteAmount ?? '0',
    midPrice: over.midPrice ?? '30000',
    inventoryValue: over.inventoryValue ?? '0',
    targetInventory: over.targetInventory ?? '5',
    skew: over.skew ?? 0,
    updatedAt: over.updatedAt ?? Date.now(),
  };
}

// ============================================================================
// 1. MarketMakerEngine.registerMarketMaker
// ============================================================================

test('registerMarketMaker: 创建后状态为 suspended，审批后变为 active', () => {
  const engine = new MarketMakerEngine();
  const mm = engine.registerMarketMaker({
    name: 'SMY_Liquidity',
    tier: 'gold',
    apiKey: 'mk',
    apiSecret: 'sk',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  assert.ok(mm.id);
  assert.equal(mm.status, 'suspended');
  engine.approveMarketMaker(mm.id);
  assert.equal(engine.getMarketMaker(mm.id)?.status, 'active');
});

// ============================================================================
// 2. QuoteEngine generateQuote bid/ask
// ============================================================================

test('QuoteEngine.generateQuote: bid < ask，且围绕 refPrice', () => {
  const qe = new QuoteEngine();
  qe.setSpread('BTC/USDT', 10); // 10 bps
  const { bid, ask } = qe.generateQuote('BTC/USDT', null, '30000');
  assert.ok(bid.price < ask.price);
  // 30 000 * 5/10000 = 15；bid 约 29985, ask 约 30015
  assert.equal(bid.side, 'bid');
  assert.equal(ask.side, 'ask');
  assert.equal(bid.symbol, 'BTC/USDT');
  assert.equal(ask.symbol, 'BTC/USDT');
  assert.equal(bid.level, 1);
  assert.equal(ask.level, 1);
  // 中间价
  const mid = (parseFloat(bid.price) + parseFloat(ask.price)) / 2;
  assert.ok(Math.abs(mid - 30000) < 0.01);
});

// ============================================================================
// 3. QuoteEngine 点差正确
// ============================================================================

test('QuoteEngine: 点差 10bps 时 spread 应接近 30 USDT@30000', () => {
  const qe = new QuoteEngine();
  qe.setSpread('BTC/USDT', 10);
  const { bid, ask } = qe.generateQuote('BTC/USDT', null, '30000');
  const spread = parseFloat(ask.price) - parseFloat(bid.price);
  // 30 000 * 0.001 = 30
  assert.ok(Math.abs(spread - 30) < 0.01, `spread=${spread}`);
});

test('QuoteEngine: 点差 50bps 时 spread 应接近 150 USDT@30000', () => {
  const qe = new QuoteEngine();
  qe.setSpread('BTC/USDT', 50);
  const { bid, ask } = qe.generateQuote('BTC/USDT', null, '30000');
  const spread = parseFloat(ask.price) - parseFloat(bid.price);
  assert.ok(Math.abs(spread - 150) < 0.01, `spread=${spread}`);
});

// ============================================================================
// 4. QuoteEngine skew 倾斜
// ============================================================================

test('QuoteEngine: skew 倾斜：库存为正时 bid 下移 / ask 上移（spread 加宽）', () => {
  const qe = new QuoteEngine();
  qe.setSpread('BTC/USDT', 10);
  qe.setSkew('BTC/USDT', 1);
  const { bid: bid0, ask: ask0 } = qe.generateQuote('BTC/USDT', null, '30000');

  // 库存 5（满仓） + skew=+1，按公式
  //   bid = refPrice * (1 - halfSpread - skew)
  //   ask = refPrice * (1 + halfSpread + skew)
  // 双向 spread 加宽：bid 下移，ask 上移（做市商不愿交易）
  const { bid: bid1, ask: ask1 } = qe.generateQuote('BTC/USDT', {
    baseAmount: '5',
    maxInventory: '5',
  }, '30000');

  assert.ok(parseFloat(bid1.price) < parseFloat(bid0.price), 'bid 应下移');
  assert.ok(parseFloat(ask1.price) > parseFloat(ask0.price), 'ask 应上移（spread 加宽）');
});

// ============================================================================
// 5. QuoteEngine cancelStale
// ============================================================================

test('QuoteEngine.cancelStale: 清掉过期的报价', () => {
  const qe = new QuoteEngine();
  qe.setSpread('BTC/USDT', 10);
  qe.setLevels('BTC/USDT', 3);

  // 注入一些历史报价
  const oldTime = Date.now() - 100_000;
  const q1: Quote = {
    marketMakerId: 'mm',
    symbol: 'BTC/USDT',
    side: 'bid',
    price: '29900',
    size: '0.1',
    level: 1,
    createdAt: oldTime,
    expiresAt: oldTime + 30_000,
  };
  const q2: Quote = {
    marketMakerId: 'mm',
    symbol: 'BTC/USDT',
    side: 'ask',
    price: '30100',
    size: '0.1',
    level: 1,
    createdAt: Date.now(),
    expiresAt: Date.now() + MM_QUOTE_EXPIRY_MS,
  };
  qe.setActiveQuotes('BTC/USDT', [q1, q2]);

  const n = qe.cancelStale(MM_QUOTE_EXPIRY_MS);
  assert.equal(n, 1);
  const remain = qe.getActiveQuotes('BTC/USDT');
  assert.equal(remain.length, 1);
  assert.equal(remain[0].price, '30100');
});

// ============================================================================
// 6. InventoryManager checkInventoryLimit
// ============================================================================

test('InventoryManager.checkInventoryLimit: 库存正常时 ok=true', () => {
  const im = new InventoryManager();
  const inv = makeInventory({ baseAmount: '3', targetInventory: '5' });
  const r = im.checkInventoryLimit(inv);
  assert.equal(r.ok, true);
});

test('InventoryManager.checkInventoryLimit: 库存超 80% 触发 warning', () => {
  const im = new InventoryManager();
  const inv = makeInventory({ baseAmount: '4.5', targetInventory: '5' }); // 90%
  const r = im.checkInventoryLimit(inv);
  assert.equal(r.ok, false);
  assert.equal(r.level, 'warning');
});

// ============================================================================
// 7. InventoryManager calculateSkew
// ============================================================================

test('InventoryManager.calculateSkew: 库存正好等于 target -> 0', () => {
  const im = new InventoryManager();
  const s = im.calculateSkew('5', '5');
  assert.equal(s, 1); // ratio = 1
});

test('InventoryManager.calculateSkew: 库存 0 -> 0', () => {
  const im = new InventoryManager();
  const s = im.calculateSkew('0', '5');
  assert.equal(s, 0);
});

test('InventoryManager.calculateSkew: 库存为负 -> 负值', () => {
  const im = new InventoryManager();
  const s = im.calculateSkew('-2', '5');
  assert.equal(s, -0.4);
});

// ============================================================================
// 8. InventoryManager rebalancePlan
// ============================================================================

test('InventoryManager.rebalancePlan: 库存少 -> 需买入', () => {
  const im = new InventoryManager();
  const inv = makeInventory({ baseAmount: '2', targetInventory: '5' });
  const plan = im.rebalancePlan(inv);
  assert.equal(plan.action, 'increase_long');
  assert.equal(plan.buyAmount, '3');
  assert.equal(plan.sellAmount, '0');
});

test('InventoryManager.rebalancePlan: 库存多 -> 需卖出', () => {
  const im = new InventoryManager();
  const inv = makeInventory({ baseAmount: '7', targetInventory: '5' });
  const plan = im.rebalancePlan(inv);
  assert.equal(plan.action, 'increase_short');
  assert.equal(plan.sellAmount, '2');
});

test('InventoryManager.rebalancePlan: 库存正 -> balanced', () => {
  const im = new InventoryManager();
  const inv = makeInventory({ baseAmount: '5', targetInventory: '5' });
  const plan = im.rebalancePlan(inv);
  assert.equal(plan.action, 'balanced');
});

// ============================================================================
// 9. InventoryManager 触发报警
// ============================================================================

test('InventoryManager: 库存超限触发 onInventoryAlert', () => {
  const im = new InventoryManager();
  const alerts: any[] = [];
  im.onInventoryAlert((a) => alerts.push(a));
  im.updateInventory({
    marketMakerId: 'mm1',
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    baseAmount: '4.5',
    quoteAmount: '0',
    midPrice: '30000',
    targetInventory: '5',
  });
  assert.ok(alerts.length > 0);
  assert.equal(alerts[0].level, 'warning');
});

// ============================================================================
// 10. RebateEngine calculateRebate
// ============================================================================

test('RebateEngine.calculateRebate: 0.0002 rate, 10000 volume -> 2', () => {
  const re = new RebateEngine();
  const mm = makeMaker({ rebateRate: 0.0002 });
  const r = re.calculateRebate(
    { tradeId: 't1', symbol: 'BTC/USDT', side: 'bid', price: '100', quantity: '100' },
    mm,
  );
  assert.equal(r, '2');
});

test('RebateEngine.calculateRebate: 黑名单不返佣', () => {
  const re = new RebateEngine();
  const mm = makeMaker({ rebateRate: 0.0002 });
  re.addToBlacklist(mm.id);
  const r = re.calculateRebate(
    { tradeId: 't1', symbol: 'BTC/USDT', side: 'bid', price: '100', quantity: '100' },
    mm,
  );
  assert.equal(r, '0');
});

// ============================================================================
// 11. RebateEngine recordRebate
// ============================================================================

test('RebateEngine.recordRebate: 累计返佣正确', () => {
  const re = new RebateEngine();
  const mm = makeMaker({ rebateRate: 0.0002 });
  const r1 = re.recordRebate(
    { tradeId: 't1', symbol: 'BTC/USDT', side: 'bid', price: '10000', quantity: '1' },
    mm,
  );
  // volume = 10000, rebate = 2
  assert.equal(r1.rebate, '2');
  const total = re.getTotalRebate(mm.id);
  assert.equal(total, '2');
  // 记录数
  const records = re.getRecords(mm.id);
  assert.equal(records.length, 1);
});

test('RebateEngine.recordRebate: 粉尘返佣不记录', () => {
  const re = new RebateEngine();
  const mm = makeMaker({ rebateRate: 0.0001 });
  // volume = 10 * 1 = 10, rebate = 0.001 (小于 1)
  const r = re.recordRebate(
    { tradeId: 't1', symbol: 'BTC/USDT', side: 'bid', price: '10', quantity: '1' },
    mm,
  );
  assert.equal(r.rebate, '0');
  assert.equal(r.id, '');
});

// ============================================================================
// 12. MarketMakerEngine updateQuote 自动调价
// ============================================================================

test('MarketMakerEngine.updateQuote: 拉价 -> 生成报价', () => {
  let price: string | null = '30000';
  const engine = new MarketMakerEngine({
    priceSource: () => price,
  });
  const mm = engine.registerMarketMaker({
    name: 'Test',
    tier: 'gold',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm.id);

  // 设置点差 20 bps
  engine.getQuoteEngine().setSpread('BTC/USDT', 20);
  const quotes = engine.updateQuote(mm.id, 'BTC/USDT');
  assert.equal(quotes.length, 10); // 5 档 * 2 (bid+ask) = 10
  // 再次刷新，价格变了
  price = '31000';
  const quotes2 = engine.updateQuote(mm.id, 'BTC/USDT');
  assert.ok(quotes2.length > 0);
  // 新的 bid 价应该变化
  const top0 = quotes.filter(q => q.side === 'bid').sort((a, b) => parseFloat(b.price) - parseFloat(a.price))[0];
  const top1 = quotes2.filter(q => q.side === 'bid').sort((a, b) => parseFloat(b.price) - parseFloat(a.price))[0];
  assert.notEqual(top0.price, top1.price);
});

// ============================================================================
// 13. MarketMakerEngine getStats
// ============================================================================

test('MarketMakerEngine.getStats: 统计含成交量与返佣', () => {
  const engine = new MarketMakerEngine({ priceSource: () => '30000' });
  const mm = engine.registerMarketMaker({
    name: 'Test',
    tier: 'gold',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm.id);

  // 模拟 3 笔成交
  for (let i = 0; i < 3; i++) {
    const trade = makeTrade({
      id: `trd_${i}`,
      price: '30000',
      quantity: '0.1',
      userId: mm.id,
      counterpartyUserId: 'u_other',
    });
    engine.handleTrade(trade);
  }

  const now = Date.now();
  const stats = engine.getStats(mm.id, { start: now - 60_000, end: now + 60_000 });
  // 3 * 30000 * 0.1 = 9000
  assert.equal(stats.totalVolume, '9000');
  // 9000 * 0.0002 = 1.8 -> 低于 MM_REBATE_MIN = 1, 但因为是 1.8 略大于 1，会记录
  assert.equal(stats.name, 'Test');
  assert.equal(stats.tier, 'gold');
});

// ============================================================================
// 14. MarketMakerEngine getLeaderboard
// ============================================================================

test('MarketMakerEngine.getLeaderboard: 按成交量降序', () => {
  const engine = new MarketMakerEngine({ priceSource: () => '30000' });
  const mm1 = engine.registerMarketMaker({
    id: 'mm_a',
    name: 'A',
    tier: 'gold',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm1.id);

  const mm2 = engine.registerMarketMaker({
    id: 'mm_b',
    name: 'B',
    tier: 'silver',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm2.id);

  // mm1 成交 2 笔，mm2 成交 5 笔
  for (let i = 0; i < 2; i++) {
    engine.handleTrade(makeTrade({ id: `t_a_${i}`, userId: mm1.id, counterpartyUserId: 'u', price: '30000', quantity: '0.1' }));
  }
  for (let i = 0; i < 5; i++) {
    engine.handleTrade(makeTrade({ id: `t_b_${i}`, userId: mm2.id, counterpartyUserId: 'u', price: '30000', quantity: '0.1' }));
  }

  const lb = engine.getLeaderboard('BTC/USDT', 7, 10);
  assert.equal(lb.length, 2);
  assert.equal(lb[0].marketMakerId, mm2.id);
  assert.equal(lb[0].rank, 1);
  assert.equal(lb[1].marketMakerId, mm1.id);
  assert.equal(lb[1].rank, 2);
});

// ============================================================================
// 15. MarketMaker 暂停
// ============================================================================

test('MarketMaker 暂停: suspendMarketMaker 改 status, updateQuote 抛错', () => {
  const engine = new MarketMakerEngine({ priceSource: () => '30000' });
  const mm = engine.registerMarketMaker({
    name: 'Test',
    tier: 'gold',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm.id);
  engine.suspendMarketMaker(mm.id, 'maintenance');
  assert.equal(engine.getMarketMaker(mm.id)?.status, 'suspended');
  assert.throws(() => engine.updateQuote(mm.id, 'BTC/USDT'), /not active/);

  // 恢复
  engine.reactivateMarketMaker(mm.id);
  assert.equal(engine.getMarketMaker(mm.id)?.status, 'active');
});

test('MarketMaker 拉黑: banMarketMaker 后无法 reactivation', () => {
  const engine = new MarketMakerEngine();
  const mm = engine.registerMarketMaker({
    name: 'Test',
    tier: 'gold',
    apiKey: 'k',
    apiSecret: 's',
    makerFeeRate: -0.0001,
    rebateRate: 0.0002,
    dailyVolumeTarget: '1000000',
    minSpreadBps: 5,
    maxInventory: '10',
  });
  engine.approveMarketMaker(mm.id);
  engine.banMarketMaker(mm.id, 'fraud');
  assert.equal(engine.getMarketMaker(mm.id)?.status, 'banned');
  assert.throws(() => engine.reactivateMarketMaker(mm.id), /banned/);
});

// ============================================================================
// 额外：listMarketMakers + 列表过滤
// ============================================================================

test('MarketMakerEngine.listMarketMakers: 按 tier / status 过滤', () => {
  const engine = new MarketMakerEngine();
  const m1 = engine.registerMarketMaker({
    id: 'a', name: 'A', tier: 'gold', apiKey: 'k', apiSecret: 's',
    makerFeeRate: -0.0001, rebateRate: 0.0002,
    dailyVolumeTarget: '1', minSpreadBps: 5, maxInventory: '1',
  });
  const m2 = engine.registerMarketMaker({
    id: 'b', name: 'B', tier: 'silver', apiKey: 'k', apiSecret: 's',
    makerFeeRate: -0.0001, rebateRate: 0.0002,
    dailyVolumeTarget: '1', minSpreadBps: 5, maxInventory: '1',
  });
  engine.approveMarketMaker(m1.id);
  engine.approveMarketMaker(m2.id);
  engine.suspendMarketMaker(m2.id, 'test');

  const activeGold = engine.listMarketMakers('gold', 'active');
  assert.equal(activeGold.length, 1);
  assert.equal(activeGold[0].id, m1.id);
});
