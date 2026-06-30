// Settlement tests runner
import { writeFileSync, appendFileSync } from 'fs';
import { Freezer } from '../src/lib/settlement/freeze';
import { Settler } from '../src/lib/settlement/settler';
import { globalLedger } from '../src/lib/settlement/ledger';
import { SettlementError } from '../src/lib/matching/errors';
import type { MatchResult, Order, TradingPair } from '../src/types/models';

const log = (msg: string) => {
  appendFileSync('d:/tmp/settlement_log.txt', msg + '\n');
};

writeFileSync('d:/tmp/settlement_log.txt', '');
const results: { name: string; ok: boolean; err?: string }[] = [];

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
  await test('冻结/解冻往返', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('u1', 'BTC', '10', '0');
    f.freeze('u1', 'BTC', '3', 'order1', 'freeze');
    let bal = f.getBalance('u1', 'BTC');
    assertEq(bal.available, '7');
    assertEq(bal.frozen, '3');
    f.unfreeze('u1', 'BTC', '2', 'order1', 'unfreeze');
    bal = f.getBalance('u1', 'BTC');
    assertEq(bal.available, '9');
    assertEq(bal.frozen, '1');
  });

  await test('余额不足时 freeze 抛错', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('u1', 'BTC', '1', '0');
    let threw = false;
    try { f.freeze('u1', 'BTC', '5', 'o', 'x'); } catch { threw = true; }
    assertTrue(threw, 'expected SettlementError');
  });

  await test('买入结算：quote 减少、base 增加、手续费扣', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('buyer', 'USDT', '1000000', '0');
    f.setBalance('seller', 'BTC', '10', '0');
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
      takerFee: '0.001',
      makerFee: '30',
      executedAt: new Date().toISOString(),
    };
    const taker = mkOrder({ id: 'taker', userId: 'buyer', side: 'buy' });
    const maker = mkOrder({ id: 'maker', userId: 'seller', side: 'sell' });
    const st = settler.settleMatch({ result, taker, maker, pair });

    const buyerBtc = f.getBalance('buyer', 'BTC');
    assertEq(buyerBtc.available, '0.999');
    const sellerUsdt = f.getBalance('seller', 'USDT');
    assertEq(sellerUsdt.available, '29970');
    const buyerUsdt = f.getBalance('buyer', 'USDT');
    assertEq(buyerUsdt.frozen, '0');
    const sellerBtc = f.getBalance('seller', 'BTC');
    assertEq(sellerBtc.available, '9');
    assertEq(sellerBtc.frozen, '0');

    assertEq(st.quoteQty, '30000');
  });

  await test('卖出结算：base 减少、quote 增加', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('seller', 'BTC', '10', '0');
    f.setBalance('buyer', 'USDT', '1000000', '0');
    f.freeze('seller', 'BTC', '1', 'o_seller', 'pre-freeze');
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
      takerFee: '30',
      makerFee: '0.001',
      executedAt: new Date().toISOString(),
    };
    const taker = mkOrder({ id: 'taker', userId: 'seller', side: 'sell' });
    const maker = mkOrder({ id: 'maker', userId: 'buyer', side: 'buy' });
    settler.settleMatch({ result, taker, maker, pair });

    const sellerUsdt = f.getBalance('seller', 'USDT');
    assertEq(sellerUsdt.available, '29970');
    const buyerBtc = f.getBalance('buyer', 'BTC');
    assertEq(buyerBtc.available, '0.999');
    const sellerBtc = f.getBalance('seller', 'BTC');
    assertEq(sellerBtc.available, '9');
    assertEq(sellerBtc.frozen, '0');
    const buyerUsdt = f.getBalance('buyer', 'USDT');
    assertEq(buyerUsdt.available, '970000');
  });

  await test('ledger 流水生成', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('u1', 'BTC', '10', '0');
    f.freeze('u1', 'BTC', '3', 'order1', 'freeze');
    f.unfreeze('u1', 'BTC', '1', 'order2', 'partial unfreeze');
    const p = globalLedger.getUserLedger('u1', { pageSize: 10 });
    assertTrue(p.total >= 2, 'expected at least 2 entries');
    const types = p.list.map((e) => e.type);
    assertTrue(types.includes('FREEZE'));
    assertTrue(types.includes('UNFREEZE'));
  });

  await test('内部转账', () => {
    globalLedger.reset();
    const f = new Freezer(globalLedger);
    f.setBalance('u1', 'USDT', '1000', '0');
    f.setBalance('u2', 'USDT', '0', '0');
    f.transfer('u1', 'u2', 'USDT', '300', 'ref1', 'gift');
    const b1 = f.getBalance('u1', 'USDT');
    const b2 = f.getBalance('u2', 'USDT');
    assertEq(b1.available, '700');
    assertEq(b2.available, '300');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  log('FATAL: ' + (e?.stack ?? e));
  process.exit(2);
});
