/**
 * MoonPay 第三方买币客户端
 *
 * 职责：
 *  - 封装 MoonPay REST API：
 *      GET  /v3/currencies                          列出币种
 *      GET  /v3/currencies/{code}                  单个币种
 *      GET  /v3/currencies/{code}/limits           限额
 *      GET  /v3/currencies/{code}/price            报价
 *      POST /v1/transactions                        创建买币订单
 *      GET  /v1/transactions/{id}                   查询订单
 *  - 自动重试 5xx / 429 / TIMEOUT（指数退避）
 *  - 演示降级：API Key 缺失或服务端不可达时返回稳定 mock 数据
 *  - 不引入外部依赖（fetch + node:crypto 即可）
 *
 * 用法：
 *   const client = new MoonPayClient({ apiKeyPublic, apiKeySecret });
 *   const ccy = await client.getCurrency('usdt_polygon');
 *   const tx = await client.createTransaction({ ... });
 */

import { logger } from '../logger';

// =============================================================================
// 常量
// =============================================================================

export const MOONPAY_API_KEY_PUBLIC =
  (typeof process !== 'undefined' && process.env?.MOONPAY_API_KEY_PUBLIC) || 'pk_test_mock';

export const MOONPAY_API_KEY_SECRET =
  (typeof process !== 'undefined' && process.env?.MOONPAY_API_KEY_SECRET) || 'sk_test_mock';

export const MOONPAY_WEBHOOK_SECRET =
  (typeof process !== 'undefined' && process.env?.MOONPAY_WEBHOOK_SECRET) || 'webhook-secret';

export const MOONPAY_DEFAULT_BASE_CURRENCY = 'usd';

export const MOONPAY_ORDER_EXPIRE_MS = 30 * 60_000; // 30 分钟

export const MOONPAY_WIDGET_BASE = 'https://buy.moonpay.com';

const MOONPAY_API_BASE = 'https://api.moonpay.com';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_BASE_MS = 400;
const DEFAULT_MAX_BACKOFF_MS = 5_000;

// =============================================================================
// 类型定义
// =============================================================================

export interface MoonPayCurrency {
  /** MoonPay 内部 id，例如 'usdt_polygon' */
  id: string;
  /** 币种代码（小写），例如 'usdt' */
  code: string;
  /** 完整名称，例如 'Tether USD' */
  name: string;
  type: 'crypto' | 'fiat';
  metadata?: {
    contractAddress?: string;
    chainId?: string;
    network?: string;
  };
  minAmount?: number;
  maxAmount?: number;
  /** 精度（小数位） */
  precision?: number;
  /** 是否支持 buy */
  isBuySupported?: boolean;
  /** 是否支持 sell */
  isSellSupported?: boolean;
  /** 可见性（部分币种可能被限制） */
  visible?: boolean;
}

export interface CreateTransactionOptions {
  /** 加密币 code（小写），例如 'usdt' */
  cryptoCurrency: string;
  /** 法币 code（小写），例如 'usd' */
  baseCurrency: string;
  /** 用户平台入金地址（收款地址） */
  walletAddress: string;
  /** 法币金额（与 cryptoAmount 互斥，优先 fiatAmount） */
  baseAmount?: number;
  /** 加密币金额 */
  cryptoAmount?: number;
  /** 平台订单号（幂等） */
  externalTransactionId: string;
  /** 用户付款后跳转的 URL */
  redirectURL?: string;
  /** 客户信息（MoonPay 用于预填 KYC 表单） */
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  /** 网络（如 ethereum / polygon） */
  network?: string;
  /** 锁定的汇率（来自 quote 接口） */
  fixedRate?: boolean;
  /** 备注 */
  description?: string;
}

export interface CreateTransactionResult {
  /** MoonPay 内部交易 id */
  id: string;
  /** 跳转到 MoonPay widget 的 URL */
  redirectUrl: string;
  /** 初始状态（一般 waitingPayment） */
  status: string;
}

export interface MoonPayTransaction {
  id: string;
  externalTransactionId?: string;
  /** MoonPay 内部状态 */
  status:
    | 'waitingPayment'
    | 'pending'
    | 'failed'
    | 'completed'
    | 'waitingAuthorization';
  cryptoCurrency: string;
  baseCurrency: string;
  baseAmount: number;
  cryptoAmount: number;
  fee: number;
  networkFee: number;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
  redirectUrl?: string;
  failureReason?: string;
  /** 网络名（ethereum/polygon/bsc） */
  network?: string;
}

