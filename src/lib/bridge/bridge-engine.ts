/**
 * 跨链桥业务引擎 (BridgeEngine)
 *
 * 职责：
 *  - 完整交易流程：询价 → 选 route → 提交 → 跟踪
 *  - 安全检查（安全分数 / 限额 / 价格影响 / 地址合法性）
 *  - 交易生命周期管理（pending → submitted → completed/failed/refunded）
 *  - 历史 + 统计
 *
 * 内部维护交易内存池（生产环境应持久化到 DB）。
 */

import { RouteAggregator } from './route-aggregator';
import {
  BridgeEvent,
  BridgeQuote,
  BridgeRoute,
  BridgeStatus,
  BridgeTokenInfo,
  BridgeTransaction,
  ChainId,
  RouteQueryOptions,
  RouteSelectionStrategy,
  BRIDGE_TOKENS,
  BRIDGE_MAX_PRICE_IMPACT,
  BRIDGE_MIN_SECURITY_SCORE,
  BRIDGE_TRACK_POLL_INTERVAL_MS,
  BRIDGE_TRACK_TIMEOUT_MS,
  genId,
  isValidEvmAddress,
  cmpStr,
} from './types';
import { LayerZeroBridge } from './layerzero-bridge';
import { WormholeBridge } from './wormhole-bridge';
import { StargateBridge } from './stargate-bridge';
import { AcrossBridge } from './across-bridge';

// =============================================================================
// 安全检查结果
// =============================================================================

export interface SafetyCheckResult {
  safe: boolean;
  warnings: string[];
  errors: string[];
}

export interface AddressValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ExecuteOptions extends RouteQueryOptions {
  senderAddress: string;
  receiverAddress: string;
  /** 用户 ID */
  userId: string;
  /** 策略 */
  strategy?: RouteSelectionStrategy['strategy'];
}

// =============================================================================
// BridgeEngine
// =============================================================================

export class BridgeEngine {
  private readonly aggregator: RouteAggregator;
  private readonly transactions: Map<string, BridgeTransaction> = new Map();

  constructor(aggregator?: RouteAggregator) {
    this.aggregator = aggregator || new RouteAggregator();
  }

  getAggregator(): RouteAggregator {
    return this.aggregator;
  }

  getProviders() {
    return this.aggregator.providers;
  }

  // -------------------------------------------------------------------------
  // 交易管理
  // -------------------------------------------------------------------------

  /**
   * 完整交易流程：询价 → 选 route → 提交 → 初始化跟踪
   */
  async execute(opts: ExecuteOptions): Promise<BridgeTransaction> {
    // 1) 基础校验
    const addrCheck = this.validateAddresses(opts.senderAddress, opts.receiverAddress);
    if (!addrCheck.valid) {
      throw new Error(`Invalid address: ${addrCheck.reason}`);
    }
    if (opts.fromChain === opts.toChain) {
      throw new Error('fromChain and toChain must be different');
    }

    // 2) 询价 + 选 route
    const quote = await this.aggregator.getQuote(opts, opts.userId, opts.strategy || 'cheapest');
    if (!quote) throw new Error('No route available');

    // 3) 安全检查
    const safety = this.validateRoute(quote.route, opts.amount);
    if (!safety.safe) {
      throw new Error(`Route unsafe: ${safety.errors.join(', ')}`);
    }

    // 4) 提交到对应 provider
    const tx: BridgeTransaction = {
      id: genId('brtx'),
      userId: opts.userId,
      quoteId: quote.id,
      route: quote.route,
      fromChain: opts.fromChain,
      toChain: opts.toChain,
      fromToken: opts.fromToken,
      toToken: opts.toToken,
      fromAmount: opts.amount,
      toAmount: quote.toAmount,
      senderAddress: opts.senderAddress,
      receiverAddress: opts.receiverAddress,
      status: 'submitting',
      startedAt: Date.now(),
      events: [],
    };

    try {
      const submitResult = await this.submitToProvider(quote.route.provider, {
        fromChain: opts.fromChain,
        toChain: opts.toChain,
        fromAddress: opts.senderAddress,
        toAddress: opts.receiverAddress,
        fromToken: opts.fromToken,
        toToken: opts.toToken,
        amount: opts.amount,
      });
      if (submitResult.messageId) tx.messageId = submitResult.messageId;
      if (submitResult.sequence) tx.sequence = submitResult.sequence;
      if (submitResult.depositId) (tx as any).depositId = submitResult.depositId;
      tx.sourceTxHash = submitResult.txHash;
      tx.status = 'submitted';
      tx.events.push({
        type: 'submitted',
        chain: opts.fromChain,
        txHash: submitResult.txHash,
        timestamp: Date.now(),
      });
    } catch (err) {
      tx.status = 'failed';
      tx.failedAt = Date.now();
      tx.errorMessage = (err as Error).message;
      tx.events.push({
        type: 'failed',
        chain: opts.fromChain,
        txHash: '',
        timestamp: Date.now(),
      });
      this.transactions.set(tx.id, tx);
      return tx;
    }

    this.transactions.set(tx.id, tx);
    return tx;
  }

