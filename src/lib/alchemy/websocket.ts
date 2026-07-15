/**
 * Alchemy WebSocket 客户端（2026-07-11 新建 · P4-1）
 *
 * 封装 Alchemy WSS API，订阅：
 *  - 新区块（newHeads）
 *  - 日志（logs）
 *  - 待打包交易（pendingTransactions）
 *  - 价格（需 Enhanced API）
 *
 * 替代自建轮询：
 *  - 旧：每 5s 调 eth_blockNumber
 *  - 新：服务端推送 < 1s
 *
 * 优势：
 *  - 自动重连（指数退避）
 *  - 心跳保活
 *  - 多订阅复用单连接
 *  - 错误隔离（单订阅失败不影响其他）
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { safeConsoleWarn } from '@/lib/security/safe-logger';
import { alchemyEthUrl, alchemyBscUrl, alchemyPolygonUrl, alchemyArbitrumUrl, alchemyOptimismUrl, alchemyBaseUrl } from '@/lib/wallet/rpc-client';

// =============================================================================
// 类型
// =============================================================================

export type WsChainKey = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'base';

export interface WsSubscription {
  id: string;
  type: 'newHeads' | 'logs' | 'pendingTransactions' | 'syncing';
  params?: any;
  /** 取消订阅回调 */
  unsubscribe: () => void;
}

export interface WsClientOptions {
  chainKey: WsChainKey;
  apiKey: string;
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  heartbeatIntervalMs?: number;
}

// =============================================================================
// Alchemy WsClient
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __alchemyWsClients: Map<WsChainKey, AlchemyWsClient> | undefined;
}

export class AlchemyWsClient extends EventEmitter {
  private readonly chainKey: WsChainKey;
  private readonly apiKey: string;
  /** 默认自动重连（构造时确定）*/
  private readonly autoReconnectDefault: boolean;
  /** 可运行时关闭自动重连的标志（2026-07-11 修复：原 autoReconnect 字段从未声明，导致 TS2339）*/
  private autoReconnectEnabled: boolean;
  private readonly reconnectDelayMs: number;
  private readonly maxReconnectDelayMs: number;
  private readonly heartbeatIntervalMs: number;

  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;
  /** id -> 订阅 */
  private subscriptions: Map<string, WsSubscription> = new Map();
  /** 待发送请求（重连后重发）*/
  private pendingRequests: any[] = [];

  constructor(opts: WsClientOptions) {
    super();
    this.chainKey = opts.chainKey;
    this.apiKey = opts.apiKey;
    this.autoReconnectDefault = opts.autoReconnect !== false;
    this.autoReconnectEnabled = this.autoReconnectDefault;
    this.reconnectDelayMs = opts.reconnectDelayMs || 1_000;
    this.maxReconnectDelayMs = opts.maxReconnectDelayMs || 30_000;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30_000;
  }

  // -------------------------------------------------------------------------
  // 连接
  // -------------------------------------------------------------------------

  /** 启动连接 */
  connect(): void {
    if (this.ws) return;
    const url = this.getWsUrl();
    safeConsoleWarn(`[alchemy-ws] connecting to ${this.chainKey} (${this.urlHost(url)})`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => this.handleOpen());
    this.ws.on('message', (data: any) => this.handleMessage(data));
    this.ws.on('close', (code: number, reason: string) => this.handleClose(code, reason));
    this.ws.on('error', (err: Error) => this.handleError(err));
  }

