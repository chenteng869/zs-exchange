/**
 * 区块轮询器（BlockPoller）
 *
 * 被 DepositMonitor 内部使用：
 *  - 每 N 秒轮询一次链上新区块
 *  - 扫描平台入账地址的 ERC20 / TRC20 Transfer 事件
 *  - 维护 `lastScannedBlock` 状态，仅返回新增交易
 *  - 错误重试 + 断网降级（不抛错，仅记录）
 *
 * 实现要点：
 *  - 沿用现有 RpcClient / TronRpcClient 进行 RPC 调用（不复用 chain-service 的余额方法，因为它们是聚合视图）
 *  - 支持任意数量的待监控地址
 *  - EVM 用 `eth_getLogs` 过滤 Transfer 事件
 *  - TRON 用 Trongrid `/v1/accounts/{addr}/transactions/trc20`
 */

import { RpcClient, RpcError, type RpcClientOptions } from './rpc-client';
import { TronRpcClient, TronRpcError, type TronRpcClientOptions } from './tron-rpc-client';

// =============================================================================
// 常量
// =============================================================================

/** 默认每 15s 轮询 */
export const POLL_INTERVAL_MS = 15_000;
/** 每次最多扫 100 个区块 */
export const POLL_BATCH_SIZE = 100;
/** EVM Transfer 事件 topic0 */
export const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// =============================================================================
// 类型
// =============================================================================

export type MonitoredChain = 'ETH' | 'BSC' | 'TRON';

export interface RawTransfer {
  chain: MonitoredChain;
  tokenSymbol: string;
  tokenAddress?: string;
  decimals: number;
  from: string;
  to: string;
  amountRaw: bigint;
  txHash: string;
  blockNumber: number;
  /** EVM: logIndex; TRON: 0（trc20 端点不返回） */
  logIndex: number;
  blockTimestamp?: number;
}

export interface BlockPollerOptions {
  /** EVM 链 RPC 客户端（ETH/BSC 共享一个即可） */
  evmClient?: RpcClient;
  /** TRON RPC 客户端 */
  tronClient?: TronRpcClient;
  /** 轮询间隔（毫秒） */
  pollIntervalMs?: number;
  /** 每次最多扫 N 个区块 */
  batchSize?: number;
  /** 单批 RPC 超时（毫秒） */
  perCallTimeoutMs?: number;
  /** 轮询失败时回调（断网降级日志） */
  onError?: (err: Error, chain: MonitoredChain) => void;
  /** 扫描到新 Transfer 回调 */
  onTransfer: (t: RawTransfer) => void;
}

// =============================================================================
// BlockPoller
// =============================================================================

/** 监控的地址：(chain, address) => tokenInfo[] */
type WatchedAddress = {
  chain: MonitoredChain;
  address: string;
  /** 默认接收的代币（如 USDT）。undefined 表示监听原生币（如 ETH/TRX） */
  tokenSymbol?: string;
  tokenAddress?: string;
  decimals: number;
};

export class BlockPoller {
  private readonly evmClient?: RpcClient;
  private readonly tronClient?: TronRpcClient;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly perCallTimeoutMs: number;
  private readonly onError: (err: Error, chain: MonitoredChain) => void;
  private readonly onTransfer: (t: RawTransfer) => void;

  /** chain -> address -> WatchedAddress */
  private watched: Map<MonitoredChain, Map<string, WatchedAddress>> = new Map();
  /** chain -> lastScannedBlock（EVM） */
  private lastScannedBlock: Map<MonitoredChain, number> = new Map();
  /** chain -> lastScannedTimestamp (TRON ms) */
  private lastScannedTs: Map<MonitoredChain, number> = new Map();
  /** 已上报的 tx:logIndex 集合（去重） */
  private seen: Set<string> = new Set();

  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private inFlight = false;

