// 自定义简单测试运行器
// 避免 node:test 在 Windows 上的 stdout 缓冲问题
import { writeFileSync, appendFileSync } from 'fs';
import { performance } from 'perf_hooks';
import { OrderBook } from '../src/lib/matching/orderbook';
import {
  decAdd,
  decMul,
  decSub,
  decDiv,
  decCmp,
  decIsZero,
  decTruncate,
  decMultipleOf,
} from '../src/lib/matching/decimal';
import { generateKline, generateTicker, calculate24hStats } from '../src/lib/matching/snapshot';
import type { Order, Trade, OrderBookSnapshot } from '../src/types/models';

const log = (msg: string) => {
  appendFileSync('d:/tmp/test_log.txt', msg + '\n');
  // eslint-disable-next-line no-console
  console.log(msg);
};

writeFileSync('d:/tmp/test_log.txt', '');
const results: { name: string; ok: boolean; err?: string }[] = [];

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
  } as Order;
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
  await test('Decimal 工具：加减乘除', () => {
    assertEq(decAdd('0.1', '0.2'), '0.3');
    assertEq(decSub('1', '0.1'), '0.9');
    assertEq(decMul('0.5', '2'), '1');
    assertEq(decDiv('1', '4', 8), '0.25');
    assertEq(decCmp('0.1', '0.2'), -1);
    assertEq(decIsZero('0'), true);
    assertEq(decTruncate('1.23456789', 4), '1.2345');
    assertEq(decMultipleOf('0.6', '0.2'), true);
  });

  await test('OrderBook: 基本挂单与撤单', () => {
    const ob = new OrderBook('BTC/USDT');
    ob.addOrder(mkOrder({ id: 'a', side: 'buy', price: '30000', quantity: '0.1' }));
    assertEq(ob.size(), 1);
    const r = ob.cancelOrder('a');
    assertEq(r, '0.1');
    assertEq(ob.size(), 0);
  });

  await test('OrderBook: 多价位深度查询', () => {
    const ob = new OrderBook('BTC/USDT');
    for (let i = 0; i < 10; i++) {
      ob.addOrder(mkOrder({ id: 'b' + i, side: 'buy', price: String(29000 + i * 10), quantity: '0.1' }));
      ob.addOrder(mkOrder({ id: 's' + i, userId: 's', side: 'sell', price: String(30000 + i * 10), quantity: '0.1' }));
    }
    const snap = ob.getSnapshot(5);
    assertEq(snap.bids.length, 5);
    assertEq(snap.bids[0].price, '29090');
    assertEq(snap.asks[0].price, '30000');
  });

  await test('OrderBook: 1000 笔挂单性能', () => {
    const ob = new OrderBook('BTC/USDT');
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) {
      ob.addOrder(mkOrder({ id: 'b' + i, userId: 'm' + (i % 10), side: 'buy', price: String(29000 + (i % 100)), quantity: '0.1' }));
    }
    const tIns = performance.now() - t0;
    const t1 = performance.now();
    const res = ob.addOrder(mkOrder({ id: 't', userId: 'taker', side: 'sell', price: '28999', quantity: '0.05' }));
    const dt = performance.now() - t1;
    assertEq(res.takerFilled, true);
    assertTrue(dt < 50, `match took ${dt}ms`);
    log(`  [perf] insert 1000: ${tIns.toFixed(2)}ms, match: ${dt.toFixed(2)}ms`);
  });

  await test('K 线生成: 1m 区间', () => {
    const base = 1_700_000_000_000;
    const mk = (offset: number, price: string, qty: string): Trade => ({
      id: 'trd_' + offset,
      orderId: 'o',
      userId: 'u',
      symbol: 'BTC/USDT',
      side: 'buy',
      price,
      quantity: qty,
      quoteQty: decMul(price, qty),
      fee: '0',
      feeAsset: 'USDT',
      isMaker: false,
      executedAt: new Date(base + offset * 1000).toISOString(),
    });
    const trades = [mk(0, '30000', '0.1'), mk(30, '30100', '0.2'), mk(70, '29900', '0.1'), mk(120, '30200', '0.3')];
    const ks = generateKline(trades, '1m');
    assertTrue(ks.length >= 2);
    assertEq(ks[0].open, '30000');
  });

  await test('Ticker: open24h 变化率', () => {
    const base = Date.now() - 60_000;
    const trades: Trade[] = [];
    for (let i = 0; i < 10; i++) {
      trades.push({
        id: 'trd_' + i, orderId: 'o', userId: 'u', symbol: 'BTC/USDT', side: 'buy',
        price: String(30000 + i * 100), quantity: '0.1', quoteQty: '3000', fee: '0', feeAsset: 'USDT', isMaker: false,
        executedAt: new Date(base + i * 1000).toISOString(),
      });
    }
    const snap: OrderBookSnapshot = {
      symbol: 'BTC/USDT',
      bids: [{ price: '30900', quantity: '0.1', orderCount: 1 }],
      asks: [{ price: '31000', quantity: '0.1', orderCount: 1 }],
      lastUpdateId: 1,
      timestamp: new Date().toISOString(),
    };
    const ticker = generateTicker('BTC/USDT', 'BTC', 'USDT', snap, trades);
    assertEq(ticker.open24h, '30000');
    assertEq(ticker.lastPrice, '30900');
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  log('FATAL: ' + (e?.stack ?? e));
  process.exit(2);
});
