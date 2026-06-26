/**
 * 期权行权 / 结算引擎
 *
 * 价内判定：
 *   Call: spot > strike
 *   Put : spot < strike
 * 平值（ATM）通常不会自动行权（payoff = 0）
 *
 * 行权规则：
 *   European: 仅在到期日（含之后一段时间窗口）可行权
 *   American : 到期前任意时间
 *
 * 结算方式：
 *   cash     : 现金差价结算  payoff = max(S - K, 0) for call, max(K - S, 0) for put
 *   physical : 实物交割      多方以 K 买入/卖出 underlying
 */

import type { Option, Settlement } from './types';

let __settleSeq = 1;
function nextSettleId(): string {
  return `SET-${Date.now().toString(36)}-${(__settleSeq++).toString(36)}`;
}

export class SettlementEngine {
  /**
   * 期权是否可行权
   *   - American：到期前任意时间，价内即可
   *   - European：仅到期日（含 24h 宽限）
   */
  isExercisable(option: Option, currentTime: number, settlementPrice: number): boolean {
    if (option.status !== 'active') return false;
    const inTheMoney = this.isInTheMoney(option, settlementPrice);
    if (!inTheMoney) return false;
    if (option.exerciseStyle === 'american') {
      return currentTime < option.expirationTime;
    }
    // European
    const graceMs = 24 * 60 * 60 * 1000;
    return currentTime >= option.expirationTime && currentTime <= option.expirationTime + graceMs;
  }

  /**
   * 价内判定（不含平值）
   */
  isInTheMoney(option: Option, spotPrice: number): boolean {
    const k = parseFloat(option.strikePrice);
    if (option.optionType === 'call') return spotPrice > k;
    return spotPrice < k;
  }

  /**
   * 行权
   * 注意：单张合约的实际 payoff = 单张内含价值 × 数量 × 合约单位
   */
  exercise(option: Option, quantity: number, settlementPrice: number, userId = 'system'): Settlement {
    if (!this.isInTheMoney(option, settlementPrice)) {
      throw new Error(`[Settlement] option ${option.id} is out of the money at price ${settlementPrice}`);
    }
    if (option.settlementType === 'cash') {
      return this.cashSettlement(option, quantity, settlementPrice, userId);
    }
    return this.physicalSettlement(option, quantity, settlementPrice, userId);
  }

  /**
   * 现金结算
   *  payOff_call = max(S - K, 0)
   *  payOff_put  = max(K - S, 0)
   *  总收益 = 单张 payoff × quantity × contractSize
   */
  cashSettlement(option: Option, quantity: number, settlementPrice: number, userId = 'system'): Settlement {
    const k = parseFloat(option.strikePrice);
    const size = parseFloat(option.contractSize);
    const intrinsic = option.optionType === 'call'
      ? Math.max(settlementPrice - k, 0)
      : Math.max(k - settlementPrice, 0);
    const payoff = intrinsic * quantity * size;
    return {
      id: nextSettleId(),
      optionId: option.id,
      userId,
      quantity,
      settlementType: 'cash',
      payoff: payoff.toFixed(6),
      settlementPrice: settlementPrice.toFixed(6),
      timestamp: Date.now(),
    };
  }

  /**
   * 实物交割
   *  多方 Call：以 K 买入 underlying，付出 quantity × size × K 现金，得到 quantity × size underlying
   *  多方 Put ：以 K 卖出 underlying，付出 quantity × size underlying，得到 quantity × size × K 现金
   *  此处 payoff 字段记录 cashflow 净额：
   *    Call long :  payoff = -quantity × size × K   （需付现金）
   *    Put  long :  payoff = +quantity × size × K   （收到现金）
   *  underlying flow 由上层账户系统处理
   */
  physicalSettlement(option: Option, quantity: number, settlementPrice: number, userId = 'system'): Settlement {
    const k = parseFloat(option.strikePrice);
    const size = parseFloat(option.contractSize);
    const cashFlow = quantity * size * k;
    const payoff = option.optionType === 'call' ? -cashFlow : cashFlow;
    return {
      id: nextSettleId(),
      optionId: option.id,
      userId,
      quantity,
      settlementType: 'physical',
      payoff: payoff.toFixed(6),
      settlementPrice: settlementPrice.toFixed(6),
      timestamp: Date.now(),
    };
  }

  /**
   * 对一组期权进行自动行权（价内期权到期）
   */
  autoExercise(options: Option[], settlementPrice: number, currentTime: number, userId = 'system'): Settlement[] {
    const results: Settlement[] = [];
    for (const o of options) {
      if (this.isExercisable(o, currentTime, settlementPrice)) {
        try {
          results.push(this.exercise(o, 1, settlementPrice, userId));
        } catch {
          // 跳过
        }
      }
    }
    return results;
  }

  /**
   * 计算期权到期收益（payoff 函数）
   * 用于画到期收益图
   */
  expirationPayoff(option: Option, underlyingPrices: number[]): { price: number; long: number; short: number }[] {
    const k = parseFloat(option.strikePrice);
    return underlyingPrices.map((s) => {
      const intrinsic = option.optionType === 'call'
        ? Math.max(s - k, 0)
        : Math.max(k - s, 0);
      return {
        price: s,
        long: intrinsic,                  // long = intrinsic
        short: -intrinsic,                // short = -intrinsic
      };
    });
  }
}
