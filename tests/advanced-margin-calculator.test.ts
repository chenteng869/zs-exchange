import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedMarginCalculator } from '@/lib/perp/advanced-margin-calculator';
import type { Position, Contract, Side, MarginMode } from '@/lib/perp/types';

describe('AdvancedMarginCalculator 高级保证金计算器', () => {
  let calculator: AdvancedMarginCalculator;

  beforeEach(() => {
    calculator = new AdvancedMarginCalculator();
  });

  const mockContract: Contract = {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    tickSize: '0.01',
    stepSize: '0.001',
    minQty: '0.001',
    maxQty: '1000',
    minNotional: '10',
    maxLeverage: 125,
    defaultLeverage: 10,
    maintenanceMarginRate: 0.005,
    initialMarginRate: 0.01,
    makerFee: 0.0002,
    takerFee: 0.0004,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  };

  const createPosition = (overrides: Partial<Position> = {}): Position => ({
    id: 'test-pos-1',
    userId: 'user-1',
    symbol: 'BTCUSDT',
    side: 'long',
    marginMode: 'isolated',
    size: '1',
    entryPrice: '45000',
    markPrice: '45500',
    liquidationPrice: '42750',
    leverage: 20,
    margin: '2250',
    unrealizedPnl: '500',
    status: 'open',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  describe('基础计算', () => {
    it('计算名义价值', () => {
      const result = calculator.calculateNotional('1', '45000');
      expect(result).toBe('45000');
    });

    it('计算初始保证金', () => {
      const result = calculator.calculateInitialMargin('45000', 20);
      expect(result).toBe('2250.00000000');
    });

    it('计算维持保证金', () => {
      const result = calculator.calculateMaintenanceMargin('45000', 20);
      expect(result).toBe('225.00000000');
    });
  });

  describe('保证金阶梯', () => {
    it('小额仓位处于第一档', () => {
      const tier = calculator.getMarginTier('10000');
      expect(tier.name).toBe('Tier 1');
      expect(tier.maxLeverage).toBe(100);
    });

    it('大额仓位进入高级档位', () => {
      const tier = calculator.getMarginTier('1000000');
      expect(tier.name).toBe('Tier 4');
      expect(tier.maxLeverage).toBe(10);
    });

    it('超级大额仓位最高档', () => {
      const tier = calculator.getMarginTier('50000000');
      expect(tier.maxLeverage).toBe(2);
    });
  });

  describe('未实现盈亏', () => {
    it('多单价格上涨盈利', () => {
      const pos = createPosition({ side: 'long', entryPrice: '45000' });
      const result = calculator.calculateUnrealizedPnl(pos, '46000');
      expect(parseFloat(result)).toBeCloseTo(1000, 2);
    });

    it('多单价格下跌亏损', () => {
      const pos = createPosition({ side: 'long', entryPrice: '45000' });
      const result = calculator.calculateUnrealizedPnl(pos, '44000');
      expect(parseFloat(result)).toBeCloseTo(-1000, 2);
    });

    it('空单价格下跌盈利', () => {
      const pos = createPosition({ side: 'short', entryPrice: '45000' });
      const result = calculator.calculateUnrealizedPnl(pos, '44000');
      expect(parseFloat(result)).toBeCloseTo(1000, 2);
    });

    it('空单价格上涨亏损', () => {
      const pos = createPosition({ side: 'short', entryPrice: '45000' });
      const result = calculator.calculateUnrealizedPnl(pos, '46000');
      expect(parseFloat(result)).toBeCloseTo(-1000, 2);
    });
  });

  describe('强平价计算', () => {
    it('多单强平价低于开仓价', () => {
      const pos = createPosition({ side: 'long', entryPrice: '45000', leverage: 20 });
      const liqPrice = calculator.calculateLiquidationPrice(pos, mockContract);
      expect(parseFloat(liqPrice)).toBeLessThan(45000);
      expect(parseFloat(liqPrice)).toBeGreaterThan(40000);
    });

    it('空单强平价高于开仓价', () => {
      const pos = createPosition({ side: 'short', entryPrice: '45000', leverage: 20 });
      const liqPrice = calculator.calculateLiquidationPrice(pos, mockContract);
      expect(parseFloat(liqPrice)).toBeGreaterThan(45000);
      expect(parseFloat(liqPrice)).toBeLessThan(50000);
    });

    it('高杠杆强平价更接近开仓价', () => {
      const posLow = createPosition({ side: 'long', entryPrice: '45000', leverage: 10 });
      const posHigh = createPosition({ side: 'long', entryPrice: '45000', leverage: 100 });
      const liqLow = parseFloat(calculator.calculateLiquidationPrice(posLow, mockContract));
      const liqHigh = parseFloat(calculator.calculateLiquidationPrice(posHigh, mockContract));
      expect(liqHigh).toBeGreaterThan(liqLow);
    });

    it('破产价比强平价更极端', () => {
      const pos = createPosition({ side: 'long', entryPrice: '45000', leverage: 20 });
      const liq = parseFloat(calculator.calculateLiquidationPrice(pos, mockContract));
      const bkr = parseFloat(calculator.calculateBankruptcyPrice(pos, mockContract));
      expect(bkr).toBeLessThan(liq);
    });
  });

  describe('完整持仓计算', () => {
    it('计算多单完整保证金信息', () => {
      const pos = createPosition({ side: 'long', size: '1', entryPrice: '45000', leverage: 20, margin: '2250' });
      const result = calculator.calculatePositionMargin(pos, '46000', mockContract);

      expect(parseFloat(result.positionValue)).toBe(46000);
      expect(parseFloat(result.unrealizedPnl)).toBeCloseTo(1000, 2);
      expect(result.riskLevel).toBe('safe');
      expect(parseFloat(result.marginRatio)).toBeGreaterThan(0);
    });

    it('计算空单完整保证金信息', () => {
      const pos = createPosition({ side: 'short', size: '1', entryPrice: '45000', leverage: 20, margin: '2250' });
      const result = calculator.calculatePositionMargin(pos, '44000', mockContract);

      expect(parseFloat(result.unrealizedPnl)).toBeCloseTo(1000, 2);
      expect(result.riskLevel).toBe('safe');
    });
  });

  describe('风险等级', () => {
    it('安全等级', () => {
      const level = calculator.getRiskLevel('0.5', 0.005);
      expect(level).toBe('safe');
    });

    it('危险等级', () => {
      const level = calculator.getRiskLevel('0.005', 0.005);
      expect(level).toBe('liquidation');
    });

    it('高风险等级', () => {
      const level = calculator.getRiskLevel('0.006', 0.005);
      expect(level).toBe('high');
    });
  });

  describe('杠杆调整', () => {
    it('降低杠杆后强平价更远', () => {
      const pos = createPosition({ side: 'long', entryPrice: '45000', leverage: 50, margin: '900' });
      const result = calculator.calculateLeverageChange(pos, 10, '45000', mockContract);

      expect(result.canChange).toBe(true);
      expect(result.newInitialMarginRate).toBe(0.1);
    });

    it('超过档位最大杠杆时拒绝', () => {
      const largePos = createPosition({ side: 'long', entryPrice: '45000', leverage: 10, size: '100', margin: '450000' });
      const result = calculator.calculateLeverageChange(largePos, 100, '45000', mockContract);

      expect(result.canChange).toBe(false);
    });
  });

  describe('开仓预估', () => {
    it('预估开仓参数', () => {
      const result = calculator.estimateOpenPosition('long', '1', '45000', 20, 'isolated');

      expect(parseFloat(result.notional)).toBe(45000);
      expect(parseFloat(result.initialMargin)).toBe(2250);
      expect(parseFloat(result.maintenanceMargin)).toBeGreaterThan(0);
      expect(result.marginTier.maxLeverage).toBeGreaterThanOrEqual(20);
      expect(parseFloat(result.fees.openFee)).toBeGreaterThan(0);
    });
  });
});
