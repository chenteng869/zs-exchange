/**
 * 监控告警系统单元测试（M-06 + M-07）
 *
 * 覆盖：
 *  - AlertEngine：触发、cooldown、resolved 自动切换、订阅事件
 *  - MetricsCollector：滑动窗口、RPC / 价格 / 区块 / WS 统计
 *  - 内置规则：RPC_LATENCY_ETH、PRICE_DEVIATION_BTC、WS_DISCONNECTED 等
 *  - Notifier：Console / Log / Webhook
 *  - MonitoringService：start / stop / 自定义规则
 *
 * 运行：npx tsx tests/monitoring.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AlertEngine,
  MetricsCollector,
  SlidingWindow,
  ConsoleNotifier,
  LogNotifier,
  WebhookNotifier,
  MultiNotifier,
  MonitoringService,
  createBuiltinRules,
  createMonitoringService,
  DEFAULT_THRESHOLDS,
  percentile,
  mean,
  type Alert,
  type AlertRule,
  type LoggerLike,
} from '../src/lib/monitoring';

// =============================================================================
// 1. AlertEngine
// =============================================================================

test('AlertEngine: evaluate 触发规则', async () => {
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  let flag = false;
  const rule: AlertRule = {
    id: 'TEST_RULE',
    description: 'test',
    severity: 'P1',
    evaluator: () => flag,
  };
  engine.addRule(rule);

  const alerts: Alert[] = [];
  engine.onAlert((a) => { alerts.push(a); });

  flag = true;
  await engine.evaluate();
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].rule, 'TEST_RULE');
  assert.equal(alerts[0].status, 'firing');
  assert.equal(alerts[0].severity, 'P1');

  const active = engine.getActiveAlerts();
  assert.equal(active.length, 1);
});

test('AlertEngine: cooldown 抑制重复告警', async () => {
  let now = 1_000_000;
  const engine = new AlertEngine({
    defaultCooldownMs: 60_000,
    now: () => now,
  });
  let shouldFire = false;
  const rule: AlertRule = {
    id: 'COOLDOWN_RULE',
    description: 'cooldown test',
    severity: 'P1',
    cooldownMs: 60_000,
    evaluator: () => shouldFire,
  };
  engine.addRule(rule);

  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });

  // 第一次：触发 firing
  shouldFire = true;
  await engine.evaluate();
  assert.equal(fired.length, 1);
  assert.equal(fired[0].status, 'firing');

  // 立即再评估（仍在 firing）：不发新事件
  await engine.evaluate();
  assert.equal(fired.length, 1);

  // resolved
  shouldFire = false;
  await engine.evaluate();
  assert.equal(fired.length, 2);
  assert.equal(fired[1].status, 'resolved');

  // cooldown 期内再次触发：抑制
  shouldFire = true;
  await engine.evaluate();
  assert.equal(fired.length, 2, 'cooldown 期内不重新触发');

  // cooldown 边界（恰好 60s）：仍抑制
  now += 60_000;
  shouldFire = true;
  await engine.evaluate();
  assert.equal(fired.length, 2, 'cooldown 边界仍抑制');

  // 60.001s 后：可重新触发
  now += 1;
  shouldFire = true;
  await engine.evaluate();
  assert.equal(fired.length, 3, 'cooldown 后允许再次触发');
  assert.equal(fired[2].status, 'firing');
});

test('AlertEngine: resolved 状态自动切换', async () => {
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  let shouldFire = true;
  engine.addRule({
    id: 'AUTO_RESOLVE',
    description: 'auto resolve',
    severity: 'P2',
    evaluator: () => shouldFire,
  });

  const events: Alert[] = [];
  engine.onAlert((a) => { events.push(a); });

  // 第一次：触发
  await engine.evaluate();
  assert.equal(events.length, 1);
  assert.equal(events[0].status, 'firing');
  assert.equal(engine.getActiveAlerts().length, 1);

  // 条件变为 false：自动 resolved
  shouldFire = false;
  await engine.evaluate();
  assert.equal(events.length, 2);
  assert.equal(events[1].status, 'resolved');
  assert.equal(engine.getActiveAlerts().length, 0);
  assert.equal(engine.getResolvedAlerts().length, 1);
});

test('AlertEngine: 多个 handler 并行接收', async () => {
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  const rule: AlertRule = {
    id: 'MULTI_HANDLER',
    description: 'multi handler',
    severity: 'P0',
    evaluator: () => true,
  };
  engine.addRule(rule);

  const received1: Alert[] = [];
  const received2: Alert[] = [];
  engine.onAlert((a) => { received1.push(a); });
  engine.onAlert((a) => { received2.push(a); });

  await engine.evaluate();
  // 两个 handler 都应收到告警
  assert.equal(received1.length, 1);
  assert.equal(received2.length, 1);
  assert.equal(received1[0].id, received2[0].id, 'same alert id');
});

test('AlertEngine: 异步 evaluator 支持', async () => {
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  engine.addRule({
    id: 'ASYNC_RULE',
    description: 'async evaluator',
    severity: 'P1',
    evaluator: async () => {
      await new Promise(r => setTimeout(r, 10));
      return true;
    },
  });
  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });
  await engine.evaluate();
  assert.equal(fired.length, 1);
  assert.equal(fired[0].status, 'firing');
  assert.equal(fired[0].severity, 'P1');
});
// =============================================================================
// 2. MetricsCollector
// =============================================================================

test('MetricsCollector: 滑动窗口大小限制', () => {
  const w = new SlidingWindow<number>(5);
  for (let i = 0; i < 10; i++) w.push(i);
  assert.equal(w.size(), 5);
  const v = w.values();
  assert.equal(v[0], 5);
  assert.equal(v[4], 9);
});

test('MetricsCollector: RPC 延迟统计与 P50/P99', () => {
  const mc = new MetricsCollector({ windowSize: 100 });
  for (let i = 1; i <= 100; i++) {
    mc.recordRpcSuccess('ETH', 'node-A', i * 10);
  }
  const stats = mc.getNodeLatencyStats('ETH', 'node-A');
  assert.equal(stats.count, 100);
  assert.equal(stats.max, 1000);
  assert.ok(stats.p50 >= 500 && stats.p50 <= 510, `p50=${stats.p50}`);
  assert.ok(stats.p99 >= 990 && stats.p99 <= 1000, `p99=${stats.p99}`);
});

test('MetricsCollector: 链级平均延迟跨节点聚合', () => {
  const mc = new MetricsCollector();
  mc.recordRpcSuccess('BSC', 'a', 100);
  mc.recordRpcSuccess('BSC', 'b', 200);
  mc.recordRpcSuccess('BSC', 'c', 300);
  const avg = mc.getChainAverageLatency('BSC');
  assert.equal(avg, 200);
  const chain = mc.getChainLatencyStats('BSC');
  assert.equal(chain.count, 3);
  assert.equal(chain.mean, 200);
});

test('MetricsCollector: 连续失败计数与重置', () => {
  const mc = new MetricsCollector();
  mc.recordRpcFailure('ETH', 'n1', 'timeout');
  mc.recordRpcFailure('ETH', 'n1', 'timeout');
  assert.equal(mc.getConsecutiveFailures('ETH', 'n1'), 2);
  mc.recordRpcFailure('ETH', 'n1', 'timeout');
  assert.equal(mc.getConsecutiveFailures('ETH', 'n1'), 3);
  // 成功一次重置
  mc.recordRpcSuccess('ETH', 'n1', 50);
  assert.equal(mc.getConsecutiveFailures('ETH', 'n1'), 0);
});

test('MetricsCollector: 价格偏离度计算', () => {
  const mc = new MetricsCollector();
  mc.recordPrice('BTC/USDT', 65000, 'binance');
  mc.recordPrice('BTC/USDT', 65200, 'okx');     // 0.3% 偏离
  mc.recordPrice('BTC/USDT', 64000, 'coinbase'); // 1.5% 偏离
  const d = mc.getPriceDeviation('BTC/USDT');
  assert.equal(d.sources, 3);
  assert.equal(d.min, 64000);
  assert.equal(d.max, 65200);
  // (65200 - 64000) / 64000 ≈ 0.01875
  assert.ok(d.deviation > 0.018 && d.deviation < 0.019, `deviation=${d.deviation}`);
});

test('MetricsCollector: 价格变化率（spike 检测）', () => {
  const mc = new MetricsCollector();
  const base = 1_000_000;
  // 30 个样本，模拟 30s 内从 100 -> 110（10% 变化）
  for (let i = 0; i < 30; i++) {
    mc.recordPrice('ETH/USDT', 100 + (i / 30) * 10, 'binance');
  }
  const ratio = mc.getPriceChangeRatio('ETH/USDT', 60_000);
  assert.ok(ratio > 0.09, `change ratio=${ratio}`);
});

test('MetricsCollector: 区块未更新时长', () => {
  let now = 1_000_000;
  const mc = new MetricsCollector({ now: () => now });
  mc.recordBlock('ETH', 100);
  now += 1000; // 1 秒后
  assert.equal(mc.getBlockUpdateAgeMs('ETH'), 1000);
  now += 60_000;
  assert.equal(mc.getBlockUpdateAgeMs('ETH'), 61_000);
});

test('MetricsCollector: WebSocket 断开持续时长', () => {
  let now = 1_000_000;
  const mc = new MetricsCollector({ now: () => now });
  mc.recordWsStatus('binance', 'connected');
  now += 5_000;
  mc.recordWsStatus('binance', 'disconnected');
  now += 12_000;
  assert.equal(mc.isWsDisconnected('binance'), true);
  assert.equal(mc.getWsDisconnectDurationMs('binance'), 12_000);

  // 重新连接
  now += 1_000;
  mc.recordWsStatus('binance', 'connected');
  assert.equal(mc.isWsDisconnected('binance'), false);
  assert.equal(mc.getWsDisconnectDurationMs('binance'), 0);
});

// =============================================================================
// 3. 内置规则
// =============================================================================

test('Rules: RPC_LATENCY_ETH 触发逻辑', async () => {
  const mc = new MetricsCollector();
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  // 注入 3500ms 延迟（> 3000ms 阈值）
  for (let i = 0; i < 10; i++) mc.recordRpcSuccess('ETH', 'n1', 3500);
  for (const r of createBuiltinRules(mc)) engine.addRule(r);

  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });

  await engine.evaluate();
  const latencyAlert = fired.find(a => a.rule === 'RPC_LATENCY_ETH');
  assert.ok(latencyAlert, 'RPC_LATENCY_ETH should fire');
  assert.equal(latencyAlert!.severity, 'P1');
  assert.equal(latencyAlert!.context.chain, 'ETH');
  assert.equal(latencyAlert!.context.thresholdMs, DEFAULT_THRESHOLDS.ethRpcLatencyMs);
});

test('Rules: RPC_DOWN_ETH 在连续 3 次失败后触发', async () => {
  const mc = new MetricsCollector();
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  // 先打 2 次成功（让 n1 成为主节点）
  mc.recordRpcSuccess('ETH', 'n1', 100);
  mc.recordRpcSuccess('ETH', 'n1', 100);
  // 3 次连续失败
  mc.recordRpcFailure('ETH', 'n1', 'timeout');
  mc.recordRpcFailure('ETH', 'n1', 'timeout');
  mc.recordRpcFailure('ETH', 'n1', 'timeout');

  for (const r of createBuiltinRules(mc)) engine.addRule(r);

  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });
  await engine.evaluate();

  const downAlert = fired.find(a => a.rule === 'RPC_DOWN_ETH');
  assert.ok(downAlert, 'RPC_DOWN_ETH should fire');
  assert.equal(downAlert!.severity, 'P0');
  assert.equal(downAlert!.context.consecutiveFailures, 3);
});

test('Rules: BLOCK_STALE_BSC 在 2 分钟无区块后触发', async () => {
  let now = 1_000_000;
  const mc = new MetricsCollector({ now: () => now });
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  mc.recordBlock('BSC', 100);
  now += 3 * 60 * 1000; // 3 分钟

  for (const r of createBuiltinRules(mc)) engine.addRule(r);
  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });
  await engine.evaluate();
  const stale = fired.find(a => a.rule === 'BLOCK_STALE_BSC');
  assert.ok(stale, 'BLOCK_STALE_BSC should fire');
  assert.equal(stale!.severity, 'P1');
});

test('Rules: PRICE_DEVIATION_BTC 在多源偏离 > 3% 时触发', async () => {
  const mc = new MetricsCollector();
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  mc.recordPrice('BTC/USDT', 65_000, 'binance');
  mc.recordPrice('BTC/USDT', 67_500, 'okx'); // ~3.85% 偏离

  for (const r of createBuiltinRules(mc)) engine.addRule(r);
  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });
  await engine.evaluate();

  const dev = fired.find(a => a.rule === 'PRICE_DEVIATION_BTC');
  assert.ok(dev, 'PRICE_DEVIATION_BTC should fire');
  assert.equal(dev!.severity, 'P1');
  assert.equal(dev!.context.symbol, 'BTC/USDT');
  assert.equal(dev!.context.sources, 2);
});

test('Rules: PRICE_SPIKE_ETH 在 1 分钟内涨幅 > 5% 时触发', async () => {
  let now = 1_000_000;
  const mc = new MetricsCollector({ now: () => now });
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  mc.recordPrice('ETH/USDT', 3000, 'binance');
  now += 30_000;
  mc.recordPrice('ETH/USDT', 3200, 'binance'); // 6.67% 涨

  for (const r of createBuiltinRules(mc)) engine.addRule(r);
  const fired: Alert[] = [];
  engine.onAlert((a) => { fired.push(a); });
  await engine.evaluate();

  const spike = fired.find(a => a.rule === 'PRICE_SPIKE_ETH');
  assert.ok(spike, 'PRICE_SPIKE_ETH should fire');
  assert.equal(spike!.severity, 'P0');
});

test('Rules: WS_DISCONNECTED 在断开 > 10s 触发', async () => {
  let now = 1_000_000;
  const mc = new MetricsCollector({ now: () => now });
  const engine = new AlertEngine({ defaultCooldownMs: 0 });
  mc.recordWsStatus('binance', 'connected');
  now += 15_000;
  mc.recordWsStatus('binance', 'disconnected');
  now += 5_000; // 共 5s 断开，不触发

  for (const r of createBuiltinRules(mc, undefined, ['BTC/USDT', 'ETH/USDT'], ['binance'])) {
    engine.addRule(r);
  }

  const fired1: Alert[] = [];
  engine.onAlert((a) => { fired1.push(a); });
  await engine.evaluate();
  assert.equal(fired1.find(a => a.rule === 'WS_DISCONNECTED_BINANCE'), undefined);

  // 再过 10s，共 15s 断开
  now += 10_000;
  await engine.evaluate();
  const wsAlert = fired1.find(a => a.rule === 'WS_DISCONNECTED_BINANCE');
  assert.ok(wsAlert, 'WS_DISCONNECTED_BINANCE should fire');
  assert.equal(wsAlert!.severity, 'P1');
});

// =============================================================================
// 4. Notifier
// =============================================================================

test('ConsoleNotifier: 输出到自定义流', () => {
  const outLines: string[] = [];
  const errLines: string[] = [];
  const cn = new ConsoleNotifier({
    color: false,
    stdout: (line) => outLines.push(line),
    stderr: (line) => errLines.push(line),
  });
  // P2 firing → stdout
  cn.notify({
    id: 'a1',
    rule: 'TEST',
    severity: 'P2',
    status: 'firing',
    message: 'hello',
    context: { foo: 1 },
    firedAt: Date.now(),
  });
  assert.equal(outLines.length, 1);
  assert.ok(outLines[0].includes('P2'), 'contains P2');
  assert.ok(outLines[0].includes('FIRING'), 'contains FIRING');
  assert.ok(outLines[0].includes('TEST'), 'contains rule id');
  assert.ok(outLines[0].includes('hello'), 'contains message');

  // P0 firing → stderr
  cn.notify({
    id: 'a2',
    rule: 'CRIT',
    severity: 'P0',
    status: 'firing',
    message: 'critical',
    context: {},
    firedAt: Date.now(),
  });
  assert.equal(errLines.length, 1);
  assert.ok(errLines[0].includes('CRIT'));
});

test('LogNotifier: 写入 logger', () => {
  const captured: { level: string; msg: string }[] = [];
  const logger: LoggerLike = {
    debug: (m) => captured.push({ level: 'debug', msg: String(m) }),
    info: (m) => captured.push({ level: 'info', msg: String(m) }),
    warn: (m) => captured.push({ level: 'warn', msg: String(m) }),
    error: (m) => captured.push({ level: 'error', msg: String(m) }),
  };
  const ln = new LogNotifier({ logger });
  ln.notify({
    id: 'x',
    rule: 'L',
    severity: 'P0',
    status: 'firing',
    message: 'critical',
    context: {},
    firedAt: 0,
  });
  assert.equal(captured.length, 1);
  assert.equal(captured[0].level, 'error', 'P0 firing -> error');
  assert.ok(captured[0].msg.includes('critical'));
});

test('WebhookNotifier: 转换为正确格式', async () => {
  let received: { url: string; body: any } | null = null;
  const fetchMock = (async (url: any, init?: RequestInit) => {
    received = { url: url.toString(), body: JSON.parse(init!.body as string) };
    return { ok: true, status: 200, statusText: 'OK', text: async () => '', json: async () => ({}) } as Response;
  }) as typeof fetch;

  const wn = new WebhookNotifier({
    url: 'https://example.com/webhook',
    format: 'generic',
    fetchImpl: fetchMock,
  });
  await wn.notify({
    id: '1',
    rule: 'WX',
    severity: 'P1',
    status: 'firing',
    message: 'wx test',
    context: { x: 1 },
    firedAt: 1_700_000_000_000,
  });
  assert.ok(received);
  assert.equal(received!.url, 'https://example.com/webhook');
  assert.equal(received!.body.severity, 'P1');
  assert.equal(received!.body.rule, 'WX');
});

test('MultiNotifier: 多个 notifier 并行调用', async () => {
  let n1 = 0, n2 = 0;
  const m = new MultiNotifier([
    { name: 'a', notify: () => { n1++; } },
    { name: 'b', notify: () => { n2++; } },
  ]);
  await m.notify({
    id: '1', rule: 'X', severity: 'P2', status: 'firing',
    message: '', context: {}, firedAt: 0,
  });
  assert.equal(n1, 1);
  assert.equal(n2, 1);
  assert.equal(m.size(), 2);
});

// =============================================================================
// 5. MonitoringService
// =============================================================================

test('MonitoringService: start / stop', async () => {
  const m = createMonitoringService({ autoStart: false, evaluateIntervalMs: 30 });
  assert.equal(m.isRunning(), false);
  m.start();
  assert.equal(m.isRunning(), true);
  m.stop();
  assert.equal(m.isRunning(), false);
});

test('MonitoringService: 周期性 tick 触发内置规则', async () => {
  let now = 1_000_000;
  const m = new MonitoringService({
    autoStart: false,
    evaluateIntervalMs: 20,
    notifier: {
      name: 'capture',
      notify: () => { /* 静默 */ },
    },
    metrics: new MetricsCollector({ now: () => now }),
    engine: new AlertEngine({ defaultCooldownMs: 0, now: () => now }),
  });
  // 注入高延迟 ETH
  m.recordRpc('ETH', 'n1', 4_000, true);
  m.recordRpc('ETH', 'n1', 4_000, true);
  m.recordRpc('ETH', 'n1', 4_000, true);

  // 立即评估一次
  await m.tick();
  const active = m.getActiveAlerts();
  assert.ok(active.find(a => a.rule === 'RPC_LATENCY_ETH'), 'should fire ETH latency alert');
  m.stop();
});

