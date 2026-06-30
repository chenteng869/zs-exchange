/**
 * 充值监听器（DepositMonitor）单元测试
 *
 * 覆盖 12 个核心场景：
 *  1. watchAddress / unwatchAddress
 *  2. 轮询检测 ERC20 Transfer 事件
 *  3. 轮询检测 TRC20 Transfer 事件
 *  4. confirmations 累加
 *  5. 到达 requiredConfirmations 自动标记 confirmed → credited
 *  6. 重复交易去重（txHash:logIndex 唯一）
 *  7. Webhook 签名校验：正确签名通过
 *  8. Webhook 签名校验：错误签名拒绝
 *  9. Webhook 签名校验：缺失 signature 拒绝
 * 10. Webhook 触发入账（payload → DepositEvent）
 * 11. onDeposit 订阅事件
 * 12. 断网降级（轮询失败不抛错）
 *  + ingestDeposit 工具
 *  + handleAlchemyWebhook 端到端
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  DepositMonitor,
  REQUIRED_CONFIRMATIONS,
  type WebhookPayload,
  type DepositEvent,
} from '../src/lib/wallet/deposit-monitor';
import {
  BlockPoller,
  POLL_INTERVAL_MS,
  TRANSFER_EVENT_TOPIC,
  type RawTransfer,
} from '../src/lib/wallet/poller';
import {
  verifyAlchemySignature,
  signAlchemyWebhook,
  WebhookSignatureError,
} from '../src/lib/wallet/webhook-verifier';
import { handleAlchemyWebhook } from '../src/lib/wallet/webhook-handler';
import {
  RpcClient,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from '../src/lib/wallet/rpc-client';
import { TronRpcClient } from '../src/lib/wallet/tron-rpc-client';

// =============================================================================
// 测试工具
// =============================================================================

const PLATFORM_ETH = '0x' + '1'.repeat(40);
const PLATFORM_BSC = '0x' + '2'.repeat(40);
const PLATFORM_TRON = 'T' + 'A'.repeat(33);
const USER_ETH = '0x' + '3'.repeat(40);
const USER_BSC = '0x' + '4'.repeat(40);
const USER_TRX = 'T' + 'B'.repeat(33);
const USDT_BSC = '0x' + '5'.repeat(40);
const USDT_TRON = 'T' + 'C'.repeat(33);
const TRANSFER_TOPIC = TRANSFER_EVENT_TOPIC;

function pad32(hex: string): string {
  return hex.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

function makeEvmLog(opts: {
  from: string;
  to: string;
  value: bigint;
  blockNumber: number;
  logIndex: number;
  txHash: string;
  tokenAddress?: string;
}): any {
  return {
    address: opts.tokenAddress || USDT_BSC.toLowerCase(),
    topics: [
      TRANSFER_TOPIC,
      '0x' + pad32(opts.from),
      '0x' + pad32(opts.to),
    ],
    data: '0x' + opts.value.toString(16).padStart(64, '0'),
    blockNumber: '0x' + opts.blockNumber.toString(16),
    logIndex: '0x' + opts.logIndex.toString(16),
    transactionHash: opts.txHash,
  };
}

/** 构造一个 mock fetch：支持 EVM JSON-RPC + Trongrid HTTP */
function createMockFetch(handlers: {
  evm?: (req: JsonRpcRequest) => any;
  evmBehavior?: (req: JsonRpcRequest) => { ok: boolean; status?: number; body?: any };
  tron?: (path: string) => any;
  evmFailure?: boolean;
  tronFailure?: boolean;
}): typeof fetch {
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    // EVM JSON-RPC（任意 http(s):// 节点，不包含 trongrid）
    if (init?.body && u.startsWith('http') && !u.includes('trongrid') && !u.includes('shasta') && !u.includes('nile')) {
      const body = JSON.parse(init.body as string);
      const req: JsonRpcRequest = body;
      // batch
      if (Array.isArray(body)) {
        const out: JsonRpcResponse[] = body.map((r, i) => {
          if (handlers.evmFailure) {
            return { jsonrpc: '2.0', id: r.id, error: { code: -1, message: 'simulated' } };
          }
          const r1 = handlers.evm?.(r);
          if (r1) return { jsonrpc: '2.0', id: r.id, result: r1 };
          return { jsonrpc: '2.0', id: r.id, result: null };
        });
        return { ok: true, status: 200, json: async () => out, text: async () => JSON.stringify(out) } as any;
      }
      if (handlers.evmFailure) {
        return { ok: false, status: 503, statusText: 'Service Unavailable', text: async () => 'down', json: async () => ({}) } as any;
      }
      const result = handlers.evm?.(req);
      return {
        ok: true,
        status: 200,
        json: async () => ({ jsonrpc: '2.0', id: req.id, result: result ?? null } as JsonRpcResponse),
        text: async () => JSON.stringify({ jsonrpc: '2.0', id: req.id, result: result ?? null }),
      } as any;
    }
    // Trongrid（URL 含 trongrid / shasta / nile / 我们的 mock-tron）
    if (u.includes('trongrid') || u.includes('shasta') || u.includes('nile') || u.includes('mock-tron')) {
      if (handlers.tronFailure) {
        return { ok: false, status: 503, statusText: 'Service Unavailable', text: async () => 'down', json: async () => ({}) } as any;
      }
      const path = new URL(u).pathname + new URL(u).search;
      const result = handlers.tron?.(path);
      return {
        ok: true,
        status: 200,
        json: async () => result ?? { data: [] },
        text: async () => JSON.stringify(result ?? { data: [] }),
      } as any;
    }
    return { ok: false, status: 404, statusText: 'Not Found', text: async () => 'not found', json: async () => ({}) } as any;
  }) as typeof fetch;
}

