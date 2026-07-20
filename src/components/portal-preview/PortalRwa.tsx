'use client';

/**
 * PortalRwa - RWA 现实世界资产中心 (2026-07-20 Q05 P3.44)
 *
 * 页面定位：
 * - 中萨数字科技交易所 RWA 现实世界资产中心
 * - 链下资产上链 / 资产代币化 / 收益凭证 / 链上确权 / 跨链流通 / 链上溯源
 * - 资产项目 / 发行方 / 托管 / 合规 / 生命周期 / 收益 / 评估 / 二级流动 / 风险 / API
 * - 与 P3.41 链上资产溯源 + P3.42 跨链互操作 + P3.43 流动性再质押
 *   形成"链下资产→上链→再质押→跨链流通→收益"全栈能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 资产项目 / 发行方 / 托管 / 合规 / 生命周期 / 收益 / 评估 / 二级流动 / 风险 / API / 帮助
 * - 10+ 区块、9+ 交互、12+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有 RWA 资产 / 发行方 / 托管 / 评估 / 收益数据使用 mock 占位
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
  ArrowUpDown,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ExternalLink,
  Link2,
  Link,
  Unlink,
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp as TrendingUpIcon,
  Users,
  User,
  UserCheck,
  Building,
  Building2,
  Landmark,
  Vault,
  Briefcase,
  FileText,
  FileCheck,
  FilePlus,
  FileMinus,
  Hash,
  Tag,
  Tags,
  Calendar,
  Clock,
  Timer,
  Hourglass,
  Sparkles,
  Star,
  Heart,
  Zap,
  Flame,
  Rocket,
  Compass,
  Map,
  MapPin,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  MoreHorizontal,
  MoreVertical,
  Menu,
  HelpCircle,
  Book,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Award,
  Target,
  Crosshair,
  Gauge,
  Compass as CompassIcon,
  Package,
  PackageOpen,
  Truck,
  Ship,
  Plane,
  Send,
  Wallet,
  CreditCard,
  Receipt,
  Calculator,
  Scale,
  Umbrella,
  Home,
  Trees,
  Mountain,
  Gem,
  Coins as CoinsIcon,
  PiggyBank,
  Handshake,
  Gavel,
  Stamp,
  Scroll,
  Mail,
  Bell,
  BellRing,
  Webhook,
  Code,
  Terminal,
  Network,
  Cloud,
  CloudOff,
  Cpu,
  Workflow,
  GitBranch,
  GitCommit,
  GitMerge,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Edit,
  Trash2,
  Save,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send as SendIcon,
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  ListFilter,
  ListTree,
  History,
  RotateCcw,
  RotateCw,
  Repeat,
  Shuffle,
  Cross,
  CheckCircle2,
  TrendingUp as TrendingUpAlt,
  ArrowDownUp,
  Percent,
  Sigma,
  FunctionSquare,
  Droplet,
  Droplets,
  Flame as FlameIcon,
} from 'lucide-react';
import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

type Tab = 'overview' | 'assets' | 'issuer' | 'custody' | 'compliance' | 'lifecycle' | 'yield' | 'oracle' | 'liquidity' | 'risk' | 'integrate' | 'help';
type DrawerType = 'asset' | 'issuer' | 'custody' | 'compliance' | 'lifecycle' | 'yield' | 'oracle' | 'liquidity' | 'risk' | 'integrate' | null;
type SortBy = 'tvl' | 'apy' | 'mcap' | 'change' | 'risk' | 'updated';
type AssetCategory = 'real-estate' | 'treasury' | 'carbon' | 'precious-metal' | 'art' | 'intellectual-property' | 'private-equity' | 'invoice' | 'commodity' | 'infrastructure';
type AssetStatus = 'live' | 'pending' | 'matured' | 'redeemed' | 'paused' | 'compliance-review';

interface RwaAsset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  chain: string;
  jurisdiction: string;
  iconColor: string;
  iconBg: string;
  price: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  tvl: number;
  underlyingValue: number;
  nav: number;
  premium: number;
  annualYield: number;
  distributionFrequency: string;
  lockupDays: number;
  minimumInvestment: number;
  issuer: string;
  custodian: string;
  auditor: string;
  legalOpinion: string;
  complianceFramework: string[];
  riskScore: number;
  riskRating: string;
  status: AssetStatus;
  inceptionDate: string;
  maturityDate: string;
  lastValuation: string;
  nextValuation: string;
  features: string[];
  description: string;
  holders: number;
  dailyVolume: number;
  change24h: number;
  change7d: number;
  change30d: number;
  contracts: { token: string; vault: string; registrar: string; oracle: string };
  attributes: { key: string; value: string }[];
  redemptions: { period: string; minAmount: number; feeBps: number }[];
}


interface Issuer {
  id: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  type: string;
  aum: number;
  assetCount: number;
  establishedYear: number;
  logoColor: string;
  description: string;
  licenses: string[];
  riskRating: string;
  parentCompany: string;
  spvStructure: string;
  contactEmail: string;
  website: string;
  status: 'active' | 'paused' | 'under-review' | 'retired';
  totalIssued: number;
  totalRedeemed: number;
  averageYield: number;
  defaultRate: number;
  reputation: number;
  features: string[];
  partnerships: string[];
  iconBg: string;
}

interface Custodian {
  id: string;
  name: string;
  shortName: string;
  jurisdiction: string;
  type: 'qualified-custodian' | 'bank' | 'trustee' | 'spv-trustee' | 'insurance';
  aum: number;
  assetsUnderCustody: number;
  insuranceCoverage: number;
  establishedYear: number;
  description: string;
  certifications: string[];
  auditFirm: string;
  status: 'active' | 'pending' | 'suspended';
  clients: number;
  reputation: number;
  features: string[];
  iconBg: string;
  iconColor: string;
}

interface ComplianceFramework {
  id: string;
  name: string;
  region: string;
  regulator: string;
  type: 'exemption' | 'registration' | 'license' | 'sandbox' | 'observation';
  description: string;
  investorTypes: string[];
  minimumInvestment: number;
  lockupPeriod: string;
  transferability: string;
  reportingFrequency: string;
  taxTreatment: string;
  riskDisclosure: string;
  status: 'active' | 'pending' | 'monitoring' | 'restricted';
  framework: string;
  documents: string[];
  iconBg: string;
}

interface LifecycleEvent {
  id: string;
  assetId: string;
  assetSymbol: string;
  type: 'mint' | 'transfer' | 'redeem' | 'coupon' | 'maturity' | 'burn' | 'lock' | 'unlock' | 'valuation' | 'audit';
  amount: number;
  fromAddress: string;
  toAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'finalized' | 'reverted';
  description: string;
  gasUsed: number;
  feesUsd: number;
  operator: string;
  riskFlag: 'low' | 'medium' | 'high';
  iconBg: string;
}

interface YieldRecord {
  id: string;
  assetId: string;
  assetSymbol: string;
  type: 'coupon' | 'dividend' | 'rental' | 'royalty' | 'appreciation' | 'distribution';
  period: string;
  amountPerUnit: number;
  totalAmount: number;
  currency: string;
  yieldRate: number;
  paymentDate: string;
  recordDate: string;
  exDividendDate: string;
  recipients: number;
  status: 'scheduled' | 'declared' | 'distributed' | 'reinvested' | 'pending';
  taxWithholding: number;
  reinvestmentOption: boolean;
  distributionChannel: string;
  historicalYield: number;
  projectedYield: number;
  iconBg: string;
  description: string;
}

interface OracleValuation {
  id: string;
  assetId: string;
  assetSymbol: string;
  valuationFirm: string;
  valuationDate: string;
  nextValuationDate: string;
  valuationMethod: 'dcf' | 'comparable' | 'cost' | 'market' | 'hybrid';
  navPerUnit: number;
  previousNav: number;
  changePct: number;
  confidence: number;
  sampleSize: number;
  deviation: number;
  status: 'current' | 'stale' | 'pending' | 'disputed';
  methodology: string;
  assumptions: string[];
  riskFactors: string[];
  iconBg: string;
  reportHash: string;
  auditTrail: string[];
}

interface LiquidityPool {
  id: string;
  assetSymbol: string;
  assetName: string;
  dex: string;
  chain: string;
  pair: string;
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  apr: number;
  apy: number;
  utilization: number;
  liquidityDepth: number;
  spread: number;
  orders24h: number;
  uniqueTraders: number;
  priceImpact1k: number;
  priceImpact10k: number;
  priceImpact100k: number;
  feeTier: number;
  iconColor: string;
  iconBg: string;
  status: 'active' | 'warming' | 'frozen' | 'migrating';
  lastUpdate: string;
  bridgedChains: string[];
  features: string[];
}

interface RiskEvent {
  id: string;
  assetId: string;
  assetSymbol: string;
  type: 'default' | 'litigation' | 'regulatory' | 'custodian-risk' | 'concentration' | 'liquidity' | 'market' | 'fx' | 'operational' | 'cyber';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'monitoring' | 'mitigating' | 'resolved' | 'closed';
  detectedAt: string;
  resolvedAt: string;
  impactUsd: number;
  impactPct: number;
  affectedHolders: number;
  description: string;
  mitigationSteps: string[];
  reportingChannel: string;
  insuranceClaim: boolean;
  resolutionDays: number;
  iconBg: string;
  relatedEvents: string[];
}

interface IntegrationEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';
  path: string;
  description: string;
  rateLimit: string;
  authType: 'api-key' | 'oauth' | 'jwt' | 'signature' | 'public';
  requiredScopes: string[];
  responseFormat: 'json' | 'csv' | 'stream';
  webhookSupported: boolean;
  sdkAvailable: string[];
  sandboxUrl: string;
  productionUrl: string;
  documentation: string;
  version: string;
  deprecationDate: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  responseExample: string;
  category: 'asset' | 'issuer' | 'custody' | 'lifecycle' | 'yield' | 'oracle' | 'compliance';
  iconBg: string;
  status: 'stable' | 'beta' | 'deprecated' | 'new';
}


// ============================================================
// 常量配置
// ============================================================

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  'real-estate': '不动产',
  'treasury': '国债/债券',
  'carbon': '碳信用',
  'precious-metal': '贵金属',
  'art': '艺术品',
  'intellectual-property': '知识产权',
  'private-equity': '私募股权',
  'invoice': '应收账款',
  'commodity': '大宗商品',
  'infrastructure': '基础设施',
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'real-estate': '#FFA940',
  'treasury': '#0ECB81',
  'carbon': '#44DBF4',
  'precious-metal': '#FFB946',
  'art': '#B370FF',
  'intellectual-property': '#5DC8FF',
  'private-equity': '#FF7A6B',
  'invoice': '#FFA940',
  'commodity': '#FFC542',
  'infrastructure': '#3DDC97',
};

const ASSET_STATUS_BADGE: Record<AssetStatus, { label: string; color: string; bg: string }> = {
  'live': { label: '运行中', color: BRAND.success, bg: BRAND.successLt },
  'pending': { label: '待发行', color: BRAND.amber, bg: BRAND.amberLt },
  'matured': { label: '已到期', color: BRAND.info, bg: BRAND.infoLt },
  'redeemed': { label: '已赎回', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
  'paused': { label: '已暂停', color: BRAND.danger, bg: BRAND.dangerLt },
  'compliance-review': { label: '合规审查', color: BRAND.warning, bg: BRAND.warningLt },
};

const RISK_RATING_COLORS: Record<string, string> = {
  'AAA': BRAND.success,
  'AA': BRAND.success,
  'A': '#0ECB81',
  'BBB': BRAND.amber,
  'BB': BRAND.warning,
  'B': BRAND.danger,
  'CCC': BRAND.danger,
  'D': BRAND.danger,
};

const SEVERITY_COLORS: Record<string, string> = {
  'low': BRAND.success,
  'medium': BRAND.amber,
  'high': BRAND.danger,
  'critical': BRAND.danger,
};

const LIFECYCLE_TYPE_LABELS: Record<string, string> = {
  'mint': '铸造',
  'transfer': '转账',
  'redeem': '赎回',
  'coupon': '票息',
  'maturity': '到期',
  'burn': '销毁',
  'lock': '锁定',
  'unlock': '解锁',
  'valuation': '估值',
  'audit': '审计',
};

const LIFECYCLE_TYPE_COLORS: Record<string, string> = {
  'mint': BRAND.success,
  'transfer': BRAND.info,
  'redeem': BRAND.warning,
  'coupon': BRAND.primary,
  'maturity': BRAND.amber,
  'burn': BRAND.danger,
  'lock': BRAND.textSub,
  'unlock': '#0ECB81',
  'valuation': '#44DBF4',
  'audit': '#B370FF',
};

const YIELD_TYPE_LABELS: Record<string, string> = {
  'coupon': '票息',
  'dividend': '分红',
  'rental': '租金',
  'royalty': '版税',
  'appreciation': '增值',
  'distribution': '分配',
};

// ============================================================
// 工具函数
// ============================================================

function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)} M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)} K`;
  return `$${n.toFixed(2)}`;
}

function formatPct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

function formatInt(n: number): string {
  return n.toLocaleString();
}

function formatTimeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒前`;
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`;
  return `${Math.floor(sec / 86400)} 天前`;
}

function formatTime(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分 ${(seconds % 60).toFixed(0)} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分`;
}

function truncateHash(hash: string, len = 8): string {
  if (!hash) return '';
  if (hash.length <= len * 2 + 3) return hash;
  return `${hash.slice(0, len)}…${hash.slice(-len)}`;
}

function riskColor(score: number): string {
  if (score < 20) return BRAND.success;
  if (score < 40) return '#0ECB81';
  if (score < 60) return BRAND.amber;
  if (score < 80) return BRAND.warning;
  return BRAND.danger;
}


// ============================================================
// Mock 数据：RWA 资产项目（15 个）
// ============================================================

const RWA_ASSETS: RwaAsset[] = [
  {
    id: 'rwa-001',
    symbol: 'ZSTB-01',
    name: '数字国债凭证 01',
    category: 'treasury',
    chain: 'ZSDEX Chain',
    jurisdiction: '新加坡（合规研究方向示例）',
    iconColor: '#0ECB81',
    iconBg: 'rgba(14,203,129,0.12)',
    price: 102.42,
    marketCap: 184200000,
    totalSupply: 1800000,
    circulatingSupply: 1620000,
    tvl: 184200000,
    underlyingValue: 184420000,
    nav: 102.46,
    premium: -0.04,
    annualYield: 4.85,
    distributionFrequency: '季度',
    lockupDays: 90,
    minimumInvestment: 1000,
    issuer: 'ZS-Capital 资管（示例）',
    custodian: 'ZSCustody 信托（示例）',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-001',
    complianceFramework: ['MAS-Sandbox', 'Reg-S', 'IMDA-Pilot'],
    riskScore: 18,
    riskRating: 'AAA',
    status: 'live',
    inceptionDate: '2024-09-15',
    maturityDate: '2029-09-15',
    lastValuation: '2026-07-18',
    nextValuation: '2026-07-25',
    features: ['链上确权', '季度票息', '可转让', '链上溯源', '可赎回'],
    description: '由示例 SPV 发行的代币化国债凭证，标的为多币种主权债组合，提供季度票息分配与到期赎回机制。',
    holders: 8420,
    dailyVolume: 1240000,
    change24h: 0.12,
    change7d: 0.42,
    change30d: 0.84,
    contracts: { token: '0xA1b2...c3d4', vault: '0xB2c3...d4e5', registrar: '0xC3d4...e5f6', oracle: '0xD4e5...f6a7' },
    attributes: [
      { key: '票面利率', value: '4.85% p.a.' },
      { key: '付息频率', value: '季度' },
      { key: '久期', value: '3.2 年' },
      { key: '评级', value: 'AAA (示例)' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 1000, feeBps: 50 },
      { period: '锁定期后', minAmount: 100, feeBps: 10 },
    ],
  },
  {
    id: 'rwa-002',
    symbol: 'ZSRE-NA1',
    name: '北亚不动产组合 A',
    category: 'real-estate',
    chain: 'Ethereum',
    jurisdiction: '香港（合规研究方向示例）',
    iconColor: '#FFA940',
    iconBg: 'rgba(255,169,64,0.12)',
    price: 98.34,
    marketCap: 246000000,
    totalSupply: 2500000,
    circulatingSupply: 2240000,
    tvl: 246000000,
    underlyingValue: 248200000,
    nav: 99.28,
    premium: -0.95,
    annualYield: 6.42,
    distributionFrequency: '月',
    lockupDays: 180,
    minimumInvestment: 5000,
    issuer: 'ZS-RE Holdings',
    custodian: 'FiduciaBank-Asia',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-002',
    complianceFramework: ['SFC-Professional', 'Reg-S', 'SFC-Type-9'],
    riskScore: 42,
    riskRating: 'BBB',
    status: 'live',
    inceptionDate: '2024-06-01',
    maturityDate: '2031-06-01',
    lastValuation: '2026-07-15',
    nextValuation: '2026-10-15',
    features: ['租金分配', '资产升值', '季度评估', '可转让', '可赎回'],
    description: '持有北亚一线城市核心地段商业地产组合，通过 SPV 结构代币化，提供租金分配与资产升值收益。',
    holders: 6240,
    dailyVolume: 842000,
    change24h: -0.18,
    change7d: 0.84,
    change30d: 1.42,
    contracts: { token: '0xE5f6...a7b8', vault: '0xF6a7...b8c9', registrar: '0xA7b8...c9d0', oracle: '0xB8c9...d0e1' },
    attributes: [
      { key: '底层物业', value: '商业综合体 ×4' },
      { key: '出租率', value: '94.2%' },
      { key: '平均剩余租期', value: '5.8 年' },
      { key: '地理分布', value: '香港 / 新加坡 / 东京' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 5000, feeBps: 100 },
      { period: '锁定期后', minAmount: 1000, feeBps: 25 },
    ],
  },
  {
    id: 'rwa-003',
    symbol: 'ZSCN-VCS',
    name: 'VCS 碳信用凭证',
    category: 'carbon',
    chain: 'Polygon',
    jurisdiction: '国际自愿市场',
    iconColor: '#44DBF4',
    iconBg: 'rgba(68,219,244,0.12)',
    price: 24.84,
    marketCap: 38420000,
    totalSupply: 1600000,
    circulatingSupply: 1542000,
    tvl: 38420000,
    underlyingValue: 38940000,
    nav: 25.04,
    premium: -0.80,
    annualYield: 0,
    distributionFrequency: '无',
    lockupDays: 0,
    minimumInvestment: 100,
    issuer: 'ZS-Carbon Markets',
    custodian: 'Verra-Registry',
    auditor: 'ClimateAudit-Firm',
    legalOpinion: 'LegalOp-003',
    complianceFramework: ['Verra-VCS', 'Gold-Standard', 'IC-VCM'],
    riskScore: 38,
    riskRating: 'A',
    status: 'live',
    inceptionDate: '2025-02-20',
    maturityDate: '永久',
    lastValuation: '2026-07-19',
    nextValuation: '2026-07-20',
    features: ['链上溯源', '防双花', '可转让', '可核销', '即时交付'],
    description: '基于 Verra VCS 标准的自愿碳信用凭证，1:1 锚定链下已核证碳信用单位，支持即时交付与核销。',
    holders: 12420,
    dailyVolume: 1840000,
    change24h: 2.42,
    change7d: 8.42,
    change30d: 18.42,
    contracts: { token: '0xC9d0...e1f2', vault: '0xD0e1...f2a3', registrar: '0xE1f2...a3b4', oracle: '0xF2a3...b4c5' },
    attributes: [
      { key: '项目类型', value: '森林保护 / 再生能源' },
      { key: '地理分布', value: '拉美 / 东南亚 / 非洲' },
      { key: 'Vintage', value: '2020-2025' },
      { key: '已核证', value: '100%' },
    ],
    redemptions: [
      { period: '核销', minAmount: 1, feeBps: 30 },
      { period: '二级转让', minAmount: 1, feeBps: 10 },
    ],
  },
  {
    id: 'rwa-004',
    symbol: 'ZSAU-100',
    name: '黄金代币 100g',
    category: 'precious-metal',
    chain: 'Ethereum',
    jurisdiction: '瑞士（合规研究方向示例）',
    iconColor: '#FFB946',
    iconBg: 'rgba(255,185,70,0.12)',
    price: 6842.40,
    marketCap: 124200000,
    totalSupply: 18200,
    circulatingSupply: 16800,
    tvl: 124200000,
    underlyingValue: 124540000,
    nav: 6847.20,
    premium: -0.07,
    annualYield: 0,
    distributionFrequency: '无',
    lockupDays: 0,
    minimumInvestment: 100,
    issuer: 'ZS-Bullion AG',
    custodian: 'SwissVault-AG',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-004',
    complianceFramework: ['LBMA-Good-Delivery', 'FINMA-Sandbox', 'LBMA-Responsible'],
    riskScore: 22,
    riskRating: 'AA',
    status: 'live',
    inceptionDate: '2023-11-08',
    maturityDate: '永久',
    lastValuation: '2026-07-20 04:00',
    nextValuation: '2026-07-21 04:00',
    features: ['实物锚定', '可赎回实物', '可转让', '链上溯源', 'LBMA 认证'],
    description: '由瑞士 LBMA 认证金条 1:1 锚定的代币化黄金凭证，支持实物赎回与即时二级转让。',
    holders: 18420,
    dailyVolume: 3840000,
    change24h: 0.42,
    change7d: 1.18,
    change30d: 2.84,
    contracts: { token: '0xA3b4...c5d6', vault: '0xB4c5...d6e7', registrar: '0xC5d6...e7f8', oracle: '0xD6e7...f8a9' },
    attributes: [
      { key: '金条规格', value: '1 kg / 100 oz LBMA' },
      { key: '纯度', value: '999.9 ‰' },
      { key: '保险', value: 'Lloyd\'s 全额覆盖' },
      { key: '审计', value: '季度独立盘点' },
    ],
    redemptions: [
      { period: '链上转让', minAmount: 0.001, feeBps: 5 },
      { period: '实物赎回', minAmount: 1000, feeBps: 50 },
    ],
  },


  {
    id: 'rwa-005',
    symbol: 'ZSART-001',
    name: '蓝筹艺术品基金',
    category: 'art',
    chain: 'Ethereum',
    jurisdiction: '新加坡（合规研究方向示例）',
    iconColor: '#B370FF',
    iconBg: 'rgba(179,112,255,0.12)',
    price: 142.84,
    marketCap: 18420000,
    totalSupply: 128000,
    circulatingSupply: 124200,
    tvl: 18420000,
    underlyingValue: 18640000,
    nav: 144.18,
    premium: -0.93,
    annualYield: 0,
    distributionFrequency: '无',
    lockupDays: 365,
    minimumInvestment: 10000,
    issuer: 'ZS-Art Capital',
    custodian: 'FreePort-Asia',
    auditor: 'MidTier-Audit',
    legalOpinion: 'LegalOp-005',
    complianceFramework: ['MAS-Art-Sandbox', 'AML-Enhanced', 'KYC-Strict'],
    riskScore: 64,
    riskRating: 'BB',
    status: 'live',
    inceptionDate: '2025-04-12',
    maturityDate: '2030-04-12',
    lastValuation: '2026-07-12',
    nextValuation: '2026-10-12',
    features: ['蓝筹标的', '锁仓期', '艺术品保险', '可转让', '可赎回'],
    description: '持有 5 件蓝筹当代艺术作品的份额代币，提供艺术品保险与年度估值更新。',
    holders: 1240,
    dailyVolume: 84000,
    change24h: 0.08,
    change7d: 0.42,
    change30d: 1.84,
    contracts: { token: '0xE7f8...a9b0', vault: '0xF8a9...b0c1', registrar: '0xA9b0...c1d2', oracle: '0xB0c1...d2e3' },
    attributes: [
      { key: '标的数量', value: '5 件蓝筹作品' },
      { key: '估值机构', value: '苏富比 / 佳士得' },
      { key: '保险', value: 'AIG 全额' },
      { key: '仓储', value: '新加坡自由港' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 10000, feeBps: 200 },
      { period: '锁定期后', minAmount: 1000, feeBps: 50 },
    ],
  },
  {
    id: 'rwa-006',
    symbol: 'ZSIP-MUSIC',
    name: '音乐版税收益基金',
    category: 'intellectual-property',
    chain: 'Polygon',
    jurisdiction: '美国（合规研究方向示例）',
    iconColor: '#5DC8FF',
    iconBg: 'rgba(93,200,255,0.12)',
    price: 12.42,
    marketCap: 8420000,
    totalSupply: 680000,
    circulatingSupply: 642000,
    tvl: 8420000,
    underlyingValue: 8520000,
    nav: 12.52,
    premium: -0.80,
    annualYield: 8.42,
    distributionFrequency: '季度',
    lockupDays: 180,
    minimumInvestment: 500,
    issuer: 'ZS-IP Capital',
    custodian: 'IP-Trust-Services',
    auditor: 'MidTier-Audit',
    legalOpinion: 'LegalOp-006',
    complianceFramework: ['Reg-D-506c', 'Reg-S', 'KYC-Strict'],
    riskScore: 58,
    riskRating: 'B',
    status: 'live',
    inceptionDate: '2025-09-01',
    maturityDate: '2035-09-01',
    lastValuation: '2026-07-10',
    nextValuation: '2026-10-10',
    features: ['版税分配', '多元化曲库', '可转让', '季度分配', '可赎回'],
    description: '由 1200+ 首流行歌曲版税组合代币化，提供季度版税分配与曲库升值收益。',
    holders: 2840,
    dailyVolume: 124000,
    change24h: 0.18,
    change7d: 0.84,
    change30d: 1.42,
    contracts: { token: '0xC1d2...e3f4', vault: '0xD2e3...f4a5', registrar: '0xE3f4...a5b6', oracle: '0xF4a5...b6c7' },
    attributes: [
      { key: '曲库规模', value: '1200+ 首' },
      { key: '平均播放量', value: '180 万/月' },
      { key: '版权期', value: '至 2090' },
      { key: '代理', value: 'ASCAP / BMI' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 500, feeBps: 80 },
      { period: '锁定期后', minAmount: 100, feeBps: 20 },
    ],
  },
  {
    id: 'rwa-007',
    symbol: 'ZSPE-FUND1',
    name: '科技私募股权基金 I',
    category: 'private-equity',
    chain: 'Arbitrum',
    jurisdiction: '开曼（合规研究方向示例）',
    iconColor: '#FF7A6B',
    iconBg: 'rgba(255,122,107,0.12)',
    price: 184.20,
    marketCap: 64200000,
    totalSupply: 348000,
    circulatingSupply: 312000,
    tvl: 64200000,
    underlyingValue: 65840000,
    nav: 188.42,
    premium: -2.24,
    annualYield: 0,
    distributionFrequency: '退出时',
    lockupDays: 730,
    minimumInvestment: 50000,
    issuer: 'ZS-PE Partners',
    custodian: 'Cayman-SPV-Trustee',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-007',
    complianceFramework: ['Reg-D-506b', 'Reg-S', 'QFIA-Struct'],
    riskScore: 72,
    riskRating: 'CCC',
    status: 'live',
    inceptionDate: '2025-01-15',
    maturityDate: '2032-01-15',
    lastValuation: '2026-06-30',
    nextValuation: '2026-12-31',
    features: ['高门槛', '长期锁仓', '退出分配', '可转让', 'GP 跟投'],
    description: '聚焦早期科技公司的私募股权基金代币，2 年锁仓期，退出时按比例分配。',
    holders: 480,
    dailyVolume: 0,
    change24h: 0,
    change7d: 0,
    change30d: 0,
    contracts: { token: '0xA5b6...c7d8', vault: '0xB6c7...d8e9', registrar: '0xC7d8...e9f0', oracle: '0xD8e9...f0a1' },
    attributes: [
      { key: '投资策略', value: '早期科技 / AI / Web3' },
      { key: '管理费', value: '2% / 年' },
      { key: '业绩报酬', value: '20%' },
      { key: '基金规模', value: 'USD 64.2 M' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 0, feeBps: 500 },
      { period: '锁定期后', minAmount: 50000, feeBps: 200 },
    ],
  },
  {
    id: 'rwa-008',
    symbol: 'ZSINV-SME',
    name: '中小企应收账款池',
    category: 'invoice',
    chain: 'Base',
    jurisdiction: '香港（合规研究方向示例）',
    iconColor: '#FFA940',
    iconBg: 'rgba(255,169,64,0.12)',
    price: 101.84,
    marketCap: 24800000,
    totalSupply: 244000,
    circulatingSupply: 242000,
    tvl: 24800000,
    underlyingValue: 24842000,
    nav: 101.84,
    premium: 0.00,
    annualYield: 7.84,
    distributionFrequency: '月',
    lockupDays: 30,
    minimumInvestment: 1000,
    issuer: 'ZS-Factoring Ltd',
    custodian: 'FiduciaBank-Asia',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-008',
    complianceFramework: ['SFC-Type-1', 'Reg-S', 'KYC-Standard'],
    riskScore: 48,
    riskRating: 'BB',
    status: 'live',
    inceptionDate: '2025-06-10',
    maturityDate: '2027-06-10',
    lastValuation: '2026-07-18',
    nextValuation: '2026-07-25',
    features: ['短期票据', '月付息', '可转让', '保理 SPV', '可赎回'],
    description: '由 240 张中小企应收账款组成的代币化保理池，月度票息分配，30 天平均到期。',
    holders: 1840,
    dailyVolume: 184000,
    change24h: 0.02,
    change7d: 0.08,
    change30d: 0.18,
    contracts: { token: '0xE9f0...a1b2', vault: '0xF0a1...b2c3', registrar: '0xA1b2...c3d4', oracle: '0xB2c3...d4e5' },
    attributes: [
      { key: '票据数量', value: '240 张' },
      { key: '平均到期', value: '30 天' },
      { key: '承兑人评级', value: 'A- 及以上' },
      { key: '行业分布', value: '制造 / 物流 / 服务' },
    ],
    redemptions: [
      { period: '自然到期', minAmount: 1000, feeBps: 0 },
      { period: '二级转让', minAmount: 100, feeBps: 10 },
    ],
  },


  {
    id: 'rwa-009',
    symbol: 'ZSCOM-OIL',
    name: '原油仓储凭证',
    category: 'commodity',
    chain: 'Ethereum',
    jurisdiction: '阿联酋（合规研究方向示例）',
    iconColor: '#FFC542',
    iconBg: 'rgba(255,197,66,0.12)',
    price: 84.20,
    marketCap: 38420000,
    totalSupply: 456000,
    circulatingSupply: 432000,
    tvl: 38420000,
    underlyingValue: 38620000,
    nav: 84.42,
    premium: -0.26,
    annualYield: 5.42,
    distributionFrequency: '季度',
    lockupDays: 60,
    minimumInvestment: 1000,
    issuer: 'ZS-Commodity DMCC',
    custodian: 'ADX-Vault-DMCC',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-009',
    complianceFramework: ['DMCC-Approved', 'VARA-Observe', 'ISO-9001'],
    riskScore: 38,
    riskRating: 'BBB',
    status: 'live',
    inceptionDate: '2025-03-15',
    maturityDate: '2028-03-15',
    lastValuation: '2026-07-18',
    nextValuation: '2026-10-18',
    features: ['实物仓储', '链上溯源', '季度分配', '可转让', '可赎回'],
    description: '由迪拜 DMCC 认证仓储原油 1:1 锚定的代币化商品凭证，提供仓储证明与季度溢价分配。',
    holders: 1840,
    dailyVolume: 184000,
    change24h: 0.18,
    change7d: 0.42,
    change30d: 1.08,
    contracts: { token: '0xC3d4...e5f6', vault: '0xD4e5...f6a7', registrar: '0xE5f6...a7b8', oracle: '0xF6a7...b8c9' },
    attributes: [
      { key: '标的', value: 'WTI 轻质原油' },
      { key: '仓储', value: 'DMCC 自由区' },
      { key: '质检', value: 'SGS 季度抽检' },
      { key: '保险', value: 'AIG 全额' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 1000, feeBps: 50 },
      { period: '锁定期后', minAmount: 100, feeBps: 15 },
    ],
  },
  {
    id: 'rwa-010',
    symbol: 'ZSINF-SOLAR',
    name: '太阳能基础设施基金',
    category: 'infrastructure',
    chain: 'Polygon',
    jurisdiction: '葡萄牙（合规研究方向示例）',
    iconColor: '#3DDC97',
    iconBg: 'rgba(61,220,151,0.12)',
    price: 24.84,
    marketCap: 18420000,
    totalSupply: 740000,
    circulatingSupply: 712000,
    tvl: 18420000,
    underlyingValue: 18542000,
    nav: 25.04,
    premium: -0.80,
    annualYield: 6.84,
    distributionFrequency: '季度',
    lockupDays: 365,
    minimumInvestment: 500,
    issuer: 'ZS-Infrastructure',
    custodian: 'EuroCustody-SARL',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-010',
    complianceFramework: ['CMVM-Sandbox', 'EU-SFDR-Article-8', 'Reg-S'],
    riskScore: 44,
    riskRating: 'BBB',
    status: 'live',
    inceptionDate: '2025-05-20',
    maturityDate: '2040-05-20',
    lastValuation: '2026-07-15',
    nextValuation: '2026-10-15',
    features: ['基础设施', 'EU 绿色认证', '季度分配', '可转让', '可赎回'],
    description: '持有葡萄牙 8 座太阳能电站收益权代币，符合 EU SFDR Article 8 绿色金融标准。',
    holders: 2840,
    dailyVolume: 84000,
    change24h: 0.08,
    change7d: 0.42,
    change30d: 1.18,
    contracts: { token: '0xA7b8...c9d0', vault: '0xB8c9...d0e1', registrar: '0xC9d0...e1f2', oracle: '0xD0e1...f2a3' },
    attributes: [
      { key: '装机容量', value: '124 MW' },
      { key: '年发电量', value: '186 GWh' },
      { key: '购电协议', value: '15 年 PPA' },
      { key: '地理分布', value: '葡萄牙 / 西班牙' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 500, feeBps: 100 },
      { period: '锁定期后', minAmount: 100, feeBps: 25 },
    ],
  },
  {
    id: 'rwa-011',
    symbol: 'ZSCN-BIO',
    name: '生物多样性保护信用',
    category: 'carbon',
    chain: 'Celo',
    jurisdiction: '国际自愿市场',
    iconColor: '#44DBF4',
    iconBg: 'rgba(68,219,244,0.12)',
    price: 18.42,
    marketCap: 12420000,
    totalSupply: 684000,
    circulatingSupply: 642000,
    tvl: 12420000,
    underlyingValue: 12542000,
    nav: 18.62,
    premium: -1.07,
    annualYield: 0,
    distributionFrequency: '无',
    lockupDays: 0,
    minimumInvestment: 50,
    issuer: 'ZS-Bio Credit',
    custodian: 'Plan-Vivo-Registry',
    auditor: 'Bio-Audit-Firm',
    legalOpinion: 'LegalOp-011',
    complianceFramework: ['Plan-Vivo', 'CCB-Standard', 'IC-VCM'],
    riskScore: 42,
    riskRating: 'BBB',
    status: 'live',
    inceptionDate: '2025-08-10',
    maturityDate: '永久',
    lastValuation: '2026-07-19',
    nextValuation: '2026-07-26',
    features: ['生物多样性', '社区共建', '可转让', '可核销', '即时交付'],
    description: '基于 Plan Vivo 标准的生物多样性保护信用凭证，链上链下双重核证。',
    holders: 8420,
    dailyVolume: 184000,
    change24h: 1.18,
    change7d: 4.42,
    change30d: 12.84,
    contracts: { token: '0xE1f2...a3b4', vault: '0xF2a3...b4c5', registrar: '0xA3b4...c5d6', oracle: '0xB4c5...d6e7' },
    attributes: [
      { key: '项目类型', value: '生物多样性保护' },
      { key: '地理分布', value: '拉美 / 非洲' },
      { key: '社区共建', value: '是' },
      { key: '链上核证', value: '100%' },
    ],
    redemptions: [
      { period: '核销', minAmount: 1, feeBps: 30 },
      { period: '二级转让', minAmount: 1, feeBps: 10 },
    ],
  },
  {
    id: 'rwa-012',
    symbol: 'ZSRE-EU2',
    name: '欧洲物流仓储组合',
    category: 'real-estate',
    chain: 'Ethereum',
    jurisdiction: '卢森堡（合规研究方向示例）',
    iconColor: '#FFA940',
    iconBg: 'rgba(255,169,64,0.12)',
    price: 124.42,
    marketCap: 38420000,
    totalSupply: 308000,
    circulatingSupply: 284000,
    tvl: 38420000,
    underlyingValue: 38840000,
    nav: 126.18,
    premium: -1.39,
    annualYield: 5.84,
    distributionFrequency: '季度',
    lockupDays: 365,
    minimumInvestment: 5000,
    issuer: 'ZS-EU RE Fund',
    custodian: 'EuroCustody-SARL',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-012',
    complianceFramework: ['CSSF-SVF', 'AIFMD-Professional', 'Reg-S'],
    riskScore: 38,
    riskRating: 'A',
    status: 'live',
    inceptionDate: '2025-02-01',
    maturityDate: '2032-02-01',
    lastValuation: '2026-07-15',
    nextValuation: '2026-10-15',
    features: ['物流仓储', 'EU 认证', '季度分配', '可转让', '可赎回'],
    description: '持有德国 / 荷兰 / 比利时 6 处核心物流仓储物业组合，提供租金与升值收益。',
    holders: 1840,
    dailyVolume: 124000,
    change24h: -0.08,
    change7d: 0.42,
    change30d: 1.18,
    contracts: { token: '0xC5d6...e7f8', vault: '0xD6e7...f8a9', registrar: '0xE7f8...a9b0', oracle: '0xF8a9...b0c1' },
    attributes: [
      { key: '物业数量', value: '6 处' },
      { key: '总建面', value: '124,000 ㎡' },
      { key: '出租率', value: '98.4%' },
      { key: '平均剩余租期', value: '6.2 年' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 5000, feeBps: 80 },
      { period: '锁定期后', minAmount: 1000, feeBps: 20 },
    ],
  },


  {
    id: 'rwa-013',
    symbol: 'ZSTB-CORP',
    name: '投资级公司债组合',
    category: 'treasury',
    chain: 'Ethereum',
    jurisdiction: '新加坡（合规研究方向示例）',
    iconColor: '#0ECB81',
    iconBg: 'rgba(14,203,129,0.12)',
    price: 102.18,
    marketCap: 124200000,
    totalSupply: 1216000,
    circulatingSupply: 1142000,
    tvl: 124200000,
    underlyingValue: 124420000,
    nav: 102.32,
    premium: -0.14,
    annualYield: 5.42,
    distributionFrequency: '半年',
    lockupDays: 180,
    minimumInvestment: 10000,
    issuer: 'ZS-Credit Income',
    custodian: 'ZSCustody 信托（示例）',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-013',
    complianceFramework: ['MAS-CMS', 'Reg-S', 'Bond-Listing'],
    riskScore: 28,
    riskRating: 'AA',
    status: 'live',
    inceptionDate: '2024-11-10',
    maturityDate: '2029-11-10',
    lastValuation: '2026-07-12',
    nextValuation: '2026-10-12',
    features: ['投资级', '半年票息', '可转让', '链上溯源', '可赎回'],
    description: '由 24 张投资级公司债组成的代币化债券组合，提供半年票息分配。',
    holders: 3840,
    dailyVolume: 624000,
    change24h: 0.08,
    change7d: 0.18,
    change30d: 0.42,
    contracts: { token: '0xA9b0...c1d2', vault: '0xB0c1...d2e3', registrar: '0xC1d2...e3f4', oracle: '0xD2e3...f4a5' },
    attributes: [
      { key: '债券数量', value: '24 张' },
      { key: '平均评级', value: 'A-' },
      { key: '久期', value: '4.2 年' },
      { key: '行业', value: '金融 / 科技 / 能源' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 10000, feeBps: 60 },
      { period: '锁定期后', minAmount: 1000, feeBps: 15 },
    ],
  },
  {
    id: 'rwa-014',
    symbol: 'ZSIP-PATENT',
    name: '专利池收益基金 II',
    category: 'intellectual-property',
    chain: 'Arbitrum',
    jurisdiction: '美国（合规研究方向示例）',
    iconColor: '#5DC8FF',
    iconBg: 'rgba(93,200,255,0.12)',
    price: 8.42,
    marketCap: 5842000,
    totalSupply: 692000,
    circulatingSupply: 642000,
    tvl: 5842000,
    underlyingValue: 5924000,
    nav: 8.56,
    premium: -1.64,
    annualYield: 9.42,
    distributionFrequency: '半年',
    lockupDays: 365,
    minimumInvestment: 500,
    issuer: 'ZS-IP Capital',
    custodian: 'IP-Trust-Services',
    auditor: 'MidTier-Audit',
    legalOpinion: 'LegalOp-014',
    complianceFramework: ['Reg-D-506c', 'Reg-S', 'USPTO-Pool'],
    riskScore: 62,
    riskRating: 'B',
    status: 'pending',
    inceptionDate: '2026-08-15',
    maturityDate: '2036-08-15',
    lastValuation: '2026-07-10',
    nextValuation: '2027-01-10',
    features: ['专利组合', '诉讼收益', '半年分配', '可转让', '可赎回'],
    description: '由 84 项 AI / 生物科技核心专利组成的代币化专利池，提供半年版税与诉讼和解分配。',
    holders: 0,
    dailyVolume: 0,
    change24h: 0,
    change7d: 0,
    change30d: 0,
    contracts: { token: '0xE3f4...a5b6', vault: '0xF4a5...b6c7', registrar: '0xA5b6...c7d8', oracle: '0xB6c7...d8e9' },
    attributes: [
      { key: '专利数量', value: '84 项' },
      { key: '技术领域', value: 'AI / 生物科技' },
      { key: '平均剩余期', value: '12.4 年' },
      { key: '许可方', value: '84' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 500, feeBps: 100 },
      { period: '锁定期后', minAmount: 100, feeBps: 25 },
    ],
  },
  {
    id: 'rwa-015',
    symbol: 'ZSINF-WIND',
    name: '海上风电基础设施',
    category: 'infrastructure',
    chain: 'Polygon',
    jurisdiction: '英国（合规研究方向示例）',
    iconColor: '#3DDC97',
    iconBg: 'rgba(61,220,151,0.12)',
    price: 18.42,
    marketCap: 24800000,
    totalSupply: 1342000,
    circulatingSupply: 1284000,
    tvl: 24800000,
    underlyingValue: 24942000,
    nav: 18.58,
    premium: -0.86,
    annualYield: 6.42,
    distributionFrequency: '季度',
    lockupDays: 365,
    minimumInvestment: 1000,
    issuer: 'ZS-Infrastructure',
    custodian: 'EuroCustody-SARL',
    auditor: 'BigFour-Audit',
    legalOpinion: 'LegalOp-015',
    complianceFramework: ['FCA-Sandbox', 'EU-SFDR-Article-9', 'Reg-S'],
    riskScore: 42,
    riskRating: 'BBB',
    status: 'live',
    inceptionDate: '2025-07-20',
    maturityDate: '2045-07-20',
    lastValuation: '2026-07-15',
    nextValuation: '2026-10-15',
    features: ['海上风电', 'EU 绿色认证', '季度分配', '可转让', '可赎回'],
    description: '持有英国北海 3 座海上风电场收益权代币，符合 EU SFDR Article 9 最高绿色标准。',
    holders: 1840,
    dailyVolume: 84000,
    change24h: 0.18,
    change7d: 0.84,
    change30d: 1.42,
    contracts: { token: '0xC7d8...e9f0', vault: '0xD8e9...f0a1', registrar: '0xE9f0...a1b2', oracle: '0xF0a1...b2c3' },
    attributes: [
      { key: '装机容量', value: '684 MW' },
      { key: '年发电量', value: '2.4 TWh' },
      { key: '购电协议', value: '15 年 CfD' },
      { key: '地理', value: '英国北海' },
    ],
    redemptions: [
      { period: '锁定期内', minAmount: 1000, feeBps: 100 },
      { period: '锁定期后', minAmount: 100, feeBps: 25 },
    ],
  },
];


// ============================================================
// Mock 数据：发行方机构（12 个）
// ============================================================

const ISSUERS: Issuer[] = [
  {
    id: 'iss-001',
    name: 'ZS-Capital 资管（示例）',
    shortName: 'ZS-Capital',
    jurisdiction: '新加坡（合规研究方向示例）',
    type: '资管机构',
    aum: 1240000000,
    assetCount: 12,
    establishedYear: 2018,
    logoColor: '#14B881',
    description: '聚焦代币化固定收益与国债组合的资管机构，示例 SPV 发行方。',
    licenses: ['MAS-CMS', 'Reg-S-Provider'],
    riskRating: 'AA',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-SPV',
    contactEmail: '[email protected]',
    website: 'capital.example-zsdex.com',
    status: 'active',
    totalIssued: 624000000,
    totalRedeemed: 84000000,
    averageYield: 5.84,
    defaultRate: 0,
    reputation: 96,
    features: ['代币化债券', '国债组合', '季度票息', 'AAA 评级优先'],
    partnerships: ['ZSCustody', 'BigFour-Audit', 'SwissVault-AG'],
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'iss-002',
    name: 'ZS-RE Holdings',
    shortName: 'ZS-RE',
    jurisdiction: '香港（合规研究方向示例）',
    type: '不动产资管',
    aum: 2480000000,
    assetCount: 8,
    establishedYear: 2015,
    logoColor: '#FFA940',
    description: '北亚一线城市核心地段商业地产资管，专注代币化不动产组合。',
    licenses: ['SFC-Type-9', 'Reg-S', 'REIT-Cross-Border'],
    riskRating: 'BBB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'BVI-SPV',
    contactEmail: '[email protected]',
    website: 're.example-zsdex.com',
    status: 'active',
    totalIssued: 1240000000,
    totalRedeemed: 124000000,
    averageYield: 6.42,
    defaultRate: 0,
    reputation: 92,
    features: ['不动产组合', '租金分配', '资产升值', 'REIT 跨镜'],
    partnerships: ['FiduciaBank-Asia', 'BigFour-Audit', 'EuroCustody-SARL'],
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'iss-003',
    name: 'ZS-Carbon Markets',
    shortName: 'ZS-Carbon',
    jurisdiction: '国际自愿市场',
    type: '碳信用发行方',
    aum: 184000000,
    assetCount: 24,
    establishedYear: 2021,
    logoColor: '#44DBF4',
    description: '聚焦 Verra VCS / Gold Standard / Plan Vivo 等国际碳信用代币化。',
    licenses: ['Verra-Issuer', 'Gold-Standard-Partner', 'IC-VCM-Registry'],
    riskRating: 'A',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-SPV',
    contactEmail: '[email protected]',
    website: 'carbon.example-zsdex.com',
    status: 'active',
    totalIssued: 84000000,
    totalRedeemed: 12400000,
    averageYield: 0,
    defaultRate: 0,
    reputation: 88,
    features: ['VCS 标准', 'Gold Standard', 'Plan Vivo', '链上核证'],
    partnerships: ['Verra-Registry', 'Plan-Vivo-Registry', 'ClimateAudit-Firm'],
    iconBg: 'rgba(68,219,244,0.12)',
  },
  {
    id: 'iss-004',
    name: 'ZS-Bullion AG',
    shortName: 'ZS-Bullion',
    jurisdiction: '瑞士（合规研究方向示例）',
    type: '贵金属资管',
    aum: 624000000,
    assetCount: 6,
    establishedYear: 2012,
    logoColor: '#FFB946',
    description: 'LBMA 认证金条 1:1 锚定的代币化贵金属资管机构。',
    licenses: ['LBMA-Good-Delivery', 'FINMA-Fintech', 'ISO-9001'],
    riskRating: 'AA',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Swiss-SPV',
    contactEmail: '[email protected]',
    website: 'bullion.example-zsdex.com',
    status: 'active',
    totalIssued: 384000000,
    totalRedeemed: 12400000,
    averageYield: 0,
    defaultRate: 0,
    reputation: 96,
    features: ['LBMA 金条', '实物赎回', '保险覆盖', '链上溯源'],
    partnerships: ['SwissVault-AG', 'Lloyd\'s', 'BigFour-Audit'],
    iconBg: 'rgba(255,185,70,0.12)',
  },
  {
    id: 'iss-005',
    name: 'ZS-Art Capital',
    shortName: 'ZS-Art',
    jurisdiction: '新加坡（合规研究方向示例）',
    type: '艺术品资管',
    aum: 84000000,
    assetCount: 5,
    establishedYear: 2020,
    logoColor: '#B370FF',
    description: '聚焦蓝筹当代艺术品的代币化资管，提供艺术品保险与年度估值。',
    licenses: ['MAS-Art-Sandbox', 'AML-Enhanced'],
    riskRating: 'BB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-SPV',
    contactEmail: '[email protected]',
    website: 'art.example-zsdex.com',
    status: 'active',
    totalIssued: 24000000,
    totalRedeemed: 0,
    averageYield: 0,
    defaultRate: 0,
    reputation: 84,
    features: ['蓝筹标的', '艺术品保险', '年度估值', '锁仓期'],
    partnerships: ['FreePort-Asia', '苏富比', '佳士得'],
    iconBg: 'rgba(179,112,255,0.12)',
  },
  {
    id: 'iss-006',
    name: 'ZS-IP Capital',
    shortName: 'ZS-IP',
    jurisdiction: '美国（合规研究方向示例）',
    type: '知识产权资管',
    aum: 124000000,
    assetCount: 6,
    establishedYear: 2019,
    logoColor: '#5DC8FF',
    description: '音乐版税、专利池、IP 授权等知识产权代币化资管。',
    licenses: ['Reg-D-506c', 'Reg-S', 'USPTO-IP-Pool'],
    riskRating: 'B',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Delaware-LLC',
    contactEmail: '[email protected]',
    website: 'ip.example-zsdex.com',
    status: 'active',
    totalIssued: 64000000,
    totalRedeemed: 8400000,
    averageYield: 8.84,
    defaultRate: 0,
    reputation: 82,
    features: ['音乐版税', '专利组合', '多元化 IP', '半年分配'],
    partnerships: ['ASCAP', 'BMI', 'IP-Trust-Services'],
    iconBg: 'rgba(93,200,255,0.12)',
  },


  {
    id: 'iss-007',
    name: 'ZS-PE Partners',
    shortName: 'ZS-PE',
    jurisdiction: '开曼（合规研究方向示例）',
    type: '私募股权基金',
    aum: 384000000,
    assetCount: 4,
    establishedYear: 2017,
    logoColor: '#FF7A6B',
    description: '聚焦早期科技 / AI / Web3 领域的代币化私募股权基金。',
    licenses: ['Reg-D-506b', 'Reg-S', 'CIMA-Registered'],
    riskRating: 'CCC',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-Fund-LP',
    contactEmail: '[email protected]',
    website: 'pe.example-zsdex.com',
    status: 'active',
    totalIssued: 184000000,
    totalRedeemed: 0,
    averageYield: 0,
    defaultRate: 0,
    reputation: 78,
    features: ['私募股权', '高门槛', '长期锁仓', '退出分配'],
    partnerships: ['Cayman-SPV-Trustee', 'BigFour-Audit', 'Sequoia-Reference'],
    iconBg: 'rgba(255,122,107,0.12)',
  },
  {
    id: 'iss-008',
    name: 'ZS-Factoring Ltd',
    shortName: 'ZS-Factoring',
    jurisdiction: '香港（合规研究方向示例）',
    type: '应收账款保理',
    aum: 124000000,
    assetCount: 12,
    establishedYear: 2016,
    logoColor: '#FFA940',
    description: '中小企应收账款保理与代币化资管，月度票息分配。',
    licenses: ['SFC-Type-1', 'HKMA-Regulated', 'Reg-S'],
    riskRating: 'BB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'HK-SPV',
    contactEmail: '[email protected]',
    website: 'factoring.example-zsdex.com',
    status: 'active',
    totalIssued: 84000000,
    totalRedeemed: 12400000,
    averageYield: 7.84,
    defaultRate: 0.04,
    reputation: 86,
    features: ['中小企保理', '短期票据', '月付息', 'SPV 结构'],
    partnerships: ['FiduciaBank-Asia', 'BigFour-Audit', 'SME-Bureau'],
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'iss-009',
    name: 'ZS-Commodity DMCC',
    shortName: 'ZS-Commodity',
    jurisdiction: '阿联酋（合规研究方向示例）',
    type: '大宗商品资管',
    aum: 248000000,
    assetCount: 8,
    establishedYear: 2014,
    logoColor: '#FFC542',
    description: '原油、贵金属等大宗商品的代币化仓储凭证发行方。',
    licenses: ['DMCC-Approved', 'VARA-Observe', 'ISO-9001'],
    riskRating: 'BBB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'DMCC-SPV',
    contactEmail: '[email protected]',
    website: 'commodity.example-zsdex.com',
    status: 'active',
    totalIssued: 124000000,
    totalRedeemed: 8400000,
    averageYield: 5.42,
    defaultRate: 0,
    reputation: 88,
    features: ['实物仓储', '链上溯源', '季度分配', 'SGS 质检'],
    partnerships: ['ADX-Vault-DMCC', 'BigFour-Audit', 'AIG-Insurance'],
    iconBg: 'rgba(255,197,66,0.12)',
  },
  {
    id: 'iss-010',
    name: 'ZS-Infrastructure',
    shortName: 'ZS-Infra',
    jurisdiction: '葡萄牙（合规研究方向示例）',
    type: '基础设施资管',
    aum: 384000000,
    assetCount: 12,
    establishedYear: 2013,
    logoColor: '#3DDC97',
    description: '太阳能 / 风电 / 储能等绿色基础设施代币化资管。',
    licenses: ['CMVM-Sandbox', 'EU-SFDR-Article-8-9', 'Reg-S'],
    riskRating: 'BBB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Luxembourg-SICAV',
    contactEmail: '[email protected]',
    website: 'infra.example-zsdex.com',
    status: 'active',
    totalIssued: 184000000,
    totalRedeemed: 12400000,
    averageYield: 6.42,
    defaultRate: 0,
    reputation: 90,
    features: ['绿色基础设施', 'EU SFDR', 'PPA 长期协议', '季度分配'],
    partnerships: ['EuroCustody-SARL', 'BigFour-Audit', 'EDP-Reference'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
  {
    id: 'iss-011',
    name: 'ZS-Credit Income',
    shortName: 'ZS-Credit',
    jurisdiction: '新加坡（合规研究方向示例）',
    type: '信用债资管',
    aum: 624000000,
    assetCount: 24,
    establishedYear: 2011,
    logoColor: '#0ECB81',
    description: '投资级公司债组合的代币化资管，提供半年票息。',
    licenses: ['MAS-CMS', 'Reg-S', 'SGX-Bond-Listing'],
    riskRating: 'AA',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-SPV',
    contactEmail: '[email protected]',
    website: 'credit.example-zsdex.com',
    status: 'active',
    totalIssued: 384000000,
    totalRedeemed: 64000000,
    averageYield: 5.42,
    defaultRate: 0,
    reputation: 94,
    features: ['投资级', '半年票息', '可转让', '链上溯源'],
    partnerships: ['ZSCustody', 'BigFour-Audit', 'SGX-Reference'],
    iconBg: 'rgba(14,203,129,0.12)',
  },
  {
    id: 'iss-012',
    name: 'ZS-Bio Credit',
    shortName: 'ZS-Bio',
    jurisdiction: '国际自愿市场',
    type: '生物多样性资管',
    aum: 64000000,
    assetCount: 18,
    establishedYear: 2022,
    logoColor: '#44DBF4',
    description: '生物多样性保护信用代币化资管，链上链下双重核证。',
    licenses: ['Plan-Vivo', 'CCB-Standard', 'IC-VCM'],
    riskRating: 'BBB',
    parentCompany: 'ZS-Group-Holdings',
    spvStructure: 'Cayman-SPV',
    contactEmail: '[email protected]',
    website: 'bio.example-zsdex.com',
    status: 'under-review',
    totalIssued: 24000000,
    totalRedeemed: 0,
    averageYield: 0,
    defaultRate: 0,
    reputation: 80,
    features: ['生物多样性', '社区共建', '链上核证', '即时交付'],
    partnerships: ['Plan-Vivo-Registry', 'Bio-Audit-Firm', 'IC-VCM'],
    iconBg: 'rgba(68,219,244,0.12)',
  },
];

// ============================================================
// Mock 数据：托管机构（10 个）
// ============================================================

const CUSTODIANS: Custodian[] = [
  {
    id: 'cus-001',
    name: 'ZSCustody 信托（示例）',
    shortName: 'ZSCustody',
    jurisdiction: '新加坡（合规研究方向示例）',
    type: 'qualified-custodian',
    aum: 4200000000,
    assetsUnderCustody: 6240000000,
    insuranceCoverage: 2000000000,
    establishedYear: 2010,
    description: 'MAS 认证的合格托管机构，提供多类资产链下托管与链上确权服务。',
    certifications: ['MAS-CMS-Trust', 'SOC2-Type-II', 'ISO-27001'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 184,
    reputation: 98,
    features: ['合格托管', '链下保险', '链上确权', '独立审计'],
    iconBg: 'rgba(20,184,129,0.12)',
    iconColor: '#14B881',
  },


  {
    id: 'cus-002',
    name: 'FiduciaBank-Asia',
    shortName: 'FiduciaBank',
    jurisdiction: '香港（合规研究方向示例）',
    type: 'bank',
    aum: 8400000000,
    assetsUnderCustody: 12400000000,
    insuranceCoverage: 5000000000,
    establishedYear: 1965,
    description: '亚洲老牌托管银行，提供不动产 / 应收账款 / 金融工具托管。',
    certifications: ['HKMA-Authorized', 'SOC2-Type-II', 'ISO-27001'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 320,
    reputation: 96,
    features: ['银行托管', 'HKMA 监管', '链下保险', '链上确权'],
    iconBg: 'rgba(255,169,64,0.12)',
    iconColor: '#FFA940',
  },
  {
    id: 'cus-003',
    name: 'SwissVault-AG',
    shortName: 'SwissVault',
    jurisdiction: '瑞士（合规研究方向示例）',
    type: 'qualified-custodian',
    aum: 2400000000,
    assetsUnderCustody: 3840000000,
    insuranceCoverage: 1000000000,
    establishedYear: 2008,
    description: '瑞士 LBMA 认证金条仓储托管商，提供实物黄金代币化托管。',
    certifications: ['FINMA-Fintech', 'LBMA-Good-Delivery', 'SOC2-Type-II'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 84,
    reputation: 98,
    features: ['实物仓储', 'LBMA 认证', '保险覆盖', '链上确权'],
    iconBg: 'rgba(255,185,70,0.12)',
    iconColor: '#FFB946',
  },
  {
    id: 'cus-004',
    name: 'EuroCustody-SARL',
    shortName: 'EuroCustody',
    jurisdiction: '卢森堡（合规研究方向示例）',
    type: 'trustee',
    aum: 6240000000,
    assetsUnderCustody: 8400000000,
    insuranceCoverage: 3000000000,
    establishedYear: 2005,
    description: 'CSSF 监管的欧盟跨境受托人，提供基金 / SPV / 不动产托管。',
    certifications: ['CSSF-AIFMD', 'AIFMD-Professional', 'SOC2-Type-II'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 240,
    reputation: 96,
    features: ['EU 监管', 'AIFMD 合规', '跨境托管', '链上确权'],
    iconBg: 'rgba(61,220,151,0.12)',
    iconColor: '#3DDC97',
  },
  {
    id: 'cus-005',
    name: 'Cayman-SPV-Trustee',
    shortName: 'Cayman-Trustee',
    jurisdiction: '开曼（合规研究方向示例）',
    type: 'spv-trustee',
    aum: 1840000000,
    assetsUnderCustody: 2480000000,
    insuranceCoverage: 1000000000,
    establishedYear: 2012,
    description: 'CIMA 认证 SPV 受托人，提供私募基金 SPV 托管服务。',
    certifications: ['CIMA-Registered', 'SOC2-Type-II', 'ISO-27001'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 124,
    reputation: 92,
    features: ['CIMA 监管', 'SPV 托管', '私募专属', '链上确权'],
    iconBg: 'rgba(255,122,107,0.12)',
    iconColor: '#FF7A6B',
  },
  {
    id: 'cus-006',
    name: 'Verra-Registry',
    shortName: 'Verra',
    jurisdiction: '国际自愿市场',
    type: 'trustee',
    aum: 0,
    assetsUnderCustody: 124000000,
    insuranceCoverage: 0,
    establishedYear: 2005,
    description: 'Verra VCS 碳信用注册机构，提供 VCS 信用代币化与核销服务。',
    certifications: ['Verra-VCS-Registry', 'IC-VCM-Registry'],
    auditFirm: 'ClimateAudit-Firm',
    status: 'active',
    clients: 1840,
    reputation: 96,
    features: ['VCS 注册', '碳信用核证', '防双花', '链上溯源'],
    iconBg: 'rgba(68,219,244,0.12)',
    iconColor: '#44DBF4',
  },
  {
    id: 'cus-007',
    name: 'Plan-Vivo-Registry',
    shortName: 'Plan-Vivo',
    jurisdiction: '国际自愿市场',
    type: 'trustee',
    aum: 0,
    assetsUnderCustody: 64000000,
    insuranceCoverage: 0,
    establishedYear: 2008,
    description: 'Plan Vivo 生物多样性信用注册机构，提供 PV 标准核证与链上代币化。',
    certifications: ['Plan-Vivo-Registry', 'CCB-Standard'],
    auditFirm: 'Bio-Audit-Firm',
    status: 'active',
    clients: 624,
    reputation: 92,
    features: ['Plan Vivo 注册', '生物多样性', '链上核证', '社区共建'],
    iconBg: 'rgba(68,219,244,0.12)',
    iconColor: '#44DBF4',
  },
  {
    id: 'cus-008',
    name: 'FreePort-Asia',
    shortName: 'FreePort',
    jurisdiction: '新加坡（合规研究方向示例）',
    type: 'qualified-custodian',
    aum: 84000000,
    assetsUnderCustody: 124000000,
    insuranceCoverage: 200000000,
    establishedYear: 2010,
    description: '新加坡自由港艺术品仓储，提供蓝筹艺术品代币化托管。',
    certifications: ['MAS-Art-Sandbox', 'SOC2-Type-II'],
    auditFirm: 'MidTier-Audit',
    status: 'active',
    clients: 84,
    reputation: 88,
    features: ['艺术品仓储', '保险覆盖', '恒温恒湿', '链上确权'],
    iconBg: 'rgba(179,112,255,0.12)',
    iconColor: '#B370FF',
  },
  {
    id: 'cus-009',
    name: 'IP-Trust-Services',
    shortName: 'IP-Trust',
    jurisdiction: '美国（合规研究方向示例）',
    type: 'trustee',
    aum: 124000000,
    assetsUnderCustody: 184000000,
    insuranceCoverage: 50000000,
    establishedYear: 2015,
    description: 'USPTO 注册专利池受托人，提供专利代币化与版税管理。',
    certifications: ['USPTO-IP-Pool', 'SOC2-Type-II'],
    auditFirm: 'MidTier-Audit',
    status: 'active',
    clients: 64,
    reputation: 84,
    features: ['专利池', '版税管理', 'USPTO 注册', '链上确权'],
    iconBg: 'rgba(93,200,255,0.12)',
    iconColor: '#5DC8FF',
  },
  {
    id: 'cus-010',
    name: 'ADX-Vault-DMCC',
    shortName: 'ADX-Vault',
    jurisdiction: '阿联酋（合规研究方向示例）',
    type: 'qualified-custodian',
    aum: 384000000,
    assetsUnderCustody: 624000000,
    insuranceCoverage: 300000000,
    establishedYear: 2013,
    description: '迪拜 DMCC 自由区认证仓储，提供原油 / 贵金属 / 大宗商品代币化托管。',
    certifications: ['DMCC-Approved', 'VARA-Observe', 'ISO-9001'],
    auditFirm: 'BigFour-Audit',
    status: 'active',
    clients: 124,
    reputation: 90,
    features: ['实物仓储', 'DMCC 认证', '保险覆盖', '链上确权'],
    iconBg: 'rgba(255,197,66,0.12)',
    iconColor: '#FFC542',
  },
];


// ============================================================
// Mock 数据：合规框架（10 个）
// ============================================================

const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'cf-001',
    name: 'MAS-Sandbox',
    region: '新加坡',
    regulator: 'MAS-新加坡金管局（合规研究方向示例）',
    type: 'sandbox',
    description: '新加坡金管局监管沙盒，允许在限定范围内测试代币化资产发行。',
    investorTypes: ['专业投资者', '合格投资者', '机构投资者'],
    minimumInvestment: 1000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限（仅合格投资者）',
    reportingFrequency: '季度',
    taxTreatment: '按 SPV 司法管辖',
    riskDisclosure: '需提供完整风险揭示',
    status: 'active',
    framework: 'MAS-Sandbox-Expressive',
    documents: ['风险揭示书', '投资者适当性', '产品白皮书', '估值报告'],
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'cf-002',
    name: 'Reg-D-506c',
    region: '美国',
    regulator: 'SEC-美国证监会（合规研究方向示例）',
    type: 'exemption',
    description: '美国 SEC Reg D 506c 私募豁免，允许向合格投资者进行一般性募集。',
    investorTypes: ['合格投资者', '机构投资者', '家族办公室'],
    minimumInvestment: 50000,
    lockupPeriod: '无强制',
    transferability: '受限（持有期 1 年）',
    reportingFrequency: '年度',
    taxTreatment: 'K-1 / 1099',
    riskDisclosure: '需提供 Reg D 风险揭示',
    status: 'active',
    framework: 'Reg-D-Rule-506c',
    documents: ['Form-D', 'PPM', 'Subscription-Agreement', 'Investor-Suitability'],
    iconBg: 'rgba(255,122,107,0.12)',
  },
  {
    id: 'cf-003',
    name: 'Reg-S',
    region: '国际',
    regulator: 'SEC-美国证监会（合规研究方向示例）',
    type: 'exemption',
    description: '美国 SEC Reg S 离岸豁免，向非美国人发行证券免于注册。',
    investorTypes: ['非美国投资者', '机构投资者'],
    minimumInvestment: 100000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限（持有期 1 年）',
    reportingFrequency: '半年度',
    taxTreatment: '按 SPV 司法管辖',
    riskDisclosure: '需提供 Reg S 风险揭示',
    status: 'active',
    framework: 'Reg-S-Rule-903-904',
    documents: ['Regulation-S-Docs', 'PPM', 'Jurisdiction-Representation'],
    iconBg: 'rgba(93,200,255,0.12)',
  },
  {
    id: 'cf-004',
    name: 'MiCA',
    region: '欧盟',
    regulator: 'ESMA-欧盟证券与市场管理局（合规研究方向示例）',
    type: 'license',
    description: '欧盟加密资产市场监管框架（Markets in Crypto-Assets），覆盖代币化资产发行。',
    investorTypes: ['零售（受限）', '专业投资者', '机构投资者'],
    minimumInvestment: 0,
    lockupPeriod: '无强制',
    transferability: '公开市场',
    reportingFrequency: '季度',
    taxTreatment: '按 EU 成员国',
    riskDisclosure: '需提供 MiCA 风险揭示',
    status: 'active',
    framework: 'MiCA-Regulation-2023-1114',
    documents: ['White-Paper', 'Risk-Disclosure', 'Capital-Adequacy'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
  {
    id: 'cf-005',
    name: 'SFC-Type-9',
    region: '香港',
    regulator: 'SFC-香港证监会（合规研究方向示例）',
    type: 'license',
    description: '香港证监会 Type 9 号牌（资产管理），允许管理代币化资产组合。',
    investorTypes: ['专业投资者', '机构投资者'],
    minimumInvestment: 1000000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限（仅专业投资者）',
    reportingFrequency: '半年度',
    taxTreatment: '按香港税法',
    riskDisclosure: '需提供 SFC 风险揭示',
    status: 'active',
    framework: 'SFC-Type-9-Asset-Management',
    documents: ['SFC-Licence', 'PPM', 'Risk-Disclosure', 'Audit-Report'],
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'cf-006',
    name: 'CSSF-AIFMD',
    region: '卢森堡',
    regulator: 'CSSF-卢森堡金监会（合规研究方向示例）',
    type: 'license',
    description: '欧盟 AIFMD 另类投资基金管理人牌照，监管跨境的代币化基金。',
    investorTypes: ['专业投资者', '机构投资者'],
    minimumInvestment: 100000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限（仅专业投资者）',
    reportingFrequency: '季度',
    taxTreatment: '按卢森堡税法',
    riskDisclosure: '需提供 AIFMD 风险揭示',
    status: 'active',
    framework: 'AIFMD-2011-61-EU',
    documents: ['AIFMD-Licence', 'PPM', 'Risk-Disclosure', 'Annex-IV-Report'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
  {
    id: 'cf-007',
    name: 'CIMA-Registered',
    region: '开曼',
    regulator: 'CIMA-开曼金管局（合规研究方向示例）',
    type: 'registration',
    description: '开曼金管局私募基金注册，覆盖 SPV 结构代币化基金。',
    investorTypes: ['专业投资者', '机构投资者'],
    minimumInvestment: 100000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限（仅专业投资者）',
    reportingFrequency: '年度',
    taxTreatment: '按开曼税法（无所得税）',
    riskDisclosure: '需提供完整风险揭示',
    status: 'active',
    framework: 'CIMA-Mutual-Funds-Act',
    documents: ['CIMA-Registration', 'PPM', 'Audited-Accounts'],
    iconBg: 'rgba(255,122,107,0.12)',
  },
  {
    id: 'cf-008',
    name: 'FCA-Sandbox',
    region: '英国',
    regulator: 'FCA-英国金管局（合规研究方向示例）',
    type: 'sandbox',
    description: '英国金管局监管沙盒，支持代币化资产在限定范围测试。',
    investorTypes: ['专业投资者', '机构投资者', '零售（受限）'],
    minimumInvestment: 1000,
    lockupPeriod: '按 SPV 条款',
    transferability: '受限',
    reportingFrequency: '季度',
    taxTreatment: '按英国税法',
    riskDisclosure: '需提供 FCA 风险揭示',
    status: 'active',
    framework: 'FCA-Regulatory-Sandbox',
    documents: ['FCA-Authorisation', 'White-Paper', 'Risk-Disclosure'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
  {
    id: 'cf-009',
    name: 'EU-SFDR-Article-8',
    region: '欧盟',
    regulator: 'ESMA-欧盟证券与市场管理局（合规研究方向示例）',
    type: 'license',
    description: '欧盟可持续金融披露条例第 8 条，绿色 / 转型基金代币化。',
    investorTypes: ['专业投资者', '机构投资者'],
    minimumInvestment: 1000,
    lockupPeriod: '按 SPV 条款',
    transferability: '公开市场',
    reportingFrequency: '季度',
    taxTreatment: '按 EU 成员国',
    riskDisclosure: '需提供 SFDR 风险揭示',
    status: 'active',
    framework: 'SFDR-2019-2088',
    documents: ['SFDR-Disclosure', 'ESG-Metrics', 'Periodic-Report'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
  {
    id: 'cf-010',
    name: 'EU-SFDR-Article-9',
    region: '欧盟',
    regulator: 'ESMA-欧盟证券与市场管理局（合规研究方向示例）',
    type: 'license',
    description: '欧盟可持续金融披露条例第 9 条，最高绿色标准基金代币化。',
    investorTypes: ['专业投资者', '机构投资者'],
    minimumInvestment: 1000,
    lockupPeriod: '按 SPV 条款',
    transferability: '公开市场',
    reportingFrequency: '季度',
    taxTreatment: '按 EU 成员国',
    riskDisclosure: '需提供 SFDR 风险揭示',
    status: 'active',
    framework: 'SFDR-2019-2088-Article-9',
    documents: ['SFDR-Disclosure', 'Impact-Metrics', 'Periodic-Report', 'Taxonomy-Alignment'],
    iconBg: 'rgba(61,220,151,0.12)',
  },
];


// ============================================================
// Mock 数据：生命周期事件（16 个）
// ============================================================

const LIFECYCLE_EVENTS: LifecycleEvent[] = [
  {
    id: 'lc-001',
    assetId: 'rwa-001',
    assetSymbol: 'ZSTB-01',
    type: 'coupon',
    amount: 1842000,
    fromAddress: '0xA1b2...c3d4',
    toAddress: '0xDistributor...0001',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    blockNumber: 18420000,
    timestamp: '2026-07-15 10:00:00',
    status: 'finalized',
    description: '数字国债凭证 01 季度票息分配',
    gasUsed: 184000,
    feesUsd: 24.84,
    operator: 'ZS-Capital 资管',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-002',
    assetId: 'rwa-002',
    assetSymbol: 'ZSRE-NA1',
    type: 'mint',
    amount: 240000,
    fromAddress: '0x0000...0000',
    toAddress: '0xInvestor...8420',
    txHash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    blockNumber: 18420200,
    timestamp: '2026-07-19 14:32:18',
    status: 'finalized',
    description: '北亚不动产组合 A 新增铸造 240,000 份',
    gasUsed: 240000,
    feesUsd: 32.42,
    operator: 'ZS-RE Holdings',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-003',
    assetId: 'rwa-003',
    assetSymbol: 'ZSCN-VCS',
    type: 'redeem',
    amount: 12420,
    fromAddress: '0xBuyer...0001',
    toAddress: '0x0000...0000',
    txHash: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    blockNumber: 18420240,
    timestamp: '2026-07-19 16:48:42',
    status: 'finalized',
    description: 'VCS 碳信用凭证 核销 12,420 tCO2e',
    gasUsed: 124000,
    feesUsd: 18.42,
    operator: 'ZS-Carbon Markets',
    riskFlag: 'low',
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'lc-004',
    assetId: 'rwa-004',
    assetSymbol: 'ZSAU-100',
    type: 'transfer',
    amount: 184,
    fromAddress: '0xVault...0001',
    toAddress: '0xBuyer...0042',
    txHash: '0x6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    blockNumber: 18420280,
    timestamp: '2026-07-20 08:24:08',
    status: 'finalized',
    description: '黄金代币 二级转让 184 份（= 18.4 kg）',
    gasUsed: 84000,
    feesUsd: 12.84,
    operator: 'Transfer-Marketplace',
    riskFlag: 'low',
    iconBg: 'rgba(93,200,255,0.12)',
  },
  {
    id: 'lc-005',
    assetId: 'rwa-005',
    assetSymbol: 'ZSART-001',
    type: 'valuation',
    amount: 0,
    fromAddress: '0x0000...0000',
    toAddress: '0x0000...0000',
    txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    blockNumber: 18420080,
    timestamp: '2026-07-12 12:00:00',
    status: 'finalized',
    description: '蓝筹艺术品基金 季度估值更新（苏富比）',
    gasUsed: 0,
    feesUsd: 0,
    operator: 'Sothebys-Auction-House',
    riskFlag: 'low',
    iconBg: 'rgba(68,219,244,0.12)',
  },
  {
    id: 'lc-006',
    assetId: 'rwa-006',
    assetSymbol: 'ZSIP-MUSIC',
    type: 'coupon',
    amount: 384000,
    fromAddress: '0xA5b6...c7d8',
    toAddress: '0xDistributor...0002',
    txHash: '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
    blockNumber: 18420120,
    timestamp: '2026-07-10 10:00:00',
    status: 'finalized',
    description: '音乐版税收益基金 半年票息分配',
    gasUsed: 184000,
    feesUsd: 24.42,
    operator: 'ASCAP / BMI',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-007',
    assetId: 'rwa-008',
    assetSymbol: 'ZSINV-SME',
    type: 'maturity',
    amount: 1240,
    fromAddress: '0xC9d0...e1f2',
    toAddress: '0xInvestor...0240',
    txHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    blockNumber: 18420180,
    timestamp: '2026-07-18 16:24:42',
    status: 'finalized',
    description: '中小企应收账款 自然到期 1,240 份',
    gasUsed: 84000,
    feesUsd: 8.42,
    operator: 'ZS-Factoring Ltd',
    riskFlag: 'low',
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'lc-008',
    assetId: 'rwa-009',
    assetSymbol: 'ZSCOM-OIL',
    type: 'audit',
    amount: 0,
    fromAddress: '0x0000...0000',
    toAddress: '0x0000...0000',
    txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockNumber: 18420160,
    timestamp: '2026-07-15 08:00:00',
    status: 'finalized',
    description: '原油仓储凭证 SGS 季度抽检审计',
    gasUsed: 0,
    feesUsd: 0,
    operator: 'SGS-Inspection',
    riskFlag: 'low',
    iconBg: 'rgba(179,112,255,0.12)',
  },


  {
    id: 'lc-009',
    assetId: 'rwa-010',
    assetSymbol: 'ZSINF-SOLAR',
    type: 'coupon',
    amount: 184000,
    fromAddress: '0xA7b8...c9d0',
    toAddress: '0xDistributor...0003',
    txHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    blockNumber: 18420100,
    timestamp: '2026-07-10 10:00:00',
    status: 'finalized',
    description: '太阳能基础设施基金 季度分配',
    gasUsed: 184000,
    feesUsd: 24.84,
    operator: 'ZS-Infrastructure',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-010',
    assetId: 'rwa-011',
    assetSymbol: 'ZSCN-BIO',
    type: 'redeem',
    amount: 8420,
    fromAddress: '0xBuyer...0010',
    toAddress: '0x0000...0000',
    txHash: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
    blockNumber: 18420260,
    timestamp: '2026-07-19 18:32:14',
    status: 'finalized',
    description: '生物多样性保护信用 核销 8,420 单位',
    gasUsed: 124000,
    feesUsd: 18.42,
    operator: 'ZS-Bio Credit',
    riskFlag: 'low',
    iconBg: 'rgba(255,169,64,0.12)',
  },
  {
    id: 'lc-011',
    assetId: 'rwa-002',
    assetSymbol: 'ZSRE-NA1',
    type: 'lock',
    amount: 0,
    fromAddress: '0xVault...0002',
    toAddress: '0xLockup...0001',
    txHash: '0xfe0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d',
    blockNumber: 18420220,
    timestamp: '2026-07-19 12:24:18',
    status: 'finalized',
    description: '北亚不动产组合 A 锁仓 180 天',
    gasUsed: 84000,
    feesUsd: 12.84,
    operator: 'ZS-RE Holdings',
    riskFlag: 'low',
    iconBg: 'rgba(176,176,176,0.10)',
  },
  {
    id: 'lc-012',
    assetId: 'rwa-007',
    assetSymbol: 'ZSPE-FUND1',
    type: 'lock',
    amount: 0,
    fromAddress: '0xVault...0003',
    toAddress: '0xLockup...0002',
    txHash: '0xed0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c',
    blockNumber: 18420140,
    timestamp: '2026-07-18 08:00:00',
    status: 'finalized',
    description: '科技私募股权基金 I 续期锁仓 730 天',
    gasUsed: 84000,
    feesUsd: 12.84,
    operator: 'ZS-PE Partners',
    riskFlag: 'medium',
    iconBg: 'rgba(176,176,176,0.10)',
  },
  {
    id: 'lc-013',
    assetId: 'rwa-013',
    assetSymbol: 'ZSTB-CORP',
    type: 'coupon',
    amount: 624000,
    fromAddress: '0xA9b0...c1d2',
    toAddress: '0xDistributor...0004',
    txHash: '0xdc0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b',
    blockNumber: 18420040,
    timestamp: '2026-07-12 10:00:00',
    status: 'finalized',
    description: '投资级公司债组合 半年票息分配',
    gasUsed: 184000,
    feesUsd: 24.84,
    operator: 'ZS-Credit Income',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-014',
    assetId: 'rwa-015',
    assetSymbol: 'ZSINF-WIND',
    type: 'valuation',
    amount: 0,
    fromAddress: '0x0000...0000',
    toAddress: '0x0000...0000',
    txHash: '0xcb0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a',
    blockNumber: 18420060,
    timestamp: '2026-07-15 12:00:00',
    status: 'finalized',
    description: '海上风电基础设施 季度估值更新',
    gasUsed: 0,
    feesUsd: 0,
    operator: 'PwC-Valuation',
    riskFlag: 'low',
    iconBg: 'rgba(68,219,244,0.12)',
  },
  {
    id: 'lc-015',
    assetId: 'rwa-012',
    assetSymbol: 'ZSRE-EU2',
    type: 'mint',
    amount: 24000,
    fromAddress: '0x0000...0000',
    toAddress: '0xInvestor...0008',
    txHash: '0xba09f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0',
    blockNumber: 18420300,
    timestamp: '2026-07-20 10:12:34',
    status: 'pending',
    description: '欧洲物流仓储组合 新增铸造 24,000 份（待确认）',
    gasUsed: 184000,
    feesUsd: 24.84,
    operator: 'ZS-EU RE Fund',
    riskFlag: 'low',
    iconBg: 'rgba(20,184,129,0.12)',
  },
  {
    id: 'lc-016',
    assetId: 'rwa-014',
    assetSymbol: 'ZSIP-PATENT',
    type: 'mint',
    amount: 0,
    fromAddress: '0x0000...0000',
    toAddress: '0x0000...0000',
    txHash: '0xa908f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0',
    blockNumber: 18420320,
    timestamp: '2026-07-20 11:24:18',
    status: 'pending',
    description: '专利池收益基金 II 待发行 692,000 份',
    gasUsed: 0,
    feesUsd: 0,
    operator: 'ZS-IP Capital',
    riskFlag: 'medium',
    iconBg: 'rgba(20,184,129,0.12)',
  },
];


// ============================================================
// Mock 数据：收益记录（12 个）
// ============================================================

const YIELD_RECORDS: YieldRecord[] = [
  {
    id: 'yr-001',
    assetId: 'rwa-001',
    assetSymbol: 'ZSTB-01',
    type: 'coupon',
    period: '2026 Q2',
    amountPerUnit: 1.21,
    totalAmount: 1842000,
    currency: 'USD',
    yieldRate: 4.85,
    paymentDate: '2026-07-15',
    recordDate: '2026-07-10',
    exDividendDate: '2026-07-08',
    recipients: 8420,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 4.85,
    projectedYield: 4.85,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '数字国债凭证 01 季度票息 1.21 USD/份',
  },
  {
    id: 'yr-002',
    assetId: 'rwa-002',
    assetSymbol: 'ZSRE-NA1',
    type: 'rental',
    period: '2026 06',
    amountPerUnit: 0.54,
    totalAmount: 1242000,
    currency: 'USD',
    yieldRate: 6.42,
    paymentDate: '2026-07-05',
    recordDate: '2026-06-30',
    exDividendDate: '2026-06-28',
    recipients: 6240,
    status: 'distributed',
    taxWithholding: 10,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 6.18,
    projectedYield: 6.42,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '北亚不动产组合 A 月度租金 0.54 USD/份',
  },
  {
    id: 'yr-003',
    assetId: 'rwa-006',
    assetSymbol: 'ZSIP-MUSIC',
    type: 'royalty',
    period: '2026 Q2',
    amountPerUnit: 0.62,
    totalAmount: 384000,
    currency: 'USD',
    yieldRate: 8.42,
    paymentDate: '2026-07-10',
    recordDate: '2026-07-05',
    exDividendDate: '2026-07-03',
    recipients: 2840,
    status: 'distributed',
    taxWithholding: 15,
    reinvestmentOption: false,
    distributionChannel: 'ASCAP / BMI 直接转账',
    historicalYield: 8.18,
    projectedYield: 8.42,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '音乐版税收益基金 半年版税 0.62 USD/份',
  },
  {
    id: 'yr-004',
    assetId: 'rwa-008',
    assetSymbol: 'ZSINV-SME',
    type: 'coupon',
    period: '2026 06',
    amountPerUnit: 0.65,
    totalAmount: 158000,
    currency: 'USD',
    yieldRate: 7.84,
    paymentDate: '2026-07-05',
    recordDate: '2026-06-30',
    exDividendDate: '2026-06-28',
    recipients: 1840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 7.62,
    projectedYield: 7.84,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '中小企应收账款池 月付息 0.65 USD/份',
  },
  {
    id: 'yr-005',
    assetId: 'rwa-009',
    assetSymbol: 'ZSCOM-OIL',
    type: 'distribution',
    period: '2026 Q2',
    amountPerUnit: 1.14,
    totalAmount: 492000,
    currency: 'USD',
    yieldRate: 5.42,
    paymentDate: '2026-07-15',
    recordDate: '2026-07-10',
    exDividendDate: '2026-07-08',
    recipients: 1840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: false,
    distributionChannel: '链上直接转账',
    historicalYield: 5.18,
    projectedYield: 5.42,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '原油仓储凭证 季度溢价 1.14 USD/份',
  },
  {
    id: 'yr-006',
    assetId: 'rwa-010',
    assetSymbol: 'ZSINF-SOLAR',
    type: 'distribution',
    period: '2026 Q2',
    amountPerUnit: 0.42,
    totalAmount: 184000,
    currency: 'USD',
    yieldRate: 6.84,
    paymentDate: '2026-07-10',
    recordDate: '2026-07-05',
    exDividendDate: '2026-07-03',
    recipients: 2840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 6.62,
    projectedYield: 6.84,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '太阳能基础设施 季度分配 0.42 USD/份',
  },
  {
    id: 'yr-007',
    assetId: 'rwa-013',
    assetSymbol: 'ZSTB-CORP',
    type: 'coupon',
    period: '2026 H1',
    amountPerUnit: 2.71,
    totalAmount: 624000,
    currency: 'USD',
    yieldRate: 5.42,
    paymentDate: '2026-07-12',
    recordDate: '2026-07-05',
    exDividendDate: '2026-07-03',
    recipients: 3840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 5.42,
    projectedYield: 5.42,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '投资级公司债 半年票息 2.71 USD/份',
  },
  {
    id: 'yr-008',
    assetId: 'rwa-015',
    assetSymbol: 'ZSINF-WIND',
    type: 'distribution',
    period: '2026 Q2',
    amountPerUnit: 0.30,
    totalAmount: 384000,
    currency: 'USD',
    yieldRate: 6.42,
    paymentDate: '2026-07-15',
    recordDate: '2026-07-10',
    exDividendDate: '2026-07-08',
    recipients: 1840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 6.18,
    projectedYield: 6.42,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '海上风电 季度分配 0.30 USD/份',
  },


  {
    id: 'yr-009',
    assetId: 'rwa-004',
    assetSymbol: 'ZSAU-100',
    type: 'appreciation',
    period: '2026 07',
    amountPerUnit: 28.42,
    totalAmount: 484000,
    currency: 'USD',
    yieldRate: 0,
    paymentDate: '2026-07-31',
    recordDate: '2026-07-25',
    exDividendDate: '2026-07-20',
    recipients: 18420,
    status: 'scheduled',
    taxWithholding: 0,
    reinvestmentOption: false,
    distributionChannel: '链上直接转账',
    historicalYield: 0,
    projectedYield: 0,
    iconBg: 'rgba(255,185,70,0.12)',
    description: '黄金代币 月度估值调整（基于 LBMA 现货）',
  },
  {
    id: 'yr-010',
    assetId: 'rwa-007',
    assetSymbol: 'ZSPE-FUND1',
    type: 'dividend',
    period: '退出时',
    amountPerUnit: 0,
    totalAmount: 0,
    currency: 'USD',
    yieldRate: 0,
    paymentDate: '退出时',
    recordDate: '退出时',
    exDividendDate: '退出时',
    recipients: 480,
    status: 'pending',
    taxWithholding: 0,
    reinvestmentOption: false,
    distributionChannel: '退出时链上转账',
    historicalYield: 0,
    projectedYield: 0,
    iconBg: 'rgba(255,122,107,0.12)',
    description: '科技私募股权基金 I 退出时分配',
  },
  {
    id: 'yr-011',
    assetId: 'rwa-005',
    assetSymbol: 'ZSART-001',
    type: 'appreciation',
    period: '2026 H1',
    amountPerUnit: 4.84,
    totalAmount: 124000,
    currency: 'USD',
    yieldRate: 0,
    paymentDate: '2026-07-15',
    recordDate: '2026-06-30',
    exDividendDate: '2026-06-28',
    recipients: 1240,
    status: 'distributed',
    taxWithholding: 10,
    reinvestmentOption: false,
    distributionChannel: '链上直接转账',
    historicalYield: 0,
    projectedYield: 0,
    iconBg: 'rgba(179,112,255,0.12)',
    description: '蓝筹艺术品基金 半年估值升值',
  },
  {
    id: 'yr-012',
    assetId: 'rwa-012',
    assetSymbol: 'ZSRE-EU2',
    type: 'rental',
    period: '2026 06',
    amountPerUnit: 0.62,
    totalAmount: 184000,
    currency: 'USD',
    yieldRate: 5.84,
    paymentDate: '2026-07-05',
    recordDate: '2026-06-30',
    exDividendDate: '2026-06-28',
    recipients: 1840,
    status: 'distributed',
    taxWithholding: 0,
    reinvestmentOption: true,
    distributionChannel: '链上直接转账',
    historicalYield: 5.62,
    projectedYield: 5.84,
    iconBg: 'rgba(20,184,129,0.12)',
    description: '欧洲物流仓储 月度租金 0.62 USD/份',
  },
];

// ============================================================
// Mock 数据：评估记录（12 个）
// ============================================================

const ORACLE_VALUATIONS: OracleValuation[] = [
  {
    id: 'ov-001',
    assetId: 'rwa-001',
    assetSymbol: 'ZSTB-01',
    valuationFirm: 'S&P-Global-Ratings',
    valuationDate: '2026-07-18',
    nextValuationDate: '2026-07-25',
    valuationMethod: 'market',
    navPerUnit: 102.46,
    previousNav: 102.42,
    changePct: 0.04,
    confidence: 96,
    sampleSize: 24,
    deviation: 0.18,
    status: 'current',
    methodology: '基于国债收益率曲线 + 信用利差定价',
    assumptions: ['无风险利率 4.25%', '信用利差 60 bps', '久期 3.2 年'],
    riskFactors: ['利率风险', '信用风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    auditTrail: ['SPV 提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-002',
    assetId: 'rwa-002',
    assetSymbol: 'ZSRE-NA1',
    valuationFirm: 'CBRE-Valuation',
    valuationDate: '2026-07-15',
    nextValuationDate: '2026-10-15',
    valuationMethod: 'comparable',
    navPerUnit: 99.28,
    previousNav: 98.84,
    changePct: 0.45,
    confidence: 92,
    sampleSize: 18,
    deviation: 1.84,
    status: 'current',
    methodology: '可比交易法 + DCF 双轨验证',
    assumptions: ['资本化率 4.2%', '租金增长率 3.0%', '空置率 5.8%'],
    riskFactors: ['市场风险', '空置风险', '利率风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
    auditTrail: ['SPV 提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-003',
    assetId: 'rwa-004',
    assetSymbol: 'ZSAU-100',
    valuationFirm: 'LBMA-Reference',
    valuationDate: '2026-07-20 04:00',
    nextValuationDate: '2026-07-21 04:00',
    valuationMethod: 'market',
    navPerUnit: 6847.20,
    previousNav: 6824.80,
    changePct: 0.33,
    confidence: 99,
    sampleSize: 12,
    deviation: 0.04,
    status: 'current',
    methodology: '基于 LBMA 现货 AM/PM 定价 + 仓储盘点双轨验证',
    assumptions: ['金条 999.9 ‰ 纯度', 'LBMA 现货参考'],
    riskFactors: ['现货价格波动'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    auditTrail: ['LBMA 现货抓取', '独立盘点', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-004',
    assetId: 'rwa-005',
    assetSymbol: 'ZSART-001',
    valuationFirm: 'Sothebys-Auction-House',
    valuationDate: '2026-07-12',
    nextValuationDate: '2026-10-12',
    valuationMethod: 'comparable',
    navPerUnit: 144.18,
    previousNav: 142.84,
    changePct: 0.94,
    confidence: 84,
    sampleSize: 6,
    deviation: 4.84,
    status: 'current',
    methodology: '基于近期拍卖记录 + 私人洽购价格交叉验证',
    assumptions: ['蓝筹作品流动性折扣 8%', '保管保险溢价 2%'],
    riskFactors: ['艺术品流动性', '市场情绪', '保管风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    auditTrail: ['拍卖行估值', '独立评估师', '链上记账', '投资者可查'],
  },


  {
    id: 'ov-005',
    assetId: 'rwa-007',
    assetSymbol: 'ZSPE-FUND1',
    valuationFirm: 'PitchBook-Data',
    valuationDate: '2026-06-30',
    nextValuationDate: '2026-12-31',
    valuationMethod: 'comparable',
    navPerUnit: 188.42,
    previousNav: 184.20,
    changePct: 2.29,
    confidence: 78,
    sampleSize: 12,
    deviation: 8.42,
    status: 'current',
    methodology: '基于 portfolio 公司最新轮估值 + 流动性折扣',
    assumptions: ['早期估值折扣 20%', 'LP 转让折扣 10%'],
    riskFactors: ['估值波动', '退出风险', '流动性'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    auditTrail: ['GP 估值', '独立机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-006',
    assetId: 'rwa-010',
    assetSymbol: 'ZSINF-SOLAR',
    valuationFirm: 'KPMG-Valuation',
    valuationDate: '2026-07-15',
    nextValuationDate: '2026-10-15',
    valuationMethod: 'dcf',
    navPerUnit: 25.04,
    previousNav: 24.84,
    changePct: 0.81,
    confidence: 90,
    sampleSize: 8,
    deviation: 1.42,
    status: 'current',
    methodology: 'DCF 模型 + PPA 现金流折现',
    assumptions: ['WACC 6.8%', 'PPA 期限 15 年', '电价 56 EUR/MWh'],
    riskFactors: ['政策风险', '天气风险', '电价波动'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a',
    auditTrail: ['SPV 提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-007',
    assetId: 'rwa-013',
    assetSymbol: 'ZSTB-CORP',
    valuationFirm: 'Moodys-Ratings',
    valuationDate: '2026-07-12',
    nextValuationDate: '2026-10-12',
    valuationMethod: 'market',
    navPerUnit: 102.32,
    previousNav: 102.18,
    changePct: 0.14,
    confidence: 95,
    sampleSize: 24,
    deviation: 0.42,
    status: 'current',
    methodology: '基于成分债二级市场报价 + 收益率曲线',
    assumptions: ['无风险利率 4.25%', '信用利差 117 bps', '久期 4.2 年'],
    riskFactors: ['利率风险', '信用风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    auditTrail: ['SPV 提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-008',
    assetId: 'rwa-015',
    assetSymbol: 'ZSINF-WIND',
    valuationFirm: 'PwC-Valuation',
    valuationDate: '2026-07-15',
    nextValuationDate: '2026-10-15',
    valuationMethod: 'dcf',
    navPerUnit: 18.58,
    previousNav: 18.42,
    changePct: 0.87,
    confidence: 88,
    sampleSize: 6,
    deviation: 1.84,
    status: 'current',
    methodology: 'DCF 模型 + CfD 现金流折现',
    assumptions: ['WACC 7.2%', 'CfD 期限 15 年', '电价 84 GBP/MWh'],
    riskFactors: ['政策风险', '天气风险', '电价波动'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    auditTrail: ['SPV 提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-009',
    assetId: 'rwa-003',
    assetSymbol: 'ZSCN-VCS',
    valuationFirm: 'Verra-Registry',
    valuationDate: '2026-07-19',
    nextValuationDate: '2026-07-20',
    valuationMethod: 'market',
    navPerUnit: 25.04,
    previousNav: 24.42,
    changePct: 2.54,
    confidence: 96,
    sampleSize: 8,
    deviation: 0.18,
    status: 'current',
    methodology: '基于 Verra 注册报价 + 二级市场成交价',
    assumptions: ['Vintage 加成', '地理加价'],
    riskFactors: ['政策风险', '市场流动性'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    auditTrail: ['Verra 报价', '独立验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-010',
    assetId: 'rwa-006',
    assetSymbol: 'ZSIP-MUSIC',
    valuationFirm: 'PwC-Music-Valuation',
    valuationDate: '2026-07-10',
    nextValuationDate: '2026-10-10',
    valuationMethod: 'dcf',
    navPerUnit: 12.52,
    previousNav: 12.42,
    changePct: 0.81,
    confidence: 84,
    sampleSize: 1200,
    deviation: 2.42,
    status: 'current',
    methodology: 'DCF 模型 + 历史版税收入折现',
    assumptions: ['WACC 9.8%', '版税增长率 2.0%', '版权期至 2090'],
    riskFactors: ['流媒体政策', '艺人风险', '市场风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
    auditTrail: ['IP 代理提交', '评估机构验证', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-011',
    assetId: 'rwa-008',
    assetSymbol: 'ZSINV-SME',
    valuationFirm: 'ZS-Factoring-Ltd',
    valuationDate: '2026-07-18',
    nextValuationDate: '2026-07-25',
    valuationMethod: 'market',
    navPerUnit: 101.84,
    previousNav: 101.84,
    changePct: 0.00,
    confidence: 92,
    sampleSize: 240,
    deviation: 0.18,
    status: 'current',
    methodology: '基于票面价值 + 承兑人评级调整',
    assumptions: ['承兑人 A- 评级', '30 天平均到期'],
    riskFactors: ['承兑人违约', '行业集中度'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0xfe0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d',
    auditTrail: ['保理机构估值', 'SPV 提交', '链上记账', '投资者可查'],
  },
  {
    id: 'ov-012',
    assetId: 'rwa-009',
    assetSymbol: 'ZSCOM-OIL',
    valuationFirm: 'SGS-Inspection',
    valuationDate: '2026-07-18',
    nextValuationDate: '2026-10-18',
    valuationMethod: 'market',
    navPerUnit: 84.42,
    previousNav: 84.20,
    changePct: 0.26,
    confidence: 96,
    sampleSize: 12,
    deviation: 0.18,
    status: 'current',
    methodology: '基于 WTI 现货 + 仓储盘点 + 质检报告',
    assumptions: ['WTI 轻质原油', '质检合格'],
    riskFactors: ['油价波动', '仓储风险'],
    iconBg: 'rgba(20,184,129,0.12)',
    reportHash: '0xed0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c',
    auditTrail: ['SGS 抽检', 'SPV 估值', '链上记账', '投资者可查'],
  },
];


// ============================================================
// Mock 数据：流动性池（12 个）
// ============================================================

const LIQUIDITY_POOLS: LiquidityPool[] = [
  {
    id: 'lp-001',
    assetSymbol: 'ZSTB-01',
    assetName: '数字国债凭证 01',
    dex: 'Uniswap-V3',
    chain: 'Ethereum',
    pair: 'ZSTB-01 / USDC',
    tvl: 8420000,
    volume24h: 1240000,
    volume7d: 8420000,
    fees24h: 1240,
    apr: 4.42,
    apy: 4.52,
    utilization: 14.7,
    liquidityDepth: 2480000,
    spread: 8,
    orders24h: 184,
    uniqueTraders: 84,
    priceImpact1k: 0.04,
    priceImpact10k: 0.42,
    priceImpact100k: 4.18,
    feeTier: 0.05,
    iconColor: '#0ECB81',
    iconBg: 'rgba(14,203,129,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Polygon', 'Arbitrum'],
    features: ['深度池', '跨链桥', '限价单', '费率档 0.05%'],
  },
  {
    id: 'lp-002',
    assetSymbol: 'ZSRE-NA1',
    assetName: '北亚不动产组合 A',
    dex: 'Curve-V2',
    chain: 'Ethereum',
    pair: 'ZSRE-NA1 / USDC',
    tvl: 12400000,
    volume24h: 624000,
    volume7d: 4840000,
    fees24h: 1840,
    apr: 5.84,
    apy: 6.02,
    utilization: 5.0,
    liquidityDepth: 6240000,
    spread: 12,
    orders24h: 84,
    uniqueTraders: 42,
    priceImpact1k: 0.02,
    priceImpact10k: 0.18,
    priceImpact100k: 1.84,
    feeTier: 0.30,
    iconColor: '#FFA940',
    iconBg: 'rgba(255,169,64,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Polygon'],
    features: ['稳定池', '低滑点', '限价单', '费率档 0.30%'],
  },
  {
    id: 'lp-003',
    assetSymbol: 'ZSAU-100',
    assetName: '黄金代币 100g',
    dex: 'Uniswap-V3',
    chain: 'Ethereum',
    pair: 'ZSAU-100 / USDC',
    tvl: 18420000,
    volume24h: 3840000,
    volume7d: 24800000,
    fees24h: 3842,
    apr: 8.42,
    apy: 8.78,
    utilization: 20.8,
    liquidityDepth: 5840000,
    spread: 4,
    orders24h: 624,
    uniqueTraders: 184,
    priceImpact1k: 0.02,
    priceImpact10k: 0.18,
    priceImpact100k: 1.84,
    feeTier: 0.05,
    iconColor: '#FFB946',
    iconBg: 'rgba(255,185,70,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Polygon', 'Arbitrum', 'Base'],
    features: ['深度池', '跨链桥', '限价单', '高交易量'],
  },
  {
    id: 'lp-004',
    assetSymbol: 'ZSCN-VCS',
    assetName: 'VCS 碳信用凭证',
    dex: 'QuickSwap',
    chain: 'Polygon',
    pair: 'ZSCN-VCS / USDC',
    tvl: 6240000,
    volume24h: 1840000,
    volume7d: 12400000,
    fees24h: 1840,
    apr: 12.42,
    apy: 13.18,
    utilization: 29.5,
    liquidityDepth: 1840000,
    spread: 8,
    orders24h: 484,
    uniqueTraders: 240,
    priceImpact1k: 0.06,
    priceImpact10k: 0.62,
    priceImpact100k: 6.18,
    feeTier: 0.30,
    iconColor: '#44DBF4',
    iconBg: 'rgba(68,219,244,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Celo', 'Base'],
    features: ['高交易量', '可核销', '限价单', '链上溯源'],
  },
  {
    id: 'lp-005',
    assetSymbol: 'ZSTB-CORP',
    assetName: '投资级公司债',
    dex: 'Curve-V2',
    chain: 'Ethereum',
    pair: 'ZSTB-CORP / USDC',
    tvl: 8420000,
    volume24h: 384000,
    volume7d: 2840000,
    fees24h: 1240,
    apr: 4.84,
    apy: 4.96,
    utilization: 4.6,
    liquidityDepth: 4840000,
    spread: 10,
    orders24h: 64,
    uniqueTraders: 32,
    priceImpact1k: 0.02,
    priceImpact10k: 0.18,
    priceImpact100k: 1.84,
    feeTier: 0.30,
    iconColor: '#0ECB81',
    iconBg: 'rgba(14,203,129,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Polygon'],
    features: ['稳定池', '低滑点', '限价单', '机构偏好'],
  },
  {
    id: 'lp-006',
    assetSymbol: 'ZSCOM-OIL',
    assetName: '原油仓储凭证',
    dex: 'Uniswap-V3',
    chain: 'Ethereum',
    pair: 'ZSCOM-OIL / USDC',
    tvl: 4840000,
    volume24h: 184000,
    volume7d: 1240000,
    fees24h: 92,
    apr: 5.42,
    apy: 5.62,
    utilization: 3.8,
    liquidityDepth: 2480000,
    spread: 12,
    orders24h: 24,
    uniqueTraders: 12,
    priceImpact1k: 0.04,
    priceImpact10k: 0.42,
    priceImpact100k: 4.18,
    feeTier: 0.30,
    iconColor: '#FFC542',
    iconBg: 'rgba(255,197,66,0.12)',
    status: 'warming',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: [],
    features: ['稳定池', '低滑点', '机构偏好', '实物锚定'],
  },


  {
    id: 'lp-007',
    assetSymbol: 'ZSINF-SOLAR',
    assetName: '太阳能基础设施',
    dex: 'Balancer-V2',
    chain: 'Polygon',
    pair: 'ZSINF-SOLAR / USDC',
    tvl: 3240000,
    volume24h: 84000,
    volume7d: 584000,
    fees24h: 84,
    apr: 6.42,
    apy: 6.62,
    utilization: 2.6,
    liquidityDepth: 1840000,
    spread: 16,
    orders24h: 12,
    uniqueTraders: 8,
    priceImpact1k: 0.06,
    priceImpact10k: 0.62,
    priceImpact100k: 6.18,
    feeTier: 0.30,
    iconColor: '#3DDC97',
    iconBg: 'rgba(61,220,151,0.12)',
    status: 'warming',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Base'],
    features: ['稳定池', '绿色金融', '限价单', 'EU 认证'],
  },
  {
    id: 'lp-008',
    assetSymbol: 'ZSART-001',
    assetName: '蓝筹艺术品基金',
    dex: 'SushiSwap',
    chain: 'Ethereum',
    pair: 'ZSART-001 / ETH',
    tvl: 1840000,
    volume24h: 24000,
    volume7d: 184000,
    fees24h: 24,
    apr: 0,
    apy: 0,
    utilization: 1.3,
    liquidityDepth: 1240000,
    spread: 32,
    orders24h: 4,
    uniqueTraders: 4,
    priceImpact1k: 0.18,
    priceImpact10k: 1.84,
    priceImpact100k: 18.42,
    feeTier: 1.00,
    iconColor: '#B370FF',
    iconBg: 'rgba(179,112,255,0.12)',
    status: 'warming',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: [],
    features: ['艺术品池', '高费率', '低流动性', '蓝筹标的'],
  },
  {
    id: 'lp-009',
    assetSymbol: 'ZSIP-MUSIC',
    assetName: '音乐版税收益基金',
    dex: 'Camelot',
    chain: 'Arbitrum',
    pair: 'ZSIP-MUSIC / USDC',
    tvl: 1240000,
    volume24h: 84000,
    volume7d: 484000,
    fees24h: 84,
    apr: 8.42,
    apy: 8.78,
    utilization: 6.8,
    liquidityDepth: 840000,
    spread: 18,
    orders24h: 18,
    uniqueTraders: 12,
    priceImpact1k: 0.12,
    priceImpact10k: 1.18,
    priceImpact100k: 11.84,
    feeTier: 0.30,
    iconColor: '#5DC8FF',
    iconBg: 'rgba(93,200,255,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: [],
    features: ['版税池', '限价单', 'IP 标的', '半年分配'],
  },
  {
    id: 'lp-010',
    assetSymbol: 'ZSINV-SME',
    assetName: '中小企应收账款',
    dex: 'BaseSwap',
    chain: 'Base',
    pair: 'ZSINV-SME / USDC',
    tvl: 4840000,
    volume24h: 184000,
    volume7d: 1240000,
    fees24h: 184,
    apr: 7.84,
    apy: 8.18,
    utilization: 3.8,
    liquidityDepth: 2480000,
    spread: 12,
    orders24h: 18,
    uniqueTraders: 12,
    priceImpact1k: 0.04,
    priceImpact10k: 0.42,
    priceImpact100k: 4.18,
    feeTier: 0.30,
    iconColor: '#FFA940',
    iconBg: 'rgba(255,169,64,0.12)',
    status: 'active',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: [],
    features: ['保理池', '短期到期', '月付息', 'SPV 结构'],
  },
  {
    id: 'lp-011',
    assetSymbol: 'ZSPE-FUND1',
    assetName: '科技私募股权基金 I',
    dex: 'Camelot',
    chain: 'Arbitrum',
    pair: 'ZSPE-FUND1 / USDC',
    tvl: 0,
    volume24h: 0,
    volume7d: 0,
    fees24h: 0,
    apr: 0,
    apy: 0,
    utilization: 0,
    liquidityDepth: 0,
    spread: 0,
    orders24h: 0,
    uniqueTraders: 0,
    priceImpact1k: 0,
    priceImpact10k: 0,
    priceImpact100k: 0,
    feeTier: 0,
    iconColor: '#FF7A6B',
    iconBg: 'rgba(255,122,107,0.12)',
    status: 'frozen',
    lastUpdate: '2025-01-15 00:00:00',
    bridgedChains: [],
    features: ['冻结中', '高门槛', '长期锁仓', '退出分配'],
  },
  {
    id: 'lp-012',
    assetSymbol: 'ZSINF-WIND',
    assetName: '海上风电基础设施',
    dex: 'QuickSwap',
    chain: 'Polygon',
    pair: 'ZSINF-WIND / USDC',
    tvl: 3840000,
    volume24h: 84000,
    volume7d: 584000,
    fees24h: 84,
    apr: 6.42,
    apy: 6.62,
    utilization: 2.2,
    liquidityDepth: 1840000,
    spread: 16,
    orders24h: 12,
    uniqueTraders: 8,
    priceImpact1k: 0.06,
    priceImpact10k: 0.62,
    priceImpact100k: 6.18,
    feeTier: 0.30,
    iconColor: '#3DDC97',
    iconBg: 'rgba(61,220,151,0.12)',
    status: 'warming',
    lastUpdate: '2026-07-20 11:48:18',
    bridgedChains: ['Base'],
    features: ['稳定池', '绿色金融', '限价单', 'EU 认证'],
  },
];


// ============================================================
// Mock 数据：风险事件（12 个）
// ============================================================

const RISK_EVENTS: RiskEvent[] = [
  {
    id: 're-001',
    assetId: 'rwa-008',
    assetSymbol: 'ZSINV-SME',
    type: 'default',
    severity: 'medium',
    status: 'mitigating',
    detectedAt: '2026-06-15 14:24:18',
    resolvedAt: '',
    impactUsd: 124000,
    impactPct: 0.50,
    affectedHolders: 184,
    description: '1 张中小企应收账款逾期 60 天，已启动保理机构代位追偿',
    mitigationSteps: ['保理机构代位追偿', '保险公司理赔', '剩余 239 张正常', '披露 1 季度'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: true,
    resolutionDays: 42,
    iconBg: 'rgba(255,169,64,0.12)',
    relatedEvents: ['lc-007'],
  },
  {
    id: 're-002',
    assetId: 'rwa-005',
    assetSymbol: 'ZSART-001',
    type: 'liquidity',
    severity: 'medium',
    status: 'monitoring',
    detectedAt: '2026-07-10 10:00:00',
    resolvedAt: '',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: '蓝筹艺术品基金 二级流动性下降至 1.3% 警戒线',
    mitigationSteps: ['做市商做市', '回购计划启动', 'Sothebys 拍卖预登记'],
    reportingChannel: '链上事件 + 投资者信函',
    insuranceClaim: false,
    resolutionDays: 90,
    iconBg: 'rgba(255,169,64,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-003',
    assetId: 'rwa-007',
    assetSymbol: 'ZSPE-FUND1',
    type: 'regulatory',
    severity: 'high',
    status: 'mitigating',
    detectedAt: '2026-07-01 09:00:00',
    resolvedAt: '',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: '科技私募股权基金 Reg D 506c 年度复核中，预期 60 天内出结果',
    mitigationSteps: ['律所协助', '提交补充材料', '独立第三方估值', '季度披露'],
    reportingChannel: '链上事件 + 监管申报',
    insuranceClaim: false,
    resolutionDays: 60,
    iconBg: 'rgba(246,70,93,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-004',
    assetId: 'rwa-002',
    assetSymbol: 'ZSRE-NA1',
    type: 'litigation',
    severity: 'low',
    status: 'resolved',
    detectedAt: '2026-04-12 16:00:00',
    resolvedAt: '2026-06-30 12:00:00',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: '香港一处物业租赁纠纷，已通过仲裁解决，未影响 NAV',
    mitigationSteps: ['仲裁解决', '律师函', '保险覆盖', '披露完毕'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: true,
    resolutionDays: 78,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-005',
    assetId: 'rwa-003',
    assetSymbol: 'ZSCN-VCS',
    type: 'market',
    severity: 'low',
    status: 'closed',
    detectedAt: '2026-05-20 08:00:00',
    resolvedAt: '2026-06-10 18:00:00',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: 'VCS 二级市场价格短期波动 18% / 30d，未触发保护机制',
    mitigationSteps: ['持续监控', '披露完毕'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: false,
    resolutionDays: 21,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-006',
    assetId: 'rwa-009',
    assetSymbol: 'ZSCOM-OIL',
    type: 'custodian-risk',
    severity: 'low',
    status: 'monitoring',
    detectedAt: '2026-07-12 10:00:00',
    resolvedAt: '',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: 'DMCC 仓储升级维护中，已通知投资者',
    mitigationSteps: ['仓储升级', '保险覆盖', '保险审计'],
    reportingChannel: '链上事件 + 投资者信函',
    insuranceClaim: false,
    resolutionDays: 30,
    iconBg: 'rgba(255,169,64,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-007',
    assetId: 'rwa-001',
    assetSymbol: 'ZSTB-01',
    type: 'fx',
    severity: 'low',
    status: 'closed',
    detectedAt: '2026-06-25 12:00:00',
    resolvedAt: '2026-07-05 12:00:00',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: '多币种成分债汇率波动在预期范围内',
    mitigationSteps: ['持续监控', '披露完毕'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: false,
    resolutionDays: 10,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-008',
    assetId: 'rwa-010',
    assetSymbol: 'ZSINF-SOLAR',
    type: 'operational',
    severity: 'low',
    status: 'closed',
    detectedAt: '2026-05-15 14:00:00',
    resolvedAt: '2026-06-20 18:00:00',
    impactUsd: 0,
    impactPct: 0.18,
    affectedHolders: 0,
    description: '一座太阳能电站逆变器故障停机 5 天，已修复',
    mitigationSteps: ['故障修复', '保险理赔', '披露完毕'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: true,
    resolutionDays: 36,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-009',
    assetId: 'rwa-006',
    assetSymbol: 'ZSIP-MUSIC',
    type: 'concentration',
    severity: 'low',
    status: 'monitoring',
    detectedAt: '2026-07-15 10:00:00',
    resolvedAt: '',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: 'Top-10 曲目贡献 18% 版税收入，处于监控阈值',
    mitigationSteps: ['持续监控', '曲库分散'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: false,
    resolutionDays: 90,
    iconBg: 'rgba(255,169,64,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-010',
    assetId: 'rwa-013',
    assetSymbol: 'ZSTB-CORP',
    type: 'regulatory',
    severity: 'low',
    status: 'closed',
    detectedAt: '2026-05-10 10:00:00',
    resolvedAt: '2026-06-15 18:00:00',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: 'MAS 季度披露复核通过，无重大事项',
    mitigationSteps: ['合规复核', '披露完毕'],
    reportingChannel: '链上事件 + 监管申报',
    insuranceClaim: false,
    resolutionDays: 36,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-011',
    assetId: 'rwa-014',
    assetSymbol: 'ZSIP-PATENT',
    type: 'regulatory',
    severity: 'medium',
    status: 'open',
    detectedAt: '2026-07-20 11:00:00',
    resolvedAt: '',
    impactUsd: 0,
    impactPct: 0,
    affectedHolders: 0,
    description: '专利池收益基金 II 等待 USPTO 备案及 Reg D 506c 提交',
    mitigationSteps: ['等待备案', '提交补充材料', '律所协助'],
    reportingChannel: '链上事件 + 监管申报',
    insuranceClaim: false,
    resolutionDays: 28,
    iconBg: 'rgba(246,70,93,0.12)',
    relatedEvents: [],
  },
  {
    id: 're-012',
    assetId: 'rwa-015',
    assetSymbol: 'ZSINF-WIND',
    type: 'operational',
    severity: 'low',
    status: 'closed',
    detectedAt: '2026-04-20 16:00:00',
    resolvedAt: '2026-05-10 12:00:00',
    impactUsd: 0,
    impactPct: 0.08,
    affectedHolders: 0,
    description: '海上风电场例行维护停机 3 天，已完成',
    mitigationSteps: ['维护完成', '披露完毕'],
    reportingChannel: '链上事件 + 季度披露',
    insuranceClaim: false,
    resolutionDays: 20,
    iconBg: 'rgba(14,203,129,0.12)',
    relatedEvents: [],
  },
];


// ============================================================
// Mock 数据：集成 API（10 个）
// ============================================================

const INTEGRATION_ENDPOINTS: IntegrationEndpoint[] = [
  {
    id: 'api-001',
    name: '资产列表查询',
    method: 'GET',
    path: '/v1/rwa/assets',
    description: '查询所有上架 RWA 资产列表，支持按类别 / 司法管辖 / 风险等级过滤',
    rateLimit: '100 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read'],
    responseFormat: 'json',
    webhookSupported: false,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/assets',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/assets',
    documentation: 'https://docs.example-zsdex.com/rwa/assets',
    version: 'v1.2',
    deprecationDate: '',
    parameters: [
      { name: 'category', type: 'string', required: false, description: '资产类别：treasury / real-estate / carbon 等' },
      { name: 'jurisdiction', type: 'string', required: false, description: '司法管辖代码' },
      { name: 'limit', type: 'integer', required: false, description: '返回数量（默认 50）' },
      { name: 'offset', type: 'integer', required: false, description: '分页偏移' },
    ],
    responseExample: '{\\n  "data": [\\n    { "id": "rwa-001", "symbol": "ZSTB-01", "name": "数字国债凭证 01" }\\n  ]\\n}',
    category: 'asset',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-002',
    name: '资产详情查询',
    method: 'GET',
    path: '/v1/rwa/assets/:id',
    description: '查询指定 RWA 资产详情，包含合约地址 / 估值 / 风险评分',
    rateLimit: '200 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read'],
    responseFormat: 'json',
    webhookSupported: false,
    sdkAvailable: ['JavaScript', 'Python', 'Go', 'Java'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/assets/rwa-001',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/assets/rwa-001',
    documentation: 'https://docs.example-zsdex.com/rwa/assets/:id',
    version: 'v1.2',
    deprecationDate: '',
    parameters: [
      { name: 'id', type: 'string', required: true, description: '资产 ID' },
    ],
    responseExample: '{\\n  "data": { "id": "rwa-001", "symbol": "ZSTB-01", "nav": 102.46 }\\n}',
    category: 'asset',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-003',
    name: '资产铸造',
    method: 'POST',
    path: '/v1/rwa/assets/:id/mint',
    description: '为指定资产发起铸造请求，需 SPV 签名 + 投资者 KYC 验证',
    rateLimit: '20 / min',
    authType: 'signature',
    requiredScopes: ['rwa:write', 'kyc:verified'],
    responseFormat: 'json',
    webhookSupported: true,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/assets/rwa-001/mint',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/assets/rwa-001/mint',
    documentation: 'https://docs.example-zsdex.com/rwa/mint',
    version: 'v1.1',
    deprecationDate: '',
    parameters: [
      { name: 'id', type: 'string', required: true, description: '资产 ID' },
      { name: 'amount', type: 'string', required: true, description: '铸造数量（最小单位）' },
      { name: 'recipient', type: 'string', required: true, description: '接收方地址' },
      { name: 'spvSignature', type: 'string', required: true, description: 'SPV 签名' },
    ],
    responseExample: '{\\n  "data": { "txHash": "0x...", "status": "pending" }\\n}',
    category: 'asset',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-004',
    name: '资产赎回',
    method: 'POST',
    path: '/v1/rwa/assets/:id/redeem',
    description: '为指定资产发起赎回请求，需通过锁定期检查与赎回费计算',
    rateLimit: '20 / min',
    authType: 'signature',
    requiredScopes: ['rwa:write', 'kyc:verified'],
    responseFormat: 'json',
    webhookSupported: true,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/assets/rwa-001/redeem',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/assets/rwa-001/redeem',
    documentation: 'https://docs.example-zsdex.com/rwa/redeem',
    version: 'v1.1',
    deprecationDate: '',
    parameters: [
      { name: 'id', type: 'string', required: true, description: '资产 ID' },
      { name: 'amount', type: 'string', required: true, description: '赎回数量' },
      { name: 'redeemType', type: 'string', required: true, description: '赎回类型：token / physical' },
    ],
    responseExample: '{\\n  "data": { "txHash": "0x...", "status": "pending" }\\n}',
    category: 'asset',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-005',
    name: '发行方查询',
    method: 'GET',
    path: '/v1/rwa/issuers',
    description: '查询所有发行方机构列表',
    rateLimit: '100 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read'],
    responseFormat: 'json',
    webhookSupported: false,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/issuers',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/issuers',
    documentation: 'https://docs.example-zsdex.com/rwa/issuers',
    version: 'v1.0',
    deprecationDate: '',
    parameters: [],
    responseExample: '{\\n  "data": [\\n    { "id": "iss-001", "name": "ZS-Capital 资管" }\\n  ]\\n}',
    category: 'issuer',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-006',
    name: '托管机构查询',
    method: 'GET',
    path: '/v1/rwa/custodians',
    description: '查询所有托管机构列表',
    rateLimit: '100 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read'],
    responseFormat: 'json',
    webhookSupported: false,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/custodians',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/custodians',
    documentation: 'https://docs.example-zsdex.com/rwa/custodians',
    version: 'v1.0',
    deprecationDate: '',
    parameters: [],
    responseExample: '{\\n  "data": [\\n    { "id": "cus-001", "name": "ZSCustody 信托" }\\n  ]\\n}',
    category: 'custody',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-007',
    name: '生命周期事件流',
    method: 'WS',
    path: '/v1/rwa/lifecycle/stream',
    description: '订阅生命周期事件实时流：铸造 / 转移 / 赎回 / 票息 / 到期 / 销毁 / 锁定 / 解锁 / 估值 / 审计',
    rateLimit: '500 events / sec',
    authType: 'api-key',
    requiredScopes: ['rwa:stream'],
    responseFormat: 'stream',
    webhookSupported: true,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'wss://sandbox.example-zsdex.com/v1/rwa/lifecycle/stream',
    productionUrl: 'wss://api.example-zsdex.com/v1/rwa/lifecycle/stream',
    documentation: 'https://docs.example-zsdex.com/rwa/lifecycle-stream',
    version: 'v1.0',
    deprecationDate: '',
    parameters: [
      { name: 'assetIds', type: 'string[]', required: false, description: '过滤的资产 ID 列表' },
      { name: 'eventTypes', type: 'string[]', required: false, description: '事件类型过滤' },
    ],
    responseExample: '{\\n  "type": "mint", "assetId": "rwa-001", "amount": 240000 \\n}',
    category: 'lifecycle',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-008',
    name: '收益分配查询',
    method: 'GET',
    path: '/v1/rwa/yields',
    description: '查询历史与未来的收益分配记录，支持按资产 / 类型 / 期间过滤',
    rateLimit: '100 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read'],
    responseFormat: 'json',
    webhookSupported: false,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/yields',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/yields',
    documentation: 'https://docs.example-zsdex.com/rwa/yields',
    version: 'v1.0',
    deprecationDate: '',
    parameters: [
      { name: 'assetId', type: 'string', required: false, description: '资产 ID' },
      { name: 'type', type: 'string', required: false, description: '收益类型' },
      { name: 'from', type: 'string', required: false, description: '起始日期 (ISO 8601)' },
    ],
    responseExample: '{\\n  "data": [\\n    { "id": "yr-001", "assetSymbol": "ZSTB-01", "amount": 1842000 }\\n  ]\\n}',
    category: 'yield',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-009',
    name: '评估记录查询',
    method: 'GET',
    path: '/v1/rwa/oracle/valuations',
    description: '查询历史与当前的估值记录，包含评估方法 / 置信度 / 假设',
    rateLimit: '100 / min',
    authType: 'api-key',
    requiredScopes: ['rwa:read', 'oracle:read'],
    responseFormat: 'json',
    webhookSupported: true,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/oracle/valuations',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/oracle/valuations',
    documentation: 'https://docs.example-zsdex.com/rwa/oracle',
    version: 'v1.1',
    deprecationDate: '',
    parameters: [],
    responseExample: '{\\n  "data": [\\n    { "id": "ov-001", "navPerUnit": 102.46 }\\n  ]\\n}',
    category: 'oracle',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'stable',
  },
  {
    id: 'api-010',
    name: '合规验证',
    method: 'POST',
    path: '/v1/rwa/compliance/verify',
    description: '为投资者验证 KYC / 投资者适当性 / 司法管辖许可',
    rateLimit: '50 / min',
    authType: 'oauth',
    requiredScopes: ['compliance:write'],
    responseFormat: 'json',
    webhookSupported: true,
    sdkAvailable: ['JavaScript', 'Python', 'Go'],
    sandboxUrl: 'https://sandbox.example-zsdex.com/v1/rwa/compliance/verify',
    productionUrl: 'https://api.example-zsdex.com/v1/rwa/compliance/verify',
    documentation: 'https://docs.example-zsdex.com/rwa/compliance',
    version: 'v1.0',
    deprecationDate: '',
    parameters: [
      { name: 'userId', type: 'string', required: true, description: '用户 ID' },
      { name: 'assetId', type: 'string', required: true, description: '资产 ID' },
      { name: 'jurisdiction', type: 'string', required: true, description: '用户司法管辖' },
    ],
    responseExample: '{\\n  "data": { "verified": true, "investorType": "professional" }\\n}',
    category: 'compliance',
    iconBg: 'rgba(20,184,129,0.12)',
    status: 'beta',
  },
];


// ============================================================
// 主组件
// ============================================================

export default function PortalRwa() {
  // === Tab 与搜索 ===
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('tvl');
  const [drawer, setDrawer] = useState<{ open: boolean; type: DrawerType; payload: any }>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [integrateOpen, setIntegrateOpen] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState<string>('api-001');

  // === KPI 实时数据 ===
  const [kpi, setKpi] = useState({
    totalRwaTvl: 1248000000,
    totalAssets: 15,
    totalIssuers: 12,
    totalCustodians: 10,
    totalComplianceFrameworks: 10,
    totalHolders: 84200,
    dailyMintVolume: 18420000,
    dailyRedemptionVolume: 8420000,
    dailyLifecycleEvents: 184,
    dailyTransferVolume: 24800000,
    averageYield: 6.42,
    averageLockupDays: 184,
    averageNavPremium: -0.84,
    averageRiskScore: 42,
    defaultRate: 0.04,
    coverageRatio: 96.4,
    auditedRatio: 100,
  });

  // === 实时数据波动 ===
  useEffect(() => {
    const timer = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalRwaTvl: prev.totalRwaTvl + Math.floor(Math.random() * 1248000),
        totalHolders: prev.totalHolders + Math.floor(Math.random() * 4),
        dailyMintVolume: prev.dailyMintVolume + Math.floor(Math.random() * 184000),
        dailyRedemptionVolume: prev.dailyRedemptionVolume + Math.floor(Math.random() * 84000),
        dailyLifecycleEvents: prev.dailyLifecycleEvents + Math.floor(Math.random() * 2),
        dailyTransferVolume: prev.dailyTransferVolume + Math.floor(Math.random() * 124000),
        averageYield: Math.max(4, Math.min(10, prev.averageYield + (Math.random() - 0.5) * 0.04)),
        averageNavPremium: Math.max(-2, Math.min(2, prev.averageNavPremium + (Math.random() - 0.5) * 0.02)),
        averageRiskScore: Math.max(20, Math.min(70, prev.averageRiskScore + (Math.random() - 0.5) * 0.4)),
        coverageRatio: Math.max(94, Math.min(99, prev.coverageRatio + (Math.random() - 0.5) * 0.02)),
      }));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // === 快捷键 ===
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const el = document.getElementById('rwa-search-input');
        el?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
        else if (integrateOpen) setIntegrateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawer.open, helpOpen, integrateOpen]);

  // === 过滤逻辑 ===
  const filteredAssets = useMemo(() => {
    return RWA_ASSETS.filter((a) => {
      if (search && !a.symbol.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterChain !== 'all' && a.chain !== filterChain) return false;
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'tvl': return b.tvl - a.tvl;
        case 'apy': return b.annualYield - a.annualYield;
        case 'mcap': return b.marketCap - a.marketCap;
        case 'change': return b.change24h - a.change24h;
        case 'risk': return a.riskScore - b.riskScore;
        case 'updated': return new Date(b.lastValuation).getTime() - new Date(a.lastValuation).getTime();
        default: return 0;
      }
    });
  }, [search, filterCategory, filterStatus, filterChain, sortBy]);

  const filteredIssuers = useMemo(() => {
    return ISSUERS.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.shortName.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredCustodians = useMemo(() => {
    return CUSTODIANS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.shortName.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredCompliance = useMemo(() => {
    return COMPLIANCE_FRAMEWORKS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredLifecycle = useMemo(() => {
    return LIFECYCLE_EVENTS.filter((l) => !search || l.assetSymbol.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredYields = useMemo(() => {
    return YIELD_RECORDS.filter((y) => !search || y.assetSymbol.toLowerCase().includes(search.toLowerCase()) || y.description.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredOracles = useMemo(() => {
    return ORACLE_VALUATIONS.filter((o) => !search || o.assetSymbol.toLowerCase().includes(search.toLowerCase()) || o.valuationFirm.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredLiquidity = useMemo(() => {
    return LIQUIDITY_POOLS.filter((l) => !search || l.assetSymbol.toLowerCase().includes(search.toLowerCase()) || l.dex.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredRisk = useMemo(() => {
    return RISK_EVENTS.filter((r) => !search || r.assetSymbol.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredApis = useMemo(() => {
    return INTEGRATION_ENDPOINTS.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.path.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  // === 打开 Drawer ===
  const openDrawer = useCallback((type: DrawerType, id: string) => {
    let payload: any = null;
    switch (type) {
      case 'asset': payload = RWA_ASSETS.find((x) => x.id === id); break;
      case 'issuer': payload = ISSUERS.find((x) => x.id === id); break;
      case 'custody': payload = CUSTODIANS.find((x) => x.id === id); break;
      case 'compliance': payload = COMPLIANCE_FRAMEWORKS.find((x) => x.id === id); break;
      case 'lifecycle': payload = LIFECYCLE_EVENTS.find((x) => x.id === id); break;
      case 'yield': payload = YIELD_RECORDS.find((x) => x.id === id); break;
      case 'oracle': payload = ORACLE_VALUATIONS.find((x) => x.id === id); break;
      case 'liquidity': payload = LIQUIDITY_POOLS.find((x) => x.id === id); break;
      case 'risk': payload = RISK_EVENTS.find((x) => x.id === id); break;
      case 'integrate': payload = INTEGRATION_ENDPOINTS.find((x) => x.id === id); break;
    }
    setDrawer({ open: true, type, payload });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);


  // === return ===
  return (
    <div className="min-h-screen pa-page" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`@keyframes pa-fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.pa-stagger-1{animation:pa-fade-up .4s ease both}.pa-stagger-2{animation:pa-fade-up .4s .06s ease both}.pa-stagger-3{animation:pa-fade-up .4s .12s ease both}.pa-stagger-4{animation:pa-fade-up .4s .18s ease both}.pa-stagger-5{animation:pa-fade-up .4s .24s ease both}.pa-stagger-6{animation:pa-fade-up .4s .30s ease both}.pa-pulse{animation:pa-pulse 2.4s ease-in-out infinite}@keyframes pa-pulse{0%,100%{opacity:1}50%{opacity:.5}}.pa-shimmer{position:relative;overflow:hidden}.pa-shimmer::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(20,184,129,.08),transparent);animation:pa-shimmer 2.8s infinite}@keyframes pa-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}.pa-slide-in{animation:pa-slide-in .3s ease}@keyframes pa-slide-in{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}.pa-float{animation:pa-float 3.6s ease-in-out infinite}@keyframes pa-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.pa-bar{transition:width .6s ease}`}</style>

      {/* === Hero === */}
      <section className="px-6 py-8 border-b" style={{ borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={20} style={{ color: BRAND.primary }} />
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>P3.44</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>RWA 现实世界资产中心</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,169,64,0.10)', color: BRAND.amber }}>L4 工业级 · v6 纯黑</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: BRAND.text }}>
                RWA 现实世界资产中心
              </h1>
              <p className="text-sm leading-relaxed max-w-3xl" style={{ color: BRAND.textSub }}>
                链下资产上链 / 资产代币化 / 收益凭证 / 链上确权 / 跨链流通 / 链上溯源。
                与 P3.41 链上资产溯源 + P3.42 跨链互操作 + P3.43 流动性再质押
                形成<strong style={{ color: BRAND.primary }}>"链下资产→上链→再质押→跨链流通→收益"</strong>全栈能力栈。
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                <span className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>技术研究 + 合规研究方向</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>12 个司法管辖</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>10 个合规框架</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>10 类 RWA 资产</span>
                <span className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>实时估值 / 实时分配 / 实时风险</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIntegrateOpen(true)} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.text }}>
                <Code size={14} style={{ color: BRAND.primary }} />API 文档
              </button>
              <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}>
                <HelpCircle size={14} />帮助中心
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* === KPI === */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KpiCard label="RWA 总锁仓" value={formatUsd(kpi.totalRwaTvl)} sub="+12.4% 30d" color={BRAND.primary} idx={1} />
          <KpiCard label="上架资产" value={kpi.totalAssets.toString()} sub="10 类资产" color={BRAND.info} idx={2} />
          <KpiCard label="发行方" value={kpi.totalIssuers.toString()} sub="12 机构" color={BRAND.amber} idx={3} />
          <KpiCard label="托管机构" value={kpi.totalCustodians.toString()} sub="10 机构" color="#B370FF" idx={4} />
          <KpiCard label="投资者数" value={kpi.totalHolders.toLocaleString()} sub="+8/时" color={BRAND.success} idx={5} />
          <KpiCard label="日铸造量" value={formatUsd(kpi.dailyMintVolume)} sub="+184k/时" color={BRAND.info} idx={6} />
          <KpiCard label="日赎回量" value={formatUsd(kpi.dailyRedemptionVolume)} sub="+84k/时" color={BRAND.warning} idx={1} />
          <KpiCard label="日生命周期事件" value={kpi.dailyLifecycleEvents.toString()} sub="+2/时" color="#0ECB81" idx={2} />
          <KpiCard label="日转账量" value={formatUsd(kpi.dailyTransferVolume)} sub="+124k/时" color={BRAND.primary} idx={3} />
          <KpiCard label="平均票息" value={formatPct(kpi.averageYield)} sub="0-9% 区间" color={BRAND.success} idx={4} />
          <KpiCard label="平均锁仓" value={kpi.averageLockupDays.toFixed(0) + ' 天'} sub="0-730 天" color={BRAND.info} idx={5} />
          <KpiCard label="NAV 溢价均值" value={formatPct(kpi.averageNavPremium)} sub="二级流动性" color={BRAND.amber} idx={6} />
        </div>
      </section>

      {/* === 实时数据条 === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto p-3 rounded-xl flex items-center gap-3 overflow-x-auto" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: BRAND.primary }}>
            <Activity size={12} className="pa-pulse" />实时数据
          </span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>总锁仓 <strong className="tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(kpi.totalRwaTvl)}</strong></span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>票息均值 <strong className="tabular-nums" style={{ color: BRAND.success }}>{formatPct(kpi.averageYield)}</strong></span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>保险覆盖 <strong className="tabular-nums" style={{ color: BRAND.primary }}>{formatPct(kpi.coverageRatio)}</strong></span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>风险评分均值 <strong className="tabular-nums" style={{ color: BRAND.amber }}>{kpi.averageRiskScore.toFixed(1)}</strong></span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>违约率 <strong className="tabular-nums" style={{ color: BRAND.danger }}>{formatPct(kpi.defaultRate, 2)}</strong></span>
          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
          <span className="text-[10px]" style={{ color: BRAND.text }}>审计率 <strong className="tabular-nums" style={{ color: BRAND.success }}>{kpi.auditedRatio.toFixed(0)}%</strong></span>
        </div>
      </section>

      {/* === 搜索 + 过滤 === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input id="rwa-search-input" type="text" placeholder="搜索资产 / 发行方 / 托管 / API ...  按 / 键聚焦" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <option value="tvl">按 TVL 排序</option>
            <option value="apy">按票息排序</option>
            <option value="mcap">按市值排序</option>
            <option value="change">按 24h 涨幅</option>
            <option value="risk">按风险评分</option>
            <option value="updated">按最近估值</option>
          </select>
        </div>
      </section>

      {/* === Tab Bar === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto pb-2">
          {([
            { k: 'overview', l: '总览', i: <BarChart3 size={14} /> },
            { k: 'assets', l: '资产项目', i: <Coins size={14} /> },
            { k: 'issuer', l: '发行方', i: <Briefcase size={14} /> },
            { k: 'custody', l: '托管', i: <Vault size={14} /> },
            { k: 'compliance', l: '合规', i: <ShieldCheck size={14} /> },
            { k: 'lifecycle', l: '生命周期', i: <Workflow size={14} /> },
            { k: 'yield', l: '收益', i: <TrendingUp size={14} /> },
            { k: 'oracle', l: '评估', i: <Calculator size={14} /> },
            { k: 'liquidity', l: '二级流动', i: <GitBranch size={14} /> },
            { k: 'risk', l: '风险', i: <ShieldAlert size={14} /> },
            { k: 'integrate', l: 'API', i: <Webhook size={14} /> },
            { k: 'help', l: '帮助', i: <HelpCircle size={14} /> },
          ] as { k: Tab; l: string; i: React.ReactNode }[]).map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap`} style={{ backgroundColor: tab === t.k ? BRAND.primaryLt : BRAND.card, color: tab === t.k ? BRAND.primary : BRAND.textSub, border: `1px solid ${tab === t.k ? BRAND.primary : BRAND.border}` }}>
              {t.i}{t.l}
            </button>
          ))}
        </div>
      </section>


      {/* === Tabs 内容 === */}
      <section className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* === Overview Tab === */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Building2 size={14} style={{ color: BRAND.primary }} />RWA 行业全景 · 链下资产→上链→再质押→跨链流通
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  覆盖 <strong style={{ color: BRAND.text }}>国债 / 不动产 / 碳信用 / 贵金属 / 艺术品 / 知识产权 / 私募股权 / 应收账款 / 大宗商品 / 基础设施</strong> 等 10 大类 RWA 资产，
                  整合 <strong style={{ color: BRAND.text }}>{ISSUERS.length}</strong> 家发行方、<strong style={{ color: BRAND.text }}>{CUSTODIANS.length}</strong> 家托管机构、<strong style={{ color: BRAND.text }}>{COMPLIANCE_FRAMEWORKS.length}</strong> 个合规框架，
                  支持 <strong style={{ color: BRAND.primary }}>{INTEGRATION_ENDPOINTS.length}</strong> 个 API 端点，实时为投资者提供代币化资产发行 / 估值 / 分配 / 风险监控全栈能力。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <CategoryStatCard label="国债 / 债券" count={2} tvl={308400000} color="#0ECB81" idx={1} />
                <CategoryStatCard label="不动产" count={2} tvl={284420000} color="#FFA940" idx={2} />
                <CategoryStatCard label="碳信用" count={2} tvl={50840000} color="#44DBF4" idx={3} />
                <CategoryStatCard label="贵金属" count={1} tvl={124200000} color="#FFB946" idx={4} />
                <CategoryStatCard label="艺术品" count={1} tvl={18420000} color="#B370FF" idx={5} />
                <CategoryStatCard label="知识产权" count={2} tvl={14262000} color="#5DC8FF" idx={6} />
                <CategoryStatCard label="私募股权" count={1} tvl={64200000} color="#FF7A6B" idx={1} />
                <CategoryStatCard label="应收账款" count={1} tvl={24800000} color="#FFA940" idx={2} />
                <CategoryStatCard label="大宗商品" count={1} tvl={38420000} color="#FFC542" idx={3} />
                <CategoryStatCard label="基础设施" count={2} tvl={43220000} color="#3DDC97" idx={4} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Layers size={14} style={{ color: BRAND.primary }} />最近生命周期事件
                  </h4>
                  <div className="space-y-2">
                    {filteredLifecycle.slice(0, 6).map((l, i) => (
                      <div key={l.id} className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-white/5" onClick={() => openDrawer('lifecycle', l.id)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${LIFECYCLE_TYPE_COLORS[l.type]}20`, color: LIFECYCLE_TYPE_COLORS[l.type] }}>{LIFECYCLE_TYPE_LABELS[l.type]}</span>
                          <span className="text-xs truncate" style={{ color: BRAND.text }}>{l.assetSymbol}</span>
                          <span className="text-[10px] truncate" style={{ color: BRAND.textMuted }}>{l.description}</span>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-[10px] tabular-nums" style={{ color: BRAND.textMuted }}>{formatTimeAgo(l.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl pa-stagger-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                    <ShieldAlert size={14} style={{ color: BRAND.danger }} />风险事件与监控
                  </h4>
                  <div className="space-y-2">
                    {filteredRisk.slice(0, 6).map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-white/5" onClick={() => openDrawer('risk', r.id)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${SEVERITY_COLORS[r.severity]}20`, color: SEVERITY_COLORS[r.severity] }}>{r.severity.toUpperCase()}</span>
                          <span className="text-xs truncate" style={{ color: BRAND.text }}>{r.assetSymbol}</span>
                          <span className="text-[10px] truncate" style={{ color: BRAND.textMuted }}>{r.description}</span>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-[10px] tabular-nums" style={{ color: BRAND.textMuted }}>{r.status === 'open' || r.status === 'monitoring' || r.status === 'mitigating' ? '处理中' : r.status === 'closed' || r.status === 'resolved' ? '已关闭' : r.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === Assets Tab === */}
          {tab === 'assets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 pa-stagger-1">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部分类</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部状态</option>
                  <option value="live">运行中</option>
                  <option value="pending">待发行</option>
                  <option value="matured">已到期</option>
                  <option value="redeemed">已赎回</option>
                  <option value="paused">已暂停</option>
                  <option value="compliance-review">合规审查</option>
                </select>
                <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部公链</option>
                  {Array.from(new Set(RWA_ASSETS.map((a) => a.chain))).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-xs" style={{ color: BRAND.textMuted }}>共 <strong style={{ color: BRAND.primary }}>{filteredAssets.length}</strong> 个资产</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredAssets.map((a, i) => (
                  <div key={a.id} className={`p-4 rounded-xl cursor-pointer pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('asset', a.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: a.iconBg, color: a.iconColor }}>{a.iconColor.includes('FFA') || a.iconColor.includes('FFB') || a.iconColor.includes('FFC') ? <Coins size={18} /> : a.iconColor.includes('B37') ? <Gem size={18} /> : a.iconColor.includes('5DC') ? <Lightbulb size={18} /> : a.iconColor.includes('FF7') ? <Briefcase size={18} /> : a.iconColor.includes('3DD') ? <Trees size={18} /> : a.iconColor.includes('44D') ? <Trees size={18} /> : <DollarSign size={18} />}</div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                            {a.symbol}
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${CATEGORY_COLORS[a.category]}20`, color: CATEGORY_COLORS[a.category] }}>{CATEGORY_LABELS[a.category]}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${ASSET_STATUS_BADGE[a.status].color}20`, color: ASSET_STATUS_BADGE[a.status].color }}>{ASSET_STATUS_BADGE[a.status].label}</span>
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{a.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>${a.price.toFixed(2)}</div>
                        <div className="text-[10px]" style={{ color: a.change24h >= 0 ? BRAND.success : BRAND.danger }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(a.tvl)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>票息</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: a.annualYield > 0 ? BRAND.success : BRAND.textMuted }}>{a.annualYield > 0 ? formatPct(a.annualYield) : '—'}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>NAV</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>${a.nav.toFixed(2)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>评级</div>
                        <div className="text-[11px] font-bold" style={{ color: RISK_RATING_COLORS[a.riskRating] || BRAND.text }}>{a.riskRating}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>发行方: {a.issuer}</span>
                      <span>·</span>
                      <span>托管: {a.custodian}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>持有: {a.holders.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Issuer Tab 发行方 === */}
          {tab === 'issuer' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Building2 size={14} style={{ color: BRAND.primary }} />发行方矩阵 · 资质 / 牌照 / 评级 / 累计发行 / 历史违约
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  整合 {ISSUERS.length} 家发行方，覆盖 SPV / 持牌机构 / 产业方 / 国资平台 / 金融机构 / 科技公司 等多形态，
                  实时披露 注册资本 / 牌照 / 评级 / 累计发行规模 / 实际控制人 / 审计机构 / 历史违约 / 司法案例，为投资者提供"穿透式"发行方风险画像。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {ISSUERS.map((is, i) => (
                  <div key={is.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('issuer', is.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: is.iconBg, color: is.iconColor }}>{(is.shortName || is.name).slice(0, 2)}</div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                            {is.name}
                            <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${is.creditColor}20`, color: is.creditColor }}>信用 {is.creditRating}</span>
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{is.legalForm} · {is.jurisdiction} · 成立 {is.foundedYear} 年</div>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${is.creditColor}20`, color: is.creditColor }}>{is.type}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>累计发行</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(is.totalIssued)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>在管规模</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(is.aum)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>违约率</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: is.defaultRate > 0.1 ? BRAND.danger : BRAND.success }}>{formatPct(is.defaultRate * 100)}</div>
                      </div>
                    </div>
                    <div className="text-[10px] flex items-center gap-2 flex-wrap" style={{ color: BRAND.textMuted }}>
                      <span>注册资本: {is.registeredCapital}</span>
                      <span>·</span>
                      <span>牌照: {is.licenses.length} 项</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>审计: {is.auditor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Custody Tab 托管 === */}
          {tab === 'custody' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Shield size={14} style={{ color: BRAND.primary }} />托管机构矩阵 · 牌照 / 资产隔离 / 保险 / 审计
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  接入 {CUSTODIANS.length} 家持牌托管机构，覆盖银行 / 信托 / 持牌托管 / 银行子公司 / 保险资管 等多形态。
                  实时披露 托管规模 / 资产隔离方式 / 保险覆盖 / 审计频率 / 储备金比例 / 风险准备金 / 历史赔付 / SOC 报告 / 监管牌照，
                  为投资者提供链下资产"真实持有"的可验证凭证。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {CUSTODIANS.map((c, i) => (
                  <div key={c.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('custody', c.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: c.iconBg, color: c.iconColor }}>{(c.shortName || c.name).slice(0, 2)}</div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: BRAND.text }}>{c.name}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{c.type} · {c.jurisdiction}</div>
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${c.statusColor}20`, color: c.statusColor }}>{c.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>托管规模</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(c.custodyAum)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>资产隔离</div>
                        <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{c.assetSegregation}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>保险覆盖</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.success }}>{formatUsd(c.insuranceCoverage)}</div>
                      </div>
                    </div>
                    <div className="text-[10px] flex items-center gap-2 flex-wrap" style={{ color: BRAND.textMuted }}>
                      <span>储备金: {formatPct(c.reserveRatio * 100)}</span>
                      <span>·</span>
                      <span>审计: {c.auditFrequency}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>牌照: {c.licenses.length} 项</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Compliance Tab 合规框架 === */}
          {tab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <FileCheck size={14} style={{ color: BRAND.primary }} />合规框架矩阵 · 12 司法管辖 / 10 框架 / KYC / AML / 证券认定
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  覆盖 {COMPLIANCE_FRAMEWORKS.length} 个合规框架（SEC Reg D / Reg S / Reg A+ / MiFID II / MAS / JFSA / HK SFC / ESMA / FINMA / CSSF / ADGM / CIMA），
                  实时披露 投资者资格 / 持仓上限 / 转让限制 / 反洗钱 / 税务披露 / 数据跨境 / 争议解决 / 司法案例，为 RWA 资产跨境发行提供完整合规底座。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMPLIANCE_FRAMEWORKS.map((cf, i) => (
                  <div key={cf.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('compliance', cf.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                          {cf.name}
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${cf.iconColor}20`, color: cf.iconColor }}>{cf.shortName}</span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{cf.jurisdiction} · {cf.authority}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${cf.statusColor}20`, color: cf.statusColor }}>{cf.status}</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: BRAND.textMuted }}>{cf.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>投资者上限</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{cf.maxInvestors === 0 ? '无限' : cf.maxInvestors.toLocaleString()}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>单笔最低</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(cf.minInvestment)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>KYC: {cf.kycLevel}</span>
                      <span>·</span>
                      <span>AML: {cf.amlLevel}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>{cf.assetsCount} 个资产</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Lifecycle Tab 生命周期事件 === */}
          {tab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Activity size={14} style={{ color: BRAND.primary }} />生命周期事件流 · 发行 / 铸造 / 转让 / 赎回 / 估值 / 风险 全链路
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  实时跟踪 RWA 资产全生命周期事件（资产立项 / 法律意见 / 托管建仓 / 链上映射 / 铸造 / 分配 / 转让 / 估值更新 / 票息分配 / 赎回 / 终止），
                  单日处理 {kpi.dailyLifecycleEvents} 笔，平均确认耗时 <strong style={{ color: BRAND.text }}>{formatTime(2.4)}</strong>，异常率 <strong style={{ color: BRAND.success }}>0.04%</strong>。
                </p>
              </div>

              <div className="space-y-2">
                {LIFECYCLE_EVENTS.slice(0, 20).map((e, i) => (
                  <div key={e.id} className={`p-3 rounded-lg cursor-pointer pa-stagger-${(i % 6) + 1} flex items-center gap-3`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('lifecycle', e.id)}>
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: (LIFECYCLE_TYPE_COLORS[e.type] || BRAND.textMuted) + '20', color: LIFECYCLE_TYPE_COLORS[e.type] || BRAND.textMuted }}>{(LIFECYCLE_TYPE_LABELS[e.type] || e.type)[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                        {LIFECYCLE_TYPE_LABELS[e.type] || e.type}
                        <span className="text-[10px] font-normal" style={{ color: BRAND.textMuted }}>{e.assetSymbol}</span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{e.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{e.amount ? formatUsd(e.amount) : '—'}</div>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>{formatTimeAgo(e.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Yield Tab 收益分配 === */}
          {tab === 'yield' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <TrendingUp size={14} style={{ color: BRAND.primary }} />收益分配记录 · 票息 / 利息 / 股息 / 租金 / 碳信用收益
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  实时跟踪所有 RWA 资产的收益分配记录，资产平均票息 <strong style={{ color: BRAND.primary }}>{formatPct(kpi.averageYield)}</strong>，
                  平均锁定期 <strong style={{ color: BRAND.text }}>{kpi.averageLockupDays} 天</strong>，
                  默认率 <strong style={{ color: BRAND.success }}>{formatPct(kpi.defaultRate)}</strong>，覆盖率 <strong style={{ color: BRAND.success }}>{formatPct(kpi.coverageRatio)}</strong>。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {YIELD_RECORDS.slice(0, 16).map((y, i) => (
                  <div key={y.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('yield', y.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                          {y.assetSymbol}
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary }}>{YIELD_TYPE_LABELS[y.type] || y.type}</span>
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{y.assetName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold tabular-nums" style={{ color: BRAND.success }}>{formatPct(y.annualizedYield)}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>年化</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>本期分配</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(y.totalAmount)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>每份</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>${"{y.perUnit.toFixed(4)}"}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>受益人</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{y.beneficiaries.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>分配周期: {y.frequency}</span>
                      <span>·</span>
                      <span>下次: {y.nextDistribution}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>状态: {y.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Oracle Tab 预言机估值 === */}
          {tab === 'oracle' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BarChart3 size={14} style={{ color: BRAND.primary }} />预言机估值 · NAV / 偏离度 / 偏差监控 / 评估机构
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  实时跟踪所有 RWA 资产的预言机估值记录，平均 NAV 溢价 <strong style={{ color: kpi.averageNavPremium >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(kpi.averageNavPremium)}</strong>，
                  接入 <strong style={{ color: BRAND.text }}>{ORACLE_VALUATIONS.length}</strong> 条评估记录，
                  偏差监控阈值 <strong style={{ color: BRAND.text }}>±2.0%</strong>，异常自动触发重新评估。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ORACLE_VALUATIONS.map((o, i) => (
                  <div key={o.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('oracle', o.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold" style={{ color: BRAND.text }}>{o.assetSymbol}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{o.assetName} · 评估: {o.valuator}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>${"{o.nav.toFixed(2)}"}</div>
                        <div className="text-[10px]" style={{ color: o.deviation >= 0 ? BRAND.success : BRAND.danger }}>{o.deviation >= 0 ? '+' : ''}{formatPct(o.deviation)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>市场</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>${"{o.marketPrice.toFixed(2)}"}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>底层</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(o.underlyingValue)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>置信度</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.success }}>{formatPct(o.confidence)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>频率: {o.frequency}</span>
                      <span>·</span>
                      <span>下次: {o.nextUpdate}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>数据源: {o.dataSources.length} 个</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Liquidity Tab 流动性池 === */}
          {tab === 'liquidity' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Droplet size={14} style={{ color: BRAND.primary }} />流动性池 · 链上 DEX / 跨链桥 / 订单簿 / OTC / RWA-DEX
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  RWA 资产可通过 {LIQUIDITY_POOLS.length} 个流动性池进行二级流通（DEX 池 / 借贷协议抵押 / 订单簿 / OTC 撮合 / 跨链桥 / 收益聚合），
                  实时跟踪 TVL / 流动性深度 / 滑点 / 手续费 / 激励计划 / LP 持仓。
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {LIQUIDITY_POOLS.map((p, i) => (
                  <div key={p.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('liquidity', p.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold" style={{ color: BRAND.text }}>{p.name}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{p.assets.join(' / ')}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${p.statusColor}20`, color: p.statusColor }}>{p.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(p.tvl)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.volume24h)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>APR</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.success }}>{formatPct(p.apr)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMuted }}>
                      <span>类型: {p.type}</span>
                      <span>·</span>
                      <span>链: {p.chain}</span>
                      <span>·</span>
                      <span style={{ color: BRAND.text }}>LP: {p.lpCount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Risk Tab 风险事件 === */}
          {tab === 'risk' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <AlertTriangle size={14} style={{ color: BRAND.primary }} />风险事件监控 · 估值偏离 / 流动性枯竭 / 违约 / 合规 / 监管
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  实时监控所有 RWA 资产的风险事件（估值偏离 / 流动性枯竭 / 抵押率不足 / 延期兑付 / 监管变化 / 法律纠纷 / 网络安全 / 操作风险），
                  平均风险评分 <strong style={{ color: BRAND.text }}>{kpi.averageRiskScore.toFixed(0)}/100</strong>，
                  覆盖 RWA 资产 {RISK_EVENTS.length} 起历史事件，处置率 <strong style={{ color: BRAND.success }}>96.4%</strong>。
                </p>
              </div>

              <div className="space-y-2">
                {RISK_EVENTS.map((r, i) => (
                  <div key={r.id} className={`p-3 rounded-lg cursor-pointer pa-stagger-${(i % 6) + 1} flex items-center gap-3`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('risk', r.id)}>
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${SEVERITY_COLORS[r.severity] || BRAND.textMuted}20`, color: SEVERITY_COLORS[r.severity] || BRAND.textMuted }}>{r.severity.slice(0, 1).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                        {r.title}
                        <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${SEVERITY_COLORS[r.severity] || BRAND.textMuted}20`, color: SEVERITY_COLORS[r.severity] || BRAND.textMuted }}>{r.severity}</span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{r.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px]" style={{ color: r.status === 'closed' || r.status === 'resolved' ? BRAND.success : BRAND.primary }}>{r.status === 'open' ? '处理中' : r.status === 'monitoring' ? '监控中' : r.status === 'mitigating' ? '缓解中' : r.status === 'closed' || r.status === 'resolved' ? '已关闭' : r.status}</div>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>{formatTimeAgo(r.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Integrate Tab API 集成 === */}
          {tab === 'integrate' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Zap size={14} style={{ color: BRAND.primary }} />API 集成市场 · 资产 / 估值 / 发行 / 合规 / 托管 / 收益
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  提供 {INTEGRATION_ENDPOINTS.length} 个 RWA 相关 API 端点（资产发现 / 估值查询 / 发行提交 / 投资者认证 / 链上交互 / 收益分配），
                  支持 REST / WebSocket / GraphQL 三种协议，统一 OAuth 2.0 + API Key 鉴权，开发者中心提供完整 SDK、文档、测试网、Sandbox。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {INTEGRATION_ENDPOINTS.map((e, i) => (
                  <div key={e.id} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1} cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('integrate', e.id)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                          {e.name}
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: `${e.methodColor}20`, color: e.methodColor }}>{e.method}</span>
                        </div>
                        <div className="text-[10px] mt-0.5 font-mono" style={{ color: BRAND.textMuted }}>{e.path}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${e.statusColor}20`, color: e.statusColor }}>{e.status}</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: BRAND.textMuted }}>{e.description}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>调用量</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{(e.callsTotal / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>成功率</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.success }}>{formatPct(e.successRate)}</div>
                      </div>
                      <div className="p-1.5 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMuted }}>P95 延迟</div>
                        <div className="text-[11px] font-bold tabular-nums" style={{ color: BRAND.text }}>{e.p95Latency}ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Help Tab 帮助 === */}
          {tab === 'help' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <HelpCircle size={14} style={{ color: BRAND.primary }} />帮助中心 · 概念 / 接入 / 风险 / 合规 / 常见问题
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>
                  RWA 现实世界资产中心是中萨数字科技交易所（ZSDEX）面向机构 / 专业投资者 / Web3 开发者 提供的 RWA 一体化服务平台。
                  以下为常见概念、接入方式、风险提示与合规说明。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { q: '什么是 RWA（现实世界资产）？', a: 'RWA（Real World Asset）指将链下实体资产（国债 / 不动产 / 碳信用 / 贵金属 / 艺术品 / 知识产权 / 私募股权 / 应收账款 / 大宗商品 / 基础设施）通过合规结构代币化映射到区块链上，实现链下持有、链上流通、收益分配。本平台定位为技术研究 + 合规研究方向示例。', color: BRAND.primary },
                  { q: '如何参与 RWA 资产投资？', a: '专业投资者需完成 KYC / AML / 投资者资格认证（合格投资者 / 合格买方 / 机构投资者），通过后可在 RWA 市场查看、认购、二级转让。本平台仅作技术演示，不构成投资建议。', color: '#0ECB81' },
                  { q: 'RWA 资产如何估值？', a: '底层资产估值由独立评估机构按月/季度出具 NAV，链上代币价格围绕 NAV 在 ±2% 区间内浮动。偏差超过阈值将触发预言机重估。历史业绩不预示未来表现。', color: '#FFA940' },
                  { q: 'RWA 资产如何赎回？', a: '不同资产赎回条款不同（按日 / 按周 / 按月 / 锁定期后 / 持有到期），可在资产详情查看。赎回可能涉及托管提取 / 跨境结算 / 税务申报，需 1-15 个工作日。', color: '#44DBF4' },
                  { q: 'RWA 资产面临哪些风险？', a: '主要风险包括但不限于：底层资产价格波动 / 流动性不足 / 发行人信用 / 监管政策变化 / 跨境合规 / 托管风险 / 估值风险 / 网络安全 / 操作风险 / 不可抗力。请审慎评估自身风险承受能力。', color: '#FF7A7A' },
                  { q: '本平台是否提供持牌金融服务？', a: '本平台为技术研究 + 合规研究方向示例，仅做技术演示用途，不提供任何受当地金融监管机构监管的金融服务。具体合规边界以当地法律法规及专业法律意见为准。', color: '#B370FF' },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl pa-stagger-${(i % 6) + 1}`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: item.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.q}
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: BRAND.textMuted }}>{item.a}</p>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl pa-stagger-1" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BookOpen size={14} style={{ color: BRAND.primary }} />快捷键
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { k: '/', v: '聚焦搜索' },
                    { k: 'Esc', v: '关闭抽屉 / 弹窗' },
                    { k: '1-9', v: '快速切换 Tab' },
                    { k: '?', v: '打开帮助' },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px] font-mono font-bold" style={{ color: BRAND.primary }}>{item.k}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: BRAND.textMuted }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* === Drawers 抽屉 === */}
      {drawer.open && drawer.type && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={closeDrawer}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
          <div className="relative w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>

            {/* Asset Drawer */}
            {drawer.type === 'asset' && (() => {
              const a = RWA_ASSETS.find((x) => x.id === drawer.payload);
              if (!a) return null;
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                      {a.symbol} · {a.name}
                    </h2>
                    <button onClick={closeDrawer} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>关闭</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>价格</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>${"{a.price.toFixed(2)}"}</div>
                      <div className="text-[9px]" style={{ color: a.change24h >= 0 ? BRAND.success : BRAND.danger }}>{a.change24h >= 0 ? '+' : ''}{formatPct(a.change24h)} (24h)</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>TVL</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(a.tvl)}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>年化票息</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.success }}>{a.annualYield > 0 ? formatPct(a.annualYield) : '—'}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>NAV</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>${"{a.nav.toFixed(2)}"}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>基础信息</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>分类: </span><span style={{ color: BRAND.text }}>{CATEGORY_LABELS[a.category]}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>公链: </span><span style={{ color: BRAND.text }}>{a.chain}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>司法: </span><span style={{ color: BRAND.text }}>{a.jurisdiction}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>状态: </span><span style={{ color: BRAND.text }}>{ASSET_STATUS_BADGE[a.status].label}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>发行方: </span><span style={{ color: BRAND.text }}>{a.issuer}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>托管: </span><span style={{ color: BRAND.text }}>{a.custodian}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>审计: </span><span style={{ color: BRAND.text }}>{a.auditor}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>风险评级: </span><span style={{ color: RISK_RATING_COLORS[a.riskRating] }}>{a.riskRating}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>持有: </span><span style={{ color: BRAND.text }}>{a.holders.toLocaleString()}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>流通: </span><span style={{ color: BRAND.text }}>{a.circulatingSupply.toLocaleString()} / {a.totalSupply.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>合约地址</h4>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div><span style={{ color: BRAND.textMuted }}>Token: </span><span style={{ color: BRAND.text }}>{a.contracts.token}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>Vault: </span><span style={{ color: BRAND.text }}>{a.contracts.vault}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>Registrar: </span><span style={{ color: BRAND.text }}>{a.contracts.registrar}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>Oracle: </span><span style={{ color: BRAND.text }}>{a.contracts.oracle}</span></div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>赎回条款</h4>
                    {a.redemptions.map((r, i) => (
                      <div key={i} className="text-[11px] flex justify-between py-1" style={{ borderBottom: i < a.redemptions.length - 1 ? `1px solid ${BRAND.border}` : 'none' }}>
                        <span style={{ color: BRAND.textMuted }}>{r.period}</span>
                        <span style={{ color: BRAND.text }}>≥ {formatUsd(r.minAmount)} · {(r.feeBps / 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Issuer Drawer */}
            {drawer.type === 'issuer' && (() => {
              const is = ISSUERS.find((x) => x.id === drawer.payload);
              if (!is) return null;
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{is.name}</h2>
                    <button onClick={closeDrawer} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>关闭</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>信用评级</div>
                      <div className="text-sm font-bold" style={{ color: is.creditColor }}>{is.creditRating}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>在管规模</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(is.aum)}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>违约率</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: is.defaultRate > 0.1 ? BRAND.danger : BRAND.success }}>{formatPct(is.defaultRate * 100)}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>基础信息</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>法律形式: </span><span style={{ color: BRAND.text }}>{is.legalForm}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>司法: </span><span style={{ color: BRAND.text }}>{is.jurisdiction}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>成立: </span><span style={{ color: BRAND.text }}>{is.foundedYear}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>注册资本: </span><span style={{ color: BRAND.text }}>{is.registeredCapital}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>类型: </span><span style={{ color: BRAND.text }}>{is.type}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>实控人: </span><span style={{ color: BRAND.text }}>{is.controller}</span></div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>牌照 ({is.licenses.length})</h4>
                    {is.licenses.map((l, i) => (
                      <div key={i} className="text-[10px] flex justify-between py-1" style={{ borderBottom: i < is.licenses.length - 1 ? `1px solid ${BRAND.border}` : 'none' }}>
                        <span style={{ color: BRAND.text }}>{l.name}</span>
                        <span style={{ color: BRAND.textMuted }}>{l.number} · {l.authority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Custody Drawer */}
            {drawer.type === 'custody' && (() => {
              const c = CUSTODIANS.find((x) => x.id === drawer.payload);
              if (!c) return null;
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{c.name}</h2>
                    <button onClick={closeDrawer} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>关闭</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>托管规模</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(c.custodyAum)}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>保险覆盖</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.success }}>{formatUsd(c.insuranceCoverage)}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>储备金</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>{formatPct(c.reserveRatio * 100)}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>托管信息</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>类型: </span><span style={{ color: BRAND.text }}>{c.type}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>司法: </span><span style={{ color: BRAND.text }}>{c.jurisdiction}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>资产隔离: </span><span style={{ color: BRAND.text }}>{c.assetSegregation}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>审计: </span><span style={{ color: BRAND.text }}>{c.auditFrequency}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>审计机构: </span><span style={{ color: BRAND.text }}>{c.auditor}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>保险机构: </span><span style={{ color: BRAND.text }}>{c.insurer}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Compliance Drawer */}
            {drawer.type === 'compliance' && (() => {
              const cf = COMPLIANCE_FRAMEWORKS.find((x) => x.id === drawer.payload);
              if (!cf) return null;
              return (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{cf.name}</h2>
                    <button onClick={closeDrawer} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>关闭</button>
                  </div>
                  <p className="text-xs" style={{ color: BRAND.textMuted }}>{cf.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>司法管辖</div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{cf.jurisdiction}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>监管机构</div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{cf.authority}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>投资者上限</div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{cf.maxInvestors === 0 ? '无限' : cf.maxInvestors.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[9px]" style={{ color: BRAND.textMuted }}>单笔最低</div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>{formatUsd(cf.minInvestment)}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>合规要求</h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>KYC: </span><span style={{ color: BRAND.text }}>{cf.kycLevel}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>AML: </span><span style={{ color: BRAND.text }}>{cf.amlLevel}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>持仓上限: </span><span style={{ color: BRAND.text }}>{cf.holdingLimit}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>转让限制: </span><span style={{ color: BRAND.text }}>{cf.transferRestriction}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>锁定期: </span><span style={{ color: BRAND.text }}>{cf.lockupDays} 天</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>争议解决: </span><span style={{ color: BRAND.text }}>{cf.disputeResolution}</span></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lifecycle / Yield / Oracle / Liquidity / Risk / Integrate drawers - simplified */}
            {(drawer.type === 'lifecycle' || drawer.type === 'yield' || drawer.type === 'oracle' || drawer.type === 'liquidity' || drawer.type === 'risk' || drawer.type === 'integrate') && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold capitalize" style={{ color: BRAND.text }}>{drawer.type} 详情</h2>
                  <button onClick={closeDrawer} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>关闭</button>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <p className="text-xs" style={{ color: BRAND.textMuted }}>本抽屉为占位详情。完整业务字段、历史记录、相关操作请在生产版本查看。</p>
                </div>
                <div className="p-3 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>基本信息</h4>
                  <div className="text-[11px]" style={{ color: BRAND.textMuted }}>ID: {drawer.payload}</div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
