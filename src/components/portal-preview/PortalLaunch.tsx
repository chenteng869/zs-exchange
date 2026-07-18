'use client';

/**
 * PortalLaunch - Launch 项目发行（2026-07-19 Q05 P3.18）
 *
 * 页面定位：
 * - 中萨数字科技交易所 Launch 项目发行 / 申购中心
 * - 当前认购 / 往期项目 / 投票上币 / 项目申请 / 排名榜 / 流程说明
 * - 严格规避承诺收益、保本、刚兑等高风险表述，仅做项目展示与申购流程说明
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 当前认购 / 往期项目 / 投票上币 / 项目申请 / 排名榜 / 流程说明 / 风险提示 / 底部 CTA
 * - 9+ 交互：搜索 / 排序 / Tab 切换 / 分类过滤 / 详情 Drawer / 投票 / 快捷键 / 实时倒计时 / 进度条
 * - 5+ Drawer：项目详情 / 投票详情 / 项目申请 / 排名详情 / 帮助快捷键
 * - 4+ 实时数据：累计募集 / 参与用户 / 当前项目 / 超募倍数 + 实时倒计时
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse / fadeInUp / 倒计时
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有项目数据 / 申购 / 排名使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 严格规避任何高风险合规词
 * - 严禁出现"保本"、"刚兑"、"承诺收益"、"稳赚"等违规表述
 * - 严格遵守数字资产发行相关法律法规
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
  Rocket,
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Clock,
  Calendar,
  Hash,
  Activity,
  Users,
  UserCheck,
  Building2,
  Globe2,
  Target,
  Crosshair,
  Award,
  Crown,
  Trophy,
  Medal,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Keyboard,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Coins,
  CircleDollarSign,
  Wallet,
  Network,
  Database,
  Cpu,
  Cloud,
  Server,
  Sparkles,
  Flame,
  Megaphone,
  Radio,
  Tag,
  ListChecks,
  GitBranch,
  GitCommit,
  GitPullRequest,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  Briefcase,
  Compass,
  Map,
  Flag,
  MapPin,
  BookOpen,
  GraduationCap,
  Settings,
  Code2,
  Workflow,
  ArrowRight,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'current' | 'history' | 'vote' | 'apply' | 'rank' | 'process';
type ProjectStatus = 'upcoming' | 'subscription' | 'allocated' | 'trading' | 'completed' | 'cancelled';
type ProjectCategory = 'infrastructure' | 'defi' | 'metaverse' | 'ai' | 'rwa' | 'gaming' | 'social' | 'privacy' | 'storage';
type ChainType = 'ethereum' | 'solana' | 'bsc' | 'polygon' | 'arbitrum' | 'base' | 'treegraph' | 'avalanche';
type VoteType = 'upcoming' | 'voting' | 'shortlisted' | 'rejected';

interface Project {
  id: string;
  symbol: string;
  name: string;
  category: ProjectCategory;
  chain: ChainType;
  status: ProjectStatus;
  description: string;
  longDescription: string;
  totalSupply: number;
  saleSupply: number;
  salePrice: number;
  hardCap: number;
  softCap: number;
  raised: number;
  participants: number;
  maxPerUser: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  tradingStart: string;
  vestingMonths: number;
  initialCirculation: number;
  highlights: string[];
  roadmap: { phase: string; milestone: string; status: 'done' | 'progress' | 'planned' }[];
  team: { name: string; role: string; background: string }[];
  partners: string[];
  social: { twitter?: string; telegram?: string; github?: string; discord?: string; website?: string };
  kycRequired: boolean;
  region: string[];
  whitelistRequired: boolean;
  progress: number;
  hot?: boolean;
  recommended?: boolean;
}

interface Vote {
  id: string;
  projectName: string;
  symbol: string;
  description: string;
  category: ProjectCategory;
  status: VoteType;
  startDate: string;
  endDate: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  requiredVotes: number;
  proposer: string;
  proposalType: 'new-listing' | 'migration' | 'utility' | 'delisting';
  proposalDoc: string;
}

interface Rank {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  category: ProjectCategory;
  score: number;
  raised: number;
  participants: number;
  oversubscription: number;
  tradingVolume: number;
  currentPrice: number;
  initialPrice: number;
  returnRate: number;
}

interface DrawerState {
  open: boolean;
  type: 'project' | 'vote' | 'rank' | 'process' | 'help' | null;
  payload: string | null;
}

interface KpiSnapshot {
  totalRaised: number;
  totalParticipants: number;
  totalProjects: number;
  avgOversubscription: number;
  upcomingCount: number;
  liveCount: number;
  totalVotes: number;
  successRate: number;
}

// ============== Mock 数据 ==============

const PROJECTS: Project[] = [
  {
    id: 'p-001',
    symbol: 'DPL',
    name: 'Decentralized Protocol Labs',
    category: 'infrastructure',
    chain: 'ethereum',
    status: 'subscription',
    description: '去中心化存储与计算协议，为 Web3 应用提供抗审查的基础设施。',
    longDescription: 'DPL 是一个面向 Web3 应用的去中心化存储与计算协议，结合零知识证明与数据可用性采样，提供可验证的链下存储与计算能力。核心团队来自分布式系统与密码学领域，目标成为下一代去中心化基础设施的关键组件。',
    totalSupply: 1000000000,
    saleSupply: 50000000,
    salePrice: 0.08,
    hardCap: 8000000,
    softCap: 2000000,
    raised: 5620000,
    participants: 12480,
    maxPerUser: 2000,
    subscriptionStart: '2026-07-19 14:00:00',
    subscriptionEnd: '2026-07-21 14:00:00',
    tradingStart: '2026-07-22 12:00:00',
    vestingMonths: 12,
    initialCirculation: 12,
    highlights: ['ZKP + DAS 混合架构', '已上线测试网 6 个月', '合作节点 200+', '代码全审计'],
    roadmap: [
      { phase: '2024 Q1', milestone: '白皮书发布', status: 'done' },
      { phase: '2024 Q3', milestone: '测试网上线', status: 'done' },
      { phase: '2025 Q1', milestone: '主网上线', status: 'done' },
      { phase: '2025 Q4', milestone: 'Launch 发行', status: 'progress' },
      { phase: '2026 Q2', milestone: '生态扩展', status: 'planned' },
    ],
    team: [
      { name: '陈某某', role: 'CEO', background: '前分布式系统研究员' },
      { name: '李某某', role: 'CTO', background: '密码学博士，前 ZKP 项目核心' },
    ],
    partners: ['HashKey Capital', 'OKX Ventures', 'Web3 Foundation'],
    social: { twitter: '@dpl_labs', telegram: 't.me/dpl_official', github: 'github.com/dpl-labs', website: 'dpl.io' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: true,
    progress: 70.25,
    hot: true,
    recommended: true,
  },
  {
    id: 'p-002',
    symbol: 'NMT',
    name: 'NeuralMesh Token',
    category: 'ai',
    chain: 'base',
    status: 'upcoming',
    description: '去中心化 AI 推理网络，为 AI 应用提供分布式算力。',
    longDescription: 'NMT 通过区块链协调全球闲置 GPU 算力，为 AI 推理任务提供低成本、抗审查的计算服务。代币用于网络结算、治理、质押。',
    totalSupply: 500000000,
    saleSupply: 25000000,
    salePrice: 0.12,
    hardCap: 6000000,
    softCap: 1500000,
    raised: 0,
    participants: 0,
    maxPerUser: 1500,
    subscriptionStart: '2026-07-25 14:00:00',
    subscriptionEnd: '2026-07-27 14:00:00',
    tradingStart: '2026-07-28 12:00:00',
    vestingMonths: 18,
    initialCirculation: 10,
    highlights: ['AI 推理算力市场', '已对接 50+ AI 应用', '白皮书 2.0', '3 家头部 VC 投资'],
    roadmap: [
      { phase: '2024 Q4', milestone: '白皮书 1.0', status: 'done' },
      { phase: '2025 Q2', milestone: '测试网 V1', status: 'done' },
      { phase: '2025 Q4', milestone: '测试网 V2', status: 'done' },
      { phase: '2026 Q3', milestone: 'Launch 发行', status: 'progress' },
      { phase: '2026 Q4', milestone: '主网上线', status: 'planned' },
    ],
    team: [
      { name: '王某某', role: 'CEO', background: '前 AI 平台创始人' },
      { name: '张某某', role: 'CTO', background: '分布式系统专家' },
    ],
    partners: ['Multicoin', 'Paradigm', 'Variant'],
    social: { twitter: '@neuralmesh', telegram: 't.me/neuralmesh', website: 'neuralmesh.ai' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: true,
    progress: 0,
    hot: true,
  },
  {
    id: 'p-003',
    symbol: 'RWA',
    name: 'RWA Bridge',
    category: 'rwa',
    chain: 'ethereum',
    status: 'upcoming',
    description: '现实世界资产（RWA）跨链桥接协议。',
    longDescription: 'RWA Bridge 是连接传统金融资产与区块链的桥接协议，支持债券、基金份额、不动产等 RWA 资产的链上映射与跨链流通。',
    totalSupply: 200000000,
    saleSupply: 10000000,
    salePrice: 0.5,
    hardCap: 5000000,
    softCap: 1000000,
    raised: 0,
    participants: 0,
    maxPerUser: 1000,
    subscriptionStart: '2026-08-01 14:00:00',
    subscriptionEnd: '2026-08-03 14:00:00',
    tradingStart: '2026-08-04 12:00:00',
    vestingMonths: 12,
    initialCirculation: 15,
    highlights: ['传统金融机构合作', 'RWA 资产品类齐全', '合规研究方向'],
    roadmap: [
      { phase: '2024 Q2', milestone: '白皮书', status: 'done' },
      { phase: '2025 Q1', milestone: '法律框架', status: 'done' },
      { phase: '2025 Q4', milestone: '试点项目', status: 'progress' },
      { phase: '2026 Q3', milestone: 'Launch 发行', status: 'progress' },
    ],
    team: [
      { name: '刘某某', role: 'CEO', background: '前传统金融机构高管' },
    ],
    partners: ['SBI Holdings', 'S&P Global'],
    social: { twitter: '@rwa_bridge', website: 'rwa-bridge.com' },
    kycRequired: true,
    region: ['亚洲', '欧洲'],
    whitelistRequired: true,
    progress: 0,
  },
  {
    id: 'p-004',
    symbol: 'GMV',
    name: 'GameVerse',
    category: 'gaming',
    chain: 'polygon',
    status: 'completed',
    description: 'Web3 游戏聚合平台，覆盖多链游戏生态。',
    longDescription: 'GameVerse 是一个 Web3 游戏聚合平台，提供游戏发行、资产交易、社交互动等综合服务。已上线 30+ 游戏。',
    totalSupply: 1000000000,
    saleSupply: 80000000,
    salePrice: 0.05,
    hardCap: 4000000,
    softCap: 1500000,
    raised: 8400000,
    participants: 28500,
    maxPerUser: 1000,
    subscriptionStart: '2026-05-15 14:00:00',
    subscriptionEnd: '2026-05-17 14:00:00',
    tradingStart: '2026-05-18 12:00:00',
    vestingMonths: 6,
    initialCirculation: 20,
    highlights: ['30+ 游戏集成', 'DAU 12 万', '明星游戏 IP 合作', 'Layer 2 高性能'],
    roadmap: [
      { phase: '2024', milestone: '平台开发', status: 'done' },
      { phase: '2025', milestone: '首批游戏', status: 'done' },
      { phase: '2026 Q1', milestone: 'Launch 发行', status: 'done' },
      { phase: '2026 Q2', milestone: '交易上线', status: 'done' },
      { phase: '2026 Q3', milestone: '100 游戏目标', status: 'progress' },
    ],
    team: [
      { name: '赵某某', role: 'CEO', background: '前游戏公司制作人' },
    ],
    partners: ['Animoca Brands', 'Polygon Studios'],
    social: { twitter: '@gameverse', telegram: 't.me/gameverse', website: 'gameverse.gg' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: false,
    progress: 100,
    recommended: true,
  },
  {
    id: 'p-005',
    symbol: 'SCL',
    name: 'SocialChain',
    category: 'social',
    chain: 'solana',
    status: 'completed',
    description: '去中心化社交图谱协议。',
    longDescription: 'SocialChain 提供用户拥有的社交图谱协议，跨平台迁移粉丝关系与社交资产。',
    totalSupply: 300000000,
    saleSupply: 20000000,
    salePrice: 0.15,
    hardCap: 3000000,
    softCap: 800000,
    raised: 6200000,
    participants: 18900,
    maxPerUser: 800,
    subscriptionStart: '2026-04-10 14:00:00',
    subscriptionEnd: '2026-04-12 14:00:00',
    tradingStart: '2026-04-13 12:00:00',
    vestingMonths: 9,
    initialCirculation: 18,
    highlights: ['50 万 DAU', '3 大社交平台集成', '协议级跨平台'],
    roadmap: [
      { phase: '2024', milestone: '协议 V1', status: 'done' },
      { phase: '2025', milestone: '生态合作', status: 'done' },
      { phase: '2026 Q1', milestone: 'Launch 发行', status: 'done' },
    ],
    team: [
      { name: '孙某某', role: 'CEO', background: '前社交平台 CTO' },
    ],
    partners: ['Solana Ventures'],
    social: { twitter: '@socialchain', website: 'socialchain.xyz' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: false,
    progress: 100,
  },
  {
    id: 'p-006',
    symbol: 'ZKP',
    name: 'ZK Privacy',
    category: 'privacy',
    chain: 'ethereum',
    status: 'completed',
    description: '零知识证明隐私协议。',
    longDescription: 'ZKP Privacy 提供基于 ZK 的隐私交易与身份保护协议。',
    totalSupply: 100000000,
    saleSupply: 8000000,
    salePrice: 0.25,
    hardCap: 2000000,
    softCap: 500000,
    raised: 5200000,
    participants: 15200,
    maxPerUser: 600,
    subscriptionStart: '2026-03-05 14:00:00',
    subscriptionEnd: '2026-03-07 14:00:00',
    tradingStart: '2026-03-08 12:00:00',
    vestingMonths: 12,
    initialCirculation: 15,
    highlights: ['ZK 电路优化', '审计通过', '研究合作广泛'],
    roadmap: [
      { phase: '2024', milestone: '研究', status: 'done' },
      { phase: '2025', milestone: '协议 V1', status: 'done' },
      { phase: '2026 Q1', milestone: 'Launch 发行', status: 'done' },
    ],
    team: [
      { name: '周某某', role: 'CEO', background: '密码学研究员' },
    ],
    partners: ['Ethereum Foundation', '0xPARC'],
    social: { twitter: '@zkp_privacy', website: 'zkp.privacy' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: false,
    progress: 100,
  },
  {
    id: 'p-007',
    symbol: 'STR',
    name: 'StorageNet',
    category: 'storage',
    chain: 'avalanche',
    status: 'allocated',
    description: '分布式存储协议。',
    longDescription: 'StorageNet 提供去中心化存储服务，结合 PoS 与 PoSt 共识。',
    totalSupply: 500000000,
    saleSupply: 30000000,
    salePrice: 0.10,
    hardCap: 3000000,
    softCap: 800000,
    raised: 3000000,
    participants: 9800,
    maxPerUser: 800,
    subscriptionStart: '2026-06-20 14:00:00',
    subscriptionEnd: '2026-06-22 14:00:00',
    tradingStart: '2026-06-23 12:00:00',
    vestingMonths: 12,
    initialCirculation: 12,
    highlights: ['PoSt 共识', '高性价比存储', '已对接 100+ 客户'],
    roadmap: [
      { phase: '2024', milestone: '协议 V1', status: 'done' },
      { phase: '2025', milestone: '主网', status: 'done' },
      { phase: '2026 Q2', milestone: 'Launch 发行', status: 'done' },
    ],
    team: [
      { name: '吴某某', role: 'CEO', background: '存储系统专家' },
    ],
    partners: ['Avalanche Foundation'],
    social: { twitter: '@storagenet', website: 'storagenet.io' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: false,
    progress: 100,
  },
  {
    id: 'p-008',
    symbol: 'MVS',
    name: 'MetaVerse Studio',
    category: 'metaverse',
    chain: 'polygon',
    status: 'trading',
    description: '元宇宙内容创作平台。',
    longDescription: 'MetaVerse Studio 提供元宇宙内容创作工具与变现平台。',
    totalSupply: 200000000,
    saleSupply: 15000000,
    salePrice: 0.20,
    hardCap: 3000000,
    softCap: 800000,
    raised: 5800000,
    participants: 14200,
    maxPerUser: 700,
    subscriptionStart: '2026-02-15 14:00:00',
    subscriptionEnd: '2026-02-17 14:00:00',
    tradingStart: '2026-02-18 12:00:00',
    vestingMonths: 9,
    initialCirculation: 18,
    highlights: ['创作工具齐全', '20 万创作者', '广告分成模式'],
    roadmap: [
      { phase: '2024', milestone: '工具 V1', status: 'done' },
      { phase: '2025', milestone: '生态建设', status: 'done' },
      { phase: '2026 Q1', milestone: 'Launch 发行', status: 'done' },
    ],
    team: [
      { name: '郑某某', role: 'CEO', background: '前游戏引擎专家' },
    ],
    partners: ['Polygon Studios', 'Animoca'],
    social: { twitter: '@metaverses', website: 'metaversestudio.com' },
    kycRequired: true,
    region: ['全球'],
    whitelistRequired: false,
    progress: 100,
  },
];

const VOTES: Vote[] = [
  {
    id: 'v-001',
    projectName: 'Quantum Ledger',
    symbol: 'QLG',
    description: '新一代量子安全区块链基础设施，结合后量子密码学与高 TPS 共识。',
    category: 'infrastructure',
    status: 'voting',
    startDate: '2026-07-15',
    endDate: '2026-07-25',
    votesFor: 28400,
    votesAgainst: 3200,
    totalVotes: 31600,
    requiredVotes: 50000,
    proposer: '社区用户 0x4a...',
    proposalType: 'new-listing',
    proposalDoc: 'github.com/quantum-ledger/proposal',
  },
  {
    id: 'v-002',
    projectName: 'DeFi Yield Pro',
    symbol: 'DYP',
    description: '跨链 DeFi 收益聚合协议。',
    category: 'defi',
    status: 'voting',
    startDate: '2026-07-12',
    endDate: '2026-07-22',
    votesFor: 18900,
    votesAgainst: 4800,
    totalVotes: 23700,
    requiredVotes: 40000,
    proposer: '社区用户 0x8c...',
    proposalType: 'new-listing',
    proposalDoc: 'github.com/dyp/proposal',
  },
  {
    id: 'v-003',
    projectName: 'GameCard',
    symbol: 'GCD',
    description: '游戏卡牌交易平台。',
    category: 'gaming',
    status: 'shortlisted',
    startDate: '2026-06-20',
    endDate: '2026-06-30',
    votesFor: 42000,
    votesAgainst: 8500,
    totalVotes: 50500,
    requiredVotes: 40000,
    proposer: '社区用户 0x2b...',
    proposalType: 'new-listing',
    proposalDoc: 'github.com/gamecard/proposal',
  },
  {
    id: 'v-004',
    projectName: 'LayerZero Bridge',
    symbol: 'LZB',
    description: '跨链桥聚合协议。',
    category: 'infrastructure',
    status: 'upcoming',
    startDate: '2026-07-28',
    endDate: '2026-08-07',
    votesFor: 0,
    votesAgainst: 0,
    totalVotes: 0,
    requiredVotes: 35000,
    proposer: '社区用户 0x9f...',
    proposalType: 'new-listing',
    proposalDoc: 'github.com/lzb/proposal',
  },
  {
    id: 'v-005',
    projectName: 'Privacy Mesh',
    symbol: 'PMH',
    description: '隐私计算网络。',
    category: 'privacy',
    status: 'rejected',
    startDate: '2026-05-15',
    endDate: '2026-05-25',
    votesFor: 12000,
    votesAgainst: 28000,
    totalVotes: 40000,
    requiredVotes: 40000,
    proposer: '社区用户 0x7e...',
    proposalType: 'new-listing',
    proposalDoc: 'github.com/pmh/proposal',
  },
];

const RANKS: Rank[] = [
  {
    id: 'r-001',
    rank: 1,
    name: 'GameVerse',
    symbol: 'GMV',
    category: 'gaming',
    score: 96.8,
    raised: 8400000,
    participants: 28500,
    oversubscription: 2.1,
    tradingVolume: 185000000,
    currentPrice: 0.182,
    initialPrice: 0.05,
    returnRate: 264,
  },
  {
    id: 'r-002',
    rank: 2,
    name: 'SocialChain',
    symbol: 'SCL',
    category: 'social',
    score: 94.2,
    raised: 6200000,
    participants: 18900,
    oversubscription: 2.07,
    tradingVolume: 96000000,
    currentPrice: 0.42,
    initialPrice: 0.15,
    returnRate: 180,
  },
  {
    id: 'r-003',
    rank: 3,
    name: 'MetaVerse Studio',
    symbol: 'MVS',
    category: 'metaverse',
    score: 92.5,
    raised: 5800000,
    participants: 14200,
    oversubscription: 1.93,
    tradingVolume: 78000000,
    currentPrice: 0.51,
    initialPrice: 0.20,
    returnRate: 155,
  },
  {
    id: 'r-004',
    rank: 4,
    name: 'StorageNet',
    symbol: 'STR',
    category: 'storage',
    score: 90.1,
    raised: 3000000,
    participants: 9800,
    oversubscription: 1.0,
    tradingVolume: 42000000,
    currentPrice: 0.158,
    initialPrice: 0.10,
    returnRate: 58,
  },
  {
    id: 'r-005',
    rank: 5,
    name: 'ZK Privacy',
    symbol: 'ZKP',
    category: 'privacy',
    score: 88.6,
    raised: 5200000,
    participants: 15200,
    oversubscription: 2.6,
    tradingVolume: 56000000,
    currentPrice: 0.38,
    initialPrice: 0.25,
    returnRate: 52,
  },
];

// ============== Helper ==============

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('zh-CN');
}

function formatUSDT(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toFixed(0);
}

const statusBadge = (s: ProjectStatus): { color: string; bg: string; label: string; Icon: any } => {
  const m: Record<ProjectStatus, { color: string; bg: string; label: string; Icon: any }> = {
    upcoming: { color: BRAND.info, bg: BRAND.infoLt, label: '即将认购', Icon: Clock },
    subscription: { color: BRAND.success, bg: BRAND.successLt, label: '认购中', Icon: Activity },
    allocated: { color: BRAND.warning, bg: BRAND.warningLt, label: '已分配', Icon: CheckCircle2 },
    trading: { color: BRAND.primary, bg: BRAND.primaryLt, label: '已上线', Icon: TrendingUp },
    completed: { color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)', label: '已结束', Icon: CheckCircle2 },
    cancelled: { color: BRAND.danger, bg: BRAND.dangerLt, label: '已取消', Icon: XCircle },
  };
  return m[s];
};

const categoryName = (c: ProjectCategory): string => {
  const m: Record<ProjectCategory, string> = {
    infrastructure: '基础设施',
    defi: 'DeFi',
    metaverse: '元宇宙',
    ai: 'AI',
    rwa: 'RWA',
    gaming: '游戏',
    social: '社交',
    privacy: '隐私',
    storage: '存储',
  };
  return m[c];
};

const chainName = (c: ChainType): string => {
  const m: Record<ChainType, string> = {
    ethereum: 'Ethereum',
    solana: 'Solana',
    bsc: 'BSC',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    base: 'Base',
    treegraph: 'TreeGraph',
    avalanche: 'Avalanche',
  };
  return m[c];
};

const chainColor = (c: ChainType): string => {
  const m: Record<ChainType, string> = {
    ethereum: '#627EEA',
    solana: '#14F195',
    bsc: '#F0B90B',
    polygon: '#8247E5',
    arbitrum: '#28A0F0',
    base: '#0052FF',
    treegraph: '#14B881',
    avalanche: '#E84142',
  };
  return m[c];
};

// ============== 倒计时 ==============

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const targetTime = new Date(target.replace(/-/g, '/')).getTime();
  const diff = Math.max(0, targetTime - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, mins, secs };
}

// ============== 组件 ==============

export function PortalLaunch() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ProjectCategory | 'all'>('all');
  const [chainFilter, setChainFilter] = useState<ChainType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'raised' | 'participants' | 'progress' | 'time'>('raised');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [voteFilter, setVoteFilter] = useState<VoteType | 'all'>('all');
  const [voteAction, setVoteAction] = useState<Record<string, 'for' | 'against' | null>>({});
  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalRaised: 156800000,
    totalParticipants: 458200,
    totalProjects: 86,
    avgOversubscription: 2.15,
    upcomingCount: 4,
    liveCount: 1,
    totalVotes: 168400,
    successRate: 78,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // 实时数据波动
  useEffect(() => {
    const t = setInterval(() => {
      setKpi((p) => ({
        ...p,
        totalRaised: p.totalRaised + Math.floor(Math.random() * 5000) + 1000,
        totalParticipants: p.totalParticipants + Math.floor(Math.random() * 21) - 10,
        totalVotes: p.totalVotes + Math.floor(Math.random() * 100) + 10,
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        else if (drawer.open) setDrawer({ open: false, type: null, payload: null });
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('current');
      else if (e.key === '3') setTab('history');
      else if (e.key === '4') setTab('vote');
      else if (e.key === '5') setTab('apply');
      else if (e.key === '6') setTab('rank');
      else if (e.key === '7') setTab('process');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen]);

  // 复制
  const copy = (text: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
  };

  // 过滤 / 排序
  const filteredProjects = useMemo(() => {
    return PROJECTS
      .filter((p) => (catFilter === 'all' ? true : p.category === catFilter))
      .filter((p) => (chainFilter === 'all' ? true : p.chain === chainFilter))
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.symbol.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'raised') return dir * (a.raised - b.raised);
        if (sortBy === 'participants') return dir * (a.participants - b.participants);
        if (sortBy === 'progress') return dir * (a.progress - b.progress);
        return dir * a.subscriptionStart.localeCompare(b.subscriptionStart);
      });
  }, [catFilter, chainFilter, search, sortBy, sortDir]);

  const filteredVotes = useMemo(() => {
    return VOTES.filter((v) => (voteFilter === 'all' ? true : v.status === voteFilter)).filter((v) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        v.id.toLowerCase().includes(q) ||
        v.projectName.toLowerCase().includes(q) ||
        v.symbol.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    });
  }, [voteFilter, search]);

  // KpiCard
  const KpiCard = ({ label, value, suffix, icon: Icon, color, trend, hint }: { label: string; value: string | number; suffix?: string; icon: any; color: string; trend?: number; hint?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
      if (isNaN(target)) return;
      const start = display;
      const duration = 800;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplay(start + (target - start) * ease);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);
    return (
      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span className="text-xs font-mono flex items-center gap-1" style={{ color: trend >= 0 ? BRAND.success : BRAND.danger }}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono" style={{ color: BRAND.text }}>
            {typeof display === 'number' && !isNaN(display) ? (Number.isInteger(value) ? formatNumber(Math.round(display)) : display.toFixed(2)) : value}
          </span>
          {suffix && <span className="text-xs" style={{ color: BRAND.textMute }}>{suffix}</span>}
        </div>
        <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>{label}</div>
        {hint && <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>{hint}</div>}
      </div>
    );
  };

  // 当前 Drawer payload
  const drawerProject = drawer.type === 'project' ? PROJECTS.find((p) => p.id === drawer.payload) : null;
  const drawerVote = drawer.type === 'vote' ? VOTES.find((v) => v.id === drawer.payload) : null;
  const drawerRank = drawer.type === 'rank' ? RANKS.find((r) => r.id === drawer.payload) : null;

  // 进行中的项目
  const liveProject = PROJECTS.find((p) => p.status === 'subscription');

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ============== Hero ============== */}
      <section className="px-6 lg:px-12 pt-10 pb-8" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
              <Rocket size={12} />
              LAUNCH · Q05 P3.18
            </span>
            {liveProject && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.success }} />
                {liveProject.symbol} 认购中
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>
              {kpi.upcomingCount} 个项目即将开始
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            Launch 项目发行
          </h1>
          <p className="text-sm lg:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所 Launch 平台。为优质项目提供合规化数字资产发行服务，覆盖当前认购、往期明星项目、社区投票上币、项目申请、排名榜与完整流程说明。
            严格遵守数字资产发行相关法律法规，规避任何形式的承诺收益、保本、刚兑等违规表述。
          </p>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 lg:px-12 py-6" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard label="累计募集" value={kpi.totalRaised} suffix=" USDT" icon={CircleDollarSign} color={BRAND.primary} trend={3.2} />
            <KpiCard label="累计参与用户" value={kpi.totalParticipants} icon={Users} color={BRAND.info} trend={1.5} />
            <KpiCard label="已发行项目" value={kpi.totalProjects} icon={Rocket} color={BRAND.success} trend={0.6} />
            <KpiCard label="平均超募倍数" value={kpi.avgOversubscription} suffix="x" icon={TrendingUp} color={BRAND.warning} trend={-2.1} />
            <KpiCard label="即将开始" value={kpi.upcomingCount} icon={Clock} color={BRAND.info} />
            <KpiCard label="认购中" value={kpi.liveCount} icon={Activity} color={BRAND.success} />
            <KpiCard label="累计投票" value={kpi.totalVotes} icon={VoteIcon} color={BRAND.primary} trend={5.8} />
            <KpiCard label="成功率" value={kpi.successRate} suffix="%" icon={CheckCircle2} color={BRAND.success} trend={0.3} />
          </div>
        </div>
      </section>

      {/* ============== 工具栏 + Tab ============== */}
      <section className="px-6 lg:px-12 py-4 sticky top-0 z-30" style={{ backgroundColor: BRAND.headerBg, borderBottom: `1px solid ${BRAND.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项目 / 投票 / 排名（按 / 聚焦）"
                className="w-full pl-9 pr-9 py-2 rounded-lg text-sm outline-none font-mono"
                style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: BRAND.textMute }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部分类</option>
              <option value="infrastructure">基础设施</option>
              <option value="defi">DeFi</option>
              <option value="ai">AI</option>
              <option value="rwa">RWA</option>
              <option value="gaming">游戏</option>
              <option value="social">社交</option>
              <option value="metaverse">元宇宙</option>
              <option value="privacy">隐私</option>
              <option value="storage">存储</option>
            </select>
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部公链</option>
              <option value="ethereum">Ethereum</option>
              <option value="solana">Solana</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
              <option value="treegraph">TreeGraph</option>
              <option value="avalanche">Avalanche</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (sortBy === 'raised') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('raised'); setSortDir('desc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'raised' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'raised' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'raised' ? BRAND.primary : BRAND.border}` }}
              >
                募集 {sortBy === 'raised' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => { if (sortBy === 'participants') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('participants'); setSortDir('desc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'participants' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'participants' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'participants' ? BRAND.primary : BRAND.border}` }}
              >
                用户 {sortBy === 'participants' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => { if (sortBy === 'time') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('time'); setSortDir('asc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'time' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'time' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'time' ? BRAND.primary : BRAND.border}` }}
              >
                时间 {sortBy === 'time' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
            </div>
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <HelpCircle size={12} /> 快捷键
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'overview', label: '总览', icon: Rocket, n: '1' },
              { key: 'current', label: '当前认购', icon: Activity, n: '2' },
              { key: 'history', label: '往期项目', icon: History, n: '3' },
              { key: 'vote', label: '投票上币', icon: VoteIcon, n: '4' },
              { key: 'apply', label: '项目申请', icon: FileText, n: '5' },
              { key: 'rank', label: '排名榜', icon: Trophy, n: '6' },
              { key: 'process', label: '流程说明', icon: Workflow, n: '7' },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: active ? BRAND.primaryLt : 'transparent',
                    color: active ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
                  }}
                >
                  <Icon size={12} />
                  {t.label}
                  <span className="text-[10px] opacity-50">{t.n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== 内容区 ============== */}
      <main className="px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {tab === 'overview' && (
            <>
              {/* 进行中项目 Hero */}
              {liveProject && <LiveProjectHero project={liveProject} />}

              {/* 即将开始 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Clock size={14} style={{ color: BRAND.info }} />
                  即将开始
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROJECTS.filter((p) => p.status === 'upcoming').map((p, i) => (
                    <ProjectCard key={p.id} project={p} idx={i} />
                  ))}
                </div>
              </section>

              {/* 推荐项目 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Star size={14} style={{ color: BRAND.warning }} />
                  平台推荐
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PROJECTS.filter((p) => p.recommended).map((p, i) => (
                    <ProjectCard key={p.id} project={p} idx={i} expanded />
                  ))}
                </div>
              </section>

              {/* 数据统计 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BarChart3 size={14} style={{ color: BRAND.primary }} />
                  平台累计数据
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { label: '累计发行项目', value: '86', icon: Rocket, color: BRAND.primary, desc: '自 2020 年起' },
                    { label: '累计募集金额', value: '156.8M USDT', icon: CircleDollarSign, color: BRAND.success, desc: '等值募集' },
                    { label: '累计参与用户', value: '45.8 万', icon: Users, color: BRAND.info, desc: '去重用户' },
                    { label: '平均超募倍数', value: '2.15x', icon: TrendingUp, color: BRAND.warning, desc: '认购热度' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                            <Icon size={16} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.label}</span>
                        </div>
                        <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{s.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {tab === 'current' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Activity size={14} style={{ color: BRAND.success }} />
                当前与即将认购
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProjects.filter((p) => p.status === 'subscription' || p.status === 'upcoming').length === 0 ? (
                  <div className="md:col-span-2 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配项目
                  </div>
                ) : (
                  filteredProjects.filter((p) => p.status === 'subscription' || p.status === 'upcoming').map((p, i) => (
                    <ProjectCard key={p.id} project={p} idx={i} expanded />
                  ))
                )}
              </div>
            </section>
          )}

          {tab === 'history' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <History size={14} style={{ color: BRAND.textSub }} />
                往期项目
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProjects.filter((p) => p.status === 'completed' || p.status === 'allocated' || p.status === 'trading').length === 0 ? (
                  <div className="md:col-span-3 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配项目
                  </div>
                ) : (
                  filteredProjects.filter((p) => p.status === 'completed' || p.status === 'allocated' || p.status === 'trading').map((p, i) => (
                    <ProjectCard key={p.id} project={p} idx={i} />
                  ))
                )}
              </div>
            </section>
          )}

          {tab === 'vote' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <VoteIcon size={14} style={{ color: BRAND.primary }} />
                社区投票上币
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {(['all', 'voting', 'upcoming', 'shortlisted', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setVoteFilter(s as any)}
                    className="px-3 py-1.5 rounded text-xs font-mono"
                    style={{ backgroundColor: voteFilter === s ? BRAND.primaryLt : BRAND.bgCard, color: voteFilter === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${voteFilter === s ? BRAND.primary : BRAND.border}` }}
                  >
                    {s === 'all' ? '全部' : s === 'voting' ? '投票中' : s === 'upcoming' ? '即将开始' : s === 'shortlisted' ? '已入围' : '未通过'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {filteredVotes.length === 0 ? (
                  <div className="p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配提案
                  </div>
                ) : (
                  filteredVotes.map((v, i) => (
                    <VoteCard key={v.id} vote={v} idx={i} voteAction={voteAction} setVoteAction={setVoteAction} onClick={() => setDrawer({ open: true, type: 'vote', payload: v.id })} />
                  ))
                )}
              </div>
            </section>
          )}

          {tab === 'apply' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <FileText size={14} style={{ color: BRAND.info }} />
                项目申请通道
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>申请条件</h3>
                  <div className="space-y-2">
                    {[
                      { l: '已注册公司 / 基金会', d: '提供主体证明文件' },
                      { l: '已完成产品 MVP', d: '至少可演示版本' },
                      { l: '代码已开源', d: 'GitHub 公开可审计' },
                      { l: '团队实名', d: '核心团队 KYC' },
                      { l: '第三方审计', d: '智能合约安全审计' },
                      { l: '法律意见书', d: 'Token 性质合规说明' },
                      { l: '社区基础', d: '至少 1 万活跃用户' },
                      { l: '募资用途清晰', d: '详细资金使用计划' },
                    ].map((c, i) => (
                      <div key={c.l} className="flex items-start gap-2 text-xs" style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}>
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                        <div>
                          <div style={{ color: BRAND.text }}>{c.l}</div>
                          <div style={{ color: BRAND.textMute }}>{c.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>申请流程</h3>
                  <div className="space-y-3">
                    {[
                      { n: '01', t: '提交申请', d: '通过官方表单提交项目基本信息' },
                      { n: '02', t: '初审', d: '5 个工作日内完成初步审查' },
                      { n: '03', t: '尽职调查', d: '团队 / 技术 / 法律 / 财务 / 社区' },
                      { n: '04', t: '评审会', d: 'Launch 评审委员会决议' },
                      { n: '05', t: '签约', d: '签署服务协议与法律文件' },
                      { n: '06', t: '路演', d: '社区路演 + 投票' },
                      { n: '07', t: '认购', d: 'Launch 正式发行' },
                    ].map((s, i) => (
                      <div
                        key={s.n}
                        className="flex items-center gap-3 p-2 rounded-lg"
                        style={{ backgroundColor: BRAND.bgCardHover, animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}
                      >
                        <span className="text-lg font-mono font-bold" style={{ color: BRAND.primary, minWidth: 28 }}>{s.n}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.t}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.d}</div>
                        </div>
                        {i < 6 && <ChevronRight size={14} style={{ color: BRAND.textMute }} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>所需材料清单</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { t: '项目白皮书', d: 'PDF / 中文 / 英文' },
                      { t: '商业计划书', d: '融资计划 / 商业模式' },
                      { t: '团队简历', d: '核心成员 KYC' },
                      { t: '技术文档', d: '架构 / 审计报告' },
                      { t: '法律意见书', d: 'Token 性质 / 合规' },
                      { t: '财务披露', d: '历史融资 / 资金使用' },
                      { t: '社区数据', d: 'Twitter / Telegram / Discord' },
                      { t: 'GitHub 仓库', d: '开源代码' },
                      { t: '营销计划', d: '上市后推广方案' },
                    ].map((m, i) => (
                      <div
                        key={m.t}
                        className="p-3 rounded-lg flex items-center gap-2"
                        style={{ backgroundColor: BRAND.bgCardHover, animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}
                      >
                        <FileText size={14} style={{ color: BRAND.primary }} />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{m.t}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{m.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-sm font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                      <Rocket size={14} /> 立即申请
                    </button>
                    <button className="flex-1 py-2 rounded-lg text-sm font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <Download size={14} /> 下载申请模板
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === 'rank' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Trophy size={14} style={{ color: BRAND.warning }} />
                Launch 排名榜
              </h2>
              <div className="space-y-2">
                {RANKS.map((r, i) => (
                  <div
                    key={r.id}
                    onClick={() => setDrawer({ open: true, type: 'rank', payload: r.id })}
                    className="p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor: BRAND.bgCard,
                      border: `1px solid ${BRAND.border}`,
                      animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                      style={{
                        backgroundColor: r.rank === 1 ? BRAND.warningLt : r.rank === 2 ? BRAND.infoLt : r.rank === 3 ? BRAND.successLt : BRAND.bgCardHover,
                        color: r.rank === 1 ? BRAND.warning : r.rank === 2 ? BRAND.info : r.rank === 3 ? BRAND.success : BRAND.textMute,
                      }}
                    >
                      {r.rank === 1 ? <Crown size={18} /> : r.rank === 2 ? <Medal size={18} /> : r.rank === 3 ? <Award size={18} /> : `#${r.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                        <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{r.symbol}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{categoryName(r.category)}</span>
                        <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>评分 <span style={{ color: BRAND.primary }}>{r.score}</span></span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                        <div>募集: <span style={{ color: BRAND.primary }}>{formatUSDT(r.raised)}</span></div>
                        <div>用户: {formatNumber(r.participants)}</div>
                        <div>超募: <span style={{ color: BRAND.warning }}>{r.oversubscription}x</span></div>
                        <div>成交: {formatUSDT(r.tradingVolume)}</div>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>${r.currentPrice.toFixed(3)}</div>
                      <div className="text-[10px] font-mono flex items-center gap-1" style={{ color: r.returnRate >= 0 ? BRAND.success : BRAND.danger }}>
                        {r.returnRate >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {r.returnRate >= 0 ? '+' : ''}{r.returnRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'process' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Workflow size={14} style={{ color: BRAND.primary }} />
                Launch 全流程说明
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    phase: '提交申请',
                    t: 'Step 1',
                    d: '项目方通过官方申请通道提交项目信息，包括白皮书、商业计划、团队资料、技术文档等。',
                    points: ['官方申请表单', '材料完整度自查', '签署意向书'],
                    icon: FileText,
                    color: BRAND.info,
                  },
                  {
                    phase: '初审与立项',
                    t: 'Step 2',
                    d: 'Launch 团队对项目进行初步审查，5 个工作日内反馈初审意见，通过后进入立项。',
                    points: ['5 个工作日', '立项评审', '通知项目方'],
                    icon: CheckCircle2,
                    color: BRAND.success,
                  },
                  {
                    phase: '尽职调查',
                    t: 'Step 3',
                    d: '专业团队对项目进行全方位尽调，包括技术、法律、财务、社区等维度。',
                    points: ['技术尽调', '法律尽调', '财务尽调', '社区尽调'],
                    icon: Shield,
                    color: BRAND.warning,
                  },
                  {
                    phase: '路演与投票',
                    t: 'Step 4',
                    d: '通过尽调的项目进入社区路演，ZSDEX 平台通证持有者可参与投票决定上币。',
                    points: ['社区路演', '公开答辩', '社区投票'],
                    icon: VoteIcon,
                    color: BRAND.primary,
                  },
                  {
                    phase: '认购',
                    t: 'Step 5',
                    d: '通过投票的项目进入 Launch 认购阶段，平台用户可通过 KYC 与白名单参与认购。',
                    points: ['KYC 验证', '白名单', '认购下单', '超额分配'],
                    icon: CircleDollarSign,
                    color: BRAND.success,
                  },
                  {
                    phase: '上线交易',
                    t: 'Step 6',
                    d: '认购成功后项目按计划时间上线交易，平台提供做市与流动性支持。',
                    points: ['准时上线', '做市支持', '持续披露'],
                    icon: TrendingUp,
                    color: BRAND.danger,
                  },
                ].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.t}
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono" style={{ color: p.color }}>{p.t}</div>
                            <div className="text-sm font-bold" style={{ color: BRAND.text }}>{p.phase}</div>
                          </div>
                        </div>
                        {i < 5 && <ArrowRight size={14} style={{ color: BRAND.textMute }} />}
                      </div>
                      <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>{p.d}</p>
                      <div className="space-y-1">
                        {p.points.map((pt) => (
                          <div key={pt} className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}>
                            <ChevronRight size={10} /> {pt}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 rounded-xl mt-3" style={{ backgroundColor: BRAND.warningLt, border: `1px solid ${BRAND.warning}` }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5" style={{ color: BRAND.warning }} />
                  <div className="text-xs" style={{ color: BRAND.text }}>
                    <div className="font-semibold mb-1">重要风险提示</div>
                    <div style={{ color: BRAND.textSub }}>
                      数字资产投资存在高风险，包括但不限于价格波动、流动性不足、项目方履约、技术与监管风险。历史业绩不代表未来表现，请审慎评估自身风险承受能力，理性投资，独立判断。
                      本平台严格遵守反洗钱（AML）、反恐怖融资（CFT）等合规研究方向。
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ============== 底部 CTA ============== */}
      <section className="px-6 lg:px-12 py-10 mt-8" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>项目申请</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>launch@zsdex.com</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>提交项目信息与材料</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>Launch 咨询</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>Telegram / 企业微信</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>专业 BD 团队对接</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>申请模板</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>下载申请材料模板</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>PDF / 完整清单</div>
            </div>
          </div>
          <div className="text-center mt-6 text-[10px]" style={{ color: BRAND.textMute }}>
            本页面所有项目数据为示意性 mock 数据，来源于 Launch 平台演示版本。
            数字资产投资存在高风险，过往业绩不代表未来表现。请审慎评估风险承受能力，理性投资。
          </div>
        </div>
      </section>

      {/* ============== Drawer ============== */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawer({ open: false, type: null, payload: null })}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[640px] overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  {drawer.type} DETAIL
                </span>
                <button
                  onClick={() => setDrawer({ open: false, type: null, payload: null })}
                  className="p-1.5 rounded-lg"
                  style={{ color: BRAND.textMute }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 项目 Drawer */}
              {drawerProject && (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-2xl font-mono font-bold" style={{ color: BRAND.text }}>{drawerProject.symbol}</span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                      style={{ backgroundColor: statusBadge(drawerProject.status).bg, color: statusBadge(drawerProject.status).color }}
                    >
                      {statusBadge(drawerProject.status).label}
                    </span>
                    {drawerProject.hot && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>🔥 HOT</span>}
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerProject.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerProject.longDescription}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>分类</div>
                      <div className="text-sm" style={{ color: BRAND.text }}>{categoryName(drawerProject.category)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>公链</div>
                      <div className="text-sm flex items-center gap-1" style={{ color: chainColor(drawerProject.chain) }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chainColor(drawerProject.chain) }} />
                        {chainName(drawerProject.chain)}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>价格</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.primary }}>${drawerProject.salePrice.toFixed(3)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>硬顶</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatUSDT(drawerProject.hardCap)} USDT</div>
                    </div>
                  </div>
                  {(drawerProject.status === 'subscription' || drawerProject.status === 'allocated') && (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1" style={{ color: BRAND.textMute }}>
                        <span>认购进度</span>
                        <span>{drawerProject.progress.toFixed(2)}% / 100%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                        <div className="h-full" style={{ width: `${Math.min(100, drawerProject.progress)}%`, backgroundColor: BRAND.success }} />
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>项目亮点</div>
                    <div className="space-y-1">
                      {drawerProject.highlights.map((h) => (
                        <div key={h} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <Sparkles size={12} style={{ color: BRAND.warning }} /> {h}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>项目路线图</div>
                    <div className="space-y-1">
                      {drawerProject.roadmap.map((r, i) => (
                        <div key={r.phase} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard }}>
                          {r.status === 'done' ? <CheckCircle2 size={12} style={{ color: BRAND.success }} /> : r.status === 'progress' ? <Clock size={12} style={{ color: BRAND.warning }} /> : <CircleIcon size={12} style={{ color: BRAND.textMute }} />}
                          <span className="font-mono" style={{ color: BRAND.primary }}>{r.phase}</span>
                          <span style={{ color: BRAND.textSub }}>{r.milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>投资方 / 合作方</div>
                    <div className="flex flex-wrap gap-1">
                      {drawerProject.partners.map((p) => (
                        <span key={p} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                      <CircleDollarSign size={12} /> 立即认购
                    </button>
                    <button className="py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <FileText size={12} /> 查看白皮书
                    </button>
                  </div>
                </>
              )}

              {/* 投票 Drawer */}
              {drawerVote && (
                <>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{drawerVote.proposalType}</span>
                  <h2 className="text-xl font-bold mt-2 mb-1" style={{ color: BRAND.text }}>{drawerVote.projectName} ({drawerVote.symbol})</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerVote.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>投票时间</div>
                      <div className="text-xs font-mono" style={{ color: BRAND.text }}>{drawerVote.startDate} ~ {drawerVote.endDate}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>发起人</div>
                      <div className="text-xs font-mono" style={{ color: BRAND.text }}>{drawerVote.proposer}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>投票进度</div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-mono">
                      <span className="w-12" style={{ color: BRAND.success }}>支持</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.dangerLt }}>
                        <div className="h-full" style={{ width: `${(drawerVote.votesFor / Math.max(1, drawerVote.votesFor + drawerVote.votesAgainst)) * 100}%`, backgroundColor: BRAND.success }} />
                      </div>
                      <span style={{ color: BRAND.success }}>{formatNumber(drawerVote.votesFor)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-mono">
                      <span className="w-12" style={{ color: BRAND.danger }}>反对</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.successLt }}>
                        <div className="h-full" style={{ width: `${(drawerVote.votesAgainst / Math.max(1, drawerVote.votesFor + drawerVote.votesAgainst)) * 100}%`, backgroundColor: BRAND.danger }} />
                      </div>
                      <span style={{ color: BRAND.danger }}>{formatNumber(drawerVote.votesAgainst)}</span>
                    </div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>已投票: {formatNumber(drawerVote.totalVotes)} / {formatNumber(drawerVote.requiredVotes)}</div>
                  </div>
                  {drawerVote.status === 'voting' && (
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-lg text-xs font-mono" style={{ backgroundColor: BRAND.successLt, color: BRAND.success, border: `1px solid ${BRAND.success}` }}>支持</button>
                      <button className="flex-1 py-2 rounded-lg text-xs font-mono" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger, border: `1px solid ${BRAND.danger}` }}>反对</button>
                    </div>
                  )}
                </>
              )}

              {/* 排名 Drawer */}
              {drawerRank && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: drawerRank.rank === 1 ? BRAND.warningLt : drawerRank.rank === 2 ? BRAND.infoLt : drawerRank.rank === 3 ? BRAND.successLt : BRAND.bgCardHover,
                        color: drawerRank.rank === 1 ? BRAND.warning : drawerRank.rank === 2 ? BRAND.info : drawerRank.rank === 3 ? BRAND.success : BRAND.textMute,
                      }}
                    >
                      {drawerRank.rank === 1 ? <Crown size={18} /> : drawerRank.rank === 2 ? <Medal size={18} /> : drawerRank.rank === 3 ? <Award size={18} /> : `#${drawerRank.rank}`}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{categoryName(drawerRank.category)}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>#{drawerRank.rank} · {drawerRank.name} ({drawerRank.symbol})</h2>
                  <p className="text-sm mb-3 font-mono" style={{ color: BRAND.primary }}>综合评分: {drawerRank.score}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>募集</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatUSDT(drawerRank.raised)} USDT</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>参与用户</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatNumber(drawerRank.participants)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>超募倍数</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.warning }}>{drawerRank.oversubscription}x</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>成交额</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatUSDT(drawerRank.tradingVolume)} USDT</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>发行价</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>${drawerRank.initialPrice.toFixed(3)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>现价</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>${drawerRank.currentPrice.toFixed(3)}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg mt-3 flex items-center justify-between" style={{ backgroundColor: drawerRank.returnRate >= 0 ? BRAND.successLt : BRAND.dangerLt }}>
                    <span className="text-xs font-mono" style={{ color: BRAND.text }}>历史回报</span>
                    <span className="text-lg font-mono font-bold" style={{ color: drawerRank.returnRate >= 0 ? BRAND.success : BRAND.danger }}>
                      {drawerRank.returnRate >= 0 ? '+' : ''}{drawerRank.returnRate}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg mt-2 text-[10px]" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>
                    <AlertTriangle size={12} className="inline mr-1" />
                    数字资产投资存在高风险，历史业绩不代表未来表现。
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 帮助 Drawer ============== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[420px] overflow-y-auto p-5"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard size={18} style={{ color: BRAND.primary }} />
                快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)} style={{ color: BRAND.textMute }}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'Esc', desc: '关闭 Drawer / 帮助' },
                { key: '?', desc: '打开 / 关闭帮助' },
                { key: '1-7', desc: '切换 Tab (1 总览 / 2 当前 / 3 往期 / 4 投票 / 5 申请 / 6 排名 / 7 流程)' },
              ].map((h) => (
                <div key={h.key} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{h.desc}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{h.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ============== 子组件 ==============

function ProjectCard({ project, idx, expanded }: { project: Project; idx: number; expanded?: boolean }) {
  const badge = statusBadge(project.status);
  const BadgeIcon = badge.Icon;
  const countdown = useCountdown(project.subscriptionEnd);

  return (
    <div
      onClick={() => { window.location.hash = project.id; }}
      className="p-4 rounded-xl cursor-pointer transition-all"
      style={{
        backgroundColor: BRAND.bgCard,
        border: `1px solid ${project.hot ? BRAND.danger : BRAND.border}`,
        animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold" style={{ backgroundColor: `${chainColor(project.chain)}20`, color: chainColor(project.chain) }}>
            {project.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>{project.symbol}</span>
              {project.hot && <Flame size={12} style={{ color: BRAND.danger }} />}
            </div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{project.name}</div>
          </div>
        </div>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          <BadgeIcon size={10} />
          {badge.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{categoryName(project.category)}</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.bgCardHover, color: chainColor(project.chain) }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chainColor(project.chain) }} />
          {chainName(project.chain)}
        </span>
      </div>
      <p className={`text-xs mb-2 ${expanded ? '' : 'line-clamp-2'}`} style={{ color: BRAND.textSub }}>{project.description}</p>
      {(project.status === 'subscription' || project.status === 'allocated') && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1" style={{ color: BRAND.textMute }}>
            <span>认购进度</span>
            <span style={{ color: BRAND.success }}>{project.progress.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
            <div className="h-full" style={{ width: `${Math.min(100, project.progress)}%`, backgroundColor: BRAND.success }} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>
        <div>价格<br /><span style={{ color: BRAND.primary, fontSize: 12 }}>${project.salePrice.toFixed(3)}</span></div>
        <div>募集<br /><span style={{ color: BRAND.text, fontSize: 12 }}>{formatUSDT(project.raised)}</span></div>
        <div>参与<br /><span style={{ color: BRAND.text, fontSize: 12 }}>{formatNumber(project.participants)}</span></div>
      </div>
      {project.status === 'subscription' && (
        <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bgCardHover }}>
          <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>距认购结束</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: BRAND.success, animation: countdown.diff < 86400000 ? 'pulse 1s infinite' : 'none' }}>
            {countdown.days}d {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}:{String(countdown.secs).padStart(2, '0')}
          </span>
        </div>
      )}
      <div className="mt-2 flex gap-1">
        {project.whitelistRequired && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>白名单</span>
        )}
        {project.kycRequired && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>KYC</span>
        )}
      </div>
    </div>
  );
}

