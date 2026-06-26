/**
 * ZS Exchange 核心数据模型
 *
 * 涵盖：用户/认证、KYC、资产、钱包、订单、成交、K线、行情
 * 这是整个交易系统的"骨架"，所有业务逻辑围绕这套类型展开。
 */

// =============================================================================
// 1. 通用类型
// =============================================================================

export type ID = string;
export type ISODate = string;
export type Decimal = string; // 统一用 string 避免 JS 浮点精度问题

export interface PageQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}


export type ApiResponse<T = unknown> = ApiResp<T>;
export interface ApiResp<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp?: ISODate;
}


export type PaginatedResponse<T = unknown> = Paginated<T>;
export interface Paginated<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================

export type LoginResponse = AuthToken;
// 2. 用户与认证
// =============================================================================

/** KYC 等级 */
export type KycLevel = 0 | 1 | 2 | 3;
/**   0: 未认证   - 不可充提
 *    1: 初级认证 - 邮箱/手机 + 身份证 (单日 10 BTC)
 *    2: 高级认证 - + 人脸识别 (单日 100 BTC)
 *    3: 企业认证 - KYB 全套
 */

export type UserStatus = 'active' | 'frozen' | 'pending' | 'closed';
export type UserRole = 'user' | 'vip' | 'svip' | 'market_maker' | 'admin';

export interface User {
  id: ID;
  uid: string;            // 业务 UID
  email?: string;
  phone?: string;
  username: string;
  nickname?: string;
  avatar?: string;
  countryCode?: string;
  kycLevel: KycLevel;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  userLevel: 0 | 1 | 2 | 3 | 4 | 5; // VIP 等级
  vip: boolean;
  role: UserRole;
  status: UserStatus;
  twoFAEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  inviteCode?: string;
  referredBy?: string;
  registeredAt: ISODate;
  lastLoginAt?: ISODate;
}

export type AdminUser = User;
export type Content = Record<string, unknown>;
export type NFT = Record<string, unknown>;
export type Transaction = Record<string, unknown>;
export type AuditLog = Record<string, unknown>;

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // 秒
  scope?: string[];
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
  twoFACode?: string;
  captcha?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  inviteCode?: string;
  countryCode?: string;
  agreeTerms: boolean;
}

export interface SessionContext {
  user: User;
  token: AuthToken;
  permissions: string[];
  ip?: string;
  device?: string;
  loginAt: ISODate;
}

// =============================================================================
// 3. KYC 认证
// =============================================================================

