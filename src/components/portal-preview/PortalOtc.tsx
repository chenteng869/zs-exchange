'use client';

/**
 * PortalOtc - 场外大宗交易中心 (2026-07-19 Q05 P3.37)
 *
 * 页面定位：
 * - 中萨数字科技交易所 场外大宗交易中心（OTC Desk）
 * - 总览 / RFQ 询价 / 大宗挂单 / 信用额度 / 成交记录 / 做市商对接 / 结算管理 / 机构服务 / 帮助
 * - 与 P3.25 做市商与流动性 + P3.33 钱包服务 + P3.35 自选行情 + P3.36 NFT 市场配合
 *   面向高净值用户与机构提供专属交易管道、大宗成交、信用额度、定制化服务
 * - 形成"询价 - 报价 - 撮合 - 结算 - 风控"完整 OTC 大宗交易闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / RFQ 询价 / 大宗挂单 / 信用额度 / 成交记录 / 做市商对接 / 结算管理 / 机构服务 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有 OTC 询价 / 挂单 / 信用 / 结算数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"机构级大宗 OTC 交易服务研究方向"定性
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
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
  Briefcase,
  Building2,
  Handshake,
  Send,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Minus,
  Clock,
  Calendar,
  User,
  Users,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  MessageCircle,
  Bell,
  BellOff,
  BellRing,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Gauge,
  Target,
  Zap,
  Rocket,
  Flame,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Wallet,
  Coins,
  CircleDollarSign,
  Banknote,
  CreditCard,
  Tag,
  Tags,
  Hash,
  Globe,
  Globe2,
  MapPin,
  Compass,
  Flag,
  Award,
  Trophy,
  Crown,
  Star,
  Heart,
  Bookmark,
  Eye,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Upload,
  FileText,
  Layers,
  Box,
  Sliders,
  Settings,
  HelpCircle,
  Keyboard,
  Lightbulb,
  BookOpen,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  Share2,
  Sparkles,
  PieChart,
  LineChart,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'rfq' | 'block' | 'credit' | 'history' | 'market-maker' | 'settlement' | 'institution' | 'help';
type AssetSymbol = 'BTC' | 'ETH' | 'SOL' | 'ZSD' | 'USDT' | 'USDC' | 'BNB' | 'AVAX' | 'MATIC' | 'ARB';
type RfqSide = 'buy' | 'sell' | 'both';
type RfqStatus = 'open' | 'quoted' | 'partial' | 'filled' | 'expired' | 'cancelled';
type BlockStatus = 'active' | 'partial' | 'filled' | 'cancelled' | 'expired' | 'settling';
type CreditTier = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'institutional';
type MmStatus = 'active' | 'paused' | 'reviewing' | 'offline';
type SettlementStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'failed' | 'reversed';
type SettlementMethod = 'on-chain' | 'off-chain' | 'internal' | 'escrow';
type DrawerType = 'rfq' | 'block' | 'credit' | 'mm' | 'settlement' | 'institution' | 'create_rfq' | 'create_block' | 'help' | null;

interface RfqRequest {
  id: string;
  asset: AssetSymbol;
  side: RfqSide;
  notional: number;
  quantity?: number;
  limitPrice?: number;
  expiry: string;
  settlementMethod: SettlementMethod;
  status: RfqStatus;
  createdAt: string;
  client: string;
  tier: CreditTier;
  quotesCount: number;
  bestQuote?: number;
  bestQuoteMm?: string;
  description: string;
  isAnonymous: boolean;
}

interface BlockOrder {
  id: string;
  asset: AssetSymbol;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled: number;
  notional: number;
  minFill: number;
  expiry: string;
  status: BlockStatus;
  maker: string;
  isAnonymous: boolean;
  createdAt: string;
  settlementMethod: SettlementMethod;
  counterparties: number;
  description: string;
  premiumPct?: number;
}

interface CreditLine {
  id: string;
  tier: CreditTier;
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  utilization: number;
  interestRate: number;
  collateralRatio: number;
  collateralValue: number;
  expiryAt: string;
  status: 'active' | 'frozen' | 'reviewing' | 'expired';
  dailyLimit: number;
  dailyUsed: number;
  maxSingle: number;
  grantedAt: string;
  reviewAt: string;
}

interface MarketMaker {
  id: string;
  name: string;
  logo: string;
  region: string;
  status: MmStatus;
  rating: number;
  responseRate: number;
  avgResponseTime: number;
  totalVolume: number;
  totalDeals: number;
  supportedAssets: AssetSymbol[];
  joinedAt: string;
  contact: string;
  description: string;
  rfqsActive: number;
  winRate: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
}

interface Settlement {
  id: string;
  rfqOrBlockId: string;
  type: 'rfq' | 'block';
  asset: AssetSymbol;
  amount: number;
  price: number;
  notional: number;
  method: SettlementMethod;
  status: SettlementStatus;
  fromAddr?: string;
  toAddr?: string;
  txHash?: string;
  initiatedAt: string;
  completedAt?: string;
  fee: number;
  counterparty: string;
  remarks?: string;
}

interface Institution {
  id: string;
  name: string;
  logo: string;
  type: 'bank' | 'fund' | 'family-office' | 'corporate' | 'sovereign' | 'market-maker';
  region: string;
  aum: number;
  kybStatus: 'verified' | 'pending' | 'reviewing' | 'rejected';
  joinedAt: string;
  contact: string;
  serviceTier: 'platinum' | 'gold' | 'silver';
  totalVolume: number;
  activeRfqs: number;
  creditLimit: number;
  creditUsed: number;
  description: string;
  customServices: string[];
}

interface KpiSnapshot {
  totalVolume24h: number;
  totalVolume24hChange: number;
  totalVolume30d: number;
  totalDeals24h: number;
  openRfqs: number;
  activeBlocks: number;
  averageSize: number;
  totalMarketMakers: number;
  activeMarketMakers: number;
  creditUtilization: number;
  pendingSettlements: number;
  topAsset: string;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 常量 ==============

const ASSET_LABELS: Record<AssetSymbol, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  ZSD: 'ZSD Token',
  USDT: 'Tether',
  USDC: 'USD Coin',
  BNB: 'BNB',
  AVAX: 'Avalanche',
  MATIC: 'Polygon',
  ARB: 'Arbitrum',
};

const ASSET_COLORS: Record<AssetSymbol, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  ZSD: BRAND.primary,
  USDT: '#26A17B',
  USDC: '#2775CA',
  BNB: '#F3BA2F',
  AVAX: '#E84142',
  MATIC: '#8247E5',
  ARB: '#28A0F0',
};

const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  open: '询价中',
  quoted: '已报价',
  partial: '部分成交',
  filled: '全部成交',
  expired: '已过期',
  cancelled: '已撤销',
};

const BLOCK_STATUS_LABELS: Record<BlockStatus, string> = {
  active: '挂单中',
  partial: '部分成交',
  filled: '全部成交',
  cancelled: '已撤销',
  expired: '已过期',
  settling: '结算中',
};

const CREDIT_TIER_LABELS: Record<CreditTier, string> = {
  v1: 'V1 入门',
  v2: 'V2 进阶',
  v3: 'V3 专业',
  v4: 'V4 资深',
  v5: 'V5 旗舰',
  institutional: '机构级',
};

const MM_TIER_LABELS: Record<MarketMaker['tier'], string> = {
  platinum: '铂金',
  gold: '黄金',
  silver: '白银',
  bronze: '青铜',
};

const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  reversed: '已冲销',
};

const SETTLEMENT_METHOD_LABELS: Record<SettlementMethod, string> = {
  'on-chain': '链上结算',
  'off-chain': '线下结算',
  internal: '内部账户',
  escrow: '托管账户',
};

// ============== 工具 ==============

function formatPrice(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

function formatCurrency(n: number): string {
  return `$${formatPrice(n)}`;
}

function changeColor(c: number): string {
  if (c > 0) return BRAND.primary;
  if (c < 0) return '#FF5050';
  return BRAND.textSub;
}

function changeBg(c: number): string {
  if (c > 0) return 'rgba(20,184,129,0.10)';
  if (c < 0) return 'rgba(255,80,80,0.10)';
  return 'rgba(176,176,176,0.08)';
}

function shortenAddress(addr: string, head: number = 6, tail: number = 4): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

function rfqStatusBadge(s: RfqStatus): { bg: string; fg: string; label: string } {
  if (s === 'open' || s === 'quoted') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, label: RFQ_STATUS_LABELS[s] };
  if (s === 'filled') return { bg: 'rgba(68,219,244,0.10)', fg: BRAND.info, label: RFQ_STATUS_LABELS[s] };
  if (s === 'partial') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', label: RFQ_STATUS_LABELS[s] };
  if (s === 'cancelled' || s === 'expired') return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMute, label: RFQ_STATUS_LABELS[s] };
  return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMute, label: RFQ_STATUS_LABELS[s] };
}

// ============== Mock 数据 ==============

const RFQ_REQUESTS: RfqRequest[] = [
  { id: 'rfq-001', asset: 'BTC', side: 'buy', notional: 5000000, limitPrice: 68000, expiry: '2026-07-20 18:00:00', settlementMethod: 'on-chain', status: 'quoted', createdAt: '2026-07-19 14:24:18', client: 'GS-2024', tier: 'v5', quotesCount: 8, bestQuote: 67842, bestQuoteMm: 'Neon MM', description: '5M USD 等值 BTC 询价，机构大宗买入', isAnonymous: true },
  { id: 'rfq-002', asset: 'ETH', side: 'sell', notional: 2000000, limitPrice: 3850, expiry: '2026-07-20 12:00:00', settlementMethod: 'escrow', status: 'open', createdAt: '2026-07-19 15:18:42', client: 'FO-Aurora', tier: 'v4', quotesCount: 0, description: '2M USD 等值 ETH 卖单询价', isAnonymous: false },
  { id: 'rfq-003', asset: 'SOL', side: 'buy', notional: 800000, limitPrice: 185, expiry: '2026-07-19 22:00:00', settlementMethod: 'on-chain', status: 'filled', createdAt: '2026-07-19 10:08:12', client: 'Helix Capital', tier: 'v3', quotesCount: 6, bestQuote: 184.62, bestQuoteMm: 'Velocity MM', description: '800K USD 等值 SOL 买入', isAnonymous: false },
  { id: 'rfq-004', asset: 'ZSD', side: 'both', notional: 1000000, expiry: '2026-07-21 10:00:00', settlementMethod: 'internal', status: 'partial', createdAt: '2026-07-19 09:42:08', client: 'GS-2024', tier: 'institutional', quotesCount: 4, bestQuote: 1.0, bestQuoteMm: 'Anchor MM', description: '1M ZSD 双边询价', isAnonymous: true },
  { id: 'rfq-005', asset: 'USDT', side: 'sell', notional: 3000000, expiry: '2026-07-20 16:00:00', settlementMethod: 'on-chain', status: 'expired', createdAt: '2026-07-18 20:24:18', client: 'Helix Capital', tier: 'v4', quotesCount: 0, description: '3M USDT 卖单', isAnonymous: false },
];

const BLOCK_ORDERS: BlockOrder[] = [
  { id: 'blk-001', asset: 'BTC', side: 'sell', price: 67850, quantity: 50, filled: 12, notional: 3392500, minFill: 5, expiry: '2026-07-20 22:00:00', status: 'partial', maker: 'GS-2024', isAnonymous: true, createdAt: '2026-07-19 12:18:42', settlementMethod: 'on-chain', counterparties: 3, description: '50 BTC 大宗卖单，可分批成交', premiumPct: 0.01 },
  { id: 'blk-002', asset: 'ETH', side: 'buy', price: 3840, quantity: 800, filled: 800, notional: 3072000, minFill: 100, expiry: '2026-07-19 18:00:00', status: 'filled', maker: 'Helix Capital', isAnonymous: false, createdAt: '2026-07-19 11:08:12', settlementMethod: 'escrow', counterparties: 5, description: '800 ETH 一次性买入', premiumPct: -0.05 },
  { id: 'blk-003', asset: 'SOL', side: 'sell', price: 184.8, quantity: 5000, filled: 0, notional: 924000, minFill: 500, expiry: '2026-07-21 12:00:00', status: 'active', maker: 'FO-Aurora', isAnonymous: true, createdAt: '2026-07-19 14:42:08', settlementMethod: 'on-chain', counterparties: 0, description: '5000 SOL 卖单' },
  { id: 'blk-004', asset: 'ZSD', side: 'buy', price: 1.005, quantity: 1000000, filled: 0, notional: 1005000, minFill: 100000, expiry: '2026-07-22 10:00:00', status: 'active', maker: 'GS-2024', isAnonymous: false, createdAt: '2026-07-19 15:24:18', settlementMethod: 'internal', counterparties: 0, description: '1M ZSD 机构买单' },
  { id: 'blk-005', asset: 'AVAX', side: 'sell', price: 38.5, quantity: 10000, filled: 4500, notional: 385000, minFill: 1000, expiry: '2026-07-20 18:00:00', status: 'settling', maker: 'Helix Capital', isAnonymous: false, createdAt: '2026-07-19 09:08:42', settlementMethod: 'on-chain', counterparties: 2, description: '10000 AVAX 卖单' },
];

const CREDIT_LINES: CreditLine[] = [
  { id: 'cl-001', tier: 'v5', totalLimit: 50000000, usedLimit: 18420000, availableLimit: 31580000, utilization: 36.84, interestRate: 0.045, collateralRatio: 1.5, collateralValue: 84200000, expiryAt: '2027-07-15', status: 'active', dailyLimit: 5000000, dailyUsed: 1240000, maxSingle: 2000000, grantedAt: '2026-01-15', reviewAt: '2026-10-15' },
  { id: 'cl-002', tier: 'v4', totalLimit: 20000000, usedLimit: 8420000, availableLimit: 11580000, utilization: 42.10, interestRate: 0.055, collateralRatio: 1.8, collateralValue: 24800000, expiryAt: '2026-12-31', status: 'active', dailyLimit: 2000000, dailyUsed: 480000, maxSingle: 800000, grantedAt: '2025-12-20', reviewAt: '2026-09-20' },
  { id: 'cl-003', tier: 'v3', totalLimit: 5000000, usedLimit: 1800000, availableLimit: 3200000, utilization: 36.0, interestRate: 0.075, collateralRatio: 2.0, collateralValue: 6200000, expiryAt: '2026-09-30', status: 'reviewing', dailyLimit: 500000, dailyUsed: 240000, maxSingle: 200000, grantedAt: '2025-09-15', reviewAt: '2026-07-25' },
];

const MARKET_MAKERS: MarketMaker[] = [
  { id: 'mm-001', name: 'Neon MM', logo: 'N', region: '新加坡 / 香港', status: 'active', rating: 4.9, responseRate: 98, avgResponseTime: 8, totalVolume: 842000000, totalDeals: 18420, supportedAssets: ['BTC', 'ETH', 'SOL', 'USDT', 'USDC'], joinedAt: '2024-08-15', contact: 'desk@neonmm.example', description: '亚太头部做市商，提供主流币种 24/7 大宗流动性。', rfqsActive: 24, winRate: 68, tier: 'platinum' },
  { id: 'mm-002', name: 'Velocity MM', logo: 'V', region: '伦敦 / 纽约', status: 'active', rating: 4.8, responseRate: 96, avgResponseTime: 12, totalVolume: 624000000, totalDeals: 12480, supportedAssets: ['BTC', 'ETH', 'SOL', 'AVAX'], joinedAt: '2025-02-20', contact: 'otc@velocity.example', description: '欧美机构做市商，专注 ETH / SOL 大宗。', rfqsActive: 18, winRate: 62, tier: 'platinum' },
  { id: 'mm-003', name: 'Anchor MM', logo: 'A', region: '上海 / 深圳', status: 'active', rating: 4.7, responseRate: 94, avgResponseTime: 15, totalVolume: 384000000, totalDeals: 8420, supportedAssets: ['BTC', 'ETH', 'ZSD', 'USDT', 'BNB', 'MATIC'], joinedAt: '2025-04-12', contact: 'desk@anchor.example', description: '大中华区做市商，ZSD 主力做市。', rfqsActive: 14, winRate: 58, tier: 'gold' },
  { id: 'mm-004', name: 'Helix MM', logo: 'H', region: '迪拜 / 利雅得', status: 'active', rating: 4.6, responseRate: 92, avgResponseTime: 18, totalVolume: 248000000, totalDeals: 6240, supportedAssets: ['BTC', 'ETH', 'USDT', 'USDC', 'ARB'], joinedAt: '2025-06-08', contact: 'otc@helix.example', description: '中东做市商，主营中东机构客户。', rfqsActive: 10, winRate: 54, tier: 'gold' },
  { id: 'mm-005', name: 'Pulse MM', logo: 'P', region: '东京 / 首尔', status: 'paused', rating: 4.4, responseRate: 88, avgResponseTime: 22, totalVolume: 124000000, totalDeals: 3840, supportedAssets: ['BTC', 'ETH', 'SOL', 'AVAX'], joinedAt: '2025-08-15', contact: 'desk@pulse.example', description: '日韩做市商。', rfqsActive: 0, winRate: 48, tier: 'silver' },
];

const SETTLEMENTS: Settlement[] = [
  { id: 'st-001', rfqOrBlockId: 'blk-002', type: 'block', asset: 'ETH', amount: 800, price: 3840, notional: 3072000, method: 'escrow', status: 'completed', fromAddr: '0xA1b2...C3d4', toAddr: '0xE5f6...G7h8', txHash: '0xa1b2c3d4...', initiatedAt: '2026-07-19 11:08:12', completedAt: '2026-07-19 11:24:18', fee: 7680, counterparty: 'Neon MM' },
  { id: 'st-002', rfqOrBlockId: 'rfq-003', type: 'rfq', asset: 'SOL', amount: 4332, price: 184.62, notional: 800000, method: 'on-chain', status: 'processing', fromAddr: '0xB2c3...D4e5', toAddr: '0xF6g7...H8i9', txHash: '0xb2c3d4e5...', initiatedAt: '2026-07-19 15:42:08', fee: 800, counterparty: 'Velocity MM' },
  { id: 'st-003', rfqOrBlockId: 'blk-005', type: 'block', asset: 'AVAX', amount: 4500, price: 38.5, notional: 173250, method: 'on-chain', status: 'confirmed', fromAddr: '0xC3d4...E5f6', toAddr: '0xG7h8...I9j0', initiatedAt: '2026-07-19 09:18:42', fee: 433, counterparty: 'Helix MM' },
  { id: 'st-004', rfqOrBlockId: 'rfq-001', type: 'rfq', asset: 'BTC', amount: 73.7, price: 67842, notional: 5000000, method: 'escrow', status: 'pending', initiatedAt: '2026-07-19 16:08:12', fee: 12500, counterparty: 'Neon MM' },
  { id: 'st-005', rfqOrBlockId: 'blk-001', type: 'block', asset: 'BTC', amount: 12, price: 67850, notional: 814200, method: 'on-chain', status: 'completed', fromAddr: '0xD4e5...F6g7', toAddr: '0xH8i9...J0k1', txHash: '0xd4e5f6g7...', initiatedAt: '2026-07-19 12:24:18', completedAt: '2026-07-19 12:42:08', fee: 2035, counterparty: 'Multi-MM' },
];

const INSTITUTIONS: Institution[] = [
  { id: 'inst-001', name: 'GS-2024 Capital', logo: 'G', type: 'fund', region: '香港 / 新加坡', aum: 2400000000, kybStatus: 'verified', joinedAt: '2024-08-15', contact: 'otc@gs2024.example', serviceTier: 'platinum', totalVolume: 1840000000, activeRfqs: 8, creditLimit: 50000000, creditUsed: 18420000, description: '亚太头部对冲基金，专注数字资产多策略。', customServices: ['专属做市', '定制化报告', '白手套结算', '7x24 客户经理'] },
  { id: 'inst-002', name: 'FO-Aurora', logo: 'F', type: 'family-office', region: '上海 / 香港', aum: 820000000, kybStatus: 'verified', joinedAt: '2025-02-20', contact: 'aurora@fo.example', serviceTier: 'platinum', totalVolume: 384000000, activeRfqs: 4, creditLimit: 20000000, creditUsed: 0, description: '家族办公室，跨代际数字资产配置。', customServices: ['专属做市', '托管对接', '税务咨询'] },
  { id: 'inst-003', name: 'Helix Capital', logo: 'H', type: 'fund', region: '伦敦 / 迪拜', aum: 480000000, kybStatus: 'verified', joinedAt: '2025-04-12', contact: 'desk@helix.example', serviceTier: 'gold', totalVolume: 248000000, activeRfqs: 6, creditLimit: 10000000, creditUsed: 4800000, description: '中东主权基金背景多策略基金。', customServices: ['白手套结算', '7x24 客户经理'] },
  { id: 'inst-004', name: 'Nexus Bank', logo: 'N', type: 'bank', region: '新加坡', aum: 12000000000, kybStatus: 'pending', joinedAt: '2026-05-08', contact: 'digital@nexus.example', serviceTier: 'platinum', totalVolume: 0, activeRfqs: 0, creditLimit: 0, creditUsed: 0, description: '新加坡持牌银行，数字资产托管与 OTC。', customServices: ['法币通道', '托管对接', '白手套结算', '合规咨询'] },
  { id: 'inst-005', name: 'Orion Corp', logo: 'O', type: 'corporate', region: '深圳', aum: 240000000, kybStatus: 'reviewing', joinedAt: '2026-06-15', contact: 'treasury@orion.example', serviceTier: 'gold', totalVolume: 24000000, activeRfqs: 2, creditLimit: 5000000, creditUsed: 0, description: '上市公司国库管理。', customServices: ['专属做市', '合规咨询'] },
];

// ============== 主组件 ==============

export function PortalOtc() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState<AssetSymbol | 'all'>('all');
  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqStatus | 'all'>('all');
  const [rfqSideFilter, setRfqSideFilter] = useState<RfqSide | 'all'>('all');
  const [blockStatusFilter, setBlockStatusFilter] = useState<BlockStatus | 'all'>('all');
  const [blockSideFilter, setBlockSideFilter] = useState<'buy' | 'sell' | 'all'>('all');
  const [mmStatusFilter, setMmStatusFilter] = useState<MmStatus | 'all'>('all');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<SettlementStatus | 'all'>('all');
  const [settlementMethodFilter, setSettlementMethodFilter] = useState<SettlementMethod | 'all'>('all');
  const [institutionTypeFilter, setInstitutionTypeFilter] = useState<Institution['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'notional' | 'time' | 'price' | 'volume'>('notional');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [rfqAsset, setRfqAsset] = useState<AssetSymbol>('BTC');
  const [rfqSide, setRfqSide] = useState<RfqSide>('buy');
  const [rfqNotional, setRfqNotional] = useState('');
  const [rfqLimitPrice, setRfqLimitPrice] = useState('');
  const [blockAsset, setBlockAsset] = useState<AssetSymbol>('BTC');
  const [blockSide, setBlockSide] = useState<'buy' | 'sell'>('sell');
  const [blockPrice, setBlockPrice] = useState('');
  const [blockQuantity, setBlockQuantity] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalVolume24h: 84200000,
    totalVolume24hChange: 4.84,
    totalVolume30d: 1840000000,
    totalDeals24h: 84,
    openRfqs: 24,
    activeBlocks: 18,
    averageSize: 1240000,
    totalMarketMakers: 12,
    activeMarketMakers: 10,
    creditUtilization: 38.42,
    pendingSettlements: 6,
    topAsset: 'BTC',
    zsdPrice: 1.0,
  });

  // 实时数据漂移
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalVolume24h: prev.totalVolume24h + Math.floor(Math.random() * 80000 - 30000),
        totalDeals24h: prev.totalDeals24h + (Math.random() < 0.3 ? 1 : 0),
        openRfqs: prev.openRfqs + (Math.random() < 0.2 ? 1 : Math.random() < 0.1 ? -1 : 0),
        activeBlocks: prev.activeBlocks + (Math.random() < 0.15 ? 1 : Math.random() < 0.05 ? -1 : 0),
        averageSize: prev.averageSize + Math.floor(Math.random() * 4000 - 1500),
        pendingSettlements: Math.max(0, prev.pendingSettlements + (Math.random() < 0.2 ? 1 : Math.random() < 0.15 ? -1 : 0)),
      }));
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'Escape') { if (helpOpen) setHelpOpen(false); else if (drawer.open) setDrawer({ open: false, type: null, payload: null }); }
      else if (e.key === '?') { setHelpOpen((p) => !p); }
      else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'rfq', 'block', 'credit', 'history', 'market-maker', 'settlement', 'institution', 'help'];
        const idx = parseInt(e.key, 10) - 1;
        if (tabs[idx]) setTab(tabs[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [helpOpen, drawer.open]);

  const openDrawer = useCallback((type: DrawerType, payload?: string) => {
    setDrawer({ open: true, type, payload: payload ?? null });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  // 过滤 + 排序
  const filteredRfqs = useMemo(() => {
    const lower = search.toLowerCase();
    return RFQ_REQUESTS.filter((r) => {
      if (assetFilter !== 'all' && r.asset !== assetFilter) return false;
      if (rfqStatusFilter !== 'all' && r.status !== rfqStatusFilter) return false;
      if (rfqSideFilter !== 'all' && r.side !== rfqSideFilter) return false;
      if (lower && !r.id.toLowerCase().includes(lower) && !r.client.toLowerCase().includes(lower)) return false;
      return true;
    }).sort((a, b) => {
      const av = sortBy === 'notional' ? a.notional : a.notional;
      const bv = sortBy === 'notional' ? b.notional : b.notional;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [search, assetFilter, rfqStatusFilter, rfqSideFilter, sortBy, sortDir]);

  const filteredBlocks = useMemo(() => {
    return BLOCK_ORDERS.filter((b) => {
      if (assetFilter !== 'all' && b.asset !== assetFilter) return false;
      if (blockStatusFilter !== 'all' && b.status !== blockStatusFilter) return false;
      if (blockSideFilter !== 'all' && b.side !== blockSideFilter) return false;
      return true;
    });
  }, [assetFilter, blockStatusFilter, blockSideFilter]);

  const filteredSettlements = useMemo(() => {
    return SETTLEMENTS.filter((s) => {
      if (settlementStatusFilter !== 'all' && s.status !== settlementStatusFilter) return false;
      if (settlementMethodFilter !== 'all' && s.method !== settlementMethodFilter) return false;
      return true;
    });
  }, [settlementStatusFilter, settlementMethodFilter]);

  const filteredMarketMakers = useMemo(() => {
    return MARKET_MAKERS.filter((m) => {
      if (mmStatusFilter !== 'all' && m.status !== mmStatusFilter) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [mmStatusFilter, search]);

  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS.filter((i) => {
      if (institutionTypeFilter !== 'all' && i.type !== institutionTypeFilter) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [institutionTypeFilter, search]);

  const handleSubmitRfq = useCallback(() => {
    if (!rfqNotional) return;
    alert(`已提交 RFQ 询价：${rfqNotional} USD ${rfqSide === 'buy' ? '买入' : rfqSide === 'sell' ? '卖出' : '双边'} ${rfqAsset}`);
    setRfqNotional('');
    setRfqLimitPrice('');
    closeDrawer();
  }, [rfqAsset, rfqSide, rfqNotional, rfqLimitPrice, closeDrawer]);

  const handleSubmitBlock = useCallback(() => {
    if (!blockPrice || !blockQuantity) return;
    alert(`已提交大宗挂单：${blockQuantity} ${blockAsset} @ ${blockPrice}（${blockSide === 'buy' ? '买' : '卖'}）`);
    setBlockPrice('');
    setBlockQuantity('');
    closeDrawer();
  }, [blockAsset, blockSide, blockPrice, blockQuantity, closeDrawer]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes otc-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes otc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes otc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes otc-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes otc-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes otc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes otc-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,129,0.4); } 50% { box-shadow: 0 0 24px 4px rgba(20,184,129,0.6); } }
        .otc-stagger > * { animation: otc-fade-up 0.4s ease-out both; }
        .otc-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .otc-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .otc-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .otc-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .otc-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .otc-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .otc-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .otc-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .otc-pulse { animation: otc-pulse 2.4s ease-in-out infinite; }
        .otc-float { animation: otc-float 3s ease-in-out infinite; }
        .otc-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: otc-shimmer 2.4s linear infinite; }
        .otc-drawer { animation: otc-slide-in 0.28s ease-out; }
        .otc-bar { transform-origin: bottom; animation: otc-bar 0.6s ease-out; }
        .otc-row:hover { background-color: ${BRAND.cardHover}; }
        .otc-glow { animation: otc-glow 2.4s ease-in-out infinite; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-8 otc-stagger" style={{ background: `linear-gradient(135deg, ${BRAND.bg} 0%, ${BRAND.card} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={18} style={{ color: BRAND.primary }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textSub }}>场外大宗交易中心 · Q05 P3.37</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND.text }}>场外大宗交易中心</h1>
        <p className="text-sm mb-6 max-w-3xl" style={{ color: BRAND.textSub }}>
          面向高净值用户、家族办公室、机构客户的专属 OTC 大宗交易管道：RFQ 询价、大宗挂单、信用额度、多币种结算、白手套服务。
          所有数据为研究演示占位，不构成任何交易或投资建议。
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => openDrawer('create_rfq')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
            <Send size={14} /> 发起 RFQ 询价
          </button>
          <button onClick={() => openDrawer('create_block')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Tag size={14} /> 发布大宗挂单
          </button>
          <button onClick={() => setTab('market-maker')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Users size={14} /> 做市商对接
          </button>
          <button onClick={() => setTab('institution')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Building2 size={14} /> 机构服务
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 otc-stagger" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        {[
          { label: '24h 总成交', value: kpi.totalVolume24h, format: 'currency', change: kpi.totalVolume24hChange, icon: <BarChart3 size={14} /> },
          { label: '30d 总成交', value: kpi.totalVolume30d, format: 'currency' },
          { label: '24h 成交笔数', value: kpi.totalDeals24h, format: 'count' },
          { label: '开放询价', value: kpi.openRfqs, format: 'count' },
          { label: '活跃挂单', value: kpi.activeBlocks, format: 'count' },
          { label: '平均单笔', value: kpi.averageSize, format: 'currency' },
          { label: '做市商总数', value: kpi.totalMarketMakers, format: 'count' },
          { label: '活跃做市商', value: kpi.activeMarketMakers, format: 'count' },
          { label: '信用使用率', value: kpi.creditUtilization, format: 'pct' },
          { label: '待结算', value: kpi.pendingSettlements, format: 'count' },
          { label: '头部资产', value: 0, format: 'text', text: kpi.topAsset },
          { label: 'ZSD 指数', value: kpi.zsdPrice, format: 'price' },
        ].map((it, idx) => {
          const display = it.format === 'currency' ? `$${formatPrice(it.value)}` : it.format === 'count' ? it.value.toLocaleString() : it.format === 'price' ? it.value.toFixed(2) : it.format === 'pct' ? `${it.value.toFixed(2)}%` : it.text;
          return (
            <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                {it.icon && <span style={{ color: BRAND.primary }}>{it.icon}</span>}
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>{it.label}</div>
              </div>
              <div className="text-lg font-bold otc-float" style={{ color: BRAND.text }}>{display}</div>
              {it.change !== undefined && (
                <div className="text-[10px] mt-0.5" style={{ color: changeColor(it.change) }}>
                  {it.change >= 0 ? '+' : ''}{it.change.toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        {[
          { k: 'overview' as Tab, label: '总览', icon: <BarChart3 size={14} /> },
          { k: 'rfq' as Tab, label: 'RFQ 询价', icon: <Send size={14} /> },
          { k: 'block' as Tab, label: '大宗挂单', icon: <Tag size={14} /> },
          { k: 'credit' as Tab, label: '信用额度', icon: <CreditCard size={14} /> },
          { k: 'history' as Tab, label: '成交记录', icon: <FileText size={14} /> },
          { k: 'market-maker' as Tab, label: '做市商对接', icon: <Users size={14} /> },
          { k: 'settlement' as Tab, label: '结算管理', icon: <CheckCircle2 size={14} /> },
          { k: 'institution' as Tab, label: '机构服务', icon: <Building2 size={14} /> },
          { k: 'help' as Tab, label: '帮助', icon: <HelpCircle size={14} /> },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap" style={{ backgroundColor: tab === t.k ? BRAND.primaryLt : BRAND.card, color: tab === t.k ? BRAND.primary : BRAND.textSub, border: `1px solid ${tab === t.k ? BRAND.primary : BRAND.border}` }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 主内容 */}
      <div className="px-6 py-6 space-y-4">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 otc-stagger">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><Send size={14} style={{ color: BRAND.primary }} /> 最新 RFQ 询价</h3>
                <div className="space-y-2">
                  {RFQ_REQUESTS.slice(0, 4).map((r) => {
                    const sb = rfqStatusBadge(r.status);
                    return (
                      <div key={r.id} className="p-2 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('rfq', r.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ASSET_COLORS[r.asset] + '20', color: ASSET_COLORS[r.asset], border: `1px solid ${ASSET_COLORS[r.asset]}40` }}>{r.asset}</div>
                            <div>
                              <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{r.asset} {r.side === 'buy' ? '买入' : r.side === 'sell' ? '卖出' : '双边'}</div>
                              <div className="text-[10px]" style={{ color: BRAND.textMute }}>{r.client} · {r.tier.toUpperCase()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold" style={{ color: BRAND.primary }}>{formatCurrency(r.notional)}</div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><Tag size={14} style={{ color: BRAND.primary }} /> 大宗挂单</h3>
                <div className="space-y-2">
                  {BLOCK_ORDERS.slice(0, 4).map((b) => (
                    <div key={b.id} className="p-2 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('block', b.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ASSET_COLORS[b.asset] + '20', color: ASSET_COLORS[b.asset], border: `1px solid ${ASSET_COLORS[b.asset]}40` }}>{b.asset}</div>
                          <div>
                            <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{b.quantity} {b.asset} @ {b.price}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{b.maker} · 已成交 {b.filled}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold" style={{ color: BRAND.text }}>{formatCurrency(b.notional)}</div>
                          <div className="text-[9px]" style={{ color: BRAND.textMute }}>{(b.filled / b.quantity * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 otc-stagger">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><Users size={14} style={{ color: BRAND.primary }} /> 头部做市商</h3>
                <div className="space-y-2">
                  {MARKET_MAKERS.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-2 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('mm', m.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{m.logo}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{m.name}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>响应率 {m.responseRate}% · {m.tier.toUpperCase()}</div>
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.primary }}>★ {m.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><CreditCard size={14} style={{ color: BRAND.primary }} /> 信用额度</h3>
                <div className="space-y-2">
                  {CREDIT_LINES.slice(0, 2).map((c) => (
                    <div key={c.id} className="p-2 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('credit', c.id)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{CREDIT_TIER_LABELS[c.tier]}</div>
                        <div className="text-[10px]" style={{ color: BRAND.primary }}>{c.utilization.toFixed(1)}%</div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full" style={{ width: `${c.utilization}%`, backgroundColor: BRAND.primary }} />
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>总额度 {formatCurrency(c.totalLimit)} · 已用 {formatCurrency(c.usedLimit)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><Building2 size={14} style={{ color: BRAND.primary }} /> 头部机构</h3>
                <div className="space-y-2">
                  {INSTITUTIONS.slice(0, 3).map((i) => (
                    <div key={i.id} className="p-2 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('institution', i.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{i.logo}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{i.name}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{i.region} · {i.serviceTier.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'rfq' && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <Search size={14} style={{ color: BRAND.textMute }} />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索 RFQ ID / 客户名称（/ 聚焦）" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: BRAND.textMute }} /></button>}
              </div>
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value as AssetSymbol | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部资产</option>
                {(Object.keys(ASSET_LABELS) as AssetSymbol[]).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={rfqSideFilter} onChange={(e) => setRfqSideFilter(e.target.value as RfqSide | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部方向</option>
                <option value="buy">买入</option>
                <option value="sell">卖出</option>
                <option value="both">双边</option>
              </select>
              <select value={rfqStatusFilter} onChange={(e) => setRfqStatusFilter(e.target.value as RfqStatus | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {(Object.keys(RFQ_STATUS_LABELS) as RfqStatus[]).map((s) => <option key={s} value={s}>{RFQ_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="space-y-2 otc-stagger">
              {filteredRfqs.map((r) => {
                const sb = rfqStatusBadge(r.status);
                return (
                  <div key={r.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('rfq', r.id)}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: ASSET_COLORS[r.asset] + '20', color: ASSET_COLORS[r.asset], border: `1px solid ${ASSET_COLORS[r.asset]}40` }}>{r.asset}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.asset} {r.side === 'buy' ? '买入' : r.side === 'sell' ? '卖出' : '双边'}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: r.side === 'buy' ? 'rgba(20,184,129,0.10)' : r.side === 'sell' ? 'rgba(255,80,80,0.10)' : 'rgba(68,219,244,0.10)', color: r.side === 'buy' ? BRAND.primary : r.side === 'sell' ? '#FF5050' : BRAND.info }}>
                            {r.side === 'buy' ? '买入' : r.side === 'sell' ? '卖出' : '双边'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                          {r.isAnonymous && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMute }}>匿名</span>}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>客户 {r.client} · {CREDIT_TIER_LABELS[r.tier]} · {r.createdAt}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold" style={{ color: BRAND.primary }}>{formatCurrency(r.notional)}</div>
                        {r.bestQuote && <div className="text-[10px]" style={{ color: BRAND.textSub }}>最优价 {r.bestQuote}</div>}
                      </div>
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{r.description}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <div style={{ color: BRAND.textMute }}>报价数</div>
                        <div className="font-semibold" style={{ color: BRAND.text }}>{r.quotesCount}</div>
                      </div>
                      <div>
                        <div style={{ color: BRAND.textMute }}>结算方式</div>
                        <div className="font-semibold" style={{ color: BRAND.text }}>{SETTLEMENT_METHOD_LABELS[r.settlementMethod]}</div>
                      </div>
                      <div>
                        <div style={{ color: BRAND.textMute }}>限额价</div>
                        <div className="font-semibold" style={{ color: BRAND.text }}>{r.limitPrice ?? '-'}</div>
                      </div>
                      <div>
                        <div style={{ color: BRAND.textMute }}>到期</div>
                        <div className="font-semibold" style={{ color: BRAND.text }}>{r.expiry.slice(5)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'block' && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value as AssetSymbol | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部资产</option>
                {(Object.keys(ASSET_LABELS) as AssetSymbol[]).map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={blockSideFilter} onChange={(e) => setBlockSideFilter(e.target.value as 'buy' | 'sell' | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部方向</option>
                <option value="buy">买入</option>
                <option value="sell">卖出</option>
              </select>
              <select value={blockStatusFilter} onChange={(e) => setBlockStatusFilter(e.target.value as BlockStatus | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {(Object.keys(BLOCK_STATUS_LABELS) as BlockStatus[]).map((s) => <option key={s} value={s}>{BLOCK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="space-y-2 otc-stagger">
              {filteredBlocks.map((b) => (
                <div key={b.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('block', b.id)}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: ASSET_COLORS[b.asset] + '20', color: ASSET_COLORS[b.asset], border: `1px solid ${ASSET_COLORS[b.asset]}40` }}>{b.asset}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.quantity} {b.asset} @ {b.price}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: b.side === 'buy' ? 'rgba(20,184,129,0.10)' : 'rgba(255,80,80,0.10)', color: b.side === 'buy' ? BRAND.primary : '#FF5050' }}>{b.side === 'buy' ? '买入' : '卖出'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{BLOCK_STATUS_LABELS[b.status]}</span>
                        {b.isAnonymous && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMute }}>匿名</span>}
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>挂单方 {b.maker} · 最小成交 {b.minFill} · 到期 {b.expiry.slice(5)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(b.notional)}</div>
                      {b.premiumPct !== undefined && (
                        <div className="text-[10px]" style={{ color: b.premiumPct >= 0 ? BRAND.primary : '#FF5050' }}>
                          {b.premiumPct >= 0 ? '+' : ''}{b.premiumPct.toFixed(2)}% 溢价
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{b.description}</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div className="h-full" style={{ width: `${(b.filled / b.quantity) * 100}%`, backgroundColor: BRAND.primary }} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]" style={{ color: BRAND.textMute }}>
                    <span>已成交 {b.filled} / {b.quantity}</span>
                    <span>{b.counterparties} 个对手方</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'credit' && (
          <div className="space-y-3 otc-stagger">
            {CREDIT_LINES.map((c) => (
              <div key={c.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('credit', c.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{CREDIT_TIER_LABELS[c.tier]}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>授信时间 {c.grantedAt} · 到期 {c.expiryAt} · 下次复核 {c.reviewAt}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: c.status === 'active' ? 'rgba(20,184,129,0.10)' : c.status === 'reviewing' ? 'rgba(255,180,0,0.10)' : 'rgba(255,80,80,0.10)', color: c.status === 'active' ? BRAND.primary : c.status === 'reviewing' ? '#FFB400' : '#FF5050' }}>
                    {c.status === 'active' ? '生效中' : c.status === 'reviewing' ? '复核中' : c.status === 'frozen' ? '已冻结' : '已过期'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>总额度</div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{formatCurrency(c.totalLimit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>已用</div>
                    <div className="text-lg font-bold" style={{ color: '#FFB400' }}>{formatCurrency(c.usedLimit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>可用</div>
                    <div className="text-lg font-bold" style={{ color: BRAND.primary }}>{formatCurrency(c.availableLimit)}</div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>使用率</div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{c.utilization.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full" style={{ width: `${c.utilization}%`, backgroundColor: BRAND.primary }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>日限额</div>
                    <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(c.dailyLimit)} / {formatCurrency(c.dailyUsed)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>单笔最大</div>
                    <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(c.maxSingle)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>利率</div>
                    <div className="font-semibold" style={{ color: BRAND.text }}>{(c.interestRate * 100).toFixed(2)}%</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>抵押率</div>
                    <div className="font-semibold" style={{ color: BRAND.text }}>{c.collateralRatio.toFixed(2)}x</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {[...SETTLEMENTS].filter((s) => s.status === 'completed').map((s) => (
              <div key={s.id} className="p-3 rounded-lg otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('settlement', s.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ASSET_COLORS[s.asset] + '20', color: ASSET_COLORS[s.asset], border: `1px solid ${ASSET_COLORS[s.asset]}40` }}>{s.asset}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.amount} {s.asset} @ {s.price}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.type === 'rfq' ? 'RFQ' : 'Block'} {s.rfqOrBlockId} · {s.counterparty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatCurrency(s.notional)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.completedAt?.slice(0, 10)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'market-maker' && (
          <>
            <div className="flex gap-2">
              {(['all', 'active', 'paused', 'reviewing', 'offline'] as MmStatus[]).map((s) => (
                <button key={s} onClick={() => setMmStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: mmStatusFilter === s ? BRAND.primaryLt : BRAND.card, color: mmStatusFilter === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${mmStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                  {s === 'all' ? '全部' : s === 'active' ? '服务中' : s === 'paused' ? '已暂停' : s === 'reviewing' ? '审核中' : '离线'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 otc-stagger">
              {filteredMarketMakers.map((m) => (
                <div key={m.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('mm', m.id)}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{m.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold" style={{ color: BRAND.text }}>{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: m.tier === 'platinum' ? 'rgba(20,184,129,0.10)' : m.tier === 'gold' ? 'rgba(255,180,0,0.10)' : m.tier === 'silver' ? 'rgba(176,176,176,0.10)' : 'rgba(176,100,50,0.10)', color: m.tier === 'platinum' ? BRAND.primary : m.tier === 'gold' ? '#FFB400' : m.tier === 'silver' ? BRAND.textSub : '#B46432' }}>{MM_TIER_LABELS[m.tier]}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{m.region} · 入驻 {m.joinedAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold" style={{ color: BRAND.primary }}>★ {m.rating}</div>
                    </div>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{m.description}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <div style={{ color: BRAND.textMute }}>响应率</div>
                      <div className="font-semibold" style={{ color: BRAND.primary }}>{m.responseRate}%</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>响应时间</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{m.avgResponseTime}s</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>成交笔数</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{m.totalDeals.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>累计成交</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(m.totalVolume)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.supportedAssets.map((a) => (
                      <span key={a} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: ASSET_COLORS[a] + '20', color: ASSET_COLORS[a], border: `1px solid ${ASSET_COLORS[a]}40` }}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'settlement' && (
          <>
            <div className="flex gap-2">
              <select value={settlementStatusFilter} onChange={(e) => setSettlementStatusFilter(e.target.value as SettlementStatus | 'all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {(Object.keys(SETTLEMENT_STATUS_LABELS) as SettlementStatus[]).map((s) => <option key={s} value={s}>{SETTLEMENT_STATUS_LABELS[s]}</option>)}
              </select>
              <select value={settlementMethodFilter} onChange={(e) => setSettlementMethodFilter(e.target.value as SettlementMethod | 'all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部方式</option>
                {(Object.keys(SETTLEMENT_METHOD_LABELS) as SettlementMethod[]).map((m) => <option key={m} value={m}>{SETTLEMENT_METHOD_LABELS[m]}</option>)}
              </select>
            </div>
            <div className="space-y-2 otc-stagger">
              {filteredSettlements.map((s) => (
                <div key={s.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('settlement', s.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ASSET_COLORS[s.asset] + '20', color: ASSET_COLORS[s.asset], border: `1px solid ${ASSET_COLORS[s.asset]}40` }}>{s.asset}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.amount} {s.asset} @ {s.price}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMute }}>{s.type === 'rfq' ? 'RFQ' : 'Block'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{SETTLEMENT_METHOD_LABELS[s.method]}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.id} · 对手 {s.counterparty} · 发起 {s.initiatedAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold" style={{ color: BRAND.primary }}>{formatCurrency(s.notional)}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.status === 'completed' ? 'rgba(20,184,129,0.10)' : s.status === 'failed' ? 'rgba(255,80,80,0.10)' : s.status === 'pending' ? 'rgba(255,180,0,0.10)' : 'rgba(68,219,244,0.10)', color: s.status === 'completed' ? BRAND.primary : s.status === 'failed' ? '#FF5050' : s.status === 'pending' ? '#FFB400' : BRAND.info }}>
                        {SETTLEMENT_STATUS_LABELS[s.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'institution' && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <Search size={14} style={{ color: BRAND.textMute }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索机构名称" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
              </div>
              <select value={institutionTypeFilter} onChange={(e) => setInstitutionTypeFilter(e.target.value as Institution['type'] | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部类型</option>
                <option value="bank">银行</option>
                <option value="fund">基金</option>
                <option value="family-office">家族办公室</option>
                <option value="corporate">企业</option>
                <option value="sovereign">主权基金</option>
                <option value="market-maker">做市商</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 otc-stagger">
              {filteredInstitutions.map((i) => (
                <div key={i.id} className="p-4 rounded-xl otc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('institution', i.id)}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{i.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold" style={{ color: BRAND.text }}>{i.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: i.serviceTier === 'platinum' ? 'rgba(20,184,129,0.10)' : i.serviceTier === 'gold' ? 'rgba(255,180,0,0.10)' : 'rgba(176,176,176,0.10)', color: i.serviceTier === 'platinum' ? BRAND.primary : i.serviceTier === 'gold' ? '#FFB400' : BRAND.textSub }}>{i.serviceTier.toUpperCase()}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{i.type === 'bank' ? '银行' : i.type === 'fund' ? '基金' : i.type === 'family-office' ? '家族办公室' : i.type === 'corporate' ? '企业' : i.type === 'sovereign' ? '主权基金' : '做市商'} · {i.region} · 入驻 {i.joinedAt}</div>
                    </div>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{i.description}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <div style={{ color: BRAND.textMute }}>AUM</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(i.aum)}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>累计成交</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(i.totalVolume)}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>活跃 RFQ</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{i.activeRfqs}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>信用</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(i.creditLimit)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {i.customServices.map((s) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'help' && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>快捷键</h3>
              <div className="space-y-2 text-[11px]">
                {[
                  { k: '/', d: '聚焦搜索框' },
                  { k: '?', d: '打开/关闭本页帮助' },
                  { k: 'Esc', d: '关闭 Drawer / 弹窗' },
                  { k: '1-9', d: '快速切换 Tab（1=总览 2=RFQ 3=挂单 4=信用 5=成交 6=做市 7=结算 8=机构 9=帮助）' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center gap-3">
                    <kbd className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</kbd>
                    <span style={{ color: BRAND.text }}>{it.d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
              <p className="mb-2"><strong>合规说明：</strong>本平台场外大宗交易中心为"机构级大宗 OTC 交易服务研究方向"演示页面。</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>所有询价 / 挂单 / 信用 / 结算数据为研究演示占位，不构成任何交易或投资建议</li>
                <li>OTC 大宗交易涉及高额资金、对手方风险、流动性风险，须由具备相应资质的持牌机构提供</li>
                <li>研究阶段不接入真实撮合、结算与资金划转流程</li>
                <li>用户应自行评估对手方信用、资产真实性、合规风险与法律后果</li>
                <li>本平台严格遵守所在司法管辖区的合规要求，不向任何禁止数字资产 OTC 交易的地区提供服务</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div className="px-6 py-6 mt-6" style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>共建机构级 OTC 大宗交易基础设施</div>
            <div className="text-[11px]" style={{ color: BRAND.textSub }}>面向高净值、家族办公室、机构客户提供 RFQ 询价、大宗挂单、信用额度、白手套结算等全链路服务</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openDrawer('create_rfq')} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <Send size={14} /> 发起 RFQ
            </button>
            <button onClick={() => setTab('institution')} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Building2 size={14} /> 申请机构服务
            </button>
            <button onClick={() => setHelpOpen(true)} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'rfq' && drawer.payload && (() => {
        const r = RFQ_REQUESTS.find((x) => x.id === drawer.payload);
        if (!r) return null;
        const sb = rfqStatusBadge(r.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>RFQ 询价详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-base font-bold" style={{ backgroundColor: ASSET_COLORS[r.asset] + '20', color: ASSET_COLORS[r.asset], border: `1px solid ${ASSET_COLORS[r.asset]}40` }}>{r.asset}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{r.asset} {r.side === 'buy' ? '买入' : r.side === 'sell' ? '卖出' : '双边'}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>客户 {r.client} · {CREDIT_TIER_LABELS[r.tier]}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>询价金额</div>
                  <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatCurrency(r.notional)}</div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>{r.description}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>状态</div>
                    <div className="text-base font-bold" style={{ color: sb.fg }}>{sb.label}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>报价数</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{r.quotesCount}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>结算方式</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{SETTLEMENT_METHOD_LABELS[r.settlementMethod]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>限额价</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{r.limitPrice ?? '不限'}</div>
                  </div>
                </div>
                {r.bestQuote && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                    <div className="text-[10px] mb-1">最优报价</div>
                    <div className="text-base font-bold">{r.bestQuote} {r.asset}（来自 {r.bestQuoteMm}）</div>
                  </div>
                )}
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                  <div style={{ color: BRAND.textMute }}>到期</div>
                  <div className="mt-1">{r.expiry}</div>
                </div>
                {r.status === 'open' && (
                  <button onClick={() => alert('已接受报价')} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>接受报价</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'block' && drawer.payload && (() => {
        const b = BLOCK_ORDERS.find((x) => x.id === drawer.payload);
        if (!b) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>大宗挂单详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-base font-bold" style={{ backgroundColor: ASSET_COLORS[b.asset] + '20', color: ASSET_COLORS[b.asset], border: `1px solid ${ASSET_COLORS[b.asset]}40` }}>{b.asset}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{b.quantity} {b.asset} @ {b.price}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>挂单方 {b.maker} · {b.side === 'buy' ? '买入' : '卖出'}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>挂单金额</div>
                  <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatCurrency(b.notional)}</div>
                </div>
                <div className="text-[11px]" style={{ color: BRAND.textSub }}>{b.description}</div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full" style={{ width: `${(b.filled / b.quantity) * 100}%`, backgroundColor: BRAND.primary }} />
                </div>
                <div className="flex items-center justify-between text-[11px]" style={{ color: BRAND.textMute }}>
                  <span>已成交 {b.filled} / {b.quantity}</span>
                  <span>对手方 {b.counterparties} 个</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>状态</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{BLOCK_STATUS_LABELS[b.status]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>最小成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{b.minFill} {b.asset}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>结算方式</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{SETTLEMENT_METHOD_LABELS[b.settlementMethod]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>溢价</div>
                    <div className="text-base font-bold" style={{ color: b.premiumPct !== undefined && b.premiumPct >= 0 ? BRAND.primary : '#FF5050' }}>{b.premiumPct !== undefined ? `${b.premiumPct >= 0 ? '+' : ''}${b.premiumPct.toFixed(2)}%` : '-'}</div>
                  </div>
                </div>
                {b.status === 'active' && (
                  <button onClick={() => alert('已接受部分成交')} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>接受成交（{b.minFill} {b.asset} 起）</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'credit' && drawer.payload && (() => {
        const c = CREDIT_LINES.find((x) => x.id === drawer.payload);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>信用额度详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{CREDIT_TIER_LABELS[c.tier]}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>授信时间 {c.grantedAt} · 到期 {c.expiryAt}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>可用额度</div>
                  <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatCurrency(c.availableLimit)}</div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full" style={{ width: `${c.utilization}%`, backgroundColor: BRAND.primary }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>总额度</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(c.totalLimit)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>已用</div>
                    <div className="text-base font-bold" style={{ color: '#FFB400' }}>{formatCurrency(c.usedLimit)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>日限额</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(c.dailyLimit)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>单笔最大</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(c.maxSingle)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: '1px solid #FFB40040' }}>
                  · 信用额度需定期复核（下次 {c.reviewAt}），可能根据抵押品价值与履约情况调整
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'mm' && drawer.payload && (() => {
        const m = MARKET_MAKERS.find((x) => x.id === drawer.payload);
        if (!m) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>做市商详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{m.logo}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{m.name}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{m.region} · 入驻 {m.joinedAt}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>{m.description}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>响应率</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{m.responseRate}%</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>响应时间</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{m.avgResponseTime}s</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>成交笔数</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{m.totalDeals.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>累计成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(m.totalVolume)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>支持资产</div>
                  <div className="flex flex-wrap gap-1">
                    {m.supportedAssets.map((a) => (
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: ASSET_COLORS[a] + '20', color: ASSET_COLORS[a], border: `1px solid ${ASSET_COLORS[a]}40` }}>{a}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => alert(`已发起对 ${m.name} 的 RFQ`)} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>向此做市商询价</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'settlement' && drawer.payload && (() => {
        const s = SETTLEMENTS.find((x) => x.id === drawer.payload);
        if (!s) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>结算详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{s.amount} {s.asset} @ {s.price}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{s.type === 'rfq' ? 'RFQ' : 'Block'} {s.rfqOrBlockId} · 对手 {s.counterparty}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>结算金额</div>
                  <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatCurrency(s.notional)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>状态</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{SETTLEMENT_STATUS_LABELS[s.status]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>方式</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{SETTLEMENT_METHOD_LABELS[s.method]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>手续费</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{s.fee} {s.asset}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>发起</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{s.initiatedAt.slice(5)}</div>
                  </div>
                </div>
                {s.txHash && (
                  <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                    <div style={{ color: BRAND.textMute }}>交易哈希</div>
                    <div className="font-mono mt-1">{s.txHash}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'institution' && drawer.payload && (() => {
        const i = INSTITUTIONS.find((x) => x.id === drawer.payload);
        if (!i) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>机构详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{i.logo}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{i.name}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{i.region} · 入驻 {i.joinedAt}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>{i.description}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>AUM</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(i.aum)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>累计成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{formatCurrency(i.totalVolume)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>信用额度</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(i.creditLimit)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>服务等级</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{i.serviceTier.toUpperCase()}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>定制化服务</div>
                  <div className="flex flex-wrap gap-1">
                    {i.customServices.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => alert(`已提交机构服务申请：${i.name}`)} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>申请对接</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'create_rfq' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>发起 RFQ 询价</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>资产</label>
                <select value={rfqAsset} onChange={(e) => setRfqAsset(e.target.value as AssetSymbol)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {(Object.keys(ASSET_LABELS) as AssetSymbol[]).map((a) => <option key={a} value={a}>{a} - {ASSET_LABELS[a]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>方向</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['buy', 'sell', 'both'] as RfqSide[]).map((s) => (
                    <button key={s} onClick={() => setRfqSide(s)} className="px-3 py-2 rounded text-xs" style={{ backgroundColor: rfqSide === s ? BRAND.primaryLt : BRAND.card, color: rfqSide === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${rfqSide === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'buy' ? '买入' : s === 'sell' ? '卖出' : '双边'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>询价金额（USD 等值）</label>
                <input value={rfqNotional} onChange={(e) => setRfqNotional(e.target.value)} placeholder="例：1000000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>限额价（可选）</label>
                <input value={rfqLimitPrice} onChange={(e) => setRfqLimitPrice(e.target.value)} placeholder="例：68000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                · RFQ 询价将在 2 小时内收到 5-10 家做市商报价
              </div>
              <button onClick={handleSubmitRfq} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交询价</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'create_block' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>发布大宗挂单</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>资产</label>
                <select value={blockAsset} onChange={(e) => setBlockAsset(e.target.value as AssetSymbol)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {(Object.keys(ASSET_LABELS) as AssetSymbol[]).map((a) => <option key={a} value={a}>{a} - {ASSET_LABELS[a]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>方向</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['buy', 'sell'] as ('buy' | 'sell')[]).map((s) => (
                    <button key={s} onClick={() => setBlockSide(s)} className="px-3 py-2 rounded text-xs" style={{ backgroundColor: blockSide === s ? BRAND.primaryLt : BRAND.card, color: blockSide === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${blockSide === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'buy' ? '买入' : '卖出'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>价格</label>
                <input value={blockPrice} onChange={(e) => setBlockPrice(e.target.value)} placeholder="例：67850" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>数量</label>
                <input value={blockQuantity} onChange={(e) => setBlockQuantity(e.target.value)} placeholder="例：50" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: '1px solid #FFB40040' }}>
                · 大宗挂单将匿名展示给符合资质的对手方，可分批成交
              </div>
              <button onClick={handleSubmitBlock} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>发布挂单</button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto otc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
              <button onClick={() => setHelpOpen(false)} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { k: '/', d: '聚焦搜索框' },
                { k: '?', d: '打开/关闭本页帮助' },
                { k: 'Esc', d: '关闭 Drawer / 弹窗' },
                { k: '1-9', d: '快速切换 Tab' },
              ].map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                  <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                · 快捷键在输入框内不生效，避免干扰表单输入
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
