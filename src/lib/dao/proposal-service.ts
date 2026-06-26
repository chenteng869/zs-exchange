/**
 * 提案服务（ProposalService）
 *
 * 状态机：
 *   draft → pending → active → succeeded / defeated
 *                                     ↓
 *                                  queued → executed
 *   任何阶段 → cancelled
 *
 * 校验：
 *   - 提案人需要 ≥ 1,000 SMY
 *   - 投票结束后法定票数满足且通过率 > 50% 才算 succeeded
 *   - 任何人都不能执行未通过的提案
 *
 * 协作：
 *   - GovernanceTokenService → 提案门槛、quorum 计算
 *   - VotingService         → 投票累计
 *   - DaoEngine             → 顶层业务流
 */

import {
  decCmp,
  decGte,
  decGt,
  decIsPositive,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  DAO_PROPOSAL_THRESHOLD_VOTE,
  DAO_TIMELOCK_DELAY_BLOCKS,
  DAO_VOTING_PERIOD_BLOCKS,
  makeDaoId,
} from './types';
import type {
  ID,
  Proposal,
  ProposalStatus,
  ProposalType,
  VotingModel,
} from './types';

// ============================================================================
// 错误
// ============================================================================

export class ProposalError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProposalError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type ProposalEvent =
  | { type: 'created'; proposal: Proposal }
  | { type: 'activated'; proposal: Proposal }
  | { type: 'succeeded'; proposal: Proposal }
  | { type: 'defeated'; proposal: Proposal }
  | { type: 'queued'; proposal: Proposal }
  | { type: 'executed'; proposal: Proposal }
  | { type: 'cancelled'; proposal: Proposal; reason: string };

export type ProposalEventHandler = (event: ProposalEvent) => void;

// ============================================================================
// 依赖接口（解耦）
// ============================================================================

/** 投票权查询接口 */
export interface TokenLookup {
  /** 提案人投票权是否足够 */
  meetsProposalThreshold(address: string): boolean;
  /** 法定票数 */
  getQuorum(): string;
}

/** 投票累计查询接口 */
export interface VoteLookup {
  /** 获取提案当前累计 */
  getTotals(proposalId: ID): { for: string; against: string; abstain: string; voters: number };
}

class NullTokenLookup implements TokenLookup {
  meetsProposalThreshold(): boolean {
    return true;
  }
  getQuorum(): string {
    return '0';
  }
}

class NullVoteLookup implements VoteLookup {
  getTotals(): { for: string; against: string; abstain: string; voters: number } {
    return { for: '0', against: '0', abstain: '0', voters: 0 };
  }
}

// ============================================================================
// 引擎
// ============================================================================

export interface ProposalServiceOptions {
  /** 投票期（区块数） */
  votingPeriodBlocks?: number;
  /** 时间锁延迟（区块数） */
  timelockDelayBlocks?: number;
  /** 通过率 */
  threshold?: number;
  /** 当前区块（mock） */
  currentBlock?: number;
  /** 投票权查询 */
  tokenLookup?: TokenLookup;
  /** 投票累计查询 */
  voteLookup?: VoteLookup;
  /** 事件回调 */
  onEvent?: ProposalEventHandler;
}

export interface CreateProposalOptions {
  proposer: string;
  proposerUserId: ID;
  type: ProposalType;
  title: string;
  description: string;
  targets?: string[];
  values?: string[];
  signatures?: string[];
  calldatas?: string[];
  votingModel?: VotingModel;
  startBlock?: number;
  endBlock?: number;
  threshold?: number;
  quorum?: string;
}

export class ProposalService {
  private votingPeriodBlocks: number;
  private timelockDelayBlocks: number;
  private threshold: number;
  private currentBlock: number;
  private tokenLookup: TokenLookup;
  private voteLookup: VoteLookup;
  private handler: ProposalEventHandler | null = null;

  /** id -> Proposal */
  private proposals: Map<ID, Proposal> = new Map();
  private seq = 0;