export interface KycSubmission {
  id: ID;
  userId: ID;
  level: KycLevel;
  status: 'pending' | 'approved' | 'rejected' | 'resubmit';
  // 个人信息
  fullName: string;
  idType: 'id_card' | 'passport' | 'driver_license';
  idNumber: string;
  dateOfBirth: ISODate;
  nationality: string;
  // 地址
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  // 资料 URL
  idFrontUrl: string;
  idBackUrl?: string;
  selfieUrl: string;
  // 审核
  reviewedBy?: ID;
  reviewedAt?: ISODate;
  rejectReason?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// =============================================================================
// 4. 资产 / 余额
// =============================================================================

export type AssetType = 'crypto' | 'fiat' | 'nft' | 'derivative';

export interface Asset {
  symbol: string;          // BTC, ETH, USDT, USDC ...
  name: string;            // Bitcoin
  type: AssetType;
  icon?: string;
  decimals: number;        // 8
  chain?: string;          // ETH, BSC, SOL, TRC20...
  contractAddress?: string;
  withdrawMin: Decimal;
  withdrawMax: Decimal;
  withdrawFee: Decimal;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  internalTransferEnabled: boolean;
}

export interface Balance {
  userId: ID;
  asset: string;           // BTC
  available: Decimal;      // 可用
  frozen: Decimal;         // 冻结（挂单中）
  locked: Decimal;         // 锁定（提现中）
  btcValue: Decimal;       // BTC 估值
  usdtValue: Decimal;      // USDT 估值
  updatedAt: ISODate;
}

export interface BalanceSnapshot {
  asset: string;
  available: Decimal;
  frozen: Decimal;
  locked: Decimal;
  total: Decimal;
}

// =============================================================================
// 5. 钱包
// =============================================================================

export type WalletType = 'hot' | 'cold' | 'warm' | 'multisig';
export type WalletStatus = 'active' | 'disabled' | 'frozen';

export interface Wallet {
  id: ID;
  userId: ID;
  type: WalletType;
  asset: string;
  address: string;        // 链上地址
  tag?: string;           // XRP/IOST 等有 tag
  chain: string;
  publicKey?: string;
  balance: Decimal;
  status: WalletStatus;
  isDefault: boolean;
  label?: string;
  createdAt: ISODate;
}

export interface DepositRecord {
  id: ID;
  userId: ID;
  asset: string;
  chain: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: Decimal;
  fee: Decimal;
  confirmations: number;
  requiredConfirmations: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed' | 'rejected';
  blockNumber?: number;
  blockTime?: ISODate;
  memo?: string;
  internal: boolean;
  remark?: string;
  createdAt: ISODate;
  completedAt?: ISODate;
}

export interface WithdrawRequest {
  id: ID;
  userId: ID;
  asset: string;
  chain: string;
  toAddress: string;
  tag?: string;
  amount: Decimal;
  fee: Decimal;
  /** 实际到账 amount - fee */
  netAmount: Decimal;
  status: 'pending' | 'reviewing' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected' | 'cancelled';
  riskLevel: 'low' | 'medium' | 'high';
  reviewedBy?: ID;
  reviewedAt?: ISODate;
  rejectReason?: string;
  txHash?: string;
  twoFAVerified: boolean;
  emailVerified: boolean;
  ipAddress?: string;
  deviceFingerprint?: string;
  /** 风控延迟 */
  cooldownEnd?: ISODate;
  createdAt: ISODate;
  completedAt?: ISODate;
}

// =============================================================================
// 6. 交易对
// =============================================================================

export interface TradingPair {
  symbol: string;            // BTC/USDT
  baseAsset: string;         // BTC
  quoteAsset: string;        // USDT
  status: 'trading' | 'halt' | 'delisted';
  // 价格
  pricePrecision: number;    // 2
  quantityPrecision: number; // 6
  minQuantity: Decimal;
  maxQuantity: Decimal;
  minPrice: Decimal;
  maxPrice: Decimal;
  tickSize: Decimal;
  stepSize: Decimal;
  // 费用
  makerFee: Decimal;         // 0.001
  takerFee: Decimal;         // 0.001
  // 限制
  icebergAllowed: boolean;
  marketOrderAllowed: boolean;
  stopOrderAllowed: boolean;
  // 展示
  displayName?: string;
  iconUrl?: string;
  category?: string;
}

export interface Ticker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: Decimal;
  bidPrice: Decimal;
  askPrice: Decimal;
  bidQty: Decimal;
  askQty: Decimal;
  open24h: Decimal;
  high24h: Decimal;
  low24h: Decimal;
  volume24h: Decimal;       // 基准币
  quoteVolume24h: Decimal;  // 计价币
  change24h: Decimal;       // %
  changeAbs24h: Decimal;    // 绝对值
  updatedAt: ISODate;
}

// =============================================================================
// 7. 订单
// =============================================================================

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market' | 'iceberg' | 'trailing_stop' | 'oco' | 'fok' | 'ioc';
export type OrderStatus = 'new' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
export type OrderSource = 'web' | 'h5' | 'app' | 'api' | 'admin' | 'bot';

export interface Order {
  id: ID;
  userId: ID;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  timeInForce: TimeInForce;
  price: Decimal;             // 委托价
  stopPrice?: Decimal;        // 触发价
  quantity: Decimal;          // 委托量
  executedQty: Decimal;       // 已成交
  remainingQty: Decimal;      // 剩余
  cummulativeQuoteQty: Decimal; // 累计成交额
  avgPrice: Decimal;          // 成交均价
  fee: Decimal;               // 总手续费
  feeAsset: string;
  /** 现货/合约/杠杆 */
  market: 'spot' | 'futures' | 'margin';
  leverage?: number;
  /** 止损/止盈 */
  stopLoss?: Decimal;
  takeProfit?: Decimal;
  /** OCO 关联单 */
  ocoOrderId?: ID;
  /** 来源 */
  source: OrderSource;
  /** 备注 */
  remark?: string;
  /** 时间 */
  createdAt: ISODate;
  updatedAt: ISODate;
  filledAt?: ISODate;
  cancelledAt?: ISODate;
  expiresAt?: ISODate;
  /** 拒绝原因 */
  rejectReason?: string;
}

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: Decimal;
  price?: Decimal;
  stopPrice?: Decimal;
  timeInForce?: TimeInForce;
  clientOrderId?: string;
  market?: 'spot' | 'futures' | 'margin';
  leverage?: number;
  stopLoss?: Decimal;
  takeProfit?: Decimal;
  source?: OrderSource;
}

export interface Trade {
  id: ID;
  orderId: ID;
  /** 成交的对手方订单 ID（maker 的订单） */
  counterpartyOrderId?: ID;
  userId: ID;
  symbol: string;
  side: OrderSide;
  price: Decimal;
  quantity: Decimal;
  quoteQty: Decimal;
  fee: Decimal;
  feeAsset: string;
  isMaker: boolean;
  /** 对手方 */
  counterpartyUserId?: ID;
  /** maker orderId 别名，方便调用方使用 */
  makerOrderId?: ID;
  txHash?: string; // DEX 成交有
  executedAt: ISODate;
}

