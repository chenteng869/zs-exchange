import { CryptoKeyPair, SignatureResult } from './crypto.types';
import { MultibaseService } from './multibase.service';
import * as secp256k1 from '@noble/secp256k1';
import { keccak256 } from 'viem';
import { randomBytes as nodeRandomBytes } from 'crypto';

export class Secp256k1KeyService {
  private multibase: MultibaseService;

  constructor() {
    this.multibase = new MultibaseService();
  }

  async generateKeyPair(): Promise<CryptoKeyPair> {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false);
    
    const publicKeyBytes = publicKey.slice(1);

    return {
      publicKey: publicKeyBytes,
      privateKey: privateKey,
      curve: 'secp256k1',
    };
  }

  async sign(privateKey: Uint8Array, data: Uint8Array): Promise<SignatureResult> {
    const signature = await secp256k1.signAsync(data, privateKey, { format: 'recovered' });
    
    const sigBytes = new Uint8Array(signature.length);
    for (let i = 0; i < signature.length; i++) {
      sigBytes[i] = signature[i];
    }

    const publicKey = secp256k1.getPublicKey(privateKey, false);
    const publicKeyBytes = publicKey.slice(1);

    return {
      signature: sigBytes,
      publicKey: publicKeyBytes,
    };
  }

  async verify(publicKey: Uint8Array, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    try {
      const fullPublicKey = new Uint8Array([0x04, ...publicKey]);
      return await secp256k1.verifyAsync(signature, data, fullPublicKey, { format: 'recovered' });
    } catch (e) {
      return false;
    }
  }

  async publicKeyToMultibase(publicKey: Uint8Array): Promise<string> {
    const fullKey = publicKey.length === 64 
      ? new Uint8Array([0x04, ...publicKey])
      : publicKey;
    
    const compressedKey = secp256k1.Point.fromBytes(fullKey).toBytes(true);
    const bytes = new Uint8Array([...compressedKey]);
    return this.multibase.encode(bytes, 'base58btc');
  }

  async multibaseToPublicKey(multibaseKey: string): Promise<Uint8Array> {
    const bytes = this.multibase.decode(multibaseKey);
    
    if (bytes[0] !== 0x02 && bytes[0] !== 0x03) {
      throw new Error('Invalid secp256k1 multibase encoding');
    }

    const decompressed = secp256k1.Point.fromBytes(bytes).toBytes(false);
    return decompressed.slice(1);
  }

  async publicKeyToAddress(publicKey: Uint8Array): Promise<string> {
    let publicKeyHex: `0x${string}`;
    if (publicKey.length === 64) {
      publicKeyHex = `0x04${Buffer.from(publicKey).toString('hex')}`;
    } else if (publicKey.length === 65 && publicKey[0] === 0x04) {
      publicKeyHex = `0x${Buffer.from(publicKey).toString('hex')}`;
    } else {
      publicKeyHex = `0x${Buffer.from(publicKey).toString('hex')}`;
    }

    const hash = keccak256(publicKeyHex);
    const address = hash.slice(-40);
    
    return `0x${address}`;
  }

  async addressToPublicKey(address: string): Promise<Uint8Array> {
    throw new Error('Cannot derive public key from address');
  }

  async createDidKey(publicKey: Uint8Array): Promise<string> {
    const fullKey = publicKey.length === 64 
      ? new Uint8Array([0x04, ...publicKey])
      : publicKey;
    
    const compressedKey = secp256k1.Point.fromBytes(fullKey).toBytes(true);
    const multibaseKey = this.multibase.encode(compressedKey, 'base58btc');
    return `did:key:${multibaseKey}`;
  }

  async createDidPkh(chainId: string, accountId: string): Promise<string> {
    return `did:pkh:${chainId}:${accountId}`;
  }

  async createDidEthr(chainId: string, accountId: string): Promise<string> {
    return `did:ethr:${chainId}:${accountId}`;
  }

  async fingerprint(publicKey: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', publicKey);
    return this.multibase.encode(new Uint8Array(digest), 'base58btc');
  }

  private compressPublicKey(publicKey: Uint8Array): Uint8Array {
    const fullKey = publicKey.length === 64 
      ? new Uint8Array([0x04, ...publicKey])
      : publicKey;
    
    return secp256k1.Point.fromBytes(fullKey).toBytes(true);
  }

  private decompressPublicKey(compressed: Uint8Array): Uint8Array {
    return secp256k1.Point.fromBytes(compressed).toBytes(false);
  }
}
