import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { TronAdapter } from '../../chains/tron-adapter';

describe('TronAdapter - Tron 链适配器', () => {
  let adapter: TronAdapter;
  const testAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';

  beforeEach(() => {
    adapter = new TronAdapter({
      fullHost: 'https://api.trongrid.io',
      network: 'mainnet',
    });
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用主网配置创建适配器', () => {
      const mainnetAdapter = new TronAdapter({ network: 'mainnet' });
      expect(mainnetAdapter).toBeDefined();
    });

    it('应该使用 Nile 测试网配置创建适配器', () => {
      const nileAdapter = new TronAdapter({ network: 'nile' });
      expect(nileAdapter).toBeDefined();
    });

    it('应该使用默认配置创建适配器', () => {
      const defaultAdapter = new TronAdapter();
      expect(defaultAdapter).toBeDefined();
    });
  });

  describe('链信息查询', () => {
    it('应该返回支持的链列表', () => {
      const chains = adapter.getSupportedChains();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains).toContain('tron');
    });

    it('应该能获取指定链的信息', () => {
      const chainInfo = adapter.getChainInfo('tron');
      expect(chainInfo).toBeDefined();
      expect(chainInfo.name).toBe('TRON');
      expect(chainInfo.symbol).toBe('TRX');
    });
  });

  describe('区块查询', () => {
    it('应该能获取最新区块高度', async () => {
      const blockNumber = await adapter.getBlockNumber();
      expect(typeof blockNumber).toBe('number');
      expect(blockNumber).toBeGreaterThanOrEqual(0);
    });

    it('应该能获取区块信息', async () => {
      const block = await adapter.getBlock(50000000);
      expect(block).toBeDefined();
    });

    it('应该能获取最新区块', async () => {
      const block = await adapter.getBlock('latest');
      expect(block).toBeDefined();
    });
  });

  describe('余额查询', () => {
    it('应该能查询 TRX 余额', async () => {
      const balance = await adapter.getBalance(testAddress);
      expect(typeof balance).toBe('string');
      expect(balance.length).toBeGreaterThan(0);
    });

    it('应该能查询 TRC20 代币余额', async () => {
      const contractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      const balance = await adapter.getTokenBalance(testAddress, contractAddress);
      expect(typeof balance).toBe('string');
    });

    it('应该能查询账户资源（带宽、能量）', async () => {
      const resources = await adapter.getAccountResources(testAddress);
      expect(resources).toBeDefined();
    });
  });

  describe('交易相关', () => {
    it('应该能获取交易详情', async () => {
      const txId = '620e51e7e1781d20046bb45343f9062ab3175ebf18a75d5b0c3e2e1e9e1e7e1e';
      const tx = await adapter.getTransaction(txId);
      expect(tx).toBeDefined();
    });

    it('应该能获取交易收据', async () => {
      const txId = '620e51e7e1781d20046bb45343f9062ab3175ebf18a75d5b0c3e2e1e9e1e7e1e';
      const receipt = await adapter.getTransactionReceipt(txId);
      expect(receipt).toBeDefined();
    });

    it('应该能获取地址的交易历史', async () => {
      const history = await adapter.getTransactionHistory(testAddress);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('交易构建', () => {
    it('应该能构建 TRX 转账交易', async () => {
      const tx = await adapter.buildTransferTransaction({
        from: testAddress,
        to: 'TAEYTdBQMq7nQvYFNb8A1QjXr3bM6wVuRK',
        amount: 1000000,
      });
      expect(tx).toBeDefined();
      expect(tx.txID).toBeDefined();
    });

    it('应该能构建 TRC20 转账交易', async () => {
      const tx = await adapter.buildTokenTransferTransaction({
        from: testAddress,
        to: 'TAEYTdBQMq7nQvYFNb8A1QjXr3bM6wVuRK',
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        amount: '1000000',
      });
      expect(tx).toBeDefined();
    });

    it('应该能构建触发智能合约交易', async () => {
      const tx = await adapter.buildTriggerSmartContractTransaction({
        from: testAddress,
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        functionSelector: 'transfer(address,uint256)',
        parameter: '000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c000000000000000000000000000000000000000000000000000000000000f4240',
      });
      expect(tx).toBeDefined();
    });
  });

  describe('交易发送', () => {
    it('应该能发送已签名的交易', async () => {
      const signedTx = {
        visible: false,
        txID: 'a'.repeat(64),
        raw_data: {},
        signature: ['sig1'],
      };
      const result = await adapter.sendRawTransaction(signedTx);
      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    it('应该能广播交易', async () => {
      const signedTx = {
        visible: false,
        txID: 'a'.repeat(64),
        raw_data: {},
        signature: ['sig1'],
      };
      const txId = await adapter.broadcastTransaction(signedTx);
      expect(typeof txId).toBe('string');
    });
  });

  describe('地址验证', () => {
    it('应该能验证有效的 Tron 地址', () => {
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

    it('非 T 开头的地址应该返回 false', () => {
      const invalid = adapter.isValidAddress('0x' + 'a'.repeat(40));
      expect(invalid).toBe(false);
    });
  });

  describe('地址格式转换', () => {
    it('应该能将 Tron 地址转换为十六进制格式', () => {
      const hex = adapter.addressToHex(testAddress);
      expect(typeof hex).toBe('string');
      expect(hex.startsWith('41')).toBe(true);
    });

    it('应该能将十六进制转换为 Tron 地址', () => {
      const hex = '41' + 'a'.repeat(40);
      const address = adapter.hexToAddress(hex);
      expect(typeof address).toBe('string');
      expect(address.startsWith('T')).toBe(true);
    });

    it('地址转换应该是可逆的', () => {
      const hex = adapter.addressToHex(testAddress);
      const address = adapter.hexToAddress(hex);
      expect(address).toBe(testAddress);
    });
  });

  describe('合约交互', () => {
    it('应该能调用合约方法（只读）', async () => {
      const result = await adapter.call({
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        functionSelector: 'balanceOf(address)',
        parameter: '000000000000000000000000' + testAddress.slice(1),
        ownerAddress: testAddress,
      });
      expect(result).toBeDefined();
    });

    it('应该能编码合约方法参数', () => {
      const data = adapter.encodeFunctionData('transfer(address,uint256)', [
        'TAEYTdBQMq7nQvYFNb8A1QjXr3bM6wVuRK',
        '1000000',
      ]);
      expect(typeof data).toBe('string');
    });
  });

  describe('交易模拟', () => {
    it('应该能模拟交易', async () => {
      const tx = {
        visible: false,
        txID: 'a'.repeat(64),
        raw_data: {},
      };
      const result = await adapter.simulateTransaction(tx);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('账户查询', () => {
    it('应该能获取账户信息', async () => {
      const account = await adapter.getAccount(testAddress);
      expect(account).toBeDefined();
    });

    it('应该能查询账户是否存在', async () => {
      const exists = await adapter.accountExists(testAddress);
      expect(typeof exists).toBe('boolean');
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
