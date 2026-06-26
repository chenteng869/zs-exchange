/**
 * Across 桥适配器（Optimistic 桥）
 *
 * 端点（mock）：https://app.across.to/api
 * 特点：源链存币，relayer 在目标链上垫付（Optimistic）
 *
 * 公共方法：
 *  - getQuote(opts): { fee, amount, time, spokeAddress }
 *  - send(opts): { depositId, txHash }
 *  - getStatus(depositId): { status, fillTxHash }
 *
 * 演示降级：mock 模式或 fetch 失败时返回稳定模拟数据。
 */

import {
  BridgeAdapterOptions,
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

export const ACROSS_API_ENDPOINT = 'https://app.across.to/api';
export const ACROSS_SPOKE_POOL: Record<number, string> = {
  1: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',
  56: '0x4e8E101924eDE7C5A7d2B5C40b65d3f2F7C2d1D2',
  137: '0x69B5c880209AeFdDC18A99DaD09b5542F9F3E4d1',
  42161: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',
  10: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
  43114: '0xB23A1203F5b1b0b58e9b0bC44d76C73f3b25A0cD',
  8453: '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64',
};

// =============================================================================
// 类型
// =============================================================================

export interface AcrossQuote {
  fee: string;
  amount: string;
  time: number;
  /** 目标链 Spoke Pool 地址 */
  spokeAddress: string;
  source: 'api' | 'fallback';
}

export interface AcrossSendResult {
  depositId: string;
  txHash: string;
  source: 'api' | 'fallback';
}

export interface AcrossStatus {
  status: 'pending' | 'filled' | 'expired' | 'refunded';
  depositId: string;
  fillTxHash?: string;
  source: 'api' | 'fallback';
}

export interface AcrossSendOptions {
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

export class AcrossBridge {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly fallbackToDemo: boolean;
  private readonly mock: boolean;

  /** depositId -> 内部状态 */
  private readonly store: Map<string, { txHash: string; submittedAt: number; fromChain: number; toChain: number; status: AcrossStatus['status']; fillTxHash?: string }> = new Map();

  constructor(opts: BridgeAdapterOptions = {}) {
    this.endpoint = ACROSS_API_ENDPOINT;
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

  async getQuote(opts: RouteQueryOptions): Promise<AcrossQuote> {
    if (this.mock) return this.demoQuote(opts);
    try {
      const url = `${this.endpoint}/suggested-fees`;
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
          fee: json.relayFeeTotal ?? '0',
          amount: opts.amount,
          time: json.estimatedFillTimeSec ?? 60,
          spokeAddress: ACROSS_SPOKE_POOL[opts.toChain] || '',
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

  async send(opts: AcrossSendOptions): Promise<AcrossSendResult> {
    const depositId = genId('acrossdep');
    const txHash = genTxHash('across:' + depositId);

    if (this.mock) {
      this.store.set(depositId, {
        txHash,
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
        status: 'pending',
      });
      return { depositId, txHash, source: 'fallback' };
    }

    try {
      const url = `${this.endpoint}/deposit`;
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
        const realId: string = json.depositId ?? depositId;
        const realTx: string = json.txHash ?? txHash;
        this.store.set(realId, {
          txHash: realTx,
          submittedAt: Date.now(),
          fromChain: opts.fromChain,
          toChain: opts.toChain,
          status: 'pending',
        });
        return { depositId: realId, txHash: realTx, source: 'api' };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      this.store.set(depositId, {
        txHash,
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
        status: 'pending',
      });
      return { depositId, txHash, source: 'fallback' };
    }
  }

  // -------------------------------------------------------------------------
  // 状态
  // -------------------------------------------------------------------------

  async getStatus(depositId: string): Promise<AcrossStatus> {
    if (this.mock) return this.demoStatus(depositId);
    try {
      const url = `${this.endpoint}/deposit/${encodeURIComponent(depositId)}`;
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
          status: json.status ?? 'pending',
          depositId,
          fillTxHash: json.fillTxHash,
          source: 'api',
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoStatus(depositId);
    }
  }

  // -------------------------------------------------------------------------
  // 路由 + 演示降级
  // -------------------------------------------------------------------------

  private demoQuote(opts: RouteQueryOptions): AcrossQuote {
    const chainDelta = Math.abs(opts.fromChain - opts.toChain);
    // Across 是 Optimistic 桥（relayer 垫付），费用最低、速度最快
    const fee = (BigInt(chainDelta || 1) * 30_000n * 1_000_000_000n).toString();
    return {
      fee,
      amount: opts.amount,
      time: 20 + Math.min(chainDelta, 40),
      spokeAddress: ACROSS_SPOKE_POOL[opts.toChain] || '',
      source: 'fallback',
    };
  }

  private demoStatus(depositId: string): AcrossStatus {
    const stored = this.store.get(depositId);
    if (!stored) {
      return { status: 'expired', depositId, source: 'fallback' };
    }
    const elapsed = Date.now() - stored.submittedAt;
    if (elapsed < 200) {
      return { status: 'pending', depositId, source: 'fallback' };
    }
    if (stored.status === 'pending') {
      const fillTxHash = genTxHash('fill:' + depositId);
      const next = { ...stored, status: 'filled' as const, fillTxHash };
      this.store.set(depositId, next);
      return { status: 'filled', depositId, fillTxHash, source: 'fallback' };
    }
    return { status: stored.status, depositId, fillTxHash: stored.fillTxHash, source: 'fallback' };
  }

  buildRoute(opts: RouteQueryOptions): BridgeRoute {
    const q = this.demoQuote(opts);
    const gasFeeFrom = (300_000n * 50_000_000_000n).toString();
    const gasFeeTo = '0'; // 目标链 relayer 垫付
    const totalFee = (BigInt(q.fee) + BigInt(gasFeeFrom) + BigInt(gasFeeTo)).toString();
    return {
      id: genId('accroute'),
      fromChain: opts.fromChain,
      toChain: opts.toChain,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      provider: 'ACROSS',
      estimatedTime: q.time,
      bridgeFee: q.fee,
      gasFeeFrom,
      gasFeeTo,
      totalFee,
      liquidityAvailable: '5000000000000', // $5M
      maxAmount: '1000000000000',          // 1M USDT (6 decimals)
      minAmount: '1000000',                // 1 USDT
      securityScore: BRIDGE_PROVIDER_SECURITY_SCORE.ACROSS,
    };
  }
}
