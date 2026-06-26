/**
 * LayerZero V2 Omnichain 桥适配器
 *
 * 端点（mock）：https://api.layerzero.network/v1
 * 适配 v2 EndpointV2 + DVN/Executor 模式
 *
 * 公共方法：
 *  - getFees(opts): { nativeFee, zroFee }
 *  - send(opts): { messageId, txHash }
 *  - getStatus(messageId): { status, dstTxHash }
 *  - pollUntilComplete(messageId, timeoutMs): BridgeEvent[]
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
// LayerZero 端点常量
// =============================================================================

export const LAYERZERO_ENDPOINT = 'https://api.layerzero.network/v1';

/** LayerZero V2 端点地址（按 chain） */
export const LAYERZERO_V2_ENDPOINTS: Record<number, string> = {
  1: '0x1a44076050125825900e736c501f859c50fE728c',     // Ethereum
  56: '0x1a44076050125825900e736c501f859c50fE728c',    // BSC (示例)
  137: '0x1a44076050125825900e736c501f859c50fE728c',   // Polygon
  42161: '0x1a44076050125825900e736c501f859c50fE728c', // Arbitrum
  10: '0x1a44076050125825900e736c501f859c50fE728c',    // Optimism
  43114: '0x1a44076050125825900e736c501f859c50fE728c', // Avalanche
  8453: '0x1a44076050125825900e736c501f859c50fE728c',  // Base
};

// =============================================================================
// 类型
// =============================================================================

export interface LayerZeroFeeQuote {
  /** 源链原生币支付的费用（wei） */
  nativeFee: string;
  /** ZRO 代币费用（通常为 0） */
  zroFee: string;
  /** 估算的到账金额 */
  estimatedToAmount: string;
  /** 预计耗时（秒） */
  estimatedTime: number;
  source: 'api' | 'fallback';
}

export interface LayerZeroSendResult {
  messageId: string;
  txHash: string;
  source: 'api' | 'fallback';
}

export interface LayerZeroStatus {
  status: 'INFLIGHT' | 'DELIVERED' | 'FAILED' | 'UNKNOWN';
  messageId: string;
  sourceTxHash?: string;
  dstTxHash?: string;
  source: 'api' | 'fallback';
}

export interface LayerZeroSendOptions {
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

export class LayerZeroBridge {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly fallbackToDemo: boolean;
  private readonly mock: boolean;

  /** 内部 status 缓存（mock 模式用于跨方法传递状态） */
  private readonly statusStore: Map<string, LayerZeroStatus & { submittedAt: number }> = new Map();

  constructor(opts: BridgeAdapterOptions = {}) {
    this.endpoint = opts.fetchImpl ? LAYERZERO_ENDPOINT : LAYERZERO_ENDPOINT;
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => Promise.reject(new Error('fetch unavailable'))) as unknown as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.fallbackToDemo = opts.fallbackToDemo !== false;
    this.mock = isMockMode(this.apiKey);
  }

  /** 是否 mock 模式 */
  isMock(): boolean {
    return this.mock;
  }

