/**
 * 提现服务（WithdrawalService）
 *
 * 业务层封装：
 *  - 创建提现请求（地址校验、余额校验、风控检查）
 *  - 审核工作流（人工审批/拒绝）
 *  - 广播（构造交易 + 热钱包签名 + 提交到链）
 *  - 跟踪（轮询确认数）
 *  - 失败回滚
 *
 * 关键约束：
 *  - 私钥不写入日志
 *  - 大额（> HIGH_RISK_THRESHOLD_USD）需人工审核
 *  - 黑名单地址拦截
 *  - 每日限额
 *
 * 数据存储：内存 Map（演示用，生产可替换为 PostgreSQL）
 */

import {
  WithdrawalBroadcaster,
  type UnsignedTx,
  type SignedTx,
  type TransactionReceipt,
  type EvmChain,
} from './withdrawal-broadcaster';
import { isValidTrxAddress } from './tron-service';
import { validateAddress, type Chain as AddressChain } from './address';

// =============================================================================
// 常量
// =============================================================================

export const WITHDRAWAL_LIMITS: Record<'ETH' | 'BSC' | 'TRON', {
  dailyPerUser: string;
  minAmount: string;
  fee: string;
}> = {
  ETH: { dailyPerUser: '10', minAmount: '0.001', fee: '0.0005' },
  BSC: { dailyPerUser: '100', minAmount: '0.001', fee: '0.0001' },
  TRON: { dailyPerUser: '10000', minAmount: '1', fee: '1' },
};

export const HIGH_RISK_THRESHOLD_USD = 5000;

// =============================================================================
// 类型
// =============================================================================

export type WithdrawalStatus =
  | 'pending_review'  // 待审核
  | 'approved'        // 已审核
  | 'rejected'        // 已拒绝
  | 'broadcasting'    // 广播中
  | 'pending'         // 等待链上确认
  | 'confirmed'       // 已确认
  | 'failed';         // 失败

export interface WithdrawalRequest {
  id: string;
  userId: string;
  chain: EvmChain | 'TRON';
  asset: string;
  amount: string;
  amountRaw: string;
  toAddress: string;
  status: WithdrawalStatus;
  riskLevel: 'low' | 'medium' | 'high';
  txHash?: string;
  approvers: string[];
  rejectReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WithdrawalResult extends WithdrawalRequest {
  receipt?: TransactionReceipt;
  errorMessage?: string;
}

export interface WithdrawalServiceOptions {
  broadcaster: WithdrawalBroadcaster;
  /** 余额查询：返回 (userId, asset, chain) => bigint (raw) */
  getBalance?: (userId: string, asset: string, chain: string) => Promise<bigint>;
  /** USD 价格（用于风控大额判断） */
  getUsdPrice?: (asset: string) => Promise<number>;
  /** 黑名单地址（精确匹配） */
  blacklist?: string[];
  /** 风控回调：大额时是否需要人工审核（默认 true） */
  highRiskRequiresApproval?: boolean;
}

// =============================================================================
// 错误
// =============================================================================

export class WithdrawalError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'WithdrawalError';
  }
}

// =============================================================================
// WithdrawalService 主类
// =============================================================================

export class WithdrawalService {
  private readonly requests: Map<string, WithdrawalRequest> = new Map();
  private readonly userIndex: Map<string, Set<string>> = new Map();
  private readonly broadcaster: WithdrawalBroadcaster;
  private readonly getBalance: (userId: string, asset: string, chain: string) => Promise<bigint>;
  private readonly getUsdPrice: (asset: string) => Promise<number>;
  private readonly blacklist: Set<string>;
  private readonly highRiskRequiresApproval: boolean;

  constructor(opts: WithdrawalServiceOptions) {
    this.broadcaster = opts.broadcaster;
    this.getBalance = opts.getBalance || (async () => 0n);
    this.getUsdPrice = opts.getUsdPrice || (async () => 0);
    this.blacklist = new Set((opts.blacklist || []).map(a => a.toLowerCase()));
    this.highRiskRequiresApproval = opts.highRiskRequiresApproval !== false;
  }

  // -------------------------------------------------------------------------
  // 1. 创建提现请求
  // -------------------------------------------------------------------------

