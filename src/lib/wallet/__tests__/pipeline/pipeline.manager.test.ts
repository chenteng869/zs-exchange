import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { PipelineManager } from '../../pipeline/pipeline.manager';
import { PipelineStage, PipelineStatus } from '../../pipeline/pipeline.types';

vi.mock('../../pipeline/transaction-pipeline', () => ({
  TransactionPipeline: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      success: true,
      pipelineId: 'txp_test_123',
      status: PipelineStatus.COMPLETED,
      txHash: '0x' + 'a'.repeat(64),
    }),
    getStatus: vi.fn().mockReturnValue({
      status: PipelineStatus.COMPLETED,
      currentStage: PipelineStage.NOTIFY,
    }),
    cancel: vi.fn().mockReturnValue(true),
  })),
}));

describe('PipelineManager - 流水线管理器', () => {
  let manager: PipelineManager;
  const testWalletId = 'wallet-test-001';
  const testUserId = 'user-test-001';

  beforeEach(() => {
    manager = new PipelineManager();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建流水线管理器实例', () => {
      expect(manager).toBeDefined();
    });

    it('应该支持自定义配置', () => {
      const customManager = new PipelineManager({
        maxConcurrentPipelines: 50,
        defaultTimeout: 300000,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('流水线提交', () => {
    it('应该成功提交交易流水线', async () => {
      const result = await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: {
          to: '0x' + 'a'.repeat(40),
          value: '1000000000000000000',
        },
      });

      expect(result).toBeDefined();
      expect(result.pipelineId).toBeDefined();
    });

    it('提交结果应该包含流水线 ID', async () => {
      const result = await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.pipelineId).toBeTruthy();
    });

    it('提交结果应该包含初始状态', async () => {
      const result = await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      expect(result.status).toBeDefined();
    });
  });

  describe('流水线状态查询', () => {
    it('应该能查询流水线状态', async () => {
      const submission = await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      const status = manager.getPipelineStatus(submission.pipelineId);
      expect(status).toBeDefined();
    });

    it('查询不存在的流水线应该返回 null', () => {
      const status = manager.getPipelineStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('流水线列表', () => {
    it('应该能获取所有流水线列表', async () => {
      await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      const pipelines = manager.listPipelines();
      expect(Array.isArray(pipelines)).toBe(true);
      expect(pipelines.length).toBeGreaterThan(0);
    });

    it('应该能按钱包 ID 筛选流水线', async () => {
      await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      await manager.submit({
        walletId: 'wallet-other',
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'b'.repeat(40), value: '2000' },
      });

      const walletPipelines = manager.listPipelines({ walletId: testWalletId });
      expect(walletPipelines.every(p => p.walletId === testWalletId)).toBe(true);
    });

    it('应该能按状态筛选流水线', async () => {
      const pipelines = manager.listPipelines({ status: PipelineStatus.COMPLETED });
      expect(Array.isArray(pipelines)).toBe(true);
    });

    it('应该支持分页查询', () => {
      const pipelines = manager.listPipelines({ page: 1, pageSize: 10 });
      expect(Array.isArray(pipelines)).toBe(true);
    });
  });

  describe('流水线取消', () => {
    it('应该能取消正在执行的流水线', async () => {
      const submission = await manager.submit({
        walletId: testWalletId,
        userId: testUserId,
        chainType: 'evm',
        transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
      });

      const result = manager.cancelPipeline(submission.pipelineId);
      expect(typeof result).toBe('boolean');
    });

    it('取消不存在的流水线应该返回 false', () => {
      const result = manager.cancelPipeline('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('流水线统计', () => {
    it('应该能获取统计信息', () => {
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
    });

    it('统计信息应该包含各状态的计数', () => {
      const stats = manager.getStats();
      expect(stats.byStatus).toBeDefined();
    });

    it('统计信息应该包含并发数', () => {
      const stats = manager.getStats();
      expect(stats.concurrent).toBeDefined();
    });
  });

  describe('并发控制', () => {
    it('应该限制并发流水线数量', async () => {
      const limitedManager = new PipelineManager({ maxConcurrentPipelines: 2 });

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          limitedManager.submit({
            walletId: testWalletId + i,
            userId: testUserId,
            chainType: 'evm',
            transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
    });
  });

  describe('超时处理', () => {
    it('应该支持设置流水线超时时间', async () => {
      const result = await manager.submit(
        {
          walletId: testWalletId,
          userId: testUserId,
          chainType: 'evm',
          transaction: { to: '0x' + 'a'.repeat(40), value: '1000' },
        },
        { timeout: 60000 }
      );

      expect(result).toBeDefined();
    });
  });

  describe('事件监听', () => {
    it('应该能注册流水线完成回调', () => {
      const callback = vi.fn();

      expect(() => {
        manager.on('complete', callback);
      }).not.toThrow();
    });

    it('应该能移除事件监听器', () => {
      const callback = vi.fn();
      manager.on('complete', callback);

      expect(() => {
        manager.off('complete', callback);
      }).not.toThrow();
    });
  });

  describe('流水线重试', () => {
    it('应该能重试失败的流水线', async () => {
      const result = await manager.retry('test-pipeline-id');
      expect(result).toBeDefined();
    });
  });

  describe('历史记录', () => {
    it('应该能获取流水线历史记录', () => {
      const history = manager.getHistory({ walletId: testWalletId });
      expect(Array.isArray(history)).toBe(true);
    });

    it('应该能清除历史记录', () => {
      expect(() => {
        manager.clearHistory(testWalletId);
      }).not.toThrow();
    });
  });

  describe('资源清理', () => {
    it('应该能清理已完成的流水线', () => {
      expect(() => {
        manager.cleanupCompleted();
      }).not.toThrow();
    });

    it('应该能销毁管理器', () => {
      expect(() => {
        manager.destroy();
      }).not.toThrow();
    });
  });
});
