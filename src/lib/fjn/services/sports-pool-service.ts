/**
 * Sports Pool Service - 体育竞猜资金池 / 赛事 / 竞猜市场 / 用户参与
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.9
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §2.4
 *
 * 职责：
 *  - Pool 域：createPool / lockPool / unlockPool / settlePool / closePool / cancelPool
 *  - Event 域：createEvent / openEvent / markLive / closeEvent / publishOracleResult / settleEvent / cancelEvent
 *  - Market 域：createMarket / openMarket / lockMarket / settleMarket / cancelMarket / voidMarket
 *  - Entry 域：placeEntry（合规检查）/ markEntryPaid / confirmEntry / settleEntryWon / settleEntryLost / refundEntry / voidEntry / holdEntry
 *  - 统计：getPoolStats / listPools / listEvents / listMarkets / listEntries
 *
 * 链上集成：
 *  - Solana Sports Pool Program（fjn_sports_pool_program）
 *  - Solana Token Service（FJN 奖励 payout）
 *  - Solana NFT Service（赛事 NFT / 纪念 NFT）
 *
 * 业务真相源：FjnOperationLog（payload JSON 作为 pool/event/market/entry 账本）
 * 前置依赖：SportsComplianceService（合规校验必须先通过）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  SPORTS_POOL_TYPE,
  SPORTS_POOL_STATUS,
  SPORTS_EVENT_STATUS,
  SPORTS_MARKET_TYPE,
  SPORTS_MARKET_STATUS,
  SPORTS_ENTRY_STATUS,
  SPORTS_ENTRY_PAYMENT_METHOD,
  SPORTS_ODDS_FORMAT,
  SPORTS_OUTCOME,
  SPORTS_CATEGORY,
  SPORTS_POOL_DEFAULT_CHAIN_ID,
  SPORTS_POOL_DEFAULT_CURRENCY,
  SPORTS_ODDS_PRECISION,
  SPORTS_MIN_ODDS,
  isValidSportsPoolType,
  isValidSportsPoolStatus,
  isValidSportsEventStatus,
  isValidSportsMarketType,
  isValidSportsMarketStatus,
  isValidSportsEntryStatus,
  isValidSportsEntryPaymentMethod,
  isValidSportsOddsFormat,
  isValidSportsOutcome,
  isValidSportsCategory,
  canTransitSportsPoolStatus,
  canTransitSportsEventStatus,
  canTransitSportsMarketStatus,
  canTransitSportsEntryStatus,
  type FjnSportsPoolType,
  type FjnSportsPoolStatus,
  type FjnSportsEventStatus,
  type FjnSportsMarketType,
  type FjnSportsMarketStatus,
  type FjnSportsEntryStatus,
  type FjnSportsEntryPaymentMethod,
  type FjnSportsOddsFormat,
  type FjnSportsOutcome,
  type FjnSportsCategory,
} from './sports-pool-state-machine';
import {
  SPORTS_POOL_EVENTS,
  SPORTS_POOL_EVENT_SOURCES,
  type FjnSportsPoolEventSource,
} from './sports-pool-events';
import {
  SportsPoolNotFoundError,
  SportsPoolTypeInvalidError,
  SportsPoolStatusInvalidError,
  SportsPoolLockedError,
  SportsPoolClosedError,
  SportsPoolNameRequiredError,
  SportsEventNotFoundError,
  SportsEventStatusInvalidError,
  SportsEventNameRequiredError,
  SportsEventTimeInvalidError,
  SportsEventOutcomeInvalidError,
  SportsEventTeamsRequiredError,
  SportsMarketNotFoundError,
  SportsMarketStatusInvalidError,
  SportsMarketLockedError,
  SportsMarketTypeInvalidError,
  SportsMarketOddsInvalidError,
  SportsMarketOutcomesRequiredError,
  SportsEntryNotFoundError,
  SportsEntryStatusInvalidError,
  SportsEntryStakeInvalidError,
  SportsEntryUserIdRequiredError,
  SportsEntryPaymentMethodInvalidError,
  SportsEntryOutcomeRequiredError,
  SportsEntryAlreadySettledError,
  SportsEntryAlreadyPaidError,
  SportsEntryDuplicateError,
  SportsEntryTxHashDuplicateError,
  SportsComplianceFailedError,
  SportsComplianceRequiredError,
  SportsRiskHoldError,
  SportsOracleResultInvalidError,
  SportsOraclePublisherRequiredError,
  SportsPayoutFailedError,
  SportsRefundFailedError,
  SportsCategoryInvalidError,
  SportsPayoutAmountInvalidError,
} from './sports-pool-errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 创建 Pool */
export interface CreateSportsPoolInput {
  poolName: string;
  poolType: FjnSportsPoolType;
  category: FjnSportsCategory;
  description?: string;
  /** 默认赔率格式 */
  oddsFormat?: FjnSportsOddsFormat;
  /** 关联到 league/event（可选） */
  parentRefId?: string;
  operatorId?: string;
}

/** 创建 Event */
export interface CreateSportsEventInput {
  poolId: string;
  eventName: string;
  category: FjnSportsCategory;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  endTime?: Date;
  leagueName?: string;
  externalRefId?: string;
  oracleSource?: string;
  operatorId?: string;
}

/** 创建 Market */
export interface CreateSportsMarketInput {
  eventId: string;
  marketType: FjnSportsMarketType;
  marketName: string;
  /** 选项及赔率 */
  outcomes: Array<{ key: string; label: string; odds: string }>;
  /** 截止下注时间（默认 = event.startTime） */
  closeAt?: Date;
  /** 最低下注金额 */
  minStake?: string;
  /** 最高下注金额 */
  maxStake?: string;
  operatorId?: string;
}

/** 用户下注 */
export interface PlaceEntryInput {
  userId: string;
  poolId: string;
  marketId: string;
  outcomeSelected: string;
  /** 下注金额（decimal string） */
  stake: string;
  paymentMethod: FjnSportsEntryPaymentMethod;
  /** 必须先通过 SportsComplianceService，传 checkId */
  complianceCheckId: string;
  /** 链上 Solana Pay tx hash（solana_pay 时必填） */
  txHash?: string;
  /** Solana 链上 Token Account */
  sourceTokenAccount?: string;
  operatorId?: string;
}

