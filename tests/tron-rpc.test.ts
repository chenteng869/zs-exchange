/**
 * Tron 链接入单元测试
 *
 * 覆盖：
 *  - TRX base58 地址校验
 *  - sun <-> TRX 转换
 *  - TRC20 余额解析（6 位精度）
 *  - 交易历史解析
 *  - 5xx 错误切换端点
 *  - TIMEOUT 切换端点
 *  - 限流 429 处理
 *  - 演示降级
 *  - 工厂函数 createTronService
 *  - 健康检查
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TronRpcClient,
  TronRpcError,
  sunToTrx,
  trc20Format,
  TRX_DECIMALS,
  SUN_PER_TRX,
  TRON_DEFAULT_ENDPOINTS,
} from '../src/lib/wallet/tron-rpc-client';
import {
  TronChainService,
  createTronService,
  probeTron,
  isValidTrxAddress,
  TRC20_USDT_MAINNET,
  TRC20_USDT_DECIMALS,
  TRC20_USDC_MAINNET,
  type TransactionInfo,
} from '../src/lib/wallet/tron-service';

// =============================================================================
// Mock fetch
// =============================================================================

type MockHandler = (url: string, init?: RequestInit) => { status?: number; body?: any; delay?: number; headers?: Record<string, string> };

function createMockFetch(handler: MockHandler | Map<string, MockHandler>): typeof fetch {
  const map = handler instanceof Map ? handler : null;
  const fn = handler instanceof Function ? handler : null;
  return (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    let h: MockHandler | undefined;
    if (map) {
      // 找到匹配前缀
      for (const [prefix, handler] of map.entries()) {
        if (u.startsWith(prefix)) {
          h = handler;
          break;
        }
      }
    } else if (fn) {
      h = fn;
    }
    if (!h) {
      return { ok: false, status: 404, statusText: 'Not Found', text: async () => 'not found', json: async () => ({}) } as Response;
    }
    const result = h(u, init);
    if (result.delay) {
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
      headers: new Map(Object.entries(result.headers || {})),
    } as unknown as Response;
  }) as typeof fetch;
}

/** 标准测试地址（base58 编码的 TRX 地址格式，34 位） */
const TEST_ADDR = 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';
const TEST_CONTRACT = TRC20_USDT_MAINNET; // 34 位 base58

// =============================================================================
// 1. TRX 地址校验
// =============================================================================

test('地址校验: 合法 TRX 地址', () => {
  assert.equal(isValidTrxAddress(TEST_ADDR), true);
  assert.equal(isValidTrxAddress(TRC20_USDT_MAINNET), true);
});

test('地址校验: 非法地址（不以 T 开头）', () => {
  assert.equal(isValidTrxAddress('0x1234567890123456789012345678901234567890'), false);
  assert.equal(isValidTrxAddress('A' + 'A'.repeat(33)), false);
});

test('地址校验: 非法地址（长度不是 34）', () => {
  assert.equal(isValidTrxAddress('T' + 'A'.repeat(32)), false);
  assert.equal(isValidTrxAddress('T' + 'A'.repeat(34)), false);
});

test('地址校验: 非法地址（包含非 base58 字符）', () => {
  // 0/O/I/l 都不在 base58 字符集中
  assert.equal(isValidTrxAddress('T' + '0'.repeat(33)), false);
  assert.equal(isValidTrxAddress('T' + 'O'.repeat(33)), false);
});

// =============================================================================
// 2. sun <-> TRX 转换
// =============================================================================

test('sunToTrx: 1 TRX = 1e6 sun', () => {
  assert.equal(sunToTrx(SUN_PER_TRX), '1');
  assert.equal(sunToTrx(1_000_000n), '1');
});

test('sunToTrx: 0.5 TRX = 500000 sun', () => {
  assert.equal(sunToTrx(500_000n), '0.5');
});

