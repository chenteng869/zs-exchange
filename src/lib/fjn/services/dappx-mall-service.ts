/**
 * DAppX Mall Service - 业务主体（FJN 域内商城，5 表）
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.18
 *
 * 职责范围：
 *  - FjnMerchant         商户（KYB + 状态机 + 平台费）
 *  - FjnMallProduct      商城商品（不含 369 主商品）
 *  - FjnMallOrder        商城订单（链下真相）
 *  - FjnMallCoupon       优惠券
 *  - FjnMallSettlement   商家结算
 *
 * 链上交互：Solana Pay（Payment Intent）做实时结算
 * 链下真相：订单/库存/结算
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import {
  MERCHANT_STATUS,
  MALL_PRODUCT_STATUS,
  MALL_ORDER_STATUS,
  MALL_COUPON_STATUS,
  MALL_SETTLEMENT_STATUS,
  MALL_PAYMENT_METHOD,
  MALL_DELIVERY_STATUS,
  COUPON_TYPE,
  COUPON_USER_SCOPE,
  MERCHANT_CATEGORY,
  MALL_STOCK_CHANGE_TYPE,
  REFUND_REASON,
  MERCHANT_STATUS_TRANSITIONS,
  MALL_PRODUCT_STATUS_TRANSITIONS,
  MALL_ORDER_STATUS_TRANSITIONS,
  MALL_SETTLEMENT_STATUS_TRANSITIONS,
  MALL_DELIVERY_STATUS_TRANSITIONS,
  isValidMerchantStatus,
  isValidMallProductStatus,
  isValidMallOrderStatus,
  isValidMallCouponStatus,
  isValidMallSettlementStatus,
  isValidMallPaymentMethod,
  isValidMallDeliveryStatus,
  isValidCouponType,
  isValidCouponUserScope,
  isValidMerchantCategory,
  isValidMallStockChangeType,
  isValidRefundReason,
  isMerchantOperable,
  isMerchantActive,
  isMallProductPurchasable,
  isOrderCancellable,
  isOrderPayable,
  isOrderCompleted,
  isCouponUsable,
  isSettlementPayable,
  MALL_DEFAULT_CURRENCY,
  MALL_DEFAULT_PLATFORM_FEE_RATE,
  MALL_NAME_MAX_LENGTH,
  MALL_DESCRIPTION_MAX_LENGTH,
  MALL_GALLERY_MAX_COUNT,
  MALL_DEFAULT_QUANTITY,
  MALL_MAX_QUANTITY,
  MALL_DEFAULT_TIMEOUT_MINUTES,
  MALL_DEFAULT_SETTLEMENT_PERIOD,
  isValidMallPrice,
  isValidMallStock,
  isValidPlatformFeeRate,
  isValidCouponAmount,
  isValidQuantity,
  isValidSettlementPeriod,
  type FjnMerchantStatus,
  type FjnMallProductStatus,
  type FjnMallOrderStatus,
  type FjnMallCouponStatus,
  type FjnMallSettlementStatus,
  type FjnMallPaymentMethod,
  type FjnMallDeliveryStatus,
  type FjnCouponType,
  type FjnCouponUserScope,
  type FjnMerchantCategory,
  type FjnMallStockChangeType,
  type FjnRefundReason,
} from './dappx-mall-state-machine';
import {
  DAPPX_MALL_EVENTS,
  DAPPX_MALL_EVENT_SOURCES,
  type FjnDappxMallEventSource,
} from './dappx-mall-events';
import {
  MerchantNotFoundError,
  MerchantAlreadyExistsError,
  MerchantClosedError,
  MerchantNotOperableError,
  MerchantNotActiveError,
  MerchantBlacklistedError,
  MerchantStatusInvalidError,
  MerchantStatusTransitionForbiddenError,
  MerchantKybRequiredError,
  MerchantNameRequiredError,
  MerchantLegalNameRequiredError,
  MerchantContactInvalidError,
  MerchantCountryCodeInvalidError,
  MerchantCategoryInvalidError,
  MerchantPlatformFeeInvalidError,
  MerchantApprovalRequiredError,
  ProductNotFoundError,
  ProductAlreadyExistsError,
  ProductDeletedError,
  ProductArchivedError,
  ProductNotPurchasableError,
  ProductStatusInvalidError,
  ProductStatusTransitionForbiddenError,
  ProductNameRequiredError,
  ProductNameTooLongError,
  ProductPriceInvalidError,
  ProductPriceOutOfRangeError,
  ProductCurrencyInvalidError,
  ProductStockInvalidError,
  ProductStockInsufficientError,
  ProductStockChangeTypeInvalidError,
  ProductMerchantMismatchError,
  ProductGalleryLimitExceededError,
  OrderNotFoundError,
  OrderAlreadyPaidError,
  OrderNotCancellableError,
  OrderNotPayableError,
  OrderNotShippableError,
  OrderNotRefundableError,
  OrderNotCompletableError,
  OrderStatusInvalidError,
  OrderStatusTransitionForbiddenError,
  OrderQuantityInvalidError,
  OrderAmountInvalidError,
  OrderPaymentMethodInvalidError,
  OrderShippingAddressRequiredError,
  OrderTrackingNoInvalidError,
  OrderShippingCompanyInvalidError,
  OrderRiskHoldError,
  OrderRefundReasonRequiredError,
  OrderRefundAmountExceededError,
  OrderPaymentExpiredError,
  OrderAlreadyShippedError,
  OrderAlreadyDeliveredError,
  OrderAlreadyCancelledError,
  CouponNotFoundError,
  CouponExpiredError,
  CouponPausedError,
  CouponDisabledError,
  CouponNotUsableError,
  CouponSupplyExhaustedError,
  CouponAlreadyClaimedError,
  CouponMinSpendNotMetError,
  CouponUserScopeNotAllowedError,
  CouponProductScopeNotMatchedError,
  CouponTypeInvalidError,
  CouponAmountInvalidError,
  SettlementNotFoundError,
  SettlementNotApprovableError,
  SettlementNotPayableError,
  SettlementNotCancellableError,
  SettlementStatusInvalidError,
  SettlementStatusTransitionForbiddenError,
  SettlementPeriodInvalidError,
  SettlementAmountInvalidError,
  SettlementAlreadyExistsError,
  SettlementApprovalRequiredError,
  SettlementPlatformFeeInvalidError,
  DappxMallInternalError,
  ConcurrentUpdateError,
  IdempotencyKeyConflictError,
  UnauthorizedOperationError,
} from './dappx-mall-errors';

// ============================================================
// DTOs
// ============================================================

/** 创建商户 */
export interface CreateMerchantInput {
  userId: string;
  merchantName: string;
  legalName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  countryCode: string;
  category?: FjnMerchantCategory;
  description?: string;
  logoUrl?: string;
  platformFeeRate?: string;
  operatorId?: string;
}

