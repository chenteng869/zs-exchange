import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { AuditService, AuditEventType, AuditEntityType } from '../../audit/audit.service';

vi.mock('../../audit/audit-storage', () => ({
  auditStorage: {
    saveEvent: vi.fn().mockResolvedValue(true),
    queryEvents: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getEvent: vi.fn().mockResolvedValue(null),
    getEventCount: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('../../audit/evidence-chain', () => ({
  evidenceChain: {
    generateProof: vi.fn().mockResolvedValue({
      hash: '0x' + 'a'.repeat(64),
      previousHash: '0x' + 'b'.repeat(64),
    }),
    verifyProof: vi.fn().mockResolvedValue(true),
  },
}));

describe('AuditService - 审计服务', () => {
  let auditService: AuditService;
  const testUserId = 'user-test-001';
  const testWalletId = 'wallet-test-001';

  beforeEach(() => {
    auditService = new AuditService();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建审计服务实例', () => {
      expect(auditService).toBeDefined();
    });

    it('应该有服务名称', () => {
      expect(auditService.serviceName).toBe('AuditService');
    });
  });

  describe('初始化', () => {
    it('应该能初始化服务', async () => {
      await expect(auditService.initialize()).resolves.not.toThrow();
    });

    it('初始化后应该标记为已初始化', async () => {
      await auditService.initialize();
      expect(auditService.isInitialized).toBe(true);
    });
  });

  describe('记录审计事件', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能记录审计事件', async () => {
      await auditService.recordEvent({
        eventType: AuditEventType.WALLET_CREATED,
        entityType: AuditEntityType.WALLET,
        entityId: testWalletId,
        userId: testUserId,
        data: { name: '测试钱包' },
      });

      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.saveEvent.mock.calls.length).toBeGreaterThan(0);
    });

    it('记录的事件应该包含事件类型', async () => {
      await auditService.recordEvent({
        eventType: AuditEventType.TRANSACTION_SIGNED,
        entityType: AuditEntityType.TRANSACTION,
        entityId: 'tx-001',
        userId: testUserId,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      const savedEvent = auditStorage.saveEvent.mock.calls.at(-1)[0];
      expect(savedEvent.eventType).toBe(AuditEventType.TRANSACTION_SIGNED);
    });

    it('记录的事件应该包含时间戳', async () => {
      const beforeTime = Date.now();
      await auditService.recordEvent({
        eventType: AuditEventType.WALLET_CREATED,
        entityType: AuditEntityType.WALLET,
        entityId: testWalletId,
        userId: testUserId,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      const savedEvent = auditStorage.saveEvent.mock.calls.at(-1)[0];
      expect(savedEvent.timestamp).toBeGreaterThanOrEqual(beforeTime);
    });

    it('记录的事件应该包含唯一 ID', async () => {
      await auditService.recordEvent({
        eventType: AuditEventType.WALLET_CREATED,
        entityType: AuditEntityType.WALLET,
        entityId: testWalletId,
        userId: testUserId,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      const savedEvent = auditStorage.saveEvent.mock.calls.at(-1)[0];
      expect(savedEvent.eventId).toBeDefined();
      expect(savedEvent.eventId.length).toBeGreaterThan(0);
    });

    it('应该能记录附带数据', async () => {
      const testData = { amount: '1000', to: '0x' + 'a'.repeat(40) };
      await auditService.recordEvent({
        eventType: AuditEventType.TRANSACTION_SIGNED,
        entityType: AuditEntityType.TRANSACTION,
        entityId: 'tx-001',
        userId: testUserId,
        data: testData,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      const savedEvent = auditStorage.saveEvent.mock.calls.at(-1)[0];
      expect(savedEvent.data).toEqual(testData);
    });

    it('应该生成证据链哈希', async () => {
      await auditService.recordEvent({
        eventType: AuditEventType.WALLET_CREATED,
        entityType: AuditEntityType.WALLET,
        entityId: testWalletId,
        userId: testUserId,
      });

      const { evidenceChain } = require('../../audit/evidence-chain');
      expect(evidenceChain.generateProof.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('事件类型', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该支持钱包创建事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.WALLET_CREATED,
          entityType: AuditEntityType.WALLET,
          entityId: testWalletId,
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });

    it('应该支持交易签名事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.TRANSACTION_SIGNED,
          entityType: AuditEntityType.TRANSACTION,
          entityId: 'tx-001',
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });

    it('应该支持密钥导出事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.KEY_EXPORTED,
          entityType: AuditEntityType.KEY,
          entityId: 'key-001',
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });

    it('应该支持登录事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.USER_LOGIN,
          entityType: AuditEntityType.USER,
          entityId: testUserId,
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });

    it('应该支持风控事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.RISK_ALERT,
          entityType: AuditEntityType.TRANSACTION,
          entityId: 'tx-001',
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });

    it('应该支持审批事件', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.APPROVAL_GRANTED,
          entityType: AuditEntityType.APPROVAL,
          entityId: 'approval-001',
          userId: testUserId,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('查询审计事件', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能查询审计事件', async () => {
      const result = await auditService.queryEvents({
        userId: testUserId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('应该支持按事件类型筛选', async () => {
      const result = await auditService.queryEvents({
        eventType: AuditEventType.TRANSACTION_SIGNED,
      });

      expect(result).toBeDefined();
      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.queryEvents.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        eventType: AuditEventType.TRANSACTION_SIGNED,
      }));
    });

    it('应该支持按实体类型筛选', async () => {
      const result = await auditService.queryEvents({
        entityType: AuditEntityType.WALLET,
      });

      expect(result).toBeDefined();
      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.queryEvents.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        entityType: AuditEntityType.WALLET,
      }));
    });

    it('应该支持按用户 ID 筛选', async () => {
      const result = await auditService.queryEvents({
        userId: testUserId,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.queryEvents.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        userId: testUserId,
      }));
    });

    it('应该支持按时间范围筛选', async () => {
      const startTime = Date.now() - 86400000;
      const endTime = Date.now();

      const result = await auditService.queryEvents({
        startTime,
        endTime,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.queryEvents.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        startTime,
        endTime,
      }));
    });

    it('应该支持分页', async () => {
      const result = await auditService.queryEvents({
        page: 1,
        pageSize: 20,
      });

      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.queryEvents.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({
        page: 1,
        pageSize: 20,
      }));
    });

    it('应该返回总数', async () => {
      const { auditStorage } = require('../../audit/audit-storage');
      auditStorage.queryEvents.mockResolvedValueOnce({
        items: [],
        total: 42,
      });

      const result = await auditService.queryEvents({});
      expect(result.total).toBe(42);
    });
  });

  describe('获取单个事件', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能获取单个事件详情', async () => {
      const eventId = 'event-test-001';
      const result = await auditService.getEvent(eventId);

      const { auditStorage } = require('../../audit/audit-storage');
      expect(auditStorage.getEvent.mock.calls.at(-1)[0]).toBe(eventId);
    });
  });

  describe('事件统计', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能获取事件总数', async () => {
      const count = await auditService.getEventCount({
        userId: testUserId,
      });

      expect(typeof count).toBe('number');
    });

    it('应该能按类型统计事件', async () => {
      const stats = await auditService.getStatsByType({
        userId: testUserId,
      });

      expect(stats).toBeDefined();
    });
  });

  describe('证据链验证', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能验证事件完整性', async () => {
      const eventId = 'event-test-001';
      const result = await auditService.verifyEventIntegrity(eventId);

      expect(typeof result).toBe('boolean');
    });

    it('应该调用证据链验证', async () => {
      const { evidenceChain } = require('../../audit/evidence-chain');
      evidenceChain.verifyProof.mockResolvedValueOnce(true);

      const eventId = 'event-test-001';
      await auditService.verifyEventIntegrity(eventId);

      expect(evidenceChain.verifyProof.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('导出审计日志', () => {
    beforeEach(async () => {
      await auditService.initialize();
    });

    it('应该能导出审计日志为 CSV', async () => {
      const csv = await auditService.exportCSV({
        userId: testUserId,
      });

      expect(typeof csv).toBe('string');
    });

    it('应该能导出审计日志为 JSON', async () => {
      const json = await auditService.exportJSON({
        userId: testUserId,
      });

      expect(typeof json).toBe('string');
    });
  });

  describe('配置管理', () => {
    it('应该能获取配置', () => {
      const config = auditService.getConfig();
      expect(config).toBeDefined();
    });

    it('应该能更新配置', () => {
      auditService.updateConfig({
        enableEvidenceChain: true,
        retentionDays: 365,
      });

      const config = auditService.getConfig();
      expect(config.enableEvidenceChain).toBe(true);
      expect(config.retentionDays).toBe(365);
    });

    it('应该能禁用证据链', () => {
      auditService.updateConfig({
        enableEvidenceChain: false,
      });

      const config = auditService.getConfig();
      expect(config.enableEvidenceChain).toBe(false);
    });
  });

  describe('错误处理', () => {
    it('未初始化时记录事件应该抛出错误', async () => {
      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.WALLET_CREATED,
          entityType: AuditEntityType.WALLET,
          entityId: testWalletId,
          userId: testUserId,
        })
      ).rejects.toThrow();
    });

    it('存储失败应该抛出错误', async () => {
      await auditService.initialize();
      const { auditStorage } = require('../../audit/audit-storage');
      auditStorage.saveEvent.mockRejectedValueOnce(new Error('存储失败'));

      await expect(
        auditService.recordEvent({
          eventType: AuditEventType.WALLET_CREATED,
          entityType: AuditEntityType.WALLET,
          entityId: testWalletId,
          userId: testUserId,
        })
      ).rejects.toThrow();
    });
  });
});
