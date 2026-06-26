/**
 * Token 资产管理模块
 *
 * 功能：
 *  - Token 列表管理（添加/删除/收藏）
 *  - Token 余额查询（多链）
 *  - Token 价格查询
 *  - Token 转账
 *  - Token 授权（Approve）
 *  - Token 信息缓存
 *  - 自定义 Token 添加
 *  - Token 搜索
 *  - 资产组合计算
 *  - 交易记录
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  chainKey: string;
  logoURI?: string;
  isNative?: boolean;
  isVerified?: boolean;
  isStablecoin?: boolean;
  isPopular?: boolean;
  tags?: string[];
  description?: string;
  website?: string;
  explorer?: string;
  socials?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    medium?: string;
    github?: string;
  };
  marketCap?: string;
  totalSupply?: string;
  circulatingSupply?: string;
}

export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  formatted: string;
  usdPrice?: string;
  usdValue?: string;
  priceChange24h?: number;
  priceChange7d?: number;
}

export interface TokenTransferParams {
  token: TokenInfo;
  to: string;
  amount: string;
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
}

export interface TokenApproveParams {
  token: TokenInfo;
  spender: string;
  amount: string;
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
}

export interface TokenTransferResult {
  hash: string;
  from: string;
  to: string;
  token: TokenInfo;
  amount: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

export interface PortfolioSummary {
  totalValue: string;
  totalValueChange24h: string;
  totalValueChangePercent24h: number;
  bestPerformer?: TokenBalance;
  worstPerformer?: TokenBalance;
  chainBreakdown: Record<string, string>;
  tokenCount: number;
  nftCount?: number;
  stakedValue?: string;
  earnedValue?: string;
}

export interface TokenTransaction {
  hash: string;
  from: string;
  to: string;
  token: TokenInfo;
  amount: string;
  value?: string;
  type: 'transfer' | 'receive' | 'approve' | 'swap' | 'mint' | 'burn';
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp?: number;
  fee?: string;
}

export interface TokenSearchResult {
  token: TokenInfo;
  matchScore: number;
  matchedFields: string[];
}

// ============================================================================
// 常用 Token 列表
// ============================================================================

export const POPULAR_TOKENS: Record<string, TokenInfo[]> = {
  ethereum: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true,
      isVerified: true,
      isPopular: true,
      tags: ['native', 'layer1'],
      description: 'Ethereum is the world\'s most programmable blockchain.',
      website: 'https://ethereum.org',
      explorer: 'https://etherscan.io',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
      tags: ['stablecoin'],
      description: 'Tether is a stablecoin pegged to the US Dollar.',
      website: 'https://tether.to',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
      tags: ['stablecoin'],
      description: 'USD Coin is a fully reserved digital dollar.',
      website: 'https://www.centre.io',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      isVerified: true,
      isPopular: true,
      tags: ['wrapped'],
      description: 'Wrapped Bitcoin is a tokenized version of Bitcoin.',
      website: 'https://wbtc.network',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
      tags: ['stablecoin', 'defi'],
      description: 'Dai is a decentralized stablecoin.',
      website: 'https://makerdao.com',
    },
    {
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      isVerified: true,
      isPopular: true,
      tags: ['layer2'],
    },
    {
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
      isVerified: true,
      isStablecoin: true,
      tags: ['stablecoin'],
    },
    {
      address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      symbol: 'SHIB',
      name: 'Shiba Inu',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
      isVerified: true,
      isPopular: true,
      tags: ['meme'],
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
      isVerified: true,
      isPopular: true,
      tags: ['defi', 'dex'],
    },
    {
      address: '0x6B3595068778DD592e39A122f4f5a5cf09c90Fe2',
      symbol: 'AAVE',
      name: 'Aave',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
      isVerified: true,
      isPopular: true,
      tags: ['defi', 'lending'],
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      isVerified: true,
      isPopular: true,
      tags: ['wrapped'],
    },
    {
      address: '0xA2cd3D43c775970a767437Ada6855c66f5c5C6D3',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
      isVerified: true,
      isPopular: true,
      tags: ['oracle'],
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK-old',
      name: 'Chainlink Token',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      isVerified: true,
      tags: ['oracle'],
    },
    {
      address: '0x3845badAde8e6dFF049820680d1F14bD35c9844D',
      symbol: 'SAND',
      name: 'The Sandbox',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
      isVerified: true,
      isPopular: true,
      tags: ['metaverse', 'nft'],
    },
    {
      address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
      symbol: 'MANA',
      name: 'Decentraland',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
      isVerified: true,
      isPopular: true,
      tags: ['metaverse', 'nft'],
    },
    {
      address: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
      symbol: 'FTM',
      name: 'Fantom',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
      isVerified: true,
      isPopular: true,
      tags: ['layer1'],
    },
    {
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      symbol: 'MKR',
      name: 'Maker',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
      isVerified: true,
      isPopular: true,
      tags: ['defi'],
    },
    {
      address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      symbol: 'COMP',
      name: 'Compound',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
      isVerified: true,
      isPopular: true,
      tags: ['defi', 'lending'],
    },
    {
      address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
      symbol: 'USDP',
      name: 'Pax Dollar',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/6070/small/pax.png',
      isVerified: true,
      isStablecoin: true,
      tags: ['stablecoin'],
    },
    {
      address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
      symbol: 'SUSHI',
      name: 'Sushi',
      decimals: 18,
      chainId: 1,
      chainKey: 'ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      isVerified: true,
      isPopular: true,
      tags: ['defi', 'dex'],
    },
  ],
  bsc: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      logoURI: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
      isNative: true,
      isVerified: true,
      isPopular: true,
      tags: ['native', 'exchange'],
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      name: 'Binance USD',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isPopular: true,
    },
    {
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      symbol: 'BTCB',
      name: 'BTCB',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isPopular: true,
    },
    {
      address: '0x8fF795a6F4D3fB0F45f99DfF8fF3728f8fF56fF8',
      symbol: 'CAKE',
      name: 'PancakeSwap',
      decimals: 18,
      chainId: 56,
      chainKey: 'bsc',
      isVerified: true,
      isPopular: true,
      tags: ['defi', 'dex'],
    },
  ],
  polygon: [
    {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      chainId: 137,
      chainKey: 'polygon',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      isNative: true,
      isVerified: true,
      isPopular: true,
      tags: ['native', 'layer2'],
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 137,
      chainKey: 'polygon',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 137,
      chainKey: 'polygon',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 137,
      chainKey: 'polygon',
      isVerified: true,
      isPopular: true,
    },
  ],
  solana: [
    {
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      chainId: 0,
      chainKey: 'solana',
      logoURI: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
      isNative: true,
      isVerified: true,
      isPopular: true,
      tags: ['native', 'layer1'],
    },
    {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 0,
      chainKey: 'solana',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
    {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      symbol: 'USDT',
      name: 'Tether',
      decimals: 6,
      chainId: 0,
      chainKey: 'solana',
      isVerified: true,
      isStablecoin: true,
      isPopular: true,
    },
  ],
};

// ============================================================================
// Token 管理器
// ============================================================================

export class TokenManager {
  private tokens: Map<string, TokenInfo> = new Map();
  private balances: Map<string, TokenBalance> = new Map();
  private favorites: Set<string> = new Set();
  private hidden: Set<string> = new Set();
  private priceCache: Map<string, { price: string; timestamp: number }> = new Map();
  private priceCacheTTL: number = 5 * 60 * 1000;

  constructor() {
    this.initializeDefaultTokens();
  }

  private initializeDefaultTokens(): void {
    for (const chainKey of Object.keys(POPULAR_TOKENS)) {
      const tokens = POPULAR_TOKENS[chainKey];
      for (const token of tokens) {
        const key = this.getTokenKey(token.chainKey, token.address);
        this.tokens.set(key, token);
      }
    }
  }

  private getTokenKey(chainKey: string, address: string): string {
    return `${chainKey}:${address.toLowerCase()}`;
  }

  // ========================================================================
  // Token 信息管理
  // ========================================================================

  /**
   * 获取 Token 信息
   */
  getToken(chainKey: string, address: string): TokenInfo | undefined {
    return this.tokens.get(this.getTokenKey(chainKey, address));
  }

  /**
   * 获取指定链的所有 Token
   */
  getTokensByChain(chainKey: string): TokenInfo[] {
    const result: TokenInfo[] = [];
    for (const token of this.tokens.values()) {
      if (token.chainKey === chainKey) {
        result.push(token);
      }
    }
    return result;
  }

  /**
   * 添加自定义 Token
   */
  addToken(token: TokenInfo): boolean {
    const key = this.getTokenKey(token.chainKey, token.address);
    if (this.tokens.has(key)) return false;
    this.tokens.set(key, token);
    return true;
  }

  /**
   * 批量添加 Token
   */
  addTokens(tokens: TokenInfo[]): number {
    let added = 0;
    for (const token of tokens) {
      if (this.addToken(token)) added++;
    }
    return added;
  }

  /**
   * 删除 Token
   */
  removeToken(chainKey: string, address: string): boolean {
    const key = this.getTokenKey(chainKey, address);
    const token = this.tokens.get(key);
    if (!token || token.isVerified) return false;
    this.tokens.delete(key);
    this.balances.delete(key);
    return true;
  }

  /**
   * 更新 Token 信息
   */
  updateToken(chainKey: string, address: string, updates: Partial<TokenInfo>): boolean {
    const key = this.getTokenKey(chainKey, address);
    const existing = this.tokens.get(key);
    if (!existing) return false;
    this.tokens.set(key, { ...existing, ...updates });
    return true;
  }

  // ========================================================================
  // 收藏/隐藏
  // ========================================================================

  /**
   * 收藏 Token
   */
  addFavorite(chainKey: string, address: string): void {
    this.favorites.add(this.getTokenKey(chainKey, address));
  }

  /**
   * 取消收藏
   */
  removeFavorite(chainKey: string, address: string): boolean {
    return this.favorites.delete(this.getTokenKey(chainKey, address));
  }

  /**
   * 是否收藏
   */
  isFavorite(chainKey: string, address: string): boolean {
    return this.favorites.has(this.getTokenKey(chainKey, address));
  }

  /**
   * 获取收藏列表
   */
  getFavorites(): TokenInfo[] {
    const result: TokenInfo[] = [];
    for (const key of this.favorites) {
      const token = this.tokens.get(key);
      if (token) result.push(token);
    }
    return result;
  }

  /**
   * 隐藏 Token
   */
  hideToken(chainKey: string, address: string): void {
    this.hidden.add(this.getTokenKey(chainKey, address));
  }

  /**
   * 显示 Token
   */
  unhideToken(chainKey: string, address: string): boolean {
    return this.hidden.delete(this.getTokenKey(chainKey, address));
  }

  /**
   * 是否隐藏
   */
  isHidden(chainKey: string, address: string): boolean {
    return this.hidden.has(this.getTokenKey(chainKey, address));
  }

  // ========================================================================
  // 余额管理
  // ========================================================================

  /**
   * 设置余额
   */
  setBalance(chainKey: string, address: string, balance: string, price?: string): void {
    const tokenKey = this.getTokenKey(chainKey, address);
    const token = this.tokens.get(tokenKey);
    if (!token) return;

    const formatted = this.formatAmount(balance, token.decimals);
    let usdValue: string | undefined;

    if (price) {
      this.setPrice(chainKey, address, price);
      const priceNum = parseFloat(price);
      const balanceNum = parseFloat(formatted);
      usdValue = (priceNum * balanceNum).toFixed(2);
    }

    this.balances.set(tokenKey, {
      token,
      balance,
      formatted,
      usdPrice: price,
      usdValue,
    });
  }

  /**
   * 获取余额
   */
  getBalance(chainKey: string, address: string): TokenBalance | undefined {
    return this.balances.get(this.getTokenKey(chainKey, address));
  }

  /**
   * 获取所有余额
   */
  getAllBalances(chainKey?: string): TokenBalance[] {
    const result: TokenBalance[] = [];
    for (const balance of this.balances.values()) {
      if (chainKey && balance.token.chainKey !== chainKey) continue;
      if (this.hidden.has(this.getTokenKey(balance.token.chainKey, balance.token.address))) continue;
      result.push(balance);
    }
    return result.sort((a, b) => {
      const aVal = parseFloat(a.usdValue || '0');
      const bVal = parseFloat(b.usdValue || '0');
      return bVal - aVal;
    });
  }

  /**
   * 清除余额缓存
   */
  clearBalances(chainKey?: string): void {
    if (chainKey) {
      for (const key of this.balances.keys()) {
        if (key.startsWith(chainKey + ':')) {
          this.balances.delete(key);
        }
      }
    } else {
      this.balances.clear();
    }
  }

  // ========================================================================
  // 价格管理
  // ========================================================================

  /**
   * 设置价格
   */
  setPrice(chainKey: string, address: string, price: string): void {
    this.priceCache.set(this.getTokenKey(chainKey, address), {
      price,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取价格
   */
  getPrice(chainKey: string, address: string): string | undefined {
    const cached = this.priceCache.get(this.getTokenKey(chainKey, address));
    if (!cached) return undefined;
    if (Date.now() - cached.timestamp > this.priceCacheTTL) return undefined;
    return cached.price;
  }

  /**
   * 清除价格缓存
   */
  clearPriceCache(): void {
    this.priceCache.clear();
  }

  // ========================================================================
  // 搜索
  // ========================================================================

  /**
   * 搜索 Token
   */
  search(query: string, chainKey?: string): TokenSearchResult[] {
    const queryLower = query.toLowerCase();
    const results: TokenSearchResult[] = [];

    for (const token of this.tokens.values()) {
      if (chainKey && token.chainKey !== chainKey) continue;

      const matchedFields: string[] = [];
      let score = 0;

      if (token.symbol.toLowerCase() === queryLower) {
        score += 100;
        matchedFields.push('symbol_exact');
      } else if (token.symbol.toLowerCase().includes(queryLower)) {
        score += 50;
        matchedFields.push('symbol');
      }

      if (token.name.toLowerCase() === queryLower) {
        score += 80;
        matchedFields.push('name_exact');
      } else if (token.name.toLowerCase().includes(queryLower)) {
        score += 30;
        matchedFields.push('name');
      }

      if (token.address.toLowerCase() === queryLower) {
        score += 90;
        matchedFields.push('address');
      }

      if (token.tags) {
        for (const tag of token.tags) {
          if (tag.toLowerCase().includes(queryLower)) {
            score += 10;
            matchedFields.push('tag:' + tag);
          }
        }
      }

      if (score > 0) {
        results.push({ token, matchScore: score, matchedFields });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  // ========================================================================
  // 资产组合
  // ========================================================================

  /**
   * 计算资产组合摘要
   */
  getPortfolioSummary(): PortfolioSummary {
    const balances = this.getAllBalances();
    let totalValue = 0;
    let totalChange = 0;
    const chainBreakdown: Record<string, number> = {};

    let best: TokenBalance | undefined;
    let worst: TokenBalance | undefined;
    let bestChange = -Infinity;
    let worstChange = Infinity;

    for (const balance of balances) {
      const value = parseFloat(balance.usdValue || '0');
      totalValue += value;

      const chain = balance.token.chainKey;
      chainBreakdown[chain] = (chainBreakdown[chain] || 0) + value;

      if (balance.priceChange24h !== undefined) {
        if (balance.priceChange24h > bestChange) {
          bestChange = balance.priceChange24h;
          best = balance;
        }
        if (balance.priceChange24h < worstChange) {
          worstChange = balance.priceChange24h;
          worst = balance;
        }
        totalChange += value * balance.priceChange24h / 100;
      }
    }

    const chainBreakdownFormatted: Record<string, string> = {};
    for (const chain of Object.keys(chainBreakdown)) {
      chainBreakdownFormatted[chain] = chainBreakdown[chain].toFixed(2);
    }

    return {
      totalValue: totalValue.toFixed(2),
      totalValueChange24h: totalChange.toFixed(2),
      totalValueChangePercent24h: totalValue > 0 ? (totalChange / totalValue) * 100 : 0,
      bestPerformer: best,
      worstPerformer: worst,
      chainBreakdown: chainBreakdownFormatted,
      tokenCount: balances.length,
    };
  }

  // ========================================================================
  // 工具函数
  // ========================================================================

  /**
   * 格式化 Token 数量
   */
  formatAmount(amount: string, decimals: number): string {
    const bigInt = BigInt(amount);
    const divisor = 10n ** BigInt(decimals);
    const integer = bigInt / divisor;
    const remainder = bigInt % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');

    let trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed.length > 6) trimmed = trimmed.slice(0, 6);

    return trimmed ? `${integer}.${trimmed}` : integer.toString();
  }

  /**
   * 解析 Token 数量
   */
  parseAmount(amount: string, decimals: number): string {
    const [intPart, decPart = ''] = amount.split('.');
    const paddedDec = decPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart + paddedDec).toString();
  }

  /**
   * 获取稳定币列表
   */
  getStablecoins(chainKey?: string): TokenInfo[] {
    const result: TokenInfo[] = [];
    for (const token of this.tokens.values()) {
      if (!token.isStablecoin) continue;
      if (chainKey && token.chainKey !== chainKey) continue;
      result.push(token);
    }
    return result;
  }

  /**
   * 获取热门 Token
   */
  getPopularTokens(chainKey?: string, limit: number = 20): TokenInfo[] {
    const result: TokenInfo[] = [];
    for (const token of this.tokens.values()) {
      if (!token.isPopular) continue;
      if (chainKey && token.chainKey !== chainKey) continue;
      result.push(token);
    }
    return result.slice(0, limit);
  }

  /**
   * 获取 Token 总数
   */
  getTokenCount(): number {
    return this.tokens.size;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  TokenManager,
  POPULAR_TOKENS,
};
