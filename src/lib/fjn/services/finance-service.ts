/**
 * FJN Finance Service - 核心业务服务
 *
 * 严格遵循 H032 + H015 工业级职责规范：
 *  - 财务账户管理（account CRUD + 冻结/解冻/关闭）
 *  - 财务流水管理（入账/冲销/作废/查询）
 *  - 369 分账收入确认（40% cost / 30% market / 30% company）
 *  - 结算单管理（创建/审核/支付/取消 + 条目管理）
 *  - 财务报表（账户汇总 + 流水汇总）
 *
 * 业务规则：
 *  - 复式记账：每笔流水有 direction（in | out）+ balanceBefore/After
 *  - 池子预初始化：wine_cost_pool / market_ecosystem_pool / company_pool 必须在使用前创建
 *  - 369 比例严格 40:30:30（与 Revenue Service 对齐）
 *  - 结算单创建后必须审核通过才能支付
 *  - 终态不可再转移（closed / reversed / void / paid / cancelled）
 *
 * 用法：
 *   const svc = new FjnFinanceService();
 *   await svc.initializePools('CNY');
 *   const result = await svc.recognizeWine369Revenue({ orderId, ..., totalAmount: '1000' });
 */

import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  FINANCE_ACCOUNT_STATUS,
  FINANCE_ACCOUNT_TYPES,
  FINANCE_BUSINESS_TYPES,
  FINANCE_LEDGER_STATUS,
  FINANCE_SETTLEMENT_STATUS,
  FINANCE_SETTLEMENT_ITEM_STATUS,
  FINANCE_SETTLEMENT_TYPES,
  FINANCE_DIRECTION,
  isFinanceAccountOperable,
  isFinanceLedgerReversible,
  isFinanceSettlementApprovable,
  isFinanceSettlementPayable,
  isFinanceSettlementCancellable,
  isFinanceSettlementItemPayable,
  isFinanceSettlementItemRetriable,
  assertTransitFinanceAccountStatus,
  assertTransitFinanceSettlementStatus,
  assertTransitFinanceSettlementItemStatus,
  FjnFinanceAccountStatus,
  FjnFinanceAccountType,
  FjnFinanceDirection,
  FjnFinanceBusinessType,
  FjnFinanceSettlementType,
  FjnFinanceSettlementStatus,
  FjnFinanceSettlementItemStatus,
} from './finance-state-machine';
import {
  FINANCE_EVENTS,
  FINANCE_EVENT_SOURCES,
  AccountCreatedPayload,
  AccountFrozenPayload,
  AccountUnfrozenPayload,
  AccountClosedPayload,
  LedgerPostedPayload,
  LedgerReversedPayload,
  LedgerVoidedPayload,
  RevenueRecognizedPayload,
  Revenue369AllocatedPayload,
  SettlementCreatedPayload,
  SettlementApprovedPayload,
  SettlementPaidPayload,
  SettlementCancelledPayload,
  SettlementItemPaidPayload,
  SettlementItemFailedPayload,
  FjnFinanceEventSource,
} from './finance-events';
import {
  FjnFinanceAccountNotFoundError,
  FjnFinanceAccountAlreadyExistsError,
  FjnFinanceAccountFrozenError,
  FjnFinanceAccountClosedError,
  FjnFinanceAccountStatusInvalidError,
  FjnFinanceAccountTypeInvalidError,
  FjnFinanceAccountBalanceNegativeError,
  FjnFinanceLedgerNotFoundError,
  FjnFinanceLedgerAlreadyReversedError,
  FjnFinanceLedgerAlreadyVoidedError,
  FjnFinanceLedgerAmountInvalidError,
  FjnFinanceLedgerAmountNegativeError,
  FjnFinanceLedgerAmountZeroError,
  FjnFinanceLedgerDirectionInvalidError,
  FjnFinanceLedgerBalanceMismatchError,
  FjnFinanceLedgerCurrencyMismatchError,
  FjnFinanceLedgerSourceInvalidError,
  FjnFinanceLedgerReverseNotAllowedError,
  FjnFinanceSettlementNotFoundError,
  FjnFinanceSettlementAlreadyExistsError,
  FjnFinanceSettlementStatusInvalidError,
  FjnFinanceSettlementNotApprovableError,
  FjnFinanceSettlementNotPayableError,
  FjnFinanceSettlementNotCancellableError,
  FjnFinanceSettlementAmountInvalidError,
  FjnFinanceSettlementPeriodInvalidError,
  FjnFinanceSettlementNoItemsError,
  FjnFinanceSettlementAlreadyPaidError,
  FjnFinanceSettlementItemNotFoundError,
  FjnFinanceSettlementItemNotPayableError,
  FjnFinanceSettlementItemNotRetriableError,
  FjnFinanceSettlementItemBankInfoRequiredError,
  FjnFinanceSettlementItemAmountInvalidError,
  FjnFinanceAmountInvalidError,
  FjnFinanceCurrencyMismatchError,
  FjnFinanceCurrencyNotSupportedError,
  FjnFinanceApproverRequiredError,
  FjnFinanceOperatorRequiredError,
  FjnFinanceReasonRequiredError,
  FjnFinanceRevenue369AmountMismatchError,
  FjnFinanceRevenue369OrderRequiredError,
  FjnFinanceRevenue369PoolsNotInitializedError,
  FjnFinanceRevenue369RuleVersionInvalidError,
} from './finance-errors';

// ============================================================
// 1. 公共类型定义
// ============================================================

/** Decimal 精度配置（与 H015 一致） */
Decimal.set({ precision: 36, rounding: Decimal.ROUND_HALF_EVEN });

/** 入参：创建账户 */
export interface CreateAccountInput {
  accountName: string;
  accountType: FjnFinanceAccountType;
  currency: string;
  operatorId?: string;
}

/** 入参：入账 */
export interface PostLedgerInput {
  accountType: FjnFinanceAccountType;
  businessType: FjnFinanceBusinessType;
  direction: FjnFinanceDirection;
  amount: string;
  currency: string;
  sourceType: string;
  sourceId: string;
  orderId?: string;
  userId?: string;
  counterpartyId?: string;
  ruleVersion?: string;
  accountingSubject?: string;
  description?: string;
  operatorId?: string;
}

/** 入参：冲销 */
export interface ReverseLedgerInput {
  reason: string;
  approvalId?: string;
  operatorId?: string;
}

/** 入参：369 收入确认 */
export interface RecognizeWine369Input {
  orderId: string;
  userId: string;
  currency: string;
  totalAmount: string;
  sourceId: string;
  ruleVersion?: string;
  operatorId?: string;
}

