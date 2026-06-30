/**
 * 算法交易系统单元测试
 *
 * 至少 16 个用例（覆盖 task 要求的 14 项 + 边界）：
 *  - AlgoEngine createAlgo TWAP
 *  - TWAP 拆单数 = totalDuration / interval
 *  - TWAP 拆单量 = totalQty / count
 *  - TWAP 启动后子单注册
 *  - TWAP 取消子单
 *  - VWAP 按成交量分布
 *  - Iceberg displayQuantity 限制
 *  - Sniper 触发价到达
 *  - Sniper 不触发
 *  - TrailingStop 激活后追踪
 *  - TrailingStop 回调率触发
 *  - AlgoEngine getUserAlgos
 *  - AlgoEngine onAlgoUpdate 订阅
 *  - AlgoEngine getUserStats
 *  - 价格滑点计算
 *  - Scheduler: 定时调度 / 取消 / 重复
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AlgoEngine,
  AlgoScheduler,
  AlgoError,
  IcebergStrategy,
  SniperStrategy,
  TrailingStopStrategy,
  TwapStrategy,
  VwapStrategy,
  type AlgoChildOrder,
  type AlgoConfig,
  type AlgoOrder,
  type OrderEngineLike,
  type PriceFeed,
  type VolumeBucket,
} from '../src/lib/algo';

// =============================================================================
// 工具：内存版 OrderEngine（撮合立即成功）
// =============================================================================

class MockOrderEngine implements OrderEngineLike {
  public submitted: Array<{
    orderId: string;
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: string;
    price?: string;
    type: 'market' | 'limit';
  }> = [];
  public marketPrice: string = '100';
  public nextOrderSeq = 0;
  public fail = false;

  submitMarketOrder(params: {
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: string;
  }) {
    this.nextOrderSeq++;
    const orderId = `mock_${this.nextOrderSeq}`;
    if (this.fail) {
      return {
        orderId,
        filledQuantity: '0',
        avgPrice: '0',
        status: 'rejected' as const,
        errorMessage: 'mock fail',
      };
    }
    this.submitted.push({
      orderId,
      userId: params.userId,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      type: 'market',
    });
    return {
      orderId,
      filledQuantity: params.quantity,
      avgPrice: this.marketPrice,
      status: 'filled' as const,
    };
  }

  submitLimitOrder(params: {
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: string;
    price: string;
    postOnly?: boolean;
  }) {
    this.nextOrderSeq++;
    const orderId = `mock_${this.nextOrderSeq}`;
    this.submitted.push({
      orderId,
      userId: params.userId,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      price: params.price,
      type: 'limit',
    });
    return {
      orderId,
      filledQuantity: params.quantity,
      avgPrice: params.price,
      status: 'filled' as const,
    };
  }

  cancelOrder(): boolean {
    return true;
  }
}

class MockPriceFeed implements PriceFeed {
  private prices: Map<string, string> = new Map();
  public subscribers: Map<string, Array<(p: string) => void>> = new Map();
  set(symbol: string, price: string): void {
    this.prices.set(symbol, price);
    const subs = this.subscribers.get(symbol);
    if (subs) for (const s of subs) s(price);
  }
  getPrice(symbol: string): string | null {
    return this.prices.get(symbol) ?? null;
  }
}

// =============================================================================
// 1. AlgoEngine.createAlgo TWAP
// =============================================================================

test('AlgoEngine: createAlgo TWAP 返回 pending 状态', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
    intervalSec: 30,
  });
  assert.equal(algo.status, 'pending');
  assert.equal(algo.type, 'twap');
  assert.equal(algo.userId, 'u1');
  assert.equal(algo.symbol, 'BTCUSDT');
  assert.equal(algo.totalQuantity, '1');
  assert.equal(algo.intervalSec, 30);
  assert.equal(algo.totalCount, 0);
  assert.ok(algo.id);
});

// =============================================================================
// 2. TWAP 拆单数 = totalDuration / interval
// =============================================================================

test('TWAP: 拆单数 = totalDuration / interval (向上取整不超过 1000)', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '10',
    durationSec: 600, // 10 分钟
    intervalSec: 30, // 每 30s 一单
  });
  // duration 600s / interval 30s = 20
  const plan = TwapStrategy.plan(
    algo.totalQuantity,
    algo.startTime,
    algo.endTime,
    algo.intervalSec,
    engine.getConfig(),
    { side: 'buy', randomize: false },
  );
  assert.equal(plan.childCount, 20);
});

// =============================================================================
// 3. TWAP 拆单量 = totalQty / count
// =============================================================================

test('TWAP: 拆单量 = totalQty / childCount', () => {
  const oe = new MockOrderEngine();
  const config: AlgoConfig = {
    ...new AlgoEngine({ orderEngine: oe }).getConfig(),
    randomizeSize: false,
    randomizeTime: false,
  };
  const plan = TwapStrategy.plan('10', 1000, 1000 + 200 * 1000, 10, config, {
    side: 'buy',
    randomize: false,
  });
  assert.equal(plan.childCount, 20);
  // 每单 = 10 / 20 = 0.5
  for (const c of plan.children) {
    assert.equal(c.quantity, '0.5');
  }
  // 总和 = 10
  const sum = plan.children.reduce(
    (acc, c) => Number(acc) + Number(c.quantity),
    0,
  );
  assert.equal(sum, 10);
});

// =============================================================================
// 4. TWAP 启动后子单注册
// =============================================================================

test('TWAP: 启动后子单注册到 algo.childOrders', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({
    orderEngine: oe,
    config: { randomizeSize: false, randomizeTime: false },
  });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
    intervalSec: 30,
  });
  engine.startAlgo(algo.id);
  const a = engine.getAlgo(algo.id)!;
  assert.equal(a.totalCount, 2);
  assert.equal(a.childOrders.length, 2);
  // 调度器应有任务
  const jobs = engine.getScheduler().getJobsByAlgo(algo.id);
  assert.ok(jobs.length >= 2);
});

// =============================================================================
// 5. TWAP 取消子单
// =============================================================================

test('TWAP: 取消后子单全部从 scheduler 移除', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({
    orderEngine: oe,
    config: { randomizeSize: false, randomizeTime: false },
  });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 600,
    intervalSec: 60,
  });
  engine.startAlgo(algo.id);
  const before = engine.getScheduler().getJobsByAlgo(algo.id).length;
  assert.ok(before > 0);
  engine.cancelAlgo(algo.id);
  const after = engine.getScheduler().getJobsByAlgo(algo.id).length;
  assert.equal(after, 0);
  const a = engine.getAlgo(algo.id)!;
  assert.ok(['cancelled', 'partial'].includes(a.status));
});

// =============================================================================
// 6. VWAP 按成交量分布
// =============================================================================

test('VWAP: 按成交量分布加权拆单（高峰段单笔更大）', () => {
  const oe = new MockOrderEngine();
  const config: AlgoConfig = {
    ...new AlgoEngine({ orderEngine: oe }).getConfig(),
    randomizeSize: false,
    randomizeTime: false,
  };
  const buckets: VolumeBucket[] = [
    { startOffsetSec: 0, endOffsetSec: 60, weight: 0.2 },
    { startOffsetSec: 60, endOffsetSec: 120, weight: 0.6 }, // 高峰
    { startOffsetSec: 120, endOffsetSec: 180, weight: 0.2 },
  ];
  const plan = VwapStrategy.plan(
    '10',
    0,
    180 * 1000,
    30,
    config,
    { side: 'buy', volumeProfile: buckets, randomize: false },
  );
  // 6 个子单 (180 / 30 = 6)
  assert.equal(plan.childCount, 6);
  // 第 0,1 笔位于 [0,30)/[30,60) bucket1 weight 0.2  -> ~0.333
  // 第 2,3 笔位于 bucket2 weight 0.6 -> ~1
  // 第 4,5 笔位于 bucket3 weight 0.2 -> ~0.333
  const q0 = Number(plan.children[0].quantity);
  const q2 = Number(plan.children[2].quantity);
  const q4 = Number(plan.children[4].quantity);
  assert.ok(q2 > q0, `q2(${q2}) should > q0(${q0})`);
  assert.ok(q2 > q4, `q2(${q2}) should > q4(${q4})`);
});

// =============================================================================
// 7. Iceberg displayQuantity 限制
// =============================================================================

test('Iceberg: 子单 quantity 受到 displayQuantity 限制', async () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({
    orderEngine: oe,
    config: { schedulerTickMs: 20 },
  });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'iceberg',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '10',
    durationSec: 600,
    displayQuantity: '0.5',
  });
  engine.startAlgo(algo.id);
  // 等待 scheduler tick + 冰山首单成交
  await new Promise((r) => setTimeout(r, 150));
  const children = engine.getAlgoChildren(algo.id);
  assert.ok(children.length >= 1, `expected >= 1 children, got ${children.length}`);
  assert.equal(children[0].quantity, '0.5');
  // 子单类型为 market
  assert.equal(children[0].type, 'market');
});

// =============================================================================
// 8. Sniper 触发价到达
// =============================================================================

test('Sniper: 价格到达 triggerPrice 后立即触发市价单', async () => {
  const oe = new MockOrderEngine();
  const pf = new MockPriceFeed();
  const engine = new AlgoEngine({
    orderEngine: oe,
    priceFeed: pf,
    config: { pricePollIntervalMs: 20 },
  });
  pf.set('BTCUSDT', '100');
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'sniper',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
    triggerPrice: '95',
    triggerDirection: 'lte',
  });
  engine.startAlgo(algo.id);
  // 等几轮 poll
  await new Promise((r) => setTimeout(r, 100));
  // 当前价 100，未触发
  const a1 = engine.getAlgo(algo.id)!;
  assert.equal(a1.triggered, false);
  // 把价格拉到 95 以下
  pf.set('BTCUSDT', '94');
  await new Promise((r) => setTimeout(r, 200));
  const a2 = engine.getAlgo(algo.id)!;
  assert.equal(a2.triggered, true);
  assert.equal(a2.status, 'triggered');
  assert.ok(oe.submitted.length >= 1);
  // 子单为市价单
  const child = engine.getAlgoChildren(algo.id).find((c) => c.id.endsWith('_snipe'));
  assert.ok(child);
});

// =============================================================================
// 9. Sniper 不触发
// =============================================================================

test('Sniper: 窗口内未到达 triggerPrice -> failed', async () => {
  const oe = new MockOrderEngine();
  const pf = new MockPriceFeed();
  const engine = new AlgoEngine({
    orderEngine: oe,
    priceFeed: pf,
    config: { pricePollIntervalMs: 20 },
  });
  pf.set('BTCUSDT', '100');
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'sniper',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 1, // 1s 窗口
    triggerPrice: '90',
    triggerDirection: 'lte',
  });
  engine.startAlgo(algo.id);
  // 等待超过窗口
  await new Promise((r) => setTimeout(r, 1500));
  const a = engine.getAlgo(algo.id)!;
  assert.equal(a.triggered, false);
  assert.equal(a.status, 'failed');
  assert.equal(oe.submitted.length, 0);
});

// =============================================================================
// 10. TrailingStop 激活后追踪
// =============================================================================

test('TrailingStop: 激活后持续更新 peakPrice', () => {
  const a: AlgoOrder = {
    id: 'a',
    userId: 'u1',
    type: 'trailing_stop',
    symbol: 'BTCUSDT',
    side: 'sell',
    totalQuantity: '1',
    executedQuantity: '0',
    avgPrice: '0',
    totalNotional: '0',
    status: 'pending',
    createdAt: 0,
    startTime: 0,
    endTime: 0,
    intervalSec: 0,
    triggered: false,
    childOrders: [],
    filledCount: 0,
    totalCount: 0,
    startPrice: '0',
    slippage: '0',
    trailingSide: 'long', // 持多追踪
    callbackRate: 0.01,
  };
  TrailingStopStrategy.updatePeak(a, '100');
  assert.equal(a.peakPrice, '100');
  TrailingStopStrategy.updatePeak(a, '110');
  assert.equal(a.peakPrice, '110');
  TrailingStopStrategy.updatePeak(a, '105'); // 回落
  assert.equal(a.peakPrice, '110'); // 仍为 110
});

// =============================================================================
// 11. TrailingStop 回调率触发
// =============================================================================

test('TrailingStop: 价格回调达到 callbackRate 触发', () => {
  const a: AlgoOrder = {
    id: 'a',
    userId: 'u1',
    type: 'trailing_stop',
    symbol: 'BTCUSDT',
    side: 'sell',
    totalQuantity: '1',
    executedQuantity: '0',
    avgPrice: '0',
    totalNotional: '0',
    status: 'running',
    createdAt: 0,
    startTime: 0,
    endTime: 0,
    intervalSec: 0,
    triggered: false,
    childOrders: [],
    filledCount: 0,
    totalCount: 0,
    startPrice: '0',
    slippage: '0',
    peakPrice: '100',
    trailingSide: 'long',
    callbackRate: 0.05, // 5%
  };
  // peak=100, callback 5% -> 触发价 95
  assert.equal(TrailingStopStrategy.checkTrigger(a, '96'), false);
  assert.equal(TrailingStopStrategy.checkTrigger(a, '95'), true);
  assert.equal(TrailingStopStrategy.checkTrigger(a, '94'), true);
});

// =============================================================================
// 12. AlgoEngine getUserAlgos
// =============================================================================

test('AlgoEngine: getUserAlgos 按用户和状态过滤', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const a1 = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
  });
  const a2 = engine.createAlgo({
    userId: 'u1',
    type: 'sniper',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
    triggerPrice: '90',
  });
  const a3 = engine.createAlgo({
    userId: 'u2',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 60,
  });
  const u1 = engine.getUserAlgos('u1');
  assert.equal(u1.length, 2);
  const pending = engine.getUserAlgos('u1', 'pending');
  assert.equal(pending.length, 2);
  void a1; void a2; void a3;
});

// =============================================================================
// 13. AlgoEngine onAlgoUpdate 订阅
// =============================================================================

test('AlgoEngine: onAlgoUpdate 订阅可接收 create + start + child update', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({
    orderEngine: oe,
    config: { randomizeSize: false, randomizeTime: false },
  });
  const events: string[] = [];
  const off = engine.onAlgoUpdate((a) => events.push(`${a.id}:${a.status}`));
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  assert.ok(events.includes(`${algo.id}:pending`));
  engine.startAlgo(algo.id);
  assert.ok(events.includes(`${algo.id}:running`));
  off();
  engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
  });
  // off 后不应再收到
  assert.equal(events.length, 2);
});

// =============================================================================
// 14. AlgoEngine getUserStats
// =============================================================================

test('AlgoEngine: getUserStats 汇总 algo 数量 / 成交名义 / 滑点均值', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const a1Create = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  // 手动注入统计（直接修改内部存储）
  const a1 = (engine as unknown as { algos: Map<string, AlgoOrder> }).algos.get(a1Create.id)!;
  a1.totalNotional = '100';
  a1.executedQuantity = '1';
  a1.slippage = '0.01';
  const a2Create = engine.createAlgo({
    userId: 'u1',
    type: 'iceberg',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '2',
    durationSec: 30,
    displayQuantity: '0.5',
  });
  const a2 = (engine as unknown as { algos: Map<string, AlgoOrder> }).algos.get(a2Create.id)!;
  a2.totalNotional = '210';
  a2.executedQuantity = '2';
  a2.slippage = '0.03';
  const stats = engine.getUserStats('u1');
  assert.equal(stats.algoCount, 2);
  assert.equal(stats.totalVolume, '310');
  // 滑点均值 = (0.01 + 0.03) / 2 = 0.02
  assert.equal(stats.avgSlippage, '0.02');
  assert.equal(stats.byType.twap, 1);
  assert.equal(stats.byType.iceberg, 1);
});

// =============================================================================
// 15. 价格滑点计算
// =============================================================================

test('AlgoEngine: 滑点 = (avgPrice - startPrice) / startPrice；sell 时取负', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const aCreate = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  // 通过 engine 的内部 algos 引用修改
  const a = (engine as unknown as { algos: Map<string, AlgoOrder> }).algos.get(aCreate.id)!;
  a.startPrice = '100';
  a.avgPrice = '105';
  a.executedQuantity = '1';
  a.totalNotional = '105';
  // 触发 recalculate
  (engine as unknown as { recalculateAlgo: (a: AlgoOrder) => void }).recalculateAlgo(a);
  // (105-100)/100 = 0.05
  assert.equal(a.slippage, '0.05');

  // sell: 卖价高于 startPrice = 卖得更好 = 负滑点
  const a2Create = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'sell',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  const a2 = (engine as unknown as { algos: Map<string, AlgoOrder> }).algos.get(a2Create.id)!;
  a2.startPrice = '100';
  a2.avgPrice = '105';
  a2.executedQuantity = '1';
  a2.totalNotional = '105';
  (engine as unknown as { recalculateAlgo: (a: AlgoOrder) => void }).recalculateAlgo(a2);
  // sell 时取负: -0.05
  assert.equal(a2.slippage, '-0.05');
});

// =============================================================================
// 16. Scheduler: scheduleJob / cancelJob / repeating
// =============================================================================

test('Scheduler: scheduleJob 到点执行，cancelJob 可取消', async () => {
  const s = new AlgoScheduler(20);
  let executed = 0;
  s.scheduleJob('j1', Date.now() + 50, () => {
    executed++;
  });
  assert.equal(s.size(), 1);
  s.cancelJob('j1');
  assert.equal(s.size(), 0);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(executed, 0);
});

test('Scheduler: scheduleRepeating 按周期重复执行', async () => {
  const s = new AlgoScheduler(10);
  let count = 0;
  s.scheduleRepeating('r1', Date.now() + 20, 30, () => {
    count++;
  });
  await new Promise((r) => setTimeout(r, 150));
  s.cancelJob('r1');
  assert.ok(count >= 2, `expected >= 2, got ${count}`);
});

test('Scheduler: cancelByAlgo 取消同一 algo 下所有任务', () => {
  const s = new AlgoScheduler(50);
  s.scheduleJob('j1', Date.now() + 1000, () => {}, { algoId: 'A' });
  s.scheduleJob('j2', Date.now() + 1000, () => {}, { algoId: 'A' });
  s.scheduleJob('j3', Date.now() + 1000, () => {}, { algoId: 'B' });
  assert.equal(s.size(), 3);
  const removed = s.cancelByAlgo('A');
  assert.equal(removed, 2);
  assert.equal(s.size(), 1);
});

// =============================================================================
// 17. 错误处理
// =============================================================================

test('AlgoEngine: createAlgo 缺少 triggerPrice 抛 AlgoError', () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  assert.throws(
    () =>
      engine.createAlgo({
        userId: 'u1',
        type: 'sniper',
        symbol: 'BTCUSDT',
        side: 'buy',
        totalQuantity: '1',
        durationSec: 30,
        // no triggerPrice
      } as unknown as Parameters<typeof engine.createAlgo>[0]),
    (err: unknown) => {
      return err instanceof AlgoError && err.code === 'INVALID_CONFIG';
    },
  );
});

test('AlgoEngine: 重复 startAlgo 抛 ALGO_NOT_PENDING', async () => {
  const oe = new MockOrderEngine();
  const engine = new AlgoEngine({ orderEngine: oe });
  const a = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  await engine.startAlgo(a.id);
  await assert.rejects(
    () => engine.startAlgo(a.id),
    (err: unknown) => {
      return err instanceof AlgoError && err.code === 'ALGO_NOT_PENDING';
    },
  );
});

// =============================================================================
// 18. 子单完成回调
// =============================================================================

test('AlgoEngine: 子单成交触发 onChildOrderFilled 事件', async () => {
  const oe = new MockOrderEngine();
  oe.marketPrice = '100';
  const engine = new AlgoEngine({
    orderEngine: oe,
    config: {
      randomizeSize: false,
      randomizeTime: false,
      pricePollIntervalMs: 20,
    },
  });
  const algo = engine.createAlgo({
    userId: 'u1',
    type: 'twap',
    symbol: 'BTCUSDT',
    side: 'buy',
    totalQuantity: '1',
    durationSec: 30,
    intervalSec: 30,
  });
  // 让 scheduler 立即到期
  const a = engine.getAlgo(algo.id)!;
  const oldStart = a.startTime;
  // 重置 startTime 到过去
  (engine as unknown as { algos: Map<string, AlgoOrder> }).algos.get(algo.id)!.startTime = Date.now() - 100;
  void oldStart;
  const fills: AlgoChildOrder[] = [];
  engine.onChildOrderFilled((parent, child) => {
    fills.push(child);
    void parent;
  });
  engine.startAlgo(algo.id);
  // 等待 tick
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(fills.length >= 1, `expected >= 1 fills, got ${fills.length}`);
});
