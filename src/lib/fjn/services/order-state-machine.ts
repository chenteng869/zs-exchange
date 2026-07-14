/**
 * FJN Order Service - 状态机
 *
 * 严格遵循 H020 规范：
 *  - 订单状态转移基于白名单，禁止隐式跳转
 *  - 任何状态变更必须产生 OrderStatusLog
 *  - 风控状态独立于订单主状态，由 riskStatus 字段承载
 *  - 支付状态独立于订单主状态，由 paymentStatus 字段承载
 *
 * 完整状态机（与 H020 §7 一致）：
 *
 *  created → pending_payment | cancelled
 *  pending_payment → payment_processing | paid | cancelled | failed
 *  payment_processing → paid | failed | cancelled
 *  paid → risk_checking | confirmed | refund_requested | risk_hold
 *  risk_checking → confirmed | risk_hold | cancelled
 *  confirmed → fulfilling | refund_requested | risk_hold
 *  fulfilling → fulfilled | risk_hold
 *  fulfilled → completed | refund_requested
 *  completed → refund_requested
 *  refund_requested → refund_reviewing | cancelled
 *  refund_reviewing → refunded | partial_refunded | confirmed
 *  partial_refunded → completed
 *  refunded → (终态)
 *  cancelled → (终态)
 *  risk_hold → confirmed | cancelled | refund_requested
 *  failed → (终态)
 *
 * 工业级补强（H5 规范）：
 *  - 增加 expired 状态：pending_payment 超时后流转至 expired
 *  - 增加 processing 状态：paid 后业务处理窗口
 *  - 提供 canTransit / assertTransit / nextStates 三个工具
 */

import { FjnStateMachineError } from '../errors';

// ============================================================
// 状态常量
// ============================================================

/** 订单主状态 */
export const ORDER_STATUS = {
  CREATED: 'created',                       // 已创建
  PENDING_PAYMENT: 'pending_payment',       // 待支付
  PAYMENT_PROCESSING: 'payment_processing', // 支付处理中
  PAID: 'paid',                             // 已支付
  RISK_CHECKING: 'risk_checking',           // 风控校验中
  CONFIRMED: 'confirmed',                   // 已确认
  PROCESSING: 'processing',                 // 业务处理中
  FULFILLING: 'fulfilling',                 // 履约中
  FULFILLED: 'fulfilled',                   // 已履约
  COMPLETED: 'completed',                   // 已完成
  REFUND_REQUESTED: 'refund_requested',     // 退款申请
  REFUND_REVIEWING: 'refund_reviewing',     // 退款审核
  PARTIAL_REFUNDED: 'partial_refunded',     // 部分退款
  REFUNDED: 'refunded',                     // 已退款
  CANCELLED: 'cancelled',                   // 已取消
  RISK_HOLD: 'risk_hold',                   // 风控冻结
  FAILED: 'failed',                         // 失败
  EXPIRED: 'expired',                       // 已过期
} as const;

export type FjnOrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** 支付状态 */
export const ORDER_PAYMENT_STATUS = {
  UNPAID: 'unpaid',             // 未支付
  PENDING: 'pending',           // 待支付
  PROCESSING: 'processing',     // 处理中
  SUCCESS: 'success',           // 支付成功
  FAILED: 'failed',             // 支付失败
  EXPIRED: 'expired',           // 已过期
} as const;

export type FjnOrderPaymentStatus = (typeof ORDER_PAYMENT_STATUS)[keyof typeof ORDER_PAYMENT_STATUS];

/** 退款状态 */
export const ORDER_REFUND_STATUS = {
  NONE: 'none',                       // 无退款
  REQUESTED: 'requested',             // 已申请
  REVIEWING: 'reviewing',             // 审核中
  PARTIAL_REFUNDED: 'partial_refunded', // 部分退款
  REFUNDED: 'refunded',               // 已退款
  REJECTED: 'rejected',               // 已拒绝
} as const;

export type FjnOrderRefundStatus = (typeof ORDER_REFUND_STATUS)[keyof typeof ORDER_REFUND_STATUS];

/** 风控状态 */
export const ORDER_RISK_STATUS = {
  NORMAL: 'normal',         // 正常
  CHECKING: 'checking',     // 检查中
  HOLD: 'hold',             // 冻结
  CLEARED: 'cleared',       // 已解除
  REJECTED: 'rejected',     // 已拒绝
} as const;

export type FjnOrderRiskStatus = (typeof ORDER_RISK_STATUS)[keyof typeof ORDER_RISK_STATUS];

/** 订单类型 */
export const ORDER_TYPES = {
  WINE_ORDER: 'wine_order',                 // 福建老酒订单
  AEP_ORDER: 'aep_order',                   // 算力包订单
  MALL_ORDER: 'mall_order',                 // 商城订单
  NFT_UPGRADE: 'nft_upgrade',               // NFT 升级订单
  AI_SERVICE: 'ai_service',                 // AI 服务订单
  VIRTUAL_POINTS: 'virtual_points',         // 虚拟积分订单
  CORPORATE_SERVICE: 'corporate_service',   // 企业服务订单
  EVENT_TICKET: 'event_ticket',             // 活动门票订单
} as const;

export type FjnOrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

// ============================================================
// 状态流转表
// ============================================================

