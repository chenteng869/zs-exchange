import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export type SolanaSignerProviderType = 'local' | 'kms';

export interface ResolveSolanaKeypairInput {
  requestId?: string;
  did?: string;
  keyRef?: string;
  privateKey?: string;
}

export interface ResolveSolanaKeypairResult {
  keypair: Keypair;
  keyId: string;
  provider: SolanaSignerProviderType;
}

export interface SolanaSignerProvider {
  provider: SolanaSignerProviderType;
  resolveKeypair(input: ResolveSolanaKeypairInput): Promise<ResolveSolanaKeypairResult>;
}

export type KmsSignerErrorCode =
  | 'KMS_UNCONFIGURED'
  | 'KMS_REQUEST_FAILED'
  | 'KMS_TIMEOUT'
  | 'KMS_UNAUTHORIZED'
  | 'KMS_FORBIDDEN'
  | 'KMS_NOT_FOUND'
  | 'KMS_PAYLOAD_INVALID'
  | 'KMS_RESPONSE_INVALID';

export class KmsSignerError extends Error {
  code: KmsSignerErrorCode;
  status?: number;
  requestId?: string;

  constructor(message: string, code: KmsSignerErrorCode, status?: number, requestId?: string) {
    super(message);
    this.name = 'KmsSignerError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

interface KmsResolveKeyResponse {
  success?: boolean;
  data?: {
    privateKeyBase58?: string;
    keyId?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

class LocalSolanaSignerProvider implements SolanaSignerProvider {
  provider: SolanaSignerProviderType = 'local';

  async resolveKeypair(input: ResolveSolanaKeypairInput): Promise<ResolveSolanaKeypairResult> {
    const privateKey = input.privateKey || process.env.DID_SOLANA_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Local signer missing private key. Provide privateKey or DID_SOLANA_PRIVATE_KEY for non-production usage.');
    }

    let keypair: Keypair;
    try {
      keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    } catch {
      throw new Error('Invalid Solana private key format for local signer. Expected base58 encoded secret key.');
    }

    return {
      keypair,
      keyId: input.keyRef || `did-sol:${keypair.publicKey.toBase58()}`,
      provider: this.provider,
    };
  }
}

class KmsSolanaSignerProvider implements SolanaSignerProvider {
  provider: SolanaSignerProviderType = 'kms';

  private endpoint: string;
  private authToken: string;
  private timeoutMs: number;

  constructor() {
    this.endpoint = String(process.env.DID_SOLANA_KMS_ENDPOINT || '').trim();
    this.authToken = String(process.env.DID_SOLANA_KMS_AUTH_TOKEN || '').trim();
    this.timeoutMs = Number(process.env.DID_SOLANA_KMS_TIMEOUT_MS || 8000);
  }

  private mapStatusToCode(status?: number): KmsSignerErrorCode {
    if (status === 401) return 'KMS_UNAUTHORIZED';
    if (status === 403) return 'KMS_FORBIDDEN';
    if (status === 404) return 'KMS_NOT_FOUND';
    if (status === 400 || status === 422) return 'KMS_PAYLOAD_INVALID';
    return 'KMS_REQUEST_FAILED';
  }

  private parsePrivateKey(payload: KmsResolveKeyResponse, requestId?: string): { privateKeyBase58: string; keyId: string } {
    const privateKeyBase58 = payload?.data?.privateKeyBase58;
    if (!privateKeyBase58) {
      throw new KmsSignerError('KMS response missing data.privateKeyBase58', 'KMS_RESPONSE_INVALID', undefined, requestId);
    }

    return {
      privateKeyBase58,
      keyId: payload?.data?.keyId || 'kms-key',
    };
  }

  async resolveKeypair(input: ResolveSolanaKeypairInput): Promise<ResolveSolanaKeypairResult> {
    if (!this.endpoint) {
      throw new KmsSignerError(
        'KMS signer endpoint is not configured. Set DID_SOLANA_KMS_ENDPOINT.',
        'KMS_UNCONFIGURED',
        undefined,
        input.requestId,
      );
    }

    if (!this.authToken) {
      throw new KmsSignerError(
        'KMS signer auth token is not configured. Set DID_SOLANA_KMS_AUTH_TOKEN.',
        'KMS_UNCONFIGURED',
        undefined,
        input.requestId,
      );
    }

    if (!input.keyRef) {
      throw new KmsSignerError('KMS signer requires keyRef for key lookup.', 'KMS_PAYLOAD_INVALID', undefined, input.requestId);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, this.timeoutMs));

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.authToken}`,
          'x-request-id': input.requestId || '',
        },
        body: JSON.stringify({
          action: 'resolve-solana-keypair',
          requestId: input.requestId,
          did: input.did,
          keyRef: input.keyRef,
        }),
        signal: controller.signal,
      });

      let payload: KmsResolveKeyResponse;
      try {
        payload = (await response.json()) as KmsResolveKeyResponse;
      } catch {
        throw new KmsSignerError(
          `KMS response is not valid JSON (status=${response.status}).`,
          'KMS_RESPONSE_INVALID',
          response.status,
          input.requestId,
        );
      }

      if (!response.ok || payload.success === false) {
        const message = payload?.error?.message || `KMS request failed with status ${response.status}`;
        throw new KmsSignerError(message, this.mapStatusToCode(response.status), response.status, input.requestId);
      }

      const { privateKeyBase58, keyId } = this.parsePrivateKey(payload, input.requestId);
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

      return {
        keypair,
        keyId,
        provider: this.provider,
      };
    } catch (error) {
      if (error instanceof KmsSignerError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new KmsSignerError('KMS request timeout', 'KMS_TIMEOUT', undefined, input.requestId);
      }

      throw new KmsSignerError(
        `KMS request failed: ${error instanceof Error ? error.message : String(error)}`,
        'KMS_REQUEST_FAILED',
        undefined,
        input.requestId,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createSolanaSignerProvider(provider?: string): SolanaSignerProvider {
  const selected = String(provider || process.env.DID_SOLANA_SIGNER_PROVIDER || 'local').toLowerCase();

  if (selected === 'kms') {
    return new KmsSolanaSignerProvider();
  }

  return new LocalSolanaSignerProvider();
}
