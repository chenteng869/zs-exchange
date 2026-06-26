/**
 * 投票服务（VotingService）
 *
 * 职责：
 *  - 投票：castVote / castVoteWithSignature
 *  - 统计：getVoteStats
 *  - 多种投票权重模型：token_weighted / one_person_one_vote / quadratic / conviction
 *
 * 协作：
 *  - GovernanceTokenService → 投票权
 *  - ProposalService       → 校验提案状态
 */

import { decAdd, decCmp, decTruncate } from '@/lib/matching/decimal';
import {
  DAO_CONVICTION_WINDOW_DAYS,
  DAO_QUADRATIC_COEFFICIENT,
  makeDaoId,
} from './types';
import type { ID, Vote, VoteOption, VoteStats, VotingModel } from './types';

// ============================================================================
// 错误
// ============================================================================

export class VoteError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'VoteError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type VoteEvent =
  | { type: 'vote_cast'; vote: Vote }
  | { type: 'vote_changed'; oldVote: Vote; newVote: Vote };

export type VoteEventHandler = (event: VoteEvent) => void;

// ============================================================================
// 依赖接口
// ============================================================================

export interface ProposalStateLookup {
  /** 提案是否处于 active 状态 */
  isActive(id: ID): boolean;
  /** 获取提案的投票模型 */
  getVotingModel(id: ID): VotingModel;
}

class NullProposalState implements ProposalStateLookup {
  isActive(): boolean {
    return true;
  }
  getVotingModel(): VotingModel {
    return 'token_weighted';
  }
}

// ============================================================================
// 引擎
// ============================================================================

export interface VotingServiceOptions {
  proposalState?: ProposalStateLookup;
  onEvent?: VoteEventHandler;
  /** conviction 模型的最大时间窗口（天） */
  convictionWindowDays?: number;
}

export interface CastVoteOptions {
  proposalId: ID;
  voter: string;
  voterUserId: ID;
  option: VoteOption;
  weight: string;
  reason?: string;
  txHash?: string;
}

export interface CastVoteSignatureOptions extends CastVoteOptions {
  /** 离线签名（演示：占位字符串） */
  signature: string;
}

export class VotingService {
  private state: ProposalStateLookup;
  private handler: VoteEventHandler | null = null;
  private convictionWindowDays: number;

  /** id -> Vote */
  private votes: Map<ID, Vote> = new Map();
  /** proposalId -> Set<voteId> */
  private proposalVotes: Map<ID, Set<ID>> = new Map();
  /** voter -> Set<voteId> */
  private voterVotes: Map<string, Set<ID>> = new Map();
  /** proposalId -> voter -> Vote（用于去重） */
  private proposalVoter: Map<ID, Map<string, ID>> = new Map();

  constructor(options: VotingServiceOptions = {}) {
    this.state = options.proposalState || new NullProposalState();
    this.handler = options.onEvent || null;
    this.convictionWindowDays = options.convictionWindowDays ?? DAO_CONVICTION_WINDOW_DAYS;
  }

  // ==========================================================================
  // 1. 投票
  // ==========================================================================

