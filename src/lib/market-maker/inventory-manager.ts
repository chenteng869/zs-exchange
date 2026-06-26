/**
 * 做市商库存管理 (InventoryManager)
 *
 * 功能：
 *  - 跟踪每交易对库存
 *  - 风险控制：检查库存是否超限
 *  - 倾斜计算：calculateSkew
 *  - 调仓计划：rebalancePlan
 *  - 风控事件：onInventoryAlert
 *
 * 设计要点：
 *  - baseAmount 正=多头，负=空头
 *  - skew = baseAmount / maxInventory，范围 [-1, 1]
 *  - 触发线：|baseAmount| / maxInventory > MM_INVENTORY_LIMIT_PCT (0.8)
 *    - 库存 > 80% 上限 → 减少买盘（让 ask 倾斜出货）
 *    - 库存 < -80% 上限 → 减少卖盘（让 bid 倾斜吸货）
 */

import { EventEmitter } from 'events';
import {
  decAbs,
  decAdd,
  decCmp,
  decGte,
  decIsNegative,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
} from '@/lib/matching/decimal';
import {
  type Inventory,
  type InventoryAlert,
  type Unsubscribe,
  MM_INVENTORY_LIMIT_PCT,
} from './types';

export interface RebalancePlan {
  /** 目标买入量 (base) - 正数 */
  buyAmount: string;
  /** 目标卖出量 (base) - 正数 */
  sellAmount: string;
  /** 调仓方向：'increase_long' / 'increase_short' / 'balanced' */
  action: 'increase_long' | 'increase_short' | 'balanced';
  /** 目标库存 */
  targetInventory: string;
  /** 偏离量 (base) */
  delta: string;
}

export class InventoryManager {
  private readonly emitter = new EventEmitter();

  /** marketMakerId::symbol -> Inventory */
  private readonly inventories = new Map<string, Inventory>();

  // -------------------------------------------------------------------------
  // 库存维护
  // -------------------------------------------------------------------------

  /**
   * 记录 / 更新库存。
   * 当成交发生时，调用本接口同步内部状态。
   */
  updateInventory(snapshot: Omit<Inventory, 'updatedAt' | 'inventoryValue' | 'skew'>): Inventory {
    const key = this.keyOf(snapshot.marketMakerId, snapshot.symbol);
    const prev = this.inventories.get(key);
    const midPrice = decCmp(snapshot.midPrice, '0') > 0
      ? snapshot.midPrice
      : (prev?.midPrice ?? '0');
    const inventoryValue = decMul(snapshot.baseAmount, midPrice);
    const skew = this.calculateSkew(snapshot.baseAmount, snapshot.targetInventory);

    const inv: Inventory = {
      ...snapshot,
      midPrice,
      inventoryValue,
      skew,
      updatedAt: Date.now(),
    };
    this.inventories.set(key, inv);

    // 风控检查
    this.checkAndAlert(inv);
    return inv;
  }

  /** 获取库存。 */
  getInventory(marketMakerId: string, symbol: string): Inventory | null {
    return this.inventories.get(this.keyOf(marketMakerId, symbol)) ?? null;
  }

