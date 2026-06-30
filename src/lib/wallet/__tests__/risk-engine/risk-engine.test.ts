import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { RiskEngine } from '../../risk-engine/risk-engine';
import { RiskLevel, RiskAction, ChainType, SignType } from '../../risk-engine/risk-engine.types';

vi.mock('../../risk-engine/risk-scoring/risk-scorer', () => ({
  riskScorer: {
    calculateScore: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-scoring/amount-scorer', () => ({
  amountScorer: {
    score: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-scoring/address-scorer', () => ({
  addressScorer: {
    score: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-scoring/contract-scorer', () => ({
  contractScorer: {
    score: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-scoring/behavior-scorer', () => ({
  behaviorScorer: {
    score: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-scoring/device-scorer', () => ({
  deviceScorer: {
    score: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../../risk-engine/risk-decision.engine', () => ({
  riskDecisionEngine: {
    decide: vi.fn().mockReturnValue({
      action: 'allow',
      level: 'low',
    }),
  },
}));

vi.mock('../../risk-engine/risk-event.service', () => ({
  riskEventService: {
    recordEvent: vi.fn(),
    getEvents: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('../../risk-engine/blacklist.service', () => ({
  blacklistService: {
    isAddressBlacklisted: vi.fn().mockReturnValue(false),
    isContractBlacklisted: vi.fn().mockReturnValue(false),
    isDomainBlacklisted: vi.fn().mockReturnValue(false),
  },
}));

describe('RiskEngine - 风控引擎', () => {
  let riskEngine: RiskEngine;
  const defaultContext = {
    walletId: 'wallet-test-001',
    userId: 'user-test-001',
    address: '0x' + 'a'.repeat(40),
    chainType: ChainType.EVM,
    signType: SignType.MESSAGE,
  };

  beforeEach(() => {
    riskEngine = new RiskEngine();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建风控引擎实例', () => {
      expect(riskEngine).toBeDefined();
    });

    it('应该有版本号', () => {
      expect(riskEngine.engineVersion).toBeDefined();
    });
  });

  describe('配置管理', () => {
    it('应该能获取当前配置', () => {
      const config = riskEngine.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
    });

    it('应该能更新配置', () => {
      riskEngine.updateConfig({ enabled: false });
      const config = riskEngine.getConfig();
      expect(config.enabled).toBe(false);
    });

    it('应该能设置评分权重', () => {
      riskEngine.setScoreWeights({
        amount: 0.3,
        address: 0.3,
        contract: 0.2,
        behavior: 0.1,
        device: 0.1,
        domain: 0.0,
      });
      const config = riskEngine.getConfig();
      expect(config.scoreWeights.amount).toBe(0.3);
    });
  });

  describe('规则管理', () => {
    it('应该能注册风控规则', () => {
      const mockRule = {
        ruleCode: 'TEST_RULE',
        ruleName: '测试规则',
        category: 'transaction',
        enabled: true,
        evaluate: vi.fn().mockResolvedValue({
          matched: false,
          score: 0,
          level: RiskLevel.LOW,
          action: RiskAction.ALLOW,
        }),
      };

      expect(() => {
        riskEngine.registerRule(mockRule);
      }).not.toThrow();
    });

    it('应该能批量注册规则', () => {
      const rules = [
        {
          ruleCode: 'RULE_1',
          ruleName: '规则1',
          category: 'transaction',
          enabled: true,
          evaluate: vi.fn().mockResolvedValue({ matched: false, score: 0, level: RiskLevel.LOW, action: RiskAction.ALLOW }),
        },
        {
          ruleCode: 'RULE_2',
          ruleName: '规则2',
          category: 'transaction',
          enabled: true,
          evaluate: vi.fn().mockResolvedValue({ matched: false, score: 0, level: RiskLevel.LOW, action: RiskAction.ALLOW }),
        },
      ];

      expect(() => {
        riskEngine.registerRules(rules);
      }).not.toThrow();
    });

    it('应该能获取所有已注册的规则', () => {
      const rules = riskEngine.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('应该能启用/禁用规则', () => {
      riskEngine.setRuleEnabled('large-transfer', false);
      const rule = riskEngine.getRule('large-transfer');
      expect(rule?.enabled).toBe(false);
    });

    it('应该能获取指定规则', () => {
      const rule = riskEngine.getRule('large-transfer');
      expect(rule).toBeDefined();
    });

    it('获取不存在的规则应该返回 undefined', () => {
      const rule = riskEngine.getRule('non-existent-rule');
      expect(rule).toBeUndefined();
    });
  });

  describe('风险评估', () => {
    it('应该能评估交易风险', async () => {
      const result = await riskEngine.evaluate({
        ...defaultContext,
        signType: SignType.TRANSACTION,
        toAddress: '0x' + 'b'.repeat(40),
        amount: '1000000000000000000',
      });

      expect(result).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(result.riskLevel).toBeDefined();
    });

    it('评估结果应该包含 allowed 字段', async () => {
      const result = await riskEngine.evaluate(defaultContext);
      expect(typeof result.allowed).toBe('boolean');
    });

    it('评估结果应该包含 riskScore 字段', async () => {
      const result = await riskEngine.evaluate(defaultContext);
      expect(typeof result.riskScore).toBe('number');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('评估结果应该包含 riskLevel 字段', async () => {
      const result = await riskEngine.evaluate(defaultContext);
      expect([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]).toContain(result.riskLevel);
    });

    it('评估结果应该包含 action 字段', async () => {
      const result = await riskEngine.evaluate(defaultContext);
      expect(result.action).toBeDefined();
    });

    it('评估结果应该包含 reasons 数组', async () => {
      const result = await riskEngine.evaluate(defaultContext);
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('禁用引擎时应该直接允许所有操作', async () => {
      riskEngine.updateConfig({ enabled: false });
      const result = await riskEngine.evaluate(defaultContext);
      expect(result.allowed).toBe(true);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('插件系统', () => {
    it('应该能注册风控插件', () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        onEvaluate: vi.fn(),
        onDecision: vi.fn(),
      };

      expect(() => {
        riskEngine.usePlugin(mockPlugin);
      }).not.toThrow();
    });

    it('应该能获取已注册的插件列表', () => {
      const plugins = riskEngine.getPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });
  });

  describe('黑白名单', () => {
    it('应该能添加地址到黑名单', () => {
      expect(() => {
        riskEngine.addToBlacklist('address', '0x' + 'b'.repeat(40));
      }).not.toThrow();
    });

    it('应该能从黑名单移除地址', () => {
      riskEngine.addToBlacklist('address', '0x' + 'b'.repeat(40));
      expect(() => {
        riskEngine.removeFromBlacklist('address', '0x' + 'b'.repeat(40));
      }).not.toThrow();
    });

    it('应该能检查地址是否在黑名单中', () => {
      const result = riskEngine.isBlacklisted('address', '0x' + 'b'.repeat(40));
      expect(typeof result).toBe('boolean');
    });
  });

  describe('事件记录', () => {
    it('应该能记录风险事件', async () => {
      await riskEngine.evaluate(defaultContext);
      const { riskEventService } = require('../../risk-engine/risk-event.service');
      expect(riskEventService.recordEvent).toHaveBeenCalled();
    });

    it('应该能获取风险事件历史', () => {
      const events = riskEngine.getRiskEvents({ userId: 'user-test-001' });
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('风控等级判断', () => {
    it('低分险应该返回低风险等级', async () => {
      const { riskScorer } = require('../../risk-engine/risk-scoring/risk-scorer');
      riskScorer.calculateScore.mockReturnValue(10);

      const result = await riskEngine.evaluate(defaultContext);
      expect(result.riskLevel).toBeDefined();
    });

    it('高分险应该返回高风险等级', async () => {
      const { riskScorer } = require('../../risk-engine/risk-scoring/risk-scorer');
      riskScorer.calculateScore.mockReturnValue(90);

      const result = await riskEngine.evaluate(defaultContext);
      expect(result.riskLevel).toBeDefined();
    });
  });

  describe('决策矩阵', () => {
    it('应该能更新决策矩阵配置', () => {
      expect(() => {
        riskEngine.updateConfig({
          decisionMatrix: {
            lowThreshold: 25,
            mediumThreshold: 50,
            highThreshold: 75,
            criticalThreshold: 100,
            levelActions: {
              [RiskLevel.LOW]: RiskAction.ALLOW,
              [RiskLevel.MEDIUM]: RiskAction.WARN,
              [RiskLevel.HIGH]: RiskAction.SECOND_CONFIRM,
              [RiskLevel.CRITICAL]: RiskAction.REJECT,
            },
            enableRuleActionOverride: true,
            enableEscalation: true,
            escalationRuleCount: 3,
          },
        });
      }).not.toThrow();
    });
  });

  describe('统计信息', () => {
    it('应该能获取评估统计', () => {
      const stats = riskEngine.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalEvaluations).toBe('number');
    });
  });

  describe('重置功能', () => {
    it('应该能重置引擎状态', () => {
      expect(() => {
        riskEngine.reset();
      }).not.toThrow();
    });
  });
});
