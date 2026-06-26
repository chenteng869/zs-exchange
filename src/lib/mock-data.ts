import type { TickerData, StatsBarData } from '@/types';

// ==================== Mock交易对数据 (30+个) ====================
export const MOCK_TICKERS: TickerData[] = [
  // BTC相关
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 67234.56,
    change24h: 2.34,
    volume24h: 1234567890.12,
    high24h: 68123.45,
    low24h: 65890.12,
    marketCap: 1320000000000,
  },
  {
    symbol: 'BTCUSD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    price: 67150.00,
    change24h: 2.28,
    volume24h: 987654321.45,
    high24h: 68012.34,
    low24h: 65789.01,
    marketCap: 1320000000000,
  },

  // ETH相关
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3456.78,
    change24h: 3.21,
    volume24h: 876543210.98,
    high24h: 3523.45,
    low24h: 3389.12,
    marketCap: 415000000000,
  },
  {
    symbol: 'ETHBTC',
    baseAsset: 'ETH',
    quoteAsset: 'BTC',
    price: 0.05143,
    change24h: 0.85,
    volume24h: 654321098.76,
    high24h: 0.05234,
    low24h: 0.05056,
  },

  // BNB
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    price: 587.34,
    change24h: -1.23,
    volume24h: 234567890.12,
    high24h: 601.23,
    low24h: 579.45,
    marketCap: 87000000000,
  },

  // SOL
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 172.45,
    change24h: 5.67,
    volume24h: 345678901.23,
    high24h: 178.90,
    low24h: 165.32,
    marketCap: 78000000000,
  },

  // XRP
  {
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    price: 0.5234,
    change24h: 1.89,
    volume24h: 156789012.34,
    high24h: 0.5356,
    low24h: 0.5123,
    marketCap: 28000000000,
  },

  // ADA
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.4567,
    change24h: -0.78,
    volume24h: 98765432.10,
    high24h: 0.4689,
    low24h: 0.4498,
    marketCap: 16000000000,
  },

  // DOGE
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    price: 0.1234,
    change24h: 8.92,
    volume24h: 567890123.45,
    high24h: 0.1312,
    low24h: 0.1156,
    marketCap: 17500000000,
  },

  // DOT
  {
    symbol: 'DOTUSDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    price: 7.89,
    change24h: 2.15,
    volume24h: 87654321.23,
    high24h: 8.05,
    low24h: 7.71,
    marketCap: 10000000000,
  },

  // AVAX
  {
    symbol: 'AVAXUSDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    price: 35.67,
    change24h: 4.32,
    volume24h: 76543210.98,
    high24h: 36.78,
    low24h: 34.56,
    marketCap: 13500000000,
  },

  // LINK
  {
    symbol: 'LINKUSDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    price: 14.56,
    change24h: -2.34,
    volume24h: 65432109.87,
    high24h: 15.02,
    low24h: 14.23,
    marketCap: 8500000000,
  },

  // MATIC/POL
  {
    symbol: 'POLUSDT',
    baseAsset: 'POL',
    quoteAsset: 'USDT',
    price: 0.5678,
    change24h: 1.45,
    volume24h: 123456789.01,
    high24h: 0.5801,
    low24h: 0.5567,
    marketCap: 5200000000,
  },

  // UNI
  {
    symbol: 'UNIUSDT',
    baseAsset: 'UNI',
    quoteAsset: 'USDT',
    price: 9.87,
    change24h: 3.56,
    volume24h: 54321098.76,
    high24h: 10.15,
    low24h: 9.62,
    marketCap: 6000000000,
  },

  // ATOM
  {
    symbol: 'ATOMUSDT',
    baseAsset: 'ATOM',
    quoteAsset: 'USDT',
    price: 8.76,
    change24h: -0.92,
    volume24h: 43210987.65,
    high24h: 8.95,
    low24h: 8.64,
    marketCap: 3200000000,
  },

  // LTC
  {
    symbol: 'LTCUSDT',
    baseAsset: 'LTC',
    quoteAsset: 'USDT',
    price: 84.56,
    change24h: 2.78,
    volume24h: 32109876.54,
    high24h: 86.78,
    low24h: 82.91,
    marketCap: 6300000000,
  },

  // SHIB
  {
    symbol: 'SHIBUSDT',
    baseAsset: 'SHIB',
    quoteAsset: 'USDT',
    price: 0.00002345,
    change24h: 12.34,
    volume24h: 456789012.34,
    high24h: 0.00002567,
    low24h: 0.00002189,
    marketCap: 13800000000,
  },

  // APT
  {
    symbol: 'APTUSDT',
    baseAsset: 'APT',
    quoteAsset: 'USDT',
    price: 9.23,
    change24h: 6.54,
    volume24h: 21098765.43,
    high24h: 9.56,
    low24h: 8.94,
    marketCap: 3800000000,
  },

  // ARB
  {
    symbol: 'ARBUSDT',
    baseAsset: 'ARB',
    quoteAsset: 'USDT',
    price: 1.12,
    change24h: 4.23,
    volume24h: 19876543.21,
    high24h: 1.16,
    low24h: 1.08,
    marketCap: 3400000000,
  },

  // OP
  {
    symbol: 'OPUSDT',
    baseAsset: 'OP',
    quoteAsset: 'USDT',
    price: 2.34,
    change24h: 3.15,
    volume24h: 18765432.10,
    high24h: 2.42,
    low24h: 2.27,
    marketCap: 2500000000,
  },

  // FIL
  {
    symbol: 'FILUSDT',
    baseAsset: 'FIL',
    quoteAsset: 'USDT',
    price: 5.67,
    change24h: -1.89,
    volume24h: 17654320.98,
    high24h: 5.84,
    low24h: 5.56,
    marketCap: 3100000000,
  },

  // NEAR
  {
    symbol: 'NEARUSDT',
    baseAsset: 'NEAR',
    quoteAsset: 'USDT',
    price: 6.78,
    change24h: 5.43,
    volume24h: 16543209.87,
    high24h: 7.02,
    low24h: 6.51,
    marketCap: 7500000000,
  },

  // ICP
  {
    symbol: 'ICPUSDT',
    baseAsset: 'ICP',
    quoteAsset: 'USDT',
    price: 12.34,
    change24h: 2.67,
    volume24h: 15432098.76,
    high24h: 12.68,
    low24h: 12.05,
    marketCap: 5700000000,
  },

  // BCH
  {
    symbol: 'BCHUSDT',
    baseAsset: 'BCH',
    quoteAsset: 'USDT',
    price: 456.78,
    change24h: 1.92,
    volume24h: 14320987.65,
    high24h: 467.89,
    low24h: 448.91,
    marketCap: 9000000000,
  },

  // ETC
  {
    symbol: 'ETCUSDT',
    baseAsset: 'ETC',
    quoteAsset: 'USDT',
    price: 23.45,
    change24h: -0.56,
    volume24h: 13210987.54,
    high24h: 24.01,
    low24h: 23.18,
    marketCap: 3500000000,
  },

  // XLM
  {
    symbol: 'XLMUSDT',
    baseAsset: 'XLM',
    quoteAsset: 'USDT',
    price: 0.1123,
    change24h: 2.14,
    volume24h: 12109876.43,
    high24h: 0.1156,
    low24h: 0.1098,
    marketCap: 3100000000,
  },

  // ALGO
  {
    symbol: 'ALGOUSDT',
    baseAsset: 'ALGO',
    quoteAsset: 'USDT',
    price: 0.1678,
    change24h: 3.42,
    volume24h: 11098765.32,
    high24h: 0.1734,
    low24h: 0.1639,
    marketCap: 6000000000,
  },

  // VET
  {
    symbol: 'VETUSDT',
    baseAsset: 'VET',
    quoteAsset: 'USDT',
    price: 0.0234,
    change24h: 1.78,
    volume24h: 10987654.21,
    high24h: 0.0241,
    low24h: 0.0229,
    marketCap: 1700000000,
  },

  // THETA
  {
    symbol: 'THETAUSDT',
    baseAsset: 'THETA',
    quoteAsset: 'USDT',
    price: 1.89,
    change24h: -2.13,
    volume24h: 9876543.21,
    high24h: 1.95,
    low24h: 1.85,
    marketCap: 1900000000,
  },

  // FTM
  {
    symbol: 'FTMUSDT',
    baseAsset: 'FTM',
    quoteAsset: 'USDT',
    price: 0.6789,
    change24h: 4.56,
    volume24h: 8765432.10,
    high24h: 0.7034,
    low24h: 0.6543,
    marketCap: 1900000000,
  },

  // GRT
  {
    symbol: 'GRTUSDT',
    baseAsset: 'GRT',
    quoteAsset: 'USDT',
    price: 0.1456,
    change24h: 2.89,
    volume24h: 7654321.09,
    high24h: 0.1502,
    low24h: 0.1421,
    marketCap: 1350000000,
  },

  // INJ
  {
    symbol: 'INJUSDT',
    baseAsset: 'INJ',
    quoteAsset: 'USDT',
    price: 23.45,
    change24h: 6.78,
    volume24h: 6543210.98,
    high24h: 24.56,
    low24h: 22.78,
    marketCap: 2200000000,
  },

  // TIA
  {
    symbol: 'TIAUSDT',
    baseAsset: 'TIA',
    quoteAsset: 'USDT',
    price: 11.23,
    change24h: -1.45,
    volume24h: 5432109.87,
    high24h: 11.52,
    low24h: 11.04,
    marketCap: 2000000000,
  },
];

// ==================== Mock统计栏数据 (BTC/ETH/总市值) ====================
export const MOCK_STATS_BAR: StatsBarData[] = [
  {
    symbol: 'BTC',
    price: 67234.56,
    change24h: 2.34,
    marketCap: '$1.32T',
    volume24h: '$28.5B',
  },
  {
    symbol: 'ETH',
    price: 3456.78,
    change24h: 3.21,
    marketCap: '$415B',
    volume24h: '$12.3B',
  },
  {
    symbol: 'TOTAL',
    price: 2450000000000,
    change24h: 1.85,
    marketCap: '$2.45T',
    volume24h: '$89.7B',
  },
];
