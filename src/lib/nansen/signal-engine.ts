/**
 * Nansen Signal Engine - 智能信号处理引擎
 *
 * 职责：
 *  - 信号订阅（WebSocket 实时推送 + 轮询兜底）
 *  - 信号过滤（金额 / 钱包标签 / 时间 / 类型 / 链 / 代币）
 *  - 信号聚合（按 token / wallet / 类型）
 *  - 信心分（conviction）计算
 *  - 事件总线
 *
 * 演示降级：
 *  - mock 模式下由 emitDemoSignal 模拟推流
 *  - WebSocket 不可用时使用 setInterval 轮询 NansenClient
 */

import { NansenClient } from './nansen-client';
import {
  Chain,
  SignalType,
  SmartMoneySignal,
  WalletLabel,
  addStr,
  NANSEN_DEFAULT_SIGNAL_LOOKBACK_HOURS,
  NANSEN_WS_URL,
} from './types';

// =============================================================================
// 类型
// =============================================================================

export interface SignalSubscription {
  chains?: Chain[];
  tokens?: string[];
  types?: SignalType[];
  walletLabels?: WalletLabel[];
  /** 最小 USD 价值 */
  minUsd?: number;
  /** 最大 USD 价值 */
  maxUsd?: number;
}

export interface SignalHandler {
  (signal: SmartMoneySignal): void | Promise<void>;
}

export interface SignalStats {
  token: string;
  count: number;
  buyCount: number;
  sellCount: number;
  totalUsd: string;
  netFlow: string; // buy - sell 的 USD 净值
  avgConfidence: number;
  uniqueWallets: number;
  lastSignalAt: number;
}

export interface SignalEngineOptions {
  client: NansenClient;
  /** 轮询间隔（毫秒） */
  pollIntervalMs?: number;
  /** 初始回溯（毫秒） */
  initialLookbackMs?: number;
  /** 是否启用 WebSocket（mock 模式自动禁用） */
  enableWebSocket?: boolean;
  /** 自定义 WS 构造（测试用） */
  webSocketFactory?: (url: string) => WebSocketLike;
  /** 时钟（测试用） */
  now?: () => number;
  /** logger */
  logger?: { debug: (...args: any[]) => void; info: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void };
}

export interface WebSocketLike {
  onmessage: ((ev: { data: string }) => void) | null;
  onopen: (() => void) | null;
  onerror: ((err: any) => void) | null;
  onclose: (() => void) | null;
  send(data: string): void;
  close(): void;
}

interface InternalSub {
  id: string;
  opts: SignalSubscription;
  handler: SignalHandler;
  active: boolean;
}

// =============================================================================
// SignalEngine
// =============================================================================

export class SignalEngine {
  private readonly client: NansenClient;
  private readonly pollIntervalMs: number;
  private readonly initialLookbackMs: number;
  private readonly enableWebSocket: boolean;
  private readonly webSocketFactory: (url: string) => WebSocketLike;
  private readonly now: () => number;
  private readonly logger: SignalEngineOptions['logger'];

  private readonly subs: Map<string, InternalSub> = new Map();
  private readonly globalHandlers: Set<SignalHandler> = new Set();
  private readonly signalBuffer: SmartMoneySignal[] = [];
  private ws: WebSocketLike | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private demoTimer: NodeJS.Timeout | null = null;
  private lastFetchAt: number = 0;
  private subSeq = 0;

