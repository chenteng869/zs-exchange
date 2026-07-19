'use client';

/**
 * PortalDefi - DeFi 流动性挖矿中心 (2026-07-19 Q05 P3.29)
 *
 * 页面定位：
 * - 中萨数字科技交易所 DeFi 流动性挖矿中心
 * - 流动性池 / 收益农场 / 双币理财 / 锁仓挖矿 / 推荐奖励 / 历史收益 / 申请上币
 * - 与 P3.4 现货 + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT
 *   形成"资产-衍生-量化-NFT-DeFi" 全栈闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有池子 / 农场 / 双币 / 锁仓 / 推荐 数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词
 * - 历史收益为内部估算口径，不构成对未来收益的承诺
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Coins,
  CircleDollarSign,
  Wallet,
  Droplets,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Gauge,
  Target,
  Compass,
  MapPin,
  Globe2,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Heart,
  ThumbsUp,
  Bookmark,
  Flag,
  Tag,
  Eye,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  FileText,
  Code2,
  Terminal,
  Cpu,
  Database,
  Server,
  Cloud,
  Network,
  Layers,
  Boxes,
  Box,
  Package,
  PackageOpen,
  Gift,
  Zap,
  Rocket,
  Flame,
  Settings,
  Sliders,
  Bell,
  Mail,
  MessageCircle,
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
  Plus,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'pools' | 'farms' | 'dual' | 'lock' | 'referral' | 'history' | 'apply' | 'help';
type PoolType = 'v2' | 'v3' | 'stable' | 'single' | 'weighted' | 'concentrated' | 'index';
type PoolStatus = 'live' | 'new' | 'boosted' | 'paused' | 'retired';
type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
type FarmType = 'single' | 'lp' | 'vault' | 'leveraged' | 'auto';
type DualType = 'range' | 'snowball' | 'sharkfin' | 'butterfly' | 'ladder';
type LockTerm = 7 | 14 | 30 | 90 | 180 | 365;
type ApplyType = 'project' | 'pool' | 'farm' | 'partner' | 'audit';
type DrawerType = 'pool' | 'farm' | 'dual' | 'lock' | 'deposit' | 'apply' | 'help' | null;

interface PoolToken {
  symbol: string;
  weight: number;
  amount: number;
  price: number;
}

interface Pool {
  id: string;
  symbol: string;
  name: string;
  type: PoolType;
  status: PoolStatus;
  risk: RiskLevel;
  tokens: PoolToken[];
  tvl: number;
  volume24h: number;
  fees24h: number;
  aprBase: number;
  aprReward: number;
  aprTotal: number;
  apr7d: number;
  apr30d: number;
  utilization: number;
  participants: number;
  capacity: number;
  feeTier: number;
  rewards: { token: string; perDay: number; apr: number }[];
  audit: string[];
  description: string;
  tags: string[];
  chain: string;
  launchedAt: string;
  updatedAt: string;
  highlights: string[];
  risks: string[];
}

interface Farm {
  id: string;
  name: string;
  type: FarmType;
  status: 'live' | 'new' | 'boosted' | 'ended' | 'paused';
  stakeToken: string;
  earnTokens: string[];
  tvl: number;
  capacity: number;
  participants: number;
  aprBase: number;
  aprBoost: number;
  aprTotal: number;
  lockup: number;
  harvestEvery: string;
  multiplier: string;
  audit: string[];
  description: string;
  tags: string[];
  chain: string;
  launchedAt: string;
  updatedAt: string;
  rewards: { token: string; perDay: number; apr: number }[];
  highlights: string[];
  risks: string[];
}

interface Dual {
  id: string;
  name: string;
  type: DualType;
  status: 'live' | 'upcoming' | 'ended' | 'paused';
  underlying: string;
  quote: string;
  strikeLow: number;
  strikeHigh: number;
  spot: number;
  apyLow: number;
  apyHigh: number;
  apyBase: number;
  duration: number;
  minSubscription: number;
  maxSubscription: number;
  totalSubscribed: number;
  participants: number;
  settlement: string;
  coupon: string;
  principalProtection: boolean;
  description: string;
  tags: string[];
  launchedAt: string;
  updatedAt: string;
  scenarios: { condition: string; payout: number; apy: number }[];
  highlights: string[];
  risks: string[];
}

interface LockProduct {
  id: string;
  name: string;
  status: 'live' | 'upcoming' | 'ended' | 'paused';
  token: string;
  term: LockTerm;
  minAmount: number;
  maxAmount: number;
  totalQuota: number;
  subscribed: number;
  aprBase: number;
  aprBoost: number;
  aprTotal: number;
  participants: number;
  earlyRedeem: boolean;
  earlyPenalty: number;
  autoRenew: boolean;
  description: string;
  tags: string[];
  launchedAt: string;
  updatedAt: string;
  rewards: { token: string; perDay: number; apr: number }[];
  highlights: string[];
  risks: string[];
}

interface ReferralStat {
  level: number;
  name: string;
  ratio: number;
  count: number;
  volume: number;
  commission: number;
}

interface HistoryEntry {
  id: string;
  type: 'pool' | 'farm' | 'dual' | 'lock' | 'referral';
  product: string;
  principal: number;
  reward: number;
  rewardToken: string;
  apy: number;
  startAt: string;
  endAt: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  txHash: string;
}

interface Application {
  id: string;
  type: ApplyType;
  company: string;
  contact: string;
  email: string;
  region: string;
  description: string;
  expectedTvl: number;
  stage: 'submitted' | 'review' | 'audit' | 'kyb' | 'tech-test' | 'live' | 'rejected';
  submittedAt: string;
  updatedAt: string;
  progress: number;
  reviewer: string;
}

interface KpiSnapshot {
  totalTvl: number;
  tvl24hChange: number;
  totalPools: number;
  totalFarms: number;
  totalDuals: number;
  totalLocks: number;
  totalParticipants: number;
  totalRewards: number;
  totalVolume24h: number;
  avgApr: number;
  maxApr: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const POOLS: Pool[] = [
  {
    id: 'p-btc-usdt-v3',
    symbol: 'BTC/USDT',
    name: 'BTC/USDT 集中流动性 V3',
    type: 'v3',
    status: 'boosted',
    risk: 'medium',
    tokens: [
      { symbol: 'BTC', weight: 50, amount: 1284, price: 68420 },
      { symbol: 'USDT', weight: 50, amount: 87850000, price: 1 },
    ],
    tvl: 184000000,
    volume24h: 2480000000,
    fees24h: 1240000,
    aprBase: 18.4,
    aprReward: 32.6,
    aprTotal: 51.0,
    apr7d: 48.2,
    apr30d: 44.6,
    utilization: 68,
    participants: 4280,
    capacity: 500000000,
    feeTier: 0.05,
    rewards: [
      { token: 'ZSD', perDay: 184000, apr: 24.2 },
      { token: 'ZSDEX', perDay: 24800, apr: 8.4 },
    ],
    audit: ['CertiK', 'SlowMist', 'PeckShield'],
    description: 'BTC/USDT 集中流动性 V3 池，0.05% 费率层级，提供 ZSD 平台币 + ZSDEX 双币奖励。',
    tags: ['BTC', '集中流动性', '双币奖励', 'Boost'],
    chain: 'ZS-Chain',
    launchedAt: '2024-08-15',
    updatedAt: '2026-07-18',
    highlights: ['V3 集中流动性', '0.05% 费率', 'ZSD + ZSDEX 双币奖励', '总锁仓 1.84 亿 USDT'],
    risks: ['无常损失', '智能合约风险', '市场波动'],
  },
  {
    id: 'p-eth-usdt-v3',
    symbol: 'ETH/USDT',
    name: 'ETH/USDT 集中流动性 V3',
    type: 'v3',
    status: 'live',
    risk: 'medium',
    tokens: [
      { symbol: 'ETH', weight: 50, amount: 24800, price: 3652 },
      { symbol: 'USDT', weight: 50, amount: 90600000, price: 1 },
    ],
    tvl: 124000000,
    volume24h: 1860000000,
    fees24h: 930000,
    aprBase: 16.8,
    aprReward: 28.4,
    aprTotal: 45.2,
    apr7d: 42.4,
    apr30d: 38.6,
    utilization: 62,
    participants: 3280,
    capacity: 400000000,
    feeTier: 0.05,
    rewards: [
      { token: 'ZSD', perDay: 124000, apr: 20.4 },
      { token: 'ZSDEX', perDay: 18400, apr: 8.0 },
    ],
    audit: ['CertiK', 'SlowMist'],
    description: 'ETH/USDT 集中流动性 V3 池，0.05% 费率层级，ZSD + ZSDEX 双币奖励。',
    tags: ['ETH', 'V3', '双币奖励'],
    chain: 'ZS-Chain',
    launchedAt: '2024-09-02',
    updatedAt: '2026-07-18',
    highlights: ['V3 集中流动性', '0.05% 费率', '总锁仓 1.24 亿 USDT', 'ZSD 奖励年化 20.4%'],
    risks: ['无常损失', '智能合约风险'],
  },
  {
    id: 'p-usdt-usdc-stable',
    symbol: 'USDT/USDC',
    name: 'USDT/USDC 稳定币池',
    type: 'stable',
    status: 'live',
    risk: 'low',
    tokens: [
      { symbol: 'USDT', weight: 50, amount: 168000000, price: 1 },
      { symbol: 'USDC', weight: 50, amount: 168000000, price: 1 },
    ],
    tvl: 336000000,
    volume24h: 820000000,
    fees24h: 164000,
    aprBase: 4.2,
    aprReward: 12.8,
    aprTotal: 17.0,
    apr7d: 16.4,
    apr30d: 15.2,
    utilization: 84,
    participants: 8420,
    capacity: 1000000000,
    feeTier: 0.01,
    rewards: [
      { token: 'ZSD', perDay: 248000, apr: 12.8 },
    ],
    audit: ['CertiK', 'SlowMist', 'PeckShield', 'Quantstamp'],
    description: 'USDT/USDC 稳定币专用池，Curve 曲线低滑点，适合稳健型用户。',
    tags: ['稳定币', 'Curve', '低风险', '低滑点'],
    chain: 'ZS-Chain',
    launchedAt: '2024-04-20',
    updatedAt: '2026-07-18',
    highlights: ['Curve 曲线', '低滑点', '总锁仓 3.36 亿 USDT', '稳定年化 17%'],
    risks: ['脱锚风险', '智能合约风险'],
  },
  {
    id: 'p-zsd-single',
    symbol: 'ZSD',
    name: 'ZSD 单币质押池',
    type: 'single',
    status: 'boosted',
    risk: 'low',
    tokens: [{ symbol: 'ZSD', weight: 100, amount: 184000000, price: 1 }],
    tvl: 184000000,
    volume24h: 0,
    fees24h: 0,
    aprBase: 8.4,
    aprReward: 18.6,
    aprTotal: 27.0,
    apr7d: 25.4,
    apr30d: 22.8,
    utilization: 92,
    participants: 12480,
    capacity: 200000000,
    feeTier: 0,
    rewards: [
      { token: 'ZSDEX', perDay: 124000, apr: 12.6 },
      { token: 'ZSD', perDay: 84000, apr: 6.0 },
    ],
    audit: ['CertiK', 'SlowMist'],
    description: 'ZSD 平台币单币质押池，无需配对，灵活进出。',
    tags: ['单币', 'ZSD', '灵活', '无无常损失'],
    chain: 'ZS-Chain',
    launchedAt: '2024-03-12',
    updatedAt: '2026-07-18',
    highlights: ['单币质押', '无无常损失', '总锁仓 1.84 亿 ZSD', '灵活进出'],
    risks: ['平台币价格波动', '智能合约风险'],
  },
  {
    id: 'p-bnb-busd-stable',
    symbol: 'BNB/BUSD',
    name: 'BNB/BUSD 稳定币池',
    type: 'stable',
    status: 'live',
    risk: 'low',
    tokens: [
      { symbol: 'BNB', weight: 50, amount: 84000, price: 612 },
      { symbol: 'BUSD', weight: 50, amount: 51400000, price: 1 },
    ],
    tvl: 102800000,
    volume24h: 184000000,
    fees24h: 18400,
    aprBase: 6.2,
    aprReward: 14.4,
    aprTotal: 20.6,
    apr7d: 19.2,
    apr30d: 17.8,
    utilization: 76,
    participants: 2480,
    capacity: 300000000,
    feeTier: 0.01,
    rewards: [
      { token: 'ZSD', perDay: 84000, apr: 14.4 },
    ],
    audit: ['CertiK', 'SlowMist'],
    description: 'BNB/BUSD 稳定币池，BSC 链上 Curve 风格低滑点交易。',
    tags: ['BNB', 'BUSD', 'BSC', '低风险'],
    chain: 'BSC',
    launchedAt: '2024-10-08',
    updatedAt: '2026-07-15',
    highlights: ['BSC 链', 'Curve 曲线', '总锁仓 1.02 亿 USDT', '稳定年化 20.6%'],
    risks: ['BSC 链风险', '脱锚风险'],
  },
  {
    id: 'p-sol-usdc-v3',
    symbol: 'SOL/USDC',
    name: 'SOL/USDC 集中流动性 V3',
    type: 'v3',
    status: 'live',
    risk: 'high',
    tokens: [
      { symbol: 'SOL', weight: 50, amount: 184000, price: 168 },
      { symbol: 'USDC', weight: 50, amount: 30900000, price: 1 },
    ],
    tvl: 61800000,
    volume24h: 1280000000,
    fees24h: 640000,
    aprBase: 28.4,
    aprReward: 42.6,
    aprTotal: 71.0,
    apr7d: 64.2,
    apr30d: 58.4,
    utilization: 84,
    participants: 1840,
    capacity: 200000000,
    feeTier: 0.1,
    rewards: [
      { token: 'ZSD', perDay: 84000, apr: 28.4 },
      { token: 'ZSDEX', perDay: 12400, apr: 14.2 },
    ],
    audit: ['CertiK', 'SlowMist'],
    description: 'SOL/USDC V3 集中流动性池，0.1% 费率，高波动高收益。',
    tags: ['SOL', 'V3', '高波动', '高APR'],
    chain: 'Solana',
    launchedAt: '2024-11-15',
    updatedAt: '2026-07-18',
    highlights: ['SOL 链', 'V3 集中流动性', '高 APR 71%', 'ZSD + ZSDEX 双币奖励'],
    risks: ['SOL 价格波动', '无常损失', 'Solana 网络风险'],
  },
  {
    id: 'p-matic-usdt-v2',
    symbol: 'MATIC/USDT',
    name: 'MATIC/USDT 经典 V2 池',
    type: 'v2',
    status: 'live',
    risk: 'medium',
    tokens: [
      { symbol: 'MATIC', weight: 50, amount: 12400000, price: 0.482 },
      { symbol: 'USDT', weight: 50, amount: 6000000, price: 1 },
    ],
    tvl: 12000000,
    volume24h: 84000000,
    fees24h: 42000,
    aprBase: 12.4,
    aprReward: 18.6,
    aprTotal: 31.0,
    apr7d: 28.4,
    apr30d: 26.2,
    utilization: 64,
    participants: 1240,
    capacity: 50000000,
    feeTier: 0.3,
    rewards: [
      { token: 'ZSD', perDay: 18400, apr: 18.6 },
    ],
    audit: ['CertiK', 'SlowMist'],
    description: 'MATIC/USDT 经典 V2 池，Polygon 链上标准 AMM。',
    tags: ['MATIC', 'Polygon', 'V2'],
    chain: 'Polygon',
    launchedAt: '2024-12-02',
    updatedAt: '2026-07-12',
    highlights: ['Polygon 链', 'V2 标准 AMM', 'APR 31%', 'ZSD 奖励'],
    risks: ['Polygon 链风险', 'MATIC 价格波动'],
  },
  {
    id: 'p-link-eth-index',
    symbol: '蓝筹指数',
    name: '蓝筹指数加权池',
    type: 'index',
    status: 'live',
    risk: 'high',
    tokens: [
      { symbol: 'BTC', weight: 40, amount: 184, price: 68420 },
      { symbol: 'ETH', weight: 30, amount: 1240, price: 3652 },
      { symbol: 'SOL', weight: 20, amount: 8400, price: 168 },
      { symbol: 'BNB', weight: 10, amount: 1480, price: 612 },
    ],
    tvl: 42000000,
    volume24h: 184000000,
    fees24h: 92000,
    aprBase: 14.2,
    aprReward: 22.4,
    aprTotal: 36.6,
    apr7d: 32.4,
    apr30d: 28.6,
    utilization: 58,
    participants: 2480,
    capacity: 100000000,
    feeTier: 0.1,
    rewards: [
      { token: 'ZSD', perDay: 48000, apr: 18.2 },
      { token: 'ZSDEX', perDay: 8400, apr: 4.2 },
    ],
    audit: ['CertiK', 'SlowMist', 'PeckShield'],
    description: 'BTC/ETH/SOL/BNB 蓝筹指数加权池，权重 40/30/20/10。',
    tags: ['指数', '蓝筹', '加权', '多币种'],
    chain: 'ZS-Chain',
    launchedAt: '2025-01-08',
    updatedAt: '2026-07-18',
    highlights: ['蓝筹指数', '权重 40/30/20/10', '总锁仓 4200 万', 'ZSD + ZSDEX 双币奖励'],
    risks: ['多币种波动', '权重再平衡风险', '智能合约风险'],
  },
];

const FARMS: Farm[] = [
  {
    id: 'f-zsd-single',
    name: 'ZSD 单币挖矿 V2',
    type: 'single',
    status: 'boosted',
    stakeToken: 'ZSD',
    earnTokens: ['ZSDEX', 'ZSD'],
    tvl: 124000000,
    capacity: 200000000,
    participants: 18420,
    aprBase: 12.4,
    aprBoost: 18.6,
    aprTotal: 31.0,
    lockup: 0,
    harvestEvery: '24h',
    multiplier: '1x → 2.5x',
    audit: ['CertiK', 'SlowMist'],
    description: 'ZSD 单币挖矿，灵活存取，按持仓 ZSDEX 数量提升 boost。',
    tags: ['ZSD', '单币', 'Boost', '灵活'],
    chain: 'ZS-Chain',
    launchedAt: '2024-08-15',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSDEX', perDay: 124000, apr: 24.0 },
      { token: 'ZSD', perDay: 18400, apr: 7.0 },
    ],
    highlights: ['灵活存取', 'Boost 倍率 1x-2.5x', '总锁仓 1.24 亿', '日结收益'],
    risks: ['平台币价格波动', 'Boost 计算风险'],
  },
  {
    id: 'f-btc-eth-lp',
    name: 'BTC/ETH LP 双挖',
    type: 'lp',
    status: 'boosted',
    stakeToken: 'BTC/ETH LP',
    earnTokens: ['ZSD', 'ZSDEX'],
    tvl: 84000000,
    capacity: 200000000,
    participants: 6240,
    aprBase: 24.6,
    aprBoost: 32.4,
    aprTotal: 57.0,
    lockup: 7,
    harvestEvery: '24h',
    multiplier: '1x → 2x',
    audit: ['CertiK', 'SlowMist'],
    description: 'BTC/ETH LP 代币挖矿，7 天锁仓，ZSD + ZSDEX 双币奖励。',
    tags: ['LP', '双币', 'Boost'],
    chain: 'ZS-Chain',
    launchedAt: '2024-09-12',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSD', perDay: 84000, apr: 32.4 },
      { token: 'ZSDEX', perDay: 12400, apr: 24.6 },
    ],
    highlights: ['双币奖励', '7 天锁仓', 'APR 57%', 'Boost 1x-2x'],
    risks: ['无常损失', 'LP 退出滑点', '锁仓期间无法赎回'],
  },
  {
    id: 'f-usdt-stable-vault',
    name: 'USDT 稳定收益机枪池',
    type: 'vault',
    status: 'live',
    stakeToken: 'USDT',
    earnTokens: ['USDT'],
    tvl: 168000000,
    capacity: 500000000,
    participants: 12480,
    aprBase: 8.4,
    aprBoost: 0,
    aprTotal: 8.4,
    lockup: 0,
    harvestEvery: '即时',
    multiplier: '1x',
    audit: ['CertiK', 'SlowMist', 'PeckShield', 'Quantstamp'],
    description: 'USDT 稳定收益机枪池，自动复投，灵活存取。',
    tags: ['USDT', '机枪池', '稳定', '即时赎回'],
    chain: 'Multi',
    launchedAt: '2024-04-20',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'USDT', perDay: 38000, apr: 8.4 },
    ],
    highlights: ['USDT 稳定币', '自动复投', '总锁仓 1.68 亿', '即时赎回'],
    risks: ['收益波动', '智能合约风险'],
  },
  {
    id: 'f-zsdx-leveraged',
    name: 'ZSDX 杠杆挖矿 3x',
    type: 'leveraged',
    status: 'live',
    stakeToken: 'ZSDX',
    earnTokens: ['ZSD', 'ZSDEX'],
    tvl: 24000000,
    capacity: 50000000,
    participants: 1480,
    aprBase: 48.4,
    aprBoost: 24.6,
    aprTotal: 73.0,
    lockup: 30,
    harvestEvery: '24h',
    multiplier: '3x',
    audit: ['CertiK', 'SlowMist'],
    description: 'ZSDX 杠杆挖矿，3 倍杠杆放大利润与风险，30 天锁仓。',
    tags: ['ZSDX', '杠杆', '3x', '高APR'],
    chain: 'ZS-Chain',
    launchedAt: '2025-01-12',
    updatedAt: '2026-07-15',
    rewards: [
      { token: 'ZSD', perDay: 18400, apr: 48.4 },
      { token: 'ZSDEX', perDay: 4800, apr: 24.6 },
    ],
    highlights: ['3x 杠杆', '30 天锁仓', 'APR 73%', '双币奖励'],
    risks: ['杠杆爆仓风险', '高波动', '锁仓期间无法赎回'],
  },
  {
    id: 'f-auto-compound',
    name: 'Alpha 自动复投策略池',
    type: 'auto',
    status: 'new',
    stakeToken: 'ZSD',
    earnTokens: ['ZSD', 'ZSDEX'],
    tvl: 8400000,
    capacity: 50000000,
    participants: 680,
    aprBase: 16.8,
    aprBoost: 24.4,
    aprTotal: 41.2,
    lockup: 14,
    harvestEvery: '自动',
    multiplier: '1x → 1.5x',
    audit: ['CertiK', 'SlowMist'],
    description: 'AI 策略自动复投，14 天锁仓，按持仓 ZSDEX 数量提升 boost。',
    tags: ['AI 策略', '自动复投', 'Boost'],
    chain: 'ZS-Chain',
    launchedAt: '2026-06-15',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSD', perDay: 8400, apr: 16.8 },
      { token: 'ZSDEX', perDay: 1240, apr: 24.4 },
    ],
    highlights: ['AI 策略', '自动复投', '14 天锁仓', 'APR 41.2%'],
    risks: ['策略风险', 'AI 模型风险', '锁仓期间无法赎回'],
  },
  {
    id: 'f-sol-single',
    name: 'SOL 单币挖矿',
    type: 'single',
    status: 'live',
    stakeToken: 'SOL',
    earnTokens: ['ZSD'],
    tvl: 18400000,
    capacity: 50000000,
    participants: 1240,
    aprBase: 18.4,
    aprBoost: 12.6,
    aprTotal: 31.0,
    lockup: 0,
    harvestEvery: '24h',
    multiplier: '1x → 2x',
    audit: ['CertiK', 'SlowMist'],
    description: 'SOL 单币挖矿，灵活存取，ZSD 平台币奖励。',
    tags: ['SOL', '单币', '灵活'],
    chain: 'Solana',
    launchedAt: '2024-12-20',
    updatedAt: '2026-07-15',
    rewards: [
      { token: 'ZSD', perDay: 12400, apr: 18.4 },
    ],
    highlights: ['SOL 链', '灵活存取', 'APR 31%', 'ZSD 奖励'],
    risks: ['SOL 价格波动', 'Solana 网络风险'],
  },
  {
    id: 'f-eth-lido-steth',
    name: 'stETH 流动性质押挖矿',
    type: 'single',
    status: 'live',
    stakeToken: 'stETH',
    earnTokens: ['ZSD', 'ETH'],
    tvl: 38400000,
    capacity: 100000000,
    participants: 2480,
    aprBase: 4.2,
    aprBoost: 14.6,
    aprTotal: 18.8,
    lockup: 0,
    harvestEvery: '24h',
    multiplier: '1x → 1.5x',
    audit: ['CertiK', 'SlowMist', 'Quantstamp'],
    description: 'Lido stETH 流动性质押挖矿，ETH + ZSD 双币奖励。',
    tags: ['stETH', 'Lido', '流动性质押', '双币奖励'],
    chain: 'Ethereum',
    launchedAt: '2024-07-10',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSD', perDay: 18400, apr: 14.6 },
      { token: 'ETH', perDay: 4.2, apr: 4.2 },
    ],
    highlights: ['stETH 质押', '双币奖励', '总锁仓 3840 万', '灵活存取'],
    risks: ['ETH 脱锚风险', 'Lido 协议风险'],
  },
  {
    id: 'f-matic-aave',
    name: 'Aave MATIC 存款挖矿',
    type: 'vault',
    status: 'live',
    stakeToken: 'aMATIC',
    earnTokens: ['MATIC', 'ZSD'],
    tvl: 8400000,
    capacity: 30000000,
    participants: 680,
    aprBase: 6.4,
    aprBoost: 8.4,
    aprTotal: 14.8,
    lockup: 0,
    harvestEvery: '即时',
    multiplier: '1x',
    audit: ['CertiK', 'Aave Guardian'],
    description: 'Aave 协议 MATIC 存款凭证挖矿，MATIC + ZSD 双币奖励。',
    tags: ['Aave', 'MATIC', 'DeFi 协议联动'],
    chain: 'Polygon',
    launchedAt: '2025-02-18',
    updatedAt: '2026-07-10',
    rewards: [
      { token: 'MATIC', perDay: 1240, apr: 6.4 },
      { token: 'ZSD', perDay: 1840, apr: 8.4 },
    ],
    highlights: ['Aave 协议联动', 'MATIC + ZSD 双币奖励', '即时赎回', 'APR 14.8%'],
    risks: ['Aave 协议风险', 'Polygon 链风险'],
  },
];

const DUALS: Dual[] = [
  {
    id: 'd-btc-70000',
    name: 'BTC 区间双币 7d',
    type: 'range',
    status: 'live',
    underlying: 'BTC',
    quote: 'USDT',
    strikeLow: 64000,
    strikeHigh: 74000,
    spot: 68420,
    apyLow: 8.4,
    apyHigh: 38.6,
    apyBase: 18.4,
    duration: 7,
    minSubscription: 100,
    maxSubscription: 1000000,
    totalSubscribed: 24800000,
    participants: 4280,
    settlement: '到期现金结算',
    coupon: '24.6%',
    principalProtection: true,
    description: 'BTC 7 天区间双币理财，价格在 64000-74000 区间内年化 38.6%。',
    tags: ['BTC', '区间', '双币', '低风险'],
    launchedAt: '2026-07-12',
    updatedAt: '2026-07-18',
    scenarios: [
      { condition: 'BTC 落在区间内', payout: 10000, apy: 38.6 },
      { condition: 'BTC 突破上限', payout: 10100, apy: 2.0 },
      { condition: 'BTC 跌破下限', payout: 9900, apy: -2.0 },
    ],
    highlights: ['本金保护型', '区间年化 38.6%', '7 天期限', 'USDT 结算'],
    risks: ['区间判断风险', '结算价格波动'],
  },
  {
    id: 'd-eth-snowball',
    name: 'ETH 雪球双币 14d',
    type: 'snowball',
    status: 'live',
    underlying: 'ETH',
    quote: 'USDT',
    strikeLow: 3200,
    strikeHigh: 4200,
    spot: 3652,
    apyLow: 12.4,
    apyHigh: 48.4,
    apyBase: 24.6,
    duration: 14,
    minSubscription: 100,
    maxSubscription: 500000,
    totalSubscribed: 18400000,
    participants: 3280,
    settlement: '到期现金结算',
    coupon: '32.4%',
    principalProtection: true,
    description: 'ETH 14 天雪球双币理财，未触发敲入年化 48.4%。',
    tags: ['ETH', '雪球', '双币', '中高收益'],
    launchedAt: '2026-07-05',
    updatedAt: '2026-07-18',
    scenarios: [
      { condition: '未触发敲入', payout: 10124, apy: 48.4 },
      { condition: '触发敲入但期末高于执行价', payout: 10000, apy: 0 },
      { condition: '触发敲入且期末低于执行价', payout: 9200, apy: -32.4 },
    ],
    highlights: ['雪球结构', '未敲入年化 48.4%', '14 天期限', '本金保护'],
    risks: ['敲入风险', 'ETH 价格波动'],
  },
  {
    id: 'd-btc-sharkfin',
    name: 'BTC 鲨鱼鳍 30d',
    type: 'sharkfin',
    status: 'live',
    underlying: 'BTC',
    quote: 'USDT',
    strikeLow: 60000,
    strikeHigh: 78000,
    spot: 68420,
    apyLow: 6.2,
    apyHigh: 56.4,
    apyBase: 18.4,
    duration: 30,
    minSubscription: 1000,
    maxSubscription: 2000000,
    totalSubscribed: 42000000,
    participants: 6240,
    settlement: '到期现金结算',
    coupon: '18.4%',
    principalProtection: true,
    description: 'BTC 30 天鲨鱼鳍双币，价格波动越大收益越高。',
    tags: ['BTC', '鲨鱼鳍', '双币', '波动率'],
    launchedAt: '2026-06-20',
    updatedAt: '2026-07-18',
    scenarios: [
      { condition: 'BTC 价格波动小', payout: 10000, apy: 6.2 },
      { condition: 'BTC 价格大幅波动', payout: 10462, apy: 56.4 },
      { condition: 'BTC 单边大幅下跌', payout: 9500, apy: -56.4 },
    ],
    highlights: ['鲨鱼鳍结构', '波动率年化 56.4%', '30 天期限', '本金保护'],
    risks: ['单边行情风险', '波动率判断风险'],
  },
  {
    id: 'd-sol-butterfly',
    name: 'SOL 蝶式双币 7d',
    type: 'butterfly',
    status: 'live',
    underlying: 'SOL',
    quote: 'USDC',
    strikeLow: 150,
    strikeHigh: 200,
    spot: 168,
    apyLow: 8.4,
    apyHigh: 32.4,
    apyBase: 14.4,
    duration: 7,
    minSubscription: 100,
    maxSubscription: 500000,
    totalSubscribed: 8400000,
    participants: 1480,
    settlement: '到期现金结算',
    coupon: '14.4%',
    principalProtection: true,
    description: 'SOL 7 天蝶式双币，区间内年化 32.4%，区间外年化 8.4%。',
    tags: ['SOL', '蝶式', '双币'],
    launchedAt: '2026-07-12',
    updatedAt: '2026-07-18',
    scenarios: [
      { condition: 'SOL 落在 150-200 区间', payout: 10062, apy: 32.4 },
      { condition: 'SOL 突破 200', payout: 10016, apy: 8.4 },
      { condition: 'SOL 跌破 150', payout: 10016, apy: 8.4 },
    ],
    highlights: ['蝶式结构', '区间内年化 32.4%', '7 天期限', '本金保护'],
    risks: ['区间判断风险', 'SOL 价格波动'],
  },
  {
    id: 'd-eth-ladder',
    name: 'ETH 阶梯双币 90d',
    type: 'ladder',
    status: 'live',
    underlying: 'ETH',
    quote: 'USDT',
    strikeLow: 3000,
    strikeHigh: 4500,
    spot: 3652,
    apyLow: 10.4,
    apyHigh: 42.4,
    apyBase: 18.4,
    duration: 90,
    minSubscription: 1000,
    maxSubscription: 1000000,
    totalSubscribed: 18400000,
    participants: 2480,
    settlement: '到期现金结算',
    coupon: '28.4%',
    principalProtection: true,
    description: 'ETH 90 天阶梯双币，每跨过一个执行价阶梯收益累加。',
    tags: ['ETH', '阶梯', '双币', '90 天'],
    launchedAt: '2026-04-20',
    updatedAt: '2026-07-15',
    scenarios: [
      { condition: 'ETH 价格 ≤ 3000', payout: 10000, apy: 10.4 },
      { condition: 'ETH 3000-4500', payout: 10000 + 1480, apy: 18.4 },
      { condition: 'ETH ≥ 4500', payout: 10000 + 2480, apy: 42.4 },
    ],
    highlights: ['阶梯结构', '90 天期限', '本金保护', '高APR 42.4%'],
    risks: ['阶梯执行风险', 'ETH 价格波动'],
  },
  {
    id: 'd-btc-range-upcoming',
    name: 'BTC 区间双币 14d (下一期)',
    type: 'range',
    status: 'upcoming',
    underlying: 'BTC',
    quote: 'USDT',
    strikeLow: 65000,
    strikeHigh: 75000,
    spot: 68420,
    apyLow: 8.4,
    apyHigh: 36.4,
    apyBase: 18.4,
    duration: 14,
    minSubscription: 100,
    maxSubscription: 1000000,
    totalSubscribed: 0,
    participants: 0,
    settlement: '到期现金结算',
    coupon: '24.4%',
    principalProtection: true,
    description: 'BTC 14 天区间双币理财，7-21 开放申购，区间 65000-75000。',
    tags: ['BTC', '区间', '双币', '预约'],
    launchedAt: '2026-07-22',
    updatedAt: '2026-07-18',
    scenarios: [
      { condition: 'BTC 落在区间内', payout: 10000, apy: 36.4 },
      { condition: 'BTC 突破上限', payout: 10100, apy: 2.0 },
      { condition: 'BTC 跌破下限', payout: 9900, apy: -2.0 },
    ],
    highlights: ['即将开放', '区间年化 36.4%', '14 天期限', 'USDT 结算'],
    risks: ['区间判断风险', '结算价格波动'],
  },
];

const LOCK_PRODUCTS: LockProduct[] = [
  {
    id: 'l-zsd-30',
    name: 'ZSD 30 天锁仓挖矿',
    status: 'live',
    token: 'ZSD',
    term: 30,
    minAmount: 1000,
    maxAmount: 5000000,
    totalQuota: 200000000,
    subscribed: 124000000,
    aprBase: 18.4,
    aprBoost: 12.6,
    aprTotal: 31.0,
    participants: 8420,
    earlyRedeem: true,
    earlyPenalty: 50,
    autoRenew: true,
    description: 'ZSD 30 天锁仓挖矿，按持仓 ZSDEX 数量提升 boost。',
    tags: ['ZSD', '30 天', 'Boost'],
    launchedAt: '2024-08-15',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSD', perDay: 38000, apr: 18.4 },
      { token: 'ZSDEX', perDay: 12400, apr: 12.6 },
    ],
    highlights: ['30 天锁仓', 'APR 31%', 'Boost 1x-2.5x', 'ZSD + ZSDEX 双币奖励'],
    risks: ['锁仓期间提前赎回罚息 50%', '平台币价格波动'],
  },
  {
    id: 'l-zsd-90',
    name: 'ZSD 90 天锁仓挖矿',
    status: 'live',
    token: 'ZSD',
    term: 90,
    minAmount: 1000,
    maxAmount: 5000000,
    totalQuota: 200000000,
    subscribed: 84000000,
    aprBase: 28.4,
    aprBoost: 24.6,
    aprTotal: 53.0,
    participants: 4280,
    earlyRedeem: true,
    earlyPenalty: 70,
    autoRenew: true,
    description: 'ZSD 90 天锁仓挖矿，长期持仓奖励更高。',
    tags: ['ZSD', '90 天', 'Boost', '高 APR'],
    launchedAt: '2024-08-15',
    updatedAt: '2026-07-18',
    rewards: [
      { token: 'ZSD', perDay: 28000, apr: 28.4 },
      { token: 'ZSDEX', perDay: 18400, apr: 24.6 },
    ],
    highlights: ['90 天锁仓', 'APR 53%', 'ZSD + ZSDEX 双币奖励', '自动续期'],
    risks: ['锁仓期间提前赎回罚息 70%', '长期价格波动'],
  },
  {
    id: 'l-zsd-180',
    name: 'ZSD 180 天锁仓挖矿',
    status: 'live',
    token: 'ZSD',
    term: 180,
    minAmount: 5000,
    maxAmount: 10000000,
    totalQuota: 100000000,
    subscribed: 42000000,
    aprBase: 38.4,
    aprBoost: 32.6,
    aprTotal: 71.0,
    participants: 1840,
    earlyRedeem: false,
    earlyPenalty: 0,
    autoRenew: true,
    description: 'ZSD 180 天锁仓挖矿，半年期超高 APR。',
    tags: ['ZSD', '180 天', '高 APR'],
    launchedAt: '2024-09-12',
    updatedAt: '2026-07-15',
    rewards: [
      { token: 'ZSD', perDay: 18400, apr: 38.4 },
      { token: 'ZSDEX', perDay: 12400, apr: 32.6 },
    ],
    highlights: ['180 天锁仓', 'APR 71%', '不允许提前赎回', '双币奖励'],
    risks: ['180 天锁仓无法提前赎回', '长期价格波动'],
  },
  {
    id: 'l-zsd-365',
    name: 'ZSD 365 天锁仓挖矿',
    status: 'live',
    token: 'ZSD',
    term: 365,
    minAmount: 10000,
    maxAmount: 20000000,
    totalQuota: 50000000,
    subscribed: 18400000,
    aprBase: 48.4,
    aprBoost: 42.6,
    aprTotal: 91.0,
    participants: 680,
    earlyRedeem: false,
    earlyPenalty: 0,
    autoRenew: true,
    description: 'ZSD 365 天锁仓挖矿，一年期顶级 APR 奖励。',
    tags: ['ZSD', '365 天', '顶级 APR'],
    launchedAt: '2024-10-08',
    updatedAt: '2026-07-10',
    rewards: [
      { token: 'ZSD', perDay: 8400, apr: 48.4 },
      { token: 'ZSDEX', perDay: 5800, apr: 42.6 },
    ],
    highlights: ['365 天锁仓', 'APR 91%', '顶级奖励', '双币奖励'],
    risks: ['365 天锁仓无法提前赎回', '长期价格波动风险'],
  },
  {
    id: 'l-zsdex-30',
    name: 'ZSDEX 30 天锁仓',
    status: 'live',
    token: 'ZSDEX',
    term: 30,
    minAmount: 100,
    maxAmount: 1000000,
    totalQuota: 50000000,
    subscribed: 24000000,
    aprBase: 14.4,
    aprBoost: 0,
    aprTotal: 14.4,
    participants: 3280,
    earlyRedeem: true,
    earlyPenalty: 30,
    autoRenew: true,
    description: 'ZSDEX 30 天锁仓，平台币单币奖励。',
    tags: ['ZSDEX', '30 天', '单币'],
    launchedAt: '2024-11-02',
    updatedAt: '2026-07-15',
    rewards: [
      { token: 'ZSDEX', perDay: 12400, apr: 14.4 },
    ],
    highlights: ['ZSDEX 单币', '30 天锁仓', 'APR 14.4%', '灵活'],
    risks: ['锁仓期间提前赎回罚息 30%', '平台币价格波动'],
  },
  {
    id: 'l-usdt-90',
    name: 'USDT 90 天稳定锁仓',
    status: 'live',
    token: 'USDT',
    term: 90,
    minAmount: 1000,
    maxAmount: 5000000,
    totalQuota: 100000000,
    subscribed: 48000000,
    aprBase: 8.4,
    aprBoost: 0,
    aprTotal: 8.4,
    participants: 1840,
    earlyRedeem: true,
    earlyPenalty: 20,
    autoRenew: true,
    description: 'USDT 90 天稳定锁仓，低风险稳定收益。',
    tags: ['USDT', '90 天', '稳定'],
    launchedAt: '2024-12-15',
    updatedAt: '2026-07-10',
    rewards: [
      { token: 'USDT', perDay: 11000, apr: 8.4 },
    ],
    highlights: ['USDT 稳定币', '90 天锁仓', 'APR 8.4%', '低风险'],
    risks: ['锁仓期间提前赎回罚息 20%', 'USDT 脱锚风险'],
  },
];

const REFERRAL_STATS: ReferralStat[] = [
  { level: 1, name: '一级', ratio: 20, count: 124, volume: 24800000, commission: 124000 },
  { level: 2, name: '二级', ratio: 8, count: 384, volume: 18400000, commission: 92000 },
  { level: 3, name: '三级', ratio: 3, count: 1240, volume: 8400000, commission: 42000 },
];

const HISTORY: HistoryEntry[] = [
  { id: 'h-001', type: 'pool', product: 'BTC/USDT V3', principal: 10000, reward: 142, rewardToken: 'ZSD', apy: 51.0, startAt: '2026-06-15', endAt: '2026-07-15', status: 'active', txHash: '0xabc...123' },
  { id: 'h-002', type: 'farm', product: 'ZSD 单币挖矿 V2', principal: 50000, reward: 1342, rewardToken: 'ZSDEX', apy: 31.0, startAt: '2026-05-20', endAt: '2026-07-20', status: 'active', txHash: '0xdef...456' },
  { id: 'h-003', type: 'lock', product: 'ZSD 30 天锁仓', principal: 20000, reward: 512, rewardToken: 'ZSD', apy: 31.0, startAt: '2026-06-18', endAt: '2026-07-18', status: 'completed', txHash: '0xghi...789' },
  { id: 'h-004', type: 'dual', product: 'BTC 区间双币 7d', principal: 10000, reward: 64, rewardToken: 'USDT', apy: 38.6, startAt: '2026-07-08', endAt: '2026-07-15', status: 'completed', txHash: '0xjkl...012' },
  { id: 'h-005', type: 'farm', product: 'USDT 稳定收益机枪池', principal: 30000, reward: 208, rewardToken: 'USDT', apy: 8.4, startAt: '2026-06-01', endAt: '2026-07-01', status: 'completed', txHash: '0xmno...345' },
  { id: 'h-006', type: 'pool', product: 'USDT/USDC 稳定币池', principal: 20000, reward: 282, rewardToken: 'ZSD', apy: 17.0, startAt: '2026-06-10', endAt: '-', status: 'active', txHash: '0xpqr...678' },
  { id: 'h-007', type: 'lock', product: 'ZSD 90 天锁仓', principal: 50000, reward: 2184, rewardToken: 'ZSD', apy: 53.0, startAt: '2026-04-15', endAt: '2026-07-15', status: 'completed', txHash: '0xstu...901' },
  { id: 'h-008', type: 'referral', product: '推荐返佣', principal: 0, reward: 1240, rewardToken: 'USDT', apy: 0, startAt: '2026-07-01', endAt: '2026-07-18', status: 'active', txHash: '0xvwx...234' },
  { id: 'h-009', type: 'farm', product: 'BTC/ETH LP 双挖', principal: 15000, reward: 706, rewardToken: 'ZSD', apy: 57.0, startAt: '2026-06-20', endAt: '2026-07-20', status: 'active', txHash: '0xyz0...567' },
  { id: 'h-010', type: 'dual', product: 'ETH 雪球双币 14d', principal: 20000, reward: 542, rewardToken: 'USDT', apy: 48.4, startAt: '2026-06-25', endAt: '2026-07-09', status: 'completed', txHash: '0xabc...890' },
];

const APPLICATIONS: Application[] = [
  { id: 'a-001', type: 'project', company: 'AlphaDAO', contact: '张 *', email: 'a***@alphadao.io', region: '亚太', description: '希望上线蓝筹指数加权池，TVL 目标 5000 万 USDT', expectedTvl: 50000000, stage: 'live', submittedAt: '2026-04-12', updatedAt: '2026-06-20', progress: 100, reviewer: 'DeFi 产品组' },
  { id: 'a-002', type: 'pool', company: 'BetaLabs', contact: '李 *', email: 'b***@betalabs.com', region: '欧洲', description: '申请 ZSD/USDT 集中流动性 V3 池', expectedTvl: 30000000, stage: 'audit', submittedAt: '2026-06-08', updatedAt: '2026-07-12', progress: 60, reviewer: '智能合约审计组' },
  { id: 'a-003', type: 'farm', company: 'GammaYield', contact: '王 *', email: 'g***@gammayield.com', region: '北美', description: '申请 90 天长期单币挖矿产品', expectedTvl: 20000000, stage: 'tech-test', submittedAt: '2026-06-22', updatedAt: '2026-07-15', progress: 80, reviewer: '测试组' },
  { id: 'a-004', type: 'partner', company: 'DeltaFinance', contact: '赵 *', email: 'd***@deltafi.net', region: '中东', description: '希望成为 ZSDEX 战略合作伙伴', expectedTvl: 100000000, stage: 'review', submittedAt: '2026-07-02', updatedAt: '2026-07-18', progress: 30, reviewer: 'BD 组' },
  { id: 'a-005', type: 'audit', company: 'EpsilonSec', contact: '钱 *', email: 'e***@epsilonsec.io', region: '亚太', description: '申请成为 ZSDEX 官方审计合作方', expectedTvl: 0, stage: 'submitted', submittedAt: '2026-07-15', updatedAt: '2026-07-18', progress: 10, reviewer: '安全组' },
];

// ============== Helpers ==============

function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    const duration = 600;
    const startTime = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + diff * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span>
      {prefix}
      {display.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function KpiCard({ label, value, decimals = 0, prefix = '', suffix = '', color, sub, icon: Icon }: { label: string; value: number; decimals?: number; prefix?: string; suffix?: string; color?: string; sub?: string; icon?: any }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
        {Icon && <Icon size={14} style={{ color: color || BRAND.primary }} />}
      </div>
      <div className="text-xl font-semibold" style={{ color: color || BRAND.text }}>
        <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      {sub && <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    live: { label: '运行中', bg: 'rgba(20,184,129,0.15)', fg: BRAND.primary },
    new: { label: '新上线', bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
    boosted: { label: 'Boost', bg: 'rgba(20,184,129,0.15)', fg: BRAND.primary },
    paused: { label: '暂停', bg: 'rgba(255,184,0,0.15)', fg: '#FFB800' },
    ended: { label: '已结束', bg: 'rgba(176,176,176,0.15)', fg: BRAND.textMuted },
    retired: { label: '已下线', bg: 'rgba(176,176,176,0.15)', fg: BRAND.textMuted },
    upcoming: { label: '即将开放', bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
    active: { label: '进行中', bg: 'rgba(20,184,129,0.15)', fg: BRAND.primary },
    completed: { label: '已完成', bg: 'rgba(176,176,176,0.15)', fg: BRAND.textMuted },
    pending: { label: '待处理', bg: 'rgba(255,184,0,0.15)', fg: '#FFB800' },
    cancelled: { label: '已取消', bg: 'rgba(255,76,76,0.15)', fg: '#FF4C4C' },
    submitted: { label: '已提交', bg: 'rgba(176,176,176,0.15)', fg: BRAND.textMuted },
    review: { label: '审核中', bg: 'rgba(255,184,0,0.15)', fg: '#FFB800' },
    audit: { label: '审计中', bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
    kyb: { label: 'KYB 中', bg: 'rgba(255,184,0,0.15)', fg: '#FFB800' },
    'tech-test': { label: '技术对接', bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
    rejected: { label: '已驳回', bg: 'rgba(255,76,76,0.15)', fg: '#FF4C4C' },
  };
  const info = map[status] || { label: status, bg: 'rgba(176,176,176,0.15)', fg: BRAND.textMuted };
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: info.bg, color: info.fg }}>
      {info.label}
    </span>
  );
}

function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatTvl(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} K`;
  return n.toString();
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function poolTypeLabel(t: PoolType): string {
  const map: Record<PoolType, string> = {
    v2: 'V2',
    v3: 'V3',
    stable: '稳定币',
    single: '单币',
    weighted: '加权',
    concentrated: '集中',
    index: '指数',
  };
  return map[t] || t;
}

function riskLabel(r: RiskLevel): { label: string; color: string } {
  const map: Record<RiskLevel, { label: string; color: string }> = {
    low: { label: '低风险', color: BRAND.primary },
    medium: { label: '中风险', color: '#FFB800' },
    high: { label: '高风险', color: '#FF8C00' },
    extreme: { label: '极高风险', color: '#FF4C4C' },
  };
  return map[r];
}

// ============== 主体组件 ==============

export function PortalDefi() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [poolTypeFilter, setPoolTypeFilter] = useState<PoolType | 'all'>('all');
  const [poolRiskFilter, setPoolRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [poolStatusFilter, setPoolStatusFilter] = useState<PoolStatus | 'all'>('all');
  const [farmTypeFilter, setFarmTypeFilter] = useState<FarmType | 'all'>('all');
  const [farmStatusFilter, setFarmStatusFilter] = useState<string>('all');
  const [dualTypeFilter, setDualTypeFilter] = useState<DualType | 'all'>('all');
  const [dualStatusFilter, setDualStatusFilter] = useState<string>('all');
  const [lockTermFilter, setLockTermFilter] = useState<LockTerm | 'all'>('all');
  const [lockTokenFilter, setLockTokenFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'tvl' | 'apr' | 'participants' | 'updated'>('tvl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('project');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyTvl, setApplyTvl] = useState('');
  const [applyDesc, setApplyDesc] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalTvl: 1248000000,
    tvl24hChange: 4.2,
    totalPools: 28,
    totalFarms: 18,
    totalDuals: 12,
    totalLocks: 8,
    totalParticipants: 68420,
    totalRewards: 184000000,
    totalVolume24h: 8640000000,
    avgApr: 24.6,
    maxApr: 91.0,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalTvl: prev.totalTvl + Math.floor(Math.random() * 800000 - 200000),
        totalVolume24h: prev.totalVolume24h + Math.floor(Math.random() * 4000000 - 1500000),
        totalRewards: prev.totalRewards + Math.floor(Math.random() * 4000 - 1500),
        totalParticipants: prev.totalParticipants + Math.floor(Math.random() * 4 - 1),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      } else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'pools', 'farms', 'dual', 'lock', 'referral', 'history', 'apply', 'help'];
        setTab(tabs[parseInt(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  const filteredPools = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = POOLS.filter((p) => {
      if (poolTypeFilter !== 'all' && p.type !== poolTypeFilter) return false;
      if (poolRiskFilter !== 'all' && p.risk !== poolRiskFilter) return false;
      if (poolStatusFilter !== 'all' && p.status !== poolStatusFilter) return false;
      if (q && !`${p.symbol} ${p.name} ${p.tags.join(' ')} ${p.chain}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = list.sort((a, b) => {
      let va = 0; let vb = 0;
      if (sortBy === 'tvl') { va = a.tvl; vb = b.tvl; }
      else if (sortBy === 'apr') { va = a.aprTotal; vb = b.aprTotal; }
      else if (sortBy === 'participants') { va = a.participants; vb = b.participants; }
      else if (sortBy === 'updated') { va = new Date(a.updatedAt).getTime(); vb = new Date(b.updatedAt).getTime(); }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [search, poolTypeFilter, poolRiskFilter, poolStatusFilter, sortBy, sortDir]);

  const filteredFarms = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = FARMS.filter((f) => {
      if (farmTypeFilter !== 'all' && f.type !== farmTypeFilter) return false;
      if (farmStatusFilter !== 'all' && f.status !== farmStatusFilter) return false;
      if (q && !`${f.name} ${f.stakeToken} ${f.earnTokens.join(' ')} ${f.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = list.sort((a, b) => (sortDir === 'asc' ? a.aprTotal - b.aprTotal : b.aprTotal - a.aprTotal));
    return list;
  }, [search, farmTypeFilter, farmStatusFilter, sortBy, sortDir]);

  const filteredDuals = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = DUALS.filter((d) => {
      if (dualTypeFilter !== 'all' && d.type !== dualTypeFilter) return false;
      if (dualStatusFilter !== 'all' && d.status !== dualStatusFilter) return false;
      if (q && !`${d.name} ${d.underlying} ${d.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return list;
  }, [search, dualTypeFilter, dualStatusFilter]);

  const filteredLocks = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = LOCK_PRODUCTS.filter((l) => {
      if (lockTermFilter !== 'all' && l.term !== lockTermFilter) return false;
      if (lockTokenFilter !== 'all' && l.token !== lockTokenFilter) return false;
      if (q && !`${l.name} ${l.token} ${l.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    list = list.sort((a, b) => (sortDir === 'asc' ? a.term - b.term : b.term - a.term));
    return list;
  }, [search, lockTermFilter, lockTokenFilter, sortDir]);

  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);
  const openPool = (id: string) => setDrawer({ open: true, type: 'pool', payload: id });
  const openFarm = (id: string) => setDrawer({ open: true, type: 'farm', payload: id });
  const openDual = (id: string) => setDrawer({ open: true, type: 'dual', payload: id });
  const openLock = (id: string) => setDrawer({ open: true, type: 'lock', payload: id });
  const openDeposit = (id: string) => {
    setDrawer({ open: true, type: 'deposit', payload: id });
    setDepositAmount('');
  };

  const submitDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    alert(`申购成功：${depositAmount} USDT 等值申购（演示）`);
    setDepositAmount('');
    closeDrawer();
  };

  const submitApply = () => {
    if (!applyCompany || !applyContact || !applyEmail) {
      alert('请填写完整申请信息');
      return;
    }
    if (applyStep < 3) {
      setApplyStep(applyStep + 1);
    } else {
      alert('申请已提交（演示）');
      setApplyStep(0);
      setApplyCompany('');
      setApplyContact('');
      setApplyEmail('');
      setApplyTvl('');
      setApplyDesc('');
      closeDrawer();
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: '总览', icon: Gauge },
    { key: 'pools', label: '流动性池', icon: Droplets },
    { key: 'farms', label: '收益农场', icon: Sprout },
    { key: 'dual', label: '双币理财', icon: Coins },
    { key: 'lock', label: '锁仓挖矿', icon: Lock },
    { key: 'referral', label: '推荐奖励', icon: UserPlus },
    { key: 'history', label: '历史收益', icon: Clock },
    { key: 'apply', label: '申请入驻', icon: Briefcase },
    { key: 'help', label: '帮助', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pd-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pd-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pd-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pd-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pd-stagger > * { animation: pd-fade-up 0.4s ease-out both; }
        .pd-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pd-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pd-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pd-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pd-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pd-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pd-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pd-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pd-pulse { animation: pd-pulse 2.4s ease-in-out infinite; }
        .pd-float { animation: pd-float 3s ease-in-out infinite; }
        .pd-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pd-shimmer 2.4s linear infinite; }
        .pd-drawer { animation: pd-slide-in 0.28s ease-out; }
        .pd-bar { transform-origin: bottom; animation: pd-bar 0.6s ease-out; }
        .pd-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* ============== Hero ============== */}
      <section className="relative px-6 md:px-10 pt-8 pb-6 pd-stagger" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,184,129,0.15)' }}>
                <Droplets size={20} style={{ color: BRAND.primary }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                  DeFi 流动性挖矿中心
                  <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.15)', color: BRAND.primary }}>DEMO</span>
                </h1>
                <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                  流动性池 / 收益农场 / 双币理财 / 锁仓挖矿 / 推荐奖励 / 申请上币
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs flex items-center gap-1 pd-pulse" style={{ color: BRAND.primary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                实时数据更新中
              </span>
              <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <Keyboard size={14} />快捷键
              </button>
              <button onClick={() => setTab('apply')} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <Briefcase size={14} />申请上币
              </button>
            </div>
          </div>
          <div className="text-[11px] flex items-center gap-2 flex-wrap" style={{ color: BRAND.textMuted }}>
            <Shield size={11} style={{ color: BRAND.primary }} />
            内部估算口径，仅作 UI 演示；历史收益不构成对未来收益的承诺；所有产品需通过 KYC/KYB 后方可使用。
          </div>
        </div>
      </section>

      {/* ============== KPI ============== */}
      <section className="px-6 md:px-10 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pd-stagger">
          <KpiCard label="总锁仓 TVL" value={kpi.totalTvl} prefix="$" decimals={0} icon={Droplets} sub={`24h ${kpi.tvl24hChange >= 0 ? '+' : ''}${kpi.tvl24hChange.toFixed(1)}%`} />
          <KpiCard label="24h 交易量" value={kpi.totalVolume24h} prefix="$" icon={Activity} />
          <KpiCard label="活跃产品" value={kpi.totalPools + kpi.totalFarms + kpi.totalDuals + kpi.totalLocks} icon={Boxes} />
          <KpiCard label="参与用户" value={kpi.totalParticipants} icon={Users} />
          <KpiCard label="累计奖励" value={kpi.totalRewards} prefix="$" icon={Gift} />
          <KpiCard label="最高 APR" value={kpi.maxApr} suffix="%" color={BRAND.primary} decimals={0} icon={TrendingUp} />
        </div>
      </section>

      {/* ============== Tab Bar ============== */}
      <section className="px-6 md:px-10 pb-4 sticky top-0 z-30" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(20,184,129,0.15)' : BRAND.card,
                    color: active ? BRAND.primary : BRAND.text,
                    border: `1px solid ${active ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== Content ============== */}
      <main className="px-6 md:px-10 pb-10">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && <OverviewTab kpi={kpi} onGoTab={setTab} onOpenPool={openPool} onOpenFarm={openFarm} onOpenDual={openDual} onOpenLock={openLock} />}
          {tab === 'pools' && <PoolsTab pools={filteredPools} search={search} setSearch={setSearch} searchRef={searchRef} sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} typeFilter={poolTypeFilter} setTypeFilter={setPoolTypeFilter} riskFilter={poolRiskFilter} setRiskFilter={setPoolRiskFilter} statusFilter={poolStatusFilter} setStatusFilter={setPoolStatusFilter} onOpen={openPool} onDeposit={openDeposit} />}
          {tab === 'farms' && <FarmsTab farms={filteredFarms} search={search} setSearch={setSearch} searchRef={searchRef} sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} typeFilter={farmTypeFilter} setTypeFilter={setFarmTypeFilter} statusFilter={farmStatusFilter} setStatusFilter={setFarmStatusFilter} onOpen={openFarm} onDeposit={openDeposit} />}
          {tab === 'dual' && <DualsTab duals={filteredDuals} search={search} setSearch={setSearch} searchRef={searchRef} typeFilter={dualTypeFilter} setTypeFilter={setDualTypeFilter} statusFilter={dualStatusFilter} setStatusFilter={setDualStatusFilter} onOpen={openDual} onDeposit={openDeposit} />}
          {tab === 'lock' && <LockTab locks={filteredLocks} search={search} setSearch={setSearch} searchRef={searchRef} termFilter={lockTermFilter} setTermFilter={setLockTermFilter} tokenFilter={lockTokenFilter} setTokenFilter={setLockTokenFilter} onOpen={openLock} onDeposit={openDeposit} />}
          {tab === 'referral' && <ReferralTab stats={REFERRAL_STATS} onGoTab={setTab} />}
          {tab === 'history' && <HistoryTab history={HISTORY} />}
          {tab === 'apply' && <ApplyTab applications={APPLICATIONS} onApply={() => setDrawer({ open: true, type: 'apply', payload: null })} applyStep={applyStep} setApplyStep={setApplyStep} applyType={applyType} setApplyType={setApplyType} applyCompany={applyCompany} setApplyCompany={setApplyCompany} applyContact={applyContact} setApplyContact={setApplyContact} applyEmail={applyEmail} setApplyEmail={setApplyEmail} applyTvl={applyTvl} setApplyTvl={setApplyTvl} applyDesc={applyDesc} setApplyDesc={setApplyDesc} applyRegion={applyRegion} setApplyRegion={setApplyRegion} submitApply={submitApply} />}
          {tab === 'help' && <HelpTab onClose={() => setHelpOpen(false)} />}
        </div>
      </main>

      {/* ============== Bottom CTA ============== */}
      <section className="px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Sparkles size={18} style={{ color: BRAND.primary }} />
                开始你的 DeFi 收益之旅
              </h2>
              <p className="text-sm" style={{ color: BRAND.textMuted }}>流动性挖矿 / 双币理财 / 锁仓挖矿 / 推荐奖励 / 申请上币</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setTab('pools')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}><Droplets size={14} />浏览池子</button>
              <button onClick={() => setTab('farms')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Sprout size={14} />收益农场</button>
              <button onClick={() => setTab('apply')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Briefcase size={14} />申请上币</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== Drawers ============== */}
      {drawer.open && drawer.type === 'pool' && drawer.payload && (
        <PoolDrawer pool={POOLS.find((p) => p.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'farm' && drawer.payload && (
        <FarmDrawer farm={FARMS.find((f) => f.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'dual' && drawer.payload && (
        <DualDrawer dual={DUALS.find((d) => d.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'lock' && drawer.payload && (
        <LockDrawer lock={LOCK_PRODUCTS.find((l) => l.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'deposit' && drawer.payload && (
        <DepositDrawer payload={drawer.payload} amount={depositAmount} setAmount={setDepositAmount} onClose={closeDrawer} onSubmit={submitDeposit} />
      )}
      {drawer.open && drawer.type === 'apply' && (
        <ApplyDrawer onClose={closeDrawer} applyStep={applyStep} setApplyStep={setApplyStep} applyType={applyType} setApplyType={setApplyType} applyCompany={applyCompany} setApplyCompany={setApplyCompany} applyContact={applyContact} setApplyContact={setApplyContact} applyEmail={applyEmail} setApplyEmail={setApplyEmail} applyTvl={applyTvl} setApplyTvl={setApplyTvl} applyDesc={applyDesc} setApplyDesc={setApplyDesc} applyRegion={applyRegion} setApplyRegion={setApplyRegion} submitApply={submitApply} />
      )}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

// ============== Tabs (rendered in main) ==============

function OverviewTab({ kpi, onGoTab, onOpenPool, onOpenFarm, onOpenDual, onOpenLock }: { kpi: KpiSnapshot; onGoTab: (t: Tab) => void; onOpenPool: (id: string) => void; onOpenFarm: (id: string) => void; onOpenDual: (id: string) => void; onOpenLock: (id: string) => void }) {
  return (
    <div className="space-y-6">
      {/* 实时面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Activity size={14} style={{ color: BRAND.primary }} />
              实时 TVL 分布
            </h3>
            <span className="text-[10px] flex items-center gap-1 pd-pulse" style={{ color: BRAND.primary }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
              实时
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: '流动性池', value: 824000000, color: BRAND.primary },
              { label: '收益农场', value: 184000000, color: '#FFB800' },
              { label: '双币理财', value: 124000000, color: '#FF8C00' },
              { label: '锁仓挖矿', value: 116000000, color: '#60A5FA' },
            ].map((it) => (
              <div key={it.label} className="flex items-center gap-3">
                <div className="text-xs w-20" style={{ color: BRAND.textMuted }}>{it.label}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full pd-bar" style={{ width: `${(it.value / 1248000000) * 100}%`, backgroundColor: it.color }} />
                </div>
                <div className="text-xs font-mono w-20 text-right" style={{ color: BRAND.text }}>${formatTvl(it.value)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <TrendingUp size={14} style={{ color: BRAND.primary }} />
              实时 APR 排行 Top 4
            </h3>
            <span className="text-[10px] flex items-center gap-1 pd-pulse" style={{ color: BRAND.primary }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
              实时
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'ZSD 365 天锁仓', apr: 91.0, change: 0 },
              { label: 'ZSDX 杠杆挖矿 3x', apr: 73.0, change: 1.2 },
              { label: 'ZSD 180 天锁仓', apr: 71.0, change: 0.4 },
              { label: 'SOL/USDC V3 池', apr: 71.0, change: -0.8 },
            ].map((it, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg pd-row" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-4" style={{ color: BRAND.textMuted }}>#{i + 1}</span>
                  <span className="text-sm" style={{ color: BRAND.text }}>{it.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND.primary }}>{it.apr.toFixed(1)}%</span>
                  <span className="text-[10px] flex items-center" style={{ color: it.change >= 0 ? BRAND.primary : '#FF4C4C' }}>
                    {it.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                    {Math.abs(it.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 顶级池子 + 顶级农场 + 顶级双币 + 顶级锁仓 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Droplets size={14} style={{ color: BRAND.primary }} />
              热门流动性池
            </h3>
            <button onClick={() => onGoTab('pools')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 pd-stagger">
            {POOLS.slice(0, 3).map((p) => {
              const risk = riskLabel(p.risk);
              return (
                <div key={p.id} className="p-3 rounded-lg pd-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => onOpenPool(p.id)}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.symbol}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: BRAND.primary }}>{p.aprTotal.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                    <span>{poolTypeLabel(p.type)} · TVL ${formatTvl(p.tvl)} · {p.participants.toLocaleString()} 人</span>
                    <span style={{ color: risk.color }}>{risk.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Sprout size={14} style={{ color: BRAND.primary }} />
              热门收益农场
            </h3>
            <button onClick={() => onGoTab('farms')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 pd-stagger">
            {FARMS.slice(0, 3).map((f) => (
              <div key={f.id} className="p-3 rounded-lg pd-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => onOpenFarm(f.id)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{f.name}</span>
                    <StatusBadge status={f.status} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: BRAND.primary }}>{f.aprTotal.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>{f.stakeToken} → {f.earnTokens.join(' + ')}</span>
                  <span>TVL ${formatTvl(f.tvl)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Coins size={14} style={{ color: BRAND.primary }} />
              热门双币理财
            </h3>
            <button onClick={() => onGoTab('dual')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 pd-stagger">
            {DUALS.slice(0, 3).map((d) => (
              <div key={d.id} className="p-3 rounded-lg pd-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => onOpenDual(d.id)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{d.name}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: BRAND.primary }}>{d.apyHigh.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>区间 {d.strikeLow} - {d.strikeHigh} · {d.duration} 天</span>
                  <span>已申购 ${formatTvl(d.totalSubscribed)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Lock size={14} style={{ color: BRAND.primary }} />
              热门锁仓挖矿
            </h3>
            <button onClick={() => onGoTab('lock')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2 pd-stagger">
            {LOCK_PRODUCTS.slice(0, 3).map((l) => (
              <div key={l.id} className="p-3 rounded-lg pd-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => onOpenLock(l.id)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{l.name}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: BRAND.primary }}>{l.aprTotal.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                  <span>{l.term} 天 · {l.token}</span>
                  <span>剩余额度 ${formatTvl(l.totalQuota - l.subscribed)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 安全与合规 */}
      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <ShieldCheck size={14} style={{ color: BRAND.primary }} />
          安全 · 合规 · 审计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]" style={{ color: BRAND.textMuted }}>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>智能合约审计</div>
            <div>CertiK · SlowMist · PeckShield · Quantstamp</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>风险监测</div>
            <div>实时链上监控 · 异常自动熔断</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>资金透明度</div>
            <div>所有资金链上可查 · 储备金证明</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>合规要求</div>
            <div>KYC / KYB 强制 · 合格投资者认证</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sprout(props: any) { return <Boxes {...props} />; }

function PoolsTab({ pools, search, setSearch, searchRef, sortBy, setSortBy, sortDir, setSortDir, typeFilter, setTypeFilter, riskFilter, setRiskFilter, statusFilter, setStatusFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-1 flex-1 min-w-[200px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
          <Search size={14} style={{ color: BRAND.textMuted }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索池子 / 标签 / 链" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部类型</option>
          <option value="v2">V2</option>
          <option value="v3">V3 集中流动性</option>
          <option value="stable">稳定币池</option>
          <option value="single">单币池</option>
          <option value="index">指数池</option>
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部风险</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
          <option value="extreme">极高风险</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部状态</option>
          <option value="live">运行中</option>
          <option value="new">新上线</option>
          <option value="boosted">Boost</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="tvl">TVL</option>
          <option value="apr">APR</option>
          <option value="participants">参与人数</option>
          <option value="updated">更新时间</option>
        </select>
        <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded" style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
          {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pd-stagger">
        {pools.map((p: Pool) => {
          const risk = riskLabel(p.risk);
          return (
            <div key={p.id} className="p-4 rounded-xl cursor-pointer pd-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => onOpen(p.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold" style={{ color: BRAND.text }}>{p.symbol}</span>
                  <StatusBadge status={p.status} />
                </div>
                <span className="text-lg font-semibold" style={{ color: BRAND.primary }}>{p.aprTotal.toFixed(1)}%</span>
              </div>
              <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{p.name}</div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
                <div>
                  <div style={{ color: BRAND.textMuted }}>TVL</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>${formatTvl(p.tvl)}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>24h 量</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>${formatTvl(p.volume24h)}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>参与</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{p.participants.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3 text-[10px]">
                <span style={{ color: BRAND.textMuted }}>{p.chain} · {poolTypeLabel(p.type)}</span>
                <span style={{ color: risk.color }}>{risk.label}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full pd-bar" style={{ width: `${(p.tvl / p.capacity) * 100}%`, backgroundColor: BRAND.primary }} />
                </div>
                <span className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{((p.tvl / p.capacity) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap mb-3">
                {p.tags.slice(0, 3).map((t: string) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{t}</span>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDeposit(p.id); }}
                className="w-full py-1.5 rounded text-xs font-medium transition-all hover:scale-[1.02]"
                style={{ backgroundColor: BRAND.primary, color: '#000' }}
              >
                立即申购
              </button>
            </div>
          );
        })}
      </div>
      {pools.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: BRAND.textMuted }}>暂无匹配的池子</div>
      )}
    </div>
  );
}

function FarmsTab({ farms, search, setSearch, searchRef, sortBy, setSortBy, sortDir, setSortDir, typeFilter, setTypeFilter, statusFilter, setStatusFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-1 flex-1 min-w-[200px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
          <Search size={14} style={{ color: BRAND.textMuted }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索农场 / 币种" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部类型</option>
          <option value="single">单币挖矿</option>
          <option value="lp">LP 挖矿</option>
          <option value="vault">机枪池</option>
          <option value="leveraged">杠杆挖矿</option>
          <option value="auto">自动复投</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部状态</option>
          <option value="live">运行中</option>
          <option value="new">新上线</option>
          <option value="boosted">Boost</option>
        </select>
        <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded" style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
          {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pd-stagger">
        {farms.map((f: Farm) => (
          <div key={f.id} className="p-4 rounded-xl cursor-pointer pd-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => onOpen(f.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold" style={{ color: BRAND.text }}>{f.name}</span>
                <StatusBadge status={f.status} />
              </div>
              <span className="text-lg font-semibold" style={{ color: BRAND.primary }}>{f.aprTotal.toFixed(1)}%</span>
            </div>
            <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{f.description}</div>
            <div className="grid grid-cols-4 gap-2 mb-3 text-[10px]">
              <div>
                <div style={{ color: BRAND.textMuted }}>TVL</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>${formatTvl(f.tvl)}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>参与</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{f.participants.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>锁仓</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{f.lockup === 0 ? '灵活' : `${f.lockup} 天`}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>Boost</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{f.multiplier}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {f.tags.map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{t}</span>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeposit(f.id); }}
              className="w-full py-1.5 rounded text-xs font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即申购
            </button>
          </div>
        ))}
      </div>
      {farms.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: BRAND.textMuted }}>暂无匹配的农场</div>
      )}
    </div>
  );
}

function DualsTab({ duals, search, setSearch, searchRef, typeFilter, setTypeFilter, statusFilter, setStatusFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-1 flex-1 min-w-[200px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
          <Search size={14} style={{ color: BRAND.textMuted }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索双币 / 标的" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部结构</option>
          <option value="range">区间</option>
          <option value="snowball">雪球</option>
          <option value="sharkfin">鲨鱼鳍</option>
          <option value="butterfly">蝶式</option>
          <option value="ladder">阶梯</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部状态</option>
          <option value="live">运行中</option>
          <option value="upcoming">即将开放</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pd-stagger">
        {duals.map((d: Dual) => (
          <div key={d.id} className="p-4 rounded-xl cursor-pointer pd-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => onOpen(d.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold" style={{ color: BRAND.text }}>{d.name}</span>
                <StatusBadge status={d.status} />
              </div>
              <span className="text-lg font-semibold" style={{ color: BRAND.primary }}>{d.apyHigh.toFixed(1)}%</span>
            </div>
            <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{d.description}</div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
              <div>
                <div style={{ color: BRAND.textMuted }}>标的</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{d.underlying}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>区间</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{d.strikeLow} - {d.strikeHigh}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>期限</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{d.duration} 天</div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {d.tags.map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{t}</span>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeposit(d.id); }}
              className="w-full py-1.5 rounded text-xs font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即申购
            </button>
          </div>
        ))}
      </div>
      {duals.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: BRAND.textMuted }}>暂无匹配的双币产品</div>
      )}
    </div>
  );
}

function LockTab({ locks, search, setSearch, searchRef, termFilter, setTermFilter, tokenFilter, setTokenFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-1 flex-1 min-w-[200px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
          <Search size={14} style={{ color: BRAND.textMuted }} />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索锁仓 / 币种" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
        </div>
        <select value={termFilter} onChange={(e) => setTermFilter(e.target.value as any)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部期限</option>
          <option value={7}>7 天</option>
          <option value={14}>14 天</option>
          <option value={30}>30 天</option>
          <option value={90}>90 天</option>
          <option value={180}>180 天</option>
          <option value={365}>365 天</option>
        </select>
        <select value={tokenFilter} onChange={(e) => setTokenFilter(e.target.value)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="all">全部币种</option>
          <option value="ZSD">ZSD</option>
          <option value="ZSDEX">ZSDEX</option>
          <option value="USDT">USDT</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pd-stagger">
        {locks.map((l: LockProduct) => (
          <div key={l.id} className="p-4 rounded-xl cursor-pointer pd-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => onOpen(l.id)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold" style={{ color: BRAND.text }}>{l.name}</span>
                <StatusBadge status={l.status} />
              </div>
              <span className="text-lg font-semibold" style={{ color: BRAND.primary }}>{l.aprTotal.toFixed(1)}%</span>
            </div>
            <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{l.description}</div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
              <div>
                <div style={{ color: BRAND.textMuted }}>期限</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{l.term} 天</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>参与</div>
                <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{l.participants.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>提前赎回</div>
                <div className="font-mono font-semibold" style={{ color: l.earlyRedeem ? BRAND.text : BRAND.textMuted }}>{l.earlyRedeem ? `罚息 ${l.earlyPenalty}%` : '不允许'}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {l.tags.map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{t}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                <div className="h-full pd-bar" style={{ width: `${(l.subscribed / l.totalQuota) * 100}%`, backgroundColor: BRAND.primary }} />
              </div>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{((l.subscribed / l.totalQuota) * 100).toFixed(0)}% 已认购</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeposit(l.id); }}
              className="w-full py-1.5 rounded text-xs font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即申购
            </button>
          </div>
        ))}
      </div>
      {locks.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: BRAND.textMuted }}>暂无匹配的锁仓产品</div>
      )}
    </div>
  );
}

function ReferralTab({ stats, onGoTab }: { stats: ReferralStat[]; onGoTab: (t: Tab) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <UserPlus size={14} style={{ color: BRAND.primary }} />
          推荐奖励计划
        </h3>
        <div className="text-[11px] mb-4" style={{ color: BRAND.textMuted }}>
          邀请好友参与 DeFi 产品，三级分销返佣；返佣以 USDT 等值结算，按日发放。
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pd-stagger">
          {stats.map((s) => (
            <div key={s.level} className="p-4 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: BRAND.textMuted }}>{s.name} 返佣</span>
                <span className="text-lg font-semibold" style={{ color: BRAND.primary }}>{s.ratio}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <div style={{ color: BRAND.textMuted }}>用户数</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>{s.count.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>流水</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>${formatTvl(s.volume)}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>已返佣</div>
                  <div className="font-mono font-semibold" style={{ color: BRAND.text }}>${formatTvl(s.commission)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <LinkIcon size={14} style={{ color: BRAND.primary }} />
          我的推荐链接
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input value="https://zsdex.com/defi?ref=USR-8A2F-9C4E" readOnly className="flex-1 px-3 py-2 rounded text-sm font-mono outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          <button className="px-3 py-2 rounded text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}><CopyIcon size={14} />复制</button>
        </div>
        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>
          扫码邀请：推荐链接 / 二维码 / 海报均可分享，30 天归因窗口
        </div>
      </div>

      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <BarChart3 size={14} style={{ color: BRAND.primary }} />
          返佣规则
        </h3>
        <div className="text-[11px] space-y-1.5" style={{ color: BRAND.textMuted }}>
          <div>· 一级（直接邀请）：返佣比例 20%，按被邀请人收益计算</div>
          <div>· 二级：返佣比例 8%，按被邀请人的下级收益计算</div>
          <div>· 三级：返佣比例 3%，按被邀请人的下二级收益计算</div>
          <div>· 返佣以 USDT 等值结算，每日 10:00 发放至现货账户</div>
          <div>· 合格用户（KYC 高级）方可发起提现，未达 KYC 等级不可提现</div>
        </div>
      </div>
    </div>
  );
}

function LinkIcon(props: any) { return <Hash {...props} />; }

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <Clock size={14} style={{ color: BRAND.primary }} />
          我的 DeFi 收益历史
        </h3>
        <div className="space-y-2 pd-stagger">
          {history.map((h) => (
            <div key={h.id} className="p-3 rounded-lg pd-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{h.product}</span>
                  <StatusBadge status={h.status} />
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: BRAND.primary }}>+{h.reward.toLocaleString()} {h.rewardToken}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>年化 {h.apy.toFixed(1)}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
                <span>本金 {h.principal > 0 ? `${h.principal.toLocaleString()} USDT` : '推荐返佣'} · {h.startAt} → {h.endAt}</span>
                <span className="font-mono">{h.txHash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplyTab({ applications, onApply, applyStep, setApplyStep, applyType, setApplyType, applyCompany, setApplyCompany, applyContact, setApplyContact, applyEmail, setApplyEmail, applyTvl, setApplyTvl, applyDesc, setApplyDesc, applyRegion, setApplyRegion, submitApply }: any) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Briefcase size={14} style={{ color: BRAND.primary }} />
            申请上币 / 入驻 DeFi
          </h3>
          <button onClick={onApply} className="px-3 py-1.5 rounded text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
            <Plus size={14} />新建申请
          </button>
        </div>
        <div className="text-[11px] mb-4" style={{ color: BRAND.textMuted }}>
          申请项目方 / 流动性池 / 农场 / 战略合作 / 审计合作。所有申请经过 KYC/KYB + 智能合约审计后方可上线。
        </div>
        <div className="space-y-2 pd-stagger">
          {applications.map((a: Application) => (
            <div key={a.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.company}</span>
                  <StatusBadge status={a.stage} />
                </div>
                <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.submittedAt}</span>
              </div>
              <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{a.description}</div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textMuted }}>
                <span>类型：{a.type}</span>
                <span>地区：{a.region}</span>
                <span>对接：{a.reviewer}</span>
                {a.expectedTvl > 0 && <span>预期 TVL：${formatTvl(a.expectedTvl)}</span>}
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.card }}>
                <div className="h-full pd-bar" style={{ width: `${a.progress}%`, backgroundColor: BRAND.primary }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpTab({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <HelpCircle size={14} style={{ color: BRAND.primary }} />
          快捷键与帮助
        </h3>
        <div className="space-y-2">
          {[
            { k: '/', d: '聚焦搜索框' },
            { k: 'Esc', d: '关闭 Drawer / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab（总览→帮助）' },
          ].map((it) => (
            <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
              <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <BookOpen size={14} style={{ color: BRAND.primary }} />
          常见问题
        </h3>
        <div className="space-y-3 text-[11px]">
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>Q1：流动性池的 APR 是固定的吗？</div>
            <div style={{ color: BRAND.textMuted }}>A：基础 APR 来自交易手续费分成，随交易量波动；奖励 APR 来自平台币释放，按计划随时间递减。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>Q2：双币理财的"本金保护"是什么意思？</div>
            <div style={{ color: BRAND.textMuted }}>A：到期以 USDT 现金结算本金，收益视价格区间/结构而定；区间外仍以 USDT 返还本金，但收益可能为 0 或较低。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>Q3：锁仓产品能否提前赎回？</div>
            <div style={{ color: BRAND.textMuted }}>A：取决于产品条款；标"允许提前赎回"的产品需支付 20-70% 罚息，标"不允许"的产品到期前不可赎回。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>Q4：智能合约风险如何控制？</div>
            <div style={{ color: BRAND.textMuted }}>A：所有产品通过 CertiK / SlowMist / PeckShield 等独立审计，链上监控 7×24 小时，异常自动熔断。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>Q5：是否有最低申购门槛？</div>
            <div style={{ color: BRAND.textMuted }}>A：不同产品门槛不同，普遍在 100-1000 USDT 区间，详见各产品详情页。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Drawers ==============

function PoolDrawer({ pool, onClose, onDeposit }: { pool: Pool; onClose: () => void; onDeposit: () => void }) {
  const risk = riskLabel(pool.risk);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              {pool.symbol}
              <StatusBadge status={pool.status} />
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{pool.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 pd-stagger">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总 APR</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.primary }}>{pool.aprTotal.toFixed(1)}%</div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>基础 {pool.aprBase.toFixed(1)}% + 奖励 {pool.aprReward.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>TVL</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>${formatTvl(pool.tvl)}</div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{((pool.tvl / pool.capacity) * 100).toFixed(0)}% / 100%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h 量</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>${formatTvl(pool.volume24h)}</div>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>手续费 ${formatTvl(pool.fees24h)}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>代币组成</div>
            <div className="space-y-1.5">
              {pool.tokens.map((t) => (
                <div key={t.symbol} className="flex items-center justify-between text-xs">
                  <span style={{ color: BRAND.text }}>{t.symbol} · 权重 {t.weight}%</span>
                  <span className="font-mono" style={{ color: BRAND.textMuted }}>{t.amount.toLocaleString()} (${(t.amount * t.price).toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>奖励代币</div>
            <div className="space-y-1.5">
              {pool.rewards.map((r) => (
                <div key={r.token} className="flex items-center justify-between text-xs">
                  <span style={{ color: BRAND.text }}>{r.token}</span>
                  <span className="font-mono" style={{ color: BRAND.primary }}>{r.apr.toFixed(1)}% · {r.perDay.toLocaleString()}/天</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>核心亮点</div>
            <div className="space-y-1">
              {pool.highlights.map((h) => <div key={h} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />{h}</div>)}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>风险提示</div>
            <div className="space-y-1">
              {pool.risks.map((r) => <div key={r} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><AlertTriangle size={11} style={{ color: '#FFB800', marginTop: 2 }} />{r}</div>)}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>审计 / 链 / 参数</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>链：</span><span style={{ color: BRAND.text }}>{pool.chain}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>费率：</span><span style={{ color: BRAND.text }}>{pool.feeTier}%</span></div>
              <div><span style={{ color: BRAND.textMuted }}>7d APR：</span><span style={{ color: BRAND.text }}>{pool.apr7d.toFixed(1)}%</span></div>
              <div><span style={{ color: BRAND.textMuted }}>30d APR：</span><span style={{ color: BRAND.text }}>{pool.apr30d.toFixed(1)}%</span></div>
              <div className="col-span-2"><span style={{ color: BRAND.textMuted }}>审计：</span><span style={{ color: BRAND.text }}>{pool.audit.join(' / ')}</span></div>
              <div className="col-span-2"><span style={{ color: BRAND.textMuted }}>参与：</span><span style={{ color: BRAND.text }}>{pool.participants.toLocaleString()} 人</span></div>
            </div>
          </div>

          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即申购</button>
        </div>
      </div>
    </div>
  );
}

function FarmDrawer({ farm, onClose, onDeposit }: { farm: Farm; onClose: () => void; onDeposit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              {farm.name}
              <StatusBadge status={farm.status} />
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{farm.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 pd-stagger">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总 APR</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.primary }}>{farm.aprTotal.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>TVL</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>${formatTvl(farm.tvl)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>Boost</div>
              <div className="text-base font-semibold" style={{ color: BRAND.text }}>{farm.multiplier}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>质押 / 收益</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>质押：</span><span style={{ color: BRAND.text }}>{farm.stakeToken}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>收益：</span><span style={{ color: BRAND.text }}>{farm.earnTokens.join(' + ')}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>锁仓：</span><span style={{ color: BRAND.text }}>{farm.lockup === 0 ? '灵活存取' : `${farm.lockup} 天`}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>收获：</span><span style={{ color: BRAND.text }}>{farm.harvestEvery}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>链：</span><span style={{ color: BRAND.text }}>{farm.chain}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>参与：</span><span style={{ color: BRAND.text }}>{farm.participants.toLocaleString()} 人</span></div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>奖励分布</div>
            <div className="space-y-1.5">
              {farm.rewards.map((r) => (
                <div key={r.token} className="flex items-center justify-between text-xs">
                  <span style={{ color: BRAND.text }}>{r.token}</span>
                  <span className="font-mono" style={{ color: BRAND.primary }}>{r.apr.toFixed(1)}% · {r.perDay.toLocaleString()}/天</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>亮点 / 风险</div>
            <div className="space-y-1">
              {farm.highlights.map((h) => <div key={h} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />{h}</div>)}
              {farm.risks.map((r) => <div key={r} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><AlertTriangle size={11} style={{ color: '#FFB800', marginTop: 2 }} />{r}</div>)}
            </div>
          </div>

          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即申购</button>
        </div>
      </div>
    </div>
  );
}

function DualDrawer({ dual, onClose, onDeposit }: { dual: Dual; onClose: () => void; onDeposit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              {dual.name}
              <StatusBadge status={dual.status} />
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{dual.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 pd-stagger">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>区间年化</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.primary }}>{dual.apyHigh.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>基础年化</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{dual.apyBase.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>期限</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{dual.duration} 天</div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>执行价 / 标的</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>标的：</span><span style={{ color: BRAND.text }}>{dual.underlying}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>结算：</span><span style={{ color: BRAND.text }}>{dual.quote}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>执行价下限：</span><span style={{ color: BRAND.text }}>{dual.strikeLow}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>执行价上限：</span><span style={{ color: BRAND.text }}>{dual.strikeHigh}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>现价：</span><span style={{ color: BRAND.text }}>{dual.spot}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>票息：</span><span style={{ color: BRAND.text }}>{dual.coupon}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>本金保护：</span><span style={{ color: dual.principalProtection ? BRAND.primary : BRAND.textMuted }}>{dual.principalProtection ? '是' : '否'}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>结算方式：</span><span style={{ color: BRAND.text }}>{dual.settlement}</span></div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>情景分析</div>
            <div className="space-y-1.5">
              {dual.scenarios.map((s, i) => (
                <div key={i} className="p-2 rounded text-[11px]" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: BRAND.text }}>{s.condition}</span>
                    <span className="font-mono" style={{ color: s.apy >= 0 ? BRAND.primary : '#FF4C4C' }}>{s.apy >= 0 ? '+' : ''}{s.apy.toFixed(1)}%</span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>每万本金结算：${s.payout.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>申购参数</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>最低：</span><span style={{ color: BRAND.text }}>${dual.minSubscription.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>最高：</span><span style={{ color: BRAND.text }}>${dual.maxSubscription.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>已申购：</span><span style={{ color: BRAND.text }}>${formatTvl(dual.totalSubscribed)}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>参与：</span><span style={{ color: BRAND.text }}>{dual.participants.toLocaleString()} 人</span></div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>亮点 / 风险</div>
            <div className="space-y-1">
              {dual.highlights.map((h) => <div key={h} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />{h}</div>)}
              {dual.risks.map((r) => <div key={r} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><AlertTriangle size={11} style={{ color: '#FFB800', marginTop: 2 }} />{r}</div>)}
            </div>
          </div>

          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即申购</button>
        </div>
      </div>
    </div>
  );
}

function LockDrawer({ lock, onClose, onDeposit }: { lock: LockProduct; onClose: () => void; onDeposit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              {lock.name}
              <StatusBadge status={lock.status} />
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{lock.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 pd-stagger">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总 APR</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.primary }}>{lock.aprTotal.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>期限</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{lock.term} 天</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>已认购</div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{((lock.subscribed / lock.totalQuota) * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>申购参数</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>币种：</span><span style={{ color: BRAND.text }}>{lock.token}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>最低：</span><span style={{ color: BRAND.text }}>{lock.minAmount.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>最高：</span><span style={{ color: BRAND.text }}>{lock.maxAmount.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>已认购：</span><span style={{ color: BRAND.text }}>{lock.subscribed.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>总配额：</span><span style={{ color: BRAND.text }}>{lock.totalQuota.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>参与：</span><span style={{ color: BRAND.text }}>{lock.participants.toLocaleString()} 人</span></div>
              <div><span style={{ color: BRAND.textMuted }}>提前赎回：</span><span style={{ color: lock.earlyRedeem ? BRAND.text : BRAND.textMuted }}>{lock.earlyRedeem ? `罚息 ${lock.earlyPenalty}%` : '不允许'}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>自动续期：</span><span style={{ color: lock.autoRenew ? BRAND.primary : BRAND.textMuted }}>{lock.autoRenew ? '支持' : '不支持'}</span></div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>奖励分布</div>
            <div className="space-y-1.5">
              {lock.rewards.map((r) => (
                <div key={r.token} className="flex items-center justify-between text-xs">
                  <span style={{ color: BRAND.text }}>{r.token}</span>
                  <span className="font-mono" style={{ color: BRAND.primary }}>{r.apr.toFixed(1)}% · {r.perDay.toLocaleString()}/天</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>亮点 / 风险</div>
            <div className="space-y-1">
              {lock.highlights.map((h) => <div key={h} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />{h}</div>)}
              {lock.risks.map((r) => <div key={r} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><AlertTriangle size={11} style={{ color: '#FFB800', marginTop: 2 }} />{r}</div>)}
            </div>
          </div>

          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即申购</button>
        </div>
      </div>
    </div>
  );
}

function DepositDrawer({ payload, amount, setAmount, onClose, onSubmit }: { payload: string; amount: string; setAmount: (v: string) => void; onClose: () => void; onSubmit: () => void }) {
  const pool = POOLS.find((p) => p.id === payload);
  const farm = FARMS.find((f) => f.id === payload);
  const dual = DUALS.find((d) => d.id === payload);
  const lock = LOCK_PRODUCTS.find((l) => l.id === payload);
  const item = pool || farm || dual || lock;
  const name = pool?.symbol || farm?.name || dual?.name || lock?.name || '产品';
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>申购 {name}</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>申购数量 (USDT 等值)</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="w-full bg-transparent text-2xl font-semibold outline-none" style={{ color: BRAND.text }} />
            <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
              <span>账户余额 12,480.00 USDT</span>
              <button className="px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>MAX</button>
            </div>
          </div>

          {item && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>预期收益</div>
              <div className="space-y-1 text-[11px]">
                {pool && <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>总 APR</span><span style={{ color: BRAND.primary }}>{pool.aprTotal.toFixed(1)}%</span></div>}
                {farm && <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>总 APR</span><span style={{ color: BRAND.primary }}>{farm.aprTotal.toFixed(1)}%</span></div>}
                {dual && <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>区间年化</span><span style={{ color: BRAND.primary }}>{dual.apyHigh.toFixed(1)}%</span></div>}
                {lock && <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>总 APR</span><span style={{ color: BRAND.primary }}>{lock.aprTotal.toFixed(1)}%</span></div>}
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>预计年化收益（基于输入金额）</span><span style={{ color: BRAND.text }} className="font-mono">
                  {amount && !isNaN(Number(amount)) ? `${(Number(amount) * ((pool?.aprTotal || farm?.aprTotal || dual?.apyHigh || lock?.aprTotal || 0) / 100)).toFixed(2)} USDT` : '0.00 USDT'}
                </span></div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg text-[10px] space-y-1" style={{ backgroundColor: 'rgba(255,184,0,0.05)', border: `1px solid rgba(255,184,0,0.2)`, color: '#FFB800' }}>
            <div className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={11} />风险提示</div>
            <div>· DeFi 收益为内部估算口径，不构成对未来收益的承诺</div>
            <div>· 智能合约风险、市场波动、无常损失、提前赎回罚息等均可能影响最终收益</div>
            <div>· 请确认已完成 KYC 高级认证</div>
          </div>

          <button onClick={onSubmit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认申购</button>
        </div>
      </div>
    </div>
  );
}

function ApplyDrawer({ onClose, applyStep, setApplyStep, applyType, setApplyType, applyCompany, setApplyCompany, applyContact, setApplyContact, applyEmail, setApplyEmail, applyTvl, setApplyTvl, applyDesc, setApplyDesc, applyRegion, setApplyRegion, submitApply }: any) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>申请上币 / 入驻 DeFi</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            {['选择类型', '基本信息', '项目详情', '提交'].map((s, i) => (
              <div key={i} className="flex-1 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: i <= applyStep ? BRAND.primary : BRAND.card, color: i <= applyStep ? '#000' : BRAND.textMuted, border: `1px solid ${i <= applyStep ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                <span className="text-[10px]" style={{ color: i <= applyStep ? BRAND.text : BRAND.textMuted }}>{s}</span>
                {i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < applyStep ? BRAND.primary : BRAND.border }} />}
              </div>
            ))}
          </div>

          {applyStep === 0 && (
            <div className="space-y-2 pd-stagger">
              {[
                { key: 'project', label: '项目方申请', icon: Boxes, desc: '项目方整体申请上币' },
                { key: 'pool', label: '流动性池', icon: Droplets, desc: '申请上线特定流动性池' },
                { key: 'farm', label: '收益农场', icon: Sprout, desc: '申请上线挖矿产品' },
                { key: 'partner', label: '战略合作', icon: Handshake, desc: '申请成为战略合作伙伴' },
                { key: 'audit', label: '审计合作', icon: ShieldCheck, desc: '申请成为审计合作方' },
              ].map((it) => {
                const Icon = it.icon;
                const active = applyType === it.key;
                return (
                  <div key={it.key} onClick={() => setApplyType(it.key as ApplyType)} className="p-3 rounded-lg cursor-pointer pd-row" style={{ backgroundColor: active ? 'rgba(20,184,129,0.10)' : BRAND.card, border: `1px solid ${active ? BRAND.primary : BRAND.border}` }}>
                    <div className="flex items-center gap-3">
                      <Icon size={18} style={{ color: active ? BRAND.primary : BRAND.textMuted }} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{it.label}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{it.desc}</div>
                      </div>
                      {active && <CheckCircle2 size={16} style={{ color: BRAND.primary }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {applyStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>公司名称 *</label>
                <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="例：AlphaDAO Labs" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: BRAND.textMuted }}>联系人 *</label>
                  <input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} placeholder="姓名 / 职位" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <div>
                  <label className="text-xs" style={{ color: BRAND.textMuted }}>邮箱 *</label>
                  <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} placeholder="contact@example.com" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>地区</label>
                <select value={applyRegion} onChange={(e) => setApplyRegion(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option>亚太</option>
                  <option>欧洲</option>
                  <option>北美</option>
                  <option>中东</option>
                  <option>南美</option>
                  <option>非洲</option>
                </select>
              </div>
            </div>
          )}

          {applyStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>预期 TVL（USDT 等值）</label>
                <input value={applyTvl} onChange={(e) => setApplyTvl(e.target.value)} placeholder="例：50000000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>项目描述</label>
                <textarea value={applyDesc} onChange={(e) => setApplyDesc(e.target.value)} rows={6} placeholder="详细介绍项目背景、团队、技术方案、运营计划、合规情况等" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
            </div>
          )}

          {applyStep === 3 && (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <CheckCircle2 size={48} style={{ color: BRAND.primary, margin: '0 auto' }} className="pd-float" />
              <h4 className="text-base font-semibold mt-3" style={{ color: BRAND.text }}>确认提交</h4>
              <p className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>请确认以下申请信息无误</p>
              <div className="mt-4 text-left space-y-1 text-[11px]">
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>类型：</span><span style={{ color: BRAND.text }}>{applyType}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>公司：</span><span style={{ color: BRAND.text }}>{applyCompany || '-'}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>联系人：</span><span style={{ color: BRAND.text }}>{applyContact || '-'}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>邮箱：</span><span style={{ color: BRAND.text }}>{applyEmail || '-'}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>地区：</span><span style={{ color: BRAND.text }}>{applyRegion}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>预期 TVL：</span><span style={{ color: BRAND.text }}>{applyTvl || '-'}</span></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {applyStep > 0 && (
              <button onClick={() => setApplyStep(applyStep - 1)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>
            )}
            <button onClick={submitApply} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>{applyStep < 3 ? '下一步' : '提交申请'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {[
            { k: '/', d: '聚焦搜索框' },
            { k: 'Esc', d: '关闭 Drawer / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab' },
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