  /** 列出某做市商的所有库存。 */
  listInventories(marketMakerId: string): Inventory[] {
    const out: Inventory[] = [];
    for (const inv of this.inventories.values()) {
      if (inv.marketMakerId === marketMakerId) out.push(inv);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 风险控制
  // -------------------------------------------------------------------------

  /**
   * 检查库存是否超限。
   *  - 库存超 80% 上限  -> warning
   *  - 库存超 95% 上限  -> critical
   */
  checkInventoryLimit(
    inventory: Inventory,
    limitPct: number = MM_INVENTORY_LIMIT_PCT,
  ): { ok: boolean; reason?: string; level?: 'warning' | 'critical' } {
    const absBase = decAbs(inventory.baseAmount);
    if (decIsZero(inventory.targetInventory)) {
      return { ok: true };
    }
    const ratio = parseFloat(absBase) / parseFloat(inventory.targetInventory);
    if (ratio > 0.95) {
      return { ok: false, level: 'critical', reason: `inventory at ${(ratio * 100).toFixed(1)}% of target` };
    }
    if (ratio > limitPct) {
      return { ok: false, level: 'warning', reason: `inventory at ${(ratio * 100).toFixed(1)}% of target` };
    }
    return { ok: true };
  }

  /**
   * 计算 skew（偏离度）。
   *  - baseAmount / targetInventory，结果 ∈ (-∞, +∞)，但一般 [-1, 1]
   *  - 0 表示正好等于目标库存
   */
  calculateSkew(baseAmount: string, targetInventory: string): number {
    if (decIsZero(targetInventory)) return 0;
    return parseFloat(baseAmount) / parseFloat(targetInventory);
  }

  /**
   * 调仓计划。
   *  - 如果库存偏离目标 -> 给出买卖量建议
   *  - 库存 > target -> sell
   *  - 库存 < target -> buy
   *  - 否则 -> balanced
   */
  rebalancePlan(inventory: Inventory, target: string = inventory.targetInventory): RebalancePlan {
    if (decIsZero(target)) {
      return { buyAmount: '0', sellAmount: '0', action: 'balanced', targetInventory: '0', delta: '0' };
    }
    const delta = decSub(target, inventory.baseAmount);
    if (decIsZero(delta)) {
      return { buyAmount: '0', sellAmount: '0', action: 'balanced', targetInventory: target, delta: '0' };
    }
    if (decIsPositive(delta)) {
      // 库存不足，需要买入
      return { buyAmount: decAbs(delta), sellAmount: '0', action: 'increase_long', targetInventory: target, delta };
    }
    // 库存过多，需要卖出
    return { buyAmount: '0', sellAmount: decAbs(delta), action: 'increase_short', targetInventory: target, delta };
  }

  // -------------------------------------------------------------------------
  // 风控事件
  // -------------------------------------------------------------------------

  onInventoryAlert(handler: (alert: InventoryAlert) => void): Unsubscribe {
    this.emitter.on('inventoryAlert', handler);
    return () => this.emitter.off('inventoryAlert', handler);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private keyOf(marketMakerId: string, symbol: string): string {
    return `${marketMakerId}::${symbol}`;
  }

  private checkAndAlert(inv: Inventory) {
    const result = this.checkInventoryLimit(inv);
    if (!result.ok) {
      const alert: InventoryAlert = {
        marketMakerId: inv.marketMakerId,
        symbol: inv.symbol,
        level: result.level ?? 'warning',
        message: result.reason ?? 'inventory over limit',
        inventory: inv,
        timestamp: Date.now(),
      };
      try {
        this.emitter.emit('inventoryAlert', alert);
      } catch {
        // 静默
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 工具函数
// -----------------------------------------------------------------------------

/**
 * 判断是否需要减少买盘。
 *  - 库存 > 80% 上限 → true（多单过多，少买）
 */
export function shouldReduceBuy(inventory: Inventory, limitPct: number = MM_INVENTORY_LIMIT_PCT): boolean {
  if (decIsNegative(inventory.baseAmount)) return false;
  const ratio = parseFloat(inventory.baseAmount) / parseFloat(inventory.targetInventory || '1');
  return ratio > limitPct;
}

/**
 * 判断是否需要减少卖盘。
 *  - 库存 < -80% 上限 → true（空头过多，少卖）
 */
export function shouldReduceSell(inventory: Inventory, limitPct: number = MM_INVENTORY_LIMIT_PCT): boolean {
  if (decIsPositive(inventory.baseAmount)) return false;
  const absBase = decAbs(inventory.baseAmount);
  const ratio = parseFloat(absBase) / parseFloat(inventory.targetInventory || '1');
  return ratio > limitPct;
}
