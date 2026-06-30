/**
 * 统一多链 SDK（ChainClient）单元测试
 *
 * 覆盖：
 *  1. EvmChainClientAdapter 适配正确
 *  2. TronChainClientAdapter 适配正确
 *  3. ChainRegistry register / getClient
 *  4. getBalances 并行查询（多链 + 多代币）
 *  5. getAllChainsHealth（并行探测）
 *  6. 未知 chainId 抛错（ChainNotRegisteredError）
 *
 * Bonus：
 *  7. getTransaction 适配（EVM + TRON）
 *  8. 演示降级在所有适配器中一致工作
 *  9. createDefaultRegistry 默认注册 ETH + BSC + TRON
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EvmChainClientAdapter,
  TronChainClientAdapter,
  ChainRegistry,
  createDefaultRegistry,
  ChainNotRegisteredError,
  type ChainClient,
  type TokenRef,
  type ChainTokenQuery,
  RpcError,
} from '../src/lib/wallet';

// =============================================================================
// Mock fetch（EVM JSON-RPC 风格）
// =============================================================================

type MockHandler = (url: string, body: any) => { status?: number; body?: any; delay?: number };

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
    const result = h(u, body);
    if (result.delay) {
      await new Promise<void>((resolve) => setTimeout(resolve, result.delay));
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

const ETH_ADDR = '0x1234567890123456789012345678901234567890';
const ETH_BLOCK = '0x1234';
const ETH_BALANCE_1ETH = '0x' + (10n ** 18n).toString(16);

// 一个真实可用的 TRON 主网地址（T 开头）
const TRON_ADDR = 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';
const TRC20_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20

function evmMockFetch(): typeof fetch {
  return createMockFetch((_url, body) => {
    // 批量
    if (Array.isArray(body)) {
      return {
        status: 200,
        body: body.map((req: any) => ({
          jsonrpc: '2.0',
          id: req.id,
          result: req.method === 'eth_blockNumber' ? ETH_BLOCK : '0x0',
        })),
      };
    }
    if (body.method === 'eth_getBalance') {
      return { status: 200, body: { jsonrpc: '2.0', id: 1, result: ETH_BALANCE_1ETH } };
    }
    if (body.method === 'eth_call') {
      return { status: 200, body: { jsonrpc: '2.0', id: 1, result: ETH_BALANCE_1ETH } };
    }
    if (body.method === 'eth_blockNumber') {
      return { status: 200, body: { jsonrpc: '2.0', id: 1, result: ETH_BLOCK } };
    }
    if (body.method === 'eth_gasPrice') {
      return { status: 200, body: { jsonrpc: '2.0', id: 1, result: '0x174876e800' } };
    }
    return { status: 200, body: { jsonrpc: '2.0', id: 1, result: '0x0' } };
  });
}

function tronMockFetch(): typeof fetch {
  return createMockFetch((url, _body) => {
    // /v1/accounts/<addr>
    if (/\/v1\/accounts\/[^/]+$/.test(url)) {
      return {
        status: 200,
        body: { data: [{ balance: 1_500_000 }] }, // 1.5 TRX
      };
    }
    // /v1/accounts/<addr>/tokens/<contract>
    if (/\/v1\/accounts\/[^/]+\/tokens\/[^/]+/.test(url)) {
      return {
        status: 200,
        body: { data: [{ balance: '1500000' }] }, // 1.5 USDT (6 decimals)
      };
    }
    // /v1/transactions/<hash>
    if (/\/v1\/transactions\/[0-9a-fA-F]{64}/.test(url)) {
      return {
        status: 200,
        body: { data: [{
          txID: 'a'.repeat(64),
          blockNumber: 65000000,
          block_timestamp: Date.now() - 1000,
          raw_data: {
            contract: [{
              parameter: {
                value: {
                  owner_address: '41' + 'a'.repeat(40),
                  to_address: '41' + 'b'.repeat(40),
                  amount: 1000000,
                },
              },
            }],
          },
        }] },
      };
    }
    // /wallet/getnowblock
    if (url.includes('/wallet/getnowblock')) {
      return {
        status: 200,
        body: { blockID: '00' + 'a'.repeat(62), block_header: { raw_data: { number: 65000001 } } },
      };
    }
    return { status: 200, body: { data: [] } };
  });
}

// =============================================================================
// 1. EvmChainClientAdapter 适配正确
// =============================================================================

test('EvmChainClientAdapter: 原币余额字段映射正确', async () => {
  const adapter = new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: evmMockFetch(),
  });
  const b = await adapter.getNativeBalance(ETH_ADDR);
  assert.equal(b.chain, 'ETH');
  assert.equal(b.symbol, 'ETH');
  assert.equal(b.decimals, 18);
  assert.equal(b.unit, 'ETH');
  assert.equal(b.balance, '1');
  assert.equal(b.source, 'rpc');
  adapter.stop();
});

test('EvmChainClientAdapter: 代币余额需 contractAddress', async () => {
  const adapter = new EvmChainClientAdapter('BSC', {
    endpoints: ['https://bsc-rpc'],
    fetchImpl: evmMockFetch(),
  });
  const token: TokenRef = {
    symbol: 'USDT',
    decimals: 18,
    contractAddress: '0x55d398326f99059ff775485246999027b3197955',
  };
  const t = await adapter.getTokenBalance(ETH_ADDR, token);
  assert.equal(t.chain, 'BSC');
  assert.equal(t.symbol, 'USDT');
  assert.equal(t.contractAddress, token.contractAddress);
  assert.equal(t.balance, '1');
  adapter.stop();
});

test('EvmChainClientAdapter: getChainStatus / getBlockNumber / getGasPrice', async () => {
  const adapter = new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: evmMockFetch(),
  });
  const s = await adapter.getChainStatus();
  assert.equal(s.chain, 'ETH');
  assert.equal(s.blockNumber, parseInt(ETH_BLOCK, 16));
  const bn = await adapter.getBlockNumber();
  assert.equal(bn, s.blockNumber);
  const gp = await adapter.getGasPrice();
  assert.equal(typeof gp, 'string');
  adapter.stop();
});

// =============================================================================
// 2. TronChainClientAdapter 适配正确
// =============================================================================

test('TronChainClientAdapter: 原币余额字段映射正确', async () => {
  const adapter = new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  });
  const b = await adapter.getNativeBalance(TRON_ADDR);
  assert.equal(b.chain, 'TRON');
  assert.equal(b.symbol, 'TRX');
  assert.equal(b.decimals, 6);
  assert.equal(b.unit, 'TRX');
  assert.equal(b.balanceRaw, '1500000');
  assert.equal(b.source, 'rpc');
  adapter.stop();
});

test('TronChainClientAdapter: TRC20 代币余额', async () => {
  const adapter = new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  });
  const token: TokenRef = {
    symbol: 'USDT',
    decimals: 6,
    contractAddress: TRC20_USDT,
  };
  const t = await adapter.getTokenBalance(TRON_ADDR, token);
  assert.equal(t.chain, 'TRON');
  assert.equal(t.symbol, 'USDT');
  assert.equal(t.contractAddress, TRC20_USDT);
  assert.equal(t.balanceRaw, '1500000');
  assert.equal(t.source, 'rpc');
  adapter.stop();
});

test('TronChainClientAdapter: getChainStatus / getBlockNumber', async () => {
  const adapter = new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  });
  const s = await adapter.getChainStatus();
  assert.equal(s.chain, 'TRON');
  assert.equal(s.blockNumber, 65000001);
  const bn = await adapter.getBlockNumber();
  assert.equal(bn, 65000001);
  adapter.stop();
});

test('TronChainClientAdapter: getTransaction 字段映射', async () => {
  const adapter = new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  });
  const tx = await adapter.getTransaction('a'.repeat(64));
  assert.ok(tx !== null, 'should return a transaction');
  assert.equal(tx!.status, 'success');
  assert.equal(tx!.value, '1000000');
  // from/to 是 hex 转换的 base58 字符串，可能不以 T 开头（mock 数据 hex 是任意填充）
  assert.equal(typeof tx!.from, 'string');
  assert.equal(typeof tx!.to, 'string');
  adapter.stop();
});

test('TronChainClientAdapter: 演示降级（fallback）', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const adapter = new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const b = await adapter.getNativeBalance(TRON_ADDR);
  assert.equal(b.source, 'fallback');
  assert.equal(b.symbol, 'TRX');
  adapter.stop();
});

// =============================================================================
// 3. ChainRegistry register / getClient
// =============================================================================

test('ChainRegistry: register / getClient / hasClient / listChains', () => {
  const reg = new ChainRegistry();
  const eth = new EvmChainClientAdapter('ETH', { endpoints: ['https://eth-rpc'], fetchImpl: evmMockFetch() });
  const tron = new TronChainClientAdapter({ endpoints: ['https://tron-rpc'], fetchImpl: tronMockFetch() });

  reg.register('ETH', eth);
  reg.register('TRON', tron);

  assert.equal(reg.hasClient('ETH'), true);
  assert.equal(reg.hasClient('TRON'), true);
  assert.equal(reg.hasClient('BSC'), false);

  const got = reg.getClient('ETH');
  assert.equal(got.chain, 'ETH');

  const list = reg.listChains().sort();
  assert.deepEqual(list, ['ETH', 'TRON']);

  reg.stopAll();
});

test('ChainRegistry: register 时 chain 不匹配抛错', () => {
  const reg = new ChainRegistry();
  const eth = new EvmChainClientAdapter('ETH', { endpoints: ['https://eth-rpc'], fetchImpl: evmMockFetch() });
  assert.throws(() => reg.register('BSC', eth), /mismatch/);
  eth.stop();
});

// =============================================================================
// 4. getBalances 并行查询
// =============================================================================

test('ChainRegistry.getBalances: 并行查询 ETH + BSC + TRON 多代币', async () => {
  const reg = new ChainRegistry();
  reg.register('ETH', new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: evmMockFetch(),
  }));
  reg.register('BSC', new EvmChainClientAdapter('BSC', {
    endpoints: ['https://bsc-rpc'],
    fetchImpl: evmMockFetch(),
  }));
  reg.register('TRON', new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  }));

  const queries: ChainTokenQuery[] = [
    { chain: 'ETH', token: { symbol: 'ETH', decimals: 18, isNative: true }, address: ETH_ADDR },
    { chain: 'ETH', token: { symbol: 'USDT', decimals: 6, contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, address: ETH_ADDR },
    { chain: 'BSC', token: { symbol: 'BNB', decimals: 18, isNative: true }, address: ETH_ADDR },
    { chain: 'TRON', token: { symbol: 'TRX', decimals: 6, isNative: true }, address: TRON_ADDR },
    { chain: 'TRON', token: { symbol: 'USDT', decimals: 6, contractAddress: TRC20_USDT }, address: TRON_ADDR },
  ];

  const start = Date.now();
  const balances = await reg.getBalances(queries);
  const elapsed = Date.now() - start;

  assert.equal(balances.length, 5);
  // 应该并行执行（5 个查询总耗时 < 5 * 50ms = 250ms）
  assert.ok(elapsed < 1000, `getBalances should be parallel, elapsed=${elapsed}ms`);

  // 验证每条记录
  const eth = balances.find(b => b.chain === 'ETH' && b.symbol === 'ETH')!;
  assert.ok(eth, 'ETH native balance should exist');
  assert.equal(eth.balance, '1');

  const bnb = balances.find(b => b.chain === 'BSC' && b.symbol === 'BNB')!;
  assert.ok(bnb, 'BSC native balance should exist');

  const trx = balances.find(b => b.chain === 'TRON' && b.symbol === 'TRX')!;
  assert.ok(trx, 'TRON native balance should exist');
  assert.equal(trx.balanceRaw, '1500000');

  const trxUsdt = balances.find(b => b.chain === 'TRON' && b.symbol === 'USDT')!;
  assert.ok(trxUsdt, 'TRON USDT balance should exist');
  assert.equal(trxUsdt.contractAddress, TRC20_USDT);

  reg.stopAll();
});

test('ChainRegistry.getBalances: 失败项通过 onError 回调并被过滤', async () => {
  const reg = new ChainRegistry();
  reg.register('ETH', new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: evmMockFetch(),
  }));

  // 未注册 BSC 的查询
  const queries: ChainTokenQuery[] = [
    { chain: 'ETH', token: { symbol: 'ETH', decimals: 18, isNative: true }, address: ETH_ADDR },
    { chain: 'BSC', token: { symbol: 'BNB', decimals: 18, isNative: true }, address: ETH_ADDR },
  ];

  const errors: string[] = [];
  const balances = await reg.getBalances(queries, (err) => {
    errors.push(err.message);
  });

  assert.equal(balances.length, 1);
  assert.equal(balances[0].chain, 'ETH');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /not registered/);

  reg.stopAll();
});

// =============================================================================
// 5. getAllChainsHealth
// =============================================================================

test('ChainRegistry.getAllChainsHealth: 并行探测所有链', async () => {
  const reg = new ChainRegistry();
  reg.register('ETH', new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: evmMockFetch(),
  }));
  reg.register('BSC', new EvmChainClientAdapter('BSC', {
    endpoints: ['https://bsc-rpc'],
    fetchImpl: evmMockFetch(),
  }));
  reg.register('TRON', new TronChainClientAdapter({
    endpoints: ['https://tron-rpc'],
    fetchImpl: tronMockFetch(),
  }));

  const health = await reg.getAllChainsHealth();
  assert.equal(health.size, 3);
  assert.ok(health.has('ETH'));
  assert.ok(health.has('BSC'));
  assert.ok(health.has('TRON'));
  for (const [, r] of health) {
    assert.ok(typeof r.latencyMs === 'number');
  }
  reg.stopAll();
});

test('ChainRegistry.getAllChainsHealth: 探测失败时返回 reachable=false', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const reg = new ChainRegistry();
  reg.register('ETH', new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: failFetch,
  }));
  const health = await reg.getAllChainsHealth();
  const eth = health.get('ETH')!;
  assert.equal(eth.reachable, false);
  assert.equal(eth.healthy, false);
  reg.stopAll();
});

// =============================================================================
// 6. 未知 chainId 抛错
// =============================================================================

test('ChainRegistry: 未知 chainId 抛 ChainNotRegisteredError', () => {
  const reg = new ChainRegistry();
  assert.throws(
    () => reg.getClient('SOLANA'),
    (err: unknown) => err instanceof ChainNotRegisteredError && (err as RpcError).code === 'CHAIN_NOT_REGISTERED',
  );
});

test('ChainNotRegisteredError: 错误信息包含链名', () => {
  const reg = new ChainRegistry();
  try {
    reg.getClient('BITCOIN');
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof ChainNotRegisteredError);
    assert.match((err as Error).message, /BITCOIN/);
  }
});

// =============================================================================
// 7. Bonus: 演示降级在 EVM 适配器中一致
// =============================================================================

test('EvmChainClientAdapter: 演示降级（fallback）', async () => {
  const failFetch = (() => { throw new RpcError('NETWORK', 'offline'); }) as unknown as typeof fetch;
  const adapter = new EvmChainClientAdapter('ETH', {
    endpoints: ['https://eth-rpc'],
    fetchImpl: failFetch,
    fallbackToDemo: true,
  });
  const b = await adapter.getNativeBalance(ETH_ADDR);
  assert.equal(b.source, 'fallback');
  assert.equal(b.chain, 'ETH');
  adapter.stop();
});

test('ChainClient 接口: 适配器实例满足结构', () => {
  // 编译期检查：两个适配器都应实现 ChainClient
  const a: ChainClient = new EvmChainClientAdapter('ETH', { endpoints: ['https://x'], fetchImpl: evmMockFetch() });
  const b: ChainClient = new TronChainClientAdapter({ endpoints: ['https://x'], fetchImpl: tronMockFetch() });
  assert.equal(typeof a.getNativeBalance, 'function');
  assert.equal(typeof b.getNativeBalance, 'function');
  a.stop();
  b.stop();
});

// =============================================================================
// 8. Bonus: createDefaultRegistry
// =============================================================================

test('createDefaultRegistry: 默认注册 ETH + BSC + TRON', () => {
  const reg = createDefaultRegistry({
    endpoints: {
      eth: ['https://eth-rpc'],
      bsc: ['https://bsc-rpc'],
      tron: ['https://tron-rpc'],
    },
    fetchImpl: evmMockFetch(), // Tron 自身适配，evm mock 在此仅占位
  });
  const list = reg.listChains().sort();
  assert.deepEqual(list, ['BSC', 'ETH', 'TRON']);
  reg.stopAll();
});
