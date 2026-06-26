/**
 * DAO 治理系统核心类型定义
 *
 * 设计原则：
 *  - 所有金额/投票权/代币数量均以 string 表示（复用 src/lib/matching/decimal）
 *  - 与 Compound / Uniswap / OpenZeppelin Governor 的核心模型对齐
 *  - 业务侧通过 DaoEngine 整合 TokenService / DelegationService / ProposalService / VotingService / TreasuryService
 *
 * 业务流程：
 *  1. 持有 SMY 治理代币 → 获得投票权
 *  2. 满足提案门槛（≥ 1,000 SMY）→ 创建提案
 *  3. 投票期（~7 天）→ 社区投票（支持委托）
 *  4. 通过后排队 → 时间锁（~2.5 天）→ 执行
 *  5. 国库支出需走提案流程
 */

import type { ID } from '@/types/models';

// 重新导出 ID 便于上层使用
export type { ID } from '@/types/models';

// ============================================================================
// 状态 / 枚举
// ============================================================================

/** 提案状态 */
export type ProposalStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'succeeded'
  | 'defeated'
  | 'queued'
  | 'executed'
  | 'cancelled'
  | 'expired';

/** 提案类型 */
export type ProposalType =
  | 'parameter'
  | 'treasury'
  | 'upgrade'
  | 'integration'
  | 'listing'
  | 'community';

/** 投票选项 */
export type VoteOption = 'for' | 'against' | 'abstain';

/** 投票权重模型 */
export type VotingModel =
  | 'token_weighted'
  | 'one_person_one_vote'
  | 'quadratic'
  | 'conviction';

// ============================================================================
// 治理代币 / 成员
// ============================================================================

/** 治理代币 */
export interface GovernanceToken {
  symbol: string;
  name: string;
  totalSupply: string;
  decimals: number;
  contractAddress?: string;
}

/** 治理成员 */
export interface Member {
  userId: ID;
  address: string;
  balance: string;
  delegatedTo?: string;
  delegatedPower: string;
  votingPower: string;
  proposalsCreated: number;
  votesParticipated: number;
  joinedAt: number;
  isActive: boolean;
}

// ============================================================================
// 提案 / 投票 / 委托
// ============================================================================

/** 提案 */
export interface Proposal {
  id: ID;
  proposer: string;
  proposerUserId: ID;
  type: ProposalType;
  title: string;
  description: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  status: ProposalStatus;
  votingModel: VotingModel;
  startBlock: number;
  endBlock: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  threshold: number;
  eta?: number;
  createdAt: number;
  executedAt?: number;
  cancelledAt?: number;
}

/** 投票 */
export interface Vote {
  id: ID;
  proposalId: ID;
  voter: string;
  voterUserId: ID;
  option: VoteOption;
  weight: string;
  reason?: string;
  txHash?: string;
  timestamp: number;
}

/** 委托 */
export interface Delegation {
  id: ID;
  delegator: string;
  delegate: string;
  amount: string;
  timestamp: number;
  isActive: boolean;
}

// ============================================================================
// 国库
// ============================================================================

/** 国库 */
export interface Treasury {
  totalValue: string;
  balances: Array<{ asset: string; amount: string; valueUsd: string }>;
  monthlyInflow: string;
  monthlyOutflow: string;
  runwayMonths: number;
  updatedAt: number;
}

/** 国库交易 */
export interface TreasuryTransaction {
  id: ID;
  proposalId: ID;
  asset: string;
  amount: string;
  recipient?: string;
  reason: string;
  txHash?: string;
  timestamp: number;
}

// ============================================================================
// 投票统计
// ============================================================================

/** 投票统计 */
export interface VoteStats {
  proposalId: ID;
  totalVoters: number;
  totalWeight: string;
  participation: number;
  topVoters: { address: string; weight: string; option: VoteOption }[];
  distribution: Record<VoteOption, { count: number; weight: string }>;
}

// ============================================================================
// 关键常量
// ============================================================================

/** 提案需 1000 SMY */
export const DAO_PROPOSAL_THRESHOLD = '1000';

/** ~7 天（13.2s/block） */
export const DAO_VOTING_PERIOD_BLOCKS = 45818;

/** ~2.5 天 */
export const DAO_TIMELOCK_DELAY_BLOCKS = 17280;

/** 4% 法定票数 */
export const DAO_QUORUM_PERCENT = 0.04;

/** 50% 通过 */
export const DAO_PROPOSAL_THRESHOLD_VOTE = 0.5;

/** 二次方系数 */
export const DAO_QUADRATIC_COEFFICIENT = 1;

/** Conviction 模型上限 */
export const DAO_CONVICTION_MAX = 100;

/** 默认代币符号 */
export const DAO_TOKEN_SYMBOL = 'SMY';

/** 默认代币名称 */
export const DAO_TOKEN_NAME = 'SMY Governance Token';

/** 默认代币精度 */
export const DAO_TOKEN_DECIMALS = 18;

/** 月度运营成本（用于 runway 计算） */
export const DAO_MONTHLY_BURN = '50000';

/** Conviction 时间窗口（天） */
export const DAO_CONVICTION_WINDOW_DAYS = 14;

// ============================================================================
// 辅助函数
// ============================================================================

/** 生成 DAO 实体 ID（带前缀） */
export function makeDaoId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 提案类型显示名 */
export const PROPOSAL_TYPE_LABEL: Record<ProposalType, string> = {
  parameter: '参数调整',
  treasury: '国库支出',
  upgrade: '合约升级',
  integration: '集成合作',
  listing: '代币上线',
  community: '社区治理',
};

/** 投票选项显示名 */
export const VOTE_OPTION_LABEL: Record<VoteOption, string> = {
  for: '赞成',
  against: '反对',
  abstain: '弃权',
};

/** 投票模型显示名 */
export const VOTING_MODEL_LABEL: Record<VotingModel, string> = {
  token_weighted: '代币加权',
  one_person_one_vote: '一人一票',
  quadratic: '二次方投票',
  conviction: '信念投票',
};