/** 商户状态变更 */
export interface ChangeMerchantStatusInput {
  merchantId: string;
  toStatus: FjnMerchantStatus;
  reason?: string;
  operatorId?: string;
}

/** 创建商品 */
export interface CreateMallProductInput {
  merchantId: string;
  name: string;
  category: string;
  description?: string;
  price: string;
  currency?: string;
  stock?: number;
  imageUrl?: string;
  gallery?: Prisma.InputJsonValue;
  attributes?: Prisma.InputJsonValue;
  acceptPoints?: boolean;
  acceptToken?: boolean;
  operatorId?: string;
}

/** 更新商品 */
export interface UpdateMallProductInput {
  productId: string;
  name?: string;
  category?: string;
  description?: string;
  price?: string;
  stock?: number;
  imageUrl?: string;
  gallery?: Prisma.InputJsonValue;
  attributes?: Prisma.InputJsonValue;
  acceptPoints?: boolean;
  acceptToken?: boolean;
  operatorId?: string;
}

/** 商品状态变更 */
export interface ChangeMallProductStatusInput {
  productId: string;
  toStatus: FjnMallProductStatus;
  reason?: string;
  operatorId?: string;
}

/** 库存调整 */
export interface AdjustMallStockInput {
  productId: string;
  delta: number;
  changeType: FjnMallStockChangeType;
  note?: string;
  operatorId?: string;
}

/** 创建订单 */
export interface CreateMallOrderInput {
  userId: string;
  merchantId: string;
  productId: string;
  quantity?: number;
  paymentMethod?: FjnMallPaymentMethod;
  shippingAddress?: Prisma.InputJsonValue;
  couponNo?: string;
  operatorId?: string;
}

/** 订单支付 */
export interface PayMallOrderInput {
  orderId: string;
  paymentMethod: FjnMallPaymentMethod;
  paymentProof?: string;
  txSignature?: string;
  operatorId?: string;
}

/** 订单发货 */
export interface ShipMallOrderInput {
  orderId: string;
  trackingNo: string;
  shippingCompany: string;
  operatorId?: string;
}

/** 订单退款申请 */
export interface RequestMallRefundInput {
  orderId: string;
  reason: FjnRefundReason | string;
  amount?: string;
  operatorId?: string;
}

/** 创建优惠券 */
export interface CreateCouponInput {
  name: string;
  couponType: FjnCouponType;
  amount: string;
  minSpend?: string;
  totalSupply: number;
  userScope?: FjnCouponUserScope;
  productScope?: Prisma.InputJsonValue;
  validFrom: Date;
  validTo: Date;
  operatorId?: string;
}

/** 优惠券状态变更 */
export interface ChangeCouponStatusInput {
  couponId: string;
  toStatus: FjnMallCouponStatus;
  reason?: string;
  operatorId?: string;
}

/** 申请结算 */
export interface CreateSettlementInput {
  merchantId: string;
  period: string;
  operatorId?: string;
}

/** 审批结算 */
export interface ApproveSettlementInput {
  settlementId: string;
  operatorId: string;
}

/** 支付结算 */
export interface PaySettlementInput {
  settlementId: string;
  txSignature?: string;
  operatorId: string;
}

/** 列表查询 */
export interface ListMerchantInput extends FjnPaginationInput {
  status?: FjnMerchantStatus;
  category?: FjnMerchantCategory;
  countryCode?: string;
  search?: string;
}
export interface ListMallProductInput extends FjnPaginationInput {
  merchantId?: string;
  status?: FjnMallProductStatus;
  category?: string;
  search?: string;
}
export interface ListMallOrderInput extends FjnPaginationInput {
  userId?: string;
  merchantId?: string;
  productId?: string;
  status?: FjnMallOrderStatus;
}
export interface ListCouponInput extends FjnPaginationInput {
  status?: FjnMallCouponStatus;
  couponType?: FjnCouponType;
  search?: string;
}
export interface ListSettlementInput extends FjnPaginationInput {
  merchantId?: string;
  status?: FjnMallSettlementStatus;
  period?: string;
}

// ============================================================
// Service 主体
// ============================================================

