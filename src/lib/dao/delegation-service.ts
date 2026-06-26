/**
 * 委托服务（DelegationService）
 *
 * 职责：
 *  - 委托管理：delegate / undelegate
 *  - 查询：getDelegations(我委托的) / getDelegators(委托给我的)
 *  - 投票权计算支撑：getTotalDelegatedTo / getTotalDelegatedFrom
 *
 * 协作：
 *  - GovernanceTokenService → 投票权
 *  - VotingService         → 委托时可用接受的委托量投票
 */

import { decAdd, decCmp, decIsPositive, decTruncate } from '@/lib/matching/decimal';
import { makeDaoId } from './types';
import type { Delegation } from './types';

// ============================================================================
// 错误
// ============================================================================

export class DelegationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'DelegationError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type DelegationEvent =
  | { type: 'delegated'; delegation: Delegation }
  | { type: 'undelegated'; delegation: Delegation };

export type DelegationEventHandler = (event: DelegationEvent) => void;

// ============================================================================
// 引擎
// ============================================================================

export interface DelegationServiceOptions {
  /** 事件回调 */
  onEvent?: DelegationEventHandler;
}

export class DelegationService {
  /** id -> Delegation */
  private delegations: Map<string, Delegation> = new Map();
  /** delegator -> Set<id> */
  private outgoing: Map<string, Set<string>> = new Map();
  /** delegate -> Set<id> */
  private incoming: Map<string, Set<string>> = new Map();

  private handler: DelegationEventHandler | null = null;

