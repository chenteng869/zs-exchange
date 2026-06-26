/**
 * OTC / 大宗交易 - 类型定义 & 常量
 *
 * 模块组成：
 *  - types                 核心类型 (Rfq / OtcQuote / OtcTrade / OtcMaker / OtcSalesperson / Commission / Stats)
 *  - market-maker-registry 机构做市商管理（注册 / 审批 / 暂停 / 排名）
 *  - rfq-engine            询价引擎（创建 / 邀请 / 报价 / 选择 / 接受）
 *  - price-lock            锁价服务（锁定 / 释放 / 偏离监控）
 *  - settlement-engine     结算引擎（链上 / 法币 / 稳定币）
 *  - commission-engine     佣金引擎（规则 / 计算 / 结算 / 报表）
 *  - otc-engine            业务层（RFQ 全流程 / 撮合器人 / 事件订阅）
 *
 * 设计原则：
 *  - 不引外部依赖，复用 matching/decimal
 *  - 金额统一用 string
 *  - 事件订阅采用简单回调 Set
 *  - 状态机：rfq → quoting → quoted → accepted → locked → settling → completed
 */

import { decMul } from '@/lib/matching/decimal';

// =============================================================================
// 常量
// =============================================================================

/** RFQ 默认有效期 5 分钟。 */
export const OTC_RFQ_DEFAULT_TTL_SEC = 300;

/** 报价默认有效期 1 分钟。 */
export const OTC_QUOTE_DEFAULT_TTL_SEC = 60;

/** 锁价默认时长 10 分钟。 */
export const OTC_PRICE_LOCK_DURATION_SEC = 600;

/** 价格偏离报警 0.5%。 */
export const OTC_PRICE_DEVIATION_WARNING = 0.005;

/** 价格偏离临界 1%（强制重新报价）。 */
export const OTC_PRICE_DEVIATION_CRITICAL = 0.01;

/** 最小单笔规模（USD 等值）= 10 万。 */
export const OTC_MIN_TRADE_SIZE_USD = '100000';

/** 链上结算确认数（≥6）。 */
export const OTC_SETTLEMENT_CONFIRMATIONS = 6;

/** OTC 佣金费率（sales / maker / platform）。 */
export const OTC_COMMISSION_RATES: Record<'sales' | 'maker' | 'platform', number> = {
  sales: 0.0005,    // 0.05%
  maker: 0.001,     // 0.10%
  platform: 0.0005, // 0.05%
};

/** 默认结算确认超时（毫秒）。 */
export const OTC_SETTLEMENT_TIMEOUT_MS = 60 * 60_000;

/** RFQ 最大邀请做市商数。 */
export const OTC_RFQ_MAX_INVITED_MAKERS = 20;

/** 报价最大有效期（毫秒 5 分钟）。 */
export const OTC_QUOTE_MAX_TTL_SEC = 300;

// =============================================================================
// 基础枚举
// =============================================================================

/** OTC 方向：买 / 卖。 */
export type OtcSide = 'buy' | 'sell';

/** OTC 状态机。 */
export type OtcStatus =
  | 'rfq'          // 询价已创建
  | 'quoting'      // 询价中（已邀请做市商）
  | 'quoted'       // 已收到报价
  | 'accepted'     // 已接受报价
  | 'locked'       // 价格已锁定
  | 'settling'     // 结算中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'expired'      // 已过期
  | 'failed';      // 失败

/** 结算方式。 */
export type SettlementType = 'onchain' | 'fiat' | 'stablecoin';

/** 报价状态。 */
export type QuoteStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'rejected'
  | 'withdrawn'
  | 'accepted';

// =============================================================================
// 资产
// =============================================================================

/**
 * OTC 资产定义。
 *  - symbol       资产代号 'BTC' / 'ETH' / 'USDT'
 *  - name         显示名
 *  - decimals     精度
 *  - networks     支持的网络（结算用）
 *  - minAmount / maxAmount  最小 / 最大单笔数量
 */
export interface OtcAsset {
  symbol: string;
  name: string;
  decimals: number;
  networks: string[];
  minAmount: string;
  maxAmount: string;
}

// =============================================================================
// RFQ 询价
// =============================================================================

/**
 * RFQ 询价单。
 *  - id              询价 ID
 *  - clientId        客户（机构）ID
 *  - clientUserId    下单用户 ID
 *  - side            buy / sell
 *  - baseAsset       基础币 'BTC'
 *  - quoteAsset      计价币 'USDT'
 *  - baseAmount      数量（基础币）
 *  - quoteAmount     反向数量（计价币，可选）
 *  - settlementType  结算方式
 *  - settlementNetwork 结算网络
 *  - status          状态
 *  - isPrivate       隐私询价（仅邀请的做市商可见）
 *  - invitedMakers   邀请的做市商 ID 列表
 *  - quotes          关联的报价 ID 列表
 *  - acceptedQuoteId 接受的报价 ID
 *  - expiresAt       询价过期时间
 *  - createdAt       创建时间
 *  - acceptedAt      接受时间
 *  - completedAt     完成时间
 *  - notes           备注
 */
