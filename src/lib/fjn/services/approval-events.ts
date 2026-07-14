/**
 * Approval Service - 事件定义
 *
 * 工业级 Solana-first 架构
 */

export const APPROVAL_EVENTS = {
  REQUEST_CREATED: 'approval.request.created',
  REQUEST_IN_REVIEW: 'approval.request.in_review',
  REQUEST_APPROVED: 'approval.request.approved',
  REQUEST_REJECTED: 'approval.request.rejected',
  REQUEST_CANCELLED: 'approval.request.cancelled',
  REQUEST_EXECUTED: 'approval.request.executed',
  REQUEST_EXPIRED: 'approval.request.expired',
  STEP_APPROVED: 'approval.step.approved',
  STEP_REJECTED: 'approval.step.rejected',
  STEP_SKIPPED: 'approval.step.skipped',
  STEP_EXPIRED: 'approval.step.expired',
  STEP_ADVANCED: 'approval.step.advanced',
  PRIORITY_ESCALATED: 'approval.priority.escalated',
  DEADLINE_WARNING: 'approval.deadline.warning',
} as const;

export const APPROVAL_EVENT_SOURCES = {
  APPROVAL_SERVICE: 'approval_service',
  ADMIN: 'admin',
  SYSTEM: 'system',
  REVIEWER: 'reviewer',
  APPLICANT: 'applicant',
  SCHEDULER: 'scheduler',
} as const;

export type FjnApprovalEvent =
  (typeof APPROVAL_EVENTS)[keyof typeof APPROVAL_EVENTS];

export type FjnApprovalEventSource =
  (typeof APPROVAL_EVENT_SOURCES)[keyof typeof APPROVAL_EVENT_SOURCES];

export interface ApprovalRequestCreatedPayload {
  approvalId: string;
  approvalNo: string;
  approvalType: string;
  title: string;
  applicantId: string;
  applicantType: string;
  totalSteps: number;
  priority: string;
  expiresAt?: string;
  amount?: string;
  currency?: string;
  relatedType?: string;
  relatedId?: string;
}

export interface ApprovalStepDecisionPayload {
  approvalId: string;
  approvalNo: string;
  stepNo: number;
  stepName: string;
  approverId: string;
  approverRole?: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  /** request 的新状态 */
  requestStatus: string;
  /** request 的当前步骤 */
  currentStep: number;
}

export interface ApprovalRequestExecutedPayload {
  approvalId: string;
  approvalNo: string;
  approvalType: string;
  executorId: string;
  relatedType?: string;
  relatedId?: string;
  executedAt: string;
}

export type FjnApprovalEventPayload =
  | ApprovalRequestCreatedPayload
  | ApprovalStepDecisionPayload
  | ApprovalRequestExecutedPayload
  | Record<string, unknown>;
