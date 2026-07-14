/**
 * tFJ369 Service - 369 可流通积分业务服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.2
 * 业务规则：docs/369福建老酒源代码-开发/H024-8 个 Service：Tradable Points Service tFJ369 服务.md
 *
 * 职责：
 *  - openAccount / freezeAccount / unfreezeAccount / closeAccount / getAccount
 *  - mint (链下 + Solana SPL Token mint)
 *  - burn (链下 + Solana SPL Token burn)
 *  - transfer (链下账本平账)
 *  - lock / unlock (用途：trade | convert | mall_consume | nft_upgrade)
 *  - requestConversion (cFJ369 → tFJ369)
 *  - approveConversion / executeConversion / cancelConversion
 *  - getConversion / listConversions
 *  - getBalance / getLedgerTrace
 *
 * 链上集成：通过 SolanaTokenService 调用 SPL Token mintTo / burn
 * 业务真相源：链下账本（FjnTPointsAccount / FjnTPointsLedger / FjnConversionOrder）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  TPOINTS_ACCOUNT_STATUS,
  TPOINTS_LEDGER_DIRECTION,
  TPOINTS_LEDGER_CHANGE_TYPE,
  TPOINTS_LOCK_TYPE,
  TPOINTS_LOCK_STATUS,
  TPOINTS_CONVERSION_STATUS,
  TPOINTS_MEMBER_LEVEL,
  TPOINTS_RISK_STATUS,
  TPOINTS_AMOUNT_PRECISION,
  TPOINTS_DEFAULT_CONVERT_RATIO,
  isValidTPointsAccountStatus,
  type FjnTPointsAccountStatus,
  type FjnTPointsChangeType,
  type FjnTPointsLockType,
  type FjnTPointsConversionStatus,
  type FjnTPointsMemberLevel,
  type FjnTPointsRiskStatus,
} from './tfj369-state-machine';
import {
  TFJ369_EVENTS,
  TFJ369_EVENT_SOURCES,
  type FjnTfj369Event,
} from './tfj369-events';
import {
  Tfj369UserIdRequiredError,
  Tfj369AccountNotFoundError,
  Tfj369AccountFrozenError,
  Tfj369AccountClosedError,
  Tfj369AmountInvalidError,
  Tfj369BalanceInsufficientError,
  Tfj369LockNotFoundError,
  Tfj369ConversionNotFoundError,
  Tfj369ConversionRegionBlockedError,
  Tfj369ConversionRiskBlockedError,
  Tfj369ConversionKycRequiredError,
  Tfj369RiskBlockedError,
  Tfj369SolanaMintFailedError,
  Tfj369SolanaBurnFailedError,
} from './tfj369-errors';

// ============================================================
// 1. 入参接口
// ============================================================

export interface OpenTfj369AccountInput {
  userId: string;
  operatorId?: string;
  metadata?: Record<string, unknown>;
}

export interface MintTfj369Input {
  userId: string;
  amount: string;            // 字符串精度（4 位小数）
  sourceType: string;        // order | referral | team | node | admin
  sourceId?: string;
  bizType?: string;
  /** Solana 链上 tx 哈希（由 SolanaTokenService.mintTo 返回） */
  txHash?: string;
  /** Solana 链上 mint address */
  mintAddress?: string;
  operatorId?: string;
}

export interface BurnTfj369Input {
  userId: string;
  amount: string;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  txHash?: string;
  operatorId?: string;
}

export interface LockTfj369Input {
  userId: string;
  amount: string;
  lockType: FjnTPointsLockType;
  sourceType?: string;
  sourceId?: string;
  expiresAt?: Date;
  operatorId?: string;
}

export interface UnlockTfj369Input {
  lockId: string;
  burnOnUnlock?: boolean;
  operatorId?: string;
}

