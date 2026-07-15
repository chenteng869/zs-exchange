import crypto from 'crypto';
import { EncryptedPayload } from './key.types';
import { WalletKeyErrors } from './key.errors';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

export class KeystoreCrypto {
  private readonly keyLength = 32;
  private readonly ivLength = 12;
  private readonly saltLength = 16;
  private readonly scryptOptions = {
    N: 16384,
    r: 8,
    p: 1,
  };

  encryptSecret(secret: string, password: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    const key = crypto.scryptSync(
      password,
      salt,
      this.keyLength,
      this.scryptOptions,
    );

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    const payload: EncryptedPayload = {
      version: 'v1',
      algorithm: 'aes-256-gcm',
      kdf: 'scrypt',
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      ciphertext: ciphertext.toString('hex'),
    };

    key.fill(0);
    salt.fill(0);
    iv.fill(0);

    return JSON.stringify(payload);
  }

  decryptSecret(encryptedPayload: string, password: string): string {
    try {
      const payload: EncryptedPayload = typeof encryptedPayload === 'string'
        ? safeJsonParse<EncryptedPayload>(encryptedPayload, {
            context: 'keystore-decrypt',
            maxBytes: 64 * 1024,
            silent: true,
            defaultValue: null,
          }) as EncryptedPayload
        : encryptedPayload;
      if (!payload) throw WalletKeyErrors.DECRYPT_FAILED();

      const salt = Buffer.from(payload.salt, 'hex');
      const iv = Buffer.from(payload.iv, 'hex');
      const tag = Buffer.from(payload.tag, 'hex');
      const ciphertext = Buffer.from(payload.ciphertext, 'hex');

      const key = crypto.scryptSync(
        password,
        salt,
        this.keyLength,
        this.scryptOptions,
      );

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      key.fill(0);
      salt.fill(0);
      iv.fill(0);

      return decrypted.toString('utf8');
    } catch (error) {
      throw WalletKeyErrors.DECRYPT_FAILED();
    }
  }

  encryptPrivateKey(privateKey: string, password: string): string {
    return this.encryptSecret(privateKey, password);
  }

  decryptPrivateKey(encryptedPrivateKey: string, password: string): string {
    return this.decryptSecret(encryptedPrivateKey, password);
  }

  encryptMnemonic(mnemonic: string, password: string): string {
    return this.encryptSecret(mnemonic, password);
  }

  decryptMnemonic(encryptedMnemonic: string, password: string): string {
    return this.decryptSecret(encryptedMnemonic, password);
  }

  generatePasswordHash(password: string): string {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 32, this.scryptOptions);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [saltHex, hashHex] = storedHash.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const storedKey = Buffer.from(hashHex, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 32, this.scryptOptions);
      return crypto.timingSafeEqual(storedKey, derivedKey);
    } catch {
      return false;
    }
  }

  randomBytes(size: number): Buffer {
    return crypto.randomBytes(size);
  }

  sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  keccak256(data: string | Buffer): string {
    return crypto.createHash('sha3-256').update(data).digest('hex');
  }
}

export const keystoreCrypto = new KeystoreCrypto();
