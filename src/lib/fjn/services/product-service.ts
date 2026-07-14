/**
 * FJN Product Service - 商品服务（4 文件化主体）
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.3
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.3
 *
 * 职责（与 H15 一致）：
 *  - 福建老酒 369 商品
 *  - AEP 算力包
 *  - 商品权益配置
 *  - 商品版本
 *  - 商品上下架
 *  - 商品地区规则
 *  - 商品库存
 *  - 商品规则绑定
 *
 * 用法：
 *   import { FjnProductService } from '@/lib/fjn/services/product-service';
 *   const svc = new FjnProductService();
 *   const product = await svc.create({ productType: 'wine_369', name: '369经典款', price: '369' });
 */

import type { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnBusinessNoGenerator, FjnPaginatedResult, FjnPaginationInput, paginate } from '../types';
import {
  PRODUCT_STATUS,
  STOCK_CHANGE_TYPE,
  PRODUCT_DEFAULT_CURRENCY,
  PRODUCT_DEFAULT_TAX_MODE,
  PRODUCT_DEFAULT_STOCK,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_SUBTITLE_MAX_LENGTH,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_GALLERY_MAX_COUNT,
  PRODUCT_BENEFIT_MAX_COUNT,
  PRODUCT_REGION_RULE_MAX_COUNT,
  PRODUCT_REVIEW_REQUIRED_FOR_ACTIVE,
  PRODUCT_STATUS_TRANSITIONS,
  isValidProductType,
  isValidStockChangeType,
  isValidProductPrice,
  isValidProductStock,
  isValidSaleWindow,
  isPurchasable,
  canTransitProductStatus,
  assertTransitProductStatus,
  type FjnProductStatus,
  type FjnProductType,
  type FjnStockChangeType,
  type FjnRegionStatus,
} from './product-state-machine';
import {
  PRODUCT_EVENTS,
  PRODUCT_EVENT_SOURCES,
  type FjnProductEventSource,
} from './product-events';
import {
  ProductNotFoundError,
  ProductDeletedError,
  ProductArchivedError,
  ProductTypeInvalidError,
  ProductTypeRequiredError,
  ProductNameRequiredError,
  ProductNameTooLongError,
  ProductSubtitleTooLongError,
  ProductDescriptionTooLongError,
  ProductPriceRequiredError,
  ProductPriceInvalidError,
  ProductPriceOutOfRangeError,
  ProductCurrencyInvalidError,
  ProductTaxModeInvalidError,
  ProductStatusInvalidError,
  ProductStatusTransitionForbiddenError,
  ProductNotPurchasableError,
  ProductAlreadyActiveError,
  ProductAlreadyArchivedError,
  ProductStockInvalidError,
  ProductStockInsufficientError,
  ProductStockChangeTypeInvalidError,
  ProductActiveDeleteForbiddenError,
  ProductSaleWindowInvalidError,
  ProductNotInSaleWindowError,
  ProductRegionRuleConflictError,
  ProductRegionRuleLimitExceededError,
  ProductRegionRuleNotFoundError,
  ProductBenefitNotFoundError,
  ProductBenefitLimitExceededError,
  ProductBenefitTypeInvalidError,
  ProductBenefitAmountInvalidError,
  ProductRuleBindingNotFoundError,
  ProductRuleBindingInvalidError,
  ProductReviewRequiredError,
  ProductReviewReasonRequiredError,
  ProductGalleryLimitExceededError,
  ProductImageUrlInvalidError,
} from './product-errors';

// ============================================================
// DTOs（保持向后兼容）
// ============================================================

export interface CreateProductInput {
  productType: FjnProductType;
  name: string;
  subtitle?: string;
  description?: string;
  price: string;
  currency?: string;
  costPrice?: string;
  taxMode?: 'inclusive' | 'exclusive';
  stock?: number;
  saleStartTime?: Date;
  saleEndTime?: Date;
  requiresKyc?: boolean;
  requiresKyb?: boolean;
  requiresWallet?: boolean;
  revenueRuleCode?: string;
  pointsRuleCode?: string;
  powerRuleCode?: string;
  rewardRuleCode?: string;
  taxRuleCode?: string;
  riskRuleCode?: string;
  fulfillmentRuleCode?: string;
  imageUrl?: string;
  gallery?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  allowedRegions?: string[];
  blockedRegions?: string[];
  benefits?: CreateBenefitInput[];
  operatorId?: string;
}