/** 标记 Entry 已支付 */
export interface MarkEntryPaidInput {
  entryId: string;
  txHash: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 确认 Entry（链上交易已确认） */
export interface ConfirmEntryInput {
  entryId: string;
  txHash: string;
  blockNumber?: bigint | number;
  operatorId?: string;
}

/** 风控 hold */
export interface HoldEntryInput {
  entryId: string;
  reason: string;
  operatorId?: string;
}

/** 取消 hold */
export interface ReleaseHoldInput {
  entryId: string;
  operatorId?: string;
}

/** 退款 */
export interface RefundEntryInput {
  entryId: string;
  reason: string;
  operatorId?: string;
}

/** 流局（赛事取消） */
export interface VoidEntryInput {
  entryId: string;
  reason: string;
  operatorId?: string;
}

/** Oracle 发布结果 */
export interface PublishOracleResultInput {
  eventId: string;
  outcome: FjnSportsOutcome;
  homeScore: number;
  awayScore: number;
  publisherId: string;
  /** Oracle 链上 tx hash */
  oracleTxHash: string;
  operatorId?: string;
}

/** 标记 Entry 胜 */
export interface SettleEntryWonInput {
  entryId: string;
  payoutTxHash?: string;
  operatorId?: string;
}

/** 标记 Entry 负 */
export interface SettleEntryLostInput {
  entryId: string;
  operatorId?: string;
}

/** 结算 Market */
export interface SettleMarketInput {
  marketId: string;
  operatorId?: string;
}

/** 结算 Event */
export interface SettleEventInput {
  eventId: string;
  operatorId?: string;
}

/** 锁定 Pool（赛事进行中） */
export interface LockPoolInput {
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

/** 关闭 Pool */
export interface ClosePoolInput {
  poolId: string;
  operatorId?: string;
}

/** 分页查询 */
export interface ListSportsPoolsInput {
  page?: number;
  pageSize?: number;
  category?: FjnSportsCategory;
  status?: FjnSportsPoolStatus;
}

export interface ListSportsEventsInput {
  page?: number;
  pageSize?: number;
  poolId?: string;
  category?: FjnSportsCategory;
  status?: FjnSportsEventStatus;
}

export interface ListSportsMarketsInput {
  page?: number;
  pageSize?: number;
  eventId?: string;
  status?: FjnSportsMarketStatus;
}

export interface ListSportsEntriesInput {
  page?: number;
  pageSize?: number;
  poolId?: string;
  marketId?: string;
  userId?: string;
  status?: FjnSportsEntryStatus;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface SportsPoolSummary {
  id: string;
  poolNo: string;
  poolName: string;
  poolType: FjnSportsPoolType;
  category: FjnSportsCategory;
  status: FjnSportsPoolStatus;
  totalStake: string;
  totalPayout: string;
  totalEntries: number;
  eventCount: number;
}

export interface SportsEventSummary {
  id: string;
  eventNo: string;
  poolId: string;
  eventName: string;
  category: FjnSportsCategory;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  endTime: Date | null;
  status: FjnSportsEventStatus;
  outcome: FjnSportsOutcome | null;
  homeScore: number | null;
  awayScore: number | null;
  oracleTxHash: string | null;
}

export interface SportsMarketSummary {
  id: string;
  marketNo: string;
  eventId: string;
  marketType: FjnSportsMarketType;
  marketName: string;
  outcomes: Array<{ key: string; label: string; odds: string }>;
  status: FjnSportsMarketStatus;
  totalStake: string;
  closeAt: Date | null;
  minStake: string | null;
  maxStake: string | null;
}

export interface SportsEntrySummary {
  id: string;
  entryNo: string;
  poolId: string;
  marketId: string;
  userId: string;
  outcomeSelected: string;
  odds: string;
  stake: string;
  payout: string;
  paymentMethod: FjnSportsEntryPaymentMethod;
  status: FjnSportsEntryStatus;
  complianceCheckId: string | null;
  txHash: string | null;
  payoutTxHash: string | null;
  placedAt: Date;
  settledAt: Date | null;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnSportsPoolService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnSportsPoolService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generatePoolNo(): string {
    return `SP-POOL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateEventNo(): string {
    return `SP-EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateMarketNo(): string {
    return `SP-MKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  private generateEntryNo(): string {
    return `SP-ENT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnSportsPoolEventSource = SPORTS_POOL_EVENT_SOURCES.SPORTS_POOL_SERVICE,
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

  /** 计算 payout = stake × odds */
  private calculatePayout(stake: Prisma.Decimal, odds: Prisma.Decimal): Prisma.Decimal {
    return stake.mul(odds);
  }

  /** 链上 Solana Sports Pool 投注（占位） */
  private async callSolanaSportsPoolPlace(
    entryNo: string,
    poolId: string,
    marketId: string,
    userId: string,
    outcome: string,
    stake: string,
  ): Promise<{ txHash: string; poolAddress: string }> {
    const txHash = `mock-pool-place-${entryNo}-${Date.now()}`;
    const poolAddress = `pool-${poolId}-${marketId}-${Math.random().toString(36).slice(2, 10)}`;
    this.log('info', `Solana Sports Pool place placeholder`, { entryNo, poolAddress, stake, txHash });
    return { txHash, poolAddress };
  }

  /** 链上 payout 派奖（占位） */
  private async callSolanaSportsPoolPayout(
    entryNo: string,
    userId: string,
    payout: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const txHash = `mock-payout-${entryNo}-${Date.now()}`;
    const blockNumber = Math.floor(Date.now() / 1000) % 100000000;
    this.log('info', `Solana Sports Pool payout placeholder`, { entryNo, userId, payout, txHash, blockNumber });
    return { txHash, blockNumber };
  }

  /** 链上 refund 退款（占位） */
  private async callSolanaSportsPoolRefund(
    entryNo: string,
    userId: string,
    refund: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    const txHash = `mock-refund-${entryNo}-${Date.now()}`;
    const blockNumber = Math.floor(Date.now() / 1000) % 100000000;
    this.log('info', `Solana Sports Pool refund placeholder`, { entryNo, userId, refund, txHash, blockNumber });
    return { txHash, blockNumber };
  }

  // ==========================================================
  // 3.1 Pool 域
  // ==========================================================

  async createPool(input: CreateSportsPoolInput) {
    if (!input.poolName) throw new SportsPoolNameRequiredError();
    if (!isValidSportsPoolType(input.poolType)) {
      throw new SportsPoolTypeInvalidError({ poolType: input.poolType });
    }
    if (!isValidSportsCategory(input.category)) {
      throw new SportsCategoryInvalidError({ category: input.category });
    }
    const oddsFormat = input.oddsFormat ?? SPORTS_ODDS_FORMAT.DECIMAL;
    if (!isValidSportsOddsFormat(oddsFormat)) {
      throw new SportsMarketOddsInvalidError({ oddsFormat });
    }

    return this.withTransaction(async (tx) => {
      const poolNo = this.generatePoolNo();
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'sports_pool',
          refType: input.poolType,
          refId: input.parentRefId ?? null,
          operatorId: input.operatorId ?? null,
          payload: {
            entityType: 'sports_pool',
            poolNo,
            poolName: input.poolName,
            poolType: input.poolType,
            category: input.category,
            status: SPORTS_POOL_STATUS.ACTIVE,
            description: input.description ?? null,
            oddsFormat,
            parentRefId: input.parentRefId ?? null,
            totalStake: '0.0000',
            totalPayout: '0.0000',
            totalEntries: 0,
            eventCount: 0,
            chainId: SPORTS_POOL_DEFAULT_CHAIN_ID,
            currency: SPORTS_POOL_DEFAULT_CURRENCY,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.POOL_CREATED, {
        poolId: created.id,
        poolNo,
        poolName: input.poolName,
        poolType: input.poolType,
        category: input.category,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports pool created: ${poolNo}`, { poolType: input.poolType });
      return {
        id: created.id,
        poolNo,
        poolName: input.poolName,
        poolType: input.poolType,
        category: input.category,
        status: SPORTS_POOL_STATUS.ACTIVE,
        totalStake: '0.0000',
        totalPayout: '0.0000',
        totalEntries: 0,
        eventCount: 0,
      } as SportsPoolSummary;
    });
  }

  async lockPool(input: LockPoolInput) {
    if (!input.poolId) throw new SportsPoolNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.poolId } });
      if (!log) throw new SportsPoolNotFoundError({ poolId: input.poolId });
      const pool = log.payload as any;
      if (pool.entityType !== 'sports_pool') {
        throw new SportsPoolNotFoundError({ poolId: input.poolId });
      }
      if (!canTransitSportsPoolStatus(pool.status, SPORTS_POOL_STATUS.LOCKED)) {
        throw new SportsPoolStatusInvalidError({
          poolNo: pool.poolNo,
          from: pool.status,
          to: SPORTS_POOL_STATUS.LOCKED,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.poolId },
        data: {
          payload: { ...pool, status: SPORTS_POOL_STATUS.LOCKED, lockReason: input.reason, lockedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.POOL_LOCKED, {
        poolId: input.poolId,
        poolNo: pool.poolNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports pool locked: ${pool.poolNo}`, { reason: input.reason });
      return updated;
    });
  }

  async cancelPool(input: CancelPoolInput) {
    if (!input.poolId) throw new SportsPoolNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.poolId } });
      if (!log) throw new SportsPoolNotFoundError({ poolId: input.poolId });
      const pool = log.payload as any;
      if (pool.entityType !== 'sports_pool') {
        throw new SportsPoolNotFoundError({ poolId: input.poolId });
      }
      if (!canTransitSportsPoolStatus(pool.status, SPORTS_POOL_STATUS.CANCELLED)) {
        throw new SportsPoolStatusInvalidError({
          poolNo: pool.poolNo,
          from: pool.status,
          to: SPORTS_POOL_STATUS.CANCELLED,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.poolId },
        data: {
          payload: { ...pool, status: SPORTS_POOL_STATUS.CANCELLED, cancelReason: input.reason, cancelledAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.POOL_CANCELLED, {
        poolId: input.poolId,
        poolNo: pool.poolNo,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports pool cancelled: ${pool.poolNo}`, { reason: input.reason });
      return updated;
    });
  }

  async closePool(input: ClosePoolInput) {
    if (!input.poolId) throw new SportsPoolNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.poolId } });
      if (!log) throw new SportsPoolNotFoundError({ poolId: input.poolId });
      const pool = log.payload as any;
      if (pool.entityType !== 'sports_pool') {
        throw new SportsPoolNotFoundError({ poolId: input.poolId });
      }
      if (!canTransitSportsPoolStatus(pool.status, SPORTS_POOL_STATUS.CLOSED)) {
        throw new SportsPoolStatusInvalidError({
          poolNo: pool.poolNo,
          from: pool.status,
          to: SPORTS_POOL_STATUS.CLOSED,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.poolId },
        data: {
          payload: { ...pool, status: SPORTS_POOL_STATUS.CLOSED, closedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.POOL_CLOSED, {
        poolId: input.poolId,
        poolNo: pool.poolNo,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports pool closed: ${pool.poolNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.2 Event 域
  // ==========================================================

  async createEvent(input: CreateSportsEventInput) {
    if (!input.eventName) throw new SportsEventNameRequiredError();
    if (!input.homeTeam || !input.awayTeam) throw new SportsEventTeamsRequiredError();
    if (!input.startTime || isNaN(input.startTime.getTime())) {
      throw new SportsEventTimeInvalidError({ startTime: input.startTime });
    }
    if (!isValidSportsCategory(input.category)) {
      throw new SportsCategoryInvalidError({ category: input.category });
    }
    if (input.endTime && input.endTime.getTime() < input.startTime.getTime()) {
      throw new SportsEventTimeInvalidError({ startTime: input.startTime, endTime: input.endTime });
    }

    return this.withTransaction(async (tx) => {
      // 校验 pool 存在
      const poolLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.poolId } });
      if (!poolLog) throw new SportsPoolNotFoundError({ poolId: input.poolId });
      const pool = poolLog.payload as any;
      if (pool.entityType !== 'sports_pool') {
        throw new SportsPoolNotFoundError({ poolId: input.poolId });
      }
      if (pool.status !== SPORTS_POOL_STATUS.ACTIVE) {
        throw new SportsPoolLockedError({ poolNo: pool.poolNo, status: pool.status });
      }

      const eventNo = this.generateEventNo();
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'sports_event',
          refType: input.category,
          refId: input.poolId,
          operatorId: input.operatorId ?? null,
          payload: {
            entityType: 'sports_event',
            eventNo,
            poolId: input.poolId,
            eventName: input.eventName,
            category: input.category,
            homeTeam: input.homeTeam,
            awayTeam: input.awayTeam,
            startTime: input.startTime.toISOString(),
            endTime: input.endTime?.toISOString() ?? null,
            leagueName: input.leagueName ?? null,
            externalRefId: input.externalRefId ?? null,
            oracleSource: input.oracleSource ?? null,
            status: SPORTS_EVENT_STATUS.SCHEDULED,
            outcome: SPORTS_OUTCOME.UNKNOWN,
            homeScore: null,
            awayScore: null,
            oracleTxHash: null,
            chainId: SPORTS_POOL_DEFAULT_CHAIN_ID,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      // pool.eventCount += 1
      await (tx as any).fjnOperationLog.update({
        where: { id: input.poolId },
        data: {
          payload: { ...pool, eventCount: (pool.eventCount ?? 0) + 1 } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_CREATED, {
        eventId: created.id,
        eventNo,
        poolId: input.poolId,
        eventName: input.eventName,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        startTime: input.startTime.toISOString(),
        operatorId: input.operatorId,
      });

      this.log('info', `Sports event created: ${eventNo}`, { poolId: input.poolId });
      return {
        id: created.id,
        eventNo,
        poolId: input.poolId,
        eventName: input.eventName,
        category: input.category,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        startTime: input.startTime,
        endTime: input.endTime ?? null,
        status: SPORTS_EVENT_STATUS.SCHEDULED,
        outcome: SPORTS_OUTCOME.UNKNOWN,
        homeScore: null,
        awayScore: null,
        oracleTxHash: null,
      } as SportsEventSummary;
    });
  }

  async openEvent(eventId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId });
      }
      if (!canTransitSportsEventStatus(event.status, SPORTS_EVENT_STATUS.OPEN)) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: SPORTS_EVENT_STATUS.OPEN,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: eventId },
        data: {
          payload: { ...event, status: SPORTS_EVENT_STATUS.OPEN, openedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_OPENED, {
        eventId,
        eventNo: event.eventNo,
        operatorId,
      });
      this.log('info', `Sports event opened: ${event.eventNo}`);
      return updated;
    });
  }

  async markEventLive(eventId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId });
      }
      if (!canTransitSportsEventStatus(event.status, SPORTS_EVENT_STATUS.LIVE)) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: SPORTS_EVENT_STATUS.LIVE,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: eventId },
        data: {
          payload: { ...event, status: SPORTS_EVENT_STATUS.LIVE, liveAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_LIVE, {
        eventId,
        eventNo: event.eventNo,
        operatorId,
      });
      this.log('info', `Sports event live: ${event.eventNo}`);
      return updated;
    });
  }

  async closeEvent(eventId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId });
      }
      if (!canTransitSportsEventStatus(event.status, SPORTS_EVENT_STATUS.CLOSED)) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: SPORTS_EVENT_STATUS.CLOSED,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: eventId },
        data: {
          payload: { ...event, status: SPORTS_EVENT_STATUS.CLOSED, closedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_CLOSED, {
        eventId,
        eventNo: event.eventNo,
        operatorId,
      });
      this.log('info', `Sports event closed: ${event.eventNo}`);
      return updated;
    });
  }

  /**
   * Oracle 发布结果
   *  - 校验 publisher
   *  - 校验 event 状态（live / closed）
   *  - 更新 outcome / homeScore / awayScore / oracleTxHash
   *  - 不自动结算所有 markets，由 settleEvent 触发
   */
  async publishOracleResult(input: PublishOracleResultInput) {
    if (!isValidSportsOutcome(input.outcome)) {
      throw new SportsEventOutcomeInvalidError({ outcome: input.outcome });
    }
    if (!input.publisherId) throw new SportsOraclePublisherRequiredError();
    if (!input.oracleTxHash) throw new SportsOracleResultInvalidError({ reason: 'oracleTxHash required' });
    if (input.homeScore < 0 || input.awayScore < 0 || !Number.isInteger(input.homeScore) || !Number.isInteger(input.awayScore)) {
      throw new SportsOracleResultInvalidError({ homeScore: input.homeScore, awayScore: input.awayScore });
    }

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId: input.eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId: input.eventId });
      }
      if (event.status !== SPORTS_EVENT_STATUS.LIVE && event.status !== SPORTS_EVENT_STATUS.CLOSED) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: 'publish',
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.eventId },
        data: {
          payload: {
            ...event,
            outcome: input.outcome,
            homeScore: input.homeScore,
            awayScore: input.awayScore,
            oracleTxHash: input.oracleTxHash,
            oraclePublisherId: input.publisherId,
            oraclePublishedAt: new Date().toISOString(),
            status: SPORTS_EVENT_STATUS.CLOSED,
            closedAt: event.closedAt ?? new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ORACLE_RESULT_PUBLISHED, {
        eventId: input.eventId,
        eventNo: event.eventNo,
        outcome: input.outcome,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        oracleTxHash: input.oracleTxHash,
      });

      this.log('info', `Sports event oracle result published: ${event.eventNo}`, {
        outcome: input.outcome,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
      });
      return updated;
    });
  }

  /**
   * 结算 Event
   *  - 要求 event.outcome 已设置
   *  - 遍历所有 market 调用 settleMarket
   *  - 触发 EVENT_SETTLED
   */
  async settleEvent(input: SettleEventInput) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId: input.eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId: input.eventId });
      }
      if (!event.outcome || event.outcome === SPORTS_OUTCOME.UNKNOWN) {
        throw new SportsOracleResultInvalidError({ reason: 'event.outcome not set' });
      }
      if (!canTransitSportsEventStatus(event.status, SPORTS_EVENT_STATUS.SETTLED)) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: SPORTS_EVENT_STATUS.SETTLED,
        });
      }

      // 找出所有 market 并结算
      const allMarkets = await (tx as any).fjnOperationLog.findMany({
        where: { refId: input.eventId, payload: { path: ['entityType'], equals: 'sports_market' } },
      });

      for (const m of allMarkets) {
        const market = m.payload as any;
        if (market.status === SPORTS_MARKET_STATUS.LOCKED) {
          // 在 settleEvent 中简化处理：标记为 settled 或 voided（流局由 cancel event 触发）
          await (tx as any).fjnOperationLog.update({
            where: { id: m.id },
            data: {
              payload: { ...market, status: SPORTS_MARKET_STATUS.SETTLED, settledAt: new Date().toISOString() } as Prisma.InputJsonValue,
            },
          });
          await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_SETTLED, {
            marketId: m.id,
            marketNo: market.marketNo,
            eventId: input.eventId,
            operatorId: input.operatorId,
          });
        }
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.eventId },
        data: {
          payload: { ...event, status: SPORTS_EVENT_STATUS.SETTLED, settledAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_SETTLED, {
        eventId: input.eventId,
        eventNo: event.eventNo,
        outcome: event.outcome,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
        oracleTxHash: event.oracleTxHash,
      });

      this.log('info', `Sports event settled: ${event.eventNo}`, { outcome: event.outcome });
      return updated;
    });
  }

  async cancelEvent(eventId: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: eventId } });
      if (!log) throw new SportsEventNotFoundError({ eventId });
      const event = log.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId });
      }
      if (!canTransitSportsEventStatus(event.status, SPORTS_EVENT_STATUS.CANCELLED)) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: SPORTS_EVENT_STATUS.CANCELLED,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: eventId },
        data: {
          payload: { ...event, status: SPORTS_EVENT_STATUS.CANCELLED, cancelReason: reason, cancelledAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.EVENT_CANCELLED, {
        eventId,
        eventNo: event.eventNo,
        reason,
        operatorId,
      });
      this.log('info', `Sports event cancelled: ${event.eventNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.3 Market 域
  // ==========================================================

  async createMarket(input: CreateSportsMarketInput) {
    if (!isValidSportsMarketType(input.marketType)) {
      throw new SportsMarketTypeInvalidError({ marketType: input.marketType });
    }
    if (!input.marketName) throw new SportsMarketOutcomesRequiredError({ reason: 'marketName required' });
    if (!input.outcomes || input.outcomes.length < 2) {
      throw new SportsMarketOutcomesRequiredError({ reason: 'at least 2 outcomes required' });
    }
    for (const o of input.outcomes) {
      const odds = new Prisma.Decimal(o.odds);
      if (odds.lt(SPORTS_MIN_ODDS)) {
        throw new SportsMarketOddsInvalidError({ odds: o.odds, min: SPORTS_MIN_ODDS, key: o.key });
      }
    }

    return this.withTransaction(async (tx) => {
      // 校验 event 存在
      const eventLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.eventId } });
      if (!eventLog) throw new SportsEventNotFoundError({ eventId: input.eventId });
      const event = eventLog.payload as any;
      if (event.entityType !== 'sports_event') {
        throw new SportsEventNotFoundError({ eventId: input.eventId });
      }
      if (event.status !== SPORTS_EVENT_STATUS.SCHEDULED && event.status !== SPORTS_EVENT_STATUS.OPEN) {
        throw new SportsEventStatusInvalidError({
          eventNo: event.eventNo,
          from: event.status,
          to: 'create_market',
        });
      }

      const marketNo = this.generateMarketNo();
      const closeAt = input.closeAt ?? new Date(event.startTime);
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'sports_market',
          refType: input.marketType,
          refId: input.eventId,
          operatorId: input.operatorId ?? null,
          payload: {
            entityType: 'sports_market',
            marketNo,
            eventId: input.eventId,
            poolId: event.poolId,
            marketType: input.marketType,
            marketName: input.marketName,
            outcomes: input.outcomes,
            status: SPORTS_MARKET_STATUS.DRAFT,
            totalStake: '0.0000',
            closeAt: closeAt.toISOString(),
            minStake: input.minStake ?? '1.0000',
            maxStake: input.maxStake ?? '1000.0000',
            chainId: SPORTS_POOL_DEFAULT_CHAIN_ID,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_CREATED, {
        marketId: created.id,
        marketNo,
        eventId: input.eventId,
        marketType: input.marketType,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports market created: ${marketNo}`, { eventId: input.eventId });
      return {
        id: created.id,
        marketNo,
        eventId: input.eventId,
        marketType: input.marketType,
        marketName: input.marketName,
        outcomes: input.outcomes,
        status: SPORTS_MARKET_STATUS.DRAFT,
        totalStake: '0.0000',
        closeAt,
        minStake: input.minStake ?? '1.0000',
        maxStake: input.maxStake ?? '1000.0000',
      } as SportsMarketSummary;
    });
  }

  async openMarket(marketId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: marketId } });
      if (!log) throw new SportsMarketNotFoundError({ marketId });
      const market = log.payload as any;
      if (market.entityType !== 'sports_market') {
        throw new SportsMarketNotFoundError({ marketId });
      }
      if (!canTransitSportsMarketStatus(market.status, SPORTS_MARKET_STATUS.OPEN)) {
        throw new SportsMarketStatusInvalidError({
          marketNo: market.marketNo,
          from: market.status,
          to: SPORTS_MARKET_STATUS.OPEN,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: marketId },
        data: {
          payload: { ...market, status: SPORTS_MARKET_STATUS.OPEN, openedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_OPENED, {
        marketId,
        marketNo: market.marketNo,
        operatorId,
      });
      this.log('info', `Sports market opened: ${market.marketNo}`);
      return updated;
    });
  }

  async lockMarket(marketId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: marketId } });
      if (!log) throw new SportsMarketNotFoundError({ marketId });
      const market = log.payload as any;
      if (market.entityType !== 'sports_market') {
        throw new SportsMarketNotFoundError({ marketId });
      }
      if (!canTransitSportsMarketStatus(market.status, SPORTS_MARKET_STATUS.LOCKED)) {
        throw new SportsMarketStatusInvalidError({
          marketNo: market.marketNo,
          from: market.status,
          to: SPORTS_MARKET_STATUS.LOCKED,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: marketId },
        data: {
          payload: { ...market, status: SPORTS_MARKET_STATUS.LOCKED, lockedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_LOCKED, {
        marketId,
        marketNo: market.marketNo,
        operatorId,
      });
      this.log('info', `Sports market locked: ${market.marketNo}`);
      return updated;
    });
  }

  async cancelMarket(marketId: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: marketId } });
      if (!log) throw new SportsMarketNotFoundError({ marketId });
      const market = log.payload as any;
      if (market.entityType !== 'sports_market') {
        throw new SportsMarketNotFoundError({ marketId });
      }
      if (!canTransitSportsMarketStatus(market.status, SPORTS_MARKET_STATUS.CANCELLED)) {
        throw new SportsMarketStatusInvalidError({
          marketNo: market.marketNo,
          from: market.status,
          to: SPORTS_MARKET_STATUS.CANCELLED,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: marketId },
        data: {
          payload: { ...market, status: SPORTS_MARKET_STATUS.CANCELLED, cancelReason: reason, cancelledAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_CANCELLED, {
        marketId,
        marketNo: market.marketNo,
        reason,
        operatorId,
      });
      this.log('info', `Sports market cancelled: ${market.marketNo}`);
      return updated;
    });
  }

  async voidMarket(marketId: string, reason: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: marketId } });
      if (!log) throw new SportsMarketNotFoundError({ marketId });
      const market = log.payload as any;
      if (market.entityType !== 'sports_market') {
        throw new SportsMarketNotFoundError({ marketId });
      }
      if (!canTransitSportsMarketStatus(market.status, SPORTS_MARKET_STATUS.VOIDED)) {
        throw new SportsMarketStatusInvalidError({
          marketNo: market.marketNo,
          from: market.status,
          to: SPORTS_MARKET_STATUS.VOIDED,
        });
      }
      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: marketId },
        data: {
          payload: { ...market, status: SPORTS_MARKET_STATUS.VOIDED, voidReason: reason, voidedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.MARKET_VOIDED, {
        marketId,
        marketNo: market.marketNo,
        reason,
        operatorId,
      });
      this.log('info', `Sports market voided: ${market.marketNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.4 Entry 域（核心：下注）
  // ==========================================================

  /**
   * 用户下注（placeEntry）
   *  - 必须先通过 SportsComplianceService（complianceCheckId 必填）
   *  - 校验 pool / market 状态
   *  - 校验 stake 范围
   *  - 校验 outcome 合法
   *  - 链上：Solana Sports Pool Program place（占位）
   *  - 链下：FjnOperationLog 记录
   */
  async placeEntry(input: PlaceEntryInput) {
    if (!input.userId) throw new SportsEntryUserIdRequiredError();
    if (!input.complianceCheckId) throw new SportsComplianceRequiredError();
    if (!input.outcomeSelected) throw new SportsEntryOutcomeRequiredError();
    if (!isValidSportsEntryPaymentMethod(input.paymentMethod)) {
      throw new SportsEntryPaymentMethodInvalidError({ paymentMethod: input.paymentMethod });
    }
    const stake = new Prisma.Decimal(input.stake);
    if (stake.lte(0)) throw new SportsEntryStakeInvalidError({ stake: input.stake });
    if (input.paymentMethod === SPORTS_ENTRY_PAYMENT_METHOD.SOLANA_PAY && !input.txHash) {
      throw new SportsEntryTxHashDuplicateError({ reason: 'txHash required for solana_pay' });
    }

    return this.withTransaction(async (tx) => {
      // 校验 pool
      const poolLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.poolId } });
      if (!poolLog) throw new SportsPoolNotFoundError({ poolId: input.poolId });
      const pool = poolLog.payload as any;
      if (pool.entityType !== 'sports_pool') {
        throw new SportsPoolNotFoundError({ poolId: input.poolId });
      }
      if (pool.status !== SPORTS_POOL_STATUS.ACTIVE) {
        throw new SportsPoolLockedError({ poolNo: pool.poolNo, status: pool.status });
      }

      // 校验 market
      const marketLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.marketId } });
      if (!marketLog) throw new SportsMarketNotFoundError({ marketId: input.marketId });
      const market = marketLog.payload as any;
      if (market.entityType !== 'sports_market') {
        throw new SportsMarketNotFoundError({ marketId: input.marketId });
      }
      if (market.status !== SPORTS_MARKET_STATUS.OPEN) {
        throw new SportsMarketLockedError({ marketNo: market.marketNo, status: market.status });
      }
      if (market.poolId !== input.poolId) {
        throw new SportsMarketNotFoundError({
          marketId: input.marketId,
          reason: 'market does not belong to pool',
        });
      }

      // 校验 outcome
      const outcomeDef = market.outcomes.find((o: any) => o.key === input.outcomeSelected);
      if (!outcomeDef) {
        throw new SportsEntryOutcomeRequiredError({
          reason: `outcome ${input.outcomeSelected} not in market`,
        });
      }

      // 校验 stake 范围
      const minStake = new Prisma.Decimal(market.minStake ?? '1.0000');
      const maxStake = new Prisma.Decimal(market.maxStake ?? '1000.0000');
      if (stake.lt(minStake) || stake.gt(maxStake)) {
        throw new SportsEntryStakeInvalidError({
          stake: input.stake,
          min: minStake.toString(),
          max: maxStake.toString(),
        });
      }

      // 校验 compliance check
      const complianceCheck = await (tx as any).sportsComplianceCheck.findUnique({
        where: { id: input.complianceCheckId },
      });
      if (!complianceCheck) {
        throw new SportsComplianceRequiredError({ checkId: input.complianceCheckId });
      }
      if (complianceCheck.userId !== input.userId) {
        throw new SportsComplianceFailedError({ reason: 'compliance check userId mismatch' });
      }
      if (complianceCheck.result !== 'pass') {
        throw new SportsComplianceFailedError({ checkId: input.complianceCheckId, result: complianceCheck.result });
      }

      // 链上：Solana Sports Pool place（占位）
      const entryNo = this.generateEntryNo();
      let txHash = input.txHash ?? '';
      let poolAddress = '';
      try {
        const onchain = await this.callSolanaSportsPoolPlace(
          entryNo,
          input.poolId,
          input.marketId,
          input.userId,
          input.outcomeSelected,
          input.stake,
        );
        txHash = txHash || onchain.txHash;
        poolAddress = onchain.poolAddress;
      } catch (e) {
        throw new SportsPayoutFailedError({
          entryNo,
          originalError: (e as Error).message,
          stage: 'place',
        });
      }

      // 链下：写入 entry
      const odds = new Prisma.Decimal(outcomeDef.odds);
      const created = await (tx as any).fjnOperationLog.create({
        data: {
          operationType: 'sports_entry',
          refType: input.paymentMethod,
          refId: input.marketId,
          operatorId: input.userId,
          payload: {
            entityType: 'sports_entry',
            entryNo,
            poolId: input.poolId,
            marketId: input.marketId,
            userId: input.userId,
            outcomeSelected: input.outcomeSelected,
            odds: odds.toFixed(SPORTS_ODDS_PRECISION),
            stake: stake.toString(),
            payout: '0.0000',
            paymentMethod: input.paymentMethod,
            status: input.txHash ? SPORTS_ENTRY_STATUS.PAID : SPORTS_ENTRY_STATUS.PENDING,
            complianceCheckId: input.complianceCheckId,
            txHash,
            payoutTxHash: null,
            poolAddress,
            sourceTokenAccount: input.sourceTokenAccount ?? null,
            placedAt: new Date().toISOString(),
            settledAt: null,
            chainId: SPORTS_POOL_DEFAULT_CHAIN_ID,
            currency: SPORTS_POOL_DEFAULT_CURRENCY,
          } as Prisma.InputJsonValue,
        },
      });

      // market.totalStake += stake
      const newMarketStake = new Prisma.Decimal(market.totalStake).plus(stake);
      await (tx as any).fjnOperationLog.update({
        where: { id: input.marketId },
        data: {
          payload: { ...market, totalStake: newMarketStake.toFixed(SPORTS_ODDS_PRECISION) } as Prisma.InputJsonValue,
        },
      });

      // pool.totalStake += stake
      const newPoolStake = new Prisma.Decimal(pool.totalStake).plus(stake);
      await (tx as any).fjnOperationLog.update({
        where: { id: input.poolId },
        data: {
          payload: { ...pool, totalStake: newPoolStake.toFixed(SPORTS_ODDS_PRECISION), totalEntries: (pool.totalEntries ?? 0) + 1 } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_PLACED, {
        entryId: created.id,
        entryNo,
        poolId: input.poolId,
        marketId: input.marketId,
        userId: input.userId,
        stake: stake.toString(),
        paymentMethod: input.paymentMethod,
        outcomeSelected: input.outcomeSelected,
        odds: odds.toFixed(SPORTS_ODDS_PRECISION),
        complianceCheckId: input.complianceCheckId,
        operatorId: input.operatorId,
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.COMPLIANCE_PASSED, {
        entryNo,
        checkId: input.complianceCheckId,
      });

      this.log('info', `Sports entry placed: ${entryNo}`, {
        userId: input.userId,
        stake: stake.toString(),
        outcome: input.outcomeSelected,
      });
      return {
        id: created.id,
        entryNo,
        poolId: input.poolId,
        marketId: input.marketId,
        userId: input.userId,
        outcomeSelected: input.outcomeSelected,
        odds: odds.toFixed(SPORTS_ODDS_PRECISION),
        stake: stake.toString(),
        payout: '0.0000',
        paymentMethod: input.paymentMethod,
        status: input.txHash ? SPORTS_ENTRY_STATUS.PAID : SPORTS_ENTRY_STATUS.PENDING,
        complianceCheckId: input.complianceCheckId,
        txHash,
        payoutTxHash: null,
        placedAt: new Date(),
        settledAt: null,
      } as SportsEntrySummary;
    });
  }

  async markEntryPaid(input: MarkEntryPaidInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    if (!input.txHash) throw new SportsEntryTxHashDuplicateError({ reason: 'txHash required' });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.PAID || entry.status === SPORTS_ENTRY_STATUS.CONFIRMED) {
        throw new SportsEntryAlreadyPaidError({ entryNo: entry.entryNo, status: entry.status });
      }
      if (entry.status !== SPORTS_ENTRY_STATUS.PENDING) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: SPORTS_ENTRY_STATUS.PAID,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: { ...entry, status: SPORTS_ENTRY_STATUS.PAID, txHash: input.txHash, paidAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_PAID, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        txHash: input.txHash,
        blockNumber: input.blockNumber ? BigInt(input.blockNumber).toString() : null,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports entry paid: ${entry.entryNo}`, { txHash: input.txHash });
      return updated;
    });
  }

  async confirmEntry(input: ConfirmEntryInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    if (!input.txHash) throw new SportsEntryTxHashDuplicateError({ reason: 'txHash required' });

    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.CONFIRMED) return entry;
      if (entry.status !== SPORTS_ENTRY_STATUS.PAID) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: SPORTS_ENTRY_STATUS.CONFIRMED,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: { ...entry, status: SPORTS_ENTRY_STATUS.CONFIRMED, confirmedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_CONFIRMED, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        txHash: input.txHash,
        blockNumber: input.blockNumber ? BigInt(input.blockNumber).toString() : null,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports entry confirmed: ${entry.entryNo}`);
      return updated;
    });
  }

  /**
   * 标记 Entry 胜
   *  - 校验 entry.status == CONFIRMED
   *  - 计算 payout = stake × odds
   *  - 链上 payout（占位）
   *  - 链下：entry.status = SETTLED_WON
   *  - 累计 pool.totalPayout
   */
  async settleEntryWon(input: SettleEntryWonInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.SETTLED_WON) return entry;
      if (entry.status !== SPORTS_ENTRY_STATUS.CONFIRMED && entry.status !== SPORTS_ENTRY_STATUS.RISK_HOLD) {
        throw new SportsEntryAlreadySettledError({
          entryNo: entry.entryNo,
          status: entry.status,
        });
      }

      const stake = new Prisma.Decimal(entry.stake);
      const odds = new Prisma.Decimal(entry.odds);
      const payout = this.calculatePayout(stake, odds);
      if (payout.lte(0)) {
        throw new SportsPayoutAmountInvalidError({ payout: payout.toString() });
      }

      // 链上 payout
      let payoutTxHash = input.payoutTxHash ?? '';
      try {
        const onchain = await this.callSolanaSportsPoolPayout(entry.entryNo, entry.userId, payout.toString());
        payoutTxHash = payoutTxHash || onchain.txHash;
      } catch (e) {
        throw new SportsPayoutFailedError({
          entryNo: entry.entryNo,
          originalError: (e as Error).message,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: {
            ...entry,
            status: SPORTS_ENTRY_STATUS.SETTLED_WON,
            payout: payout.toString(),
            payoutTxHash,
            settledAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      // pool.totalPayout += payout
      const poolLog = await (tx as any).fjnOperationLog.findUnique({ where: { id: entry.poolId } });
      if (poolLog) {
        const pool = poolLog.payload as any;
        if (pool.entityType === 'sports_pool') {
          const newPoolPayout = new Prisma.Decimal(pool.totalPayout).plus(payout);
          await (tx as any).fjnOperationLog.update({
            where: { id: entry.poolId },
            data: {
              payload: { ...pool, totalPayout: newPoolPayout.toFixed(SPORTS_ODDS_PRECISION) } as Prisma.InputJsonValue,
            },
          });
        }
      }

      const profit = payout.minus(stake);
      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_SETTLED_WON, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        userId: entry.userId,
        outcome: entry.outcomeSelected,
        payout: payout.toString(),
        profit: profit.toString(),
        payoutTxHash,
        operatorId: input.operatorId,
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.PAYOUT_SENT, {
        entryNo: entry.entryNo,
        userId: entry.userId,
        payout: payout.toString(),
        payoutTxHash,
      });

      this.log('info', `Sports entry won: ${entry.entryNo}`, { payout: payout.toString(), profit: profit.toString() });
      return updated;
    });
  }

  async settleEntryLost(input: SettleEntryLostInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.SETTLED_LOST) return entry;
      if (entry.status !== SPORTS_ENTRY_STATUS.CONFIRMED && entry.status !== SPORTS_ENTRY_STATUS.RISK_HOLD) {
        throw new SportsEntryAlreadySettledError({
          entryNo: entry.entryNo,
          status: entry.status,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: { ...entry, status: SPORTS_ENTRY_STATUS.SETTLED_LOST, settledAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_SETTLED_LOST, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        userId: entry.userId,
        outcome: entry.outcomeSelected,
        payout: '0.0000',
        profit: `-${entry.stake}`,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports entry lost: ${entry.entryNo}`);
      return updated;
    });
  }

  async refundEntry(input: RefundEntryInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.REFUNDED) return entry;
      if (!canTransitSportsEntryStatus(entry.status, SPORTS_ENTRY_STATUS.REFUNDED)) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: SPORTS_ENTRY_STATUS.REFUNDED,
        });
      }

      const stake = new Prisma.Decimal(entry.stake);
      // 链上 refund
      let refundTxHash = '';
      try {
        const onchain = await this.callSolanaSportsPoolRefund(entry.entryNo, entry.userId, stake.toString());
        refundTxHash = onchain.txHash;
      } catch (e) {
        throw new SportsRefundFailedError({
          entryNo: entry.entryNo,
          originalError: (e as Error).message,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: {
            ...entry,
            status: SPORTS_ENTRY_STATUS.REFUNDED,
            refundReason: input.reason,
            refundTxHash,
            settledAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_REFUNDED, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        userId: entry.userId,
        refund: stake.toString(),
        refundTxHash,
        reason: input.reason,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports entry refunded: ${entry.entryNo}`, { reason: input.reason });
      return updated;
    });
  }

  async voidEntry(input: VoidEntryInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status === SPORTS_ENTRY_STATUS.VOIDED) return entry;
      if (!canTransitSportsEntryStatus(entry.status, SPORTS_ENTRY_STATUS.VOIDED)) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: SPORTS_ENTRY_STATUS.VOIDED,
        });
      }

      // 流局时自动退款
      const stake = new Prisma.Decimal(entry.stake);
      let refundTxHash = '';
      try {
        const onchain = await this.callSolanaSportsPoolRefund(entry.entryNo, entry.userId, stake.toString());
        refundTxHash = onchain.txHash;
      } catch (e) {
        throw new SportsRefundFailedError({
          entryNo: entry.entryNo,
          originalError: (e as Error).message,
          stage: 'void',
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: {
            ...entry,
            status: SPORTS_ENTRY_STATUS.VOIDED,
            voidReason: input.reason,
            refundTxHash,
            settledAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await this.emitEvent(tx, SPORTS_POOL_EVENTS.ENTRY_VOIDED, {
        entryId: input.entryId,
        entryNo: entry.entryNo,
        userId: entry.userId,
        reason: input.reason,
        refund: stake.toString(),
        refundTxHash,
        operatorId: input.operatorId,
      });

      this.log('info', `Sports entry voided: ${entry.entryNo}`, { reason: input.reason });
      return updated;
    });
  }

  async holdEntry(input: HoldEntryInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (!canTransitSportsEntryStatus(entry.status, SPORTS_ENTRY_STATUS.RISK_HOLD)) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: SPORTS_ENTRY_STATUS.RISK_HOLD,
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: {
            ...entry,
            status: SPORTS_ENTRY_STATUS.RISK_HOLD,
            riskHoldReason: input.reason,
            riskHoldAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      this.log('warn', `Sports entry hold: ${entry.entryNo}`, { reason: input.reason });
      return updated;
    });
  }

  async releaseHold(input: ReleaseHoldInput) {
    if (!input.entryId) throw new SportsEntryNotFoundError();
    return this.withTransaction(async (tx) => {
      const log = await (tx as any).fjnOperationLog.findUnique({ where: { id: input.entryId } });
      if (!log) throw new SportsEntryNotFoundError({ entryId: input.entryId });
      const entry = log.payload as any;
      if (entry.entityType !== 'sports_entry') {
        throw new SportsEntryNotFoundError({ entryId: input.entryId });
      }
      if (entry.status !== SPORTS_ENTRY_STATUS.RISK_HOLD) {
        throw new SportsEntryStatusInvalidError({
          entryNo: entry.entryNo,
          from: entry.status,
          to: 'release_hold',
        });
      }

      const updated = await (tx as any).fjnOperationLog.update({
        where: { id: input.entryId },
        data: {
          payload: {
            ...entry,
            status: SPORTS_ENTRY_STATUS.CONFIRMED,
            riskHoldReason: null,
            riskReleasedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      this.log('info', `Sports entry hold released: ${entry.entryNo}`);
      return updated;
    });
  }

  // ==========================================================
  // 3.5 统计 + 查询
  // ==========================================================

  async getPool(poolId: string) {
    if (!poolId) throw new SportsPoolNotFoundError();
    const log = await (this.prisma as any).fjnOperationLog.findUnique({ where: { id: poolId } });
    if (!log) throw new SportsPoolNotFoundError({ poolId });
    const pool = log.payload as any;
    if (pool.entityType !== 'sports_pool') {
      throw new SportsPoolNotFoundError({ poolId });
    }
    return pool as SportsPoolSummary & { id: string; createdAt: Date; updatedAt: Date };
  }

  async listPools(input: ListSportsPoolsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {
      payload: { path: ['entityType'], equals: 'sports_pool' },
    };
    if (input.status) {
      where.payload = { ...where.payload, path: ['status'], equals: input.status };
    }
    if (input.category) {
      where.payload = { ...where.payload, path: ['category'], equals: input.category };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnOperationLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => log.payload as SportsPoolSummary & { id: string }),
      total,
      page,
      pageSize,
    };
  }

  async listEvents(input: ListSportsEventsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {
      payload: { path: ['entityType'], equals: 'sports_event' },
    };
    if (input.poolId) where.refId = input.poolId;
    if (input.category) {
      where.payload = { ...where.payload, path: ['category'], equals: input.category };
    }
    if (input.status) {
      where.payload = { ...where.payload, path: ['status'], equals: input.status };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnOperationLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => ({ id: log.id, ...(log.payload as any) })) as Array<SportsEventSummary & { id: string }>,
      total,
      page,
      pageSize,
    };
  }

  async listMarkets(input: ListSportsMarketsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {
      payload: { path: ['entityType'], equals: 'sports_market' },
    };
    if (input.eventId) where.refId = input.eventId;
    if (input.status) {
      where.payload = { ...where.payload, path: ['status'], equals: input.status };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnOperationLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => ({ id: log.id, ...(log.payload as any) })) as Array<SportsMarketSummary & { id: string }>,
      total,
      page,
      pageSize,
    };
  }

  async listEntries(input: ListSportsEntriesInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {
      payload: { path: ['entityType'], equals: 'sports_entry' },
    };
    if (input.marketId) where.refId = input.marketId;
    if (input.userId) {
      where.payload = { ...where.payload, path: ['userId'], equals: input.userId };
    }
    if (input.poolId) {
      where.payload = { ...where.payload, path: ['poolId'], equals: input.poolId };
    }
    if (input.status) {
      where.payload = { ...where.payload, path: ['status'], equals: input.status };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).fjnOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fjnOperationLog.count({ where }),
    ]);

    return {
      items: items.map((log: any) => ({ id: log.id, ...(log.payload as any) })) as Array<SportsEntrySummary & { id: string }>,
      total,
      page,
      pageSize,
    };
  }
}

// 工厂函数
export function createFjnSportsPoolService(options: FjnServiceOptions = {}) {
  return new FjnSportsPoolService(options);
}
