'use client';

/**
 * PortalLrt - 流动性再质押中心 (2026-07-20 Q05 P3.43)
 *
 * 页面定位：
 * - 中萨数字科技交易所 流动性再质押中心（Liquid Restaking / LRT）
 * - 底层资产 / LST 池 / LRT 协议 / AVS 服务 / 收益层级 / 积分系统 / 跨链再质押 / 风险监控 / 策略组合 / 解质押队列
 * - 与 P3.26 衍生品 + P3.29 DeFi + P3.30 跨链桥 + P3.42 跨链聚合
 *   形成"挖矿-质押-再质押-收益层级-跨链流通"完整能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 底层资产 / LST 池 / LRT 协议 / AVS 服务 / 收益层级 / 积分系统 / 跨链再质押 / 风险监控 / 策略组合 / 解质押队列 / 帮助
 * - 10+ 区块、9+ 交互、11+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有底层资产 / LST / LRT / AVS / 收益 / 积分数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"技术研究 + 合规研究方向"双重定性
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Layers,
  Box,
  Boxes,
  Database,
  Server,
  Coins,
  CircleDollarSign,
  DollarSign,
  Banknote,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  MoveRight,
  MoveDownRight,
  ArrowDownUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ExternalLink,
  Link2,
  LinkIcon,
  Copy as CopyIcon,
  Share2,
  Download,
  Plus,
  Minus,
  PlusCircle,
  CheckCircle,
  CheckCircle2,
  Check,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  AlertOctagon as AlertOctagonIcon,
  CircleDot,
  CircleSlash,
  CircleDashed,
  CircleCheck,
  CircleX,
  CircleHelp,
  Circle,
  Square,
  Hexagon,
  Diamond,
  Triangle,
  Octagon,
  OctagonAlert,
  OctagonX,
  Lock,
  Unlock,
  Key,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Eye,
  EyeOff,
  Activity,
  Gauge,
  Zap,
  Rocket,
  Flame,
  Sparkles,
  Star,
  StarOff,
  Heart,
  Bookmark,
  BookmarkCheck,
  Bell,
  BellRing,
  BellOff,
  Clock,
  Calendar,
  Timer,
  TimerReset,
  Hourglass,
  History,
  CalendarClock,
  CalendarDays,
  Hash,
  Tag,
  Tags,
  FileText,
  FileSearch,
  FileCheck,
  FileBadge,
  FileClock,
  BookOpen,
  BookMarked,
  ScrollText,
  Scroll,
  Stamp,
  Award,
  Medal,
  Trophy,
  Crown,
  Gem,
  Verified,
  BadgeCheck,
  BadgeAlert,
  BadgeInfo,
  ListTree,
  ListChecks,
  ListOrdered,
  Network,
  GitBranch,
  GitFork,
  GitCommit,
  GitMerge,
  Workflow,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  TrendingUpDown,
  ChartColumn,
  ChartColumnIncreasing,
  ChartColumnDecreasing,
  ChartBar,
  ChartBarIncreasing,
  ChartBarDecreasing,
  ChartLine,
  ChartArea,
  ChartNetwork,
  ChartSpline,
  ChartPie,
  Radar,
  Radio,
  RadioTower,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Wifi,
  WifiOff,
  Globe,
  Globe2,
  Map,
  MapPin,
  Compass,
  Building,
  Building2,
  Landmark,
  Briefcase,
  Handshake,
  Coins as CoinsIcon,
  Wallet,
  Vault,
  CoinsIcon,
  Settings,
  Settings2,
  Sliders,
  SlidersHorizontal,
  Cog,
  Wrench,
  Hammer,
  Tool,
  Plug,
  PlugZap,
  Unplug,
  Cable,
  Power,
  PowerOff,
  Play,
  Pause,
  SkipForward,
  Rewind,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Inbox,
  Archive,
  ArchiveX,
  ArchiveRestore,
  Trash2,
  Trash,
  Edit,
  Edit2,
  Edit3,
  Pencil,
  PencilLine,
  Sigma,
  Infinity as InfinityIcon,
  Calculator,
  Package,
  PackageOpen,
  Package2,
  PackageCheck,
  PackageX,
  PackageSearch,
  Puzzle,
  HelpCircle,
  Info,
  Lightbulb,
  AtSign,
  Asterisk,
  Equal,
  EqualNot,
  XSquare,
  XOctagon,
  X as XIcon,
  ClipboardCheck,
  ClipboardList,
  ClipboardCopy,
  Crosshair,
  Currency,
  Receipt,
  Hash as HashIcon,
  ScanLine,
  Scan,
  QrCode,
  Binary,
  Cpu,
  HardDrive,
  Terminal,
  Code,
  Code2,
  Atom,
  FlaskConical,
  Microscope,
  Telescope,
  TestTube,
  Beaker,
  Layers3,
  Sprout,
  TreePine,
  Trees,
  Leaf,
  Flame as FlameIcon,
  Mountain,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Droplet,
  Waves,
  Snowflake,
  Sparkle,
  PartyPopper,
  Gift,
  Trophy as TrophyIcon,
} from 'lucide-react';

import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============== 类型定义 ==============

type Tab =
  | 'overview'
  | 'underlying'
  | 'lst'
  | 'protocols'
  | 'avs'
  | 'yield'
  | 'points'
  | 'cross'
  | 'risk'
  | 'strategy'
  | 'exit'
  | 'help';

type SortBy = 'tvl' | 'apy' | 'newest' | 'risk' | 'name';

type DrawerType =
  | 'underlying'
  | 'lst'
  | 'protocol'
  | 'avs'
  | 'yield'
  | 'points'
  | 'cross'
  | 'risk'
  | 'strategy'
  | 'exit'
  | 'integrate'
  | null;

interface UnderlyingAsset {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  iconColor: string;
  price: number;
  marketCap: number;
  totalStaked: number;
  totalRestaked: number;
  restakingRatio: number;
  baseApy: number;
  consensus: string;
  validators: number;
  slashingHistory: number;
  uptime: number;
  status: 'active' | 'paused' | 'deprecated';
  description: string;
  contracts: { staking: string; restaking: string; rewards: string };
  riskScore: number;
  tvl: number;
  restakingProtocols: number;
  volume24h: number;
  change24h: number;
  features: string[];
  lastUpgrade: string;
  finality: number;
  iconBg: string;
}

interface LstToken {
  id: string;
  symbol: string;
  name: string;
  underlying: string;
  protocol: string;
  chain: string;
  iconColor: string;
  price: number;
  totalSupply: number;
  tvl: number;
  exchangeRate: number;
  baseApy: number;
  restakingApy: number;
  totalApy: number;
  holders: number;
  depegRisk: number;
  liquidity: number;
  validators: number;
  exitQueue: number;
  restakingEnabled: boolean;
  status: 'active' | 'paused' | 'deprecated' | 'preview';
  description: string;
  auditBy: string[];
  features: string[];
  lastIncident: string;
  iconBg: string;
}

interface LrtProtocol {
  id: string;
  name: string;
  symbol: string;
  category: 'lrt' | 'lsr' | 'native' | 'aggregator';
  chain: string;
  iconColor: string;
  tvl: number;
  totalUsers: number;
  supportedLsts: string[];
  supportedAvs: number;
  baseApy: number;
  averageApy: number;
  restakingApy: number;
  pointsApy: number;
  totalApy: number;
  tokenPrice: number;
  marketCap: number;
  fdv: number;
  launchDate: string;
  stage: 'mainnet' | 'testnet' | 'preview';
  auditBy: string[];
  slashingRisk: number;
  smartContractRisk: number;
  depegRisk: number;
  uptime: number;
  governance: string;
  bugBounty: number;
  status: 'active' | 'paused' | 'deprecated' | 'preview';
  description: string;
  features: string[];
  iconBg: string;
}

interface AvsService {
  id: string;
  name: string;
  category: 'oracle' | 'da' | 'bridge' | 'coprocessor' | 'mev' | 'keeper' | 'indexer' | 'attestation';
  chain: string;
  iconColor: string;
  rewardApy: number;
  totalRestaked: number;
  operatorCount: number;
  uptime: number;
  slashHistory: number;
  registered: string;
  status: 'live' | 'beta' | 'mainnet' | 'testnet' | 'preview';
  description: string;
  features: string[];
  requirements: { minStake: number; hardware: string; latency: number };
  slashingConditions: string[];
  metrics: { requests24h: number; successRate: number; avgLatency: number };
  restakingProtocols: string[];
  iconBg: string;
}

interface YieldTier {
  id: string;
  user: string;
  protocol: string;
  protocolId: string;
  underlying: string;
  amount: number;
  baseReward: number;
  avsReward: number;
  pointsReward: number;
  tokenReward: number;
  totalReward: number;
  baseApy: number;
  avsApy: number;
  pointsApy: number;
  tokenApy: number;
  totalApy: number;
  status: 'active' | 'pending' | 'paused' | 'claimed' | 'expired';
  startTime: string;
  endTime: string;
  nextClaim: string;
  compounding: boolean;
  autoCompound: boolean;
  description: string;
  rewards: { type: string; amount: number; currency: string }[];
  iconColor: string;
}

interface PointsAccount {
  id: string;
  account: string;
  protocol: string;
  protocolId: string;
  totalPoints: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  rank: number;
  totalUsers: number;
  multiplier: number;
  multiplierReason: string[];
  estimatedAirdrop: number;
  estimatedValue: number;
  status: 'active' | 'eligible' | 'claimed' | 'expired';
  joinedAt: string;
  lastUpdate: string;
  boostFactors: { type: string; value: number; description: string }[];
  upcoming: { type: string; date: string; expected: number }[];
  iconColor: string;
}

interface CrossChainRestake {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: number;
  bridge: string;
  protocol: string;
  protocolId: string;
  status: 'completed' | 'pending' | 'failed' | 'bridging' | 'restaking';
  txHash: string;
  bridgeTime: number;
  restakeTime: number;
  totalTime: number;
  fee: number;
  feeUsd: number;
  apy: number;
  timestamp: string;
  description: string;
  routeSteps: { step: number; action: string; chain: string; status: string; hash: string }[];
  color: string;
}

interface RiskEvent {
  id: string;
  type: 'slash' | 'exploit' | 'depeg' | 'pause' | 'governance' | 'oracle' | 'upgrade';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  protocol: string;
  protocolId: string;
  avs: string;
  title: string;
  description: string;
  amount: number;
  status: 'ongoing' | 'mitigated' | 'recovered' | 'monitoring' | 'closed';
  timestamp: string;
  affected: number;
  recovered: number;
  txHash: string;
  resolution: string;
  iconColor: string;
}

interface RestakeStrategy {
  id: string;
  name: string;
  description: string;
  category: 'auto-restake' | 'dual-mine' | 'optimized' | 'cross-chain' | 'points-farming' | 'low-risk' | 'high-yield';
  protocols: string[];
  avs: string[];
  underlying: string;
  expectedApy: number;
  riskScore: number;
  tvl: number;
  totalUsers: number;
  complexity: 'low' | 'medium' | 'high';
  rebalanceFreq: string;
  autoCompound: boolean;
  crossChain: boolean;
  points: boolean;
  performance: { day1: number; day7: number; day30: number; day90: number };
  status: 'active' | 'beta' | 'preview' | 'paused';
  iconColor: string;
  features: string[];
}

interface ExitQueue {
  id: string;
  user: string;
  protocol: string;
  protocolId: string;
  asset: string;
  amount: number;
  requestedAt: string;
  estimatedExit: string;
  actualExit: string | null;
  position: number;
  totalQueue: number;
  queueAhead: number;
  queueBehind: number;
  waitDays: number;
  progress: number;
  status: 'queued' | 'processing' | 'ready' | 'claimed' | 'expired' | 'cancelled';
  fee: number;
  reason: string;
  color: string;
}


// ============== 工具函数 ==============

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toString();
}

function formatUsd(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(2);
}

function formatPct(n: number, digits = 2): string {
  return n.toFixed(digits) + '%';
}

function truncateHash(hash: string, len = 8): string {
  if (!hash) return '';
  if (hash.length <= len * 2 + 3) return hash;
  return hash.slice(0, len) + '...' + hash.slice(-len);
}

function formatTime(s: number): string {
  if (s < 60) return s + 's';
  if (s < 3600) return (s / 60).toFixed(1) + 'm';
  if (s < 86400) return (s / 3600).toFixed(1) + 'h';
  return (s / 86400).toFixed(1) + 'd';
}

function formatTimeMin(m: number): string {
  if (m < 60) return m.toFixed(0) + 'min';
  if (m < 1440) return (m / 60).toFixed(1) + 'h';
  return (m / 1440).toFixed(1) + 'd';
}

function statusBadge(s: string): { label: string; fg: string } {
  switch (s) {
    case 'active':
    case 'live':
    case 'mainnet':
    case 'completed':
    case 'verified':
    case 'eligible':
    case 'ready':
    case 'claimed':
    case 'recovered':
    case 'mitigated':
      return { label: '运行中', fg: BRAND.primary };
    case 'paused':
    case 'pending':
    case 'queued':
    case 'monitoring':
      return { label: '进行中', fg: '#FFA940' };
    case 'bridging':
    case 'restaking':
    case 'processing':
      return { label: '处理中', fg: BRAND.info };
    case 'beta':
    case 'testnet':
    case 'preview':
      return { label: '测试中', fg: '#8B5CF6' };
    case 'failed':
    case 'deprecated':
    case 'expired':
    case 'cancelled':
    case 'closed':
      return { label: '已停用', fg: '#F6465D' };
    case 'critical':
    case 'high':
    case 'ongoing':
      return { label: '高风险', fg: '#F6465D' };
    case 'medium':
      return { label: '中风险', fg: '#FFA940' };
    case 'low':
    case 'info':
      return { label: '低风险', fg: BRAND.info };
    default:
      return { label: s, fg: BRAND.textMuted };
  }
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#F6465D',
  high: '#FF7A45',
  medium: '#FFA940',
  low: '#44DBF4',
  info: '#0ECB81',
};

const CATEGORY_COLORS: Record<string, string> = {
  oracle: '#0ECB81',
  da: '#44DBF4',
  bridge: '#A855F7',
  coprocessor: '#FFA940',
  mev: '#F6465D',
  keeper: '#14B881',
  indexer: '#8B5CF6',
  attestation: '#FF7A45',
};

const CATEGORY_LABELS: Record<string, string> = {
  oracle: '预言机',
  da: '数据可用性',
  bridge: '跨链桥',
  coprocessor: '协处理器',
  mev: 'MEV 防护',
  keeper: 'Keeper',
  indexer: '索引器',
  attestation: '证明服务',
};


// ============== Mock 数据：底层资产 ==============

const UNDERLYING_ASSETS: UnderlyingAsset[] = [
  {
    id: 'und-eth',
    symbol: 'ETH',
    name: 'Ethereum',
    chain: 'Ethereum',
    iconColor: '#627EEA',
    price: 3284.42,
    marketCap: 396000000000,
    totalStaked: 38400000,
    totalRestaked: 8420000,
    restakingRatio: 21.9,
    baseApy: 3.4,
    consensus: 'PoS / Beacon Chain',
    validators: 1084200,
    slashingHistory: 18,
    uptime: 99.98,
    status: 'active',
    description: '以太坊主网原生资产，PoS 共识，128 万验证者，是再质押协议最主流的底层资产。',
    contracts: { staking: '0x00000000219ab540356cBB839Cbe05303d7705Fa', restaking: '0x39053D51B77DC0d36036Fc1fCe8E77Ee05610472', rewards: '0xae78736Cd615f374D3085123A210448E74Fc6393' },
    riskScore: 12,
    tvl: 126200000000,
    restakingProtocols: 24,
    volume24h: 18420000000,
    change24h: 1.84,
    features: ['原生质押', '流动性质押 (LST)', '再质押 (LRT)', 'EigenLayer', 'AVS 服务'],
    lastUpgrade: '2026-05-08 (Pectra)',
    finality: 768,
    iconBg: 'rgba(98,126,234,0.15)',
  },
  {
    id: 'und-sol',
    symbol: 'SOL',
    name: 'Solana',
    chain: 'Solana',
    iconColor: '#14F195',
    price: 184.62,
    marketCap: 88400000000,
    totalStaked: 384000000,
    totalRestaked: 64200000,
    restakingRatio: 16.7,
    baseApy: 6.8,
    consensus: 'PoS / Tower BFT',
    validators: 1480,
    slashingHistory: 0,
    uptime: 99.92,
    status: 'active',
    description: 'Solana 高性能公链原生资产，PoS 共识，500ms 出块时间，Solayer 再质押生态核心底层。',
    contracts: { staking: 'Stake11111111111111111111111111111111111111', restaking: 'sSOL11111111111111111111111111111111111111', rewards: 'Jito11111111111111111111111111111111111111' },
    riskScore: 18,
    tvl: 11800000000,
    restakingProtocols: 12,
    volume24h: 4280000000,
    change24h: 2.42,
    features: ['原生质押', 'LST (JitoSOL/mSOL)', 'Solayer 再质押', '高 TPS', '低费用'],
    lastUpgrade: '2026-04-18 (Agave)',
    finality: 12,
    iconBg: 'rgba(20,241,149,0.15)',
  },
  {
    id: 'und-bnb',
    symbol: 'BNB',
    name: 'BNB Chain',
    chain: 'BNB Chain',
    iconColor: '#F3BA2F',
    price: 624.18,
    marketCap: 92400000000,
    totalStaked: 16840000,
    totalRestaked: 1240000,
    restakingRatio: 7.4,
    baseApy: 4.2,
    consensus: 'PoS / BNB PoSA',
    validators: 41,
    slashingHistory: 0,
    uptime: 99.86,
    status: 'active',
    description: 'BNB Chain 原生资产，PoSA 共识，21+20 验证者，BNBx 与 Lista 再质押生态底层。',
    contracts: { staking: '0x0000000000000000000000000000000000002002', restaking: '0x0000000000000000000000000000000000000100', rewards: '0x0000000000000000000000000000000000000200' },
    riskScore: 22,
    tvl: 5840000000,
    restakingProtocols: 6,
    volume24h: 1840000000,
    change24h: 0.84,
    features: ['原生质押', 'BNBx', 'Lista DAO', 'BSC 生态', '低费用'],
    lastUpgrade: '2026-03-22 (Maxwell)',
    finality: 3,
    iconBg: 'rgba(243,186,47,0.15)',
  },
  {
    id: 'und-avax',
    symbol: 'AVAX',
    name: 'Avalanche',
    chain: 'Avalanche',
    iconColor: '#E84142',
    price: 38.42,
    marketCap: 15400000000,
    totalStaked: 248000000,
    totalRestaked: 18400000,
    restakingRatio: 7.4,
    baseApy: 6.4,
    consensus: 'PoS / Snowman',
    validators: 1284,
    slashingHistory: 4,
    uptime: 99.84,
    status: 'active',
    description: 'Avalanche C-Chain 原生资产，PoS 共识，子网 + 再质押生态 (GoGoPlus) 底层。',
    contracts: { staking: '0x0000000000000000000000000000000000000000', restaking: '0xAvax11111111111111111111111111111111111111', rewards: '0xReward111111111111111111111111111111111111' },
    riskScore: 24,
    tvl: 2840000000,
    restakingProtocols: 4,
    volume24h: 642000000,
    change24h: -0.62,
    features: ['原生质押', 'sAVAX', 'GoGoPlus', '子网', '高 TPS'],
    lastUpgrade: '2026-02-12 (Etna)',
    finality: 2,
    iconBg: 'rgba(232,65,66,0.15)',
  },
  {
    id: 'und-tia',
    symbol: 'TIA',
    name: 'Celestia',
    chain: 'Celestia',
    iconColor: '#7B2BF9',
    price: 6.84,
    marketCap: 1240000000,
    totalStaked: 184000000,
    totalRestaked: 38400000,
    restakingRatio: 20.9,
    baseApy: 12.4,
    consensus: 'PoS / Tendermint',
    validators: 184,
    slashingHistory: 0,
    uptime: 99.94,
    status: 'active',
    description: 'Celestia 模块化 DA 原生资产，PoS 共识，MilkyWay 再质押生态核心底层。',
    contracts: { staking: '0xTIA1111111111111111111111111111111111111', restaking: '0xTIA1111111111111111111111111111111111112', rewards: '0xTIA1111111111111111111111111111111111113' },
    riskScore: 32,
    tvl: 1240000000,
    restakingProtocols: 5,
    volume24h: 184000000,
    change24h: 3.18,
    features: ['原生质押', 'MilkyWay', 'DA 层', '模块化', 'Blobstream'],
    lastUpgrade: '2026-04-02 (Mammoth)',
    finality: 12,
    iconBg: 'rgba(123,43,249,0.15)',
  },
  {
    id: 'und-atom',
    symbol: 'ATOM',
    name: 'Cosmos Hub',
    chain: 'Cosmos',
    iconColor: '#2E3148',
    price: 7.84,
    marketCap: 3080000000,
    totalStaked: 248000000,
    totalRestaked: 12400000,
    restakingRatio: 5.0,
    baseApy: 18.4,
    consensus: 'PoS / Tendermint',
    validators: 184,
    slashingHistory: 2,
    uptime: 99.88,
    status: 'active',
    description: 'Cosmos Hub 原生资产，PoS 共识，Liquid Staking Module + ReStake 生态底层。',
    contracts: { staking: 'cosmos1staking000000000000000000000000', restaking: 'cosmos1restaking0000000000000000000000', rewards: 'cosmos1rewards0000000000000000000000000' },
    riskScore: 28,
    tvl: 1840000000,
    restakingProtocols: 3,
    volume24h: 184000000,
    change24h: 0.42,
    features: ['原生质押', 'Stride', 'Quicksilver', 'ReStake', 'LSM'],
    lastUpgrade: '2026-01-15 (v17)',
    finality: 6,
    iconBg: 'rgba(46,49,72,0.15)',
  },
  {
    id: 'und-inj',
    symbol: 'INJ',
    name: 'Injective',
    chain: 'Injective',
    iconColor: '#00F4FF',
    price: 24.18,
    marketCap: 2420000000,
    totalStaked: 96200000,
    totalRestaked: 6420000,
    restakingRatio: 6.7,
    baseApy: 14.2,
    consensus: 'PoS / Tendermint',
    validators: 60,
    slashingHistory: 0,
    uptime: 99.92,
    status: 'active',
    description: 'Injective 原生资产，PoS 共识，Hydro + iZi 流动质押 + 衍生品底层。',
    contracts: { staking: 'inj1staking0000000000000000000000000000', restaking: 'inj1restaking000000000000000000000000', rewards: 'inj1rewards0000000000000000000000000000' },
    riskScore: 34,
    tvl: 624000000,
    restakingProtocols: 2,
    volume24h: 248000000,
    change24h: 4.28,
    features: ['原生质押', 'Hydro', 'iZi Swap', '衍生品', 'EVM 兼容'],
    lastUpgrade: '2026-03-08 (Hydro)',
    finality: 2,
    iconBg: 'rgba(0,244,255,0.15)',
  },
  {
    id: 'und-dot',
    symbol: 'DOT',
    name: 'Polkadot',
    chain: 'Polkadot',
    iconColor: '#E6007A',
    price: 7.24,
    marketCap: 10840000000,
    totalStaked: 884000000,
    totalRestaked: 18400000,
    restakingRatio: 2.1,
    baseApy: 11.8,
    consensus: 'NPoS',
    validators: 297,
    slashingHistory: 1,
    uptime: 99.94,
    status: 'active',
    description: 'Polkadot 中继链原生资产，NPoS 共识，Bifrost vDOT 流动质押 + 再质押底层。',
    contracts: { staking: '13UVJyLnbVp9RBZYFw76DjJe9X1PeXH1V3G5bZUH1EY3c', restaking: '14UVJyLnbVp9RBZYFw76DjJe9X1PeXH1V3G5bZUH1EY3c', rewards: '15UVJyLnbVp9RBZYFw76DjJe9X1PeXH1V3G5bZUH1EY3c' },
    riskScore: 26,
    tvl: 1840000000,
    restakingProtocols: 4,
    volume24h: 184000000,
    change24h: 0.84,
    features: ['NPoS', 'Bifrost', 'vDOT', '平行链', '跨链'],
    lastUpgrade: '2026-02-22 (v1.9)',
    finality: 24,
    iconBg: 'rgba(230,0,122,0.15)',
  },
];

// ============== Mock 数据：LST ==============

const LST_TOKENS: LstToken[] = [
  {
    id: 'lst-steth',
    symbol: 'stETH',
    name: 'Lido Staked ETH',
    underlying: 'ETH',
    protocol: 'Lido',
    chain: 'Ethereum',
    iconColor: '#00A3FF',
    price: 3284.18,
    totalSupply: 9842000,
    tvl: 32300000000,
    exchangeRate: 1.0842,
    baseApy: 3.4,
    restakingApy: 4.8,
    totalApy: 8.2,
    holders: 184200,
    depegRisk: 4,
    liquidity: 2480000000,
    validators: 38,
    exitQueue: 4,
    restakingEnabled: true,
    status: 'active',
    description: 'Lido 流动性质押 ETH，由 Curve / Balancer 深度流动性支撑，可 1:1 兑换 ETH。',
    auditBy: ['Trail of Bits', 'Sigma Prime', 'ChainSecurity'],
    features: ['1:1 锚定', 'EigenLayer 再质押', 'Curve 流动性', 'wstETH 包装', 'DeFi 抵押'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(0,163,255,0.15)',
  },
  {
    id: 'lst-rETH',
    symbol: 'rETH',
    name: 'Rocket Pool ETH',
    underlying: 'ETH',
    protocol: 'Rocket Pool',
    chain: 'Ethereum',
    iconColor: '#FF7B47',
    price: 3562.84,
    totalSupply: 1240000,
    tvl: 4420000000,
    exchangeRate: 1.1024,
    baseApy: 3.2,
    restakingApy: 4.4,
    totalApy: 7.6,
    holders: 84200,
    depegRisk: 6,
    liquidity: 384000000,
    validators: 2840,
    exitQueue: 2,
    restakingEnabled: true,
    status: 'active',
    description: 'Rocket Pool 流动性质押 ETH，去中心化验证者市场，rETH/ETH 汇率随奖励累积上升。',
    auditBy: ['Sigma Prime', 'Consensys Diligence'],
    features: ['去中心化', 'rETH/ETH 升值', 'EigenLayer', 'LIDO 兼容', '小型验证者友好'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(255,123,71,0.15)',
  },
  {
    id: 'lst-cbETH',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped ETH',
    underlying: 'ETH',
    protocol: 'Coinbase',
    chain: 'Ethereum',
    iconColor: '#1652F0',
    price: 3418.42,
    totalSupply: 1840000,
    tvl: 6280000000,
    exchangeRate: 1.0428,
    baseApy: 3.0,
    restakingApy: 4.2,
    totalApy: 7.2,
    holders: 184000,
    depegRisk: 3,
    liquidity: 248000000,
    validators: 0,
    exitQueue: 1,
    restakingEnabled: true,
    status: 'active',
    description: 'Coinbase 托管的流动性质押 ETH，机构友好，cbETH/ETH 汇率随奖励累积。',
    auditBy: ['Coinbase Security'],
    features: ['Coinbase 托管', '机构友好', 'EigenLayer', 'Base 集成', '合规方向'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(22,82,240,0.15)',
  },
  {
    id: 'lst-wstETH',
    symbol: 'wstETH',
    name: 'Wrapped stETH',
    underlying: 'stETH',
    protocol: 'Lido',
    chain: 'Ethereum',
    iconColor: '#00A3FF',
    price: 3862.18,
    totalSupply: 8420000,
    tvl: 32500000000,
    exchangeRate: 1.1762,
    baseApy: 3.4,
    restakingApy: 4.8,
    totalApy: 8.2,
    holders: 184200,
    depegRisk: 2,
    liquidity: 1840000000,
    validators: 0,
    exitQueue: 4,
    restakingEnabled: true,
    status: 'active',
    description: 'Lido stETH 的包装版本，非 rebasing，更适合 DeFi 集成与 LRT 协议使用。',
    auditBy: ['Trail of Bits', 'Sigma Prime'],
    features: ['非 rebasing', 'DeFi 友好', 'EigenLayer', 'Aave 支持', 'wstETH/ETH 升值'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(0,163,255,0.15)',
  },
  {
    id: 'lst-JitoSOL',
    symbol: 'JitoSOL',
    name: 'Jito Staked SOL',
    underlying: 'SOL',
    protocol: 'Jito',
    chain: 'Solana',
    iconColor: '#84CCAB',
    price: 218.42,
    totalSupply: 8840000,
    tvl: 1920000000,
    exchangeRate: 1.1842,
    baseApy: 6.8,
    restakingApy: 3.2,
    totalApy: 10.0,
    holders: 84200,
    depegRisk: 5,
    liquidity: 124000000,
    validators: 184,
    exitQueue: 2,
    restakingEnabled: true,
    status: 'active',
    description: 'Jito 流动性质押 SOL，含 MEV 收益分配，Solayer 再质押生态主流底层。',
    auditBy: ['Sec3', 'Neodyme'],
    features: ['MEV 收益', 'Solayer', 'Jito Stake Pool', '高 APY', 'Solana 主网'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(132,204,171,0.15)',
  },
  {
    id: 'lst-mSOL',
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    underlying: 'SOL',
    protocol: 'Marinade',
    chain: 'Solana',
    iconColor: '#6BACE0',
    price: 218.18,
    totalSupply: 6240000,
    tvl: 1360000000,
    exchangeRate: 1.1824,
    baseApy: 6.6,
    restakingApy: 3.0,
    totalApy: 9.6,
    holders: 64200,
    depegRisk: 4,
    liquidity: 84000000,
    validators: 124,
    exitQueue: 1,
    restakingEnabled: true,
    status: 'active',
    description: 'Marinade 流动性质押 SOL，委托给 100+ 验证者，分散化设计。',
    auditBy: ['Kudelski Security', 'Neodyme'],
    features: ['委托给多验证者', 'Solayer', 'Marinade Native', 'DeFi 集成', '一键质押'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(107,172,224,0.15)',
  },
  {
    id: 'lst-bnbx',
    symbol: 'BNBx',
    name: 'Lista BNBx',
    underlying: 'BNB',
    protocol: 'Lista DAO',
    chain: 'BNB Chain',
    iconColor: '#F3BA2F',
    price: 748.42,
    totalSupply: 1840000,
    tvl: 1380000000,
    exchangeRate: 1.1842,
    baseApy: 4.2,
    restakingApy: 6.4,
    totalApy: 10.6,
    holders: 24200,
    depegRisk: 8,
    liquidity: 48000000,
    validators: 0,
    exitQueue: 3,
    restakingEnabled: true,
    status: 'active',
    description: 'Lista DAO 流动性质押 BNB，支持 BNB Chain DeFi 集成与 Lista 再质押协议。',
    auditBy: ['CertiK', 'SlowMist'],
    features: ['BNB 质押', 'Lista 再质押', 'DeFi 抵押', 'slisBNB 包装', '高 APY'],
    lastIncident: '2025-11-12 (合约升级)',
    iconBg: 'rgba(243,186,47,0.15)',
  },
  {
    id: 'lst-maticX',
    symbol: 'MaticX',
    name: 'Stader MaticX',
    underlying: 'MATIC',
    protocol: 'Stader',
    chain: 'Polygon',
    iconColor: '#8247E5',
    price: 1.18,
    totalSupply: 184000000,
    tvl: 218000000,
    exchangeRate: 1.0842,
    baseApy: 4.8,
    restakingApy: 2.4,
    totalApy: 7.2,
    holders: 18420,
    depegRisk: 6,
    liquidity: 12000000,
    validators: 84,
    exitQueue: 5,
    restakingEnabled: false,
    status: 'active',
    description: 'Stader 流动性质押 MATIC，多签治理，Polygon 生态 DeFi 集成。',
    auditBy: ['Halborn', 'PeckShield'],
    features: ['MATIC 质押', 'DeFi 抵押', '多签治理', 'Polygon 生态', '中等 APY'],
    lastIncident: '无重大事件',
    iconBg: 'rgba(130,71,229,0.15)',
  },
];

// ============== Mock 数据：LRT 协议 ==============

const LRT_PROTOCOLS: LrtProtocol[] = [
  {
    id: 'lrt-eigenlayer',
    name: 'EigenLayer',
    symbol: 'EIGEN',
    category: 'native',
    chain: 'Ethereum',
    iconColor: '#1A88F8',
    tvl: 18420000000,
    totalUsers: 184200,
    supportedLsts: ['stETH', 'wstETH', 'rETH', 'cbETH', 'ETHx', 'METH', 'sfrxETH', 'osETH'],
    supportedAvs: 28,
    baseApy: 3.4,
    averageApy: 4.6,
    restakingApy: 4.8,
    pointsApy: 0,
    totalApy: 8.2,
    tokenPrice: 4.18,
    marketCap: 1840000000,
    fdv: 18400000000,
    launchDate: '2024-04-09',
    stage: 'mainnet',
    auditBy: ['Trail of Bits', 'Sigma Prime', 'ChainSecurity', 'Spearbit'],
    slashingRisk: 18,
    smartContractRisk: 12,
    depegRisk: 6,
    uptime: 99.96,
    governance: 'EIGEN Token + DAO',
    bugBounty: 2000000,
    status: 'active',
    description: 'EigenLayer 是以太坊再质押赛道的开山协议，集成 28+ AVS，TVL 184 亿美元，LRT 生态底层基础设施。',
    features: ['AVS 集合', 'LST 灵活', '主动验证服务', '原生再质押', 'EIGEN 代币'],
    iconBg: 'rgba(26,136,248,0.15)',
  },
  {
    id: 'lrt-solayer',
    name: 'Solayer',
    symbol: 'LAYER',
    category: 'native',
    chain: 'Solana',
    iconColor: '#14F195',
    tvl: 1180000000,
    totalUsers: 84200,
    supportedLsts: ['JitoSOL', 'mSOL', 'bSOL', 'INF', 'LST'],
    supportedAvs: 12,
    baseApy: 6.8,
    averageApy: 8.2,
    restakingApy: 3.2,
    pointsApy: 0,
    totalApy: 11.4,
    tokenPrice: 1.84,
    marketCap: 184000000,
    fdv: 1840000000,
    launchDate: '2024-06-18',
    stage: 'mainnet',
    auditBy: ['Sec3', 'Neodyme', 'Kudelski Security'],
    slashingRisk: 14,
    smartContractRisk: 18,
    depegRisk: 4,
    uptime: 99.94,
    governance: 'LAYER Token + DAO',
    bugBounty: 1000000,
    status: 'active',
    description: 'Solayer 是 Solana 主网的原生再质押协议，整合 JitoSOL/mSOL 等 LST，sSOL/sUSDS 双代币模型。',
    features: ['Solana 原生', '硬件加速', 'sSOL/sUSDS', '硬件级 AVS', '低费用'],
    iconBg: 'rgba(20,241,149,0.15)',
  },
  {
    id: 'lrt-renzo',
    name: 'Renzo',
    symbol: 'REZ',
    category: 'lrt',
    chain: 'Ethereum',
    iconColor: '#FFD84D',
    tvl: 3840000000,
    totalUsers: 184000,
    supportedLsts: ['stETH', 'wstETH', 'rETH', 'cbETH'],
    supportedAvs: 18,
    baseApy: 3.4,
    averageApy: 4.8,
    restakingApy: 4.8,
    pointsApy: 0,
    totalApy: 8.4,
    tokenPrice: 0.084,
    marketCap: 184000000,
    fdv: 840000000,
    launchDate: '2024-03-15',
    stage: 'mainnet',
    auditBy: ['Sigma Prime', 'Trail of Bits'],
    slashingRisk: 16,
    smartContractRisk: 14,
    depegRisk: 5,
    uptime: 99.92,
    governance: 'REZ Token + DAO',
    bugBounty: 1500000,
    status: 'active',
    description: 'Renzo 是 EigenLayer 上的 LRT 协议龙头，ezETH 主流 LRT 代币，与 EigenLayer 生态深度集成。',
    features: ['ezETH', 'EigenLayer LRT', 'LST 灵活', '积分系统', 'REZ 代币'],
    iconBg: 'rgba(255,216,77,0.15)',
  },
  {
    id: 'lrt-etherfi',
    name: 'EtherFi',
    symbol: 'ETHFI',
    category: 'lrt',
    chain: 'Ethereum',
    iconColor: '#62B6F1',
    tvl: 6240000000,
    totalUsers: 248000,
    supportedLsts: ['ETH Native', 'eETH', 'weETH'],
    supportedAvs: 22,
    baseApy: 3.2,
    averageApy: 4.4,
    restakingApy: 4.6,
    pointsApy: 0,
    totalApy: 7.8,
    tokenPrice: 3.18,
    marketCap: 1240000000,
    fdv: 3180000000,
    launchDate: '2024-02-12',
    stage: 'mainnet',
    auditBy: ['Trail of Bits', 'ChainSecurity', 'Sigma Prime'],
    slashingRisk: 18,
    smartContractRisk: 16,
    depegRisk: 6,
    uptime: 99.94,
    governance: 'ETHFI Token + DAO',
    bugBounty: 2000000,
    status: 'active',
    description: 'EtherFi 是去中心化 ETH 再质押协议，eETH + weETH 双代币，TEE 节点 + 节点运营者市场。',
    features: ['eETH/weETH', 'TEE 节点', '去中心化', 'Cash 信用卡', 'ETHFI 奖励'],
    iconBg: 'rgba(98,182,241,0.15)',
  },
  {
    id: 'lrt-kelp',
    name: 'Kelp DAO',
    symbol: 'KEP',
    category: 'lrt',
    chain: 'Ethereum',
    iconColor: '#20C997',
    tvl: 2420000000,
    totalUsers: 124000,
    supportedLsts: ['stETH', 'wstETH', 'rETH', 'cbETH', 'ETHx', 'METH'],
    supportedAvs: 16,
    baseApy: 3.4,
    averageApy: 4.4,
    restakingApy: 4.6,
    pointsApy: 0,
    totalApy: 8.0,
    tokenPrice: 0.124,
    marketCap: 124000000,
    fdv: 1240000000,
    launchDate: '2024-04-22',
    stage: 'mainnet',
    auditBy: ['Salus', 'QuillAudits'],
    slashingRisk: 14,
    smartContractRisk: 12,
    depegRisk: 5,
    uptime: 99.92,
    governance: 'KEP Token + DAO',
    bugBounty: 750000,
    status: 'active',
    description: 'Kelp DAO 是 LRT 协议之一，agETH + rsETH 多 LRT 代币，跨 Layer 2 集成与积分系统。',
    features: ['agETH', 'rsETH', 'Layer 2', '积分系统', 'KEP 奖励'],
    iconBg: 'rgba(32,201,151,0.15)',
  },
  {
    id: 'lrt-swell',
    name: 'Swell',
    symbol: 'SWELL',
    category: 'lrt',
    chain: 'Ethereum',
    iconColor: '#FF8FAB',
    tvl: 1480000000,
    totalUsers: 64000,
    supportedLsts: ['ETH Native', 'swETH', 'rswETH'],
    supportedAvs: 14,
    baseApy: 3.4,
    averageApy: 4.6,
    restakingApy: 4.8,
    pointsApy: 0,
    totalApy: 8.4,
    tokenPrice: 0.024,
    marketCap: 64000000,
    fdv: 240000000,
    launchDate: '2024-05-08',
    stage: 'mainnet',
    auditBy: ['Sigma Prime', 'Trail of Bits'],
    slashingRisk: 16,
    smartContractRisk: 14,
    depegRisk: 5,
    uptime: 99.94,
    governance: 'SWELL Token + DAO',
    bugBounty: 1000000,
    status: 'active',
    description: 'Swell 是 LRT 协议之一，swETH/rswETH 双代币，专注 EigenLayer 再质押与 PearlFi 集成。',
    features: ['swETH/rswETH', 'EigenLayer', 'PearlFi', 'Liquid AVS', 'SWELL 奖励'],
    iconBg: 'rgba(255,143,171,0.15)',
  },
  {
    id: 'lrt-puffer',
    name: 'Puffer',
    symbol: 'PUFETH',
    category: 'native',
    chain: 'Ethereum',
    iconColor: '#7B61FF',
    tvl: 1240000000,
    totalUsers: 42000,
    supportedLsts: ['ETH Native', 'pufETH'],
    supportedAvs: 12,
    baseApy: 3.6,
    averageApy: 5.2,
    restakingApy: 4.6,
    pointsApy: 0,
    totalApy: 9.2,
    tokenPrice: 3424.18,
    marketCap: 0,
    fdv: 0,
    launchDate: '2024-09-12',
    stage: 'mainnet',
    auditBy: ['Sigma Prime', 'ChainSecurity'],
    slashingRisk: 20,
    smartContractRisk: 18,
    depegRisk: 4,
    uptime: 99.92,
    governance: 'PUFF Token + DAO',
    bugBounty: 1500000,
    status: 'active',
    description: 'Puffer 是原生 ETH 流动再质押协议，pufETH 双代币 + 抗 MEV 验证节点 + EigenLayer 集成。',
    features: ['原生再质押', '抗 MEV', 'pufETH', '8 ETH 最低', 'EigenLayer'],
    iconBg: 'rgba(123,97,255,0.15)',
  },
  {
    id: 'lrt-mantle',
    name: 'Mantle',
    symbol: 'MNT',
    category: 'native',
    chain: 'Mantle',
    iconColor: '#000000',
    tvl: 1840000000,
    totalUsers: 84000,
    supportedLsts: ['ETH', 'mETH', 'cmETH'],
    supportedAvs: 8,
    baseApy: 3.2,
    averageApy: 4.0,
    restakingApy: 3.8,
    pointsApy: 0,
    totalApy: 7.0,
    tokenPrice: 0.84,
    marketCap: 2480000000,
    fdv: 8400000000,
    launchDate: '2023-07-15',
    stage: 'mainnet',
    auditBy: ['Trail of Bits', 'Salus'],
    slashingRisk: 12,
    smartContractRisk: 10,
    depegRisk: 4,
    uptime: 99.96,
    governance: 'MNT Token + DAO',
    bugBounty: 2000000,
    status: 'active',
    description: 'Mantle 是模块化 L2，mETH 流动质押 + EigenLayer 集成 + mETH Protocol 一站式。',
    features: ['L2', 'mETH', 'EigenLayer', '模块化', 'Bybit 背景'],
    iconBg: 'rgba(180,180,180,0.10)',
  },
];

// ============== Mock 数据：AVS 服务 ==============

const AVS_SERVICES: AvsService[] = [
  {
    id: 'avs-eigenda',
    name: 'EigenDA',
    category: 'da',
    chain: 'Ethereum',
    iconColor: '#8B5CF6',
    rewardApy: 4.2,
    totalRestaked: 1840000000,
    operatorCount: 84,
    uptime: 99.94,
    slashHistory: 0,
    registered: '2024-04-15',
    status: 'live',
    description: 'EigenDA 是 EigenLayer 首个 AVS，提供高吞吐数据可用性层，目标 10MB/s。',
    features: ['高吞吐 DA', 'Blobstream', 'Celestia 对比', '可扩展', '低费用'],
    requirements: { minStake: 32000, hardware: '32 vCPU + 64GB RAM + 1TB NVMe', latency: 100 },
    slashingConditions: ['数据不可用', '签名错误', '延迟超时'],
    metrics: { requests24h: 184200, successRate: 99.94, avgLatency: 84 },
    restakingProtocols: ['EigenLayer', 'Renzo', 'EtherFi', 'Kelp'],
    iconBg: 'rgba(139,92,246,0.15)',
  },
  {
    id: 'avs-chainlink',
    name: 'Chainlink CRE',
    category: 'oracle',
    chain: 'Ethereum',
// ============== KPI 卡片配置 ==============

function useKpiCards(kpi: any, formatUsd: any) {
  return [
    { label: '底层资产', value: kpi.underlyingAssets, suffix: '条链', iconName: 'Coins', color: BRAND.primary },
    { label: 'LST 池', value: kpi.supportedLsts, suffix: '池', iconName: 'Droplet', color: BRAND.info },
    { label: 'LRT 协议', value: kpi.supportedLrts, suffix: '协议', iconName: 'Boxes', color: '#A855F7' },
    { label: 'AVS 服务', value: kpi.supportedAvs, suffix: '服务', iconName: 'Network', color: '#FFA940' },
    { label: '总再质押', value: formatUsd(kpi.totalRestakedUsd), iconName: 'DollarSign', color: BRAND.primary, noCount: true },
    { label: 'LRT 流通量', value: kpi.totalLrtSupply.toLocaleString(), suffix: 'LRT', iconName: 'Hash', color: BRAND.info },
    { label: '平均 APY', value: kpi.averageApy.toFixed(2), suffix: '%', iconName: 'TrendingUp', color: '#0ECB81' },
    { label: '总用户数', value: kpi.totalUsers.toLocaleString(), suffix: '人', iconName: 'Users', color: '#62B6F1' },
    { label: '24h 再质押量', value: formatUsd(kpi.dailyRestakeVolume), iconName: 'Activity', color: BRAND.primary, noCount: true },
    { label: '24h 累计奖励', value: formatUsd(kpi.dailyRewardsUsd), iconName: 'Award', color: '#0ECB81', noCount: true },
    { label: '积分账户', value: kpi.pointsAccounts.toLocaleString(), suffix: '账户', iconName: 'Star', color: '#FFD84D' },
    { label: '跨链再质押', value: kpi.crossChainRestakes.toLocaleString(), suffix: '笔/24h', iconName: 'Globe', color: '#A855F7' },
  ];
}

// ============== Tab 配置 ==============

const TABS_CONFIG: { key: Tab; label: string }[] = [
  { key: 'overview', label: '总览' },
  { key: 'underlying', label: '底层资产' },
  { key: 'lst', label: 'LST 池' },
  { key: 'protocols', label: 'LRT 协议' },
  { key: 'avs', label: 'AVS 服务' },
  { key: 'yield', label: '收益层级' },
  { key: 'points', label: '积分系统' },
  { key: 'cross', label: '跨链再质押' },
  { key: 'risk', label: '风险监控' },
  { key: 'strategy', label: '策略组合' },
  { key: 'exit', label: '解质押队列' },
  { key: 'help', label: '帮助' },
];

// ============== 主组件 ==============

export default function PortalLrt() {
  // === 状态管理 ===
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('tvl');
  const [drawer, setDrawer] = useState<{ open: boolean; type: DrawerType; payload: any }>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [integrateOpen, setIntegrateOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('str-001');
  const [exitFilter, setExitFilter] = useState<string>('all');

  // === KPI 实时数据 ===
  const [kpi, setKpi] = useState({
    underlyingAssets: 8,
    supportedLsts: 24,
    supportedLrts: 18,
    supportedAvs: 28,
    totalRestakedUsd: 24800000000,
    totalLrtSupply: 9420000,
    averageApy: 8.84,
    totalUsers: 384200,
    dailyRestakeVolume: 384000000,
    dailyRewardsUsd: 8420000,
    pointsAccounts: 184200,
    crossChainRestakes: 8420,
    averageWaitDays: 18,
    slashingRate: 0.04,
    uptime: 99.94,
    totalOperators: 4280,
  });

  // === 实时数据波动 ===
  useEffect(() => {
    const timer = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalRestakedUsd: prev.totalRestakedUsd + Math.floor(Math.random() * 2480000),
        totalLrtSupply: prev.totalLrtSupply + Math.floor(Math.random() * 12),
        averageApy: Math.max(7, Math.min(12, prev.averageApy + (Math.random() - 0.5) * 0.04)),
        dailyRestakeVolume: prev.dailyRestakeVolume + Math.floor(Math.random() * 184000),
        dailyRewardsUsd: prev.dailyRewardsUsd + Math.floor(Math.random() * 4200),
        pointsAccounts: prev.pointsAccounts + Math.floor(Math.random() * 8),
        crossChainRestakes: prev.crossChainRestakes + Math.floor(Math.random() * 4),
        totalOperators: Math.max(4000, Math.min(4500, prev.totalOperators + Math.floor((Math.random() - 0.5) * 4))),
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // === 键盘快捷键 ===
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        if (helpOpen) setHelpOpen(false);
        if (integrateOpen) setIntegrateOpen(false);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen, integrateOpen]);

  // === 过滤逻辑 ===
  const filteredUnderlying = useMemo(() => {
    return UNDERLYING_ASSETS.filter((a) => {
      if (search && !a.symbol.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterChain !== 'all' && a.chain !== filterChain) return false;
      return true;
    });
  }, [search, filterChain]);

  const filteredLsts = useMemo(() => {
    return LST_TOKENS.filter((a) => {
      if (search && !a.symbol.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterChain !== 'all' && a.chain !== filterChain) return false;
      return true;
    });
  }, [search, filterChain]);

  const filteredProtocols = useMemo(() => {
    return LRT_PROTOCOLS.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterChain !== 'all' && a.chain !== filterChain) return false;
      return true;
    });
  }, [search, filterChain]);

  const filteredAvs = useMemo(() => {
    return AVS_SERVICES.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      return true;
    });
  }, [search, filterCategory]);

  const filteredYields = useMemo(() => YIELD_TIERS, []);
  const filteredPoints = useMemo(() => POINTS_ACCOUNTS, []);
  const filteredCross = useMemo(() => CROSS_CHAIN_RESTAKES, []);
  const filteredRisks = useMemo(() => RISK_EVENTS, []);
  const filteredStrategies = useMemo(() => RESTAKE_STRATEGIES, []);
  const filteredExits = useMemo(() => EXIT_QUEUES.filter(e => exitFilter === 'all' || e.status === exitFilter), [exitFilter]);

  // === Drawer 打开 ===
  const openDrawer = (type: DrawerType, payload: any) => setDrawer({ open: true, type, payload });
  const closeDrawer = () => setDrawer({ open: false, type: null, payload: null });

  const kpiCards = useKpiCards(kpi, formatUsd);

  return (
    <div className="min-h-screen pa-page" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pa-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes pa-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pa-slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pa-bar { from { width: 0%; } }
        @keyframes pa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .pa-stagger-1 { animation: pa-fade-up 0.4s ease 0.05s both; }
        .pa-stagger-2 { animation: pa-fade-up 0.4s ease 0.1s both; }
        .pa-stagger-3 { animation: pa-fade-up 0.4s ease 0.15s both; }
        .pa-stagger-4 { animation: pa-fade-up 0.4s ease 0.2s both; }
        .pa-stagger-5 { animation: pa-fade-up 0.4s ease 0.25s both; }
        .pa-stagger-6 { animation: pa-fade-up 0.4s ease 0.3s both; }
        .pa-pulse { animation: pa-pulse 2s ease-in-out infinite; }
        .pa-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(20,184,129,0.10) 50%, transparent 100%); background-size: 200% 100%; animation: pa-shimmer 2.4s linear infinite; }
        .pa-slide-in { animation: pa-slide-in 0.4s ease both; }
        .pa-bar { animation: pa-bar 1s ease both; }
        .pa-float { animation: pa-float 3s ease-in-out infinite; }
        .pa-card { background: ${BRAND.card}; border: 1px solid ${BRAND.border}; transition: all 0.2s; }
        .pa-card:hover { border-color: ${BRAND.primary}40; }
        .pa-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .pa-scrollbar::-webkit-scrollbar-track { background: ${BRAND.bg}; }
        .pa-scrollbar::-webkit-scrollbar-thumb { background: ${BRAND.border}; border-radius: 3px; }
        .pa-scrollbar::-webkit-scrollbar-thumb:hover { background: ${BRAND.primary}80; }
        .pa-progress { background: linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.info} 100%); height: 100%; border-radius: 4px; }
      `}</style>

      <div className="px-6 py-8 pa-stagger-1" style={{ background: `linear-gradient(135deg, ${BRAND.bg} 0%, ${BRAND.card} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,184,129,0.15)', border: `1px solid ${BRAND.primary}40` }}>
                  <Layers size={24} style={{ color: BRAND.primary }} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" style={{ color: BRAND.text }}>流动性再质押中心</h1>
                  <p className="text-xs md:text-sm" style={{ color: BRAND.textMuted }}>Liquid Restaking · LRT · EigenLayer · Solayer · AVS · 积分 · 跨链再质押</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed max-w-3xl" style={{ color: BRAND.textMuted }}>
                集成 <strong style={{ color: BRAND.text }}>8 大底层资产 + 24 个 LST 池 + 18 个 LRT 协议 + 28 个 AVS 服务</strong>，
                构建"挖矿-质押-再质押-收益层级-跨链流通"完整能力栈。所有数据均为 <strong style={{ color: BRAND.primary }}>mock 演示</strong>，仅作<strong style={{ color: BRAND.text }}>技术研究 + 合规研究方向</strong>展示。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHelpOpen(true)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <HelpCircle size={14} />使用指南
              </button>
              <button onClick={() => setIntegrateOpen(true)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <Code2 size={14} />API 集成
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiCards.map((k, i) => (
            <div key={i} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} pa-card`} style={{ borderLeft: `3px solid ${k.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wide" style={{ color: BRAND.textMuted }}>{k.label}</div>
                <div style={{ color: k.color }}>
                  {k.iconName === 'Coins' && <Coins size={16} />}
                  {k.iconName === 'Droplet' && <Droplet size={16} />}
                  {k.iconName === 'Boxes' && <Boxes size={16} />}
                  {k.iconName === 'Network' && <Network size={16} />}
                  {k.iconName === 'DollarSign' && <DollarSign size={16} />}
                  {k.iconName === 'Hash' && <Hash size={16} />}
                  {k.iconName === 'TrendingUp' && <TrendingUp size={16} />}
                  {k.iconName === 'Users' && <Users size={16} />}
                  {k.iconName === 'Activity' && <Activity size={16} />}
                  {k.iconName === 'Award' && <Award size={16} />}
                  {k.iconName === 'Star' && <Star size={16} />}
                  {k.iconName === 'Globe' && <Globe size={16} />}
                </div>
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: BRAND.text }}>
                {k.value}{k.suffix ? <span className="text-[10px] ml-1" style={{ color: BRAND.textMuted }}>{k.suffix}</span> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl flex items-center gap-4 overflow-x-auto pa-scrollbar pa-stagger-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="text-[10px] flex items-center gap-1.5 whitespace-nowrap" style={{ color: BRAND.textMuted }}>
            <div className="w-2 h-2 rounded-full pa-pulse" style={{ backgroundColor: BRAND.primary }} />实时数据流
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>总再质押:</span>
            <span className="font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(kpi.totalRestakedUsd)}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>LRT 流通:</span>
            <span className="font-bold tabular-nums" style={{ color: BRAND.info }}>{kpi.totalLrtSupply.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>平均 APY:</span>
            <span className="font-bold tabular-nums" style={{ color: '#0ECB81' }}>{kpi.averageApy.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>24h 量:</span>
            <span className="font-bold tabular-nums" style={{ color: '#A855F7' }}>{formatUsd(kpi.dailyRestakeVolume)}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>24h 奖励:</span>
            <span className="font-bold tabular-nums" style={{ color: '#FFD84D' }}>{formatUsd(kpi.dailyRewardsUsd)}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap" style={{ color: BRAND.text }}>
            <span style={{ color: BRAND.textMuted }}>积分账户:</span>
            <span className="font-bold tabular-nums" style={{ color: BRAND.primary }}>{kpi.pointsAccounts.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pa-scrollbar pa-stagger-3" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
          {TABS_CONFIG.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-xs font-semibold whitespace-nowrap`} style={{ color: tab === t.key ? BRAND.primary : BRAND.textMuted, borderBottom: tab === t.key ? `2px solid ${BRAND.primary}` : '2px solid transparent', marginBottom: '-1px' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div>{/* STEP_7_INSERT_HERE */}</div>
      </div>

      <div>{/* STEP_8_INSERT_HERE */}</div>
    </div>
  );
}