  /**
   * 创建提现请求
   *  - 校验地址
   *  - 校验最低金额
   *  - 校验余额（含手续费）
   *  - 风控检查（黑名单、大额、每日限额）
   *  - 标记风险等级
   */
  async createWithdrawalRequest(
    userId: string,
    asset: string,
    amount: string,
    toAddress: string,
    chain: EvmChain | 'TRON',
  ): Promise<WithdrawalRequest> {
    // 1. 参数校验
    if (!userId || !asset || !amount || !toAddress || !chain) {
      throw new WithdrawalError('INVALID_PARAMS', 'Missing required parameters');
    }
    // 自动识别格式：含 '.' 视为人类可读（含小数），否则视为 wei（原始）
    const amountBig = amount.includes('.')
      ? this.parseDecimalToWei(amount, chain)
      : this.parseBig(amount);
    if (amountBig <= 0n) {
      throw new WithdrawalError('INVALID_AMOUNT', 'Amount must be positive');
    }

    // 2. 地址校验
    this.assertValidAddress(toAddress, chain);

    // 3. 黑名单
    if (this.blacklist.has(toAddress.toLowerCase())) {
      throw new WithdrawalError('BLACKLISTED', `Address is blacklisted: ${this.maskAddr(toAddress)}`);
    }

    // 4. 最低金额
    const limits = WITHDRAWAL_LIMITS[chain];
    const minAmountWei = this.parseDecimalToWei(limits.minAmount, chain);
    if (amountBig < minAmountWei) {
      throw new WithdrawalError('BELOW_MIN', `Amount below minimum ${limits.minAmount}`);
    }

    // 5. 余额校验
    const balance = await this.getBalance(userId, asset, chain);
    const feeWei = this.parseDecimalToWei(limits.fee, chain);
    const total = amountBig + feeWei;
    if (balance < total) {
      throw new WithdrawalError('INSUFFICIENT_BALANCE', `Insufficient balance: have ${balance}, need ${total} (amount+fee)`);
    }

    // 6. 每日限额
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayStart = today.getTime();
    const todayUsed = this.sumUserDayTotal(userId, chain, dayStart);
    const dailyLimitWei = this.parseDecimalToWei(limits.dailyPerUser, chain);
    if (todayUsed + amountBig > dailyLimitWei) {
      throw new WithdrawalError('DAILY_LIMIT_EXCEEDED', `Daily limit exceeded: ${todayUsed + amountBig} > ${dailyLimitWei}`);
    }

    // 7. 风控：USD 价值
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let status: WithdrawalStatus = 'pending_review';
    try {
      const price = await this.getUsdPrice(asset);
      const usdValue = Number(amountBig) / 1e18 * price; // 简化：EVM 18 位精度
      // 实际应按各币精度计算
      if (usdValue > HIGH_RISK_THRESHOLD_USD) {
        riskLevel = 'high';
      } else if (usdValue > 1000) {
        riskLevel = 'medium';
      }
    } catch {
      // 价格查询失败 -> 保守标记 medium
      riskLevel = 'medium';
    }

    // 8. 大额是否直接拒绝人工审核：默认要求
    if (this.highRiskRequiresApproval && riskLevel === 'high') {
      status = 'pending_review';
    } else if (riskLevel === 'medium') {
      status = 'pending_review';
    } else {
      status = 'approved'; // 低风险直接通过
    }

    // 9. 入库
    const id = this.generateId('wd');
    const now = Date.now();
    const req: WithdrawalRequest = {
      id,
      userId,
      chain,
      asset,
      amount,
      amountRaw: amountBig.toString(),
      toAddress,
      status,
      riskLevel,
      approvers: [],
      createdAt: now,
      updatedAt: now,
    };
    this.requests.set(id, req);
    this.attachToUser(userId, id);
    return req;
  }

  // -------------------------------------------------------------------------
  // 2. 审核
  // -------------------------------------------------------------------------

  /** 审核通过 */
  async approveWithdrawal(id: string, approverId: string): Promise<WithdrawalRequest> {
    const req = this.requireRequest(id);
    if (req.status === 'rejected' || req.status === 'failed' ||
        req.status === 'confirmed' || req.status === 'broadcasting' ||
        req.status === 'pending') {
      throw new WithdrawalError('INVALID_STATE', `Cannot approve in status: ${req.status}`);
    }
    req.approvers.push(approverId);
    req.status = 'approved';
    req.updatedAt = Date.now();
    return req;
  }

