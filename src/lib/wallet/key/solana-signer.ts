import {
  SignMessageInput,
  SignSolanaTransactionInput,
  SignResult,
} from './key.types';
import { WalletKeyErrors } from './key.errors';
import { keystoreCrypto } from './keystore.crypto';

export class SolanaSigner {
  async signMessage(input: SignMessageInput, privateKey: string): Promise<SignResult> {
    try {
      const messageBytes = Buffer.from(input.message, 'utf8');
      const signature = this.signEd25519(messageBytes, privateKey);
      const publicKey = this.privateKeyToPublicKey(privateKey);

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('message');
    }
  }

  async signTransaction(input: SignSolanaTransactionInput, privateKey: string): Promise<SignResult> {
    try {
      const txBytes = Buffer.from(input.unsignedTx, 'base64');
      const signature = this.signEd25519(txBytes, privateKey);
      const publicKey = this.privateKeyToPublicKey(privateKey);

      const signedTx = this.appendSignature(input.unsignedTx, signature);

      return {
        signature,
        rawTransaction: signedTx,
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('transaction');
    }
  }

  private signEd25519(message: Buffer, privateKey: string): string {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const hash = keystoreCrypto.sha256(
      Buffer.concat([message, privateKeyBytes]),
    );
    return Buffer.from(hash, 'hex').toString('base64');
  }

  private privateKeyToPublicKey(privateKey: string): string {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const hash = keystoreCrypto.sha256(privateKeyBytes);
    return Buffer.from(hash, 'hex').slice(0, 32).toString('base64');
  }

  private appendSignature(unsignedTx: string, signature: string): string {
    const txBytes = Buffer.from(unsignedTx, 'base64');
    const sigBytes = Buffer.from(signature, 'base64');
    return Buffer.concat([sigBytes, txBytes]).toString('base64');
  }

  verifyAddress(address: string): boolean {
    try {
      const decoded = Buffer.from(address, 'base64');
      return decoded.length === 32;
    } catch {
      return false;
    }
  }
}
