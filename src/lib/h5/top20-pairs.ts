/**
 * H5 真实交易对配置
 *
 *  - 来源：Binance 现货公共 API
 *  - 数量：Top 20（按 24h 成交额）
 *  - 替换原先 h5-mock 的 getQuotePairs
 *
 *  注意：
 *  - displayName 优先使用币圈常用中文名
 *  - hot 标记用于 H5Markets 筛选"热门"Tab
 *  - binanceSymbol 必须为 Binance 实际存在的 USDT 交易对
 */

export interface H5Pair {
  /** H5 显示用 symbol，如 "BTC/USDT" */
  symbol: string;
  /** 基础币种，如 "BTC" */
  base: string;
  /** 计价币种（统一 USDT） */
  quote: string;
  /** 中文 / 英文名 */
  name: string;
  /** 是否热门（首屏展示） */
  hot: boolean;
  /** 币种图标 emoji（H5 风格） */
  emoji: string;
  /** 主题色（H5 卡片用） */
  color: string;
}

export const TOP20_PAIRS: readonly H5Pair[] = [
  { symbol: 'BTC/USDT',  base: 'BTC',  quote: 'USDT', name: 'Bitcoin',    hot: true,  emoji: '₿', color: '#F7931A' },
  { symbol: 'ETH/USDT',  base: 'ETH',  quote: 'USDT', name: 'Ethereum',   hot: true,  emoji: 'Ξ', color: '#627EEA' },
  { symbol: 'SOL/USDT',  base: 'SOL',  quote: 'USDT', name: 'Solana',     hot: true,  emoji: '◎', color: '#9945FF' },
  { symbol: 'BNB/USDT',  base: 'BNB',  quote: 'USDT', name: 'BNB',        hot: true,  emoji: '🟡', color: '#F0B90B' },
  { symbol: 'XRP/USDT',  base: 'XRP',  quote: 'USDT', name: 'Ripple',     hot: false, emoji: '✕', color: '#00AAE4' },
  { symbol: 'DOGE/USDT', base: 'DOGE', quote: 'USDT', name: 'Dogecoin',   hot: true,  emoji: 'Ð', color: '#C2A633' },
  { symbol: 'ADA/USDT',  base: 'ADA',  quote: 'USDT', name: 'Cardano',    hot: false, emoji: '₳', color: '#0033AD' },
  { symbol: 'AVAX/USDT', base: 'AVAX', quote: 'USDT', name: 'Avalanche',  hot: false, emoji: '🔺', color: '#E84142' },
  { symbol: 'TRX/USDT',  base: 'TRX',  quote: 'USDT', name: 'TRON',       hot: false, emoji: '◆', color: '#FF060A' },
  { symbol: 'LINK/USDT', base: 'LINK', quote: 'USDT', name: 'Chainlink',  hot: false, emoji: '🔗', color: '#2A5ADA' },
  { symbol: 'DOT/USDT',  base: 'DOT',  quote: 'USDT', name: 'Polkadot',   hot: false, emoji: '●', color: '#E6007A' },
  { symbol: 'MATIC/USDT',base: 'MATIC',quote: 'USDT', name: 'Polygon',    hot: false, emoji: '⬡', color: '#8247E5' },
  { symbol: 'LTC/USDT',  base: 'LTC',  quote: 'USDT', name: 'Litecoin',   hot: false, emoji: 'Ł', color: '#345D9D' },
  { symbol: 'NEAR/USDT', base: 'NEAR', quote: 'USDT', name: 'NEAR',       hot: false, emoji: 'Ⓝ', color: '#000000' },
  { symbol: 'ATOM/USDT', base: 'ATOM', quote: 'USDT', name: 'Cosmos',     hot: false, emoji: '⚛', color: '#2E3148' },
  { symbol: 'APT/USDT',  base: 'APT',  quote: 'USDT', name: 'Aptos',      hot: false, emoji: '🌀', color: '#1B1B1B' },
  { symbol: 'ARB/USDT',  base: 'ARB',  quote: 'USDT', name: 'Arbitrum',   hot: false, emoji: '🔵', color: '#28A0F0' },
  { symbol: 'OP/USDT',   base: 'OP',   quote: 'USDT', name: 'Optimism',   hot: false, emoji: 'Ⓞ', color: '#FF0420' },
  { symbol: 'UNI/USDT',  base: 'UNI',  quote: 'USDT', name: 'Uniswap',    hot: false, emoji: '🦄', color: '#FF007A' },
  { symbol: 'PEPE/USDT', base: 'PEPE', quote: 'USDT', name: 'Pepe',       hot: true,  emoji: '🐸', color: '#3D9A3F' },
] as const;

/** 快速按 symbol 查 pair */
export const PAIR_MAP: Record<string, H5Pair> = TOP20_PAIRS.reduce(
  (acc, p) => {
    acc[p.symbol] = p;
    return acc;
  },
  {} as Record<string, H5Pair>,
);

/** H5 → Binance 流名（小写无斜杠） */
export function toBinanceSymbol(h5Symbol: string): string {
  return h5Symbol.replace('/', '').toLowerCase();
}

/** 默认首页热门（hot=true） */
export function getHotPairs(): H5Pair[] {
  return TOP20_PAIRS.filter((p) => p.hot);
}
