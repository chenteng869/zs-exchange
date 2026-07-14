/**
 * FJN 业务常量
 *
 * 集中管理：
 *  - 业务编号前缀（ORD/PAY/LED/RWD/APR/...）
 *  - 业务类型枚举（商品/订单/支付/...）
 *  - 状态机常量
 *  - 默认规则比例（与 H6 文档保持一致）
 *  - 国家/货币/KYC
 *
 * 设计原则：使用字符串枚举而非 TypeScript enum，便于跨服务、跨语言传递
 */

// ============================================================
// 1. 业务编号前缀
// ============================================================

/** 业务编号前缀映射（按 H7 规范） */
export const FJN_BUSINESS_NO_PREFIX = {
  USER: 'USR',           // 用户
  ORDER: 'ORD',          // 订单
  PAYMENT: 'PAY',        // 支付单
  REFUND: 'RFN',         // 退款单
  ALLOCATION: 'ALC',     // 分账单
  LEDGER: 'LED',         // 账本流水
  POINTS_LEDGER: 'PNT',  // 积分流水
  TPOINTS_LEDGER: 'TPT', // tFJ369 流水
  REWARD: 'RWD',         // 奖励
  SETTLEMENT: 'STL',     // 结算
  APPROVAL: 'APR',       // 审批
  RISK_EVENT: 'RSK',     // 风控事件
  RISK_CASE: 'RSC',      // 风控案件
  TX: 'TX',              // 链上交易
  PRODUCT: 'PRD',        // 商品
  NFT: 'NFT',            // NFT 资产
  POOL: 'POL',           // 资金池
  MERKLE: 'MRK',         // Merkle 根
  OPERATION: 'OPL',      // 操作日志
  AUDIT: 'AUD',          // 审计日志
  INVOICE: 'INV',        // 发票
  TAX_RECORD: 'TAX',     // 税务记录
  REPORT: 'RPT',         // 报表
  // DAppX Mall（FJN 域内商城）
  MERCHANT: 'MCH',       // 商户
  MALL_PRODUCT: 'MPR',   // 商城商品
  MALL_ORDER: 'MOR',     // 商城订单
  MALL_COUPON: 'MCP',    // 商城优惠券
  MALL_SETTLEMENT: 'MSL',// 商城结算
} as const;

export type FjnBusinessNoPrefix = (typeof FJN_BUSINESS_NO_PREFIX)[keyof typeof FJN_BUSINESS_NO_PREFIX];

// ============================================================
// 2. 商品类型
// ============================================================

/** 商品类型 - 与 H7 product.product_type 字段对应 */
export const FJN_PRODUCT_TYPES = {
  WINE_369: 'wine_369',         // 福建老酒 369 经典款
  AEP_1: 'aep_1',               // 算力包 1
  AEP_2: 'aep_2',               // 算力包 2
  AEP_3: 'aep_3',               // 算力包 3
  AEP_4: 'aep_4',               // 算力包 4
  AEP_5: 'aep_5',               // 算力包 5
  MALL_GOODS: 'mall_goods',     // 商城商品
  NFT_UPGRADE: 'nft_upgrade',   // NFT 升级
  AI_PACKAGE: 'ai_package',     // AI 套餐
  VIRTUAL_POINTS: 'virtual_points', // 虚拟积分
  CORPORATE: 'corporate',       // 企业服务
  EVENT_TICKET: 'event_ticket', // 活动门票
} as const;

export type FjnProductType = (typeof FJN_PRODUCT_TYPES)[keyof typeof FJN_PRODUCT_TYPES];

/** 商品状态 */
export const FJN_PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD_OUT: 'sold_out',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type FjnProductStatus = (typeof FJN_PRODUCT_STATUS)[keyof typeof FJN_PRODUCT_STATUS];