test('MonitoringService: addRule 添加自定义规则', async () => {
  const m = createMonitoringService({
    autoStart: false,
    registerBuiltinRules: false,
    notifier: { name: 'noop', notify: () => { /* 静默 */ } },
  });
  m.addRule({
    id: 'CUSTOM',
    description: 'custom rule',
    severity: 'P3',
    evaluator: () => true,
    cooldownMs: 0,
  });
  const fired = await m.tick();
  assert.equal(fired.length, 1);
  assert.equal(fired[0].rule, 'CUSTOM');
  assert.equal(fired[0].severity, 'P3');
  m.stop();
});

test('MonitoringService: addNotifier 包装现有 notifier', async () => {
  let n1 = 0, n2 = 0;
  const m = createMonitoringService({
    autoStart: false,
    registerBuiltinRules: false,
    notifier: { name: 'orig', notify: () => { n1++; } },
  });
  m.addNotifier({ name: 'extra', notify: () => { n2++; } });
  const n = m.getNotifier();
  assert.ok(n instanceof MultiNotifier);
  await n.notify({
    id: '1', rule: 'R', severity: 'P2', status: 'firing',
    message: '', context: {}, firedAt: 0,
  });
  assert.equal(n1, 1);
  assert.equal(n2, 1);
  m.stop();
});

