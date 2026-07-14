/**
 * Sports Pool Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.9 + §2.4
 *
 * Sports Pool = 体育竞猜的资金池 + 赛事 + 竞猜市场 + 用户参与
 *  - 链下：FjnOperationLog（payload JSON 作为 pool/event/market/entry 账本）
 *  - 链上：Solana Sports Pool Program（fjn_sports_pool_program）+ Anchor settle
 *  - 工业级硬规则：默认无牌照地区只能积分竞猜；必须先过 SportsComplianceService
 *
 * 架构（4 类对象）：
 *  1. SportsPool   - 资金池（按赛事 / 联赛 / 全局）
 *  2. SportsEvent  - 赛事
 *  3. SportsMarket - 竞猜市场（每个 event 下多个 market：胜负/让球/大小/...)
 *  4. SportsEntry  - 用户参与（下注）
 *
 * 状态机：
 *  - Pool:    active → locked → settled → closed
 *  - Event:   scheduled → open → live → closed → settled → cancelled
 *  - Market:  draft → open → locked → settled → cancelled
 *  - Entry:   pending → paid → confirmed → settled_won / settled_lost / refunded / void
 */

export const SPORTS_POOL_TYPE = {
  EVENT: 'event',          // 单赛事
  LEAGUE: 'league',        // 联赛
  GLOBAL: 'global',        // 全局
  CATEGORY: 'category',    // 分类
} as const;
export type FjnSportsPoolType = (typeof SPORTS_POOL_TYPE)[keyof typeof SPORTS_POOL_TYPE];

export const SPORTS_POOL_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',         // 锁定中（赛事进行中，不接受新下注）
  SETTLED: 'settled',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;
export type FjnSportsPoolStatus =
  (typeof SPORTS_POOL_STATUS)[keyof typeof SPORTS_POOL_STATUS];

export const SPORTS_EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  OPEN: 'open',
  LIVE: 'live',
  CLOSED: 'closed',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
} as const;
export type FjnSportsEventStatus =
  (typeof SPORTS_EVENT_STATUS)[keyof typeof SPORTS_EVENT_STATUS];

export const SPORTS_MARKET_TYPE = {
  WINNER: 'winner',         // 胜负
  HANDICAP: 'handicap',     // 让球
  OVER_UNDER: 'over_under', // 大小
  CORRECT_SCORE: 'correct_score', // 比分
  FIRST_GOAL: 'first_goal', // 首入球
  CUSTOM: 'custom',         // 自定义
} as const;
export type FjnSportsMarketType =
  (typeof SPORTS_MARKET_TYPE)[keyof typeof SPORTS_MARKET_TYPE];

export const SPORTS_MARKET_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  LOCKED: 'locked',         // 截止下注
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
  VOIDED: 'voided',         // 流局（赛事取消）
} as const;
export type FjnSportsMarketStatus =
  (typeof SPORTS_MARKET_STATUS)[keyof typeof SPORTS_MARKET_STATUS];

export const SPORTS_ENTRY_STATUS = {
  PENDING: 'pending',       // 待支付
  PAID: 'paid',             // 已支付
  CONFIRMED: 'confirmed',   // 已确认（链上交易确认）
  SETTLED_WON: 'settled_won',
  SETTLED_LOST: 'settled_lost',
  REFUNDED: 'refunded',
  VOIDED: 'voided',
  CANCELLED: 'cancelled',
  RISK_HOLD: 'risk_hold',
} as const;
export type FjnSportsEntryStatus =
  (typeof SPORTS_ENTRY_STATUS)[keyof typeof SPORTS_ENTRY_STATUS];

/** 参与方式 */
export const SPORTS_ENTRY_PAYMENT_METHOD = {
  POINTS: 'points',         // 积分竞猜（无牌照地区）
  MOCK: 'mock',             // 模拟竞猜
  SOLANA_PAY: 'solana_pay', // Solana Pay（链上）
  FJ369_TOKEN: 'fj369_token',
  TFJ369: 'tfj369',
} as const;
export type FjnSportsEntryPaymentMethod =
  (typeof SPORTS_ENTRY_PAYMENT_METHOD)[keyof typeof SPORTS_ENTRY_PAYMENT_METHOD];

/** 赔率模式 */
export const SPORTS_ODDS_FORMAT = {
  DECIMAL: 'decimal',       // 欧赔 1.50
  AMERICAN: 'american',     // 美式
  FRACTIONAL: 'fractional', // 英式
} as const;
export type FjnSportsOddsFormat =
  (typeof SPORTS_ODDS_FORMAT)[keyof typeof SPORTS_ODDS_FORMAT];

