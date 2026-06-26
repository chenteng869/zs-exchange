import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { ApprovalWorkflow, ApprovalStatus, ApprovalType } from '../../mpc/approval-workflow';
import { ChainType } from '../../mpc/mpc.types';

vi.mock('../../mpc/policy-engine', () => ({
  policyEngine: {
    evaluate: vi.fn().mockReturnValue({
      allowed: true,
      matchedPolicies: [],
    }),
  },
}));

vi.mock('../../audit/audit.service', () => ({
  auditService: {
    recordEvent: vi.fn(),
  },
}));

vi.mock('../../mpc/notification.service', () => ({
  notificationService: {
    sendNotification: vi.fn().mockResolvedValue(true),
  },
}));

describe('ApprovalWorkflow - 审批工作流', () => {
  let approvalWorkflow: ApprovalWorkflow;
  const testApproverId = 'approver-test-001';
  const testRequesterId = 'requester-test-001';
  const testWalletId = 'wallet-test-001';

  beforeEach(() => {
    approvalWorkflow = new ApprovalWorkflow();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建审批工作流实例', () => {
      expect(approvalWorkflow).toBeDefined();
    });
  });

  describe('创建审批', () => {
    it('应该能创建审批请求', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '大额转账审批',
        description: '转账 100 ETH 到新地址',
        data: {
          to: '0x' + 'a'.repeat(40),
          amount: '100000000000000000000',
        },
        requiredApprovals: 1,
      });

      expect(approval).toBeDefined();
      expect(approval.approvalId).toBeDefined();
      expect(approval.status).toBe(ApprovalStatus.PENDING);
    });

    it('创建的审批应该包含正确的标题', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试审批',
        requiredApprovals: 1,
      });

      expect(approval.title).toBe('测试审批');
    });

    it('创建的审批应该处于 PENDING 状态', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试',
        requiredApprovals: 1,
      });

      expect(approval.status).toBe(ApprovalStatus.PENDING);
    });

    it('应该记录审计事件', async () => {
      await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试',
        requiredApprovals: 1,
      });

      const { auditService } = require('../../audit/audit.service');
      expect(auditService.recordEvent).toHaveBeenCalled();
    });

    it('应该发送通知给审批人', async () => {
      await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试',
        requiredApprovals: 1,
      });

      const { notificationService } = require('../../mpc/notification.service');
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('获取审批', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试审批',
        requiredApprovals: 1,
      });
      testApprovalId = approval.approvalId;
    });

    it('应该能获取审批详情', async () => {
      const approval = await approvalWorkflow.getApproval(testApprovalId);
      expect(approval).toBeDefined();
      expect(approval.approvalId).toBe(testApprovalId);
    });

    it('获取不存在的审批应该返回 null', async () => {
      const approval = await approvalWorkflow.getApproval('non-existent-id');
      expect(approval).toBeNull();
    });
  });

  describe('审批操作', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试审批',
        requiredApprovals: 1,
      });
      testApprovalId = approval.approvalId;
    });

    it('应该能批准审批', async () => {
      const result = await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      expect(result).toBeDefined();
      expect(result.status).toBe(ApprovalStatus.APPROVED);
    });

    it('应该能拒绝审批', async () => {
      const result = await approvalWorkflow.reject(testApprovalId, testApproverId, '拒绝原因');
      expect(result).toBeDefined();
      expect(result.status).toBe(ApprovalStatus.REJECTED);
    });

    it('批准后状态应该更新', async () => {
      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      const approval = await approvalWorkflow.getApproval(testApprovalId);
      expect(approval.status).toBe(ApprovalStatus.APPROVED);
    });

    it('拒绝后状态应该更新', async () => {
      await approvalWorkflow.reject(testApprovalId, testApproverId, '拒绝');
      const approval = await approvalWorkflow.getApproval(testApprovalId);
      expect(approval.status).toBe(ApprovalStatus.REJECTED);
    });

    it('审批应该记录审批意见', async () => {
      const comment = '我同意这笔交易';
      await approvalWorkflow.approve(testApprovalId, testApproverId, comment);
      const approval = await approvalWorkflow.getApproval(testApprovalId);
      expect(approval.history.some((h: any) => h.comment === comment)).toBe(true);
    });

    it('非审批人不能批准', async () => {
      await expect(
        approvalWorkflow.approve(testApprovalId, 'invalid-approver', '同意')
      ).rejects.toThrow();
    });

    it('已批准的审批不能再次批准', async () => {
      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      await expect(
        approvalWorkflow.approve(testApprovalId, testApproverId, '再次同意')
      ).rejects.toThrow();
    });

    it('已拒绝的审批不能批准', async () => {
      await approvalWorkflow.reject(testApprovalId, testApproverId, '拒绝');
      await expect(
        approvalWorkflow.approve(testApprovalId, testApproverId, '同意')
      ).rejects.toThrow();
    });
  });

  describe('多人审批', () => {
    const approver2 = 'approver-test-002';
    const approver3 = 'approver-test-003';

    it('需要多人审批时应该累计批准数', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId, approver2, approver3],
        title: '多人审批测试',
        requiredApprovals: 2,
      });

      await approvalWorkflow.approve(approval.approvalId, testApproverId, '同意');
      const afterFirst = await approvalWorkflow.getApproval(approval.approvalId);
      expect(afterFirst.status).toBe(ApprovalStatus.PENDING);

      await approvalWorkflow.approve(approval.approvalId, approver2, '同意');
      const afterSecond = await approvalWorkflow.getApproval(approval.approvalId);
      expect(afterSecond.status).toBe(ApprovalStatus.APPROVED);
    });

    it('任何一人拒绝应该直接拒绝', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId, approver2, approver3],
        title: '多人审批测试',
        requiredApprovals: 2,
      });

      await approvalWorkflow.reject(approval.approvalId, testApproverId, '拒绝');
      const afterReject = await approvalWorkflow.getApproval(approval.approvalId);
      expect(afterReject.status).toBe(ApprovalStatus.REJECTED);
    });
  });

  describe('审批列表', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await approvalWorkflow.createApproval({
          type: ApprovalType.TRANSACTION,
          walletId: testWalletId,
          requesterId: testRequesterId,
          approvers: [testApproverId],
          title: `审批 ${i}`,
          requiredApprovals: 1,
        });
      }
    });

    it('应该能获取审批列表', async () => {
      const list = await approvalWorkflow.getApprovals({
        walletId: testWalletId,
      });
      expect(Array.isArray(list.items)).toBe(true);
      expect(list.items.length).toBe(5);
    });

    it('应该支持分页', async () => {
      const list = await approvalWorkflow.getApprovals({
        walletId: testWalletId,
        page: 1,
        pageSize: 2,
      });
      expect(list.items.length).toBe(2);
      expect(list.total).toBe(5);
    });

    it('应该能按状态筛选', async () => {
      const firstApproval = await approvalWorkflow.getApprovals({ walletId: testWalletId });
      await approvalWorkflow.approve(firstApproval.items[0].approvalId, testApproverId, '同意');

      const approvedList = await approvalWorkflow.getApprovals({
        walletId: testWalletId,
        status: ApprovalStatus.APPROVED,
      });
      expect(approvedList.items.length).toBe(1);
    });

    it('应该能按审批人筛选', async () => {
      const list = await approvalWorkflow.getApprovals({
        approverId: testApproverId,
      });
      expect(Array.isArray(list.items)).toBe(true);
    });

    it('应该能按申请人筛选', async () => {
      const list = await approvalWorkflow.getApprovals({
        requesterId: testRequesterId,
      });
      expect(Array.isArray(list.items)).toBe(true);
    });
  });

  describe('审批状态检查', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试审批',
        requiredApprovals: 1,
      });
      testApprovalId = approval.approvalId;
    });

    it('应该能检查是否已批准', async () => {
      const before = await approvalWorkflow.isApproved(testApprovalId);
      expect(before).toBe(false);

      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      const after = await approvalWorkflow.isApproved(testApprovalId);
      expect(after).toBe(true);
    });

    it('应该能检查是否已拒绝', async () => {
      const before = await approvalWorkflow.isRejected(testApprovalId);
      expect(before).toBe(false);

      await approvalWorkflow.reject(testApprovalId, testApproverId, '拒绝');
      const after = await approvalWorkflow.isRejected(testApprovalId);
      expect(after).toBe(true);
    });

    it('应该能检查是否待审批', async () => {
      const isPending = await approvalWorkflow.isPending(testApprovalId);
      expect(isPending).toBe(true);
    });
  });

  describe('审批历史', () => {
    let testApprovalId: string;

    beforeEach(async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '测试审批',
        requiredApprovals: 1,
      });
      testApprovalId = approval.approvalId;
    });

    it('应该能获取审批历史记录', async () => {
      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      const history = await approvalWorkflow.getApprovalHistory(testApprovalId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('历史记录应该包含操作人', async () => {
      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      const history = await approvalWorkflow.getApprovalHistory(testApprovalId);
      expect(history.some((h: any) => h.operatorId === testApproverId)).toBe(true);
    });

    it('历史记录应该包含操作类型', async () => {
      await approvalWorkflow.approve(testApprovalId, testApproverId, '同意');
      const history = await approvalWorkflow.getApprovalHistory(testApprovalId);
      expect(history.some((h: any) => h.action === 'approve')).toBe(true);
    });
  });

  describe('超时处理', () => {
    it('应该能设置审批超时时间', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '超时测试',
        requiredApprovals: 1,
        expiresAt: Date.now() + 3600000,
      });
      expect(approval.expiresAt).toBeDefined();
    });

    it('应该能检查审批是否已超时', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '超时测试',
        requiredApprovals: 1,
        expiresAt: Date.now() - 1000,
      });

      const isExpired = await approvalWorkflow.isExpired(approval.approvalId);
      expect(isExpired).toBe(true);
    });
  });

  describe('撤销审批', () => {
    it('申请人应该能撤销审批', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '撤销测试',
        requiredApprovals: 1,
      });

      const result = await approvalWorkflow.cancel(approval.approvalId, testRequesterId, '撤销原因');
      expect(result.status).toBe(ApprovalStatus.CANCELLED);
    });

    it('非申请人不能撤销', async () => {
      const approval = await approvalWorkflow.createApproval({
        type: ApprovalType.TRANSACTION,
        walletId: testWalletId,
        requesterId: testRequesterId,
        approvers: [testApproverId],
        title: '撤销测试',
        requiredApprovals: 1,
      });

      await expect(
        approvalWorkflow.cancel(approval.approvalId, 'non-owner', '撤销')
      ).rejects.toThrow();
    });
  });

  describe('统计信息', () => {
    it('应该能获取统计信息', async () => {
      const stats = await approvalWorkflow.getStats({
        walletId: testWalletId,
      });
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
    });
  });
});
