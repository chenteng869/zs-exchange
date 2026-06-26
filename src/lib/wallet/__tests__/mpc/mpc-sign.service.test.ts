import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MPCSignService } from '../../mpc/mpc-sign.service';
import { ChainType, SignType } from '../../mpc/mpc.types';
import { PolicyEngine } from '../../mpc/policy-engine/policy-engine';
import { ApprovalWorkflow } from '../../mpc/approval-workflow/approval-workflow';
import { MPCSigner } from '../../mpc/threshold-signer/mpc-signer';
import { WalletTierManager } from '../../mpc/wallet-tier-manager';
import { MPCAuditService } from '../../mpc/mpc-audit.service';

vi.mock('../../mpc/policy-engine/policy-engine', () => ({
  PolicyEngine: vi.fn().mockImplementation(() => ({
    evaluatePolicies: vi.fn().mockResolvedValue({
      overallResult: 'pass',
      totalRiskScore: 10,
      policyResults: [],
    }),
  })),
}));

vi.mock('../../mpc/approval-workflow/approval-workflow', () => ({
  ApprovalWorkflow: vi.fn().mockImplementation(() => ({
    getApprovalService: vi.fn().mockReturnValue({
      createApprovalRequest: vi.fn().mockReturnValue({ id: 'approval-test-001', status: 'pending' }),
      findApprovalRequest: vi.fn().mockReturnValue({ id: 'approval-test-001', status: 'approved' }),
      cancel: vi.fn(),
      reject: vi.fn(),
    }),
    dispose: vi.fn(),
  })),
}));

vi.mock('../../mpc/threshold-signer/mpc-signer', () => ({
  MPCSigner: vi.fn().mockImplementation(() => ({
    thresholdSign: vi.fn().mockResolvedValue({
      signature: '0x' + 'c'.repeat(130),
      txHash: '0x' + 'd'.repeat(64),
      signTimeMs: 150,
      signerNodes: ['node-1', 'node-2'],
    }),
  })),
}));

vi.mock('../../mpc/wallet-tier-manager', () => ({
  WalletTierManager: vi.fn().mockImplementation(() => ({
    findWallet: vi.fn().mockReturnValue({
      id: 'wallet-test-001',
      walletId: 'wallet-test-001',
      address: '0x' + 'b'.repeat(40),
      status: 'active',
      tier: 'hot',
      policyIds: [],
      approvalFlowId: 'flow-001',
      keyRef: 'key-ref-001',
      threshold: 2,
      totalShares: 3,
    }),
    getWallet: vi.fn().mockReturnValue({
      id: 'wallet-test-001',
      walletId: 'wallet-test-001',
      address: '0x' + 'b'.repeat(40),
      status: 'active',
      tier: 'hot',
      policyIds: [],
      approvalFlowId: 'flow-001',
      keyRef: 'key-ref-001',
      threshold: 2,
      totalShares: 3,
    }),
    recordSignature: vi.fn(),
  })),
}));

