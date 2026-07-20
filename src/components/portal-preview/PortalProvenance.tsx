'use client';

/**
 * PortalProvenance - 链上资产溯源与证明中心 (2026-07-20 Q05 P3.41)
 *
 * 页面定位：
 * - 中萨数字科技交易所 链上资产溯源与证明中心
 * - 资产登记 / 链上证明 / 跨链互验 / 审计追踪 / 信任网络 / 合规存证 / 资产图谱 / API 接入
 * - 与 P3.30 跨链桥 + P3.32 链上数据 + P3.36 NFT + P3.40 量化
 *   形成"桥接-数据-资产-策略"全栈可观测与可证明闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 Tabs：总览 / 资产登记 / 链上证明 / 跨链互验 / 审计追踪 / 信任网络 / 合规存证 / 资产图谱 / API 接入 / 帮助
 * - 10+ 区块、8+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有资产登记/证明/审计数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"技术研究方向 + 合规研究方向"双重定性
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
  Fingerprint,
  Hash,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Link2,
  LinkIcon,
  Network,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  CircleDot,
  CircleSlash,
  CircleDashed,
  CircleCheck,
  CircleX,
  Boxes,
  Box,
  Layers,
  Database,
  Server,
  Lock,
  Key,
  KeyRound,
  Eye,
  EyeOff,
  FileText,
  FileSearch,
  FileCheck,
  FileBadge,
  FileLock,
  FileClock,
  BookOpen,
  BookMarked,
  BookText,
  ListTree,
  ListChecks,
  GitBranch,
  GitFork,
  GitCommit,
  GitMerge,
  Workflow,
  Activity,
  Gauge,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Sparkles,
  Star,
  StarOff,
  Heart,
  Bookmark,
  BookmarkCheck,
  Bell,
  BellRing,
  BellOff,
  Zap,
  Rocket,
  Flame,
  Clock,
  Calendar,
  Tag,
  Tags,
  Hash as HashIcon,
  Globe,
  Globe2,
  Map,
  MapPin,
  Compass,
  Telescope,
  Microscope,
  Atom,
  FlaskConical,
  Cpu,
  HardDrive,
  Terminal,
  Code,
  Code2,
  Binary,
  ScanLine,
  Scan,
  QrCode,
  Radar,
  Radio,
  RadioTower,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Wifi,
  WifiOff,
  Building,
  Building2,
  Landmark,
  Banknote,
  Coins,
  CircleDollarSign,
  DollarSign,
  Receipt,
  ScrollText,
  Scroll,
  Stamp,
  Award,
  BadgeCheck,
  BadgeAlert,
  BadgeInfo,
  Verified,
  CheckCheck,
  ChevronsRight,
  ChevronsLeft,
  ArrowRight,
  ArrowLeftRight,
  CornerDownRight,
  CornerUpRight,
  MoveRight,
  MoveDownRight,
  ExternalLink,
  Download,
  Share2,
  Copy as CopyIcon,
  Send,
  Mail,
  MessageCircle,
  MessageSquare,
  Plus,
  Minus,
  Settings,
  Settings2,
  Sliders,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Power,
  PowerOff,
  Play,
  Pause,
  History,
  Hourglass,
  Timer,
  TimerReset,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  TrendingUpDown,
  Scale,
  Wrench,
  Hammer,
  Construction,
  Tool,
  Plug,
  PlugZap,
  Unplug,
  Cable,
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
  PackageSearch,
  PackageOpen,
  Package2,
  PackageCheck,
  PackageX,
  Puzzle,
  PlusCircle,
  HelpCircle,
  Info,
  Lightbulb,
  ArrowDownUp,
  ArrowUpDown,
  ArrowUpRight,
  ChartNetwork,
  ChartSpline,
  ChartBar,
  ChartBarIncreasing,
  ChartBarDecreasing,
  ChartArea,
  ChartColumn,
  ChartColumnIncreasing,
  ChartColumnDecreasing,
  ChartLine,
  ChartPie,
  Hexagon,
  Triangle,
  Octagon,
  OctagonAlert,
  OctagonX,
  Diamond,
  Pentagon,
  Square,
  Circle,
  CircleDot as CircleDotIcon,
  Dot,
  Equal,
  EqualNot,
  XCircle,
  XSquare,
  XOctagon,
  X as XIcon,
  Asterisk,
  AtSign,
  Check,
  ClipboardCheck,
  ClipboardList,
  ClipboardCopy,
  Cog,
  Crosshair,
  Crown,
  Currency,
} from 'lucide-react';

import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============== 类型定义 ==============

type Tab =
  | 'overview'
  | 'registry'
  | 'proof'
  | 'cross-chain'
  | 'audit'
  | 'trust'
  | 'compliance'
  | 'graph'
  | 'integrate'
  | 'help';

type DrawerType =
  | 'asset'
  | 'proof'
  | 'cross-chain'
  | 'auditor'
  | 'node'
  | 'evidence'
  | 'integrate'
  | null;

interface AssetRegistration {
  id: string;
  assetType: 'crypto' | 'nft' | 'rwa' | 'token' | 'stable';
  name: string;
  symbol: string;
  issuer: string;
  contractAddress: string;
  totalSupply: number;
  decimals: number;
  chain: string;
  registeredAt: string;
  registrationHash: string;
  status: 'verified' | 'anchored' | 'pending' | 'revoked';
  category: string;
  iconColor: string;
  description: string;
  holders: number;
  txCount24h: number;
  crossChainAnchors: number;
  trustScore: number;
  auditCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  metadata: {
    kyc: boolean;
    sourceChain: string;
    originalTx: string;
    evidenceHash: string;
    issuerType: 'official' | 'verified' | 'community';
  };
}

interface ChainProof {
  id: string;
  assetId: string;
  assetName: string;
  chain: string;
  chainIcon: string;
  blockHeight: number;
  confirmations: number;
  finality: 'finalized' | 'soft' | 'pending';
  status: 'verified' | 'anchored' | 'pending' | 'failed';
  lastUpdate: string;
  proofHash: string;
  merkleRoot: string;
  gasUsed: number;
  proofType: 'merkle' | 'spv' | 'signature' | 'attestation';
  latencyMs: number;
}

interface CrossChainAnchor {
  id: string;
  assetName: string;
  fromChain: string;
  toChain: string;
  bridge: string;
  anchorType: 'light-client' | 'merkle' | 'optimistic' | 'zk';
  txHash: string;
  blockHeight: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  fee: number;
  latency: number;
  color: string;
}

interface AuditRecord {
  id: string;
  assetId: string;
  assetName: string;
  auditor: string;
  auditorLogo: string;
  auditType: 'security' | 'financial' | 'compliance' | 'code';
  scope: string;
  startedAt: string;
  completedAt: string;
  status: 'passed' | 'warning' | 'failed' | 'in-progress';
  score: number;
  findings: number;
  critical: number;
  reportHash: string;
  downloadUrl: string;
}

interface TrustNode {
  id: string;
  name: string;
  type: 'validator' | 'oracle' | 'auditor' | 'attestor' | 'bridge';
  region: string;
  uptime: number;
  trustScore: number;
  attestations: number;
  stake: number;
  lastActive: string;
  status: 'active' | 'syncing' | 'offline';
  publicKey: string;
}

interface ComplianceEvidence {
  id: string;
  evidenceType: 'kyc' | 'aml' | 'jurisdiction' | 'reserve' | 'tax';
  subject: string;
  subjectType: 'asset' | 'user' | 'transaction' | 'platform';
  provider: string;
  hash: string;
  timestamp: string;
  retention: string;
  status: 'valid' | 'expired' | 'pending' | 'revoked';
  jurisdiction: string;
  attestations: number;
}

// ============== Mock 数据：资产登记 ==============

const ASSET_REGISTRATIONS: AssetRegistration[] = [
  {
    id: 'ast-001',
    assetType: 'stable',
    name: 'ZSUSD 稳定币',
    symbol: 'ZSUSD',
    issuer: 'ZSDEX 官方发行',
    contractAddress: '0x14B881a9C2e3F08a4c7dE3A1B5C9F0E2D8A7B6C5',
    totalSupply: 184200000,
    decimals: 6,
    chain: 'Ethereum',
    registeredAt: '2025-08-12 14:22:18',
    registrationHash: '0x8a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    status: 'verified',
    category: '稳定币',
    iconColor: '#0ECB81',
    description: '由 ZSDEX 官方发行的美元挂钩稳定币，1:1 储备资产，第三方审计追踪。',
    holders: 128400,
    txCount24h: 18420,
    crossChainAnchors: 6,
    trustScore: 96.8,
    auditCount: 12,
    riskLevel: 'low',
    metadata: {
      kyc: true,
      sourceChain: 'Ethereum',
      originalTx: '0x9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      evidenceHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      issuerType: 'official',
    },
  },
  {
    id: 'ast-002',
    assetType: 'rwa',
    name: '碳中和信用 RWA',
    symbol: 'CARBON-X',
    issuer: 'GreenLedger 基金会',
    contractAddress: '0x7F2e8a3c1B4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f',
    totalSupply: 5000000,
    decimals: 18,
    chain: 'Polygon',
    registeredAt: '2026-03-18 09:18:42',
    registrationHash: '0xc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    status: 'verified',
    category: 'RWA 实物资产',
    iconColor: '#44dbf4',
    description: '链上可追溯的碳信用 RWA，每枚代表 1 吨 CO2 减排量，由 GreenLedger 基金会发行。',
    holders: 8420,
    txCount24h: 1240,
    crossChainAnchors: 4,
    trustScore: 88.4,
    auditCount: 6,
    riskLevel: 'low',
    metadata: {
      kyc: true,
      sourceChain: 'Polygon',
      originalTx: '0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      evidenceHash: '0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      issuerType: 'verified',
    },
  },
  {
    id: 'ast-003',
    assetType: 'nft',
    name: '故宫文创数字典藏',
    symbol: 'GG-IP',
    issuer: '故宫博物院 IP 授权',
    contractAddress: '0x9A8b7C6d5E4f3A2b1C0d9E8f7A6b5C4d3E2f1A0b',
    totalSupply: 10000,
    decimals: 0,
    chain: 'BNB Chain',
    registeredAt: '2026-05-22 16:48:24',
    registrationHash: '0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    status: 'anchored',
    category: '数字藏品 / IP',
    iconColor: '#A855F7',
    description: '故宫博物院官方授权的文创数字典藏，每件对应一件文物的高精度 3D 数字孪生体。',
    holders: 8420,
    txCount24h: 2480,
    crossChainAnchors: 3,
    trustScore: 92.6,
    auditCount: 4,
    riskLevel: 'low',
    metadata: {
      kyc: true,
      sourceChain: 'BNB Chain',
      originalTx: '0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
      evidenceHash: '0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
      issuerType: 'verified',
    },
  },
  {
    id: 'ast-004',
    assetType: 'token',
    name: 'ZSDEX 平台通证',
    symbol: 'ZSX',
    issuer: 'ZSDEX 基金会',
    contractAddress: '0x6B5c4d3E2f1A0b9C8d7E6f5A4b3C2d1E0f9A8b7C',
    totalSupply: 1000000000,
    decimals: 18,
    chain: 'Ethereum',
    registeredAt: '2025-06-08 10:00:00',
    registrationHash: '0xd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    status: 'verified',
    category: '平台通证',
    iconColor: '#14B881',
    description: 'ZSDEX 平台治理与生态通证，用于手续费折扣、治理投票、生态激励等场景。',
    holders: 284200,
    txCount24h: 28400,
    crossChainAnchors: 5,
    trustScore: 94.2,
    auditCount: 8,
    riskLevel: 'low',
    metadata: {
      kyc: true,
      sourceChain: 'Ethereum',
      originalTx: '0xe1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
      evidenceHash: '0xf2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
      issuerType: 'official',
    },
  },
  {
    id: 'ast-005',
    assetType: 'crypto',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    issuer: 'BitGo 信托',
    contractAddress: '0xC5d6e7f8A9b0C1d2E3f4A5b6C7d8E9f0A1b2C3d4',
    totalSupply: 168400,
    decimals: 8,
    chain: 'Ethereum',
    registeredAt: '2024-11-12 12:00:00',
    registrationHash: '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
    status: 'verified',
    category: '包装资产',
    iconColor: '#F7931A',
    description: '由 BitGo 信托发行的 1:1 锚定 BTC 的 ERC-20 包装资产，链上可验证储备。',
    holders: 18420,
    txCount24h: 8420,
    crossChainAnchors: 7,
    trustScore: 91.8,
    auditCount: 18,
    riskLevel: 'low',
    metadata: {
      kyc: true,
      sourceChain: 'Ethereum',
      originalTx: '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
      evidenceHash: '0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
      issuerType: 'verified',
    },
  },
  {
    id: 'ast-006',
    assetType: 'rwa',
    name: '上海写字楼 REITs',
    symbol: 'SH-REIT-01',
    issuer: '中信资本',
    contractAddress: '0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0',
    totalSupply: 50000000,
    decimals: 18,
    chain: 'Arbitrum',
    registeredAt: '2026-06-08 10:00:00',
    registrationHash: '0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
    status: 'pending',
    category: 'RWA 不动产',
    iconColor: '#FFA940',
    description: '上海陆家嘴核心地段写字楼 REITs，由中信资本发行，租金现金流可追溯。',
    holders: 0,
    txCount24h: 0,
    crossChainAnchors: 0,
    trustScore: 0,
    auditCount: 0,
    riskLevel: 'medium',
    metadata: {
      kyc: true,
      sourceChain: 'Arbitrum',
      originalTx: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      evidenceHash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      issuerType: 'verified',
    },
  },
  {
    id: 'ast-007',
    assetType: 'token',
    name: '社区治理币',
    symbol: 'COMM-X',
    issuer: '社区自治组织',
    contractAddress: '0xD8e9f0A1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7',
    totalSupply: 100000000,
    decimals: 18,
    chain: 'Optimism',
    registeredAt: '2026-04-12 18:24:36',
    registrationHash: '0x9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    status: 'anchored',
    category: '社区代币',
    iconColor: '#EC4899',
    description: '由社区自治组织发行的治理代币，用于提案投票、贡献激励、生态共建。',
    holders: 8420,
    txCount24h: 1840,
    crossChainAnchors: 2,
    trustScore: 72.4,
    auditCount: 2,
    riskLevel: 'medium',
    metadata: {
      kyc: false,
      sourceChain: 'Optimism',
      originalTx: '0x0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
      evidenceHash: '0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
      issuerType: 'community',
    },
  },
  {
    id: 'ast-008',
    assetType: 'stable',
    name: '离岸人民币稳定币',
    symbol: 'CNHO',
    issuer: '香港数字资产有限公司',
    contractAddress: '0xE1f2A3b4C5d6E7f8A9b0C1d2E3f4A5b6C7d8E9f0',
    totalSupply: 68400000,
    decimals: 6,
    chain: 'Tron',
    registeredAt: '2026-02-08 14:18:24',
    registrationHash: '0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f',
    status: 'verified',
    category: '稳定币',
    iconColor: '#F6465D',
    description: '面向跨境贸易结算场景的离岸人民币挂钩稳定币（合规研究方向示例，仅作技术演示）。',
    holders: 8420,
    txCount24h: 12480,
    crossChainAnchors: 4,
    trustScore: 84.6,
    auditCount: 6,
    riskLevel: 'medium',
    metadata: {
      kyc: true,
      sourceChain: 'Tron',
      originalTx: '0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
      evidenceHash: '0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
      issuerType: 'verified',
    },
  },
];

// ============== Mock 数据：链上证明 ==============

const CHAIN_PROOFS: ChainProof[] = [
  {
    id: 'pf-001',
    assetId: 'ast-001',
    assetName: 'ZSUSD 稳定币',
    chain: 'Ethereum',
    chainIcon: '⟠',
    blockHeight: 19284000,
    confirmations: 128400,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '2 秒前',
    proofHash: '0x8a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    merkleRoot: '0x9b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    gasUsed: 184200,
    proofType: 'merkle',
    latencyMs: 128,
  },
  {
    id: 'pf-002',
    assetId: 'ast-001',
    assetName: 'ZSUSD 稳定币',
    chain: 'Polygon',
    chainIcon: '⬡',
    blockHeight: 56284000,
    confirmations: 84200,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '4 秒前',
    proofHash: '0x7a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    merkleRoot: '0x6b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    gasUsed: 84200,
    proofType: 'attestation',
    latencyMs: 84,
  },
  {
    id: 'pf-003',
    assetId: 'ast-002',
    assetName: '碳中和信用 RWA',
    chain: 'Polygon',
    chainIcon: '⬡',
    blockHeight: 56286000,
    confirmations: 18420,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '8 秒前',
    proofHash: '0x5a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    merkleRoot: '0x4b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    gasUsed: 64200,
    proofType: 'spv',
    latencyMs: 142,
  },
  {
    id: 'pf-004',
    assetId: 'ast-003',
    assetName: '故宫文创数字典藏',
    chain: 'BNB Chain',
    chainIcon: '◆',
    blockHeight: 38284000,
    confirmations: 2480,
    finality: 'soft',
    status: 'anchored',
    lastUpdate: '12 秒前',
    proofHash: '0x3a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    merkleRoot: '0x2b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    gasUsed: 38420,
    proofType: 'signature',
    latencyMs: 248,
  },
  {
    id: 'pf-005',
    assetId: 'ast-004',
    assetName: 'ZSDEX 平台通证',
    chain: 'Ethereum',
    chainIcon: '⟠',
    blockHeight: 19284200,
    confirmations: 184200,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '1 秒前',
    proofHash: '0x1a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    merkleRoot: '0x0b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    gasUsed: 124800,
    proofType: 'merkle',
    latencyMs: 96,
  },
  {
    id: 'pf-006',
    assetId: 'ast-005',
    assetName: 'Wrapped Bitcoin',
    chain: 'Ethereum',
    chainIcon: '⟠',
    blockHeight: 19284350,
    confirmations: 168400,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '3 秒前',
    proofHash: '0xf3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
    merkleRoot: '0xe4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3',
    gasUsed: 184200,
    proofType: 'attestation',
    latencyMs: 184,
  },
  {
    id: 'pf-007',
    assetId: 'ast-008',
    assetName: '离岸人民币稳定币',
    chain: 'Tron',
    chainIcon: '◆',
    blockHeight: 68284000,
    confirmations: 68400,
    finality: 'finalized',
    status: 'verified',
    lastUpdate: '6 秒前',
    proofHash: '0xd3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2',
    merkleRoot: '0xc4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c4',
    gasUsed: 28420,
    proofType: 'merkle',
    latencyMs: 248,
  },
  {
    id: 'pf-008',
    assetId: 'ast-006',
    assetName: '上海写字楼 REITs',
    chain: 'Arbitrum',
    chainIcon: '◈',
    blockHeight: 184200000,
    confirmations: 8420,
    finality: 'soft',
    status: 'pending',
    lastUpdate: '18 秒前',
    proofHash: '0xb3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b3',
    merkleRoot: '0xa4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c5',
    gasUsed: 84200,
    proofType: 'signature',
    latencyMs: 384,
  },
];

// ============== Mock 数据：跨链锚定 ==============

const CROSS_CHAIN_ANCHORS: CrossChainAnchor[] = [
  {
    id: 'cc-001',
    assetName: 'ZSUSD 稳定币',
    fromChain: 'Ethereum',
    toChain: 'Polygon',
    bridge: 'LayerZero V2',
    anchorType: 'light-client',
    txHash: '0xa3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
    blockHeight: 56284000,
    timestamp: '2026-07-20 15:24:18',
    status: 'confirmed',
    fee: 12.4,
    latency: 84,
    color: '#44dbf4',
  },
  {
    id: 'cc-002',
    assetName: 'ZSUSD 稳定币',
    fromChain: 'Ethereum',
    toChain: 'Arbitrum',
    bridge: 'Wormhole Guardian',
    anchorType: 'merkle',
    txHash: '0xb3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2',
    blockHeight: 184200000,
    timestamp: '2026-07-20 15:18:42',
    status: 'confirmed',
    fee: 8.6,
    latency: 124,
    color: '#44dbf4',
  },
  {
    id: 'cc-003',
    assetName: 'ZSDEX 平台通证',
    fromChain: 'Ethereum',
    toChain: 'BNB Chain',
    bridge: 'Chainlink CCIP',
    anchorType: 'optimistic',
    txHash: '0xc3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b3',
    blockHeight: 38284000,
    timestamp: '2026-07-20 14:48:24',
    status: 'confirmed',
    fee: 18.2,
    latency: 248,
    color: '#14B881',
  },
  {
    id: 'cc-004',
    assetName: 'Wrapped Bitcoin',
    fromChain: 'Ethereum',
    toChain: 'Solana',
    bridge: 'Wormhole Portal',
    anchorType: 'merkle',
    txHash: '0xd3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b4',
    blockHeight: 248200000,
    timestamp: '2026-07-20 13:24:18',
    status: 'confirmed',
    fee: 24.6,
    latency: 184,
    color: '#F7931A',
  },
  {
    id: 'cc-005',
    assetName: '故宫文创数字典藏',
    fromChain: 'BNB Chain',
    toChain: 'Polygon',
    bridge: 'LayerZero V2',
    anchorType: 'light-client',
    txHash: '0xe3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b5',
    blockHeight: 56286000,
    timestamp: '2026-07-20 12:18:42',
    status: 'pending',
    fee: 6.4,
    latency: 184,
    color: '#A855F7',
  },
  {
    id: 'cc-006',
    assetName: '离岸人民币稳定币',
    fromChain: 'Tron',
    toChain: 'Ethereum',
    bridge: 'BitTorrent Bridge',
    anchorType: 'zk',
    txHash: '0xf3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b6',
    blockHeight: 19284400,
    timestamp: '2026-07-20 11:42:18',
    status: 'confirmed',
    fee: 4.8,
    latency: 124,
    color: '#F6465D',
  },
  {
    id: 'cc-007',
    assetName: '碳中和信用 RWA',
    fromChain: 'Polygon',
    toChain: 'Base',
    bridge: 'Chainlink CCIP',
    anchorType: 'optimistic',
    txHash: '0x04f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b7',
    blockHeight: 8240000,
    timestamp: '2026-07-20 10:48:24',
    status: 'confirmed',
    fee: 12.8,
    latency: 248,
    color: '#0ECB81',
  },
  {
    id: 'cc-008',
    assetName: '上海写字楼 REITs',
    fromChain: 'Arbitrum',
    toChain: 'Ethereum',
    bridge: 'Arbitrum Canonical',
    anchorType: 'light-client',
    txHash: '0x14f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b8',
    blockHeight: 19284420,
    timestamp: '2026-07-20 09:24:18',
    status: 'failed',
    fee: 24.6,
    latency: 1840,
    color: '#FFA940',
  },
];

// ============== Mock 数据：审计追踪 ==============

const AUDIT_RECORDS: AuditRecord[] = [
  {
    id: 'au-001',
    assetId: 'ast-001',
    assetName: 'ZSUSD 稳定币',
    auditor: '慢雾科技',
    auditorLogo: 'ⓢ',
    auditType: 'security',
    scope: '合约安全 / 升级权限 / 资金流向',
    startedAt: '2026-06-08',
    completedAt: '2026-06-22',
    status: 'passed',
    score: 96.8,
    findings: 3,
    critical: 0,
    reportHash: '0xa3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-001',
  },
  {
    id: 'au-002',
    assetId: 'ast-001',
    assetName: 'ZSUSD 稳定币',
    auditor: 'CertiK',
    auditorLogo: 'ⓒ',
    auditType: 'financial',
    scope: '储备资产 / 1:1 锚定 / 审计追踪',
    startedAt: '2026-05-12',
    completedAt: '2026-05-26',
    status: 'passed',
    score: 98.2,
    findings: 1,
    critical: 0,
    reportHash: '0xb3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-002',
  },
  {
    id: 'au-003',
    assetId: 'ast-002',
    assetName: '碳中和信用 RWA',
    auditor: 'PeckShield',
    auditorLogo: 'ⓟ',
    auditType: 'compliance',
    scope: '碳信用核证 / 链上溯源 / 数据完整性',
    startedAt: '2026-04-18',
    completedAt: '2026-05-02',
    status: 'passed',
    score: 92.4,
    findings: 4,
    critical: 0,
    reportHash: '0xc3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-003',
  },
  {
    id: 'au-004',
    assetId: 'ast-003',
    assetName: '故宫文创数字典藏',
    auditor: '知道创宇',
    auditorLogo: 'ⓚ',
    auditType: 'security',
    scope: '合约安全 / IP 授权链 / 数字孪生完整性',
    startedAt: '2026-05-22',
    completedAt: '2026-06-05',
    status: 'warning',
    score: 88.6,
    findings: 6,
    critical: 0,
    reportHash: '0xd3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-004',
  },
  {
    id: 'au-005',
    assetId: 'ast-004',
    assetName: 'ZSDEX 平台通证',
    auditor: 'OpenZeppelin',
    auditorLogo: 'ⓞ',
    auditType: 'code',
    scope: 'ERC-20 标准 / 通证经济 / 治理合约',
    startedAt: '2026-03-12',
    completedAt: '2026-03-26',
    status: 'passed',
    score: 94.2,
    findings: 2,
    critical: 0,
    reportHash: '0xe3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-005',
  },
  {
    id: 'au-006',
    assetId: 'ast-005',
    assetName: 'Wrapped Bitcoin',
    auditor: 'Trail of Bits',
    auditorLogo: 'ⓣ',
    auditType: 'security',
    scope: '托管安全 / 储备证明 / 多签管理',
    startedAt: '2026-04-08',
    completedAt: '2026-04-22',
    status: 'passed',
    score: 96.4,
    findings: 2,
    critical: 0,
    reportHash: '0xf3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-006',
  },
  {
    id: 'au-007',
    assetId: 'ast-006',
    assetName: '上海写字楼 REITs',
    auditor: '普华永道',
    auditorLogo: 'ⓟ',
    auditType: 'financial',
    scope: '现金流核证 / 不动产估值 / 收益分配',
    startedAt: '2026-07-08',
    completedAt: '',
    status: 'in-progress',
    score: 0,
    findings: 0,
    critical: 0,
    reportHash: '',
    downloadUrl: '#/download/au-007',
  },
  {
    id: 'au-008',
    assetId: 'ast-007',
    assetName: '社区治理币',
    auditor: '社区自治',
    auditorLogo: 'ⓒ',
    auditType: 'code',
    scope: '社区合约 / 提案机制 / 投票权重',
    startedAt: '2026-06-18',
    completedAt: '2026-06-25',
    status: 'warning',
    score: 72.4,
    findings: 8,
    critical: 1,
    reportHash: '0x14f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    downloadUrl: '#/download/au-008',
  },
];

// ============== Mock 数据：信任网络节点 ==============

const TRUST_NODES: TrustNode[] = [
  {
    id: 'tn-001',
    name: 'Coinbase Cloud',
    type: 'validator',
    region: '美国',
    uptime: 99.98,
    trustScore: 98.4,
    attestations: 18420,
    stake: 12840000,
    lastActive: '2 秒前',
    status: 'active',
    publicKey: '0xval_coinbase_cloud_8a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b',
  },
  {
    id: 'tn-002',
    name: 'Chainlink Oracle',
    type: 'oracle',
    region: '全球分布式',
    uptime: 99.96,
    trustScore: 96.8,
    attestations: 248400,
    stake: 8420000,
    lastActive: '1 秒前',
    status: 'active',
    publicKey: '0xval_chainlink_9b4f3d2e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c',
  },
  {
    id: 'tn-003',
    name: '慢雾科技',
    type: 'auditor',
    region: '中国',
    uptime: 99.92,
    trustScore: 94.2,
    attestations: 12480,
    stake: 0,
    lastActive: '8 秒前',
    status: 'active',
    publicKey: '0xval_slowmist_8a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b',
  },
  {
    id: 'tn-004',
    name: 'Wormhole Guardian',
    type: 'bridge',
    region: '全球分布式',
    uptime: 99.84,
    trustScore: 92.6,
    attestations: 84200,
    stake: 6240000,
    lastActive: '4 秒前',
    status: 'active',
    publicKey: '0xval_wormhole_a3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-005',
    name: 'LayerZero Relayer',
    type: 'bridge',
    region: '美国 / 欧洲',
    uptime: 99.88,
    trustScore: 93.4,
    attestations: 168400,
    stake: 4840000,
    lastActive: '6 秒前',
    status: 'active',
    publicKey: '0xval_layerzero_b3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-006',
    name: 'PeckShield',
    type: 'auditor',
    region: '中国',
    uptime: 99.78,
    trustScore: 91.4,
    attestations: 8420,
    stake: 0,
    lastActive: '12 秒前',
    status: 'active',
    publicKey: '0xval_peckshield_c3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-007',
    name: 'CertiK',
    type: 'auditor',
    region: '美国',
    uptime: 99.94,
    trustScore: 95.2,
    attestations: 18420,
    stake: 0,
    lastActive: '4 秒前',
    status: 'active',
    publicKey: '0xval_certik_d3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-008',
    name: '社区见证节点 01',
    type: 'attestor',
    region: '新加坡',
    uptime: 98.42,
    trustScore: 82.6,
    attestations: 2480,
    stake: 1240000,
    lastActive: '2 分钟前',
    status: 'syncing',
    publicKey: '0xval_community01_e3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-009',
    name: 'OpenZeppelin Defender',
    type: 'attestor',
    region: '美国',
    uptime: 99.96,
    trustScore: 96.4,
    attestations: 12480,
    stake: 0,
    lastActive: '3 秒前',
    status: 'active',
    publicKey: '0xval_openzeppelin_f3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
  {
    id: 'tn-010',
    name: '社区见证节点 02',
    type: 'attestor',
    region: '欧洲',
    uptime: 96.84,
    trustScore: 76.4,
    attestations: 1840,
    stake: 842000,
    lastActive: '8 分钟前',
    status: 'offline',
    publicKey: '0xval_community02_04f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c',
  },
];

// ============== Mock 数据：合规存证 ==============

const COMPLIANCE_EVIDENCE: ComplianceEvidence[] = [
  {
    id: 'ev-001',
    evidenceType: 'kyc',
    subject: 'ZSUSD 稳定币 发行方',
    subjectType: 'asset',
    provider: 'Onfido 第三方核证',
    hash: '0xa3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2025-08-12 14:22:18',
    retention: '永久存证',
    status: 'valid',
    jurisdiction: '瑞士金融科技沙盒',
    attestations: 4,
  },
  {
    id: 'ev-002',
    evidenceType: 'aml',
    subject: '碳中和信用 RWA 资金链路',
    subjectType: 'transaction',
    provider: 'Chainalysis KYT',
    hash: '0xb3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-03-18 09:18:42',
    retention: '10 年存证',
    status: 'valid',
    jurisdiction: '欧盟 MiCA 合规研究',
    attestations: 3,
  },
  {
    id: 'ev-003',
    evidenceType: 'reserve',
    subject: 'ZSUSD 稳定币 储备证明',
    subjectType: 'asset',
    provider: 'Armanino LLP',
    hash: '0xc3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-07-08 10:00:00',
    retention: '实时链上可查',
    status: 'valid',
    jurisdiction: '美国 GAAP / IFRS',
    attestations: 8,
  },
  {
    id: 'ev-004',
    evidenceType: 'jurisdiction',
    subject: 'ZSDEX 平台 注册信息',
    subjectType: 'platform',
    provider: 'OpenCorporates',
    hash: '0xd3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2025-06-08 10:00:00',
    retention: '永久存证',
    status: 'valid',
    jurisdiction: '加拿大资金服务法研究 / 香港数字资产框架研究',
    attestations: 6,
  },
  {
    id: 'ev-005',
    evidenceType: 'tax',
    subject: '跨链桥交易税务存证',
    subjectType: 'transaction',
    provider: 'CoinTracker',
    hash: '0xe3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-07-15 14:18:24',
    retention: '7 年存证',
    status: 'valid',
    jurisdiction: '美国 IRS 1099-DA 研究 / 欧盟 DAC8 研究',
    attestations: 2,
  },
  {
    id: 'ev-006',
    evidenceType: 'kyc',
    subject: '上海写字楼 REITs 投资者',
    subjectType: 'user',
    provider: 'Jumio',
    hash: '0xf3f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-07-08 10:00:00',
    retention: '10 年存证',
    status: 'pending',
    jurisdiction: '中国境内 RWA 合规研究',
    attestations: 1,
  },
  {
    id: 'ev-007',
    evidenceType: 'aml',
    subject: '离岸人民币稳定币 跨境流动',
    subjectType: 'transaction',
    provider: 'TRM Labs',
    hash: '0x04f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-02-08 14:18:24',
    retention: '10 年存证',
    status: 'valid',
    jurisdiction: '香港金管局稳定币条例研究 / 跨境支付研究',
    attestations: 3,
  },
  {
    id: 'ev-008',
    evidenceType: 'reserve',
    subject: 'Wrapped Bitcoin 储备证明',
    subjectType: 'asset',
    provider: 'BitGo Trust',
    hash: '0x14f2c9d1b4e5f6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    timestamp: '2026-07-12 18:24:36',
    retention: '实时链上可查',
    status: 'valid',
    jurisdiction: '美国纽约州 BitLicense 研究',
    attestations: 5,
  },
];

// ============== 工具函数 ==============

const formatNumber = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toString();
};

const formatCurrency = (n: number): string => {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(2);
};

const truncateHash = (hash: string, head: number = 6, tail: number = 4): string => {
  if (!hash) return '';
  if (hash.length <= head + tail + 2) return hash;
  return hash.slice(0, head) + '…' + hash.slice(-tail);
};

const statusToBadge = (s: string) => {
  switch (s) {
    case 'verified':
    case 'finalized':
    case 'confirmed':
    case 'valid':
    case 'passed':
    case 'active':
      return { bg: 'rgba(20,184,129,0.12)', fg: BRAND.primary, label: '已验证' };
    case 'anchored':
    case 'soft':
    case 'warning':
      return { bg: 'rgba(255,180,0,0.12)', fg: '#FFA940', label: '已锚定' };
    case 'pending':
    case 'in-progress':
    case 'syncing':
      return { bg: 'rgba(68,219,244,0.12)', fg: '#44dbf4', label: '处理中' };
    case 'failed':
    case 'revoked':
    case 'expired':
    case 'offline':
      return { bg: 'rgba(246,70,93,0.12)', fg: '#F6465D', label: '失败' };
    default:
      return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textSub, label: s };
  }
};

const riskBadge = (r: 'low' | 'medium' | 'high') => {
  if (r === 'low') return { bg: 'rgba(20,184,129,0.12)', fg: BRAND.primary, label: '低风险' };
  if (r === 'medium') return { bg: 'rgba(255,180,0,0.12)', fg: '#FFA940', label: '中风险' };
  return { bg: 'rgba(246,70,93,0.12)', fg: '#F6465D', label: '高风险' };
};

const auditTypeLabel = (t: string) => {
  if (t === 'security') return '安全审计';
  if (t === 'financial') return '财务审计';
  if (t === 'compliance') return '合规审计';
  if (t === 'code') return '代码审计';
  return t;
};

const evidenceTypeLabel = (t: string) => {
  if (t === 'kyc') return 'KYC 核证';
  if (t === 'aml') return 'AML 监控';
  if (t === 'jurisdiction') return '司法存证';
  if (t === 'reserve') return '储备证明';
  if (t === 'tax') return '税务存证';
  return t;
};

const nodeTypeLabel = (t: string) => {
  if (t === 'validator') return '验证节点';
  if (t === 'oracle') return '预言机';
  if (t === 'auditor') return '审计方';
  if (t === 'attestor') return '见证节点';
  if (t === 'bridge') return '跨链桥';
  return t;
};

const proofTypeLabel = (t: string) => {
  if (t === 'merkle') return 'Merkle 证明';
  if (t === 'spv') return 'SPV 简化支付验证';
  if (t === 'signature') return '签名验证';
  if (t === 'attestation') return '见证证明';
  return t;
};

const assetTypeLabel = (t: string) => {
  if (t === 'crypto') return '加密资产';
  if (t === 'nft') return '数字藏品';
  if (t === 'rwa') return '实物资产';
  if (t === 'token') return '平台代币';
  if (t === 'stable') return '稳定币';
  return t;
};

const anchorTypeLabel = (t: string) => {
  if (t === 'light-client') return '轻客户端';
  if (t === 'merkle') return 'Merkle 锚定';
  if (t === 'optimistic') return 'Optimistic 乐观';
  if (t === 'zk') return 'ZK 零知识';
  return t;
};

// ============== 主组件 ==============

export default function PortalProvenance() {
  // === 状态管理 ===
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [drawer, setDrawer] = useState<{ open: boolean; type: DrawerType; payload: string | null }>({
    open: false,
    type: null,
    payload: null,
  });
  const [helpOpen, setHelpOpen] = useState(false);

  // === 实时 KPI（mock 漂移） ===
  const [kpi, setKpi] = useState({
    registeredAssets: 18420,
    verifiedAssets: 14820,
    crossChainAnchors: 84200,
    auditRecords: 6284,
    trustNodes: 1284,
    complianceEvidences: 8420,
    proofLatencyMs: 142,
    todayRegistrations: 84,
    onlineProvers: 428,
    evidenceRetention: '永久',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        registeredAssets: prev.registeredAssets + Math.floor(Math.random() * 3),
        crossChainAnchors: prev.crossChainAnchors + Math.floor(Math.random() * 8),
        proofLatencyMs: Math.max(80, prev.proofLatencyMs + Math.floor(Math.random() * 20 - 10)),
        onlineProvers: Math.max(380, prev.onlineProvers + Math.floor(Math.random() * 10 - 5)),
        todayRegistrations: prev.todayRegistrations + (Math.random() > 0.7 ? 1 : 0),
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // === 过滤逻辑 ===
  const filteredAssets = useMemo(() => {
    let result = ASSET_REGISTRATIONS;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q) || a.issuer.toLowerCase().includes(q),
      );
    }
    if (filterType !== 'all') {
      result = result.filter((a) => a.assetType === filterType);
    }
    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status === filterStatus);
    }
    return result;
  }, [search, filterType, filterStatus]);

  // === Drawer 操作 ===
  const openDrawer = (type: DrawerType, payload: string | null) => {
    setDrawer({ open: true, type, payload });
  };
  const closeDrawer = useCallback(() => {
    setDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  // === 键盘快捷键 ===
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawer.open) closeDrawer();
        else if (helpOpen) setHelpOpen(false);
      }
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('provenance-search');
        if (el) (el as HTMLInputElement).focus();
      }
      if (e.key === '?') {
        setHelpOpen((v) => !v);
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 10) {
        const tabs: Tab[] = ['overview', 'registry', 'proof', 'cross-chain', 'audit', 'trust', 'compliance', 'graph', 'integrate', 'help'];
        setTab(tabs[num - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  // === 工具渲染 ===
  const Stat = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] mb-0.5" style={{ color: BRAND.textSub }}>{label}</div>
      <div className="text-base font-semibold tabular-nums" style={{ color: accent || BRAND.text }}>{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen pq-page" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        .pq-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
        .pq-tab-active { background: ${BRAND.primary} !important; color: ${BRAND.onPrimary} !important; }
        .pq-drawer { animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .pq-stagger > * { animation: fadeInUp 0.4s ease-out both; }
        .pq-stagger > *:nth-child(1) { animation-delay: 0.02s; }
        .pq-stagger > *:nth-child(2) { animation-delay: 0.06s; }
        .pq-stagger > *:nth-child(3) { animation-delay: 0.10s; }
        .pq-stagger > *:nth-child(4) { animation-delay: 0.14s; }
        .pq-stagger > *:nth-child(5) { animation-delay: 0.18s; }
        .pq-stagger > *:nth-child(6) { animation-delay: 0.22s; }
        .pq-stagger > *:nth-child(7) { animation-delay: 0.26s; }
        .pq-stagger > *:nth-child(8) { animation-delay: 0.30s; }
        .pq-pulse { animation: pulse 2s ease-in-out infinite; }
        .pq-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* ============== Hero ============== */}
      <section className="px-6 md:px-10 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>P3.41</span>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: '#44dbf4' }}>研究 / 合规研究方向</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: BRAND.text }}>
            <Fingerprint size={28} className="pq-float" style={{ color: BRAND.primary }} />
            链上资产溯源与证明中心
          </h1>
          <p className="text-sm leading-relaxed max-w-3xl" style={{ color: BRAND.textSub }}>
            <strong style={{ color: BRAND.text }}>链上不可篡改</strong> + <strong style={{ color: BRAND.text }}>跨链可互验</strong> + <strong style={{ color: BRAND.text }}>第三方可审计</strong> + <strong style={{ color: BRAND.text }}>合规可存证</strong>。
            覆盖 <strong style={{ color: BRAND.primary }}>资产登记 / 链上证明 / 跨链互验 / 审计追踪 / 信任网络 / 合规存证 / 资产图谱 / API 接入</strong> 8 大能力模块。
            与 <strong style={{ color: BRAND.text }}>P3.30 跨链桥</strong> + <strong style={{ color: BRAND.text }}>P3.32 链上数据</strong> + <strong style={{ color: BRAND.text }}>P3.36 NFT</strong> + <strong style={{ color: BRAND.text }}>P3.40 量化</strong>
            形成 <strong style={{ color: BRAND.primary }}>"桥接-数据-资产-策略"全栈可观测与可证明闭环</strong>。
          </p>
        </div>
      </section>

      {/* ============== KPI Cards ============== */}
      <section className="px-6 md:px-10 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3 pq-stagger">
          {[
            { label: '已登记资产', value: formatNumber(kpi.registeredAssets), icon: Database, color: BRAND.primary },
            { label: '已验证资产', value: formatNumber(kpi.verifiedAssets), icon: ShieldCheck, color: BRAND.primary },
            { label: '跨链锚定', value: formatNumber(kpi.crossChainAnchors), icon: Link2, color: '#44dbf4' },
            { label: '审计记录', value: formatNumber(kpi.auditRecords), icon: FileCheck, color: '#FFA940' },
            { label: '信任节点', value: formatNumber(kpi.trustNodes), icon: Network, color: '#A855F7' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px]" style={{ color: BRAND.textSub }}>{m.label}</span>
                  <Icon size={14} style={{ color: m.color }} />
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: m.color }}>{m.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============== Real-time Strip ============== */}
      <section className="px-6 md:px-10 pb-6">
        <div className="max-w-7xl mx-auto p-3 rounded-xl flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full pq-pulse" style={{ backgroundColor: BRAND.primary }}></span>
            <span className="text-xs" style={{ color: BRAND.textSub }}>实时</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: BRAND.text }}>
            <span>今日新登记 <strong style={{ color: BRAND.primary }}>{kpi.todayRegistrations}</strong></span>
            <span>·</span>
            <span>在线证明节点 <strong style={{ color: '#44dbf4' }}>{kpi.onlineProvers}</strong></span>
            <span>·</span>
            <span>平均证明延迟 <strong style={{ color: '#FFA940' }}>{kpi.proofLatencyMs}ms</strong></span>
            <span>·</span>
            <span>合规存证 <strong style={{ color: '#A855F7' }}>{formatNumber(kpi.complianceEvidences)}</strong></span>
          </div>
        </div>
      </section>

      {/* ============== Tab Bar ============== */}
      <section className="px-6 md:px-10 pb-4 sticky top-0 z-30" style={{ backgroundColor: BRAND.headerBg, backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { k: 'overview', l: '总览', i: Compass },
              { k: 'registry', l: '资产登记', i: Database },
              { k: 'proof', l: '链上证明', i: ShieldCheck },
              { k: 'cross-chain', l: '跨链互验', i: Link2 },
              { k: 'audit', l: '审计追踪', i: FileCheck },
              { k: 'trust', l: '信任网络', i: Network },
              { k: 'compliance', l: '合规存证', i: Scale },
              { k: 'graph', l: '资产图谱', i: Workflow },
              { k: 'integrate', l: 'API 接入', i: Plug },
              { k: 'help', l: '帮助', i: HelpCircle },
            ].map((t) => {
              const Icon = t.i;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as Tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap ${tab === t.k ? 'pq-tab-active' : ''}`}
                  style={tab === t.k ? {} : { backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                >
                  <Icon size={12} />{t.l}
                </button>
              );
            })}
            <div className="flex-1" />
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: BRAND.textSub }} />
              <input
                id="provenance-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索资产 / 哈希 / 合约 (按 / 聚焦)"
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs w-64"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}`, outline: 'none' }}
              />
            </div>
            <button onClick={() => setHelpOpen(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} title="帮助 (?)">
              <HelpCircle size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ============== Tab Content ============== */}
      <main className="px-6 md:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Compass size={18} style={{ color: BRAND.primary }} />
                  链上资产可观测与可证明
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  通过 <strong style={{ color: BRAND.text }}>资产登记</strong>、<strong style={{ color: BRAND.text }}>链上指纹</strong>、<strong style={{ color: BRAND.text }}>跨链锚定</strong>、<strong style={{ color: BRAND.text }}>第三方审计</strong>、
                  <strong style={{ color: BRAND.text }}>信任网络</strong>、<strong style={{ color: BRAND.text }}>合规存证</strong> 六大维度，构建数字资产的全生命周期可证明性。
                  严格规避"承诺收益 / 保本 / 刚兑 / 稳赚"等高风险合规表述，明确<strong style={{ color: BRAND.primary }}>技术研究 + 合规研究</strong>双重方向。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { label: '已登记资产', val: formatNumber(kpi.registeredAssets), delta: '+12.4%', icon: Database, color: BRAND.primary, sub: '本月新增 842 个' },
                  { label: '跨链锚定笔数', val: formatNumber(kpi.crossChainAnchors), delta: '+24.8%', icon: Link2, color: '#44dbf4', sub: '覆盖 8 条主流公链' },
                  { label: '审计完成率', val: '94.6%', delta: '+2.4%', icon: ShieldCheck, color: '#FFA940', sub: '第三方审计 8 家机构' },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={i} className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: BRAND.textSub }}>{m.label}</span>
                        <Icon size={16} style={{ color: m.color }} />
                      </div>
                      <div className="text-3xl font-bold tabular-nums mb-1" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-xs flex items-center gap-1" style={{ color: BRAND.textSub }}>
                        <span style={{ color: m.color }}>{m.delta}</span>
                        <span>·</span>
                        <span>{m.sub}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Workflow size={16} style={{ color: BRAND.primary }} />
                  闭环流程：桥接 → 数据 → 资产 → 策略
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { n: 1, t: '资产登记', d: '链上指纹 / 注册哈希', c: BRAND.primary },
                    { n: 2, t: '链上证明', d: 'Merkle / SPV / 签名', c: '#44dbf4' },
                    { n: 3, t: '跨链锚定', d: 'Light Client / ZK', c: '#A855F7' },
                    { n: 4, t: '审计追踪', d: '第三方 + 持续监控', c: '#FFA940' },
                  ].map((s) => (
                    <div key={s.n} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-2xl font-bold" style={{ color: s.c }}>{s.n}</div>
                      <div className="text-sm font-semibold mt-1" style={{ color: BRAND.text }}>{s.t}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: BRAND.textSub }}>{s.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Sparkles size={16} style={{ color: BRAND.primary }} />
                  最新登记的资产（点击查看详情）
                </h3>
                <div className="space-y-2">
                  {ASSET_REGISTRATIONS.slice(0, 5).map((a) => {
                    const sb = statusToBadge(a.status);
                    return (
                      <div
                        key={a.id}
                        onClick={() => openDrawer('asset', a.id)}
                        className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.005]"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="p-2 rounded-lg" style={{ backgroundColor: a.iconColor + '20' }}>
                          <Coins size={16} style={{ color: a.iconColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.name}</span>
                            <span className="text-[10px]" style={{ color: BRAND.textSub }}>{a.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                          </div>
                          <div className="text-[10px]" style={{ color: BRAND.textSub }}>{a.issuer} · {a.chain} · 信任分 {a.trustScore.toFixed(1)} · 审计 {a.auditCount} 次</div>
                        </div>
                        <ChevronRight size={14} style={{ color: BRAND.textSub }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'registry' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: BRAND.textSub }}>资产类型:</span>
                {[
                  { v: 'all', l: '全部' },
                  { v: 'crypto', l: '加密资产' },
                  { v: 'nft', l: '数字藏品' },
                  { v: 'rwa', l: '实物资产' },
                  { v: 'token', l: '平台代币' },
                  { v: 'stable', l: '稳定币' },
                ].map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setFilterType(f.v)}
                    className="px-2.5 py-1 rounded text-[10px]"
                    style={{
                      backgroundColor: filterType === f.v ? BRAND.primary : BRAND.bgCard,
                      color: filterType === f.v ? BRAND.onPrimary : BRAND.text,
                      border: `1px solid ${filterType === f.v ? BRAND.primary : BRAND.border}`,
                    }}
                  >
                    {f.l}
                  </button>
                ))}
                <span className="text-xs ml-2" style={{ color: BRAND.textSub }}>状态:</span>
                {[
                  { v: 'all', l: '全部' },
                  { v: 'verified', l: '已验证' },
                  { v: 'anchored', l: '已锚定' },
                  { v: 'pending', l: '待处理' },
                ].map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setFilterStatus(f.v)}
                    className="px-2.5 py-1 rounded text-[10px]"
                    style={{
                      backgroundColor: filterStatus === f.v ? '#44dbf4' : BRAND.bgCard,
                      color: filterStatus === f.v ? '#000' : BRAND.text,
                      border: `1px solid ${filterStatus === f.v ? '#44dbf4' : BRAND.border}`,
                    }}
                  >
                    {f.l}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pq-stagger">
                {filteredAssets.map((a) => {
                  const sb = statusToBadge(a.status);
                  const rb = riskBadge(a.riskLevel);
                  return (
                    <div
                      key={a.id}
                      onClick={() => openDrawer('asset', a.id)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: a.iconColor + '20' }}>
                          <Coins size={20} style={{ color: a.iconColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{a.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: rb.bg, color: rb.fg }}>{rb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{assetTypeLabel(a.assetType)}</span>
                          </div>
                          <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{a.description}</div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
                            <div><span style={{ color: BRAND.textSub }}>发行方:</span> <span style={{ color: BRAND.text }}>{a.issuer}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>主链:</span> <span style={{ color: BRAND.text }}>{a.chain}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>持有人:</span> <span style={{ color: BRAND.text }}>{formatNumber(a.holders)}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>信任分:</span> <span style={{ color: BRAND.primary }}>{a.trustScore.toFixed(1)}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>跨链:</span> <span style={{ color: '#44dbf4' }}>{a.crossChainAnchors}</span></div>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: BRAND.textSub }}>
                            <Hash size={10} />
                            <span className="font-mono">{truncateHash(a.registrationHash)}</span>
                            <CopyIcon size={10} className="cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'proof' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldCheck size={18} style={{ color: BRAND.primary }} />
                  链上证明 · Merkle / SPV / 签名 / 见证
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  支持 4 类证明算法，跨 8 条主流公链，所有证明均带时间戳、区块高度、确认数、最终性状态。
                  平均证明延迟 <strong style={{ color: BRAND.primary }}>{kpi.proofLatencyMs}ms</strong>，在线证明节点 <strong style={{ color: '#44dbf4' }}>{kpi.onlineProvers}</strong>。
                </p>
              </div>

              <div className="space-y-2 pq-stagger">
                {CHAIN_PROOFS.map((p) => {
                  const sb = statusToBadge(p.status);
                  const fb = p.finality === 'finalized'
                    ? { bg: 'rgba(20,184,129,0.12)', fg: BRAND.primary, label: '已最终化' }
                    : p.finality === 'soft'
                    ? { bg: 'rgba(255,180,0,0.12)', fg: '#FFA940', label: '软最终' }
                    : { bg: 'rgba(68,219,244,0.12)', fg: '#44dbf4', label: '待最终化' };
                  return (
                    <div
                      key={p.id}
                      onClick={() => openDrawer('proof', p.id)}
                      className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{p.chainIcon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.assetName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{p.chain}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: fb.bg, color: fb.fg }}>{fb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{proofTypeLabel(p.proofType)}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            <div><span style={{ color: BRAND.textSub }}>区块高度:</span> <span style={{ color: BRAND.text }} className="font-mono">{p.blockHeight.toLocaleString()}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>确认数:</span> <span style={{ color: BRAND.text }} className="font-mono">{p.confirmations.toLocaleString()}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>Gas:</span> <span style={{ color: BRAND.text }} className="font-mono">{p.gasUsed.toLocaleString()}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>延迟:</span> <span style={{ color: BRAND.primary }} className="font-mono">{p.latencyMs}ms</span></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: BRAND.textSub }}>更新</div>
                          <div className="text-xs" style={{ color: BRAND.text }}>{p.lastUpdate}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'cross-chain' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Link2 size={18} style={{ color: BRAND.primary }} />
                  跨链互验 · 资产流转与锚定证据
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  与 <strong style={{ color: BRAND.text }}>P3.30 跨链桥中心</strong>深度联动，支持 <strong style={{ color: BRAND.primary }}>LayerZero / Wormhole / Chainlink CCIP / Arbitrum Canonical</strong> 等主流桥协议。
                  锚定类型覆盖 <strong style={{ color: BRAND.text }}>Light Client / Merkle / Optimistic / ZK</strong> 4 类共识机制。
                </p>
              </div>

              <div className="space-y-2 pq-stagger">
                {CROSS_CHAIN_ANCHORS.map((cc) => {
                  const sb = statusToBadge(cc.status);
                  return (
                    <div
                      key={cc.id}
                      onClick={() => openDrawer('cross-chain', cc.id)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: cc.color + '20' }}>
                          <ArrowLeftRight size={18} style={{ color: cc.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{cc.assetName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{cc.fromChain}</span>
                            <ArrowRight size={10} style={{ color: BRAND.textSub }} />
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{cc.toChain}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{anchorTypeLabel(cc.anchorType)}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            <div><span style={{ color: BRAND.textSub }}>桥:</span> <span style={{ color: BRAND.text }}>{cc.bridge}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>区块:</span> <span style={{ color: BRAND.text }} className="font-mono">{cc.blockHeight.toLocaleString()}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>费用:</span> <span style={{ color: '#FFA940' }} className="font-mono">${cc.fee}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>延迟:</span> <span style={{ color: BRAND.primary }} className="font-mono">{cc.latency}ms</span></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: BRAND.textSub }}>时间</div>
                          <div className="text-[10px]" style={{ color: BRAND.text }}>{cc.timestamp.split(' ')[1]}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <FileCheck size={18} style={{ color: BRAND.primary }} />
                  审计追踪 · 8 家第三方审计机构
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  与 <strong style={{ color: BRAND.text }}>慢雾 / CertiK / PeckShield / 知道创宇 / OpenZeppelin / Trail of Bits / 普华永道</strong> 等 8 家国际国内权威机构合作。
                  覆盖 <strong style={{ color: BRAND.text }}>安全 / 财务 / 合规 / 代码</strong> 4 类审计维度，已完成 <strong style={{ color: BRAND.primary }}>{kpi.auditRecords.toLocaleString()}</strong> 份审计报告。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pq-stagger">
                {AUDIT_RECORDS.map((au) => {
                  const sb = statusToBadge(au.status);
                  return (
                    <div
                      key={au.id}
                      onClick={() => openDrawer('auditor', au.id)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg text-xl font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {au.auditorLogo}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{au.auditor}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{auditTypeLabel(au.auditType)}</span>
                          </div>
                          <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{au.assetName}</div>
                          <div className="text-[10px] mb-2" style={{ color: BRAND.textSub }}>范围: {au.scope}</div>
                          {au.status !== 'in-progress' && (
                            <div className="flex items-center gap-3 text-[10px]">
                              <span><span style={{ color: BRAND.textSub }}>得分:</span> <strong style={{ color: au.score >= 90 ? BRAND.primary : au.score >= 75 ? '#FFA940' : '#F6465D' }}>{au.score}</strong></span>
                              <span><span style={{ color: BRAND.textSub }}>发现:</span> <span style={{ color: BRAND.text }}>{au.findings}</span></span>
                              <span><span style={{ color: BRAND.textSub }}>严重:</span> <span style={{ color: au.critical > 0 ? '#F6465D' : BRAND.primary }}>{au.critical}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'trust' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Network size={18} style={{ color: BRAND.primary }} />
                  信任网络 · 验证节点 / 预言机 / 审计方 / 见证节点 / 跨链桥
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  覆盖 <strong style={{ color: BRAND.text }}>5 类信任节点</strong>，按 <strong style={{ color: BRAND.text }}>信任分 / 在线率 / 见证数 / 质押量</strong> 多维度评估。
                  网络总信任节点 <strong style={{ color: BRAND.primary }}>{kpi.trustNodes.toLocaleString()}</strong>，平均在线率 <strong style={{ color: '#44dbf4' }}>99.6%</strong>。
                </p>
              </div>

              <div className="space-y-2 pq-stagger">
                {TRUST_NODES.map((n) => {
                  const sb = statusToBadge(n.status);
                  return (
                    <div
                      key={n.id}
                      onClick={() => openDrawer('node', n.id)}
                      className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.primaryLt }}>
                          <Server size={16} style={{ color: BRAND.primary }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{n.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{nodeTypeLabel(n.type)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{n.region}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
                            <div><span style={{ color: BRAND.textSub }}>信任分:</span> <strong style={{ color: BRAND.primary }}>{n.trustScore.toFixed(1)}</strong></div>
                            <div><span style={{ color: BRAND.textSub }}>在线率:</span> <span style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</span></div>
                            <div><span style={{ color: BRAND.textSub }}>见证数:</span> <span style={{ color: BRAND.text }}>{formatNumber(n.attestations)}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>质押:</span> <span style={{ color: '#FFA940' }}>{n.stake > 0 ? formatCurrency(n.stake) : '—'}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>活动:</span> <span style={{ color: BRAND.text }}>{n.lastActive}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Scale size={18} style={{ color: BRAND.primary }} />
                  合规存证 · 5 类证据 4 类主体
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  覆盖 <strong style={{ color: BRAND.text }}>KYC 核证 / AML 监控 / 司法存证 / 储备证明 / 税务存证</strong> 5 类证据。
                  涉及 <strong style={{ color: BRAND.text }}>资产 / 用户 / 交易 / 平台</strong> 4 类主体。明确<strong style={{ color: BRAND.primary }}>合规研究方向</strong>，不涉及<strong style={{ color: '#F6465D' }}>承诺收益 / 保本 / 刚兑</strong>等高风险表述。
                </p>
              </div>

              <div className="space-y-2 pq-stagger">
                {COMPLIANCE_EVIDENCE.map((ev) => {
                  const sb = statusToBadge(ev.status);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => openDrawer('evidence', ev.id)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.12)' }}>
                          <ScrollText size={16} style={{ color: '#A855F7' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{ev.subject}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(168,85,247,0.12)', color: '#A855F7' }}>{evidenceTypeLabel(ev.evidenceType)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                          </div>
                          <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>提供方: {ev.provider} · 司法管辖区: {ev.jurisdiction}</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                            <div><span style={{ color: BRAND.textSub }}>存证时长:</span> <span style={{ color: BRAND.text }}>{ev.retention}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>见证数:</span> <span style={{ color: BRAND.primary }}>{ev.attestations}</span></div>
                            <div><span style={{ color: BRAND.textSub }}>时间:</span> <span style={{ color: BRAND.text }}>{ev.timestamp}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'graph' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Workflow size={18} style={{ color: BRAND.primary }} />
                  资产图谱 · 跨链流转关系网络
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  与 <strong style={{ color: BRAND.text }}>P3.32 链上数据分析中心</strong> 联动，可视化资产在多链间的流转关系。
                  支持 <strong style={{ color: BRAND.text }}>交易追踪 / 资金链路 / 跨链路径 / 风险传染</strong> 4 类图谱分析。
                </p>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, minHeight: 480 }}>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatNumber(kpi.registeredAssets)}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>资产节点</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: '#44dbf4' }}>{formatNumber(kpi.crossChainAnchors)}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>跨链边</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: '#A855F7' }}>{kpi.trustNodes.toLocaleString()}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>信任节点</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>热门资产流转路径（点击查看）</div>
                  {[
                    { from: 'Ethereum / ZSUSD', to: 'Polygon / ZSUSD', via: 'LayerZero V2', count: 18420, color: '#0ECB81' },
                    { from: 'Ethereum / ZSX', to: 'BNB Chain / ZSX', via: 'Chainlink CCIP', count: 8420, color: '#14B881' },
                    { from: 'Ethereum / WBTC', to: 'Solana / WBTC', via: 'Wormhole Portal', count: 4280, color: '#F7931A' },
                    { from: 'Polygon / CARBON-X', to: 'Base / CARBON-X', via: 'Chainlink CCIP', count: 1840, color: '#44dbf4' },
                    { from: 'Tron / CNHO', to: 'Ethereum / CNHO', via: 'BitTorrent Bridge', count: 1240, color: '#F6465D' },
                  ].map((path, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg flex items-center gap-3"
                      style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="text-xs flex-1" style={{ color: BRAND.text }}>{path.from}</div>
                      <ArrowRight size={14} style={{ color: path.color }} />
                      <div className="text-xs flex-1" style={{ color: BRAND.text }}>{path.to}</div>
                      <div className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{path.via}</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: path.color }}>{path.count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'integrate' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Plug size={18} style={{ color: BRAND.primary }} />
                  API 接入 · 资产溯源与证明能力开放
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                  提供 <strong style={{ color: BRAND.text }}>REST / WebSocket / gRPC</strong> 3 类接口，覆盖 <strong style={{ color: BRAND.text }}>资产查询 / 证明获取 / 审计订阅 / 信任分计算 / 合规存证</strong> 5 大场景。
                  与 <strong style={{ color: BRAND.text }}>P3.17 API 开放平台</strong> 统一鉴权与计量体系。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: '资产登记查询', desc: 'GET /v1/provenance/assets · 链上资产元数据', icon: Database, color: BRAND.primary, endpoints: 12 },
                  { name: '链上证明获取', desc: 'GET /v1/provenance/proofs · Merkle/SPV/签名 证明', icon: ShieldCheck, color: '#44dbf4', endpoints: 8 },
                  { name: '跨链锚定查询', desc: 'GET /v1/provenance/anchors · 跨链交易锚定证据', icon: Link2, color: '#A855F7', endpoints: 6 },
                  { name: '审计报告订阅', desc: 'GET /v1/provenance/audits · 第三方审计推送', icon: FileCheck, color: '#FFA940', endpoints: 5 },
                  { name: '信任网络查询', desc: 'GET /v1/provenance/nodes · 信任节点 / 见证数 / 信任分', icon: Network, color: '#0ECB81', endpoints: 4 },
                  { name: '合规存证写入', desc: 'POST /v1/provenance/evidences · 链上合规证据', icon: Scale, color: '#EC4899', endpoints: 6 },
                ].map((api) => {
                  const Icon = api.icon;
                  return (
                    <div
                      key={api.name}
                      onClick={() => openDrawer('integrate', api.name)}
                      className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: api.color + '20' }}>
                          <Icon size={20} style={{ color: api.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{api.name}</div>
                          <div className="text-[10px] font-mono mb-1" style={{ color: BRAND.textSub }}>{api.desc}</div>
                          <div className="text-[10px]" style={{ color: api.color }}>{api.endpoints} 个端点</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <HelpCircle size={18} style={{ color: BRAND.primary }} />
                  快捷键与使用帮助
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { k: '/', d: '聚焦搜索框' },
                    { k: 'Esc', d: '关闭抽屉 / 弹窗' },
                    { k: '?', d: '打开 / 关闭本页帮助' },
                    { k: '1-9 / 0', d: '切换 Tab（总览/登记/证明/互验/审计/信任/合规/图谱/接入/帮助）' },
                  ].map((it) => (
                    <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bgCard, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                      <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Info size={16} style={{ color: '#44dbf4' }} />
                  关于本页
                </h3>
                <ul className="text-sm space-y-1.5" style={{ color: BRAND.textSub }}>
                  <li>· 本页为<strong style={{ color: BRAND.text }}>技术研究 + 合规研究方向</strong>演示，所有数据为 mock 占位</li>
                  <li>· 与 P3.30 跨链桥 + P3.32 链上数据 + P3.36 NFT + P3.40 量化 形成全栈可证明闭环</li>
                  <li>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 萨摩亚持牌 / MSA / DSAEX"等高风险词</li>
                  <li>· 所有状态徽章统一使用 STATUS 枚举（OPEN / BETA / SOON / MAINTENANCE / COMING / EMPTY / PRIVATE / HOT）</li>
                  <li>· 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============== Drawers ============== */}

      {/* Asset Drawer */}
      {drawer.open && drawer.type === 'asset' && drawer.payload && (() => {
        const a = ASSET_REGISTRATIONS.find((x) => x.id === drawer.payload);
        if (!a) return null;
        const sb = statusToBadge(a.status);
        const rb = riskBadge(a.riskLevel);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Coins size={16} style={{ color: a.iconColor }} />
                  资产详情 · {a.name}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{a.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: rb.bg, color: rb.fg }}>{rb.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: BRAND.textSub }}>{a.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="总供应量" value={formatNumber(a.totalSupply)} />
                  <Stat label="精度" value={a.decimals} />
                  <Stat label="持有人" value={formatNumber(a.holders)} accent={BRAND.primary} />
                  <Stat label="24h 交易" value={formatNumber(a.txCount24h)} accent="#44dbf4" />
                  <Stat label="信任分" value={a.trustScore.toFixed(1)} accent={BRAND.primary} />
                  <Stat label="审计次数" value={a.auditCount} accent="#FFA940" />
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>链上指纹</div>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>合约地址</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(a.contractAddress)} <CopyIcon size={10} /></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>注册哈希</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(a.registrationHash)} <CopyIcon size={10} /></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>原始交易</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(a.metadata.originalTx)} <CopyIcon size={10} /></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>证据哈希</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(a.metadata.evidenceHash)} <CopyIcon size={10} /></span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                    <strong style={{ color: BRAND.text }}>说明</strong>：以上所有数据为 <strong style={{ color: BRAND.primary }}>mock 演示</strong>，仅作<strong style={{ color: BRAND.text }}>技术研究 + 合规研究方向</strong>展示，不构成任何<strong style={{ color: '#F6465D' }}>承诺收益 / 保本 / 刚兑</strong>等高风险表述。
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>查看链上详情</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Proof Drawer */}
      {drawer.open && drawer.type === 'proof' && drawer.payload && (() => {
        const p = CHAIN_PROOFS.find((x) => x.id === drawer.payload);
        if (!p) return null;
        const sb = statusToBadge(p.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldCheck size={16} style={{ color: BRAND.primary }} />
                  链上证明 · {p.assetName}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-3xl">{p.chainIcon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.chain}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: BRAND.textSub }}>{proofTypeLabel(p.proofType)} · 延迟 {p.latencyMs}ms</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="区块高度" value={p.blockHeight.toLocaleString()} />
                  <Stat label="确认数" value={p.confirmations.toLocaleString()} accent={BRAND.primary} />
                  <Stat label="Gas 消耗" value={p.gasUsed.toLocaleString()} />
                  <Stat label="最终性" value={p.finality === 'finalized' ? '已最终' : p.finality === 'soft' ? '软最终' : '待最终'} accent="#FFA940" />
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>证明数据</div>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>证明哈希</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(p.proofHash)} <CopyIcon size={10} /></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>Merkle 根</span>
                      <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(p.merkleRoot)} <CopyIcon size={10} /></span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: BRAND.textSub }}>最后更新</span>
                      <span style={{ color: BRAND.text }}>{p.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>验证证明</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cross-Chain Drawer */}
      {drawer.open && drawer.type === 'cross-chain' && drawer.payload && (() => {
        const cc = CROSS_CHAIN_ANCHORS.find((x) => x.id === drawer.payload);
        if (!cc) return null;
        const sb = statusToBadge(cc.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Link2 size={16} style={{ color: cc.color }} />
                  跨链锚定 · {cc.assetName}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-center">
                      <div className="text-xs" style={{ color: BRAND.textSub }}>来源</div>
                      <div className="text-sm font-semibold mt-1" style={{ color: BRAND.text }}>{cc.fromChain}</div>
                    </div>
                    <ArrowRight size={18} style={{ color: cc.color }} />
                    <div className="text-center">
                      <div className="text-xs" style={{ color: BRAND.textSub }}>目标</div>
                      <div className="text-sm font-semibold mt-1" style={{ color: BRAND.text }}>{cc.toChain}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="桥协议" value={cc.bridge} />
                  <Stat label="锚定类型" value={anchorTypeLabel(cc.anchorType)} accent="#A855F7" />
                  <Stat label="区块高度" value={cc.blockHeight.toLocaleString()} />
                  <Stat label="费用" value={'$' + cc.fee} accent="#FFA940" />
                  <Stat label="延迟" value={cc.latency + 'ms'} accent={BRAND.primary} />
                  <Stat label="时间" value={cc.timestamp} />
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>交易哈希</div>
                  <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <span className="font-mono text-xs" style={{ color: BRAND.text }}>{truncateHash(cc.txHash, 10, 8)}</span>
                    <CopyIcon size={12} className="cursor-pointer" style={{ color: BRAND.textSub }} />
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: cc.color, color: '#000' }}>查看区块浏览器</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Auditor Drawer */}
      {drawer.open && drawer.type === 'auditor' && drawer.payload && (() => {
        const au = AUDIT_RECORDS.find((x) => x.id === drawer.payload);
        if (!au) return null;
        const sb = statusToBadge(au.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <FileCheck size={16} style={{ color: BRAND.primary }} />
                  审计报告 · {au.auditor}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{au.assetName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{auditTypeLabel(au.auditType)}</span>
                  </div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>范围: {au.scope}</div>
                </div>

                {au.status !== 'in-progress' && (
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="审计得分" value={au.score.toFixed(1)} accent={au.score >= 90 ? BRAND.primary : '#FFA940'} />
                    <Stat label="发现问题" value={au.findings} />
                    <Stat label="严重问题" value={au.critical} accent={au.critical > 0 ? '#F6465D' : BRAND.primary} />
                  </div>
                )}

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>审计时间线</div>
                  <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: BRAND.textSub }}>开始</span>
                      <span style={{ color: BRAND.text }}>{au.startedAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: BRAND.textSub }}>完成</span>
                      <span style={{ color: BRAND.text }}>{au.completedAt || '进行中…'}</span>
                    </div>
                    {au.reportHash && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: BRAND.textSub }}>报告哈希</span>
                        <span className="font-mono flex items-center gap-1" style={{ color: BRAND.text }}>{truncateHash(au.reportHash)} <CopyIcon size={10} /></span>
                      </div>
                    )}
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                  <Download size={14} />下载审计报告
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Trust Node Drawer */}
      {drawer.open && drawer.type === 'node' && drawer.payload && (() => {
        const n = TRUST_NODES.find((x) => x.id === drawer.payload);
        if (!n) return null;
        const sb = statusToBadge(n.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Server size={16} style={{ color: BRAND.primary }} />
                  信任节点 · {n.name}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{n.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{nodeTypeLabel(n.type)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>{n.region}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="信任分" value={n.trustScore.toFixed(1)} accent={BRAND.primary} />
                  <Stat label="在线率" value={n.uptime.toFixed(2) + '%'} accent="#44dbf4" />
                  <Stat label="见证数" value={formatNumber(n.attestations)} />
                  <Stat label="质押量" value={n.stake > 0 ? formatCurrency(n.stake) : '无质押'} accent="#FFA940" />
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>公钥</div>
                  <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <span className="font-mono text-[10px]" style={{ color: BRAND.text }}>{truncateHash(n.publicKey, 12, 8)}</span>
                    <CopyIcon size={12} className="cursor-pointer" style={{ color: BRAND.textSub }} />
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>查看节点详情</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Evidence Drawer */}
      {drawer.open && drawer.type === 'evidence' && drawer.payload && (() => {
        const ev = COMPLIANCE_EVIDENCE.find((x) => x.id === drawer.payload);
        if (!ev) return null;
        const sb = statusToBadge(ev.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Scale size={16} style={{ color: '#A855F7' }} />
                  合规存证 · {evidenceTypeLabel(ev.evidenceType)}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{ev.subject}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>提供方: {ev.provider}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="存证时长" value={ev.retention} />
                  <Stat label="见证数" value={ev.attestations} accent={BRAND.primary} />
                  <Stat label="时间" value={ev.timestamp} />
                  <Stat label="状态" value={sb.label} accent={sb.fg} />
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>司法管辖区</div>
                  <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    {ev.jurisdiction}
                  </div>
                </div>

                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>证据哈希</div>
                  <div className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <span className="font-mono text-[10px]" style={{ color: BRAND.text }}>{truncateHash(ev.hash, 10, 8)}</span>
                    <CopyIcon size={12} className="cursor-pointer" style={{ color: BRAND.textSub }} />
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                    <strong style={{ color: BRAND.text }}>合规说明</strong>：本页所有司法表述均为<strong style={{ color: BRAND.primary }}>合规研究方向</strong>，不涉及<strong style={{ color: '#F6465D' }}>承诺收益 / 保本 / 刚兑 / 萨摩亚持牌 / MSA / DSAEX</strong>等高风险词。
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: '#A855F7', color: '#000' }}>查看完整证据</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Integrate Drawer */}
      {drawer.open && drawer.type === 'integrate' && drawer.payload && (() => {
        const apiName = drawer.payload as string;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Plug size={16} style={{ color: BRAND.primary }} />
                  API 接入 · {apiName}
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>示例请求</div>
                  <pre className="text-[10px] font-mono overflow-x-auto" style={{ color: BRAND.text }}>
{`curl -X GET \\
  'https://api.zsdex.example/v1/provenance/assets/ZSUSD' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
                  </pre>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>示例响应</div>
                  <pre className="text-[10px] font-mono overflow-x-auto" style={{ color: BRAND.text }}>
{`{
  "assetId": "ast-001",
  "name": "ZSUSD 稳定币",
  "symbol": "ZSUSD",
  "status": "verified",
  "trustScore": 96.8,
  "registrationHash": "0x8a3f...",
  "proofs": [...],
  "audits": [...]
}`}
                  </pre>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                  <div className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                    <strong style={{ color: BRAND.text }}>说明</strong>：所有 API 端点为 <strong style={{ color: BRAND.primary }}>mock 演示</strong>，仅作技术接入研究，不承诺商业可用性。
                  </div>
                </div>

                <button onClick={closeDrawer} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>申请接入凭证</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Help Drawer */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto pq-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
              <button onClick={() => setHelpOpen(false)} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { k: '/', d: '聚焦搜索' },
                { k: 'Esc', d: '关闭抽屉 / 弹窗' },
                { k: '?', d: '打开 / 关闭本页帮助' },
                { k: '1-9, 0', d: '切换 Tab（总览/登记/证明/互验/审计/信任/合规/图谱/接入/帮助）' },
              ].map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                  <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============== Bottom CTA ============== */}
      <section className="px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Fingerprint size={18} style={{ color: BRAND.primary }} />
                让每一份数字资产都可被证明
              </h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>链上登记 · 跨链锚定 · 第三方审计 · 合规存证 · API 开放</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setTab('registry')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}><Database size={14} />资产登记</button>
              <button onClick={() => setTab('integrate')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Plug size={14} />API 接入</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
