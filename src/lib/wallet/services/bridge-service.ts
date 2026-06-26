/**
 * 跨链桥服务
 *
 * 支持的桥接协议：
 *  - LayerZero
 *  - Wormhole
 *  - Arbitrum Bridge
 *  - Optimism Bridge
 *  - Polygon Bridge
 *  - BSC Bridge (Multichain)
 *  - Avalanche Bridge
 *  - Cosmos IBC
 *  - Solana Wormhole
 *  - Stargate
 *
 * 功能：
 *  - 支持的链查询
 *  - 桥接费用预估
 *  - 桥接时间预估
 *  - 桥接交易创建
 *  - 桥接状态追踪
 *  - 桥接历史
 *  - 桥接推荐
 *  - 跨链消息传递
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface BridgeQuote {
  id: string;
  bridge: BridgeProtocol;
  fromChain: BridgeChain;
  toChain: BridgeChain;
  fromToken: BridgeToken;
  toToken: BridgeToken;
  fromAmount: string;
  fromAmountFormatted: string;
  toAmount: string;
  toAmountFormatted: string;
  fee: string;
  feeFormatted: string;
  feeUsd?: string;
  gasFee?: string;
  gasFeeFormatted?: string;
  gasFeeUsd?: string;
  totalFee?: string;
  totalFeeFormatted?: string;
  slippage: number;
  minToAmount?: string;
  minToAmountFormatted?: string;
  estimatedTime: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  exchangeRate: string;
  priceImpact: number;
  receiver: string;
  isApprovalRequired: boolean;
  approvalAmount?: string;
  txData?: string;
  txTo?: string;
  txValue?: string;
  bridgeFee?: string;
  liquidityFee?: string;
  protocolFee?: string;
  relayerFee?: string;
  destinationTxGas?: string;
}

export interface BridgeChain {
  id: string;
  name: string;
  chainId: number;
  chainType: 'evm' | 'solana' | 'cosmos' | 'bitcoin';
  logoURI?: string;
  nativeSymbol: string;
  nativeDecimals: number;
  supported: boolean;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  minAmount?: string;
  maxAmount?: string;
  dailyLimit?: string;
  confirmations: number;
  avgBlockTime: number;
}

export interface BridgeToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  isNative?: boolean;
  isWrapped?: boolean;
  underlyingToken?: string;
  canonical?: boolean;
}

export type BridgeProtocol =
  | 'layerzero'
  | 'wormhole'
  | 'arbitrum_bridge'
  | 'optimism_bridge'
  | 'polygon_bridge'
  | 'bsc_bridge'
  | 'avalanche_bridge'
  | 'cosmos_ibc'
  | 'stargate'
  | 'multichain'
  | 'synapse'
  | 'hop'
  | 'across'
  | 'socket'
  | 'li.fi'
  | 'xy_finance';

export interface BridgeTransaction {
  id: string;
  bridge: BridgeProtocol;
  fromChain: string;
  toChain: string;
  fromToken: BridgeToken;
  toToken: BridgeToken;
  fromAmount: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  status: BridgeStatus;
  sourceTxHash?: string;
  destTxHash?: string;
  sourceBlockNumber?: number;
  destBlockNumber?: number;
  fee: string;
  feeUsd?: string;
  gasFee?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  estimatedCompletionTime?: number;
  currentStep?: number;
  totalSteps: number;
  steps?: BridgeStep[];
  error?: string;
  revertReason?: string;
}

export type BridgeStatus =
  | 'pending'
  | 'initiated'
  | 'source_confirmed'
  | 'bridge_processing'
  | 'destination_pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface BridgeStep {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description: string;
  txHash?: string;
  timestamp?: number;
  chain?: string;
}

export interface BridgeHistoryOptions {
  address?: string;
  fromChain?: string;
  toChain?: string;
  bridge?: BridgeProtocol;
  status?: BridgeStatus;
  startDate?: number;
  endDate?: number;
  page?: number;
  pageSize?: number;
}

export interface BridgeStats {
  totalBridges: number;
  totalVolume: string;
  totalFees: string;
  avgTime: number;
  successRate: number;
  byBridge: Record<string, number>;
  byChain: Record<string, number>;
}

export interface BridgeProvider {
  id: string;
  name: string;
  logoURI?: string;
  description: string;
  supportedChains: string[];
  supportedTokens: string[];
  feeStructure: 'fixed' | 'percentage' | 'dynamic';
  minFee?: string;
  maxFee?: string;
  feePercentage?: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  securityScore: number;
  liquidityScore: number;
  userScore: number;
  totalVolume: string;
  totalTransactions: number;
  isVerified: boolean;
  website?: string;
  docsUrl?: string;
  tags: string[];
}

export interface BridgeRoute {
  fromChain: string;
  toChain: string;
  token: string;
  bridges: BridgeProvider[];
  bestQuote?: BridgeQuote;
}

// ============================================================================
// 支持的链
// ============================================================================

export const BRIDGE_CHAINS: BridgeChain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    chainType: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 12,
    avgBlockTime: 12,
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    chainId: 56,
    chainType: 'evm',
    nativeSymbol: 'BNB',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 15,
    avgBlockTime: 3,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    chainType: 'evm',
    nativeSymbol: 'MATIC',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 128,
    avgBlockTime: 2.1,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    chainType: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 60,
    avgBlockTime: 0.25,
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    chainType: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 60,
    avgBlockTime: 2,
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    chainId: 43114,
    chainType: 'evm',
    nativeSymbol: 'AVAX',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 30,
    avgBlockTime: 2,
  },
  {
    id: 'fantom',
    name: 'Fantom',
    chainId: 250,
    chainType: 'evm',
    nativeSymbol: 'FTM',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 10,
    avgBlockTime: 1,
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    chainType: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 60,
    avgBlockTime: 2,
  },
  {
    id: 'solana',
    name: 'Solana',
    chainId: 0,
    chainType: 'solana',
    nativeSymbol: 'SOL',
    nativeDecimals: 9,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 32,
    avgBlockTime: 0.4,
  },
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    chainId: 0,
    chainType: 'cosmos',
    nativeSymbol: 'ATOM',
    nativeDecimals: 6,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 10,
    avgBlockTime: 6,
  },
  {
    id: 'osmosis',
    name: 'Osmosis',
    chainId: 0,
    chainType: 'cosmos',
    nativeSymbol: 'OSMO',
    nativeDecimals: 6,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 10,
    avgBlockTime: 6,
  },
  {
    id: 'tron',
    name: 'TRON',
    chainId: 0,
    chainType: 'evm',
    nativeSymbol: 'TRX',
    nativeDecimals: 6,
    supported: true,
    depositEnabled: true,
    withdrawEnabled: true,
    confirmations: 19,
    avgBlockTime: 3,
  },
];

// ============================================================================
// 桥接提供商
// ============================================================================

export const BRIDGE_PROVIDERS: BridgeProvider[] = [
  {
    id: 'layerzero',
    name: 'LayerZero',
    description: '全链互操作性协议',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'base'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'BNB', 'MATIC', 'AVAX', 'FTM'],
    feeStructure: 'dynamic',
    avgTime: 120,
    minTime: 60,
    maxTime: 300,
    securityScore: 95,
    liquidityScore: 90,
    userScore: 85,
    totalVolume: '10000000000',
    totalTransactions: 5000000,
    isVerified: true,
    website: 'https://layerzero.network',
    tags: ['Omnichain', 'Message Passing', 'Verified'],
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    description: '通用消息传递协议',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'solana', 'base'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'BNB', 'MATIC', 'AVAX', 'FTM', 'SOL'],
    feeStructure: 'percentage',
    feePercentage: 0.001,
    avgTime: 600,
    minTime: 300,
    maxTime: 1800,
    securityScore: 85,
    liquidityScore: 80,
    userScore: 75,
    totalVolume: '5000000000',
    totalTransactions: 2000000,
    isVerified: true,
    website: 'https://wormhole.com',
    tags: ['Multi-chain', 'NFT Bridge', 'Governance'],
  },
  {
    id: 'stargate',
    name: 'Stargate',
    description: 'LayerZero 原生资产桥',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'base'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC'],
    feeStructure: 'fixed',
    minFee: '1',
    avgTime: 300,
    minTime: 60,
    maxTime: 900,
    securityScore: 92,
    liquidityScore: 95,
    userScore: 88,
    totalVolume: '8000000000',
    totalTransactions: 3000000,
    isVerified: true,
    website: 'https://stargate.finance',
    tags: ['Stablecoin', 'Native Asset', 'Unified Liquidity'],
  },
  {
    id: 'arbitrum_bridge',
    name: 'Arbitrum Bridge',
    description: 'Arbitrum 官方桥',
    supportedChains: ['ethereum', 'arbitrum'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'ARB'],
    feeStructure: 'fixed',
    avgTime: 604800,
    minTime: 86400,
    maxTime: 604800,
    securityScore: 98,
    liquidityScore: 100,
    userScore: 90,
    totalVolume: '20000000000',
    totalTransactions: 10000000,
    isVerified: true,
    website: 'https://bridge.arbitrum.io',
    tags: ['Official', 'Rollup', 'Fast Withdrawal Available'],
  },
  {
    id: 'optimism_bridge',
    name: 'Optimism Bridge',
    description: 'Optimism 官方桥',
    supportedChains: ['ethereum', 'optimism'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'OP'],
    feeStructure: 'fixed',
    avgTime: 604800,
    minTime: 86400,
    maxTime: 604800,
    securityScore: 98,
    liquidityScore: 100,
    userScore: 88,
    totalVolume: '15000000000',
    totalTransactions: 8000000,
    isVerified: true,
    website: 'https://app.optimism.io/bridge',
    tags: ['Official', 'Rollup', 'Fast Withdrawal Available'],
  },
  {
    id: 'polygon_bridge',
    name: 'Polygon Bridge',
    description: 'Polygon 官方桥',
    supportedChains: ['ethereum', 'polygon'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'MATIC'],
    feeStructure: 'fixed',
    avgTime: 10800,
    minTime: 3600,
    maxTime: 21600,
    securityScore: 95,
    liquidityScore: 95,
    userScore: 85,
    totalVolume: '12000000000',
    totalTransactions: 6000000,
    isVerified: true,
    website: 'https://wallet.polygon.technology/polygon/bridge',
    tags: ['Official', 'PoS', 'Plasma'],
  },
  {
    id: 'across',
    name: 'Across',
    description: '快速跨链桥',
    supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'WBTC', 'UMA'],
    feeStructure: 'dynamic',
    avgTime: 120,
    minTime: 30,
    maxTime: 600,
    securityScore: 88,
    liquidityScore: 85,
    userScore: 82,
    totalVolume: '3000000000',
    totalTransactions: 1500000,
    isVerified: true,
    website: 'https://across.to',
    tags: ['Fast', 'Optimistic', 'Cheap'],
  },
  {
    id: 'hop',
    name: 'Hop Protocol',
    description: '快速代币桥接协议',
    supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'gnosis'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'MATIC', 'DAI'],
    feeStructure: 'percentage',
    feePercentage: 0.003,
    avgTime: 600,
    minTime: 120,
    maxTime: 1800,
    securityScore: 85,
    liquidityScore: 80,
    userScore: 78,
    totalVolume: '2500000000',
    totalTransactions: 1200000,
    isVerified: true,
    website: 'https://hop.exchange',
    tags: ['Fast', 'AMM-based'],
  },
  {
    id: 'multichain',
    name: 'Multichain',
    description: '多链跨链路由协议',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'base'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'BNB', 'MATIC', 'AVAX', 'FTM'],
    feeStructure: 'percentage',
    feePercentage: 0.005,
    avgTime: 1800,
    minTime: 600,
    maxTime: 3600,
    securityScore: 70,
    liquidityScore: 85,
    userScore: 72,
    totalVolume: '6000000000',
    totalTransactions: 4000000,
    isVerified: false,
    website: 'https://multichain.org',
    tags: ['Most Chains', 'Routers', 'AnyCall'],
  },
  {
    id: 'li.fi',
    name: 'LI.FI',
    description: '跨链聚合器',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'base', 'solana'],
    supportedTokens: ['ETH', 'USDC', 'USDT', 'BTC', 'BNB', 'MATIC', 'AVAX'],
    feeStructure: 'dynamic',
    avgTime: 900,
    minTime: 120,
    maxTime: 3600,
    securityScore: 82,
    liquidityScore: 90,
    userScore: 80,
    totalVolume: '4000000000',
    totalTransactions: 2000000,
    isVerified: true,
    website: 'https://li.fi',
    tags: ['Aggregator', 'Best Rate', 'Dex Integration'],
  },
];

// ============================================================================
// 跨链桥服务
// ============================================================================

export class BridgeService {
  private chains: Map<string, BridgeChain> = new Map();
  private providers: Map<string, BridgeProvider> = new Map();
  private transactions: BridgeTransaction[] = [];
  private quotes: Map<string, BridgeQuote> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 1000;
  private defaultSlippage: number = 0.5;

  constructor() {
    this.initializeChains();
    this.initializeProviders();
  }

  private initializeChains(): void {
    for (const chain of BRIDGE_CHAINS) {
      this.chains.set(chain.id, chain);
    }
  }

  private initializeProviders(): void {
    for (const provider of BRIDGE_PROVIDERS) {
      this.providers.set(provider.id, provider);
    }
  }

  // ========================================================================
  // 链管理
  // ========================================================================

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): BridgeChain[] {
    return BRIDGE_CHAINS.filter((c) => c.supported);
  }

  /**
   * 获取链信息
   */
  getChain(chainId: string): BridgeChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * 获取可以从指定链桥接的目标链
   */
  getDestinationChains(fromChain: string, token?: string): BridgeChain[] {
    const destinations: BridgeChain[] = [];
    for (const provider of this.providers.values()) {
      if (!provider.supportedChains.includes(fromChain)) continue;
      for (const chainId of provider.supportedChains) {
        if (chainId === fromChain) continue;
        const chain = this.chains.get(chainId);
        if (chain && !destinations.find((d) => d.id === chainId)) {
          destinations.push(chain);
        }
      }
    }
    return destinations.sort((a, b) => a.name.localeCompare(b.name));
  }

  // ========================================================================
  // 桥接报价
  // ========================================================================

  /**
   * 获取最佳报价
   */
  async getBestQuote(
    fromChain: string,
    toChain: string,
    token: string,
    amount: string,
    options: {
      slippage?: number;
      preferredBridges?: BridgeProtocol[];
    } = {}
  ): Promise<BridgeQuote | null> {
    const quotes = await this.getAllQuotes(fromChain, toChain, token, amount, options);
    if (quotes.length === 0) return null;
    return quotes[0];
  }

  /**
   * 获取所有桥接报价
   */
  async getAllQuotes(
    fromChain: string,
    toChain: string,
    token: string,
    amount: string,
    options: {
      slippage?: number;
      preferredBridges?: BridgeProtocol[];
    } = {}
  ): Promise<BridgeQuote[]> {
    const cacheKey = `quote:${fromChain}:${toChain}:${token}:${amount}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const slippage = options.slippage ?? this.defaultSlippage;
    const quotes: BridgeQuote[] = [];

    for (const provider of this.providers.values()) {
      if (!provider.supportedChains.includes(fromChain)) continue;
      if (!provider.supportedChains.includes(toChain)) continue;
      if (!provider.supportedTokens.includes(token)) continue;

      if (options.preferredBridges && options.preferredBridges.length > 0) {
        if (!options.preferredBridges.includes(provider.id as BridgeProtocol)) continue;
      }

      try {
        const quote = this.generateQuote(
          provider,
          fromChain,
          toChain,
          token,
          amount,
          slippage
        );
        if (quote) {
          quotes.push(quote);
        }
      } catch (e) {
        console.error(`Failed to get quote from ${provider.name}:`, e);
      }
    }

    quotes.sort((a, b) => {
      const aToAmount = parseFloat(a.toAmountFormatted);
      const bToAmount = parseFloat(b.toAmountFormatted);
      return bToAmount - aToAmount;
    });

    this.cache.set(cacheKey, { data: quotes, timestamp: Date.now() });
    return quotes;
  }

  private generateQuote(
    provider: BridgeProvider,
    fromChainId: string,
    toChainId: string,
    tokenSymbol: string,
    amount: string,
    slippage: number
  ): BridgeQuote | null {
    const fromChain = this.chains.get(fromChainId);
    const toChain = this.chains.get(toChainId);
    if (!fromChain || !toChain) return null;

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return null;

    let feeRate = 0.003;
    if (provider.feePercentage) {
      feeRate = provider.feePercentage;
    } else if (provider.id === 'stargate') {
      feeRate = 0.001;
    } else if (provider.id === 'across') {
      feeRate = 0.002;
    } else if (provider.id === 'li.fi') {
      feeRate = 0.005;
    }

    const fee = amountNum * feeRate;
    const toAmount = amountNum - fee;
    const minToAmount = toAmount * (1 - slippage / 100);

    const fromToken: BridgeToken = {
      address: tokenSymbol === fromChain.nativeSymbol ? '0x0000000000000000000000000000000000000000' : '',
      symbol: tokenSymbol,
      name: tokenSymbol,
      decimals: tokenSymbol === fromChain.nativeSymbol ? fromChain.nativeDecimals : 18,
      chainId: fromChain.chainId,
      isNative: tokenSymbol === fromChain.nativeSymbol,
    };

    const toToken: BridgeToken = {
      address: tokenSymbol === toChain.nativeSymbol ? '0x0000000000000000000000000000000000000000' : '',
      symbol: tokenSymbol,
      name: tokenSymbol,
      decimals: tokenSymbol === toChain.nativeSymbol ? toChain.nativeDecimals : 18,
      chainId: toChain.chainId,
      isNative: tokenSymbol === toChain.nativeSymbol,
      isWrapped: fromChain.chainType !== toChain.chainType,
    };

    const quote: BridgeQuote = {
      id: `quote_${Date.now()}_${provider.id}`,
      bridge: provider.id as BridgeProtocol,
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount: amount,
      fromAmountFormatted: this.formatAmount(amount, fromToken.decimals),
      toAmount: toAmount.toString(),
      toAmountFormatted: toAmount.toFixed(6),
      fee: fee.toString(),
      feeFormatted: fee.toFixed(6),
      slippage,
      minToAmount: minToAmount.toString(),
      minToAmountFormatted: minToAmount.toFixed(6),
      estimatedTime: provider.avgTime,
      estimatedTimeMin: provider.minTime,
      estimatedTimeMax: provider.maxTime,
      exchangeRate: (toAmount / amountNum).toFixed(6),
      priceImpact: feeRate * 100,
      receiver: '',
      isApprovalRequired: !fromToken.isNative,
      totalFee: fee.toString(),
      totalFeeFormatted: fee.toFixed(6),
    };

    this.quotes.set(quote.id, quote);
    return quote;
  }

  // ========================================================================
  // 桥接交易
  // ========================================================================

  /**
   * 发起桥接
   */
  async initiateBridge(
    quoteId: string,
    fromAddress: string,
    toAddress: string
  ): Promise<BridgeTransaction> {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    const tx: BridgeTransaction = {
      id: `bridge_${Date.now()}`,
      bridge: quote.bridge,
      fromChain: quote.fromChain.id,
      toChain: quote.toChain.id,
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      fromAmount: quote.fromAmount,
      toAmount: quote.toAmount,
      fromAddress,
      toAddress,
      status: 'initiated',
      fee: quote.fee,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalSteps: 4,
      currentStep: 1,
      steps: [
        { id: 1, name: '源链确认', status: 'active', description: '等待源链交易确认', chain: quote.fromChain.id },
        { id: 2, name: '桥接处理', status: 'pending', description: '跨链消息传递中', chain: 'bridge' },
        { id: 3, name: '目标链处理', status: 'pending', description: '在目标链上执行交易', chain: quote.toChain.id },
        { id: 4, name: '完成', status: 'pending', description: '桥接完成', chain: quote.toChain.id },
      ],
      estimatedCompletionTime: Date.now() + quote.estimatedTime * 1000,
    };

    this.transactions.unshift(tx);
    return tx;
  }

  /**
   * 获取交易状态
   */
  async getBridgeTransaction(txId: string): Promise<BridgeTransaction | null> {
    const tx = this.transactions.find((t) => t.id === txId);
    if (!tx) return null;

    this.updateTransactionStatus(tx);
    return tx;
  }

  private updateTransactionStatus(tx: BridgeTransaction): void {
    const elapsed = Date.now() - tx.createdAt;
    const totalTime = tx.estimatedCompletionTime ? tx.estimatedCompletionTime - tx.createdAt : 300000;
    const progress = Math.min(1, elapsed / totalTime);

    if (progress < 0.25) {
      tx.status = 'initiated';
      tx.currentStep = 1;
    } else if (progress < 0.5) {
      tx.status = 'source_confirmed';
      tx.currentStep = 2;
      if (tx.steps && tx.steps[0]) {
        tx.steps[0].status = 'completed';
        tx.steps[0].timestamp = tx.createdAt + totalTime * 0.2;
        tx.steps[1].status = 'active';
      }
    } else if (progress < 0.85) {
      tx.status = 'bridge_processing';
      tx.currentStep = 3;
      if (tx.steps) {
        tx.steps[0].status = 'completed';
        tx.steps[1].status = 'completed';
        tx.steps[2].status = 'active';
      }
    } else if (progress < 1) {
      tx.status = 'destination_pending';
      tx.currentStep = 3;
      if (tx.steps) {
        tx.steps[2].status = 'active';
      }
    } else {
      tx.status = 'completed';
      tx.currentStep = 4;
      tx.completedAt = tx.estimatedCompletionTime;
      if (tx.steps) {
        tx.steps.forEach((s) => (s.status = 'completed'));
      }
    }

    tx.updatedAt = Date.now();
  }

  // ========================================================================
  // 历史记录
  // ========================================================================

  /**
   * 获取桥接历史
   */
  getBridgeHistory(options: BridgeHistoryOptions = {}): { transactions: BridgeTransaction[]; total: number } {
    let transactions = [...this.transactions];

    if (options.address) {
      const addr = options.address.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.fromAddress.toLowerCase() === addr ||
          t.toAddress.toLowerCase() === addr
      );
    }
    if (options.fromChain) {
      transactions = transactions.filter((t) => t.fromChain === options.fromChain);
    }
    if (options.toChain) {
      transactions = transactions.filter((t) => t.toChain === options.toChain);
    }
    if (options.bridge) {
      transactions = transactions.filter((t) => t.bridge === options.bridge);
    }
    if (options.status) {
      transactions = transactions.filter((t) => t.status === options.status);
    }
    if (options.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= options.startDate!);
    }
    if (options.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= options.endDate!);
    }

    const total = transactions.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    transactions = transactions.slice(start, end);

    return { transactions, total };
  }

  // ========================================================================
  // 提供商
  // ========================================================================

  /**
   * 获取所有桥接提供商
   */
  getProviders(): BridgeProvider[] {
    return BRIDGE_PROVIDERS;
  }

  /**
   * 获取提供商信息
   */
  getProvider(providerId: string): BridgeProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * 推荐最佳桥接
   */
  recommendBridge(
    fromChain: string,
    toChain: string,
    token: string,
    amount: string
  ): BridgeProvider[] {
    const available = BRIDGE_PROVIDERS.filter(
      (p) =>
        p.supportedChains.includes(fromChain) &&
        p.supportedChains.includes(toChain) &&
        p.supportedTokens.includes(token)
    );

    return available.sort((a, b) => {
      const aScore = a.securityScore * 0.4 + a.liquidityScore * 0.3 + a.userScore * 0.3;
      const bScore = b.securityScore * 0.4 + b.liquidityScore * 0.3 + b.userScore * 0.3;
      return bScore - aScore;
    });
  }

  // ========================================================================
  // 统计
  // ========================================================================

  getStats(): BridgeStats {
    const txs = this.transactions.filter((t) => t.status === 'completed');
    let totalVolume = 0;
    let totalFees = 0;
    let totalTime = 0;

    for (const tx of txs) {
      totalVolume += parseFloat(tx.fromAmount);
      totalFees += parseFloat(tx.fee);
      if (tx.completedAt) {
        totalTime += (tx.completedAt - tx.createdAt) / 1000;
      }
    }

    const byBridge: Record<string, number> = {};
    const byChain: Record<string, number> = {};

    for (const tx of this.transactions) {
      byBridge[tx.bridge] = (byBridge[tx.bridge] || 0) + 1;
      byChain[tx.fromChain] = (byChain[tx.fromChain] || 0) + 1;
      byChain[tx.toChain] = (byChain[tx.toChain] || 0) + 1;
    }

    return {
      totalBridges: this.transactions.length,
      totalVolume: totalVolume.toFixed(6),
      totalFees: totalFees.toFixed(6),
      avgTime: txs.length > 0 ? totalTime / txs.length : 0,
      successRate: this.transactions.length > 0 ? (txs.length / this.transactions.length) * 100 : 0,
      byBridge,
      byChain,
    };
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private formatAmount(amount: string, decimals: number): string {
    const num = parseFloat(amount);
    if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(4);
    return num.toFixed(decimals > 6 ? 6 : decimals);
  }

  /**
   * 格式化时间
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.ceil(seconds)} 秒`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)} 分钟`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} 小时`;
    return `${(seconds / 86400).toFixed(1)} 天`;
  }

  /**
   * 设置默认滑点
   */
  setDefaultSlippage(slippage: number): void {
    this.defaultSlippage = slippage;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.quotes.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  BridgeService,
  BRIDGE_CHAINS,
  BRIDGE_PROVIDERS,
};
