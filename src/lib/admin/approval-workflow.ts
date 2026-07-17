/**
 * 审批工作流服务
 *
 * 功能：
 *  - 高风险操作发起审批
 *  - 多级审批流程
 *  - 审批状态跟踪
 *  - 审批通知
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { safeJsonParse } from '@/lib/security/safe-json-parse';
import { createAuditLog } from './audit-log';

export type ApprovalType =
  | 'user_freeze'
  | 'user_unfreeze'
  | 'user_delete'
  | 'large_withdrawal'
  | 'large_recharge'
  | 'admin_create'
  | 'admin_delete'
  | 'admin_permission_change'
  | 'role_create'
  | 'role_delete'
  | 'role_permission_change'
  | 'system_config_change'
  | 'fee_config_change'
  | 'token_listing'
  | 'token_delisting'
  | 'contract_deploy'
  | 'risk_rule_change'
  | 'data_export';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export type ApprovalLevel = 1 | 2 | 3;

export interface ApprovalStep {
  level: ApprovalLevel;
  requiredRole: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ApprovalRecord {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  status: ApprovalStatus;
  currentLevel: ApprovalLevel;
  requiredLevels: ApprovalLevel;
  steps: ApprovalStep[];
  targetId?: string;
  targetType?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface CreateApprovalParams {
  type: ApprovalType;
  title: string;
  description: string;
  targetId?: string;
  targetType?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  requiredLevels?: ApprovalLevel;
}

interface ApprovalFilter {
  status?: ApprovalStatus;
  type?: ApprovalType;
  applicantId?: string;
  approverId?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

interface ApprovalQueryResult {
  list: ApprovalRecord[];
  total: number;
  page: number;
  pageSize: number;
}

const APPROVAL_STORAGE_KEY = 'zs-admin-approvals';

let approvals: ApprovalRecord[] = [];

const approvalConfig: Record<ApprovalType, { levels: ApprovalLevel; stepRoles: string[] }> = {
  user_freeze: { levels: 2, stepRoles: ['风控专员', '风控主管'] },
  user_unfreeze: { levels: 2, stepRoles: ['风控专员', '风控主管'] },
  user_delete: { levels: 3, stepRoles: ['运营主管', '风控总监', '超级管理员'] },
  large_withdrawal: { levels: 2, stepRoles: ['财务审核员', '财务主管'] },
  large_recharge: { levels: 1, stepRoles: ['财务审核员'] },
  admin_create: { levels: 3, stepRoles: ['系统管理员', '运营总监', '超级管理员'] },
  admin_delete: { levels: 3, stepRoles: ['系统管理员', '运营总监', '超级管理员'] },
  admin_permission_change: { levels: 2, stepRoles: ['系统管理员', '超级管理员'] },
  role_create: { levels: 2, stepRoles: ['系统管理员', '超级管理员'] },
  role_delete: { levels: 3, stepRoles: ['系统管理员', '运营总监', '超级管理员'] },
  role_permission_change: { levels: 2, stepRoles: ['系统管理员', '超级管理员'] },
  system_config_change: { levels: 2, stepRoles: ['系统管理员', '超级管理员'] },
  fee_config_change: { levels: 2, stepRoles: ['财务主管', '运营总监'] },
  token_listing: { levels: 3, stepRoles: ['上币审核员', '运营总监', '超级管理员'] },
  token_delisting: { levels: 3, stepRoles: ['上币审核员', '运营总监', '超级管理员'] },
  contract_deploy: { levels: 3, stepRoles: ['技术主管', '安全总监', '超级管理员'] },
  risk_rule_change: { levels: 2, stepRoles: ['风控专员', '风控主管'] },
  data_export: { levels: 1, stepRoles: ['部门主管'] },
};

const generateId = (): string => {
  return `apr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const loadFromStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(APPROVAL_STORAGE_KEY);
    if (stored) {
      const parsed = safeJsonParse<ApprovalRecord[]>(stored, { context: 'approval-storage' });
      if (Array.isArray(parsed)) approvals = parsed;
    }
  } catch (e) {
    logger.error('[Approval] 加载审批数据失败', e);
  }
};

const saveToStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvals));
  } catch (e) {
    logger.error('[Approval] 保存审批数据失败', e);
  }
};

if (typeof window !== 'undefined') {
  loadFromStorage();
}

const createInitialSteps = (type: ApprovalType): ApprovalStep[] => {
  const config = approvalConfig[type];
  const steps: ApprovalStep[] = [];

  for (let i = 1; i <= config.levels; i++) {
    steps.push({
      level: i as ApprovalLevel,
      requiredRole: config.stepRoles[i - 1] || '审批人',
      status: 'pending',
    });
  }

  return steps;
};

export const createApproval = async (params: CreateApprovalParams): Promise<ApprovalRecord> => {
  const authState = useAuthStore.getState();
  const config = approvalConfig[params.type];
  const requiredLevels = params.requiredLevels || config.levels;

  const record: ApprovalRecord = {
    id: generateId(),
    type: params.type,
    title: params.title,
    description: params.description,
    applicantId: authState.user?.id || 'unknown',
    applicantName: authState.user?.username || 'unknown',
    applicantRole: (authState.user?.role as string) || 'unknown',
    status: 'pending',
    currentLevel: 1,
    requiredLevels,
    steps: createInitialSteps(params.type),
    targetId: params.targetId,
    targetType: params.targetType,
    beforeData: params.beforeData,
    afterData: params.afterData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  approvals.unshift(record);
  saveToStorage();

  await createAuditLog({
    operatorId: record.applicantId,
    operatorName: record.applicantName,
    operatorRole: record.applicantRole,
    module: 'system',
    action: 'create',
    targetId: record.id,
    targetType: 'approval',
    details: `发起审批: ${record.title}`,
    status: 'info',
    approvalId: record.id,
  });

  logger.info(`[Approval] 创建审批: ${record.title} (${record.id})`);
  return record;
};

export const approveApproval = async (
  approvalId: string,
  comment?: string
): Promise<ApprovalRecord | null> => {
  const authState = useAuthStore.getState();
  const approval = approvals.find((a) => a.id === approvalId);

  if (!approval) {
    logger.error(`[Approval] 审批记录不存在: ${approvalId}`);
    return null;
  }

  if (approval.status !== 'pending') {
    logger.warn(`[Approval] 审批状态异常: ${approval.status}`);
    return null;
  }

  const currentStep = approval.steps.find((s) => s.level === approval.currentLevel);
  if (!currentStep) {
    logger.error(`[Approval] 审批步骤异常`);
    return null;
  }

  currentStep.approverId = authState.user?.id || 'unknown';
  currentStep.approverName = authState.user?.username || 'unknown';
  currentStep.approvedAt = new Date().toISOString();
  currentStep.comment = comment;
  currentStep.status = 'approved';

  if (approval.currentLevel >= approval.requiredLevels) {
    approval.status = 'approved';
  } else {
    approval.currentLevel = (approval.currentLevel + 1) as ApprovalLevel;
  }

  approval.updatedAt = new Date().toISOString();
  saveToStorage();

  await createAuditLog({
    operatorId: currentStep.approverId,
    operatorName: currentStep.approverName,
    operatorRole: (authState.user?.role as string) || 'unknown',
    module: 'system',
    action: 'approve',
    targetId: approval.id,
    targetType: 'approval',
    details: `审批通过: ${approval.title} (第${currentStep.level}级)`,
    status: 'success',
    approvalId: approval.id,
  });

  logger.info(
    `[Approval] 审批通过: ${approval.title} - 第${currentStep.level}级 by ${currentStep.approverName}`
  );
  return approval;
};

export const rejectApproval = async (
  approvalId: string,
  reason: string
): Promise<ApprovalRecord | null> => {
  const authState = useAuthStore.getState();
  const approval = approvals.find((a) => a.id === approvalId);

  if (!approval) {
    logger.error(`[Approval] 审批记录不存在: ${approvalId}`);
    return null;
  }

  if (approval.status !== 'pending') {
    logger.warn(`[Approval] 审批状态异常: ${approval.status}`);
    return null;
  }

  const currentStep = approval.steps.find((s) => s.level === approval.currentLevel);
  if (!currentStep) {
    logger.error(`[Approval] 审批步骤异常`);
    return null;
  }

  currentStep.approverId = authState.user?.id || 'unknown';
  currentStep.approverName = authState.user?.username || 'unknown';
  currentStep.approvedAt = new Date().toISOString();
  currentStep.comment = reason;
  currentStep.status = 'rejected';

  approval.status = 'rejected';
  approval.updatedAt = new Date().toISOString();
  saveToStorage();

  await createAuditLog({
    operatorId: currentStep.approverId,
    operatorName: currentStep.approverName,
    operatorRole: (authState.user?.role as string) || 'unknown',
    module: 'system',
    action: 'reject',
    targetId: approval.id,
    targetType: 'approval',
    details: `审批驳回: ${approval.title} - ${reason}`,
    status: 'warning',
    approvalId: approval.id,
  });

  logger.info(
    `[Approval] 审批驳回: ${approval.title} by ${currentStep.approverName} - ${reason}`
  );
  return approval;
};

export const cancelApproval = async (approvalId: string): Promise<ApprovalRecord | null> => {
  const authState = useAuthStore.getState();
  const approval = approvals.find((a) => a.id === approvalId);

  if (!approval) return null;

  if (approval.applicantId !== authState.user?.id && authState.user?.role !== 'admin') {
    logger.warn(`[Approval] 无权取消审批`);
    return null;
  }

  approval.status = 'cancelled';
  approval.updatedAt = new Date().toISOString();
  saveToStorage();

  await createAuditLog({
    operatorId: authState.user?.id || 'unknown',
    operatorName: authState.user?.username || 'unknown',
    operatorRole: (authState.user?.role as string) || 'unknown',
    module: 'system',
    action: 'delete',
    targetId: approval.id,
    targetType: 'approval',
    details: `取消审批: ${approval.title}`,
    status: 'warning',
    approvalId: approval.id,
  });

  logger.info(`[Approval] 取消审批: ${approval.title}`);
  return approval;
};

export const getApprovalById = (id: string): ApprovalRecord | undefined => {
  return approvals.find((a) => a.id === id);
};

export const queryApprovals = (filter: ApprovalFilter): ApprovalQueryResult => {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  let filtered = [...approvals];

  if (filter.status) {
    filtered = filtered.filter((a) => a.status === filter.status);
  }

  if (filter.type) {
    filtered = filtered.filter((a) => a.type === filter.type);
  }

  if (filter.applicantId) {
    filtered = filtered.filter((a) => a.applicantId === filter.applicantId);
  }

  if (filter.approverId) {
    filtered = filtered.filter((a) =>
      a.steps.some((s) => s.approverId === filter.approverId)
    );
  }

  if (filter.startTime) {
    filtered = filtered.filter((a) => a.createdAt >= filter.startTime!);
  }

  if (filter.endTime) {
    filtered = filtered.filter((a) => a.createdAt <= filter.endTime!);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  return { list, total, page, pageSize };
};

export const getPendingApprovals = (approverRole?: string): ApprovalRecord[] => {
  return approvals.filter((a) => {
    if (a.status !== 'pending') return false;

    const currentStep = a.steps.find((s) => s.level === a.currentLevel);
    if (!currentStep) return false;

    if (approverRole && currentStep.requiredRole !== approverRole) {
      return false;
    }

    return true;
  });
};

export const getApprovalStatistics = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const recent = approvals.filter((a) => a.createdAt >= sevenDaysAgo);

  const stats = {
    total: approvals.length,
    pending: approvals.filter((a) => a.status === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved').length,
    rejected: approvals.filter((a) => a.status === 'rejected').length,
    todayNew: approvals.filter((a) => a.createdAt.startsWith(today)).length,
    todayProcessed: approvals.filter(
      (a) =>
        a.updatedAt.startsWith(today) &&
        (a.status === 'approved' || a.status === 'rejected')
    ).length,
    byType: {} as Record<string, number>,
    recent,
  };

  approvals.forEach((a) => {
    stats.byType[a.type] = (stats.byType[a.type] || 0) + 1;
  });

  return stats;
};

export const requiresApproval = (type: ApprovalType): boolean => {
  return !!approvalConfig[type];
};

export const getApprovalConfig = (type: ApprovalType) => {
  return approvalConfig[type];
};

export const getApprovalTypeLabels = (): Record<ApprovalType, string> => ({
  user_freeze: '用户冻结',
  user_unfreeze: '用户解冻',
  user_delete: '用户删除',
  large_withdrawal: '大额提现',
  large_recharge: '大额充值',
  admin_create: '创建管理员',
  admin_delete: '删除管理员',
  admin_permission_change: '管理员权限变更',
  role_create: '创建角色',
  role_delete: '删除角色',
  role_permission_change: '角色权限变更',
  system_config_change: '系统配置变更',
  fee_config_change: '费率配置变更',
  token_listing: '代币上线',
  token_delisting: '代币下架',
  contract_deploy: '合约部署',
  risk_rule_change: '风控规则变更',
  data_export: '数据导出',
});

export const approvalService = {
  createApproval,
  approveApproval,
  rejectApproval,
  cancelApproval,
  getApprovalById,
  queryApprovals,
  getPendingApprovals,
  getApprovalStatistics,
  requiresApproval,
  getApprovalConfig,
  getApprovalTypeLabels,
};

export default approvalService;
