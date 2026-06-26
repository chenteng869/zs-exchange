/**
 * 资金结算器
 *
 * 处理成交的资金变动：
 *  - 买：扣 quote (debit)，入 base (credit)
 *  - 卖：扣 base (debit)，入 quote (credit)
 *  - 手续费：taker 付 takerFee，maker 付 makerFee
 *  - 默认手续费从"收到的币种"中扣除（spot 常见）
 *
 * 余额来源：调用方传入 Freezer
 *
 * 注意：本实现在发生错误时尽量回滚已应用的变动（基于已记录的 deltas），
 * 在生产环境应替换为数据库事务。
 */

import type { ID, MatchResult, Order, TradingPair, Decimal } from '@/types/models';
import {
  decAdd,
  decCmp,
  decIsPositive,
  decMul,
  decSub,
  decTruncate,
  decIsZero,
} from '@/lib/matching/decimal';
import { Freezer } from './freeze';
import { SettlementError } from '@/lib/matching/errors';

export interface SettleMatchInput {
  result: MatchResult;
  /** taker 订单 */
  taker: Order;
  /** maker 订单 */
  maker: Order;
  pair: TradingPair;
}

export interface SettleMatchResult {
  buyerUserId: ID;
  sellerUserId: ID;
  baseAsset: string;
  quoteAsset: string;
  price: Decimal;
  quantity: Decimal;
  quoteQty: Decimal;
  takerFee: Decimal;
  makerFee: Decimal;
  takerFeeAsset: string;
  makerFeeAsset: string;
}

export class Settler {
  constructor(private freezer: Freezer) {}