/** 比赛结果（结算用） */
export const SPORTS_OUTCOME = {
  HOME: 'home',
  AWAY: 'away',
  DRAW: 'draw',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown',
} as const;
export type FjnSportsOutcome = (typeof SPORTS_OUTCOME)[keyof typeof SPORTS_OUTCOME];

/** 联赛分类 */
export const SPORTS_CATEGORY = {
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  TENNIS: 'tennis',
  ESPORTS: 'esports',
  HORSE_RACING: 'horse_racing',
  OTHER: 'other',
} as const;
export type FjnSportsCategory =
  (typeof SPORTS_CATEGORY)[keyof typeof SPORTS_CATEGORY];

/** 默认链 */
export const SPORTS_POOL_DEFAULT_CHAIN_ID = 'devnet';

/** 默认货币 */
export const SPORTS_POOL_DEFAULT_CURRENCY = 'FJ369';

/** 默认赔率精度（4 位小数） */
export const SPORTS_ODDS_PRECISION = 4;

/** 默认最低赔率（避免 division by zero） */
export const SPORTS_MIN_ODDS = '1.01';

/** 校验器 */
export const isValidSportsPoolType = (v: string): v is FjnSportsPoolType =>
  Object.values(SPORTS_POOL_TYPE).includes(v as any);
export const isValidSportsPoolStatus = (v: string): v is FjnSportsPoolStatus =>
  Object.values(SPORTS_POOL_STATUS).includes(v as any);
export const isValidSportsEventStatus = (v: string): v is FjnSportsEventStatus =>
  Object.values(SPORTS_EVENT_STATUS).includes(v as any);
export const isValidSportsMarketType = (v: string): v is FjnSportsMarketType =>
  Object.values(SPORTS_MARKET_TYPE).includes(v as any);
export const isValidSportsMarketStatus = (v: string): v is FjnSportsMarketStatus =>
  Object.values(SPORTS_MARKET_STATUS).includes(v as any);
export const isValidSportsEntryStatus = (v: string): v is FjnSportsEntryStatus =>
  Object.values(SPORTS_ENTRY_STATUS).includes(v as any);
export const isValidSportsEntryPaymentMethod = (v: string): v is FjnSportsEntryPaymentMethod =>
  Object.values(SPORTS_ENTRY_PAYMENT_METHOD).includes(v as any);
export const isValidSportsOddsFormat = (v: string): v is FjnSportsOddsFormat =>
  Object.values(SPORTS_ODDS_FORMAT).includes(v as any);
export const isValidSportsOutcome = (v: string): v is FjnSportsOutcome =>
  Object.values(SPORTS_OUTCOME).includes(v as any);
export const isValidSportsCategory = (v: string): v is FjnSportsCategory =>
  Object.values(SPORTS_CATEGORY).includes(v as any);

/** 状态机：Pool 合法转移 */
export const SPORTS_POOL_STATUS_TRANSITIONS: Record<FjnSportsPoolStatus, FjnSportsPoolStatus[]> = {
  [SPORTS_POOL_STATUS.ACTIVE]: [
    SPORTS_POOL_STATUS.LOCKED,
    SPORTS_POOL_STATUS.CLOSED,
    SPORTS_POOL_STATUS.CANCELLED,
  ],
  [SPORTS_POOL_STATUS.LOCKED]: [
    SPORTS_POOL_STATUS.SETTLED,
    SPORTS_POOL_STATUS.CLOSED,
    SPORTS_POOL_STATUS.CANCELLED,
  ],
  [SPORTS_POOL_STATUS.SETTLED]: [SPORTS_POOL_STATUS.CLOSED],
  [SPORTS_POOL_STATUS.CLOSED]: [],
  [SPORTS_POOL_STATUS.CANCELLED]: [],
};

export const canTransitSportsPoolStatus = (
  from: FjnSportsPoolStatus,
  to: FjnSportsPoolStatus,
): boolean => (SPORTS_POOL_STATUS_TRANSITIONS[from] ?? []).includes(to);

