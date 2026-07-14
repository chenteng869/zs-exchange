/**
 * Product Service - 事件定义
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3
 *
 * 全部事件通过 outbox 模式写入 `outboxEvent` 表
 * 事件命名空间：`fjn.product.*`
 */

export const PRODUCT_EVENTS = {
  // 生命周期
  PRODUCT_CREATED: 'fjn.product.created',
  PRODUCT_UPDATED: 'fjn.product.updated',
  PRODUCT_VERSION_CREATED: 'fjn.product.version_created',
  PRODUCT_STATUS_CHANGED: 'fjn.product.status_changed',
  PRODUCT_DELETED: 'fjn.product.deleted',
  PRODUCT_ARCHIVED: 'fjn.product.archived',
  // 库存
  STOCK_ADJUSTED: 'fjn.product.stock_adjusted',
  STOCK_DEPLETED: 'fjn.product.stock_depleted',
  STOCK_RESTORED: 'fjn.product.stock_restored',
  // 上下架
  PRODUCT_LISTED: 'fjn.product.listed',
  PRODUCT_DELISTED: 'fjn.product.delisted',
  PRODUCT_PAUSED: 'fjn.product.paused',
  PRODUCT_RESUMED: 'fjn.product.resumed',
  PRODUCT_SOLD_OUT: 'fjn.product.sold_out',
  // 审核
  PRODUCT_SUBMITTED_FOR_REVIEW: 'fjn.product.submitted_for_review',
  PRODUCT_APPROVED: 'fjn.product.approved',
  PRODUCT_REJECTED: 'fjn.product.rejected',
  // 权益 / 规则
  BENEFIT_ADDED: 'fjn.product.benefit_added',
  BENEFIT_REMOVED: 'fjn.product.benefit_removed',
  REGION_RULE_ADDED: 'fjn.product.region_rule_added',
  REGION_RULE_REMOVED: 'fjn.product.region_rule_removed',
  RULE_BINDING_ADDED: 'fjn.product.rule_binding_added',
  RULE_BINDING_REMOVED: 'fjn.product.rule_binding_removed',
} as const;
export type FjnProductEvent = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

export const PRODUCT_EVENT_SOURCES = {
  PRODUCT_SERVICE: 'fjn.product.service',
  PRODUCT_API: 'fjn.product.api',
  PRODUCT_ADMIN: 'fjn.product.admin',
  PRODUCT_WORKER: 'fjn.product.worker',
} as const;
export type FjnProductEventSource =
  (typeof PRODUCT_EVENT_SOURCES)[keyof typeof PRODUCT_EVENT_SOURCES];

export const ALL_PRODUCT_EVENTS: FjnProductEvent[] = Object.values(PRODUCT_EVENTS);
export const PRODUCT_EVENT_COUNT = ALL_PRODUCT_EVENTS.length;

export const isValidProductEvent = (e: string): e is FjnProductEvent =>
  Object.values(PRODUCT_EVENTS).includes(e as any);

export const isValidProductEventSource = (s: string): s is FjnProductEventSource =>
  Object.values(PRODUCT_EVENT_SOURCES).includes(s as any);

/** Payload 类型 */
export interface ProductCreatedPayload {
  productId: string;
  productNo: string;
  productType: string;
  name: string;
  price: string;
  currency: string;
  stock: number;
  status: string;
  operatorId?: string | null;
  createdAt: string;
}

export interface ProductUpdatedPayload {
  productId: string;
  productNo: string;
  changedFields: string[];
  newVersionNo: string;
  operatorId?: string | null;
  updatedAt: string;
}

export interface ProductVersionCreatedPayload {
  productId: string;
  productNo: string;
  versionNo: string;
  changeReason: string;
  operatorId?: string | null;
  createdAt: string;
}

export interface ProductStatusChangedPayload {
  productId: string;
  productNo: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  operatorId?: string | null;
  changedAt: string;
}

