/**
 * 永续合约保证金 / 风险计算器
 *
 * 覆盖：
 *  - 初始保证金（隔离 / 跨仓）
 *  - 维持保证金
 *  - 未实现盈亏
 *  - 强平价
 *  - 保证金率
 *  - 标记价（中位数）
 *  - 资金费率（premium + interest，带 ±0.05% 内部夹紧、±0.75% 外部夹紧）
 *
 * 所有金额输出为 string 复用 src/lib/matching/decimal.ts，规避浮点精度问题。
 */

import {
  decAbs,
  decAdd,
  decDiv,
  decMul,
  decSub,
  decCmp,
  decMax,
  decMin,
  decTruncate,
} from '@/lib/matching/decimal';
import type {
  Contract,
  MarginMode,
  Side,
} from './types';

// ============================================================================
// 工具
// ============================================================================

/** 限制数值到 [min, max] 区间（按 decimal 字符串） */
function clamp(value: string, min: string, max: string): string {
  if (decCmp(value, min) < 0) return min;
  if (decCmp(value, max) > 0) return max;
  return value;
}

/** 计算 1/leverage（保留 18 位精度，再截断到 10 位） */
function invLeverage(leverage: number): string {
  if (leverage <= 0) {
    throw new Error('leverage must be > 0');
  }
  return decTruncate(decDiv('1', String(leverage), 18), 10);
}

/** 三个数取中位数（标记价计算核心） */
function median3(a: string, b: string, c: string): string {
  const values = [a, b, c].sort((x, y) => decCmp(x, y));
  return values[1];
}

// ============================================================================
// 保证金计算
// ============================================================================

export class MarginCalculator {
  /**
   * 初始保证金
   *  - 隔离：notional / leverage
   *  - 跨仓：notional * imr（用合约配置的 initialMarginRate）
   */
  calculateInitialMargin(
    notional: string,
    leverage: number,
    mode: MarginMode,
    contract: Contract
  ): string {
    if (decCmp(notional, '0') <= 0) {
      throw new Error('notional must be > 0');
    }
    if (leverage <= 0 || leverage > contract.maxLeverage) {
      throw new Error(`leverage out of range (1..${contract.maxLeverage})`);
    }
    if (mode === 'isolated') {
      return decTruncate(decDiv(notional, String(leverage), 18), 8);
    }
    // cross: 仍按 IM 比例计算
    const imr = String(contract.initialMarginRate);
    return decTruncate(decMul(notional, imr), 8);
  }

  /**
   * 维持保证金 = notional * mmr
   */
  calculateMaintenanceMargin(notional: string, contract: Contract): string {
    if (decCmp(notional, '0') <= 0) {
      throw new Error('notional must be > 0');
    }
    const mmr = String(contract.maintenanceMarginRate);
    return decTruncate(decMul(notional, mmr), 8);
  }

  /**
   * 未实现盈亏
   *  - long:  (mark - entry) * size
   *  - short: (entry - mark) * size
   */
  calculateUnrealizedPnl(
    side: Side,
    size: string,
    entryPrice: string,
    markPrice: string
  ): string {
    if (decCmp(size, '0') <= 0) {
      throw new Error('size must be > 0');
    }
    if (decCmp(entryPrice, '0') <= 0 || decCmp(markPrice, '0') <= 0) {
      throw new Error('prices must be > 0');
    }
    const diff =
      side === 'long'
        ? decSub(markPrice, entryPrice)
        : decSub(entryPrice, markPrice);
    return decTruncate(decMul(diff, size), 8);
  }

  /**
   * 强平价（隔离模式，简化公式）
   *  - long:  entry * (1 - 1/leverage + mmr)
   *  - short: entry * (1 + 1/leverage - mmr)
   * 跨仓模式 mmr = 0（用户全部余额作为保证金，强平由总账户保证金率触发）
   */
  calculateLiquidationPrice(
    side: Side,
    entryPrice: string,
    leverage: number,
    mmr: number,
    marginMode: MarginMode = 'isolated'
  ): string {
    if (decCmp(entryPrice, '0') <= 0) {
      throw new Error('entryPrice must be > 0');
    }
    if (leverage <= 0) {
      throw new Error('leverage must be > 0');
    }
    const inv = invLeverage(leverage);
    const mmrStr = marginMode === 'cross' ? '0' : String(mmr);
    const one = '1';
    // factor = 1 -/+ inv + mmr
    const factor =
      side === 'long'
        ? decAdd(decSub(one, inv), mmrStr)
        : decSub(decAdd(one, inv), mmrStr);
    // 防御：极端 leverage 下 factor 可能 ≤ 0
    if (decCmp(factor, '0') <= 0) {
      return '0';
    }
    return decTruncate(decMul(entryPrice, factor), 8);
  }

