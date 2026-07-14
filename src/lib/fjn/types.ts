/**
 * FJN 通用类型 + 业务编号生成器 + 状态机
 *
 * 设计原则：
 *  - 所有业务编号符合 H7 规范（前缀 + yyyymmdd + 6位序号）
 *  - 状态机基于白名单转移表，禁止隐式跳转
 *  - 通用类型：Result / PaginatedResult / 审计字段
 */

import { FjnError, FjnStateMachineError } from './errors';
import { FJN_BUSINESS_NO_PREFIX } from './constants';

// ============================================================
// 1. 业务编号生成器
// ============================================================

/**
 * 业务编号生成器
 *
 * 格式：<前缀><yyyymmdd><6位序号>
 * 示例：ORD20260701000001
 *
 * 序号生成策略：
 *  - 优先使用数据库 sequence（如 fjn_order_seq）
 *  - 退化使用时间戳末 6 位（精度足够单进程）
 *  - 真正生产环境应使用 Redis INCR / PostgreSQL sequence
 */
export class FjnBusinessNoGenerator {
  /** 生成业务编号 */
  static generate(prefix: keyof typeof FJN_BUSINESS_NO_PREFIX, sequence: number): string {
    const date = new Date();
    const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String(sequence).padStart(6, '0');
    return `${FJN_BUSINESS_NO_PREFIX[prefix]}${yyyymmdd}${seq}`;
  }

  /** 用户编号 */
  static userNo(sequence: number): string {
    return this.generate('USER', sequence);
  }

  /** 订单编号 */
  static orderNo(sequence: number): string {
    return this.generate('ORDER', sequence);
  }

  /** 支付单编号 */
  static paymentNo(sequence: number): string {
    return this.generate('PAYMENT', sequence);
  }

  /** 退款单编号 */
  static refundNo(sequence: number): string {
    return this.generate('REFUND', sequence);
  }

  /** 分账单编号 */
  static allocationNo(sequence: number): string {
    return this.generate('ALLOCATION', sequence);
  }

  /** 账本流水编号 */
  static ledgerNo(sequence: number): string {
    return this.generate('LEDGER', sequence);
  }

  /** 积分流水编号 */
  static pointsLedgerNo(sequence: number): string {
    return this.generate('POINTS_LEDGER', sequence);
  }

  /** tFJ369 流水编号 */
  static tpointsLedgerNo(sequence: number): string {
    return this.generate('TPOINTS_LEDGER', sequence);
  }

  /** 奖励编号 */
  static rewardNo(sequence: number): string {
    return this.generate('REWARD', sequence);
  }

  /** 结算编号 */
  static settlementNo(sequence: number): string {
    return this.generate('SETTLEMENT', sequence);
  }

  /** 审批编号 */
  static approvalNo(sequence: number): string {
    return this.generate('APPROVAL', sequence);
  }

  /** 风控事件编号 */
  static riskEventNo(sequence: number): string {
    return this.generate('RISK_EVENT', sequence);
  }

  /** 风控案件编号 */
  static riskCaseNo(sequence: number): string {
    return this.generate('RISK_CASE', sequence);
  }

  /** 链上交易编号 */
  static txNo(sequence: number): string {
    return this.generate('TX', sequence);
  }

  /** 商品编号 */
  static productNo(sequence: number): string {
    return this.generate('PRODUCT', sequence);
  }

  /** NFT 资产编号 */
  static nftNo(sequence: number): string {
    return this.generate('NFT', sequence);
  }

  /** 资金池编号 */
  static poolNo(sequence: number): string {
    return this.generate('POOL', sequence);
  }

  /** Merkle 根编号 */
  static merkleNo(sequence: number): string {
    return this.generate('MERKLE', sequence);
  }

  /** 操作日志编号 */
  static operationNo(sequence: number): string {
    return this.generate('OPERATION', sequence);
  }

  /** 审计日志编号 */
  static auditNo(sequence: number): string {
    return this.generate('AUDIT', sequence);
  }

  /** 发票编号 */
  static invoiceNo(sequence: number): string {
    return this.generate('INVOICE', sequence);
  }

  /** 税务记录编号 */
  static taxRecordNo(sequence: number): string {
    return this.generate('TAX_RECORD', sequence);
  }

  /** 报表编号 */
  static reportNo(sequence: number): string {
    return this.generate('REPORT', sequence);
  }

  /** 商户编号（DAppX Mall） */
  static merchantNo(sequence: number): string {
    return this.generate('MERCHANT', sequence);
  }