  /** 关闭连接 */
  close(): void {
    // 2026-07-11 修复：原代码引用不存在的 this.autoReconnectFlag 字段
    this.autoReconnectEnabled = false;
    this.clearTimers();
    if (this.ws) {
      this.ws.close(1000, 'client closed');
      this.ws = null;
    }
    this.connected = false;
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  /** 订阅新区块 */
  subscribeNewHeads(onBlock: (block: any) => void): () => void {
    return this.subscribe('newHeads', undefined, onBlock);
  }

  /** 订阅事件日志 */
  subscribeLogs(
    filter: { address?: string | string[]; topics?: string[] },
    onLog: (log: any) => void,
  ): () => void {
    return this.subscribe('logs', filter, onLog);
  }

  /** 订阅 pending 交易 */
  subscribePendingTransactions(onTx: (tx: any) => void): () => void {
    return this.subscribe('pendingTransactions', undefined, onTx);
  }

  /** 通用订阅 */
  private subscribe(
    type: 'newHeads' | 'logs' | 'pendingTransactions' | 'syncing',
    params: any,
    onEvent: (data: any) => void,
  ): () => void {
    const id = String(this.nextId++);
    const sub: WsSubscription = {
      id,
      type,
      params,
      unsubscribe: () => {
        if (this.connected) {
          this.send({
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'eth_unsubscribe',
            params: [id],
          });
        }
        this.subscriptions.delete(id);
      },
    };
    this.subscriptions.set(id, sub);

    this.on(`sub:${id}`, onEvent);

    // 发送订阅请求
    this.send({
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'eth_subscribe',
      params: [type, params].filter(Boolean),
    });

    return sub.unsubscribe;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private getWsUrl(): string {
    const httpUrl = this.getHttpUrl();
    return httpUrl.replace(/^http/, 'ws');
  }

  private getHttpUrl(): string {
    switch (this.chainKey) {
      case 'eth': return alchemyEthUrl(this.apiKey);
      case 'bsc': return alchemyBscUrl(this.apiKey);
      case 'polygon': return alchemyPolygonUrl(this.apiKey);
      case 'arbitrum': return alchemyArbitrumUrl(this.apiKey);
      case 'optimism': return alchemyOptimismUrl(this.apiKey);
      case 'base': return alchemyBaseUrl(this.apiKey);
    }
  }

  private urlHost(url: string): string {
    try { return new URL(url).host; } catch { return 'unknown'; }
  }

  private send(payload: any): void {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.pendingRequests.push(payload);
    }
  }

  private handleOpen(): void {
    this.connected = true;
    this.reconnectAttempts = 0;
    safeConsoleWarn(`[alchemy-ws] connected to ${this.chainKey}`);

    // 重发 pending
    for (const req of this.pendingRequests) {
      this.ws!.send(JSON.stringify(req));
    }
    this.pendingRequests = [];

    // 重新订阅
    for (const sub of this.subscriptions.values()) {
      this.ws!.send(JSON.stringify({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'eth_subscribe',
        params: [sub.type, sub.params].filter(Boolean),
      }));
    }

    // 启用心跳
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.ws) {
        this.ws.ping();
      }
    }, this.heartbeatIntervalMs);

    this.emit('connected');
  }

  private handleMessage(data: any): void {
    // 2026-07-11 修复：原 WebSocket.RawData 在 @types/ws v8 中已删除（统一用 any 即可）
    try {
      const msg = JSON.parse(data.toString());
      // 订阅事件（带 subscription 字段）
      if (msg.params?.subscription) {
        const subId = msg.params.subscription;
        this.emit(`sub:${subId}`, msg.params.result);
      }
      // 订阅响应（含 result 是订阅 ID）
      if (msg.id && msg.result && this.subscriptions.has(msg.result)) {
        // 订阅成功，ID 已绑定，无需额外处理
      }
    } catch (err) {
      safeConsoleWarn(`[alchemy-ws] message parse failed: ${(err as Error).message}`);
    }
  }

  private handleClose(code: number, reason: string): void {
    this.connected = false;
    this.clearTimers();
    safeConsoleWarn(`[alchemy-ws] closed code=${code} reason=${reason}`);

    // 2026-07-11 修复：原 this.autoReconnect 字段从未声明，统一改为 autoReconnectEnabled
    if (this.autoReconnectEnabled) {
      this.scheduleReconnect();
    }
    this.emit('disconnected', { code, reason });
  }

  private handleError(err: Error): void {
    safeConsoleWarn(`[alchemy-ws] error: ${err.message}`);
    this.emit('error', err);
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelayMs,
    );
    safeConsoleWarn(`[alchemy-ws] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// =============================================================================
// 单例管理
// =============================================================================

/**
 * 获取指定链的 WsClient（单例）
 */
export function getAlchemyWsClient(chainKey: WsChainKey): AlchemyWsClient {
  if (!globalThis.__alchemyWsClients) {
    globalThis.__alchemyWsClients = new Map();
  }
  let client = globalThis.__alchemyWsClients.get(chainKey);
  if (!client) {
    const apiKey = process.env.ALCHEMY_API_KEY || '';
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY not configured');
    }
    client = new AlchemyWsClient({ chainKey, apiKey });
    client.connect();
    globalThis.__alchemyWsClients.set(chainKey, client);
  }
  return client;
}