export interface GetPriceOptions {
  cryptoCurrency: string;
  baseCurrency: string;
  /** 法币金额（与 cryptoAmount 互斥） */
  amount?: number;
  /** 加密币金额 */
  cryptoAmount?: number;
}

export interface GetPriceResult {
  baseCurrency: string;
  baseAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  rate: number;
  fee: number;
  networkFee: number;
  totalFee: number;
  /** 货币精度（moonpay 返回） */
  baseCurrencyPrecision?: number;
  cryptoCurrencyPrecision?: number;
}

export interface GetExchangeLimitsResult {
  baseCurrency: string;
  cryptoCurrency: string;
  minBaseAmount: number;
  maxBaseAmount: number;
  minCryptoAmount: number;
  maxCryptoAmount: number;
  /** 法币下的手续费（minBuy/maxBuy 之间估算） */
  fee: number;
  /** 数据源 */
  source: 'api' | 'mock';
}

export interface MoonPayClientOptions {
  /** 公开 API Key（pk_live_xxx / pk_test_xxx） */
  apiKeyPublic?: string;
  /** 私密 API Key（sk_live_xxx / sk_test_xxx），用于创建订单 */
  apiKeySecret?: string;
  /** 自定义 API 基础地址（用于 mock / 私有部署） */
  apiBase?: string;
  /** 自定义 fetch（用于测试） */
  fetchImpl?: typeof fetch;
  /** 请求超时 ms，默认 10_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数 ms，默认 400 */
  backoffBaseMs?: number;
  /** 退避上限 ms，默认 5_000 */
  maxBackoffMs?: number;
  /** 演示降级：直接走 mock，不发起真实网络 */
  mockMode?: boolean;
  /** 自定义 logger */
  logger?: typeof logger;
  /** 时钟注入 */
  now?: () => number;
  /** 创建 transaction 时签名的 fetch 头（如需自定义） */
  extraHeaders?: Record<string, string>;
}

// =============================================================================
// 错误
// =============================================================================

