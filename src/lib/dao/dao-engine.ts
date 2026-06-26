/**
 * DAO 业务主类（DaoEngine）
 *
 * 业务层 + 集成：
 *  - 整合 GovernanceTokenService / DelegationService / ProposalService / VotingService / TreasuryService
 *  - 顶层 API：propose / vote / executeProposal / delegate
 *  - 事件总线：onProposalUpdate / onVoteUpdate / onTreasuryUpdate
 *  - 治理统计：getGovernanceStats
 *
 * 典型用法：
 *   const dao = new DaoEngine({ initialTokenSupply: '1000000' });
 *   dao.mintTo('alice', '5000');
 *   dao.registerUser('u_alice', '0xalice');
 *   const p = dao.propose({ proposer: '0xalice', proposerUserId: 'u_alice', type: 'treasury', title: '...', description: '...' });
 *   dao.activate(p.id);
 *   dao.vote({ proposalId: p.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });
 *   const final = dao.finalize(p.id);
 *   if (final.status === 'succeeded') {
 *     dao.queue(p.id);
 *     await dao.executeProposal(p.id);
 *   }
 */

import { DelegationService } from './delegation-service';
import { ProposalService } from './proposal-service';
import { GovernanceTokenService } from './token-service';
import { TreasuryService } from './treasury-service';
import { VotingService } from './voting-service';
import type {
  ID,
  Proposal,
  ProposalType,
  Treasury,
  Vote,
  VoteOption,
  VotingModel,
} from './types';

// ============================================================================
// 治理统计
// ============================================================================

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  executedProposals: number;
  totalVotes: number;
  totalMembers: number;
  participation: number;
  treasuryValue: string;
  tokenSupply: string;
  circulatingSupply: string;
  quorum: string;
  updatedAt: number;
}

// ============================================================================
// 事件
// ============================================================================

export type DaoEvent =
  | { type: 'proposal_update'; proposal: Proposal }
  | { type: 'vote_update'; vote: Vote; proposalId: ID }
  | { type: 'treasury_update'; treasury: Treasury };

export type DaoEventHandler = (event: DaoEvent) => void;

type Unsub = () => void;

// ============================================================================
// 引擎
// ============================================================================

export interface DaoEngineOptions {
  initialTokenSupply?: string;
  initialTreasuryBalances?: Array<{ asset: string; amount: string }>;
  tokenService?: GovernanceTokenService;
  delegationService?: DelegationService;
  proposalService?: ProposalService;
  votingService?: VotingService;
  treasuryService?: TreasuryService;
}

export interface ProposeOptions {
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
  threshold?: number;
  quorum?: string;
}

export interface VoteOptions {
  proposalId: ID;
  voter: string;
  voterUserId: ID;
  option: VoteOption;
  weight: string;
  reason?: string;
}

export class DaoEngine {
  private token: GovernanceTokenService;
  private delegation: DelegationService;
  private proposal: ProposalService;
  private voting: VotingService;
  private treasury: TreasuryService;
  private handlers: Set<DaoEventHandler> = new Set();

