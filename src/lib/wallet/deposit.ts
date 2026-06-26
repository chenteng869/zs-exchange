/**
 * 充值服务 (DepositService)
 *
 * 职责：
 *  - 创建/获取充值地址
 *  - 维护充值历史
 *  - 自动入账（confirmDeposit）
 *  - 内部转账即时到账
 *  - 模拟扫描区块链（定时器生成假充值事件）
 *  - 充值通知：邮件/站内信/推送
 */

import type { DepositRecord, ID, Paginated } from '@/types/models';
import { WalletManager, WalletError } from './manager';
import type { Chain } from './address';

// =============================================================================
// 类型
// =============================================================================

export interface CreateDepositAddressParams {
  userId: ID;
  asset: string;
  chain?: Chain;
}

export interface DepositHistoryParams {
  asset?: string;
  chain?: string;
  status?: DepositRecord['status'];
  page?: number;
  pageSize?: number;
}

export type NotificationChannel = 'email' | 'inbox' | 'push';

export interface NotificationMessage {
  channel: NotificationChannel;
  userId: ID;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  sentAt: string;
}

/** 充值回调 */
export type DepositCallback = (record: DepositRecord) => void;

// =============================================================================
// 错误
// =============================================================================

export class DepositError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'DepositError';
  }
}

// =============================================================================
// 通知抽象（默认 console）
// =============================================================================

export type NotificationSender = (msg: NotificationMessage) => void | Promise<void>;
const defaultSender: NotificationSender = (msg) => {
  // 实际生产环境可替换为真实推送/邮件 SDK
  if (typeof console !== 'undefined') {
    console.info(`[notify:${msg.channel}] -> ${msg.userId} | ${msg.title}`);
  }
};

// =============================================================================
// DepositService
// =============================================================================

export class DepositService {
  /** deposits */
  private deposits: Map<ID, DepositRecord> = new Map();
  /** userId -> Set<depositId> */
  private userDeposits: Map<ID, Set<ID>> = new Map();
  /** txHash -> depositId */
  private txIndex: Map<string, ID> = new Map();
  /** address -> Set<userId> (用于内部转账和扫描) */
  private addressMap: Map<string, ID> = new Map();
  /** 通知发送器 */
  private sender: NotificationSender;
  /** 模拟扫描定时器 */
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  /** 充值回调 */
  private callbacks: Set<DepositCallback> = new Set();
  /** 内部模拟事件队列 */
  private pendingEvents: Array<{
    userId: ID;
    asset: string;
    chain: string;
    address: string;
    amount: string;
    txHash: string;
    fromAddress: string;
  }> = [];
  /** 必要确认数 */
  private readonly requiredConfs: Record<string, number> = {
    BTC: 3,
    ETH: 12,
    BSC: 15,
    TRX: 20,
    SOL: 32,
  };

  constructor(
    private readonly walletManager: WalletManager,
    sender?: NotificationSender,
  ) {
    this.sender = sender ?? defaultSender;
  }

  // ============================================================
  // 1. 创建/获取充值地址
  // ============================================================

  /**
   * 创建充值地址（用户在该链上的入账地址）
   *   - 若已存在则复用（一个用户在同链同资产一个充值地址）
   */
  createDepositAddress(params: CreateDepositAddressParams): { address: string; chain: string; asset: string } {
    const { userId, asset } = params;
    const chain = (params.chain ?? this.inferChain(asset)) as string;

    // 查找是否已有该链/资产组合的充值地址
    const existing = this.findExistingDepositAddress(userId, chain, asset);
    if (existing) {
      return { address: existing, chain, asset };
    }

    // 创建新热钱包
    const wallet = this.walletManager.createWallet(userId, asset, 'hot');
    // 若推断 chain 不匹配，强制覆盖（保持一致）
    if (wallet.chain !== chain) {
      // 为简化：直接更新
      (wallet as { chain: string }).chain = chain;
    }
    this.addressMap.set(wallet.address, userId);
    return { address: wallet.address, chain: wallet.chain, asset };
  }