export class MoonPayApiError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly body?: unknown;
  constructor(code: string, message: string, opts: { status?: number; body?: unknown } = {}) {
    super(message);
    this.name = 'MoonPayApiError';
    this.code = code;
    this.status = opts.status;
    this.body = opts.body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 工具
// =============================================================================

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 判断是否为 mock key（无真实网络） */
function isMockKey(key: string | undefined): boolean {
  if (!key) return true;
  if (key.includes('mock')) return true;
  if (key === 'pk_test_mock' || key === 'sk_test_mock') return true;
  return false;
}

/** 稳定 hash（用于 mock 数据生成） */
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

// =============================================================================
// 演示数据（MOCK）
// =============================================================================

const MOCK_CURRENCIES: MoonPayCurrency[] = [
  {
    id: 'usdt',
    code: 'usdt',
    name: 'Tether USD',
    type: 'crypto',
    metadata: { network: 'ethereum', chainId: '1' },
    minAmount: 0.001,
    maxAmount: 100000,
    precision: 6,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
  {
    id: 'usdt_polygon',
    code: 'usdt_polygon',
    name: 'Tether USD (Polygon)',
    type: 'crypto',
    metadata: {
      contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      network: 'polygon',
      chainId: '137',
    },
    minAmount: 0.001,
    maxAmount: 100000,
    precision: 6,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
  {
    id: 'usdc',
    code: 'usdc',
    name: 'USD Coin',
    type: 'crypto',
    metadata: { network: 'ethereum', chainId: '1' },
    minAmount: 0.001,
    maxAmount: 100000,
    precision: 6,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
  {
    id: 'usdc_solana',
    code: 'usdc_solana',
    name: 'USD Coin (Solana)',
    type: 'crypto',
    metadata: { network: 'solana' },
    minAmount: 0.001,
    maxAmount: 100000,
    precision: 6,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
  {
    id: 'btc',
    code: 'btc',
    name: 'Bitcoin',
    type: 'crypto',
    minAmount: 0.0001,
    maxAmount: 10,
    precision: 8,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
  {
    id: 'eth',
    code: 'eth',
    name: 'Ethereum',
    type: 'crypto',
    minAmount: 0.001,
    maxAmount: 100,
    precision: 8,
    isBuySupported: true,
    isSellSupported: true,
    visible: true,
  },
];

// =============================================================================
// MoonPayClient
// =============================================================================

export class MoonPayClient {
  public readonly apiKeyPublic: string;
  public readonly apiKeySecret: string;
  public readonly mockMode: boolean;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly maxBackoffMs: number;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly extraHeaders: Record<string, string>;

  constructor(opts: MoonPayClientOptions = {}) {
    this.apiKeyPublic = opts.apiKeyPublic ?? MOONPAY_API_KEY_PUBLIC;
    this.apiKeySecret = opts.apiKeySecret ?? MOONPAY_API_KEY_SECRET;
    // 强制 mock 模式：当两个 key 都为 mock 时自动启用，避免误调用真实 API
    const explicitMock = !!opts.mockMode;
    const implicitMock =
      isMockKey(this.apiKeyPublic) && isMockKey(this.apiKeySecret);
    this.mockMode = explicitMock || implicitMock;
    this.apiBase = (opts.apiBase ?? MOONPAY_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('MoonPayClient: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.backoffBaseMs = opts.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this.maxBackoffMs = opts.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
    this.extraHeaders = opts.extraHeaders ?? {};
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP 封装
  // -------------------------------------------------------------------------

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.apiBase);
    // 公共读接口都要求 apiKey 查询参数
    url.searchParams.set('apiKey', this.apiKeyPublic);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private async fetchWithTimeout(
    input: string,
    init: RequestInit = {},
    timeoutMs = this.timeoutMs,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await this.fetchImpl(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private shouldRetryStatus(status: number): boolean {
    if (status === 408 || status === 429) return true;
    return status >= 500 && status < 600;
  }

  /** GET 请求（带重试） */
  private async getJson<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (this.mockMode) {
      throw new MoonPayApiError('MOCK_MODE', 'client running in mock mode', { status: 0 });
    }
    const url = this.buildUrl(path, query);
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...this.extraHeaders,
          },
        });
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[MoonPay] GET ${path} -> ${resp.status}, retry in ${backoff}ms (attempt ${attempt + 1}/${this.maxRetries})`,
          );
          await sleep(backoff);
          continue;
        }
        if (!resp.ok) {
          const text = await safeText(resp);
          // 4xx 客户端错误：直接抛，不重试
          if (resp.status >= 400 && resp.status < 500) {
            const code = resp.status === 401 || resp.status === 403 ? 'UNAUTHORIZED' : 'BAD_REQUEST';
            throw new MoonPayApiError(
              code,
              `MoonPay GET ${path} -> ${resp.status}: ${text.slice(0, 200)}`,
              { status: resp.status, body: text },
            );
          }
          // 5xx：用尽重试后抛错
          throw new MoonPayApiError(
            'HTTP_ERROR',
            `MoonPay GET ${path} -> ${resp.status}: ${text.slice(0, 200)}`,
            { status: resp.status, body: text },
          );
        }
        return (await resp.json()) as T;
      } catch (err) {
        lastErr = err;
        // 4xx（UNAUTHORIZED / BAD_REQUEST）不重试
        if (err instanceof MoonPayApiError && (err.code === 'UNAUTHORIZED' || err.code === 'BAD_REQUEST')) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[MoonPay] GET ${path} failed: ${(err as Error).message}, retry in ${backoff}ms`,
          );
          await sleep(backoff);
          continue;
        }
      }
    }
    throw new MoonPayApiError(
      'NETWORK_ERROR',
      `MoonPay GET ${path} failed after ${this.maxRetries + 1} attempts: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  /** POST 请求（私密 key + 签名，失败时不重试 4xx） */
  private async postJson<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    if (this.mockMode) {
      throw new MoonPayApiError('MOCK_MODE', 'client running in mock mode', { status: 0 });
    }
    const url = this.buildUrl(path);
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Api-Key ${this.apiKeySecret}`,
            ...this.extraHeaders,
          },
          body: JSON.stringify(body),
        });
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[MoonPay] POST ${path} -> ${resp.status}, retry in ${backoff}ms`,
          );
          await sleep(backoff);
          continue;
        }
        if (!resp.ok) {
          const text = await safeText(resp);
          const code = resp.status === 401 || resp.status === 403
            ? 'UNAUTHORIZED'
            : resp.status === 400
              ? 'BAD_REQUEST'
              : 'HTTP_ERROR';
          throw new MoonPayApiError(code, `MoonPay POST ${path} -> ${resp.status}: ${text.slice(0, 200)}`, {
            status: resp.status,
            body: text,
          });
        }
        return (await resp.json()) as T;
      } catch (err) {
        lastErr = err;
        if (err instanceof MoonPayApiError && (err.code === 'UNAUTHORIZED' || err.code === 'BAD_REQUEST')) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          this.logger.warn(
            `[MoonPay] POST ${path} failed: ${(err as Error).message}, retry in ${backoff}ms`,
          );
          await sleep(backoff);
          continue;
        }
      }
    }
    throw new MoonPayApiError(
      'NETWORK_ERROR',
      `MoonPay POST ${path} failed after ${this.maxRetries + 1} attempts`,
    );
  }

  // -------------------------------------------------------------------------
  // 公共 API — 币种
  // -------------------------------------------------------------------------

  /**
   * 列出所有支持的币种（crypto + fiat）
   * 注意：v3/currencies 返回时数量较多（200+），建议在服务端缓存
   */
  async getCurrencies(): Promise<MoonPayCurrency[]> {
    if (this.mockMode) return MOCK_CURRENCIES;
    const raw = await this.getJson<any[]>('/v3/currencies');
    return raw.map((c) => this.parseCurrency(c));
  }

  /** 单个币种详情 */
  async getCurrency(code: string): Promise<MoonPayCurrency | null> {
    if (this.mockMode) {
      return MOCK_CURRENCIES.find((c) => c.code === code || c.id === code) ?? null;
    }
    try {
      const raw = await this.getJson<any>(`/v3/currencies/${encodeURIComponent(code)}`);
      return this.parseCurrency(raw);
    } catch (err) {
      if (err instanceof MoonPayApiError && err.status === 404) return null;
      throw err;
    }
  }

  private parseCurrency(c: any): MoonPayCurrency {
    return {
      id: String(c.id ?? c.code ?? ''),
      code: String(c.code ?? c.id ?? '').toLowerCase(),
      name: String(c.name ?? ''),
      type: c.type === 'fiat' ? 'fiat' : 'crypto',
      metadata:
        c.metadata && typeof c.metadata === 'object'
          ? {
              contractAddress: c.metadata.contractAddress,
              chainId: c.metadata.chainId,
              network: c.metadata.network ?? c.network,
            }
          : c.network
            ? { network: c.network }
            : undefined,
      minAmount: numOrUndef(c.minAmount),
      maxAmount: numOrUndef(c.maxAmount),
      precision: numOrUndef(c.precision),
      isBuySupported: c.isBuySupported !== false,
      isSellSupported: c.isSellSupported === true,
      visible: c.visible !== false,
    };
  }

  // -------------------------------------------------------------------------
  // 公共 API — 限额
  // -------------------------------------------------------------------------

  /**
   * 查询买币限额
   * @param code 加密币 code（如 'usdt'）
   * @param baseCurrencyCode 法币 code（默认 'usd'）
   */
  async getExchangeLimits(
    code: string,
    baseCurrencyCode: string = MOONPAY_DEFAULT_BASE_CURRENCY,
  ): Promise<GetExchangeLimitsResult> {
    if (this.mockMode) {
      const c = MOCK_CURRENCIES.find((x) => x.code === code || x.id === code);
      const min = c?.minAmount ?? 0.001;
      const max = c?.maxAmount ?? 100000;
      // 简单估算：1 USDT ≈ 1 USD
      const rate = code.startsWith('btc') ? 65000 : code.startsWith('eth') ? 3500 : 1;
      return {
        baseCurrency: baseCurrencyCode,
        cryptoCurrency: code,
        minBaseAmount: min * rate,
        maxBaseAmount: max * rate,
        minCryptoAmount: min,
        maxCryptoAmount: max,
        fee: 4.99,
        source: 'mock',
      };
    }
    const raw = await this.getJson<any>(
      `/v3/currencies/${encodeURIComponent(code)}/limits`,
      { baseCurrency: baseCurrencyCode },
    );
    return {
      baseCurrency: baseCurrencyCode,
      cryptoCurrency: code,
      minBaseAmount: numOrZero(raw.baseCurrency?.minAmount),
      maxBaseAmount: numOrZero(raw.baseCurrency?.maxAmount),
      minCryptoAmount: numOrZero(raw.cryptoCurrency?.minAmount ?? raw.baseCurrency?.minAmount),
      maxCryptoAmount: numOrZero(raw.cryptoCurrency?.maxAmount ?? raw.baseCurrency?.maxAmount),
      fee: numOrZero(raw.feeAmount ?? raw.fee),
      source: 'api',
    };
  }

  // -------------------------------------------------------------------------
  // 公共 API — 报价
  // -------------------------------------------------------------------------

  /**
   * 获取即时报价
   * MoonPay 接口：GET /v3/currencies/{code}/price?baseCurrency=usd&baseAmount=100
   */
  async getPrice(opts: GetPriceOptions): Promise<GetPriceResult> {
    const base = (opts.baseCurrency || MOONPAY_DEFAULT_BASE_CURRENCY).toLowerCase();
    const crypto = (opts.cryptoCurrency || '').toLowerCase();
    if (!crypto) {
      throw new MoonPayApiError('BAD_REQUEST', 'cryptoCurrency is required');
    }
    if (this.mockMode) {
      const rate = mockRate(crypto);
      const amount = opts.amount ?? opts.cryptoAmount ?? 0;
      const baseAmount = opts.cryptoAmount ? opts.cryptoAmount * rate : amount;
      const cryptoAmount = opts.amount ? amount / rate : (opts.cryptoAmount ?? 0);
      return {
        baseCurrency: base,
        baseAmount: round(baseAmount, 2),
        cryptoCurrency: crypto,
        cryptoAmount: round(cryptoAmount, 8),
        rate,
        fee: 4.99,
        networkFee: 0.5,
        totalFee: 5.49,
        baseCurrencyPrecision: 2,
        cryptoCurrencyPrecision: 8,
      };
    }
    const query: Record<string, string | number> = { baseCurrency: base };
    if (typeof opts.amount === 'number') {
      query.baseAmount = opts.amount;
    } else if (typeof opts.cryptoAmount === 'number') {
      query.cryptoAmount = opts.cryptoAmount;
    } else {
      // moonpay 至少需要一个金额
      query.baseAmount = 100;
    }
    const raw = await this.getJson<any>(
      `/v3/currencies/${encodeURIComponent(crypto)}/price`,
      query,
    );
    return {
      baseCurrency: base,
      baseAmount: numOrZero(raw.baseAmount ?? raw.price),
      cryptoCurrency: crypto,
      cryptoAmount: numOrZero(raw.cryptoAmount),
      rate: numOrZero(raw.price ?? raw.rate),
      fee: numOrZero(raw.feeAmount ?? raw.totalFees?.feeAmount),
      networkFee: numOrZero(raw.networkFeeAmount ?? raw.totalFees?.networkFeeAmount),
      totalFee: numOrZero(raw.totalFees?.totalFeeAmount ?? (raw.feeAmount ?? 0) + (raw.networkFeeAmount ?? 0)),
      baseCurrencyPrecision: numOrUndef(raw.baseCurrency?.precision),
      cryptoCurrencyPrecision: numOrUndef(raw.cryptoCurrency?.precision),
    };
  }

  // -------------------------------------------------------------------------
  // 公共 API — 创建订单
  // -------------------------------------------------------------------------

  /**
   * 创建 MoonPay 买币订单
   *  - 接口：POST /v1/transactions
   *  - 需要私密 API Key
   *  - 返回 redirectUrl，前端跳转即可
   */
  async createTransaction(opts: CreateTransactionOptions): Promise<CreateTransactionResult> {
    if (!opts.walletAddress) {
      throw new MoonPayApiError('BAD_REQUEST', 'walletAddress is required');
    }
    if (!opts.externalTransactionId) {
      throw new MoonPayApiError('BAD_REQUEST', 'externalTransactionId is required for idempotency');
    }
    if (!opts.cryptoCurrency || !opts.baseCurrency) {
      throw new MoonPayApiError('BAD_REQUEST', 'cryptoCurrency and baseCurrency are required');
    }

    // mock 模式：直接构造 redirectUrl，不发请求
    if (this.mockMode) {
      const id = `mp-mock-${djb2(opts.externalTransactionId).toString(16)}`;
      return {
        id,
        status: 'waitingPayment',
        redirectUrl: this.buildWidgetUrl({
          cryptoCurrency: opts.cryptoCurrency,
          baseCurrency: opts.baseCurrency,
          walletAddress: opts.walletAddress,
          baseAmount: opts.baseAmount,
          cryptoAmount: opts.cryptoAmount,
          externalTransactionId: opts.externalTransactionId,
          redirectURL: opts.redirectURL,
          network: opts.network,
        }),
      };
    }

    const body: Record<string, unknown> = {
      cryptoCurrency: opts.cryptoCurrency.toLowerCase(),
      baseCurrency: opts.baseCurrency.toLowerCase(),
      walletAddress: opts.walletAddress,
      externalTransactionId: opts.externalTransactionId,
    };
    if (typeof opts.baseAmount === 'number') body.baseCurrencyAmount = opts.baseAmount;
    if (typeof opts.cryptoAmount === 'number') body.cryptoCurrencyAmount = opts.cryptoAmount;
    if (opts.redirectURL) body.redirectURL = opts.redirectURL;
    if (opts.network) body.network = opts.network;
    if (opts.fixedRate) body.fixedRate = true;
    if (opts.description) body.description = opts.description;
    if (opts.customer) {
      body.customer = {
        id: opts.customer.id,
        firstName: opts.customer.firstName,
        lastName: opts.customer.lastName,
        email: opts.customer.email,
      };
    }
    const raw = await this.postJson<any>('/v1/transactions', body);
    return {
      id: String(raw.id ?? ''),
      status: String(raw.status ?? 'waitingPayment'),
      redirectUrl: this.buildWidgetUrl({
        cryptoCurrency: opts.cryptoCurrency,
        baseCurrency: opts.baseCurrency,
        walletAddress: opts.walletAddress,
        baseAmount: opts.baseAmount,
        cryptoAmount: opts.cryptoAmount,
        externalTransactionId: opts.externalTransactionId,
        redirectURL: opts.redirectURL,
        network: opts.network,
      }),
    };
  }

  /**
   * 构造 MoonPay widget URL（前端跳转）
   * 注意：widget URL 必须使用公开 apiKey，不能使用 secret
   */
  buildWidgetUrl(opts: {
    cryptoCurrency: string;
    baseCurrency: string;
    walletAddress: string;
    baseAmount?: number;
    cryptoAmount?: number;
    externalTransactionId: string;
    redirectURL?: string;
    network?: string;
  }): string {
    const url = new URL(MOONPAY_WIDGET_BASE + '/');
    url.searchParams.set('apiKey', this.apiKeyPublic);
    url.searchParams.set('currencyCode', opts.cryptoCurrency.toLowerCase());
    url.searchParams.set('baseCurrencyCode', opts.baseCurrency.toLowerCase());
    url.searchParams.set('walletAddress', opts.walletAddress);
    url.searchParams.set('externalTransactionId', opts.externalTransactionId);
    if (typeof opts.baseAmount === 'number') {
      url.searchParams.set('baseCurrencyAmount', String(opts.baseAmount));
    } else if (typeof opts.cryptoAmount === 'number') {
      url.searchParams.set('currencyAmount', String(opts.cryptoAmount));
    }
    if (opts.redirectURL) url.searchParams.set('redirectURL', opts.redirectURL);
    if (opts.network) url.searchParams.set('network', opts.network);
    return url.toString();
  }

  // -------------------------------------------------------------------------
  // 公共 API — 查询订单
  // -------------------------------------------------------------------------

  /**
   * 按 MoonPay 内部 id 查询交易
   * 需要私密 API Key
   */
  async getTransaction(id: string): Promise<MoonPayTransaction | null> {
    if (this.mockMode) {
      // mock：返回一个稳定的 completed 状态
      return {
        id,
        status: 'completed',
        cryptoCurrency: 'usdt',
        baseCurrency: 'usd',
        baseAmount: 100,
        cryptoAmount: 100,
        fee: 4.99,
        networkFee: 0.5,
        walletAddress: '0x' + '0'.repeat(40),
        createdAt: new Date(this.now() - 3600_000).toISOString(),
        updatedAt: new Date(this.now()).toISOString(),
        network: 'ethereum',
      };
    }
    const url = `${this.apiBase}/v1/transactions/${encodeURIComponent(id)}?apiKey=${encodeURIComponent(
      this.apiKeyPublic,
    )}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const resp = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: { Accept: 'application/json', ...this.extraHeaders },
        });
        if (resp.status === 404) return null;
        if (this.shouldRetryStatus(resp.status) && attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          await sleep(backoff);
          continue;
        }
        if (!resp.ok) {
          const text = await safeText(resp);
          throw new MoonPayApiError(
            resp.status === 401 || resp.status === 403 ? 'UNAUTHORIZED' : 'HTTP_ERROR',
            `MoonPay GET /v1/transactions/${id} -> ${resp.status}: ${text.slice(0, 200)}`,
            { status: resp.status, body: text },
          );
        }
        const raw = (await resp.json()) as any;
        return this.parseTransaction(raw);
      } catch (err) {
        lastErr = err;
        if (err instanceof MoonPayApiError && (err.code === 'UNAUTHORIZED' || err.code === 'HTTP_ERROR')) {
          throw err;
        }
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxBackoffMs, this.backoffBaseMs * 2 ** attempt);
          await sleep(backoff);
          continue;
        }
      }
    }
    throw new MoonPayApiError(
      'NETWORK_ERROR',
      `MoonPay getTransaction(${id}) failed: ${(lastErr as Error)?.message ?? 'unknown'}`,
    );
  }

  private parseTransaction(raw: any): MoonPayTransaction {
    return {
      id: String(raw.id ?? ''),
      externalTransactionId: raw.externalTransactionId,
      status: normalizeMoonPayStatus(raw.status),
      cryptoCurrency: String(raw.cryptoCurrency?.code ?? raw.cryptoCurrency ?? '').toLowerCase(),
      baseCurrency: String(raw.baseCurrency?.code ?? raw.baseCurrency ?? '').toLowerCase(),
      baseAmount: numOrZero(raw.baseCurrencyAmount ?? raw.baseAmount),
      cryptoAmount: numOrZero(raw.cryptoCurrencyAmount ?? raw.cryptoAmount),
      fee: numOrZero(raw.feeAmount ?? raw.fee),
      networkFee: numOrZero(raw.networkFeeAmount ?? raw.networkFee),
      walletAddress: String(raw.walletAddress ?? ''),
      createdAt: raw.createdAt ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? new Date().toISOString(),
      redirectUrl: raw.redirectUrl,
      failureReason: raw.failureReason,
      network: raw.network,
    };
  }

  // -------------------------------------------------------------------------
  // 兜底：mock 时手动构造 transaction（测试用）
  // -------------------------------------------------------------------------

  /**
   * 在 mock 模式下生成一个 transaction（仅供 TransactionManager 等业务层使用）
   * 生产模式请使用 createTransaction
   */
  buildMockTransaction(opts: {
    externalTransactionId: string;
    cryptoCurrency: string;
    baseCurrency: string;
    baseAmount?: number;
    cryptoAmount?: number;
    walletAddress: string;
    status?: MoonPayTransaction['status'];
  }): MoonPayTransaction {
    const id = `mp-mock-${djb2(opts.externalTransactionId).toString(16)}`;
    const rate = mockRate(opts.cryptoCurrency);
    const baseAmount = opts.baseAmount ?? 100;
    const cryptoAmount = opts.cryptoAmount ?? baseAmount / rate;
    return {
      id,
      externalTransactionId: opts.externalTransactionId,
      status: opts.status ?? 'waitingPayment',
      cryptoCurrency: opts.cryptoCurrency.toLowerCase(),
      baseCurrency: opts.baseCurrency.toLowerCase(),
      baseAmount,
      cryptoAmount,
      fee: 4.99,
      networkFee: 0.5,
      walletAddress: opts.walletAddress,
      createdAt: new Date(this.now()).toISOString(),
      updatedAt: new Date(this.now()).toISOString(),
      network: 'ethereum',
    };
  }
}

// =============================================================================
// 工具：状态归一化
// =============================================================================

function normalizeMoonPayStatus(s: any): MoonPayTransaction['status'] {
  const v = String(s ?? '').toLowerCase();
  if (v === 'completed') return 'completed';
  if (v === 'failed') return 'failed';
  if (v === 'waitingauthorization' || v === 'waitingauthorization.') return 'waitingAuthorization';
  if (v === 'waitingpayment') return 'waitingPayment';
  return 'pending';
}

function numOrZero(v: any): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrUndef(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function mockRate(crypto: string): number {
  if (crypto.startsWith('btc')) return 65000;
  if (crypto.startsWith('eth')) return 3500;
  if (crypto.startsWith('usdt') || crypto.startsWith('usdc')) return 1;
  if (crypto.startsWith('sol') || crypto.startsWith('solana')) return 150;
  return 1;
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return '';
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createMoonPayClient(opts?: MoonPayClientOptions): MoonPayClient {
  return new MoonPayClient(opts);
}

export default MoonPayClient;
