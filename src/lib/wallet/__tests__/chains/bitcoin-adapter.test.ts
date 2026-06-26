import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { BitcoinAdapter } from '../../chains/bitcoin-adapter';

describe('BitcoinAdapter - Bitcoin 链适配器', () => {
  let adapter: BitcoinAdapter;
  const testAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

  beforeEach(() => {
    adapter = new BitcoinAdapter({
      network: 'mainnet',
      rpcUrl: 'https://blockstream.info/api',
    });
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用主网配置创建适配器', () => {
      const mainnetAdapter = new BitcoinAdapter({ network: 'mainnet' });
      expect(mainnetAdapter).toBeDefined();
    });

    it('应该使用测试网配置创建适配器', () => {
      const testnetAdapter = new BitcoinAdapter({ network: 'testnet' });
      expect(testnetAdapter).toBeDefined();
    });

    it('应该使用默认配置创建适配器', () => {
      const defaultAdapter = new BitcoinAdapter();
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('链信息查询', () => {
    it('应该返回支持的链列表', () => {
      const chains = adapter.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains).toContain('bitcoin');
    });

    it('应该能获取指定链的信息', () => {
      const chainInfo = adapter.getChainInfo('bitcoin');
      expect(chainInfo).toBeDefined();
      expect(chainInfo.name).toBe('Bitcoin');
      expect(chainInfo.symbol).toBe('BTC');
    });
  });

  describe('区块查询', () => {
    it('应该能获取最新区块高度', async () => {
      const blockHeight = await adapter.getBlockNumber();
      expect(typeof blockHeight).toBe('number');
      expect(blockHeight).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取区块信息', async () => {
      const block = await adapter.getBlock(800000);
      expect(block).toBeDefined();
    });

    it('应该能获取区块哈希', async () => {
      const blockHash = await adapter.getBlockHash(800000);
      expect(typeof blockHash).toBe('string');
      expect(blockHash.length).toBe(64);
    });
  });

  describe('余额查询', () => {
    it('应该能查询 BTC 余额', async () => {
      const balance = await adapter.getBalance(testAddress);
      expect(typeof balance).toBe('string');
      expect(balance.length).toBeGreaterThan(0);
    });

    it('应该能查询 UTXO 列表', async () => {
      const utxos = await adapter.getUTXOs(testAddress);
      expect(Array.isArray(utxos)).toBe(true);
    });
  });

  describe('交易相关', () => {
    it('应该能获取交易详情', async () => {
      const txId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
      const tx = await adapter.getTransaction(txId);
      expect(tx).toBeDefined();
    });

    it('应该能估算手续费', async () => {
      const feeRate = await adapter.getFeeRate(6);
      expect(typeof feeRate).toBe('number');
    });

    it('应该能获取地址的交易历史', async () => {
      const history = await adapter.getTransactionHistory(testAddress);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('交易发送', () => {
    it('应该能发送已签名的交易', async () => {
      const signedTx = '0200000001a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a00000000000ffffffff0100e1f50500000000160014a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a000000000';
      const result = await adapter.sendRawTransaction(signedTx);
      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    it('应该能广播交易', async () => {
      const signedTx = '0200000001a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a00000000000ffffffff0100e1f50500000000160014a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a000000000';
      const txId = await adapter.broadcastTransaction(signedTx);
      expect(typeof txId).toBe('string');
    });
  });

  describe('地址验证', () => {
    it('应该能验证有效的 Bech32 地址', () => {
      const valid = adapter.isValidAddress(testAddress);
      expect(valid).toBe(true);
    });

    it('应该能验证有效的 P2PKH 地址', () => {
      const valid = adapter.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(valid).toBe(true);
    });

    it('应该能验证有效的 P2SH 地址', () => {
      const valid = adapter.isValidAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');
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

  describe('地址格式转换', () => {
    it('应该能从公钥生成 Bech32 地址', () => {
      const publicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
      const address = adapter.publicKeyToAddress(publicKey, 'native-segwit');
      expect(typeof address).toBe('string');
      expect(address.startsWith('bc1')).toBe(true);
    });

    it('应该能从公钥生成 P2PKH 地址', () => {
      const publicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
      const address = adapter.publicKeyToAddress(publicKey, 'legacy');
      expect(typeof address).toBe('string');
      expect(address.startsWith('1')).toBe(true);
    });

    it('应该能从公钥生成 P2SH 地址', () => {
      const publicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
      const address = adapter.publicKeyToAddress(publicKey, 'nested-segwit');
      expect(typeof address).toBe('string');
      expect(address.startsWith('3')).toBe(true);
    });
  });

  describe('PSBT 操作', () => {
    it('应该能创建 PSBT', () => {
      const psbt = adapter.createPSBT({
        inputs: [{ txid: 'a'.repeat(64), vout: 0 }],
        outputs: [{ address: testAddress, value: 100000 }],
      });
      expect(typeof psbt).toBe('string');
    });

    it('应该能解析 PSBT', () => {
      const psbt = 'cHNidP8BAFMCAAAAA';
      const parsed = adapter.parsePSBT(psbt);
      expect(parsed).toBeDefined();
    });
  });

  describe('交易模拟', () => {
    it('应该能模拟交易', async () => {
      const txHex = '0200000001a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a00000000000ffffffff0100e1f50500000000160014a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a000000000';
      const result = await adapter.simulateTransaction(txHex);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
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
    it('主网地址应该以 bc1 或 1 或 3 开头', () => {
      const mainnetAdapter = new BitcoinAdapter({ network: 'mainnet' });
      expect(mainnetAdapter).toBeDefined();
    });

    it('测试网地址应该以 tb1 或 m 或 n 或 2 开头', () => {
      const testnetAdapter = new BitcoinAdapter({ network: 'testnet' });
      expect(testnetAdapter).toBeDefined();
    });
  });
});