  /** 获取已有充值地址 */
  private findExistingDepositAddress(userId: ID, chain: string, asset: string): string | undefined {
    const wallets = this.walletManager.getWallets(userId);
    return wallets.find((w) => w.chain === chain && w.asset === asset)?.address;
  }

  // ============================================================
  // 2. 充值历史
  // ============================================================

  getDepositHistory(userId: ID, params: DepositHistoryParams = {}): Paginated<DepositRecord> {
    const ids = this.userDeposits.get(userId) ?? new Set();
    let list = Array.from(ids)
      .map((id) => this.deposits.get(id))
      .filter((d): d is DepositRecord => Boolean(d));

    if (params.asset) list = list.filter((d) => d.asset === params.asset);
    if (params.chain) list = list.filter((d) => d.chain === params.chain);
    if (params.status) list = list.filter((d) => d.status === params.status);

    // 按创建时间倒序
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, params.pageSize ?? 20));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      list: list.slice(start, end),
      total: list.length,
      page,
      pageSize,
    };
  }

  // ============================================================
  // 3. 充值入账
  // ============================================================

  /**
   * 区块链确认一笔交易，确认数足够则入账
   *  - 如果 confirmations >= requiredConfirmations => 完成
   *  - 否则 -> confirming
   *  - 找不到 txHash 对应记录 -> 抛出
   */
  confirmDeposit(txHash: string, confirmations: number): DepositRecord {
    const depositId = this.txIndex.get(txHash);
    if (!depositId) {
      throw new DepositError('TX_NOT_FOUND', `Unknown tx hash: ${txHash}`);
    }
    const record = this.deposits.get(depositId);
    if (!record) {
      throw new DepositError('DEPOSIT_NOT_FOUND', `Deposit not found: ${depositId}`);
    }
    if (record.status === 'completed' || record.status === 'failed' || record.status === 'rejected') {
      return record;
    }
    record.confirmations = Math.max(record.confirmations, confirmations);
    if (record.confirmations >= record.requiredConfirmations) {
      return this.completeDeposit(record.id);
    }
    record.status = 'confirming';
    return record;
  }

  /** 标记为完成并入账 */
  private completeDeposit(depositId: ID): DepositRecord {
    const record = this.deposits.get(depositId);
    if (!record) {
      throw new DepositError('DEPOSIT_NOT_FOUND', `Deposit not found: ${depositId}`);
    }
    if (record.status === 'completed') return record;

    record.status = 'completed';
    record.completedAt = new Date().toISOString();

    // 增加钱包余额
    const wallet = this.walletManager.findByAddress(record.toAddress);
    if (wallet) {
      const cur = this.toBig(wallet.balance);
      const add = this.toBig(record.amount);
      wallet.balance = this.toDec(cur.add(add));
    }

    // 发送通知
    this.notifyDepositCompleted(record);
    // 触发回调
    for (const cb of this.callbacks) {
      try {
        cb(record);
      } catch {
        // 静默
      }
    }
    return record;
  }

  // ============================================================
  // 4. 内部转账
  // ============================================================

  /**
   * 站内用户间即时到账
   */
  internalTransfer(params: {
    fromUserId: ID;
    toUserId: ID;
    asset: string;
    chain?: string;
    amount: string;
    memo?: string;
  }): DepositRecord {
    if (this.toBig(params.amount).lte(new Big(0))) {
      throw new DepositError('INVALID_AMOUNT', 'Amount must be positive');
    }

    const chain = params.chain ?? this.inferChain(params.asset);
    // 获取/创建双方地址
    const fromAddr = this.createDepositAddress({
      userId: params.fromUserId,
      asset: params.asset,
      chain: chain as Chain,
    });
    const toAddr = this.createDepositAddress({
      userId: params.toUserId,
      asset: params.asset,
      chain: chain as Chain,
    });

    // 扣减 from
    const fromWallet = this.walletManager.findByAddress(fromAddr.address);
    if (!fromWallet) {
      throw new WalletError('WALLET_NOT_FOUND', 'from wallet missing');
    }
    const fromBal = this.toBig(fromWallet.balance);
    if (fromBal.lt(this.toBig(params.amount))) {
      throw new DepositError('INSUFFICIENT_BALANCE', 'Insufficient balance for internal transfer');
    }
    fromWallet.balance = this.toDec(fromBal.sub(this.toBig(params.amount)));

    const id = this.generateId('d');
    const now = new Date().toISOString();
    const record: DepositRecord = {
      id,
      userId: params.toUserId,
      asset: params.asset,
      chain: chain as string,
      txHash: `internal_${id}`,
      fromAddress: fromAddr.address,
      toAddress: toAddr.address,
      amount: params.amount,
      fee: '0',
      confirmations: 1,
      requiredConfirmations: 1,
      status: 'completed',
      blockTime: now,
      internal: true,
      memo: params.memo,
      remark: 'internal transfer',
      createdAt: now,
      completedAt: now,
    };
    this.deposits.set(id, record);
    this.attachToUser(params.toUserId, id);
    this.txIndex.set(record.txHash, id);

    // 增加 to
    const toWallet = this.walletManager.findByAddress(toAddr.address);
    if (toWallet) {
      const cur = this.toBig(toWallet.balance);
      toWallet.balance = this.toDec(cur.add(this.toBig(params.amount)));
    }

    // 通知
    this.notifyDepositCompleted(record);
    return record;
  }

  // ============================================================
  // 5. 模拟扫描区块链
  // ============================================================

  /**
   * 启动模拟扫描
   *   - 周期性地从 pendingEvents 取出事件，生成充值记录
   *   - 经过几轮 confirm 后入账
   */
  startScan(intervalMs: number = 3000): void {
    if (this.scanTimer) return;
    this.scanTimer = setInterval(() => this.scanOnce(), intervalMs);
  }

  stopScan(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  /** 单次扫描 */
  scanOnce(): void {
    if (this.pendingEvents.length === 0) return;
    const evt = this.pendingEvents.shift()!;
    // 创建 deposit 记录
    const id = this.generateId('d');
    const now = new Date().toISOString();
    const required = this.requiredConfs[evt.chain] ?? 12;
    const record: DepositRecord = {
      id,
      userId: evt.userId,
      asset: evt.asset,
      chain: evt.chain,
      txHash: evt.txHash,
      fromAddress: evt.fromAddress,
      toAddress: evt.address,
      amount: evt.amount,
      fee: '0',
      confirmations: 1,
      requiredConfirmations: required,
      status: 'confirming',
      blockTime: now,
      internal: false,
      createdAt: now,
    };
    this.deposits.set(id, record);
    this.attachToUser(evt.userId, id);
    this.txIndex.set(evt.txHash, id);

    // 触发回调
    for (const cb of this.callbacks) {
      try {
        cb(record);
      } catch {
        // ignore
      }
    }
  }

  /**
   * 模拟从外部注入一个充值事件
   *  （通常在演示页或 admin 后台使用）
   */
  injectDepositEvent(evt: {
    userId: ID;
    asset: string;
    chain: string;
    address: string;
    amount: string;
    txHash: string;
    fromAddress: string;
  }): void {
    this.pendingEvents.push(evt);
  }

  // ============================================================
  // 6. 通知
  // ============================================================

  private notifyDepositCompleted(record: DepositRecord): void {
    const channels: NotificationChannel[] = ['inbox', 'email', 'push'];
    for (const ch of channels) {
      this.sender({
        channel: ch,
        userId: record.userId,
        title: `充值到账 ${record.amount} ${record.asset}`,
        content: `您的 ${record.asset} 充值已确认到账（${record.txHash}）`,
        data: { recordId: record.id, amount: record.amount, asset: record.asset },
        sentAt: new Date().toISOString(),
      });
    }
  }

  // ============================================================
  // 7. 回调
  // ============================================================

  onDeposit(cb: DepositCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  // ============================================================
  // 工具
  // ============================================================

  private inferChain(asset: string): Chain {
    const upper = asset.toUpperCase();
    if (upper === 'BTC') return 'BTC';
    if (upper === 'ETH') return 'ETH';
    if (upper === 'TRX') return 'TRX';
    if (upper === 'BNB') return 'BSC';
    if (upper === 'SOL') return 'SOL';
    return 'ETH';
  }

  private attachToUser(userId: ID, depositId: ID): void {
    let set = this.userDeposits.get(userId);
    if (!set) {
      set = new Set();
      this.userDeposits.set(userId, set);
    }
    set.add(depositId);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /** 字符串 -> 大数（保持精度） */
  private toBig(v: string | number): Big {
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) throw new DepositError('INVALID_NUMBER', 'NaN/Infinity');
      // 转为字符串
      v = v.toString();
    }
    if (typeof v !== 'string') throw new DepositError('INVALID_TYPE', 'expect string');
    return new Big(v);
  }

  private toDec(b: Big): string {
    return b.toString();
  }
}

