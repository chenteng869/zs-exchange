/**
 * Product Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3
 */

import { FjnError, FjnErrorContext } from '../errors';

export const PRODUCT_ERROR_CODES = {
  // 基础
  PRODUCT_NOT_FOUND: 'FJN_PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS: 'FJN_PRODUCT_ALREADY_EXISTS',
  PRODUCT_DELETED: 'FJN_PRODUCT_DELETED',
  PRODUCT_ARCHIVED: 'FJN_PRODUCT_ARCHIVED',
  // 字段
  PRODUCT_TYPE_INVALID: 'FJN_PRODUCT_TYPE_INVALID',
  PRODUCT_TYPE_REQUIRED: 'FJN_PRODUCT_TYPE_REQUIRED',
  PRODUCT_NAME_REQUIRED: 'FJN_PRODUCT_NAME_REQUIRED',
  PRODUCT_NAME_TOO_LONG: 'FJN_PRODUCT_NAME_TOO_LONG',
  PRODUCT_SUBTITLE_TOO_LONG: 'FJN_PRODUCT_SUBTITLE_TOO_LONG',
  PRODUCT_DESCRIPTION_TOO_LONG: 'FJN_PRODUCT_DESCRIPTION_TOO_LONG',
  PRODUCT_PRICE_REQUIRED: 'FJN_PRODUCT_PRICE_REQUIRED',
  PRODUCT_PRICE_INVALID: 'FJN_PRODUCT_PRICE_INVALID',
  PRODUCT_PRICE_OUT_OF_RANGE: 'FJN_PRODUCT_PRICE_OUT_OF_RANGE',
  PRODUCT_CURRENCY_INVALID: 'FJN_PRODUCT_CURRENCY_INVALID',
  PRODUCT_TAX_MODE_INVALID: 'FJN_PRODUCT_TAX_MODE_INVALID',
  // 状态
  PRODUCT_STATUS_INVALID: 'FJN_PRODUCT_STATUS_INVALID',
  PRODUCT_STATUS_TRANSITION_FORBIDDEN: 'FJN_PRODUCT_STATUS_TRANSITION_FORBIDDEN',
  PRODUCT_NOT_PURCHASABLE: 'FJN_PRODUCT_NOT_PURCHASABLE',
  PRODUCT_ALREADY_ACTIVE: 'FJN_PRODUCT_ALREADY_ACTIVE',
  PRODUCT_ALREADY_ARCHIVED: 'FJN_PRODUCT_ALREADY_ARCHIVED',
  // 库存
  PRODUCT_STOCK_INVALID: 'FJN_PRODUCT_STOCK_INVALID',
  PRODUCT_STOCK_INSUFFICIENT: 'FJN_PRODUCT_STOCK_INSUFFICIENT',
  PRODUCT_STOCK_CHANGE_TYPE_INVALID: 'FJN_PRODUCT_STOCK_CHANGE_TYPE_INVALID',
  // 上下架
  PRODUCT_ACTIVE_DELETE_FORBIDDEN: 'FJN_PRODUCT_ACTIVE_DELETE_FORBIDDEN',
  // 销售时间
  PRODUCT_SALE_WINDOW_INVALID: 'FJN_PRODUCT_SALE_WINDOW_INVALID',
  PRODUCT_NOT_IN_SALE_WINDOW: 'FJN_PRODUCT_NOT_IN_SALE_WINDOW',
  // 地区规则
  PRODUCT_REGION_RULE_CONFLICT: 'FJN_PRODUCT_REGION_RULE_CONFLICT',
  PRODUCT_REGION_RULE_LIMIT_EXCEEDED: 'FJN_PRODUCT_REGION_RULE_LIMIT_EXCEEDED',
  PRODUCT_REGION_RULE_NOT_FOUND: 'FJN_PRODUCT_REGION_RULE_NOT_FOUND',
  // 权益
  PRODUCT_BENEFIT_NOT_FOUND: 'FJN_PRODUCT_BENEFIT_NOT_FOUND',
  PRODUCT_BENEFIT_LIMIT_EXCEEDED: 'FJN_PRODUCT_BENEFIT_LIMIT_EXCEEDED',
  PRODUCT_BENEFIT_TYPE_INVALID: 'FJN_PRODUCT_BENEFIT_TYPE_INVALID',
  PRODUCT_BENEFIT_AMOUNT_INVALID: 'FJN_PRODUCT_BENEFIT_AMOUNT_INVALID',
  // 规则绑定
  PRODUCT_RULE_BINDING_NOT_FOUND: 'FJN_PRODUCT_RULE_BINDING_NOT_FOUND',
  PRODUCT_RULE_BINDING_INVALID: 'FJN_PRODUCT_RULE_BINDING_INVALID',
  // 审核
  PRODUCT_REVIEW_REQUIRED: 'FJN_PRODUCT_REVIEW_REQUIRED',
  PRODUCT_REVIEW_REASON_REQUIRED: 'FJN_PRODUCT_REVIEW_REASON_REQUIRED',
  // 媒体
  PRODUCT_GALLERY_LIMIT_EXCEEDED: 'FJN_PRODUCT_GALLERY_LIMIT_EXCEEDED',
  PRODUCT_IMAGE_URL_INVALID: 'FJN_PRODUCT_IMAGE_URL_INVALID',
} as const;
export type FjnProductErrorCode =
  (typeof PRODUCT_ERROR_CODES)[keyof typeof PRODUCT_ERROR_CODES];

