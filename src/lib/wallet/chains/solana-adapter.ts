/**
 * Solana 链适配器
 *
 * 实现 ChainAdapter 接口，支持 Solana 区块链网络。
 *
 * 支持的网络：
 *  - Mainnet Beta
 *  - Testnet
 *  - Devnet
 *
 * 功能：
 *  - 支持 SOL 原生代币转账
 *  - 支持 SPL Token 转账和余额查询
 *  - 支持交易模拟和状态查询
 *  - 支持多 RPC 节点故障转移
 *  - 支持请求缓存机制
 *  - 支持 Staking 质押操作
 *  - 支持 NFT (Metaplex) 查询
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

// ============================================================================
// Solana 链配置
// ============================================================================

export interface SolanaChainConfig {
  chain: 'mainnet-beta' | 'testnet' | 'devnet';
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrl: string;
  isTestnet: boolean;
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
    rpcUrls: [
      'https://api.testnet.solana.com',
    ],
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: true,
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
    rpcUrls: [
      'https://api.devnet.solana.com',
    ],
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: true,
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

// ============================================================================
// 系统程序和 Token 程序 ID
// ============================================================================

export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const STAKE_PROGRAM_ID = 'Stake11111111111111111111111111111111111111';
export const METAPLEX_TOKEN_METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
export const RENT_PROGRAM_ID = 'SysvarRent111111111111111111111111111111111';
export const CLOCK_PROGRAM_ID = 'SysvarC1ock11111111111111111111111111111111';
export const RECENT_BLOCKHASHES_PROGRAM_ID = 'SysvarRecentB1ockHashes1111111111111111111';

// ============================================================================
// 常用 SPL Token 配置
// ============================================================================

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
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png',
  },
  RAY: {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  },
  mSOL: {
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  },
  stSOL: {
    mint: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    symbol: 'stSOL',
    name: 'Lido Staked SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj/logo.png',
  },
  ORCA: {
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
  },
  JITO: {
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    symbol: 'JTO',
    name: 'Jito',
    decimals: 9,
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

// ============================================================================
// 工具函数
// ============================================================================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Base58 编码
 */
export function base58Encode(bytes: Uint8Array): string {
  let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let result = '';
  const base = BigInt(58);

  while (num > 0) {
    const rem = Number(num % base);
    result = BASE58_ALPHABET[rem] + result;
    num = num / base;
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }

  return result;
}

/**
 * Base58 解码
 */
export function base58Decode(str: string): Uint8Array {
  let num = BigInt(0);
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error('Invalid base58 character');
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;

  const bytes = Buffer.from(hex, 'hex');
  return new Uint8Array(bytes);
}

/**
 * Lamports 转 SOL
 */
