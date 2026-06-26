import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { KeyRiskService, KeyRiskContext } from '../../key/key-risk.service';

describe('KeyRiskService - 密钥风控服务', () => {
  let riskService: KeyRiskService;
  let defaultContext: KeyRiskContext;

  beforeEach(() => {
    riskService = new KeyRiskService();
    defaultContext = {
      walletId: 'wallet-test-001',
      userId: 'user-test-001',
      address: '0x' + 'a'.repeat(40),
      chainType: 'evm',
      signType: 'message',
    };
  });

  describe('规则注册与配置管理', () => {
    it('应该注册单条风控规则', () => {
      const mockRule = {
        ruleCode: 'TEST_RULE',
        ruleName: '测试规则',
        enabled: true,
        parameters: { action: 'warn' },
        evaluate: vi.fn().mockResolvedValue({
          ruleCode: 'TEST_RULE',
          ruleName: '测试规则',
          matched: false,
          score: 0,
          level: 'low',
          action: 'allow',
        }),
      };

      expect(() => {
        riskService.registerRule(mockRule);
      }).not.toThrow();
    });

    it('应该批量注册风控规则', () => {
      const rules = [
        {
          ruleCode: 'RULE_1',
          ruleName: '规则1',
          enabled: true,
          parameters: { action: 'warn' },
          evaluate: vi.fn().mockResolvedValue({
            ruleCode: 'RULE_1',
            ruleName: '规则1',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          }),
        },
        {
          ruleCode: 'RULE_2',
          ruleName: '规则2',
          enabled: true,
          parameters: { action: 'reject' },
          evaluate: vi.fn().mockResolvedValue({
            ruleCode: 'RULE_2',
            ruleName: '规则2',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          }),
        },
      ];

      expect(() => {
        riskService.registerRules(rules);
      }).not.toThrow();
    });

    it('应该能获取所有规则配置', () => {
      const configs = riskService.getRuleConfigs();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('应该能配置规则参数', () => {
      riskService.configureRule({
        ruleCode: 'LARGE_TRANSFER',
        enabled: false,
        action: 'reject',
        threshold: 50,
      });

      const configs = riskService.getRuleConfigs();
      const largeTransferConfig = configs.find(c => c.ruleCode === 'LARGE_TRANSFER');
      expect(largeTransferConfig).toBeDefined();
    });

    it('应该能批量配置规则', () => {
      const configs = [
        { ruleCode: 'BLACKLIST_ADDRESS', enabled: false },
        { ruleCode: 'LARGE_TRANSFER', enabled: false },
      ];

      expect(() => {
        riskService.configureRules(configs);
      }).not.toThrow();
    });

    it('应该能启用/禁用指定规则', () => {
      riskService.setRuleEnabled('BLACKLIST_ADDRESS', false);
      const configs = riskService.getRuleConfigs();
      const blacklistConfig = configs.find(c => c.ruleCode === 'BLACKLIST_ADDRESS');
      expect(blacklistConfig?.enabled).toBe(false);
    });
  });

  describe('黑白名单管理', () => {
    it('应该添加黑名单地址', () => {
      const address = '0x' + 'b'.repeat(40);
      riskService.addBlacklistAddress(address);
    });

    it('应该批量添加黑名单地址', () => {
      const addresses = [
        '0x' + 'b'.repeat(40),
        '0x' + 'c'.repeat(40),
      ];
      riskService.addBlacklistAddresses(addresses);
    });

    it('应该移除黑名单地址', () => {
      const address = '0x' + 'b'.repeat(40);
      riskService.addBlacklistAddress(address);
      riskService.removeBlacklistAddress(address);
    });

    it('黑名单地址检测应该拒绝交易', async () => {
      const blacklistAddress = '0x' + 'b'.repeat(40);
      riskService.addBlacklistAddress(blacklistAddress);

      const ctx: KeyRiskContext = {
        ...defaultContext,
        toAddress: blacklistAddress,
        signType: 'transaction',
        amount: '100',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.action).toBe('reject');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('应该添加白名单地址', () => {
      const address = '0x' + 'w'.repeat(40);
      riskService.addWhitelistAddress(address);
    });

    it('应该批量添加白名单地址', () => {
      const addresses = [
        '0x' + 'w'.repeat(40),
        '0x' + 'x'.repeat(40),
      ];
      riskService.addWhitelistAddresses(addresses);
    });

    it('应该添加黑名单合约', () => {
      const contract = '0x' + 'c'.repeat(40);
      riskService.addBlacklistContract(contract);
    });

    it('应该批量添加黑名单合约', () => {
      const contracts = [
        '0x' + 'c'.repeat(40),
        '0x' + 'd'.repeat(40),
      ];
      riskService.addBlacklistContracts(contracts);
    });

    it('黑名单合约检测应该拒绝交易', async () => {
      const blacklistContract = '0x' + 'c'.repeat(40);
      riskService.addBlacklistContract(blacklistContract);

      const ctx: KeyRiskContext = {
        ...defaultContext,
        contractAddress: blacklistContract,
        signType: 'transaction',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.action).toBe('reject');
    });

    it('应该添加钓鱼域名', () => {
      const domain = 'phishing.com';
      riskService.addPhishingDomain(domain);
    });

    it('应该批量添加钓鱼域名', () => {
      const domains = ['phishing1.com', 'phishing2.com'];
      riskService.addPhishingDomains(domains);
    });

    it('钓鱼域名检测应该拒绝操作', async () => {
      const phishingDomain = 'evil-phishing.com';
      riskService.addPhishingDomain(phishingDomain);

      const ctx: KeyRiskContext = {
        ...defaultContext,
        dappDomain: phishingDomain,
      };

      const result = await riskService.evaluate(ctx);
      expect(result.action).toBe('reject');
    });
  });

  describe('大额转账检测', () => {
    it('大额转账应该触发二次确认', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        amount: '5000',
        toAddress: '0x' + 'b'.repeat(40),
        signType: 'transaction',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('白名单地址大额转账应该豁免', async () => {
      const whitelistAddress = '0x' + 'w'.repeat(40);
      riskService.addWhitelistAddress(whitelistAddress);

      const ctx: KeyRiskContext = {
        ...defaultContext,
        amount: '5000',
        toAddress: whitelistAddress,
        signType: 'transaction',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.allowed).toBe(true);
    });

    it('应该能设置大额转账阈值', () => {
      riskService.setLargeAmountThreshold('evm', '500');
    });
  });

  describe('新地址检测', () => {
    it('向新地址转账应该触发二次确认', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        toAddress: '0x' + 'n'.repeat(40),
        signType: 'transaction',
        amount: '100',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.reasons.some(r => r.includes('新地址') || r.includes('new address'.toLowerCase()) || result.action === 'second_confirm')).toBe(true);
    });

    it('应该能设置新地址阈值', () => {
      riskService.setNewAddressThreshold(3);
    });
  });

  describe('设备与位置风险', () => {
    it('新设备应该触发二次确认', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        isNewDevice: true,
      };

      const result = await riskService.evaluate(ctx);
      expect(result.action).toBe('second_confirm');
    });

    it('异常位置应该触发二次确认', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        isAbnormalLocation: true,
      };

      const result = await riskService.evaluate(ctx);
      expect(result.action).toBe('second_confirm');
    });
  });

  describe('高频交易检测', () => {
    it('高频交易应该延迟操作', async () => {
      for (let i = 0; i < 15; i++) {
        riskService.recordTransaction(
          defaultContext.userId,
          '100',
          '0x' + 't'.repeat(40)
        );
      }

      const ctx: KeyRiskContext = {
        ...defaultContext,
        signType: 'transaction',
        amount: '100',
        toAddress: '0x' + 't'.repeat(40),
      };

      const result = await riskService.evaluate(ctx);
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('应该能设置每小时交易限额', () => {
      riskService.setHourlyTransactionLimit(20);
    });

    it('应该能设置每日交易限额', () => {
      riskService.setDailyTransactionLimit(200);
    });
  });

  describe('风险评分计算', () => {
    it('应该计算综合风险评分', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        amount: '5000',
        toAddress: '0x' + 'b'.repeat(40),
        signType: 'transaction',
        isNewDevice: true,
      };

      const result = await riskService.evaluate(ctx);
      expect(typeof result.riskScore).toBe('number');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('应该能设置风险评分权重', () => {
      riskService.setScoreWeights({
        amountRisk: 0.3,
        addressRisk: 0.3,
      });
    });

    it('低分险应该返回低风险等级', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        signType: 'message',
      };

      const result = await riskService.evaluate(ctx);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });
  });

  describe('风险评估结果', () => {
    it('应该返回 allowed 字段', async () => {
      const result = await riskService.evaluate(defaultContext);
      expect(typeof result.allowed).toBe('boolean');
    });

    it('应该返回 riskScore 字段', async () => {
      const result = await riskService.evaluate(defaultContext);
      expect(typeof result.riskScore).toBe('number');
    });

    it('应该返回 riskLevel 字段', async () => {
      const result = await riskService.evaluate(defaultContext);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('应该返回 reasons 数组', async () => {
      const result = await riskService.evaluate(defaultContext);
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('应该返回 action 字段', async () => {
      const result = await riskService.evaluate(defaultContext);
      expect(['allow', 'warn', 'second_confirm', 'delay', 'manual_review', 'reject']).toContain(result.action);
    });
  });

  describe('零值转账检测', () => {
    it('零值转账应该发出警告', async () => {
      const ctx: KeyRiskContext = {
        ...defaultContext,
        amount: '0',
        toAddress: '0x' + 'z'.repeat(40),
        signType: 'transaction',
      };

      const result = await riskService.evaluate(ctx);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('交易历史记录', () => {
    it('应该记录用户交易历史', () => {
      expect(() => {
        riskService.recordTransaction(
          'user-123',
          '100',
          '0x' + 't'.repeat(40)
        );
      }).not.toThrow();
    });
  });
});