export interface Rfq {
  id: string;
  clientId: string;
  clientUserId: string;
  side: OtcSide;
  baseAsset: string;
  quoteAsset: string;
  baseAmount: string;
  quoteAmount?: string;
  settlementType: SettlementType;
  settlementNetwork?: string;
  status: OtcStatus;
  isPrivate: boolean;
  invitedMakers: string[];
  quotes: string[];
  acceptedQuoteId?: string;
  expiresAt: number;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
  notes?: string;
}

// =============================================================================
// 报价
// =============================================================================

/**
 * OTC 报价。
 *  - id            报价 ID
 *  - rfqId         关联询价
 *  - makerId       做市商 ID
 *  - makerName     做市商名称
 *  - side          报价方方向（与询价方相反）
 *  - baseAsset / quoteAsset
 *  - price         报价价格
 *  - baseAmount    数量
 *  - quoteAmount   计价金额
 *  - spread        相对中价偏离
 *  - validUntil    报价过期时间
 *  - settlementType 结算方式
 *  - settlementTime 预计结算时间
 *  - status        报价状态
 *  - createdAt     创建时间
 */
export interface OtcQuote {
  id: string;
  rfqId: string;
  makerId: string;
  makerName: string;
  side: OtcSide;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  baseAmount: string;
  quoteAmount: string;
  spread: number;
  validUntil: number;
  settlementType: SettlementType;
  settlementTime: number;
  status: QuoteStatus;
  createdAt: number;
}

// =============================================================================
// 成交
// =============================================================================

/**
 * OTC 成交。
 *  - id             成交 ID
 *  - rfqId          关联询价
 *  - quoteId        接受的报价
 *  - clientId / makerId  客户 / 做市商
 *  - baseAsset / quoteAsset
 *  - baseAmount / quoteAmount
 *  - price          成交价
 *  - settlementType
 *  - status         状态
 *  - clientAddress / makerAddress 链上地址
 *  - clientTxHash / makerTxHash   链上交易哈希
 *  - fiatReference  法币流水号
 *  - lockedPrice / lockedAt       锁价信息
 *  - priceDeviation 结算时价格偏离
 *  - createdAt / completedAt
 */
export interface OtcTrade {
  id: string;
  rfqId: string;
  quoteId: string;
  clientId: string;
  makerId: string;
  baseAsset: string;
  quoteAsset: string;
  baseAmount: string;
  quoteAmount: string;
  price: string;
  settlementType: SettlementType;
  settlementNetwork?: string;
  status: OtcStatus;
  clientAddress?: string;
  makerAddress?: string;
  clientTxHash?: string;
  makerTxHash?: string;
  fiatReference?: string;
  lockedPrice: string;
  lockedAt: number;
  priceDeviation: number;
  createdAt: number;
  completedAt?: number;
}

// =============================================================================
// 做市商
// =============================================================================

/** 做市商等级。 */
export type OtcMakerTier = 'tier1' | 'tier2' | 'tier3';

/** 做市商状态。 */
export type OtcMakerStatus = 'active' | 'suspended' | 'banned';

/**
 * 机构做市商。
 *  - id / name           内部 ID / 显示名 'Galaxy Digital'
 *  - tier                等级
 *  - status              状态
 *  - supportedAssets     支持的资产列表
 *  - minTradeSize / maxTradeSize 最小 / 最大单笔
 *  - successRate         0-1 成功率
 *  - totalVolume         累计成交（USDT 等值）
 *  - totalTrades         累计笔数
 *  - rating              0-5 评级
 *  - contactEmail        联系邮箱
 *  - joinedAt            加入时间
 */
export interface OtcMaker {
  id: string;
  name: string;
  tier: OtcMakerTier;
  status: OtcMakerStatus;
  supportedAssets: string[];
  minTradeSize: string;
  maxTradeSize: string;
  successRate: number;
  totalVolume: string;
  totalTrades: number;
  rating: number;
  contactEmail: string;
  joinedAt: number;
  /** 暂停原因。 */
  suspendReason?: string;
}

// =============================================================================
// 撮合器人 / 销售经理
// =============================================================================

/**
 * 撮合器人（销售经理）。
 *  - id / userId        内部 ID / 关联 user
 *  - name               显示名
 *  - totalClients       累计客户数
 *  - totalVolume        累计成交（USDT 等值）
 *  - totalCommission    累计佣金
 *  - rating             评级
 *  - isActive           在职状态
 */
