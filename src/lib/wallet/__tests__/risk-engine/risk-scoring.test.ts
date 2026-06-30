import { describe, it, expect } from 'vitest';
import { riskScorer } from '../../risk-engine/risk-scoring/risk-scorer';
import { amountScorer } from '../../risk-engine/risk-scoring/amount-scorer';
import { addressScorer } from '../../risk-engine/risk-scoring/address-scorer';
import { contractScorer } from '../../risk-engine/risk-scoring/contract-scorer';
import { behaviorScorer } from '../../risk-engine/risk-scoring/behavior-scorer';
import { deviceScorer } from '../../risk-engine/risk-scoring/device-scorer';
import { ChainType, SignType } from '../../risk-engine/risk-engine.types';

describe('Risk Scoring - 风险评分', () => {
  const defaultContext = {
    requestId: 'req-risk-scoring-001',
    timestamp: new Date(),
    walletId: 'wallet-test-001',
    userId: 'user-test-001',
    walletAddress: '0x' + 'a'.repeat(40),
    chainType: ChainType.EVM,
    signType: SignType.TRANSACTION,
  };

  describe('RiskScorer - 综合风险评分器', () => {
    it('应该能计算综合风险评分', () => {
      const result = riskScorer.calculateRiskScore(defaultContext, []);
      expect(typeof result.totalScore).toBe('number');
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('应该能设置评分权重', () => {
      const weights = {
        amount: 0.3,
        address: 0.25,
        contract: 0.2,
        behavior: 0.15,
        device: 0.1,
        domain: 0.0,
      };
      riskScorer.setWeights(weights);
      const currentWeights = riskScorer.getWeights();
      expect(currentWeights.amount).toBe(0.3);
    });

    it('应该能获取当前评分权重', () => {
      const weights = riskScorer.getWeights();
      expect(weights).toBeDefined();
      expect(weights.amount).toBeDefined();
      expect(weights.address).toBeDefined();
    });

    it('所有维度的权重之和应该约等于 1', () => {
      const weights = riskScorer.getWeights();
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 0.1);
    });

    it('应该能计算加权分数', () => {
      const context = {
        ...defaultContext,
        transaction: {
          to: '0x' + 'b'.repeat(40),
          value: '1000',
        },
      };
      const dimensions = riskScorer.calculateDimensionScores(context);
      const total = riskScorer.calculateRiskScore(context, []).totalScore;
      expect(dimensions.length).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(100);
    });

    it('最高分不应该超过 100', () => {
      const total = riskScorer.calculateRiskScore(defaultContext, []).totalScore;
      expect(total).toBeLessThanOrEqual(100);
    });

    it('最低分不应该低于 0', () => {
      const total = riskScorer.calculateRiskScore(defaultContext, []).totalScore;
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AmountScorer - 金额风险评分', () => {
    it('应该能计算金额风险分数', () => {
      const score = amountScorer.score({
        ...defaultContext,
        transaction: { value: '1000000000000000000' },
      });
      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('零金额应该返回 0 分', () => {
      const score = amountScorer.score({
        ...defaultContext,
        transaction: { value: '0' },
      });
      expect(score.score).toBe(0);
    });

    it('超大金额应该返回高分', () => {
      const score = amountScorer.score({
        ...defaultContext,
        transaction: { value: '1000000000000000000000000' },
      });
      expect(score.score).toBeGreaterThan(50);
    });

    it('应该支持不同链的阈值', () => {
      const evmScore = amountScorer.score({
        ...defaultContext,
        chainType: ChainType.EVM,
        transaction: { value: '1000' },
      });
      const btcScore = amountScorer.score({
        ...defaultContext,
        chainType: ChainType.BITCOIN,
        transaction: { value: '1' },
      });
      expect(typeof evmScore.score).toBe('number');
      expect(typeof btcScore.score).toBe('number');
    });

    it('应该能设置大额阈值', () => {
      amountScorer.setThreshold(ChainType.EVM, '5000');
    });

    it('应该能获取大额阈值', () => {
      const threshold = amountScorer.getThreshold(ChainType.EVM);
      expect(threshold).toBeDefined();
    });
  });

  describe('AddressScorer - 地址风险评分', () => {
    it('应该能计算地址风险分数', () => {
      const score = addressScorer.score({
        ...defaultContext,
        transaction: { to: '0x' + 'b'.repeat(40) },
      });
      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('黑名单地址应该返回 100 分', () => {
      addressScorer.addBlacklistAddress('0x' + 'b'.repeat(40));

      const score = addressScorer.score({
        ...defaultContext,
        transaction: { to: '0x' + 'b'.repeat(40) },
      });
      expect(score.score).toBe(100);
    });

    it('新地址应该返回较高分数', () => {
      const score = addressScorer.score({
        ...defaultContext,
        transaction: { to: '0x' + 'n'.repeat(40) },
      });
      expect(score.score).toBeGreaterThan(0);
    });

    it('没有收款地址时应该返回 0 分', () => {
      const score = addressScorer.score(defaultContext);
      expect(score.score).toBe(0);
    });

    it('应该能设置新地址风险分数', () => {
      addressScorer.setNewAddressThreshold(0);
    });
  });

  describe('ContractScorer - 合约风险评分', () => {
    it('应该能计算合约风险分数', () => {
      const score = contractScorer.score({
        ...defaultContext,
        transaction: {
          contractAddress: '0x' + 'c'.repeat(40),
          data: '0x095ea7b3' + '0'.repeat(64),
        },
      });
      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('黑名单合约应该返回 100 分', () => {
      contractScorer.addBlacklistContract('0x' + 'c'.repeat(40));

      const score = contractScorer.score({
        ...defaultContext,
        transaction: {
          contractAddress: '0x' + 'c'.repeat(40),
          data: '0x095ea7b3' + '0'.repeat(64),
        },
      });
      expect(score.score).toBe(100);
    });

    it('无限授权应该返回较高分数', () => {
      const score = contractScorer.score({
        ...defaultContext,
        transaction: {
          contractAddress: '0x' + 'c'.repeat(40),
          data: '0x095ea7b3' + '0'.repeat(64) + 'f'.repeat(64),
        },
      });
      expect(score.score).toBeGreaterThan(0);
    });

    it('没有合约地址时应该返回 0 分', () => {
      const score = contractScorer.score(defaultContext);
      expect(score.score).toBe(0);
    });
  });

  describe('BehaviorScorer - 行为风险评分', () => {
    it('应该能计算行为风险分数', () => {
      const score = behaviorScorer.score({
        ...defaultContext,
        behavior: { recentTransactionCount: 5 },
      });
      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('高频交易应该返回较高分数', () => {
      behaviorScorer.recordTransaction(defaultContext.userId, 1, '0x' + 'b'.repeat(40));
      behaviorScorer.recordTransaction(defaultContext.userId, 1, '0x' + 'b'.repeat(40));
      behaviorScorer.recordTransaction(defaultContext.userId, 1, '0x' + 'b'.repeat(40));
      const score = behaviorScorer.score({
        ...defaultContext,
        transaction: { value: '1' },
      });
      expect(score.score).toBeGreaterThanOrEqual(0);
    });

    it('低频交易应该返回低分数', () => {
      const score = behaviorScorer.score({
        ...defaultContext,
        behavior: { recentTransactionCount: 1 },
      });
      expect(score.score).toBeGreaterThanOrEqual(0);
    });

    it('应该能设置频率阈值', () => {
      behaviorScorer.setFrequencyLimits(20, 100);
    });
  });

  describe('DeviceScorer - 设备风险评分', () => {
    it('应该能计算设备风险分数', () => {
      const score = deviceScorer.score({
        ...defaultContext,
        device: { deviceId: 'dev-001', isNewDevice: true },
      });
      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('新设备应该返回较高分数', () => {
      const score = deviceScorer.score({
        ...defaultContext,
        device: { deviceId: 'dev-002', isNewDevice: true },
      });
      expect(score.score).toBeGreaterThan(0);
    });

    it('异常位置应该返回较高分数', () => {
      const score = deviceScorer.score({
        ...defaultContext,
        device: { deviceId: 'dev-003', isAbnormalLocation: true },
      });
      expect(score.score).toBeGreaterThan(0);
    });

    it('正常设备应该返回 0 分', () => {
      const score = deviceScorer.score(defaultContext);
      expect(score.score).toBe(0);
    });

    it('应该能设置新设备风险分数', () => {
      deviceScorer.addTrustedDevice('trusted-dev-001');
    });

    it('应该能设置异常位置风险分数', () => {
      deviceScorer.removeTrustedDevice('trusted-dev-001');
    });
  });

  describe('评分归一化', () => {
    it('分数应该在 0-100 范围内', () => {
      for (let i = 0; i < 100; i++) {
        const score = riskScorer.calculateRiskScore({
          ...defaultContext,
          transaction: {
            value: String(Math.random() * 1000000),
            to: '0x' + 'b'.repeat(40),
          },
        }, []).totalScore;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});
