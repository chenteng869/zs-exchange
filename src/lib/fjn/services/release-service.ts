/**
 * Release Claim Service - 369 生态释放（Solana Anchor Claim）
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.4
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.11
 *
 * 职责：
 *  - Pool 域：createPool / approvePool / markSnapshotReady / markCalculated / openClaim / closePool / cancelPool
 *  - Calculation 域：createCalculations / approveCalculation / markRiskHold / markClaimable / markClaimed
 *  - Claim 域：createClaim / startProcessing / markSucceeded / markFailed / expireOverdueClaims
 *  - Quota 域：getOrCreateQuota / deductQuota / restoreQuota
 *  - 查询：getPool / getCalculation / getClaim / listPools / listCalculations / listClaims
 *
 * 链上集成：Solana Anchor Claim Program（Merkle Proof）
 * 业务真相源：链下账本（FjnReleasePool / FjnReleaseCalculation / FjnReleaseClaim / FjnUserReleaseQuota）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  RELEASE_POOL_TYPE,
  RELEASE_POOL_STATUS,
  RELEASE_CALCULATION_STATUS,
  RELEASE_CLAIM_STATUS,
  RELEASE_RISK_STATUS,
  RELEASE_PAYMENT_TYPE,
  RELEASE_CLAIM_DEFAULT_EXPIRES_DAYS,
  RELEASE_DEFAULT_CURRENCY,
  RELEASE_DEFAULT_CHAIN_ID,
  isValidReleasePoolType,
  isValidReleasePoolStatus,
  isValidReleaseCalculationStatus,
  isValidReleaseClaimStatus,
  isValidReleaseRiskStatus,
  isValidReleasePaymentType,
  canTransitReleasePoolStatus,
  type FjnReleasePoolType,
  type FjnReleasePoolStatus,
  type FjnReleaseCalculationStatus,
  type FjnReleaseClaimStatus,
  type FjnReleaseRiskStatus,
  type FjnReleasePaymentType,
} from './release-state-machine';
import {
  RELEASE_EVENTS,
  RELEASE_EVENT_SOURCES,
  type FjnReleaseEventSource,
} from './release-events';
import {
  ReleasePoolNotFoundError,
  ReleasePoolExistsError,
  ReleasePoolStatusInvalidError,
  ReleasePoolNotApprovableError,
  ReleasePoolNotClaimableError,
  ReleasePoolAlreadyClosedError,
  ReleasePoolAlreadyCancelledError,
  ReleasePoolTotalInvalidError,
  ReleasePoolPeriodInvalidError,
  ReleasePoolNameRequiredError,
  ReleasePoolTypeInvalidError,
  ReleasePoolApproverRequiredError,
  ReleasePoolMerkleRootRequiredError,
  ReleaseCalculationNotFoundError,
  ReleaseCalculationExistsError,
  ReleaseCalculationStatusInvalidError,
  ReleaseCalculationNotApprovableError,
  ReleaseCalculationRatioInvalidError,
  ReleaseCalculationAmountInvalidError,
  ReleaseCalculationMonthlyCapExceededError,
  ReleaseCalculationRiskBlockedError,
  ReleaseCalculationUserIdRequiredError,
  ReleaseCalculationEffectivePowerInvalidError,
  ReleaseCalculationNetworkTotalInvalidError,
  ReleaseCalculationPrecisionLossError,
  ReleaseClaimNotFoundError,
  ReleaseClaimStatusInvalidError,
  ReleaseClaimNotClaimableError,
  ReleaseClaimAlreadyClaimedError,
  ReleaseClaimExpiredError,
  ReleaseClaimRiskHoldError,
  ReleaseClaimMerkleProofInvalidError,
  ReleaseClaimTxHashDuplicateError,
  ReleaseClaimAmountExceedsClaimableError,
  ReleaseClaimAmountInvalidError,
  ReleaseClaimBlockNumberInvalidError,
  ReleaseClaimSolanaFailedError,
  ReleaseClaimUserQuotaExceededError,
  ReleaseQuotaNotFoundError,
  ReleaseQuotaInsufficientError,
  ReleaseQuotaPeriodInvalidError,
  ReleaseUserIdRequiredError,
  ReleaseCurrencyInvalidError,
} from './release-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建释放池 */
export interface CreateReleasePoolInput {
  poolName: string;
  period: string;        // YYYY-MM
  poolType: FjnReleasePoolType;
  totalAmount: string;   // decimal string
  currency?: string;
  description?: string;
  monthlyCap?: string;   // 用户月度上限
  createdBy?: string;
}

/** 批准释放池 */
export interface ApproveReleasePoolInput {
  poolId: string;
  approverId: string;
  comment?: string;
}

/** 标记 SnapshotReady（外部 job 写入 FjnPowerSnapshot 后调用） */
export interface MarkSnapshotReadyInput {
  poolId: string;
  merkleRoot: string;
  merkleTreeData: Prisma.InputJsonValue;
  networkPower: string;
  networkUsers: number;
  operatorId?: string;
}

/** 标记 Calculated（所有 calculation 计算完成后） */
export interface MarkCalculatedInput {
  poolId: string;
  operatorId?: string;
}

/** 标记 RiskChecking */
export interface MarkRiskCheckingInput {
  poolId: string;
  operatorId?: string;
}

/** 开放 Claim */
export interface OpenClaimInput {
  poolId: string;
  claimExpiresAt?: Date;
  operatorId?: string;
}

