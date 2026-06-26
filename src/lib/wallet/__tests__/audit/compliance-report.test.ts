import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { ComplianceReport, ReportType, ReportFormat, ComplianceStatus } from '../../audit/compliance-report';

vi.mock('../../audit/audit.service', () => ({
  auditService: {
    queryEvents: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
    }),
    getEventCount: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('../../risk-engine/risk-event.service', () => ({
  riskEventService: {
    getEvents: vi.fn().mockReturnValue([]),
  },
}));

describe('ComplianceReport - 合规报表', () => {
  let complianceReport: ComplianceReport;
  const testUserId = 'user-test-001';
  const testWalletId = 'wallet-test-001';

  beforeEach(() => {
    complianceReport = new ComplianceReport();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建合规报表实例', () => {
      expect(complianceReport).toBeDefined();
    });
  });

  describe('报表生成', () => {
    it('应该能生成交易审计报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
    });

    it('应该能生成风控报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.RISK_ANALYSIS,
        userId: testUserId,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(report).toBeDefined();
    });

    it('应该能生成用户行为报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.USER_BEHAVIOR,
        userId: testUserId,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(report).toBeDefined();
    });

    it('应该能生成密钥使用报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.KEY_USAGE,
        userId: testUserId,
        startTime: Date.now() - 86400000,
        endTime: Date.now(),
      });

      expect(report).toBeDefined();
    });

    it('报表应该包含报表类型', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      expect(report.type).toBe(ReportType.TRANSACTION_AUDIT);
    });

    it('报表应该包含生成时间', async () => {
      const before = Date.now();
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      expect(report.generatedAt).toBeGreaterThanOrEqual(before);
    });

    it('报表应该包含时间范围', async () => {
      const startTime = Date.now() - 86400000;
      const endTime = Date.now();

      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        startTime,
        endTime,
      });

      expect(report.startTime).toBe(startTime);
      expect(report.endTime).toBe(endTime);
    });
  });

  describe('报表数据', () => {
    beforeEach(() => {
      const { auditService } = require('../../audit/audit.service');
      auditService.queryEvents.mockResolvedValue({
        items: [
          { eventId: '1', eventType: 'transaction_signed', timestamp: Date.now() },
          { eventId: '2', eventType: 'wallet_created', timestamp: Date.now() },
        ],
        total: 2,
      });
      auditService.getEventCount.mockResolvedValue(42);
    });

    it('报表应该包含汇总数据', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      expect(report.summary).toBeDefined();
    });

    it('报表应该包含交易总数', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      expect(report.summary.totalTransactions).toBeDefined();
    });

    it('报表应该包含详细数据', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      expect(Array.isArray(report.details)).toBe(true);
    });
  });

  describe('报表格式', () => {
    it('应该能生成 JSON 格式报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        format: ReportFormat.JSON,
      });

      expect(report.format).toBe(ReportFormat.JSON);
    });

    it('应该能生成 CSV 格式报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        format: ReportFormat.CSV,
      });

      expect(report.format).toBe(ReportFormat.CSV);
    });

    it('应该能生成 PDF 格式报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        format: ReportFormat.PDF,
      });

      expect(report.format).toBe(ReportFormat.PDF);
    });

    it('应该能导出报表内容', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        format: ReportFormat.JSON,
      });

      const content = complianceReport.exportReport(report);
      expect(typeof content).toBe('string');
    });

    it('JSON 格式应该是有效的 JSON 字符串', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        format: ReportFormat.JSON,
      });

      const content = complianceReport.exportReport(report);
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('合规检查', () => {
    it('应该能检查合规状态', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
    });

    it('合规状态应该是枚举值之一', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      expect([
        ComplianceStatus.COMPLIANT,
        ComplianceStatus.WARNING,
        ComplianceStatus.NON_COMPLIANT,
      ]).toContain(status.status);
    });

    it('合规检查应该包含评分', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      expect(status.score).toBeDefined();
      expect(typeof status.score).toBe('number');
      expect(status.score).toBeGreaterThanOrEqual(0);
      expect(status.score).toBeLessThanOrEqual(100);
    });

    it('合规检查应该包含检查项', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      expect(Array.isArray(status.checks)).toBe(true);
    });

    it('每个检查项应该包含通过状态', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      if (status.checks.length > 0) {
        expect(typeof status.checks[0].passed).toBe('boolean');
      }
    });
  });

  describe('合规检查项', () => {
    it('应该检查审计日志完整性', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      const auditCheck = status.checks.find((c: any) => c.id === 'audit-integrity');
      expect(auditCheck).toBeDefined();
    });

    it('应该检查密钥管理合规', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      const keyCheck = status.checks.find((c: any) => c.id === 'key-management');
      expect(keyCheck).toBeDefined();
    });

    it('应该检查访问控制合规', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      const accessCheck = status.checks.find((c: any) => c.id === 'access-control');
      expect(accessCheck).toBeDefined();
    });

    it('应该检查风控规则执行', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      const riskCheck = status.checks.find((c: any) => c.id === 'risk-control');
      expect(riskCheck).toBeDefined();
    });

    it('应该检查审批流程合规', async () => {
      const status = await complianceReport.checkCompliance({
        userId: testUserId,
      });

      const approvalCheck = status.checks.find((c: any) => c.id === 'approval-process');
      expect(approvalCheck).toBeDefined();
    });
  });

  describe('报表管理', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await complianceReport.generateReport({
          type: ReportType.TRANSACTION_AUDIT,
          userId: testUserId,
        });
      }
    });

    it('应该能获取报表列表', () => {
      const list = complianceReport.getReports({
        userId: testUserId,
      });

      expect(Array.isArray(list.items)).toBe(true);
      expect(list.items.length).toBe(5);
    });

    it('应该能按类型筛选报表', () => {
      const list = complianceReport.getReports({
        userId: testUserId,
        type: ReportType.TRANSACTION_AUDIT,
      });

      expect(Array.isArray(list.items)).toBe(true);
    });

    it('应该能获取单个报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      const found = complianceReport.getReport(report.reportId);
      expect(found).toBeDefined();
      expect(found.reportId).toBe(report.reportId);
    });

    it('应该能删除报表', async () => {
      const report = await complianceReport.generateReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
      });

      complianceReport.deleteReport(report.reportId);
      const found = complianceReport.getReport(report.reportId);
      expect(found).toBeUndefined();
    });

    it('应该支持分页', () => {
      const page = complianceReport.getReports({
        userId: testUserId,
        page: 1,
        pageSize: 2,
      });

      expect(page.items.length).toBe(2);
      expect(page.total).toBe(5);
    });
  });

  describe('定时报表', () => {
    it('应该能创建定时报表任务', () => {
      const task = complianceReport.scheduleReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        schedule: 'daily',
        recipients: ['admin@example.com'],
      });

      expect(task).toBeDefined();
      expect(task.taskId).toBeDefined();
    });

    it('应该能获取定时任务列表', () => {
      complianceReport.scheduleReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        schedule: 'daily',
      });

      const tasks = complianceReport.getScheduledTasks({
        userId: testUserId,
      });

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(1);
    });

    it('应该能删除定时任务', () => {
      const task = complianceReport.scheduleReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        schedule: 'daily',
      });

      complianceReport.cancelScheduledTask(task.taskId);
      const tasks = complianceReport.getScheduledTasks({
        userId: testUserId,
      });

      expect(tasks.length).toBe(0);
    });

    it('应该支持每日定时报表', () => {
      const task = complianceReport.scheduleReport({
        type: ReportType.TRANSACTION_AUDIT,
        userId: testUserId,
        schedule: 'daily',
      });

      expect(task.schedule).toBe('daily');
    });

    it('应该支持每周定时报表', () => {
      const task = complianceReport.scheduleReport({
        type: ReportType.RISK_ANALYSIS,
        userId: testUserId,
        schedule: 'weekly',
      });

      expect(task.schedule).toBe('weekly');
    });

    it('应该支持每月定时报表', () => {
      const task = complianceReport.scheduleReport({
        type: ReportType.KEY_USAGE,
        userId: testUserId,
        schedule: 'monthly',
      });

      expect(task.schedule).toBe('monthly');
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await complianceReport.generateReport({
          type: ReportType.TRANSACTION_AUDIT,
          userId: testUserId,
        });
      }
      for (let i = 0; i < 2; i++) {
        await complianceReport.generateReport({
          type: ReportType.RISK_ANALYSIS,
          userId: testUserId,
        });
      }
    });

    it('应该能获取报表统计', () => {
      const stats = complianceReport.getStats({
        userId: testUserId,
      });

      expect(stats).toBeDefined();
      expect(typeof stats.totalReports).toBe('number');
    });

    it('应该能按类型统计报表数量', () => {
      const stats = complianceReport.getStats({
        userId: testUserId,
      });

      expect(stats.byType).toBeDefined();
      expect(stats.byType[ReportType.TRANSACTION_AUDIT]).toBe(3);
      expect(stats.byType[ReportType.RISK_ANALYSIS]).toBe(2);
    });
  });

  describe('配置管理', () => {
    it('应该能获取配置', () => {
      const config = complianceReport.getConfig();
      expect(config).toBeDefined();
    });

    it('应该能更新配置', () => {
      complianceReport.updateConfig({
        defaultFormat: ReportFormat.JSON,
        retentionDays: 365,
        maxReportsPerUser: 100,
      });

      const config = complianceReport.getConfig();
      expect(config.defaultFormat).toBe(ReportFormat.JSON);
      expect(config.retentionDays).toBe(365);
      expect(config.maxReportsPerUser).toBe(100);
    });
  });
});