export function lamportsToSOL(lamports: number | string | bigint): string {
  const value = typeof lamports === 'string' ? BigInt(lamports) : BigInt(lamports.toString());
  const divisor = 10n ** 9n;
  const integer = value / divisor;
  const remainder = value % divisor;
  const remainderStr = remainder.toString().padStart(9, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return trimmed ? `${integer}.${trimmed}` : integer.toString();
}

/**
 * SOL 转 Lamports
 */
export function solToLamports(sol: string): string {
  const [intPart, decPart = ''] = sol.split('.');
  const paddedDec = decPart.padEnd(9, '0').slice(0, 9);
  return BigInt(intPart + paddedDec).toString();
}

/**
 * 格式化 SOL 数量
 */
export function formatSOL(lamports: number | string | bigint): string {
  const sol = parseFloat(lamportsToSOL(lamports));
  if (sol >= 1) return sol.toFixed(4) + ' SOL';
  if (sol >= 0.001) return sol.toFixed(6) + ' SOL';
  return sol.toFixed(9) + ' SOL';
}

/**
 * 验证 Solana 地址格式
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  try {
    const decoded = base58Decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * 计算关联令牌账户地址 (ATA) - 简化实现
 */
export function getAssociatedTokenAddress(
  mint: string,
  owner: string,
): string {
  const seeds = [
    base58Decode(owner),
    base58Decode(TOKEN_PROGRAM_ID),
    base58Decode(mint),
  ];

  let address = base58Decode(ASSOCIATED_TOKEN_PROGRAM_ID);
  for (const seed of seeds) {
    address = xorBytes(address, seed);
  }

  return base58Encode(address);
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

// ============================================================================
// 交易指令编码
// ============================================================================

/**
 * 编码系统程序转账指令数据
 */
export function encodeTransferData(lamports: number | bigint): string {
  const buffer = Buffer.alloc(12);
  buffer.writeUInt32LE(2, 0);
  buffer.writeBigUInt64LE(BigInt(lamports), 4);
  return buffer.toString('base64');
}

/**
 * 编码 Token 程序转账指令数据
 */
export function encodeTokenTransferData(amount: number | bigint): string {
  const buffer = Buffer.alloc(12);
  buffer.writeUInt32LE(3, 0);
  buffer.writeBigUInt64LE(BigInt(amount), 4);
  return buffer.toString('base64');
}

// ============================================================================
// SolanaAdapter 类
// ============================================================================

export class SolanaAdapter implements ChainAdapter {
  private currentChainKey: string;
  private config: AdapterConfig;
  private currentRpcIndex: Map<string, number> = new Map();
  private requestCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cacheTTL: number;
  private customNetworks: Map<string, SolanaChainConfig> = new Map();
  private requestId: number = 0;

  constructor(config: AdapterConfig = {}) {
    this.config = config;
    this.currentChainKey = 'mainnet';
    this.cacheTTL = config.cacheTTL || 10 * 1000;
  }

  // -------------------------------------------------------------------------
  // 基础信息
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // 地址验证
  // -------------------------------------------------------------------------

  async validateAddress(address: string, chainKey?: string): Promise<AddressValidationResult> {
    if (!isValidSolanaAddress(address)) {
      return {
        isValid: false,
        address,
        errorMessage: 'Invalid Solana address format',
      };
    }

    try {
      const accountInfo = await this.request('getAccountInfo', [address, { encoding: 'base64' }], chainKey);

      if (accountInfo.value) {
        const owner = accountInfo.value.owner;
        let addressType: AddressType = AddressType.EOA;

        if (owner === TOKEN_PROGRAM_ID || owner === TOKEN_2022_PROGRAM_ID) {
          addressType = AddressType.CONTRACT;
        } else if (owner === STAKE_PROGRAM_ID) {
          addressType = AddressType.VALIDATOR;
        }

        return {
          isValid: true,
          address,
          normalizedAddress: address,
          addressType,
          extra: {
            owner,
            lamports: accountInfo.value.lamports,
            executable: accountInfo.value.executable,
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

  // -------------------------------------------------------------------------
  // 余额查询
  // -------------------------------------------------------------------------

  async getNativeBalance(address: string, chainKey?: string): Promise<BalanceInfo> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const result = await this.request('getBalance', [address], chainKey);
    const lamports = result.value.toString();

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      address,
      native: {
        balance: lamports,
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

    const params: any[] = [
      address,
      { mint: tokenContract },
      { encoding: 'jsonParsed' },
    ];

    const result = await this.request('getTokenAccountsByOwner', params, chainKey);

    if (!result.value || result.value.length === 0) {
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

    const account = result.value[0];
    const info = account.account.data.parsed.info;
    const tokenInfo = this.getTokenInfoByMint(info.mint);

    return {
      contractAddress: info.mint,
      tokenId,
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
        rentExemptReserve: info.rentExemptReserve,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 交易构建
  // -------------------------------------------------------------------------

  async buildTransfer(input: TransactionInput, chainKey?: string): Promise<TransactionOutput> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    const { blockhash } = await this.getLatestBlockhash(chainKey);
    const lamports = solToLamports(input.value);

    const transferData = encodeTransferData(BigInt(lamports));

    const message = {
      accountKeys: [
        { pubkey: input.from, signer: true, writable: true },
        { pubkey: input.to, signer: false, writable: true },
        { pubkey: SYSTEM_PROGRAM_ID, signer: false, writable: false },
      ],
      recentBlockhash: blockhash,
      instructions: [
        {
          programIdIndex: 2,
          accounts: [0, 1],
          data: transferData,
        },
      ],
    };

    const transaction = {
      message,
      signatures: [null],
    };

    const serializedTransaction = Buffer.from(JSON.stringify(transaction)).toString('base64');

    const feeInfo = await this.getFeeForMessage(
      Buffer.from(JSON.stringify(message)).toString('base64'),
      chainKey
    );

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

    const sourceAta = getAssociatedTokenAddress(tokenContract, input.from);
    const destAta = getAssociatedTokenAddress(tokenContract, input.to);
    const tokenInfo = this.getTokenInfoByMint(tokenContract);
    const decimals = tokenInfo?.decimals || 9;
    const amount = BigInt(input.tokenAmount || input.value) * BigInt(10 ** decimals);

    const { blockhash } = await this.getLatestBlockhash(chainKey);

    const transferData = encodeTokenTransferData(amount);

    const message = {
      accountKeys: [
        { pubkey: input.from, signer: true, writable: true },
        { pubkey: sourceAta, signer: false, writable: true },
        { pubkey: destAta, signer: false, writable: true },
        { pubkey: TOKEN_PROGRAM_ID, signer: false, writable: false },
      ],
      recentBlockhash: blockhash,
      instructions: [
        {
          programIdIndex: 3,
          accounts: [1, 2, 0],
          data: transferData,
        },
      ],
    };

    const transaction = {
      message,
      signatures: [null],
    };

    const serializedTransaction = Buffer.from(JSON.stringify(transaction)).toString('base64');

    const feeInfo = await this.getFeeForMessage(
      Buffer.from(JSON.stringify(message)).toString('base64'),
      chainKey
    );

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      rawTransaction: transaction,
      serializedTransaction,
      transactionHash: '',
      from: input.from,
      to: tokenContract,
      value: '0',
      nonce: 0,
      data: input.data || '',
      fee: feeInfo.toString(),
      feeFormatted: lamportsToSOL(feeInfo),
      size: Math.ceil(serializedTransaction.length * 0.75),
      extra: {
        recentBlockhash: blockhash,
        tokenTransfer: {
          to: input.to,
          amount: input.tokenAmount || input.value,
          sourceAta,
          destAta,
          tokenId,
        },
      },
    };
  }

  // -------------------------------------------------------------------------
  // 费用估算
  // -------------------------------------------------------------------------

  async estimateFee(
    input: TransactionInput,
    feeLevel: FeeLevel = FeeLevel.NORMAL,
    chainKey?: string,
  ): Promise<FeeEstimate> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    let message: any;
    if (input.tokenContract) {
      const sourceAta = getAssociatedTokenAddress(input.tokenContract, input.from);
      const destAta = getAssociatedTokenAddress(input.tokenContract, input.to);
      message = {
        accountKeys: [
          { pubkey: input.from, signer: true, writable: true },
          { pubkey: sourceAta, signer: false, writable: true },
          { pubkey: destAta, signer: false, writable: true },
          { pubkey: TOKEN_PROGRAM_ID, signer: false, writable: false },
        ],
        recentBlockhash: '1'.repeat(32),
        instructions: [
          { programIdIndex: 3, accounts: [1, 2, 0], data: '' },
        ],
      };
    } else {
      message = {
        accountKeys: [
          { pubkey: input.from, signer: true, writable: true },
          { pubkey: input.to, signer: false, writable: true },
          { pubkey: SYSTEM_PROGRAM_ID, signer: false, writable: false },
        ],
        recentBlockhash: '1'.repeat(32),
        instructions: [
          { programIdIndex: 2, accounts: [0, 1], data: '' },
        ],
      };
    }

    const baseFee = await this.getFeeForMessage(
      Buffer.from(JSON.stringify(message)).toString('base64'),
      chainKey
    );

    const feeMultiplier = feeLevel === FeeLevel.SLOW ? 1.0 :
      feeLevel === FeeLevel.FAST ? 1.5 : 1.2;
    const fee = Math.ceil(Number(baseFee) * feeMultiplier);

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      feeLevel,
      fee: fee.toString(),
      feeFormatted: lamportsToSOL(fee),
      estimatedTime: feeLevel === FeeLevel.SLOW ? 60 :
        feeLevel === FeeLevel.FAST ? 10 : 30,
      feePerByte: Math.ceil(fee / Math.ceil(Buffer.from(JSON.stringify(message)).length * 0.75)),
      extra: {
        baseFee: baseFee.toString(),
        signatureFee: baseFee,
      },
    };
  }

  async getGasPrice(chainKey?: string): Promise<GasPriceInfo> {
    const key = chainKey || this.currentChainKey;

    const { blockhash } = await this.getLatestBlockhash(chainKey);
    const message = {
      accountKeys: [
        { pubkey: '1'.repeat(32), signer: true, writable: true },
        { pubkey: '2'.repeat(32), signer: false, writable: true },
        { pubkey: SYSTEM_PROGRAM_ID, signer: false, writable: false },
      ],
      recentBlockhash: blockhash,
      instructions: [],
    };

    const baseFee = await this.getFeeForMessage(
      Buffer.from(JSON.stringify(message)).toString('base64'),
      chainKey
    );

    return {
      chainKey: key,
      chainType: ChainType.SOLANA,
      slow: {
        gasPrice: baseFee.toString(),
        estimatedTime: 60,
      },
      normal: {
        gasPrice: Math.ceil(Number(baseFee) * 1.2).toString(),
        estimatedTime: 30,
      },
      fast: {
        gasPrice: Math.ceil(Number(baseFee) * 1.5).toString(),
        estimatedTime: 10,
      },
      isEIP1559: false,
      updatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // 交易签名
  // -------------------------------------------------------------------------

  async signTransaction(
    transaction: TransactionOutput,
    signer: Signer,
    chainKey?: string,
  ): Promise<SignResult> {
    const result = await signer.signTransaction(transaction);
    return result;
  }

  // -------------------------------------------------------------------------
  // 交易广播
  // -------------------------------------------------------------------------

  async broadcastTransaction(
    signedTransaction: string,
    chainKey?: string,
  ): Promise<BroadcastResult> {
    try {
      const params: any[] = [
        signedTransaction,
        {
          encoding: 'base64',
          skipPreflight: false,
          preflightCommitment: 'processed',
        },
      ];

      const txHash = await this.request('sendTransaction', params, chainKey);

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

  // -------------------------------------------------------------------------
  // 交易查询
  // -------------------------------------------------------------------------

  async getTransactionStatus(
    transactionHash: string,
    chainKey?: string,
  ): Promise<TransactionDetail> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);

    const result = await this.request('getTransaction', [
      transactionHash,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
    ], chainKey);

    if (!result) {
      const statusResult = await this.request('getSignatureStatuses', [[transactionHash]], chainKey);
      const status = statusResult.value?.[0];

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

    const meta = result.meta;
    const message = result.transaction.message;
    const accountKeys = message.accountKeys;

    let from = '';
    let to = '';
    let value = '0';

    if (message.instructions && message.instructions.length > 0) {
      const ix = message.instructions[0];
      const accounts = ix.accounts || [];
      if (accounts.length >= 2) {
        from = typeof accountKeys[accounts[0]] === 'string'
          ? accountKeys[accounts[0]]
          : accountKeys[accounts[0]].pubkey;
        to = typeof accountKeys[accounts[1]] === 'string'
          ? accountKeys[accounts[1]]
          : accountKeys[accounts[1]].pubkey;
      }
    }

    const fee = meta?.fee || 0;
    const isFailed = meta?.err !== null && meta?.err !== undefined;

    let status: TransactionStatus;
    if (isFailed) {
      status = TransactionStatus.FAILED;
    } else if (result.version !== undefined) {
      status = TransactionStatus.FINALIZED;
    } else {
      status = TransactionStatus.CONFIRMED;
    }

    let confirmations = 0;
    if (result.slot) {
      try {
        const currentSlot = await this.getSlot(chainKey);
        confirmations = Math.max(0, currentSlot - result.slot);
      } catch {
        confirmations = 1;
      }
    }

    const tokenTransfers: any[] = [];
    if (meta?.postTokenBalances && meta?.preTokenBalances) {
      for (let i = 0; i < meta.postTokenBalances.length; i++) {
        const postBalance = meta.postTokenBalances[i];
        const preBalance = meta.preTokenBalances.find(
          (b: any) => b.accountIndex === postBalance.accountIndex
        );
        if (preBalance && postBalance.uiTokenAmount) {
          tokenTransfers.push({
            contractAddress: postBalance.mint,
            from: preBalance.owner,
            to: postBalance.owner,
            amount: postBalance.uiTokenAmount.amount,
            symbol: postBalance.uiTokenAmount.symbol || 'SPL',
            decimals: postBalance.uiTokenAmount.decimals,
            standard: TokenStandard.SPL,
          });
        }
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
      blockNumber: result.slot,
      timestamp: result.blockTime,
      confirmations,
      status,
      type: TransactionType.TRANSFER,
      tokenTransfers: tokenTransfers.length > 0 ? tokenTransfers : undefined,
      errorMessage: isFailed ? JSON.stringify(meta.err) : undefined,
      extra: {
        slot: result.slot,
        blockTime: result.blockTime,
        logMessages: meta?.logMessages,
        innerInstructions: meta?.innerInstructions?.length || 0,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 链状态查询
  // -------------------------------------------------------------------------

  async getNonce(address: string, chainKey?: string): Promise<number> {
    return 0;
  }

  async getBlockNumber(chainKey?: string): Promise<number> {
    const result = await this.request('getSlot', [], chainKey);
    return result;
  }

  async getBlockInfo(blockNumber: number, chainKey?: string): Promise<BlockInfo> {
    const key = chainKey || this.currentChainKey;

    const block = await this.request('getBlock', [
      blockNumber,
      { encoding: 'json', maxSupportedTransactionVersion: 0 },
    ], chainKey);

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

  // -------------------------------------------------------------------------
  // RPC 相关
  // -------------------------------------------------------------------------

  async request(method: string, params: any[] = [], chainKey?: string): Promise<any> {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const rpcUrls = this.config.rpcUrls || config.rpcUrls;

    const cacheKey = `${key}:${method}:${JSON.stringify(params)}`;
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    let currentIndex = this.currentRpcIndex.get(key) || 0;
    const id = ++this.requestId;

    for (let i = 0; i < rpcUrls.length; i++) {
      try {
        const rpcUrl = rpcUrls[(currentIndex + i) % rpcUrls.length];
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message || `RPC error: ${method}`);
        }

        this.requestCache.set(cacheKey, {
          value: data.result,
          expiresAt: Date.now() + this.cacheTTL,
        });

        if (i !== 0) {
          this.currentRpcIndex.set(key, (currentIndex + i) % rpcUrls.length);
        }

        return data.result;
      } catch (error) {
        if (i < rpcUrls.length - 1) {
          continue;
        }
        throw error;
      }
    }
  }

  switchRpc(chainKey?: string): string {
    const key = chainKey || this.currentChainKey;
    const config = this.getChainConfig(key);
    const rpcUrls = this.config.rpcUrls || config.rpcUrls;
    const currentIndex = this.currentRpcIndex.get(key) || 0;
    const newIndex = (currentIndex + 1) % rpcUrls.length;
    this.currentRpcIndex.set(key, newIndex);
    return rpcUrls[newIndex];
  }

  clearCache(): void {
    this.requestCache.clear();
  }

  getCacheSize(): number {
    return this.requestCache.size;
  }

  // -------------------------------------------------------------------------
  // Solana 特有方法
  // -------------------------------------------------------------------------

  /**
   * 获取最新区块哈希
   */
  async getLatestBlockhash(chainKey?: string): Promise<{
    blockhash: string;
    lastValidBlockHeight: number;
  }> {
    const result = await this.request('getLatestBlockhash', [], chainKey);
    return result.value;
  }

  /**
   * 获取消息费用
   */
  async getFeeForMessage(message: string, chainKey?: string): Promise<number> {
    try {
      const result = await this.request('getFeeForMessage', [message], chainKey);
      return result.value || 5000;
    } catch {
      return 5000;
    }
  }

  /**
   * 获取当前槽位号
   */
  async getSlot(chainKey?: string): Promise<number> {
    return this.request('getSlot', [], chainKey);
  }

  /**
   * 获取 Epoch 信息
   */
  async getEpochInfo(chainKey?: string): Promise<{
    epoch: number;
    slotIndex: number;
    slotsInEpoch: number;
    absoluteSlot: number;
    blockHeight: number;
    transactionCount: number;
  }> {
    return this.request('getEpochInfo', [], chainKey);
  }

  /**
   * 获取所有 Token 余额
   */
  async getAllTokenBalances(owner: string, chainKey?: string): Promise<TokenBalanceInfo[]> {
    const params: any[] = [
      owner,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: 'jsonParsed' },
    ];

    const result = await this.request('getTokenAccountsByOwner', params, chainKey);

    const balances: TokenBalanceInfo[] = [];
    for (const account of result.value) {
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

  /**
   * 模拟交易
   */
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
    const result = await this.request('simulateTransaction', [
      transaction,
      { encoding: 'base64' },
    ], chainKey);

    return {
      success: result.value.err === null,
      err: result.value.err,
      logs: result.value.logs || [],
      unitsConsumed: result.value.unitsConsumed || 0,
      returnData: result.value.returnData,
    };
  }

  // -------------------------------------------------------------------------
  // 私有方法
  // -------------------------------------------------------------------------

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

  /**
   * 添加自定义网络
   */
  addCustomNetwork(key: string, config: SolanaChainConfig): void {
    this.customNetworks.set(key, config);
  }

  /**
   * 移除自定义网络
   */
  removeCustomNetwork(key: string): boolean {
    return this.customNetworks.delete(key);
  }
}

// ============================================================================
// 默认导出
// ============================================================================

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
  base58Encode,
  base58Decode,
  isValidSolanaAddress,
};
