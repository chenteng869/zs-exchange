/**
 * Nansen 链上情报 API 客户端
 *
 * 端点：https://api.nansen.ai/v1
 * 鉴权：X-API-KEY: {apiKey}
 *
 * 公共方法：
 *  - getAddress(address, chain)              /addresses
 *  - getAddressLabels(addresses, chain)      /addresses/labels  (批量)
 *  - getSmartMoneySignals(opts)              /smart-money/signals
 *  - getTokenGodMode(tokenAddress, chain)    /tokens/god-mode
 *  - getSmartMoneyHoldings(tokenAddress, chain, limit?)
 *                                            /smart-money/holdings
 *  - getLargeTransfers(opts)                 /transfers/large
 *  - getFlowIntelligence(tokenAddress, chain, period)
 *                                            /tokens/flow
 *
 * 特性：
 *  - 5xx / 429 自动指数退避重试
 *  - 客户端 60 req/min 限流
 *  - 演示降级：apiKey 含 'mock' 或缺失时启用稳定 mock
 *  - 不引外部依赖
 */

import {
  Chain,
  FlowIntelligence,
  LargeTransferQueryOptions,
  NansenAddress,
  NansenAddressLabels,
  NansenClientOptions,
  SignalQueryOptions,
  SmartMoneyHolding,
  SmartMoneySignal,
  TokenGodMode,
  TransferEvent,
  WalletLabel,
  NANSEN_API_BASE,
  NANSEN_DEFAULT_INITIAL_BACKOFF_MS,
  NANSEN_DEFAULT_MAX_BACKOFF_MS,
  NANSEN_DEFAULT_MAX_RETRIES,
  NANSEN_DEFAULT_TIMEOUT_MS,
  NANSEN_RATE_LIMIT_PER_MIN,
  NANSEN_WHALE_THRESHOLD_USD,
  NANSEN_SUPPORTED_CHAINS,
  genId,
  genTxHash,
  isMockMode,
} from './types';

// =============================================================================
// 错误
// =============================================================================

export class NansenError extends Error {
  public readonly code: string;
  public readonly status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'NansenError';
  }
}

// =============================================================================
// 限流器（60s 滑动窗口）
// =============================================================================

class MinuteRateLimiter {
  private window: number[] = [];
  constructor(private readonly max: number) {}

  /** 阻塞直到获取令牌 */
  async acquire(): Promise<void> {
    if (this.max <= 0) return;
    while (true) {
      const now = Date.now();
      this.window = this.window.filter((t) => now - t < 60_000);
      if (this.window.length < this.max) {
        this.window.push(now);
        return;
      }
      const wait = 60_000 - (now - this.window[0]) + 5;
      await new Promise<void>((resolve) => setTimeout(resolve, Math.min(wait, 200)));
    }
  }

  reset(): void {
    this.window = [];
  }

  size(): number {
    const now = Date.now();
    this.window = this.window.filter((t) => now - t < 60_000);
    return this.window.length;
  }
}

// =============================================================================
// 原始 API 响应类型（仅作为类型提示）
// =============================================================================

interface RawAddress {
  address: string;
  chain: Chain;
  labels: WalletLabel[];
  entity?: string;
  total_balance_usd?: string;
  first_seen?: number;
  last_active?: number;
  tx_count?: number;
  risk_score?: number;
  is_contract?: boolean;
}

interface RawSignal {
  id: string;
  chain: Chain;
  wallet_address: string;
  signal_type: string;
  token: { symbol: string; address: string; decimals: number };
  amount: string;
  amount_usd: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  triggered_rules?: string[];
  confidence?: number;
}

interface RawHolding {
  wallet_address: string;
  chain: Chain;
  token_symbol: string;
  token_address: string;
  balance: string;
  balance_usd: string;
  cost_basis: string;
  unrealized_pnl: string;
  unrealized_pnl_pct: string;
  acquired_at: number;
  holding_days: number;
  source?: 'onchain' | 'inferred';
}

interface RawTransfer {
  id: string;
  chain: Chain;
  from_address: string;
  to_address: string;
  from_labels: WalletLabel[];
  to_labels: WalletLabel[];
  token_symbol: string;
  token_address: string;
  amount: string;
  amount_usd: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
}

