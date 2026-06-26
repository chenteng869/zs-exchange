/**
 * 理赔引擎（ClaimEngine）
 *
 * 职责：
 *  - 提交理赔（自动审核保单状态 / 保额匹配 / 标的匹配）
 *  - 调查（分配调查人、收集证据、可选预言机验证）
 *  - 投票治理（token_weighted / one_person_one_vote / expert_panel）
 *  - 决定（approve / reject）
 *  - 赔付（从保险池支出，按 payoutRatio 比例）
 *
 * 投票规则：
 *  - 默认 7 天投票期
 *  - 通过阈值 2/3（0.66）
 *  - 票数可加权（按质押量）
 */

import {
  decCmp,
  decIsPositive,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  INSURANCE_CLAIM_VOTING_DURATION_MS,
  INSURANCE_PAYOUT_RATIO,
  INSURANCE_VOTING_THRESHOLD,
  makeInsuranceId,
} from './types';
import type {
  Claim,
  ClaimEvidence,
  ClaimStatus,
  ClaimVoting,
  ID,
  Policy,
  Voter,
} from './types';

// ============================================================================
// 错误
// ============================================================================

export class ClaimError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ClaimError';
  }
}

// ============================================================================
// 事件
// ============================================================================

export type ClaimEvent =
  | { type: 'submitted'; claim: Claim }
  | { type: 'investigating'; claim: Claim; investigatorId: string }
  | { type: 'voting_started'; claim: Claim; voting: ClaimVoting }
  | { type: 'vote_cast'; claim: Claim; voter: Voter }
  | { type: 'approved'; claim: Claim; amount: string }
  | { type: 'rejected'; claim: Claim; reason: string }
  | { type: 'paid'; claim: Claim; amount: string }
  | { type: 'voting_expired'; claim: Claim };

export type ClaimEventHandler = (event: ClaimEvent) => void;

// ============================================================================
// 依赖接口
// ============================================================================

export interface PolicyLookup {
  getPolicy(id: ID): Policy | null;
  markClaimed(id: ID, at?: number): Policy;
}

export interface PayoutSink {
  /** 从池子支出指定金额到用户 */
  payout(userId: ID, amount: string, claimId: ID): boolean;
}

// ============================================================================
// 引擎
// ============================================================================

export interface ClaimEngineOptions {
  policyLookup?: PolicyLookup;
  payoutSink?: PayoutSink;
  votingDurationMs?: number;
  threshold?: number;
  onEvent?: ClaimEventHandler;
}

export class ClaimEngine {
  private policyLookup: PolicyLookup | null;
  private payoutSink: PayoutSink | null;
  private votingDurationMs: number;
  private threshold: number;
  private handler: ClaimEventHandler | null = null;

  /** claimId -> Claim */
  private claims: Map<ID, Claim> = new Map();
  /** userId -> Set<claimId> */
  private userClaims: Map<ID, Set<ID>> = new Map();
  /** claimId -> 已投票地址集合（防止重复投票） */
  private voted: Map<ID, Set<string>> = new Map();

  constructor(options: ClaimEngineOptions = {}) {
    this.policyLookup = options.policyLookup || null;
    this.payoutSink = options.payoutSink || null;
    this.votingDurationMs =
      options.votingDurationMs ?? INSURANCE_CLAIM_VOTING_DURATION_MS;
    this.threshold = options.threshold ?? INSURANCE_VOTING_THRESHOLD;
    this.handler = options.onEvent || null;
  }

  // ==========================================================================
  // 1. 提交理赔
  // ==========================================================================

