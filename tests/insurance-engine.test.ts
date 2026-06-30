/**
 * DeFi 保险池（Insurance Pool）单元测试
 *
 * 覆盖：
 *  - RiskPricingEngine：assessRisk / calculatePremium / calculateRequiredCapital
 *  - PolicyService：getQuote / purchasePolicy / cancelPolicy 14d 内/外 / getActivePolicies
 *  - ClaimEngine：submitClaim / investigate / voteOnClaim / approveClaim / rejectClaim / payoutClaim
 *  - PoolService：stake / distributePremium / calculateApy / requestWithdraw / 早退惩罚
 *  - InsuranceEngine：集成场景
 *
 * 用例数量：21+
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RiskPricingEngine,
  PolicyService,
  ClaimEngine,
  PoolService,
  InsuranceEngine,
  INSURANCE_BASE_RATES,
  INSURANCE_CANCEL_FEE_RATE,
  INSURANCE_CANCEL_GRACE_DAYS,
  INSURANCE_EARLY_WITHDRAW_PENALTY,
  INSURANCE_GLOBAL_POOL_ID,
  INSURANCE_PAYOUT_RATIO,
  INSURANCE_POOL_UTILIZATION_TARGET,
  INSURANCE_QUOTE_TTL_MS,
  INSURANCE_VOTING_THRESHOLD,
  INSURANCE_WITHDRAW_LOCKUP_DAYS,
} from '../src/lib/insurance';

// ============================================================================
// 1. RiskPricingEngine
// ============================================================================

test('RiskPricingEngine: assessRisk 返回 5 因子 + 综合分', () => {
  const engine = new RiskPricingEngine();
  const r = engine.assessRisk('smart_contract', 'ETH');
  assert.equal(r.product, 'smart_contract');
  assert.equal(r.targetAsset, 'ETH');
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(r.factors.smartContractRisk >= 0);
  assert.ok(r.factors.auditScore >= 0);
  assert.ok(r.recommendedRate > 0);
  assert.ok(r.reason.length > 0);
});

test('RiskPricingEngine: 高风险资产评分高于低风险资产', () => {
  const engine = new RiskPricingEngine();
  const safe = engine.assessRisk('smart_contract', 'ETH');
  const risky = engine.assessRisk('smart_contract', 'titan');
  assert.ok(risky.score > safe.score, `risky=${risky.score} should > safe=${safe.score}`);
});

test('RiskPricingEngine: 5 产品基础费率符合配置', () => {
  assert.equal(INSURANCE_BASE_RATES.exchange_hack, 0.008);
  assert.equal(INSURANCE_BASE_RATES.smart_contract, 0.012);
  assert.equal(INSURANCE_BASE_RATES.stablecoin_depeg, 0.005);
  assert.equal(INSURANCE_BASE_RATES.oracle_failure, 0.003);
  assert.equal(INSURANCE_BASE_RATES.liquidation_penalty, 0.006);
});

test('RiskPricingEngine: calculatePremium = coverage × rate × (period/365) × (1+risk)', () => {
  const engine = new RiskPricingEngine();
  // 10000 保额，1.2% 年化，90 天（90/365），风险分 0
  const p1 = engine.calculatePremium({
    coverage: '10000',
    period: 90,
    riskScore: 0,
    product: 'smart_contract',
  });
  // 10000 * 0.012 * (90/365) = 29.58904109...
  const num1 = Number(p1);
  assert.ok(Math.abs(num1 - 29.589) < 0.01, `p1=${p1}`);

  // 风险分 50 → 翻倍
  const p2 = engine.calculatePremium({
    coverage: '10000',
    period: 90,
    riskScore: 50,
    product: 'smart_contract',
  });
  // 29.589 * 1.5 ≈ 44.38
  const num2 = Number(p2);
  assert.ok(num2 > num1 * 1.4 && num2 < num1 * 1.6, `p2=${p2} should be ~1.5x of p1=${p1}`);
});

test('RiskPricingEngine: calculatePremium 拒绝非法输入', () => {
  const engine = new RiskPricingEngine();
  assert.throws(() =>
    engine.calculatePremium({ coverage: '0', period: 30, riskScore: 0 })
  );
  assert.throws(() =>
    engine.calculatePremium({ coverage: '100', period: 0, riskScore: 0 })
  );
  assert.throws(() =>
    engine.calculatePremium({ coverage: '100', period: 30, riskScore: 150 })
  );
});

test('RiskPricingEngine: calculateRequiredCapital = coverage / 0.8', () => {
  const engine = new RiskPricingEngine();
  const cap = engine.calculateRequiredCapital('1000');
  assert.equal(cap, '1250'); // 1000 / 0.8
});

test('RiskPricingEngine: calculateRequiredCapital 自定义利用率', () => {
  const engine = new RiskPricingEngine();
  const cap = engine.calculateRequiredCapital('1000', 0.5);
  assert.equal(cap, '2000');
});

// ============================================================================
// 2. PolicyService
// ============================================================================

test('PolicyService: getQuote 返回 60s 过期 + 风险评分', () => {
  const svc = new PolicyService();
  const q = svc.getQuote({
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
    coveredAsset: 'USDT',
  });
  assert.equal(q.product, 'smart_contract');
  assert.equal(q.coverageAmount, '1000');
  assert.equal(q.payoutRatio, INSURANCE_PAYOUT_RATIO);
  assert.ok(q.premiumRate > 0);
  const ttl = q.expiresAt - Date.now();
  assert.ok(ttl > 0 && ttl <= INSURANCE_QUOTE_TTL_MS);
});

test('PolicyService: purchasePolicy 扣保费 + 创建 active 保单', () => {
  const svc = new PolicyService();
  // 用户钱包需要有钱
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '1000');
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '500',
    periodDays: 30,
    coveredAsset: 'USDT',
  });
  assert.equal(p.userId, 'u1');
  assert.equal(p.status, 'active');
  assert.equal(p.coverageAmount, '500');
  assert.ok(Number(p.premium) > 0);
  // 钱包已扣
  const w = (svc as unknown as { wallet: { getWallet(u: string): { wallet: string } } }).wallet.getWallet('u1');
  assert.ok(Number(w.wallet) < 1000);
});

test('PolicyService: 14 天内 cancel 退保费', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '1000');
  const p = svc.purchasePolicy('u1', {
    product: 'oracle_failure',
    coverageAmount: '500',
    periodDays: 30,
  });
  // 7 天后退保
  const r = svc.cancelPolicy(p.id, { now: p.startTime + 7 * 24 * 3600_000 });
  assert.equal(r.policy.status, 'cancelled');
  // 7/14 比例扣 5% × 0.5 = 2.5% 手续费
  const expectedFee = Number(p.premium) * INSURANCE_CANCEL_FEE_RATE * (7 / 14);
  assert.ok(Math.abs(Number(r.fee) - expectedFee) < 0.001);
  // 退款 = premium - fee
  const expectedRefund = Number(p.premium) - expectedFee;
  assert.ok(Math.abs(Number(r.refund) - expectedRefund) < 0.001);
});

test('PolicyService: 14 天外 cancel 拒绝', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '1000');
  const p = svc.purchasePolicy('u1', {
    product: 'oracle_failure',
    coverageAmount: '500',
    periodDays: 90,
  });
  // 20 天后
  assert.throws(
    () => svc.cancelPolicy(p.id, { now: p.startTime + 20 * 24 * 3600_000 }),
    (err: Error) => (err as Error & { code?: string }).code === 'CANCEL_GRACE_EXPIRED'
  );
});

test('PolicyService: getActivePoliciesFor 按资产过滤', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  svc.purchasePolicy('u1', { product: 'smart_contract', coverageAmount: '100', periodDays: 30, coveredAsset: 'ETH' });
  svc.purchasePolicy('u1', { product: 'oracle_failure', coverageAmount: '200', periodDays: 30, coveredAsset: 'BTC' });
  svc.purchasePolicy('u1', { product: 'exchange_hack', coverageAmount: '300', periodDays: 30, coveredAsset: 'ETH' });
  const eth = svc.getActivePoliciesFor('u1', 'ETH');
  assert.equal(eth.length, 2);
  const all = svc.getActivePoliciesFor('u1');
  assert.equal(all.length, 3);
});

test('PolicyService: getExpiringPolicies 返回即将到期保单', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '100',
    periodDays: 30,
  });
  // 模拟到保单结束前 5 天
  const nearFuture = p.endTime - 5 * 24 * 3600_000;
  const expiring = svc.getExpiringPolicies(7, nearFuture);
  assert.ok(expiring.find((x) => x.id === p.id));
});

test('PolicyService: 余额不足拒绝投保', () => {
  const svc = new PolicyService();
  // 用户没钱
  assert.throws(
    () =>
      svc.purchasePolicy('u1', {
        product: 'smart_contract',
        coverageAmount: '1000',
        periodDays: 30,
      }),
    (err: Error) => {
      const code = (err as Error & { code?: string }).code;
      return code === 'INSUFFICIENT_BALANCE' || code === 'INVALID_PREMIUM';
    }
  );
});

// ============================================================================
// 3. ClaimEngine
// ============================================================================

test('ClaimEngine: submitClaim 自动审核保单状态 + 标的', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');

  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });

  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
    coveredAsset: 'ETH',
  });

  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: '合约被攻击导致资金被盗',
    evidence: [{ type: 'tx_hash', content: '0xabc', uploadedAt: Date.now() }],
  });
  assert.equal(c.status, 'submitted');
  assert.equal(c.policyId, p.id);
});

test('ClaimEngine: 申请金额超过保额被拒', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');

  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });

  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '100',
    periodDays: 30,
  });

  assert.throws(
    () =>
      engine.submitClaim({
        policyId: p.id,
        userId: 'u1',
        amount: '500',
        reason: '巨额赔付测试',
        evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
      }),
    (err: Error) => (err as Error & { code?: string }).code === 'AMOUNT_EXCEEDS_COVERAGE'
  );
});

test('ClaimEngine: investigate 标记调查中 + 设置调查人', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
  });
  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: '理赔测试用例',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  const r = engine.investigate(c.id, 'investigator-1', { notes: '已初步核实' });
  assert.equal(r.status, 'investigating');
  assert.equal(r.investigatorId, 'investigator-1');
  assert.ok(r.investigatedAt);
});

test('ClaimEngine: voteOnClaim 加权投票 + 阈值自动通过', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
  });
  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: '投票治理测试',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  engine.investigate(c.id, 'inv-1');
  engine.createVoting(c.id);
  // 投票序列：确保最后一次投票时刚好通过 2/3
  // 双方都必须有至少 1 票，否则不触发自动 final
  // - 0xa reject weight 5 → total 5, approved 0, rejected 5 (5/5=1.0)? 不行
  // 调整：
  // - 0xa reject weight 4 → total 4, approved 0（被否：单边）
  // - 0xb approve weight 4 → total 8, approved 4 (4/8=0.5)（未达阈值）
  // - 0xc approve weight 4 → total 12, approved 8 (8/12≈0.667 > 0.66) → 自动通过
  // 第三次投票就触发，但所有 3 票都已被记录
  engine.voteOnClaim(c.id, { address: '0xa', vote: 'reject', weight: 4 });
  engine.voteOnClaim(c.id, { address: '0xb', vote: 'approve', weight: 4 });
  engine.voteOnClaim(c.id, { address: '0xc', vote: 'approve', weight: 4 });
  // 此时已被自动 approve
  const after = engine.getClaim(c.id);
  assert.ok(after);
  // 票数应该被正确记录
  assert.ok(after!.voting);
  assert.equal(after!.voting!.approved, 8);
  assert.equal(after!.voting!.rejected, 4);
  assert.equal(after!.voting!.voters.length, 3);
});

test('ClaimEngine: approveClaim 设置赔付金额 + 限制最大 90%', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
  });
  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: 'approve 金额测试',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  const r = engine.approveClaim(c.id);
  assert.equal(r.status, 'approved');
  assert.equal(r.payoutAmount, '450'); // 500 * 0.9
  // 试图超过 90% 拒绝
  assert.throws(
    () => engine.approveClaim(c.id, '500'),
    (err: Error) => (err as Error & { code?: string }).code === 'PAYOUT_EXCEEDS_RATIO'
  );
});

test('ClaimEngine: rejectClaim 设置拒绝原因', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const engine = new ClaimEngine();
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
  });
  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: 'reject 测试',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  const r = engine.rejectClaim(c.id, '证据不足');
  assert.equal(r.status, 'rejected');
  assert.equal(r.rejectionReason, '证据不足');
});

test('ClaimEngine: payoutClaim 完整流程', () => {
  const svc = new PolicyService();
  const wallet = (svc as unknown as { wallet: { topUp(u: string, a: string): void } }).wallet;
  wallet.topUp('u1', '10000');
  const engine = new ClaimEngine();
  let payoutOk = false;
  engine.setPolicyLookup({
    getPolicy: (id) => svc.getPolicy(id),
    markClaimed: (id) => svc.markClaimed(id),
  });
  engine.setPayoutSink({
    payout: (uid, amt, cid) => {
      payoutOk = true;
      assert.equal(uid, 'u1');
      assert.equal(amt, '450');
      return true;
    },
  });
  const p = svc.purchasePolicy('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
  });
  const c = engine.submitClaim({
    policyId: p.id,
    userId: 'u1',
    amount: '500',
    reason: 'payout 流程测试',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  engine.approveClaim(c.id);
  const paid = engine.payoutClaim(c.id);
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paidAt);
  assert.ok(payoutOk);
  // 保单被标记 claimed
  const policyAfter = svc.getPolicy(p.id);
  assert.equal(policyAfter?.status, 'claimed');
});

// ============================================================================
// 4. PoolService
// ============================================================================

test('PoolService: stake 1:1 铸造份额 + 池子总入金增加', () => {
  const pool = new PoolService();
  const pos = pool.stake('u1', 'global:smart_contract', '1000', 30);
  assert.equal(pos.userId, 'u1');
  assert.equal(pos.amount, '1000');
  assert.equal(pos.share, '1000'); // 池子为空 1:1
  const stats = pool.getPool('global:smart_contract');
  assert.equal(stats?.totalStaked, '1000');
  assert.equal(stats?.participants, 1);
});

test('PoolService: 多用户 stake 后份额按 sharePrice 计算', () => {
  const pool = new PoolService();
  pool.stake('u1', 'global:smart_contract', '1000', 30);
  const p2 = pool.stake('u2', 'global:smart_contract', '500', 30);
  // sharePrice = 1500/1500 = 1; u2 入 500 → share 500
  assert.equal(p2.share, '500');
  assert.equal(p2.amount, '500');
});

test('PoolService: distributePremium 按份额比例分配', () => {
  const pool = new PoolService();
  pool.stake('u1', 'global:smart_contract', '1000', 30);
  pool.stake('u2', 'global:smart_contract', '1000', 30);
  // 模拟发一张保单（premium=100）
  pool.distributePremium({
    id: 'p1',
    userId: 'buyer',
    product: 'smart_contract',
    coverageAmount: '5000',
    premium: '100',
    premiumRate: 0.02,
    coveragePeriodDays: 30,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 3600_000,
    status: 'active',
    createdAt: Date.now(),
  });
  const p1 = pool.getPosition(pool.getUserPositions('u1')[0].id);
  const p2 = pool.getPosition(pool.getUserPositions('u2')[0].id);
  // 50:50 分配
  assert.equal(p1?.earnedPremium, '50');
  assert.equal(p2?.earnedPremium, '50');
  assert.equal(p1?.totalReturn, '50');
});

test('PoolService: calculateApy 基于历史保费', () => {
  const pool = new PoolService();
  pool.stake('u1', 'global:smart_contract', '100000', 30);
  // 分配 1000 保费（30 天 = 1000/100000 = 1% period, 365/30 * 1% ≈ 12.17% APY）
  pool.distributePremium({
    id: 'p1',
    userId: 'buyer',
    product: 'smart_contract',
    coverageAmount: '50000',
    premium: '1000',
    premiumRate: 0.02,
    coveragePeriodDays: 30,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 3600_000,
    status: 'active',
    createdAt: Date.now(),
  });
  const apy = pool.calculateApy('global:smart_contract', 30);
  assert.ok(apy > 0.1 && apy < 0.2, `apy=${apy}`);
});

test('PoolService: requestWithdraw 排队 + 7 天锁仓', () => {
  const pool = new PoolService();
  const pos = pool.stake('u1', 'global:smart_contract', '1000', 7);
  const r = pool.requestWithdraw(pos.id);
  assert.equal(r.status, 'withdrawing');
  assert.ok(r.unlockTime && r.unlockTime > Date.now());
  // 锁仓时间 = stakeTime + 7*24h
  const expected = pos.stakedAt + 7 * 24 * 3600_000;
  assert.equal(r.unlockTime, expected);
});

test('PoolService: 早退扣除 5% 惩罚', () => {
  const pool = new PoolService();
  const pos = pool.stake('u1', 'global:smart_contract', '1000', 7);
  // 分配收益 200
  pool.distributePremium({
    id: 'p1',
    userId: 'buyer',
    product: 'smart_contract',
    coverageAmount: '1000',
    premium: '200',
    premiumRate: 0.2,
    coveragePeriodDays: 30,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 3600_000,
    status: 'active',
    createdAt: Date.now(),
  });
  pool.requestWithdraw(pos.id);
  // 立即处理（早于 unlockTime）
  const r = pool.processWithdraw(pos.id, pos.stakedAt + 1000);
  // gross = 1000 + 200 = 1200; penalty = 1200 * 5% = 60
  assert.equal(r.payout, '1140');
  assert.equal(r.penalty, '60');
  assert.equal(r.position.status, 'withdrawn');
});

test('PoolService: 正常退保无惩罚', () => {
  const pool = new PoolService();
  const pos = pool.stake('u1', 'global:smart_contract', '1000', 0); // 0 锁仓
  pool.distributePremium({
    id: 'p1',
    userId: 'buyer',
    product: 'smart_contract',
    coverageAmount: '1000',
    premium: '100',
    premiumRate: 0.1,
    coveragePeriodDays: 30,
    startTime: Date.now(),
    endTime: Date.now() + 30 * 24 * 3600_000,
    status: 'active',
    createdAt: Date.now(),
  });
  pool.requestWithdraw(pos.id);
  // 锁仓 0 天 → 立即可退
  const r = pool.processWithdraw(pos.id, pos.stakedAt + 1000);
  // 不在早退范围
  assert.equal(r.penalty, '0');
  assert.ok(Number(r.payout) >= 1100);
});

test('PoolService: deductForClaim 池子扣款 + lossReserve 计入', () => {
  const pool = new PoolService();
  pool.stake('u1', 'global:smart_contract', '1000', 30);
  const r = pool.deductForClaim({ poolId: 'global:smart_contract', amount: '200' });
  assert.equal(r.paid, '200');
  assert.equal(r.shortfall, '0');
  const stats = pool.getPool('global:smart_contract');
  assert.equal(stats?.totalClaims, '200');
  const p1 = pool.getPosition(pool.getUserPositions('u1')[0].id);
  assert.equal(p1?.lossReserve, '200');
  assert.equal(p1?.totalReturn, '-200');
});

// ============================================================================
// 5. InsuranceEngine 集成
// ============================================================================

test('InsuranceEngine: 完整流程 stake → purchase → claim → approve → payout', () => {
  const ins = new InsuranceEngine({ initialPoolDeposit: '0' });
  ins.deposit('u1', '10000');
  // 承保人注入流动性
  ins.stake('provider1', '50000', 7, 'smart_contract');
  // 投保
  const policy = ins.purchase('u1', {
    product: 'smart_contract',
    coverageAmount: '1000',
    periodDays: 30,
    coveredAsset: 'ETH',
  });
  assert.equal(policy.status, 'active');

  // 提交理赔
  const claim = ins.submitClaim('u1', {
    policyId: policy.id,
    amount: '500',
    reason: '合约被攻击',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  ins.investigateClaim(claim.id, 'inv-1');
  ins.startVoting(claim.id);
  // 投票序列：保证最后一次投票时刚好通过 2/3 阈值
  // 双方都必须有至少 1 票
  // - 0xaa reject weight 3 → total 3, approved 0（被否：单边）
  // - 0xbb approve weight 3 → total 6, approved 3 (3/6=0.5)（未达阈值）
  // - 0xcc approve weight 3 → total 9, approved 6 (6/9≈0.667 > 0.66) → 自动通过
  ins.vote(claim.id, { address: '0xaa', vote: 'reject', weight: 3 });
  ins.vote(claim.id, { address: '0xbb', vote: 'approve', weight: 3 });
  ins.vote(claim.id, { address: '0xcc', vote: 'approve', weight: 3 });
  // 触发后已被自动 approve
  const paid = ins.payoutClaim(claim.id);
  assert.equal(paid.status, 'paid');

  // 报表
  const stats = ins.getUserStats('u1');
  assert.equal(stats.policies, 1);
  assert.equal(stats.claims, 1);
  const prodStats = ins.getProductStats('smart_contract');
  assert.ok(Number(prodStats.totalStaked) > 0);
});

test('InsuranceEngine: 事件订阅 onPolicyIssued / onPayout', () => {
  const ins = new InsuranceEngine();
  ins.deposit('u1', '10000');
  const issued: string[] = [];
  const payouts: string[] = [];
  ins.onPolicyIssued((p) => issued.push(p.id));
  ins.onPayout((c) => payouts.push(c.id));
  ins.stake('provider1', '10000', 7, 'smart_contract');
  const policy = ins.purchase('u1', {
    product: 'smart_contract',
    coverageAmount: '500',
    periodDays: 30,
  });
  assert.ok(issued.includes(policy.id));
  const c = ins.submitClaim('u1', {
    policyId: policy.id,
    amount: '100',
    reason: '事件测试用例',
    evidence: [{ type: 'tx_hash', content: '0x', uploadedAt: Date.now() }],
  });
  ins.approveClaim(c.id);
  ins.payoutClaim(c.id);
  assert.ok(payouts.includes(c.id));
});

test('InsuranceEngine: getPoolStats 返回当前利用率', () => {
  const ins = new InsuranceEngine();
  ins.deposit('u1', '10000');
  ins.stake('provider1', '10000', 7, 'smart_contract');
  ins.purchase('u1', {
    product: 'smart_contract',
    coverageAmount: '5000',
    periodDays: 30,
  });
  const stats = ins.getPoolStats('global:smart_contract');
  assert.equal(stats.product, 'smart_contract');
  assert.equal(stats.totalStaked, '10000');
  assert.equal(stats.totalCoverage, '5000');
  assert.equal(stats.utilizationRate, '0.5');
  assert.equal(stats.policies, 1);
});

test('InsuranceEngine: 关键常量正确', () => {
  assert.equal(INSURANCE_PAYOUT_RATIO, 0.9);
  assert.equal(INSURANCE_VOTING_THRESHOLD, 0.66);
  assert.equal(INSURANCE_EARLY_WITHDRAW_PENALTY, 0.05);
  assert.equal(INSURANCE_CANCEL_GRACE_DAYS, 14);
  assert.equal(INSURANCE_CANCEL_FEE_RATE, 0.05);
  assert.equal(INSURANCE_POOL_UTILIZATION_TARGET, 0.8);
  assert.equal(INSURANCE_WITHDRAW_LOCKUP_DAYS, 7);
  assert.equal(INSURANCE_GLOBAL_POOL_ID, 'global');
});
