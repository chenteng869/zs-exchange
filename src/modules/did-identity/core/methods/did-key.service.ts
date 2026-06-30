import { Did, DidDocument, VerificationMethod } from '@/modules/did-identity/shared/types';
import { DidKeyCodecService } from './did-key-codec.service';
import { Ed25519KeyService, Secp256k1KeyService } from '../crypto';

export class DidKeyService {
  private codec: DidKeyCodecService;
  private ed25519: Ed25519KeyService;
  private secp256k1: Secp256k1KeyService;

  constructor() {
    this.codec = new DidKeyCodecService();
    this.ed25519 = new Ed25519KeyService();
    this.secp256k1 = new Secp256k1KeyService();
  }

  async generateEd25519(): Promise<{ did: Did; document: DidDocument; keyPair: { publicKey: Uint8Array; privateKey: Uint8Array } }> {
    const keyPair = await this.ed25519.generateKeyPair();
    const did = await this.codec.createDidFromKey(keyPair.publicKey, 'Ed25519VerificationKey2020');
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#key-0`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyBase58: this.toBase58(keyPair.publicKey),
    };

    const document: DidDocument = {
      id: did as Did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#key-0`],
      assertionMethod: [`${did}#key-0`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    return {
      did: did as Did,
      document,
      keyPair: {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey!,
      },
    };
  }

  async generateSecp256k1(): Promise<{ did: Did; document: DidDocument; keyPair: { publicKey: Uint8Array; privateKey: Uint8Array } }> {
    const keyPair = await this.secp256k1.generateKeyPair();
    const did = await this.codec.createDidFromKey(keyPair.publicKey, 'EcdsaSecp256k1VerificationKey2019');
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#key-0`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      controller: did,
      publicKeyBase58: this.toBase58(keyPair.publicKey),
    };

    const document: DidDocument = {
      id: did as Did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#key-0`],
      assertionMethod: [`${did}#key-0`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    return {
      did: did as Did,
      document,
      keyPair: {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey!,
      },
    };
  }

  async resolve(did: Did): Promise<DidDocument> {
    const decoded = await this.codec.extractKeyFromDid(did);
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#key-0`,
      type: decoded.type,
      controller: did,
      publicKeyBase58: this.toBase58(decoded.publicKey),
    };

    return {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#key-0`],
      assertionMethod: [`${did}#key-0`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };
  }

  async sign(did: Did, privateKey: Uint8Array, data: Uint8Array): Promise<string> {
    const decoded = await this.codec.extractKeyFromDid(did);
    
    let result;
    if (decoded.type === 'Ed25519VerificationKey2020') {
      result = await this.ed25519.sign(privateKey, data);
    } else {
      result = await this.secp256k1.sign(privateKey, data);
    }

    return this.toBase58(result.signature);
  }

  async verify(did: Did, publicKey: Uint8Array, data: Uint8Array, signature: string): Promise<boolean> {
    const decoded = await this.codec.extractKeyFromDid(did);
    const signatureBytes = this.fromBase58(signature);
    
    if (decoded.type === 'Ed25519VerificationKey2020') {
      return this.ed25519.verify(publicKey, data, signatureBytes);
    } else {
      return this.secp256k1.verify(publicKey, data, signatureBytes);
    }
  }

  private toBase58(bytes: Uint8Array): string {
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

  private fromBase58(base58: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = 0n;

    for (const char of base58) {
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid base58 character: ${char}`);
      }
      value = value * 58n + BigInt(index);
    }

    const length = Math.max(1, Math.ceil(Number(value.toString(2)) / 8));
    const result = new Uint8Array(length);

    let remaining = value;
    for (let i = length - 1; i >= 0; i--) {
      result[i] = Number(remaining % 256n);
      remaining = remaining / 256n;
    }

    return result;
  }
}