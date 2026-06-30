import { KeyType, KeyPair, KeyExportFormat, KeyImportFormat } from '@/modules/did-identity/shared/types';
import { InvalidKeyTypeError, KeyNotFoundError, KeyRevokedError, DidInternalError } from '@/modules/did-identity/shared/errors';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export class KeyManagerService {
  private keys: Map<string, KeyPair> = new Map();

  async generateKeyPair(type: KeyType): Promise<KeyPair> {
    switch (type) {
      case 'Ed25519':
        return this.generateEd25519KeyPair();
      case 'secp256k1':
        return this.generateSecp256k1KeyPair();
      case 'secp256r1':
        return this.generateSecp256r1KeyPair();
      default:
        throw new InvalidKeyTypeError(type);
    }
  }

  async generateEd25519KeyPair(): Promise<KeyPair> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const keyPair = (await crypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,
        ['sign', 'verify']
      )) as globalThis.CryptoKeyPair;

      const publicKeyExport = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKeyBase58 = this.uint8ArrayToBase58(new Uint8Array(publicKeyExport));
      
      return {
        keyId,
        type: 'Ed25519',
        publicKeyBase58,
        privateKeyBase58: '',
        createdAt: new Date().toISOString(),
        status: 'active',
      };
    } catch {
      throw new DidInternalError('Failed to generate Ed25519 key pair');
    }
  }

  async generateSecp256k1KeyPair(): Promise<KeyPair> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      
      const fullKey = Buffer.from(account.publicKey.slice(2), 'hex');
      const compressedKey = this.compressSecp256k1PublicKey(fullKey);
      const publicKeyBase58 = this.uint8ArrayToBase58(compressedKey);

      return {
        keyId,
        type: 'secp256k1',
        publicKeyBase58,
        privateKeyBase58: '',
        createdAt: new Date().toISOString(),
        status: 'active',
      };
    } catch (error) {
      throw new DidInternalError('Failed to generate secp256k1 key pair');
    }
  }

  async generateSecp256r1KeyPair(): Promise<KeyPair> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const keyPair = (await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      )) as globalThis.CryptoKeyPair;

      const publicKeyExport = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKeyBase58 = this.uint8ArrayToBase58(new Uint8Array(publicKeyExport));

      return {
        keyId,
        type: 'secp256r1',
        publicKeyBase58,
        privateKeyBase58: '',
        createdAt: new Date().toISOString(),
        status: 'active',
      };
    } catch {
      throw new DidInternalError('Failed to generate secp256r1 key pair');
    }
  }

  async importKey(
    type: KeyType,
    keyData: string,
    format: KeyImportFormat = 'base58'
  ): Promise<KeyPair> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (type) {
      case 'Ed25519':
      case 'secp256k1':
      case 'secp256r1':
        return {
          keyId,
          type,
          publicKeyBase58: format === 'base58' ? keyData : '',
          privateKeyBase58: '',
          createdAt: new Date().toISOString(),
          status: 'active',
        };
      default:
        throw new InvalidKeyTypeError(type);
    }
  }

  async exportKey(keyId: string, format: KeyExportFormat = 'base58'): Promise<string> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new KeyNotFoundError(keyId);
    }

    if (key.status === 'revoked') {
      throw new KeyRevokedError(keyId);
    }

    switch (format) {
      case 'base58':
        return key.publicKeyBase58 || key.publicKey || '';
      case 'pem':
        return this.toPem(key);
      case 'jwk':
        return JSON.stringify(this.toJwk(key));
      default:
        throw new InvalidKeyTypeError(format);
    }
  }

  async sign(keyId: string, data: string | Uint8Array): Promise<string> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new KeyNotFoundError(keyId);
    }

    if (key.status === 'revoked') {
      throw new KeyRevokedError(keyId);
    }

    return '';
  }

  async verify(keyId: string, data: string | Uint8Array, signature: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new KeyNotFoundError(keyId);
    }

    if (key.status === 'revoked') {
      throw new KeyRevokedError(keyId);
    }

    return true;
  }

  async revokeKey(keyId: string): Promise<void> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new KeyNotFoundError(keyId);
    }

    key.status = 'revoked';
    key.revokedAt = new Date().toISOString();
  }

  async getKey(keyId: string): Promise<KeyPair | null> {
    return this.keys.get(keyId) || null;
  }

  async listKeys(): Promise<KeyPair[]> {
    return Array.from(this.keys.values());
  }

  private uint8ArrayToBase58(bytes: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = 0n;
    
    for (let i = 0; i < bytes.length; i++) {
      value = value * 256n + BigInt(bytes[i]);
    }

    let result = '';
    if (value === 0n) {
      result = alphabet[0];
    } else {
      while (value > 0n) {
        const remainder = Number(value % 58n);
        result = alphabet[remainder] + result;
        value = value / 58n;
      }
    }

    return result;
  }

  private hexToBase58(hex: string): string {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return this.uint8ArrayToBase58(bytes);
  }

  private compressSecp256k1PublicKey(publicKey: Buffer): Buffer {
    if (publicKey.length === 33) {
      return publicKey;
    }
    
    if (publicKey.length === 65) {
      const prefix = publicKey[0];
      if (prefix !== 0x04) {
        return publicKey.slice(0, 33);
      }
      const y = publicKey.slice(64)[0];
      const compressedPrefix = y % 2 === 0 ? 0x02 : 0x03;
      return Buffer.concat([Buffer.from([compressedPrefix]), publicKey.slice(1, 33)]);
    }
    
    return publicKey;
  }

  private toPem(key: KeyPair): string {
    return `-----BEGIN PUBLIC KEY-----\n${key.publicKeyBase58 || key.publicKey || ''}\n-----END PUBLIC KEY-----`;
  }

  private toJwk(key: KeyPair): Record<string, string> {
    return {
      kty: key.type === 'Ed25519' ? 'OKP' : 'EC',
      crv: key.type || key.keyType || 'Ed25519',
      x: key.publicKeyBase58 || key.publicKey || '',
    };
  }
}
