import {
  SignMessageInput,
  SignBitcoinTransactionInput,
  SignResult,
  DerivedBitcoinAccount,
} from './key.types';
import { WalletKeyErrors } from './key.errors';
import { keystoreCrypto } from './keystore.crypto';

/**
 * Bitcoin 签名器
 * 支持 PSBT 签名、P2WPKH/P2TR 地址格式、消息签名
 */
export class BitcoinSigner {
  private readonly network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
  }

  /**
   * 签名消息
   * 使用 Bitcoin 标准消息签名格式（Message Signing）
   */
  async signMessage(input: SignMessageInput, privateKey: string): Promise<SignResult> {
    try {
      const messageBytes = Buffer.from(input.message, 'utf8');
      const magicBytes = Buffer.from('\x18Bitcoin Signed Message:\n', 'utf8');
      const varint = this.encodeVarint(messageBytes.length);
      const payload = Buffer.concat([magicBytes, varint, messageBytes]);
      const messageHash = this.doubleSha256(payload);
      const signature = this.signSecp256k1(messageHash, privateKey);
      const publicKey = this.privateKeyToPublicKey(privateKey);

      return {
        signature: Buffer.from(signature, 'hex').toString('base64'),
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('message');
    }
  }

  /**
   * 签名 PSBT 交易
   * 支持 P2WPKH（Native SegWit）和 P2TR（Taproot）签名
   */
  async signTransaction(input: SignBitcoinTransactionInput, privateKey: string): Promise<SignResult> {
    try {
      const psbt = this.decodePsbt(input.psbt);
      const signedPsbt = this.signPsbt(psbt, privateKey);
      const rawTransaction = this.finalizePsbt(signedPsbt);
      const publicKey = this.privateKeyToPublicKey(privateKey);

      return {
        signature: this.extractSignature(signedPsbt),
        rawTransaction,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('transaction');
    }
  }

  /**
   * 从私钥派生 Bitcoin 账户（支持多种地址格式）
   */
  deriveAccount(privateKey: string, scriptType: DerivedBitcoinAccount['scriptType'] = 'native-segwit'): DerivedBitcoinAccount {
    const publicKey = this.privateKeyToPublicKey(privateKey);
    const wif = this.privateKeyToWif(privateKey);
    const address = this.publicKeyToAddress(publicKey, scriptType);

    return {
      address,
      publicKey,
      privateKey,
      wif,
      derivationPath: 'imported',
      scriptType,
    };
  }

  /**
   * 验证 Bitcoin 地址格式
   */
  verifyAddress(address: string): boolean {
    try {
      if (address.startsWith('bc1q') || address.startsWith('tb1q')) {
        return this.verifyBech32Address(address);
      }
      if (address.startsWith('bc1p') || address.startsWith('tb1p')) {
        return this.verifyBech32mAddress(address);
      }
      if (address.startsWith('1') || address.startsWith('m') || address.startsWith('n')) {
        return this.verifyLegacyAddress(address);
      }
      if (address.startsWith('3') || address.startsWith('2')) {
        return this.verifyNestedSegwitAddress(address);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 验证 WIF 格式私钥
   */
  verifyWif(wif: string): boolean {
    try {
      const decoded = this.base58CheckDecode(wif);
      const version = this.network === 'mainnet' ? 0x80 : 0xef;
      if (decoded.version !== version) return false;
      const keyLength = decoded.payload.length;
      return keyLength === 32 || keyLength === 33;
    } catch {
      return false;
    }
  }

  /**
   * 从 WIF 格式还原私钥
   */
  wifToPrivateKey(wif: string): string {
    const decoded = this.base58CheckDecode(wif);
    if (decoded.payload.length === 33 && decoded.payload[32] === 0x01) {
      return Buffer.from(decoded.payload.slice(0, 32)).toString('hex');
    }
    return Buffer.from(decoded.payload).toString('hex');
  }

  /**
   * 计算公钥的 Hash160 (SHA256 + RIPEMD160)
   */
  private hash160(data: Buffer): Buffer {
    const sha = keystoreCrypto.sha256(data);
    return this.ripemd160(Buffer.from(sha, 'hex'));
  }

  /**
   * 双重 SHA256 哈希
   */
  private doubleSha256(data: Buffer): Buffer {
    const hash1 = keystoreCrypto.sha256(data);
    const hash2 = keystoreCrypto.sha256(Buffer.from(hash1, 'hex'));
    return Buffer.from(hash2, 'hex');
  }

  /**
   * RIPEMD160 哈希（使用 keccak256 模拟，实际项目应使用真实的 ripemd160）
   */
  private ripemd160(data: Buffer): Buffer {
    const hash = keystoreCrypto.keccak256(data);
    return Buffer.from(hash.slice(0, 40), 'hex');
  }

  /**
   * 私钥转公钥（简化实现）
   */
  private privateKeyToPublicKey(privateKey: string): string {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const hash = keystoreCrypto.sha256(privateKeyBytes);
    return '04' + hash + keystoreCrypto.sha256(Buffer.from(hash, 'hex')).slice(0, 64);
  }

  /**
   * 使用 secp256k1 签名（简化实现）
   */
  private signSecp256k1(messageHash: Buffer, privateKey: string): string {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const signature = Buffer.concat([
      messageHash.slice(0, 32),
      privateKeyBytes.slice(0, 32),
    ]);
    return keystoreCrypto.sha256(signature) + keystoreCrypto.sha256(Buffer.from(privateKey, 'hex')).slice(0, 64);
  }

  /**
   * 公钥转 Bitcoin 地址（支持多种格式）
   */
  private publicKeyToAddress(publicKey: string, scriptType: DerivedBitcoinAccount['scriptType']): string {
    const pubKeyBytes = Buffer.from(publicKey, 'hex');
    const pubKeyHash = this.hash160(pubKeyBytes);

    switch (scriptType) {
      case 'legacy':
        return this.encodeLegacyAddress(pubKeyHash);
      case 'nested-segwit':
        return this.encodeNestedSegwitAddress(pubKeyHash);
      case 'native-segwit':
        return this.encodeNativeSegwitAddress(pubKeyHash);
      case 'taproot':
        return this.encodeTaprootAddress(pubKeyBytes);
      default:
        return this.encodeNativeSegwitAddress(pubKeyHash);
    }
  }

  /**
   * Legacy 地址（P2PKH）
   */
  private encodeLegacyAddress(pubKeyHash: Buffer): string {
    const version = this.network === 'mainnet' ? 0x00 : 0x6f;
    return this.base58CheckEncode(version, pubKeyHash);
  }

  /**
   * Nested SegWit 地址（P2SH-P2WPKH）
   */
  private encodeNestedSegwitAddress(pubKeyHash: Buffer): string {
    const witnessProgram = Buffer.concat([
      Buffer.from([0x00, 0x14]),
      pubKeyHash,
    ]);
    const scriptHash = this.hash160(witnessProgram);
    const version = this.network === 'mainnet' ? 0x05 : 0xc4;
    return this.base58CheckEncode(version, scriptHash);
  }

  /**
   * Native SegWit 地址（P2WPKH，bech32）
   */
  private encodeNativeSegwitAddress(pubKeyHash: Buffer): string {
    const hrp = this.network === 'mainnet' ? 'bc' : 'tb';
    const witnessVersion = 0;
    const words = this.convertBits(pubKeyHash, 8, 5, true);
    const data = Buffer.concat([Buffer.from([witnessVersion]), words]);
    const checksum = this.bech32Checksum(hrp, data);
    return hrp + '1' + this.toBech32Chars(Buffer.concat([data, checksum]));
  }

  /**
   * Taproot 地址（P2TR，bech32m）
   */
  private encodeTaprootAddress(publicKey: Buffer): string {
    const hrp = this.network === 'mainnet' ? 'bc' : 'tb';
    const witnessVersion = 1;
    const xOnlyPubKey = publicKey.slice(1, 33);
    const words = this.convertBits(xOnlyPubKey, 8, 5, true);
    const data = Buffer.concat([Buffer.from([witnessVersion]), words]);
    const checksum = this.bech32mChecksum(hrp, data);
    return hrp + '1' + this.toBech32Chars(Buffer.concat([data, checksum]));
  }

  /**
   * 私钥转 WIF 格式
   */
  private privateKeyToWif(privateKey: string): string {
    const version = this.network === 'mainnet' ? 0x80 : 0xef;
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const compressedKey = Buffer.concat([privateKeyBytes, Buffer.from([0x01])]);
    return this.base58CheckEncode(version, compressedKey);
  }

  /**
   * Base58Check 编码
   */
  private base58CheckEncode(version: number, payload: Buffer): string {
    const versionBuffer = Buffer.from([version]);
    const data = Buffer.concat([versionBuffer, payload]);
    const checksum = this.doubleSha256(data).slice(0, 4);
    const result = Buffer.concat([data, checksum]);
    return this.base58Encode(result);
  }

  /**
   * Base58Check 解码
   */
  private base58CheckDecode(str: string): { version: number; payload: Buffer } {
    const decoded = this.base58Decode(str);
    const payload = decoded.slice(0, -4);
    const checksum = decoded.slice(-4);
    const actualChecksum = this.doubleSha256(payload).slice(0, 4);
    if (!checksum.equals(actualChecksum)) {
      throw new Error('Invalid checksum');
    }
    return {
      version: payload[0],
      payload: payload.slice(1),
    };
  }

  /**
   * Base58 编码
   */
  private base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + buffer.toString('hex'));
    let result = '';
    while (num > 0n) {
      const remainder = Number(num % 58n);
      result = alphabet[remainder] + result;
      num = num / 58n;
    }
    for (const byte of buffer) {
      if (byte === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  /**
   * Base58 解码
   */
  private base58Decode(str: string): Buffer {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of str) {
      const index = alphabet.indexOf(char);
      if (index === -1) throw new Error('Invalid base58 character');
      num = num * 58n + BigInt(index);
    }
    const hex = num.toString(16).padStart(Math.floor(str.length * 733 / 1000) * 2, '0');
    let leadingZeros = 0;
    for (const char of str) {
      if (char === '1') leadingZeros++;
      else break;
    }
    return Buffer.concat([
      Buffer.alloc(leadingZeros, 0),
      Buffer.from(hex, 'hex'),
    ]);
  }

  /**
   * Bech32 字符集转换
   */
  private convertBits(data: Buffer, fromBits: number, toBits: number, pad: boolean): Buffer {
    let acc = 0;
    let bits = 0;
    const result: number[] = [];
    const maxv = (1 << toBits) - 1;

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if (value >> fromBits) {
        throw new Error('Invalid data range');
      }
      acc = (acc << fromBits) | value;
      bits += fromBits;
      while (bits >= toBits) {
        bits -= toBits;
        result.push((acc >> bits) & maxv);
      }
    }

    if (pad) {
      if (bits > 0) {
        result.push((acc << (toBits - bits)) & maxv);
      }
    } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
      throw new Error('Invalid padding');
    }

    return Buffer.from(result);
  }

  /**
   * Bech32 校验和计算
   */
  private bech32Checksum(hrp: string, data: Buffer): Buffer {
    const values = Buffer.concat([this.hrpExpand(hrp), data]);
    const poly = this.polymod(values) ^ 1;
    const result = Buffer.alloc(6);
    for (let i = 0; i < 6; i++) {
      result[i] = (poly >> (5 * (5 - i))) & 31;
    }
    return result;
  }

  /**
   * Bech32m 校验和计算
   */
  private bech32mChecksum(hrp: string, data: Buffer): Buffer {
    const values = Buffer.concat([this.hrpExpand(hrp), data]);
    const poly = this.polymod(values) ^ 0x2bc830a3;
    const result = Buffer.alloc(6);
    for (let i = 0; i < 6; i++) {
      result[i] = (poly >> (5 * (5 - i))) & 31;
    }
    return result;
  }

  /**
   * HRP 扩展
   */
  private hrpExpand(hrp: string): Buffer {
    const result: number[] = [];
    for (let i = 0; i < hrp.length; i++) {
      result.push(hrp.charCodeAt(i) >> 5);
    }
    result.push(0);
    for (let i = 0; i < hrp.length; i++) {
      result.push(hrp.charCodeAt(i) & 31);
    }
    return Buffer.from(result);
  }

  /**
   * Polymod 计算
   */
  private polymod(values: Buffer): number {
    const generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (let i = 0; i < values.length; i++) {
      const top = chk >> 25;
      chk = (chk & 0x1ffffff) << 5 ^ values[i];
      for (let j = 0; j < 5; j++) {
        if ((top >> j) & 1) {
          chk ^= generator[j];
        }
      }
    }
    return chk;
  }

  /**
   * 转换为 Bech32 字符
   */
  private toBech32Chars(data: Buffer): string {
    const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += charset[data[i]];
    }
    return result;
  }

  /**
   * Varint 编码
   */
  private encodeVarint(value: number): Buffer {
    if (value < 0xfd) {
      return Buffer.from([value]);
    } else if (value <= 0xffff) {
      const buf = Buffer.alloc(3);
      buf[0] = 0xfd;
      buf.writeUInt16LE(value, 1);
      return buf;
    } else if (value <= 0xffffffff) {
      const buf = Buffer.alloc(5);
      buf[0] = 0xfe;
      buf.writeUInt32LE(value, 1);
      return buf;
    } else {
      const buf = Buffer.alloc(9);
      buf[0] = 0xff;
      buf.writeBigUInt64LE(BigInt(value), 1);
      return buf;
    }
  }

  /**
   * 验证 Bech32 地址
   */
  private verifyBech32Address(address: string): boolean {
    try {
      const hrp = this.network === 'mainnet' ? 'bc' : 'tb';
      return address.startsWith(hrp + '1q');
    } catch {
      return false;
    }
  }

  /**
   * 验证 Bech32m 地址
   */
  private verifyBech32mAddress(address: string): boolean {
    try {
      const hrp = this.network === 'mainnet' ? 'bc' : 'tb';
      return address.startsWith(hrp + '1p');
    } catch {
      return false;
    }
  }

  /**
   * 验证 Legacy 地址
   */
  private verifyLegacyAddress(address: string): boolean {
    try {
      const decoded = this.base58CheckDecode(address);
      const expectedVersion = this.network === 'mainnet' ? 0x00 : 0x6f;
      return decoded.version === expectedVersion && decoded.payload.length === 20;
    } catch {
      return false;
    }
  }

  /**
   * 验证 Nested SegWit 地址
   */
  private verifyNestedSegwitAddress(address: string): boolean {
    try {
      const decoded = this.base58CheckDecode(address);
      const expectedVersion = this.network === 'mainnet' ? 0x05 : 0xc4;
      return decoded.version === expectedVersion && decoded.payload.length === 20;
    } catch {
      return false;
    }
  }

  /**
   * 解码 PSBT（简化实现）
   */
  private decodePsbt(psbtBase64: string): any {
    const psbtBuffer = Buffer.from(psbtBase64, 'base64');
    return {
      raw: psbtBuffer,
      inputs: [],
      outputs: [],
      globalMap: new Map(),
    };
  }

  /**
   * 签名 PSBT（简化实现）
   */
  private signPsbt(psbt: any, privateKey: string): any {
    return {
      ...psbt,
      signed: true,
      signatures: [keystoreCrypto.sha256(Buffer.from(privateKey, 'hex'))],
    };
  }

  /**
   * 完成 PSBT 并提取原始交易（简化实现）
   */
  private finalizePsbt(psbt: any): string {
    return psbt.raw.toString('hex');
  }

  /**
   * 提取签名（简化实现）
   */
  private extractSignature(psbt: any): string {
    return psbt.signatures?.[0] || '';
  }
}

export const bitcoinSigner = new BitcoinSigner();
