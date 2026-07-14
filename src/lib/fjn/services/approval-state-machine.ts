/**
 * Approval Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.1
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.16
 *
 * Approval = 工业级审批流
 *  - 多级审批
 *  - 申请 → 多步骤审批 → 通过/拒绝 → 执行
 *  - 高危操作必须走审批（rule_change、points_adjust、asset_freeze、...）
 *
 * 数据落地：FjnApprovalRequest + FjnApprovalStep（独立表，结构清晰）
 * 集成：所有 Service 在执行高危操作前调用 ApprovalService.createRequest
 */

export const APPROVAL_TYPE = {
  RULE_CHANGE: 'rule_change',
  POINTS_ADJUST: 'points_adjust',
  ASSET_FREEZE: 'asset_freeze',
  ASSET_UNFREEZE: 'asset_unfreeze',
  REWARD_PAYOUT: 'reward_payout',
  REWARD_RECOVER: 'reward_recover',
  RELEASE_ADJUST: 'release_adjust',
  FINANCE_SETTLEMENT: 'finance_settlement',
  TAX_ADJUSTMENT: 'tax_adjustment',
  USER_UNFREEZE: 'user_unfreeze',
  NFT_REVOKE: 'nft_revoke',
  TREASURY_TRANSFER: 'treasury_transfer',
  ORDER_REFUND_OVERRIDE: 'order_refund_override',
  POINTS_BURN_OVERRIDE: 'points_burn_override',
  COMPLIANCE_OVERRIDE: 'compliance_override',
  KYC_REJECT_OVERRIDE: 'kyc_reject_override',
  RISK_BLOCK_OVERRIDE: 'risk_block_override',
  CUSTOM: 'custom',
} as const;
export type FjnApprovalType = (typeof APPROVAL_TYPE)[keyof typeof APPROVAL_TYPE];

/** 审批请求状态 */
export const APPROVAL_REQUEST_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXECUTED: 'executed',
  EXPIRED: 'expired',
} as const;
export type FjnApprovalRequestStatus =
  (typeof APPROVAL_REQUEST_STATUS)[keyof typeof APPROVAL_REQUEST_STATUS];

/** 审批步骤状态 */
export const APPROVAL_STEP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SKIPPED: 'skipped',
  EXPIRED: 'expired',
} as const;
export type FjnApprovalStepStatus =
  (typeof APPROVAL_STEP_STATUS)[keyof typeof APPROVAL_STEP_STATUS];

/** 申请人类型 */
export const APPROVAL_APPLICANT_TYPE = {
  ADMIN: 'admin',
  SYSTEM: 'system',
  NODE: 'node',
  MERCHANT: 'merchant',
} as const;
export type FjnApprovalApplicantType =
  (typeof APPROVAL_APPLICANT_TYPE)[keyof typeof APPROVAL_APPLICANT_TYPE];

/** 优先级 */
export const APPROVAL_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type FjnApprovalPriority = (typeof APPROVAL_PRIORITY)[keyof typeof APPROVAL_PRIORITY];

/** 风险等级（按审批类型映射） */
export const APPROVAL_TYPE_RISK_LEVEL: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  [APPROVAL_TYPE.RULE_CHANGE]: 'critical',
  [APPROVAL_TYPE.POINTS_ADJUST]: 'high',
  [APPROVAL_TYPE.ASSET_FREEZE]: 'high',
  [APPROVAL_TYPE.ASSET_UNFREEZE]: 'high',
  [APPROVAL_TYPE.REWARD_PAYOUT]: 'medium',
  [APPROVAL_TYPE.REWARD_RECOVER]: 'high',
  [APPROVAL_TYPE.RELEASE_ADJUST]: 'critical',
  [APPROVAL_TYPE.FINANCE_SETTLEMENT]: 'high',
  [APPROVAL_TYPE.TAX_ADJUSTMENT]: 'high',
  [APPROVAL_TYPE.USER_UNFREEZE]: 'high',
  [APPROVAL_TYPE.NFT_REVOKE]: 'high',
  [APPROVAL_TYPE.TREASURY_TRANSFER]: 'critical',
  [APPROVAL_TYPE.ORDER_REFUND_OVERRIDE]: 'medium',
  [APPROVAL_TYPE.POINTS_BURN_OVERRIDE]: 'high',
  [APPROVAL_TYPE.COMPLIANCE_OVERRIDE]: 'critical',
  [APPROVAL_TYPE.KYC_REJECT_OVERRIDE]: 'medium',
  [APPROVAL_TYPE.RISK_BLOCK_OVERRIDE]: 'high',
  [APPROVAL_TYPE.CUSTOM]: 'medium',
};

