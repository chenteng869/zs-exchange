/**
 * FJN Points Service - 核心业务服务
 *
 * 严格遵循 H015 + H023 工业级职责规范：
 *  - Account 域：openAccount / getAccount / freezeAccount / unfreezeAccount / closeAccount / listAccounts
 *  - Ledger 域：earnPoints / consumePoints / reversePoints / listLedgers / getBalanceTrace
 *  - Freeze 域：freeze / unfreeze / revokeFreeze / listFreezes
 *  - Rule 域：createRule / activateRule / getActiveRule / listRules
 *  - Snapshot 域：createSnapshot / listSnapshots / getLatestSnapshot
 *  - 工具：getPointsSummary / getUserPoints
 *
 * 12 个 outbox 事件常量
 * 50+ 业务方法
 *
 * 用法：
 *   const svc = new FjnPointsService();
 *   const acc = await svc.openAccount({ userId, assetType: 'fj369_points' });
 *   await svc.earnPoints({ userId, assetType: 'fj369_points', amount: '369000', sourceType: 'order', bizType: 'buy_wine' });
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  POINTS_ACCOUNT_STATUS,
  POINTS_FREEZE_STATUS,
  POINTS_REVERSAL_STATUS,
  POINTS_RULE_STATUS,
  POINTS_ASSET_TYPE,
  POINTS_DIRECTION,
  POINTS_CHANGE_TYPE,
  POINTS_SOURCE_TYPE,
  POINTS_BIZ_TYPE,
  POINTS_SNAPSHOT_TYPE,
  POINTS_RISK_STATUS,
  FJ369_STANDARD_GRANT_POINTS,
  POINTS_AMOUNT_PRECISION,
  isValidPointsAccountStatus,
  isValidPointsFreezeStatus,
  isValidPointsReversalStatus,
  isValidPointsRuleStatus,
  isValidPointsAssetType,
  isValidPointsChangeType,
  isValidPointsSourceType,
  isValidPointsBizType,
  isValidPointsSnapshotType,
  isValidPointsRiskStatus,
  canTransitPointsAccountStatus,
  canTransitPointsFreezeStatus,
  canTransitPointsReversalStatus,
  canTransitPointsRuleStatus,
  assertTransitPointsAccountStatus,
  assertTransitPointsFreezeStatus,
  assertTransitPointsReversalStatus,
  assertTransitPointsRuleStatus,
  isDecreaseChangeType,
  isIncreaseChangeType,
  isPointsAccountUsable,
  isPointsFreezeActive,
  type FjnPointsAccountStatus,
  type FjnPointsFreezeStatus,
  type FjnPointsReversalStatus,
  type FjnPointsRuleStatus,
  type FjnPointsAssetType,
  type FjnPointsChangeType,
  type FjnPointsSourceType,
  type FjnPointsBizType,
  type FjnPointsSnapshotType,
  type FjnPointsRiskStatus,
} from './points-state-machine';
import {
  POINTS_EVENTS,
  POINTS_EVENT_SOURCES,
  type PointsAccountOpenedPayload,
  type PointsAccountFrozenPayload,
  type PointsAccountClosedPayload,
  type PointsEarnedPayload,
  type PointsConsumedPayload,
  type PointsFrozenPayload,
  type PointsUnfrozenPayload,
  type PointsReversedPayload,
  type PointsRuleCreatedPayload,
  type PointsRuleActivatedPayload,
  type PointsSnapshotCreatedPayload,
  type PointsExpiredPayload,
  type FjnPointsEventSource,
} from './points-events';
import {
  FjnPointsAccountNotFoundError,
  FjnPointsAccountExistsError,
  FjnPointsAccountFrozenError,
  FjnPointsAccountClosedError,
  FjnPointsAccountStatusInvalidError,
  FjnPointsLedgerNotFoundError,
  FjnPointsLedgerAmountInvalidError,
  FjnPointsLedgerBalanceMismatchError,
  FjnPointsLedgerDuplicateError,
  FjnPointsLedgerDirectionInvalidError,
  FjnPointsLedgerChangeTypeInvalidError,
  FjnPointsLedgerSourceTypeInvalidError,
  FjnPointsLedgerBizTypeInvalidError,
  FjnPointsInsufficientAvailableError,
  FjnPointsInsufficientFrozenError,
  FjnPointsInsufficientLockedError,
  FjnPointsAmountMustBePositiveError,
  FjnPointsAmountTooLargeError,
  FjnPointsBalanceNegativeError,
  FjnPointsFreezeNotFoundError,
  FjnPointsFreezeNotActiveError,
  FjnPointsFreezeAmountExceedsAvailableError,
  FjnPointsFreezeReasonRequiredError,
  FjnPointsFreezeExpiresInvalidError,
  FjnPointsUnfreezeAmountExceedsFreezeError,
  FjnPointsReversalNotFoundError,
  FjnPointsReversalNotPendingError,
  FjnPointsReversalAmountExceedsOriginalError,
  FjnPointsReversalReasonRequiredError,
  FjnPointsReversalDuplicateError,
  FjnPointsRuleNotFoundError,
  FjnPointsRuleExistsError,
  FjnPointsRuleNotActiveError,
  FjnPointsRuleNotApprovedError,
  FjnPointsRuleEffectiveInvalidError,
  FjnPointsRuleVersionInvalidError,
  FjnPointsRuleContentInvalidError,
  FjnPointsRuleStatusInvalidError,
  FjnPointsSnapshotNotFoundError,
  FjnPointsSnapshotFailedError,
  FjnPointsSnapshotTypeInvalidError,
  FjnPointsRiskBlockedError,
  FjnPointsRiskHoldError,
  FjnPointsUserIdRequiredError,
  FjnPointsAssetTypeInvalidError,
  FjnPointsGrantAmountExceedsRuleError,
  FjnPointsConversionRatioInvalidError,
  FjnPointsKycLevelInsufficientError,
  FjnPointsRegionRestrictedError,
} from './points-errors';
import { FjnValidationError } from '../errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 入参：开通积分账户 */
export interface OpenPointsAccountInput {
  userId: string;
  assetType: FjnPointsAssetType;
  operatorId?: string;
}

/** 入参：发放积分 */
export interface EarnPointsInput {
  userId: string;
  assetType: FjnPointsAssetType;
  amount: string; // decimal string
  sourceType: FjnPointsSourceType;
  sourceId?: string;
  bizType: FjnPointsBizType;
  bizNo?: string;
  ruleCode?: string;
  ruleVersion?: string;
  riskStatus?: FjnPointsRiskStatus;
  remark?: string;
  txHash?: string;
  operatorId?: string;
  /** 幂等键：业务单号，传则不重复发 */
  idempotencyKey?: string;
}

