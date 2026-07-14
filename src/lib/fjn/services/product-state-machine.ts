/**
 * Product Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.3
 *
 * 职责范围：
 *  - 福建老酒 369 商品
 *  - AEP 算力包
 *  - 商品权益配置（fjnProductBenefit）
 *  - 商品版本（fjnProductVersion）
 *  - 商品上下架（状态机）
 *  - 商品地区规则（fjnProductRegionRule）
 *  - 商品库存（fjnProductInventoryLog）
 *  - 商品规则绑定（fjnProductRuleBinding）
 */

import {
  FJN_PRODUCT_STATUS,
  FJN_PRODUCT_TYPES,
  FJN_REGION_STATUS,
  type FjnProductStatus,
  type FjnProductType,
  type FjnRegionStatus,
} from '../constants';

export { FJN_PRODUCT_STATUS as PRODUCT_STATUS, type FjnProductStatus } from '../constants';
export { FJN_PRODUCT_TYPES as PRODUCT_TYPES, type FjnProductType } from '../constants';
export { FJN_REGION_STATUS as PRODUCT_REGION_RULE_TYPE, type FjnRegionStatus } from '../constants';

/** 库存变更类型 */
export const STOCK_CHANGE_TYPE = {
  RESTOCK: 'restock',
  SALE: 'sale',
  RETURN: 'return',
  MANUAL_ADJUST: 'manual_adjust',
  RESERVE: 'reserve',
  RELEASE: 'release',
} as const;
export type FjnStockChangeType = (typeof STOCK_CHANGE_TYPE)[keyof typeof STOCK_CHANGE_TYPE];

/** 商品状态机 */
export const PRODUCT_STATUS_TRANSITIONS: Record<FjnProductStatus, FjnProductStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['approved', 'draft'],
  approved: ['active', 'inactive'],
  active: ['paused', 'sold_out', 'inactive'],
  paused: ['active', 'inactive'],
  sold_out: ['active', 'inactive'],
  inactive: ['active', 'archived'],
  archived: [],
};

/** 校验器 */
export const isValidProductStatus = (s: string): s is FjnProductStatus =>
  Object.values(FJN_PRODUCT_STATUS).includes(s as any);
export const isValidProductType = (t: string): t is FjnProductType =>
  Object.values(FJN_PRODUCT_TYPES).includes(t as any);
export const isValidStockChangeType = (t: string): t is FjnStockChangeType =>
  Object.values(STOCK_CHANGE_TYPE).includes(t as any);

/** 状态流转 */
export const canTransitProductStatus = (
  from: FjnProductStatus,
  to: FjnProductStatus,
): boolean => (PRODUCT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitProductStatus = (
  from: FjnProductStatus,
  to: FjnProductStatus,
): void => {
  if (!canTransitProductStatus(from, to)) {
    throw new Error(`[Product] Illegal status transition: ${from} -> ${to}`);
  }
};

/** 终态判定 */
export const isTerminalProductStatus = (s: FjnProductStatus): boolean =>
  s === 'archived';

/** 可售状态 */
export const isPurchasable = (s: FjnProductStatus): boolean => s === 'active';

/** 上架状态 */
export const isOnShelf = (s: FjnProductStatus): boolean =>
  s === 'active' || s === 'paused' || s === 'sold_out';

/** 默认值 */
export const PRODUCT_DEFAULT_CURRENCY = 'USD';
export const PRODUCT_DEFAULT_TAX_MODE = 'exclusive' as const;
export const PRODUCT_DEFAULT_STOCK = 0;
export const PRODUCT_MAX_PRICE = '99999999';
export const PRODUCT_MIN_PRICE = '0.01';
export const PRODUCT_NAME_MAX_LENGTH = 200;
export const PRODUCT_SUBTITLE_MAX_LENGTH = 500;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 5000;
export const PRODUCT_GALLERY_MAX_COUNT = 20;
export const PRODUCT_BENEFIT_MAX_COUNT = 50;
export const PRODUCT_REGION_RULE_MAX_COUNT = 200;
export const PRODUCT_STOCK_MIN = 0;
export const PRODUCT_STOCK_MAX = 999999;
export const PRODUCT_REVIEW_REQUIRED_FOR_ACTIVE = true;

/** 校验器：商品价格 */
export const isValidProductPrice = (price: string): boolean => {
  if (!price) return false;
  const num = Number(price);
  if (isNaN(num) || num <= 0) return false;
  return num <= Number(PRODUCT_MAX_PRICE);
};

/** 校验器：商品库存 */
export const isValidProductStock = (stock: number): boolean =>
  Number.isInteger(stock) && stock >= PRODUCT_STOCK_MIN && stock <= PRODUCT_STOCK_MAX;

/** 校验器：销售时间窗口 */
export const isValidSaleWindow = (
  startTime?: Date,
  endTime?: Date,
): { valid: boolean; reason?: string } => {
  if (!startTime && !endTime) return { valid: true };
  if (startTime && endTime && startTime.getTime() >= endTime.getTime()) {
    return { valid: false, reason: 'saleStartTime must be before saleEndTime' };
  }
  return { valid: true };
};