// =============================================================================
// 简易 Big 整数运算（基于 bigint，避免引入依赖）
// =============================================================================

/** 简化 Big：使用 bigint 实现，支持任意精度 + 小数 */
export class Big {
  /** 主值（整数） */
  private n: bigint;
  /** 小数位数 */
  private d: number;

  constructor(v: string | number | bigint) {
    let s: string;
    if (typeof v === 'bigint') {
      s = v.toString();
      this.n = v;
      this.d = 0;
      return;
    }
    if (typeof v === 'number') {
      s = v.toString();
    } else {
      s = v.trim();
    }
    if (!/^-?\d+(\.\d+)?$/.test(s)) {
      throw new DepositError('BIG_INVALID', `Invalid big: ${v}`);
    }
    const neg = s.startsWith('-');
    if (neg) s = s.slice(1);
    const dot = s.indexOf('.');
    if (dot === -1) {
      this.n = BigInt(s || '0');
      this.d = 0;
    } else {
      const intPart = s.slice(0, dot) || '0';
      const decPart = s.slice(dot + 1);
      this.n = BigInt(intPart + decPart);
      this.d = decPart.length;
    }
    if (neg) this.n = -this.n;
  }

  private withSameScale(other: Big): { a: bigint; b: bigint; d: number } {
    const d = Math.max(this.d, other.d);
    const a = this.n * BigInt(10) ** BigInt(d - this.d);
    const b = other.n * BigInt(10) ** BigInt(d - other.d);
    return { a, b, d };
  }

