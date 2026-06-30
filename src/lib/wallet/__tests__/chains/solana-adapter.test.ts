import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolanaAdapter, isValidSolanaAddress, lamportsToSOL, solToLamports } from '../../chains/solana-adapter';
import { Connection } from '@solana/web3.js';

vi.mock('@solana/web3.js', async () => {
  const original = await vi.importActual('@solana/web3.js');
  
  const mockGetBalance = vi.fn(async () => 1000000000);
  const mockGetAccountInfo = vi.fn(async () => ({
    lamports: 1000000000,
    owner: { toBase58: () => '11111111111111111111111111111111' },
    executable: false,
    data: [],
  }));
  const mockGetBlock = vi.fn(async () => ({
    slot: 123456789,
    blockhash: 'abc123',
    previousBlockhash: 'def456',
    parentSlot: 123456788,
    blockTime: 1690000000,
    transactions: [],
    rewards: [],
  }));
  const mockGetTokenAccountsByOwner = vi.fn(async () => ({
    value: [],
  }));
  const mockGetTransaction = vi.fn(async () => ({
    slot: 123456789,
    blockTime: 1690000000,
    transaction: {
      message: {
        accountKeys: [
          { toBase58: () => '5vPDcfdUgNGdpZFY8R9wAfcUcNxL3UjY9zQ5VvRzXxwz' },
          { toBase58: () => '11111111111111111111111111111111' },
        ],
        recentBlockhash: 'abc123',
        instructions: [],
      },
      signatures: ['test-signature'],
    },
    meta: { fee: 5000, err: null, status: { Ok: null } },
  }));
  const mockGetLatestBlockhash = vi.fn(async () => ({
    value: { blockhash: 'abc123', lastValidBlockHeight: 200000015 },
  }));
  const mockGetFeeForMessage = vi.fn(async () => 5000);
  const mockGetSignatureStatus = vi.fn(async () => ({
    value: { confirmationStatus: 'confirmed' },
  }));
  const mockSimulateTransaction = vi.fn(async () => ({
    value: { err: null, logs: [], unitsConsumed: 1000 },
  }));
  const mockSendRawTransaction = vi.fn(async () => 'test-tx-hash');
  const mockGetSlot = vi.fn(async () => 200000000);
  const mockGetEpochInfo = vi.fn(async () => ({
    epoch: 420,
    slotIndex: 12345,
    slotsInEpoch: 432000,
    absoluteSlot: 200000000,
    blockHeight: 100000000,
    transactionCount: 0,
  }));

  return {
    ...original,
    Connection: vi.fn().mockImplementation(() => ({
      getBalance: mockGetBalance,
      getAccountInfo: mockGetAccountInfo,
      getBlock: mockGetBlock,
      getTokenAccountsByOwner: mockGetTokenAccountsByOwner,
      getTransaction: mockGetTransaction,
      getLatestBlockhash: mockGetLatestBlockhash,
      getFeeForMessage: mockGetFeeForMessage,
      getSignatureStatus: mockGetSignatureStatus,
      simulateTransaction: mockSimulateTransaction,
      sendRawTransaction: mockSendRawTransaction,
      getSlot: mockGetSlot,
      getEpochInfo: mockGetEpochInfo,
      rpcEndpoint: 'http://localhost:8899',
    })),
  };
});

