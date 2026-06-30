import { DidDocument, VerificationMethod } from '@/modules/did-identity/shared/types';
import { createSolanaSignerProvider, SolanaSignerProvider } from '@/lib/signer';
import { Connection, Keypair, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';
import bs58 from 'bs58';

export interface SolanaDidOptions {
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet';
  rpcUrl?: string;
  privateKey?: string;
  simulate?: boolean;
}

export interface SolanaDidCreationResult {
  did: string;
  document: DidDocument;
  keyPair: {
    publicKey: string;
    privateKey: string;
    keypair: Keypair;
  };
  connection: Connection | null;
}

export interface SolanaAnchorResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  slot: number;
}

export interface SolanaAnchorOptions {
  requestId?: string;
  idempotencyKey?: string;
  keyRef?: string;
  privateKey?: string;
  signerProvider?: SolanaSignerProvider;
  maxRetries?: number;
  validateSignerInSimulate?: boolean;
}

export class DidSolService {
  private connection: Connection | null;
  private simulate: boolean;
  private cluster: 'mainnet-beta' | 'testnet' | 'devnet';
  private rpcEndpoints: string[];
  private activeRpcIndex: number;

  constructor(options?: SolanaDidOptions) {
    this.simulate = options?.simulate || false;
    this.cluster = options?.cluster || 'devnet';
    this.rpcEndpoints = this.getClusterUrls(this.cluster, options?.rpcUrl);
    this.activeRpcIndex = 0;
    
    if (!this.simulate) {
      this.connection = new Connection(this.rpcEndpoints[this.activeRpcIndex], {
        commitment: 'confirmed',
      });
    } else {
      this.connection = null;
    }
  }

  private getClusterUrls(cluster: 'mainnet-beta' | 'testnet' | 'devnet', overrideRpcUrl?: string): string[] {
    if (overrideRpcUrl) {
      return overrideRpcUrl
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
    }

    const envRpcList = process.env.DID_SOLANA_RPC_ENDPOINTS;
    if (envRpcList) {
      const parsed = envRpcList
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }

    const rpcEndpoints: Record<string, string[]> = {
      'mainnet-beta': [
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana',
      ],
      'testnet': [
        'https://api.testnet.solana.com',
        'https://rpc.ankr.com/solana_testnet',
      ],
      'devnet': [
        'https://api.devnet.solana.com',
        'https://rpc.ankr.com/solana_devnet',
        ...(process.env.HELIUS_DEVNET_RPC_URL ? [process.env.HELIUS_DEVNET_RPC_URL] : []),
      ],
    };

    return rpcEndpoints[cluster] || rpcEndpoints['devnet'];
  }

