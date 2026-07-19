'use client';

/**
 * PortalWatchlist - 自选与行情提醒中心 (2026-07-19 Q05 P3.35)
 *
 * 页面定位：
 * - 中萨数字科技交易所 自选与行情提醒中心
 * - 总览 / 我的自选 / 热门榜单 / 涨跌榜 / 异动提醒 / 价格预警 / 资产估值 / 提醒订阅 / 帮助
 * - 与 P3.4 现货 + P3.32 链上数据分析 + P3.34 用户成长中心形成"行情-提醒-决策"全维度洞察闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 我的自选 / 热门榜单 / 涨跌榜 / 异动提醒 / 价格预警 / 资产估值 / 提醒订阅 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有行情/榜单/提醒/订阅数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"行情监控与价格提醒工具研究方向"定性
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
  Bell,
  BellOff,
  BellRing,
  Star,
  StarOff,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Zap,
  Flame,
  Rocket,
  Trophy,
  Award,
  Crown,
  Gem,
  Sparkles,
  Heart,
  Target,
  Gauge,
  Compass,
  MapPin,
  Globe,
  Globe2,
  Calendar,
  Clock,
  Tag,
  Tags,
  Hash,
  Bookmark,
  Flag,
  Settings,
  Sliders,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Share2,
  Link2,
  RefreshCw,
  Volume2,
  VolumeX,
  Mail,
  Send,
  MessageCircle,
  Phone,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  User,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  Layers,
  Box,
  Boxes,
  Cpu,
  Hexagon,
  Diamond,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Database,
  Server,
  Network,
  Cloud,
  FileText,
  FileCode,
  Code2,
  Terminal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  KeySquare,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'watchlist' | 'ranking' | 'gainers' | 'anomaly' | 'alert' | 'valuation' | 'subscription' | 'help';
type AssetCategory = 'major' | 'layer1' | 'layer2' | 'defi' | 'meme' | 'rwa' | 'stable' | 'nft' | 'gamefi';
type ChainId = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'solana' | 'bitcoin' | 'tron' | 'zs-chain';
type AlertType = 'price_above' | 'price_below' | 'change_pct' | 'volume_spike' | 'volatility' | 'new_high' | 'new_low';
type AlertChannel = 'app' | 'email' | 'sms' | 'webhook' | 'telegram';
type AnomalyLevel = 'low' | 'medium' | 'high' | 'critical';
type RankingType = 'gainers_24h' | 'losers_24h' | 'volume_24h' | 'gainers_7d' | 'losers_7d' | 'gainers_30d' | 'trending';
type Timeframe = '1h' | '4h' | '24h' | '7d' | '30d';

interface WatchAsset {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId;
  category: AssetCategory;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24h: number;
  marketCap: number;
  holdings: number;
  avgCost: number;
  addedAt: string;
  pinned: boolean;
  notes?: string;
}

interface RankingAsset {
  id: string;
  symbol: string;
  name: string;
  chain: ChainId;
  category: AssetCategory;
  price: number;
  change: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  prevRank: number;
}

interface AnomalyAlert {
  id: string;
  symbol: string;
  chain: ChainId;
  type: 'price_spike' | 'price_crash' | 'volume_surge' | 'volume_drop' | 'volatility' | 'whale_move' | 'listing';
  level: AnomalyLevel;
  desc: string;
  value: number;
  baseline: number;
  change: number;
  time: string;
  acknowledged: boolean;
}

interface PriceAlert {
  id: string;
  symbol: string;
  chain: ChainId;
  type: AlertType;
  threshold: number;
  currentPrice: number;
  channel: AlertChannel[];
  enabled: boolean;
  triggered: number;
  createdAt: string;
  lastTriggered?: string;
}

interface Subscription {
  id: string;
  name: string;
  desc: string;
  category: 'ranking' | 'anomaly' | 'news' | 'event' | 'launch' | 'macro';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  channels: AlertChannel[];
  enabled: boolean;
  subscribers: number;
}

interface KpiSnapshot {
  totalWatched: number;
  pinnedCount: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  bestPerformer: string;
  worstPerformer: string;
  activeAlerts: number;
  triggeredToday: number;
  anomalyCount: number;
  subscribedChannels: number;
  rankingChanges: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: 'asset' | 'alert' | 'anomaly' | 'subscription' | 'add' | 'history' | 'help' | null;
  payload: string | null;
}

// ============== 常量 ==============

const CHAIN_LABELS: Record<ChainId, string> = {
  eth: 'Ethereum',
  bsc: 'BSC',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  avalanche: 'Avalanche',
  solana: 'Solana',
  bitcoin: 'Bitcoin',
  tron: 'Tron',
  'zs-chain': '树图公链',
};

const CHAIN_COLORS: Record<ChainId, string> = {
  eth: '#627EEA',
  bsc: '#F3BA2F',
  polygon: '#8247E5',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  avalanche: '#E84142',
  solana: '#14F195',
  bitcoin: '#F7931A',
  tron: '#FF060A',
  'zs-chain': '#14B881',
};

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  major: '主流币',
  layer1: 'Layer1',
  layer2: 'Layer2',
  defi: 'DeFi',
  meme: 'Meme',
  rwa: 'RWA',
  stable: '稳定币',
  nft: 'NFT',
  gamefi: 'GameFi',
};

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  price_above: '价格突破',
  price_below: '价格跌破',
  change_pct: '涨跌幅',
  volume_spike: '成交量激增',
  volatility: '波动率',
  new_high: '历史新高',
  new_low: '历史新低',
};

const CHANNEL_LABELS: Record<AlertChannel, string> = {
  app: 'App 推送',
  email: '邮件',
  sms: '短信',
  webhook: 'Webhook',
  telegram: 'Telegram',
};

const RANKING_LABELS: Record<RankingType, string> = {
  gainers_24h: '24h 涨幅榜',
  losers_24h: '24h 跌幅榜',
  volume_24h: '24h 成交额榜',
  gainers_7d: '7d 涨幅榜',
  losers_7d: '7d 跌幅榜',
  gainers_30d: '30d 涨幅榜',
  trending: '热门搜索榜',
};

const ANOMALY_LABELS: Record<AnomalyAlert['type'], string> = {
  price_spike: '价格急涨',
  price_crash: '价格急跌',
  volume_surge: '成交量激增',
  volume_drop: '成交量骤减',
  volatility: '波动率飙升',
  whale_move: '巨鲸异动',
  listing: '新币上线',
};

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1h': '1 小时',
  '4h': '4 小时',
  '24h': '24 小时',
  '7d': '7 天',
  '30d': '30 天',
};

// ============== 工具函数 ==============

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function changeColor(c: number): string {
  return c >= 0 ? BRAND.success : BRAND.danger;
}

function changeBg(c: number): string {
  return c >= 0 ? BRAND.successLt : BRAND.dangerLt;
}

// ============== Mock 数据 ==============

const WATCHLIST: WatchAsset[] = [
  { id: 'w-001', symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', category: 'major', price: 68420, change24h: 2.84, change7d: 5.6, change30d: 12.4, volume24h: 28400000000, marketCap: 1348000000000, holdings: 0.42, avgCost: 62400, addedAt: '2026-01-15', pinned: true, notes: '长期持仓' },
  { id: 'w-002', symbol: 'ETH', name: 'Ethereum', chain: 'eth', category: 'major', price: 3842, change24h: 1.92, change7d: 4.2, change30d: 8.6, volume24h: 14800000000, marketCap: 462000000000, holdings: 6.8, avgCost: 3200, addedAt: '2026-01-15', pinned: true },
  { id: 'w-003', symbol: 'SOL', name: 'Solana', chain: 'solana', category: 'layer1', price: 184, change24h: 4.62, change7d: 12.8, change30d: 28.4, volume24h: 4200000000, marketCap: 84000000000, holdings: 24, avgCost: 142, addedAt: '2026-02-08', pinned: false },
  { id: 'w-004', symbol: 'ZSD', name: 'ZSDEX Token', chain: 'zs-chain', category: 'major', price: 1.0, change24h: 0.42, change7d: 1.2, change30d: 4.6, volume24h: 84000000, marketCap: 1000000000, holdings: 12480, avgCost: 1.0, addedAt: '2026-03-01', pinned: true, notes: '平台币' },
  { id: 'w-005', symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum', category: 'layer2', price: 0.84, change24h: -2.14, change7d: 3.4, change30d: 8.2, volume24h: 380000000, marketCap: 4200000000, holdings: 1240, avgCost: 0.92, addedAt: '2026-04-12', pinned: false },
  { id: 'w-006', symbol: 'UNI', name: 'Uniswap', chain: 'eth', category: 'defi', price: 8.42, change24h: 6.84, change7d: 14.2, change30d: 18.6, volume24h: 240000000, marketCap: 50400000000, holdings: 84, avgCost: 7.2, addedAt: '2026-04-20', pinned: false },
  { id: 'w-007', symbol: 'LINK', name: 'Chainlink', chain: 'eth', category: 'defi', price: 18.4, change24h: 3.24, change7d: 8.6, change30d: 24.8, volume24h: 480000000, marketCap: 11200000000, holdings: 248, avgCost: 14.8, addedAt: '2026-05-10', pinned: false },
  { id: 'w-008', symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche', category: 'layer1', price: 38.4, change24h: -1.42, change7d: -2.4, change30d: 4.8, volume24h: 280000000, marketCap: 14800000000, holdings: 84, avgCost: 42, addedAt: '2026-05-22', pinned: false },
  { id: 'w-009', symbol: 'MATIC', name: 'Polygon', chain: 'polygon', category: 'layer2', price: 0.62, change24h: 1.84, change7d: 4.2, change30d: 6.8, volume24h: 180000000, marketCap: 5800000000, holdings: 1840, avgCost: 0.58, addedAt: '2026-06-04', pinned: false },
  { id: 'w-010', symbol: 'DOGE', name: 'Dogecoin', chain: 'bitcoin', category: 'meme', price: 0.142, change24h: -4.82, change7d: -8.4, change30d: 14.2, volume24h: 1840000000, marketCap: 20400000000, holdings: 8420, avgCost: 0.12, addedAt: '2026-06-18', pinned: false },
  { id: 'w-011', symbol: 'OP', name: 'Optimism', chain: 'optimism', category: 'layer2', price: 2.14, change24h: 2.42, change7d: 6.8, change30d: 18.4, volume24h: 180000000, marketCap: 2400000000, holdings: 480, avgCost: 1.84, addedAt: '2026-06-25', pinned: false },
  { id: 'w-012', symbol: 'AAVE', name: 'Aave', chain: 'eth', category: 'defi', price: 124, change24h: 5.84, change7d: 12.4, change30d: 28.6, volume24h: 240000000, marketCap: 1840000000, holdings: 18, avgCost: 98, addedAt: '2026-07-01', pinned: false, notes: '观察 DeFi 龙头' },
];

const RANKINGS: RankingAsset[] = [
  { id: 'r-001', symbol: 'UNI', name: 'Uniswap', chain: 'eth', category: 'defi', price: 8.42, change: 6.84, volume24h: 240000000, marketCap: 50400000000, rank: 1, prevRank: 3 },
  { id: 'r-002', symbol: 'AAVE', name: 'Aave', chain: 'eth', category: 'defi', price: 124, change: 5.84, volume24h: 240000000, marketCap: 1840000000, rank: 2, prevRank: 4 },
  { id: 'r-003', symbol: 'SOL', name: 'Solana', chain: 'solana', category: 'layer1', price: 184, change: 4.62, volume24h: 4200000000, marketCap: 84000000000, rank: 3, prevRank: 5 },
  { id: 'r-004', symbol: 'LINK', name: 'Chainlink', chain: 'eth', category: 'defi', price: 18.4, change: 3.24, volume24h: 480000000, marketCap: 11200000000, rank: 4, prevRank: 2 },
  { id: 'r-005', symbol: 'OP', name: 'Optimism', chain: 'optimism', category: 'layer2', price: 2.14, change: 2.42, volume24h: 180000000, marketCap: 2400000000, rank: 5, prevRank: 7 },
  { id: 'r-006', symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', category: 'major', price: 68420, change: 2.84, volume24h: 28400000000, marketCap: 1348000000000, rank: 6, prevRank: 1 },
  { id: 'r-007', symbol: 'ETH', name: 'Ethereum', chain: 'eth', category: 'major', price: 3842, change: 1.92, volume24h: 14800000000, marketCap: 462000000000, rank: 7, prevRank: 8 },
  { id: 'r-008', symbol: 'MATIC', name: 'Polygon', chain: 'polygon', category: 'layer2', price: 0.62, change: 1.84, volume24h: 180000000, marketCap: 5800000000, rank: 8, prevRank: 6 },
  { id: 'r-009', symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche', category: 'layer1', price: 38.4, change: -1.42, volume24h: 280000000, marketCap: 14800000000, rank: 9, prevRank: 12 },
  { id: 'r-010', symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum', category: 'layer2', price: 0.84, change: -2.14, volume24h: 380000000, marketCap: 4200000000, rank: 10, prevRank: 9 },
  { id: 'r-011', symbol: 'DOGE', name: 'Dogecoin', chain: 'bitcoin', category: 'meme', price: 0.142, change: -4.82, volume24h: 1840000000, marketCap: 20400000000, rank: 11, prevRank: 11 },
  { id: 'r-012', symbol: 'SHIB', name: 'Shiba Inu', chain: 'eth', category: 'meme', price: 0.0000242, change: -6.42, volume24h: 480000000, marketCap: 14200000000, rank: 12, prevRank: 10 },
];

const ANOMALIES: AnomalyAlert[] = [
  { id: 'an-001', symbol: 'UNI', chain: 'eth', type: 'price_spike', level: 'high', desc: '5 分钟内价格上涨 6.84%，突破近期阻力位', value: 8.42, baseline: 7.88, change: 6.84, time: '3 分钟前', acknowledged: false },
  { id: 'an-002', symbol: 'AAVE', chain: 'eth', type: 'volume_surge', level: 'high', desc: '成交量较 24h 均值放大 4.2 倍', value: 240000000, baseline: 57000000, change: 321, time: '8 分钟前', acknowledged: false },
  { id: 'an-003', symbol: 'SOL', chain: 'solana', type: 'volatility', level: 'medium', desc: '1 小时波动率从 1.2% 升至 4.8%', value: 4.8, baseline: 1.2, change: 300, time: '15 分钟前', acknowledged: true },
  { id: 'an-004', symbol: 'DOGE', chain: 'bitcoin', type: 'price_crash', level: 'high', desc: '30 分钟内下跌 4.82%，跌破短期支撑', value: 0.142, baseline: 0.149, change: -4.82, time: '22 分钟前', acknowledged: false },
  { id: 'an-005', symbol: 'BTC', chain: 'bitcoin', type: 'whale_move', level: 'critical', desc: '监测到 1,200 BTC 从 Coinbase Prime 转入冷钱包', value: 82080000, baseline: 0, change: 0, time: '38 分钟前', acknowledged: false },
  { id: 'an-006', symbol: 'OP', chain: 'optimism', type: 'price_spike', level: 'medium', desc: '突破 3 周新高 2.14', value: 2.14, baseline: 2.06, change: 3.88, time: '1 小时前', acknowledged: true },
  { id: 'an-007', symbol: 'ARB', chain: 'arbitrum', type: 'volume_drop', level: 'low', desc: '成交量较 7d 均值下降 42%', value: 380000000, baseline: 656000000, change: -42, time: '2 小时前', acknowledged: true },
  { id: 'an-008', symbol: 'NEW', chain: 'zs-chain', type: 'listing', level: 'medium', desc: 'ZSDX 已在树图公链主网上线', value: 1.0, baseline: 0, change: 0, time: '3 小时前', acknowledged: true },
];

const PRICE_ALERTS: PriceAlert[] = [
  { id: 'pa-001', symbol: 'BTC', chain: 'bitcoin', type: 'price_above', threshold: 70000, currentPrice: 68420, channel: ['app', 'email'], enabled: true, triggered: 0, createdAt: '2026-07-01' },
  { id: 'pa-002', symbol: 'BTC', chain: 'bitcoin', type: 'price_below', threshold: 60000, currentPrice: 68420, channel: ['app'], enabled: true, triggered: 1, createdAt: '2026-06-15', lastTriggered: '2026-06-22' },
  { id: 'pa-003', symbol: 'ETH', chain: 'eth', type: 'change_pct', threshold: 5, currentPrice: 3842, channel: ['app', 'telegram'], enabled: true, triggered: 2, createdAt: '2026-05-20', lastTriggered: '2026-07-12' },
  { id: 'pa-004', symbol: 'SOL', chain: 'solana', type: 'new_high', threshold: 200, currentPrice: 184, channel: ['app', 'email'], enabled: true, triggered: 0, createdAt: '2026-06-08' },
  { id: 'pa-005', symbol: 'UNI', chain: 'eth', type: 'volatility', threshold: 8, currentPrice: 8.42, channel: ['app'], enabled: true, triggered: 0, createdAt: '2026-07-05' },
  { id: 'pa-006', symbol: 'ARB', chain: 'arbitrum', type: 'price_below', threshold: 0.7, currentPrice: 0.84, channel: ['app', 'sms'], enabled: false, triggered: 0, createdAt: '2026-04-22' },
  { id: 'pa-007', symbol: 'ZSD', chain: 'zs-chain', type: 'change_pct', threshold: 10, currentPrice: 1.0, channel: ['app', 'email', 'telegram'], enabled: true, triggered: 0, createdAt: '2026-03-01' },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: 's-001', name: '主流币大额异动', desc: 'BTC/ETH/SOL 等主流币 24h 涨跌幅 > 5% 时通知', category: 'anomaly', frequency: 'realtime', channels: ['app', 'email'], enabled: true, subscribers: 18420 },
  { id: 's-002', name: '新币上线播报', desc: '平台新上线币种第一时间推送', category: 'launch', frequency: 'realtime', channels: ['app', 'telegram'], enabled: true, subscribers: 12840 },
  { id: 's-003', name: '每日行情晚报', desc: '每天 20:00 推送当日市场总结与明日展望', category: 'news', frequency: 'daily', channels: ['email'], enabled: true, subscribers: 24820 },
  { id: 's-004', name: 'DeFi 异动', desc: 'DeFi 协议价格、TVL、收益率异动提醒', category: 'anomaly', frequency: 'realtime', channels: ['app'], enabled: true, subscribers: 8420 },
  { id: 's-005', name: '巨鲸监控', desc: '链上 100 万美元以上转账监控', category: 'anomaly', frequency: 'realtime', channels: ['app', 'telegram'], enabled: false, subscribers: 4280 },
  { id: 's-006', name: '周度研究报告', desc: '每周一 09:00 推送机构级研究报告', category: 'news', frequency: 'weekly', channels: ['email'], enabled: true, subscribers: 6240 },
  { id: 's-007', name: '主流币涨幅榜', desc: '24h 涨幅榜前 10 名小时报', category: 'ranking', frequency: 'hourly', channels: ['app'], enabled: false, subscribers: 3840 },
  { id: 's-008', name: '宏观事件提醒', desc: '美联储、CPI、ETF 等重大宏观事件', category: 'macro', frequency: 'realtime', channels: ['app', 'email', 'sms'], enabled: true, subscribers: 18420 },
];

// ============== 主组件 ==============

export function PortalWatchlist() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState<ChainId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [rankingType, setRankingType] = useState<RankingType>('gainers_24h');
  const [anomalyLevelFilter, setAnomalyLevelFilter] = useState<AnomalyLevel | 'all'>('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<AnomalyAlert['type'] | 'all'>('all');
  const [alertEnabledFilter, setAlertEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [subscriptionCategoryFilter, setSubscriptionCategoryFilter] = useState<Subscription['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume' | 'value' | 'pnl'>('value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [alertSymbol, setAlertSymbol] = useState('BTC');
  const [alertType, setAlertType] = useState<AlertType>('price_above');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertChannels, setAlertChannels] = useState<AlertChannel[]>(['app', 'email']);
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalWatched: 12,
    pinnedCount: 3,
    totalValue: 184200,
    totalPnl: 12480,
    totalPnlPct: 7.27,
    bestPerformer: 'AAVE',
    worstPerformer: 'DOGE',
    activeAlerts: 6,
    triggeredToday: 3,
    anomalyCount: 4,
    subscribedChannels: 14,
    rankingChanges: 28,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalValue: prev.totalValue + Math.floor(Math.random() * 1200 - 400),
        totalPnl: prev.totalPnl + Math.floor(Math.random() * 80 - 30),
        totalPnlPct: Math.max(0, prev.totalPnlPct + (Math.random() - 0.45) * 0.05),
        triggeredToday: prev.triggeredToday + (Math.random() < 0.15 ? 1 : 0),
        anomalyCount: prev.anomalyCount + (Math.random() < 0.1 ? 1 : 0),
        rankingChanges: prev.rankingChanges + (Math.random() < 0.3 ? 1 : 0),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const filteredWatchlist = useMemo(() => {
    let result = WATCHLIST.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.symbol.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q)) return false;
      }
      if (chainFilter !== 'all' && a.chain !== chainFilter) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      return true;
    });
    result = result.sort((a, b) => {
      let av = 0, bv = 0;
      const aValue = a.holdings * a.price;
      const bValue = b.holdings * b.price;
      const aPnl = aValue - a.holdings * a.avgCost;
      const bPnl = bValue - b.holdings * b.avgCost;
      if (sortBy === 'price') { av = a.price; bv = b.price; }
      else if (sortBy === 'change') { av = a.change24h; bv = b.change24h; }
      else if (sortBy === 'volume') { av = a.volume24h; bv = b.volume24h; }
      else if (sortBy === 'value') { av = aValue; bv = bValue; }
      else if (sortBy === 'pnl') { av = aPnl; bv = bPnl; }
      if (sortBy === 'pnl') return sortDir === 'asc' ? av - bv : bv - av;
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [search, chainFilter, categoryFilter, sortBy, sortDir]);

  const filteredAnomalies = useMemo(() => {
    return ANOMALIES.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.symbol.toLowerCase().includes(q) && !a.desc.toLowerCase().includes(q)) return false;
      }
      if (anomalyLevelFilter !== 'all' && a.level !== anomalyLevelFilter) return false;
      if (anomalyTypeFilter !== 'all' && a.type !== anomalyTypeFilter) return false;
      return true;
    });
  }, [search, anomalyLevelFilter, anomalyTypeFilter]);

  const filteredAlerts = useMemo(() => {
    return PRICE_ALERTS.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.symbol.toLowerCase().includes(q)) return false;
      }
      if (alertEnabledFilter === 'enabled' && !a.enabled) return false;
      if (alertEnabledFilter === 'disabled' && a.enabled) return false;
      return true;
    });
  }, [search, alertEnabledFilter]);

  const filteredSubscriptions = useMemo(() => {
    return SUBSCRIPTIONS.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.desc.toLowerCase().includes(q)) return false;
      }
      if (subscriptionCategoryFilter !== 'all' && s.category !== subscriptionCategoryFilter) return false;
      return true;
    });
  }, [search, subscriptionCategoryFilter]);

  const openDrawer = useCallback((type: DrawerState['type'], payload?: string) => {
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
      else if (e.key === '2') setTab('watchlist');
      else if (e.key === '3') setTab('ranking');
      else if (e.key === '4') setTab('gainers');
      else if (e.key === '5') setTab('anomaly');
      else if (e.key === '6') setTab('alert');
      else if (e.key === '7') setTab('valuation');
      else if (e.key === '8') setTab('subscription');
      else if (e.key === '9') setTab('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  const renderKpi = useCallback((label: string, value: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode, color: string = BRAND.primary) => {
    return (
      <div className="rounded-xl p-4 pw-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: BRAND.textSub }}>{label}</span>
          {icon && <span style={{ color }}>{icon}</span>}
        </div>
        <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{value}</div>
        {sub && <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{sub}</div>}
      </div>
    );
  }, []);

  const handleAddAsset = () => {
    if (!addSymbol.trim()) {
      alert('请输入币种符号');
      return;
    }
    alert(`已添加自选：${addSymbol.toUpperCase()}${addNotes ? '（备注：' + addNotes + '）' : ''}`);
    setAddSymbol('');
    setAddNotes('');
    closeDrawer();
  };

  const handleCreateAlert = () => {
    if (!alertThreshold || parseFloat(alertThreshold) <= 0) {
      alert('请输入有效阈值');
      return;
    }
    alert(`已创建价格预警：${alertSymbol} ${ALERT_TYPE_LABELS[alertType]} ${alertThreshold}，将通过 ${alertChannels.map((c) => CHANNEL_LABELS[c]).join('、')} 推送`);
    setAlertThreshold('');
    closeDrawer();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pw-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pw-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pw-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pw-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes pw-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pw-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pw-ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(2); opacity: 0; } }
        .pw-stagger > * { animation: pw-fade-up 0.4s ease-out both; }
        .pw-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pw-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pw-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pw-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pw-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pw-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pw-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pw-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pw-pulse { animation: pw-pulse 2.4s ease-in-out infinite; }
        .pw-float { animation: pw-float 3s ease-in-out infinite; }
        .pw-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pw-shimmer 2.4s linear infinite; }
        .pw-drawer { animation: pw-slide-in 0.28s ease-out; }
        .pw-bar { transform-origin: left; animation: pw-bar 0.6s ease-out; }
        .pw-row:hover { background-color: ${BRAND.cardHover}; }
        .pw-blink { animation: pw-blink 1.6s ease-in-out infinite; }
        .pw-ping::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background-color: currentColor; animation: pw-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.4; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Star size={28} style={{ color: BRAND.primary }} className="pw-float" />
            <h1 className="text-3xl font-bold" style={{ color: BRAND.text }}>自选与行情提醒中心</h1>
            <span className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>P3.35</span>
          </div>
          <p className="text-sm mb-4" style={{ color: BRAND.textSub, maxWidth: 760 }}>
            中萨数字科技交易所自选与行情提醒中心：我的自选 / 热门榜单 / 涨跌榜 / 异动提醒 / 价格预警 / 资产估值 / 提醒订阅。
            与 P3.4 现货 + P3.32 链上数据分析 + P3.34 用户成长中心形成"行情-提醒-决策"全维度洞察闭环。
            明确"行情监控与价格提醒工具研究方向"定性，不构成对任何资产价格走势的预测或合规承诺。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成对任何资产收益的合规承诺</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: BRAND.textSub }}>自选资产总估值</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: changeColor(kpi.totalPnlPct) }}>{kpi.totalPnlPct >= 0 ? '+' : ''}{kpi.totalPnlPct.toFixed(2)}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: BRAND.text }}>{formatCurrency(kpi.totalValue)}</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
              {renderKpi('自选资产', <>{kpi.totalWatched}</>, <>已置顶 {kpi.pinnedCount}</>, <Star size={14} />, BRAND.primary)}
              {renderKpi('累计盈亏', <>{formatCurrency(kpi.totalPnl)}</>, <>{kpi.totalPnlPct >= 0 ? '+' : ''}{kpi.totalPnlPct.toFixed(2)}%</>, <TrendingUp size={14} />, kpi.totalPnl >= 0 ? BRAND.success : BRAND.danger)}
              {renderKpi('活跃预警', <>{kpi.activeAlerts}</>, <>今日触发 {kpi.triggeredToday}</>, <Bell size={14} />, BRAND.warning)}
              {renderKpi('异动提醒', <>{kpi.anomalyCount}</>, <>未读实时推送</>, <Zap size={14} />, BRAND.info)}
              {renderKpi('订阅渠道', <>{kpi.subscribedChannels}</>, <>多通道触达</>, <Send size={14} />, BRAND.success)}
              {renderKpi('榜单变动', <>{kpi.rankingChanges}</>, <>今日排名变化</>, <Activity size={14} />, BRAND.amber)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textSub }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资产 / 提醒 / 订阅…" className="bg-transparent outline-none flex-1 text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} className="p-0.5 rounded" style={{ color: BRAND.textSub }}><X size={14} /></button>}
            </div>
            <button onClick={() => openDrawer('add')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <Plus size={14} /> 添加自选
            </button>
            <button onClick={() => openDrawer('alert')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Bell size={14} /> 创建预警
            </button>
            <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {[
              { k: 'overview' as Tab, l: '总览' },
              { k: 'watchlist' as Tab, l: `自选 (${WATCHLIST.length})` },
              { k: 'ranking' as Tab, l: `榜单 (${RANKINGS.length})` },
              { k: 'gainers' as Tab, l: `涨跌 (${RANKINGS.length})` },
              { k: 'anomaly' as Tab, l: `异动 (${ANOMALIES.length})` },
              { k: 'alert' as Tab, l: `预警 (${PRICE_ALERTS.length})` },
              { k: 'valuation' as Tab, l: '估值' },
              { k: 'subscription' as Tab, l: `订阅 (${SUBSCRIPTIONS.length})` },
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
            <div className="space-y-6 pw-stagger">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>资产配置概览</h3>
                  <div className="space-y-2">
                    {(() => {
                      const byCat: Record<string, number> = {};
                      WATCHLIST.forEach((a) => {
                        const v = a.holdings * a.price;
                        byCat[a.category] = (byCat[a.category] || 0) + v;
                      });
                      const total = Object.values(byCat).reduce((s, v) => s + v, 0);
                      return Object.entries(byCat)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([cat, v]) => {
                          const pct = (v / total) * 100;
                          return (
                            <div key={cat}>
                              <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: BRAND.text }}>{CATEGORY_LABELS[cat as AssetCategory]}</span>
                                <span style={{ color: BRAND.textMute }}>{formatCurrency(v)} ({pct.toFixed(1)}%)</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                                <div className="h-full pw-bar" style={{ width: `${pct}%`, backgroundColor: BRAND.primary }} />
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>实时异动推送</h3>
                  <div className="space-y-2">
                    {ANOMALIES.slice(0, 5).map((a) => {
                      const levelColors = {
                        low: BRAND.textMute,
                        medium: BRAND.warning,
                        high: BRAND.danger,
                        critical: BRAND.danger,
                      };
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                          <div className="relative w-2 h-2 rounded-full" style={{ backgroundColor: levelColors[a.level] }}>
                            {!a.acknowledged && a.level !== 'low' && <span className="absolute inset-0 rounded-full" style={{ backgroundColor: levelColors[a.level], animation: 'pw-pulse 1.6s ease-in-out infinite' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm" style={{ color: BRAND.text }}>
                              <span className="font-semibold">{a.symbol}</span> · {ANOMALY_LABELS[a.type]}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>{a.desc}</div>
                          </div>
                          <div className="text-[10px] text-right" style={{ color: BRAND.textMute }}>{a.time}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>最佳表现</h3>
                  {WATCHLIST.filter((a) => a.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{formatPrice(a.price)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: BRAND.success }}>+{a.change24h.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>最差表现</h3>
                  {WATCHLIST.filter((a) => a.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{formatPrice(a.price)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: BRAND.danger }}>{a.change24h.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>订阅概览</h3>
                  <div className="space-y-2">
                    {SUBSCRIPTIONS.filter((s) => s.enabled).slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{s.name}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.channels.length} 通道 · {s.frequency}</div>
                        </div>
                        <BellRing size={14} style={{ color: BRAND.success }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'watchlist' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类别</option>
                    {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="value">按持仓价值</option>
                    <option value="pnl">按盈亏</option>
                    <option value="price">按价格</option>
                    <option value="change">按涨跌幅</option>
                    <option value="volume">按成交量</option>
                  </select>
                  <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, borderBottom: `1px solid ${BRAND.border}` }}>
                  <div className="col-span-3">资产</div>
                  <div className="col-span-2 text-right">价格</div>
                  <div className="col-span-2 text-right">24h 涨跌</div>
                  <div className="col-span-2 text-right">持仓价值</div>
                  <div className="col-span-2 text-right">盈亏</div>
                  <div className="col-span-1 text-right">操作</div>
                </div>
                {filteredWatchlist.map((a) => {
                  const value = a.holdings * a.price;
                  const pnl = value - a.holdings * a.avgCost;
                  const pnlPct = ((a.price - a.avgCost) / a.avgCost) * 100;
                  return (
                    <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center pw-row cursor-pointer" style={{ borderBottom: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('asset', a.id)}>
                      <div className="col-span-3 flex items-center gap-2">
                        {a.pinned ? <Star size={12} style={{ color: BRAND.warning, fill: BRAND.warning }} /> : <StarOff size={12} style={{ color: BRAND.textMute }} />}
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.name} · {CHAIN_LABELS[a.chain]}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text, fontWeight: 600 }}>{formatPrice(a.price)}</div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: changeBg(a.change24h), color: changeColor(a.change24h), border: `1px solid ${changeColor(a.change24h)}40` }}>
                          {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
                        </span>
                      </div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text }}>{formatCurrency(value)}</div>
                      <div className="col-span-2 text-right" style={{ color: pnl >= 0 ? BRAND.success : BRAND.danger, fontWeight: 600 }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        <div className="text-[10px]">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</div>
                      </div>
                      <div className="col-span-1 text-right">
                        <button onClick={(e) => { e.stopPropagation(); openDrawer('alert', a.symbol); }} className="p-1 rounded" style={{ color: BRAND.primary }} title="创建预警">
                          <Bell size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'ranking' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(RANKING_LABELS) as RankingType[]).map((r) => (
                    <button key={r} onClick={() => setRankingType(r)} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: rankingType === r ? BRAND.primary : BRAND.cardElevated, color: rankingType === r ? '#000' : BRAND.textSub, border: `1px solid ${rankingType === r ? BRAND.primary : BRAND.border}` }}>
                      {RANKING_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, borderBottom: `1px solid ${BRAND.border}` }}>
                  <div className="col-span-1">排名</div>
                  <div className="col-span-3">资产</div>
                  <div className="col-span-2 text-right">价格</div>
                  <div className="col-span-2 text-right">{rankingType.startsWith('gainers') || rankingType.startsWith('losers') ? '涨跌幅' : '成交额'}</div>
                  <div className="col-span-2 text-right">市值</div>
                  <div className="col-span-2 text-right">排名变化</div>
                </div>
                {[...RANKINGS]
                  .sort((a, b) => {
                    if (rankingType.startsWith('losers')) return a.change - b.change;
                    if (rankingType === 'volume_24h') return b.volume24h - a.volume24h;
                    return b.change - a.change;
                  })
                  .map((a, idx) => {
                    const rankChange = a.prevRank - (idx + 1);
                    return (
                      <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center pw-row" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div className="col-span-1">
                          <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: idx < 3 ? BRAND.warningLt : BRAND.cardElevated, color: idx < 3 ? BRAND.warning : BRAND.textMute, border: `1px solid ${idx < 3 ? BRAND.warning : BRAND.border}` }}>{idx + 1}</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.name} · {CHAIN_LABELS[a.chain]}</div>
                          </div>
                        </div>
                        <div className="col-span-2 text-right" style={{ color: BRAND.text, fontWeight: 600 }}>{formatPrice(a.price)}</div>
                        <div className="col-span-2 text-right">
                          {rankingType === 'volume_24h' ? (
                            <span style={{ color: BRAND.text }}>{formatCurrency(a.volume24h)}</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: changeBg(a.change), color: changeColor(a.change), border: `1px solid ${changeColor(a.change)}40` }}>
                              {a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-right" style={{ color: BRAND.text }}>{formatCurrency(a.marketCap)}</div>
                        <div className="col-span-2 text-right">
                          {rankChange > 0 ? (
                            <span className="text-[10px] flex items-center gap-1 justify-end" style={{ color: BRAND.success }}>
                              <ArrowUp size={10} /> {rankChange}
                            </span>
                          ) : rankChange < 0 ? (
                            <span className="text-[10px] flex items-center gap-1 justify-end" style={{ color: BRAND.danger }}>
                              <ArrowDown size={10} /> {Math.abs(rankChange)}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: BRAND.textMute }}>-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {tab === 'gainers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.success}40` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.success }}>24h 涨幅榜 TOP 5</h3>
                  <div className="space-y-2">
                    {RANKINGS.sort((a, b) => b.change - a.change).slice(0, 5).map((a, idx) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: idx === 0 ? BRAND.successLt : BRAND.cardElevated, border: `1px solid ${idx === 0 ? BRAND.success : BRAND.border}` }}>
                        <span className="text-base font-bold w-6" style={{ color: BRAND.success }}>{idx + 1}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{formatPrice(a.price)}</div>
                        </div>
                        <div className="text-base font-bold" style={{ color: BRAND.success }}>+{a.change.toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.danger}40` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.danger }}>24h 跌幅榜 TOP 5</h3>
                  <div className="space-y-2">
                    {RANKINGS.sort((a, b) => a.change - b.change).slice(0, 5).map((a, idx) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: idx === 0 ? BRAND.dangerLt : BRAND.cardElevated, border: `1px solid ${idx === 0 ? BRAND.danger : BRAND.border}` }}>
                        <span className="text-base font-bold w-6" style={{ color: BRAND.danger }}>{idx + 1}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{formatPrice(a.price)}</div>
                        </div>
                        <div className="text-base font-bold" style={{ color: BRAND.danger }}>{a.change.toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>多周期涨跌对比</h3>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, borderRadius: 6 }}>
                    <div className="col-span-2">资产</div>
                    <div className="col-span-2 text-right">1h</div>
                    <div className="col-span-2 text-right">4h</div>
                    <div className="col-span-2 text-right">24h</div>
                    <div className="col-span-2 text-right">7d</div>
                    <div className="col-span-2 text-right">30d</div>
                  </div>
                  {WATCHLIST.slice(0, 8).map((a) => {
                    const fake = (seed: number, scale: number) => ((seed * 13) % 100) / 100 * scale * (seed % 2 === 0 ? 1 : -1);
                    const c1h = fake(a.id.length, 0.5);
                    const c4h = fake(a.id.length + 1, 1.5);
                    return (
                      <div key={a.id} className="grid grid-cols-12 gap-2 px-2 py-2 text-xs items-center" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                          <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</span>
                        </div>
                        <div className="col-span-2 text-right" style={{ color: changeColor(c1h) }}>{c1h >= 0 ? '+' : ''}{c1h.toFixed(2)}%</div>
                        <div className="col-span-2 text-right" style={{ color: changeColor(c4h) }}>{c4h >= 0 ? '+' : ''}{c4h.toFixed(2)}%</div>
                        <div className="col-span-2 text-right" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</div>
                        <div className="col-span-2 text-right" style={{ color: changeColor(a.change7d) }}>{a.change7d >= 0 ? '+' : ''}{a.change7d.toFixed(2)}%</div>
                        <div className="col-span-2 text-right" style={{ color: changeColor(a.change30d) }}>{a.change30d >= 0 ? '+' : ''}{a.change30d.toFixed(2)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'anomaly' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={anomalyLevelFilter} onChange={(e) => setAnomalyLevelFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部等级</option>
                    <option value="critical">严重</option>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                  <select value={anomalyTypeFilter} onChange={(e) => setAnomalyTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    {(Object.keys(ANOMALY_LABELS) as AnomalyAlert['type'][]).map((t) => <option key={t} value={t}>{ANOMALY_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredAnomalies.map((a) => {
                  const levelColors = {
                    low: { bg: BRAND.cardElevated, fg: BRAND.textMute, label: '低' },
                    medium: { bg: BRAND.warningLt, fg: BRAND.warning, label: '中' },
                    high: { bg: BRAND.dangerLt, fg: BRAND.danger, label: '高' },
                    critical: { bg: BRAND.dangerLt, fg: BRAND.danger, label: '严重' },
                  };
                  const lc = levelColors[a.level];
                  return (
                    <div key={a.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${a.level === 'critical' || a.level === 'high' ? lc.fg + '40' : BRAND.border}`, opacity: a.acknowledged ? 0.6 : 1 }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: lc.bg, color: lc.fg }}>
                            {a.type === 'whale_move' ? <Activity size={14} /> : a.type === 'listing' ? <Rocket size={14} /> : a.type === 'volatility' ? <Activity size={14} /> : a.type === 'volume_surge' || a.type === 'volume_drop' ? <BarChart3 size={14} /> : <Zap size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: lc.bg, color: lc.fg, border: `1px solid ${lc.fg}40` }}>{lc.label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{ANOMALY_LABELS[a.type]}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: CHAIN_COLORS[a.chain], border: `1px solid ${CHAIN_COLORS[a.chain]}40` }}>{CHAIN_LABELS[a.chain]}</span>
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{a.desc}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.time}</div>
                          </div>
                        </div>
                        {!a.acknowledged && (
                          <button onClick={() => alert('已确认')} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                            确认
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'alert' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={alertEnabledFilter} onChange={(e) => setAlertEnabledFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    <option value="enabled">已启用</option>
                    <option value="disabled">已停用</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredAlerts.map((a) => {
                  const triggered = a.type === 'price_above' ? a.currentPrice >= a.threshold : a.type === 'price_below' ? a.currentPrice <= a.threshold : false;
                  return (
                    <div key={a.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${triggered ? BRAND.warning + '40' : BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: a.enabled ? BRAND.primaryLt : BRAND.cardElevated, color: a.enabled ? BRAND.primary : BRAND.textMute }}>
                            {a.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{ALERT_TYPE_LABELS[a.type]}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: CHAIN_COLORS[a.chain], border: `1px solid ${CHAIN_COLORS[a.chain]}40` }}>{CHAIN_LABELS[a.chain]}</span>
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>
                              触发阈值 {a.type === 'change_pct' ? `${a.threshold}%` : a.type === 'volatility' ? `${a.threshold}%` : formatPrice(a.threshold)} · 当前价格 {formatPrice(a.currentPrice)}
                            </div>
                            <div className="flex items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                              {a.channel.map((c) => (
                                <span key={c} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{CHANNEL_LABELS[c]}</span>
                              ))}
                            </div>
                            {triggered && (
                              <div className="mt-2 p-2 rounded text-[10px]" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning, border: `1px solid ${BRAND.warning}40` }}>
                                ⚠ 当前价格 {formatPrice(a.currentPrice)} 已触发预警阈值
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-base font-semibold" style={{ color: BRAND.primary }}>{a.triggered}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>累计触发</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'valuation' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10 0%, ${BRAND.success}10 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>自选资产总估值</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>总成本</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.text }}>{formatCurrency(WATCHLIST.reduce((s, a) => s + a.holdings * a.avgCost, 0))}</div>
                  </div>
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>当前估值</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.primary }}>{formatCurrency(kpi.totalValue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>累计盈亏</div>
                    <div className="text-xl font-bold" style={{ color: kpi.totalPnl >= 0 ? BRAND.success : BRAND.danger }}>{kpi.totalPnl >= 0 ? '+' : ''}{formatCurrency(kpi.totalPnl)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>收益率</div>
                    <div className="text-xl font-bold" style={{ color: kpi.totalPnl >= 0 ? BRAND.success : BRAND.danger }}>{kpi.totalPnlPct >= 0 ? '+' : ''}{kpi.totalPnlPct.toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, borderBottom: `1px solid ${BRAND.border}` }}>
                  <div className="col-span-2">资产</div>
                  <div className="col-span-2 text-right">持仓数量</div>
                  <div className="col-span-2 text-right">平均成本</div>
                  <div className="col-span-2 text-right">当前价格</div>
                  <div className="col-span-2 text-right">持仓价值</div>
                  <div className="col-span-2 text-right">盈亏</div>
                </div>
                {WATCHLIST.sort((a, b) => (b.holdings * b.price) - (a.holdings * a.price)).map((a) => {
                  const value = a.holdings * a.price;
                  const cost = a.holdings * a.avgCost;
                  const pnl = value - cost;
                  const pnlPct = (pnl / cost) * 100;
                  return (
                    <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                        <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</span>
                      </div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text }}>{a.holdings.toFixed(a.holdings < 1 ? 4 : 2)}</div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.textSub }}>{formatPrice(a.avgCost)}</div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text, fontWeight: 600 }}>{formatPrice(a.price)}</div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text }}>{formatCurrency(value)}</div>
                      <div className="col-span-2 text-right" style={{ color: pnl >= 0 ? BRAND.success : BRAND.danger, fontWeight: 600 }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        <div className="text-[10px]">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'subscription' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={subscriptionCategoryFilter} onChange={(e) => setSubscriptionCategoryFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部分类</option>
                    <option value="ranking">榜单</option>
                    <option value="anomaly">异动</option>
                    <option value="news">新闻</option>
                    <option value="event">事件</option>
                    <option value="launch">上新</option>
                    <option value="macro">宏观</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredSubscriptions.map((s) => {
                  const catColor = {
                    ranking: BRAND.warning,
                    anomaly: BRAND.danger,
                    news: BRAND.info,
                    event: BRAND.primary,
                    launch: BRAND.success,
                    macro: BRAND.amber,
                  }[s.category];
                  return (
                    <div key={s.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, opacity: s.enabled ? 1 : 0.6 }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: catColor + '20', color: catColor }}>
                            <Bell size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: catColor + '20', color: catColor, border: `1px solid ${catColor}40` }}>{s.category}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{s.frequency}</span>
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{s.desc}</div>
                            <div className="flex items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                              {s.channels.map((c) => (
                                <span key={c} className="px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{CHANNEL_LABELS[c]}</span>
                              ))}
                              <span>· {s.subscribers.toLocaleString()} 订阅</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => alert(s.enabled ? `已停用订阅：${s.name}` : `已启用订阅：${s.name}`)} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: s.enabled ? BRAND.successLt : BRAND.cardElevated, color: s.enabled ? BRAND.success : BRAND.textSub, border: `1px solid ${s.enabled ? BRAND.success : BRAND.border}40` }}>
                          {s.enabled ? '已启用' : '已停用'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>自选与行情提醒中心说明</h3>
              <div className="space-y-3 text-sm" style={{ color: BRAND.textSub }}>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>自选资产</div>
                  <p>· 添加您关注的币种到自选列表，可置顶重要资产 · 支持按链、类别、价格、涨跌、持仓价值、盈亏多维排序 · 系统自动计算持仓盈亏与收益率</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>行情榜单</div>
                  <p>· 24h 涨幅榜 / 跌幅榜 / 成交额榜 / 7d 涨幅榜 / 7d 跌幅榜 / 30d 涨幅榜 / 热门搜索榜 · 榜单每小时更新 · 可追踪排名变化</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>异动提醒</div>
                  <p>· 实时监控价格急涨/急跌、成交量激增/骤减、波动率飙升、巨鲸转账、新币上线等异常事件 · 严重事件将立即推送 App + 邮件</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>价格预警</div>
                  <p>· 7 种触发类型：价格突破 / 价格跌破 / 涨跌幅 / 成交量激增 / 波动率 / 历史新高 / 历史新低 · 5 种推送通道：App / 邮件 / 短信 / Webhook / Telegram</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>提醒订阅</div>
                  <p>· 订阅平台提供的多种提醒服务（榜单、异动、新闻、上新、宏观）· 支持实时 / 每小时 / 每日 / 每周 4 种频率 · 可多通道组合推送</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>合规说明</div>
                  <p className="text-[11px]">本平台自选与行情提醒中心为"行情监控与价格提醒工具研究方向"演示页面，所有行情/榜单/提醒/订阅数据均为 mock 占位。本平台不构成对任何资产价格走势的预测或合规承诺。严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险表述。具体使用请遵守所在司法管辖区的合规要求。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'add' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>添加自选</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>币种符号</label>
                <input value={addSymbol} onChange={(e) => setAddSymbol(e.target.value.toUpperCase())} placeholder="例：BTC / ETH / SOL" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>备注（可选）</label>
                <input value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="例：长期持仓 / 短期观察" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                · 添加后可在「我的自选」中查看和管理
              </div>
              <button onClick={handleAddAsset} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>添加</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'alert' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>创建价格预警</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>选择资产</label>
                <select value={alertSymbol} onChange={(e) => setAlertSymbol(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {WATCHLIST.map((a) => <option key={a.id} value={a.symbol}>{a.symbol} - {a.name} (当前 {formatPrice(a.price)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>预警类型</label>
                <select value={alertType} onChange={(e) => setAlertType(e.target.value as AlertType)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map((t) => <option key={t} value={t}>{ALERT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>触发阈值 {alertType === 'change_pct' || alertType === 'volatility' ? '（%）' : '（价格）'}</label>
                <input value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} placeholder={alertType === 'change_pct' ? '例：5' : '例：70000'} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>推送通道（可多选）</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(Object.keys(CHANNEL_LABELS) as AlertChannel[]).map((c) => {
                    const selected = alertChannels.includes(c);
                    return (
                      <button key={c} onClick={() => setAlertChannels((prev) => selected ? prev.filter((x) => x !== c) : [...prev, c])} className="px-3 py-2 rounded text-xs flex items-center gap-1.5" style={{ backgroundColor: selected ? BRAND.primaryLt : BRAND.card, color: selected ? BRAND.primary : BRAND.textSub, border: `1px solid ${selected ? BRAND.primary : BRAND.border}` }}>
                        {selected ? <Check size={12} /> : <Plus size={12} />} {CHANNEL_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={handleCreateAlert} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>创建预警</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'asset' && drawer.payload && (() => {
        const a = WATCHLIST.find((x) => x.id === drawer.payload);
        if (!a) return null;
        const value = a.holdings * a.price;
        const cost = a.holdings * a.avgCost;
        const pnl = value - cost;
        const pnlPct = (pnl / cost) * 100;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{a.symbol} 详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: CHAIN_COLORS[a.chain] + '20', color: CHAIN_COLORS[a.chain] }}>{a.symbol.slice(0, 2)}</div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{a.name}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{CHAIN_LABELS[a.chain]} · {CATEGORY_LABELS[a.category]}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>当前价格</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatPrice(a.price)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>24h 涨跌</div>
                    <div className="text-base font-bold" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>持仓数量</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{a.holdings.toFixed(a.holdings < 1 ? 4 : 2)}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>平均成本</div>
                    <div className="text-base font-bold" style={{ color: BRAND.text }}>{formatPrice(a.avgCost)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${changeBg(pnl)} 0%, transparent 100%)`, border: `1px solid ${changeColor(pnl)}40` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>持仓盈亏</div>
                  <div className="text-2xl font-bold" style={{ color: changeColor(pnl) }}>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</div>
                  <div className="text-sm font-semibold" style={{ color: changeColor(pnl) }}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                </div>
                {a.notes && (
                  <div className="p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                    备注：{a.notes}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { closeDrawer(); setAlertSymbol(a.symbol); setTimeout(() => openDrawer('alert'), 100); }} className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>创建预警</button>
                  <button onClick={() => alert(`已移除自选：${a.symbol}`)} className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>移除自选</button>
                </div>
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
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
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
          <div className="mt-4 p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
            · 快捷键在输入框内不生效，避免干扰表单输入
          </div>
        </div>
      </div>
    </div>
  );
}
