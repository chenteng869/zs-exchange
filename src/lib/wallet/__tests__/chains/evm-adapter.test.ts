import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { EVMAdapter } from '../../chains/evm-adapter';

vi.mock('../../key/keystore.crypto', () => ({
  keystoreCrypto: {
    keccak256: vi.fn((data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return 'keccak' + buf.toString('hex').slice(0, 58).padEnd(58, '0');
    }),
  },
}));

describe('EVMAdapter - EVM 链适配器', () => {
  let adapter: EVMAdapter;
  const testAddress = '0x' + 'a'.repeat(40);
  const testPrivateKey = '0x' + 'b'.repeat(64);

  beforeEach(() => {
    adapter = new EVMAdapter({
      rpcUrl: 'https://eth-mainnet.example.com',
      chainId: 1,
    });
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用指定配置创建适配器', () => {
      const config = {
        rpcUrl: 'https://bsc-dataseed.binance.org',
        chainId: 56,
        name: 'BSC',
      };
      const bscAdapter = new EVMAdapter(config);
      expect(bscAdapter).toBeDefined();
    });

    it('应该使用默认配置创建适配器', () => {
      const defaultAdapter = new EVMAdapter();
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('链信息查询', () => {
    it('应该返回支持的链列表', () => {
      const chains = adapter.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
    });

    it('应该能获取指定链的信息', () => {
      const chainInfo = adapter.getChainInfo('ethereum');
      expect(chainInfo).toBeDefined();
      expect(chainInfo.chainId).toBe(1);
      expect(chainInfo.name).toBeDefined();
      expect(chainInfo.symbol).toBeDefined();
    });

    it('应该支持多条 EVM 链', () => {
      const chains = adapter.getSupportedChains();
      expect(chains).toContain('ethereum');
    });
  });

  describe('区块查询', () => {
    it('应该能获取最新区块号', async () => {
      const blockNumber = await adapter.getBlockNumber();
      expect(typeof blockNumber).toBe('number');
      expect(blockNumber).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取区块信息', async () => {
      const block = await adapter.getBlock('latest');
      expect(block).toBeDefined();
    });

    it('应该能根据区块号获取区块', async () => {
      const block = await adapter.getBlock(12345678);
      expect(block).toBeDefined();
    });
  });

  describe('余额查询', () => {
    it('应该能查询 ETH 余额', async () => {
      const balance = await adapter.getBalance(testAddress);
      expect(typeof balance).toBe('string');
      expect(balance.length).toBeGreaterThan(0);
    });

    it('应该能查询指定区块的余额', async () => {
      const balance = await adapter.getBalance(testAddress, 'latest');
      expect(typeof balance).toBe('string');
    });

    it('应该能查询代币余额', async () => {
      const tokenAddress = '0x' + 't'.repeat(40);
      const balance = await adapter.getTokenBalance(testAddress, tokenAddress);
      expect(typeof balance).toBe('string');
    });
  });

  describe('交易相关', () => {
    it('应该能获取交易收据', async () => {
      const txHash = '0x' + 'a'.repeat(64);
      const receipt = await adapter.getTransactionReceipt(txHash);
      expect(receipt).toBeDefined();
    });

    it('应该能获取交易详情', async () => {
      const txHash = '0x' + 'a'.repeat(64);
      const tx = await adapter.getTransaction(txHash);
      expect(tx).toBeDefined();
    });

    it('应该能估算 Gas 价格', async () => {
      const gasPrice = await adapter.getGasPrice();
      expect(typeof gasPrice).toBe('string');
    });

    it('应该能估算 Gas 用量', async () => {
      const tx = {
        from: testAddress,
        to: '0x' + 't'.repeat(40),
        value: '1000000000000000000',
        data: '0x',
      };
      const gasLimit = await adapter.estimateGas(tx);
      expect(typeof gasLimit).toBe('string');
    });
  });

  describe('交易发送', () => {
    it('应该能发送已签名的交易', async () => {
      const signedTx = '0x' + 's'.repeat(200);
      const result = await adapter.sendRawTransaction(signedTx);
      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    it('应该能广播交易', async () => {
      const signedTx = '0x' + 's'.repeat(200);
      const txHash = await adapter.broadcastTransaction(signedTx);
      expect(typeof txHash).toBe('string');
      expect(txHash.startsWith('0x')).toBe(true);
    });
  });

  describe('合约交互', () => {
    it('应该能调用合约方法（只读）', async () => {
      const contractAddress = '0x' + 'c'.repeat(40);
      const result = await adapter.call({
        to: contractAddress,
        data: '0x70a08231' + '0'.repeat(24) + 'a'.repeat(40),
      });
      expect(typeof result).toBe('string');
    });

    it('应该能编码合约方法调用', () => {
      const data = adapter.encodeFunctionData('transfer(address,uint256)', [
        '0x' + 'r'.repeat(40),
        '1000000000000000000',
      ]);
      expect(typeof data).toBe('string');
      expect(data.startsWith('0x')).toBe(true);
    });

    it('应该能解码合约方法结果', () => {
      const result = adapter.decodeFunctionResult('balanceOf(address)', '0x' + '0'.repeat(64));
      expect(result).toBeDefined();
    });
  });

  describe('地址验证', () => {
    it('应该能验证有效的 EVM 地址', () => {
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

    it('应该能验证校验和地址', () => {
      const checksumAddress = '0x' + 'a'.repeat(40);
      const valid = adapter.isValidChecksumAddress(checksumAddress);
      expect(typeof valid).toBe('boolean');
    });

    it('应该能转换为校验和地址', () => {
      const checksum = adapter.toChecksumAddress(testAddress);
      expect(typeof checksum).toBe('string');
      expect(checksum.startsWith('0x')).toBe(true);
    });
  });

  describe('交易模拟', () => {
    it('应该能模拟交易', async () => {
      const tx = {
        from: testAddress,
        to: '0x' + 't'.repeat(40),
        value: '1000000000000000000',
        data: '0x',
      };
      const result = await adapter.simulateTransaction(tx);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Nonce 管理', () => {
    it('应该能获取地址的交易计数（nonce）', async () => {
      const nonce = await adapter.getTransactionCount(testAddress);
      expect(typeof nonce).toBe('number');
      expect(nonce).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取指定区块的 nonce', async () => {
      const nonce = await adapter.getTransactionCount(testAddress, 'latest');
      expect(typeof nonce).toBe('number');
    });
  });

  describe('日志查询', () => {
    it('应该能查询事件日志', async () => {
      const logs = await adapter.getLogs({
        fromBlock: 12345670,
        toBlock: 12345678,
        address: '0x' + 'c'.repeat(40),
        topics: ['0x' + 't'.repeat(64)],
      });
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('网络信息', () => {
    it('应该能获取网络 ID', async () => {
      const networkId = await adapter.getNetworkId();
      expect(typeof networkId).toBe('number');
    });

    it('应该能获取链 ID', async () => {
      const chainId = await adapter.getChainId();
      expect(typeof chainId).toBe('number');
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
});