function createEvmClient(fetchImpl: typeof fetch): RpcClient {
  return new RpcClient({
    endpoints: ['https://mock-evm.example.com'],
    chainName: 'mock',
    fetchImpl,
    maxRetries: 1,
    initialBackoffMs: 1,
    maxBackoffMs: 1,
    healthCheckMs: 0,
  });
}

function createTronClient(fetchImpl: typeof fetch): TronRpcClient {
  return new TronRpcClient({
    endpoints: ['https://mock-tron.example.com'],
    fetchImpl,
    maxRetries: 1,
    healthCheckMs: 0,
  });
}

// =============================================================================
// 1. watchAddress / unwatchAddress
// =============================================================================

test('DepositMonitor: watchAddress / unwatchAddress 维护监控集合', () => {
  const monitor = new DepositMonitor();
  monitor.watchAddress(PLATFORM_ETH, 'ETH', 'USDT');
  monitor.watchAddress(PLATFORM_BSC, 'BSC', 'USDT');
  monitor.watchAddress(PLATFORM_TRON, 'TRON', 'USDT');
  assert.equal(monitor.watchedCount(), 3);

  monitor.unwatchAddress(PLATFORM_BSC);
  assert.equal(monitor.watchedCount(), 2);

  // 重复 watch 同一地址不应重复计数
  monitor.watchAddress(PLATFORM_ETH, 'ETH', 'USDT');
  assert.equal(monitor.watchedCount(), 2);

  // unwatch 不存在的地址不应报错
  monitor.unwatchAddress('0x' + '9'.repeat(40));
  assert.equal(monitor.watchedCount(), 2);
});

// =============================================================================
// 2. 轮询检测 ERC20 Transfer 事件
// =============================================================================