/** 默认步骤（按风险等级） */
export const APPROVAL_STEPS_BY_RISK: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** 默认过期时间（小时）按优先级 */
export const APPROVAL_DEFAULT_EXPIRES_HOURS: Record<string, number> = {
  [APPROVAL_PRIORITY.LOW]: 168,      // 7 天
  [APPROVAL_PRIORITY.NORMAL]: 72,    // 3 天
  [APPROVAL_PRIORITY.HIGH]: 24,      // 1 天
  [APPROVAL_PRIORITY.URGENT]: 4,     // 4 小时
};

/** 默认链 */
export const APPROVAL_DEFAULT_CHAIN_ID = 'devnet';

/** 校验器 */
export const isValidApprovalType = (v: string): v is FjnApprovalType =>
  Object.values(APPROVAL_TYPE).includes(v as any);
export const isValidApprovalRequestStatus = (v: string): v is FjnApprovalRequestStatus =>
  Object.values(APPROVAL_REQUEST_STATUS).includes(v as any);
export const isValidApprovalStepStatus = (v: string): v is FjnApprovalStepStatus =>
  Object.values(APPROVAL_STEP_STATUS).includes(v as any);
export const isValidApprovalApplicantType = (v: string): v is FjnApprovalApplicantType =>
  Object.values(APPROVAL_APPLICANT_TYPE).includes(v as any);
export const isValidApprovalPriority = (v: string): v is FjnApprovalPriority =>
  Object.values(APPROVAL_PRIORITY).includes(v as any);

/** 状态机：Request 合法转移 */
export const APPROVAL_REQUEST_STATUS_TRANSITIONS: Record<
  FjnApprovalRequestStatus,
  FjnApprovalRequestStatus[]
> = {
  [APPROVAL_REQUEST_STATUS.PENDING]: [
    APPROVAL_REQUEST_STATUS.IN_REVIEW,
    APPROVAL_REQUEST_STATUS.CANCELLED,
    APPROVAL_REQUEST_STATUS.EXPIRED,
  ],
  [APPROVAL_REQUEST_STATUS.IN_REVIEW]: [
    APPROVAL_REQUEST_STATUS.APPROVED,
    APPROVAL_REQUEST_STATUS.REJECTED,
    APPROVAL_REQUEST_STATUS.CANCELLED,
    APPROVAL_REQUEST_STATUS.EXPIRED,
  ],
  [APPROVAL_REQUEST_STATUS.APPROVED]: [
    APPROVAL_REQUEST_STATUS.EXECUTED,
    APPROVAL_REQUEST_STATUS.CANCELLED,
  ],
  [APPROVAL_REQUEST_STATUS.REJECTED]: [],
  [APPROVAL_REQUEST_STATUS.CANCELLED]: [],
  [APPROVAL_REQUEST_STATUS.EXECUTED]: [],
  [APPROVAL_REQUEST_STATUS.EXPIRED]: [],
};

export const canTransitApprovalRequestStatus = (
  from: FjnApprovalRequestStatus,
  to: FjnApprovalRequestStatus,
): boolean => (APPROVAL_REQUEST_STATUS_TRANSITIONS[from] ?? []).includes(to);

/** 终态判断 */
export const TERMINAL_APPROVAL_REQUEST_STATUSES: FjnApprovalRequestStatus[] = [
  APPROVAL_REQUEST_STATUS.REJECTED,
  APPROVAL_REQUEST_STATUS.CANCELLED,
  APPROVAL_REQUEST_STATUS.EXECUTED,
  APPROVAL_REQUEST_STATUS.EXPIRED,
];

export const isTerminalApprovalRequestStatus = (s: FjnApprovalRequestStatus): boolean =>
  TERMINAL_APPROVAL_REQUEST_STATUSES.includes(s);

/** 按审批类型推导风险等级 */
export const getApprovalRiskLevel = (
  type: FjnApprovalType,
): 'low' | 'medium' | 'high' | 'critical' =>
  APPROVAL_TYPE_RISK_LEVEL[type] ?? 'medium';

/** 按审批类型推导默认步骤数 */
export const getDefaultApprovalSteps = (type: FjnApprovalType): number => {
  const level = getApprovalRiskLevel(type);
  return APPROVAL_STEPS_BY_RISK[level] ?? 1;
};
