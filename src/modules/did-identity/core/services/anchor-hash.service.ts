import { DidDocument, AnchorOptions, AnchorResult } from '@/modules/did-identity/shared/types';
import { AnchorFailedError } from '@/modules/did-identity/shared/errors';

export class AnchorHashService {
  async computeDocumentHash(document: DidDocument, options?: AnchorOptions): Promise<string> {
    const canonical = await this.canonicalize(document);
    const hash = await this.hash(canonical, options?.algorithm || 'keccak256');
    return hash;
  }

  async computeCredentialHash(credential: unknown, options?: AnchorOptions): Promise<string> {
    const canonical = await this.canonicalize(credential);
    const hash = await this.hash(canonical, options?.algorithm || 'keccak256');
    return hash;
  }

  async canonicalize(obj: unknown): Promise<string> {
    return JSON.stringify(obj, Object.keys(obj as object).sort());
  }

  async hash(data: string, algorithm: string): Promise<string> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);

    switch (algorithm.toLowerCase()) {
      case 'keccak256':
        return this.keccak256(bytes);
      case 'sha256':
        return this.sha256(bytes);
      case 'sha3-256':
        return this.sha3_256(bytes);
      default:
        throw new AnchorFailedError('', '', { error: `Unsupported hash algorithm: ${algorithm}` });
    }
  }

  async keccak256(bytes: Uint8Array): Promise<string> {
    try {
      const { Keccak } = await import('keccak');
      const hash = new Keccak(256);
      hash.update(bytes);
      return `0x${hash.digest('hex')}`;
    } catch {
      throw new AnchorFailedError('', '', { error: 'Keccak library not available' });
    }
  }

  async sha256(bytes: Uint8Array): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
    } catch {
      throw new AnchorFailedError('', '', { error: 'SHA-256 not available' });
    }
  }

  async sha3_256(bytes: Uint8Array): Promise<string> {
    try {
      const { Keccak } = await import('keccak');
      const hash = new Keccak(256);
      hash.update(bytes);
      return `0x${hash.digest('hex')}`;
    } catch {
      throw new AnchorFailedError('', '', { error: 'SHA3 library not available' });
    }
  }

  async createAnchorRecord(
    did: string,
    document: DidDocument,
    options?: AnchorOptions
  ): Promise<AnchorResult> {
    const hash = await this.computeDocumentHash(document, options);
    const timestamp = new Date().toISOString();
    const chainId = options?.chainId || 'eip155:1';

    return {
      did,
      hash,
      chainId,
      timestamp,
      status: 'pending',
      blockNumber: null,
      transactionHash: null,
    };
  }

  async verifyAnchorHash(document: DidDocument, expectedHash: string): Promise<boolean> {
    const computedHash = await this.computeDocumentHash(document);
    return computedHash === expectedHash;
  }
}