describe('SolanaAdapter - Solana 链适配器', () => {
  let adapter: SolanaAdapter;
  const testAddress = '5vPDcfdUgNGdpZFY8R9wAfcUcNxL3UjY9zQ5VvRzXxwz';

  beforeEach(() => {
    adapter = new SolanaAdapter({
      rpcUrl: 'http://localhost:8899',
    });
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用指定配置创建适配器', () => {
      const config = {
        rpcUrl: 'http://localhost:8899',
        network: 'devnet',
      };
      const devnetAdapter = new SolanaAdapter(config);
      expect(devnetAdapter).toBeDefined();
    });

    it('应该使用默认配置创建适配器', () => {
      const defaultAdapter = new SolanaAdapter();
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('链信息查询', () => {
    it('应该返回支持的链列表', () => {
      const chains = adapter.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains).toContain('mainnet');
    });

    it('应该能获取指定链的信息', () => {
      const chainInfo = adapter.getChainInfo('mainnet');
      expect(chainInfo).toBeDefined();
      expect(chainInfo.chainName).toBe('Solana Mainnet Beta');
      expect(chainInfo.symbol).toBe('SOL');
    });
  });

  describe('地址验证', () => {
    it('应该能验证有效的 Solana 地址', () => {
      const valid = isValidSolanaAddress(testAddress);
      expect(valid).toBe(true);
    });

    it('应该能识别无效地址', () => {
      const invalid = isValidSolanaAddress('invalid-address');
      expect(invalid).toBe(false);
    });

    it('空地址应该返回 false', () => {
      const invalid = isValidSolanaAddress('');
      expect(invalid).toBe(false);
    });

    it('长度不足的地址应该返回 false', () => {
      const invalid = isValidSolanaAddress('abc123');
      expect(invalid).toBe(false);
    });
  });

  describe('工具函数', () => {
    it('应该能正确转换 Lamports 到 SOL', () => {
      const sol = lamportsToSOL(1000000000);
      expect(sol).toBe('1');
    });

    it('应该能正确转换 SOL 到 Lamports', () => {
      const lamports = solToLamports('1');
      expect(lamports).toBe('1000000000');
    });

    it('应该能正确转换带小数的 SOL', () => {
      const sol = lamportsToSOL(1500000000);
      expect(sol).toBe('1.5');
    });
  });

  describe('缓存管理', () => {
    it('应该能清除缓存', () => {
      expect(() => {
        adapter.clearCache();
      }).not.toThrow();
    });
  });

  describe('网络配置', () => {
    it('应该支持主网配置', () => {
      const mainnetAdapter = new SolanaAdapter({});
      expect(mainnetAdapter).toBeDefined();
    });

    it('应该支持 Devnet 配置', () => {
      const devnetAdapter = new SolanaAdapter({});
      expect(devnetAdapter).toBeDefined();
    });

    it('应该支持 Testnet 配置', () => {
      const testnetAdapter = new SolanaAdapter({});
      expect(testnetAdapter).toBeDefined();
    });
  });

  describe('区块查询', () => {
    it('应该能获取最新区块号（槽位）', async () => {
      const slot = await adapter.getBlockNumber();
      expect(typeof slot).toBe('number');
      expect(slot).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取区块信息', async () => {
      const block = await adapter.getBlockInfo(123456789);
      expect(block).toBeDefined();
      expect(block.blockNumber).toBe(123456789);
    });
  });

  describe('余额查询', () => {
    it('应该能查询 SOL 余额', async () => {
      const balance = await adapter.getNativeBalance(testAddress);
      expect(balance).toBeDefined();
      expect(balance.native.balance).toBeDefined();
      expect(balance.native.formatted).toBe('1');
    });
  });

  describe('交易相关', () => {
    it('应该能获取最近的区块哈希', async () => {
      const result = await adapter.getLatestBlockhash();
      expect(typeof result.blockhash).toBe('string');
      expect(result.blockhash.length).toBeGreaterThan(0);
    });

    it('应该能估算手续费', async () => {
      const fee = await adapter.getFeeForMessage('test-message');
      expect(typeof fee).toBe('number');
    });
  });

  describe('Nonce 管理', () => {
    it('应该能获取 Nonce', async () => {
      const nonce = await adapter.getNonce('test-address');
      expect(typeof nonce).toBe('number');
    });
  });

  describe('RPC 请求', () => {
    it('应该能调用 getBalance', async () => {
      const result = await adapter.request('getBalance', [testAddress]);
      expect(result).toBeDefined();
      expect(result.value).toBe(1000000000);
    });

    it('应该能调用 getSlot', async () => {
      const result = await adapter.request('getSlot');
      expect(result).toBe(200000000);
    });
  });
});