/** 关闭 Claim */
export interface ClosePoolInput {
  poolId: string;
  reason: string;
  operatorId?: string;
}

/** 取消 Pool */
export interface CancelPoolInput {
  poolId: string;
  reason: string;
  operatorId?: string;
}

/** 创建单用户 Calculation */
export interface CreateCalculationInput {
  poolId: string;
  userId: string;
  userEffectivePower: string;
  networkTotalPower: string;
  monthlyCap?: string;
  riskCoefficient?: string;
  riskStatus?: FjnReleaseRiskStatus;
}

/** 批准 Calculation */
export interface ApproveCalculationInput {
  calculationId: string;
  approverId: string;
}

/** 标记 Calculation 风控 hold */
export interface MarkCalculationRiskHoldInput {
  calculationId: string;
  reason: string;
  operatorId?: string;
}

/** 标记 Calculation 可领取 */
export interface MarkCalculationClaimableInput {
  calculationId: string;
  operatorId?: string;
}

/** 创建 Claim 单 */
export interface CreateReleaseClaimInput {
  poolId: string;
  calculationId: string;
  userId: string;
  /** 默认可领取金额 = calculation.finalAmount */
  claimableAmount?: string;
  merkleProof?: Prisma.InputJsonValue;
  expiresAt?: Date;
}

/** 开始处理 Claim（链上） */
export interface StartProcessingClaimInput {
  claimId: string;
  txHash: string;
  operatorId?: string;
}

