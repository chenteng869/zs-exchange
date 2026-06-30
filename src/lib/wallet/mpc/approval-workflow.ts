import { AuditService } from '../audit/audit.service';
import { notificationService } from './notification.service';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ApprovalType {
  TRANSACTION = 'transaction',
}

type Approval = {
  approvalId: string;
  type: ApprovalType;
  walletId: string;
  requesterId: string;
  approvers: string[];
  title: string;
  description?: string;
  data?: any;
  requiredApprovals: number;
  approvedBy: string[];
  status: ApprovalStatus;
  history: Array<{ action: string; operatorId: string; comment?: string; at: number }>;
  expiresAt?: number;
};

export class ApprovalWorkflow {
  private approvals: Approval[] = [];

  async createApproval(input: {
    type: ApprovalType;
    walletId: string;
    requesterId: string;
    approvers: string[];
    title: string;
    description?: string;
    data?: any;
    requiredApprovals: number;
    expiresAt?: number;
  }): Promise<Approval> {
    const approval: Approval = {
      approvalId: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      approvedBy: [],
      status: ApprovalStatus.PENDING,
      history: [],
    };
    this.approvals.push(approval);
    const auditService = new AuditService();
    auditService.recordEvent({
      eventType: 'approval_created' as any,
      entityType: 'approval' as any,
      entityId: approval.approvalId,
      userId: input.requesterId,
    } as any);
    await notificationService.sendNotification({ approvalId: approval.approvalId, approvers: input.approvers });
    return approval;
  }

  async getApproval(approvalId: string): Promise<Approval | null> {
    return this.approvals.find((a) => a.approvalId === approvalId) || null;
  }

  async approve(approvalId: string, approverId: string, comment?: string): Promise<Approval> {
    const approval = this.mustGet(approvalId);
    if (approval.status !== ApprovalStatus.PENDING) throw new Error('approval is not pending');
    if (!approval.approvers.includes(approverId)) throw new Error('not an approver');
    if (approval.approvedBy.includes(approverId)) throw new Error('already approved');

    approval.approvedBy.push(approverId);
    approval.history.push({ action: 'approve', operatorId: approverId, comment, at: Date.now() });
    if (approval.approvedBy.length >= approval.requiredApprovals) {
      approval.status = ApprovalStatus.APPROVED;
    }
    return approval;
  }

  async reject(approvalId: string, approverId: string, comment?: string): Promise<Approval> {
    const approval = this.mustGet(approvalId);
    if (approval.status !== ApprovalStatus.PENDING) throw new Error('approval is not pending');
    if (!approval.approvers.includes(approverId)) throw new Error('not an approver');

    approval.status = ApprovalStatus.REJECTED;
    approval.history.push({ action: 'reject', operatorId: approverId, comment, at: Date.now() });
    return approval;
  }

  async getApprovals(filter: {
    walletId?: string;
    requesterId?: string;
    approverId?: string;
    status?: ApprovalStatus;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Approval[]; total: number }> {
    let items = [...this.approvals];
    if (filter.walletId) items = items.filter((a) => a.walletId === filter.walletId);
    if (filter.requesterId) items = items.filter((a) => a.requesterId === filter.requesterId);
    if (filter.approverId) items = items.filter((a) => a.approvers.includes(filter.approverId!));
    if (filter.status) items = items.filter((a) => a.status === filter.status);
    const total = items.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || total || 10;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total };
  }

  async isApproved(approvalId: string): Promise<boolean> {
    const a = await this.getApproval(approvalId);
    return a?.status === ApprovalStatus.APPROVED;
  }

  async isRejected(approvalId: string): Promise<boolean> {
    const a = await this.getApproval(approvalId);
    return a?.status === ApprovalStatus.REJECTED;
  }

  async isPending(approvalId: string): Promise<boolean> {
    const a = await this.getApproval(approvalId);
    return a?.status === ApprovalStatus.PENDING;
  }

  async getApprovalHistory(approvalId: string): Promise<Approval['history']> {
    const a = this.mustGet(approvalId);
    return [...a.history];
  }

  async isExpired(approvalId: string): Promise<boolean> {
    const a = this.mustGet(approvalId);
    return !!a.expiresAt && a.expiresAt < Date.now();
  }

  async cancel(approvalId: string, requesterId: string, reason?: string): Promise<Approval> {
    const a = this.mustGet(approvalId);
    if (a.requesterId !== requesterId) throw new Error('only requester can cancel');
    if (a.status !== ApprovalStatus.PENDING) throw new Error('approval is not pending');
    a.status = ApprovalStatus.CANCELLED;
    a.history.push({ action: 'cancel', operatorId: requesterId, comment: reason, at: Date.now() });
    return a;
  }

  async getStats(filter: { walletId?: string }): Promise<{ total: number }> {
    const list = filter.walletId ? this.approvals.filter((a) => a.walletId === filter.walletId) : this.approvals;
    return { total: list.length };
  }

  private mustGet(approvalId: string): Approval {
    const approval = this.approvals.find((a) => a.approvalId === approvalId);
    if (!approval) throw new Error('approval not found');
    return approval;
  }
}
