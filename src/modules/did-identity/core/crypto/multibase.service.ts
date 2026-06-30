import { MultibaseCode } from './crypto.types';

const ENCODINGS: Record<MultibaseCode, { prefix: string; alphabet: string }> = {
  base58btc: { prefix: 'z', alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz' },
  base58flickr: { prefix: 'Z', alphabet: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ' },
  base64: { prefix: 'm', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' },
  base64url: { prefix: 'u', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', },
  base16: { prefix: 'f', alphabet: '0123456789abcdef' },
  base32: { prefix: 'b', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' },
  base32hex: { prefix: 'v', alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV' },
  base32z: { prefix: 'h', alphabet: 'ybndrfg8ejkmcpqxot1uwisza345h769' },
  base64pad: { prefix: 'M', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' },
  base64urlpad: { prefix: 'U', alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', },
};

export class MultibaseService {
  encode(data: Uint8Array, code: MultibaseCode = 'base58btc'): string {
    const encoding = ENCODINGS[code];
    if (!encoding) {
      throw new Error(`Unsupported multibase encoding: ${code}`);
    }

    const { prefix, alphabet } = encoding;
    const base = alphabet.length;

    let result = '';
    let value = this.uint8ArrayToBigInt(data);

    if (value === 0n) {
      result = alphabet[0];
    } else {
      while (value > 0n) {
        const remainder = Number(value % BigInt(base));
        result = alphabet[remainder] + result;
        value = value / BigInt(base);
      }
    }

    return prefix + result;
  }

  decode(encoded: string): Uint8Array {
    if (!encoded || encoded.length < 2) {
      throw new Error('Invalid multibase encoded string');
    }

    const prefix = encoded[0];
    const code = this.getCodeFromPrefix(prefix);
    
    if (!code) {
      throw new Error(`Unknown multibase prefix: ${prefix}`);
    }

    const encoding = ENCODINGS[code];
    const { alphabet } = encoding;
    const base = alphabet.length;

    let value = 0n;
    const data = encoded.slice(1);

    for (const char of data) {
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid character in encoded string: ${char}`);
      }
      value = value * BigInt(base) + BigInt(index);
    }

    return this.bigIntToUint8Array(value);
  }

  getCodeFromPrefix(prefix: string): MultibaseCode | null {
    for (const [code, encoding] of Object.entries(ENCODINGS)) {
      if (encoding.prefix === prefix) {
        return code as MultibaseCode;
      }
    }
    return null;
  }

  detectEncoding(encoded: string): MultibaseCode | null {
    if (!encoded || encoded.length < 1) {
      return null;
    }
    return this.getCodeFromPrefix(encoded[0]);
  }

  isBase58btc(encoded: string): boolean {
    return encoded.startsWith('z');
  }

  isBase64(encoded: string): boolean {
    return encoded.startsWith('m') || encoded.startsWith('M');
  }

  isBase16(encoded: string): boolean {
    return encoded.startsWith('f');
  }

  private uint8ArrayToBigInt(data: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < data.length; i++) {
      result = result * 256n + BigInt(data[i]);
    }
    return result;
  }

  private bigIntToUint8Array(value: bigint): Uint8Array {
    if (value === 0n) {
      return new Uint8Array([0]);
    }

    let remaining = value;
    const bytes: number[] = [];

    while (remaining > 0n) {
      bytes.push(Number(remaining % 256n));
      remaining = remaining / 256n;
    }

    bytes.reverse();
    return new Uint8Array(bytes);
  }
}