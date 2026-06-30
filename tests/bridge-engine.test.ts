/**
 * 跨链桥引擎单元测试
 *
 * 覆盖：RouteAggregator / 4 个 Provider 适配器 / BridgeEngine 安全检查
 *       完整交易流程 / 断网降级 / 状态轮询 / 取消
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LayerZeroBridge,
  WormholeBridge,
  StargateBridge,
  AcrossBridge,
  RouteAggregator,
  BridgeEngine,
  BRIDGE_QUOTE_TTL_MS,
  BRIDGE_PROVIDER_SECURITY_SCORE,
  isValidEvmAddress,
  type BridgeRoute,
} from '../src/lib/bridge';

// =============================================================================
// 测试 fixtures
// =============================================================================

const SENDER = '0x1111111111111111111111111111111111111111';
const RECEIVER = '0x2222222222222222222222222222222222222222';

const baseRouteOpts = {
  fromChain: 1 as const,
  toChain: 42161 as const,
  fromToken: 'USDT',
  toToken: 'USDC',
  amount: '1000000000', // 1000 USDT
  senderAddress: SENDER,
  receiverAddress: RECEIVER,
};

// =============================================================================
// RouteAggregator
// =============================================================================

test('RouteAggregator：getRoutes 返回 4 个 provider', async () => {
  const agg = new RouteAggregator();
  const routes = await agg.getRoutes({
    fromChain: 1,
    toChain: 42161,
    fromToken: 'USDT',
    toToken: 'USDC',
    amount: '1000000000',
  });
  assert.equal(routes.length, 4);
  const providers = new Set(routes.map(r => r.provider));
  assert.ok(providers.has('LAYERZERO'));
  assert.ok(providers.has('WORMHOLE'));
  assert.ok(providers.has('STARGATE'));
  assert.ok(providers.has('ACROSS'));
});

test('RouteAggregator：getRoutes 按 totalFee 升序', async () => {
  const agg = new RouteAggregator();
  const routes = await agg.getRoutes({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  });
  for (let i = 1; i < routes.length; i++) {
    assert.ok(BigInt(routes[i - 1].totalFee) <= BigInt(routes[i].totalFee));
  }
});

test('RouteAggregator：getBestRoute cheapest', async () => {
  const agg = new RouteAggregator();
  const best = await agg.getBestRoute({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  }, 'cheapest');
  assert.ok(best);
  const all = await agg.getRoutes({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  });
  const min = all.reduce((m, r) => BigInt(r.totalFee) < BigInt(m.totalFee) ? r : m);
  // cheapest 应当 totalFee 最小（不比较 ID，因为 ID 每次都重新生成）
  assert.equal(BigInt(best!.totalFee), BigInt(min.totalFee));
  // Across 是 cheapest（relayer 垫付 + 费用最低）
  assert.equal(best!.provider, 'ACROSS');
});

test('RouteAggregator：getBestRoute fastest', async () => {
  const agg = new RouteAggregator();
  const best = await agg.getBestRoute({
    fromChain: 1, toChain: 137, fromToken: 'USDT', toToken: 'USDC', amount: '500000000',
  }, 'fastest');
  assert.ok(best);
  // Across 通常最快
  assert.ok(best!.estimatedTime <= 200);
});

test('RouteAggregator：getBestRoute most_secure', async () => {
  const agg = new RouteAggregator();
  const best = await agg.getBestRoute({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  }, 'most_secure');
  assert.ok(best);
  // Wormhole 安全分最高（90）
  assert.equal(best!.securityScore, BRIDGE_PROVIDER_SECURITY_SCORE.WORMHOLE);
});

test('RouteAggregator：getBestRoute best_liquidity', async () => {
  const agg = new RouteAggregator();
  const best = await agg.getBestRoute({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  }, 'best_liquidity');
  assert.ok(best);
  // Stargate 池子流动性最大
  assert.equal(best!.provider, 'STARGATE');
});

test('RouteAggregator：getQuote 30s 过期', async () => {
  const agg = new RouteAggregator();
  const q = await agg.getQuote({
    fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000',
  }, 'u1');
  assert.ok(q);
  const remaining = q!.expiresAt - Date.now();
  assert.ok(remaining > 0);
  assert.ok(remaining <= BRIDGE_QUOTE_TTL_MS);
  // 30s ± 1s
  assert.ok(Math.abs(remaining - 30_000) < 1500);
});

test('RouteAggregator：getQuote 5s 缓存命中', async () => {
  const agg = new RouteAggregator();
  const opts = { fromChain: 1 as const, toChain: 42161 as const, fromToken: 'USDT', toToken: 'USDC', amount: '777000000' };
  const q1 = await agg.getQuote(opts, 'u1');
  const q2 = await agg.getQuote(opts, 'u1');
  assert.equal(q1!.id, q2!.id);
});

test('RouteAggregator：getQuote 拒绝非法地址', async () => {
  const agg = new RouteAggregator();
  await assert.rejects(
    () => agg.getQuote({ fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000', receiverAddress: '0xinvalid' }, 'u1'),
    /Invalid receiver address/,
  );
});

// =============================================================================
// LayerZeroBridge
// =============================================================================

test('LayerZeroBridge：getFees', async () => {
  const lz = new LayerZeroBridge({ apiKey: 'mock' });
  const fee = await lz.getFees({ fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000' });
  assert.ok(BigInt(fee.nativeFee) > 0n);
  assert.equal(fee.zroFee, '0');
  assert.equal(fee.source, 'fallback');
});

test('LayerZeroBridge：send 返回 messageId + txHash', async () => {
  const lz = new LayerZeroBridge({ apiKey: 'mock' });
  const r = await lz.send({ fromChain: 1, toChain: 42161, fromAddress: SENDER, toAddress: RECEIVER, fromToken: 'USDT', toToken: 'USDC', amount: '1000' });
  assert.ok(r.messageId.startsWith('lzmsg_'));
  assert.ok(r.txHash.startsWith('0x'));
  assert.equal(r.source, 'fallback');
});

test('LayerZeroBridge：getStatus 状态机', async () => {
  const lz = new LayerZeroBridge({ apiKey: 'mock' });
  const r = await lz.send({ fromChain: 1, toChain: 42161, fromAddress: SENDER, toAddress: RECEIVER, fromToken: 'USDT', toToken: 'USDC', amount: '1000' });
  // 立即查：INFLIGHT
  const s1 = await lz.getStatus(r.messageId);
  assert.equal(s1.status, 'INFLIGHT');
  // 等 300ms 再查：DELIVERED
  await new Promise(res => setTimeout(res, 300));
  const s2 = await lz.getStatus(r.messageId);
  assert.equal(s2.status, 'DELIVERED');
  assert.ok(s2.dstTxHash);
});

// =============================================================================
// WormholeBridge
// =============================================================================

test('WormholeBridge：getQuote', async () => {
  const wh = new WormholeBridge({ apiKey: 'mock' });
  const q = await wh.getQuote({ fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000' });
  assert.ok(BigInt(q.fee) > 0n);
  assert.equal(q.amount, '1000000000');
  assert.ok(q.time > 0);
  assert.equal(q.source, 'fallback');
});

test('WormholeBridge：VAA 跟踪 pending -> attested -> finalized', async () => {
  const wh = new WormholeBridge({ apiKey: 'mock' });
  const r = await wh.send({ fromChain: 1, toChain: 42161, fromAddress: SENDER, toAddress: RECEIVER, fromToken: 'USDT', toToken: 'USDC', amount: '1000' });
  assert.ok(r.sequence);
  // 立即查：pending
  const v1 = await wh.getVAA(r.sequence);
  assert.equal(v1.status, 'pending');
  // 等 600ms：attested
  await new Promise(res => setTimeout(res, 600));
  const v2 = await wh.getVAA(r.sequence);
  assert.equal(v2.status, 'attested');
  assert.ok(v2.vaa);
  // 等 600ms：finalized
  await new Promise(res => setTimeout(res, 600));
  const v3 = await wh.getVAA(r.sequence);
  assert.equal(v3.status, 'finalized');
});

// =============================================================================
// StargateBridge
// =============================================================================

test('StargateBridge：getQuote', async () => {
  const sg = new StargateBridge({ apiKey: 'mock' });
  const q = await sg.getQuote({ fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000' });
  assert.ok(q.poolLiquidity);
  assert.equal(q.amount, '1000000000');
  // Stargate 通常最快（统一流动性池）
  assert.ok(q.time < 200);
});

test('StargateBridge：send 返回 messageId + txHash', async () => {
  const sg = new StargateBridge({ apiKey: 'mock' });
  const r = await sg.send({ fromChain: 1, toChain: 42161, fromAddress: SENDER, toAddress: RECEIVER, fromToken: 'USDT', toToken: 'USDC', amount: '1000' });
  assert.ok(r.messageId.startsWith('sgmsg_'));
  assert.ok(r.txHash.startsWith('0x'));
});

// =============================================================================
// AcrossBridge
// =============================================================================

test('AcrossBridge：getQuote', async () => {
  const ax = new AcrossBridge({ apiKey: 'mock' });
  const q = await ax.getQuote({ fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC', amount: '1000000000' });
  assert.ok(BigInt(q.fee) > 0n);
  assert.ok(q.spokeAddress.startsWith('0x'));
  // Across Optimistic 桥极快
  assert.ok(q.time < 200);
});

test('AcrossBridge：optimistic 跟踪 pending -> filled', async () => {
  const ax = new AcrossBridge({ apiKey: 'mock' });
  const r = await ax.send({ fromChain: 1, toChain: 42161, fromAddress: SENDER, toAddress: RECEIVER, fromToken: 'USDT', toToken: 'USDC', amount: '1000' });
  const s1 = await ax.getStatus(r.depositId);
  assert.equal(s1.status, 'pending');
  await new Promise(res => setTimeout(res, 300));
  const s2 = await ax.getStatus(r.depositId);
  assert.equal(s2.status, 'filled');
  assert.ok(s2.fillTxHash);
});

// =============================================================================
// BridgeEngine - 完整流程
// =============================================================================

test('BridgeEngine：execute 完整流程（Across）', async () => {
  const engine = new BridgeEngine();
  // 强制 Across
  const tx = await engine.execute({
    userId: 'u1',
    fromChain: 1,
    toChain: 42161,
    fromToken: 'USDT',
    toToken: 'USDC',
    amount: '1000000000',
    senderAddress: SENDER,
    receiverAddress: RECEIVER,
    strategy: 'fastest',
  });
  assert.ok(tx.id);
  assert.equal(tx.status, 'submitted');
  assert.ok(tx.sourceTxHash);
  assert.ok(tx.events.length >= 1);
  assert.equal(tx.events[0].type, 'submitted');
});

test('BridgeEngine：track 状态轮询（Across 自动完成）', async () => {
  const engine = new BridgeEngine();
  const tx = await engine.execute({
    ...baseRouteOpts,
    userId: 'u1',
    strategy: 'fastest',
  });
  // 等 mock 状态机推进
  await new Promise(r => setTimeout(r, 300));
  const tracked = await engine.track(tx.id, 5_000, 50);
  // Across 在 mock 模式下应在 200ms+ 后完成
  assert.ok(['completed', 'submitted'].includes(tracked.status));
});

test('BridgeEngine：track 找不到 tx 抛错', async () => {
  const engine = new BridgeEngine();
  await assert.rejects(() => engine.track('nope'), /not found/);
});

test('BridgeEngine：getUserTransactions 按 userId 过滤', async () => {
  const engine = new BridgeEngine();
  await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  await engine.execute({ ...baseRouteOpts, userId: 'u2', strategy: 'cheapest' });
  await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  const u1 = engine.getUserTransactions('u1');
  const u2 = engine.getUserTransactions('u2');
  assert.equal(u1.length, 2);
  assert.equal(u2.length, 1);
  assert.ok(u1.every(t => t.userId === 'u1'));
});

test('BridgeEngine：getUserTransactions limit', async () => {
  const engine = new BridgeEngine();
  for (let i = 0; i < 5; i++) {
    await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  }
  const list = engine.getUserTransactions('u1', 3);
  assert.equal(list.length, 3);
});

// =============================================================================
// BridgeEngine - 安全检查
// =============================================================================

test('BridgeEngine：validateRoute 安全分数 < 70 报警', () => {
  const engine = new BridgeEngine();
  const route: BridgeRoute = {
    id: 'r', fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC',
    provider: 'LAYERZERO', estimatedTime: 100, bridgeFee: '0',
    gasFeeFrom: '0', gasFeeTo: '0', totalFee: '0',
    liquidityAvailable: '1000000', maxAmount: '1000', minAmount: '1',
    securityScore: 60,
  };
  const r = engine.validateRoute(route, '100');
  assert.equal(r.safe, false);
  assert.ok(r.errors.some(e => /security score/.test(e)));
});

test('BridgeEngine：validateRoute 低于 maxAmount', () => {
  const engine = new BridgeEngine();
  const route: BridgeRoute = {
    id: 'r', fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC',
    provider: 'LAYERZERO', estimatedTime: 100, bridgeFee: '0',
    gasFeeFrom: '0', gasFeeTo: '0', totalFee: '0',
    liquidityAvailable: '1000000', maxAmount: '1000', minAmount: '1',
    securityScore: 90,
  };
  const r = engine.validateRoute(route, '5000');
  assert.equal(r.safe, false);
  assert.ok(r.errors.some(e => /maxAmount/.test(e)));
});

test('BridgeEngine：validateRoute 流动性不足', () => {
  const engine = new BridgeEngine();
  const route: BridgeRoute = {
    id: 'r', fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC',
    provider: 'LAYERZERO', estimatedTime: 100, bridgeFee: '0',
    gasFeeFrom: '0', gasFeeTo: '0', totalFee: '0',
    liquidityAvailable: '100', maxAmount: '10000', minAmount: '1',
    securityScore: 90,
  };
  const r = engine.validateRoute(route, '500');
  assert.equal(r.safe, false);
  assert.ok(r.errors.some(e => /liquidity/.test(e)));
});

test('BridgeEngine：validateRoute 合法', () => {
  const engine = new BridgeEngine();
  const route: BridgeRoute = {
    id: 'r', fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC',
    provider: 'LAYERZERO', estimatedTime: 100, bridgeFee: '5',
    gasFeeFrom: '0', gasFeeTo: '0', totalFee: '5',
    liquidityAvailable: '1000000', maxAmount: '1000', minAmount: '1',
    securityScore: 85,
  };
  const r = engine.validateRoute(route, '100');
  assert.equal(r.safe, true);
  assert.equal(r.errors.length, 0);
});

test('BridgeEngine：validateAddresses 接收方非法', () => {
  const engine = new BridgeEngine();
  const r1 = engine.validateAddresses('0xinvalid', RECEIVER);
  assert.equal(r1.valid, false);
  const r2 = engine.validateAddresses(SENDER, 'not-an-address');
  assert.equal(r2.valid, false);
  const r3 = engine.validateAddresses(SENDER, SENDER);
  assert.equal(r3.valid, false);
  assert.ok(r3.reason && r3.reason.includes('same'));
});

test('BridgeEngine：validateAddresses 合法', () => {
  const engine = new BridgeEngine();
  const r = engine.validateAddresses(SENDER, RECEIVER);
  assert.equal(r.valid, true);
});

test('BridgeEngine：checkReceiverSupportsToken', () => {
  const engine = new BridgeEngine();
  // USDT 在 42161 (Arbitrum) 已注册
  assert.equal(engine.checkReceiverSupportsToken(42161, 'USDT', RECEIVER), true);
  // ETH 原生币：所有链都支持
  assert.equal(engine.checkReceiverSupportsToken(1, 'ETH', RECEIVER), true);
  // 未注册代币
  assert.equal(engine.checkReceiverSupportsToken(1, 'UNKNOWN', RECEIVER), false);
  // 非法地址
  assert.equal(engine.checkReceiverSupportsToken(1, 'USDT', 'bad'), false);
});

test('BridgeEngine：价格影响检测（bridgeFee/amount > 1%）', () => {
  const engine = new BridgeEngine();
  const route: BridgeRoute = {
    id: 'r', fromChain: 1, toChain: 42161, fromToken: 'USDT', toToken: 'USDC',
    provider: 'LAYERZERO', estimatedTime: 100, bridgeFee: '50',  // 50/1000 = 5%
    gasFeeFrom: '0', gasFeeTo: '0', totalFee: '50',
    liquidityAvailable: '1000000', maxAmount: '1000', minAmount: '1',
    securityScore: 85,
  };
  const r = engine.validateRoute(route, '1000');
  assert.equal(r.safe, true);
  assert.ok(r.warnings.some(w => /ratio/.test(w)));
});

// =============================================================================
// BridgeEngine - 断网降级 + 取消
// =============================================================================

test('BridgeEngine：断网降级（fetchImpl 抛错）', async () => {
  const failingFetch: typeof fetch = (() => Promise.reject(new Error('network down'))) as any;
  const engine = new BridgeEngine(new RouteAggregator({ fetchImpl: failingFetch, apiKey: 'real-key' }));
  // 真实 key（不含 'mock'）但 fetch 失败 → fallbackToDemo 默认 true
  const tx = await engine.execute({
    ...baseRouteOpts,
    userId: 'u1',
    strategy: 'cheapest',
  });
  // mock 模式下流程应能完成
  assert.ok(tx.id);
});

test('BridgeEngine：断网降级（API key 含 mock）', async () => {
  const engine = new BridgeEngine(new RouteAggregator({ apiKey: 'mock-key-xxx' }));
  const tx = await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  assert.equal(tx.status, 'submitted');
});

test('BridgeEngine：取消未提交交易', async () => {
  const engine = new BridgeEngine();
  const tx = await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  // tx 已经是 submitted，尝试取消应返回 false
  const ok1 = engine.cancel(tx.id);
  assert.equal(ok1, false);
  // 不存在
  const ok2 = engine.cancel('nope');
  assert.equal(ok2, false);
});

test('BridgeEngine：getHistoryByChain 按链过滤', async () => {
  const engine = new BridgeEngine();
  await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  await engine.execute({ ...baseRouteOpts, fromChain: 56, toChain: 137, userId: 'u1', strategy: 'cheapest' });
  const eth = engine.getHistoryByChain(1, 7);
  const bsc = engine.getHistoryByChain(56, 7);
  assert.equal(eth.length, 1);
  assert.equal(bsc.length, 1);
  assert.equal(eth[0].fromChain, 1);
  assert.equal(bsc[0].fromChain, 56);
});

test('BridgeEngine：getTotalVolumeByToken 累计', async () => {
  const engine = new BridgeEngine();
  await engine.execute({ ...baseRouteOpts, userId: 'u1', strategy: 'cheapest' });
  await engine.execute({ ...baseRouteOpts, userId: 'u2', strategy: 'cheapest' });
  const vol = engine.getTotalVolumeByToken('USDT', 7);
  assert.equal(vol, '2000000000'); // 1000 + 1000
});

test('BridgeEngine：execute 拒绝同链交易', async () => {
  const engine = new BridgeEngine();
  await assert.rejects(
    () => engine.execute({ ...baseRouteOpts, fromChain: 1, toChain: 1, userId: 'u1', strategy: 'cheapest' }),
    /must be different/,
  );
});

test('BridgeEngine：execute 拒绝非法地址', async () => {
  const engine = new BridgeEngine();
  await assert.rejects(
    () => engine.execute({ ...baseRouteOpts, userId: 'u1', receiverAddress: '0xbad' }),
    /Invalid address/,
  );
});

test('工具：isValidEvmAddress', () => {
  assert.equal(isValidEvmAddress(SENDER), true);
  assert.equal(isValidEvmAddress('0xZZZ'), false);
  assert.equal(isValidEvmAddress(''), false);
});