export class FjnDappxMallService extends FjnServiceBase {
  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnDappxMallService' });
  }

  // ============================================================
  // 内部工具
  // ============================================================
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnDappxMallEventSource = DAPPX_MALL_EVENT_SOURCES.DAPPX_MALL_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  private toMerchantSummary(m: any) {
    return {
      id: m.id,
      merchantNo: m.merchantNo,
      userId: m.userId,
      merchantName: m.merchantName,
      legalName: m.legalName,
      contactName: m.contactName,
      contactPhone: m.contactPhone,
      contactEmail: m.contactEmail,
      countryCode: m.countryCode,
      kybStatus: m.kybStatus,
      kybApprovedAt: m.kybApprovedAt,
      category: m.category,
      description: m.description,
      logoUrl: m.logoUrl,
      status: m.status,
      platformFeeRate: m.platformFeeRate?.toString?.() ?? m.platformFeeRate,
      approvedBy: m.approvedBy,
      approvedAt: m.approvedAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  private toProductSummary(p: any) {
    return {
      id: p.id,
      productNo: p.productNo,
      merchantId: p.merchantId,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price?.toString?.() ?? p.price,
      currency: p.currency,
      stock: p.stock,
      soldCount: p.soldCount,
      imageUrl: p.imageUrl,
      gallery: p.gallery,
      attributes: p.attributes,
      acceptPoints: p.acceptPoints,
      acceptToken: p.acceptToken,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
    };
  }

  private toOrderSummary(o: any) {
    return {
      id: o.id,
      orderNo: o.orderNo,
      userId: o.userId,
      merchantId: o.merchantId,
      productId: o.productId,
      quantity: o.quantity,
      unitPrice: o.unitPrice?.toString?.() ?? o.unitPrice,
      totalAmount: o.totalAmount?.toString?.() ?? o.totalAmount,
      paidAmount: o.paidAmount?.toString?.() ?? o.paidAmount,
      pointsUsed: o.pointsUsed?.toString?.() ?? o.pointsUsed,
      tokenUsed: o.tokenUsed?.toString?.() ?? o.tokenUsed,
      platformFee: o.platformFee?.toString?.() ?? o.platformFee,
      currency: o.currency,
      paymentMethod: o.paymentMethod,
      status: o.status,
      shippingAddress: o.shippingAddress,
      trackingNo: o.trackingNo,
      shippingCompany: o.shippingCompany,
      paidAt: o.paidAt,
      shippedAt: o.shippedAt,
      deliveredAt: o.deliveredAt,
      completedAt: o.completedAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  private toCouponSummary(c: any) {
    return {
      id: c.id,
      couponNo: c.couponNo,
      name: c.name,
      couponType: c.couponType,
      amount: c.amount?.toString?.() ?? c.amount,
      minSpend: c.minSpend?.toString?.() ?? c.minSpend,
      totalSupply: c.totalSupply,
      claimedCount: c.claimedCount,
      usedCount: c.usedCount,
      userScope: c.userScope,
      productScope: c.productScope,
      status: c.status,
      validFrom: c.validFrom,
      validTo: c.validTo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private toSettlementSummary(s: any) {
    return {
      id: s.id,
      settlementNo: s.settlementNo,
      merchantId: s.merchantId,
      period: s.period,
      grossAmount: s.grossAmount?.toString?.() ?? s.grossAmount,
      refundAmount: s.refundAmount?.toString?.() ?? s.refundAmount,
      platformFee: s.platformFee?.toString?.() ?? s.platformFee,
      netAmount: s.netAmount?.toString?.() ?? s.netAmount,
      currency: s.currency,
      orderCount: s.orderCount,
      status: s.status,
      approvedBy: s.approvedBy,
      approvedAt: s.approvedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  // ============================================================
  // 1. 商户（Merchant）操作
  // ============================================================

  /** 创建商户 */
  async createMerchant(input: CreateMerchantInput) {
    if (!input.merchantName) throw new MerchantNameRequiredError();
    if (!input.legalName) throw new MerchantLegalNameRequiredError();
    if (!input.contactName || !input.contactPhone || !input.contactEmail) {
      throw new MerchantContactInvalidError();
    }
    if (!/^[A-Z]{2}$/.test(input.countryCode)) {
      throw new MerchantCountryCodeInvalidError({ countryCode: input.countryCode });
    }
    if (input.category && !isValidMerchantCategory(input.category)) {
      throw new MerchantCategoryInvalidError({ category: input.category });
    }
    const platformFeeRate = input.platformFeeRate ?? MALL_DEFAULT_PLATFORM_FEE_RATE;
    if (!isValidPlatformFeeRate(platformFeeRate)) {
      throw new MerchantPlatformFeeInvalidError({ rate: platformFeeRate });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnMerchant.findFirst({
        where: { userId: input.userId },
      });
      if (existing) {
        throw new MerchantAlreadyExistsError({ userId: input.userId });
      }

      const count = await tx.fjnMerchant.count();
      const merchantNo = FjnBusinessNoGenerator.merchantNo(count + 1);

      const merchant = await tx.fjnMerchant.create({
        data: {
          merchantNo,
          userId: input.userId,
          merchantName: input.merchantName,
          legalName: input.legalName,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          countryCode: input.countryCode,
          kybStatus: 'not_submitted',
          category: input.category,
          description: input.description,
          logoUrl: input.logoUrl,
          status: MERCHANT_STATUS.PENDING_REVIEW,
          platformFeeRate: new Prisma.Decimal(platformFeeRate),
        },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.MERCHANT_CREATED, {
        merchantId: merchant.id,
        merchantNo: merchant.merchantNo,
        userId: merchant.userId,
        merchantName: merchant.merchantName,
        legalName: merchant.legalName,
        countryCode: merchant.countryCode,
        kybStatus: merchant.kybStatus,
        category: merchant.category,
        createdAt: merchant.createdAt.toISOString(),
      });

      this.log('info', 'Merchant created', { merchantNo, id: merchant.id });
      return this.toMerchantSummary(merchant);
    });
  }

  /** 查询商户 */
  async findMerchantById(id: string) {
    const m = await this.prisma.fjnMerchant.findUnique({
      where: { id },
      include: { products: true, orders: true, settlements: true },
    });
    if (!m) throw new MerchantNotFoundError({ id });
    return m;
  }

  async findMerchantByNo(merchantNo: string) {
    const m = await this.prisma.fjnMerchant.findUnique({
      where: { merchantNo },
      include: { products: true, settlements: true },
    });
    if (!m) throw new MerchantNotFoundError({ merchantNo });
    return m;
  }

  /** 列出商户 */
  async listMerchants(input: ListMerchantInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnMerchantWhereInput = {};
    if (input.status) where.status = input.status;
    if (input.countryCode) where.countryCode = input.countryCode;
    if (input.category) where.category = input.category;
    if (input.search) {
      where.OR = [
        { merchantName: { contains: input.search, mode: 'insensitive' } },
        { legalName: { contains: input.search, mode: 'insensitive' } },
        { merchantNo: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.fjnMerchant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnMerchant.count({ where }),
    ]);
    return paginate(items.map((m) => this.toMerchantSummary(m)), total, input);
  }

  /** 变更商户状态 */
  async changeMerchantStatus(input: ChangeMerchantStatusInput) {
    if (!isValidMerchantStatus(input.toStatus)) {
      throw new MerchantStatusInvalidError({ status: input.toStatus });
    }
    return this.withTransaction(async (tx) => {
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: input.merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: input.merchantId });
      if (merchant.status === input.toStatus) return this.toMerchantSummary(merchant);
      const fromStatus = merchant.status as FjnMerchantStatus;
      if (!MERCHANT_STATUS_TRANSITIONS[fromStatus]?.includes(input.toStatus)) {
        throw new MerchantStatusTransitionForbiddenError({
          from: fromStatus,
          to: input.toStatus,
        });
      }
      const updated = await tx.fjnMerchant.update({
        where: { id: input.merchantId },
        data: { status: input.toStatus },
      });
      const eventType = (() => {
        switch (input.toStatus) {
          case MERCHANT_STATUS.APPROVED:
            return DAPPX_MALL_EVENTS.MERCHANT_APPROVED;
          case MERCHANT_STATUS.ACTIVE:
            return DAPPX_MALL_EVENTS.MERCHANT_ACTIVATED;
          case MERCHANT_STATUS.SUSPENDED:
            return DAPPX_MALL_EVENTS.MERCHANT_SUSPENDED;
          case MERCHANT_STATUS.CLOSED:
            return DAPPX_MALL_EVENTS.MERCHANT_CLOSED;
          case MERCHANT_STATUS.BLACKLISTED:
            return DAPPX_MALL_EVENTS.MERCHANT_BLACKLISTED;
          default:
            return DAPPX_MALL_EVENTS.MERCHANT_STATUS_CHANGED;
        }
      })();
      await this.emitEvent(tx, eventType, {
        merchantId: updated.id,
        merchantNo: updated.merchantNo,
        fromStatus,
        toStatus: updated.status,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Merchant status changed', {
        id: updated.id,
        from: fromStatus,
        to: updated.status,
      });
      return this.toMerchantSummary(updated);
    });
  }

  /** 审批通过 KYB */
  async approveKyb(merchantId: string, operatorId: string) {
    return this.withTransaction(async (tx) => {
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: merchantId });
      if (merchant.kybStatus === 'approved') return this.toMerchantSummary(merchant);
      const updated = await tx.fjnMerchant.update({
        where: { id: merchantId },
        data: {
          kybStatus: 'approved',
          kybApprovedAt: new Date(),
          approvedBy: operatorId,
          approvedAt: new Date(),
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.MERCHANT_APPROVED, {
        merchantId: updated.id,
        merchantNo: updated.merchantNo,
        approvedBy: operatorId,
        approvedAt: updated.kybApprovedAt!.toISOString(),
      });
      this.log('info', 'Merchant KYB approved', { merchantId });
      return this.toMerchantSummary(updated);
    });
  }

  // ============================================================
  // 2. 商城商品（Product）操作
  // ============================================================

  /** 创建商品 */
  async createProduct(input: CreateMallProductInput) {
    if (!input.name) throw new ProductNameRequiredError();
    if (input.name.length > MALL_NAME_MAX_LENGTH) {
      throw new ProductNameTooLongError({ length: input.name.length });
    }
    if (!isValidMallPrice(input.price)) {
      throw new ProductPriceInvalidError({ price: input.price });
    }
    if (input.stock !== undefined && !isValidMallStock(input.stock)) {
      throw new ProductStockInvalidError({ stock: input.stock });
    }
    const currency = input.currency ?? MALL_DEFAULT_CURRENCY;
    if (currency.length > 8) {
      throw new ProductCurrencyInvalidError({ currency });
    }
    if (input.gallery && Array.isArray(input.gallery) && input.gallery.length > MALL_GALLERY_MAX_COUNT) {
      throw new ProductGalleryLimitExceededError({
        count: (input.gallery as unknown[]).length,
        max: MALL_GALLERY_MAX_COUNT,
      });
    }

    return this.withTransaction(async (tx) => {
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: input.merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: input.merchantId });
      if (!isMerchantOperable(merchant.status as FjnMerchantStatus)) {
        throw new MerchantNotOperableError({ id: input.merchantId, status: merchant.status });
      }

      const count = await tx.fjnMallProduct.count();
      const productNo = FjnBusinessNoGenerator.mallProductNo(count + 1);

      const product = await tx.fjnMallProduct.create({
        data: {
          productNo,
          merchantId: input.merchantId,
          name: input.name,
          category: input.category,
          description: input.description,
          price: input.price,
          currency,
          stock: input.stock ?? 0,
          soldCount: 0,
          imageUrl: input.imageUrl,
          gallery: input.gallery as any,
          attributes: input.attributes as any,
          acceptPoints: input.acceptPoints ?? false,
          acceptToken: input.acceptToken ?? false,
          status: MALL_PRODUCT_STATUS.DRAFT,
        },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.PRODUCT_CREATED, {
        productId: product.id,
        productNo: product.productNo,
        merchantId: product.merchantId,
        name: product.name,
        price: product.price.toString(),
        currency: product.currency,
        stock: product.stock,
        acceptPoints: product.acceptPoints,
        acceptToken: product.acceptToken,
        status: product.status,
        createdAt: product.createdAt.toISOString(),
      });

      this.log('info', 'Mall product created', { productNo, id: product.id });
      return this.toProductSummary(product);
    });
  }

  /** 查询商品 */
  async findProductById(id: string) {
    const p = await this.prisma.fjnMallProduct.findUnique({
      where: { id },
      include: { merchant: true, orders: true },
    });
    if (!p) throw new ProductNotFoundError({ id });
    if (p.deletedAt) throw new ProductDeletedError({ id });
    return p;
  }

  /** 列出商品 */
  async listProducts(input: ListMallProductInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnMallProductWhereInput = { deletedAt: null };
    if (input.merchantId) where.merchantId = input.merchantId;
    if (input.status) where.status = input.status;
    if (input.category) where.category = input.category;
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { productNo: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.fjnMallProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { merchant: true },
      }),
      this.prisma.fjnMallProduct.count({ where }),
    ]);
    return paginate(items.map((p) => this.toProductSummary(p)), total, input);
  }

  /** 更新商品 */
  async updateProduct(input: UpdateMallProductInput) {
    if (input.name !== undefined && input.name.length > MALL_NAME_MAX_LENGTH) {
      throw new ProductNameTooLongError({ length: input.name.length });
    }
    if (input.price !== undefined && !isValidMallPrice(input.price)) {
      throw new ProductPriceInvalidError({ price: input.price });
    }
    if (input.stock !== undefined && !isValidMallStock(input.stock)) {
      throw new ProductStockInvalidError({ stock: input.stock });
    }
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnMallProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ id: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ id: input.productId });
      if (product.status === MALL_PRODUCT_STATUS.ARCHIVED) {
        throw new ProductArchivedError({ id: input.productId });
      }

      const data: Prisma.FjnMallProductUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.category !== undefined) data.category = input.category;
      if (input.description !== undefined) data.description = input.description;
      if (input.price !== undefined) data.price = input.price;
      if (input.stock !== undefined) data.stock = input.stock;
      if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
      if (input.gallery !== undefined) data.gallery = input.gallery as any;
      if (input.attributes !== undefined) data.attributes = input.attributes as any;
      if (input.acceptPoints !== undefined) data.acceptPoints = input.acceptPoints;
      if (input.acceptToken !== undefined) data.acceptToken = input.acceptToken;

      const updated = await tx.fjnMallProduct.update({
        where: { id: input.productId },
        data,
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.PRODUCT_UPDATED, {
        productId: updated.id,
        productNo: updated.productNo,
        merchantId: updated.merchantId,
        changes: Object.keys(data),
        updatedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall product updated', { id: updated.id });
      return this.toProductSummary(updated);
    });
  }

  /** 变更商品状态 */
  async changeProductStatus(input: ChangeMallProductStatusInput) {
    if (!isValidMallProductStatus(input.toStatus)) {
      throw new ProductStatusInvalidError({ status: input.toStatus });
    }
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnMallProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ id: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ id: input.productId });
      const fromStatus = product.status as FjnMallProductStatus;
      if (!MALL_PRODUCT_STATUS_TRANSITIONS[fromStatus]?.includes(input.toStatus)) {
        throw new ProductStatusTransitionForbiddenError({
          from: fromStatus,
          to: input.toStatus,
        });
      }
      const updated = await tx.fjnMallProduct.update({
        where: { id: input.productId },
        data: { status: input.toStatus },
      });
      const eventType = (() => {
        switch (input.toStatus) {
          case MALL_PRODUCT_STATUS.ACTIVE:
            return DAPPX_MALL_EVENTS.PRODUCT_ACTIVATED;
          case MALL_PRODUCT_STATUS.INACTIVE:
            return DAPPX_MALL_EVENTS.PRODUCT_DEACTIVATED;
          case MALL_PRODUCT_STATUS.SOLD_OUT:
            return DAPPX_MALL_EVENTS.PRODUCT_SOLD_OUT;
          case MALL_PRODUCT_STATUS.ARCHIVED:
            return DAPPX_MALL_EVENTS.PRODUCT_ARCHIVED;
          default:
            return DAPPX_MALL_EVENTS.PRODUCT_STATUS_CHANGED;
        }
      })();
      await this.emitEvent(tx, eventType, {
        productId: updated.id,
        productNo: updated.productNo,
        merchantId: updated.merchantId,
        fromStatus,
        toStatus: updated.status,
        operatorId: input.operatorId,
        changedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall product status changed', {
        id: updated.id,
        from: fromStatus,
        to: updated.status,
      });
      return this.toProductSummary(updated);
    });
  }

  /** 调整库存 */
  async adjustStock(input: AdjustMallStockInput) {
    if (!isValidMallStockChangeType(input.changeType)) {
      throw new ProductStockChangeTypeInvalidError({ changeType: input.changeType });
    }
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnMallProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ id: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ id: input.productId });
      const balanceBefore = product.stock;
      const balanceAfter = balanceBefore + input.delta;
      if (balanceAfter < 0) {
        throw new ProductStockInsufficientError({
          before: balanceBefore,
          delta: input.delta,
          after: balanceAfter,
        });
      }
      const updated = await tx.fjnMallProduct.update({
        where: { id: input.productId },
        data: { stock: balanceAfter },
      });
      const eventType =
        input.delta > 0
          ? DAPPX_MALL_EVENTS.PRODUCT_RESTOCKED
          : DAPPX_MALL_EVENTS.PRODUCT_STOCK_ADJUSTED;
      await this.emitEvent(tx, eventType, {
        productId: updated.id,
        productNo: updated.productNo,
        merchantId: updated.merchantId,
        delta: input.delta,
        balanceBefore,
        balanceAfter,
        changeType: input.changeType,
        reason: input.note,
        operatorId: input.operatorId,
        adjustedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall stock adjusted', {
        productId: input.productId,
        delta: input.delta,
        before: balanceBefore,
        after: balanceAfter,
      });
      return this.toProductSummary(updated);
    });
  }

  // ============================================================
  // 3. 商城订单（Order）操作
  // ============================================================

  /** 创建订单 */
  async createOrder(input: CreateMallOrderInput) {
    const quantity = input.quantity ?? MALL_DEFAULT_QUANTITY;
    if (!isValidQuantity(quantity)) throw new OrderQuantityInvalidError({ quantity });
    return this.withTransaction(async (tx) => {
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: input.merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: input.merchantId });
      if (!isMerchantActive(merchant.status as FjnMerchantStatus)) {
        throw new MerchantNotActiveError({ id: input.merchantId, status: merchant.status });
      }
      const product = await tx.fjnMallProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ id: input.productId });
      if (product.merchantId !== input.merchantId) {
        throw new ProductMerchantMismatchError({
          productId: input.productId,
          merchantId: input.merchantId,
          productMerchantId: product.merchantId,
        });
      }
      if (!isMallProductPurchasable(product.status as FjnMallProductStatus)) {
        throw new ProductNotPurchasableError({ id: input.productId, status: product.status });
      }
      if (product.stock < quantity) {
        throw new ProductStockInsufficientError({ stock: product.stock, requested: quantity });
      }

      // 锁库存
      await tx.fjnMallProduct.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      });

      const unitPrice = product.price.toString();
      const totalAmount = new Prisma.Decimal(unitPrice).mul(quantity).toString();

      const count = await tx.fjnMallOrder.count();
      const orderNo = FjnBusinessNoGenerator.mallOrderNo(count + 1);

      const order = await tx.fjnMallOrder.create({
        data: {
          orderNo,
          userId: input.userId,
          merchantId: input.merchantId,
          productId: input.productId,
          quantity,
          unitPrice,
          totalAmount,
          paidAmount: '0',
          pointsUsed: '0',
          tokenUsed: '0',
          platformFee: '0',
          currency: product.currency,
          paymentMethod: input.paymentMethod,
          status: MALL_ORDER_STATUS.CREATED,
          shippingAddress: input.shippingAddress as any,
        },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_CREATED, {
        orderId: order.id,
        orderNo: order.orderNo,
        userId: order.userId,
        merchantId: order.merchantId,
        productId: order.productId,
        quantity: order.quantity,
        unitPrice: order.unitPrice.toString(),
        totalAmount: order.totalAmount.toString(),
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt.toISOString(),
      });

      this.log('info', 'Mall order created', { orderNo, id: order.id });
      return this.toOrderSummary(order);
    });
  }

  /** 标记订单为待支付 */
  async markOrderPaymentPending(orderId: string, paymentIntentId?: string, expiresAt?: Date) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.PENDING_PAYMENT)) {
        throw new OrderStatusTransitionForbiddenError({
          from: fromStatus,
          to: MALL_ORDER_STATUS.PENDING_PAYMENT,
        });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: {
          status: MALL_ORDER_STATUS.PENDING_PAYMENT,
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_PAYMENT_PENDING, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        paymentIntentId,
        expiresAt: expiresAt?.toISOString(),
        pendingAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall order pending payment', { orderId });
      return this.toOrderSummary(updated);
    });
  }

  /** 支付订单 */
  async payOrder(input: PayMallOrderInput) {
    if (!isValidMallPaymentMethod(input.paymentMethod)) {
      throw new OrderPaymentMethodInvalidError({ method: input.paymentMethod });
    }
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new OrderNotFoundError({ id: input.orderId });
      if (order.status === MALL_ORDER_STATUS.PAID) {
        throw new OrderAlreadyPaidError({ id: input.orderId });
      }
      if (!isOrderPayable(order.status as FjnMallOrderStatus)) {
        throw new OrderNotPayableError({ id: input.orderId, status: order.status });
      }
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: order.merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: order.merchantId });
      const platformFee = new Prisma.Decimal(order.totalAmount.toString())
        .mul(merchant.platformFeeRate)
        .toString();

      const updated = await tx.fjnMallOrder.update({
        where: { id: input.orderId },
        data: {
          status: MALL_ORDER_STATUS.PAID,
          paidAmount: order.totalAmount,
          paymentMethod: input.paymentMethod,
          platformFee,
          paidAt: new Date(),
        },
      });

      // 累加商户已售数
      await tx.fjnMallProduct.update({
        where: { id: order.productId },
        data: { soldCount: { increment: order.quantity } },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_PAID, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        userId: updated.userId,
        merchantId: updated.merchantId,
        totalAmount: updated.totalAmount.toString(),
        paidAmount: updated.paidAmount.toString(),
        paymentMethod: updated.paymentMethod,
        txSignature: input.txSignature,
        paidAt: updated.paidAt!.toISOString(),
      });

      this.log('info', 'Mall order paid', { orderId: input.orderId });
      return this.toOrderSummary(updated);
    });
  }

  /** 确认订单 */
  async confirmOrder(orderId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.CONFIRMED)) {
        throw new OrderStatusTransitionForbiddenError({
          from: fromStatus,
          to: MALL_ORDER_STATUS.CONFIRMED,
        });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: { status: MALL_ORDER_STATUS.CONFIRMED },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_CONFIRMED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        confirmedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall order confirmed', { orderId, operatorId });
      return this.toOrderSummary(updated);
    });
  }

  /** 发货 */
  async shipOrder(input: ShipMallOrderInput) {
    if (!input.trackingNo) throw new OrderTrackingNoInvalidError();
    if (!input.shippingCompany) throw new OrderShippingCompanyInvalidError();
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new OrderNotFoundError({ id: input.orderId });
      if (order.shippedAt) throw new OrderAlreadyShippedError({ id: input.orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.SHIPPED)) {
        throw new OrderNotShippableError({ id: input.orderId, status: fromStatus });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: input.orderId },
        data: {
          status: MALL_ORDER_STATUS.SHIPPED,
          trackingNo: input.trackingNo,
          shippingCompany: input.shippingCompany,
          shippedAt: new Date(),
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_SHIPPED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        trackingNo: updated.trackingNo,
        shippingCompany: updated.shippingCompany,
        shippedAt: updated.shippedAt!.toISOString(),
      });
      this.log('info', 'Mall order shipped', { orderId: input.orderId });
      return this.toOrderSummary(updated);
    });
  }

  /** 标记已送达 */
  async deliverOrder(orderId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      if (order.deliveredAt) throw new OrderAlreadyDeliveredError({ id: orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.DELIVERED)) {
        throw new OrderStatusTransitionForbiddenError({
          from: fromStatus,
          to: MALL_ORDER_STATUS.DELIVERED,
        });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: {
          status: MALL_ORDER_STATUS.DELIVERED,
          deliveredAt: new Date(),
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_DELIVERED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        deliveredAt: updated.deliveredAt!.toISOString(),
      });
      this.log('info', 'Mall order delivered', { orderId, operatorId });
      return this.toOrderSummary(updated);
    });
  }

  /** 完成订单 */
  async completeOrder(orderId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.COMPLETED)) {
        throw new OrderNotCompletableError({ id: orderId, status: fromStatus });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: {
          status: MALL_ORDER_STATUS.COMPLETED,
          completedAt: new Date(),
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_COMPLETED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        completedAt: updated.completedAt!.toISOString(),
      });
      this.log('info', 'Mall order completed', { orderId, operatorId });
      return this.toOrderSummary(updated);
    });
  }

  /** 取消订单（回滚库存） */
  async cancelOrder(orderId: string, reason?: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      if (order.status === MALL_ORDER_STATUS.CANCELLED) {
        throw new OrderAlreadyCancelledError({ id: orderId });
      }
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!isOrderCancellable(fromStatus)) {
        throw new OrderNotCancellableError({ id: orderId, status: fromStatus });
      }
      // 回滚库存
      await tx.fjnMallProduct.update({
        where: { id: order.productId },
        data: { stock: { increment: order.quantity } },
      });
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: { status: MALL_ORDER_STATUS.CANCELLED },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_CANCELLED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        reason,
        cancelledAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall order cancelled', { orderId, operatorId });
      return this.toOrderSummary(updated);
    });
  }

  /** 申请退款（自动到 refunded 或保留 refund_requested 待审批） */
  async requestRefund(input: RequestMallRefundInput) {
    if (!input.reason) throw new OrderRefundReasonRequiredError();
    if (input.amount) {
      // 校验金额
      const order = await this.prisma.fjnMallOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new OrderNotFoundError({ id: input.orderId });
      if (new Prisma.Decimal(input.amount).gt(order.totalAmount)) {
        throw new OrderRefundAmountExceededError({
          amount: input.amount,
          total: order.totalAmount.toString(),
        });
      }
    }
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new OrderNotFoundError({ id: input.orderId });
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.REFUND_REQUESTED)) {
        throw new OrderNotRefundableError({ id: input.orderId, status: fromStatus });
      }
      const updated = await tx.fjnMallOrder.update({
        where: { id: input.orderId },
        data: { status: MALL_ORDER_STATUS.REFUND_REQUESTED },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_REFUND_REQUESTED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        reason: input.reason,
        requestedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall order refund requested', { orderId: input.orderId });
      return this.toOrderSummary(updated);
    });
  }

  /** 完成退款 */
  async refundOrder(orderId: string, refundAmount: string, operatorId: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.fjnMallOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new OrderNotFoundError({ id: orderId });
      if (new Prisma.Decimal(refundAmount).gt(order.totalAmount)) {
        throw new OrderRefundAmountExceededError({
          amount: refundAmount,
          total: order.totalAmount.toString(),
        });
      }
      const fromStatus = order.status as FjnMallOrderStatus;
      if (!MALL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_ORDER_STATUS.REFUNDED)) {
        throw new OrderNotRefundableError({ id: orderId, status: fromStatus });
      }
      // 回滚库存
      await tx.fjnMallProduct.update({
        where: { id: order.productId },
        data: {
          stock: { increment: order.quantity },
          soldCount: { decrement: order.quantity },
        },
      });
      const updated = await tx.fjnMallOrder.update({
        where: { id: orderId },
        data: {
          status: MALL_ORDER_STATUS.REFUNDED,
          paidAmount: '0',
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.ORDER_REFUNDED, {
        orderId: updated.id,
        orderNo: updated.orderNo,
        refundAmount,
        refundedAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Mall order refunded', { orderId, refundAmount, operatorId });
      return this.toOrderSummary(updated);
    });
  }

  /** 查询订单 */
  async findOrderById(id: string) {
    const o = await this.prisma.fjnMallOrder.findUnique({
      where: { id },
      include: { merchant: true, product: true },
    });
    if (!o) throw new OrderNotFoundError({ id });
    return o;
  }

  async findOrderByNo(orderNo: string) {
    const o = await this.prisma.fjnMallOrder.findUnique({
      where: { orderNo },
      include: { merchant: true, product: true },
    });
    if (!o) throw new OrderNotFoundError({ orderNo });
    return o;
  }

  async listOrders(input: ListMallOrderInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnMallOrderWhereInput = {};
    if (input.userId) where.userId = input.userId;
    if (input.merchantId) where.merchantId = input.merchantId;
    if (input.productId) where.productId = input.productId;
    if (input.status) where.status = input.status;
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.fjnMallOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { merchant: true, product: true },
      }),
      this.prisma.fjnMallOrder.count({ where }),
    ]);
    return paginate(items.map((o) => this.toOrderSummary(o)), total, input);
  }

  // ============================================================
  // 4. 优惠券（Coupon）操作
  // ============================================================

  async createCoupon(input: CreateCouponInput) {
    if (!isValidCouponType(input.couponType)) {
      throw new CouponTypeInvalidError({ type: input.couponType });
    }
    if (!isValidCouponAmount(input.amount, input.couponType)) {
      throw new CouponAmountInvalidError({ amount: input.amount, type: input.couponType });
    }
    if (input.userScope && !isValidCouponUserScope(input.userScope)) {
      throw new CouponTypeInvalidError({ scope: input.userScope });
    }
    if (input.validTo <= input.validFrom) {
      throw new CouponExpiredError({ reason: 'validTo must be after validFrom' });
    }

    return this.withTransaction(async (tx) => {
      const count = await tx.fjnMallCoupon.count();
      const couponNo = FjnBusinessNoGenerator.mallCouponNo(count + 1);

      const coupon = await tx.fjnMallCoupon.create({
        data: {
          couponNo,
          name: input.name,
          couponType: input.couponType,
          amount: input.amount,
          minSpend: input.minSpend ?? '0',
          totalSupply: input.totalSupply,
          claimedCount: 0,
          usedCount: 0,
          userScope: input.userScope ?? COUPON_USER_SCOPE.ALL,
          productScope: input.productScope as any,
          status: MALL_COUPON_STATUS.ACTIVE,
          validFrom: input.validFrom,
          validTo: input.validTo,
        },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.COUPON_CREATED, {
        couponId: coupon.id,
        couponNo: coupon.couponNo,
        name: coupon.name,
        couponType: coupon.couponType,
        amount: coupon.amount.toString(),
        minSpend: coupon.minSpend.toString(),
        totalSupply: coupon.totalSupply,
        validFrom: coupon.validFrom.toISOString(),
        validTo: coupon.validTo.toISOString(),
        createdAt: coupon.createdAt.toISOString(),
      });

      this.log('info', 'Coupon created', { couponNo });
      return this.toCouponSummary(coupon);
    });
  }

  async findCouponById(id: string) {
    const c = await this.prisma.fjnMallCoupon.findUnique({ where: { id } });
    if (!c) throw new CouponNotFoundError({ id });
    return c;
  }

  async findCouponByNo(couponNo: string) {
    const c = await this.prisma.fjnMallCoupon.findUnique({ where: { couponNo } });
    if (!c) throw new CouponNotFoundError({ couponNo });
    return c;
  }

  async listCoupons(input: ListCouponInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnMallCouponWhereInput = {};
    if (input.status) where.status = input.status;
    if (input.couponType) where.couponType = input.couponType;
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { couponNo: { contains: input.search, mode: 'insensitive' } },
      ];
    }
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.fjnMallCoupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fjnMallCoupon.count({ where }),
    ]);
    return paginate(items.map((c) => this.toCouponSummary(c)), total, input);
  }

  async changeCouponStatus(input: ChangeCouponStatusInput) {
    if (!isValidMallCouponStatus(input.toStatus)) {
      throw new CouponNotUsableError({ status: input.toStatus });
    }
    return this.withTransaction(async (tx) => {
      const coupon = await tx.fjnMallCoupon.findUnique({ where: { id: input.couponId } });
      if (!coupon) throw new CouponNotFoundError({ id: input.couponId });
      const fromStatus = coupon.status as FjnMallCouponStatus;
      if (fromStatus === input.toStatus) return this.toCouponSummary(coupon);
      const updated = await tx.fjnMallCoupon.update({
        where: { id: input.couponId },
        data: { status: input.toStatus },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.COUPON_STATUS_CHANGED, {
        couponId: updated.id,
        couponNo: updated.couponNo,
        fromStatus,
        toStatus: updated.status,
        changedAt: updated.updatedAt.toISOString(),
      });
      return this.toCouponSummary(updated);
    });
  }

  // ============================================================
  // 5. 商家结算（Settlement）操作
  // ============================================================

  async createSettlement(input: CreateSettlementInput) {
    if (!isValidSettlementPeriod(input.period)) {
      throw new SettlementPeriodInvalidError({ period: input.period });
    }
    return this.withTransaction(async (tx) => {
      const merchant = await tx.fjnMerchant.findUnique({ where: { id: input.merchantId } });
      if (!merchant) throw new MerchantNotFoundError({ id: input.merchantId });

      // 重复检查：同商户 + 同期 = 唯一
      const existing = await tx.fjnMallSettlement.findFirst({
        where: { merchantId: input.merchantId, period: input.period },
      });
      if (existing) {
        throw new SettlementAlreadyExistsError({
          merchantId: input.merchantId,
          period: input.period,
        });
      }

      // 聚合订单
      const orders = await tx.fjnMallOrder.findMany({
        where: {
          merchantId: input.merchantId,
          status: MALL_ORDER_STATUS.COMPLETED,
        },
      });
      const grossAmount = orders.reduce(
        (s, o) => s.add(o.totalAmount),
        new Prisma.Decimal(0),
      );
      const refundOrders = await tx.fjnMallOrder.findMany({
        where: {
          merchantId: input.merchantId,
          status: MALL_ORDER_STATUS.REFUNDED,
        },
      });
      const refundAmount = refundOrders.reduce(
        (s, o) => s.add(o.totalAmount),
        new Prisma.Decimal(0),
      );
      const platformFee = grossAmount.mul(merchant.platformFeeRate);
      const netAmount = grossAmount.sub(platformFee).sub(refundAmount);

      const count = await tx.fjnMallSettlement.count();
      const settlementNo = FjnBusinessNoGenerator.mallSettlementNo(count + 1);

      const settlement = await tx.fjnMallSettlement.create({
        data: {
          settlementNo,
          merchantId: input.merchantId,
          period: input.period,
          grossAmount: grossAmount.toString(),
          refundAmount: refundAmount.toString(),
          platformFee: platformFee.toString(),
          netAmount: netAmount.toString(),
          currency: 'USD',
          orderCount: orders.length,
          status: MALL_SETTLEMENT_STATUS.CREATED,
        },
      });

      await this.emitEvent(tx, DAPPX_MALL_EVENTS.SETTLEMENT_CREATED, {
        settlementId: settlement.id,
        settlementNo: settlement.settlementNo,
        merchantId: settlement.merchantId,
        period: settlement.period,
        grossAmount: settlement.grossAmount.toString(),
        refundAmount: settlement.refundAmount.toString(),
        platformFee: settlement.platformFee.toString(),
        netAmount: settlement.netAmount.toString(),
        currency: settlement.currency,
        orderCount: settlement.orderCount,
        createdAt: settlement.createdAt.toISOString(),
      });

      this.log('info', 'Settlement created', { settlementNo });
      return this.toSettlementSummary(settlement);
    });
  }

  async approveSettlement(input: ApproveSettlementInput) {
    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnMallSettlement.findUnique({
        where: { id: input.settlementId },
      });
      if (!settlement) throw new SettlementNotFoundError({ id: input.settlementId });
      const fromStatus = settlement.status as FjnMallSettlementStatus;
      if (!MALL_SETTLEMENT_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_SETTLEMENT_STATUS.APPROVED)) {
        throw new SettlementNotApprovableError({ id: input.settlementId, status: fromStatus });
      }
      const updated = await tx.fjnMallSettlement.update({
        where: { id: input.settlementId },
        data: {
          status: MALL_SETTLEMENT_STATUS.APPROVED,
          approvedBy: input.operatorId,
          approvedAt: new Date(),
        },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.SETTLEMENT_APPROVED, {
        settlementId: updated.id,
        settlementNo: updated.settlementNo,
        merchantId: updated.merchantId,
        approvedBy: input.operatorId,
        approvedAt: updated.approvedAt!.toISOString(),
      });
      this.log('info', 'Settlement approved', { settlementId: input.settlementId });
      return this.toSettlementSummary(updated);
    });
  }

  async paySettlement(input: PaySettlementInput) {
    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnMallSettlement.findUnique({
        where: { id: input.settlementId },
      });
      if (!settlement) throw new SettlementNotFoundError({ id: input.settlementId });
      if (!isSettlementPayable(settlement.status as FjnMallSettlementStatus)) {
        throw new SettlementNotPayableError({
          id: input.settlementId,
          status: settlement.status,
        });
      }
      const updated = await tx.fjnMallSettlement.update({
        where: { id: input.settlementId },
        data: { status: MALL_SETTLEMENT_STATUS.PAID },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.SETTLEMENT_PAID, {
        settlementId: updated.id,
        settlementNo: updated.settlementNo,
        merchantId: updated.merchantId,
        paidAmount: updated.netAmount.toString(),
        txSignature: input.txSignature,
        paidAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Settlement paid', { settlementId: input.settlementId });
      return this.toSettlementSummary(updated);
    });
  }

  async cancelSettlement(settlementId: string, reason: string, operatorId: string) {
    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnMallSettlement.findUnique({
        where: { id: settlementId },
      });
      if (!settlement) throw new SettlementNotFoundError({ id: settlementId });
      const fromStatus = settlement.status as FjnMallSettlementStatus;
      if (!MALL_SETTLEMENT_STATUS_TRANSITIONS[fromStatus]?.includes(MALL_SETTLEMENT_STATUS.CANCELLED)) {
        throw new SettlementNotCancellableError({ id: settlementId, status: fromStatus });
      }
      const updated = await tx.fjnMallSettlement.update({
        where: { id: settlementId },
        data: { status: MALL_SETTLEMENT_STATUS.CANCELLED },
      });
      await this.emitEvent(tx, DAPPX_MALL_EVENTS.SETTLEMENT_CANCELLED, {
        settlementId: updated.id,
        settlementNo: updated.settlementNo,
        reason,
        cancelledAt: updated.updatedAt.toISOString(),
      });
      this.log('info', 'Settlement cancelled', { settlementId, operatorId });
      return this.toSettlementSummary(updated);
    });
  }

  async findSettlementById(id: string) {
    const s = await this.prisma.fjnMallSettlement.findUnique({
      where: { id },
      include: { merchant: true },
    });
    if (!s) throw new SettlementNotFoundError({ id });
    return s;
  }

  async listSettlements(input: ListSettlementInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnMallSettlementWhereInput = {};
    if (input.merchantId) where.merchantId = input.merchantId;
    if (input.status) where.status = input.status;
    if (input.period) where.period = input.period;
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const [items, total] = await Promise.all([
      this.prisma.fjnMallSettlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { merchant: true },
      }),
      this.prisma.fjnMallSettlement.count({ where }),
    ]);
    return paginate(items.map((s) => this.toSettlementSummary(s)), total, input);
  }
}

export const createFjnDappxMallService = (options?: FjnServiceOptions) =>
  new FjnDappxMallService(options);