  constructor(opts: SignalEngineOptions) {
    this.client = opts.client;
    this.pollIntervalMs = opts.pollIntervalMs ?? 15_000;
    this.initialLookbackMs = opts.initialLookbackMs ?? NANSEN_DEFAULT_SIGNAL_LOOKBACK_HOURS * 3_600_000;
    this.enableWebSocket = opts.enableWebSocket !== false;
    this.webSocketFactory =
      opts.webSocketFactory ||
      ((url) => new (require('ws'))(url) as unknown as WebSocketLike);
    this.now = opts.now || (() => Date.now());
    this.logger = opts.logger || {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  /**
   * 订阅信号
   * @returns unsubscribe 函数
   */
  subscribeSignals(opts: SignalSubscription, handler: SignalHandler): () => void {
    this.subSeq += 1;
    const id = `sub_${this.subSeq}`;
    const sub: InternalSub = { id, opts, handler, active: true };
    this.subs.set(id, sub);
    this.ensureRunning();
    return () => {
      sub.active = false;
      this.subs.delete(id);
      if (this.subs.size === 0 && this.globalHandlers.size === 0) {
        this.stop();
      }
    };
  }

  /** 全局信号监听（接收所有信号，无过滤） */
  onSignal(handler: SignalHandler): () => void {
    this.globalHandlers.add(handler);
    this.ensureRunning();
    return () => {
      this.globalHandlers.delete(handler);
      if (this.subs.size === 0 && this.globalHandlers.size === 0) {
        this.stop();
      }
    };
  }

  // -------------------------------------------------------------------------
  // 投递
  // -------------------------------------------------------------------------

  /** 主动注入一条信号（用于测试或人工触发） */
  ingestSignal(signal: SmartMoneySignal): void {
    this.signalBuffer.push(signal);
    this.dispatch(signal);
  }

  private dispatch(signal: SmartMoneySignal): void {
    // 全局 handler 无条件触发
    for (const h of this.globalHandlers) {
      try {
        void h(signal);
      } catch (e) {
        this.logger.error('SignalEngine: global handler error', e);
      }
    }
    // 订阅按过滤条件触发
    for (const sub of this.subs.values()) {
      if (!sub.active) continue;
      if (!this.matches(signal, sub.opts)) continue;
      try {
        void sub.handler(signal);
      } catch (e) {
        this.logger.error('SignalEngine: sub handler error', e);
      }
    }
  }

  private matches(signal: SmartMoneySignal, opts: SignalSubscription): boolean {
    if (opts.chains && opts.chains.length > 0 && !opts.chains.includes(signal.chain)) return false;
    if (opts.tokens && opts.tokens.length > 0) {
      const sigToken = signal.token.address.toLowerCase();
      if (!opts.tokens.some((t) => t.toLowerCase() === sigToken)) return false;
    }
    if (opts.types && opts.types.length > 0 && !opts.types.includes(signal.signalType)) return false;
    if (opts.minUsd !== undefined && Number(signal.amountUsd) < opts.minUsd) return false;
    if (opts.maxUsd !== undefined && Number(signal.amountUsd) > opts.maxUsd) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // 过滤 / 聚合 / 信心分
  // -------------------------------------------------------------------------

  /** 按 USD 金额过滤 */
  filterByAmount(signals: SmartMoneySignal[], min?: number, max?: number): SmartMoneySignal[] {
    return signals.filter((s) => {
      const v = Number(s.amountUsd);
      if (min !== undefined && v < min) return false;
      if (max !== undefined && v > max) return false;
      return true;
    });
  }

  /** 按钱包标签过滤（需要传入已查询的标签映射，简化版本按 walletAddress 末位 hash 模拟） */
  filterByWallet(signals: SmartMoneySignal[], labels: WalletLabel[]): SmartMoneySignal[] {
    if (labels.length === 0) return signals;
    return signals.filter((s) => {
      // demo：从地址末位推断标签
      const inferred = this.inferLabelsForAddress(s.walletAddress);
      return labels.some((l) => inferred.includes(l));
    });
  }

  /** 按时间过滤 */
  filterByTime(signals: SmartMoneySignal[], since?: number, until?: number): SmartMoneySignal[] {
    return signals.filter((s) => {
      if (since !== undefined && s.timestamp < since) return false;
      if (until !== undefined && s.timestamp > until) return false;
      return true;
    });
  }

  /** 按 token 聚合统计 */
  groupByToken(signals: SmartMoneySignal[]): Record<string, SignalStats> {
    const groups: Record<string, SmartMoneySignal[]> = {};
    for (const s of signals) {
      const key = s.token.symbol;
      (groups[key] = groups[key] || []).push(s);
    }
    const out: Record<string, SignalStats> = {};
    for (const [k, arr] of Object.entries(groups)) {
      const buy = arr.filter((s) => s.signalType === 'buy' || s.signalType === 'accumulate');
      const sell = arr.filter((s) => s.signalType === 'sell' || s.signalType === 'distribute');
      const buyUsd = buy.reduce((a, b) => a + Number(b.amountUsd), 0);
      const sellUsd = sell.reduce((a, b) => a + Number(b.amountUsd), 0);
      out[k] = {
        token: k,
        count: arr.length,
        buyCount: buy.length,
        sellCount: sell.length,
        totalUsd: arr.reduce((a, b) => a + Number(b.amountUsd), 0).toString(),
        netFlow: (buyUsd - sellUsd).toString(),
        avgConfidence: arr.reduce((a, b) => a + b.confidence, 0) / Math.max(1, arr.length),
        uniqueWallets: new Set(arr.map((s) => s.walletAddress.toLowerCase())).size,
        lastSignalAt: arr.reduce((m, s) => Math.max(m, s.timestamp), 0),
      };
    }
    return out;
  }

  /**
   * 计算信号聚合 conviction 0-1
   * 因子：
   *  - 信号数量（多更可信）
   *  - 唯一钱包数（去重）
   *  - 平均 confidence
   *  - 买卖比例偏向（一面倒 = 强信号）
   */
  calculateConviction(signals: SmartMoneySignal[]): number {
    if (signals.length === 0) return 0;
    const totalUsd = signals.reduce((a, b) => a + Number(b.amountUsd), 0);
    const uniqueWallets = new Set(signals.map((s) => s.walletAddress.toLowerCase())).size;
    const avgConf = signals.reduce((a, b) => a + b.confidence, 0) / signals.length;
    const buy = signals.filter((s) => s.signalType === 'buy' || s.signalType === 'accumulate').length;
    const sell = signals.filter((s) => s.signalType === 'sell' || s.signalType === 'distribute').length;
    const sideRatio = Math.max(buy, sell) / Math.max(1, signals.length);

    // 数量贡献（log 衰减）
    const countScore = Math.min(1, Math.log10(signals.length + 1) / 2);
    // 钱包多样性
    const walletScore = Math.min(1, uniqueWallets / 10);
    // 体量
    const volScore = Math.min(1, Math.log10(totalUsd + 1) / 7);
    // 信心
    const confScore = Math.max(0, Math.min(1, avgConf));
    // 方向
    const dirScore = Math.max(0, Math.min(1, (sideRatio - 0.5) * 2));

    return (
      countScore * 0.2 +
      walletScore * 0.2 +
      volScore * 0.2 +
      confScore * 0.25 +
      dirScore * 0.15
    );
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private ensureRunning(): void {
    if (this.client.isMock()) {
      this.startDemoLoop();
    } else if (this.enableWebSocket) {
      this.startWebSocket();
    }
    if (!this.pollTimer) this.startPolling();
  }

  private stop(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        /* ignore */
      }
      this.ws = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
  }

  private startWebSocket(): void {
    if (this.ws) return;
    try {
      this.ws = this.webSocketFactory(NANSEN_WS_URL);
      this.ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed && parsed.signal) {
            this.ingestSignal(parsed.signal as SmartMoneySignal);
          } else if (Array.isArray(parsed?.signals)) {
            for (const s of parsed.signals) this.ingestSignal(s);
          }
        } catch (e) {
          this.logger.warn('SignalEngine: bad WS payload', e);
        }
      };
      this.ws.onerror = (err) => this.logger.warn('SignalEngine: WS error', err);
    } catch (e) {
      this.logger.warn('SignalEngine: WS init failed, fallback to poll', e);
    }
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.lastFetchAt = this.now() - this.initialLookbackMs;
    this.pollTimer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
    // 立即拉一次
    void this.pollOnce();
  }