/** 商品权益类型 */
export const FJN_BENEFIT_TYPES = {
  PHYSICAL_WINE: 'physical_wine',         // 实物老酒
  WINEPASS_NFT: 'winepass_nft',           // WinePass NFT
  FJ369_POINTS: 'fj369_points',           // FJ369 积分
  CFJ369: 'cfj369',                       // 贡献积分
  TFJ369_QUOTA: 'tfj369_quota',           // tFJ369 转换额度
  ECO_POWER: 'eco_power',                 // 生态算力
  DAPPX_COUPON: 'dappx_coupon',           // DAppX 商城券
  AI_QUOTA: 'ai_quota',                   // AI 配额
  VIRTUAL_POINTS: 'virtual_points',       // 虚拟积分
  GAMING: 'gaming',                       // 游戏资格
  RELEASE_QUOTA: 'release_quota',         // 释放额度
  NODE_QUOTA: 'node_quota',               // 节点额度
  MEMBERSHIP: 'membership',               // 会员等级
} as const;

export type FjnBenefitType = (typeof FJN_BENEFIT_TYPES)[keyof typeof FJN_BENEFIT_TYPES];

/** 商品地区规则状态 */
export const FJN_REGION_STATUS = {
  ALLOWED: 'allowed',
  RESTRICTED: 'restricted',
  BLOCKED: 'blocked',
  MANUAL_REVIEW: 'manual_review',
} as const;

export type FjnRegionStatus = (typeof FJN_REGION_STATUS)[keyof typeof FJN_REGION_STATUS];

// ============================================================
// 3. 订单状态机
// ============================================================

/** 订单主状态 */
export const FJN_ORDER_STATUS = {
  DRAFT: 'draft',                       // 草稿
  PENDING_PAYMENT: 'pending_payment',   // 待支付
  PAID: 'paid',                         // 已支付
  PROCESSING: 'processing',             // 处理中
  FULFILLING: 'fulfilling',             // 履约中
  COMPLETED: 'completed',               // 已完成
  CANCELLED: 'cancelled',               // 已取消
  REFUNDING: 'refunding',               // 退款中
  REFUNDED: 'refunded',                 // 已退款
  FAILED: 'failed',                     // 失败
  EXPIRED: 'expired',                   // 已过期
} as const;

export type FjnOrderStatus = (typeof FJN_ORDER_STATUS)[keyof typeof FJN_ORDER_STATUS];

/** 订单状态流转（合法转移） */
export const FJN_ORDER_STATUS_FLOW: Record<FjnOrderStatus, readonly FjnOrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled', 'expired'],
  paid: ['processing', 'refunding', 'cancelled'],
  processing: ['fulfilling', 'refunding', 'failed'],
  fulfilling: ['completed', 'refunding', 'failed'],
  completed: ['refunding'],
  cancelled: [],
  refunding: ['refunded', 'completed'],
  refunded: [],
  failed: [],
  expired: [],
} as const;

/** 支付状态 */
export const FJN_PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

export type FjnPaymentStatus = (typeof FJN_PAYMENT_STATUS)[keyof typeof FJN_PAYMENT_STATUS];

/** 退款状态 */
export const FJN_REFUND_STATUS = {
  NONE: 'none',
  REQUESTED: 'requested',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  REJECTED: 'rejected',
  FAILED: 'failed',
} as const;

export type FjnRefundStatus = (typeof FJN_REFUND_STATUS)[keyof typeof FJN_REFUND_STATUS];

/** 支付方式 */
export const FJN_PAYMENT_METHODS = {
  USDT: 'usdt',
  BANK_CARD: 'bank_card',
  CREDIT_CARD: 'credit_card',
  THIRD_PARTY: 'third_party',
  PLATFORM_BALANCE: 'platform_balance',
  FJ369_TOKEN: 'fj369_token',
  TFJ369: 'tfj369',
  DAPPX_CREDIT: 'dappx_credit',
  MANUAL: 'manual',
} as const;

export type FjnPaymentMethod = (typeof FJN_PAYMENT_METHODS)[keyof typeof FJN_PAYMENT_METHODS];

// ============================================================
// 4. 资产类型
// ============================================================

/** 资产类型 - 与 H7 points/tpoints/nft/power 域对应 */
export const FJN_ASSET_TYPES = {
  FJ369_POINTS: 'fj369_points',   // FJ369 权益积分
  CFJ369: 'cfj369',               // 贡献积分
  TFJ369: 'tfj369',               // 可交易积分
  FJ369_TOKEN: 'fj369_token',     // FJ369 Token
  NFT: 'nft',                     // NFT 资产
  ECO_POWER: 'eco_power',         // 生态算力
  USDT: 'usdt',                   // 稳定币
  SOL: 'sol',                     // SOL
  CASH: 'cash',                   // 法币现金
  CREDIT: 'credit',               // 信用额度
} as const;