  /** 商城商品编号 */
  static mallProductNo(sequence: number): string {
    return this.generate('MALL_PRODUCT', sequence);
  }

  /** 商城订单编号 */
  static mallOrderNo(sequence: number): string {
    return this.generate('MALL_ORDER', sequence);
  }

  /** 商城优惠券编号 */
  static mallCouponNo(sequence: number): string {
    return this.generate('MALL_COUPON', sequence);
  }

  /** 商城结算编号 */
  static mallSettlementNo(sequence: number): string {
    return this.generate('MALL_SETTLEMENT', sequence);
  }

  /**
   * 从业务编号解析日期
   * @returns Date or null
   */
  static parseDate(businessNo: string): Date | null {
    // 提取 yyyymmdd 部分（跳过前缀，长度可能 3）
    const match = businessNo.match(/^[A-Z]+(\d{8})\d{6}$/);
    if (!match) return null;
    const yyyymmdd = match[1];
    const y = parseInt(yyyymmdd.substring(0, 4), 10);
    const m = parseInt(yyyymmdd.substring(4, 6), 10) - 1;
    const d = parseInt(yyyymmdd.substring(6, 8), 10);
    return new Date(y, m, d);
  }
}

// ============================================================
// 2. 状态机
// ============================================================

/**
 * 创建状态机
 *
 * 用法：
 *   const orderSM = createStateMachine({
 *     initial: 'draft',
 *     transitions: {
 *       draft: ['pending_payment', 'cancelled'],
 *       pending_payment: ['paid', 'cancelled', 'expired'],
 *       // ...
 *     },
 *   });
 *
 *   orderSM.canTransition('draft', 'pending_payment'); // true
 *   orderSM.assertTransition('draft', 'paid'); // throw FjnStateMachineError
 *   orderSM.nextStates('draft'); // ['pending_payment', 'cancelled']
 */
export interface StateMachineConfig<S extends string> {
  initial: S;
  transitions: Record<S, readonly S[]>;
}

export class FjnStateMachine<S extends string> {
  constructor(private readonly config: StateMachineConfig<S>) {}

  get initial(): S {
    return this.config.initial;
  }

  /** 判断转移是否合法 */
  canTransition(from: S, to: S): boolean {
    const allowed = this.config.transitions[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  /** 强制转移（非法时抛错） */
  assertTransition(from: S, to: S): void {
    if (!this.canTransition(from, to)) {
      throw new FjnStateMachineError(
        `非法状态转移: ${from} -> ${to}`,
        {
          from,
          to,
          allowed: this.config.transitions[from] ?? [],
        }
      );
    }
  }

  /** 列出 from 的所有合法目标状态 */
  nextStates(from: S): readonly S[] {
    return this.config.transitions[from] ?? [];
  }

  /** 列出所有状态 */
  allStates(): readonly S[] {
    return Object.keys(this.config.transitions) as S[];
  }
}

export function createStateMachine<S extends string>(config: StateMachineConfig<S>): FjnStateMachine<S> {
  return new FjnStateMachine(config);
}

// ============================================================
// 3. 通用类型
// ============================================================

/** 业务结果包装 */
export interface FjnResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}

/** 成功结果 */
export function ok<T>(data: T): FjnResult<T> {
  return { success: true, data };
}

/** 失败结果 */
export function fail<T = unknown>(code: string, message: string, context?: Record<string, unknown>): FjnResult<T> {
  return { success: false, error: { code, message, context } };
}

/** 分页输入 */
export interface FjnPaginationInput {
  page?: number;     // 1-based
  pageSize?: number; // 默认 20，最大 100
}

/** 列表查询输入 */
export interface FjnListQuery extends FjnPaginationInput {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/** 分页结果 */
export interface FjnPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 创建分页结果 */
export function paginate<T>(items: T[], total: number, query: FjnPaginationInput): FjnPaginatedResult<T> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** 审计字段（与 H7 通用字段一致） */
export interface FjnAuditedFields {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  version?: number;
  metadata?: Record<string, unknown> | null;
}

/** 软删除字段 */
export interface FjnSoftDeletable {
  deletedAt?: Date | null;
}

/** 业务状态字段 */
export interface FjnStatusField {
  status: string;
}

// ============================================================
// 4. 工具类型
// ============================================================

/** 提取 Promise 的 resolve 类型 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/** 深度只读 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 部分字段必填 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** 部分字段可选 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