test('sunToTrx: 0', () => {
  assert.equal(sunToTrx(0), '0');
  assert.equal(sunToTrx('0'), '0');
  assert.equal(sunToTrx(0n), '0');
});

test('sunToTrx: 大数（1000 TRX）', () => {
  const result = sunToTrx(1000n * SUN_PER_TRX);
  assert.equal(result, '1000');
});

test('trc20Format: USDT 余额（6 位精度）', () => {
  // 100 USDT = 100,000,000 (6 decimals)
  const raw = 100n * 10n ** 6n;
  assert.equal(trc20Format(raw, 6), '100');
});

test('trc20Format: 1.5 USDT', () => {
  const raw = 1_500_000n;
  assert.equal(trc20Format(raw, 6), '1.5');
});

test('trc20Format: 0', () => {
  assert.equal(trc20Format(0n, 6), '0');
});

// =============================================================================
// 3. TronRpcClient 基本功能
// =============================================================================

test('TronRpcClient: 构造时校验至少一个端点', () => {
  assert.throws(
    () => new TronRpcClient({ endpoints: [] }),
    (err: unknown) => err instanceof TronRpcError && (err as TronRpcError).code === 'NO_ENDPOINTS',
  );
});

test('TronRpcClient: 默认端点列表非空', () => {
  assert.ok(TRON_DEFAULT_ENDPOINTS.length > 0);
  for (const url of TRON_DEFAULT_ENDPOINTS) {
    assert.ok(url.startsWith('https://'), `Tron url: ${url}`);
  }
});

test('TronRpcClient: 携带 API Key 时设置 Header', async () => {
  let capturedHeaders: Record<string, string> = {};
  const client = new TronRpcClient({
    endpoints: ['https://test-rpc'],
    apiKey: 'tron-key-123',
    fetchImpl: createMockFetch((_url, init) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return { status: 200, body: { block_header: { raw_data: { number: 1 } } } };
    }),
  });
  await client.request('/wallet/getnowblock', { method: 'POST', body: {} });
  assert.equal(capturedHeaders['TRON-PRO-API-KEY'], 'tron-key-123');
});

// =============================================================================
// 4. 余额查询
// =============================================================================

test('TronChainService: TRX 原币余额查询', async () => {
  const balanceSun = 1_000_000; // 1 TRX
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((url) => {
      if (url.includes('/v1/accounts/')) {
        return { status: 200, body: { data: [{ address: TEST_ADDR, balance: balanceSun }], success: true } };
      }
      return { status: 200, body: {} };
    }),
  });
  const b = await service.getNativeBalance(TEST_ADDR);
  assert.equal(b.source, 'rpc');
  assert.equal(b.balance, '1');
  assert.equal(b.balanceSun, '1000000');
  assert.equal(b.network, 'mainnet');
  service.stop();
});

test('TronChainService: TRC20 USDT 余额查询（6 位精度）', async () => {
  // 50 USDT = 50,000,000 (6 decimals) → 0x2faf080
  const usdtBalanceHex = (50n * 10n ** 6n).toString(16);
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((url) => {
      if (url.includes('/tokens/trc20')) {
        return {
          status: 200,
          body: {
            data: [{
              tokenId: TRC20_USDT_MAINNET,
              tokenAbbr: 'USDT',
              tokenDecimal: 6,
              balance: usdtBalanceHex,
            }],
            success: true,
          },
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const t = await service.getTrc20Balance(TEST_ADDR, TRC20_USDT_MAINNET, 'USDT', 6);
  assert.equal(t.source, 'rpc');
  assert.equal(t.symbol, 'USDT');
  assert.equal(t.balance, '50');
  assert.equal(t.decimals, 6);
  service.stop();
});

test('TronChainService: 非法地址抛出 INVALID_ADDRESS', async () => {
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({ status: 200, body: {} })),
  });
  await assert.rejects(
    () => service.getNativeBalance('0xinvalid'),
    (err: unknown) => err instanceof TronRpcError && (err as TronRpcError).code === 'INVALID_ADDRESS',
  );
  service.stop();
});

test('TronChainService: 非法合约地址抛出 INVALID_TOKEN', async () => {
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({ status: 200, body: {} })),
  });
  await assert.rejects(
    () => service.getTrc20Balance(TEST_ADDR, '0xinvalid', 'USDT', 6),
    (err: unknown) => err instanceof TronRpcError && (err as TronRpcError).code === 'INVALID_TOKEN',
  );
  service.stop();
});