  /**
   * 询价：估算跨链费用
   * 真实实现：调用 /v1/estimate-fee
   */
  async getFees(opts: RouteQueryOptions): Promise<LayerZeroFeeQuote> {
    if (this.mock) {
      return this.demoFees(opts);
    }
    try {
      const url = `${this.endpoint}/estimate-fee`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey! },
          body: JSON.stringify({
            srcChain: opts.fromChain,
            dstChain: opts.toChain,
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
          nativeFee: json.nativeFee ?? '0',
          zroFee: json.zroFee ?? '0',
          estimatedToAmount: json.estimatedToAmount ?? opts.amount,
          estimatedTime: json.estimatedTime ?? 180,
          source: 'api',
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoFees(opts);
    }
  }

  /**
   * 提交跨链交易
   * 真实实现：调用 /v1/send
   */
  async send(opts: LayerZeroSendOptions): Promise<LayerZeroSendResult> {
    const messageId = genId('lzmsg');
    const txHash = genTxHash(messageId);

    if (this.mock) {
      const status: LayerZeroStatus & { submittedAt: number } = {
        status: 'INFLIGHT',
        messageId,
        sourceTxHash: txHash,
        submittedAt: Date.now(),
        source: 'fallback',
      };
      this.statusStore.set(messageId, status);
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
          body: JSON.stringify({
            srcChain: opts.fromChain,
            dstChain: opts.toChain,
            fromAddress: opts.fromAddress,
            toAddress: opts.toAddress,
            fromToken: opts.fromToken,
            toToken: opts.toToken,
            amount: opts.amount,
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json: any = await resp.json();
        const realMessageId: string = json.messageId ?? messageId;
        const realTxHash: string = json.txHash ?? txHash;
        this.statusStore.set(realMessageId, {
          status: 'INFLIGHT',
          messageId: realMessageId,
          sourceTxHash: realTxHash,
          submittedAt: Date.now(),
          source: 'api',
        });
        return { messageId: realMessageId, txHash: realTxHash, source: 'api' };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      this.statusStore.set(messageId, {
        status: 'INFLIGHT',
        messageId,
        sourceTxHash: txHash,
        submittedAt: Date.now(),
        source: 'fallback',
      });
      return { messageId, txHash, source: 'fallback' };
    }
  }

  /**
   * 查询消息状态
   */
  async getStatus(messageId: string): Promise<LayerZeroStatus> {
    if (this.mock) {
      return this.demoStatus(messageId);
    }
    try {
      const url = `${this.endpoint}/message/${encodeURIComponent(messageId)}`;
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
          status: json.status ?? 'UNKNOWN',
          messageId,
          sourceTxHash: json.sourceTxHash,
          dstTxHash: json.dstTxHash,
          source: 'api',
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!this.fallbackToDemo) throw err;
      return this.demoStatus(messageId);
    }
  }

  /**
   * 轮询直到完成（INFLIGHT -> DELIVERED / FAILED）或超时
   */
  async pollUntilComplete(
    messageId: string,
    timeoutMs: number = 30 * 60_000,
    pollIntervalMs: number = 5_000,
  ): Promise<BridgeEvent[]> {
    const events: BridgeEvent[] = [];
    const start = Date.now();
    const stored = this.statusStore.get(messageId);
    if (stored?.sourceTxHash) {
      events.push({
        type: 'submitted',
        chain: 1, // 占位
        txHash: stored.sourceTxHash,
        timestamp: stored.submittedAt,
      });
    }

    while (Date.now() - start < timeoutMs) {
      const status = await this.getStatus(messageId);
      if (status.status === 'DELIVERED') {
        if (status.dstTxHash) {
          events.push({
            type: 'completed',
            chain: 1,
            txHash: status.dstTxHash,
            timestamp: Date.now(),
          });
        }
        return events;
      }
      if (status.status === 'FAILED') {
        events.push({
          type: 'failed',
          chain: 1,
          txHash: status.dstTxHash || status.sourceTxHash || '',
          timestamp: Date.now(),
        });
        return events;
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    return events;
  }

  // -------------------------------------------------------------------------
  // 演示降级
  // -------------------------------------------------------------------------

  private demoFees(opts: RouteQueryOptions): LayerZeroFeeQuote {
    // 跨链距离越远费用越高（同链 0，异链随 chain id 差）
    const chainDelta = Math.abs(opts.fromChain - opts.toChain);
    const nativeFee = (BigInt(chainDelta || 1) * 150_000n * 1_000_000_000n).toString(); // 0.00015 ETH * delta
    return {
      nativeFee,
      zroFee: '0',
      estimatedToAmount: opts.amount, // 稳定币 1:1
      estimatedTime: 120 + Math.min(chainDelta, 300),
      source: 'fallback',
    };
  }

  private demoStatus(messageId: string): LayerZeroStatus {
    const stored = this.statusStore.get(messageId);
    if (!stored) {
      return { status: 'UNKNOWN', messageId, source: 'fallback' };
    }
    const elapsed = Date.now() - stored.submittedAt;
    // 简化状态机：< 200ms INFLIGHT，>= 200ms DELIVERED（测试时调用 send 后立即 track）
    if (elapsed < 200) {
      return { status: 'INFLIGHT', messageId, sourceTxHash: stored.sourceTxHash, source: 'fallback' };
    }
    // 已完成：更新 store
    const dstTxHash = stored.dstTxHash ?? genTxHash(messageId + ':dst');
    const next = { ...stored, status: 'DELIVERED' as const, dstTxHash };
    this.statusStore.set(messageId, next);
    return { status: 'DELIVERED', messageId, sourceTxHash: stored.sourceTxHash, dstTxHash, source: 'fallback' };
  }

  // -------------------------------------------------------------------------
  // 路由（供 RouteAggregator 调用）
  // -------------------------------------------------------------------------

  /** 生成一个 LayerZero 路由报价（不调用 API） */
  buildRoute(opts: RouteQueryOptions): BridgeRoute {
    const fee = this.demoFees(opts);
    const chainDelta = Math.abs(opts.fromChain - opts.toChain);
    const gasFeeFrom = (200_000n * 50_000_000_000n).toString(); // ~0.01 ETH
    const gasFeeTo = (200_000n * 30_000_000_000n).toString();   // ~0.006 ETH
    const totalFee = (BigInt(fee.nativeFee) + BigInt(gasFeeFrom) + BigInt(gasFeeTo)).toString();
    return {
      id: genId('lzroute'),
      fromChain: opts.fromChain,
      toChain: opts.toChain,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      provider: 'LAYERZERO',
      estimatedTime: fee.estimatedTime,
      bridgeFee: fee.nativeFee,
      gasFeeFrom,
      gasFeeTo,
      totalFee,
      liquidityAvailable: '5000000000000', // $5M
      maxAmount: '500000000000',          // 500K USDT (6 decimals)
      minAmount: '1000000',               // 1 USDT
      securityScore: BRIDGE_PROVIDER_SECURITY_SCORE.LAYERZERO,
    };
    void chainDelta;
  }
}
