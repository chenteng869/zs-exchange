/**
 * PriceLockService — 锁价服务
 *
 * 职责：
 *  - 价格锁定（避免滑点）
 *  - 锁价查询 / 释放
 *  - 价格偏离监控（normal / warning / critical）
 *  - 偏离阈值触发的告警 / 重新报价提示
 *
 * 偏离等级：
 *  - normal   : < 0.5%        正常
 *  - warning  : 0.5% - 1%     报警
 *  - critical : >= 1%         强制重新报价
 *
 * 用法：
 *   const svc = new PriceLockService();
 *   const { lockId, expiresAt } = svc.lockPrice('trade_1', '68000', 600);
 *   svc.isLocked('trade_1');           // true
 *   const r = svc.checkPriceDeviation('trade_1', '68500');
 *   // r.deviation = 0.0073, level = 'warning'
 */

import type {
  PriceDeviationResult,
  PriceLock,
} from './types';
import {
  OTC_PRICE_DEVIATION_CRITICAL,
  OTC_PRICE_DEVIATION_WARNING,
  OTC_PRICE_LOCK_DURATION_SEC,
  calcPriceDeviation,
} from './types';

export interface LockResult {
  lockId: string;
  expiresAt: number;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export class PriceLockService {
  /** tradeId -> PriceLock */
  private readonly locks = new Map<string, PriceLock>();
  /** lockId -> tradeId（用于按 lockId 反查） */
  private readonly lockIndex = new Map<string, string>();

  private readonly defaultDurationSec: number;
  private readonly warningThreshold: number;
  private readonly criticalThreshold: number;

  private readonly deviationHandlers: Set<(tradeId: string, result: PriceDeviationResult) => void> = new Set();

  constructor(opts: {
    defaultDurationSec?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
  } = {}) {
    this.defaultDurationSec = opts.defaultDurationSec ?? OTC_PRICE_LOCK_DURATION_SEC;
    this.warningThreshold = opts.warningThreshold ?? OTC_PRICE_DEVIATION_WARNING;
    this.criticalThreshold = opts.criticalThreshold ?? OTC_PRICE_DEVIATION_CRITICAL;
  }

  // -------------------------------------------------------------------------
  // 锁价
  // -------------------------------------------------------------------------

  /**
   * 锁定价格。
   *  - durationSec: 锁价时长（秒），默认 10 分钟
   *  - 返回 { lockId, expiresAt }
   *  - 如果已有锁 → 抛错（先 release）
   */
  lockPrice(tradeId: string, price: string, durationSec?: number): LockResult {
    if (!tradeId) throw new Error('tradeId is required');
    if (this.locks.has(tradeId)) {
      throw new Error(`price already locked for trade ${tradeId}`);
    }
    const dur = (durationSec ?? this.defaultDurationSec) * 1000;
    const now = Date.now();
    const lockId = genId('lk');
    const lock: PriceLock = {
      lockId,
      tradeId,
      price,
      expiresAt: now + dur,
      createdAt: now,
    };
    this.locks.set(tradeId, lock);
    this.lockIndex.set(lockId, tradeId);
    return { lockId, expiresAt: lock.expiresAt };
  }

  /**
   * 查询锁价。
   */
  getLockedPrice(tradeId: string): string | null {
    const lock = this.locks.get(tradeId);
    if (!lock) return null;
    if (lock.expiresAt <= Date.now()) {
      // 已过期
      this.locks.delete(tradeId);
      this.lockIndex.delete(lock.lockId);
      return null;
    }
    return lock.price;
  }

  /**
   * 查询锁价记录（完整）。
   */
  getLock(tradeId: string): PriceLock | null {
    const lock = this.locks.get(tradeId);
    if (!lock) return null;
    if (lock.expiresAt <= Date.now()) {
      this.locks.delete(tradeId);
      this.lockIndex.delete(lock.lockId);
      return null;
    }
    return { ...lock };
  }

  /**
   * 是否处于锁价状态（且未过期）。
   */
  isLocked(tradeId: string): boolean {
    return this.getLockedPrice(tradeId) !== null;
  }

  /**
   * 释放锁价。
   */
  releaseLock(tradeId: string): void {
    const lock = this.locks.get(tradeId);
    if (lock) {
      this.locks.delete(tradeId);
      this.lockIndex.delete(lock.lockId);
    }
  }

  /**
   * 强制刷新锁价（用于锁价延长或重新锁定）。
   */
  refreshLock(tradeId: string, price: string, durationSec?: number): LockResult {
    this.releaseLock(tradeId);
    return this.lockPrice(tradeId, price, durationSec);
  }

  // -------------------------------------------------------------------------
  // 偏离监控
  // -------------------------------------------------------------------------

  /**
   * 检查价格偏离。
   *  - 当前价 vs 锁定价
   *  - 偏离 < 0.5%         → normal
   *  - 偏离 0.5% ~ 1%     → warning（建议告警）
   *  - 偏离 >= 1%          → critical（强制重新报价）
   */
  checkPriceDeviation(tradeId: string, currentPrice: string): PriceDeviationResult {
    const lock = this.getLock(tradeId);
    if (!lock) {
      return {
        deviation: 0,
        level: 'normal',
        shouldSettle: false,
        shouldRequote: false,
        message: 'no active price lock',
      };
    }
    const deviation = calcPriceDeviation(lock.price, currentPrice);
    let level: PriceDeviationResult['level'] = 'normal';
    let shouldSettle = true;
    let shouldRequote = false;
    let message: string | undefined;

    if (deviation >= this.criticalThreshold) {
      level = 'critical';
      shouldSettle = false;
      shouldRequote = true;
      message = `price deviation ${(deviation * 100).toFixed(3)}% exceeds critical threshold ${(this.criticalThreshold * 100).toFixed(2)}%`;
    } else if (deviation >= this.warningThreshold) {
      level = 'warning';
      shouldSettle = true;
      message = `price deviation ${(deviation * 100).toFixed(3)}% exceeds warning threshold ${(this.warningThreshold * 100).toFixed(2)}%`;
    } else {
      level = 'normal';
      message = `price deviation ${(deviation * 100).toFixed(3)}% within tolerance`;
    }

    const result: PriceDeviationResult = {
      deviation,
      level,
      shouldSettle,
      shouldRequote,
      message,
    };

    // 触发偏离 handler
    if (level === 'warning' || level === 'critical') {
      for (const h of this.deviationHandlers) {
        try { h(tradeId, result); } catch { /* 静默 */ }
      }
    }
    return result;
  }

  /**
   * 订阅偏离事件。
   */
  onDeviation(handler: (tradeId: string, result: PriceDeviationResult) => void): () => void {
    this.deviationHandlers.add(handler);
    return () => this.deviationHandlers.delete(handler);
  }

  // -------------------------------------------------------------------------
  // 维护
  // -------------------------------------------------------------------------

  /**
   * 清理所有过期锁。
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [tradeId, lock] of this.locks) {
      if (lock.expiresAt <= now) {
        this.locks.delete(tradeId);
        this.lockIndex.delete(lock.lockId);
        cleaned += 1;
      }
    }
    return cleaned;
  }

  size(): number {
    return this.locks.size;
  }
}

export default PriceLockService;