// =============================================================================
// 8. 撮合引擎
// =============================================================================

export interface OrderBookLevel {
  price: Decimal;
  quantity: Decimal;
  orderCount: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: OrderBookLevel[]; // 买盘 (价格降序)
  asks: OrderBookLevel[]; // 卖盘 (价格升序)
  lastUpdateId: number;
  timestamp: ISODate;
}

export interface MatchResult {
  takerOrderId: ID;
  makerOrderId: ID;
  symbol: string;
  side: OrderSide;
  price: Decimal;
  quantity: Decimal;
  takerFee: Decimal;
  makerFee: Decimal;
  executedAt: ISODate;
}

// =============================================================================
// 9. K线 / 行情
// =============================================================================

export type KlineInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface Kline {
  openTime: number;    // 毫秒
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: Decimal;
  quoteVolume: Decimal;
  trades: number;
  closeTime: number;
}

// =============================================================================
// 10. 合约/杠杆
// =============================================================================

export type MarginMode = 'isolated' | 'cross';
export type PositionSide = 'long' | 'short' | 'both';
export type ContractType = 'perpetual' | 'futures';

export interface Contract {
  symbol: string;             // BTC-USDT-PERP
  underlying: string;         // BTC
  quoteAsset: string;         // USDT
  contractType: ContractType;
  status: 'trading' | 'halt' | 'delisted';
  settleAsset: string;        // USDT
  /** 合约乘数 */
  contractSize: Decimal;      // 0.001 BTC
  /** 最小变动 */
  tickSize: Decimal;
  /** 最小数量 */
  stepSize: Decimal;
  /** 杠杆范围 */
  minLeverage: number;
  maxLeverage: number;
  /** 维持保证金率 */
  maintenanceMarginRate: Decimal;
  /** 初始保证金率 */
  initialMarginRate: Decimal;
  /** 资金费率 */
  fundingIntervalHours: number;     // 8
  lastFundingRate?: Decimal;
  nextFundingTime?: ISODate;
  makerFee: Decimal;
  takerFee: Decimal;
  /** 标记价格 */
  markPrice?: Decimal;
  indexPrice?: Decimal;
}

export interface Position {
  id: ID;
  userId: ID;
  symbol: string;
  side: PositionSide;
  quantity: Decimal;     // 持仓量
  entryPrice: Decimal;   // 开仓均价
  markPrice: Decimal;    // 当前标记价
  liquidationPrice: Decimal;
  leverage: number;
  marginMode: MarginMode;
  margin: Decimal;       // 保证金
  marginRatio: Decimal;  // 保证金率
  unrealizedPnl: Decimal;
  realizedPnl: Decimal;
  /** 强平 */
  maintenanceMargin: Decimal;
  /** 累计资金费 */
  cumulativeFundingFee: Decimal;
  openedAt: ISODate;
  updatedAt: ISODate;
}

// =============================================================================
// 11. 风控
// =============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskEventType =
  | 'large_withdraw'
  | 'login_anomaly'
  | 'trading_abnormal'
  | 'position_liquidation'
  | 'kyc_manipulation'
  | 'ip_blacklist'
  | 'device_blacklist'
  | 'aml_alert'
  | 'concentration_risk';

export interface RiskEvent {
  id: ID;
  userId?: ID;
  type: RiskEventType;
  level: RiskLevel;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  payload?: Record<string, unknown>;
  assignedTo?: ID;
  resolvedAt?: ISODate;
  createdAt: ISODate;
}

export interface RiskRule {
  id: ID;
  name: string;
  type: RiskEventType;
  enabled: boolean;
  priority: number;
  conditions: RiskCondition[];
  action: 'alert' | 'freeze' | 'review' | 'block';
  cooldownSeconds: number;
}

export interface RiskCondition {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between' | 'regex';
  value: unknown;
}

// =============================================================================
// 12. 充值/提现限额配置
// =============================================================================

export interface KycLimit {
  level: KycLevel;
  dailyDepositUsdt: Decimal;
  dailyWithdrawUsdt: Decimal;
  singleWithdrawUsdt: Decimal;
  monthlyWithdrawUsdt: Decimal;
  futuresEnabled: boolean;
  marginEnabled: boolean;
}

// =============================================================================
// 13. 通知
// =============================================================================

export type NotificationType = 'order_filled' | 'order_cancelled' | 'deposit_completed' | 'withdraw_completed' | 'price_alert' | 'kyc_update' | 'system';

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: ISODate;
  createdAt: ISODate;
}
