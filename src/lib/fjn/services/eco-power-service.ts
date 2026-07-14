/**
 * Eco Power Service - 业务主体
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.5
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.10
 *
 * 职责范围：
 *  - 算力账户（13 种算力分桶）
 *  - 算力流水（FjnPowerLedger）
 *  - 算力规则（vip 倍率 / 活跃倍率 / 风控系数）
 *  - 算力计算（effectivePower = totalPower × memberMul × activityMul × riskCoef）
 *  - 算力冻结（status=frozen + freeze ledger）
 *  - 算力快照（FjnPowerSnapshot）
 *  - 释放计算源数据
 *
 * 链下真相源：FjnPowerAccount / FjnPowerLedger / FjnPowerSnapshot
 * 链上：可选 anchor snapshot 哈希到 Solana（不在 Service 主路径）
 */

import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  POWER_TYPE,
  POWER_CHANGE_TYPE,
  POWER_SOURCE_TYPE,
  POWER_ACCOUNT_STATUS,
  POWER_SNAPSHOT_TYPE,
  POWER_TYPE_TO_ACCOUNT_FIELD,
  POWER_DEFAULT_MEMBER_MULTIPLIER,
  POWER_DEFAULT_ACTIVITY_MULTIPLIER,
  POWER_DEFAULT_RISK_COEFFICIENT,
  POWER_DEFAULT_VALIDITY_BY_TYPE,
  POWER_FREEZE_AUTO_REVIEW_HOURS,
  isValidPowerType,
  isValidPowerChangeType,
  isValidPowerSourceType,
  isValidPowerAccountStatus,
  isValidPowerSnapshotType,
  isPositiveChangeType,
  isNegativeChangeType,
  isAccountOperable,
  canTransitPowerAccountStatus,
  assertTransitPowerAccountStatus,
  isTerminalPowerAccountStatus,
  isValidPowerAmount,
  isValidMultiplier,
  type FjnPowerType,
  type FjnPowerChangeType,
  type FjnPowerSourceType,
  type FjnPowerAccountStatus,
  type FjnPowerSnapshotType,
} from './eco-power-state-machine';
import {
  ECO_POWER_EVENTS,
  ECO_POWER_EVENT_SOURCES,
  type FjnEcoPowerEventSource,
} from './eco-power-events';
import {
  AccountNotFoundError,
  AccountAlreadyExistsError,
  AccountClosedError,
  AccountNotOperableError,
  AccountStatusInvalidError,
  AccountStatusTransitionForbiddenError,
  UserIdRequiredError,
  PowerTypeInvalidError,
  PowerTypeNotFoundInAccountError,
  PowerChangeTypeInvalidError,
  PowerSourceTypeInvalidError,
  PowerSnapshotTypeInvalidError,
  PowerAmountRequiredError,
  PowerAmountInvalidError,
  PowerAmountOutOfRangeError,
  PowerAmountZeroError,
  PowerInsufficientError,
  MemberMultiplierInvalidError,
  ActivityMultiplierInvalidError,
  RiskCoefficientInvalidError,
  MultiplierOutOfRangeError,
  LedgerNotFoundError,
  LedgerAmountInvalidError,
  SnapshotNotFoundError,
  SnapshotAlreadyExistsError,
  FreezeAmountInvalidError,
  FreezeReasonRequiredError,
  UnfreezeReasonRequiredError,
  TransferToSelfForbiddenError,
  TransferTargetAccountNotFoundError,
  ReleaseCalculationNotReadyError,
  ReleaseCalculationDuplicateError,
  ExpireDateInvalidError,
  SelfAdjustForbiddenError,
  RuleCodeRequiredError,
  RuleVersionInvalidError,
  InternalCalculationError,
  EffectiveRecalculationFailedError,
} from './eco-power-errors';

// ============================================================
// 1. 入参 / 返回类型
// ============================================================

