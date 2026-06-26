/**
 * TRON 链专用 RPC 客户端
 *
 * 与 rpc-client.ts 的区别：
 *  - rpc-client.ts 是为 EVM JSON-RPC 设计的（基于 eth_blockNumber 探测）
 *  - 本客户端为 Trongrid HTTP API 设计（基于 /wallet/getnowblock 探测）
 *  - 支持 API Key 自动注入（TRON-PRO-API-KEY header）
 *  - 429 限流自动切换端点
 *
 * 注：保持 RpcError 兼容（使用同源错误类），便于上层适配器统一捕获。
 */

import { RpcError, type NodeHealth } from './rpc-client';

// =============================================================================
// 常量
// =============================================================================

/** TRX 精度（1 TRX = 1_000_000 SUN） */
export const TRX_DECIMALS = 6;
export const SUN_PER_TRX = 1_000_000n;

/** 主网默认端点 */
export const TRON_DEFAULT_ENDPOINTS = [
  'https://api.trongrid.io',
];

/** Shasta 测试网端点 */
export const TRON_SHASTA_ENDPOINTS = [
  'https://api.shasta.trongrid.io',
];

/** Nile 测试网端点 */
export const TRON_NILE_ENDPOINTS = [
  'https://nile.trongrid.io',
];

/** TRON 错误（与 RpcError 兼容：code/name） */
export class TronRpcError extends RpcError {
  constructor(code: string, message: string, opts: { status?: number; rpcCode?: number; endpoint?: string } = {}) {
    super(code, message, opts);
    this.name = 'TronRpcError';
  }
}

// =============================================================================
// 类型
// =============================================================================

export type TronNetwork = 'mainnet' | 'shasta' | 'nile';

export interface TronRpcClientOptions {
  endpoints: string[];
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  healthCheckMs?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export interface TronRequestOptions {
  method?: string;
  body?: any;
  endpoint?: string;
  retry?: boolean;
}

// =============================================================================
// 工具
// =============================================================================

/** SUN -> TRX 字符串（最多 8 位小数） */
export function sunToTrx(sun: number | string | bigint): string {
  try {
    const big = BigInt(sun as any);
    if (big === 0n) return '0';
    const whole = big / SUN_PER_TRX;
    const frac = big % SUN_PER_TRX;
    if (frac === 0n) return whole.toString();
    const frac6 = (frac * 1_000_000n) / SUN_PER_TRX;
    const fracStr = frac6.toString().padStart(6, '0').replace(/0+$/, '');
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return '0';
  }
}

/** 按 decimals 格式化原始代币余额 */
export function trc20Format(raw: bigint | string | number, decimals: number): string {
  try {
    const big = BigInt(raw as any);
    if (big === 0n) return '0';
    const div = 10n ** BigInt(decimals);
    const whole = big / div;
    const frac = big % div;
    if (frac === 0n) return whole.toString();
    const displayDecimals = Math.min(decimals, 8);
    const displayDiv = 10n ** BigInt(decimals - displayDecimals);
    const fracAdj = frac / displayDiv;
    const fracStr = fracAdj.toString().padStart(displayDecimals, '0').replace(/0+$/, '');
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return '0';
  }
}

// =============================================================================
// TronRpcClient
// =============================================================================

export class TronRpcClient {
  private readonly endpoints: string[];
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly healthCheckMs: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly health: Map<string, NodeHealth> = new Map();
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(opts: TronRpcClientOptions) {
    if (!opts.endpoints || opts.endpoints.length === 0) {
      throw new TronRpcError('NO_ENDPOINTS', 'At least one TRON endpoint is required');
    }
    this.endpoints = [...opts.endpoints];
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new TronRpcError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.healthCheckMs = opts.healthCheckMs ?? 30_000;
    this.initialBackoffMs = opts.initialBackoffMs ?? 500;
    this.maxBackoffMs = opts.maxBackoffMs ?? 5_000;

    for (const url of this.endpoints) {
      this.health.set(url, { url, healthy: true, lastCheck: 0, consecutiveFailures: 0 });
    }
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  startHealthCheck(): void {
    if (this.healthCheckTimer || this.healthCheckMs <= 0) return;
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth().catch(() => { /* ignore */ });
    }, this.healthCheckMs);
  }

  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // 健康
  // -------------------------------------------------------------------------