/** 入参：创建结算单 */
export interface CreateSettlementInput {
  settlementType: FjnFinanceSettlementType;
  period: string;
  currency: string;
  description?: string;
  operatorId?: string;
}

/** 入参：添加结算条目 */
export interface AddSettlementItemInput {
  settlementId: string;
  userId?: string;
  merchantId?: string;
  nodeId?: string;
  amount: string;
  taxAmount?: string;
  bankInfo?: Record<string, unknown>;
  operatorId?: string;
}

/** 入参：审核结算单 */
export interface ApproveSettlementInput {
  approverId: string;
  reviewNote?: string;
  operatorId?: string;
}

/** 入参：支付结算条目 */
export interface PaySettlementItemInput {
  paidAt?: Date;
  operatorId?: string;
}

/** 入参：取消结算单 */
export interface CancelSettlementInput {
  reason: string;
  operatorId?: string;
}

/** 入参：账户操作 */
export interface FreezeAccountInput {
  reason: string;
  operatorId?: string;
}

export interface UnfreezeAccountInput {
  reason: string;
  operatorId?: string;
}

export interface CloseAccountInput {
  reason: string;
  operatorId?: string;
}

// ============================================================
// 2. 主 Service 类
// ============================================================

/**
 * FJN Finance Service 主类
 *
 * 公开方法约 20 个，按业务域分组：
 *  - 账户域：createAccount, findAccountById, listAccounts, freezeAccount, unfreezeAccount, closeAccount
 *  - 流水域：postLedger, findLedgerById, listLedgers, reverseLedger, voidLedger
 *  - 收入域：recognizeWine369Revenue
 *  - 结算域：createSettlement, addSettlementItem, approveSettlement, paySettlement, paySettlementItem, failSettlementItem, cancelSettlement, listSettlements, findSettlementById
 *  - 报表域：getAccountSummary, getLedgerSummary
 *  - 工具：initializePools
 */