/** 标记 Claim 成功 */
export interface MarkClaimSucceededInput {
  claimId: string;
  txHash: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 标记 Claim 失败 */
export interface MarkClaimFailedInput {
  claimId: string;
  reason: string;
  operatorId?: string;
}

/** 分页查询 */
export interface ListReleasePoolsInput {
  page?: number;
  pageSize?: number;
  period?: string;
  poolType?: FjnReleasePoolType;
  status?: FjnReleasePoolStatus;
}

export interface ListReleaseClaimsInput {
  page?: number;
  pageSize?: number;
  poolId?: string;
  userId?: string;
  status?: FjnReleaseClaimStatus;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface ReleasePoolSummary {
  id: string;
  poolNo: string;
  poolName: string;
  period: string;
  poolType: FjnReleasePoolType;
  totalAmount: string;
  currency: string;
  status: FjnReleasePoolStatus;
  merkleRoot?: string | null;
  networkPower?: string | null;
  networkUsers?: number | null;
  claimOpenAt?: Date | null;
  claimCloseAt?: Date | null;
}

export interface ReleaseClaimSummary {
  id: string;
  claimNo: string;
  poolId: string;
  calculationId: string;
  userId: string;
  claimableAmount: string;
  claimedAmount: string;
  status: FjnReleaseClaimStatus;
  txHash?: string | null;
  expiresAt?: Date | null;
  claimedAt?: Date | null;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnReleaseService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnReleaseService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generatePoolNo(): string {
    return `REL-POOL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateCalculationNo(): string {
    return `REL-CAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateClaimNo(): string {
    return `REL-CLM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 校验 period 格式：YYYY-MM */
  private isValidPeriod(period: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnReleaseEventSource = RELEASE_EVENT_SOURCES.RELEASE_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: {
          ...payload,
          occurred_at: new Date().toISOString(),
          source,
        },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  /** Solana Anchor Claim 链上调用（占位） */
  private async callSolanaAnchorClaim(
    poolNo: string,
    claimNo: string,
    userId: string,
    amount: string,
    merkleProof: any,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const txHash = `mock-claim-${claimNo}-${Date.now()}`;
    const blockNumber = Math.floor(Date.now() / 1000) % 100000000;
    this.log('info', `Solana Anchor Claim placeholder`, { poolNo, claimNo, userId, amount, txHash, blockNumber });
    return { txHash, blockNumber };
  }

  // ==========================================================
  // 3.1 Pool 域（7 个方法）
  // ==========================================================

  /**
   * 创建释放池
   *  - 校验 name / totalAmount / period
   *  - 状态：created
   */
  async createPool(input: CreateReleasePoolInput) {
    if (!input.poolName) throw new ReleasePoolNameRequiredError();
    if (!isValidReleasePoolType(input.poolType)) {
      throw new ReleasePoolTypeInvalidError({ poolType: input.poolType });
    }
    if (!this.isValidPeriod(input.period)) {
      throw new ReleasePoolPeriodInvalidError({ period: input.period });
    }
    const total = new Prisma.Decimal(input.totalAmount);
    if (total.lte(0)) {
      throw new ReleasePoolTotalInvalidError({ totalAmount: input.totalAmount });
    }
    const currency = input.currency ?? RELEASE_DEFAULT_CURRENCY;
    if (!currency) throw new ReleaseCurrencyInvalidError({ currency });

    return this.withTransaction(async (tx) => {
      const poolNo = this.generatePoolNo();
      const created = await (tx as any).fjnReleasePool.create({
        data: {
          poolNo,
          poolName: input.poolName,
          period: input.period,
          poolType: input.poolType,
          totalAmount: total,
          currency,
          status: RELEASE_POOL_STATUS.CREATED,
          description: input.description ?? null,
          createdBy: input.createdBy ?? null,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_CREATED, {
        poolNo,
        poolName: input.poolName,
        period: input.period,
        poolType: input.poolType,
        totalAmount: total.toString(),
        currency,
        operatorId: input.createdBy,
      });

      this.log('info', `Release pool created: ${poolNo}`, { period: input.period });
      return created as ReleasePoolSummary & { createdAt: Date; updatedAt: Date };
    });
  }

  /** 批准 Pool（created → approved） */
  async approvePool(input: ApproveReleasePoolInput) {
    if (!input.approverId) throw new ReleasePoolApproverRequiredError();

    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (pool.status === RELEASE_POOL_STATUS.APPROVED) return pool;
      if (pool.status === RELEASE_POOL_STATUS.CANCELLED) {
        throw new ReleasePoolAlreadyCancelledError({ poolNo: pool.poolNo });
      }
      if (!canTransitReleasePoolStatus(pool.status, RELEASE_POOL_STATUS.APPROVED)) {
        throw new ReleasePoolNotApprovableError({ poolNo: pool.poolNo, currentStatus: pool.status });
      }

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: {
          status: RELEASE_POOL_STATUS.APPROVED,
          approvedBy: input.approverId,
          approvedAt: new Date(),
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_APPROVED, {
        poolNo: pool.poolNo,
        approverId: input.approverId,
        comment: input.comment,
      });

      this.log('info', `Release pool approved: ${pool.poolNo}`, { approverId: input.approverId });
      return updated;
    });
  }

  /** 标记 SnapshotReady（approved → snapshot_ready） */
  async markSnapshotReady(input: MarkSnapshotReadyInput) {
    if (!input.merkleRoot) throw new ReleasePoolMerkleRootRequiredError();

    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (!canTransitReleasePoolStatus(pool.status, RELEASE_POOL_STATUS.SNAPSHOT_READY)) {
        throw new ReleasePoolStatusInvalidError({
          poolNo: pool.poolNo,
          from: pool.status,
          to: RELEASE_POOL_STATUS.SNAPSHOT_READY,
        });
      }

      const networkPower = new Prisma.Decimal(input.networkPower);
      if (networkPower.lte(0)) {
        throw new ReleaseCalculationNetworkTotalInvalidError({ networkPower: input.networkPower });
      }

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: {
          status: RELEASE_POOL_STATUS.SNAPSHOT_READY,
          merkleRoot: input.merkleRoot,
          merkleTreeData: input.merkleTreeData,
          networkPower,
          networkUsers: input.networkUsers,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_SNAPSHOT_READY, {
        poolNo: pool.poolNo,
        merkleRoot: input.merkleRoot,
        networkPower: input.networkPower,
        networkUsers: input.networkUsers,
        operatorId: input.operatorId,
      });

      this.log('info', `Release pool snapshot ready: ${pool.poolNo}`, { networkUsers: input.networkUsers });
      return updated;
    });
  }

  /** 标记 Calculated（snapshot_ready → calculated） */
  async markCalculated(input: MarkCalculatedInput) {
    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (!canTransitReleasePoolStatus(pool.status, RELEASE_POOL_STATUS.CALCULATED)) {
        throw new ReleasePoolStatusInvalidError({ poolNo: pool.poolNo, from: pool.status });
      }
      if (!pool.merkleRoot) throw new ReleasePoolMerkleRootRequiredError({ poolNo: pool.poolNo });

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: {
          status: RELEASE_POOL_STATUS.CALCULATED,
          calculatedAt: new Date(),
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_CALCULATED, {
        poolNo: pool.poolNo,
        operatorId: input.operatorId,
      });

      this.log('info', `Release pool calculated: ${pool.poolNo}`);
      return updated;
    });
  }

  /** 标记 RiskChecking */
  async markRiskChecking(input: MarkRiskCheckingInput) {
    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (!canTransitReleasePoolStatus(pool.status, RELEASE_POOL_STATUS.RISK_CHECKING)) {
        throw new ReleasePoolStatusInvalidError({ poolNo: pool.poolNo, from: pool.status });
      }

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: { status: RELEASE_POOL_STATUS.RISK_CHECKING },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_RISK_CHECKING, {
        poolNo: pool.poolNo,
        operatorId: input.operatorId,
      });

      this.log('info', `Release pool risk checking: ${pool.poolNo}`);
      return updated;
    });
  }

  /** 开放 Claim（risk_checking → claim_open） */
  async openClaim(input: OpenClaimInput) {
    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (!canTransitReleasePoolStatus(pool.status, RELEASE_POOL_STATUS.CLAIM_OPEN)) {
        throw new ReleasePoolStatusInvalidError({ poolNo: pool.poolNo, from: pool.status });
      }
      if (!pool.merkleRoot) throw new ReleasePoolMerkleRootRequiredError({ poolNo: pool.poolNo });

      const claimOpenAt = new Date();
      const claimCloseAt = input.claimExpiresAt ?? new Date(claimOpenAt.getTime() + RELEASE_CLAIM_DEFAULT_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: {
          status: RELEASE_POOL_STATUS.CLAIM_OPEN,
          claimOpenAt,
          claimCloseAt,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_CLAIM_OPEN, {
        poolNo: pool.poolNo,
        merkleRoot: pool.merkleRoot,
        totalAmount: pool.totalAmount.toString(),
        networkPower: pool.networkPower?.toString() ?? '0',
        networkUsers: pool.networkUsers ?? 0,
        claimCloseAt: claimCloseAt.toISOString(),
        operatorId: input.operatorId,
      });

      this.log('info', `Release pool claim open: ${pool.poolNo}`);
      return updated;
    });
  }

  /** 关闭 Pool（claim_open → closed） */
  async closePool(input: ClosePoolInput) {
    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (pool.status === RELEASE_POOL_STATUS.CLOSED) {
        throw new ReleasePoolAlreadyClosedError({ poolNo: pool.poolNo });
      }
      if (pool.status !== RELEASE_POOL_STATUS.CLAIM_OPEN) {
        throw new ReleasePoolStatusInvalidError({ poolNo: pool.poolNo, from: pool.status });
      }
      if (!input.reason) throw new FjnValidationError('Close reason is required', { poolId: input.poolId });

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: {
          status: RELEASE_POOL_STATUS.CLOSED,
          claimCloseAt: new Date(),
        },
      });

      // 关闭时把未领取的 claim 标记为 expired
      await (tx as any).fjnReleaseClaim.updateMany({
        where: { poolId: input.poolId, status: { in: [RELEASE_CLAIM_STATUS.CLAIMABLE, RELEASE_CLAIM_STATUS.PENDING] } },
        data: { status: RELEASE_CLAIM_STATUS.EXPIRED, failureReason: input.reason },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_CLOSED, {
        poolNo: pool.poolNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Release pool closed: ${pool.poolNo}`, { reason: input.reason });
      return updated;
    });
  }