test('BlockPoller: 轮询检测 ERC20 Transfer 事件', async () => {
  const transfers: RawTransfer[] = [];
  const fetchImpl = createMockFetch({
    evm: (req) => {
      if (req.method === 'eth_blockNumber') return '0x' + (200).toString(16);
      if (req.method === 'eth_getLogs') {
        return [
          makeEvmLog({
            from: USER_BSC,
            to: PLATFORM_BSC,
            value: 1_000_000n, // 1 USDT (6 decimals)
            blockNumber: 199,
            logIndex: 0,
            txHash: '0x' + 'a'.repeat(64),
            tokenAddress: USDT_BSC,
          }),
        ];
      }
      return null;
    },
  });
  const evmClient = createEvmClient(fetchImpl);
  const poller = new BlockPoller({
    evmClient,
    pollIntervalMs: 60_000,
    onTransfer: (t) => transfers.push(t),
  });
  poller.watchAddress({
    chain: 'BSC',
    address: PLATFORM_BSC,
    tokenSymbol: 'USDT',
    tokenAddress: USDT_BSC.toLowerCase(),
    decimals: 6,
  });

  const result = await poller.tick();
  assert.equal(result.errors.length, 0);
  assert.equal(transfers.length, 1);
  assert.equal(transfers[0].chain, 'BSC');
  assert.equal(transfers[0].tokenSymbol, 'USDT');
  assert.equal(transfers[0].amountRaw, 1_000_000n);
  assert.equal(transfers[0].to, PLATFORM_BSC.toLowerCase());
  assert.equal(transfers[0].logIndex, 0);
});

// =============================================================================
// 3. 轮询检测 TRC20 Transfer 事件
// =============================================================================

test('BlockPoller: 轮询检测 TRC20 Transfer 事件', async () => {
  const transfers: RawTransfer[] = [];
  const fetchImpl = createMockFetch({
    tron: (path) => {
      if (path.includes('/transactions/trc20')) {
        return {
          data: [
            {
              transaction_id: '0x' + 'b'.repeat(64),
              from: USER_TRX,
              to: PLATFORM_TRON,
              value: '5db060', // hex = 6_140_000
              block_timestamp: Date.now(),
              token_info: { symbol: 'USDT', decimals: 6 },
              token_id: USDT_TRON,
              index: 0,
            },
          ],
        };
      }
      return { data: [] };
    },
  });
  const tronClient = createTronClient(fetchImpl);
  const poller = new BlockPoller({
    tronClient,
    pollIntervalMs: 60_000,
    onTransfer: (t) => transfers.push(t),
  });
  poller.watchAddress({
    chain: 'TRON',
    address: PLATFORM_TRON,
    tokenSymbol: 'USDT',
    tokenAddress: USDT_TRON,
    decimals: 6,
  });

  const result = await poller.tick();
  assert.equal(result.errors.length, 0);
  assert.equal(transfers.length, 1);
  assert.equal(transfers[0].chain, 'TRON');
  assert.equal(transfers[0].tokenSymbol, 'USDT');
  assert.equal(transfers[0].amountRaw, 6_140_000n);
  assert.equal(transfers[0].to, PLATFORM_TRON);
});

// =============================================================================
// 4 + 5. confirmations 累加 & 到达 requiredConfirmations 自动入账
// =============================================================================

