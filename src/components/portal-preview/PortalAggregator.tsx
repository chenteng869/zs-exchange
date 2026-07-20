'use client';

/**
 * PortalAggregator - 跨链互操作与聚合路由中心 (2026-07-20 Q05 P3.42)
 *
 * 页面定位：
 * - 中萨数字科技交易所 跨链互操作与聚合路由中心
 * - 总览 / 支持的链 / DEX 协议 / 跨链桥 / Swap 路由 / 原子交易 / 流动性聚合 / MEV 保护 / 跨链监控 / 路由策略 / 帮助
 * - 与 P3.30 跨链桥 + P3.41 链上资产溯源 形成"桥接-路由-资产"链路
 * - 与 P3.26 衍生品 + P3.29 DeFi 形成"跨链交易 + 聚合路由"能力
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 11 Tabs：总览 / 链 / DEX / 桥 / 路由 / 原子 / 流动性 / MEV / 监控 / 策略 / 帮助
 * - 10+ 区块、10+ 交互、11 Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有数据使用 mock 占位，不接入真实跨链协议
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"技术研究 + 合规研究方向"定性
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Network,
  GitBranch,
  GitMerge,
  Link2,
  Link,
  Unlink,
  Boxes,
  Box,
  Hexagon,
  Diamond,
  Globe,
  Globe2,
  Map,
  MapPin,
  Compass,
  Route,
  RouteOff,
  Workflow,
  Share2,
  Repeat,
  RefreshCw,
  RefreshCcw,
  Shuffle,
  RotateCw,
  RotateCcw,
  Zap,
  Bolt,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Gauge,
  Target,
  Timer,
  Clock,
  Hourglass,
  Calendar,
  Hash,
  Tag,
  Tags,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Check,
  XCircle,
  Info,
  HelpCircle,
  Settings,
  Sliders,
  SlidersHorizontal,
  Plus,
  Minus,
  Edit,
  Edit2,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  Copy as CopyIcon,
  Download,
  Upload,
  ExternalLink,
  Database,
  Server,
  Cloud,
  Cpu,
  Code,
  Code2,
  Terminal,
  Webhook,
  Send,
  Inbox,
  Archive,
  FileText,
  BookOpen,
  Library,
  Bookmark,
  BookmarkCheck,
  Pin,
  PinOff,
  Flag,
  Rocket,
  Flame,
  Sparkles,
  Star,
  Crown,
  Award,
  Trophy,
  Gem,
  DollarSign,
  Coins,
  Wallet,
  Wallet2,
  CreditCard,
  Banknote,
  TrendingUp as TrendingUpIcon,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Cast,
  Radio,
  Tv,
  Play,
  Pause,
  Volume2,
  Headphones,
  Mic,
  Video,
  Users,
  User,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  Languages,
  MessageCircle,
  MessageSquare,
  Mail,
  Bell,
  BellRing,
  Phone,
  Plug,
  PlugZap,
  Power,
  PowerOff,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'chains' | 'dex' | 'bridges' | 'routes' | 'atomic' | 'liquidity' | 'mev' | 'monitor' | 'strategy' | 'help';
type ChainStatus = 'live' | 'beta' | 'coming' | 'maintenance' | 'deprecated';
type DexType = 'amm' | 'clmm' | 'orderbook' | 'stable' | 'perp' | 'synth';
type BridgeType = 'canonical' | 'lock-mint' | 'liquidity' | 'optimistic' | 'light-client' | 'hybrid';
type RouteStatus = 'optimal' | 'good' | 'fair' | 'poor' | 'rejected';
type AtomicStatus = 'pending' | 'locked' | 'redeemed' | 'refunded' | 'expired' | 'failed';
type MevType = 'frontrun' | 'sandwich' | 'backrun' | 'liquidation' | 'time-bandit' | 'jit';
type MevSeverity = 'low' | 'medium' | 'high' | 'critical';
type MonitorStatus = 'active' | 'pending' | 'completed' | 'failed' | 'delayed' | 'refunded';
type SortBy = 'tvl' | 'volume' | 'apy' | 'updated' | 'chains' | 'name';
type DrawerType = 'chain' | 'dex' | 'bridge' | 'route' | 'atomic' | 'pool' | 'mev' | 'monitor' | 'strategy' | 'api' | 'help' | null;

interface Chain {
  id: string;
  chainId: number;
  name: string;
  symbol: string;
  shortName: string;
  logo: string;
  status: ChainStatus;
  blockTime: number;
  finality: number;
  gasToken: string;
  rpcCount: number;
  explorer: string;
  tvlIn: number;
  tvlOut: number;
  volume24h: number;
  tx24h: number;
  dexes: number;
  bridges: number;
  isNative: boolean;
  isL2: boolean;
  consensus: string;
  riskScore: number;
  auditedBy: string[];
  color: string;
  iconBg: string;
  description: string;
  features: string[];
  throughputTps: number;
  avgFeeUsd: number;
  finalityTime: number;
  uptime: number;
  lastIncident: string;
  contracts: { bridge: string; router: string; vault: string };
}

interface DexProtocol {
  id: string;
  name: string;
  shortName: string;
  chain: string;
  chainId: string;
  type: DexType;
  version: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  revenue24h: number;
  pools: number;
  pairs: number;
  auditedBy: string[];
  router: string;
  factory: string;
  feeTier: number;
  apy: number;
  users24h: number;
  trades24h: number;
  launchedAt: string;
  isAudited: boolean;
  isOpenSource: boolean;
  hasBugBounty: boolean;
  tvlChange7d: number;
  volChange7d: number;
  description: string;
  features: string[];
  riskLevel: 'low' | 'medium' | 'high';
  iconColor: string;
  governance: string;
  token: string;
}

interface BridgeProtocol {
  id: string;
  name: string;
  shortName: string;
  type: BridgeType;
  chains: string[];
  chainCount: number;
  liquidity: number;
  volume24h: number;
  volumeTotal: number;
  feeBps: number;
  feeFixed: number;
  finalityMin: number;
  security: 'low' | 'medium' | 'high' | 'top';
  auditedBy: string[];
  hasInsurance: boolean;
  insuranceCap: number;
  riskScore: number;
  uptime: number;
  txCount24h: number;
  avgFinalityMin: number;
  tvlChange7d: number;
  volChange7d: number;
  messagePassing: boolean;
  isPermissionless: boolean;
  description: string;
  features: string[];
  iconColor: string;
  contracts: Record<string, string>;
}

interface SwapRoute {
  id: string;
  fromToken: string;
  fromSymbol: string;
  toToken: string;
  toSymbol: string;
  amountIn: number;
  amountOut: number;
  rate: number;
  priceImpact: number;
  gasUsd: number;
  feeBps: number;
  etaMin: number;
  status: RouteStatus;
  path: string[];
  dexes: string[];
  bridges: string[];
  chains: string[];
  hops: number;
  confidence: number;
  isAtomic: boolean;
  hasMevProtection: boolean;
  slippage: number;
  totalCost: number;
  netValue: number;
  createdAt: string;
  expiresAt: string;
  description: string;
}

interface AtomicSwap {
  id: string;
  txHash: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: number;
  status: AtomicStatus;
  hashLock: string;
  timeLock: number;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
  secret?: string;
  participants: number;
  protocol: string;
  confirmations: number;
  requiredConfirmations: number;
  safetyScore: number;
  description: string;
  explorer: string;
}

interface LiquidityPool {
  id: string;
  dex: string;
  chain: string;
  type: DexType;
  token0: string;
  token1: string;
  reserve0: number;
  reserve1: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  aprBase: number;
  aprReward: number;
  rewardTokens: string[];
  priceRatio: number;
  utilizationRate: number;
  lpHolders: number;
  isStable: boolean;
  isConcentrated: boolean;
  feeTier: number;
  tickLower?: number;
  tickUpper?: number;
  inRange: boolean;
  lastRebalance: string;
  change24h: number;
  description: string;
  iconColor: string;
}

interface MevAlert {
  id: string;
  type: MevType;
  severity: MevSeverity;
  chain: string;
  dex: string;
  pair: string;
  amountUsd: number;
  lossUsd: number;
  savedUsd: number;
  description: string;
  detectedAt: string;
  mitigated: boolean;
  protectionType: 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow';
  txHash: string;
  bot: string;
  gasGwei: number;
  blockNumber: number;
  revertRate: number;}

interface CrossChainMonitor {
  id: string;
  txHash: string;
  sourceChain: string;
  destChain: string;
  bridge: string;
  token: string;
  amount: number;
  status: MonitorStatus;
  progress: number;
  startedAt: string;
  etaMin: number;
  completedAt?: string;
  steps: { name: string; status: 'done' | 'active' | 'pending' | 'failed'; time: string }[];
  confirmations: number;
  requiredConfirmations: number;
  riskScore: number;
  description: string;
  explorerUrl: string;
  sender: string;
  receiver: string;
  fee: number;
}

interface RouteStrategy {
  id: string;
  name: string;
  description: string;
  algorithm: 'best-price' | 'fastest' | 'lowest-gas' | 'lowest-impact' | 'most-secure' | 'most-private' | 'balanced' | 'custom';
  enabled: boolean;
  chains: string[];
  dexes: string[];
  bridges: string[];
  constraints: {
    maxHops: number;
    maxSlippage: number;
    maxGasUsd: number;
    minLiquidity: number;
    requireMev: boolean;
    requireAudit: boolean;
    requireInsurance: boolean;
    allowDeprecated: boolean;
    prioritizeTime: boolean;
  };
  weights: { price: number; speed: number; security: number; mev: number; };
  savedAmount: number;
  txCount: number;
  avgSaving: number;
  createdAt: string;
  lastUsed: string;
  isDefault: boolean;
  isPublic: boolean;
  iconColor: string;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 常量 ==============

const CHAIN_STATUS_LABELS: Record<ChainStatus, string> = {
  live: '已上线', beta: '内测中', coming: '即将上线', maintenance: '维护中', deprecated: '已下线',
};

const CHAIN_STATUS_COLORS: Record<ChainStatus, { bg: string; fg: string }> = {
  live: { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
  beta: { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400' },
  coming: { bg: 'rgba(68,219,244,0.10)', fg: BRAND.info },
  maintenance: { bg: 'rgba(255,80,80,0.10)', fg: '#F6465D' },
  deprecated: { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMuted },
};

const DEX_TYPE_LABELS: Record<DexType, string> = {
  amm: 'AMM 恒定乘积', clmm: 'CLMM 集中流动性', orderbook: '订单簿', stable: '稳定币专用', perp: '永续合约', synth: '合成资产',
};

const DEX_TYPE_COLORS: Record<DexType, string> = {
  amm: '#14B881', clmm: '#44DBF4', orderbook: '#FFB400', stable: '#A855F7', perp: '#F6465D', synth: '#EC4899',
};

const BRIDGE_TYPE_LABELS: Record<BridgeType, string> = {
  canonical: '规范桥', 'lock-mint': '锁仓铸造', liquidity: '流动性桥', optimistic: '乐观桥', 'light-client': '轻客户端', hybrid: '混合桥',
};

const BRIDGE_SECURITY_LABELS: Record<BridgeProtocol['security'], string> = {
  low: '基础安全', medium: '标准安全', high: '高安全', top: '顶级安全',
};

const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  optimal: '最优', good: '良好', fair: '一般', poor: '较差', rejected: '不可执行',
};

const ROUTE_STATUS_COLORS: Record<RouteStatus, string> = {
  optimal: BRAND.primary, good: '#44DBF4', fair: '#FFB400', poor: '#F6465D', rejected: BRAND.textMuted,
};

const ATOMIC_STATUS_LABELS: Record<AtomicStatus, string> = {
  pending: '待处理', locked: '已锁定', redeemed: '已赎回', refunded: '已退款', expired: '已过期', failed: '已失败',
};

const ATOMIC_STATUS_COLORS: Record<AtomicStatus, string> = {
  pending: '#FFB400', locked: '#44DBF4', redeemed: BRAND.primary, refunded: '#A855F7', expired: BRAND.textMuted, failed: '#F6465D',
};

const MEV_TYPE_LABELS: Record<MevType, string> = {
  frontrun: '抢跑', sandwich: '三明治攻击', backrun: '尾随', liquidation: '清算', 'time-bandit': '时间强盗', jit: 'JIT 流动性',
};

const MEV_SEVERITY_LABELS: Record<MevSeverity, string> = {
  low: '低危', medium: '中危', high: '高危', critical: '严重',
};

const MEV_SEVERITY_COLORS: Record<MevSeverity, string> = {
  low: BRAND.primary, medium: '#FFB400', high: '#F6465D', critical: '#FF5050',
};

const MONITOR_STATUS_LABELS: Record<MonitorStatus, string> = {
  active: '进行中', pending: '排队中', completed: '已完成', failed: '已失败', delayed: '已延迟', refunded: '已退款',
};

const MONITOR_STATUS_COLORS: Record<MonitorStatus, string> = {
  active: '#44DBF4', pending: '#FFB400', completed: BRAND.primary, failed: '#F6465D', delayed: '#FFA940', refunded: '#A855F7',
};

const ALGO_LABELS: Record<RouteStrategy['algorithm'], string> = {
  'best-price': '最优价格', fastest: '最快速度', 'lowest-gas': '最低 Gas', 'lowest-impact': '最低滑点', 'most-secure': '最高安全', 'most-private': '最隐私', balanced: '综合平衡', custom: '自定义',
};

const SORT_LABELS: Record<SortBy, string> = {
  tvl: 'TVL 最高', volume: '24h 量最高', apy: 'APY 最高', updated: '最近更新', chains: '支持链数最多', name: '名称',
};

// ============== 工具函数 ==============

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPercent(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function changeColor(c: number): string {
  if (c > 0) return BRAND.primary;
  if (c < 0) return '#F6465D';
  return BRAND.textMuted;
}

function chainStatusBadge(s: ChainStatus): { bg: string; fg: string; label: string } {
  return { bg: CHAIN_STATUS_COLORS[s].bg, fg: CHAIN_STATUS_COLORS[s].fg, label: CHAIN_STATUS_LABELS[s] };
}

function routeStatusBadge(s: RouteStatus): { bg: string; fg: string; label: string } {
  return { bg: `${ROUTE_STATUS_COLORS[s]}20`, fg: ROUTE_STATUS_COLORS[s], label: ROUTE_STATUS_LABELS[s] };
}

function atomicStatusBadge(s: AtomicStatus): { bg: string; fg: string; label: string } {
  return { bg: `${ATOMIC_STATUS_COLORS[s]}20`, fg: ATOMIC_STATUS_COLORS[s], label: ATOMIC_STATUS_LABELS[s] };
}

function monitorStatusBadge(s: MonitorStatus): { bg: string; fg: string; label: string } {
  return { bg: `${MONITOR_STATUS_COLORS[s]}20`, fg: MONITOR_STATUS_COLORS[s], label: MONITOR_STATUS_LABELS[s] };
}

function truncateHash(h: string, n = 8): string {
  if (!h) return '';
  return `${h.slice(0, n)}…${h.slice(-n)}`;
}

function formatTimeMin(min: number): string {
  if (min < 1) return `${Math.round(min * 60)} 秒`;
  if (min < 60) return `${min} 分钟`;
  return `${(min / 60).toFixed(1)} 小时`;
}

function riskLevelColor(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return BRAND.primary;
  if (level === 'medium') return '#FFB400';
  return '#F6465D';
}

// ============== Mock 数据 ==============

// --- CHAINS (10 条) ---
const CHAINS: Chain[] = [
  {
    id: 'c-01', chainId: 1, name: 'Ethereum', symbol: 'ETH', shortName: 'ETH', logo: '⟠',
    status: 'live', blockTime: 12, finality: 64, gasToken: 'ETH', rpcCount: 84,
    explorer: 'https://etherscan.io', tvlIn: 1842000000, tvlOut: 1248000000, volume24h: 2840000000, tx24h: 1280000,
    dexes: 28, bridges: 12, isNative: true, isL2: false, consensus: 'PoS', riskScore: 8,
    auditedBy: ['Trail of Bits', 'OpenZeppelin', 'Sigma Prime'], color: '#627EEA', iconBg: 'rgba(98,126,234,0.12)',
    description: '主流 L1 智能合约平台，TVL 与流动性深度第一。',
    features: ['EVM 兼容', 'Rollup 友好', '生态成熟', '机构级托管'],
    throughputTps: 30, avgFeeUsd: 2.84, finalityTime: 12.8, uptime: 99.98,
    lastIncident: '2024-03-24 短期出块延迟（已恢复）',
    contracts: { bridge: '0x3154…df31', router: '0xE66B…3162', vault: '0x8315…F2cD' },
  },
  {
    id: 'c-02', chainId: 56, name: 'BNB Smart Chain', symbol: 'BNB', shortName: 'BSC', logo: '🟡',
    status: 'live', blockTime: 3, finality: 15, gasToken: 'BNB', rpcCount: 62,
    explorer: 'https://bscscan.com', tvlIn: 1248000000, tvlOut: 824000000, volume24h: 1840000000, tx24h: 4280000,
    dexes: 24, bridges: 10, isNative: false, isL2: false, consensus: 'PoSA', riskScore: 18,
    auditedBy: ['CertiK', 'SlowMist'], color: '#F0B90B', iconBg: 'rgba(240,185,11,0.12)',
    description: '高 TPS 公链，DeFi 与 GameFi 生态活跃。',
    features: ['EVM 兼容', '低 Gas', '多链互通', '币安生态'],
    throughputTps: 160, avgFeeUsd: 0.12, finalityTime: 3, uptime: 99.95,
    lastIncident: '2024-02-15 跨链桥节点维护（已恢复）',
    contracts: { bridge: '0x0c11…0bb1', router: '0x10ED…C924', vault: '0x85dD…6Ebb' },
  },
  {
    id: 'c-03', chainId: 42161, name: 'Arbitrum One', symbol: 'ETH', shortName: 'ARB', logo: '🔵',
    status: 'live', blockTime: 0.26, finality: 20, gasToken: 'ETH', rpcCount: 48,
    explorer: 'https://arbiscan.io', tvlIn: 824000000, tvlOut: 624000000, volume24h: 1240000000, tx24h: 1840000,
    dexes: 32, bridges: 14, isNative: false, isL2: true, consensus: 'Optimistic Rollup', riskScore: 12,
    auditedBy: ['Trail of Bits', 'OpenZeppelin', 'Spearbit'], color: '#28A0F0', iconBg: 'rgba(40,160,240,0.12)',
    description: 'Optimistic Rollup 头部 L2，EVM 等效。',
    features: ['EVM 等效', '低 Gas', 'Arbitrum 生态', 'Stylus 多语言'],
    throughputTps: 4000, avgFeeUsd: 0.08, finalityTime: 0.26, uptime: 99.99,
    lastIncident: '2024-04-08 排序器临时中断（已恢复）',
    contracts: { bridge: '0x8315…F2cD', router: '0xE66B…3162', vault: '0x0cF1…9bE2' },
  },
  {
    id: 'c-04', chainId: 10, name: 'OP Mainnet', symbol: 'ETH', shortName: 'OP', logo: '🔴',
    status: 'live', blockTime: 2, finality: 20, gasToken: 'ETH', rpcCount: 32,
    explorer: 'https://optimistic.etherscan.io', tvlIn: 484000000, tvlOut: 324000000, volume24h: 624000000, tx24h: 1240000,
    dexes: 18, bridges: 8, isNative: false, isL2: true, consensus: 'Optimistic Rollup', riskScore: 14,
    auditedBy: ['Trail of Bits', 'Sigma Prime'], color: '#FF0420', iconBg: 'rgba(255,4,32,0.12)',
    description: 'Superchain 核心链，OP Stack 标准化。',
    features: ['EVM 等效', 'OP Stack', 'Superchain 互操作', 'Bedrock 升级'],
    throughputTps: 2000, avgFeeUsd: 0.10, finalityTime: 2, uptime: 99.97,
    lastIncident: '2024-05-12 排序器升级维护（已恢复）',
    contracts: { bridge: '0x99C9…2fE1', router: '0xCb07…E5B3', vault: '0x4671…f2B6' },
  },
  {
    id: 'c-05', chainId: 137, name: 'Polygon PoS', symbol: 'POL', shortName: 'POL', logo: '🟣',
    status: 'live', blockTime: 2, finality: 30, gasToken: 'POL', rpcCount: 42,
    explorer: 'https://polygonscan.com', tvlIn: 624000000, tvlOut: 384000000, volume24h: 824000000, tx24h: 3280000,
    dexes: 22, bridges: 9, isNative: false, isL2: false, consensus: 'PoS', riskScore: 16,
    auditedBy: ['CertiK', 'OpenZeppelin'], color: '#8247E5', iconBg: 'rgba(130,71,229,0.12)',
    description: '侧链头部生态，Polygon 2.0 升级中。',
    features: ['EVM 兼容', '低 Gas', 'Polygon 2.0', 'AggLayer 聚合'],
    throughputTps: 6500, avgFeeUsd: 0.02, finalityTime: 2, uptime: 99.94,
    lastIncident: '2024-03-30 验证者节点降级（已恢复）',
    contracts: { bridge: '0x40ec…8FEE', router: '0xa102…072B', vault: '0x6E33…4D8B' },
  },
  {
    id: 'c-06', chainId: 8453, name: 'Base', symbol: 'ETH', shortName: 'BASE', logo: '🔷',
    status: 'live', blockTime: 2, finality: 20, gasToken: 'ETH', rpcCount: 28,
    explorer: 'https://basescan.org', tvlIn: 584000000, tvlOut: 384000000, volume24h: 624000000, tx24h: 2840000,
    dexes: 24, bridges: 8, isNative: false, isL2: true, consensus: 'Optimistic Rollup', riskScore: 14,
    auditedBy: ['Trail of Bits', 'Spearbit'], color: '#0052FF', iconBg: 'rgba(0,82,255,0.12)',
    description: 'Coinbase 旗下 OP Stack L2，生态高速扩张。',
    features: ['EVM 等效', 'OP Stack', 'Coinbase 生态', '低 Gas'],
    throughputTps: 2000, avgFeeUsd: 0.06, finalityTime: 2, uptime: 99.98,
    lastIncident: '2024-06-18 API 限流升级（已恢复）',
    contracts: { bridge: '0x3154…df31', router: '0xE66B…3162', vault: '0x3319…B85D' },
  },
  {
    id: 'c-07', chainId: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX', shortName: 'AVAX', logo: '🔺',
    status: 'live', blockTime: 2, finality: 4, gasToken: 'AVAX', rpcCount: 38,
    explorer: 'https://snowtrace.io', tvlIn: 384000000, tvlOut: 248000000, volume24h: 484000000, tx24h: 1840000,
    dexes: 14, bridges: 7, isNative: false, isL2: false, consensus: 'Avalanche Consensus', riskScore: 18,
    auditedBy: ['CertiK', 'Halborn'], color: '#E84142', iconBg: 'rgba(232,65,66,0.12)',
    description: '高性能公链，子网架构支持定制化。',
    features: ['EVM 兼容', '子网架构', '快速终局', '企业级定制'],
    throughputTps: 4500, avgFeeUsd: 0.18, finalityTime: 2, uptime: 99.96,
    lastIncident: '2024-01-22 子网同步问题（已恢复）',
    contracts: { bridge: '0x8d3F…5d3A', router: '0x60aE…a433', vault: '0xB31f…d7c1' },
  },
  {
    id: 'c-08', chainId: 101, name: 'Solana', symbol: 'SOL', shortName: 'SOL', logo: '🟪',
    status: 'live', blockTime: 0.4, finality: 12, gasToken: 'SOL', rpcCount: 56,
    explorer: 'https://solscan.io', tvlIn: 724000000, tvlOut: 484000000, volume24h: 1840000000, tx24h: 18400000,
    dexes: 18, bridges: 8, isNative: true, isL2: false, consensus: 'PoH + PoS', riskScore: 22,
    auditedBy: ['Trail of Bits', 'Neodyme', 'CertiK'], color: '#14F195', iconBg: 'rgba(20,241,149,0.12)',
    description: '高性能单片链，DEX 与支付生态繁荣。',
    features: ['高 TPS', '低费用', 'SPL 标准', 'Firedancer 升级'],
    throughputTps: 65000, avgFeeUsd: 0.0008, finalityTime: 0.4, uptime: 99.92,
    lastIncident: '2024-02-04 客户端版本升级（已恢复）',
    contracts: { bridge: 'wormhole…9XBz', router: 'JUP4…J2xL', vault: 'SoL1…A8sP' },
  },
  {
    id: 'c-09', chainId: 250, name: 'Fantom Opera', symbol: 'FTM', shortName: 'FTM', logo: '👻',
    status: 'live', blockTime: 1, finality: 5, gasToken: 'FTM', rpcCount: 24,
    explorer: 'https://ftmscan.com', tvlIn: 184000000, tvlOut: 124000000, volume24h: 248000000, tx24h: 824000,
    dexes: 12, bridges: 6, isNative: false, isL2: false, consensus: 'Lachesis', riskScore: 28,
    auditedBy: ['CertiK', 'SlowMist'], color: '#13B5EC', iconBg: 'rgba(19,181,236,0.12)',
    description: 'DAG 架构公链，快速终局。',
    features: ['EVM 兼容', 'DAG 共识', '快速终局', 'Sonic 升级'],
    throughputTps: 10000, avgFeeUsd: 0.04, finalityTime: 1, uptime: 99.91,
    lastIncident: '2024-05-20 网络升级维护（已恢复）',
    contracts: { bridge: '0x9b7b…dD44', router: '0xF491…7e48', vault: '0x21d4…0F2A' },
  },
  {
    id: 'c-10', chainId: 59144, name: 'Linea', symbol: 'ETH', shortName: 'LINEA', logo: '🟢',
    status: 'beta', blockTime: 8, finality: 32, gasToken: 'ETH', rpcCount: 18,
    explorer: 'https://lineascan.build', tvlIn: 124000000, tvlOut: 84000000, volume24h: 184000000, tx24h: 484000,
    dexes: 8, bridges: 5, isNative: false, isL2: true, consensus: 'ZK Rollup', riskScore: 20,
    auditedBy: ['Consensys Diligence', 'Trail of Bits'], color: '#121212', iconBg: 'rgba(18,18,18,0.20)',
    description: 'Consensys 推出的 ZK Rollup L2。',
    features: ['ZK Rollup', 'EVM 等效', 'Consensys 生态', 'Type 1 等效'],
    throughputTps: 2500, avgFeeUsd: 0.12, finalityTime: 8, uptime: 99.93,
    lastIncident: '2024-06-01 证明系统升级（已恢复）',
    contracts: { bridge: '0x0519…96B4', router: '0x6b8b…1c1C', vault: '0x9f1F…0a1A' },
  },
];

// --- DEX 协议 (12 个) ---
const DEXES: DexProtocol[] = [
  {
    id: 'd-01', name: 'Uniswap V3', shortName: 'UNI', chain: 'Ethereum', chainId: 'c-01',
    type: 'clmm' as DexType, version: 'v3.0',
    tvl: 4280000000, volume24h: 1840000000, fees24h: 2840000, revenue24h: 624000,
    pools: 4280, pairs: 8420,
    auditedBy: ['Trail of Bits', 'OpenZeppelin'],
    router: '0xE66B…3162', factory: '0x1F98…0984', feeTier: 0.3, apy: 12.8,
    users24h: 124820, trades24h: 284000, launchedAt: '2021-05-05',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 4.2, volChange7d: 8.4,
    description: '集中流动性头部协议，TVL 长期排名第一。',
    features: ['CLMM 集中流动性', '多费率档位', 'NFT LP 头寸', 'Hook 扩展'],
    riskLevel: 'low' as 'low' | 'medium' | 'high', iconColor: '#FF007A',
    governance: 'UNI 治理代币', token: '$UNI',
  },
  {
    id: 'd-02', name: 'Uniswap V2', shortName: 'UNI-V2', chain: 'Ethereum', chainId: 'c-01',
    type: 'amm' as DexType, version: 'v2.0',
    tvl: 1240000000, volume24h: 824000000, fees24h: 1240000, revenue24h: 384000,
    pools: 2840, pairs: 4820,
    auditedBy: ['Trail of Bits'],
    router: '0x7a25…9C20', factory: '0x5C69…1FB7', feeTier: 0.3, apy: 6.4,
    users24h: 84000, trades24h: 184000, launchedAt: '2020-05-19',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: -1.8, volChange7d: 2.4,
    description: '经典恒定乘积 AMM 协议。',
    features: ['AMM 恒定乘积', '长尾资产友好', '无许可上线', '经典 Router'],
    riskLevel: 'low' as 'low' | 'medium' | 'high', iconColor: '#FF007A',
    governance: 'UNI 治理代币', token: '$UNI',
  },
  {
    id: 'd-03', name: 'PancakeSwap V3', shortName: 'CAKE', chain: 'BNB Smart Chain', chainId: 'c-02',
    type: 'clmm' as DexType, version: 'v3.0',
    tvl: 1840000000, volume24h: 624000000, fees24h: 1480000, revenue24h: 384000,
    pools: 1840, pairs: 4280,
    auditedBy: ['CertiK', 'SlowMist'],
    router: '0x13f4…1423', factory: '0x0BFb…7d3B', feeTier: 0.25, apy: 18.4,
    users24h: 184000, trades24h: 384000, launchedAt: '2023-04-01',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 2.8, volChange7d: 6.8,
    description: 'BSC 头部 CLMM 协议。',
    features: ['CLMM 集中流动性', '低费率', '多链部署', 'Binance 生态'],
    riskLevel: 'low' as 'low' | 'medium' | 'high', iconColor: '#D1884F',
    governance: 'CAKE 治理代币', token: '$CAKE',
  },
  {
    id: 'd-04', name: 'Curve V2', shortName: 'CRV', chain: 'Ethereum', chainId: 'c-01',
    type: 'stable' as DexType, version: 'v2.0',
    tvl: 1840000000, volume24h: 624000000, fees24h: 384000, revenue24h: 124000,
    pools: 420, pairs: 1240,
    auditedBy: ['Trail of Bits', 'OpenZeppelin'],
    router: '0x99a5…C0D2', factory: '0x9D5C…28F2', feeTier: 0.04, apy: 8.2,
    users24h: 48000, trades24h: 84000, launchedAt: '2021-08-18',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 1.2, volChange7d: 4.8,
    description: '稳定币与同质资产专用 DEX。',
    features: ['StableSwap 算法', '低滑点', 'veToken 治理', '跨资产池'],
    riskLevel: 'low' as 'low' | 'medium' | 'high', iconColor: '#A0A0A0',
    governance: 'veCRV 治理', token: '$CRV',
  },
  {
    id: 'd-05', name: 'Aerodrome', shortName: 'AERO', chain: 'Base', chainId: 'c-06',
    type: 'clmm' as DexType, version: 'v1.0',
    tvl: 1240000000, volume24h: 484000000, fees24h: 824000, revenue24h: 184000,
    pools: 480, pairs: 1280,
    auditedBy: ['Spearbit', 'Code4rena'],
    router: '0xcF77…BD3E', factory: '0x420D…42b0', feeTier: 0.2, apy: 24.6,
    users24h: 84000, trades24h: 184000, launchedAt: '2023-08-28',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 6.8, volChange7d: 12.4,
    description: 'Base 链头部 CLMM，ve(3,3) 模型。',
    features: ['ve(3,3) 模型', '高激励', 'Base 生态', 'slipstream'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#14B881',
    governance: 'veAERO 治理', token: '$AERO',
  },
  {
    id: 'd-06', name: 'Camelot', shortName: 'GRAIL', chain: 'Arbitrum One', chainId: 'c-03',
    type: 'clmm' as DexType, version: 'v2.0',
    tvl: 624000000, volume24h: 248000000, fees24h: 384000, revenue24h: 84000,
    pools: 380, pairs: 1840,
    auditedBy: ['CertiK', 'Halborn'],
    router: '0x1Be2…22b0', factory: '0x6Ec7…dc1C', feeTier: 0.3, apy: 18.4,
    users24h: 42000, trades24h: 84000, launchedAt: '2023-04-15',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 3.4, volChange7d: 8.2,
    description: 'Arbitrum 生态原生 CLMM。',
    features: ['CLMM', '双奖励模型', 'NFT LP', 'Launchpad'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#F4B731',
    governance: 'GRAIL 治理', token: '$GRAIL',
  },
  {
    id: 'd-07', name: 'Trader Joe V2', shortName: 'JOE', chain: 'Avalanche C-Chain', chainId: 'c-07',
    type: 'clmm' as DexType, version: 'v2.0',
    tvl: 384000000, volume24h: 124000000, fees24h: 184000, revenue24h: 48000,
    pools: 240, pairs: 840,
    auditedBy: ['Halborn', 'CertiK'],
    router: '0x60aE…a433', factory: '0x9Ad3…D5F1', feeTier: 0.3, apy: 14.8,
    users24h: 18000, trades24h: 48000, launchedAt: '2022-11-15',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 2.4, volChange7d: 6.4,
    description: 'Avalanche 头部 CLMM 协议。',
    features: ['CLMM', 'Liquidity Book', '多链部署', 'Boosted 池'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#FF6B35',
    governance: 'JOE 治理', token: '$JOE',
  },
  {
    id: 'd-08', name: 'Raydium CLMM', shortName: 'RAY', chain: 'Solana', chainId: 'c-08',
    type: 'clmm' as DexType, version: 'v1.0',
    tvl: 824000000, volume24h: 384000000, fees24h: 624000, revenue24h: 184000,
    pools: 480, pairs: 1280,
    auditedBy: ['Neodyme', 'CertiK'],
    router: 'CPMMoo…U5F5', factory: 'CAMMCZ…d5LK', feeTier: 0.25, apy: 22.4,
    users24h: 48000, trades24h: 124000, launchedAt: '2023-04-18',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 4.8, volChange7d: 10.2,
    description: 'Solana 头部 CLMM 协议。',
    features: ['CLMM', 'Solana 原生', '高吞吐', '融合订单簿'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#14F195',
    governance: 'RAY 治理', token: '$RAY',
  },
  {
    id: 'd-09', name: 'Orca Whirlpools', shortName: 'ORCA', chain: 'Solana', chainId: 'c-08',
    type: 'clmm' as DexType, version: 'v1.0',
    tvl: 484000000, volume24h: 248000000, fees24h: 384000, revenue24h: 124000,
    pools: 240, pairs: 720,
    auditedBy: ['Neodyme', 'Trail of Bits'],
    router: 'whirLb…E5c', factory: 'whirLb…9fL', feeTier: 0.3, apy: 16.8,
    users24h: 38000, trades24h: 84000, launchedAt: '2023-03-24',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 1.8, volChange7d: 4.8,
    description: 'Solana 友好型 CLMM。',
    features: ['CLMM', '简单 UX', 'Solana 原生', '价格区间可视化'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#FFD25D',
    governance: 'ORCA 治理', token: '$ORCA',
  },
  {
    id: 'd-10', name: 'SushiSwap V3', shortName: 'SUSHI', chain: 'Ethereum', chainId: 'c-01',
    type: 'clmm' as DexType, version: 'v3.0',
    tvl: 384000000, volume24h: 124000000, fees24h: 184000, revenue24h: 48000,
    pools: 280, pairs: 1240,
    auditedBy: ['Quantstamp', 'CertiK'],
    router: '0xFba5…d3Cd', factory: '0xCd17…01D6', feeTier: 0.3, apy: 10.4,
    users24h: 24000, trades24h: 48000, launchedAt: '2021-09-01',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 0.8, volChange7d: 2.4,
    description: '多链部署的头部 DEX 协议。',
    features: ['多链部署', 'CLMM', 'Kashi 借贷', 'Furo 流支付'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#FA52A0',
    governance: 'SUSHI 治理', token: '$SUSHI',
  },
  {
    id: 'd-11', name: 'Velodrome V2', shortName: 'VELO', chain: 'OP Mainnet', chainId: 'c-04',
    type: 'clmm' as DexType, version: 'v2.0',
    tvl: 384000000, volume24h: 148000000, fees24h: 248000, revenue24h: 84000,
    pools: 184, pairs: 624,
    auditedBy: ['Spearbit', 'Code4rena'],
    router: '0x9a01…3be2', factory: '0xF104…605F', feeTier: 0.2, apy: 20.4,
    users24h: 24000, trades24h: 48000, launchedAt: '2023-07-12',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 4.2, volChange7d: 8.4,
    description: 'OP 链头部 CLMM 协议。',
    features: ['ve(3,3) 模型', 'OP 生态', '高激励', 'slipstream'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#FF0420',
    governance: 'veVELO 治理', token: '$VELO',
  },
  {
    id: 'd-12', name: 'Maverick V2', shortName: 'MAV', chain: 'Ethereum', chainId: 'c-01',
    type: 'clmm' as DexType, version: 'v2.0',
    tvl: 184000000, volume24h: 84000000, fees24h: 124000, revenue24h: 28000,
    pools: 84, pairs: 384,
    auditedBy: ['Spearbit', 'Trail of Bits'],
    router: '0x6541…2F0D', factory: '0x0A7B…2F0D', feeTier: 0.3, apy: 14.8,
    users24h: 12000, trades24h: 24000, launchedAt: '2023-07-12',
    isAudited: true, isOpenSource: true, hasBugBounty: true,
    tvlChange7d: 2.4, volChange7d: 6.4,
    description: '动态分布 CLMM 协议。',
    features: ['动态流动性', 'Boosted Position', '高资本效率', 'EVM 兼容'],
    riskLevel: 'medium' as 'low' | 'medium' | 'high', iconColor: '#FF6B9D',
    governance: 'MAV 治理', token: '$MAV',
  }
];

// --- 跨链桥 (8 个) ---
const BRIDGES: BridgeProtocol[] = [
  {
    id: 'b-01', name: 'Stargate', shortName: 'STG', type: 'liquidity' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-09'], chainCount: 8,
    liquidity: 824000000, volume24h: 184000000, volumeTotal: 8400000000,
    feeBps: 8, feeFixed: 0, finalityMin: 5,
    security: 'top' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Quantstamp', 'Trail of Bits', 'Zellic'],
    hasInsurance: true, insuranceCap: 50000000, riskScore: 6,
    uptime: 99.96, txCount24h: 284000, avgFinalityMin: 5,
    tvlChange7d: 4.2, volChange7d: 8.4, messagePassing: true, isPermissionless: true,
    description: '基于 LayerZero 的统一流动性跨链桥。',
    features: ['即时到账', '统一流动性', 'LayerZero 消息层', '多链覆盖'],
    iconColor: '#14B881', contracts: { [object Object] },
  },
  {
    id: 'b-02', name: 'LayerZero', shortName: 'ZRO', type: 'hybrid' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08', 'c-09', 'c-10'], chainCount: 10,
    liquidity: 1284000000, volume24h: 384000000, volumeTotal: 18400000000,
    feeBps: 0, feeFixed: 0, finalityMin: 8,
    security: 'top' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Trail of Bits', 'Zellic', 'Spearbit'],
    hasInsurance: true, insuranceCap: 100000000, riskScore: 8,
    uptime: 99.98, txCount24h: 624000, avgFinalityMin: 8,
    tvlChange7d: 6.4, volChange7d: 12.8, messagePassing: true, isPermissionless: true,
    description: '全链互操作协议，提供消息传递与跨链桥。',
    features: ['全链消息', '超轻节点', '可配置安全', '多链覆盖'],
    iconColor: '#000000', contracts: { [object Object] },
  },
  {
    id: 'b-03', name: 'Wormhole', shortName: 'W', type: 'lock-mint' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08', 'c-09'], chainCount: 9,
    liquidity: 484000000, volume24h: 184000000, volumeTotal: 12400000000,
    feeBps: 0, feeFixed: 0, finalityMin: 15,
    security: 'high' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Neodyme', 'CertiK', 'Trail of Bits'],
    hasInsurance: true, insuranceCap: 80000000, riskScore: 10,
    uptime: 99.92, txCount24h: 484000, avgFinalityMin: 15,
    tvlChange7d: 2.4, volChange7d: 6.4, messagePassing: true, isPermissionless: true,
    description: '守护者网络跨链协议，Solana 生态主力。',
    features: ['守护者网络', '跨链消息', 'Solana 友好', '多链覆盖'],
    iconColor: '#FFFFFF', contracts: { [object Object] },
  },
  {
    id: 'b-04', name: 'Hyperlane', shortName: 'HYPR', type: 'light-client' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-08', 'c-09'], chainCount: 8,
    liquidity: 184000000, volume24h: 84000000, volumeTotal: 2840000000,
    feeBps: 6, feeFixed: 0, finalityMin: 12,
    security: 'top' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Nethermind', 'Trail of Bits'],
    hasInsurance: true, insuranceCap: 30000000, riskScore: 8,
    uptime: 99.94, txCount24h: 124000, avgFinalityMin: 12,
    tvlChange7d: 8.4, volChange7d: 14.8, messagePassing: true, isPermissionless: true,
    description: '模块化跨链通信层，权限链 ISM 模型。',
    features: ['模块化 ISM', '权限安全', '多链支持', '轻客户端'],
    iconColor: '#1F2937', contracts: { [object Object] },
  },
  {
    id: 'b-05', name: 'Synapse', shortName: 'SYN', type: 'hybrid' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-09'], chainCount: 8,
    liquidity: 248000000, volume24h: 84000000, volumeTotal: 4840000000,
    feeBps: 8, feeFixed: 1, finalityMin: 8,
    security: 'high' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Quantstamp', 'Halborn'],
    hasInsurance: true, insuranceCap: 20000000, riskScore: 10,
    uptime: 99.93, txCount24h: 84000, avgFinalityMin: 8,
    tvlChange7d: 1.2, volChange7d: 4.2, messagePassing: true, isPermissionless: true,
    description: '跨链资产 + 消息协议，nUSD 稳定币桥。',
    features: ['跨链稳定币', '消息传递', '多链覆盖', 'LP 奖励'],
    iconColor: '#7B61FF', contracts: { [object Object] },
  },
  {
    id: 'b-06', name: 'Across', shortName: 'ACX', type: 'optimistic' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-09'], chainCount: 8,
    liquidity: 384000000, volume24h: 124000000, volumeTotal: 6240000000,
    feeBps: 12, feeFixed: 0, finalityMin: 3,
    security: 'top' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['OpenZeppelin', 'Code4rena'],
    hasInsurance: true, insuranceCap: 40000000, riskScore: 4,
    uptime: 99.97, txCount24h: 184000, avgFinalityMin: 3,
    tvlChange7d: 6.8, volChange7d: 12.4, messagePassing: true, isPermissionless: true,
    description: '基于 Optimistic 验证的快速跨链桥。',
    features: ['Optimistic 验证', '快速跨链', '低费用', 'UMV 模型'],
    iconColor: '#6FBFE3', contracts: { [object Object] },
  },
  {
    id: 'b-07', name: 'Connext', shortName: 'NEXT', type: 'canonical' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-09'], chainCount: 8,
    liquidity: 124000000, volume24h: 48000000, volumeTotal: 1840000000,
    feeBps: 10, feeFixed: 0, finalityMin: 10,
    security: 'high' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Sigma Prime', 'Consensys Diligence'],
    hasInsurance: true, insuranceCap: 15000000, riskScore: 10,
    uptime: 99.91, txCount24h: 48000, avgFinalityMin: 10,
    tvlChange7d: -2.4, volChange7d: 4.8, messagePassing: true, isPermissionless: true,
    description: '模块化互操作协议，xCall 消息传递。',
    features: ['xCall 消息', '模块化互操作', '低费用', '无需流动性'],
    iconColor: '#7B61FF', contracts: { [object Object] },
  },
  {
    id: 'b-08', name: 'Axelar', shortName: 'AXL', type: 'canonical' as BridgeType,
    chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08', 'c-09'], chainCount: 9,
    liquidity: 624000000, volume24h: 248000000, volumeTotal: 8400000000,
    feeBps: 8, feeFixed: 0, finalityMin: 8,
    security: 'top' as 'low' | 'medium' | 'high' | 'top',
    auditedBy: ['Trail of Bits', 'OpenZeppelin', 'Zellic'],
    hasInsurance: true, insuranceCap: 60000000, riskScore: 6,
    uptime: 99.95, txCount24h: 248000, avgFinalityMin: 8,
    tvlChange7d: 4.8, volChange7d: 10.2, messagePassing: true, isPermissionless: true,
    description: '通用消息传递协议，跨链 GMP 龙头。',
    features: ['通用消息', '跨链 GMP', '共识验证', '多链覆盖'],
    iconColor: '#FF007A', contracts: { [object Object] },
  }
];

// --- Swap 路由 (8 条) ---
const ROUTES: SwapRoute[] = [
  {
    id: 'r-01', fromToken: 'USDC', fromSymbol: 'USDC', toToken: 'USDC', toSymbol: 'USDC',
    amountIn: 100000, amountOut: 99820, rate: 0.9982, priceImpact: 0.04,
    gasUsd: 2.84, feeBps: 8, etaMin: 5, status: 'optimal' as RouteStatus,
    path: ['USDC', 'USDC', 'USDC'],
    dexes: ['Uniswap V3'], bridges: ['Stargate'],
    chains: ['c-01', 'c-02', 'c-06'], hops: 2, confidence: 98,
    isAtomic: true, hasMevProtection: true, slippage: 0.05, totalCost: 2.92,
    netValue: 96820, createdAt: '2026-07-20 11:24', expiresAt: '2026-07-20 11:29',
    description: 'USDC 跨链路由 (ETH→Base→BSC)，Stargate 即时到账。',
  },
  {
    id: 'r-02', fromToken: 'ETH', fromSymbol: 'ETH', toToken: 'ETH', toSymbol: 'ETH',
    amountIn: 50, amountOut: 49.84, rate: 0.9968, priceImpact: 0.08,
    gasUsd: 0.18, feeBps: 6, etaMin: 8, status: 'optimal' as RouteStatus,
    path: ['ETH', 'WETH', 'ETH'],
    dexes: ['Uniswap V3', 'Curve V2'], bridges: ['Across'],
    chains: ['c-01', 'c-03', 'c-04'], hops: 3, confidence: 96,
    isAtomic: true, hasMevProtection: true, slippage: 0.1, totalCost: 0.24,
    netValue: 49.6, createdAt: '2026-07-20 11:18', expiresAt: '2026-07-20 11:26',
    description: 'ETH 跨 L2 路由，Uniswap+Curve+Across 综合最优。',
  },
  {
    id: 'r-03', fromToken: 'USDT', fromSymbol: 'USDT', toToken: 'USDT', toSymbol: 'USDT',
    amountIn: 200000, amountOut: 199840, rate: 0.9992, priceImpact: 0.02,
    gasUsd: 0.42, feeBps: 4, etaMin: 3, status: 'optimal' as RouteStatus,
    path: ['USDT', 'USDT'],
    dexes: ['Curve V2'], bridges: ['Stargate'],
    chains: ['c-01', 'c-06'], hops: 1, confidence: 99,
    isAtomic: true, hasMevProtection: true, slippage: 0.02, totalCost: 0.46,
    netValue: 199380, createdAt: '2026-07-20 11:22', expiresAt: '2026-07-20 11:25',
    description: 'USDT 跨链稳定币路由，Curve+Stargate 最低滑点。',
  },
  {
    id: 'r-04', fromToken: 'WBTC', fromSymbol: 'WBTC', toToken: 'WBTC', toSymbol: 'WBTC',
    amountIn: 1.5, amountOut: 1.498, rate: 0.9987, priceImpact: 0.06,
    gasUsd: 4.2, feeBps: 12, etaMin: 12, status: 'good' as RouteStatus,
    path: ['WBTC', 'WBTC'],
    dexes: ['Uniswap V3', 'SushiSwap V3'], bridges: ['Wormhole'],
    chains: ['c-01', 'c-08'], hops: 2, confidence: 92,
    isAtomic: true, hasMevProtection: true, slippage: 0.1, totalCost: 4.32,
    netValue: 1.494, createdAt: '2026-07-20 11:08', expiresAt: '2026-07-20 11:20',
    description: 'WBTC 跨链 (ETH→Solana) 路由，Wormhole 中转。',
  },
  {
    id: 'r-05', fromToken: 'ARB', fromSymbol: 'ARB', toToken: 'OP', toSymbol: 'OP',
    amountIn: 10000, amountOut: 4820, rate: 0.482, priceImpact: 0.42,
    gasUsd: 0.84, feeBps: 18, etaMin: 15, status: 'good' as RouteStatus,
    path: ['ARB', 'ETH', 'OP'],
    dexes: ['Uniswap V3', 'Velodrome V2'], bridges: ['Hop'],
    chains: ['c-03', 'c-04'], hops: 3, confidence: 88,
    isAtomic: true, hasMevProtection: true, slippage: 0.5, totalCost: 0.92,
    netValue: 4708, createdAt: '2026-07-20 10:54', expiresAt: '2026-07-20 11:09',
    description: 'ARB→OP 跨 L2 路由，含双跳 swap。',
  },
  {
    id: 'r-06', fromToken: 'USDC', fromSymbol: 'USDC', toToken: 'USDC', toSymbol: 'USDC',
    amountIn: 500000, amountOut: 499180, rate: 0.9984, priceImpact: 0.1,
    gasUsd: 1.2, feeBps: 6, etaMin: 4, status: 'optimal' as RouteStatus,
    path: ['USDC', 'USDC'],
    dexes: ['Curve V2'], bridges: ['LayerZero'],
    chains: ['c-01', 'c-05'], hops: 1, confidence: 99,
    isAtomic: true, hasMevProtection: true, slippage: 0.02, totalCost: 1.26,
    netValue: 497954, createdAt: '2026-07-20 10:48', expiresAt: '2026-07-20 10:52',
    description: '大额 USDC (ETH→Polygon) 路由，LayerZero 消息层。',
  },
  {
    id: 'r-07', fromToken: 'BNB', fromSymbol: 'BNB', toToken: 'AVAX', toSymbol: 'AVAX',
    amountIn: 200, amountOut: 9420, rate: 47.1, priceImpact: 0.68,
    gasUsd: 1.84, feeBps: 28, etaMin: 18, status: 'fair' as RouteStatus,
    path: ['BNB', 'USDC', 'AVAX'],
    dexes: ['PancakeSwap V3', 'Trader Joe V2'], bridges: ['Stargate'],
    chains: ['c-02', 'c-07'], hops: 2, confidence: 78,
    isAtomic: true, hasMevProtection: true, slippage: 0.5, totalCost: 2.34,
    netValue: 9188, createdAt: '2026-07-20 10:32', expiresAt: '2026-07-20 10:50',
    description: 'BNB→AVAX 跨链 swap，3 跳中转。',
  },
  {
    id: 'r-08', fromToken: 'FTM', fromSymbol: 'FTM', toToken: 'AVAX', toSymbol: 'AVAX',
    amountIn: 5000, amountOut: 184.6, rate: 0.0369, priceImpact: 1.24,
    gasUsd: 2.4, feeBps: 32, etaMin: 24, status: 'poor' as RouteStatus,
    path: ['FTM', 'USDC', 'AVAX'],
    dexes: ['SpookySwap', 'Trader Joe V2'], bridges: ['Synapse'],
    chains: ['c-09', 'c-07'], hops: 2, confidence: 64,
    isAtomic: true, hasMevProtection: true, slippage: 0.8, totalCost: 3.2,
    netValue: 178.4, createdAt: '2026-07-20 10:12', expiresAt: '2026-07-20 10:36',
    description: '小众跨链 (FTM→AVAX) 路由，3 跳+滑点较高。',
  }
];

// --- 原子交易 (6 条) ---
const ATOMIC_SWAPS: AtomicSwap[] = [
  {
    id: 'a-01', txHash: '0x8e3a…1b4c', fromChain: 'Ethereum', toChain: 'Arbitrum One',
    fromToken: 'USDC', toToken: 'USDC', amount: 100000, status: 'locked' as AtomicStatus,
    hashLock: '0x7c2d…8e3f', timeLock: 7200, expiresAt: '2026-07-20 19:24', createdAt: '2026-07-20 11:24',
    completedAt: '2',
    participants: Hash Time Locked Contract, protocol: '12',
    confirmations: 32, requiredConfirmations: 96, safetyScore: USDC 跨 L2 原子 swap，HTLC 锁定中。,
    description: 'https://etherscan.io/tx/0x8e3a', explorer: 'undefined',
  },
  {
    id: 'a-02', txHash: '0x4b2c…9d1e', fromChain: 'BNB Smart Chain', toChain: 'OP Mainnet',
    fromToken: 'USDT', toToken: 'USDT', amount: 50000, status: 'redeemed' as AtomicStatus,
    hashLock: '0x9a4f…2b1c', timeLock: 4800, expiresAt: '2026-07-20 18:48', createdAt: '2026-07-20 10:48',
    completedAt: '2026-07-20 10:56',
    participants: 2, protocol: 'Hash Time Locked Contract',
    confirmations: 15, requiredConfirmations: 20, safetyScore: 98,
    description: 'USDT 跨链原子 swap，已完成赎回。', explorer: 'https://bscscan.com/tx/0x4b2c',
  },
  {
    id: 'a-03', txHash: '0x6f1a…3c5d', fromChain: 'Ethereum', toChain: 'Base',
    fromToken: 'ETH', toToken: 'ETH', amount: 12, status: 'redeemed' as AtomicStatus,
    hashLock: '0x2b8e…5d4a', timeLock: 3600, expiresAt: '2026-07-20 18:12', createdAt: '2026-07-20 10:12',
    completedAt: '2026-07-20 10:18',
    participants: 2, protocol: 'Across Optimistic',
    confirmations: 32, requiredConfirmations: 32, safetyScore: 99,
    description: 'ETH Optimistic 原子 swap，已完成。', explorer: 'https://etherscan.io/tx/0x6f1a',
  },
  {
    id: 'a-04', txHash: '0xc8e2…7a1f', fromChain: 'Polygon PoS', toChain: 'Avalanche C-Chain',
    fromToken: 'USDC', toToken: 'USDC', amount: 25000, status: 'pending' as AtomicStatus,
    hashLock: '0x4d1c…8f2e', timeLock: 5400, expiresAt: '2026-07-20 19:42', createdAt: '2026-07-20 10:42',
    completedAt: '1',
    participants: Connext xCall, protocol: '64',
    confirmations: 128, requiredConfirmations: 92, safetyScore: USDC 跨链 swap，等待中继响应。,
    description: 'https://polygonscan.com/tx/0xc8e2', explorer: 'undefined',
  },
  {
    id: 'a-05', txHash: '0x1a4b…6d8e', fromChain: 'Solana', toChain: 'Ethereum',
    fromToken: 'SOL', toToken: 'ETH', amount: 80, status: 'refunded' as AtomicStatus,
    hashLock: '0x8f3a…1c2b', timeLock: 6000, expiresAt: '2026-07-20 19:00', createdAt: '2026-07-20 10:00',
    completedAt: '2026-07-20 10:18',
    participants: 2, protocol: 'Wormhole Portal',
    confirmations: 32, requiredConfirmations: 30, safetyScore: 88,
    description: 'SOL→ETH swap 已退款（接收方超时）。', explorer: 'https://solscan.io/tx/0x1a4b',
  },
  {
    id: 'a-06', txHash: '0x9d2c…4e7f', fromChain: 'Arbitrum One', toChain: 'OP Mainnet',
    fromToken: 'ARB', toToken: 'OP', amount: 8000, status: 'failed' as AtomicStatus,
    hashLock: '0x6a8b…3d1c', timeLock: 7200, expiresAt: '2026-07-20 19:18', createdAt: '2026-07-20 10:18',
    completedAt: '1',
    participants: LayerZero V2, protocol: '16',
    confirmations: 32, requiredConfirmations: 84, safetyScore: ARB→OP swap 失败（滑点超限）。,
    description: 'https://arbiscan.io/tx/0x9d2c', explorer: 'undefined',
  }
];

// --- 流动性池 (10 个) ---
const POOLS: LiquidityPool[] = [
  {
    id: 'p-01', dex: 'Uniswap V3', chain: 'Ethereum', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'ETH', reserve0: 184000000, reserve1: 92000,
    tvl: 624000000, volume24h: 184000000, fees24h: 184000,
    apy: 12.4, aprBase: 6.8, aprReward: 5.6,
    rewardTokens: ['UNI', 'ARB'], priceRatio: 3842,
    utilizationRate: 92.4, lpHolders: 8420, isStable: false,
    isConcentrated: true, feeTier: 0.05,
    tickLower: -205760, tickUpper: -18000, inRange: true,
    lastRebalance: '2026-07-12 10:00', change24h: 4.2, description: 'USDC/ETH 0.05% 主流 CLMM 池。', iconColor: '#FF007A',
  },
  {
    id: 'p-02', dex: 'Uniswap V3', chain: 'Ethereum', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'USDT', reserve0: 84000000, reserve1: 84000000,
    tvl: 248000000, volume24h: 48000, fees24h: 4800,
    apy: 4.8, aprBase: 2.4, aprReward: 2.4,
    rewardTokens: ['CRV'], priceRatio: 1,
    utilizationRate: 84, lpHolders: 4280, isStable: true,
    isConcentrated: true, feeTier: 0.01,
    tickLower: 0, tickUpper: 0, inRange: true,
    lastRebalance: '2026-06-30 14:00', change24h: 0, description: 'USDC/USDT 0.01% 稳定币 CLMM 池。', iconColor: '#FF007A',
  },
  {
    id: 'p-03', dex: 'PancakeSwap V3', chain: 'BNB Smart Chain', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'BNB', reserve0: 124000000, reserve1: 384000,
    tvl: 384000000, volume24h: 124000, fees24h: 124000,
    apy: 24.8, aprBase: 14.2, aprReward: 10.6,
    rewardTokens: ['CAKE'], priceRatio: 0.000322,
    utilizationRate: 88.4, lpHolders: 12480, isStable: false,
    isConcentrated: true, feeTier: 0.25,
    tickLower: -201120, tickUpper: -7880, inRange: true,
    lastRebalance: '2026-07-15 08:00', change24h: 6.4, description: 'USDC/BNB 0.25% CLMM 池。', iconColor: '#D1884F',
  },
  {
    id: 'p-04', dex: 'Aerodrome', chain: 'Base', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'ETH', reserve0: 84000000, reserve1: 42000,
    tvl: 384000000, volume24h: 124000, fees24h: 84000,
    apy: 28.4, aprBase: 12.4, aprReward: 16,
    rewardTokens: ['AERO', 'OP'], priceRatio: 0.000479,
    utilizationRate: 84.2, lpHolders: 6280, isStable: false,
    isConcentrated: true, feeTier: 0.2,
    tickLower: -204420, tickUpper: -12000, inRange: true,
    lastRebalance: '2026-07-18 12:00', change24h: 8.4, description: 'USDC/ETH 0.20% 池，Base 头部激励。', iconColor: '#14B881',
  },
  {
    id: 'p-05', dex: 'Curve V2', chain: 'Ethereum', type: 'stable' as DexType,
    token0: 'USDC', token1: 'USDT', reserve0: 184000000, reserve1: 184000000,
    tvl: 124000000, volume24h: 8400, fees24h: 1800,
    apy: 6.4, aprBase: 4.2, aprReward: 2.2,
    rewardTokens: ['CRV'], priceRatio: 1,
    utilizationRate: 76, lpHolders: 12420, isStable: true,
    isConcentrated: false, feeTier: 0.04,
    tickLower: 0, tickUpper: 0, inRange: true,
    lastRebalance: '2026-06-28 20:00', change24h: 0, description: 'USDC/USDT 稳定币专用池。', iconColor: '#A0A0A0',
  },
  {
    id: 'p-06', dex: 'Uniswap V3', chain: 'Arbitrum One', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'ETH', reserve0: 64000000, reserve1: 32000,
    tvl: 248000000, volume24h: 84000, fees24h: 84000,
    apy: 14.8, aprBase: 6.4, aprReward: 8.4,
    rewardTokens: ['ARB', 'OP'], priceRatio: 0.000488,
    utilizationRate: 88, lpHolders: 4840, isStable: false,
    isConcentrated: true, feeTier: 0.05,
    tickLower: -204040, tickUpper: -16000, inRange: true,
    lastRebalance: '2026-07-10 16:00', change24h: 4.8, description: 'USDC/ETH 0.05% L2 池。', iconColor: '#28A0F0',
  },
  {
    id: 'p-07', dex: 'Raydium CLMM', chain: 'Solana', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'SOL', reserve0: 84000000, reserve1: 624000,
    tvl: 384000000, volume24h: 124000, fees24h: 124000,
    apy: 22.4, aprBase: 10.4, aprReward: 12,
    rewardTokens: ['RAY'], priceRatio: 0.0148,
    utilizationRate: 92.4, lpHolders: 3840, isStable: false,
    isConcentrated: true, feeTier: 0.25,
    tickLower: -201780, tickUpper: -24800, inRange: true,
    lastRebalance: '2026-07-16 18:00', change24h: 8.2, description: 'USDC/SOL 0.25% Solana 头部池。', iconColor: '#14F195',
  },
  {
    id: 'p-08', dex: 'Camelot', chain: 'Arbitrum One', type: 'clmm' as DexType,
    token0: 'ARB', token1: 'USDC', reserve0: 24000000, reserve1: 24000000,
    tvl: 84000000, volume24h: 24000, fees24h: 48000,
    apy: 32.4, aprBase: 14.8, aprReward: 17.6,
    rewardTokens: ['GRAIL', 'ARB'], priceRatio: 1,
    utilizationRate: 78, lpHolders: 1240, isStable: false,
    isConcentrated: true, feeTier: 0.3,
    tickLower: 1, tickUpper: 0, inRange: true,
    lastRebalance: '2026-07-08 12:00', change24h: 4.4, description: 'ARB/USDC 0.30% 池，高激励。', iconColor: '#F4B731',
  },
  {
    id: 'p-09', dex: 'Velodrome V2', chain: 'OP Mainnet', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'OP', reserve0: 18000000, reserve1: 18000000,
    tvl: 64000000, volume24h: 18000, fees24h: 36000,
    apy: 28, aprBase: 12.4, aprReward: 15.6,
    rewardTokens: ['VELO', 'OP'], priceRatio: 1,
    utilizationRate: 82, lpHolders: 840, isStable: false,
    isConcentrated: true, feeTier: 0.2,
    tickLower: 1, tickUpper: 0, inRange: true,
    lastRebalance: '2026-07-09 14:00', change24h: 6.2, description: 'USDC/OP 0.20% OP 头部池。', iconColor: '#FF0420',
  },
  {
    id: 'p-10', dex: 'Uniswap V3', chain: 'Polygon PoS', type: 'clmm' as DexType,
    token0: 'USDC', token1: 'ETH', reserve0: 32000000, reserve1: 16000,
    tvl: 124000000, volume24h: 48000, fees24h: 48000,
    apy: 14.2, aprBase: 6.4, aprReward: 7.8,
    rewardTokens: ['UNI', 'POL'], priceRatio: 0.0005,
    utilizationRate: 86, lpHolders: 2840, isStable: false,
    isConcentrated: true, feeTier: 0.3,
    tickLower: -203800, tickUpper: -20000, inRange: true,
    lastRebalance: '2026-07-05 18:00', change24h: 2.4, description: 'USDC/ETH 0.30% Polygon 池。', iconColor: '#8247E5',
  }
];

// --- MEV 告警 (6 条) ---
const MEV_ALERTS: MevAlert[] = [
  {
    id: 'm-01', type: 'sandwich' as MevType, severity: 'critical' as MevSeverity,
    chain: 'Ethereum', dex: 'Uniswap V3', pair: 'USDC/ETH',
    amountUsd: 2400000, lossUsd: 8420, savedUsd: 0,
    description: '检测到三明治攻击: 0xA1B2 在用户 0xC3D4 买入前抢跑并尾随卖出。', detectedAt: '2026-07-20 11:24:18', mitigated: true,
    protectionType: 'flashbots' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0x7e3a…2c1f', bot: 'sandwich-bot-7', gasGwei: 84.2, blockNumber: 19842820, revertRate: 0.32,
  },
  {
    id: 'm-02', type: 'frontrun' as MevType, severity: 'high' as MevSeverity,
    chain: 'Ethereum', dex: 'SushiSwap V3', pair: 'WBTC/USDC',
    amountUsd: 1480000, lossUsd: 4280, savedUsd: 0,
    description: '检测到抢跑: 机器人 0x8f4d 提前 1 区块提交大额买单。', detectedAt: '2026-07-20 11:18:42', mitigated: true,
    protectionType: 'private-pool' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0x4d1c…9b3a', bot: 'frontrun-bot-3', gasGwei: 92.4, blockNumber: 19842802, revertRate: 0.28,
  },
  {
    id: 'm-03', type: 'sandwich' as MevType, severity: 'medium' as MevSeverity,
    chain: 'Base', dex: 'Aerodrome', pair: 'USDC/ETH',
    amountUsd: 624000, lossUsd: 1840, savedUsd: 1840,
    description: '检测到三明治攻击: 已通过 private pool 规避。', detectedAt: '2026-07-20 11:08:24', mitigated: true,
    protectionType: 'private-pool' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0x6a8b…3c5d', bot: 'sandwich-bot-2', gasGwei: 28.4, blockNumber: 12842910, revertRate: 0.12,
  },
  {
    id: 'm-04', type: 'jit' as MevType, severity: 'low' as MevSeverity,
    chain: 'Arbitrum One', dex: 'Camelot', pair: 'ARB/USDC',
    amountUsd: 248000, lossUsd: 240, savedUsd: 480,
    description: '检测到 JIT 流动性攻击: 通过 bundle 重新平衡规避。', detectedAt: '2026-07-20 10:54:12', mitigated: true,
    protectionType: 'bundle' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0x9d2c…4e7f', bot: 'jit-bot-1', gasGwei: 12.4, blockNumber: 184210824, revertRate: 0.08,
  },
  {
    id: 'm-05', type: 'liquidation' as MevType, severity: 'medium' as MevSeverity,
    chain: 'Ethereum', dex: 'Aave V3', pair: 'ETH collateral',
    amountUsd: 840000, lossUsd: 1200, savedUsd: 0,
    description: '检测到清算抢跑: 监控已发出预警，bot 失败。', detectedAt: '2026-07-20 10:32:18', mitigated: false,
    protectionType: 'mev-blocker' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0x1a4b…6d8e', bot: 'liquidation-bot-4', gasGwei: 124.8, blockNumber: 19842810, revertRate: 0.18,
  },
  {
    id: 'm-06', type: 'backrun' as MevType, severity: 'low' as MevSeverity,
    chain: 'BNB Smart Chain', dex: 'PancakeSwap V3', pair: 'BNB/USDC',
    amountUsd: 184000, lossUsd: 280, savedUsd: 280,
    description: '检测到尾随: 已规避，未影响用户。', detectedAt: '2026-07-20 10:18:48', mitigated: true,
    protectionType: 'cow' as 'private-pool' | 'bundle' | 'flashbots' | 'mev-blocker' | 'cow',
    txHash: '0xc8e2…7a1f', bot: 'backrun-bot-2', gasGwei: 8.4, blockNumber: 38421084, revertRate: 0.06,
  }
];

// --- 跨链监控 (8 条) ---
const MONITORS: CrossChainMonitor[] = [
  {
    id: 'mn-01', txHash: '0x4a8b…1c2d', sourceChain: 'Ethereum', destChain: 'Arbitrum One',
    bridge: 'Across', token: 'USDC', amount: 100000, status: 'active' as MonitorStatus,
    progress: 60, startedAt: '2026-07-20 11:18', etaMin: 5,
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '11:18:00' },
      { name: '中继响应', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '11:19:24' },
      { name: '目标链执行', status: 'active' as 'done' | 'active' | 'pending' | 'failed', time: '11:20:12' },
      { name: '完成确认', status: 'pending' as 'done' | 'active' | 'pending' | 'failed', time: '-' }
    ],
    confirmations: 32, requiredConfirmations: 32, riskScore: 8,
    description: 'USDC 跨链 (ETH→ARB) Across 桥接中。', explorerUrl: 'https://etherscan.io/tx/0x4a8b', sender: '0xSender…1a2b', receiver: '0xReceiver…3c4d', fee: 0.84,
  },
  {
    id: 'mn-02', txHash: '0x6e2a…8b1c', sourceChain: 'BNB Smart Chain', destChain: 'OP Mainnet',
    bridge: 'Stargate', token: 'USDT', amount: 50000, status: 'completed' as MonitorStatus,
    progress: 100, startedAt: '2026-07-20 10:54', etaMin: 8,
    completedAt: '2026-07-20 11:02',
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:54:18' },
      { name: '中继响应', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:55:42' },
      { name: '目标链执行', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:58:12' },
      { name: '完成确认', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '11:02:24' }
    ],
    confirmations: 20, requiredConfirmations: 20, riskScore: 4,
    description: 'USDT 跨链 (BSC→OP) Stargate 已完成。', explorerUrl: 'https://bscscan.com/tx/0x6e2a', sender: '0xA1B2…C3D4', receiver: '0xE5F6…A7B8', fee: 0.5,
  },
  {
    id: 'mn-03', txHash: '0x9c4b…2d8e', sourceChain: 'Ethereum', destChain: 'Base',
    bridge: 'Hop', token: 'ETH', amount: 12, status: 'completed' as MonitorStatus,
    progress: 100, startedAt: '2026-07-20 10:12', etaMin: 6,
    completedAt: '2026-07-20 10:18',
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:12:24' },
      { name: 'Bonder 验证', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:13:48' },
      { name: '目标链执行', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:15:12' },
      { name: '完成确认', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:18:00' }
    ],
    confirmations: 32, requiredConfirmations: 32, riskScore: 6,
    description: 'ETH 跨链 (ETH→Base) Hop 桥接已完成。', explorerUrl: 'https://etherscan.io/tx/0x9c4b', sender: '0x1A2B…3C4D', receiver: '0x5E6F…7A8B', fee: 0.18,
  },
  {
    id: 'mn-04', txHash: '0x2b1c…4d6e', sourceChain: 'Polygon PoS', destChain: 'Avalanche C-Chain',
    bridge: 'Synapse', token: 'USDC', amount: 25000, status: 'pending' as MonitorStatus,
    progress: 24, startedAt: '2026-07-20 10:42', etaMin: 18,
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:42:18' },
      { name: '中继响应', status: 'active' as 'done' | 'active' | 'pending' | 'failed', time: '10:43:48' },
      { name: '目标链执行', status: 'pending' as 'done' | 'active' | 'pending' | 'failed', time: '-' },
      { name: '完成确认', status: 'pending' as 'done' | 'active' | 'pending' | 'failed', time: '-' }
    ],
    confirmations: 64, requiredConfirmations: 128, riskScore: 16,
    description: 'USDC 跨链 (Polygon→AVAX) 等待中继响应。', explorerUrl: 'https://polygonscan.com/tx/0x2b1c', sender: '0x9C8D…7E6F', receiver: '0x5A4B…3C2D', fee: 0.42,
  },
  {
    id: 'mn-05', txHash: '0x8e2a…1b4c', sourceChain: 'Solana', destChain: 'Ethereum',
    bridge: 'Wormhole', token: 'SOL', amount: 80, status: 'refunded' as MonitorStatus,
    progress: 100, startedAt: '2026-07-20 10:00', etaMin: 30,
    completedAt: '2026-07-20 10:18',
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:00:18' },
      { name: '守护者验证', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:02:42' },
      { name: '目标链执行', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:08:12' },
      { name: '退款', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:18:24' }
    ],
    confirmations: 32, requiredConfirmations: 30, riskScore: 32,
    description: 'SOL→ETH Wormhole 已退款（接收超时）。', explorerUrl: 'https://solscan.io/tx/0x8e2a', sender: '0xSoL1…A8sP', receiver: '0xETh1…C0dE', fee: 0.12,
  },
  {
    id: 'mn-06', txHash: '0x3d8e…5a1b', sourceChain: 'Arbitrum One', destChain: 'OP Mainnet',
    bridge: 'LayerZero', token: 'ARB', amount: 8000, status: 'failed' as MonitorStatus,
    progress: 100, startedAt: '2026-07-20 10:18', etaMin: 24,
    completedAt: '2026-07-20 10:42',
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:18:24' },
      { name: '中继响应', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:20:48' },
      { name: '目标链执行', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:24:12' },
      { name: '完成确认', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:42:00' }
    ],
    confirmations: 16, requiredConfirmations: 32, riskScore: 64,
    description: 'ARB→OP LayerZero 失败（滑点超限）。', explorerUrl: 'https://arbiscan.io/tx/0x3d8e', sender: '0x7A8B…9C0D', receiver: '0x1E2F…3A4B', fee: 0.68,
  },
  {
    id: 'mn-07', txHash: '0x7f4d…2c8e', sourceChain: 'Ethereum', destChain: 'Polygon PoS',
    bridge: 'LayerZero', token: 'USDC', amount: 500000, status: 'completed' as MonitorStatus,
    progress: 100, startedAt: '2026-07-20 10:48', etaMin: 8,
    completedAt: '2026-07-20 10:56',
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:48:12' },
      { name: '中继响应', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:49:48' },
      { name: '目标链执行', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:52:18' },
      { name: '完成确认', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:56:00' }
    ],
    confirmations: 64, requiredConfirmations: 64, riskScore: 4,
    description: '大额 USDC (ETH→Polygon) LayerZero 已完成。', explorerUrl: 'https://etherscan.io/tx/0x7f4d', sender: '0xWh4l3…3A2B', receiver: '0xPoL1…0C1A', fee: 1.2,
  },
  {
    id: 'mn-08', txHash: '0xb2c1…8e3f', sourceChain: 'Fantom Opera', destChain: 'Avalanche C-Chain',
    bridge: 'Synapse', token: 'FTM', amount: 5000, status: 'delayed' as MonitorStatus,
    progress: 72, startedAt: '2026-07-20 10:12', etaMin: 32,
    steps: [
      { name: '源链发送', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:12:48' },
      { name: '中继响应', status: 'done' as 'done' | 'active' | 'pending' | 'failed', time: '10:18:24' },
      { name: '目标链执行', status: 'active' as 'done' | 'active' | 'pending' | 'failed', time: '10:42:12' },
      { name: '完成确认', status: 'pending' as 'done' | 'active' | 'pending' | 'failed', time: '-' }
    ],
    confirmations: 32, requiredConfirmations: 32, riskScore: 28,
    description: 'FTM→AVAX Synapse 延迟中（中继拥堵）。', explorerUrl: 'https://ftmscan.com/tx/0xb2c1', sender: '0xF4N5…T0M1', receiver: '0xA8V9…A7X6', fee: 0.32,
  }
];

// --- 路由策略 (5 个) ---
const STRATEGIES: RouteStrategy[] = [
  {
    id: 's-01', name: '最优价格', description: '综合比价 12+ DEX 与 8+ 跨链桥，自动选择最优路径。', algorithm: 'best-price' as RouteStrategy['algorithm'],
    enabled: true, chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08', 'c-09', 'c-10'],
    dexes: ['Uniswap V3', 'PancakeSwap V3', 'Curve V2', 'Aerodrome'], bridges: ['Stargate', 'Across', 'LayerZero'],
    constraints: { maxHops: 4, maxSlippage: 0.5, maxGasUsd: 50, minLiquidity: 100000, requireMev: false, requireAudit: true, requireInsurance: false, allowDeprecated: false, prioritizeTime: false },
    weights: { price: 0.6, speed: 0.2, security: 0.1, mev: 0.1 },
    savedAmount: 18420, txCount: 4280, avgSaving: 4.3,
    createdAt: '2026-07-15 10:00', lastUsed: '2026-07-20 11:24', isDefault: true, isPublic: true, iconColor: '#14B881',
  },
  {
    id: 's-02', name: '最快速度', description: '优先 Across / Hop / LayerZero V2 桥，3 分钟内完成。', algorithm: 'fastest' as RouteStrategy['algorithm'],
    enabled: true, chains: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06'],
    dexes: ['Uniswap V3', 'Camelot', 'Aerodrome'], bridges: ['Across', 'Hop', 'LayerZero'],
    constraints: { maxHops: 3, maxSlippage: 0.3, maxGasUsd: 80, minLiquidity: 500000, requireMev: false, requireAudit: true, requireInsurance: false, allowDeprecated: false, prioritizeTime: true },
    weights: { price: 0.1, speed: 0.7, security: 0.1, mev: 0.1 },
    savedAmount: 8420, txCount: 1840, avgSaving: 0.2,
    createdAt: '2026-07-15 10:00', lastUsed: '2026-07-20 11:18', isDefault: false, isPublic: true, iconColor: '#44DBF4',
  },
  {
    id: 's-03', name: '最低 Gas', description: '优选 L2 池 + LayerZero 消息层，最低 Gas 成本。', algorithm: 'lowest-gas' as RouteStrategy['algorithm'],
    enabled: true, chains: ['c-03', 'c-04', 'c-05', 'c-06', 'c-09', 'c-10'],
    dexes: ['Uniswap V3', 'Aerodrome', 'Camelot', 'Velodrome V2'], bridges: ['LayerZero', 'Across'],
    constraints: { maxHops: 2, maxSlippage: 0.4, maxGasUsd: 5, minLiquidity: 200000, requireMev: false, requireAudit: true, requireInsurance: false, allowDeprecated: false, prioritizeTime: false },
    weights: { price: 0.2, speed: 0.4, security: 0.3, mev: 0.1 },
    savedAmount: 6240, txCount: 1240, avgSaving: 0.5,
    createdAt: '2026-07-15 10:00', lastUsed: '2026-07-20 11:08', isDefault: false, isPublic: true, iconColor: '#FFB400',
  },
  {
    id: 's-04', name: '最高安全', description: '仅审计完备+顶级安全的桥接，启用保险。', algorithm: 'most-secure' as RouteStrategy['algorithm'],
    enabled: true, chains: ['c-01', 'c-03', 'c-04', 'c-05', 'c-06', 'c-08'],
    dexes: ['Uniswap V3', 'Curve V2', 'Aerodrome'], bridges: ['LayerZero', 'Stargate', 'Wormhole'],
    constraints: { maxHops: 3, maxSlippage: 0.2, maxGasUsd: 100, minLiquidity: 1000000, requireMev: true, requireAudit: true, requireInsurance: true, allowDeprecated: false, prioritizeTime: false },
    weights: { price: 0.1, speed: 0.2, security: 0.6, mev: 0.1 },
    savedAmount: 4280, txCount: 480, avgSaving: 0.8,
    createdAt: '2026-07-15 10:00', lastUsed: '2026-07-20 10:42', isDefault: false, isPublic: true, iconColor: '#A855F7',
  },
  {
    id: 's-05', name: 'MEV 保护优先', description: '强制 private pool / bundle / flashbots, 保护大型交易。', algorithm: 'most-private' as RouteStrategy['algorithm'],
    enabled: true, chains: ['c-01', 'c-03', 'c-04', 'c-06', 'c-08'],
    dexes: ['Uniswap V3', 'Camelot', 'Aerodrome', 'Raydium CLMM'], bridges: ['Across', 'LayerZero'],
    constraints: { maxHops: 3, maxSlippage: 0.4, maxGasUsd: 80, minLiquidity: 500000, requireMev: true, requireAudit: true, requireInsurance: false, allowDeprecated: false, prioritizeTime: false },
    weights: { price: 0.1, speed: 0.2, security: 0.3, mev: 0.4 },
    savedAmount: 1840, txCount: 240, avgSaving: 2.4,
    createdAt: '2026-07-15 10:00', lastUsed: '2026-07-20 11:24', isDefault: false, isPublic: true, iconColor: '#F6465D',
  }
];

// --- 联动生态 (与 P3.30 跨链桥 / P3.41 链上资产溯源 协同) ---
const ECOSYSTEM_LINKS: { id: string; from: string; to: string; title: string; description: string; flow: string; iconColor: string }[] = [
  { id: 'el-01', from: 'P3.42 聚合路由', to: 'P3.30 跨链桥', title: '桥接选型 / 资金通道', description: '聚合路由将用户最优路径映射到具体桥接协议（Across/LayerZero/Stargate）。', flow: '路径解析 → 协议选择 → 资金划转 → 状态同步', iconColor: '#44DBF4' },
  { id: 'el-02', from: 'P3.42 聚合路由', to: 'P3.41 资产溯源', title: '资产图谱联动', description: '跨链路由完成后，资产溯源系统自动更新跨链锚定记录。', flow: '路由完成 → 锚定事件 → 图谱更新 → 信任分数刷新', iconColor: '#14B881' },
  { id: 'el-03', from: 'P3.42 聚合路由', to: 'P3.26 衍生品', title: '跨链保证金', description: '跨链路由为衍生品交易提供多链资产聚合保证金。', flow: '多链资产 → 路由聚合 → 保证金计算 → 风险对冲', iconColor: '#FFB400' },
  { id: 'el-04', from: 'P3.42 聚合路由', to: 'P3.29 DeFi 挖矿', title: '跨链挖矿路由', description: '聚合最佳跨链挖矿路径，自动平衡 APY 与桥费。', flow: 'APY 比价 → 跨链路径 → 资金部署 → 收益复投', iconColor: '#A855F7' },
  { id: 'el-05', from: 'P3.42 聚合路由', to: 'P3.40 量化策略', title: '跨链套利执行', description: '为量化策略提供跨链价差套利的路由与原子交易能力。', flow: '价差信号 → 路由选择 → 原子执行 → 收益归集', iconColor: '#EC4899' },
  { id: 'el-06', from: 'P3.42 聚合路由', to: 'P3.36 NFT', title: '跨链 NFT 流转', description: '支持 NFT 跨链转移，提供最优 gas/时间路径。', flow: 'NFT 锁定 → 跨链消息 → 目标链铸造 → 原链销毁', iconColor: '#FFA940' },
];

// ============== 主组件 ==============

export default function PortalAggregator() {
  // === 状态管理 ===
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('tvl');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [routeSearch, setRouteSearch] = useState({ from: 'USDC', to: 'ETH', amount: 1000 });
  const [selectedStrategy, setSelectedStrategy] = useState<string>('s-01');

  // === KPI 实时数据 ===
  const [kpi, setKpi] = useState({
    supportedChains: 10,
    integratedDexes: 64,
    integratedBridges: 24,
    dailyRoutes: 184200,
    dailyVolumeUsd: 4280000000,
    dailyAtomicSwaps: 8420,
    totalLiquidityUsd: 18400000000,
    mevSavedUsd: 124800,
    averageRouteTime: 6.4,
    averagePriceImpact: 0.18,
    successRate: 99.84,
    activeValidators: 428,
    uptime24h: 99.97,
    onlineProvers: 1284,
  });

  // === 实时数据波动 ===
  useEffect(() => {
    const timer = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        dailyRoutes: prev.dailyRoutes + Math.floor(Math.random() * 24),
        dailyVolumeUsd: prev.dailyVolumeUsd + Math.floor(Math.random() * 2480000),
        dailyAtomicSwaps: prev.dailyAtomicSwaps + Math.floor(Math.random() * 4),
        mevSavedUsd: prev.mevSavedUsd + Math.floor(Math.random() * 184),
        averageRouteTime: Math.max(2, Math.min(10, prev.averageRouteTime + (Math.random() - 0.5) * 0.4)),
        averagePriceImpact: Math.max(0.05, Math.min(0.5, prev.averagePriceImpact + (Math.random() - 0.5) * 0.02)),
        successRate: Math.max(99.5, Math.min(99.99, prev.successRate + (Math.random() - 0.5) * 0.02)),
        onlineProvers: Math.max(1200, Math.min(1400, prev.onlineProvers + Math.floor((Math.random() - 0.5) * 8))),
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // === 键盘快捷键 ===
  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawer.open) closeDrawer();
        else if (helpOpen) setHelpOpen(false);
      }
      if (e.key === '/' && !drawer.open && !helpOpen) {
        e.preventDefault();
        const el = document.getElementById('pa-search-input') as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  // === 过滤逻辑 ===
  const filteredChains = useMemo(() => {
    let r = CHAINS;
    if (search) r = r.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.shortName.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== 'all') r = r.filter((c) => c.status === filterStatus);
    return r;
  }, [search, filterStatus]);

  const filteredDexes = useMemo(() => {
    let r = DEXES;
    if (search) r = r.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    if (filterChain !== 'all') r = r.filter((d) => d.chainId === filterChain);
    r = [...r].sort((a, b) => {
      if (sortBy === 'tvl') return b.tvl - a.tvl;
      if (sortBy === 'volume') return b.volume24h - a.volume24h;
      if (sortBy === 'apy') return b.apy - a.apy;
      return a.name.localeCompare(b.name);
    });
    return r;
  }, [search, filterChain, sortBy]);

  const filteredBridges = useMemo(() => {
    let r = BRIDGES;
    if (search) r = r.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
    if (filterChain !== 'all') r = r.filter((b) => b.chains.includes(filterChain));
    r = [...r].sort((a, b) => b.volume24h - a.volume24h);
    return r;
  }, [search, filterChain]);

  const filteredRoutes = useMemo(() => {
    let r = ROUTES;
    if (search) r = r.filter((rt) => rt.fromSymbol.toLowerCase().includes(search.toLowerCase()) || rt.toSymbol.toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [search]);

  const filteredPools = useMemo(() => {
    let r = POOLS;
    if (search) r = r.filter((p) => p.dex.toLowerCase().includes(search.toLowerCase()) || p.token0.toLowerCase().includes(search.toLowerCase()) || p.token1.toLowerCase().includes(search.toLowerCase()));
    if (filterChain !== 'all') r = r.filter((p) => p.chain === CHAINS.find(c => c.id === filterChain)?.name);
    return r;
  }, [search, filterChain]);

  const filteredAtomics = useMemo(() => ATOMIC_SWAPS, []);
  const filteredMev = useMemo(() => MEV_ALERTS, []);
  const filteredMonitors = useMemo(() => MONITORS, []);

  // === 打开 Drawer ===
  const openDrawer = (type: DrawerType, payload: string | null = null) => setDrawer({ open: true, type, payload });

  // === 渲染 KPI 卡片 ===
  const KpiCard = ({ label, value, unit, change, icon: Icon, accent }: { label: string; value: string | number; unit?: string; change?: number; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; accent?: string }) => (
    <div className="pa-kpi-card p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide" style={{ color: BRAND.textMuted }}>
          <Icon size={12} style={{ color: accent || BRAND.primary }} />{label}
        </div>
        {change !== undefined && (
          <div className="text-[10px] font-medium" style={{ color: changeColor(change) }}>{formatPercent(change)}</div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: accent || BRAND.text }}>
        {typeof value === 'number' ? formatNumber(value) : value}
        {unit && <span className="text-sm font-normal ml-1" style={{ color: BRAND.textMuted }}>{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pa-page" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes paFadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes paPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes paFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes paShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes paSlideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes paBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .pa-stagger-1 { animation: paFadeInUp 0.5s ease-out 0.05s both; }
        .pa-stagger-2 { animation: paFadeInUp 0.5s ease-out 0.10s both; }
        .pa-stagger-3 { animation: paFadeInUp 0.5s ease-out 0.15s both; }
        .pa-stagger-4 { animation: paFadeInUp 0.5s ease-out 0.20s both; }
        .pa-stagger-5 { animation: paFadeInUp 0.5s ease-out 0.25s both; }
        .pa-stagger-6 { animation: paFadeInUp 0.5s ease-out 0.30s both; }
        .pa-pulse { animation: paPulse 2s ease-in-out infinite; }
        .pa-float { animation: paFloat 3s ease-in-out infinite; }
        .pa-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.08), transparent); background-size: 200% 100%; animation: paShimmer 2.5s linear infinite; }
        .pa-slide-in { animation: paSlideIn 0.4s ease-out both; }
        .pa-bar { transform-origin: bottom; animation: paBar 0.6s ease-out both; }
        .pa-tab-active { background-color: ${BRAND.primaryLt}; color: ${BRAND.primary}; border-color: ${BRAND.primary}; }
        .pa-kpi-card { transition: all 0.2s ease; }
        .pa-kpi-card:hover { background-color: ${BRAND.cardHover}; transform: translateY(-2px); box-shadow: ${BRAND.shadowMd}; }
      `}</style>

      {/* === Hero === */}
      <section className="px-6 pt-10 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 pa-stagger-1">
            <Link2 size={14} style={{ color: BRAND.primary }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: BRAND.textMuted }}>Q05 P3.42 / 跨链互操作与聚合路由中心</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pa-stagger-2" style={{ color: BRAND.text }}>
            跨链互操作 · 聚合路由中心
          </h1>
          <p className="text-sm md:text-base max-w-3xl pa-stagger-3" style={{ color: BRAND.textMuted }}>
            集成 <strong style={{ color: BRAND.primary }}>10 条主流公链</strong>、<strong style={{ color: BRAND.primary }}>64 个 DEX 协议</strong>、<strong style={{ color: BRAND.primary }}>24 个跨链桥</strong>，
            基于路径搜索 / 原子交易 / 流动性聚合 / MEV 保护，为跨链交易与套利提供<strong style={{ color: BRAND.text }}>最优路径 + 安全保障</strong>的聚合路由能力。
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4 pa-stagger-4">
            <span className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
              <Shield size={12} />v6 工业级 · 严格规避高风险合规表述
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>
              <Link2 size={12} />与 P3.30 / P3.41 协同
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5" style={{ backgroundColor: 'rgba(168,85,247,0.10)', color: '#A855F7' }}>
              <Zap size={12} />L4 工业级
            </span>
            <span className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer" onClick={() => setHelpOpen(true)} style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>
              <HelpCircle size={12} />帮助 / API 文档 / 快捷键
            </span>
          </div>
        </div>
      </section>

      {/* === KPI 区 === */}
      <section className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="pa-stagger-1"><KpiCard label="支持链数" value={kpi.supportedChains} unit="条" icon={Network} accent={BRAND.primary} /></div>
            <div className="pa-stagger-1"><KpiCard label="集成 DEX" value={kpi.integratedDexes} unit="个" icon={Layers} accent="#44DBF4" /></div>
            <div className="pa-stagger-2"><KpiCard label="集成桥" value={kpi.integratedBridges} unit="条" icon={Link2} accent="#FFB400" /></div>
            <div className="pa-stagger-2"><KpiCard label="今日路由" value={kpi.dailyRoutes} icon={Route} accent={BRAND.primary} change={2.4} /></div>
            <div className="pa-stagger-3"><KpiCard label="今日路由量" value={formatUsd(kpi.dailyVolumeUsd)} icon={TrendingUp} accent={BRAND.primary} change={4.8} /></div>
            <div className="pa-stagger-3"><KpiCard label="今日原子交易" value={kpi.dailyAtomicSwaps} icon={Lock} accent="#A855F7" change={6.4} /></div>
            <div className="pa-stagger-4"><KpiCard label="MEV 节省" value={formatUsd(kpi.mevSavedUsd)} icon={Shield} accent="#EC4899" change={8.4} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
            <div className="pa-stagger-4"><KpiCard label="总流动性" value={formatUsd(kpi.totalLiquidityUsd)} icon={Database} accent={BRAND.info} change={1.2} /></div>
            <div className="pa-stagger-4"><KpiCard label="平均路由时长" value={kpi.averageRouteTime.toFixed(1)} unit="分钟" icon={Timer} accent="#FFB400" /></div>
            <div className="pa-stagger-5"><KpiCard label="平均滑点" value={kpi.averagePriceImpact.toFixed(2)} unit="%" icon={Activity} accent={BRAND.primary} /></div>
            <div className="pa-stagger-5"><KpiCard label="成功率" value={kpi.successRate.toFixed(2)} unit="%" icon={CheckCircle2} accent={BRAND.primary} change={0.04} /></div>
            <div className="pa-stagger-6"><KpiCard label="活跃验证者" value={kpi.activeValidators} icon={Users} accent="#44DBF4" /></div>
            <div className="pa-stagger-6"><KpiCard label="24h 可用性" value={kpi.uptime24h.toFixed(2)} unit="%" icon={ShieldCheck} accent={BRAND.primary} change={0.01} /></div>
            <div className="pa-stagger-6"><KpiCard label="在线证明者" value={kpi.onlineProvers} icon={Cpu} accent="#A855F7" /></div>
          </div>
        </div>
      </section>

      {/* === 实时 Strip === */}
      <section className="px-6 py-3">
        <div className="max-w-7xl mx-auto rounded-xl pa-shimmer p-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full pa-pulse" style={{ backgroundColor: BRAND.primary }}></span>
              <span style={{ color: BRAND.textMuted }}>实时路由:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{kpi.dailyRoutes.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>路由量:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(kpi.dailyVolumeUsd)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>原子交易:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{kpi.dailyAtomicSwaps.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>MEV 节省:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(kpi.mevSavedUsd)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>路由时长:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{kpi.averageRouteTime.toFixed(1)} 分钟</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>滑点:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{kpi.averagePriceImpact.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: BRAND.textMuted }}>在线证明者:</span>
              <span className="font-semibold tabular-nums" style={{ color: BRAND.text }}>{kpi.onlineProvers}</span>
            </div>
          </div>
        </div>
      </section>

      {/* === Tab Bar === */}
      <section className="px-6 py-3 sticky top-0 z-30" style={{ backgroundColor: BRAND.headerBg, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {([
              { key: 'overview', label: '总览', icon: Gauge },
              { key: 'chains', label: '链', icon: Network },
              { key: 'dex', label: 'DEX 协议', icon: Layers },
              { key: 'bridges', label: '跨链桥', icon: Link2 },
              { key: 'routes', label: 'Swap 路由', icon: Route },
              { key: 'atomic', label: '原子交易', icon: Lock },
              { key: 'liquidity', label: '流动性', icon: Database },
              { key: 'mev', label: 'MEV 保护', icon: Shield },
              { key: 'monitor', label: '跨链监控', icon: Activity },
              { key: 'strategy', label: '路由策略', icon: Sliders },
              { key: 'help', label: '帮助', icon: HelpCircle },
            ] as { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[]).map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap ${active ? 'pa-tab-active' : ''}`} style={{ backgroundColor: active ? BRAND.primaryLt : 'transparent', color: active ? BRAND.primary : BRAND.textMuted, border: `1px solid ${active ? BRAND.primary : BRAND.border}` }}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* === Tab Content === */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* === Overview Tab === */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Route size={18} style={{ color: BRAND.primary }} />
                  聚合路由中心 · 跨链交易核心枢纽
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  集成 <strong style={{ color: BRAND.text }}>10 条公链 · 64 个 DEX 协议 · 24 个跨链桥</strong>，
                  基于 <strong style={{ color: BRAND.primary }}>路径搜索 / 原子交易 / 流动性聚合 / MEV 保护</strong> 4 大能力，
                  为跨链 swap / 跨链套利 / 多链资产部署提供一站式最优路径与安全保障。
                </p>
              </div>

              {/* 桥接热力图 */}
              <div className="p-5 rounded-xl pa-stagger-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Workflow size={14} style={{ color: BRAND.primary }} />桥接热力图 · 跨链路由活跃度
                </h3>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {CHAINS.map((c, i) => {
                    const intensity = (c.volume24h / 3000000000) * 100;
                    return (
                      <div key={c.id} className="pa-float" style={{ animationDelay: `${i * 0.15}s` }}>
                        <div className="aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${c.color}${Math.min(80, Math.max(20, intensity))}`, color: '#fff', border: `1px solid ${c.color}80` }}>
                          <span className="text-base">{c.logo}</span>
                          <span className="mt-1">{c.shortName}</span>
                        </div>
                        <div className="text-center mt-1 text-[9px] tabular-nums" style={{ color: BRAND.textMuted }}>{formatUsd(c.volume24h)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 实时路由 + 流动性深度 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl pa-stagger-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BarChart3 size={14} style={{ color: BRAND.primary }} />实时路由量趋势 (24h)
                </h3>
                <div className="flex items-end gap-1 h-32">
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = 30 + Math.sin(i * 0.5) * 25 + Math.random() * 30;
                    return <div key={i} className="flex-1 pa-bar" style={{ height: `${h}%`, backgroundColor: BRAND.primary, opacity: 0.6 + (i / 24) * 0.4, transformOrigin: 'bottom', animationDelay: `${i * 0.04}s` }} />;
                  })}
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>

                <div className="p-5 rounded-xl pa-stagger-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Database size={14} style={{ color: BRAND.primary }} />流动性深度 · Top 6 池
                </h3>
                <div className="space-y-2">
                  {[...POOLS].sort((a, b) => b.tvl - a.tvl).slice(0, 6).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 cursor-pointer" onClick={() => openDrawer('pool', p.id)}>
                      <div className="text-[10px] w-4" style={{ color: BRAND.textMuted }}>{i + 1}</div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${p.iconColor}20`, color: p.iconColor }}>{p.token0.slice(0, 1)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: BRAND.text }}>{p.token0}/{p.token1}</div>
                        <div className="text-[10px] truncate" style={{ color: BRAND.textMuted }}>{p.dex} · {p.chain}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.tvl)}</div>
                        <div className="text-[10px] tabular-nums" style={{ color: BRAND.primary }}>APY {p.apy.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>

              {/* 联动生态 */}
              <div className="p-5 rounded-xl pa-stagger-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Network size={14} style={{ color: BRAND.primary }} />联动生态 · 跨页面协同
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ECOSYSTEM_LINKS.map((l, i) => (
                    <div key={l.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${l.iconColor}20`, color: l.iconColor }}>{l.from.split(' ')[0]}</span>
                        <ArrowRight size={10} style={{ color: BRAND.textMuted }} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{l.to.split(' ')[0]}</span>
                      </div>
                      <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{l.title}</div>
                      <div className="text-[10px] leading-relaxed" style={{ color: BRAND.textMuted }}>{l.description}</div>
                      <div className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: BRAND.textMuted }}>
                        <Workflow size={9} />{l.flow}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === Chains Tab === */}
          {tab === 'chains' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input id="pa-search-input" type="text" placeholder="搜索链名 / 简称..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {(['all', 'live', 'beta', 'maintenance'] as const).map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ backgroundColor: filterStatus === s ? BRAND.primaryLt : 'transparent', color: filterStatus === s ? BRAND.primary : BRAND.textMuted, border: `1px solid ${filterStatus === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'all' ? '全部' : CHAIN_STATUS_LABELS[s as ChainStatus]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredChains.map((c, i) => {
                  const sb = chainStatusBadge(c.status);
                  return (
                    <div key={c.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('chain', c.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: c.iconBg, color: c.color }}>{c.logo}</div>
                          <div>
                            <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>{c.name}</div>
                            <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{c.symbol} · 链 ID {c.chainId}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                      </div>
                      <div className="text-[11px] leading-relaxed mb-3" style={{ color: BRAND.textMuted }}>{c.description}</div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL 入</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(c.tvlIn)}</div>
                        </div>
                        <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL 出</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(c.tvlOut)}</div>
                        </div>
                        <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(c.volume24h)}</div>
                        </div>
                        <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 交易</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(c.tx24h)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                        <span>出块 {c.blockTime}s · 终局 {c.finalityTime}s</span>
                        <span>DEX {c.dexes} · 桥 {c.bridges}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === Dex Tab === */}
          {tab === 'dex' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input type="text" placeholder="搜索 DEX 协议..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部链</option>
                  {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  {(['tvl', 'volume', 'apy', 'name'] as const).map((s) => (
                    <button key={s} onClick={() => setSortBy(s)} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ backgroundColor: sortBy === s ? BRAND.primaryLt : 'transparent', color: sortBy === s ? BRAND.primary : BRAND.textMuted, border: `1px solid ${sortBy === s ? BRAND.primary : BRAND.border}` }}>
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredDexes.map((d, i) => (
                  <div key={d.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('dex', d.id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0" style={{ backgroundColor: `${d.iconColor}20`, color: d.iconColor }}>{d.shortName.slice(0, 2)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>{d.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${DEX_TYPE_COLORS[d.type]}20`, color: DEX_TYPE_COLORS[d.type] }}>{DEX_TYPE_LABELS[d.type]}</span>
                          {d.isAudited && <span className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><ShieldCheck size={9} />审计</span>}
                          {d.hasBugBounty && <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>Bug Bounty</span>}
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>费率 {d.feeTier}%</span>
                        </div>
                        <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{d.chain} · {d.version} · 池 {d.pools} · 交易对 {d.pairs}</div>
                        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(d.tvl)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.volume24h)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 费</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.fees24h)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APY</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{d.apy.toFixed(1)}%</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 用户</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(d.users24h)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 交易</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(d.trades24h)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>7d TVL</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: changeColor(d.tvlChange7d) }}>{formatPercent(d.tvlChange7d)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Bridges Tab === */}
          {tab === 'bridges' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input type="text" placeholder="搜索跨链桥..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部链</option>
                  {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {filteredBridges.map((b, i) => (
                  <div key={b.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('bridge', b.id)}>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0" style={{ backgroundColor: `${b.iconColor}20`, color: b.iconColor }}>{b.shortName.slice(0, 2)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>{b.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{BRIDGE_TYPE_LABELS[b.type]}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: b.security === 'top' ? 'rgba(20,184,129,0.10)' : 'rgba(255,180,0,0.10)', color: b.security === 'top' ? BRAND.primary : '#FFB400' }}>安全: {BRIDGE_SECURITY_LABELS[b.security]}</span>
                            {b.hasInsurance && <span className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><Shield size={9} />保险 {formatUsd(b.insuranceCap)}</span>}
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>{b.chainCount} 链</span>
                          </div>
                          <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{b.description}</div>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>流动性</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(b.liquidity)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(b.volume24h)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>费率</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{(b.feeBps / 100).toFixed(2)}%</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>终局</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatTimeMin(b.avgFinalityMin)}</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>可用性</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{b.uptime.toFixed(2)}%</div>
                          </div>
                          <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-[9px]" style={{ color: BRAND.textMuted }}>7d 量变化</div>
                            <div className="text-[11px] font-bold tabular-nums" style={{ color: changeColor(b.volChange7d) }}>{formatPercent(b.volChange7d)}</div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* === Routes Tab === */}
          {tab === 'routes' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Route size={14} style={{ color: BRAND.primary }} />路由搜索器 · 输入资产与金额，查询最优路径
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: BRAND.textMuted }}>From Token</label>
                    <select value={routeSearch.from} onChange={(e) => setRouteSearch({ ...routeSearch, from: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option>USDC</option><option>USDT</option><option>ETH</option><option>WBTC</option>
                      <option>BNB</option><option>ARB</option><option>OP</option><option>SOL</option><option>AVAX</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: BRAND.textMuted }}>To Token</label>
                    <select value={routeSearch.to} onChange={(e) => setRouteSearch({ ...routeSearch, to: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option>ETH</option><option>USDC</option><option>USDT</option><option>WBTC</option>
                      <option>BNB</option><option>ARB</option><option>OP</option><option>SOL</option><option>AVAX</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: BRAND.textMuted }}>Amount</label>
                    <input type="number" value={routeSearch.amount} onChange={(e) => setRouteSearch({ ...routeSearch, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>查询最优路径</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredRoutes.map((r, i) => {
                  const sb = routeStatusBadge(r.status);
                  return (
                    <div key={r.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('route', r.id)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base font-bold" style={{ color: BRAND.text }}>{formatNumber(r.amountIn)}</span>
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{r.fromSymbol}</span>
                            <ArrowRight size={14} style={{ color: BRAND.primary }} />
                            <span className="text-base font-bold" style={{ color: BRAND.primary }}>{formatNumber(r.amountOut)}</span>
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{r.toSymbol}</span>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                            {r.isAtomic && <span className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(168,85,247,0.10)', color: '#A855F7' }}><Lock size={9} />原子</span>}
                            {r.hasMevProtection && <span className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><Shield size={9} />MEV</span>}
                          </div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold" style={{ color: BRAND.primary }}>{r.rate.toFixed(4)}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>汇率</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-3">
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>跳数</div>
                          <div className="text-xs font-bold" style={{ color: BRAND.text }}>{r.hops}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>Gas</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(r.gasUsd)}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>费率</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{(r.feeBps / 100).toFixed(2)}%</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>滑点</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: changeColor(r.slippage) }}>{r.slippage.toFixed(2)}%</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>价格影响</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: changeColor(r.priceImpact) }}>{r.priceImpact.toFixed(2)}%</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>ETA</div>
                          <div className="text-xs font-bold" style={{ color: BRAND.text }}>{formatTimeMin(r.etaMin)}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>置信度</div>
                          <div className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{r.confidence}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                        <span>路径:</span>
                        {r.path.map((p, j) => (
                          <React.Fragment key={j}>
                            <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{p}</span>
                            {j < r.path.length - 1 && <ArrowRight size={10} />}
                          </React.Fragment>
                        ))}
                        <span className="ml-2">DEX: {r.dexes.join(' / ')}</span>
                        <span>桥: {r.bridges.join(' / ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === Atomic Tab === */}
          {tab === 'atomic' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Lock size={14} style={{ color: BRAND.primary }} />原子交易 · HTLC / 时间锁 / 跨链原子 Swap
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  基于 <strong style={{ color: BRAND.text }}>Hash Time Locked Contract</strong> / <strong style={{ color: BRAND.text }}>Optimistic 验证</strong> / <strong style={{ color: BRAND.text }}>xCall 消息</strong> 等机制，
                  实现跨链原子 swap：要么全部成功，要么全部回滚，无第三方信任风险。
                </p>
              </div>

              <div className="space-y-3">
                {filteredAtomics.map((a, i) => {
                  const sb = atomicStatusBadge(a.status);
                  return (
                    <div key={a.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('atomic', a.id)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-base font-bold" style={{ color: BRAND.text }}>{a.amount.toLocaleString()}</span>
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{a.fromToken}</span>
                            <ArrowRight size={14} style={{ color: BRAND.primary }} />
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{a.toToken}</span>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{a.protocol}</span>
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{truncateHash(a.txHash, 10)}</div>
                          <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{a.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{a.safetyScore}</div>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>安全分</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>源链</div>
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{a.fromChain.split(' ')[0]}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>目标链</div>
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{a.toChain.split(' ')[0]}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>时间锁</div>
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{formatTimeMin(a.timeLock / 60)}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>确认数</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{a.confirmations}/{a.requiredConfirmations}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>参与方</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{a.participants}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>过期</div>
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{a.expiresAt.split(' ')[1]}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === Liquidity Tab === */}
          {tab === 'liquidity' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input type="text" placeholder="搜索池 / 资产..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部链</option>
                  {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredPools.map((p, i) => (
                  <div key={p.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('pool', p.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center -space-x-2">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ backgroundColor: `${p.iconColor}30`, color: p.iconColor, borderColor: BRAND.card }}>{p.token0.slice(0, 1)}</div>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2" style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff', borderColor: BRAND.card }}>{p.token1.slice(0, 1)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: BRAND.text }}>{p.token0}/{p.token1}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.dex} · {p.chain} · {p.feeTier}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.apy.toFixed(1)}%</div>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APY</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(p.tvl)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.volume24h)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 费</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.fees24h)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APR 基础</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{p.aprBase.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>奖励: {p.rewardTokens.join(' + ')}</span>
                      <span>·</span>
                      <span>LP 持有: {p.lpHolders.toLocaleString()}</span>
                      <span>·</span>
                      <span>利用率: {p.utilizationRate.toFixed(1)}%</span>
                      {p.inRange && <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>区间内</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === MEV Tab === */}
          {tab === 'mev' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Shield size={14} style={{ color: BRAND.primary }} />MEV 保护 · 抢跑 / 三明治 / 尾随 / JIT 防御
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  集成 <strong style={{ color: BRAND.text }}>Flashbots / Private Pool / MEV Blocker / CoW Protocol</strong> 等多种 MEV 保护通道，
                  实时监控并防御 <strong style={{ color: BRAND.primary }}>{filteredMev.length}</strong> 个 MEV 攻击事件，累计节省 <strong style={{ color: BRAND.primary }}>{formatUsd(kpi.mevSavedUsd)}</strong>。
                </p>
              </div>

              <div className="space-y-3">
                {filteredMev.map((m, i) => (
                  <div key={m.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('mev', m.id)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${MEV_SEVERITY_COLORS[m.severity]}20`, color: MEV_SEVERITY_COLORS[m.severity] }}>{MEV_SEVERITY_LABELS[m.severity]}</span>
                            <span className="text-sm font-bold" style={{ color: BRAND.text }}>{MEV_TYPE_LABELS[m.type]}</span>
                            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>· {m.chain} · {m.dex}</span>
                            {m.mitigated && <span className="px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><ShieldCheck size={9} />已缓解</span>}
                          </div>
                          <div className="text-[11px] mb-1" style={{ color: BRAND.textMuted }}>{m.description}</div>
                          <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{truncateHash(m.txHash, 10)} · {m.bot}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold tabular-nums" style={{ color: m.lossUsd > 0 ? '#F6465D' : BRAND.text }}>{formatUsd(m.amountUsd)}</div>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>交易额</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>损失</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: '#F6465D' }}>{formatUsd(m.lossUsd)}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>节省</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(m.savedUsd)}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>保护类型</div>
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{m.protectionType}</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>Gas</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{m.gasGwei.toFixed(1)} gwei</div>
                        </div>
                        <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>区块</div>
                          <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{m.blockNumber.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* === Monitor Tab === */}
          {tab === 'monitor' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Activity size={14} style={{ color: BRAND.primary }} />跨链监控 · 实时追踪交易状态机
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  监控跨链交易的 <strong style={{ color: BRAND.text }}>源链发送 → 中继响应 → 目标链执行 → 完成确认</strong> 4 步状态机，
                  当前活动 <strong style={{ color: BRAND.primary }}>{filteredMonitors.filter(m => m.status === 'active' || m.status === 'pending').length}</strong> 笔，待处理 <strong style={{ color: '#FFB400' }}>{filteredMonitors.filter(m => m.status === 'pending').length}</strong> 笔，已完成 <strong style={{ color: BRAND.primary }}>{filteredMonitors.filter(m => m.status === 'completed').length}</strong> 笔。
                </p>
              </div>

              <div className="space-y-3">
                {filteredMonitors.map((m, i) => {
                  const sb = monitorStatusBadge(m.status);
                  return (
                    <div key={m.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('monitor', m.id)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-base font-bold" style={{ color: BRAND.text }}>{m.amount.toLocaleString()}</span>
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{m.token}</span>
                            <ArrowRight size={14} style={{ color: BRAND.primary }} />
                            <span className="text-sm" style={{ color: BRAND.textMuted }}>{m.destChain.split(' ')[0]}</span>
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{m.bridge}</span>
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{truncateHash(m.txHash, 10)} · {m.startedAt} → ETA {formatTimeMin(m.etaMin)}</div>
                          <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{m.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{m.progress}%</div>
                          <div className="text-[9px]" style={{ color: BRAND.textMuted }}>进度</div>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full rounded-full pa-bar" style={{ width: `${m.progress}%`, backgroundColor: sb.fg, transformOrigin: 'left', animationDelay: `${i * 0.1}s` }} />
                      </div>

                      {/* 状态机步骤 */}
                      <div className="grid grid-cols-4 gap-2">
                        {m.steps.map((s, j) => (
                          <div key={j} className="p-1.5 rounded text-center" style={{ backgroundColor: s.status === 'done' ? 'rgba(20,184,129,0.10)' : s.status === 'active' ? 'rgba(68,219,244,0.10)' : s.status === 'failed' ? 'rgba(246,70,93,0.10)' : 'rgba(176,176,176,0.08)', border: `1px solid ${s.status === 'done' ? BRAND.primary : s.status === 'active' ? BRAND.info : s.status === 'failed' ? '#F6465D' : BRAND.border}` }}>
                            <div className="text-[9px] flex items-center justify-center gap-0.5" style={{ color: s.status === 'done' ? BRAND.primary : s.status === 'active' ? BRAND.info : s.status === 'failed' ? '#F6465D' : BRAND.textMuted }}>
                              {s.status === 'done' ? <CheckCircle2 size={9} /> : s.status === 'active' ? <Activity size={9} /> : s.status === 'failed' ? <XCircle size={9} /> : <Clock size={9} />}
                              {s.name}
                            </div>
                            <div className="text-[8px] mt-0.5" style={{ color: BRAND.textMuted }}>{s.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === Strategy Tab === */}
          {tab === 'strategy' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Sliders size={14} style={{ color: BRAND.primary }} />路由策略 · 算法 + 权重 + 约束
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  自定义路由算法的 <strong style={{ color: BRAND.text }}>价格 / 速度 / 安全 / MEV 保护</strong> 4 维度权重，
                  配置 <strong style={{ color: BRAND.text }}>跳数 / 滑点 / Gas / 流动性</strong> 等约束，实现个性化跨链路由体验。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STRATEGIES.map((s, i) => (
                  <div key={s.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1} ${selectedStrategy === s.id ? 'pa-slide-in' : ''}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${selectedStrategy === s.id ? s.iconColor : BRAND.border}` }} onClick={() => { setSelectedStrategy(s.id); openDrawer('strategy', s.id); }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.iconColor}20`, color: s.iconColor }}><Sliders size={16} /></div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: BRAND.text }}>{s.name}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{ALGO_LABELS[s.algorithm]}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {s.isDefault && <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>默认</span>}
                        {s.isPublic && <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>公开</span>}
                        <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: s.enabled ? 'rgba(20,184,129,0.10)' : 'rgba(176,176,176,0.10)', color: s.enabled ? BRAND.primary : BRAND.textMuted }}>{s.enabled ? '启用' : '停用'}</span>
                      </div>
                    </div>
                    <div className="text-[11px] mb-3" style={{ color: BRAND.textMuted }}>{s.description}</div>

                    {/* 权重条 */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      <div className="text-center">
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>价格</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${s.weights.price * 100}%`, backgroundColor: BRAND.primary }} />
                        </div>
                        <div className="text-[9px] mt-0.5 font-bold" style={{ color: BRAND.primary }}>{(s.weights.price * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>速度</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${s.weights.speed * 100}%`, backgroundColor: '#44DBF4' }} />
                        </div>
                        <div className="text-[9px] mt-0.5 font-bold" style={{ color: '#44DBF4' }}>{(s.weights.speed * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>安全</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${s.weights.security * 100}%`, backgroundColor: '#A855F7' }} />
                        </div>
                        <div className="text-[9px] mt-0.5 font-bold" style={{ color: '#A855F7' }}>{(s.weights.security * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>MEV</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${s.weights.mev * 100}%`, backgroundColor: '#F6465D' }} />
                        </div>
                        <div className="text-[9px] mt-0.5 font-bold" style={{ color: '#F6465D' }}>{(s.weights.mev * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>节省</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(s.savedAmount)}</div>
                      </div>
                      <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>交易</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{s.txCount.toLocaleString()}</div>
                      </div>
                      <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>平均省</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(s.avgSaving)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Help Tab === */}
          {tab === 'help' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <HelpCircle size={14} style={{ color: BRAND.primary }} />帮助 / API 文档 / 快捷键
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  跨链互操作与聚合路由中心是 ZSDEX 跨链交易能力的<strong style={{ color: BRAND.text }}>核心枢纽</strong>，为现货、合约、DeFi、套利等场景提供统一路由服务。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {([
                  { icon: BookOpen, title: '快速入门', desc: '5 步完成首次跨链交易', color: BRAND.primary, items: ['连接钱包', '选择源/目标资产', '查询最优路径', '确认交易', '等待完成'] },
                  { icon: Code, title: 'API 文档', desc: 'RESTful + WebSocket 完整接口', color: BRAND.info, items: ['GET /v1/aggregator/routes', 'POST /v1/aggregator/swap', 'GET /v1/aggregator/atomic/{id}', 'WS /v1/aggregator/monitor'] },
                  { icon: Keyboard, title: '键盘快捷键', desc: '提升操作效率', color: '#FFB400', items: ['/ 聚焦搜索', 'Esc 关闭 Drawer / Help', 'Tab 切换 Tab', 'Enter 打开选中'] },
                  { icon: Shield, title: 'MEV 保护说明', desc: '保护机制与覆盖范围', color: '#EC4899', items: ['Flashbots Bundle', 'Private Pool', 'MEV Blocker', 'CoW Protocol'] },
                  { icon: Network, title: '跨链桥安全模型', desc: '不同桥的安全等级', color: '#A855F7', items: ['Optimistic 验证', '轻客户端', '流动性桥', '守护者网络'] },
                  { icon: FileText, title: 'FAQ', desc: '常见问题', color: '#44DBF4', items: ['路由超时怎么办？', '跨链失败如何退款？', 'MEV 节省如何计算？', '如何选择最优策略？'] },
                ] as { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; title: string; desc: string; color: string; items: string[] }[]).map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}20`, color: c.color }}><Icon size={16} /></div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: BRAND.text }}>{c.title}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{c.desc}</div>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {c.items.map((it, j) => (
                          <li key={j} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}>
                            <ChevronRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: c.color }} />{it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* 合规说明 */}
              <div className="p-5 rounded-xl pa-stagger-2" style={{ backgroundColor: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.20)' }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#F6465D' }}>
                  <ShieldAlert size={14} />合规说明
                </h3>
                <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: BRAND.textMuted }}>
                  <li>· 本页面所有数据为 <strong style={{ color: BRAND.primary }}>mock 演示</strong>，仅作<strong style={{ color: BRAND.text }}>技术研究 + 合规研究方向</strong>展示。</li>
                  <li>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 萨摩亚持牌 / MSA / DSAEX"等高风险词。</li>
                  <li>· 跨链交易存在智能合约、桥接、终局等<strong style={{ color: BRAND.text }}>技术风险与市场风险</strong>，请充分了解后再操作。</li>
                  <li>· 不构成任何投资建议、收益保证或持牌承诺。</li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* === Drawers === */}

      {/* Chain Drawer */}
      {drawer.open && drawer.type === 'chain' && drawer.payload && (() => {
        const c = CHAINS.find(x => x.id === drawer.payload);
        if (!c) return null;
        const sb = chainStatusBadge(c.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: c.iconBg, color: c.color }}>{c.logo}</div>
                  <div>
                    <div className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>{c.name} <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span></div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{c.symbol} · 链 ID {c.chainId} · {c.consensus}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{c.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TVL 入金</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(c.tvlIn)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TVL 出金</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(c.tvlOut)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 交易量</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(c.volume24h)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 交易数</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(c.tx24h)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>出块时间</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{c.blockTime}s</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>终局时间</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{c.finalityTime}s</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TPS</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(c.throughputTps)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>平均手续费</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>$${c.avgFeeUsd.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 可用性</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{c.uptime.toFixed(2)}%</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>风险分</div>
                    <div className="text-xl font-bold tabular-nums" style={{ color: c.riskScore < 15 ? BRAND.primary : c.riskScore < 25 ? '#FFB400' : '#F6465D' }}>{c.riskScore}/100</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>核心特性</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.features.map((f, j) => (
                      <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{f}</span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>审计机构</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.auditedBy.map((a, j) => (
                      <span key={j} className="px-2 py-1 rounded text-[10px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><ShieldCheck size={9} />{a}</span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>合约地址</div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>桥:</span><span style={{ color: BRAND.text }}>{c.contracts.bridge}</span></div>
                    <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>路由:</span><span style={{ color: BRAND.text }}>{c.contracts.router}</span></div>
                    <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>金库:</span><span style={{ color: BRAND.text }}>{c.contracts.vault}</span></div>
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>最近事件</div>
                  <div className="text-[11px]" style={{ color: BRAND.text }}>{c.lastIncident}</div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>通过此链交易</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>查看浏览器</button>
                </div>
              </div>
            </div>
          </div>
        );

      {/* Dex Drawer */}
      {drawer.open && drawer.type === 'dex' && drawer.payload && (() => {
        const d = DEXES.find(x => x.id === drawer.payload);
        if (!d) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold" style={{ backgroundColor: `${d.iconColor}20`, color: d.iconColor }}>{d.shortName.slice(0, 2)}</div>
                  <div>
                    <div className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>{d.name}</div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{d.chain} · {d.version} · {DEX_TYPE_LABELS[d.type]}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{d.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TVL</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(d.tvl)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 量</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.volume24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 费</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.fees24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 收入</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.revenue24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>APY</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{d.apy.toFixed(1)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>池数</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{d.pools}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>交易对</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{d.pairs}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 用户</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(d.users24h)}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>合约地址</div>
                  <div className="space-y-1 text-[11px] font-mono"><div><span style={{ color: BRAND.textMuted }}>Router: </span><span style={{ color: BRAND.text }}>{d.router}</span></div><div><span style={{ color: BRAND.textMuted }}>Factory: </span><span style={{ color: BRAND.text }}>{d.factory}</span></div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>特性</div>
                  <div className="flex flex-wrap gap-1.5">{d.features.map((f, j) => <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{f}</span>)}</div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>使用此协议</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bridge Drawer */}
      {drawer.open && drawer.type === 'bridge' && drawer.payload && (() => {
        const b = BRIDGES.find(x => x.id === drawer.payload);
        if (!b) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold" style={{ backgroundColor: `${b.iconColor}20`, color: b.iconColor }}>{b.shortName.slice(0, 2)}</div>
                  <div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{b.name}</div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{BRIDGE_TYPE_LABELS[b.type]} · {b.chainCount} 链</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{b.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>流动性</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(b.liquidity)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 量</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(b.volume24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>总交易</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(b.volumeTotal)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>费率</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{(b.feeBps / 100).toFixed(2)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>终局时间</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatTimeMin(b.avgFinalityMin)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 交易数</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(b.txCount24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>可用性</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{b.uptime.toFixed(2)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>风险分</div><div className="text-xl font-bold tabular-nums" style={{ color: b.riskScore < 8 ? BRAND.primary : b.riskScore < 15 ? '#FFB400' : '#F6465D' }}>{b.riskScore}/100</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>支持链</div>
                  <div className="flex flex-wrap gap-1.5">{b.chains.map((cn, j) => { const chain = CHAINS.find(x => x.id === cn); return chain ? <span key={j} className="px-2 py-1 rounded text-[10px] flex items-center gap-0.5" style={{ backgroundColor: `${chain.iconColor}20`, color: chain.color }}>{chain.logo} {chain.shortName}</span> : null; })}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>特性</div>
                  <div className="flex flex-wrap gap-1.5">{b.features.map((f, j) => <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{f}</span>)}</div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>使用此桥</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Route Drawer */}
      {drawer.open && drawer.type === 'route' && drawer.payload && (() => {
        const r = ROUTES.find(x => x.id === drawer.payload);
        if (!r) return null;
        const sb = routeStatusBadge(r.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}><Route size={20} /></div>
                  <div>
                    <div className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>{r.fromSymbol} → {r.toSymbol} <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span></div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{r.hops} 跳 · {r.chains.length} 链 · 汇率 {r.rate.toFixed(4)}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{r.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>输入</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(r.amountIn)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>输出</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatNumber(r.amountOut)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>Gas 成本</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(r.gasUsd)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>滑点</div><div className="text-xl font-bold tabular-nums" style={{ color: changeColor(r.slippage) }}>{r.slippage.toFixed(2)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>价格影响</div><div className="text-xl font-bold tabular-nums" style={{ color: changeColor(r.priceImpact) }}>{r.priceImpact.toFixed(2)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>ETA</div><div className="text-xl font-bold" style={{ color: BRAND.text }}>{formatTimeMin(r.etaMin)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>置信度</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{r.confidence}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>净价值</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(r.netValue)}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>路径</div>
                  <div className="flex flex-wrap items-center gap-1.5">{r.path.map((p, j) => <React.Fragment key={j}><span className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{p}</span>{j < r.path.length - 1 && <ArrowRight size={10} style={{ color: BRAND.textMuted }} />}</React.Fragment>)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>DEX 协议</div>
                  <div className="flex flex-wrap gap-1.5">{r.dexes.map((dx, j) => <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{dx}</span>)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>跨链桥</div>
                  <div className="flex flex-wrap gap-1.5">{r.bridges.map((br, j) => <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>{br}</span>)}</div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>执行此路由</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Atomic Drawer */}
      {drawer.open && drawer.type === 'atomic' && drawer.payload && (() => {
        const a = ATOMIC_SWAPS.find(x => x.id === drawer.payload);
        if (!a) return null;
        const sb = atomicStatusBadge(a.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(168,85,247,0.10)', color: '#A855F7' }}><Lock size={20} /></div>
                  <div>
                    <div className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>原子交易 #{a.id} <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span></div>
                    <div className="text-[11px] font-mono" style={{ color: BRAND.textMuted }}>{truncateHash(a.txHash, 10)}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{a.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>金额</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{a.amount.toLocaleString()}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>安全分</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{a.safetyScore}/100</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>时间锁</div><div className="text-xl font-bold" style={{ color: BRAND.text }}>{formatTimeMin(a.timeLock / 60)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>确认数</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{a.confirmations}/{a.requiredConfirmations}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>路由</div>
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{a.fromChain}</span><ArrowRight size={12} style={{ color: BRAND.primary }} /><span className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{a.toChain}</span></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>合约信息</div>
                  <div className="space-y-1 text-[11px] font-mono"><div><span style={{ color: BRAND.textMuted }}>协议: </span><span style={{ color: BRAND.text }}>{a.protocol}</span></div><div><span style={{ color: BRAND.textMuted }}>Hash Lock: </span><span style={{ color: BRAND.text }}>{a.hashLock}</span></div></div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>查看浏览器</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pool Drawer */}
      {drawer.open && drawer.type === 'pool' && drawer.payload && (() => {
        const p = POOLS.find(x => x.id === drawer.payload);
        if (!p) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2" style={{ backgroundColor: `${p.iconColor}30`, color: p.iconColor, borderColor: BRAND.cardElevated }}>{p.token0.slice(0, 1)}</div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2" style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff', borderColor: BRAND.cardElevated }}>{p.token1.slice(0, 1)}</div>
                  </div>
                  <div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{p.token0}/{p.token1}</div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{p.dex} · {p.chain} · {p.feeTier}%</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TVL</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(p.tvl)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 量</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.volume24h)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>APY</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.apy.toFixed(1)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>APR 基础</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{p.aprBase.toFixed(1)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>APR 奖励</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{p.aprReward.toFixed(1)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>利用率</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{p.utilizationRate.toFixed(1)}%</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>LP 持有</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{p.lpHolders.toLocaleString()}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>24h 变化</div><div className="text-xl font-bold tabular-nums" style={{ color: changeColor(p.change24h) }}>{formatPercent(p.change24h)}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>储备</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span style={{ color: BRAND.textMuted }}>{p.token0}: </span><span style={{ color: BRAND.text }}>{formatNumber(p.reserve0)}</span></div><div><span style={{ color: BRAND.textMuted }}>{p.token1}: </span><span style={{ color: BRAND.text }}>{formatNumber(p.reserve1)}</span></div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>奖励代币</div>
                  <div className="flex flex-wrap gap-1.5">{p.rewardTokens.map((rt, j) => <span key={j} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>{rt}</span>)}</div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>添加流动性</button><button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>查看池</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MEV Drawer */}
      {drawer.open && drawer.type === 'mev' && drawer.payload && (() => {
        const m = MEV_ALERTS.find(x => x.id === drawer.payload);
        if (!m) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${MEV_SEVERITY_COLORS[m.severity]}20`, color: MEV_SEVERITY_COLORS[m.severity] }}><Shield size={20} /></div>
                  <div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{MEV_TYPE_LABELS[m.type]} · {MEV_SEVERITY_LABELS[m.severity]}</div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{m.chain} · {m.dex} · {m.detectedAt}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{m.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>交易额</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(m.amountUsd)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>实际损失</div><div className="text-xl font-bold tabular-nums" style={{ color: '#F6465D' }}>{formatUsd(m.lossUsd)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>保护节省</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(m.savedUsd)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>Gas 价</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{m.gasGwei.toFixed(1)} gwei</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>保护机制</div>
                  <div className="flex items-center gap-2"><span className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{m.protectionType}</span>{m.mitigated && <span className="px-2 py-1 rounded text-[10px] flex items-center gap-0.5" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}><ShieldCheck size={10} />已缓解</span>}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>机器人 / 交易</div>
                  <div className="space-y-1 text-[11px] font-mono"><div><span style={{ color: BRAND.textMuted }}>Bot: </span><span style={{ color: BRAND.text }}>{m.bot}</span></div><div><span style={{ color: BRAND.textMuted }}>Tx: </span><span style={{ color: BRAND.text }}>{truncateHash(m.txHash, 12)}</span></div><div><span style={{ color: BRAND.textMuted }}>Block: </span><span style={{ color: BRAND.text }}>{m.blockNumber.toLocaleString()}</span></div></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Monitor Drawer */}
      {drawer.open && drawer.type === 'monitor' && drawer.payload && (() => {
        const m = MONITORS.find(x => x.id === drawer.payload);
        if (!m) return null;
        const sb = monitorStatusBadge(m.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}><Activity size={20} /></div>
                  <div>
                    <div className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>跨链监控 #{m.id} <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span></div>
                    <div className="text-[11px] font-mono" style={{ color: BRAND.textMuted }}>{truncateHash(m.txHash, 10)}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{m.description}</p>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>进度 ({m.progress}%)</div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.bg }}><div className="h-full rounded-full" style={{ width: `${m.progress}%`, backgroundColor: sb.fg }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>金额</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{m.amount.toLocaleString()}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>桥费</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(m.fee)}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>状态机</div>
                  <div className="space-y-2">{m.steps.map((s, j) => <div key={j} className="flex items-center gap-2 text-[11px]"><span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: s.status === 'done' ? BRAND.primaryLt : s.status === 'active' ? 'rgba(68,219,244,0.10)' : s.status === 'failed' ? 'rgba(246,70,93,0.10)' : 'rgba(176,176,176,0.10)', color: s.status === 'done' ? BRAND.primary : s.status === 'active' ? BRAND.info : s.status === 'failed' ? '#F6465D' : BRAND.textMuted }}>{s.status === 'done' ? <CheckCircle2 size={12} /> : s.status === 'active' ? <Activity size={12} /> : s.status === 'failed' ? <XCircle size={12} /> : <Clock size={12} />}</span><span style={{ color: BRAND.text }}>{s.name}</span><span style={{ color: BRAND.textMuted }} className="ml-auto font-mono text-[10px]">{s.time}</span></div>)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>参与方</div>
                  <div className="space-y-1 text-[11px] font-mono"><div><span style={{ color: BRAND.textMuted }}>发送方: </span><span style={{ color: BRAND.text }}>{m.sender}</span></div><div><span style={{ color: BRAND.textMuted }}>接收方: </span><span style={{ color: BRAND.text }}>{m.receiver}</span></div></div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>查看浏览器</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Strategy Drawer */}
      {drawer.open && drawer.type === 'strategy' && drawer.payload && (() => {
        const s = STRATEGIES.find(x => x.id === drawer.payload);
        if (!s) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.iconColor}20`, color: s.iconColor }}><Sliders size={20} /></div>
                  <div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{s.name}</div>
                    <div className="text-[11px]" style={{ color: BRAND.textMuted }}>{ALGO_LABELS[s.algorithm]} · {s.enabled ? '已启用' : '已停用'}</div>
                  </div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>{s.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>累计节省</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(s.savedAmount)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>交易次数</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{s.txCount.toLocaleString()}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>平均节省</div><div className="text-xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(s.avgSaving)}</div></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}><div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>创建时间</div><div className="text-base font-bold" style={{ color: BRAND.text }}>{s.createdAt}</div></div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>4 维权重</div>
                  <div className="grid grid-cols-4 gap-2">{[{'l':'价格','v':s.weights.price,'c':BRAND.primary},{'l':'速度','v':s.weights.speed,'c':'#44DBF4'},{'l':'安全','v':s.weights.security,'c':'#A855F7'},{'l':'MEV','v':s.weights.mev,'c':'#F6465D'}].map((w, j) => <div key={j} className="text-center"><div className="text-[9px]" style={{ color: BRAND.textMuted }}>{w.l}</div><div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: BRAND.bg }}><div className="h-full rounded-full" style={{ width: `${w.v * 100}%`, backgroundColor: w.c }} /></div><div className="text-[9px] mt-0.5 font-bold" style={{ color: w.c }}>{(w.v * 100).toFixed(0)}%</div></div>)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>约束</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]"><div><span style={{ color: BRAND.textMuted }}>最大跳数: </span><span style={{ color: BRAND.text }}>{s.constraints.maxHops}</span></div><div><span style={{ color: BRAND.textMuted }}>最大滑点: </span><span style={{ color: BRAND.text }}>{(s.constraints.maxSlippage).toFixed(2)}%</span></div><div><span style={{ color: BRAND.textMuted }}>最大 Gas: </span><span style={{ color: BRAND.text }}>{formatUsd(s.constraints.maxGasUsd)}</span></div><div><span style={{ color: BRAND.textMuted }}>最小流动性: </span><span style={{ color: BRAND.text }}>{formatUsd(s.constraints.minLiquidity)}</span></div><div><span style={{ color: BRAND.textMuted }}>MEV 保护: </span><span style={{ color: s.constraints.requireMev ? BRAND.primary : BRAND.text }}>{s.constraints.requireMev ? '是' : '否'}</span></div><div><span style={{ color: BRAND.textMuted }}>审计要求: </span><span style={{ color: s.constraints.requireAudit ? BRAND.primary : BRAND.text }}>{s.constraints.requireAudit ? '是' : '否'}</span></div></div>
                </div>
                <div className="flex gap-2"><button className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>使用此策略</button></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* API Drawer */}
      {drawer.open && drawer.type === 'api' && (
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}><Code size={20} /></div>
                  <div><div className="text-base font-bold" style={{ color: BRAND.text }}>API 集成文档</div><div className="text-[11px]" style={{ color: BRAND.textMuted }}>RESTful + WebSocket</div></div>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs font-mono mb-2" style={{ color: BRAND.primary }}>GET /v1/aggregator/routes</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>查询跨链路由推荐，支持 from/to/amount/strategy/chain 等参数。</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs font-mono mb-2" style={{ color: BRAND.primary }}>POST /v1/aggregator/swap</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>执行跨链 swap，Body 包含 routeId/slippage/wallet。</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs font-mono mb-2" style={{ color: BRAND.primary }}>GET /v1/aggregator/atomic/{'{id}'}</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>查询原子交易状态、HashLock、TimeLock 等。</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs font-mono mb-2" style={{ color: BRAND.primary }}>WS /v1/aggregator/monitor</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>实时跨链监控推送，状态机变化即时通知。</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.20)' }}>
                  <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>所有接口均为<strong style={{ color: BRAND.text }}>mock 演示</strong>，仅作<strong style={{ color: BRAND.primary }}>技术研究</strong>展示。</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Help Drawer */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}><HelpCircle size={18} /></div>
                <div className="text-base font-bold" style={{ color: BRAND.text }}>帮助 / 快捷键 / 合规</div>
              </div>
              <button onClick={() => setHelpOpen(false)} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}><X size={16} style={{ color: BRAND.textMuted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>键盘快捷键</div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between"><span style={{ color: BRAND.text }}>/ 聚焦搜索</span><kbd className="px-2 py-0.5 rounded font-mono text-[10px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>/</kbd></div>
                  <div className="flex items-center justify-between"><span style={{ color: BRAND.text }}>Esc 关闭 Drawer / Help</span><kbd className="px-2 py-0.5 rounded font-mono text-[10px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>Esc</kbd></div>
                  <div className="flex items-center justify-between"><span style={{ color: BRAND.text }}>Tab 切换 Tab</span><kbd className="px-2 py-0.5 rounded font-mono text-[10px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>Tab</kbd></div>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>核心能力</div>
                <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: BRAND.textMuted }}>
                  <li>· 10 条公链集成（Ethereum/BSC/Arbitrum/Optimism/Polygon/Base/Avalanche/Solana/Fantom/Linea）</li>
                  <li>· 64 个 DEX 协议聚合（Uniswap/Pancake/Curve/Aerodrome 等）</li>
                  <li>· 24 个跨链桥（Stargate/LayerZero/Wormhole/Hyperlane 等）</li>
                  <li>· 跨链原子交易（HTLC/Optimistic/xCall）</li>
                  <li>· MEV 保护（Flashbots/Private Pool/MEV Blocker/CoW）</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,80,80,0.05)', border: '1px solid rgba(255,80,80,0.20)' }}>
                <div className="text-[10px] mb-2 flex items-center gap-1" style={{ color: '#F6465D' }}><ShieldAlert size={10} />合规说明</div>
                <ul className="text-[11px] leading-relaxed space-y-1" style={{ color: BRAND.textMuted }}>
                  <li>· 严格规避"承诺收益 / 保本 / 刚兑 / 萨摩亚持牌 / MSA / DSAEX"</li>
                  <li>· 所有数据为 <strong style={{ color: BRAND.primary }}>mock 演示</strong>，仅作<strong style={{ color: BRAND.text }}>技术研究 + 合规研究方向</strong></li>
                  <li>· 不构成投资建议、收益保证或持牌承诺</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      })()}

    </div>
  );
}