  constructor(options: DaoEngineOptions = {}) {
    // 1. 初始化各子服务
    this.token = options.tokenService || new GovernanceTokenService();
    this.delegation = options.delegationService || new DelegationService();
    this.proposal = options.proposalService || new ProposalService();
    this.voting = options.votingService || new VotingService();
    this.treasury = options.treasuryService || new TreasuryService();

    // 2. 注入交叉依赖
    this.token.setDelegationLookup({
      getTotalDelegatedTo: (addr) => this.delegation.getTotalDelegatedTo(addr),
      getTotalDelegatedFrom: (addr) => this.delegation.getTotalDelegatedFrom(addr),
    });
    this.proposal.setTokenLookup({
      meetsProposalThreshold: (addr) => this.token.meetsProposalThreshold(addr),
      getQuorum: () => this.token.getQuorum(),
    });
    this.proposal.setVoteLookup({
      getTotals: (id) => this.voting.getTotals(id),
    });
    this.voting.setProposalState({
      isActive: (id) => {
        const p = this.proposal.getProposal(id);
        return !!p && p.status === 'active';
      },
      getVotingModel: (id) => {
        const p = this.proposal.getProposal(id);
        return p?.votingModel || 'token_weighted';
      },
    });
    this.treasury.setProposalVerifier({
      isExecuted: (id) => {
        const p = this.proposal.getProposal(id);
        return !!p && p.status === 'executed';
      },
      isPassed: (id) => {
        const p = this.proposal.getProposal(id);
        return !!p && (p.status === 'succeeded' || p.status === 'queued' || p.status === 'executed');
      },
    });

    // 3. 转发事件
    this.proposal.setHandler((e) => {
      if (e.type === 'created' || e.type === 'activated' || e.type === 'succeeded'
          || e.type === 'defeated' || e.type === 'queued' || e.type === 'executed'
          || e.type === 'cancelled') {
        this.emit({ type: 'proposal_update', proposal: e.proposal });
      }
    });
    this.voting.setHandler((e) => {
      if (e.type === 'vote_cast') {
        this.emit({ type: 'vote_update', vote: e.vote, proposalId: e.vote.proposalId });
      } else if (e.type === 'vote_changed') {
        this.emit({ type: 'vote_update', vote: e.newVote, proposalId: e.newVote.proposalId });
      }
    });
    this.treasury.setHandler((e) => {
      if (e.type === 'deposit' || e.type === 'withdraw') {
        this.emit({ type: 'treasury_update', treasury: this.treasury.getTreasury() });
      }
    });

    // 4. 初始代币供应
    if (options.initialTokenSupply) {
      this.token.mint('__genesis__', options.initialTokenSupply);
    }
    // 5. 初始国库
    if (options.initialTreasuryBalances) {
      for (const b of options.initialTreasuryBalances) {
        this.treasury.deposit(b.asset, b.amount, 'initial deposit');
      }
    }
  }

  // ==========================================================================
  // 1. 用户 / 成员
  // ==========================================================================

  /**
   * 注册用户地址
   */
  registerUser(userId: ID, address: string): void {
    this.token.registerUser(userId, address);
  }

  /**
   * 给用户铸造治理代币
   */
  mintTo(address: string, amount: string): void {
    this.token.mint(address, amount);
  }

  /**
   * 用户销毁自己的代币
   */
  burnFrom(address: string, amount: string): void {
    this.token.burn(address, amount);
  }

  // ==========================================================================
  // 2. 治理：提案 / 投票 / 执行
  // ==========================================================================

  /**
   * 创建提案
   */
  propose(opts: ProposeOptions): Proposal {
    return this.proposal.createProposal(opts);
  }

  /**
   * 激活提案
   */
  activate(id: ID): Proposal {
    return this.proposal.activateProposal(id);
  }

  /**
   * 投票
   */
  vote(opts: VoteOptions): Vote {
    return this.voting.castVote(opts);
  }

  /**
   * 投票结束（finalize）
   */
  finalize(id: ID): Proposal {
    return this.proposal.finalize(id);
  }

  /**
   * 取消提案
   */
  cancel(id: ID, reason: string, canceller?: string): Proposal {
    return this.proposal.cancelProposal(id, reason, { canceller });
  }

  /**
   * 排队
   */
  queue(id: ID): Proposal {
    return this.proposal.queueProposal(id);
  }

  /**
   * 执行提案
   */
  async executeProposal(id: ID): Promise<Proposal> {
    return this.proposal.executeProposal(id);
  }

  // ==========================================================================
  // 3. 委托
  // ==========================================================================

  delegate(delegator: string, delegate: string, amount: string): void {
    this.delegation.delegate(delegator, delegate, amount);
  }

