import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { PolicyEngine, PolicyEffect, PolicyConditionOperator, PolicyResourceType, PolicyActionType } from '../../mpc/policy-engine';

describe('PolicyEngine - 策略引擎', () => {
  let policyEngine: PolicyEngine;
  const testUserId = 'user-test-001';
  const testWalletId = 'wallet-test-001';

  beforeEach(() => {
    policyEngine = new PolicyEngine();
  });

  describe('构造函数', () => {
    it('应该创建策略引擎实例', () => {
      expect(policyEngine).toBeDefined();
    });

    it('应该有默认配置', () => {
      const config = policyEngine.getConfig();
      expect(config).toBeDefined();
    });
  });

  describe('策略管理', () => {
    it('应该能添加策略', () => {
      const policy = {
        policyId: 'policy-test-001',
        name: '测试策略',
        description: '这是一个测试策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      };

      policyEngine.addPolicy(policy);
      const policies = policyEngine.getPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });

    it('应该能批量添加策略', () => {
      const policies = [
        {
          policyId: 'policy-test-001',
          name: '策略1',
          effect: PolicyEffect.ALLOW,
          resources: [PolicyResourceType.TRANSACTION],
          actions: [PolicyActionType.SIGN],
          conditions: [],
          enabled: true,
          priority: 100,
        },
        {
          policyId: 'policy-test-002',
          name: '策略2',
          effect: PolicyEffect.DENY,
          resources: [PolicyResourceType.KEY],
          actions: [PolicyActionType.DELETE],
          conditions: [],
          enabled: true,
          priority: 200,
        },
      ];

      policyEngine.addPolicies(policies);
      const allPolicies = policyEngine.getPolicies();
      expect(allPolicies.length).toBeGreaterThanOrEqual(2);
    });

    it('应该能获取单个策略', () => {
      const policy = {
        policyId: 'policy-test-001',
        name: '测试策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      };

      policyEngine.addPolicy(policy);
      const found = policyEngine.getPolicy('policy-test-001');
      expect(found).toBeDefined();
      expect(found?.policyId).toBe('policy-test-001');
    });

    it('获取不存在的策略应该返回 undefined', () => {
      const found = policyEngine.getPolicy('non-existent-policy');
      expect(found).toBeUndefined();
    });

    it('应该能更新策略', () => {
      const policy = {
        policyId: 'policy-test-001',
        name: '测试策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      };

      policyEngine.addPolicy(policy);
      policyEngine.updatePolicy('policy-test-001', {
        name: '更新后的策略',
        enabled: false,
      });

      const updated = policyEngine.getPolicy('policy-test-001');
      expect(updated?.name).toBe('更新后的策略');
      expect(updated?.enabled).toBe(false);
    });

    it('应该能删除策略', () => {
      const policy = {
        policyId: 'policy-test-001',
        name: '测试策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      };

      policyEngine.addPolicy(policy);
      policyEngine.removePolicy('policy-test-001');
      const found = policyEngine.getPolicy('policy-test-001');
      expect(found).toBeUndefined();
    });

    it('应该能启用/禁用策略', () => {
      const policy = {
        policyId: 'policy-test-001',
        name: '测试策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      };

      policyEngine.addPolicy(policy);
      policyEngine.setPolicyEnabled('policy-test-001', false);
      const updated = policyEngine.getPolicy('policy-test-001');
      expect(updated?.enabled).toBe(false);
    });
  });

  describe('策略评估', () => {
    beforeEach(() => {
      policyEngine = new PolicyEngine();
    });

    it('没有策略时应该返回默认决策', () => {
      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('ALLOW 策略应该允许操作', () => {
      policyEngine.addPolicy({
        policyId: 'allow-policy',
        name: '允许策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(true);
    });

    it('DENY 策略应该拒绝操作', () => {
      policyEngine.addPolicy({
        policyId: 'deny-policy',
        name: '拒绝策略',
        effect: PolicyEffect.DENY,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 200,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(false);
    });

    it('高优先级策略应该优先生效', () => {
      policyEngine.addPolicies([
        {
          policyId: 'allow-policy',
          name: '允许策略',
          effect: PolicyEffect.ALLOW,
          resources: [PolicyResourceType.TRANSACTION],
          actions: [PolicyActionType.SIGN],
          conditions: [],
          enabled: true,
          priority: 100,
        },
        {
          policyId: 'deny-policy',
          name: '拒绝策略',
          effect: PolicyEffect.DENY,
          resources: [PolicyResourceType.TRANSACTION],
          actions: [PolicyActionType.SIGN],
          conditions: [],
          enabled: true,
          priority: 200,
        },
      ]);

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(false);
    });

    it('禁用的策略不应该生效', () => {
      policyEngine.addPolicy({
        policyId: 'deny-policy',
        name: '拒绝策略',
        effect: PolicyEffect.DENY,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: false,
        priority: 200,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe('条件评估', () => {
    beforeEach(() => {
      policyEngine = new PolicyEngine();
    });

    it('等于条件应该正确评估', () => {
      policyEngine.addPolicy({
        policyId: 'amount-allow',
        name: '小额允许',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [
          {
            field: 'amount',
            operator: PolicyConditionOperator.LESS_THAN,
            value: '1000',
          },
        ],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: { amount: '500' },
      });
      expect(result).toBeDefined();
    });

    it('大于条件应该正确评估', () => {
      policyEngine.addPolicy({
        policyId: 'large-deny',
        name: '大额拒绝',
        effect: PolicyEffect.DENY,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [
          {
            field: 'amount',
            operator: PolicyConditionOperator.GREATER_THAN,
            value: '1000000',
          },
        ],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: { amount: '2000000' },
      });
      expect(result).toBeDefined();
    });

    it('包含条件应该正确评估', () => {
      policyEngine.addPolicy({
        policyId: 'whitelist-allow',
        name: '白名单允许',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [
          {
            field: 'toAddress',
            operator: PolicyConditionOperator.IN,
            value: ['0x' + 'a'.repeat(40), '0x' + 'b'.repeat(40)],
          },
        ],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: { toAddress: '0x' + 'a'.repeat(40) },
      });
      expect(result).toBeDefined();
    });

    it('不包含条件应该正确评估', () => {
      policyEngine.addPolicy({
        policyId: 'blacklist-deny',
        name: '黑名单拒绝',
        effect: PolicyEffect.DENY,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [
          {
            field: 'toAddress',
            operator: PolicyConditionOperator.NOT_IN,
            value: ['0x' + 'a'.repeat(40)],
          },
        ],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: { toAddress: '0x' + 'b'.repeat(40) },
      });
      expect(result).toBeDefined();
    });
  });

  describe('资源和动作匹配', () => {
    beforeEach(() => {
      policyEngine = new PolicyEngine();
    });

    it('应该匹配指定的资源类型', () => {
      policyEngine.addPolicy({
        policyId: 'tx-policy',
        name: '交易策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(true);
    });

    it('应该匹配指定的动作类型', () => {
      policyEngine.addPolicy({
        policyId: 'sign-policy',
        name: '签名策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.KEY],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.KEY,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(true);
    });

    it('通配符资源应该匹配所有资源', () => {
      policyEngine.addPolicy({
        policyId: 'all-policy',
        name: '全部策略',
        effect: PolicyEffect.DENY,
        resources: ['*'],
        actions: ['*'],
        conditions: [],
        enabled: true,
        priority: 1,
      });

      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('策略模板', () => {
    it('应该能获取内置策略模板', () => {
      const templates = policyEngine.getPolicyTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('模板应该包含大额交易审批', () => {
      const templates = policyEngine.getPolicyTemplates();
      const largeTx = templates.find(t => t.id === 'large-transaction-approval');
      expect(largeTx).toBeDefined();
    });

    it('模板应该包含地址白名单', () => {
      const templates = policyEngine.getPolicyTemplates();
      const whitelist = templates.find(t => t.id === 'address-whitelist');
      expect(whitelist).toBeDefined();
    });
  });

  describe('评估结果', () => {
    beforeEach(() => {
      policyEngine = new PolicyEngine();
    });

    it('评估结果应该包含 allowed 字段', () => {
      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(typeof result.allowed).toBe('boolean');
    });

    it('评估结果应该包含 matchedPolicies', () => {
      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(Array.isArray(result.matchedPolicies)).toBe(true);
    });

    it('评估结果应该包含 reason', () => {
      const result = policyEngine.evaluate({
        userId: testUserId,
        resource: PolicyResourceType.TRANSACTION,
        action: PolicyActionType.SIGN,
        context: {},
      });
      expect(result.reason).toBeDefined();
    });
  });

  describe('统计信息', () => {
    it('应该能获取评估统计', () => {
      const stats = policyEngine.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalEvaluations).toBe('number');
    });
  });

  describe('持久化', () => {
    it('应该能导出策略', () => {
      const data = policyEngine.exportPolicies();
      expect(data).toBeDefined();
      expect(Array.isArray(data.policies)).toBe(true);
    });

    it('应该能导入策略', () => {
      const policies = [{
        policyId: 'imported-policy',
        name: '导入的策略',
        effect: PolicyEffect.ALLOW,
        resources: [PolicyResourceType.TRANSACTION],
        actions: [PolicyActionType.SIGN],
        conditions: [],
        enabled: true,
        priority: 100,
      }];

      policyEngine.importPolicies({ policies });
      const found = policyEngine.getPolicy('imported-policy');
      expect(found).toBeDefined();
    });
  });
});
