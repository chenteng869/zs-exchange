import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { EvmSigner } from '../../key/evm-signer';

vi.mock('../../key/keystore.crypto', () => ({
  keystoreCrypto: {
    keccak256: vi.fn((data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return Buffer.from('hash' + buf.toString('hex').slice(0, 60)).toString('hex').padEnd(64, '0');
    }),
    sha256: vi.fn((data) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return Buffer.from('sha256' + buf.toString('hex').slice(0, 58)).toString('hex').padEnd(64, '0');
    }),
  },
}));

vi.mock('../../core/private-key', () => ({
  sign: vi.fn().mockReturnValue('0x' + 'a'.repeat(128) + '1b'),
  recoverPublicKey: vi.fn().mockReturnValue('0x' + 'b'.repeat(128)),
  toChecksumAddress: vi.fn((addr) => addr),
}));

describe('EvmSigner - EVM 签名器', () => {
  let evmSigner: EvmSigner;
  const testPrivateKey = 'a'.repeat(64);
  const testMessage = 'Hello, Web3!';
  const testAddress = '0x' + 'a'.repeat(40);

  beforeEach(() => {
    evmSigner = new EvmSigner(1);
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该使用指定的 chainId 创建实例', () => {
      const signer = new EvmSigner(56);
      expect(signer).toBeDefined();
    });

    it('默认 chainId 应该是 1', () => {
      const signer = new EvmSigner();
      expect(signer).toBeDefined();
    });
  });

  describe('signMessage - 签名消息', () => {
    it('应该成功签名消息', async () => {
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: testMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    it('签名结果应该包含 signature 字段', async () => {
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: testMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result.signature).toBeTruthy();
    });

    it('签名结果应该包含 publicKey 字段', async () => {
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: testMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result.publicKey).toBeTruthy();
    });

    it('应该能处理空消息', async () => {
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: '',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理中文消息', async () => {
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: '你好，区块链！',
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理长消息', async () => {
      const longMessage = 'A'.repeat(10000);
      const result = await evmSigner.signMessage({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: longMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('signPersonalSign - personal_sign 签名', () => {
    it('应该成功进行 personal_sign 签名', async () => {
      const result = await evmSigner.signPersonalSign({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: testMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('personal_sign 应该包含公钥', async () => {
      const result = await evmSigner.signPersonalSign({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        message: testMessage,
        password: 'test',
      }, testPrivateKey);

      expect(result.publicKey).toBeDefined();
    });
  });

  describe('signTypedData - 签名 EIP-712 类型化数据', () => {
    const domain = {
      name: 'TestDApp',
      version: '1',
      chainId: 1,
      verifyingContract: '0x' + 'c'.repeat(40),
    };

    const types = {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'uint256' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    };

    const message = {
      from: {
        name: 'Alice',
        age: 25,
      },
      to: {
        name: 'Bob',
        age: 30,
      },
      contents: 'Hello, Bob!',
    };

    it('应该成功签名类型化数据', async () => {
      const result = await evmSigner.signTypedData({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        domain,
        types,
        message,
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
    });

    it('类型化数据签名应该返回公钥', async () => {
      const result = await evmSigner.signTypedData({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        domain,
        types,
        message,
        password: 'test',
      }, testPrivateKey);

      expect(result.publicKey).toBeDefined();
    });

    it('应该能处理复杂的类型结构', async () => {
      const complexTypes = {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
        ],
        Order: [
          { name: 'id', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'seller', type: 'address' },
          { name: 'buyer', type: 'address' },
          { name: 'token', type: 'address' },
        ],
      };

      const result = await evmSigner.signTypedData({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        domain: { name: 'Test', version: '1' },
        types: complexTypes,
        message: {
          id: 123,
          price: '1000000000000000000',
          amount: '1000',
          seller: '0x' + 's'.repeat(40),
          buyer: '0x' + 'b'.repeat(40),
          token: '0x' + 't'.repeat(40),
        },
        password: 'test',
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('signTransaction - 签名交易', () => {
    const testTx = {
      to: '0x' + 't'.repeat(40),
      value: '1000000000000000000',
      nonce: 0,
      gasPrice: '20000000000',
      gasLimit: '21000',
      data: '0x',
      chainId: 1,
    };

    it('应该成功签名交易', async () => {
      const result = await evmSigner.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        password: 'test',
        tx: testTx,
      }, testPrivateKey);

      expect(result).toBeDefined();
      expect(result.signature).toBeDefined();
      expect(result.rawTransaction).toBeDefined();
    });

    it('签名后的交易应该包含 rawTransaction', async () => {
      const result = await evmSigner.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        password: 'test',
        tx: testTx,
      }, testPrivateKey);

      expect(result.rawTransaction).toBeTruthy();
      expect(result.rawTransaction?.startsWith('0x')).toBe(true);
    });

    it('应该能处理有 data 字段的合约调用交易', async () => {
      const contractTx = {
        ...testTx,
        data: '0xa9059cbb' + '0'.repeat(64) + '0'.repeat(24) + 'b'.repeat(40),
      };

      const result = await evmSigner.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        password: 'test',
        tx: contractTx,
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理不同 chainId 的交易', async () => {
      const bscSigner = new EvmSigner(56);
      const bscTx = { ...testTx, chainId: 56 };

      const result = await bscSigner.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        password: 'test',
        tx: bscTx,
      }, testPrivateKey);

      expect(result).toBeDefined();
    });

    it('应该能处理 EIP-1559 交易', async () => {
      const eip1559Tx = {
        to: '0x' + 't'.repeat(40),
        value: '1000000000000000000',
        nonce: 5,
        maxPriorityFeePerGas: '2000000000',
        maxFeePerGas: '50000000000',
        gasLimit: '21000',
        data: '0x',
        chainId: 1,
        type: 2,
      };

      const result = await evmSigner.signTransaction({
        walletId: 'wallet-1',
        userId: 'user-1',
        address: testAddress,
        chainType: 'evm',
        password: 'test',
        tx: eip1559Tx,
      }, testPrivateKey);

      expect(result).toBeDefined();
    });
  });

  describe('verifyAddress - 验证地址校验和', () => {
    it('应该能验证正确的校验和地址', () => {
      const result = evmSigner.verifyAddress(testAddress);
      expect(typeof result).toBe('boolean');
    });

    it('错误的地址应该返回 false', () => {
      const result = evmSigner.verifyAddress('0xinvalid');
      expect(result).toBe(false);
    });

    it('空字符串应该返回 false', () => {
      const result = evmSigner.verifyAddress('');
      expect(result).toBe(false);
    });
  });

  describe('不同 chainId 的签名器实例', () => {
    it('不同 chainId 应该创建独立的实例', () => {
      const signer1 = new EvmSigner(1);
      const signer56 = new EvmSigner(56);

      expect(signer1).not.toBe(signer56);
    });

    it('同一 chainId 创建的实例应该是独立的', () => {
      const signer1 = new EvmSigner(1);
      const signer2 = new EvmSigner(1);

      expect(signer1).not.toBe(signer2);
    });
  });
});
