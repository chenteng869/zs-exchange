import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import {
  ChainAdapterFactory,
  AdapterNotRegisteredError,
  AdapterAlreadyRegisteredError,
  InvalidChainTypeError,
} from '../../chains/chain-adapter.factory';
import { ChainType } from '../../chains/chain-adapter.interface';

class MockAdapter {
  constructor(private config: any = {}) {}

  getSupportedChains() {
    return ['ethereum', 'bsc'];
  }

  getChainInfo(chainKey: string) {
    return {
      chainKey,
      chainId: 1,
      name: 'Ethereum',
      symbol: 'ETH',
    };
  }

  getBlockNumber() {
    return Promise.resolve(12345678);
  }

  getBalance(address: string) {
    return Promise.resolve('1000000000000000000');
  }

  sendTransaction(tx: any) {
    return Promise.resolve({ txHash: '0x' + 'a'.repeat(64) });
  }

  clearCache() {}
}

describe('ChainAdapterFactory - 链适配器工厂', () => {
  beforeEach(() => {
    ChainAdapterFactory.resetInstance();
  });

  describe('单例模式', () => {
    it('getInstance 应该返回单例实例', () => {
      const instance1 = ChainAdapterFactory.getInstance();
      const instance2 = ChainAdapterFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('resetInstance 应该重置单例', () => {
      const instance1 = ChainAdapterFactory.getInstance();
      ChainAdapterFactory.resetInstance();
      const instance2 = ChainAdapterFactory.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('getInstance 应该支持传入选项', () => {
      const instance = ChainAdapterFactory.getInstance({
        enableCache: false,
        maxCacheSize: 10,
      });
      expect(instance).toBeDefined();
    });
  });

  describe('适配器注册', () => {
    it('应该成功注册适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(() => {
        factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      }).not.toThrow();
    });

    it('注册已存在的适配器应该抛出错误', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      expect(() => {
        factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      }).toThrow(AdapterAlreadyRegisteredError);
    });

    it('注册时使用 override 应该覆盖现有适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      expect(() => {
        factory.registerAdapter(ChainType.EVM, MockAdapter as any, {}, { override: true });
      }).not.toThrow();
    });

    it('应该批量注册适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      const adapters = [
        {
          chainType: ChainType.EVM,
          constructor: MockAdapter as any,
          displayName: 'EVM Chains',
        },
        {
          chainType: ChainType.SOLANA,
          constructor: MockAdapter as any,
          displayName: 'Solana',
        },
      ];

      factory.registerAdapters(adapters);
      expect(factory.getRegisteredCount()).toBe(2);
    });

    it('无效的链类型应该抛出错误', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(() => {
        factory.registerAdapter('invalid-chain', MockAdapter as any);
      }).toThrow(InvalidChainTypeError);
    });

    it('isAdapterRegistered 应该正确返回注册状态', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.isAdapterRegistered(ChainType.EVM)).toBe(false);

      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      expect(factory.isAdapterRegistered(ChainType.EVM)).toBe(true);
    });

    it('isAdapterRegistered 对无效链类型应该返回 false', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.isAdapterRegistered('invalid')).toBe(false);
    });
  });

  describe('适配器注销', () => {
    it('应该成功注销已注册的适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const result = factory.unregisterAdapter(ChainType.EVM);
      expect(result).toBe(true);
      expect(factory.isAdapterRegistered(ChainType.EVM)).toBe(false);
    });

    it('注销不存在的适配器应该返回 false', () => {
      const factory = ChainAdapterFactory.getInstance();
      const result = factory.unregisterAdapter(ChainType.EVM);
      expect(result).toBe(false);
    });
  });

  describe('适配器获取', () => {
    it('应该成功获取已注册的适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter = factory.getAdapter(ChainType.EVM);
      expect(adapter).toBeDefined();
    });

    it('获取未注册的适配器应该抛出错误', () => {
      const factory = ChainAdapterFactory.getInstance();

      expect(() => {
        factory.getAdapter(ChainType.EVM);
      }).toThrow(AdapterNotRegisteredError);
    });

    it('tryGetAdapter 对未注册的适配器应该返回 null', () => {
      const factory = ChainAdapterFactory.getInstance();
      const adapter = factory.tryGetAdapter(ChainType.EVM);
      expect(adapter).toBeNull();
    });

    it('tryGetAdapter 应该成功获取已注册的适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter = factory.tryGetAdapter(ChainType.EVM);
      expect(adapter).not.toBeNull();
    });

    it('获取适配器时应该支持自定义配置', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter = factory.getAdapter(ChainType.EVM, { rpcUrl: 'https://custom.rpc' });
      expect(adapter).toBeDefined();
    });
  });

  describe('缓存管理', () => {
    it('启用缓存时应该缓存适配器实例', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: true });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter1 = factory.getAdapter(ChainType.EVM);
      const adapter2 = factory.getAdapter(ChainType.EVM);
      expect(adapter1).toBe(adapter2);
    });

    it('禁用缓存时每次应该创建新实例', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: false });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter1 = factory.getAdapter(ChainType.EVM);
      const adapter2 = factory.getAdapter(ChainType.EVM);
      expect(adapter1).not.toBe(adapter2);
    });

    it('clearAdapterCache 应该清除指定链的缓存', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: true });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      factory.registerAdapter(ChainType.SOLANA, MockAdapter as any);

      factory.getAdapter(ChainType.EVM);
      factory.getAdapter(ChainType.SOLANA);
      expect(factory.getCachedCount()).toBe(2);

      factory.clearAdapterCache(ChainType.EVM);
      expect(factory.getCachedCount()).toBe(1);
    });

    it('clearAdapterCache 不传参数应该清除所有缓存', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: true });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      factory.registerAdapter(ChainType.SOLANA, MockAdapter as any);

      factory.getAdapter(ChainType.EVM);
      factory.getAdapter(ChainType.SOLANA);
      expect(factory.getCachedCount()).toBe(2);

      factory.clearAdapterCache();
      expect(factory.getCachedCount()).toBe(0);
    });

    it('getCacheStats 应该返回缓存统计信息', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: true, maxCacheSize: 10 });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      factory.getAdapter(ChainType.EVM);
      const stats = factory.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(10);
      expect(Array.isArray(stats.items)).toBe(true);
    });

    it('应该淘汰最旧的缓存项', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: true, maxCacheSize: 2 });
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      factory.registerAdapter(ChainType.SOLANA, MockAdapter as any);
      factory.registerAdapter(ChainType.BITCOIN, MockAdapter as any);

      factory.getAdapter(ChainType.EVM);
      factory.getAdapter(ChainType.SOLANA);
      expect(factory.getCachedCount()).toBe(2);

      factory.getAdapter(ChainType.BITCOIN);
      expect(factory.getCachedCount()).toBe(2);
    });
  });

  describe('配置管理', () => {
    it('应该能获取当前配置', () => {
      const factory = ChainAdapterFactory.getInstance({ enableCache: false });
      const options = factory.getOptions();
      expect(options.enableCache).toBe(false);
    });

    it('应该能更新配置', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.updateOptions({ maxCacheSize: 30 });
      const options = factory.getOptions();
      expect(options.maxCacheSize).toBe(30);
    });
  });

  describe('链类型检测', () => {
    it('应该能检测 EVM 链类型', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.detectChainType('ethereum')).toBe(ChainType.EVM);
      expect(factory.detectChainType('bsc')).toBe(ChainType.EVM);
      expect(factory.detectChainType('polygon')).toBe(ChainType.EVM);
    });

    it('应该能检测 Solana 链类型', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.detectChainType('solana')).toBe(ChainType.SOLANA);
      expect(factory.detectChainType('sol')).toBe(ChainType.SOLANA);
    });

    it('应该能检测 Bitcoin 链类型', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.detectChainType('bitcoin')).toBe(ChainType.BITCOIN);
      expect(factory.detectChainType('btc')).toBe(ChainType.BITCOIN);
    });

    it('应该能检测 Tron 链类型', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.detectChainType('tron')).toBe(ChainType.TRON);
      expect(factory.detectChainType('trx')).toBe(ChainType.TRON);
    });

    it('未知链类型应该返回 null', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.detectChainType('unknown')).toBeNull();
    });

    it('getAdapterByChainKey 应该根据链 key 获取适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const adapter = factory.getAdapterByChainKey('ethereum');
      expect(adapter).not.toBeNull();
    });

    it('getAdapterByChainKey 对未知链应该返回 null', () => {
      const factory = ChainAdapterFactory.getInstance();
      const adapter = factory.getAdapterByChainKey('unknown-chain');
      expect(adapter).toBeNull();
    });
  });

  describe('适配器列表', () => {
    it('listAdapters 应该返回所有已注册的适配器', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any, {}, { displayName: 'EVM' });
      factory.registerAdapter(ChainType.SOLANA, MockAdapter as any, {}, { displayName: 'Solana' });

      const adapters = factory.listAdapters();
      expect(adapters.length).toBe(2);
    });

    it('getAllChainInfos 应该返回所有链信息', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const chainInfos = factory.getAllChainInfos();
      expect(Array.isArray(chainInfos)).toBe(true);
    });
  });

  describe('健康检查', () => {
    it('checkAllHealth 应该返回所有适配器的健康状态', async () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);

      const results = await factory.checkAllHealth();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('事件系统', () => {
    it('应该能添加事件监听器', () => {
      const factory = ChainAdapterFactory.getInstance();
      const listener = vi.fn();

      expect(() => {
        factory.addEventListener('chainChanged', listener);
      }).not.toThrow();
    });

    it('应该能移除事件监听器', () => {
      const factory = ChainAdapterFactory.getInstance();
      const listener = vi.fn();

      factory.addEventListener('chainChanged', listener);
      const result = factory.removeEventListener('chainChanged', listener);
      expect(result).toBe(true);
    });

    it('移除不存在的监听器应该返回 false', () => {
      const factory = ChainAdapterFactory.getInstance();
      const listener = vi.fn();

      const result = factory.removeEventListener('chainChanged', listener);
      expect(result).toBe(false);
    });
  });

  describe('初始化与销毁', () => {
    it('initialize 应该初始化工厂', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(() => {
        factory.initialize();
      }).not.toThrow();
    });

    it('多次调用 initialize 应该是幂等的', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.initialize();
      expect(() => {
        factory.initialize();
      }).not.toThrow();
    });

    it('destroy 应该销毁工厂实例', () => {
      const factory = ChainAdapterFactory.getInstance();
      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      factory.getAdapter(ChainType.EVM);

      expect(factory.getCachedCount()).toBe(1);
      factory.destroy();
      expect(factory.getCachedCount()).toBe(0);
    });
  });

  describe('注册数量统计', () => {
    it('getRegisteredCount 应该返回正确的注册数量', () => {
      const factory = ChainAdapterFactory.getInstance();
      expect(factory.getRegisteredCount()).toBe(0);

      factory.registerAdapter(ChainType.EVM, MockAdapter as any);
      expect(factory.getRegisteredCount()).toBe(1);

      factory.registerAdapter(ChainType.SOLANA, MockAdapter as any);
      expect(factory.getRegisteredCount()).toBe(2);
    });
  });
});