test('DepositMonitor: confirmations 累加，到达 requiredConfirmations 自动入账', async () => {
  const fetchImpl = createMockFetch({
    evm: (req) => {
      if (req.method === 'eth_blockNumber') return '0x' + (1000).toString(16);
      if (req.method === 'eth_getLogs') {
        return [
          makeEvmLog({
            from: USER_ETH,
            to: PLATFORM_ETH,
            value: 100_000_000n, // 0.1 USDT (6 decimals)
            blockNumber: 999,
            logIndex: 0,
            txHash: '0x' + 'c'.repeat(64),
            tokenAddress: USDT_BSC,
          }),
        ];
      }
      return null;
    },
  });
  const evmClient = createEvmClient(fetchImpl);
  const monitor = new DepositMonitor({
    evmClient,
    pollIntervalMs: 60_000,
  });
  monitor.watchAddress(PLATFORM_ETH, 'ETH', 'USDT');

  const events: DepositEvent[] = [];
  monitor.onDeposit((e) => events.push(e));

  // 第 1 轮：发现 pending
  await (monitor as any).poller?.tick();
  // confirmations=1, requiredConfirmations=12 (ETH)
  let deposits = monitor.getAllDeposits();
  assert.equal(deposits.length, 1);
  assert.equal(deposits[0].chain, 'ETH');
  assert.equal(deposits[0].requiredConfirmations, REQUIRED_CONFIRMATIONS.ETH);
  // 11 次后 confirmations=12，到达 requiredConfirmations → credited
  for (let i = 0; i < 11; i++) {
    const e = monitor.confirmDeposit(deposits[0].txHash, 999, 0, i + 2);
    assert.ok(e.confirmations <= 12);
  }
  deposits = monitor.getAllDeposits();
  assert.equal(deposits[0].status, 'credited');
  assert.ok(deposits[0].creditedAt);
  // 至少触发了 pending + confirmed + credited 三次
  const chainEvts = events.filter((e) => e.id === deposits[0].id);
  assert.ok(chainEvts.length >= 2, `expected at least 2 events, got ${chainEvts.length}`);
});

// =============================================================================
// 6. 重复交易去重（txHash:logIndex 唯一）
// =============================================================================

test('DepositMonitor: 重复 txHash:logIndex 自动去重', () => {
  const monitor = new DepositMonitor();
  const txHash = '0x' + 'd'.repeat(64);
  const evt = monitor.ingestDeposit({
    chain: 'BSC',
    tokenSymbol: 'USDT',
    tokenAddress: USDT_BSC,
    decimals: 6,
    to: PLATFORM_BSC,
    from: USER_BSC,
    amount: '1000000',
    amountFormatted: '1',
    txHash,
    blockNumber: 100,
    logIndex: 0,
    source: 'webhook',
  });
  assert.equal(monitor.getAllDeposits().length, 1);

  // 重复 ingest（不同 source / 不同 confirmations）
  const evt2 = monitor.ingestDeposit({
    chain: 'BSC',
    tokenSymbol: 'USDT',
    tokenAddress: USDT_BSC,
    decimals: 6,
    to: PLATFORM_BSC,
    from: USER_BSC,
    amount: '1000000',
    amountFormatted: '1',
    txHash,
    blockNumber: 100,
    logIndex: 0,
    source: 'polling',
  });
  assert.equal(monitor.getAllDeposits().length, 1);
  // 返回的是同一个对象（去重）
  assert.equal(evt.id, evt2.id);
  // ID 格式：txHash:logIndex
  assert.equal(evt.id, `${txHash.toLowerCase()}:0`);
});

// =============================================================================
// 7. Webhook 签名校验：正确签名通过
// =============================================================================

test('verifyAlchemySignature: 正确签名通过', () => {
  const key = 'whsec_test_key_123';
  const body = JSON.stringify({ type: 'address_activity', event: {} });
  const sig = signAlchemyWebhook(body, key);
  const ok = verifyAlchemySignature(body, sig, key);
  assert.equal(ok, true);
});

// =============================================================================
// 8. Webhook 签名校验：错误签名拒绝
// =============================================================================

test('verifyAlchemySignature: 错误签名拒绝', () => {
  const key = 'whsec_test_key_123';
  const body = JSON.stringify({ type: 'address_activity' });
  const wrong = signAlchemyWebhook(body, 'wrong_key');
  assert.throws(
    () => verifyAlchemySignature(body, wrong, key),
    (err: Error) => err instanceof WebhookSignatureError && err.code === 'SIGNATURE_INVALID',
  );
});

// =============================================================================
// 9. Webhook 签名校验：缺失 signature 拒绝
// =============================================================================