export interface ProductDeletedPayload {
  productId: string;
  productNo: string;
  operatorId?: string | null;
  deletedAt: string;
}

export interface ProductArchivedPayload {
  productId: string;
  productNo: string;
  reason?: string;
  operatorId?: string | null;
  archivedAt: string;
}

export interface StockAdjustedPayload {
  productId: string;
  productNo: string;
  changeType: string;
  delta: number;
  beforeStock: number;
  afterStock: number;
  note?: string;
  operatorId?: string | null;
  adjustedAt: string;
}

export interface StockDepletedPayload {
  productId: string;
  productNo: string;
  finalStock: number;
  depletedAt: string;
}

export interface StockRestoredPayload {
  productId: string;
  productNo: string;
  newStock: number;
  restoredAt: string;
}

export interface ProductListedPayload {
  productId: string;
  productNo: string;
  listedAt: string;
  operatorId?: string | null;
}

export interface ProductDelistedPayload {
  productId: string;
  productNo: string;
  delistedAt: string;
  reason?: string;
  operatorId?: string | null;
}

export interface ProductPausedPayload {
  productId: string;
  productNo: string;
  pausedAt: string;
  reason?: string;
  operatorId?: string | null;
}

export interface ProductResumedPayload {
  productId: string;
  productNo: string;
  resumedAt: string;
  operatorId?: string | null;
}

export interface ProductSoldOutPayload {
  productId: string;
  productNo: string;
  soldOutAt: string;
  operatorId?: string | null;
}

export interface ProductSubmittedForReviewPayload {
  productId: string;
  productNo: string;
  submittedAt: string;
  operatorId?: string | null;
}

export interface ProductApprovedPayload {
  productId: string;
  productNo: string;
  approvedBy: string;
  approvedAt: string;
}

export interface ProductRejectedPayload {
  productId: string;
  productNo: string;
  reason: string;
  rejectedAt: string;
  operatorId?: string | null;
}

export interface BenefitAddedPayload {
  productId: string;
  productNo: string;
  benefitId: string;
  benefitType: string;
  amount: string;
  operatorId?: string | null;
  addedAt: string;
}

export interface BenefitRemovedPayload {
  productId: string;
  productNo: string;
  benefitId: string;
  reason?: string;
  operatorId?: string | null;
  removedAt: string;
}

export interface RegionRuleAddedPayload {
  productId: string;
  productNo: string;
  regionCode: string;
  ruleType: string;
  operatorId?: string | null;
  addedAt: string;
}

export interface RegionRuleRemovedPayload {
  productId: string;
  productNo: string;
  regionCode: string;
  reason?: string;
  operatorId?: string | null;
  removedAt: string;
}

export interface RuleBindingAddedPayload {
  productId: string;
  productNo: string;
  ruleType: string;
  ruleCode: string;
  operatorId?: string | null;
  addedAt: string;
}

export interface RuleBindingRemovedPayload {
  productId: string;
  productNo: string;
  ruleType: string;
  ruleCode: string;
  reason?: string;
  operatorId?: string | null;
  removedAt: string;
}

export type ProductEventPayload =
  | ProductCreatedPayload
  | ProductUpdatedPayload
  | ProductVersionCreatedPayload
  | ProductStatusChangedPayload
  | ProductDeletedPayload
  | ProductArchivedPayload
  | StockAdjustedPayload
  | StockDepletedPayload
  | StockRestoredPayload
  | ProductListedPayload
  | ProductDelistedPayload
  | ProductPausedPayload
  | ProductResumedPayload
  | ProductSoldOutPayload
  | ProductSubmittedForReviewPayload
  | ProductApprovedPayload
  | ProductRejectedPayload
  | BenefitAddedPayload
  | BenefitRemovedPayload
  | RegionRuleAddedPayload
  | RegionRuleRemovedPayload
  | RuleBindingAddedPayload
  | RuleBindingRemovedPayload;
