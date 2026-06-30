import { Prisma, SpotMarket, SpotTrade, SpotOrder, SpotOrderStatus, SpotOrderSide } from '@prisma/client';
import { spotMarketService } from './market-service';
import { spotTradeService } from './trade-service';
import { getSpotMatchingEngine } from '../matching-engine';
import { logger } from '@/lib/logger';

export interface TickerData {
  marketSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  open: string;
  high: string;
  low: string;
  volume24h: string;
  change24h: string;
  changePercent24h: string;
  bidPrice: string;
  bidQuantity: string;
  askPrice: string;
  askQuantity: string;
  timestamp: number;
}

export interface KlineData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteVolume: string;
}

export class SpotMarketDataService {
  private tickers = new Map<string, TickerData>();
  private klineCache = new Map<string, KlineData[]>();
  private readonly klineRetention = 1000;

  async getTicker(marketSymbol: string): Promise<TickerData | null> {
    const market = await spotMarketService.getBySymbol(marketSymbol);
    if (!market) return null;

    const engine = getSpotMatchingEngine();
    const orderbook = engine.getOrderBook(marketSymbol);
    const recentTrades = engine.getRecentTrades(marketSymbol, 100);

    const [price, open, high, low, volume24h] = await this.calculateMarketStats(market, recentTrades);
    const [change24h, changePercent24h] = this.calculateChange(price, open);

    const bidPrice = orderbook.bids.length > 0 ? orderbook.bids[0].price : '0';
    const bidQuantity = orderbook.bids.length > 0 ? orderbook.bids[0].quantity : '0';
    const askPrice = orderbook.asks.length > 0 ? orderbook.asks[0].price : '0';
    const askQuantity = orderbook.asks.length > 0 ? orderbook.asks[0].quantity : '0';

    const ticker: TickerData = {
      marketSymbol: market.marketSymbol,
      baseAsset: market.baseAsset,
      quoteAsset: market.quoteAsset,
      price: price.toString(),
      open: open.toString(),
      high: high.toString(),
      low: low.toString(),
      volume24h: volume24h.toString(),
      change24h: change24h.toString(),
      changePercent24h: changePercent24h.toString(),
      bidPrice,
      bidQuantity,
      askPrice,
      askQuantity,
      timestamp: Date.now(),
    };

    this.tickers.set(marketSymbol, ticker);

    return ticker;
  }

  async getAllTickers(): Promise<TickerData[]> {
    const markets = await spotMarketService.getActiveMarkets();
    const tickers: TickerData[] = [];

    for (const market of markets) {
      const ticker = await this.getTicker(market.marketSymbol);
      if (ticker) {
        tickers.push(ticker);
      }
    }

    return tickers;
  }

  getOrderBook(marketSymbol: string, depth: number = 20): { bids: Array<{ price: string; quantity: string }>; asks: Array<{ price: string; quantity: string }> } {
    const engine = getSpotMatchingEngine();
    return engine.getOrderBook(marketSymbol, depth);
  }

  async getRecentTrades(marketSymbol: string, limit: number = 50): Promise<SpotTrade[]> {
    const market = await spotMarketService.getBySymbol(marketSymbol);
    if (!market) return [];

    const engine = getSpotMatchingEngine();
    return engine.getRecentTrades(marketSymbol, limit);
  }

