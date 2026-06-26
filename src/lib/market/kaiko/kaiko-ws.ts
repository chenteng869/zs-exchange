/**
 * Kaiko WebSocket 客户端 (P2 Kaiko)
 *
 * 提供：
 *  - 实时推送（trades / orderbook / price / price.aggregated）
 *  - 自动重连（指数退避）
 *  - 鉴权：URL query `?api_key=xxx`
 *  - 订阅/取消订阅：`subscribe(channel, handler) / unsubscribe(channel)`
 *  - 演示降级：API Key 含 'mock' 时使用内存模拟推送
 *
 * WS 端点：
 *  - US: wss://us.market-api.kaiko.io/v2/data/trades.wsv2.eur
 *  - EU: wss://eu.market-api.kaiko.io/v2/data/trades.wsv2.eur
 *  - Global: wss://market-api.kaiko.io/v2/data/trades.wsv2.eur
 *
 * 订阅 channel 格式：
 *  - trades.{exchange}.{pair}              逐笔成交
 *  - orderbook.{exchange}.{pair}           盘口快照
 *  - price.{exchange}.{pair}               价格 tick
 *  - price.aggregated.{pair}               跨交易所聚合价
 */

import { EventEmitter } from 'events';
import type {
  KaikoWsChannel,
  KaikoWsMessage,
  Region,
} from './types';
import { KAIKO_ENDPOINTS, KaikoError } from './kaiko-client';

// =============================================================================
// 配置
// =============================================================================

/** WS 默认配置 */
const DEFAULT_INITIAL_RECONNECT_MS = 500;
const DEFAULT_MAX_RECONNECT_MS = 10_000;
const DEFAULT_HEARTBEAT_MS = 30_000;

const REGION_FALLBACK: Record<Region, Region[]> = {
  us: ['us', 'eu', 'global'],
  eu: ['eu', 'us', 'global'],
  ap: ['ap', 'us', 'eu', 'global'],
  global: ['global', 'us', 'eu'],
};

// =============================================================================
// 类型
// =============================================================================

export interface KaikoWebSocketClientOptions {
  apiKey: string;
  region?: Region;
  initialReconnectMs?: number;
  maxReconnectMs?: number;
  heartbeatMs?: number;
  WebSocketImpl?: typeof WebSocket;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onReconnect?: (attempt: number, delayMs: number) => void;
  onError?: (err: Error) => void;
}

export type KaikoWsMessageHandler = (msg: KaikoWsMessage) => void;

interface ChannelEntry {
  handlers: Set<KaikoWsMessageHandler>;
  /** 发送过的 SUBSCRIBE 消息是否已发送 */
  subscribed: boolean;
}

// =============================================================================
// WebSocket Client
// =============================================================================

export class KaikoWebSocketClient extends EventEmitter {
  private readonly apiKey: string;
  private readonly region: Region;
  private readonly initialReconnectMs: number;
  private readonly maxReconnectMs: number;
  private readonly heartbeatMs: number;
  private readonly WebSocketImpl: typeof WebSocket;
  private readonly onOpen?: () => void;
  private readonly onClose?: (code: number, reason: string) => void;
  private readonly onReconnect?: (attempt: number, delayMs: number) => void;
  private readonly onError?: (err: Error) => void;

  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isClosing = false;
  private isConnected = false;
  private readonly channels: Map<string, ChannelEntry> = new Map();
  /** mock 模式下的 interval */
  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private readonly isMock: boolean;

  constructor(opts: KaikoWebSocketClientOptions) {
    super();
    if (!opts || !opts.apiKey) {
      throw new KaikoError('NO_API_KEY', 'Kaiko API key is required');
    }
    this.apiKey = opts.apiKey;
    this.region = opts.region || 'us';
    this.initialReconnectMs = opts.initialReconnectMs ?? DEFAULT_INITIAL_RECONNECT_MS;
    this.maxReconnectMs = opts.maxReconnectMs ?? DEFAULT_MAX_RECONNECT_MS;
    this.heartbeatMs = opts.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
    this.WebSocketImpl = opts.WebSocketImpl || (typeof WebSocket !== 'undefined' ? WebSocket : (() => {
      throw new KaikoError('NO_WEBSOCKET', 'No WebSocket implementation available');
    })() as typeof WebSocket);
    this.onOpen = opts.onOpen;
    this.onClose = opts.onClose;
    this.onReconnect = opts.onReconnect;
    this.onError = opts.onError;
    this.isMock = this.apiKey.toLowerCase().includes('mock');
  }

