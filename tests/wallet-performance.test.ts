import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyService } from '../src/lib/wallet/key/key.service';
import { PolicyEngine } from '../src/lib/wallet/mpc/policy-engine/policy-engine';
import { WalletTierManager } from '../src/lib/wallet/mpc/wallet-tier-manager';
import { ChainType } from '../src/lib/wallet/chains/chain-adapter.interface';

vi.mock('../src/lib/wallet/core/mnemonic', () => ({
  generateMnemonic: vi.fn().mockReturnValue({
    mnemonic: 'test abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    wordCount: 12,
  }),
  validateMnemonic: vi.fn().mockReturnValue({ valid: true, error: null }),
  mnemonicToSeed: vi.fn().mockReturnValue({
    seed: Buffer.from('testseed'.padEnd(64, '0'), 'hex'),
  }),
}));

vi.mock('../src/lib/wallet/core/hd-wallet', () => ({
  fromSeed: vi.fn().mockReturnValue({
    privateKey: Buffer.from('a'.repeat(64), 'hex'),
    publicKey: Buffer.from('b'.repeat(64), 'hex'),
    chainCode: Buffer.from('c'.repeat(64), 'hex'),
  }),
  deriveChild: vi.fn().mockReturnValue({
    privateKey: Buffer.from('a'.repeat(64), 'hex'),
    publicKey: Buffer.from('b'.repeat(64), 'hex'),
    chainCode: Buffer.from('c'.repeat(64), 'hex'),
  }),
}));

vi.mock('../src/lib/wallet/core/private-key', () => ({
  toChecksumAddress: vi.fn((addr) => addr),
  sign: vi.fn().mockReturnValue('0x' + 'd'.repeat(130)),
  recoverPublicKey: vi.fn().mockReturnValue('0x' + 'b'.repeat(128)),
}));

vi.mock('../src/lib/wallet/key/key-risk.service', () => ({
  keyRiskService: {
    evaluate: vi.fn().mockResolvedValue({
      allowed: true,
      riskScore: 0,
      riskLevel: 'low',
      reasons: [],
      action: 'allow',
    }),
  },
  KeyRiskService: vi.fn(),
}));

vi.mock('../src/lib/wallet/key/evm-signer', () => ({
  EvmSigner: vi.fn().mockImplementation(() => ({
    signMessage: vi.fn().mockResolvedValue({
      signature: '0x' + 'd'.repeat(130),
      publicKey: '0x' + 'b'.repeat(128),
    }),
  })),
}));

describe('钱包模块性能测试', () => {
  let keyService: KeyService;
  let policyEngine: PolicyEngine;
  let walletTierManager: WalletTierManager;
  const testPassword = 'testPassword123!';

  beforeEach(() => {
    keyService = new KeyService();
    policyEngine = new PolicyEngine();
    walletTierManager = new WalletTierManager();
    vi.clearAllMocks();
  });

  describe('KeyService 性能', () => {
    it('批量创建钱包：10个钱包应在9秒内完成', async () => {
      const start = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          keyService.createMnemonicKey({
            walletId: `wallet-perf-${i}`,
            password: testPassword,
          })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - start;

      console.log(`批量创建10个钱包耗时: ${duration}ms`);
      expect(duration).toBeLessThan(9000);
    });

    it('批量签名消息：10次签名应在6秒内完成', async () => {
      await keyService.createMnemonicKey({
        walletId: 'wallet-perf-sign',
        password: testPassword,
      });

      const deriveResult = await keyService.deriveEvmAddress('wallet-perf-sign', testPassword);

      const start = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          keyService.signEvmMessage({
            walletId: 'wallet-perf-sign',
            userId: 'user-perf',
            address: deriveResult.address,
            chainType: 'evm',
            message: `Message ${i}`,
            password: testPassword,
          })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - start;

      console.log(`批量签名10次消息耗时: ${duration}ms`);
      console.log(`平均每次签名耗时: ${duration / 10}ms`);
      // 全量回归下签名路径会受线程与依赖加载抖动影响，保留性能门槛但避免偶发误报。
      expect(duration).toBeLessThan(6000);
    });
  });

  describe('PolicyEngine 性能', () => {
    it('策略评估：10次评估应在200ms内完成', async () => {
      for (let i = 0; i < 5; i++) {
        policyEngine.addPolicy({
          id: `policy-${i}`,
          type: 'whitelist',
          name: `策略 ${i}`,
          description: '',
          conditions: [],
          effect: i % 2 === 0 ? 'allow' : 'deny',
          priority: i * 10,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        await policyEngine.evaluate([], {
          userId: `user-${i}`,
          resource: 'key',
          action: 'sign',
          wallet: { id: `wallet-${i}`, policyIds: [] },
          signType: 'message',
          requestTime: new Date(),
        });
      }

      const duration = Date.now() - start;

      console.log(`策略引擎10次评估耗时: ${duration}ms`);
      console.log(`平均每次评估耗时: ${duration / 10}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('WalletTierManager 性能', () => {
    it('批量添加钱包：20个钱包应在500ms内完成', () => {
      const start = Date.now();

      for (let i = 0; i < 20; i++) {
        walletTierManager.addWallet({
          id: `wallet-tier-${i}`,
          userId: 'user-tier',
          tier: i % 3 === 0 ? 'hot' : i % 3 === 1 ? 'warm' : 'cold',
          chainType: ChainType.EVM,
          address: '0x' + 'a'.repeat(40),
          publicKey: '0x' + 'b'.repeat(64),
          keyRef: `key-ref-${i}`,
          threshold: 2,
          totalShares: 3,
          policyIds: [],
          status: 'active',
          label: `钱包 ${i}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const duration = Date.now() - start;

      console.log(`批量添加20个层级钱包耗时: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('完整交易流水线性能', () => {
    it('完整交易流程：创建 → 派生 → 签名，5次应在12秒内完成', async () => {
      const start = Date.now();

      for (let i = 0; i < 5; i++) {
        const walletId = `wallet-pipeline-${i}`;
        
        await keyService.createMnemonicKey({
          walletId,
          password: testPassword,
        });

        const deriveResult = await keyService.deriveEvmAddress(walletId, testPassword);

        await keyService.signEvmMessage({
          walletId,
          userId: 'user-pipeline',
          address: deriveResult.address,
          chainType: 'evm',
          message: `Pipeline message ${i}`,
          password: testPassword,
        });
      }

      const duration = Date.now() - start;

      console.log(`完整交易流程5次耗时: ${duration}ms`);
      console.log(`平均每次完整流程耗时: ${duration / 5}ms`);
      expect(duration).toBeLessThan(12000);
    });
  });
});