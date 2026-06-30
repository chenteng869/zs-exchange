/**
 * 结算单元测试
 * - 买入结算：quote 减少、base 增加、手续费扣
 * - 卖出结算：base 减少、quote 增加
 * - 冻结/解冻往返
 * - 余额不足时报错
 * - ledger 流水生成
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { Freezer } from '../src/lib/settlement/freeze';
import { Settler } from '../src/lib/settlement/settler';
import { globalLedger, Ledger } from '../src/lib/settlement/ledger';
import { SettlementError } from '../src/lib/matching/errors';
import type { MatchResult, Order, TradingPair } from '../src/types/models';

function makePair(): TradingPair {
  return {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    status: 'trading',
    pricePrecision: 2,
    quantityPrecision: 6,
    minQuantity: '0.0001',
    maxQuantity: '1000',
    minPrice: '1',
    maxPrice: '1000000',
    tickSize: '0.01',
    stepSize: '0.0001',
    makerFee: '0.001',
    takerFee: '0.001',
    icebergAllowed: false,
    marketOrderAllowed: true,
    stopOrderAllowed: true,
  };
}

function mkOrder(over: Partial<Order>): Order {
  return {
    id: over.id ?? 'o_' + Math.random().toString(36).slice(2),
    userId: over.userId ?? 'u',
    symbol: 'BTC/USDT',
    side: over.side ?? 'buy',
    type: 'limit',
    status: 'new',
    timeInForce: 'GTC',
    price: over.price ?? '30000',
    quantity: over.quantity ?? '0.1',
    executedQty: '0',
    remainingQty: over.quantity ?? '0.1',
    cummulativeQuoteQty: '0',
    avgPrice: '0',
    fee: '0',
    feeAsset: 'USDT',
    market: 'spot',
    source: 'web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

test('冻结/解冻往返', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('u1', 'BTC', '10', '0');
  f.freeze('u1', 'BTC', '3', 'order1', 'freeze');
  let bal = f.getBalance('u1', 'BTC');
  assert.equal(bal.available, '7');
  assert.equal(bal.frozen, '3');
  f.unfreeze('u1', 'BTC', '2', 'order1', 'unfreeze');
  bal = f.getBalance('u1', 'BTC');
  assert.equal(bal.available, '9');
  assert.equal(bal.frozen, '1');
});

test('余额不足时 freeze 抛错', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('u1', 'BTC', '1', '0');
  assert.throws(() => f.freeze('u1', 'BTC', '5', 'o', 'x'), SettlementError);
});

test('买入结算：quote 减少、base 增加、手续费扣', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('buyer', 'USDT', '1000000', '0');
  f.setBalance('seller', 'BTC', '10', '0');
  // 模拟成交前的冻结
  f.freeze('buyer', 'USDT', '30000', 'order1', 'pre-freeze');
  f.freeze('seller', 'BTC', '1', 'order2', 'pre-freeze');

  const settler = new Settler(f);
  const pair = makePair();
  const result: MatchResult = {
    takerOrderId: 'taker',
    makerOrderId: 'maker',
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '1',
    takerFee: '0.001', // BTC
    makerFee: '30', // USDT
    executedAt: new Date().toISOString(),
  };
  const taker = mkOrder({ id: 'taker', userId: 'buyer', side: 'buy' });
  const maker = mkOrder({ id: 'maker', userId: 'seller', side: 'sell' });
  const st = settler.settleMatch({ result, taker, maker, pair });

  // 验证 buyer 收到 1 - 0.001 = 0.999 BTC
  const buyerBtc = f.getBalance('buyer', 'BTC');
  assert.equal(buyerBtc.available, '0.999');
  // 验证 seller 收到 30000 - 30 = 29970 USDT
  const sellerUsdt = f.getBalance('seller', 'USDT');
  assert.equal(sellerUsdt.available, '29970');
  // buyer 支付 30000 USDT (从冻结扣减)
  const buyerUsdt = f.getBalance('buyer', 'USDT');
  assert.equal(buyerUsdt.frozen, '0');
  // seller 支付 1 BTC
  const sellerBtc = f.getBalance('seller', 'BTC');
  assert.equal(sellerBtc.available, '9');
  assert.equal(sellerBtc.frozen, '0');

  assert.equal(st.quoteQty, '30000');
});

test('卖出结算：base 减少、quote 增加', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('seller', 'BTC', '10', '0');
  f.setBalance('buyer', 'USDT', '1000000', '0');
  // taker 是卖方，先冻结
  f.freeze('seller', 'BTC', '1', 'o_seller', 'pre-freeze');
  // maker 是买方，先冻结
  f.freeze('buyer', 'USDT', '30000', 'o_buyer', 'pre-freeze');

  const settler = new Settler(f);
  const pair = makePair();
  const result: MatchResult = {
    takerOrderId: 'taker',
    makerOrderId: 'maker',
    symbol: 'BTC/USDT',
    side: 'sell',
    price: '30000',
    quantity: '1',
    takerFee: '30', // USDT (taker 卖)
    makerFee: '0.001', // BTC (maker 买)
    executedAt: new Date().toISOString(),
  };
  const taker = mkOrder({ id: 'taker', userId: 'seller', side: 'sell' });
  const maker = mkOrder({ id: 'maker', userId: 'buyer', side: 'buy' });
  settler.settleMatch({ result, taker, maker, pair });

  // 卖方 (taker) 收 quote - takerFee = 30000 - 30 = 29970
  const sellerUsdt = f.getBalance('seller', 'USDT');
  assert.equal(sellerUsdt.available, '29970');
  // 买方 (maker) 收 base - makerFee = 1 - 0.001 = 0.999
  const buyerBtc = f.getBalance('buyer', 'BTC');
  assert.equal(buyerBtc.available, '0.999');
  // 卖方 base 全部扣完
  const sellerBtc = f.getBalance('seller', 'BTC');
  assert.equal(sellerBtc.available, '9');
  assert.equal(sellerBtc.frozen, '0');
  // 买方 quote 全部付完
  const buyerUsdt = f.getBalance('buyer', 'USDT');
  assert.equal(buyerUsdt.available, '970000');
  assert.equal(buyerUsdt.frozen, '0');
});

test('ledger 流水生成', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('u1', 'BTC', '10', '0');
  f.freeze('u1', 'BTC', '3', 'order1', 'freeze');
  f.unfreeze('u1', 'BTC', '1', 'order2', 'partial unfreeze');
  const p = globalLedger.getUserLedger('u1', { pageSize: 10 });
  // setBalance 不写 ledger，因此只有 2 条：FREEZE + UNFREEZE
  assert.equal(p.total, 2);
  assert.ok(p.list.length >= 2);
  const types = p.list.map((e) => e.type);
  assert.ok(types.includes('FREEZE'));
  assert.ok(types.includes('UNFREEZE'));
  assert.ok(types.includes('UNFREEZE'));
});

test('内部转账', () => {
  globalLedger.reset();
  const f = new Freezer(globalLedger);
  f.setBalance('u1', 'USDT', '1000', '0');
  f.setBalance('u2', 'USDT', '0', '0');
  f.transfer('u1', 'u2', 'USDT', '300', 'ref1', 'gift');
  const b1 = f.getBalance('u1', 'USDT');
  const b2 = f.getBalance('u2', 'USDT');
  assert.equal(b1.available, '700');
  assert.equal(b2.available, '300');
});
