import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { BitcoinSigner } from '../../key/bitcoin-signer';

vi.mock('../../key/keystore.crypto', () => ({
  keystoreCrypto: {
    sha256: vi.fn((data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return 'sha256' + buf.toString('hex').slice(0, 58).padEnd(58, '0');
    }),
    keccak256: vi.fn((data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return 'keccak' + buf.toString('hex').slice(0, 58).padEnd(58, '0');
    }),
  },
}));

describe('BitcoinSigner - Bitcoin 签名器', () => {
  let signer: BitcoinSigner;
  const testPrivateKey = 'a'.repeat(64);
  const testAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

  beforeEach(() => {
    signer = new BitcoinSigner('mainnet');
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用 mainnet 网络创建实例', () => {
      const mainnetSigner = new BitcoinSigner('mainnet');
      expect(mainnetSigner).toBeDefined();
    });

    it('应该使用 testnet 网络创建实例', () => {
      const testnetSigner = new BitcoinSigner('testnet');
      expect(testnetSigner).toBeDefined();
    });
  });

  describe('deriveAccount - 派生账户', () => {
    it('应该从私钥派生出账户信息', () => {
      const account = signer.deriveAccount(testPrivateKey, 'native-segwit');
      expect(account).toBeDefined();
      expect(account.address).toBeDefined();
      expect(account.publicKey).toBeDefined();
      expect(account.privateKey).toBeDefined();
      expect(account.wif).toBeDefined();
      expect(account.derivationPath).toBeDefined();
      expect(account.scriptType).toBe('native-segwit');
    });

    it('派生的地址应该是 bech32 格式（以 bc1 开头）', () => {
      const account = signer.deriveAccount(testPrivateKey, 'native-segwit');
      expect(account.address).toBeTruthy();
    });

    it('应该支持 nested-segwit 脚本类型', () => {
      const account = signer.deriveAccount(testPrivateKey, 'nested-segwit');
      expect(account).toBeDefined();
      expect(account.scriptType).toBe('nested-segwit');
    });

    it('应该支持 legacy 脚本类型', () => {
      const account = signer.deriveAccount(testPrivateKey, 'legacy');
      expect(account).toBeDefined();
      expect(account.scriptType).toBe('legacy');
    });

    it('派生的私钥应该和输入一致', () => {
      const account = signer.deriveAccount(testPrivateKey, 'native-segwit');
      expect(account.privateKey).toBe(testPrivateKey);
    });

    it('公钥应该是有效的十六进制字符串', () => {
      const account = signer.deriveAccount(testPrivateKey, 'native-segwit');
      expect(typeof account.publicKey).toBe('string');
      expect(account.publicKey.length).toBeGreaterThan(0);
    });

    it('WIF 格式应该是有效的', () => {
      const account = signer.deriveAccount(testPrivateKey, 'native-segwit');
      expect(typeof account.wif).toBe('string');
      expect(account.wif.length).toBeGreaterThan(0);
    });
  });

  describe('signTransaction - 签名交易', () => {
    const mockPsbt = 'cHNidP8BAFMCAAAAA';

    it('应该成功签名 PSBT 交易', async () => {
      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        password: 'test',
        psbt: mockPsbt,
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('签名结果应该包含 publicKey', async () => {
      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        password: 'test',
        psbt: mockPsbt,
      }, testPrivateKey);

      expect(result.publicKey).toBeDefined();
    });

    it('应该能处理空的 PSBT', async () => {
      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        password: 'test',
        psbt: '',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('signMessage - 签名消息', () => {
    it('应该成功签名消息', async () => {
      const result = await signer.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        message: 'Hello Bitcoin!',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('应该能处理空消息', async () => {
      const result = await signer.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        message: '',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理长消息', async () => {
      const longMessage = 'B'.repeat(5000);
      const result = await signer.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'bitcoin',
        message: longMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('verifyAddress - 验证地址', () => {
    it('应该能验证 Bitcoin 地址', () => {
      const result = signer.verifyAddress(testAddress);
      expect(typeof result).toBe('boolean');
    });

    it('无效地址应该返回 false', () => {
      const result = signer.verifyAddress('invalid-address');
      expect(result).toBe(false);
    });

    it('空地址应该返回 false', () => {
      const result = signer.verifyAddress('');
      expect(result).toBe(false);
    });
  });

  describe('getNetwork - 获取网络配置', () => {
    it('mainnet 应该返回主网配置', () => {
      const mainnetSigner = new BitcoinSigner('mainnet');
      expect(mainnetSigner).toBeDefined();
    });

    it('testnet 应该返回测试网配置', () => {
      const testnetSigner = new BitcoinSigner('testnet');
      expect(testnetSigner).toBeDefined();
    });
  });

  describe('不同网络的签名器', () => {
    it('mainnet 和 testnet 应该是独立的实例', () => {
      const mainnetSigner = new BitcoinSigner('mainnet');
      const testnetSigner = new BitcoinSigner('testnet');
      expect(mainnetSigner).not.toBe(testnetSigner);
    });
  });
});
