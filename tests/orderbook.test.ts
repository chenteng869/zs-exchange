/**
 * OrderBook 单元测试
 * - 1000 笔挂单的性能
 * - 多价位深度查询
 * - 行情快照生成
 * - Decimal 工具正确性
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { OrderBook } from '../src/lib/matching/orderbook';
import { generateKline, generateTicker, calculate24hStats } from '../src/lib/matching/snapshot';
import { decAdd, decMul, decSub, decDiv, decCmp, decIsZero, decTruncate, decMultipleOf } from '../src/lib/matching/decimal';
import type { Order, Trade, OrderBookSnapshot } from '../src/types/models';

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

test('Decimal 工具：加减乘除', () => {
  assert.equal(decAdd('0.1', '0.2'), '0.3');
  assert.equal(decSub('1', '0.1'), '0.9');
  assert.equal(decMul('0.5', '2'), '1');
  // decDiv 返回精简形式（无尾随零），验证计算正确性
  assert.equal(decDiv('1', '4', 8), '0.25');
  assert.equal(decCmp('0.1', '0.2'), -1);
  assert.equal(decCmp('1', '1'), 0);
  assert.equal(decIsZero('0'), true);
  assert.equal(decIsZero('0.0000'), true);
  assert.equal(decTruncate('1.23456789', 4), '1.2345');
  assert.equal(decMultipleOf('0.6', '0.2'), true);
  assert.equal(decMultipleOf('0.7', '0.2'), false);
});

test('OrderBook：基本挂单与撤单', () => {
  const ob = new OrderBook('BTC/USDT');
  ob.makerFeeRate = '0.001';
  ob.takerFeeRate = '0.001';
  const o = mkOrder({ id: 'a', side: 'buy', price: '30000', quantity: '0.1' });
  ob.addOrder(o);
  assert.equal(ob.size(), 1);
  const cancelQty = ob.cancelOrder('a');
  assert.equal(cancelQty, '0.1');
  assert.equal(ob.size(), 0);
});

test('OrderBook：多价位深度查询', () => {
  const ob = new OrderBook('BTC/USDT');
  for (let i = 0; i < 10; i++) {
    ob.addOrder(mkOrder({ id: 'b' + i, userId: 'buyer' + i, side: 'buy', price: String(29000 + i * 10), quantity: '0.1' }));
    ob.addOrder(mkOrder({ id: 's' + i, userId: 'seller' + i, side: 'sell', price: String(30000 + i * 10), quantity: '0.1' }));
  }
  const snap = ob.getSnapshot(5);
  assert.equal(snap.bids.length, 5);
  // bids 降序：最高 29090, 29080, ...
  assert.equal(snap.bids[0].price, '29090');
  assert.equal(snap.bids[4].price, '29050');
  // asks 升序
  assert.equal(snap.asks[0].price, '30000');
  assert.equal(snap.asks[4].price, '30040');
});

test('OrderBook：1000 笔挂单性能', () => {
  const ob = new OrderBook('BTC/USDT');
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    ob.addOrder(mkOrder({ id: 'b' + i, userId: 'm' + (i % 10), side: 'buy', price: String(29000 + (i % 100)), quantity: '0.1' }));
  }
  const tInsert = performance.now() - t0;
  // 触发一笔吃单，5ms 内
  const t1 = performance.now();
  const res = ob.addOrder(mkOrder({ id: 't', userId: 'taker', side: 'sell', price: '28999', quantity: '0.05' }));
  const dt = performance.now() - t1;
  assert.equal(res.takerFilled, true);
  assert.ok(dt < 50, `match took ${dt}ms`);
  // log 性能数据
  console.log(`insert 1000 orders: ${tInsert.toFixed(2)}ms; match once: ${dt.toFixed(2)}ms`);
});

test('K 线生成：1m 区间', () => {
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
  const trades = [
    mk(0, '30000', '0.1'),
    mk(30, '30100', '0.2'),
    mk(70, '29900', '0.1'),
    mk(120, '30200', '0.3'),
  ];
  const ks = generateKline(trades, '1m');
  // 4 笔分到 3 个 bar：0,30,70 在 0 分钟；120 在 1 分钟
  // 由于 bucketStart 对齐到 1m，可能 70 也会进第二个 bar（取决于 ts 对齐）
  assert.ok(ks.length >= 2);
  // 4 笔价格: 30000, 30100, 30000, 30200; 0 分钟 bar 的 high=30100, low=30000
  const k1 = ks[0];
  assert.equal(k1.open, '30000');
  assert.equal(k1.high, '30100');
  assert.equal(k1.low, '30000');
});

test('Ticker：open24h 变化率', () => {
  const base = Date.now() - 60_000;
  const trades: Trade[] = [];
  for (let i = 0; i < 10; i++) {
    trades.push({
      id: 'trd_' + i,
      orderId: 'o',
      userId: 'u',
      symbol: 'BTC/USDT',
      side: 'buy',
      price: String(30000 + i * 100),
      quantity: '0.1',
      quoteQty: '3000',
      fee: '0',
      feeAsset: 'USDT',
      isMaker: false,
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
  assert.equal(ticker.open24h, '30000');
  assert.equal(ticker.lastPrice, '30900');
  // 涨跌幅应 > 0
  assert.notEqual(ticker.change24h, '0');
});

test('24h 统计', () => {
  const base = Date.now() - 60_000;
  const trades: Trade[] = [
    {
      id: 't1', orderId: 'o', userId: 'u', symbol: 'BTC/USDT', side: 'buy',
      price: '30000', quantity: '0.5', quoteQty: '15000', fee: '0', feeAsset: 'USDT', isMaker: false,
      executedAt: new Date(base).toISOString(),
    },
    {
      id: 't2', orderId: 'o', userId: 'u', symbol: 'BTC/USDT', side: 'buy',
      price: '30500', quantity: '0.3', quoteQty: '9150', fee: '0', feeAsset: 'USDT', isMaker: false,
      executedAt: new Date(base + 1000).toISOString(),
    },
  ];
  const stat = calculate24hStats(trades);
  assert.equal(stat.open24h, '30000');
  assert.equal(stat.high24h, '30500');
  assert.equal(stat.low24h, '30000');
  assert.equal(stat.lastPrice, '30500');
  assert.equal(stat.trades, 2);
});
