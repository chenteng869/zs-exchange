import { describe, it, expect, beforeEach } from 'vitest';
import { SkipListOrderBook } from '@/lib/matching/skip-list-orderbook';

describe('SkipListOrderBook 跳表订单簿', () => {
  let orderBook: SkipListOrderBook;

  beforeEach(() => {
    orderBook = new SkipListOrderBook('BTCUSDT');
  });

  describe('初始状态', () => {
    it('初始订单簿为空', () => {
      const stats = orderBook.getStats();
      expect(stats.totalOrders).toBe(0);
      expect(stats.bidLevels).toBe(0);
      expect(stats.askLevels).toBe(0);
    });

    it('最佳买卖价为空', () => {
      expect(orderBook.getBestBid()).toBeNull();
      expect(orderBook.getBestAsk()).toBeNull();
    });
  });

  describe('限价单添加', () => {
    it('添加买单', () => {
      orderBook.addLimitOrder('order1', 'buy', '45000', '1');
      const stats = orderBook.getStats();
      expect(stats.totalOrders).toBe(1);
      expect(stats.bidLevels).toBe(1);
    });

    it('添加卖单', () => {
      orderBook.addLimitOrder('order1', 'sell', '46000', '1');
      const stats = orderBook.getStats();
      expect(stats.totalOrders).toBe(1);
      expect(stats.askLevels).toBe(1);
    });

    it('同一价格多笔订单累加数量', () => {
      orderBook.addLimitOrder('order1', 'buy', '45000', '1');
      orderBook.addLimitOrder('order2', 'buy', '45000', '2');
      const depth = orderBook.getDepth(1);
      expect(parseFloat(depth.bids[0][1])).toBe(3);
    });

    it('最佳买价为最高买单', () => {
      orderBook.addLimitOrder('order1', 'buy', '44000', '1');
      orderBook.addLimitOrder('order2', 'buy', '45000', '1');
      orderBook.addLimitOrder('order3', 'buy', '43000', '1');
      const best = orderBook.getBestBid();
      expect(best).not.toBeNull();
      expect(best!.price).toBe('45000');
    });

    it('最佳卖价为最低卖单', () => {
      orderBook.addLimitOrder('order1', 'sell', '46000', '1');
      orderBook.addLimitOrder('order2', 'sell', '45500', '1');
      orderBook.addLimitOrder('order3', 'sell', '47000', '1');
      const best = orderBook.getBestAsk();
      expect(best).not.toBeNull();
      expect(best!.price).toBe('45500');
    });
  });

  describe('订单取消', () => {
    it('取消订单后数量减少', () => {
      orderBook.addLimitOrder('order1', 'buy', '45000', '2');
      const removed = orderBook.cancelOrder('order1');
      expect(removed).toBe(true);
      const stats = orderBook.getStats();
      expect(stats.totalOrders).toBe(0);
    });

    it('取消不存在的订单返回 false', () => {
      const result = orderBook.cancelOrder('nonexistent');
      expect(result).toBe(false);
    });

    it('同价位多订单取消一个后剩余正确', () => {
      orderBook.addLimitOrder('order1', 'buy', '45000', '1');
      orderBook.addLimitOrder('order2', 'buy', '45000', '2');
      orderBook.cancelOrder('order1');
      const depth = orderBook.getDepth(1);
      expect(parseFloat(depth.bids[0][1])).toBe(2);
    });
  });

  describe('深度查询', () => {
    it('返回指定层数的深度', () => {
      for (let i = 0; i < 10; i++) {
        orderBook.addLimitOrder(`bid-${i}`, 'buy', `${45000 - i * 10}`, '1');
        orderBook.addLimitOrder(`ask-${i}`, 'sell', `${46000 + i * 10}`, '1');
      }

      const depth = orderBook.getDepth(5);
      expect(depth.bids.length).toBe(5);
      expect(depth.asks.length).toBe(5);
    });

    it('买盘从高到低排序', () => {
      orderBook.addLimitOrder('b1', 'buy', '45000', '1');
      orderBook.addLimitOrder('b2', 'buy', '44000', '1');
      orderBook.addLimitOrder('b3', 'buy', '46000', '1');

      const depth = orderBook.getDepth(10);
      expect(depth.bids[0][0]).toBe('46000');
      expect(depth.bids[1][0]).toBe('45000');
      expect(depth.bids[2][0]).toBe('44000');
    });

    it('卖盘从低到高排序', () => {
      orderBook.addLimitOrder('a1', 'sell', '47000', '1');
      orderBook.addLimitOrder('a2', 'sell', '46000', '1');
      orderBook.addLimitOrder('a3', 'sell', '48000', '1');

      const depth = orderBook.getDepth(10);
      expect(depth.asks[0][0]).toBe('46000');
      expect(depth.asks[1][0]).toBe('47000');
      expect(depth.asks[2][0]).toBe('48000');
    });

    it('累计深度正确', () => {
      orderBook.addLimitOrder('b1', 'buy', '45000', '2');
      orderBook.addLimitOrder('b2', 'buy', '44000', '3');

      const depth = orderBook.getDepth(2);
      expect(parseFloat(depth.bids[0][2])).toBe(2);
      expect(parseFloat(depth.bids[1][2])).toBe(5);
    });
  });

  describe('市价撮合', () => {
    beforeEach(() => {
      orderBook.addLimitOrder('ask1', 'sell', '45000', '1');
      orderBook.addLimitOrder('ask2', 'sell', '45100', '2');
      orderBook.addLimitOrder('ask3', 'sell', '45200', '3');
    });

    it('市价买单吃卖单', () => {
      const result = orderBook.matchMarketOrder('buy', '2');
      expect(result.fills.length).toBeGreaterThan(0);
      expect(parseFloat(result.filledQty)).toBe(2);
    });

    it('市价买单超出卖盘部分未成交', () => {
      const result = orderBook.matchMarketOrder('buy', '10');
      expect(parseFloat(result.filledQty)).toBe(6);
      expect(parseFloat(result.leavesQty)).toBe(4);
    });

    it('空盘时市价单全部未成交', () => {
      const emptyBook = new SkipListOrderBook('EMPTY');
      const result = emptyBook.matchMarketOrder('buy', '10');
      expect(result.fills.length).toBe(0);
      expect(parseFloat(result.filledQty)).toBe(0);
    });
  });

  describe('限价撮合', () => {
    beforeEach(() => {
      orderBook.addLimitOrder('ask1', 'sell', '45000', '2');
      orderBook.addLimitOrder('ask2', 'sell', '45100', '3');
    });

    it('限价买单低于最优卖价 - 挂单', () => {
      const result = orderBook.addLimitOrder('new-buy', 'buy', '44000', '1');
      expect(result.fills.length).toBe(0);
      expect(result.leavesQty).toBe('1');
    });

    it('限价买单高于最优卖价 - 成交', () => {
      const result = orderBook.addLimitOrder('new-buy', 'buy', '46000', '1');
      expect(result.fills.length).toBeGreaterThan(0);
      expect(parseFloat(result.filledQty)).toBe(1);
    });

    it('限价卖单高于最优买价 - 挂单', () => {
      const buyBook = new SkipListOrderBook('TST');
      buyBook.addLimitOrder('bid1', 'buy', '45000', '2');
      const result = buyBook.addLimitOrder('new-sell', 'sell', '46000', '1');
      expect(result.fills.length).toBe(0);
    });

    it('限价卖单低于最优买价 - 成交', () => {
      const buyBook = new SkipListOrderBook('TST');
      buyBook.addLimitOrder('bid1', 'buy', '45000', '2');
      const result = buyBook.addLimitOrder('new-sell', 'sell', '44000', '1');
      expect(result.fills.length).toBe(1);
      expect(parseFloat(result.filledQty)).toBe(1);
    });
  });

  describe('统计信息', () => {
    it('统计订单和价位数量', () => {
      for (let i = 0; i < 5; i++) {
        orderBook.addLimitOrder(`b${i}`, 'buy', `${45000 - i * 100}`, '1');
      }
      for (let i = 0; i < 5; i++) {
        orderBook.addLimitOrder(`a${i}`, 'sell', `${46000 + i * 100}`, '1');
      }

      const stats = orderBook.getStats();
      expect(stats.totalOrders).toBe(10);
      expect(stats.bidLevels).toBe(5);
      expect(stats.askLevels).toBe(5);
    });
  });
});
