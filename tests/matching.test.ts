/**
 * MatchingEngine 单元测试
 * - 基础成交：卖一买一完全成交
 * - 部分成交：买单大，卖单小
 * - 价格优先：同样价格按时间优先
 * - 时间优先：同价位时间早的先成交
 * - 市价单：无对手方时取消
 * - 深度聚合：返回 N 档行情
 * - 撤单：未成交单撤掉
 * - IOC：部分成交后剩余撤单
 * - FOK：对手方不足时全撤
 * - 手续费计算：maker 0.1%, taker 0.1%
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { MatchingEngine } from '../src/lib/matching/engine';
import { Freezer } from '../src/lib/settlement/freeze';
import { globalLedger } from '../src/lib/settlement/ledger';
import type { Order, OrderRequest, User, TradingPair } from '../src/types/models';

function makeUser(id: string, balanceUsdt = '1000000', balanceBtc = '100'): User {
  return {
    id,
    uid: id,
    username: id,
    kycLevel: 2,
    kycStatus: 'approved',
    userLevel: 0,
    vip: false,
    role: 'user',
    status: 'active',
    twoFAEnabled: false,
    emailVerified: true,
    phoneVerified: true,
    registeredAt: new Date().toISOString(),
  };
}

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

function newEngine(): { engine: MatchingEngine; freezer: Freezer; pair: TradingPair } {
  globalLedger.reset();
  const freezer = new Freezer(globalLedger);
  const engine = new MatchingEngine({ freezer });
  const pair = makePair();
  engine.registerPair(pair);
  return { engine, freezer, pair };
}

function mkOrder(over: Partial<Order>): Order {
  return {
    id: over.id ?? 'o_' + Math.random().toString(36).slice(2),
    userId: over.userId ?? 'u1',
    symbol: 'BTC/USDT',
    side: over.side ?? 'buy',
    type: over.type ?? 'limit',
    status: 'new',
    timeInForce: over.timeInForce ?? 'GTC',
    price: over.price ?? '30000',
    stopPrice: over.stopPrice,
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
  } as Order;
}

test('基础成交：卖一买一完全成交', async () => {
  const { engine, freezer } = newEngine();
  const seller = makeUser('u_seller');
  const buyer = makeUser('u_buyer');
  freezer.setBalance('u_seller', 'BTC', '10');
  freezer.setBalance('u_buyer', 'USDT', '1000000');

  const sellReq: OrderRequest = {
    symbol: 'BTC/USDT',
    side: 'sell',
    type: 'limit',
    quantity: '0.5',
    price: '30000',
  };
  const sellRes = await engine.submitOrder(seller, sellReq);
  assert.equal(sellRes.order.status, 'new');
  assert.equal(sellRes.trades.length, 0);

  const buyReq: OrderRequest = {
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    quantity: '0.5',
    price: '30000',
  };
  const buyRes = await engine.submitOrder(buyer, buyReq);
  assert.equal(buyRes.trades.length, 1);
  assert.equal(buyRes.trades[0].price, '30000');
  assert.equal(buyRes.trades[0].quantity, '0.5');
  assert.equal(sellRes.order.status, 'filled');
  assert.equal(buyRes.order.status, 'filled');

  // 余额校验
  const sellerBtc = freezer.getBalance('u_seller', 'BTC');
  const sellerUsdt = freezer.getBalance('u_seller', 'USDT');
  // 卖 0.5 BTC @ 30000 = 15000 USDT
  // maker 手续费 0.1% * 15000 = 15 USDT
  // seller 收到 15000 - 15 = 14985
  assert.equal(sellerBtc.available, '9.5');
  assert.equal(sellerUsdt.available, '14985');

  const buyerBtc = freezer.getBalance('u_buyer', 'BTC');
  const buyerUsdt = freezer.getBalance('u_buyer', 'USDT');
  // 买 0.5 BTC @ 30000 = 15000 USDT
  // taker 手续费 0.1% * 0.5 BTC = 0.0005 BTC
  // buyer 收到 0.5 - 0.0005 = 0.4995 BTC
  assert.equal(buyerBtc.available, '0.4995');
  // 支付 15000 USDT
  assert.equal(buyerUsdt.available, '985000');
});

test('部分成交：买单大，卖单小', async () => {
  const { engine, freezer } = newEngine();
  const seller = makeUser('u_seller');
  const buyer = makeUser('u_buyer');
  freezer.setBalance('u_seller', 'BTC', '10');
  freezer.setBalance('u_buyer', 'USDT', '1000000');

  await engine.submitOrder(seller, {
    symbol: 'BTC/USDT',
    side: 'sell',
    type: 'limit',
    quantity: '0.3',
    price: '30000',
  });
  const buyRes = await engine.submitOrder(buyer, {
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    quantity: '1.0',
    price: '30000',
  });
  assert.equal(buyRes.trades.length, 1);
  assert.equal(buyRes.trades[0].quantity, '0.3');
  assert.equal(buyRes.order.status, 'partial');
  assert.equal(buyRes.order.executedQty, '0.3');
  assert.equal(buyRes.order.remainingQty, '0.7');
});

test('价格优先：更优价先成交', async () => {
  const { engine, freezer } = newEngine();
  const u1 = makeUser('u1');
  const u2 = makeUser('u2');
  const u3 = makeUser('u3');
  freezer.setBalance('u1', 'BTC', '10');
  freezer.setBalance('u2', 'BTC', '10');
  freezer.setBalance('u3', 'USDT', '1000000');

  await engine.submitOrder(u1, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30100' });
  await engine.submitOrder(u2, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
  // 买家买入，应该先吃 30000
  const res = await engine.submitOrder(u3, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.1', price: '30200' });
  assert.equal(res.trades[0].price, '30000');
  assert.equal(res.trades[0].quantity, '0.1');
});

test('时间优先：同价位时间早的先成交', async () => {
  const { engine, freezer } = newEngine();
  const u1 = makeUser('u1');
  const u2 = makeUser('u2');
  const buyer = makeUser('buyer');
  freezer.setBalance('u1', 'BTC', '10');
  freezer.setBalance('u2', 'BTC', '10');
  freezer.setBalance('buyer', 'USDT', '1000000');

  const r1 = await engine.submitOrder(u1, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
  // 强制制造时间差
  await new Promise((r) => setTimeout(r, 5));
  const r2 = await engine.submitOrder(u2, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
  // buyer 吃 0.1，先吃 u1
  const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.1', price: '30000' });
  assert.equal(res.trades[0].makerOrderId, r1.order.id);
  assert.notEqual(res.trades[0].makerOrderId, r2.order.id);
});

test('市价单：无对手方时取消', async () => {
  const { engine, freezer } = newEngine();
  const buyer = makeUser('buyer');
  freezer.setBalance('buyer', 'USDT', '1000000');
  const res = await engine.submitOrder(buyer, {
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: '0.1',
  });
  assert.equal(res.trades.length, 0);
  // 市价无对手方时 status 应该是 cancelled (via updateOrderState 的 IOC/FOK 分支)
  // 实际我们的实现：remaining 仍为 quantity，orderbook 不入簿，但 updateOrderState 判断
  // "executed == quantity" -> filled; "executed > 0 && < quantity" -> cancelled
  // "executed == 0" -> cancelled
  assert.equal(res.order.status, 'cancelled');
  // 资金应已解冻
  const bal = freezer.getBalance('buyer', 'USDT');
  assert.equal(bal.frozen, '0');
  assert.equal(bal.available, '1000000');
});

test('深度聚合：返回 N 档行情', async () => {
  const { engine, freezer } = newEngine();
  const u = makeUser('u');
  freezer.setBalance('u', 'BTC', '100');
  for (let i = 0; i < 10; i++) {
    await engine.submitOrder(u, {
      symbol: 'BTC/USDT',
      side: 'sell',
      type: 'limit',
      quantity: '0.1',
      price: String(30000 + i * 10),
    });
  }
  const snap = engine.getOrderBook('BTC/USDT', 5);
  assert.equal(snap.asks.length, 5);
  assert.equal(snap.asks[0].price, '30000');
  assert.equal(snap.asks[4].price, '30040');
});

test('撤单：未成交单撤掉', async () => {
  const { engine, freezer } = newEngine();
  const u = makeUser('u');
  freezer.setBalance('u', 'BTC', '10');
  const r = await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.5', price: '31000' });
  assert.equal(r.order.status, 'new');
  await engine.cancelOrder('u', r.order.id);
  const ord = engine.getOrder(r.order.id);
  assert.equal(ord?.status, 'cancelled');
  // 资金解冻
  const bal = freezer.getBalance('u', 'BTC');
  assert.equal(bal.frozen, '0');
  assert.equal(bal.available, '10');
});

test('IOC：部分成交后剩余撤单', async () => {
  const { engine, freezer } = newEngine();
  const seller = makeUser('seller');
  const buyer = makeUser('buyer');
  freezer.setBalance('seller', 'BTC', '10');
  freezer.setBalance('buyer', 'USDT', '1000000');

  await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.3', price: '30000' });
  const res = await engine.submitOrder(buyer, {
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    quantity: '1.0',
    price: '30000',
    timeInForce: 'IOC',
  });
  assert.equal(res.trades.length, 1);
  assert.equal(res.trades[0].quantity, '0.3');
  assert.equal(res.order.status, 'cancelled');
  // buyer 冻结 30000 * 1.0 = 30000；吃 0.3 后 unfreeze 0.7 部分 = 30000*0.7=21000
  const bal = freezer.getBalance('buyer', 'USDT');
  assert.equal(bal.frozen, '0');
  // 实际支付 30000*0.3 = 9000
  assert.equal(bal.available, '991000');
});

test('FOK：对手方不足时全撤', async () => {
  const { engine, freezer } = newEngine();
  const seller = makeUser('seller');
  const buyer = makeUser('buyer');
  freezer.setBalance('seller', 'BTC', '10');
  freezer.setBalance('buyer', 'USDT', '1000000');

  await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.3', price: '30000' });
  const res = await engine.submitOrder(buyer, {
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    quantity: '1.0',
    price: '30000',
    timeInForce: 'FOK',
  });
  assert.equal(res.trades.length, 0);
  assert.equal(res.cancelled?.reason, 'FOK cannot fill');
  // 资金应解冻
  const bal = freezer.getBalance('buyer', 'USDT');
  assert.equal(bal.frozen, '0');
  assert.equal(bal.available, '1000000');
});

test('手续费计算：maker 0.1%, taker 0.1%', async () => {
  const { engine, freezer } = newEngine();
  const seller = makeUser('seller');
  const buyer = makeUser('buyer');
  freezer.setBalance('seller', 'BTC', '10');
  freezer.setBalance('buyer', 'USDT', '1000000');

  // 卖单先挂（maker）
  await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '1', price: '30000' });
  // 买单吃（taker）
  const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '1', price: '30000' });

  // 成交价 30000 * 1 = 30000
  // maker fee 0.1% = 30 USDT  → 卖家收 15000 + 15000 - 30
  // taker fee 0.1% = 0.001 BTC → 买家收 1 - 0.001 = 0.999
  const tr = res.trades[0];
  assert.equal(tr.quoteQty, '30000');
  assert.equal(tr.fee, '0.001'); // taker fee (BTC)

  const sellerBtc = freezer.getBalance('seller', 'BTC');
  const sellerUsdt = freezer.getBalance('seller', 'USDT');
  assert.equal(sellerBtc.available, '9');
  assert.equal(sellerUsdt.available, '29970');

  const buyerBtc = freezer.getBalance('buyer', 'BTC');
  const buyerUsdt = freezer.getBalance('buyer', 'USDT');
  assert.equal(buyerBtc.available, '0.999');
  assert.equal(buyerUsdt.available, '970000');
});

test('自成交防止：同 user 跨买卖跳过', async () => {
  const { engine, freezer } = newEngine();
  const u = makeUser('u');
  freezer.setBalance('u', 'BTC', '10');
  freezer.setBalance('u', 'USDT', '1000000');

  await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.5', price: '30000' });
  // 同用户买单应被自成交防止：进入簿而不是吃掉自己
  const res = await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.5', price: '30000' }, { preventSelfTrade: true });
  assert.equal(res.trades.length, 0);
  // 自成交防止：买单应挂在买盘
  const snap = engine.getOrderBook('BTC/USDT', 5);
  assert.equal(snap.bids.length, 1);
  assert.equal(snap.bids[0].price, '30000');
});