  /**
   * 结算一笔撮合成交。
   *  - 买/卖对手方：taker 始终是主动吃单方，maker 是挂单方
   *  - taker.side === 'buy'：taker 买，maker 卖
   *  - taker.side === 'sell'：taker 卖，maker 买
   *
   * 错误时回滚已应用的资金变动。
   */
  settleMatch(input: SettleMatchInput): SettleMatchResult {
    const { result, taker, maker, pair } = input;
    if (!decIsPositive(result.quantity)) {
      throw new SettlementError('NEGATIVE_BALANCE', 'result.quantity must be > 0');
    }

    const isTakerBuy = taker.side === 'buy';
    const buyerId = isTakerBuy ? taker.userId : maker.userId;
    const sellerId = isTakerBuy ? maker.userId : taker.userId;

    const baseAsset = pair.baseAsset;
    const quoteAsset = pair.quoteAsset;
    const quoteQty = result.quantity && result.price
      ? decTruncate(decMul(result.price, result.quantity), 8)
      : '0';

    // 记录已经应用的变更以便回滚
    const applied: Array<() => void> = [];
    const safeApply = (fn: () => void) => {
      try {
        fn();
      } catch (e) {
        // 回滚已应用
        for (let i = applied.length - 1; i >= 0; i--) {
          try {
            applied[i]();
          } catch {
            // 忽略回滚异常
          }
        }
        throw e;
      }
    };

    // 1) 买方付 quote：先从 frozen 扣减（如果有），不足用 available
    const buyerFreezerBal = this.freezer.getBalance(buyerId, quoteAsset);
    const useFrozen = decCmp(buyerFreezerBal.frozen, quoteQty) >= 0;
    safeApply(() => {
      if (useFrozen) {
        this.freezer.consumeFromFrozen(buyerId, quoteAsset, quoteQty, result.takerOrderId, 'settle:buy quote');
      } else {
        // 部分由 available 直接扣
        const remain = decSub(quoteQty, buyerFreezerBal.frozen);
        if (!decIsZero(buyerFreezerBal.frozen)) {
          this.freezer.consumeFromFrozen(buyerId, quoteAsset, buyerFreezerBal.frozen, result.takerOrderId, 'settle:buy quote(frozen)');
        }
        this.freezer.debit(buyerId, quoteAsset, remain, 'TRADE_BUY', result.takerOrderId, 'settle:buy quote(avail)');
      }
      applied.push(() => {
        // 回滚：返还 quote
        this.freezer.credit(buyerId, quoteAsset, quoteQty, 'ADJUST', result.takerOrderId, 'rollback buy quote');
      });
    });

    // 2) 卖方付 base：从 frozen 扣减（必须有）
    safeApply(() => {
      this.freezer.consumeFromFrozen(sellerId, baseAsset, result.quantity, result.makerOrderId, 'settle:sell base');
      applied.push(() => {
        this.freezer.credit(sellerId, baseAsset, result.quantity, 'ADJUST', result.makerOrderId, 'rollback sell base');
      });
    });

    // 3) 买方入 base：credit base - takerFee
    //    taker 手续费从 base 扣（taker 买时，takerFeeAsset = base）
    const takerFeeAsset = isTakerBuy ? baseAsset : quoteAsset;
    const takerReceives = isTakerBuy
      ? decSub(result.quantity, result.takerFee)
      : decSub(quoteQty, result.takerFee);
    safeApply(() => {
      if (isTakerBuy) {
        // 买方入 base - takerFee
        this.freezer.credit(buyerId, baseAsset, result.quantity, 'TRADE_BUY', result.takerOrderId, 'taker base in');
        if (decIsPositive(result.takerFee)) {
          this.freezer.debit(buyerId, baseAsset, result.takerFee, 'FEE', result.takerOrderId, 'taker fee');
        }
        applied.push(() => {
          this.freezer.debit(buyerId, baseAsset, takerReceives, 'ADJUST', result.takerOrderId, 'rollback taker base');
        });
      } else {
        // 卖方（taker）入 quote - takerFee
        this.freezer.credit(sellerId, quoteAsset, quoteQty, 'TRADE_SELL', result.takerOrderId, 'taker quote in');
        if (decIsPositive(result.takerFee)) {
          this.freezer.debit(sellerId, quoteAsset, result.takerFee, 'FEE', result.takerOrderId, 'taker fee');
        }
        applied.push(() => {
          this.freezer.debit(sellerId, quoteAsset, takerReceives, 'ADJUST', result.takerOrderId, 'rollback taker quote');
        });
      }
    });

    // 4) 对手方入对应币种 - makerFee
    const makerFeeAsset = isTakerBuy ? quoteAsset : baseAsset;
    safeApply(() => {
      if (isTakerBuy) {
        // maker 卖：maker 入 quote - makerFee
        this.freezer.credit(sellerId, quoteAsset, quoteQty, 'TRADE_SELL', result.makerOrderId, 'maker quote in');
        if (decIsPositive(result.makerFee)) {
          this.freezer.debit(sellerId, quoteAsset, result.makerFee, 'FEE', result.makerOrderId, 'maker fee');
        }
        applied.push(() => {
          const makerReceives = decSub(quoteQty, result.makerFee);
          this.freezer.debit(sellerId, quoteAsset, makerReceives, 'ADJUST', result.makerOrderId, 'rollback maker quote');
        });
      } else {
        // maker 买：maker 入 base - makerFee
        this.freezer.credit(buyerId, baseAsset, result.quantity, 'TRADE_BUY', result.makerOrderId, 'maker base in');
        if (decIsPositive(result.makerFee)) {
          this.freezer.debit(buyerId, baseAsset, result.makerFee, 'FEE', result.makerOrderId, 'maker fee');
        }
        applied.push(() => {
          const makerReceives = decSub(result.quantity, result.makerFee);
          this.freezer.debit(buyerId, baseAsset, makerReceives, 'ADJUST', result.makerOrderId, 'rollback maker base');
        });
      }
    });

    return {
      buyerUserId: buyerId,
      sellerUserId: sellerId,
      baseAsset,
      quoteAsset,
      price: result.price,
      quantity: result.quantity,
      quoteQty,
      takerFee: result.takerFee,
      makerFee: result.makerFee,
      takerFeeAsset,
      makerFeeAsset,
    };
  }
}