vi.mock('../../mpc/mpc-audit.service', () => ({
  MPCAuditService: vi.fn().mockImplementation(() => ({
    logPreSignAudit: vi.fn(),
    logDuringSignAudit: vi.fn(),
    logPostSignAudit: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('MPCSignService - MPC 签名服务', () => {
  let mpcSignService: MPCSignService;
  const testKeyId = 'mpc-key-test-001';
  const testWalletId = 'wallet-test-001';

  beforeEach(() => {
    vi.clearAllMocks();
    mpcSignService = new MPCSignService({
      enablePolicy: false,
      enableAutoApproval: true,
    });
  });

  describe('构造函数', () => {
    it('应该创建 MPC 签名服务实例', () => {
      expect(mpcSignService).toBeDefined();
    });
  });

  describe('签名请求创建', () => {
    it('应该能创建签名请求', async () => {
      const result = await mpcSignService.createSignRequest({
        walletId: testWalletId,
        userId: 'user-test-001',
        signType: SignType.TRANSACTION,
        chainType: ChainType.EVM,
        payload: { to: '0x' + 'e'.repeat(40), value: '1000000000000000000' },
        summary: {
          txType: 'transfer',
          amount: '1000000000000000000',
          tokenSymbol: 'ETH',
          toAddress: '0x' + 'e'.repeat(40),
        },
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
    });

    it('创建请求应该记录统计', async () => {
      await mpcSignService.createSignRequest({
        walletId: testWalletId,
        userId: 'user-test-001',
        signType: SignType.TRANSACTION,
        chainType: ChainType.EVM,
        payload: {},
        summary: { txType: 'test' },
      });

      const stats = mpcSignService.getStats();
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('签名执行', () => {
    it('应该能处理签名请求', async () => {
      await new Promise((resolve) => {
        mpcSignService.createSignRequest({
          walletId: testWalletId,
          userId: 'user-test-001',
          signType: SignType.TRANSACTION,
          chainType: ChainType.EVM,
          payload: { to: '0x' + 'e'.repeat(40), value: '1000000000000000000' },
          summary: {
            txType: 'transfer',
            amount: '1000000000000000000',
            tokenSymbol: 'ETH',
            toAddress: '0x' + 'e'.repeat(40),
          },
        }).then((request) => {
          setTimeout(() => {
            const found = mpcSignService.findSignRequest(request.id);
            expect(found?.status).toBe('signed');
            resolve(undefined);
          }, 100);
        });
      });
    });
  });

  describe('请求查询', () => {
    it('应该能获取签名请求', async () => {
      const request = await mpcSignService.createSignRequest({
        walletId: testWalletId,
        userId: 'user-test-001',
        signType: SignType.TRANSACTION,
        chainType: ChainType.EVM,
        payload: {},
        summary: { txType: 'test' },
      });

      const found = mpcSignService.getSignRequest(request.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(request.id);
    });

    it('应该能获取用户签名请求列表', async () => {
      const userId = 'user-test-001';
      await mpcSignService.createSignRequest({
        walletId: testWalletId,
        userId,
        signType: SignType.TRANSACTION,
        chainType: ChainType.EVM,
        payload: {},
        summary: { txType: 'test' },
      });

      const requests = mpcSignService.getUserSignRequests(userId);
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
    });
  });

  describe('请求取消', () => {
    it('应该能取消待处理的请求', async () => {
      const mpcSignServiceWithApproval = new MPCSignService({
        enablePolicy: false,
        enableAutoApproval: false,
      });

      const request = await mpcSignServiceWithApproval.createSignRequest({
        walletId: testWalletId,
        userId: 'user-test-001',
        signType: SignType.TRANSACTION,
        chainType: ChainType.EVM,
        payload: {},
        summary: { txType: 'test' },
      });

      const cancelled = mpcSignServiceWithApproval.cancelRequest(request.id, 'user-test-001');
      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('风控检查', () => {
    it('应该执行签名前风控检查', async () => {
      const result = await mpcSignService.preSignRiskCheck({
        walletId: testWalletId,
        userId: 'user-test-001',
        chainType: ChainType.EVM,
      });

      expect(result).toBeDefined();
      expect(result.passed).toBe(true);
      expect(result.riskScore).toBeDefined();
    });

    it('应该识别高风险操作', async () => {
      const result = await mpcSignService.preSignRiskCheck({
        walletId: testWalletId,
        userId: 'user-test-001',
        chainType: ChainType.EVM,
        toAddress: '0x' + 'unknown'.repeat(8),
        amount: '1000000000000000000',
        clientIp: '192.168.1.100',
      });

      expect(result).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(typeof result.riskLevel).toBe('string');
    });
  });

  describe('统计信息', () => {
    it('应该能获取统计信息', () => {
      const stats = mpcSignService.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.approvedRequests).toBe('number');
      expect(typeof stats.rejectedRequests).toBe('number');
    });
  });

  describe('子服务访问', () => {
    it('应该能获取策略引擎', () => {
      const engine = mpcSignService.getPolicyEngine();
      expect(engine).toBeDefined();
    });

    it('应该能获取审批工作流', () => {
      const workflow = mpcSignService.getApprovalWorkflow();
      expect(workflow).toBeDefined();
    });

    it('应该能获取 MPC 签名器', () => {
      const signer = mpcSignService.getMPCSigner();
      expect(signer).toBeDefined();
    });

    it('应该能获取钱包层级管理器', () => {
      const tierManager = mpcSignService.getTierManager();
      expect(tierManager).toBeDefined();
    });

    it('应该能获取审计服务', () => {
      const auditService = mpcSignService.getAuditService();
      expect(auditService).toBeDefined();
    });
  });

  describe('资源清理', () => {
    it('应该能清理过期请求', () => {
      const count = mpcSignService.cleanupExpiredRequests();
      expect(typeof count).toBe('number');
    });

    it('应该能释放资源', () => {
      expect(() => mpcSignService.dispose()).not.toThrow();
    });
  });
});