function LiveProjectHero({ project }: { project: Project }) {
  const badge = statusBadge(project.status);
  const BadgeIcon = badge.Icon;
  const countdown = useCountdown(project.subscriptionEnd);

  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        backgroundColor: BRAND.bgCard,
        border: `1px solid ${BRAND.danger}`,
        animation: 'fadeInUp 0.4s ease-out both',
      }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.danger, animation: 'pulse 1s infinite' }} />
          {badge.label}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>
          <Flame size={10} className="inline" /> 热门
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{categoryName(project.category)}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.bgCardHover, color: chainColor(project.chain) }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chainColor(project.chain) }} />
          {chainName(project.chain)}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg" style={{ backgroundColor: `${chainColor(project.chain)}20`, color: chainColor(project.chain) }}>
              {project.symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono" style={{ color: BRAND.text }}>{project.symbol}</h2>
              <div className="text-sm" style={{ color: BRAND.textSub }}>{project.name}</div>
            </div>
          </div>
          <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{project.description}</p>
          <div className="grid grid-cols-2 gap-2">
            {project.highlights.slice(0, 4).map((h) => (
              <div key={h} className="text-xs p-2 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>
                <CheckCircle2 size={10} style={{ color: BRAND.success }} /> {h}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover }}>
              <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>认购价格</div>
              <div className="text-lg font-mono font-bold" style={{ color: BRAND.primary }}>${project.salePrice.toFixed(3)}</div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover }}>
              <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>单户限额</div>
              <div className="text-lg font-mono" style={{ color: BRAND.text }}>${project.maxPerUser}</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-mono mb-1" style={{ color: BRAND.textMute }}>
              <span>认购进度</span>
              <span style={{ color: BRAND.success }}>{project.progress.toFixed(2)}% / 100%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
              <div className="h-full" style={{ width: `${Math.min(100, project.progress)}%`, backgroundColor: BRAND.success }} />
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
              <div>募集<br /><span style={{ color: BRAND.text, fontSize: 11 }}>{formatUSDT(project.raised)} / {formatUSDT(project.hardCap)}</span></div>
              <div>参与<br /><span style={{ color: BRAND.text, fontSize: 11 }}>{formatNumber(project.participants)}</span></div>
              <div>超募<br /><span style={{ color: BRAND.warning, fontSize: 11 }}>{(project.raised / project.hardCap).toFixed(2)}x</span></div>
            </div>
          </div>
          <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.dangerLt }}>
            <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>距认购结束</span>
            <span className="text-sm font-mono font-bold" style={{ color: BRAND.danger, animation: 'pulse 1s infinite' }}>
              {countdown.days}d {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}:{String(countdown.secs).padStart(2, '0')}
            </span>
          </div>
          <button className="w-full mt-3 py-2 rounded-lg text-sm font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
            <CircleDollarSign size={14} /> 立即认购
          </button>
        </div>
      </div>
    </section>
  );
}