// ============== Tabs 内容组件 ==============

function PortalLrtTabs({
  tab,
  search,
  setSearch,
  filterChain,
  setFilterChain,
  filterCategory,
  setFilterCategory,
  sortBy,
  setSortBy,
  exitFilter,
  setExitFilter,
  selectedStrategy,
  setSelectedStrategy,
  filteredUnderlying,
  filteredLsts,
  filteredProtocols,
  filteredAvs,
  filteredYields,
  filteredPoints,
  filteredCross,
  filteredRisks,
  filteredStrategies,
  filteredExits,
  kpi,
  openDrawer,
}: any) {

  // === Overview Tab ===
  if (tab === 'overview') {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
            <Layers size={14} style={{ color: BRAND.primary }} />流动性再质押总览 · LRT 生态地图
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
            当前 <strong style={{ color: BRAND.text }}>8 大底层资产 + 24 个 LST 池 + 18 个 LRT 协议 + 28 个 AVS 服务</strong>，
            总再质押规模 <strong style={{ color: BRAND.primary }}>{formatUsd(kpi.totalRestakedUsd)}</strong>，平均 APY <strong style={{ color: BRAND.primary }}>{kpi.averageApy.toFixed(2)}%</strong>，
            跨链再质押 <strong style={{ color: BRAND.primary }}>{kpi.crossChainRestakes.toLocaleString()}</strong> 笔/24h。
            与 P3.26 衍生品 + P3.29 DeFi + P3.30 跨链桥 + P3.42 跨链聚合形成"挖矿-质押-再质押-收益层级-跨链流通"完整能力栈。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl pa-stagger-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h4 className="text-xs font-semibold mb-3" style={{ color: BRAND.text }}>底层资产 · TVL 分布</h4>
            <div className="space-y-2">
              {UNDERLYING_ASSETS.slice(0, 6).map((u, i) => (
                <div key={u.id} className="flex items-center gap-2 cursor-pointer pa-card p-2 rounded-lg" onClick={() => openDrawer('underlying', u.id)}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: u.iconBg, color: u.iconColor }}>{u.symbol.slice(0, 1)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{u.symbol}</div>
                      <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(u.tvl)}</div>
                    </div>
                    <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: BRAND.bg }}>
                      <div className="pa-bar h-full rounded-full" style={{ width: `${Math.min(100, (u.tvl / 200000000000) * 100)}%`, backgroundColor: u.iconColor }} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px]" style={{ color: BRAND.textMuted }}>
                      <span>再质押 {u.restakingRatio.toFixed(1)}%</span>
                      <span>APY {u.baseApy.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl pa-stagger-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h4 className="text-xs font-semibold mb-3" style={{ color: BRAND.text }}>LRT 协议 · TVL 排行</h4>
            <div className="space-y-2">
              {LRT_PROTOCOLS.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 cursor-pointer pa-card p-2 rounded-lg" onClick={() => openDrawer('protocol', p.id)}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: p.iconBg, color: p.iconColor }}>{p.name.slice(0, 1)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{p.name}</div>
                      <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(p.tvl)}</div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px]" style={{ color: BRAND.textMuted }}>
                      <span>APY {p.totalApy.toFixed(1)}% · {p.supportedAvs} AVS</span>
                      <span className={`px-1 py-0.5 rounded`} style={{ backgroundColor: `${statusBadge(p.status).fg}20`, color: statusBadge(p.status).fg }}>{statusBadge(p.status).label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl pa-stagger-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h4 className="text-xs font-semibold mb-3" style={{ color: BRAND.text }}>AVS 服务矩阵</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AVS_SERVICES.slice(0, 8).map((a, i) => (
              <div key={a.id} className="p-3 rounded-lg cursor-pointer pa-card" onClick={() => openDrawer('avs', a.id)}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.iconBg }}>
                    <div className="text-[10px] font-bold" style={{ color: a.iconColor }}>{a.category.toUpperCase().slice(0, 2)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate" style={{ color: BRAND.text }}>{a.name}</div>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>{CATEGORY_LABELS[a.category]}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span style={{ color: BRAND.textMuted }}>APY</span>
                  <span className="font-bold tabular-nums" style={{ color: BRAND.primary }}>{a.rewardApy.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span style={{ color: BRAND.textMuted }}>再质押</span>
                  <span className="tabular-nums" style={{ color: BRAND.text }}>{formatUsd(a.totalRestaked)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl pa-stagger-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>高 APY 协议</h4>
            <div className="space-y-1.5">
              {LRT_PROTOCOLS.sort((a, b) => b.totalApy - a.totalApy).slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between text-[10px]">
                  <span style={{ color: BRAND.text }}>{p.name}</span>
                  <span className="font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.totalApy.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl pa-stagger-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>高 TVL 资产</h4>
            <div className="space-y-1.5">
              {UNDERLYING_ASSETS.sort((a, b) => b.tvl - a.tvl).slice(0, 4).map(u => (
                <div key={u.id} className="flex items-center justify-between text-[10px]">
                  <span style={{ color: BRAND.text }}>{u.symbol}</span>
                  <span className="font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(u.tvl)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl pa-stagger-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>高积分账户</h4>
            <div className="space-y-1.5">
              {POINTS_ACCOUNTS.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between text-[10px]">
                  <span style={{ color: BRAND.text }}>{p.protocol}</span>
                  <span className="font-bold tabular-nums" style={{ color: '#FFD84D' }}>{p.totalPoints.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Underlying Tab ===
  if (tab === 'underlying') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input type="text" placeholder="搜索资产..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
          <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <option value="all">全部链</option>
            {UNDERLYING_ASSETS.map(u => <option key={u.id} value={u.chain}>{u.chain}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredUnderlying.map((u, i) => {
            const sb = statusBadge(u.status);
            return (
              <div key={u.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('underlying', u.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: u.iconBg, color: u.iconColor }}>{u.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{u.name} ({u.symbol})</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{u.chain} · {u.consensus}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>${u.price.toFixed(2)}</div>
                    <div className="text-[9px] flex items-center gap-1 justify-end" style={{ color: u.change24h >= 0 ? '#0ECB81' : '#F6465D' }}>
                      {u.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{Math.abs(u.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(u.tvl)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总质押</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(u.totalStaked)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>再质押</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(u.totalRestaked)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APY</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{u.baseApy.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>验证者: {u.validators.toLocaleString()}</span>
                  <span>·</span>
                  <span>再质押比: {u.restakingRatio.toFixed(1)}%</span>
                  <span>·</span>
                  <span>风险分: {u.riskScore}</span>
                  <span className={`px-1.5 py-0.5 rounded`} style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === LST Tab ===
  if (tab === 'lst') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input type="text" placeholder="搜索 LST..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
        </div>
        <div className="space-y-3">
          {filteredLsts.map((l, i) => {
            const sb = statusBadge(l.status);
            return (
              <div key={l.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('lst', l.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: l.iconBg, color: l.iconColor }}>{l.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{l.name}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{l.protocol} · {l.underlying} · {l.chain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{l.totalApy.toFixed(1)}%</div>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总 APY</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>价格</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{l.price < 10 ? '$' + l.price.toFixed(3) : '$' + l.price.toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(l.tvl)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>汇率</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{l.exchangeRate.toFixed(4)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>基础 APY</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{l.baseApy.toFixed(1)}%</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>再质押 APY</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{l.restakingApy.toFixed(1)}%</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>持有者</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{l.holders.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>审计: {l.auditBy.join(' / ')}</span>
                  <span>·</span>
                  <span>脱锚风险: {l.depegRisk}</span>
                  <span>·</span>
                  <span>退出队列: {l.exitQueue} 天</span>
                  {l.restakingEnabled && <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>可再质押</span>}
                  <span className={`px-1.5 py-0.5 rounded`} style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === Protocols Tab ===
  if (tab === 'protocols') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input type="text" placeholder="搜索 LRT 协议..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
          <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <option value="all">全部链</option>
            {LRT_PROTOCOLS.map(p => <option key={p.id} value={p.chain}>{p.chain}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredProtocols.map((p, i) => {
            const sb = statusBadge(p.status);
            return (
              <div key={p.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('protocol', p.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: p.iconBg, color: p.iconColor }}>{p.name.slice(0, 2)}</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{p.name}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.symbol} · {p.chain} · {p.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.totalApy.toFixed(1)}%</div>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总 APY</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(p.tvl)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>用户</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{p.totalUsers.toLocaleString()}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>AVS</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{p.supportedAvs}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>LST 数</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{p.supportedLsts.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>支持 LST: {p.supportedLsts.slice(0, 3).join(' / ')}{p.supportedLsts.length > 3 ? ' +' + (p.supportedLsts.length - 3) : ''}</span>
                  <span>·</span>
                  <span>Bug Bounty: {formatUsd(p.bugBounty)}</span>
                  <span className={`px-1.5 py-0.5 rounded`} style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === AVS Tab ===
  if (tab === 'avs') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input type="text" placeholder="搜索 AVS..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <option value="all">全部分类</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredAvs.map((a, i) => {
            const sb = statusBadge(a.status);
            return (
              <div key={a.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('avs', a.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: a.iconBg, color: a.iconColor }}>{a.category.toUpperCase().slice(0, 2)}</div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{a.name}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{CATEGORY_LABELS[a.category]} · {a.chain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{a.rewardApy.toFixed(1)}%</div>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>奖励 APY</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总再质押</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(a.totalRestaked)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>运营者</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{a.operatorCount}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 请求</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatNumber(a.metrics.requests24h)}</div>
                  </div>
                  <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[9px]" style={{ color: BRAND.textMuted }}>成功率</div>
                    <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{a.metrics.successRate.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>最低质押: {a.requirements.minStake.toLocaleString()} {a.chain === 'Ethereum' ? 'ETH' : a.chain === 'Solana' ? 'SOL' : 'TOKEN'}</span>
                  <span>·</span>
                  <span>硬件: {a.requirements.hardware.split(' + ')[0]}</span>
                  <span className={`px-1.5 py-0.5 rounded`} style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}


// === Yield Tab ===
function PortalLrtYield({ filteredYields, openDrawer }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <TrendingUp size={14} style={{ color: BRAND.primary }} />收益层级 · 基础收益 + AVS 奖励 + 积分 + 代币
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
          再质押收益由 <strong style={{ color: BRAND.text }}>4 个层级</strong> 组成：基础质押 + AVS 服务奖励 + 积分累积 + 协议代币，
          多层级叠加形成 <strong style={{ color: BRAND.primary }}>8-12% APY</strong> 综合年化（仅为历史业绩特征演示，不构成收益预期）。
        </p>
      </div>
      <div className="space-y-3">
        {filteredYields.map((y: any, i: number) => {
          const sb = statusBadge(y.status);
          return (
            <div key={y.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('yield', y.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: BRAND.text }}>{y.protocol}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                    {y.autoCompound && <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>自动复利</span>}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{y.user}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums" style={{ color: BRAND.primary }}>{y.totalApy.toFixed(2)}%</div>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总 APY</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>金额</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{y.amount.toLocaleString()} {y.underlying}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>基础</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{y.baseApy.toFixed(1)}%</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>AVS</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{y.avsApy.toFixed(1)}%</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>积分</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: '#FFD84D' }}>{y.pointsApy.toFixed(1)}%</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>代币</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: '#A855F7' }}>{y.tokenApy.toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-[10px] leading-relaxed" style={{ color: BRAND.textMuted }}>{y.description}</div>
              <div className="flex items-center gap-2 flex-wrap text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
                <span>下次领取: {y.nextClaim}</span>
                <span>·</span>
                {y.rewards.map((r: any, ri: number) => (<span key={ri} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{r.amount.toFixed(2)} {r.type}</span>))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Points Tab ===
function PortalLrtPoints({ filteredPoints, openDrawer }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <Star size={14} style={{ color: '#FFD84D' }} />积分系统 · LRT 协议空投追踪
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
          主流 LRT 协议（EigenLayer / Renzo / EtherFi / Solayer / Kelp / Swell / Puffer）均提供积分系统，
          用户可累积积分换取未来协议代币空投，<strong style={{ color: BRAND.text }}>仅为历史积分快照与潜在空投估算演示</strong>。
        </p>
      </div>
      <div className="space-y-3">
        {filteredPoints.map((p: any, i: number) => {
          const sb = statusBadge(p.status);
          return (
            <div key={p.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('points', p.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: BRAND.text }}>{p.protocol}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,216,77,0.10)', color: '#FFD84D' }}>{p.multiplier.toFixed(1)}x 加速</span>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{p.account}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums" style={{ color: '#FFD84D' }}>{p.totalPoints.toLocaleString()}</div>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总积分</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>日增</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>+{p.dailyPoints.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>月增</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{p.monthlyPoints.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>排名</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>#{p.rank.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>潜在空投</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.estimatedAirdrop.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                <span>加速原因: {p.multiplierReason.join(' / ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Cross Tab ===
function PortalLrtCross({ filteredCross, openDrawer }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <Globe size={14} style={{ color: '#A855F7' }} />跨链再质押 · LRT 资产跨链流通
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
          通过 <strong style={{ color: BRAND.text }}>LayerZero / Wormhole / Stargate / Arbitrum Bridge</strong> 等跨链桥，
          将 LST / LRT 资产从原生链跨链到目标链进行再质押，自动选择最优跨链 + 再质押路径。
        </p>
      </div>
      <div className="space-y-3">
        {filteredCross.map((c: any, i: number) => {
          const sb = statusBadge(c.status);
          return (
            <div key={c.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('cross', c.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{c.fromToken}</span>
                    <ArrowRight size={14} style={{ color: c.color }} />
                    <span className="text-sm font-semibold" style={{ color: c.color }}>{c.toToken}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{c.fromChain} → {c.toChain} · {c.bridge} · {c.protocol}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{c.apy.toFixed(1)}%</div>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>目标 APY</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>金额</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{c.amount.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>桥接</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatTime(c.bridgeTime)}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>再质押</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{c.restakeTime > 0 ? formatTime(c.restakeTime) : '-'}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总耗时</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{c.totalTime > 0 ? formatTime(c.totalTime) : '-'}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>费用</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>${c.feeUsd.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{c.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Risk Tab ===
function PortalLrtRisk({ filteredRisks, openDrawer }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <ShieldAlert size={14} style={{ color: '#FFA940' }} />风险监控 · 罚没 / 漏洞 / 脱锚 / 治理 / 升级
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
          实时监控 LRT 生态风险事件，包括 <strong style={{ color: BRAND.text }}>节点罚没 / 智能合约漏洞 / LST 脱锚 / 协议暂停 / 治理变更 / 预言机异常 / 合约升级</strong>，
          第一时间发现并通报用户。
        </p>
      </div>
      <div className="space-y-3">
        {filteredRisks.map((r: any, i: number) => {
          const sb = statusBadge(r.status);
          const sev = SEVERITY_COLORS[r.severity] || BRAND.textMuted;
          return (
            <div key={r.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('risk', r.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sev}20`, color: sev }}>{r.severity.toUpperCase()}</span>
                    <span className="text-sm font-bold" style={{ color: BRAND.text }}>{r.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.protocol} {r.avs !== '-' ? '· ' + r.avs : ''} · {r.timestamp}</div>
                </div>
                {r.amount > 0 && <div className="text-right">
                  <div className="text-base font-bold tabular-nums" style={{ color: '#F6465D' }}>{formatUsd(r.amount)}</div>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>影响金额</div>
                </div>}
              </div>
              <div className="text-[10px] leading-relaxed mb-1" style={{ color: BRAND.textMuted }}>{r.description}</div>
              <div className="text-[10px]" style={{ color: BRAND.primary }}>处置: {r.resolution}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Strategy Tab ===
function PortalLrtStrategy({ filteredStrategies, selectedStrategy, setSelectedStrategy, openDrawer }: any) {
  const sel = filteredStrategies.find((s: any) => s.id === selectedStrategy) || filteredStrategies[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 space-y-2 pa-stagger-1">
          {filteredStrategies.map((s: any) => (
            <div key={s.id} onClick={() => setSelectedStrategy(s.id)} className="p-3 rounded-lg cursor-pointer pa-card" style={{ backgroundColor: selectedStrategy === s.id ? s.iconBg : BRAND.card, border: selectedStrategy === s.id ? `1px solid ${s.iconColor}60` : `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{s.name.split('·')[0]}</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: s.iconColor }}>{s.expectedApy.toFixed(1)}%</div>
              </div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{s.underlying} · {s.protocols.length} 协议 · 风险 {s.riskScore}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 p-4 rounded-xl pa-stagger-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>{sel.name}</h3>
              <p className="text-[10px] leading-relaxed" style={{ color: BRAND.textMuted }}>{sel.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums pa-float" style={{ color: sel.iconColor }}>{sel.expectedApy.toFixed(2)}%</div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>预期 APY</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
              <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(sel.tvl)}</div>
            </div>
            <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[9px]" style={{ color: BRAND.textMuted }}>用户</div>
              <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{sel.totalUsers.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[9px]" style={{ color: BRAND.textMuted }}>风险分</div>
              <div className="text-[11px] font-bold tabular-nums" style={{ color: sel.iconColor }}>{sel.riskScore}</div>
            </div>
            <div className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[9px]" style={{ color: BRAND.textMuted }}>复杂度</div>
              <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{sel.complexity.toUpperCase()}</div>
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="text-[10px] font-semibold" style={{ color: BRAND.textMuted }}>协议组合</div>
            <div className="flex flex-wrap gap-1.5">
              {sel.protocols.map((p: string, pi: number) => (<span key={pi} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{p}</span>))}
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="text-[10px] font-semibold" style={{ color: BRAND.textMuted }}>AVS 服务</div>
            <div className="flex flex-wrap gap-1.5">
              {sel.avs.map((a: string, ai: number) => (<span key={ai} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,169,64,0.10)', color: '#FFA940' }}>{a}</span>))}
            </div>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>历史业绩特征（仅供参考，非收益预期）</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-[10px]" style={{ color: BRAND.textMuted }}>1D</div><div className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{sel.performance.day1.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMuted }}>7D</div><div className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{sel.performance.day7.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMuted }}>30D</div><div className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{sel.performance.day30.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMuted }}>90D</div><div className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{sel.performance.day90.toFixed(1)}%</div></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sel.features.map((f: string, fi: number) => (<span key={fi} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(168,85,247,0.10)', color: '#A855F7' }}>{f}</span>))}
          </div>
        </div>
      </div>
    </div>
  );
}

// === Exit Tab ===
function PortalLrtExit({ filteredExits, exitFilter, setExitFilter, openDrawer }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <LogOut size={14} style={{ color: '#FF7A45' }} />解质押队列 · Unstaking Queue
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
          解质押需要等待队列处理，平均等待 <strong style={{ color: BRAND.text }}>18 天</strong>，
          部分协议（Ethereum 主网）有 <strong style={{ color: BRAND.text }}>7 天挑战期</strong>，Solana 协议通常更快。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 pa-stagger-2">
        {['all', 'queued', 'processing', 'ready', 'claimed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setExitFilter(s)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: exitFilter === s ? BRAND.primary : BRAND.card, color: exitFilter === s ? '#000' : BRAND.text, border: `1px solid ${exitFilter === s ? BRAND.primary : BRAND.border}` }}>
            {s === 'all' ? '全部' : statusBadge(s).label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredExits.map((e: any, i: number) => {
          const sb = statusBadge(e.status);
          return (
            <div key={e.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('exit', e.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: BRAND.text }}>{e.protocol}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: e.color }}>{e.amount.toLocaleString()} {e.asset}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${sb.fg}20`, color: sb.fg }}>{sb.label}</span>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{e.user}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>申请: {e.requestedAt} · 预计: {e.estimatedExit}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{e.progress}%</div>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>进度</div>
                </div>
              </div>
              <div className="h-2 rounded-full mb-2" style={{ backgroundColor: BRAND.bg }}>
                <div className="pa-bar h-full rounded-full" style={{ width: `${e.progress}%`, backgroundColor: e.color }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>位置</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>#{e.position.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>队列总数</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{e.totalQueue.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>等待天数</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{e.waitDays} 天</div>
                </div>
                <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px]" style={{ color: BRAND.textMuted }}>费用</div>
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{e.fee.toFixed(5)} {e.asset}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