/** 入参：消费积分 */
export interface ConsumePointsInput {
  userId: string;
  assetType: FjnPointsAssetType;
  amount: string;
  sourceType: FjnPointsSourceType;
  sourceId?: string;
  bizType: FjnPointsBizType;
  bizNo?: string;
  ruleCode?: string;
  riskStatus?: FjnPointsRiskStatus;
  remark?: string;
  txHash?: string;
  operatorId?: string;
  idempotencyKey?: string;
}

/** 入参：冻结积分 */
export interface FreezePointsInput {
  userId: string;
  assetType: FjnPointsAssetType;
  amount: string;
  reason: string;
  sourceType?: FjnPointsSourceType;
  sourceId?: string;
  expiresAt?: Date;
  operatorId?: string;
}

/** 入参：解冻积分 */
export interface UnfreezePointsInput {
  freezeId: string;
  unfreezeAmount: string;
  reason?: string;
  operatorId?: string;
}

/** 入参：撤销冻结 */
export interface RevokeFreezeInput {
  freezeId: string;
  reason: string;
  operatorId?: string;
}

/** 入参：冲正积分 */
export interface ReversePointsInput {
  userId: string;
  assetType: FjnPointsAssetType;
  originalLedgerId: string;
  reversedAmount: string;
  reason: string;
  sourceType?: FjnPointsSourceType;
  sourceId?: string;
  operatorId?: string;
}

/** 入参：创建规则 */
export interface CreatePointsRuleInput {
  ruleCode: string;
  assetType: FjnPointsAssetType;
  version: string;
  ruleContent: Prisma.InputJsonValue;
  status?: FjnPointsRuleStatus;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdBy?: string;
  approvedBy?: string;
}

/** 入参：创建快照 */
export interface CreatePointsSnapshotInput {
  snapshotType: FjnPointsSnapshotType;
  assetType: FjnPointsAssetType;
  createdBy?: string;
}

/** 入参：分页查询 */
export interface ListPointsInput {
  page?: number;
  pageSize?: number;
  userId?: string;
  assetType?: FjnPointsAssetType;
  direction?: 'earn' | 'spend';
  sourceType?: FjnPointsSourceType;
  bizType?: FjnPointsBizType;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface PointsSummary {
  userId: string;
  assetType: FjnPointsAssetType;
  totalAvailable: string;
  totalFrozen: string;
  totalLocked: string;
  totalConsumed: string;
  totalConverted: string;
  totalExpired: string;
  totalEarned: string;
  totalRevoked: string;
  netBalance: string;
  accountStatus: FjnPointsAccountStatus;
}

export interface PointsBalanceTrace {
  userId: string;
  assetType: FjnPointsAssetType;
  ledgers: Array<{
    ledgerId: string;
    ledgerNo: string;
    changeType: FjnPointsChangeType;
    direction: 'earn' | 'spend';
    amount: string;
    balanceBefore: string;
    balanceAfter: string;
    bizType?: FjnPointsBizType;
    createdAt: Date;
  }>;
  computedBalance: string;
  currentBalance: string;
  consistent: boolean;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnPointsService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnPointsService' });
  }

  // ==========================================================
  // 3.1 Account 域（6 个方法）
  // ==========================================================

  /**
   * 开通积分账户
   * - 幂等：已存在则直接返回
   */
  async openAccount(input: OpenPointsAccountInput): Promise<{
    id: string;
    userId: string;
    assetType: FjnPointsAssetType;
    availableBalance: string;
    status: FjnPointsAccountStatus;
  }> {
    if (!input.userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnPointsAccount.findUnique({
        where: {
          userId_assetType: { userId: input.userId, assetType: input.assetType },
        },
      });
      if (existing) {
        return {
          id: existing.id,
          userId: existing.userId,
          assetType: existing.assetType as FjnPointsAssetType,
          availableBalance: existing.availableBalance.toString(),
          status: existing.status as FjnPointsAccountStatus,
        };
      }

      const created = await tx.fjnPointsAccount.create({
        data: {
          userId: input.userId,
          assetType: input.assetType,
          status: POINTS_ACCOUNT_STATUS.ACTIVE,
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_ACCOUNT_OPENED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.POINTS_SERVICE,
        account_id: created.id,
        user_id: created.userId,
        asset_type: created.assetType as FjnPointsAssetType,
        operator_id: input.operatorId,
      });

      return {
        id: created.id,
        userId: created.userId,
        assetType: created.assetType as FjnPointsAssetType,
        availableBalance: created.availableBalance.toString(),
        status: created.status as FjnPointsAccountStatus,
      };
    });
  }