export type FjnAssetType = (typeof FJN_ASSET_TYPES)[keyof typeof FJN_ASSET_TYPES];

/** 算力类型 */
export const FJN_POWER_TYPES = {
  BASE: 'base',                 // 基础算力
  CONSUME: 'consume',           // 消费算力
  MALL: 'mall',                 // 商城算力
  NFT: 'nft',                   // NFT 算力
  VIRTUAL_POINTS: 'virtual_points',
  GAMING: 'gaming',
  AI: 'ai',
  CORPORATE: 'corporate',
  COMMUNITY: 'community',
  TFJ369_HOLD: 'tfj369_hold',
  TFJ369_LOCK: 'tfj369_lock',
  NODE: 'node',
} as const;

export type FjnPowerType = (typeof FJN_POWER_TYPES)[keyof typeof FJN_POWER_TYPES];

// ============================================================
// 5. 分账池
// ============================================================

/** 分账池类型 - 与 H6 Revenue Domain 对应 */
export const FJN_POOL_TYPES = {
  WINE_COST: 'wine_cost_pool',           // 酒成本池 40%
  MARKET_ECOSYSTEM: 'market_ecosystem_pool', // 市场生态池 30%
  COMPANY: 'company_pool',               // 公司池 30%
  TAX: 'tax_pool',                       // 税费池
  RESERVE: 'reserve_pool',               // 储备池
} as const;

export type FjnPoolType = (typeof FJN_POOL_TYPES)[keyof typeof FJN_POOL_TYPES];

/** 默认分账比例（与 H6 一致：369 经典款 40/30/30） */
export const FJN_DEFAULT_REVENUE_RATIOS: Record<string, string> = {
  [FJN_POOL_TYPES.WINE_COST]: '0.400000000000000000',
  [FJN_POOL_TYPES.MARKET_ECOSYSTEM]: '0.300000000000000000',
  [FJN_POOL_TYPES.COMPANY]: '0.300000000000000000',
};

/** 分账单状态 */
export const FJN_ALLOCATION_STATUS = {
  CALCULATED: 'calculated',
  APPROVED: 'approved',
  POSTED: 'posted',
  REVERSED: 'reversed',
  FAILED: 'failed',
} as const;

export type FjnAllocationStatus = (typeof FJN_ALLOCATION_STATUS)[keyof typeof FJN_ALLOCATION_STATUS];

// ============================================================
// 6. 奖励比例
// ============================================================

/** 推荐奖励：10% */
export const FJN_DEFAULT_REWARD_RATIOS = {
  REFERRAL_L1: '0.100000000000000000',  // 直推 10%
  TEAM_L1: '0.050000000000000000',      // 团队一代 5%
  TEAM_L2: '0.030000000000000000',      // 团队二代 3%
  TEAM_L3: '0.020000000000000000',      // 团队三代 2%
  NODE_CITY: '0.030000000000000000',    // 城市节点 3%
  NODE_REGION: '0.030000000000000000',  // 区域节点 3%
  NODE_COUNTRY: '0.020000000000000000', // 国家节点 2%
  NODE_GLOBAL: '0.020000000000000000',  // 全球节点 2%
} as const;

// ============================================================
// 7. 风控
// ============================================================

/** 风控事件类型 */
export const FJN_RISK_EVENT_TYPES = {
  LARGE_ORDER: 'large_order',
  FREQUENT_ORDER: 'frequent_order',
  ABNORMAL_DEVICE: 'abnormal_device',
  BLACKLIST_HIT: 'blacklist_hit',
  KYC_EXPIRED: 'kyc_expired',
  REGION_RESTRICTED: 'region_restricted',
  REFUND_FREQUENT: 'refund_frequent',
  DEVICE_FINGERPRINT_CONFLICT: 'device_fingerprint_conflict',
  SUSPICIOUS_REFERRAL: 'suspicious_referral',
  CIRCULAR_REFERRAL: 'circular_referral',
} as const;