export const isFjnProductErrorCode = (c: string): c is FjnProductErrorCode =>
  Object.values(PRODUCT_ERROR_CODES).includes(c as any);

export const getProductErrorCodeCount = (): number => Object.keys(PRODUCT_ERROR_CODES).length;

/** Product 业务异常基类 */
export class FjnProductError extends FjnError {
  constructor(params: {
    code: FjnProductErrorCode;
    message: string;
    context?: FjnErrorContext;
    cause?: unknown;
  }) {
    super({
      code: params.code as unknown as FjnError['code'],
      message: params.message,
      context: params.context,
      cause: params.cause,
    });
    this.name = 'FjnProductError';
  }
}

export class ProductNotFoundError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_NOT_FOUND,
      message: 'Product not found',
      context: ctx,
    });
    this.name = 'ProductNotFoundError';
  }
}
export class ProductAlreadyExistsError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_ALREADY_EXISTS,
      message: 'Product already exists',
      context: ctx,
    });
    this.name = 'ProductAlreadyExistsError';
  }
}
export class ProductDeletedError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_DELETED,
      message: 'Product has been deleted',
      context: ctx,
    });
    this.name = 'ProductDeletedError';
  }
}
export class ProductArchivedError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_ARCHIVED,
      message: 'Product has been archived',
      context: ctx,
    });
    this.name = 'ProductArchivedError';
  }
}

export class ProductTypeInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_TYPE_INVALID,
      message: 'Product type invalid',
      context: ctx,
    });
    this.name = 'ProductTypeInvalidError';
  }
}
export class ProductTypeRequiredError extends FjnProductError {
  constructor() {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_TYPE_REQUIRED,
      message: 'Product type is required',
    });
    this.name = 'ProductTypeRequiredError';
  }
}
export class ProductNameRequiredError extends FjnProductError {
  constructor() {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_NAME_REQUIRED,
      message: 'Product name is required',
    });
    this.name = 'ProductNameRequiredError';
  }
}
export class ProductNameTooLongError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_NAME_TOO_LONG,
      message: 'Product name too long',
      context: ctx,
    });
    this.name = 'ProductNameTooLongError';
  }
}
export class ProductSubtitleTooLongError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_SUBTITLE_TOO_LONG,
      message: 'Product subtitle too long',
      context: ctx,
    });
    this.name = 'ProductSubtitleTooLongError';
  }
}
export class ProductDescriptionTooLongError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_DESCRIPTION_TOO_LONG,
      message: 'Product description too long',
      context: ctx,
    });
    this.name = 'ProductDescriptionTooLongError';
  }
}
export class ProductPriceRequiredError extends FjnProductError {
  constructor() {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_PRICE_REQUIRED,
      message: 'Product price is required',
    });
    this.name = 'ProductPriceRequiredError';
  }
}
export class ProductPriceInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_PRICE_INVALID,
      message: 'Product price invalid',
      context: ctx,
    });
    this.name = 'ProductPriceInvalidError';
  }
}
export class ProductPriceOutOfRangeError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_PRICE_OUT_OF_RANGE,
      message: 'Product price out of range',
      context: ctx,
    });
    this.name = 'ProductPriceOutOfRangeError';
  }
}
export class ProductCurrencyInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_CURRENCY_INVALID,
      message: 'Currency invalid',
      context: ctx,
    });
    this.name = 'ProductCurrencyInvalidError';
  }
}
export class ProductTaxModeInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_TAX_MODE_INVALID,
      message: 'Tax mode invalid',
      context: ctx,
    });
    this.name = 'ProductTaxModeInvalidError';
  }
}

export class ProductStatusInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_STATUS_INVALID,
      message: 'Product status invalid',
      context: ctx,
    });
    this.name = 'ProductStatusInvalidError';
  }
}
export class ProductStatusTransitionForbiddenError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_STATUS_TRANSITION_FORBIDDEN,
      message: 'Product status transition forbidden',
      context: ctx,
    });
    this.name = 'ProductStatusTransitionForbiddenError';
  }
}
export class ProductNotPurchasableError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_NOT_PURCHASABLE,
      message: 'Product not purchasable in current status',
      context: ctx,
    });
    this.name = 'ProductNotPurchasableError';
  }
}
export class ProductAlreadyActiveError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_ALREADY_ACTIVE,
      message: 'Product is already active',
      context: ctx,
    });
    this.name = 'ProductAlreadyActiveError';
  }
}
export class ProductAlreadyArchivedError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_ALREADY_ARCHIVED,
      message: 'Product is already archived',
      context: ctx,
    });
    this.name = 'ProductAlreadyArchivedError';
  }
}

