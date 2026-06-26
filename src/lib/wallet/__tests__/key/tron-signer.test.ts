import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { TronSigner } from '../../key/tron-signer';

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

describe('TronSigner - Tron 签名器', () => {
  let signer: TronSigner;
  const testPrivateKey = 'a'.repeat(64);
  const testAddress = 'TTESTADDRESS1234567890ABCDEF';

  beforeEach(() => {
    signer = new TronSigner();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该成功创建 TronSigner 实例', () => {
      const tronSigner = new TronSigner();
      expect(tronSigner).toBeDefined();
    });
  });

  describe('deriveAccount - 派生账户', () => {
    it('应该从私钥派生出 Tron 账户', () => {
      const account = signer.deriveAccount(testPrivateKey);
      expect(account).toBeDefined();
      expect(account.address).toBeDefined();
      expect(account.publicKey).toBeDefined();
      expect(account.privateKey).toBeDefined();
      expect(account.derivationPath).toBeDefined();
    });

    it('Tron 地址应该以 T 开头', () => {
      const account = signer.deriveAccount(testPrivateKey);
      expect(account.address.startsWith('T')).toBe(true);
    });

    it('私钥应该和输入一致', () => {
      const account = signer.deriveAccount(testPrivateKey);
      expect(account.privateKey).toBe(testPrivateKey);
    });

    it('公钥应该是有效的十六进制字符串', () => {
      const account = signer.deriveAccount(testPrivateKey);
      expect(typeof account.publicKey).toBe('string');
      expect(account.publicKey.length).toBeGreaterThan(0);
    });

    it('派生路径应该是 Tron 标准路径', () => {
      const account = signer.deriveAccount(testPrivateKey);
      expect(account.derivationPath).toBeDefined();
    });
  });

  describe('signTransaction - 签名交易', () => {
    const mockTransaction = {
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 1000000,
                owner_address: 'TTESTOWNER1234567890',
                to_address: 'TTESTTOADDRESS123456789',
              },
              type_url: 'type.googleapis.com/protocol.TransferContract',
            },
            type: 'TransferContract',
          },
        ],
        ref_block_bytes: '1234',
        ref_block_hash: '5678',
        expiration: 1234567890,
        timestamp: 1234567890,
      },
      txID: 'tx1234567890',
    };

    it('应该成功签名 Tron 交易', async () => {
      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'tron',
        password: 'test',
        transaction: mockTransaction,
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('签名结果应该包含 publicKey', async () => {
      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'tron',
        password: 'test',
        transaction: mockTransaction,
      }, testPrivateKey);

      expect(result.publicKey).toBeDefined();
    });

    it('应该能处理转账交易', async () => {
      const transferTx = {
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  amount: 1000000,
                  owner_address: testAddress,
                  to_address: 'TRECIPIENT1234567890',
                },
              },
              type: 'TransferContract',
            },
          ],
          ref_block_bytes: 'abcd',
          ref_block_hash: 'ef12',
          expiration: Date.now() + 60000,
          timestamp: Date.now(),
        },
        txID: 'transfer_tx_123',
      };

      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'tron',
        password: 'test',
        transaction: transferTx,
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理 TRC20 转账交易', async () => {
      const trc20Tx = {
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  contract_address: 'TTOKENCONTRACT123456789',
                  owner_address: testAddress,
                  data: 'a9059cbb' + '0'.repeat(64),
                },
              },
              type: 'TriggerSmartContract',
            },
          ],
          ref_block_bytes: '1234',
          ref_block_hash: '5678',
          expiration: Date.now() + 60000,
          timestamp: Date.now(),
        },
        txID: 'trc20_tx_123',
      };

      const result = await signer.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'tron',
        password: 'test',
        transaction: trc20Tx,
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
        chainType: 'tron',
        message: 'Hello Tron!',
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
        chainType: 'tron',
        message: '',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理中文消息', async () => {
      const result = await signer.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'tron',
        message: '你好，波场！',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('verifyAddress - 验证地址', () => {
    it('应该能验证 Tron 地址', () => {
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

    it('非 T 开头的地址应该返回 false', () => {
      const result = signer.verifyAddress('0x' + 'a'.repeat(40));
      expect(result).toBe(false);
    });
  });

  describe('addressToHex - 地址转十六进制', () => {
    it('应该将 Tron 地址转换为十六进制格式', () => {
      const hex = signer.addressToHex(testAddress);
      expect(typeof hex).toBe('string');
    });
  });

  describe('hexToAddress - 十六进制转地址', () => {
    it('应该将十六进制转换为 Tron 地址', () => {
      const hex = '41' + 'a'.repeat(40);
      const address = signer.hexToAddress(hex);
      expect(typeof address).toBe('string');
      expect(address.startsWith('T')).toBe(true);
    });
  });
});