export type FjnRiskEventType = (typeof FJN_RISK_EVENT_TYPES)[keyof typeof FJN_RISK_EVENT_TYPES];

/** 风控事件等级 */
export const FJN_RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FjnRiskLevel = (typeof FJN_RISK_LEVELS)[keyof typeof FJN_RISK_LEVELS];

/** 风控动作 */
export const FJN_RISK_ACTIONS = {
  ALLOW: 'allow',
  CHALLENGE: 'challenge',
  REVIEW: 'review',
  RESTRICT: 'restrict',
  BLOCK: 'block',
  FREEZE: 'freeze',
} as const;

export type FjnRiskAction = (typeof FJN_RISK_ACTIONS)[keyof typeof FJN_RISK_ACTIONS];

// ============================================================
// 8. 审批
// ============================================================

/** 审批状态 */
export const FJN_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  EXECUTING: 'executing',
  EXECUTED: 'executed',
  FAILED: 'failed',
} as const;

export type FjnApprovalStatus = (typeof FJN_APPROVAL_STATUS)[keyof typeof FJN_APPROVAL_STATUS];

/** 审批类型 */
export const FJN_APPROVAL_TYPES = {
  PRODUCT_PUBLISH: 'product_publish',
  PRICE_CHANGE: 'price_change',
  RULE_CHANGE: 'rule_change',
  REFUND_OVER: 'refund_over',
  POINTS_ADJUST: 'points_adjust',
  RISK_OVERRIDE: 'risk_override',
  MANUAL_SETTLEMENT: 'manual_settlement',
  BLACKLIST_ADD: 'blacklist_add',
  BLACKLIST_REMOVE: 'blacklist_remove',
  WITHDRAWAL: 'withdrawal',
  NFT_UPGRADE: 'nft_upgrade',
  NODE_REGISTER: 'node_register',
  MERCHANT_REGISTER: 'merchant_register',
} as const;

export type FjnApprovalType = (typeof FJN_APPROVAL_TYPES)[keyof typeof FJN_APPROVAL_TYPES];

/** 审批风险等级 */
export const FJN_APPROVAL_RISK_LEVEL = {
  L1: 'L1',  // 主管
  L2: 'L2',  // 经理
  L3: 'L3',  // 总监
  L4: 'L4',  // 财务/风控官
  L5: 'L5',  // CEO
} as const;

export type FjnApprovalRiskLevel = (typeof FJN_APPROVAL_RISK_LEVEL)[keyof typeof FJN_APPROVAL_RISK_LEVEL];

// ============================================================
// 9. 节点 / 团队
// ============================================================

/** 节点等级 */
export const FJN_NODE_LEVELS = {
  CITY: 'city',
  REGION: 'region',
  COUNTRY: 'country',
  GLOBAL: 'global',
} as const;

export type FjnNodeLevel = (typeof FJN_NODE_LEVELS)[keyof typeof FJN_NODE_LEVELS];

/** 团队层级 */
export const FJN_TEAM_LEVELS = {
  L1: 1,  // 一代（直推）
  L2: 2,  // 二代
  L3: 3,  // 三代
} as const;

export type FjnTeamLevel = (typeof FJN_TEAM_LEVELS)[keyof typeof FJN_TEAM_LEVELS];

/** 节点状态 */
export const FJN_NODE_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
} as const;

export type FjnNodeStatus = (typeof FJN_NODE_STATUS)[keyof typeof FJN_NODE_STATUS];

// ============================================================
// 10. NFT
// ============================================================

/** NFT 等级 */
export const FJN_NFT_LEVELS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
  GENESIS: 'genesis',
} as const;

export type FjnNftLevel = (typeof FJN_NFT_LEVELS)[keyof typeof FJN_NFT_LEVELS];

/** NFT 状态 */
export const FJN_NFT_STATUS = {
  PENDING_MINT: 'pending_mint',
  MINTED: 'minted',
  ACTIVE: 'active',
  FROZEN: 'frozen',
  BURNED: 'burned',
  TRANSFERRING: 'transferring',
} as const;

