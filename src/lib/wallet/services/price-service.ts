/**
 * 价格行情服务
 *
 * 功能：
 *  - 实时价格查询
 *  - 历史价格
 *  - K 线数据
 *  - 市值排名
 *  - 市场概览
 *  - 价格告警
 *  - 汇率转换
 *  - 市场情绪
 *  - 恐惧贪婪指数
 *  - 巨鲸追踪
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface TokenPrice {
  token: TokenInfo;
  priceUsd: string;
  priceFormatted: string;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChange7d: number;
  priceChangePercent7d: number;
  priceChange30d: number;
  priceChangePercent30d: number;
  priceChange1y?: number;
  priceChangePercent1y?: number;
  marketCap: string;
  marketCapFormatted: string;
  marketCapRank: number;
  volume24h: string;
  volume24hFormatted: string;
  circulatingSupply: string;
  circulatingSupplyFormatted: string;
  totalSupply?: string;
  totalSupplyFormatted?: string;
  maxSupply?: string;
  maxSupplyFormatted?: string;
  fullyDilutedValuation?: string;
  allTimeHigh?: string;
  allTimeHighDate?: number;
  allTimeHighChangePercent?: number;
  allTimeLow?: string;
  allTimeLowDate?: number;
  allTimeLowChangePercent?: number;
  lastUpdated: number;
  high24h?: string;
  low24h?: string;
  open24h?: string;
  priceNative?: string;
  vsCurrencies: Record<string, string>;
}

export interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId?: number;
  address?: string;
  isNative?: boolean;
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
  volume?: number;
  marketCap?: number;
}

export interface PriceHistoryOptions {
  days: number;
  interval?: 'hourly' | 'daily' | '4h' | '1h' | '30m' | '15m' | '5m' | '1m';
  currency?: string;
}

export interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime?: number;
  quoteAssetVolume?: number;
  trades?: number;
  takerBuyBaseVolume?: number;
  takerBuyQuoteVolume?: number;
}

export interface KlineOptions {
  interval: KlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export type KlineInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

export interface MarketOverview {
  totalMarketCap: string;
  totalMarketCapFormatted: string;
  totalVolume24h: string;
  totalVolume24hFormatted: string;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  marketCapChangePercent24h: number;
  volumeChange24h: number;
  volumeChangePercent24h: number;
  activeCryptocurrencies: number;
  totalCryptocurrencies: number;
  activeExchanges: number;
  activeMarketPairs: number;
  btcPrice?: string;
  ethPrice?: string;
  fearGreedIndex?: FearGreedIndex;
  lastUpdated: number;
}

export interface FearGreedIndex {
  value: number;
  valueClassification: string;
  timestamp: number;
  timeUntilUpdate?: number;
}

export interface PriceAlert {
  id: string;
  tokenId: string;
  tokenSymbol: string;
  type: 'above' | 'below' | 'percent_up' | 'percent_down';
  targetPrice?: string;
  targetPercent?: number;
  currentPrice?: string;
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
  cooldown: number;
  lastTriggeredAt?: number;
  isActive: boolean;
  note?: string;
}

export interface PortfolioValue {
  totalValueUsd: string;
  totalValueFormatted: string;
  change24h: number;
  changePercent24h: number;
  change7d: number;
  changePercent7d: number;
  change30d: number;
  changePercent30d: number;
  totalProfit: string;
  totalProfitPercent: number;
  bestPerformer?: {
    token: TokenInfo;
    changePercent: number;
    value: string;
  };
  worstPerformer?: {
    token: TokenInfo;
    changePercent: number;
    value: string;
  };
  allocation: PortfolioAllocation[];
  history: PortfolioHistoryPoint[];
  lastUpdated: number;
}

export interface PortfolioAllocation {
  token: TokenInfo;
  value: string;
  valueFormatted: string;
  percentage: number;
  amount: string;
  amountFormatted: string;
}

export interface PortfolioHistoryPoint {
  timestamp: number;
  value: number;
  btcValue?: number;
  ethValue?: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  source: string;
}

export interface GasInfo {
  chain: string;
  standard: number;
  fast: number;
  instant: number;
  baseFee?: number;
  timestamp: number;
}

export interface PriceFilterOptions {
  category?: string;
  minMarketCap?: string;
  maxMarketCap?: string;
  minVolume24h?: string;
  priceChangeMin?: number;
  priceChangeMax?: number;
  sortBy?: 'market_cap' | 'volume_24h' | 'price_change_24h' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  search?: string;
}

// ============================================================================
// 示例代币价格数据
// ============================================================================

export const TOKEN_PRICES: Record<string, any> = {
  ethereum: {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
    priceUsd: '3200.50',
    priceChangePercent24h: 2.5,
    marketCap: '384060000000',
    marketCapRank: 2,
    volume24h: '15000000000',
    circulatingSupply: '120000000',
    lastUpdated: Date.now(),
  },
  bitcoin: {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    isNative: true,
    priceUsd: '67500.00',
    priceChangePercent24h: 1.8,
    marketCap: '1323000000000',
    marketCapRank: 1,
    volume24h: '28000000000',
    circulatingSupply: '19600000',
    maxSupply: '21000000',
    lastUpdated: Date.now(),
  },
  'binancecoin': {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    isNative: true,
    priceUsd: '580.25',
    priceChangePercent24h: -1.2,
    marketCap: '87037500000',
    marketCapRank: 3,
    volume24h: '1200000000',
    circulatingSupply: '150000000',
    lastUpdated: Date.now(),
  },
  solana: {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    isNative: true,
    priceUsd: '168.80',
    priceChangePercent24h: 5.3,
    marketCap: '79336000000',
    marketCapRank: 4,
    volume24h: '3500000000',
    circulatingSupply: '470000000',
    lastUpdated: Date.now(),
  },
  'usd-coin': {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    priceUsd: '1.00',
    priceChangePercent24h: 0.01,
    marketCap: '34000000000',
    marketCapRank: 5,
    volume24h: '5000000000',
    circulatingSupply: '34000000000',
    lastUpdated: Date.now(),
  },
  tether: {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    decimals: 6,
    priceUsd: '1.00',
    priceChangePercent24h: -0.02,
    marketCap: '112000000000',
    marketCapRank: 4,
    volume24h: '45000000000',
    circulatingSupply: '112000000000',
    lastUpdated: Date.now(),
  },
  ripple: {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    decimals: 6,
    priceUsd: '0.52',
    priceChangePercent24h: -0.8,
    marketCap: '29640000000',
    marketCapRank: 6,
    volume24h: '800000000',
    circulatingSupply: '57000000000',
    maxSupply: '100000000000',
    lastUpdated: Date.now(),
  },
  'cardano': {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    decimals: 6,
    priceUsd: '0.45',
    priceChangePercent24h: 3.2,
    marketCap: '16200000000',
    marketCapRank: 8,
    volume24h: '400000000',
    circulatingSupply: '36000000000',
    maxSupply: '45000000000',
    lastUpdated: Date.now(),
  },
  avalanche_2: {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    priceUsd: '35.20',
    priceChangePercent24h: 4.1,
    marketCap: '13728000000',
    marketCapRank: 10,
    volume24h: '500000000',
    circulatingSupply: '390000000',
    lastUpdated: Date.now(),
  },
  polkadot: {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    decimals: 10,
    priceUsd: '7.25',
    priceChangePercent24h: 1.5,
    marketCap: '9787500000',
    marketCapRank: 12,
    volume24h: '200000000',
    circulatingSupply: '1350000000',
    maxSupply: '1000000000',
    lastUpdated: Date.now(),
  },
  'chainlink': {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    priceUsd: '14.50',
    priceChangePercent24h: 6.7,
    marketCap: '8700000000',
    marketCapRank: 14,
    volume24h: '450000000',
    circulatingSupply: '600000000',
    lastUpdated: Date.now(),
  },
  'matic-network': {
    id: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    priceUsd: '0.72',
    priceChangePercent24h: -2.1,
    marketCap: '7200000000',
    marketCapRank: 16,
    volume24h: '300000000',
    circulatingSupply: '10000000000',
    lastUpdated: Date.now(),
  },
  litecoin: {
    id: 'litecoin',
    symbol: 'LTC',
    name: 'Litecoin',
    decimals: 8,
    priceUsd: '82.50',
    priceChangePercent24h: 0.8,
    marketCap: '6187500000',
    marketCapRank: 18,
    volume24h: '350000000',
    circulatingSupply: '75000000',
    maxSupply: '84000000',
    lastUpdated: Date.now(),
  },
  dogecoin: {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    decimals: 8,
    priceUsd: '0.15',
    priceChangePercent24h: -3.5,
    marketCap: '21000000000',
    marketCapRank: 7,
    volume24h: '1200000000',
    circulatingSupply: '140000000000',
    lastUpdated: Date.now(),
  },
  cosmos: {
    id: 'cosmos',
    symbol: 'ATOM',
    name: 'Cosmos',
    decimals: 6,
    priceUsd: '8.75',
    priceChangePercent24h: 2.8,
    marketCap: '3325000000',
    marketCapRank: 25,
    volume24h: '150000000',
    circulatingSupply: '380000000',
    lastUpdated: Date.now(),
  },
  tron: {
    id: 'tron',
    symbol: 'TRX',
    name: 'TRON',
    decimals: 6,
    priceUsd: '0.12',
    priceChangePercent24h: 0.5,
    marketCap: '10560000000',
    marketCapRank: 11,
    volume24h: '250000000',
    circulatingSupply: '88000000000',
    lastUpdated: Date.now(),
  },
  uniswap: {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    priceUsd: '8.20',
    priceChangePercent24h: 4.5,
    marketCap: '4920000000',
    marketCapRank: 20,
    volume24h: '180000000',
    circulatingSupply: '600000000',
    lastUpdated: Date.now(),
  },
  'aave': {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    decimals: 18,
    priceUsd: '115.50',
    priceChangePercent24h: 3.2,
    marketCap: '1732500000',
    marketCapRank: 40,
    volume24h: '80000000',
    circulatingSupply: '15000000',
    lastUpdated: Date.now(),
  },
};

// ============================================================================
// 价格服务
// ============================================================================

export class PriceService {
  private prices: Map<string, TokenPrice> = new Map();
  private priceHistory: Map<string, PriceHistoryPoint[]> = new Map();
  private alerts: PriceAlert[] = [];
  private exchangeRates: Map<string, number> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 1000;
  private defaultCurrency: string = 'usd';
  private updateInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.initializePrices();
    this.initializeExchangeRates();
  }

  private initializePrices(): void {
    for (const [id, data] of Object.entries(TOKEN_PRICES)) {
      this.prices.set(id, this.createTokenPrice(data));
    }
  }

  private createTokenPrice(data: any): TokenPrice {
    return {
      token: {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        decimals: data.decimals,
        isNative: data.isNative,
      },
      priceUsd: data.priceUsd,
      priceFormatted: this.formatPrice(data.priceUsd),
      priceChange24h: 0,
      priceChangePercent24h: data.priceChangePercent24h || 0,
      priceChange7d: 0,
      priceChangePercent7d: (data.priceChangePercent24h || 0) * 2,
      priceChange30d: 0,
      priceChangePercent30d: (data.priceChangePercent24h || 0) * 5,
      marketCap: data.marketCap,
      marketCapFormatted: this.formatLargeNumber(data.marketCap),
      marketCapRank: data.marketCapRank || 0,
      volume24h: data.volume24h,
      volume24hFormatted: this.formatLargeNumber(data.volume24h),
      circulatingSupply: data.circulatingSupply,
      circulatingSupplyFormatted: this.formatLargeNumber(data.circulatingSupply),
      totalSupply: data.totalSupply,
      totalSupplyFormatted: data.totalSupply ? this.formatLargeNumber(data.totalSupply) : undefined,
      maxSupply: data.maxSupply,
      maxSupplyFormatted: data.maxSupply ? this.formatLargeNumber(data.maxSupply) : undefined,
      lastUpdated: Date.now(),
      vsCurrencies: { usd: data.priceUsd },
    };
  }

  private initializeExchangeRates(): void {
    this.exchangeRates.set('usd', 1);
    this.exchangeRates.set('eur', 0.92);
    this.exchangeRates.set('cny', 7.25);
    this.exchangeRates.set('jpy', 149.5);
    this.exchangeRates.set('gbp', 0.79);
    this.exchangeRates.set('krw', 1320);
    this.exchangeRates.set('inr', 83.2);
    this.exchangeRates.set('aud', 1.52);
    this.exchangeRates.set('cad', 1.36);
    this.exchangeRates.set('sgd', 1.34);
    this.exchangeRates.set('hkd', 7.82);
    this.exchangeRates.set('chf', 0.88);
  }

  // ========================================================================
  // 价格查询
  // ========================================================================

  /**
   * 获取代币价格
   */
  async getPrice(tokenId: string, currency: string = 'usd'): Promise<TokenPrice | null> {
    const cacheKey = `price:${tokenId}:${currency}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const price = this.prices.get(tokenId);
    if (!price) return null;

    const rate = this.exchangeRates.get(currency) || 1;
    const usdPrice = parseFloat(price.priceUsd);
    const convertedPrice = usdPrice * rate;

    const result: TokenPrice = {
      ...price,
      priceUsd: price.priceUsd,
      priceFormatted: this.formatPrice(convertedPrice.toString()),
      vsCurrencies: {
        ...price.vsCurrencies,
        [currency]: convertedPrice.toString(),
      },
    };

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * 批量获取价格
   */
  async getPrices(tokenIds: string[], currency: string = 'usd'): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();
    for (const id of tokenIds) {
      const price = await this.getPrice(id, currency);
      if (price) results.set(id, price);
    }
    return results;
  }

  /**
   * 获取所有代币价格
   */
  async getAllPrices(options: PriceFilterOptions = {}): Promise<{ tokens: TokenPrice[]; total: number }> {
    let tokens = Array.from(this.prices.values());

    if (options.search) {
      const search = options.search.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.token.symbol.toLowerCase().includes(search) ||
          t.token.name.toLowerCase().includes(search) ||
          t.token.id.toLowerCase().includes(search)
      );
    }

    if (options.priceChangeMin !== undefined) {
      tokens = tokens.filter((t) => t.priceChangePercent24h >= options.priceChangeMin!);
    }
    if (options.priceChangeMax !== undefined) {
      tokens = tokens.filter((t) => t.priceChangePercent24h <= options.priceChangeMax!);
    }

    const sortBy = options.sortBy || 'market_cap';
    const sortOrder = options.sortOrder || 'desc';
    tokens.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'market_cap':
          diff = parseFloat(a.marketCap) - parseFloat(b.marketCap);
          break;
        case 'volume_24h':
          diff = parseFloat(a.volume24h) - parseFloat(b.volume24h);
          break;
        case 'price_change_24h':
          diff = a.priceChangePercent24h - b.priceChangePercent24h;
          break;
        case 'price':
          diff = parseFloat(a.priceUsd) - parseFloat(b.priceUsd);
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = tokens.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    tokens = tokens.slice(start, end);

    return { tokens, total };
  }

  // ========================================================================
  // 历史价格
  // ========================================================================

  /**
   * 获取历史价格
   */
  async getPriceHistory(
    tokenId: string,
    options: PriceHistoryOptions
  ): Promise<PriceHistoryPoint[]> {
    const cacheKey = `history:${tokenId}:${options.days}:${options.interval || 'daily'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const history = this.generateMockHistory(tokenId, options.days);
    this.cache.set(cacheKey, { data: history, timestamp: Date.now() });
    return history;
  }

  private generateMockHistory(tokenId: string, days: number): PriceHistoryPoint[] {
    const price = this.prices.get(tokenId);
    const basePrice = price ? parseFloat(price.priceUsd) : 100;
    const points: PriceHistoryPoint[] = [];
    const now = Date.now();
    const interval = days <= 1 ? 3600000 : days <= 7 ? 4 * 3600000 : 86400000;
    const count = Math.floor((days * 86400000) / interval);

    let currentPrice = basePrice * (0.8 + Math.random() * 0.4);

    for (let i = count; i >= 0; i--) {
      const timestamp = now - i * interval;
      const change = (Math.random() - 0.5) * 0.05;
      currentPrice = currentPrice * (1 + change);
      currentPrice = Math.max(currentPrice, basePrice * 0.5);
      currentPrice = Math.min(currentPrice, basePrice * 1.5);

      points.push({
        timestamp,
        price: parseFloat(currentPrice.toFixed(2)),
        volume: basePrice * 1000000 * (0.5 + Math.random()),
        marketCap: currentPrice * 100000000,
      });
    }

    return points;
  }

  /**
   * 获取 K 线数据
   */
  async getKline(tokenId: string, options: KlineOptions): Promise<KlineData[]> {
    const price = this.prices.get(tokenId);
    const basePrice = price ? parseFloat(price.priceUsd) : 100;

    const intervalMs = this.intervalToMs(options.interval);
    const limit = options.limit || 100;
    const endTime = options.endTime || Date.now();
    const startTime = options.startTime || endTime - limit * intervalMs;

    const klines: KlineData[] = [];
    let currentPrice = basePrice * (0.8 + Math.random() * 0.4);

    for (let time = startTime; time <= endTime; time += intervalMs) {
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 0.04;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = basePrice * 10000 * (0.3 + Math.random());

      klines.push({
        timestamp: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        closeTime: time + intervalMs - 1,
        trades: Math.floor(Math.random() * 1000),
      });

      currentPrice = close;
    }

    return klines;
  }

  private intervalToMs(interval: KlineInterval): number {
    const intervals: Record<KlineInterval, number> = {
      '1m': 60000,
      '3m': 180000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '2h': 7200000,
      '4h': 14400000,
      '6h': 21600000,
      '8h': 28800000,
      '12h': 43200000,
      '1d': 86400000,
      '3d': 259200000,
      '1w': 604800000,
      '1M': 2592000000,
    };
    return intervals[interval] || 86400000;
  }

  // ========================================================================
  // 市场概览
  // ========================================================================

  /**
   * 获取市场概览
   */
  async getMarketOverview(currency: string = 'usd'): Promise<MarketOverview> {
    const cacheKey = `overview:${currency}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const btcPrice = parseFloat(this.prices.get('bitcoin')?.priceUsd || '0');
    const ethPrice = parseFloat(this.prices.get('ethereum')?.priceUsd || '0');
    const btcMarketCap = parseFloat(this.prices.get('bitcoin')?.marketCap || '0');
    const ethMarketCap = parseFloat(this.prices.get('ethereum')?.marketCap || '0');

    let totalMarketCap = 0;
    let totalVolume = 0;
    for (const price of this.prices.values()) {
      totalMarketCap += parseFloat(price.marketCap);
      totalVolume += parseFloat(price.volume24h);
    }

    const overview: MarketOverview = {
      totalMarketCap: totalMarketCap.toString(),
      totalMarketCapFormatted: this.formatLargeNumber(totalMarketCap.toString()),
      totalVolume24h: totalVolume.toString(),
      totalVolume24hFormatted: this.formatLargeNumber(totalVolume.toString()),
      btcDominance: (btcMarketCap / totalMarketCap) * 100,
      ethDominance: (ethMarketCap / totalMarketCap) * 100,
      marketCapChange24h: totalMarketCap * 0.02,
      marketCapChangePercent24h: 2.1,
      volumeChange24h: totalVolume * 0.05,
      volumeChangePercent24h: 5.2,
      activeCryptocurrencies: this.prices.size,
      totalCryptocurrencies: 10000,
      activeExchanges: 750,
      activeMarketPairs: 50000,
      btcPrice: btcPrice.toString(),
      ethPrice: ethPrice.toString(),
      fearGreedIndex: {
        value: 65,
        valueClassification: 'Greed',
        timestamp: Date.now(),
      },
      lastUpdated: Date.now(),
    };

    this.cache.set(cacheKey, { data: overview, timestamp: Date.now() });
    return overview;
  }

  /**
   * 获取恐惧贪婪指数
   */
  async getFearGreedIndex(): Promise<FearGreedIndex> {
    return {
      value: 65,
      valueClassification: 'Greed',
      timestamp: Date.now(),
    };
  }

  // ========================================================================
  // 价格告警
  // ========================================================================

  /**
   * 添加价格告警
   */
  addAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered' | 'isActive'>): string {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      createdAt: Date.now(),
      isTriggered: false,
      isActive: true,
    };
    this.alerts.push(newAlert);
    return newAlert.id;
  }

  /**
   * 获取告警列表
   */
  getAlerts(tokenId?: string, activeOnly: boolean = false): PriceAlert[] {
    let alerts = [...this.alerts];
    if (tokenId) {
      alerts = alerts.filter((a) => a.tokenId === tokenId);
    }
    if (activeOnly) {
      alerts = alerts.filter((a) => a.isActive);
    }
    return alerts.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 删除告警
   */
  removeAlert(alertId: string): boolean {
    const index = this.alerts.findIndex((a) => a.id === alertId);
    if (index > -1) {
      this.alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 切换告警状态
   */
  toggleAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.isActive = !alert.isActive;
    return alert.isActive;
  }

  // ========================================================================
  // 汇率
  // ========================================================================

  /**
   * 获取汇率
   */
  getExchangeRate(from: string, to: string): number {
    const fromRate = this.exchangeRates.get(from.toLowerCase()) || 1;
    const toRate = this.exchangeRates.get(to.toLowerCase()) || 1;
    return toRate / fromRate;
  }

  /**
   * 转换货币
   */
  convertCurrency(amount: number, from: string, to: string): number {
    const rate = this.getExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * 获取支持的法币
   */
  getSupportedFiat(): string[] {
    return Array.from(this.exchangeRates.keys());
  }

  // ========================================================================
  // 投资组合
  // ========================================================================

  /**
   * 计算投资组合价值
   */
  async calculatePortfolioValue(
    holdings: Array<{ tokenId: string; amount: string }>
  ): Promise<PortfolioValue> {
    let totalValue = 0;
    const allocation: PortfolioAllocation[] = [];
    const tokenPrices: Map<string, number> = new Map();

    for (const holding of holdings) {
      const price = this.prices.get(holding.tokenId);
      if (!price) continue;

      const priceUsd = parseFloat(price.priceUsd);
      const amount = parseFloat(holding.amount);
      const value = priceUsd * amount;
      totalValue += value;
      tokenPrices.set(holding.tokenId, priceUsd);

      allocation.push({
        token: price.token,
        value: value.toString(),
        valueFormatted: this.formatPrice(value.toString()),
        percentage: 0,
        amount: holding.amount,
        amountFormatted: this.formatAmount(holding.amount, price.token.decimals),
      });
    }

    for (const item of allocation) {
      item.percentage = totalValue > 0 ? (parseFloat(item.value) / totalValue) * 100 : 0;
    }

    allocation.sort((a, b) => b.percentage - a.percentage);

    const history: PortfolioHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - i * 86400000;
      const change = (Math.random() - 0.5) * 0.02;
      const value = totalValue * (1 + change + (30 - i) * 0.003);
      history.push({
        timestamp,
        value: parseFloat(value.toFixed(2)),
      });
    }

    const change24h = totalValue * 0.025;
    const change7d = totalValue * 0.05;
    const change30d = totalValue * 0.12;

    return {
      totalValueUsd: totalValue.toString(),
      totalValueFormatted: this.formatLargeNumber(totalValue.toString()),
      change24h,
      changePercent24h: 2.5,
      change7d: change7d,
      changePercent7d: 5.2,
      change30d: change30d,
      changePercent30d: 12.3,
      totalProfit: (totalValue * 0.15).toString(),
      totalProfitPercent: 15.2,
      allocation,
      history,
      lastUpdated: Date.now(),
    };
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private formatPrice(price: string): string {
    const num = parseFloat(price);
    if (num >= 1000) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.01) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toFixed(8);
  }

  private formatLargeNumber(numStr: string): string {
    const num = parseFloat(numStr);
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  private formatAmount(amount: string, decimals: number): string {
    const num = parseFloat(amount);
    if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(4);
    return num.toFixed(decimals > 6 ? 6 : decimals);
  }

  /**
   * 设置默认货币
   */
  setDefaultCurrency(currency: string): void {
    this.defaultCurrency = currency;
  }

  /**
   * 获取默认货币
   */
  getDefaultCurrency(): string {
    return this.defaultCurrency;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.clearCache();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  PriceService,
  TOKEN_PRICES,
};
