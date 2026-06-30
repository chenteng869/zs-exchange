/**
 * DAO 治理系统单元测试
 *
 * 覆盖：
 *  - GovernanceTokenService：mint / transfer / balanceOf / votingPower
 *  - DelegationService：delegate / undelegate / getDelegations
 *  - ProposalService：createProposal / 状态机 / cancel / queue / execute
 *  - VotingService：castVote / tokenWeighted / quadratic / getVoteStats
 *  - TreasuryService：deposit / withdraw / getRunway
 *  - DaoEngine：完整流程（提案 → 投票 → 执行 → 国库支出）+ 治理统计
 *
 * 用例数量：20+
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DaoEngine,
  DelegationService,
  GovernanceTokenService,
  ProposalService,
  TreasuryService,
  VotingService,
  DAO_PROPOSAL_THRESHOLD,
  DAO_QUORUM_PERCENT,
  DAO_TOKEN_SYMBOL,
  DAO_VOTING_PERIOD_BLOCKS,
  DAO_TIMELOCK_DELAY_BLOCKS,
} from '../src/lib/dao';

// ============================================================================
// 1. GovernanceTokenService
// ============================================================================

test('GovernanceTokenService: mint / transfer / balanceOf', () => {
  const token = new GovernanceTokenService();
  assert.equal(token.totalSupply(), '0');
  assert.equal(token.getToken().symbol, DAO_TOKEN_SYMBOL);

  token.mint('0xalice', '5000');
  assert.equal(token.balanceOf('0xalice'), '5000');
  assert.equal(token.totalSupply(), '5000');

  token.mint('0xbob', '3000');
  assert.equal(token.balanceOf('0xbob'), '3000');
  assert.equal(token.totalSupply(), '8000');

  token.transfer('0xalice', '0xbob', '1000');
  assert.equal(token.balanceOf('0xalice'), '4000');
  assert.equal(token.balanceOf('0xbob'), '4000');
  assert.equal(token.totalSupply(), '8000');
});

test('GovernanceTokenService: burn 减少供应', () => {
  const token = new GovernanceTokenService({ initialSupply: '0' });
  token.mint('0xalice', '10000');
  token.burn('0xalice', '1000');
  assert.equal(token.balanceOf('0xalice'), '9000');
  assert.equal(token.totalSupply(), '9000');
});

test('GovernanceTokenService: getVotingPower 包含委托', () => {
  const token = new GovernanceTokenService();
  const del = new DelegationService();
  token.setDelegationLookup({
    getTotalDelegatedTo: (addr) => del.getTotalDelegatedTo(addr),
    getTotalDelegatedFrom: (addr) => del.getTotalDelegatedFrom(addr),
  });

  token.mint('0xalice', '5000');
  token.mint('0xbob', '1000');
  // bob 委托 1000 给 alice
  del.delegate('0xbob', '0xalice', '1000');

  // alice 自身 5000 + 收到 bob 的 1000 = 6000
  assert.equal(token.getVotingPower('0xalice'), '6000');
  // bob 自身 1000 - 委托出去 1000 = 0
  assert.equal(token.getVotingPower('0xbob'), '0');
});

test('GovernanceTokenService: meetsProposalThreshold', () => {
  const token = new GovernanceTokenService();
  token.mint('0xalice', '999');
  assert.equal(token.meetsProposalThreshold('0xalice'), false);

  token.mint('0xalice', '2'); // 999 + 2 = 1001
  assert.equal(token.meetsProposalThreshold('0xalice'), true);
  assert.equal(DAO_PROPOSAL_THRESHOLD, '1000');
});

test('GovernanceTokenService: getQuorum = 4% supply', () => {
  const token = new GovernanceTokenService({ initialSupply: '1000000' });
  const q = Number(token.getQuorum());
  // 1000000 * 0.04 = 40000
  assert.ok(Math.abs(q - 40000) < 0.01, `quorum=${q}`);
  assert.equal(DAO_QUORUM_PERCENT, 0.04);
});

// ============================================================================
// 2. DelegationService
// ============================================================================

test('DelegationService: delegate / undelegate', () => {
  const del = new DelegationService();
  const d = del.delegate('0xalice', '0xbob', '500');
  assert.equal(d.delegator, '0xalice');
  assert.equal(d.delegate, '0xbob');
  assert.equal(d.amount, '500');
  assert.equal(d.isActive, true);

  assert.equal(del.isDelegated('0xalice', '0xbob'), true);
  assert.equal(del.getTotalDelegatedTo('0xbob'), '500');

  del.undelegate('0xalice', '0xbob');
  assert.equal(del.isDelegated('0xalice', '0xbob'), false);
  assert.equal(del.getTotalDelegatedTo('0xbob'), '0');
});

test('DelegationService: getDelegations / getDelegators', () => {
  const del = new DelegationService();
  del.delegate('0xalice', '0xbob', '500');
  del.delegate('0xcharlie', '0xbob', '300');

  const myDelegations = del.getDelegations('0xalice');
  assert.equal(myDelegations.length, 1);
  assert.equal(myDelegations[0].amount, '500');

  const delegators = del.getDelegators('0xbob');
  assert.equal(delegators.length, 2);
  assert.equal(del.getTotalDelegatedTo('0xbob'), '800');
});

test('DelegationService: 拒绝自委托 / 重复委托', () => {
  const del = new DelegationService();
  assert.throws(() => del.delegate('0xalice', '0xalice', '500'));

  del.delegate('0xalice', '0xbob', '500');
  del.delegate('0xalice', '0xcharlie', '300');
  // 旧委托被覆盖
  assert.equal(del.isDelegated('0xalice', '0xbob'), false);
  assert.equal(del.isDelegated('0xalice', '0xcharlie'), true);
});

// ============================================================================
// 3. ProposalService
// ============================================================================

test('ProposalService: createProposal + 状态机', () => {
  const token = new GovernanceTokenService({ initialSupply: '10000' });
  token.mint('0xalice', '2000');

  const proposal = new ProposalService({
    tokenLookup: {
      meetsProposalThreshold: (addr) => token.meetsProposalThreshold(addr),
      getQuorum: () => token.getQuorum(),
    },
  });

  const p = proposal.createProposal({
    proposer: '0xalice',
    proposerUserId: 'u_alice',
    type: 'parameter',
    title: '调整手续费',
    description: '将 maker 费从 0.1% 调整为 0.05%',
  });
  assert.equal(p.status, 'pending');

  // 激活
  const a = proposal.activateProposal(p.id);
  assert.equal(a.status, 'active');

  // 不足提案门槛会失败
  token.mint('0xtiny', '500');
  assert.throws(() =>
    proposal.createProposal({
      proposer: '0xtiny',
      proposerUserId: 'u_tiny',
      type: 'community',
      title: 'x',
      description: 'x',
    })
  );
});

test('ProposalService: cancelProposal', () => {
  const token = new GovernanceTokenService({ initialSupply: '10000' });
  token.mint('0xalice', '2000');

  const proposal = new ProposalService({
    tokenLookup: {
      meetsProposalThreshold: (addr) => token.meetsProposalThreshold(addr),
      getQuorum: () => token.getQuorum(),
    },
  });
  const p = proposal.createProposal({
    proposer: '0xalice',
    proposerUserId: 'u_alice',
    type: 'community',
    title: 'x',
    description: 'x',
  });
  const cancelled = proposal.cancelProposal(p.id, 'withdraw');
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.cancelledAt);
});

test('ProposalService: queueProposal + executeProposal', async () => {
  const token = new GovernanceTokenService({ initialSupply: '100000' });
  token.mint('0xalice', '5000');

  const voting = new VotingService();
  const proposal = new ProposalService({
    tokenLookup: {
      meetsProposalThreshold: (addr) => token.meetsProposalThreshold(addr),
      getQuorum: () => token.getQuorum(),
    },
    voteLookup: {
      getTotals: (id) => voting.getTotals(id),
    },
    timelockDelayBlocks: 0, // 测试用：立即可执行
  });
  // 把 voting 状态注入 proposal
  voting.setProposalState({
    isActive: (id) => {
      const p = proposal.getProposal(id);
      return !!p && p.status === 'active';
    },
    getVotingModel: (id) => {
      const p = proposal.getProposal(id);
      return p?.votingModel || 'token_weighted';
    },
  });

  const p = proposal.createProposal({
    proposer: '0xalice',
    proposerUserId: 'u_alice',
    type: 'treasury',
    title: '资助',
    description: '...',
  });
  proposal.activateProposal(p.id);

  // 投赞成票
  voting.castVote({
    proposalId: p.id,
    voter: '0xalice',
    voterUserId: 'u_alice',
    option: 'for',
    weight: '5000',
  });

  const fin = proposal.finalize(p.id);
  assert.equal(fin.status, 'succeeded');

  const queued = proposal.queueProposal(p.id);
  assert.equal(queued.status, 'queued');

  const exec = await proposal.executeProposal(p.id);
  assert.equal(exec.status, 'executed');
  assert.ok(exec.executedAt);
});

// ============================================================================
// 4. VotingService
// ============================================================================

test('VotingService: castVote', () => {
  const voting = new VotingService();
  const v = voting.castVote({
    proposalId: 'p1',
    voter: '0xalice',
    voterUserId: 'u_alice',
    option: 'for',
    weight: '1000',
  });
  assert.equal(v.option, 'for');
  assert.equal(v.weight, '1000');
  assert.equal(v.proposalId, 'p1');
});

test('VotingService: tokenWeighted = power', () => {
  const voting = new VotingService();
  const v = voting.castVote({
    proposalId: 'p1',
    voter: '0xalice',
    voterUserId: 'u_alice',
    option: 'for',
    weight: '1000',
  });
  assert.equal(voting.tokenWeighted(v, '5000'), '5000');
});

test('VotingService: quadratic = sqrt(power)', () => {
  const voting = new VotingService();
  const v = voting.castVote({
    proposalId: 'p1',
    voter: '0xalice',
    voterUserId: 'u_alice',
    option: 'for',
    weight: '100',
  });
  // 10000 -> sqrt = 100
  assert.equal(voting.quadratic(v, '10000'), '100');
  // 40000 -> sqrt = 200
  assert.equal(voting.quadratic(v, '40000'), '200');
  // 1000000 -> sqrt = 1000
  assert.equal(voting.quadratic(v, '1000000'), '1000');
});

test('VotingService: conviction 随时间增加', () => {
  const voting = new VotingService({ convictionWindowDays: 14 });
  const v = voting.castVote({
    proposalId: 'p1',
    voter: '0xalice',
    voterUserId: 'u_alice',
    option: 'for',
    weight: '100',
  });
  // 0 天：0
  const w0 = Number(voting.conviction(v, '1000', 0));
  // 7 天：约 0.5 * 1000 = 500
  const w7 = Number(voting.conviction(v, '1000', 7 * 24 * 3600 * 1000));
  // 14 天：1000
  const w14 = Number(voting.conviction(v, '1000', 14 * 24 * 3600 * 1000));
  // 30 天：仍 1000（达到窗口上限）
  const w30 = Number(voting.conviction(v, '1000', 30 * 24 * 3600 * 1000));

  assert.equal(w0, 0);
  assert.ok(w7 > 490 && w7 < 510, `w7=${w7}`);
  assert.ok(w14 >= 990 && w14 <= 1000, `w14=${w14}`);
  assert.ok(w30 >= 990 && w30 <= 1000, `w30=${w30}`);
});

test('VotingService: getVoteStats 累计 for/against/abstain', () => {
  const voting = new VotingService();
  voting.castVote({ proposalId: 'p1', voter: '0xa', voterUserId: 'ua', option: 'for', weight: '100' });
  voting.castVote({ proposalId: 'p1', voter: '0xb', voterUserId: 'ub', option: 'for', weight: '200' });
  voting.castVote({ proposalId: 'p1', voter: '0xc', voterUserId: 'uc', option: 'against', weight: '150' });
  voting.castVote({ proposalId: 'p1', voter: '0xd', voterUserId: 'ud', option: 'abstain', weight: '50' });

  const stats = voting.getVoteStats('p1');
  assert.equal(stats.totalVoters, 4);
  assert.equal(stats.totalWeight, '500');
  assert.equal(stats.distribution.for.count, 2);
  assert.equal(stats.distribution.for.weight, '300');
  assert.equal(stats.distribution.against.count, 1);
  assert.equal(stats.distribution.against.weight, '150');
  assert.equal(stats.distribution.abstain.count, 1);
  assert.equal(stats.distribution.abstain.weight, '50');
  assert.equal(stats.topVoters[0].address, '0xb'); // 200 最大
});

test('VotingService: 改票（同一 voter 重复投票）', () => {
  const voting = new VotingService();
  voting.castVote({ proposalId: 'p1', voter: '0xa', voterUserId: 'ua', option: 'for', weight: '100' });
  voting.castVote({ proposalId: 'p1', voter: '0xa', voterUserId: 'ua', option: 'against', weight: '200' });

  const stats = voting.getVoteStats('p1');
  assert.equal(stats.totalVoters, 1);
  assert.equal(stats.distribution.against.count, 1);
  assert.equal(stats.distribution.against.weight, '200');
  assert.equal(stats.distribution.for.count, 0);
});

// ============================================================================
// 5. TreasuryService
// ============================================================================

test('TreasuryService: deposit', () => {
  const t = new TreasuryService();
  const tx = t.deposit('USDT', '10000', 'initial');
  assert.equal(tx.amount, '10000');
  assert.equal(tx.asset, 'USDT');
  assert.equal(t.getBalance('USDT'), '10000');
  assert.equal(t.getTotalValue(), '10000');
});

test('TreasuryService: withdraw 需要提案通过', async () => {
  const t = new TreasuryService({
    proposalVerifier: {
      isExecuted: () => false,
      isPassed: (id) => id === 'p1',
    },
  });
  t.deposit('USDT', '10000', 'init');

  // 无 proposalId 应失败
  await assert.rejects(
    () => t.withdraw('USDT', '100', '0xr', 'test', '' as any),
    /proposalId is required/
  );
  // 提案未通过应失败
  await assert.rejects(
    () => t.withdraw('USDT', '100', '0xr', 'test', 'p2'),
    /not passed/
  );
  // 通过后成功
  const tx = await t.withdraw('USDT', '100', '0xr', 'grant', 'p1');
  assert.ok(tx.amount.startsWith('-'));
  assert.equal(t.getBalance('USDT'), '9900');
});

test('TreasuryService: getRunway = total / monthly_burn', () => {
  const t = new TreasuryService({ monthlyBurn: '10000' });
  t.deposit('USDT', '60000', 'init');
  // 60000 / 10000 = 6 个月
  assert.equal(t.getRunway(), 6);
});

test('TreasuryService: getMonthlyReport + getHistory', () => {
  const t = new TreasuryService();
  t.deposit('USDT', '5000', 'init');
  // 月报：当前月
  const month = new Date();
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const report = t.getMonthlyReport(key);
  assert.equal(report.inflow, '5000');
  assert.equal(report.outflow, '0');
  assert.equal(report.count, 1);

  const history = t.getHistory(7);
  assert.equal(history.length, 1);
});

// ============================================================================
// 6. DaoEngine 完整流程
// ============================================================================

test('DaoEngine: 完整流程（提案 → 投票 → 执行 → 国库支出）', async () => {
  const dao = new DaoEngine({
    initialTokenSupply: '100000',  // 100k supply, quorum = 4000
    initialTreasuryBalances: [{ asset: 'USDT', amount: '50000' }],
  });
  // 注册 3 个用户
  dao.registerUser('u_alice', '0xalice');
  dao.registerUser('u_bob', '0xbob');
  dao.registerUser('u_charlie', '0xcharlie');
  dao.mintTo('0xalice', '5000');
  dao.mintTo('0xbob', '3000');
  dao.mintTo('0xcharlie', '2000');

  // 1. 提案
  const p = dao.propose({
    proposer: '0xalice',
    proposerUserId: 'u_alice',
    type: 'treasury',
    title: '资助生态项目',
    description: '拨款 10000 USDT 给开发者',
  });
  assert.equal(p.status, 'pending');
  dao.activate(p.id);

  // 2. 投票（for: 8000, against: 2000, total 10000 > quorum 4000）
  dao.vote({ proposalId: p.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });
  dao.vote({ proposalId: p.id, voter: '0xbob', voterUserId: 'u_bob', option: 'for', weight: '3000' });
  dao.vote({ proposalId: p.id, voter: '0xcharlie', voterUserId: 'u_charlie', option: 'against', weight: '2000' });

  // 3. finalize
  const fin = dao.finalize(p.id);
  assert.equal(fin.status, 'succeeded');
  assert.equal(fin.forVotes, '8000');
  assert.equal(fin.againstVotes, '2000');

  // 4. queue + execute
  const queued = dao.queue(p.id);
  assert.equal(queued.status, 'queued');

  // 默认 timelock 延迟 2.5 天，直接执行会失败
  // 这里通过 DaoEngine 的 executeProposal 也会失败
  await assert.rejects(() => dao.executeProposal(p.id), /Timelock not expired/);

  // 构造一个无 timelock 的 DaoEngine 来跑完整流程
  const fastProposalSvc = new ProposalService({ timelockDelayBlocks: 0 });
  const fastDao = new DaoEngine({ proposalService: fastProposalSvc });
  fastDao.registerUser('u_alice', '0xalice');
  fastDao.mintTo('0xalice', '5000');
  // 注入依赖（fastDao 已通过 ctor 注入，但因为替换了 proposalService 需要重新注入）
  fastProposalSvc.setTokenLookup({
    meetsProposalThreshold: (a: string) => fastDao.getTokenService().meetsProposalThreshold(a),
    getQuorum: () => fastDao.getTokenService().getQuorum(),
  });
  fastProposalSvc.setVoteLookup({
    getTotals: (id: string) => fastDao.getVotingService().getTotals(id),
  });

  const p2 = fastDao.propose({
    proposer: '0xalice',
    proposerUserId: 'u_alice',
    type: 'treasury',
    title: '资助生态项目 2',
    description: '...',
  });
  fastDao.activate(p2.id);
  fastDao.vote({ proposalId: p2.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });
  fastDao.finalize(p2.id);
  fastDao.queue(p2.id);
  const exec = await fastDao.executeProposal(p2.id);
  assert.equal(exec.status, 'executed');

  // 5. 国库支出
  await fastDao.treasuryDeposit('USDT', '50000', 'topup');
  const tx = await fastDao.treasuryWithdraw('USDT', '10000', '0xrecipient', 'grant', exec.id);
  assert.ok(tx.amount.startsWith('-'));
  assert.equal(fastDao.getTreasury().balances.find(b => b.asset === 'USDT')?.amount, '40000');
});

test('DaoEngine: 治理统计 getGovernanceStats', () => {
  const dao = new DaoEngine({
    initialTokenSupply: '1000000',
    initialTreasuryBalances: [{ asset: 'USDT', amount: '100000' }],
  });
  dao.registerUser('u_alice', '0xalice');
  dao.registerUser('u_bob', '0xbob');
  dao.mintTo('0xalice', '5000');
  dao.mintTo('0xbob', '3000');

  // 创建并通过一个提案
  const p1 = dao.propose({
    proposer: '0xalice', proposerUserId: 'u_alice',
    type: 'community', title: 'a', description: 'a',
  });
  dao.activate(p1.id);
  dao.vote({ proposalId: p1.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });
  dao.finalize(p1.id);

  const stats = dao.getGovernanceStats();
  assert.equal(stats.totalProposals, 1);
  assert.equal(stats.executedProposals, 0);
  assert.ok(stats.totalVotes >= 1);
  assert.equal(stats.totalMembers, 2);  // 不含 __genesis__
  assert.equal(stats.treasuryValue, '100000');
  // supply = 1,000,000 (genesis) + 5,000 + 3,000
  assert.equal(stats.tokenSupply, '1008000');
  assert.equal(stats.circulatingSupply, '1008000');
  assert.ok(Number(stats.quorum) > 0);
});

test('DaoEngine: 委托 + 提案 + 投票（含委托的投票权）', () => {
  const dao = new DaoEngine({ initialTokenSupply: '1000000' });
  dao.registerUser('u_alice', '0xalice');
  dao.registerUser('u_bob', '0xbob');
  dao.registerUser('u_charlie', '0xcharlie');
  dao.mintTo('0xalice', '5000');
  dao.mintTo('0xbob', '500');
  dao.mintTo('0xcharlie', '1500');

  // charlie 委托给 bob
  dao.delegate('0xcharlie', '0xbob', '1500');
  // bob 的投票权 = 500 + 1500 = 2000（不达 1000 门槛但 alice 可以提案）
  assert.equal(Number(dao.getTokenService().getVotingPower('0xbob')), 2000);

  // alice 提案
  const p = dao.propose({
    proposer: '0xalice', proposerUserId: 'u_alice',
    type: 'community', title: 'a', description: 'a',
  });
  dao.activate(p.id);

  // bob 投 2000（含委托）
  dao.vote({ proposalId: p.id, voter: '0xbob', voterUserId: 'u_bob', option: 'for', weight: '2000' });
  dao.vote({ proposalId: p.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000' });

  const stats = dao.getGovernanceStats();
  assert.ok(stats.totalVotes >= 2);
});

// ============================================================================
// 7. 关键常量
// ============================================================================

test('DAO 关键常量校验', () => {
  assert.equal(DAO_PROPOSAL_THRESHOLD, '1000');
  assert.equal(DAO_VOTING_PERIOD_BLOCKS, 45818);
  assert.equal(DAO_TIMELOCK_DELAY_BLOCKS, 17280);
  assert.equal(DAO_QUORUM_PERCENT, 0.04);
  assert.equal(DAO_TOKEN_SYMBOL, 'SMY');
});
