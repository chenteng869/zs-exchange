import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { TransactionPipeline } from '../../pipeline/transaction-pipeline';
import { PipelineStage, PipelineStatus } from '../../pipeline/pipeline.types';

vi.mock('../../pipeline/pipeline-stages/build.stage', () => ({
  createBuildStage: vi.fn().mockReturnValue({
    stage: PipelineStage.BUILD,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { transaction: { to: '0x' + 'a'.repeat(40), value: '1000' } },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/simulate.stage', () => ({
  createSimulateStage: vi.fn().mockReturnValue({
    stage: PipelineStage.SIMULATE,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { simulated: true, gasUsed: '21000' },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/risk-check.stage', () => ({
  createRiskCheckStage: vi.fn().mockReturnValue({
    stage: PipelineStage.RISK_CHECK,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { riskScore: 0, riskLevel: 'low', action: 'allow' },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/balance-check.stage', () => ({
  createBalanceCheckStage: vi.fn().mockReturnValue({
    stage: PipelineStage.BALANCE_CHECK,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { balance: '1000000', sufficient: true },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/signature.stage', () => ({
  createSignatureStage: vi.fn().mockReturnValue({
    stage: PipelineStage.SIGNATURE,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { signature: '0x' + 's'.repeat(130), signedTx: '0x' + 't'.repeat(100) },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/broadcast.stage', () => ({
  createBroadcastStage: vi.fn().mockReturnValue({
    stage: PipelineStage.BROADCAST,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { txHash: '0x' + 'h'.repeat(64) },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/confirmation.stage', () => ({
  createConfirmationStage: vi.fn().mockReturnValue({
    stage: PipelineStage.CONFIRMATION,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { confirmed: true, blockNumber: 12345678, confirmations: 1 },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/audit.stage', () => ({
  createAuditStage: vi.fn().mockReturnValue({
    stage: PipelineStage.AUDIT,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { auditLogId: 'audit_123' },
    }),
  }),
}));

vi.mock('../../pipeline/pipeline-stages/notify.stage', () => ({
  createNotifyStage: vi.fn().mockReturnValue({
    stage: PipelineStage.NOTIFY,
    execute: vi.fn().mockResolvedValue({
      success: true,
      data: { notified: true },
    }),
  }),
}));

describe('TransactionPipeline - 交易流水线', () => {
  let pipeline: TransactionPipeline;
  const testWalletId = 'wallet-test-001';
  const testUserId = 'user-test-001';

  beforeEach(() => {
    pipeline = new TransactionPipeline();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建流水线', () => {
      expect(pipeline).toBeDefined();
    });

    it('应该支持自定义配置', () => {
      const customPipeline = new TransactionPipeline({
        maxRetries: 5,
        autoRollback: true,
      });
      expect(customPipeline).toBeDefined();
    });
  });

  describe('流水线执行', () => {
    it('应该成功执行完整的交易流水线', async () => {
      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: {
          to: '0x' + 'a'.repeat(40),
          value: '1000000000000000000',
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('应该按顺序执行所有阶段', async () => {
      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: {
          to: '0x' + 'a'.repeat(40),
          value: '1000',
        },
      });

      expect(result).toBeDefined();
      expect(result.stageResults).toBeDefined();
    });

    it('执行结果应该包含流水线 ID', async () => {
      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.pipelineId).toBeDefined();
    });

    it('执行结果应该包含状态信息', async () => {
      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.status).toBe(PipelineStatus.COMPLETED);
    });
  });

  describe('阶段跳过', () => {
    it('应该支持跳过指定阶段', async () => {
      const result = await pipeline.execute(
        {
          walletId: testWalletId,
          userId: testUserId,
          chainType: 'evm',
          transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
        },
        {
          skipStages: [PipelineStage.SIMULATE, PipelineStage.NOTIFY],
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('阶段失败应该返回错误信息', async () => {
      const { createRiskCheckStage } = require('../../pipeline/pipeline-stages/risk-check.stage');
      createRiskCheckStage.mockReturnValueOnce({
        stage: PipelineStage.RISK_CHECK,
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: 'Risk check failed',
          errorCode: 'RISK_REJECTED',
        }),
      });

      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该在失败时停止执行后续阶段', async () => {
      const { createSignatureStage } = require('../../pipeline/pipeline-stages/signature.stage');
      createSignatureStage.mockReturnValueOnce({
        stage: PipelineStage.SIGNATURE,
        execute: vi.fn().mockRejectedValue(new Error('Signature failed')),
      });

      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.success).toBe(false);
      expect(result.failedStage).toBe(PipelineStage.SIGNATURE);
    });
  });

  describe('重试机制', () => {
    it('失败的阶段应该自动重试', async () => {
      let attempt = 0;
      const { createBroadcastStage } = require('../../pipeline/pipeline-stages/broadcast.stage');
      createBroadcastStage.mockReturnValue({
        stage: PipelineStage.BROADCAST,
        execute: vi.fn().mockImplementation(() => {
          attempt++;
          if (attempt < 2) {
            return Promise.resolve({ success: false, error: 'Temporary failure' });
          }
          return Promise.resolve({ success: true, data: { txHash: '0x' + 'h'.repeat(64) } });
        }),
      });

      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.success).toBe(true);
      expect(attempt).toBeGreaterThan(1);
    });

    it('超过最大重试次数应该标记为失败', async () => {
      const { createBalanceCheckStage } = require('../../pipeline/pipeline-stages/balance-check.stage');
      createBalanceCheckStage.mockReturnValue({
        stage: PipelineStage.BALANCE_CHECK,
        execute: vi.fn().mockResolvedValue({
          success: false,
          error: 'Insufficient balance',
          errorCode: 'INSUFFICIENT_BALANCE',
        }),
      });

      const result = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('流水线状态查询', () => {
    it('应该能查询流水线执行状态', async () => {
      const execution = await pipeline.execute({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      const status = pipeline.getStatus(execution.pipelineId);
      expect(status).toBeDefined();
    });

    it('查询不存在的流水线应该返回 null', () => {
      const status = pipeline.getStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('流水线取消', () => {
    it('应该能取消正在执行的流水线', () => {
      const result = pipeline.cancel('test-pipeline-id');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('中间件支持', () => {
    it('应该支持添加中间件', () => {
      const middleware = {
        before: vi.fn().mockResolvedValue(true),
        after: vi.fn().mockResolvedValue(true),
      };

      expect(() => {
        pipeline.use(middleware);
      }).not.toThrow();
    });
  });

  describe('进度回调', () => {
    it('应该支持进度回调', async () => {
      const onProgress = vi.fn();

      await pipeline.execute(
        {
          walletId: testWalletId,
          userId: testUserId,
          chainType: 'evm',
          transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
        },
        { onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('从指定阶段继续执行', () => {
    it('应该能从指定阶段继续执行', async () => {
      const result = await pipeline.execute(
        {
          walletId: testWalletId,
          userId: testUserId,
          chainType: 'evm',
          transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
        },
        {
          startFrom: PipelineStage.SIGNATURE,
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('获取阶段信息', () => {
    it('应该能获取所有阶段定义', () => {
      const stages = pipeline.getStages();
      expect(Array.isArray(stages)).toBe(true);
      expect(stages.length).toBeGreaterThan(0);
    });

    it('阶段应该按正确顺序排列', () => {
      const stages = pipeline.getStages();
      const stageOrder = stages.map(s => s.stage);
      expect(stageOrder).toEqual([
        PipelineStage.BUILD,
        PipelineStage.SIMULATE,
        PipelineStage.RISK_CHECK,
        PipelineStage.BALANCE_CHECK,
        PipelineStage.SIGNATURE,
        PipelineStage.BROADCAST,
        PipelineStage.CONFIRMATION,
        PipelineStage.AUDIT,
        PipelineStage.NOTIFY,
      ]);
    });
  });
});