  undelegate(delegator: string, delegate: string): void {
    this.delegation.undelegate(delegator, delegate);
  }

  // ==========================================================================
  // 4. 国库
  // ==========================================================================

  treasuryDeposit(asset: string, amount: string, reason: string) {
    return this.treasury.deposit(asset, amount, reason);
  }

  async treasuryWithdraw(
    asset: string,
    amount: string,
    recipient: string,
    reason: string,
    proposalId: ID
  ) {
    return this.treasury.withdraw(asset, amount, recipient, reason, proposalId);
  }

  getTreasury(): Treasury {
    return this.treasury.getTreasury();
  }

  // ==========================================================================
  // 5. 治理统计
  // ==========================================================================

  getGovernanceStats(): GovernanceStats {
    const allProposals = this.proposal.getProposals();
    const totalProposals = allProposals.length;
    const activeProposals = allProposals.filter(
      (p) => p.status === 'active' || p.status === 'pending' || p.status === 'queued'
    ).length;
    const executedProposals = allProposals.filter((p) => p.status === 'executed').length;

    let totalVotes = 0;
    for (const p of allProposals) {
      totalVotes += this.voting.getProposalVotes(p.id).length;
    }
    // 排除 __genesis__ 系统地址
    const holders = this.token.getHolders().filter((h) => h.address !== '__genesis__');
    const totalMembers = holders.length;
    const totalPower = holders.reduce(
      (acc, h) => acc + Number(h.votingPower),
      0
    );
    const participatedPower = allProposals.reduce((acc, p) => {
      const stats = this.voting.getVoteStats(p.id);
      return acc + Number(stats.totalWeight);
    }, 0);
    const participation = totalPower > 0 ? Math.min(1, participatedPower / (totalPower * Math.max(1, totalProposals))) : 0;

    return {
      totalProposals,
      activeProposals,
      executedProposals,
      totalVotes,
      totalMembers,
      participation,
      treasuryValue: this.treasury.getTotalValue(),
      tokenSupply: this.token.totalSupply(),
      circulatingSupply: this.token.getCirculatingSupply(),
      quorum: this.token.getQuorum(),
      updatedAt: Date.now(),
    };
  }

  // ==========================================================================
  // 6. 事件订阅
  // ==========================================================================

  onProposalUpdate(handler: (p: Proposal) => void): Unsub {
    const wrap = (e: DaoEvent) => {
      if (e.type === 'proposal_update') handler(e.proposal);
    };
    return this.subscribe(wrap);
  }

  onVoteUpdate(handler: (vote: Vote, proposalId: ID) => void): Unsub {
    const wrap = (e: DaoEvent) => {
      if (e.type === 'vote_update') handler(e.vote, e.proposalId);
    };
    return this.subscribe(wrap);
  }

  onTreasuryUpdate(handler: (treasury: Treasury) => void): Unsub {
    const wrap = (e: DaoEvent) => {
      if (e.type === 'treasury_update') handler(e.treasury);
    };
    return this.subscribe(wrap);
  }

  private subscribe(handler: DaoEventHandler): Unsub {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  // ==========================================================================
  // 7. 直接访问子服务（测试 / 高级用法）
  // ==========================================================================

  getTokenService(): GovernanceTokenService {
    return this.token;
  }
  getDelegationService(): DelegationService {
    return this.delegation;
  }
  getProposalService(): ProposalService {
    return this.proposal;
  }
  getVotingService(): VotingService {
    return this.voting;
  }
  getTreasuryService(): TreasuryService {
    return this.treasury;
  }

  /** 测试用：清空所有状态 */
  reset(): void {
    this.token.reset();
    this.delegation.reset();
    this.proposal.reset();
    this.voting.reset();
    this.treasury.reset();
    this.handlers.clear();
  }

  private emit(event: DaoEvent): void {
    for (const h of this.handlers) {
      try {
        h(event);
      } catch {
        // 忽略
      }
    }
  }
}