  add(other: Big): Big {
    const { a, b, d } = this.withSameScale(other);
    return new Big((a + b).toString()).rescale(d);
  }

  sub(other: Big): Big {
    const { a, b, d } = this.withSameScale(other);
    return new Big((a - b).toString()).rescale(d);
  }

  mul(other: Big): Big {
    return new Big((this.n * other.n).toString()).rescale(this.d + other.d);
  }

  div(other: Big): Big {
    if (other.n === 0n) throw new DepositError('DIV_ZERO', 'Division by zero');
    // 保留 18 位
    const target = 18;
    const scale = BigInt(10) ** BigInt(target + other.d);
    const a = this.n * scale;
    return new Big((a / other.n).toString()).rescale(target);
  }

  lt(other: Big): boolean {
    const { a, b } = this.withSameScale(other);
    return a < b;
  }
  lte(other: Big): boolean {
    const { a, b } = this.withSameScale(other);
    return a <= b;
  }
  gt(other: Big): boolean {
    const { a, b } = this.withSameScale(other);
    return a > b;
  }
  gte(other: Big): boolean {
    const { a, b } = this.withSameScale(other);
    return a >= b;
  }
  eq(other: Big): boolean {
    const { a, b } = this.withSameScale(other);
    return a === b;
  }

  toString(): string {
    if (this.d === 0) return this.n.toString();
    const neg = this.n < 0n;
    const abs = neg ? -this.n : this.n;
    const s = abs.toString().padStart(this.d + 1, '0');
    const intPart = s.slice(0, s.length - this.d).replace(/^0+(?=\d)/, '') || '0';
    let decPart = s.slice(s.length - this.d).replace(/0+$/, '');
    let out = decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
    if (neg) out = '-' + out;
    return out;
  }

  private rescale(d: number): Big {
    const r = new Big(this.n.toString());
    r.n = this.n;
    r.d = d;
    return r;
  }
}