export type FjnNftStatus = (typeof FJN_NFT_STATUS)[keyof typeof FJN_NFT_STATUS];

/** NFT 系列 */
export const FJN_NFT_COLLECTION_TYPES = {
  WINEPASS: 'winepass',
  ECO_POWER_PASS: 'eco_power_pass',
  CLUB: 'club',
  GENESIS: 'genesis',
  CUSTOM: 'custom',
} as const;

export type FjnNftCollectionType = (typeof FJN_NFT_COLLECTION_TYPES)[keyof typeof FJN_NFT_COLLECTION_TYPES];

// ============================================================
// 11. 释放
// ============================================================

/** 释放状态 */
export const FJN_RELEASE_STATUS = {
  PENDING: 'pending',
  CALCULATED: 'calculated',
  CLAIMABLE: 'claimable',
  CLAIMING: 'claiming',
  CLAIMED: 'claimed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type FjnReleaseStatus = (typeof FJN_RELEASE_STATUS)[keyof typeof FJN_RELEASE_STATUS];

/** 释放源 */
export const FJN_RELEASE_SOURCES = {
  TFJ369: 'tfj369',
  NFT: 'nft',
  POWER: 'power',
  NODE: 'node',
  MERCHANT: 'merchant',
} as const;

export type FjnReleaseSource = (typeof FJN_RELEASE_SOURCES)[keyof typeof FJN_RELEASE_SOURCES];

// ============================================================
// 12. 商城
// ============================================================

/** 商城订单状态（与 schema fjn_mall_orders.status 注释一致 14 态） */
export const FJN_MALL_ORDER_STATUS = {
  CREATED: 'created',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  RISK_CHECKING: 'risk_checking',
  CONFIRMED: 'confirmed',
  FULFILLING: 'fulfilling',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  REFUND_REQUESTED: 'refund_requested',
  RETURN_REQUESTED: 'return_requested',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  RISK_HOLD: 'risk_hold',
} as const;

export type FjnMallOrderStatus = (typeof FJN_MALL_ORDER_STATUS)[keyof typeof FJN_MALL_ORDER_STATUS];

/** 商户状态（与 schema fjn_merchants.status 注释一致 7 态） */
export const FJN_MERCHANT_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  RESTRICTED: 'restricted',
  SUSPENDED: 'suspended',
  BLACKLISTED: 'blacklisted',
  CLOSED: 'closed',
} as const;

export type FjnMerchantStatus = (typeof FJN_MERCHANT_STATUS)[keyof typeof FJN_MERCHANT_STATUS];

/** 商城商品状态（与 schema fjn_mall_products.status 配合 6 态） */
export const FJN_MALL_PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  SOLD_OUT: 'sold_out',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type FjnMallProductStatus = (typeof FJN_MALL_PRODUCT_STATUS)[keyof typeof FJN_MALL_PRODUCT_STATUS];

/** 优惠券状态 */
export const FJN_MALL_COUPON_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
} as const;

export type FjnMallCouponStatus = (typeof FJN_MALL_COUPON_STATUS)[keyof typeof FJN_MALL_COUPON_STATUS];

