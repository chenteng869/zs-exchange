'use client';

/**
 * PortalResearch - 研究院与研报中心 (2026-07-19 Q05 P3.39)
 *
 * 页面定位：
 * - 中萨数字科技交易所 研究院与研报中心
 * - 总览 / 每日研报 / 深度分析 / 机构观点 / 宏观研究 / AMA 课堂 / 研报订阅 / 行业数据 / 帮助
 * - 与 P3.21 客户支持 + P3.35 自选行情 + P3.38 社区论坛
 *   形成"数据-研究-教育-讨论"完整内容研究闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 每日研报 / 深度分析 / 机构观点 / 宏观研究 / AMA 课堂 / 研报订阅 / 行业数据 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有研报 / 机构 / AMA / 订阅数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 研报内容仅为研究方向演示，不构成任何投资建议
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"内容研究与教育研究方向"定性
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  FileText,
  FileSearch,
  FileBarChart,
  FileSpreadsheet,
  FileCode,
  FilePieChart,
  BookOpen,
  BookMarked,
  Bookmark,
  BookmarkCheck,
  Library,
  GraduationCap,
  Lightbulb,
  Brain,
  Atom,
  FlaskConical,
  Microscope,
  Telescope,
  Sparkles,
  Star,
  StarOff,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  Download,
  Share2,
  Copy as CopyIcon,
  ExternalLink,
  Link2,
  Pin,
  PinOff,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Gauge,
  Target,
  Zap,
  Rocket,
  Flame,
  Clock,
  Calendar,
  Hash,
  Tag,
  Tags,
  Bell,
  BellOff,
  BellRing,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Volume2,
  Headphones,
  Play,
  Pause,
  SkipForward,
  Rewind,
  Video,
  Mic,
  Radio,
  Tv,
  Cast,
  Users,
  User,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  Crown,
  Award,
  Trophy,
  Medal,
  Gem,
  Globe,
  Globe2,
  MapPin,
  Compass,
  Flag,
  CheckCircle2,
  Check,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Minus,
  Edit,
  Edit2,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Sliders,
  SlidersHorizontal,
  HelpCircle,
  Keyboard,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Layers,
  Box,
  Boxes,
  Hexagon,
  Diamond,
  Database,
  Server,
  Cloud,
  Network,
  Cpu,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'daily' | 'deep' | 'institution' | 'macro' | 'ama' | 'subscription' | 'industry' | 'help';
type ReportCategory = 'market' | 'project' | 'macro' | 'regulation' | 'tech' | 'defi' | 'nft' | 'onchain' | 'research' | 'weekly' | 'monthly' | 'quarterly';
type ReportTier = 'free' | 'premium' | 'institutional' | 'vip';
type InstitutionType = 'independent' | 'exchange' | 'fund' | 'bank' | 'university' | 'media' | 'consultancy' | 'think-tank';
type InstitutionTier = 'platinum' | 'gold' | 'silver' | 'bronze';
type AmaStatus = 'upcoming' | 'live' | 'ended' | 'replay' | 'cancelled';
type MacroTheme = 'rate' | 'inflation' | 'geopolitics' | 'regulation' | 'liquidity' | 'risk' | 'cycle';
type IndustryMetric = 'tvl' | 'volume' | 'users' | 'fees' | 'revenue' | 'marketcap' | 'stablecoin' | 'bridge';
type SortBy = 'newest' | 'hot' | 'most_read' | 'most_liked' | 'rating' | 'duration';
type DrawerType = 'report' | 'institution' | 'ama' | 'macro' | 'metric' | 'subscribe' | 'help' | null;

interface DataPoint {
  label: string;
  value: string;
  change?: number;
  unit?: string;
  note?: string;
}

interface Report {
  id: string;
  title: string;
  category: ReportCategory;
  tier: ReportTier;
  author: string;
  authorId: string;
  authorTitle: string;
  institution: string;
  institutionId: string;
  cover: string;
  summary: string;
  tags: string[];
  pages: number;
  readMinutes: number;
  reads: number;
  likes: number;
  bookmarks: number;
  comments: number;
  publishedAt: string;
  updatedAt: string;
  views: number;
  rating: number;
  isHot: boolean;
  isPinned: boolean;
  hasAudio: boolean;
  language: 'zh' | 'en' | 'both';
  highlights: string[];
  dataPoints: DataPoint[];
  disclaimers: string[];
  assets: string[];
  methodology?: string;
  conclusion?: string;
  audience: string[];
}

interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  region: string;
  logo: string;
  established: number;
  analysts: number;
  reportsCount: number;
  subscribers: number;
  rating: number;
  coverage: string[];
  tier: InstitutionTier;
  joinedAt: string;
  bio: string;
  highlights: string[];
  social: { twitter?: string; website?: string };
  followers: number;
  monthlyReports: number;
  premiumAccess: boolean;
  focus: string[];
  contact: string;
  recentReports: string[];
  achievements: string[];
}

interface Analyst {
  id: string;
  name: string;
  avatar: string;
  title: string;
  institution: string;
  institutionId: string;
  bio: string;
  joinedAt: string;
  badges: string[];
  isVerified: boolean;
  followers: number;
  weeklyReports: number;
  monthlyReads: number;
  responseHours: number;
  languages: string[];
  specialties: string[];
  rating: number;
  totalReports: number;
  influence: number;
}

interface AmaSession {
  id: string;
  title: string;
  guest: string;
  guestId: string;
  guestTitle: string;
  topic: string;
  cover: string;
  status: AmaStatus;
  startTime: string;
  endTime: string;
  platform: 'youtube' | 'twitter' | 'discord' | 'zoom' | 'telegram' | 'native';
  registered: number;
  attending: number;
  maxAttendees: number;
  questions: number;
  answeredQuestions: number;
  description: string;
  tags: string[];
  language: string;
  rewards: { type: string; amount: number; currency: string };
  replay?: { views: number; likes: number; duration: number };
}

interface MacroReport {
  id: string;
  title: string;
  theme: MacroTheme;
  region: string;
  author: string;
  authorId: string;
  cover: string;
  summary: string;
  keyPoints: string[];
  publishedAt: string;
  views: number;
  likes: number;
  readingTime: number;
  tags: string[];
  impact: 'high' | 'medium' | 'low';
  relatedAssets: string[];
}

interface IndustryMetric {
  id: string;
  metric: IndustryMetric;
  name: string;
  category: string;
  current: number;
  change24h: number;
  change7d: number;
  change30d: number;
  history: { time: string; value: number }[];
  topMovers: { name: string; change: number }[];
  description: string;
  source: string;
  unit: string;
}

interface Subscription {
  id: string;
  name: string;
  desc: string;
  category: ReportCategory | 'all' | 'weekly' | 'daily' | 'macro' | 'premium';
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  channels: ('app' | 'email' | 'sms' | 'webhook' | 'telegram')[];
  enabled: boolean;
  subscribers: number;
  price: number;
  currency: string;
  isPremium: boolean;
}

interface KpiSnapshot {
  totalReports: number;
  totalInstitutions: number;
  totalAnalysts: number;
  totalSubscribers: number;
  totalReads: number;
  totalAma: number;
  totalMacro: number;
  totalMetrics: number;
  todayPublished: number;
  todayReads: number;
  todayLikes: number;
  premiumReports: number;
  hotIndex: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 常量 ==============

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  market: '行情研报',
  project: '项目研报',
  macro: '宏观研报',
  regulation: '监管研究',
  tech: '技术研究',
  defi: 'DeFi 研究',
  nft: 'NFT 研究',
  onchain: '链上数据',
  research: '深度研究',
  weekly: '周报',
  monthly: '月报',
  quarterly: '季报',
};

const CATEGORY_COLORS: Record<ReportCategory, string> = {
  market: '#14B881',
  project: '#44DBF4',
  macro: '#FFB400',
  regulation: '#FF5050',
  tech: '#A855F7',
  defi: '#3B82F6',
  nft: '#EC4899',
  onchain: '#10B981',
  research: '#F97316',
  weekly: '#06B6D4',
  monthly: '#8B5CF6',
  quarterly: '#EAB308',
};

const TIER_LABELS: Record<ReportTier, string> = {
  free: '免费',
  premium: '高级',
  institutional: '机构级',
  vip: 'VIP',
};

const TIER_COLORS: Record<ReportTier, { bg: string; fg: string }> = {
  free: { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textSub },
  premium: { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary },
  institutional: { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400' },
  vip: { bg: 'rgba(168,85,247,0.10)', fg: '#A855F7' },
};

const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  independent: '独立研究',
  exchange: '交易所研究',
  fund: '投资基金',
  bank: '银行研究',
  university: '学术机构',
  media: '媒体研究',
  consultancy: '咨询机构',
  'think-tank': '智库',
};

const INSTITUTION_TIER_LABELS: Record<InstitutionTier, string> = {
  platinum: '铂金',
  gold: '黄金',
  silver: '白银',
  bronze: '青铜',
};

const INSTITUTION_TIER_COLORS: Record<InstitutionTier, string> = {
  platinum: '#E5E4E2',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const AMA_STATUS_LABELS: Record<AmaStatus, string> = {
  upcoming: '预告中',
  live: '直播中',
  ended: '已结束',
  replay: '回放',
  cancelled: '已取消',
};

const MACRO_THEME_LABELS: Record<MacroTheme, string> = {
  rate: '利率政策',
  inflation: '通胀',
  geopolitics: '地缘政治',
  regulation: '监管动向',
  liquidity: '流动性',
  risk: '风险事件',
  cycle: '周期轮动',
};

const MACRO_THEME_COLORS: Record<MacroTheme, string> = {
  rate: '#FFB400',
  inflation: '#F97316',
  geopolitics: '#FF5050',
  regulation: '#A855F7',
  liquidity: '#14B881',
  risk: '#EC4899',
  cycle: '#44DBF4',
};

const INDUSTRY_METRIC_LABELS: Record<IndustryMetric, string> = {
  tvl: '总锁仓量',
  volume: '交易量',
  users: '活跃用户',
  fees: '协议收入',
  revenue: '矿工收入',
  marketcap: '总市值',
  stablecoin: '稳定币市值',
  bridge: '跨链桥流量',
};

const SORT_LABELS: Record<SortBy, string> = {
  newest: '最新发布',
  hot: '最热门',
  most_read: '最多阅读',
  most_liked: '最多点赞',
  rating: '评分最高',
  duration: '深度最长',
};

// ============== 工具函数 ==============

function formatNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function formatPrice(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatDate(d: string): string {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(d: string): string {
  const date = new Date(d);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

function reportCategoryBadge(c: ReportCategory): { bg: string; fg: string; label: string } {
  return { bg: `${CATEGORY_COLORS[c]}20`, fg: CATEGORY_COLORS[c], label: CATEGORY_LABELS[c] };
}

function reportTierBadge(t: ReportTier): { bg: string; fg: string; label: string } {
  return { bg: TIER_COLORS[t].bg, fg: TIER_COLORS[t].fg, label: TIER_LABELS[t] };
}

function amaStatusBadge(s: AmaStatus): { bg: string; fg: string; label: string } {
  if (s === 'live') return { bg: 'rgba(255,80,80,0.10)', fg: '#FF5050', label: AMA_STATUS_LABELS[s] };
  if (s === 'upcoming') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', label: AMA_STATUS_LABELS[s] };
  if (s === 'replay') return { bg: 'rgba(68,219,244,0.10)', fg: BRAND.info, label: AMA_STATUS_LABELS[s] };
  if (s === 'ended') return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMute, label: AMA_STATUS_LABELS[s] };
  return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMute, label: AMA_STATUS_LABELS[s] };
}

// ============== Mock 数据 ==============

const REPORTS: Report[] = [
  {
    id: 'r-001', title: 'BTC 7 月行情展望：震荡区间与潜在催化', category: 'market', tier: 'free',
    author: '陈昊天', authorId: 'a-001', authorTitle: '首席行情分析师', institution: 'Helix Research', institutionId: 'i-001',
    cover: '📈', summary: '6 月 BTC 在 60K-72K 区间宽幅震荡，本研报从链上数据、宏观流动性、衍生品持仓三个维度拆解 7 月潜在催化。',
    tags: ['BTC', '行情', '周期', '7月展望'], pages: 28, readMinutes: 18, reads: 24800, likes: 1842, bookmarks: 1240, comments: 184,
    publishedAt: '2026-07-19 09:30:00', updatedAt: '2026-07-19 09:30:00', views: 28400, rating: 4.8,
    isHot: true, isPinned: true, hasAudio: true, language: 'zh',
    highlights: ['链上换手率创近 90 天新低', 'CME 持仓环比 -12% 显示机构观望', '7 月关键支撑 60K / 阻力 72K'],
    dataPoints: [
      { label: '当前价格', value: '$68,420', change: 2.84 },
      { label: '链上活跃地址', value: '924K', change: -3.2 },
      { label: 'CME 持仓', value: '$8.4B', change: -12.4 },
      { label: '7d 波动率', value: '38.4%', change: 4.2 },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议', '数字资产波动剧烈，请独立判断并严控风险'],
    assets: ['BTC', 'ETH'], methodology: '链上数据 + 衍生品持仓 + 宏观流动性三维交叉验证', conclusion: '短期震荡偏多，关键支撑 60K，阻力 72K',
    audience: ['进阶用户', '机构客户', '研究员'],
  },
  {
    id: 'r-002', title: 'ZSD 代币经济模型 2.0 解读', category: 'project', tier: 'premium',
    author: '林婉清', authorId: 'a-002', authorTitle: '项目研究员', institution: 'ZSDEX Labs', institutionId: 'i-002',
    cover: '💎', summary: 'ZSD 代币经济模型 2.0 已通过 DAO 提案，本研报详细拆解新模型在销毁机制、回购策略、Staking 收益三方面的优化。',
    tags: ['ZSD', '代币经济', 'DAO', '回购销毁'], pages: 42, readMinutes: 28, reads: 18420, likes: 1248, bookmarks: 1840, comments: 124,
    publishedAt: '2026-07-18 16:00:00', updatedAt: '2026-07-19 10:00:00', views: 21400, rating: 4.9,
    isHot: true, isPinned: false, hasAudio: false, language: 'zh',
    highlights: ['回购规模提升至手续费 30%', '销毁机制升级为自动链上执行', 'Staking APY 区间 4.2-7.8%'],
    dataPoints: [
      { label: '当前流通', value: '184M', change: 0 },
      { label: '回购累计', value: '24.8M', change: 8.4 },
      { label: 'Staking 总量', value: '64.2M', change: 12.4 },
      { label: 'APY 区间', value: '4.2-7.8%' },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议', '代币经济模型可能根据 DAO 投票调整'],
    assets: ['ZSD'], methodology: '链上数据 + DAO 提案 + 财务模型建模', conclusion: '销毁 + 回购 + Staking 三轮驱动，长期通缩可期',
    audience: ['ZSD 持币人', '研究员', '机构客户'],
  },
  {
    id: 'r-003', title: '美联储 7 月议息会议前瞻与加密资产影响', category: 'macro', tier: 'free',
    author: 'Marcus Chen', authorId: 'a-003', authorTitle: '宏观策略总监', institution: 'Global Macro', institutionId: 'i-003',
    cover: '🌐', summary: '美联储 7 月议息会议即将召开，本研报从利率路径、缩表节奏、市场预期三个维度分析对加密资产的可能影响。',
    tags: ['宏观', '美联储', '利率', '流动性'], pages: 22, readMinutes: 14, reads: 31200, likes: 2148, bookmarks: 1820, comments: 248,
    publishedAt: '2026-07-19 07:00:00', updatedAt: '2026-07-19 11:00:00', views: 36400, rating: 4.7,
    isHot: true, isPinned: false, hasAudio: true, language: 'both',
    highlights: ['市场预期 7 月按兵不动概率 84%', '9 月降息 25bp 概率升至 62%', '流动性预期改善利好风险资产'],
    dataPoints: [
      { label: '联邦基金利率', value: '5.25-5.50%' },
      { label: '9月降息概率', value: '62%', change: 8.4 },
      { label: '10Y 美债', value: '4.18%', change: -0.04 },
      { label: 'DXY 美元指数', value: '104.2', change: -0.42 },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议', '宏观环境复杂多变，请持续关注最新动态'],
    assets: ['BTC', 'ETH', 'GOLD'], methodology: '利率期货 + FOMC 点阵图 + 宏观流动性模型', conclusion: '7 月按兵不动概率大，9 月或开启降息周期',
    audience: ['所有用户', '机构客户', '研究员'],
  },
  {
    id: 'r-004', title: 'Layer2 赛道全景：OP / ARB / zkSync / Starknet 横向对比', category: 'research', tier: 'institutional',
    author: '李思源', authorId: 'a-004', authorTitle: '高级研究员', institution: 'Chain Insight', institutionId: 'i-004',
    cover: '🔗', summary: 'Layer2 赛道已进入下半场，本研报从 TVL、用户数、交易成本、生态丰富度四个维度横向对比四大主流 L2。',
    tags: ['Layer2', 'OP', 'ARB', 'zkSync', 'Starknet'], pages: 64, readMinutes: 42, reads: 8420, likes: 648, bookmarks: 1240, comments: 84,
    publishedAt: '2026-07-17 14:00:00', updatedAt: '2026-07-18 10:00:00', views: 12400, rating: 4.9,
    isHot: false, isPinned: true, hasAudio: false, language: 'zh',
    highlights: ['Arbitrum TVL 仍居首 18.4B', 'OP Stack 生态增长最快', 'zkSync 验证成本最低'],
    dataPoints: [
      { label: 'ARB TVL', value: '$18.4B' },
      { label: 'OP TVL', value: '$12.8B' },
      { label: 'zkSync TVL', value: '$4.2B' },
      { label: 'Starknet TVL', value: '$2.8B' },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议', '数据截至研报发布时点，请以最新数据为准'],
    assets: ['ARB', 'OP', 'ZKS', 'STRK'], methodology: 'DefiLlama + L2 浏览器 + 生态项目数多源交叉', conclusion: 'L2 进入精细化竞争，生态丰富度将成为决胜关键',
    audience: ['研究员', '机构客户', '项目方'],
  },
  {
    id: 'r-005', title: 'DeFi 协议收入 2026 Q2 排行榜与趋势', category: 'defi', tier: 'premium',
    author: '苏明远', authorId: 'a-005', authorTitle: 'DeFi 研究主管', institution: 'DefiLab', institutionId: 'i-005',
    cover: '💰', summary: '2026 Q2 DeFi 协议收入合计 4.8 亿美元，本研报拆解前十大协议的收入结构与增长趋势。',
    tags: ['DeFi', '协议收入', 'Q2 季报', '排行榜'], pages: 36, readMinutes: 24, reads: 12400, likes: 840, bookmarks: 1240, comments: 124,
    publishedAt: '2026-07-16 10:00:00', updatedAt: '2026-07-16 10:00:00', views: 14200, rating: 4.6,
    isHot: false, isPinned: false, hasAudio: false, language: 'zh',
    highlights: ['Uniswap 单季收入 8400 万美元', 'Aave V4 表现亮眼环比 +42%', 'Lending 赛道占整体收入 38%'],
    dataPoints: [
      { label: 'Q2 总收入', value: '$484M', change: 18.4 },
      { label: 'Uniswap', value: '$84M', change: 24.6 },
      { label: 'Aave', value: '$62M', change: 42.4 },
      { label: 'Lido', value: '$48M', change: 8.2 },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议'],
    assets: ['UNI', 'AAVE', 'LDO'], methodology: 'Token Terminal + 协议财务披露', audience: ['DeFi 用户', '研究员'],
  },
  {
    id: 'r-006', title: 'NFT 二级市场流动性深度报告', category: 'nft', tier: 'institutional',
    author: '艾琳娜', authorId: 'a-006', authorTitle: 'NFT 高级分析师', institution: 'NFT Insight', institutionId: 'i-006',
    cover: '🖼️', summary: 'NFT 二级市场流动性持续分化，本研报从 8 大蓝筹系列和新兴 IP 系列两个维度深度分析流动性现状。',
    tags: ['NFT', '二级市场', '流动性', '蓝筹'], pages: 48, readMinutes: 32, reads: 6420, likes: 480, bookmarks: 840, comments: 64,
    publishedAt: '2026-07-15 11:00:00', updatedAt: '2026-07-15 11:00:00', views: 8400, rating: 4.5,
    isHot: false, isPinned: false, hasAudio: false, language: 'both',
    highlights: ['蓝筹系列日均成交 $1.2M', '新兴 IP 流动性两极分化', '音乐 NFT 流动性 +24%'],
    dataPoints: [
      { label: '蓝筹日成交', value: '$1.2M' },
      { label: '总成交系列', value: '8,420' },
      { label: '活跃买家', value: '24.8K' },
      { label: '平均持有', value: '124 天' },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议'],
    assets: ['NFT'], audience: ['NFT 玩家', '机构客户'],
  },
  {
    id: 'r-007', title: '链上数据周报：稳定币市值与跨链桥流量观察', category: 'onchain', tier: 'free',
    author: '链上观察', authorId: 'a-007', authorTitle: '链上数据团队', institution: 'OnChain Lab', institutionId: 'i-007',
    cover: '🔍', summary: '本周稳定币市值微涨 0.8%，跨链桥流量环比 +12.4%，Base 链流入持续领先。',
    tags: ['链上数据', '稳定币', '跨链桥', '周报'], pages: 18, readMinutes: 12, reads: 18420, likes: 1240, bookmarks: 1240, comments: 84,
    publishedAt: '2026-07-14 09:00:00', updatedAt: '2026-07-19 09:00:00', views: 24800, rating: 4.6,
    isHot: false, isPinned: false, hasAudio: false, language: 'zh',
    highlights: ['USDT 市值 112B', 'USDC 市值 32B', 'Base 链跨链流入 +24%'],
    dataPoints: [
      { label: 'USDT', value: '$112B', change: 0.6 },
      { label: 'USDC', value: '$32B', change: 1.2 },
      { label: 'DAI', value: '$4.8B', change: -0.4 },
      { label: '桥流量', value: '$8.4B', change: 12.4 },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议'],
    assets: ['USDT', 'USDC', 'DAI'], audience: ['链上用户', '研究员'],
  },
  {
    id: 'r-008', title: '2026 Q3 数字资产行业研报：周期与机会', category: 'quarterly', tier: 'vip',
    author: 'Helix 研究院', authorId: 'a-008', authorTitle: '研究院团队', institution: 'Helix Research', institutionId: 'i-001',
    cover: '🏛️', summary: '2026 Q3 行业全景：从 ETF 资金流向、稳定币政策、RWA 落地、监管沙盒四个维度分析下半年机会。',
    tags: ['季报', 'Q3', 'ETF', 'RWA', '监管沙盒'], pages: 96, readMinutes: 60, reads: 4200, likes: 480, bookmarks: 1240, comments: 42,
    publishedAt: '2026-07-10 10:00:00', updatedAt: '2026-07-12 14:00:00', views: 8400, rating: 4.9,
    isHot: true, isPinned: true, hasAudio: true, language: 'both',
    highlights: ['BTC ETF 累计净流入 $24B', 'RWA TVL 突破 $18B', '香港稳定币沙盒进展'],
    dataPoints: [
      { label: 'BTC ETF 净流入', value: '$24B' },
      { label: 'RWA TVL', value: '$18.4B', change: 24.6 },
      { label: '全球用户', value: '612M' },
      { label: '机构占比', value: '38.4%' },
    ],
    disclaimers: ['本研报为研究方向演示，不构成任何投资建议', 'VIP 研报仅供高级订阅用户查阅'],
    assets: ['BTC', 'ETH', 'RWA'], methodology: 'Bloomberg + DefiLlama + 监管文件多源分析', conclusion: 'Q3 整体偏多，关注 ETF 与 RWA 双主线',
    audience: ['VIP 用户', '机构客户'],
  },
];

const INSTITUTIONS: Institution[] = [
  { id: 'i-001', name: 'Helix Research 海螺研究院', shortName: 'Helix', type: 'independent', region: '全球', logo: '🔬', established: 2018, analysts: 28, reportsCount: 1240, subscribers: 24800, rating: 4.9, coverage: ['BTC', 'ETH', 'Layer1', '宏观'], tier: 'platinum', joinedAt: '2025-08-15', bio: '海螺研究院是全球领先的数字资产研究机构，专注于加密资产与宏观金融的交叉研究。', highlights: ['28 位全职分析师', '8 大研究领域', '覆盖 240+ 标的'], social: { twitter: '@helix_research', website: 'helix.example.com' }, followers: 184000, monthlyReports: 84, premiumAccess: true, focus: ['行情研报', '项目研究', '宏观策略'], contact: 'research@helix.example.com', recentReports: ['r-001', 'r-008'], achievements: ['2025 年度最佳数字资产研究机构', 'BLOOMBERG 引用 Top 10'] },
  { id: 'i-002', name: 'ZSDEX Labs 实验室', shortName: 'ZSDEX', type: 'exchange', region: '全球', logo: '⚗️', established: 2020, analysts: 14, reportsCount: 480, subscribers: 12400, rating: 4.7, coverage: ['ZSD', '平台币', '生态项目'], tier: 'platinum', joinedAt: '2025-12-20', bio: 'ZSDEX Labs 专注于平台生态与代币经济研究，发布 ZSD 系列深度研报。', highlights: ['14 位研究员', '专注 ZSD 生态', '链上数据深度整合'], social: { twitter: '@zsdex_labs' }, followers: 64000, monthlyReports: 24, premiumAccess: true, focus: ['代币经济', '链上数据', '生态项目'], contact: 'labs@zsdex.example.com', recentReports: ['r-002'], achievements: ['ZSD 模型 2.0 推动方', 'DAO 提案领衔'] },
  { id: 'i-003', name: 'Global Macro 环球宏观', shortName: 'G-Macro', type: 'independent', region: '全球', logo: '🌍', established: 2015, analysts: 22, reportsCount: 1840, subscribers: 38400, rating: 4.8, coverage: ['宏观', '利率', '汇率', '商品'], tier: 'platinum', joinedAt: '2025-09-08', bio: '环球宏观专注于全球货币政策与跨资产联动研究，提供机构级宏观策略。', highlights: ['22 位宏观分析师', '前央行经济学家团队', '跨资产联动研究'], social: { twitter: '@g_macro', website: 'gmacro.example.com' }, followers: 240000, monthlyReports: 64, premiumAccess: true, focus: ['宏观策略', '央行政策', '跨资产'], contact: 'contact@gmacro.example.com', recentReports: ['r-003'], achievements: ['前 IMF 经济学家领衔', '机构订阅 8.4 亿'] },
  { id: 'i-004', name: 'Chain Insight 链上洞察', shortName: 'Chain', type: 'independent', region: '亚太', logo: '🔗', established: 2019, analysts: 16, reportsCount: 680, subscribers: 18400, rating: 4.8, coverage: ['Layer2', '链上数据', '公链研究'], tier: 'gold', joinedAt: '2026-01-10', bio: '链上洞察专注于公链生态和 L2 赛道深度研究。', highlights: ['16 位分析师', 'L2 全赛道覆盖', '链上数据自研'], social: { twitter: '@chaininsight', website: 'chain.example.com' }, followers: 84000, monthlyReports: 32, premiumAccess: true, focus: ['Layer2', '公链', '链上数据'], contact: 'team@chain.example.com', recentReports: ['r-004'], achievements: ['L2 赛道最深度研究', '行业标准制定参与方'] },
  { id: 'i-005', name: 'DefiLab DeFi 实验室', shortName: 'DefiLab', type: 'independent', region: '全球', logo: '🧪', established: 2020, analysts: 12, reportsCount: 480, subscribers: 12400, rating: 4.6, coverage: ['DeFi', 'Lending', 'DEX', '衍生品'], tier: 'gold', joinedAt: '2026-02-18', bio: 'DeFi 实验室专注于 DeFi 协议深度研究，发布协议收入和 TVL 排行榜。', highlights: ['12 位 DeFi 专家', '协议财务建模', 'TVL 实时数据库'], social: { twitter: '@defilab' }, followers: 48000, monthlyReports: 18, premiumAccess: true, focus: ['DeFi', '协议收入', 'TVL 分析'], contact: 'lab@defilab.example.com', recentReports: ['r-005'], achievements: ['TVL 数据被多家头部机构引用'] },
  { id: 'i-006', name: 'NFT Insight NFT 洞察', shortName: 'NFT-I', type: 'media', region: '全球', logo: '🖼️', established: 2021, analysts: 8, reportsCount: 240, subscribers: 8400, rating: 4.5, coverage: ['NFT', '数字藏品', 'IP 合作'], tier: 'silver', joinedAt: '2026-03-15', bio: 'NFT 洞察专注于数字藏品与 IP 流动研究。', highlights: ['8 位 NFT 专家', 'IP 合作网络', '二级市场实时监控'], social: { twitter: '@nftinsight' }, followers: 28000, monthlyReports: 12, premiumAccess: false, focus: ['NFT 二级', 'IP 合作', '数字藏品'], contact: 'hi@nftinsight.example.com', recentReports: ['r-006'], achievements: ['数字藏品合规研究白皮书发布方'] },
  { id: 'i-007', name: 'OnChain Lab 链上实验室', shortName: 'OnChain', type: 'independent', region: '全球', logo: '🔍', established: 2020, analysts: 10, reportsCount: 360, subscribers: 12400, rating: 4.7, coverage: ['链上数据', '稳定币', '跨链'], tier: 'silver', joinedAt: '2026-04-20', bio: '链上实验室专注于稳定币、跨链桥等链上基础设施的深度研究。', highlights: ['10 位数据科学家', '实时链上数据', '每周数据周报'], social: { twitter: '@onchainlab' }, followers: 32000, monthlyReports: 8, premiumAccess: false, focus: ['链上数据', '稳定币', '跨链'], contact: 'data@onchain.example.com', recentReports: ['r-007'], achievements: ['链上数据被多家媒体引用'] },
];

const ANALYSTS: Analyst[] = [
  { id: 'a-001', name: '陈昊天', avatar: '🧑‍💼', title: '首席行情分析师', institution: 'Helix Research', institutionId: 'i-001', bio: '12 年传统金融 + 6 年加密资产研究经验，前头部投行宏观策略师。', joinedAt: '2025-08-15', badges: ['铂金分析师', '宏观策略', '衍生品专家'], isVerified: true, followers: 84000, weeklyReports: 4, monthlyReads: 184000, responseHours: 4, languages: ['中文', '英文'], specialties: ['行情', '衍生品', '周期'], rating: 4.9, totalReports: 280, influence: 92 },
  { id: 'a-002', name: '林婉清', avatar: '👩‍💼', title: '项目研究员', institution: 'ZSDEX Labs', institutionId: 'i-002', bio: '专注代币经济与 DAO 治理研究，主持多份生态深度报告。', joinedAt: '2025-12-20', badges: ['DAO 专家', '代币经济', '研究新星'], isVerified: true, followers: 28000, weeklyReports: 2, monthlyReads: 84000, responseHours: 8, languages: ['中文', '英文'], specialties: ['代币经济', 'DAO', '链上数据'], rating: 4.8, totalReports: 124, influence: 76 },
  { id: 'a-003', name: 'Marcus Chen', avatar: '🧑‍💻', title: '宏观策略总监', institution: 'Global Macro', institutionId: 'i-003', bio: '前国际货币基金组织（IMF）经济学家，15 年全球宏观研究经验。', joinedAt: '2025-09-08', badges: ['铂金分析师', '前 IMF', '宏观权威'], isVerified: true, followers: 124000, weeklyReports: 3, monthlyReads: 240000, responseHours: 6, languages: ['中文', '英文'], specialties: ['宏观', '央行政策', '跨资产'], rating: 4.9, totalReports: 320, influence: 96 },
  { id: 'a-004', name: '李思源', avatar: '🧑‍🔬', title: '高级研究员', institution: 'Chain Insight', institutionId: 'i-004', bio: '专注 L2 赛道研究，公链架构与生态评估专家。', joinedAt: '2026-01-10', badges: ['公链专家', 'L2 赛道', '技术背景'], isVerified: true, followers: 42000, weeklyReports: 2, monthlyReads: 124000, responseHours: 12, languages: ['中文', '英文'], specialties: ['Layer2', '公链', '技术架构'], rating: 4.8, totalReports: 96, influence: 82 },
  { id: 'a-005', name: '苏明远', avatar: '👨‍💼', title: 'DeFi 研究主管', institution: 'DefiLab', institutionId: 'i-005', bio: '专注 DeFi 协议财务建模与协议收入分析。', joinedAt: '2026-02-18', badges: ['DeFi 专家', '财务建模', '协议分析'], isVerified: true, followers: 24000, weeklyReports: 1, monthlyReads: 84000, responseHours: 24, languages: ['中文', '英文'], specialties: ['DeFi', '协议收入', 'TVL'], rating: 4.7, totalReports: 64, influence: 74 },
];

const AMA_SESSIONS: AmaSession[] = [
  { id: 'ama-001', title: 'ZSD 代币经济 2.0 全面解读', guest: '林婉清', guestId: 'a-002', guestTitle: 'ZSDEX Labs 项目研究员', topic: '代币经济模型', cover: '💎', status: 'upcoming', startTime: '2026-07-22 20:00:00', endTime: '2026-07-22 21:30:00', platform: 'youtube', registered: 2840, attending: 0, maxAttendees: 5000, questions: 184, answeredQuestions: 0, description: '林婉清老师将深度解读 ZSD 代币经济 2.0 的销毁机制、回购策略、Staking 收益三方面优化，并回答社区问题。', tags: ['ZSD', '代币经济', 'DAO'], language: '中文', rewards: { type: '积分', amount: 200, currency: 'ZS' }, replay: undefined },
  { id: 'ama-002', title: '7 月行情展望：BTC / ETH / SOL 三大主流币深度分析', guest: '陈昊天', guestId: 'a-001', guestTitle: 'Helix 首席行情分析师', topic: '行情分析', cover: '📈', status: 'live', startTime: '2026-07-19 20:00:00', endTime: '2026-07-19 21:30:00', platform: 'native', registered: 4280, attending: 1840, maxAttendees: 5000, questions: 240, answeredQuestions: 84, description: '陈昊天老师分享 7 月行情展望，重点分析 BTC / ETH / SOL 三大主流币的潜在催化与风险。', tags: ['BTC', 'ETH', 'SOL', '7月展望'], language: '中文', rewards: { type: '积分', amount: 100, currency: 'ZS' }, replay: undefined },
  { id: 'ama-003', title: '美联储 7 月议息会议前瞻', guest: 'Marcus Chen', guestId: 'a-003', guestTitle: 'Global Macro 宏观策略总监', topic: '宏观分析', cover: '🌐', status: 'replay', startTime: '2026-07-18 10:00:00', endTime: '2026-07-18 11:30:00', platform: 'youtube', registered: 4840, attending: 0, maxAttendees: 10000, questions: 240, answeredQuestions: 240, description: 'Marcus Chen 老师分享美联储 7 月议息会议前瞻及对加密资产的可能影响。', tags: ['宏观', '美联储', '利率'], language: '中文', rewards: { type: '积分', amount: 100, currency: 'ZS' }, replay: { views: 18420, likes: 1240, duration: 5400 } },
  { id: 'ama-004', title: 'Layer2 赛道下半场竞争格局', guest: '李思源', guestId: 'a-004', guestTitle: 'Chain Insight 高级研究员', topic: 'L2 研究', cover: '🔗', status: 'upcoming', startTime: '2026-07-25 19:00:00', endTime: '2026-07-25 20:30:00', platform: 'zoom', registered: 1240, attending: 0, maxAttendees: 3000, questions: 84, answeredQuestions: 0, description: '李思源老师将分享 L2 赛道下半场竞争格局，从 TVL / 用户 / 生态多维对比。', tags: ['Layer2', 'OP', 'ARB'], language: '中文', rewards: { type: '积分', amount: 150, currency: 'ZS' }, replay: undefined },
  { id: 'ama-005', title: 'DeFi 协议收入深度分析', guest: '苏明远', guestId: 'a-005', guestTitle: 'DefiLab 研究主管', topic: 'DeFi 分析', cover: '💰', status: 'ended', startTime: '2026-07-10 20:00:00', endTime: '2026-07-10 21:30:00', platform: 'discord', registered: 1840, attending: 0, maxAttendees: 3000, questions: 124, answeredQuestions: 124, description: '苏明远老师分享 Q2 DeFi 协议收入排行榜与趋势分析。', tags: ['DeFi', '协议收入', 'Q2'], language: '中文', rewards: { type: '积分', amount: 100, currency: 'ZS' }, replay: { views: 12400, likes: 840, duration: 4800 } },
];

const MACRO_REPORTS: MacroReport[] = [
  { id: 'm-001', title: '美联储 7 月议息会议前瞻：降息周期开启在即', theme: 'rate', region: '美国', author: 'Marcus Chen', authorId: 'a-003', cover: '🏛️', summary: '从 CME FedWatch 工具、点阵图、劳动力市场数据三个维度分析 7 月议息会议路径。', keyPoints: ['7 月按兵不动概率 84%', '9 月降息 25bp 概率 62%', '点阵图显示 2026 全年降息 50bp'], publishedAt: '2026-07-19 07:00:00', views: 36400, likes: 2148, readingTime: 14, tags: ['美联储', '利率', '7月'], impact: 'high', relatedAssets: ['BTC', 'ETH', 'GOLD'] },
  { id: 'm-002', title: '全球流动性观察：M2 同比 +4.2% 的资产影响', theme: 'liquidity', region: '全球', author: '陈昊天', authorId: 'a-001', cover: '💧', summary: '全球主要经济体 M2 同比变化与加密资产历史相关性研究。', keyPoints: ['M2 同比 +4.2% 较上月 +0.4pct', 'BTC 与全球 M2 12 个月滚动相关性 0.62', '流动性预期改善是中期最重要支撑'], publishedAt: '2026-07-18 10:00:00', views: 24800, likes: 1240, readingTime: 12, tags: ['流动性', 'M2', '宏观'], impact: 'medium', relatedAssets: ['BTC', 'ETH'] },
  { id: 'm-003', title: '中东地缘风险与原油 - 加密资产联动', theme: 'geopolitics', region: '中东', author: 'Marcus Chen', authorId: 'a-003', cover: '⚔️', summary: '中东地缘风险事件如何通过原油、避险情绪渠道影响加密资产。', keyPoints: ['原油与 BTC 短期负相关', '避险情绪利好 BTC 的"数字黄金"叙事', '地缘事件 24h 内影响最为显著'], publishedAt: '2026-07-17 16:00:00', views: 18400, likes: 840, readingTime: 10, tags: ['地缘', '原油', '避险'], impact: 'medium', relatedAssets: ['BTC', 'OIL'] },
  { id: 'm-004', title: '稳定币监管沙盒进展：香港 / 迪拜 / 新加坡三地对比', theme: 'regulation', region: '亚太 / 中东', author: '苏明远', authorId: 'a-005', cover: '⚖️', summary: '三大金融中心稳定币监管沙盒政策对比与影响分析。', keyPoints: ['香港 2025 已发牌 4 家', '迪拜 VARA 框架成熟', '新加坡监管较严'], publishedAt: '2026-07-15 14:00:00', views: 12400, likes: 640, readingTime: 16, tags: ['监管', '稳定币', '沙盒'], impact: 'high', relatedAssets: ['USDT', 'USDC'] },
  { id: 'm-005', title: '减半周期复盘与历史规律', theme: 'cycle', region: '全球', author: '陈昊天', authorId: 'a-001', cover: '🔄', summary: '三轮 BTC 减半周期价格表现与宏观环境对比研究。', keyPoints: ['减半后 12-18 个月为历史强势窗口', '本轮减半后 8 个月表现强于历史', '周期理论仅供参考'], publishedAt: '2026-07-12 11:00:00', views: 28400, likes: 1840, readingTime: 18, tags: ['周期', '减半', '历史'], impact: 'medium', relatedAssets: ['BTC'] },
];

const INDUSTRY_METRICS: IndustryMetric[] = [
  { id: 'im-001', metric: 'tvl', name: 'DeFi 总锁仓量 TVL', category: 'DeFi', current: 184000000000, change24h: 2.4, change7d: 8.4, change30d: 18.6, history: [], topMovers: [{ name: 'Aave', change: 8.4 }, { name: 'Lido', change: 4.2 }, { name: 'Maker', change: 2.4 }], description: '所有 DeFi 协议锁定的资产总价值', source: 'DefiLlama', unit: 'USD' },
  { id: 'im-002', metric: 'volume', name: 'CEX 24h 交易量', category: '交易', current: 84000000000, change24h: 4.8, change7d: 12.4, change30d: 24.6, history: [], topMovers: [{ name: 'BTC', change: 4.2 }, { name: 'ETH', change: 6.4 }, { name: 'SOL', change: 8.2 }], description: '中心化交易所 24 小时总成交额', source: 'CoinGecko', unit: 'USD' },
  { id: 'im-003', metric: 'users', name: '链上活跃用户', category: '用户', current: 12400000, change24h: -1.2, change7d: 4.8, change30d: 12.4, history: [], topMovers: [{ name: 'Base', change: 8.4 }, { name: 'Arbitrum', change: 4.2 }, { name: 'Polygon', change: 2.4 }], description: '当日活跃链上地址数（去重）', source: 'Artemis', unit: '地址数' },
  { id: 'im-004', metric: 'fees', name: 'DeFi 协议 24h 收入', category: 'DeFi', current: 24800000, change24h: 6.4, change7d: 18.4, change30d: 32.4, history: [], topMovers: [{ name: 'Uniswap', change: 12.4 }, { name: 'Aave', change: 8.4 }, { name: 'Lido', change: 4.2 }], description: 'DeFi 协议 24 小时总收入', source: 'Token Terminal', unit: 'USD' },
  { id: 'im-005', metric: 'marketcap', name: '数字资产总市值', category: '市值', current: 2840000000000, change24h: 2.4, change7d: 8.4, change30d: 18.4, history: [], topMovers: [{ name: 'BTC', change: 2.8 }, { name: 'ETH', change: 1.9 }, { name: 'SOL', change: 4.6 }], description: '全球数字资产总市值', source: 'CoinGecko', unit: 'USD' },
  { id: 'im-006', metric: 'stablecoin', name: '稳定币总市值', category: '稳定币', current: 168000000000, change24h: 0.6, change7d: 1.2, change30d: 2.4, history: [], topMovers: [{ name: 'USDT', change: 0.4 }, { name: 'USDC', change: 0.8 }, { name: 'DAI', change: -0.2 }], description: '主要稳定币市值合计', source: 'DefiLlama', unit: 'USD' },
  { id: 'im-007', metric: 'bridge', name: '跨链桥 24h 流量', category: '跨链', current: 8400000000, change24h: 12.4, change7d: 18.4, change30d: 24.6, history: [], topMovers: [{ name: 'Base', change: 24.6 }, { name: 'Arbitrum', change: 12.4 }, { name: 'Optimism', change: 8.4 }], description: '跨链桥 24 小时总流量', source: 'DefiLlama', unit: 'USD' },
  { id: 'im-008', metric: 'revenue', name: '矿工 / 验证者 24h 收入', category: '基础设施', current: 18400000, change24h: 4.2, change7d: 8.4, change30d: 12.4, history: [], topMovers: [{ name: 'BTC', change: 4.2 }, { name: 'ETH', change: 6.4 }], description: '矿工 / 验证者 24 小时总收入', source: 'Glassnode', unit: 'USD' },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-001', name: '每日行情研报', desc: '每日 8:00 推送行情速读与关键观点', category: 'market', frequency: 'daily', channels: ['app', 'email'], enabled: true, subscribers: 84200, price: 0, currency: '免费', isPremium: false },
  { id: 'sub-002', name: '周度深度复盘', desc: '每周日 20:00 推送一周行情复盘与下周展望', category: 'weekly', frequency: 'weekly', channels: ['app', 'email', 'telegram'], enabled: true, subscribers: 48400, price: 0, currency: '免费', isPremium: false },
  { id: 'sub-003', name: '项目深度研究', desc: '新项目发布后 3 个工作日内完成深度报告', category: 'project', frequency: 'realtime', channels: ['app', 'email'], enabled: true, subscribers: 18400, price: 99, currency: 'USDT/月', isPremium: true },
  { id: 'sub-004', name: '宏观策略周报', desc: '每周三推送全球宏观策略与跨资产联动', category: 'macro', frequency: 'weekly', channels: ['app', 'email'], enabled: true, subscribers: 12400, price: 0, currency: '免费', isPremium: false },
  { id: 'sub-005', name: 'DeFi 协议研究', desc: 'DeFi 协议 TVL、收入、风险监测', category: 'defi', frequency: 'weekly', channels: ['app', 'email', 'webhook'], enabled: false, subscribers: 8400, price: 49, currency: 'USDT/月', isPremium: true },
  { id: 'sub-006', name: '链上数据日报', desc: '每日链上数据要点与异动提示', category: 'onchain', frequency: 'daily', channels: ['app', 'email'], enabled: true, subscribers: 24000, price: 0, currency: '免费', isPremium: false },
  { id: 'sub-007', name: 'VIP 季度策略', desc: '季度策略与 VIP 研报订阅', category: 'premium', frequency: 'quarterly', channels: ['app', 'email'], enabled: false, subscribers: 1200, price: 1999, currency: 'USDT/季', isPremium: true },
  { id: 'sub-008', name: 'AMA 直播提醒', desc: '研究院 / 项目方 AMA 直播开播提醒', category: 'daily', frequency: 'realtime', channels: ['app', 'email', 'telegram', 'sms'], enabled: true, subscribers: 38400, price: 0, currency: '免费', isPremium: false },
];

// ============== 主组件 ==============

export function PortalResearch() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<ReportTier | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<'zh' | 'en' | 'both' | 'all'>('all');
  const [institutionTypeFilter, setInstitutionTypeFilter] = useState<InstitutionType | 'all'>('all');
  const [institutionTierFilter, setInstitutionTierFilter] = useState<InstitutionTier | 'all'>('all');
  const [macroThemeFilter, setMacroThemeFilter] = useState<MacroTheme | 'all'>('all');
  const [amaStatusFilter, setAmaStatusFilter] = useState<AmaStatus | 'all'>('all');
  const [metricCategoryFilter, setMetricCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(['r-001', 'r-003']));
  const [liked, setLiked] = useState<Set<string>>(new Set(['r-001', 'r-002', 'r-008']));
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [subscribeEnabled, setSubscribeEnabled] = useState<Set<string>>(new Set(['sub-001', 'sub-002', 'sub-004', 'sub-006', 'sub-008']));
  const [questionText, setQuestionText] = useState('');
  const [registerAmaId, setRegisterAmaId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalReports: 12840,
    totalInstitutions: 84,
    totalAnalysts: 320,
    totalSubscribers: 184000,
    totalReads: 24800000,
    totalAma: 480,
    totalMacro: 1240,
    totalMetrics: 28,
    todayPublished: 18,
    todayReads: 184000,
    todayLikes: 12400,
    premiumReports: 1240,
    hotIndex: 92,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        todayReads: prev.todayReads + Math.floor(Math.random() * 800 - 200),
        todayLikes: prev.todayLikes + Math.floor(Math.random() * 80 - 20),
        totalSubscribers: prev.totalSubscribers + Math.floor(Math.random() * 20 - 8),
        hotIndex: Math.max(0, Math.min(100, prev.hotIndex + (Math.random() - 0.5) * 4)),
      }));
    }, 4400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setDrawer({ open: false, type: null, payload: null });
        setHelpOpen(false);
        setRegisterAmaId(null);
      } else if (e.key >= '1' && e.key <= '9') {
        const map: Tab[] = ['overview', 'daily', 'deep', 'institution', 'macro', 'ama', 'subscription', 'industry', 'help'];
        const idx = parseInt(e.key, 10) - 1;
        if (map[idx]) setTab(map[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);

  const filteredReports = useMemo(() => {
    let r = REPORTS;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(q) || x.summary.toLowerCase().includes(q) || x.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (categoryFilter !== 'all') r = r.filter((x) => x.category === categoryFilter);
    if (tierFilter !== 'all') r = r.filter((x) => x.tier === tierFilter);
    if (languageFilter !== 'all') r = r.filter((x) => x.language === languageFilter || x.language === 'both');
    if (tab === 'daily') r = r.filter((x) => x.category === 'market' || x.category === 'weekly');
    if (tab === 'deep') r = r.filter((x) => x.category === 'research' || x.category === 'project' || x.category === 'quarterly' || x.tier === 'institutional');
    if (tab === 'industry') return r;
    const sorted = [...r];
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    else if (sortBy === 'hot') sorted.sort((a, b) => b.reads - a.reads);
    else if (sortBy === 'most_read') sorted.sort((a, b) => b.reads - a.reads);
    else if (sortBy === 'most_liked') sorted.sort((a, b) => b.likes - a.likes);
    else if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'duration') sorted.sort((a, b) => b.pages - a.pages);
    return sorted;
  }, [search, categoryFilter, tierFilter, languageFilter, tab, sortBy]);

  const filteredInstitutions = useMemo(() => {
    let r = INSTITUTIONS;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.focus.some((f) => f.toLowerCase().includes(q)));
    }
    if (institutionTypeFilter !== 'all') r = r.filter((x) => x.type === institutionTypeFilter);
    if (institutionTierFilter !== 'all') r = r.filter((x) => x.tier === institutionTierFilter);
    return r;
  }, [search, institutionTypeFilter, institutionTierFilter]);

  const filteredMacro = useMemo(() => {
    let r = MACRO_REPORTS;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(q) || x.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (macroThemeFilter !== 'all') r = r.filter((x) => x.theme === macroThemeFilter);
    return r;
  }, [search, macroThemeFilter]);

  const filteredAma = useMemo(() => {
    let r = AMA_SESSIONS;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(q) || x.guest.toLowerCase().includes(q));
    }
    if (amaStatusFilter !== 'all') r = r.filter((x) => x.status === amaStatusFilter);
    return r;
  }, [search, amaStatusFilter]);

  const filteredMetrics = useMemo(() => {
    let r = INDUSTRY_METRICS;
    if (metricCategoryFilter !== 'all') r = r.filter((x) => x.category === metricCategoryFilter);
    return r;
  }, [metricCategoryFilter]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSubscribe = useCallback((id: string) => {
    setSubscribeEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openDrawer = useCallback((type: DrawerType, payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const drawerReport = useMemo(() => drawer.type === 'report' && drawer.payload ? REPORTS.find((r) => r.id === drawer.payload) : null, [drawer]);
  const drawerInstitution = useMemo(() => drawer.type === 'institution' && drawer.payload ? INSTITUTIONS.find((i) => i.id === drawer.payload) : null, [drawer]);
  const drawerAma = useMemo(() => drawer.type === 'ama' && drawer.payload ? AMA_SESSIONS.find((a) => a.id === drawer.payload) : null, [drawer]);
  const drawerMacro = useMemo(() => drawer.type === 'macro' && drawer.payload ? MACRO_REPORTS.find((m) => m.id === drawer.payload) : null, [drawer]);
  const drawerMetric = useMemo(() => drawer.type === 'metric' && drawer.payload ? INDUSTRY_METRICS.find((m) => m.id === drawer.payload) : null, [drawer]);
  const drawerSubscribe = useMemo(() => drawer.type === 'subscribe' && drawer.payload ? SUBSCRIPTIONS.find((s) => s.id === drawer.payload) : null, [drawer]);

  const tabItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: '总览', icon: Gauge },
    { id: 'daily', label: '每日研报', icon: FileText },
    { id: 'deep', label: '深度分析', icon: BookOpen },
    { id: 'institution', label: '机构观点', icon: Building2 },
    { id: 'macro', label: '宏观研究', icon: Globe },
    { id: 'ama', label: 'AMA 课堂', icon: Video },
    { id: 'subscription', label: '研报订阅', icon: Bell },
    { id: 'industry', label: '行业数据', icon: BarChart3 },
    { id: 'help', label: '帮助', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style jsx>{`
        @keyframes prFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes prSlideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes prPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes prShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes prFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes prBar { from { width: 0; } }
        .pr-fade { animation: prFadeIn 0.45s ease-out both; }
        .pr-slide { animation: prSlideIn 0.35s ease-out both; }
        .pr-pulse { animation: prPulse 2.4s ease-in-out infinite; }
        .pr-float { animation: prFloat 3.6s ease-in-out infinite; }
        .pr-bar { animation: prBar 0.8s ease-out both; }
        .pr-shimmer { background: linear-gradient(90deg, transparent, ${BRAND.primary}20, transparent); background-size: 200% 100%; animation: prShimmer 2.4s linear infinite; }
      `}</style>

      {/* ============== Hero ============== */}
      <div className="px-6 md:px-10 pt-10 pb-6 pr-fade">
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: BRAND.textSub }}>
          <span>研究院</span>
          <ChevronRight size={12} />
          <span style={{ color: BRAND.primary }}>研报与内容研究</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: BRAND.text }}>
              研究院与研报中心
            </h1>
            <p className="text-sm md:text-base max-w-2xl" style={{ color: BRAND.textSub }}>
              12,840+ 篇深度研报 · 320+ 认证分析师 · 7 大主题研究 · AMA 课堂实时互动 · 形成
              <span style={{ color: BRAND.primary }}> "数据 - 研究 - 教育 - 讨论" </span>
              完整内容研究闭环
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHelpOpen(true)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
              <Keyboard size={12} /> 快捷键
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <BookMarked size={12} /> 订阅研报
            </button>
          </div>
        </div>
      </div>

      {/* ============== 实时 KPI ============== */}
      <div className="px-6 md:px-10 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: '研报总数', value: formatNumber(kpi.totalReports), sub: '+18 今日', icon: FileText, color: BRAND.primary },
            { label: '研究机构', value: formatNumber(kpi.totalInstitutions), sub: '7 大类型', icon: Building2, color: BRAND.info },
            { label: '认证分析师', value: formatNumber(kpi.totalAnalysts), sub: '高活跃', icon: Users, color: '#A855F7' },
            { label: '订阅用户', value: formatNumber(kpi.totalSubscribers), sub: '总订阅数', icon: Bell, color: '#FFB400' },
            { label: '总阅读量', value: formatNumber(kpi.totalReads), sub: '累计', icon: Eye, color: BRAND.primary },
            { label: '今日阅读', value: formatNumber(kpi.todayReads), sub: '实时', icon: TrendingUp, color: BRAND.success },
            { label: '今日点赞', value: formatNumber(kpi.todayLikes), sub: '实时', icon: Heart, color: '#EC4899' },
            { label: '热门指数', value: kpi.hotIndex.toFixed(1), sub: 'research heat', icon: Flame, color: '#FF5050' },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="p-3 rounded-lg pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px]" style={{ color: BRAND.textMute }}>{k.label}</span>
                  <Icon size={12} style={{ color: k.color }} />
                </div>
                <div className="text-lg font-bold" style={{ color: BRAND.text }}>{k.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: BRAND.textSub }}>{k.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============== Tab 切换 ============== */}
      <div className="px-6 md:px-10 mb-4 sticky top-0 z-30" style={{ backgroundColor: `${BRAND.bg}f0`, backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b" style={{ borderColor: BRAND.border }}>
          {tabItems.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-2 rounded-t-lg text-xs flex items-center gap-1.5 whitespace-nowrap" style={{ backgroundColor: tab === t.id ? BRAND.card : 'transparent', color: tab === t.id ? BRAND.primary : BRAND.textSub, borderBottom: tab === t.id ? `2px solid ${BRAND.primary}` : '2px solid transparent' }}>
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============== 工具栏 ============== */}
      {tab !== 'help' && tab !== 'overview' && (
        <div className="px-6 md:px-10 mb-4">
          <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textMute }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索研报、机构、主题、标签..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: BRAND.textMute }} /></button>}
            </div>
            {tab === 'daily' || tab === 'deep' ? (
              <>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部分类</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部等级</option>
                  {Object.entries(TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {Object.entries(SORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </>
            ) : tab === 'institution' ? (
              <>
                <select value={institutionTypeFilter} onChange={(e) => setInstitutionTypeFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部类型</option>
                  {Object.entries(INSTITUTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={institutionTierFilter} onChange={(e) => setInstitutionTierFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部等级</option>
                  {Object.entries(INSTITUTION_TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </>
            ) : tab === 'macro' ? (
              <select value={macroThemeFilter} onChange={(e) => setMacroThemeFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部主题</option>
                {Object.entries(MACRO_THEME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : tab === 'ama' ? (
              <select value={amaStatusFilter} onChange={(e) => setAmaStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {Object.entries(AMA_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : tab === 'industry' ? (
              <select value={metricCategoryFilter} onChange={(e) => setMetricCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部分类</option>
                <option>DeFi</option>
                <option>交易</option>
                <option>用户</option>
                <option>市值</option>
                <option>稳定币</option>
                <option>跨链</option>
                <option>基础设施</option>
              </select>
            ) : null}
          </div>
        </div>
      )}

      {/* ============== Tab Content ============== */}
      <div className="px-6 md:px-10 pb-20">
        {tab === 'overview' && (
          <div className="space-y-6 pr-fade">
            {/* 区块 1: 推荐 + 置顶 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {REPORTS.filter((r) => r.isPinned).slice(0, 3).map((r, i) => {
                const cat = reportCategoryBadge(r.category);
                const tier = reportTierBadge(r.tier);
                return (
                  <div key={r.id} onClick={() => openDrawer('report', r.id)} className="cursor-pointer p-5 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl pr-float" style={{ animationDelay: `${i * 200}ms` }}>{r.cover}</span>
                        <div>
                          <div className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}><Pin size={10} /> 置顶推荐</div>
                          <div className="text-xs font-medium" style={{ color: BRAND.text }}>{r.institution}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: tier.bg, color: tier.fg }}>{tier.label}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2 line-clamp-2" style={{ color: BRAND.text }}>{r.title}</h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{r.summary}</p>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                      <span>{r.author} · {formatDate(r.publishedAt)}</span>
                      <span className="flex items-center gap-2"><Eye size={10} />{formatNumber(r.reads)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 区块 2: 今日必读 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}><Flame size={16} style={{ color: '#FF5050' }} /> 今日热门</h3>
                  <button onClick={() => setTab('daily')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看全部 <ChevronRight size={12} /></button>
                </div>
                <div className="space-y-2">
                  {REPORTS.filter((r) => r.isHot).map((r, i) => {
                    const cat = reportCategoryBadge(r.category);
                    return (
                      <div key={r.id} onClick={() => openDrawer('report', r.id)} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer pr-fade" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                        <div className="text-2xl shrink-0">{r.cover}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium line-clamp-1" style={{ color: BRAND.text }}>{r.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                            <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: cat.bg, color: cat.fg }}>{cat.label}</span>
                            <span>{r.author}</span>
                            <span>·</span>
                            <span>{r.institution}</span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] shrink-0" style={{ color: BRAND.textSub }}>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(r.reads)}</span>
                            <span className="flex items-center gap-0.5"><Heart size={10} style={{ color: '#EC4899' }} />{formatNumber(r.likes)}</span>
                          </div>
                          <div className="mt-0.5">{formatDate(r.publishedAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 区块 3: 即将直播 AMA */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}><Video size={16} style={{ color: BRAND.info }} /> 即将 AMA</h3>
                  <button onClick={() => setTab('ama')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看 <ChevronRight size={12} /></button>
                </div>
                <div className="space-y-2">
                  {AMA_SESSIONS.filter((a) => a.status === 'upcoming').slice(0, 3).map((a, i) => {
                    const st = amaStatusBadge(a.status);
                    return (
                      <div key={a.id} onClick={() => openDrawer('ama', a.id)} className="p-3 rounded-lg cursor-pointer pr-fade" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 60}ms` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium line-clamp-1" style={{ color: BRAND.text }}>{a.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] shrink-0 ml-2" style={{ backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>嘉宾：{a.guest} · {a.guestTitle}</div>
                        <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: BRAND.primary }}><Clock size={10} />{formatDate(a.startTime)} {formatTime(a.startTime)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 区块 4: 行业数据看板 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INDUSTRY_METRICS.slice(0, 4).map((m, i) => (
                <div key={m.id} onClick={() => openDrawer('metric', m.id)} className="cursor-pointer p-4 rounded-lg pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>{m.name}</div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{formatPrice(m.current)}</div>
                  <div className="flex items-center gap-2 text-[10px] mt-1">
                    <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: changeBg(m.change24h), color: changeColor(m.change24h) }}>24h {m.change24h > 0 ? '+' : ''}{m.change24h.toFixed(2)}%</span>
                    <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: changeBg(m.change7d), color: changeColor(m.change7d) }}>7d {m.change7d > 0 ? '+' : ''}{m.change7d.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 区块 5: 活跃分析师 */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}><UserCheck size={16} style={{ color: BRAND.primary }} /> 推荐分析师</h3>
                <button onClick={() => setTab('institution')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看机构 <ChevronRight size={12} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ANALYSTS.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="p-3 rounded-lg pr-fade" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">{a.avatar}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate" style={{ color: BRAND.text }}>{a.name} {a.isVerified && <CheckCircle2 size={10} className="inline" style={{ color: BRAND.primary }} />}</div>
                        <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>{a.institution}</div>
                      </div>
                    </div>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>{a.title}</div>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                      <span className="flex items-center gap-0.5"><Star size={10} style={{ color: '#FFB400' }} />{a.rating}</span>
                      <span>·</span>
                      <span>{a.totalReports} 篇</span>
                      <span>·</span>
                      <span>{formatNumber(a.followers)} 粉</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 区块 6: 订阅状态 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}><Bell size={16} style={{ color: '#FFB400' }} /> 我的订阅</h3>
                <div className="space-y-2">
                  {SUBSCRIPTIONS.filter((s) => subscribeEnabled.has(s.id)).slice(0, 4).map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg pr-fade" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 40}ms` }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium" style={{ color: BRAND.text }}>{s.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.frequency} · {formatNumber(s.subscribers)} 订阅</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>已订阅</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.infoLt} 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}><Lightbulb size={16} style={{ color: BRAND.primary }} /> 研究院简介</h3>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                  中萨数字科技交易所研究院是平台内容研究基础设施，整合全球 84 家研究机构、320+ 认证分析师，
                  围绕"行情-项目-宏观-技术-DeFi-NFT-链上"7 大主题构建系统化研究体系。
                  与 P3.21 客户支持、P3.35 自选行情、P3.38 社区论坛共同形成"数据-研究-教育-讨论"内容研究闭环。
                </p>
                <div className="mt-3 text-[10px] px-2 py-1.5 rounded inline-block" style={{ backgroundColor: 'rgba(255,180,0,0.10)', color: '#FFB400' }}>
                  ⚠ 合规说明：研报内容仅为研究方向演示，不构成任何投资建议
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'daily' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredReports.length} 篇研报</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredReports.map((r, i) => {
                const cat = reportCategoryBadge(r.category);
                const tier = reportTierBadge(r.tier);
                return (
                  <div key={r.id} onClick={() => openDrawer('report', r.id)} className="cursor-pointer p-4 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-3xl pr-float" style={{ animationDelay: `${i * 80}ms` }}>{r.cover}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: cat.bg, color: cat.fg }}>{cat.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.fg }}>{tier.label}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5 line-clamp-2" style={{ color: BRAND.text }}>{r.title}</h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{r.summary}</p>
                    <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                      <span>{r.author} · {r.institution}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <span className="flex items-center gap-2" style={{ color: BRAND.textSub }}>
                        <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(r.reads)}</span>
                        <span className="flex items-center gap-0.5"><Heart size={10} />{formatNumber(r.likes)}</span>
                        <span>{r.pages}页</span>
                      </span>
                      <span>{formatDate(r.publishedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'deep' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredReports.length} 篇深度研报</div>
            <div className="space-y-3">
              {filteredReports.map((r, i) => {
                const cat = reportCategoryBadge(r.category);
                const tier = reportTierBadge(r.tier);
                return (
                  <div key={r.id} onClick={() => openDrawer('report', r.id)} className="cursor-pointer p-5 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 40}ms` }}>
                    <div className="flex gap-4">
                      <div className="text-5xl shrink-0 pr-float" style={{ animationDelay: `${i * 100}ms` }}>{r.cover}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: cat.bg, color: cat.fg }}>{cat.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.fg }}>{tier.label}</span>
                          {r.isHot && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,80,80,0.10)', color: '#FF5050' }}>🔥 热门</span>}
                          {r.hasAudio && <span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}><Volume2 size={10} />有声</span>}
                        </div>
                        <h3 className="text-base font-bold mb-2" style={{ color: BRAND.text }}>{r.title}</h3>
                        <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>{r.summary}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          {r.dataPoints.slice(0, 4).map((dp, j) => (
                            <div key={j} className="p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                              <div className="text-[10px]" style={{ color: BRAND.textMute }}>{dp.label}</div>
                              <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{dp.value}</div>
                              {dp.change !== undefined && (
                                <div className="text-[10px]" style={{ color: changeColor(dp.change) }}>{dp.change > 0 ? '+' : ''}{dp.change.toFixed(2)}%</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                          <span>{r.author} · {r.institution} · {formatDate(r.publishedAt)}</span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(r.reads)}</span>
                            <span className="flex items-center gap-0.5"><Heart size={10} />{formatNumber(r.likes)}</span>
                            <span className="flex items-center gap-0.5"><Bookmark size={10} />{formatNumber(r.bookmarks)}</span>
                            <span className="flex items-center gap-0.5"><Star size={10} style={{ color: '#FFB400' }} />{r.rating}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'institution' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredInstitutions.length} 家研究机构</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredInstitutions.map((inst, i) => (
                <div key={inst.id} onClick={() => openDrawer('institution', inst.id)} className="cursor-pointer p-4 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{inst.logo}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate" style={{ color: BRAND.text }}>{inst.name}</div>
                      <div className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}>
                        <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: INSTITUTION_TIER_COLORS[inst.tier] }}>{INSTITUTION_TIER_LABELS[inst.tier]}</span>
                        <span>{INSTITUTION_TYPE_LABELS[inst.type]}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: BRAND.primary }}>{inst.rating}</div>
                      <div className="text-[10px] flex items-center gap-0.5" style={{ color: '#FFB400' }}><Star size={10} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{inst.analysts}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>分析师</div>
                    </div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{inst.reportsCount}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>研报</div>
                    </div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(inst.subscribers)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>订阅</div>
                    </div>
                  </div>
                  <div className="text-[10px] mt-2.5 line-clamp-1" style={{ color: BRAND.textSub }}>关注：{inst.focus.join(' · ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'macro' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredMacro.length} 篇宏观研报</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMacro.map((m, i) => (
                <div key={m.id} onClick={() => openDrawer('macro', m.id)} className="cursor-pointer p-5 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl pr-float" style={{ animationDelay: `${i * 100}ms` }}>{m.cover}</div>
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded inline-block mb-1" style={{ backgroundColor: `${MACRO_THEME_COLORS[m.theme]}20`, color: MACRO_THEME_COLORS[m.theme] }}>{MACRO_THEME_LABELS[m.theme]}</span>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{m.region} · {formatDate(m.publishedAt)}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: m.impact === 'high' ? 'rgba(255,80,80,0.10)' : m.impact === 'medium' ? 'rgba(255,180,0,0.10)' : 'rgba(176,176,176,0.10)', color: m.impact === 'high' ? '#FF5050' : m.impact === 'medium' ? '#FFB400' : BRAND.textMute }}>{m.impact === 'high' ? '高影响' : m.impact === 'medium' ? '中影响' : '低影响'}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: BRAND.text }}>{m.title}</h3>
                  <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>{m.summary}</p>
                  <div className="space-y-1.5 mb-3">
                    {m.keyPoints.map((kp, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs" style={{ color: BRAND.text }}>
                        <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                        <span>{kp}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                    <span>{m.author}</span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(m.views)}</span>
                      <span className="flex items-center gap-0.5"><Heart size={10} />{formatNumber(m.likes)}</span>
                      <span>{m.readingTime} 分钟</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'ama' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredAma.length} 场 AMA</div>
            <div className="space-y-3">
              {filteredAma.map((a, i) => {
                const st = amaStatusBadge(a.status);
                return (
                  <div key={a.id} onClick={() => openDrawer('ama', a.id)} className="cursor-pointer p-5 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 50}ms` }}>
                    <div className="flex gap-4">
                      <div className="text-5xl shrink-0 pr-float" style={{ animationDelay: `${i * 100}ms` }}>{a.cover}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{a.platform.toUpperCase()}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{a.language}</span>
                        </div>
                        <h3 className="text-base font-bold mb-1.5" style={{ color: BRAND.text }}>{a.title}</h3>
                        <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>嘉宾：{a.guest} · {a.guestTitle}</div>
                        <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{a.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                          <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(a.registered)}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>已预约</div>
                          </div>
                          <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-sm font-semibold" style={{ color: a.status === 'live' ? BRAND.success : BRAND.text }}>{a.attending > 0 ? formatNumber(a.attending) : '-'}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>在线</div>
                          </div>
                          <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.answeredQuestions}/{a.questions}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>问答</div>
                          </div>
                          <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="text-sm font-semibold" style={{ color: '#FFB400' }}>+{a.rewards.amount}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.rewards.currency}</div>
                          </div>
                        </div>
                        <div className="text-[10px] mt-2" style={{ color: BRAND.primary }}><Clock size={10} className="inline mr-1" />{formatDate(a.startTime)} {formatTime(a.startTime)} - {formatTime(a.endTime)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'subscription' && (
          <div className="space-y-3 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {SUBSCRIPTIONS.length} 个订阅计划</div>
            {SUBSCRIPTIONS.map((s, i) => {
              const enabled = subscribeEnabled.has(s.id);
              return (
                <div key={s.id} className="p-4 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</h3>
                        {s.isPremium && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(168,85,247,0.10)', color: '#A855F7' }}>VIP</span>}
                        {enabled && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>已订阅</span>}
                      </div>
                      <p className="text-xs mb-2" style={{ color: BRAND.textSub }}>{s.desc}</p>
                      <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                        <span>频率：{s.frequency}</span>
                        <span>·</span>
                        <span>渠道：{s.channels.join(' / ')}</span>
                        <span>·</span>
                        <span>{formatNumber(s.subscribers)} 订阅</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-bold" style={{ color: s.price === 0 ? BRAND.success : BRAND.primary }}>{s.currency}</div>
                      <button onClick={() => toggleSubscribe(s.id)} className="text-[10px] px-2.5 py-1 rounded" style={{ backgroundColor: enabled ? BRAND.dangerLt : BRAND.primary, color: enabled ? BRAND.danger : '#000' }}>
                        {enabled ? '取消订阅' : '立即订阅'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'industry' && (
          <div className="space-y-4 pr-fade">
            <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>共 {filteredMetrics.length} 项行业关键指标</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredMetrics.map((m, i) => (
                <div key={m.id} onClick={() => openDrawer('metric', m.id)} className="cursor-pointer p-4 rounded-xl pr-fade" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{m.category}</span>
                    <span className="text-[10px]" style={{ color: BRAND.textMute }}>{m.source}</span>
                  </div>
                  <div className="text-xs mb-1" style={{ color: BRAND.textMute }}>{m.name}</div>
                  <div className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{formatPrice(m.current)}</div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <div className="text-[9px]" style={{ color: BRAND.textMute }}>24h</div>
                      <div className="text-[10px] font-medium" style={{ color: changeColor(m.change24h) }}>{m.change24h > 0 ? '+' : ''}{m.change24h.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px]" style={{ color: BRAND.textMute }}>7d</div>
                      <div className="text-[10px] font-medium" style={{ color: changeColor(m.change7d) }}>{m.change7d > 0 ? '+' : ''}{m.change7d.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px]" style={{ color: BRAND.textMute }}>30d</div>
                      <div className="text-[10px] font-medium" style={{ color: changeColor(m.change30d) }}>{m.change30d > 0 ? '+' : ''}{m.change30d.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-4 pr-fade max-w-3xl">
            <h2 className="text-2xl font-bold mb-4" style={{ color: BRAND.text }}>研究院与研报中心 - 使用帮助</h2>
            <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>快捷键</h3>
              <div className="space-y-1.5">
                {[
                  { k: '/', d: '聚焦搜索框' },
                  { k: '?', d: '打开/关闭本页帮助' },
                  { k: 'Esc', d: '关闭 Drawer / 弹窗' },
                  { k: '1-9', d: '快速切换 Tab' },
                ].map((it) => (
                  <div key={it.k} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.cardHover, color: BRAND.primary, minWidth: 60, textAlign: 'center', border: `1px solid ${BRAND.primary}40` }}>{it.k}</span>
                    <span className="text-xs" style={{ color: BRAND.text }}>{it.d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>功能说明</h3>
              <div className="text-xs space-y-1.5" style={{ color: BRAND.textSub }}>
                <p>· <strong>每日研报</strong>：每日发布的行情 / 周报 / 月报速读</p>
                <p>· <strong>深度分析</strong>：项目 / 季度 / 机构级深度研究报告</p>
                <p>· <strong>机构观点</strong>：84+ 研究机构及 320+ 认证分析师主页</p>
                <p>· <strong>宏观研究</strong>：7 大宏观主题研究（利率/通胀/地缘/监管/流动性/风险/周期）</p>
                <p>· <strong>AMA 课堂</strong>：研究员 / 项目方实时互动直播</p>
                <p>· <strong>研报订阅</strong>：8 类研报订阅计划管理</p>
                <p>· <strong>行业数据</strong>：8 大行业关键指标实时监控</p>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,180,0,0.05)', border: `1px solid #FFB40040` }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#FFB400' }}>⚠ 合规说明</h3>
              <p className="text-xs" style={{ color: BRAND.textSub }}>
                本研究院为"内容研究与教育研究方向"演示页面。所有研报、机构、分析师、AMA 直播均为模拟数据，
                研报内容仅供研究方向参考，不构成任何投资建议。订阅付费信息仅作 UI 演示。
                严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============== 研报详情 Drawer ============== */}
      {drawerReport && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-3xl h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <FileText size={16} style={{ color: BRAND.primary }} /> 研报详情
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-5xl">{drawerReport.cover}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: reportCategoryBadge(drawerReport.category).bg, color: reportCategoryBadge(drawerReport.category).fg }}>{reportCategoryBadge(drawerReport.category).label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: reportTierBadge(drawerReport.tier).bg, color: reportTierBadge(drawerReport.tier).fg }}>{reportTierBadge(drawerReport.tier).label}</span>
                {drawerReport.isHot && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,80,80,0.10)', color: '#FF5050' }}>🔥 热门</span>}
              </div>
              <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>{drawerReport.title}</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerReport.summary}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMute }}>
                <User size={12} />{drawerReport.author} · {drawerReport.authorTitle}
                <span>·</span>
                <Building2 size={12} />{drawerReport.institution}
                <span>·</span>
                <Calendar size={12} />{formatDate(drawerReport.publishedAt)}
                <span>·</span>
                <Clock size={12} />{drawerReport.readMinutes} 分钟 · {drawerReport.pages} 页
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {drawerReport.dataPoints.map((dp, j) => (
                  <div key={j} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{dp.label}</div>
                    <div className="text-lg font-bold" style={{ color: BRAND.text }}>{dp.value}</div>
                    {dp.change !== undefined && (
                      <div className="text-[10px]" style={{ color: changeColor(dp.change) }}>{dp.change > 0 ? '+' : ''}{dp.change.toFixed(2)}%</div>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>核心观点</h4>
                <div className="space-y-1.5">
                  {drawerReport.highlights.map((h, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-sm" style={{ color: BRAND.text }}>
                      <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
              {drawerReport.methodology && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h4 className="text-xs font-semibold mb-1" style={{ color: BRAND.textMute }}>研究方法</h4>
                  <p className="text-xs" style={{ color: BRAND.textSub }}>{drawerReport.methodology}</p>
                </div>
              )}
              {drawerReport.conclusion && (
                <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.infoLt} 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                  <h4 className="text-xs font-semibold mb-1" style={{ color: BRAND.primary }}>研究结论</h4>
                  <p className="text-sm" style={{ color: BRAND.text }}>{drawerReport.conclusion}</p>
                </div>
              )}
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,180,0,0.05)', border: `1px solid #FFB40040` }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: '#FFB400' }}>⚠ 免责声明</h4>
                <ul className="text-xs space-y-1" style={{ color: BRAND.textSub }}>
                  {drawerReport.disclaimers.map((d, j) => <li key={j}>· {d}</li>)}
                </ul>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => toggleLike(drawerReport.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: liked.has(drawerReport.id) ? 'rgba(236,72,153,0.10)' : BRAND.card, color: liked.has(drawerReport.id) ? '#EC4899' : BRAND.textSub, border: `1px solid ${liked.has(drawerReport.id) ? '#EC4899' : BRAND.border}` }}>
                  <Heart size={12} fill={liked.has(drawerReport.id) ? '#EC4899' : 'none'} /> 点赞 {formatNumber(drawerReport.likes + (liked.has(drawerReport.id) ? 1 : 0))}
                </button>
                <button onClick={() => toggleBookmark(drawerReport.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: bookmarked.has(drawerReport.id) ? 'rgba(20,184,129,0.10)' : BRAND.card, color: bookmarked.has(drawerReport.id) ? BRAND.primary : BRAND.textSub, border: `1px solid ${bookmarked.has(drawerReport.id) ? BRAND.primary : BRAND.border}` }}>
                  <Bookmark size={12} fill={bookmarked.has(drawerReport.id) ? BRAND.primary : 'none'} /> 收藏
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                  <Download size={12} /> 下载 PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                  <Share2 size={12} /> 分享
                </button>
                {drawerReport.hasAudio && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    <Headphones size={12} /> 收听音频
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== 机构详情 Drawer ============== */}
      {drawerInstitution && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Building2 size={16} style={{ color: BRAND.primary }} /> 机构详情
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-5xl">{drawerInstitution.logo}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>{drawerInstitution.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: INSTITUTION_TIER_COLORS[drawerInstitution.tier] }}>{INSTITUTION_TIER_LABELS[drawerInstitution.tier]}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{INSTITUTION_TYPE_LABELS[drawerInstitution.type]}</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#FFB400' }}><Star size={10} fill="#FFB400" />{drawerInstitution.rating}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerInstitution.bio}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: '分析师', value: drawerInstitution.analysts },
                  { label: '研报', value: drawerInstitution.reportsCount },
                  { label: '订阅', value: formatNumber(drawerInstitution.subscribers) },
                  { label: '粉丝', value: formatNumber(drawerInstitution.followers) },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-base font-bold" style={{ color: BRAND.primary }}>{s.value}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>核心优势</h4>
                <div className="space-y-1.5">
                  {drawerInstitution.highlights.map((h, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs" style={{ color: BRAND.text }}>
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>研究领域</h4>
                <div className="flex flex-wrap gap-1.5">
                  {drawerInstitution.focus.map((f, j) => (
                    <span key={j} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>近期成就</h4>
                <div className="space-y-1.5">
                  {drawerInstitution.achievements.map((a, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs" style={{ color: BRAND.text }}>
                      <Trophy size={12} className="mt-0.5 shrink-0" style={{ color: '#FFB400' }} />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>联系方式</div>
                <div className="text-xs mt-1" style={{ color: BRAND.text }}>{drawerInstitution.contact}</div>
                {drawerInstitution.social.twitter && <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>Twitter: {drawerInstitution.social.twitter}</div>}
                {drawerInstitution.social.website && <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>Website: {drawerInstitution.social.website}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== AMA 详情 Drawer ============== */}
      {drawerAma && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Video size={16} style={{ color: BRAND.info }} /> AMA 详情
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-5xl">{drawerAma.cover}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: amaStatusBadge(drawerAma.status).bg, color: amaStatusBadge(drawerAma.status).fg }}>{amaStatusBadge(drawerAma.status).label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{drawerAma.platform.toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>{drawerAma.title}</h2>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{drawerAma.guest}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>{drawerAma.guestTitle}</div>
              </div>
              <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerAma.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                {[
                  { label: '已预约', value: formatNumber(drawerAma.registered) },
                  { label: '在线', value: drawerAma.attending > 0 ? formatNumber(drawerAma.attending) : '-' },
                  { label: '问答', value: `${drawerAma.answeredQuestions}/${drawerAma.questions}` },
                  { label: '奖励', value: `+${drawerAma.rewards.amount} ${drawerAma.rewards.currency}` },
                ].map((s) => (
                  <div key={s.label} className="p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>{s.value}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>直播时间</div>
                <div className="text-sm" style={{ color: BRAND.text }}>{formatDate(drawerAma.startTime)} {formatTime(drawerAma.startTime)} - {formatTime(drawerAma.endTime)}</div>
              </div>
              {drawerAma.status === 'upcoming' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>提交你的问题</h4>
                    <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="在此提交你想问嘉宾的问题..." className="w-full bg-transparent outline-none text-xs p-2 rounded" style={{ color: BRAND.text, border: `1px solid ${BRAND.border}`, minHeight: 80 }} />
                    <button onClick={() => { setQuestionText(''); }} className="mt-2 text-xs px-3 py-1 rounded" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交问题</button>
                  </div>
                </div>
              )}
              {drawerAma.status === 'live' && (
                <button className="w-full py-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#FF5050', color: '#fff' }}>
                  🔴 进入直播间
                </button>
              )}
              {drawerAma.status === 'replay' && drawerAma.replay && (
                <button className="w-full py-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                  <Play size={14} className="inline mr-1" /> 观看回放 · {Math.round(drawerAma.replay.duration / 60)} 分钟
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 宏观研报 Drawer ============== */}
      {drawerMacro && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Globe size={16} style={{ color: '#FFB400' }} /> 宏观研报
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-5xl">{drawerMacro.cover}</div>
              <span className="text-[10px] px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${MACRO_THEME_COLORS[drawerMacro.theme]}20`, color: MACRO_THEME_COLORS[drawerMacro.theme] }}>{MACRO_THEME_LABELS[drawerMacro.theme]}</span>
              <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>{drawerMacro.title}</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerMacro.summary}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMute }}>
                <span>{drawerMacro.author}</span>
                <span>·</span>
                <span>{drawerMacro.region}</span>
                <span>·</span>
                <span>{formatDate(drawerMacro.publishedAt)}</span>
                <span>·</span>
                <span>{drawerMacro.readingTime} 分钟</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>核心观点</h4>
                <div className="space-y-1.5">
                  {drawerMacro.keyPoints.map((kp, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-sm" style={{ color: BRAND.text }}>
                      <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: '#FFB400' }} />
                      <span>{kp}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>关联资产</h4>
                <div className="flex flex-wrap gap-1.5">
                  {drawerMacro.relatedAssets.map((a, j) => (
                    <span key={j} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>主题标签</h4>
                <div className="flex flex-wrap gap-1.5">
                  {drawerMacro.tags.map((t, j) => (
                    <span key={j} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>#{t}</span>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,180,0,0.05)', border: `1px solid #FFB40040` }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: '#FFB400' }}>⚠ 免责声明</h4>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  宏观研报内容仅为研究方向演示，不构成任何投资建议。宏观环境复杂多变，请独立判断并严控风险。
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => toggleLike(drawerMacro.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: liked.has(drawerMacro.id) ? 'rgba(236,72,153,0.10)' : BRAND.card, color: liked.has(drawerMacro.id) ? '#EC4899' : BRAND.textSub, border: `1px solid ${liked.has(drawerMacro.id) ? '#EC4899' : BRAND.border}` }}>
                  <Heart size={12} fill={liked.has(drawerMacro.id) ? '#EC4899' : 'none'} /> 点赞 {formatNumber(drawerMacro.likes + (liked.has(drawerMacro.id) ? 1 : 0))}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                  <Download size={12} /> 下载 PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                  <Share2 size={12} /> 分享
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== 行业指标 Drawer ============== */}
      {drawerMetric && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <BarChart3 size={16} style={{ color: BRAND.primary }} /> 行业指标
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <span className="text-[10px] px-2 py-0.5 rounded inline-block" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{drawerMetric.category}</span>
              <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>{drawerMetric.name}</h2>
              <div className="text-3xl font-bold" style={{ color: BRAND.primary }}>{formatPrice(drawerMetric.current)}</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>数据源：{drawerMetric.source}</div>
              <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerMetric.description}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '24h 变化', value: drawerMetric.change24h },
                  { label: '7d 变化', value: drawerMetric.change7d },
                  { label: '30d 变化', value: drawerMetric.change30d },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-base font-bold" style={{ color: changeColor(s.value) }}>{s.value > 0 ? '+' : ''}{s.value.toFixed(2)}%</div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>Top Movers</h4>
                <div className="space-y-1.5">
                  {drawerMetric.topMovers.map((mv, j) => (
                    <div key={j} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <span className="text-xs" style={{ color: BRAND.text }}>{mv.name}</span>
                      <span className="text-xs font-semibold" style={{ color: changeColor(mv.change) }}>{mv.change > 0 ? '+' : ''}{mv.change.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,180,0,0.05)', border: `1px solid #FFB40040` }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: '#FFB400' }}>⚠ 数据说明</h4>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  行业指标数据来自第三方数据源（{drawerMetric.source}），仅作行业研究参考，不构成任何投资建议。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============== 帮助 Drawer ============== */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto pr-slide" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <HelpCircle size={16} style={{ color: BRAND.primary }} /> 快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { k: '/', d: '聚焦搜索框' },
                { k: '?', d: '打开/关闭本页帮助' },
                { k: 'Esc', d: '关闭 Drawer / 弹窗' },
                { k: '1-9', d: '快速切换 Tab' },
              ].map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-2.5 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.cardHover, color: BRAND.primary, minWidth: 60, textAlign: 'center', border: `1px solid ${BRAND.primary}40` }}>{it.k}</span>
                  <span className="text-xs" style={{ color: BRAND.text }}>{it.d}</span>
                </div>
              ))}
              <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: 'rgba(255,180,0,0.05)', border: `1px solid #FFB40040` }}>
                <h4 className="text-xs font-semibold mb-1" style={{ color: '#FFB400' }}>⚠ 合规说明</h4>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  研报内容仅为研究方向演示，不构成任何投资建议。数字资产波动剧烈，请独立判断并严控风险。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

