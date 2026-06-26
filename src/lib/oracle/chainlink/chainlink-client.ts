/**
 * ChainlinkClient - 链上价格查询客户端
 *
 * 职责：
 *  - 调用 AggregatorV3Interface 合约（latestRoundData / getRoundData / decimals）
 *  - 通过 eth_call（无需 gas）从任意 EVM 兼容链读取价格
 *  - 支持多链 RPC 切换、批量查询、历史回溯
 *  - 演示降级：RPC 不可用时返回稳定的 mock 数据
 *
 * 设计原则：
 *  - 复用项目 [rpc-client] 的 RpcClient，继承其重试 / 健康检查 / 故障切换能力
 *  - 零外部依赖（不引 ethers / web3），仅用 fetch + 手工 ABI 解码
 *  - BigInt 解析确保精度（Chainlink 大部分 answer 在 int256 范围内）
 */

import {
  RpcClient,
  RpcError,
  ETH_PUBLIC_RPCS,
  BSC_PUBLIC_RPCS,
} from '../../wallet/rpc-client';
import { EvmChainService, type EvmChain } from '../../wallet/chain-service';
import {
  AGGREGATOR_V3_SELECTORS,
  ORACLE_STALE_THRESHOLD_FACTOR,
  type OracleChain,
  type PriceData,
  type PriceFeed,
  type PriceRound,
  type FetchImpl,
} from './types';
import { CHAIN_RPC_ENDPOINTS } from './feed-registry';

// =============================================================================
// 工具：十六进制 / BigInt 解析
// =============================================================================

/** 0x... 字符串 → BigInt */
function hexToBigInt(hex: string): bigint {
  if (!hex || hex === '0x' || hex === '0x0') return 0n;
  // ABI 解码是有符号 int256，所以允许负数（部分老 feed answer 可能 < 0）
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length === 0) return 0n;
  const b = BigInt('0x' + clean);
  // int256 符号位（最高位）
  const isNeg = (b >> 255n) === 1n;
  if (!isNeg) return b;
  // 转为负数
  const mask = (1n << 256n) - 1n;
  return b - (mask + 1n);
}

/** BigInt → 人类可读价格（按 decimals 还原，保留 8 位有效小数） */
function formatPrice(answer: bigint, decimals: number): string {
  if (answer === 0n) return '0';
  const neg = answer < 0n;
  const abs = neg ? -answer : answer;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = abs % divisor;
  if (frac === 0n) return (neg ? '-' : '') + whole.toString();
  // 保留 8 位有效小数
  const frac8 = (frac * 100_000_000n) / divisor;
  let fracStr = frac8.toString().padStart(8, '0').replace(/0+$/, '');
  // 限制显示精度（避免过长的尾巴）
  if (fracStr.length > 8) fracStr = fracStr.slice(0, 8);
  return (neg ? '-' : '') + (fracStr ? `${whole.toString()}.${fracStr}` : whole.toString());
}

/**
 * 解析 latestRoundData / getRoundData 返回值。
 * ABI: (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
 * 编码：5 × 32 bytes = 160 bytes hex（去掉 0x 前缀 = 320 chars）
 */
function decodeRoundData(hex: string): {
  roundId: number;
  answer: bigint;
  startedAt: number;
  updatedAt: number;
  answeredInRound: number;
} {
  if (!hex || hex === '0x') {
    throw new Error('Empty round data');
  }
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length < 320) {
    throw new Error(`Round data too short: ${clean.length} chars (need 320)`);
  }
  const roundId = Number(BigInt('0x' + clean.slice(0, 64)));
  const answer = hexToBigInt('0x' + clean.slice(64, 128));
  const startedAt = Number(BigInt('0x' + clean.slice(128, 192)));
  const updatedAt = Number(BigInt('0x' + clean.slice(192, 256)));
  const answeredInRound = Number(BigInt('0x' + clean.slice(256, 320)));
  return { roundId, answer, startedAt, updatedAt, answeredInRound };
}

// =============================================================================
// 链 → 内部 EvmChain 映射
// =============================================================================

const ORACLE_TO_EVM_CHAIN: Record<OracleChain, EvmChain> = {
  ethereum: 'ETH',
  bsc: 'BSC',
  polygon: 'ETH',  // RpcClient 不区分 chain kind，这里复用 ETH 端点配置；polygon 端点由 ChainlinkClient 自身管理
  arbitrum: 'ETH',
  optimism: 'ETH',
  avalanche: 'ETH',
  base: 'ETH',
};

/** 获取某链的默认 RPC 端点列表（兼容原 RpcClient 的导入） */
function getDefaultEndpointsForChain(chain: OracleChain): string[] {
  if (chain === 'ethereum') return ETH_PUBLIC_RPCS;
  if (chain === 'bsc') return BSC_PUBLIC_RPCS;
  return CHAIN_RPC_ENDPOINTS[chain] || [];
}

