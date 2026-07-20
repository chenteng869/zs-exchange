'use client';

/**
 * PortalQuant - 量化交易中心（2026-07-19 Q05 P3.27）
 *
 * 页面定位：
 * - 中萨数字科技交易所 量化交易中心
 * - 策略商城 / 信号订阅 / 跟单做市 / 量化赛事 / 策略开发 / 历史业绩 / 申请入驻
 * - 与 P3.4 交易大厅 + P3.17 API + P3.25 做市 + P3.26 衍生品形成"现货-合约-做市-量化"四元协同闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 策略商城 / 信号订阅 / 跟单做市 / 量化赛事 /
 *             策略开发 / 历史业绩 / 申请入驻 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 策略类型过滤 / 搜索 / 排序 / 风险等级过滤 / 详情 Drawer /
 *           申请向导 / 跟单配置 / 快捷键
 * - 7+ Drawer：策略详情 / 信号详情 / 跟单详情 / 赛事详情 / 申请向导 / 跟单配置 / 帮助
 * - 4+ 实时数据：在线策略 / 信号推送 / 跟单收益 / 赛事排名
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 所有策略 / 信号 / 跟单 / 赛事数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 量化策略历史业绩为内部估算口径，不构成对未来收益的承诺
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚"等高风险词
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  TrendingUp,
  TrendingDown,
  LineChart as LineIcon,
  CandlestickChart,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Gauge,
  Target,
  Crosshair,
  Compass,
  Map as MapIcon,
  MapPin,
  Globe2,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Medal,
  Heart,
  ThumbsUp,
  Bookmark,
  Flag,
  Tag,
  Tags,
  Eye,
  EyeOff,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Upload,
  FileText,
  FileCode,
  Code2,
  Terminal,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Workflow,
  Cpu,
  Database,
  Server,
  Cloud,
  Network,
  Layers,
  Boxes,
  BoxesIcon,
  Zap,
  Rocket,
  Flame,
  Settings,
  Sliders,
  SlidersHorizontal,
  Bell,
  BellOff,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Calendar,
  Clock,
  Hash,
  User,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  HandCoins,
  Coins,
  CircleDollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  XCircle,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'marketplace' | 'signals' | 'copy' | 'tournament' | 'backtest' | 'attribution' | 'risk' | 'linked' | 'dev' | 'performance' | 'apply' | 'help';
type StrategyType = 'grid' | 'trend' | 'arbitrage' | 'market-making' | 'mean-reversion' | 'dca' | 'momentum' | 'hft' | 'options' | 'ml';
type StrategyStatus = 'live' | 'beta' | 'paused' | 'retired' | 'suspended';
type RiskLevel = 'conservative' | 'balanced' | 'aggressive' | 'speculative';
type SignalType = 'entry' | 'exit' | 'rebalance' | 'stop-loss' | 'take-profit' | 'alert';
type SignalPriority = 'urgent' | 'high' | 'medium' | 'low' | 'info';
type CopyMode = 'fixed-amount' | 'proportional' | 'multiplier' | 'mirror';
type CopyStatus = 'active' | 'paused' | 'stopped' | 'pending' | 'failed';
type TournamentStatus = 'upcoming' | 'registration' | 'live' | 'ended' | 'cancelled';
type DevTool = 'ide' | 'backtest' | 'paper' | 'live' | 'monitor' | 'optimize';
type ApplyType = 'strategist' | 'team' | 'institution' | 'community' | 'educator';
type DrawerType = 'strategy' | 'signal' | 'copy' | 'tournament' | 'apply' | 'config' | 'help' | 'dev' | 'parameter' | 'risk-budget' | 'linked' | null;

interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  status: StrategyStatus;
  risk: RiskLevel;
  author: string;
  authorType: 'official' | 'certified' | 'community' | 'pro';
  category: string;
  pairs: string[];
  exchange: string;
  description: string;
  tags: string[];
  subscribers: number;
  aum: number;
  apy30d: number;
  apy90d: number;
  apy1y: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgHoldTime: string;
  fee: number;
  price: number; // 订阅费（月）
  rating: number;
  reviews: number;
  capitalMin: number;
  capitalMax: number;
  leverage: number;
  createdAt: string;
  updatedAt: string;
  highlights: string[];
  features: string[];
  requirements: string[];
  performance: { date: string; value: number }[];
}

interface Signal {
  id: string;
  type: SignalType;
  priority: SignalPriority;
  symbol: string;
  side: 'long' | 'short' | 'close' | 'neutral';
  price: number;
  target?: number;
  stopLoss?: number;
  confidence: number;
  source: string;
  strategy: string;
  publishedAt: string;
  description: string;
  tags: string[];
  subscribers: number;
  hit: boolean;
  result?: number;
  ttl: number; // 有效期（分钟）
}

interface Copy {
  id: string;
  strategyId: string;
  strategyName: string;
  strategyAuthor: string;
  mode: CopyMode;
  status: CopyStatus;
  allocation: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  copiedAt: string;
  updatedAt: string;
  follower: string;
  copiedTrades: number;
  winRate: number;
  maxDrawdown: number;
  risk: RiskLevel;
  stopCopy: { drawdown: number; dailyLoss: number; totalLoss: number };
  takeProfit: { target: number; partial: number[] };
}

interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  category: string;
  participants: number;
  maxParticipants: number;
  prizePool: number;
  currency: string;
  entryFee: number;
  rules: string[];
  judges: string[];
  sponsors: string[];
  rounds: { name: string; startDate: string; endDate: string; description: string }[];
  currentRound: number;
  description: string;
  requirements: string[];
  awards: { rank: string; prize: number; perks: string[] }[];
}

interface DevToolInfo {
  id: DevTool;
  name: string;
  description: string;
  category: 'editor' | 'testing' | 'execution' | 'analytics';
  version: string;
  features: string[];
  pricing: string;
  users: number;
  onlineUsers: number;
  releases: { version: string; date: string; highlights: string[] }[];
  icon: string;
}

interface Performance {
  id: string;
  strategy: string;
  category: string;
  period: '7d' | '30d' | '90d' | '180d' | '1y' | 'ytd' | 'all';
  apy: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTrade: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  calmar: number;
  updatedAt: string;
}

interface KpiSnapshot {
  totalStrategies: number;
  liveStrategies: number;
  totalAum: number;
  totalSignals: number;
  signals24h: number;
  copyTraders: number;
  copyAum: number;
  totalPnl30d: number;
  avgApy: number;
  tournamentsLive: number;
  totalPrize: number;
  developers: number;
  // === P3.40 v2 扩展字段 ===
  backtestRuns30d: number;
  attributionCoverage: number;
  riskVaR95: number;
  ecosystemLinks: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== P3.40 v2 扩展类型 ==============

type BacktestStatus = 'queued' | 'running' | 'completed' | 'failed' | 'archived';
type AttributionDim = 'symbol' | 'period' | 'signalType' | 'factor';
type RiskFactor = 'market' | 'liquidity' | 'concentration' | 'leverage' | 'correlation' | 'tail' | 'fx';
type StressScenario = 'btc-crash-30' | 'eth-crash-40' | 'liquidity-shock' | 'rate-hike' | 'black-swan' | 'correlation-break';

interface StrategyParam {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
}

interface BacktestRun {
  id: string;
  strategyId: string;
  strategyName: string;
  status: BacktestStatus;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalEquity: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  totalTrades: number;
  avgTrade: number;
  bestTrade: number;
  worstTrade: number;
  longestDD: number;
  recoveryDays: number;
  parameters: StrategyParam[];
  equity: { date: string; value: number }[];
  progress: number;
  createdAt: string;
  runtimeSec: number;
}

interface AttributionSlice {
  key: string;
  label: string;
  contribution: number;
  pnl: number;
  trades: number;
  winRate: number;
  color: string;
}

interface Attribution {
  strategyId: string;
  strategyName: string;
  period: string;
  totalPnl: number;
  coverage: number;
  slices: AttributionSlice[];
}

interface RiskFactorExposure {
  factor: RiskFactor;
  label: string;
  exposure: number;
  contribution: number;
  limit: number;
  utilization: number;
  trend: 'up' | 'down' | 'flat';
  color: string;
  note: string;
}

interface StressTest {
  id: string;
  scenario: StressScenario;
  name: string;
  description: string;
  estimatedLoss: number;
  estimatedLossPct: number;
  currentPnl: number;
  breachLimit: boolean;
  recoveryDays: number;
  probability: number;
}

interface RiskBudget {
  total: number;
  used: number;
  remaining: number;
  factors: RiskFactorExposure[];
  stress: StressTest[];
  var95: number;
  var99: number;
  expectedShortfall: number;
  concentration: number;
  leverageRatio: number;
}

interface EcosystemLink {
  id: string;
  name: string;
  page: string;
  description: string;
  status: 'live' | 'beta' | 'ready';
  throughput: number;
  unit: string;
  highlight: string;
  color: string;
}

// ============== Mock 数据 ==============

const STRATEGIES: Strategy[] = [
  {
    id: 's-001',
    name: 'AlphaGrid 现货网格 Pro',
    type: 'grid',
    status: 'live',
    risk: 'balanced',
    author: 'ZSDEX 官方实验室',
    authorType: 'official',
    category: '现货网格',
    pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    exchange: 'ZSDEX 现货',
    description: '多品种现货网格策略，结合波动率自适应与再平衡机制，适合震荡行情。',
    tags: ['网格', '现货', '震荡', '官方认证'],
    subscribers: 4280,
    aum: 38400000,
    apy30d: 28.4,
    apy90d: 42.6,
    apy1y: 86.2,
    sharpe: 2.4,
    maxDrawdown: 8.2,
    winRate: 72.4,
    totalTrades: 14820,
    avgHoldTime: '4h 12m',
    fee: 0.001,
    price: 0,
    rating: 4.8,
    reviews: 1284,
    capitalMin: 1000,
    capitalMax: 5000000,
    leverage: 1,
    createdAt: '2024-08-15',
    updatedAt: '2026-07-18',
    highlights: ['官方实验室出品', '28.4% 30日年化', '最大回撤 8.2%', '夏普比率 2.4'],
    features: ['波动率自适应网格', '智能再平衡', '多品种分散', '实时风控'],
    requirements: ['完成 KYC 基础认证', '现货账户余额 ≥ 1000 USDT', 'API 授权（只读+交易）'],
    performance: [],
  },
  {
    id: 's-002',
    name: 'DeltaTrend 趋势跟踪 v3',
    type: 'trend',
    status: 'live',
    risk: 'aggressive',
    author: 'QuantPro Research',
    authorType: 'certified',
    category: '趋势策略',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    exchange: 'ZSDEX 永续',
    description: '基于多周期均线与动量指标的趋势跟踪策略，配合波动率过滤与止损。',
    tags: ['趋势', '永续', '动量', '高夏普'],
    subscribers: 2180,
    aum: 24800000,
    apy30d: 62.4,
    apy90d: 138.2,
    apy1y: 186.4,
    sharpe: 1.8,
    maxDrawdown: 18.6,
    winRate: 58.2,
    totalTrades: 4280,
    avgHoldTime: '2d 8h',
    fee: 0.0015,
    price: 49,
    rating: 4.6,
    reviews: 824,
    capitalMin: 5000,
    capitalMax: 2000000,
    leverage: 3,
    createdAt: '2024-06-20',
    updatedAt: '2026-07-15',
    highlights: ['62.4% 30日年化', '186.4% 1年年化', '夏普比率 1.8', '多周期共振'],
    features: ['多周期均线', '动量过滤', 'ATR 动态止损', '趋势强度评分'],
    requirements: ['KYC 高级认证', '账户余额 ≥ 5000 USDT', '接受高波动'],
    performance: [],
  },
  {
    id: 's-003',
    name: 'ArbitrageX 跨所套利',
    type: 'arbitrage',
    status: 'live',
    risk: 'conservative',
    author: 'AlphaLab Studio',
    authorType: 'certified',
    category: '套利策略',
    pairs: ['BTC/USDT', 'ETH/USDT', 'USDC/USDT'],
    exchange: '多交易所',
    description: '跨交易所现货价差套利，低波动率历史业绩特征，需多账户部署。',
    tags: ['套利', '低风险', '稳定', '多账户'],
    subscribers: 1240,
    aum: 18600000,
    apy30d: 12.8,
    apy90d: 14.4,
    apy1y: 16.2,
    sharpe: 4.2,
    maxDrawdown: 1.4,
    winRate: 96.8,
    totalTrades: 8420,
    avgHoldTime: '8m',
    fee: 0.0008,
    price: 99,
    rating: 4.9,
    reviews: 486,
    capitalMin: 50000,
    capitalMax: 10000000,
    leverage: 1,
    createdAt: '2024-10-08',
    updatedAt: '2026-07-12',
    highlights: ['12.8% 30日年化', '最大回撤 1.4%', '夏普比率 4.2', '胜率 96.8%'],
    features: ['跨所实时监控', '自动转账调度', '价差回归模型', '多账户路由'],
    requirements: ['多交易所账户', 'API 授权', '最低 5 万 USDT', 'KYC 高级认证'],
    performance: [],
  },
  {
    id: 's-004',
    name: 'MarketMaker Z 做市商',
    type: 'market-making',
    status: 'live',
    risk: 'balanced',
    author: 'ZSDEX 官方',
    authorType: 'official',
    category: '做市策略',
    pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'],
    exchange: 'ZSDEX 现货',
    description: '专业级做市商策略，提供双边流动性，赚取 Maker 返佣与价差。',
    tags: ['做市', '官方', 'Maker 返佣', '历史低波动'],
    subscribers: 480,
    aum: 84000000,
    apy30d: 18.2,
    apy90d: 22.8,
    apy1y: 28.4,
    sharpe: 3.6,
    maxDrawdown: 4.2,
    winRate: 88.4,
    totalTrades: 128400,
    avgHoldTime: '38s',
    fee: 0.0006,
    price: 0,
    rating: 4.7,
    reviews: 248,
    capitalMin: 100000,
    capitalMax: 50000000,
    leverage: 1,
    createdAt: '2024-04-12',
    updatedAt: '2026-07-10',
    highlights: ['18.2% 30日年化', '28.4% 1年年化', '最大回撤 4.2%', '8.4万笔成交'],
    features: ['智能报价', '库存管理', '价差保护', '多账户轮询'],
    requirements: ['机构账户', 'API 完整授权', '最低 10 万 USDT', '合格投资者认证'],
    performance: [],
  },
  {
    id: 's-005',
    name: 'DCA Pro 定投增强',
    type: 'dca',
    status: 'live',
    risk: 'conservative',
    author: 'ZSDEX 官方',
    authorType: 'official',
    category: '定投策略',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    exchange: 'ZSDEX 现货',
    description: '智能定投策略，结合估值指标与波动率动态调整定投金额。',
    tags: ['定投', 'DCA', '低风险', '官方'],
    subscribers: 6280,
    aum: 18400000,
    apy30d: 8.4,
    apy90d: 18.2,
    apy1y: 32.4,
    sharpe: 2.8,
    maxDrawdown: 6.4,
    winRate: 84.2,
    totalTrades: 124,
    avgHoldTime: '7d',
    fee: 0.0005,
    price: 0,
    rating: 4.8,
    reviews: 1842,
    capitalMin: 100,
    capitalMax: 1000000,
    leverage: 1,
    createdAt: '2024-09-25',
    updatedAt: '2026-07-18',
    highlights: ['8.4% 30日年化', '32.4% 1年年化', '胜率 84.2%', '最低 100 USDT 起'],
    features: ['估值指标动态 DCA', '波动率加权', '智能止盈', '多周期支持'],
    requirements: ['完成 KYC 基础认证', '现货账户余额 ≥ 100 USDT'],
    performance: [],
  },
  {
    id: 's-006',
    name: 'MomentumX 动量轮动',
    type: 'momentum',
    status: 'live',
    risk: 'aggressive',
    author: 'QuantPro Research',
    authorType: 'certified',
    category: '轮动策略',
    pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'DOGE/USDT'],
    exchange: 'ZSDEX 现货',
    description: '基于相对强度与动量指标的跨品种轮动策略，定期调仓。',
    tags: ['轮动', '动量', '调仓', '中高风险'],
    subscribers: 1480,
    aum: 14800000,
    apy30d: 38.4,
    apy90d: 84.2,
    apy1y: 124.8,
    sharpe: 1.6,
    maxDrawdown: 22.4,
    winRate: 62.4,
    totalTrades: 248,
    avgHoldTime: '7d',
    fee: 0.0012,
    price: 79,
    rating: 4.4,
    reviews: 384,
    capitalMin: 10000,
    capitalMax: 3000000,
    leverage: 1,
    createdAt: '2024-11-15',
    updatedAt: '2026-07-14',
    highlights: ['38.4% 30日年化', '124.8% 1年年化', '5 大币种轮动', '周度调仓'],
    features: ['相对强度排序', '动量评分', '动态再平衡', '多周期验证'],
    requirements: ['KYC 高级认证', '账户余额 ≥ 1 万 USDT'],
    performance: [],
  },
  {
    id: 's-007',
    name: 'MeanReversion Z 均值回归',
    type: 'mean-reversion',
    status: 'live',
    risk: 'balanced',
    author: 'AlphaLab Studio',
    authorType: 'certified',
    category: '统计套利',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    exchange: 'ZSDEX 永续',
    description: '基于布林带与 RSI 的均值回归策略，配合趋势过滤与仓位管理。',
    tags: ['均值回归', '统计', '永续', '中等风险'],
    subscribers: 920,
    aum: 8800000,
    apy30d: 22.4,
    apy90d: 38.6,
    apy1y: 64.2,
    sharpe: 2.0,
    maxDrawdown: 12.4,
    winRate: 68.4,
    totalTrades: 1840,
    avgHoldTime: '6h 24m',
    fee: 0.0012,
    price: 39,
    rating: 4.5,
    reviews: 286,
    capitalMin: 3000,
    capitalMax: 2000000,
    leverage: 2,
    createdAt: '2025-02-08',
    updatedAt: '2026-07-12',
    highlights: ['22.4% 30日年化', '夏普比率 2.0', '永续合约支持', '中等回撤'],
    features: ['布林带信号', 'RSI 过滤', '趋势强度评分', '动态仓位'],
    requirements: ['KYC 高级认证', '账户余额 ≥ 3000 USDT'],
    performance: [],
  },
  {
    id: 's-008',
    name: 'HFT Scalper 高频剥头皮',
    type: 'hft',
    status: 'beta',
    risk: 'speculative',
    author: 'QuantPro Research',
    authorType: 'certified',
    category: '高频策略',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    exchange: 'ZSDEX 现货',
    description: '高频做市 + 剥头皮策略，依赖低延迟基础设施与 VPS 部署。',
    tags: ['高频', 'HFT', '剥头皮', '专业级'],
    subscribers: 280,
    aum: 4200000,
    apy30d: 42.8,
    apy90d: 96.4,
    apy1y: 184.2,
    sharpe: 1.4,
    maxDrawdown: 28.4,
    winRate: 84.2,
    totalTrades: 184200,
    avgHoldTime: '12s',
    fee: 0.0004,
    price: 199,
    rating: 4.2,
    reviews: 124,
    capitalMin: 100000,
    capitalMax: 20000000,
    leverage: 1,
    createdAt: '2025-04-18',
    updatedAt: '2026-07-08',
    highlights: ['42.8% 30日年化', '18.4万笔月成交', '专业 VPS 推荐', '极低延迟'],
    features: ['低延迟执行', 'VPS 部署', '智能路由', '实时监控'],
    requirements: ['机构账户', 'VPS 部署', '最低 10 万 USDT', '专业经验'],
    performance: [],
  },
  {
    id: 's-009',
    name: 'OptionStraddle 期权跨式',
    type: 'options',
    status: 'live',
    risk: 'balanced',
    author: 'AlphaLab Studio',
    authorType: 'certified',
    category: '期权策略',
    pairs: ['BTC期权', 'ETH期权'],
    exchange: 'ZSDEX 期权',
    description: '基于隐含波动率的期权跨式策略，押注波动率扩张。',
    tags: ['期权', '跨式', '波动率', 'IV'],
    subscribers: 380,
    aum: 6200000,
    apy30d: 24.2,
    apy90d: 38.4,
    apy1y: 64.8,
    sharpe: 1.8,
    maxDrawdown: 16.4,
    winRate: 64.2,
    totalTrades: 240,
    avgHoldTime: '14d',
    fee: 0.002,
    price: 89,
    rating: 4.3,
    reviews: 142,
    capitalMin: 20000,
    capitalMax: 5000000,
    leverage: 1,
    createdAt: '2025-06-12',
    updatedAt: '2026-07-15',
    highlights: ['24.2% 30日年化', '期权 IV 模型', '14 天持仓', '波动率扩张'],
    features: ['隐含波动率模型', 'Greeks 监控', '动态对冲', '波动率曲面'],
    requirements: ['KYC 高级认证', '期权账户', '最低 2 万 USDT'],
    performance: [],
  },
  {
    id: 's-010',
    name: 'ML-AI 多因子模型',
    type: 'ml',
    status: 'beta',
    risk: 'aggressive',
    author: 'ZSDEX AI Lab',
    authorType: 'official',
    category: '机器学习',
    pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    exchange: 'ZSDEX 现货+永续',
    description: '基于 LSTM + 强化学习的多因子 AI 量化模型，自动特征工程。',
    tags: ['AI', 'ML', '深度学习', 'LSTM'],
    subscribers: 1840,
    aum: 22400000,
    apy30d: 48.4,
    apy90d: 124.8,
    apy1y: 248.6,
    sharpe: 2.2,
    maxDrawdown: 16.2,
    winRate: 66.4,
    totalTrades: 4280,
    avgHoldTime: '18h',
    fee: 0.0015,
    price: 149,
    rating: 4.6,
    reviews: 624,
    capitalMin: 5000,
    capitalMax: 10000000,
    leverage: 2,
    createdAt: '2025-08-22',
    updatedAt: '2026-07-18',
    highlights: ['48.4% 30日年化', 'LSTM+RL 混合', '248.6% 1年年化', 'AI 实验室出品'],
    features: ['LSTM 时序', '强化学习决策', '多因子融合', '自动特征工程'],
    requirements: ['KYC 高级认证', '账户余额 ≥ 5000 USDT', '接受策略不定期更新'],
    performance: [],
  },
  {
    id: 's-011',
    name: 'Pionex 网格基础版',
    type: 'grid',
    status: 'live',
    risk: 'conservative',
    author: '社区 - Robin',
    authorType: 'community',
    category: '现货网格',
    pairs: ['BTC/USDT'],
    exchange: 'ZSDEX 现货',
    description: '社区开发者推出的简单现货网格策略，适合入门跟单。',
    tags: ['网格', '入门', '社区'],
    subscribers: 1240,
    aum: 4800000,
    apy30d: 14.4,
    apy90d: 22.4,
    apy1y: 38.2,
    sharpe: 1.8,
    maxDrawdown: 8.4,
    winRate: 68.4,
    totalTrades: 4280,
    avgHoldTime: '2h 24m',
    fee: 0.001,
    price: 0,
    rating: 4.2,
    reviews: 184,
    capitalMin: 500,
    capitalMax: 1000000,
    leverage: 1,
    createdAt: '2025-09-10',
    updatedAt: '2026-07-08',
    highlights: ['14.4% 30日年化', '社区免费', '入门友好', '最大回撤 8.4%'],
    features: ['固定网格', '自动再平衡', '一键启动'],
    requirements: ['KYC 基础认证', '账户余额 ≥ 500 USDT'],
    performance: [],
  },
  {
    id: 's-012',
    name: 'FundingRate 资金费率套利',
    type: 'arbitrage',
    status: 'paused',
    risk: 'conservative',
    author: 'AlphaLab Studio',
    authorType: 'certified',
    category: '套利策略',
    pairs: ['BTC/USDT 永续', 'ETH/USDT 永续'],
    exchange: 'ZSDEX 永续+现货',
    description: '永续合约资金费率套利，做空永续+做多现货，吃资金费率。',
    tags: ['资金费率', '套利', '低风险', '永续'],
    subscribers: 620,
    aum: 12400000,
    apy30d: 9.8,
    apy90d: 12.4,
    apy1y: 16.8,
    sharpe: 5.2,
    maxDrawdown: 0.8,
    winRate: 98.4,
    totalTrades: 1240,
    avgHoldTime: '8h',
    fee: 0.0006,
    price: 0,
    rating: 4.7,
    reviews: 142,
    capitalMin: 20000,
    capitalMax: 8000000,
    leverage: 1,
    createdAt: '2025-03-18',
    updatedAt: '2026-06-22',
    highlights: ['9.8% 30日年化', '夏普比率 5.2', '最大回撤 0.8%', '胜率 98.4%'],
    features: ['资金费率监控', '基差跟踪', '自动对冲', '多币种支持'],
    requirements: ['KYC 高级认证', '现货+永续双账户', '最低 2 万 USDT'],
    performance: [],
  },
];

const SIGNALS: Signal[] = [
  { id: 'sig-001', type: 'entry', priority: 'urgent', symbol: 'BTC/USDT', side: 'long', price: 68420, target: 72800, stopLoss: 65800, confidence: 86, source: 'QuantPro Research', strategy: 'DeltaTrend 趋势跟踪 v3', publishedAt: '2026-07-19 10:24', description: '突破关键阻力 68,400，趋势强度评分 8.2，建议做多。', tags: ['趋势', '突破', '高确信'], subscribers: 8420, hit: false, ttl: 240 },
  { id: 'sig-002', type: 'rebalance', priority: 'high', symbol: 'ETH/USDT', side: 'neutral', price: 3280, confidence: 78, source: 'AlphaLab Studio', strategy: 'DCA Pro 定投增强', publishedAt: '2026-07-19 10:18', description: 'ETH 估值指标进入低估区间，动态 DCA 触发 2x 加仓信号。', tags: ['定投', '估值', 'DCA'], subscribers: 6280, hit: true, result: 1.4, ttl: 1440 },
  { id: 'sig-003', type: 'take-profit', priority: 'high', symbol: 'SOL/USDT', side: 'close', price: 184, target: 198, confidence: 82, source: 'ZSDEX 官方实验室', strategy: 'AlphaGrid 现货网格 Pro', publishedAt: '2026-07-19 10:08', description: 'SOL 触发网格上沿，智能再平衡建议部分止盈。', tags: ['网格', '止盈', '再平衡'], subscribers: 4280, hit: true, result: 7.4, ttl: 360 },
  { id: 'sig-004', type: 'stop-loss', priority: 'urgent', symbol: 'DOGE/USDT', side: 'close', price: 0.124, stopLoss: 0.118, confidence: 88, source: 'QuantPro Research', strategy: 'MomentumX 动量轮动', publishedAt: '2026-07-19 09:48', description: 'DOGE 跌破 5 日均线 + 动量转弱，触发策略止损。', tags: ['止损', '动量', '轮动'], subscribers: 1480, hit: true, result: -4.8, ttl: 60 },
  { id: 'sig-005', type: 'entry', priority: 'medium', symbol: 'ARB/USDT', side: 'long', price: 0.842, target: 0.92, stopLoss: 0.80, confidence: 72, source: 'AlphaLab Studio', strategy: 'MeanReversion Z 均值回归', publishedAt: '2026-07-19 09:24', description: 'ARB 触及布林带下沿 + RSI 32，建议均值回归做多。', tags: ['均值回归', '布林带', 'RSI'], subscribers: 920, hit: false, ttl: 480 },
  { id: 'sig-006', type: 'alert', priority: 'info', symbol: 'BNB/USDT', side: 'neutral', price: 612, confidence: 64, source: 'ZSDEX AI Lab', strategy: 'ML-AI 多因子模型', publishedAt: '2026-07-19 08:54', description: 'BNB 出现异常资金流入，AI 模型提示关注但暂无明确方向。', tags: ['AI', '异动', '关注'], subscribers: 1840, hit: false, ttl: 720 },
  { id: 'sig-007', type: 'entry', priority: 'high', symbol: 'BTC/USDT', side: 'short', price: 68520, target: 64200, stopLoss: 70800, confidence: 74, source: 'QuantPro Research', strategy: 'DeltaTrend 趋势跟踪 v3', publishedAt: '2026-07-19 08:24', description: '1H 顶背离 + RSI 73，短线做空信号。', tags: ['短线', '背离', 'RSI'], subscribers: 2180, hit: true, result: 3.2, ttl: 120 },
  { id: 'sig-008', type: 'rebalance', priority: 'medium', symbol: 'ETH/USDT', side: 'long', price: 3278, target: 3680, stopLoss: 3140, confidence: 76, source: 'ZSDEX 官方实验室', strategy: 'AlphaGrid 现货网格 Pro', publishedAt: '2026-07-19 08:08', description: 'ETH 网格区间下沿，建议加大现货买入比例。', tags: ['网格', '再平衡', 'ETH'], subscribers: 4280, hit: true, result: 4.2, ttl: 480 },
];

const COPIES: Copy[] = [
  { id: 'cp-001', strategyId: 's-001', strategyName: 'AlphaGrid 现货网格 Pro', strategyAuthor: 'ZSDEX 官方实验室', mode: 'proportional', status: 'active', allocation: 50000, currentValue: 58420, pnl: 8420, pnlPercent: 16.84, copiedAt: '2026-04-15', updatedAt: '2026-07-19', follower: 'U-7724***', copiedTrades: 1284, winRate: 72.4, maxDrawdown: 6.2, risk: 'balanced', stopCopy: { drawdown: 15, dailyLoss: 5, totalLoss: 20 }, takeProfit: { target: 50, partial: [20, 30] } },
  { id: 'cp-002', strategyId: 's-002', strategyName: 'DeltaTrend 趋势跟踪 v3', strategyAuthor: 'QuantPro Research', mode: 'multiplier', status: 'active', allocation: 100000, currentValue: 142840, pnl: 42840, pnlPercent: 42.84, copiedAt: '2026-02-08', updatedAt: '2026-07-19', follower: 'U-8821***', copiedTrades: 248, winRate: 58.2, maxDrawdown: 14.4, risk: 'aggressive', stopCopy: { drawdown: 25, dailyLoss: 8, totalLoss: 35 }, takeProfit: { target: 100, partial: [30, 50] } },
  { id: 'cp-003', strategyId: 's-003', strategyName: 'ArbitrageX 跨所套利', strategyAuthor: 'AlphaLab Studio', mode: 'fixed-amount', status: 'active', allocation: 200000, currentValue: 211840, pnl: 11840, pnlPercent: 5.92, copiedAt: '2026-01-20', updatedAt: '2026-07-19', follower: 'U-6654***', copiedTrades: 1842, winRate: 96.8, maxDrawdown: 0.8, risk: 'conservative', stopCopy: { drawdown: 5, dailyLoss: 2, totalLoss: 10 }, takeProfit: { target: 20, partial: [10, 15] } },
  { id: 'cp-004', strategyId: 's-004', strategyName: 'MarketMaker Z 做市商', strategyAuthor: 'ZSDEX 官方', mode: 'proportional', status: 'active', allocation: 500000, currentValue: 538400, pnl: 38400, pnlPercent: 7.68, copiedAt: '2025-12-08', updatedAt: '2026-07-19', follower: 'U-1245***', copiedTrades: 12840, winRate: 88.4, maxDrawdown: 3.2, risk: 'balanced', stopCopy: { drawdown: 10, dailyLoss: 3, totalLoss: 15 }, takeProfit: { target: 30, partial: [15, 25] } },
  { id: 'cp-005', strategyId: 's-005', strategyName: 'DCA Pro 定投增强', strategyAuthor: 'ZSDEX 官方', mode: 'mirror', status: 'active', allocation: 20000, currentValue: 22840, pnl: 2840, pnlPercent: 14.2, copiedAt: '2026-05-12', updatedAt: '2026-07-19', follower: 'U-9961***', copiedTrades: 8, winRate: 87.5, maxDrawdown: 4.2, risk: 'conservative', stopCopy: { drawdown: 10, dailyLoss: 3, totalLoss: 15 }, takeProfit: { target: 30, partial: [10, 20] } },
  { id: 'cp-006', strategyId: 's-010', strategyName: 'ML-AI 多因子模型', strategyAuthor: 'ZSDEX AI Lab', mode: 'multiplier', status: 'paused', allocation: 80000, currentValue: 102480, pnl: 22480, pnlPercent: 28.1, copiedAt: '2026-03-08', updatedAt: '2026-07-08', follower: 'U-3374***', copiedTrades: 248, winRate: 64.2, maxDrawdown: 12.4, risk: 'aggressive', stopCopy: { drawdown: 20, dailyLoss: 6, totalLoss: 30 }, takeProfit: { target: 80, partial: [25, 40] } },
  { id: 'cp-007', strategyId: 's-006', strategyName: 'MomentumX 动量轮动', strategyAuthor: 'QuantPro Research', mode: 'proportional', status: 'stopped', allocation: 60000, currentValue: 78420, pnl: 18420, pnlPercent: 30.7, copiedAt: '2026-01-08', updatedAt: '2026-06-12', follower: 'U-7765***', copiedTrades: 18, winRate: 72.2, maxDrawdown: 18.4, risk: 'aggressive', stopCopy: { drawdown: 25, dailyLoss: 8, totalLoss: 35 }, takeProfit: { target: 60, partial: [20, 30] } },
];

const TOURNAMENTS: Tournament[] = [
  {
    id: 't-001',
    name: '2026 Q3 量化夏季赛',
    status: 'registration',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    registrationDeadline: '2026-07-28',
    category: '综合策略',
    participants: 128,
    maxParticipants: 256,
    prizePool: 200000,
    currency: 'USDT',
    entryFee: 0,
    rules: ['策略需在 ZSDEX 平台运行', '使用平台账户净值排名', '禁止恶意刷量、对倒', '接受平台审计', '比赛期间不得人工干预'],
    judges: ['ZSDEX 量化实验室', 'QuantPro Research', 'AlphaLab Studio', '社区代表 2 名'],
    sponsors: ['ZSDEX', 'QuantPro', 'AlphaLab', '慢雾科技', 'CertiK'],
    rounds: [
      { name: '报名阶段', startDate: '2026-07-15', endDate: '2026-07-28', description: '提交策略与回测报告' },
      { name: '预选赛', startDate: '2026-08-01', endDate: '2026-08-15', description: '前 64 进入正赛' },
      { name: '正赛', startDate: '2026-08-16', endDate: '2026-09-15', description: '前 32 强对决赛' },
      { name: '决赛', startDate: '2026-09-16', endDate: '2026-09-30', description: '前 8 强最终排名' },
    ],
    currentRound: 0,
    description: 'ZSDEX 平台最大规模量化赛事，吸引全球量化团队参与，奖金池 20 万 USDT。',
    requirements: ['完成 KYC 高级认证', '提交策略回测报告', '最低 1 万 USDT 账户', '接受审计'],
    awards: [
      { rank: '冠军', prize: 80000, perks: ['平台官方认证', '首页推荐', '30 万 USDT 种子资金'] },
      { rank: '亚军', prize: 40000, perks: ['平台官方认证', '首页推荐', '20 万 USDT 种子资金'] },
      { rank: '季军', prize: 20000, perks: ['平台官方认证', '首页推荐'] },
      { rank: '4-8 名', prize: 8000, perks: ['平台官方认证'] },
    ],
  },
  {
    id: 't-002',
    name: '永续合约做市挑战赛',
    status: 'live',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    registrationDeadline: '2026-06-25',
    category: '做市策略',
    participants: 64,
    maxParticipants: 64,
    prizePool: 80000,
    currency: 'USDT',
    entryFee: 5000,
    rules: ['仅做市策略参赛', 'Maker 成交占比需 ≥ 70%', '最低做市时长 20 天', '接受审计'],
    judges: ['ZSDEX 永续实验室', 'PacificNode Pte Ltd'],
    sponsors: ['ZSDEX', 'PacificNode'],
    rounds: [
      { name: '已开赛', startDate: '2026-07-01', endDate: '2026-07-31', description: '单循环赛制' },
    ],
    currentRound: 0,
    description: '专注永续做市策略的对决，奖金池 8 万 USDT，参赛资格审核制。',
    requirements: ['机构账户', '5 万 USDT 保证金', 'Maker 成交经验'],
    awards: [
      { rank: '冠军', prize: 40000, perks: ['官方做市商资质'] },
      { rank: '亚军', prize: 24000, perks: ['官方做市商资质'] },
      { rank: '季军', prize: 16000, perks: ['做市商面试机会'] },
    ],
  },
  {
    id: 't-003',
    name: '2026 量化新星赛',
    status: 'upcoming',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    registrationDeadline: '2026-09-25',
    category: '新人赛事',
    participants: 0,
    maxParticipants: 128,
    prizePool: 30000,
    currency: 'USDT',
    entryFee: 0,
    rules: ['注册平台账号 ≤ 6 个月', '策略为本人原创', '禁止使用现成付费策略', '接受平台审计'],
    judges: ['ZSDEX 学院', '社区 KOL 3 名'],
    sponsors: ['ZSDEX 学院', '社区'],
    rounds: [
      { name: '报名', startDate: '2026-09-15', endDate: '2026-09-25', description: '提交报名表' },
      { name: '海选', startDate: '2026-10-01', endDate: '2026-10-31', description: '回测 + 模拟盘' },
      { name: '决赛', startDate: '2026-11-01', endDate: '2026-11-30', description: '实盘对决' },
    ],
    currentRound: 0,
    description: '面向新注册用户的量化赛事，奖金 3 万 USDT，挖掘量化新星。',
    requirements: ['注册 ≤ 6 个月', '本人原创策略', 'KYC 高级认证'],
    awards: [
      { rank: '冠军', prize: 15000, perks: ['官方推荐位', '免费 API'] },
      { rank: '亚军', prize: 8000, perks: ['官方推荐位'] },
      { rank: '季军', prize: 4000, perks: ['社区达人认证'] },
    ],
  },
  {
    id: 't-004',
    name: '2026 Q1 冬季赛（已结束）',
    status: 'ended',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    registrationDeadline: '2025-12-28',
    category: '综合策略',
    participants: 96,
    maxParticipants: 96,
    prizePool: 100000,
    currency: 'USDT',
    entryFee: 0,
    rules: ['综合类策略', '实盘对决', '接受审计'],
    judges: ['ZSDEX 实验室', 'QuantPro', 'AlphaLab'],
    sponsors: ['ZSDEX', 'QuantPro', 'AlphaLab'],
    rounds: [
      { name: '已结束', startDate: '2026-01-01', endDate: '2026-02-28', description: '比赛已结束' },
    ],
    currentRound: 0,
    description: '2026 第一季度冬季赛，冠军 - 量化新锐 "北极星团队"，APY 184%。',
    requirements: ['历史赛事经验'],
    awards: [
      { rank: '冠军', prize: 50000, perks: ['北极星团队', 'APY 184%'] },
      { rank: '亚军', prize: 25000, perks: ['启明星团队'] },
      { rank: '季军', prize: 15000, perks: ['猎户座团队'] },
    ],
  },
];

const DEV_TOOLS: DevToolInfo[] = [
  { id: 'ide', name: 'QuantIDE 策略编辑器', description: '在线 Web IDE，支持 Python/TypeScript，内置量化函数库与回测集成。', category: 'editor', version: 'v3.4.2', features: ['代码高亮', '自动补全', '实时回测', 'Git 集成', '多人协作'], pricing: '免费', users: 8240, onlineUsers: 1240, releases: [{ version: 'v3.4.2', date: '2026-07-12', highlights: ['AI 代码助手', '策略模板 200+'] }], icon: 'code' },
  { id: 'backtest', name: 'BacktestX 回测引擎', description: '高性能回测引擎，支持多线程回测、Tick 级数据、自定义指标。', category: 'testing', version: 'v2.8.1', features: ['Tick 数据', '多线程', '200+ 指标', '蒙特卡洛', '过拟合检测'], pricing: '免费', users: 6280, onlineUsers: 480, releases: [{ version: 'v2.8.1', date: '2026-07-08', highlights: ['蒙特卡洛模拟'] }], icon: 'history' },
  { id: 'paper', name: 'PaperTrade 模拟盘', description: '实时行情模拟交易，零风险验证策略，支持 1 分钟级精度。', category: 'testing', version: 'v1.6.4', features: ['实时行情', '多账户', '滑点模拟', '手续费计算', '业绩报告'], pricing: '免费', users: 4280, onlineUsers: 380, releases: [{ version: 'v1.6.4', date: '2026-07-15', highlights: ['多账户'] }], icon: 'flask' },
  { id: 'live', name: 'LiveTrade 实盘执行', description: '实盘策略执行引擎，支持多交易所、多种订单类型、智能风控。', category: 'execution', version: 'v4.2.0', features: ['多交易所', '智能风控', '容灾切换', '实时监控', 'API 完整'], pricing: '按交易量', users: 2480, onlineUsers: 620, releases: [{ version: 'v4.2.0', date: '2026-07-10', highlights: ['容灾切换'] }], icon: 'zap' },
  { id: 'monitor', name: 'QuantMonitor 监控告警', description: '实时监控策略表现，多通道告警，自定义监控指标。', category: 'analytics', version: 'v2.1.8', features: ['实时监控', '多通道告警', '自定义指标', '邮件/短信/Telegram', '日报推送'], pricing: '免费', users: 3280, onlineUsers: 480, releases: [{ version: 'v2.1.8', date: '2026-07-12', highlights: ['Telegram 集成'] }], icon: 'activity' },
  { id: 'optimize', name: 'AI Optimize 参数优化', description: 'AI 驱动的参数寻优，遗传算法 + 贝叶斯优化 + Walk-forward。', category: 'analytics', version: 'v1.4.2', features: ['遗传算法', '贝叶斯优化', 'Walk-forward', '过拟合检测', '多目标优化'], pricing: '高级订阅', users: 1240, onlineUsers: 180, releases: [{ version: 'v1.4.2', date: '2026-07-08', highlights: ['多目标优化'] }], icon: 'target' },
];

const PERFORMANCES: Performance[] = [
  { id: 'pf-001', strategy: 'AlphaGrid 现货网格 Pro', category: '现货网格', period: '30d', apy: 28.4, sharpe: 2.4, sortino: 3.2, maxDrawdown: 8.2, volatility: 14.2, winRate: 72.4, profitFactor: 2.8, totalTrades: 1482, avgTrade: 0.42, bestTrade: 8.4, worstTrade: -3.2, consecutiveWins: 18, consecutiveLosses: 4, calmar: 3.4, updatedAt: '2026-07-19' },
  { id: 'pf-002', strategy: 'DeltaTrend 趋势跟踪 v3', category: '趋势策略', period: '30d', apy: 62.4, sharpe: 1.8, sortino: 2.4, maxDrawdown: 18.6, volatility: 32.4, winRate: 58.2, profitFactor: 2.2, totalTrades: 124, avgTrade: 1.84, bestTrade: 24.4, worstTrade: -8.4, consecutiveWins: 8, consecutiveLosses: 5, calmar: 3.4, updatedAt: '2026-07-19' },
  { id: 'pf-003', strategy: 'ArbitrageX 跨所套利', category: '套利策略', period: '30d', apy: 12.8, sharpe: 4.2, sortino: 6.4, maxDrawdown: 1.4, volatility: 4.2, winRate: 96.8, profitFactor: 8.4, totalTrades: 842, avgTrade: 0.14, bestTrade: 0.8, worstTrade: -0.2, consecutiveWins: 84, consecutiveLosses: 2, calmar: 9.2, updatedAt: '2026-07-19' },
  { id: 'pf-004', strategy: 'MarketMaker Z 做市商', category: '做市策略', period: '30d', apy: 18.2, sharpe: 3.6, sortino: 4.8, maxDrawdown: 4.2, volatility: 8.4, winRate: 88.4, profitFactor: 4.2, totalTrades: 12840, avgTrade: 0.08, bestTrade: 0.4, worstTrade: -0.2, consecutiveWins: 248, consecutiveLosses: 8, calmar: 4.2, updatedAt: '2026-07-19' },
  { id: 'pf-005', strategy: 'DCA Pro 定投增强', category: '定投策略', period: '30d', apy: 8.4, sharpe: 2.8, sortino: 3.6, maxDrawdown: 6.4, volatility: 12.4, winRate: 84.2, profitFactor: 3.4, totalTrades: 12, avgTrade: 0.84, bestTrade: 4.2, worstTrade: -2.4, consecutiveWins: 6, consecutiveLosses: 2, calmar: 1.4, updatedAt: '2026-07-19' },
  { id: 'pf-006', strategy: 'MomentumX 动量轮动', category: '轮动策略', period: '30d', apy: 38.4, sharpe: 1.6, sortino: 2.2, maxDrawdown: 22.4, volatility: 38.4, winRate: 62.4, profitFactor: 2.0, totalTrades: 24, avgTrade: 1.84, bestTrade: 12.4, worstTrade: -8.4, consecutiveWins: 5, consecutiveLosses: 3, calmar: 1.6, updatedAt: '2026-07-19' },
  { id: 'pf-007', strategy: 'ML-AI 多因子模型', category: '机器学习', period: '30d', apy: 48.4, sharpe: 2.2, sortino: 2.8, maxDrawdown: 16.2, volatility: 28.4, winRate: 66.4, profitFactor: 2.4, totalTrades: 428, avgTrade: 0.48, bestTrade: 8.4, worstTrade: -4.2, consecutiveWins: 12, consecutiveLosses: 4, calmar: 2.8, updatedAt: '2026-07-19' },
  { id: 'pf-008', strategy: 'HFT Scalper 高频剥头皮', category: '高频策略', period: '30d', apy: 42.8, sharpe: 1.4, sortino: 1.8, maxDrawdown: 28.4, volatility: 48.4, winRate: 84.2, profitFactor: 1.8, totalTrades: 18420, avgTrade: 0.04, bestTrade: 1.2, worstTrade: -0.8, consecutiveWins: 84, consecutiveLosses: 8, calmar: 1.4, updatedAt: '2026-07-19' },
  { id: 'pf-009', strategy: 'OptionStraddle 期权跨式', category: '期权策略', period: '30d', apy: 24.2, sharpe: 1.8, sortino: 2.4, maxDrawdown: 16.4, volatility: 22.4, winRate: 64.2, profitFactor: 2.2, totalTrades: 24, avgTrade: 2.4, bestTrade: 18.4, worstTrade: -8.4, consecutiveWins: 4, consecutiveLosses: 2, calmar: 1.4, updatedAt: '2026-07-19' },
  { id: 'pf-010', strategy: 'FundingRate 资金费率套利', category: '套利策略', period: '30d', apy: 9.8, sharpe: 5.2, sortino: 8.4, maxDrawdown: 0.8, volatility: 2.4, winRate: 98.4, profitFactor: 12.4, totalTrades: 124, avgTrade: 0.18, bestTrade: 0.4, worstTrade: -0.04, consecutiveWins: 124, consecutiveLosses: 0, calmar: 12.2, updatedAt: '2026-07-19' },
];

// ============== 工具函数 ==============

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function formatCurrency(n: number, currency = 'USDT'): string {
  return `${formatNumber(n)} ${currency}`;
}

function formatPercent(n: number, decimals = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

function formatPnl(n: number, currency = 'USDT'): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatNumber(Math.abs(n))} ${currency}`;
}

function timeAgo(dateStr: string): string {
  // 简化版：直接显示
  return dateStr.split(' ')[1] || dateStr;
}

// ============== P3.40 v2 Mock 数据：沙盒回测 ==============

const BACKTEST_RUNS: BacktestRun[] = [
  {
    id: 'bt-001',
    strategyId: 's-001',
    strategyName: 'AlphaGrid 现货网格 Pro',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 268420,
    totalReturn: 168.42,
    annualizedReturn: 64.8,
    sharpe: 2.42,
    sortino: 3.18,
    calmar: 7.9,
    maxDrawdown: 8.2,
    volatility: 18.4,
    winRate: 72.4,
    totalTrades: 14820,
    avgTrade: 24.6,
    bestTrade: 1842,
    worstTrade: -824,
    longestDD: 28,
    recoveryDays: 14,
    progress: 100,
    createdAt: '2026-07-19 10:24',
    runtimeSec: 42,
    parameters: [
      { key: 'gridCount', label: '网格数量', value: 50, min: 10, max: 200, step: 5, unit: '格', hint: '网格越密，触发越频繁' },
      { key: 'lowerBound', label: '下沿价格', value: 58000, min: 30000, max: 90000, step: 500, unit: 'USDT', hint: 'BTC 网格下沿' },
      { key: 'upperBound', label: '上沿价格', value: 78000, min: 50000, max: 120000, step: 500, unit: 'USDT', hint: 'BTC 网格上沿' },
      { key: 'orderSize', label: '单格下单', value: 200, min: 50, max: 5000, step: 50, unit: 'USDT', hint: '每格委托金额' },
      { key: 'rebalance', label: '再平衡阈值', value: 5, min: 1, max: 20, step: 0.5, unit: '%', hint: '偏离阈值触发再平衡' },
    ],
    equity: [
      { date: '2024-01', value: 100000 }, { date: '2024-04', value: 118420 }, { date: '2024-07', value: 132480 },
      { date: '2024-10', value: 148200 }, { date: '2025-01', value: 162840 }, { date: '2025-04', value: 184280 },
      { date: '2025-07', value: 208420 }, { date: '2025-10', value: 228400 }, { date: '2026-01', value: 248400 },
      { date: '2026-04', value: 258400 }, { date: '2026-07', value: 268420 },
    ],
  },
  {
    id: 'bt-002',
    strategyId: 's-002',
    strategyName: 'DeltaTrend 趋势跟踪 v3',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 386420,
    totalReturn: 286.42,
    annualizedReturn: 96.4,
    sharpe: 1.84,
    sortino: 2.42,
    calmar: 5.2,
    maxDrawdown: 18.6,
    volatility: 32.4,
    winRate: 58.2,
    totalTrades: 4280,
    avgTrade: 84.2,
    bestTrade: 8240,
    worstTrade: -4280,
    longestDD: 56,
    recoveryDays: 28,
    progress: 100,
    createdAt: '2026-07-18 16:42',
    runtimeSec: 68,
    parameters: [
      { key: 'fastMa', label: '快线周期', value: 8, min: 3, max: 30, step: 1, unit: '周期', hint: 'EMA 快线' },
      { key: 'slowMa', label: '慢线周期', value: 34, min: 10, max: 100, step: 1, unit: '周期', hint: 'EMA 慢线' },
      { key: 'atrMult', label: 'ATR 止损倍数', value: 2.4, min: 1, max: 5, step: 0.1, unit: 'x', hint: '动态止损' },
      { key: 'leverage', label: '杠杆', value: 3, min: 1, max: 10, step: 1, unit: 'x', hint: '合约杠杆' },
    ],
    equity: [
      { date: '2024-01', value: 100000 }, { date: '2024-04', value: 124800 }, { date: '2024-07', value: 148200 },
      { date: '2024-10', value: 138400 }, { date: '2025-01', value: 184200 }, { date: '2025-04', value: 228400 },
      { date: '2025-07', value: 268400 }, { date: '2025-10', value: 312800 }, { date: '2026-01', value: 348400 },
      { date: '2026-04', value: 372400 }, { date: '2026-07', value: 386420 },
    ],
  },
  {
    id: 'bt-003',
    strategyId: 's-003',
    strategyName: 'ArbitrageX 跨所套利',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 116200,
    totalReturn: 16.2,
    annualizedReturn: 5.4,
    sharpe: 4.2,
    sortino: 6.8,
    calmar: 11.6,
    maxDrawdown: 1.4,
    volatility: 2.8,
    winRate: 96.8,
    totalTrades: 8420,
    avgTrade: 4.2,
    bestTrade: 184,
    worstTrade: -42,
    longestDD: 8,
    recoveryDays: 4,
    progress: 100,
    createdAt: '2026-07-17 09:18',
    runtimeSec: 124,
    parameters: [
      { key: 'spreadThreshold', label: '套利阈值', value: 0.18, min: 0.05, max: 1.0, step: 0.01, unit: '%', hint: '跨所价差阈值' },
      { key: 'capitalPerLeg', label: '单腿资金', value: 50000, min: 5000, max: 500000, step: 1000, unit: 'USDT', hint: '单条腿分配资金' },
      { key: 'slippage', label: '滑点容忍', value: 0.05, min: 0.01, max: 0.5, step: 0.01, unit: '%', hint: '最大可接受滑点' },
    ],
    equity: [
      { date: '2024-01', value: 100000 }, { date: '2024-04', value: 101400 }, { date: '2024-07', value: 102800 },
      { date: '2024-10', value: 104200 }, { date: '2025-01', value: 105600 }, { date: '2025-04', value: 108400 },
      { date: '2025-07', value: 111200 }, { date: '2025-10', value: 113200 }, { date: '2026-01', value: 114800 },
      { date: '2026-04', value: 115400 }, { date: '2026-07', value: 116200 },
    ],
  },
  {
    id: 'bt-004',
    strategyId: 's-010',
    strategyName: 'ML-AI 多因子模型',
    status: 'running',
    startDate: '2024-06-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 348600,
    totalReturn: 248.6,
    annualizedReturn: 124.8,
    sharpe: 2.18,
    sortino: 2.84,
    calmar: 7.6,
    maxDrawdown: 16.2,
    volatility: 38.4,
    winRate: 66.4,
    totalTrades: 4280,
    avgTrade: 58.2,
    bestTrade: 4280,
    worstTrade: -1840,
    longestDD: 32,
    recoveryDays: 18,
    progress: 68,
    createdAt: '2026-07-19 11:08',
    runtimeSec: 0,
    parameters: [
      { key: 'lstmUnits', label: 'LSTM 单元', value: 128, min: 32, max: 512, step: 32, unit: '个', hint: '隐藏层维度' },
      { key: 'lookback', label: '回看窗口', value: 60, min: 10, max: 240, step: 5, unit: '天', hint: '历史窗口长度' },
      { key: 'factorCount', label: '因子数量', value: 24, min: 5, max: 80, step: 1, unit: '个', hint: '特征因子' },
      { key: 'retrainFreq', label: '重训频率', value: 7, min: 1, max: 30, step: 1, unit: '天', hint: '模型重训周期' },
    ],
    equity: [
      { date: '2024-06', value: 100000 }, { date: '2024-09', value: 118400 }, { date: '2024-12', value: 142800 },
      { date: '2025-03', value: 168400 }, { date: '2025-06', value: 198400 }, { date: '2025-09', value: 228400 },
      { date: '2025-12', value: 268400 }, { date: '2026-03', value: 308400 }, { date: '2026-07', value: 348600 },
    ],
  },
  {
    id: 'bt-005',
    strategyId: 's-006',
    strategyName: 'MomentumX 动量轮动',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 224800,
    totalReturn: 124.8,
    annualizedReturn: 52.4,
    sharpe: 1.62,
    sortino: 2.04,
    calmar: 2.34,
    maxDrawdown: 22.4,
    volatility: 28.4,
    winRate: 62.4,
    totalTrades: 248,
    avgTrade: 904,
    bestTrade: 18420,
    worstTrade: -8240,
    longestDD: 64,
    recoveryDays: 42,
    progress: 100,
    createdAt: '2026-07-15 14:24',
    runtimeSec: 28,
    parameters: [
      { key: 'topN', label: '持仓数量', value: 5, min: 2, max: 20, step: 1, unit: '个', hint: 'Top N 动量币种' },
      { key: 'rebalanceDays', label: '调仓周期', value: 7, min: 1, max: 30, step: 1, unit: '天', hint: '调仓频率' },
      { key: 'momWindow', label: '动量窗口', value: 30, min: 5, max: 120, step: 5, unit: '天', hint: '动量计算窗口' },
    ],
    equity: [
      { date: '2024-01', value: 100000 }, { date: '2024-04', value: 112400 }, { date: '2024-07', value: 128400 },
      { date: '2024-10', value: 108400 }, { date: '2025-01', value: 138400 }, { date: '2025-04', value: 162400 },
      { date: '2025-07', value: 184400 }, { date: '2025-10', value: 198400 }, { date: '2026-01', value: 208400 },
      { date: '2026-04', value: 218400 }, { date: '2026-07', value: 224800 },
    ],
  },
  {
    id: 'bt-006',
    strategyId: 's-011',
    strategyName: 'Pionex 网格基础版',
    status: 'queued',
    startDate: '2024-01-01',
    endDate: '2026-07-19',
    initialCapital: 100000,
    finalEquity: 0,
    totalReturn: 0,
    annualizedReturn: 0,
    sharpe: 0,
    sortino: 0,
    calmar: 0,
    maxDrawdown: 0,
    volatility: 0,
    winRate: 0,
    totalTrades: 0,
    avgTrade: 0,
    bestTrade: 0,
    worstTrade: 0,
    longestDD: 0,
    recoveryDays: 0,
    progress: 0,
    createdAt: '2026-07-19 11:24',
    runtimeSec: 0,
    parameters: [
      { key: 'gridCount', label: '网格数量', value: 20, min: 5, max: 100, step: 5, unit: '格', hint: '基础版固定参数' },
    ],
    equity: [],
  },
];

// ============== P3.40 v2 Mock 数据：沙盒回测 ==============

const BACKTESTS: BacktestRun[] = [
  {
    id: 'bt-001',
    strategyId: 's-001',
    strategyName: 'AlphaGrid 现货网格 Pro',
    status: 'completed',
    startDate: '2025-07-01',
    endDate: '2026-07-01',
    initialCapital: 100000,
    finalEquity: 184200,
    totalReturn: 84.2,
    annualizedReturn: 84.2,
    sharpe: 2.84,
    sortino: 3.42,
    calmar: 1.96,
    maxDrawdown: 12.4,
    volatility: 18.6,
    winRate: 72.4,
    totalTrades: 14820,
    avgTrade: 5.68,
    bestTrade: 8420,
    worstTrade: -2840,
    longestDD: 18,
    recoveryDays: 6,
    progress: 100,
    createdAt: '2026-07-15 14:22',
    runtimeSec: 42,
    parameters: [
      { key: 'gridCount', label: '网格数量', value: 30, min: 5, max: 100, step: 5, unit: '格', hint: '网格越密触发越频繁' },
      { key: 'leverage', label: '杠杆倍数', value: 2, min: 1, max: 5, step: 1, unit: 'x', hint: '基础版建议 1-3x' },
      { key: 'rebalance', label: '再平衡阈值', value: 5, min: 1, max: 20, step: 1, unit: '%', hint: '触发调仓' },
    ],
    equity: [
      { date: '2025-07', value: 100000 },
      { date: '2025-08', value: 108400 },
      { date: '2025-09', value: 112800 },
      { date: '2025-10', value: 124200 },
      { date: '2025-11', value: 132400 },
      { date: '2025-12', value: 138200 },
      { date: '2026-01', value: 142800 },
      { date: '2026-02', value: 154200 },
      { date: '2026-03', value: 161400 },
      { date: '2026-04', value: 168400 },
      { date: '2026-05', value: 174800 },
      { date: '2026-06', value: 180200 },
      { date: '2026-07', value: 184200 },
    ],
  },
  {
    id: 'bt-002',
    strategyId: 's-002',
    strategyName: 'DeltaTrend 趋势跟踪 v3',
    status: 'completed',
    startDate: '2025-07-01',
    endDate: '2026-07-01',
    initialCapital: 100000,
    finalEquity: 268400,
    totalReturn: 168.4,
    annualizedReturn: 168.4,
    sharpe: 2.12,
    sortino: 2.84,
    calmar: 1.62,
    maxDrawdown: 24.6,
    volatility: 38.4,
    winRate: 58.4,
    totalTrades: 4280,
    avgTrade: 39.32,
    bestTrade: 24840,
    worstTrade: -8420,
    longestDD: 42,
    recoveryDays: 18,
    progress: 100,
    createdAt: '2026-07-12 09:18',
    runtimeSec: 68,
    parameters: [
      { key: 'lookback', label: '回看周期', value: 20, min: 5, max: 60, step: 5, unit: '日', hint: 'EMA 基础周期' },
      { key: 'stopLoss', label: '止损线', value: 8, min: 1, max: 20, step: 1, unit: '%', hint: '建议 5-10%' },
      { key: 'takeProfit', label: '止盈线', value: 24, min: 10, max: 50, step: 2, unit: '%', hint: '建议 15-30%' },
    ],
    equity: [
      { date: '2025-07', value: 100000 },
      { date: '2025-08', value: 96400 },
      { date: '2025-09', value: 118400 },
      { date: '2025-10', value: 142800 },
      { date: '2025-11', value: 168400 },
      { date: '2025-12', value: 184200 },
      { date: '2026-01', value: 198400 },
      { date: '2026-02', value: 224200 },
      { date: '2026-03', value: 238400 },
      { date: '2026-04', value: 244200 },
      { date: '2026-05', value: 258400 },
      { date: '2026-06', value: 264200 },
      { date: '2026-07', value: 268400 },
    ],
  },
  {
    id: 'bt-003',
    strategyId: 's-003',
    strategyName: 'ArbitrageX 跨所套利',
    status: 'running',
    startDate: '2025-09-01',
    endDate: '2026-09-01',
    initialCapital: 100000,
    finalEquity: 112800,
    totalReturn: 12.8,
    annualizedReturn: 14.4,
    sharpe: 4.28,
    sortino: 5.84,
    calmar: 3.42,
    maxDrawdown: 1.8,
    volatility: 6.4,
    winRate: 96.8,
    totalTrades: 18420,
    avgTrade: 0.69,
    bestTrade: 1284,
    worstTrade: -420,
    longestDD: 3,
    recoveryDays: 1,
    progress: 84,
    createdAt: '2026-07-18 16:42',
    runtimeSec: 128,
    parameters: [
      { key: 'spreadMin', label: '最小价差', value: 0.1, min: 0.05, max: 1.0, step: 0.05, unit: '%', hint: '基础版套利阈值' },
      { key: 'maxExposure', label: '单笔上限', value: 5000, min: 1000, max: 20000, step: 1000, unit: 'USDT', hint: '风险控制' },
    ],
    equity: [
      { date: '2025-09', value: 100000 },
      { date: '2025-10', value: 100800 },
      { date: '2025-11', value: 101800 },
      { date: '2025-12', value: 102600 },
      { date: '2026-01', value: 103800 },
      { date: '2026-02', value: 105200 },
      { date: '2026-03', value: 106800 },
      { date: '2026-04', value: 108200 },
      { date: '2026-05', value: 109800 },
      { date: '2026-06', value: 111200 },
      { date: '2026-07', value: 112800 },
    ],
  },
  {
    id: 'bt-004',
    strategyId: 's-004',
    strategyName: 'MeanReversion 均值回归',
    status: 'completed',
    startDate: '2025-10-01',
    endDate: '2026-04-01',
    initialCapital: 50000,
    finalEquity: 64200,
    totalReturn: 28.4,
    annualizedReturn: 56.8,
    sharpe: 1.84,
    sortino: 2.42,
    calmar: 1.24,
    maxDrawdown: 14.8,
    volatility: 22.4,
    winRate: 64.2,
    totalTrades: 2840,
    avgTrade: 5.01,
    bestTrade: 4280,
    worstTrade: -1840,
    longestDD: 28,
    recoveryDays: 12,
    progress: 100,
    createdAt: '2026-06-22 11:18',
    runtimeSec: 36,
    parameters: [
      { key: 'deviation', label: '偏离阈值', value: 2.0, min: 1.0, max: 3.5, step: 0.1, unit: 'σ', hint: '标准差倍数' },
    ],
    equity: [
      { date: '2025-10', value: 50000 },
      { date: '2025-11', value: 52400 },
      { date: '2025-12', value: 54800 },
      { date: '2026-01', value: 56200 },
      { date: '2026-02', value: 58800 },
      { date: '2026-03', value: 61400 },
      { date: '2026-04', value: 64200 },
    ],
  },
];

// ============== P3.40 v2 Mock 数据：业绩归因 ==============

const ATTRIBUTIONS: Attribution[] = [
  {
    strategyId: 's-001',
    strategyName: 'AlphaGrid 现货网格 Pro',
    period: '近 30 日',
    totalPnl: 58420,
    coverage: 96.4,
    slices: [
      { key: 'BTC', label: 'BTC/USDT', contribution: 38.4, pnl: 22440, trades: 4280, winRate: 76.4, color: '#F7931A' },
      { key: 'ETH', label: 'ETH/USDT', contribution: 32.8, pnl: 19160, trades: 3840, winRate: 72.8, color: '#627EEA' },
      { key: 'SOL', label: 'SOL/USDT', contribution: 18.4, pnl: 10750, trades: 2480, winRate: 68.2, color: '#14B881' },
      { key: 'OTHERS', label: '其他', contribution: 10.4, pnl: 6070, trades: 4220, winRate: 64.8, color: '#B0B0B0' },
    ],
  },
  {
    strategyId: 's-002',
    strategyName: 'DeltaTrend 趋势跟踪 v3',
    period: '近 30 日',
    totalPnl: 142840,
    coverage: 98.2,
    slices: [
      { key: 'BTC', label: 'BTC/USDT', contribution: 52.4, pnl: 74840, trades: 1240, winRate: 62.4, color: '#F7931A' },
      { key: 'ETH', label: 'ETH/USDT', contribution: 38.2, pnl: 54560, trades: 1840, winRate: 56.8, color: '#627EEA' },
      { key: 'OTHERS', label: '其他', contribution: 9.4, pnl: 13440, trades: 1200, winRate: 52.4, color: '#B0B0B0' },
    ],
  },
  {
    strategyId: 's-003',
    strategyName: 'ArbitrageX 跨所套利',
    period: '近 30 日',
    totalPnl: 11840,
    coverage: 99.6,
    slices: [
      { key: 'BTC', label: 'BTC/USDT', contribution: 48.4, pnl: 5730, trades: 3240, winRate: 97.2, color: '#F7931A' },
      { key: 'ETH', label: 'ETH/USDT', contribution: 32.4, pnl: 3840, trades: 2840, winRate: 96.8, color: '#627EEA' },
      { key: 'USDC', label: 'USDC/USDT', contribution: 14.2, pnl: 1680, trades: 1840, winRate: 98.4, color: '#2775CA' },
      { key: 'OTHERS', label: '其他', contribution: 5.0, pnl: 590, trades: 500, winRate: 92.4, color: '#B0B0B0' },
    ],
  },
];

const ATTRIBUTION_BY_PERIOD: Record<string, AttributionSlice[]> = {
  's-001': [
    { key: '7d', label: '近 7 日', contribution: 8.4, pnl: 4900, trades: 1240, winRate: 72.4, color: '#14B881' },
    { key: '30d', label: '近 30 日', contribution: 32.4, pnl: 18930, trades: 4280, winRate: 72.4, color: '#44DBF4' },
    { key: '90d', label: '近 90 日', contribution: 38.2, pnl: 22310, trades: 8420, winRate: 70.8, color: '#FFB400' },
    { key: '180d', label: '近 180 日', contribution: 21.0, pnl: 12280, trades: 4280, winRate: 68.4, color: '#A855F7' },
  ],
  's-002': [
    { key: '7d', label: '近 7 日', contribution: 12.4, pnl: 17710, trades: 124, winRate: 64.2, color: '#14B881' },
    { key: '30d', label: '近 30 日', contribution: 42.8, pnl: 61140, trades: 480, winRate: 58.2, color: '#44DBF4' },
    { key: '90d', label: '近 90 日', contribution: 32.4, pnl: 46280, trades: 1480, winRate: 56.4, color: '#FFB400' },
    { key: '180d', label: '近 180 日', contribution: 12.4, pnl: 17710, trades: 2196, winRate: 54.8, color: '#A855F7' },
  ],
};

const ATTRIBUTION_BY_SIGNAL: Record<string, AttributionSlice[]> = {
  's-001': [
    { key: 'entry', label: '入场信号', contribution: 42.4, pnl: 24770, trades: 4280, winRate: 76.4, color: '#14B881' },
    { key: 'exit', label: '出场信号', contribution: 28.4, pnl: 16590, trades: 4280, winRate: 72.4, color: '#44DBF4' },
    { key: 'rebalance', label: '再平衡', contribution: 18.2, pnl: 10630, trades: 1840, winRate: 68.2, color: '#FFB400' },
    { key: 'stop-loss', label: '止损', contribution: 8.4, pnl: 4910, trades: 1240, winRate: 84.2, color: '#F87171' },
    { key: 'take-profit', label: '止盈', contribution: 2.6, pnl: 1520, trades: 180, winRate: 92.4, color: '#A855F7' },
  ],
  's-002': [
    { key: 'entry', label: '入场信号', contribution: 48.4, pnl: 69150, trades: 1240, winRate: 62.4, color: '#14B881' },
    { key: 'exit', label: '出场信号', contribution: 24.2, pnl: 34580, trades: 1240, winRate: 58.2, color: '#44DBF4' },
    { key: 'stop-loss', label: '止损', contribution: 18.4, pnl: 26280, trades: 840, winRate: 78.4, color: '#F87171' },
    { key: 'take-profit', label: '止盈', contribution: 6.4, pnl: 9140, trades: 420, winRate: 88.4, color: '#A855F7' },
    { key: 'alert', label: '关注提示', contribution: 2.6, pnl: 3690, trades: 540, winRate: 64.2, color: '#FFB400' },
  ],
};

const ATTRIBUTION_BY_FACTOR: Record<string, AttributionSlice[]> = {
  's-001': [
    { key: 'volatility', label: '波动率因子', contribution: 32.4, pnl: 18930, trades: 4280, winRate: 72.4, color: '#14B881' },
    { key: 'momentum', label: '动量因子', contribution: 24.8, pnl: 14490, trades: 3840, winRate: 70.2, color: '#44DBF4' },
    { key: 'mean-reversion', label: '均值回归', contribution: 18.4, pnl: 10750, trades: 2480, winRate: 68.4, color: '#FFB400' },
    { key: 'volume', label: '成交量因子', contribution: 14.2, pnl: 8290, trades: 2480, winRate: 66.8, color: '#A855F7' },
    { key: 'sentiment', label: '情绪因子', contribution: 10.2, pnl: 5960, trades: 1740, winRate: 62.4, color: '#F87171' },
  ],
  's-002': [
    { key: 'trend', label: '趋势因子', contribution: 42.4, pnl: 60560, trades: 1240, winRate: 64.2, color: '#14B881' },
    { key: 'momentum', label: '动量因子', contribution: 28.4, pnl: 40560, trades: 1480, winRate: 58.4, color: '#44DBF4' },
    { key: 'volatility', label: '波动率因子', contribution: 18.4, pnl: 26280, trades: 1240, winRate: 54.8, color: '#FFB400' },
    { key: 'volume', label: '成交量因子', contribution: 6.4, pnl: 9140, trades: 184, winRate: 56.4, color: '#A855F7' },
    { key: 'macro', label: '宏观因子', contribution: 4.4, pnl: 6300, trades: 136, winRate: 52.4, color: '#F87171' },
  ],
};

// ============== P3.40 v2 Mock 数据：风险敞口 ==============

const RISK_BUDGET: RiskBudget = {
  total: 100000000,
  used: 62840000,
  remaining: 37160000,
  factors: [
    { factor: 'market', label: '市场风险', exposure: 32400000, contribution: 51.6, limit: 50000000, utilization: 64.8, trend: 'up', color: '#F87171', note: 'BTC/ETH 现货敞口' },
    { factor: 'liquidity', label: '流动性风险', exposure: 12400000, contribution: 19.7, limit: 20000000, utilization: 62.0, trend: 'flat', color: '#FFB400', note: '订单簿深度监控' },
    { factor: 'concentration', label: '集中度风险', exposure: 8400000, contribution: 13.4, limit: 15000000, utilization: 56.0, trend: 'up', color: '#A855F7', note: '前 3 大币种占比' },
    { factor: 'leverage', label: '杠杆风险', exposure: 4800000, contribution: 7.6, limit: 10000000, utilization: 48.0, trend: 'down', color: '#44DBF4', note: '合约综合杠杆' },
    { factor: 'correlation', label: '相关性风险', exposure: 2400000, contribution: 3.8, limit: 5000000, utilization: 48.0, trend: 'flat', color: '#14B881', note: 'BTC-ETH 相关性' },
    { factor: 'tail', label: '尾部风险', exposure: 1600000, contribution: 2.5, limit: 4000000, utilization: 40.0, trend: 'down', color: '#EC4899', note: '黑天鹅事件压力' },
    { factor: 'fx', label: '汇率风险', exposure: 800000, contribution: 1.4, limit: 2000000, utilization: 40.0, trend: 'flat', color: '#F97316', note: 'USDT/USD 离岸' },
  ],
  stress: [
    { id: 'st-001', scenario: 'btc-crash-30', name: 'BTC 单日 -30%', description: 'BTC 单日跌幅 30%，ETH/SOL 跟跌 35%', estimatedLoss: 18420000, estimatedLossPct: 18.4, currentPnl: 38400000, breachLimit: false, recoveryDays: 28, probability: 0.8 },
    { id: 'st-002', scenario: 'eth-crash-40', name: 'ETH 单日 -40%', description: 'ETH 单日跌幅 40%，生态币跟跌 50%', estimatedLoss: 12840000, estimatedLossPct: 12.8, currentPnl: 38400000, breachLimit: false, recoveryDays: 21, probability: 0.6 },
    { id: 'st-003', scenario: 'liquidity-shock', name: '流动性冲击', description: '订单簿深度 -80%，无法及时平仓', estimatedLoss: 8420000, estimatedLossPct: 8.4, currentPnl: 38400000, breachLimit: false, recoveryDays: 14, probability: 1.2 },
    { id: 'st-004', scenario: 'rate-hike', name: '美联储紧急加息', description: '美联储紧急加息 100bp，加密市场普跌 20%', estimatedLoss: 14200000, estimatedLossPct: 14.2, currentPnl: 38400000, breachLimit: false, recoveryDays: 35, probability: 1.4 },
    { id: 'st-005', scenario: 'black-swan', name: '黑天鹅事件', description: '极端不可抗力事件，跨品种普跌 50%', estimatedLoss: 28400000, estimatedLossPct: 28.4, currentPnl: 38400000, breachLimit: true, recoveryDays: 90, probability: 0.2 },
    { id: 'st-006', scenario: 'correlation-break', name: '相关性崩溃', description: 'BTC-ETH 相关性从 0.8 跌至 0.2，套利失效', estimatedLoss: 6200000, estimatedLossPct: 6.2, currentPnl: 38400000, breachLimit: false, recoveryDays: 18, probability: 0.8 },
  ],
  var95: 4280000,
  var99: 8240000,
  expectedShortfall: 12400000,
  concentration: 0.42,
  leverageRatio: 1.84,
};

// ============== P3.40 v2 Mock 数据：互联生态 ==============

const ECOSYSTEM_LINKS: EcosystemLink[] = [
  {
    id: 'link-derivatives',
    name: 'P3.26 衍生品交易中心',
    page: '/portal-preview/derivatives',
    description: '永续合约 / 交割合约 / 期权，为策略提供对冲与杠杆工具',
    status: 'live',
    throughput: 128400,
    unit: '笔/日',
    highlight: '永续 + 永续对冲',
    color: '#F7931A',
  },
  {
    id: 'link-wallet',
    name: 'P3.33 钱包与资产中心',
    page: '/portal-preview/wallet',
    description: '现货 / 合约 / 理财 / NFT 一体化钱包，策略资金一键启用',
    status: 'live',
    throughput: 4820,
    unit: '笔入金/日',
    highlight: '资金自动划转',
    color: '#14B881',
  },
  {
    id: 'link-watchlist',
    name: 'P3.35 自选与行情提醒',
    page: '/portal-preview/watchlist',
    description: '自选币种 / 触发提醒 / 异动监控，为策略提供信号源',
    status: 'live',
    throughput: 2840,
    unit: '条提醒/日',
    highlight: '策略信号联动',
    color: '#44DBF4',
  },
  {
    id: 'link-bridge',
    name: 'P3.30 跨链桥中心',
    page: '/portal-preview/bridge',
    description: '多链资产桥接，为策略提供跨链资金调度',
    status: 'beta',
    throughput: 1240,
    unit: '笔桥接/日',
    highlight: '跨链资金调度',
    color: '#A855F7',
  },
  {
    id: 'link-market',
    name: 'P3.4 现货交易大厅',
    page: '/portal-preview/market',
    description: '现货 / 限价 / 市价，为策略提供基础成交通道',
    status: 'live',
    throughput: 2484000,
    unit: '笔成交/日',
    highlight: '现货成交通道',
    color: '#FFB400',
  },
  {
    id: 'link-api',
    name: 'P3.17 API 开放平台',
    page: '/portal-preview/api-platform',
    description: 'REST / WebSocket API，为策略提供数据与执行接口',
    status: 'live',
    throughput: 12840000,
    unit: '次调用/日',
    highlight: '策略数据源',
    color: '#EC4899',
  },
];

// ============== 子组件 ==============

function KpiCard({ label, value, hint, color, icon: Icon, trend }: { label: string; value: string; hint?: string; color?: string; icon?: React.ElementType; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
        {Icon && <Icon size={16} style={{ color: color || BRAND.primary }} />}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: color || BRAND.text }}>{value}</div>
      {hint && (
        <div className="text-xs mt-1 flex items-center gap-1" style={{ color: trend === 'up' ? BRAND.primary : trend === 'down' ? '#F87171' : BRAND.textMuted }}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {hint}
        </div>
      )}
    </div>
  );
}

function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = value;
    const duration = 800;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (target - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{formatNumber(display, decimals)}{suffix}</span>;
}

// ============== ����� ==============

export function PortalQuant() {
  const [tab, setTab] = useState<Tab>('"'"'overview'"'"');
  const [search, setSearch] = useState('"'"''"'"');
  const [strategyTypeFilter, setStrategyTypeFilter] = useState<StrategyType | '"'"'all'"'"'>('"'"'all'"'"');
  const [strategyRiskFilter, setStrategyRiskFilter] = useState<RiskLevel | '"'"'all'"'"'>('"'"'all'"'"');
  const [strategyStatusFilter, setStrategyStatusFilter] = useState<StrategyStatus | '"\"'all'\"'>('\"'all'\"');
  const [signalPriorityFilter, setSignalPriorityFilter] = useState<SignalPriority | '"\"'all'\"'>('\"'all'\"');
  const [copyStatusFilter, setCopyStatusFilter] = useState<CopyStatus | '"\"'all'\"'>('\"'all'\"');
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState<TournamentStatus | '"\"'all'\"'>('\"'all'\"');
  const [sortBy, setSortBy] = useState<'\"'apy'\"' | '\"'sub'\"' | '\"'sharpe'\"' | '\"'aum'\"' | '\"'updated'\"'>('\"'apy'\"');
  const [sortDir, setSortDir] = useState<'\"'asc'\"' | '\"'desc'\"'>('\"'desc'\"');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('\"'strategist'\"');
  const [applyName, setApplyName] = useState('\"''\"');
  const [applyContact, setApplyContact] = useState('\"''\"');
  const [applyEmail, setApplyEmail] = useState('\"''\"');
  const [applyExperience, setApplyExperience] = useState('\"''\"');
  const [applyStrategy, setApplyStrategy] = useState('\"''\"');
  const [applyRegion, setApplyRegion] = useState('\"'��̫'\"');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalStrategies: 128,
    liveStrategies: 84,
    totalAum: 248000000,
    totalSignals: 4280,
    signals24h: 124,
    copyTraders: 18420,
    copyAum: 168000000,
    totalPnl30d: 38400000,
    avgApy: 28.4,
    tournamentsLive: 2,
    totalPrize: 410000,
    developers: 4280,
    // === P3.40 v2 扩展字段 ===
    backtestRuns30d: 18420,
    attributionCoverage: 96.4,
    riskVaR95: 4280000,
    ecosystemLinks: 6,
  });

  // 实时数据漂移
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((k) => ({
        ...k,
        totalAum: k.totalAum + Math.floor(Math.random() * 100000) - 30000,
        signals24h: k.signals24h + Math.floor(Math.random() * 3),
        copyTraders: k.copyTraders + Math.floor(Math.random() * 5) - 2,
        totalPnl30d: k.totalPnl30d + Math.floor(Math.random() * 20000) - 5000,
        avgApy: Math.max(15, Math.min(40, k.avgApy + (Math.random() - 0.5) * 0.4)),
        backtestRuns30d: k.backtestRuns30d + Math.floor(Math.random() * 4) - 1,
        attributionCoverage: Math.max(90, Math.min(99.8, k.attributionCoverage + (Math.random() - 0.5) * 0.2)),
        riskVaR95: Math.max(3000000, Math.min(6000000, k.riskVaR95 + Math.floor((Math.random() - 0.5) * 80000))),
      }));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // ��ݼ�
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '"'"'/'"'"') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === '"'"'Escape'"'"') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
      } else if (e.key === '"'"'?'"'"') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if (e.key >= '"'"'1'"'"' && e.key <= '"'"'9'"'"') {
        const tabs: Tab[] = ['\"'overview'\"', '\"'marketplace'\"', '\"'signals'\"', '\"'copy'\"', '\"'tournament'\"', '\"'backtest'\"', '\"'attribution'\"', '\"'risk'\"', '\"'linked'\"'];
        setTab(tabs[parseInt(e.key) - 1]);
      }
    };
    window.addEventListener('\"'keydown'\"', handler);
    return () => window.removeEventListener('\"'keydown'\"', handler);
  }, [drawer.open, helpOpen]);

  // ���˲���
  const filteredStrategies = useMemo(() => {
    let list = STRATEGIES;
    if (strategyTypeFilter !== '\"'all'\"') list = list.filter((s) => s.type === strategyTypeFilter);
    if (strategyRiskFilter !== '\"'all'\"') list = list.filter((s) => s.risk === strategyRiskFilter);
    if (strategyStatusFilter !== '\"'all'\"') list = list.filter((s) => s.status === strategyStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.author.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)));
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === '\"'asc'\"' ? 1 : -1;
      switch (sortBy) {
        case '\"'apy'\"': return (a.apy30d - b.apy30d) * dir;
        case '\"'sub'\"': return (a.subscribers - b.subscribers) * dir;
        case '\"'sharpe'\"': return (a.sharpe - b.sharpe) * dir;
        case '\"'aum'\"': return (a.aum - b.aum) * dir;
        case '\"'updated'\"': return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
        default: return 0;
      }
    });
    return list;
  }, [strategyTypeFilter, strategyRiskFilter, strategyStatusFilter, search, sortBy, sortDir]);

  // �����ź�
  const filteredSignals = useMemo(() => {
    let list = SIGNALS;
    if (signalPriorityFilter !== '\"'all'\"') list = list.filter((s) => s.priority === signalPriorityFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.symbol.toLowerCase().includes(q) || s.strategy.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    return list;
  }, [signalPriorityFilter, search]);

  // ���˸���
  const filteredCopies = useMemo(() => {
    let list = COPIES;
    if (copyStatusFilter !== '\"'all'\"') list = list.filter((c) => c.status === copyStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.strategyName.toLowerCase().includes(q) || c.strategyAuthor.toLowerCase().includes(q));
    }
    return list;
  }, [copyStatusFilter, search]);

  // ��������
  const filteredTournaments = useMemo(() => {
    let list = TOURNAMENTS;
    if (tournamentStatusFilter !== '\"'all'\"') list = list.filter((t) => t.status === tournamentStatusFilter);
    return list;
  }, [tournamentStatusFilter]);

  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);

  const openStrategy = (id: string) => setDrawer({ open: true, type: '\"'strategy'\"', payload: id });
  const openSignal = (id: string) => setDrawer({ open: true, type: '\"'signal'\"', payload: id });
  const openCopy = (id: string) => setDrawer({ open: true, type: '\"'copy'\"', payload: id });
  const openTournament = (id: string) => setDrawer({ open: true, type: '\"'tournament'\"', payload: id });
  const openDev = (id: string) => setDrawer({ open: true, type: '\"'dev'\"', payload: id });

  const handleApplySubmit = () => {
    if (applyStep < 3) {
      setApplyStep(applyStep + 1);
    } else {
      setApplyStep(0);
      setApplyName('\"''\"');
      setApplyContact('\"''\"');
      setApplyEmail('\"''\"');
      setApplyExperience('\"''\"');
      setApplyStrategy('\"''\"');
      alert('\"'�������ύ��UI ��ʾ����ʵ��������Թٷ�����Ϊ׼��'\"');
      setTab('\"'overview'\"');
    }
  };

  const tabLabels: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: '总览', icon: Gauge },
    { key: 'marketplace', label: '策略商城', icon: Boxes },
    { key: 'signals', label: '信号订阅', icon: Activity },
    { key: 'copy', label: '跟单做市', icon: CopyIcon },
    { key: 'tournament', label: '量化赛事', icon: Trophy },
    { key: 'backtest', label: '沙盒回测', icon: LineIcon },
    { key: 'attribution', label: '业绩归因', icon: PieIcon },
    { key: 'risk', label: '风险敞口', icon: ShieldAlert },
    { key: 'linked', label: '互联生态', icon: Network },
    { key: 'dev', label: '策略开发', icon: Code2 },
    { key: 'performance', label: '历史业绩', icon: BarChart3 },
    { key: 'apply', label: '申请入驻', icon: UserPlus },
    { key: 'help', label: '帮助', icon: HelpCircle }
  ];

  return (
    <div className=\"min-h-screen\" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pq-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pq-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pq-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pq-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pq-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .pq-stagger > * { animation: pq-fade-up 0.4s ease-out both; }
        .pq-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pq-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pq-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pq-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pq-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pq-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pq-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pq-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pq-pulse { animation: pq-pulse 2.4s ease-in-out infinite; }
        .pq-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pq-shimmer 2.4s linear infinite; }
        .pq-drawer { animation: pq-slide-in 0.28s ease-out; }
        .pq-bar { transform-origin: bottom; animation: pq-bar 0.6s ease-out; }
        .pq-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* ============== Hero ============== */}
      <section className="relative px-6 md:px-10 pt-8 pb-6 pq-stagger" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: BRAND.textMuted }}>
            <span>FrontPortal</span>
            <ChevronRight size={12} />
            <span>交易</span>
            <ChevronRight size={12} />
            <span style={{ color: BRAND.primary }}>量化策略中心</span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: BRAND.text }}>
                量化策略中心
              </h1>
              <p className="text-sm mb-4 max-w-3xl" style={{ color: BRAND.textMuted }}>
                策略研发 / 策略商城 / 信号订阅 / 跟单做市 / 沙盒回测 / 业绩归因 / 风险敞口 / 互联生态 · 一站式量化策略基础设施。与 P3.26 衍生品 + P3.33 钱包 + P3.35 自选行情形成"行情-策略-交易-钱包"自动化闭环。
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                  <span className="w-1.5 h-1.5 rounded-full pq-pulse" style={{ backgroundColor: BRAND.primary }} />
                  实时数据 · {kpi.signals24h} 信号/24h
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.liveStrategies} 个活跃策略
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.copyTraders.toLocaleString()} 跟单用户
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.tournamentsLive} 场进行中赛事
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.backtestRuns30d.toLocaleString()} 次回测/30d
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  VaR(95%) {formatCurrency(kpi.riskVaR95)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <Keyboard size={14} />
                快捷键
              </button>
              <button onClick={() => { setTab('apply'); setApplyStep(0); }} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <UserPlus size={14} />
                申请入驻
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== KPI Cards ============== */}
      <section className="px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 pq-stagger">
          <KpiCard label="策略总数" value={kpi.totalStrategies.toString()} hint={`活跃 ${kpi.liveStrategies}`} icon={Boxes} />
          <KpiCard label="管理资产 (AUM)" value={formatCurrency(kpi.totalAum)} hint="实时波动" color={BRAND.primary} icon={Wallet} trend="up" />
          <KpiCard label="信号订阅" value={kpi.totalSignals.toLocaleString()} hint={`+${kpi.signals24h}/24h`} icon={Activity} trend="up" />
          <KpiCard label="跟单用户" value={kpi.copyTraders.toLocaleString()} hint="活跃跟单" color={BRAND.primary} icon={CopyIcon} />
          <KpiCard label="30日总盈亏" value={formatPnl(kpi.totalPnl30d)} hint="策略实盘" color={BRAND.primary} icon={TrendingUp} trend="up" />
          <KpiCard label="平均年化" value={formatPercent(kpi.avgApy)} hint="策略均值" icon={Target} />
          <KpiCard label="沙盒回测" value={kpi.backtestRuns30d.toLocaleString()} hint="近 30 日" color={BRAND.primary} icon={LineIcon} trend="up" />
          <KpiCard label="业绩归因" value={`${kpi.attributionCoverage.toFixed(1)}%`} hint="覆盖率" color={BRAND.primary} icon={PieIcon} />
          <KpiCard label="VaR(95%)" value={formatCurrency(kpi.riskVaR95)} hint="风险敞口" color="#F87171" icon={ShieldAlert} />
          <KpiCard label="互联生态" value={kpi.ecosystemLinks.toString()} hint="联动页面" color={BRAND.primary} icon={Network} />
        </div>
      </section>

      {/* ============== Tabs ============== */}
      <section className="px-6 md:px-10 py-3 sticky top-0 z-30" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {tabLabels.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? BRAND.card : 'transparent',
                  color: active ? BRAND.primary : BRAND.textMuted,
                  border: `1px solid ${active ? BRAND.primary + '40' : 'transparent'}`,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ============== Tab Content ============== */}
      <main className="px-6 md:px-10 py-6">
        <div className="max-w-7xl mx-auto">
          {tab === 'backtest' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <LineIcon size={18} style={{ color: BRAND.primary }} />
                  沙盒回测 · 历史业绩与参数化探索
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  基于 5 年历史 K 线、Tick 级回放与多周期对账，提供 <strong style={{ color: BRAND.text }}>夏普 / Sortino / Calmar / 最大回撤 / 胜率 / 盈亏比</strong> 等 12 项业绩指标。
                  30 日内已运行 <strong style={{ color: BRAND.primary }}>{kpi.backtestRuns30d.toLocaleString()}</strong> 次沙盒回测。
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '运行中', value: BACKTESTS.filter(b => b.status === 'running').length, color: '#FFB400', icon: Activity },
                  { label: '已完成', value: BACKTESTS.filter(b => b.status === 'completed').length, color: BRAND.primary, icon: CheckCircle2 },
                  { label: '平均年化', value: (BACKTESTS.filter(b => b.status === 'completed').reduce((s, b) => s + b.annualizedReturn, 0) / Math.max(1, BACKTESTS.filter(b => b.status === 'completed').length)).toFixed(1) + '%', color: BRAND.primary, icon: TrendingUp },
                  { label: '平均夏普', value: (BACKTESTS.filter(b => b.status === 'completed').reduce((s, b) => s + b.sharpe, 0) / Math.max(1, BACKTESTS.filter(b => b.status === 'completed').length)).toFixed(2), color: BRAND.info, icon: Gauge },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-1.5 text-[10px] mb-1" style={{ color: BRAND.textMuted }}>
                        <Icon size={12} style={{ color: m.color }} />{m.label}
                      </div>
                      <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {BACKTESTS.map((bt) => {
                  const statusBadge = bt.status === 'completed'
                    ? { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, label: '已完成' }
                    : bt.status === 'running'
                    ? { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', label: '运行中 ' + bt.progress + '%' }
                    : { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMuted, label: '排队中' };
                  return (
                    <div key={bt.id} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{bt.strategyName}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg }}>{statusBadge.label}</span>
                          </div>
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{bt.startDate} ~ {bt.endDate} · 初始 ${bt.initialCapital.toLocaleString()} · 最终 ${bt.finalEquity.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold" style={{ color: BRAND.primary }}>+{bt.totalReturn.toFixed(1)}%</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>年化收益</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                        {[
                          { label: '夏普', value: bt.sharpe.toFixed(2) },
                          { label: 'Sortino', value: bt.sortino.toFixed(2) },
                          { label: 'Calmar', value: bt.calmar.toFixed(2) },
                          { label: '最大回撤', value: bt.maxDrawdown.toFixed(1) + '%' },
                          { label: '胜率', value: bt.winRate.toFixed(1) + '%' },
                          { label: '交易次数', value: bt.totalTrades.toLocaleString() },
                        ].map((m, i) => (
                          <div key={i} className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{m.label}</div>
                            <div className="text-xs font-bold" style={{ color: BRAND.text }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {bt.equity.length > 0 && (
                        <>
                          <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>权益曲线</div>
                          <div className="flex items-end gap-0.5 h-12 mb-2">
                            {bt.equity.map((p, i) => {
                              const min = Math.min(...bt.equity.map(e => e.value));
                              const max = Math.max(...bt.equity.map(e => e.value));
                              const h = ((p.value - min) / (max - min)) * 100;
                              return <div key={i} className="flex-1 rounded-t" style={{ height: h + '%', backgroundColor: BRAND.primary, opacity: 0.6 + (i / bt.equity.length) * 0.4 }} />;
                            })}
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>{bt.totalTrades.toLocaleString()} 笔成交 · {bt.runtimeSec}s 耗时</span>
                        <span onClick={() => setDrawer({ open: true, type: 'parameter', payload: bt.id })} className="text-xs flex items-center gap-1 cursor-pointer" style={{ color: BRAND.primary }}>调节参数 <ChevronRight size={12} /></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMuted }}>
                  <AlertCircle size={14} style={{ color: '#FACC15' }} />
                  <span>回测结果基于历史数据模拟，过往业绩不代表未来表现。沙盒回测仅供方法论演示与参数探索，不构成投资建议。</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'attribution' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <PieIcon size={18} style={{ color: BRAND.primary }} />
                  业绩归因 · 多维度业绩归因拆解
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  按 <strong style={{ color: BRAND.text }}>品种 / 周期 / 信号类型 / 贡献因子</strong> 四维度拆解策略盈亏来源，识别 Alpha 来源。当前归因覆盖率 <strong style={{ color: BRAND.primary }}>{kpi.attributionCoverage.toFixed(1)}%</strong>。
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { key: 'symbol', label: '按品种', icon: Coins },
                  { key: 'period', label: '按周期', icon: Calendar },
                  { key: 'signalType', label: '按信号类型', icon: Activity },
                  { key: 'factor', label: '按贡献因子', icon: Sparkles },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <button key={d.key} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-all" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <Icon size={12} />{d.label}
                    </button>
                  );
                })}
              </div>

              {ATTRIBUTIONS.map((attr) => {
                const max = Math.max(...attr.slices.map(s => s.contribution));
                return (
                  <div key={attr.strategyId} className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{attr.strategyName}</h3>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: BRAND.primary }}>{formatCurrency(attr.totalPnl)}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{attr.period} · 归因覆盖率 {attr.coverage}%</div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {attr.slices.map((s) => (
                        <div key={s.key} className="flex items-center gap-3">
                          <div className="w-20 text-xs" style={{ color: BRAND.text }}>{s.label}</div>
                          <div className="flex-1 h-6 rounded relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full rounded flex items-center px-2" style={{ width: (s.contribution / max) * 100 + '%', backgroundColor: s.color }}>
                              <span className="text-[10px] font-semibold text-white">{s.contribution.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-32 text-right text-xs" style={{ color: BRAND.textMuted }}>
                            <span style={{ color: BRAND.text }}>{formatNumber(s.pnl)}</span> · {s.trades.toLocaleString()} 笔
                          </div>
                          <div className="w-16 text-right text-xs" style={{ color: BRAND.primary }}>{s.winRate.toFixed(1)}% 胜</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMuted }}>
                  <Info size={14} style={{ color: BRAND.primary }} />
                  <span>归因覆盖率 = 已归因盈亏 / 总盈亏，未覆盖部分可能来自手续费、滑点、跨品种对冲等综合因素。</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'risk' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldAlert size={18} style={{ color: '#F87171' }} />
                  风险敞口 · VaR / 压力测试 / 风险预算
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  实时监控 7 大风险因子敞口与 6 类压力场景，提供 <strong style={{ color: BRAND.text }}>VaR(95%) / VaR(99%) / 期望损失 / 集中度 / 杠杆比</strong> 指标。所有风险数据基于历史波动率与相关性估算，仅用于压力测试演示。
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>VaR(95%)</div>
                  <div className="text-xl font-bold" style={{ color: '#F87171' }}>{formatCurrency(RISK_BUDGET.var95)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>1 日最大可能损失</div>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>VaR(99%)</div>
                  <div className="text-xl font-bold" style={{ color: '#F87171' }}>{formatCurrency(RISK_BUDGET.var99)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>极端 1% 场景</div>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>期望损失 (ES)</div>
                  <div className="text-xl font-bold" style={{ color: '#F87171' }}>{formatCurrency(RISK_BUDGET.expectedShortfall)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>尾部平均损失</div>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>杠杆比</div>
                  <div className="text-xl font-bold" style={{ color: '#FFB400' }}>{RISK_BUDGET.leverageRatio}x</div>
                  <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>综合杠杆水平</div>
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Gauge size={16} style={{ color: BRAND.primary }} />
                  风险预算 · 7 大因子敞口
                </h3>
                <div className="space-y-2.5">
                  {RISK_BUDGET.factors.map((f) => (
                    <div key={f.factor} onClick={() => setDrawer({ open: true, type: 'risk-budget', payload: f.factor })} className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                      <div className="w-24 text-xs" style={{ color: BRAND.text }}>{f.label}</div>
                      <div className="flex-1 h-5 rounded relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full rounded" style={{ width: f.utilization + '%', backgroundColor: f.color, opacity: 0.7 }} />
                        <div className="absolute inset-0 flex items-center px-2 text-[10px]" style={{ color: BRAND.text }}>
                          <span>{formatNumber(f.exposure)} / {formatNumber(f.limit)}</span>
                        </div>
                      </div>
                      <div className="w-16 text-right text-xs" style={{ color: f.color }}>{f.utilization.toFixed(0)}%</div>
                      <div className="w-12 text-right">
                        {f.trend === 'up' && <TrendingUp size={14} style={{ color: '#F87171' }} />}
                        {f.trend === 'down' && <TrendingDown size={14} style={{ color: BRAND.primary }} />}
                        {f.trend === 'flat' && <span className="text-xs" style={{ color: BRAND.textMuted }}>—</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>已用 {formatNumber(RISK_BUDGET.used)} / 总额 {formatNumber(RISK_BUDGET.total)} ({((RISK_BUDGET.used/RISK_BUDGET.total)*100).toFixed(0)}%)</span>
                  <button className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看详情 <ChevronRight size={12} /></button>
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <AlertOctagon size={16} style={{ color: '#F87171' }} />
                  压力测试 · 6 类极端场景
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {RISK_BUDGET.stress.map((st) => (
                    <div key={st.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${st.breachLimit ? '#F87171' : BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{st.name}</div>
                        {st.breachLimit && <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#F87171' }}>超限</span>}
                      </div>
                      <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>{st.description}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: '#F87171' }}>预估亏损 {formatNumber(st.estimatedLoss)} (-{st.estimatedLossPct}%)</span>
                        <span style={{ color: BRAND.textMuted }}>恢复 ≈ {st.recoveryDays} 天</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'linked' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Network size={18} style={{ color: BRAND.primary }} />
                  互联生态 · 行情-策略-交易-钱包 自动化闭环
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  量化策略中心与 <strong style={{ color: BRAND.text }}>P3.26 衍生品</strong>（对冲/杠杆）+ <strong style={{ color: BRAND.text }}>P3.33 钱包</strong>（资金启用）+ <strong style={{ color: BRAND.text }}>P3.35 自选行情</strong>（信号源）实时联动，形成"行情-策略-交易-钱包"全自动化工作流。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>1</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>行情监测</div>
                  </div>
                  <div className="text-2xl text-center self-center" style={{ color: BRAND.textMuted }}>→</div>
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>2</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>策略触发</div>
                  </div>
                  <div className="text-2xl text-center self-center" style={{ color: BRAND.textMuted }}>→</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>3</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>交易执行</div>
                  </div>
                  <div className="text-2xl text-center self-center" style={{ color: BRAND.textMuted }}>→</div>
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>4</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>钱包结算</div>
                  </div>
                  <div />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ECOSYSTEM_LINKS.map((link) => {
                  const statusBadge = (() => {
                    if (link.status === 'live') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, label: 'LIVE' };
                    if (link.status === 'beta') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', label: 'BETA' };
                    return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMuted, label: 'READY' };
                  })();
                  return (
                    <div key={link.id} onClick={() => setDrawer({ open: true, type: 'linked', payload: link.id })} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: link.color + '20' }}>
                            <Network size={14} style={{ color: link.color }} />
                          </div>
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{link.name}</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg, border: `1px solid ${statusBadge.fg}40` }}>{statusBadge.label}</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: BRAND.textMuted, minHeight: 32 }}>{link.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: BRAND.text }}>{formatNumber(link.throughput)} {link.unit}</span>
                        <span className="px-2 py-0.5 rounded" style={{ backgroundColor: link.color + '20', color: link.color }}>{link.highlight}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMuted }}>
                  <Info size={14} style={{ color: BRAND.primary }} />
                  <span>互联生态提供 UI 跳转演示，跨页面联动需要登录后开启。在实盘环境下，策略信号触发后将自动调度交易与资金划转。</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* 战略叙事 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Sparkles size={18} style={{ color: BRAND.primary }} />
                  四元协同：现货 - 合约 - 做市 - 量化
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  量化交易中心连接 <strong style={{ color: BRAND.text }}>现货交易大厅</strong>（P3.4）、<strong style={{ color: BRAND.text }}>API 开放平台</strong>（P3.17）、<strong style={{ color: BRAND.text }}>做市商与流动性中心</strong>（P3.25）、<strong style={{ color: BRAND.text }}>衍生品交易中心</strong>（P3.26），形成"现货-合约-做市-量化"四元协同闭环。策略开发者通过 API 接入，调用现货/永续/做市数据源；做市商提供流动性；量化策略提供策略 alpha；用户通过跟单 + 策略订阅实现被动量化收益。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: '策略数量', value: kpi.totalStrategies, suffix: '个' },
                    { label: '管理资产', value: kpi.totalAum, prefix: '$', decimals: 0 },
                    { label: '跟单用户', value: kpi.copyTraders, suffix: '人' },
                    { label: '开发者', value: kpi.developers, suffix: '位' },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>
                        <CountUp value={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} decimals={s.decimals || 0} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 顶级策略 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Crown size={18} style={{ color: BRAND.primary }} />
                    顶级策略 · Top Strategies
                  </h2>
                  <button onClick={() => setTab('marketplace')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pq-stagger">
                  {STRATEGIES.slice(0, 6).map((s) => (
                    <div key={s.id} onClick={() => openStrategy(s.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{s.name}</h3>
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{s.author}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                          {s.authorType === 'official' ? '官方' : s.authorType === 'certified' ? '认证' : '社区'}
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: BRAND.textMuted, minHeight: 32 }}>{s.description.slice(0, 60)}...</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>30日年化</div>
                          <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatPercent(s.apy30d)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>订阅者</div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(s.subscribers)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>夏普</div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.sharpe.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最新信号 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Zap size={18} style={{ color: BRAND.primary }} />
                    最新信号 · Live Signals
                  </h2>
                  <button onClick={() => setTab('signals')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2 pq-stagger">
                  {SIGNALS.slice(0, 4).map((sig) => (
                    <div key={sig.id} onClick={() => openSignal(sig.id)} className="p-3 rounded-lg cursor-pointer flex items-center gap-3 pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{
                        backgroundColor: sig.priority === 'urgent' ? '#DC2626' : sig.priority === 'high' ? `${BRAND.primary}20` : BRAND.bg,
                        color: sig.priority === 'urgent' ? '#fff' : BRAND.primary,
                        border: `1px solid ${sig.priority === 'urgent' ? '#DC2626' : sig.priority === 'high' ? BRAND.primary + '40' : BRAND.border}`,
                      }}>{sig.priority === 'urgent' ? '紧急' : sig.priority === 'high' ? '高' : sig.priority === 'medium' ? '中' : '低'}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{sig.symbol} <span style={{ color: sig.side === 'long' ? BRAND.primary : sig.side === 'short' ? '#F87171' : BRAND.textMuted }}>{sig.side === 'long' ? '做多' : sig.side === 'short' ? '做空' : sig.side === 'close' ? '平仓' : '关注'}</span></div>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{sig.strategy} · {timeAgo(sig.publishedAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{sig.price.toLocaleString()}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>置信度 {sig.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 活跃赛事 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Trophy size={18} style={{ color: BRAND.primary }} />
                    活跃赛事 · Live Tournaments
                  </h2>
                  <button onClick={() => setTab('tournament')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pq-stagger">
                  {TOURNAMENTS.filter((t) => t.status === 'live' || t.status === 'registration').map((t) => (
                    <div key={t.id} onClick={() => openTournament(t.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{t.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: t.status === 'live' ? BRAND.primary : `${BRAND.primary}20`, color: t.status === 'live' ? '#000' : BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                          {t.status === 'live' ? '进行中' : t.status === 'registration' ? '报名中' : '即将开始'}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: BRAND.textMuted }}>{t.description.slice(0, 80)}...</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>奖金池</div>
                          <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatCurrency(t.prizePool, t.currency)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>参赛</div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{t.participants}/{t.maxParticipants}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>类别</div>
                          <div className="text-sm" style={{ color: BRAND.text }}>{t.category}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'marketplace' && (
            <div className="space-y-4">
              {/* 过滤器 */}
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search size={14} style={{ color: BRAND.textMuted }} />
                  <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索策略 / 作者 / 标签" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>类型</span>
                  {(['all', 'grid', 'trend', 'arbitrage', 'market-making', 'mean-reversion', 'dca', 'momentum', 'hft', 'options', 'ml'] as const).map((t) => (
                    <button key={t} onClick={() => setStrategyTypeFilter(t)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: strategyTypeFilter === t ? BRAND.primary : BRAND.bg, color: strategyTypeFilter === t ? '#000' : BRAND.textMuted, border: `1px solid ${strategyTypeFilter === t ? BRAND.primary : BRAND.border}` }}>
                      {t === 'all' ? '全部' : t === 'grid' ? '网格' : t === 'trend' ? '趋势' : t === 'arbitrage' ? '套利' : t === 'market-making' ? '做市' : t === 'mean-reversion' ? '均值回归' : t === 'dca' ? '定投' : t === 'momentum' ? '动量' : t === 'hft' ? '高频' : t === 'options' ? '期权' : 'AI'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>风险</span>
                  {(['all', 'conservative', 'balanced', 'aggressive', 'speculative'] as const).map((r) => (
                    <button key={r} onClick={() => setStrategyRiskFilter(r)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: strategyRiskFilter === r ? BRAND.primary : BRAND.bg, color: strategyRiskFilter === r ? '#000' : BRAND.textMuted, border: `1px solid ${strategyRiskFilter === r ? BRAND.primary : BRAND.border}` }}>
                      {r === 'all' ? '全部' : r === 'conservative' ? '保守' : r === 'balanced' ? '平衡' : r === 'aggressive' ? '激进' : '投机'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>排序</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="apy">年化</option>
                    <option value="sub">订阅者</option>
                    <option value="sharpe">夏普</option>
                    <option value="aum">AUM</option>
                    <option value="updated">更新时间</option>
                  </select>
                  <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1 rounded" style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                    {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* 策略列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pq-stagger">
                {filteredStrategies.map((s) => (
                  <div key={s.id} onClick={() => openStrategy(s.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</h3>
                          {s.status === 'live' && <span className="w-1.5 h-1.5 rounded-full pq-pulse" style={{ backgroundColor: BRAND.primary }} />}
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{s.author}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                          {s.authorType === 'official' ? '官方' : s.authorType === 'certified' ? '认证' : '社区'}
                        </span>
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: BRAND.textMuted }}>
                          <Star size={9} style={{ color: '#FACC15', fill: '#FACC15' }} />
                          {s.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: BRAND.textMuted, minHeight: 36 }}>{s.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {s.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{t}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>30日年化</div>
                        <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatPercent(s.apy30d)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>AUM</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(s.aum)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>订阅者</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(s.subscribers)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs" style={{ color: BRAND.textMuted }}>{s.price > 0 ? `${s.price} USDT/月` : '免费订阅'}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>详情 <ChevronRight size={10} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'signals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search size={14} style={{ color: BRAND.textMuted }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索品种 / 策略 / 描述" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>优先级</span>
                  {(['all', 'urgent', 'high', 'medium', 'low', 'info'] as const).map((p) => (
                    <button key={p} onClick={() => setSignalPriorityFilter(p)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: signalPriorityFilter === p ? BRAND.primary : BRAND.bg, color: signalPriorityFilter === p ? '#000' : BRAND.textMuted, border: `1px solid ${signalPriorityFilter === p ? BRAND.primary : BRAND.border}` }}>
                      {p === 'all' ? '全部' : p === 'urgent' ? '紧急' : p === 'high' ? '高' : p === 'medium' ? '中' : p === 'low' ? '低' : '信息'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pq-stagger">
                {filteredSignals.map((sig) => (
                  <div key={sig.id} onClick={() => openSignal(sig.id)} className="p-4 rounded-xl cursor-pointer pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{
                        backgroundColor: sig.priority === 'urgent' ? '#DC2626' : sig.priority === 'high' ? `${BRAND.primary}20` : BRAND.bg,
                        color: sig.priority === 'urgent' ? '#fff' : BRAND.primary,
                        border: `1px solid ${sig.priority === 'urgent' ? '#DC2626' : sig.priority === 'high' ? BRAND.primary + '40' : BRAND.border}`,
                      }}>
                        {sig.priority === 'urgent' ? '紧急' : sig.priority === 'high' ? '高' : sig.priority === 'medium' ? '中' : sig.priority === 'low' ? '低' : '信息'}
                      </span>
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{sig.symbol}</div>
                      <div className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: sig.side === 'long' ? `${BRAND.primary}20` : sig.side === 'short' ? '#DC262620' : BRAND.bg, color: sig.side === 'long' ? BRAND.primary : sig.side === 'short' ? '#F87171' : BRAND.textMuted, border: `1px solid ${sig.side === 'long' ? BRAND.primary : sig.side === 'short' ? '#DC2626' : BRAND.border}40` }}>
                        {sig.type === 'entry' ? (sig.side === 'long' ? '做多入场' : '做空入场') : sig.type === 'exit' ? '离场' : sig.type === 'rebalance' ? '再平衡' : sig.type === 'stop-loss' ? '止损' : sig.type === 'take-profit' ? '止盈' : '关注'}
                      </div>
                      <div className="flex-1 text-sm" style={{ color: BRAND.textMuted }}>{sig.description}</div>
                      <div className="text-right">
                        <div className="text-base font-mono font-semibold" style={{ color: BRAND.text }}>{sig.price.toLocaleString()}</div>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>置信度 {sig.confidence}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textMuted }}>
                        <span>来源：{sig.source}</span>
                        <span>·</span>
                        <span>策略：{sig.strategy}</span>
                        <span>·</span>
                        <span>{timeAgo(sig.publishedAt)}</span>
                        <span>·</span>
                        <span>{sig.subscribers.toLocaleString()} 订阅</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sig.hit && <span className="text-xs flex items-center gap-0.5" style={{ color: BRAND.primary }}><Check size={10} />命中 {formatPercent(sig.result || 0)}</span>}
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>TTL {sig.ttl}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'copy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>状态</span>
                  {(['all', 'active', 'paused', 'stopped', 'pending'] as const).map((s) => (
                    <button key={s} onClick={() => setCopyStatusFilter(s)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: copyStatusFilter === s ? BRAND.primary : BRAND.bg, color: copyStatusFilter === s ? '#000' : BRAND.textMuted, border: `1px solid ${copyStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'all' ? '全部' : s === 'active' ? '运行中' : s === 'paused' ? '暂停' : s === 'stopped' ? '已停止' : '待处理'}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setTab('marketplace'); }} className="ml-auto px-3 py-1.5 rounded-lg text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                  <UserPlus size={12} />
                  新建跟单
                </button>
              </div>
              <div className="space-y-3 pq-stagger">
                {filteredCopies.map((c) => (
                  <div key={c.id} onClick={() => openCopy(c.id)} className="p-4 rounded-xl cursor-pointer pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{c.strategyName}</h3>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>作者：{c.strategyAuthor} · 跟单者：{c.follower}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>状态</div>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: c.status === 'active' ? BRAND.primary : c.status === 'paused' ? '#FACC15' : BRAND.bg, color: c.status === 'active' ? '#000' : c.status === 'paused' ? '#000' : BRAND.textMuted, border: `1px solid ${c.status === 'active' ? BRAND.primary : c.status === 'paused' ? '#FACC15' : BRAND.border}` }}>
                          {c.status === 'active' ? '运行中' : c.status === 'paused' ? '暂停' : c.status === 'stopped' ? '已停止' : '待处理'}
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>分配</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(c.allocation)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>当前</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(c.currentValue)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>累计盈亏</div>
                        <div className="text-sm font-bold" style={{ color: c.pnl >= 0 ? BRAND.primary : '#F87171' }}>{formatPnl(c.pnl)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>收益率</div>
                        <div className="text-sm font-bold" style={{ color: c.pnlPercent >= 0 ? BRAND.primary : '#F87171' }}>{formatPercent(c.pnlPercent)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>模式</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{c.mode === 'fixed-amount' ? '固定金额' : c.mode === 'proportional' ? '比例' : c.mode === 'multiplier' ? '倍数' : '镜像'}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>跟单笔数</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{c.copiedTrades.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>胜率</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{c.winRate}%</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>最大回撤</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{c.maxDrawdown}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'tournament' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>状态</span>
                  {(['all', 'upcoming', 'registration', 'live', 'ended'] as const).map((s) => (
                    <button key={s} onClick={() => setTournamentStatusFilter(s)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: tournamentStatusFilter === s ? BRAND.primary : BRAND.bg, color: tournamentStatusFilter === s ? '#000' : BRAND.textMuted, border: `1px solid ${tournamentStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'all' ? '全部' : s === 'upcoming' ? '即将开始' : s === 'registration' ? '报名中' : s === 'live' ? '进行中' : '已结束'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pq-stagger">
                {filteredTournaments.map((t) => (
                  <div key={t.id} onClick={() => openTournament(t.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] pq-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-semibold mb-1" style={{ color: BRAND.text }}>{t.name}</h3>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{t.category} · {t.startDate} ~ {t.endDate}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: t.status === 'live' ? BRAND.primary : t.status === 'registration' ? `${BRAND.primary}20` : BRAND.bg, color: t.status === 'live' ? '#000' : BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                        {t.status === 'live' ? '进行中' : t.status === 'registration' ? '报名中' : t.status === 'upcoming' ? '即将开始' : t.status === 'ended' ? '已结束' : '已取消'}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: BRAND.textMuted }}>{t.description}</p>
                    <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>奖金池</div>
                        <div className="text-base font-bold" style={{ color: BRAND.primary }}>{formatCurrency(t.prizePool, t.currency)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>参赛</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{t.participants}/{t.maxParticipants}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>报名截止</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{t.registrationDeadline}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'dev' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Code2 size={18} style={{ color: BRAND.primary }} />
                  策略开发套件
                </h2>
                <p className="text-sm mb-4" style={{ color: BRAND.textMuted }}>
                  完整的量化策略开发工具链：在线 IDE / 回测引擎 / 模拟盘 / 实盘执行 / 监控告警 / AI 参数优化。从策略编写到上线运营全流程支持。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pq-stagger">
                  {DEV_TOOLS.map((d) => (
                    <div key={d.id} onClick={() => openDev(d.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pq-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-semibold" style={{ color: BRAND.text }}>{d.name}</div>
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{d.category === 'editor' ? '编辑器' : d.category === 'testing' ? '测试' : d.category === 'execution' ? '执行' : '分析'}</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: BRAND.textMuted, minHeight: 32 }}>{d.description}</p>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                        <span>v{d.version}</span>
                        <span className="flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full pq-pulse" style={{ backgroundColor: BRAND.primary }} />
                          {d.onlineUsers} 在线
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>策略历史业绩 · 30日窗口</h2>
                <p className="text-xs mb-4" style={{ color: BRAND.textMuted }}>所有业绩为内部估算口径的策略历史回测/实盘数据，不构成对未来收益的承诺或保证。</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <th className="text-left py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>策略</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>年化</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>夏普</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>索提诺</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>回撤</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>波动率</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>胜率</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>盈亏比</th>
                        <th className="text-right py-2 px-2 text-xs" style={{ color: BRAND.textMuted }}>交易数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERFORMANCES.map((p) => (
                        <tr key={p.id} className="pq-row" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                          <td className="py-2 px-2">
                            <div className="text-sm" style={{ color: BRAND.text }}>{p.strategy}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.category}</div>
                          </td>
                          <td className="text-right py-2 px-2 font-mono font-semibold" style={{ color: p.apy >= 0 ? BRAND.primary : '#F87171' }}>{formatPercent(p.apy)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.text }}>{p.sharpe.toFixed(2)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.text }}>{p.sortino.toFixed(2)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: '#F87171' }}>{p.maxDrawdown.toFixed(1)}%</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.text }}>{p.volatility.toFixed(1)}%</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.text }}>{p.winRate}%</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.text }}>{p.profitFactor.toFixed(2)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: BRAND.textMuted }}>{p.totalTrades.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="max-w-3xl mx-auto">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <UserPlus size={18} style={{ color: BRAND.primary }} />
                  申请入驻 · {applyStep + 1}/4
                </h2>
                <p className="text-xs mb-4" style={{ color: BRAND.textMuted }}>本流程仅做 UI 演示，实际审核以 ZSDEX 官方流程为准。</p>

                <div className="flex items-center gap-2 mb-5">
                  {['类型', '基本信息', '策略说明', '确认'].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: i <= applyStep ? BRAND.primary : BRAND.bg, color: i <= applyStep ? '#000' : BRAND.textMuted, border: `1px solid ${i <= applyStep ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                      <span className="text-xs" style={{ color: i === applyStep ? BRAND.text : BRAND.textMuted }}>{s}</span>
                      {i < 3 && <ChevronRight size={12} style={{ color: BRAND.textMuted }} />}
                    </div>
                  ))}
                </div>

                {applyStep === 0 && (
                  <div className="space-y-3">
                    <div className="text-sm mb-2" style={{ color: BRAND.text }}>选择申请类型：</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['strategist', 'team', 'institution', 'community', 'educator'] as ApplyType[]).map((t) => (
                        <button key={t} onClick={() => setApplyType(t)} className="p-3 rounded-lg text-left transition-all" style={{ backgroundColor: applyType === t ? `${BRAND.primary}20` : BRAND.bg, color: BRAND.text, border: `1px solid ${applyType === t ? BRAND.primary : BRAND.border}` }}>
                          <div className="text-sm font-semibold">{t === 'strategist' ? '个人策略师' : t === 'team' ? '量化团队' : t === 'institution' ? '机构' : t === 'community' ? '社区达人' : '教育者'}</div>
                          <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{t === 'strategist' ? '个人开发者申请成为策略师' : t === 'team' ? '3 人以上量化团队' : t === 'institution' ? '专业投资机构' : t === 'community' ? '社区 KOL / 达人' : '学院讲师'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {applyStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>姓名 / 团队名</label>
                      <input value={applyName} onChange={(e) => setApplyName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="请输入姓名或团队名" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>联系人</label>
                        <input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="联系人姓名" />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>邮箱</label>
                        <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="email@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>所在地区</label>
                      <select value={applyRegion} onChange={(e) => setApplyRegion(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                        <option>亚太</option><option>欧洲</option><option>北美</option><option>中东</option><option>南美</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>量化经验</label>
                      <input value={applyExperience} onChange={(e) => setApplyExperience(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="如：5 年高频做市经验" />
                    </div>
                  </div>
                )}

                {applyStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>策略类型 / 名称</label>
                      <input value={applyStrategy} onChange={(e) => setApplyStrategy(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="如：网格 / 趋势 / 套利 / 做市 / ML 等" />
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>需要准备材料（UI 演示）：</div>
                      <ul className="space-y-1 text-xs" style={{ color: BRAND.text }}>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />身份证明（KYC 高级认证）</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />策略白皮书</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />回测报告（≥ 1 年）</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />实盘业绩（可选）</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />API 接入方案</li>
                      </ul>
                    </div>
                  </div>
                )}

                {applyStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>确认信息</div>
                      <div className="space-y-1 text-xs" style={{ color: BRAND.textMuted }}>
                        <div>申请类型：<span style={{ color: BRAND.text }}>{applyType === 'strategist' ? '个人策略师' : applyType === 'team' ? '量化团队' : applyType === 'institution' ? '机构' : applyType === 'community' ? '社区达人' : '教育者'}</span></div>
                        <div>姓名 / 团队：<span style={{ color: BRAND.text }}>{applyName || '-'}</span></div>
                        <div>联系人：<span style={{ color: BRAND.text }}>{applyContact || '-'}</span></div>
                        <div>邮箱：<span style={{ color: BRAND.text }}>{applyEmail || '-'}</span></div>
                        <div>地区：<span style={{ color: BRAND.text }}>{applyRegion}</span></div>
                        <div>经验：<span style={{ color: BRAND.text }}>{applyExperience || '-'}</span></div>
                        <div>策略：<span style={{ color: BRAND.text }}>{applyStrategy || '-'}</span></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: `${BRAND.primary}10`, border: `1px solid ${BRAND.primary}40`, color: BRAND.text }}>
                      <strong>合规说明：</strong>提交申请后，将进入审核流程（一般 5-10 个工作日）。所有材料仅用于 ZSDEX 量化入驻审核，不会用于其他用途。本流程为 UI 演示，提交不产生实际审核动作。
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <button onClick={() => setApplyStep(Math.max(0, applyStep - 1))} disabled={applyStep === 0} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, opacity: applyStep === 0 ? 0.4 : 1 }}>
                    <ChevronLeft size={14} />上一步
                  </button>
                  <button onClick={handleApplySubmit} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    {applyStep < 3 ? <>下一步<ChevronRight size={14} /></> : '提交申请'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <HelpCircle size={18} style={{ color: BRAND.primary }} />
                  快捷键与帮助
                </h2>
                <div className="space-y-2">
                  {[
                    { k: '/', d: '聚焦搜索框' },
                    { k: 'Esc', d: '关闭抽屉 / 弹窗' },
                    { k: '?', d: '打开/关闭本页帮助' },
                    { k: '1-9', d: '切换 Tab（总览/策略商城/.../帮助）' },
                  ].map((it) => (
                    <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                      <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl text-xs" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>
                <p><strong style={{ color: BRAND.text }}>合规说明：</strong>中萨数字科技交易所（ZSDEX）量化交易中心为研究 / 展示 / 跟单基础设施，所有策略 / 信号 / 业绩为内部估算口径的示例数据，不构成对未来收益的承诺。量化策略存在市场风险、历史业绩不代表未来表现，过往数据仅供参考。</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============== Drawers ============== */}
      {drawer.open && drawer.type === 'strategy' && drawer.payload && (() => {
        const s = STRATEGIES.find((x) => x.id === drawer.payload);
        if (!s) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{s.name}</h3>
                  <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{s.author}</div>
                </div>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: BRAND.text }}>{s.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="30日年化" value={formatPercent(s.apy30d)} accent={BRAND.primary} />
                  <Stat label="90日年化" value={formatPercent(s.apy90d)} accent={BRAND.primary} />
                  <Stat label="1年年化" value={formatPercent(s.apy1y)} accent={BRAND.primary} />
                  <Stat label="夏普比率" value={s.sharpe.toFixed(2)} />
                  <Stat label="最大回撤" value={`${s.maxDrawdown.toFixed(1)}%`} accent="#F87171" />
                  <Stat label="胜率" value={`${s.winRate}%`} />
                  <Stat label="总交易" value={s.totalTrades.toLocaleString()} />
                  <Stat label="平均持仓" value={s.avgHoldTime} />
                  <Stat label="AUM" value={formatCurrency(s.aum)} />
                  <Stat label="订阅者" value={formatNumber(s.subscribers)} />
                  <Stat label="最低资金" value={formatCurrency(s.capitalMin)} />
                  <Stat label="最大资金" value={formatCurrency(s.capitalMax)} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>核心特性</div>
                  <ul className="space-y-1.5">
                    {s.features.map((f) => (
                      <li key={f} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Check size={12} style={{ color: BRAND.primary }} />{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>参与要求</div>
                  <ul className="space-y-1.5">
                    {s.requirements.map((r) => (
                      <li key={r} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><AlertCircle size={12} style={{ color: '#FACC15' }} />{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即订阅</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>加入收藏</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'signal' && drawer.payload && (() => {
        const sig = SIGNALS.find((x) => x.id === drawer.payload);
        if (!sig) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>信号详情 · {sig.symbol}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="方向" value={sig.side === 'long' ? '做多' : sig.side === 'short' ? '做空' : sig.side === 'close' ? '平仓' : '关注'} accent={sig.side === 'long' ? BRAND.primary : sig.side === 'short' ? '#F87171' : undefined} />
                  <Stat label="价格" value={sig.price.toLocaleString()} />
                  {sig.target && <Stat label="目标价" value={sig.target.toLocaleString()} accent={BRAND.primary} />}
                  {sig.stopLoss && <Stat label="止损价" value={sig.stopLoss.toLocaleString()} accent="#F87171" />}
                  <Stat label="置信度" value={`${sig.confidence}%`} accent={BRAND.primary} />
                  <Stat label="TTL" value={`${sig.ttl} 分钟`} />
                </div>
                <p className="text-sm" style={{ color: BRAND.text }}>{sig.description}</p>
                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>
                  <div>来源：<span style={{ color: BRAND.text }}>{sig.source}</span></div>
                  <div>策略：<span style={{ color: BRAND.text }}>{sig.strategy}</span></div>
                  <div>发布时间：<span style={{ color: BRAND.text }}>{sig.publishedAt}</span></div>
                  <div>订阅者：<span style={{ color: BRAND.text }}>{sig.subscribers.toLocaleString()}</span></div>
                  {sig.hit && <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${BRAND.border}` }}>命中结果：<span style={{ color: BRAND.primary }}>{formatPercent(sig.result || 0)}</span></div>}
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>订阅信号</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>查看策略</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'copy' && drawer.payload && (() => {
        const c = COPIES.find((x) => x.id === drawer.payload);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>跟单详情 · {c.strategyName}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="分配" value={formatCurrency(c.allocation)} />
                  <Stat label="当前" value={formatCurrency(c.currentValue)} />
                  <Stat label="累计盈亏" value={formatPnl(c.pnl)} accent={c.pnl >= 0 ? BRAND.primary : '#F87171'} />
                  <Stat label="收益率" value={formatPercent(c.pnlPercent)} accent={c.pnlPercent >= 0 ? BRAND.primary : '#F87171'} />
                  <Stat label="跟单笔数" value={c.copiedTrades.toLocaleString()} />
                  <Stat label="胜率" value={`${c.winRate}%`} />
                  <Stat label="最大回撤" value={`${c.maxDrawdown}%`} />
                  <Stat label="模式" value={c.mode === 'fixed-amount' ? '固定金额' : c.mode === 'proportional' ? '比例' : c.mode === 'multiplier' ? '倍数' : '镜像'} />
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>止损设置</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>回撤止损：<span style={{ color: BRAND.text }}>{c.stopCopy.drawdown}%</span></div>
                    <div>日亏损：<span style={{ color: BRAND.text }}>{c.stopCopy.dailyLoss}%</span></div>
                    <div>总亏损：<span style={{ color: BRAND.text }}>{c.stopCopy.totalLoss}%</span></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>止盈设置</div>
                  <div className="text-xs">主目标：<span style={{ color: BRAND.text }}>{c.takeProfit.target}%</span></div>
                  <div className="text-xs mt-1">分批：<span style={{ color: BRAND.text }}>{c.takeProfit.partial.join(' / ')}%</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>编辑跟单</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>停止跟单</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'tournament' && drawer.payload && (() => {
        const t = TOURNAMENTS.find((x) => x.id === drawer.payload);
        if (!t) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{t.name}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: BRAND.text }}>{t.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="奖金池" value={formatCurrency(t.prizePool, t.currency)} accent={BRAND.primary} />
                  <Stat label="参赛" value={`${t.participants}/${t.maxParticipants}`} />
                  <Stat label="报名截止" value={t.registrationDeadline} />
                  <Stat label="报名费" value={t.entryFee > 0 ? `${t.entryFee} USDT` : '免费'} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>赛程</div>
                  <div className="space-y-2">
                    {t.rounds.map((r, i) => (
                      <div key={i} className="p-2.5 rounded-lg flex items-start gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: i === t.currentRound ? BRAND.primary : BRAND.bg, color: i === t.currentRound ? '#000' : BRAND.textMuted, border: `1px solid ${i === t.currentRound ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.name}</div>
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{r.startDate} ~ {r.endDate}</div>
                          <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>奖项</div>
                  <div className="space-y-1.5">
                    {t.awards.map((a) => (
                      <div key={a.rank} className="p-2.5 rounded-lg flex items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <Trophy size={14} style={{ color: BRAND.primary }} />
                        <div className="flex-1">
                          <div className="text-sm" style={{ color: BRAND.text }}>{a.rank}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.perks.join(' · ')}</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatCurrency(a.prize, t.currency)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>规则</div>
                  <ul className="space-y-1 text-xs" style={{ color: BRAND.text }}>
                    {t.rules.map((r) => <li key={r} className="flex gap-2"><span>•</span>{r}</li>)}
                  </ul>
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即报名</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'dev' && drawer.payload && (() => {
        const d = DEV_TOOLS.find((x) => x.id === drawer.payload);
        if (!d) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{d.name}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: BRAND.text }}>{d.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="版本" value={d.version} />
                  <Stat label="定价" value={d.pricing} />
                  <Stat label="用户数" value={d.users.toLocaleString()} />
                  <Stat label="在线" value={d.onlineUsers.toLocaleString()} accent={BRAND.primary} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>核心功能</div>
                  <ul className="space-y-1.5">
                    {d.features.map((f) => <li key={f} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Check size={12} style={{ color: BRAND.primary }} />{f}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>最近发布</div>
                  {d.releases.map((r) => (
                    <div key={r.version} className="p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.version}</span>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>{r.date}</span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {r.highlights.map((h) => <li key={h} className="text-xs" style={{ color: BRAND.textMuted }}>• {h}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>进入工具</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'parameter' && drawer.payload && (() => {
        const bt = BACKTESTS.find((b) => b.id === drawer.payload);
        if (!bt) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Sliders size={16} style={{ color: BRAND.primary }} />
                  调节参数 · {bt.strategyName}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>历史回测结果</span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>+{bt.totalReturn.toFixed(1)}% / 年化 {bt.annualizedReturn.toFixed(1)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="夏普" value={bt.sharpe.toFixed(2)} />
                    <Stat label="最大回撤" value={bt.maxDrawdown.toFixed(1) + '%'} />
                    <Stat label="胜率" value={bt.winRate.toFixed(1) + '%'} />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>参数化探索（仅展示，不下单）</div>
                  <div className="space-y-3">
                    {bt.parameters.map((p) => (
                      <div key={p.key} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm" style={{ color: BRAND.text }}>{p.label}</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.value} {p.unit}</span>
                        </div>
                        <input type="range" min={p.min} max={p.max} step={p.step} defaultValue={p.value} className="w-full" style={{ accentColor: BRAND.primary }} />
                        <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
                          <span>{p.min} {p.unit}</span>
                          <span>{p.hint}</span>
                          <span>{p.max} {p.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                    <strong style={{ color: BRAND.text }}>说明</strong>：参数化探索仅作为研究辅助，所有收益均为<strong style={{ color: '#F87171' }}>历史业绩模拟</strong>，不构成对未来收益的<strong style={{ color: '#F87171' }}>承诺或保证</strong>。实际交易请以风险预算为约束，详见 <strong style={{ color: BRAND.primary }}>风险敞口</strong> 标签页。
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>保存为新方案</button>
                  <button onClick={closeDrawer} className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>关闭</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'risk-budget' && drawer.payload && (() => {
        const factor = RISK_BUDGET.factors.find((f) => f.factor === drawer.payload);
        if (!factor) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldAlert size={16} style={{ color: factor.color }} />
                  风险预算详情 · {factor.label}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: factor.color + '20' }}>
                      <ShieldAlert size={20} style={{ color: factor.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{factor.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{factor.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: factor.color }}>{factor.utilization.toFixed(1)}%</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>使用率</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Stat label="当前敞口" value={formatCurrency(factor.exposure)} />
                  <Stat label="风险贡献" value={factor.contribution.toFixed(1) + '%'} />
                  <Stat label="风险限额" value={formatCurrency(factor.limit)} />
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>使用率趋势</div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-end gap-1 h-16">
                      {[42, 48, 52, 49, 55, 58, 62, 64, 61, 63, 64.8].map((v, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: (v / 100 * 100) + '%', backgroundColor: factor.color, opacity: 0.5 + (i / 11) * 0.5 }} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2" style={{ color: BRAND.textMuted }}>
                      <span>D-11</span><span>D-7</span><span>D-3</span><span>当前</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>风控建议</div>
                  <div className="space-y-2">
                    {[
                      { k: '敞口规模', v: factor.utilization > 70 ? '建议下调 10-15% 释放预算' : factor.utilization > 50 ? '当前合理，建议持续监控' : '敞口偏低，可适度加仓' },
                      { k: '止损线', v: '建议设置 -8% 移动止损，触发即减仓 30%' },
                      { k: '对冲工具', v: '可联动 P3.26 衍生品永续对冲（1x-3x）' },
                    ].map((it) => (
                      <div key={it.k} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <CheckCircle2 size={14} style={{ color: BRAND.primary, marginTop: 2 }} />
                        <div className="flex-1">
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{it.k}</div>
                          <div className="text-sm" style={{ color: BRAND.text }}>{it.v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                    <strong style={{ color: BRAND.text }}>风险提示</strong>：所有风险指标基于<strong style={{ color: BRAND.text }}>历史波动率</strong>和<strong style={{ color: BRAND.text }}>历史相关性</strong>计算，<strong style={{ color: '#F87171' }}>极端行情下可能失效</strong>。请勿将历史风险数据视为<strong style={{ color: '#F87171' }}>未来损失上限的承诺</strong>。
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认并关闭</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'linked' && drawer.payload && (() => {
        const link = ECOSYSTEM_LINKS.find((l) => l.id === drawer.payload);
        if (!link) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Network size={16} style={{ color: link.color }} />
                  互联生态 · {link.name}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: link.color + '20' }}>
                      <Network size={20} style={{ color: link.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{link.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{link.highlight}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: link.status === 'live' ? 'rgba(20,184,129,0.10)' : 'rgba(255,180,0,0.10)', color: link.status === 'live' ? BRAND.primary : '#FFB400' }}>{link.status === 'live' ? '已上线' : 'BETA'}</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{link.description}</p>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="当前吞吐" value={link.throughput.toLocaleString()} accent={link.color} />
                  <Stat label="计量单位" value={link.unit} />
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>联动方式</div>
                  <div className="space-y-2">
                    {[
                      { k: 'API 实时联动', v: '毫秒级信号同步，支持策略触发条件推送' },
                      { k: '资金自动划转', v: '策略盈利自动转入钱包现货账户' },
                      { k: '对冲风险同步', v: '敞口变化同步至风险预算中心' },
                    ].map((it) => (
                      <div key={it.k} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <CheckCircle2 size={14} style={{ color: link.color, marginTop: 2 }} />
                        <div className="flex-1">
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{it.k}</div>
                          <div className="text-sm" style={{ color: BRAND.text }}>{it.v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                    <strong style={{ color: BRAND.text }}>合规说明</strong>：所有联动数据均经过<strong style={{ color: BRAND.text }}>合规研究方向</strong>校验，不涉及<strong style={{ color: '#F87171' }}>承诺收益 / 保本 / 刚兑</strong>等高风险合规表述。
                  </div>
                </div>

                <a href={link.page} className="w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-1" style={{ backgroundColor: link.color, color: '#000' }}>
                  前往 {link.name} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Help Drawer */}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}

      {/* ============== Bottom CTA ============== */}
      <section className="px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Sparkles size={18} style={{ color: BRAND.primary }} />
                立即开始你的量化之旅
              </h2>
              <p className="text-sm" style={{ color: BRAND.textMuted }}>订阅策略 · 跟单做市 · 报名赛事 · 开发自营策略</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setTab('marketplace')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}><Boxes size={14} />浏览策略</button>
              <button onClick={() => setTab('copy')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><CopyIcon size={14} />跟单做市</button>
              <button onClick={() => setTab('dev')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Code2 size={14} />开发工具</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMuted }}>{label}</div>
      <div className="text-base font-semibold tabular-nums" style={{ color: accent || BRAND.text }}>{value}</div>
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: '/', d: '聚焦搜索' },
            { k: 'Esc', d: '关闭抽屉 / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab（总览/策略商城/.../帮助）' },
          ].map((it) => (
            <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
              <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