  private async pollOnce(): Promise<void> {
    try {
      const since = this.lastFetchAt;
      const fresh = await this.client.getSmartMoneySignals({ since, limit: 100 });
      this.lastFetchAt = this.now();
      for (const s of fresh) {
        this.signalBuffer.push(s);
        this.dispatch(s);
      }
      // 限制 buffer 长度
      if (this.signalBuffer.length > 5_000) {
        this.signalBuffer.splice(0, this.signalBuffer.length - 5_000);
      }
    } catch (e) {
      this.logger.warn('SignalEngine: poll failed', e);
    }
  }

  private startDemoLoop(): void {
    if (this.demoTimer) return;
    this.demoTimer = setInterval(() => {
      const demo = this.buildDemoSignal();
      this.signalBuffer.push(demo);
      this.dispatch(demo);
    }, Math.min(this.pollIntervalMs, 10_000));
  }

  private buildDemoSignal(): SmartMoneySignal {
    const symbols = ['WETH', 'USDC', 'ARB', 'PEPE'];
    const types: SignalType[] = ['buy', 'sell', 'accumulate', 'distribute'];
    const i = this.signalBuffer.length;
    const symbol = symbols[i % symbols.length];
    const type = types[i % types.length];
    return {
      id: `demo_sig_${i}`,
      chain: 'ethereum',
      walletAddress: `0x${((i + 1) % 256).toString(16).padStart(40, '0')}`,
      signalType: type,
      token: {
        symbol,
        address: symbol === 'WETH'
          ? '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
          : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: symbol === 'USDC' ? 6 : 18,
      },
      amount: (1_000_000n * 1_000_000n).toString(),
      amountUsd: (50_000 + (i % 9) * 25_000).toString(),
      txHash: `0x${(i + 1).toString(16).padStart(64, '0')}`,
      blockNumber: 18_000_000 + i,
      timestamp: this.now(),
      triggeredRules: ['SMART_MONEY_FLOW'],
      confidence: 0.65 + ((i % 4) * 0.05),
    };
  }

  private inferLabelsForAddress(address: string): WalletLabel[] {
    const lastHex = parseInt(address.slice(-1), 16);
    if (isNaN(lastHex)) return ['contract'];
    if (lastHex < 2) return ['smart_money', 'whale'];
    if (lastHex < 4) return ['cex'];
    if (lastHex < 6) return ['dex'];
    if (lastHex < 8) return ['vc', 'fund'];
    if (lastHex < 10) return ['whale'];
    if (lastHex < 12) return ['fresh_wallet'];
    if (lastHex < 14) return ['mev_bot'];
    return ['high_value'];
  }

  // -------------------------------------------------------------------------
  // 状态
  // -------------------------------------------------------------------------

  getBuffer(): SmartMoneySignal[] {
    return [...this.signalBuffer];
  }

  subCount(): number {
    return this.subs.size;
  }

  close(): void {
    this.stop();
    this.subs.clear();
    this.globalHandlers.clear();
  }
}
