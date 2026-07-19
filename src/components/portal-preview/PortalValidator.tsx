'use client';

/**
 * PortalValidator - 节点 / 验证人中心 (2026-07-19 Q05 P3.31)
 *
 * 页面定位：
 * - 中萨数字科技交易所 节点 / 验证人中心
 * - 节点列表 / 质押治理 / 节点监控 / 提案投票 / 验证人详情 / 申请加入 / 历史记录
 * - 与 P3.4 现货 + P3.17 API + P3.25 做市 + P3.26 衍生品 + P3.27 量化 +
 *   P3.28 NFT + P3.29 DeFi + P3.30 跨链形成"跨链-节点-验证-治理"基础设施 + 治理闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 节点列表 / 质押治理 / 节点监控 / 提案投票 / 验证人详情 / 申请加入 / 历史记录 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有节点 / 验证人 / 治理 / 质押 / 提案 / 监控数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"节点基础设施与治理研究方向"定性
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
  Server,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Network,
  Activity,
  Activity as ActivityIcon,
  Gauge,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Coins,
  CircleDollarSign,
  Wallet,
  Vote,
  ThumbsUp,
  ThumbsDown,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Copy as CopyIcon,
  ExternalLink,
  FileText,
  Calendar,
  Clock,
  Hash,
  Hash as HashIcon,
  MapPin,
  Globe2,
  Globe,
  Cloud,
  Zap,
  Rocket,
  Flame,
  Settings,
  Sliders,
  SlidersHorizontal,
  SlidersVertical,
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
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Tags,
  Boxes,
  Box,
  Layers,
  Box as BoxIcon,
  GitBranch,
  GitMerge,
  GitFork,
  GitCommit,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  User,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  HandCoins,
  KeyRound,
  Lock,
  Unlock,
  Terminal,
  Code2,
  Hexagon,
  Diamond,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'nodes' | 'staking' | 'monitor' | 'proposal' | 'detail' | 'apply' | 'history' | 'help';
type NodeType = 'validator' | 'rpc' | 'full' | 'archive' | 'indexer' | 'bridge' | 'oracle' | 'sequencer' | 'guardian';
type NodeStatus = 'active' | 'syncing' | 'jailed' | 'slashed' | 'offline' | 'pending' | 'paused';
type NetworkKind = 'mainnet' | 'testnet' | 'devnet';
type Region = '亚太' | '欧洲' | '北美' | '南美' | '中东' | '非洲' | '大洋洲';
type ProposalStatus = 'active' | 'passed' | 'rejected' | 'pending' | 'executed' | 'cancelled';
type ProposalType = 'parameter' | 'upgrade' | 'treasury' | 'validator' | 'token' | 'partnership' | 'emergency';
type StakingAction = 'stake' | 'unstake' | 'delegate' | 'undelegate' | 'claim';
type DrawerType = 'node' | 'proposal' | 'apply' | 'help' | 'stake' | 'governance' | 'monitor' | 'history' | null;
type ApplyType = 'validator' | 'rpc' | 'indexer' | 'guardian' | 'sequencer' | 'oracle' | 'partner';
type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

interface Node {
  id: string;
  moniker: string;
  type: NodeType;
  status: NodeStatus;
  network: NetworkKind;
  region: Region;
  country: string;
  city: string;
  operator: string;
  address: string;
  pubkey: string;
  stake: number;
  selfStake: number;
  delegatedStake: number;
  commission: number;
  uptime: number;
  blocksProduced: number;
  blocksMissed: number;
  lastSeen: string;
  joinedAt: string;
  slashCount: number;
  jailedUntil?: string;
  apy: number;
  delegators: number;
  version: string;
  cpu: string;
  memory: string;
  storage: string;
  bandwidth: string;
  syncProgress: number;
  peerCount: number;
  tier: Tier;
  verified: boolean;
  tags: string[];
  description: string;
  highlights: string[];
  riskNotes: string[];
  features: string[];
  governanceVoting: number;
  totalEarned: number;
  monthlyEarnings: number[];
}

interface Proposal {
  id: string;
  title: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  network: NetworkKind;
  startTime: string;
  endTime: string;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  votesNoWithVeto: number;
  totalVoted: number;
  quorum: number;
  description: string;
  changes: string[];
  impact: string;
  discussions: number;
  tags: string[];
  executed: boolean;
  tier: Tier;
}

interface StakingRecord {
  id: string;
  validator: string;
  validatorId: string;
  action: StakingAction;
  amount: number;
  token: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
  unlockTime?: string;
  reward?: number;
  apy: number;
}

interface GovernanceStat {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  totalVoters: number;
  participationRate: number;
  treasuryValue: number;
  burnRate: number;
  circulatingSupply: number;
  stakedRatio: number;
  inflationRate: number;
}

interface KpiSnapshot {
  totalNodes: number;
  activeNodes: number;
  totalValidators: number;
  activeValidators: number;
  totalStaked: number;
  stakedRatio: number;
  avgUptime: number;
  totalDelegators: number;
  totalEarned: number;
  totalProposals: number;
  activeProposals: number;
  avgApy: number;
  slashCount: number;
  jailedCount: number;
  blockHeight: number;
  avgBlockTime: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 工具 ==============

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  validator: '验证人',
  rpc: 'RPC 节点',
  full: '全节点',
  archive: '归档节点',
  indexer: '索引节点',
  bridge: '跨链守护',
  oracle: '预言机',
  sequencer: '排序器',
  guardian: '守护节点',
};

const STATUS_LABELS: Record<NodeStatus, string> = {
  active: '运行中',
  syncing: '同步中',
  jailed: '已监禁',
  slashed: '已处罚',
  offline: '离线',
  pending: '待启动',
  paused: '已暂停',
};

const REGION_FLAGS: Record<Region, string> = {
  '亚太': '🌏',
  '欧洲': '🌍',
  '北美': '🌎',
  '南美': '🌎',
  '中东': '🌍',
  '非洲': '🌍',
  '大洋洲': '🌏',
};

function formatStake(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function statusBadge(s: NodeStatus): { bg: string; fg: string; border: string; label: string } {
  if (s === 'active') return { bg: 'rgba(20,184,129,0.12)', fg: BRAND.primary, border: BRAND.primary, label: '运行中' };
  if (s === 'syncing') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, border: BRAND.primary, label: '同步中' };
  if (s === 'jailed') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', border: '#FFB400', label: '已监禁' };
  if (s === 'slashed') return { bg: 'rgba(255,80,80,0.10)', fg: '#FF5050', border: '#FF5050', label: '已处罚' };
  if (s === 'offline') return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMuted, border: BRAND.textMuted, label: '离线' };
  if (s === 'pending') return { bg: 'rgba(20,184,129,0.06)', fg: BRAND.primary, border: BRAND.primary, label: '待启动' };
  if (s === 'paused') return { bg: 'rgba(176,176,176,0.06)', fg: BRAND.textMuted, border: BRAND.textMuted, label: '已暂停' };
  return { bg: BRAND.card, fg: BRAND.textMuted, border: BRAND.border, label: s };
}

function proposalBadge(s: ProposalStatus): { bg: string; fg: string; border: string; label: string } {
  if (s === 'active') return { bg: 'rgba(20,184,129,0.12)', fg: BRAND.primary, border: BRAND.primary, label: '投票中' };
  if (s === 'passed') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, border: BRAND.primary, label: '已通过' };
  if (s === 'rejected') return { bg: 'rgba(255,80,80,0.10)', fg: '#FF5050', border: '#FF5050', label: '已拒绝' };
  if (s === 'pending') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', border: '#FFB400', label: '待启动' };
  if (s === 'executed') return { bg: 'rgba(20,184,129,0.08)', fg: BRAND.primary, border: BRAND.primary, label: '已执行' };
  if (s === 'cancelled') return { bg: 'rgba(176,176,176,0.08)', fg: BRAND.textMuted, border: BRAND.textMuted, label: '已取消' };
  return { bg: BRAND.card, fg: BRAND.textMuted, border: BRAND.border, label: s };
}

function tierBadge(t: Tier): { bg: string; fg: string; border: string; label: string } {
  if (t === 'platinum') return { bg: 'rgba(229,228,226,0.10)', fg: '#E5E4E2', border: '#E5E4E2', label: '铂金' };
  if (t === 'gold') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', border: '#FFB400', label: '黄金' };
  if (t === 'silver') return { bg: 'rgba(192,192,192,0.10)', fg: '#C0C0C0', border: '#C0C0C0', label: '白银' };
  if (t === 'bronze') return { bg: 'rgba(205,127,50,0.10)', fg: '#CD7F32', border: '#CD7F32', label: '青铜' };
  return { bg: BRAND.card, fg: BRAND.textMuted, border: BRAND.border, label: t };
}

// ============== Mock 数据 ==============

const NODES: Node[] = [
  {
    id: 'n-001', moniker: 'Cosmos Hub Alpha', type: 'validator', status: 'active', network: 'mainnet', region: '亚太', country: '新加坡', city: 'Singapore',
    operator: 'Cosmostation', address: 'cosmosvaloper1...abc123', pubkey: 'cosmosvalconspub1...xyz789',
    stake: 124000000, selfStake: 24000000, delegatedStake: 100000000, commission: 5, uptime: 99.98,
    blocksProduced: 184280, blocksMissed: 24, lastSeen: '2026-07-19 14:32:18', joinedAt: '2024-03-12',
    slashCount: 0, apy: 18.4, delegators: 8420, version: 'v0.47.4', cpu: '64 Core', memory: '256GB', storage: '8TB NVMe',
    bandwidth: '10 Gbps', syncProgress: 100, peerCount: 84, tier: 'platinum', verified: true,
    tags: ['顶级', '高佣金', '多签', 'Cosmos'],
    description: 'Cosmostation 运营的顶级验证人节点，已稳定运行 800+ 天，零处罚记录。',
    highlights: ['99.98% 在线率', '800+ 天无处罚', '8.4K 委托人', '亚太优先'],
    riskNotes: ['委托集中度风险', '极端行情下出块可能延迟'],
    features: ['多签治理', '实时监控', '自动备份', 'DDoS 防护'],
    governanceVoting: 96, totalEarned: 18400000, monthlyEarnings: [820000, 840000, 860000, 880000, 900000, 920000],
  },
  {
    id: 'n-002', moniker: 'InfStones Global', type: 'validator', status: 'active', network: 'mainnet', region: '欧洲', country: '德国', city: 'Frankfurt',
    operator: 'InfStones', address: 'cosmosvaloper1...def456', pubkey: 'cosmosvalconspub1...abc012',
    stake: 98000000, selfStake: 18000000, delegatedStake: 80000000, commission: 6, uptime: 99.92,
    blocksProduced: 162480, blocksMissed: 38, lastSeen: '2026-07-19 14:32:22', joinedAt: '2024-05-18',
    slashCount: 0, apy: 17.2, delegators: 6840, version: 'v0.47.4', cpu: '48 Core', memory: '192GB', storage: '6TB NVMe',
    bandwidth: '5 Gbps', syncProgress: 100, peerCount: 72, tier: 'platinum', verified: true,
    tags: ['顶级', '欧洲', 'InfStones', '企业级'],
    description: 'InfStones 企业级验证人节点，欧洲法兰克福机房，符合 GDPR 合规要求。',
    highlights: ['99.92% 在线率', 'GDPR 合规', '6.8K 委托人', '企业级 SLA'],
    riskNotes: ['云服务依赖', '跨境网络延迟'],
    features: ['企业 SLA', '7×24 监控', '多区部署', '合规审计'],
    governanceVoting: 92, totalEarned: 14200000, monthlyEarnings: [620000, 640000, 660000, 680000, 700000, 720000],
  },
  {
    id: 'n-003', moniker: 'Figment Networks', type: 'validator', status: 'active', network: 'mainnet', region: '北美', country: '美国', city: 'New York',
    operator: 'Figment', address: 'cosmosvaloper1...ghi789', pubkey: 'cosmosvalconspub1...def345',
    stake: 86000000, selfStake: 14000000, delegatedStake: 72000000, commission: 7, uptime: 99.86,
    blocksProduced: 148200, blocksMissed: 62, lastSeen: '2026-07-19 14:32:08', joinedAt: '2024-04-08',
    slashCount: 0, apy: 16.8, delegators: 5280, version: 'v0.47.4', cpu: '48 Core', memory: '192GB', storage: '4TB NVMe',
    bandwidth: '5 Gbps', syncProgress: 100, peerCount: 64, tier: 'gold', verified: true,
    tags: ['黄金', '北美', 'Figment', '机构'],
    description: 'Figment Networks 北美节点，机构级质押服务，配备 SOC 2 Type II 认证。',
    highlights: ['99.86% 在线率', 'SOC 2 认证', '5.2K 委托人', '机构服务'],
    riskNotes: ['监管政策风险', '机构客户 KYC 复杂'],
    features: ['SOC 2 认证', '机构服务', '保险覆盖', '白标方案'],
    governanceVoting: 88, totalEarned: 12400000, monthlyEarnings: [520000, 540000, 560000, 580000, 600000, 620000],
  },
  {
    id: 'n-004', moniker: 'Sentinel Bridge', type: 'bridge', status: 'active', network: 'mainnet', region: '亚太', country: '韩国', city: 'Seoul',
    operator: 'Sentinel Protocol', address: 'cosmosvaloper1...jkl012', pubkey: 'cosmosvalconspub1...ghi678',
    stake: 64000000, selfStake: 10000000, delegatedStake: 54000000, commission: 8, uptime: 99.94,
    blocksProduced: 124820, blocksMissed: 18, lastSeen: '2026-07-19 14:32:24', joinedAt: '2024-06-22',
    slashCount: 0, apy: 16.2, delegators: 3840, version: 'v0.47.4', cpu: '32 Core', memory: '128GB', storage: '4TB NVMe',
    bandwidth: '3 Gbps', syncProgress: 100, peerCount: 56, tier: 'gold', verified: true,
    tags: ['跨链', '黄金', '韩国', '守护'],
    description: 'Sentinel 跨链守护节点，负责 8 大公链资产跨链验证。',
    highlights: ['99.94% 在线率', '8 大公链守护', '3.8K 委托人', '跨链专项'],
    riskNotes: ['跨链消息依赖', '签名密钥管理'],
    features: ['多签守护', '跨链验证', '冷热分离', 'HSM 集成'],
    governanceVoting: 94, totalEarned: 8400000, monthlyEarnings: [320000, 340000, 360000, 380000, 400000, 420000],
  },
  {
    id: 'n-005', moniker: 'P2P Validator', type: 'validator', status: 'active', network: 'mainnet', region: '欧洲', country: '瑞士', city: 'Zug',
    operator: 'P2P.org', address: 'cosmosvaloper1...mno345', pubkey: 'cosmosvalconspub1...jkl901',
    stake: 58000000, selfStake: 8000000, delegatedStake: 50000000, commission: 5, uptime: 99.90,
    blocksProduced: 112480, blocksMissed: 32, lastSeen: '2026-07-19 14:32:14', joinedAt: '2024-07-15',
    slashCount: 0, apy: 15.8, delegators: 3240, version: 'v0.47.4', cpu: '32 Core', memory: '128GB', storage: '3TB NVMe',
    bandwidth: '2 Gbps', syncProgress: 100, peerCount: 48, tier: 'gold', verified: true,
    tags: ['黄金', '瑞士', 'P2P', '中立'],
    description: 'P2P Validator 瑞士节点，中立司法管辖，配备机构级托管。',
    highlights: ['99.90% 在线率', '瑞士合规', '3.2K 委托人', '中立司法'],
    riskNotes: ['法郎汇率风险', '跨境数据合规'],
    features: ['机构托管', '保险覆盖', '中立司法', 'SOC 2'],
    governanceVoting: 90, totalEarned: 6800000, monthlyEarnings: [240000, 260000, 280000, 300000, 320000, 340000],
  },
  {
    id: 'n-006', moniker: 'ChainLayer RPC', type: 'rpc', status: 'active', network: 'mainnet', region: '北美', country: '美国', city: 'San Francisco',
    operator: 'ChainLayer', address: 'cosmosvaloper1...pqr678', pubkey: 'cosmosvalconspub1...mno234',
    stake: 0, selfStake: 0, delegatedStake: 0, commission: 0, uptime: 99.96,
    blocksProduced: 0, blocksMissed: 0, lastSeen: '2026-07-19 14:32:28', joinedAt: '2024-08-12',
    slashCount: 0, apy: 0, delegators: 0, version: 'v0.47.4', cpu: '32 Core', memory: '64GB', storage: '2TB NVMe',
    bandwidth: '10 Gbps', syncProgress: 100, peerCount: 128, tier: 'gold', verified: true,
    tags: ['RPC', '公共服务', '北美', 'ChainLayer'],
    description: 'ChainLayer 公共服务 RPC 节点，免费提供高可用 JSON-RPC 接口。',
    highlights: ['99.96% 在线率', '10 Gbps 带宽', '128 连接', '公共服务'],
    riskNotes: ['公共服务免费', '突发流量风险'],
    features: ['公共 RPC', 'WebSocket', '归档查询', 'REST API'],
    governanceVoting: 0, totalEarned: 0, monthlyEarnings: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'n-007', moniker: 'BHarvest Staking', type: 'validator', status: 'active', network: 'mainnet', region: '亚太', country: '日本', city: 'Tokyo',
    operator: 'B-Harvest', address: 'cosmosvaloper1...stu901', pubkey: 'cosmosvalconspub1...pqr567',
    stake: 42000000, selfStake: 6000000, delegatedStake: 36000000, commission: 6, uptime: 99.88,
    blocksProduced: 84200, blocksMissed: 28, lastSeen: '2026-07-19 14:32:11', joinedAt: '2024-09-08',
    slashCount: 0, apy: 15.4, delegators: 2480, version: 'v0.47.4', cpu: '24 Core', memory: '96GB', storage: '2TB NVMe',
    bandwidth: '2 Gbps', syncProgress: 100, peerCount: 40, tier: 'silver', verified: true,
    tags: ['白银', '日本', 'B-Harvest', '低佣金'],
    description: 'B-Harvest 日本节点，6% 佣金，提供日文本地化支持。',
    highlights: ['99.88% 在线率', '6% 低佣金', '2.4K 委托人', '日文支持'],
    riskNotes: ['地震等自然灾害', '跨境网络抖动'],
    features: ['低佣金', '日文支持', '多签', '自动升级'],
    governanceVoting: 84, totalEarned: 4800000, monthlyEarnings: [180000, 200000, 220000, 240000, 260000, 280000],
  },
  {
    id: 'n-008', moniker: 'Chorus One', type: 'validator', status: 'active', network: 'mainnet', region: '欧洲', country: '瑞士', city: 'Zug',
    operator: 'Chorus One', address: 'cosmosvaloper1...vwx234', pubkey: 'cosmosvalconspub1...stu890',
    stake: 38000000, selfStake: 5000000, delegatedStake: 33000000, commission: 7, uptime: 99.84,
    blocksProduced: 78200, blocksMissed: 42, lastSeen: '2026-07-19 14:32:06', joinedAt: '2024-10-18',
    slashCount: 0, apy: 14.8, delegators: 2120, version: 'v0.47.4', cpu: '24 Core', memory: '96GB', storage: '2TB NVMe',
    bandwidth: '2 Gbps', syncProgress: 100, peerCount: 36, tier: 'silver', verified: true,
    tags: ['白银', '瑞士', 'Chorus', '机构'],
    description: 'Chorus One 瑞士节点，机构级质押服务，NORDSET 标准。',
    highlights: ['99.84% 在线率', 'NORDSET 合规', '2.1K 委托人', '机构服务'],
    riskNotes: ['监管政策', '跨境合规'],
    features: ['NORDSET 合规', '机构服务', '审计报告', '多签'],
    governanceVoting: 82, totalEarned: 4200000, monthlyEarnings: [160000, 180000, 200000, 220000, 240000, 260000],
  },
  {
    id: 'n-009', moniker: 'StakeLab Indexer', type: 'indexer', status: 'active', network: 'mainnet', region: '北美', country: '加拿大', city: 'Toronto',
    operator: 'StakeLab', address: 'cosmosvaloper1...yza567', pubkey: 'cosmosvalconspub1...vwx123',
    stake: 0, selfStake: 0, delegatedStake: 0, commission: 0, uptime: 99.92,
    blocksProduced: 0, blocksMissed: 0, lastSeen: '2026-07-19 14:32:30', joinedAt: '2024-11-22',
    slashCount: 0, apy: 0, delegators: 0, version: 'v0.47.4', cpu: '16 Core', memory: '64GB', storage: '12TB NVMe',
    bandwidth: '5 Gbps', syncProgress: 100, peerCount: 64, tier: 'silver', verified: true,
    tags: ['索引', '公共服务', '加拿大', 'GraphQL'],
    description: 'StakeLab 索引节点，提供 GraphQL 公共索引和区块浏览器数据。',
    highlights: ['99.92% 在线率', 'GraphQL API', '12TB 存储', '公共服务'],
    riskNotes: ['存储成本', '索引同步延迟'],
    features: ['GraphQL', 'REST API', '区块浏览器', '实时数据'],
    governanceVoting: 0, totalEarned: 0, monthlyEarnings: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'n-010', moniker: 'Forbole Validator', type: 'validator', status: 'syncing', network: 'mainnet', region: '亚太', country: '香港', city: 'Hong Kong',
    operator: 'Forbole', address: 'cosmosvaloper1...bcd890', pubkey: 'cosmosvalconspub1...yza456',
    stake: 28000000, selfStake: 4000000, delegatedStake: 24000000, commission: 8, uptime: 98.20,
    blocksProduced: 48200, blocksMissed: 184, lastSeen: '2026-07-19 14:28:42', joinedAt: '2024-12-08',
    slashCount: 0, apy: 14.2, delegators: 1640, version: 'v0.47.3', cpu: '16 Core', memory: '64GB', storage: '2TB NVMe',
    bandwidth: '1 Gbps', syncProgress: 87, peerCount: 32, tier: 'silver', verified: true,
    tags: ['白银', '香港', 'Forbole', '升级中'],
    description: 'Forbole 香港节点，正在升级到 v0.47.4 版本，目前处于同步状态。',
    highlights: ['87% 同步进度', '升级中', '1.6K 委托人', '香港机房'],
    riskNotes: ['升级期间不参与共识', '同步延迟可能影响奖励'],
    features: ['升级中', '热备份', '多签', '监控告警'],
    governanceVoting: 76, totalEarned: 3200000, monthlyEarnings: [120000, 140000, 160000, 180000, 200000, 220000],
  },
  {
    id: 'n-011', moniker: 'AllNodes Public', type: 'rpc', status: 'active', network: 'mainnet', region: '北美', country: '美国', city: 'Los Angeles',
    operator: 'AllNodes', address: 'cosmosvaloper1...efg123', pubkey: 'cosmosvalconspub1...bcd789',
    stake: 0, selfStake: 0, delegatedStake: 0, commission: 0, uptime: 99.84,
    blocksProduced: 0, blocksMissed: 0, lastSeen: '2026-07-19 14:32:26', joinedAt: '2025-01-12',
    slashCount: 0, apy: 0, delegators: 0, version: 'v0.47.4', cpu: '16 Core', memory: '32GB', storage: '1TB NVMe',
    bandwidth: '5 Gbps', syncProgress: 100, peerCount: 96, tier: 'silver', verified: true,
    tags: ['RPC', '公共服务', '洛杉矶', '免费'],
    description: 'AllNodes 公共服务节点，洛杉矶机房，免费 RPC 服务。',
    highlights: ['99.84% 在线率', '5 Gbps', '96 连接', '公共服务'],
    riskNotes: ['免费服务限制', '突发流量'],
    features: ['公共 RPC', '免费', 'WebSocket', 'REST'],
    governanceVoting: 0, totalEarned: 0, monthlyEarnings: [0, 0, 0, 0, 0, 0],
  },
  {
    id: 'n-012', moniker: '01node Oracle', type: 'oracle', status: 'active', network: 'mainnet', region: '欧洲', country: '德国', city: 'Berlin',
    operator: '01node', address: 'cosmosvaloper1...hij456', pubkey: 'cosmosvalconspub1...efg012',
    stake: 18000000, selfStake: 3000000, delegatedStake: 15000000, commission: 6, uptime: 99.78,
    blocksProduced: 32400, blocksMissed: 86, lastSeen: '2026-07-19 14:32:02', joinedAt: '2025-02-08',
    slashCount: 1, apy: 13.6, delegators: 1240, version: 'v0.47.4', cpu: '16 Core', memory: '64GB', storage: '1TB NVMe',
    bandwidth: '2 Gbps', syncProgress: 100, peerCount: 28, tier: 'bronze', verified: true,
    tags: ['青铜', '预言机', '德国', '01node'],
    description: '01node 预言机节点，提供价格喂价和数据广播服务。',
    highlights: ['99.78% 在线率', '预言机服务', '1.2K 委托人', '1 次历史处罚'],
    riskNotes: ['历史 1 次 Slash 记录', '预言机数据源风险'],
    features: ['价格喂价', '数据广播', '多源验证', 'API'],
    governanceVoting: 72, totalEarned: 2400000, monthlyEarnings: [80000, 100000, 120000, 140000, 160000, 180000],
  },
];

const PROPOSALS: Proposal[] = [
  {
    id: 'p-001', title: '#184 调整验证人最低质押门槛至 8,000 ZSD', type: 'parameter', status: 'active',
    proposer: 'Cosmostation', network: 'mainnet', startTime: '2026-07-15 10:00:00', endTime: '2026-07-22 10:00:00',
    votesYes: 68400000, votesNo: 24000000, votesAbstain: 8000000, votesNoWithVeto: 2000000,
    totalVoted: 102400000, quorum: 80000000, description: '将验证人最低质押门槛从 5,000 ZSD 调整至 8,000 ZSD，提升网络安全性。',
    changes: ['min_self_delegation: 5000 → 8000 ZSD', '生效时间：投票通过后 7 天'],
    impact: '预计影响 12 个小型验证人，需要补充质押或退出',
    discussions: 184, tags: ['参数', '安全', '门槛'], executed: false, tier: 'platinum',
  },
  {
    id: 'p-002', title: '#185 升级到 v0.48.0 启用 EVM 兼容模块', type: 'upgrade', status: 'active',
    proposer: 'ZSDEX Core Team', network: 'mainnet', startTime: '2026-07-12 14:00:00', endTime: '2026-07-19 14:00:00',
    votesYes: 184000000, votesNo: 8000000, votesAbstain: 12000000, votesNoWithVeto: 0,
    totalVoted: 204000000, quorum: 80000000, description: '网络升级到 v0.48.0，启用 EVM 兼容模块，支持智能合约部署。',
    changes: ['启用 ethermint 模块', '链 ID 切换到 zs_9000-1', 'Gas 费机制调整'],
    impact: '需所有验证人升级客户端，错过升级将离线',
    discussions: 428, tags: ['升级', 'EVM', '重大'], executed: false, tier: 'platinum',
  },
  {
    id: 'p-003', title: '#183 资助 8 个生态项目共 240 万 ZSD', type: 'treasury', status: 'passed',
    proposer: 'Treasury Committee', network: 'mainnet', startTime: '2026-07-05 10:00:00', endTime: '2026-07-12 10:00:00',
    votesYes: 142000000, votesNo: 28000000, votesAbstain: 6000000, votesNoWithVeto: 4000000,
    totalVoted: 180000000, quorum: 80000000, description: '从国库拨款 240 万 ZSD 资助 8 个生态项目，包括跨链桥、NFT、DeFi 等。',
    changes: ['转账 2,400,000 ZSD 至生态资助多签账户'],
    impact: '支持 8 个生态项目，预计带动 TVL 增长 8%',
    discussions: 286, tags: ['国库', '资助', '生态'], executed: true, tier: 'gold',
  },
  {
    id: 'p-004', title: '#182 解禁被误 Slash 节点 n-012 的 8 万 ZSD', type: 'validator', status: 'rejected',
    proposer: '01node Team', network: 'mainnet', startTime: '2026-06-28 10:00:00', endTime: '2026-07-05 10:00:00',
    votesYes: 24000000, votesNo: 124000000, votesAbstain: 8000000, votesNoWithVeto: 16000000,
    totalVoted: 172000000, quorum: 80000000, description: '为被误判的预言机节点 01node 返还 8 万 ZSD 质押。',
    changes: ['返还 80,000 ZSD 至 cosmosvaloper1...hij456'],
    impact: '违反 Slash 自动执行原则，被否决',
    discussions: 142, tags: ['验证人', '救济'], executed: false, tier: 'bronze',
  },
  {
    id: 'p-005', title: '#181 与 IP 合作中心建立数字藏品发行通道', type: 'partnership', status: 'executed',
    proposer: 'Business Team', network: 'mainnet', startTime: '2026-06-20 10:00:00', endTime: '2026-06-27 10:00:00',
    votesYes: 188000000, votesNo: 12000000, votesAbstain: 4000000, votesNoWithVeto: 0,
    totalVoted: 204000000, quorum: 80000000, description: '与生态合作中心（参考 P3.24）合作，建立数字藏品发行通道。',
    changes: ['启用数字藏品发行模块', '对接 P3.24 生态合作中心 IP 资源'],
    impact: '推动数字藏品业务发展，形成"发行-市场-生态-IP"闭环',
    discussions: 184, tags: ['合作', '数字藏品', '生态'], executed: true, tier: 'gold',
  },
  {
    id: 'p-006', title: '#180 增加紧急暂停功能（Halt）', type: 'emergency', status: 'executed',
    proposer: 'Security Team', network: 'mainnet', startTime: '2026-06-15 10:00:00', endTime: '2026-06-22 10:00:00',
    votesYes: 198000000, votesNo: 6000000, votesAbstain: 2000000, votesNoWithVeto: 0,
    totalVoted: 206000000, quorum: 80000000, description: '增加紧急暂停功能，2/3 验证人同意可暂停网络应对紧急情况。',
    changes: ['新增 emergency_halt 模块', '阈值：2/3 验证人签名'],
    impact: '提升应急响应能力，与 P3.16 安全中心联动',
    discussions: 248, tags: ['紧急', '安全', '基础设施'], executed: true, tier: 'platinum',
  },
];

const STAKING_RECORDS: StakingRecord[] = [
  { id: 's-001', validator: 'Cosmos Hub Alpha', validatorId: 'n-001', action: 'stake', amount: 10000, token: 'ZSD', time: '2026-07-19 12:18:42', status: 'completed', txHash: '0xabcd1234...ef5678', apy: 18.4, reward: 184 },
  { id: 's-002', validator: 'InfStones Global', validatorId: 'n-002', action: 'delegate', amount: 5000, token: 'ZSD', time: '2026-07-19 10:42:18', status: 'completed', txHash: '0x1234abcd...5678ef', apy: 17.2, reward: 86 },
  { id: 's-003', validator: 'Figment Networks', validatorId: 'n-003', action: 'claim', amount: 240, token: 'ZSD', time: '2026-07-19 08:24:06', status: 'completed', txHash: '0xef5678ab...cd1234', apy: 16.8, reward: 240 },
  { id: 's-004', validator: 'Sentinel Bridge', validatorId: 'n-004', action: 'unstake', amount: 2000, token: 'ZSD', time: '2026-07-18 22:18:32', status: 'pending', txHash: '0x5678efab...cd1234', unlockTime: '2026-07-25 22:18:32', apy: 16.2 },
  { id: 's-005', validator: 'P2P Validator', validatorId: 'n-005', action: 'stake', amount: 8000, token: 'ZSD', time: '2026-07-18 18:42:08', status: 'completed', txHash: '0x9012abcd...3456ef', apy: 15.8, reward: 126 },
  { id: 's-006', validator: 'Cosmos Hub Alpha', validatorId: 'n-001', action: 'undelegate', amount: 4000, token: 'ZSD', time: '2026-07-18 14:24:18', status: 'completed', txHash: '0x3456efab...7890cd', apy: 18.4 },
  { id: 's-007', validator: 'BHarvest Staking', validatorId: 'n-007', action: 'delegate', amount: 3000, token: 'ZSD', time: '2026-07-18 10:18:42', status: 'completed', txHash: '0x7890cdef...1234ab', apy: 15.4, reward: 46 },
  { id: 's-008', validator: 'Chorus One', validatorId: 'n-008', action: 'stake', amount: 12000, token: 'ZSD', time: '2026-07-17 16:42:08', status: 'completed', txHash: '0xcdef1234...5678ab', apy: 14.8, reward: 178 },
  { id: 's-009', validator: 'Forbole Validator', validatorId: 'n-010', action: 'stake', amount: 1500, token: 'ZSD', time: '2026-07-17 12:24:32', status: 'failed', txHash: '0x5678cdef...9012ab', apy: 14.2 },
  { id: 's-010', validator: '01node Oracle', validatorId: 'n-012', action: 'claim', amount: 86, token: 'ZSD', time: '2026-07-17 08:18:42', status: 'completed', txHash: '0x1234cdef...5678ab', apy: 13.6, reward: 86 },
];

// ============== 组件 ==============

export function PortalValidator() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeType | 'all'>('all');
  const [nodeStatusFilter, setNodeStatusFilter] = useState<NodeStatus | 'all'>('all');
  const [nodeNetworkFilter, setNodeNetworkFilter] = useState<NetworkKind | 'all'>('all');
  const [nodeRegionFilter, setNodeRegionFilter] = useState<Region | 'all'>('all');
  const [nodeTierFilter, setNodeTierFilter] = useState<Tier | 'all'>('all');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [proposalTypeFilter, setProposalTypeFilter] = useState<ProposalType | 'all'>('all');
  const [stakingActionFilter, setStakingActionFilter] = useState<StakingAction | 'all'>('all');
  const [sortBy, setSortBy] = useState<'stake' | 'apy' | 'uptime' | 'commission' | 'updated'>('stake');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeValidator, setStakeValidator] = useState('n-001');
  const [voteChoice, setVoteChoice] = useState<'yes' | 'no' | 'abstain' | 'veto' | null>(null);
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('validator');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyHardware, setApplyHardware] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalNodes: 248,
    activeNodes: 224,
    totalValidators: 84,
    activeValidators: 76,
    totalStaked: 824000000,
    stakedRatio: 62.4,
    avgUptime: 99.86,
    totalDelegators: 184000,
    totalEarned: 184000000,
    totalProposals: 184,
    activeProposals: 4,
    avgApy: 15.8,
    slashCount: 8,
    jailedCount: 2,
    blockHeight: 18420000,
    avgBlockTime: 5.6,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        blockHeight: prev.blockHeight + Math.floor(Math.random() * 8 + 2),
        totalStaked: prev.totalStaked + Math.floor(Math.random() * 80000 - 20000),
        totalEarned: prev.totalEarned + Math.floor(Math.random() * 4000 - 1500),
        totalDelegators: prev.totalDelegators + Math.floor(Math.random() * 4 - 1),
        avgBlockTime: 5.6 + (Math.random() - 0.5) * 0.4,
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const filteredNodes = useMemo(() => {
    let result = NODES.filter((n) => {
      if (search) {
        const q = search.toLowerCase();
        if (!n.moniker.toLowerCase().includes(q) && !n.operator.toLowerCase().includes(q) && !n.country.includes(search) && !n.city.includes(search)) {
          return false;
        }
      }
      if (nodeTypeFilter !== 'all' && n.type !== nodeTypeFilter) return false;
      if (nodeStatusFilter !== 'all' && n.status !== nodeStatusFilter) return false;
      if (nodeNetworkFilter !== 'all' && n.network !== nodeNetworkFilter) return false;
      if (nodeRegionFilter !== 'all' && n.region !== nodeRegionFilter) return false;
      if (nodeTierFilter !== 'all' && n.tier !== nodeTierFilter) return false;
      return true;
    });
    result = result.sort((a, b) => {
      let av: number = 0, bv: number = 0;
      if (sortBy === 'stake') { av = a.stake; bv = b.stake; }
      else if (sortBy === 'apy') { av = a.apy; bv = b.apy; }
      else if (sortBy === 'uptime') { av = a.uptime; bv = b.uptime; }
      else if (sortBy === 'commission') { av = a.commission; bv = b.commission; }
      else if (sortBy === 'updated') { av = new Date(a.lastSeen).getTime(); bv = new Date(b.lastSeen).getTime(); }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [search, nodeTypeFilter, nodeStatusFilter, nodeNetworkFilter, nodeRegionFilter, nodeTierFilter, sortBy, sortDir]);

  const filteredProposals = useMemo(() => {
    return PROPOSALS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.proposer.toLowerCase().includes(q)) return false;
      }
      if (proposalStatusFilter !== 'all' && p.status !== proposalStatusFilter) return false;
      if (proposalTypeFilter !== 'all' && p.type !== proposalTypeFilter) return false;
      return true;
    });
  }, [search, proposalStatusFilter, proposalTypeFilter]);

  const filteredStaking = useMemo(() => {
    return STAKING_RECORDS.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.validator.toLowerCase().includes(q) && !s.txHash.toLowerCase().includes(q)) return false;
      }
      if (stakingActionFilter !== 'all' && s.action !== stakingActionFilter) return false;
      return true;
    });
  }, [search, stakingActionFilter]);

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
      else if (e.key === '2') setTab('nodes');
      else if (e.key === '3') setTab('staking');
      else if (e.key === '4') setTab('monitor');
      else if (e.key === '5') setTab('proposal');
      else if (e.key === '6') setTab('detail');
      else if (e.key === '7') setTab('apply');
      else if (e.key === '8') setTab('history');
      else if (e.key === '9') setTab('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  const renderKpi = useCallback((label: string, value: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode) => {
    return (
      <div className="rounded-xl p-4 pv-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
          {icon && <span style={{ color: BRAND.primary }}>{icon}</span>}
        </div>
        <div className="text-2xl font-semibold" style={{ color: BRAND.text }}>{value}</div>
        {sub && <div className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>{sub}</div>}
      </div>
    );
  }, []);

  const submitApply = () => {
    if (applyStep < 3) {
      setApplyStep(applyStep + 1);
    } else {
      alert('申请已提交！我们将在 3 个工作日内审核您的节点运营资质。');
      setApplyStep(0);
      setApplyCompany('');
      setApplyContact('');
      setApplyEmail('');
      setApplyHardware('');
    }
  };

  const submitStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('请输入有效的质押数量');
      return;
    }
    alert(`已提交质押：${stakeAmount} ZSD 至 ${NODES.find(n => n.id === stakeValidator)?.moniker}`);
    setStakeAmount('');
  };

  const submitVote = () => {
    if (!voteChoice) {
      alert('请选择投票选项');
      return;
    }
    const labels = { yes: '赞成', no: '反对', abstain: '弃权', veto: '强烈反对' };
    alert(`已提交投票：${labels[voteChoice]}`);
    setVoteChoice(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pv-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pv-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pv-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pv-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pv-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pv-stagger > * { animation: pv-fade-up 0.4s ease-out both; }
        .pv-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pv-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pv-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pv-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pv-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pv-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pv-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pv-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pv-pulse { animation: pv-pulse 2.4s ease-in-out infinite; }
        .pv-float { animation: pv-float 3s ease-in-out infinite; }
        .pv-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pv-shimmer 2.4s linear infinite; }
        .pv-drawer { animation: pv-slide-in 0.28s ease-out; }
        .pv-bar { transform-origin: bottom; animation: pv-bar 0.6s ease-out; }
        .pv-row:hover { background-color: ${BRAND.cardHover}; }
        .pv-spin { animation: pv-spin 2s linear infinite; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Server size={28} style={{ color: BRAND.primary }} className="pv-float" />
            <h1 className="text-3xl font-bold" style={{ color: BRAND.text }}>节点 / 验证人中心</h1>
            <span className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: 'rgba(20,184,129,0.12)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>P3.31</span>
          </div>
          <p className="text-sm mb-4" style={{ color: BRAND.textMuted, maxWidth: 720 }}>
            中萨数字科技交易所节点 / 验证人中心：节点列表 / 质押治理 / 节点监控 / 提案投票 / 验证人详情 / 申请加入。
            与 P3.4 现货 + P3.17 API + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT + P3.29 DeFi + P3.30 跨链形成
            "跨链-节点-验证-治理"基础设施 + 治理闭环。明确"节点基础设施与治理研究方向"定性，不构成对任何节点运营资质的合规背书。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成对任何节点运营资质的合规背书</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pv-stagger">
          {renderKpi('总节点数', <>{kpi.totalNodes.toLocaleString()}</>, <>活跃 {kpi.activeNodes}</>, <Server size={16} />)}
          {renderKpi('验证人', <>{kpi.totalValidators}</>, <>活跃 {kpi.activeValidators}</>, <ShieldCheck size={16} />)}
          {renderKpi('总质押量', <>{formatCurrency(kpi.totalStaked)}</>, <>占比 {kpi.stakedRatio.toFixed(1)}%</>, <Coins size={16} />)}
          {renderKpi('平均在线率', <>{kpi.avgUptime.toFixed(2)}%</>, <>Top 节点 99.98%</>, <Activity size={16} className="pv-pulse" />)}
          {renderKpi('平均 APY', <>{kpi.avgApy.toFixed(1)}%</>, <>基于过去 30 天</>, <TrendingUp size={16} />)}
          {renderKpi('当前区块', <>{kpi.blockHeight.toLocaleString()}</>, <>{kpi.avgBlockTime.toFixed(1)}s 出块</>, <Hash size={16} className="pv-pulse" />)}
        </div>
      </div>

      {/* Search + Tab */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textMuted }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索节点 / 验证人 / 公司 / 城市…" className="bg-transparent outline-none flex-1 text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} className="p-0.5 rounded" style={{ color: BRAND.textMuted }}><X size={14} /></button>}
            </div>
            <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {[
              { k: 'overview' as Tab, l: '总览' },
              { k: 'nodes' as Tab, l: `节点列表 (${NODES.length})` },
              { k: 'staking' as Tab, l: `质押治理 (${STAKING_RECORDS.length})` },
              { k: 'monitor' as Tab, l: '节点监控' },
              { k: 'proposal' as Tab, l: `提案投票 (${PROPOSALS.length})` },
              { k: 'detail' as Tab, l: '验证人详情' },
              { k: 'apply' as Tab, l: '申请加入' },
              { k: 'history' as Tab, l: '历史记录' },
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
            <div className="space-y-6 pv-stagger">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>网络健康度</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>在线率</span><span style={{ color: BRAND.primary }}>99.86%</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>出块率</span><span style={{ color: BRAND.primary }}>99.94%</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>出块时间</span><span style={{ color: BRAND.primary }}>5.6s</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>活跃验证人</span><span style={{ color: BRAND.primary }}>{kpi.activeValidators} / {kpi.totalValidators}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>被监禁</span><span style={{ color: '#FFB400' }}>{kpi.jailedCount}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: BRAND.textMuted }}>累计处罚</span><span style={{ color: '#FF5050' }}>{kpi.slashCount}</span></div>
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>生态分布</h3>
                  <div className="space-y-2">
                    {(['亚太', '欧洲', '北美', '中东', '南美', '非洲'] as Region[]).map((r) => {
                      const count = NODES.filter(n => n.region === r).length;
                      return (
                        <div key={r} className="flex items-center gap-2">
                          <span className="text-base">{REGION_FLAGS[r]}</span>
                          <span className="text-sm flex-1" style={{ color: BRAND.text }}>{r}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full pv-bar" style={{ width: `${(count / NODES.length) * 100}%`, backgroundColor: BRAND.primary }} />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: BRAND.textMuted }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>类型分布</h3>
                  <div className="space-y-2">
                    {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => {
                      const count = NODES.filter(n => n.type === t).length;
                      return (
                        <div key={t} className="flex items-center gap-2">
                          <span className="text-sm flex-1" style={{ color: BRAND.text }}>{NODE_TYPE_LABELS[t]}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full pv-bar" style={{ width: `${(count / NODES.length) * 100}%`, backgroundColor: BRAND.primary }} />
                          </div>
                          <span className="text-xs w-6 text-right" style={{ color: BRAND.textMuted }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>Top 节点</h3>
                  <button onClick={() => setTab('nodes')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {NODES.slice(0, 4).map((n) => {
                    const sb = statusBadge(n.status);
                    return (
                      <div key={n.id} className="p-3 rounded-lg pv-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('node', n.id)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: BRAND.text }}>{n.moniker}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.border}40` }}>{sb.label}</span>
                          </div>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{NODE_TYPE_LABELS[n.type]}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div><span style={{ color: BRAND.textMuted }}>质押</span> <span style={{ color: BRAND.text }}>{formatStake(n.stake)}</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>APY</span> <span style={{ color: BRAND.primary }}>{n.apy.toFixed(1)}%</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>佣金</span> <span style={{ color: BRAND.text }}>{n.commission}%</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>在线</span> <span style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>委托人</span> <span style={{ color: BRAND.text }}>{n.delegators.toLocaleString()}</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>{REGION_FLAGS[n.region]} {n.country}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>治理动态</h3>
                <div className="space-y-2">
                  {PROPOSALS.slice(0, 4).map((p) => {
                    const pb = proposalBadge(p.status);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg pv-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('proposal', p.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: BRAND.text }}>{p.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: pb.bg, color: pb.fg, border: `1px solid ${pb.border}40` }}>{pb.label}</span>
                          </div>
                          <div className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>提案人：{p.proposer} · 截止：{p.endTime}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium" style={{ color: BRAND.primary }}>{((p.votesYes / Math.max(p.totalVoted, 1)) * 100).toFixed(1)}%</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>赞成率</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'nodes' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                  <select value={nodeTypeFilter} onChange={(e) => setNodeTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>)}
                  </select>
                  <select value={nodeStatusFilter} onChange={(e) => setNodeStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    {(Object.keys(STATUS_LABELS) as NodeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <select value={nodeNetworkFilter} onChange={(e) => setNodeNetworkFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部网络</option>
                    <option value="mainnet">主网</option><option value="testnet">测试网</option><option value="devnet">开发网</option>
                  </select>
                  <select value={nodeRegionFilter} onChange={(e) => setNodeRegionFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部地区</option>
                    {(Object.keys(REGION_FLAGS) as Region[]).map((r) => <option key={r} value={r}>{REGION_FLAGS[r]} {r}</option>)}
                  </select>
                  <select value={nodeTierFilter} onChange={(e) => setNodeTierFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部等级</option>
                    <option value="platinum">铂金</option><option value="gold">黄金</option><option value="silver">白银</option><option value="bronze">青铜</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="stake">排序：质押量</option>
                    <option value="apy">排序：APY</option>
                    <option value="uptime">排序：在线率</option>
                    <option value="commission">排序：佣金</option>
                    <option value="updated">排序：最近活动</option>
                  </select>
                  <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-2 py-1.5 rounded text-xs flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {sortDir === 'asc' ? '升序' : '降序'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                        <th className="text-left px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>节点</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>类型</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>状态</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>质押</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>APY</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>佣金</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>在线率</th>
                        <th className="text-left px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>地区</th>
                        <th className="text-center px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNodes.map((n) => {
                        const sb = statusBadge(n.status);
                        return (
                          <tr key={n.id} className="pv-row" style={{ borderBottom: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('node', n.id)}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {n.verified && <ShieldCheck size={12} style={{ color: BRAND.primary }} />}
                                <span className="font-medium text-sm" style={{ color: BRAND.text }}>{n.moniker}</span>
                              </div>
                              <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{n.operator}</div>
                            </td>
                            <td className="px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>{NODE_TYPE_LABELS[n.type]}</td>
                            <td className="px-3 py-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.border}40` }}>{sb.label}</span>
                            </td>
                            <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.text }}>{formatStake(n.stake)}</td>
                            <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.primary }}>{n.apy.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.text }}>{n.commission}%</td>
                            <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</td>
                            <td className="px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>{REGION_FLAGS[n.region]} {n.country}</td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={(e) => { e.stopPropagation(); openDrawer('stake', n.id); }} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primary, color: '#000' }}>质押</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'staking' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: BRAND.text }}>快速质押</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>选择验证人</label>
                    <select value={stakeValidator} onChange={(e) => setStakeValidator(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      {NODES.filter(n => n.type === 'validator' && n.status === 'active').map((n) => (
                        <option key={n.id} value={n.id}>{n.moniker} (APY {n.apy.toFixed(1)}% · 佣金 {n.commission}%)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>质押数量 (ZSD)</label>
                    <input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="例：10000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={submitStake} className="w-full py-2 rounded text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即质押</button>
                  </div>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>· 质押前请评估验证人历史表现、佣金率、APY 等因素；本平台不构成对任何节点运营资质的合规背书</div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-medium" style={{ color: BRAND.text }}>质押记录</span>
                  <select value={stakingActionFilter} onChange={(e) => setStakingActionFilter(e.target.value as any)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部操作</option>
                    <option value="stake">质押</option>
                    <option value="unstake">解质押</option>
                    <option value="delegate">委托</option>
                    <option value="undelegate">取消委托</option>
                    <option value="claim">领取奖励</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {filteredStaking.map((s) => {
                    const actionLabels = { stake: '质押', unstake: '解质押', delegate: '委托', undelegate: '取消委托', claim: '领奖' };
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg pv-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: BRAND.text }}>{actionLabels[s.action]}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.status === 'completed' ? 'rgba(20,184,129,0.10)' : s.status === 'pending' ? 'rgba(255,180,0,0.10)' : 'rgba(255,80,80,0.10)', color: s.status === 'completed' ? BRAND.primary : s.status === 'pending' ? '#FFB400' : '#FF5050' }}>{s.status === 'completed' ? '已完成' : s.status === 'pending' ? '待确认' : '失败'}</span>
                          </div>
                          <div className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>{s.validator} · {s.time} · APY {s.apy.toFixed(1)}%</div>
                          <div className="text-[10px] mt-0.5 font-mono" style={{ color: BRAND.textMuted }}>{s.txHash}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold" style={{ color: BRAND.text }}>{s.amount.toLocaleString()} {s.token}</div>
                          {s.reward && <div className="text-[10px]" style={{ color: BRAND.primary }}>+{s.reward} 奖励</div>}
                          {s.unlockTime && <div className="text-[10px]" style={{ color: '#FFB400' }}>{s.unlockTime} 解锁</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'monitor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { l: '活跃节点', v: kpi.activeNodes, s: '总节点 ' + kpi.totalNodes, c: BRAND.primary },
                  { l: '活跃验证人', v: kpi.activeValidators, s: '占比 ' + ((kpi.activeValidators / kpi.totalValidators) * 100).toFixed(1) + '%', c: BRAND.primary },
                  { l: '被监禁', v: kpi.jailedCount, s: '需关注', c: '#FFB400' },
                  { l: '累计处罚', v: kpi.slashCount, s: '历史总数', c: '#FF5050' },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-4 pv-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>{m.l}</div>
                    <div className="text-2xl font-semibold" style={{ color: m.c }}>{m.v}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{m.s}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>节点实时状态</h3>
                <div className="space-y-2">
                  {NODES.slice(0, 8).map((n) => {
                    const sb = statusBadge(n.status);
                    return (
                      <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sb.fg }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: BRAND.text }}>{n.moniker}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.border}40` }}>{sb.label}</span>
                          </div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{n.country} · {n.city} · v{n.version}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: BRAND.text }}>区块 {n.blocksProduced.toLocaleString()}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>错过 {n.blocksMissed}</div>
                        </div>
                        <div className="w-24">
                          <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>同步 {n.syncProgress}%</div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                            <div className="h-full pv-bar" style={{ width: `${n.syncProgress}%`, backgroundColor: BRAND.primary }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'proposal' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={proposalStatusFilter} onChange={(e) => setProposalStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    <option value="active">投票中</option><option value="passed">已通过</option><option value="rejected">已拒绝</option><option value="executed">已执行</option>
                  </select>
                  <select value={proposalTypeFilter} onChange={(e) => setProposalTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="parameter">参数变更</option><option value="upgrade">网络升级</option><option value="treasury">国库拨款</option><option value="validator">验证人</option><option value="partnership">生态合作</option><option value="emergency">紧急</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>投票参与</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {[
                    { v: 'yes', l: '赞成', c: BRAND.primary, icon: <ThumbsUp size={14} /> },
                    { v: 'no', l: '反对', c: '#FF5050', icon: <ThumbsDown size={14} /> },
                    { v: 'abstain', l: '弃权', c: BRAND.textMuted, icon: <Minus size={14} /> },
                    { v: 'veto', l: '强烈反对', c: '#FF5050', icon: <XCircle size={14} /> },
                  ].map((c) => (
                    <button key={c.v} onClick={() => setVoteChoice(c.v as any)} className="p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: voteChoice === c.v ? c.c : BRAND.bg, color: voteChoice === c.v ? '#000' : c.c, border: `1px solid ${voteChoice === c.v ? c.c : BRAND.border}` }}>
                      {c.icon} {c.l}
                    </button>
                  ))}
                </div>
                <button onClick={submitVote} className="w-full py-2 rounded text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交投票</button>
                <div className="text-[10px] mt-2" style={{ color: BRAND.textMuted }}>· 投票结果将根据质押权重计算；本平台不构成对任何治理决策的合规背书</div>
              </div>

              <div className="space-y-2">
                {filteredProposals.map((p) => {
                  const pb = proposalBadge(p.status);
                  return (
                    <div key={p.id} className="rounded-xl p-4 pv-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('proposal', p.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: pb.bg, color: pb.fg, border: `1px solid ${pb.border}40` }}>{pb.label}</span>
                        </div>
                        <span className="text-[10px]" style={{ color: BRAND.textMuted }}>截止：{p.endTime}</span>
                      </div>
                      <div className="text-[11px] mb-2" style={{ color: BRAND.textMuted }}>提案人：{p.proposer}</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l: '赞成', v: p.votesYes, c: BRAND.primary },
                          { l: '反对', v: p.votesNo, c: '#FF5050' },
                          { l: '弃权', v: p.votesAbstain, c: BRAND.textMuted },
                          { l: '强烈反对', v: p.votesNoWithVeto, c: '#FF5050' },
                        ].map((v, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-[10px] mb-1"><span style={{ color: BRAND.textMuted }}>{v.l}</span><span style={{ color: v.c }}>{((v.v / Math.max(p.totalVoted, 1)) * 100).toFixed(1)}%</span></div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                              <div className="h-full pv-bar" style={{ width: `${(v.v / Math.max(p.totalVoted, 1)) * 100}%`, backgroundColor: v.c }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'detail' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>选择验证人查看详情</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {NODES.filter(n => n.type === 'validator').map((n) => {
                  const tb = tierBadge(n.tier);
                  const sb = statusBadge(n.status);
                  return (
                    <div key={n.id} className="p-4 rounded-lg pv-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('node', n.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {n.verified && <ShieldCheck size={14} style={{ color: BRAND.primary }} />}
                          <span className="font-medium text-sm" style={{ color: BRAND.text }}>{n.moniker}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tb.bg, color: tb.fg, border: `1px solid ${tb.border}40` }}>{tb.label}</span>
                      </div>
                      <div className="text-[10px] mb-3" style={{ color: BRAND.textMuted }}>{n.operator} · {REGION_FLAGS[n.region]} {n.country}</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span style={{ color: BRAND.textMuted }}>质押</span> <span style={{ color: BRAND.text }}>{formatStake(n.stake)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>APY</span> <span style={{ color: BRAND.primary }}>{n.apy.toFixed(1)}%</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>佣金</span> <span style={{ color: BRAND.text }}>{n.commission}%</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>在线</span> <span style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>委托人</span> <span style={{ color: BRAND.text }}>{n.delegators.toLocaleString()}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>状态</span> <span style={{ color: sb.fg }}>{sb.label}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-4" style={{ color: BRAND.text }}>成为节点 / 验证人</h3>
                <div className="flex items-center gap-2 mb-4">
                  {['选择类型', '基本信息', '技术配置', '确认提交'].map((s, i) => (
                    <div key={i} className="flex-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: i <= applyStep ? BRAND.primary : BRAND.bg, color: i <= applyStep ? '#000' : BRAND.textMuted, border: `1px solid ${i <= applyStep ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                      <span className="text-[10px]" style={{ color: i <= applyStep ? BRAND.text : BRAND.textMuted }}>{s}</span>
                      {i < 3 && <div className="flex-1 h-px" style={{ backgroundColor: i < applyStep ? BRAND.primary : BRAND.border }} />}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {applyStep === 0 && (
                    <div className="space-y-2">
                      <div className="text-xs mb-1" style={{ color: BRAND.textMuted }}>选择申请类型</div>
                      {[
                        { v: 'validator', l: '验证人节点', d: '参与共识、获得出块奖励' },
                        { v: 'rpc', l: 'RPC 节点', d: '提供公共 API 服务' },
                        { v: 'indexer', l: '索引节点', d: '提供 GraphQL 索引' },
                        { v: 'guardian', l: '跨链守护', d: '跨链消息验证' },
                        { v: 'sequencer', l: '排序器', d: 'L2 交易排序' },
                        { v: 'oracle', l: '预言机', d: '提供链下数据' },
                        { v: 'partner', l: '区域代理', d: '区域生态合作' },
                      ].map((t) => (
                        <button key={t.v} onClick={() => setApplyType(t.v as ApplyType)} className="w-full p-3 rounded-lg text-left" style={{ backgroundColor: applyType === t.v ? 'rgba(20,184,129,0.08)' : BRAND.bg, border: `1px solid ${applyType === t.v ? BRAND.primary : BRAND.border}` }}>
                          <div className="text-sm font-medium" style={{ color: applyType === t.v ? BRAND.primary : BRAND.text }}>{t.l}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{t.d}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {applyStep === 1 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs" style={{ color: BRAND.textMuted }}>公司/团队名称</label>
                        <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="请输入公司或团队全称" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                      <div>
                        <label className="text-xs" style={{ color: BRAND.textMuted }}>联系人姓名</label>
                        <input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} placeholder="请输入联系人姓名" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                      <div>
                        <label className="text-xs" style={{ color: BRAND.textMuted }}>联系邮箱</label>
                        <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} placeholder="example@domain.com" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                      <div>
                        <label className="text-xs" style={{ color: BRAND.textMuted }}>运营地区</label>
                        <select value={applyRegion} onChange={(e) => setApplyRegion(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                          <option>亚太</option><option>欧洲</option><option>北美</option><option>中东</option><option>南美</option><option>非洲</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {applyStep === 2 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs" style={{ color: BRAND.textMuted }}>硬件配置（CPU/内存/存储/带宽）</label>
                        <input value={applyHardware} onChange={(e) => setApplyHardware(e.target.value)} placeholder="例：32 Core / 128GB / 2TB NVMe / 1 Gbps" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>建议最低配置：</div>
                        <div className="text-[11px] space-y-0.5" style={{ color: BRAND.text }}>
                          <div>· CPU：16 Core 以上</div>
                          <div>· 内存：32GB 以上</div>
                          <div>· 存储：1TB NVMe SSD</div>
                          <div>· 带宽：1 Gbps 独享</div>
                          <div>· 在线率：99.5% 以上</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {applyStep === 3 && (
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <CheckCircle2 size={48} style={{ color: BRAND.primary, margin: '0 auto' }} className="pv-float" />
                      <h4 className="text-base font-semibold mt-3" style={{ color: BRAND.text }}>确认提交</h4>
                      <p className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>请确认以下申请信息无误</p>
                      <div className="mt-4 text-left space-y-1 text-[11px]">
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>类型：</span><span style={{ color: BRAND.text }}>{applyType}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>公司：</span><span style={{ color: BRAND.text }}>{applyCompany || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>联系人：</span><span style={{ color: BRAND.text }}>{applyContact || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>邮箱：</span><span style={{ color: BRAND.text }}>{applyEmail || '-'}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>地区：</span><span style={{ color: BRAND.text }}>{applyRegion}</span></div>
                        <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>硬件：</span><span style={{ color: BRAND.text }}>{applyHardware || '-'}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {applyStep > 0 && (
                      <button onClick={() => setApplyStep(applyStep - 1)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>
                    )}
                    <button onClick={submitApply} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>{applyStep < 3 ? '下一步' : '提交申请'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {STAKING_RECORDS.map((s) => {
                const actionLabels = { stake: '质押', unstake: '解质押', delegate: '委托', undelegate: '取消委托', claim: '领奖' };
                return (
                  <div key={s.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: BRAND.text }}>{actionLabels[s.action]} - {s.validator}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.status === 'completed' ? 'rgba(20,184,129,0.10)' : s.status === 'pending' ? 'rgba(255,180,0,0.10)' : 'rgba(255,80,80,0.10)', color: s.status === 'completed' ? BRAND.primary : s.status === 'pending' ? '#FFB400' : '#FF5050' }}>{s.status === 'completed' ? '已完成' : s.status === 'pending' ? '待确认' : '失败'}</span>
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{s.time} · APY {s.apy.toFixed(1)}%</div>
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: BRAND.textMuted }}>{s.txHash}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold" style={{ color: BRAND.text }}>{s.amount.toLocaleString()} {s.token}</div>
                        {s.reward && <div className="text-[10px]" style={{ color: BRAND.primary }}>+{s.reward} 奖励</div>}
                        {s.unlockTime && <div className="text-[10px]" style={{ color: '#FFB400' }}>{s.unlockTime} 解锁</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>节点 / 验证人说明</h3>
              <div className="space-y-3 text-sm" style={{ color: BRAND.textMuted }}>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>什么是验证人？</div>
                  <p>验证人（Validator）是区块链网络中负责打包交易、出块并维护网络安全的关键节点。验证人需要质押一定数量的代币作为保证金，作恶时会被 Slash。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>质押 / 委托</div>
                  <p>用户可以将 ZSD 代币质押或委托给验证人，获得出块奖励分成。委托不影响代币所有权，验证人无权动用委托资金。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>Slash 机制</div>
                  <p>如果验证人双签、长时间离线或作恶，系统将自动 Slash 部分质押金作为惩罚，严重的会被永久监禁。</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>治理投票</div>
                  <p>所有质押者都可以参与链上治理投票，投票权重与质押量成正比。提案类型包括参数变更、网络升级、国库拨款、紧急暂停等。</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(20,184,129,0.08)', border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>合规说明</div>
                  <p className="text-[11px]">本平台节点 / 验证人中心为"节点基础设施与治理研究方向"演示页面，所有数据均为 mock 占位。本平台不构成对任何节点运营资质的合规背书。严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险表述。具体节点运营涉及所在司法管辖区的合规要求，请咨询专业法律意见。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'node' && (() => {
        const n = NODES.find(x => x.id === drawer.payload);
        if (!n) return null;
        const sb = statusBadge(n.status);
        const tb = tierBadge(n.tier);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pv-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2">
                  <Server size={18} style={{ color: BRAND.primary }} />
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{n.moniker}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.border}40` }}>{sb.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tb.bg, color: tb.fg, border: `1px solid ${tb.border}40` }}>{tb.label}</span>
                </div>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: BRAND.textMuted }}>{n.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>运营方</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{n.operator}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>类型</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{NODE_TYPE_LABELS[n.type]}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>位置</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{REGION_FLAGS[n.region]} {n.country} · {n.city}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>版本</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{n.version}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总质押</div>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{formatStake(n.stake)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>自我 {formatStake(n.selfStake)} · 委托 {formatStake(n.delegatedStake)}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>APY</div>
                    <div className="text-lg font-semibold" style={{ color: BRAND.primary }}>{n.apy.toFixed(1)}%</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>佣金 {n.commission}%</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>在线率</div>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>出块 {n.blocksProduced.toLocaleString()}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>硬件配置</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span style={{ color: BRAND.textMuted }}>CPU：</span><span style={{ color: BRAND.text }}>{n.cpu}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>内存：</span><span style={{ color: BRAND.text }}>{n.memory}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>存储：</span><span style={{ color: BRAND.text }}>{n.storage}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>带宽：</span><span style={{ color: BRAND.text }}>{n.bandwidth}</span></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>地址信息</div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>Operator</span><span style={{ color: BRAND.text }} className="truncate ml-2">{n.address}</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textMuted }}>PubKey</span><span style={{ color: BRAND.text }} className="truncate ml-2">{n.pubkey}</span></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>亮点 / 风险</div>
                  <div className="space-y-1 text-[11px]">
                    {n.highlights.map((h, i) => <div key={i} style={{ color: BRAND.primary }}>✓ {h}</div>)}
                    {n.riskNotes.map((r, i) => <div key={i} style={{ color: '#FFB400' }}>⚠ {r}</div>)}
                  </div>
                </div>
                <button onClick={() => { closeDrawer(); setStakeValidator(n.id); openDrawer('stake', n.id); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即质押</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'proposal' && (() => {
        const p = PROPOSALS.find(x => x.id === drawer.payload);
        if (!p) return null;
        const pb = proposalBadge(p.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pv-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>提案详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-semibold" style={{ color: BRAND.text }}>{p.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: pb.bg, color: pb.fg, border: `1px solid ${pb.border}40` }}>{pb.label}</span>
                  </div>
                  <p className="text-sm" style={{ color: BRAND.textMuted }}>{p.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>提案人</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{p.proposer}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>类型</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{p.type}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>开始</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{p.startTime}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMuted }}>截止</div>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{p.endTime}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>投票结果</div>
                  <div className="space-y-2">
                    {[
                      { l: '赞成', v: p.votesYes, c: BRAND.primary },
                      { l: '反对', v: p.votesNo, c: '#FF5050' },
                      { l: '弃权', v: p.votesAbstain, c: BRAND.textMuted },
                      { l: '强烈反对', v: p.votesNoWithVeto, c: '#FF5050' },
                    ].map((v, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1"><span style={{ color: BRAND.text }}>{v.l}</span><span style={{ color: v.c }}>{((v.v / Math.max(p.totalVoted, 1)) * 100).toFixed(2)}% · {formatStake(v.v)}</span></div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pv-bar" style={{ width: `${(v.v / Math.max(p.totalVoted, 1)) * 100}%`, backgroundColor: v.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>变更内容</div>
                  <div className="space-y-1 text-[11px]">
                    {p.changes.map((c, i) => <div key={i} style={{ color: BRAND.text }}>· {c}</div>)}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>影响分析</div>
                  <p className="text-[11px]" style={{ color: BRAND.text }}>{p.impact}</p>
                </div>
                {p.status === 'active' && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: 'yes', l: '赞成', c: BRAND.primary, icon: <ThumbsUp size={12} /> },
                      { v: 'no', l: '反对', c: '#FF5050', icon: <ThumbsDown size={12} /> },
                      { v: 'abstain', l: '弃权', c: BRAND.textMuted, icon: <Minus size={12} /> },
                      { v: 'veto', l: '强烈反对', c: '#FF5050', icon: <XCircle size={12} /> },
                    ].map((c) => (
                      <button key={c.v} onClick={() => { alert(`已提交投票：${c.l}`); closeDrawer(); }} className="py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: c.c, color: '#000' }}>
                        {c.icon} {c.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'stake' && (() => {
        const n = NODES.find(x => x.id === drawer.payload);
        if (!n) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto pv-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>质押到 {n.moniker}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>验证人</div>
                  <div className="text-sm font-medium" style={{ color: BRAND.text }}>{n.moniker}</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                    <div><span style={{ color: BRAND.textMuted }}>APY</span> <span style={{ color: BRAND.primary }}>{n.apy.toFixed(1)}%</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>佣金</span> <span style={{ color: BRAND.text }}>{n.commission}%</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>在线</span> <span style={{ color: BRAND.text }}>{n.uptime.toFixed(2)}%</span></div>
                  </div>
                </div>
                <div>
                  <label className="text-xs" style={{ color: BRAND.textMuted }}>质押数量 (ZSD)</label>
                  <input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="例：10000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: 'rgba(20,184,129,0.08)', border: `1px solid ${BRAND.primary}40` }}>
                  <div className="font-medium mb-1" style={{ color: BRAND.primary }}>预计年化收益</div>
                  {stakeAmount ? `${(parseFloat(stakeAmount) * n.apy / 100).toFixed(2)} ZSD / 年` : '请输入质押数量'}
                  <div className="mt-1 text-[10px]" style={{ color: BRAND.textMuted }}>注：实际收益受区块奖励、Slash 等因素影响，本平台不构成收益承诺</div>
                </div>
                <button onClick={() => { submitStake(); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即质押</button>
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
      <div className="w-full max-w-md h-full overflow-y-auto pv-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
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