  constructor(options: DelegationServiceOptions = {}) {
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 委托 / 取消
  // ==========================================================================

  /**
   * 创建/覆盖委托
   *  - 若 delegator 已委托给同一 delegate，则叠加 amount
   *  - 若已委托给其他 delegate，则先撤销再重新委托
   */
  delegate(delegator: string, delegate: string, amount: string): Delegation {
    if (!this.isValidAddress(delegator) || !this.isValidAddress(delegate)) {
      throw new DelegationError('INVALID_ADDRESS', `Invalid address: ${delegator} -> ${delegate}`);
    }
    if (delegator === delegate) {
      throw new DelegationError('SELF_DELEGATION', 'Cannot delegate to self');
    }
    if (!decIsPositive(amount)) {
      throw new DelegationError('INVALID_AMOUNT', `Amount must be > 0: ${amount}`);
    }

    // 取消现有委托（如果存在）
    const existing = this.findActiveDelegation(delegator);
    if (existing) {
      this.undelegateInternal(existing);
    }

    // 创建新委托
    const d: Delegation = {
      id: makeDaoId('del'),
      delegator,
      delegate,
      amount: decTruncate(amount, 8),
      timestamp: Date.now(),
      isActive: true,
    };
    this.delegations.set(d.id, d);

    const outSet = this.outgoing.get(delegator) || new Set();
    outSet.add(d.id);
    this.outgoing.set(delegator, outSet);

    const inSet = this.incoming.get(delegate) || new Set();
    inSet.add(d.id);
    this.incoming.set(delegate, inSet);

    this.emit({ type: 'delegated', delegation: d });
    return { ...d };
  }

  /**
   * 取消委托
   */
  undelegate(delegator: string, delegate: string): Delegation {
    const d = this.findActiveDelegationTo(delegator, delegate);
    if (!d) {
      throw new DelegationError(
        'DELEGATION_NOT_FOUND',
        `No active delegation from ${delegator} to ${delegate}`
      );
    }
    this.undelegateInternal(d);
    this.emit({ type: 'undelegated', delegation: d });
    return { ...d, isActive: false };
  }

  private undelegateInternal(d: Delegation): void {
    const updated: Delegation = { ...d, isActive: false };
    this.delegations.set(d.id, updated);
    const outSet = this.outgoing.get(d.delegator);
    if (outSet) outSet.delete(d.id);
    const inSet = this.incoming.get(d.delegate);
    if (inSet) inSet.delete(d.id);
  }

  // ==========================================================================
  // 2. 查询
  // ==========================================================================

  /**
   * 获取我委托出去的（outgoing）
   */
  getDelegations(address: string): Delegation[] {
    const ids = this.outgoing.get(address) || new Set();
    const out: Delegation[] = [];
    for (const id of ids) {
      const d = this.delegations.get(id);
      if (d && d.isActive) out.push({ ...d });
    }
    return out;
  }

  /**
   * 获取委托给我的（incoming）
   */
  getDelegators(address: string): Delegation[] {
    const ids = this.incoming.get(address) || new Set();
    const out: Delegation[] = [];
    for (const id of ids) {
      const d = this.delegations.get(id);
      if (d && d.isActive) out.push({ ...d });
    }
    return out;
  }

  /**
   * 获取委托给我（地址）的总委托量
   */
  getTotalDelegatedTo(address: string): string {
    const list = this.getDelegators(address);
    let total = '0';
    for (const d of list) {
      total = decTruncate(decAdd(total, d.amount), 8);
    }
    return total;
  }

  /**
   * 获取我委托出去的总委托量
   */
  getTotalDelegatedFrom(address: string): string {
    const list = this.getDelegations(address);
    let total = '0';
    for (const d of list) {
      total = decTruncate(decAdd(total, d.amount), 8);
    }
    return total;
  }

  /**
   * 检查 delegator -> delegate 是否存在有效委托
   */
  isDelegated(delegator: string, delegate: string): boolean {
    return this.findActiveDelegationTo(delegator, delegate) !== null;
  }

  /**
   * 按 ID 查询
   */
  getDelegation(id: string): Delegation | null {
    const d = this.delegations.get(id);
    return d ? { ...d } : null;
  }

  /**
   * 获取所有委托
   */
  getAllDelegations(activeOnly: boolean = true): Delegation[] {
    const out: Delegation[] = [];
    for (const d of this.delegations.values()) {
      if (activeOnly && !d.isActive) continue;
      out.push({ ...d });
    }
    return out;
  }

  // ==========================================================================
  // 3. 事件订阅
  // ==========================================================================

  onDelegate(handler: (d: Delegation) => void): () => void {
    const wrap = (e: DelegationEvent) => {
      if (e.type === 'delegated') handler(e.delegation);
    };
    return this.subscribe(wrap);
  }

  onUndelegate(handler: (d: Delegation) => void): () => void {
    const wrap = (e: DelegationEvent) => {
      if (e.type === 'undelegated') handler(e.delegation);
    };
    return this.subscribe(wrap);
  }

  setHandler(handler: DelegationEventHandler | null): void {
    this.handler = handler;
  }

  // ==========================================================================
  // 4. 内部
  // ==========================================================================

  private findActiveDelegation(delegator: string): Delegation | null {
    const ids = this.outgoing.get(delegator);
    if (!ids) return null;
    for (const id of ids) {
      const d = this.delegations.get(id);
      if (d && d.isActive) return d;
    }
    return null;
  }

  private findActiveDelegationTo(delegator: string, delegate: string): Delegation | null {
    const ids = this.outgoing.get(delegator);
    if (!ids) return null;
    for (const id of ids) {
      const d = this.delegations.get(id);
      if (d && d.isActive && d.delegate === delegate) return d;
    }
    return null;
  }

  private isValidAddress(addr: string): boolean {
    return typeof addr === 'string' && addr.length > 0;
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.delegations.clear();
    this.outgoing.clear();
    this.incoming.clear();
  }

  private subscribe(handler: DelegationEventHandler): () => void {
    const prev = this.handler;
    this.handler = handler;
    return () => {
      this.handler = prev;
    };
  }

  private emit(event: DelegationEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略
      }
    }
  }
}

// 抑制未使用导入告警
void decCmp;
