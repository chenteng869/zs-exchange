'use client';

/**
 * PortalNft - NFT 数字藏品中心（2026-07-19 Q05 P3.28）
 *
 * 页面定位：
 * - 中萨数字科技交易所 NFT 数字藏品中心
 * - 藏品发行 / 二级市场 / 创作者中心 / 拍卖行 / 盲盒 / IP 合作
 * - 与 P3.18 Launch + P3.24 生态 + P3.25 做市形成"发行-市场-生态-IP"创意资产生态闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 藏品发行 / 二级市场 / 创作者中心 /
 *             拍卖行 / 盲盒 / IP 合作 / 我的藏品 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 系列过滤 / 搜索 / 排序 / 链上/链下过滤 / 详情 Drawer /
 *           铸造向导 / 拍卖出价 / 快捷键
 * - 7+ Drawer：藏品详情 / 创作者详情 / 拍卖详情 / 盲盒详情 / 铸造向导 / IP 详情 / 帮助
 * - 4+ 实时数据：在线铸造 / 拍卖进行 / 实时成交 / 地板价
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 所有藏品 / 拍卖 / 盲盒 / IP 数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 数字藏品仅做 UI 演示，不接真实铸造 / 交易流程
 * - 严格规避"承诺收益 / 保本 / 刚兑"等高风险词
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
  ImagePlus,
  Palette,
  Brush,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Medal,
  Heart,
  ThumbsUp,
  Bookmark,
  Flag,
  Tag,
  Tags,
  Eye,
  EyeOff,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Upload,
  FileText,
  FileCode,
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
  Coins,
  CircleDollarSign,
  Wallet,
  Hammer,
  Gavel,
  TrendingUp,
  TrendingDown,
  LineChart as LineIcon,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Gauge,
  Target,
  Crosshair,
  Compass,
  Map as MapIcon,
  MapPin,
  Globe2,
  Globe,
  Zap,
  Rocket,
  Flame,
  Settings,
  Sliders,
  SlidersHorizontal,
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
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  XCircle,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Hexagon,
  Diamond,
  Music,
  Music2,
  Music3,
  Mic,
  Video,
  PlayCircle,
  Camera,
  Aperture,
  Frame,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'mint' | 'market' | 'creator' | 'auction' | 'blindbox' | 'ip' | 'profile' | 'help';
type CollectionCategory = 'art' | 'music' | 'video' | 'photography' | 'gaming' | 'sports' | 'collectible' | 'utility' | 'domain' | 'metaverse';
type Chain = 'zs-chain' | 'eth' | 'bsc' | 'polygon' | 'solana' | 'multi';
type Standard = 'ERC-721' | 'ERC-1155' | 'ZS-721' | 'ZS-1155' | 'SPL';
type ItemStatus = 'live' | 'upcoming' | 'ended' | 'sold-out' | 'paused';
type AuctionType = 'english' | 'dutch' | 'sealed-bid' | 'reserve';
type AuctionStatus = 'upcoming' | 'live' | 'ended' | 'settled' | 'cancelled';
type BlindBoxTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type BlindBoxStatus = 'upcoming' | 'live' | 'sold-out' | 'ended';
type CreatorTier = 'legendary' | 'pro' | 'rising' | 'verified' | 'community';
type IPType = 'ip-cooperation' | 'brand-license' | 'art-collaboration' | 'celebrity' | 'sports' | 'media';
type IPStatus = 'active' | 'pending' | 'ended' | 'renewal';
type DrawerType = 'collection' | 'item' | 'auction' | 'blindbox' | 'creator' | 'ip' | 'mint' | 'help' | null;

interface Collection {
  id: string;
  name: string;
  category: CollectionCategory;
  chain: Chain;
  standard: Standard;
  status: ItemStatus;
  creator: string;
  creatorId: string;
  creatorTier: CreatorTier;
  symbol: string;
  description: string;
  totalSupply: number;
  minted: number;
  owners: number;
  floorPrice: number;
  volumeTotal: number;
  volume24h: number;
  volumeChange24h: number;
  listed: number;
  royalty: number;
  banner: string; // emoji placeholder
  avatar: string;
  verified: boolean;
  tags: string[];
  launchDate: string;
  updatedAt: string;
  socialLinks: { twitter?: string; discord?: string; website?: string };
  highlights: string[];
  benefits: string[];
  rarity: { legendary: number; epic: number; rare: number; common: number };
}

interface Item {
  id: string;
  collectionId: string;
  collectionName: string;
  tokenId: string;
  name: string;
  image: string; // emoji placeholder
  rarity: BlindBoxTier;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: number;
  currency: string;
  lastSale: number;
  listed: boolean;
  views: number;
  likes: number;
  acquiredAt: string;
  forSale: boolean;
  chain: Chain;
}

interface Auction {
  id: string;
  title: string;
  type: AuctionType;
  status: AuctionStatus;
  collection: string;
  tokenId: string;
  image: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  minBid: number;
  reservePrice?: number;
  buyNowPrice?: number;
  bids: number;
  bidders: number;
  seller: string;
  description: string;
  chain: Chain;
  views: number;
  watchlist: number;
  history: { time: string; bidder: string; amount: number }[];
  rarity: BlindBoxTier;
  attributes: { trait_type: string; value: string }[];
}

interface BlindBox {
  id: string;
  name: string;
  collection: string;
  image: string;
  status: BlindBoxStatus;
  price: number;
  currency: string;
  totalSupply: number;
  sold: number;
  maxPerUser: number;
  saleStart: string;
  saleEnd: string;
  tiers: { tier: BlindBoxTier; probability: number; supply: number; items: string[] }[];
  description: string;
  chain: Chain;
  participants: number;
  totalRevenue: number;
  rarity: BlindBoxTier;
  guaranteed: boolean;
  tags: string[];
}

interface Creator {
  id: string;
  name: string;
  tier: CreatorTier;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  collections: number;
  items: number;
  volumeTotal: number;
  royaltyEarned: number;
  verified: boolean;
  joinedAt: string;
  socialLinks: { twitter?: string; discord?: string; website?: string; instagram?: string };
  specialties: string[];
  achievements: string[];
  recentWorks: string[];
  monthlyStats: { month: string; volume: number; items: number; royalty: number }[];
}

interface IPDetail {
  id: string;
  name: string;
  type: IPType;
  status: IPStatus;
  partner: string;
  region: string;
  since: string;
  until: string;
  description: string;
  collections: number;
  totalVolume: number;
  benefits: string[];
  contact: string;
  logo: string;
  highlights: string[];
  audience: string;
  collaborations: string[];
}

interface KpiSnapshot {
  totalCollections: number;
  totalItems: number;
  totalCreators: number;
  totalVolume: number;
  volume24h: number;
  totalOwners: number;
  liveAuctions: number;
  liveBlindBoxes: number;
  liveMints: number;
  floorIndex: number;
  totalRoyalties: number;
  ipPartners: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const COLLECTIONS: Collection[] = [
  {
    id: 'c-001', name: 'Aurora Genesis 极光创世', category: 'art', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'Aurora Studio', creatorId: 'cr-001', creatorTier: 'legendary', symbol: 'AURA',
    description: '极光创世系列，由 8 位数字艺术家共同创作的 8888 件生成艺术作品，灵感来自极地光影。',
    totalSupply: 8888, minted: 6248, owners: 4280, floorPrice: 0.42, volumeTotal: 4280000, volume24h: 184000, volumeChange24h: 12.4,
    listed: 824, royalty: 5, banner: '🌌', avatar: '✨', verified: true,
    tags: ['生成艺术', '极光', '限量', '艺术家联名'],
    launchDate: '2025-12-15', updatedAt: '2026-07-18',
    socialLinks: { twitter: '@aurora_', website: 'aurora.example.com' },
    highlights: ['8 位艺术家联名', '8888 件限量', '5% 创作者版税', '官方认证'],
    benefits: ['线下展览权', '社区 DAO 投票', '新系列白名单', '平台手续费 5 折'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 7904 },
  },
  {
    id: 'c-002', name: 'Cyber Punks 2087 赛博朋克', category: 'collectible', chain: 'eth', standard: 'ERC-721', status: 'live',
    creator: 'NeonPunk Labs', creatorId: 'cr-002', creatorTier: 'pro', symbol: 'CYP',
    description: '赛博朋克 2087 主题朋克头像，8888 件算法生成，5 大稀有度等级。',
    totalSupply: 8888, minted: 8888, owners: 6480, floorPrice: 0.84, volumeTotal: 12400000, volume24h: 248000, volumeChange24h: 8.2,
    listed: 1240, royalty: 7.5, banner: '🤖', avatar: '👾', verified: true,
    tags: ['朋克', '头像', '算法', '已售罄'],
    launchDate: '2024-08-08', updatedAt: '2026-07-19',
    socialLinks: { twitter: '@cyberpunks_', discord: 'cyberpunks' },
    highlights: ['全部售罄', '8.2% 24h 涨幅', '6480 独立持有人', '二级市场活跃'],
    benefits: ['品牌合作优先', '元宇宙形象', 'IP 衍生品白名单'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 7904 },
  },
  {
    id: 'c-003', name: 'Cosmic Pixels 宇宙像素', category: 'art', chain: 'zs-chain', standard: 'ZS-1155', status: 'live',
    creator: 'PixelGalaxy', creatorId: 'cr-003', creatorTier: 'pro', symbol: 'CPXL',
    description: '宇宙像素艺术，16x16 像素风格，每件都是独特的宇宙天体。',
    totalSupply: 16000, minted: 12480, owners: 5240, floorPrice: 0.18, volumeTotal: 1840000, volume24h: 84000, volumeChange24h: 4.6,
    listed: 1240, royalty: 5, banner: '🌠', avatar: '🪐', verified: true,
    tags: ['像素', '宇宙', '1155', '可组合'],
    launchDate: '2025-06-12', updatedAt: '2026-07-17',
    socialLinks: { twitter: '@cosmicpixels' },
    highlights: ['1.6 万件供应', 'ERC-1155 批量', '16x16 像素', '宇宙主题'],
    benefits: ['批量转移优惠', '平台手续费折扣', '社区活动优先'],
    rarity: { legendary: 16, epic: 160, rare: 1600, common: 14224 },
  },
  {
    id: 'c-004', name: 'Midnight Jazz 午夜爵士', category: 'music', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'BlueNote Records', creatorId: 'cr-004', creatorTier: 'verified', symbol: 'MJZ',
    description: '午夜爵士音乐 NFT 系列，每件作品附带独家现场录音与版权。',
    totalSupply: 240, minted: 240, owners: 184, floorPrice: 12.4, volumeTotal: 840000, volume24h: 18400, volumeChange24h: -2.4,
    listed: 24, royalty: 10, banner: '🎷', avatar: '🎵', verified: true,
    tags: ['音乐', '爵士', '版权', '已售罄'],
    launchDate: '2025-04-18', updatedAt: '2026-07-15',
    socialLinks: { twitter: '@midnightjazz', website: 'midnightjazz.example.com' },
    highlights: ['全部售罄', '独家现场录音', '10% 创作者版税', '184 持有人'],
    benefits: ['音乐版权分成', '现场活动邀请', '新专辑白名单'],
    rarity: { legendary: 4, epic: 24, rare: 60, common: 152 },
  },
  {
    id: 'c-005', name: 'Sport Legends 体育传奇', category: 'sports', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'SportFi', creatorId: 'cr-005', creatorTier: 'pro', symbol: 'SPLG',
    description: '体育传奇时刻数字藏品，记录历史性瞬间。',
    totalSupply: 10000, minted: 6480, owners: 4840, floorPrice: 0.32, volumeTotal: 1840000, volume24h: 124000, volumeChange24h: 18.4,
    listed: 840, royalty: 6, banner: '🏆', avatar: '⚽', verified: true,
    tags: ['体育', '传奇时刻', 'IP 合作', '动态'],
    launchDate: '2025-09-08', updatedAt: '2026-07-19',
    socialLinks: { twitter: '@sportlegends' },
    highlights: ['1 万件供应', '6480 已铸造', '动态内容', 'IP 合作'],
    benefits: ['实体周边折扣', '赛事门票优先', '球员见面会'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 9016 },
  },
  {
    id: 'c-006', name: 'Pixel Warriors 像素勇士', category: 'gaming', chain: 'bsc', standard: 'ERC-721', status: 'live',
    creator: 'PixelForge', creatorId: 'cr-006', creatorTier: 'pro', symbol: 'PXW',
    description: '像素风游戏角色 NFT，10000 件独特角色，可用于多款链游。',
    totalSupply: 10000, minted: 10000, owners: 7280, floorPrice: 0.084, volumeTotal: 2480000, volume24h: 64000, volumeChange24h: 4.2,
    listed: 1240, royalty: 5, banner: '⚔️', avatar: '🛡️', verified: true,
    tags: ['游戏', '角色', '多链游', '已售罄'],
    launchDate: '2024-11-22', updatedAt: '2026-07-16',
    socialLinks: { twitter: '@pixelwarriors', discord: 'pxw' },
    highlights: ['全部售罄', '多链游支持', '7 千持有人', '链游生态'],
    benefits: ['链游内道具', '游戏代币空投', '锦标赛门票'],
    rarity: { legendary: 12, epic: 88, rare: 888, common: 9012 },
  },
  {
    id: 'c-007', name: 'AI Dreams AI 之梦', category: 'art', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'ZSDEX AI Lab', creatorId: 'cr-007', creatorTier: 'legendary', symbol: 'AID',
    description: 'AI 生成艺术系列，每件作品由独立 AI 模型创作，独一无二。',
    totalSupply: 5000, minted: 3840, owners: 2840, floorPrice: 0.62, volumeTotal: 1640000, volume24h: 124000, volumeChange24h: 24.6,
    listed: 480, royalty: 8, banner: '🤖', avatar: '🎨', verified: true,
    tags: ['AI', '生成艺术', '官方', '热门'],
    launchDate: '2026-01-15', updatedAt: '2026-07-19',
    socialLinks: { twitter: '@aidreams' },
    highlights: ['AI 官方出品', '24.6% 24h 涨幅', '5 千件供应', '8% 版税'],
    benefits: ['AI 模型使用权限', '平台高级会员', '新模型白名单'],
    rarity: { legendary: 4, epic: 48, rare: 480, common: 4468 },
  },
  {
    id: 'c-008', name: 'Vintage Films 复古影院', category: 'video', chain: 'zs-chain', standard: 'ZS-1155', status: 'upcoming',
    creator: 'VintageCinema', creatorId: 'cr-008', creatorTier: 'verified', symbol: 'VFILM',
    description: '复古电影胶片 NFT 系列，每件附带独家幕后花絮。',
    totalSupply: 2000, minted: 0, owners: 0, floorPrice: 0, volumeTotal: 0, volume24h: 0, volumeChange24h: 0,
    listed: 0, royalty: 7, banner: '🎬', avatar: '📽️', verified: true,
    tags: ['电影', '复古', '视频', '即将发行'],
    launchDate: '2026-08-15', updatedAt: '2026-07-12',
    socialLinks: { twitter: '@vintagefilms' },
    highlights: ['2 千件限量', '即将发行', '7% 版税', '独家幕后'],
    benefits: ['独家幕后花絮', '电影节门票', '新片白名单'],
    rarity: { legendary: 4, epic: 24, rare: 200, common: 1772 },
  },
  {
    id: 'c-009', name: 'Domain Genesis 域名创世', category: 'domain', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'ZSDEX 官方', creatorId: 'cr-009', creatorTier: 'legendary', symbol: 'ZD',
    description: '平台官方域名 NFT，5 字符以内短域名，支持多链解析。',
    totalSupply: 100000, minted: 24800, owners: 18420, floorPrice: 0.04, volumeTotal: 4840000, volume24h: 84000, volumeChange24h: -1.4,
    listed: 2400, royalty: 0, banner: '🌐', avatar: '🔤', verified: true,
    tags: ['域名', '官方', '短域名', '多链'],
    launchDate: '2025-03-20', updatedAt: '2026-07-19',
    socialLinks: { website: 'domains.zsdex.example.com' },
    highlights: ['10 万件供应', '2.4 万已铸造', '多链解析', '官方域名'],
    benefits: ['多链解析', 'ENS 互通', '平台账户绑定'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 99016 },
  },
  {
    id: 'c-010', name: 'Meta Realms 元宇宙地产', category: 'metaverse', chain: 'polygon', standard: 'ERC-721', status: 'live',
    creator: 'MetaBuild', creatorId: 'cr-010', creatorTier: 'pro', symbol: 'MTR',
    description: '元宇宙地产 NFT，分布在 8 个虚拟城市，支持建设。',
    totalSupply: 50000, minted: 38400, owners: 18420, floorPrice: 0.024, volumeTotal: 2840000, volume24h: 64000, volumeChange24h: 6.4,
    listed: 4280, royalty: 3, banner: '🌆', avatar: '🏙️', verified: true,
    tags: ['元宇宙', '地产', '多城市', 'Polygon'],
    launchDate: '2024-06-08', updatedAt: '2026-07-18',
    socialLinks: { twitter: '@metarealms', website: 'metarealms.example.com' },
    highlights: ['5 万件地产', '3.8 万已售', '8 个虚拟城市', 'Polygon'],
    benefits: ['元宇宙建设权', '虚拟活动', '广告位'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 49016 },
  },
  {
    id: 'c-011', name: 'Lunar Photography 月球摄影', category: 'photography', chain: 'zs-chain', standard: 'ZS-721', status: 'live',
    creator: 'StarLens', creatorId: 'cr-011', creatorTier: 'verified', symbol: 'LUN',
    description: '月球摄影集，NASA 公开素材再创作，每件都是独特视角。',
    totalSupply: 888, minted: 888, owners: 624, floorPrice: 0.42, volumeTotal: 248000, volume24h: 8400, volumeChange24h: 2.4,
    listed: 88, royalty: 6, banner: '🌙', avatar: '📸', verified: true,
    tags: ['摄影', '月球', '限量', '已售罄'],
    launchDate: '2025-08-12', updatedAt: '2026-07-15',
    socialLinks: { twitter: '@starlens' },
    highlights: ['888 件限量', '全部售罄', '月球视角', '6% 版税'],
    benefits: ['NASA 合作素材', '线下展览', '新作品白名单'],
    rarity: { legendary: 4, epic: 24, rare: 88, common: 772 },
  },
  {
    id: 'c-012', name: 'Dragon Eggs 龙蛋', category: 'collectible', chain: 'bsc', standard: 'ERC-1155', status: 'upcoming',
    creator: 'MythicStudio', creatorId: 'cr-012', creatorTier: 'pro', symbol: 'DRE',
    description: '神秘龙蛋 NFT，开盲盒孵化不同等级幼龙，5 大稀有度。',
    totalSupply: 20000, minted: 0, owners: 0, floorPrice: 0, volumeTotal: 0, volume24h: 0, volumeChange24h: 0,
    listed: 0, royalty: 5, banner: '🥚', avatar: '🐉', verified: true,
    tags: ['盲盒', '龙', '孵化', '即将发行'],
    launchDate: '2026-09-01', updatedAt: '2026-07-19',
    socialLinks: { twitter: '@dragoneggs', discord: 'dragoneggs' },
    highlights: ['2 万件供应', '即将发行', '5 大稀有度', '5% 版税'],
    benefits: ['孵化玩法', '繁殖系统', '战斗系统', '元宇宙导入'],
    rarity: { legendary: 8, epic: 88, rare: 888, common: 19016 },
  },
];

const AUCTIONS: Auction[] = [
  {
    id: 'a-001', title: 'Aurora Genesis #0001 创世之光', type: 'english', status: 'live',
    collection: 'Aurora Genesis 极光创世', tokenId: '0001', image: '🌌',
    startTime: '2026-07-19 10:00', endTime: '2026-07-22 22:00',
    currentBid: 84, minBid: 88, reservePrice: 80, buyNowPrice: 248,
    bids: 24, bidders: 18, seller: '0x****7421',
    description: 'Aurora Genesis 系列创世 #0001，唯一 legendary 等级，附赠艺术家亲笔签名。',
    chain: 'zs-chain', views: 2480, watchlist: 184, rarity: 'legendary',
    attributes: [
      { trait_type: '背景', value: '极光紫' }, { trait_type: '主调', value: '翡翠' },
      { trait_type: '元素', value: '星尘' }, { trait_type: '稀有度', value: 'Legendary' },
    ],
    history: [
      { time: '2026-07-19 10:18', bidder: '0x****a824', amount: 84 },
      { time: '2026-07-19 09:48', bidder: '0x****b712', amount: 78 },
      { time: '2026-07-19 09:24', bidder: '0x****a824', amount: 72 },
    ],
  },
  {
    id: 'a-002', title: 'Cyber Punk #0042 暗影黑客', type: 'dutch', status: 'live',
    collection: 'Cyber Punks 2087 赛博朋克', tokenId: '0042', image: '👾',
    startTime: '2026-07-19 08:00', endTime: '2026-07-19 20:00',
    currentBid: 4.2, minBid: 4.0, buyNowPrice: 6.0,
    bids: 8, bidders: 6, seller: '0x****9911',
    description: 'Cyber Punks #0042 暗影黑客，epic 等级，荷兰拍价格递减。',
    chain: 'eth', views: 1840, watchlist: 124, rarity: 'epic',
    attributes: [
      { trait_type: '类型', value: '黑客' }, { trait_type: '配色', value: '暗夜黑' },
      { trait_type: '配件', value: 'VR 眼镜' }, { trait_type: '稀有度', value: 'Epic' },
    ],
    history: [
      { time: '2026-07-19 09:18', bidder: '0x****5521', amount: 4.2 },
      { time: '2026-07-19 08:42', bidder: '0x****3a2f', amount: 4.4 },
    ],
  },
  {
    id: 'a-003', title: 'AI Dreams #1024 AI 之梦', type: 'sealed-bid', status: 'upcoming',
    collection: 'AI Dreams AI 之梦', tokenId: '1024', image: '🎨',
    startTime: '2026-07-25 20:00', endTime: '2026-07-28 20:00',
    currentBid: 0, minBid: 1, reservePrice: 5,
    bids: 0, bidders: 0, seller: '0x****aa18',
    description: 'AI Dreams #1024，AI 模型独立创作，epic 等级，密封拍卖。',
    chain: 'zs-chain', views: 0, watchlist: 248, rarity: 'epic',
    attributes: [
      { trait_type: '主题', value: '梦境' }, { trait_type: '主色', value: '星云' },
      { trait_type: '稀有度', value: 'Epic' },
    ],
    history: [],
  },
  {
    id: 'a-004', title: 'Sport Legends #0036 绝杀时刻', type: 'english', status: 'ended',
    collection: 'Sport Legends 体育传奇', tokenId: '0036', image: '⚽',
    startTime: '2026-07-12 10:00', endTime: '2026-07-15 22:00',
    currentBid: 8.4, minBid: 8.0, reservePrice: 6,
    bids: 42, bidders: 28, seller: '0x****3a2f',
    description: 'Sport Legends #0036 绝杀时刻，epic 等级，已结拍。',
    chain: 'zs-chain', views: 4280, watchlist: 384, rarity: 'epic',
    attributes: [
      { trait_type: '运动', value: '足球' }, { trait_type: '类型', value: '绝杀' },
      { trait_type: '稀有度', value: 'Epic' },
    ],
    history: [
      { time: '2026-07-15 22:00', bidder: '0x****final', amount: 8.4 },
      { time: '2026-07-15 21:42', bidder: '0x****a824', amount: 8.0 },
    ],
  },
  {
    id: 'a-005', title: 'Pixel Warrior #0512 暗影刺客', type: 'english', status: 'live',
    collection: 'Pixel Warriors 像素勇士', tokenId: '0512', image: '⚔️',
    startTime: '2026-07-19 06:00', endTime: '2026-07-20 18:00',
    currentBid: 0.42, minBid: 0.45, reservePrice: 0.4, buyNowPrice: 0.84,
    bids: 12, bidders: 9, seller: '0x****bb22',
    description: 'Pixel Warrior #0512 暗影刺客，rare 等级，链游多场景可用。',
    chain: 'bsc', views: 1240, watchlist: 84, rarity: 'rare',
    attributes: [
      { trait_type: '职业', value: '刺客' }, { trait_type: '稀有度', value: 'Rare' },
    ],
    history: [
      { time: '2026-07-19 10:08', bidder: '0x****cc11', amount: 0.42 },
    ],
  },
];

const BLIND_BOXES: BlindBox[] = [
  {
    id: 'b-001', name: 'Cosmic Pixels 神秘盲盒', collection: 'Cosmic Pixels 宇宙像素',
    image: '🌠', status: 'live', price: 49, currency: 'USDT',
    totalSupply: 5000, sold: 3840, maxPerUser: 5,
    saleStart: '2026-07-15 20:00', saleEnd: '2026-07-25 20:00',
    tiers: [
      { tier: 'legendary', probability: 0.5, supply: 25, items: ['宇宙之心', '银河起源'] },
      { tier: 'epic', probability: 4.5, supply: 225, items: ['星云', '黑洞', '脉冲星'] },
      { tier: 'rare', probability: 15, supply: 750, items: ['彗星', '陨石', '行星'] },
      { tier: 'common', probability: 80, supply: 4000, items: ['普通像素'] },
    ],
    description: '宇宙像素神秘盲盒，开出 5 大稀有度等级宇宙天体，附赠平台权益。',
    chain: 'zs-chain', participants: 1840, totalRevenue: 188160, rarity: 'epic', guaranteed: true,
    tags: ['盲盒', '宇宙', '神秘', '5 大稀有度'],
  },
  {
    id: 'b-002', name: 'Dragon Eggs 龙蛋孵化盒', collection: 'Dragon Eggs 龙蛋',
    image: '🥚', status: 'upcoming', price: 39, currency: 'USDT',
    totalSupply: 10000, sold: 0, maxPerUser: 3,
    saleStart: '2026-09-01 20:00', saleEnd: '2026-09-08 20:00',
    tiers: [
      { tier: 'mythic', probability: 0.1, supply: 10, items: ['远古神龙'] },
      { tier: 'legendary', probability: 0.9, supply: 90, items: ['黄金龙', '暗黑龙'] },
      { tier: 'epic', probability: 4, supply: 400, items: ['银龙', '青龙'] },
      { tier: 'rare', probability: 15, supply: 1500, items: ['蓝龙', '红龙'] },
      { tier: 'common', probability: 80, supply: 8000, items: ['小龙'] },
    ],
    description: '龙蛋盲盒，5 大稀有度 + 1 神话级，开盒后可在元宇宙中孵化。',
    chain: 'bsc', participants: 0, totalRevenue: 0, rarity: 'legendary', guaranteed: false,
    tags: ['盲盒', '龙', '元宇宙', '孵化'],
  },
  {
    id: 'b-003', name: 'AI Dreams 梦境盲盒', collection: 'AI Dreams AI 之梦',
    image: '🎨', status: 'live', price: 29, currency: 'USDT',
    totalSupply: 3000, sold: 2480, maxPerUser: 10,
    saleStart: '2026-07-10 20:00', saleEnd: '2026-07-30 20:00',
    tiers: [
      { tier: 'legendary', probability: 1, supply: 30, items: ['AI 独白'] },
      { tier: 'epic', probability: 9, supply: 270, items: ['梦境'] },
      { tier: 'rare', probability: 30, supply: 900, items: ['幻想'] },
      { tier: 'common', probability: 60, supply: 1800, items: ['AI 涂鸦'] },
    ],
    description: 'AI 梦境盲盒，AI 模型创作的梦境艺术作品。',
    chain: 'zs-chain', participants: 1240, totalRevenue: 71920, rarity: 'epic', guaranteed: true,
    tags: ['盲盒', 'AI', '梦境'],
  },
  {
    id: 'b-004', name: 'Cyber Punks 神秘头像', collection: 'Cyber Punks 2087 赛博朋克',
    image: '🤖', status: 'sold-out', price: 19, currency: 'USDT',
    totalSupply: 2000, sold: 2000, maxPerUser: 3,
    saleStart: '2026-06-15 20:00', saleEnd: '2026-06-25 20:00',
    tiers: [
      { tier: 'legendary', probability: 0.5, supply: 10, items: ['赛博领主'] },
      { tier: 'epic', probability: 4.5, supply: 90, items: ['黑客', '改造人'] },
      { tier: 'rare', probability: 15, supply: 300, items: ['普通朋克'] },
      { tier: 'common', probability: 80, supply: 1600, items: ['路人'] },
    ],
    description: '赛博朋克头像盲盒，已售罄，二级市场可流通。',
    chain: 'eth', participants: 1280, totalRevenue: 38000, rarity: 'rare', guaranteed: true,
    tags: ['盲盒', '朋克', '已售罄'],
  },
];

const CREATORS: Creator[] = [
  {
    id: 'cr-001', name: 'Aurora Studio', tier: 'legendary', avatar: '✨',
    bio: '极光工作室专注于生成艺术，8 位艺术家联名创作极光创世系列。',
    followers: 28400, following: 124, collections: 12, items: 24000,
    volumeTotal: 12400000, royaltyEarned: 620000, verified: true,
    joinedAt: '2024-08-15',
    socialLinks: { twitter: '@aurora_', website: 'aurora.example.com' },
    specialties: ['生成艺术', '光影', '算法', '色彩'],
    achievements: ['平台 2025 年度艺术家', '10+ 系列发行', '百万美元销量'],
    recentWorks: ['Aurora Genesis 极光创世', 'Northern Lights 北极光', 'Cosmic Dance 宇宙之舞'],
    monthlyStats: [
      { month: '2026-07', volume: 184000, items: 12, royalty: 9200 },
      { month: '2026-06', volume: 224000, items: 18, royalty: 11200 },
      { month: '2026-05', volume: 168000, items: 14, royalty: 8400 },
    ],
  },
  {
    id: 'cr-002', name: 'NeonPunk Labs', tier: 'pro', avatar: '👾',
    bio: '赛博朋克主题数字朋克头像，引领算法头像潮流。',
    followers: 18420, following: 248, collections: 4, items: 24000,
    volumeTotal: 18400000, royaltyEarned: 1240000, verified: true,
    joinedAt: '2024-04-12',
    socialLinks: { twitter: '@cyberpunks_', discord: 'cyberpunks' },
    specialties: ['算法头像', '赛博朋克', '主题 IP'],
    achievements: ['头像类销量第一', '6 千独立持有人', '4 大系列'],
    recentWorks: ['Cyber Punks 2087 赛博朋克', 'Neon Tokyo 霓虹东京', 'Dark Web 暗网'],
    monthlyStats: [
      { month: '2026-07', volume: 248000, items: 0, royalty: 18600 },
      { month: '2026-06', volume: 320000, items: 0, royalty: 24000 },
      { month: '2026-05', volume: 180000, items: 0, royalty: 13500 },
    ],
  },
  {
    id: 'cr-003', name: 'PixelGalaxy', tier: 'pro', avatar: '🪐',
    bio: '像素艺术工作室，专注宇宙与科幻主题。',
    followers: 12400, following: 84, collections: 6, items: 48000,
    volumeTotal: 4200000, royaltyEarned: 210000, verified: true,
    joinedAt: '2024-12-08',
    socialLinks: { twitter: '@cosmicpixels' },
    specialties: ['像素艺术', '宇宙', '1155 批量'],
    achievements: ['平台销量 Top 10', '4.8 万件作品', '多平台合作'],
    recentWorks: ['Cosmic Pixels 宇宙像素', 'Star Wars 像素大战', 'Pixel Heroes 像素英雄'],
    monthlyStats: [
      { month: '2026-07', volume: 84000, items: 8, royalty: 4200 },
      { month: '2026-06', volume: 124000, items: 12, royalty: 6200 },
      { month: '2026-05', volume: 64000, items: 6, royalty: 3200 },
    ],
  },
  {
    id: 'cr-004', name: 'BlueNote Records', tier: 'verified', avatar: '🎵',
    bio: '老牌爵士唱片公司，进军 Web3 音乐 NFT 领域。',
    followers: 4800, following: 124, collections: 2, items: 480,
    volumeTotal: 1840000, royaltyEarned: 184000, verified: true,
    joinedAt: '2025-02-20',
    socialLinks: { twitter: '@midnightjazz', website: 'midnightjazz.example.com' },
    specialties: ['音乐', '版权', '现场录音'],
    achievements: ['240 件作品全部售罄', '10% 版税分成', '独家现场'],
    recentWorks: ['Midnight Jazz 午夜爵士', 'Blue Note Sessions'],
    monthlyStats: [
      { month: '2026-07', volume: 18400, items: 0, royalty: 1840 },
      { month: '2026-06', volume: 24000, items: 0, royalty: 2400 },
      { month: '2026-05', volume: 12000, items: 0, royalty: 1200 },
    ],
  },
  {
    id: 'cr-005', name: 'SportFi', tier: 'pro', avatar: '⚽',
    bio: '体育数字藏品平台，专注体育传奇时刻 NFT 化。',
    followers: 8400, following: 184, collections: 3, items: 18000,
    volumeTotal: 2840000, royaltyEarned: 170000, verified: true,
    joinedAt: '2025-06-18',
    socialLinks: { twitter: '@sportlegends' },
    specialties: ['体育', 'IP 合作', '动态 NFT'],
    achievements: ['多俱乐部 IP 合作', '动态内容', '赛事同步'],
    recentWorks: ['Sport Legends 体育传奇', 'NBA Moments', 'Football Classics'],
    monthlyStats: [
      { month: '2026-07', volume: 124000, items: 24, royalty: 7440 },
      { month: '2026-06', volume: 84000, items: 18, royalty: 5040 },
      { month: '2026-05', volume: 64000, items: 12, royalty: 3840 },
    ],
  },
  {
    id: 'cr-006', name: 'ZSDEX AI Lab', tier: 'legendary', avatar: '🤖',
    bio: '平台官方 AI 实验室，专注 AI 生成艺术与算法创作。',
    followers: 38400, following: 12, collections: 8, items: 12000,
    volumeTotal: 4840000, royaltyEarned: 387200, verified: true,
    joinedAt: '2025-10-08',
    socialLinks: { twitter: '@aidreams' },
    specialties: ['AI 艺术', '生成式 AI', '算法'],
    achievements: ['官方实验室', 'AI 艺术引领者', '24.6% 24h 涨幅'],
    recentWorks: ['AI Dreams AI 之梦', 'Neural Landscapes', 'Synthetic Souls'],
    monthlyStats: [
      { month: '2026-07', volume: 124000, items: 48, royalty: 9920 },
      { month: '2026-06', volume: 84000, items: 32, royalty: 6720 },
      { month: '2026-05', volume: 64000, items: 24, royalty: 5120 },
    ],
  },
  {
    id: 'cr-007', name: 'PixelForge', tier: 'pro', avatar: '🛡️',
    bio: '链游角色 NFT 工作室，专注多游戏互通角色。',
    followers: 6240, following: 248, collections: 2, items: 20000,
    volumeTotal: 3200000, royaltyEarned: 160000, verified: true,
    joinedAt: '2024-09-12',
    socialLinks: { twitter: '@pixelwarriors', discord: 'pxw' },
    specialties: ['链游', '角色', '多游戏互通'],
    achievements: ['多链游合作', '7 千持有人', '链游生态'],
    recentWorks: ['Pixel Warriors 像素勇士', 'Cyber Knights 赛博骑士'],
    monthlyStats: [
      { month: '2026-07', volume: 64000, items: 0, royalty: 3200 },
      { month: '2026-06', volume: 48000, items: 0, royalty: 2400 },
      { month: '2026-05', volume: 32000, items: 0, royalty: 1600 },
    ],
  },
  {
    id: 'cr-008', name: 'MythicStudio', tier: 'pro', avatar: '🐉',
    bio: '神话主题 NFT 工作室，专注龙与奇幻生物。',
    followers: 12400, following: 184, collections: 2, items: 22000,
    volumeTotal: 1240000, royaltyEarned: 62000, verified: true,
    joinedAt: '2025-08-22',
    socialLinks: { twitter: '@dragoneggs', discord: 'dragoneggs' },
    specialties: ['神话', '龙', '元宇宙'],
    achievements: ['即将发行龙蛋系列', '孵化玩法', '元宇宙合作'],
    recentWorks: ['Dragon Eggs 龙蛋', 'Phoenix Rising 凤凰涅槃'],
    monthlyStats: [
      { month: '2026-07', volume: 0, items: 0, royalty: 0 },
      { month: '2026-06', volume: 0, items: 0, royalty: 0 },
    ],
  },
];

const IP_PARTNERS: IPDetail[] = [
  {
    id: 'ip-001', name: 'Aurora 数字艺术联盟', type: 'art-collaboration', status: 'active',
    partner: '全球 8 家数字艺术工作室', region: '全球', since: '2025-08-15', until: '2027-08-15',
    description: '联合全球 8 家数字艺术工作室，共同打造 Aurora 数字艺术联盟，发行多系列联名作品。',
    collections: 6, totalVolume: 18400000,
    benefits: ['艺术家资源', '联合发行', '线下展览', '社区共建'],
    contact: 'bd@aurora-alliance.example.com', logo: '✨',
    highlights: ['8 大工作室', '6 个联名系列', '1800 万美元交易额', '2 年长期合作'],
    audience: '艺术爱好者 / 收藏家 / 设计师',
    collaborations: ['Aurora Genesis', 'Northern Lights', 'Cosmic Dance'],
  },
  {
    id: 'ip-002', name: 'BlueNote 音乐', type: 'brand-license', status: 'active',
    partner: 'BlueNote Records', region: '全球', since: '2025-02-20', until: '2026-12-31',
    description: 'BlueNote 爵士唱片公司官方授权，发行午夜爵士系列音乐 NFT。',
    collections: 2, totalVolume: 1840000,
    benefits: ['正版音乐', '独家现场', '版权分成', '艺人合作'],
    contact: 'bd@bluenote.example.com', logo: '🎵',
    highlights: ['10% 创作者版税', '独家现场录音', '180 万美元交易额', '240 件已售罄'],
    audience: '音乐爱好者 / 收藏家 / 爵士乐迷',
    collaborations: ['Midnight Jazz', 'Blue Note Sessions'],
  },
  {
    id: 'ip-003', name: 'Cyber Sports League', type: 'sports', status: 'active',
    partner: 'Cyber Sports League', region: '全球', since: '2025-09-08', until: '2027-09-08',
    description: '与 Cyber Sports League 合作，将体育传奇时刻 NFT 化，覆盖足球、篮球、电竞等。',
    collections: 4, totalVolume: 3200000,
    benefits: ['赛事同步', '动态 NFT', '线下活动', '门票权益'],
    contact: 'bd@cybersports.example.com', logo: '⚽',
    highlights: ['4 个系列', '320 万美元交易额', '多俱乐部合作', '2 年合作期'],
    audience: '体育迷 / 收藏家 / 投资者',
    collaborations: ['Sport Legends', 'NBA Moments', 'Football Classics'],
  },
  {
    id: 'ip-004', name: 'Meta 虚拟地产', type: 'ip-cooperation', status: 'pending',
    partner: 'Meta Realms', region: '全球', since: '2026-08-01', until: '2028-08-01',
    description: '与 Meta Realms 元宇宙地产合作，发行虚拟地产 NFT，导入 8 个虚拟城市。',
    collections: 1, totalVolume: 0,
    benefits: ['元宇宙地产', '建设权', '广告位', '虚拟活动'],
    contact: 'bd@metarealms.example.com', logo: '🌆',
    highlights: ['5 万件地产', '8 个虚拟城市', '3% 版税', '即将上线'],
    audience: '元宇宙爱好者 / 投资者 / 品牌方',
    collaborations: ['Meta Realms 元宇宙地产'],
  },
  {
    id: 'ip-005', name: 'Vintage Cinema', type: 'media', status: 'active',
    partner: 'VintageCinema Group', region: '亚太', since: '2026-04-15', until: '2028-04-15',
    description: '与 VintageCinema 合作，发行复古电影胶片 NFT 系列。',
    collections: 1, totalVolume: 0,
    benefits: ['独家幕后', '电影节门票', '新片白名单'],
    contact: 'bd@vintagecinema.example.com', logo: '🎬',
    highlights: ['2 千件限量', '即将发行', '7% 版税'],
    audience: '电影爱好者 / 收藏家',
    collaborations: ['Vintage Films 复古影院'],
  },
];

// ============== 工具函数 ==============

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function formatPercent(n: number, decimals = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

function formatPnl(n: number, currency = 'USDT'): string {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}${formatNumber(Math.abs(n))} ${currency}`;
}

function timeAgo(dateStr: string): string {
  return dateStr.split(' ')[1] || dateStr;
}

// ============== 子组件 ==============

function KpiCard({ label, value, hint, color, icon: Icon, trend }: { label: string; value: string; hint?: string; color?: string; icon?: React.ElementType; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
        {Icon && <Icon size={16} style={{ color: color || BRAND.primary }} />}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: color || BRAND.text }}>{value}</div>
      {hint && (
        <div className="text-xs mt-1 flex items-center gap-1" style={{ color: trend === 'up' ? BRAND.primary : trend === 'down' ? '#F87171' : BRAND.textMuted }}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {hint}
        </div>
      )}
    </div>
  );
}

function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = value;
    const duration = 800;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (target - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{formatNumber(display, decimals)}{suffix}</span>;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMuted }}>{label}</div>
      <div className="text-base font-semibold tabular-nums" style={{ color: accent || BRAND.text }}>{value}</div>
    </div>
  );
}

// ============== 主组件 ==============

export function PortalNft() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [collectionCategoryFilter, setCollectionCategoryFilter] = useState<CollectionCategory | 'all'>('all');
  const [collectionChainFilter, setCollectionChainFilter] = useState<Chain | 'all'>('all');
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState<AuctionStatus | 'all'>('all');
  const [blindboxStatusFilter, setBlindboxStatusFilter] = useState<BlindBoxStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'floor' | 'holders' | 'updated'>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [mintStep, setMintStep] = useState(0);
  const [mintName, setMintName] = useState('');
  const [mintDesc, setMintDesc] = useState('');
  const [mintSupply, setMintSupply] = useState('1000');
  const [mintPrice, setMintPrice] = useState('0');
  const [mintRoyalty, setMintRoyalty] = useState('5');
  const [mintChain, setMintChain] = useState<Chain>('zs-chain');
  const [mintCategory, setMintCategory] = useState<CollectionCategory>('art');
  const [bidAmount, setBidAmount] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalCollections: 1248,
    totalItems: 248000,
    totalCreators: 4280,
    totalVolume: 184000000,
    volume24h: 1840000,
    totalOwners: 128400,
    liveAuctions: 124,
    liveBlindBoxes: 18,
    liveMints: 32,
    floorIndex: 0.42,
    totalRoyalties: 18400000,
    ipPartners: 24,
  });

  // 实时数据漂移
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((k) => ({
        ...k,
        volume24h: k.volume24h + Math.floor(Math.random() * 5000) - 2000,
        liveAuctions: k.liveAuctions + Math.floor(Math.random() * 3) - 1,
        liveMints: k.liveMints + Math.floor(Math.random() * 2),
        totalOwners: k.totalOwners + Math.floor(Math.random() * 8) - 2,
        floorIndex: Math.max(0.1, k.floorIndex + (Math.random() - 0.5) * 0.02),
      }));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
      } else if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'mint', 'market', 'creator', 'auction', 'blindbox', 'ip', 'profile', 'help'];
        setTab(tabs[parseInt(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen]);

  // 过滤藏品
  const filteredCollections = useMemo(() => {
    let list = COLLECTIONS;
    if (collectionCategoryFilter !== 'all') list = list.filter((c) => c.category === collectionCategoryFilter);
    if (collectionChainFilter !== 'all') list = list.filter((c) => c.chain === collectionChainFilter);
    if (collectionStatusFilter !== 'all') list = list.filter((c) => c.status === collectionStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)));
    }
    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'volume': return (a.volume24h - b.volume24h) * dir;
        case 'floor': return (a.floorPrice - b.floorPrice) * dir;
        case 'holders': return (a.owners - b.owners) * dir;
        case 'updated': return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
        default: return 0;
      }
    });
    return list;
  }, [collectionCategoryFilter, collectionChainFilter, collectionStatusFilter, search, sortBy, sortDir]);

  // 过滤拍卖
  const filteredAuctions = useMemo(() => {
    let list = AUCTIONS;
    if (auctionStatusFilter !== 'all') list = list.filter((a) => a.status === auctionStatusFilter);
    return list;
  }, [auctionStatusFilter]);

  // 过滤盲盒
  const filteredBlindboxes = useMemo(() => {
    let list = BLIND_BOXES;
    if (blindboxStatusFilter !== 'all') list = list.filter((b) => b.status === blindboxStatusFilter);
    return list;
  }, [blindboxStatusFilter]);

  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);

  const openCollection = (id: string) => setDrawer({ open: true, type: 'collection', payload: id });
  const openAuction = (id: string) => setDrawer({ open: true, type: 'auction', payload: id });
  const openBlindbox = (id: string) => setDrawer({ open: true, type: 'blindbox', payload: id });
  const openCreator = (id: string) => setDrawer({ open: true, type: 'creator', payload: id });
  const openIP = (id: string) => setDrawer({ open: true, type: 'ip', payload: id });

  const handleMintSubmit = () => {
    if (mintStep < 3) setMintStep(mintStep + 1);
    else {
      setMintStep(0);
      setMintName('');
      setMintDesc('');
      setMintSupply('1000');
      setMintPrice('0');
      alert('铸造申请已提交（UI 演示），实际铸造以平台审核为准。');
      setTab('overview');
    }
  };

  const handleBid = (auctionId: string) => {
    const auction = AUCTIONS.find((a) => a.id === auctionId);
    if (!auction || !bidAmount) return;
    alert(`出价 ${bidAmount} ETH 已提交（UI 演示）。当前最高 ${auction.currentBid} ETH，您的出价 ${parseFloat(bidAmount) > auction.currentBid ? '高于' : '低于'} 当前。`);
    setBidAmount('');
  };

  const tabLabels: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: '总览', icon: Gauge },
    { key: 'mint', label: '藏品发行', icon: ImagePlus },
    { key: 'market', label: '二级市场', icon: Boxes },
    { key: 'creator', label: '创作者中心', icon: Palette },
    { key: 'auction', label: '拍卖行', icon: Gavel },
    { key: 'blindbox', label: '盲盒', icon: Gift },
    { key: 'ip', label: 'IP 合作', icon: Handshake },
    { key: 'profile', label: '我的藏品', icon: Heart },
    { key: 'help', label: '帮助', icon: HelpCircle },
  ];

  const chainLabels: Record<Chain, string> = {
    'zs-chain': 'ZSDEX 链', eth: 'Ethereum', bsc: 'BSC', polygon: 'Polygon', solana: 'Solana', multi: '多链',
  };
  const categoryLabels: Record<CollectionCategory, string> = {
    art: '艺术', music: '音乐', video: '视频', photography: '摄影', gaming: '游戏', sports: '体育', collectible: '收藏', utility: '实用', domain: '域名', metaverse: '元宇宙',
  };
  const tierLabels: Record<BlindBoxTier, string> = {
    mythic: '神话', legendary: '传说', epic: '史诗', rare: '稀有', common: '普通',
  };
  const tierColors: Record<BlindBoxTier, string> = {
    mythic: '#F472B6', legendary: '#FACC15', epic: '#A78BFA', rare: '#60A5FA', common: '#9CA3AF',
  };
  const statusLabels: Record<ItemStatus, string> = {
    live: '进行中', upcoming: '即将发行', ended: '已结束', 'sold-out': '已售罄', paused: '已暂停',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pn-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pn-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pn-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pn-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pn-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pn-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pn-stagger > * { animation: pn-fade-up 0.4s ease-out both; }
        .pn-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pn-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pn-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pn-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pn-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pn-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pn-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pn-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pn-pulse { animation: pn-pulse 2.4s ease-in-out infinite; }
        .pn-float { animation: pn-float 3s ease-in-out infinite; }
        .pn-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pn-shimmer 2.4s linear infinite; }
        .pn-drawer { animation: pn-slide-in 0.28s ease-out; }
        .pn-bar { transform-origin: bottom; animation: pn-bar 0.6s ease-out; }
        .pn-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* ============== Hero ============== */}
      <section className="relative px-6 md:px-10 pt-8 pb-6 pn-stagger" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: BRAND.textMuted }}>
            <span>FrontPortal</span>
            <ChevronRight size={12} />
            <span>资产</span>
            <ChevronRight size={12} />
            <span style={{ color: BRAND.primary }}>NFT 数字藏品中心</span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: BRAND.text }}>
                NFT 数字藏品中心
              </h1>
              <p className="text-sm mb-4 max-w-3xl" style={{ color: BRAND.textMuted }}>
                藏品发行 / 二级市场 / 创作者中心 / 拍卖行 / 盲盒 / IP 合作 · 全栈式数字藏品生态。与 Launch 项目发行、生态合作、做市流动性形成"发行-市场-生态-IP"创意资产生态闭环。
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                  <span className="w-1.5 h-1.5 rounded-full pn-pulse" style={{ backgroundColor: BRAND.primary }} />
                  实时铸造 · {kpi.liveMints} 进行中
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.totalCollections.toLocaleString()} 个藏品系列
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.totalOwners.toLocaleString()} 持有人
                </span>
                <span className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                  {kpi.ipPartners} 个 IP 合作伙伴
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <Keyboard size={14} />
                快捷键
              </button>
              <button onClick={() => { setTab('mint'); setMintStep(0); }} className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all hover:scale-105" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <ImagePlus size={14} />
                发行藏品
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== KPI Cards ============== */}
      <section className="px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pn-stagger">
          <KpiCard label="藏品系列" value={kpi.totalCollections.toLocaleString()} hint={`${kpi.liveMints} 实时铸造`} icon={Boxes} />
          <KpiCard label="藏品总数" value={kpi.totalItems.toLocaleString()} hint="NFT 资产" color={BRAND.primary} icon={Package} />
          <KpiCard label="创作者" value={kpi.totalCreators.toLocaleString()} hint="艺术家 / 团队" icon={Palette} />
          <KpiCard label="总交易额" value={`$${formatNumber(kpi.totalVolume)}`} hint="累计" color={BRAND.primary} icon={CircleDollarSign} trend="up" />
          <KpiCard label="24h 交易" value={`$${formatNumber(kpi.volume24h)}`} hint="实时波动" icon={Activity} trend="up" />
          <KpiCard label="持有人" value={kpi.totalOwners.toLocaleString()} hint="独立钱包" color={BRAND.primary} icon={Users} />
        </div>
      </section>

      {/* ============== Tabs ============== */}
      <section className="px-6 md:px-10 py-3 sticky top-0 z-30" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {tabLabels.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3.5 py-2 rounded-lg text-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? BRAND.card : 'transparent',
                  color: active ? BRAND.primary : BRAND.textMuted,
                  border: `1px solid ${active ? BRAND.primary + '40' : 'transparent'}`,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ============== Tab Content ============== */}
      <main className="px-6 md:px-10 py-6">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Sparkles size={18} style={{ color: BRAND.primary }} />
                  创意资产生态：发行 - 市场 - 生态 - IP
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  NFT 数字藏品中心连接 <strong style={{ color: BRAND.text }}>Launch 项目发行</strong>（P3.18）、<strong style={{ color: BRAND.text }}>生态合作中心</strong>（P3.24）、<strong style={{ color: BRAND.text }}>做市商与流动性中心</strong>（P3.25），形成"发行-市场-生态-IP"创意资产生态闭环。创作者通过发行平台发布 NFT；二级市场提供流动；做市商提供深度；IP 合作引入正版授权与跨界合作。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: '藏品系列', value: kpi.totalCollections, suffix: '个' },
                    { label: '持有人', value: kpi.totalOwners, suffix: '人' },
                    { label: '创作者', value: kpi.totalCreators, suffix: '位' },
                    { label: 'IP 合作', value: kpi.ipPartners, suffix: '个' },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>
                        <CountUp value={s.value} suffix={s.suffix} decimals={0} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Flame size={18} style={{ color: BRAND.primary }} />
                    热门藏品系列
                  </h2>
                  <button onClick={() => setTab('market')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pn-stagger">
                  {COLLECTIONS.slice(0, 6).map((c) => (
                    <div key={c.id} onClick={() => openCollection(c.id)} className="rounded-xl cursor-pointer transition-all hover:scale-[1.02] pn-row overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="h-32 flex items-center justify-center text-6xl pn-float" style={{ backgroundColor: BRAND.bg }}>
                        {c.banner}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1" style={{ color: BRAND.text }}>
                              {c.name}
                              {c.verified && <CheckCircle2 size={12} style={{ color: BRAND.primary }} />}
                            </h3>
                            <div className="text-xs" style={{ color: BRAND.textMuted }}>{c.creator}</div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                            {categoryLabels[c.category]}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>地板价</div>
                            <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{c.floorPrice} ETH</div>
                          </div>
                          <div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h 量</div>
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(c.volume24h)}</div>
                          </div>
                          <div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>持有人</div>
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(c.owners)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Gavel size={18} style={{ color: BRAND.primary }} />
                    活跃拍卖
                  </h2>
                  <button onClick={() => setTab('auction')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pn-stagger">
                  {AUCTIONS.filter((a) => a.status === 'live').slice(0, 4).map((a) => (
                    <div key={a.id} onClick={() => openAuction(a.id)} className="p-4 rounded-xl cursor-pointer flex items-center gap-3 pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        {a.image}
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.title}</h3>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{a.collection} · {a.tokenId}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${tierColors[a.rarity]}20`, color: tierColors[a.rarity], border: `1px solid ${tierColors[a.rarity]}40` }}>{tierLabels[a.rarity]}</span>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.bids} 出价 · {a.bidders} 出价人</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>当前价</div>
                        <div className="text-base font-bold" style={{ color: BRAND.primary }}>{a.currentBid} ETH</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>结束 {timeAgo(a.endTime)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Gift size={18} style={{ color: BRAND.primary }} />
                    热门盲盒
                  </h2>
                  <button onClick={() => setTab('blindbox')} className="text-sm flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pn-stagger">
                  {BLIND_BOXES.filter((b) => b.status === 'live').map((b) => (
                    <div key={b.id} onClick={() => openBlindbox(b.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl pn-float" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          {b.image}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.name}</h3>
                          <div className="text-xs" style={{ color: BRAND.textMuted }}>{b.collection}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                              {b.sold}/{b.totalSupply} 已售
                            </span>
                            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{b.participants.toLocaleString()} 参与</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>价格</div>
                          <div className="text-base font-bold" style={{ color: BRAND.primary }}>{b.price} {b.currency}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'mint' && (
            <div className="max-w-3xl mx-auto">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ImagePlus size={18} style={{ color: BRAND.primary }} />
                  发行 NFT · {mintStep + 1}/4
                </h2>
                <p className="text-xs mb-4" style={{ color: BRAND.textMuted }}>本流程仅做 UI 演示，实际铸造以 ZSDEX 平台审核为准。</p>

                <div className="flex items-center gap-2 mb-5">
                  {['基本信息', '资产参数', '权益设置', '确认'].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: i <= mintStep ? BRAND.primary : BRAND.bg, color: i <= mintStep ? '#000' : BRAND.textMuted, border: `1px solid ${i <= mintStep ? BRAND.primary : BRAND.border}` }}>{i + 1}</div>
                      <span className="text-xs" style={{ color: i === mintStep ? BRAND.text : BRAND.textMuted }}>{s}</span>
                      {i < 3 && <ChevronRight size={12} style={{ color: BRAND.textMuted }} />}
                    </div>
                  ))}
                </div>

                {mintStep === 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>藏品系列名称</label>
                      <input value={mintName} onChange={(e) => setMintName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} placeholder="如：Aurora Genesis 极光创世" />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>系列描述</label>
                      <textarea value={mintDesc} onChange={(e) => setMintDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}`, minHeight: 80 }} placeholder="请描述您的藏品系列..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>类别</label>
                        <select value={mintCategory} onChange={(e) => setMintCategory(e.target.value as CollectionCategory)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>所属链</label>
                        <select value={mintChain} onChange={(e) => setMintChain(e.target.value as Chain)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                          {Object.entries(chainLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {mintStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>总供应量</label>
                        <input value={mintSupply} onChange={(e) => setMintSupply(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>基础价格 (ETH)</label>
                        <input value={mintPrice} onChange={(e) => setMintPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>创作者版税 (%)</label>
                      <input value={mintRoyalty} onChange={(e) => setMintRoyalty(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>稀有度配置（UI 演示）：</div>
                      <div className="grid grid-cols-4 gap-2">
                        {(['legendary', 'epic', 'rare', 'common'] as BlindBoxTier[]).map((t) => (
                          <div key={t} className="p-2 rounded text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${tierColors[t]}40` }}>
                            <div className="text-xs font-semibold" style={{ color: tierColors[t] }}>{tierLabels[t]}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>概率 {t === 'legendary' ? '0.5%' : t === 'epic' ? '4.5%' : t === 'rare' ? '15%' : '80%'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {mintStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>持有人权益（UI 演示）：</div>
                      <ul className="space-y-1.5 text-xs" style={{ color: BRAND.text }}>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />线下展览邀请</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />新系列白名单</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />平台手续费折扣</li>
                        <li className="flex items-center gap-2"><Check size={12} style={{ color: BRAND.primary }} />社区 DAO 投票权</li>
                      </ul>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: BRAND.textMuted }}>媒体素材上传（UI 演示）</label>
                      <div className="p-6 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}>
                        <Upload size={24} className="mx-auto mb-2" style={{ color: BRAND.textMuted }} />
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>拖拽文件或点击上传（UI 演示）</div>
                      </div>
                    </div>
                  </div>
                )}

                {mintStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>确认信息</div>
                      <div className="space-y-1 text-xs" style={{ color: BRAND.textMuted }}>
                        <div>系列名称：<span style={{ color: BRAND.text }}>{mintName || '-'}</span></div>
                        <div>类别：<span style={{ color: BRAND.text }}>{categoryLabels[mintCategory]}</span></div>
                        <div>链：<span style={{ color: BRAND.text }}>{chainLabels[mintChain]}</span></div>
                        <div>供应量：<span style={{ color: BRAND.text }}>{mintSupply}</span></div>
                        <div>价格：<span style={{ color: BRAND.text }}>{mintPrice} ETH</span></div>
                        <div>版税：<span style={{ color: BRAND.text }}>{mintRoyalty}%</span></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: `${BRAND.primary}10`, border: `1px solid ${BRAND.primary}40`, color: BRAND.text }}>
                      <strong>合规说明：</strong>提交后将进入 ZSDEX 平台审核流程（一般 5-10 个工作日）。所有材料需符合平台合规要求，本流程为 UI 演示，提交不产生实际审核动作。
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <button onClick={() => setMintStep(Math.max(0, mintStep - 1))} disabled={mintStep === 0} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textMuted, border: `1px solid ${BRAND.border}`, opacity: mintStep === 0 ? 0.4 : 1 }}>
                    <ChevronLeft size={14} />上一步
                  </button>
                  <button onClick={handleMintSubmit} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    {mintStep < 3 ? <>下一步<ChevronRight size={14} /></> : '提交申请'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'market' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search size={14} style={{ color: BRAND.textMuted }} />
                  <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索藏品 / 创作者 / 标签" className="flex-1 bg-transparent text-sm outline-none" style={{ color: BRAND.text }} />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>类别</span>
                  <button onClick={() => setCollectionCategoryFilter('all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: collectionCategoryFilter === 'all' ? BRAND.primary : BRAND.bg, color: collectionCategoryFilter === 'all' ? '#000' : BRAND.textMuted, border: `1px solid ${collectionCategoryFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
                  {(Object.keys(categoryLabels) as CollectionCategory[]).map((c) => (
                    <button key={c} onClick={() => setCollectionCategoryFilter(c)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: collectionCategoryFilter === c ? BRAND.primary : BRAND.bg, color: collectionCategoryFilter === c ? '#000' : BRAND.textMuted, border: `1px solid ${collectionCategoryFilter === c ? BRAND.primary : BRAND.border}` }}>{categoryLabels[c]}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>链</span>
                  <button onClick={() => setCollectionChainFilter('all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: collectionChainFilter === 'all' ? BRAND.primary : BRAND.bg, color: collectionChainFilter === 'all' ? '#000' : BRAND.textMuted, border: `1px solid ${collectionChainFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
                  {(Object.keys(chainLabels) as Chain[]).map((c) => (
                    <button key={c} onClick={() => setCollectionChainFilter(c)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: collectionChainFilter === c ? BRAND.primary : BRAND.bg, color: collectionChainFilter === c ? '#000' : BRAND.textMuted, border: `1px solid ${collectionChainFilter === c ? BRAND.primary : BRAND.border}` }}>{chainLabels[c]}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>排序</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 rounded text-xs outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="volume">24h 量</option>
                    <option value="floor">地板价</option>
                    <option value="holders">持有人</option>
                    <option value="updated">更新时间</option>
                  </select>
                  <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1 rounded" style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.border}` }}>
                    {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pn-stagger">
                {filteredCollections.map((c) => (
                  <div key={c.id} onClick={() => openCollection(c.id)} className="rounded-xl cursor-pointer transition-all hover:scale-[1.02] pn-row overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="h-32 flex items-center justify-center text-6xl" style={{ backgroundColor: BRAND.bg }}>
                      {c.banner}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1" style={{ color: BRAND.text }}>
                            {c.name}
                            {c.verified && <CheckCircle2 size={12} style={{ color: BRAND.primary }} />}
                          </h3>
                          <div className="text-xs flex items-center gap-1" style={{ color: BRAND.textMuted }}>
                            <span>{c.creator}</span>
                            <span>·</span>
                            <span>{chainLabels[c.chain]}</span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: c.status === 'live' ? BRAND.primary : c.status === 'upcoming' ? `${BRAND.primary}20` : BRAND.bg, color: c.status === 'live' ? '#000' : BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                          {statusLabels[c.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>地板</div>
                          <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{c.floorPrice}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>24h</div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(c.volume24h)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>持有人</div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(c.owners)}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>变化</div>
                          <div className="text-sm font-semibold" style={{ color: c.volumeChange24h >= 0 ? BRAND.primary : '#F87171' }}>{formatPercent(c.volumeChange24h)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'creator' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pn-stagger">
                {CREATORS.map((cr) => (
                  <div key={cr.id} onClick={() => openCreator(cr.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: BRAND.bg, border: `2px solid ${BRAND.primary}` }}>
                        {cr.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold flex items-center gap-1" style={{ color: BRAND.text }}>
                          {cr.name}
                          {cr.verified && <CheckCircle2 size={12} style={{ color: BRAND.primary }} />}
                        </h3>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{cr.tier === 'legendary' ? '传奇' : cr.tier === 'pro' ? '专业' : cr.tier === 'rising' ? '新锐' : cr.tier === 'verified' ? '认证' : '社区'}</div>
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: BRAND.textMuted, minHeight: 32 }}>{cr.bio.slice(0, 60)}...</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>粉丝</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(cr.followers)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总交易</div>
                        <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatNumber(cr.volumeTotal)}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>作品</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{cr.items.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'auction' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>状态</span>
                  {(['all', 'upcoming', 'live', 'ended'] as const).map((s) => (
                    <button key={s} onClick={() => setAuctionStatusFilter(s)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: auctionStatusFilter === s ? BRAND.primary : BRAND.bg, color: auctionStatusFilter === s ? '#000' : BRAND.textMuted, border: `1px solid ${auctionStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'all' ? '全部' : s === 'upcoming' ? '即将开始' : s === 'live' ? '进行中' : '已结束'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pn-stagger">
                {filteredAuctions.map((a) => (
                  <div key={a.id} onClick={() => openAuction(a.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{a.image}</div>
                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.title}</h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${tierColors[a.rarity]}20`, color: tierColors[a.rarity], border: `1px solid ${tierColors[a.rarity]}40` }}>{tierLabels[a.rarity]}</span>
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{a.collection} · #{a.tokenId}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.type === 'english' ? '英式拍' : a.type === 'dutch' ? '荷兰拍' : a.type === 'sealed-bid' ? '密封拍' : '保留价'}</span>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.bids} 出价</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.status === 'live' ? '当前价' : a.status === 'upcoming' ? '起拍价' : '成交价'}</div>
                        <div className="text-lg font-bold" style={{ color: BRAND.primary }}>{a.currentBid} ETH</div>
                        <div className="text-[10px]" style={{ color: a.status === 'live' ? BRAND.primary : BRAND.textMuted }}>{a.status === 'live' ? '进行中' : a.status === 'upcoming' ? '即将开始' : '已结束'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'blindbox' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex flex-wrap items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>状态</span>
                  {(['all', 'upcoming', 'live', 'sold-out', 'ended'] as const).map((s) => (
                    <button key={s} onClick={() => setBlindboxStatusFilter(s)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: blindboxStatusFilter === s ? BRAND.primary : BRAND.bg, color: blindboxStatusFilter === s ? '#000' : BRAND.textMuted, border: `1px solid ${blindboxStatusFilter === s ? BRAND.primary : BRAND.border}` }}>
                      {s === 'all' ? '全部' : s === 'upcoming' ? '即将开售' : s === 'live' ? '开售中' : s === 'sold-out' ? '已售罄' : '已结束'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pn-stagger">
                {filteredBlindboxes.map((b) => (
                  <div key={b.id} onClick={() => openBlindbox(b.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-24 rounded-lg flex items-center justify-center text-5xl pn-float" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{b.image}</div>
                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.name}</h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${tierColors[b.rarity]}20`, color: tierColors[b.rarity], border: `1px solid ${tierColors[b.rarity]}40` }}>{tierLabels[b.rarity]}</span>
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{b.collection}</div>
                        <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>销售：{b.soldStart || b.saleStart} ~ {b.saleEnd}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                            {b.sold}/{b.totalSupply} 已售
                          </span>
                          <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{b.participants.toLocaleString()} 参与</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>价格</div>
                        <div className="text-lg font-bold" style={{ color: BRAND.primary }}>{b.price}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{b.currency}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'ip' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pn-stagger">
                {IP_PARTNERS.map((ip) => (
                  <div key={ip.id} onClick={() => openIP(ip.id)} className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] pn-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{ip.logo}</div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{ip.name}</h3>
                        <div className="text-xs" style={{ color: BRAND.textMuted }}>{ip.partner}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: ip.status === 'active' ? BRAND.primary : ip.status === 'pending' ? '#FACC15' : BRAND.bg, color: ip.status === 'active' ? '#000' : ip.status === 'pending' ? '#000' : BRAND.textMuted, border: `1px solid ${ip.status === 'active' ? BRAND.primary : ip.status === 'pending' ? '#FACC15' : BRAND.border}` }}>
                        {ip.status === 'active' ? '合作中' : ip.status === 'pending' ? '待启动' : ip.status === 'renewal' ? '续签中' : '已结束'}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: BRAND.textMuted }}>{ip.description.slice(0, 80)}...</p>
                    <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>类型</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{ip.type === 'art-collaboration' ? '艺术联名' : ip.type === 'brand-license' ? '品牌授权' : ip.type === 'sports' ? '体育' : ip.type === 'media' ? '媒体' : 'IP 合作'}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>系列</div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{ip.collections}</div>
                      </div>
                      <div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>交易额</div>
                        <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{formatNumber(ip.totalVolume)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Heart size={18} style={{ color: BRAND.primary }} />
                  我的藏品 · U-7724***
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Stat label="持有藏品" value="42" />
                  <Stat label="收藏家系列" value="8" />
                  <Stat label="总价值" value="184.2 ETH" accent={BRAND.primary} />
                  <Stat label="累计收益" value="+38.4 ETH" accent={BRAND.primary} />
                </div>
                <div className="text-xs" style={{ color: BRAND.textMuted }}>本区块为 UI 演示，实际藏品以 ZSDEX 平台用户账户数据为准。</div>
              </div>

              <div className="p-5 rounded-xl text-xs" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>
                <p><strong style={{ color: BRAND.text }}>合规说明：</strong>数字藏品为基于区块链技术的数字资产证明。ZSDEX 平台仅提供数字藏品的铸造、交易、拍卖、盲盒等基础设施服务，不构成对藏品价值、稀缺度或市场表现的承诺或保证。NFT 数字藏品价格波动较大，过往业绩不代表未来表现，请理性评估风险。</p>
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <HelpCircle size={18} style={{ color: BRAND.primary }} />
                  快捷键与帮助
                </h2>
                <div className="space-y-2">
                  {[
                    { k: '/', d: '聚焦搜索框' },
                    { k: 'Esc', d: '关闭抽屉 / 弹窗' },
                    { k: '?', d: '打开/关闭本页帮助' },
                    { k: '1-9', d: '切换 Tab（总览/发行/.../帮助）' },
                  ].map((it) => (
                    <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                      <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl text-xs" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>
                <p><strong style={{ color: BRAND.text }}>合规说明：</strong>中萨数字科技交易所（ZSDEX）NFT 数字藏品中心为合规研究方向的数字资产基础设施。所有藏品、拍卖、盲盒、IP 数据为 UI 演示数据，不构成对任何数字藏品的真实价值评估或市场表现承诺。NFT 数字藏品交易存在市场风险，请理性参与。</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============== Drawers ============== */}
      {drawer.open && drawer.type === 'collection' && drawer.payload && (() => {
        const c = COLLECTIONS.find((x) => x.id === drawer.payload);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{c.name}</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="h-48 flex items-center justify-center text-8xl" style={{ backgroundColor: BRAND.card }}>{c.banner}</div>
              <div className="p-5 space-y-4">
                <p className="text-sm" style={{ color: BRAND.text }}>{c.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="地板价" value={`${c.floorPrice} ETH`} accent={BRAND.primary} />
                  <Stat label="24h 量" value={`$${formatNumber(c.volume24h)}`} />
                  <Stat label="总交易" value={`$${formatNumber(c.volumeTotal)}`} />
                  <Stat label="持有人" value={c.owners.toLocaleString()} />
                  <Stat label="总供应" value={c.totalSupply.toLocaleString()} />
                  <Stat label="已铸造" value={c.minted.toLocaleString()} />
                  <Stat label="在挂" value={c.listed.toLocaleString()} />
                  <Stat label="版税" value={`${c.royalty}%`} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>稀有度分布</div>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(c.rarity).map(([k, v]) => (
                      <div key={k} className="p-2 rounded text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${tierColors[k as BlindBoxTier]}40` }}>
                        <div className="text-xs font-semibold" style={{ color: tierColors[k as BlindBoxTier] }}>{tierLabels[k as BlindBoxTier]}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{v.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>核心标签</div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>持有人权益</div>
                  <ul className="space-y-1.5">
                    {c.benefits.map((b) => <li key={b} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Check size={12} style={{ color: BRAND.primary }} />{b}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即购买</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>查看作品</button>
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
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>拍卖详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="h-40 flex items-center justify-center text-7xl rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>{a.image}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: BRAND.text }}>{a.title}</h3>
                  <div className="text-xs" style={{ color: BRAND.textMuted }}>{a.collection} · #{a.tokenId}</div>
                </div>
                <p className="text-sm" style={{ color: BRAND.text }}>{a.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="当前价" value={`${a.currentBid} ETH`} accent={BRAND.primary} />
                  <Stat label="最小加价" value={`${a.minBid} ETH`} />
                  {a.reservePrice && <Stat label="保留价" value={`${a.reservePrice} ETH`} />}
                  {a.buyNowPrice && <Stat label="立即买" value={`${a.buyNowPrice} ETH`} accent={BRAND.primary} />}
                  <Stat label="出价数" value={a.bids.toString()} />
                  <Stat label="出价人" value={a.bidders.toString()} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>属性</div>
                  <div className="grid grid-cols-2 gap-2">
                    {a.attributes.map((at) => (
                      <div key={at.trait_type} className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{at.trait_type}</div>
                        <div className="text-sm" style={{ color: BRAND.text }}>{at.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {a.history.length > 0 && (
                  <div>
                    <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>出价历史</div>
                    <div className="space-y-1">
                      {a.history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded text-xs" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                          <span style={{ color: BRAND.textMuted }}>{h.time}</span>
                          <span style={{ color: BRAND.text }}>{h.bidder}</span>
                          <span style={{ color: BRAND.primary }} className="font-mono">{h.amount} ETH</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {a.status === 'live' && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>参与出价（UI 演示）</div>
                    <div className="flex items-center gap-2">
                      <input value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`≥ ${a.minBid} ETH`} type="number" className="flex-1 px-3 py-2 rounded text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                      <button onClick={() => handleBid(a.id)} className="px-4 py-2 rounded text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>出价</button>
                    </div>
                  </div>
                )}
                <button className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>加入观察</button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'blindbox' && drawer.payload && (() => {
        const b = BLIND_BOXES.find((x) => x.id === drawer.payload);
        if (!b) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>盲盒详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="h-40 flex items-center justify-center text-7xl rounded-xl pn-float" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>{b.image}</div>
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: BRAND.text }}>{b.name}</h3>
                  <div className="text-xs" style={{ color: BRAND.textMuted }}>{b.collection}</div>
                </div>
                <p className="text-sm" style={{ color: BRAND.text }}>{b.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="价格" value={`${b.price} ${b.currency}`} accent={BRAND.primary} />
                  <Stat label="已售" value={`${b.sold}/${b.totalSupply}`} />
                  <Stat label="每人限购" value={b.maxPerUser.toString()} />
                  <Stat label="参与人数" value={b.participants.toLocaleString()} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>稀有度等级</div>
                  <div className="space-y-2">
                    {b.tiers.map((t) => (
                      <div key={t.tier} className="p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: tierColors[t.tier] }}>{tierLabels[t.tier]}</span>
                          <span className="text-xs" style={{ color: BRAND.textMuted }}>概率 {t.probability}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pn-bar" style={{ width: `${Math.min(100, t.probability * 4)}%`, backgroundColor: tierColors[t.tier] }} />
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>供应 {t.supply.toLocaleString()} · {t.items.slice(0, 3).join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.textMuted }}>
                  <strong>开盒说明：</strong>盲盒开启后藏品将发放至您的账户，可在"我的藏品"中查看。{b.guaranteed ? '本系列保证最低稀有度等级。' : '本系列无保底，请理性参与。'}
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: b.status === 'sold-out' ? BRAND.bg : BRAND.primary, color: b.status === 'sold-out' ? BRAND.textMuted : '#000', border: `1px solid ${b.status === 'sold-out' ? BRAND.border : BRAND.primary}` }} disabled={b.status === 'sold-out'}>
                  {b.status === 'sold-out' ? '已售罄' : b.status === 'upcoming' ? '提醒我' : b.status === 'ended' ? '已结束' : `立即购买 · ${b.price} ${b.currency}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'creator' && drawer.payload && (() => {
        const cr = CREATORS.find((x) => x.id === drawer.payload);
        if (!cr) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>创作者详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: BRAND.card, border: `2px solid ${BRAND.primary}` }}>{cr.avatar}</div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-1" style={{ color: BRAND.text }}>
                      {cr.name}
                      {cr.verified && <CheckCircle2 size={14} style={{ color: BRAND.primary }} />}
                    </h3>
                    <div className="text-xs" style={{ color: BRAND.textMuted }}>{cr.tier === 'legendary' ? '传奇创作者' : cr.tier === 'pro' ? '专业创作者' : cr.tier === 'rising' ? '新锐' : cr.tier === 'verified' ? '认证' : '社区'}</div>
                    <div className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>入驻 {cr.joinedAt}</div>
                  </div>
                </div>
                <p className="text-sm" style={{ color: BRAND.text }}>{cr.bio}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="粉丝" value={cr.followers.toLocaleString()} />
                  <Stat label="总交易" value={`$${formatNumber(cr.volumeTotal)}`} accent={BRAND.primary} />
                  <Stat label="版税收入" value={`$${formatNumber(cr.royaltyEarned)}`} accent={BRAND.primary} />
                  <Stat label="作品" value={cr.items.toLocaleString()} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>擅长领域</div>
                  <div className="flex flex-wrap gap-1.5">
                    {cr.specialties.map((s) => <span key={s} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{s}</span>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>近期作品</div>
                  <ul className="space-y-1">
                    {cr.recentWorks.map((w) => <li key={w} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Palette size={12} style={{ color: BRAND.primary }} />{w}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>成就</div>
                  <ul className="space-y-1">
                    {cr.achievements.map((a) => <li key={a} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Trophy size={12} style={{ color: BRAND.primary }} />{a}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>关注</button>
                  <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>分享</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'ip' && drawer.payload && (() => {
        const ip = IP_PARTNERS.find((x) => x.id === drawer.payload);
        if (!ip) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>IP 合作详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center text-5xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>{ip.logo}</div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: BRAND.text }}>{ip.name}</h3>
                    <div className="text-xs" style={{ color: BRAND.textMuted }}>{ip.partner} · {ip.region}</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>{ip.since} ~ {ip.until}</div>
                  </div>
                </div>
                <p className="text-sm" style={{ color: BRAND.text }}>{ip.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="合作系列" value={ip.collections.toString()} />
                  <Stat label="总交易" value={`$${formatNumber(ip.totalVolume)}`} accent={BRAND.primary} />
                  <Stat label="状态" value={ip.status === 'active' ? '合作中' : ip.status === 'pending' ? '待启动' : '已结束'} />
                  <Stat label="合作期" value={`${ip.since.split('-')[0]} - ${ip.until.split('-')[0]}`} />
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>合作亮点</div>
                  <ul className="space-y-1.5">
                    {ip.highlights.map((h) => <li key={h} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Check size={12} style={{ color: BRAND.primary }} />{h}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>权益</div>
                  <ul className="space-y-1.5">
                    {ip.benefits.map((b) => <li key={b} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Star size={12} style={{ color: BRAND.primary }} />{b}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: BRAND.textMuted }}>合作系列</div>
                  <ul className="space-y-1">
                    {ip.collaborations.map((c) => <li key={c} className="text-sm flex items-center gap-2" style={{ color: BRAND.text }}><Boxes size={12} style={{ color: BRAND.primary }} />{c}</li>)}
                  </ul>
                </div>
                <button className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>申请合作</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Help Drawer */}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}

      {/* ============== Bottom CTA ============== */}
      <section className="px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Sparkles size={18} style={{ color: BRAND.primary }} />
                开启你的数字藏品之旅
              </h2>
              <p className="text-sm" style={{ color: BRAND.textMuted }}>发行藏品 · 投资收藏 · 拍卖竞标 · 盲盒开启 · IP 合作</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setTab('market')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}><Boxes size={14} />浏览市场</button>
              <button onClick={() => setTab('auction')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Gavel size={14} />拍卖行</button>
              <button onClick={() => setTab('creator')} className="px-4 py-2 rounded-lg text-sm flex items-center gap-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}><Palette size={14} />创作者</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pn-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: '/', d: '聚焦搜索' },
            { k: 'Esc', d: '关闭抽屉 / 弹窗' },
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