/** 订单状态合法转移表（H020 §7 + 工业级补强） */
export const ORDER_STATUS_TRANSITIONS: Record<FjnOrderStatus, readonly FjnOrderStatus[]> = {
  // 初始
  [ORDER_STATUS.CREATED]:              [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED],
  // 待支付
  [ORDER_STATUS.PENDING_PAYMENT]:       [ORDER_STATUS.PAYMENT_PROCESSING, ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED, ORDER_STATUS.FAILED, ORDER_STATUS.EXPIRED],
  // 支付处理中
  [ORDER_STATUS.PAYMENT_PROCESSING]:    [ORDER_STATUS.PAID, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED],
  // 已支付
  [ORDER_STATUS.PAID]:                  [ORDER_STATUS.RISK_CHECKING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.REFUND_REQUESTED, ORDER_STATUS.RISK_HOLD],
  // 风控检查
  [ORDER_STATUS.RISK_CHECKING]:         [ORDER_STATUS.CONFIRMED, ORDER_STATUS.RISK_HOLD, ORDER_STATUS.CANCELLED],
  // 已确认
  [ORDER_STATUS.CONFIRMED]:             [ORDER_STATUS.PROCESSING, ORDER_STATUS.FULFILLING, ORDER_STATUS.REFUND_REQUESTED, ORDER_STATUS.RISK_HOLD],
  // 业务处理
  [ORDER_STATUS.PROCESSING]:            [ORDER_STATUS.FULFILLING, ORDER_STATUS.REFUND_REQUESTED, ORDER_STATUS.FAILED],
  // 履约中
  [ORDER_STATUS.FULFILLING]:            [ORDER_STATUS.FULFILLED, ORDER_STATUS.RISK_HOLD],
  // 已履约
  [ORDER_STATUS.FULFILLED]:             [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUND_REQUESTED],
  // 已完成
  [ORDER_STATUS.COMPLETED]:             [ORDER_STATUS.REFUND_REQUESTED],
  // 退款申请
  [ORDER_STATUS.REFUND_REQUESTED]:      [ORDER_STATUS.REFUND_REVIEWING, ORDER_STATUS.CANCELLED],
  // 退款审核
  [ORDER_STATUS.REFUND_REVIEWING]:      [ORDER_STATUS.REFUNDED, ORDER_STATUS.PARTIAL_REFUNDED, ORDER_STATUS.CONFIRMED],
  // 部分退款
  [ORDER_STATUS.PARTIAL_REFUNDED]:      [ORDER_STATUS.COMPLETED],
  // 已退款（终态）
  [ORDER_STATUS.REFUNDED]:              [],
  // 已取消（终态）
  [ORDER_STATUS.CANCELLED]:             [],
  // 风控冻结
  [ORDER_STATUS.RISK_HOLD]:             [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUND_REQUESTED],
  // 失败（终态）
  [ORDER_STATUS.FAILED]:                [],
  // 已过期（终态）
  [ORDER_STATUS.EXPIRED]:               [],
} as const;

// ============================================================
// 状态机工具函数
// ============================================================

/** 状态枚举值数组 */
export const ALL_ORDER_STATUSES: readonly FjnOrderStatus[] = Object.values(ORDER_STATUS);

/** 终态集合 */
export const TERMINAL_ORDER_STATUSES: readonly FjnOrderStatus[] = [
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.EXPIRED,
];

/** 判断是否为终态 */
export function isTerminalOrderStatus(status: FjnOrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/** 判断状态转移是否合法 */
export function canTransitOrderStatus(
  from: FjnOrderStatus,
  to: FjnOrderStatus
): boolean {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** 强制状态转移（非法时抛错） */
export function assertTransitOrderStatus(
  from: FjnOrderStatus,
  to: FjnOrderStatus
): void {
  if (!canTransitOrderStatus(from, to)) {
    throw new FjnStateMachineError(
      `订单状态非法转移: ${from} -> ${to}`,
      {
        from,
        to,
        allowed: ORDER_STATUS_TRANSITIONS[from] ?? [],
      }
    );
  }
}

/** 列出某状态所有合法目标状态 */
export function nextOrderStatuses(from: FjnOrderStatus): readonly FjnOrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[from] ?? [];
}

/** 判断状态是否可被取消（终态不可再被取消） */
export function isCancellable(status: FjnOrderStatus): boolean {
  if (isTerminalOrderStatus(status)) return false;
  return canTransitOrderStatus(status, ORDER_STATUS.CANCELLED);
}

/** 判断状态是否可被支付（终态或已支付状态不可再支付） */
export function isPayable(status: FjnOrderStatus): boolean {
  if (isTerminalOrderStatus(status)) return false;
  if (status === ORDER_STATUS.PAID) return false;
  if (status === ORDER_STATUS.PAYMENT_PROCESSING) return false;
  return canTransitOrderStatus(status, ORDER_STATUS.PAID);
}

/** 判断订单是否已进入履约阶段 */
export function isFulfilling(status: FjnOrderStatus): boolean {
  const fulfillingStatuses: readonly FjnOrderStatus[] = [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.FULFILLING,
    ORDER_STATUS.FULFILLED,
  ];
  return fulfillingStatuses.includes(status);
}
