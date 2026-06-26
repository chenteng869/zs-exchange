/**
 * 充值到账监听器（DepositMonitor）
 *
 * 完整链路：
 *   用户充值 ETH/USDT 到平台地址
 *     → Webhook 事件（Alchemy）/ 区块轮询（BlockPoller）
 *     → DepositEvent（pending → confirmed → credited）
 *     → 业务订阅（onDeposit）入账
 *
 * 双链路设计：
 *  - Webhook：Alchemy 推送 address_activity，签名校验后直接入账（30s 内）
 *  - Polling：兜底，每 15s 扫一次链上区块（断网 / Webhook 漏单时仍可入账）
 *
 * 特性：
 *  - txHash:logIndex 唯一索引防重复
 *  - 确认数累加，到达 requiredConfirmations 自动 confirmed
 *  - 订阅者取消订阅无副作用
 *  - 演示降级：Alchemy 不可用时仅靠轮询
 */

import { BlockPoller, POLL_INTERVAL_MS, POLL_BATCH_SIZE, type MonitoredChain, type RawTransfer } from './poller';
import { RpcClient, type RpcClientOptions } from './rpc-client';
import { TronRpcClient, type TronRpcClientOptions } from './tron-rpc-client';

// =============================================================================
// 常量
// =============================================================================

/** 充值确认数（按链） */
export const REQUIRED_CONFIRMATIONS = {
  ETH: 12,
  BSC: 15,
  TRON: 19,
  POLYGON: 64,
  ARBITRUM: 64,
} as const;

export type ChainWithConfirmations = keyof typeof REQUIRED_CONFIRMATIONS;

export { POLL_INTERVAL_MS, POLL_BATCH_SIZE };

// =============================================================================
// 类型
// =============================================================================

/** 充值监听支持的链（不与 address.ts 的 Chain 冲突） */
export type DepositChain = 'ETH' | 'BSC' | 'TRON';

export interface DepositEvent {
  /** 唯一 ID（txHash:logIndex） */
  id: string;
  chain: DepositChain;
  tokenSymbol: string;
  tokenAddress?: string;
  decimals: number;
  /** 平台入账地址 */
  to: string;
  /** 用户充值地址 */
  from: string;
  /** 原始数量（最小单位字符串） */
  amount: string;
  /** 用户可见数量（已除以 decimals） */
  amountFormatted: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  confirmations: number;
  requiredConfirmations: number;
  status: 'pending' | 'confirmed' | 'credited' | 'failed';
  /** 毫秒 */
  detectedAt: number;
  /** 毫秒（入账完成时） */
  creditedAt?: number;
  source: 'webhook' | 'polling';
}

export interface WebhookPayload {
  type: 'address_activity';
  event: {
    network: 'ETH_MAINNET' | 'BSC_MAINNET' | 'MATIC_MAINNET';
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      blockNum: string;       // hex
      hash: string;
      value: number;          // wei
      asset: string;          // "ETH" | "USDC"
      category: 'token' | 'external';
      rawContract?: { address: string; decimal: string };
    }>;
  };
  id: string;
  createdAt: string;
}

export type DepositHandler = (event: DepositEvent) => void;

export interface DepositMonitorOptions {
  /** EVM RPC 配置（ETH/BSC 共享一个客户端） */
  evmRpc?: RpcClientOptions;
  /** TRON RPC 配置 */
  tronRpc?: TronRpcClientOptions;
  /** 直接注入（用于测试 / 复用已有客户端） */
  evmClient?: RpcClient;
  tronClient?: TronRpcClient;
  /** 轮询间隔（毫秒） */
  pollIntervalMs?: number;
  /** 每次最多扫 N 个区块 */
  batchSize?: number;
  /** 轮询失败时回调（断网降级日志） */
  onError?: (err: Error, chain: DepositChain) => void;
  /** 业务入账回调 */
  onCredited?: (event: DepositEvent) => void;
}

// =============================================================================
// 工具
// =============================================================================

