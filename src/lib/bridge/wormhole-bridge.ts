/**
 * Wormhole 桥适配器
 *
 * 端点（mock）：https://api.wormholescan.io/v1
 * 核心概念：VAAs (Verifiable Action Approvals)
 *
 * 公共方法：
 *  - getQuote(opts): { fee, time, amount }
 *  - send(opts): { sequence, txHash }
 *  - getVAA(sequence): { vaa, status }
 *  - redeem(vaa, chain): { txHash }
 *
 * 演示降级：mock 模式或 fetch 失败时返回稳定模拟数据。
 */

import {
  BridgeAdapterOptions,
  BridgeEvent,
  BridgeRoute,
  RouteQueryOptions,
  BRIDGE_PROVIDER_SECURITY_SCORE,
  genId,
  genTxHash,
  isMockMode,
} from './types';

// =============================================================================
// 端点
// =============================================================================

export const WORMHOLE_SCAN_ENDPOINT = 'https://api.wormholescan.io/v1';
export const WORMHOLE_BRIDGE_ENDPOINT = 'https://wormhole-v2-mainnet-api.celat.one/v1';

export const WORMHOLE_CORE_CONTRACT: Record<number, string> = {
  1: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
  56: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
  137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  42161: '0xa5f208e07298b8C77C5B30d6b4b27e3b3A9e8d8e',
  10: '0xEe91C335eab126dF5f3B7C47f2F11f6CD7fB7e2E',
  43114: '0x0e082F06D657942e4193dfab732d9F75ce773aC3',
  8453: '0xB7f724D6d261b4b2Ee4bC2d8B5E5E2e3F3F5E2e2',
};

export const WORMHOLE_CHAIN_ID: Record<number, number> = {
  1: 2,       // Ethereum
  56: 4,      // BSC
  137: 5,     // Polygon
  42161: 23,  // Arbitrum
  10: 24,     // Optimism
  43114: 6,   // Avalanche
  8453: 30,   // Base
};

// =============================================================================
// 类型
// =============================================================================

export interface WormholeQuote {
  fee: string;
  amount: string;
  time: number;
  source: 'api' | 'fallback';
}

export interface WormholeSendResult {
  sequence: string;
  txHash: string;
  source: 'api' | 'fallback';
}

export interface WormholeVAA {
  sequence: string;
  /** 十六进制 VAA 字节（含 0x 前缀） */
  vaa: string;
  /** 状态：pending / attested / finalized */
  status: 'pending' | 'attested' | 'finalized' | 'not_found';
  source: 'api' | 'fallback';
  timestamp?: number;
}

export interface WormholeRedeemResult {
  txHash: string;
  source: 'api' | 'fallback';
}

export interface WormholeSendOptions {
  fromChain: number;
  toChain: number;
  fromAddress: string;
  toAddress: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

// =============================================================================
// 主类
// =============================================================================

export class WormholeBridge {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly fallbackToDemo: boolean;
  private readonly mock: boolean;

  /** sequence -> VAA 内部状态 */
  private readonly vaaStore: Map<string, WormholeVAA & { submittedAt: number; fromChain: number; toChain: number }> = new Map();

  constructor(opts: BridgeAdapterOptions = {}) {
    this.endpoint = WORMHOLE_SCAN_ENDPOINT;
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => Promise.reject(new Error('fetch unavailable'))) as unknown as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.fallbackToDemo = opts.fallbackToDemo !== false;
    this.mock = isMockMode(this.apiKey);
  }

  isMock(): boolean {
    return this.mock;
  }

  // -------------------------------------------------------------------------
  // 询价
  // -------------------------------------------------------------------------