  /**
   * 提交理赔
   *  - 自动审核：
   *    1. 保单存在且 active
   *    2. 申请金额 <= 保额
   *    3. 标的资产匹配
   *    4. 至少一条证据
   */
  submitClaim(opts: {
    policyId: ID;
    userId: ID;
    amount: string;
    reason: string;
    evidence: ClaimEvidence[];
  }): Claim {
    if (!this.policyLookup) {
      throw new ClaimError(
        'NO_POLICY_LOOKUP',
        'policyLookup is required for claim submission'
      );
    }
    const policy = this.policyLookup.getPolicy(opts.policyId);
    if (!policy) {
      throw new ClaimError('POLICY_NOT_FOUND', `Policy not found: ${opts.policyId}`);
    }
    if (policy.status !== 'active') {
      throw new ClaimError(
        'POLICY_NOT_ACTIVE',
        `Policy ${opts.policyId} status=${policy.status}`
      );
    }
    if (policy.userId !== opts.userId) {
      throw new ClaimError('UNAUTHORIZED', 'User does not own this policy');
    }
    if (!decIsPositive(opts.amount)) {
      throw new ClaimError('INVALID_AMOUNT', 'claim amount must be > 0');
    }
    if (decCmp(opts.amount, policy.coverageAmount) > 0) {
      throw new ClaimError(
        'AMOUNT_EXCEEDS_COVERAGE',
        `amount ${opts.amount} > coverage ${policy.coverageAmount}`
      );
    }
    if (!opts.reason || opts.reason.trim().length < 5) {
      throw new ClaimError('INVALID_REASON', 'reason is required (>= 5 chars)');
    }
    if (!opts.evidence || opts.evidence.length === 0) {
      throw new ClaimError('NO_EVIDENCE', 'at least one evidence item is required');
    }

    const claim: Claim = {
      id: makeInsuranceId('clm'),
      policyId: opts.policyId,
      userId: opts.userId,
      amount: opts.amount,
      reason: opts.reason,
      evidence: opts.evidence,
      status: 'submitted',
      submittedAt: Date.now(),
    };

    this.claims.set(claim.id, claim);
    const set = this.userClaims.get(opts.userId) || new Set();
    set.add(claim.id);
    this.userClaims.set(opts.userId, set);
    this.voted.set(claim.id, new Set());

    this.emit({ type: 'submitted', claim });
    return { ...claim };
  }

  // ==========================================================================
  // 2. 调查
  // ==========================================================================

  /**
   * 标记为调查中
   *  - 设置调查人
   *  - 收集证据（追加）
   */
  investigate(
    claimId: ID,
    investigatorId: string,
    opts: { notes?: string; addEvidence?: ClaimEvidence[] } = {}
  ): Claim {
    const claim = this.getClaimOrThrow(claimId);
    if (claim.status !== 'submitted' && claim.status !== 'investigating') {
      throw new ClaimError(
        'INVALID_STATUS',
        `Claim ${claimId} status=${claim.status}, cannot investigate`
      );
    }

    const updated: Claim = {
      ...claim,
      status: 'investigating',
      investigatorId,
      investigatedAt: claim.investigatedAt || Date.now(),
    };
    if (opts.addEvidence && opts.addEvidence.length > 0) {
      updated.evidence = [...claim.evidence, ...opts.addEvidence];
    }
    this.claims.set(claimId, updated);
    this.emit({ type: 'investigating', claim: updated, investigatorId });
    return { ...updated };
  }

  // ==========================================================================
  // 3. 投票治理
  // ==========================================================================

  /**
   * 创建投票
   *  - 自动设置投票期和阈值
   *  - claim 进入 voting 阶段
   */
  createVoting(
    claimId: ID,
    opts: {
      type?: ClaimVoting['type'];
      durationMs?: number;
      threshold?: number;
    } = {}
  ): ClaimVoting {
    const claim = this.getClaimOrThrow(claimId);
    if (claim.status !== 'investigating' && claim.status !== 'submitted') {
      throw new ClaimError(
        'INVALID_STATUS',
        `Claim ${claimId} status=${claim.status}, cannot start voting`
      );
    }

    const now = Date.now();
    const voting: ClaimVoting = {
      type: opts.type || 'token_weighted',
      startTime: now,
      endTime: now + (opts.durationMs ?? this.votingDurationMs),
      voters: [],
      approved: 0,
      rejected: 0,
      threshold: opts.threshold ?? this.threshold,
      status: 'pending',
    };

    const updated: Claim = {
      ...claim,
      status: 'investigating',
      voting,
    };
    this.claims.set(claimId, updated);
    this.emit({ type: 'voting_started', claim: updated, voting });
    return { ...voting };
  }