// =============================================================================
// ChainlinkClient 配置
// =============================================================================

export interface ChainlinkClientOptions {
  /** 自定义端点（按链） */
  endpoints?: Partial<Record<OracleChain, string[]>>;
  /** API Key（注入到对应链默认端点） */
  apiKeys?: Partial<Record<OracleChain, string>>;
  /** 自定义 fetch */
  fetchImpl?: FetchImpl;
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 启用演示降级（默认 true） */
  fallbackToDemo?: boolean;
}

// =============================================================================
// ChainlinkClient 主类
// =============================================================================

export class ChainlinkClient {
  private readonly clients: Map<OracleChain, RpcClient> = new Map();
  private readonly services: Map<OracleChain, EvmChainService> = new Map();
  private readonly endpoints: Map<OracleChain, string[]> = new Map();
  private readonly fetchImpl?: FetchImpl;
  private readonly timeoutMs: number;
  private readonly fallbackToDemo: boolean;

  constructor(opts: ChainlinkClientOptions = {}) {
    this.fetchImpl = opts.fetchImpl;
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.fallbackToDemo = opts.fallbackToDemo !== false;

    // 初始化 7 条链的 RPC 客户端
    const chains: OracleChain[] = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];
    for (const chain of chains) {
      const eps = opts.endpoints?.[chain] || getDefaultEndpointsForChain(chain);
      this.endpoints.set(chain, eps);
      this.clients.set(chain, new RpcClient({
        endpoints: eps,
        chainName: `chainlink-${chain}`,
        fetchImpl: opts.fetchImpl,
        timeoutMs: this.timeoutMs,
        healthCheckMs: 30_000,
      }));

      // 同时为 ETH/BSC 复用项目原有 EvmChainService（统一 RPC 能力）
      if (chain === 'ethereum' || chain === 'bsc') {
        const evmChain = ORACLE_TO_EVM_CHAIN[chain];
        this.services.set(chain, new EvmChainService({
          chain: evmChain,
          endpoints: eps,
          fetchImpl: opts.fetchImpl,
          timeoutMs: this.timeoutMs,
          fallbackToDemo: this.fallbackToDemo,
        }));
      }
    }
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  /** 启动所有后台健康检查 */
  start(): void {
    for (const c of this.clients.values()) c.startHealthCheck();
  }

  /** 停止 */
  stop(): void {
    for (const c of this.clients.values()) c.stopHealthCheck();
  }

  /** 获取所有节点健康状态 */
  getHealth(chain?: OracleChain) {
    if (chain) {
      const c = this.clients.get(chain);
      return c ? c.getHealth() : [];
    }
    const all: ReturnType<RpcClient['getHealth']> = [];
    for (const c of this.clients.values()) all.push(...c.getHealth());
    return all;
  }

  // -------------------------------------------------------------------------
  // 底层调用
  // -------------------------------------------------------------------------

  private getClient(chain: OracleChain): RpcClient {
    const c = this.clients.get(chain);
    if (!c) throw new RpcError('UNSUPPORTED_CHAIN', `Chain not configured: ${chain}`);
    return c;
  }

  /**
   * 直接发起 eth_call
   * @param chain 链
   * @param to 合约地址
   * @param data calldata（0x 前缀）
   */
  async ethCall(chain: OracleChain, to: string, data: string): Promise<string> {
    const c = this.getClient(chain);
    return c.call<string>('eth_call', [{ to, data }, 'latest']);
  }

  // -------------------------------------------------------------------------
  // ABI 调用
  // -------------------------------------------------------------------------

  /** 读取 decimals() */
  async getDecimals(chain: OracleChain, feedAddress: string): Promise<number> {
    const hex = await this.ethCall(chain, feedAddress, AGGREGATOR_V3_SELECTORS.decimals);
    return Number(BigInt(hex || '0x0'));
  }

