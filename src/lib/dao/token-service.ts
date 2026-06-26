/**
 * 治理代币服务（GovernanceTokenService）
 *
 * 职责：
 *  - 代币基础操作：mint / burn / transfer / balanceOf
 *  - 投票权计算：getVotingPower (自身 + 委托)
 *  - 供应管理：getCirculatingSupply / getQuorum
 *
 * 协作：
 *  - DelegationService  →  委托关系
 *  - ProposalService    →  校验提案门槛
 *  - DaoEngine          →  顶层事件分发
 */

import {
  decAdd,
  decCmp,
  decGte,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  DAO_PROPOSAL_THRESHOLD,
  DAO_QUORUM_PERCENT,
  DAO_TOKEN_DECIMALS,
  DAO_TOKEN_NAME,
  DAO_TOKEN_SYMBOL,
} from './types';
import type { GovernanceToken, ID, Member } from './types';

// ============================================================================
// 错误
// ============================================================================

export class TokenError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TokenError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type TokenEvent =
  | { type: 'minted'; to: string; amount: string; totalSupply: string }
  | { type: 'burned'; from: string; amount: string; totalSupply: string }
  | { type: 'transferred'; from: string; to: string; amount: string };

export type TokenEventHandler = (event: TokenEvent) => void;

// ============================================================================
// 委托查询接口（由 DelegationService 注入，解耦）
// ============================================================================

export interface DelegationLookup {
  /** 获取某地址接受的总委托量 */
  getTotalDelegatedTo(address: string): string;
  /** 获取某地址对外委托的总量（默认其余额会减少） */
  getTotalDelegatedFrom(address: string): string;
}

// 默认空实现（未注入时使用）
class NullDelegationLookup implements DelegationLookup {
  getTotalDelegatedTo(): string {
    return '0';
  }
  getTotalDelegatedFrom(): string {
    return '0';
  }
}

// ============================================================================
// 引擎
// ============================================================================

export interface GovernanceTokenServiceOptions {
  /** 初始供应量 */
  initialSupply?: string;
  /** 合约地址（可选） */
  contractAddress?: string;
  /** 委托查询接口 */
  delegationLookup?: DelegationLookup;
  /** 事件回调 */
  onEvent?: TokenEventHandler;
}

export class GovernanceTokenService {
  private token: GovernanceToken;
  /** address -> balance */
  private balances: Map<string, string> = new Map();
  /** userId -> address */
  private userAddresses: Map<ID, string> = new Map();
  /** address -> userId */
  private addressUsers: Map<string, ID> = new Map();
  /** 成员附加信息 */
  private members: Map<string, Member> = new Map();
  private delegationLookup: DelegationLookup;
  private handler: TokenEventHandler | null = null;

  constructor(options: GovernanceTokenServiceOptions = {}) {
    this.token = {
      symbol: DAO_TOKEN_SYMBOL,
      name: DAO_TOKEN_NAME,
      totalSupply: options.initialSupply || '0',
      decimals: DAO_TOKEN_DECIMALS,
      contractAddress: options.contractAddress,
    };
    this.delegationLookup = options.delegationLookup || new NullDelegationLookup();
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 代币基础操作
  // ==========================================================================

  /**
   * 增发代币
   */
  mint(to: string, amount: string): void {
    if (!this.isValidAddress(to)) {
      throw new TokenError('INVALID_ADDRESS', `Invalid address: ${to}`);
    }
    if (!decIsPositive(amount)) {
      throw new TokenError('INVALID_AMOUNT', `Mint amount must be > 0: ${amount}`);
    }

    const current = this.balances.get(to) || '0';
    const next = decTruncate(decAdd(current, amount), 8);
    this.balances.set(to, next);
    this.token.totalSupply = decTruncate(decAdd(this.token.totalSupply, amount), 8);

    this.upsertMember(to, next);

    this.emit({ type: 'minted', to, amount, totalSupply: this.token.totalSupply });
  }

  /**
   * 销毁代币
   */
  burn(from: string, amount: string): void {
    if (!this.isValidAddress(from)) {
      throw new TokenError('INVALID_ADDRESS', `Invalid address: ${from}`);
    }
    if (!decIsPositive(amount)) {
      throw new TokenError('INVALID_AMOUNT', `Burn amount must be > 0: ${amount}`);
    }

    const current = this.balances.get(from) || '0';
    if (decCmp(current, amount) < 0) {
      throw new TokenError(
        'INSUFFICIENT_BALANCE',
        `Balance ${current} < burn ${amount}`
      );
    }

    const next = decTruncate(decSub(current, amount), 8);
    this.balances.set(from, next);
    this.token.totalSupply = decTruncate(decSub(this.token.totalSupply, amount), 8);

    this.upsertMember(from, next);

    this.emit({ type: 'burned', from, amount, totalSupply: this.token.totalSupply });
  }

  /**
   * 转账
   */
  transfer(from: string, to: string, amount: string): void {
    if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
      throw new TokenError('INVALID_ADDRESS', `Invalid address: ${from} -> ${to}`);
    }
    if (!decIsPositive(amount)) {
      throw new TokenError('INVALID_AMOUNT', `Transfer amount must be > 0: ${amount}`);
    }

    const fromBal = this.balances.get(from) || '0';
    if (decCmp(fromBal, amount) < 0) {
      throw new TokenError(
        'INSUFFICIENT_BALANCE',
        `Balance ${fromBal} < transfer ${amount}`
      );
    }

    const toBal = this.balances.get(to) || '0';
    this.balances.set(from, decTruncate(decSub(fromBal, amount), 8));
    this.balances.set(to, decTruncate(decAdd(toBal, amount), 8));

    this.upsertMember(from, this.balances.get(from)!);
    this.upsertMember(to, this.balances.get(to)!);

    this.emit({ type: 'transferred', from, to, amount });
  }

