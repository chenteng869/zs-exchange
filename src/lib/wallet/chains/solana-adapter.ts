/**
 * Solana 链适配器
 * 使用官方 @solana/web3.js SDK 实现
 * 确保数据准确性和链上兼容性
 */

import {
  ChainAdapter,
  ChainType,
  ChainInfo,
  BalanceInfo,
  TokenBalanceInfo,
  TransactionInput,
  TransactionOutput,
  FeeEstimate,
  FeeLevel,
  GasPriceInfo,
  TransactionDetail,
  TransactionStatus,
  TransactionType,
  TokenStandard,
  AddressValidationResult,
  AddressType,
  BlockInfo,
  SignResult,
  BroadcastResult,
  Signer,
  AdapterConfig,
} from './chain-adapter.interface';

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  MessageV0,
  TransactionMessage,
  Blockhash,
  Commitment,
  TransactionInstruction,
  ParsedTransaction,
  ParsedInstruction,
} from '@solana/web3.js';

import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createTransferInstruction,
  getMint,
} from '@solana/spl-token';

import bs58 from 'bs58';

export { getAssociatedTokenAddress };

export function base58Encode(data: Uint8Array | Buffer): string {
  return bs58.encode(data);
}

export function base58Decode(data: string): Uint8Array {
  return bs58.decode(data);
}

export function encodeTransferData(): string {
  return '';
}

export function encodeTokenTransferData(): string {
  return '';
}