  /** 读取 description() */
  async getDescription(chain: OracleChain, feedAddress: string): Promise<string> {
    const hex = await this.ethCall(chain, feedAddress, AGGREGATOR_V3_SELECTORS.description);
    // 动态字符串 ABI：offset (32) + length (32) + data (length rounded up to 32)
    if (!hex || hex === '0x') return '';
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (clean.length < 128) return '';
    const length = Number(BigInt('0x' + clean.slice(64, 128)));
    if (length === 0) return '';
    const dataHex = clean.slice(128, 128 + Math.ceil(length / 32) * 64);
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(parseInt(dataHex.slice(i * 2, i * 2 + 2), 16));
    }
    return str;
  }

  /** 读取 latestRoundData() */
  async getLatestRound(chain: OracleChain, feedAddress: string): Promise<PriceRound> {
    const hex = await this.ethCall(chain, feedAddress, AGGREGATOR_V3_SELECTORS.latestRoundData);
    const decoded = decodeRoundData(hex);
    return {
      roundId: decoded.roundId,
      answer: decoded.answer.toString(),
      formatted: '0', // 调用方根据 feed.decimals 自行 format
      startedAt: decoded.startedAt,
      updatedAt: decoded.updatedAt,
      answeredInRound: decoded.answeredInRound,
    };
  }

  /** 读取 getRoundData(uint80 roundId) */
  async getRound(
    chain: OracleChain,
    feedAddress: string,
    roundId: number,
    decimals?: number,
  ): Promise<PriceRound> {
    // 编码 roundId：uint80 padded 到 32 bytes
    const roundIdHex = roundId.toString(16).padStart(64, '0');
    const data = AGGREGATOR_V3_SELECTORS.getRoundData + roundIdHex;
    const hex = await this.ethCall(chain, feedAddress, data);
    const decoded = decodeRoundData(hex);
    return {
      roundId: decoded.roundId,
      answer: decoded.answer.toString(),
      formatted: formatPrice(decoded.answer, decimals ?? 8),
      startedAt: decoded.startedAt,
      updatedAt: decoded.updatedAt,
      answeredInRound: decoded.answeredInRound,
    };
  }

  // -------------------------------------------------------------------------
  // 业务接口
  // -------------------------------------------------------------------------

  /**
   * 获取指定 feed 的最新价格。
   * 自动调用 latestRoundData + 解码 + 计算 age + isStale。
   * 失败时降级到 mock 数据（仅当 fallbackToDemo=true）。
   */
  async getLatestPrice(feed: PriceFeed): Promise<PriceData> {
    if (!feed?.address) {
      return this.demoPrice(feed, 'no address');
    }
    try {
      const round = await this.getLatestRound(feed.chain, feed.address);
      const answer = BigInt(round.answer);
      const formatted = formatPrice(answer, feed.decimals);
      const now = Math.floor(Date.now() / 1000);
      const age = round.updatedAt > 0 ? now - round.updatedAt : 0;
      return {
        ...round,
        formatted,
        pair: feed.pair,
        chain: feed.chain,
        age,
        isStale: this.isStale(feed, round.updatedAt, now),
        source: 'chainlink',
      };
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoPrice(feed, (err as Error).message);
    }
  }

  /** 按交易对 + 链查价格（无 chain 时取首匹配） */
  async getPriceByPair(
    pair: string,
    chain?: OracleChain,
  ): Promise<PriceData | null> {
    // 避免循环依赖：从 feed-registry 重新导入
    const { getFeedByPair } = await import('./feed-registry');
    const feed = getFeedByPair(pair, chain);
    if (!feed) return null;
    return this.getLatestPrice(feed);
  }

  /** 历史轮次查询 */
  async getHistoricalPrices(
    feed: PriceFeed,
    fromTime: number,
    toTime: number,
    intervalSec: number = 3600,
  ): Promise<PriceRound[]> {
    if (intervalSec <= 0) throw new Error('intervalSec must be > 0');
    if (toTime <= fromTime) throw new Error('toTime must be > fromTime');
    if (!feed?.address) return [];

    // 1. 获取 latestRound 的 roundId
    let latest: PriceRound;
    try {
      latest = await this.getLatestRound(feed.chain, feed.address);
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoHistoricalPrices(feed, fromTime, toTime, intervalSec);
    }

    // 2. 估算需要回溯的 round 数（Chainlink 通常每个心跳一轮）
    const range = toTime - fromTime;
    const stepCount = Math.ceil(range / intervalSec);
    if (stepCount > 1000) {
      throw new Error(`Range too large (${stepCount} points), split into smaller windows`);
    }

    // 3. 从最新轮次向前回溯，找到 >= fromTime 的轮次
    const out: PriceRound[] = [];
    let currentRoundId = latest.roundId;
    let safety = 0;
    const maxBack = Math.ceil(range / Math.max(feed.heartbeatSeconds, 1)) + 10;

    while (safety++ < maxBack) {
      if (currentRoundId === 0) break;
      try {
        const round = await this.getRound(feed.chain, feed.address, currentRoundId, feed.decimals);
        if (round.updatedAt < fromTime) break;
        if (round.updatedAt >= fromTime && round.updatedAt <= toTime) {
          out.push(round);
        }
        if (round.updatedAt <= fromTime) break;
        currentRoundId--;
      } catch (err) {
        if (!this.fallbackToDemo) throw err;
        // 单点失败不中断整体（archive node 可能缺失某些旧轮次）
        if (currentRoundId === 0) break;
        currentRoundId--;
      }
    }

    return out.sort((a, b) => a.updatedAt - b.updatedAt);
  }

  /**
   * 是否过期（age > heartbeatSeconds * factor）
   */
  isStale(feed: PriceFeed, updatedAt: number, now?: number): boolean {
    if (updatedAt <= 0) return true;
    const ts = now ?? Math.floor(Date.now() / 1000);
    const age = ts - updatedAt;
    return age > feed.heartbeatSeconds * ORACLE_STALE_THRESHOLD_FACTOR;
  }

  // -------------------------------------------------------------------------
  // 演示降级（mock）
  // -------------------------------------------------------------------------

  /** 生成稳定的 mock 价格（基于 pair + chain） */
  private demoPrice(feed: PriceFeed, _reason: string): PriceData {
    const seed = feed.pair + feed.chain;
    const base = this.demoBasePrice(seed);
    const now = Math.floor(Date.now() / 1000);
    const mockAnswer = BigInt(Math.floor(base * Math.pow(10, feed.decimals)));
    return {
      roundId: 1,
      answer: mockAnswer.toString(),
      formatted: base.toFixed(2),
      startedAt: now - 60,
      updatedAt: now - 30,
      answeredInRound: 1,
      pair: feed.pair,
      chain: feed.chain,
      age: 30,
      isStale: false,
      source: 'fallback',
    };
  }

  private demoBasePrice(seed: string): number {
    // 基于 seed 字符串的简单 hash → 价格
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    // 大币价格高、稳定币价格 ~1
    if (seed.startsWith('BTC')) return 65000 + (h % 5000) - 2500;
    if (seed.startsWith('ETH')) return 3500 + (h % 500) - 250;
    if (seed.startsWith('BNB')) return 600 + (h % 50) - 25;
    if (seed.startsWith('SOL')) return 150 + (h % 30) - 15;
    if (seed.startsWith('AVAX')) return 35 + (h % 5) - 2.5;
    if (seed.startsWith('MATIC')) return 0.7 + (h % 0.2) - 0.1;
    if (seed.startsWith('XAU')) return 2300 + (h % 100) - 50;
    if (seed.startsWith('XAG')) return 28 + (h % 3) - 1.5;
    if (seed.startsWith('EUR')) return 1.08 + (h % 0.05) - 0.025;
    if (seed.startsWith('GBP')) return 1.27 + (h % 0.05) - 0.025;
    if (seed.startsWith('JPY')) return 0.0064 + (h % 0.0005) - 0.00025;
    if (seed.startsWith('CNY')) return 0.138 + (h % 0.005) - 0.0025;
    if (seed.startsWith('USDC') || seed.startsWith('USDT') || seed.startsWith('DAI')) return 1.0 + (h % 100) / 100000 - 0.0005;
    if (seed.startsWith('LINK')) return 18 + (h % 3) - 1.5;
    if (seed.startsWith('UNI')) return 9 + (h % 2) - 1;
    if (seed.startsWith('AAVE')) return 110 + (h % 20) - 10;
    if (seed.startsWith('DOGE')) return 0.15 + (h % 0.05) - 0.025;
    if (seed.startsWith('XRP')) return 0.55 + (h % 0.1) - 0.05;
    if (seed.startsWith('ADA')) return 0.45 + (h % 0.1) - 0.05;
    if (seed.startsWith('DOT')) return 7 + (h % 1) - 0.5;
    if (seed.startsWith('OP')) return 2.5 + (h % 0.5) - 0.25;
    if (seed.startsWith('ARB')) return 1.2 + (h % 0.3) - 0.15;
    if (seed.startsWith('CAKE')) return 2.5 + (h % 0.5) - 0.25;
    if (seed.startsWith('cbETH')) return 3700 + (h % 200) - 100;
    return 1.0 + (h % 100) / 100;
  }

  private demoHistoricalPrices(
    feed: PriceFeed,
    fromTime: number,
    toTime: number,
    intervalSec: number,
  ): PriceRound[] {
    const base = this.demoBasePrice(feed.pair + feed.chain);
    const out: PriceRound[] = [];
    let roundId = 1;
    for (let t = fromTime; t <= toTime; t += intervalSec) {
      // 简单波动：基于时间戳确定性 noise
      const noise = (Math.sin(t / 1000) + Math.cos(t / 7919)) * 0.02; // ±2%
      const price = base * (1 + noise);
      out.push({
        roundId: roundId++,
        answer: BigInt(Math.floor(price * Math.pow(10, feed.decimals))).toString(),
        formatted: price.toFixed(2),
        startedAt: t,
        updatedAt: t,
        answeredInRound: roundId,
      });
    }
    return out;
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

/** 创建 ChainlinkClient（带默认配置） */
export function createChainlinkClient(opts?: ChainlinkClientOptions): ChainlinkClient {
  return new ChainlinkClient(opts);
}