  getHealth(): NodeHealth[] {
    return Array.from(this.health.values());
  }

  getSortedEndpoints(): string[] {
    return this.endpoints.slice().sort((a, b) => {
      const ha = this.health.get(a);
      const hb = this.health.get(b);
      if (ha?.healthy && !hb?.healthy) return -1;
      if (!ha?.healthy && hb?.healthy) return 1;
      const la = ha?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      const lb = hb?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      return la - lb;
    });
  }

  async checkHealth(): Promise<void> {
    await Promise.all(
      this.endpoints.map(url => this.probeEndpoint(url).catch(() => { /* ignore */ })),
    );
  }

  private async probeEndpoint(url: string): Promise<void> {
    const start = Date.now();
    try {
      const res = await this.fetchWithKey(`${url}/wallet/getnowblock`, { method: 'POST', body: JSON.stringify({}) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const block = await res.json().catch(() => null) as { block_header?: { raw_data?: { number?: number } } } | null;
      const blockNumber = block?.block_header?.raw_data?.number;
      this.health.set(url, {
        url,
        healthy: true,
        latencyMs: Date.now() - start,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        blockNumber,
      });
    } catch {
      const prev = this.health.get(url);
      this.health.set(url, {
        url,
        healthy: false,
        latencyMs: prev?.latencyMs,
        lastCheck: Date.now(),
        consecutiveFailures: (prev?.consecutiveFailures || 0) + 1,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 请求
  // -------------------------------------------------------------------------

  async request<T = unknown>(path: string, options: TronRequestOptions = {}): Promise<T> {
    const allowRetry = options.retry !== false;
    const explicit = options.endpoint;

    let endpoint = explicit || this.getSortedEndpoints()[0];
    if (!endpoint) {
      throw new TronRpcError('NO_HEALTHY_ENDPOINT', 'All TRON endpoints are unhealthy');
    }

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < (allowRetry ? this.maxRetries : 1); attempt++) {
      try {
        const url = endpoint!.endsWith('/') || path.startsWith('http')
          ? path
          : `${endpoint}${path.startsWith('/') ? '' : '/'}${path}`;
        const res = await this.fetchWithKey(url, {
          method: options.method || 'GET',
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        });
        if (res.status === 429 || res.status >= 500) {
          // 5xx/429：标记端点失败，尝试下一个
          this.markUnhealthy(endpoint!);
          lastErr = new TronRpcError(`HTTP_${res.status}`, `TRON HTTP ${res.status}`, { status: res.status, endpoint });
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.initialBackoffMs * Math.pow(2, attempt));
          }
          continue;
        }
        if (!res.ok) {
          throw new TronRpcError(`HTTP_${res.status}`, `TRON HTTP ${res.status}`, { status: res.status, endpoint });
        }
        this.markHealthy(endpoint!);
        return (await res.json()) as T;
      } catch (err) {
        lastErr = err as Error;
        if ((err as Error).name === 'AbortError') {
          lastErr = new TronRpcError('TIMEOUT', `TRON timeout after ${this.timeoutMs}ms`, { endpoint });
        }
        this.markUnhealthy(endpoint!);
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.initialBackoffMs * Math.pow(2, attempt));
        }
      }
    }

    // 尝试切换到下一个端点
    if (!explicit) {
      const sorted = this.getSortedEndpoints();
      const idx = sorted.indexOf(endpoint!);
      if (idx >= 0 && idx < sorted.length - 1) {
        return this.request<T>(path, { ...options, endpoint: sorted[idx + 1], retry: true });
      }
    }
    throw lastErr || new TronRpcError('RPC_FAILED', 'TRON RPC failed');
  }

  private async fetchWithKey(url: string, init: RequestInit): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.apiKey) headers['TRON-PRO-API-KEY'] = this.apiKey;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private markHealthy(url: string): void {
    const h = this.health.get(url);
    if (h) {
      h.healthy = true;
      h.consecutiveFailures = 0;
    }
  }

  private markUnhealthy(url: string): void {
    const h = this.health.get(url);
    if (h) h.consecutiveFailures += 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
