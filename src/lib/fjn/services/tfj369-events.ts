/**
 * tFJ369 Service - 事件定义
 *
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §8.1
 */

export const TFJ369_EVENTS = {
  // Account
  TFJ369_ACCOUNT_OPENED: 'tfj369.account.opened',
  TFJ369_ACCOUNT_FROZEN: 'tfj369.account.frozen',
  TFJ369_ACCOUNT_UNFROZEN: 'tfj369.account.unfrozen',
  TFJ369_ACCOUNT_CLOSED: 'tfj369.account.closed',
  // Ledger
  TFJ369_MINTED: 'tfj369.minted',
  TFJ369_BURNED: 'tfj369.burned',
  TFJ369_TRANSFERRED: 'tfj369.transferred',
  // Conversion
  TFJ369_CONVERSION_REQUESTED: 'tfj369.conversion.requested',
  TFJ369_CONVERSION_APPROVED: 'tfj369.conversion.approved',
  TFJ369_CONVERSION_EXECUTED: 'tfj369.conversion.executed',
  TFJ369_CONVERSION_FAILED: 'tfj369.conversion.failed',
  // Lock
  TFJ369_LOCKED: 'tfj369.locked',
  TFJ369_UNLOCKED: 'tfj369.unlocked',
} as const;

export const TFJ369_EVENT_SOURCES = {
  TFJ369_SERVICE: 'tfj369_service',
  CONVERSION_SERVICE: 'conversion_service',
  ADMIN: 'admin',
  SOLANA_INDEXER: 'solana_indexer',
} as const;

export type FjnTfj369Event = (typeof TFJ369_EVENTS)[keyof typeof TFJ369_EVENTS];
export type FjnTfj369EventSource = (typeof TFJ369_EVENT_SOURCES)[keyof typeof TFJ369_EVENT_SOURCES];

export interface Tfj369AccountOpenedPayload {
  userId: string;
  accountId: string;
  openedAt: string;
}
export interface Tfj369MintedPayload {
  userId: string;
  amount: string;
  sourceType: string;
  sourceId?: string;
  txHash?: string;
  mintAddress?: string;
}
export interface Tfj369ConversionRequestedPayload {
  conversionNo: string;
  userId: string;
  cfj369Amount: string;
  tFJ369Net: string;
  memberLevel: string;
}
export interface Tfj369LockedPayload {
  lockId: string;
  userId: string;
  amount: string;
  lockType: string;
  sourceType?: string;
  sourceId?: string;
}
export type FjnTfj369EventPayload =
  | Tfj369AccountOpenedPayload
  | Tfj369MintedPayload
  | Tfj369ConversionRequestedPayload
  | Tfj369LockedPayload
  | Record<string, unknown>;
