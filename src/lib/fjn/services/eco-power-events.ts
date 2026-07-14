/**
 * Eco Power Service - 事件定义
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 *
 * 全部事件通过 outbox 模式写入 `outboxEvent` 表
 * 事件命名空间：`fjn.eco_power.*`
 */

export const ECO_POWER_EVENTS = {
  // 账户生命周期
  ACCOUNT_CREATED: 'fjn.eco_power.account_created',
  ACCOUNT_STATUS_CHANGED: 'fjn.eco_power.account_status_changed',
  ACCOUNT_CLOSED: 'fjn.eco_power.account_closed',
  // 算力变动
  POWER_GRANTED: 'fjn.eco_power.power_granted',
  POWER_CONSUMED: 'fjn.eco_power.power_consumed',
  POWER_EXPIRED: 'fjn.eco_power.power_expired',
  POWER_ADJUSTED: 'fjn.eco_power.power_adjusted',
  POWER_TRANSFERRED_IN: 'fjn.eco_power.power_transferred_in',
  POWER_TRANSFERRED_OUT: 'fjn.eco_power.power_transferred_out',
  POWER_RELEASED_CONVERTED: 'fjn.eco_power.power_released_converted',
  // 冻结
  POWER_FROZEN: 'fjn.eco_power.power_frozen',
  POWER_UNFROZEN: 'fjn.eco_power.power_unfrozen',
  // 规则变更
  MEMBER_MULTIPLIER_CHANGED: 'fjn.eco_power.member_multiplier_changed',
  ACTIVITY_MULTIPLIER_CHANGED: 'fjn.eco_power.activity_multiplier_changed',
  RISK_COEFFICIENT_CHANGED: 'fjn.eco_power.risk_coefficient_changed',
  // 计算 / 快照
  EFFECTIVE_POWER_RECALCULATED: 'fjn.eco_power.effective_power_recalculated',
  SNAPSHOT_CREATED: 'fjn.eco_power.snapshot_created',
  // 释放计算
  RELEASE_CALCULATION_READY: 'fjn.eco_power.release_calculation_ready',
} as const;
export type FjnEcoPowerEvent = (typeof ECO_POWER_EVENTS)[keyof typeof ECO_POWER_EVENTS];

export const ECO_POWER_EVENT_SOURCES = {
  ECO_POWER_SERVICE: 'fjn.eco_power.service',
  ECO_POWER_API: 'fjn.eco_power.api',
  ECO_POWER_ADMIN: 'fjn.eco_power.admin',
  ECO_POWER_WORKER: 'fjn.eco_power.worker',
  RELEASE_SERVICE: 'fjn.eco_power.release_service',
  RISK_SERVICE: 'fjn.eco_power.risk_service',
  ORDER_SERVICE: 'fjn.eco_power.order_service',
} as const;
export type FjnEcoPowerEventSource =
  (typeof ECO_POWER_EVENT_SOURCES)[keyof typeof ECO_POWER_EVENT_SOURCES];

export const ALL_ECO_POWER_EVENTS: FjnEcoPowerEvent[] = Object.values(ECO_POWER_EVENTS);
export const ECO_POWER_EVENT_COUNT = ALL_ECO_POWER_EVENTS.length;

export const isValidEcoPowerEvent = (e: string): e is FjnEcoPowerEvent =>
  Object.values(ECO_POWER_EVENTS).includes(e as any);

export const isValidEcoPowerEventSource = (s: string): s is FjnEcoPowerEventSource =>
  Object.values(ECO_POWER_EVENT_SOURCES).includes(s as any);

/** Payload 类型 */
export interface AccountCreatedPayload {
  accountId: string;
  userId: string;
  totalPower: string;
  effectivePower: string;
  createdAt: string;
}

export interface AccountStatusChangedPayload {
  accountId: string;
  userId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface AccountClosedPayload {
  accountId: string;
  userId: string;
  reason: string;
  closedAt: string;
  operatorId?: string | null;
}

export interface PowerGrantedPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  sourceType?: string;
  sourceId?: string;
  ruleCode?: string;
  expiresAt?: string;
  operatorId?: string | null;
  grantedAt: string;
}

export interface PowerConsumedPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  sourceType?: string;
  sourceId?: string;
  consumedAt: string;
}

export interface PowerExpiredPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  expiredAt: string;
  reason: string;
}

export interface PowerAdjustedPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  direction: 'add' | 'subtract';
  reason: string;
  balanceBefore: string;
  balanceAfter: string;
  operatorId?: string | null;
  adjustedAt: string;
}

export interface PowerTransferredInPayload {
  accountId: string;
  userId: string;
  fromUserId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transferredAt: string;
}

export interface PowerTransferredOutPayload {
  accountId: string;
  userId: string;
  toUserId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transferredAt: string;
}

export interface PowerReleasedConvertedPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  releasePoolId: string;
  releaseClaimId: string;
  convertedAt: string;
}

export interface PowerFrozenPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  reason: string;
  reviewDeadline: string;
  operatorId?: string | null;
  frozenAt: string;
}

export interface PowerUnfrozenPayload {
  accountId: string;
  userId: string;
  ledgerId: string;
  ledgerNo: string;
  powerType: string;
  amount: string;
  reason: string;
  operatorId?: string | null;
  unfrozenAt: string;
}

export interface MemberMultiplierChangedPayload {
  accountId: string;
  userId: string;
  fromMultiplier: string;
  toMultiplier: string;
  reason: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface ActivityMultiplierChangedPayload {
  accountId: string;
  userId: string;
  fromMultiplier: string;
  toMultiplier: string;
  reason: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface RiskCoefficientChangedPayload {
  accountId: string;
  userId: string;
  fromCoefficient: string;
  toCoefficient: string;
  reason: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface EffectivePowerRecalculatedPayload {
  accountId: string;
  userId: string;
  totalPower: string;
  memberMultiplier: string;
  activityMultiplier: string;
  riskCoefficient: string;
  effectivePower: string;
  recalculatedAt: string;
}

export interface SnapshotCreatedPayload {
  snapshotId: string;
  snapshotNo: string;
  accountId: string;
  userId: string;
  snapshotType: string;
  totalPower: string;
  effectivePower: string;
  networkTotalPower?: string;
  powerRatio?: string;
  createdAt: string;
}

export interface ReleaseCalculationReadyPayload {
  accountId: string;
  userId: string;
  snapshotId: string;
  effectivePower: string;
  networkTotalPower: string;
  powerRatio: string;
  readyAt: string;
}

export type EcoPowerEventPayload =
  | AccountCreatedPayload
  | AccountStatusChangedPayload
  | AccountClosedPayload
  | PowerGrantedPayload
  | PowerConsumedPayload
  | PowerExpiredPayload
  | PowerAdjustedPayload
  | PowerTransferredInPayload
  | PowerTransferredOutPayload
  | PowerReleasedConvertedPayload
  | PowerFrozenPayload
  | PowerUnfrozenPayload
  | MemberMultiplierChangedPayload
  | ActivityMultiplierChangedPayload
  | RiskCoefficientChangedPayload
  | EffectivePowerRecalculatedPayload
  | SnapshotCreatedPayload
  | ReleaseCalculationReadyPayload;
