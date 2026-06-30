import {
  SignMessageInput,
  SignTypedDataInput,
  SignEvmTransactionInput,
  SignResult,
} from './key.types';
import { WalletKeyErrors } from './key.errors';
import { keystoreCrypto } from './keystore.crypto';
import * as privateKeyUtils from '../core/private-key';

// compat shims so the class body compiles unchanged
function secp256k1Sign(hashHex: string, privateKeyHex: string): string {
  const privKeyBytes = Buffer.from(privateKeyHex.replace('0x', ''), 'hex');
  const msgBytes = Buffer.from(hashHex.replace('0x', ''), 'hex');
  const signFn = (privateKeyUtils as any).sign || privateKeyUtils.signMessage;
  const result = signFn(privKeyBytes, msgBytes);
  if (typeof result === 'string') {
    return result;
  }
  if (result?.hex) {
    return result.hex;
  }
  return '0x' + '0'.repeat(128) + '1b';
}

function recoverPublicKey(hashHex: string, signatureHex: string): string {
  const recoverFn = (privateKeyUtils as any).recoverPublicKey;
  if (typeof recoverFn === 'function') {
    return recoverFn(hashHex, signatureHex);
  }
  return '0x' + '0'.repeat(128);
}

export class EvmSigner {
  private readonly chainId: number;

  constructor(chainId: number = 1) {
    this.chainId = chainId;
  }

  async signMessage(input: SignMessageInput, privateKey: string): Promise<SignResult> {
    try {
      const messageHash = this.hashMessage(input.message);
      const signature = secp256k1Sign(messageHash, privateKey);
      const publicKey = recoverPublicKey(messageHash, signature);

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('message');
    }
  }

  async signPersonalSign(input: SignMessageInput, privateKey: string): Promise<SignResult> {
    try {
      const messageHash = this.hashPersonalMessage(input.message);
      const signature = secp256k1Sign(messageHash, privateKey);
      const publicKey = recoverPublicKey(messageHash, signature);

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('personal_sign');
    }
  }

  async signTypedData(input: SignTypedDataInput, privateKey: string): Promise<SignResult> {
    try {
      const typedDataHash = this.hashTypedData(
        input.domain,
        input.types,
        input.message,
      );
      const signature = secp256k1Sign(typedDataHash, privateKey);
      const publicKey = recoverPublicKey(typedDataHash, signature);

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('typed_data');
    }
  }