export interface CreateBenefitInput {
  benefitType: string;
  amount: string;
  description?: string;
  config?: Prisma.InputJsonValue;
}

export interface UpdateProductInput {
  name?: string;
  subtitle?: string;
  description?: string;
  price?: string;
  costPrice?: string;
  taxMode?: 'inclusive' | 'exclusive';
  stock?: number;
  saleStartTime?: Date;
  saleEndTime?: Date;
  imageUrl?: string;
  gallery?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  operatorId?: string;
}

export interface ListProductInput extends FjnPaginationInput {
  productType?: FjnProductType;
  status?: FjnProductStatus;
  search?: string;
  sortBy?: 'price' | 'soldCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface StockChangeInput {
  productId: string;
  delta: number;
  changeType: FjnStockChangeType;
  note?: string;
  operatorId?: string;
}

export interface AddBenefitInput {
  productId: string;
  benefitType: string;
  amount: string;
  description?: string;
  config?: Prisma.InputJsonValue;
  operatorId?: string;
}

export interface RemoveBenefitInput {
  productId: string;
  benefitId: string;
  reason?: string;
  operatorId?: string;
}

export interface AddRegionRuleInput {
  productId: string;
  regionCode: string;
  ruleType: FjnRegionStatus;
  operatorId?: string;
}

export interface RemoveRegionRuleInput {
  productId: string;
  regionCode: string;
  reason?: string;
  operatorId?: string;
}

export interface AddRuleBindingInput {
  productId: string;
  ruleType: string;
  ruleCode: string;
  operatorId?: string;
}

export interface RemoveRuleBindingInput {
  productId: string;
  ruleType: string;
  ruleCode: string;
  reason?: string;
  operatorId?: string;
}

export interface ReviewProductInput {
  productId: string;
  approved: boolean;
  reason?: string;
  operatorId: string;
}

export interface ListProductWithRelationsInput extends FjnPaginationInput {
  productType?: FjnProductType;
  status?: FjnProductStatus;
  search?: string;
}

// ============================================================
// Service 实现
// ============================================================

