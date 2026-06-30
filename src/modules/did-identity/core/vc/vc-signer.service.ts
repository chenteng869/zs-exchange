import { privateKeyToAccount } from 'viem/accounts';
import { sign, verify } from '@noble/ed25519';
import type { VcSigningInput, VcSigningResult, VcProof, SigningAlgorithm, ProofType } from './vc-signing.types';
import { SigningError } from './vc-issue.errors';

export class VcSignerService {
  async sign(input: VcSigningInput): Promise<VcSigningResult> {
    try {
      const { credential, privateKey, algorithm, proofType, verificationMethod } = input;

      const created = new Date().toISOString();
      const proof: VcProof = {
        type: proofType,
        created,
        proofPurpose: 'assertionMethod',
        verificationMethod,
      };

      let signature: string;

      switch (algorithm) {
        case 'ES256K':
          signature = await this.signES256K(JSON.stringify(credential), privateKey);
          break;
        case 'EdDSA':
          signature = await this.signEdDSA(JSON.stringify(credential), privateKey);
          break;
        default:
          throw new SigningError(`Unsupported signing algorithm: ${algorithm}`);
      }

      proof.signature = signature;

      if (proofType === 'JsonWebSignature2020') {
        proof.jws = signature;
      }

      return {
        success: true,
        proof,
        signedCredential: {
          ...(typeof credential === 'object' && credential !== null ? credential : { value: credential }),
          proof,
        },
        signature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signing failed',
      };
    }
  }

  async verify(credential: unknown, proof: VcProof): Promise<boolean> {
    try {
      const { type, verificationMethod, signature } = proof;

      if (!signature) {
        return false;
      }

      const credentialData = JSON.stringify(credential);

      if (type === 'EcdsaSecp256k1Signature2019' || type === 'JsonWebSignature2020') {
        return this.verifyES256K(credentialData, signature, verificationMethod);
      }

      if (type === 'Ed25519Signature2020') {
        return this.verifyEdDSA(credentialData, signature, verificationMethod);
      }

      return false;
    } catch {
      return false;
    }
  }

  private async signES256K(data: string, privateKey: string): Promise<string> {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const signature = await account.signMessage({
      message: data,
    });
    return signature;
  }

  private async signEdDSA(data: string, privateKey: string): Promise<string> {
    const privateKeyBytes = Buffer.from(privateKey.replace('0x', ''), 'hex');
    const messageBytes = new TextEncoder().encode(data);
    const signatureBytes = await sign(messageBytes, privateKeyBytes);
    return `0x${Buffer.from(signatureBytes).toString('hex')}`;
  }

  private async verifyES256K(data: string, signature: string, verificationMethod: string): Promise<boolean> {
    try {
      const publicKey = this.extractPublicKeyFromVerificationMethod(verificationMethod);
      const recoveredAddress = this.recoverAddress(data, signature);
      return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
    } catch {
      return false;
    }
  }

  private async verifyEdDSA(data: string, signature: string, verificationMethod: string): Promise<boolean> {
    try {
      const publicKey = this.extractPublicKeyFromVerificationMethod(verificationMethod);
      const publicKeyBytes = Buffer.from(publicKey.replace('0x', ''), 'hex');
      const signatureBytes = Buffer.from(signature.replace('0x', ''), 'hex');
      const messageBytes = new TextEncoder().encode(data);
      return await verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  private extractPublicKeyFromVerificationMethod(verificationMethod: string): string {
    const match = verificationMethod.match(/(0x[a-fA-F0-9]+)$/);
    if (match) {
      return match[1];
    }
    return verificationMethod;
  }

  private recoverAddress(data: string, signature: string): string {
    return '0x0000000000000000000000000000000000000000';
  }

  getAlgorithmForProofType(proofType: ProofType): SigningAlgorithm {
    switch (proofType) {
      case 'EcdsaSecp256k1Signature2019':
      case 'JsonWebSignature2020':
        return 'ES256K';
      case 'Ed25519Signature2020':
        return 'EdDSA';
      default:
        return 'ES256K';
    }
  }
}
