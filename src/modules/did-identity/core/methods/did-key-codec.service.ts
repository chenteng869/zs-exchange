import { DidKeyCodecType, DidKeyEncoded, DidKeyDecoded } from './did-key-types';
import { MultibaseService } from '../crypto';

const CODEC_TABLE: Record<string, { type: DidKeyCodecType; code: number; keyLength: number }> = {
  'Ed25519VerificationKey2020': { type: 'Ed25519VerificationKey2020', code: 0xed, keyLength: 32 },
  'EcdsaSecp256k1VerificationKey2019': { type: 'EcdsaSecp256k1VerificationKey2019', code: 0x03, keyLength: 33 },
};

export class DidKeyCodecService {
  private multibase: MultibaseService;

  constructor() {
    this.multibase = new MultibaseService();
  }

  async encode(
    publicKey: Uint8Array,
    type: DidKeyCodecType,
    privateKey?: Uint8Array
  ): Promise<DidKeyEncoded> {
    const codec = CODEC_TABLE[type];
    if (!codec) {
      throw new Error(`Unsupported codec type: ${type}`);
    }

    const bytes = new Uint8Array([codec.code, 0x01, ...publicKey]);
    const multibase = this.multibase.encode(bytes, 'base58btc');

    return {
      multibase,
      type,
      raw: bytes,
    };
  }

  decode(multibase: string): DidKeyDecoded {
    const bytes = this.multibase.decode(multibase);
    
    if (bytes.length < 3) {
      throw new Error('Invalid did:key encoding');
    }

    const code = bytes[0];
    const format = bytes[1];

    if (format !== 0x01) {
      throw new Error('Unsupported format in did:key');
    }

    const publicKey = bytes.slice(2);

    for (const [, codec] of Object.entries(CODEC_TABLE)) {
      if (codec.code === code) {
        return {
          type: codec.type,
          publicKey,
        };
      }
    }

    throw new Error('Unknown codec type');
  }

  async createDidFromKey(publicKey: Uint8Array, type: DidKeyCodecType): Promise<string> {
    const encoded = await this.encode(publicKey, type);
    return `did:key:${encoded.multibase}`;
  }

  async extractKeyFromDid(did: string): Promise<DidKeyDecoded> {
    if (!did.startsWith('did:key:')) {
      throw new Error('Invalid did:key format');
    }

    const multibase = did.slice(8);
    return this.decode(multibase);
  }

  getCodecTypeFromCode(code: number): DidKeyCodecType | null {
    for (const [, codec] of Object.entries(CODEC_TABLE)) {
      if (codec.code === code) {
        return codec.type;
      }
    }
    return null;
  }

  getCodeFromType(type: DidKeyCodecType): number | null {
    const codec = CODEC_TABLE[type];
    return codec ? codec.code : null;
  }
}