/** 状态机：Event 合法转移 */
export const SPORTS_EVENT_STATUS_TRANSITIONS: Record<FjnSportsEventStatus, FjnSportsEventStatus[]> = {
  [SPORTS_EVENT_STATUS.SCHEDULED]: [
    SPORTS_EVENT_STATUS.OPEN,
    SPORTS_EVENT_STATUS.CANCELLED,
    SPORTS_EVENT_STATUS.POSTPONED,
  ],
  [SPORTS_EVENT_STATUS.OPEN]: [
    SPORTS_EVENT_STATUS.LIVE,
    SPORTS_EVENT_STATUS.CANCELLED,
    SPORTS_EVENT_STATUS.POSTPONED,
  ],
  [SPORTS_EVENT_STATUS.LIVE]: [SPORTS_EVENT_STATUS.CLOSED, SPORTS_EVENT_STATUS.CANCELLED],
  [SPORTS_EVENT_STATUS.CLOSED]: [SPORTS_EVENT_STATUS.SETTLED, SPORTS_EVENT_STATUS.CANCELLED],
  [SPORTS_EVENT_STATUS.SETTLED]: [],
  [SPORTS_EVENT_STATUS.CANCELLED]: [],
  [SPORTS_EVENT_STATUS.POSTPONED]: [SPORTS_EVENT_STATUS.SCHEDULED, SPORTS_EVENT_STATUS.CANCELLED],
};

export const canTransitSportsEventStatus = (
  from: FjnSportsEventStatus,
  to: FjnSportsEventStatus,
): boolean => (SPORTS_EVENT_STATUS_TRANSITIONS[from] ?? []).includes(to);

/** 状态机：Market 合法转移 */
export const SPORTS_MARKET_STATUS_TRANSITIONS: Record<FjnSportsMarketStatus, FjnSportsMarketStatus[]> = {
  [SPORTS_MARKET_STATUS.DRAFT]: [SPORTS_MARKET_STATUS.OPEN, SPORTS_MARKET_STATUS.CANCELLED],
  [SPORTS_MARKET_STATUS.OPEN]: [SPORTS_MARKET_STATUS.LOCKED, SPORTS_MARKET_STATUS.CANCELLED],
  [SPORTS_MARKET_STATUS.LOCKED]: [
    SPORTS_MARKET_STATUS.SETTLED,
    SPORTS_MARKET_STATUS.VOIDED,
    SPORTS_MARKET_STATUS.CANCELLED,
  ],
  [SPORTS_MARKET_STATUS.SETTLED]: [],
  [SPORTS_MARKET_STATUS.CANCELLED]: [],
  [SPORTS_MARKET_STATUS.VOIDED]: [],
};

export const canTransitSportsMarketStatus = (
  from: FjnSportsMarketStatus,
  to: FjnSportsMarketStatus,
): boolean => (SPORTS_MARKET_STATUS_TRANSITIONS[from] ?? []).includes(to);

/** 状态机：Entry 合法转移 */
export const SPORTS_ENTRY_STATUS_TRANSITIONS: Record<FjnSportsEntryStatus, FjnSportsEntryStatus[]> = {
  [SPORTS_ENTRY_STATUS.PENDING]: [
    SPORTS_ENTRY_STATUS.PAID,
    SPORTS_ENTRY_STATUS.CANCELLED,
  ],
  [SPORTS_ENTRY_STATUS.PAID]: [
    SPORTS_ENTRY_STATUS.CONFIRMED,
    SPORTS_ENTRY_STATUS.REFUNDED,
    SPORTS_ENTRY_STATUS.CANCELLED,
    SPORTS_ENTRY_STATUS.RISK_HOLD,
  ],
  [SPORTS_ENTRY_STATUS.CONFIRMED]: [
    SPORTS_ENTRY_STATUS.SETTLED_WON,
    SPORTS_ENTRY_STATUS.SETTLED_LOST,
    SPORTS_ENTRY_STATUS.REFUNDED,
    SPORTS_ENTRY_STATUS.VOIDED,
    SPORTS_ENTRY_STATUS.RISK_HOLD,
  ],
  [SPORTS_ENTRY_STATUS.RISK_HOLD]: [
    SPORTS_ENTRY_STATUS.CONFIRMED,
    SPORTS_ENTRY_STATUS.SETTLED_WON,
    SPORTS_ENTRY_STATUS.SETTLED_LOST,
    SPORTS_ENTRY_STATUS.REFUNDED,
  ],
  [SPORTS_ENTRY_STATUS.SETTLED_WON]: [],
  [SPORTS_ENTRY_STATUS.SETTLED_LOST]: [],
  [SPORTS_ENTRY_STATUS.REFUNDED]: [],
  [SPORTS_ENTRY_STATUS.VOIDED]: [],
  [SPORTS_ENTRY_STATUS.CANCELLED]: [],
};

export const canTransitSportsEntryStatus = (
  from: FjnSportsEntryStatus,
  to: FjnSportsEntryStatus,
): boolean => (SPORTS_ENTRY_STATUS_TRANSITIONS[from] ?? []).includes(to);