  /**
   * 投票
   *  - 提案必须 active
   *  - 同一人对同一提案只能投一次（再次投票视为改票）
   */
  castVote(opts: CastVoteOptions): Vote {
    if (!opts.voter || !opts.voterUserId) {
      throw new VoteError('INVALID_VOTER', 'voter and voterUserId are required');
    }
    if (!this.state.isActive(opts.proposalId)) {
      throw new VoteError(
        'PROPOSAL_NOT_ACTIVE',
        `Proposal ${opts.proposalId} is not active`
      );
    }
    if (this.isValidOption(opts.option) === false) {
      throw new VoteError('INVALID_OPTION', `Invalid option: ${opts.option}`);
    }
    const w = decTruncate(opts.weight, 8);
    if (decCmp(w, '0') <= 0) {
      throw new VoteError('INVALID_WEIGHT', `Weight must be > 0: ${w}`);
    }

    // 检查改票
    const existing = this.findVoteByVoter(opts.proposalId, opts.voter);
    if (existing) {
      const updated: Vote = {
        ...existing,
        option: opts.option,
        weight: w,
        reason: opts.reason,
        txHash: opts.txHash,
        timestamp: Date.now(),
      };
      this.votes.set(existing.id, updated);
      this.emit({ type: 'vote_changed', oldVote: existing, newVote: updated });
      return { ...updated };
    }

    const vote: Vote = {
      id: makeDaoId('vote'),
      proposalId: opts.proposalId,
      voter: opts.voter,
      voterUserId: opts.voterUserId,
      option: opts.option,
      weight: w,
      reason: opts.reason,
      txHash: opts.txHash,
      timestamp: Date.now(),
    };
    this.votes.set(vote.id, vote);

    // 索引
    const pSet = this.proposalVotes.get(vote.proposalId) || new Set();
    pSet.add(vote.id);
    this.proposalVotes.set(vote.proposalId, pSet);

    const vSet = this.voterVotes.get(vote.voter) || new Set();
    vSet.add(vote.id);
    this.voterVotes.set(vote.voter, vSet);

    const pvMap = this.proposalVoter.get(vote.proposalId) || new Map();
    pvMap.set(vote.voter, vote.id);
    this.proposalVoter.set(vote.proposalId, pvMap);

    this.emit({ type: 'vote_cast', vote: { ...vote } });
    return { ...vote };
  }

  /**
   * 离线签名投票
   *  - 在生产环境会用 EIP-712 验证签名
   *  - 演示环境：仅做占位
   */
  castVoteWithSignature(opts: CastVoteSignatureOptions): Vote {
    if (!opts.signature || opts.signature.length === 0) {
      throw new VoteError('INVALID_SIGNATURE', 'signature is required');
    }
    // 演示：仅作为 txHash 的别名写入
    const txHash = opts.txHash || `sig_${opts.signature.slice(0, 16)}`;
    return this.castVote({ ...opts, txHash });
  }

  // ==========================================================================
  // 2. 投票权重模型
  // ==========================================================================

  /**
   * Token Weighted：weight = votingPower
   */
  tokenWeighted(vote: Vote, power: string): string {
    void vote;
    return decTruncate(power, 8);
  }

  /**
   * One Person One Vote：weight = 1
   */
  onePersonOneVote(vote: Vote, power: string): string {
    void power;
    void vote;
    return '1';
  }

  /**
   * Quadratic：weight = sqrt(power) * coefficient
   *  - 防止大户垄断
   */
  quadratic(vote: Vote, power: string): string {
    void vote;
    const n = Number(power);
    if (!Number.isFinite(n) || n <= 0) return '0';
    const sqrt = Math.sqrt(n) * DAO_QUADRATIC_COEFFICIENT;
    return decTruncate(sqrt.toString(), 8);
  }

  /**
   * Conviction：weight = power * min(time / decay, 1)
   *  - 持续投票时间越长权重越高
   *  - decay = convictionWindowDays 天
   *  - 上限为 DAO_CONVICTION_MAX
   */
  conviction(vote: Vote, power: string, timeHeldMs: number): string {
    const n = Number(power);
    if (!Number.isFinite(n) || n <= 0) return '0';
    const decayMs = this.convictionWindowDays * 24 * 3600 * 1000;
    const factor = Math.min(Math.max(timeHeldMs / decayMs, 0), 1);
    const value = n * factor;
    void vote;
    return decTruncate(value.toString(), 8);
  }

  // ==========================================================================
  // 3. 查询
  // ==========================================================================

  getVote(proposalId: ID, voter: string): Vote | null {
    const id = this.findVoteByVoter(proposalId, voter);
    if (!id) return null;
    return { ...id };
  }