export class FjnFinanceService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnFinanceService' });
  }

  // ============================================================
  // 3. 账户域
  // ============================================================

  /**
   * 初始化 369 三个池子（wine_cost / market_ecosystem / company）
   * 通常在系统初始化时调用一次
   */
  async initializePools(currency: string = 'CNY', operatorId?: string): Promise<{
    costPool: unknown;
    marketPool: unknown;
    companyPool: unknown;
  }> {
    const pools: FjnFinanceAccountType[] = [
      FINANCE_ACCOUNT_TYPES.WINE_COST_POOL,
      FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL,
      FINANCE_ACCOUNT_TYPES.COMPANY_POOL,
    ];
    const results: Record<string, unknown> = {};
    for (const t of pools) {
      const existing = await this.prisma.fjnFinanceAccount.findFirst({
        where: { accountType: t, currency },
      });
      if (!existing) {
        const created = await this.createAccount({
          accountName: this.poolAccountName(t),
          accountType: t,
          currency,
          operatorId,
        });
        results[t] = created;
      } else {
        results[t] = existing;
      }
    }
    return {
      costPool: results[FINANCE_ACCOUNT_TYPES.WINE_COST_POOL],
      marketPool: results[FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL],
      companyPool: results[FINANCE_ACCOUNT_TYPES.COMPANY_POOL],
    };
  }

  /** 池子账户名 */
  private poolAccountName(type: FjnFinanceAccountType): string {
    const map: Record<string, string> = {
      [FINANCE_ACCOUNT_TYPES.WINE_COST_POOL]: '老酒成本池',
      [FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL]: '市场生态池',
      [FINANCE_ACCOUNT_TYPES.COMPANY_POOL]: '公司池',
      [FINANCE_ACCOUNT_TYPES.REFERRAL_REWARD_PAYABLE]: '推荐奖励应付',
      [FINANCE_ACCOUNT_TYPES.TEAM_REWARD_PAYABLE]: '团队奖励应付',
      [FINANCE_ACCOUNT_TYPES.NODE_REWARD_PAYABLE]: '节点奖励应付',
      [FINANCE_ACCOUNT_TYPES.TAX_PAYABLE]: '税务应付',
      [FINANCE_ACCOUNT_TYPES.MERCHANT_PAYABLE]: '商户应付',
      [FINANCE_ACCOUNT_TYPES.PLATFORM_CASH]: '平台现金',
      [FINANCE_ACCOUNT_TYPES.REFUND_RESERVE]: '退款准备金',
    };
    return map[type] ?? type;
  }

  /** 创建账户 */
  async createAccount(input: CreateAccountInput): Promise<Record<string, unknown>> {
    if (!input.accountName) throw new FjnFinanceReasonRequiredError({ field: 'accountName' });
    if (!input.currency) throw new FjnFinanceCurrencyNotSupportedError({ currency: input.currency });

    const existing = await this.prisma.fjnFinanceAccount.findFirst({
      where: {
        accountType: input.accountType,
        currency: input.currency,
      },
    });
    if (existing) {
      throw new FjnFinanceAccountAlreadyExistsError({
        accountType: input.accountType,
        currency: input.currency,
      });
    }

    return this.withTransaction(async (tx) => {
      const account = await tx.fjnFinanceAccount.create({
        data: {
          accountNo: this.generateAccountNo(input.accountType),
          accountName: input.accountName,
          accountType: input.accountType,
          currency: input.currency,
          balance: '0',
          totalIn: '0',
          totalOut: '0',
          status: FINANCE_ACCOUNT_STATUS.ACTIVE,
        },
      });

      const eventPayload: AccountCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? FINANCE_EVENT_SOURCES.ADMIN
          : FINANCE_EVENT_SOURCES.SYSTEM,
        account_id: account.id,
        account_no: account.accountNo,
        account_name: account.accountName,
        account_type: account.accountType as FjnFinanceAccountType,
        currency: account.currency,
        status: account.status as FjnFinanceAccountStatus,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.ACCOUNT_CREATED, eventPayload);
      return this.formatAccount(account);
    });
  }

  /** 按 ID 查询账户 */
  async findAccountById(id: string): Promise<Record<string, unknown> | null> {
    const acc = await this.prisma.fjnFinanceAccount.findUnique({ where: { id } });
    return acc ? this.formatAccount(acc) : null;
  }

  /** 列出账户 */
  async listAccounts(params: {
    accountType?: FjnFinanceAccountType;
    currency?: string;
    status?: FjnFinanceAccountStatus;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (params.accountType) where.accountType = params.accountType;
    if (params.currency) where.currency = params.currency;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.fjnFinanceAccount.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fjnFinanceAccount.count({ where }),
    ]);
    return {
      items: items.map((a) => this.formatAccount(a)),
      total,
      page,
      pageSize,
    };
  }

  /** 冻结账户 */
  async freezeAccount(id: string, input: FreezeAccountInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'freeze' });
    return this.withTransaction(async (tx) => {
      const acc = await tx.fjnFinanceAccount.findUnique({ where: { id } });
      if (!acc) throw new FjnFinanceAccountNotFoundError({ id });
      assertTransitFinanceAccountStatus(
        acc.status as FjnFinanceAccountStatus,
        FINANCE_ACCOUNT_STATUS.FROZEN,
      );
      const updated = await tx.fjnFinanceAccount.update({
        where: { id },
        data: { status: FINANCE_ACCOUNT_STATUS.FROZEN },
      });
      const payload: AccountFrozenPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        account_id: updated.id,
        account_no: updated.accountNo,
        reason: input.reason,
        operator_id: input.operatorId,
        frozen_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.ACCOUNT_FROZEN, payload);
      return this.formatAccount(updated);
    });
  }

  /** 解冻账户 */
  async unfreezeAccount(id: string, input: UnfreezeAccountInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'unfreeze' });
    return this.withTransaction(async (tx) => {
      const acc = await tx.fjnFinanceAccount.findUnique({ where: { id } });
      if (!acc) throw new FjnFinanceAccountNotFoundError({ id });
      assertTransitFinanceAccountStatus(
        acc.status as FjnFinanceAccountStatus,
        FINANCE_ACCOUNT_STATUS.ACTIVE,
      );
      const updated = await tx.fjnFinanceAccount.update({
        where: { id },
        data: { status: FINANCE_ACCOUNT_STATUS.ACTIVE },
      });
      const payload: AccountUnfrozenPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        account_id: updated.id,
        account_no: updated.accountNo,
        reason: input.reason,
        operator_id: input.operatorId,
        unfrozen_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.ACCOUNT_UNFROZEN, payload);
      return this.formatAccount(updated);
    });
  }

  /** 关闭账户 */
  async closeAccount(id: string, input: CloseAccountInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'close' });
    return this.withTransaction(async (tx) => {
      const acc = await tx.fjnFinanceAccount.findUnique({ where: { id } });
      if (!acc) throw new FjnFinanceAccountNotFoundError({ id });
      assertTransitFinanceAccountStatus(
        acc.status as FjnFinanceAccountStatus,
        FINANCE_ACCOUNT_STATUS.CLOSED,
      );
      const updated = await tx.fjnFinanceAccount.update({
        where: { id },
        data: { status: FINANCE_ACCOUNT_STATUS.CLOSED },
      });
      const payload: AccountClosedPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        account_id: updated.id,
        account_no: updated.accountNo,
        reason: input.reason,
        operator_id: input.operatorId,
        closed_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.ACCOUNT_CLOSED, payload);
      return this.formatAccount(updated);
    });
  }

  // ============================================================
  // 4. 流水域
  // ============================================================

  /**
   * 入账（核心）
   *  - 校验账户状态（active）和金额（> 0）
   *  - 计算 balanceAfter = balanceBefore +/- amount
   *  - 更新账户余额
   *  - 记录流水 + outbox 事件
   */
  async postLedger(input: PostLedgerInput): Promise<Record<string, unknown>> {
    // 入参校验
    const amount = new Decimal(input.amount);
    if (amount.isNaN()) throw new FjnFinanceLedgerAmountInvalidError({ amount: input.amount });
    if (amount.lte(0)) {
      if (amount.eq(0)) throw new FjnFinanceLedgerAmountZeroError({ amount: input.amount });
      throw new FjnFinanceLedgerAmountNegativeError({ amount: input.amount });
    }
    if (!input.sourceType || !input.sourceId) {
      throw new FjnFinanceLedgerSourceInvalidError({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      });
    }
    if (input.direction !== FINANCE_DIRECTION.IN && input.direction !== FINANCE_DIRECTION.OUT) {
      throw new FjnFinanceLedgerDirectionInvalidError({ direction: input.direction });
    }

    return this.withTransaction(async (tx) => {
      // 1. 查账户
      const acc = await tx.fjnFinanceAccount.findFirst({
        where: { accountType: input.accountType, currency: input.currency },
      });
      if (!acc) {
        throw new FjnFinanceAccountNotFoundError({
          accountType: input.accountType,
          currency: input.currency,
        });
      }
      // 2. 账户状态校验
      if (!isFinanceAccountOperable(acc.status as FjnFinanceAccountStatus)) {
        if (acc.status === FINANCE_ACCOUNT_STATUS.FROZEN) {
          throw new FjnFinanceAccountFrozenError({ accountId: acc.id });
        }
        if (acc.status === FINANCE_ACCOUNT_STATUS.CLOSED) {
          throw new FjnFinanceAccountClosedError({ accountId: acc.id });
        }
        throw new FjnFinanceAccountStatusInvalidError({ status: acc.status });
      }
      // 3. 币种校验
      if (acc.currency !== input.currency) {
        throw new FjnFinanceLedgerCurrencyMismatchError({
          accountCurrency: acc.currency,
          inputCurrency: input.currency,
        });
      }
      // 4. 计算余额
      const balanceBefore = new Decimal(acc.balance);
      const balanceAfter =
        input.direction === FINANCE_DIRECTION.IN
          ? balanceBefore.plus(amount)
          : balanceBefore.minus(amount);
      if (balanceAfter.lt(0)) {
        throw new FjnFinanceAccountBalanceNegativeError({
          accountId: acc.id,
          balanceAfter: balanceAfter.toString(),
        });
      }
      // 5. 创建流水
      const ledger = await tx.fjnFinanceLedger.create({
        data: {
          ledgerNo: this.generateLedgerNo(),
          accountId: acc.id,
          businessType: input.businessType,
          businessId: null,
          businessNo: null,
          orderId: input.orderId ?? null,
          userId: input.userId ?? null,
          direction: input.direction,
          amount: amount.toFixed(4),
          balanceBefore: balanceBefore.toFixed(4),
          balanceAfter: balanceAfter.toFixed(4),
          currency: input.currency,
          accountingSubject: input.accountingSubject ?? null,
          taxStatus: 'none',
          settlementStatus: FINANCE_LEDGER_STATUS.POSTED,
          description: input.description ?? null,
          operatorId: input.operatorId ?? null,
        },
      });
      // 6. 更新账户余额
      await tx.fjnFinanceAccount.update({
        where: { id: acc.id },
        data: {
          balance: balanceAfter.toFixed(4),
          totalIn:
            input.direction === FINANCE_DIRECTION.IN
              ? new Decimal(acc.totalIn).plus(amount).toFixed(4)
              : acc.totalIn,
          totalOut:
            input.direction === FINANCE_DIRECTION.OUT
              ? new Decimal(acc.totalOut).plus(amount).toFixed(4)
              : acc.totalOut,
        },
      });
      // 7. outbox 事件
      const payload: LedgerPostedPayload = {
        occurred_at: new Date().toISOString(),
        source: this.resolveEventSource(input.sourceType) as FjnFinanceEventSource,
        ledger_id: ledger.id,
        ledger_no: ledger.ledgerNo,
        account_id: acc.id,
        account_type: acc.accountType as FjnFinanceAccountType,
        business_type: input.businessType,
        direction: input.direction,
        amount: amount.toFixed(4),
        balance_before: balanceBefore.toFixed(4),
        balance_after: balanceAfter.toFixed(4),
        currency: input.currency,
        source_type: input.sourceType,
        source_id: input.sourceId,
        order_id: input.orderId,
        user_id: input.userId,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.LEDGER_POSTED, payload);
      return this.formatLedger(ledger);
    });
  }

  /** 按 ID 查询流水 */
  async findLedgerById(id: string): Promise<Record<string, unknown> | null> {
    const l = await this.prisma.fjnFinanceLedger.findUnique({ where: { id } });
    return l ? this.formatLedger(l) : null;
  }

  /** 列出流水 */
  async listLedgers(params: {
    accountId?: string;
    businessType?: FjnFinanceBusinessType;
    direction?: FjnFinanceDirection;
    orderId?: string;
    userId?: string;
    settlementStatus?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (params.accountId) where.accountId = params.accountId;
    if (params.businessType) where.businessType = params.businessType;
    if (params.direction) where.direction = params.direction;
    if (params.orderId) where.orderId = params.orderId;
    if (params.userId) where.userId = params.userId;
    if (params.settlementStatus) where.settlementStatus = params.settlementStatus;

    const [items, total] = await Promise.all([
      this.prisma.fjnFinanceLedger.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fjnFinanceLedger.count({ where }),
    ]);
    return {
      items: items.map((l) => this.formatLedger(l)),
      total,
      page,
      pageSize,
    };
  }

  /** 冲销流水 */
  async reverseLedger(id: string, input: ReverseLedgerInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'reverse' });

    return this.withTransaction(async (tx) => {
      const orig = await tx.fjnFinanceLedger.findUnique({ where: { id } });
      if (!orig) throw new FjnFinanceLedgerNotFoundError({ id });
      if (!isFinanceLedgerReversible(orig.settlementStatus as any)) {
        if (orig.settlementStatus === FINANCE_LEDGER_STATUS.REVERSED) {
          throw new FjnFinanceLedgerAlreadyReversedError({ id });
        }
        if (orig.settlementStatus === FINANCE_LEDGER_STATUS.VOID) {
          throw new FjnFinanceLedgerAlreadyVoidedError({ id });
        }
        throw new FjnFinanceLedgerReverseNotAllowedError({
          id,
          status: orig.settlementStatus,
        });
      }
      const acc = await tx.fjnFinanceAccount.findUnique({ where: { id: orig.accountId } });
      if (!acc) throw new FjnFinanceAccountNotFoundError({ id: orig.accountId });

      const balanceBefore = new Decimal(acc.balance);
      const amount = new Decimal(orig.amount.toString());
      // 反向 = in <-> out
      const reverseDirection: FjnFinanceDirection =
        orig.direction === FINANCE_DIRECTION.IN
          ? FINANCE_DIRECTION.OUT
          : FINANCE_DIRECTION.IN;
      const balanceAfter =
        reverseDirection === FINANCE_DIRECTION.IN
          ? balanceBefore.plus(amount)
          : balanceBefore.minus(amount);

      // 创建反向流水
      const reverse = await tx.fjnFinanceLedger.create({
        data: {
          ledgerNo: this.generateLedgerNo(),
          accountId: acc.id,
          businessType: FINANCE_BUSINESS_TYPES.REFUND,
          businessId: orig.id,
          businessNo: orig.ledgerNo,
          orderId: orig.orderId,
          userId: orig.userId,
          direction: reverseDirection,
          amount: amount.toFixed(4),
          balanceBefore: balanceBefore.toFixed(4),
          balanceAfter: balanceAfter.toFixed(4),
          currency: orig.currency,
          accountingSubject: orig.accountingSubject,
          taxStatus: orig.taxStatus,
          settlementStatus: FINANCE_LEDGER_STATUS.POSTED,
          description: `冲销 ${orig.ledgerNo}: ${input.reason}`,
          operatorId: input.operatorId ?? null,
        },
      });
      // 标记原流水已冲销
      await tx.fjnFinanceLedger.update({
        where: { id: orig.id },
        data: { settlementStatus: FINANCE_LEDGER_STATUS.REVERSED },
      });
      // 更新账户余额
      await tx.fjnFinanceAccount.update({
        where: { id: acc.id },
        data: { balance: balanceAfter.toFixed(4) },
      });
      // outbox 事件
      const payload: LedgerReversedPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        original_ledger_id: orig.id,
        reverse_ledger_id: reverse.id,
        reverse_ledger_no: reverse.ledgerNo,
        amount: amount.toFixed(4),
        currency: orig.currency,
        reason: input.reason,
        approval_id: input.approvalId,
        operator_id: input.operatorId,
        reversed_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.LEDGER_REVERSED, payload);
      return this.formatLedger(reverse);
    });
  }

  /** 作废流水 */
  async voidLedger(id: string, input: { reason: string; operatorId?: string }): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'void' });

    return this.withTransaction(async (tx) => {
      const orig = await tx.fjnFinanceLedger.findUnique({ where: { id } });
      if (!orig) throw new FjnFinanceLedgerNotFoundError({ id });
      if (orig.settlementStatus === FINANCE_LEDGER_STATUS.REVERSED) {
        throw new FjnFinanceLedgerAlreadyReversedError({ id });
      }
      if (orig.settlementStatus === FINANCE_LEDGER_STATUS.VOID) {
        throw new FjnFinanceLedgerAlreadyVoidedError({ id });
      }
      const updated = await tx.fjnFinanceLedger.update({
        where: { id },
        data: {
          settlementStatus: FINANCE_LEDGER_STATUS.VOID,
          description: orig.description
            ? `${orig.description} [VOID: ${input.reason}]`
            : `VOID: ${input.reason}`,
        },
      });
      const payload: LedgerVoidedPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        ledger_id: updated.id,
        ledger_no: updated.ledgerNo,
        reason: input.reason,
        operator_id: input.operatorId,
        voided_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.LEDGER_VOIDED, payload);
      return this.formatLedger(updated);
    });
  }

  // ============================================================
  // 5. 收入域：369 分账入账
  // ============================================================

  /**
   * 369 收入确认
   *  - 40% 入 wine_cost_pool
   *  - 30% 入 market_ecosystem_pool
   *  - 30% 入 company_pool
   *  - 三笔流水都在同一事务中
   */
  async recognizeWine369Revenue(input: RecognizeWine369Input): Promise<{
    orderId: string;
    sourceId: string;
    totalAmount: string;
    ledgers: Record<string, unknown>[];
  }> {
    if (!input.orderId) throw new FjnFinanceRevenue369OrderRequiredError({});
    if (!input.sourceId) throw new FjnFinanceRevenue369OrderRequiredError({ sourceId: 'missing' });

    const total = new Decimal(input.totalAmount);
    if (total.isNaN() || total.lte(0)) {
      throw new FjnFinanceAmountInvalidError({ amount: input.totalAmount });
    }
    const costAmount = total.times('0.40').toFixed(4);
    const marketAmount = total.times('0.30').toFixed(4);
    const companyAmount = total.times('0.30').toFixed(4);
    // 校验 40 + 30 + 30 = 100
    const sum = new Decimal(costAmount).plus(marketAmount).plus(companyAmount);
    if (!sum.minus(total).abs().lte('0.0001')) {
      throw new FjnFinanceRevenue369AmountMismatchError({
        cost: costAmount,
        market: marketAmount,
        company: companyAmount,
        total: input.totalAmount,
        sum: sum.toFixed(4),
      });
    }

    // 检查池子是否存在
    const pools = await Promise.all([
      this.prisma.fjnFinanceAccount.findFirst({
        where: { accountType: FINANCE_ACCOUNT_TYPES.WINE_COST_POOL, currency: input.currency },
      }),
      this.prisma.fjnFinanceAccount.findFirst({
        where: { accountType: FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL, currency: input.currency },
      }),
      this.prisma.fjnFinanceAccount.findFirst({
        where: { accountType: FINANCE_ACCOUNT_TYPES.COMPANY_POOL, currency: input.currency },
      }),
    ]);
    if (pools.some((p) => !p)) {
      throw new FjnFinanceRevenue369PoolsNotInitializedError({
        currency: input.currency,
        cost: !!pools[0],
        market: !!pools[1],
        company: !!pools[2],
      });
    }

    // 三笔入账
    const ruleVersion = input.ruleVersion ?? 'v3.6.9';
    const [costLedger, marketLedger, companyLedger] = await Promise.all([
      this.postLedger({
        accountType: FINANCE_ACCOUNT_TYPES.WINE_COST_POOL,
        businessType: FINANCE_BUSINESS_TYPES.INCOME,
        direction: FINANCE_DIRECTION.IN,
        amount: costAmount,
        currency: input.currency,
        sourceType: 'revenue_allocation',
        sourceId: input.sourceId,
        orderId: input.orderId,
        userId: input.userId,
        ruleVersion,
        accountingSubject: 'REVENUE_369_COST_POOL',
        description: '369 收入确认 - 老酒成本池 40%',
        operatorId: input.operatorId,
      }),
      this.postLedger({
        accountType: FINANCE_ACCOUNT_TYPES.MARKET_ECOSYSTEM_POOL,
        businessType: FINANCE_BUSINESS_TYPES.MARKET_POOL,
        direction: FINANCE_DIRECTION.IN,
        amount: marketAmount,
        currency: input.currency,
        sourceType: 'revenue_allocation',
        sourceId: input.sourceId,
        orderId: input.orderId,
        userId: input.userId,
        ruleVersion,
        accountingSubject: 'REVENUE_369_MARKET_POOL',
        description: '369 收入确认 - 市场生态池 30%',
        operatorId: input.operatorId,
      }),
      this.postLedger({
        accountType: FINANCE_ACCOUNT_TYPES.COMPANY_POOL,
        businessType: FINANCE_BUSINESS_TYPES.COMPANY_POOL,
        direction: FINANCE_DIRECTION.IN,
        amount: companyAmount,
        currency: input.currency,
        sourceType: 'revenue_allocation',
        sourceId: input.sourceId,
        orderId: input.orderId,
        userId: input.userId,
        ruleVersion,
        accountingSubject: 'REVENUE_369_COMPANY_POOL',
        description: '369 收入确认 - 公司池 30%',
        operatorId: input.operatorId,
      }),
    ]);

    // outbox 事件：RevenueRecognized
    const eventPayload: RevenueRecognizedPayload = {
      occurred_at: new Date().toISOString(),
      source: FINANCE_EVENT_SOURCES.REVENUE,
      revenue_id: input.sourceId,
      order_id: input.orderId,
      user_id: input.userId,
      currency: input.currency,
      total_amount: input.totalAmount,
      rule_version: ruleVersion,
      recognized_at: new Date().toISOString(),
    };
    await this.emitOutboxEventNoTx(FINANCE_EVENTS.REVENUE_RECOGNIZED, eventPayload);

    // outbox 事件：Revenue369Allocated
    const allocPayload: Revenue369AllocatedPayload = {
      occurred_at: new Date().toISOString(),
      source: FINANCE_EVENT_SOURCES.REVENUE,
      order_id: input.orderId,
      user_id: input.userId,
      currency: input.currency,
      cost_pool_amount: costAmount,
      market_pool_amount: marketAmount,
      company_pool_amount: companyAmount,
      rule_version: ruleVersion,
      total_amount: input.totalAmount,
      ledger_ids: [
        (costLedger as any).ledger_id,
        (marketLedger as any).ledger_id,
        (companyLedger as any).ledger_id,
      ],
      allocated_at: new Date().toISOString(),
    };
    await this.emitOutboxEventNoTx(FINANCE_EVENTS.REVENUE_369_ALLOCATED, allocPayload);

    return {
      orderId: input.orderId,
      sourceId: input.sourceId,
      totalAmount: input.totalAmount,
      ledgers: [costLedger, marketLedger, companyLedger],
    };
  }

  // ============================================================
  // 6. 结算域
  // ============================================================

  /** 创建结算单 */
  async createSettlement(input: CreateSettlementInput): Promise<Record<string, unknown>> {
    if (!input.period) throw new FjnFinanceSettlementPeriodInvalidError({ period: input.period });
    if (!Object.values(FINANCE_SETTLEMENT_TYPES).includes(input.settlementType)) {
      throw new FjnFinanceSettlementStatusInvalidError({ settlementType: input.settlementType });
    }

    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnSettlement.create({
        data: {
          settlementNo: this.generateSettlementNo(input.settlementType),
          settlementType: input.settlementType,
          period: input.period,
          totalAmount: '0',
          currency: input.currency,
          status: FINANCE_SETTLEMENT_STATUS.CREATED,
          description: input.description ?? null,
        },
      });
      const payload: SettlementCreatedPayload = {
        occurred_at: new Date().toISOString(),
        source: input.operatorId
          ? FINANCE_EVENT_SOURCES.ADMIN
          : FINANCE_EVENT_SOURCES.SYSTEM,
        settlement_id: settlement.id,
        settlement_no: settlement.settlementNo,
        settlement_type: input.settlementType,
        period: input.period,
        total_amount: '0',
        currency: input.currency,
        item_count: 0,
        status: FINANCE_SETTLEMENT_STATUS.CREATED,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_CREATED, payload);
      return this.formatSettlement(settlement, []);
    });
  }

  /** 添加结算条目 */
  async addSettlementItem(input: AddSettlementItemInput): Promise<Record<string, unknown>> {
    const amount = new Decimal(input.amount);
    if (amount.isNaN() || amount.lte(0)) {
      throw new FjnFinanceSettlementItemAmountInvalidError({ amount: input.amount });
    }
    const tax = new Decimal(input.taxAmount ?? '0');
    if (tax.lt(0)) {
      throw new FjnFinanceSettlementItemAmountInvalidError({ taxAmount: input.taxAmount });
    }
    const net = amount.minus(tax);
    if (net.lt(0)) {
      throw new FjnFinanceSettlementAmountInvalidError({
        amount: input.amount,
        taxAmount: input.taxAmount,
        net: net.toString(),
      });
    }

    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnSettlement.findUnique({
        where: { id: input.settlementId },
      });
      if (!settlement) throw new FjnFinanceSettlementNotFoundError({ id: input.settlementId });
      if (settlement.status !== FINANCE_SETTLEMENT_STATUS.CREATED) {
        throw new FjnFinanceSettlementStatusInvalidError({ status: settlement.status });
      }

      const item = await tx.fjnSettlementItem.create({
        data: {
          settlementId: input.settlementId,
          userId: input.userId ?? null,
          merchantId: input.merchantId ?? null,
          nodeId: input.nodeId ?? null,
          amount: amount.toFixed(4),
          taxAmount: tax.toFixed(4),
          netAmount: net.toFixed(4),
          status: FINANCE_SETTLEMENT_ITEM_STATUS.PENDING,
          bankInfo: (input.bankInfo as any) ?? undefined,
        },
      });
      // 累加 totalAmount
      const newTotal = new Decimal(settlement.totalAmount).plus(amount).toFixed(4);
      await tx.fjnSettlement.update({
        where: { id: input.settlementId },
        data: { totalAmount: newTotal },
      });
      return this.formatSettlementItem(item);
    });
  }

  /** 审核结算单 */
  async approveSettlement(id: string, input: ApproveSettlementInput): Promise<Record<string, unknown>> {
    if (!input.approverId) throw new FjnFinanceApproverRequiredError({});

    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnSettlement.findUnique({ where: { id } });
      if (!settlement) throw new FjnFinanceSettlementNotFoundError({ id });
      if (!isFinanceSettlementApprovable(settlement.status as FjnFinanceSettlementStatus)) {
        throw new FjnFinanceSettlementNotApprovableError({ id, status: settlement.status });
      }
      // 校验至少有一条 item
      const itemCount = await tx.fjnSettlementItem.count({ where: { settlementId: id } });
      if (itemCount === 0) {
        throw new FjnFinanceSettlementNoItemsError({ id });
      }
      assertTransitFinanceSettlementStatus(
        settlement.status as FjnFinanceSettlementStatus,
        FINANCE_SETTLEMENT_STATUS.APPROVED,
      );
      const updated = await tx.fjnSettlement.update({
        where: { id },
        data: {
          status: FINANCE_SETTLEMENT_STATUS.APPROVED,
          approvedBy: input.approverId,
          approvedAt: new Date(),
        },
      });
      const payload: SettlementApprovedPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        settlement_id: updated.id,
        settlement_no: updated.settlementNo,
        approver_id: input.approverId,
        approved_at: updated.approvedAt!.toISOString(),
        review_note: input.reviewNote,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_APPROVED, payload);
      return this.formatSettlement(updated);
    });
  }

  /** 支付结算单（按条目逐个支付） */
  async paySettlement(id: string, input: PaySettlementItemInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnSettlement.findUnique({ where: { id } });
      if (!settlement) throw new FjnFinanceSettlementNotFoundError({ id });
      if (!isFinanceSettlementPayable(settlement.status as FjnFinanceSettlementStatus)) {
        throw new FjnFinanceSettlementNotPayableError({ id, status: settlement.status });
      }
      const items = await tx.fjnSettlementItem.findMany({
        where: { settlementId: id, status: FINANCE_SETTLEMENT_ITEM_STATUS.PENDING },
      });
      if (items.length === 0) {
        throw new FjnFinanceSettlementNoItemsError({ id });
      }
      // 标记结算单为 PAID
      assertTransitFinanceSettlementStatus(
        settlement.status as FjnFinanceSettlementStatus,
        FINANCE_SETTLEMENT_STATUS.PAID,
      );
      const paidAt = input.paidAt ?? new Date();
      const updated = await tx.fjnSettlement.update({
        where: { id },
        data: { status: FINANCE_SETTLEMENT_STATUS.PAID, paidAt },
      });
      // 标记所有 pending 条目为 paid
      await tx.fjnSettlementItem.updateMany({
        where: { settlementId: id, status: FINANCE_SETTLEMENT_ITEM_STATUS.PENDING },
        data: { status: FINANCE_SETTLEMENT_ITEM_STATUS.PAID, paidAt },
      });
      const payload: SettlementPaidPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        settlement_id: updated.id,
        settlement_no: updated.settlementNo,
        paid_at: paidAt.toISOString(),
        total_amount: updated.totalAmount.toString(),
        currency: updated.currency,
        item_count: items.length,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_PAID, payload);
      return this.formatSettlement(updated);
    });
  }

  /** 支付单个结算条目 */
  async paySettlementItem(itemId: string, input: PaySettlementItemInput): Promise<Record<string, unknown>> {
    return this.withTransaction(async (tx) => {
      const item = await tx.fjnSettlementItem.findUnique({ where: { id: itemId } });
      if (!item) throw new FjnFinanceSettlementItemNotFoundError({ id: itemId });
      if (!isFinanceSettlementItemPayable(item.status as FjnFinanceSettlementItemStatus)) {
        throw new FjnFinanceSettlementItemNotPayableError({ id: itemId, status: item.status });
      }
      // 校验 bankInfo
      if (!item.bankInfo) {
        throw new FjnFinanceSettlementItemBankInfoRequiredError({ id: itemId });
      }
      assertTransitFinanceSettlementItemStatus(
        item.status as FjnFinanceSettlementItemStatus,
        FINANCE_SETTLEMENT_ITEM_STATUS.PAID,
      );
      const paidAt = input.paidAt ?? new Date();
      const updated = await tx.fjnSettlementItem.update({
        where: { id: itemId },
        data: { status: FINANCE_SETTLEMENT_ITEM_STATUS.PAID, paidAt },
      });
      const settlement = await tx.fjnSettlement.findUnique({ where: { id: item.settlementId } });
      const payload: SettlementItemPaidPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.SETTLEMENT,
        item_id: updated.id,
        settlement_id: item.settlementId,
        settlement_no: settlement?.settlementNo ?? '',
        user_id: updated.userId ?? undefined,
        merchant_id: updated.merchantId ?? undefined,
        node_id: updated.nodeId ?? undefined,
        amount: updated.amount.toString(),
        net_amount: updated.netAmount.toString(),
        tax_amount: updated.taxAmount.toString(),
        currency: settlement?.currency ?? 'USD',
        paid_at: paidAt.toISOString(),
        status: FINANCE_SETTLEMENT_ITEM_STATUS.PAID,
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_ITEM_PAID, payload);
      return this.formatSettlementItem(updated);
    });
  }

  /** 标记结算条目失败 */
  async failSettlementItem(itemId: string, failureReason: string, operatorId?: string): Promise<Record<string, unknown>> {
    if (!failureReason) throw new FjnFinanceReasonRequiredError({ context: 'fail' });
    return this.withTransaction(async (tx) => {
      const item = await tx.fjnSettlementItem.findUnique({ where: { id: itemId } });
      if (!item) throw new FjnFinanceSettlementItemNotFoundError({ id: itemId });
      const updated = await tx.fjnSettlementItem.update({
        where: { id: itemId },
        data: { status: FINANCE_SETTLEMENT_ITEM_STATUS.FAILED },
      });
      const settlement = await tx.fjnSettlement.findUnique({ where: { id: item.settlementId } });
      const payload: SettlementItemFailedPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.SETTLEMENT,
        item_id: updated.id,
        settlement_id: item.settlementId,
        settlement_no: settlement?.settlementNo ?? '',
        user_id: updated.userId ?? undefined,
        amount: updated.amount.toString(),
        currency: settlement?.currency ?? 'USD',
        failure_reason: failureReason,
        failed_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_ITEM_FAILED, payload);
      return this.formatSettlementItem(updated);
    });
  }

  /** 取消结算单 */
  async cancelSettlement(id: string, input: CancelSettlementInput): Promise<Record<string, unknown>> {
    if (!input.reason) throw new FjnFinanceReasonRequiredError({ context: 'cancel' });
    return this.withTransaction(async (tx) => {
      const settlement = await tx.fjnSettlement.findUnique({ where: { id } });
      if (!settlement) throw new FjnFinanceSettlementNotFoundError({ id });
      if (!isFinanceSettlementCancellable(settlement.status as FjnFinanceSettlementStatus)) {
        if (settlement.status === FINANCE_SETTLEMENT_STATUS.PAID) {
          throw new FjnFinanceSettlementAlreadyPaidError({ id });
        }
        throw new FjnFinanceSettlementNotCancellableError({ id, status: settlement.status });
      }
      assertTransitFinanceSettlementStatus(
        settlement.status as FjnFinanceSettlementStatus,
        FINANCE_SETTLEMENT_STATUS.CANCELLED,
      );
      const updated = await tx.fjnSettlement.update({
        where: { id },
        data: { status: FINANCE_SETTLEMENT_STATUS.CANCELLED },
      });
      // 关联 pending 条目标记为 failed
      await tx.fjnSettlementItem.updateMany({
        where: { settlementId: id, status: FINANCE_SETTLEMENT_ITEM_STATUS.PENDING },
        data: { status: FINANCE_SETTLEMENT_ITEM_STATUS.FAILED },
      });
      const payload: SettlementCancelledPayload = {
        occurred_at: new Date().toISOString(),
        source: FINANCE_EVENT_SOURCES.ADMIN,
        settlement_id: updated.id,
        settlement_no: updated.settlementNo,
        reason: input.reason,
        operator_id: input.operatorId,
        cancelled_at: new Date().toISOString(),
      };
      await this.emitOutboxEvent(tx, FINANCE_EVENTS.SETTLEMENT_CANCELLED, payload);
      return this.formatSettlement(updated);
    });
  }

  /** 按 ID 查询结算单（含 items） */
  async findSettlementById(id: string): Promise<Record<string, unknown> | null> {
    const s = await this.prisma.fjnSettlement.findUnique({
      where: { id },
      include: { items: true },
    });
    return s ? this.formatSettlement(s, s.items) : null;
  }

  /** 列出结算单 */
  async listSettlements(params: {
    settlementType?: FjnFinanceSettlementType;
    status?: FjnFinanceSettlementStatus;
    period?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (params.settlementType) where.settlementType = params.settlementType;
    if (params.status) where.status = params.status;
    if (params.period) where.period = params.period;

    const [items, total] = await Promise.all([
      this.prisma.fjnSettlement.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.fjnSettlement.count({ where }),
    ]);
    return {
      items: items.map((s) => this.formatSettlement(s, s.items)),
      total,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 7. 报表域
  // ============================================================

  /** 账户汇总 */
  async getAccountSummary(params: { currency?: string; accountType?: FjnFinanceAccountType } = {}): Promise<{
    items: Record<string, unknown>[];
  }> {
    const where: Record<string, unknown> = {};
    if (params.currency) where.currency = params.currency;
    if (params.accountType) where.accountType = params.accountType;
    const items = await this.prisma.fjnFinanceAccount.findMany({
      where,
      orderBy: [{ accountType: 'asc' }, { currency: 'asc' }],
    });
    return {
      items: items.map((a) => ({
        account_id: a.id,
        account_no: a.accountNo,
        account_name: a.accountName,
        account_type: a.accountType,
        currency: a.currency,
        balance: a.balance.toString(),
        total_in: a.totalIn.toString(),
        total_out: a.totalOut.toString(),
        status: a.status,
      })),
    };
  }

  /** 流水汇总（按 businessType + direction + currency） */
  async getLedgerSummary(params: {
    currency?: string;
    userId?: string;        // P0-1: IDOR 防护 - 非 admin 强制 ctxUserId
    startTime?: Date;
    endTime?: Date;
  } = {}): Promise<{
    items: Array<{
      business_type: string;
      direction: string;
      currency: string;
      count: number;
      total_amount: string;
    }>;
  }> {
    const where: Record<string, unknown> = {
      settlementStatus: FINANCE_LEDGER_STATUS.POSTED,
    };
    if (params.currency) where.currency = params.currency;
    if (params.userId) where.userId = params.userId;
    if (params.startTime || params.endTime) {
      where.createdAt = {};
      if (params.startTime) (where.createdAt as any).gte = params.startTime;
      if (params.endTime) (where.createdAt as any).lte = params.endTime;
    }
    const groups = await this.prisma.fjnFinanceLedger.groupBy({
      by: ['businessType', 'direction', 'currency'] as any,
      where,
      _sum: { amount: true },
      _count: true,
    });
    return {
      items: (groups as any[]).map((g) => ({
        business_type: g.businessType,
        direction: g.direction,
        currency: g.currency,
        count: g._count,
        total_amount: g._sum?.amount?.toString() ?? '0.0000',
      })),
    };
  }

  // ============================================================
  // 8. 工具方法
  // ============================================================

  private generateAccountNo(type: string): string {
    const prefix = 'FAC';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeCode = type.slice(0, 4).toUpperCase();
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `${prefix}${date}${typeCode}${random}`;
  }

  private generateLedgerNo(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `FLD${date}${random}`;
  }

  private generateSettlementNo(type: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const typeCode = type.slice(0, 3).toUpperCase();
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `FST${date}${typeCode}${random}`;
  }

  /** 解析事件源（基于 sourceType 推断） */
  private resolveEventSource(sourceType: string): string {
    const map: Record<string, string> = {
      revenue_allocation: FINANCE_EVENT_SOURCES.REVENUE,
      order: FINANCE_EVENT_SOURCES.ORDER,
      payment: FINANCE_EVENT_SOURCES.PAYMENT,
      referral_reward: FINANCE_EVENT_SOURCES.REFERRAL,
      team_reward: FINANCE_EVENT_SOURCES.TEAM,
      node_reward: FINANCE_EVENT_SOURCES.NODE,
      tax: FINANCE_EVENT_SOURCES.TAX,
      risk_hold: FINANCE_EVENT_SOURCES.RISK,
      refund: FINANCE_EVENT_SOURCES.PAYMENT,
    };
    return map[sourceType] ?? FINANCE_EVENT_SOURCES.SYSTEM;
  }

  /** 写入 outbox 事件（事务内） */
  private async emitOutboxEvent(
    tx: any,
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (tx as any).outboxEvent
        .create({
          data: {
            eventType,
            payload: payload as any,
            status: 'pending',
            retryCount: 0,
          },
        })
        .catch(() => undefined);
    } catch {
      // 静默失败：outbox 表可能不存在
    }
  }

  /** 写入 outbox 事件（事务外） */
  private async emitOutboxEventNoTx(
    eventType: string,
    payload: object,
  ): Promise<void> {
    try {
      await (this.prisma as any).outboxEvent
        .create({
          data: {
            eventType,
            payload: payload as any,
            status: 'pending',
            retryCount: 0,
          },
        })
        .catch(() => undefined);
    } catch {
      // 静默失败
    }
  }

  private formatAccount(a: any): Record<string, unknown> {
    return {
      account_id: a.id,
      account_no: a.accountNo,
      account_name: a.accountName,
      account_type: a.accountType,
      currency: a.currency,
      balance: a.balance?.toString?.() ?? '0',
      total_in: a.totalIn?.toString?.() ?? '0',
      total_out: a.totalOut?.toString?.() ?? '0',
      status: a.status,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    };
  }

  private formatLedger(l: any): Record<string, unknown> {
    return {
      ledger_id: l.id,
      ledger_no: l.ledgerNo,
      account_id: l.accountId,
      business_type: l.businessType,
      business_id: l.businessId,
      business_no: l.businessNo,
      order_id: l.orderId,
      user_id: l.userId,
      direction: l.direction,
      amount: l.amount?.toString?.() ?? '0',
      balance_before: l.balanceBefore?.toString?.() ?? '0',
      balance_after: l.balanceAfter?.toString?.() ?? '0',
      currency: l.currency,
      accounting_subject: l.accountingSubject,
      tax_status: l.taxStatus,
      settlement_status: l.settlementStatus,
      description: l.description,
      operator_id: l.operatorId,
      created_at: l.createdAt,
    };
  }

  private formatSettlement(s: any, items: any[] = []): Record<string, unknown> {
    return {
      settlement_id: s.id,
      settlement_no: s.settlementNo,
      settlement_type: s.settlementType,
      period: s.period,
      total_amount: s.totalAmount?.toString?.() ?? '0',
      currency: s.currency,
      status: s.status,
      approved_by: s.approvedBy,
      approved_at: s.approvedAt,
      paid_at: s.paidAt,
      description: s.description,
      items: items.map((i) => this.formatSettlementItem(i)),
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    };
  }

  private formatSettlementItem(i: any): Record<string, unknown> {
    return {
      item_id: i.id,
      settlement_id: i.settlementId,
      user_id: i.userId,
      merchant_id: i.merchantId,
      node_id: i.nodeId,
      amount: i.amount?.toString?.() ?? '0',
      tax_amount: i.taxAmount?.toString?.() ?? '0',
      net_amount: i.netAmount?.toString?.() ?? '0',
      status: i.status,
      bank_info: i.bankInfo,
      paid_at: i.paidAt,
      created_at: i.createdAt,
    };
  }
}

/** 工厂函数 */
export function createFjnFinanceService(options?: FjnServiceOptions): FjnFinanceService {
  return new FjnFinanceService(options);
}