// =============================================================================
// 5. 交易历史解析
// =============================================================================

test('TronChainService: TRC20 交易历史解析', async () => {
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((url) => {
      if (url.includes('/transactions/trc20')) {
        return {
          status: 200,
          body: {
            data: [
              {
                transaction_id: '0x' + 'a'.repeat(64),
                token_info: { symbol: 'USDT', address: TRC20_USDT_MAINNET, decimals: 6 },
                block_timestamp: Date.now(),
                from: TEST_ADDR,
                to: 'T' + 'B'.repeat(33),
                value: (100n * 10n ** 6n).toString(16),
                confirmed: true,
              },
              {
                transaction_id: '0x' + 'b'.repeat(64),
                token_info: { symbol: 'USDT', address: TRC20_USDT_MAINNET, decimals: 6 },
                block_timestamp: Date.now() - 3600_000,
                from: 'T' + 'C'.repeat(33),
                to: TEST_ADDR,
                value: (50n * 10n ** 6n).toString(16),
                confirmed: true,
              },
            ],
            success: true,
          },
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const history = await service.getTransactionHistory(TEST_ADDR, 20);
  assert.equal(history.length, 2);
  assert.equal(history[0].asset, 'USDT');
  assert.equal(history[0].valueFormatted, '100');
  assert.equal(history[0].status, 'success');
  assert.equal(history[1].valueFormatted, '50');
  service.stop();
});

test('TronChainService: 非法 limit 抛出', async () => {
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch(() => ({ status: 200, body: { data: [], success: true } })),
  });
  await assert.rejects(
    () => service.getTransactionHistory(TEST_ADDR, 0),
    (err: unknown) => err instanceof TronRpcError && (err as TronRpcError).code === 'INVALID_LIMIT',
  );
  await assert.rejects(
    () => service.getTransactionHistory(TEST_ADDR, 500),
    (err: unknown) => err instanceof TronRpcError && (err as TronRpcError).code === 'INVALID_LIMIT',
  );
  service.stop();
});

// =============================================================================
// 6. 链状态
// =============================================================================

test('TronChainService: 链状态查询（区块号 + 时间）', async () => {
  const now = Date.now();
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: createMockFetch((url) => {
      if (url.includes('/wallet/getnowblock')) {
        return {
          status: 200,
          body: { block_header: { raw_data: { number: 72_000_000, timestamp: now } } },
        };
      }
      return { status: 200, body: {} };
    }),
  });
  const s = await service.getChainStatus();
  assert.equal(s.source, 'rpc');
  assert.equal(s.blockNumber, 72_000_000);
  assert.equal(s.blockTime, now);
  service.stop();
});

// =============================================================================
// 7. 端点切换：5xx / TIMEOUT / 429
// =============================================================================

test('TronRpcClient: 5xx 错误自动切换到下一个端点', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://bad-rpc', () => ({ status: 503, body: 'service unavailable' })],
    ['https://good-rpc', () => ({ status: 200, body: { block_header: { raw_data: { number: 100 } } } })],
  ]);
  const client = new TronRpcClient({
    endpoints: ['https://bad-rpc', 'https://good-rpc'],
    fetchImpl: createMockFetch(handler),
    maxRetries: 1,
  });
  const r = await client.request('/wallet/getnowblock', { method: 'POST', body: {} });
  assert.equal((r as any).block_header.raw_data.number, 100);
});