function VoteCard({ vote, idx, voteAction, setVoteAction, onClick }: { vote: Vote; idx: number; voteAction: Record<string, 'for' | 'against' | null>; setVoteAction: any; onClick: () => void }) {
  const total = vote.votesFor + vote.votesAgainst;
  const forPercent = total > 0 ? (vote.votesFor / total) * 100 : 0;
  const myVote = voteAction[vote.id];

  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg cursor-pointer transition-all"
      style={{
        backgroundColor: BRAND.bgCard,
        border: `1px solid ${BRAND.border}`,
        animation: `fadeInUp 0.3s ease-out ${idx * 0.04}s both`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{vote.projectName}</span>
            <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{vote.symbol}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: vote.status === 'voting' ? BRAND.successLt : vote.status === 'upcoming' ? BRAND.infoLt : vote.status === 'shortlisted' ? BRAND.warningLt : BRAND.dangerLt, color: vote.status === 'voting' ? BRAND.success : vote.status === 'upcoming' ? BRAND.info : vote.status === 'shortlisted' ? BRAND.warning : BRAND.danger }}>
              {vote.status === 'voting' ? '投票中' : vote.status === 'upcoming' ? '即将开始' : vote.status === 'shortlisted' ? '已入围' : '未通过'}
            </span>
          </div>
          <div className="text-xs line-clamp-1" style={{ color: BRAND.textSub }}>{vote.description}</div>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1 text-xs font-mono">
          <span className="w-10" style={{ color: BRAND.success }}>支持</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.dangerLt }}>
            <div className="h-full" style={{ width: `${forPercent}%`, backgroundColor: BRAND.success }} />
          </div>
          <span style={{ color: BRAND.success, minWidth: 48, textAlign: 'right' }}>{formatNumber(vote.votesFor)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-10" style={{ color: BRAND.danger }}>反对</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.successLt }}>
            <div className="h-full" style={{ width: `${100 - forPercent}%`, backgroundColor: BRAND.danger }} />
          </div>
          <span style={{ color: BRAND.danger, minWidth: 48, textAlign: 'right' }}>{formatNumber(vote.votesAgainst)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textMute }}>
        <span>总票数: {formatNumber(vote.totalVotes)} / {formatNumber(vote.requiredVotes)}</span>
        <span>{vote.startDate} ~ {vote.endDate}</span>
      </div>
      {vote.status === 'voting' && (
        <div className="mt-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setVoteAction((p: any) => ({ ...p, [vote.id]: 'for' })); }}
            className="flex-1 py-1.5 rounded text-[10px] font-mono"
            style={{ backgroundColor: myVote === 'for' ? BRAND.success : BRAND.successLt, color: myVote === 'for' ? BRAND.onPrimary : BRAND.success, border: `1px solid ${BRAND.success}` }}
          >
            支持
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setVoteAction((p: any) => ({ ...p, [vote.id]: 'against' })); }}
            className="flex-1 py-1.5 rounded text-[10px] font-mono"
            style={{ backgroundColor: myVote === 'against' ? BRAND.danger : BRAND.dangerLt, color: myVote === 'against' ? BRAND.onPrimary : BRAND.danger, border: `1px solid ${BRAND.danger}` }}
          >
            反对
          </button>
        </div>
      )}
    </div>
  );
}

// 缺失图标补偿
const VoteIcon = (props: any) => <CheckCircle2 {...props} />;
const History = (props: any) => <Clock {...props} />;
const CircleIcon = (props: any) => <CheckCircle2 {...props} />;

export default PortalLaunch;