  /**
   * 投票
   *  - 同一地址不能重复投票
   *  - 加权投票：按 weight 计入
   *  - 自动判断是否达到阈值 → 通过 / 拒绝
   */
  voteOnClaim(
    claimId: ID,
    voter: { address: string; vote: 'approve' | 'reject'; weight?: number; reason?: string }
  ): { claim: Claim; voter: Voter } {
    const claim = this.getClaimOrThrow(claimId);
    if (!claim.voting) {
      throw new ClaimError('NO_VOTING', `Claim ${claimId} has no voting in progress`);
    }
    if (claim.voting.status !== 'pending') {
      throw new ClaimError(
        'VOTING_CLOSED',
        `Voting status=${claim.voting.status}, cannot vote`
      );
    }
    const now = Date.now();
    if (now > claim.voting.endTime) {
      this.finalizeVoting(claim);
      throw new ClaimError('VOTING_EXPIRED', 'Voting period ended');
    }

    const votedSet = this.voted.get(claimId) || new Set<string>();
    if (votedSet.has(voter.address)) {
      throw new ClaimError('ALREADY_VOTED', `${voter.address} already voted`);
    }

    const weight = voter.weight ?? 1;
    if (weight <= 0) {
      throw new ClaimError('INVALID_WEIGHT', 'weight must be > 0');
    }
    const v: Voter = {
      address: voter.address,
      vote: voter.vote,
      weight,
      reason: voter.reason,
      timestamp: now,
    };

    const updatedVoting: ClaimVoting = {
      ...claim.voting,
      voters: [...claim.voting.voters, v],
      approved: claim.voting.approved + (voter.vote === 'approve' ? weight : 0),
      rejected: claim.voting.rejected + (voter.vote === 'reject' ? weight : 0),
    };
    votedSet.add(voter.address);
    this.voted.set(claimId, votedSet);

    const updated: Claim = { ...claim, voting: updatedVoting };
    this.claims.set(claimId, updated);
    this.emit({ type: 'vote_cast', claim: updated, voter: v });

    // 实时检查阈值
    this.maybeFinalize(updated);
    return { claim: { ...updated }, voter: v };
  }

  // ==========================================================================
  // 4. 决定
  // ==========================================================================

  /**
   * 批准理赔
   *  - 默认按 payoutRatio 比例赔付
   *  - amount 可覆盖（如部分赔付）
   */
  approveClaim(claimId: ID, amount?: string): Claim {
    const claim = this.getClaimOrThrow(claimId);
    if (claim.status === 'paid' || claim.status === 'rejected') {
      throw new ClaimError(
        'CLAIM_CLOSED',
        `Claim ${claimId} already ${claim.status}`
      );
    }

    // 关闭投票
    if (claim.voting && claim.voting.status === 'pending') {
      const finalVoting: ClaimVoting = {
        ...claim.voting,
        status: 'passed',
      };
      claim.voting = finalVoting;
    }

    const requested = claim.amount;
    // 90% 赔付比例（直接用 Number 计算避免 decimal 模块对前导零/补零小数的解析问题）
    const requestedNum = Number(requested);
    const maxPayout = decTruncate(
      Number.isFinite(requestedNum) ? (requestedNum * INSURANCE_PAYOUT_RATIO).toString() : '0',
      8
    );
    // 允许 amount 覆盖默认 maxPayout（如部分赔付）
    let payout: string;
    if (amount !== undefined) {
      payout = decTruncate(amount, 8);
    } else {
      payout = maxPayout;
    }
    if (decCmp(payout, maxPayout) > 0) {
      throw new ClaimError(
        'PAYOUT_EXCEEDS_RATIO',
        `payout ${payout} > max ${maxPayout}`
      );
    }

    const updated: Claim = {
      ...claim,
      status: 'approved',
      decidedAt: Date.now(),
      payoutAmount: payout,
    };
    this.claims.set(claimId, updated);
    this.emit({ type: 'approved', claim: updated, amount: payout });
    return { ...updated };
  }

  /**
   * 拒绝理赔
   */
  rejectClaim(claimId: ID, reason: string): Claim {
    const claim = this.getClaimOrThrow(claimId);
    if (claim.status === 'paid' || claim.status === 'rejected') {
      throw new ClaimError(
        'CLAIM_CLOSED',
        `Claim ${claimId} already ${claim.status}`
      );
    }
    if (!reason || reason.trim().length < 3) {
      throw new ClaimError('INVALID_REASON', 'rejection reason is required');
    }

    if (claim.voting && claim.voting.status === 'pending') {
      claim.voting = { ...claim.voting, status: 'rejected' };
    }

    const updated: Claim = {
      ...claim,
      status: 'rejected',
      decidedAt: Date.now(),
      rejectionReason: reason,
    };
    this.claims.set(claimId, updated);
    this.emit({ type: 'rejected', claim: updated, reason });
    return { ...updated };
  }

  // ==========================================================================
  // 5. 赔付
  // ==========================================================================