/** 创建账户 */
export interface CreateAccountInput {
  userId: string;
  operatorId?: string;
}
export interface PowerAccountSummary {
  id: string;
  userId: string;
  totalPower: string;
  effectivePower: string;
  memberMultiplier: string;
  activityMultiplier: string;
  riskCoefficient: string;
  lastSnapshotAt: Date | null;
  status: FjnPowerAccountStatus;
  // 13 种分桶
  basePower: string;
  consumePower: string;
  mallPower: string;
  nftPower: string;
  virtualPointsPower: string;
  gamingPower: string;
  aiPower: string;
  corporatePower: string;
  communityPower: string;
  tFJ369HoldPower: string;
  tFJ369LockPower: string;
  nodePower: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 变更账户状态 */
export interface ChangeAccountStatusInput {
  accountId: string;
  userId?: string;
  toStatus: FjnPowerAccountStatus;
  reason?: string;
  operatorId?: string;
}

/** 授予算力 */
export interface GrantPowerInput {
  userId: string;
  accountId?: string;
  powerType: FjnPowerType;
  amount: string;
  changeType?: FjnPowerChangeType;
  sourceType: FjnPowerSourceType;
  sourceId?: string;
  ruleCode?: string;
  ruleVersion?: string;
  expiresAt?: Date;
  expiresInDays?: number;
  remark?: string;
  operatorId?: string;
}

/** 消费算力 */
export interface ConsumePowerInput {
  userId: string;
  accountId?: string;
  powerType: FjnPowerType;
  amount: string;
  sourceType: FjnPowerSourceType;
  sourceId?: string;
  remark?: string;
  operatorId?: string;
}

/** 调整算力（管理员） */
export interface AdjustPowerInput {
  userId: string;
  accountId?: string;
  powerType: FjnPowerType;
  amount: string;
  direction: 'add' | 'subtract';
  reason: string;
  ruleCode?: string;
  ruleVersion?: string;
  operatorId: string;
}

/** 转移算力 */
export interface TransferPowerInput {
  fromUserId: string;
  toUserId: string;
  powerType: FjnPowerType;
  amount: string;
  sourceType?: FjnPowerSourceType;
  remark?: string;
  operatorId?: string;
}

/** 冻结算力 */
export interface FreezePowerInput {
  userId: string;
  accountId?: string;
  powerType: FjnPowerType;
  amount: string;
  reason: string;
  operatorId: string;
}

/** 解冻算力 */
export interface UnfreezePowerInput {
  userId: string;
  ledgerId: string;
  reason: string;
  operatorId: string;
}

/** 设置会员倍率 */
export interface SetMemberMultiplierInput {
  userId: string;
  accountId?: string;
  multiplier: string;
  reason: string;
  operatorId: string;
}

/** 设置活跃倍率 */
export interface SetActivityMultiplierInput {
  userId: string;
  accountId?: string;
  multiplier: string;
  reason: string;
  operatorId: string;
}

/** 设置风控系数 */
export interface SetRiskCoefficientInput {
  userId: string;
  accountId?: string;
  coefficient: string;
  reason: string;
  operatorId: string;
}

/** 创建快照 */
export interface CreateSnapshotInput {
  userId: string;
  accountId?: string;
  snapshotType: FjnPowerSnapshotType;
  networkTotalPower?: string;
  snapshotData?: Prisma.InputJsonValue;
  operatorId?: string;
}

/** 释放计算源数据 */
export interface PrepareReleaseCalcInput {
  userId: string;
  accountId?: string;
  snapshotType?: FjnPowerSnapshotType;
  networkTotalPower: string;
}

/** 释放计算结果 */
export interface ReleaseCalcResult {
  accountId: string;
  userId: string;
  snapshotId: string;
  effectivePower: string;
  networkTotalPower: string;
  powerRatio: string;
}

/** Ledger 列表查询 */
export interface ListLedgerInput {
  userId?: string;
  accountId?: string;
  powerType?: FjnPowerType;
  changeType?: FjnPowerChangeType;
  sourceType?: FjnPowerSourceType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/** Ledger 摘要 */
export interface PowerLedgerSummary {
  id: string;
  ledgerNo: string;
  accountId: string;
  userId: string;
  powerType: FjnPowerType;
  changeType: FjnPowerChangeType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  sourceType?: string | null;
  sourceId?: string | null;
  ruleCode?: string | null;
  ruleVersion?: string | null;
  expiresAt?: Date | null;
  operatorId?: string | null;
  remark?: string | null;
  createdAt: Date;
}

/** Snapshot 摘要 */
export interface PowerSnapshotSummary {
  id: string;
  snapshotNo: string;
  accountId: string;
  userId: string;
  snapshotType: FjnPowerSnapshotType;
  totalPower: string;
  effectivePower: string;
  memberMultiplier: string;
  activityMultiplier: string;
  riskCoefficient: string;
  networkTotalPower?: string | null;
  powerRatio?: string | null;
  snapshotData?: Prisma.InputJsonValue | null;
  createdAt: Date;
}

// ============================================================
// 2. Service 主体
// ============================================================

export class FjnEcoPowerService extends FjnServiceBase {
  constructor(options?: FjnServiceOptions) {
    super({ ...options, serviceName: options?.serviceName ?? 'FjnEcoPowerService' });
  }

  // ----- 事件发射 -----
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnEcoPowerEventSource = ECO_POWER_EVENT_SOURCES.ECO_POWER_SERVICE,
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