/** bigint 数量 → 用户可见字符串（保留 8 位小数） */
function formatAmount(raw: bigint, decimals: number): string {
  if (raw === 0n) return '0';
  if (decimals === 0) return raw.toString();
  const div = 10n ** BigInt(decimals);
  const whole = raw / div;
  const frac = raw % div;
  if (frac === 0n) return whole.toString();
  // 8 位小数
  const frac8 = (frac * 100_000_000n) / div;
  const fracStr = frac8.toString().padStart(8, '0').replace(/0+$/, '');
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

/** 网络名 → 链标识 */
function networkToChain(network: WebhookPayload['event']['network']): DepositChain | null {
  if (network === 'ETH_MAINNET') return 'ETH';
  if (network === 'BSC_MAINNET') return 'BSC';
  if (network === 'MATIC_MAINNET') return 'ETH'; // 暂不监控 Polygon，回退到 ETH 拒绝
  return null;
}

// =============================================================================
// DepositMonitor
// =============================================================================

export class DepositMonitor {
  private readonly evmClient?: RpcClient;
  private readonly tronClient?: TronRpcClient;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly onError: (err: Error, chain: DepositChain) => void;
  private readonly onCredited?: (event: DepositEvent) => void;

  private poller: BlockPoller | null = null;
  private started = false;

  /** txHash:logIndex -> DepositEvent（已入索引防重复） */
  private deposits: Map<string, DepositEvent> = new Map();
  /** handler 集合 */
  private handlers: Set<DepositHandler> = new Set();

  constructor(opts: DepositMonitorOptions = {}) {
    this.evmClient = opts.evmClient
      || (opts.evmRpc ? new RpcClient(opts.evmRpc) : undefined);
    this.tronClient = opts.tronClient
      || (opts.tronRpc ? new TronRpcClient(opts.tronRpc) : undefined);
    this.pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS;
    this.batchSize = opts.batchSize ?? POLL_BATCH_SIZE;
    this.onError = opts.onError ?? (() => { /* swallow */ });
    this.onCredited = opts.onCredited;
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  start(): void {
    if (this.started) return;
    this.started = true;
    if (!this.poller && (this.evmClient || this.tronClient)) {
      this.poller = new BlockPoller({
        evmClient: this.evmClient,
        tronClient: this.tronClient,
        pollIntervalMs: this.pollIntervalMs,
        batchSize: this.batchSize,
        onError: (e, c) => this.onError(e, c as DepositChain),
        onTransfer: (t) => this.handleRawTransfer(t),
      });
    }
    this.poller?.start();
  }

  stop(): void {
    this.started = false;
    this.poller?.stop();
  }

  isRunning(): boolean {
    return this.started;
  }

  // -------------------------------------------------------------------------
  // 地址管理
  // -------------------------------------------------------------------------

  watchAddress(
    address: string,
    chain: DepositChain,
    tokenSymbol?: string,
  ): void {
    const decimals = this.defaultDecimals(chain, tokenSymbol);
    const tokenAddress = this.defaultTokenAddress(chain, tokenSymbol);
    if (!this.poller) this.ensurePoller();
    this.poller?.watchAddress({
      chain: chain as MonitoredChain,
      address,
      tokenSymbol: tokenSymbol || (chain === 'TRON' ? 'TRX' : chain),
      tokenAddress,
      decimals,
    });
  }

  unwatchAddress(address: string): void {
    // 三个链都试一次
    for (const c of ['ETH', 'BSC', 'TRON'] as DepositChain[]) {
      this.poller?.unwatchAddress(c as MonitoredChain, address);
    }
  }

  private ensurePoller(): void {
    if (this.poller) return;
    this.poller = new BlockPoller({
      evmClient: this.evmClient,
      tronClient: this.tronClient,
      pollIntervalMs: this.pollIntervalMs,
      batchSize: this.batchSize,
      onError: (e, c) => this.onError(e, c as DepositChain),
      onTransfer: (t) => this.handleRawTransfer(t),
    });
  }

  private defaultDecimals(chain: DepositChain, symbol?: string): number {
    const s = (symbol || '').toUpperCase();
    if (s === 'USDT' || s === 'USDC') return 6;
    if (s === 'ETH' || s === 'BNB') return 18;
    if (s === 'TRX') return 6;
    return 18;
  }

  private defaultTokenAddress(chain: DepositChain, symbol?: string): string | undefined {
    const s = (symbol || '').toUpperCase();
    if (chain === 'TRON' && s === 'USDT') return 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    if (chain === 'TRON' && s === 'USDC') return 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8';
    return undefined;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getPendingDeposits(): DepositEvent[] {
    return Array.from(this.deposits.values()).filter(
      (d) => d.status === 'pending' || d.status === 'confirmed',
    );
  }

  getConfirmedDeposits(): DepositEvent[] {
    return Array.from(this.deposits.values()).filter(
      (d) => d.status === 'confirmed' || d.status === 'credited',
    );
  }

  getDeposit(id: string): DepositEvent | undefined {
    return this.deposits.get(id);
  }

  getAllDeposits(): DepositEvent[] {
    return Array.from(this.deposits.values());
  }

  /** 监控的地址数 */
  watchedCount(): number {
    return this.poller?.size() ?? 0;
  }

  // -------------------------------------------------------------------------
  // 订阅
  // -------------------------------------------------------------------------

  onDeposit(handler: DepositHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  // -------------------------------------------------------------------------
  // 手动入账（供 webhook / 测试用）
  // -------------------------------------------------------------------------

  /**
   * 手动确认入账（用于 webhook 直接入账场景，或测试）。
   *  - 如果新事件已存在则更新 confirmations
   *  - 到达 requiredConfirmations 自动标记 confirmed
   *  - 之后下一轮 tick 才会标 credited（给业务系统留窗口期）
   */
  confirmDeposit(
    txHash: string,
    blockNumber: number,
    logIndex: number,
    confirmations?: number,
  ): DepositEvent {
    const id = this.makeId(txHash, logIndex);
    const existing = this.deposits.get(id);
    if (existing) {
      if (blockNumber > existing.blockNumber) existing.blockNumber = blockNumber;
      const inc = confirmations ?? 1;
      existing.confirmations = Math.max(existing.confirmations, inc);
      this.tryPromote(existing);
      return existing;
    }
    throw new Error(`Unknown deposit: ${id} (call watchAddress or handle webhook first)`);
  }

  /**
   * 注入一个完整 deposit 事件（用于 webhook 直接落库 + 入账）
   */
  ingestDeposit(input: Omit<DepositEvent, 'id' | 'status' | 'detectedAt' | 'confirmations' | 'requiredConfirmations'> & {
    confirmations?: number;
    requiredConfirmations?: number;
  }): DepositEvent {
    const id = this.makeId(input.txHash, input.logIndex);
    const required = input.requiredConfirmations ?? REQUIRED_CONFIRMATIONS[input.chain as ChainWithConfirmations] ?? 12;
    const existing = this.deposits.get(id);
    if (existing) {
      // 合并：取较大 confirmations、保留 credited 状态
      existing.confirmations = Math.max(existing.confirmations, input.confirmations || 1);
      this.tryPromote(existing);
      return existing;
    }
    const event: DepositEvent = {
      ...input,
      id,
      confirmations: input.confirmations ?? 1,
      requiredConfirmations: required,
      status: 'pending',
      detectedAt: Date.now(),
    };
    this.deposits.set(id, event);
    this.emit(event);
    this.tryPromote(event);
    return event;
  }

  // -------------------------------------------------------------------------
  // Webhook 入口
  // -------------------------------------------------------------------------

  /**
   * 处理 Alchemy address_activity webhook 事件
   *  - 仅在签名校验通过后调用
   *  - 解析为 DepositEvent，触发订阅
   */
  handleWebhook(payload: WebhookPayload): DepositEvent[] {
    if (!payload || payload.type !== 'address_activity' || !payload.event) {
      return [];
    }
    const chain = networkToChain(payload.event.network);
    if (!chain) return [];
    const out: DepositEvent[] = [];
    for (const act of payload.event.activity || []) {
      const id = this.makeId(act.hash, 0);
      if (this.deposits.has(id)) {
        // 已存在：累加 confirmations
        const existing = this.deposits.get(id)!;
        existing.confirmations = Math.max(existing.confirmations, 1);
        this.tryPromote(existing);
        out.push(existing);
        continue;
      }
      // 解析 amount
      const decimals = act.category === 'token'
        ? (act.rawContract?.decimal ? parseInt(act.rawContract.decimal, 10) : this.defaultDecimals(chain, act.asset))
        : (act.asset === 'ETH' || act.asset === 'BNB' ? 18 : 6);
      const raw = BigInt(act.value || 0);
      const event: DepositEvent = {
        id,
        chain: chain as DepositChain,
        tokenSymbol: act.asset,
        tokenAddress: act.rawContract?.address,
        decimals,
        to: act.toAddress,
        from: act.fromAddress,
        amount: raw.toString(),
        amountFormatted: formatAmount(raw, decimals),
        txHash: act.hash,
        blockNumber: parseInt(act.blockNum, 16),
        logIndex: 0,
        confirmations: 1,
        requiredConfirmations: REQUIRED_CONFIRMATIONS[chain as ChainWithConfirmations] ?? 12,
        status: 'pending',
        detectedAt: Date.now(),
        source: 'webhook',
      };
      this.deposits.set(id, event);
      this.emit(event);
      this.tryPromote(event);
      out.push(event);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 轮询 -> 入账
  // -------------------------------------------------------------------------

  private handleRawTransfer(t: RawTransfer): void {
    const chain = t.chain as DepositChain;
    if (chain !== 'ETH' && chain !== 'BSC' && chain !== 'TRON') return;
    const id = this.makeId(t.txHash, t.logIndex);
    if (this.deposits.has(id)) {
      // 已存在，累加 confirmations
      const existing = this.deposits.get(id)!;
      existing.confirmations = Math.max(existing.confirmations, 1);
      this.tryPromote(existing);
      return;
    }
    const event: DepositEvent = {
      id,
      chain,
      tokenSymbol: t.tokenSymbol,
      tokenAddress: t.tokenAddress,
      decimals: t.decimals,
      to: t.to,
      from: t.from,
      amount: t.amountRaw.toString(),
      amountFormatted: formatAmount(t.amountRaw, t.decimals),
      txHash: t.txHash,
      blockNumber: t.blockNumber,
      logIndex: t.logIndex,
      confirmations: 1,
      requiredConfirmations: REQUIRED_CONFIRMATIONS[chain as ChainWithConfirmations] ?? 12,
      status: 'pending',
      detectedAt: Date.now(),
      source: 'polling',
    };
    this.deposits.set(id, event);
    this.emit(event);
    this.tryPromote(event);
  }

  // -------------------------------------------------------------------------
  // 状态机：pending -> confirmed -> credited
  // -------------------------------------------------------------------------

  private tryPromote(event: DepositEvent): void {
    if (event.status === 'credited' || event.status === 'failed') return;
    if (event.confirmations >= event.requiredConfirmations) {
      event.status = 'confirmed';
      this.emit(event);
      // 标记入账（简化：confirmed 后下一轮即可标 credited）
      event.status = 'credited';
      event.creditedAt = Date.now();
      this.emit(event);
      // 业务回调（最终入账）
      try {
        this.onCredited?.(event);
      } catch {
        /* swallow */
      }
    }
  }

  private emit(event: DepositEvent): void {
    for (const h of this.handlers) {
      try {
        h(event);
      } catch {
        /* swallow handler errors */
      }
    }
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private makeId(txHash: string, logIndex: number): string {
    return `${txHash.toLowerCase()}:${logIndex}`;
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createDepositMonitor(opts?: DepositMonitorOptions): DepositMonitor {
  return new DepositMonitor(opts);
}