  get connected(): boolean {
    return this.isConnected;
  }

  /** 启动连接 */
  connect(): void {
    if (this.isMock) {
      this.connectMock();
      return;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.isClosing = false;
    const url = this.buildUrl();
    try {
      this.ws = new this.WebSocketImpl(url);
    } catch (err) {
      this.onError?.(err as Error);
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => this.handleOpen();
    this.ws.onmessage = (ev) => this.handleMessage(ev);
    this.ws.onerror = (ev) => {
      this.onError?.(new Error('WebSocket error'));
    };
    this.ws.onclose = (ev) => this.handleClose(ev);
  }

  /** 主动断开（不重连） */
  disconnect(): void {
    this.isClosing = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close(1000, 'client_close');
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * 订阅 channel
   * @param channel 频道名（支持 trades/exchange/pair / orderbook.ex.pair / price.ex.pair / price.aggregated.pair）
   * @param handler 消息处理器
   * @returns 取消订阅函数
   */
  subscribe(channel: string, handler: KaikoWsMessageHandler): () => void {
    let entry = this.channels.get(channel);
    if (!entry) {
      entry = { handlers: new Set(), subscribed: false };
      this.channels.set(channel, entry);
    }
    entry.handlers.add(handler);

    if (this.isMock) {
      // mock 模式不需要发送订阅
      entry.subscribed = true;
      return () => this.unsubscribeChannel(channel, handler);
    }

    if (this.isConnected && this.ws) {
      this.sendSubscribe([channel]);
      entry.subscribed = true;
    } else {
      this.connect();
    }

    return () => this.unsubscribeChannel(channel, handler);
  }

  /**
   * 取消订阅 channel
   */
  unsubscribe(channel: string): void {
    this.unsubscribeChannel(channel);
  }

  /**
   * 获取某个 channel 的最近一次消息
   */
  getLastMessage(channel: string): KaikoWsMessage | null {
    return this.lastMessages.get(channel) ?? null;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private lastMessages: Map<string, KaikoWsMessage> = new Map();

  private buildUrl(): string {
    const base = KAIKO_ENDPOINTS[this.region];
    return `${base}/v2/data/trades.wsv2.usd?api_key=${encodeURIComponent(this.apiKey)}`;
  }

  private sendSubscribe(channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          action: 'subscribe',
          channels,
        }),
      );
    } catch (err) {
      this.onError?.(err as Error);
    }
  }

