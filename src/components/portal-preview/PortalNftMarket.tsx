'use client';

/**
 * PortalNftMarket - NFT 二级市场与 IP 流通中心 (2026-07-19 Q05 P3.36)
 *
 * 页面定位：
 * - 中萨数字科技交易所 NFT 二级市场与 IP 流通中心
 * - 总览 / 我的持仓 / 一级申购 / IP 合作市场 / 二级挂单 / 拍卖中心 / 稀有度榜单 / 流通记录 / 帮助
 * - 与 P3.18 Launch 项目发行 + P3.24 生态合作 + P3.28 NFT 数字藏品形成
 *   "一级发行 - IP 合作 - 数字藏品 - 二级流通"完整 NFT 资产生态闭环
 * - 双轮驱动：加密资产 + 数字藏品（IP 合作伙伴天然契合）
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 我的持仓 / 一级申购 / IP 合作市场 / 二级挂单 / 拍卖中心 / 稀有度榜单 / 流通记录 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有藏品 / 拍卖 / 挂单 / IP 数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"NFT 数字藏品二级市场与 IP 流通研究方向"定性
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
  Image as ImageIcon,
  Palette,
  Brush,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Heart,
  Bookmark,
  Tag,
  Tags,
  Eye,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Upload,
  FileText,
  Layers,
  Box,
  Gift,
  Coins,
  CircleDollarSign,
  Wallet,
  Hammer,
  Gavel,
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
  Settings,
  Sliders,
  Bell,
  BellOff,
  BellRing,
  Mail,
  Clock,
  Calendar,
  User,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Handshake,
  Briefcase,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  Send,
  Share2,
  Globe,
  Globe2,
  MapPin,
  Compass,
  Flag,
  Hash,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  BookOpen,
  HelpCircle,
  Keyboard,
  Lightbulb,
  MessageCircle,
  Phone,
  PieChart,
  LineChart,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'holdings' | 'primary' | 'ip' | 'orderbook' | 'auction' | 'rarity' | 'flow' | 'help';
type ChainId = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'solana' | 'bitcoin' | 'tron' | 'zs-chain';
type NftStandard = 'ERC-721' | 'ERC-1155' | 'Metaplex' | 'ZRC-721' | 'ZRC-1155';
type Category = 'art' | 'collectible' | 'music' | 'video' | 'domain' | 'photography' | 'sports' | 'gaming' | 'utility' | 'ip-derivative';
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancient';
type OrderSide = 'buy' | 'sell' | 'all';
type OrderStatus = 'active' | 'partial' | 'filled' | 'cancelled' | 'expired';
type AuctionStatus = 'live' | 'upcoming' | 'ended' | 'settled' | 'cancelled';
type IpStatus = 'active' | 'draft' | 'paused' | 'closed' | 'reviewing';
type DrawerType = 'collectible' | 'order' | 'auction' | 'ip' | 'mint' | 'place_order' | 'bid' | 'history' | 'help' | null;

interface Collectible {
  id: string;
  name: string;
  collection: string;
  collectionId: string;
  tokenId: string;
  chain: ChainId;
  standard: NftStandard;
  category: Category;
  rarity: Rarity;
  floorPrice: number;
  lastSale: number;
  volume24h: number;
  change24h: number;
  owners: number;
  listed: number;
  totalSupply: number;
  image: string;
  ipPartner?: string;
  releaseAt: string;
  description: string;
  attributes: { trait: string; value: string; rarity: number }[];
  royalty: number;
  contract: string;
  status: keyof typeof STATUS;
}

interface Holding {
  id: string;
  collectibleId: string;
  name: string;
  collection: string;
  tokenId: string;
  chain: ChainId;
  image: string;
  rarity: Rarity;
  acquiredAt: string;
  acquiredPrice: number;
  floorPrice: number;
  estimatedValue: number;
  pnl: number;
  pnlPct: number;
  listed: boolean;
  listPrice?: number;
  usedAsCollateral: boolean;
  loanId?: string;
}

interface PrimaryIssuance {
  id: string;
  name: string;
  collection: string;
  image: string;
  totalSupply: number;
  price: number;
  currency: string;
  chain: ChainId;
  startAt: string;
  endAt: string;
  whitelistQuota: number;
  publicQuota: number;
  subscribed: number;
  status: 'upcoming' | 'live' | 'ended' | 'sold-out';
  category: Category;
  rarity: Rarity;
  ipPartner?: string;
  description: string;
}

interface IpPartner {
  id: string;
  name: string;
  logo: string;
  industry: string;
  cooperationAt: string;
  totalCollections: number;
  totalIssued: number;
  totalVolume: number;
  followers: number;
  rating: number;
  status: IpStatus;
  description: string;
  contact: string;
  royaltyShare: number;
  upcomingDrops: number;
}

interface Order {
  id: string;
  collectibleId: string;
  name: string;
  collection: string;
  tokenId: string;
  chain: ChainId;
  side: 'buy' | 'sell';
  price: number;
  currency: string;
  expiry: string;
  maker: string;
  status: OrderStatus;
  filled: number;
  amount: number;
  royalty: number;
  fee: number;
  createdAt: string;
}

interface Auction {
  id: string;
  collectibleId: string;
  name: string;
  collection: string;
  tokenId: string;
  chain: ChainId;
  image: string;
  startAt: string;
  endAt: string;
  startBid: number;
  currentBid: number;
  minIncrement: number;
  buyNowPrice?: number;
  currency: string;
  bids: number;
  bidders: number;
  highestBidder?: string;
  status: AuctionStatus;
  reserveMet: boolean;
  category: Category;
}

interface RarityRank {
  rank: number;
  collectibleId: string;
  name: string;
  collection: string;
  image: string;
  rarityScore: number;
  rarity: Rarity;
  owners: number;
  volume30d: number;
  change30d: number;
  chain: ChainId;
}

interface FlowRecord {
  id: string;
  collectibleId: string;
  name: string;
  collection: string;
  tokenId: string;
  chain: ChainId;
  from: string;
  to: string;
  price: number;
  currency: string;
  event: 'mint' | 'transfer' | 'sale' | 'bid' | 'list' | 'delist' | 'burn' | 'airdrop';
  time: string;
  txHash: string;
  marketplace: string;
}

interface KpiSnapshot {
  totalVolume24h: number;
  totalVolume24hChange: number;
  totalVolume7d: number;
  totalSales24h: number;
  activeListings: number;
  uniqueBidders24h: number;
  floorPriceAvg: number;
  topCollection: string;
  liveAuctions: number;
  ipPartners: number;
  primaryIssued: number;
  newCollections: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 常量 ==============

const CHAIN_LABELS: Record<ChainId, string> = {
  'eth': 'Ethereum',
  'bsc': 'BNB Chain',
  'polygon': 'Polygon',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  'avalanche': 'Avalanche',
  'solana': 'Solana',
  'bitcoin': 'Bitcoin',
  'tron': 'Tron',
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
  'bitcoin': '#F7931A',
  'tron': '#FF060A',
  'zs-chain': BRAND.primary,
};

const CATEGORY_LABELS: Record<Category, string> = {
  'art': '艺术',
  'collectible': '收藏品',
  'music': '音乐',
  'video': '视频',
  'domain': '域名',
  'photography': '摄影',
  'sports': '体育',
  'gaming': '游戏',
  'utility': '功能型',
  'ip-derivative': 'IP 衍生',
};

const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  uncommon: '少见',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  mythic: '神话',
  ancient: '远古',
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EF4444',
  ancient: '#FBBF24',
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  active: '挂单中',
  partial: '部分成交',
  filled: '全部成交',
  cancelled: '已撤销',
  expired: '已过期',
};

const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  live: '进行中',
  upcoming: '未开始',
  ended: '已结束',
  settled: '已结算',
  cancelled: '已取消',
};

const IP_STATUS_LABELS: Record<IpStatus, string> = {
  active: '合作中',
  draft: '筹备中',
  paused: '已暂停',
  closed: '已结束',
  reviewing: '审核中',
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

function statusBadge(s: OrderStatus): { bg: string; fg: string; label: string } {
  if (s === 'active' || s === 'partial') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, label: ORDER_STATUS_LABELS[s] };
  if (s === 'filled') return { bg: 'rgba(68,219,244,0.10)', fg: BRAND.info, label: ORDER_STATUS_LABELS[s] };
  if (s === 'cancelled' || s === 'expired') return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textSub, label: ORDER_STATUS_LABELS[s] };
  return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMute, label: ORDER_STATUS_LABELS[s] };
}

// ============== Mock 数据 ==============

const COLLECTIBLES: Collectible[] = [
  {
    id: 'c-001',
    name: 'Genesis #0001',
    collection: 'ZS Genesis',
    collectionId: 'col-zs-genesis',
    tokenId: '0001',
    chain: 'zs-chain',
    standard: 'ZRC-721',
    category: 'ip-derivative',
    rarity: 'legendary',
    floorPrice: 2.84,
    lastSale: 2.92,
    volume24h: 24.8,
    change24h: 4.24,
    owners: 248,
    listed: 12,
    totalSupply: 1024,
    image: '🌌',
    ipPartner: '中萨数字',
    releaseAt: '2026-01-15',
    description: '中萨数字科技交易所首发限量数字藏品，对应平台核心纪念权益。',
    attributes: [
      { trait: '背景', value: '深空', rarity: 1.2 },
      { trait: '纹理', value: '极光', rarity: 0.8 },
      { trait: '装饰', value: '星环', rarity: 0.4 },
    ],
    royalty: 5.0,
    contract: '0xA1b2...C3d4',
    status: 'OPEN',
  },
  {
    id: 'c-002',
    name: 'Cyberpunk Warrior #0248',
    collection: 'CyberPunk Saga',
    collectionId: 'col-cyber',
    tokenId: '0248',
    chain: 'eth',
    standard: 'ERC-721',
    category: 'art',
    rarity: 'epic',
    floorPrice: 0.84,
    lastSale: 0.92,
    volume24h: 18.4,
    change24h: 2.84,
    owners: 1842,
    listed: 84,
    totalSupply: 8888,
    image: '🤖',
    ipPartner: 'Neon Studio',
    releaseAt: '2026-03-22',
    description: '赛博朋克世界观 IP 合作系列 8 号主角。',
    attributes: [
      { trait: '武器', value: '等离子刀', rarity: 2.4 },
      { trait: '护甲', value: '钛合金', rarity: 1.8 },
      { trait: '面甲', value: '红色', rarity: 0.6 },
    ],
    royalty: 7.5,
    contract: '0xB2c3...D4e5',
    status: 'OPEN',
  },
  {
    id: 'c-003',
    name: 'Mountain Echo #042',
    collection: 'National Parks',
    collectionId: 'col-parks',
    tokenId: '042',
    chain: 'polygon',
    standard: 'ERC-1155',
    category: 'photography',
    rarity: 'rare',
    floorPrice: 0.18,
    lastSale: 0.20,
    volume24h: 8.4,
    change24h: 1.42,
    owners: 1240,
    listed: 28,
    totalSupply: 5000,
    image: '🏔️',
    ipPartner: '国家地理协会',
    releaseAt: '2026-05-10',
    description: '国家地理协会授权摄影作品。',
    attributes: [
      { trait: '季节', value: '秋', rarity: 1.4 },
      { trait: '时间', value: '黄昏', rarity: 1.0 },
      { trait: '视角', value: '航拍', rarity: 0.8 },
    ],
    royalty: 6.0,
    contract: '0xC3d4...E5f6',
    status: 'OPEN',
  },
  {
    id: 'c-004',
    name: 'Music Wave #128',
    collection: 'Sound Lab',
    collectionId: 'col-sound',
    tokenId: '128',
    chain: 'solana',
    standard: 'Metaplex',
    category: 'music',
    rarity: 'uncommon',
    floorPrice: 0.42,
    lastSale: 0.48,
    volume24h: 12.4,
    change24h: 3.84,
    owners: 824,
    listed: 24,
    totalSupply: 2400,
    image: '🎵',
    ipPartner: 'Wave Records',
    releaseAt: '2026-04-18',
    description: '电子音乐节拍收藏品。',
    attributes: [
      { trait: 'BPM', value: '128', rarity: 1.0 },
      { trait: '流派', value: 'House', rarity: 1.4 },
      { trait: '版本', value: 'Remix', rarity: 0.6 },
    ],
    royalty: 8.0,
    contract: 'So1ana...X1y2',
    status: 'OPEN',
  },
  {
    id: 'c-005',
    name: 'Hero Card #005',
    collection: 'Fantasy League',
    collectionId: 'col-fantasy',
    tokenId: '005',
    chain: 'bsc',
    standard: 'ERC-721',
    category: 'gaming',
    rarity: 'mythic',
    floorPrice: 12.42,
    lastSale: 14.20,
    volume24h: 84.2,
    change24h: 8.42,
    owners: 420,
    listed: 8,
    totalSupply: 500,
    image: '⚔️',
    ipPartner: 'GameVerse',
    releaseAt: '2026-02-08',
    description: '链游核心英雄卡牌。',
    attributes: [
      { trait: '职业', value: '战士', rarity: 0.8 },
      { trait: '稀有度', value: 'SSR', rarity: 0.2 },
      { trait: '属性', value: '火', rarity: 0.6 },
    ],
    royalty: 5.5,
    contract: '0xD4e5...F6g7',
    status: 'OPEN',
  },
  {
    id: 'c-006',
    name: 'Sport Moment #088',
    collection: 'Sports Memorabilia',
    collectionId: 'col-sports',
    tokenId: '088',
    chain: 'polygon',
    standard: 'ERC-1155',
    category: 'sports',
    rarity: 'epic',
    floorPrice: 1.84,
    lastSale: 1.92,
    volume24h: 24.8,
    change24h: -2.18,
    owners: 624,
    listed: 18,
    totalSupply: 1000,
    image: '⚽',
    ipPartner: 'League Pro',
    releaseAt: '2026-06-22',
    description: '顶级赛事精彩瞬间收藏。',
    attributes: [
      { trait: '赛事', value: '决赛', rarity: 0.4 },
      { trait: '球队', value: '主队', rarity: 1.0 },
      { trait: '时刻', value: '绝杀', rarity: 0.2 },
    ],
    royalty: 6.5,
    contract: '0xE5f6...G7h8',
    status: 'OPEN',
  },
  {
    id: 'c-007',
    name: 'Pixel Realm #1024',
    collection: 'Pixel Universe',
    collectionId: 'col-pixel',
    tokenId: '1024',
    chain: 'avalanche',
    standard: 'ERC-721',
    category: 'art',
    rarity: 'rare',
    floorPrice: 0.32,
    lastSale: 0.36,
    volume24h: 6.8,
    change24h: 1.84,
    owners: 1842,
    listed: 48,
    totalSupply: 10000,
    image: '👾',
    releaseAt: '2026-07-01',
    description: '像素艺术开放世界主题。',
    attributes: [
      { trait: '风格', value: '8bit', rarity: 0.6 },
      { trait: '色调', value: '冷色', rarity: 1.2 },
      { trait: '角色', value: '勇者', rarity: 0.4 },
    ],
    royalty: 4.5,
    contract: '0xF6g7...H8i9',
    status: 'OPEN',
  },
  {
    id: 'c-008',
    name: 'Domain Premium.zs',
    collection: 'ZS Domains',
    collectionId: 'col-zs-domains',
    tokenId: 'premium-zs',
    chain: 'zs-chain',
    standard: 'ZRC-721',
    category: 'domain',
    rarity: 'ancient',
    floorPrice: 84.20,
    lastSale: 92.40,
    volume24h: 184.0,
    change24h: 12.42,
    owners: 1,
    listed: 0,
    totalSupply: 1,
    image: '🌐',
    releaseAt: '2026-01-01',
    description: '中萨域名体系顶级域名。',
    attributes: [
      { trait: '长度', value: '3 字符', rarity: 0.1 },
      { trait: '后缀', value: '.zs', rarity: 0.05 },
    ],
    royalty: 0,
    contract: '0xG7h8...I9j0',
    status: 'OPEN',
  },
];

const HOLDINGS: Holding[] = [
  { id: 'h-001', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', image: '🌌', rarity: 'legendary', acquiredAt: '2026-01-15', acquiredPrice: 1.84, floorPrice: 2.84, estimatedValue: 2.84, pnl: 1.00, pnlPct: 54.35, listed: true, listPrice: 2.92, usedAsCollateral: false },
  { id: 'h-002', collectibleId: 'c-002', name: 'Cyberpunk Warrior #0248', collection: 'CyberPunk Saga', tokenId: '0248', chain: 'eth', image: '🤖', rarity: 'epic', acquiredAt: '2026-04-12', acquiredPrice: 0.62, floorPrice: 0.84, estimatedValue: 0.84, pnl: 0.22, pnlPct: 35.48, listed: false, usedAsCollateral: true, loanId: 'LN-0042' },
  { id: 'h-003', collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', tokenId: '005', chain: 'bsc', image: '⚔️', rarity: 'mythic', acquiredAt: '2026-02-22', acquiredPrice: 8.42, floorPrice: 12.42, estimatedValue: 12.42, pnl: 4.00, pnlPct: 47.51, listed: false, usedAsCollateral: false },
  { id: 'h-004', collectibleId: 'c-003', name: 'Mountain Echo #042', collection: 'National Parks', tokenId: '042', chain: 'polygon', image: '🏔️', rarity: 'rare', acquiredAt: '2026-05-18', acquiredPrice: 0.14, floorPrice: 0.18, estimatedValue: 0.18, pnl: 0.04, pnlPct: 28.57, listed: false, usedAsCollateral: false },
  { id: 'h-005', collectibleId: 'c-007', name: 'Pixel Realm #1024', collection: 'Pixel Universe', tokenId: '1024', chain: 'avalanche', image: '👾', rarity: 'rare', acquiredAt: '2026-07-08', acquiredPrice: 0.28, floorPrice: 0.32, estimatedValue: 0.32, pnl: 0.04, pnlPct: 14.29, listed: true, listPrice: 0.34, usedAsCollateral: false },
];

const PRIMARY_ISSUANCES: PrimaryIssuance[] = [
  {
    id: 'p-001',
    name: 'ZS Spring Festival 2026',
    collection: 'ZS Spring Series',
    image: '🌸',
    totalSupply: 2026,
    price: 0.08,
    currency: 'ZSD',
    chain: 'zs-chain',
    startAt: '2026-08-01 10:00:00',
    endAt: '2026-08-03 22:00:00',
    whitelistQuota: 500,
    publicQuota: 1526,
    subscribed: 1284,
    status: 'upcoming',
    category: 'ip-derivative',
    rarity: 'rare',
    ipPartner: '中萨数字',
    description: 'ZSDEX 2026 春节限定数字藏品。',
  },
  {
    id: 'p-002',
    name: 'Cyber Genesis II',
    collection: 'CyberPunk Saga',
    image: '🦾',
    totalSupply: 5000,
    price: 0.15,
    currency: 'ETH',
    chain: 'eth',
    startAt: '2026-07-25 14:00:00',
    endAt: '2026-07-27 22:00:00',
    whitelistQuota: 1200,
    publicQuota: 3800,
    subscribed: 4128,
    status: 'live',
    category: 'art',
    rarity: 'epic',
    ipPartner: 'Neon Studio',
    description: '赛博朋克系列第二代。',
  },
  {
    id: 'p-003',
    name: 'Football Finals 2026',
    collection: 'Sports Memorabilia',
    image: '🏆',
    totalSupply: 1000,
    price: 0.24,
    currency: 'MATIC',
    chain: 'polygon',
    startAt: '2026-07-15 10:00:00',
    endAt: '2026-07-22 22:00:00',
    whitelistQuota: 200,
    publicQuota: 800,
    subscribed: 1000,
    status: 'sold-out',
    category: 'sports',
    rarity: 'legendary',
    ipPartner: 'League Pro',
    description: '2026 赛季总决赛纪念数字藏品。',
  },
];

const IP_PARTNERS: IpPartner[] = [
  { id: 'ip-001', name: '中萨数字', logo: '中', industry: '数字科技', cooperationAt: '2025-08-15', totalCollections: 8, totalIssued: 24800, totalVolume: 184.2, followers: 8420, rating: 4.8, status: 'active', description: '中萨数字科技交易所平台 IP。', contact: 'ip@zsdex.example', royaltyShare: 50, upcomingDrops: 2 },
  { id: 'ip-002', name: 'Neon Studio', logo: 'N', industry: '数字艺术', cooperationAt: '2026-01-12', totalCollections: 4, totalIssued: 18420, totalVolume: 84.6, followers: 12420, rating: 4.6, status: 'active', description: '赛博朋克风格数字艺术工作室。', contact: 'partner@neon.example', royaltyShare: 70, upcomingDrops: 1 },
  { id: 'ip-003', name: '国家地理协会', logo: '国', industry: '文化机构', cooperationAt: '2026-03-08', totalCollections: 2, totalIssued: 5000, totalVolume: 8.4, followers: 6240, rating: 4.9, status: 'active', description: '国家地理协会授权摄影作品集。', contact: 'licensing@natgeo.example', royaltyShare: 60, upcomingDrops: 0 },
  { id: 'ip-004', name: 'Wave Records', logo: 'W', industry: '音乐', cooperationAt: '2026-04-22', totalCollections: 3, totalIssued: 2400, totalVolume: 12.4, followers: 1840, rating: 4.4, status: 'reviewing', description: '电子音乐厂牌合作。', contact: 'biz@waverec.example', royaltyShare: 65, upcomingDrops: 0 },
  { id: 'ip-005', name: 'GameVerse', logo: 'G', industry: '游戏', cooperationAt: '2026-02-18', totalCollections: 5, totalIssued: 8420, totalVolume: 248.0, followers: 18420, rating: 4.7, status: 'active', description: '链游工作室。', contact: 'partners@gameverse.example', royaltyShare: 70, upcomingDrops: 3 },
  { id: 'ip-006', name: 'League Pro', logo: 'L', industry: '体育', cooperationAt: '2026-06-08', totalCollections: 2, totalIssued: 1480, totalVolume: 24.8, followers: 2840, rating: 4.5, status: 'paused', description: '顶级体育 IP 合作。', contact: 'biz@leaguepro.example', royaltyShare: 75, upcomingDrops: 0 },
];

const ORDERS: Order[] = [
  { id: 'o-001', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', side: 'sell', price: 2.92, currency: 'ZSD', expiry: '2026-08-15', maker: '0xA1b2...C3d4', status: 'active', filled: 0, amount: 1, royalty: 0.15, fee: 0.03, createdAt: '2026-07-18 14:24:18' },
  { id: 'o-002', collectibleId: 'c-002', name: 'Cyberpunk Warrior #0248', collection: 'CyberPunk Saga', tokenId: '0248', chain: 'eth', side: 'sell', price: 0.92, currency: 'ETH', expiry: '2026-08-20', maker: '0xB2c3...D4e5', status: 'partial', filled: 0.4, amount: 1, royalty: 0.07, fee: 0.025, createdAt: '2026-07-17 11:18:42' },
  { id: 'o-003', collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', tokenId: '005', chain: 'bsc', side: 'buy', price: 12.0, currency: 'BNB', expiry: '2026-07-25', maker: '0xC3d4...E5f6', status: 'active', filled: 0, amount: 1, royalty: 0.66, fee: 0.06, createdAt: '2026-07-19 09:42:08' },
  { id: 'o-004', collectibleId: 'c-003', name: 'Mountain Echo #042', collection: 'National Parks', tokenId: '042', chain: 'polygon', side: 'sell', price: 0.20, currency: 'MATIC', expiry: '2026-08-10', maker: '0xD4e5...F6g7', status: 'filled', filled: 1, amount: 1, royalty: 0.012, fee: 0.005, createdAt: '2026-07-15 16:08:12' },
  { id: 'o-005', collectibleId: 'c-007', name: 'Pixel Realm #1024', collection: 'Pixel Universe', tokenId: '1024', chain: 'avalanche', side: 'sell', price: 0.34, currency: 'AVAX', expiry: '2026-08-18', maker: '0xE5f6...G7h8', status: 'active', filled: 0, amount: 1, royalty: 0.015, fee: 0.008, createdAt: '2026-07-19 08:24:42' },
  { id: 'o-006', collectibleId: 'c-006', name: 'Sport Moment #088', collection: 'Sports Memorabilia', tokenId: '088', chain: 'polygon', side: 'buy', price: 1.84, currency: 'MATIC', expiry: '2026-08-08', maker: '0xF6g7...H8i9', status: 'cancelled', filled: 0, amount: 1, royalty: 0.12, fee: 0.018, createdAt: '2026-07-12 14:42:08' },
];

const AUCTIONS: Auction[] = [
  { id: 'a-001', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', image: '🌌', startAt: '2026-07-18 14:00:00', endAt: '2026-07-21 22:00:00', startBid: 2.40, currentBid: 2.84, minIncrement: 0.05, buyNowPrice: 3.20, currency: 'ZSD', bids: 18, bidders: 12, highestBidder: '0x7A8b...C9d0', status: 'live', reserveMet: true, category: 'ip-derivative' },
  { id: 'a-002', collectibleId: 'c-002', name: 'Cyberpunk Warrior #0248', collection: 'CyberPunk Saga', tokenId: '0248', chain: 'eth', image: '🤖', startAt: '2026-07-19 10:00:00', endAt: '2026-07-22 22:00:00', startBid: 0.72, currentBid: 0.84, minIncrement: 0.02, buyNowPrice: 1.10, currency: 'ETH', bids: 24, bidders: 18, highestBidder: '0x8B9c...D0e1', status: 'live', reserveMet: true, category: 'art' },
  { id: 'a-003', collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', tokenId: '005', chain: 'bsc', image: '⚔️', startAt: '2026-07-25 14:00:00', endAt: '2026-07-28 22:00:00', startBid: 10.0, currentBid: 10.0, minIncrement: 0.5, buyNowPrice: 18.0, currency: 'BNB', bids: 0, bidders: 0, status: 'upcoming', reserveMet: false, category: 'gaming' },
  { id: 'a-004', collectibleId: 'c-008', name: 'Domain Premium.zs', collection: 'ZS Domains', tokenId: 'premium-zs', chain: 'zs-chain', image: '🌐', startAt: '2026-07-10 14:00:00', endAt: '2026-07-15 22:00:00', startBid: 60.0, currentBid: 92.4, minIncrement: 2.0, currency: 'ZSD', bids: 48, bidders: 28, highestBidder: '0x9C0d...E1f2', status: 'ended', reserveMet: true, category: 'domain' },
];

const RARITY_RANK: RarityRank[] = [
  { rank: 1, collectibleId: 'c-008', name: 'Domain Premium.zs', collection: 'ZS Domains', image: '🌐', rarityScore: 99.8, rarity: 'ancient', owners: 1, volume30d: 184.0, change30d: 24.8, chain: 'zs-chain' },
  { rank: 2, collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', image: '⚔️', rarityScore: 96.4, rarity: 'mythic', owners: 1, volume30d: 248.0, change30d: 18.4, chain: 'bsc' },
  { rank: 3, collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', image: '🌌', rarityScore: 92.8, rarity: 'legendary', owners: 1, volume30d: 84.0, change30d: 12.4, chain: 'zs-chain' },
  { rank: 4, collectibleId: 'c-006', name: 'Sport Moment #088', collection: 'Sports Memorabilia', image: '⚽', rarityScore: 88.4, rarity: 'epic', owners: 1, volume30d: 24.8, change30d: 8.4, chain: 'polygon' },
  { rank: 5, collectibleId: 'c-002', name: 'Cyberpunk Warrior #0248', collection: 'CyberPunk Saga', image: '🤖', rarityScore: 84.2, rarity: 'epic', owners: 1, volume30d: 18.4, change30d: 4.2, chain: 'eth' },
  { rank: 6, collectibleId: 'c-003', name: 'Mountain Echo #042', collection: 'National Parks', image: '🏔️', rarityScore: 76.8, rarity: 'rare', owners: 1, volume30d: 8.4, change30d: 2.8, chain: 'polygon' },
  { rank: 7, collectibleId: 'c-007', name: 'Pixel Realm #1024', collection: 'Pixel Universe', image: '👾', rarityScore: 72.4, rarity: 'rare', owners: 1, volume30d: 6.8, change30d: 1.8, chain: 'avalanche' },
  { rank: 8, collectibleId: 'c-004', name: 'Music Wave #128', collection: 'Sound Lab', image: '🎵', rarityScore: 64.2, rarity: 'uncommon', owners: 1, volume30d: 12.4, change30d: 3.8, chain: 'solana' },
];

const FLOW_RECORDS: FlowRecord[] = [
  { id: 'f-001', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', from: '0x0000...0000', to: '0xA1b2...C3d4', price: 0, currency: 'ZSD', event: 'mint', time: '2026-01-15 10:00:00', txHash: '0xa1b2...', marketplace: 'ZSDEX Mint' },
  { id: 'f-002', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', from: '0xA1b2...C3d4', to: '0xC3d4...E5f6', price: 1.84, currency: 'ZSD', event: 'sale', time: '2026-03-22 14:24:18', txHash: '0xb2c3...', marketplace: 'ZSDEX Market' },
  { id: 'f-003', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', from: '0xC3d4...E5f6', to: '0xE5f6...G7h8', price: 2.42, currency: 'ZSD', event: 'sale', time: '2026-05-18 16:08:42', txHash: '0xc3d4...', marketplace: 'ZSDEX Market' },
  { id: 'f-004', collectibleId: 'c-001', name: 'Genesis #0001', collection: 'ZS Genesis', tokenId: '0001', chain: 'zs-chain', from: '0xE5f6...G7h8', to: '0xG7h8...I9j0', price: 2.84, currency: 'ZSD', event: 'sale', time: '2026-07-19 09:42:08', txHash: '0xd4e5...', marketplace: 'ZSDEX Market' },
  { id: 'f-005', collectibleId: 'c-002', name: 'Cyberpunk Warrior #0248', collection: 'CyberPunk Saga', tokenId: '0248', chain: 'eth', from: '0xB2c3...D4e5', to: '0xH8i9...J0k1', price: 0.84, currency: 'ETH', event: 'sale', time: '2026-07-19 11:18:24', txHash: '0xe5f6...', marketplace: 'OpenSea' },
  { id: 'f-006', collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', tokenId: '005', chain: 'bsc', from: '0xC3d4...E5f6', to: '0xI9j0...K1l2', price: 12.42, currency: 'BNB', event: 'sale', time: '2026-07-18 18:24:18', txHash: '0xf6g7...', marketplace: 'PancakeSwap' },
  { id: 'f-007', collectibleId: 'c-005', name: 'Hero Card #005', collection: 'Fantasy League', tokenId: '005', chain: 'bsc', from: '0x0000...0000', to: '0xC3d4...E5f6', price: 0, currency: 'BNB', event: 'mint', time: '2026-02-08 14:00:00', txHash: '0xg7h8...', marketplace: 'GameVerse Mint' },
  { id: 'f-008', collectibleId: 'c-008', name: 'Domain Premium.zs', collection: 'ZS Domains', tokenId: 'premium-zs', chain: 'zs-chain', from: '0x0000...0000', to: '0xJ0k1...L2m3', price: 0, currency: 'ZSD', event: 'mint', time: '2026-01-01 00:00:00', txHash: '0xh8i9...', marketplace: 'ZS Domains' },
];

// ============== 主组件 ==============

export function PortalNftMarket() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<ChainId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [ipStatusFilter, setIpStatusFilter] = useState<IpStatus | 'all'>('all');
  const [orderSideFilter, setOrderSideFilter] = useState<OrderSide>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState<AuctionStatus>('live');
  const [primaryStatusFilter, setPrimaryStatusFilter] = useState<PrimaryIssuance['status'] | 'all'>('all');
  const [historyEventFilter, setHistoryEventFilter] = useState<FlowRecord['event'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'floor' | 'change' | 'listings' | 'price' | 'bids'>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderExpiry, setOrderExpiry] = useState('7');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalVolume24h: 4280,
    totalVolume24hChange: 8.42,
    totalVolume7d: 28420,
    totalSales24h: 1284,
    activeListings: 8420,
    uniqueBidders24h: 1842,
    floorPriceAvg: 1.42,
    topCollection: 'ZS Genesis',
    liveAuctions: 24,
    ipPartners: 6,
    primaryIssued: 24800,
    newCollections: 4,
    zsdPrice: 1.0,
  });

  // 实时数据漂移
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalVolume24h: prev.totalVolume24h + Math.floor(Math.random() * 80 - 30),
        totalSales24h: prev.totalSales24h + (Math.random() < 0.3 ? 1 : 0),
        activeListings: prev.activeListings + Math.floor(Math.random() * 12 - 6),
        uniqueBidders24h: prev.uniqueBidders24h + Math.floor(Math.random() * 6 - 2),
        floorPriceAvg: Math.max(0.1, prev.floorPriceAvg + (Math.random() - 0.4) * 0.02),
        liveAuctions: prev.liveAuctions + (Math.random() < 0.1 ? 1 : 0),
      }));
    }, 4200);
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
        const tabs: Tab[] = ['overview', 'holdings', 'primary', 'ip', 'orderbook', 'auction', 'rarity', 'flow', 'help'];
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
  const filteredCollectibles = useMemo(() => {
    const lower = search.toLowerCase();
    let result = COLLECTIBLES.filter((c) => {
      if (chainFilter !== 'all' && c.chain !== chainFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false;
      if (lower && !c.name.toLowerCase().includes(lower) && !c.collection.toLowerCase().includes(lower)) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      let av: number, bv: number;
      switch (sortBy) {
        case 'volume': av = a.volume24h; bv = b.volume24h; break;
        case 'floor': av = a.floorPrice; bv = b.floorPrice; break;
        case 'change': av = a.change24h; bv = b.change24h; break;
        case 'listings': av = a.listed; bv = b.listed; break;
        default: av = a.volume24h; bv = b.volume24h;
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }, [search, chainFilter, categoryFilter, rarityFilter, sortBy, sortDir]);

  const filteredOrders = useMemo(() => {
    return ORDERS.filter((o) => {
      if (orderSideFilter !== 'all' && o.side !== orderSideFilter) return false;
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      return true;
    });
  }, [orderSideFilter, orderStatusFilter]);

  const filteredAuctions = useMemo(() => {
    return AUCTIONS.filter((a) => {
      if (auctionStatusFilter !== 'live' && a.status !== auctionStatusFilter) return false;
      if (auctionStatusFilter === 'live' && a.status !== 'live') return false;
      return true;
    });
  }, [auctionStatusFilter]);

  const filteredPrimary = useMemo(() => {
    return PRIMARY_ISSUANCES.filter((p) => {
      if (primaryStatusFilter !== 'all' && p.status !== primaryStatusFilter) return false;
      return true;
    });
  }, [primaryStatusFilter]);

  const filteredIp = useMemo(() => {
    return IP_PARTNERS.filter((p) => {
      if (ipStatusFilter !== 'all' && p.status !== ipStatusFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ipStatusFilter, search]);

  const filteredFlow = useMemo(() => {
    return FLOW_RECORDS.filter((f) => {
      if (historyEventFilter !== 'all' && f.event !== historyEventFilter) return false;
      return true;
    });
  }, [historyEventFilter]);

  const handleBid = useCallback(() => {
    if (!bidAmount) return;
    alert(`已提交拍卖出价：${bidAmount}`);
    setBidAmount('');
    closeDrawer();
  }, [bidAmount, closeDrawer]);

  const handlePlaceOrder = useCallback(() => {
    if (!orderPrice) return;
    alert(`已提交挂单：${orderPrice}（${orderExpiry}天有效）`);
    setOrderPrice('');
    closeDrawer();
  }, [orderPrice, orderExpiry, closeDrawer]);

  // 数字滚动 Hook
  const useCountUp = (target: number, duration: number = 1200) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
      const start = value;
      const diff = target - start;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(start + diff * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      tick();
    }, [target, duration]);
    return value;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes nm-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes nm-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes nm-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes nm-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes nm-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes nm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes nm-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,129,0.4); } 50% { box-shadow: 0 0 24px 4px rgba(20,184,129,0.6); } }
        .nm-stagger > * { animation: nm-fade-up 0.4s ease-out both; }
        .nm-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .nm-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .nm-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .nm-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .nm-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .nm-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .nm-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .nm-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .nm-pulse { animation: nm-pulse 2.4s ease-in-out infinite; }
        .nm-float { animation: nm-float 3s ease-in-out infinite; }
        .nm-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: nm-shimmer 2.4s linear infinite; }
        .nm-drawer { animation: nm-slide-in 0.28s ease-out; }
        .nm-bar { transform-origin: bottom; animation: nm-bar 0.6s ease-out; }
        .nm-row:hover { background-color: ${BRAND.cardHover}; }
        .nm-glow { animation: nm-glow 2.4s ease-in-out infinite; }
        .nm-spin { animation: nm-spin 8s linear infinite; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-8 nm-stagger" style={{ background: `linear-gradient(135deg, ${BRAND.bg} 0%, ${BRAND.card} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={18} style={{ color: BRAND.primary }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textSub }}>NFT 二级市场与 IP 流通中心 · Q05 P3.36</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND.text }}>NFT 二级市场与 IP 流通中心</h1>
        <p className="text-sm mb-6 max-w-3xl" style={{ color: BRAND.textSub }}>
          连接一级发行（Launch）、IP 合作伙伴、数字藏品发行方，构建透明、合规、可审计的 NFT 数字藏品二级市场与 IP 流通基础设施。
          所有数据为研究演示占位，不构成任何交易或收藏建议。
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTab('primary')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
            <Rocket size={14} /> 一级申购
          </button>
          <button onClick={() => setTab('ip')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Handshake size={14} /> IP 合作市场
          </button>
          <button onClick={() => setTab('orderbook')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Tag size={14} /> 二级挂单
          </button>
          <button onClick={() => setTab('auction')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <Gavel size={14} /> 拍卖中心
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 nm-stagger" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        {[
          { label: '24h 总成交', value: kpi.totalVolume24h, format: 'currency', change: kpi.totalVolume24hChange, icon: <BarChart3 size={14} /> },
          { label: '7d 总成交', value: kpi.totalVolume7d, format: 'currency' },
          { label: '24h 销售笔数', value: kpi.totalSales24h, format: 'count' },
          { label: '活跃挂单', value: kpi.activeListings, format: 'count' },
          { label: '24h 独立买家', value: kpi.uniqueBidders24h, format: 'count' },
          { label: '地板价均价', value: kpi.floorPriceAvg, format: 'price' },
          { label: '进行中拍卖', value: kpi.liveAuctions, format: 'count' },
          { label: 'IP 合作伙伴', value: kpi.ipPartners, format: 'count' },
          { label: '累计发行', value: kpi.primaryIssued, format: 'count' },
          { label: '本周新系列', value: kpi.newCollections, format: 'count' },
          { label: '头部系列', value: 0, format: 'text', text: kpi.topCollection },
          { label: 'ZSD 指数', value: kpi.zsdPrice, format: 'price' },
        ].map((it, idx) => {
          const display = it.format === 'currency' ? `$${formatPrice(it.value)}` : it.format === 'count' ? it.value.toLocaleString() : it.format === 'price' ? it.value.toFixed(2) : it.text;
          return (
            <div key={idx} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                {it.icon && <span style={{ color: BRAND.primary }}>{it.icon}</span>}
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>{it.label}</div>
              </div>
              <div className="text-lg font-bold nm-float" style={{ color: BRAND.text }}>{display}</div>
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
          { k: 'holdings' as Tab, label: '我的持仓', icon: <Wallet size={14} /> },
          { k: 'primary' as Tab, label: '一级申购', icon: <Rocket size={14} /> },
          { k: 'ip' as Tab, label: 'IP 合作市场', icon: <Handshake size={14} /> },
          { k: 'orderbook' as Tab, label: '二级挂单', icon: <Tag size={14} /> },
          { k: 'auction' as Tab, label: '拍卖中心', icon: <Gavel size={14} /> },
          { k: 'rarity' as Tab, label: '稀有度榜单', icon: <Crown size={14} /> },
          { k: 'flow' as Tab, label: '流通记录', icon: <Activity size={14} /> },
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
            {/* 搜索 + 过滤 */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <Search size={14} style={{ color: BRAND.textMute }} />
                <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索藏品 / 系列 / IP 合作伙伴（/ 聚焦）" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: BRAND.textMute }} /></button>}
              </div>
              <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value as ChainId | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部公链</option>
                {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部分类</option>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value as Rarity | 'all')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部稀有度</option>
                {(Object.keys(RARITY_LABELS) as Rarity[]).map((r) => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'volume' | 'floor' | 'change' | 'listings')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="volume">24h 成交</option>
                <option value="floor">地板价</option>
                <option value="change">24h 涨跌</option>
                <option value="listings">挂单数</option>
              </select>
              <button onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                {sortDir === 'desc' ? '↓ 降序' : '↑ 升序'}
              </button>
            </div>

            {/* 热门藏品 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 nm-stagger">
              {filteredCollectibles.slice(0, 8).map((c) => (
                <div key={c.id} className="p-4 rounded-xl cursor-pointer nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('collectible', c.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{c.image}</div>
                    <div className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: RARITY_COLORS[c.rarity] + '20', color: RARITY_COLORS[c.rarity], border: `1px solid ${RARITY_COLORS[c.rarity]}40` }}>
                      {RARITY_LABELS[c.rarity]}
                    </div>
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{c.name}</div>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>{c.collection} · {CHAIN_LABELS[c.chain]}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      <div style={{ color: BRAND.textMute }}>地板价</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatPrice(c.floorPrice)} {c.collection.includes('ZS') ? 'ZSD' : c.chain === 'eth' ? 'ETH' : c.chain === 'bsc' ? 'BNB' : ''}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>24h 涨跌</div>
                      <div className="font-semibold" style={{ color: changeColor(c.change24h) }}>{c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>24h 成交</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{formatCurrency(c.volume24h)}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>挂单</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{c.listed}</div>
                    </div>
                  </div>
                  {c.ipPartner && (
                    <div className="mt-2 px-2 py-1 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                      <Handshake size={10} /> IP：{c.ipPartner}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'holdings' && (
          <div className="space-y-2">
            {HOLDINGS.map((h) => (
              <div key={h.id} className="p-4 rounded-lg flex items-center gap-4 nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('collectible', h.collectibleId)}>
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{h.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{h.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: RARITY_COLORS[h.rarity] + '20', color: RARITY_COLORS[h.rarity] }}>{RARITY_LABELS[h.rarity]}</span>
                    {h.listed && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>挂单中</span>}
                    {h.usedAsCollateral && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>已质押</span>}
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>{h.collection} · {CHAIN_LABELS[h.chain]} · 获得于 {h.acquiredAt}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: BRAND.text }}>{formatPrice(h.estimatedValue)} {h.chain === 'eth' ? 'ETH' : h.chain === 'bsc' ? 'BNB' : 'ZSD'}</div>
                  <div className="text-[10px]" style={{ color: changeColor(h.pnl) }}>{h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)} ({h.pnlPct.toFixed(2)}%)</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'primary' && (
          <>
            <div className="flex gap-2">
              {(['all', 'upcoming', 'live', 'ended', 'sold-out'] as const).map((s) => (
                <button key={s} onClick={() => setPrimaryStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: primaryStatusFilter === s ? BRAND.primaryLt : BRAND.card, color: primaryStatusFilter === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${primaryStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                  {s === 'all' ? '全部' : s === 'upcoming' ? '未开始' : s === 'live' ? '进行中' : s === 'ended' ? '已结束' : '已售罄'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 nm-stagger">
              {filteredPrimary.map((p) => (
                <div key={p.id} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{p.image}</div>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: p.status === 'live' ? 'rgba(20,184,129,0.10)' : p.status === 'sold-out' ? 'rgba(255,80,80,0.10)' : p.status === 'upcoming' ? 'rgba(68,219,244,0.10)' : 'rgba(176,176,176,0.10)', color: p.status === 'live' ? BRAND.primary : p.status === 'sold-out' ? '#FF5050' : p.status === 'upcoming' ? BRAND.info : BRAND.textMute, border: `1px solid ${p.status === 'live' ? BRAND.primary : p.status === 'sold-out' ? '#FF5050' : p.status === 'upcoming' ? BRAND.info : BRAND.border}40` }}>
                        {p.status === 'live' ? '进行中' : p.status === 'sold-out' ? '已售罄' : p.status === 'upcoming' ? '未开始' : '已结束'}
                      </div>
                      <div className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: RARITY_COLORS[p.rarity] + '20', color: RARITY_COLORS[p.rarity] }}>{RARITY_LABELS[p.rarity]}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{p.name}</div>
                  <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>{p.collection} · {CHAIN_LABELS[p.chain]}</div>
                  {p.ipPartner && <div className="text-[10px] mb-2" style={{ color: BRAND.primary }}>IP：{p.ipPartner}</div>}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                    <div>
                      <div style={{ color: BRAND.textMute }}>单价</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.price} {p.currency}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>总供应</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.totalSupply.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>已申购</div>
                      <div className="font-semibold" style={{ color: BRAND.primary }}>{p.subscribed.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>申购进度</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{((p.subscribed / p.totalSupply) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div className="h-full" style={{ width: `${Math.min(100, (p.subscribed / p.totalSupply) * 100)}%`, backgroundColor: BRAND.primary }} />
                  </div>
                  <button onClick={() => openDrawer('mint', p.id)} className="w-full py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: p.status === 'live' ? BRAND.primary : BRAND.cardElevated, color: p.status === 'live' ? '#000' : BRAND.textMute, border: `1px solid ${p.status === 'live' ? BRAND.primary : BRAND.border}` }}>
                    {p.status === 'live' ? '立即申购' : p.status === 'upcoming' ? '预约提醒' : p.status === 'sold-out' ? '已售罄' : '已结束'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'ip' && (
          <>
            <div className="flex gap-2">
              {(['all', 'active', 'draft', 'paused', 'reviewing', 'closed'] as IpStatus[]).map((s) => (
                <button key={s} onClick={() => setIpStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: ipStatusFilter === s ? BRAND.primaryLt : BRAND.card, color: ipStatusFilter === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${ipStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                  {s === 'all' ? '全部' : IP_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 nm-stagger">
              {filteredIp.map((p) => (
                <div key={p.id} className="p-4 rounded-xl cursor-pointer nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('ip', p.id)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{p.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>{p.name}</div>
                      <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>{p.industry} · 合作 {p.cooperationAt}</div>
                      <div className="px-2 py-0.5 rounded text-[10px] inline-block" style={{ backgroundColor: p.status === 'active' ? 'rgba(20,184,129,0.10)' : p.status === 'paused' ? 'rgba(255,180,0,0.10)' : p.status === 'closed' ? 'rgba(176,176,176,0.10)' : p.status === 'reviewing' ? 'rgba(68,219,244,0.10)' : 'rgba(255,80,80,0.10)', color: p.status === 'active' ? BRAND.primary : p.status === 'paused' ? '#FFB400' : p.status === 'closed' ? BRAND.textMute : p.status === 'reviewing' ? BRAND.info : '#FF5050' }}>
                        {IP_STATUS_LABELS[p.status]}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{p.description}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div style={{ color: BRAND.textMute }}>累计系列</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.totalCollections}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>累计发行</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.totalIssued.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>累计成交</div>
                      <div className="font-semibold" style={{ color: BRAND.primary }}>{formatCurrency(p.totalVolume)}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>关注者</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.followers.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>IP 评分</div>
                      <div className="font-semibold" style={{ color: BRAND.primary }}>★ {p.rating.toFixed(1)}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>IP 分成</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{p.royaltyShare}%</div>
                    </div>
                  </div>
                  {p.upcomingDrops > 0 && (
                    <div className="mt-2 px-2 py-1 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>
                      <Rocket size={10} /> 即将发行 {p.upcomingDrops} 个系列
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'orderbook' && (
          <>
            <div className="flex gap-2">
              <select value={orderSideFilter} onChange={(e) => setOrderSideFilter(e.target.value as OrderSide)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部方向</option>
                <option value="sell">卖单</option>
                <option value="buy">买单</option>
              </select>
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatus | 'all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-semibold" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute }}>
                <div className="col-span-1">方向</div>
                <div className="col-span-4">藏品</div>
                <div className="col-span-2 text-right">价格</div>
                <div className="col-span-1 text-right">成交</div>
                <div className="col-span-2">挂单方</div>
                <div className="col-span-1">状态</div>
                <div className="col-span-1">到期</div>
              </div>
              {filteredOrders.map((o) => {
                const sb = statusBadge(o.status);
                return (
                  <div key={o.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] items-center nm-row" style={{ borderTop: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('order', o.id)}>
                    <div className="col-span-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: o.side === 'buy' ? 'rgba(20,184,129,0.10)' : 'rgba(255,80,80,0.10)', color: o.side === 'buy' ? BRAND.primary : '#FF5050' }}>
                        {o.side === 'buy' ? '买' : '卖'}
                      </span>
                    </div>
                    <div className="col-span-4 min-w-0">
                      <div className="font-semibold truncate" style={{ color: BRAND.text }}>{o.name}</div>
                      <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>{o.collection} · {CHAIN_LABELS[o.chain]}</div>
                    </div>
                    <div className="col-span-2 text-right font-semibold" style={{ color: BRAND.text }}>{o.price} {o.currency}</div>
                    <div className="col-span-1 text-right" style={{ color: BRAND.textSub }}>{(o.filled * 100).toFixed(0)}%</div>
                    <div className="col-span-2 text-[10px]" style={{ color: BRAND.textMute }}>{shortenAddress(o.maker)}</div>
                    <div className="col-span-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: sb.bg, color: sb.fg }}>{sb.label}</span>
                    </div>
                    <div className="col-span-1 text-[10px]" style={{ color: BRAND.textMute }}>{o.expiry.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'auction' && (
          <>
            <div className="flex gap-2">
              {(['live', 'upcoming', 'ended'] as AuctionStatus[]).map((s) => (
                <button key={s} onClick={() => setAuctionStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: auctionStatusFilter === s ? BRAND.primaryLt : BRAND.card, color: auctionStatusFilter === s ? BRAND.primary : BRAND.textSub, border: `1px solid ${auctionStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                  {AUCTION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 nm-stagger">
              {filteredAuctions.map((a) => (
                <div key={a.id} className="p-4 rounded-xl cursor-pointer nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('auction', a.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{a.image}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{a.name}</div>
                      <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>{a.collection} · {CHAIN_LABELS[a.chain]}</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: a.status === 'live' ? 'rgba(20,184,129,0.10)' : a.status === 'upcoming' ? 'rgba(68,219,244,0.10)' : 'rgba(176,176,176,0.10)', color: a.status === 'live' ? BRAND.primary : a.status === 'upcoming' ? BRAND.info : BRAND.textMute, border: `1px solid ${a.status === 'live' ? BRAND.primary : a.status === 'upcoming' ? BRAND.info : BRAND.border}40` }}>
                          {AUCTION_STATUS_LABELS[a.status]}
                        </span>
                        {a.reserveMet && <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>已达成保留价</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div style={{ color: BRAND.textMute }}>起拍价</div>
                      <div className="font-semibold" style={{ color: BRAND.textSub }}>{a.startBid} {a.currency}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>当前价</div>
                      <div className="font-bold" style={{ color: BRAND.primary }}>{a.currentBid} {a.currency}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>出价次数</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{a.bids}</div>
                    </div>
                    <div>
                      <div style={{ color: BRAND.textMute }}>出价人数</div>
                      <div className="font-semibold" style={{ color: BRAND.text }}>{a.bidders}</div>
                    </div>
                  </div>
                  {a.status === 'live' && a.highestBidder && (
                    <div className="mt-2 text-[10px]" style={{ color: BRAND.textMute }}>领先出价：{shortenAddress(a.highestBidder)}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'rarity' && (
          <div className="space-y-2">
            {RARITY_RANK.map((r) => (
              <div key={r.rank} className="p-3 rounded-lg flex items-center gap-4 nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('collectible', r.collectibleId)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold" style={{ backgroundColor: r.rank <= 3 ? BRAND.primaryLt : BRAND.cardElevated, color: r.rank <= 3 ? BRAND.primary : BRAND.text, border: `1px solid ${r.rank <= 3 ? BRAND.primary : BRAND.border}` }}>
                  #{r.rank}
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{r.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: RARITY_COLORS[r.rarity] + '20', color: RARITY_COLORS[r.rarity] }}>{RARITY_LABELS[r.rarity]}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>{r.collection} · {CHAIN_LABELS[r.chain]}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>稀有度评分</div>
                  <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{r.rarityScore}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>30d 成交</div>
                  <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatCurrency(r.volume30d)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>30d 涨跌</div>
                  <div className="text-sm font-semibold" style={{ color: changeColor(r.change30d) }}>{r.change30d >= 0 ? '+' : ''}{r.change30d.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'flow' && (
          <>
            <div className="flex gap-2">
              {(['all', 'mint', 'sale', 'transfer', 'list', 'delist', 'burn', 'airdrop', 'bid'] as FlowRecord['event'][]).map((e) => (
                <button key={e} onClick={() => setHistoryEventFilter(e)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: historyEventFilter === e ? BRAND.primaryLt : BRAND.card, color: historyEventFilter === e ? BRAND.primary : BRAND.textSub, border: `1px solid ${historyEventFilter === e ? BRAND.primary : BRAND.border}` }}>
                  {e === 'all' ? '全部' : e === 'mint' ? '铸造' : e === 'sale' ? '成交' : e === 'transfer' ? '转账' : e === 'list' ? '挂单' : e === 'delist' ? '撤单' : e === 'burn' ? '销毁' : e === 'airdrop' ? '空投' : '出价'}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredFlow.map((f) => (
                <div key={f.id} className="p-3 rounded-lg flex items-center gap-3 nm-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('history', f.id)}>
                  <div className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: f.event === 'mint' ? 'rgba(20,184,129,0.10)' : f.event === 'sale' ? 'rgba(68,219,244,0.10)' : f.event === 'burn' ? 'rgba(255,80,80,0.10)' : 'rgba(176,176,176,0.10)', color: f.event === 'mint' ? BRAND.primary : f.event === 'sale' ? BRAND.info : f.event === 'burn' ? '#FF5050' : BRAND.textMute }}>
                    {f.event === 'mint' ? '铸造' : f.event === 'sale' ? '成交' : f.event === 'transfer' ? '转账' : f.event === 'list' ? '挂单' : f.event === 'delist' ? '撤单' : f.event === 'burn' ? '销毁' : f.event === 'airdrop' ? '空投' : '出价'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{f.name}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                      {shortenAddress(f.from)} → {shortenAddress(f.to)} · {CHAIN_LABELS[f.chain]}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: f.event === 'sale' ? BRAND.primary : BRAND.text }}>{f.price > 0 ? `${f.price} ${f.currency}` : '-'}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{f.time.slice(5)}</div>
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
                  { k: '1-9', d: '快速切换 Tab（1=总览 2=持仓 3=一级 4=IP 5=挂单 6=拍卖 7=稀有度 8=流通 9=帮助）' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center gap-3">
                    <kbd className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</kbd>
                    <span style={{ color: BRAND.text }}>{it.d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
              <p className="mb-2"><strong>合规说明：</strong>本平台 NFT 二级市场与 IP 流通中心为"NFT 数字藏品二级市场与 IP 流通研究方向"演示页面。</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>所有藏品 / 拍卖 / 挂单 / IP 数据为研究演示占位，不构成任何交易、收藏或投资建议</li>
                <li>数字藏品价格受市场供需、流动性、IP 热度等多种因素影响，可能出现剧烈波动</li>
                <li>研究阶段不接入真实铸造、撮合、支付与结算流程</li>
                <li>用户应自行评估数字藏品的真伪、IP 授权、版权归属与法律风险</li>
                <li>本平台严格遵守所在司法管辖区的合规要求，不在任何禁止数字藏品的地区提供服务</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 底部 CTA */}
      <div className="px-6 py-6 mt-6" style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>共建数字藏品资产生态</div>
            <div className="text-[11px]" style={{ color: BRAND.textSub }}>面向 IP 方 / 创作者 / 收藏家 / 机构，提供一级发行、二级流通、IP 合作、拍卖结算等基础设施</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('primary')} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <Rocket size={14} /> 立即申购
            </button>
            <button onClick={() => setTab('ip')} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Handshake size={14} /> 申请 IP 合作
            </button>
            <button onClick={() => setHelpOpen(true)} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'collectible' && drawer.payload && (() => {
        const c = COLLECTIBLES.find((x) => x.id === drawer.payload);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>藏品详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="aspect-square rounded-xl flex items-center justify-center text-7xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{c.image}</div>
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{c.name}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{c.collection} · {CHAIN_LABELS[c.chain]} · {c.standard}</div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>{c.description}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>地板价</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatPrice(c.floorPrice)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>24h 涨跌</div>
                    <div className="text-base font-bold" style={{ color: changeColor(c.change24h) }}>{c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>24h 成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatCurrency(c.volume24h)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>持有者</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{c.owners.toLocaleString()}</div>
                  </div>
                </div>
                {c.ipPartner && (
                  <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                    <Handshake size={14} /> IP 合作伙伴：{c.ipPartner}
                  </div>
                )}
                <div>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>属性特征</div>
                  <div className="grid grid-cols-3 gap-1">
                    {c.attributes.map((a) => (
                      <div key={a.trait} className="p-2 rounded text-center" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px]" style={{ color: BRAND.textMute }}>{a.trait}</div>
                        <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{a.value}</div>
                        <div className="text-[9px]" style={{ color: BRAND.primary }}>{a.rarity}% 拥有</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setOrderPrice(c.floorPrice.toString()); setTimeout(() => openDrawer('place_order'), 100); }} className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即购买</button>
                  <button onClick={() => { setBidAmount((c.floorPrice * 1.1).toString()); setTimeout(() => openDrawer('bid'), 100); }} className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>参与拍卖</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'auction' && drawer.payload && (() => {
        const a = AUCTIONS.find((x) => x.id === drawer.payload);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>拍卖详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="aspect-square rounded-xl flex items-center justify-center text-7xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{a.image}</div>
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{a.name}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{a.collection} · {CHAIN_LABELS[a.chain]}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>当前出价</div>
                  <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{a.currentBid} {a.currency}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>起拍价 {a.startBid} · 加价幅度 {a.minIncrement}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>出价次数</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{a.bids}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>出价人数</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{a.bidders}</div>
                  </div>
                </div>
                {a.status === 'live' && (
                  <>
                    <div>
                      <label className="text-xs" style={{ color: BRAND.textSub }}>您的出价（{a.currency}）</label>
                      <input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`至少 ${(a.currentBid + a.minIncrement).toFixed(2)} ${a.currency}`} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                    </div>
                    <button onClick={handleBid} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交出价</button>
                  </>
                )}
                {a.buyNowPrice && a.status === 'live' && (
                  <button onClick={() => alert(`已立即购买：${a.buyNowPrice} ${a.currency}`)} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.primary}` }}>
                    立即购买：{a.buyNowPrice} {a.currency}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'ip' && drawer.payload && (() => {
        const p = IP_PARTNERS.find((x) => x.id === drawer.payload);
        if (!p) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>IP 合作伙伴详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{p.logo}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{p.name}</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{p.industry} · 合作 {p.cooperationAt}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>{p.description}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>累计系列</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{p.totalCollections}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>累计发行</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{p.totalIssued.toLocaleString()}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>累计成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{formatCurrency(p.totalVolume)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>IP 评分</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>★ {p.rating.toFixed(1)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated }}>
                  <div style={{ color: BRAND.textMute }}>联系邮箱</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{p.contact}</div>
                </div>
                <button onClick={() => alert(`已提交 IP 合作申请：${p.name}`)} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>申请合作</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'mint' && drawer.payload && (() => {
        const p = PRIMARY_ISSUANCES.find((x) => x.id === drawer.payload);
        if (!p) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>一级申购确认</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>{p.image}</div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>{p.name}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{p.collection} · {CHAIN_LABELS[p.chain]}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                  · 申购时间：{p.startAt} ~ {p.endAt}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>单价</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{p.price} {p.currency}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>总供应</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{p.totalSupply.toLocaleString()}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: '1px solid #FFB40040' }}>
                  · 申购前请确认所在司法管辖区允许参与数字藏品一级发行
                </div>
                <button onClick={() => { alert(`已提交申购：${p.name}`); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: p.status === 'live' ? BRAND.primary : BRAND.cardElevated, color: p.status === 'live' ? '#000' : BRAND.textMute }}>
                  {p.status === 'live' ? `立即申购 ${p.price} ${p.currency}` : '当前未开放申购'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'place_order' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>挂单出售</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>挂单价格</label>
                <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} placeholder="例：2.84" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>有效期（天）</label>
                <select value={orderExpiry} onChange={(e) => setOrderExpiry(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="1">1 天</option>
                  <option value="3">3 天</option>
                  <option value="7">7 天</option>
                  <option value="14">14 天</option>
                  <option value="30">30 天</option>
                </select>
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400', border: '1px solid #FFB40040' }}>
                · 挂单后将自动扣除约 2.5% 平台手续费
              </div>
              <button onClick={handlePlaceOrder} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认挂单</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'bid' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>参与拍卖</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>您的出价</label>
                <input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="例：3.00" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <button onClick={handleBid} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交出价</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'order' && drawer.payload && (() => {
        const o = ORDERS.find((x) => x.id === drawer.payload);
        if (!o) return null;
        const sb = statusBadge(o.status);
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>挂单详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{o.name}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{o.collection} · {CHAIN_LABELS[o.chain]} · Token #{o.tokenId}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: sb.bg, border: `1px solid ${sb.fg}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>挂单状态</div>
                  <div className="text-base font-bold" style={{ color: sb.fg }}>{sb.label}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>方向</div>
                    <div className="text-base font-bold" style={{ color: o.side === 'buy' ? BRAND.primary : '#FF5050' }}>{o.side === 'buy' ? '买入' : '卖出'}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>价格</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{o.price} {o.currency}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>数量</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{o.amount}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>已成交</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{(o.filled * 100).toFixed(0)}%</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>版税</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{o.royalty} {o.currency}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>平台费</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{o.fee} {o.currency}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                  <div style={{ color: BRAND.textMute }}>挂单方</div>
                  <div className="font-mono mt-1">{shortenAddress(o.maker)}</div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                  <div style={{ color: BRAND.textMute }}>到期时间</div>
                  <div className="mt-1">{o.expiry}</div>
                </div>
                {o.status === 'active' && (
                  <button onClick={() => { alert(`已撤销挂单：${o.id}`); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: '#FF5050', border: '1px solid #FF505040' }}>
                    撤销挂单
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'history' && drawer.payload && (() => {
        const f = FLOW_RECORDS.find((x) => x.id === drawer.payload);
        if (!f) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>流通记录详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{f.name}</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{f.collection} · {CHAIN_LABELS[f.chain]} · Token #{f.tokenId}</div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>事件类型</div>
                    <div className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: f.event === 'sale' ? 'rgba(20,184,129,0.10)' : 'rgba(176,176,176,0.10)', color: f.event === 'sale' ? BRAND.primary : BRAND.textMute }}>
                      {f.event === 'mint' ? '铸造' : f.event === 'sale' ? '成交' : f.event === 'transfer' ? '转账' : f.event === 'list' ? '挂单' : f.event === 'delist' ? '撤单' : f.event === 'burn' ? '销毁' : f.event === 'airdrop' ? '空投' : '出价'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>价格</div>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{f.price > 0 ? `${f.price} ${f.currency}` : '免费'}</div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>时间</div>
                    <div className="text-[11px]" style={{ color: BRAND.text }}>{f.time}</div>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ color: BRAND.textMute }}>市场</div>
                    <div className="text-[11px]" style={{ color: BRAND.text }}>{f.marketplace}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                  <div style={{ color: BRAND.textMute }}>From</div>
                  <div className="font-mono mt-1">{shortenAddress(f.from, 10, 8)}</div>
                  <div className="mt-2" style={{ color: BRAND.textMute }}>To</div>
                  <div className="font-mono mt-1">{shortenAddress(f.to, 10, 8)}</div>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                  <div style={{ color: BRAND.textMute }}>交易哈希</div>
                  <div className="font-mono mt-1">{f.txHash}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto nm-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
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