test('verifyAlchemySignature: 缺失 signature 拒绝', () => {
  const key = 'whsec_test_key_123';
  const body = JSON.stringify({ type: 'address_activity' });
  assert.throws(
    () => verifyAlchemySignature(body, '', key),
    (err: Error) => err instanceof WebhookSignatureError && err.code === 'SIGNATURE_MISSING',
  );
  assert.throws(
    () => verifyAlchemySignature(body, undefined as any, key),
    (err: Error) => err instanceof WebhookSignatureError && err.code === 'SIGNATURE_MISSING',
  );
  // 长度不一致
  assert.throws(
    () => verifyAlchemySignature(body, 'abcd', key),
    (err: Error) => err instanceof WebhookSignatureError &&
      (err.code === 'LENGTH_MISMATCH' || err.code === 'SIGNATURE_INVALID'),
  );
});

// =============================================================================
// 10. Webhook 触发入账（payload → DepositEvent）
// =============================================================================

test('DepositMonitor: Webhook payload 触发入账', () => {
  const monitor = new DepositMonitor();
  const events: DepositEvent[] = [];
  monitor.onDeposit((e) => events.push(e));

  const payload: WebhookPayload = {
    type: 'address_activity',
    id: 'wh_123',
    createdAt: new Date().toISOString(),
    event: {
      network: 'ETH_MAINNET',
      activity: [
        {
          fromAddress: USER_ETH,
          toAddress: PLATFORM_ETH,
          blockNum: '0x' + (12345).toString(16),
          hash: '0x' + 'e'.repeat(64),
          value: 1_000_000_000_000_000_000, // 1 ETH
          asset: 'ETH',
          category: 'external',
        },
      ],
    },
  };
  const out = monitor.handleWebhook(payload);
  assert.equal(out.length, 1);
  assert.equal(out[0].chain, 'ETH');
  assert.equal(out[0].tokenSymbol, 'ETH');
  assert.equal(out[0].amount, '1000000000000000000');
  assert.equal(out[0].amountFormatted, '1');
  assert.equal(out[0].source, 'webhook');
  // 因为 confirmations=1 < requiredConfirmations=12，仍为 pending
  // 12 次 confirm 后才 credited（这里只发一次，pending 触发 1 次事件）
  assert.ok(events.length >= 1);
  assert.equal(events[0].status, 'pending');
});

// =============================================================================
// 11. onDeposit 订阅事件
// =============================================================================

test('DepositMonitor: onDeposit 订阅可多次触发 + 取消订阅', () => {
  const monitor = new DepositMonitor();
  const a: DepositEvent[] = [];
  const b: DepositEvent[] = [];
  const subA = monitor.onDeposit((e) => a.push(e));
  const subB = monitor.onDeposit((e) => b.push(e));

  monitor.ingestDeposit({
    chain: 'ETH',
    tokenSymbol: 'USDT',
    decimals: 6,
    to: PLATFORM_ETH,
    from: USER_ETH,
    amount: '1000000',
    amountFormatted: '1',
    txHash: '0x' + '1'.repeat(64),
    blockNumber: 1,
    logIndex: 0,
    source: 'webhook',
  });
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);

  // 取消 A
  subA();
  monitor.ingestDeposit({
    chain: 'ETH',
    tokenSymbol: 'USDT',
    decimals: 6,
    to: PLATFORM_ETH,
    from: USER_ETH,
    amount: '2000000',
    amountFormatted: '2',
    txHash: '0x' + '2'.repeat(64),
    blockNumber: 2,
    logIndex: 0,
    source: 'webhook',
  });
  assert.equal(a.length, 1); // 未增加
  assert.equal(b.length, 2);

  // 取消 B
  subB();
  monitor.ingestDeposit({
    chain: 'ETH',
    tokenSymbol: 'USDT',
    decimals: 6,
    to: PLATFORM_ETH,
    from: USER_ETH,
    amount: '3000000',
    amountFormatted: '3',
    txHash: '0x' + '3'.repeat(64),
    blockNumber: 3,
    logIndex: 0,
    source: 'webhook',
  });
  assert.equal(a.length, 1);
  assert.equal(b.length, 2);
});

