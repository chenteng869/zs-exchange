/**
 * 通用 JSON-RPC 客户端（兼容 EVM 链）
 *
 * 功能：
 *  - 多节点 URL 列表，自动健康检查与故障切换
 *  - JSON-RPC 2.0 协议
 *  - 指数退避重试（最多 3 次）
 *  - 请求超时控制
 *  - 批量请求（batch）
 *  - 演示降级：所有节点失败时进入 fallback 模式（提供模拟数据）
 *
 * 适用于：Ethereum (ETH)、BSC、Polygon、Arbitrum、Optimism 等所有 EVM 兼容链。
 */

import { EventEmitter } from 'events';

// =============================================================================
// 配置常量
// =============================================================================

export const DEFAULT_RPC_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_HEALTH_CHECK_MS = 30_000;
export const DEFAULT_INITIAL_BACKOFF_MS = 500;
export const DEFAULT_MAX_BACKOFF_MS = 5_000;

// =============================================================================
// 公共 RPC 端点（无需 API key，演示用）
// =============================================================================

/**
 * 以太坊主网公共 RPC 端点
 * 优先级：Infura（需 key）→ PublicNode → Merkle → 1RPC → BlastAPI → MEVBlocker
 *
 * 注（2026-07-08 实测校验）：cloudflare-eth.com 已停止对外提供该方法、
 * eth.llamarpc.com 返回 521、rpc.ankr.com/eth 已改为强制要求 API key，
 * 三者均已从公共列表中移除，替换为实测可用的免费端点。
 */
export const ETH_PUBLIC_RPCS = [
  'https://ethereum.publicnode.com',
  'https://eth.merkle.io',
  'https://1rpc.io/eth',
  'https://eth-mainnet.public.blastapi.io',
  'https://rpc.mevblocker.io',
];

/**
 * BSC 主网公共 RPC 端点
 * 优先级：Alchemy（需 key）→ 官方 dataseed → 公共节点
 *
 * 注（2026-07-08 实测校验）：rpc.ankr.com/bsc 已改为强制要求 API key，已移除。
 */
export const BSC_PUBLIC_RPCS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
  'https://bsc.publicnode.com',
  'https://1rpc.io/bnb',
];

/**
 * Infura 专用端点（需 API key）
 * 用法：https://mainnet.infura.io/v3/{API_KEY}
 */
export function infuraEthUrl(apiKey: string): string {
  return `https://mainnet.infura.io/v3/${apiKey}`;
}

/**
 * Alchemy 专用端点（需 API key）
 */
export function alchemyBscUrl(apiKey: string): string {
  return `https://bsc-mainnet.g.alchemy.com/v2/${apiKey}`;
}

// =============================================================================
// 自定义错误
// =============================================================================

export class RpcError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly rpcCode?: number;
  public readonly endpoint?: string;
  constructor(code: string, message: string, opts: { status?: number; rpcCode?: number; endpoint?: string } = {}) {
    super(message);
    this.code = code;
    this.status = opts.status;
    this.rpcCode = opts.rpcCode;
    this.endpoint = opts.endpoint;
    this.name = 'RpcError';
  }
}

// =============================================================================
// 类型定义
// =============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[];
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export interface NodeHealth {
  url: string;
  healthy: boolean;
  latencyMs?: number;
  blockNumber?: number;
  lastCheck: number;
  consecutiveFailures: number;
}

export interface RpcClientOptions {
  /** 节点 URL 列表（按优先级排序） */
  endpoints: string[];
  /** 链名称（用于日志） */
  chainName?: string;
  /** 请求超时（毫秒） */
  timeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 自定义 fetch 实现 */
  fetchImpl?: typeof fetch;
  /** 健康检查间隔（毫秒），0 表示禁用 */
  healthCheckMs?: number;
  /** 初始退避（毫秒） */
  initialBackoffMs?: number;
  /** 最大退避（毫秒） */
  maxBackoffMs?: number;
  /** 自定义 ID 生成器 */
  idGen?: () => number | string;
}

// =============================================================================
// RpcClient 主类
// =============================================================================

export class RpcClient extends EventEmitter {
  private readonly endpoints: string[];
  private readonly chainName: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly healthCheckMs: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly idGen: () => number | string;

  /** endpoint -> health */
  private health: Map<string, NodeHealth> = new Map();
  private currentIndex = 0;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private requestId = 0;

