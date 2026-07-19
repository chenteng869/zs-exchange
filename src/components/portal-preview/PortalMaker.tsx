'use client';

/**
 * PortalMaker - 做市商与流动性中心（2026-07-19 Q05 P3.25）
 *
 * 页面定位：
 * - 中萨数字科技交易所 做市商与流动性中心
 * - 做市商列表 / 流动性池 / 报价深度 / 流动性挖矿 / 跟单做市 / 费率体系 / 申请入驻
 * - 与 P3.17 API / P3.18 Launch / P3.24 生态 形成"做市-API-发行-生态-流动性"五方协同闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 做市商排行 / 流动性池 / 报价深度 / 流动性挖矿 / 跟单做市 / 费率体系 / 申请入驻 / 帮助
 * - 9+ 交互：Tab 切换 / 做市商搜索 / 等级过滤 / 池类型过滤 / 风险过滤 / 报价深度切换 / 挖矿计算器 / 申请向导 / 快捷键
 * - 7+ Drawer：做市商详情 / 流动性池详情 / 报价深度详情 / 挖矿计划详情 / 跟单策略详情 / 申请入驻向导 / 帮助
 * - 4+ 实时数据：报价深度 / 流动性 TVL / 挖矿 APR / 在线做市商数
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 所有做市商 / 流动性池 / 报价 / 费率 / 申请使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 做市商激励、APR、奖励数据为演示用途，不代表真实收益
 * - 严格规避高风险合规表述，明确"合规研究方向"定性
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
  Layers,
  Network,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  HandCoins,
  Coins,
  Wallet,
  CircleDollarSign,
  Award,
  Trophy,
  Crown,
  Medal,
  Star,
  Sparkles,
  Flame,
  Zap,
  Rocket,
  Calendar,
  Clock,
  MapPin,
  Compass,
  Flag,
  Target,
  Crosshair,
  Megaphone,
  Radio,
  Mic,
  Video,
  PlayCircle,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Heart,
  ThumbsUp,
  Bookmark,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Keyboard,
  Settings,
  Sliders,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Hash,
  Link2,
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe2,
  Database,
  Server,
  Cloud,
  Cpu,
  Code2,
  Terminal,
  Workflow,
  GitBranch,
  GitCommit,
  Boxes,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'makers' | 'pools' | 'depth' | 'mining' | 'copy' | 'fees' | 'apply' | 'help';
type MakerLevel = 'platinum' | 'gold' | 'silver' | 'bronze' | 'community';
type MakerType = 'institution' | 'prop' | 'hft' | 'algo' | 'community';
type MakerStatus = 'active' | 'review' | 'paused' | 'suspended' | 'invited';
type PoolType = 'amm' | 'orderbook' | 'clob' | 'rfq' | 'stable' | 'perpetual';
type PoolRisk = 'low' | 'medium' | 'high' | 'very-high';
type ApplyStage = 'submitted' | 'review' | 'kyb' | 'tech-test' | 'contract' | 'live' | 'rejected';
type DrawerType =
  | 'maker'
  | 'pool'
  | 'depth'
  | 'mining'
  | 'copy'
  | 'apply'
  | 'help'
  | null;

interface Maker {
  id: string;
  name: string;
  level: MakerLevel;
  type: MakerType;
  status: MakerStatus;
  region: string;
  country: string;
  joinedAt: string;
  pairs: number;
  dailyVolume: number;
  makerShare: number;
  uptime: number;
  spread: number;
  rebate: number;
  aum: number;
  rating: number;
  followers: number;
  description: string;
  strategy: string;
  highlights: string[];
  contacts: string;
  website: string;
  audit: string;
  compliance: string[];
  feeTier: number;
}

interface LiquidityPool {
  id: string;
  pair: string;
  type: PoolType;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  aprBase: number;
  aprReward: number;
  risk: PoolRisk;
  utilization: number;
  reserves: { base: number; quote: number };
  baseSymbol: string;
  quoteSymbol: string;
  lpToken: string;
  rewards: string[];
  audit: string;
  description: string;
  capacity: number;
  incentivized: boolean;
  lockupDays: number;
  impermanentRisk: 'low' | 'medium' | 'high';
}

interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
  maker: string;
  count: number;
}

interface OrderbookSnapshot {
  pair: string;
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread: number;
  midPrice: number;
  depth2pct: number;
}

interface MiningProgram {
  id: string;
  name: string;
  pool: string;
  totalReward: number;
  remainingReward: number;
  token: string;
  apr: number;
  duration: string;
  status: 'live' | 'upcoming' | 'ended';
  participants: number;
  minStake: number;
  cap: number;
  description: string;
  vestingDays: number;
  multiplier: number;
  earlyBonus: number;
}

interface CopyStrategy {
  id: string;
  maker: string;
  strategyName: string;
  pairs: string[];
  followers: number;
  aum: number;
  pnl30d: number;
  pnl90d: number;
  maxDrawdown: number;
  sharpe: number;
  feeShare: number; // % to followers
  risk: 'low' | 'medium' | 'high';
  description: string;
  highlights: string[];
  capacity: number;
  netValue: number;
}

interface FeeTier {
  level: string;
  thirtyDayVolume: number;
  maker: number; // bps, negative means rebate
  taker: number;
  perks: string[];
  badge: string;
  color: string;
}

interface Application {
  id: string;
  type: 'maker' | 'liquidity' | 'partner';
  company: string;
  contact: string;
  email: string;
  region: string;
  stage: ApplyStage;
  submittedAt: string;
  updatedAt: string;
  progress: number;
  description: string;
  strategy: string;
  reviewer: string;
  pairs: string[];
  expectedVolume: number;
  feeTier: string;
  timeline: { stage: ApplyStage; timestamp: string; note: string }[];
}

interface KpiSnapshot {
  totalTvl: number;
  totalVolume24h: number;
  totalFees24h: number;
  activeMakers: number;
  totalMakers: number;
  poolsCount: number;
  livePrograms: number;
  totalRewards: number;
  copyFollowers: number;
  copyAum: number;
  avgSpread: number;
  depthChange: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const MAKERS: Maker[] = [
  {
    id: 'mk-001',
    name: 'Pacific Quant MM',
    level: 'platinum',
    type: 'institution',
    status: 'active',
    region: '亚太',
    country: '新加坡',
    joinedAt: '2024-04-12',
    pairs: 86,
    dailyVolume: 1240000000,
    makerShare: 18.6,
    uptime: 99.99,
    spread: 2.4,
    rebate: 0.8,
    aum: 240000000,
    rating: 4.9,
    followers: 12480,
    description: '亚太顶级量化做市商，专注主流币现货与衍生品双向报价。',
    strategy: '多因子统计套利 + 跨交易所价差对冲',
    highlights: ['18 个币对', '24×7 报价', '跨交易所对冲', '98% 报价覆盖率'],
    contacts: 'bd@pacific-quant.example.com',
    website: 'pacific-quant.example.com',
    audit: 'SlowMist / CertiK',
    compliance: ['MAS 合规研究方向', 'KYC/AML 内控', '审计报告按季披露'],
    feeTier: 1,
  },
  {
    id: 'mk-002',
    name: 'NorthStar HFT',
    level: 'platinum',
    type: 'hft',
    status: 'active',
    region: '北美',
    country: '美国',
    joinedAt: '2024-05-08',
    pairs: 124,
    dailyVolume: 2160000000,
    makerShare: 28.4,
    uptime: 99.98,
    spread: 1.6,
    rebate: 1.0,
    aum: 380000000,
    rating: 4.8,
    followers: 18620,
    description: '北美高频做市商，提供毫秒级深度报价。',
    strategy: '订单簿微结构 + 延迟套利',
    highlights: ['毫秒级延迟', '20+ 主流币对', '24×7 不间断', '0 重大事故'],
    contacts: 'desk@northstar-hft.example.com',
    website: 'northstar-hft.example.com',
    audit: 'CertiK / Quantstamp',
    compliance: ['FinCEN 合规研究方向', 'KYC/AML', '系统审计'],
    feeTier: 1,
  },
  {
    id: 'mk-003',
    name: 'Alpine Market Making',
    level: 'gold',
    type: 'algo',
    status: 'active',
    region: '欧洲',
    country: '瑞士',
    joinedAt: '2024-06-20',
    pairs: 56,
    dailyVolume: 480000000,
    makerShare: 8.2,
    uptime: 99.92,
    spread: 3.8,
    rebate: 0.5,
    aum: 120000000,
    rating: 4.6,
    followers: 6420,
    description: '欧洲算法做市商，专注中型币对深度建设。',
    strategy: '自适应价差 + 库存管理',
    highlights: ['中型币对专家', '库存控制', '风险指标透明'],
    contacts: 'contact@alpine-mm.example.com',
    website: 'alpine-mm.example.com',
    audit: 'SlowMist',
    compliance: ['FINMA 合规研究方向', '定期报告'],
    feeTier: 2,
  },
  {
    id: 'mk-004',
    name: 'SakuraNode 做市',
    level: 'gold',
    type: 'prop',
    status: 'active',
    region: '亚太',
    country: '日本',
    joinedAt: '2024-07-15',
    pairs: 42,
    dailyVolume: 320000000,
    makerShare: 5.4,
    uptime: 99.86,
    spread: 4.2,
    rebate: 0.4,
    aum: 86000000,
    rating: 4.5,
    followers: 4280,
    description: '日本自营做市商，日元交易对专家。',
    strategy: '价差回归 + 套息',
    highlights: ['JPY 交易对', '亚洲时段主力', '稳健报价'],
    contacts: 'bd@sakuranode.example.com',
    website: 'sakuranode.example.com',
    audit: 'CertiK',
    compliance: ['JFSA 合规研究方向', '报告制度'],
    feeTier: 2,
  },
  {
    id: 'mk-005',
    name: 'Gulf Strategic MM',
    level: 'gold',
    type: 'institution',
    status: 'review',
    region: '中东',
    country: '阿联酋',
    joinedAt: '2025-01-10',
    pairs: 28,
    dailyVolume: 180000000,
    makerShare: 3.2,
    uptime: 99.65,
    spread: 5.6,
    rebate: 0.3,
    aum: 52000000,
    rating: 4.3,
    followers: 2180,
    description: '中东战略做市商，专注中东时段与新兴市场。',
    strategy: '事件驱动 + 趋势跟随',
    highlights: ['中东时段', '新兴市场专家', '机构客户基础'],
    contacts: 'desk@gulf-mm.example.com',
    website: 'gulf-mm.example.com',
    audit: 'Quantstamp',
    compliance: ['ADGM 合规研究方向', 'KYC/AML'],
    feeTier: 3,
  },
  {
    id: 'mk-006',
    name: 'LibertyNode MM',
    level: 'silver',
    type: 'community',
    status: 'active',
    region: '北美',
    country: '加拿大',
    joinedAt: '2024-09-08',
    pairs: 32,
    dailyVolume: 96000000,
    makerShare: 1.8,
    uptime: 99.42,
    spread: 6.8,
    rebate: 0.2,
    aum: 18000000,
    rating: 4.1,
    followers: 1280,
    description: '北美社区做市商，专注长尾币对。',
    strategy: '网格 + 库存再平衡',
    highlights: ['长尾币对', '社区驱动', '激励透明'],
    contacts: 'hello@libertynode.example.com',
    website: 'libertynode.example.com',
    audit: '社区审计',
    compliance: ['KYC/AML 内控'],
    feeTier: 4,
  },
  {
    id: 'mk-007',
    name: 'NordicNode MM',
    level: 'silver',
    type: 'algo',
    status: 'paused',
    region: '欧洲',
    country: '瑞典',
    joinedAt: '2024-11-22',
    pairs: 24,
    dailyVolume: 24000000,
    makerShare: 0.6,
    uptime: 98.2,
    spread: 8.4,
    rebate: 0.1,
    aum: 8800000,
    rating: 3.8,
    followers: 480,
    description: '北欧算法做市商（系统升级暂停）。',
    strategy: '趋势 + 反转',
    highlights: ['北欧时段', '维护中', '后续恢复'],
    contacts: 'support@nordicnode.example.com',
    website: 'nordicnode.example.com',
    audit: 'SlowMist',
    compliance: ['KYC/AML'],
    feeTier: 4,
  },
  {
    id: 'mk-008',
    name: 'LatinHub MM',
    level: 'bronze',
    type: 'community',
    status: 'active',
    region: '南美',
    country: '巴西',
    joinedAt: '2025-03-12',
    pairs: 18,
    dailyVolume: 8200000,
    makerShare: 0.2,
    uptime: 98.6,
    spread: 12.4,
    rebate: 0,
    aum: 2400000,
    rating: 3.6,
    followers: 220,
    description: '南美社区做市商，专注 BRL 交易对。',
    strategy: '网格 + 套息',
    highlights: ['BRL 交易对', '南美时段', '社区激励'],
    contacts: 'oi@latinhub.example.com',
    website: 'latinhub.example.com',
    audit: '社区审计',
    compliance: ['KYC/AML 内控'],
    feeTier: 5,
  },
];

const POOLS: LiquidityPool[] = [
  {
    id: 'pool-001',
    pair: 'ZSDEX/USDT',
    type: 'amm',
    tvl: 186000000,
    volume24h: 248000000,
    fees24h: 124000,
    apr: 38.6,
    aprBase: 12.4,
    aprReward: 26.2,
    risk: 'medium',
    utilization: 62,
    reserves: { base: 186000000, quote: 186000000 },
    baseSymbol: 'ZSDEX',
    quoteSymbol: 'USDT',
    lpToken: 'LP-ZSDEX-USDT',
    rewards: ['ZSDEX', 'RWA'],
    audit: 'CertiK',
    description: '平台核心流动性池，做市激励重点。',
    capacity: 500000000,
    incentivized: true,
    lockupDays: 7,
    impermanentRisk: 'medium',
  },
  {
    id: 'pool-002',
    pair: 'BTC/USDT',
    type: 'orderbook',
    tvl: 480000000,
    volume24h: 1240000000,
    fees24h: 620000,
    apr: 18.4,
    aprBase: 9.2,
    aprReward: 9.2,
    risk: 'low',
    utilization: 78,
    reserves: { base: 4800, quote: 312000000 },
    baseSymbol: 'BTC',
    quoteSymbol: 'USDT',
    lpToken: 'LP-BTC-USDT',
    rewards: ['USDT'],
    audit: 'SlowMist / CertiK',
    description: 'BTC 现货主流动性池，深度优先。',
    capacity: 1000000000,
    incentivized: true,
    lockupDays: 0,
    impermanentRisk: 'low',
  },
  {
    id: 'pool-003',
    pair: 'ETH/USDT',
    type: 'orderbook',
    tvl: 320000000,
    volume24h: 980000000,
    fees24h: 490000,
    apr: 21.8,
    aprBase: 10.4,
    aprReward: 11.4,
    risk: 'low',
    utilization: 82,
    reserves: { base: 80000, quote: 256000000 },
    baseSymbol: 'ETH',
    quoteSymbol: 'USDT',
    lpToken: 'LP-ETH-USDT',
    rewards: ['USDT', 'ETH'],
    audit: 'SlowMist / CertiK',
    description: 'ETH 现货主流动性池。',
    capacity: 800000000,
    incentivized: true,
    lockupDays: 0,
    impermanentRisk: 'low',
  },
  {
    id: 'pool-004',
    pair: 'SOL/USDT',
    type: 'clob',
    tvl: 124000000,
    volume24h: 420000000,
    fees24h: 168000,
    apr: 32.4,
    aprBase: 12.6,
    aprReward: 19.8,
    risk: 'medium',
    utilization: 68,
    reserves: { base: 620000, quote: 124000000 },
    baseSymbol: 'SOL',
    quoteSymbol: 'USDT',
    lpToken: 'LP-SOL-USDT',
    rewards: ['SOL', 'RWA'],
    audit: 'CertiK',
    description: 'SOL 现货中央限价订单簿池。',
    capacity: 300000000,
    incentivized: true,
    lockupDays: 0,
    impermanentRisk: 'medium',
  },
  {
    id: 'pool-005',
    pair: 'USDC/USDT',
    type: 'stable',
    tvl: 240000000,
    volume24h: 180000000,
    fees24h: 18000,
    apr: 6.4,
    aprBase: 6.4,
    aprReward: 0,
    risk: 'low',
    utilization: 42,
    reserves: { base: 120000000, quote: 120000000 },
    baseSymbol: 'USDC',
    quoteSymbol: 'USDT',
    lpToken: 'LP-USDC-USDT',
    rewards: ['—'],
    audit: 'CertiK',
    description: '稳定币对流动性池，低风险基础收益。',
    capacity: 1000000000,
    incentivized: false,
    lockupDays: 0,
    impermanentRisk: 'low',
  },
  {
    id: 'pool-006',
    pair: 'ZSDEX-PERP',
    type: 'perpetual',
    tvl: 86000000,
    volume24h: 380000000,
    fees24h: 228000,
    apr: 48.6,
    aprBase: 18.4,
    aprReward: 30.2,
    risk: 'high',
    utilization: 86,
    reserves: { base: 86000000, quote: 86000000 },
    baseSymbol: 'ZSDEX-PERP',
    quoteSymbol: 'USDT',
    lpToken: 'LP-ZSDEX-PERP',
    rewards: ['ZSDEX'],
    audit: 'CertiK / Quantstamp',
    description: '永续合约流动性池，高收益高风险。',
    capacity: 200000000,
    incentivized: true,
    lockupDays: 14,
    impermanentRisk: 'high',
  },
  {
    id: 'pool-007',
    pair: 'RWA-001/USDT',
    type: 'rfq',
    tvl: 62000000,
    volume24h: 48000000,
    fees24h: 24000,
    apr: 14.2,
    aprBase: 8.6,
    aprReward: 5.6,
    risk: 'medium',
    utilization: 38,
    reserves: { base: 62000000, quote: 62000000 },
    baseSymbol: 'RWA-001',
    quoteSymbol: 'USDT',
    lpToken: 'LP-RWA001-USDT',
    rewards: ['RWA'],
    audit: 'CertiK',
    description: 'RWA 资产 RFQ 池，机构询价。',
    capacity: 200000000,
    incentivized: true,
    lockupDays: 30,
    impermanentRisk: 'medium',
  },
  {
    id: 'pool-008',
    pair: 'NEWCOIN/USDT',
    type: 'amm',
    tvl: 24000000,
    volume24h: 86000000,
    fees24h: 68800,
    apr: 86.4,
    aprBase: 24.6,
    aprReward: 61.8,
    risk: 'very-high',
    utilization: 92,
    reserves: { base: 24000000, quote: 24000000 },
    baseSymbol: 'NEWCOIN',
    quoteSymbol: 'USDT',
    lpToken: 'LP-NEWCOIN-USDT',
    rewards: ['NEWCOIN', 'ZSDEX'],
    audit: 'CertiK',
    description: 'Launch 新币流动性池，激励最高。',
    capacity: 60000000,
    incentivized: true,
    lockupDays: 30,
    impermanentRisk: 'high',
  },
];

const ORDERBOOK: OrderbookSnapshot[] = [
  {
    pair: 'ZSDEX/USDT',
    lastPrice: 1.245,
    change24h: 4.8,
    high24h: 1.268,
    low24h: 1.182,
    volume24h: 248000000,
    bids: [
      { price: 1.2448, size: 124800, total: 124800, maker: 'Pacific Quant MM', count: 6 },
      { price: 1.2446, size: 86800, total: 211600, maker: 'NorthStar HFT', count: 4 },
      { price: 1.2444, size: 64200, total: 275800, maker: 'Alpine MM', count: 3 },
      { price: 1.2442, size: 48600, total: 324400, maker: 'SakuraNode', count: 3 },
      { price: 1.244, size: 38200, total: 362600, maker: 'LibertyNode MM', count: 2 },
    ],
    asks: [
      { price: 1.2452, size: 118600, total: 118600, maker: 'NorthStar HFT', count: 5 },
      { price: 1.2454, size: 82400, total: 201000, maker: 'Pacific Quant MM', count: 4 },
      { price: 1.2456, size: 64800, total: 265800, maker: 'Alpine MM', count: 3 },
      { price: 1.2458, size: 42600, total: 308400, maker: 'SakuraNode', count: 2 },
      { price: 1.246, size: 32400, total: 340800, maker: 'LibertyNode MM', count: 2 },
    ],
    spread: 0.4,
    midPrice: 1.245,
    depth2pct: 1860000,
  },
  {
    pair: 'BTC/USDT',
    lastPrice: 70350,
    change24h: 1.2,
    high24h: 71200,
    low24h: 69800,
    volume24h: 1240000000,
    bids: [
      { price: 70348, size: 12.4, total: 12.4, maker: 'NorthStar HFT', count: 8 },
      { price: 70346, size: 8.6, total: 21, maker: 'Pacific Quant MM', count: 6 },
      { price: 70344, size: 6.2, total: 27.2, maker: 'Alpine MM', count: 4 },
      { price: 70342, size: 4.8, total: 32, maker: 'SakuraNode', count: 3 },
      { price: 70340, size: 3.6, total: 35.6, maker: 'LibertyNode MM', count: 2 },
    ],
    asks: [
      { price: 70352, size: 11.8, total: 11.8, maker: 'NorthStar HFT', count: 7 },
      { price: 70354, size: 8.2, total: 20, maker: 'Pacific Quant MM', count: 5 },
      { price: 70356, size: 6.4, total: 26.4, maker: 'Alpine MM', count: 4 },
      { price: 70358, size: 4.2, total: 30.6, maker: 'SakuraNode', count: 3 },
      { price: 70360, size: 3.2, total: 33.8, maker: 'LibertyNode MM', count: 2 },
    ],
    spread: 0.4,
    midPrice: 70350,
    depth2pct: 24800000,
  },
];

const MINING_PROGRAMS: MiningProgram[] = [
  {
    id: 'mn-001',
    name: 'ZSDEX/USDT 流动性挖矿 v3',
    pool: 'ZSDEX/USDT',
    totalReward: 12000000,
    remainingReward: 8200000,
    token: 'ZSDEX',
    apr: 38.6,
    duration: '90 天',
    status: 'live',
    participants: 8420,
    minStake: 1000,
    cap: 100000,
    description: '平台主流动性池挖矿，奖励 1200 万 ZSDEX。',
    vestingDays: 30,
    multiplier: 1.5,
    earlyBonus: 18,
  },
  {
    id: 'mn-002',
    name: 'BTC 深度激励',
    pool: 'BTC/USDT',
    totalReward: 8000000,
    remainingReward: 5200000,
    token: 'USDT',
    apr: 18.4,
    duration: '60 天',
    status: 'live',
    participants: 12480,
    minStake: 5000,
    cap: 500000,
    description: 'BTC 现货做市激励，按报价时长与深度加权。',
    vestingDays: 0,
    multiplier: 1.0,
    earlyBonus: 8,
  },
  {
    id: 'mn-003',
    name: '永续做市特别奖',
    pool: 'ZSDEX-PERP',
    totalReward: 6000000,
    remainingReward: 4800000,
    token: 'ZSDEX',
    apr: 48.6,
    duration: '45 天',
    status: 'live',
    participants: 1280,
    minStake: 10000,
    cap: 200000,
    description: '永续合约做市额外激励，绑定 14 天。',
    vestingDays: 14,
    multiplier: 2.0,
    earlyBonus: 25,
  },
  {
    id: 'mn-004',
    name: 'Launch 新币做市',
    pool: 'NEWCOIN/USDT',
    totalReward: 2000000,
    remainingReward: 1800000,
    token: 'NEWCOIN',
    apr: 86.4,
    duration: '30 天',
    status: 'upcoming',
    participants: 0,
    minStake: 500,
    cap: 50000,
    description: 'Launch 项目首期做市激励，限额 200 万 NEWCOIN。',
    vestingDays: 30,
    multiplier: 3.0,
    earlyBonus: 40,
  },
];

const COPY_STRATEGIES: CopyStrategy[] = [
  {
    id: 'cp-001',
    maker: 'Pacific Quant MM',
    strategyName: '稳健套利组合',
    pairs: ['BTC/USDT', 'ETH/USDT', 'ZSDEX/USDT'],
    followers: 8420,
    aum: 48000000,
    pnl30d: 8.4,
    pnl90d: 24.6,
    maxDrawdown: 4.2,
    sharpe: 2.4,
    feeShare: 18,
    risk: 'low',
    description: '低频统计套利组合，回撤可控。',
    highlights: ['近 30 日 +8.4%', '最大回撤 4.2%', '夏普 2.4'],
    capacity: 100000000,
    netValue: 1.246,
  },
  {
    id: 'cp-002',
    maker: 'NorthStar HFT',
    strategyName: '高频微结构',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    followers: 12480,
    aum: 86000000,
    pnl30d: 12.6,
    pnl90d: 38.2,
    maxDrawdown: 6.8,
    sharpe: 2.8,
    feeShare: 22,
    risk: 'medium',
    description: '订单簿微结构高频策略。',
    highlights: ['近 30 日 +12.6%', '夏普 2.8', '容量 2 亿'],
    capacity: 200000000,
    netValue: 1.382,
  },
  {
    id: 'cp-003',
    maker: 'Alpine MM',
    strategyName: '中型币深度',
    pairs: ['SOL/USDT', 'AVAX/USDT', 'DOT/USDT'],
    followers: 4280,
    aum: 18000000,
    pnl30d: 18.2,
    pnl90d: 52.4,
    maxDrawdown: 12.4,
    sharpe: 2.0,
    feeShare: 25,
    risk: 'medium',
    description: '中型币对深度建设，波动较大。',
    highlights: ['近 30 日 +18.2%', '中型币专家', '容量 5 千万'],
    capacity: 50000000,
    netValue: 1.524,
  },
  {
    id: 'cp-004',
    maker: 'Gulf Strategic MM',
    strategyName: '事件驱动',
    pairs: ['BTC-PERP', 'ETH-PERP'],
    followers: 1820,
    aum: 8600000,
    pnl30d: 22.4,
    pnl90d: 64.8,
    maxDrawdown: 18.6,
    sharpe: 1.6,
    feeShare: 28,
    risk: 'high',
    description: '事件驱动策略，回撤较高。',
    highlights: ['近 30 日 +22.4%', '高波动高收益', '容量 3 千万'],
    capacity: 30000000,
    netValue: 1.648,
  },
];

const FEE_TIERS: FeeTier[] = [
  {
    level: 'VIP 1',
    thirtyDayVolume: 10000000,
    maker: -1.0,
    taker: 2.5,
    perks: ['负 Maker 费率', '专属客户经理', 'API 高频通道'],
    badge: '💎',
    color: '#a855f7',
  },
  {
    level: 'VIP 2',
    thirtyDayVolume: 50000000,
    maker: -0.8,
    taker: 2.2,
    perks: ['负 Maker 费率', '专属客户经理', '做市商激励池'],
    badge: '🏆',
    color: '#14B881',
  },
  {
    level: 'VIP 3',
    thirtyDayVolume: 200000000,
    maker: -0.5,
    taker: 2.0,
    perks: ['负 Maker 费率', '优先上币', 'Launch 优先申购'],
    badge: '👑',
    color: '#eab308',
  },
  {
    level: 'VIP 4',
    thirtyDayVolume: 1000000000,
    maker: -0.3,
    taker: 1.8,
    perks: ['负 Maker 费率', '联合做市', '定制化产品'],
    badge: '⭐',
    color: '#f97316',
  },
  {
    level: 'VIP 5',
    thirtyDayVolume: 5000000000,
    maker: -0.1,
    taker: 1.5,
    perks: ['议价费率', '联合做市', '战略级合作'],
    badge: '🚀',
    color: '#ef4444',
  },
];

const APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    type: 'maker',
    company: 'Demo Quant MM',
    contact: '张*',
    email: 'bd@demo-mm.example.com',
    region: '亚太',
    stage: 'tech-test',
    submittedAt: '2026-06-12',
    updatedAt: '2026-07-15',
    progress: 65,
    description: '亚太新兴量化做市商，专注 JPY 交易对。',
    strategy: '价差回归 + 库存管理',
    reviewer: '做市商-BD',
    pairs: ['BTC/JPY', 'ETH/JPY', 'ZSDEX/JPY'],
    expectedVolume: 50000000,
    feeTier: 'VIP 3',
    timeline: [
      { stage: 'submitted', timestamp: '2026-06-12', note: '提交申请' },
      { stage: 'review', timestamp: '2026-06-15', note: '初审通过' },
      { stage: 'kyb', timestamp: '2026-06-22', note: '企业资质审核' },
      { stage: 'tech-test', timestamp: '2026-07-08', note: '技术联调中' },
    ],
  },
  {
    id: 'app-002',
    type: 'liquidity',
    company: '某链上资管',
    contact: '李*',
    email: 'liquidity@demo-fund.example.com',
    region: '全球',
    stage: 'contract',
    submittedAt: '2026-05-20',
    updatedAt: '2026-07-10',
    progress: 82,
    description: '链上资管机构，提供 1 亿 USDT 流动性。',
    strategy: '被动做市 + 跨池对冲',
    reviewer: '流动性-BD',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    expectedVolume: 200000000,
    feeTier: 'VIP 2',
    timeline: [
      { stage: 'submitted', timestamp: '2026-05-20', note: '提交申请' },
      { stage: 'review', timestamp: '2026-05-25', note: '初审通过' },
      { stage: 'kyb', timestamp: '2026-06-02', note: 'KYB 通过' },
      { stage: 'tech-test', timestamp: '2026-06-18', note: '技术联调' },
      { stage: 'contract', timestamp: '2026-07-01', note: '合同签署中' },
    ],
  },
  {
    id: 'app-003',
    type: 'partner',
    company: '某 DeFi 协议',
    contact: '王*',
    email: 'partner@demo-defi.example.com',
    region: '全球',
    stage: 'review',
    submittedAt: '2026-07-08',
    updatedAt: '2026-07-18',
    progress: 30,
    description: 'DeFi 协议，集成 ZSDEX 流动性。',
    strategy: '跨链桥 + 联合做市',
    reviewer: '生态-BD',
    pairs: ['ZSDEX/USDT'],
    expectedVolume: 20000000,
    feeTier: 'VIP 4',
    timeline: [
      { stage: 'submitted', timestamp: '2026-07-08', note: '提交申请' },
      { stage: 'review', timestamp: '2026-07-12', note: '初审中' },
    ],
  },
];

// ============== Helpers ==============

function formatCurrency(n: number, currency = 'USDT'): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B ${currency}`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M ${currency}`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function formatPercent(n: number, decimals = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

function formatBps(n: number): string {
  return `${n.toFixed(1)} bps`;
}

function levelColor(level: MakerLevel): string {
  switch (level) {
    case 'platinum':
      return '#a855f7';
    case 'gold':
      return '#eab308';
    case 'silver':
      return '#94a3b8';
    case 'bronze':
      return '#d97706';
    case 'community':
      return '#14B881';
  }
}

function levelLabel(level: MakerLevel): string {
  switch (level) {
    case 'platinum':
      return '铂金';
    case 'gold':
      return '黄金';
    case 'silver':
      return '白银';
    case 'bronze':
      return '青铜';
    case 'community':
      return '社区';
  }
}

function poolTypeLabel(type: PoolType): string {
  switch (type) {
    case 'amm':
      return 'AMM';
    case 'orderbook':
      return '订单簿';
    case 'clob':
      return '中央限价';
    case 'rfq':
      return 'RFQ';
    case 'stable':
      return '稳定币';
    case 'perpetual':
      return '永续';
  }
}

function riskColor(risk: PoolRisk): string {
  switch (risk) {
    case 'low':
      return '#14B881';
    case 'medium':
      return '#eab308';
    case 'high':
      return '#f97316';
    case 'very-high':
      return '#ef4444';
  }
}

function riskLabel(risk: PoolRisk): string {
  switch (risk) {
    case 'low':
      return '低风险';
    case 'medium':
      return '中等';
    case 'high':
      return '高风险';
    case 'very-high':
      return '极高';
  }
}

function applyStageLabel(stage: ApplyStage): string {
  switch (stage) {
    case 'submitted':
      return '已提交';
    case 'review':
      return '初审中';
    case 'kyb':
      return 'KYB 审核';
    case 'tech-test':
      return '技术联调';
    case 'contract':
      return '合同签署';
    case 'live':
      return '已上线';
    case 'rejected':
      return '已驳回';
  }
}

function applyStageColor(stage: ApplyStage): string {
  switch (stage) {
    case 'submitted':
      return '#94a3b8';
    case 'review':
      return '#3b82f6';
    case 'kyb':
      return '#a855f7';
    case 'tech-test':
      return '#eab308';
    case 'contract':
      return '#f97316';
    case 'live':
      return '#14B881';
    case 'rejected':
      return '#ef4444';
  }
}

function statusBadge(status: MakerStatus) {
  const map: Record<MakerStatus, { label: string; color: string; bg: string }> = {
    active: { label: '活跃', color: '#14B881', bg: 'rgba(20,184,129,0.12)' },
    review: { label: '审核中', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    paused: { label: '已暂停', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    suspended: { label: '已冻结', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    invited: { label: '受邀', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  };
  return map[status];
}

function miningStatusBadge(status: MiningProgram['status']) {
  const map = {
    live: { label: '进行中', color: '#14B881', bg: 'rgba(20,184,129,0.12)' },
    upcoming: { label: '即将开始', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    ended: { label: '已结束', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  };
  return map[status];
}

// ============== KpiCard 子组件 ==============

function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  accent,
}: {
  label: string;
  value: string;
  icon: any;
  trend?: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div
      className="group rounded-xl p-4 transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        backgroundColor: BRAND.card,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs mb-1.5" style={{ color: BRAND.textMuted }}>
            {label}
          </div>
          <div className="text-2xl font-semibold tabular-nums" style={{ color: accent || BRAND.text }}>
            {value}
          </div>
          {trend && (
            <div className="text-xs mt-1.5 flex items-center gap-1" style={{ color: trend.startsWith('+') ? BRAND.success : BRAND.danger }}>
              {trend.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </div>
          )}
          {hint && (
            <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
              {hint}
            </div>
          )}
        </div>
        <div
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: `${accent || BRAND.primary}15`,
            color: accent || BRAND.primary,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// ============== 主组件 ==============

export function PortalMaker() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [makerLevelFilter, setMakerLevelFilter] = useState<MakerLevel | 'all'>('all');
  const [makerTypeFilter, setMakerTypeFilter] = useState<MakerType | 'all'>('all');
  const [poolTypeFilter, setPoolTypeFilter] = useState<PoolType | 'all'>('all');
  const [poolRiskFilter, setPoolRiskFilter] = useState<PoolRisk | 'all'>('all');
  const [miningStatusFilter, setMiningStatusFilter] = useState<MiningProgram['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'volume' | 'apr' | 'name'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [activeOrderbook, setActiveOrderbook] = useState(0);
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<'maker' | 'liquidity' | 'partner'>('maker');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const [applyStrategy, setApplyStrategy] = useState('');
  const [applyPairs, setApplyPairs] = useState('');
  const [applyVolume, setApplyVolume] = useState('10000000');
  const [calcStake, setCalcStake] = useState('50000');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalTvl: 1522000000,
    totalVolume24h: 3580000000,
    totalFees24h: 2186000,
    activeMakers: 124,
    totalMakers: 168,
    poolsCount: 28,
    livePrograms: 8,
    totalRewards: 28000000,
    copyFollowers: 27800,
    copyAum: 162800000,
    avgSpread: 3.6,
    depthChange: 8.4,
  });
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // 实时数据模拟
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalTvl: prev.totalTvl + (Math.random() - 0.45) * 8000000,
        totalVolume24h: prev.totalVolume24h + (Math.random() - 0.4) * 12000000,
        totalFees24h: prev.totalFees24h + (Math.random() - 0.3) * 8000,
        activeMakers: prev.activeMakers + (Math.random() > 0.85 ? 1 : 0),
        depthChange: Math.max(0, Math.min(20, prev.depthChange + (Math.random() - 0.5) * 0.6)),
        avgSpread: Math.max(2, Math.min(8, prev.avgSpread + (Math.random() - 0.5) * 0.15)),
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // 报价深度波动
  const [depthPulse, setDepthPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setDepthPulse((p) => p + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) {
          setDrawer({ open: false, type: null, payload: null });
        } else if (helpOpen) {
          setHelpOpen(false);
        } else if (applyStep > 0) {
          setApplyStep(0);
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'makers', 'pools', 'depth', 'mining', 'copy', 'fees', 'apply', 'help'];
        const idx = parseInt(e.key, 10) - 1;
        if (tabs[idx]) setTab(tabs[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen, applyStep]);

  // 计算过滤后的做市商
  const filteredMakers = useMemo(() => {
    let list = [...MAKERS];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(s) || m.country.includes(search) || m.region.includes(search),
      );
    }
    if (makerLevelFilter !== 'all') list = list.filter((m) => m.level === makerLevelFilter);
    if (makerTypeFilter !== 'all') list = list.filter((m) => m.type === makerTypeFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'volume') cmp = a.dailyVolume - b.dailyVolume;
      else if (sortBy === 'apr') cmp = a.rebate - b.rebate;
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [search, makerLevelFilter, makerTypeFilter, sortBy, sortDir]);

  const filteredPools = useMemo(() => {
    let list = [...POOLS];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.pair.toLowerCase().includes(s));
    }
    if (poolTypeFilter !== 'all') list = list.filter((p) => p.type === poolTypeFilter);
    if (poolRiskFilter !== 'all') list = list.filter((p) => p.risk === poolRiskFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'volume') cmp = a.volume24h - b.volume24h;
      else if (sortBy === 'apr') cmp = a.apr - b.apr;
      else if (sortBy === 'name') cmp = a.pair.localeCompare(b.pair);
      else cmp = b.tvl - a.tvl;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [search, poolTypeFilter, poolRiskFilter, sortBy, sortDir]);

  const filteredMining = useMemo(() => {
    let list = [...MINING_PROGRAMS];
    if (miningStatusFilter !== 'all') list = list.filter((m) => m.status === miningStatusFilter);
    return list;
  }, [miningStatusFilter]);

  const activeMaker = useMemo(() => MAKERS.find((m) => m.id === drawer.payload) || null, [drawer.payload]);
  const activePool = useMemo(() => POOLS.find((p) => p.id === drawer.payload) || null, [drawer.payload]);
  const activeProgram = useMemo(() => MINING_PROGRAMS.find((m) => m.id === drawer.payload) || null, [drawer.payload]);
  const activeStrategy = useMemo(() => COPY_STRATEGIES.find((c) => c.id === drawer.payload) || null, [drawer.payload]);
  const activeOrderbookData = ORDERBOOK[activeOrderbook];

  // 挖矿计算器
  const calcResults = useMemo(() => {
    const stake = parseFloat(calcStake) || 0;
    return POOLS.slice(0, 4).map((p) => ({
      pair: p.pair,
      apr: p.apr,
      dailyReward: (stake * p.apr) / 100 / 365,
      monthlyReward: (stake * p.apr) / 100 / 12,
      yearlyReward: (stake * p.apr) / 100,
    }));
  }, [calcStake]);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const openDrawer = useCallback((type: DrawerType, payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const submitApplication = useCallback(() => {
    setApplyStep(4); // 完成态
  }, []);

  // ============== Render ==============

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* 关键帧动画 */}
      <style>{`
        @keyframes pm-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pm-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pm-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pm-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .pm-stagger > * { animation: pm-fade-up 0.4s ease-out both; }
        .pm-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pm-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pm-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pm-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pm-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pm-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pm-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pm-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pm-pulse { animation: pm-pulse 2.4s ease-in-out infinite; }
        .pm-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pm-shimmer 2.4s linear infinite; }
        .pm-drawer { animation: pm-slide-in 0.28s ease-out; }
        .pm-bar { transform-origin: bottom; animation: pm-bar 0.6s ease-out; }
        .pm-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      <div className="max-w-[1480px] mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: BRAND.textMuted }}>
            <span>FrontPortal</span>
            <ChevronRight size={12} />
            <span>做市与流动性</span>
            <ChevronRight size={12} />
            <span style={{ color: BRAND.text }}>做市商与流动性中心</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${BRAND.primary}1A`, color: BRAND.primary }}
                >
                  <HandCoins size={26} />
                </div>
                <h1 className="text-3xl font-semibold" style={{ color: BRAND.text }}>
                  做市商与流动性中心
                </h1>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: `${BRAND.primary}1A`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}
                >
                  LIVE
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: BRAND.textMuted }}>
                聚合做市商、流动性池、报价深度、流动性挖矿、跟单做市、费率体系、申请入驻的端到端流动性基础设施中心。
                与 P3.17 API / P3.18 Launch / P3.24 生态 形成"做市-API-发行-生态-流动性"五方协同闭环。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}
                title="快捷键"
              >
                <Keyboard size={14} />
                <span>?</span>
              </button>
              <button
                onClick={() => openDrawer('apply')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                style={{ backgroundColor: BRAND.primary, color: '#000' }}
              >
                <UserPlus size={14} />
                <span>申请入驻</span>
              </button>
            </div>
          </div>
        </div>

        {/* 实时 KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 pm-stagger">
          <KpiCard
            label="总 TVL"
            value={`$${formatNumber(kpi.totalTvl)}`}
            icon={Wallet}
            trend={formatPercent(2.4)}
            hint="全平台流动性"
            accent={BRAND.primary}
          />
          <KpiCard
            label="24H 成交量"
            value={`$${formatNumber(kpi.totalVolume24h)}`}
            icon={BarChart3}
            trend={formatPercent(4.8)}
            hint="做市 + 用户"
            accent="#3b82f6"
          />
          <KpiCard
            label="24H 手续费"
            value={`$${formatNumber(kpi.totalFees24h, 0)}`}
            icon={CircleDollarSign}
            trend={formatPercent(3.2)}
            hint="做市 + 流动性"
            accent="#a855f7"
          />
          <KpiCard
            label="活跃做市商"
            value={`${kpi.activeMakers} / ${kpi.totalMakers}`}
            icon={Handshake}
            trend={formatPercent(0.8)}
            hint="全球节点"
            accent="#eab308"
          />
          <KpiCard
            label="流动性池"
            value={`${kpi.poolsCount}`}
            icon={Layers}
            trend="+3"
            hint="现货 + 永续"
            accent="#f97316"
          />
          <KpiCard
            label="在投挖矿"
            value={`${kpi.livePrograms} 期`}
            icon={Sparkles}
            hint={`奖励池 $${formatNumber(kpi.totalRewards)}`}
            accent="#ef4444"
          />
        </div>

        {/* Tab 切换 */}
        <div
          className="flex items-center gap-1 mb-4 overflow-x-auto pb-1"
          style={{ borderBottom: `1px solid ${BRAND.border}` }}
        >
          {[
            { id: 'overview', label: '总览', icon: Activity },
            { id: 'makers', label: '做市商', icon: Handshake },
            { id: 'pools', label: '流动性池', icon: Layers },
            { id: 'depth', label: '报价深度', icon: BarChart3 },
            { id: 'mining', label: '流动性挖矿', icon: Sparkles },
            { id: 'copy', label: '跟单做市', icon: Users },
            { id: 'fees', label: '费率体系', icon: Award },
            { id: 'apply', label: '申请入驻', icon: UserPlus },
            { id: 'help', label: '帮助', icon: HelpCircle },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap"
                style={{ color: active ? BRAND.primary : BRAND.textMuted }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                {active && (
                  <span
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5"
                    style={{ backgroundColor: BRAND.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 主内容区 */}
        {tab === 'overview' && <OverviewTab kpi={kpi} depthPulse={depthPulse} onOpen={openDrawer} onTab={setTab} />}
        {tab === 'makers' && (
          <MakersTab
            search={search}
            setSearch={setSearch}
            levelFilter={makerLevelFilter}
            setLevelFilter={setMakerLevelFilter}
            typeFilter={makerTypeFilter}
            setTypeFilter={setMakerTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            list={filteredMakers}
            onOpen={openDrawer}
            searchRef={searchRef}
          />
        )}
        {tab === 'pools' && (
          <PoolsTab
            search={search}
            setSearch={setSearch}
            typeFilter={poolTypeFilter}
            setTypeFilter={setPoolTypeFilter}
            riskFilter={poolRiskFilter}
            setRiskFilter={setPoolRiskFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            list={filteredPools}
            onOpen={openDrawer}
            searchRef={searchRef}
          />
        )}
        {tab === 'depth' && (
          <DepthTab
            orderbooks={ORDERBOOK}
            activeIdx={activeOrderbook}
            setActiveIdx={setActiveOrderbook}
            depthPulse={depthPulse}
            onOpen={openDrawer}
          />
        )}
        {tab === 'mining' && (
          <MiningTab
            list={filteredMining}
            statusFilter={miningStatusFilter}
            setStatusFilter={setMiningStatusFilter}
            calcStake={calcStake}
            setCalcStake={setCalcStake}
            calcResults={calcResults}
            onOpen={openDrawer}
          />
        )}
        {tab === 'copy' && (
          <CopyTab list={COPY_STRATEGIES} onOpen={openDrawer} />
        )}
        {tab === 'fees' && <FeesTab tiers={FEE_TIERS} onOpen={openDrawer} />}
        {tab === 'apply' && (
          <ApplyTab
            step={applyStep}
            setStep={setApplyStep}
            type={applyType}
            setType={setApplyType}
            company={applyCompany}
            setCompany={setApplyCompany}
            contact={applyContact}
            setContact={setApplyContact}
            email={applyEmail}
            setEmail={setApplyEmail}
            region={applyRegion}
            setRegion={setApplyRegion}
            strategy={applyStrategy}
            setStrategy={setApplyStrategy}
            pairs={applyPairs}
            setPairs={setApplyPairs}
            volume={applyVolume}
            setVolume={setApplyVolume}
            onSubmit={submitApplication}
            applications={APPLICATIONS}
            onOpen={openDrawer}
          />
        )}
        {tab === 'help' && <HelpTab onOpen={openDrawer} onTab={setTab} />}

        {/* 合规底注 */}
        <div
          className="mt-12 p-4 rounded-xl text-xs leading-relaxed"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}
        >
          <div className="flex items-start gap-2">
            <Shield size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.warning }} />
            <div>
              <strong style={{ color: BRAND.text }}>合规与风险提示：</strong>
              本平台所有做市商 / 流动性池 / 报价 / 挖矿 / 跟单 / 费率数据均为 UI 演示 mock，不构成任何投资建议。
              APR、奖励、收益等数据为模拟展示，不代表真实回报。做市商与流动性中心所有内容均处于"合规研究方向"，
              不代表已经获得任何司法管辖区的持牌 / 监管 / 许可。流动性提供、做市商入驻涉及复杂的金融、技术与法律风险，
              请独立判断并咨询专业人士。
            </div>
          </div>
        </div>

        {/* 底部 CTA */}
        <div
          className="mt-6 p-6 rounded-xl flex items-center justify-between flex-wrap gap-4"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: BRAND.text }}>
              加入 ZSDEX 做市商与流动性生态
            </h3>
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              享受顶级费率、专属激励、API 高频通道、Launch 优先申购、跨交易所对冲等做市商级权益。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('fees')}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              查看费率
            </button>
            <button
              onClick={() => openDrawer('apply')}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即申请
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawer.open && (
        <Drawer
          state={drawer}
          maker={activeMaker}
          pool={activePool}
          program={activeProgram}
          strategy={activeStrategy}
          onClose={closeDrawer}
        />
      )}

      {/* Help Drawer */}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

// ============== Tab 子组件 ==============

function OverviewTab({
  kpi,
  depthPulse,
  onOpen,
  onTab,
}: {
  kpi: KpiSnapshot;
  depthPulse: number;
  onOpen: (type: DrawerType, payload?: string) => void;
  onTab: (t: Tab) => void;
}) {
  return (
    <div className="space-y-4 pm-stagger">
      {/* 流动性总览图 */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Layers size={18} style={{ color: BRAND.primary }} />
            流动性总览（按交易对）
          </h3>
          <button
            onClick={() => onTab('pools')}
            className="text-xs flex items-center gap-1"
            style={{ color: BRAND.primary }}
          >
            查看全部 <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {POOLS.slice(0, 6).map((p) => {
            const maxTvl = Math.max(...POOLS.map((q) => q.tvl));
            const pct = (p.tvl / maxTvl) * 100;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg pm-row cursor-pointer"
                onClick={() => onOpen('pool', p.id)}
                style={{ backgroundColor: BRAND.cardHover }}
              >
                <div className="w-24 text-sm font-medium" style={{ color: BRAND.text }}>
                  {p.pair}
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${riskColor(p.risk)} 0%, ${BRAND.primary} 100%)`,
                    }}
                  />
                </div>
                <div className="w-28 text-right text-sm tabular-nums" style={{ color: BRAND.text }}>
                  ${formatNumber(p.tvl)}
                </div>
                <div className="w-20 text-right text-sm tabular-nums" style={{ color: BRAND.success }}>
                  {p.apr.toFixed(1)}%
                </div>
                <div
                  className="w-16 text-right text-xs px-2 py-0.5 rounded"
                  style={{ color: riskColor(p.risk), backgroundColor: `${riskColor(p.risk)}15` }}
                >
                  {riskLabel(p.risk)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 实时报价深度预览 */}
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <BarChart3 size={18} style={{ color: BRAND.primary }} />
              实时报价深度 · ZSDEX/USDT
            </h3>
            <span className="text-xs flex items-center gap-1" style={{ color: BRAND.success }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full pm-pulse" style={{ backgroundColor: BRAND.success }} />
              LIVE · {depthPulse}
            </span>
          </div>
          <OrderbookView snapshot={ORDERBOOK[0]} compact />
          <button
            onClick={() => onTab('depth')}
            className="mt-3 w-full text-xs flex items-center justify-center gap-1 py-2 rounded-lg"
            style={{ backgroundColor: BRAND.cardHover, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}
          >
            查看完整盘口 <ArrowRight size={12} />
          </button>
        </div>

        {/* 做市商活跃榜 */}
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Handshake size={18} style={{ color: BRAND.primary }} />
              做市商活跃榜
            </h3>
            <button
              onClick={() => onTab('makers')}
              className="text-xs flex items-center gap-1"
              style={{ color: BRAND.primary }}
            >
              查看全部 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {MAKERS.slice(0, 5).map((m, i) => {
              const sb = statusBadge(m.status);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg pm-row cursor-pointer"
                  onClick={() => onOpen('maker', m.id)}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${levelColor(m.level)}20`, color: levelColor(m.level) }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>
                      {m.name}
                    </div>
                    <div className="text-xs" style={{ color: BRAND.textMuted }}>
                      {m.country} · {m.pairs} 个币对
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>
                      ${formatNumber(m.dailyVolume)}
                    </div>
                    <div className="text-[10px]" style={{ color: sb.color }}>
                      {sb.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 关键指标 + 跟单 + 挖矿 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
            <Users size={16} style={{ color: BRAND.primary }} />
            跟单做市
          </h4>
          <div className="text-3xl font-semibold mb-1 tabular-nums" style={{ color: BRAND.text }}>
            {kpi.copyFollowers.toLocaleString()}
          </div>
          <div className="text-xs mb-3" style={{ color: BRAND.textMuted }}>
            活跃跟单用户
          </div>
          <div className="text-sm tabular-nums" style={{ color: BRAND.success }}>
            ${formatNumber(kpi.copyAum)} AUM
          </div>
          <button
            onClick={() => onTab('copy')}
            className="mt-3 w-full text-xs py-2 rounded-lg"
            style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            查看策略
          </button>
        </div>
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
            <Sparkles size={16} style={{ color: BRAND.primary }} />
            流动性挖矿
          </h4>
          <div className="text-3xl font-semibold mb-1 tabular-nums" style={{ color: BRAND.text }}>
            {kpi.livePrograms}
          </div>
          <div className="text-xs mb-3" style={{ color: BRAND.textMuted }}>
            在投计划
          </div>
          <div className="text-sm tabular-nums" style={{ color: BRAND.success }}>
            ${formatNumber(kpi.totalRewards)} 奖励池
          </div>
          <button
            onClick={() => onTab('mining')}
            className="mt-3 w-full text-xs py-2 rounded-lg"
            style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            查看计划
          </button>
        </div>
        <div
          className="p-5 rounded-xl"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
            <Award size={16} style={{ color: BRAND.primary }} />
            平均报价价差
          </h4>
          <div className="text-3xl font-semibold mb-1 tabular-nums" style={{ color: BRAND.text }}>
            {kpi.avgSpread.toFixed(1)} bps
          </div>
          <div className="text-xs mb-3" style={{ color: BRAND.textMuted }}>
            主流币对加权
          </div>
          <div className="text-sm tabular-nums" style={{ color: BRAND.success }}>
            {formatPercent(kpi.depthChange)} 深度变化
          </div>
          <button
            onClick={() => onTab('fees')}
            className="mt-3 w-full text-xs py-2 rounded-lg"
            style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            查看费率
          </button>
        </div>
      </div>
    </div>
  );
}

function MakersTab({
  search,
  setSearch,
  levelFilter,
  setLevelFilter,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  list,
  onOpen,
  searchRef,
}: {
  search: string;
  setSearch: (v: string) => void;
  levelFilter: MakerLevel | 'all';
  setLevelFilter: (v: MakerLevel | 'all') => void;
  typeFilter: MakerType | 'all';
  setTypeFilter: (v: MakerType | 'all') => void;
  sortBy: 'updated' | 'volume' | 'apr' | 'name';
  setSortBy: (v: 'updated' | 'volume' | 'apr' | 'name') => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;
  list: Maker[];
  onOpen: (type: DrawerType, payload?: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl flex items-center gap-3 flex-wrap"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索做市商 / 地区 / 国家..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
          />
        </div>
        <FilterPillGroup<MakerLevel>
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            { value: 'all', label: '全部等级' },
            { value: 'platinum', label: '铂金' },
            { value: 'gold', label: '黄金' },
            { value: 'silver', label: '白银' },
            { value: 'bronze', label: '青铜' },
            { value: 'community', label: '社区' },
          ]}
        />
        <FilterPillGroup<MakerType>
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'institution', label: '机构' },
            { value: 'hft', label: 'HFT' },
            { value: 'algo', label: '算法' },
            { value: 'prop', label: '自营' },
            { value: 'community', label: '社区' },
          ]}
        />
        <SortGroup sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} options={[
          { value: 'updated', label: '入驻时间' },
          { value: 'volume', label: '成交量' },
          { value: 'apr', label: '返佣' },
          { value: 'name', label: '名称' },
        ]} />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-medium" style={{ color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}` }}>
          <div className="col-span-3">做市商</div>
          <div className="col-span-2">等级 / 类型</div>
          <div className="col-span-2 text-right">24H 量</div>
          <div className="col-span-1 text-right">币对</div>
          <div className="col-span-1 text-right">点差</div>
          <div className="col-span-1 text-right">Uptime</div>
          <div className="col-span-2 text-right">状态</div>
        </div>
        {list.length === 0 ? (
          <EmptyState label="暂无匹配的做市商" />
        ) : (
          <div className="pm-stagger">
            {list.map((m) => {
              const sb = statusBadge(m.status);
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 text-sm pm-row cursor-pointer"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}
                  onClick={() => onOpen('maker', m.id)}
                >
                  <div className="col-span-3">
                    <div className="font-medium" style={{ color: BRAND.text }}>
                      {m.name}
                    </div>
                    <div className="text-xs" style={{ color: BRAND.textMuted }}>
                      {m.region} · {m.country} · {m.joinedAt}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium mr-1"
                      style={{ color: levelColor(m.level), backgroundColor: `${levelColor(m.level)}15` }}
                    >
                      {levelLabel(m.level)}
                    </span>
                    <span className="text-xs" style={{ color: BRAND.textMuted }}>
                      {m.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-2 text-right tabular-nums" style={{ color: BRAND.text }}>
                    ${formatNumber(m.dailyVolume)}
                  </div>
                  <div className="col-span-1 text-right tabular-nums" style={{ color: BRAND.text }}>
                    {m.pairs}
                  </div>
                  <div className="col-span-1 text-right tabular-nums" style={{ color: BRAND.textMuted }}>
                    {formatBps(m.spread)}
                  </div>
                  <div className="col-span-1 text-right tabular-nums" style={{ color: m.uptime > 99 ? BRAND.success : BRAND.warning }}>
                    {m.uptime.toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ color: sb.color, backgroundColor: sb.bg }}
                    >
                      {sb.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PoolsTab({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  riskFilter,
  setRiskFilter,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  list,
  onOpen,
  searchRef,
}: {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: PoolType | 'all';
  setTypeFilter: (v: PoolType | 'all') => void;
  riskFilter: PoolRisk | 'all';
  setRiskFilter: (v: PoolRisk | 'all') => void;
  sortBy: 'updated' | 'volume' | 'apr' | 'name';
  setSortBy: (v: 'updated' | 'volume' | 'apr' | 'name') => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;
  list: LiquidityPool[];
  onOpen: (type: DrawerType, payload?: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl flex items-center gap-3 flex-wrap"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索交易对..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
          />
        </div>
        <FilterPillGroup<PoolType>
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'amm', label: 'AMM' },
            { value: 'orderbook', label: '订单簿' },
            { value: 'clob', label: '中央限价' },
            { value: 'rfq', label: 'RFQ' },
            { value: 'stable', label: '稳定币' },
            { value: 'perpetual', label: '永续' },
          ]}
        />
        <FilterPillGroup<PoolRisk>
          value={riskFilter}
          onChange={setRiskFilter}
          options={[
            { value: 'all', label: '全部风险' },
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'very-high', label: '极高' },
          ]}
        />
        <SortGroup sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} options={[
          { value: 'updated', label: 'TVL' },
          { value: 'volume', label: '24H 量' },
          { value: 'apr', label: 'APR' },
          { value: 'name', label: '名称' },
        ]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pm-stagger">
        {list.length === 0 ? (
          <div className="col-span-2">
            <EmptyState label="暂无匹配的流动性池" />
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              onClick={() => onOpen('pool', p.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold" style={{ color: BRAND.text }}>
                      {p.pair}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded text-[10px]"
                      style={{ color: riskColor(p.risk), backgroundColor: `${riskColor(p.risk)}15` }}
                    >
                      {riskLabel(p.risk)}
                    </span>
                    {p.incentivized && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                        style={{ color: BRAND.primary, backgroundColor: `${BRAND.primary}15` }}
                      >
                        <Sparkles size={10} />
                        激励
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                    {poolTypeLabel(p.type)} · {p.lpToken} · 审计: {p.audit}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums" style={{ color: BRAND.success }}>
                    {p.apr.toFixed(1)}%
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>
                    APR
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                  <div style={{ color: BRAND.textMuted }}>TVL</div>
                  <div className="text-sm font-medium tabular-nums" style={{ color: BRAND.text }}>
                    ${formatNumber(p.tvl)}
                  </div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>24H 量</div>
                  <div className="text-sm font-medium tabular-nums" style={{ color: BRAND.text }}>
                    ${formatNumber(p.volume24h)}
                  </div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>利用率</div>
                  <div className="text-sm font-medium tabular-nums" style={{ color: BRAND.text }}>
                    {p.utilization}%
                  </div>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${p.utilization}%`,
                    backgroundColor: p.utilization > 80 ? BRAND.danger : p.utilization > 50 ? BRAND.warning : BRAND.primary,
                  }}
                />
              </div>
              <div className="text-xs mt-3 line-clamp-2" style={{ color: BRAND.textMuted }}>
                {p.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DepthTab({
  orderbooks,
  activeIdx,
  setActiveIdx,
  depthPulse,
  onOpen,
}: {
  orderbooks: OrderbookSnapshot[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  depthPulse: number;
  onOpen: (type: DrawerType, payload?: string) => void;
}) {
  const ob = orderbooks[activeIdx];
  const maxSize = Math.max(...ob.bids.map((b) => b.size), ...ob.asks.map((a) => a.size));
  return (
    <div className="space-y-4">
      {/* 交易对切换 */}
      <div className="flex items-center gap-2 flex-wrap">
        {orderbooks.map((o, i) => (
          <button
            key={o.pair}
            onClick={() => setActiveIdx(i)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: i === activeIdx ? BRAND.card : 'transparent',
              color: i === activeIdx ? BRAND.primary : BRAND.textMuted,
              border: `1px solid ${i === activeIdx ? BRAND.primary : BRAND.border}`,
            }}
          >
            {o.pair}
            {i === activeIdx && (
              <span className="inline-block w-1.5 h-1.5 rounded-full pm-pulse" style={{ backgroundColor: BRAND.success }} />
            )}
          </button>
        ))}
        <span className="ml-auto text-xs flex items-center gap-1" style={{ color: BRAND.textMuted }}>
          <Clock size={12} />
          Tick #{depthPulse}
        </span>
      </div>

      {/* 行情概览 */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-baseline gap-4 flex-wrap">
          <div>
            <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
              最新价
            </div>
            <div className="text-3xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
              {ob.lastPrice.toLocaleString(undefined, { minimumFractionDigits: ob.lastPrice > 1000 ? 0 : 4 })}
            </div>
          </div>
          <div className="text-xl font-medium" style={{ color: ob.change24h >= 0 ? BRAND.success : BRAND.danger }}>
            {formatPercent(ob.change24h)}
          </div>
          <div className="ml-auto grid grid-cols-4 gap-6 text-xs">
            <div>
              <div style={{ color: BRAND.textMuted }}>24H 高</div>
              <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>
                {ob.high24h.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: BRAND.textMuted }}>24H 低</div>
              <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>
                {ob.low24h.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: BRAND.textMuted }}>24H 量</div>
              <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>
                ${formatNumber(ob.volume24h)}
              </div>
            </div>
            <div>
              <div style={{ color: BRAND.textMuted }}>价差</div>
              <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>
                {formatBps(ob.spread)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 盘口深度图 */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: BRAND.text }}>
            盘口深度（{ob.pair}）
          </h3>
          <button
            onClick={() => onOpen('depth', ob.pair)}
            className="text-xs flex items-center gap-1"
            style={{ color: BRAND.primary }}
          >
            详情 <ExternalLink size={12} />
          </button>
        </div>
        <OrderbookView snapshot={ob} maxSize={maxSize} detailed />
      </div>

      {/* 深度统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pm-stagger">
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
            ±2% 深度
          </div>
          <div className="text-xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
            ${formatNumber(ob.depth2pct)}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
            买盘档数
          </div>
          <div className="text-xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
            {ob.bids.length}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
            卖盘档数
          </div>
          <div className="text-xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
            {ob.asks.length}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
            中间价
          </div>
          <div className="text-xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
            {ob.midPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderbookView({
  snapshot,
  compact,
  detailed,
  maxSize,
}: {
  snapshot: OrderbookSnapshot;
  compact?: boolean;
  detailed?: boolean;
  maxSize?: number;
}) {
  const max = maxSize || Math.max(...snapshot.bids.map((b) => b.size), ...snapshot.asks.map((a) => a.size));
  return (
    <div>
      {!compact && (
        <div className="grid grid-cols-4 gap-2 px-2 py-1.5 text-[10px] font-medium" style={{ color: BRAND.textMuted }}>
          <div>价格</div>
          <div className="text-right">数量</div>
          <div className="text-right">累计</div>
          <div className="text-right">做市商</div>
        </div>
      )}
      {/* 卖盘（倒序） */}
      <div className="space-y-px">
        {snapshot.asks.slice().reverse().map((ask, i) => (
          <div
            key={`a-${i}`}
            className="relative grid grid-cols-4 gap-2 px-2 py-1.5 text-xs"
            style={{ color: BRAND.text }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to left, rgba(239,68,68,0.15) 0%, transparent ${(ask.size / max) * 100}%)`,
              }}
            />
            <div className="relative tabular-nums" style={{ color: BRAND.danger }}>
              {ask.price.toLocaleString(undefined, { minimumFractionDigits: snapshot.lastPrice > 1000 ? 0 : 4 })}
            </div>
            <div className="relative text-right tabular-nums">{ask.size.toLocaleString()}</div>
            <div className="relative text-right tabular-nums" style={{ color: BRAND.textMuted }}>
              {ask.total.toLocaleString()}
            </div>
            <div className="relative text-right text-[10px] truncate" style={{ color: BRAND.textMuted }}>
              {ask.maker}
            </div>
          </div>
        ))}
      </div>
      {/* 中间价 */}
      <div
        className="my-2 px-3 py-2 rounded flex items-center justify-between text-sm font-medium"
        style={{ backgroundColor: BRAND.bg, color: BRAND.text }}
      >
        <span className="tabular-nums">
          {snapshot.midPrice.toLocaleString(undefined, { minimumFractionDigits: snapshot.lastPrice > 1000 ? 0 : 4 })}
        </span>
        <span className="text-xs" style={{ color: snapshot.change24h >= 0 ? BRAND.success : BRAND.danger }}>
          {formatPercent(snapshot.change24h)}
        </span>
      </div>
      {/* 买盘 */}
      <div className="space-y-px">
        {snapshot.bids.map((bid, i) => (
          <div
            key={`b-${i}`}
            className="relative grid grid-cols-4 gap-2 px-2 py-1.5 text-xs"
            style={{ color: BRAND.text }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to left, rgba(20,184,129,0.15) 0%, transparent ${(bid.size / max) * 100}%)`,
              }}
            />
            <div className="relative tabular-nums" style={{ color: BRAND.success }}>
              {bid.price.toLocaleString(undefined, { minimumFractionDigits: snapshot.lastPrice > 1000 ? 0 : 4 })}
            </div>
            <div className="relative text-right tabular-nums">{bid.size.toLocaleString()}</div>
            <div className="relative text-right tabular-nums" style={{ color: BRAND.textMuted }}>
              {bid.total.toLocaleString()}
            </div>
            <div className="relative text-right text-[10px] truncate" style={{ color: BRAND.textMuted }}>
              {bid.maker}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiningTab({
  list,
  statusFilter,
  setStatusFilter,
  calcStake,
  setCalcStake,
  calcResults,
  onOpen,
}: {
  list: MiningProgram[];
  statusFilter: MiningProgram['status'] | 'all';
  setStatusFilter: (v: MiningProgram['status'] | 'all') => void;
  calcStake: string;
  setCalcStake: (v: string) => void;
  calcResults: { pair: string; apr: number; dailyReward: number; monthlyReward: number; yearlyReward: number }[];
  onOpen: (type: DrawerType, payload?: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl flex items-center gap-3 flex-wrap"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <FilterPillGroup<MiningProgram['status']>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'live', label: '进行中' },
            { value: 'upcoming', label: '即将开始' },
            { value: 'ended', label: '已结束' },
          ]}
        />
        <span className="ml-auto text-xs" style={{ color: BRAND.textMuted }}>
          奖励按 TVL 加权 · 实时估算
        </span>
      </div>

      {/* 奖励计算器 */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calculator size={18} style={{ color: BRAND.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: BRAND.text }}>
            收益计算器
          </h3>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm" style={{ color: BRAND.textMuted }}>
            投入本金 (USDT)
          </label>
          <input
            type="number"
            value={calcStake}
            onChange={(e) => setCalcStake(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm focus:outline-none w-40"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pm-stagger">
          {calcResults.map((r) => (
            <div
              key={r.pair}
              className="p-4 rounded-lg"
              style={{ backgroundColor: BRAND.cardHover, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>
                {r.pair}
              </div>
              <div className="text-xl font-semibold tabular-nums mb-2" style={{ color: BRAND.success }}>
                {r.apr.toFixed(1)}% APR
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: BRAND.textMuted }}>日收益</span>
                  <span className="tabular-nums" style={{ color: BRAND.text }}>
                    ${r.dailyReward.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: BRAND.textMuted }}>月收益</span>
                  <span className="tabular-nums" style={{ color: BRAND.text }}>
                    ${r.monthlyReward.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: BRAND.textMuted }}>年收益</span>
                  <span className="tabular-nums font-semibold" style={{ color: BRAND.success }}>
                    ${r.yearlyReward.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 挖矿计划列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pm-stagger">
        {list.map((m) => {
          const sb = miningStatusBadge(m.status);
          const progress = ((m.totalReward - m.remainingReward) / m.totalReward) * 100;
          return (
            <div
              key={m.id}
              className="p-5 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              onClick={() => onOpen('mining', m.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold" style={{ color: BRAND.text }}>
                    {m.name}
                  </h4>
                  <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                    {m.pool} · {m.duration} · {m.token} 奖励
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ color: sb.color, backgroundColor: sb.bg }}
                >
                  {sb.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                <div>
                  <div style={{ color: BRAND.textMuted }}>APR</div>
                  <div className="text-base font-semibold tabular-nums" style={{ color: BRAND.success }}>
                    {m.apr.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>参与人数</div>
                  <div className="text-base font-semibold tabular-nums" style={{ color: BRAND.text }}>
                    {m.participants.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>倍数</div>
                  <div className="text-base font-semibold tabular-nums" style={{ color: BRAND.text }}>
                    {m.multiplier.toFixed(1)}x
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: BRAND.textMuted }}>奖励进度</span>
                  <span className="tabular-nums" style={{ color: BRAND.text }}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${progress}%`, backgroundColor: BRAND.primary }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
                  <span>已发 {formatNumber(m.totalReward - m.remainingReward)}</span>
                  <span>剩余 {formatNumber(m.remainingReward)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CopyTab({ list, onOpen }: { list: CopyStrategy[]; onOpen: (type: DrawerType, payload?: string) => void }) {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl flex items-center gap-3"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <Users size={18} style={{ color: BRAND.primary }} />
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>
            跟单做市
          </h3>
          <p className="text-xs" style={{ color: BRAND.textMuted }}>
            跟随顶级做市商策略，按比例分享做市收益。策略数据为历史回测与 mock 演示，不构成收益保证。
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pm-stagger">
        {list.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            onClick={() => onOpen('copy', c.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-base" style={{ color: BRAND.text }}>
                  {c.strategyName}
                </h4>
                <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                  by {c.maker}
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[10px]"
                style={{
                  color: c.risk === 'low' ? BRAND.success : c.risk === 'medium' ? BRAND.warning : BRAND.danger,
                  backgroundColor: (c.risk === 'low' ? BRAND.success : c.risk === 'medium' ? BRAND.warning : BRAND.danger) + '15',
                }}
              >
                {c.risk === 'low' ? '低风险' : c.risk === 'medium' ? '中风险' : '高风险'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <div style={{ color: BRAND.textMuted }}>30 日收益</div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: c.pnl30d >= 0 ? BRAND.success : BRAND.danger }}>
                  {formatPercent(c.pnl30d)}
                </div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>90 日收益</div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: c.pnl90d >= 0 ? BRAND.success : BRAND.danger }}>
                  {formatPercent(c.pnl90d)}
                </div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>最大回撤</div>
                <div className="text-base tabular-nums" style={{ color: BRAND.danger }}>
                  -{c.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: BRAND.textMuted }}>夏普比率</div>
                <div className="text-base tabular-nums" style={{ color: BRAND.text }}>
                  {c.sharpe.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textMuted }}>
              <span>跟单 {c.followers.toLocaleString()} 人</span>
              <span>·</span>
              <span>AUM ${formatNumber(c.aum)}</span>
              <span>·</span>
              <span>分成 {c.feeShare}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeesTab({ tiers, onOpen }: { tiers: FeeTier[]; onOpen: (type: DrawerType, payload?: string) => void }) {
  return (
    <div className="space-y-4">
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
          <Award size={18} style={{ color: BRAND.primary }} />
          VIP 费率阶梯
        </h3>
        <p className="text-xs mb-4" style={{ color: BRAND.textMuted }}>
          30 日成交量决定 VIP 等级。Maker 费率为负表示平台返还做市商。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}` }}>
                <th className="text-left py-2 px-2">等级</th>
                <th className="text-right py-2 px-2">30 日量</th>
                <th className="text-right py-2 px-2">Maker</th>
                <th className="text-right py-2 px-2">Taker</th>
                <th className="text-left py-2 px-2">权益</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr
                  key={t.level}
                  className="pm-row"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}
                >
                  <td className="py-3 px-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ color: t.color, backgroundColor: `${t.color}15` }}
                    >
                      {t.badge} {t.level}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums" style={{ color: BRAND.text }}>
                    ≥ ${formatNumber(t.thirtyDayVolume)}
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums" style={{ color: t.maker < 0 ? BRAND.success : BRAND.text }}>
                    {t.maker.toFixed(1)} bps
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums" style={{ color: BRAND.text }}>
                    {t.taker.toFixed(1)} bps
                  </td>
                  <td className="py-3 px-2 text-xs" style={{ color: BRAND.textMuted }}>
                    {t.perks.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApplyTab({
  step,
  setStep,
  type,
  setType,
  company,
  setCompany,
  contact,
  setContact,
  email,
  setEmail,
  region,
  setRegion,
  strategy,
  setStrategy,
  pairs,
  setPairs,
  volume,
  setVolume,
  onSubmit,
  applications,
  onOpen,
}: {
  step: number;
  setStep: (v: number) => void;
  type: 'maker' | 'liquidity' | 'partner';
  setType: (v: 'maker' | 'liquidity' | 'partner') => void;
  company: string;
  setCompany: (v: string) => void;
  contact: string;
  setContact: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  strategy: string;
  setStrategy: (v: string) => void;
  pairs: string;
  setPairs: (v: string) => void;
  volume: string;
  setVolume: (v: string) => void;
  onSubmit: () => void;
  applications: Application[];
  onOpen: (type: DrawerType, payload?: string) => void;
}) {
  const steps = ['选择类型', '基本信息', '资质材料', '报价策略', '完成'];
  return (
    <div className="space-y-4">
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
          <UserPlus size={18} style={{ color: BRAND.primary }} />
          做市商 / 流动性 / 生态 申请入驻
        </h3>
        <p className="text-xs mb-4" style={{ color: BRAND.textMuted }}>
          本向导仅做 UI 演示，不接真实审核流程。提交后可在「我的申请」中查看进度。
        </p>
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: i <= step ? BRAND.primary : BRAND.bg,
                    color: i <= step ? '#000' : BRAND.textMuted,
                    border: `1px solid ${i <= step ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className="text-xs" style={{ color: i === step ? BRAND.text : BRAND.textMuted }}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ backgroundColor: i < step ? BRAND.primary : BRAND.border }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'maker' as const, label: '做市商', icon: Handshake, desc: '提供双向报价 / 赚取 Maker 返佣' },
              { value: 'liquidity' as const, label: '流动性提供方', icon: Layers, desc: '向流动性池注入资金 / 赚取 APR' },
              { value: 'partner' as const, label: '生态合作', icon: Handshake, desc: '联合做市 / 跨链 / 集成' },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className="p-4 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: type === opt.value ? `${BRAND.primary}15` : BRAND.bg,
                    border: `1px solid ${type === opt.value ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  <Icon size={20} style={{ color: type === opt.value ? BRAND.primary : BRAND.textMuted }} />
                  <div className="mt-2 font-medium" style={{ color: BRAND.text }}>
                    {opt.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="公司名称" value={company} onChange={setCompany} placeholder="如：Demo Quant MM" />
            <Field label="联系人" value={contact} onChange={setContact} placeholder="姓名" />
            <Field label="邮箱" value={email} onChange={setEmail} placeholder="bd@company.com" />
            <SelectField label="区域" value={region} onChange={setRegion} options={['亚太', '欧洲', '北美', '中东', '南美', '非洲', '大洋洲', '全球']} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px dashed ${BRAND.border}` }}>
              📎 营业执照、KYB 资料、实益所有人证明、合规内控制度（演示模式，不实际上传）
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['营业执照', 'KYB 资料', '实益所有人', '合规内控'].map((m) => (
                <div
                  key={m}
                  className="p-3 rounded-lg text-center text-xs"
                  style={{ backgroundColor: BRAND.cardHover, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}
                >
                  <Upload size={20} className="mx-auto mb-1" />
                  {m}（点击上传 / 演示）
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <Field label="做市策略描述" value={strategy} onChange={setStrategy} placeholder="如：多因子统计套利 + 跨交易所价差对冲" />
            <Field label="目标交易对" value={pairs} onChange={setPairs} placeholder="如：BTC/USDT, ETH/USDT" />
            <Field label="预期日成交量 (USDT)" value={volume} onChange={setVolume} type="number" />
          </div>
        )}
        {step === 4 && (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: BRAND.success }} />
            <h4 className="text-lg font-semibold mb-1" style={{ color: BRAND.text }}>
              申请已提交
            </h4>
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              预计 3-5 个工作日内反馈初审意见，可在「我的申请」中查看进度。
            </p>
          </div>
        )}
        <div className="flex justify-between mt-5">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || step === 4}
            className="px-4 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-40"
            style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <ChevronLeft size={14} /> 上一步
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-1"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              下一步 <ChevronRight size={14} />
            </button>
          ) : step === 3 ? (
            <button
              onClick={onSubmit}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-1"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              提交申请 <CheckCircle2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              重新申请
            </button>
          )}
        </div>
      </div>

      {/* 我的申请 */}
      <div
        className="p-5 rounded-xl"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <FileText size={16} style={{ color: BRAND.primary }} />
          我的申请
        </h3>
        <div className="space-y-2">
          {applications.map((a) => {
            const sc = applyStageColor(a.stage);
            return (
              <div
                key={a.id}
                className="p-3 rounded-lg pm-row cursor-pointer"
                onClick={() => onOpen('apply', a.id)}
                style={{ backgroundColor: BRAND.cardHover, border: `1px solid ${BRAND.border}` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>
                      {a.company}
                    </div>
                    <div className="text-xs" style={{ color: BRAND.textMuted }}>
                      {a.id} · {a.contact} · {a.region}
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px]"
                    style={{ color: sc, backgroundColor: `${sc}15` }}
                  >
                    {applyStageLabel(a.stage)}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full transition-all" style={{ width: `${a.progress}%`, backgroundColor: BRAND.primary }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
                  <span>提交 {a.submittedAt}</span>
                  <span>更新 {a.updatedAt} · 进度 {a.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HelpTab({ onOpen, onTab }: { onOpen: (type: DrawerType, payload?: string) => void; onTab: (t: Tab) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pm-stagger">
      <HelpCard
        icon={Keyboard}
        title="快捷键"
        items={[
          { k: '/', d: '聚焦搜索' },
          { k: 'Esc', d: '关闭抽屉 / 弹窗' },
          { k: '?', d: '打开/关闭帮助' },
          { k: '1-9', d: '切换 Tab' },
        ]}
      />
      <HelpCard
        icon={Sparkles}
        title="挖矿提示"
        items={[
          { k: 'APR', d: '按当前 TVL 加权估算，随资金进出动态变化' },
          { k: '锁仓', d: '部分激励含锁仓期，提前提取将损失奖励' },
          { k: 'IL', d: 'AMM 池存在无常损失风险，请评估后参与' },
        ]}
      />
      <HelpCard
        icon={Handshake}
        title="做市商提示"
        items={[
          { k: '返佣', d: 'Maker 负费率 = 平台返还，激励持续做市' },
          { k: 'Uptime', d: '99.9% 以上 Uptime 享受完整激励' },
          { k: '撤单率', d: '超过 20% 撤单率会触发降级' },
        ]}
      />
      <HelpCard
        icon={Shield}
        title="合规与免责"
        items={[
          { k: '数据', d: '所有数据为 mock 演示，不构成投资建议' },
          { k: '收益', d: 'APR / PnL / 奖励均为估算，不保证未来收益' },
          { k: '持牌', d: '本页内容均为合规研究方向，不代表持牌' },
        ]}
        onClick={() => onTab('apply')}
      />
    </div>
  );
}

// ============== 通用小组件 ==============

function FilterPillGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | 'all';
  onChange: (v: T | 'all') => void;
  options: { value: T | 'all'; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value as T | 'all')}
          className="px-2.5 py-1 rounded text-xs transition-colors"
          style={{
            backgroundColor: value === opt.value ? `${BRAND.primary}20` : 'transparent',
            color: value === opt.value ? BRAND.primary : BRAND.textMuted,
            border: `1px solid ${value === opt.value ? BRAND.primary : BRAND.border}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SortGroup({
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  options,
}: {
  sortBy: string;
  setSortBy: (v: any) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-2 py-1 rounded text-xs focus:outline-none"
        style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        className="p-1 rounded"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}
        title={sortDir === 'asc' ? '升序' : '降序'}
      >
        {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-12" style={{ color: BRAND.textMuted }}>
      <Inbox size={32} className="mx-auto mb-2 opacity-40" />
      <div className="text-sm">{label}</div>
    </div>
  );
}

function HelpCard({
  icon: Icon,
  title,
  items,
  onClick,
}: {
  icon: any;
  title: string;
  items: { k: string; d: string }[];
  onClick?: () => void;
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: BRAND.primary }} />
        <h4 className="font-semibold" style={{ color: BRAND.text }}>
          {title}
        </h4>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono flex-shrink-0"
              style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}
            >
              {it.k}
            </span>
            <span style={{ color: BRAND.textMuted }}>{it.d}</span>
          </div>
        ))}
      </div>
      {onClick && (
        <button
          onClick={onClick}
          className="mt-3 w-full text-xs py-2 rounded-lg flex items-center justify-center gap-1"
          style={{ backgroundColor: BRAND.cardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
        >
          前往 <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

function Drawer({
  state,
  maker,
  pool,
  program,
  strategy,
  onClose,
}: {
  state: DrawerState;
  maker: Maker | null;
  pool: LiquidityPool | null;
  program: MiningProgram | null;
  strategy: CopyStrategy | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full overflow-y-auto pm-drawer"
        style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>
            {state.type === 'maker' && '做市商详情'}
            {state.type === 'pool' && '流动性池详情'}
            {state.type === 'depth' && '报价深度详情'}
            {state.type === 'mining' && '挖矿计划详情'}
            {state.type === 'copy' && '跟单策略详情'}
            {state.type === 'apply' && '申请进度'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {state.type === 'maker' && maker && <MakerDetail maker={maker} />}
          {state.type === 'pool' && pool && <PoolDetail pool={pool} />}
          {state.type === 'depth' && <DepthDetail pair={state.payload || ''} />}
          {state.type === 'mining' && program && <MiningDetail program={program} />}
          {state.type === 'copy' && strategy && <CopyDetail strategy={strategy} />}
          {state.type === 'apply' && <ApplicationDetail id={state.payload || ''} />}
        </div>
      </div>
    </div>
  );
}

function MakerDetail({ maker }: { maker: Maker }) {
  const sb = statusBadge(maker.status);
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>
            {maker.name}
          </h2>
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{ color: levelColor(maker.level), backgroundColor: `${levelColor(maker.level)}15` }}
          >
            {levelLabel(maker.level)}
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{ color: sb.color, backgroundColor: sb.bg }}
          >
            {sb.label}
          </span>
        </div>
        <p className="text-sm" style={{ color: BRAND.textMuted }}>
          {maker.description}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="日成交量" value={`$${formatNumber(maker.dailyVolume)}`} />
        <Stat label="市场份额" value={`${maker.makerShare}%`} />
        <Stat label="做市币对" value={`${maker.pairs}`} />
        <Stat label="Uptime" value={`${maker.uptime.toFixed(2)}%`} />
        <Stat label="点差" value={formatBps(maker.spread)} />
        <Stat label="返佣" value={formatBps(maker.rebate)} />
        <Stat label="AUM" value={`$${formatNumber(maker.aum)}`} />
        <Stat label="跟单人数" value={maker.followers.toLocaleString()} />
      </div>
      <Panel title="做市策略">
        <div className="text-sm" style={{ color: BRAND.text }}>
          {maker.strategy}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {maker.highlights.map((h, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primary }}>
              {h}
            </span>
          ))}
        </div>
      </Panel>
      <Panel title="联系方式">
        <div className="space-y-1 text-xs" style={{ color: BRAND.textMuted }}>
          <div>📧 {maker.contacts}</div>
          <div>🌐 {maker.website}</div>
          <div>🛡 {maker.audit}</div>
        </div>
      </Panel>
      <Panel title="合规">
        <div className="flex flex-wrap gap-1.5">
          {maker.compliance.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
              {c}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PoolDetail({ pool }: { pool: LiquidityPool }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>
            {pool.pair}
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{ color: riskColor(pool.risk), backgroundColor: `${riskColor(pool.risk)}15` }}>
            {riskLabel(pool.risk)}
          </span>
        </div>
        <p className="text-sm" style={{ color: BRAND.textMuted }}>{pool.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="TVL" value={`$${formatNumber(pool.tvl)}`} />
        <Stat label="24H 量" value={`$${formatNumber(pool.volume24h)}`} />
        <Stat label="24H 手续费" value={`$${formatNumber(pool.fees24h, 0)}`} />
        <Stat label="利用率" value={`${pool.utilization}%`} />
        <Stat label="基础 APR" value={`${pool.aprBase.toFixed(1)}%`} />
        <Stat label="奖励 APR" value={`${pool.aprReward.toFixed(1)}%`} />
        <Stat label="总 APR" value={`${pool.apr.toFixed(1)}%`} accent={BRAND.success} />
        <Stat label="容量" value={`$${formatNumber(pool.capacity)}`} />
        <Stat label="锁仓期" value={`${pool.lockupDays} 天`} />
        <Stat label="IL 风险" value={pool.impermanentRisk === 'low' ? '低' : pool.impermanentRisk === 'medium' ? '中' : '高'} />
      </div>
      <Panel title="LP 代币">
        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{pool.lpToken}</div>
      </Panel>
      <Panel title="储备金">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div style={{ color: BRAND.textMuted }}>{pool.baseSymbol}</div>
            <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>{pool.reserves.base.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: BRAND.textMuted }}>{pool.quoteSymbol}</div>
            <div className="text-sm tabular-nums" style={{ color: BRAND.text }}>{pool.reserves.quote.toLocaleString()}</div>
          </div>
        </div>
      </Panel>
      <Panel title="奖励代币">
        <div className="flex flex-wrap gap-1.5">
          {pool.rewards.map((r, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primary }}>
              {r}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function DepthDetail({ pair }: { pair: string }) {
  const ob = ORDERBOOK.find((o) => o.pair === pair) || ORDERBOOK[0];
  const totalBids = ob.bids.reduce((s, b) => s + b.size, 0);
  const totalAsks = ob.asks.reduce((s, a) => s + a.size, 0);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: BRAND.text }}>{ob.pair} 深度</h2>
        <p className="text-sm" style={{ color: BRAND.textMuted }}>实时盘口深度（mock 演示）</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="买盘总量" value={totalBids.toLocaleString()} />
        <Stat label="卖盘总量" value={totalAsks.toLocaleString()} />
        <Stat label="价差" value={formatBps(ob.spread)} />
      </div>
      <Panel title="买盘">
        <div className="space-y-1">
          {ob.bids.map((b, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span style={{ color: BRAND.success }}>{b.price}</span>
              <span style={{ color: BRAND.text }}>{b.size.toLocaleString()}</span>
              <span style={{ color: BRAND.textMuted }}>{b.maker}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="卖盘">
        <div className="space-y-1">
          {ob.asks.map((a, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span style={{ color: BRAND.danger }}>{a.price}</span>
              <span style={{ color: BRAND.text }}>{a.size.toLocaleString()}</span>
              <span style={{ color: BRAND.textMuted }}>{a.maker}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MiningDetail({ program }: { program: MiningProgram }) {
  const sb = miningStatusBadge(program.status);
  const progress = ((program.totalReward - program.remainingReward) / program.totalReward) * 100;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>{program.name}</h2>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{ color: sb.color, backgroundColor: sb.bg }}>{sb.label}</span>
        </div>
        <p className="text-sm" style={{ color: BRAND.textMuted }}>{program.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="APR" value={`${program.apr.toFixed(1)}%`} accent={BRAND.success} />
        <Stat label="参与人数" value={program.participants.toLocaleString()} />
        <Stat label="总奖励" value={`${formatNumber(program.totalReward)} ${program.token}`} />
        <Stat label="剩余奖励" value={`${formatNumber(program.remainingReward)} ${program.token}`} />
        <Stat label="最低投入" value={`${formatNumber(program.minStake)} USDT`} />
        <Stat label="单人上限" value={`${formatNumber(program.cap)} USDT`} />
        <Stat label="锁仓期" value={`${program.vestingDays} 天`} />
        <Stat label="倍数" value={`${program.multiplier.toFixed(1)}x`} />
      </div>
      <Panel title="奖励进度">
        <div className="space-y-1.5">
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
            <div className="h-full" style={{ width: `${progress}%`, backgroundColor: BRAND.primary }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: BRAND.textMuted }}>
            <span>已发 {progress.toFixed(1)}%</span>
            <span>剩余 {formatNumber(program.remainingReward)} {program.token}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CopyDetail({ strategy }: { strategy: CopyStrategy }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: BRAND.text }}>{strategy.strategyName}</h2>
        <p className="text-xs" style={{ color: BRAND.textMuted }}>by {strategy.maker}</p>
        <p className="text-sm mt-2" style={{ color: BRAND.textMuted }}>{strategy.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="30 日 PnL" value={formatPercent(strategy.pnl30d)} accent={strategy.pnl30d >= 0 ? BRAND.success : BRAND.danger} />
        <Stat label="90 日 PnL" value={formatPercent(strategy.pnl90d)} accent={strategy.pnl90d >= 0 ? BRAND.success : BRAND.danger} />
        <Stat label="最大回撤" value={`-${strategy.maxDrawdown.toFixed(1)}%`} accent={BRAND.danger} />
        <Stat label="夏普比率" value={strategy.sharpe.toFixed(2)} />
        <Stat label="AUM" value={`$${formatNumber(strategy.aum)}`} />
        <Stat label="跟单人数" value={strategy.followers.toLocaleString()} />
        <Stat label="分成" value={`${strategy.feeShare}%`} />
        <Stat label="净值" value={strategy.netValue.toFixed(3)} />
        <Stat label="容量" value={`$${formatNumber(strategy.capacity)}`} />
        <Stat label="风险" value={strategy.risk === 'low' ? '低' : strategy.risk === 'medium' ? '中' : '高'} />
      </div>
      <Panel title="交易对">
        <div className="flex flex-wrap gap-1.5">
          {strategy.pairs.map((p, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primary }}>
              {p}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ApplicationDetail({ id }: { id: string }) {
  const a = APPLICATIONS.find((x) => x.id === id);
  if (!a) return <div className="text-sm" style={{ color: BRAND.textMuted }}>未找到申请</div>;
  const sc = applyStageColor(a.stage);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: BRAND.text }}>{a.company}</h2>
        <span className="text-xs px-2 py-0.5 rounded inline-block" style={{ color: sc, backgroundColor: `${sc}15` }}>
          {applyStageLabel(a.stage)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="联系人" value={a.contact} />
        <Stat label="邮箱" value={a.email} />
        <Stat label="区域" value={a.region} />
        <Stat label="审核人" value={a.reviewer} />
        <Stat label="提交时间" value={a.submittedAt} />
        <Stat label="更新时间" value={a.updatedAt} />
        <Stat label="预期量" value={`$${formatNumber(a.expectedVolume)}`} />
        <Stat label="目标费率" value={a.feeTier} />
        <Stat label="进度" value={`${a.progress}%`} accent={BRAND.primary} />
        <Stat label="类型" value={a.type === 'maker' ? '做市商' : a.type === 'liquidity' ? '流动性' : '生态合作'} />
      </div>
      <Panel title="描述">
        <div className="text-sm" style={{ color: BRAND.text }}>{a.description}</div>
      </Panel>
      <Panel title="策略">
        <div className="text-sm" style={{ color: BRAND.text }}>{a.strategy}</div>
      </Panel>
      <Panel title="目标交易对">
        <div className="flex flex-wrap gap-1.5">
          {a.pairs.map((p, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primary }}>{p}</span>
          ))}
        </div>
      </Panel>
      <Panel title="时间线">
        <div className="space-y-2">
          {a.timeline.map((t, i) => {
            const tsc = applyStageColor(t.stage);
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: tsc }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: BRAND.text }}>{applyStageLabel(t.stage)}</span>
                    <span style={{ color: BRAND.textMuted }}>· {t.timestamp}</span>
                  </div>
                  <div style={{ color: BRAND.textMuted }}>{t.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <h4 className="text-xs font-medium mb-2" style={{ color: BRAND.textMuted }}>{title}</h4>
      {children}
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
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto pm-drawer"
        style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: '/', d: '聚焦搜索' },
            { k: 'Esc', d: '关闭抽屉 / 帮助 / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab（总览/做市商/.../帮助）' },
          ].map((it) => (
            <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <span
                className="px-2 py-0.5 rounded text-xs font-mono"
                style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}
              >
                {it.k}
              </span>
              <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
