'use client';

/**
 * PortalBridge - 跨链桥中心 (2026-07-19 Q05 P3.30)
 *
 * 页面定位：
 * - 中萨数字科技交易所 跨链桥中心
 * - 跨链桥列表 / 路线 / 流动性 / 验证节点 / 桥接资产 / 历史交易 / 申请接入
 * - 与 P3.4 现货 + P3.17 API + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT + P3.29 DeFi
 *   形成"资产-衍生-量化-NFT-DeFi-跨链" 全栈闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有跨链桥 / 路线 / 流动性 / 节点 / 桥接资产使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"跨链基础设施研究方向"定性
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
  ArrowRightLeft,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Network,
  Layers,
  Boxes,
  Box,
  GitBranch,
  GitMerge,
  GitFork,
  GitCommit,
  Coins,
  CircleDollarSign,
  Wallet,
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
  KeyRound,
  Link2,
  Workflow,
  LinkIcon,
  Repeat,
  RotateCw,
  Shuffle,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'bridges' | 'routes' | 'liquidity' | 'validators' | 'assets' | 'history' | 'apply' | 'help';
type BridgeType = 'canonical' | 'liquidity' | 'lock-mint' | 'burn-mint' | 'optimistic' | 'zk' | 'native';
type BridgeStatus = 'live' | 'beta' | 'paused' | 'maintenance' | 'deprecated';
type SecurityLevel = 'high' | 'medium' | 'low' | 'experimental';
type ChainNetwork = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'solana' | 'cosmos' | 'polkadot' | 'near' | 'aptos' | 'sui' | 'ton' | 'tron' | 'bitcoin' | 'zs-chain';
type ValidatorStatus = 'active' | 'jailed' | 'slashed' | 'pending' | 'exiting';
type ApplyType = 'bridge' | 'validator' | 'operator' | 'partner' | 'auditor';
type DrawerType = 'bridge' | 'route' | 'liquidity' | 'validator' | 'asset' | 'deposit' | 'apply' | 'help' | null;

interface Bridge {
  id: string;
  name: string;
  symbol: string;
  type: BridgeType;
  status: BridgeStatus;
  security: SecurityLevel;
  description: string;
  chains: ChainNetwork[];
  tvl: number;
  volume24h: number;
  volumeTotal: number;
  txCount24h: number;
  txCountTotal: number;
  avgTime: number;
  successRate: number;
  feeRate: number;
  minAmount: number;
  maxAmount: number;
  supportedAssets: number;
  validators: number;
  audits: string[];
  tags: string[];
  launchDate: string;
  updatedAt: string;
  highlights: string[];
  risks: string[];
  features: string[];
  operator: string;
}

interface Route {
  id: string;
  source: ChainNetwork;
  target: ChainNetwork;
  bridgeId: string;
  bridgeName: string;
  asset: string;
  avgTime: number;
  feeRate: number;
  liquidity: number;
  volume24h: number;
  successRate: number;
  status: 'live' | 'beta' | 'paused';
  hops: number;
  requiredConfirmations: number;
  description: string;
  tvl: number;
  participants: number;
  tags: string[];
}

interface LiquidityPool {
  id: string;
  bridgeId: string;
  bridgeName: string;
  chain: ChainNetwork;
  asset: string;
  totalLiquidity: number;
  availableLiquidity: number;
  utilization: number;
  apr: number;
  rewards: { token: string; perDay: number; apr: number }[];
  providers: number;
  updatedAt: string;
  status: 'live' | 'incentivized' | 'paused';
  lockPeriod: number;
  description: string;
  audit: string[];
}

interface Validator {
  id: string;
  name: string;
  status: ValidatorStatus;
  stake: number;
  uptime: number;
  blocks: number;
  blocksTotal: number;
  missed: number;
  jailed: number;
  commission: number;
  delegators: number;
  apr: number;
  region: string;
  joinedAt: string;
  updatedAt: string;
  description: string;
  logo: string;
  contact: string;
  website: string;
  performance: { date: string; uptime: number; blocks: number }[];
  totalRewards: number;
  tags: string[];
}

interface WrappedAsset {
  id: string;
  symbol: string;
  name: string;
  originalChain: ChainNetwork;
  originalAddress: string;
  wrappedAddress: string;
  bridgeId: string;
  bridgeName: string;
  totalSupply: number;
  holders: number;
  volume24h: number;
  updatedAt: string;
  status: 'live' | 'paused' | 'migrating';
  peg: number; // 1.0 = 1:1
  type: 'wrapped' | 'canonical' | 'synthetic';
  audit: string[];
  description: string;
}

interface BridgeHistory {
  id: string;
  bridgeId: string;
  bridgeName: string;
  user: string;
  source: ChainNetwork;
  target: ChainNetwork;
  asset: string;
  amount: number;
  fee: number;
  status: 'pending' | 'confirming' | 'completed' | 'failed' | 'refunded';
  hash: string;
  startAt: string;
  endAt: string;
  timeUsed: number;
  description: string;
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
  totalBridges: number;
  totalRoutes: number;
  totalPools: number;
  totalValidators: number;
  activeValidators: number;
  totalVolume24h: number;
  totalTx24h: number;
  avgTime: number;
  successRate: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 工具 ==============

const CHAIN_LABELS: Record<ChainNetwork, string> = {
  'eth': 'Ethereum',
  'bsc': 'BNB Chain',
  'polygon': 'Polygon',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  'avalanche': 'Avalanche',
  'solana': 'Solana',
  'cosmos': 'Cosmos',
  'polkadot': 'Polkadot',
  'near': 'NEAR',
  'aptos': 'Aptos',
  'sui': 'Sui',
  'ton': 'TON',
  'tron': 'Tron',
  'bitcoin': 'Bitcoin',
  'zs-chain': 'ZS-Chain',
};

const CHAIN_COLORS: Record<ChainNetwork, string> = {
  'eth': '#627EEA',
  'bsc': '#F3BA2F',
  'polygon': '#8247E5',
  'arbitrum': '#28A0F0',
  'optimism': '#FF0420',
  'avalanche': '#E84142',
  'solana': '#14F195',
  'cosmos': '#2E3148',
  'polkadot': '#E6007A',
  'near': '#000000',
  'aptos': '#000000',
  'sui': '#6FBCF0',
  'ton': '#0098EA',
  'tron': '#FF060A',
  'bitcoin': '#F7931A',
  'zs-chain': BRAND.primary,
};

function formatTvl(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toString();
}

function formatTime(min: number): string {
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min}m`;
}

// ============== Mock 数据 ==============

const BRIDGES: Bridge[] = [
  {
    id: 'b-001', name: 'ZSDEX Bridge 官方桥', symbol: 'ZS-Bridge', type: 'canonical', status: 'live', security: 'high',
    description: '中萨数字科技交易所官方跨链桥，基于 ZS-Chain 原生跨链协议，支持多链资产安全互转。',
    chains: ['zs-chain', 'eth', 'bsc', 'polygon', 'arbitrum', 'solana'],
    tvl: 2480000000, volume24h: 184000000, volumeTotal: 18400000000,
    txCount24h: 12480, txCountTotal: 1840000, avgTime: 8, successRate: 99.84,
    feeRate: 0.001, minAmount: 10, maxAmount: 5000000, supportedAssets: 124,
    validators: 28, audits: ['CertiK', 'SlowMist', 'PeckShield', 'Trail of Bits'],
    tags: ['官方', '原生', '高安全', '多链'],
    launchDate: '2024-03-12', updatedAt: '2026-07-18',
    highlights: ['28 个验证节点', '99.84% 成功率', '124 种资产支持', '6 大主流公链'],
    risks: ['跨链智能合约风险', '极端拥堵时延增加'],
    features: ['原生跨链协议', '多签验证', '链上链下双重保险', '实时监控'],
    operator: 'ZSDEX Labs',
  },
  {
    id: 'b-002', name: 'LayerZero OFT Bridge', symbol: 'LZ-OFT', type: 'lock-mint', status: 'live', security: 'high',
    description: '基于 LayerZero 全链互操作协议，OFT 标准的资产跨链，支持原生代币无损跨链。',
    chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'solana', 'near'],
    tvl: 1840000000, volume24h: 124000000, volumeTotal: 12400000000,
    txCount24h: 18420, txCountTotal: 2480000, avgTime: 4, successRate: 99.92,
    feeRate: 0.0008, minAmount: 5, maxAmount: 10000000, supportedAssets: 86,
    validators: 0, audits: ['CertiK', 'Quantstamp'],
    tags: ['LayerZero', 'OFT', '原生', '极速'],
    launchDate: '2024-05-18', updatedAt: '2026-07-19',
    highlights: ['4 分钟平均到账', '99.92% 成功率', '8 大公链', 'OFT 标准'],
    risks: ['LayerZero 协议升级风险', '中继器依赖'],
    features: ['OFT 协议', 'Ultra Light Node', '无需中间代币', '原子交换'],
    operator: 'LayerZero Labs',
  },
  {
    id: 'b-003', name: 'Wormhole Portal', symbol: 'Wormhole', type: 'lock-mint', status: 'live', security: 'high',
    description: '基于 Wormhole 协议的多链跨链桥，支持 30+ 公链生态，覆盖最广。',
    chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'solana', 'aptos', 'sui', 'near', 'cosmos', 'polkadot'],
    tvl: 1240000000, volume24h: 86000000, volumeTotal: 8600000000,
    txCount24h: 8420, txCountTotal: 1240000, avgTime: 12, successRate: 99.68,
    feeRate: 0.0012, minAmount: 1, maxAmount: 5000000, supportedAssets: 184,
    validators: 19, audits: ['CertiK', 'Neodyme', 'Trail of Bits'],
    tags: ['Wormhole', '广覆盖', '多链', 'NFT'],
    launchDate: '2023-08-12', updatedAt: '2026-07-19',
    highlights: ['12 大公链', '184 种资产', '19 守护节点', 'NFT 跨链'],
    risks: ['历史上 2022 年 2.7 亿 USD 漏洞已修复', '守护者去中心化程度有限'],
    features: ['VAA 跨链消息', 'Token Bridge', 'NFT Bridge', '多签守护者'],
    operator: 'Wormhole Foundation',
  },
  {
    id: 'b-004', name: 'Stargate Finance', symbol: 'STG', type: 'liquidity', status: 'live', security: 'high',
    description: '基于 LayerZero 的原生资产跨链桥，使用 Delta 算法实现即时终局性。',
    chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
    tvl: 680000000, volume24h: 124000000, volumeTotal: 6800000000,
    txCount24h: 18420, txCountTotal: 1840000, avgTime: 1, successRate: 99.94,
    feeRate: 0.001, minAmount: 1, maxAmount: 1000000, supportedAssets: 28,
    validators: 0, audits: ['CertiK', 'Quantstamp', 'Zellic'],
    tags: ['LayerZero', '即时', '流动性池', '低滑点'],
    launchDate: '2024-02-08', updatedAt: '2026-07-19',
    highlights: ['1 分钟到账', '即时终局', '28 种资产', '低滑点'],
    risks: ['依赖 LayerZero 协议', '流动性深度影响滑点'],
    features: ['Delta 算法', '即时终局性', '统一流动性', '原生资产'],
    operator: 'LayerZero Labs',
  },
  {
    id: 'b-005', name: 'Axelar Network', symbol: 'AXL', type: 'canonical', status: 'live', security: 'high',
    description: '基于 Cosmos SDK 的通用跨链消息协议，支持任意消息跨链传递。',
    chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'cosmos', 'polkadot'],
    tvl: 420000000, volume24h: 24000000, volumeTotal: 2400000000,
    txCount24h: 2480, txCountTotal: 248000, avgTime: 18, successRate: 99.78,
    feeRate: 0.0015, minAmount: 5, maxAmount: 1000000, supportedAssets: 48,
    validators: 75, audits: ['CertiK', 'Quantstamp'],
    tags: ['Cosmos', '通用消息', '跨链通信'],
    launchDate: '2024-04-15', updatedAt: '2026-07-17',
    highlights: ['75 验证节点', '通用消息', '8 大公链', 'GMP 协议'],
    risks: ['Cosmos 生态依赖', '验证节点门槛高'],
    features: ['GMP 协议', '通用消息', '链间合约调用', '多签治理'],
    operator: 'Axelar Foundation',
  },
  {
    id: 'b-006', name: 'Multichain (原 Anyswap)', symbol: 'Multichain', type: 'lock-mint', status: 'paused', security: 'medium',
    description: '原 Multichain 跨链桥，2023 年因管理问题暂停，已迁移至 ZSDEX Bridge。',
    chains: ['eth', 'bsc', 'polygon', 'avalanche', 'cosmos'],
    tvl: 84000000, volume24h: 0, volumeTotal: 4200000000,
    txCount24h: 0, txCountTotal: 1240000, avgTime: 0, successRate: 0,
    feeRate: 0.001, minAmount: 1, maxAmount: 1000000, supportedAssets: 1240,
    validators: 16, audits: ['慢雾'],
    tags: ['已暂停', '迁移中'],
    launchDate: '2022-08-15', updatedAt: '2024-01-15',
    highlights: ['已暂停运营', '2024 年完成迁移', '建议迁至 ZSDEX Bridge'],
    risks: ['已停止新交易', '历史漏洞事件'],
    features: ['迁移中'],
    operator: '已关停',
  },
  {
    id: 'b-007', name: 'Polygon PoS Bridge', symbol: 'Polygon', type: 'lock-mint', status: 'live', security: 'high',
    description: 'Polygon 官方 PoS Bridge，专为 Ethereum ↔ Polygon 双向跨链。',
    chains: ['eth', 'polygon'],
    tvl: 1840000000, volume24h: 48000000, volumeTotal: 18400000000,
    txCount24h: 8420, txCountTotal: 8420000, avgTime: 25, successRate: 99.88,
    feeRate: 0.0005, minAmount: 1, maxAmount: 10000000, supportedAssets: 86,
    validators: 105, audits: ['CertiK', 'Quantstamp'],
    tags: ['Polygon', '官方', '高频'],
    launchDate: '2021-05-30', updatedAt: '2026-07-19',
    highlights: ['105 验证节点', '86 种资产', '官方桥', '25 分钟到账'],
    risks: ['7 天挑战期', '退出机制较慢'],
    features: ['PoS 验证', '挑战机制', '官方维护', '高频使用'],
    operator: 'Polygon Labs',
  },
  {
    id: 'b-008', name: 'Arbitrum Bridge', symbol: 'Arbitrum', type: 'canonical', status: 'live', security: 'high',
    description: 'Arbitrum 官方跨链桥，专为 Ethereum ↔ Arbitrum One 双向跨链。',
    chains: ['eth', 'arbitrum'],
    tvl: 2480000000, volume24h: 64000000, volumeTotal: 24800000000,
    txCount24h: 12480, txCountTotal: 12400000, avgTime: 15, successRate: 99.92,
    feeRate: 0.0008, minAmount: 1, maxAmount: 10000000, supportedAssets: 124,
    validators: 0, audits: ['CertiK', 'Trail of Bits'],
    tags: ['Arbitrum', '官方', 'Optimistic'],
    launchDate: '2021-08-31', updatedAt: '2026-07-19',
    highlights: ['7 天挑战期', '官方桥', 'Optimistic Rollup', '124 资产'],
    risks: ['7 天退出期', '欺诈证明风险'],
    features: ['Optimistic Rollup', '官方维护', '7 天挑战期'],
    operator: 'Arbitrum Foundation',
  },
];

const ROUTES: Route[] = [
  { id: 'r-001', source: 'zs-chain', target: 'eth', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', asset: 'ZSD', avgTime: 8, feeRate: 0.001, liquidity: 124000000, volume24h: 18400000, successRate: 99.84, status: 'live', hops: 1, requiredConfirmations: 12, description: 'ZSD 从 ZS-Chain 桥至 Ethereum', tvl: 124000000, participants: 4280, tags: ['官方', 'ZSD', '主网'] },
  { id: 'r-002', source: 'eth', target: 'zs-chain', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', asset: 'USDT', avgTime: 8, feeRate: 0.001, liquidity: 248000000, volume24h: 24800000, successRate: 99.86, status: 'live', hops: 1, requiredConfirmations: 12, description: 'USDT 从 Ethereum 桥至 ZS-Chain', tvl: 248000000, participants: 6840, tags: ['官方', 'USDT', '稳定币'] },
  { id: 'r-003', source: 'eth', target: 'bsc', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', asset: 'USDC', avgTime: 4, feeRate: 0.0008, liquidity: 184000000, volume24h: 18400000, successRate: 99.94, status: 'live', hops: 1, requiredConfirmations: 15, description: 'USDC 跨 LayerZero 在 ETH/BSC 之间互转', tvl: 184000000, participants: 8420, tags: ['LayerZero', 'OFT', '稳定币'] },
  { id: 'r-004', source: 'eth', target: 'polygon', bridgeId: 'b-007', bridgeName: 'Polygon PoS Bridge', asset: 'ETH', avgTime: 25, feeRate: 0.0005, liquidity: 1240000000, volume24h: 24000000, successRate: 99.88, status: 'live', hops: 1, requiredConfirmations: 64, description: 'ETH 通过 Polygon 官方桥跨链', tvl: 1240000000, participants: 24800, tags: ['Polygon', '官方', 'ETH'] },
  { id: 'r-005', source: 'eth', target: 'arbitrum', bridgeId: 'b-008', bridgeName: 'Arbitrum Bridge', asset: 'ETH', avgTime: 15, feeRate: 0.0008, liquidity: 1840000000, volume24h: 48000000, successRate: 99.92, status: 'live', hops: 1, requiredConfirmations: 64, description: 'ETH 通过 Arbitrum 官方桥跨链', tvl: 1840000000, participants: 18400, tags: ['Arbitrum', '官方', 'L2'] },
  { id: 'r-006', source: 'eth', target: 'solana', bridgeId: 'b-003', bridgeName: 'Wormhole Portal', asset: 'USDC', avgTime: 12, feeRate: 0.0012, liquidity: 124000000, volume24h: 18400000, successRate: 99.68, status: 'live', hops: 1, requiredConfirmations: 32, description: 'USDC 通过 Wormhole 跨至 Solana', tvl: 124000000, participants: 4280, tags: ['Wormhole', 'USDC'] },
  { id: 'r-007', source: 'bsc', target: 'polygon', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', asset: 'USDT', avgTime: 4, feeRate: 0.0008, liquidity: 84000000, volume24h: 12400000, successRate: 99.92, status: 'live', hops: 1, requiredConfirmations: 15, description: 'USDT 通过 LayerZero 跨 BSC/Polygon', tvl: 84000000, participants: 2480, tags: ['LayerZero', 'OFT'] },
  { id: 'r-008', source: 'eth', target: 'optimism', bridgeId: 'b-008', bridgeName: 'Arbitrum Bridge', asset: 'USDC', avgTime: 15, feeRate: 0.0008, liquidity: 124000000, volume24h: 18400000, successRate: 99.92, status: 'live', hops: 1, requiredConfirmations: 64, description: 'USDC 通过官方桥跨至 Optimism', tvl: 124000000, participants: 3280, tags: ['Optimism', '官方'] },
  { id: 'r-009', source: 'solana', target: 'eth', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', asset: 'BONK', avgTime: 4, feeRate: 0.001, liquidity: 12400000, volume24h: 2400000, successRate: 99.88, status: 'live', hops: 1, requiredConfirmations: 32, description: 'BONK 通过 LayerZero 跨 Solana/ETH', tvl: 12400000, participants: 1840, tags: ['LayerZero', 'MEME'] },
  { id: 'r-010', source: 'zs-chain', target: 'bsc', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', asset: 'ZSDEX', avgTime: 8, feeRate: 0.001, liquidity: 84000000, volume24h: 8400000, successRate: 99.86, status: 'live', hops: 1, requiredConfirmations: 12, description: '平台币 ZSDEX 跨链至 BSC', tvl: 84000000, participants: 1840, tags: ['平台币', '官方'] },
  { id: 'r-011', source: 'eth', target: 'avalanche', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', asset: 'USDT', avgTime: 4, feeRate: 0.0008, liquidity: 64000000, volume24h: 8400000, successRate: 99.92, status: 'live', hops: 1, requiredConfirmations: 15, description: 'USDT 跨 ETH/Avalanche', tvl: 64000000, participants: 1240, tags: ['LayerZero'] },
  { id: 'r-012', source: 'eth', target: 'cosmos', bridgeId: 'b-005', bridgeName: 'Axelar Network', asset: 'ATOM', avgTime: 18, feeRate: 0.0015, liquidity: 24000000, volume24h: 2400000, successRate: 99.78, status: 'live', hops: 1, requiredConfirmations: 12, description: 'ATOM 通过 Axelar 跨至 Cosmos Hub', tvl: 24000000, participants: 480, tags: ['Axelar', 'Cosmos'] },
];

const LIQUIDITY_POOLS: LiquidityPool[] = [
  { id: 'l-001', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', chain: 'eth', asset: 'USDT', totalLiquidity: 248000000, availableLiquidity: 184000000, utilization: 26, apr: 8.4, rewards: [{ token: 'ZSD', perDay: 12400, apr: 5.2 }, { token: 'ZSDEX', perDay: 1840, apr: 3.2 }], providers: 1240, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 7, description: '官方桥 Ethereum 端 USDT 流动性池', audit: ['CertiK', 'SlowMist'] },
  { id: 'l-002', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', chain: 'eth', asset: 'USDC', totalLiquidity: 184000000, availableLiquidity: 124000000, utilization: 33, apr: 7.8, rewards: [{ token: 'ZSD', perDay: 8400, apr: 4.8 }, { token: 'ZSDEX', perDay: 1240, apr: 3.0 }], providers: 980, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 7, description: '官方桥 Ethereum 端 USDC 流动性池', audit: ['CertiK', 'SlowMist'] },
  { id: 'l-003', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', chain: 'bsc', asset: 'USDT', totalLiquidity: 84000000, availableLiquidity: 64000000, utilization: 24, apr: 6.4, rewards: [{ token: 'STG', perDay: 4800, apr: 4.2 }, { token: 'ZSD', perDay: 2400, apr: 2.2 }], providers: 620, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 3, description: 'LayerZero BSC 端 USDT 流动性池', audit: ['CertiK'] },
  { id: 'l-004', bridgeId: 'b-004', bridgeName: 'Stargate Finance', chain: 'arbitrum', asset: 'USDC', totalLiquidity: 124000000, availableLiquidity: 84000000, utilization: 32, apr: 9.2, rewards: [{ token: 'STG', perDay: 8400, apr: 6.4 }, { token: 'ZSD', perDay: 3200, apr: 2.8 }], providers: 880, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 0, description: 'Stargate Arbitrum 端 USDC 池，即时终局', audit: ['CertiK', 'Zellic'] },
  { id: 'l-005', bridgeId: 'b-003', bridgeName: 'Wormhole Portal', chain: 'solana', asset: 'USDC', totalLiquidity: 64000000, availableLiquidity: 48000000, utilization: 25, apr: 7.2, rewards: [{ token: 'W', perDay: 2400, apr: 4.4 }, { token: 'ZSD', perDay: 1840, apr: 2.8 }], providers: 480, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 1, description: 'Wormhole Solana 端 USDC 流动性池', audit: ['CertiK', 'Neodyme'] },
  { id: 'l-006', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', chain: 'eth', asset: 'ETH', totalLiquidity: 124000000, availableLiquidity: 84000000, utilization: 32, apr: 5.6, rewards: [{ token: 'ZSD', perDay: 4800, apr: 3.2 }, { token: 'ZSDEX', perDay: 1200, apr: 2.4 }], providers: 720, updatedAt: '2026-07-19', status: 'live', lockPeriod: 7, description: '官方桥 Ethereum 端 ETH 流动性池', audit: ['CertiK', 'SlowMist'] },
  { id: 'l-007', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', chain: 'polygon', asset: 'USDT', totalLiquidity: 48000000, availableLiquidity: 32000000, utilization: 33, apr: 6.8, rewards: [{ token: 'STG', perDay: 2400, apr: 4.4 }, { token: 'ZSD', perDay: 1240, apr: 2.4 }], providers: 380, updatedAt: '2026-07-19', status: 'incentivized', lockPeriod: 3, description: 'LayerZero Polygon 端 USDT 池', audit: ['CertiK'] },
  { id: 'l-008', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', chain: 'zs-chain', asset: 'ZSD', totalLiquidity: 184000000, availableLiquidity: 124000000, utilization: 33, apr: 4.2, rewards: [{ token: 'ZSDEX', perDay: 8400, apr: 4.2 }], providers: 1840, updatedAt: '2026-07-19', status: 'live', lockPeriod: 0, description: '官方桥 ZS-Chain 端 ZSD 流动性池', audit: ['CertiK', 'SlowMist'] },
];

const VALIDATORS: Validator[] = [
  { id: 'v-001', name: 'Coinbase Cloud', status: 'active', stake: 24800000, uptime: 99.98, blocks: 8420, blocksTotal: 8420, missed: 0, jailed: 0, commission: 5, delegators: 12480, apr: 8.4, region: '北美', joinedAt: '2024-03-12', updatedAt: '2026-07-19', description: 'Coinbase Cloud 是行业领先的企业级 PoS 验证节点运营商', logo: '🏛️', contact: 'support@coinbase.com', website: 'coinbase.com/cloud', performance: [], totalRewards: 1840000, tags: ['企业级', '高可用', 'SOC2'] },
  { id: 'v-002', name: 'Binance Staking', status: 'active', stake: 18400000, uptime: 99.92, blocks: 8420, blocksTotal: 8420, missed: 0, jailed: 0, commission: 8, delegators: 18400, apr: 7.8, region: '全球', joinedAt: '2024-03-15', updatedAt: '2026-07-19', description: 'Binance 官方验证节点服务，深度参与 PoS 生态', logo: '🟡', contact: 'staking@binance.com', website: 'binance.com/staking', performance: [], totalRewards: 1480000, tags: ['交易所', '高流动性', '全球化'] },
  { id: 'v-003', name: 'Figment Networks', status: 'active', stake: 12400000, uptime: 99.95, blocks: 8420, blocksTotal: 8420, missed: 0, jailed: 0, commission: 10, delegators: 4280, apr: 7.2, region: '北美', joinedAt: '2024-04-08', updatedAt: '2026-07-19', description: 'Figment 是领先的区块链基础设施提供商', logo: '🌐', contact: 'info@figment.io', website: 'figment.io', performance: [], totalRewards: 840000, tags: ['基础设施', '多链', '企业'] },
  { id: 'v-004', name: 'P2P Validator', status: 'active', stake: 8400000, uptime: 99.88, blocks: 8420, blocksTotal: 8420, missed: 1, jailed: 0, commission: 5, delegators: 2840, apr: 8.0, region: '欧洲', joinedAt: '2024-04-15', updatedAt: '2026-07-19', description: 'P2P Validator 是知名非托管 PoS 验证服务', logo: '🛡️', contact: 'support@p2p.org', website: 'p2p.org', performance: [], totalRewards: 620000, tags: ['非托管', '开源', '社区'] },
  { id: 'v-005', name: 'Chorus One', status: 'active', stake: 6400000, uptime: 99.94, blocks: 8420, blocksTotal: 8420, missed: 0, jailed: 0, commission: 12, delegators: 1840, apr: 6.8, region: '欧洲', joinedAt: '2024-05-12', updatedAt: '2026-07-19', description: 'Chorus One 专注 PoS 验证和 MEV 服务', logo: '🎵', contact: 'team@chorus.one', website: 'chorus.one', performance: [], totalRewards: 480000, tags: ['MEV', '开源', '研究'] },
  { id: 'v-006', name: 'Everstake', status: 'active', stake: 4800000, uptime: 99.86, blocks: 8420, blocksTotal: 8420, missed: 1, jailed: 0, commission: 5, delegators: 1240, apr: 8.2, region: '欧洲', joinedAt: '2024-06-08', updatedAt: '2026-07-19', description: 'Everstake 是知名 PoS 验证服务', logo: '⚡', contact: 'support@everstake.one', website: 'everstake.one', performance: [], totalRewards: 380000, tags: ['非托管', '多链'] },
  { id: 'v-007', name: 'ZSDEX Validator 01', status: 'active', stake: 12400000, uptime: 99.96, blocks: 8420, blocksTotal: 8420, missed: 0, jailed: 0, commission: 5, delegators: 8420, apr: 8.6, region: '亚太', joinedAt: '2024-03-12', updatedAt: '2026-07-19', description: '中萨数字科技交易所官方验证节点', logo: '🟢', contact: 'validator@zsdex.com', website: 'zsdex.com', performance: [], totalRewards: 1240000, tags: ['官方', '亚太', '高优'] },
  { id: 'v-008', name: 'HashQuark', status: 'jailed', stake: 1240000, uptime: 96.42, blocks: 8120, blocksTotal: 8420, missed: 24, jailed: 1, commission: 8, delegators: 480, apr: 0, region: '亚太', joinedAt: '2024-08-12', updatedAt: '2026-07-15', description: 'HashQuark 因双签事件被监禁', logo: '⚠️', contact: 'support@hashquark.io', website: 'hashquark.io', performance: [], totalRewards: 124000, tags: ['已监禁', '历史违规'] },
];

const WRAPPED_ASSETS: WrappedAsset[] = [
  { id: 'w-001', symbol: 'ZSD', name: 'ZSDEX Dollar', originalChain: 'zs-chain', originalAddress: '0x...zs', wrappedAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', totalSupply: 248000000, holders: 18420, volume24h: 8400000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'canonical', audit: ['CertiK', 'SlowMist'], description: 'ZSD 平台稳定币官方桥接至 Ethereum' },
  { id: 'w-002', symbol: 'ZSDEX', name: 'ZSDEX Token', originalChain: 'zs-chain', originalAddress: '0x...zs', wrappedAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', totalSupply: 184000000, holders: 12480, volume24h: 18400000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'canonical', audit: ['CertiK', 'SlowMist'], description: 'ZSDEX 平台币跨链至 Ethereum' },
  { id: 'w-003', symbol: 'ZSD.e', name: 'ZSDEX Dollar (Ethereum)', originalChain: 'eth', originalAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', wrappedAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', totalSupply: 124000000, holders: 8420, volume24h: 4800000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'wrapped', audit: ['CertiK'], description: 'Ethereum 上 ZSD 桥接资产' },
  { id: 'w-004', symbol: 'WBTC', name: 'Wrapped Bitcoin', originalChain: 'bitcoin', originalAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', wrappedAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', bridgeId: 'b-003', bridgeName: 'Wormhole Portal', totalSupply: 248000, holders: 184000, volume24h: 124000000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'wrapped', audit: ['CertiK'], description: 'Bitcoin 通过 Wormhole 跨链资产' },
  { id: 'w-005', symbol: 'soBONK', name: 'Solana BONK (Ethereum)', originalChain: 'solana', originalAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', wrappedAddress: '0x1151cb3d861920e07a38e03eed2ba0b4f0bb9d2e', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', totalSupply: 68000000000000, holders: 124000, volume24h: 8400000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'wrapped', audit: ['CertiK'], description: 'BONK 通过 LayerZero 跨链' },
  { id: 'w-006', symbol: 'soUSDC', name: 'Solana USDC', originalChain: 'solana', originalAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', wrappedAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', totalSupply: 1840000000, holders: 248000, volume24h: 184000000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'canonical', audit: ['CertiK'], description: 'USDC 通过 LayerZero OFT 在 Solana/Ethereum 互通' },
  { id: 'w-007', symbol: 'm.USDT', name: 'Polygon USDT', originalChain: 'polygon', originalAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', wrappedAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', bridgeId: 'b-007', bridgeName: 'Polygon PoS Bridge', totalSupply: 1240000000, holders: 184000, volume24h: 48000000, updatedAt: '2026-07-19', status: 'live', peg: 1.0, type: 'canonical', audit: ['CertiK'], description: 'Polygon 网络 USDT 官方桥接' },
];

const BRIDGE_HISTORY: BridgeHistory[] = [
  { id: 'h-001', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', user: '0x884f...3a2e', source: 'zs-chain', target: 'eth', asset: 'ZSD', amount: 12480, fee: 12.48, status: 'completed', hash: '0xabc...123', startAt: '2026-07-19 11:42:18', endAt: '2026-07-19 11:42:32', timeUsed: 14, description: 'ZSD 跨链至 Ethereum' },
  { id: 'h-002', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', user: '0x1a2b...4d5e', source: 'eth', target: 'bsc', asset: 'USDC', amount: 24000, fee: 19.2, status: 'confirming', hash: '0xdef...456', startAt: '2026-07-19 11:43:08', endAt: '-', timeUsed: 0, description: 'USDC 跨链至 BSC' },
  { id: 'h-003', bridgeId: 'b-003', bridgeName: 'Wormhole Portal', user: '0x7c8d...9e0f', source: 'solana', target: 'eth', asset: 'soUSDC', amount: 18420, fee: 22.1, status: 'completed', hash: '0xghi...789', startAt: '2026-07-19 11:40:12', endAt: '2026-07-19 11:41:24', timeUsed: 72, description: 'USDC 跨链至 Ethereum' },
  { id: 'h-004', bridgeId: 'b-004', bridgeName: 'Stargate Finance', user: '0x4e5f...6a7b', source: 'arbitrum', target: 'optimism', asset: 'USDC', amount: 8420, fee: 8.42, status: 'completed', hash: '0xjkl...012', startAt: '2026-07-19 11:38:18', endAt: '2026-07-19 11:38:46', timeUsed: 28, description: 'Stargate 即时跨链' },
  { id: 'h-005', bridgeId: 'b-001', bridgeName: 'ZSDEX Bridge 官方桥', user: '0x9d8c...7b6a', source: 'eth', target: 'zs-chain', asset: 'USDT', amount: 32000, fee: 32.0, status: 'completed', hash: '0xmno...345', startAt: '2026-07-19 11:35:42', endAt: '2026-07-19 11:36:14', timeUsed: 32, description: 'USDT 跨链至 ZS-Chain' },
  { id: 'h-006', bridgeId: 'b-002', bridgeName: 'LayerZero OFT Bridge', user: '0x2c3d...4e5f', source: 'eth', target: 'solana', asset: 'BONK', amount: 240000000, fee: 28.0, status: 'failed', hash: '0xpqr...678', startAt: '2026-07-19 11:30:08', endAt: '2026-07-19 11:32:18', timeUsed: 130, description: 'BONK 跨链失败 (滑点超限)' },
  { id: 'h-007', bridgeId: 'b-005', bridgeName: 'Axelar Network', user: '0x5f6a...7b8c', source: 'eth', target: 'cosmos', asset: 'ATOM', amount: 1240, fee: 1.86, status: 'pending', hash: '0sstu...901', startAt: '2026-07-19 11:45:18', endAt: '-', timeUsed: 0, description: 'ATOM 跨链至 Cosmos Hub' },
  { id: 'h-008', bridgeId: 'b-007', bridgeName: 'Polygon PoS Bridge', user: '0x8a9b...0c1d', source: 'eth', target: 'polygon', asset: 'ETH', amount: 4.8, fee: 0.0024, status: 'completed', hash: '0xvwx...234', startAt: '2026-07-19 11:32:08', endAt: '2026-07-19 11:32:48', timeUsed: 40, description: 'ETH 跨至 Polygon' },
];

const APPLICATIONS: Application[] = [
  { id: 'a-001', type: 'bridge', company: 'Hyperlane Protocol', contact: '王明', email: 'contact@hyperlane.xyz', region: '北美', description: '申请 Hyperlane 跨链协议接入 ZSDEX 生态', expectedTvl: 50000000, stage: 'review', submittedAt: '2026-06-15', updatedAt: '2026-07-12', progress: 35, reviewer: '技术审查组' },
  { id: 'a-002', type: 'validator', company: 'Chainlayer', contact: '李华', email: 'bd@chainlayer.io', region: '欧洲', description: '申请成为 ZS-Chain 验证节点运营商', expectedTvl: 5000000, stage: 'audit', submittedAt: '2026-06-22', updatedAt: '2026-07-08', progress: 50, reviewer: '运营组' },
  { id: 'a-003', type: 'operator', company: 'CrossChain Labs', contact: '张伟', email: 'team@crosschain.io', region: '亚太', description: '申请成为跨链桥流动性做市商', expectedTvl: 20000000, stage: 'kyb', submittedAt: '2026-07-01', updatedAt: '2026-07-15', progress: 60, reviewer: '商务组' },
  { id: 'a-004', type: 'partner', company: 'Allbridge', contact: 'Anna Chen', email: 'bd@allbridge.io', region: '欧洲', description: '申请战略合作，集成 Allbridge 跨链协议', expectedTvl: 30000000, stage: 'tech-test', submittedAt: '2026-05-20', updatedAt: '2026-07-10', progress: 80, reviewer: '技术审查组' },
  { id: 'a-005', type: 'auditor', company: 'BlockSec', contact: '周敏', email: 'team@blocksec.com', region: '亚太', description: '申请成为跨链桥安全审计合作方', expectedTvl: 0, stage: 'live', submittedAt: '2026-04-15', updatedAt: '2026-06-08', progress: 100, reviewer: '安全组' },
];

// ============== 主组件 ==============

export function PortalBridge() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [bridgeTypeFilter, setBridgeTypeFilter] = useState<BridgeType | 'all'>('all');
  const [bridgeStatusFilter, setBridgeStatusFilter] = useState<BridgeStatus | 'all'>('all');
  const [bridgeSecurityFilter, setBridgeSecurityFilter] = useState<SecurityLevel | 'all'>('all');
  const [routeStatusFilter, setRouteStatusFilter] = useState<'live' | 'beta' | 'paused' | 'all'>('all');
  const [poolStatusFilter, setPoolStatusFilter] = useState<'live' | 'incentivized' | 'paused' | 'all'>('all');
  const [validatorStatusFilter, setValidatorStatusFilter] = useState<ValidatorStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'txCount' | 'updated'>('tvl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFrom, setTransferFrom] = useState<ChainNetwork>('zs-chain');
  const [transferTo, setTransferTo] = useState<ChainNetwork>('eth');
  const [transferAsset, setTransferAsset] = useState('ZSD');
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('bridge');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyTvl, setApplyTvl] = useState('');
  const [applyDesc, setApplyDesc] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalTvl: 11200000000,
    tvl24hChange: 3.2,
    totalBridges: 24,
    totalRoutes: 186,
    totalPools: 48,
    totalValidators: 280,
    activeValidators: 248,
    totalVolume24h: 484000000,
    totalTx24h: 84200,
    avgTime: 12,
    successRate: 99.84,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalTvl: prev.totalTvl + Math.floor(Math.random() * 6000000 - 1500000),
        totalVolume24h: prev.totalVolume24h + Math.floor(Math.random() * 3000000 - 800000),
        totalTx24h: prev.totalTx24h + Math.floor(Math.random() * 8 - 2),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !drawer.open && !helpOpen) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      } else if (e.key >= '1' && e.key <= '9' && !drawer.open && !helpOpen) {
        const tabs: Tab[] = ['overview', 'bridges', 'routes', 'liquidity', 'validators', 'assets', 'history', 'apply', 'help'];
        const idx = Number(e.key) - 1;
        if (tabs[idx]) setTab(tabs[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  const filteredBridges = useMemo(() => {
    let arr = BRIDGES.filter((b) => {
      if (search && !`${b.name} ${b.symbol} ${b.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (bridgeTypeFilter !== 'all' && b.type !== bridgeTypeFilter) return false;
      if (bridgeStatusFilter !== 'all' && b.status !== bridgeStatusFilter) return false;
      if (bridgeSecurityFilter !== 'all' && b.security !== bridgeSecurityFilter) return false;
      return true;
    });
    arr = arr.sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === 'tvl') { av = a.tvl; bv = b.tvl; }
      else if (sortBy === 'volume') { av = a.volume24h; bv = b.volume24h; }
      else if (sortBy === 'txCount') { av = a.txCount24h; bv = b.txCount24h; }
      else { av = new Date(a.updatedAt).getTime(); bv = new Date(b.updatedAt).getTime(); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [search, bridgeTypeFilter, bridgeStatusFilter, bridgeSecurityFilter, sortBy, sortDir]);

  const filteredRoutes = useMemo(() => {
    let arr = ROUTES.filter((r) => {
      if (search && !`${r.bridgeName} ${r.asset} ${r.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (routeStatusFilter !== 'all' && r.status !== routeStatusFilter) return false;
      return true;
    });
    return arr;
  }, [search, routeStatusFilter]);

  const filteredPools = useMemo(() => {
    let arr = LIQUIDITY_POOLS.filter((l) => {
      if (search && !`${l.bridgeName} ${l.asset} ${l.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (poolStatusFilter !== 'all' && l.status !== poolStatusFilter) return false;
      return true;
    });
    return arr;
  }, [search, poolStatusFilter]);

  const filteredValidators = useMemo(() => {
    let arr = VALIDATORS.filter((v) => {
      if (search && !`${v.name} ${v.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (validatorStatusFilter !== 'all' && v.status !== validatorStatusFilter) return false;
      return true;
    });
    return arr.sort((a, b) => b.stake - a.stake);
  }, [search, validatorStatusFilter]);

  const openBridge = useCallback((id: string) => setDrawer({ open: true, type: 'bridge', payload: id }), []);
  const openRoute = useCallback((id: string) => setDrawer({ open: true, type: 'route', payload: id }), []);
  const openLiquidity = useCallback((id: string) => setDrawer({ open: true, type: 'liquidity', payload: id }), []);
  const openValidator = useCallback((id: string) => setDrawer({ open: true, type: 'validator', payload: id }), []);
  const openAsset = useCallback((id: string) => setDrawer({ open: true, type: 'asset', payload: id }), []);
  const openDeposit = useCallback((id: string) => setDrawer({ open: true, type: 'deposit', payload: id }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);

  const submitTransfer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
    setTransferAmount('');
  }, []);

  const submitApply = useCallback(() => {
    if (applyStep < 3) { setApplyStep(applyStep + 1); return; }
    setApplyStep(0);
    setApplyCompany(''); setApplyContact(''); setApplyEmail(''); setApplyTvl(''); setApplyDesc('');
    setDrawer({ open: false, type: null, payload: null });
  }, [applyStep]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pb-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pb-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pb-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pb-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pb-stagger > * { animation: pb-fade-up 0.4s ease-out both; }
        .pb-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pb-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pb-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pb-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pb-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pb-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pb-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pb-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pb-pulse { animation: pb-pulse 2.4s ease-in-out infinite; }
        .pb-float { animation: pb-float 3s ease-in-out infinite; }
        .pb-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pb-shimmer 2.4s linear infinite; }
        .pb-drawer { animation: pb-slide-in 0.28s ease-out; }
        .pb-bar { transform-origin: bottom; animation: pb-bar 0.6s ease-out; }
        .pb-row:hover { background-color: ${BRAND.cardHover}; }
        .pb-spin { animation: pb-spin 2s linear infinite; }
      `}</style>

      {/* ============== Hero ============== */}
      <section className="px-6 md:px-10 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: BRAND.textMuted }}>
            <Link2 size={12} />
            <span>FrontPortal</span>
            <ChevronRight size={12} />
            <span style={{ color: BRAND.text }}>跨链桥中心</span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                <ArrowRightLeft size={24} style={{ color: BRAND.primary }} />
                跨链桥中心
              </h1>
              <p className="text-sm max-w-2xl" style={{ color: BRAND.textMuted }}>
                中萨数字科技交易所跨链基础设施：覆盖 {BRIDGES.length} 大主流跨链桥、{ROUTES.length}+ 跨链路线、{LIQUIDITY_POOLS.length} 个流动性池、
                {VALIDATORS.length} 个验证节点。构建"资产-衍生-量化-NFT-DeFi-跨链"全栈闭环。
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-[10px] px-2 py-1 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                  <span className="w-1.5 h-1.5 rounded-full pb-pulse" style={{ backgroundColor: BRAND.primary }} />
                  实时网络：{kpi.activeValidators} / {kpi.totalValidators} 节点在线
                </span>
                <span className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  24h 跨链：${formatTvl(kpi.totalVolume24h)} · {kpi.totalTx24h.toLocaleString()} 笔
                </span>
                <span className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  平均到账：{kpi.avgTime} 分钟
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHelpOpen(true)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <Keyboard size={12} />快捷键
              </button>
              <button onClick={() => setTab('bridges')} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <ArrowRightLeft size={12} />开始跨链
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 md:px-10 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '总锁仓 TVL', value: kpi.totalTvl, decimals: 0, prefix: '$', suffix: '', sub: `24h ${kpi.tvl24hChange >= 0 ? '+' : ''}${kpi.tvl24hChange.toFixed(2)}%`, icon: Lock, color: BRAND.primary },
            { label: '24h 跨链量', value: kpi.totalVolume24h, decimals: 0, prefix: '$', suffix: '', sub: `${kpi.totalTx24h.toLocaleString()} 笔`, icon: ArrowRightLeft, color: '#FFB800' },
            { label: '活跃节点', value: kpi.activeValidators, decimals: 0, prefix: '', suffix: ` / ${kpi.totalValidators}`, sub: '在线率 88.6%', icon: ShieldCheck, color: '#60A5FA' },
            { label: '平均成功率', value: kpi.successRate, decimals: 2, prefix: '', suffix: '%', sub: `平均到账 ${kpi.avgTime} 分钟`, icon: Gauge, color: BRAND.primary },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.label} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{it.label}</span>
                  <Icon size={14} style={{ color: it.color }} />
                </div>
                <div className="text-xl font-semibold font-mono" style={{ color: BRAND.text }}>{it.prefix}{formatTvl(it.value)}{it.suffix}</div>
                <div className="text-[10px] mt-0.5" style={{ color: it.color }}>{it.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============== 搜索 + Tab ============== */}
      <section className="px-6 md:px-10 pb-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textMuted }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索跨链桥 / 路线 / 资产 / 节点 ...  (按 / 聚焦)" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} style={{ color: BRAND.textMuted }}><X size={14} /></button>}
            </div>
            {tab === 'bridges' && (
              <>
                <select value={bridgeTypeFilter} onChange={(e) => setBridgeTypeFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部类型</option>
                  <option value="canonical">规范桥</option>
                  <option value="liquidity">流动性桥</option>
                  <option value="lock-mint">锁仓铸造</option>
                  <option value="burn-mint">销毁铸造</option>
                  <option value="optimistic">Optimistic</option>
                  <option value="zk">ZK 证明</option>
                  <option value="native">原生</option>
                </select>
                <select value={bridgeSecurityFilter} onChange={(e) => setBridgeSecurityFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部安全等级</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                  <option value="experimental">实验</option>
                </select>
              </>
            )}
            {tab === 'routes' && (
              <select value={routeStatusFilter} onChange={(e) => setRouteStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                <option value="live">在线</option>
                <option value="beta">Beta</option>
                <option value="paused">暂停</option>
              </select>
            )}
            {tab === 'liquidity' && (
              <select value={poolStatusFilter} onChange={(e) => setPoolStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                <option value="live">运行中</option>
                <option value="incentivized">激励中</option>
                <option value="paused">暂停</option>
              </select>
            )}
            {tab === 'validators' && (
              <select value={validatorStatusFilter} onChange={(e) => setValidatorStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                <option value="active">活跃</option>
                <option value="jailed">监禁中</option>
                <option value="slashed">已惩罚</option>
                <option value="pending">待激活</option>
                <option value="exiting">退出中</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { key: 'overview', label: '总览', icon: Activity },
              { key: 'bridges', label: '跨链桥', icon: ArrowRightLeft },
              { key: 'routes', label: '跨链路线', icon: GitBranch },
              { key: 'liquidity', label: '流动性', icon: Droplets },
              { key: 'validators', label: '验证节点', icon: ShieldCheck },
              { key: 'assets', label: '桥接资产', icon: Coins },
              { key: 'history', label: '历史交易', icon: Clock },
              { key: 'apply', label: '申请接入', icon: Handshake },
              { key: 'help', label: '帮助', icon: HelpCircle },
            ].map((it) => {
              const Icon = it.icon;
              const active = tab === it.key;
              return (
                <button key={it.key} onClick={() => setTab(it.key as Tab)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 whitespace-nowrap" style={{ backgroundColor: active ? BRAND.primary : BRAND.card, color: active ? '#000' : BRAND.text, border: `1px solid ${active ? BRAND.primary : BRAND.border}` }}>
                  <Icon size={12} />{it.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== Content ============== */}
      <main className="px-6 md:px-10 pb-10">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && <OverviewTab kpi={kpi} onGoTab={setTab} onOpenBridge={openBridge} onOpenRoute={openRoute} onOpenValidator={openValidator} />}
          {tab === 'bridges' && <BridgesTab bridges={filteredBridges} search={search} setSearch={setSearch} searchRef={searchRef} sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} typeFilter={bridgeTypeFilter} setTypeFilter={setBridgeTypeFilter} statusFilter={bridgeStatusFilter} setStatusFilter={setBridgeStatusFilter} securityFilter={bridgeSecurityFilter} setSecurityFilter={setBridgeSecurityFilter} onOpen={openBridge} onDeposit={openDeposit} />}
          {tab === 'routes' && <RoutesTab routes={filteredRoutes} search={search} setSearch={setSearch} searchRef={searchRef} statusFilter={routeStatusFilter} setStatusFilter={setRouteStatusFilter} onOpen={openRoute} onTransfer={() => setDrawer({ open: true, type: 'deposit', payload: 'transfer' })} />}
          {tab === 'liquidity' && <LiquidityTab pools={filteredPools} search={search} setSearch={setSearch} searchRef={searchRef} statusFilter={poolStatusFilter} setStatusFilter={setPoolStatusFilter} onOpen={openLiquidity} onDeposit={openDeposit} />}
          {tab === 'validators' && <ValidatorsTab validators={filteredValidators} search={search} setSearch={setSearch} searchRef={searchRef} statusFilter={validatorStatusFilter} setStatusFilter={setValidatorStatusFilter} onOpen={openValidator} />}
          {tab === 'assets' && <AssetsTab assets={WRAPPED_ASSETS} search={search} setSearch={setSearch} searchRef={searchRef} onOpen={openAsset} />}
          {tab === 'history' && <HistoryTab history={BRIDGE_HISTORY} />}
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
                多链资产 · 一键互通
              </h2>
              <p className="text-sm" style={{ color: BRAND.textMuted }}>跨链桥 / 路线 / 流动性 / 节点 / 桥接资产 / 历史交易 / 申请接入</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setTab('bridges')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}><ArrowRightLeft size={14} />开始跨链</button>
              <button onClick={() => setTab('liquidity')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Droplets size={14} />提供流动性</button>
              <button onClick={() => setTab('apply')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Handshake size={14} />申请接入</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== Drawers ============== */}
      {drawer.open && drawer.type === 'bridge' && drawer.payload && (
        <BridgeDrawer bridge={BRIDGES.find((b) => b.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'route' && drawer.payload && (
        <RouteDrawer route={ROUTES.find((r) => r.id === drawer.payload)!} onClose={closeDrawer} onTransfer={() => setDrawer({ open: true, type: 'deposit', payload: 'transfer' })} />
      )}
      {drawer.open && drawer.type === 'liquidity' && drawer.payload && (
        <LiquidityDrawer pool={LIQUIDITY_POOLS.find((l) => l.id === drawer.payload)!} onClose={closeDrawer} onDeposit={() => openDeposit(drawer.payload!)} />
      )}
      {drawer.open && drawer.type === 'validator' && drawer.payload && (
        <ValidatorDrawer validator={VALIDATORS.find((v) => v.id === drawer.payload)!} onClose={closeDrawer} />
      )}
      {drawer.open && drawer.type === 'asset' && drawer.payload && (
        <AssetDrawer asset={WRAPPED_ASSETS.find((a) => a.id === drawer.payload)!} onClose={closeDrawer} onTransfer={() => setDrawer({ open: true, type: 'deposit', payload: 'transfer' })} />
      )}
      {drawer.open && drawer.type === 'deposit' && (
        <TransferDrawer amount={transferAmount} setAmount={setTransferAmount} from={transferFrom} setFrom={setTransferFrom} to={transferTo} setTo={setTransferTo} asset={transferAsset} setAsset={setTransferAsset} onClose={closeDrawer} onSubmit={submitTransfer} />
      )}
      {drawer.open && drawer.type === 'apply' && (
        <ApplyDrawer onClose={closeDrawer} applyStep={applyStep} setApplyStep={setApplyStep} applyType={applyType} setApplyType={setApplyType} applyCompany={applyCompany} setApplyCompany={setApplyCompany} applyContact={applyContact} setApplyContact={setApplyContact} applyEmail={applyEmail} setApplyEmail={setApplyEmail} applyTvl={applyTvl} setApplyTvl={setApplyTvl} applyDesc={applyDesc} setApplyDesc={setApplyDesc} applyRegion={applyRegion} setApplyRegion={setApplyRegion} submitApply={submitApply} />
      )}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

// ============== 状态徽章 ==============

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    live: { label: '运行中', bg: 'rgba(20,184,129,0.12)', color: BRAND.primary },
    beta: { label: 'Beta', bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
    new: { label: '新上线', bg: 'rgba(20,184,129,0.12)', color: BRAND.primary },
    boosted: { label: 'Boost', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    paused: { label: '暂停', bg: 'rgba(255,76,76,0.12)', color: '#FF4C4C' },
    maintenance: { label: '维护', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    deprecated: { label: '已弃用', bg: 'rgba(176,176,176,0.12)', color: '#B0B0B0' },
    active: { label: '活跃', bg: 'rgba(20,184,129,0.12)', color: BRAND.primary },
    jailed: { label: '监禁', bg: 'rgba(255,76,76,0.12)', color: '#FF4C4C' },
    slashed: { label: '惩罚', bg: 'rgba(255,76,76,0.12)', color: '#FF4C4C' },
    pending: { label: '待激活', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    exiting: { label: '退出中', bg: 'rgba(176,176,176,0.12)', color: '#B0B0B0' },
    confirming: { label: '确认中', bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
    completed: { label: '已完成', bg: 'rgba(20,184,129,0.12)', color: BRAND.primary },
    failed: { label: '失败', bg: 'rgba(255,76,76,0.12)', color: '#FF4C4C' },
    refunded: { label: '已退款', bg: 'rgba(176,176,176,0.12)', color: '#B0B0B0' },
    incentivized: { label: '激励中', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    migrating: { label: '迁移中', bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
    submitted: { label: '已提交', bg: 'rgba(176,176,176,0.12)', color: '#B0B0B0' },
    review: { label: '审核中', bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
    audit: { label: '审计中', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    kyb: { label: 'KYB', bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
    'tech-test': { label: '技术测试', bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
  };
  const cfg = config[status] || { label: status, bg: 'rgba(176,176,176,0.12)', color: '#B0B0B0' };
  return <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>{cfg.label}</span>;
}

// ============== Tabs ==============

function OverviewTab({ kpi, onGoTab, onOpenBridge, onOpenRoute, onOpenValidator }: { kpi: KpiSnapshot; onGoTab: (t: Tab) => void; onOpenBridge: (id: string) => void; onOpenRoute: (id: string) => void; onOpenValidator: (id: string) => void }) {
  const topBridges = [...BRIDGES].sort((a, b) => b.tvl - a.tvl).slice(0, 4);
  const topRoutes = [...ROUTES].sort((a, b) => b.volume24h - a.volume24h).slice(0, 6);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Activity size={14} style={{ color: BRAND.primary }} />
              实时 TVL 分布
            </h3>
            <span className="text-[10px] flex items-center gap-1 pb-pulse" style={{ color: BRAND.primary }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
              实时
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Ethereum', value: 5840000000, color: '#627EEA' },
              { label: 'BNB Chain', value: 1840000000, color: '#F3BA2F' },
              { label: 'Polygon', value: 1240000000, color: '#8247E5' },
              { label: 'Arbitrum', value: 1240000000, color: '#28A0F0' },
              { label: 'Solana', value: 680000000, color: '#14F195' },
              { label: '其他公链', value: 360000000, color: BRAND.primary },
            ].map((it) => (
              <div key={it.label} className="flex items-center gap-3">
                <div className="text-xs w-24" style={{ color: BRAND.textMuted }}>{it.label}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full pb-bar" style={{ width: `${(it.value / 11200000000) * 100}%`, backgroundColor: it.color }} />
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
              24h 跨链路线 Top 6
            </h3>
            <button onClick={() => onGoTab('routes')} className="text-[10px] flex items-center gap-0.5" style={{ color: BRAND.primary }}>全部 <ChevronRight size={10} /></button>
          </div>
          <div className="space-y-1.5">
            {topRoutes.map((r) => (
              <div key={r.id} onClick={() => onOpenRoute(r.id)} className="flex items-center gap-2 p-2 rounded pb-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-1 text-[10px] font-mono flex-1" style={{ color: BRAND.text }}>
                  <span style={{ color: CHAIN_COLORS[r.source] }}>{CHAIN_LABELS[r.source]}</span>
                  <ArrowRight size={10} style={{ color: BRAND.textMuted }} />
                  <span style={{ color: CHAIN_COLORS[r.target] }}>{CHAIN_LABELS[r.target]}</span>
                  <span className="px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: BRAND.card, color: BRAND.primary }}>{r.asset}</span>
                </div>
                <div className="text-[10px] font-mono" style={{ color: BRAND.text }}>${formatTvl(r.volume24h)}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{formatTime(r.avgTime)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <ArrowRightLeft size={14} style={{ color: BRAND.primary }} />
            头部跨链桥
          </h3>
          <button onClick={() => onGoTab('bridges')} className="text-[10px] flex items-center gap-0.5" style={{ color: BRAND.primary }}>全部 <ChevronRight size={10} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-stagger">
          {topBridges.map((b) => (
            <div key={b.id} onClick={() => onOpenBridge(b.id)} className="p-4 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Network size={16} style={{ color: BRAND.primary }} />
                  <h4 className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.name}</h4>
                  <StatusBadge status={b.status} />
                </div>
                <ChevronRight size={14} style={{ color: BRAND.textMuted }} />
              </div>
              <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>{b.symbol} · {b.chains.length} 公链 · {b.supportedAssets} 资产</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>TVL</div>
                  <div className="text-sm font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(b.tvl)}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                  <div className="text-sm font-mono" style={{ color: BRAND.text }}>${formatTvl(b.volume24h)}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>到账</div>
                  <div className="text-sm font-mono" style={{ color: BRAND.text }}>{b.avgTime}m</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>成功率</div>
                  <div className="text-sm font-mono" style={{ color: BRAND.primary }}>{b.successRate.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
            <ShieldCheck size={14} style={{ color: BRAND.primary }} />
            网络健康度
          </h3>
          <div className="space-y-2">
            {[
              { label: '验证节点在线', value: kpi.activeValidators, total: kpi.totalValidators, color: BRAND.primary },
              { label: '当前跨链中', value: 184, total: 200, color: '#60A5FA' },
              { label: '24h 成功', value: 84068, total: 84200, color: BRAND.primary },
              { label: '24h 待确认', value: 132, total: 84200, color: '#FFB800' },
            ].map((it) => (
              <div key={it.label} className="flex items-center gap-3">
                <div className="text-xs w-24" style={{ color: BRAND.textMuted }}>{it.label}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full pb-bar" style={{ width: `${(it.value / it.total) * 100}%`, backgroundColor: it.color }} />
                </div>
                <div className="text-xs font-mono w-24 text-right" style={{ color: BRAND.text }}>{it.value.toLocaleString()} / {it.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
            <Sparkles size={14} style={{ color: BRAND.primary }} />
            跨链生态亮点
          </h3>
          <div className="space-y-1.5 text-[11px]" style={{ color: BRAND.textMuted }}>
            <div className="flex items-start gap-1.5"><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />覆盖 16 大公链生态，从 Bitcoin 到 ZS-Chain</div>
            <div className="flex items-start gap-1.5"><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />支持 7 种跨链技术：canonical / liquidity / lock-mint / OFT / Optimistic / ZK / native</div>
            <div className="flex items-start gap-1.5"><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />多家头部审计：CertiK / SlowMist / PeckShield / Trail of Bits / Quantstamp</div>
            <div className="flex items-start gap-1.5"><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />PoS 验证节点 280+，全球分布</div>
            <div className="flex items-start gap-1.5"><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />最低 1 USDT 起跨，最高 1000 万 USDT 单笔</div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg text-[10px] space-y-1" style={{ backgroundColor: 'rgba(255,184,0,0.05)', border: `1px solid rgba(255,184,0,0.2)`, color: '#FFB800' }}>
        <div className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={11} />合规与风险提示</div>
        <div>· 跨链桥数据为 mock 占位演示，资产价格、TVL、交易量等均为内部估算口径</div>
        <div>· 历史跨链交易不可撤销，请仔细核对目标链地址及资产类型</div>
        <div>· 跨链涉及智能合约风险、目标链拥堵、最终性延迟等多重不确定性</div>
        <div>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成对任何跨链项目的合规背书</div>
      </div>
    </div>
  );
}

function BridgesTab({ bridges, search, setSearch, searchRef, sortBy, setSortBy, sortDir, setSortDir, typeFilter, setTypeFilter, statusFilter, setStatusFilter, securityFilter, setSecurityFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px]" style={{ color: BRAND.textMuted }}>排序：</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          <option value="tvl">TVL</option>
          <option value="volume">24h 量</option>
          <option value="txCount">24h 笔数</option>
          <option value="updated">更新时间</option>
        </select>
        <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-2 py-1 rounded text-xs flex items-center gap-0.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
          {sortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}{sortDir === 'desc' ? '降序' : '升序'}
        </button>
        <span className="text-[10px] ml-auto" style={{ color: BRAND.textMuted }}>共 {bridges.length} 个跨链桥</span>
      </div>
      <div className="space-y-2 pb-stagger">
        {bridges.length === 0 ? (
          <div className="p-8 rounded-xl text-center text-sm" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>没有符合条件的跨链桥</div>
        ) : bridges.map((b: Bridge) => (
          <div key={b.id} onClick={() => onOpen(b.id)} className="p-4 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Network size={14} style={{ color: BRAND.primary }} />
                  <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.name}</h3>
                  <StatusBadge status={b.status} />
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>{b.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>安全 {b.security === 'high' ? '高' : b.security === 'medium' ? '中' : b.security === 'low' ? '低' : '实验'}</span>
                </div>
                <p className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>{b.description}</p>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {b.chains.slice(0, 8).map((c) => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: CHAIN_COLORS[c], border: `1px solid ${CHAIN_COLORS[c]}30` }}>{CHAIN_LABELS[c]}</span>
                  ))}
                  {b.chains.length > 8 && <span className="text-[10px]" style={{ color: BRAND.textMuted }}>+{b.chains.length - 8}</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {b.audits.map((a) => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.06)', color: BRAND.primary, border: `1px solid ${BRAND.primary}20` }}>✓ {a}</span>)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>TVL</div>
                <div className="text-base font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(b.tvl)}</div>
                <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>24h ${formatTvl(b.volume24h)} · {b.txCount24h.toLocaleString()} 笔</div>
                <div className="text-[10px] mt-0.5" style={{ color: BRAND.text }}>到账 {b.avgTime}m · {(b.feeRate * 100).toFixed(2)}% · {b.successRate.toFixed(2)}%</div>
                <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{b.supportedAssets} 资产 · 节点 {b.validators || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutesTab({ routes, search, setSearch, searchRef, statusFilter, setStatusFilter, onOpen, onTransfer }: any) {
  return (
    <div className="space-y-3">
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {routes.length} 条跨链路线</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pb-stagger">
        {routes.length === 0 ? (
          <div className="p-8 rounded-xl text-center text-sm col-span-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>没有符合条件的跨链路线</div>
        ) : routes.map((r: Route) => (
          <div key={r.id} onClick={() => onOpen(r.id)} className="p-3 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={r.status} />
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{r.asset}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 text-center">
                <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMuted }}>源链</div>
                <div className="text-xs font-semibold" style={{ color: CHAIN_COLORS[r.source] }}>{CHAIN_LABELS[r.source]}</div>
              </div>
              <ArrowRight size={14} style={{ color: BRAND.primary }} />
              <div className="flex-1 text-center">
                <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMuted }}>目标</div>
                <div className="text-xs font-semibold" style={{ color: CHAIN_COLORS[r.target] }}>{CHAIN_LABELS[r.target]}</div>
              </div>
            </div>
            <div className="text-[10px] mb-2 truncate" style={{ color: BRAND.textMuted }}>{r.bridgeName}</div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                <div className="text-[10px] font-mono" style={{ color: BRAND.text }}>${formatTvl(r.liquidity)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h</div>
                <div className="text-[10px] font-mono" style={{ color: BRAND.primary }}>${formatTvl(r.volume24h)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>到账</div>
                <div className="text-[10px] font-mono" style={{ color: BRAND.text }}>{r.avgTime}m</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidityTab({ pools, search, setSearch, searchRef, statusFilter, setStatusFilter, onOpen, onDeposit }: any) {
  return (
    <div className="space-y-3">
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {pools.length} 个流动性池</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-stagger">
        {pools.length === 0 ? (
          <div className="p-8 rounded-xl text-center text-sm col-span-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>没有符合条件的流动性池</div>
        ) : pools.map((l: LiquidityPool) => (
          <div key={l.id} onClick={() => onOpen(l.id)} className="p-4 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets size={14} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{l.asset} · {CHAIN_LABELS[l.chain]}</span>
                <StatusBadge status={l.status} />
              </div>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>{l.bridgeName}</span>
            </div>
            <p className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>{l.description}</p>
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span style={{ color: BRAND.textMuted }}>利用率</span>
                <span className="font-mono" style={{ color: BRAND.text }}>{l.utilization}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                <div className="h-full pb-bar" style={{ width: `${l.utilization}%`, backgroundColor: l.utilization > 80 ? '#FF4C4C' : l.utilization > 50 ? '#FFB800' : BRAND.primary }} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总流动性</div>
                <div className="text-[11px] font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(l.totalLiquidity)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>可用</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.text }}>${formatTvl(l.availableLiquidity)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APR</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.primary }}>{l.apr.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>LP</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.text }}>{l.providers.toLocaleString()}</div>
              </div>
            </div>
            {l.rewards.length > 0 && (
              <div className="mt-2 flex items-center gap-1 flex-wrap">
                {l.rewards.map((r) => <span key={r.token} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,184,0,0.08)', color: '#FFB800', border: `1px solid rgba(255,184,0,0.2)` }}>+{r.token} {r.apr.toFixed(1)}%</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidatorsTab({ validators, search, setSearch, searchRef, statusFilter, setStatusFilter, onOpen }: any) {
  return (
    <div className="space-y-3">
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {validators.length} 个验证节点</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-stagger">
        {validators.length === 0 ? (
          <div className="p-8 rounded-xl text-center text-sm col-span-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>没有符合条件的节点</div>
        ) : validators.map((v: Validator) => (
          <div key={v.id} onClick={() => onOpen(v.id)} className="p-4 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{v.logo}</span>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{v.name}</h3>
                  <p className="text-[10px]" style={{ color: BRAND.textMuted }}>{v.region} · 委托 {v.delegators.toLocaleString()} 人</p>
                </div>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <p className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>{v.description}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>质押</div>
                <div className="text-[11px] font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(v.stake)}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>在线率</div>
                <div className="text-[11px] font-mono" style={{ color: v.uptime > 99 ? BRAND.primary : '#FFB800' }}>{v.uptime.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APR</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.primary }}>{v.apr.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>佣金</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.text }}>{v.commission}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsTab({ assets, search, setSearch, searchRef, onOpen }: any) {
  return (
    <div className="space-y-3">
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {assets.length} 种桥接资产</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-stagger">
        {assets.map((a: WrappedAsset) => (
          <div key={a.id} onClick={() => onOpen(a.id)} className="p-4 rounded-xl cursor-pointer pb-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins size={14} style={{ color: BRAND.primary }} />
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</h3>
                  <p className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.name}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>{a.description}</div>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(96,165,250,0.08)', color: '#60A5FA', border: `1px solid rgba(96,165,250,0.2)` }}>原链: {CHAIN_LABELS[a.originalChain]}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>桥: {a.bridgeName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>类型: {a.type === 'wrapped' ? '包裹' : a.type === 'canonical' ? '规范' : '合成'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: a.peg === 1.0 ? BRAND.primary : '#FFB800', border: `1px solid ${a.peg === 1.0 ? BRAND.primary : '#FFB800'}40` }}>锚定 1:{a.peg}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>总供应</div>
                <div className="text-[11px] font-mono font-semibold" style={{ color: BRAND.primary }}>{a.totalSupply >= 1e9 ? `${(a.totalSupply / 1e9).toFixed(2)}B` : a.totalSupply >= 1e6 ? `${(a.totalSupply / 1e6).toFixed(2)}M` : a.totalSupply.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>持有人</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.text }}>{a.holders.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                <div className="text-[11px] font-mono" style={{ color: BRAND.text }}>${formatTvl(a.volume24h)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ history }: { history: BridgeHistory[] }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {history.length} 条近期交易</div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}` }}>
          <div className="col-span-2">时间</div>
          <div className="col-span-2">用户</div>
          <div className="col-span-2">跨链路线</div>
          <div className="col-span-1">资产</div>
          <div className="col-span-1 text-right">金额</div>
          <div className="col-span-1 text-right">手续费</div>
          <div className="col-span-1 text-right">用时</div>
          <div className="col-span-2 text-center">状态</div>
        </div>
        {history.map((h) => (
          <div key={h.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] pb-row" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
            <div className="col-span-2 font-mono" style={{ color: BRAND.textMuted }}>{h.startAt.split(' ')[1]}</div>
            <div className="col-span-2 font-mono" style={{ color: BRAND.text }}>{h.user}</div>
            <div className="col-span-2 font-mono">
              <span style={{ color: CHAIN_COLORS[h.source] }}>{CHAIN_LABELS[h.source]}</span>
              <ArrowRight size={8} className="inline mx-0.5" style={{ color: BRAND.textMuted }} />
              <span style={{ color: CHAIN_COLORS[h.target] }}>{CHAIN_LABELS[h.target]}</span>
            </div>
            <div className="col-span-1 font-mono" style={{ color: BRAND.text }}>{h.asset}</div>
            <div className="col-span-1 text-right font-mono font-semibold" style={{ color: BRAND.primary }}>{h.amount.toLocaleString()}</div>
            <div className="col-span-1 text-right font-mono" style={{ color: BRAND.textMuted }}>{h.fee.toFixed(2)}</div>
            <div className="col-span-1 text-right font-mono" style={{ color: BRAND.text }}>{h.timeUsed > 0 ? `${h.timeUsed}m` : '-'}</div>
            <div className="col-span-2 text-center"><StatusBadge status={h.status} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyTab({ applications, onApply, ...applyProps }: any) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
          <Handshake size={14} style={{ color: BRAND.primary }} />
          申请接入 ZSDEX 跨链生态
        </h3>
        <p className="text-[11px] mb-3" style={{ color: BRAND.textMuted }}>支持跨链桥接入、验证节点申请、做市商合作、战略合作、审计合作</p>
        <button onClick={onApply} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>开始申请</button>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>申请进度</h3>
        <div className="space-y-2 pb-stagger">
          {applications.map((a: Application) => (
            <div key={a.id} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} style={{ color: BRAND.primary }} />
                  <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.company}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>{a.type === 'bridge' ? '跨链桥' : a.type === 'validator' ? '验证节点' : a.type === 'operator' ? '做市商' : a.type === 'partner' ? '战略合作' : '审计'}</span>
                </div>
                <StatusBadge status={a.stage} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                <div><span style={{ color: BRAND.textMuted }}>联系人：</span><span style={{ color: BRAND.text }}>{a.contact}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>地区：</span><span style={{ color: BRAND.text }}>{a.region}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>预期 TVL：</span><span style={{ color: BRAND.text }}>${a.expectedTvl > 0 ? formatTvl(a.expectedTvl) : '-'}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>审核人：</span><span style={{ color: BRAND.text }}>{a.reviewer}</span></div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: BRAND.textMuted }}>进度</span>
                  <span className="font-mono" style={{ color: BRAND.primary }}>{a.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full pb-bar" style={{ width: `${a.progress}%`, backgroundColor: BRAND.primary }} />
                </div>
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
    <div className="space-y-3">
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
          <HelpCircle size={14} style={{ color: BRAND.primary }} />
          跨链桥常见问题
        </h3>
        <div className="space-y-3 text-[12px]">
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>1. 跨链桥是如何工作的？</div>
            <div style={{ color: BRAND.textMuted }}>跨链桥通过在源链锁定 / 销毁资产，在目标链铸造 / 释放等价资产，实现资产跨链流通。不同技术路径各有安全 / 速度 / 流动性权衡。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>2. 跨链到账时间？</div>
            <div style={{ color: BRAND.textMuted }}>平均 1-25 分钟，取决于跨链技术（Stargate 即时终局 / LayerZero 4 分钟 / Polygon 25 分钟含挑战期）。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>3. 跨链安全如何保障？</div>
            <div style={{ color: BRAND.textMuted }}>优先选择 CertiK / SlowMist / Trail of Bits 等多家审计的桥，关注历史安全事件、TVL 规模、验证节点去中心化程度。</div>
          </div>
          <div>
            <div className="font-semibold mb-1" style={{ color: BRAND.text }}>4. 跨链费用？</div>
            <div style={{ color: BRAND.textMuted }}>桥服务费 0.05%-0.15% + 源链 / 目标链 Gas 费。LayerZero / Stargate 通常 1-5 USDT，Polygon PoS / Arbitrum 0.5-2 USDT。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Drawers ==============

function BridgeDrawer({ bridge, onClose, onDeposit }: { bridge: Bridge; onClose: () => void; onDeposit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Network size={18} style={{ color: BRAND.primary }} />
              {bridge.name}
              <StatusBadge status={bridge.status} />
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{bridge.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3 pb-stagger">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>TVL</div>
              <div className="text-base font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(bridge.tvl)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h 量</div>
              <div className="text-base font-mono" style={{ color: BRAND.text }}>${formatTvl(bridge.volume24h)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>到账</div>
              <div className="text-base font-mono" style={{ color: BRAND.text }}>{bridge.avgTime}m</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>成功率</div>
              <div className="text-base font-mono" style={{ color: BRAND.primary }}>{bridge.successRate.toFixed(2)}%</div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>支持公链 ({bridge.chains.length})</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {bridge.chains.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: CHAIN_COLORS[c], border: `1px solid ${CHAIN_COLORS[c]}30` }}>{CHAIN_LABELS[c]}</span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>关键参数</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>类型：</span><span style={{ color: BRAND.text }}>{bridge.type}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>安全等级：</span><span style={{ color: BRAND.text }}>{bridge.security}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>支持资产：</span><span style={{ color: BRAND.text }}>{bridge.supportedAssets}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>验证节点：</span><span style={{ color: BRAND.text }}>{bridge.validators || '协议层 (LayerZero/Axelar 等)'}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>服务费率：</span><span style={{ color: BRAND.text }}>{(bridge.feeRate * 100).toFixed(2)}%</span></div>
              <div><span style={{ color: BRAND.textMuted }}>运营方：</span><span style={{ color: BRAND.text }}>{bridge.operator}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>起跨金额：</span><span style={{ color: BRAND.text }}>${bridge.minAmount}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>单笔上限：</span><span style={{ color: BRAND.text }}>${bridge.maxAmount.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>24h 笔数：</span><span style={{ color: BRAND.text }}>{bridge.txCount24h.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>累计笔数：</span><span style={{ color: BRAND.text }}>{bridge.txCountTotal.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>审计</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {bridge.audits.map((a) => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>✓ {a}</span>)}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>特性 / 风险</div>
            <div className="space-y-1">
              {bridge.features.map((f) => <div key={f} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><CheckCircle2 size={11} style={{ color: BRAND.primary, marginTop: 2 }} />{f}</div>)}
              {bridge.risks.map((r) => <div key={r} className="text-[11px] flex items-start gap-1.5" style={{ color: BRAND.textMuted }}><AlertTriangle size={11} style={{ color: '#FFB800', marginTop: 2 }} />{r}</div>)}
            </div>
          </div>
          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即跨链</button>
        </div>
      </div>
    </div>
  );
}

function RouteDrawer({ route, onClose, onTransfer }: { route: Route; onClose: () => void; onTransfer: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <GitBranch size={18} style={{ color: BRAND.primary }} />
            跨链路线详情
            <StatusBadge status={route.status} />
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-center">
                <div className="text-2xl mb-1" style={{ color: CHAIN_COLORS[route.source] }}>●</div>
                <div className="text-sm font-semibold" style={{ color: CHAIN_COLORS[route.source] }}>{CHAIN_LABELS[route.source]}</div>
              </div>
              <ArrowRight size={20} style={{ color: BRAND.primary }} className="pb-float" />
              <div className="text-center">
                <div className="text-2xl mb-1" style={{ color: CHAIN_COLORS[route.target] }}>●</div>
                <div className="text-sm font-semibold" style={{ color: CHAIN_COLORS[route.target] }}>{CHAIN_LABELS[route.target]}</div>
              </div>
            </div>
            <div className="text-lg font-semibold font-mono" style={{ color: BRAND.primary }}>{route.asset}</div>
            <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{route.description}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>到账时间</div>
              <div className="text-base font-mono font-semibold" style={{ color: BRAND.text }}>{formatTime(route.avgTime)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>服务费</div>
              <div className="text-base font-mono" style={{ color: BRAND.text }}>{(route.feeRate * 100).toFixed(3)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>成功率</div>
              <div className="text-base font-mono" style={{ color: BRAND.primary }}>{route.successRate.toFixed(2)}%</div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>流动性 / 活动</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>流动性：</span><span style={{ color: BRAND.primary }}>${formatTvl(route.liquidity)}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>24h 量：</span><span style={{ color: BRAND.text }}>${formatTvl(route.volume24h)}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>参与人：</span><span style={{ color: BRAND.text }}>{route.participants.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>桥：</span><span style={{ color: BRAND.text }}>{route.bridgeName}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>跳数：</span><span style={{ color: BRAND.text }}>{route.hops}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>确认数：</span><span style={{ color: BRAND.text }}>{route.requiredConfirmations}</span></div>
            </div>
          </div>
          <button onClick={onTransfer} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即跨链</button>
        </div>
      </div>
    </div>
  );
}

function LiquidityDrawer({ pool, onClose, onDeposit }: { pool: LiquidityPool; onClose: () => void; onDeposit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Droplets size={18} style={{ color: BRAND.primary }} />
            {pool.asset} · {CHAIN_LABELS[pool.chain]}
            <StatusBadge status={pool.status} />
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总流动性</div>
              <div className="text-base font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(pool.totalLiquidity)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>可用</div>
              <div className="text-base font-mono" style={{ color: BRAND.text }}>${formatTvl(pool.availableLiquidity)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>APR</div>
              <div className="text-base font-mono" style={{ color: BRAND.primary }}>{pool.apr.toFixed(1)}%</div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: BRAND.textMuted }}>利用率</span>
              <span className="font-mono" style={{ color: BRAND.text }}>{pool.utilization}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
              <div className="h-full pb-bar" style={{ width: `${pool.utilization}%`, backgroundColor: pool.utilization > 80 ? '#FF4C4C' : BRAND.primary }} />
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>奖励</div>
            <div className="space-y-1.5">
              {pool.rewards.map((r) => (
                <div key={r.token} className="flex items-center justify-between text-[11px]">
                  <span style={{ color: BRAND.text }}>{r.token}</span>
                  <span className="font-mono" style={{ color: BRAND.primary }}>{r.apr.toFixed(1)}% · {r.perDay.toLocaleString()}/天</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>关键参数</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>桥：</span><span style={{ color: BRAND.text }}>{pool.bridgeName}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>LP 数：</span><span style={{ color: BRAND.text }}>{pool.providers.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>锁仓期：</span><span style={{ color: BRAND.text }}>{pool.lockPeriod} 天</span></div>
              <div><span style={{ color: BRAND.textMuted }}>审计：</span><span style={{ color: BRAND.text }}>{pool.audit.join(', ')}</span></div>
            </div>
          </div>
          <button onClick={onDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提供流动性</button>
        </div>
      </div>
    </div>
  );
}

function ValidatorDrawer({ validator, onClose }: { validator: Validator; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <span className="text-2xl">{validator.logo}</span>
            {validator.name}
            <StatusBadge status={validator.status} />
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[11px]" style={{ color: BRAND.textMuted }}>{validator.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总质押</div>
              <div className="text-base font-mono font-semibold" style={{ color: BRAND.primary }}>${formatTvl(validator.stake)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>在线率</div>
              <div className="text-base font-mono" style={{ color: validator.uptime > 99 ? BRAND.primary : '#FFB800' }}>{validator.uptime.toFixed(2)}%</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>APR</div>
              <div className="text-base font-mono" style={{ color: BRAND.primary }}>{validator.apr.toFixed(1)}%</div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>运营数据</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>出块：</span><span style={{ color: BRAND.text }}>{validator.blocks.toLocaleString()} / {validator.blocksTotal.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>错过：</span><span style={{ color: BRAND.text }}>{validator.missed}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>监禁：</span><span style={{ color: BRAND.text }}>{validator.jailed}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>佣金：</span><span style={{ color: BRAND.text }}>{validator.commission}%</span></div>
              <div><span style={{ color: BRAND.textMuted }}>委托人数：</span><span style={{ color: BRAND.text }}>{validator.delegators.toLocaleString()}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>累计奖励：</span><span style={{ color: BRAND.primary }}>${formatTvl(validator.totalRewards)}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>地区：</span><span style={{ color: BRAND.text }}>{validator.region}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>加入：</span><span style={{ color: BRAND.text }}>{validator.joinedAt}</span></div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>联系方式</div>
            <div className="text-[11px] space-y-1" style={{ color: BRAND.textMuted }}>
              <div>邮箱：<span style={{ color: BRAND.text }}>{validator.contact}</span></div>
              <div>网站：<span style={{ color: BRAND.primary }}>{validator.website}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDrawer({ asset, onClose, onTransfer }: { asset: WrappedAsset; onClose: () => void; onTransfer: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Coins size={18} style={{ color: BRAND.primary }} />
            {asset.symbol} · {asset.name}
            <StatusBadge status={asset.status} />
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[11px]" style={{ color: BRAND.textMuted }}>{asset.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总供应</div>
              <div className="text-base font-mono font-semibold" style={{ color: BRAND.primary }}>{asset.totalSupply >= 1e9 ? `${(asset.totalSupply / 1e9).toFixed(2)}B` : asset.totalSupply >= 1e6 ? `${(asset.totalSupply / 1e6).toFixed(2)}M` : asset.totalSupply.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>持有人</div>
              <div className="text-base font-mono" style={{ color: BRAND.text }}>{asset.holders.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>锚定</div>
              <div className="text-base font-mono" style={{ color: asset.peg === 1.0 ? BRAND.primary : '#FFB800' }}>1:{asset.peg}</div>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>合约信息</div>
            <div className="space-y-1 text-[11px]">
              <div><span style={{ color: BRAND.textMuted }}>原链：</span><span style={{ color: CHAIN_COLORS[asset.originalChain] }}>{CHAIN_LABELS[asset.originalChain]}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>原地址：</span><span className="font-mono" style={{ color: BRAND.text }}>{asset.originalAddress}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>桥接地址：</span><span className="font-mono" style={{ color: BRAND.text }}>{asset.wrappedAddress}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>跨链桥：</span><span style={{ color: BRAND.text }}>{asset.bridgeName}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>类型：</span><span style={{ color: BRAND.text }}>{asset.type}</span></div>
              <div><span style={{ color: BRAND.textMuted }}>审计：</span><span style={{ color: BRAND.text }}>{asset.audit.join(', ')}</span></div>
            </div>
          </div>
          <button onClick={onTransfer} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即跨链</button>
        </div>
      </div>
    </div>
  );
}

function TransferDrawer({ amount, setAmount, from, setFrom, to, setTo, asset, setAsset, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <ArrowRightLeft size={18} style={{ color: BRAND.primary }} />
            跨链转账
          </h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>源链 → 目标链</div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-2 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                {Object.keys(CHAIN_LABELS).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c as ChainNetwork]}</option>)}
              </select>
              <ArrowRight size={14} style={{ color: BRAND.primary }} className="pb-float" />
              <select value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-2 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                {Object.keys(CHAIN_LABELS).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c as ChainNetwork]}</option>)}
              </select>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>资产</div>
            <select value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full px-2 py-2 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <option>ZSD</option><option>ZSDEX</option><option>USDT</option><option>USDC</option><option>ETH</option><option>BTC</option>
            </select>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>跨链数量</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="w-full bg-transparent text-2xl font-semibold outline-none" style={{ color: BRAND.text }} />
            <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: BRAND.textMuted }}>
              <span>账户余额 12,480.00 {asset}</span>
              <button className="px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>MAX</button>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>预计</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>预计到账</span><span style={{ color: BRAND.text }}>{amount && !isNaN(Number(amount)) ? `${(Number(amount) * 0.999).toFixed(4)} ${asset}` : '0.00'}</span></div>
              <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>桥服务费</span><span style={{ color: BRAND.text }}>0.10%</span></div>
              <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>预计时间</span><span style={{ color: BRAND.text }}>4-25 分钟</span></div>
            </div>
          </div>
          <div className="p-3 rounded-lg text-[10px] space-y-1" style={{ backgroundColor: 'rgba(255,184,0,0.05)', border: `1px solid rgba(255,184,0,0.2)`, color: '#FFB800' }}>
            <div className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle size={11} />风险提示</div>
            <div>· 跨链桥数据为 mock 占位，资产价格 / TVL / 交易量均为内部估算口径</div>
            <div>· 跨链涉及智能合约风险 / 目标链拥堵 / 最终性延迟等不确定性</div>
            <div>· 请仔细核对目标链地址及资产类型，跨链交易不可撤销</div>
          </div>
          <button onClick={onSubmit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认跨链</button>
        </div>
      </div>
    </div>
  );
}

function ApplyDrawer({ onClose, applyStep, setApplyStep, applyType, setApplyType, applyCompany, setApplyCompany, applyContact, setApplyContact, applyEmail, setApplyEmail, applyTvl, setApplyTvl, applyDesc, setApplyDesc, applyRegion, setApplyRegion, submitApply }: any) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>申请接入跨链生态</h3>
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
            <div className="space-y-2 pb-stagger">
              {[
                { key: 'bridge', label: '跨链桥接入', icon: Network, desc: '申请跨链桥协议集成到 ZSDEX' },
                { key: 'validator', label: '验证节点', icon: ShieldCheck, desc: '申请成为 ZS-Chain 验证节点' },
                { key: 'operator', label: '做市商', icon: HandCoins, desc: '申请成为跨链桥流动性做市商' },
                { key: 'partner', label: '战略合作', icon: Handshake, desc: '申请战略合作伙伴关系' },
                { key: 'auditor', label: '审计合作', icon: Shield, desc: '申请成为安全审计合作方' },
              ].map((it) => {
                const Icon = it.icon;
                const active = applyType === it.key;
                return (
                  <div key={it.key} onClick={() => setApplyType(it.key as ApplyType)} className="p-3 rounded-lg cursor-pointer pb-row" style={{ backgroundColor: active ? 'rgba(20,184,129,0.10)' : BRAND.card, border: `1px solid ${active ? BRAND.primary : BRAND.border}` }}>
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
                <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="例：Hyperlane Labs" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
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
                  <option>亚太</option><option>欧洲</option><option>北美</option><option>中东</option><option>南美</option><option>非洲</option>
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
              <CheckCircle2 size={48} style={{ color: BRAND.primary, margin: '0 auto' }} className="pb-float" />
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
      <div className="w-full max-w-md h-full overflow-y-auto pb-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
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
