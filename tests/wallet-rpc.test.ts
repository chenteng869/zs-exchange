/**
 * 区块链 RPC 接入单元测试
 *
 * 覆盖：
 *  - JSON-RPC 客户端：基本调用、批量调用、超时、重试
 *  - 多节点健康检查与自动切换
 *  - ETH 链服务：余额 / 代币余额 / 链状态 / 交易查询
 *  - BSC 链服务：同上
 *  - 演示降级：RPC 失败时返回稳定 mock 数据
 *  - 地址校验：EVM 地址格式校验
 *  - 工具函数：wei <-> ether 转换
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RpcClient,
  RpcError,
  weiToEther,
  etherToWei,
  weiBigIntToEther,
  infuraEthUrl,
  alchemyBscUrl,
  ETH_PUBLIC_RPCS,
  BSC_PUBLIC_RPCS,
} from '../src/lib/wallet/rpc-client';
import {
  EvmChainService,
  createEthService,
  createBscService,
  probeEvmChains,
  type TransactionInfo,
} from '../src/lib/wallet/chain-service';

// =============================================================================
// Mock fetch
// =============================================================================

type MockHandler = (body: any) => { status?: number; body?: any; delay?: number };

function createMockFetch(handler: MockHandler | Map<string, MockHandler>): typeof fetch {
  const map = handler instanceof Map ? handler : null;
  const fn = handler instanceof Function ? handler : null;
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    let h: MockHandler | undefined;
    if (map) {
      h = map.get(u);
    } else if (fn) {
      h = fn;
    }
    if (!h) {
      return { ok: false, status: 404, statusText: 'Not Found', text: async () => 'not found', json: async () => ({}) } as Response;
    }
    const result = h(body);
    if (result.delay) {
      // 支持 AbortSignal（用于超时测试）
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, result.delay);
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    }
    return {
      ok: result.status === undefined || (result.status >= 200 && result.status < 300),
      status: result.status || 200,
      statusText: 'OK',
      text: async () => typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
      json: async () => result.body,
    } as Response;
  }) as typeof fetch;
}

const ETH_BLOCK_RESPONSE = (blockHex: string) => ({
  status: 200,
  body: { jsonrpc: '2.0', id: 1, result: blockHex },
});

const ETH_BALANCE_RESPONSE = (weiHex: string) => ({
  status: 200,
  body: { jsonrpc: '2.0', id: 1, result: weiHex },
});

// =============================================================================
// 1. wei / ether 转换工具
// =============================================================================

test('weiToEther: 1 ETH = 1e18 wei', () => {
  assert.equal(weiToEther('0x' + (10n ** 18n).toString(16)), '1');
  assert.equal(weiToEther('0x' + (5n * 10n ** 17n).toString(16)), '0.5');
});

test('weiToEther: 0 wei -> 0', () => {
  assert.equal(weiToEther('0x0'), '0');
  assert.equal(weiToEther('0x'), '0');
});

test('weiBigIntToEther: BigInt 转换', () => {
  assert.equal(weiBigIntToEther(10n ** 18n), '1');
  assert.equal(weiBigIntToEther(0n), '0');
});

test('etherToWei: ETH -> wei (hex)', () => {
  assert.equal(etherToWei('1'), '0x' + (10n ** 18n).toString(16));
  assert.equal(etherToWei('0.5'), '0x' + (5n * 10n ** 17n).toString(16));
  assert.equal(etherToWei(0), '0x0');
});

test('URL 工厂函数: Infura + Alchemy', () => {
  assert.equal(infuraEthUrl('test123'), 'https://mainnet.infura.io/v3/test123');
  assert.equal(alchemyBscUrl('test456'), 'https://bsc-mainnet.g.alchemy.com/v2/test456');
});

test('公共 RPC 端点列表非空', () => {
  assert.ok(ETH_PUBLIC_RPCS.length > 0, 'ETH public RPC list');
  assert.ok(BSC_PUBLIC_RPCS.length > 0, 'BSC public RPC list');
  for (const url of ETH_PUBLIC_RPCS) assert.ok(url.startsWith('https://'), `ETH url: ${url}`);
  for (const url of BSC_PUBLIC_RPCS) assert.ok(url.startsWith('https://'), `BSC url: ${url}`);
});

// =============================================================================
// 2. RpcClient 基本功能
// =============================================================================

test('RpcClient: 构造时校验至少一个端点', () => {
  assert.throws(
    () => new RpcClient({ endpoints: [] }),
    (err: unknown) => err instanceof RpcError && (err as RpcError).code === 'NO_ENDPOINTS',
  );
});

test('RpcClient.call: 成功路径', async () => {
  const client = new RpcClient({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_blockNumber') return ETH_BLOCK_RESPONSE('0x1234');
      return { status: 200, body: { jsonrpc: '2.0', id: 1, result: '0x0' } };
    }),
  });
  const result = await client.call<string>('eth_blockNumber');
  assert.equal(result, '0x1234');
});

test('RpcClient.call: RPC error 抛出 RpcError', async () => {
  const client = new RpcClient({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({
      status: 200,
      body: { jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'execution reverted' } },
    })),
  });
  await assert.rejects(
    () => client.call<string>('eth_call', []),
    (err: unknown) => err instanceof RpcError && (err as RpcError).rpcCode === -32000,
  );
});

test('RpcClient.call: HTTP 500 错误 (5xx 为终端错误)', async () => {
  const client = new RpcClient({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({ status: 500, body: 'server error' })),
    maxRetries: 3,
  });
  await assert.rejects(
    () => client.call<string>('eth_blockNumber'),
    (err: unknown) => err instanceof RpcError && (err as RpcError).code === 'HTTP_500',
  );
});

test('RpcClient.call: 超时抛出 TIMEOUT (终端错误)', async () => {
  const client = new RpcClient({
    endpoints: ['https://slow-rpc'],
    timeoutMs: 50,
    fetchImpl: createMockFetch(() => ({ status: 200, body: { jsonrpc: '2.0', id: 1 }, delay: 200 })),
  });
  await assert.rejects(
    () => client.call<string>('eth_blockNumber'),
    (err: unknown) => err instanceof RpcError && (err as RpcError).code === 'TIMEOUT',
  );
});

test('RpcClient: 多端点自动选择健康的', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://bad-rpc', () => ({ status: 500, body: 'down' })],
    ['https://good-rpc', () => ETH_BLOCK_RESPONSE('0xabcd')],
  ]);
  const client = new RpcClient({
    endpoints: ['https://bad-rpc', 'https://good-rpc'],
    fetchImpl: createMockFetch(handler),
    maxRetries: 1,
  });
  // 第一次：bad-rpc 失败 → 自动切换到 good-rpc
  const r = await client.call<string>('eth_blockNumber');
  assert.equal(r, '0xabcd');
});

test('RpcClient.batch: 批量调用按 id 排序', async () => {
  const client = new RpcClient({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (Array.isArray(body)) {
        return {
          status: 200,
          body: body.map((req, i) => ({
            jsonrpc: '2.0',
            id: req.id,
            result: '0x' + (i + 1).toString(16).padStart(4, '0'),
          })),
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const r = await client.batch<string>([
    { method: 'eth_blockNumber' },
    { method: 'eth_gasPrice' },
    { method: 'eth_chainId' },
  ]);
  assert.equal(r.length, 3);
  assert.equal(r[0], '0x0001');
  assert.equal(r[1], '0x0002');
  assert.equal(r[2], '0x0003');
});

// =============================================================================
// 3. 健康检查
// =============================================================================

test('RpcClient: 健康检查标记失败节点', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://flaky', () => ({ status: 500, body: 'down' })],
    ['https://healthy', () => ETH_BLOCK_RESPONSE('0x100')],
  ]);
  const client = new RpcClient({
    endpoints: ['https://flaky', 'https://healthy'],
    fetchImpl: createMockFetch(handler),
  });
  await client.checkHealth();
  const health = client.getHealth();
  const flaky = health.find(h => h.url === 'https://flaky')!;
  const healthy = health.find(h => h.url === 'https://healthy')!;
  assert.equal(flaky.healthy, false, 'flaky should be unhealthy');
  assert.equal(healthy.healthy, true, 'healthy should be healthy');
  assert.equal(healthy.blockNumber, 256);
});

test('RpcClient: 健康检查按延迟排序', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://fast', () => ETH_BLOCK_RESPONSE('0x1')],
    ['https://slow', () => ({ ...ETH_BLOCK_RESPONSE('0x2'), delay: 30 })],
  ]);
  const client = new RpcClient({
    endpoints: ['https://slow', 'https://fast'],
    fetchImpl: createMockFetch(handler),
  });
  await client.checkHealth();
  const sorted = client.getSortedEndpoints();
  assert.equal(sorted[0], 'https://fast', `expected fast first, got ${sorted[0]}`);
});

// =============================================================================
// 4. ETH 链服务
// =============================================================================

test('EvmChainService(ETH): 原币余额查询', async () => {
  const oneEth = '0x' + (10n ** 18n).toString(16);
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_getBalance') return ETH_BALANCE_RESPONSE(oneEth);
      return { status: 200, body: {} };
    }),
  });
  const b = await service.getNativeBalance('0x1234567890123456789012345678901234567890');
  assert.equal(b.source, 'rpc');
  assert.equal(b.unit, 'ETH');
  assert.equal(b.balance, '1');
  assert.equal(b.balanceWei, '1000000000000000000');
  service.stop();
});

test('EvmChainService(ETH): 错误地址抛出', async () => {
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({ status: 200, body: {} })),
  });
  await assert.rejects(
    () => service.getNativeBalance('0xinvalid'),
    (err: unknown) => err instanceof RpcError && (err as RpcError).code === 'INVALID_ADDRESS',
  );
  service.stop();
});

test('EvmChainService(ETH): RPC 失败时降级到 fallback', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const b = await service.getNativeBalance('0x1234567890123456789012345678901234567890');
  assert.equal(b.source, 'fallback');
  assert.equal(b.unit, 'ETH');
  assert.ok(parseFloat(b.balance) >= 0, 'fallback balance should be non-negative');
  service.stop();
});

test('EvmChainService(ETH): 批量余额查询', async () => {
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (Array.isArray(body)) {
        return {
          status: 200,
          body: body.map((req, i) => ({
            jsonrpc: '2.0',
            id: req.id,
            result: '0x' + (BigInt(i + 1) * 10n ** 17n).toString(16),
          })),
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const balances = await service.getNativeBalances([
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
  ]);
  assert.equal(balances.length, 2);
  assert.equal(balances[0].balance, '0.1');
  assert.equal(balances[1].balance, '0.2');
  service.stop();
});

test('EvmChainService(ETH): 代币余额查询（ERC20）', async () => {
  const rawBalance = '0x' + (50n * 10n ** 6n).toString(16); // 50 USDT (6 decimals)
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_call') return { status: 200, body: { jsonrpc: '2.0', id: 1, result: rawBalance } };
      return { status: 200, body: {} };
    }),
  });
  const t = await service.getTokenBalance(
    '0x1234567890123456789012345678901234567890',
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    'USDT',
    6,
  );
  assert.equal(t.source, 'rpc');
  assert.equal(t.symbol, 'USDT');
  assert.equal(t.balance, '50');
  service.stop();
});

test('EvmChainService(ETH): 链状态查询（区块号 + gas）', async () => {
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (Array.isArray(body)) {
        return {
          status: 200,
          body: body.map(req => ({
            jsonrpc: '2.0',
            id: req.id,
            result: req.method === 'eth_blockNumber' ? '0x1234567' : '0x174876e800', // 100 gwei
          })),
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const s = await service.getChainStatus();
  assert.equal(s.source, 'rpc');
  assert.equal(s.blockNumber, 19088743); // 0x1234567
  assert.equal(s.gasPriceUnit, 'ETH');
  service.stop();
});

test('EvmChainService(ETH): 交易计数 (nonce)', async () => {
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_getTransactionCount') return { status: 200, body: { jsonrpc: '2.0', id: 1, result: '0x2a' } };
      return { status: 200, body: {} };
    }),
  });
  const nonce = await service.getTransactionCount('0x1234567890123456789012345678901234567890');
  assert.equal(nonce, 42);
  service.stop();
});

test('EvmChainService(ETH): 交易历史降级 (RPC 失败)', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new EvmChainService({
    chain: 'ETH',
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const history = await service.getTransactionHistory('0x1234567890123456789012345678901234567890', 5);
  assert.equal(history.length, 5);
  assert.ok(history.every(t => t.hash.startsWith('0x')));
  service.stop();
});

// =============================================================================
// 5. BSC 链服务
// =============================================================================

test('EvmChainService(BSC): 原币余额', async () => {
  const oneBnb = '0x' + (10n ** 18n).toString(16);
  const service = new EvmChainService({
    chain: 'BSC',
    endpoints: ['https://bsc-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_getBalance') return ETH_BALANCE_RESPONSE(oneBnb);
      return { status: 200, body: {} };
    }),
  });
  const b = await service.getNativeBalance('0x1234567890123456789012345678901234567890');
  assert.equal(b.unit, 'BNB');
  assert.equal(b.source, 'rpc');
  service.stop();
});

test('EvmChainService(BSC): BEP20 代币余额', async () => {
  const rawBalance = '0x' + (1000n * 10n ** 18n).toString(16); // 1000 USDT (18 decimals on BSC)
  const service = new EvmChainService({
    chain: 'BSC',
    endpoints: ['https://bsc-rpc'],
    fetchImpl: createMockFetch((body) => {
      if (body.method === 'eth_call') return { status: 200, body: { jsonrpc: '2.0', id: 1, result: rawBalance } };
      return { status: 200, body: {} };
    }),
  });
  const t = await service.getTokenBalance(
    '0x1234567890123456789012345678901234567890',
    '0x55d398326f99059ff775485246999027b3197955', // BSC USDT
    'USDT',
    18,
  );
  assert.equal(t.source, 'rpc');
  assert.equal(t.balance, '1000');
  service.stop();
});

test('EvmChainService(BSC): 链状态 (fallback)', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new EvmChainService({
    chain: 'BSC',
    endpoints: ['https://bsc-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const s = await service.getChainStatus();
  assert.equal(s.source, 'fallback');
  assert.equal(s.gasPriceUnit, 'BNB');
  service.stop();
});

// =============================================================================
// 6. 工厂函数
// =============================================================================

test('createEthService: 默认端点列表', () => {
  const s1 = createEthService();
  assert.ok(s1);
  s1.stop();
});

test('createEthService: 带 API key 时优先使用 Infura', () => {
  const s = createEthService('test-key');
  const health = s.getHealth();
  assert.ok(health.some(h => h.url.includes('infura.io')), 'Infura should be in endpoint list');
  s.stop();
});

test('createBscService: 带 API key 时优先使用 Alchemy', () => {
  const s = createBscService('test-key');
  const health = s.getHealth();
  assert.ok(health.some(h => h.url.includes('alchemy.com')), 'Alchemy should be in endpoint list');
  s.stop();
});

test('probeEvmChains: 探测 ETH + BSC (mock fail)', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const r = await probeEvmChains(undefined, undefined, failFetch);
  assert.equal(r.eth.reachable, false);
  assert.equal(r.bsc.reachable, false);
});

// =============================================================================
// 7. RPC 客户端健康检查生命周期
// =============================================================================

test('RpcClient: 启动与停止健康检查', () => {
  const client = new RpcClient({
    endpoints: ['https://test-rpc'],
    healthCheckMs: 50,
    fetchImpl: createMockFetch(() => ETH_BLOCK_RESPONSE('0x1')),
  });
  client.startHealthCheck();
  // 等待至少一次检查
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const health = client.getHealth();
      assert.ok(health.length > 0);
      assert.ok(health[0].blockNumber !== undefined, 'health check should update block number');
      client.stopHealthCheck();
      resolve();
    }, 100);
  });
});

// =============================================================================
// 8. RpcError 类型
// =============================================================================

test('RpcError: 完整字段', () => {
  const e = new RpcError('TEST', 'test error', { status: 404, rpcCode: -32000, endpoint: 'https://x' });
  assert.equal(e.code, 'TEST');
  assert.equal(e.status, 404);
  assert.equal(e.rpcCode, -32000);
  assert.equal(e.endpoint, 'https://x');
  assert.equal(e.name, 'RpcError');
});

// 测试退出清理
test('test runner cleanup', async () => {
  await new Promise(r => setTimeout(r, 50));
  assert.ok(true, 'cleanup ok');
});