export class ProductStockInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_STOCK_INVALID,
      message: 'Product stock value invalid',
      context: ctx,
    });
    this.name = 'ProductStockInvalidError';
  }
}
export class ProductStockInsufficientError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_STOCK_INSUFFICIENT,
      message: 'Product stock insufficient',
      context: ctx,
    });
    this.name = 'ProductStockInsufficientError';
  }
}
export class ProductStockChangeTypeInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_STOCK_CHANGE_TYPE_INVALID,
      message: 'Stock change type invalid',
      context: ctx,
    });
    this.name = 'ProductStockChangeTypeInvalidError';
  }
}

export class ProductActiveDeleteForbiddenError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_ACTIVE_DELETE_FORBIDDEN,
      message: 'Active product cannot be deleted; please delist first',
      context: ctx,
    });
    this.name = 'ProductActiveDeleteForbiddenError';
  }
}

export class ProductSaleWindowInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_SALE_WINDOW_INVALID,
      message: 'Sale window invalid',
      context: ctx,
    });
    this.name = 'ProductSaleWindowInvalidError';
  }
}
export class ProductNotInSaleWindowError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_NOT_IN_SALE_WINDOW,
      message: 'Product is not in sale window',
      context: ctx,
    });
    this.name = 'ProductNotInSaleWindowError';
  }
}

export class ProductRegionRuleConflictError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_REGION_RULE_CONFLICT,
      message: 'Region rule conflicts with existing rule',
      context: ctx,
    });
    this.name = 'ProductRegionRuleConflictError';
  }
}
export class ProductRegionRuleLimitExceededError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_REGION_RULE_LIMIT_EXCEEDED,
      message: 'Region rule limit exceeded',
      context: ctx,
    });
    this.name = 'ProductRegionRuleLimitExceededError';
  }
}
export class ProductRegionRuleNotFoundError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_REGION_RULE_NOT_FOUND,
      message: 'Region rule not found',
      context: ctx,
    });
    this.name = 'ProductRegionRuleNotFoundError';
  }
}

export class ProductBenefitNotFoundError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_BENEFIT_NOT_FOUND,
      message: 'Benefit not found',
      context: ctx,
    });
    this.name = 'ProductBenefitNotFoundError';
  }
}
export class ProductBenefitLimitExceededError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_BENEFIT_LIMIT_EXCEEDED,
      message: 'Benefit limit exceeded',
      context: ctx,
    });
    this.name = 'ProductBenefitLimitExceededError';
  }
}
export class ProductBenefitTypeInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_BENEFIT_TYPE_INVALID,
      message: 'Benefit type invalid',
      context: ctx,
    });
    this.name = 'ProductBenefitTypeInvalidError';
  }
}
export class ProductBenefitAmountInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_BENEFIT_AMOUNT_INVALID,
      message: 'Benefit amount invalid',
      context: ctx,
    });
    this.name = 'ProductBenefitAmountInvalidError';
  }
}

export class ProductRuleBindingNotFoundError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_RULE_BINDING_NOT_FOUND,
      message: 'Rule binding not found',
      context: ctx,
    });
    this.name = 'ProductRuleBindingNotFoundError';
  }
}
export class ProductRuleBindingInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_RULE_BINDING_INVALID,
      message: 'Rule binding invalid',
      context: ctx,
    });
    this.name = 'ProductRuleBindingInvalidError';
  }
}

export class ProductReviewRequiredError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_REVIEW_REQUIRED,
      message: 'Product review required',
      context: ctx,
    });
    this.name = 'ProductReviewRequiredError';
  }
}
export class ProductReviewReasonRequiredError extends FjnProductError {
  constructor() {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_REVIEW_REASON_REQUIRED,
      message: 'Review reason is required',
    });
    this.name = 'ProductReviewReasonRequiredError';
  }
}

export class ProductGalleryLimitExceededError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_GALLERY_LIMIT_EXCEEDED,
      message: 'Gallery limit exceeded',
      context: ctx,
    });
    this.name = 'ProductGalleryLimitExceededError';
  }
}
export class ProductImageUrlInvalidError extends FjnProductError {
  constructor(ctx?: FjnErrorContext) {
    super({
      code: PRODUCT_ERROR_CODES.PRODUCT_IMAGE_URL_INVALID,
      message: 'Image URL invalid',
      context: ctx,
    });
    this.name = 'ProductImageUrlInvalidError';
  }
}
