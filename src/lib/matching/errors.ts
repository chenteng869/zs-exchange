/**
 * 撮合引擎 / 结算 / 交易的统一错误类型
 *
 * - OrderError: 订单层错误（参数、余额、KYC、撤单等）
 * - MatchingError: 撮合引擎内部错误
 * - SettlementError: 结算错误（余额不足、原子性失败等）
 */

export type OrderErrorCode =
  | 'INVALID_PRICE'
  | 'INVALID_QUANTITY'
  | 'INVALID_SYMBOL'
  | 'INSUFFICIENT_BALANCE'
  | 'PAIR_HALTED'
  | 'PAIR_NOT_FOUND'
  | 'BELOW_MIN_QUANTITY'
  | 'ABOVE_MAX_QUANTITY'
  | 'PRICE_PRECISION'
  | 'QUANTITY_PRECISION'
  | 'KYC_RESTRICTED'
  | 'SELF_TRADE'
  | 'ORDER_NOT_FOUND'
  | 'ORDER_NOT_OWNED'
  | 'ORDER_NOT_CANCELLABLE'
  | 'FOK_CANNOT_FILL'
  | 'MARKET_NOT_ALLOWED'
  | 'STOP_ORDER_INVALID'
  | 'EXPIRED';

export class OrderError extends Error {
  code: OrderErrorCode;
  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
  }
}

export type MatchingErrorCode =
  | 'EMPTY_ORDERBOOK'
  | 'INTERNAL_STATE'
  | 'INVALID_SIDE'
  | 'PRICE_LEVEL_NOT_FOUND';

export class MatchingError extends Error {
  code: MatchingErrorCode;
  constructor(code: MatchingErrorCode, message: string) {
    super(message);
    this.name = 'MatchingError';
    this.code = code;
  }
}

export type SettlementErrorCode =
  | 'INSUFFICIENT_AVAILABLE'
  | 'INSUFFICIENT_FROZEN'
  | 'NEGATIVE_BALANCE'
  | 'ATOMICITY_FAILED'
  | 'UNKNOWN_ASSET';

export class SettlementError extends Error {
  code: SettlementErrorCode;
  constructor(code: SettlementErrorCode, message: string) {
    super(message);
    this.name = 'SettlementError';
    this.code = code;
  }
}