  async getQuote(opts: RouteQueryOptions): Promise<WormholeQuote> {
    if (this.mock) return this.demoQuote(opts);
    try {
      const url = `${this.endpoint}/quote`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey! },
          body: JSON.stringify({
            fromChain: opts.fromChain,
            toChain: opts.toChain,
            fromToken: opts.fromToken,
            toToken: opts.toToken,
            amount: opts.amount,
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: any = await resp.json();
        return {
          fee: json.fee ?? '0',
          amount: json.amount ?? opts.amount,
          time: json.time ?? 600,
          source: 'api',
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoQuote(opts);
    }
  }

  // -------------------------------------------------------------------------
  // 提交
  // -------------------------------------------------------------------------

  async send(opts: WormholeSendOptions): Promise<WormholeSendResult> {
    const sequence = BigInt(Date.now()).toString() + Math.floor(Math.random() * 1000).toString();
    const txHash = genTxHash('wormhole:' + sequence);

    if (this.mock) {
      this.vaaStore.set(sequence, {
        sequence,
        vaa: '',
        status: 'pending',
        source: 'fallback',
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
      });
      return { sequence, txHash, source: 'fallback' };
    }

    try {
      const url = `${this.endpoint}/send`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey! },
          body: JSON.stringify(opts),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: any = await resp.json();
        const realSeq: string = json.sequence ?? sequence;
        this.vaaStore.set(realSeq, {
          sequence: realSeq,
          vaa: '',
          status: 'pending',
          source: 'api',
          submittedAt: Date.now(),
          fromChain: opts.fromChain,
          toChain: opts.toChain,
        });
        return { sequence: realSeq, txHash: json.txHash ?? txHash, source: 'api' };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      this.vaaStore.set(sequence, {
        sequence,
        vaa: '',
        status: 'pending',
        source: 'fallback',
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
      });
      return { sequence, txHash, source: 'fallback' };
    }
  }

  // -------------------------------------------------------------------------
  // VAA 跟踪
  // -------------------------------------------------------------------------

  async getVAA(sequence: string): Promise<WormholeVAA> {
    if (this.mock) return this.demoVAA(sequence);
    try {
      const url = `${this.endpoint}/vaa/${encodeURIComponent(sequence)}`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'GET',
          headers: { 'X-API-Key': this.apiKey! },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: any = await resp.json();
        return {
          sequence,
          vaa: json.vaa ?? '',
          status: json.status ?? 'pending',
          source: 'api',
          timestamp: json.timestamp ?? Date.now(),
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoVAA(sequence);
    }
  }

  async redeem(vaa: string, chain: number): Promise<WormholeRedeemResult> {
    if (this.mock) {
      return { txHash: genTxHash('redeem:' + vaa.slice(0, 16)), source: 'fallback' };
    }
    try {
      const url = `${this.endpoint}/redeem`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey! },
          body: JSON.stringify({ vaa, chain }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: any = await resp.json();
        return { txHash: json.txHash ?? genTxHash('redeem'), source: 'api' };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return { txHash: genTxHash('redeem:' + vaa.slice(0, 16)), source: 'fallback' };
    }
  }

  // -------------------------------------------------------------------------
  // 轮询 + 演示降级
  // -------------------------------------------------------------------------

  /** 轮询直到 VAA 完成 */
  async pollVAA(
    sequence: string,
    timeoutMs: number = 30 * 60_000,
    pollIntervalMs: number = 5_000,
  ): Promise<WormholeVAA> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const vaa = await this.getVAA(sequence);
      if (vaa.status === 'finalized' || vaa.status === 'attested') return vaa;
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    return { sequence, vaa: '', status: 'pending', source: 'fallback' };
  }

  private demoQuote(opts: RouteQueryOptions): WormholeQuote {
    const chainDelta = Math.abs(opts.fromChain - opts.toChain);
    const fee = (BigInt(chainDelta || 1) * 100_000n * 1_000_000_000n).toString();
    return {
      fee,
      amount: opts.amount,
      time: 300 + Math.min(chainDelta * 30, 600),
      source: 'fallback',
    };
  }

  private demoVAA(sequence: string): WormholeVAA {
    const stored = this.vaaStore.get(sequence);
    if (!stored) {
      return { sequence, vaa: '', status: 'not_found', source: 'fallback' };
    }
    const elapsed = Date.now() - stored.submittedAt;
    let nextStatus: WormholeVAA['status'] = stored.status;
    let vaa = stored.vaa;
    if (elapsed >= 500 && stored.status === 'pending') {
      nextStatus = 'attested';
      vaa = vaa || ('0x' + genId('vaa').padEnd(160, '0').slice(0, 160));
    }
    if (elapsed >= 1000 && stored.status !== 'finalized') {
      nextStatus = 'finalized';
    }
    if (nextStatus !== stored.status || vaa !== stored.vaa) {
      const updated = { ...stored, status: nextStatus, vaa, timestamp: Date.now() };
      this.vaaStore.set(sequence, updated);
    }
    return {
      sequence,
      vaa,
      status: nextStatus,
      source: 'fallback',
      timestamp: Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 路由
  // -------------------------------------------------------------------------

  buildRoute(opts: RouteQueryOptions): BridgeRoute {
    const q = this.demoQuote(opts);
    const gasFeeFrom = (250_000n * 50_000_000_000n).toString();
    const gasFeeTo = (200_000n * 30_000_000_000n).toString();
    const totalFee = (BigInt(q.fee) + BigInt(gasFeeFrom) + BigInt(gasFeeTo)).toString();
    return {
      id: genId('whroute'),
      fromChain: opts.fromChain,
      toChain: opts.toChain,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      provider: 'WORMHOLE',
      estimatedTime: q.time,
      bridgeFee: q.fee,
      gasFeeFrom,
      gasFeeTo,
      totalFee,
      liquidityAvailable: '3000000000000', // $3M
      maxAmount: '300000000000',          // 300K USDT (6 decimals)
      minAmount: '1000000',               // 1 USDT
      securityScore: BRIDGE_PROVIDER_SECURITY_SCORE.WORMHOLE,
    };
  }
}
