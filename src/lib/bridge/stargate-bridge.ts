/**
 * Stargate 桥适配器
 *
 * 端点（mock）：https://api.stargate.finance/v1
 * LayerZero 之上的流动性池（统一流动性 → 即时到账）
 *
 * 公共方法：
 *  - getQuote(opts): { fee, amount, time }
 *  - send(opts): { messageId, txHash }
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

export const STARGATE_ENDPOINT = 'https://api.stargate.finance/v1';
export const STARGATE_ROUTER: Record<number, string> = {
  1: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
  56: '0x4a364f8c716cA1879C247bc744FF0A36FB57AA14',
  137: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
  42161: '0x53Bf833A5d6c1d8886521367e822c8818B56eB6A',
  10: '0xB0D502E938ed5f4df2E681fE6E407ff29dF2547f',
  43114: '0x45c01E4e4F29fA3922fD45E1392bEbD7CC7Dfa7F',
  8453: '0x50c42dEAcD8FC9773493ED674b67bB4dA8F40772',
};

// =============================================================================
// 类型
// =============================================================================

export interface StargateQuote {
  fee: string;
  amount: string;
  time: number;
  /** 池子中可用流动性 */
  poolLiquidity: string;
  source: 'api' | 'fallback';
}

export interface StargateSendResult {
  messageId: string;
  txHash: string;
  source: 'api' | 'fallback';
}

export interface StargateSendOptions {
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

export class StargateBridge {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly fallbackToDemo: boolean;
  private readonly mock: boolean;

  /** messageId -> 内部状态 */
  private readonly store: Map<string, { txHash: string; submittedAt: number; fromChain: number; toChain: number; status: 'INFLIGHT' | 'DELIVERED' | 'FAILED' }> = new Map();

  constructor(opts: BridgeAdapterOptions = {}) {
    this.endpoint = STARGATE_ENDPOINT;
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

  async getQuote(opts: RouteQueryOptions): Promise<StargateQuote> {
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
          time: json.time ?? 60,
          poolLiquidity: json.poolLiquidity ?? '1000000',
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

  async send(opts: StargateSendOptions): Promise<StargateSendResult> {
    const messageId = genId('sgmsg');
    const txHash = genTxHash('stargate:' + messageId);

    if (this.mock) {
      this.store.set(messageId, {
        txHash,
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
        status: 'INFLIGHT',
      });
      return { messageId, txHash, source: 'fallback' };
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
        const realId: string = json.messageId ?? messageId;
        const realTx: string = json.txHash ?? txHash;
        this.store.set(realId, {
          txHash: realTx,
          submittedAt: Date.now(),
          fromChain: opts.fromChain,
          toChain: opts.toChain,
          status: 'INFLIGHT',
        });
        return { messageId: realId, txHash: realTx, source: 'api' };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      this.store.set(messageId, {
        txHash,
        submittedAt: Date.now(),
        fromChain: opts.fromChain,
        toChain: opts.toChain,
        status: 'INFLIGHT',
      });
      return { messageId, txHash, source: 'fallback' };
    }
  }

  /** 查询内部状态（演示用） */
  getStoredStatus(messageId: string) {
    return this.store.get(messageId);
  }

  // -------------------------------------------------------------------------
  // 路由 + 演示降级
  // -------------------------------------------------------------------------

  private demoQuote(opts: RouteQueryOptions): StargateQuote {
    const chainDelta = Math.abs(opts.fromChain - opts.toChain);
    // Stargate 是即时到账（统一流动性池），时间最短
    const fee = (BigInt(chainDelta || 1) * 50_000n * 1_000_000_000n).toString();
    return {
      fee,
      amount: opts.amount,
      time: 30 + Math.min(chainDelta, 60), // 即时到账
      poolLiquidity: '8000000',
      source: 'fallback',
    };
  }

  buildRoute(opts: RouteQueryOptions): BridgeRoute {
    const q = this.demoQuote(opts);
    const gasFeeFrom = (500_000n * 50_000_000_000n).toString();
    const gasFeeTo = '0'; // Stargate 在目标链无 gas（统一池）
    const totalFee = (BigInt(q.fee) + BigInt(gasFeeFrom) + BigInt(gasFeeTo)).toString();
    return {
      id: genId('sgroute'),
      fromChain: opts.fromChain,
      toChain: opts.toChain,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      provider: 'STARGATE',
      estimatedTime: q.time,
      bridgeFee: q.fee,
      gasFeeFrom,
      gasFeeTo,
      totalFee,
      liquidityAvailable: '10000000000000', // $10M (Stargate 统一流动性池最大)
      maxAmount: '2000000000000',           // 2M USDT (6 decimals)
      minAmount: '1000000',                 // 1 USDT
      securityScore: BRIDGE_PROVIDER_SECURITY_SCORE.STARGATE,
    };
  }
}