test('TronRpcClient: TIMEOUT 切换到下一个端点', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://slow-rpc', () => ({ status: 200, body: {}, delay: 200 })],
    ['https://fast-rpc', () => ({ status: 200, body: { block_header: { raw_data: { number: 200 } } } })],
  ]);
  const client = new TronRpcClient({
    endpoints: ['https://slow-rpc', 'https://fast-rpc'],
    fetchImpl: createMockFetch(handler),
    timeoutMs: 50,
    maxRetries: 1,
  });
  const r = await client.request('/wallet/getnowblock', { method: 'POST', body: {} });
  assert.equal((r as any).block_header.raw_data.number, 200);
});

test('TronRpcClient: 429 限流处理（切换到下一个端点）', async () => {
  let firstCalled = 0;
  const handler = new Map<string, MockHandler>([
    ['https://limited-rpc', () => { firstCalled++; return { status: 429, body: 'rate limit' }; }],
    ['https://normal-rpc', () => ({ status: 200, body: { block_header: { raw_data: { number: 300 } } } })],
  ]);
  const client = new TronRpcClient({
    endpoints: ['https://limited-rpc', 'https://normal-rpc'],
    fetchImpl: createMockFetch(handler),
    maxRetries: 1,
  });
  const r = await client.request('/wallet/getnowblock', { method: 'POST', body: {} });
  assert.equal((r as any).block_header.raw_data.number, 300);
  assert.ok(firstCalled >= 1);
});

// =============================================================================
// 8. 演示降级
// =============================================================================

test('TronChainService: RPC 失败时降级到 demo 原币余额', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const b = await service.getNativeBalance(TEST_ADDR);
  assert.equal(b.source, 'fallback');
  assert.equal(b.chain, 'TRX');
  assert.ok(BigInt(b.balanceSun) > 0n, 'demo balance should be positive');
  service.stop();
});

test('TronChainService: RPC 失败时降级到 demo TRC20 余额', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const t = await service.getTrc20Balance(TEST_ADDR, TRC20_USDT_MAINNET, 'USDT', 6);
  assert.equal(t.source, 'fallback');
  assert.equal(t.symbol, 'USDT');
  assert.ok(BigInt(t.balanceRaw) > 0n, 'demo token balance should be positive');
  service.stop();
});

test('TronChainService: 链状态降级', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const s = await service.getChainStatus();
  assert.equal(s.source, 'fallback');
  assert.ok(s.blockNumber > 0);
  service.stop();
});

test('TronChainService: 交易历史降级（生成稳定 mock）', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const history = await service.getTransactionHistory(TEST_ADDR, 5);
  assert.equal(history.length, 5);
  assert.ok(history.every(t => t.hash.startsWith('0x') && t.hash.length === 66));
  assert.ok(history.every(t => t.asset === 'USDT'));
  service.stop();
});

test('TronChainService: fallbackToDemo=false 时 RPC 失败会抛错', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: false,
  });
  await assert.rejects(
    () => service.getNativeBalance(TEST_ADDR),
    (err: unknown) => err instanceof TronRpcError,
  );
  service.stop();
});

// =============================================================================
// 9. 工厂函数
// =============================================================================

test('createTronService: 默认配置', () => {
  const svc = createTronService();
  assert.ok(svc);
  const health = svc.getHealth();
  // 至少包含主网端点
  assert.ok(health.length > 0);
  assert.ok(health.some(h => h.url.includes('trongrid.io')));
  svc.stop();
});

test('createTronService: 带 API Key', () => {
  const svc = createTronService('my-pro-key');
  assert.ok(svc);
  assert.ok(svc.getHealth().length > 0);
  svc.stop();
});

test('createTronService: 自定义端点', () => {
  const svc = createTronService(undefined, {
    endpoints: ['https://my-custom-tron-rpc'],
  });
  const health = svc.getHealth();
  assert.equal(health.length, 1);
  assert.equal(health[0].url, 'https://my-custom-tron-rpc');
  svc.stop();
});

