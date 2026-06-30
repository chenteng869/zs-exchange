/**
 * 行情模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  MarketFeed,
  createDefaultMarket,
  DEFAULT_SYMBOLS,
} from '../src/lib/market/feed';
import {
  generateKlineFromTrades,
  generateHistoricalKlines,
  bucketStart,
} from '../src/lib/market/kline';

describe('行情模块单元测试', () => {
  it('MarketFeed：注册交易对后 ticker 存在', () => {
  const feed = new MarketFeed();
  feed.registerSymbol('BTC/USDT', 67000);
  const t = feed.getTicker('BTC/USDT');
  expect(t).toBeTruthy();
  expect(t!.symbol).toBe('BTC/USDT');
  expect(t!.lastPrice).toBe('67000.00');
  });

  it('MarketFeed：默认 50+ 交易对', () => {
  const feed = createDefaultMarket();
  expect(feed.getAllTickers().length).toBeGreaterThanOrEqual(50);
  expect(feed.getAllTickers().length).toBe(DEFAULT_SYMBOLS.length);
  });

  it('MarketFeed：订阅 ticker 频道', async () => {
  const feed = new MarketFeed(50);
  feed.registerSymbol('TEST/USDT', 100);
  await new Promise<void>((resolve) => {
    feed.subscribe('ticker:TEST/USDT', (data) => {
      expect(data).toBeTruthy();
      feed.stop();
      resolve();
    });
    feed.start();
    // tick 50ms 后会推送
  });
  });

  it('K线：从 trades 聚合成 K 线', () => {
  const trades = [
    { id: '1', symbol: 'X', price: '100', quantity: '1', side: 'buy' as const, timestamp: new Date(1000).toISOString() },
    { id: '2', symbol: 'X', price: '101', quantity: '2', side: 'sell' as const, timestamp: new Date(2000).toISOString() },
    { id: '3', symbol: 'X', price: '99', quantity: '1.5', side: 'buy' as const, timestamp: new Date(3000).toISOString() },
  ];
  const ks = generateKlineFromTrades(trades, '1m');
  expect(ks.length).toBe(1);
  expect(ks[0].open).toBe('100');
  expect(ks[0].high).toBe('101');
  expect(ks[0].low).toBe('99');
  expect(ks[0].close).toBe('99');
  expect(ks[0].trades).toBe(3);
  });

  it('K线：bucketStart 对齐到周期起点', () => {
  // 任意时间戳，1m 周期应返回整分钟
  const t = new Date('2025-01-01T10:23:45.678Z').getTime();
  const bs = bucketStart(t, '1m');
  const d = new Date(bs);
  expect(d.getUTCSeconds()).toBe(0);
  expect(d.getUTCMilliseconds()).toBe(0);
  });

  it('K线：generateHistoricalKlines 确定性输出', () => {
  const a = generateHistoricalKlines('BTC/USDT', '1h', 24, 1700000000000, 67000, 1);
  const b = generateHistoricalKlines('BTC/USDT', '1h', 24, 1700000000000, 67000, 1);
  expect(a.length).toBe(24);
  for (let i = 0; i < 24; i++) {
    expect(a[i].open).toBe(b[i].open);
    expect(a[i].close).toBe(b[i].close);
  }
  });

  it('K线：generateHistoricalKlines 不同 seed 不同结果', () => {
  const a = generateHistoricalKlines('BTC/USDT', '1h', 10, 1700000000000, 67000, 1);
  const b = generateHistoricalKlines('BTC/USDT', '1h', 10, 1700000000000, 67000, 2);
  // 至少一根不同
  let diff = false;
  for (let i = 0; i < 10; i++) {
    if (a[i].close !== b[i].close) { diff = true; break; }
  }
  expect(diff).toBe(true);
  });
});