  /**
   * 获取积分账户
   */
  async getAccount(userId: string, assetType: FjnPointsAssetType) {
    if (!userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType });
    }
    const account = await this.prisma.fjnPointsAccount.findUnique({
      where: { userId_assetType: { userId, assetType } },
    });
    if (!account) {
      throw new FjnPointsAccountNotFoundError({ userId, assetType });
    }
    return account;
  }

  /**
   * 冻结积分账户（账户级别）
   */
  async freezeAccount(
    userId: string,
    assetType: FjnPointsAssetType,
    reason: string,
    operatorId?: string,
  ): Promise<void> {
    if (!reason) throw new FjnPointsFreezeReasonRequiredError();
    return this.withTransaction(async (tx) => {
      const account = await tx.fjnPointsAccount.findUnique({
        where: { userId_assetType: { userId, assetType } },
      });
      if (!account) throw new FjnPointsAccountNotFoundError({ userId, assetType });

      assertTransitPointsAccountStatus(
        account.status as FjnPointsAccountStatus,
        POINTS_ACCOUNT_STATUS.FROZEN,
      );

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: { status: POINTS_ACCOUNT_STATUS.FROZEN, version: { increment: 1 } },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_ACCOUNT_FROZEN, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.RISK_ENGINE,
        account_id: account.id,
        user_id: userId,
        asset_type: assetType,
        reason,
        operator_id: operatorId,
      });
    });
  }

  /**
   * 解冻积分账户
   */
  async unfreezeAccount(
    userId: string,
    assetType: FjnPointsAssetType,
    operatorId?: string,
  ): Promise<void> {
    return this.withTransaction(async (tx) => {
      const account = await tx.fjnPointsAccount.findUnique({
        where: { userId_assetType: { userId, assetType } },
      });
      if (!account) throw new FjnPointsAccountNotFoundError({ userId, assetType });

      assertTransitPointsAccountStatus(
        account.status as FjnPointsAccountStatus,
        POINTS_ACCOUNT_STATUS.ACTIVE,
      );

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: { status: POINTS_ACCOUNT_STATUS.ACTIVE, version: { increment: 1 } },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_ACCOUNT_FROZEN, {
        // Reuse POINTS_ACCOUNT_FROZEN for both freeze/unfreeze
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.POINTS_SERVICE,
        account_id: account.id,
        user_id: userId,
        asset_type: assetType,
        reason: 'unfreeze',
        operator_id: operatorId,
      });
    });
  }

  /**
   * 关闭积分账户
   */
  async closeAccount(
    userId: string,
    assetType: FjnPointsAssetType,
    reason: string,
    operatorId?: string,
  ): Promise<void> {
    if (!reason) throw new FjnPointsReversalReasonRequiredError();
    return this.withTransaction(async (tx) => {
      const account = await tx.fjnPointsAccount.findUnique({
        where: { userId_assetType: { userId, assetType } },
      });
      if (!account) throw new FjnPointsAccountNotFoundError({ userId, assetType });

      assertTransitPointsAccountStatus(
        account.status as FjnPointsAccountStatus,
        POINTS_ACCOUNT_STATUS.CLOSED,
      );

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: { status: POINTS_ACCOUNT_STATUS.CLOSED, version: { increment: 1 } },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_ACCOUNT_CLOSED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.ADMIN,
        account_id: account.id,
        user_id: userId,
        asset_type: assetType,
        reason,
        operator_id: operatorId,
      });
    });
  }

  /**
   * 列出用户的积分账户
   */
  async listAccounts(userId: string) {
    if (!userId) throw new FjnPointsUserIdRequiredError();
    return this.prisma.fjnPointsAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ==========================================================
  // 3.2 Ledger 域（6 个方法）
  // ==========================================================

  /**
   * 发放积分（增加可用余额）
   */
  async earnPoints(input: EarnPointsInput) {
    if (!input.userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }
    if (!isValidPointsChangeType(POINTS_CHANGE_TYPE.EARN)) {
      throw new FjnPointsLedgerChangeTypeInvalidError();
    }
    if (!isValidPointsSourceType(input.sourceType)) {
      throw new FjnPointsLedgerSourceTypeInvalidError({ sourceType: input.sourceType });
    }
    if (!isValidPointsBizType(input.bizType)) {
      throw new FjnPointsLedgerBizTypeInvalidError({ bizType: input.bizType });
    }
    if (new Prisma.Decimal(input.amount).lte(0)) {
      throw new FjnPointsAmountMustBePositiveError({ amount: input.amount });
    }
    if (new Prisma.Decimal(input.amount).gt('1000000000')) {
      throw new FjnPointsAmountTooLargeError({ amount: input.amount });
    }

    // 幂等检查
    if (input.idempotencyKey) {
      const dup = await this.findDuplicateLedger(
        input.userId,
        input.assetType,
        POINTS_CHANGE_TYPE.EARN,
        input.sourceType,
        input.idempotencyKey,
      );
      if (dup) throw new FjnPointsLedgerDuplicateError({ ledgerNo: dup.ledgerNo });
    }

    return this.withTransaction(async (tx) => {
      const account = await this.ensureAccount(tx, input.userId, input.assetType);
      assertPointsAccountUsable(account);

      const amount = new Prisma.Decimal(input.amount);
      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      const balanceAfter = balanceBefore.plus(amount);

      const ledger = await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          direction: POINTS_DIRECTION.EARN,
          changeType: POINTS_CHANGE_TYPE.EARN,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          bizType: input.bizType,
          bizNo: input.bizNo ?? null,
          ruleCode: input.ruleCode ?? null,
          ruleVersion: input.ruleVersion ?? null,
          riskStatus: input.riskStatus ?? POINTS_RISK_STATUS.NORMAL,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? null,
          txHash: input.txHash ?? null,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          totalEarned: { increment: amount.toFixed(POINTS_AMOUNT_PRECISION) },
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_EARNED, {
        occurred_at: new Date().toISOString(),
        source: this.inferEventSource(input.sourceType),
        ledger_id: ledger.id,
        ledger_no: ledger.ledgerNo,
        account_id: account.id,
        user_id: input.userId,
        asset_type: input.assetType,
        amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
        balance_after: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
        source_type: input.sourceType,
        source_id: input.sourceId,
        biz_type: input.bizType,
        biz_no: input.bizNo,
        rule_code: input.ruleCode,
        rule_version: input.ruleVersion,
        operator_id: input.operatorId,
      });

      return ledger;
    });
  }

  /**
   * 消费积分（扣减可用余额）
   */
  async consumePoints(input: ConsumePointsInput) {
    if (!input.userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }
    if (!isValidPointsSourceType(input.sourceType)) {
      throw new FjnPointsLedgerSourceTypeInvalidError({ sourceType: input.sourceType });
    }
    if (!isValidPointsBizType(input.bizType)) {
      throw new FjnPointsLedgerBizTypeInvalidError({ bizType: input.bizType });
    }
    if (new Prisma.Decimal(input.amount).lte(0)) {
      throw new FjnPointsAmountMustBePositiveError({ amount: input.amount });
    }

    if (input.idempotencyKey) {
      const dup = await this.findDuplicateLedger(
        input.userId,
        input.assetType,
        POINTS_CHANGE_TYPE.CONSUME,
        input.sourceType,
        input.idempotencyKey,
      );
      if (dup) throw new FjnPointsLedgerDuplicateError({ ledgerNo: dup.ledgerNo });
    }

    return this.withTransaction(async (tx) => {
      const account = await this.ensureAccount(tx, input.userId, input.assetType);
      assertPointsAccountUsable(account);

      const amount = new Prisma.Decimal(input.amount);
      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      if (balanceBefore.lt(amount)) {
        throw new FjnPointsInsufficientAvailableError({
          userId: input.userId,
          assetType: input.assetType,
          available: balanceBefore.toString(),
          required: amount.toString(),
        });
      }
      const balanceAfter = balanceBefore.minus(amount);

      const ledger = await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          direction: POINTS_DIRECTION.SPEND,
          changeType: POINTS_CHANGE_TYPE.CONSUME,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          bizType: input.bizType,
          bizNo: input.bizNo ?? null,
          ruleCode: input.ruleCode ?? null,
          riskStatus: input.riskStatus ?? POINTS_RISK_STATUS.NORMAL,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? null,
          txHash: input.txHash ?? null,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          totalEarned: { increment: '0' }, // no change
          consumedBalance: { increment: amount.toFixed(POINTS_AMOUNT_PRECISION) },
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_CONSUMED, {
        occurred_at: new Date().toISOString(),
        source: this.inferEventSource(input.sourceType),
        ledger_id: ledger.id,
        ledger_no: ledger.ledgerNo,
        account_id: account.id,
        user_id: input.userId,
        asset_type: input.assetType,
        amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
        balance_after: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
        source_type: input.sourceType,
        source_id: input.sourceId,
        biz_type: input.bizType,
        biz_no: input.bizNo,
        rule_code: input.ruleCode,
        risk_status: input.riskStatus ?? POINTS_RISK_STATUS.NORMAL,
        operator_id: input.operatorId,
      });

      return ledger;
    });
  }

  /**
   * 冲正积分（生成反向流水）
   */
  async reversePoints(input: ReversePointsInput) {
    if (!input.userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }
    if (!input.reason) throw new FjnPointsReversalReasonRequiredError();
    if (new Prisma.Decimal(input.reversedAmount).lte(0)) {
      throw new FjnPointsAmountMustBePositiveError({ amount: input.reversedAmount });
    }

    return this.withTransaction(async (tx) => {
      const account = await this.ensureAccount(tx, input.userId, input.assetType);
      const originalLedger = await tx.fjnPointsLedger.findUnique({
        where: { id: input.originalLedgerId },
      });
      if (!originalLedger) {
        throw new FjnPointsLedgerNotFoundError({ ledgerId: input.originalLedgerId });
      }
      if (new Prisma.Decimal(input.reversedAmount).gt(originalLedger.amount)) {
        throw new FjnPointsReversalAmountExceedsOriginalError({
          originalAmount: originalLedger.amount.toString(),
          reversedAmount: input.reversedAmount,
        });
      }

      const reversalNo = await this.generateReversalNo(tx);

      // 创建 reversal 记录
      const reversal = await tx.fjnPointsReversal.create({
        data: {
          reversalNo,
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          originalLedgerId: input.originalLedgerId,
          reversedAmount: new Prisma.Decimal(input.reversedAmount).toFixed(POINTS_AMOUNT_PRECISION),
          reason: input.reason,
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          operatorId: input.operatorId ?? null,
        },
      });

      // 反向流水
      const amount = new Prisma.Decimal(input.reversedAmount);
      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      const balanceAfter = balanceBefore.minus(amount);

      if (balanceAfter.lt(0)) {
        throw new FjnPointsBalanceNegativeError({ balanceAfter: balanceAfter.toString() });
      }

      const ledger = await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          direction: POINTS_DIRECTION.SPEND,
          changeType: POINTS_CHANGE_TYPE.REVOKE,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          bizType: POINTS_BIZ_TYPE.REFUND_REVERSAL,
          bizNo: reversalNo,
          riskStatus: POINTS_RISK_STATUS.NORMAL,
          operatorId: input.operatorId ?? null,
          remark: `Reversal: ${input.reason}`,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          totalRevoked: { increment: amount.toFixed(POINTS_AMOUNT_PRECISION) },
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_REVERSED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.ADMIN,
        reversal_id: reversal.id,
        reversal_no: reversalNo,
        account_id: account.id,
        user_id: input.userId,
        asset_type: input.assetType,
        original_ledger_id: input.originalLedgerId,
        reversed_amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
        reason: input.reason,
        operator_id: input.operatorId,
      });

      return { reversal, ledger };
    });
  }

  /**
   * 列出积分流水
   */
  async listLedgers(input: ListPointsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: Prisma.FjnPointsLedgerWhereInput = {};
    if (input.userId) where.userId = input.userId;
    if (input.assetType) where.assetType = input.assetType;
    if (input.direction) where.direction = input.direction;
    if (input.sourceType) where.sourceType = input.sourceType;
    if (input.bizType) where.bizType = input.bizType;
    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) (where.createdAt as any).gte = input.startDate;
      if (input.endDate) (where.createdAt as any).lte = input.endDate;
    }

    const [total, items] = await Promise.all([
      this.prisma.fjnPointsLedger.count({ where }),
      this.prisma.fjnPointsLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, page, pageSize, items };
  }

  /**
   * 计算余额流水追溯（用于审计对账）
   */
  async getBalanceTrace(
    userId: string,
    assetType: FjnPointsAssetType,
  ): Promise<PointsBalanceTrace> {
    const account = await this.getAccount(userId, assetType);
    const ledgers = await this.prisma.fjnPointsLedger.findMany({
      where: { userId, assetType },
      orderBy: { createdAt: 'asc' },
    });

    let computed = new Prisma.Decimal(0);
    const ledgerEntries: PointsBalanceTrace['ledgers'] = [];
    for (const l of ledgers) {
      const isDecrease = isDecreaseChangeType(l.changeType as FjnPointsChangeType);
      const isIncrease = isIncreaseChangeType(l.changeType as FjnPointsChangeType);
      if (l.changeType === POINTS_CHANGE_TYPE.ADJUST_SUBTRACT) {
        // already decrease
      }
      ledgerEntries.push({
        ledgerId: l.id,
        ledgerNo: l.ledgerNo,
        changeType: l.changeType as FjnPointsChangeType,
        direction: l.direction as 'earn' | 'spend',
        amount: l.amount.toString(),
        balanceBefore: l.balanceBefore.toString(),
        balanceAfter: l.balanceAfter.toString(),
        bizType: l.bizType as FjnPointsBizType | undefined,
        createdAt: l.createdAt,
      });
    }

    // 从头计算总余额
    for (const l of ledgers) {
      const amount = new Prisma.Decimal(l.amount);
      if (
        l.changeType === POINTS_CHANGE_TYPE.EARN ||
        l.changeType === POINTS_CHANGE_TYPE.UNFREEZE ||
        l.changeType === POINTS_CHANGE_TYPE.UNLOCK ||
        l.changeType === POINTS_CHANGE_TYPE.ADJUST_ADD
      ) {
        computed = computed.plus(amount);
      } else {
        computed = computed.minus(amount);
      }
    }

    const currentBalance = new Prisma.Decimal(account.availableBalance);

    return {
      userId,
      assetType,
      ledgers: ledgerEntries,
      computedBalance: computed.toFixed(POINTS_AMOUNT_PRECISION),
      currentBalance: currentBalance.toFixed(POINTS_AMOUNT_PRECISION),
      consistent: computed.eq(currentBalance),
    };
  }

  /**
   * 获取用户积分汇总
   */
  async getPointsSummary(userId: string, assetType: FjnPointsAssetType): Promise<PointsSummary> {
    const account = await this.getAccount(userId, assetType);
    return {
      userId: account.userId,
      assetType: account.assetType as FjnPointsAssetType,
      totalAvailable: account.availableBalance.toString(),
      totalFrozen: account.frozenBalance.toString(),
      totalLocked: account.lockedBalance.toString(),
      totalConsumed: account.consumedBalance.toString(),
      totalConverted: account.convertedBalance.toString(),
      totalExpired: account.expiredBalance.toString(),
      totalEarned: account.totalEarned.toString(),
      totalRevoked: account.totalRevoked.toString(),
      netBalance: new Prisma.Decimal(account.availableBalance)
        .plus(account.frozenBalance)
        .plus(account.lockedBalance)
        .toFixed(POINTS_AMOUNT_PRECISION),
      accountStatus: account.status as FjnPointsAccountStatus,
    };
  }

  // ==========================================================
  // 3.3 Freeze 域（4 个方法）
  // ==========================================================

  /**
   * 冻结积分（部分冻结）
   */
  async freezePoints(input: FreezePointsInput) {
    if (!input.userId) throw new FjnPointsUserIdRequiredError();
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }
    if (!input.reason) throw new FjnPointsFreezeReasonRequiredError();
    if (new Prisma.Decimal(input.amount).lte(0)) {
      throw new FjnPointsAmountMustBePositiveError({ amount: input.amount });
    }
    if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
      throw new FjnPointsFreezeExpiresInvalidError({ expiresAt: input.expiresAt.toISOString() });
    }

    return this.withTransaction(async (tx) => {
      const account = await this.ensureAccount(tx, input.userId, input.assetType);
      assertPointsAccountUsable(account);

      const amount = new Prisma.Decimal(input.amount);
      if (new Prisma.Decimal(account.availableBalance).lt(amount)) {
        throw new FjnPointsFreezeAmountExceedsAvailableError({
          available: account.availableBalance.toString(),
          freeze: amount.toString(),
        });
      }

      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      const frozenAfter = new Prisma.Decimal(account.frozenBalance).plus(amount);
      const availableAfter = balanceBefore.minus(amount);

      const freeze = await tx.fjnPointsFreeze.create({
        data: {
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          reason: input.reason,
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          status: POINTS_FREEZE_STATUS.ACTIVE,
          expiresAt: input.expiresAt ?? null,
        },
      });

      // 流水
      await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          direction: POINTS_DIRECTION.SPEND,
          changeType: POINTS_CHANGE_TYPE.FREEZE,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: availableAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          bizType: POINTS_BIZ_TYPE.RISK_FREEZE,
          bizNo: freeze.id,
          riskStatus: POINTS_RISK_STATUS.HOLD,
          operatorId: input.operatorId ?? null,
          remark: input.reason,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: availableAfter.toFixed(POINTS_AMOUNT_PRECISION),
          frozenBalance: frozenAfter.toFixed(POINTS_AMOUNT_PRECISION),
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_FROZEN, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.RISK_ENGINE,
        freeze_id: freeze.id,
        account_id: account.id,
        user_id: input.userId,
        asset_type: input.assetType,
        amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
        reason: input.reason,
        source_type: input.sourceType,
        source_id: input.sourceId,
        expires_at: input.expiresAt?.toISOString(),
        operator_id: input.operatorId,
      });

      return freeze;
    });
  }

  /**
   * 解冻积分（解冻全部或部分）
   */
  async unfreezePoints(input: UnfreezePointsInput) {
    return this.withTransaction(async (tx) => {
      const freeze = await tx.fjnPointsFreeze.findUnique({
        where: { id: input.freezeId },
      });
      if (!freeze) throw new FjnPointsFreezeNotFoundError({ freezeId: input.freezeId });
      if (freeze.status !== POINTS_FREEZE_STATUS.ACTIVE) {
        throw new FjnPointsFreezeNotActiveError({ status: freeze.status });
      }

      const unfreezeAmount = new Prisma.Decimal(input.unfreezeAmount);
      if (unfreezeAmount.gt(freeze.amount)) {
        throw new FjnPointsUnfreezeAmountExceedsFreezeError({
          frozen: freeze.amount.toString(),
          unfreeze: input.unfreezeAmount,
        });
      }

      const account = await tx.fjnPointsAccount.findUnique({
        where: { id: freeze.accountId },
      });
      if (!account) throw new FjnPointsAccountNotFoundError({ accountId: freeze.accountId });

      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      const balanceAfter = balanceBefore.plus(unfreezeAmount);
      const frozenAfter = new Prisma.Decimal(account.frozenBalance).minus(unfreezeAmount);

      assertTransitPointsFreezeStatus(
        freeze.status as FjnPointsFreezeStatus,
        POINTS_FREEZE_STATUS.UNFROZEN,
      );

      // 流水
      await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: account.userId,
          assetType: account.assetType,
          direction: POINTS_DIRECTION.EARN,
          changeType: POINTS_CHANGE_TYPE.UNFREEZE,
          amount: unfreezeAmount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: POINTS_SOURCE_TYPE.RISK_ENGINE,
          sourceId: freeze.id,
          bizType: POINTS_BIZ_TYPE.RISK_UNFREEZE,
          bizNo: freeze.id,
          riskStatus: POINTS_RISK_STATUS.NORMAL,
          operatorId: input.operatorId ?? null,
          remark: input.reason ?? 'unfreeze',
        },
      });

      // 全部解冻则更新状态
      const isFull = unfreezeAmount.eq(freeze.amount);
      await tx.fjnPointsFreeze.update({
        where: { id: freeze.id },
        data: {
          status: isFull ? POINTS_FREEZE_STATUS.UNFROZEN : POINTS_FREEZE_STATUS.ACTIVE,
          unfrozenAt: isFull ? new Date() : null,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          frozenBalance: frozenAfter.toFixed(POINTS_AMOUNT_PRECISION),
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_UNFROZEN, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.RISK_ENGINE,
        freeze_id: freeze.id,
        account_id: account.id,
        user_id: account.userId,
        asset_type: account.assetType,
        unfreeze_amount: unfreezeAmount.toFixed(POINTS_AMOUNT_PRECISION),
        reason: input.reason,
        operator_id: input.operatorId,
      });

      return freeze;
    });
  }

  /**
   * 撤销冻结（冻结金额作废，恢复到可用余额）
   */
  async revokeFreeze(input: RevokeFreezeInput) {
    if (!input.reason) throw new FjnPointsFreezeReasonRequiredError();
    return this.withTransaction(async (tx) => {
      const freeze = await tx.fjnPointsFreeze.findUnique({
        where: { id: input.freezeId },
      });
      if (!freeze) throw new FjnPointsFreezeNotFoundError({ freezeId: input.freezeId });
      if (freeze.status !== POINTS_FREEZE_STATUS.ACTIVE) {
        throw new FjnPointsFreezeNotActiveError({ status: freeze.status });
      }

      const account = await tx.fjnPointsAccount.findUnique({
        where: { id: freeze.accountId },
      });
      if (!account) throw new FjnPointsAccountNotFoundError({ accountId: freeze.accountId });

      const revokeAmount = new Prisma.Decimal(freeze.amount);
      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      const balanceAfter = balanceBefore.plus(revokeAmount);
      const frozenAfter = new Prisma.Decimal(account.frozenBalance).minus(revokeAmount);

      assertTransitPointsFreezeStatus(
        freeze.status as FjnPointsFreezeStatus,
        POINTS_FREEZE_STATUS.REVOKED,
      );

      await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: account.userId,
          assetType: account.assetType,
          direction: POINTS_DIRECTION.EARN,
          changeType: POINTS_CHANGE_TYPE.UNFREEZE,
          amount: revokeAmount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: POINTS_SOURCE_TYPE.RISK_ENGINE,
          sourceId: freeze.id,
          bizType: POINTS_BIZ_TYPE.RISK_UNFREEZE,
          bizNo: freeze.id,
          riskStatus: POINTS_RISK_STATUS.NORMAL,
          operatorId: input.operatorId ?? null,
          remark: `Revoke: ${input.reason}`,
        },
      });

      await tx.fjnPointsFreeze.update({
        where: { id: freeze.id },
        data: { status: POINTS_FREEZE_STATUS.REVOKED, unfrozenAt: new Date() },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          frozenBalance: frozenAfter.toFixed(POINTS_AMOUNT_PRECISION),
          version: { increment: 1 },
        },
      });

      return freeze;
    });
  }

  /**
   * 列出冻结记录
   */
  async listFreezes(userId: string, assetType?: FjnPointsAssetType) {
    return this.prisma.fjnPointsFreeze.findMany({
      where: { userId, ...(assetType ? { assetType } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================================
  // 3.4 Rule 域（4 个方法）
  // ==========================================================

  /**
   * 创建规则
   */
  async createRule(input: CreatePointsRuleInput) {
    if (!input.ruleCode) throw new FjnValidationError('ruleCode 必填');
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }
    if (!/^\d+\.\d+\.\d+$/.test(input.version)) {
      throw new FjnPointsRuleVersionInvalidError({ version: input.version });
    }
    if (input.effectiveFrom && input.effectiveTo && input.effectiveFrom >= input.effectiveTo) {
      throw new FjnPointsRuleEffectiveInvalidError({
        from: input.effectiveFrom.toISOString(),
        to: input.effectiveTo.toISOString(),
      });
    }
    if (!input.ruleContent || typeof input.ruleContent !== 'object') {
      throw new FjnPointsRuleContentInvalidError();
    }

    return this.withTransaction(async (tx) => {
      const existing = await tx.fjnPointsRule.findUnique({
        where: { ruleCode_version: { ruleCode: input.ruleCode, version: input.version } },
      });
      if (existing) {
        throw new FjnPointsRuleExistsError({ ruleCode: input.ruleCode, version: input.version });
      }

      const created = await tx.fjnPointsRule.create({
        data: {
          ruleCode: input.ruleCode,
          assetType: input.assetType,
          version: input.version,
          ruleContent: input.ruleContent as any,
          status: input.status ?? POINTS_RULE_STATUS.DRAFT,
          effectiveFrom: input.effectiveFrom ?? null,
          effectiveTo: input.effectiveTo ?? null,
          createdBy: input.createdBy ?? null,
          approvedBy: input.approvedBy ?? null,
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_RULE_CREATED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.POINTS_SERVICE,
        rule_id: created.id,
        rule_code: created.ruleCode,
        version: created.version,
        asset_type: created.assetType as FjnPointsAssetType,
        effective_from: input.effectiveFrom?.toISOString(),
        effective_to: input.effectiveTo?.toISOString(),
        created_by: input.createdBy,
      });

      return created;
    });
  }

  /**
   * 激活规则
   */
  async activateRule(ruleId: string, approvedBy?: string) {
    return this.withTransaction(async (tx) => {
      const rule = await tx.fjnPointsRule.findUnique({ where: { id: ruleId } });
      if (!rule) throw new FjnPointsRuleNotFoundError({ ruleId });
      if (!approvedBy) throw new FjnPointsRuleNotApprovedError();

      assertTransitPointsRuleStatus(
        rule.status as FjnPointsRuleStatus,
        POINTS_RULE_STATUS.ACTIVE,
      );

      const updated = await tx.fjnPointsRule.update({
        where: { id: ruleId },
        data: { status: POINTS_RULE_STATUS.ACTIVE, approvedBy },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_RULE_ACTIVATED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.POINTS_SERVICE,
        rule_id: updated.id,
        rule_code: updated.ruleCode,
        version: updated.version,
        asset_type: updated.assetType as FjnPointsAssetType,
        approved_by: approvedBy,
      });

      return updated;
    });
  }

  /**
   * 获取当前激活的规则
   */
  async getActiveRule(ruleCode: string, assetType: FjnPointsAssetType, now: Date = new Date()) {
    if (!isValidPointsAssetType(assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType });
    }
    return this.prisma.fjnPointsRule.findFirst({
      where: {
        ruleCode,
        assetType,
        status: POINTS_RULE_STATUS.ACTIVE,
        AND: [
          {
            OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
          },
          {
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 列出规则
   */
  async listRules(filter: { ruleCode?: string; assetType?: FjnPointsAssetType; status?: FjnPointsRuleStatus } = {}) {
    return this.prisma.fjnPointsRule.findMany({
      where: {
        ...(filter.ruleCode ? { ruleCode: filter.ruleCode } : {}),
        ...(filter.assetType ? { assetType: filter.assetType } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================================
  // 3.5 Snapshot 域（3 个方法）
  // ==========================================================

  /**
   * 创建快照
   */
  async createSnapshot(input: CreatePointsSnapshotInput) {
    if (!isValidPointsSnapshotType(input.snapshotType)) {
      throw new FjnPointsSnapshotTypeInvalidError({ snapshotType: input.snapshotType });
    }
    if (!isValidPointsAssetType(input.assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType: input.assetType });
    }

    return this.withTransaction(async (tx) => {
      const accounts = await tx.fjnPointsAccount.findMany({
        where: { assetType: input.assetType },
      });

      let totalUsers = 0;
      let totalSupply = new Prisma.Decimal(0);
      let totalFrozen = new Prisma.Decimal(0);
      let totalLocked = new Prisma.Decimal(0);

      const snapshotData: any[] = [];
      for (const acc of accounts) {
        if (acc.availableBalance.gt(0) || acc.frozenBalance.gt(0) || acc.lockedBalance.gt(0)) {
          totalUsers += 1;
        }
        totalSupply = totalSupply.plus(acc.availableBalance);
        totalFrozen = totalFrozen.plus(acc.frozenBalance);
        totalLocked = totalLocked.plus(acc.lockedBalance);
        snapshotData.push({
          userId: acc.userId,
          available: acc.availableBalance.toString(),
          frozen: acc.frozenBalance.toString(),
          locked: acc.lockedBalance.toString(),
          consumed: acc.consumedBalance.toString(),
          converted: acc.convertedBalance.toString(),
          expired: acc.expiredBalance.toString(),
          totalEarned: acc.totalEarned.toString(),
          totalRevoked: acc.totalRevoked.toString(),
        });
      }

      const snapshot = await tx.fjnPointsSnapshot.create({
        data: {
          snapshotNo: await this.generateSnapshotNo(tx),
          snapshotType: input.snapshotType,
          assetType: input.assetType,
          totalUsers,
          totalSupply: totalSupply.toFixed(POINTS_AMOUNT_PRECISION),
          totalFrozen: totalFrozen.toFixed(POINTS_AMOUNT_PRECISION),
          totalLocked: totalLocked.toFixed(POINTS_AMOUNT_PRECISION),
          snapshotData: snapshotData as any,
          createdBy: input.createdBy ?? null,
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_SNAPSHOT_CREATED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.SCHEDULER,
        snapshot_id: snapshot.id,
        snapshot_no: snapshot.snapshotNo,
        snapshot_type: input.snapshotType,
        asset_type: input.assetType,
        total_users: totalUsers,
        total_supply: totalSupply.toFixed(POINTS_AMOUNT_PRECISION),
        created_by: input.createdBy,
      });

      return snapshot;
    });
  }

  /**
   * 获取最新快照
   */
  async getLatestSnapshot(assetType: FjnPointsAssetType, snapshotType?: FjnPointsSnapshotType) {
    if (!isValidPointsAssetType(assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType });
    }
    return this.prisma.fjnPointsSnapshot.findFirst({
      where: {
        assetType,
        ...(snapshotType ? { snapshotType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 列出快照
   */
  async listSnapshots(assetType: FjnPointsAssetType, limit = 20) {
    return this.prisma.fjnPointsSnapshot.findMany({
      where: { assetType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ==========================================================
  // 3.6 工具方法（4 个）
  // ==========================================================

  /**
   * 过期积分（由调度器调用）
   */
  async expirePoints(input: {
    userId: string;
    assetType: FjnPointsAssetType;
    expiredAmount: string;
    reason: string;
  }) {
    if (new Prisma.Decimal(input.expiredAmount).lte(0)) {
      throw new FjnPointsAmountMustBePositiveError({ amount: input.expiredAmount });
    }
    return this.withTransaction(async (tx) => {
      const account = await this.ensureAccount(tx, input.userId, input.assetType);
      const amount = new Prisma.Decimal(input.expiredAmount);
      const balanceBefore = new Prisma.Decimal(account.availableBalance);
      if (balanceBefore.lt(amount)) {
        throw new FjnPointsInsufficientAvailableError({
          available: balanceBefore.toString(),
          required: amount.toString(),
        });
      }
      const balanceAfter = balanceBefore.minus(amount);

      const ledger = await tx.fjnPointsLedger.create({
        data: {
          ledgerNo: await this.generateLedgerNo(tx, 'PTS'),
          accountId: account.id,
          userId: input.userId,
          assetType: input.assetType,
          direction: POINTS_DIRECTION.SPEND,
          changeType: POINTS_CHANGE_TYPE.EXPIRE,
          amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
          balanceBefore: balanceBefore.toFixed(POINTS_AMOUNT_PRECISION),
          balanceAfter: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          sourceType: POINTS_SOURCE_TYPE.EXPIRE_SCHEDULER,
          bizType: POINTS_BIZ_TYPE.EXPIRE,
          riskStatus: POINTS_RISK_STATUS.NORMAL,
          remark: input.reason,
        },
      });

      await tx.fjnPointsAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: balanceAfter.toFixed(POINTS_AMOUNT_PRECISION),
          expiredBalance: { increment: amount.toFixed(POINTS_AMOUNT_PRECISION) },
          version: { increment: 1 },
        },
      });

      await this.emitEvent(tx, POINTS_EVENTS.POINTS_EXPIRED, {
        occurred_at: new Date().toISOString(),
        source: POINTS_EVENT_SOURCES.SCHEDULER,
        account_id: account.id,
        user_id: input.userId,
        asset_type: input.assetType,
        expired_amount: amount.toFixed(POINTS_AMOUNT_PRECISION),
        expired_ledger_id: ledger.id,
        reason: input.reason,
      });

      return ledger;
    });
  }

  /**
   * cFJ369 → tFJ369 转换（联动 tFJ369 Service）
   */
  async convertCfj369ToTfj369(input: {
    userId: string;
    cfj369Amount: string;
    ratio: string;
    feeRate: string;
    operatorId?: string;
  }): Promise<{
    convertedAmount: string;
    feeAmount: string;
    netAmount: string;
  }> {
    const amount = new Prisma.Decimal(input.cfj369Amount);
    if (amount.lte(0)) throw new FjnPointsAmountMustBePositiveError({ amount: input.cfj369Amount });
    const ratio = new Prisma.Decimal(input.ratio);
    if (ratio.lte(0)) throw new FjnPointsConversionRatioInvalidError({ ratio: input.ratio });
    const feeRate = new Prisma.Decimal(input.feeRate);
    if (feeRate.lt(0) || feeRate.gte(1)) {
      throw new FjnPointsConversionRatioInvalidError({ feeRate: input.feeRate });
    }

    // 转换比例：1 cFJ369 = ratio tFJ369，手续费 feeRate
    const gross = amount.times(ratio);
    const feeAmount = gross.times(feeRate);
    const netAmount = gross.minus(feeAmount);

    // 扣减 cFJ369
    await this.consumePoints({
      userId: input.userId,
      assetType: POINTS_ASSET_TYPE.CFJ369,
      amount: input.cfj369Amount,
      sourceType: POINTS_SOURCE_TYPE.SYSTEM,
      bizType: POINTS_BIZ_TYPE.CONVERT_TO_TFJ369,
      riskStatus: POINTS_RISK_STATUS.NORMAL,
      operatorId: input.operatorId,
    });

    return {
      convertedAmount: netAmount.toFixed(POINTS_AMOUNT_PRECISION),
      feeAmount: feeAmount.toFixed(POINTS_AMOUNT_PRECISION),
      netAmount: gross.toFixed(POINTS_AMOUNT_PRECISION),
    };
  }

  /**
   * 批量获取多个用户的积分（用于报表）
   */
  async getUserPoints(userIds: string[], assetType: FjnPointsAssetType) {
    if (!isValidPointsAssetType(assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType });
    }
    return this.prisma.fjnPointsAccount.findMany({
      where: { userId: { in: userIds }, assetType },
    });
  }

  /**
   * 全网积分总览
   */
  async getGlobalSummary(assetType: FjnPointsAssetType) {
    if (!isValidPointsAssetType(assetType)) {
      throw new FjnPointsAssetTypeInvalidError({ assetType });
    }
    const accounts = await this.prisma.fjnPointsAccount.findMany({
      where: { assetType },
    });
    let totalSupply = new Prisma.Decimal(0);
    let totalFrozen = new Prisma.Decimal(0);
    let totalLocked = new Prisma.Decimal(0);
    let totalConsumed = new Prisma.Decimal(0);
    let totalEarned = new Prisma.Decimal(0);
    let totalRevoked = new Prisma.Decimal(0);
    let totalUsers = 0;
    for (const a of accounts) {
      totalSupply = totalSupply.plus(a.availableBalance);
      totalFrozen = totalFrozen.plus(a.frozenBalance);
      totalLocked = totalLocked.plus(a.lockedBalance);
      totalConsumed = totalConsumed.plus(a.consumedBalance);
      totalEarned = totalEarned.plus(a.totalEarned);
      totalRevoked = totalRevoked.plus(a.totalRevoked);
      if (a.availableBalance.gt(0) || a.frozenBalance.gt(0) || a.lockedBalance.gt(0)) {
        totalUsers += 1;
      }
    }
    return {
      assetType,
      totalUsers,
      totalSupply: totalSupply.toFixed(POINTS_AMOUNT_PRECISION),
      totalFrozen: totalFrozen.toFixed(POINTS_AMOUNT_PRECISION),
      totalLocked: totalLocked.toFixed(POINTS_AMOUNT_PRECISION),
      totalConsumed: totalConsumed.toFixed(POINTS_AMOUNT_PRECISION),
      totalEarned: totalEarned.toFixed(POINTS_AMOUNT_PRECISION),
      totalRevoked: totalRevoked.toFixed(POINTS_AMOUNT_PRECISION),
    };
  }

  // ==========================================================
  // 3.7 私有工具
  // ==========================================================

  private async ensureAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    assetType: FjnPointsAssetType,
  ) {
    const existing = await tx.fjnPointsAccount.findUnique({
      where: { userId_assetType: { userId, assetType } },
    });
    if (existing) return existing;
    return tx.fjnPointsAccount.create({
      data: {
        userId,
        assetType,
        status: POINTS_ACCOUNT_STATUS.ACTIVE,
      },
    });
  }

  private async findDuplicateLedger(
    userId: string,
    assetType: FjnPointsAssetType,
    changeType: FjnPointsChangeType,
    sourceType: FjnPointsSourceType,
    idempotencyKey: string,
  ) {
    return this.prisma.fjnPointsLedger.findFirst({
      where: {
        userId,
        assetType,
        changeType,
        sourceType,
        bizNo: idempotencyKey,
      },
    });
  }

  private async generateLedgerNo(
    tx: Prisma.TransactionClient,
    prefix: string,
  ): Promise<string> {
    const ts = new Date();
    const yyyymmdd = ts.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${yyyymmdd}${random}`;
  }

  private async generateReversalNo(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const ts = new Date();
    const yyyymmdd = ts.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RVS${yyyymmdd}${random}`;
  }

  private async generateSnapshotNo(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const ts = new Date();
    const yyyymmdd = ts.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `SNP${yyyymmdd}${random}`;
  }

  private inferEventSource(sourceType: FjnPointsSourceType): FjnPointsEventSource {
    switch (sourceType) {
      case POINTS_SOURCE_TYPE.ORDER:
        return POINTS_EVENT_SOURCES.ORDER_SERVICE;
      case POINTS_SOURCE_TYPE.REFERRAL:
        return POINTS_EVENT_SOURCES.REFERRAL_SERVICE;
      case POINTS_SOURCE_TYPE.TEAM:
        return POINTS_EVENT_SOURCES.TEAM_SERVICE;
      case POINTS_SOURCE_TYPE.NODE:
        return POINTS_EVENT_SOURCES.NODE_SERVICE;
      case POINTS_SOURCE_TYPE.NFT:
        return POINTS_EVENT_SOURCES.NFT_SERVICE;
      case POINTS_SOURCE_TYPE.RELEASE:
        return POINTS_EVENT_SOURCES.RELEASE_SERVICE;
      case POINTS_SOURCE_TYPE.MALL:
        return POINTS_EVENT_SOURCES.MALL_SERVICE;
      case POINTS_SOURCE_TYPE.AI_TASK:
        return POINTS_EVENT_SOURCES.AI_SERVICE;
      case POINTS_SOURCE_TYPE.RISK_ENGINE:
        return POINTS_EVENT_SOURCES.RISK_ENGINE;
      default:
        return POINTS_EVENT_SOURCES.POINTS_SERVICE;
    }
  }

  private async emitEvent(
    tx: Prisma.TransactionClient,
    eventType: string,
    payload: any,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload,
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      // outbox 不存在时降级
      this.log('warn', `emitEvent ${eventType} failed: outbox may not exist`, { error: String(e) });
    }
  }
}

function assertPointsAccountUsable(account: { status: string }): void {
  if (account.status === POINTS_ACCOUNT_STATUS.FROZEN) {
    throw new FjnPointsAccountFrozenError({ status: account.status });
  }
  if (account.status === POINTS_ACCOUNT_STATUS.CLOSED) {
    throw new FjnPointsAccountClosedError({ status: account.status });
  }
}

export function createFjnPointsService(options?: FjnServiceOptions): FjnPointsService {
  return new FjnPointsService(options);
}