test('createTronService: 测试网 (shasta)', () => {
  const svc = createTronService(undefined, { network: 'shasta' });
  const health = svc.getHealth();
  assert.ok(health.every(h => h.url.includes('shasta')));
  svc.stop();
});

test('probeTron: mock 失败时返回 reachable=false', async () => {
  const failFetch = (() => { throw new TronRpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const r = await probeTron(undefined, failFetch);
  assert.equal(r.reachable, false);
  assert.equal(r.healthy, false);
});

test('probeTron: mock 成功时返回 blockNumber', async () => {
  const okFetch = createMockFetch(() => ({
    status: 200,
    body: { block_header: { raw_data: { number: 99_999_999 } } },
  }));
  const r = await probeTron(undefined, okFetch);
  assert.equal(r.reachable, true);
  assert.equal(r.healthy, true);
  assert.equal(r.blockNumber, 99_999_999);
});

// =============================================================================
// 10. 健康检查
// =============================================================================

test('TronRpcClient: 健康检查标记失败节点', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://flaky', () => ({ status: 500, body: 'down' })],
    ['https://healthy', () => ({ status: 200, body: { block_header: { raw_data: { number: 1000 } } } })],
  ]);
  const client = new TronRpcClient({
    endpoints: ['https://flaky', 'https://healthy'],
    fetchImpl: createMockFetch(handler),
  });
  await client.checkHealth();
  const health = client.getHealth();
  const flaky = health.find(h => h.url === 'https://flaky')!;
  const healthy = health.find(h => h.url === 'https://healthy')!;
  assert.equal(flaky.healthy, false);
  assert.equal(healthy.healthy, true);
  assert.equal(healthy.blockNumber, 1000);
});

test('TronRpcClient: 健康检查按延迟排序', async () => {
  const handler = new Map<string, MockHandler>([
    ['https://fast', () => ({ status: 200, body: { block_header: { raw_data: { number: 1 } } } })],
    ['https://slow', () => ({ status: 200, body: { block_header: { raw_data: { number: 2 } } }, delay: 30 })],
  ]);
  const client = new TronRpcClient({
    endpoints: ['https://slow', 'https://fast'],
    fetchImpl: createMockFetch(handler),
  });
  await client.checkHealth();
  const sorted = client.getSortedEndpoints();
  assert.equal(sorted[0], 'https://fast', `expected fast first, got ${sorted[0]}`);
});

test('TronChainService: 启动与停止健康检查', () => {
  const service = new TronChainService({
    endpoints: ['https://test-rpc'],
    healthCheckMs: 0, // 禁用定时，手动触发
    fetchImpl: createMockFetch(() => ({ status: 200, body: { block_header: { raw_data: { number: 5 } } } })),
  });
  service.start();
  service.stop();
  assert.ok(true, 'start/stop ok');
});

// =============================================================================
// 11. 关键地址常量
// =============================================================================

test('关键地址常量: USDT/USDC', () => {
  assert.equal(TRC20_USDT_MAINNET, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
  assert.equal(TRC20_USDC_MAINNET, 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8');
  assert.equal(TRC20_USDT_DECIMALS, 6);
  assert.equal(TRX_DECIMALS, 6);
  assert.equal(SUN_PER_TRX, 1_000_000n);
});

// =============================================================================
// 12. TronRpcError
// =============================================================================

test('TronRpcError: 完整字段', () => {
  const e = new TronRpcError('TEST', 'test error', { status: 503 });
  assert.equal(e.code, 'TEST');
  assert.equal(e.status, 503);
  assert.equal(e.name, 'TronRpcError');
});

// 测试退出清理
test('test runner cleanup', async () => {
  await new Promise(r => setTimeout(r, 50));
  assert.ok(true, 'cleanup ok');
});
