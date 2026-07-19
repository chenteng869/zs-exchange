'use client';

/**
 * PortalAnalytics - 链上数据分析中心 (2026-07-19 Q05 P3.32)
 *
 * 页面定位：
 * - 中萨数字科技交易所 链上数据分析中心
 * - 市场概览 / 链上指标 / 巨鲸追踪 / DeFi 数据 / NFT 数据 / 跨链数据 / 研究洞察 / 数据 API
 * - 与 P3.4 现货 + P3.17 API + P3.25 做市 + P3.26 衍生品 + P3.27 量化 +
 *   P3.28 NFT + P3.29 DeFi + P3.30 跨链 + P3.31 节点形成"节点-跨链-DeFi-NFT-数据洞察"全维度数据闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 链上指标 / 巨鲸追踪 / DeFi 数据 / NFT 数据 / 跨链数据 / 研究洞察 / 数据 API / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有市场 / 链上 / 巨鲸 / DeFi / NFT / 跨链 / 研究数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"链上数据研究分析方向"定性；不构成投资建议
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Activity,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  FileText,
  Code2,
  Terminal,
  Database,
  Server,
  Cloud,
  Globe2,
  Globe,
  Zap,
  Rocket,
  Flame,
  Settings,
  Sliders,
  Bell,
  BellOff,
  Mail,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
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
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  Coins,
  CircleDollarSign,
  Wallet,
  Tag,
  Tags,
  Layers,
  Box,
  Boxes,
  Hexagon,
  Diamond,
  Cpu,
  Network,
  GitBranch,
  MapPin,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Phone,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'onchain' | 'whale' | 'defi' | 'nft' | 'bridge' | 'research' | 'api' | 'help';
type ChainId = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'solana' | 'base' | 'zs-chain';
type DataCategory = 'l1' | 'l2' | 'defi' | 'nft' | 'meme' | 'rwa' | 'gaming' | 'infrastructure';
type IndicatorTrend = 'up' | 'down' | 'flat';
type MetricPeriod = '1h' | '24h' | '7d' | '30d';
type DrawerType = 'asset' | 'whale' | 'defi' | 'nft' | 'bridge' | 'research' | 'api' | 'apply' | 'help' | null;

interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId;
  category: DataCategory;
  rank: number;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  fdv: number;
  circulating: number;
  total: number;
  dominance: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  holders: number;
  tvl?: number;
  description: string;
  tags: string[];
  sparkline: number[];
  updatedAt: string;
}

interface OnchainMetric {
  id: string;
  name: string;
  chain: ChainId;
  category: 'addresses' | 'transactions' | 'tvl' | 'fees' | 'gas' | 'blocks' | 'validators';
  value: number;
  unit: string;
  change24h: number;
  trend: IndicatorTrend;
  period: MetricPeriod;
  history: number[];
  description: string;
  source: string;
  updatedAt: string;
  threshold?: { warning: number; critical: number };
}

interface Whale {
  id: string;
  address: string;
  label: string;
  type: 'individual' | 'exchange' | 'fund' | 'protocol' | 'foundation' | 'whale';
  chain: ChainId;
  netWorth: number;
  change24h: number;
  inflow24h: number;
  outflow24h: number;
  txCount24h: number;
  topHoldings: { symbol: string; value: number; pct: number }[];
  tags: string[];
  lastActive: string;
  description: string;
  alertEnabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  winRate: number;
  avgHoldTime: number;
}

interface DefiProtocol {
  id: string;
  name: string;
  symbol: string;
  chain: ChainId;
  category: 'dex' | 'lending' | 'staking' | 'derivatives' | 'yield' | 'bridge' | 'insurance' | 'rwa';
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  fees24h: number;
  revenue24h: number;
  users24h: number;
  token: string;
  tokenPrice: number;
  tokenChange24h: number;
  mcap: number;
  description: string;
  logo: string;
  launchDate: string;
  audits: string[];
  tags: string[];
}

interface NftCollection {
  id: string;
  name: string;
  symbol: string;
  chain: ChainId;
  category: 'art' | 'collectible' | 'gaming' | 'music' | 'photography' | 'utility' | 'metaverse';
  volume24h: number;
  volume7d: number;
  volumeTotal: number;
  sales24h: number;
  floorPrice: number;
  floorChange24h: number;
  owners: number;
  items: number;
  listed: number;
  marketCap: number;
  description: string;
  banner: string;
  verified: boolean;
  launchDate: string;
  tags: string[];
}

interface BridgeFlow {
  id: string;
  bridge: string;
  fromChain: ChainId;
  toChain: ChainId;
  asset: string;
  volume24h: number;
  volume7d: number;
  txCount24h: number;
  largeTxCount24h: number;
  avgAmount: number;
  netFlow: number;
  trend: IndicatorTrend;
  description: string;
}

interface ResearchReport {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  type: 'daily' | 'weekly' | 'monthly' | 'deep-dive' | 'event' | 'tokenomics';
  status: 'draft' | 'published' | 'archived';
  publishDate: string;
  category: string;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  summary: string;
  rating: number;
  premium: boolean;
  citedBy: number;
}

interface DataApi {
  id: string;
  name: string;
  category: 'market' | 'onchain' | 'whale' | 'defi' | 'nft' | 'bridge' | 'sentiment' | 'social';
  endpoint: string;
  method: 'GET' | 'POST' | 'WS';
  rateLimit: string;
  latency: string;
  uptime: number;
  callsToday: number;
  callsMonth: number;
  description: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  pricing: 'free' | 'freemium' | 'paid' | 'enterprise';
  tier: 'basic' | 'pro' | 'enterprise';
  documentation: string;
  tags: string[];
}

interface KpiSnapshot {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  totalTvl: number;
  tvlChange24h: number;
  totalAddresses: number;
  activeAddresses24h: number;
  totalTxs24h: number;
  avgGas: number;
  fearGreed: number;
  fearGreedLabel: string;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 工具 ==============

const CHAIN_LABELS: Record<ChainId, string> = {
  'eth': 'Ethereum',
  'bsc': 'BNB Chain',
  'polygon': 'Polygon',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  'avalanche': 'Avalanche',
  'solana': 'Solana',
  'base': 'Base',
  'zs-chain': 'ZS-Chain',
};

const CHAIN_COLORS: Record<ChainId, string> = {
  'eth': '#627EEA',
  'bsc': '#F3BA2F',
  'polygon': '#8247E5',
  'arbitrum': '#28A0F0',
  'optimism': '#FF0420',
  'avalanche': '#E84142',
  'solana': '#14F195',
  'base': '#0052FF',
  'zs-chain': BRAND.primary,
};

function formatTvl(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${((n) / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${((n) / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toString();
}

function changeColor(c: number): string {
  if (c > 0) return BRAND.primary;
  if (c < 0) return '#FF5050';
  return BRAND.textMuted;
}

function miniSparkline(data: number[], color: string = BRAND.primary, width: number = 80, height: number = 24): string {
  if (!data || data.length === 0) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" /></svg>`;
}

// ============== Mock 数据 ==============

const ASSETS: Asset[] = [
  {
    id: 'a-001', symbol: 'BTC', name: 'Bitcoin', chain: 'eth', category: 'l1', rank: 1,
    price: 67842.32, change1h: 0.42, change24h: 2.84, change7d: 8.4,
    volume24h: 28400000000, marketCap: 1340000000000, fdv: 1340000000000,
    circulating: 19720000, total: 21000000, dominance: 52.4, ath: 73800, athDate: '2024-12-05', atl: 67.81, atlDate: '2013-07-06',
    holders: 48200000, description: 'Bitcoin 是首个去中心化加密货币，采用 PoW 共识机制。',
    tags: ['PoW', 'L1', '主流', '价值存储'],
    sparkline: [62400, 63200, 63800, 64100, 64500, 65200, 65800, 66400, 67200, 67842],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-002', symbol: 'ETH', name: 'Ethereum', chain: 'eth', category: 'l1', rank: 2,
    price: 3842.18, change1h: 0.18, change24h: 1.42, change7d: 6.8,
    volume24h: 14800000000, marketCap: 462000000000, fdv: 462000000000,
    circulating: 120280000, total: 120280000, dominance: 18.2, ath: 4878, athDate: '2021-11-10', atl: 0.43, atlDate: '2015-10-21',
    holders: 248000000, description: 'Ethereum 是支持智能合约的 L1 区块链，DeFi 和 NFT 生态最为活跃。',
    tags: ['PoS', 'L1', '智能合约', 'DeFi'],
    sparkline: [3520, 3580, 3640, 3690, 3720, 3760, 3790, 3810, 3830, 3842],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-003', symbol: 'SOL', name: 'Solana', chain: 'solana', category: 'l1', rank: 5,
    price: 184.62, change1h: -0.42, change24h: 4.24, change7d: 12.4,
    volume24h: 3200000000, marketCap: 86000000000, fdv: 108000000000,
    circulating: 466000000, total: 584000000, dominance: 3.4, ath: 259.96, athDate: '2025-01-19', atl: 0.5, atlDate: '2020-05-11',
    holders: 12400000, description: 'Solana 是高性能 L1 区块链，专注于速度和低交易成本。',
    tags: ['PoS', 'L1', '高性能', 'DePIN'],
    sparkline: [164, 168, 172, 176, 178, 180, 182, 183, 184, 184.62],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-004', symbol: 'ZSD', name: 'ZSD Token', chain: 'zs-chain', category: 'l1', rank: 24,
    price: 1.0, change1h: 0.02, change24h: 0.18, change7d: 1.4,
    volume24h: 184000000, marketCap: 1240000000, fdv: 2400000000,
    circulating: 1240000000, total: 2400000000, dominance: 0.05, ath: 1.42, athDate: '2025-08-12', atl: 0.82, atlDate: '2024-12-18',
    holders: 248000, description: 'ZSD 是中萨数字科技交易所平台代币，用于手续费折扣、治理投票、生态激励。',
    tags: ['平台币', '治理', '实用', '生态'],
    sparkline: [0.98, 0.99, 0.99, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-005', symbol: 'USDT', name: 'Tether', chain: 'eth', category: 'infrastructure', rank: 3,
    price: 1.0, change1h: 0.0, change24h: -0.01, change7d: 0.02,
    volume24h: 48000000000, marketCap: 118000000000, fdv: 118000000000,
    circulating: 118000000000, total: 118000000000, dominance: 4.6, ath: 1.32, athDate: '2018-07-24', atl: 0.57, atlDate: '2015-03-02',
    holders: 68000000, description: 'Tether 是市值最大的稳定币，与美元 1:1 锚定。',
    tags: ['稳定币', '美元', '基础设施'],
    sparkline: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-006', symbol: 'BNB', name: 'BNB', chain: 'bsc', category: 'l1', rank: 4,
    price: 612.42, change1h: 0.32, change24h: 1.84, change7d: 4.2,
    volume24h: 1840000000, marketCap: 92000000000, fdv: 92000000000,
    circulating: 150200000, total: 200000000, dominance: 3.6, ath: 717.48, athDate: '2024-12-04', atl: 0.04, atlDate: '2017-08-01',
    holders: 18400000, description: 'BNB 是 BNB Chain 平台代币，BSC 生态核心。',
    tags: ['PoS', 'L1', '平台币', 'CEX'],
    sparkline: [580, 590, 595, 600, 605, 608, 610, 611, 612, 612.42],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-007', symbol: 'UNI', name: 'Uniswap', chain: 'eth', category: 'defi', rank: 18,
    price: 12.84, change1h: 0.84, change24h: 6.42, change7d: 18.4,
    volume24h: 480000000, marketCap: 7800000000, fdv: 12800000000,
    circulating: 608000000, total: 1000000000, dominance: 0.31, ath: 44.92, athDate: '2021-05-03', atl: 0.42, atlDate: '2020-09-17',
    holders: 384000, description: 'Uniswap 是最大的去中心化交易所（DEX），采用 AMM 模式。',
    tags: ['DEX', 'DeFi', 'AMM', '治理'],
    sparkline: [10.4, 10.8, 11.2, 11.4, 11.6, 11.8, 12.0, 12.4, 12.6, 12.84],
    updatedAt: '2026-07-19 14:32:18',
  },
  {
    id: 'a-008', symbol: 'AAVE', name: 'Aave', chain: 'eth', category: 'defi', rank: 22,
    price: 142.18, change1h: 0.18, change24h: 3.84, change7d: 14.2,
    volume24h: 248000000, marketCap: 2120000000, fdv: 2120000000,
    circulating: 14900000, total: 16000000, dominance: 0.08, ath: 661.69, athDate: '2021-05-18', atl: 26.02, atlDate: '2020-11-05',
    holders: 184000, description: 'Aave 是最大的去中心化借贷协议，支持多资产抵押借贷。',
    tags: ['DeFi', '借贷', 'L2', '治理'],
    sparkline: [120, 124, 128, 132, 135, 138, 140, 141, 142, 142.18],
    updatedAt: '2026-07-19 14:32:18',
  },
];

const ONCHAIN_METRICS: OnchainMetric[] = [
  {
    id: 'm-001', name: 'BTC 活跃地址数', chain: 'eth', category: 'addresses',
    value: 928000, unit: '地址', change24h: 4.2, trend: 'up', period: '24h',
    history: [820000, 840000, 860000, 880000, 890000, 900000, 910000, 920000, 925000, 928000],
    description: '过去 24 小时内有链上交易的 BTC 独立地址数。', source: 'Glassnode / ZSDEX Analytics', updatedAt: '2026-07-19 14:30:00',
    threshold: { warning: 700000, critical: 500000 },
  },
  {
    id: 'm-002', name: 'ETH Gas 中位数', chain: 'eth', category: 'gas',
    value: 18.4, unit: 'Gwei', change24h: -8.2, trend: 'down', period: '24h',
    history: [22, 21, 20, 19.5, 19, 19.2, 19, 18.8, 18.6, 18.4],
    description: '以太坊主网交易手续费中位数。', source: 'Etherscan', updatedAt: '2026-07-19 14:30:00',
    threshold: { warning: 80, critical: 150 },
  },
  {
    id: 'm-003', name: 'DeFi 总锁仓量', chain: 'eth', category: 'tvl',
    value: 124800000000, unit: 'USD', change24h: 2.4, trend: 'up', period: '24h',
    history: [118000000000, 119200000000, 120400000000, 121200000000, 122000000000, 122800000000, 123200000000, 124000000000, 124400000000, 124800000000],
    description: 'DeFi 协议中锁定的资产总价值。', source: 'DeFiLlama', updatedAt: '2026-07-19 14:30:00',
    threshold: { warning: 80000000000, critical: 60000000000 },
  },
  {
    id: 'm-004', name: '稳定币总市值', chain: 'eth', category: 'tvl',
    value: 184000000000, unit: 'USD', change24h: 0.4, trend: 'up', period: '24h',
    history: [182000000000, 182400000000, 182800000000, 183200000000, 183400000000, 183600000000, 183800000000, 184000000000, 184000000000, 184000000000],
    description: '主流稳定币（USDT/USDC/DAI等）的总市值。', source: 'CoinGecko', updatedAt: '2026-07-19 14:30:00',
  },
  {
    id: 'm-005', name: '24h 链上交易笔数', chain: 'eth', category: 'transactions',
    value: 1248000, unit: '笔', change24h: 6.8, trend: 'up', period: '24h',
    history: [1080000, 1100000, 1120000, 1140000, 1160000, 1180000, 1200000, 1220000, 1240000, 1248000],
    description: '过去 24 小时主流 L1 链上交易总笔数。', source: 'Artemis', updatedAt: '2026-07-19 14:30:00',
  },
  {
    id: 'm-006', name: '验证人总数', chain: 'eth', category: 'validators',
    value: 1084000, unit: '节点', change24h: 0.04, trend: 'up', period: '24h',
    history: [1080000, 1080500, 1080800, 1081200, 1081600, 1082000, 1082400, 1082800, 1083200, 1084000],
    description: '以太坊 PoS 验证人总数。', source: 'Etherscan', updatedAt: '2026-07-19 14:30:00',
  },
  {
    id: 'm-007', name: '日活地址', chain: 'solana', category: 'addresses',
    value: 1840000, unit: '地址', change24h: 8.4, trend: 'up', period: '24h',
    history: [1620000, 1640000, 1660000, 1680000, 1700000, 1740000, 1780000, 1800000, 1820000, 1840000],
    description: 'Solana 链过去 24 小时活跃地址数。', source: 'Solana Beach', updatedAt: '2026-07-19 14:30:00',
  },
  {
    id: 'm-008', name: 'L2 TVL 总和', chain: 'arbitrum', category: 'tvl',
    value: 32400000000, unit: 'USD', change24h: 3.2, trend: 'up', period: '24h',
    history: [28800000000, 29200000000, 29800000000, 30400000000, 30800000000, 31200000000, 31600000000, 32000000000, 32200000000, 32400000000],
    description: 'Arbitrum/Optimism/Base/zkSync 等 L2 网络 TVL 总和。', source: 'L2BEAT', updatedAt: '2026-07-19 14:30:00',
  },
];

const WHALES: Whale[] = [
  {
    id: 'w-001', address: '0x7a2c...f8d4', label: 'Binance Hot Wallet 14', type: 'exchange', chain: 'eth',
    netWorth: 8240000000, change24h: -1.2, inflow24h: 184000000, outflow24h: 248000000, txCount24h: 18420,
    topHoldings: [
      { symbol: 'BTC', value: 2840000000, pct: 34.5 },
      { symbol: 'ETH', value: 1620000000, pct: 19.7 },
      { symbol: 'USDT', value: 1240000000, pct: 15.0 },
      { symbol: 'SOL', value: 480000000, pct: 5.8 },
    ],
    tags: ['交易所', '热钱包', '高频'], lastActive: '2026-07-19 14:32:18',
    description: 'Binance 主要热钱包之一，负责日常充提币和交易结算。',
    alertEnabled: true, riskLevel: 'low', winRate: 0, avgHoldTime: 0,
  },
  {
    id: 'w-002', address: '0x9b4e...a3c2', label: 'Vitalik Buterin', type: 'individual', chain: 'eth',
    netWorth: 1240000000, change24h: 2.4, inflow24h: 0, outflow24h: 2400000, txCount24h: 8,
    topHoldings: [
      { symbol: 'ETH', value: 820000000, pct: 66.1 },
      { symbol: 'stETH', value: 184000000, pct: 14.8 },
      { symbol: '其他', value: 236000000, pct: 19.1 },
    ],
    tags: ['个人', '创始人', '公开'], lastActive: '2026-07-19 12:18:42',
    description: '以太坊联合创始人 Vitalik Buterin 的公开地址。',
    alertEnabled: true, riskLevel: 'low', winRate: 0, avgHoldTime: 0,
  },
  {
    id: 'w-003', address: '0x3f8d...e7b1', label: 'Jump Trading', type: 'fund', chain: 'eth',
    netWorth: 2480000000, change24h: 4.8, inflow24h: 84000000, outflow24h: 24000000, txCount24h: 1240,
    topHoldings: [
      { symbol: 'ETH', value: 1240000000, pct: 50.0 },
      { symbol: 'stETH', value: 480000000, pct: 19.4 },
      { symbol: 'UNI', value: 240000000, pct: 9.7 },
      { symbol: 'LDO', value: 184000000, pct: 7.4 },
    ],
    tags: ['机构', '做市', '高频'], lastActive: '2026-07-19 14:28:08',
    description: 'Jump Trading 加密做市基金，主做 ETH 系资产做市。',
    alertEnabled: true, riskLevel: 'low', winRate: 0, avgHoldTime: 0,
  },
  {
    id: 'w-004', address: 'bc1q...m4k8', label: 'MicroStrategy BTC Holdings', type: 'foundation', chain: 'eth',
    netWorth: 18400000000, change24h: 2.84, inflow24h: 0, outflow24h: 0, txCount24h: 0,
    topHoldings: [
      { symbol: 'BTC', value: 18400000000, pct: 100 },
    ],
    tags: ['上市公司', '企业', 'BTC 持有'], lastActive: '2026-07-12 18:42:18',
    description: 'MicroStrategy 上市公司 BTC 持仓地址，公开披露。',
    alertEnabled: true, riskLevel: 'low', winRate: 0, avgHoldTime: 0,
  },
  {
    id: 'w-005', address: '0x6c1a...9d2e', label: 'Anon Whale #284', type: 'whale', chain: 'eth',
    netWorth: 484000000, change24h: 8.4, inflow24h: 18400000, outflow24h: 2400000, txCount24h: 42,
    topHoldings: [
      { symbol: 'ETH', value: 248000000, pct: 51.2 },
      { symbol: 'ARB', value: 84000000, pct: 17.4 },
      { symbol: 'OP', value: 48000000, pct: 9.9 },
      { symbol: 'USDC', value: 32000000, pct: 6.6 },
    ],
    tags: ['匿名', '巨鲸', 'L2 持仓'], lastActive: '2026-07-19 14:18:42',
    description: '匿名巨鲸地址，主要持仓 ETH 和 L2 代币，频繁调仓。',
    alertEnabled: false, riskLevel: 'medium', winRate: 0, avgHoldTime: 0,
  },
  {
    id: 'w-006', address: '0x2e8c...4b9f', label: 'MakerDAO Treasury', type: 'protocol', chain: 'eth',
    netWorth: 6800000000, change24h: 0.4, inflow24h: 12400000, outflow24h: 8000000, txCount24h: 248,
    topHoldings: [
      { symbol: 'ETH', value: 2480000000, pct: 36.5 },
      { symbol: 'stETH', value: 1840000000, pct: 27.1 },
      { symbol: 'USDC', value: 1240000000, pct: 18.2 },
      { symbol: '其他', value: 1240000000, pct: 18.2 },
    ],
    tags: ['协议', '国库', 'MakerDAO'], lastActive: '2026-07-19 14:30:08',
    description: 'MakerDAO 协议国库地址，托管 DAI 抵押资产。',
    alertEnabled: true, riskLevel: 'low', winRate: 0, avgHoldTime: 0,
  },
];

const DEFI_PROTOCOLS: DefiProtocol[] = [
  { id: 'd-001', name: 'Lido', symbol: 'LDO', chain: 'eth', category: 'staking', tvl: 32400000000, tvlChange24h: 1.8, tvlChange7d: 6.4, volume24h: 248000000, fees24h: 1240000, revenue24h: 480000, users24h: 18420, token: 'LDO', tokenPrice: 2.84, tokenChange24h: 4.2, mcap: 2540000000, description: 'Lido 是最大的流动性质押协议，提供 stETH 服务。', logo: '🟦', launchDate: '2020-12-01', audits: ['Sigma Prime', 'Trail of Bits'], tags: ['流动性质押', 'Lido', 'stETH'] },
  { id: 'd-002', name: 'EigenLayer', symbol: 'EIGEN', chain: 'eth', category: 'staking', tvl: 18400000000, tvlChange24h: 3.4, tvlChange7d: 12.8, volume24h: 84000000, fees24h: 480000, revenue24h: 240000, users24h: 8420, token: 'EIGEN', tokenPrice: 4.18, tokenChange24h: 8.4, mcap: 1240000000, description: 'EigenLayer 提供 ETH 再质押服务，扩展共识层安全性。', logo: '🔷', launchDate: '2023-06-14', audits: ['Trail of Bits', 'OpenZeppelin'], tags: ['再质押', 'Restaking', 'EigenLayer'] },
  { id: 'd-003', name: 'Uniswap', symbol: 'UNI', chain: 'eth', category: 'dex', tvl: 6800000000, tvlChange24h: 2.4, tvlChange7d: 8.2, volume24h: 1840000000, fees24h: 4800000, revenue24h: 0, users24h: 184200, token: 'UNI', tokenPrice: 12.84, tokenChange24h: 6.4, mcap: 7800000000, description: 'Uniswap 是最大的去中心化交易所，AMM 模式开创者。', logo: '🦄', launchDate: '2018-11-02', audits: ['Trail of Bits'], tags: ['DEX', 'AMM', 'Uniswap'] },
  { id: 'd-004', name: 'Aave', symbol: 'AAVE', chain: 'eth', category: 'lending', tvl: 14200000000, tvlChange24h: 1.2, tvlChange7d: 4.6, volume24h: 480000000, fees24h: 1840000, revenue24h: 480000, users24h: 18420, token: 'AAVE', tokenPrice: 142.18, tokenChange24h: 3.8, mcap: 2120000000, description: 'Aave 是最大的去中心化借贷协议。', logo: '👻', launchDate: '2020-01-08', audits: ['Sigma Prime', 'Trail of Bits', 'OpenZeppelin'], tags: ['借贷', 'DeFi', 'Aave'] },
  { id: 'd-005', name: 'MakerDAO', symbol: 'MKR', chain: 'eth', category: 'lending', tvl: 4800000000, tvlChange24h: 0.4, tvlChange7d: 1.8, volume24h: 184000000, fees24h: 840000, revenue24h: 240000, users24h: 8420, token: 'MKR', tokenPrice: 2840, tokenChange24h: 1.4, mcap: 2480000000, description: 'MakerDAO 是 Dai 稳定币的发行协议。', logo: '🏛️', launchDate: '2017-12-18', audits: ['Trail of Bits', 'Sigma Prime'], tags: ['稳定币', 'DAI', 'MakerDAO'] },
  { id: 'd-006', name: 'Pendle', symbol: 'PENDLE', chain: 'eth', category: 'yield', tvl: 6800000000, tvlChange24h: 4.2, tvlChange7d: 18.4, volume24h: 248000000, fees24h: 480000, revenue24h: 240000, users24h: 8420, token: 'PENDLE', tokenPrice: 6.84, tokenChange24h: 12.4, mcap: 920000000, description: 'Pendle 是收益代币化协议。', logo: '⏳', launchDate: '2021-08-08', audits: ['Verilog Solutions'], tags: ['收益', 'PT/YT', 'Pendle'] },
  { id: 'd-007', name: 'Compound', symbol: 'COMP', chain: 'eth', category: 'lending', tvl: 3200000000, tvlChange24h: 0.8, tvlChange7d: 2.4, volume24h: 124000000, fees24h: 480000, revenue24h: 240000, users24h: 8420, token: 'COMP', tokenPrice: 64.18, tokenChange24h: 2.4, mcap: 480000000, description: 'Compound 是 DeFi 借贷协议鼻祖。', logo: '🏦', launchDate: '2018-09-26', audits: ['OpenZeppelin'], tags: ['借贷', 'Compound', 'DeFi'] },
  { id: 'd-008', name: 'Curve', symbol: 'CRV', chain: 'eth', category: 'dex', tvl: 2800000000, tvlChange24h: 1.4, tvlChange7d: 4.8, volume24h: 248000000, fees24h: 480000, revenue24h: 240000, users24h: 18420, token: 'CRV', tokenPrice: 0.42, tokenChange24h: 3.8, mcap: 480000000, description: 'Curve 是专注稳定币和同质资产的 DEX。', logo: '🌀', launchDate: '2020-01-15', audits: ['Trail of Bits'], tags: ['DEX', '稳定币', 'Curve'] },
];

const NFT_COLLECTIONS: NftCollection[] = [
  { id: 'n-001', name: 'CryptoPunks', symbol: 'PUNK', chain: 'eth', category: 'collectible', volume24h: 248000, volume7d: 1840000, volumeTotal: 2480000000, sales24h: 8, floorPrice: 28.4, floorChange24h: 2.4, owners: 3840, items: 10000, listed: 124, marketCap: 284000000, description: 'CryptoPunks 是最早的头像 NFT 系列之一，由 Larva Labs 创建。', banner: '👾', verified: true, launchDate: '2017-06-23', tags: ['头像', 'Punks', '蓝筹'] },
  { id: 'n-002', name: 'BAYC', symbol: 'BAYC', chain: 'eth', category: 'collectible', volume24h: 184000, volume7d: 1240000, volumeTotal: 1840000000, sales24h: 12, floorPrice: 14.8, floorChange24h: -1.8, owners: 5420, items: 10000, listed: 248, marketCap: 148000000, description: 'Bored Ape Yacht Club 是 Yuga Labs 推出的蓝筹头像 NFT。', banner: '🐵', verified: true, launchDate: '2021-04-23', tags: ['头像', 'BAYC', '蓝筹'] },
  { id: 'n-003', name: 'Doodles', symbol: 'DOODLE', chain: 'eth', category: 'art', volume24h: 84000, volume7d: 480000, volumeTotal: 480000000, sales24h: 24, floorPrice: 1.42, floorChange24h: 4.2, owners: 4820, items: 10000, listed: 184, marketCap: 14200000, description: 'Doodles 是社区驱动的 NFT 收藏品。', banner: '🎨', verified: true, launchDate: '2021-10-17', tags: ['艺术', 'Doodles', '社区'] },
  { id: 'n-004', name: 'Azuki', symbol: 'AZUKI', chain: 'eth', category: 'collectible', volume24h: 124000, volume7d: 840000, volumeTotal: 1240000000, sales24h: 18, floorPrice: 4.84, floorChange24h: 6.8, owners: 5840, items: 10000, listed: 248, marketCap: 48400000, description: 'Azuki 是日漫风格蓝筹 NFT 系列。', banner: '🌸', verified: true, launchDate: '2022-01-12', tags: ['头像', '日漫', 'Azuki'] },
  { id: 'n-005', name: 'Pudgy Penguins', symbol: 'PPG', chain: 'eth', category: 'collectible', volume24h: 184000, volume7d: 1240000, volumeTotal: 680000000, sales24h: 28, floorPrice: 6.84, floorChange24h: 8.4, owners: 4280, items: 8888, listed: 184, marketCap: 60800000, description: 'Pudgy Penguins 是 QQL 风格的企鹅头像 NFT。', banner: '🐧', verified: true, launchDate: '2021-07-22', tags: ['头像', '企鹅', 'IP'] },
  { id: 'n-006', name: 'Milady', symbol: 'MIL', chain: 'eth', category: 'art', volume24h: 48000, volume7d: 248000, volumeTotal: 248000000, sales24h: 18, floorPrice: 2.18, floorChange24h: 12.4, owners: 3840, items: 10000, listed: 124, marketCap: 21800000, description: 'Milady Maker 是 NeoChad 文化的代表 NFT 系列。', banner: '👧', verified: true, launchDate: '2021-04-08', tags: ['艺术', 'Milady', '文化'] },
  { id: 'n-007', name: 'Art Blocks', symbol: 'BLOCKS', chain: 'eth', category: 'art', volume24h: 84000, volume7d: 480000, volumeTotal: 1240000000, sales24h: 24, floorPrice: 0.84, floorChange24h: 1.8, owners: 18420, items: 248000, listed: 1840, marketCap: 184000000, description: 'Art Blocks 是生成艺术平台。', banner: '🖼️', verified: true, launchDate: '2020-06-08', tags: ['生成艺术', 'Art Blocks', '艺术'] },
  { id: 'n-008', name: 'Pudgy Rods', symbol: 'RODS', chain: 'eth', category: 'art', volume24h: 24000, volume7d: 124000, volumeTotal: 84000000, sales24h: 8, floorPrice: 0.42, floorChange24h: -2.4, owners: 1820, items: 8888, listed: 84, marketCap: 3800000, description: 'Pudgy Rods 是 Pudgy Penguins 衍生艺术系列。', banner: '🎣', verified: true, launchDate: '2023-08-12', tags: ['艺术', 'Pudgy', '衍生'] },
];

const BRIDGE_FLOWS: BridgeFlow[] = [
  { id: 'bf-001', bridge: 'LayerZero OFT', fromChain: 'eth', toChain: 'bsc', asset: 'USDT', volume24h: 184000000, volume7d: 1240000000, txCount24h: 8420, largeTxCount24h: 84, avgAmount: 21800, netFlow: 24000000, trend: 'up', description: 'LayerZero OFT 标准的 USDT 跨链桥接。' },
  { id: 'bf-002', bridge: 'Wormhole', fromChain: 'eth', toChain: 'solana', asset: 'ETH', volume24h: 124000000, volume7d: 840000000, txCount24h: 4820, largeTxCount24h: 48, avgAmount: 25700, netFlow: -18000000, trend: 'down', description: 'Wormhole 的 ETH 跨链桥接。' },
  { id: 'bf-003', bridge: 'Stargate', fromChain: 'arbitrum', toChain: 'optimism', asset: 'USDC', volume24h: 84000000, volume7d: 580000000, txCount24h: 12400, largeTxCount24h: 24, avgAmount: 6770, netFlow: 8400000, trend: 'up', description: 'Stargate 在 L2 之间的稳定币桥接。' },
  { id: 'bf-004', bridge: 'ZSDEX Bridge', fromChain: 'zs-chain', toChain: 'eth', asset: 'ZSD', volume24h: 48000000, volume7d: 320000000, txCount24h: 2480, largeTxCount24h: 18, avgAmount: 19400, netFlow: 12000000, trend: 'up', description: 'ZSDEX 官方桥的 ZSD 跨链桥接。' },
  { id: 'bf-005', bridge: 'Across Protocol', fromChain: 'eth', toChain: 'arbitrum', asset: 'ETH', volume24h: 64000000, volume7d: 420000000, txCount24h: 18420, largeTxCount24h: 8, avgAmount: 3470, netFlow: 4200000, trend: 'up', description: 'Across 的 ETH 跨链桥接。' },
  { id: 'bf-006', bridge: 'Hop Protocol', fromChain: 'polygon', toChain: 'eth', asset: 'USDC', volume24h: 24000000, volume7d: 184000000, txCount24h: 8420, largeTxCount24h: 4, avgAmount: 2850, netFlow: -2400000, trend: 'down', description: 'Hop 的 Polygon USDC 桥接。' },
  { id: 'bf-007', bridge: 'Synapse', fromChain: 'avalanche', toChain: 'bsc', asset: 'USDT', volume24h: 18000000, volume7d: 124000000, txCount24h: 4820, largeTxCount24h: 2, avgAmount: 3730, netFlow: 1800000, trend: 'up', description: 'Synapse 的跨链稳定币桥接。' },
  { id: 'bf-008', bridge: 'Connext', fromChain: 'optimism', toChain: 'base', asset: 'ETH', volume24h: 12000000, volume7d: 84000000, txCount24h: 8420, largeTxCount24h: 1, avgAmount: 1420, netFlow: 800000, trend: 'flat', description: 'Connext 的 L2 间 ETH 桥接。' },
];

const RESEARCH: ResearchReport[] = [
  {
    id: 'r-001', title: '2026 Q3 加密市场展望：ETF 资金流入与监管演进', author: 'ZSDEX Research', authorAvatar: '📊', type: 'monthly', status: 'published',
    publishDate: '2026-07-15', category: '市场展望', readTime: 18, views: 124800, likes: 8420, comments: 1240,
    tags: ['季度展望', 'ETF', '监管', '宏观'], summary: '本报告分析 2026 Q3 加密市场主要趋势，包括 BTC ETF 资金流入、监管政策演进、机构入场等关键因素。',
    rating: 4.8, premium: true, citedBy: 84,
  },
  {
    id: 'r-002', title: 'L2 生态发展深度报告：Arbitrum/Optimism/Base 格局演变', author: 'Layer 2 Lab', authorAvatar: '🔬', type: 'deep-dive', status: 'published',
    publishDate: '2026-07-12', category: 'L2 专题', readTime: 28, views: 84200, likes: 5840, comments: 824,
    tags: ['L2', '深度', '格局', '生态'], summary: '深度对比 Arbitrum/Optimism/Base 三大 L2 生态，从 TVL、用户、收入、开发者活跃度等维度。',
    rating: 4.9, premium: true, citedBy: 124,
  },
  {
    id: 'r-003', title: 'DeFi 收益挖矿周报：稳定币池与 LRT 机会梳理', author: 'DeFi Weekly', authorAvatar: '🌾', type: 'weekly', status: 'published',
    publishDate: '2026-07-14', category: 'DeFi 周报', readTime: 12, views: 48400, likes: 3240, comments: 480,
    tags: ['DeFi', '挖矿', '稳定币', 'LRT'], summary: '本周稳定币池收益和 LRT 机会梳理，含风险评估。',
    rating: 4.6, premium: false, citedBy: 28,
  },
  {
    id: 'r-004', title: 'NFT 蓝筹指数 2026 H1 报告：地板价与流动性分析', author: 'NFT Analytics', authorAvatar: '🖼️', type: 'deep-dive', status: 'published',
    publishDate: '2026-07-08', category: 'NFT 专题', readTime: 22, views: 38400, likes: 2840, comments: 384,
    tags: ['NFT', '蓝筹', '指数', '报告'], summary: 'NFT 蓝筹 2026 上半年表现复盘，含 CryptoPunks/BAYC/Azuki 等 8 大蓝筹指数走势。',
    rating: 4.7, premium: true, citedBy: 42,
  },
  {
    id: 'r-005', title: 'RWA 赛道深度：传统资产上链的机遇与挑战', author: 'RWA Research', authorAvatar: '🏛️', type: 'deep-dive', status: 'published',
    publishDate: '2026-07-05', category: 'RWA 专题', readTime: 24, views: 32400, likes: 2420, comments: 280,
    tags: ['RWA', '传统资产', '代币化'], summary: 'RWA 赛道全景：债券代币化、不动产上链、基金份额代币等 8 大场景分析。',
    rating: 4.8, premium: true, citedBy: 64,
  },
  {
    id: 'r-006', title: '每日市场速递：BTC 突破 67K 与 L2 异动', author: 'Daily Report', authorAvatar: '⚡', type: 'daily', status: 'published',
    publishDate: '2026-07-19', category: '日报', readTime: 6, views: 18400, likes: 1240, comments: 184,
    tags: ['日报', '每日', '速递'], summary: '今日 BTC 突破 67K，L2 异动分析。',
    rating: 4.4, premium: false, citedBy: 4,
  },
];

const DATA_APIS: DataApi[] = [
  {
    id: 'api-001', name: 'Market Price Feed', category: 'market', endpoint: '/v1/market/price', method: 'GET',
    rateLimit: '1000/min', latency: '12ms', uptime: 99.98, callsToday: 1840000, callsMonth: 54000000,
    description: '实时市场价格推送，支持 8000+ 资产，包括现货、衍生品价格。',
    params: [
      { name: 'symbols', type: 'string', required: true, description: '资产符号，逗号分隔' },
      { name: 'vs_currency', type: 'string', required: false, description: '计价货币，默认 USD' },
    ],
    response: '{"BTC": {"usd": 67842.32, "usd_24h_change": 2.84}, "ETH": {"usd": 3842.18, "usd_24h_change": 1.42}}',
    pricing: 'freemium', tier: 'pro', documentation: 'https://docs.zsdex.com/api/market/price',
    tags: ['行情', '实时', '主流'],
  },
  {
    id: 'api-002', name: 'Onchain Address Activity', category: 'onchain', endpoint: '/v1/onchain/addresses/active', method: 'GET',
    rateLimit: '500/min', latency: '180ms', uptime: 99.94, callsToday: 480000, callsMonth: 14800000,
    description: '链上活跃地址统计，支持 9 大公链，按小时/日/周维度聚合。',
    params: [
      { name: 'chain', type: 'string', required: true, description: '链名：eth/bsc/solana 等' },
      { name: 'period', type: 'string', required: false, description: '统计周期：1h/24h/7d' },
    ],
    response: '{"chain": "eth", "period": "24h", "active_addresses": 928000, "change_24h": 4.2}',
    pricing: 'paid', tier: 'pro', documentation: 'https://docs.zsdex.com/api/onchain/addresses',
    tags: ['链上', '地址', '活跃'],
  },
  {
    id: 'api-003', name: 'Whale Alert Stream', category: 'whale', endpoint: '/v1/whale/alerts/stream', method: 'WS',
    rateLimit: '实时', latency: '1.2s', uptime: 99.86, callsToday: 0, callsMonth: 0,
    description: '巨鲸异动实时告警 WebSocket 流，覆盖 8 大公链 1000+ 标记地址。',
    params: [
      { name: 'chains', type: 'string', required: true, description: '链列表，逗号分隔' },
      { name: 'min_amount_usd', type: 'number', required: false, description: '最小金额 USD，默认 100000' },
    ],
    response: '{"type": "transfer", "chain": "eth", "from": "0x7a2c...", "to": "0x9b4e...", "amount": 18420, "asset": "ETH", "tx_hash": "0x..."}',
    pricing: 'enterprise', tier: 'enterprise', documentation: 'https://docs.zsdex.com/api/whale/stream',
    tags: ['巨鲸', '实时', 'WebSocket'],
  },
  {
    id: 'api-004', name: 'DeFi Protocol TVL', category: 'defi', endpoint: '/v1/defi/tvl', method: 'GET',
    rateLimit: '500/min', latency: '120ms', uptime: 99.92, callsToday: 248000, callsMonth: 7400000,
    description: 'DeFi 协议 TVL 数据，覆盖 1200+ 协议，支持历史回溯。',
    params: [
      { name: 'protocol', type: 'string', required: false, description: '协议名，不传则返回全部' },
      { name: 'chain', type: 'string', required: false, description: '链名过滤' },
    ],
    response: '{"protocols": [{"id": "lido", "name": "Lido", "tvl": 32400000000, "change_24h": 1.8}, ...]}',
    pricing: 'freemium', tier: 'pro', documentation: 'https://docs.zsdex.com/api/defi/tvl',
    tags: ['DeFi', 'TVL', '协议'],
  },
  {
    id: 'api-005', name: 'NFT Collection Stats', category: 'nft', endpoint: '/v1/nft/collection/:id', method: 'GET',
    rateLimit: '300/min', latency: '240ms', uptime: 99.88, callsToday: 124000, callsMonth: 3800000,
    description: 'NFT 系列统计数据：地板价、成交量、持有人、稀有度等。',
    params: [
      { name: 'id', type: 'string', required: true, description: 'NFT 系列 ID 或 slug' },
      { name: 'period', type: 'string', required: false, description: '统计周期：1d/7d/30d' },
    ],
    response: '{"id": "cryptopunks", "floor_price": 28.4, "volume_24h": 248000, "owners": 3840, "items": 10000}',
    pricing: 'paid', tier: 'pro', documentation: 'https://docs.zsdex.com/api/nft/collection',
    tags: ['NFT', '蓝筹', '统计'],
  },
  {
    id: 'api-006', name: 'Bridge Flow Analytics', category: 'bridge', endpoint: '/v1/bridge/flow', method: 'GET',
    rateLimit: '300/min', latency: '180ms', uptime: 99.90, callsToday: 84000, callsMonth: 2480000,
    description: '跨链桥资金流分析，支持 8 大主流跨链桥。',
    params: [
      { name: 'bridge', type: 'string', required: false, description: '跨链桥名' },
      { name: 'from_chain', type: 'string', required: false, description: '源链' },
      { name: 'to_chain', type: 'string', required: false, description: '目标链' },
    ],
    response: '{"flows": [{"bridge": "LayerZero", "from": "eth", "to": "bsc", "asset": "USDT", "volume_24h": 184000000}]}',
    pricing: 'paid', tier: 'enterprise', documentation: 'https://docs.zsdex.com/api/bridge/flow',
    tags: ['跨链', '资金流', '分析'],
  },
  {
    id: 'api-007', name: 'Sentiment Index', category: 'sentiment', endpoint: '/v1/sentiment/fear-greed', method: 'GET',
    rateLimit: '60/min', latency: '60ms', uptime: 99.96, callsToday: 24000, callsMonth: 720000,
    description: '市场情绪指数：恐惧贪婪指数、社交媒体情绪、搜索指数。',
    params: [
      { name: 'type', type: 'string', required: false, description: '指数类型：fear-greed/social/search' },
    ],
    response: '{"type": "fear-greed", "value": 68, "label": "贪婪", "updated_at": "2026-07-19T14:00:00Z"}',
    pricing: 'free', tier: 'basic', documentation: 'https://docs.zsdex.com/api/sentiment',
    tags: ['情绪', '恐惧贪婪', '免费'],
  },
  {
    id: 'api-008', name: 'Social Trend Monitor', category: 'social', endpoint: '/v1/social/trend', method: 'GET',
    rateLimit: '300/min', latency: '90ms', uptime: 99.92, callsToday: 184000, callsMonth: 5400000,
    description: '社交媒体趋势监控：Twitter/Discord/Reddit 提及量与情绪分析。',
    params: [
      { name: 'assets', type: 'string', required: true, description: '资产列表' },
      { name: 'platforms', type: 'string', required: false, description: '平台过滤' },
    ],
    response: '{"trends": [{"asset": "BTC", "mentions_24h": 184000, "sentiment": 0.42, "change_24h": 12.4}]}',
    pricing: 'freemium', tier: 'pro', documentation: 'https://docs.zsdex.com/api/social/trend',
    tags: ['社交', '趋势', '监控'],
  },
];

// ============== 组件 ==============

export function PortalAnalytics() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<DataCategory | 'all'>('all');
  const [assetChainFilter, setAssetChainFilter] = useState<ChainId | 'all'>('all');
  const [metricCategoryFilter, setMetricCategoryFilter] = useState<OnchainMetric['category'] | 'all'>('all');
  const [metricChainFilter, setMetricChainFilter] = useState<ChainId | 'all'>('all');
  const [whaleTypeFilter, setWhaleTypeFilter] = useState<Whale['type'] | 'all'>('all');
  const [whaleChainFilter, setWhaleChainFilter] = useState<ChainId | 'all'>('all');
  const [defiCategoryFilter, setDefiCategoryFilter] = useState<DefiProtocol['category'] | 'all'>('all');
  const [defiChainFilter, setDefiChainFilter] = useState<ChainId | 'all'>('all');
  const [nftCategoryFilter, setNftCategoryFilter] = useState<NftCollection['category'] | 'all'>('all');
  const [nftChainFilter, setNftChainFilter] = useState<ChainId | 'all'>('all');
  const [apiCategoryFilter, setApiCategoryFilter] = useState<DataApi['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume' | 'marketCap'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyName, setApplyName] = useState('');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyUsage, setApplyUsage] = useState('研究');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalMarketCap: 2560000000000,
    totalVolume24h: 84000000000,
    btcDominance: 52.4,
    ethDominance: 18.2,
    totalTvl: 124800000000,
    tvlChange24h: 2.4,
    totalAddresses: 1248000000,
    activeAddresses24h: 8420000,
    totalTxs24h: 14820000,
    avgGas: 18.4,
    fearGreed: 68,
    fearGreedLabel: '贪婪',
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalVolume24h: prev.totalVolume24h + Math.floor(Math.random() * 60000000 - 20000000),
        totalTxs24h: prev.totalTxs24h + Math.floor(Math.random() * 800 - 200),
        activeAddresses24h: prev.activeAddresses24h + Math.floor(Math.random() * 4000 - 1500),
        avgGas: Math.max(8, prev.avgGas + (Math.random() - 0.5) * 0.8),
        fearGreed: Math.max(20, Math.min(80, prev.fearGreed + Math.floor(Math.random() * 3 - 1))),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const filteredAssets = useMemo(() => {
    let result = ASSETS.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.symbol.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q)) return false;
      }
      if (assetCategoryFilter !== 'all' && a.category !== assetCategoryFilter) return false;
      if (assetChainFilter !== 'all' && a.chain !== assetChainFilter) return false;
      return true;
    });
    result = result.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortBy === 'rank') { av = a.rank; bv = b.rank; }
      else if (sortBy === 'price') { av = a.price; bv = b.price; }
      else if (sortBy === 'change') { av = a.change24h; bv = b.change24h; }
      else if (sortBy === 'volume') { av = a.volume24h; bv = b.volume24h; }
      else if (sortBy === 'marketCap') { av = a.marketCap; bv = b.marketCap; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [search, assetCategoryFilter, assetChainFilter, sortBy, sortDir]);

  const filteredMetrics = useMemo(() => {
    return ONCHAIN_METRICS.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (!m.name.toLowerCase().includes(q)) return false;
      }
      if (metricCategoryFilter !== 'all' && m.category !== metricCategoryFilter) return false;
      if (metricChainFilter !== 'all' && m.chain !== metricChainFilter) return false;
      return true;
    });
  }, [search, metricCategoryFilter, metricChainFilter]);

  const filteredWhales = useMemo(() => {
    return WHALES.filter((w) => {
      if (search) {
        const q = search.toLowerCase();
        if (!w.label.toLowerCase().includes(q) && !w.address.toLowerCase().includes(q)) return false;
      }
      if (whaleTypeFilter !== 'all' && w.type !== whaleTypeFilter) return false;
      if (whaleChainFilter !== 'all' && w.chain !== whaleChainFilter) return false;
      return true;
    });
  }, [search, whaleTypeFilter, whaleChainFilter]);

  const filteredDefi = useMemo(() => {
    return DEFI_PROTOCOLS.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.symbol.toLowerCase().includes(q)) return false;
      }
      if (defiCategoryFilter !== 'all' && d.category !== defiCategoryFilter) return false;
      if (defiChainFilter !== 'all' && d.chain !== defiChainFilter) return false;
      return true;
    });
  }, [search, defiCategoryFilter, defiChainFilter]);

  const filteredNft = useMemo(() => {
    return NFT_COLLECTIONS.filter((n) => {
      if (search) {
        const q = search.toLowerCase();
        if (!n.name.toLowerCase().includes(q) && !n.symbol.toLowerCase().includes(q)) return false;
      }
      if (nftCategoryFilter !== 'all' && n.category !== nftCategoryFilter) return false;
      if (nftChainFilter !== 'all' && n.chain !== nftChainFilter) return false;
      return true;
    });
  }, [search, nftCategoryFilter, nftChainFilter]);

  const filteredApis = useMemo(() => {
    return DATA_APIS.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.endpoint.toLowerCase().includes(q)) return false;
      }
      if (apiCategoryFilter !== 'all' && a.category !== apiCategoryFilter) return false;
      return true;
    });
  }, [search, apiCategoryFilter]);

  const openDrawer = useCallback((type: DrawerType, payload?: string) => {
    setDrawer({ open: true, type, payload: payload ?? null });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'Escape') {
        if (drawer.open) closeDrawer();
        else if (helpOpen) setHelpOpen(false);
      }
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setHelpOpen((v) => !v); }
      else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('onchain');
      else if (e.key === '3') setTab('whale');
      else if (e.key === '4') setTab('defi');
      else if (e.key === '5') setTab('nft');
      else if (e.key === '6') setTab('bridge');
      else if (e.key === '7') setTab('research');
      else if (e.key === '8') setTab('api');
      else if (e.key === '9') setTab('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  const renderKpi = useCallback((label: string, value: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode) => {
    return (
      <div className="rounded-xl p-4 pa-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
          {icon && <span style={{ color: BRAND.primary }}>{icon}</span>}
        </div>
        <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{value}</div>
        {sub && <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{sub}</div>}
      </div>
    );
  }, []);

  const submitApply = () => {
    if (applyStep < 2) {
      setApplyStep(applyStep + 1);
    } else {
      alert('API 试用申请已提交！我们将在 24 小时内联系您。');
      setApplyStep(0);
      setApplyName('');
      setApplyCompany('');
      setApplyEmail('');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pa-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pa-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pa-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pa-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pa-stagger > * { animation: pa-fade-up 0.4s ease-out both; }
        .pa-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pa-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pa-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pa-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pa-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pa-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pa-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pa-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pa-pulse { animation: pa-pulse 2.4s ease-in-out infinite; }
        .pa-float { animation: pa-float 3s ease-in-out infinite; }
        .pa-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pa-shimmer 2.4s linear infinite; }
        .pa-drawer { animation: pa-slide-in 0.28s ease-out; }
        .pa-bar { transform-origin: bottom; animation: pa-bar 0.6s ease-out; }
        .pa-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={28} style={{ color: BRAND.primary }} className="pa-float" />
            <h1 className="text-3xl font-bold" style={{ color: BRAND.text }}>链上数据分析中心</h1>
            <span className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: 'rgba(20,184,129,0.12)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>P3.32</span>
          </div>
          <p className="text-sm mb-4" style={{ color: BRAND.textMuted, maxWidth: 720 }}>
            中萨数字科技交易所链上数据分析中心：市场概览 / 链上指标 / 巨鲸追踪 / DeFi 数据 / NFT 数据 / 跨链数据 / 研究洞察 / 数据 API。
            与 P3.4 现货 + P3.17 API + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT + P3.29 DeFi + P3.30 跨链 + P3.31 节点形成
            "节点-跨链-DeFi-NFT-数据洞察"全维度数据闭环。明确"链上数据研究分析方向"定性，不构成投资建议。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成投资建议</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pa-stagger">
          {renderKpi('总市值', <>{formatCurrency(kpi.totalMarketCap)}</>, <>24h 量 {formatCurrency(kpi.totalVolume24h)}</>, <Database size={16} />)}
          {renderKpi('BTC 占比', <>{kpi.btcDominance.toFixed(1)}%</>, <>ETH 占比 {kpi.ethDominance.toFixed(1)}%</>, <CircleDollarSign size={16} />)}
          {renderKpi('DeFi TVL', <>{formatCurrency(kpi.totalTvl)}</>, <>24h {kpi.tvlChange24h >= 0 ? '+' : ''}{kpi.tvlChange24h.toFixed(2)}%</>, <Layers size={16} />)}
          {renderKpi('日活地址', <>{formatNumber(kpi.activeAddresses24h)}</>, <>{formatNumber(kpi.totalTxs24h)} 笔交易</>, <Users size={16} className="pa-pulse" />)}
          {renderKpi('ETH Gas', <>{kpi.avgGas.toFixed(1)} <span className="text-sm" style={{ color: BRAND.textMuted }}>Gwei</span></>, <>Etherscan</>, <Flame size={16} />)}
          {renderKpi('恐惧贪婪', <>{kpi.fearGreed}</>, <>{kpi.fearGreedLabel}</>, <Activity size={16} className="pa-pulse" />)}
        </div>
      </div>

      {/* Search + Tab */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textMuted }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资产 / 协议 / 巨鲸 / 报告 / API…" className="bg-transparent outline-none flex-1 text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} className="p-0.5 rounded" style={{ color: BRAND.textMuted }}><X size={14} /></button>}
            </div>
            <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {[
              { k: 'overview' as Tab, l: '总览' },
              { k: 'onchain' as Tab, l: `链上指标 (${ONCHAIN_METRICS.length})` },
              { k: 'whale' as Tab, l: `巨鲸追踪 (${WHALES.length})` },
              { k: 'defi' as Tab, l: `DeFi (${DEFI_PROTOCOLS.length})` },
              { k: 'nft' as Tab, l: `NFT (${NFT_COLLECTIONS.length})` },
              { k: 'bridge' as Tab, l: `跨链数据 (${BRIDGE_FLOWS.length})` },
              { k: 'research' as Tab, l: `研究 (${RESEARCH.length})` },
              { k: 'api' as Tab, l: `数据 API (${DATA_APIS.length})` },
              { k: 'help' as Tab, l: '帮助' },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tab === t.k ? BRAND.primary : BRAND.card, color: tab === t.k ? '#000' : BRAND.text, border: `1px solid ${tab === t.k ? BRAND.primary : BRAND.border}` }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6 pa-stagger">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>市场主导地位</h3>
                  <div className="space-y-2">
                    {[
                      { l: 'BTC', v: kpi.btcDominance, c: '#F7931A' },
                      { l: 'ETH', v: kpi.ethDominance, c: '#627EEA' },
                      { l: 'USDT', v: 4.6, c: '#26A17B' },
                      { l: 'BNB', v: 3.6, c: '#F3BA2F' },
                      { l: 'SOL', v: 3.4, c: '#14F195' },
                      { l: '其他', v: 17.8, c: BRAND.textMuted },
                    ].map((it) => (
                      <div key={it.l} className="flex items-center gap-2">
                        <span className="text-sm w-12" style={{ color: BRAND.text }}>{it.l}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pa-bar" style={{ width: `${it.v * 2}%`, backgroundColor: it.c }} />
                        </div>
                        <span className="text-xs w-12 text-right" style={{ color: it.c }}>{it.v.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>热门资产</h3>
                  <div className="space-y-2">
                    {ASSETS.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded pa-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('asset', a.id)}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, minWidth: 24, textAlign: 'center' }}>{a.rank}</span>
                          <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</span>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div dangerouslySetInnerHTML={{ __html: miniSparkline(a.sparkline, a.change24h >= 0 ? BRAND.primary : '#FF5050', 60, 18) }} />
                          <span className="text-sm font-medium" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>研究洞察</h3>
                  <button onClick={() => setTab('research')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {RESEARCH.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-3 rounded-lg pa-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('research', r.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{r.authorAvatar}</span>
                        <div className="flex-1">
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.author}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.publishDate} · {r.readTime} 分钟</div>
                        </div>
                        {r.premium && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: `1px solid #FFB40040` }}>PRO</span>}
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{r.title}</div>
                      <p className="text-[10px] line-clamp-2" style={{ color: BRAND.textMuted }}>{r.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'onchain' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={metricCategoryFilter} onChange={(e) => setMetricCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部维度</option>
                    <option value="addresses">地址</option><option value="transactions">交易</option>
                    <option value="tvl">TVL</option><option value="fees">费用</option>
                    <option value="gas">Gas</option><option value="validators">验证人</option>
                  </select>
                  <select value={metricChainFilter} onChange={(e) => setMetricChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMetrics.map((m) => (
                  <div key={m.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{m.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{CHAIN_LABELS[m.chain]} · {m.source}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: m.trend === 'up' ? 'rgba(20,184,129,0.10)' : m.trend === 'down' ? 'rgba(255,80,80,0.10)' : 'rgba(176,176,176,0.10)', color: m.trend === 'up' ? BRAND.primary : m.trend === 'down' ? '#FF5050' : BRAND.textMuted, border: `1px solid ${m.trend === 'up' ? BRAND.primary : m.trend === 'down' ? '#FF5050' : BRAND.textMuted}40` }}>
                        {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <div className="text-2xl font-semibold" style={{ color: BRAND.text }}>{formatNumber(m.value)}</div>
                      <div className="text-sm pb-1" style={{ color: BRAND.textMuted }}>{m.unit}</div>
                    </div>
                    <div className="mb-2" dangerouslySetInnerHTML={{ __html: miniSparkline(m.history, m.trend === 'up' ? BRAND.primary : m.trend === 'down' ? '#FF5050' : BRAND.textMuted, 320, 48) }} />
                    <p className="text-[10px]" style={{ color: BRAND.textMuted }}>{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'whale' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={whaleTypeFilter} onChange={(e) => setWhaleTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="individual">个人</option><option value="exchange">交易所</option>
                    <option value="fund">基金</option><option value="protocol">协议</option>
                    <option value="foundation">基金会</option><option value="whale">匿名巨鲸</option>
                  </select>
                  <select value={whaleChainFilter} onChange={(e) => setWhaleChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredWhales.map((w) => {
                  const typeLabels = { individual: '个人', exchange: '交易所', fund: '机构', protocol: '协议', foundation: '基金会', whale: '匿名巨鲸' };
                  return (
                    <div key={w.id} className="rounded-xl p-4 pa-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('whale', w.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{w.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{typeLabels[w.type]}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: w.riskLevel === 'low' ? 'rgba(20,184,129,0.10)' : w.riskLevel === 'medium' ? 'rgba(255,180,0,0.10)' : 'rgba(255,80,80,0.10)', color: w.riskLevel === 'low' ? BRAND.primary : w.riskLevel === 'medium' ? '#FFB400' : '#FF5050', border: `1px solid ${w.riskLevel === 'low' ? BRAND.primary : w.riskLevel === 'medium' ? '#FFB400' : '#FF5050'}40` }}>{w.riskLevel === 'low' ? '低风险' : w.riskLevel === 'medium' ? '中风险' : '高风险'}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: changeColor(w.change24h) }}>{w.change24h >= 0 ? '+' : ''}{w.change24h.toFixed(2)}%</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] mb-2">
                        <div><span style={{ color: BRAND.textMuted }}>净资产</span> <span style={{ color: BRAND.text }}>{formatCurrency(w.netWorth)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>24h 流入</span> <span style={{ color: BRAND.primary }}>{formatCurrency(w.inflow24h)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>24h 流出</span> <span style={{ color: '#FF5050' }}>{formatCurrency(w.outflow24h)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>交易笔数</span> <span style={{ color: BRAND.text }}>{w.txCount24h}</span></div>
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{w.address} · {CHAIN_LABELS[w.chain]} · 最后活动 {w.lastActive}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'defi' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={defiCategoryFilter} onChange={(e) => setDefiCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="dex">DEX</option><option value="lending">借贷</option>
                    <option value="staking">质押</option><option value="derivatives">衍生品</option>
                    <option value="yield">收益</option><option value="bridge">跨链</option>
                  </select>
                  <select value={defiChainFilter} onChange={(e) => setDefiChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredDefi.map((d) => {
                  const catLabels = { dex: 'DEX', lending: '借贷', staking: '质押', derivatives: '衍生品', yield: '收益', bridge: '跨链', insurance: '保险', rwa: 'RWA' };
                  return (
                    <div key={d.id} className="rounded-xl p-4 pa-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('defi', d.id)}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{d.logo}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{d.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{catLabels[d.category]}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: CHAIN_COLORS[d.chain], border: `1px solid ${CHAIN_COLORS[d.chain]}40` }}>{CHAIN_LABELS[d.chain]}</span>
                          </div>
                          <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: BRAND.textMuted }}>{d.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold" style={{ color: BRAND.text }}>{formatCurrency(d.tvl)}</div>
                          <div className="text-[10px]" style={{ color: changeColor(d.tvlChange24h) }}>{d.tvlChange24h >= 0 ? '+' : ''}{d.tvlChange24h.toFixed(2)}%</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        <div><span style={{ color: BRAND.textMuted }}>24h 量</span> <span style={{ color: BRAND.text }}>{formatCurrency(d.volume24h)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>日活用户</span> <span style={{ color: BRAND.text }}>{formatNumber(d.users24h)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>{d.symbol}</span> <span style={{ color: BRAND.text }}>${d.tokenPrice.toFixed(2)}</span> <span style={{ color: changeColor(d.tokenChange24h) }}>{d.tokenChange24h >= 0 ? '+' : ''}{d.tokenChange24h.toFixed(2)}%</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>审计</span> <span style={{ color: BRAND.text }}>{d.audits.length}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'nft' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={nftCategoryFilter} onChange={(e) => setNftCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="art">艺术</option><option value="collectible">收藏</option>
                    <option value="gaming">游戏</option><option value="music">音乐</option>
                    <option value="photography">摄影</option><option value="utility">实用</option>
                  </select>
                  <select value={nftChainFilter} onChange={(e) => setNftChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNft.map((n) => (
                  <div key={n.id} className="rounded-xl p-4 pa-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('nft', n.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{n.banner}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{n.name}</span>
                            {n.verified && <ShieldCheck size={12} style={{ color: BRAND.primary }} />}
                          </div>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{CHAIN_LABELS[n.chain]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                      <div><span style={{ color: BRAND.textMuted }}>地板价</span> <span style={{ color: BRAND.text }}>{n.floorPrice} ETH</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>24h 变化</span> <span style={{ color: changeColor(n.floorChange24h) }}>{n.floorChange24h >= 0 ? '+' : ''}{n.floorChange24h.toFixed(2)}%</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>24h 成交</span> <span style={{ color: BRAND.text }}>{formatCurrency(n.volume24h)}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>持有人</span> <span style={{ color: BRAND.text }}>{formatNumber(n.owners)}</span></div>
                    </div>
                    <p className="text-[10px] line-clamp-2" style={{ color: BRAND.textMuted }}>{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'bridge' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>跨链资金流</h3>
                <div className="space-y-2">
                  {BRIDGE_FLOWS.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: CHAIN_COLORS[b.fromChain] + '20', color: CHAIN_COLORS[b.fromChain], border: `1px solid ${CHAIN_COLORS[b.fromChain]}40` }}>{CHAIN_LABELS[b.fromChain]}</span>
                        <ArrowRight size={14} style={{ color: BRAND.textMuted }} />
                        <span className="px-2 py-1 rounded text-[10px] font-medium" style={{ backgroundColor: CHAIN_COLORS[b.toChain] + '20', color: CHAIN_COLORS[b.toChain], border: `1px solid ${CHAIN_COLORS[b.toChain]}40` }}>{CHAIN_LABELS[b.toChain]}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>{b.asset}</span>
                      <span className="text-[10px]" style={{ color: BRAND.textMuted }}>via {b.bridge}</span>
                      <div className="flex-1 text-right">
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(b.volume24h)}</div>
                        <div className="text-[10px]" style={{ color: changeColor(b.netFlow) }}>净流 {b.netFlow >= 0 ? '+' : ''}{formatCurrency(b.netFlow)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'research' && (
            <div className="space-y-3">
              {RESEARCH.map((r) => (
                <div key={r.id} className="rounded-xl p-4 pa-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('research', r.id)}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{r.authorAvatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.title}</span>
                        {r.premium && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: `1px solid #FFB40040` }}>PRO</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{r.category}</span>
                      </div>
                      <p className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{r.summary}</p>
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textMuted }}>
                        <span>{r.author}</span>
                        <span>{r.publishDate}</span>
                        <span>{r.readTime} 分钟</span>
                        <span className="flex items-center gap-1"><Eye size={10} /> {formatNumber(r.views)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={10} /> {formatNumber(r.likes)}</span>
                        <span className="flex items-center gap-1"><Star size={10} /> {r.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'api' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 gap-2">
                  <select value={apiCategoryFilter} onChange={(e) => setApiCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部 API</option>
                    <option value="market">行情</option><option value="onchain">链上</option>
                    <option value="whale">巨鲸</option><option value="defi">DeFi</option>
                    <option value="nft">NFT</option><option value="bridge">跨链</option>
                    <option value="sentiment">情绪</option><option value="social">社交</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>API 试用申请</h3>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {['填写信息', '使用场景', '确认提交'].map((s, i) => (
                    <div key={i} className="flex-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: i <= applyStep ? BRAND.primary : BRAND.bg, color: i <= applyStep ? '#000' : BRAND.textMuted, border: `1px solid ${i <= applyStep ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                      <span className="text-[10px]" style={{ color: i <= applyStep ? BRAND.text : BRAND.textMuted }}>{s}</span>
                      {i < 2 && <div className="flex-1 h-px" style={{ backgroundColor: i < applyStep ? BRAND.primary : BRAND.border }} />}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {applyStep === 0 && (
                    <div className="space-y-3">
                      <input value={applyName} onChange={(e) => setApplyName(e.target.value)} placeholder="姓名" className="w-full px-3 py-2 rounded text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="公司/团队" className="w-full px-3 py-2 rounded text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} placeholder="邮箱" className="w-full px-3 py-2 rounded text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                    </div>
                  )}
                  {applyStep === 1 && (
                    <div className="space-y-2">
                      <div className="text-xs" style={{ color: BRAND.textMuted }}>使用场景</div>
                      {['研究', '量化交易', '产品集成', '学术研究', '其他'].map((u) => (
                        <button key={u} onClick={() => setApplyUsage(u)} className="w-full p-2.5 rounded text-left text-sm" style={{ backgroundColor: applyUsage === u ? 'rgba(20,184,129,0.08)' : BRAND.bg, color: applyUsage === u ? BRAND.primary : BRAND.text, border: `1px solid ${applyUsage === u ? BRAND.primary : BRAND.border}` }}>{u}</button>
                      ))}
                    </div>
                  )}
                  {applyStep === 2 && (
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <CheckCircle2 size={48} style={{ color: BRAND.primary, margin: '0 auto' }} className="pa-float" />
                      <h4 className="text-base font-semibold mt-3" style={{ color: BRAND.text }}>确认提交</h4>
                      <div className="mt-4 text-left space-y-1 text-[11px]">
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>姓名</span><span style={{ color: BRAND.text }}>{applyName || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>公司</span><span style={{ color: BRAND.text }}>{applyCompany || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>邮箱</span><span style={{ color: BRAND.text }}>{applyEmail || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>场景</span><span style={{ color: BRAND.text }}>{applyUsage}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {applyStep > 0 && <button onClick={() => setApplyStep(applyStep - 1)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>}
                    <button onClick={submitApply} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>{applyStep < 2 ? '下一步' : '提交申请'}</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredApis.map((a) => {
                  const pricingLabels = { free: '免费', freemium: '免费增值', paid: '付费', enterprise: '企业' };
                  const pricingColor = a.pricing === 'free' ? BRAND.primary : a.pricing === 'freemium' ? BRAND.primary : a.pricing === 'paid' ? '#FFB400' : '#FF5050';
                  return (
                    <div key={a.id} className="rounded-xl p-4 pa-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('api', a.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{a.method}</span>
                        <span className="text-sm font-mono" style={{ color: BRAND.text }}>{a.endpoint}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: pricingColor + '20', color: pricingColor, border: `1px solid ${pricingColor}40` }}>{pricingLabels[a.pricing]}</span>
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{a.name}</div>
                      <p className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{a.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                        <div><span style={{ color: BRAND.textMuted }}>限流</span> <span style={{ color: BRAND.text }}>{a.rateLimit}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>延迟</span> <span style={{ color: BRAND.text }}>{a.latency}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>可用率</span> <span style={{ color: BRAND.primary }}>{a.uptime}%</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>今日调用</span> <span style={{ color: BRAND.text }}>{formatNumber(a.callsToday)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>链上数据分析说明</h3>
              <div className="space-y-3 text-sm" style={{ color: BRAND.textMuted }}>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>数据来源</div>
                  <p>所有数据来自 Glassnode、DeFiLlama、Etherscan、Artemis、Nansen 等行业领先数据源，经 ZSDEX Analytics 聚合处理。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>数据更新</div>
                  <p>市场数据：实时（≤ 5 秒延迟） | 链上指标：5 分钟聚合 | 研究报告：日 / 周 / 月度更新。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>巨鲸追踪</div>
                  <p>已标记地址覆盖 1000+ 交易所、基金、协议国库等，可订阅实时告警。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>API 套餐</div>
                  <p>免费版：1000 次 / 日 | 专业版：10 万次 / 日 | 企业版：定制。所有 API 都提供 99.9% SLA。</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(20,184,129,0.08)', border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>合规说明</div>
                  <p className="text-[11px]">本平台链上数据分析中心为"链上数据研究分析方向"演示页面，所有数据均为 mock 占位或公开数据聚合。本平台不构成投资建议、不构成对任何项目的合规背书。严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险表述。具体数据使用请遵守相关数据源服务条款和所在司法管辖区的合规要求。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'asset' && (() => {
        const a = ASSETS.find(x => x.id === drawer.payload);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pa-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={18} style={{ color: CHAIN_COLORS[a.chain] }} />
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{a.symbol} - {a.name}</h3>
                </div>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold" style={{ color: BRAND.text }}>${a.price.toLocaleString()}</div>
                  <div className="text-base pb-1" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}% (24h)</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>市值</div>
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(a.marketCap)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>FDV</div>
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(a.fdv)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(a.volume24h)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>占比</div>
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.dominance.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>近 10 个数据点</div>
                  <div dangerouslySetInnerHTML={{ __html: miniSparkline(a.sparkline, a.change24h >= 0 ? BRAND.primary : '#FF5050', 480, 80) }} />
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>历史极值</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span style={{ color: BRAND.textMuted }}>ATH：</span><span style={{ color: BRAND.primary }}>${a.ath.toLocaleString()} ({a.athDate})</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>ATL：</span><span style={{ color: BRAND.textMuted }}>${a.atl} ({a.atlDate})</span></div>
                  </div>
                </div>
                <p className="text-sm" style={{ color: BRAND.textMuted }}>{a.description}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pa-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
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