export interface OtcSalesperson {
  id: string;
  userId: string;
  name: string;
  totalClients: number;
  totalVolume: string;
  totalCommission: string;
  rating: number;
  isActive: boolean;
}

// =============================================================================
// 佣金
// =============================================================================

/** 佣金类型。 */
export type OtcCommissionType = 'sales' | 'maker' | 'platform';

/** 佣金状态。 */
export type OtcCommissionStatus = 'pending' | 'paid';

/**
 * 佣金记录。
 *  - id / tradeId         内部 ID / 关联成交
 *  - salespersonId        撮合器人
 *  - makerId / clientId   做市商 / 客户
 *  - type                 佣金类型
 *  - baseAmount / rate / amount 基数 / 费率 / 金额
 *  - status               状态
 *  - createdAt            时间
 */
export interface OtcCommission {
  id: string;
  tradeId: string;
  salespersonId?: string;
  makerId: string;
  clientId: string;
  type: OtcCommissionType;
  baseAmount: string;
  rate: number;
  amount: string;
  status: OtcCommissionStatus;
  createdAt: number;
}

// =============================================================================
// 佣金规则
// =============================================================================

/**
 * 佣金规则。
 *  - id / makerId / salespersonId  内部 ID / 做市商 / 撮合器人（可空表示全局）
 *  - type                         佣金类型
 *  - rate                         费率（0.001 = 0.1%）
 *  - isActive                     是否启用
 */
export interface CommissionRule {
  id: string;
  makerId?: string;
  salespersonId?: string;
  type: OtcCommissionType;
  rate: number;
  isActive: boolean;
  createdAt: number;
}

// =============================================================================
// 锁价
// =============================================================================

/**
 * 价格锁。
 *  - lockId      锁 ID
 *  - tradeId     关联成交
 *  - price       锁定价格
 *  - expiresAt   到期时间
 *  - createdAt   创建时间
 */
export interface PriceLock {
  lockId: string;
  tradeId: string;
  price: string;
  expiresAt: number;
  createdAt: number;
}

/** 价格偏离检查结果。 */
export interface PriceDeviationResult {
  deviation: number;       // 偏离绝对值
  level: 'normal' | 'warning' | 'critical';
  shouldSettle: boolean;
  shouldRequote: boolean;
  message?: string;
}

// =============================================================================
// 统计
// =============================================================================

/**
 * OTC 业绩统计。
 *  - userId        主体（客户 / 撮合器人 / 做市商）
 *  - period        区间
 *  - totalTrades   笔数
 *  - totalVolume   累计成交
 *  - totalCommission 累计佣金
 *  - averageSize   平均单笔
 *  - bestPrice / worstPrice  最佳 / 最差成交价
 */
export interface OtcStats {
  userId: string;
  period: { start: number; end: number };
  totalTrades: number;
  totalVolume: string;
  totalCommission: string;
  averageSize: string;
  bestPrice: string;
  worstPrice: string;
}

// =============================================================================
// 事件载荷
// =============================================================================

/** RFQ 创建事件。 */
export interface OtcRfqCreatedEvent {
  rfq: Rfq;
  timestamp: number;
}

/** 报价事件。 */
export interface OtcQuoteReceivedEvent {
  rfqId: string;
  quote: OtcQuote;
  timestamp: number;
}

/** 报价接受事件。 */
export interface OtcQuoteAcceptedEvent {
  rfq: Rfq;
  quote: OtcQuote;
  trade: OtcTrade;
  timestamp: number;
}

/** 成交完成事件。 */
export interface OtcTradeCompletedEvent {
  trade: OtcTrade;
  timestamp: number;
}

/** 价格偏离事件。 */
export interface OtcPriceDeviationEvent {
  tradeId: string;
  lockedPrice: string;
  currentPrice: string;
  deviation: number;
  level: 'warning' | 'critical';
  timestamp: number;
}

// =============================================================================
// 通用工具类型
// =============================================================================

export type Unsubscribe = () => void;

// =============================================================================
// 工具函数
// =============================================================================

/** 计算价格偏离绝对值 = |current - locked| / locked。 */
export function calcPriceDeviation(locked: string, current: string): number {
  const lockedN = Number(locked);
  const currentN = Number(current);
  if (lockedN === 0) return 0;
  return Math.abs(currentN - lockedN) / lockedN;
}

/** 按佣金费率计算佣金（baseAmount × rate，截断 8 位）。 */
export function computeCommissionAmount(baseAmount: string, rate: number): string {
  if (!baseAmount || rate <= 0) return '0';
  return decMul(baseAmount, String(rate));
}
