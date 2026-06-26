import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { SolanaAdapter } from '../../chains/solana-adapter';

describe('SolanaAdapter - Solana 链适配器', () => {
  let adapter: SolanaAdapter;
  const testAddress = '5vPDcfdUgNGdpZFY8R9wAfcUcNxL3UjY9zQ5VvRzXxwz';

  beforeEach(() => {
    adapter = new SolanaAdapter({
      rpcUrl: 'https://api.mainnet-beta.solana.com',
    });
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用指定配置创建适配器', () => {
      const config = {
        rpcUrl: 'https://api.devnet.solana.com',
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
      expect(chains).toContain('solana');
    });

    it('应该能获取指定链的信息', () => {
      const chainInfo = adapter.getChainInfo('solana');
      expect(chainInfo).toBeDefined();
      expect(chainInfo.name).toBe('Solana');
      expect(chainInfo.symbol).toBe('SOL');
    });
  });

  describe('区块查询', () => {
    it('应该能获取最新区块号（槽位）', async () => {
      const slot = await adapter.getBlockNumber();
      expect(typeof slot).toBe('number');
      expect(slot).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取区块信息', async () => {
      const block = await adapter.getBlock(123456789);
      expect(block).toBeDefined();
    });
  });

  describe('余额查询', () => {
    it('应该能查询 SOL 余额', async () => {
      const balance = await adapter.getBalance(testAddress);
      expect(typeof balance).toBe('string');
      expect(balance.length).toBeGreaterThan(0);
    });

    it('应该能查询 SPL 代币余额', async () => {
      const tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const balance = await adapter.getTokenBalance(testAddress, tokenMint);
      expect(typeof balance).toBe('string');
    });
  });

  describe('交易相关', () => {
    it('应该能获取交易详情', async () => {
      const txSignature = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
      const tx = await adapter.getTransaction(txSignature);
      expect(tx).toBeDefined();
    });

    it('应该能获取最近的区块哈希', async () => {
      const blockhash = await adapter.getLatestBlockhash();
      expect(typeof blockhash).toBe('string');
      expect(blockhash.length).toBeGreaterThan(0);
    });

    it('应该能估算手续费', async () => {
      const fee = await adapter.getFeeForMessage('test-message');
      expect(typeof fee).toBe('number');
    });
  });

  describe('交易发送', () => {
    it('应该能发送已签名的交易', async () => {
      const signedTx = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED';
      const result = await adapter.sendRawTransaction(signedTx);
      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    it('应该能广播交易', async () => {
      const signedTx = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED';
      const txId = await adapter.broadcastTransaction(signedTx);
      expect(typeof txId).toBe('string');
    });
  });

  describe('地址验证', () => {
    it('应该能验证有效的 Solana 地址', () => {
      const valid = adapter.isValidAddress(testAddress);
      expect(valid).toBe(true);
    });

    it('应该能识别无效地址', () => {
      const invalid = adapter.isValidAddress('invalid-address');
      expect(invalid).toBe(false);
    });

    it('空地址应该返回 false', () => {
      const invalid = adapter.isValidAddress('');
      expect(invalid).toBe(false);
    });
  });

  describe('账户查询', () => {
    it('应该能获取账户信息', async () => {
      const accountInfo = await adapter.getAccountInfo(testAddress);
      expect(accountInfo).toBeDefined();
    });

    it('应该能获取代币账户列表', async () => {
      const tokenAccounts = await adapter.getTokenAccounts(testAddress);
      expect(Array.isArray(tokenAccounts)).toBe(true);
    });

    it('应该能获取程序派生地址 (PDA)', () => {
      const pda = adapter.findProgramAddress(
        ['seed1', 'seed2'],
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      );
      expect(pda).toBeDefined();
      expect(pda.address).toBeDefined();
      expect(pda.nonce).toBeDefined();
    });
  });

  describe('交易模拟', () => {
    it('应该能模拟交易', async () => {
      const tx = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAED';
      const result = await adapter.simulateTransaction(tx);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Nonce 管理', () => {
    it('应该能获取 Nonce 账户信息', async () => {
      const nonceAccount = 'test-nonce-account-address';
      const nonceInfo = await adapter.getNonce(nonceAccount);
      expect(nonceInfo).toBeDefined();
    });
  });

  describe('缓存管理', () => {
    it('应该能清除缓存', () => {
      expect(() => {
        adapter.clearCache();
      }).not.toThrow();
    });
  });

  describe('健康检查', () => {
    it('应该能检查节点健康状态', async () => {
      const health = await adapter.checkHealth();
      expect(health).toBeDefined();
      expect(health.healthy).toBeDefined();
      expect(health.reachable).toBeDefined();
    });
  });

  describe('网络配置', () => {
    it('应该支持主网配置', () => {
      const mainnetAdapter = new SolanaAdapter({ network: 'mainnet-beta' });
      expect(mainnetAdapter).toBeDefined();
    });

    it('应该支持 Devnet 配置', () => {
      const devnetAdapter = new SolanaAdapter({ network: 'devnet' });
      expect(devnetAdapter).toBeDefined();
    });

    it('应该支持 Testnet 配置', () => {
      const testnetAdapter = new SolanaAdapter({ network: 'testnet' });
      expect(testnetAdapter).toBeDefined();
    });
  });
});
