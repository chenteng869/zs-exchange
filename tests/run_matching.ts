// Matching tests runner
import { writeFileSync, appendFileSync } from 'fs';
import { MatchingEngine } from '../src/lib/matching/engine';
import { Freezer } from '../src/lib/settlement/freeze';
import { globalLedger } from '../src/lib/settlement/ledger';
import type { Order, OrderRequest, User, TradingPair } from '../src/types/models';

const log = (msg: string) => {
  appendFileSync('d:/tmp/matching_log.txt', msg + '\n');
};

writeFileSync('d:/tmp/matching_log.txt', '');
const results: { name: string; ok: boolean; err?: string }[] = [];

function makeUser(id: string): User {
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

function newEngine() {
  globalLedger.reset();
  const freezer = new Freezer(globalLedger);
  const engine = new MatchingEngine({ freezer });
  const pair = makePair();
  engine.registerPair(pair);
  return { engine, freezer, pair };
}

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
    log(`✓ ${name}`);
  } catch (e: any) {
    results.push({ name, ok: false, err: String(e?.stack ?? e) });
    log(`✗ ${name}\n  ${e?.stack ?? e}`);
  }
}

function assertEq(actual: unknown, expected: unknown, msg?: string) {
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}${msg ? ': ' + msg : ''}`);
  }
}
function assertTrue(cond: boolean, msg?: string) {
  if (!cond) throw new Error(`assertion failed${msg ? ': ' + msg : ''}`);
}

(async () => {
  await test('基础成交：卖一买一完全成交', async () => {
    const { engine, freezer } = newEngine();
    const seller = makeUser('u_seller');
    const buyer = makeUser('u_buyer');
    freezer.setBalance('u_seller', 'BTC', '10');
    freezer.setBalance('u_buyer', 'USDT', '1000000');

    const sellRes = await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.5', price: '30000' });
    assertEq(sellRes.order.status, 'new');
    assertEq(sellRes.trades.length, 0);

    const buyRes = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.5', price: '30000' });
    assertEq(buyRes.trades.length, 1);
    assertEq(buyRes.trades[0].price, '30000');
    assertEq(buyRes.trades[0].quantity, '0.5');
    assertEq(sellRes.order.status, 'filled');
    assertEq(buyRes.order.status, 'filled');

    const sellerUsdt = freezer.getBalance('u_seller', 'USDT');
    assertEq(sellerUsdt.available, '14985');

    const buyerBtc = freezer.getBalance('u_buyer', 'BTC');
    assertEq(buyerBtc.available, '0.4995');
    const buyerUsdt = freezer.getBalance('u_buyer', 'USDT');
    assertEq(buyerUsdt.available, '985000');
  });

  await test('部分成交：买单大，卖单小', async () => {
    const { engine, freezer } = newEngine();
    const seller = makeUser('s');
    const buyer = makeUser('b');
    freezer.setBalance('s', 'BTC', '10');
    freezer.setBalance('b', 'USDT', '1000000');

    await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.3', price: '30000' });
    const buyRes = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '1.0', price: '30000' });
    assertEq(buyRes.trades.length, 1);
    assertEq(buyRes.trades[0].quantity, '0.3');
    assertEq(buyRes.order.status, 'partial');
    assertEq(buyRes.order.executedQty, '0.3');
    assertEq(buyRes.order.remainingQty, '0.7');
  });

  await test('价格优先：更优价先成交', async () => {
    const { engine, freezer } = newEngine();
    const u1 = makeUser('u1');
    const u2 = makeUser('u2');
    const u3 = makeUser('u3');
    freezer.setBalance('u1', 'BTC', '10');
    freezer.setBalance('u2', 'BTC', '10');
    freezer.setBalance('u3', 'USDT', '1000000');

    await engine.submitOrder(u1, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30100' });
    await engine.submitOrder(u2, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
    const res = await engine.submitOrder(u3, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.1', price: '30200' });
    assertEq(res.trades[0].price, '30000');
    assertEq(res.trades[0].quantity, '0.1');
  });

  await test('时间优先：同价位时间早的先成交', async () => {
    const { engine, freezer } = newEngine();
    const u1 = makeUser('u1');
    const u2 = makeUser('u2');
    const buyer = makeUser('buyer');
    freezer.setBalance('u1', 'BTC', '10');
    freezer.setBalance('u2', 'BTC', '10');
    freezer.setBalance('buyer', 'USDT', '1000000');

    const r1 = await engine.submitOrder(u1, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
    await new Promise((r) => setTimeout(r, 5));
    const r2 = await engine.submitOrder(u2, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: '30000' });
    const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.1', price: '30000' });
    assertEq(res.trades[0].makerOrderId, r1.order.id);
  });

  await test('市价单：无对手方时取消', async () => {
    const { engine, freezer } = newEngine();
    const buyer = makeUser('buyer');
    freezer.setBalance('buyer', 'USDT', '1000000');
    const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'market', quantity: '0.1' });
    assertEq(res.trades.length, 0);
    assertEq(res.order.status, 'cancelled');
    const bal = freezer.getBalance('buyer', 'USDT');
    assertEq(bal.frozen, '0');
    assertEq(bal.available, '1000000');
  });

  await test('深度聚合：返回 N 档行情', async () => {
    const { engine, freezer } = newEngine();
    for (let i = 0; i < 10; i++) {
      const u = makeUser('seller' + i);
      freezer.setBalance('seller' + i, 'BTC', '100');
      await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.1', price: String(30000 + i * 10) });
    }
    const snap = engine.getOrderBook('BTC/USDT', 5);
    assertEq(snap.asks.length, 5);
    assertEq(snap.asks[0].price, '30000');
    assertEq(snap.asks[4].price, '30040');
  });

  await test('撤单：未成交单撤掉', async () => {
    const { engine, freezer } = newEngine();
    const u = makeUser('u');
    freezer.setBalance('u', 'BTC', '10');
    const r = await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.5', price: '31000' });
    assertEq(r.order.status, 'new');
    await engine.cancelOrder('u', r.order.id);
    const ord = engine.getOrder(r.order.id);
    assertEq(ord?.status, 'cancelled');
    const bal = freezer.getBalance('u', 'BTC');
    assertEq(bal.frozen, '0');
    assertEq(bal.available, '10');
  });

  await test('IOC：部分成交后剩余撤单', async () => {
    const { engine, freezer } = newEngine();
    const seller = makeUser('seller');
    const buyer = makeUser('buyer');
    freezer.setBalance('seller', 'BTC', '10');
    freezer.setBalance('buyer', 'USDT', '1000000');

    await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.3', price: '30000' });
    const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '1.0', price: '30000', timeInForce: 'IOC' });
    assertEq(res.trades.length, 1);
    assertEq(res.trades[0].quantity, '0.3');
    assertEq(res.order.status, 'cancelled');
    const bal = freezer.getBalance('buyer', 'USDT');
    assertEq(bal.frozen, '0');
    assertEq(bal.available, '991000');
  });

  await test('FOK：对手方不足时全撤', async () => {
    const { engine, freezer } = newEngine();
    const seller = makeUser('seller');
    const buyer = makeUser('buyer');
    freezer.setBalance('seller', 'BTC', '10');
    freezer.setBalance('buyer', 'USDT', '1000000');

    await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.3', price: '30000' });
    const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '1.0', price: '30000', timeInForce: 'FOK' });
    assertEq(res.trades.length, 0);
    assertEq(res.cancelled?.reason, 'FOK cannot fill');
    const bal = freezer.getBalance('buyer', 'USDT');
    assertEq(bal.frozen, '0');
    assertEq(bal.available, '1000000');
  });

  await test('手续费计算：maker 0.1%, taker 0.1%', async () => {
    const { engine, freezer } = newEngine();
    const seller = makeUser('seller');
    const buyer = makeUser('buyer');
    freezer.setBalance('seller', 'BTC', '10');
    freezer.setBalance('buyer', 'USDT', '1000000');

    await engine.submitOrder(seller, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '1', price: '30000' });
    const res = await engine.submitOrder(buyer, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '1', price: '30000' });

    const tr = res.trades[0];
    assertEq(tr.quoteQty, '30000');
    assertEq(tr.fee, '0.001');

    const sellerUsdt = freezer.getBalance('seller', 'USDT');
    assertEq(sellerUsdt.available, '29970');

    const buyerBtc = freezer.getBalance('buyer', 'BTC');
    assertEq(buyerBtc.available, '0.999');
  });

  await test('自成交防止：同 user 跨买卖跳过', async () => {
    const { engine, freezer } = newEngine();
    const u = makeUser('u');
    freezer.setBalance('u', 'BTC', '10');
    freezer.setBalance('u', 'USDT', '1000000');

    await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: '0.5', price: '30000' });
    const res = await engine.submitOrder(u, { symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: '0.5', price: '30000' }, { preventSelfTrade: true });
    assertEq(res.trades.length, 0);
    const snap = engine.getOrderBook('BTC/USDT', 5);
    assertEq(snap.bids.length, 1);
    assertEq(snap.bids[0].price, '30000');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  log('FATAL: ' + (e?.stack ?? e));
  process.exit(2);
});