  private async withRetry<T>(task: () => Promise<T>, maxAttempts: number, initialDelayMs: number = 250): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts) break;
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown retry failure');
  }

  private rotateRpcEndpoint(): void {
    if (this.rpcEndpoints.length <= 1 || this.simulate) return;
    this.activeRpcIndex = (this.activeRpcIndex + 1) % this.rpcEndpoints.length;
    this.connection = new Connection(this.rpcEndpoints[this.activeRpcIndex], {
      commitment: 'confirmed',
    });
  }

  private async withRpcFallback<T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> {
    if (this.simulate) {
      return operation();
    }

    const endpointCount = Math.max(1, this.rpcEndpoints.length);
    const totalAttempts = Math.max(1, maxRetries + 1) * endpointCount;
    let lastError: unknown;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.rotateRpcEndpoint();
      }
    }

    throw lastError instanceof Error ? lastError : new Error('RPC fallback failed');
  }

  async create(options?: { keypair?: Keypair; cluster?: string }): Promise<SolanaDidCreationResult> {
    const keypair = options?.keypair || Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    
    const did = `did:sol:${publicKey}`;
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#blockchainAccountId`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      blockchainAccountId: `solana:${publicKey}`,
      publicKeyBase58: publicKey,
    };

    const document: DidDocument = {
      id: did,
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/solana/v1'],
      verificationMethod: [verificationMethod],
      authentication: [`${did}#blockchainAccountId`],
      assertionMethod: [`${did}#blockchainAccountId`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
      alsoKnownAs: [`https://explorer.solana.com/address/${publicKey}`],
    };

    return {
      did,
      document,
      keyPair: {
        publicKey,
        privateKey: bs58.encode(keypair.secretKey),
        keypair,
      },
      connection: this.connection,
    };
  }

  async createFromExisting(privateKey: string): Promise<SolanaDidCreationResult> {
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    
    return this.create({ keypair });
  }

  async resolve(did: string): Promise<DidDocument> {
    const [, , publicKey] = did.split(':');
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#blockchainAccountId`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      blockchainAccountId: `solana:${publicKey}`,
      publicKeyBase58: publicKey,
    };

    return {
      id: did,
      '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/solana/v1'],
      verificationMethod: [verificationMethod],
      authentication: [`${did}#blockchainAccountId`],
      assertionMethod: [`${did}#blockchainAccountId`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
      alsoKnownAs: [`https://explorer.solana.com/address/${publicKey}`],
    };
  }

  async parse(did: string): Promise<{ publicKey: string }> {
    const parts = did.split(':');
    if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'sol') {
      throw new Error('Invalid did:sol format');
    }

    return {
      publicKey: parts[2],
    };
  }

  async isSolDid(did: string): Promise<boolean> {
    return did.startsWith('did:sol:');
  }

  async validate(did: string): Promise<boolean> {
    try {
      const { publicKey } = await this.parse(did);
      
      if (!publicKey) {
        return false;
      }

      try {
        new PublicKey(publicKey);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  async fromAccount(publicKey: string): Promise<string> {
    return `did:sol:${publicKey}`;
  }

  async anchorDid(
    did: string,
    document: DidDocument,
    privateKeyOrOptions?: string | SolanaAnchorOptions,
  ): Promise<SolanaAnchorResult> {
    const anchorOptions: SolanaAnchorOptions =
      typeof privateKeyOrOptions === 'string'
        ? { privateKey: privateKeyOrOptions }
        : privateKeyOrOptions || {};

    if (this.simulate) {
      if (anchorOptions.validateSignerInSimulate !== false) {
        const signerProvider = anchorOptions.signerProvider || createSolanaSignerProvider();
        const signerResult = await signerProvider.resolveKeypair({
          requestId: anchorOptions.requestId,
          did,
          keyRef: anchorOptions.keyRef,
          privateKey: anchorOptions.privateKey,
        });
        const { publicKey } = await this.parse(did);
        if (signerResult.keypair.publicKey.toBase58() !== publicKey) {
          throw new Error('Signer key does not match DID public key');
        }
      }

      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockSlot = Math.floor(Math.random() * 100000000);
      
      return {
        success: true,
        transactionHash: mockTxHash,
        blockNumber: mockSlot,
        blockTimestamp: Math.floor(Date.now() / 1000),
        slot: mockSlot,
      };
    }

    try {
      if (!this.connection) {
        throw new Error('Connection not initialized');
      }

      const signerProvider = anchorOptions.signerProvider || createSolanaSignerProvider();
      const signerResult = await signerProvider.resolveKeypair({
        requestId: anchorOptions.requestId,
        did,
        keyRef: anchorOptions.keyRef,
        privateKey: anchorOptions.privateKey,
      });

      const { publicKey } = await this.parse(did);
      const keypair = signerResult.keypair;

      if (keypair.publicKey.toBase58() !== publicKey) {
        throw new Error('Signer key does not match DID public key');
      }

      const balance = await this.withRpcFallback(() => this.getBalance(publicKey), anchorOptions.maxRetries ?? 2);
      if (balance < 0.001) {
        throw new Error(`Insufficient SOL balance. Current: ${balance} SOL, Need: 0.001+ SOL`);
      }

      const { blockhash, lastValidBlockHeight } = await this.withRpcFallback(
        () => this.connection!.getLatestBlockhash(),
        anchorOptions.maxRetries ?? 2,
      );

      const documentJson = JSON.stringify(document);
      const memoText = `DID::${documentJson.slice(0, 500)}`;

      const memoInstruction = createMemoInstruction(memoText);

      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: keypair.publicKey,
      });

      transaction.add(memoInstruction);
      transaction.sign(keypair);

      const txHash = await this.withRpcFallback(
        () =>
          this.withRetry(
            () => this.connection!.sendRawTransaction(transaction.serialize()),
            Math.max(1, (anchorOptions.maxRetries ?? 2) + 1),
          ),
        anchorOptions.maxRetries ?? 2,
      );

      const confirmation = await this.withRpcFallback(
        () =>
          this.withRetry(
            () =>
              this.connection!.confirmTransaction({
                signature: txHash,
                blockhash,
                lastValidBlockHeight,
              }),
            Math.max(1, (anchorOptions.maxRetries ?? 2) + 1),
          ),
        anchorOptions.maxRetries ?? 2,
      );

      if (confirmation.value.err) {
        return {
          success: false,
          transactionHash: txHash,
          blockNumber: 0,
          blockTimestamp: 0,
          slot: 0,
        };
      }

      const slot = await this.withRpcFallback(() => this.connection!.getSlot(), anchorOptions.maxRetries ?? 2);
      const block = await this.withRpcFallback(() => this.connection!.getBlock(slot), anchorOptions.maxRetries ?? 2);

      return {
        success: true,
        transactionHash: txHash,
        blockNumber: slot,
        blockTimestamp: block.blockTime || 0,
        slot,
      };
    } catch (error: any) {
      throw new Error(`Anchor DID failed: ${error.message || error}`);
    }
  }

  async getAccountInfo(publicKey: string): Promise<any> {
    if (!this.connection) {
      return null;
    }
    const key = new PublicKey(publicKey);
    return this.connection.getAccountInfo(key);
  }

  async getBalance(publicKey: string): Promise<number> {
    if (!this.connection) {
      return 0;
    }
    
    try {
      const key = new PublicKey(publicKey);
      const result = await this.withRpcFallback(() => this.connection!.getBalance(key), 2);
      const lamports = typeof result === 'number' ? result : 0;
      return lamports / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async getTransactionHistory(publicKey: string, limit: number = 10): Promise<any[]> {
    if (!this.connection) {
      return [];
    }
    const key = new PublicKey(publicKey);
    const signatures = await this.connection.getSignaturesForAddress(key, { limit });
    
    const transactions = await Promise.all(
      signatures.map(sig => this.connection.getTransaction(sig.signature))
    );

    return transactions.filter(Boolean);
  }

  getExplorerUrl(publicKey: string): string {
    const suffix = this.cluster === 'mainnet-beta' ? '' : `?cluster=${this.cluster}`;
    return `https://explorer.solana.com/address/${publicKey}${suffix}`;
  }

  getTransactionExplorerUrl(txHash: string): string {
    const suffix = this.cluster === 'mainnet-beta' ? '' : `?cluster=${this.cluster}`;
    return `https://explorer.solana.com/tx/${txHash}${suffix}`;
  }
}