// =============================================================================
// NansenClient
// =============================================================================

export class NansenClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly enableFallback: boolean;
  private readonly rateLimiter: MinuteRateLimiter;
  private readonly mock: boolean;

  /** mock 模式下的内存存储（保证多次调用返回一致） */
  private readonly mockStore: {
    addresses: Map<string, NansenAddress>;
    holdings: SmartMoneyHolding[];
  } = {
    addresses: new Map(),
    holdings: [],
  };

  constructor(opts: NansenClientOptions = {}) {
    this.apiKey = opts.apiKey ?? '';
    this.baseUrl = opts.baseUrl || NANSEN_API_BASE;
    this.fetchImpl =
      opts.fetchImpl ||
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => Promise.reject(new NansenError('NO_FETCH', 'No fetch implementation available'))) as unknown as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? NANSEN_DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? NANSEN_DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = opts.initialBackoffMs ?? NANSEN_DEFAULT_INITIAL_BACKOFF_MS;
    this.maxBackoffMs = opts.maxBackoffMs ?? NANSEN_DEFAULT_MAX_BACKOFF_MS;
    this.enableFallback = opts.enableFallback !== false;
    this.rateLimiter = new MinuteRateLimiter(opts.rateLimitPerMin ?? NANSEN_RATE_LIMIT_PER_MIN);
    this.mock = isMockMode(this.apiKey);
  }

  isMock(): boolean {
    return this.mock;
  }

  resetRateLimit(): void {
    this.rateLimiter.reset();
  }

  currentRequestCount(): number {
    return this.rateLimiter.size();
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /** 单个地址画像 */
  async getAddress(address: string, chain: Chain): Promise<NansenAddress | null> {
    if (!NANSEN_SUPPORTED_CHAINS.includes(chain)) {
      throw new NansenError('UNSUPPORTED_CHAIN', `Unsupported chain: ${chain}`);
    }
    if (this.mock) return this.demoAddress(address, chain);
    try {
      const qs = new URLSearchParams({ address, chain });
      const data = await this.request<RawAddress | null>('GET', `/addresses?${qs.toString()}`);
      if (!data) return null;
      return this.mapAddress(data);
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoAddress(address, chain);
    }
  }

  /** 批量地址标签查询 */
  async getAddressLabels(addresses: string[], chain: Chain): Promise<Record<string, WalletLabel[]>> {
    if (this.mock) {
      const out: Record<string, WalletLabel[]> = {};
      for (const a of addresses) {
        out[a.toLowerCase()] = this.demoLabelsForAddress(a);
      }
      return out;
    }
    if (addresses.length === 0) return {};
    try {
      const data = await this.request<NansenAddressLabels[]>(
        'POST',
        '/addresses/labels',
        { addresses, chain },
      );
      const out: Record<string, WalletLabel[]> = {};
      for (const item of data || []) {
        out[item.address.toLowerCase()] = item.labels;
      }
      return out;
    } catch (err) {
      if (!this.enableFallback) throw err;
      const out: Record<string, WalletLabel[]> = {};
      for (const a of addresses) {
        out[a.toLowerCase()] = this.demoLabelsForAddress(a);
      }
      return out;
    }
  }

  /** Smart Money 信号 */
  async getSmartMoneySignals(opts: SignalQueryOptions = {}): Promise<SmartMoneySignal[]> {
    if (this.mock) return this.demoSignals(opts);
    try {
      const data = await this.request<RawSignal[]>(
        'GET',
        '/smart-money/signals',
        undefined,
        this.buildQuery({
          chain: opts.chain,
          token: opts.token,
          since: opts.since,
          until: opts.until,
          limit: opts.limit,
        }),
      );
      return (data || []).map((s) => this.mapSignal(s));
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoSignals(opts);
    }
  }

  /** Token God Mode（聪明钱持仓聚合） */
  async getTokenGodMode(tokenAddress: string, chain: Chain): Promise<TokenGodMode | null> {
    if (this.mock) return this.demoTokenGodMode(tokenAddress, chain);
    try {
      const qs = new URLSearchParams({ token: tokenAddress, chain });
      const data = await this.request<any | null>('GET', `/tokens/god-mode?${qs.toString()}`);
      if (!data) return null;
      return this.mapTokenGodMode(data);
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoTokenGodMode(tokenAddress, chain);
    }
  }

  /** Token 聪明钱持仓明细 */
  async getSmartMoneyHoldings(
    tokenAddress: string,
    chain: Chain,
    limit: number = 50,
  ): Promise<SmartMoneyHolding[]> {
    if (this.mock) return this.demoHoldings(tokenAddress, chain, limit);
    try {
      const qs = new URLSearchParams({ token: tokenAddress, chain, limit: String(limit) });
      const data = await this.request<RawHolding[]>('GET', `/smart-money/holdings?${qs.toString()}`);
      return (data || []).map((h) => this.mapHolding(h));
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoHoldings(tokenAddress, chain, limit);
    }
  }

  /** 大额转账 */
  async getLargeTransfers(opts: LargeTransferQueryOptions = {}): Promise<TransferEvent[]> {
    if (this.mock) return this.demoTransfers(opts);
    try {
      const data = await this.request<RawTransfer[]>(
        'GET',
        '/transfers/large',
        undefined,
        this.buildQuery({
          chain: opts.chain,
          min_usd: opts.minUsd,
          since: opts.since,
          limit: opts.limit,
        }),
      );
      return (data || []).map((t) => this.mapTransfer(t));
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoTransfers(opts);
    }
  }

  /** 资金流情报 */
  async getFlowIntelligence(
    tokenAddress: string,
    chain: Chain,
    period: '24h' | '7d' | '30d',
  ): Promise<FlowIntelligence> {
    if (this.mock) return this.demoFlow(tokenAddress, chain, period);
    try {
      const qs = new URLSearchParams({ token: tokenAddress, chain, period });
      const data = await this.request<any>('GET', `/tokens/flow?${qs.toString()}`);
      return this.mapFlow(tokenAddress, chain, period, data);
    } catch (err) {
      if (!this.enableFallback) throw err;
      return this.demoFlow(tokenAddress, chain, period);
    }
  }

  // -------------------------------------------------------------------------
  // HTTP
  // -------------------------------------------------------------------------

  private buildQuery(params: Record<string, string | number | undefined>): URLSearchParams {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    return qs;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    query?: URLSearchParams,
  ): Promise<T> {
    await this.rateLimiter.acquire();
    const url = `${this.baseUrl}${path}${query && query.toString() ? '?' + query.toString() : ''}`;

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < Math.max(1, this.maxRetries); attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const init: RequestInit = {
          method,
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        };
        if (body !== undefined) init.body = JSON.stringify(body);
        const resp = await this.fetchImpl(url, init);
        clearTimeout(timer);

        if (resp.status === 429) {
          lastErr = new NansenError('RATE_LIMITED', `Nansen 429 (${path})`, 429);
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.initialBackoffMs * Math.pow(2, attempt) * 2);
            continue;
          }
          throw lastErr;
        }
        if (resp.status >= 500) {
          lastErr = new NansenError(`HTTP_${resp.status}`, `Nansen ${resp.status} (${path})`, resp.status);
          if (attempt < this.maxRetries - 1) {
            const backoff = Math.min(
              this.initialBackoffMs * Math.pow(2, attempt),
              this.maxBackoffMs,
            );
            await this.sleep(backoff);
            continue;
          }
          throw lastErr;
        }
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new NansenError(
            `HTTP_${resp.status}`,
            `Nansen ${resp.status}: ${text || resp.statusText} (${path})`,
            resp.status,
          );
        }
        const ct = resp.headers?.get?.('content-type') || '';
        if (ct.includes('application/json')) {
          return (await resp.json()) as T;
        }
        const text = await resp.text();
        return JSON.parse(text) as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof NansenError) {
          if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
            throw err; // 4xx 立即抛出
          }
          lastErr = err;
        } else if ((err as Error).name === 'AbortError') {
          lastErr = new NansenError('TIMEOUT', `Nansen timeout after ${this.timeoutMs}ms (${path})`);
        } else {
          lastErr = new NansenError('NETWORK', `Nansen network error: ${(err as Error).message}`);
        }
        if (attempt < this.maxRetries - 1) {
          const backoff = Math.min(
            this.initialBackoffMs * Math.pow(2, attempt),
            this.maxBackoffMs,
          );
          await this.sleep(backoff);
          continue;
        }
        throw lastErr;
      }
    }
    throw lastErr || new NansenError('UNKNOWN', 'Nansen unknown error');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // Raw -> 领域类型映射
  // -------------------------------------------------------------------------

  private mapAddress(raw: RawAddress): NansenAddress {
    return {
      address: raw.address,
      chain: raw.chain,
      labels: raw.labels || [],
      entity: raw.entity,
      totalBalanceUsd: raw.total_balance_usd || '0',
      firstSeen: raw.first_seen || 0,
      lastActive: raw.last_active || 0,
      txCount: raw.tx_count || 0,
      riskScore: typeof raw.risk_score === 'number' ? raw.risk_score : 0,
      isContract: !!raw.is_contract,
    };
  }

  private mapSignal(raw: RawSignal): SmartMoneySignal {
    return {
      id: raw.id,
      chain: raw.chain,
      walletAddress: raw.wallet_address,
      signalType: (raw.signal_type as SmartMoneySignal['signalType']) || 'transfer',
      token: {
        symbol: raw.token?.symbol || 'UNKNOWN',
        address: raw.token?.address || '',
        decimals: raw.token?.decimals ?? 18,
      },
      amount: raw.amount || '0',
      amountUsd: raw.amount_usd || '0',
      txHash: raw.tx_hash || '',
      blockNumber: raw.block_number || 0,
      timestamp: raw.timestamp || Date.now(),
      triggeredRules: raw.triggered_rules || [],
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
    };
  }

  private mapHolding(raw: RawHolding): SmartMoneyHolding {
    return {
      walletAddress: raw.wallet_address,
      chain: raw.chain,
      tokenSymbol: raw.token_symbol,
      tokenAddress: raw.token_address,
      balance: raw.balance,
      balanceUsd: raw.balance_usd,
      costBasis: raw.cost_basis,
      unrealizedPnl: raw.unrealized_pnl,
      unrealizedPnlPct: raw.unrealized_pnl_pct,
      acquiredAt: raw.acquired_at,
      holdingDays: raw.holding_days,
      source: raw.source === 'inferred' ? 'inferred' : 'onchain',
    };
  }

  private mapTransfer(raw: RawTransfer): TransferEvent {
    return {
      id: raw.id,
      chain: raw.chain,
      fromAddress: raw.from_address,
      toAddress: raw.to_address,
      fromLabels: raw.from_labels || [],
      toLabels: raw.to_labels || [],
      tokenSymbol: raw.token_symbol,
      tokenAddress: raw.token_address,
      amount: raw.amount,
      amountUsd: raw.amount_usd,
      txHash: raw.tx_hash,
      blockNumber: raw.block_number,
      timestamp: raw.timestamp,
    };
  }

  private mapTokenGodMode(raw: any): TokenGodMode {
    return {
      tokenSymbol: raw.token_symbol,
      tokenAddress: raw.token_address,
      chain: raw.chain,
      totalSmartMoneyHolders: raw.total_smart_money_holders || 0,
      totalSmartMoneyValue: raw.total_smart_money_value || '0',
      topHolders: (raw.top_holders || []).map((h: any) => this.mapHolding(h)),
      smartMoneyNetFlow24h: raw.smart_money_net_flow_24h || '0',
      smartMoneyNetFlow7d: raw.smart_money_net_flow_7d || '0',
      smartMoneyNetFlow30d: raw.smart_money_net_flow_30d || '0',
      concentration: typeof raw.concentration === 'number' ? raw.concentration : 0,
      bySource: raw.by_source || {},
      updatedAt: raw.updated_at || Date.now(),
    };
  }

  private mapFlow(tokenAddress: string, chain: Chain, period: '24h' | '7d' | '30d', raw: any): FlowIntelligence {
    return {
      tokenSymbol: raw?.token_symbol || 'UNKNOWN',
      tokenAddress,
      chain,
      period,
      netFlow: raw?.net_flow || '0',
      bySource: raw?.by_source || {},
      updatedAt: raw?.updated_at || Date.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 演示降级（mock 数据）
  // -------------------------------------------------------------------------

  private demoLabelsForAddress(address: string): WalletLabel[] {
    const lower = address.toLowerCase();
    // 基于地址末位 hash 简单分布
    const lastHex = parseInt(lower.slice(-1), 16);
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

  private demoEntityForAddress(address: string): string | undefined {
    const labels = this.demoLabelsForAddress(address);
    if (labels.includes('cex')) {
      const cexes = ['Binance', 'Coinbase', 'OKX', 'Bybit', 'Kraken'];
      const idx = parseInt(address.slice(2, 4), 16) % cexes.length;
      return cexes[idx];
    }
    if (labels.includes('vc') || labels.includes('fund')) {
      const funds = ['a16z', 'Paradigm', 'Multicoin', 'Polychain'];
      const idx = parseInt(address.slice(2, 4), 16) % funds.length;
      return funds[idx];
    }
    return undefined;
  }

  private demoAddress(address: string, chain: Chain): NansenAddress {
    const key = `${chain}:${address.toLowerCase()}`;
    const cached = this.mockStore.addresses.get(key);
    if (cached) return cached;
    const labels = this.demoLabelsForAddress(address);
    const entity = this.demoEntityForAddress(address);
    const lastHex = parseInt(address.slice(-1), 16) || 0;
    const now = Date.now();
    const addr: NansenAddress = {
      address,
      chain,
      labels,
      entity,
      totalBalanceUsd: String(50_000 + (lastHex * 13_700)),
      firstSeen: now - (30 + lastHex) * 86_400_000,
      lastActive: now - lastHex * 3_600_000,
      txCount: 50 + lastHex * 27,
      riskScore: Math.min(100, lastHex * 7),
      isContract: labels.includes('contract') || lastHex === 9,
    };
    this.mockStore.addresses.set(key, addr);
    return addr;
  }

  private demoSignals(opts: SignalQueryOptions): SmartMoneySignal[] {
    const chains: Chain[] = opts.chain ? [opts.chain] : ['ethereum', 'bsc', 'arbitrum', 'base'];
    const tokens = [
      { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
      { symbol: 'PEPE', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18 },
    ];
    const wallets = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ];
    const types: SmartMoneySignal['signalType'][] = ['buy', 'sell', 'accumulate', 'distribute'];
    const limit = opts.limit ?? 10;
    const out: SmartMoneySignal[] = [];
    for (let i = 0; i < limit; i++) {
      const chain = chains[i % chains.length];
      const token = opts.token
        ? tokens.find((t) => t.address.toLowerCase() === opts.token!.toLowerCase()) || tokens[i % tokens.length]
        : tokens[i % tokens.length];
      const wallet = wallets[i % wallets.length];
      const signalType = types[i % types.length];
      const amountUsd = (10_000 + i * 7_500).toString();
      const amount = String(Math.floor(Number(amountUsd) * 1e6));
      out.push({
        id: genId('sig'),
        chain,
        walletAddress: wallet,
        signalType,
        token: { symbol: token.symbol, address: token.address, decimals: token.decimals },
        amount,
        amountUsd,
        txHash: genTxHash('sig:' + i),
        blockNumber: 18_000_000 + i,
        timestamp: Date.now() - i * 180_000,
        triggeredRules: ['SMART_MONEY_FLOW'],
        confidence: Math.min(1, 0.6 + (i % 4) * 0.1),
      });
    }
    if (opts.since) {
      return out.filter((s) => s.timestamp >= (opts.since as number));
    }
    return out;
  }

  private demoTokenGodMode(tokenAddress: string, chain: Chain): TokenGodMode {
    const key = `${chain}:${tokenAddress.toLowerCase()}`;
    if (this.mockStore.holdings.length === 0) {
      // 预填一些持仓
      this.mockStore.holdings = this.demoHoldings(tokenAddress, chain, 8);
    }
    const holders = this.demoHoldings(tokenAddress, chain, 5);
    const totalValue = holders.reduce((acc, h) => acc + Number(h.balanceUsd), 0).toString();
    return {
      tokenSymbol: 'WETH',
      tokenAddress,
      chain,
      totalSmartMoneyHolders: holders.length,
      totalSmartMoneyValue: totalValue,
      topHolders: holders,
      smartMoneyNetFlow24h: '850000',
      smartMoneyNetFlow7d: '4_200_000',
      smartMoneyNetFlow30d: '12_800_000',
      concentration: 1850, // HHI 0-10000
      bySource: {
        smart_money: { count: 3, value: '1850000' },
        vc: { count: 2, value: '920000' },
      },
      updatedAt: Date.now(),
    };
  }

  private demoHoldings(tokenAddress: string, chain: Chain, limit: number): SmartMoneyHolding[] {
    const out: SmartMoneyHolding[] = [];
    for (let i = 0; i < limit; i++) {
      const balanceUsd = String(120_000 + i * 50_000);
      const costBasis = String(Math.floor(Number(balanceUsd) * 0.85));
      const pnl = String(Number(balanceUsd) - Number(costBasis));
      const pnlPct = (((Number(pnl) / Number(costBasis)) * 100).toFixed(2));
      out.push({
        walletAddress: `0x${(i + 1).toString(16).padStart(40, '0')}`,
        chain,
        tokenSymbol: 'WETH',
        tokenAddress,
        balance: String(Math.floor(Number(balanceUsd) * 1e6)),
        balanceUsd,
        costBasis,
        unrealizedPnl: pnl,
        unrealizedPnlPct: pnlPct,
        acquiredAt: Date.now() - (10 + i * 3) * 86_400_000,
        holdingDays: 10 + i * 3,
        source: i % 2 === 0 ? 'onchain' : 'inferred',
      });
    }
    return out;
  }

  private demoTransfers(opts: LargeTransferQueryOptions): TransferEvent[] {
    const chains: Chain[] = opts.chain ? [opts.chain] : ['ethereum', 'arbitrum', 'base'];
    const min = opts.minUsd ?? NANSEN_WHALE_THRESHOLD_USD;
    const limit = opts.limit ?? 8;
    const out: TransferEvent[] = [];
    for (let i = 0; i < limit; i++) {
      const chain = chains[i % chains.length];
      const amountUsd = (min + i * 250_000).toString();
      out.push({
        id: genId('xfer'),
        chain,
        fromAddress: `0x${(i + 1).toString(16).padStart(40, '0')}`,
        toAddress: `0x${(i + 11).toString(16).padStart(40, '0')}`,
        fromLabels: this.demoLabelsForAddress(`0x${(i + 1).toString(16).padStart(40, '0')}`),
        toLabels: this.demoLabelsForAddress(`0x${(i + 11).toString(16).padStart(40, '0')}`),
        tokenSymbol: i % 2 === 0 ? 'USDC' : 'WETH',
        tokenAddress: i % 2 === 0
          ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
          : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        amount: String(Math.floor(Number(amountUsd) * 1e6)),
        amountUsd,
        txHash: genTxHash('xfer:' + i),
        blockNumber: 18_000_000 + i,
        timestamp: Date.now() - i * 240_000,
      });
    }
    if (opts.since) {
      return out.filter((t) => t.timestamp >= (opts.since as number));
    }
    return out;
  }

  private demoFlow(tokenAddress: string, chain: Chain, period: '24h' | '7d' | '30d'): FlowIntelligence {
    const base = period === '24h' ? 850_000 : period === '7d' ? 4_200_000 : 12_800_000;
    return {
      tokenSymbol: 'WETH',
      tokenAddress,
      chain,
      period,
      netFlow: base.toString(),
      bySource: {
        smart_money: {
          inflow: (base * 0.65).toString(),
          outflow: (base * 0.15).toString(),
          net: (base * 0.5).toString(),
        },
        whale: {
          inflow: (base * 0.3).toString(),
          outflow: (base * 0.1).toString(),
          net: (base * 0.2).toString(),
        },
      },
      updatedAt: Date.now(),
    };
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createNansenClient(opts?: NansenClientOptions): NansenClient {
  return new NansenClient(opts);
}