  constructor(options: ProposalServiceOptions = {}) {
    this.votingPeriodBlocks = options.votingPeriodBlocks ?? DAO_VOTING_PERIOD_BLOCKS;
    this.timelockDelayBlocks = options.timelockDelayBlocks ?? DAO_TIMELOCK_DELAY_BLOCKS;
    this.threshold = options.threshold ?? DAO_PROPOSAL_THRESHOLD_VOTE;
    this.currentBlock = options.currentBlock ?? 1000000;
    this.tokenLookup = options.tokenLookup || new NullTokenLookup();
    this.voteLookup = options.voteLookup || new NullVoteLookup();
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 创建提案
  // ==========================================================================

  /**
   * 创建提案
   *  - 校验提案人投票权
   *  - 默认进入 pending 状态
   *  - 调用 activate() 推进到 active
   */
  createProposal(opts: CreateProposalOptions): Proposal {
    if (!opts.proposer || !opts.proposerUserId) {
      throw new ProposalError('INVALID_PROPOSER', 'proposer and proposerUserId are required');
    }
    if (!opts.title || opts.title.trim().length === 0) {
      throw new ProposalError('INVALID_TITLE', 'title is required');
    }

    // 提案门槛
    if (!this.tokenLookup.meetsProposalThreshold(opts.proposer)) {
      throw new ProposalError(
        'INSUFFICIENT_VOTING_POWER',
        `Proposer ${opts.proposer} does not meet proposal threshold`
      );
    }

    const startBlock = opts.startBlock ?? this.currentBlock + 1;
    const endBlock = opts.endBlock ?? startBlock + this.votingPeriodBlocks;

    this.seq++;
    const proposal: Proposal = {
      id: makeDaoId('prop'),
      proposer: opts.proposer,
      proposerUserId: opts.proposerUserId,
      type: opts.type,
      title: opts.title.trim(),
      description: opts.description || '',
      targets: opts.targets || [],
      values: opts.values || [],
      signatures: opts.signatures || [],
      calldatas: opts.calldatas || [],
      status: 'pending',
      votingModel: opts.votingModel || 'token_weighted',
      startBlock,
      endBlock,
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      quorum: opts.quorum || this.tokenLookup.getQuorum(),
      threshold: opts.threshold ?? this.threshold,
      createdAt: Date.now(),
    };

    this.proposals.set(proposal.id, proposal);
    this.emit({ type: 'created', proposal: { ...proposal } });
    return { ...proposal };
  }

  // ==========================================================================
  // 2. 激活（pending → active）
  // ==========================================================================

  /**
   * 激活提案（通常在投票开始时调用）
   */
  activateProposal(id: ID): Proposal {
    const p = this.getProposalOrThrow(id);
    if (p.status !== 'pending') {
      throw new ProposalError(
        'INVALID_STATUS',
        `Cannot activate from status ${p.status}`
      );
    }
    const updated: Proposal = { ...p, status: 'active' };
    this.proposals.set(id, updated);
    this.emit({ type: 'activated', proposal: { ...updated } });
    return updated;
  }

  // ==========================================================================
  // 3. 取消
  // ==========================================================================

  /**
   * 取消提案（提案人本人或管理员）
   */
  cancelProposal(id: ID, reason: string, opts: { canceller?: string } = {}): Proposal {
    const p = this.getProposalOrThrow(id);
    if (
      p.status === 'executed' ||
      p.status === 'cancelled' ||
      p.status === 'expired'
    ) {
      throw new ProposalError(
        'INVALID_STATUS',
        `Cannot cancel from status ${p.status}`
      );
    }

    // 只有提案人可以取消（演示用：可传 canceller 校验）
    if (opts.canceller && opts.canceller !== p.proposer) {
      throw new ProposalError(
        'NOT_AUTHORIZED',
        `Only proposer ${p.proposer} can cancel, got ${opts.canceller}`
      );
    }

    const now = Date.now();
    const updated: Proposal = {
      ...p,
      status: 'cancelled',
      cancelledAt: now,
    };
    this.proposals.set(id, updated);
    this.emit({ type: 'cancelled', proposal: { ...updated }, reason });
    return updated;
  }

  // ==========================================================================
  // 4. 投票结束处理
  // ==========================================================================

  /**
   * 投票期结束：succeeded / defeated
   *  - succeeded：quorum 满足 且 (for / (for+against)) > threshold
   *  - defeated：未满足
   */
  finalize(id: ID): Proposal {
    const p = this.getProposalOrThrow(id);
    if (p.status !== 'active') {
      throw new ProposalError(
        'INVALID_STATUS',
        `Cannot finalize from status ${p.status}`
      );
    }

    // 拉取最新累计
    const totals = this.voteLookup.getTotals(id);
    const forV = decTruncate(totals.for, 8);
    const againstV = decTruncate(totals.against, 8);
    const abstainV = decTruncate(totals.abstain, 8);

    const total = decTruncate(
      (Number(forV) + Number(againstV) + Number(abstainV)).toString(),
      8
    );
    const nonAbstain = decTruncate(
      (Number(forV) + Number(againstV)).toString(),
      8
    );
    const ratio = Number(nonAbstain) > 0 ? Number(forV) / Number(nonAbstain) : 0;
    const meetsQuorum = decGte(total, p.quorum);
    const meetsThreshold = ratio > p.threshold;

    const status: ProposalStatus =
      meetsQuorum && meetsThreshold ? 'succeeded' : 'defeated';
    const updated: Proposal = {
      ...p,
      forVotes: forV,
      againstVotes: againstV,
      abstainVotes: abstainV,
      status,
    };
    this.proposals.set(id, updated);
    this.emit({
      type: status === 'succeeded' ? 'succeeded' : 'defeated',
      proposal: { ...updated },
    });
    return updated;
  }

  // ==========================================================================
  // 5. 排队 / 执行
  // ==========================================================================

  /**
   * 排队（succeeded → queued）
   *  - 设定 eta = currentBlock + timelockDelayBlocks
   */
  queueProposal(id: ID): Proposal {
    const p = this.getProposalOrThrow(id);
    if (p.status !== 'succeeded') {
      throw new ProposalError(
        'INVALID_STATUS',
        `Cannot queue from status ${p.status} (expected succeeded)`
      );
    }
    const updated: Proposal = {
      ...p,
      status: 'queued',
      eta: Date.now() + this.timelockDelayBlocks * 13.2 * 1000, // ms
    };
    this.proposals.set(id, updated);
    this.emit({ type: 'queued', proposal: { ...updated } });
    return updated;
  }

  /**
   * 执行（queued → executed）
   *  - 需 eta 已到
   *  - 实际执行由业务层完成（这里只更新状态）
   */
  async executeProposal(id: ID): Promise<Proposal> {
    const p = this.getProposalOrThrow(id);
    if (p.status !== 'queued') {
      throw new ProposalError(
        'INVALID_STATUS',
        `Cannot execute from status ${p.status} (expected queued)`
      );
    }
    if (p.eta && Date.now() < p.eta) {
      throw new ProposalError(
        'TIMELOCK_NOT_EXPIRED',
        `Timelock not expired, eta=${p.eta}, now=${Date.now()}`
      );
    }

    // 模拟链上执行
    await this.simulateExecution(p);

    const updated: Proposal = {
      ...p,
      status: 'executed',
      executedAt: Date.now(),
    };
    this.proposals.set(id, updated);
    this.emit({ type: 'executed', proposal: { ...updated } });
    return updated;
  }

  // ==========================================================================
  // 6. 查询
  // ==========================================================================

  getProposal(id: ID): Proposal | null {
    const p = this.proposals.get(id);
    return p ? { ...p } : null;
  }

  getActiveProposals(): Proposal[] {
    const out: Proposal[] = [];
    for (const p of this.proposals.values()) {
      if (p.status === 'active' || p.status === 'pending' || p.status === 'queued') {
        out.push({ ...p });
      }
    }
    return out;
  }

  /**
   * 获取提案列表
   */
  getProposals(opts: { status?: ProposalStatus; proposer?: string; limit?: number } = {}): Proposal[] {
    const out: Proposal[] = [];
    for (const p of this.proposals.values()) {
      if (opts.status && p.status !== opts.status) continue;
      if (opts.proposer && p.proposer !== opts.proposer) continue;
      out.push({ ...p });
    }
    // 按创建时间倒序
    out.sort((a, b) => b.createdAt - a.createdAt);
    return opts.limit ? out.slice(0, opts.limit) : out;
  }

  getProposalsByProposer(proposer: string): Proposal[] {
    return this.getProposals({ proposer });
  }

  // ==========================================================================
  // 7. 注入 / 工具
  // ==========================================================================

  setTokenLookup(lookup: TokenLookup): void {
    this.tokenLookup = lookup;
  }

  setVoteLookup(lookup: VoteLookup): void {
    this.voteLookup = lookup;
  }

  setHandler(handler: ProposalEventHandler | null): void {
    this.handler = handler;
  }

  /** 推进区块（mock） */
  advanceBlocks(n: number): void {
    this.currentBlock += n;
  }

  setCurrentBlock(block: number): void {
    this.currentBlock = block;
  }

  getCurrentBlock(): number {
    return this.currentBlock;
  }

  onProposalCreated(handler: (p: Proposal) => void): () => void {
    const wrap = (e: ProposalEvent) => {
      if (e.type === 'created') handler(e.proposal);
    };
    this.handler = wrap;
    return () => {
      this.handler = null;
    };
  }

  onProposalExecuted(handler: (p: Proposal) => void): () => void {
    const wrap = (e: ProposalEvent) => {
      if (e.type === 'executed') handler(e.proposal);
    };
    this.handler = wrap;
    return () => {
      this.handler = null;
    };
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.proposals.clear();
    this.seq = 0;
  }

  // ==========================================================================
  // 内部
  // ==========================================================================

  private getProposalOrThrow(id: ID): Proposal {
    const p = this.proposals.get(id);
    if (!p) {
      throw new ProposalError('PROPOSAL_NOT_FOUND', `Proposal not found: ${id}`);
    }
    return p;
  }

  /** 模拟链上执行 */
  private async simulateExecution(p: Proposal): Promise<void> {
    // 真实场景下：调用每个 target 的 signature(calldatas[i])，附带 value[i]
    // 演示环境：简单 sleep 10ms 模拟交易上链
    await new Promise((resolve) => setTimeout(resolve, 10));
    void p;
  }

  private emit(event: ProposalEvent): void {
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
void decIsPositive;
void decGt;
void decCmp;
