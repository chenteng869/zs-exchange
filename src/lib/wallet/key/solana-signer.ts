import {
  SignMessageInput,
  SignSolanaTransactionInput,
  SignResult,
} from './key.types';
import { WalletKeyErrors } from './key.errors';
import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { sign } from '@noble/ed25519';
import bs58 from 'bs58';

export class SolanaSigner {
  async signMessage(input: SignMessageInput, privateKey: string): Promise<SignResult> {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      const messageBytes = Buffer.from(input.message, 'utf8');
      const signature = sign(messageBytes, keypair.secretKey.slice(0, 32));
      const publicKey = keypair.publicKey.toBase58();

      return {
        signature: bs58.encode(Buffer.from(signature)),
        publicKey,
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('message');
    }
  }

  async signTransaction(input: SignSolanaTransactionInput, privateKey: string): Promise<SignResult> {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      
      const txBytes = Buffer.from(input.unsignedTx, 'base64');
      
      let signedTransaction: Transaction | VersionedTransaction;
      let serialized: Buffer;
      
      try {
        signedTransaction = VersionedTransaction.deserialize(txBytes);
        signedTransaction.sign([keypair]);
        serialized = Buffer.from(signedTransaction.serialize());
      } catch {
        const legacyTx = Transaction.from(txBytes);
        legacyTx.sign(keypair);
        signedTransaction = legacyTx;
        serialized = Buffer.from(legacyTx.serialize());
      }

      return {
        signature: bs58.encode(serialized.slice(0, 64)),
        rawTransaction: serialized.toString('base64'),
        publicKey: keypair.publicKey.toBase58(),
      };
    } catch (error) {
      throw WalletKeyErrors.UNSUPPORTED_SIGN_TYPE('transaction');
    }
  }

  verifyAddress(address: string): boolean {
    try {
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
    };
  }
}