  /**
   * 轮询状态
   * 自动更新 tx.status / events
   */
  async track(txId: string, timeoutMs: number = BRIDGE_TRACK_TIMEOUT_MS, pollIntervalMs: number = BRIDGE_TRACK_POLL_INTERVAL_MS): Promise<BridgeTransaction> {
    const tx = this.transactions.get(txId);
    if (!tx) throw new Error(`Transaction not found: ${txId}`);
    if (tx.status === 'completed' || tx.status === 'failed' || tx.status === 'refunded') {
      return tx;
    }
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const done = await this.pollOnce(tx);
      if (done) break;
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    return this.transactions.get(txId)!;
  }

  /** 单次轮询（测试和外部驱动用） */
  async pollOnce(tx: BridgeTransaction): Promise<boolean> {
    if (!tx.sourceTxHash) return true;
    const provider = tx.route.provider;
    let newStatus: BridgeStatus = tx.status;
    let dstTxHash: string | undefined;
    let newEvent: BridgeEvent | null = null;

    try {
      if (provider === 'LAYERZERO' && tx.messageId) {
        const lz = this.getProviders().layerzero as LayerZeroBridge;
        const s = await lz.getStatus(tx.messageId);
        if (s.status === 'DELIVERED') {
          newStatus = 'completed';
          dstTxHash = s.dstTxHash;
          newEvent = { type: 'completed', chain: tx.toChain, txHash: dstTxHash || '', timestamp: Date.now() };
        } else if (s.status === 'FAILED') {
          newStatus = 'failed';
          newEvent = { type: 'failed', chain: tx.toChain, txHash: s.dstTxHash || s.sourceTxHash || '', timestamp: Date.now() };
        }
      } else if (provider === 'WORMHOLE' && tx.sequence) {
        const wh = this.getProviders().wormhole as WormholeBridge;
        const v = await wh.getVAA(tx.sequence);
        if (v.status === 'finalized' || v.status === 'attested') {
          if (!tx.events.find(e => e.type === 'attested')) {
            tx.events.push({ type: 'attested', chain: tx.fromChain, txHash: tx.sourceTxHash || '', timestamp: Date.now() });
          }
          if (v.status === 'finalized') {
            // redeem
            const r = await wh.redeem(v.vaa || '0x', tx.toChain);
            dstTxHash = r.txHash;
            newStatus = 'completed';
            newEvent = { type: 'completed', chain: tx.toChain, txHash: r.txHash, timestamp: Date.now() };
          }
        }
      } else if (provider === 'STARGATE' && tx.messageId) {
        const sg = this.getProviders().stargate as StargateBridge;
        const stored = sg.getStoredStatus(tx.messageId);
        if (stored && stored.status === 'DELIVERED') {
          newStatus = 'completed';
          newEvent = { type: 'completed', chain: tx.toChain, txHash: stored.txHash, timestamp: Date.now() };
        }
      } else if (provider === 'ACROSS' && (tx as any).depositId) {
        const ax = this.getProviders().across as AcrossBridge;
        const s = await ax.getStatus((tx as any).depositId);
        if (s.status === 'filled') {
          newStatus = 'completed';
          dstTxHash = s.fillTxHash;
          newEvent = { type: 'completed', chain: tx.toChain, txHash: s.fillTxHash || '', timestamp: Date.now() };
        } else if (s.status === 'expired' || s.status === 'refunded') {
          newStatus = s.status === 'refunded' ? 'refunded' : 'failed';
          newEvent = { type: s.status === 'refunded' ? 'refunded' : 'failed', chain: tx.toChain, txHash: '', timestamp: Date.now() };
        }
      }
    } catch (err) {
      // 单次失败不中断整体轮询
      void err;
    }

    if (newEvent) tx.events.push(newEvent);
    if (dstTxHash) tx.destinationTxHash = dstTxHash;

    if (newStatus !== tx.status) {
      tx.status = newStatus;
      if (newStatus === 'completed') tx.completedAt = Date.now();
      if (newStatus === 'failed' || newStatus === 'refunded') tx.failedAt = Date.now();
    }
    this.transactions.set(tx.id, tx);

    return tx.status === 'completed' || tx.status === 'failed' || tx.status === 'refunded';
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getTransaction(txId: string): BridgeTransaction | null {
    return this.transactions.get(txId) || null;
  }

  getUserTransactions(userId: string, limit?: number): BridgeTransaction[] {
    const list: BridgeTransaction[] = [];
    for (const tx of this.transactions.values()) {
      if (tx.userId === userId) list.push(tx);
    }
    list.sort((a, b) => b.startedAt - a.startedAt);
    return limit ? list.slice(0, limit) : list;
  }

  /** 取消未提交交易（已 submitted 的不允许取消） */
  cancel(txId: string): boolean {
    const tx = this.transactions.get(txId);
    if (!tx) return false;
    if (tx.status === 'pending' || tx.status === 'submitting') {
      tx.status = 'failed';
      tx.failedAt = Date.now();
      tx.errorMessage = 'cancelled by user';
      tx.events.push({ type: 'failed', chain: tx.fromChain, txHash: '', timestamp: Date.now() });
      this.transactions.set(tx.id, tx);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // 安全检查
  // -------------------------------------------------------------------------

  /** 验证 route + amount */
  validateRoute(route: BridgeRoute, amount: string): SafetyCheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    if (route.securityScore < BRIDGE_MIN_SECURITY_SCORE) {
      errors.push(`security score ${route.securityScore} < ${BRIDGE_MIN_SECURITY_SCORE}`);
    } else if (route.securityScore < 80) {
      warnings.push(`security score ${route.securityScore} is below 80`);
    }
    if (cmpStr(amount, route.minAmount) < 0) {
      errors.push(`amount ${amount} < minAmount ${route.minAmount}`);
    }
    if (cmpStr(amount, route.maxAmount) > 0) {
      errors.push(`amount ${amount} > maxAmount ${route.maxAmount}`);
    }
    if (cmpStr(route.liquidityAvailable, amount) < 0) {
      errors.push(`insufficient liquidity: ${route.liquidityAvailable} < ${amount}`);
    }
    const impactPct = route.bridgeFee && amount && BigInt(amount) > 0n
      ? Number(BigInt(route.bridgeFee)) / Number(BigInt(amount))
      : 0;
    if (impactPct > BRIDGE_MAX_PRICE_IMPACT) {
      warnings.push(`bridge fee / amount ratio ${(impactPct * 100).toFixed(2)}% > ${BRIDGE_MAX_PRICE_IMPACT * 100}%`);
    }
    return { safe: errors.length === 0, warnings, errors };
  }

  validateAddresses(sender: string, receiver: string): AddressValidationResult {
    if (!isValidEvmAddress(sender)) return { valid: false, reason: `invalid sender: ${sender}` };
    if (!isValidEvmAddress(receiver)) return { valid: false, reason: `invalid receiver: ${receiver}` };
    if (sender.toLowerCase() === receiver.toLowerCase()) {
      return { valid: false, reason: 'sender and receiver cannot be the same' };
    }
    return { valid: true };
  }

  /** 检查目标链 / 接收方是否支持该代币（演示版：检查代币注册表） */
  checkReceiverSupportsToken(toChain: ChainId, toToken: string, toAddress: string): boolean {
    if (!isValidEvmAddress(toAddress)) return false;
    const info = BRIDGE_TOKENS.find(t => t.symbol.toUpperCase() === toToken.toUpperCase());
    if (!info) return false;
    if (info.isNative) return true; // 原生币：所有链都支持
    return !!info.addresses[toChain];
  }

  // -------------------------------------------------------------------------
  // 历史 + 统计
  // -------------------------------------------------------------------------

  getHistoryByChain(fromChain: ChainId, days: number = 7): BridgeTransaction[] {
    const cutoff = Date.now() - days * 24 * 60 * 60_000;
    const list: BridgeTransaction[] = [];
    for (const tx of this.transactions.values()) {
      if (tx.fromChain === fromChain && tx.startedAt >= cutoff) list.push(tx);
    }
    return list.sort((a, b) => b.startedAt - a.startedAt);
  }

  getTotalVolumeByToken(token: string, days: number = 7): string {
    const cutoff = Date.now() - days * 24 * 60 * 60_000;
    const upper = token.toUpperCase();
    let total = 0n;
    for (const tx of this.transactions.values()) {
      if (tx.fromToken.toUpperCase() === upper && tx.startedAt >= cutoff) {
        total += BigInt(tx.fromAmount);
      }
    }
    return total.toString();
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private async submitToProvider(provider: string, opts: any): Promise<{ messageId?: string; sequence?: string; depositId?: string; txHash: string }> {
    if (provider === 'LAYERZERO') {
      const lz = this.getProviders().layerzero as LayerZeroBridge;
      const r = await lz.send(opts);
      return { messageId: r.messageId, txHash: r.txHash };
    }
    if (provider === 'WORMHOLE') {
      const wh = this.getProviders().wormhole as WormholeBridge;
      const r = await wh.send(opts);
      return { sequence: r.sequence, txHash: r.txHash };
    }
    if (provider === 'STARGATE') {
      const sg = this.getProviders().stargate as StargateBridge;
      const r = await sg.send(opts);
      return { messageId: r.messageId, txHash: r.txHash };
    }
    if (provider === 'ACROSS') {
      const ax = this.getProviders().across as AcrossBridge;
      const r = await ax.send(opts);
      return { depositId: r.depositId, txHash: r.txHash };
    }
    throw new Error(`Unknown provider: ${provider}`);
  }
}