  getVoteById(id: ID): Vote | null {
    const v = this.votes.get(id);
    return v ? { ...v } : null;
  }

  getProposalVotes(proposalId: ID, limit?: number): Vote[] {
    const ids = this.proposalVotes.get(proposalId) || new Set();
    const out: Vote[] = [];
    for (const id of ids) {
      const v = this.votes.get(id);
      if (v) out.push({ ...v });
    }
    out.sort((a, b) => b.weight.localeCompare(a.weight, undefined, { numeric: true }));
    return limit ? out.slice(0, limit) : out;
  }

  getVoterHistory(voter: string): Vote[] {
    const ids = this.voterVotes.get(voter) || new Set();
    const out: Vote[] = [];
    for (const id of ids) {
      const v = this.votes.get(id);
      if (v) out.push({ ...v });
    }
    out.sort((a, b) => b.timestamp - a.timestamp);
    return out;
  }

  getVoteStats(proposalId: ID): VoteStats {
    const votes = this.getProposalVotes(proposalId);
    const totalVoters = votes.length;

    const distribution: Record<VoteOption, { count: number; weight: string }> = {
      for: { count: 0, weight: '0' },
      against: { count: 0, weight: '0' },
      abstain: { count: 0, weight: '0' },
    };
    let total = '0';
    const weightNums: number[] = [];
    const top: { address: string; weight: string; option: VoteOption }[] = [];

    for (const v of votes) {
      const w = Number(v.weight);
      weightNums.push(w);
      total = decTruncate(decAdd(total, v.weight), 8);
      distribution[v.option].count += 1;
      distribution[v.option].weight = decTruncate(
        decAdd(distribution[v.option].weight, v.weight),
        8
      );
      top.push({ address: v.voter, weight: v.weight, option: v.option });
    }
    top.sort((a, b) => Number(b.weight) - Number(a.weight));

    // participation：使用投票人数 / 持币人数 的估算（演示：使用 sqrt(voters) 作为粗略估计）
    const participation = totalVoters > 0 ? Math.min(1, Math.sqrt(totalVoters) / 100) : 0;

    return {
      proposalId,
      totalVoters,
      totalWeight: total,
      participation,
      topVoters: top.slice(0, 10),
      distribution,
    };
  }

  /**
   * 获取提案累计（for / against / abstain）
   *  - 供 ProposalService 在 finalize 时使用
   */
  getTotals(proposalId: ID): { for: string; against: string; abstain: string; voters: number } {
    const stats = this.getVoteStats(proposalId);
    return {
      for: stats.distribution.for.weight,
      against: stats.distribution.against.weight,
      abstain: stats.distribution.abstain.weight,
      voters: stats.totalVoters,
    };
  }

  // ==========================================================================
  // 4. 事件订阅
  // ==========================================================================

  onVoteCast(handler: (vote: Vote) => void): () => void {
    const wrap = (e: VoteEvent) => {
      if (e.type === 'vote_cast') handler(e.vote);
    };
    this.handler = wrap;
    return () => {
      this.handler = null;
    };
  }

  setHandler(handler: VoteEventHandler | null): void {
    this.handler = handler;
  }

  // ==========================================================================
  // 5. 内部
  // ==========================================================================

  setProposalState(state: ProposalStateLookup): void {
    this.state = state;
  }

  private isValidOption(opt: string): boolean {
    return opt === 'for' || opt === 'against' || opt === 'abstain';
  }

  private findVoteByVoter(proposalId: ID, voter: string): Vote | null {
    const m = this.proposalVoter.get(proposalId);
    if (!m) return null;
    const id = m.get(voter);
    if (!id) return null;
    const v = this.votes.get(id);
    return v ? { ...v } : null;
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.votes.clear();
    this.proposalVotes.clear();
    this.voterVotes.clear();
    this.proposalVoter.clear();
  }

  private emit(event: VoteEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略
      }
    }
  }
}
