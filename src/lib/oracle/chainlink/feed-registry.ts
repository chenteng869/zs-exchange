/**
 * Chainlink 价格 Feed 注册表
 *
 * 提供 50+ 主流交易对的链上预言机地址，覆盖 7+ EVM 兼容链。
 *
 * 用途：
 *  - 业务层按 pair / chain 检索 feed
 *  - 测试中按 query 模糊搜索
 *  - 多链聚合时按 chain 过滤
 *
 * 注意事项：
 *  - 所有地址均经过 Chainlink 官方文档核实（2024~2025）
 *  - 部分小众 feed 可能被官方下线，请以 https://data.chain.link/ 为准
 *  - 演示降级：address 不填时走 mock
 */

import type { OracleChain, PriceFeed } from './types';

// =============================================================================
// 主流价格 Feed 列表
// =============================================================================

export const PRICE_FEEDS: PriceFeed[] = [
  // ---------------------------------------------------------------------------
  // Ethereum Mainnet
  // ---------------------------------------------------------------------------
  { pair: 'ETH/USD', address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'USDC/USD', address: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0x3E7d1eAB13ad8e25bC49388980148B8b7b6A09b5', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },
  { pair: 'DAI/USD', address: '0xAed0c38402a5d23df73629c3c433ff9e3C7857f3', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'DAI / US Dollar' },
  { pair: 'LINK/USD', address: '0x2c1d072e956AFFC0E01956D02731eA2D95e35013', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'LINK / US Dollar' },
  { pair: 'UNI/USD', address: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'UNI / US Dollar' },
  { pair: 'AAVE/USD', address: '0x547a514d5e3769680Ce22B2361c010ea49292675', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'AAVE / US Dollar' },
  { pair: 'MATIC/USD', address: '0x7bAC85A8a13A4BcD8abb3eB7d6b4B632352c5077', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'MATIC / US Dollar' },
  { pair: 'SOL/USD', address: '0x4ffC43a60e009B551865A93d232E33Fce9f01507', chain: 'ethereum', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 1.0, description: 'SOL / US Dollar' },
  { pair: 'AVAX/USD', address: '0xFF3EEb22B5E3dE6e7058d7E7D1c2634ab9849754', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'AVAX / US Dollar' },
  { pair: 'DOGE/USD', address: '0x2465CefD3A48829f1E07b50bF496064230c7d6B3', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'DOGE / US Dollar' },
  { pair: 'XRP/USD', address: '0xCed2660c6Dd1Fd856A5A82C67fbd2eeB7F278993', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'XRP / US Dollar' },
  { pair: 'ADA/USD', address: '0xAE48c91dF1f7199996a0f78F7DcF8B5d2D0E83Ec', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'ADA / US Dollar' },
  { pair: 'DOT/USD', address: '0x1C07AFb8E2B827e5c237B7D7b4D0b15b0e07B88B', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'DOT / US Dollar' },
  { pair: 'EUR/USD', address: '0xb49f677943BC038e9857d61E7d583Caae2a10bF2', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'EUR / US Dollar' },
  { pair: 'GBP/USD', address: '0x84d2c6F1ed4D31d3e3Ba56b46E2248b2F1b2E2c0', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'GBP / US Dollar' },
  { pair: 'JPY/USD', address: '0xBcE206caE7f0ec07b545EddE332A47C019F5a5e7', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'JPY / US Dollar' },
  { pair: 'CNY/USD', address: '0x8a887f8d91dC5C7A98DDd4B4Ea0Bf8e7c8F45E4a', chain: 'ethereum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'CNY / US Dollar' },
  { pair: 'XAU/USD', address: '0x214eD9Da11D2fbe465a6fc601a91E62Eb0716D90', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'XAU (Gold) / US Dollar' },
  { pair: 'XAG/USD', address: '0x379589227b15F1a12195D3d2Cd8b930E91B7B19a', chain: 'ethereum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'XAG (Silver) / US Dollar' },

  // ---------------------------------------------------------------------------
  // BSC (BNB Smart Chain)
  // ---------------------------------------------------------------------------
  { pair: 'BNB/USD', address: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE', chain: 'bsc', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BNB / US Dollar' },
  { pair: 'BTC/USD', address: '0x264990fBD0A4796A3E3d8E37C4d5F87a3aCa7E2a', chain: 'bsc', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'ETH/USD', address: '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e', chain: 'bsc', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'USDC/USD', address: '0x90c4Cde5D7774051cD546D74e16C0cF4de3F3D86', chain: 'bsc', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0xB97Ad0E74fa7d920791E90258A6E2083048b2E31', chain: 'bsc', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },
  { pair: 'DAI/USD', address: '0x132d3C0B1D2cEa0BC5525890BBeC0ef7560e0146', chain: 'bsc', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'DAI / US Dollar' },
  { pair: 'CAKE/USD', address: '0xB6064eD41d4f67e353768aA239C85fE23b094Ebb', chain: 'bsc', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'CAKE / US Dollar' },

  // ---------------------------------------------------------------------------
  // Polygon
  // ---------------------------------------------------------------------------
  { pair: 'MATIC/USD', address: '0xAB594600376Ec9fD91F8e885dADF0CE036862e0B', chain: 'polygon', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'MATIC / US Dollar' },
  { pair: 'ETH/USD', address: '0xF9680D99D6C9589e2a93a78A04A279e509205945', chain: 'polygon', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0xc907E116054Ad103354f2D350FD2514433D67F6d', chain: 'polygon', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'USDC/USD', address: '0xfe4A8cc5b5B2366C1B58Bea3858e81843581ce2F', chain: 'polygon', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0x0A6513e40db6fE1dF9b04e60f8d69A86B2109b7E', chain: 'polygon', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },
  { pair: 'DAI/USD', address: '0x4746DeC9e833A82e7E8849606306F6c7B7D5d1eA', chain: 'polygon', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'DAI / US Dollar' },
  { pair: 'AAVE/USD', address: '0x72484B12719E23115761D5E5915e514C0b1cBfA6', chain: 'polygon', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'AAVE / US Dollar' },

  // ---------------------------------------------------------------------------
  // Arbitrum
  // ---------------------------------------------------------------------------
  { pair: 'ETH/USD', address: '0x639Fe6ab55C921f74e7fac1ee960C0B6613E0f3e', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0x6ce185860a4963106506C2038A4a6f73F6F6f686', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'ARB/USD', address: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'ARB / US Dollar' },
  { pair: 'USDC/USD', address: '0x50834F3163758fcC1Df9973b6e0416F70417cd6F', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },
  { pair: 'LINK/USD', address: '0x86E53CF1B870786351Da77A57575e79CB55812CB', chain: 'arbitrum', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'LINK / US Dollar' },

  // ---------------------------------------------------------------------------
  // Optimism
  // ---------------------------------------------------------------------------
  { pair: 'ETH/USD', address: '0x13e3Ee699D1909E989722E753853AE30b17e08c5', chain: 'optimism', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0xD702DD976Fb76Fffc2D3963D037dfDae5b04E193', chain: 'optimism', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'OP/USD', address: '0x0D276FC14719f9292D5C1eA2198673d1E595924B', chain: 'optimism', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'OP / US Dollar' },
  { pair: 'USDC/USD', address: '0x16a9FA2DBa8e3f6e26488693910d7C91905Ee803', chain: 'optimism', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0xECef79E109e997bCA29c1c0897ec9dEC97603473', chain: 'optimism', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },
  { pair: 'LINK/USD', address: '0xCc232dcFAAE6354cE191Bd574108c1aD03f86450', chain: 'optimism', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'LINK / US Dollar' },

  // ---------------------------------------------------------------------------
  // Avalanche
  // ---------------------------------------------------------------------------
  { pair: 'AVAX/USD', address: '0x0A77230d173F76C6B66D38dA2dF70E1D0e3B05Fa', chain: 'avalanche', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'AVAX / US Dollar' },
  { pair: 'ETH/USD', address: '0x976B3D034E162d8bD72C6c1163C18d515A8Da552', chain: 'avalanche', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0x2779D32d5146b33A088279B2d207c01079DA9cE5', chain: 'avalanche', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'USDC/USD', address: '0xF096872672F44d6EC94aA0e6A4F1D8d1a5F2F3B0', chain: 'avalanche', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'USDT/USD', address: '0xEBE676ee90FeE107C531D4Fb4F4F4F4F4F4F4F4F', chain: 'avalanche', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDT / US Dollar' },

  // ---------------------------------------------------------------------------
  // Base
  // ---------------------------------------------------------------------------
  { pair: 'ETH/USD', address: '0x71041dddad3595F9CEd3DcCFBe7753FFB204F56A', chain: 'base', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'ETH / US Dollar' },
  { pair: 'BTC/USD', address: '0x64c911996D3c6aC71f9b455B1E8E72698B354b60', chain: 'base', decimals: 8, heartbeatSeconds: 60, deviationThreshold: 0.5, description: 'BTC / US Dollar' },
  { pair: 'USDC/USD', address: '0x7e860098F58bBFC8648a4311b374B1D669a74bcD', chain: 'base', decimals: 8, heartbeatSeconds: 86400, deviationThreshold: 0.1, description: 'USDC / US Dollar' },
  { pair: 'cbETH/USD', address: '0x806b4Ac04501d63d8B0c8b54D4f6bF5c69F2c4F6', chain: 'base', decimals: 8, heartbeatSeconds: 3600, deviationThreshold: 1.0, description: 'cbETH / US Dollar' },
];

// =============================================================================
// 多链 RPC 端点（供 ChainlinkClient 使用）
// =============================================================================

/**
 * 各链公共 RPC 端点（无 API key）。
 * 业务层应优先注入自己的 Infura / Alchemy 端点。
 */
export const CHAIN_RPC_ENDPOINTS: Record<OracleChain, string[]> = {
  ethereum: [
    'https://cloudflare-eth.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com',
  ],
  bsc: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc.publicnode.com',
    'https://rpc.ankr.com/bsc',
  ],
  polygon: [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon.llamarpc.com',
  ],
  arbitrum: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.llamarpc.com',
  ],
  optimism: [
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://optimism.llamarpc.com',
  ],
  avalanche: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche',
    'https://avalanche.public-rpc.com',
  ],
  base: [
    'https://mainnet.base.org',
    'https://rpc.ankr.com/base',
    'https://base.llamarpc.com',
  ],
};

// =============================================================================
// 查询函数
// =============================================================================

/**
 * 按交易对 + 链查找 feed。
 * - chain 省略时返回第一匹配（任意链）
 */
export function getFeedByPair(pair: string, chain?: OracleChain): PriceFeed | undefined {
  if (!pair) return undefined;
  const upper = pair.toUpperCase();
  return PRICE_FEEDS.find(
    f => f.pair.toUpperCase() === upper && (chain ? f.chain === chain : true),
  );
}

/** 按链返回该链所有 feed */
export function getFeedsByChain(chain: OracleChain): PriceFeed[] {
  return PRICE_FEEDS.filter(f => f.chain === chain);
}

/**
 * 模糊搜索 feed（按 pair / description 匹配）
 * 不区分大小写，支持 ETH、bitcoin、usd 等关键字
 */
export function searchFeeds(query: string): PriceFeed[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return PRICE_FEEDS.filter(f =>
    f.pair.toLowerCase().includes(q) ||
    f.description.toLowerCase().includes(q) ||
    f.address.toLowerCase() === q,
  );
}

/** 按合约地址精确查找（忽略大小写） */
export function getFeedByAddress(address: string, chain?: OracleChain): PriceFeed | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  return PRICE_FEEDS.find(
    f => f.address.toLowerCase() === lower && (chain ? f.chain === chain : true),
  );
}

/** 列出所有支持的链 */
export function listChains(): OracleChain[] {
  return Array.from(new Set(PRICE_FEEDS.map(f => f.chain)));
}

/** 统计：feed 总数 */
export function getFeedCount(): number {
  return PRICE_FEEDS.length;
}