  private sendUnsubscribe(channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          action: 'unsubscribe',
          channels,
        }),
      );
    } catch (err) {
      this.onError?.(err as Error);
    }
  }

  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempt = 0;
    // 重新订阅所有
    const allChannels = Array.from(this.channels.keys());
    if (allChannels.length > 0) {
      this.sendSubscribe(allChannels);
      for (const ch of allChannels) {
        const e = this.channels.get(ch);
        if (e) e.subscribed = true;
      }
    }
    // 心跳
    if (this.heartbeatMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ action: 'ping' }));
          } catch {
            /* ignore */
          }
        }
      }, this.heartbeatMs);
    }
    this.onOpen?.();
  }

  private handleMessage(ev: MessageEvent): void {
    let payload: unknown;
    try {
      payload = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    } catch {
      return;
    }
    if (typeof payload !== 'object' || payload === null) return;
    const obj = payload as Record<string, unknown>;
    const message: KaikoWsMessage = {
      type: (obj.type as KaikoWsMessage['type']) ?? 'heartbeat',
      channel: obj.channel as string | undefined,
      exchange: obj.exchange as string | undefined,
      pair: obj.pair as string | undefined,
      data: obj.data,
      timestamp: (obj.timestamp as number) ?? Date.now(),
      message: obj.message as string | undefined,
    };
    // 分发
    if (message.channel) {
      this.lastMessages.set(message.channel, message);
      const entry = this.channels.get(message.channel);
      if (entry) {
        for (const h of entry.handlers) {
          try {
            h(message);
          } catch (err) {
            this.onError?.(err as Error);
          }
        }
      }
    } else {
      // 没有 channel 字段：尝试按 type 匹配
      this.emit('message', message);
    }
  }

  private handleClose(ev: CloseEvent): void {
    this.isConnected = false;
    this.clearHeartbeat();
    this.onClose?.(ev.code, ev.reason);
    if (this.isClosing) return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.isClosing) return;
    this.reconnectAttempt += 1;
    const base = this.initialReconnectMs * Math.pow(2, this.reconnectAttempt - 1);
    const delay = Math.min(base, this.maxReconnectMs);
    this.onReconnect?.(this.reconnectAttempt, delay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }
  }

  private unsubscribeChannel(channel: string, handler?: KaikoWsMessageHandler): void {
    const entry = this.channels.get(channel);
    if (!entry) return;
    if (handler) {
      entry.handlers.delete(handler);
    } else {
      entry.handlers.clear();
    }
    if (entry.handlers.size === 0) {
      this.channels.delete(channel);
      this.lastMessages.delete(channel);
      if (this.isConnected && !this.isMock) {
        this.sendUnsubscribe([channel]);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Mock 模式：内存定时推送
  // -------------------------------------------------------------------------

  private connectMock(): void {
    this.isConnected = true;
    this.isClosing = false;
    this.mockTimer = setInterval(() => {
      for (const [channel, entry] of this.channels.entries()) {
        const msg = buildMockMessage(channel);
        if (msg) {
          this.lastMessages.set(channel, msg);
          for (const h of entry.handlers) {
            try {
              h(msg);
            } catch (err) {
              this.onError?.(err as Error);
            }
          }
        }
      }
    }, 1000);
    this.onOpen?.();
  }
}

function buildMockMessage(channel: string): KaikoWsMessage | null {
  if (channel.startsWith('trades.')) {
    const rest = channel.slice('trades.'.length);
    const [exchange, pair] = rest.split('.');
    const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
    const price = (base * (1 + (Math.random() - 0.5) * 0.001)).toFixed(8);
    return {
      type: 'trade',
      channel,
      exchange,
      pair,
      data: {
        id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        price,
        amount: (Math.random() * 0.5).toFixed(6),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
      },
      timestamp: Date.now(),
    };
  }
  if (channel.startsWith('orderbook.')) {
    const rest = channel.slice('orderbook.'.length);
    const [exchange, pair] = rest.split('.');
    const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
    const mid = base;
    return {
      type: 'orderbook',
      channel,
      exchange,
      pair,
      data: {
        bids: Array.from({ length: 10 }, (_, i) => [(mid * (1 - (i + 1) * 0.0002)).toFixed(8), (Math.random() + 0.1).toFixed(4)]),
        asks: Array.from({ length: 10 }, (_, i) => [(mid * (1 + (i + 1) * 0.0002)).toFixed(8), (Math.random() + 0.1).toFixed(4)]),
      },
      timestamp: Date.now(),
    };
  }
  if (channel.startsWith('price.aggregated.')) {
    const pair = channel.slice('price.aggregated.'.length);
    const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
    return {
      type: 'aggregated_price',
      channel,
      pair,
      data: { price: (base * (1 + (Math.random() - 0.5) * 0.0005)).toFixed(8) },
      timestamp: Date.now(),
    };
  }
  if (channel.startsWith('price.')) {
    const rest = channel.slice('price.'.length);
    const [exchange, pair] = rest.split('.');
    const base = pair.startsWith('btc') ? 67000 : pair.startsWith('eth') ? 3500 : 100;
    return {
      type: 'price',
      channel,
      exchange,
      pair,
      data: { price: (base * (1 + (Math.random() - 0.5) * 0.0005)).toFixed(8) },
      timestamp: Date.now(),
    };
  }
  return null;
}

// =============================================================================
// 便捷工厂
// =============================================================================

export function createKaikoWebSocketClient(opts: KaikoWebSocketClientOptions): KaikoWebSocketClient {
  return new KaikoWebSocketClient(opts);
}

/** 区域降级顺序（导出便于业务层使用） */
export const KAIKO_WS_REGION_FALLBACK = REGION_FALLBACK;