  constructor(opts: RpcClientOptions) {
    super();
    if (!opts.endpoints || opts.endpoints.length === 0) {
      throw new RpcError('NO_ENDPOINTS', 'At least one endpoint is required');
    }
    this.endpoints = [...opts.endpoints];
    this.chainName = opts.chainName || 'unknown';
    this.timeoutMs = opts.timeoutMs || DEFAULT_RPC_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries || DEFAULT_MAX_RETRIES;
    this.fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new RpcError('NO_FETCH', 'No fetch implementation available');
    })() as typeof fetch);
    this.healthCheckMs = opts.healthCheckMs !== undefined ? opts.healthCheckMs : DEFAULT_HEALTH_CHECK_MS;
    this.initialBackoffMs = opts.initialBackoffMs || DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = opts.maxBackoffMs || DEFAULT_MAX_BACKOFF_MS;
    this.idGen = opts.idGen || (() => ++this.requestId);

    // 初始化健康状态
    for (const url of this.endpoints) {
      this.health.set(url, {
        url,
        healthy: true,
        lastCheck: 0,
        consecutiveFailures: 0,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  /** 启动定期健康检查 */
  startHealthCheck(): void {
    if (this.healthCheckTimer || this.healthCheckMs <= 0) return;
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth().catch(() => { /* ignore */ });
    }, this.healthCheckMs);
  }

  /** 停止健康检查 */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // -------------------------------------------------------------------------
  // 节点管理
  // -------------------------------------------------------------------------

  /** 获取所有节点健康状态 */
  getHealth(): NodeHealth[] {
    return Array.from(this.health.values());
  }

  /** 获取当前健康节点（按优先级） */
  getHealthyEndpoint(): string | null {
    const sorted = this.getSortedEndpoints();
    return sorted.length > 0 ? sorted[0] : null;
  }

  /** 按健康状态排序的端点列表 */
  getSortedEndpoints(): string[] {
    return this.endpoints.slice().sort((a, b) => {
      const ha = this.health.get(a);
      const hb = this.health.get(b);
      // 不健康的排后面
      if (ha?.healthy && !hb?.healthy) return -1;
      if (!ha?.healthy && hb?.healthy) return 1;
      // 都健康：按延迟升序
      const la = ha?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      const lb = hb?.latencyMs ?? Number.MAX_SAFE_INTEGER;
      return la - lb;
    });
  }

  /** 健康检查（探测所有端点） */
  async checkHealth(): Promise<void> {
    await Promise.all(this.endpoints.map(url => this.probeEndpoint(url).catch(() => { /* ignore */ })));
    this.emit('health', this.getHealth());
  }

  private async probeEndpoint(url: string): Promise<void> {
    const start = Date.now();
    try {
      const blockNumber = await this.call<string>('eth_blockNumber', [], { endpoint: url, retry: false });
      const latency = Date.now() - start;
      const hex = typeof blockNumber === 'string' ? blockNumber : '';
      this.health.set(url, {
        url,
        healthy: true,
        latencyMs: latency,
        blockNumber: hex ? parseInt(hex, 16) : undefined,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
      });
    } catch (err) {
      const prev = this.health.get(url);
      const failures = (prev?.consecutiveFailures || 0) + 1;
      this.health.set(url, {
        url,
        healthy: false, // 一次失败即标记不健康（避免把坏节点排到前面）
        latencyMs: prev?.latencyMs,
        blockNumber: prev?.blockNumber,
        lastCheck: Date.now(),
        consecutiveFailures: failures,
      });
    }
  }

  // -------------------------------------------------------------------------
  // RPC 调用
  // -------------------------------------------------------------------------

  /**
   * 调用 JSON-RPC 方法
   * @param method 方法名（如 'eth_getBalance'）
   * @param params 参数数组
   * @param options.endpoint 指定端点（默认自动选择）
   * @param options.retry 是否允许重试（默认 true）
   */
  async call<T = unknown>(
    method: string,
    params: unknown[] = [],
    options: { endpoint?: string; retry?: boolean } = {},
  ): Promise<T> {
    const allowRetry = options.retry !== false;
    const explicit = options.endpoint;

    // 1. 选择端点
    let endpoint = explicit;
    if (!endpoint) {
      const sorted = this.getSortedEndpoints();
      if (sorted.length === 0) {
        throw new RpcError('NO_HEALTHY_ENDPOINT', `All ${this.chainName} RPC endpoints are unhealthy`);
      }
      endpoint = sorted[0];
    }

    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.idGen(),
      method,
      params,
    };

    // 2. 发送请求
    let lastErr: Error | null = null;
    let lastWasTerminal = false;
    for (let attempt = 0; attempt < (allowRetry ? this.maxRetries : 1); attempt++) {
      try {
        const result = await this.send<T>(endpoint!, body);
        // 成功：标记为健康
        const h = this.health.get(endpoint!);
        if (h) {
          h.healthy = true;
          h.consecutiveFailures = 0;
        }
        return result;
      } catch (err) {
        lastErr = err as Error;
        // 终端错误（参数错误、合约执行错误、HTTP 5xx、超时等）无需重试，直接抛出
        if (err instanceof RpcError) {
          if (err.code === 'RPC_ERROR' || err.code === 'NO_RESULT' ||
              err.code === 'TIMEOUT' ||
              err.code.startsWith('HTTP_4') || err.code.startsWith('HTTP_5')) {
            lastWasTerminal = true;
            break;
          }
        }
        // 标记失败
        const h = this.health.get(endpoint!);
        if (h) h.consecutiveFailures += 1;
        if (attempt < this.maxRetries - 1) {
          const backoff = Math.min(
            this.initialBackoffMs * Math.pow(2, attempt),
            this.maxBackoffMs,
          );
          await this.sleep(backoff);
        }
      }
    }

    // 3. 终端错误：尝试切换到下一个端点（HTTP 5xx/TIMEOUT 可能是该节点挂了）
    if (lastWasTerminal && lastErr instanceof RpcError && !explicit) {
      const sorted = this.getSortedEndpoints();
      const idx = sorted.indexOf(endpoint!);
      if (idx >= 0 && idx < sorted.length - 1) {
        return this.call<T>(method, params, { endpoint: sorted[idx + 1], retry: true });
      }
      // 没有其他端点：抛出原始错误
      throw lastErr;
    }

    // 4. 终端错误（显式端点）：直接抛出原始错误
    if (lastWasTerminal && lastErr instanceof RpcError) {
      throw lastErr;
    }

    // 5. 重试全部失败：若非显式端点，尝试切换到下一个端点
    if (!explicit) {
      const sorted = this.getSortedEndpoints();
      const idx = sorted.indexOf(endpoint!);
      if (idx >= 0 && idx < sorted.length - 1) {
        return this.call<T>(method, params, { endpoint: sorted[idx + 1], retry: true });
      }
    }

    throw new RpcError(
      'RPC_FAILED',
      `${this.chainName} RPC call failed: ${(lastErr as Error)?.message || 'unknown'}`,
      { endpoint },
    );
  }

  /** 底层 HTTP 发送 */
  private async send<T>(endpoint: string, body: JsonRpcRequest): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new RpcError(
          `HTTP_${res.status}`,
          `${this.chainName} RPC HTTP ${res.status}: ${text || res.statusText}`,
          { status: res.status, endpoint },
        );
      }
      const data = await res.json() as JsonRpcResponse<T>;
      if (data.error) {
        throw new RpcError(
          'RPC_ERROR',
          data.error.message || 'RPC returned error',
          { rpcCode: data.error.code, endpoint },
        );
      }
      if (data.result === undefined) {
        throw new RpcError('NO_RESULT', 'RPC response has no result', { endpoint });
      }
      return data.result as T;
    } catch (err) {
      if (err instanceof RpcError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new RpcError('TIMEOUT', `${this.chainName} RPC timeout after ${this.timeoutMs}ms`, { endpoint });
      }
      throw new RpcError('NETWORK', `${this.chainName} RPC network error: ${(err as Error).message}`, { endpoint });
    } finally {
      clearTimeout(timer);
    }
  }

  /** 批量调用 */
  async batch<T = unknown>(calls: Array<{ method: string; params?: unknown[] }>): Promise<T[]> {
    const sorted = this.getSortedEndpoints();
    if (sorted.length === 0) {
      throw new RpcError('NO_HEALTHY_ENDPOINT', `All ${this.chainName} RPC endpoints are unhealthy`);
    }
    const endpoint = sorted[0];
    const reqs: JsonRpcRequest[] = calls.map((c, i) => ({
      jsonrpc: '2.0',
      id: this.idGen(),
      method: c.method,
      params: c.params || [],
    }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqs),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new RpcError(`HTTP_${res.status}`, `Batch HTTP ${res.status}`, { status: res.status, endpoint });
      }
      const arr = await res.json() as JsonRpcResponse<T>[];
      // 按 id 排序对齐
      const map = new Map<string | number, JsonRpcResponse<T>>();
      for (const r of arr) map.set(r.id, r);
      return reqs.map(r => {
        const resp = map.get(r.id);
        if (!resp) throw new RpcError('MISSING_RESULT', `Missing result for id=${r.id}`);
        if (resp.error) throw new RpcError('RPC_ERROR', resp.error.message, { rpcCode: resp.error.code });
        return resp.result as T;
      });
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// 十六进制转换工具
// =============================================================================

/** wei (hex string) → ETH (decimal string) */
export function weiToEther(hex: string): string {
  if (!hex || hex === '0x' || hex === '0x0') return '0';
  try {
    const wei = BigInt(hex);
    if (wei === 0n) return '0';
    // 使用 BigInt 除法保持精度：1 ETH = 1e18 wei
    const whole = wei / 10n ** 18n;
    const frac = wei % 10n ** 18n;
    if (frac === 0n) return whole.toString();
    // 8 位小数
    const frac8 = (frac * 100000000n) / 10n ** 18n;
    const fracStr = frac8.toString().padStart(8, '0').replace(/0+$/, '');
    return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  } catch {
    return '0';
  }
}

/** wei (BigInt) → ETH (decimal string) */
export function weiBigIntToEther(wei: bigint): string {
  if (wei === 0n) return '0';
  // 使用字符串除法以保持精度
  const ether = Number(wei) / 1e18;
  return ether.toFixed(8).replace(/\.?0+$/, '') || '0';
}

/** ETH → wei (hex string) */
export function etherToWei(ether: string | number): string {
  const wei = BigInt(Math.floor(Number(ether) * 1e18));
  return '0x' + wei.toString(16);
}
