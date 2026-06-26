import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyService } from '../../key/key.service';
import { WalletKeyErrors } from '../../key/key.errors';
import { keystoreCrypto } from '../../key/keystore.crypto';
import { keyRiskService } from '../../key/key-risk.service';
import { validateMnemonic, generateMnemonic, mnemonicToSeed } from '../../core/mnemonic';

vi.mock('../../core/mnemonic', () => ({
  generateMnemonic: vi.fn().mockReturnValue({
    mnemonic: 'test abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    wordCount: 12,
  }),
  validateMnemonic: vi.fn().mockReturnValue({ valid: true, error: null }),
  mnemonicToSeed: vi.fn().mockReturnValue({
    seed: Buffer.from('testseed'.padEnd(64, '0'), 'hex'),
  }),
}));

vi.mock('../../core/hd-wallet', () => ({
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

vi.mock('../../core/private-key', () => ({
  toChecksumAddress: vi.fn((addr) => addr),
  sign: vi.fn().mockReturnValue('0x' + 'd'.repeat(130)),
  recoverPublicKey: vi.fn().mockReturnValue('0x' + 'b'.repeat(128)),
}));

vi.mock('../../key/key-risk.service', () => ({
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

vi.mock('../../key/evm-signer', () => ({
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

vi.mock('../../key/solana-signer', () => ({
  SolanaSigner: vi.fn().mockImplementation(() => ({
    signTransaction: vi.fn().mockResolvedValue({
      signature: '0x' + 'f'.repeat(128),
      publicKey: 'testpublickey',
    }),
  })),
}));

vi.mock('../../key/bitcoin-signer', () => ({
  BitcoinSigner: vi.fn().mockImplementation(() => ({
    signTransaction: vi.fn().mockResolvedValue({
      signature: '0x' + 'g'.repeat(128),
      publicKey: '0x' + 'b'.repeat(66),
    }),
    deriveAccount: vi.fn().mockReturnValue({
      address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      publicKey: '0x' + 'b'.repeat(66),
      privateKey: '0x' + 'a'.repeat(64),
      wif: 'L123456789abcdef',
      derivationPath: "m/84'/0'/0'/0/0",
      scriptType: 'native-segwit',
    }),
  })),
}));

vi.mock('../../key/tron-signer', () => ({
  TronSigner: vi.fn().mockImplementation(() => ({
    signTransaction: vi.fn().mockResolvedValue({
      signature: '0x' + 'h'.repeat(130),
      publicKey: '0x' + 'b'.repeat(128),
    }),
    deriveAccount: vi.fn().mockReturnValue({
      address: 'TTESTADDRESS123456789',
      publicKey: '0x' + 'b'.repeat(128),
      privateKey: '0x' + 'a'.repeat(64),
      derivationPath: "m/44'/195'/0'/0/0",
    }),
  })),
}));

describe('KeyService - 密钥管理服务', () => {
  let keyService: KeyService;
  const testPassword = 'testPassword123!';
  const testWalletId = 'wallet-test-001';
  const testUserId = 'user-test-001';

  beforeEach(() => {
    keyService = new KeyService();
    vi.clearAllMocks();
  });

  describe('createMnemonicKey - 创建助记词钱包', () => {
    it('应该成功创建助记词钱包', async () => {
      const result = await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
        strength: 128,
      });

      expect(result).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
      expect(result.keyType).toBe('mnemonic');
      expect(result.status).toBe('active');
      expect(result.encryptedMnemonic).toBeDefined();
      expect(result.encryptionVersion).toBe('v1');
    });

    it('创建的助记词应该可以解密验证', async () => {
      const result = await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });

      const decrypted = keystoreCrypto.decryptMnemonic(result.encryptedMnemonic!, testPassword);
      expect(decrypted).toBeDefined();
      expect(decrypted.split(' ').length).toBe(12);
    });

    it('应该支持不同强度的助记词', async () => {
      const result128 = await keyService.createMnemonicKey({
        walletId: testWalletId + '1',
        password: testPassword,
        strength: 128,
      });
      expect(result128).toBeDefined();

      const result256 = await keyService.createMnemonicKey({
        walletId: testWalletId + '2',
        password: testPassword,
        strength: 256,
      });
      expect(result256).toBeDefined();
    });

    it('不同钱包应该生成不同的记录', async () => {
      const result1 = await keyService.createMnemonicKey({
        walletId: testWalletId + '1',
        password: testPassword,
      });
      const result2 = await keyService.createMnemonicKey({
        walletId: testWalletId + '2',
        password: testPassword,
      });

      expect(result1.id).not.toBe(result2.id);
      expect(result1.walletId).not.toBe(result2.walletId);
    });
  });

  describe('importMnemonic - 导入助记词', () => {
    const validMnemonic = 'test abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('应该成功导入有效的助记词', async () => {
      const result = await keyService.importMnemonic({
        walletId: testWalletId,
        mnemonic: validMnemonic,
        password: testPassword,
      });

      expect(result).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
      expect(result.keyType).toBe('mnemonic');
      expect(result.status).toBe('active');
    });

    it('导入的助记词应该可以解密还原', async () => {
      const result = await keyService.importMnemonic({
        walletId: testWalletId,
        mnemonic: validMnemonic,
        password: testPassword,
      });

      const decrypted = keystoreCrypto.decryptMnemonic(result.encryptedMnemonic!, testPassword);
      expect(decrypted).toBe(validMnemonic);
    });

    it('无效的助记词应该抛出错误', async () => {
      (validateMnemonic as vi.Mock).mockReturnValueOnce({ valid: false, error: 'Invalid mnemonic' });

      await expect(
        keyService.importMnemonic({
          walletId: testWalletId,
          mnemonic: 'invalid mnemonic',
          password: testPassword,
        })
      ).rejects.toThrow();
    });
  });

  describe('importPrivateKey - 导入私钥', () => {
    const validPrivateKey = 'a'.repeat(64);

    it('应该成功导入有效的私钥', async () => {
      const result = await keyService.importPrivateKey({
        walletId: testWalletId,
        privateKey: validPrivateKey,
        password: testPassword,
      });

      expect(result).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
      expect(result.keyType).toBe('private_key');
      expect(result.status).toBe('active');
    });

    it('导入的私钥应该可以解密还原', async () => {
      const result = await keyService.importPrivateKey({
        walletId: testWalletId,
        privateKey: validPrivateKey,
        password: testPassword,
      });

      const decrypted = keystoreCrypto.decryptPrivateKey(result.encryptedPrivateKey!, testPassword);
      expect(decrypted).toBe(validPrivateKey);
    });

    it('私钥长度不足应该抛出错误', async () => {
      await expect(
        keyService.importPrivateKey({
          walletId: testWalletId,
          privateKey: 'short',
          password: testPassword,
        })
      ).rejects.toThrow(WalletKeyErrors.INVALID_PRIVATE_KEY());
    });

    it('空私钥应该抛出错误', async () => {
      await expect(
        keyService.importPrivateKey({
          walletId: testWalletId,
          privateKey: '',
          password: testPassword,
        })
      ).rejects.toThrow();
    });
  });

  describe('getKeyMaterial - 获取密钥材料', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功获取存在的密钥材料', async () => {
      const result = await keyService.getKeyMaterial(testWalletId);
      expect(result).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
    });

    it('不存在的钱包应该抛出错误', async () => {
      await expect(
        keyService.getKeyMaterial('nonexistent-wallet')
      ).rejects.toThrow(WalletKeyErrors.KEY_MATERIAL_NOT_FOUND('nonexistent-wallet'));
    });
  });

  describe('deriveEvmAddress - 派生 EVM 地址', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功从助记词派生 EVM 地址', async () => {
      const result = await keyService.deriveEvmAddress(testWalletId, testPassword);
      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.privateKey).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(result.derivationPath).toBeDefined();
    });

    it('应该支持指定索引导出不同地址', async () => {
      const result0 = await keyService.deriveEvmAddress(testWalletId, testPassword, 0);
      const result1 = await keyService.deriveEvmAddress(testWalletId, testPassword, 1);
      expect(result0.derivationPath).toContain('/0');
      expect(result1.derivationPath).toContain('/1');
    });

    it('错误的密码应该抛出解密失败错误', async () => {
      await expect(
        keyService.deriveEvmAddress(testWalletId, 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('deriveSolanaAddress - 派生 Solana 地址', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功从助记词派生 Solana 地址', async () => {
      const result = await keyService.deriveSolanaAddress(testWalletId, testPassword);
      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.privateKey).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    it('派生路径应该是 Solana 标准路径', async () => {
      const result = await keyService.deriveSolanaAddress(testWalletId, testPassword);
      expect(result.derivationPath).toContain("m/44'/501'");
    });
  });

  describe('deriveBitcoinAddress - 派生 Bitcoin 地址', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功从助记词派生 Bitcoin 地址', async () => {
      const result = await keyService.deriveBitcoinAddress(testWalletId, testPassword);
      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.wif).toBeDefined();
      expect(result.scriptType).toBe('native-segwit');
    });

    it('派生路径应该是 Bitcoin 原生隔离见证路径', async () => {
      const result = await keyService.deriveBitcoinAddress(testWalletId, testPassword);
      expect(result.derivationPath).toContain("m/84'/0'");
    });
  });

  describe('deriveTronAddress - 派生 Tron 地址', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功从助记词派生 Tron 地址', async () => {
      const result = await keyService.deriveTronAddress(testWalletId, testPassword);
      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.address.startsWith('T')).toBe(true);
    });
  });

  describe('signEvmMessage - 签名 EVM 消息', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功签名消息', async () => {
      const result = await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: '0x' + 'a'.repeat(40),
        chainType: 'evm',
        message: 'Hello Web3',
        password: testPassword,
      });

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('风控拒绝时应该抛出错误', async () => {
      (keyRiskService.evaluate as vi.Mock).mockResolvedValueOnce({
        allowed: false,
        riskScore: 100,
        riskLevel: 'critical',
        reasons: ['Test reason'],
        action: 'reject',
      });

      await expect(
        keyService.signEvmMessage({
          walletId: testWalletId,
          userId: testUserId,
          address: '0x' + 'a'.repeat(40),
          chainType: 'evm',
          message: 'Hello Web3',
          password: testPassword,
        })
      ).rejects.toThrow();
    });
  });

  describe('signEvmTransaction - 签名 EVM 交易', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功签名交易', async () => {
      const result = await keyService.signEvmTransaction({
        walletId: testWalletId,
        userId: testUserId,
        address: '0x' + 'a'.repeat(40),
        chainType: 'evm',
        password: testPassword,
        tx: {
          to: '0x' + 'b'.repeat(40),
          value: '1000000000000000000',
          nonce: 0,
          gasPrice: '20000000000',
          gasLimit: '21000',
          data: '0x',
          chainId: 1,
        },
      });

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.rawTransaction).toBeDefined();
    });
  });

  describe('importWatchOnlyWallet - 导入观察钱包', () => {
    it('应该成功导入观察钱包', async () => {
      const result = await keyService.importWatchOnlyWallet({
        walletId: testWalletId,
        address: '0x' + 'a'.repeat(40),
        publicKey: '0x' + 'b'.repeat(128),
      });

      expect(result).toBeDefined();
      expect(result.walletId).toBe(testWalletId);
      expect(result.keyType).toBe('watch_only');
      expect(result.status).toBe('active');
    });

    it('空地址应该抛出错误', async () => {
      await expect(
        keyService.importWatchOnlyWallet({
          walletId: testWalletId,
          address: '',
        })
      ).rejects.toThrow();
    });
  });

  describe('exportKey - 导出密钥', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功导出助记词', async () => {
      const result = await keyService.exportKey({
        walletId: testWalletId,
        userId: testUserId,
        password: testPassword,
        exportType: 'mnemonic',
      });

      expect(result).toBeDefined();
      expect(result.exportType).toBe('mnemonic');
      expect(result.data).toBeDefined();
      expect(result.exportedAt).toBeDefined();
    });

    it('应该成功导出私钥', async () => {
      const result = await keyService.exportKey({
        walletId: testWalletId,
        userId: testUserId,
        password: testPassword,
        exportType: 'private_key',
        chainType: 'evm',
      });

      expect(result).toBeDefined();
      expect(result.exportType).toBe('private_key');
      expect(result.data).toBeDefined();
    });

    it('禁用导出时应该抛出错误', async () => {
      keyService.setExportEnabled(false);

      await expect(
        keyService.exportKey({
          walletId: testWalletId,
          userId: testUserId,
          password: testPassword,
          exportType: 'mnemonic',
        })
      ).rejects.toThrow();
    });

    it('观察钱包不能导出私钥', async () => {
      await keyService.importWatchOnlyWallet({
        walletId: 'watch-wallet',
        address: '0x' + 'a'.repeat(40),
      });

      await expect(
        keyService.exportKey({
          walletId: 'watch-wallet',
          userId: testUserId,
          password: testPassword,
          exportType: 'mnemonic',
        })
      ).rejects.toThrow();
    });
  });

  describe('destroyKey - 销毁密钥', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('应该成功销毁密钥材料', async () => {
      const result = await keyService.destroyKey({
        walletId: testWalletId,
        userId: testUserId,
        password: testPassword,
        confirmText: 'I understand that this action is irreversible',
      });

      expect(result.success).toBe(true);
      expect(result.walletId).toBe(testWalletId);
      expect(result.destroyedAt).toBeDefined();
    });

    it('确认文本不正确应该抛出错误', async () => {
      await expect(
        keyService.destroyKey({
          walletId: testWalletId,
          userId: testUserId,
          password: testPassword,
          confirmText: 'wrong confirm text',
        })
      ).rejects.toThrow();
    });

    it('已销毁的钱包不能再次销毁', async () => {
      await keyService.destroyKey({
        walletId: testWalletId,
        userId: testUserId,
        password: testPassword,
        confirmText: 'I understand that this action is irreversible',
      });

      await expect(
        keyService.destroyKey({
          walletId: testWalletId,
          userId: testUserId,
          password: testPassword,
          confirmText: 'I understand that this action is irreversible',
        })
      ).rejects.toThrow();
    });

    it('销毁后 isWalletDestroyed 应该返回 true', async () => {
      expect(keyService.isWalletDestroyed(testWalletId)).toBe(false);

      await keyService.destroyKey({
        walletId: testWalletId,
        userId: testUserId,
        password: testPassword,
        confirmText: 'I understand that this action is irreversible',
      });

      expect(keyService.isWalletDestroyed(testWalletId)).toBe(true);
    });
  });

  describe('getAuditLogs - 获取审计日志', () => {
    beforeEach(async () => {
      await keyService.createMnemonicKey({
        walletId: testWalletId,
        password: testPassword,
      });
    });

    it('签名操作应该记录审计日志', async () => {
      await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: '0x' + 'a'.repeat(40),
        chainType: 'evm',
        message: 'test message',
        password: testPassword,
      });

      const logs = await keyService.getAuditLogs(testWalletId);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].walletId).toBe(testWalletId);
    });

    it('应该按时间倒序返回日志', async () => {
      await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: '0x' + 'a'.repeat(40),
        chainType: 'evm',
        message: 'first message',
        password: testPassword,
      });

      await keyService.signEvmMessage({
        walletId: testWalletId,
        userId: testUserId,
        address: '0x' + 'a'.repeat(40),
        chainType: 'evm',
        message: 'second message',
        password: testPassword,
      });

      const logs = await keyService.getAuditLogs(testWalletId);
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('registerHardwareAdapter - 注册硬件钱包适配器', () => {
    it('应该成功注册硬件钱包适配器', () => {
      const mockAdapter = {
        deviceType: 'ledger',
        connect: vi.fn(),
        disconnect: vi.fn(),
        getAddress: vi.fn(),
        sign: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
      };

      expect(() => {
        keyService.registerHardwareAdapter('ledger', mockAdapter);
      }).not.toThrow();
    });
  });

  describe('registerMPCProvider - 注册 MPC 提供者', () => {
    it('应该成功注册 MPC 提供者适配器', () => {
      const mockAdapter = {
        provider: 'test-mpc',
        initialize: vi.fn(),
        generateKey: vi.fn(),
        sign: vi.fn(),
        signTransaction: vi.fn(),
        signMessage: vi.fn(),
        reshare: vi.fn(),
      };

      expect(() => {
        keyService.registerMPCProvider('test-mpc', mockAdapter);
      }).not.toThrow();
    });
  });
});
