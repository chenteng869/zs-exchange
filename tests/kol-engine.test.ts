/**
 * KOL 推广返佣 + 跟单交易 系统单元测试
 *
 * 覆盖：
 *  - KolService applyKol / approveKol
 *  - KolService evaluateTier
 *  - ReferralService bindReferral
 *  - ReferralService getDownline 3 级
 *  - ReferralService updateTradingVolume
 *  - CommissionEngine setRule
 *  - CommissionEngine calculateCommission 单级
 *  - CommissionEngine calculateCommission 3 级
 *  - CommissionEngine recordCommission
 *  - CommissionEngine settleKol
 *  - CopyTradingService createConfig
 *  - CopyTradingService onKolTrade 触发
 *  - CopyTradingService 比例跟单
 *  - CopyTradingService 风险检查
 *  - CopyTradingService 止损
 *  - KolEngine 集成（订单 → 返佣 + 跟单）
 *  - KolEngine getKolReport
 *  - KolEngine getLeaderboard
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  KolService,
  ReferralService,
  CommissionEngine,
  CopyTradingService,
  KolEngine,
  KOL_COMMISSION_LEVELS,
  KOL_DEFAULT_COMMISSION_RATES,
  KOL_SETTLEMENT_MIN_AMOUNT,
  type CommissionRule,
  type Kol,
  type KolOrderLike,
} from '../src/lib/kol';

// ============================================================================
// helpers
// ============================================================================

function setupEngine(): KolEngine {
  return new KolEngine();
}

function applyAndApprove(engine: KolEngine, userId: string, name: string, opts: any = {}): Kol {
  const kol = engine.applyKol(userId, { displayName: name, kycVerified: true, ...opts });
  engine.approveKol(kol.id, opts.tier ?? 'micro');
  return kol;
}

// ============================================================================
// KolService
// ============================================================================

test('KolService: applyKol + approveKol', () => {
  const svc = new KolService();
  const kol = svc.applyKol('user_1', { displayName: 'Alice', kycVerified: true });
  assert.equal(kol.status, 'pending');
  assert.equal(kol.displayName, 'Alice');
  assert.ok(kol.referralCode.length > 0);

  const approved = svc.approveKol(kol.id, 'macro');
  assert.equal(approved.status, 'active');
  assert.equal(approved.tier, 'macro');
  assert.ok(approved.approvedAt > 0);
});

test('KolService: approveKol requires KYC', () => {
  const svc = new KolService();
  const kol = svc.applyKol('user_2', { displayName: 'Bob' });
  assert.throws(() => svc.approveKol(kol.id, 'micro'), /KYC/);
});

test('KolService: suspendKol + banKol + reactivate', () => {
  const svc = new KolService();
  const kol = svc.applyKol('user_3', { displayName: 'Carol', kycVerified: true });
  svc.approveKol(kol.id, 'micro');

  const suspended = svc.suspendKol(kol.id, 'policy_violation');
  assert.equal(suspended.status, 'suspended');

  const banned = svc.banKol(kol.id, 'fraud');
  assert.equal(banned.status, 'banned');

  assert.throws(() => svc.reactivateKol(kol.id), /banned/);
});

test('KolService: evaluateTier 根据粉丝 / 交易量评级', () => {
  const svc = new KolService();
  const kol = svc.applyKol('user_4', { displayName: 'Dave', kycVerified: true, followerCount: 200_000 });
  svc.approveKol(kol.id, 'micro');
  // 200k 粉丝 + 2000 万团队交易量 = celebrity
  const tier = svc.evaluateTier(kol.id, '20000000');
  assert.equal(tier, 'celebrity');
  // 不够量 → micro
  const tier2 = svc.evaluateTier(kol.id, '100');
  assert.equal(tier2, 'micro');
});

test('KolService: getKolByReferralCode / getKolByUserId', () => {
  const svc = new KolService();
  const kol = svc.applyKol('user_5', { displayName: 'Eve', kycVerified: true, referralCode: 'TESTCODE1' });
  svc.approveKol(kol.id);
  const a = svc.getKolByReferralCode('TESTCODE1');
  const b = svc.getKolByUserId('user_5');
  assert.equal(a?.id, kol.id);
  assert.equal(b?.id, kol.id);
});

test('KolService: getLeaderboard 按总返佣降序', () => {
  const svc = new KolService();
  const k1 = svc.applyKol('u_a', { displayName: 'A', kycVerified: true });
  const k2 = svc.applyKol('u_b', { displayName: 'B', kycVerified: true });
  svc.approveKol(k1.id);
  svc.approveKol(k2.id);
  k1.totalCommission = '1000';
  k2.totalCommission = '500';
  const board = svc.getLeaderboard({ start: 0, end: Date.now() }, 10);
  assert.equal(board[0].kolId, k1.id);
  assert.equal(board[0].rank, 1);
  assert.equal(board[1].kolId, k2.id);
  assert.equal(board[1].rank, 2);
});

// ============================================================================
// ReferralService
// ============================================================================

test('ReferralService: bindReferral 直接绑定', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const ref = engine.bindUserToKol('user_x', kol.referralCode);
  assert.equal(ref.kolId, kol.id);
  assert.equal(ref.userId, 'user_x');
  assert.equal(ref.level, 1);
  assert.equal(ref.status, 'active');
});

test('ReferralService: bindReferral 重复绑定抛错', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  engine.bindUserToKol('user_x', kol.referralCode);
  assert.throws(() => engine.bindUserToKol('user_x', kol.referralCode), /already/);
});

test('ReferralService: getDownline 3 级（KOL A→B→C）', () => {
  const engine = setupEngine();
  // A 邀请 B（B 也是 KOL）
  const kolA = applyAndApprove(engine, 'kolA_user', 'KOL A');
  const kolB = applyAndApprove(engine, 'kolB_user', 'KOL B');
  // B 邀请 C（C 也是 KOL）
  const kolC = applyAndApprove(engine, 'kolC_user', 'KOL C');

  // 1) B 绑定到 A（B 是 A 的 L1）
  engine.bindUserToKol(kolB.userId, kolA.referralCode);
  // 2) C 绑定到 B（C 是 B 的 L1；同时 C 也通过 B 链到 A，level=2）
  engine.bindUserToKol(kolC.userId, kolB.referralCode);

  // 3) 普通用户 D 绑定到 C（D 是 C 的 L1；L2=B；L3=A）
  engine.bindUserToKol('user_d', kolC.referralCode);

  // 检查 A 的下线：包含 B (L1) + C (L2) + D (L3)
  const aDown = engine.getReferralService().getDownline(kolA.id, 3);
  const aUserIds = aDown.map((r) => r.userId).sort();
  assert.deepEqual(aUserIds, [kolB.userId, kolC.userId, 'user_d'].sort());

  // 检查 B 的下线：包含 C (L1) + D (L2)
  const bDown = engine.getReferralService().getDownline(kolB.id, 3);
  const bUserIds = bDown.map((r) => r.userId).sort();
  assert.deepEqual(bUserIds, [kolC.userId, 'user_d'].sort());

  // 检查 C 的下线：只有 D (L1)
  const cDown = engine.getReferralService().getDownline(kolC.id, 3);
  assert.equal(cDown.length, 1);
  assert.equal(cDown[0].userId, 'user_d');
  assert.equal(cDown[0].level, 1);

  // 检查 D 的邀请链
  const dChain = engine.getReferralService().getReferralChain('user_d');
  assert.equal(dChain.length, 3);
  assert.equal(dChain[0].kolId, kolC.id);
  assert.equal(dChain[1].kolId, kolB.id);
  assert.equal(dChain[2].kolId, kolA.id);
});

test('ReferralService: updateTradingVolume 累加', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const ref = engine.bindUserToKol('user_x', kol.referralCode);
  engine.getReferralService().updateTradingVolume(ref.id, '1000', '5');
  engine.getReferralService().updateTradingVolume(ref.id, '500', '2.5');
  const after = engine.getReferralService().getUserVolume('user_x');
  assert.equal(after, '1500');
});

// ============================================================================
// CommissionEngine
// ============================================================================

test('CommissionEngine: setRule + getRule', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const rule: CommissionRule = {
    id: 'r1',
    kolId: kol.id,
    type: 'spot',
    rate: 0.002, // 0.2%
    isActive: true,
    effectiveFrom: Date.now() - 1000,
  };
  engine.getCommissionEngine().setRule(rule);
  const got = engine.getCommissionEngine().getRule(kol.id, 'spot');
  assert.equal(got?.rate, 0.002);
});

test('CommissionEngine: calculateCommission 单级（L1=30% of 默认费率）', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  // 10000 * 0.001 (spot default) * 0.3 (L1) = 3
  const amt = engine.getCommissionEngine().calculateCommission('10000', 'spot', kol.id, 1, engine);
  assert.equal(amt, '3');
});

test('CommissionEngine: calculateCommission 3 级', () => {
  const engine = setupEngine();
  const kolA = applyAndApprove(engine, 'kolA_user', 'A');
  const kolB = applyAndApprove(engine, 'kolB_user', 'B');
  // 构造邀请链：A → B → user
  engine.bindUserToKol(kolB.userId, kolA.referralCode);
  engine.bindUserToKol('user_z', kolB.referralCode);

  // 计算 user_z 在链上的所有返佣
  const chain = engine.getReferralService().getReferralChain('user_z');
  assert.equal(chain.length, 2);

  // L1 (kolB): 10000 * 0.001 * 0.3 = 3
  // L2 (kolA): 10000 * 0.001 * 0.1 = 1
  const l1 = engine.getCommissionEngine().calculateCommission('10000', 'spot', kolB.id, 1, engine);
  const l2 = engine.getCommissionEngine().calculateCommission('10000', 'spot', kolA.id, 2, engine);
  assert.equal(l1, '3');
  assert.equal(l2, '1');
});

test('CommissionEngine: recordCommission 写入并累计 referral', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const ref = engine.bindUserToKol('user_x', kol.referralCode);

  // 模拟触发返佣
  const list = engine.triggerCommissions({
    userId: 'user_x',
    type: 'spot',
    baseAmount: '10000',
    sourceTxId: 'tx_1',
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].amount, '3');
  assert.equal(list[0].level, 1);

  // referral 业绩已累计
  const vol = engine.getReferralService().getUserVolume('user_x');
  assert.equal(vol, '10000');

  // KOL pendingCommission 已累计
  const reloaded = engine.getKolService().getKol(kol.id)!;
  assert.equal(reloaded.pendingCommission, '3');
  assert.equal(reloaded.totalCommission, '3');
});

test('CommissionEngine: settleKol 100 USDT 起结', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const ref = engine.bindUserToKol('user_x', kol.referralCode);
  // 触发 50000 的返佣 = 15
  engine.triggerCommissions({
    userId: 'user_x',
    type: 'spot',
    baseAmount: '50000', // 50000 * 0.001 * 0.3 = 15
    sourceTxId: 'tx_2',
  });
  // 15 < 100 → pending
  const s1 = engine.getCommissionEngine().settleKol(kol.id, { start: 0, end: Date.now() });
  assert.equal(s1.status, 'pending');
  assert.equal(s1.totalAmount, '15');

  // 再触发 100000 → 累计 15 + 30 = 45（仍 < 100）
  engine.triggerCommissions({
    userId: 'user_x',
    type: 'spot',
    baseAmount: '100000', // 100000 * 0.001 * 0.3 = 30
    sourceTxId: 'tx_3',
  });
  // s1 没成功支付（status pending），commission 还是 pending/confirmed，所以 s2 把它们也一起算
  // 总额 = 15 + 30 = 45，仍然 < 100
  const s2 = engine.getCommissionEngine().settleKol(kol.id, { start: 0, end: Date.now() });
  assert.equal(s2.status, 'pending');
  assert.equal(s2.totalAmount, '45');

  // 触发更大额：100000 → 30，累计 45 + 30 = 75
  engine.triggerCommissions({
    userId: 'user_x',
    type: 'spot',
    baseAmount: '100000', // 30
    sourceTxId: 'tx_4',
  });
  // 再触发 100000 → 30，累计 75 + 30 = 105 ≥ 100
  engine.triggerCommissions({
    userId: 'user_x',
    type: 'spot',
    baseAmount: '100000', // 30
    sourceTxId: 'tx_5',
  });
  const s3 = engine.getCommissionEngine().settleKol(kol.id, { start: 0, end: Date.now() });
  // 累计 15+30+30+30 = 105
  assert.equal(s3.totalAmount, '105');
  assert.equal(s3.status, 'paid');
});

test('CommissionEngine: tier 调整（celebrity 加 50%）', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1', { tier: 'celebrity' });
  // 10000 * 0.001 * 1.5 (celebrity bonus) * 0.3 (L1) = 4.5
  const amt = engine.getCommissionEngine().calculateCommission('10000', 'spot', kol.id, 1, engine);
  assert.equal(amt, '4.5');
});

// ============================================================================
// CopyTradingService
// ============================================================================

test('CopyTradingService: createConfig 比例模式', () => {
  const copy = new CopyTradingService();
  const cfg = copy.createConfig({
    followerUserId: 'follower_1',
    kolUserId: 'kol_1',
    mode: 'proportional',
    proportionalRatio: 0.5,
  });
  assert.equal(cfg.status, 'active');
  assert.equal(cfg.proportionalRatio, 0.5);
  assert.equal(cfg.mode, 'proportional');
});

test('CopyTradingService: createConfig 校验（follower != kol）', () => {
  const copy = new CopyTradingService();
  assert.throws(() =>
    copy.createConfig({
      followerUserId: 'u1',
      kolUserId: 'u1',
      mode: 'proportional',
      proportionalRatio: 0.5,
    }),
  /same/);
});

test('CopyTradingService: onKolTrade 触发比例跟单', async () => {
  const engine = setupEngine();
  // 创建一个 KOL + 一个 follower
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  engine.createCopyConfig({
    followerUserId: 'follower_1',
    kolUserId: kol.userId,
    mode: 'proportional',
    proportionalRatio: 0.5,
  });

  // 模拟 KOL 成交 100 BTC @ 30000
  const kolOrder: KolOrderLike = {
    id: 'ko_1',
    userId: kol.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '100',
    quoteQty: '3000000',
  };
  const trades = await engine.getCopyTradingService().onKolTrade(kolOrder, kol.userId);
  assert.equal(trades.length, 1);
  assert.equal(trades[0].copyQuantity, '50'); // 50% of 100
  assert.equal(trades[0].followerPrice, '30000');
  assert.equal(trades[0].status, 'filled');

  // follower 跟单数累计
  const cfg = engine.getCopyTradingService().getFollowerConfigs('follower_1')[0];
  assert.equal(cfg.totalCopied, 1);
});

test('CopyTradingService: 固定金额模式', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  engine.createCopyConfig({
    followerUserId: 'follower_1',
    kolUserId: kol.userId,
    mode: 'fixed',
    fixedAmount: '60000', // 60000 / 30000 = 2 BTC
  });
  const kolOrder: KolOrderLike = {
    id: 'ko_1',
    userId: kol.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '100',
  };
  return engine.getCopyTradingService().onKolTrade(kolOrder, kol.userId).then((trades) => {
    assert.equal(trades.length, 1);
    assert.equal(trades[0].copyQuantity, '2');
  });
});

test('CopyTradingService: 风险检查 - 单笔最大损失超限', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  // maxLossPerTrade=10, stopLoss=0.1 → 单笔 max value = 10/0.1 = 100
  engine.createCopyConfig({
    followerUserId: 'follower_1',
    kolUserId: kol.userId,
    mode: 'proportional',
    proportionalRatio: 1, // 100% 跟
    maxLossPerTrade: '10',
    stopLossRatio: 0.1,
  });
  const kolOrder: KolOrderLike = {
    id: 'ko_1',
    userId: kol.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '10', // value = 30000*10=300000, estLoss = 30000 > 10
  };
  return engine.getCopyTradingService().onKolTrade(kolOrder, kol.userId).then((trades) => {
    assert.equal(trades.length, 1);
    assert.equal(trades[0].status, 'failed');
    assert.equal(trades[0].reason, 'exceed_max_loss_per_trade');
  });
});

test('CopyTradingService: 风险检查 - 暂停时拒绝', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const cfg = engine.createCopyConfig({
    followerUserId: 'follower_1',
    kolUserId: kol.userId,
    mode: 'proportional',
    proportionalRatio: 0.5,
  });
  engine.getCopyTradingService().pauseConfig(cfg.id);
  const kolOrder: KolOrderLike = {
    id: 'ko_1',
    userId: kol.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '1',
  };
  return engine.getCopyTradingService().onKolTrade(kolOrder, kol.userId).then((trades) => {
    assert.equal(trades.length, 1);
    assert.equal(trades[0].status, 'failed');
  });
});

test('CopyTradingService: 止损检查（buy 跌价止损）', () => {
  const copy = new CopyTradingService();
  const cfg = copy.createConfig({
    followerUserId: 'f1',
    kolUserId: 'k1',
    mode: 'proportional',
    proportionalRatio: 0.5,
    stopLossRatio: 0.1,
  });
  // 30000 * (1-0.1) = 27000
  assert.equal(copy.shouldStopLoss(cfg, '30000', '26000', 'buy'), true);
  // 28500 > 27000 → 不止损
  assert.equal(copy.shouldStopLoss(cfg, '30000', '28500', 'buy'), false);
  // sell 涨价止损：30000 * 1.1 = 33000
  assert.equal(copy.shouldStopLoss(cfg, '30000', '34000', 'sell'), true);
});

test('CopyTradingService: 止盈检查', () => {
  const copy = new CopyTradingService();
  const cfg = copy.createConfig({
    followerUserId: 'f1',
    kolUserId: 'k1',
    mode: 'proportional',
    proportionalRatio: 0.5,
    takeProfitRatio: 0.2,
  });
  // buy 止盈：30000 * 1.2 = 36000
  assert.equal(copy.shouldTakeProfit(cfg, '30000', '37000', 'buy'), true);
  assert.equal(copy.shouldTakeProfit(cfg, '30000', '35000', 'buy'), false);
});

test('CopyTradingService: 跟单统计（winRate / net）', () => {
  const copy = new CopyTradingService();
  const cfg = copy.createConfig({
    followerUserId: 'f1',
    kolUserId: 'k1',
    mode: 'proportional',
    proportionalRatio: 0.5,
  });
  // 模拟 3 笔：1 胜 2 负
  const t1 = { id: 't1', configId: cfg.id, kolOrderId: 'ko_1', followerUserId: 'f1', symbol: 'BTC/USDT', side: 'buy' as const, kolQuantity: '1', copyQuantity: '0.5', kolPrice: '30000', followerPrice: '30000', status: 'filled' as const, createdAt: 1 };
  const t2 = { ...t1, id: 't2', createdAt: 2 };
  const t3 = { ...t1, id: 't3', createdAt: 3 };
  (copy as any).copyTrades.set(t1.id, t1);
  (copy as any).copyTrades.set(t2.id, t2);
  (copy as any).copyTrades.set(t3.id, t3);
  (copy as any).configTrades.set(cfg.id, [t1.id, t2.id, t3.id]);

  copy.setCopyTradePnl(t1.id, '100');
  copy.setCopyTradePnl(t2.id, '-30');
  copy.setCopyTradePnl(t3.id, '-20');

  const stats = copy.getCopyStats(cfg.id);
  assert.equal(stats.total, 3);
  assert.equal(stats.winCount, 1);
  assert.equal(stats.lossCount, 2);
  assert.equal(stats.profit, '100');
  assert.equal(stats.loss, '50');
  assert.equal(stats.net, '50');
  assert.ok(Math.abs(stats.winRate - 1 / 3) < 0.0001);
});

// ============================================================================
// KolEngine 集成
// ============================================================================

test('KolEngine: 订单 → 返佣 + 跟单 集成', async () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const user = 'user_buyer';
  engine.bindUserToKol(user, kol.referralCode);
  engine.createCopyConfig({
    followerUserId: 'follower_1',
    kolUserId: kol.userId,
    mode: 'proportional',
    proportionalRatio: 0.5,
  });

  // 监听 commission + copy
  let commissionCount = 0;
  let copyCount = 0;
  engine.onCommission(() => { commissionCount += 1; });
  engine.onCopyTrade(() => { copyCount += 1; });

  // 模拟普通用户成交 → 触发返佣
  engine.triggerCommissions({
    userId: user,
    type: 'spot',
    baseAmount: '10000',
    sourceTxId: 'tx_1',
  });
  assert.equal(commissionCount, 1);

  // 模拟 KOL 成交 → 触发跟单
  const kolOrder: KolOrderLike = {
    id: 'ko_1',
    userId: kol.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '10',
  };
  await engine.triggerCopyTrade(kolOrder, kol.userId);
  assert.equal(copyCount, 1);
});

test('KolEngine: getKolReport 业绩', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  const ref = engine.bindUserToKol('user_x', kol.referralCode);
  engine.getReferralService().updateTradingVolume(ref.id, '5000', '50');
  const report = engine.getKolReport(kol.id, { start: 0, end: Date.now() });
  assert.equal(report.totalFollowers, 1);
  assert.equal(report.activeFollowers, 1);
  assert.equal(report.totalTradingVolume, '5000');
  assert.equal(report.totalCommission, '50');
  assert.equal(report.byLevel[1].count, 1);
  assert.equal(report.byLevel[1].volume, '5000');
});

test('KolEngine: getTopKol 排行榜', () => {
  const engine = setupEngine();
  const k1 = applyAndApprove(engine, 'u_a', 'A');
  const k2 = applyAndApprove(engine, 'u_b', 'B');
  const ref1 = engine.bindUserToKol('u_x', k1.referralCode);
  const ref2 = engine.bindUserToKol('u_y', k2.referralCode);
  engine.getReferralService().updateTradingVolume(ref1.id, '10000', '100');
  engine.getReferralService().updateTradingVolume(ref2.id, '5000', '50');
  const top = engine.getTopKol({ start: 0, end: Date.now() }, 10);
  assert.equal(top[0].kolId, k1.id);
  assert.equal(top[0].rank, 1);
  assert.equal(top[1].kolId, k2.id);
  assert.equal(top[1].rank, 2);
});

test('KolEngine: getLeaderboard（KolService 直接调用）', () => {
  const engine = setupEngine();
  const k1 = applyAndApprove(engine, 'u_a', 'A');
  const k2 = applyAndApprove(engine, 'u_b', 'B');
  // KOLService 的 getLeaderboard 需要 statsFetcher
  const top = engine.getKolService().getLeaderboard({ start: 0, end: Date.now() }, 10, (id) =>
    engine.getKolReport(id, { start: 0, end: Date.now() }),
  );
  assert.ok(top.length >= 2);
  assert.equal(top[0].kolId, k1.id);
  assert.equal(top[0].rank, 1);
});

test('KolEngine: unbindUser + 重新 bind', () => {
  const engine = setupEngine();
  const kol = applyAndApprove(engine, 'kol_1', 'KOL1');
  engine.bindUserToKol('user_x', kol.referralCode);
  engine.unbindUser('user_x');
  // 解绑后能再绑
  engine.bindUserToKol('user_x', kol.referralCode);
  const chain = engine.getReferralService().getReferralChain('user_x');
  assert.equal(chain.length, 1);
  assert.equal(chain[0].kolId, kol.id);
});

// ============================================================================
// 常量校验
// ============================================================================

test('Constants: KOL_COMMISSION_LEVELS', () => {
  assert.equal(KOL_COMMISSION_LEVELS[1], 0.30);
  assert.equal(KOL_COMMISSION_LEVELS[2], 0.10);
  assert.equal(KOL_COMMISSION_LEVELS[3], 0.05);
});

test('Constants: KOL_DEFAULT_COMMISSION_RATES', () => {
  assert.equal(KOL_DEFAULT_COMMISSION_RATES.spot, 0.001);
  assert.equal(KOL_DEFAULT_COMMISSION_RATES.perp, 0.0005);
  assert.equal(KOL_DEFAULT_COMMISSION_RATES.copy, 0.002);
});
