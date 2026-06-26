/**
 * DAO 治理系统模块入口
 *
 *  模块结构：
 *   - types                类型定义 + 关键常量
 *   - token-service        治理代币（mint / transfer / balance / voting power）
 *   - delegation-service   委托（delegate / undelegate / 查询）
 *   - proposal-service     提案（创建 / 状态机 / 排队 / 执行）
 *   - voting-service       投票（4 种权重模型 + 离线签名 + 统计）
 *   - treasury-service     国库（余额 / 报表 / runway / 提案联动）
 *   - dao-engine           业务主类（整合 + 事件 + 治理统计）
 *
 *  业务流程：
 *   1. 持有 SMY 治理代币 → 获得投票权
 *   2. 满足提案门槛（≥ 1,000 SMY）→ 创建提案
 *   3. 投票期（~7 天）→ 社区投票（支持委托）
 *   4. 通过后排队 → 时间锁（~2.5 天）→ 执行
 *   5. 国库支出需走提案流程
 *
 *  典型用法：
 *    import { DaoEngine } from '@/lib/dao';
 *    const dao = new DaoEngine({
 *      initialTokenSupply: '1000000',
 *      initialTreasuryBalances: [{ asset: 'USDT', amount: '500000' }],
 *    });
 *    dao.registerUser('u_alice', '0xalice');
 *    dao.mintTo('0xalice', '5000');
 *    const p = dao.propose({
 *      proposer: '0xalice', proposerUserId: 'u_alice',
 *      type: 'treasury', title: '资助开发者', description: '...',
 *    });
 *    dao.activate(p.id);
 *    dao.vote({ proposalId: p.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });
 *    const fin = dao.finalize(p.id);
 *    if (fin.status === 'succeeded') {
 *      dao.queue(p.id);
 *      const exec = await dao.executeProposal(p.id);
 *      // 国库支出
 *      await dao.treasuryWithdraw('USDT', '10000', '0xrecipient', 'grant', exec.id);
 *    }
 */

export * from './types';

// 治理代币
export {
  GovernanceTokenService,
  TokenError,
  type GovernanceTokenServiceOptions,
  type TokenEvent,
  type TokenEventHandler,
  type DelegationLookup,
} from './token-service';

// 委托服务
export {
  DelegationService,
  DelegationError,
  type DelegationServiceOptions,
  type DelegationEvent,
  type DelegationEventHandler,
} from './delegation-service';

// 提案服务
export {
  ProposalService,
  ProposalError,
  type ProposalServiceOptions,
  type ProposalEvent,
  type ProposalEventHandler,
  type CreateProposalOptions,
  type TokenLookup,
  type VoteLookup,
} from './proposal-service';

// 投票服务
export {
  VotingService,
  VoteError,
  type VotingServiceOptions,
  type VoteEvent,
  type VoteEventHandler,
  type CastVoteOptions,
  type CastVoteSignatureOptions,
  type ProposalStateLookup,
} from './voting-service';

// 国库服务
export {
  TreasuryService,
  TreasuryError,
  type TreasuryServiceOptions,
  type TreasuryEvent,
  type TreasuryEventHandler,
  type ProposalVerifier,
} from './treasury-service';

// 业务主类
export {
  DaoEngine,
  type DaoEngineOptions,
  type DaoEvent,
  type DaoEventHandler,
  type GovernanceStats,
  type ProposeOptions,
  type VoteOptions,
} from './dao-engine';
