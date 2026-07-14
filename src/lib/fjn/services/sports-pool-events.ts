/**
 * Sports Pool Service - 事件定义
 *
 * 工业级 Solana-first 架构
 */

export const SPORTS_POOL_EVENTS = {
  POOL_CREATED: 'sports.pool.created',
  POOL_LOCKED: 'sports.pool.locked',
  POOL_SETTLED: 'sports.pool.settled',
  POOL_CLOSED: 'sports.pool.closed',
  POOL_CANCELLED: 'sports.pool.cancelled',
  EVENT_CREATED: 'sports.event.created',
  EVENT_OPENED: 'sports.event.opened',
  EVENT_LIVE: 'sports.event.live',
  EVENT_CLOSED: 'sports.event.closed',
  EVENT_SETTLED: 'sports.event.settled',
  EVENT_CANCELLED: 'sports.event.cancelled',
  MARKET_CREATED: 'sports.market.created',
  MARKET_OPENED: 'sports.market.opened',
  MARKET_LOCKED: 'sports.market.locked',
  MARKET_SETTLED: 'sports.market.settled',
  MARKET_CANCELLED: 'sports.market.cancelled',
  MARKET_VOIDED: 'sports.market.voided',
  ENTRY_PLACED: 'sports.entry.placed',
  ENTRY_PAID: 'sports.entry.paid',
  ENTRY_CONFIRMED: 'sports.entry.confirmed',
  ENTRY_SETTLED_WON: 'sports.entry.settled_won',
  ENTRY_SETTLED_LOST: 'sports.entry.settled_lost',
  ENTRY_REFUNDED: 'sports.entry.refunded',
  ENTRY_VOIDED: 'sports.entry.voided',
  PAYOUT_SENT: 'sports.payout.sent',
  ORACLE_RESULT_PUBLISHED: 'sports.oracle.result_published',
  COMPLIANCE_PASSED: 'sports.compliance.passed',
  COMPLIANCE_FAILED: 'sports.compliance.failed',
} as const;

export const SPORTS_POOL_EVENT_SOURCES = {
  SPORTS_POOL_SERVICE: 'sports_pool_service',
  SPORTS_ENGINE: 'sports_engine',
  ORACLE: 'oracle',
  ADMIN: 'admin',
  PLAYER: 'player',
  COMPLIANCE_SERVICE: 'sports_compliance_service',
  RISK_SERVICE: 'risk_service',
  SETTLEMENT_WORKER: 'settlement_worker',
} as const;

export type FjnSportsPoolEvent =
  (typeof SPORTS_POOL_EVENTS)[keyof typeof SPORTS_POOL_EVENTS];

export type FjnSportsPoolEventSource =
  (typeof SPORTS_POOL_EVENT_SOURCES)[keyof typeof SPORTS_POOL_EVENT_SOURCES];

export interface SportsPoolCreatedPayload {
  poolId: string;
  poolNo: string;
  poolName: string;
  poolType: string;
  category: string;
}

export interface SportsEventSettledPayload {
  eventId: string;
  eventNo: string;
  outcome: string;
  homeScore: number;
  awayScore: number;
  oracleTxHash?: string;
}

export interface SportsEntryPlacedPayload {
  entryId: string;
  entryNo: string;
  poolId: string;
  marketId: string;
  userId: string;
  stake: string;
  paymentMethod: string;
  outcomeSelected: string;
  odds: string;
  complianceCheckId?: string;
}

export interface SportsEntrySettledPayload {
  entryId: string;
  entryNo: string;
  userId: string;
  outcome: string;
  payout: string;
  profit: string;
  payoutTxHash?: string;
}

export type FjnSportsPoolEventPayload =
  | SportsPoolCreatedPayload
  | SportsEventSettledPayload
  | SportsEntryPlacedPayload
  | SportsEntrySettledPayload
  | Record<string, unknown>;