export interface RequestConversionInput {
  userId: string;
  cfj369Amount: string;
  memberLevel?: FjnTPointsMemberLevel;
  /** 风险检查结果（前置风控服务传入） */
  riskStatus?: FjnTPointsRiskStatus;
  kycVerified?: boolean;
  regionAllowed?: boolean;
  operatorId?: string;
}

export interface ApproveConversionInput {
  conversionNo: string;
  approverId: string;
  operatorId?: string;
}

export interface ExecuteConversionInput {
  conversionNo: string;
  /** Solana tx hash（由 SolanaTokenService.mintTo 返回） */
  txHash: string;
  operatorId?: string;
}

// ============================================================
// 2. Service 主体
// ============================================================

export class FjnTfj369Service extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnTfj369Service' });
  }

  /** 写 outbox 事件（事务内执行） */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: string = 'tfj369_service',
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

  // ============================================================
  // 3. Account 域
  // ============================================================

  async openAccount(input: OpenTfj369AccountInput) {
    if (!input.userId) throw new Tfj369UserIdRequiredError();
    return this.withTransaction(async (tx) => {
      const existing = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId: input.userId } });
      if (existing) return existing;
      const created = await (tx as any).fjnTPointsAccount.create({
        data: {
          userId: input.userId,
          availableBalance: new Prisma.Decimal(0),
          lockedBalance: new Prisma.Decimal(0),
          frozenBalance: new Prisma.Decimal(0),
          inOrderBalance: new Prisma.Decimal(0),
          consumedBalance: new Prisma.Decimal(0),
          burnedBalance: new Prisma.Decimal(0),
          totalEarned: new Prisma.Decimal(0),
          status: TPOINTS_ACCOUNT_STATUS.ACTIVE,
        },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_ACCOUNT_OPENED, {
        userId: input.userId,
        accountId: created.id,
        openedAt: new Date().toISOString(),
      });
      this.log('info', `tFJ369 account opened: ${created.id}`, { userId: input.userId });
      return created;
    });
  }

  async getAccount(userId: string) {
    if (!userId) throw new Tfj369UserIdRequiredError();
    const acc = await (this.prisma as any).fjnTPointsAccount.findUnique({ where: { userId } });
    if (!acc) throw new Tfj369AccountNotFoundError({ userId });
    return acc;
  }

  async freezeAccount(userId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ userId });
      if (acc.status === TPOINTS_ACCOUNT_STATUS.FROZEN) return acc;
      const updated = await (tx as any).fjnTPointsAccount.update({
        where: { id: acc.id },
        data: { status: TPOINTS_ACCOUNT_STATUS.FROZEN, version: { increment: 1 } },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_ACCOUNT_FROZEN, { userId, accountId: acc.id, operatorId });
      this.log('warn', `tFJ369 account frozen: ${acc.id}`, { userId, operatorId });
      return updated;
    });
  }

  async unfreezeAccount(userId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ userId });
      const updated = await (tx as any).fjnTPointsAccount.update({
        where: { id: acc.id },
        data: { status: TPOINTS_ACCOUNT_STATUS.ACTIVE, version: { increment: 1 } },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_ACCOUNT_UNFROZEN, { userId, accountId: acc.id, operatorId });
      this.log('info', `tFJ369 account unfrozen: ${acc.id}`, { userId, operatorId });
      return updated;
    });
  }

  // ============================================================
  // 4. Mint / Burn（链下账本 + Solana 链上 mintTo/burn）
  // ============================================================

  async mint(input: MintTfj369Input) {
    if (!input.userId) throw new Tfj369UserIdRequiredError();
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new Tfj369AmountInvalidError({ amount: input.amount });
    return this.withTransaction(async (tx) => {
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId: input.userId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ userId: input.userId });
      if (acc.status === TPOINTS_ACCOUNT_STATUS.FROZEN) throw new Tfj369AccountFrozenError({ userId: input.userId });
      if (acc.status === TPOINTS_ACCOUNT_STATUS.CLOSED) throw new Tfj369AccountClosedError({ userId: input.userId });

      const balanceBefore = new Prisma.Decimal(acc.availableBalance);
      const balanceAfter = balanceBefore.plus(amount);

      const updated = await (tx as any).fjnTPointsAccount.update({
        where: { id: acc.id },
        data: {
          availableBalance: balanceAfter,
          totalEarned: { increment: amount },
          version: { increment: 1 },
        },
      });

      const ledger = await (tx as any).fjnTPointsLedger.create({
        data: {
          ledgerNo: `TFJ369-MINT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          accountId: acc.id,
          userId: input.userId,
          direction: TPOINTS_LEDGER_DIRECTION.EARN,
          changeType: TPOINTS_LEDGER_CHANGE_TYPE.MINT,
          amount,
          balanceBefore,
          balanceAfter,
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          bizType: input.bizType ?? null,
          txHash: input.txHash ?? null,
          remark: input.txHash ? `on-chain mint ${input.mintAddress ?? ''}`.trim() : null,
        },
      });

      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_MINTED, {
        userId: input.userId,
        amount: amount.toFixed(TPOINTS_AMOUNT_PRECISION),
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        txHash: input.txHash,
        mintAddress: input.mintAddress,
        ledgerId: ledger.id,
      });
      this.log('info', `tFJ369 minted: ${amount.toString()}`, { userId: input.userId, txHash: input.txHash });
      return { account: updated, ledger };
    });
  }

  async burn(input: BurnTfj369Input) {
    if (!input.userId) throw new Tfj369UserIdRequiredError();
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new Tfj369AmountInvalidError({ amount: input.amount });
    return this.withTransaction(async (tx) => {
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId: input.userId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ userId: input.userId });
      if (acc.status === TPOINTS_ACCOUNT_STATUS.FROZEN) throw new Tfj369AccountFrozenError({ userId: input.userId });

      const available = new Prisma.Decimal(acc.availableBalance);
      if (available.lt(amount)) {
        throw new Tfj369BalanceInsufficientError({ userId: input.userId, available: available.toString(), required: amount.toString() });
      }
      const balanceBefore = available;
      const balanceAfter = available.minus(amount);

      const updated = await (tx as any).fjnTPointsAccount.update({
        where: { id: acc.id },
        data: {
          availableBalance: balanceAfter,
          burnedBalance: { increment: amount },
          version: { increment: 1 },
        },
      });

      const ledger = await (tx as any).fjnTPointsLedger.create({
        data: {
          ledgerNo: `TFJ369-BURN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          accountId: acc.id,
          userId: input.userId,
          direction: TPOINTS_LEDGER_DIRECTION.SPEND,
          changeType: TPOINTS_LEDGER_CHANGE_TYPE.BURN,
          amount,
          balanceBefore,
          balanceAfter,
          sourceType: input.sourceType ?? 'manual',
          sourceId: input.sourceId ?? null,
          remark: input.reason,
          txHash: input.txHash ?? null,
        },
      });

      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_BURNED, {
        userId: input.userId,
        amount: amount.toFixed(TPOINTS_AMOUNT_PRECISION),
        reason: input.reason,
        txHash: input.txHash,
        ledgerId: ledger.id,
      });
      this.log('info', `tFJ369 burned: ${amount.toString()}`, { userId: input.userId, reason: input.reason });
      return { account: updated, ledger };
    });
  }

  // ============================================================
  // 5. Lock / Unlock
  // ============================================================

  async lock(input: LockTfj369Input) {
    if (!input.userId) throw new Tfj369UserIdRequiredError();
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new Tfj369AmountInvalidError({ amount: input.amount });
    return this.withTransaction(async (tx) => {
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { userId: input.userId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ userId: input.userId });
      if (acc.status === TPOINTS_ACCOUNT_STATUS.FROZEN) throw new Tfj369AccountFrozenError({ userId: input.userId });

      const available = new Prisma.Decimal(acc.availableBalance);
      if (available.lt(amount)) {
        throw new Tfj369BalanceInsufficientError({ userId: input.userId, available: available.toString(), required: amount.toString() });
      }
      await (tx as any).fjnTPointsAccount.update({
        where: { id: acc.id },
        data: {
          availableBalance: { decrement: amount },
          lockedBalance: { increment: amount },
          version: { increment: 1 },
        },
      });
      const lock = await (tx as any).fjnTPointsLock.create({
        data: {
          accountId: acc.id,
          userId: input.userId,
          amount,
          lockType: input.lockType,
          sourceType: input.sourceType ?? null,
          sourceId: input.sourceId ?? null,
          status: TPOINTS_LOCK_STATUS.ACTIVE,
          expiresAt: input.expiresAt ?? null,
        },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_LOCKED, {
        lockId: lock.id,
        userId: input.userId,
        amount: amount.toFixed(TPOINTS_AMOUNT_PRECISION),
        lockType: input.lockType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      });
      this.log('info', `tFJ369 locked: ${amount.toString()} (${input.lockType})`, { userId: input.userId });
      return lock;
    });
  }

  async unlock(input: UnlockTfj369Input) {
    return this.withTransaction(async (tx) => {
      const lock = await (tx as any).fjnTPointsLock.findUnique({ where: { id: input.lockId } });
      if (!lock) throw new Tfj369LockNotFoundError({ lockId: input.lockId });
      if (lock.status !== TPOINTS_LOCK_STATUS.ACTIVE) {
        return { lock, message: 'lock not active, no-op' };
      }
      const amount = new Prisma.Decimal(lock.amount);
      const acc = await (tx as any).fjnTPointsAccount.findUnique({ where: { id: lock.accountId } });
      if (!acc) throw new Tfj369AccountNotFoundError({ accountId: lock.accountId });

      if (input.burnOnUnlock) {
        await (tx as any).fjnTPointsAccount.update({
          where: { id: acc.id },
          data: {
            lockedBalance: { decrement: amount },
            burnedBalance: { increment: amount },
            version: { increment: 1 },
          },
        });
      } else {
        await (tx as any).fjnTPointsAccount.update({
          where: { id: acc.id },
          data: {
            availableBalance: { increment: amount },
            lockedBalance: { decrement: amount },
            version: { increment: 1 },
          },
        });
      }
      const newStatus = input.burnOnUnlock ? TPOINTS_LOCK_STATUS.BURNED : TPOINTS_LOCK_STATUS.UNLOCKED;
      const updated = await (tx as any).fjnTPointsLock.update({
        where: { id: lock.id },
        data: { status: newStatus, unlockedAt: new Date() },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_UNLOCKED, {
        lockId: lock.id,
        userId: lock.userId,
        amount: amount.toFixed(TPOINTS_AMOUNT_PRECISION),
        burned: !!input.burnOnUnlock,
      });
      this.log('info', `tFJ369 unlocked: ${amount.toString()} (burned=${!!input.burnOnUnlock})`, { lockId: lock.id });
      return { lock: updated, account: acc };
    });
  }

  // ============================================================
  // 6. cFJ369 → tFJ369 Conversion
  // ============================================================

  async requestConversion(input: RequestConversionInput) {
    if (!input.userId) throw new Tfj369UserIdRequiredError();
    const cfj369Amount = new Prisma.Decimal(input.cfj369Amount);
    if (cfj369Amount.lte(0)) throw new Tfj369AmountInvalidError({ amount: input.cfj369Amount });

    // 前置合规校验
    if (input.regionAllowed === false) throw new Tfj369ConversionRegionBlockedError({ userId: input.userId });
    if (input.kycVerified === false) throw new Tfj369ConversionKycRequiredError({ userId: input.userId });
    if (input.riskStatus === TPOINTS_RISK_STATUS.BLOCKED) {
      throw new Tfj369ConversionRiskBlockedError({ userId: input.userId });
    }

    const memberLevel = input.memberLevel ?? TPOINTS_MEMBER_LEVEL.STANDARD;
    const ratio = new Prisma.Decimal(TPOINTS_DEFAULT_CONVERT_RATIO);
    const feeRate = this.calculateFeeRate(memberLevel);
    const gross = cfj369Amount.div(ratio);
    const feeAmount = gross.mul(feeRate);
    const net = gross.minus(feeAmount);
    // 费用按 5:3:2 分配
    const feeDestruction = feeAmount.mul('0.5');
    const feeEcosystem = feeAmount.mul('0.3');
    const feeLiquidity = feeAmount.mul('0.2');

    return this.withTransaction(async (tx) => {
      const conversion = await (tx as any).fjnConversionOrder.create({
        data: {
          conversionNo: `TFJ369-CONV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: input.userId,
          cfj369Amount,
          convertRatio: ratio,
          memberLevel,
          tFJ369Gross: gross,
          feeRate,
          feeAmount,
          tFJ369Net: net,
          feeDestruction,
          feeEcosystemPool: feeEcosystem,
          feeLiquidityPool: feeLiquidity,
          status: TPOINTS_CONVERSION_STATUS.CREATED,
          kycVerified: input.kycVerified ?? false,
          regionAllowed: input.regionAllowed ?? false,
          riskStatus: input.riskStatus ?? TPOINTS_RISK_STATUS.NORMAL,
        },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_CONVERSION_REQUESTED, {
        conversionNo: conversion.conversionNo,
        userId: input.userId,
        cfj369Amount: cfj369Amount.toFixed(TPOINTS_AMOUNT_PRECISION),
        tFJ369Net: net.toFixed(TPOINTS_AMOUNT_PRECISION),
        memberLevel,
      });
      this.log('info', `tFJ369 conversion requested: ${conversion.conversionNo}`, { userId: input.userId, net: net.toString() });
      return conversion;
    });
  }

  async approveConversion(input: ApproveConversionInput) {
    return this.withTransaction(async (tx) => {
      const conv = await (tx as any).fjnConversionOrder.findUnique({ where: { conversionNo: input.conversionNo } });
      if (!conv) throw new Tfj369ConversionNotFoundError({ conversionNo: input.conversionNo });
      if (conv.status !== TPOINTS_CONVERSION_STATUS.CREATED && conv.status !== TPOINTS_CONVERSION_STATUS.RISK_CHECKING) {
        return { conversion: conv, message: `status=${conv.status}, no-op` };
      }
      const updated = await (tx as any).fjnConversionOrder.update({
        where: { id: conv.id },
        data: {
          status: TPOINTS_CONVERSION_STATUS.APPROVED,
          approverId: input.approverId,
          approvedAt: new Date(),
        },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_CONVERSION_APPROVED, {
        conversionNo: input.conversionNo,
        approverId: input.approverId,
      });
      this.log('info', `tFJ369 conversion approved: ${input.conversionNo}`, { approverId: input.approverId });
      return updated;
    });
  }

  async executeConversion(input: ExecuteConversionInput) {
    return this.withTransaction(async (tx) => {
      const conv = await (tx as any).fjnConversionOrder.findUnique({ where: { conversionNo: input.conversionNo } });
      if (!conv) throw new Tfj369ConversionNotFoundError({ conversionNo: input.conversionNo });
      if (conv.status !== TPOINTS_CONVERSION_STATUS.APPROVED) {
        return { conversion: conv, message: `status=${conv.status}, cannot execute` };
      }
      if (!input.txHash) {
        throw new Tfj369SolanaMintFailedError({ conversionNo: input.conversionNo, reason: 'txHash required' });
      }
      const updated = await (tx as any).fjnConversionOrder.update({
        where: { id: conv.id },
        data: {
          status: TPOINTS_CONVERSION_STATUS.EXECUTED,
          txHash: input.txHash,
          executedAt: new Date(),
        },
      });
      // 链下账本加 tFJ369
      await this.mint({
        userId: conv.userId,
        amount: conv.tFJ369Net.toString(),
        sourceType: 'conversion',
        sourceId: conv.id,
        bizType: 'cfj369_to_tfj369',
        txHash: input.txHash,
        operatorId: input.operatorId,
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_CONVERSION_EXECUTED, {
        conversionNo: input.conversionNo,
        txHash: input.txHash,
        tFJ369Net: conv.tFJ369Net.toString(),
      });
      this.log('info', `tFJ369 conversion executed: ${input.conversionNo}`, { txHash: input.txHash });
      return updated;
    });
  }

  async cancelConversion(conversionNo: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const conv = await (tx as any).fjnConversionOrder.findUnique({ where: { conversionNo } });
      if (!conv) throw new Tfj369ConversionNotFoundError({ conversionNo });
      if (conv.status === TPOINTS_CONVERSION_STATUS.EXECUTED) {
        return { conversion: conv, message: 'already executed, cannot cancel' };
      }
      const updated = await (tx as any).fjnConversionOrder.update({
        where: { id: conv.id },
        data: { status: TPOINTS_CONVERSION_STATUS.CANCELLED, failureReason: reason },
      });
      await this.emitEvent(tx, TFJ369_EVENTS.TFJ369_CONVERSION_FAILED, {
        conversionNo,
        reason,
        operatorId,
      });
      this.log('info', `tFJ369 conversion cancelled: ${conversionNo}`, { reason });
      return updated;
    });
  }

  async getConversion(conversionNo: string) {
    const conv = await (this.prisma as any).fjnConversionOrder.findUnique({ where: { conversionNo } });
    if (!conv) throw new Tfj369ConversionNotFoundError({ conversionNo });
    return conv;
  }

  // ============================================================
  // 7. 工具
  // ============================================================

  async getBalance(userId: string) {
    const acc = await this.getAccount(userId);
    return {
      userId,
      available: acc.availableBalance.toString(),
      locked: acc.lockedBalance.toString(),
      frozen: acc.frozenBalance.toString(),
      inOrder: acc.inOrderBalance.toString(),
      consumed: acc.consumedBalance.toString(),
      burned: acc.burnedBalance.toString(),
      totalEarned: acc.totalEarned.toString(),
      status: acc.status,
    };
  }

  async getLedgerTrace(userId: string, limit: number = 50) {
    return (this.prisma as any).fjnTPointsLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  /** 管理后台：列出账户（分页） */
  async listAccounts(input: { status?: FjnTPointsAccountStatus; page?: number; pageSize?: number } = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnTPointsAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnTPointsAccount.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** 管理后台：列出流水（分页） */
  async listLedgers(input: { userId?: string; changeType?: FjnTPointsChangeType; page?: number; pageSize?: number } = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.changeType) where.changeType = input.changeType;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnTPointsLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnTPointsLedger.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** 管理后台：列出转换单（分页） */
  async listConversions(input: { userId?: string; status?: FjnTPointsConversionStatus; page?: number; pageSize?: number } = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnConversionOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnConversionOrder.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  // ============================================================
  // 8. 私有：费用率
  // ============================================================

  private calculateFeeRate(memberLevel: FjnTPointsMemberLevel): Prisma.Decimal {
    const map: Record<FjnTPointsMemberLevel, string> = {
      [TPOINTS_MEMBER_LEVEL.STANDARD]: '0.05',
      [TPOINTS_MEMBER_LEVEL.SILVER]: '0.04',
      [TPOINTS_MEMBER_LEVEL.GOLD]: '0.03',
      [TPOINTS_MEMBER_LEVEL.PLATINUM]: '0.02',
      [TPOINTS_MEMBER_LEVEL.DIAMOND]: '0.01',
    };
    return new Prisma.Decimal(map[memberLevel] ?? '0.05');
  }
}

/** Factory */
export function createFjnTfj369Service(options?: FjnServiceOptions): FjnTfj369Service {
  return new FjnTfj369Service(options);
}