test('MonitoringService: 完整端到端 - 告警 firing → resolved', async () => {
  let now = 1_000_000;
  const m = new MonitoringService({
    autoStart: false,
    metrics: new MetricsCollector({ now: () => now }),
    engine: new AlertEngine({ defaultCooldownMs: 0, now: () => now }),
  });
  const events: Alert[] = [];
  m.engine.onAlert((a) => { events.push(a); });

  // 制造 3 次 ETH 失败（主节点）
  m.recordRpc('ETH', 'main', 0, false, 'e1');
  m.recordRpc('ETH', 'main', 0, false, 'e2');
  m.recordRpc('ETH', 'main', 0, false, 'e3');
  // 触发：RPC_DOWN_ETH (P0) 应在 >=3 次失败时触发
  let fired = await m.tick();
  const firing = fired.find(a => a.rule === 'RPC_DOWN_ETH' && a.status === 'firing');
  assert.ok(firing, 'should fire RPC_DOWN_ETH');

  // 推进时间 5s 后：连续成功 1 次
  now += 5_000;
  m.recordRpc('ETH', 'main', 100, true);
  fired = await m.tick();
  const resolved = fired.find(a => a.rule === 'RPC_DOWN_ETH' && a.status === 'resolved');
  assert.ok(resolved, 'should auto-resolve');
  assert.ok(resolved!.resolvedAt! > resolved!.firedAt, 'resolvedAt must be > firedAt');
  m.stop();
});

// =============================================================================
// 6. 工具函数
// =============================================================================

test('percentile: P50/P99 边界', () => {
  const vals = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.equal(percentile(vals, 50), 50);
  assert.equal(percentile(vals, 99), 99);
  assert.equal(percentile([], 50), 0);
});

test('mean: 空数组为 0', () => {
  assert.equal(mean([]), 0);
  assert.equal(mean([2, 4, 6]), 4);
});