  /**
   * 查询余额
   */
  balanceOf(address: string): string {
    return this.balances.get(address) || '0';
  }

  /**
   * 查询总供应
   */
  totalSupply(): string {
    return this.token.totalSupply;
  }

  /**
   * 获取代币元信息
   */
  getToken(): GovernanceToken {
    return { ...this.token };
  }

  // ==========================================================================
  // 2. 投票权 / 供应
  // ==========================================================================

  /**
   * 获取投票权 = 自身余额 + 接受的委托 - 自身委托出去的
   *  - 为简化模型，假设未委托时 votingPower == balance
   *  - 委托关系由 DelegationService 维护
   */
  getVotingPower(address: string): string {
    const balance = this.balanceOf(address);
    if (decIsZero(balance)) return '0';

    const received = this.delegationLookup.getTotalDelegatedTo(address);
    const delegated = this.delegationLookup.getTotalDelegatedFrom(address);

    // 投票权 = balance + received - delegated
    // 若 balance < delegated，说明已把全部余额+部分接受委托转出，投票权为 0
    const withReceived = decTruncate(decAdd(balance, received), 8);
    const power = decTruncate(decSub(withReceived, delegated), 8);

    if (decCmp(power, '0') < 0) return '0';
    return power;
  }

  /**
   * 流通供应 = 总供应 - 被销毁/锁仓
   *  - 当前模型下，流通供应 == totalSupply
   */
  getCirculatingSupply(): string {
    return this.token.totalSupply;
  }

  /**
   * 法定票数 = 流通供应 * 4%
   */
  getQuorum(): string {
    return decTruncate(
      decMul(this.getCirculatingSupply(), DAO_QUORUM_PERCENT.toString()),
      8
    );
  }

  /**
   * 是否满足提案门槛（默认 ≥ 1,000 SMY）
   */
  meetsProposalThreshold(address: string): boolean {
    const power = this.getVotingPower(address);
    return decGte(power, DAO_PROPOSAL_THRESHOLD);
  }

  // ==========================================================================
  // 3. 成员 / 持有人
  // ==========================================================================

  /**
   * 注册用户地址映射
   */
  registerUser(userId: ID, address: string): void {
    if (!this.isValidAddress(address)) {
      throw new TokenError('INVALID_ADDRESS', `Invalid address: ${address}`);
    }
    this.userAddresses.set(userId, address);
    this.addressUsers.set(address, userId);
    this.upsertMember(address, this.balances.get(address) || '0', userId);
  }

  /**
   * 根据 userId 获取地址
   */
  getAddress(userId: ID): string | null {
    return this.userAddresses.get(userId) || null;
  }

  /**
   * 根据地址获取 userId
   */
  getUserId(address: string): ID | null {
    return this.addressUsers.get(address) || null;
  }

  /**
   * 获取持币人列表
   */
  getHolders(limit?: number): Member[] {
    const list: Member[] = [];
    for (const m of this.members.values()) {
      if (decIsPositive(m.balance)) {
        list.push({ ...m });
      }
    }
    list.sort((a, b) => decCmp(b.votingPower, a.votingPower) * -1);
    return limit ? list.slice(0, limit) : list;
  }

  /**
   * 获取成员
   */
  getMember(address: string): Member | null {
    const m = this.members.get(address);
    return m ? { ...m } : null;
  }

  // ==========================================================================
  // 4. 内部
  // ==========================================================================

  setDelegationLookup(lookup: DelegationLookup): void {
    this.delegationLookup = lookup;
  }

  setHandler(handler: TokenEventHandler | null): void {
    this.handler = handler;
  }

  /** 校验地址（演示用：非空字符串） */
  private isValidAddress(addr: string): boolean {
    return typeof addr === 'string' && addr.length > 0;
  }

  /** 内部：创建或更新成员 */
  private upsertMember(address: string, balance: string, userId?: ID): void {
    const now = Date.now();
    const existing = this.members.get(address);
    const uid = userId || existing?.userId || (address as ID);
    const power = this.getVotingPower(address);
    const received = this.delegationLookup.getTotalDelegatedTo(address);

    const next: Member = existing
      ? {
          ...existing,
          balance,
          votingPower: power,
          delegatedPower: received,
          isActive: true,
        }
      : {
          userId: uid,
          address,
          balance,
          delegatedPower: received,
          votingPower: power,
          proposalsCreated: 0,
          votesParticipated: 0,
          joinedAt: now,
          isActive: true,
        };
    this.members.set(address, next);
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.balances.clear();
    this.members.clear();
    this.userAddresses.clear();
    this.addressUsers.clear();
    this.token.totalSupply = '0';
  }

  private emit(event: TokenEvent): void {
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
void decMul;