  /**
   * 保证金率 = (margin + unrealizedPnl) / positionValue
   * 用于判断是否触发强平 / 追加保证金
   */
  calculateMarginRatio(
    margin: string,
    unrealizedPnl: string,
    positionValue: string
  ): string {
    if (decCmp(positionValue, '0') <= 0) {
      return '0';
    }
    const equity = decAdd(margin, unrealizedPnl);
    return decTruncate(decDiv(equity, positionValue, 18), 8);
  }

  /**
   * 标记价 = median(index, last, funding)
   *  - funding 价 = index + 8h funding 预期成本
   *  - 这里 fundingBasis 是直接的 funding impact price
   */
  calculateMarkPrice(
    lastPrice: string,
    indexPrice: string,
    fundingBasis: string
  ): string {
    return median3(lastPrice, indexPrice, fundingBasis);
  }

  /**
   * 资金费率
   *  funding = clamp(premiumIndex + clamp(interestRate - premiumIndex, -0.05%, 0.05%), -cap, +cap)
   *  premiumIndex = (markPrice - indexPrice) / indexPrice
   *
   *  - markPrice === indexPrice：funding = clamp(interestRate, ±0.05%, ±cap)
   *  - 否则按 premium + interest 加权
   */
  calculateFundingRate(
    markPrice: string,
    indexPrice: string,
    interestRate: number,
    premiumIndex?: string,
    cap: number = 0.0075
  ): string {
    if (decCmp(markPrice, '0') <= 0 || decCmp(indexPrice, '0') <= 0) {
      throw new Error('prices must be > 0');
    }
    if (cap <= 0) throw new Error('cap must be > 0');

    // 1. premium = (mark - index) / index
    const pi =
      premiumIndex !== undefined
        ? premiumIndex
        : decTruncate(
            decDiv(decSub(markPrice, indexPrice), indexPrice, 18),
            8
          );

    // 2. 内部夹紧: interestRate - pi, 限 ±0.05%
    const inner = decSub(String(interestRate), pi);
    const innerClamped = clamp(inner, '-0.0005', '0.0005');

    // 3. funding = pi + innerClamped
    const raw = decAdd(pi, innerClamped);

    // 4. 外部夹紧: ±cap
    const capStr = String(cap);
    return clamp(raw, decMul('-1', capStr), capStr);
  }

  /**
   * 名义价值 = size * price
   */
  calculateNotional(size: string, price: string): string {
    return decTruncate(decMul(size, price), 8);
  }

  /**
   * 根据收益率排序（高→低）— ADL 排名用
   */
  rankByProfitability(
    items: Array<{ pnlRate: string; leverage: number; id: string }>
  ): string[] {
    return items
      .slice()
      .sort((a, b) => {
        // score = leverage * (pnlRate + 1)
        const sa = a.leverage * (Number(a.pnlRate) + 1);
        const sb = b.leverage * (Number(b.pnlRate) + 1);
        return sb - sa;
      })
      .map((x) => x.id);
  }

  /**
   * 加权平均开仓价（仅用于文档化计算）
   *  newEntry = (oldSize * oldEntry + newSize * newPrice) / (oldSize + newSize)
   */
  calculateWeightedEntryPrice(
    oldSize: string,
    oldEntry: string,
    newSize: string,
    newPrice: string
  ): string {
    const totalSize = decAdd(oldSize, newSize);
    if (decCmp(totalSize, '0') <= 0) {
      throw new Error('total size must be > 0');
    }
    const oldNotional = decMul(oldSize, oldEntry);
    const newNotional = decMul(newSize, newPrice);
    const avg = decDiv(decAdd(oldNotional, newNotional), totalSize, 18);
    return decTruncate(avg, 8);
  }

  /**
   * 简单 clamp 工具（暴露给其他模块）
   */
  static clamp(value: string, min: string, max: string): string {
    return clamp(value, min, max);
  }

  static decMin(a: string, b: string): string {
    return decMin(a, b);
  }

  static decMax(a: string, b: string): string {
    return decMax(a, b);
  }

  static decAbs(a: string): string {
    return decAbs(a);
  }

  /**
   * 破产价（与强平价计算逻辑相同，此处作为兼容别名）
   * bankruptcyPrice = liquidationPrice when mmr=0
   */
  calculateBankruptcyPrice(
    side: Side,
    entryPrice: string,
    leverage: number,
    mmr: number = 0,
    marginMode: MarginMode = 'isolated'
  ): string {
    return this.calculateLiquidationPrice(side, entryPrice, leverage, mmr, marginMode);
  }
}