// =============================================================================
// 12. 断网降级（轮询失败不抛错）
// =============================================================================

test('DepositMonitor: 断网降级（轮询失败不抛错）', async () => {
  const fetchImpl = createMockFetch({ evmFailure: true, tronFailure: true });
  const evmClient = createEvmClient(fetchImpl);
  const tronClient = createTronClient(fetchImpl);
  const errors: Array<{ msg: string; chain: string }> = [];
  const monitor = new DepositMonitor({
    evmClient,
    tronClient,
    onError: (e, c) => errors.push({ msg: e.message, chain: c }),
    pollIntervalMs: 60_000,
  });
  monitor.watchAddress(PLATFORM_ETH, 'ETH', 'USDT');
  monitor.watchAddress(PLATFORM_BSC, 'BSC', 'USDT');
  monitor.watchAddress(PLATFORM_TRON, 'TRON', 'USDT');

  // 不应抛错
  await (monitor as any).poller?.tick();
  // 应至少记录了一次错误（每条链都会尝试一次）
  assert.ok(errors.length >= 1, `expected at least 1 error, got ${errors.length}`);
  // monitor 仍可继续使用
  assert.equal(monitor.isRunning(), false); // 未 start
  monitor.start();
  assert.equal(monitor.isRunning(), true);
  monitor.stop();
});

// =============================================================================
// 13. handleAlchemyWebhook 端到端（签名 + 解析 + 入账）
// =============================================================================

test('handleAlchemyWebhook: 端到端（签名 + 解析 + 入账）', async () => {
  const key = 'whsec_e2e_key';
  const monitor = new DepositMonitor();
  monitor.watchAddress(PLATFORM_BSC, 'BSC', 'USDT');

  const payload: WebhookPayload = {
    type: 'address_activity',
    id: 'wh_e2e',
    createdAt: new Date().toISOString(),
    event: {
      network: 'BSC_MAINNET',
      activity: [
        {
          fromAddress: USER_BSC,
          toAddress: PLATFORM_BSC,
          blockNum: '0x' + (200).toString(16),
          hash: '0x' + 'f'.repeat(64),
          value: 5_000_000, // 5 USDT
          asset: 'USDT',
          category: 'token',
          rawContract: { address: USDT_BSC, decimal: '6' },
        },
      ],
    },
  };
  const body = JSON.stringify(payload);
  const sig = signAlchemyWebhook(body, key);

  // 错误签名
  const bad = await handleAlchemyWebhook(body, sig, 'wrong_key', monitor);
  assert.equal(bad.ok, false);
  assert.equal(bad.processed, 0);

  // 缺失签名
  const noSig = await handleAlchemyWebhook(body, '', key, monitor);
  assert.equal(noSig.ok, false);
  assert.ok(noSig.errors[0].includes('SIGNATURE_MISSING'));

  // 正确签名
  const ok = await handleAlchemyWebhook(body, sig, key, monitor);
  assert.equal(ok.ok, true);
  assert.equal(ok.processed, 1);
  assert.equal(ok.events[0].chain, 'BSC');
  assert.equal(ok.events[0].amountFormatted, '5');
  // 已计入 deposits
  assert.equal(monitor.getAllDeposits().length, 1);

  // 重复 webhook（幂等）
  const dup = await handleAlchemyWebhook(body, sig, key, monitor);
  assert.equal(dup.ok, true);
  // 重复 ingest 不会增加（去重）
  assert.equal(monitor.getAllDeposits().length, 1);
});

// =============================================================================
// 14. handleAlchemyWebhook 接收 hex sha256 signature（Alchemy 默认）
// =============================================================================