  async getHistoricalTrades(marketSymbol: string, page: number = 1, pageSize: number = 50): Promise<{ trades: SpotTrade[]; total: number; page: number; pageSize: number }> {
    const market = await spotMarketService.getBySymbol(marketSymbol);
    if (!market) return { trades: [], total: 0, page, pageSize };

    const result = await spotTradeService.list({
      page,
      pageSize,
      marketSymbol,
    });

    return {
      trades: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getKline(marketSymbol: string, interval: string = '1m', limit: number = 100): Promise<KlineData[]> {
    const cacheKey = `${marketSymbol}_${interval}`;
    const cached = this.klineCache.get(cacheKey);
    if (cached && cached.length >= limit) {
      return cached.slice(-limit);
    }

    const market = await spotMarketService.getBySymbol(marketSymbol);
    if (!market) return [];

    const recentTrades = await spotTradeService.getRecentTrades(market.id, limit * 10);
    const klines = this.aggregateTradesToKline(recentTrades, interval);

    this.klineCache.set(cacheKey, klines);

    return klines.slice(-limit);
  }

  async updateTickerOnTrade(trade: SpotTrade): Promise<void> {
    try {
      await this.getTicker(trade.marketSymbol);
    } catch (error) {
      logger.error('[spot-market-data] updateTickerOnTrade failed', error);
    }
  }

  private async calculateMarketStats(market: SpotMarket, recentTrades: SpotTrade[]): Promise<[Prisma.Decimal, Prisma.Decimal, Prisma.Decimal, Prisma.Decimal, Prisma.Decimal]> {
    let price = new Prisma.Decimal(0);
    let open = new Prisma.Decimal(0);
    let high = new Prisma.Decimal(0);
    let low = new Prisma.Decimal(0);
    let volume24h = new Prisma.Decimal(0);

    const now = Date.now();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    if (recentTrades.length > 0) {
      price = recentTrades[0].price;

      const todayTrades = recentTrades.filter(t => new Date(t.tradeTime).getTime() >= startOfDay.getTime());

      if (todayTrades.length > 0) {
        open = todayTrades[todayTrades.length - 1].price;

        for (const trade of todayTrades) {
          if (trade.price.gt(high)) high = trade.price;
          if (low.eq(0) || trade.price.lt(low)) low = trade.price;
          volume24h = volume24h.add(trade.quantity);
        }
      } else {
        open = price;
        high = price;
        low = price;
      }
    }

    const dbVolume = await spotTradeService.get24hVolume(market.id);
    if (dbVolume.gt(volume24h)) {
      volume24h = dbVolume;
    }

    return [price, open, high, low, volume24h];
  }

  private calculateChange(price: Prisma.Decimal, open: Prisma.Decimal): [Prisma.Decimal, Prisma.Decimal] {
    if (open.eq(0)) {
      return [new Prisma.Decimal(0), new Prisma.Decimal(0)];
    }

    const change = price.sub(open);
    const changePercent = change.div(open).mul(100);

    return [change, changePercent];
  }

  private aggregateTradesToKline(trades: SpotTrade[], interval: string): KlineData[] {
    const intervalMs = this.getIntervalMs(interval);
    const klines: KlineData[] = [];
    const buckets = new Map<number, KlineData>();

    for (const trade of trades) {
      const timestamp = new Date(trade.tradeTime).getTime();
      const bucketKey = Math.floor(timestamp / intervalMs) * intervalMs;

      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = {
          timestamp: bucketKey,
          open: trade.price.toString(),
          high: trade.price.toString(),
          low: trade.price.toString(),
          close: trade.price.toString(),
          volume: trade.quantity.toString(),
          quoteVolume: trade.value.toString(),
        };
        buckets.set(bucketKey, bucket);
      } else {
        const tradePrice = new Prisma.Decimal(trade.price.toString());
        const tradeQty = new Prisma.Decimal(trade.quantity.toString());
        const tradeValue = new Prisma.Decimal(trade.value.toString());

        bucket.close = trade.price.toString();

        if (tradePrice.gt(new Prisma.Decimal(bucket.high))) {
          bucket.high = trade.price.toString();
        }
        if (tradePrice.lt(new Prisma.Decimal(bucket.low))) {
          bucket.low = trade.price.toString();
        }

        bucket.volume = tradeQty.add(new Prisma.Decimal(bucket.volume)).toString();
        bucket.quoteVolume = tradeValue.add(new Prisma.Decimal(bucket.quoteVolume)).toString();
      }
    }

    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
    for (const key of sortedKeys) {
      klines.push(buckets.get(key)!);
    }

    return klines.slice(-this.klineRetention);
  }

  private getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };

    return intervals[interval] || 60 * 1000;
  }
}

export const spotMarketDataService = new SpotMarketDataService();