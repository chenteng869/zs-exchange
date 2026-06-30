/**
 * DeFi 收益聚合器 单元测试 (P2)
 *
 * 覆盖：
 *  - 5 协议适配器：stake / supply / withdraw / getApy / getBalance / claimRewards
 *  - YieldScanner：scanPools / getBestYield / getTopPools / 缓存
 *  - AutoCompounder：触发条件 / compound / 批量
 *  - RiskAssessor：assessProtocol / getProtocolRisk
 *  - YieldEngine：deposit / withdraw / claimRewards / getStats / recommendBestYield / optimizeAllocation
 *
 * 全部用例：20+ （验收要求 16+）
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LidoAdapter,
  AaveAdapter,
  CompoundAdapter,
  CurveAdapter,
  ConvexAdapter,
  YieldScanner,
  AutoCompounder,
  RiskAssessor,
  YieldEngine,
  COMPOUND_GAS_PRICE_MAX_GWEI,
  COMPOUND_MIN_INTERVAL_MS,
  COMPOUND_MIN_THRESHOLD_USD,
} from '../src/lib/yield';

// =============================================================================
// LidoAdapter
// =============================================================================

test('LidoAdapter: getApy 返回 APY + totalPooled', async () => {
  const a = new LidoAdapter();
  const r = await a.getApy();
  assert.ok(r.apy > 0);
  assert.ok(r.totalPooled.length > 0);
  assert.equal(r.source, 'fallback');
});

test('LidoAdapter: stake / unstake 返回金额 + txHash', async () => {
  const a = new LidoAdapter();
  const stake = await a.stake('10', '0x' + '1'.repeat(40));
  assert.equal(stake.stEthAmount, '10');
  assert.match(stake.txHash, /^0x[0-9a-f]{64}$/);

  const unstake = await a.unstake('5', '0x' + '1'.repeat(40));
  assert.equal(unstake.ethAmount, '5');
  assert.match(unstake.txHash, /^0x[0-9a-f]{64}$/);
});

test('LidoAdapter: stake 0 报错', async () => {
  const a = new LidoAdapter();
  await assert.rejects(a.stake('0'), /must be > 0/);
});

// =============================================================================
// AaveAdapter
// =============================================================================

test('AaveAdapter: getApy 返回 supply / borrow / utilization', async () => {
  const a = new AaveAdapter();
  const r = await a.getApy('USDC');
  assert.ok(r.supplyApy > 0);
  assert.ok(r.borrowApy >= r.supplyApy);
  assert.ok(r.utilization > 0 && r.utilization < 1);
});

test('AaveAdapter: supply / withdraw + claimRewards', async () => {
  const a = new AaveAdapter();
  const s = await a.supply('USDC', '1000', '0xabc');
  assert.equal(s.aTokenAmount, '1000');
  const w = await a.withdraw('USDC', '500', '0xabc');
  assert.equal(w.actualAmount, '500');
  const c = await a.claimRewards('0xabc');
  assert.equal(c.amount, '0.5');
});

test('AaveAdapter: getBalance 返回字符串', async () => {
  const a = new AaveAdapter();
  const bal = await a.getBalance('0x' + '1'.repeat(40), 'USDC');
  assert.equal(typeof bal, 'string');
  assert.ok(parseFloat(bal) >= 0);
});

// =============================================================================
// CompoundAdapter
// =============================================================================

test('CompoundAdapter: getApy 包含 supply / borrow / comp rewards', async () => {
  const a = new CompoundAdapter();
  const r = await a.getApy('USDC');
  assert.ok(r.supplyApy > 0);
  assert.ok(r.compRewardsApy > 0);
  assert.equal(r.source, 'fallback');
});

test('CompoundAdapter: supply 换 cToken', async () => {
  const a = new CompoundAdapter();
  const s = await a.supply('USDC', '100', '0xabc');
  // exchangeRate 0.02 -> cToken = 100 / 0.02 = 5000
  assert.equal(s.cTokenAmount, '5000.00000000');
});

test('CompoundAdapter: withdraw / claimRewards', async () => {
  const a = new CompoundAdapter();
  const w = await a.withdraw('USDC', '50', '0xabc');
  assert.equal(w.actualAmount, '50');
  const c = await a.claimRewards('0xabc');
  assert.equal(c.amount, '0.3');
});

// =============================================================================
// CurveAdapter
// =============================================================================

test('CurveAdapter: getApy 3pool', async () => {
  const a = new CurveAdapter();
  const r = await a.getApy('3pool');
  assert.ok(r.apyBase > 0);
  assert.ok(r.apyReward > 0);
  assert.equal(r.apy, r.apyBase + r.apyReward);
  assert.equal(r.source, 'fallback');
});

test('CurveAdapter: deposit / withdraw / claim', async () => {
  const a = new CurveAdapter();
  const d = await a.deposit('3pool', '1000', '0xabc');
  assert.equal(d.lpTokenAmount, '990.00000000');
  const w = await a.withdraw('3pool', '100', '0xabc');
  assert.equal(w.actualAmount, '100');
  const c = await a.claimRewards('0xabc');
  assert.equal(c.crvAmount, '1.2');
});

// =============================================================================
// ConvexAdapter
// =============================================================================

test('ConvexAdapter: getApy 包含 base + crv + cvx', async () => {
  const a = new ConvexAdapter();
  const r = await a.getApy('3pool');
  assert.ok(r.apyBase > 0);
  assert.ok(r.apyCrv > 0);
  assert.ok(r.apyCvx > 0);
  assert.equal(r.apy, r.apyBase + r.apyCrv + r.apyCvx);
  assert.equal(r.boost, 1.4);
});

test('ConvexAdapter: deposit / withdraw / claim', async () => {
  const a = new ConvexAdapter();
  const d = await a.deposit('3pool', '100', '0xabc');
  assert.equal(d.wrappedAmount, '100');
  const c = await a.claimRewards('0xabc');
  assert.equal(c.crvAmount, '1.5');
  assert.equal(c.cvxAmount, '0.8');
  assert.equal(c.totalAmount, '2.3');
});

test('ConvexAdapter: calculateBoost 随 LP 增长封顶 2.5', () => {
  const a = new ConvexAdapter();
  assert.equal(a.calculateBoost('0'), 1);
  assert.ok(a.calculateBoost('1000') > 1);
  assert.ok(a.calculateBoost('1000000000') <= 2.5);
});

// =============================================================================
// YieldScanner
// =============================================================================

test('YieldScanner: scanPools 返回非空数组', async () => {
  const s = new YieldScanner();
  const pools = await s.scanPools();
  assert.ok(pools.length >= 5);
  // 验证包含 5 大协议
  const protocols = new Set(pools.map((p) => p.protocol));
  for (const p of ['LIDO', 'AAVE', 'COMPOUND', 'CURVE', 'CONVEX']) {
    assert.ok(protocols.has(p as any), `expected ${p}`);
  }
});

test('YieldScanner: scanPools 按 asset 过滤', async () => {
  const s = new YieldScanner();
  const usdcPools = await s.scanPools('USDC');
  assert.ok(usdcPools.every((p) => p.underlyingAsset === 'USDC' || p.symbol.toUpperCase().includes('USDC')));
});

test('YieldScanner: scanPools 走缓存', async () => {
  const s = new YieldScanner({ enableCache: true });
  const a = await s.scanPools();
  const b = await s.scanPools();
  assert.equal(a.length, b.length);
  assert.ok(s.cacheStats().hits > 0);
});

test('YieldScanner: getBestYield 返回比较结果', async () => {
  const s = new YieldScanner();
  const c = await s.getBestYield('USDC');
  assert.equal(c.asset, 'USDC');
  assert.ok(c.pools.length > 0);
  assert.ok(c.best.apy > 0);
  assert.ok(c.spread >= 0);
  assert.equal(typeof c.average, 'number');
  assert.ok(Array.isArray(c.recommendations));
});

test('YieldScanner: getBestYield 找不到时抛错', async () => {
  const s = new YieldScanner();
  await assert.rejects(s.getBestYield('NONEXISTENT_ASSET_XYZ'), /No pools/);
});

test('YieldScanner: getTopPools 按 APY 排序', async () => {
  const s = new YieldScanner();
  const top = await s.getTopPools(3);
  assert.equal(top.length, 3);
  for (let i = 1; i < top.length; i++) {
    assert.ok(top[i - 1].apy >= top[i].apy);
  }
});

test('YieldScanner: getTopPools 按 riskTier 过滤', async () => {
  const s = new YieldScanner();
  const low = await s.getTopPools(10, 'low');
  assert.ok(low.every((p) => p.riskTier === 'low'));
});

// =============================================================================
// AutoCompounder
// =============================================================================

function makePosition(pendingUsd: number, elapsedMs: number): any {
  const now = Date.now();
  return {
    id: 'pos_test',
    userId: 'u1',
    protocol: 'AAVE' as const,
    pool: {} as any,
    depositedAmount: '1000',
    share: '1000',
    currentValue: '1000',
    earnedAmount: '0',
    apy: 0.05,
    entryTime: now - 86400_000 * 30,
    lastCompoundTime: now - elapsedMs,
    autoCompound: false,
    riskTier: 'low' as const,
    status: 'active' as const,
    pendingRewards: String(pendingUsd),
  };
}

test('AutoCompounder: shouldCompound 通过 - 收益充足 + 间隔够 + gas 正常', () => {
  const c = new AutoCompounder();
  const r = c.shouldCompound({
    position: makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000),
    currentGasGwei: 10,
  });
  assert.equal(r.shouldCompound, true);
  assert.equal(r.reasons.length, 0);
});

test('AutoCompounder: shouldCompound 拦截 - 收益低于 $1', () => {
  const c = new AutoCompounder();
  const r = c.shouldCompound({
    position: makePosition(0.5, COMPOUND_MIN_INTERVAL_MS + 1000),
    currentGasGwei: 10,
  });
  assert.equal(r.shouldCompound, false);
  assert.ok(r.reasons.some((x) => /threshold/.test(x)));
});

test('AutoCompounder: shouldCompound 拦截 - 间隔不足 24h', () => {
  const c = new AutoCompounder();
  const r = c.shouldCompound({
    position: makePosition(2, 1000), // 仅 1 秒
    currentGasGwei: 10,
  });
  assert.equal(r.shouldCompound, false);
  assert.ok(r.reasons.some((x) => /interval/.test(x)));
});

test('AutoCompounder: shouldCompound 拦截 - gas 超过 50 Gwei', () => {
  const c = new AutoCompounder();
  const r = c.shouldCompound({
    position: makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000),
    currentGasGwei: COMPOUND_GAS_PRICE_MAX_GWEI + 1,
  });
  assert.equal(r.shouldCompound, false);
  assert.ok(r.reasons.some((x) => /gas/.test(x)));
});

test('AutoCompounder: compound 注入执行器', async () => {
  const c = new AutoCompounder();
  const calls: string[] = [];
  c.setExecutor(async (pos) => {
    calls.push(pos.id);
    return {
      id: 'mock_act',
      userId: pos.userId,
      positionId: pos.id,
      type: 'compound' as const,
      protocol: pos.protocol,
      amount: pos.pendingRewards,
      status: 'confirmed' as const,
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    };
  });
  const action = await c.compound(makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000));
  assert.equal(calls.length, 1);
  assert.equal(action.id, 'mock_act');
});

test('AutoCompounder: tick 按协议分批', async () => {
  const c = new AutoCompounder();
  let batchCount = 0;
  c.setBatchExecutor(async (positions) => {
    batchCount += 1;
    return positions.map((p) => ({
      id: 'a' + p.id,
      userId: p.userId,
      positionId: p.id,
      type: 'compound' as const,
      protocol: p.protocol,
      amount: p.pendingRewards,
      status: 'confirmed' as const,
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    }));
  });
  c.setExecutor(async (p) => ({
    id: 's' + p.id,
    userId: p.userId,
    positionId: p.id,
    type: 'compound' as const,
    protocol: p.protocol,
    amount: p.pendingRewards,
    status: 'confirmed' as const,
    createdAt: Date.now(),
    confirmedAt: Date.now(),
  }));
  const p1 = makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000);
  const p2 = makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000);
  const p3 = makePosition(2, COMPOUND_MIN_INTERVAL_MS + 1000);
  p3.protocol = 'COMPOUND';
  const acts = await c.tick([p1, p2, p3]);
  // 2 批：AAVE (2) + COMPOUND (1)
  assert.equal(acts.length, 3);
  assert.equal(batchCount, 1);
});

// =============================================================================
// RiskAssessor
// =============================================================================

test('RiskAssessor: assessProtocol 返回完整指标', async () => {
  const r = new RiskAssessor();
  const m = await r.assessProtocol('LIDO');
  assert.equal(m.protocol, 'LIDO');
  assert.ok(m.smartContractRisk >= 0);
  assert.ok(m.auditFirms.length > 0);
  assert.ok(m.overallScore >= 0 && m.overallScore <= 100);
});

test('RiskAssessor: getProtocolRisk 缓存命中 / 未评估返回 null', async () => {
  const r = new RiskAssessor();
  // 评估前：返回 null
  assert.equal(r.getProtocolRisk('AAVE'), null);
  // 评估后：从缓存返回
  const a = await r.assessProtocol('AAVE');
  const b = r.getProtocolRisk('AAVE');
  assert.equal(b, a);
  // 清理后再查询：未评估的协议返回 null
  r.clearCache();
  assert.equal(r.getProtocolRisk('YEARN'), null);
});

test('RiskAssessor: 风险评分与分层一致', async () => {
  const r = new RiskAssessor();
  // Lido 应该是低风险
  const lido = await r.assessProtocol('LIDO');
  assert.ok(lido.overallScore <= 50);
  // UNISWAP 由于无常损失高，整体评分会较高
  const uni = await r.assessProtocol('UNISWAP');
  assert.ok(uni.impermanentLossRisk > 50);
});

// =============================================================================
// YieldEngine
// =============================================================================

test('YieldEngine: deposit 创建仓位', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  assert.equal(pos.userId, 'u1');
  assert.equal(pos.protocol, 'LIDO');
  assert.equal(pos.depositedAmount, '10');
  assert.equal(pos.status, 'active');
});

test('YieldEngine: deposit 金额 <= 0 抛错', async () => {
  const e = new YieldEngine();
  await assert.rejects(e.deposit('u1', 'LIDO', 'stETH', '0'), /must be > 0/);
});

test('YieldEngine: withdraw 提取仓位', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  const action = await e.withdraw(pos.id, '5');
  assert.equal(action.type, 'unstake');
  assert.equal(action.amount, '5');
  const updated = e.getPosition(pos.id)!;
  assert.equal(updated.currentValue, '5.00000000');
  assert.equal(updated.status, 'withdrawing');
});

test('YieldEngine: withdraw 全部 -> status=closed', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  await e.withdraw(pos.id, '10');
  const updated = e.getPosition(pos.id)!;
  assert.equal(updated.status, 'closed');
});

test('YieldEngine: claimRewards 需先有 pending', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  await assert.rejects(e.claimRewards(pos.id), /No pending/);
  // 手动注入 pending
  pos.pendingRewards = '2';
  const action = await e.claimRewards(pos.id);
  assert.equal(action.type, 'claim');
  assert.equal(action.amount, '2');
  assert.equal(pos.pendingRewards, '0');
});

test('YieldEngine: getStats 汇总', async () => {
  const e = new YieldEngine();
  const p1 = await e.deposit('u1', 'LIDO', 'stETH', '100');
  const p2 = await e.deposit('u1', 'AAVE', 'aUSDC', '200');
  p1.earnedAmount = '5';
  p2.earnedAmount = '9';
  const stats = await e.getStats('u1');
  assert.equal(stats.totalDeposited, '300.00000000');
  assert.equal(stats.totalValue, '300.00000000');
  assert.equal(stats.totalEarned, '14.00000000');
  assert.ok(stats.averageApy > 0);
  // byProtocol 包含 LIDO / AAVE
  assert.ok(parseFloat(stats.byProtocol.LIDO.deposited) > 0);
  assert.ok(parseFloat(stats.byProtocol.AAVE.deposited) > 0);
});

test('YieldEngine: recommendBestYield 返回最高收益', async () => {
  const e = new YieldEngine();
  const r = await e.recommendBestYield('u1', 'USDC', '1000');
  assert.ok(r.expectedApy > 0);
  assert.ok(r.reason.length > 0);
});

test('YieldEngine: recommendBestYield 风险偏好过滤', async () => {
  const e = new YieldEngine();
  e.setUserRiskPreference('u1', 'low');
  const r = await e.recommendBestYield('u1', 'USDC', '1000');
  // low 偏好下，结果应该是 low 池
  assert.equal(r.pool.riskTier, 'low');
});

test('YieldEngine: enableAutoCompound / compoundAll 触发', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '1000');
  // 模拟时间流逝（直接修改 lastCompoundTime + 注入 pending）
  pos.lastCompoundTime = Date.now() - (COMPOUND_MIN_INTERVAL_MS + 60_000);
  pos.pendingRewards = '5';
  e.enableAutoCompound(pos.id);
  const actions = await e.compoundAll('u1');
  assert.ok(actions.length >= 1);
  assert.equal(actions[0].type, 'compound');
});

test('YieldEngine: optimizeAllocation 空仓位返回空', async () => {
  const e = new YieldEngine();
  const r = await e.optimizeAllocation('u1');
  assert.equal(r.rebalances.length, 0);
});

test('YieldEngine: optimizeAllocation 找到迁移目标', async () => {
  const e = new YieldEngine();
  // 强制 LIDO APY 较低以触发迁移建议
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '100');
  // 调整当前仓位 APY 模拟低收益
  pos.apy = 0.001;
  const r = await e.optimizeAllocation('u1');
  // 应该至少有一个迁移建议
  assert.ok(r.rebalances.length >= 1);
  assert.notEqual(r.rebalances[0].toProtocol, 'LIDO');
});

test('YieldEngine: migrate 跨协议迁移', async () => {
  const e = new YieldEngine();
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  const newPos = await e.migrate(pos.id, 'AAVE', 'aUSDC');
  assert.equal(newPos.protocol, 'AAVE');
  assert.equal(e.getPosition(pos.id)?.status, 'closed');
  assert.equal(newPos.depositedAmount, '10');
});

test('YieldEngine: onPositionUpdate 事件触发', async () => {
  const e = new YieldEngine();
  const events: string[] = [];
  e.onPositionUpdate((_p, op) => events.push(op));
  const pos = await e.deposit('u1', 'LIDO', 'stETH', '10');
  await e.withdraw(pos.id, '5');
  assert.deepEqual(events, ['deposit', 'withdraw']);
});
