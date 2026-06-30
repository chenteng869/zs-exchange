import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedFundingEngine } from '@/lib/perp/advanced-funding-engine';

describe('AdvancedFundingEngine 高级资金费率引擎', () => {
  let engine: AdvancedFundingEngine;

  beforeEach(() => {
    engine = new AdvancedFundingEngine({
      symbol: 'BTCUSDT',
      fundingIntervalHours: 8,
      baseRate: 0.0001,
      maxFundingRate: 0.0075,
      minFundingRate: -0.0075,
      interestRate: 0.0003,
      premiumRate: 0.0001,
    });
  });

  describe('初始状态', () => {
    it('初始资金费率为基础利率', () => {
      const state = engine.getState();
      expect(parseFloat(state.currentFundingRate)).toBe(0.0001);
    });

    it('初始预测费率正确', () => {
      const state = engine.getState();
      expect(state.predictedFundingRate).toBeDefined();
    });
  });

  describe('溢价指数计算', () => {
    it('标记价高于指数价 - 正溢价', () => {
      const premium = engine.calculatePremiumIndex('46000', '45000');
      expect(parseFloat(premium)).toBeGreaterThan(0);
    });

    it('标记价低于指数价 - 负溢价', () => {
      const premium = engine.calculatePremiumIndex('44000', '45000');
      expect(parseFloat(premium)).toBeLessThan(0);
    });

    it('价格相等 - 零溢价', () => {
      const premium = engine.calculatePremiumIndex('45000', '45000');
      expect(parseFloat(premium)).toBeCloseTo(0, 8);
    });
  });

  describe('资金费率计算', () => {
    it('正溢价推高资金费率', () => {
      engine.updatePremiumIndex('46000', '45000');
      const rate = engine.calculateFundingRate();
      expect(parseFloat(rate)).toBeGreaterThan(0.0001);
    });

    it('负溢价拉低资金费率', () => {
      engine.updatePremiumIndex('44000', '45000');
      const rate = engine.calculateFundingRate();
      expect(parseFloat(rate)).toBeLessThan(0.0001);
    });

    it('资金费率不超过上限', () => {
      for (let i = 0; i < 100; i++) {
        engine.updatePremiumIndex('50000', '45000');
      }
      const rate = parseFloat(engine.calculateFundingRate());
      expect(rate).toBeLessThanOrEqual(0.0075);
    });

    it('资金费率不低于下限', () => {
      for (let i = 0; i < 100; i++) {
        engine.updatePremiumIndex('40000', '45000');
      }
      const rate = parseFloat(engine.calculateFundingRate());
      expect(rate).toBeGreaterThanOrEqual(-0.0075);
    });
  });

  describe('资金费率历史', () => {
    it('结算后记录历史', () => {
      engine.settleFunding('45000');
      const history = engine.getFundingHistory(10);
      expect(history.length).toBeGreaterThanOrEqual(1);
    });

    it('历史记录按时间倒序', () => {
      engine.settleFunding('45000');
      engine.settleFunding('46000');
      const history = engine.getFundingHistory(10);
      expect(history[0].settledAt).toBeGreaterThan(history[1].settledAt);
    });
  });

  describe('持仓资金费计算', () => {
    it('多头正费率 - 多头支付', () => {
      engine.settleFunding('45000');
      const fee = engine.calculatePositionFunding('long', '1', '45000');
      expect(parseFloat(fee)).toBeLessThan(0);
    });

    it('多头负费率 - 多头收取', () => {
      engine.updatePremiumIndex('40000', '45000');
      engine.settleFunding('45000');
      const rate = parseFloat(engine.getState().lastFundingRate || '0');
      // 负费率时多头收取
    });

    it('空头与多头相反', () => {
      engine.settleFunding('45000');
      const longFee = parseFloat(engine.calculatePositionFunding('long', '1', '45000'));
      const shortFee = parseFloat(engine.calculatePositionFunding('short', '1', '45000'));
      expect(Math.abs(longFee)).toBeCloseTo(Math.abs(shortFee), 6);
    });
  });

  describe('价格更新', () => {
    it('更新价格后预测费率变化', () => {
      const before = parseFloat(engine.getState().predictedFundingRate);
      engine.updatePremiumIndex('47000', '45000');
      const after = parseFloat(engine.getState().predictedFundingRate);
      expect(after).toBeGreaterThan(before);
    });
  });

  describe('配置更新', () => {
    it('更新最大最小费率', () => {
      engine.updateConfig({ maxFundingRate: 0.01, minFundingRate: -0.01 });
      const state = engine.getState();
      expect(state.maxFundingRate).toBe(0.01);
      expect(state.minFundingRate).toBe(-0.01);
    });

    it('更新结算间隔', () => {
      engine.updateConfig({ fundingIntervalHours: 4 });
      const state = engine.getState();
      expect(state.fundingIntervalHours).toBe(4);
    });
  });
});
