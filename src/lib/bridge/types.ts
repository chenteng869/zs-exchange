/**
 * 跨链桥接 - 类型定义
 *
 * 覆盖 4 大主流跨链桥：
 *  - LayerZero  (Omnichain)
 *  - Wormhole   (Guardian VAA)
 *  - Stargate   (LayerZero 之上的流动性池)
 *  - Across     (Optimistic)
 */

// =============================================================================
// Provider / Chain
// =============================================================================

export type BridgeProvider = 'LAYERZERO' | 'WORMHOLE' | 'STARGATE' | 'ACROSS';

/** 主流 EVM 链 ID：ETH / BSC / Polygon / Arbitrum / Optimism / Avalanche / Base */
export type ChainId = 1 | 56 | 137 | 42161 | 10 | 43114 | 8453;

export type BridgeStatus =
  | 'pending'
  | 'submitting'
  | 'submitted'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'refunded';

// =============================================================================
// 路由 / 报价
// =============================================================================

export interface BridgeRoute {
  id: string;
  fromChain: ChainId;
  toChain: ChainId;
  fromToken: string;
  toToken: string;
  provider: BridgeProvider;
  /** 预计耗时（秒） */
  estimatedTime: number;
  /** 桥协议费（USD 等值） */
  bridgeFee: string;
  /** 源链 gas 费 */
  gasFeeFrom: string;
  /** 目标链 gas 费 */
  gasFeeTo: string;
  /** 总费用（bridgeFee + gasFeeFrom + gasFeeTo） */
  totalFee: string;
  /** 当前可用流动性 */
  liquidityAvailable: string;
  /** 单笔最大可桥金额 */
  maxAmount: string;
  /** 单笔最小可桥金额 */
  minAmount: string;
  /** 安全分数 0-100 */
  securityScore: number;
}

export interface BridgeQuote {
  id: string;
  userId: string;
  route: BridgeRoute;
  fromAmount: string;
  toAmount: string;
  /** 1:1 比率（稳定币） */
  rate: string;
  /** 价格影响（百分比，0.005 = 0.5%） */
  priceImpact: string;
  /** 过期时间戳（毫秒） */
  expiresAt: number;
  /** 创建时间戳（毫秒） */
  createdAt: number;
}

export interface BridgeTransaction {
  id: string;
  userId: string;
  quoteId: string;
  route: BridgeRoute;
  fromChain: ChainId;
  toChain: ChainId;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  senderAddress: string;
  receiverAddress: string;
  status: BridgeStatus;
  /** 源链 tx hash */
  sourceTxHash?: string;
  /** 目标链 tx hash */
  destinationTxHash?: string;
  /** LayerZero messageId */
  messageId?: string;
  /** Wormhole sequence */
  sequence?: string;
  startedAt: number;
  completedAt?: number;
  failedAt?: number;
  errorMessage?: string;
  events: BridgeEvent[];
}

export interface BridgeEvent {
  type: 'submitted' | 'attested' | 'completed' | 'failed' | 'refunded';
  chain: ChainId;
  txHash: string;
  timestamp: number;
  blockNumber?: number;
  confirmations?: number;
}

export interface BridgeTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  addresses: Partial<Record<ChainId, string>>;
  isNative: boolean;
  iconUrl?: string;
}

// =============================================================================
// Provider 通用配置
// =============================================================================

export interface BridgeAdapterOptions {
  /** API Key（包含 'mock' 时启用降级） */
  apiKey?: string;
  /** 自定义 fetch（测试用） */
  fetchImpl?: typeof fetch;
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 是否启用演示降级（默认 true） */
  fallbackToDemo?: boolean;
}

export interface RouteQueryOptions {
  fromChain: ChainId;
  toChain: ChainId;
  fromToken: string;
  toToken: string;
  amount: string;
  /** 接收方地址（部分协议需要） */
  receiverAddress?: string;
  /** 发送方地址（部分协议需要） */
  senderAddress?: string;
}

export interface RouteSelectionStrategy {
  strategy: 'cheapest' | 'fastest' | 'most_secure' | 'best_liquidity';
}

// =============================================================================
// 关键常量
// =============================================================================

export const BRIDGE_QUOTE_TTL_MS = 30_000;
export const BRIDGE_CACHE_TTL_MS = 5_000;
export const BRIDGE_TRACK_POLL_INTERVAL_MS = 5_000;
export const BRIDGE_TRACK_TIMEOUT_MS = 30 * 60_000; // 30 min
export const BRIDGE_MAX_PRICE_IMPACT = 0.01; // 1%
export const BRIDGE_MIN_SECURITY_SCORE = 70;

export const SUPPORTED_CHAINS: ChainId[] = [1, 56, 137, 42161, 10, 43114, 8453];

export const BRIDGE_PROVIDER_SECURITY_SCORE: Record<BridgeProvider, number> = {
  LAYERZERO: 85,
  WORMHOLE: 90,
  STARGATE: 88,
  ACROSS: 82,
};

export const CHAIN_NAME: Record<ChainId, string> = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
  8453: 'Base',
};

export const CHAIN_NATIVE_SYMBOL: Record<ChainId, string> = {
  1: 'ETH',
  56: 'BNB',
  137: 'MATIC',
  42161: 'ETH',
  10: 'ETH',
  43114: 'AVAX',
  8453: 'ETH',
};

// =============================================================================
// 预定义代币
// =============================================================================

export const BRIDGE_TOKENS: BridgeTokenInfo[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    isNative: false,
    addresses: {
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      56: '0x55d398326f99059fF775485246999027B3197955',
      137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      43114: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    },
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    isNative: false,
    addresses: {
      1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
    addresses: {},
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    isNative: false,
    addresses: {
      1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      10: '0x4200000000000000000000000000000000000006',
      43114: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      8453: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    isNative: true,
    addresses: {},
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    isNative: true,
    addresses: {},
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    isNative: true,
    addresses: {},
  },
];

// =============================================================================
// 工具
// =============================================================================

/** 生成稳定的短 ID（无需 crypto.randomUUID，SSR 安全） */
let _idCounter = 0;
export function genId(prefix: string = 'br'): string {
  _idCounter = (_idCounter + 1) % 1_000_000;
  const t = Date.now().toString(36);
  const c = _idCounter.toString(36).padStart(4, '0');
  const r = Math.floor(Math.random() * 0xffff)
    .toString(36)
    .padStart(4, '0');
  return `${prefix}_${t}${c}${r}`;
}

/** 生成稳定的伪 tx hash（64 hex 字符） */
export function genTxHash(seed?: string): string {
  const base = (seed ?? '') + Date.now().toString(16) + Math.random().toString(16).slice(2);
  let h = '';
  for (let i = 0; i < 64; i++) {
    h += ((base.charCodeAt(i % base.length) * (i + 1)) % 16).toString(16);
  }
  return '0x' + h;
}

/** EVM 地址校验（不区分大小写） */
export function isValidEvmAddress(addr: string): boolean {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** 字符串加法（金额安全） */
export function addStr(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

/** 字符串减法 */
export function subStr(a: string, b: string): string {
  const r = BigInt(a) - BigInt(b);
  return r < 0n ? '0' : r.toString();
}

/** 字符串比较 */
export function cmpStr(a: string, b: string): number {
  const A = BigInt(a);
  const B = BigInt(b);
  return A === B ? 0 : A < B ? -1 : 1;
}

/** 是否 mock 模式（apiKey 含 'mock' 或未提供） */
export function isMockMode(apiKey?: string): boolean {
  if (!apiKey) return true;
  return /mock/i.test(apiKey);
}
