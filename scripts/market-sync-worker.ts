/**
 * 永续合约行情同步 Worker
 *
 * 背景：/api/v1/perp/market（App 端合约行情页面实际调用的接口）从
 * MarketTicker / MarketKline / MarketDepth 三张表读数据，但此前没有任何
 * 任务往这三张表写数据，导致 App 端行情永远是空的。
 *
 * 本 worker 常驻运行，定期从已验证可用的真实数据源（src/lib/crypto，
 * Binance 优先、OKX 自动降级）拉取 PerpContract 中启用的交易对的
 * ticker / 深度 / K线，写入上述三张表。
 *
 * 用法：npx tsx scripts/market-sync-worker.ts
 * 生产环境建议用 pm2 / systemd 常驻运行。
 */
import { PrismaClient } from '@prisma/client';
import { tickerService } from '../src/lib/crypto/services/ticker-service';
import { orderBookService } from '../src/lib/crypto/services/orderbook-service';
import { klineService, type KlineInterval } from '../src/lib/crypto/services/kline-service';

const prisma = new PrismaClient();

const TICKER_INTERVAL_MS = 10_000;
const KLINE_INTERVAL_MS = 30_000;
const KLINE_TIMEFRAMES: KlineInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

let symbols: string[] = [];
// 内存去重集合：`${symbol}:${interval}:${openTime}`，避免重复插入同一根K线
const seenKlines = new Set<string>();

async function loadSymbols(): Promise<string[]> {
  const contracts = await prisma.perpContract.findMany({
    where: { status: 'active' },
    select: { symbol: true, baseAsset: true },
  });
  return contracts.map((c) => c.baseAsset);
}

async function primeSeenKlines(): Promise<void> {
  for (const base of symbols) {
    const symbol = `${base}USDT`;
    for (const interval of KLINE_TIMEFRAMES) {
      const rows = await prisma.marketKline.findMany({
        where: { symbol, interval },
        select: { openTime: true },
        orderBy: { openTime: 'desc' },
        take: 5,
      });
      for (const r of rows) {
        seenKlines.add(`${symbol}:${interval}:${r.openTime.getTime()}`);
      }
    }
  }
}

async function syncTickerAndDepth(base: string): Promise<void> {
  const symbol = `${base}USDT`;
  try {
    const ticker = await tickerService.getTicker(base);
    if (ticker && ticker.price) {
      await prisma.marketTicker.create({
        data: {
          symbol,
          price: ticker.price,
          open: ticker.price - (ticker.change24h ?? 0),
          high: ticker.high24h ?? ticker.price,
          low: ticker.low24h ?? ticker.price,
          volume: ticker.totalVolume ?? 0,
          quoteVolume: ticker.totalVolume ?? 0,
          change: ticker.change24h ?? 0,
          changePercent: ticker.changePercent24h ?? 0,
          bidPrice: ticker.price,
          bidAmount: 0,
          askPrice: ticker.price,
          askAmount: 0,
          timestamp: new Date(ticker.lastUpdated || Date.now()),
        },
      });
    }
  } catch (e) {
    console.error(`[ticker] ${symbol} sync failed:`, (e as Error).message);
  }

  try {
    const depth = await orderBookService.getOrderBook(base, 20);
    if (depth && (depth.bids.length || depth.asks.length)) {
      await prisma.marketDepth.create({
        data: {
          symbol,
          bids: depth.bids,
          asks: depth.asks,
          timestamp: new Date(depth.timestamp),
        },
      });
    }
  } catch (e) {
    console.error(`[depth] ${symbol} sync failed:`, (e as Error).message);
  }
}

async function syncKlines(base: string): Promise<void> {
  const symbol = `${base}USDT`;
  for (const interval of KLINE_TIMEFRAMES) {
    try {
      const klines = await klineService.getKlines(base, interval, 3);
      for (const k of klines) {
        const key = `${symbol}:${interval}:${k.openTime}`;
        if (seenKlines.has(key)) continue;
        await prisma.marketKline.create({
          data: {
            symbol,
            interval,
            openTime: new Date(k.openTime),
            closeTime: new Date(k.closeTime),
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
            volume: k.volume,
            quoteVolume: k.quoteVolume,
            trades: k.trades ?? 0,
          },
        });
        seenKlines.add(key);
      }
    } catch (e) {
      console.error(`[kline] ${symbol} ${interval} sync failed:`, (e as Error).message);
    }
  }
}

async function tickTickers(): Promise<void> {
  await Promise.all(symbols.map((base) => syncTickerAndDepth(base)));
}

async function tickKlines(): Promise<void> {
  await Promise.all(symbols.map((base) => syncKlines(base)));
}

async function main(): Promise<void> {
  symbols = await loadSymbols();
  if (symbols.length === 0) {
    console.error('没有启用的 PerpContract，请先运行 scripts/seed-perp-contracts.ts');
    process.exit(1);
  }
  console.log(`market-sync-worker started. symbols=${symbols.join(',')}`);
  await primeSeenKlines();

  await tickTickers();
  await tickKlines();

  setInterval(() => { tickTickers().catch((e) => console.error('tickTickers error', e)); }, TICKER_INTERVAL_MS);
  setInterval(() => { tickKlines().catch((e) => console.error('tickKlines error', e)); }, KLINE_INTERVAL_MS);
}

main().catch((e) => {
  console.error('market-sync-worker failed to start', e);
  process.exit(1);
});

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