  /** 拒绝 */
  async rejectWithdrawal(id: string, approverId: string, reason: string): Promise<WithdrawalRequest> {
    const req = this.requireRequest(id);
    if (req.status === 'rejected' || req.status === 'failed' ||
        req.status === 'confirmed' || req.status === 'broadcasting' ||
        req.status === 'pending') {
      throw new WithdrawalError('INVALID_STATE', `Cannot reject in status: ${req.status}`);
    }
    req.status = 'rejected';
    req.rejectReason = reason;
    req.approvers.push(approverId);
    req.updatedAt = Date.now();
    return req;
  }

  // -------------------------------------------------------------------------
  // 3. 广播
  // -------------------------------------------------------------------------

  /**
   * 执行提现（构造 + 签名 + 广播）
   *  - 必须已审核通过（status='approved'）
   *  - signerPrivateKey: 热钱包私钥（实际生产应从 HSM 获取）
   */
  async executeWithdrawal(id: string, signerPrivateKey: string): Promise<WithdrawalResult> {
    const req = this.requireRequest(id);
    if (req.status !== 'approved') {
      throw new WithdrawalError('NOT_APPROVED', `Withdrawal must be approved, current: ${req.status}`);
    }
    req.status = 'broadcasting';
    req.updatedAt = Date.now();
    try {
      let unsignedTx: UnsignedTx;
      let signedTx: SignedTx;
      if (req.chain === 'ETH' || req.chain === 'BSC') {
        // 构造 EIP-1559 交易
        // amountRaw 是 wei（hex 或 decimal）
        const valueHex = req.amountRaw.startsWith('0x') ? req.amountRaw : '0x' + BigInt(req.amountRaw).toString(16);
        // 这里 toAddress 是用户提现目标地址
        // 真实 from 应该是热钱包地址，这里用 req.toAddress 占位
        // 实际生产：从热钱包管理器中获取
        const fromAddress = req.toAddress; // 简化：使用 toAddress 作为 from 用于演示
        unsignedTx = this.broadcaster.buildEip1559Tx({
          chain: req.chain,
          from: fromAddress,
          to: req.toAddress,
          value: valueHex,
        });
        signedTx = this.broadcaster.signTx(unsignedTx, signerPrivateKey);
        const txHash = await this.broadcaster.broadcast(req.chain, signedTx);
        req.txHash = txHash;
        req.status = 'pending';
      } else {
        // TRON
        const amountSun = req.amountRaw;
        unsignedTx = this.broadcaster.buildTrxTransfer({
          from: req.toAddress, // 简化
          to: req.toAddress,
          amountSun,
        });
        signedTx = this.broadcaster.signTx(unsignedTx, signerPrivateKey);
        const txHash = await this.broadcaster.broadcastTron(
          unsignedTx.raw.raw_data_hex,
          signedTx.serialized,
        );
        req.txHash = txHash;
        req.status = 'pending';
      }
      req.updatedAt = Date.now();
      return { ...req };
    } catch (err) {
      req.status = 'failed';
      req.updatedAt = Date.now();
      return {
        ...req,
        errorMessage: (err as Error).message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 4. 跟踪
  // -------------------------------------------------------------------------

  /**
   * 跟踪提现确认
   *  - 轮询链上确认数
   *  - 达到 requiredConfirmations 更新 status='confirmed'
   *  - 链上 status=0 (EVM) 标记 failed
   */
  async trackWithdrawal(id: string): Promise<WithdrawalResult> {
    const req = this.requireRequest(id);
    if (!req.txHash) {
      throw new WithdrawalError('NO_TX_HASH', `No tx hash for withdrawal ${id}`);
    }
    if (req.status === 'confirmed' || req.status === 'failed' || req.status === 'rejected') {
      return { ...req };
    }
    try {
      const receipt = await this.broadcaster.trackConfirmation(req.txHash, req.chain);
      req.updatedAt = Date.now();
      if (receipt.status === 'failed') {
        req.status = 'failed';
      } else if (receipt.status === 'success') {
        req.status = 'confirmed';
      } else {
        req.status = 'pending';
      }
      return { ...req, receipt };
    } catch (err) {
      return {
        ...req,
        errorMessage: (err as Error).message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 5. 查询
  // -------------------------------------------------------------------------

  getWithdrawal(id: string): WithdrawalRequest | null {
    return this.requests.get(id) || null;
  }

  listPendingApprovals(): WithdrawalRequest[] {
    return Array.from(this.requests.values())
      .filter(r => r.status === 'pending_review')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  listUserWithdrawals(userId: string, limit: number = 50): WithdrawalRequest[] {
    const ids = this.userIndex.get(userId) || new Set();
    return Array.from(ids)
      .map(id => this.requests.get(id))
      .filter((r): r is WithdrawalRequest => Boolean(r))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private requireRequest(id: string): WithdrawalRequest {
    const req = this.requests.get(id);
    if (!req) throw new WithdrawalError('NOT_FOUND', `Withdrawal not found: ${id}`);
    return req;
  }

  private attachToUser(userId: string, withdrawalId: string): void {
    let set = this.userIndex.get(userId);
    if (!set) {
      set = new Set();
      this.userIndex.set(userId, set);
    }
    set.add(withdrawalId);
  }

  private sumUserDayTotal(userId: string, chain: string, dayStart: number): bigint {
    const ids = this.userIndex.get(userId) || new Set();
    let total = 0n;
    for (const id of ids) {
      const r = this.requests.get(id);
      if (!r) continue;
      if (r.chain !== chain) continue;
      if (r.status === 'rejected' || r.status === 'failed') continue;
      if (r.createdAt < dayStart) continue;
      total += BigInt(r.amountRaw);
    }
    return total;
  }

  private parseBig(v: string): bigint {
    try {
      if (v.startsWith('0x')) return BigInt(v);
      return BigInt(v);
    } catch {
      throw new WithdrawalError('INVALID_NUMBER', `Invalid number: ${v}`);
    }
  }

  /**
   * 将十进制字符串（人类可读格式，如 '0.001'）转为 wei 单位的 bigint
   *  - ETH/BSC: 18 位精度
   *  - TRON（TRX 原生币）: 6 位精度
   *  - 解析过程使用字符串分割避免浮点精度损失
   */
  private parseDecimalToWei(v: string, chain: 'ETH' | 'BSC' | 'TRON'): bigint {
    try {
      // 已是 hex 形式（已为 wei）：直接返回
      if (v.startsWith('0x')) return BigInt(v);
      const decimals = chain === 'TRON' ? 6 : 18;
      const s = v.trim();
      const idx = s.indexOf('.');
      if (idx < 0) {
        // 纯整数
        return BigInt(s) * 10n ** BigInt(decimals);
      }
      const intPart = s.slice(0, idx) || '0';
      let fracPart = s.slice(idx + 1);
      if (fracPart.length > decimals) {
        // 截断多余小数（不四舍五入，避免精度误差）
        fracPart = fracPart.slice(0, decimals);
      } else {
        // 右侧补 0
        fracPart = fracPart.padEnd(decimals, '0');
      }
      const combined = intPart + fracPart;
      return BigInt(combined);
    } catch (err) {
      throw new WithdrawalError('INVALID_NUMBER', `Invalid decimal: ${v} (${(err as Error).message})`);
    }
  }

  private assertValidAddress(addr: string, chain: 'ETH' | 'BSC' | 'TRON'): void {
    if (chain === 'ETH' || chain === 'BSC') {
      if (!validateAddress(chain as AddressChain, addr)) {
        throw new WithdrawalError('INVALID_ADDRESS', `Invalid ${chain} address: ${this.maskAddr(addr)}`);
      }
    } else {
      if (!isValidTrxAddress(addr)) {
        throw new WithdrawalError('INVALID_ADDRESS', `Invalid TRON address: ${this.maskAddr(addr)}`);
      }
    }
  }

  private maskAddr(addr: string): string {
    if (addr.length <= 10) return addr;
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createWithdrawalService(opts: WithdrawalServiceOptions): WithdrawalService {
  return new WithdrawalService(opts);
}