/** 商家结算状态（与 schema fjn_mall_settlements.status 注释一致 4 态） */
export const FJN_MALL_SETTLEMENT_STATUS = {
  CREATED: 'created',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type FjnMallSettlementStatus =
  (typeof FJN_MALL_SETTLEMENT_STATUS)[keyof typeof FJN_MALL_SETTLEMENT_STATUS];

/** 商城支付方式 */
export const FJN_MALL_PAYMENT_METHOD = {
  SOLANA_PAY: 'solana_pay',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  TFJ369: 'tfj369',
  FJ369_TOKEN: 'fj369_token',
  POINTS: 'points',
  HYBRID: 'hybrid',
} as const;

export type FjnMallPaymentMethod =
  (typeof FJN_MALL_PAYMENT_METHOD)[keyof typeof FJN_MALL_PAYMENT_METHOD];

/** 物流状态 */
export const FJN_MALL_DELIVERY_STATUS = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception',
  RETURNED: 'returned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type FjnMallDeliveryStatus =
  (typeof FJN_MALL_DELIVERY_STATUS)[keyof typeof FJN_MALL_DELIVERY_STATUS];

// ============================================================
// 13. 财务税务
// ============================================================

/** 财务账户类型 */
export const FJN_FINANCE_ACCOUNT_TYPES = {
  WINE_COST: 'wine_cost',
  MARKET_ECOSYSTEM: 'market_ecosystem',
  COMPANY: 'company',
  TAX: 'tax',
  RESERVE: 'reserve',
  REWARD: 'reward',
  SETTLEMENT: 'settlement',
} as const;

export type FjnFinanceAccountType = (typeof FJN_FINANCE_ACCOUNT_TYPES)[keyof typeof FJN_FINANCE_ACCOUNT_TYPES];

/** 税务类型 */
export const FJN_TAX_TYPES = {
  VAT: 'vat',
  GST: 'gst',
  SALES_TAX: 'sales_tax',
  WITHHOLDING: 'withholding',
  INCOME_TAX: 'income_tax',
  COMMISSION_TAX: 'commission_tax',
} as const;

export type FjnTaxType = (typeof FJN_TAX_TYPES)[keyof typeof FJN_TAX_TYPES];

/** 税务状态 */
export const FJN_TAX_STATUS = {
  PENDING: 'pending',
  CALCULATED: 'calculated',
  DECLARED: 'declared',
  PAID: 'paid',
  OVERDUE: 'overdue',
  DISPUTED: 'disputed',
} as const;

export type FjnTaxStatus = (typeof FJN_TAX_STATUS)[keyof typeof FJN_TAX_STATUS];

// ============================================================
// 14. 链上
// ============================================================

/** 区块链网络 */
export const FJN_CHAIN_NETWORKS = {
  SOLANA_DEVNET: 'solana_devnet',
  SOLANA_MAINNET: 'solana_mainnet',
  ETHEREUM_MAINNET: 'ethereum_mainnet',
  ETHEREUM_SEPOLIA: 'ethereum_sepolia',
  POLYGON: 'polygon',
  BNB: 'bnb',
  ARBITRUM: 'arbitrum',
} as const;

export type FjnChainNetwork = (typeof FJN_CHAIN_NETWORKS)[keyof typeof FJN_CHAIN_NETWORKS];

/** 链上交易状态 */
export const FJN_CHAIN_TX_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  FINALIZED: 'finalized',
  FAILED: 'failed',
  DROPPED: 'dropped',
} as const;

export type FjnChainTxStatus = (typeof FJN_CHAIN_TX_STATUS)[keyof typeof FJN_CHAIN_TX_STATUS];

// ============================================================
// 15. 通用
// ============================================================

/** 默认国家 */
export const FJN_DEFAULT_COUNTRY = 'CN';

/** 允许的国家代码（示例，生产应从规则配置读取） */
export const FJN_ALLOWED_COUNTRIES = [
  'CN', 'HK', 'TW', 'SG', 'MY', 'TH', 'JP', 'KR',
  'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'NZ',
] as const;

export type FjnAllowedCountry = (typeof FJN_ALLOWED_COUNTRIES)[number];

/** 默认货币 */
export const FJN_DEFAULT_CURRENCY = 'USD';

/** 支持的货币 */
export const FJN_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'CNY', 'HKD', 'JPY', 'SGD', 'USDT'] as const;

export type FjnSupportedCurrency = (typeof FJN_SUPPORTED_CURRENCIES)[number];

/** KYC 等级 */
export const FJN_KYC_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  STANDARD: 'standard',
  ENHANCED: 'enhanced',
} as const;

export type FjnKycLevel = (typeof FJN_KYC_LEVELS)[keyof typeof FJN_KYC_LEVELS];

/** 通用软删除状态 */
export const FJN_SOFT_DELETE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const;

export type FjnSoftDeleteStatus = (typeof FJN_SOFT_DELETE_STATUS)[keyof typeof FJN_SOFT_DELETE_STATUS];

/** 通用业务状态 */
export const FJN_GENERAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  CLOSED: 'closed',
} as const;

export type FjnGeneralStatus = (typeof FJN_GENERAL_STATUS)[keyof typeof FJN_GENERAL_STATUS];