  /** 取消 Pool（任意非终态 → cancelled） */
  async cancelPool(input: CancelPoolInput) {
    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (pool.status === RELEASE_POOL_STATUS.CANCELLED) {
        throw new ReleasePoolAlreadyCancelledError({ poolNo: pool.poolNo });
      }
      if (pool.status === RELEASE_POOL_STATUS.CLOSED) {
        throw new ReleasePoolAlreadyClosedError({ poolNo: pool.poolNo });
      }
      if (!input.reason) throw new FjnValidationError('Cancel reason is required', { poolId: input.poolId });

      const updated = await (tx as any).fjnReleasePool.update({
        where: { id: input.poolId },
        data: { status: RELEASE_POOL_STATUS.CANCELLED },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.POOL_CANCELLED, {
        poolNo: pool.poolNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('warn', `Release pool cancelled: ${pool.poolNo}`, { reason: input.reason });
      return updated;
    });
  }

  // ==========================================================
  // 3.2 Calculation 域（5 个方法）
  // ==========================================================

  /**
   * 创建单用户 Calculation
   *  - 计算 userRatio = userEffectivePower / networkTotalPower
   *  - calculatedAmount = pool.totalAmount * userRatio
   *  - monthlyCap 控制：finalAmount = min(calculatedAmount, monthlyCap)
   *  - 风险系数：finalAmount *= riskCoefficient
   */
  async createCalculation(input: CreateCalculationInput) {
    if (!input.userId) throw new ReleaseCalculationUserIdRequiredError();
    const userPower = new Prisma.Decimal(input.userEffectivePower);
    const networkPower = new Prisma.Decimal(input.networkTotalPower);
    if (userPower.lt(0)) {
      throw new ReleaseCalculationEffectivePowerInvalidError({ userEffectivePower: input.userEffectivePower });
    }
    if (networkPower.lte(0)) {
      throw new ReleaseCalculationNetworkTotalInvalidError({ networkTotalPower: input.networkTotalPower });
    }

    return this.withTransaction(async (tx) => {
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: input.poolId } });
      if (!pool) throw new ReleasePoolNotFoundError({ poolId: input.poolId });
      if (pool.status === RELEASE_POOL_STATUS.CANCELLED || pool.status === RELEASE_POOL_STATUS.CLOSED) {
        throw new ReleasePoolStatusInvalidError({ poolNo: pool.poolNo, from: pool.status });
      }

      // 幂等检查
      const existing = await (tx as any).fjnReleaseCalculation.findUnique({
        where: { poolId_userId: { poolId: input.poolId, userId: input.userId } },
      });
      if (existing) throw new ReleaseCalculationExistsError({ poolId: input.poolId, userId: input.userId });

      const userRatio = userPower.div(networkPower);
      if (userRatio.lt(0) || userRatio.gt(1)) {
        throw new ReleaseCalculationRatioInvalidError({ userRatio: userRatio.toString() });
      }

      const calculatedAmount = new Prisma.Decimal(pool.totalAmount).mul(userRatio);
      const monthlyCap = input.monthlyCap ? new Prisma.Decimal(input.monthlyCap) : calculatedAmount;
      const riskCoefficient = input.riskCoefficient ? new Prisma.Decimal(input.riskCoefficient) : new Prisma.Decimal(1);
      const riskStatus = input.riskStatus ?? RELEASE_RISK_STATUS.NORMAL;

      // monthlyCap 截断
      let finalAmount = calculatedAmount.gt(monthlyCap) ? monthlyCap : calculatedAmount;
      // 风险系数调整
      finalAmount = finalAmount.mul(riskCoefficient);
      // 精度：4 位小数
      const roundedFinal = finalAmount.toDecimalPlaces(4, Prisma.Decimal.ROUND_DOWN);
      if (roundedFinal.lt(0)) {
        throw new ReleaseCalculationPrecisionLossError({ finalAmount: finalAmount.toString() });
      }

      const remainingQuota = monthlyCap.minus(roundedFinal);
      const calculationNo = this.generateCalculationNo();

      const created = await (tx as any).fjnReleaseCalculation.create({
        data: {
          calculationNo,
          poolId: input.poolId,
          userId: input.userId,
          userEffectivePower: userPower,
          networkTotalPower: networkPower,
          userRatio,
          calculatedAmount,
          monthlyCap,
          remainingQuota,
          finalAmount: roundedFinal,
          riskCoefficient,
          riskStatus,
          status: RELEASE_CALCULATION_STATUS.CALCULATED,
        },
      });

      // 同步创建/更新用户月配额
      await this.upsertUserQuota(tx, input.userId, input.poolId, roundedFinal, new Prisma.Decimal(0));

      await this.emitEvent(tx, RELEASE_EVENTS.CALCULATION_CREATED, {
        poolNo: pool.poolNo,
        calculationNo,
        userId: input.userId,
        userEffectivePower: userPower.toString(),
        finalAmount: roundedFinal.toString(),
      });

      this.log('info', `Release calculation created: ${calculationNo}`, {
        poolNo: pool.poolNo,
        userId: input.userId,
        finalAmount: roundedFinal.toString(),
      });

      return created;
    });
  }

  /** 批准 Calculation（calculated → approved） */
  async approveCalculation(input: ApproveCalculationInput) {
    return this.withTransaction(async (tx) => {
      const calc = await (tx as any).fjnReleaseCalculation.findUnique({ where: { id: input.calculationId } });
      if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId: input.calculationId });
      if (calc.status === RELEASE_CALCULATION_STATUS.APPROVED) return calc;
      if (calc.status !== RELEASE_CALCULATION_STATUS.CALCULATED) {
        throw new ReleaseCalculationNotApprovableError({ calculationId: input.calculationId, status: calc.status });
      }

      const updated = await (tx as any).fjnReleaseCalculation.update({
        where: { id: input.calculationId },
        data: {
          status: RELEASE_CALCULATION_STATUS.APPROVED,
          approvedBy: input.approverId,
          approvedAt: new Date(),
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CALCULATION_APPROVED, {
        calculationId: input.calculationId,
        approverId: input.approverId,
      });

      this.log('info', `Release calculation approved: ${calc.calculationNo}`);
      return updated;
    });
  }

  /** 标记 Risk Hold */
  async markCalculationRiskHold(input: MarkCalculationRiskHoldInput) {
    if (!input.reason) throw new FjnValidationError('Risk hold reason is required', { calculationId: input.calculationId });
    return this.withTransaction(async (tx) => {
      const calc = await (tx as any).fjnReleaseCalculation.findUnique({ where: { id: input.calculationId } });
      if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId: input.calculationId });
      if (calc.status === RELEASE_CALCULATION_STATUS.CLAIMED) {
        throw new ReleaseCalculationStatusInvalidError({ calculationId: input.calculationId });
      }

      const updated = await (tx as any).fjnReleaseCalculation.update({
        where: { id: input.calculationId },
        data: {
          status: RELEASE_CALCULATION_STATUS.RISK_CHECKING,
          riskStatus: RELEASE_RISK_STATUS.HOLD,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CALCULATION_RISK_HOLD, {
        calculationId: input.calculationId,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('warn', `Release calculation risk hold: ${calc.calculationNo}`, { reason: input.reason });
      return updated;
    });
  }

  /** 标记 Claimable（approved → claimable） */
  async markCalculationClaimable(input: MarkCalculationClaimableInput) {
    return this.withTransaction(async (tx) => {
      const calc = await (tx as any).fjnReleaseCalculation.findUnique({ where: { id: input.calculationId } });
      if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId: input.calculationId });
      if (calc.status === RELEASE_CALCULATION_STATUS.CLAIMABLE) return calc;
      if (calc.status !== RELEASE_CALCULATION_STATUS.APPROVED) {
        throw new ReleaseCalculationStatusInvalidError({ calculationId: input.calculationId, status: calc.status });
      }
      if (calc.riskStatus === RELEASE_RISK_STATUS.HOLD || calc.riskStatus === RELEASE_RISK_STATUS.BLOCKED) {
        throw new ReleaseCalculationRiskBlockedError({ calculationId: input.calculationId, riskStatus: calc.riskStatus });
      }

      const updated = await (tx as any).fjnReleaseCalculation.update({
        where: { id: input.calculationId },
        data: { status: RELEASE_CALCULATION_STATUS.CLAIMABLE },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CALCULATION_CLAIMABLE, {
        calculationId: input.calculationId,
        operatorId: input.operatorId,
      });

      this.log('info', `Release calculation claimable: ${calc.calculationNo}`);
      return updated;
    });
  }

  /** 标记 Calculation 已领取（claimable → claimed） */
  async markCalculationClaimed(calculationId: string) {
    return this.withTransaction(async (tx) => {
      const calc = await (tx as any).fjnReleaseCalculation.findUnique({ where: { id: calculationId } });
      if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId });
      if (calc.status === RELEASE_CALCULATION_STATUS.CLAIMED) return calc;

      const updated = await (tx as any).fjnReleaseCalculation.update({
        where: { id: calculationId },
        data: { status: RELEASE_CALCULATION_STATUS.CLAIMED },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CALCULATION_CLAIMED, {
        calculationId,
        userId: calc.userId,
        finalAmount: calc.finalAmount.toString(),
      });

      this.log('info', `Release calculation claimed: ${calc.calculationNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.3 Claim 域（5 个方法）
  // ==========================================================

  /**
   * 创建 Claim 单
   *  - claimableAmount = calculation.finalAmount
   *  - 默认 status: claimable
   */
  async createClaim(input: CreateReleaseClaimInput) {
    if (!input.userId) throw new ReleaseUserIdRequiredError();
    return this.withTransaction(async (tx) => {
      const calc = await (tx as any).fjnReleaseCalculation.findUnique({ where: { id: input.calculationId } });
      if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId: input.calculationId });
      if (calc.userId !== input.userId) {
        throw new FjnValidationError('Calculation userId mismatch', {
          calculationUserId: calc.userId,
          inputUserId: input.userId,
        });
      }
      if (calc.poolId !== input.poolId) {
        throw new FjnValidationError('Calculation poolId mismatch', {
          calculationPoolId: calc.poolId,
          inputPoolId: input.poolId,
        });
      }
      if (calc.status !== RELEASE_CALCULATION_STATUS.CLAIMABLE) {
        throw new ReleaseClaimNotClaimableError({ calculationStatus: calc.status });
      }
      if (calc.riskStatus === RELEASE_RISK_STATUS.HOLD || calc.riskStatus === RELEASE_RISK_STATUS.BLOCKED) {
        throw new ReleaseClaimRiskHoldError({ riskStatus: calc.riskStatus });
      }

      const claimable = input.claimableAmount ? new Prisma.Decimal(input.claimableAmount) : new Prisma.Decimal(calc.finalAmount);
      if (claimable.lte(0)) {
        throw new ReleaseClaimAmountInvalidError({ claimableAmount: claimable.toString() });
      }
      if (claimable.gt(calc.finalAmount)) {
        throw new ReleaseClaimAmountExceedsClaimableError({
          claimable: claimable.toString(),
          finalAmount: calc.finalAmount.toString(),
        });
      }

      // 用户配额检查
      const quota = await (tx as any).fjnUserReleaseQuota.findUnique({
        where: { userId_period: { userId: input.userId, period: this.getPeriodFromPool(calc.poolId) } },
      });
      if (quota && quota.remainingAmount.lt(claimable)) {
        throw new ReleaseClaimUserQuotaExceededError({
          remaining: quota.remainingAmount.toString(),
          requested: claimable.toString(),
        });
      }

      const claimNo = this.generateClaimNo();
      const expiresAt = input.expiresAt ?? new Date(Date.now() + RELEASE_CLAIM_DEFAULT_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

      const created = await (tx as any).fjnReleaseClaim.create({
        data: {
          claimNo,
          poolId: input.poolId,
          calculationId: input.calculationId,
          userId: input.userId,
          claimableAmount: claimable,
          claimedAmount: new Prisma.Decimal(0),
          status: RELEASE_CLAIM_STATUS.CLAIMABLE,
          merkleProof: input.merkleProof ?? null,
          expiresAt,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CLAIM_CREATED, {
        claimNo,
        poolId: input.poolId,
        userId: input.userId,
        claimableAmount: claimable.toString(),
        expiresAt: expiresAt.toISOString(),
      });

      this.log('info', `Release claim created: ${claimNo}`, { userId: input.userId, amount: claimable.toString() });
      return created as ReleaseClaimSummary & { createdAt: Date; updatedAt: Date; failureReason: string | null };
    });
  }

  /** 开始处理 Claim（chain 提交 tx 时） */
  async startProcessingClaim(input: StartProcessingClaimInput) {
    if (!input.txHash) throw new ReleaseClaimTxHashDuplicateError({ txHash: 'required' });
    // 幂等：txHash 检查
    const dup = await (this.prisma as any).fjnReleaseClaim.findFirst({ where: { txHash: input.txHash } });
    if (dup) throw new ReleaseClaimTxHashDuplicateError({ txHash: input.txHash });

    return this.withTransaction(async (tx) => {
      const claim = await (tx as any).fjnReleaseClaim.findUnique({ where: { id: input.claimId } });
      if (!claim) throw new ReleaseClaimNotFoundError({ claimId: input.claimId });
      if (claim.status !== RELEASE_CLAIM_STATUS.CLAIMABLE) {
        throw new ReleaseClaimNotClaimableError({ claimId: input.claimId, status: claim.status });
      }
      if (claim.expiresAt && claim.expiresAt < new Date()) {
        throw new ReleaseClaimExpiredError({ claimId: input.claimId, expiresAt: claim.expiresAt });
      }

      const updated = await (tx as any).fjnReleaseClaim.update({
        where: { id: input.claimId },
        data: {
          status: RELEASE_CLAIM_STATUS.PROCESSING,
          txHash: input.txHash,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CLAIM_PROCESSING, {
        claimNo: claim.claimNo,
        txHash: input.txHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Release claim processing: ${claim.claimNo}`, { txHash: input.txHash });
      return updated;
    });
  }

  /**
   * 标记 Claim 成功（链上 tx confirmed 后）
   *  - 同步：deduct user quota + mark calculation claimed
   */
  async markClaimSucceeded(input: MarkClaimSucceededInput) {
    if (!input.txHash) throw new ReleaseClaimTxHashDuplicateError({ txHash: 'required' });
    if (input.blockNumber !== undefined && input.blockNumber !== null) {
      const bn = typeof input.blockNumber === 'bigint' ? input.blockNumber : BigInt(input.blockNumber);
      if (bn < 0n) throw new ReleaseClaimBlockNumberInvalidError({ blockNumber: bn.toString() });
    }

    return this.withTransaction(async (tx) => {
      const claim = await (tx as any).fjnReleaseClaim.findUnique({ where: { id: input.claimId } });
      if (!claim) throw new ReleaseClaimNotFoundError({ claimId: input.claimId });
      if (claim.status === RELEASE_CLAIM_STATUS.CLAIMED) return claim;
      if (claim.status !== RELEASE_CLAIM_STATUS.PROCESSING) {
        throw new ReleaseClaimStatusInvalidError({ claimId: input.claimId, status: claim.status });
      }
      if (claim.txHash !== input.txHash) {
        throw new ReleaseClaimTxHashDuplicateError({ expected: claim.txHash, actual: input.txHash });
      }

      // 链上 Solana Anchor Claim（占位）
      try {
        await this.callSolanaAnchorClaim(
          (await (tx as any).fjnReleasePool.findUnique({ where: { id: claim.poolId } }))?.poolNo ?? 'unknown',
          claim.claimNo,
          claim.userId,
          claim.claimableAmount.toString(),
          claim.merkleProof,
        );
      } catch (e) {
        throw new ReleaseClaimSolanaFailedError({
          claimNo: claim.claimNo,
          originalError: (e as Error).message,
        });
      }

      // 更新 Claim
      const updated = await (tx as any).fjnReleaseClaim.update({
        where: { id: input.claimId },
        data: {
          status: RELEASE_CLAIM_STATUS.CLAIMED,
          claimedAmount: claim.claimableAmount,
          claimedAt: new Date(),
          blockNumber: input.blockNumber ? BigInt(input.blockNumber) : claim.blockNumber,
        },
      });

      // 扣减用户配额
      await this.deductUserQuota(tx, claim.userId, this.getPeriodFromPool(claim.poolId), claim.claimableAmount);

      // 标记 calculation claimed
      await this.markCalculationClaimed(claim.calculationId);

      // 拿到 pool 信息用于事件
      const pool = await (tx as any).fjnReleasePool.findUnique({ where: { id: claim.poolId } });

      await this.emitEvent(tx, RELEASE_EVENTS.CLAIM_SUCCEEDED, {
        claimNo: claim.claimNo,
        poolNo: pool?.poolNo,
        userId: claim.userId,
        claimedAmount: claim.claimableAmount.toString(),
        txHash: input.txHash,
        blockNumber: input.blockNumber ? BigInt(input.blockNumber).toString() : null,
      });

      this.log('info', `Release claim succeeded: ${claim.claimNo}`, {
        amount: claim.claimableAmount.toString(),
        txHash: input.txHash,
      });
      return updated;
    });
  }

  /** 标记 Claim 失败 */
  async markClaimFailed(input: MarkClaimFailedInput) {
    if (!input.reason) throw new FjnValidationError('Failure reason is required', { claimId: input.claimId });
    return this.withTransaction(async (tx) => {
      const claim = await (tx as any).fjnReleaseClaim.findUnique({ where: { id: input.claimId } });
      if (!claim) throw new ReleaseClaimNotFoundError({ claimId: input.claimId });
      if (claim.status === RELEASE_CLAIM_STATUS.CLAIMED) {
        throw new ReleaseClaimAlreadyClaimedError({ claimNo: claim.claimNo });
      }

      const updated = await (tx as any).fjnReleaseClaim.update({
        where: { id: input.claimId },
        data: {
          status: RELEASE_CLAIM_STATUS.FAILED,
          failureReason: input.reason,
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.CLAIM_FAILED, {
        claimNo: claim.claimNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('warn', `Release claim failed: ${claim.claimNo}`, { reason: input.reason });
      return updated;
    });
  }

  /** 批量把过期 claim 标为 expired */
  async expireOverdueClaims(now: Date = new Date()) {
    return this.withTransaction(async (tx) => {
      const overdue = await (tx as any).fjnReleaseClaim.findMany({
        where: {
          status: { in: [RELEASE_CLAIM_STATUS.CLAIMABLE, RELEASE_CLAIM_STATUS.PENDING] },
          expiresAt: { lt: now },
        },
        take: 200,
      });
      let count = 0;
      for (const claim of overdue) {
        await (tx as any).fjnReleaseClaim.update({
          where: { id: claim.id },
          data: { status: RELEASE_CLAIM_STATUS.EXPIRED, failureReason: 'expired_by_cron' },
        });
        await this.emitEvent(tx, RELEASE_EVENTS.CLAIM_EXPIRED, {
          claimNo: claim.claimNo,
          userId: claim.userId,
          expiresAt: claim.expiresAt?.toISOString(),
        });
        count++;
      }
      this.log('info', `Release claims expired: ${count}`);
      return { count };
    });
  }

  // ==========================================================
  // 3.4 Quota 域（3 个方法）
  // ==========================================================

  private getPeriodFromPool(poolId: string): string {
    // 工业级：应从 FjnReleasePool 查 period；此处用粗略实现（同事务内可用 tx）
    // 调用方应保证传入的 poolId 存在，本方法仅用于提取 period
    return '9999-99'; // fallback
  }

  private async upsertUserQuota(
    tx: any,
    userId: string,
    poolId: string,
    monthlyAmount: Prisma.Decimal,
    alreadyClaimed: Prisma.Decimal,
  ): Promise<void> {
    const period = this.getPeriodFromPool(poolId);
    // 由于无法跨事务查 pool，这里跳过实际 upsert。占位。
    void tx;
    void monthlyAmount;
    void alreadyClaimed;
    void period;
  }

  private async deductUserQuota(
    tx: any,
    userId: string,
    period: string,
    amount: Prisma.Decimal,
  ): Promise<void> {
    const quota = await (tx as any).fjnUserReleaseQuota.findUnique({
      where: { userId_period: { userId, period } },
    });
    if (quota) {
      const newClaimed = new Prisma.Decimal(quota.claimedAmount).plus(amount);
      const newRemaining = new Prisma.Decimal(quota.remainingAmount).minus(amount);
      await (tx as any).fjnUserReleaseQuota.update({
        where: { id: quota.id },
        data: { claimedAmount: newClaimed, remainingAmount: newRemaining },
      });
      await this.emitEvent(tx, RELEASE_EVENTS.QUOTA_DEDUCTED, {
        userId,
        period,
        amount: amount.toString(),
        remainingAfter: newRemaining.toString(),
      });
    }
  }

  /** 公开：恢复用户配额（用于失败回滚） */
  async restoreUserQuota(userId: string, period: string, amount: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const quota = await (tx as any).fjnUserReleaseQuota.findUnique({
        where: { userId_period: { userId, period } },
      });
      if (!quota) throw new ReleaseQuotaNotFoundError({ userId, period });

      const amt = new Prisma.Decimal(amount);
      if (amt.lte(0)) throw new ReleaseClaimAmountInvalidError({ amount });

      const updated = await (tx as any).fjnUserReleaseQuota.update({
        where: { id: quota.id },
        data: {
          claimedAmount: { decrement: amt },
          remainingAmount: { increment: amt },
        },
      });

      await this.emitEvent(tx, RELEASE_EVENTS.QUOTA_RESTORED, {
        userId,
        period,
        amount: amt.toString(),
        operatorId,
      });

      this.log('info', `Release quota restored: ${userId}`, { period, amount: amt.toString() });
      return updated;
    });
  }

  // ==========================================================
  // 3.5 查询域（5 个方法）
  // ==========================================================

  async getPool(poolId: string) {
    const pool = await (this.prisma as any).fjnReleasePool.findUnique({ where: { id: poolId } });
    if (!pool) throw new ReleasePoolNotFoundError({ poolId });
    return pool;
  }

  async getPoolByNo(poolNo: string) {
    const pool = await (this.prisma as any).fjnReleasePool.findUnique({ where: { poolNo } });
    if (!pool) throw new ReleasePoolNotFoundError({ poolNo });
    return pool;
  }

  async getCalculation(calculationId: string) {
    const calc = await (this.prisma as any).fjnReleaseCalculation.findUnique({ where: { id: calculationId } });
    if (!calc) throw new ReleaseCalculationNotFoundError({ calculationId });
    return calc;
  }

  async getClaim(claimId: string) {
    const claim = await (this.prisma as any).fjnReleaseClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new ReleaseClaimNotFoundError({ claimId });
    return claim;
  }

  async getClaimByNo(claimNo: string) {
    const claim = await (this.prisma as any).fjnReleaseClaim.findUnique({ where: { claimNo } });
    if (!claim) throw new ReleaseClaimNotFoundError({ claimNo });
    return claim;
  }

  async listPools(input: ListReleasePoolsInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const where: any = {};
    if (input.period) where.period = input.period;
    if (input.poolType) where.poolType = input.poolType;
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnReleasePool.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
      }),
      (this.prisma as any).fjnReleasePool.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listCalculations(poolId: string, userId?: string) {
    const where: any = { poolId };
    if (userId) where.userId = userId;
    return (this.prisma as any).fjnReleaseCalculation.findMany({
      where,
      orderBy: { finalAmount: 'desc' },
    });
  }

  async listClaims(input: ListReleaseClaimsInput = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const where: any = {};
    if (input.poolId) where.poolId = input.poolId;
    if (input.userId) where.userId = input.userId;
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnReleaseClaim.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).fjnReleaseClaim.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** 用户的可领取 claim 列表 */
  async getUserClaimableClaims(userId: string) {
    return (this.prisma as any).fjnReleaseClaim.findMany({
      where: {
        userId,
        status: RELEASE_CLAIM_STATUS.CLAIMABLE,
        expiresAt: { gt: new Date() },
      },
      include: { pool: { select: { poolNo: true, poolName: true, period: true, currency: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 用户释放汇总
   *  - 累计已领取
   *  - 当前可领取
   *  - 历史 pool 参与数
   */
  async getUserReleaseSummary(userId: string) {
    const allClaims = await (this.prisma as any).fjnReleaseClaim.findMany({
      where: { userId },
      include: { pool: { select: { period: true, poolName: true } } },
    });

    let totalClaimed = new Prisma.Decimal(0);
    let totalPending = new Prisma.Decimal(0);
    const poolSet = new Set<string>();
    for (const c of allClaims) {
      poolSet.add(c.poolId);
      if (c.status === RELEASE_CLAIM_STATUS.CLAIMED) {
        totalClaimed = totalClaimed.plus(c.claimedAmount);
      } else if (c.status === RELEASE_CLAIM_STATUS.CLAIMABLE) {
        totalPending = totalPending.plus(c.claimableAmount);
      }
    }

    return {
      userId,
      totalClaimed: totalClaimed.toString(),
      totalPending: totalPending.toString(),
      poolsParticipated: poolSet.size,
      activeClaims: allClaims.filter((c: any) => c.status === RELEASE_CLAIM_STATUS.CLAIMABLE).length,
      completedClaims: allClaims.filter((c: any) => c.status === RELEASE_CLAIM_STATUS.CLAIMED).length,
    };
  }
}
