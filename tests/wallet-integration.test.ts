import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { KeyService } from '../src/lib/wallet/key/key.service';
import { keystoreCrypto } from '../src/lib/wallet/key/keystore.crypto';
import { PolicyEngine } from '../src/lib/wallet/mpc/policy-engine/policy-engine';
import { WalletTierManager } from '../src/lib/wallet/mpc/wallet-tier-manager';
import { ChainType } from '../src/lib/wallet/chains/chain-adapter.interface';
import { mnemonicToSeed, generateMnemonic, validateMnemonic } from '../src/lib/wallet/core/mnemonic';
import { fromSeed, deriveChild } from '../src/lib/wallet/core/hd-wallet';
import { toChecksumAddress } from '../src/lib/wallet/core/private-key';
import { EvmSigner } from '../src/lib/wallet/key/evm-signer';
import { keyRiskService } from '../src/lib/wallet/key/key-risk.service';

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
    signTypedData: vi.fn().mockResolvedValue({
      signature: '0x' + 'd'.repeat(130),
      publicKey: '0x' + 'b'.repeat(128),
    }),
    signTransaction: vi.fn().mockResolvedValue({
      signature: '0x' + 'd'.repeat(130),
      rawTransaction: '0x' + 'e'.repeat(100),
      publicKey: '0x' + 'b'.repeat(128),
    }),
  })),
}));

describe('钱包模块集成测试', () => {
  let keyService: KeyService;
  let policyEngine: PolicyEngine;
  let walletTierManager: WalletTierManager;
  const testPassword = 'testPassword123!';
  const testWalletId = 'wallet-integration-001';
  const testUserId = 'user-integration-001';

  beforeEach(() => {
    keyService = new KeyService();
    policyEngine = new PolicyEngine();
    walletTierManager = new WalletTierManager();
    vi.clearAllMocks();
  });

  describe('完整交易流程：创建钱包 → 派生地址 → 签名消息', () => {
    it('应该能完成从钱包创建到消息签名的完整流程', async () => {
      const createResult = await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
      expect(createResult).toBeDefined();
      expect(createResult.walletId).toBe(testWalletId);
      expect(createResult.keyType).toBe('mnemonic');

      const deriveResult = await keyService.deriveEvmAddress(testWalletId, testPassword);
      expect(deriveResult).toBeDefined();
      expect(deriveResult.address).toBeDefined();

      const signResult = await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: deriveResult.address,
        chainType: 'evm',
        message: 'Hello Web3',
        password: testPassword,
      });
      expect(signResult).toBeDefined();
      expect(signResult.signature).toBeDefined();
    });

    it('签名后应该记录审计日志', async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });

      const deriveResult = await keyService.deriveEvmAddress(testWalletId, testPassword);

      await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: deriveResult.address,
        chainType: 'evm',
        message: 'Test message',
        password: testPassword,
      });

      const logs = await keyService.getAuditLogs(testWalletId);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].walletId).toBe(testWalletId);
      expect(logs[0].signType).toBe('message');
      expect(logs[0].success).toBe(true);
    });
  });

  describe('策略引擎集成', () => {
    it('应该能获取策略', () => {
      const policy = policyEngine.getPolicy('test');
      expect(policy).toBeUndefined();
    });
  });

  describe('钱包层级管理集成', () => {
    it('应该能添加热钱包并获取', async () => {
      walletTierManager.addWallet({
        id: testWalletId,
        userId: testUserId,
        tier: 'hot',
        chainType: ChainType.EVM,
        address: '0x' + 'a'.repeat(40),
        publicKey: '0x' + 'b'.repeat(64),
        keyRef: 'key-ref-1',
        threshold: 2,
        totalShares: 3,
        policyIds: [],
        status: 'active',
        label: '热钱包',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const wallet = walletTierManager.getWallet(testWalletId);
      expect(wallet).toBeDefined();
      expect(wallet.tier).toBe('hot');
      expect(wallet.status).toBe('active');

      const userWallets = walletTierManager.getUserWallets(testUserId);
      expect(userWallets.length).toBeGreaterThan(0);
    });

    it('冻结的钱包状态应该为frozen', async () => {
      walletTierManager.addWallet({
        id: testWalletId,
        userId: testUserId,
        tier: 'hot',
        chainType: ChainType.EVM,
        address: '0x' + 'a'.repeat(40),
        publicKey: '0x' + 'b'.repeat(64),
        keyRef: 'key-ref-1',
        threshold: 2,
        totalShares: 3,
        policyIds: [],
        status: 'active',
        label: '热钱包',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      walletTierManager.freezeWallet(testWalletId);

      let wallet = walletTierManager.getWallet(testWalletId);
      expect(wallet.status).toBe('frozen');

      walletTierManager.unfreezeWallet(testWalletId);
      wallet = walletTierManager.getWallet(testWalletId);
      expect(wallet.status).toBe('active');
    });
  });

  describe('风控评估集成', () => {
    it('签名操作应该通过风控评估', async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });

      const deriveResult = await keyService.deriveEvmAddress(testWalletId, testPassword);

      const signResult = await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: deriveResult.address,
        chainType: 'evm',
        message: 'Low risk message',
        password: testPassword,
      });

      expect(signResult).toBeDefined();
    });

    it('风控拒绝时签名应该失败', async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });

      const deriveResult = await keyService.deriveEvmAddress(testWalletId, testPassword);

      (keyRiskService.evaluate as vi.Mock).mockResolvedValueOnce({
        allowed: false,
        riskScore: 100,
        riskLevel: 'critical',
        reasons: ['High risk detected'],
        action: 'reject',
      });

      await expect(
        keyService.signEvmMessage({
          walletId: testWalletId,
          userId: testUserId,
          address: deriveResult.address,
          chainType: 'evm',
          message: 'High risk message',
          password: testPassword,
        })
      ).rejects.toThrow();
    });
  });

  describe('多链地址派生集成', () => {
    it('应该能从同一助记词派生不同链的地址', async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });

      const evmAddress = await keyService.deriveEvmAddress(testWalletId, testPassword);
      const solanaAddress = await keyService.deriveSolanaAddress(testWalletId, testPassword);
      const bitcoinAddress = await keyService.deriveBitcoinAddress(testWalletId, testPassword);
      const tronAddress = await keyService.deriveTronAddress(testWalletId, testPassword);

      expect(evmAddress).toBeDefined();
      expect(solanaAddress).toBeDefined();
      expect(bitcoinAddress).toBeDefined();
      expect(tronAddress).toBeDefined();
    });
  });
});