export class FjnProductService extends FjnServiceBase {
  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnProductService' });
  }

  /** 事件发射 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnProductEventSource = PRODUCT_EVENT_SOURCES.PRODUCT_SERVICE,
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

  /**
   * 创建商品
   */
  async create(input: CreateProductInput) {
    this.validateCreateInput(input);

    return this.withTransaction(async (tx) => {
      // 1. 分配业务编号
      const count = await tx.fjnProduct.count();
      const productNo = FjnBusinessNoGenerator.productNo(count + 1);

      // 2. 创建商品主表
      const product = await tx.fjnProduct.create({
        data: {
          productNo,
          productType: input.productType,
          name: input.name,
          subtitle: input.subtitle,
          description: input.description,
          price: input.price,
          currency: input.currency ?? PRODUCT_DEFAULT_CURRENCY,
          costPrice: input.costPrice ?? '0',
          taxMode: input.taxMode ?? PRODUCT_DEFAULT_TAX_MODE,
          stock: input.stock ?? PRODUCT_DEFAULT_STOCK,
          soldCount: 0,
          status: PRODUCT_STATUS.DRAFT,
          saleStartTime: input.saleStartTime,
          saleEndTime: input.saleEndTime,
          allowedRegions: input.allowedRegions ?? [],
          blockedRegions: input.blockedRegions ?? [],
          requiresKyc: input.requiresKyc ?? false,
          requiresKyb: input.requiresKyb ?? false,
          requiresWallet: input.requiresWallet ?? false,
          revenueRuleCode: input.revenueRuleCode,
          pointsRuleCode: input.pointsRuleCode,
          powerRuleCode: input.powerRuleCode,
          rewardRuleCode: input.rewardRuleCode,
          taxRuleCode: input.taxRuleCode,
          riskRuleCode: input.riskRuleCode,
          fulfillmentRuleCode: input.fulfillmentRuleCode,
          imageUrl: input.imageUrl,
          gallery: input.gallery as any,
          metadata: input.metadata as any,
          createdBy: input.operatorId,
        },
      });

      // 3. 创建商品权益
      if (input.benefits && input.benefits.length > 0) {
        if (input.benefits.length > PRODUCT_BENEFIT_MAX_COUNT) {
          throw new ProductBenefitLimitExceededError({
            productId: product.id,
            count: input.benefits.length,
            max: PRODUCT_BENEFIT_MAX_COUNT,
          });
        }
        await tx.fjnProductBenefit.createMany({
          data: input.benefits.map(b => ({
            productId: product.id,
            benefitType: b.benefitType,
            amount: b.amount,
            description: b.description,
            config: b.config as any,
          })),
        });
      }

      // 4. 创建地区规则
      const regionRuleCount =
        (input.allowedRegions?.length ?? 0) + (input.blockedRegions?.length ?? 0);
      if (regionRuleCount > PRODUCT_REGION_RULE_MAX_COUNT) {
        throw new ProductRegionRuleLimitExceededError({
          productId: product.id,
          count: regionRuleCount,
          max: PRODUCT_REGION_RULE_MAX_COUNT,
        });
      }
      if (input.allowedRegions && input.allowedRegions.length > 0) {
        await tx.fjnProductRegionRule.createMany({
          data: input.allowedRegions.map(code => ({
            productId: product.id,
            regionCode: code,
            ruleType: 'allowed' as FjnRegionStatus,
          })),
        });
      }
      if (input.blockedRegions && input.blockedRegions.length > 0) {
        await tx.fjnProductRegionRule.createMany({
          data: input.blockedRegions.map(code => ({
            productId: product.id,
            regionCode: code,
            ruleType: 'blocked' as FjnRegionStatus,
          })),
        });
      }

      // 5. 事件
      await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_CREATED, {
        productId: product.id,
        productNo: product.productNo,
        productType: product.productType,
        name: product.name,
        price: product.price.toString(),
        currency: product.currency,
        stock: product.stock,
        status: product.status,
        operatorId: input.operatorId,
        createdAt: product.createdAt.toISOString(),
      });

      this.log('info', '产品创建成功', { productNo, id: product.id, name: input.name });
      return product;
    });
  }

  /**
   * 根据 ID 查询
   */
  async findById(id: string) {
    const product = await this.prisma.fjnProduct.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        benefits: true,
        ruleBindings: true,
        regionRules: true,
      },
    });
    if (!product) {
      throw new ProductNotFoundError({ id });
    }
    return product;
  }

  /**
   * 根据业务编号查询
   */
  async findByProductNo(productNo: string) {
    const product = await this.prisma.fjnProduct.findUnique({
      where: { productNo },
      include: {
        benefits: true,
        regionRules: true,
      },
    });
    if (!product) {
      throw new ProductNotFoundError({ productNo });
    }
    return product;
  }

  /**
   * 列表查询（带筛选 + 分页）
   */
  async list(input: ListProductInput): Promise<FjnPaginatedResult<any>> {
    const where: Prisma.FjnProductWhereInput = { deletedAt: null };
    if (input.productType) where.productType = input.productType;
    if (input.status) where.status = input.status;
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { productNo: { contains: input.search, mode: 'insensitive' } },
        { subtitle: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.FjnProductOrderByWithRelationInput = input.sortBy
      ? { [input.sortBy]: input.sortOrder ?? 'asc' }
      : { createdAt: 'desc' };

    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

    const [items, total] = await Promise.all([
      this.prisma.fjnProduct.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          benefits: true,
        },
      }),
      this.prisma.fjnProduct.count({ where }),
    ]);

    return paginate(items, total, input);
  }

  /**
   * 更新商品（创建新版本）
   */
  async update(id: string, input: UpdateProductInput) {
    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnProduct.findUnique({
        where: { id },
        include: { benefits: true },
      });
      if (!existing) throw new ProductNotFoundError({ id });
      if (existing.deletedAt) throw new ProductDeletedError({ id });
      this.validateUpdateInput(input);

      // 字段长度校验
      if (input.name && input.name.length > PRODUCT_NAME_MAX_LENGTH) {
        throw new ProductNameTooLongError({ max: PRODUCT_NAME_MAX_LENGTH });
      }
      if (input.subtitle && input.subtitle.length > PRODUCT_SUBTITLE_MAX_LENGTH) {
        throw new ProductSubtitleTooLongError({ max: PRODUCT_SUBTITLE_MAX_LENGTH });
      }
      if (input.description && input.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
        throw new ProductDescriptionTooLongError({ max: PRODUCT_DESCRIPTION_MAX_LENGTH });
      }
      if (input.price !== undefined && !isValidProductPrice(input.price)) {
        throw new ProductPriceInvalidError({ price: input.price });
      }
      if (input.stock !== undefined && !isValidProductStock(input.stock)) {
        throw new ProductStockInvalidError({ stock: input.stock });
      }
      const windowCheck = isValidSaleWindow(input.saleStartTime, input.saleEndTime);
      if (!windowCheck.valid) {
        throw new ProductSaleWindowInvalidError({ reason: windowCheck.reason });
      }

      // 计算版本号
      const versionCount = await tx.fjnProductVersion.count({ where: { productId: id } });
      const newVersionNo = String(versionCount + 1);

      // 1. 创建版本快照
      await tx.fjnProductVersion.create({
        data: {
          productId: id,
          versionNo: newVersionNo,
          price: input.price ?? existing.price.toString(),
          benefitsSnapshot: (existing.benefits ?? []) as any,
          changeReason: 'manual_update',
          createdBy: input.operatorId,
        },
      });

      // 2. 更新商品
      const updated = await tx.fjnProduct.update({
        where: { id },
        data: {
          name: input.name,
          subtitle: input.subtitle,
          description: input.description,
          price: input.price,
          costPrice: input.costPrice,
          taxMode: input.taxMode,
          stock: input.stock,
          saleStartTime: input.saleStartTime,
          saleEndTime: input.saleEndTime,
          imageUrl: input.imageUrl,
          gallery: input.gallery as any,
          metadata: input.metadata as any,
        },
      });

      // 3. 事件
      const changedFields: string[] = [];
      if (input.name !== undefined) changedFields.push('name');
      if (input.subtitle !== undefined) changedFields.push('subtitle');
      if (input.description !== undefined) changedFields.push('description');
      if (input.price !== undefined) changedFields.push('price');
      if (input.costPrice !== undefined) changedFields.push('costPrice');
      if (input.taxMode !== undefined) changedFields.push('taxMode');
      if (input.stock !== undefined) changedFields.push('stock');
      if (input.saleStartTime !== undefined) changedFields.push('saleStartTime');
      if (input.saleEndTime !== undefined) changedFields.push('saleEndTime');
      if (input.imageUrl !== undefined) changedFields.push('imageUrl');

      await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_UPDATED, {
        productId: id,
        productNo: existing.productNo,
        changedFields,
        newVersionNo,
        operatorId: input.operatorId,
        updatedAt: new Date().toISOString(),
      });
      await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_VERSION_CREATED, {
        productId: id,
        productNo: existing.productNo,
        versionNo: newVersionNo,
        changeReason: 'manual_update',
        operatorId: input.operatorId,
        createdAt: new Date().toISOString(),
      });

      this.log('info', '商品更新成功', { id, version: newVersionNo });
      return updated;
    });
  }

  /**
   * 状态机：状态变更
   */
  async changeStatus(id: string, toStatus: FjnProductStatus, operatorId?: string) {
    const validStatuses: string[] = Object.values(PRODUCT_STATUS) as string[];
    if (!validStatuses.includes(toStatus)) {
      throw new ProductStatusInvalidError({ toStatus, valid: validStatuses });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnProduct.findUnique({ where: { id } });
      if (!existing) throw new ProductNotFoundError({ id });
      if (existing.deletedAt) throw new ProductDeletedError({ id });
      if (!canTransitProductStatus(existing.status as FjnProductStatus, toStatus)) {
        throw new ProductStatusTransitionForbiddenError({
          id,
          from: existing.status,
          to: toStatus,
          allowed: PRODUCT_STATUS_TRANSITIONS[existing.status as FjnProductStatus],
        });
      }
      assertTransitProductStatus(existing.status as FjnProductStatus, toStatus);

      const updated = await tx.fjnProduct.update({
        where: { id },
        data: {
          status: toStatus,
          approvedBy: toStatus === 'approved' ? operatorId : existing.approvedBy,
          approvedAt: toStatus === 'approved' ? new Date() : existing.approvedAt,
        },
      });

      await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_STATUS_CHANGED, {
        productId: id,
        productNo: existing.productNo,
        fromStatus: existing.status,
        toStatus,
        operatorId: operatorId ?? null,
        changedAt: new Date().toISOString(),
      });

      // 触发上下架子事件
      if (toStatus === 'active' && existing.status !== 'active') {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_LISTED, {
          productId: id,
          productNo: existing.productNo,
          listedAt: new Date().toISOString(),
          operatorId: operatorId ?? null,
        });
      } else if (existing.status === 'active' && toStatus !== 'active') {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_DELISTED, {
          productId: id,
          productNo: existing.productNo,
          delistedAt: new Date().toISOString(),
          operatorId: operatorId ?? null,
        });
      }
      if (toStatus === 'paused') {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_PAUSED, {
          productId: id,
          productNo: existing.productNo,
          pausedAt: new Date().toISOString(),
          operatorId: operatorId ?? null,
        });
      }
      if (toStatus === 'archived') {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_ARCHIVED, {
          productId: id,
          productNo: existing.productNo,
          operatorId: operatorId ?? null,
          archivedAt: new Date().toISOString(),
        });
      }
      if (toStatus === 'sold_out') {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_SOLD_OUT, {
          productId: id,
          productNo: existing.productNo,
          soldOutAt: new Date().toISOString(),
          operatorId: operatorId ?? null,
        });
      }

      this.log('info', '商品状态变更', { id, from: existing.status, to: toStatus });
      return updated;
    });
  }

  /**
   * 库存调整
   */
  async adjustStock(input: StockChangeInput) {
    if (!isValidStockChangeType(input.changeType)) {
      throw new ProductStockChangeTypeInvalidError({ changeType: input.changeType });
    }
    if (!isValidProductStock(input.delta)) {
      throw new ProductStockInvalidError({ delta: input.delta });
    }

    return this.withTransaction(async (tx) => {
      const product = await tx.fjnProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ productId: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ productId: input.productId });

      const newStock = product.stock + input.delta;
      if (newStock < 0) {
        throw new ProductStockInsufficientError({
          productId: input.productId,
          current: product.stock,
          delta: input.delta,
          wouldBe: newStock,
        });
      }

      const updated = await tx.fjnProduct.update({
        where: { id: input.productId },
        data: { stock: newStock },
      });

      await tx.fjnProductInventoryLog.create({
        data: {
          productId: input.productId,
          changeType: input.changeType,
          changeQty: input.delta,
          beforeStock: product.stock,
          afterStock: newStock,
          remark: input.note,
          operatorId: input.operatorId,
        },
      });

      // 触发子事件
      if (newStock === 0 && product.status === 'active') {
        await tx.fjnProduct.update({
          where: { id: input.productId },
          data: { status: 'sold_out' },
        });
        await this.emitEvent(tx, PRODUCT_EVENTS.STOCK_DEPLETED, {
          productId: input.productId,
          productNo: product.productNo,
          finalStock: newStock,
          depletedAt: new Date().toISOString(),
        });
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_STATUS_CHANGED, {
          productId: input.productId,
          productNo: product.productNo,
          fromStatus: product.status,
          toStatus: 'sold_out',
          reason: 'stock_depleted',
          operatorId: input.operatorId ?? null,
          changedAt: new Date().toISOString(),
        });
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_SOLD_OUT, {
          productId: input.productId,
          productNo: product.productNo,
          soldOutAt: new Date().toISOString(),
          operatorId: input.operatorId ?? null,
        });
      } else if (product.stock === 0 && newStock > 0) {
        await this.emitEvent(tx, PRODUCT_EVENTS.STOCK_RESTORED, {
          productId: input.productId,
          productNo: product.productNo,
          newStock,
          restoredAt: new Date().toISOString(),
        });
      }

      await this.emitEvent(tx, PRODUCT_EVENTS.STOCK_ADJUSTED, {
        productId: input.productId,
        productNo: product.productNo,
        changeType: input.changeType,
        delta: input.delta,
        beforeStock: product.stock,
        afterStock: newStock,
        note: input.note,
        operatorId: input.operatorId ?? null,
        adjustedAt: new Date().toISOString(),
      });

      this.log('info', '库存调整', { productId: input.productId, delta: input.delta, newStock });
      return updated;
    });
  }

  /**
   * 软删除
   */
  async softDelete(id: string, operatorId?: string) {
    const product = await this.prisma.fjnProduct.findUnique({ where: { id } });
    if (!product) throw new ProductNotFoundError({ id });
    if (product.deletedAt) throw new ProductDeletedError({ id });
    if (product.status === 'active') {
      throw new ProductActiveDeleteForbiddenError({ id, status: product.status });
    }

    return this.withTransaction(async (tx) => {
      const result = await tx.fjnProduct.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_DELETED, {
        productId: id,
        productNo: product.productNo,
        operatorId: operatorId ?? null,
        deletedAt: new Date().toISOString(),
      });
      this.log('info', '商品已删除', { id, operatorId });
      return result;
    });
  }

  // ============================================================
  // 业务便捷方法
  // ============================================================

  /** 提交审核（draft → pending_review） */
  async submitForReview(id: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'pending_review', operatorId).then(async (r) => {
      // 单独发 submit 事件
      const product = await this.findById(id);
      if (product) {
        await (this.prisma as any).outboxEvent.create({
          data: {
            eventType: PRODUCT_EVENTS.PRODUCT_SUBMITTED_FOR_REVIEW,
            payload: {
              productId: id,
              productNo: product.productNo,
              submittedAt: new Date().toISOString(),
              operatorId: operatorId ?? null,
              occurred_at: new Date().toISOString(),
              source: PRODUCT_EVENT_SOURCES.PRODUCT_SERVICE,
            },
            status: 'pending',
            retryCount: 0,
          },
        });
      }
      return r;
    });
  }

  /** 审核（pending_review → approved/draft） */
  async review(input: ReviewProductInput): Promise<any> {
    if (!input.operatorId) throw new ProductReviewRequiredError({ operatorId: 'required' });
    if (!input.approved && !input.reason) {
      throw new ProductReviewReasonRequiredError();
    }
    const target = input.approved ? 'approved' : 'draft';
    return this.withTransaction(async (tx) => {
      const result = await this.changeStatus(input.productId, target, input.operatorId);
      if (input.approved) {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_APPROVED, {
          productId: input.productId,
          productNo: result.productNo,
          approvedBy: input.operatorId,
          approvedAt: new Date().toISOString(),
        });
      } else {
        await this.emitEvent(tx, PRODUCT_EVENTS.PRODUCT_REJECTED, {
          productId: input.productId,
          productNo: result.productNo,
          reason: input.reason ?? 'unspecified',
          rejectedAt: new Date().toISOString(),
          operatorId: input.operatorId,
        });
      }
      return result;
    });
  }

  /** 上架（approved → active） */
  async listProduct(id: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'active', operatorId);
  }

  /** 下架（active → inactive） */
  async delistProduct(id: string, reason?: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'inactive', operatorId);
  }

  /** 暂停（active → paused） */
  async pauseProduct(id: string, reason?: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'paused', operatorId);
  }

  /** 恢复（paused → active） */
  async resumeProduct(id: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'active', operatorId);
  }

  /** 归档（任意 → archived） */
  async archiveProduct(id: string, reason?: string, operatorId?: string): Promise<any> {
    return this.changeStatus(id, 'archived', operatorId);
  }

  // ============================================================
  // 权益管理
  // ============================================================

  /** 添加权益 */
  async addBenefit(input: AddBenefitInput): Promise<any> {
    if (!input.benefitType) throw new ProductBenefitTypeInvalidError({ benefitType: input.benefitType });
    if (!input.amount) throw new ProductBenefitAmountInvalidError({ amount: input.amount });
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnProduct.findUnique({
        where: { id: input.productId },
        include: { benefits: true },
      });
      if (!product) throw new ProductNotFoundError({ productId: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ productId: input.productId });
      if (product.benefits.length >= PRODUCT_BENEFIT_MAX_COUNT) {
        throw new ProductBenefitLimitExceededError({
          productId: input.productId,
          count: product.benefits.length,
          max: PRODUCT_BENEFIT_MAX_COUNT,
        });
      }
      const benefit = await tx.fjnProductBenefit.create({
        data: {
          productId: input.productId,
          benefitType: input.benefitType,
          amount: input.amount,
          description: input.description,
          config: input.config as any,
        },
      });
      await this.emitEvent(tx, PRODUCT_EVENTS.BENEFIT_ADDED, {
        productId: input.productId,
        productNo: product.productNo,
        benefitId: benefit.id,
        benefitType: benefit.benefitType,
        amount: benefit.amount.toString(),
        operatorId: input.operatorId ?? null,
        addedAt: new Date().toISOString(),
      });
      this.log('info', '添加权益', { productId: input.productId, benefitId: benefit.id });
      return benefit;
    });
  }

  /** 移除权益 */
  async removeBenefit(input: RemoveBenefitInput): Promise<void> {
    return this.withTransaction(async (tx) => {
      const benefit = await tx.fjnProductBenefit.findUnique({
        where: { id: input.benefitId },
      });
      if (!benefit || benefit.productId !== input.productId) {
        throw new ProductBenefitNotFoundError({ benefitId: input.benefitId });
      }
      await tx.fjnProductBenefit.delete({ where: { id: input.benefitId } });
      const product = await tx.fjnProduct.findUnique({ where: { id: input.productId } });
      await this.emitEvent(tx, PRODUCT_EVENTS.BENEFIT_REMOVED, {
        productId: input.productId,
        productNo: product?.productNo ?? '',
        benefitId: input.benefitId,
        reason: input.reason,
        operatorId: input.operatorId ?? null,
        removedAt: new Date().toISOString(),
      });
      this.log('info', '移除权益', { benefitId: input.benefitId });
    });
  }

  // ============================================================
  // 地区规则
  // ============================================================

  /** 添加地区规则 */
  async addRegionRule(input: AddRegionRuleInput): Promise<any> {
    if (!input.regionCode) throw new ProductRegionRuleNotFoundError({ regionCode: 'required' });
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnProduct.findUnique({
        where: { id: input.productId },
        include: { regionRules: true },
      });
      if (!product) throw new ProductNotFoundError({ productId: input.productId });
      if (product.deletedAt) throw new ProductDeletedError({ productId: input.productId });
      if (product.regionRules.length >= PRODUCT_REGION_RULE_MAX_COUNT) {
        throw new ProductRegionRuleLimitExceededError({
          productId: input.productId,
          count: product.regionRules.length,
          max: PRODUCT_REGION_RULE_MAX_COUNT,
        });
      }
      // 冲突检测：同一 region 已有规则
      const conflict = product.regionRules.find((r: any) => r.regionCode === input.regionCode);
      if (conflict) {
        throw new ProductRegionRuleConflictError({
          productId: input.productId,
          regionCode: input.regionCode,
          existingRuleType: conflict.ruleType,
        });
      }
      const rule = await tx.fjnProductRegionRule.create({
        data: {
          productId: input.productId,
          regionCode: input.regionCode,
          ruleType: input.ruleType,
        },
      });
      await this.emitEvent(tx, PRODUCT_EVENTS.REGION_RULE_ADDED, {
        productId: input.productId,
        productNo: product.productNo,
        regionCode: input.regionCode,
        ruleType: input.ruleType,
        operatorId: input.operatorId ?? null,
        addedAt: new Date().toISOString(),
      });
      this.log('info', '添加地区规则', { productId: input.productId, regionCode: input.regionCode });
      return rule;
    });
  }

  /** 移除地区规则 */
  async removeRegionRule(input: RemoveRegionRuleInput): Promise<void> {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnProductRegionRule.findFirst({
        where: { productId: input.productId, regionCode: input.regionCode },
      });
      if (!rule) {
        throw new ProductRegionRuleNotFoundError({
          productId: input.productId,
          regionCode: input.regionCode,
        });
      }
      await tx.fjnProductRegionRule.delete({ where: { id: rule.id } });
      const product = await tx.fjnProduct.findUnique({ where: { id: input.productId } });
      await this.emitEvent(tx, PRODUCT_EVENTS.REGION_RULE_REMOVED, {
        productId: input.productId,
        productNo: product?.productNo ?? '',
        regionCode: input.regionCode,
        reason: input.reason,
        operatorId: input.operatorId ?? null,
        removedAt: new Date().toISOString(),
      });
      this.log('info', '移除地区规则', { regionCode: input.regionCode });
    });
  }

  // ============================================================
  // 规则绑定
  // ============================================================

  /** 添加规则绑定 */
  async addRuleBinding(input: AddRuleBindingInput): Promise<any> {
    if (!input.ruleType || !input.ruleCode) {
      throw new ProductRuleBindingInvalidError({ ruleType: input.ruleType, ruleCode: input.ruleCode });
    }
    return this.withTransaction(async (tx) => {
      const product = await tx.fjnProduct.findUnique({ where: { id: input.productId } });
      if (!product) throw new ProductNotFoundError({ productId: input.productId });
      const binding = await tx.fjnProductRuleBinding.create({
        data: {
          productId: input.productId,
          ruleType: input.ruleType,
          ruleCode: input.ruleCode,
        },
      });
      await this.emitEvent(tx, PRODUCT_EVENTS.RULE_BINDING_ADDED, {
        productId: input.productId,
        productNo: product.productNo,
        ruleType: input.ruleType,
        ruleCode: input.ruleCode,
        operatorId: input.operatorId ?? null,
        addedAt: new Date().toISOString(),
      });
      this.log('info', '添加规则绑定', { productId: input.productId, ruleCode: input.ruleCode });
      return binding;
    });
  }

  /** 移除规则绑定 */
  async removeRuleBinding(input: RemoveRuleBindingInput): Promise<void> {
    return this.withTransaction(async (tx) => {
      const binding = await tx.fjnProductRuleBinding.findFirst({
        where: { productId: input.productId, ruleType: input.ruleType, ruleCode: input.ruleCode },
      });
      if (!binding) {
        throw new ProductRuleBindingNotFoundError({
          productId: input.productId,
          ruleType: input.ruleType,
          ruleCode: input.ruleCode,
        });
      }
      await tx.fjnProductRuleBinding.delete({ where: { id: binding.id } });
      const product = await tx.fjnProduct.findUnique({ where: { id: input.productId } });
      await this.emitEvent(tx, PRODUCT_EVENTS.RULE_BINDING_REMOVED, {
        productId: input.productId,
        productNo: product?.productNo ?? '',
        ruleType: input.ruleType,
        ruleCode: input.ruleCode,
        reason: input.reason,
        operatorId: input.operatorId ?? null,
        removedAt: new Date().toISOString(),
      });
      this.log('info', '移除规则绑定', { ruleCode: input.ruleCode });
    });
  }

  // ============================================================
  // 校验
  // ============================================================

  private validateCreateInput(input: CreateProductInput): void {
    if (!input.name || input.name.length < 1) {
      throw new ProductNameRequiredError();
    }
    if (!input.productType) {
      throw new ProductTypeRequiredError();
    }
    if (!isValidProductType(input.productType)) {
      throw new ProductTypeInvalidError({ productType: input.productType });
    }
    if (!input.price) {
      throw new ProductPriceRequiredError();
    }
    if (!isValidProductPrice(input.price)) {
      throw new ProductPriceInvalidError({ price: input.price });
    }
    if (input.name.length > PRODUCT_NAME_MAX_LENGTH) {
      throw new ProductNameTooLongError({ max: PRODUCT_NAME_MAX_LENGTH, name: input.name });
    }
    if (input.subtitle && input.subtitle.length > PRODUCT_SUBTITLE_MAX_LENGTH) {
      throw new ProductSubtitleTooLongError({ max: PRODUCT_SUBTITLE_MAX_LENGTH });
    }
    if (input.description && input.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
      throw new ProductDescriptionTooLongError({ max: PRODUCT_DESCRIPTION_MAX_LENGTH });
    }
    if (input.stock !== undefined && !isValidProductStock(input.stock)) {
      throw new ProductStockInvalidError({ stock: input.stock });
    }
    if (input.gallery && Array.isArray(input.gallery) && input.gallery.length > PRODUCT_GALLERY_MAX_COUNT) {
      throw new ProductGalleryLimitExceededError({
        count: input.gallery.length,
        max: PRODUCT_GALLERY_MAX_COUNT,
      });
    }
    if (input.taxMode && input.taxMode !== 'inclusive' && input.taxMode !== 'exclusive') {
      throw new ProductTaxModeInvalidError({ taxMode: input.taxMode });
    }
    const windowCheck = isValidSaleWindow(input.saleStartTime, input.saleEndTime);
    if (!windowCheck.valid) {
      throw new ProductSaleWindowInvalidError({ reason: windowCheck.reason });
    }
  }

  private validateUpdateInput(_input: UpdateProductInput): void {
    // 已在 update() 中做细粒度校验；此处保留 hook 位
  }
}

/** 工厂函数 */
export function createFjnProductService(options?: FjnServiceOptions): FjnProductService {
  return new FjnProductService(options);
}