  // ----- 工具：生成 ledgerNo -----
  private generateLedgerNo(): string {
    return `FJN-PWL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private generateSnapshotNo(): string {
    return `FJN-PWS-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // ----- 工具：账户字段读取/写入 -----
  private getAccountFieldValue(account: any, powerType: FjnPowerType): string {
    const field = POWER_TYPE_TO_ACCOUNT_FIELD[powerType];
    if (!field) throw new PowerTypeNotFoundInAccountError({ powerType });
    const v = account[field];
    return v == null ? '0' : v.toString();
  }

  private setAccountFieldValue(data: Record<string, unknown>, powerType: FjnPowerType, value: string): void {
    const field = POWER_TYPE_TO_ACCOUNT_FIELD[powerType];
    if (!field) throw new PowerTypeNotFoundInAccountError({ powerType });
    data[field] = value;
  }

  // ----- 工具：合计 13 种算力桶 = totalPower -----
  private sumAllPowerBuckets(account: any): string {
    const fields: string[] = Object.values(POWER_TYPE_TO_ACCOUNT_FIELD);
    let total = 0;
    for (const f of fields) {
      total += Number((account as any)[f] ?? 0);
    }
    return total.toFixed(4);
  }

  // ----- 工具：effectivePower = totalPower × memberMul × activityMul × riskCoef -----
  private calcEffectivePower(
    totalPower: string,
    memberMul: string,
    activityMul: string,
    riskCoef: string,
  ): string {
    const t = Number(totalPower);
    const m = Number(memberMul);
    const a = Number(activityMul);
    const r = Number(riskCoef);
    if (isNaN(t) || isNaN(m) || isNaN(a) || isNaN(r)) {
      throw new InternalCalculationError({ totalPower, memberMul, activityMul, riskCoef });
    }
    const effective = t * m * a * r;
    return effective.toFixed(4);
  }

  // ----- 工具：toSummary -----
  toAccountSummary(account: any): PowerAccountSummary {
    return {
      id: account.id,
      userId: account.userId,
      totalPower: account.totalPower?.toString() ?? '0',
      effectivePower: account.effectivePower?.toString() ?? '0',
      memberMultiplier: account.memberMultiplier?.toString() ?? POWER_DEFAULT_MEMBER_MULTIPLIER,
      activityMultiplier: account.activityMultiplier?.toString() ?? POWER_DEFAULT_ACTIVITY_MULTIPLIER,
      riskCoefficient: account.riskCoefficient?.toString() ?? POWER_DEFAULT_RISK_COEFFICIENT,
      lastSnapshotAt: account.lastSnapshotAt ?? null,
      status: account.status,
      basePower: account.basePower?.toString() ?? '0',
      consumePower: account.consumePower?.toString() ?? '0',
      mallPower: account.mallPower?.toString() ?? '0',
      nftPower: account.nftPower?.toString() ?? '0',
      virtualPointsPower: account.virtualPointsPower?.toString() ?? '0',
      gamingPower: account.gamingPower?.toString() ?? '0',
      aiPower: account.aiPower?.toString() ?? '0',
      corporatePower: account.corporatePower?.toString() ?? '0',
      communityPower: account.communityPower?.toString() ?? '0',
      tFJ369HoldPower: account.tFJ369HoldPower?.toString() ?? '0',
      tFJ369LockPower: account.tFJ369LockPower?.toString() ?? '0',
      nodePower: account.nodePower?.toString() ?? '0',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  toLedgerSummary(ledger: any): PowerLedgerSummary {
    return {
      id: ledger.id,
      ledgerNo: ledger.ledgerNo,
      accountId: ledger.accountId,
      userId: ledger.userId,
      powerType: ledger.powerType,
      changeType: ledger.changeType,
      amount: ledger.amount?.toString() ?? '0',
      balanceBefore: ledger.balanceBefore?.toString() ?? '0',
      balanceAfter: ledger.balanceAfter?.toString() ?? '0',
      sourceType: ledger.sourceType ?? null,
      sourceId: ledger.sourceId ?? null,
      ruleCode: ledger.ruleCode ?? null,
      ruleVersion: ledger.ruleVersion ?? null,
      expiresAt: ledger.expiresAt ?? null,
      operatorId: ledger.operatorId ?? null,
      remark: ledger.remark ?? null,
      createdAt: ledger.createdAt,
    };
  }

  toSnapshotSummary(snap: any): PowerSnapshotSummary {
    return {
      id: snap.id,
      snapshotNo: snap.snapshotNo,
      accountId: snap.accountId,
      userId: snap.userId,
      snapshotType: snap.snapshotType,
      totalPower: snap.totalPower?.toString() ?? '0',
      effectivePower: snap.effectivePower?.toString() ?? '0',
      memberMultiplier: snap.memberMultiplier?.toString() ?? POWER_DEFAULT_MEMBER_MULTIPLIER,
      activityMultiplier: snap.activityMultiplier?.toString() ?? POWER_DEFAULT_ACTIVITY_MULTIPLIER,
      riskCoefficient: snap.riskCoefficient?.toString() ?? POWER_DEFAULT_RISK_COEFFICIENT,
      networkTotalPower: snap.networkTotalPower?.toString() ?? null,
      powerRatio: snap.powerRatio?.toString() ?? null,
      snapshotData: snap.snapshotData ?? null,
      createdAt: snap.createdAt,
    };
  }

  // ==========================================================
  // 3. 账户 CRUD
  // ==========================================================

  /** 创建账户（一个 userId 一个账户） */
  async createAccount(input: CreateAccountInput): Promise<PowerAccountSummary> {
    if (!input.userId) throw new UserIdRequiredError();
    return this.withTransaction(async (tx) => {
      const existing = await (tx as any).fjnPowerAccount.findFirst({
        where: { userId: input.userId },
      });
      if (existing) {
        throw new AccountAlreadyExistsError({ userId: input.userId });
      }
      const created = await (tx as any).fjnPowerAccount.create({
        data: {
          userId: input.userId,
          totalPower: '0',
          effectivePower: '0',
          memberMultiplier: POWER_DEFAULT_MEMBER_MULTIPLIER,
          activityMultiplier: POWER_DEFAULT_ACTIVITY_MULTIPLIER,
          riskCoefficient: POWER_DEFAULT_RISK_COEFFICIENT,
          status: POWER_ACCOUNT_STATUS.ACTIVE,
        },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.ACCOUNT_CREATED, {
        accountId: created.id,
        userId: created.userId,
        totalPower: '0',
        effectivePower: '0',
        createdAt: created.createdAt.toISOString(),
      });
      this.log('info', `power account created: ${created.id}`, { userId: input.userId });
      return this.toAccountSummary(created);
    });
  }

  /** 获取账户 */
  async getAccountByUserId(userId: string): Promise<PowerAccountSummary | null> {
    const account = await (this.prisma as any).fjnPowerAccount.findFirst({
      where: { userId },
    });
    return account ? this.toAccountSummary(account) : null;
  }

  async getAccountById(accountId: string): Promise<PowerAccountSummary | null> {
    const account = await (this.prisma as any).fjnPowerAccount.findUnique({
      where: { id: accountId },
    });
    return account ? this.toAccountSummary(account) : null;
  }

  /** 变更账户状态 */
  async changeAccountStatus(input: ChangeAccountStatusInput): Promise<PowerAccountSummary> {
    if (!isValidPowerAccountStatus(input.toStatus)) {
      throw new AccountStatusInvalidError({ toStatus: input.toStatus });
    }
    return this.withTransaction(async (tx) => {
      const account = await (tx as any).fjnPowerAccount.findUnique({
        where: { id: input.accountId },
      });
      if (!account) throw new AccountNotFoundError({ accountId: input.accountId });
      if (!canTransitPowerAccountStatus(account.status, input.toStatus)) {
        throw new AccountStatusTransitionForbiddenError({
          accountId: input.accountId,
          from: account.status,
          to: input.toStatus,
        });
      }
      assertTransitPowerAccountStatus(account.status, input.toStatus);
      const updated = await (tx as any).fjnPowerAccount.update({
        where: { id: input.accountId },
        data: { status: input.toStatus },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.ACCOUNT_STATUS_CHANGED, {
        accountId: input.accountId,
        userId: updated.userId,
        fromStatus: account.status,
        toStatus: input.toStatus,
        reason: input.reason,
        operatorId: input.operatorId ?? null,
        changedAt: new Date().toISOString(),
      });
      if (isTerminalPowerAccountStatus(input.toStatus)) {
        await this.emitEvent(tx, ECO_POWER_EVENTS.ACCOUNT_CLOSED, {
          accountId: input.accountId,
          userId: updated.userId,
          reason: input.reason ?? 'unspecified',
          closedAt: new Date().toISOString(),
          operatorId: input.operatorId ?? null,
        });
      }
      this.log('info', `power account status changed: ${input.accountId}`, {
        from: account.status,
        to: input.toStatus,
      });
      return this.toAccountSummary(updated);
    });
  }

  // ==========================================================
  // 4. 算力变动：grant / consume / adjust / transfer
  // ==========================================================

  /** 核心：写入 ledger + 更新账户桶 + 触发事件 */
  private async writePowerChange(
    tx: any,
    account: any,
    powerType: FjnPowerType,
    changeType: FjnPowerChangeType,
    amount: string,
    source: {
      sourceType?: FjnPowerSourceType;
      sourceId?: string;
      ruleCode?: string;
      ruleVersion?: string;
      expiresAt?: Date | null;
      operatorId?: string | null;
      remark?: string | null;
    } & Record<string, unknown>,
  ): Promise<{ ledger: any; updatedAccount: any; balanceAfter: string }> {
    if (!isValidPowerType(powerType)) throw new PowerTypeInvalidError({ powerType });
    if (!isValidPowerChangeType(changeType)) {
      throw new PowerChangeTypeInvalidError({ changeType });
    }
    if (!isValidPowerAmount(amount)) throw new PowerAmountInvalidError({ amount });
    const amt = Number(amount);
    if (amt === 0) throw new PowerAmountZeroError();

    // 1. 余额前值
    const balanceBefore = this.getAccountFieldValue(account, powerType);

    // 2. 计算余额后值
    let balanceAfter: string;
    if (isPositiveChangeType(changeType) || changeType === POWER_CHANGE_TYPE.UNFREEZE) {
      balanceAfter = (Number(balanceBefore) + amt).toFixed(4);
    } else if (isNegativeChangeType(changeType) || changeType === POWER_CHANGE_TYPE.FREEZE) {
      const next = Number(balanceBefore) - amt;
      if (next < 0) {
        throw new PowerInsufficientError({
          accountId: account.id,
          powerType,
          balanceBefore,
          requested: amount,
        });
      }
      balanceAfter = next.toFixed(4);
    } else {
      throw new PowerChangeTypeInvalidError({ changeType });
    }

    // 3. 写入 ledger
    const ledger = await (tx as any).fjnPowerLedger.create({
      data: {
        ledgerNo: this.generateLedgerNo(),
        accountId: account.id,
        userId: account.userId,
        powerType,
        changeType,
        amount: amt.toFixed(4),
        balanceBefore,
        balanceAfter,
        sourceType: source.sourceType ?? null,
        sourceId: source.sourceId ?? null,
        ruleCode: source.ruleCode ?? null,
        ruleVersion: source.ruleVersion ?? null,
        expiresAt: source.expiresAt ?? null,
        operatorId: source.operatorId ?? null,
        remark: source.remark ?? null,
      },
    });

    // 4. 更新账户对应桶
    const updateData: Record<string, unknown> = {};
    this.setAccountFieldValue(updateData, powerType, balanceAfter);

    // 5. 重新合计 totalPower + effectivePower
    const tempAccount = { ...account, ...updateData };
    const newTotal = this.sumAllPowerBuckets(tempAccount);
    const newEffective = this.calcEffectivePower(
      newTotal,
      tempAccount.memberMultiplier?.toString() ?? POWER_DEFAULT_MEMBER_MULTIPLIER,
      tempAccount.activityMultiplier?.toString() ?? POWER_DEFAULT_ACTIVITY_MULTIPLIER,
      tempAccount.riskCoefficient?.toString() ?? POWER_DEFAULT_RISK_COEFFICIENT,
    );
    updateData.totalPower = newTotal;
    updateData.effectivePower = newEffective;

    const updatedAccount = await (tx as any).fjnPowerAccount.update({
      where: { id: account.id },
      data: updateData,
    });

    return { ledger, updatedAccount, balanceAfter };
  }

  /** 授予算力（正变动） */
  async grantPower(input: GrantPowerInput): Promise<{ ledger: PowerLedgerSummary; account: PowerAccountSummary }> {
    if (!input.userId) throw new UserIdRequiredError();
    if (!isValidPowerType(input.powerType)) {
      throw new PowerTypeInvalidError({ powerType: input.powerType });
    }
    if (!isValidPowerSourceType(input.sourceType)) {
      throw new PowerSourceTypeInvalidError({ sourceType: input.sourceType });
    }
    if (!isValidPowerAmount(input.amount)) {
      throw new PowerAmountInvalidError({ amount: input.amount });
    }
    if (Number(input.amount) === 0) throw new PowerAmountZeroError();
    // 验证有效期
    let expiresAt: Date | undefined | null = input.expiresAt;
    if (!expiresAt && input.expiresInDays) {
      expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 3600 * 1000);
    } else if (!expiresAt) {
      const days = POWER_DEFAULT_VALIDITY_BY_TYPE[input.powerType];
      if (days > 0) {
        expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);
      }
    }

    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const changeType = input.changeType ?? POWER_CHANGE_TYPE.GRANT;
      const { ledger, updatedAccount, balanceAfter } = await this.writePowerChange(
        tx,
        account,
        input.powerType,
        changeType,
        input.amount,
        {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          ruleCode: input.ruleCode,
          ruleVersion: input.ruleVersion,
          expiresAt: expiresAt ?? null,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? null,
        },
      );

      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_GRANTED, {
        accountId: account.id,
        userId: account.userId,
        ledgerId: ledger.id,
        ledgerNo: ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        balanceBefore: ledger.balanceBefore.toString(),
        balanceAfter,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ruleCode: input.ruleCode,
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        operatorId: input.operatorId ?? null,
        grantedAt: ledger.createdAt.toISOString(),
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.EFFECTIVE_POWER_RECALCULATED, {
        accountId: account.id,
        userId: account.userId,
        totalPower: updatedAccount.totalPower.toString(),
        memberMultiplier: updatedAccount.memberMultiplier.toString(),
        activityMultiplier: updatedAccount.activityMultiplier.toString(),
        riskCoefficient: updatedAccount.riskCoefficient.toString(),
        effectivePower: updatedAccount.effectivePower.toString(),
        recalculatedAt: new Date().toISOString(),
      });
      this.log('info', `power granted: ${input.powerType} +${input.amount}`, { userId: account.userId });
      return {
        ledger: this.toLedgerSummary(ledger),
        account: this.toAccountSummary(updatedAccount),
      };
    });
  }

  /** 消费算力（负变动） */
  async consumePower(input: ConsumePowerInput): Promise<{ ledger: PowerLedgerSummary; account: PowerAccountSummary }> {
    if (!input.userId) throw new UserIdRequiredError();
    if (!isValidPowerType(input.powerType)) {
      throw new PowerTypeInvalidError({ powerType: input.powerType });
    }
    if (!isValidPowerSourceType(input.sourceType)) {
      throw new PowerSourceTypeInvalidError({ sourceType: input.sourceType });
    }
    if (!isValidPowerAmount(input.amount)) {
      throw new PowerAmountInvalidError({ amount: input.amount });
    }
    if (Number(input.amount) === 0) throw new PowerAmountZeroError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const { ledger, updatedAccount, balanceAfter } = await this.writePowerChange(
        tx,
        account,
        input.powerType,
        POWER_CHANGE_TYPE.CONSUME,
        input.amount,
        {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? null,
        },
      );

      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_CONSUMED, {
        accountId: account.id,
        userId: account.userId,
        ledgerId: ledger.id,
        ledgerNo: ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        balanceBefore: ledger.balanceBefore.toString(),
        balanceAfter,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        consumedAt: ledger.createdAt.toISOString(),
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.EFFECTIVE_POWER_RECALCULATED, {
        accountId: account.id,
        userId: account.userId,
        totalPower: updatedAccount.totalPower.toString(),
        memberMultiplier: updatedAccount.memberMultiplier.toString(),
        activityMultiplier: updatedAccount.activityMultiplier.toString(),
        riskCoefficient: updatedAccount.riskCoefficient.toString(),
        effectivePower: updatedAccount.effectivePower.toString(),
        recalculatedAt: new Date().toISOString(),
      });
      this.log('info', `power consumed: ${input.powerType} -${input.amount}`, { userId: account.userId });
      return {
        ledger: this.toLedgerSummary(ledger),
        account: this.toAccountSummary(updatedAccount),
      };
    });
  }