test('handleAlchemyWebhook: 接收 hex sha256 signature', async () => {
  const key = 'whsec_hex_test';
  const monitor = new DepositMonitor();
  const body = JSON.stringify({ type: 'address_activity', event: { network: 'ETH_MAINNET', activity: [] } });
  const sig = createHmac('sha256', key).update(body, 'utf8').digest('hex');
  const result = await handleAlchemyWebhook(body, sig, key, monitor);
  // activity 为空 => processed=0，但 ok
  assert.equal(result.ok, true);
  assert.equal(result.processed, 0);
});

// =============================================================================
// 15. lastScannedBlock 状态正确推进
// =============================================================================

test('BlockPoller: lastScannedBlock 正确推进', async () => {
  let currentBlock = 1000;
  const fetchImpl = createMockFetch({
    evm: (req) => {
      if (req.method === 'eth_blockNumber') return '0x' + currentBlock.toString(16);
      if (req.method === 'eth_getLogs') return [];
      return null;
    },
  });
  const evmClient = createEvmClient(fetchImpl);
  const poller = new BlockPoller({
    evmClient,
    pollIntervalMs: 60_000,
    batchSize: 10,
    onTransfer: () => { /* noop */ },
  });
  poller.watchAddress({
    chain: 'ETH',
    address: PLATFORM_ETH,
    tokenSymbol: 'USDT',
    decimals: 6,
  });

  assert.equal(poller.getLastScannedBlock('ETH'), 0);
  await poller.tick();
  // 首次：从 latest - batchSize + 1 = 1000 - 10 + 1 = 991 开始
  // to = 1000，所以 lastScannedBlock = 1000
  assert.equal(poller.getLastScannedBlock('ETH'), 1000);

  // 推进 5 个区块
  currentBlock = 1005;
  await poller.tick();
  // 上次 lastScannedBlock=1000，这次 from=1001, to=1005
  assert.equal(poller.getLastScannedBlock('ETH'), 1005);
});

// =============================================================================
// 16. POLL_INTERVAL_MS 默认值正确
// =============================================================================

test('常量: POLL_INTERVAL_MS = 15_000', () => {
  assert.equal(POLL_INTERVAL_MS, 15_000);
});

test('常量: REQUIRED_CONFIRMATIONS 正确', () => {
  assert.equal(REQUIRED_CONFIRMATIONS.ETH, 12);
  assert.equal(REQUIRED_CONFIRMATIONS.BSC, 15);
  assert.equal(REQUIRED_CONFIRMATIONS.TRON, 19);
  assert.equal(REQUIRED_CONFIRMATIONS.POLYGON, 64);
  assert.equal(REQUIRED_CONFIRMATIONS.ARBITRUM, 64);
});

// =============================================================================
// 17. monitor.start() 不会重复启动（幂等）
// =============================================================================

test('DepositMonitor: start/stop 幂等', () => {
  const monitor = new DepositMonitor();
  assert.equal(monitor.isRunning(), false);
  monitor.start();
  assert.equal(monitor.isRunning(), true);
  monitor.start(); // 再次
  assert.equal(monitor.isRunning(), true);
  monitor.stop();
  assert.equal(monitor.isRunning(), false);
  monitor.stop(); // 再次
  assert.equal(monitor.isRunning(), false);
});

// =============================================================================
// 18. handleWebhook 幂等：相同 hash 多次处理仅产生一个 deposit
// =============================================================================

test('DepositMonitor: handleWebhook 幂等去重', () => {
  const monitor = new DepositMonitor();
  const payload: WebhookPayload = {
    type: 'address_activity',
    id: 'wh_idem',
    createdAt: new Date().toISOString(),
    event: {
      network: 'ETH_MAINNET',
      activity: [{
        fromAddress: USER_ETH,
        toAddress: PLATFORM_ETH,
        blockNum: '0x10',
        hash: '0x' + '7'.repeat(64),
        value: 100,
        asset: 'ETH',
        category: 'external',
      }],
    },
  };
  monitor.handleWebhook(payload);
  monitor.handleWebhook(payload);
  monitor.handleWebhook(payload);
  assert.equal(monitor.getAllDeposits().length, 1);
});
