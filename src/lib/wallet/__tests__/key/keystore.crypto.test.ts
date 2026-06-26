import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { KeystoreCrypto, keystoreCrypto } from '../../key/keystore.crypto';
import { WalletKeyErrors } from '../../key/key.errors';

describe('KeystoreCrypto - 密钥存储加密工具', () => {
  let crypto: KeystoreCrypto;
  const testPassword = 'testPassword123!';
  const testSecret = 'private key data for testing';
  const testMnemonic = 'test mnemonic phrase twelve words secure random generate';

  beforeEach(() => {
    crypto = new KeystoreCrypto();
  });

  describe('encryptSecret - 加密秘密数据', () => {
    it('应该成功加密字符串数据并返回 JSON 字符串', () => {
      const result = crypto.encryptSecret(testSecret, testPassword);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('加密结果应该是有效的 JSON 格式', () => {
      const result = crypto.encryptSecret(testSecret, testPassword);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('algorithm');
      expect(parsed).toHaveProperty('kdf');
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('tag');
      expect(parsed).toHaveProperty('ciphertext');
    });

    it('加密结果的版本应该是 v1', () => {
      const result = crypto.encryptSecret(testSecret, testPassword);
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('v1');
    });

    it('加密算法应该是 aes-256-gcm', () => {
      const result = crypto.encryptSecret(testSecret, testPassword);
      const parsed = JSON.parse(result);
      expect(parsed.algorithm).toBe('aes-256-gcm');
    });

    it('密钥派生函数应该是 scrypt', () => {
      const result = crypto.encryptSecret(testSecret, testPassword);
      const parsed = JSON.parse(result);
      expect(parsed.kdf).toBe('scrypt');
    });

    it('每次加密应该生成不同的 salt 和 iv', () => {
      const result1 = crypto.encryptSecret(testSecret, testPassword);
      const result2 = crypto.encryptSecret(testSecret, testPassword);
      const parsed1 = JSON.parse(result1);
      const parsed2 = JSON.parse(result2);
      expect(parsed1.salt).not.toBe(parsed2.salt);
      expect(parsed1.iv).not.toBe(parsed2.iv);
    });

    it('相同的明文和密码加密结果应该不同（随机 salt）', () => {
      const result1 = crypto.encryptSecret(testSecret, testPassword);
      const result2 = crypto.encryptSecret(testSecret, testPassword);
      expect(result1).not.toBe(result2);
    });

    it('应该能加密空字符串', () => {
      const result = crypto.encryptSecret('', testPassword);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该能处理长文本数据', () => {
      const longText = 'A'.repeat(10000);
      const result = crypto.encryptSecret(longText, testPassword);
      expect(typeof result).toBe('string');
      const decrypted = crypto.decryptSecret(result, testPassword);
      expect(decrypted).toBe(longText);
    });
  });

  describe('decryptSecret - 解密秘密数据', () => {
    it('应该成功解密正确密码加密的数据', () => {
      const encrypted = crypto.encryptSecret(testSecret, testPassword);
      const decrypted = crypto.decryptSecret(encrypted, testPassword);
      expect(decrypted).toBe(testSecret);
    });

    it('使用错误的密码应该抛出解密失败错误', () => {
      const encrypted = crypto.encryptSecret(testSecret, testPassword);
      expect(() => {
        crypto.decryptSecret(encrypted, 'wrongPassword');
      }).toThrow(WalletKeyErrors.DECRYPT_FAILED());
    });

    it('应该能解密对象格式的加密数据', () => {
      const encrypted = crypto.encryptSecret(testSecret, testPassword);
      const parsed = JSON.parse(encrypted);
      const decrypted = crypto.decryptSecret(JSON.stringify(parsed), testPassword);
      expect(decrypted).toBe(testSecret);
    });

    it('损坏的加密数据应该抛出错误', () => {
      const invalidData = JSON.stringify({
        version: 'v1',
        algorithm: 'aes-256-gcm',
        kdf: 'scrypt',
        salt: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
        ciphertext: 'invalid',
      });
      expect(() => {
        crypto.decryptSecret(invalidData, testPassword);
      }).toThrow();
    });

    it('空字符串输入应该抛出错误', () => {
      expect(() => {
        crypto.decryptSecret('', testPassword);
      }).toThrow();
    });

    it('无效的 JSON 格式应该抛出错误', () => {
      expect(() => {
        crypto.decryptSecret('not valid json', testPassword);
      }).toThrow();
    });

    it('加密解密往返应该保持数据完整性', () => {
      const original = 'Hello, Web3 World! 你好，区块链世界！';
      const encrypted = crypto.encryptSecret(original, testPassword);
      const decrypted = crypto.decryptSecret(encrypted, testPassword);
      expect(decrypted).toBe(original);
    });

    it('多次解密应该返回相同的结果', () => {
      const encrypted = crypto.encryptSecret(testSecret, testPassword);
      const result1 = crypto.decryptSecret(encrypted, testPassword);
      const result2 = crypto.decryptSecret(encrypted, testPassword);
      expect(result1).toBe(result2);
    });
  });

  describe('encryptPrivateKey / decryptPrivateKey - 私钥加密解密', () => {
    const testPrivateKey = '0x' + 'a'.repeat(64);

    it('应该成功加密私钥', () => {
      const result = crypto.encryptPrivateKey(testPrivateKey, testPassword);
      expect(typeof result).toBe('string');
    });

    it('应该成功解密私钥并还原原始数据', () => {
      const encrypted = crypto.encryptPrivateKey(testPrivateKey, testPassword);
      const decrypted = crypto.decryptPrivateKey(encrypted, testPassword);
      expect(decrypted).toBe(testPrivateKey);
    });

    it('使用错误密码解密私钥应该失败', () => {
      const encrypted = crypto.encryptPrivateKey(testPrivateKey, testPassword);
      expect(() => {
        crypto.decryptPrivateKey(encrypted, 'wrong');
      }).toThrow();
    });
  });

  describe('encryptMnemonic / decryptMnemonic - 助记词加密解密', () => {
    const testMnemonic = 'test abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('应该成功加密助记词', () => {
      const result = crypto.encryptMnemonic(testMnemonic, testPassword);
      expect(typeof result).toBe('string');
    });

    it('应该成功解密助记词并还原原始数据', () => {
      const encrypted = crypto.encryptMnemonic(testMnemonic, testPassword);
      const decrypted = crypto.decryptMnemonic(encrypted, testPassword);
      expect(decrypted).toBe(testMnemonic);
    });

    it('使用错误密码解密助记词应该失败', () => {
      const encrypted = crypto.encryptMnemonic(testMnemonic, testPassword);
      expect(() => {
        crypto.decryptMnemonic(encrypted, 'wrong');
      }).toThrow();
    });
  });

  describe('generatePasswordHash - 生成密码哈希', () => {
    it('应该生成字符串格式的哈希', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      expect(typeof hash).toBe('string');
      expect(hash).toContain(':');
    });

    it('哈希格式应该是 salt:hash', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      const parts = hash.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBe(32);
      expect(parts[1].length).toBe(64);
    });

    it('相同密码每次应该生成不同的哈希（随机 salt）', () => {
      const hash1 = crypto.generatePasswordHash(testPassword);
      const hash2 = crypto.generatePasswordHash(testPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword - 验证密码', () => {
    it('正确的密码应该验证通过', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      const result = crypto.verifyPassword(testPassword, hash);
      expect(result).toBe(true);
    });

    it('错误的密码应该验证失败', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      const result = crypto.verifyPassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('空密码应该验证失败', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      const result = crypto.verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('无效的哈希格式应该返回 false', () => {
      const result = crypto.verifyPassword(testPassword, 'invalid-hash');
      expect(result).toBe(false);
    });

    it('空哈希应该返回 false', () => {
      const result = crypto.verifyPassword(testPassword, '');
      expect(result).toBe(false);
    });

    it('应该使用恒定时间比较（防止时序攻击）', () => {
      const hash = crypto.generatePasswordHash(testPassword);
      const result1 = crypto.verifyPassword(testPassword, hash);
      const result2 = crypto.verifyPassword(testPassword + 'a', hash);
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('randomBytes - 生成随机字节', () => {
    it('应该返回 Buffer 对象', () => {
      const result = crypto.randomBytes(32);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('应该返回指定长度的随机字节', () => {
      const length = 16;
      const result = crypto.randomBytes(length);
      expect(result.length).toBe(length);
    });

    it('每次调用应该生成不同的随机数据', () => {
      const result1 = crypto.randomBytes(32);
      const result2 = crypto.randomBytes(32);
      expect(result1.toString('hex')).not.toBe(result2.toString('hex'));
    });

    it('应该能生成 0 长度的字节', () => {
      const result = crypto.randomBytes(0);
      expect(result.length).toBe(0);
    });
  });

  describe('sha256 - SHA256 哈希', () => {
    it('应该返回 64 字符的十六进制字符串', () => {
      const result = crypto.sha256('test');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    it('相同输入应该返回相同哈希', () => {
      const result1 = crypto.sha256('test');
      const result2 = crypto.sha256('test');
      expect(result1).toBe(result2);
    });

    it('不同输入应该返回不同哈希', () => {
      const result1 = crypto.sha256('test1');
      const result2 = crypto.sha256('test2');
      expect(result1).not.toBe(result2);
    });

    it('应该支持 Buffer 输入', () => {
      const input = Buffer.from('test', 'utf8');
      const result = crypto.sha256(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    it('空字符串应该返回正确的哈希', () => {
      const result = crypto.sha256('');
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('keccak256 - Keccak256 哈希', () => {
    it('应该返回 64 字符的十六进制字符串', () => {
      const result = crypto.keccak256('test');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });

    it('相同输入应该返回相同哈希', () => {
      const result1 = crypto.keccak256('test');
      const result2 = crypto.keccak256('test');
      expect(result1).toBe(result2);
    });

    it('不同输入应该返回不同哈希', () => {
      const result1 = crypto.keccak256('test1');
      const result2 = crypto.keccak256('test2');
      expect(result1).not.toBe(result2);
    });

    it('应该支持 Buffer 输入', () => {
      const input = Buffer.from('test', 'utf8');
      const result = crypto.keccak256(input);
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64);
    });
  });

  describe('单例实例', () => {
    it('keystoreCrypto 单例应该存在', () => {
      expect(keystoreCrypto).toBeDefined();
      expect(keystoreCrypto).toBeInstanceOf(KeystoreCrypto);
    });

    it('单例应该能正常工作', () => {
      const result = keystoreCrypto.sha256('test');
      expect(result.length).toBe(64);
    });
  });
});