  constructor(opts: BlockPollerOptions) {
    this.evmClient = opts.evmClient;
    this.tronClient = opts.tronClient;
    this.pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS;
    this.batchSize = Math.max(1, opts.batchSize ?? POLL_BATCH_SIZE);
    this.perCallTimeoutMs = opts.perCallTimeoutMs ?? 5_000;
    this.onError = opts.onError ?? (() => { /* ignore */ });
    this.onTransfer = opts.onTransfer;
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  start(): void {
    if (this.timer) return;
    this.running = true;
    // 立即跑一次（异步，不阻塞）
    this.tick().catch(() => { /* swallow */ });
    this.timer = setInterval(() => {
      if (this.inFlight) return; // 上一轮未结束则跳过
      this.tick().catch(() => { /* swallow */ });
    }, this.pollIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  // -------------------------------------------------------------------------
  // 地址管理
  // -------------------------------------------------------------------------

  watchAddress(entry: WatchedAddress): void {
    let m = this.watched.get(entry.chain);
    if (!m) {
      m = new Map();
      this.watched.set(entry.chain, m);
    }
    m.set(entry.address.toLowerCase(), entry);
  }

  unwatchAddress(chain: MonitoredChain, address: string): void {
    const m = this.watched.get(chain);
    if (m) m.delete(address.toLowerCase());
  }

  /** 当前监控的地址数 */
  size(): number {
    let n = 0;
    for (const m of this.watched.values()) n += m.size;
    return n;
  }

  // -------------------------------------------------------------------------
  // 状态（测试用）
  // -------------------------------------------------------------------------

  getLastScannedBlock(chain: MonitoredChain): number {
    return this.lastScannedBlock.get(chain) || 0;
  }

  setLastScannedBlock(chain: MonitoredChain, block: number): void {
    this.lastScannedBlock.set(chain, block);
  }

  hasSeen(txHash: string, logIndex: number): boolean {
    return this.seen.has(`${txHash}:${logIndex}`);
  }

  markSeen(txHash: string, logIndex: number): void {
    this.seen.add(`${txHash}:${logIndex}`);
  }

  // -------------------------------------------------------------------------
  // 内部：一次 tick
  // -------------------------------------------------------------------------

  /** 手动触发一次扫描（用于测试） */
  async tick(): Promise<{ scanned: number; errors: string[] }> {
    if (this.inFlight) return { scanned: 0, errors: ['busy'] };
    this.inFlight = true;
    const errors: string[] = [];
    let scanned = 0;
    try {
      // 串行扫描各链（避免一链故障阻塞另一链）
      for (const chain of ['ETH', 'BSC', 'TRON'] as MonitoredChain[]) {
        try {
          const n = await this.scanChain(chain);
          scanned += n;
        } catch (err) {
          const e = err as Error;
          errors.push(`${chain}: ${e.message}`);
          this.onError(e, chain);
        }
      }
      return { scanned, errors };
    } finally {
      this.inFlight = false;
    }
  }

  private async scanChain(chain: MonitoredChain): Promise<number> {
    if (chain === 'TRON') {
      return this.scanTron();
    }
    return this.scanEvm(chain);
  }

  // -------------------------------------------------------------------------
  // EVM 扫描
  // -------------------------------------------------------------------------

  private async scanEvm(chain: 'ETH' | 'BSC'): Promise<number> {
    if (!this.evmClient) return 0;
    const addrs = this.watched.get(chain);
    if (!addrs || addrs.size === 0) return 0;

    // 1. 获取最新区块
    let latestHex: string;
    try {
      latestHex = await this.evmClient.call<string>('eth_blockNumber', [], { retry: true });
    } catch (err) {
      throw new Error(`eth_blockNumber failed: ${(err as Error).message}`);
    }
    const latest = parseInt(latestHex, 16);
    let from = this.lastScannedBlock.get(chain);
    if (!from || from <= 0) {
      // 首次扫描：从 latest - batchSize 开始（避免一次性扫太久）
      from = Math.max(0, latest - this.batchSize + 1);
    } else {
      from = from + 1;
    }
    const to = Math.min(latest, from + this.batchSize - 1);
    if (to < from) return 0;

    // 2. 构造 topic 过滤：to = pad(address)
    const addresses = Array.from(addrs.values());
    const topics: string[] = [TRANSFER_EVENT_TOPIC, null, null];
    const addressFilters: Record<string, string[]> = {};
    for (const a of addresses) {
      const padded = '0x' + a.address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
      if (!addressFilters[a.tokenAddress || 'native']) addressFilters[a.tokenAddress || 'native'] = [];
      addressFilters[a.tokenAddress || 'native'].push(padded);
    }
    // 由于 to 可能在多 token 合约下命中，对每个 tokenAddress 拉一次
    let total = 0;
    for (const [tokenAddr, topicFilters] of Object.entries(addressFilters)) {
      // 仅当所有地址都对应同一 token 时合并；为简化每个 token 合约单独调用
      const filter: any = {
        fromBlock: '0x' + from.toString(16),
        toBlock: '0x' + to.toString(16),
        topics: [TRANSFER_EVENT_TOPIC, null, topicFilters],
      };
      if (tokenAddr !== 'native') {
        filter.address = tokenAddr;
      }
      let logs: any[];
      try {
        logs = await this.evmClient.call<any[]>('eth_getLogs', [filter], { retry: true });
      } catch (err) {
        // eth_getLogs 节点不支持时降级：跳过本批次
        this.onError(err as Error, chain);
        continue;
      }
      for (const log of logs) {
        const transfer = this.parseEvmLog(log, addresses, chain);
        if (!transfer) continue;
        const key = `${transfer.txHash}:${transfer.logIndex}`;
        if (this.seen.has(key)) continue;
        this.seen.add(key);
        this.onTransfer(transfer);
        total++;
      }
    }
    this.lastScannedBlock.set(chain, to);
    return total;
  }

  /** 解析一条 ERC20 Transfer log */
  private parseEvmLog(log: any, watched: WatchedAddress[], chain: 'ETH' | 'BSC'): RawTransfer | null {
    try {
      if (!log || !log.topics || log.topics.length < 3) return null;
      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const value = BigInt(log.data || '0x0');
      const blockNumber = parseInt(log.blockNumber, 16);
      const logIndex = parseInt(log.logIndex, 16);
      const txHash = log.transactionHash;
      const tokenAddress = (log.address || '').toLowerCase();

      // 找到匹配 (to, token) 的 watched
      const match = watched.find(
        (w) => w.address.toLowerCase() === to.toLowerCase()
          && (!w.tokenAddress || w.tokenAddress.toLowerCase() === tokenAddress),
      );
      if (!match) return null;

      return {
        chain,
        tokenSymbol: match.tokenSymbol || 'UNKNOWN',
        tokenAddress: tokenAddress,
        decimals: match.decimals,
        from,
        to,
        amountRaw: value,
        txHash,
        blockNumber,
        logIndex,
      };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // TRON 扫描
  // -------------------------------------------------------------------------

  private async scanTron(): Promise<number> {
    if (!this.tronClient) return 0;
    const addrs = this.watched.get('TRON');
    if (!addrs || addrs.size === 0) return 0;
    let total = 0;
    for (const w of addrs.values()) {
      try {
        const res = await this.tronClient.request<any>(
          `/v1/accounts/${w.address}/transactions/trc20?limit=50`,
        );
        const list: any[] = Array.isArray(res?.data) ? res.data : [];
        for (const tx of list) {
          const valueHex = tx.value || '0';
          const valueRaw = this.hexToBigInt(valueHex);
          const symbol = tx.token_info?.symbol || w.tokenSymbol || 'USDT';
          const decimals = tx.token_info?.decimals ?? w.decimals;
          const txHash = (tx.transaction_id || '').replace(/^0x/, '');
          const ts = tx.block_timestamp ?? 0;
          // TRC20 端点不返回 logIndex，使用 index 字段或 fallback 0
          const logIndex = typeof tx.index === 'number' ? tx.index : 0;
          const key = `${txHash}:${logIndex}`;
          if (this.seen.has(key)) continue;
          this.seen.add(key);
          this.onTransfer({
            chain: 'TRON',
            tokenSymbol: symbol,
            tokenAddress: (tx.token_id || w.tokenAddress || '').toLowerCase(),
            decimals,
            from: tx.from || '',
            to: tx.to || w.address,
            amountRaw: valueRaw,
            txHash,
            blockNumber: 0, // Trongrid 端点不返回
            logIndex,
            blockTimestamp: ts,
          });
          total++;
        }
        // 更新 lastScannedTs（用列表最新 ts）
        if (list.length > 0) {
          const latest = Math.max(...list.map((t) => t.block_timestamp || 0));
          if (latest > 0) this.lastScannedTs.set('TRON', latest);
        }
      } catch (err) {
        this.onError(err as Error, 'TRON');
        // 不抛错，降级
      }
    }
    return total;
  }

  private hexToBigInt(value: string | number | bigint): bigint {
    try {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'number') return BigInt(value);
      const s = String(value).trim();
      if (!s) return 0n;
      if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s);
      if (/^[0-9a-fA-F]+$/.test(s)) return BigInt('0x' + s);
      return BigInt(s);
    } catch {
      return 0n;
    }
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createEvmRpcClient(opts: RpcClientOptions): RpcClient {
  return new RpcClient(opts);
}

export function createTronRpcClient(opts: TronRpcClientOptions): TronRpcClient {
  return new TronRpcClient(opts);
}

// 抑制未使用变量
void RpcError;
void TronRpcError;