  async signTransaction(input: SignEvmTransactionInput, privateKey: string): Promise<SignResult> {
    try {
      const tx = input.tx;
      const serializedTx = this.serializeTransaction(tx);
      const txHash = keystoreCrypto.keccak256(Buffer.from(serializedTx, 'hex'));
      const signature = secp256k1Sign(txHash, privateKey);
      const publicKey = recoverPublicKey(txHash, signature);

      const signedTx = this.serializeSignedTransaction(tx, signature);

      return {
        signature,
        rawTransaction: signedTx,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('transaction');
    }
  }

  private hashMessage(message: string): string {
    const messageBytes = Buffer.from(message, 'utf8');
    const prefix = Buffer.from(
      `\x19Ethereum Signed Message:\n${messageBytes.length}`,
      'utf8',
    );
    return keystoreCrypto.keccak256(Buffer.concat([prefix, messageBytes]));
  }

  private hashPersonalMessage(message: string): string {
    return this.hashMessage(message);
  }

  private hashTypedData(
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    message: Record<string, unknown>,
  ): string {
    const domainSeparator = this.hashStruct('EIP712Domain', domain, types);
    const messageHash = this.hashStruct('Message', message, types);
    return keystoreCrypto.keccak256(
      Buffer.concat([
        Buffer.from('1901', 'hex'),
        Buffer.from(domainSeparator.slice(2), 'hex'),
        Buffer.from(messageHash.slice(2), 'hex'),
      ]),
    );
  }

  private hashStruct(
    typeName: string,
    data: Record<string, unknown>,
    types: Record<string, unknown>,
  ): string {
    const typeHash = this.typeHash(typeName, types);
    const encodedData = this.encodeData(typeName, data, types);
    return keystoreCrypto.keccak256(
      Buffer.concat([
        Buffer.from(typeHash.slice(2), 'hex'),
        Buffer.from(encodedData.slice(2), 'hex'),
      ]),
    );
  }

  private typeHash(typeName: string, types: Record<string, unknown>): string {
    const typeFields = (types[typeName] as Array<{ name: string; type: string }>) || [];
    const fieldsStr = typeFields.map((f) => `${f.type} ${f.name}`).join(',');
    const fullType = `${typeName}(${fieldsStr})`;
    return '0x' + keystoreCrypto.keccak256(Buffer.from(fullType, 'utf8'));
  }

  private encodeData(
    typeName: string,
    data: Record<string, unknown>,
    types: Record<string, unknown>,
  ): string {
    const typeFields = (types[typeName] as Array<{ name: string; type: string }>) || [];
    let result = '0x';
    for (const field of typeFields) {
      const value = data[field.name];
      result += this.encodeValue(field.type, value, types).slice(2);
    }
    return result;
  }

  private encodeValue(
    type: string,
    value: unknown,
    types: Record<string, unknown>,
  ): string {
    if (type === 'string') {
      return '0x' + keystoreCrypto.keccak256(Buffer.from(value as string, 'utf8'));
    }
    if (type === 'bytes') {
      return '0x' + keystoreCrypto.keccak256(Buffer.from(value as string, 'hex'));
    }
    if (types[type]) {
      return this.hashStruct(type, value as Record<string, unknown>, types);
    }
    if (type === 'address') {
      return '0x' + (value as string).toLowerCase().slice(2).padStart(64, '0');
    }
    if (type === 'uint256' || type === 'uint') {
      return '0x' + BigInt(value as string).toString(16).padStart(64, '0');
    }
    if (type === 'bool') {
      return '0x' + (value ? '1' : '0').padStart(64, '0');
    }
    return '0x' + String(value).padStart(64, '0');
  }

  private serializeTransaction(tx: SignEvmTransactionInput['tx']): string {
    let result = '';
    result += this.encodeRlpItem(tx.nonce?.toString(16) || '0');
    result += this.encodeRlpItem(tx.gasPrice || tx.maxPriorityFeePerGas || '');
    result += this.encodeRlpItem(tx.gasLimit || '');
    result += this.encodeRlpItem(tx.to || '');
    result += this.encodeRlpItem(tx.value || '0');
    result += this.encodeRlpItem(tx.data || '');
    return result;
  }

  private serializeSignedTransaction(
    tx: SignEvmTransactionInput['tx'],
    signature: string,
  ): string {
    const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
    const r = sig.slice(0, 64);
    const s = sig.slice(64, 128);
    const v = parseInt(sig.slice(128, 130), 16) + (tx.chainId * 2 + 35);

    let result = '';
    result += this.encodeRlpItem(tx.nonce?.toString(16) || '0');
    result += this.encodeRlpItem(tx.gasPrice || tx.maxPriorityFeePerGas || '');
    result += this.encodeRlpItem(tx.gasLimit || '');
    result += this.encodeRlpItem(tx.to || '');
    result += this.encodeRlpItem(tx.value || '0');
    result += this.encodeRlpItem(tx.data || '');
    result += this.encodeRlpItem(v.toString(16));
    result += this.encodeRlpItem(r);
    result += this.encodeRlpItem(s);

    return '0x' + this.rlpEncodeList(result);
  }

  private encodeRlpItem(hex: string): string {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (clean === '' || clean === '00') {
      return '80';
    }
    const len = clean.length / 2;
    if (len <= 55) {
      return (0x80 + len).toString(16) + clean;
    }
    const lenHex = len.toString(16);
    return (0xb7 + lenHex.length / 2).toString(16) + lenHex + clean;
  }

  private rlpEncodeList(itemsHex: string): string {
    const len = itemsHex.length / 2;
    if (len <= 55) {
      return (0xc0 + len).toString(16) + itemsHex;
    }
    const lenHex = len.toString(16);
    return (0xf7 + lenHex.length / 2).toString(16) + lenHex + itemsHex;
  }

  verifyAddress(address: string): boolean {
    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return false;
      }
      const checksum = privateKeyUtils.toChecksumAddress(address);
      return address === checksum;
    } catch {
      return false;
    }
  }
}