export interface SolanaChainConfig {
  chain: 'mainnet-beta' | 'testnet' | 'devnet';
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrl: string;
  isTestnet: boolean;
  commitment: Commitment;
  features: {
    nft: boolean;
    staking: boolean;
    defi: boolean;
    smartContracts: boolean;
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SOLANA_NETWORKS: Record<string, SolanaChainConfig> = {
  mainnet: {
    chain: 'mainnet-beta',
    name: 'Solana Mainnet Beta',
    symbol: 'SOL',
    decimals: 9,
    rpcUrls: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
    ],
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: false,
    commitment: 'confirmed',
    features: {
      nft: true,
      staking: true,
      defi: true,
      smartContracts: true,
    },
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  testnet: {
    chain: 'testnet',
    name: 'Solana Testnet',
    symbol: 'SOL',
    decimals: 9,
    rpcUrls: ['https://api.testnet.solana.com'],
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: true,
    commitment: 'confirmed',
    features: {
      nft: true,
      staking: true,
      defi: true,
      smartContracts: true,
    },
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  devnet: {
    chain: 'devnet',
    name: 'Solana Devnet',
    symbol: 'SOL',
    decimals: 9,
    rpcUrls: ['https://api.devnet.solana.com'],
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: true,
    commitment: 'confirmed',
    features: {
      nft: true,
      staking: true,
      defi: true,
      smartContracts: true,
    },
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
};

export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const STAKE_PROGRAM_ID = new PublicKey('Stake11111111111111111111111111111111111111');
export const METAPLEX_TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const RENT_PROGRAM_ID = new PublicKey('SysvarRent111111111111111111111111111111111');
export const CLOCK_PROGRAM_ID = new PublicKey('SysvarC1ock11111111111111111111111111111111');

export const COMMON_SPL_TOKENS: Record<string, {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}> = {
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  USDT: {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  },
  SRM: {
    mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    symbol: 'SRM',
    name: 'Serum',
    decimals: 6,
  },
  RAY: {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
  },
  mSOL: {
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
  },
  stSOL: {
    mint: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    symbol: 'stSOL',
    name: 'Lido Staked SOL',
    decimals: 9,
  },
  ORCA: {
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
  },
  JUP: {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
  },
  WIF: {
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBamMqgyVupLRvTUr',
    symbol: 'WIF',
    name: 'dogwifhat',
    decimals: 6,
  },
  BONK: {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
  },
};

export function lamportsToSOL(lamports: number | string | bigint): string {
  const value = typeof lamports === 'string' ? BigInt(lamports) : BigInt(lamports.toString());
  const divisor = 10n ** 9n;
  const integer = value / divisor;
  const remainder = value % divisor;
  const remainderStr = remainder.toString().padStart(9, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return trimmed ? `${integer}.${trimmed}` : integer.toString();
}

export function solToLamports(sol: string): string {
  const [intPart, decPart = ''] = sol.split('.');
  const paddedDec = decPart.padEnd(9, '0').slice(0, 9);
  return BigInt(intPart + paddedDec).toString();
}

export function formatSOL(lamports: number | string | bigint): string {
  const sol = parseFloat(lamportsToSOL(lamports));
  if (sol >= 1) return sol.toFixed(4) + ' SOL';
  if (sol >= 0.001) return sol.toFixed(6) + ' SOL';
  return sol.toFixed(9) + ' SOL';
}

export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export class SolanaAdapter implements ChainAdapter {
  private currentChainKey: string;
  private config: AdapterConfig;
  private connections: Map<string, Connection> = new Map();
  private requestCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cacheTTL: number;
  private customNetworks: Map<string, SolanaChainConfig> = new Map();

  constructor(config: AdapterConfig = {}) {
    this.config = config;
    this.currentChainKey = 'mainnet';
    this.cacheTTL = config.cacheTTL || 10 * 1000;
  }

  private getConnection(chainKey?: string): Connection {
    const key = chainKey || this.currentChainKey;
    
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    const config = this.getChainConfig(key);
    const rpcUrls = this.config.rpcUrls || config.rpcUrls;
    
    const connection = new Connection(rpcUrls[0], {
      commitment: config.commitment,
      confirmTransactionInitialTimeout: 60000,
    });
    
    this.connections.set(key, connection);
    return connection;
  }

  getChainType(): ChainType {
    return ChainType.SOLANA;
  }

  getChainInfo(chainKey?: string): ChainInfo {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    return {
      chainId: config.chain,
      chainKey: key,
      chainName: config.name,
      chainType: ChainType.SOLANA,
      symbol: config.symbol,
      decimals: config.decimals,
      rpcUrls: this.config.rpcUrls || config.rpcUrls,
      blockExplorerUrl: config.blockExplorerUrl,
      isTestnet: config.isTestnet,
      nativeCurrency: {
        name: config.nativeCurrency.name,
        symbol: config.nativeCurrency.symbol,
        decimals: config.nativeCurrency.decimals,
      },
      features: {
        smartContracts: config.features.smartContracts,
        nft: config.features.nft,
        staking: config.features.staking,
        governance: false,
      },
    };
  }

  getSupportedChains(): string[] {
    return [...Object.keys(SOLANA_NETWORKS), ...this.customNetworks.keys()];
  }

  setChain(chainKey: string): void {
    if (!this.getChainConfig(chainKey)) {
      throw new Error(`Unsupported Solana network: ${chainKey}`);
    }
    this.currentChainKey = chainKey;
  }

  getCurrentChain(): string {
    return this.currentChainKey;
  }

  async validateAddress(address: string, chainKey?: string): Promise<AddressValidationResult> {
    if (!isValidSolanaAddress(address)) {
      return {
        isValid: false,
        address,
        errorMessage: 'Invalid Solana address format',
      };
    }

    const publicKey = new PublicKey(address);

    try {
      const connection = this.getConnection(chainKey);
      const accountInfo = await connection.getAccountInfo(publicKey);

      if (accountInfo) {
        const owner = accountInfo.owner.toBase58();
        let addressType: AddressType = AddressType.EOA;

        if (owner === TOKEN_PROGRAM_ID.toBase58() || owner === TOKEN_2022_PROGRAM_ID.toBase58()) {
          addressType = AddressType.CONTRACT;
        } else if (owner === STAKE_PROGRAM_ID.toBase58()) {
          addressType = AddressType.VALIDATOR;
        }

        return {
          isValid: true,
          address,
          normalizedAddress: address,
          addressType,
          extra: {
            owner,
            lamports: accountInfo.lamports,
            executable: accountInfo.executable,
          },
        };
      }

      return {
        isValid: true,
        address,
        normalizedAddress: address,
        addressType: AddressType.EOA,
      };
    } catch {
      return {
        isValid: true,
        address,
        normalizedAddress: address,
        addressType: AddressType.EOA,
      };
    }
  }

  async getNativeBalance(address: string, chainKey?: string): Promise<BalanceInfo> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const connection = this.getConnection(chainKey);
    const publicKey = new PublicKey(address);

    const lamports = await connection.getBalance(publicKey);

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      address,
      native: {
        balance: lamports.toString(),
        formatted: lamportsToSOL(lamports),
        decimals: config.decimals,
        symbol: config.symbol,
      },
      updatedAt: new Date().toISOString(),
      source: 'rpc',
    };
  }

  async getTokenBalance(
    address: string,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TokenBalanceInfo> {
    const key = chainKey || this.currentChainKey;
    const connection = this.getConnection(chainKey);
    const owner = new PublicKey(address);
    const mint = new PublicKey(tokenContract);

    try {
      const ata = await getAssociatedTokenAddress(mint, owner);
      const account = await getAccount(connection, ata);
      const mintInfo = await getMint(connection, mint);

      const tokenInfo = this.getTokenInfoByMint(tokenContract);
      const decimals = mintInfo.decimals;

      return {
        contractAddress: tokenContract,
        tokenId,
        symbol: tokenInfo?.symbol || 'SPL',
        name: tokenInfo?.name || 'SPL Token',
        decimals,
        balance: account.amount.toString(),
        formatted: this.formatTokenAmount(account.amount, decimals),
        standard: TokenStandard.SPL,
        logoURI: tokenInfo?.logoURI,
        extra: {
          account: ata.toBase58(),
          isNative: account.isNative,
          rentExemptReserve: account.rentExemptReserve?.toString(),
        },
      };
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
        const tokenInfo = this.getTokenInfoByMint(tokenContract);
        return {
          contractAddress: tokenContract,
          tokenId,
          symbol: tokenInfo?.symbol || 'UNKNOWN',
          name: tokenInfo?.name || 'Unknown Token',
          decimals: tokenInfo?.decimals || 0,
          balance: '0',
          formatted: '0',
          standard: TokenStandard.SPL,
          logoURI: tokenInfo?.logoURI,
        };
      }
      throw error;
    }
  }

  async buildTransfer(input: TransactionInput, chainKey?: string): Promise<TransactionOutput> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const connection = this.getConnection(chainKey);

    const from = new PublicKey(input.from);
    const to = new PublicKey(input.to);
    const lamports = BigInt(solToLamports(input.value));

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: from,
    });

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: Number(lamports),
      })
    );

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
    const feeInfo = await this.getFeeForMessage(serializedTransaction, chainKey);

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      rawTransaction: transaction,
      serializedTransaction,
      transactionHash: '',
      from: input.from,
      to: input.to,
      value: input.value,
      nonce: 0,
      data: input.data || '',
      fee: feeInfo.toString(),
      feeFormatted: lamportsToSOL(feeInfo),
      size: Math.ceil(serializedTransaction.length * 0.75),
      extra: {
        recentBlockhash: blockhash,
        lastValidBlockHeight,
        signatureCount: 1,
      },
    };
  }

  async buildTokenTransfer(
    input: TransactionInput,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TransactionOutput> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const connection = this.getConnection(chainKey);

    const from = new PublicKey(input.from);
    const to = new PublicKey(input.to);
    const mint = new PublicKey(tokenContract);

    const tokenInfo = this.getTokenInfoByMint(tokenContract);
    const decimals = tokenInfo?.decimals || 9;
    const amount = BigInt(input.tokenAmount || input.value) * BigInt(10 ** decimals);

    const sourceAta = await getAssociatedTokenAddress(mint, from);
    const destAta = await getAssociatedTokenAddress(mint, to);

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: from,
    });

    transaction.add(
      createTransferInstruction(
        sourceAta,
        destAta,
        from,
        amount
      )
    );

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
    const feeInfo = await this.getFeeForMessage(serializedTransaction, chainKey);

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      rawTransaction: transaction,
      serializedTransaction,
      transactionHash: '',
      from: input.from,
      to: input.to,
      value: '0',
      nonce: 0,
      data: input.data || '',
      fee: feeInfo.toString(),
      feeFormatted: lamportsToSOL(feeInfo),
      size: Math.ceil(serializedTransaction.length * 0.75),
      extra: {
        recentBlockhash: blockhash,
        lastValidBlockHeight,
        tokenTransfer: {
          to: input.to,
          amount: input.tokenAmount || input.value,
          sourceAta: sourceAta.toBase58(),
          destAta: destAta.toBase58(),
          tokenId,
        },
      },
    };
  }

  async estimateFee(
    input: TransactionInput,
    feeLevel: FeeLevel = FeeLevel.NORMAL,
    chainKey?: string,
  ): Promise<FeeEstimate> {
    const key = chainKey || this.currentChainKey;

    let baseFee: number;
    if (input.tokenContract) {
      const tx = await this.buildTokenTransfer(input, input.tokenContract, chainKey);
      baseFee = Number(tx.fee);
    } else {
      const tx = await this.buildTransfer(input, chainKey);
      baseFee = Number(tx.fee);
    }

    const feeMultiplier = feeLevel === FeeLevel.SLOW ? 1.0 :
      feeLevel === FeeLevel.FAST ? 1.5 : 1.2;
    const fee = Math.ceil(baseFee * feeMultiplier);

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      feeLevel,
      fee: fee.toString(),
      feeFormatted: lamportsToSOL(fee),
      estimatedTime: feeLevel === FeeLevel.SLOW ? 60 :
        feeLevel === FeeLevel.FAST ? 10 : 30,
      extra: {
        baseFee: baseFee.toString(),
        signatureFee: baseFee,
      },
    };
  }

  async getGasPrice(chainKey?: string): Promise<GasPriceInfo> {
    const key = chainKey || this.currentChainKey;
    const connection = this.getConnection(chainKey);

    const { blockhash } = await connection.getLatestBlockhash();

    const message = new TransactionMessage({
      payerKey: new PublicKey('1'.repeat(32)),
      recentBlockhash: blockhash,
      instructions: [],
    });

    const compiledMessage = message.compileToV0Message();
    const baseFee = await connection.getFeeForMessage(compiledMessage);

    const safeBaseFee = baseFee.value ?? 5000;

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      slow: {
        gasPrice: safeBaseFee.toString(),
        estimatedTime: 60,
      },
      normal: {
        gasPrice: Math.ceil(safeBaseFee * 1.2).toString(),
        estimatedTime: 30,
      },
      fast: {
        gasPrice: Math.ceil(safeBaseFee * 1.5).toString(),
        estimatedTime: 10,
      },
      isEIP1559: false,
      updatedAt: new Date().toISOString(),
    };
  }

  async signTransaction(
    transaction: TransactionOutput,
    signer: Signer,
    chainKey?: string,
  ): Promise<SignResult> {
    const result = await signer.signTransaction(transaction);
    return result;
  }

  async broadcastTransaction(
    signedTransaction: string,
    chainKey?: string,
  ): Promise<BroadcastResult> {
    try {
      const connection = this.getConnection(chainKey);
      const txBytes = Buffer.from(signedTransaction, 'base64');

      const txHash = await connection.sendRawTransaction(txBytes);

      return {
        success: true,
        transactionHash: txHash,
      };
    } catch (error) {
      return {
        success: false,
        transactionHash: '',
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getTransactionStatus(
    transactionHash: string,
    chainKey?: string,
  ): Promise<TransactionDetail> {
    const key = chainKey || this.currentChainKey;
    const connection = this.getConnection(chainKey);

    try {
      const tx = await connection.getTransaction(
        transactionHash,
        {
          maxSupportedTransactionVersion: 0,
        }
      );

      if (!tx) {
        const statusResult = await connection.getSignatureStatus(transactionHash);
        const status = statusResult.value;

        if (!status) {
          throw new Error(`Transaction not found: ${transactionHash}`);
        }

        return {
          chainKey: key,
          chainType: ChainType.SOLANA,
          hash: transactionHash,
          from: '',
          to: '',
          value: '0',
          valueFormatted: '0',
          status: TransactionStatus.PENDING,
          type: TransactionType.TRANSFER,
          confirmations: 0,
          extra: {
            confirmationStatus: status.confirmationStatus,
          },
        };
      }

      const meta = tx.meta;
      const message = tx.transaction.message;
      
      let from = '';
      let to = '';
      let value = '0';

      const accountKeysResult =
        typeof (message as any).getAccountKeys === 'function'
          ? (message as any).getAccountKeys()
          : null;
      const accountKeys =
        accountKeysResult?.staticAccountKeys ||
        (message as any).staticAccountKeys ||
        (message as any).accountKeys ||
        [];
      const instructions =
        (message as any).compiledInstructions ||
        (message as any).instructions ||
        [];

      if (instructions.length > 0 && accountKeys.length > 1) {
        from = accountKeys[0].toBase58();
        to = accountKeys[1].toBase58();
      }

      const fee = meta?.fee || 0;
      const isFailed = meta?.err !== null && meta?.err !== undefined;

      let status: TransactionStatus;
      if (isFailed) {
        status = TransactionStatus.FAILED;
        status = TransactionStatus.CONFIRMED;
      }

      let confirmations = 0;
      if (tx.slot) {
        try {
          const currentSlot = await connection.getSlot();
          confirmations = Math.max(0, currentSlot - tx.slot);
        } catch {
          confirmations = 1;
        }
      }

      return {
        chainKey: key,
        chainType: ChainType.SOLANA,
        hash: transactionHash,
        from,
        to,
        value,
        valueFormatted: lamportsToSOL(value),
        fee: fee.toString(),
        feeFormatted: lamportsToSOL(fee),
        blockNumber: tx.slot,
        timestamp: tx.blockTime,
        confirmations,
        status,
        type: TransactionType.TRANSFER,
        errorMessage: isFailed ? JSON.stringify(meta.err) : undefined,
        extra: {
          slot: tx.slot,
          blockTime: tx.blockTime,
          logMessages: meta?.logMessages,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getNonce(address: string, chainKey?: string): Promise<number> {
    return 0;
  }

  async getBlockNumber(chainKey?: string): Promise<number> {
    const connection = this.getConnection(chainKey);
    return connection.getSlot();
  }

  async getBlockInfo(blockNumber: number, chainKey?: string): Promise<BlockInfo> {
    const key = chainKey || this.currentChainKey;
    const connection = this.getConnection(chainKey);

    const block = await connection.getBlock(blockNumber, {
      maxSupportedTransactionVersion: 0,
    });

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      blockNumber,
      blockHash: block.blockhash,
      timestamp: block.blockTime || 0,
      transactions: block.transactions?.length || 0,
      extra: {
        parentSlot: block.parentSlot,
        previousBlockhash: block.previousBlockhash,
        rewards: block.rewards?.length || 0,
      },
    };
  }

  async request(method: string, params: any[] = [], chainKey?: string): Promise<any> {
    const connection = this.getConnection(chainKey);
    
    switch (method) {
      case 'getBalance':
        return { value: await connection.getBalance(new PublicKey(params[0])) };
      case 'getAccountInfo':
        return await connection.getAccountInfo(new PublicKey(params[0]), params[1]);
      case 'getBlock':
        return await connection.getBlock(params[0], params[1]);
      case 'getTokenAccountsByOwner':
        return await connection.getTokenAccountsByOwner(new PublicKey(params[0]), params[1], params[2]);
      case 'getTransaction':
        return await connection.getTransaction(params[0], params[1]);
      case 'getLatestBlockhash':
        return await connection.getLatestBlockhash();
      case 'getFeeForMessage':
        return { value: await connection.getFeeForMessage(params[0]) };
      case 'getSignatureStatuses':
        return await connection.getSignatureStatuses(params[0]);
      case 'simulateTransaction':
        return await connection.simulateTransaction(params[0], params[1]);
      case 'sendTransaction':
        return await connection.sendRawTransaction(params[0], params[1]);
      case 'getSlot':
        return await connection.getSlot();
      case 'getEpochInfo':
        return await connection.getEpochInfo();
      default:
        throw new Error(`Unsupported RPC method: ${method}`);
    }
  }

  switchRpc(chainKey?: string): string {
    return this.getConnection(chainKey).rpcEndpoint;
  }

  clearCache(): void {
    this.requestCache.clear();
  }

  getCacheSize(): number {
    return this.requestCache.size;
  }

  async getLatestBlockhash(chainKey?: string): Promise<{
    blockhash: string;
    lastValidBlockHeight: number;
  }> {
    const connection = this.getConnection(chainKey);
    const result = await connection.getLatestBlockhash();
    if ((result as any)?.value?.blockhash) {
      return (result as any).value;
    }
    return result as { blockhash: string; lastValidBlockHeight: number };
  }

  async getFeeForMessage(message: string, chainKey?: string): Promise<number> {
    try {
      const connection = this.getConnection(chainKey);
      const messageBytes = Buffer.from(message, 'base64');
      
      try {
        const v0Message = MessageV0.deserialize(messageBytes);
        const fee = await connection.getFeeForMessage(v0Message);
        return fee.value ?? 5000;
      } catch {
        return 5000;
      }
    } catch {
      return 5000;
    }
  }

  async getSlot(chainKey?: string): Promise<number> {
    const connection = this.getConnection(chainKey);
    return connection.getSlot();
  }

  async getEpochInfo(chainKey?: string): Promise<{
    epoch: number;
    slotIndex: number;
    slotsInEpoch: number;
    absoluteSlot: number;
    blockHeight: number;
    transactionCount: number;
  }> {
    const connection = this.getConnection(chainKey);
    const info = await connection.getEpochInfo();
    return {
      epoch: info.epoch,
      slotIndex: info.slotIndex,
      slotsInEpoch: info.slotsInEpoch,
      absoluteSlot: info.absoluteSlot,
      blockHeight: info.blockHeight ?? 0,
      transactionCount: info.transactionCount ?? 0,
    };
  }

  async getAllTokenBalances(owner: string, chainKey?: string): Promise<TokenBalanceInfo[]> {
    const connection = this.getConnection(chainKey);
    const ownerPublicKey = new PublicKey(owner);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      ownerPublicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    const balances: TokenBalanceInfo[] = [];
    for (const account of tokenAccounts.value) {
      const info = account.account.data.parsed.info;
      const tokenInfo = this.getTokenInfoByMint(info.mint);

      balances.push({
        contractAddress: info.mint,
        symbol: tokenInfo?.symbol || 'SPL',
        name: tokenInfo?.name || 'SPL Token',
        decimals: info.tokenAmount.decimals,
        balance: info.tokenAmount.amount,
        formatted: info.tokenAmount.uiAmountString,
        standard: TokenStandard.SPL,
        logoURI: tokenInfo?.logoURI,
        extra: {
          account: account.pubkey,
          isNative: info.isNative,
        },
      });
    }

    return balances;
  }

  async simulateTransaction(
    transaction: string,
    chainKey?: string,
  ): Promise<{
    success: boolean;
    err: any;
    logs: string[];
    unitsConsumed: number;
    returnData: any;
  }> {
    const connection = this.getConnection(chainKey);
    const txBytes = Buffer.from(transaction, 'base64');

    let parsedTransaction: Transaction | VersionedTransaction;
    try {
      parsedTransaction = VersionedTransaction.deserialize(txBytes);
    } catch {
      parsedTransaction = Transaction.from(txBytes);
    }

    const result = await connection.simulateTransaction(parsedTransaction as any);

    return {
      success: result.value.err === null,
      err: result.value.err,
      logs: result.value.logs || [],
      unitsConsumed: result.value.unitsConsumed || 0,
      returnData: result.value.returnData,
    };
  }

  private getChainConfig(chainKey: string): SolanaChainConfig {
    const custom = this.customNetworks.get(chainKey);
    if (custom) return custom;

    const config = SOLANA_NETWORKS[chainKey];
    if (!config) {
      throw new Error(`Unsupported Solana network: ${chainKey}`);
    }
    return config;
  }

  private getTokenInfoByMint(mint: string): typeof COMMON_SPL_TOKENS[keyof typeof COMMON_SPL_TOKENS] | undefined {
    return Object.values(COMMON_SPL_TOKENS).find(t => t.mint === mint);
  }

  private formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals);
    const integer = amount / divisor;
    const fraction = amount % divisor;
    const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
    return fractionText ? `${integer}.${fractionText}` : integer.toString();
  }

  addCustomNetwork(key: string, config: SolanaChainConfig): void {
    this.customNetworks.set(key, config);
  }

  removeCustomNetwork(key: string): boolean {
    return this.customNetworks.delete(key);
  }
}

export default {
  SOLANA_NETWORKS,
  SolanaAdapter,
  COMMON_SPL_TOKENS,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  STAKE_PROGRAM_ID,
  METAPLEX_TOKEN_METADATA_PROGRAM_ID,
  getAssociatedTokenAddress,
  lamportsToSOL,
  solToLamports,
  formatSOL,
  isValidSolanaAddress,
};
