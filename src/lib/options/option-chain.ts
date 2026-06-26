/**
 * 期权链服务 - 管理按 underlying × expiration × strike × type 组织的期权
 *
 * 主要功能：
 *  - 增删期权
 *  - 一键生成 11 档行权价 × 2 类型（Call/Put）= 22 个期权
 *  - 查询链 / 单期权 / 到期日列表
 */

import { BlackScholes } from './bsm';
import type {
  Option,
  OptionChain,
  OptionTicker,
} from './types';
import {
  DEFAULT_CONTRACT_SIZE,
  OPTION_STRIKE_PCT_RANGE,
  RISK_FREE_RATE,
} from './types';

const bsm = new BlackScholes();

/** 生成期权 ID: BTC-2026-06-27-70000-C */
function buildOptionId(
  underlying: string,
  expirationTime: number,
  strike: number,
  type: 'call' | 'put',
): string {
  const d = new Date(expirationTime);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const k = Math.round(strike);
  return `${underlying}-${y}-${m}-${day}-${k}-${type === 'call' ? 'C' : 'P'}`;
}

export class OptionChainService {
  private options = new Map<string, Option>();
  private underlyingToIds = new Map<string, Set<string>>();

  // -------------------------------------------------------------------------
  // 维护
  // -------------------------------------------------------------------------

  addOption(option: Option): void {
    this.options.set(option.id, option);
    const set = this.underlyingToIds.get(option.underlying) ?? new Set();
    set.add(option.id);
    this.underlyingToIds.set(option.underlying, set);
  }

  removeOption(id: string): void {
    const o = this.options.get(id);
    if (!o) return;
    this.options.delete(id);
    this.underlyingToIds.get(o.underlying)?.delete(id);
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getOption(id: string): Option | null {
    return this.options.get(id) ?? null;
  }

  getAllOptions(underlying?: string): Option[] {
    const all = Array.from(this.options.values());
    if (!underlying) return all;
    return all.filter((o) => o.underlying === underlying);
  }

  getExpirations(underlying: string): number[] {
    const set = this.underlyingToIds.get(underlying);
    if (!set) return [];
    const exp = new Set<number>();
    for (const id of set) {
      const o = this.options.get(id);
      if (o) exp.add(o.expirationTime);
    }
    return Array.from(exp).sort((a, b) => a - b);
  }

  /**
   * 计算 ATM IV（用 strike 最接近 spot 的期权）
   */
  getATMIV(underlying: string, expirationTime: number, spotPrice: number): string {
    const opts = this.getAllOptions(underlying).filter((o) => o.expirationTime === expirationTime);
    if (opts.length === 0) return '0';
    let atm: Option | null = null;
    let minDiff = Infinity;
    for (const o of opts) {
      const diff = Math.abs(parseFloat(o.strikePrice) - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        atm = o;
      }
    }
    if (!atm) return '0';
    // 取该期权的 ticker 的 IV
    const ticker = this.buildTicker(atm, spotPrice);
    return ticker.iv;
  }

  // -------------------------------------------------------------------------
  // 链生成
  // -------------------------------------------------------------------------

  /**
   * 自动生成 11 行权价 × 2 类型 = 22 个期权
   * 默认行权价 = spotPrice × pct
   */
  generateChain(
    underlying: string,
    expirationTime: number,
    spotPrice: number,
    _iv: number,
    strikes?: number[],
  ): Option[] {
    const strikeList = strikes ?? OPTION_STRIKE_PCT_RANGE.map((pct) => spotPrice * pct);
    const created: Option[] = [];
    const listedAt = Date.now();

    for (const strike of strikeList) {
      for (const optionType of ['call', 'put'] as const) {
        const id = buildOptionId(underlying, expirationTime, strike, optionType);
        const o: Option = {
          id,
          underlying,
          quoteAsset: 'USDT',
          optionType,
          exerciseStyle: 'european',
          strikePrice: strike.toFixed(2),
          expirationTime,
          contractSize: DEFAULT_CONTRACT_SIZE,
          settlementType: 'cash',
          status: 'active',
          listedAt,
        };
        this.addOption(o);
        created.push(o);
      }
    }
    return created;
  }

  // -------------------------------------------------------------------------
  // Ticker
  // -------------------------------------------------------------------------

  /**
   * 计算某期权的行情（含 BSM 理论价 + IV）
   */
  buildTicker(option: Option, spotPrice: number, ivHint?: number): OptionTicker {
    const ttm = Math.max(0, (option.expirationTime - Date.now()) / (1000 * 60 * 60 * 24 * 365));
    const vol = ivHint ?? 0.6;
    if (ttm <= 0) {
      // 已到期
      const intrinsic = option.optionType === 'call'
        ? Math.max(spotPrice - parseFloat(option.strikePrice), 0)
        : Math.max(parseFloat(option.strikePrice) - spotPrice, 0);
      return {
        optionId: option.id,
        lastPrice: intrinsic.toFixed(6),
        bidPrice: intrinsic.toFixed(6),
        askPrice: intrinsic.toFixed(6),
        markPrice: intrinsic.toFixed(6),
        iv: '0',
        underlyingPrice: spotPrice.toFixed(2),
        volume24h: '0',
        openInterest: '0',
        change24h: '0',
      };
    }
    const mark = bsm.price(
      { spot: spotPrice, strike: parseFloat(option.strikePrice), timeToExpiry: ttm, riskFreeRate: RISK_FREE_RATE, volatility: vol },
      option.optionType,
    );
    return {
      optionId: option.id,
      lastPrice: mark.toFixed(6),
      bidPrice: (mark * 0.999).toFixed(6),
      askPrice: (mark * 1.001).toFixed(6),
      markPrice: mark.toFixed(6),
      iv: vol.toFixed(4),
      underlyingPrice: spotPrice.toFixed(2),
      volume24h: '0',
      openInterest: '0',
      change24h: '0',
    };
  }

  /**
   * 获取完整期权链
   */
  getChain(underlying: string, expirationTime: number, spotPrice: number, iv: number): OptionChain {
    const opts = this.getAllOptions(underlying)
      .filter((o) => o.expirationTime === expirationTime);
    const calls: OptionTicker[] = [];
    const puts: OptionTicker[] = [];
    for (const o of opts) {
      const t = this.buildTicker(o, spotPrice, iv);
      if (o.optionType === 'call') calls.push(t);
      else puts.push(t);
    }
    calls.sort((a, b) => {
      const oa = this.options.get(a.optionId)!;
      const ob = this.options.get(b.optionId)!;
      return parseFloat(oa.strikePrice) - parseFloat(ob.strikePrice);
    });
    puts.sort((a, b) => {
      const oa = this.options.get(a.optionId)!;
      const ob = this.options.get(b.optionId)!;
      return parseFloat(oa.strikePrice) - parseFloat(ob.strikePrice);
    });
    return {
      underlying,
      expirationTime,
      calls,
      puts,
      spotPrice: spotPrice.toFixed(2),
      iv: iv.toFixed(4),
    };
  }
}

export { buildOptionId };