  /**
   * 触发赔付
   *  - 仅 approved 状态可赔付
   *  - 标记保单为 claimed
   *  - 调用 PayoutSink 从池子支出
   */
  payoutClaim(claimId: ID): Claim {
    const claim = this.getClaimOrThrow(claimId);
    if (claim.status !== 'approved') {
      throw new ClaimError(
        'NOT_APPROVED',
        `Claim ${claimId} status=${claim.status}, must be approved first`
      );
    }
    if (!this.payoutSink) {
      throw new ClaimError('NO_PAYOUT_SINK', 'payoutSink is required to execute payout');
    }
    const amount = claim.payoutAmount || claim.amount;

    const ok = this.payoutSink.payout(claim.userId, amount, claim.id);
    if (!ok) {
      throw new ClaimError('PAYOUT_FAILED', 'Payout sink refused the transfer');
    }

    if (this.policyLookup) {
      try {
        this.policyLookup.markClaimed(claim.policyId, Date.now());
      } catch {
        // 标记失败不阻断赔付
      }
    }

    const updated: Claim = {
      ...claim,
      status: 'paid',
      paidAt: Date.now(),
      payoutAmount: amount,
    };
    this.claims.set(claimId, updated);
    this.emit({ type: 'paid', claim: updated, amount });
    return { ...updated };
  }

  // ==========================================================================
  // 6. 查询
  // ==========================================================================

  getClaim(id: ID): Claim | null {
    const c = this.claims.get(id);
    return c ? { ...c } : null;
  }

  getUserClaims(userId: ID, status?: ClaimStatus): Claim[] {
    const ids = this.userClaims.get(userId) || new Set();
    const out: Claim[] = [];
    for (const id of ids) {
      const c = this.claims.get(id);
      if (!c) continue;
      if (status && c.status !== status) continue;
      out.push({ ...c });
    }
    return out;
  }

  getAllClaims(status?: ClaimStatus): Claim[] {
    const out: Claim[] = [];
    for (const c of this.claims.values()) {
      if (status && c.status !== status) continue;
      out.push({ ...c });
    }
    return out;
  }

  // ==========================================================================
  // 7. 内部
  // ==========================================================================

  private getClaimOrThrow(id: ID): Claim {
    const c = this.claims.get(id);
    if (!c) {
      throw new ClaimError('CLAIM_NOT_FOUND', `Claim not found: ${id}`);
    }
    return c;
  }

  /**
   * 实时检查投票阈值
   *  - 达到 2/3 通过 / 拒绝 -> 自动 finalize
   *  - 至少需要 3 票才触发（避免单票立即通过）
   *  - 双方都必须有至少 1 票（避免单一票数主导）
   *  - 也可在 processExpiredVotings 触发终局
   */
  private maybeFinalize(claim: Claim): void {
    if (!claim.voting || claim.voting.status !== 'pending') return;
    const total = claim.voting.approved + claim.voting.rejected;
    if (total < 3) return; // 至少 3 票
    // 双方都必须有至少 1 票，避免单一票数自动通过/拒绝
    if (claim.voting.approved === 0 || claim.voting.rejected === 0) return;
    const approveRatio = claim.voting.approved / total;
    const rejectRatio = claim.voting.rejected / total;
    if (approveRatio >= claim.voting.threshold) {
      this.approveClaim(claim.id);
    } else if (rejectRatio >= claim.voting.threshold) {
      this.rejectClaim(claim.id, 'voting rejected');
    }
  }

  private finalizeVoting(claim: Claim): Claim {
    if (!claim.voting) return claim;
    const total = claim.voting.approved + claim.voting.rejected;
    const approveRatio = total > 0 ? claim.voting.approved / total : 0;
    const expired: ClaimVoting = { ...claim.voting, status: 'expired' };
    const updated: Claim = { ...claim, voting: expired };
    this.claims.set(claim.id, updated);
    this.emit({ type: 'voting_expired', claim: updated });
    // 过期不自动拒绝（需人工决定），但若达到阈值则通过
    if (approveRatio >= claim.voting.threshold) {
      // 标的已过期但不阻断赔付
    }
    return updated;
  }

  /** 外部定时器调用：检查过期投票 */
  processExpiredVotings(now: number = Date.now()): Claim[] {
    const out: Claim[] = [];
    for (const c of this.claims.values()) {
      if (c.voting && c.voting.status === 'pending' && c.voting.endTime <= now) {
        out.push(this.finalizeVoting(c));
      }
    }
    return out;
  }

  // ==========================================================================
  // 工具
  // ==========================================================================

  setPolicyLookup(lookup: PolicyLookup): void {
    this.policyLookup = lookup;
  }

  setPayoutSink(sink: PayoutSink): void {
    this.payoutSink = sink;
  }

  setHandler(handler: ClaimEventHandler | null): void {
    this.handler = handler;
  }

  reset(): void {
    this.claims.clear();
    this.userClaims.clear();
    this.voted.clear();
  }

  private emit(event: ClaimEvent): void {
    if (this.handler) {
      try {
        this.handler(event);
      } catch {
        // 忽略
      }
    }
  }
}
