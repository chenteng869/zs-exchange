import { CryptoKeyPair, SignatureResult } from './crypto.types';
import { MultibaseService } from './multibase.service';

export class Ed25519KeyService {
  private multibase: MultibaseService;

  constructor() {
    this.multibase = new MultibaseService();
  }

  async generateKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = (await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )) as globalThis.CryptoKeyPair;

    const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: new Uint8Array(publicKey),
      privateKey: new Uint8Array(privateKey),
      curve: 'Ed25519',
    };
  }

  async sign(privateKey: Uint8Array, data: Uint8Array): Promise<SignatureResult> {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      privateKey,
      { name: 'Ed25519' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('Ed25519', key, data);

    return {
      signature: new Uint8Array(signature),
      publicKey: new Uint8Array(0),
    };
  }

  async signWithKeyPair(keyPair: CryptoKeyPair, data: Uint8Array): Promise<SignatureResult> {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      keyPair.privateKey!,
      { name: 'Ed25519' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('Ed25519', key, data);

    return {
      signature: new Uint8Array(signature),
      publicKey: keyPair.publicKey,
    };
  }

  async verify(publicKey: Uint8Array, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    return crypto.subtle.verify('Ed25519', key, signature, data);
  }

  async publicKeyToMultibase(publicKey: Uint8Array): Promise<string> {
    const bytes = new Uint8Array([0xed, 0x01, ...publicKey]);
    return this.multibase.encode(bytes, 'base58btc');
  }

  async multibaseToPublicKey(multibaseKey: string): Promise<Uint8Array> {
    const bytes = this.multibase.decode(multibaseKey);
    
    if (bytes[0] !== 0xed || bytes[1] !== 0x01) {
      throw new Error('Invalid Ed25519 multibase encoding');
    }

    return bytes.slice(2);
  }

  async createDidKey(publicKey: Uint8Array): Promise<string> {
    const multibaseKey = await this.publicKeyToMultibase(publicKey);
    return `did:key:${multibaseKey}`;
  }

  async fromDidKey(did: string): Promise<CryptoKeyPair> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid did:key format');
    }

    const multibaseKey = did.slice(8);
    const publicKey = await this.multibaseToPublicKey(multibaseKey);

    return {
      publicKey,
      curve: 'Ed25519',
    };
  }

  async fingerprint(publicKey: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', publicKey);
    return this.multibase.encode(new Uint8Array(digest), 'base58btc');
  }
}
