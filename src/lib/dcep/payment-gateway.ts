/**
 * DcepPaymentGateway - 央行侧网关（mock）
 *
 * 模拟中国人民银行数字货币研究所接口：
 *  - 端点：https://api.dcep.example.com/v1
 *  - 鉴权：X-API-KEY: <central-bank-api-key>
 *  - 提交交易 / 查询 / 验签 / 结算
 *
 * 演示降级：所有调用均返回 mock 响应（无真实网络）。
 *
 * 生产环境应：
 *  - 走国密 SM2/SM4 加密通道
 *  - 通过专线 / VPN 接入
 *  - 启用双向 TLS（mTLS）
 *
 * 用法：
 *   const gw = new DcepPaymentGateway();
 *   const r = await gw.submitTransaction({ walletId, amount, direction, reference });
 *   // r.centralTxId 形如 'dcepcn-xxxxxxxx'
 */

import { createHash, createHmac } from 'node:crypto';
import { logger as defaultLogger } from '../logger';
import {
  type CentralQueryResult,
  type CentralSubmitOptions,
  type CentralSubmitResult,
  type DcepTxStatus,
  DCEP_CENTRAL_API,
  DCEP_CENTRAL_API_KEY,
  DcepError,
  djb2,
  shortId,
} from './types';

// =============================================================================
// DcepPaymentGateway
// =============================================================================

export interface DcepPaymentGatewayOptions {
  apiKey?: string;
  endpoint?: string;
  logger?: typeof defaultLogger;
  now?: () => number;
  /** 关闭网络调用（默认 true：纯 mock） */
  mockMode?: boolean;
}

export class DcepPaymentGateway {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  private readonly mockMode: boolean;
  /** centralTxId → 状态（mock 持久化） */
  private readonly store: Map<string, CentralQueryResult> = new Map();

  constructor(opts: DcepPaymentGatewayOptions = {}) {
    this.apiKey = opts.apiKey ?? DCEP_CENTRAL_API_KEY;
    this.endpoint = opts.endpoint ?? DCEP_CENTRAL_API;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.mockMode = opts.mockMode ?? true;
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /**
   * 提交交易到央行
   */
  async submitTransaction(opts: CentralSubmitOptions): Promise<CentralSubmitResult> {
    if (!opts.walletId) {
      throw new DcepError('INVALID_WALLET', 'walletId is required');
    }
    if (!opts.amount || Number(opts.amount) <= 0) {
      throw new DcepError('INVALID_AMOUNT', 'amount must be positive');
    }
    if (!opts.reference) {
      throw new DcepError('INVALID_REFERENCE', 'reference is required');
    }
    if (this.mockMode) {
      return this.mockSubmit(opts);
    }
    // 真实实现：POST {endpoint}/transactions
    //   headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
    //   body: JSON.stringify(opts)
    // 这里仅示意
    this.logger.info(`[DCEP-GW] POST ${this.endpoint}/transactions`);
    return this.mockSubmit(opts);
  }

  /**
   * 查询央行交易状态
   */
  async queryTransaction(centralTxId: string): Promise<CentralQueryResult> {
    if (!centralTxId) {
      throw new DcepError('INVALID_TX_ID', 'centralTxId is required');
    }
    if (this.mockMode) {
      const r = this.store.get(centralTxId);
      if (r) return r;
      // 未找到：返回 rejected
      return {
        status: 'rejected',
        amount: '0',
        timestamp: this.now(),
      };
    }
    // 真实实现：GET {endpoint}/transactions/{id}
    this.logger.info(`[DCEP-GW] GET ${this.endpoint}/transactions/${centralTxId}`);
    return (
      this.store.get(centralTxId) ?? {
        status: 'rejected' as DcepTxStatus,
        amount: '0',
        timestamp: this.now(),
      }
    );
  }

  /**
   * 验签：HMAC-SHA256（演示）
   *
   * 真实环境应使用央行侧 SM2 签名 + SM3 摘要。
   */
  verifySignature(txData: string, signature: string): boolean {
    if (!txData || !signature) return false;
    const expected = createHmac('sha256', this.apiKey).update(txData).digest('hex');
    return expected === signature;
  }

  /**
   * 签名（演示）
   */
  sign(txData: string): string {
    return createHmac('sha256', this.apiKey).update(txData).digest('hex');
  }

  /**
   * 结算钱包余额（mock：返回 { balance }）
   *
   * 真实实现：调用央行清算接口，更新运营账户余额。
   */
  async settleAccount(walletId: string, amount: string): Promise<{ balance: string }> {
    if (!walletId) {
      throw new DcepError('INVALID_WALLET', 'walletId is required');
    }
    if (this.mockMode) {
      return { balance: amount };
    }
    this.logger.info(`[DCEP-GW] POST ${this.endpoint}/settle wallet=${walletId} amount=${amount}`);
    return { balance: amount };
  }

  /**
   * 健康检查
   */
  async ping(): Promise<{ ok: boolean; latencyMs: number; endpoint: string }> {
    const start = this.now();
    if (this.mockMode) {
      return { ok: true, latencyMs: 1, endpoint: this.endpoint };
    }
    return { ok: true, latencyMs: this.now() - start, endpoint: this.endpoint };
  }

  // -------------------------------------------------------------------------
  // 测试用 / mock 工具
  // -------------------------------------------------------------------------

  /** mock 模式：手动注入一笔央行侧交易（用于回放测试） */
  injectMockTransaction(centralTxId: string, status: DcepTxStatus, amount: string): void {
    this.store.set(centralTxId, { status, amount, timestamp: this.now() });
  }

  /** 清空 mock 存储 */
  reset(): void {
    this.store.clear();
  }

  /** 获取 endpoint（测试断言用） */
  getEndpoint(): string {
    return this.endpoint;
  }

  /** 获取 apiKey（测试断言用） */
  getApiKey(): string {
    return this.apiKey;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private mockSubmit(opts: CentralSubmitOptions): CentralSubmitResult {
    const ts = this.now();
    const id = shortId('dcepcn', `${opts.walletId}:${opts.amount}:${ts}:${Math.random()}`);
    const result: CentralSubmitResult = {
      centralTxId: id,
      status: 'submitted',
      timestamp: ts,
    };
    // 默认异步确认：mock 直接 confirmed
    this.store.set(id, { status: 'confirmed', amount: opts.amount, timestamp: ts });
    this.logger.debug(`[DCEP-GW] mock submit: ${id}, wallet=${opts.walletId}, amount=${opts.amount}, dir=${opts.direction}`);
    return result;
  }
}

export function createDcepPaymentGateway(opts?: DcepPaymentGatewayOptions): DcepPaymentGateway {
  return new DcepPaymentGateway(opts);
}

export default DcepPaymentGateway;