  /** 调整算力（管理员） */
  async adjustPower(input: AdjustPowerInput): Promise<{ ledger: PowerLedgerSummary; account: PowerAccountSummary }> {
    if (!input.userId) throw new UserIdRequiredError();
    if (!input.operatorId) {
      throw new SelfAdjustForbiddenError({ reason: 'operatorId required' });
    }
    if (input.userId === input.operatorId) {
      throw new SelfAdjustForbiddenError({ userId: input.userId });
    }
    if (!input.reason) throw new RuleCodeRequiredError();
    if (!isValidPowerType(input.powerType)) {
      throw new PowerTypeInvalidError({ powerType: input.powerType });
    }
    if (!isValidPowerAmount(input.amount)) {
      throw new PowerAmountInvalidError({ amount: input.amount });
    }
    if (Number(input.amount) === 0) throw new PowerAmountZeroError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const changeType =
        input.direction === 'add' ? POWER_CHANGE_TYPE.ADJUST_ADD : POWER_CHANGE_TYPE.ADJUST_SUBTRACT;
      const { ledger, updatedAccount, balanceAfter } = await this.writePowerChange(
        tx,
        account,
        input.powerType,
        changeType,
        input.amount,
        {
          sourceType: POWER_SOURCE_TYPE.ADMIN_ADJUST,
          ruleCode: input.ruleCode,
          ruleVersion: input.ruleVersion,
          operatorId: input.operatorId,
          remark: input.reason,
        },
      );
      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_ADJUSTED, {
        accountId: account.id,
        userId: account.userId,
        ledgerId: ledger.id,
        ledgerNo: ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        direction: input.direction,
        reason: input.reason,
        balanceBefore: ledger.balanceBefore.toString(),
        balanceAfter,
        operatorId: input.operatorId,
        adjustedAt: ledger.createdAt.toISOString(),
      });
      this.log('info', `power adjusted: ${input.powerType} ${input.direction} ${input.amount}`, {
        userId: account.userId,
        operatorId: input.operatorId,
      });
      return {
        ledger: this.toLedgerSummary(ledger),
        account: this.toAccountSummary(updatedAccount),
      };
    });
  }

  /** 转移算力（用户间） */
  async transferPower(input: TransferPowerInput): Promise<{ from: PowerLedgerSummary; to: PowerLedgerSummary }> {
    if (!input.fromUserId || !input.toUserId) throw new UserIdRequiredError();
    if (input.fromUserId === input.toUserId) throw new TransferToSelfForbiddenError();
    if (!isValidPowerType(input.powerType)) {
      throw new PowerTypeInvalidError({ powerType: input.powerType });
    }
    if (!isValidPowerAmount(input.amount)) {
      throw new PowerAmountInvalidError({ amount: input.amount });
    }
    if (Number(input.amount) === 0) throw new PowerAmountZeroError();
    return this.withTransaction(async (tx) => {
      const fromAccount = await this.lockAccount(tx, input.fromUserId, undefined);
      if (!fromAccount) throw new AccountNotFoundError({ userId: input.fromUserId });
      if (!isAccountOperable(fromAccount.status)) {
        throw new AccountNotOperableError({ accountId: fromAccount.id, status: fromAccount.status });
      }
      const toAccount = await this.lockAccount(tx, input.toUserId, undefined);
      if (!toAccount) {
        throw new TransferTargetAccountNotFoundError({ toUserId: input.toUserId });
      }
      if (!isAccountOperable(toAccount.status)) {
        throw new AccountNotOperableError({ accountId: toAccount.id, status: toAccount.status });
      }
      const sourceType = input.sourceType ?? POWER_SOURCE_TYPE.TRANSFER;

      // 1. from transfer_out
      const out = await this.writePowerChange(
        tx,
        fromAccount,
        input.powerType,
        POWER_CHANGE_TYPE.TRANSFER_OUT,
        input.amount,
        {
          sourceType,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? `transfer to ${input.toUserId}`,
        },
      );

      // 2. to transfer_in
      const inChange = await this.writePowerChange(
        tx,
        toAccount,
        input.powerType,
        POWER_CHANGE_TYPE.TRANSFER_IN,
        input.amount,
        {
          sourceType,
          operatorId: input.operatorId ?? null,
          remark: input.remark ?? `transfer from ${input.fromUserId}`,
        },
      );

      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_TRANSFERRED_OUT, {
        accountId: fromAccount.id,
        userId: fromAccount.userId,
        toUserId: input.toUserId,
        ledgerId: out.ledger.id,
        ledgerNo: out.ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        balanceBefore: out.ledger.balanceBefore.toString(),
        balanceAfter: out.balanceAfter,
        transferredAt: out.ledger.createdAt.toISOString(),
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_TRANSFERRED_IN, {
        accountId: toAccount.id,
        userId: toAccount.userId,
        fromUserId: input.fromUserId,
        ledgerId: inChange.ledger.id,
        ledgerNo: inChange.ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        balanceBefore: inChange.ledger.balanceBefore.toString(),
        balanceAfter: inChange.balanceAfter,
        transferredAt: inChange.ledger.createdAt.toISOString(),
      });
      this.log('info', `power transferred: ${input.fromUserId} -> ${input.toUserId}`, {
        powerType: input.powerType,
        amount: input.amount,
      });
      return {
        from: this.toLedgerSummary(out.ledger),
        to: this.toLedgerSummary(inChange.ledger),
      };
    });
  }

  // ==========================================================
  // 5. 冻结 / 解冻
  // ==========================================================

  /** 冻结算力（风控专用） */
  async freezePower(input: FreezePowerInput): Promise<{ ledger: PowerLedgerSummary; account: PowerAccountSummary }> {
    if (!input.userId) throw new UserIdRequiredError();
    if (!input.reason) throw new FreezeReasonRequiredError();
    if (!input.operatorId) throw new SelfAdjustForbiddenError({ reason: 'operatorId required' });
    if (!isValidPowerType(input.powerType)) {
      throw new PowerTypeInvalidError({ powerType: input.powerType });
    }
    if (!isValidPowerAmount(input.amount)) {
      throw new FreezeAmountInvalidError({ amount: input.amount });
    }
    if (Number(input.amount) === 0) throw new PowerAmountZeroError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const { ledger, updatedAccount, balanceAfter } = await this.writePowerChange(
        tx,
        account,
        input.powerType,
        POWER_CHANGE_TYPE.FREEZE,
        input.amount,
        {
          sourceType: POWER_SOURCE_TYPE.RISK_FREEZE,
          operatorId: input.operatorId,
          remark: input.reason,
        },
      );
      const reviewDeadline = new Date(
        Date.now() + POWER_FREEZE_AUTO_REVIEW_HOURS * 3600 * 1000,
      );
      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_FROZEN, {
        accountId: account.id,
        userId: account.userId,
        ledgerId: ledger.id,
        ledgerNo: ledger.ledgerNo,
        powerType: input.powerType,
        amount: input.amount,
        reason: input.reason,
        reviewDeadline: reviewDeadline.toISOString(),
        operatorId: input.operatorId,
        frozenAt: ledger.createdAt.toISOString(),
      });
      this.log('warn', `power frozen: ${input.powerType} -${input.amount}`, {
        userId: account.userId,
        reason: input.reason,
      });
      return {
        ledger: this.toLedgerSummary(ledger),
        account: this.toAccountSummary(updatedAccount),
      };
    });
  }

  /** 解冻算力 */
  async unfreezePower(input: UnfreezePowerInput): Promise<{ ledger: PowerLedgerSummary; account: PowerAccountSummary }> {
    if (!input.userId) throw new UserIdRequiredError();
    if (!input.ledgerId) throw new LedgerNotFoundError({ reason: 'required' });
    if (!input.reason) throw new UnfreezeReasonRequiredError();
    if (!input.operatorId) throw new SelfAdjustForbiddenError({ reason: 'operatorId required' });
    return this.withTransaction(async (tx) => {
      const freezeLedger = await (tx as any).fjnPowerLedger.findUnique({
        where: { id: input.ledgerId },
      });
      if (!freezeLedger) throw new LedgerNotFoundError({ ledgerId: input.ledgerId });
      if (freezeLedger.userId !== input.userId) {
        throw new LedgerNotFoundError({ ledgerId: input.ledgerId, userId: input.userId });
      }
      if (freezeLedger.changeType !== POWER_CHANGE_TYPE.FREEZE) {
        throw new PowerChangeTypeInvalidError({
          ledgerId: input.ledgerId,
          changeType: freezeLedger.changeType,
        });
      }
      const account = await this.lockAccount(tx, input.userId, freezeLedger.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const { ledger, updatedAccount, balanceAfter } = await this.writePowerChange(
        tx,
        account,
        freezeLedger.powerType as FjnPowerType,
        POWER_CHANGE_TYPE.UNFREEZE,
        freezeLedger.amount.toString(),
        {
          sourceType: POWER_SOURCE_TYPE.RISK_UNFREEZE,
          sourceId: freezeLedger.id,
          operatorId: input.operatorId,
          remark: input.reason,
        },
      );
      await this.emitEvent(tx, ECO_POWER_EVENTS.POWER_UNFROZEN, {
        accountId: account.id,
        userId: account.userId,
        ledgerId: ledger.id,
        ledgerNo: ledger.ledgerNo,
        powerType: freezeLedger.powerType,
        amount: freezeLedger.amount.toString(),
        reason: input.reason,
        operatorId: input.operatorId,
        unfrozenAt: ledger.createdAt.toISOString(),
      });
      this.log('info', `power unfrozen: ${freezeLedger.powerType} +${freezeLedger.amount}`, {
        userId: account.userId,
        reason: input.reason,
      });
      return {
        ledger: this.toLedgerSummary(ledger),
        account: this.toAccountSummary(updatedAccount),
      };
    });
  }

  // ==========================================================
  // 6. 倍率 / 系数
  // ==========================================================

  async setMemberMultiplier(input: SetMemberMultiplierInput): Promise<PowerAccountSummary> {
    if (!isValidMultiplier(input.multiplier)) {
      throw new MemberMultiplierInvalidError({ multiplier: input.multiplier });
    }
    if (!input.reason) throw new RuleCodeRequiredError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const updated = await (tx as any).fjnPowerAccount.update({
        where: { id: account.id },
        data: {
          memberMultiplier: input.multiplier,
          effectivePower: this.calcEffectivePower(
            account.totalPower.toString(),
            input.multiplier,
            account.activityMultiplier.toString(),
            account.riskCoefficient.toString(),
          ),
        },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.MEMBER_MULTIPLIER_CHANGED, {
        accountId: account.id,
        userId: account.userId,
        fromMultiplier: account.memberMultiplier.toString(),
        toMultiplier: input.multiplier,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `member multiplier changed: ${input.userId}`, { from: account.memberMultiplier, to: input.multiplier });
      return this.toAccountSummary(updated);
    });
  }

  async setActivityMultiplier(input: SetActivityMultiplierInput): Promise<PowerAccountSummary> {
    if (!isValidMultiplier(input.multiplier)) {
      throw new ActivityMultiplierInvalidError({ multiplier: input.multiplier });
    }
    if (!input.reason) throw new RuleCodeRequiredError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const updated = await (tx as any).fjnPowerAccount.update({
        where: { id: account.id },
        data: {
          activityMultiplier: input.multiplier,
          effectivePower: this.calcEffectivePower(
            account.totalPower.toString(),
            account.memberMultiplier.toString(),
            input.multiplier,
            account.riskCoefficient.toString(),
          ),
        },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.ACTIVITY_MULTIPLIER_CHANGED, {
        accountId: account.id,
        userId: account.userId,
        fromMultiplier: account.activityMultiplier.toString(),
        toMultiplier: input.multiplier,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `activity multiplier changed: ${input.userId}`, {
        from: account.activityMultiplier,
        to: input.multiplier,
      });
      return this.toAccountSummary(updated);
    });
  }

  async setRiskCoefficient(input: SetRiskCoefficientInput): Promise<PowerAccountSummary> {
    if (!isValidMultiplier(input.coefficient)) {
      throw new RiskCoefficientInvalidError({ coefficient: input.coefficient });
    }
    if (!input.reason) throw new RuleCodeRequiredError();
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!isAccountOperable(account.status)) {
        throw new AccountNotOperableError({ accountId: account.id, status: account.status });
      }
      const updated = await (tx as any).fjnPowerAccount.update({
        where: { id: account.id },
        data: {
          riskCoefficient: input.coefficient,
          effectivePower: this.calcEffectivePower(
            account.totalPower.toString(),
            account.memberMultiplier.toString(),
            account.activityMultiplier.toString(),
            input.coefficient,
          ),
        },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.RISK_COEFFICIENT_CHANGED, {
        accountId: account.id,
        userId: account.userId,
        fromCoefficient: account.riskCoefficient.toString(),
        toCoefficient: input.coefficient,
        reason: input.reason,
        operatorId: input.operatorId,
        changedAt: new Date().toISOString(),
      });
      this.log('info', `risk coefficient changed: ${input.userId}`, {
        from: account.riskCoefficient,
        to: input.coefficient,
      });
      return this.toAccountSummary(updated);
    });
  }

  // ==========================================================
  // 7. 快照 / 释放计算源
  // ==========================================================

  /** 创建快照 */
  async createSnapshot(input: CreateSnapshotInput): Promise<PowerSnapshotSummary> {
    if (!isValidPowerSnapshotType(input.snapshotType)) {
      throw new PowerSnapshotTypeInvalidError({ snapshotType: input.snapshotType });
    }
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!account) throw new AccountNotFoundError({ userId: input.userId });

      // 计算 powerRatio（如果给了 networkTotalPower）
      let powerRatio: string | null = null;
      if (input.networkTotalPower && Number(input.networkTotalPower) > 0) {
        powerRatio = (
          Number(account.effectivePower) / Number(input.networkTotalPower)
        ).toFixed(8);
      }

      const snap = await (tx as any).fjnPowerSnapshot.create({
        data: {
          snapshotNo: this.generateSnapshotNo(),
          accountId: account.id,
          userId: account.userId,
          snapshotType: input.snapshotType,
          totalPower: account.totalPower,
          effectivePower: account.effectivePower,
          memberMultiplier: account.memberMultiplier,
          activityMultiplier: account.activityMultiplier,
          riskCoefficient: account.riskCoefficient,
          networkTotalPower: input.networkTotalPower ?? null,
          powerRatio: powerRatio,
          snapshotData: input.snapshotData as any,
        },
      });
      // 更新 lastSnapshotAt
      await (tx as any).fjnPowerAccount.update({
        where: { id: account.id },
        data: { lastSnapshotAt: snap.createdAt },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.SNAPSHOT_CREATED, {
        snapshotId: snap.id,
        snapshotNo: snap.snapshotNo,
        accountId: account.id,
        userId: account.userId,
        snapshotType: input.snapshotType,
        totalPower: account.totalPower.toString(),
        effectivePower: account.effectivePower.toString(),
        networkTotalPower: input.networkTotalPower,
        powerRatio: powerRatio ?? undefined,
        createdAt: snap.createdAt.toISOString(),
      });
      this.log('info', `snapshot created: ${snap.snapshotNo}`, { userId: account.userId });
      return this.toSnapshotSummary(snap);
    });
  }

  /** 准备释放计算（创建 release_calc 快照 + 返回 powerRatio） */
  async prepareReleaseCalc(input: PrepareReleaseCalcInput): Promise<ReleaseCalcResult> {
    if (!input.networkTotalPower || Number(input.networkTotalPower) <= 0) {
      throw new InternalCalculationError({ reason: 'networkTotalPower must be > 0' });
    }
    const snapshotType = input.snapshotType ?? POWER_SNAPSHOT_TYPE.RELEASE_CALC;
    return this.withTransaction(async (tx) => {
      const account = await this.lockAccount(tx, input.userId, input.accountId);
      if (!account) throw new AccountNotFoundError({ userId: input.userId });
      if (!isAccountOperable(account.status)) {
        throw new ReleaseCalculationNotReadyError({ status: account.status });
      }
      // 检查是否已存在同类型当天的快照
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existing = await (tx as any).fjnPowerSnapshot.findFirst({
        where: {
          accountId: account.id,
          snapshotType,
          createdAt: { gte: today },
        },
      });
      if (existing) {
        throw new ReleaseCalculationDuplicateError({
          accountId: account.id,
          snapshotId: existing.id,
        });
      }
      const powerRatio = (
        Number(account.effectivePower) / Number(input.networkTotalPower)
      ).toFixed(8);
      const snap = await (tx as any).fjnPowerSnapshot.create({
        data: {
          snapshotNo: this.generateSnapshotNo(),
          accountId: account.id,
          userId: account.userId,
          snapshotType,
          totalPower: account.totalPower,
          effectivePower: account.effectivePower,
          memberMultiplier: account.memberMultiplier,
          activityMultiplier: account.activityMultiplier,
          riskCoefficient: account.riskCoefficient,
          networkTotalPower: input.networkTotalPower,
          powerRatio,
        },
      });
      await (tx as any).fjnPowerAccount.update({
        where: { id: account.id },
        data: { lastSnapshotAt: snap.createdAt },
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.SNAPSHOT_CREATED, {
        snapshotId: snap.id,
        snapshotNo: snap.snapshotNo,
        accountId: account.id,
        userId: account.userId,
        snapshotType,
        totalPower: account.totalPower.toString(),
        effectivePower: account.effectivePower.toString(),
        networkTotalPower: input.networkTotalPower,
        powerRatio,
        createdAt: snap.createdAt.toISOString(),
      });
      await this.emitEvent(tx, ECO_POWER_EVENTS.RELEASE_CALCULATION_READY, {
        accountId: account.id,
        userId: account.userId,
        snapshotId: snap.id,
        effectivePower: account.effectivePower.toString(),
        networkTotalPower: input.networkTotalPower,
        powerRatio,
        readyAt: new Date().toISOString(),
      });
      this.log('info', `release calc ready: ${account.id}`, { powerRatio });
      return {
        accountId: account.id,
        userId: account.userId,
        snapshotId: snap.id,
        effectivePower: account.effectivePower.toString(),
        networkTotalPower: input.networkTotalPower,
        powerRatio,
      };
    });
  }

  // ==========================================================
  // 8. 查询
  // ==========================================================

  /** 获取账户余额摘要 */
  async getBalance(userId: string): Promise<PowerAccountSummary | null> {
    return this.getAccountByUserId(userId);
  }

  /** 获取某类算力余额 */
  async getPowerBalance(userId: string, powerType: FjnPowerType): Promise<string> {
    if (!isValidPowerType(powerType)) {
      throw new PowerTypeInvalidError({ powerType });
    }
    const account = await (this.prisma as any).fjnPowerAccount.findFirst({
      where: { userId },
    });
    if (!account) return '0';
    return this.getAccountFieldValue(account, powerType);
  }

  /** 管理后台：列出账户（分页） */
  async listAccounts(input: { status?: FjnPowerAccountStatus; page?: number; pageSize?: number } = {}): Promise<{
    items: PowerAccountSummary[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (input.status) where.status = input.status;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnPowerAccount.findMany({
        where,
        orderBy: { effectivePower: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnPowerAccount.count({ where }),
    ]);
    return {
      items: items.map((a: any) => this.toAccountSummary(a)),
      total,
      page,
      pageSize,
    };
  }

  /** 列出 ledger */
  async listLedgers(input: ListLedgerInput): Promise<{
    items: PowerLedgerSummary[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (input.userId) where.userId = input.userId;
    if (input.accountId) where.accountId = input.accountId;
    if (input.powerType) where.powerType = input.powerType;
    if (input.changeType) where.changeType = input.changeType;
    if (input.sourceType) where.sourceType = input.sourceType;
    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) (where.createdAt as any).gte = input.startDate;
      if (input.endDate) (where.createdAt as any).lte = input.endDate;
    }
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnPowerLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnPowerLedger.count({ where }),
    ]);
    return {
      items: items.map((l: any) => this.toLedgerSummary(l)),
      total,
      page,
      pageSize,
    };
  }

  /** 列出快照 */
  async listSnapshots(
    userId: string,
    input?: { snapshotType?: FjnPowerSnapshotType; page?: number; pageSize?: number },
  ): Promise<{ items: PowerSnapshotSummary[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, input?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 20));
    const where: Record<string, unknown> = { userId };
    if (input?.snapshotType) where.snapshotType = input.snapshotType;
    const [items, total] = await Promise.all([
      (this.prisma as any).fjnPowerSnapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnPowerSnapshot.count({ where }),
    ]);
    return {
      items: items.map((s: any) => this.toSnapshotSummary(s)),
      total,
      page,
      pageSize,
    };
  }

  /** 网络总算力（释放分母） */
  async getNetworkTotalPower(): Promise<string> {
    const result = await (this.prisma as any).fjnPowerAccount.aggregate({
      _sum: { effectivePower: true },
      where: { status: POWER_ACCOUNT_STATUS.ACTIVE },
    });
    return result._sum.effectivePower?.toString() ?? '0';
  }

  // ==========================================================
  // 9. 内部：账户锁定
  // ==========================================================

  /** SELECT ... FOR UPDATE 锁定账户（防止并发） */
  private async lockAccount(tx: any, userId: string, accountId?: string): Promise<any> {
    if (accountId) {
      const account = await tx.fjnPowerAccount.findUnique({ where: { id: accountId } });
      if (!account) throw new AccountNotFoundError({ accountId });
      if (account.userId !== userId) {
        throw new AccountNotFoundError({ accountId, userId, mismatch: true });
      }
      return account;
    }
    const account = await tx.fjnPowerAccount.findFirst({ where: { userId } });
    if (!account) throw new AccountNotFoundError({ userId });
    return account;
  }
}

/** 工厂函数 */
export function createFjnEcoPowerService(options?: FjnServiceOptions): FjnEcoPowerService {
  return new FjnEcoPowerService(options);
}
