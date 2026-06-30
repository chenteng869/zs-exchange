import { describe, it, expect, beforeEach } from 'vitest';
import { InsuranceFundEngine } from '@/lib/perp/insurance-fund-engine';

describe('InsuranceFundEngine 保险基金引擎', () => {
  let engine: InsuranceFundEngine;

  beforeEach(() => {
    engine = new InsuranceFundEngine('1000000');
  });

  describe('初始状态', () => {
    it('初始余额正确', () => {
      expect(engine.getBalance()).toBe('1000000');
    });

    it('初始状态安全', () => {
      const state = engine.getState();
      expect(state.balance).toBe('1000000');
      expect(state.riskLevel).toBe('safe');
    });
  });

  describe('存款操作', () => {
    it('平台注资增加余额', () => {
      engine.deposit('500000', 'admin', '测试注资');
      expect(engine.getBalance()).toBe('1500000');
    });

    it('强平盈余存入', () => {
      engine.addLiquidationSurplus('BTCUSDT', 'user1', '1000', 'liq_001');
      expect(engine.getBalance()).toBe('1001000');
    });

    it('手续费分配', () => {
      engine.allocateFees('10000', 'BTCUSDT');
      const state = engine.getState();
      expect(parseFloat(state.balance)).toBeGreaterThan(1000000);
      expect(parseFloat(state.totalFeeAllocation)).toBeGreaterThan(0);
    });
  });

  describe('支出操作', () => {
    it('穿仓损失补偿', () => {
      const result = engine.coverBadDebt({
        symbol: 'BTCUSDT',
        userId: 'user1',
        badDebtAmount: '5000',
        bankruptcyPrice: '40000',
        finalFillPrice: '39500',
        positionSize: '1',
        timestamp: Date.now(),
      });

      expect(parseFloat(result.covered)).toBe(5000);
      expect(result.remaining).toBe('0');
      expect(engine.getBalance()).toBe('995000');
    });

    it('大额穿仓保险基金不足时剩余为正', () => {
      const smallEngine = new InsuranceFundEngine('1000');
      const result = smallEngine.coverBadDebt({
        symbol: 'BTCUSDT',
        userId: 'user1',
        badDebtAmount: '5000',
        bankruptcyPrice: '40000',
        finalFillPrice: '39500',
        positionSize: '1',
        timestamp: Date.now(),
      });

      expect(parseFloat(result.covered)).toBe(1000);
      expect(parseFloat(result.remaining)).toBe(4000);
    });

    it('平台提取', () => {
      engine.withdraw('200000', 'admin', '平台提取');
      expect(engine.getBalance()).toBe('800000');
    });

    it('超额提取抛出异常', () => {
      expect(() => {
        engine.withdraw('2000000', 'admin', '超额提取');
      }).toThrow();
    });
  });

  describe('交易记录', () => {
    it('记录所有交易', () => {
      engine.deposit('100000', 'admin', '注资');
      engine.addLiquidationSurplus('BTCUSDT', 'user1', '500', 'liq_1');
      engine.coverBadDebt({
        symbol: 'ETHUSDT',
        userId: 'user2',
        badDebtAmount: '2000',
        bankruptcyPrice: '3000',
        finalFillPrice: '2980',
        positionSize: '10',
        timestamp: Date.now(),
      });

      const txs = engine.getTransactions();
      expect(txs.length).toBeGreaterThanOrEqual(3);
    });

    it('按类型筛选交易', () => {
      engine.deposit('100000', 'admin', '注资');
      engine.addLiquidationSurplus('BTCUSDT', 'user1', '500', 'liq_1');

      const deposits = engine.getTransactions({ type: 'deposit' });
      expect(deposits.length).toBe(1);
      expect(deposits[0].type).toBe('deposit');
    });

    it('穿仓事件记录', () => {
      engine.coverBadDebt({
        symbol: 'BTCUSDT',
        userId: 'user1',
        badDebtAmount: '3000',
        bankruptcyPrice: '40000',
        finalFillPrice: '39700',
        positionSize: '1',
        timestamp: Date.now(),
      });

      const events = engine.getBadDebtEvents();
      expect(events.length).toBe(1);
      expect(parseFloat(events[0].coveredByInsurance)).toBe(3000);
    });
  });

  describe('状态计算', () => {
    it('累计收入和支出正确', () => {
      engine.deposit('500000', 'admin');
      engine.coverBadDebt({
        symbol: 'BTC',
        userId: 'u1',
        badDebtAmount: '200000',
        bankruptcyPrice: '40000',
        finalFillPrice: '38000',
        positionSize: '1',
        timestamp: Date.now(),
      });

      const state = engine.getState();
      expect(parseFloat(state.totalIncome)).toBe(1500000);
      expect(parseFloat(state.totalExpense)).toBe(200000);
      expect(parseFloat(state.balance)).toBe(1300000);
    });
  });

  describe('配置管理', () => {
    it('更新手续费分配率', () => {
      engine.setFeeAllocationRate(0.2);
      const before = engine.getBalance();
      engine.allocateFees('10000', 'BTC');
      const after = engine.getBalance();
      expect(parseFloat(after) - parseFloat(before)).toBeCloseTo(2000, 2);
    });

    it('无效费率抛出异常', () => {
      expect(() => engine.setFeeAllocationRate(-1)).toThrow();
      expect(() => engine.setFeeAllocationRate(2)).toThrow();
    });
  });
});
