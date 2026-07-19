'use client';

/**
 * PortalGrowth - 用户成长中心 (2026-07-19 Q05 P3.34)
 *
 * 页面定位：
 * - 中萨数字科技交易所 用户成长中心
 * - 总览 / 等级体系 / 积分中心 / 任务中心 / 推荐奖励 / 等级权益 / 活动中心 / 历史记录 / 帮助
 * - 与 P3.20 KYC + P3.24 生态合作 + P3.33 钱包服务中心形成"用户-资产-成长-激励"成长闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 等级体系 / 积分中心 / 任务中心 / 推荐奖励 / 等级权益 / 活动中心 / 历史记录 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有积分/等级/奖励/任务/活动数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"用户成长激励与会员权益体系研究方向"定性
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
  Trophy,
  Award,
  Crown,
  Star,
  Gem,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy as CopyIcon,
  ExternalLink,
  Download,
  Upload,
  Share2,
  Link2,
  QrCode,
  Gift,
  Coins,
  CircleDollarSign,
  CreditCard,
  Banknote,
  Wallet,
  Users,
  UserPlus,
  UserCheck,
  User,
  Users2,
  Heart,
  Handshake,
  Bell,
  BellOff,
  Mail,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Calendar,
  Clock,
  Tag,
  Tags,
  Layers,
  Box,
  Boxes,
  Hexagon,
  Diamond,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Gauge,
  Target,
  Compass,
  MapPin,
  Globe2,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Phone,
  MessageCircle,
  MessageSquare,
  Send,
  Settings,
  Sliders,
  Zap,
  Rocket,
  Flame,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Hash,
  FileText,
  Database,
  Server,
  Network,
  Cpu,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'level' | 'points' | 'mission' | 'referral' | 'benefit' | 'activity' | 'history' | 'help';
type VipTier = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';
type MissionType = 'daily' | 'weekly' | 'monthly' | 'achievement' | 'newbie' | 'special';
type MissionStatus = 'todo' | 'in_progress' | 'claimable' | 'claimed' | 'expired';
type PointType = 'trade' | 'stake' | 'hold' | 'learn' | 'refer' | 'social' | 'airdrop' | 'redeem';
type PointFlow = 'earn' | 'consume' | 'expire' | 'adjust' | 'reward';
type ActivityStatus = 'live' | 'upcoming' | 'ended' | 'sold_out';
type BenefitCategory = 'fee' | 'service' | 'event' | 'airdrop' | 'badge' | 'access' | 'support';

interface LevelTier {
  id: VipTier;
  name: string;
  minVolume: number;
  minHold: number;
  perks: number;
  feeDiscount: number;
  color: string;
}

interface KpiSnapshot {
  currentTier: VipTier;
  nextTier: VipTier;
  currentVolume: number;
  nextVolume: number;
  totalPoints: number;
  availablePoints: number;
  lockedPoints: number;
  expiringPoints: number;
  totalRewards: number;
  totalReferrals: number;
  activeReferrals: number;
  referralRewards: number;
  levelProgress: number;
  globalRank: number;
  totalUsers: number;
  vipScore: number;
  zsdPrice: number;
}

interface Mission {
  id: string;
  title: string;
  desc: string;
  type: MissionType;
  status: MissionStatus;
  reward: number;
  exp: number;
  progress: number;
  total: number;
  deadline: string;
  category: string;
}

interface PointRecord {
  id: string;
  type: PointType;
  flow: PointFlow;
  amount: number;
  desc: string;
  time: string;
  expiring?: boolean;
}

interface ReferralRecord {
  id: string;
  referee: string;
  registerTime: string;
  tier: VipTier;
  volume30d: number;
  rewards: number;
  status: 'active' | 'pending' | 'expired';
}

interface Benefit {
  id: string;
  name: string;
  desc: string;
  category: BenefitCategory;
  tier: VipTier;
  icon: string;
  value: string;
}

interface Activity {
  id: string;
  title: string;
  desc: string;
  status: ActivityStatus;
  start: string;
  end: string;
  participants: number;
  reward: number;
  category: string;
}

interface HistoryItem {
  id: string;
  type: 'level_up' | 'points' | 'reward' | 'redeem' | 'referral' | 'mission' | 'activity';
  title: string;
  desc: string;
  amount?: number;
  time: string;
  status?: string;
}

interface DrawerState {
  open: boolean;
  type: 'mission' | 'points' | 'referral' | 'benefit' | 'activity' | 'history' | 'redeem' | 'help' | null;
  payload: string | null;
}

// ============== 常量 ==============

const TIER_LABELS: Record<VipTier, string> = {
  v1: 'V1 新手',
  v2: 'V2 学徒',
  v3: 'V3 探索',
  v4: 'V4 行家',
  v5: 'V5 专家',
  v6: 'V6 大师',
  v7: 'V7 宗师',
  v8: 'V8 传奇',
};

const TIER_COLORS: Record<VipTier, string> = {
  v1: '#B0B0B0',
  v2: '#44dbf4',
  v3: '#14B881',
  v4: '#FFA940',
  v5: '#FF6B6B',
  v6: '#A855F7',
  v7: '#F472B6',
  v8: '#FFD700',
};

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  daily: '日常',
  weekly: '周常',
  monthly: '月常',
  achievement: '成就',
  newbie: '新手',
  special: '限时',
};

const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  todo: '待开始',
  in_progress: '进行中',
  claimable: '可领取',
  claimed: '已领取',
  expired: '已过期',
};

const POINT_TYPE_LABELS: Record<PointType, string> = {
  trade: '交易奖励',
  stake: '质押奖励',
  hold: '持仓奖励',
  learn: '学习奖励',
  refer: '推荐奖励',
  social: '社交奖励',
  airdrop: '空投奖励',
  redeem: '积分兑换',
};

const POINT_FLOW_LABELS: Record<PointFlow, string> = {
  earn: '获取',
  consume: '消耗',
  expire: '过期',
  adjust: '调整',
  reward: '奖励',
};

const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  live: '进行中',
  upcoming: '即将开始',
  ended: '已结束',
  sold_out: '已满员',
};

const BENEFIT_CATEGORY_LABELS: Record<BenefitCategory, string> = {
  fee: '费率优惠',
  service: '专属服务',
  event: '活动特权',
  airdrop: '空投加成',
  badge: '身份标识',
  access: '优先通道',
  support: '专属客服',
};

// ============== 工具函数 ==============

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n.toFixed(0)}`;
}

function changeColor(c: number): string {
  return c >= 0 ? BRAND.success : BRAND.danger;
}

function timeAgo(time: string): string {
  return time;
}

// ============== Mock 数据 ==============

const TIERS: LevelTier[] = [
  { id: 'v1', name: 'V1 新手', minVolume: 0, minHold: 0, perks: 4, feeDiscount: 0, color: TIER_COLORS.v1 },
  { id: 'v2', name: 'V2 学徒', minVolume: 10000, minHold: 5000, perks: 6, feeDiscount: 5, color: TIER_COLORS.v2 },
  { id: 'v3', name: 'V3 探索', minVolume: 50000, minHold: 20000, perks: 8, feeDiscount: 10, color: TIER_COLORS.v3 },
  { id: 'v4', name: 'V4 行家', minVolume: 200000, minHold: 100000, perks: 10, feeDiscount: 15, color: TIER_COLORS.v4 },
  { id: 'v5', name: 'V5 专家', minVolume: 1000000, minHold: 500000, perks: 12, feeDiscount: 20, color: TIER_COLORS.v5 },
  { id: 'v6', name: 'V6 大师', minVolume: 5000000, minHold: 2000000, perks: 14, feeDiscount: 25, color: TIER_COLORS.v6 },
  { id: 'v7', name: 'V7 宗师', minVolume: 20000000, minHold: 10000000, perks: 16, feeDiscount: 30, color: TIER_COLORS.v7 },
  { id: 'v8', name: 'V8 传奇', minVolume: 100000000, minHold: 50000000, perks: 20, feeDiscount: 40, color: TIER_COLORS.v8 },
];

const MISSIONS: Mission[] = [
  { id: 'm-001', title: '完成首笔现货交易', desc: '在现货市场完成任意 1 笔交易', type: 'newbie', status: 'claimed', reward: 100, exp: 50, progress: 1, total: 1, deadline: '2026-12-31', category: '新手指引' },
  { id: 'm-002', title: '完成实名认证', desc: '通过 KYC 初级实名认证', type: 'newbie', status: 'claimed', reward: 200, exp: 100, progress: 1, total: 1, deadline: '2026-12-31', category: '新手指引' },
  { id: 'm-003', title: '每日签到', desc: '每日登录签到获取积分', type: 'daily', status: 'claimable', reward: 5, exp: 2, progress: 1, total: 1, deadline: '2026-07-20', category: '日常' },
  { id: 'm-004', title: '今日交易额 ≥ $1,000', desc: '当日累计交易额达到 $1,000', type: 'daily', status: 'in_progress', reward: 20, exp: 10, progress: 720, total: 1000, deadline: '2026-07-19', category: '日常' },
  { id: 'm-005', title: '本周交易 ≥ 5 笔', desc: '本周完成至少 5 笔交易', type: 'weekly', status: 'in_progress', reward: 100, exp: 50, progress: 3, total: 5, deadline: '2026-07-26', category: '周常' },
  { id: 'm-006', title: '本周交易额 ≥ $50,000', desc: '本周累计交易额达到 $50,000', type: 'weekly', status: 'todo', reward: 500, exp: 250, progress: 0, total: 50000, deadline: '2026-07-26', category: '周常' },
  { id: 'm-007', title: '本月邀请 ≥ 3 位好友', desc: '成功邀请 3 位好友完成实名认证', type: 'monthly', status: 'in_progress', reward: 1000, exp: 500, progress: 1, total: 3, deadline: '2026-07-31', category: '月常' },
  { id: 'm-008', title: '持仓 ≥ 30 天', desc: '任意资产连续持仓 30 天', type: 'achievement', status: 'claimed', reward: 500, exp: 200, progress: 30, total: 30, deadline: '永久', category: '成就' },
  { id: 'm-009', title: '交易高手：累计 ≥ 100 笔', desc: '历史累计完成 100 笔交易', type: 'achievement', status: 'in_progress', reward: 2000, exp: 1000, progress: 84, total: 100, deadline: '永久', category: '成就' },
  { id: 'm-010', title: 'DeFi 探索者：完成首笔流动性挖矿', desc: '在 DeFi 中心完成任意 1 笔流动性提供', type: 'achievement', status: 'todo', reward: 300, exp: 150, progress: 0, total: 1, deadline: '永久', category: '成就' },
  { id: 'm-011', title: 'NFT 收藏家：购买首件数字藏品', desc: '在 NFT 中心购买任意 1 件数字藏品', type: 'achievement', status: 'todo', reward: 300, exp: 150, progress: 0, total: 1, deadline: '永久', category: '成就' },
  { id: 'm-012', title: '夏季交易节：交易额 ≥ $100,000', desc: '夏季活动期间累计交易额达到 $100,000', type: 'special', status: 'in_progress', reward: 5000, exp: 2500, progress: 42800, total: 100000, deadline: '2026-08-31', category: '限时' },
];

const POINT_RECORDS: PointRecord[] = [
  { id: 'p-001', type: 'trade', flow: 'earn', amount: 120, desc: '现货交易返佣 · BTC/USDT', time: '2 分钟前' },
  { id: 'p-002', type: 'stake', flow: 'earn', amount: 48, desc: '质押奖励 · ETH 2.0', time: '15 分钟前' },
  { id: 'p-003', type: 'learn', flow: 'earn', amount: 20, desc: '完成《DeFi 入门》课程', time: '1 小时前' },
  { id: 'p-004', type: 'refer', flow: 'earn', amount: 500, desc: '邀请好友 user****82 完成 KYC', time: '3 小时前' },
  { id: 'p-005', type: 'redeem', flow: 'consume', amount: -200, desc: '兑换「专属客服 30 天」权益', time: '5 小时前' },
  { id: 'p-006', type: 'trade', flow: 'earn', amount: 84, desc: '合约交易返佣 · ETH/USDT', time: '8 小时前' },
  { id: 'p-007', type: 'airdrop', flow: 'reward', amount: 1000, desc: '新币 ZSD 空投奖励', time: '12 小时前' },
  { id: 'p-008', type: 'hold', flow: 'earn', amount: 36, desc: '持仓奖励 · SOL 持仓 7 天', time: '昨天 18:30' },
  { id: 'p-009', type: 'social', flow: 'earn', amount: 10, desc: '分享至 Twitter', time: '昨天 15:42' },
  { id: 'p-010', type: 'trade', flow: 'earn', amount: 220, desc: 'DeFi 流动性挖矿 · USDC/ZSD', time: '昨天 09:15', expiring: true },
  { id: 'p-011', type: 'redeem', flow: 'consume', amount: -100, desc: '兑换「交易手续费 9 折券」', time: '2 天前' },
  { id: 'p-012', type: 'expire', flow: 'expire', amount: -50, desc: '历史活动积分过期', time: '3 天前' },
];

const REFERRALS: ReferralRecord[] = [
  { id: 'r-001', referee: 'user****82', registerTime: '2026-07-15', tier: 'v3', volume30d: 84000, rewards: 1200, status: 'active' },
  { id: 'r-002', referee: 'user****46', registerTime: '2026-07-12', tier: 'v2', volume30d: 12400, rewards: 480, status: 'active' },
  { id: 'r-003', referee: 'user****71', registerTime: '2026-07-08', tier: 'v4', volume30d: 248000, rewards: 2800, status: 'active' },
  { id: 'r-004', referee: 'user****29', registerTime: '2026-07-05', tier: 'v2', volume30d: 6800, rewards: 200, status: 'pending' },
  { id: 'r-005', referee: 'user****55', registerTime: '2026-07-02', tier: 'v5', volume30d: 1840000, rewards: 4200, status: 'active' },
  { id: 'r-006', referee: 'user****18', registerTime: '2026-06-28', tier: 'v3', volume30d: 92000, rewards: 1480, status: 'active' },
  { id: 'r-007', referee: 'user****63', registerTime: '2026-06-24', tier: 'v2', volume30d: 2400, rewards: 80, status: 'expired' },
  { id: 'r-008', referee: 'user****91', registerTime: '2026-06-20', tier: 'v4', volume30d: 184200, rewards: 2200, status: 'active' },
];

const BENEFITS: Benefit[] = [
  { id: 'b-001', name: '现货手续费折扣', desc: '现货交易手续费 9 折（VIP4+）', category: 'fee', tier: 'v4', icon: 'Coins', value: '9 折' },
  { id: 'b-002', name: '合约手续费折扣', desc: '合约交易手续费 8.5 折（VIP5+）', category: 'fee', tier: 'v5', icon: 'BarChart3', value: '8.5 折' },
  { id: 'b-003', name: '提现免手续费', desc: '每月 3 笔提现免手续费（VIP3+）', category: 'fee', tier: 'v3', icon: 'Wallet', value: '3 笔/月' },
  { id: 'b-004', name: '专属客户经理', desc: '1V1 专属客户经理（VIP6+）', category: 'service', tier: 'v6', icon: 'UserCheck', value: '1V1' },
  { id: 'b-005', name: '线下 VIP 活动', desc: '受邀参加行业峰会与闭门会（VIP7+）', category: 'event', tier: 'v7', icon: 'Crown', value: 'VIP 邀请' },
  { id: 'b-006', name: '新币空投加成', desc: '新币空投权重 ×1.5（VIP5+）', category: 'airdrop', tier: 'v5', icon: 'Gift', value: '×1.5' },
  { id: 'b-007', name: '专属身份标识', desc: '昵称/头像框/聊天气泡（VIP3+）', category: 'badge', tier: 'v3', icon: 'Star', value: '专属' },
  { id: 'b-008', name: 'Launch 项目优先购', desc: 'Launch 新项目优先购买额度（VIP4+）', category: 'access', tier: 'v4', icon: 'Rocket', value: '优先购' },
  { id: 'b-009', name: '7×24 客服优先', desc: '专属客服 30 天快速响应（VIP3+）', category: 'support', tier: 'v3', icon: 'MessageCircle', value: '优先' },
  { id: 'b-010', name: '研究分析报告', desc: '每日 1 份机构级研究报告（VIP5+）', category: 'service', tier: 'v5', icon: 'FileText', value: '每日 1 份' },
  { id: 'b-011', name: 'API 费率折扣', desc: 'API 交易费率 7 折（VIP6+）', category: 'fee', tier: 'v6', icon: 'Zap', value: '7 折' },
  { id: 'b-012', name: '生日礼包', desc: '生日月发放价值 $100 积分礼包（VIP2+）', category: 'gift', tier: 'v2', icon: 'Heart', value: '$100' },
];

const ACTIVITIES: Activity[] = [
  { id: 'a-001', title: '夏季交易节', desc: '夏季累计交易额满 $100,000 奖 5,000 积分', status: 'live', start: '2026-07-01', end: '2026-08-31', participants: 18420, reward: 5000, category: '季节活动' },
  { id: 'a-002', title: '新币 ZSD 首发空投', desc: '持仓 ≥ 100 USDT 即可参与新币 ZSD 空投', status: 'live', start: '2026-07-15', end: '2026-07-22', participants: 28420, reward: 100, category: '空投' },
  { id: 'a-003', title: '邀请好友双重奖', desc: '邀请 1 位好友，双方各得 200 积分', status: 'live', start: '2026-07-10', end: '2026-07-31', participants: 8420, reward: 200, category: '推荐' },
  { id: 'a-004', title: 'DeFi 学习营', desc: '完成 5 节 DeFi 课程得 1,000 积分 + NFT 证书', status: 'live', start: '2026-07-05', end: '2026-07-30', participants: 6240, reward: 1000, category: '学习' },
  { id: 'a-005', title: 'VIP 专享：私享会', desc: 'VIP6+ 用户专享行业闭门会（线上）', status: 'upcoming', start: '2026-07-25', end: '2026-07-25', participants: 0, reward: 0, category: 'VIP 专享' },
  { id: 'a-006', title: '七夕情人节活动', desc: '情侣/朋友组队交易，瓜分 10 万积分奖池', status: 'upcoming', start: '2026-08-10', end: '2026-08-25', participants: 0, reward: 100000, category: '节日' },
  { id: 'a-007', title: '夏季交易节（上届）', desc: '2026 春季交易节（已结束）', status: 'ended', start: '2026-05-01', end: '2026-06-30', participants: 28420, reward: 5000, category: '季节活动' },
  { id: 'a-008', title: 'NFT 数字藏品首发', desc: '夏季主题数字藏品首发（限 1,000 名）', status: 'sold_out', start: '2026-07-12', end: '2026-07-14', participants: 1000, reward: 500, category: 'NFT' },
];

const HISTORIES: HistoryItem[] = [
  { id: 'h-001', type: 'level_up', title: '升级至 V4 行家', desc: '交易额累计达到 $200,000 阈值', amount: 0, time: '3 天前', status: '已生效' },
  { id: 'h-002', type: 'points', title: '获取 1,000 积分', desc: '新币 ZSD 空投奖励', amount: 1000, time: '12 小时前', status: '已到账' },
  { id: 'h-003', type: 'reward', title: '领取周常任务奖励', desc: '本周交易 ≥ 5 笔（已完成 3/5）', amount: 100, time: '昨天 09:30', status: '已领取' },
  { id: 'h-004', type: 'redeem', title: '兑换手续费券', desc: '200 积分 → 现货 9 折券', amount: -200, time: '2 天前', status: '已使用' },
  { id: 'h-005', type: 'referral', title: '邀请好友奖励', desc: 'user****71 完成 KYC 并交易', amount: 500, time: '3 天前', status: '已发放' },
  { id: 'h-006', type: 'mission', title: '完成日常任务', desc: '每日签到', amount: 5, time: '今天 08:15', status: '已完成' },
  { id: 'h-007', type: 'activity', title: '参加夏季交易节', desc: '已报名，累计交易额 $42,800', amount: 0, time: '5 天前', status: '进行中' },
  { id: 'h-008', type: 'level_up', title: '升级至 V3 探索', desc: '交易额累计达到 $50,000 阈值', amount: 0, time: '2026-06-12', status: '已生效' },
];

// ============== 主组件 ==============

export function PortalGrowth() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [missionTypeFilter, setMissionTypeFilter] = useState<MissionType | 'all'>('all');
  const [missionStatusFilter, setMissionStatusFilter] = useState<MissionStatus | 'all'>('all');
  const [pointTypeFilter, setPointTypeFilter] = useState<PointType | 'all'>('all');
  const [pointFlowFilter, setPointFlowFilter] = useState<PointFlow | 'all'>('all');
  const [referralStatusFilter, setReferralStatusFilter] = useState<'active' | 'pending' | 'expired' | 'all'>('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState<ActivityStatus | 'all'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<HistoryItem['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'reward' | 'exp' | 'progress' | 'updated'>('reward');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    currentTier: 'v4',
    nextTier: 'v5',
    currentVolume: 248000,
    nextVolume: 1000000,
    totalPoints: 12480,
    availablePoints: 8240,
    lockedPoints: 4240,
    expiringPoints: 320,
    totalRewards: 18420,
    totalReferrals: 8,
    activeReferrals: 6,
    referralRewards: 12640,
    levelProgress: 24.8,
    globalRank: 18420,
    totalUsers: 1248000,
    vipScore: 4280,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalPoints: prev.totalPoints + Math.floor(Math.random() * 8 - 2),
        availablePoints: prev.availablePoints + Math.floor(Math.random() * 6 - 2),
        currentVolume: prev.currentVolume + Math.floor(Math.random() * 400 - 100),
        levelProgress: Math.min(99, Math.max(0, prev.levelProgress + (Math.random() - 0.4) * 0.1)),
        vipScore: prev.vipScore + Math.floor(Math.random() * 4 - 1),
        totalReferrals: prev.totalReferrals + (Math.random() < 0.05 ? 1 : 0),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const filteredMissions = useMemo(() => {
    let result = MISSIONS.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (!m.title.toLowerCase().includes(q) && !m.desc.toLowerCase().includes(q)) return false;
      }
      if (missionTypeFilter !== 'all' && m.type !== missionTypeFilter) return false;
      if (missionStatusFilter !== 'all' && m.status !== missionStatusFilter) return false;
      return true;
    });
    result = result.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortBy === 'reward') { av = a.reward; bv = b.reward; }
      else if (sortBy === 'exp') { av = a.exp; bv = b.exp; }
      else if (sortBy === 'progress') { av = a.progress / a.total; bv = b.progress / b.total; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [search, missionTypeFilter, missionStatusFilter, sortBy, sortDir]);

  const filteredPoints = useMemo(() => {
    return POINT_RECORDS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.desc.toLowerCase().includes(q)) return false;
      }
      if (pointTypeFilter !== 'all' && p.type !== pointTypeFilter) return false;
      if (pointFlowFilter !== 'all' && p.flow !== pointFlowFilter) return false;
      return true;
    });
  }, [search, pointTypeFilter, pointFlowFilter]);

  const filteredReferrals = useMemo(() => {
    return REFERRALS.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.referee.toLowerCase().includes(q)) return false;
      }
      if (referralStatusFilter !== 'all' && r.status !== referralStatusFilter) return false;
      return true;
    });
  }, [search, referralStatusFilter]);

  const filteredActivities = useMemo(() => {
    return ACTIVITIES.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.desc.toLowerCase().includes(q)) return false;
      }
      if (activityStatusFilter !== 'all' && a.status !== activityStatusFilter) return false;
      return true;
    });
  }, [search, activityStatusFilter]);

  const filteredHistory = useMemo(() => {
    return HISTORIES.filter((h) => {
      if (search) {
        const q = search.toLowerCase();
        if (!h.title.toLowerCase().includes(q) && !h.desc.toLowerCase().includes(q)) return false;
      }
      if (historyTypeFilter !== 'all' && h.type !== historyTypeFilter) return false;
      return true;
    });
  }, [search, historyTypeFilter]);

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
      else if (e.key === '2') setTab('level');
      else if (e.key === '3') setTab('points');
      else if (e.key === '4') setTab('mission');
      else if (e.key === '5') setTab('referral');
      else if (e.key === '6') setTab('benefit');
      else if (e.key === '7') setTab('activity');
      else if (e.key === '8') setTab('history');
      else if (e.key === '9') setTab('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  const renderKpi = useCallback((label: string, value: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode, color: string = BRAND.primary) => {
    return (
      <div className="rounded-xl p-4 pg-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: BRAND.textSub }}>{label}</span>
          {icon && <span style={{ color }}>{icon}</span>}
        </div>
        <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{value}</div>
        {sub && <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{sub}</div>}
      </div>
    );
  }, []);

  const currentTier = TIERS.find((t) => t.id === kpi.currentTier) || TIERS[0];
  const nextTier = TIERS.find((t) => t.id === kpi.nextTier) || TIERS[TIERS.length - 1];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pg-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pg-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pg-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pg-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes pg-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pg-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,129,0.4); } 50% { box-shadow: 0 0 24px 4px rgba(20,184,129,0.6); } }
        .pg-stagger > * { animation: pg-fade-up 0.4s ease-out both; }
        .pg-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pg-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pg-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pg-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pg-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pg-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pg-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pg-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pg-pulse { animation: pg-pulse 2.4s ease-in-out infinite; }
        .pg-float { animation: pg-float 3s ease-in-out infinite; }
        .pg-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pg-shimmer 2.4s linear infinite; }
        .pg-drawer { animation: pg-slide-in 0.28s ease-out; }
        .pg-bar { transform-origin: left; animation: pg-bar 0.8s ease-out; }
        .pg-row:hover { background-color: ${BRAND.cardHover}; }
        .pg-glow { animation: pg-glow 2.4s ease-in-out infinite; }
        .pg-spin { animation: pg-spin 8s linear infinite; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={28} style={{ color: BRAND.primary }} className="pg-float" />
            <h1 className="text-3xl font-bold" style={{ color: BRAND.text }}>用户成长中心</h1>
            <span className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>P3.34</span>
          </div>
          <p className="text-sm mb-4" style={{ color: BRAND.textSub, maxWidth: 760 }}>
            中萨数字科技交易所用户成长中心：等级体系 / 积分中心 / 任务中心 / 推荐奖励 / 等级权益 / 活动中心 / 历史记录。
            与 P3.20 KYC + P3.24 生态合作 + P3.33 钱包服务中心形成"用户-资产-成长-激励"成长闭环。
            明确"用户成长激励与会员权益体系研究方向"定性，不构成对任何资产收益的合规承诺。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成对任何资产收益的合规承诺</span>
          </div>
        </div>
      </div>

      {/* VIP Card + KPIs */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl p-5 mb-4" style={{ background: `linear-gradient(135deg, ${BRAND.card} 0%, ${currentTier.color}10 100%)`, border: `1px solid ${currentTier.color}40` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center pg-float" style={{ background: `linear-gradient(135deg, ${currentTier.color} 0%, ${BRAND.primary} 100%)`, color: '#000' }}>
                  <Crown size={24} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: BRAND.text }}>{currentTier.name}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>当前等级 · 距离 {nextTier.name} 还差 {formatCurrency(kpi.nextVolume - kpi.currentVolume)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: currentTier.color }}>{kpi.vipScore}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>VIP 积分</div>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
              <div className="h-full pg-bar" style={{ width: `${kpi.levelProgress}%`, background: `linear-gradient(90deg, ${currentTier.color} 0%, ${BRAND.primary} 100%)` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1" style={{ color: BRAND.textMute }}>
              <span>{formatCurrency(kpi.currentVolume)} / {formatCurrency(kpi.nextVolume)}</span>
              <span>{kpi.levelProgress.toFixed(1)}% · 距 {nextTier.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            {renderKpi('总积分', <>{kpi.totalPoints.toLocaleString()}</>, <>可用 {kpi.availablePoints.toLocaleString()} · 锁定 {kpi.lockedPoints.toLocaleString()}</>, <Sparkles size={14} />, BRAND.primary)}
            {renderKpi('累计奖励', <>{formatCurrency(kpi.totalRewards)}</>, <>含交易/任务/活动/推荐</>, <Gift size={14} />, BRAND.warning)}
            {renderKpi('邀请好友', <>{kpi.totalReferrals}</>, <>活跃 {kpi.activeReferrals} · 待激活 {kpi.totalReferrals - kpi.activeReferrals}</>, <UserPlus size={14} />, BRAND.info)}
            {renderKpi('推荐奖励', <>{formatCurrency(kpi.referralRewards)}</>, <>累计返佣</>, <Handshake size={14} />, BRAND.success)}
            {renderKpi('即将过期', <>{kpi.expiringPoints}</>, <>30 天内过期积分</>, <Clock size={14} />, BRAND.danger)}
            {renderKpi('全球排名', <>#{formatNumber(kpi.globalRank)}</>, <>总用户 {formatNumber(kpi.totalUsers)}</>, <Trophy size={14} />, BRAND.amber)}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textSub }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索任务 / 积分 / 好友 / 活动…" className="bg-transparent outline-none flex-1 text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} className="p-0.5 rounded" style={{ color: BRAND.textSub }}><X size={14} /></button>}
            </div>
            <button onClick={() => alert('签到成功！获得 5 积分')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <Check size={14} /> 每日签到
            </button>
            <button onClick={() => openDrawer('redeem')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Gift size={14} /> 积分兑换
            </button>
            <button onClick={() => openDrawer('referral', 'r-share')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Share2 size={14} /> 邀请好友
            </button>
            <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {[
              { k: 'overview' as Tab, l: '总览' },
              { k: 'level' as Tab, l: `等级 (${TIERS.length})` },
              { k: 'points' as Tab, l: `积分 (${POINT_RECORDS.length})` },
              { k: 'mission' as Tab, l: `任务 (${MISSIONS.length})` },
              { k: 'referral' as Tab, l: `推荐 (${REFERRALS.length})` },
              { k: 'benefit' as Tab, l: `权益 (${BENEFITS.length})` },
              { k: 'activity' as Tab, l: `活动 (${ACTIVITIES.length})` },
              { k: 'history' as Tab, l: `历史 (${HISTORIES.length})` },
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
            <div className="space-y-6 pg-stagger">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>等级体系概览</h3>
                  <div className="space-y-2">
                    {TIERS.slice(0, 5).map((t) => {
                      const reached = TIERS.findIndex((x) => x.id === kpi.currentTier) >= TIERS.findIndex((x) => x.id === t.id);
                      return (
                        <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg pg-row" style={{ backgroundColor: reached ? `${t.color}10` : 'transparent', border: `1px solid ${reached ? t.color + '40' : BRAND.border}` }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: t.color, color: '#000' }}>
                            {reached ? <Check size={14} /> : <Crown size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{t.name}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>交易额 ≥ {formatCurrency(t.minVolume)} · 持仓 ≥ {formatCurrency(t.minHold)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold" style={{ color: t.color }}>{t.feeDiscount}% 折扣</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{t.perks} 项权益</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>近期积分活动</h3>
                  <div className="space-y-2">
                    {POINT_RECORDS.slice(0, 6).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: p.amount > 0 ? BRAND.successLt : BRAND.dangerLt, color: p.amount > 0 ? BRAND.success : BRAND.danger }}>
                          {p.amount > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate" style={{ color: BRAND.text }}>{p.desc}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{p.time}</div>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: p.amount > 0 ? BRAND.success : BRAND.danger }}>
                          {p.amount > 0 ? '+' : ''}{p.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>任务进度</h3>
                  <div className="space-y-3">
                    {MISSIONS.filter((m) => m.status === 'in_progress' || m.status === 'claimable').slice(0, 4).map((m) => {
                      const pct = (m.progress / m.total) * 100;
                      return (
                        <div key={m.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: BRAND.text }}>{m.title}</span>
                            <span style={{ color: BRAND.textMute }}>{m.progress}/{m.total}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: BRAND.primary }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>推荐概览</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span style={{ color: BRAND.textSub, fontSize: 11 }}>累计邀请</span><span style={{ color: BRAND.text, fontSize: 14, fontWeight: 600 }}>{kpi.totalReferrals} 人</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textSub, fontSize: 11 }}>活跃邀请</span><span style={{ color: BRAND.success, fontSize: 14, fontWeight: 600 }}>{kpi.activeReferrals} 人</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textSub, fontSize: 11 }}>推荐奖励</span><span style={{ color: BRAND.primary, fontSize: 14, fontWeight: 600 }}>{formatCurrency(kpi.referralRewards)}</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textSub, fontSize: 11 }}>邀请链接</span><span style={{ color: BRAND.text, fontSize: 11, fontFamily: 'monospace' }}>zsdex.com/r/U2Y8F4</span></div>
                  </div>
                </div>

                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>热门活动</h3>
                  <div className="space-y-2">
                    {ACTIVITIES.filter((a) => a.status === 'live').slice(0, 3).map((a) => (
                      <div key={a.id} className="p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color, border: `1px solid ${STATUS.LIVE.color}40` }}>进行中</span>
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>奖励 {a.reward.toLocaleString()} 积分 · {a.participants.toLocaleString()} 人参与</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'level' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>8 级 VIP 等级体系</h3>
                <p className="text-xs mb-4" style={{ color: BRAND.textSub }}>等级按 30 天累计交易额 + 持仓量综合评估。升级后永久保留，除非连续 90 天不活跃降一级。</p>
                <div className="space-y-2">
                  {TIERS.map((t) => {
                    const isCurrent = t.id === kpi.currentTier;
                    const isNext = t.id === kpi.nextTier;
                    const reached = TIERS.findIndex((x) => x.id === kpi.currentTier) >= TIERS.findIndex((x) => x.id === t.id);
                    return (
                      <div key={t.id} className="rounded-xl p-4" style={{ backgroundColor: isCurrent ? `${t.color}15` : BRAND.cardElevated, border: `2px solid ${isCurrent ? t.color : isNext ? BRAND.primary : BRAND.border}` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}80 100%)`, color: '#000' }}>
                            <Crown size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-semibold" style={{ color: BRAND.text }}>{t.name}</span>
                              {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: t.color, color: '#000' }}>当前等级</span>}
                              {isNext && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>下一等级</span>}
                            </div>
                            <div className="text-[11px]" style={{ color: BRAND.textSub }}>30天交易额 ≥ {formatCurrency(t.minVolume)} · 持仓 ≥ {formatCurrency(t.minHold)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold" style={{ color: t.color }}>{t.feeDiscount}%</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{t.perks} 项权益</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'points' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>总积分</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.primary }}>{kpi.totalPoints.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>可用积分</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.success }}>{kpi.availablePoints.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>锁定积分</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.warning }}>{kpi.lockedPoints.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>30 天内过期</div>
                    <div className="text-xl font-bold" style={{ color: BRAND.danger }}>{kpi.expiringPoints}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={pointTypeFilter} onChange={(e) => setPointTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    {(Object.keys(POINT_TYPE_LABELS) as PointType[]).map((t) => <option key={t} value={t}>{POINT_TYPE_LABELS[t]}</option>)}
                  </select>
                  <select value={pointFlowFilter} onChange={(e) => setPointFlowFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部流水</option>
                    {(Object.keys(POINT_FLOW_LABELS) as PointFlow[]).map((f) => <option key={f} value={f}>{POINT_FLOW_LABELS[f]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredPoints.map((p) => {
                  const positive = p.amount > 0;
                  return (
                    <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: positive ? BRAND.successLt : BRAND.dangerLt, color: positive ? BRAND.success : BRAND.danger }}>
                            {positive ? <Plus size={14} /> : <Minus size={14} />}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{p.desc}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{POINT_TYPE_LABELS[p.type]} · {POINT_FLOW_LABELS[p.flow]} · {p.time}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold" style={{ color: positive ? BRAND.success : BRAND.danger }}>{positive ? '+' : ''}{p.amount}</div>
                          {p.expiring && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>即将过期</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'mission' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select value={missionTypeFilter} onChange={(e) => setMissionTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    {(Object.keys(MISSION_TYPE_LABELS) as MissionType[]).map((t) => <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>)}
                  </select>
                  <select value={missionStatusFilter} onChange={(e) => setMissionStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    {(Object.keys(MISSION_STATUS_LABELS) as MissionStatus[]).map((s) => <option key={s} value={s}>{MISSION_STATUS_LABELS[s]}</option>)}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="reward">按奖励排序</option>
                    <option value="exp">按经验值排序</option>
                    <option value="progress">按进度排序</option>
                  </select>
                  <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredMissions.map((m) => {
                  const pct = (m.progress / m.total) * 100;
                  const statusColors: Record<MissionStatus, { bg: string; fg: string }> = {
                    todo: { bg: BRAND.cardElevated, fg: BRAND.textMute },
                    in_progress: { bg: BRAND.infoLt, fg: BRAND.info },
                    claimable: { bg: BRAND.successLt, fg: BRAND.success },
                    claimed: { bg: BRAND.cardElevated, fg: BRAND.textSub },
                    expired: { bg: BRAND.dangerLt, fg: BRAND.danger },
                  };
                  const sc = statusColors[m.status];
                  return (
                    <div key={m.id} onClick={() => openDrawer('mission', m.id)} className="rounded-xl p-4 cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${m.status === 'claimable' ? BRAND.success : BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: sc.bg, color: sc.fg }}>
                            {m.status === 'claimed' ? <Check size={14} /> : m.status === 'claimable' ? <Gift size={14} /> : m.status === 'in_progress' ? <Activity size={14} /> : <Target size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{m.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.fg, border: `1px solid ${sc.fg}40` }}>{MISSION_STATUS_LABELS[m.status]}</span>
                            </div>
                            <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{m.desc}</div>
                            <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textMute }}>
                              <span>分类 {m.category}</span>
                              <span>类型 {MISSION_TYPE_LABELS[m.type]}</span>
                              <span>截止 {m.deadline}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-base font-bold" style={{ color: BRAND.primary }}>+{m.reward}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>积分 · {m.exp} 经验</div>
                        </div>
                      </div>
                      {m.status !== 'claimed' && m.status !== 'expired' && (
                        <div>
                          <div className="flex justify-between text-[10px] mb-1" style={{ color: BRAND.textMute }}>
                            <span>进度 {m.progress}/{m.total} ({pct.toFixed(0)}%)</span>
                            {m.status === 'claimable' && <span style={{ color: BRAND.success }}>可领取</span>}
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: m.status === 'claimable' ? BRAND.success : BRAND.primary }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'referral' && (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10 0%, ${BRAND.success}10 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: BRAND.text }}>您的专属邀请链接</h3>
                <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>邀请好友注册并完成 KYC，您与好友均可获得 200 积分；好友 30 天内交易，您再得 5% 返佣。</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg font-mono text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>https://zsdex.com/r/U2Y8F4</div>
                  <button onClick={() => { navigator.clipboard?.writeText('https://zsdex.com/r/U2Y8F4'); alert('已复制邀请链接'); }} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    <CopyIcon size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.primary }}>{kpi.totalReferrals}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>累计邀请</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.success }}>{kpi.activeReferrals}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>活跃邀请</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.warning }}>{formatCurrency(kpi.referralRewards)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>累计奖励</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold" style={{ color: BRAND.info }}>5%</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>交易返佣</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={referralStatusFilter} onChange={(e) => setReferralStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    <option value="active">活跃</option>
                    <option value="pending">待激活</option>
                    <option value="expired">已失效</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, borderBottom: `1px solid ${BRAND.border}` }}>
                  <div className="col-span-3">好友</div>
                  <div className="col-span-2">注册时间</div>
                  <div className="col-span-1">等级</div>
                  <div className="col-span-2 text-right">30d 交易额</div>
                  <div className="col-span-2 text-right">累计奖励</div>
                  <div className="col-span-2 text-right">状态</div>
                </div>
                {filteredReferrals.map((r) => {
                  const statusColors = {
                    active: { bg: BRAND.successLt, fg: BRAND.success, label: '活跃' },
                    pending: { bg: BRAND.warningLt, fg: BRAND.warning, label: '待激活' },
                    expired: { bg: BRAND.dangerLt, fg: BRAND.danger, label: '已失效' },
                  };
                  const sc = statusColors[r.status];
                  return (
                    <div key={r.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <div className="col-span-3" style={{ color: BRAND.text }}>{r.referee}</div>
                      <div className="col-span-2" style={{ color: BRAND.textSub }}>{r.registerTime}</div>
                      <div className="col-span-1" style={{ color: TIER_COLORS[r.tier] }}>{TIER_LABELS[r.tier]}</div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.text }}>{formatCurrency(r.volume30d)}</div>
                      <div className="col-span-2 text-right" style={{ color: BRAND.primary }}>+{r.rewards}</div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.fg, border: `1px solid ${sc.fg}40` }}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'benefit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {BENEFITS.map((b) => {
                  const catColor = {
                    fee: BRAND.warning,
                    service: BRAND.info,
                    event: BRAND.primary,
                    airdrop: BRAND.success,
                    badge: '#A855F7',
                    access: BRAND.danger,
                    support: BRAND.amber,
                  }[b.category];
                  const reached = TIERS.findIndex((x) => x.id === kpi.currentTier) >= TIERS.findIndex((x) => x.id === b.tier);
                  return (
                    <div key={b.id} onClick={() => openDrawer('benefit', b.id)} className="rounded-xl p-4 cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${reached ? catColor + '40' : BRAND.border}`, opacity: reached ? 1 : 0.6 }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: catColor + '20', color: catColor }}>
                          <Star size={18} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: reached ? BRAND.successLt : BRAND.cardElevated, color: reached ? BRAND.success : BRAND.textMute, border: `1px solid ${reached ? BRAND.success : BRAND.border}40` }}>{reached ? '已解锁' : TIER_LABELS[b.tier]}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{b.name}</h4>
                      <p className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{b.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: catColor + '20', color: catColor, border: `1px solid ${catColor}40` }}>{BENEFIT_CATEGORY_LABELS[b.category]}</span>
                        <span className="text-sm font-semibold" style={{ color: catColor }}>{b.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={activityStatusFilter} onChange={(e) => setActivityStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    {(Object.keys(ACTIVITY_STATUS_LABELS) as ActivityStatus[]).map((s) => <option key={s} value={s}>{ACTIVITY_STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((a) => {
                  const sc = {
                    live: { bg: BRAND.successLt, fg: BRAND.success, label: ACTIVITY_STATUS_LABELS.live },
                    upcoming: { bg: BRAND.infoLt, fg: BRAND.info, label: ACTIVITY_STATUS_LABELS.upcoming },
                    ended: { bg: BRAND.cardElevated, fg: BRAND.textMute, label: ACTIVITY_STATUS_LABELS.ended },
                    sold_out: { bg: BRAND.warningLt, fg: BRAND.warning, label: ACTIVITY_STATUS_LABELS.sold_out },
                  }[a.status];
                  return (
                    <div key={a.id} onClick={() => openDrawer('activity', a.id)} className="rounded-xl p-5 cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-base font-semibold flex-1" style={{ color: BRAND.text }}>{a.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded ml-2" style={{ backgroundColor: sc.bg, color: sc.fg, border: `1px solid ${sc.fg}40` }}>{sc.label}</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>{a.desc}</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <div style={{ color: BRAND.textMute }}>奖励</div>
                          <div className="text-base font-bold" style={{ color: BRAND.primary }}>{a.reward.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ color: BRAND.textMute }}>参与人数</div>
                          <div className="text-base font-bold" style={{ color: BRAND.text }}>{a.participants.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ color: BRAND.textMute }}>周期</div>
                          <div className="text-[10px]" style={{ color: BRAND.text }}>{a.start} ~ {a.end}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{a.category}</span>
                        {a.status === 'live' && <span className="text-[10px]" style={{ color: BRAND.primary }}>立即参与 →</span>}
                        {a.status === 'upcoming' && <span className="text-[10px]" style={{ color: BRAND.info }}>提醒我 →</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <select value={historyTypeFilter} onChange={(e) => setHistoryTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="level_up">等级变更</option>
                    <option value="points">积分</option>
                    <option value="reward">奖励</option>
                    <option value="redeem">兑换</option>
                    <option value="referral">推荐</option>
                    <option value="mission">任务</option>
                    <option value="activity">活动</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                {filteredHistory.map((h) => {
                  const typeIcons = {
                    level_up: <Trophy size={14} />,
                    points: <Sparkles size={14} />,
                    reward: <Gift size={14} />,
                    redeem: <CreditCard size={14} />,
                    referral: <Handshake size={14} />,
                    mission: <Target size={14} />,
                    activity: <Rocket size={14} />,
                  };
                  const typeColors = {
                    level_up: BRAND.amber,
                    points: BRAND.primary,
                    reward: BRAND.warning,
                    redeem: BRAND.info,
                    referral: BRAND.success,
                    mission: BRAND.info,
                    activity: BRAND.danger,
                  };
                  return (
                    <div key={h.id} className="flex items-center gap-3 p-4 pg-row" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: typeColors[h.type] + '20', color: typeColors[h.type] }}>
                        {typeIcons[h.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{h.title}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{h.desc} · {h.time}</div>
                      </div>
                      <div className="text-right">
                        {h.amount !== undefined && h.amount !== 0 && (
                          <div className="text-sm font-semibold" style={{ color: h.amount > 0 ? BRAND.success : BRAND.danger }}>{h.amount > 0 ? '+' : ''}{h.amount}</div>
                        )}
                        {h.status && <div className="text-[10px]" style={{ color: BRAND.textMute }}>{h.status}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>用户成长中心说明</h3>
              <div className="space-y-3 text-sm" style={{ color: BRAND.textSub }}>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>等级体系</div>
                  <p>· 8 级 VIP（V1-V8）按 30 天交易额 + 持仓量综合评估 · 升级后享受手续费折扣、专属服务、活动特权等权益 · 连续 90 天不活跃可能降级</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>积分获取</div>
                  <p>· 交易返佣（按交易量阶梯）· 持仓奖励（每日按持仓发放）· 任务奖励（日常/周常/月常/成就）· 推荐奖励（好友 30 天内交易返佣 5%）· 学习奖励（学院课程）</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>积分消耗</div>
                  <p>· 兑换手续费折扣券 · 兑换专属客服 · 兑换实物周边 · 兑换活动门票 · 参与抽奖 · 积分有效期 1 年，到期未使用将自动清零</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>推荐奖励</div>
                  <p>· 一级推荐：好友 30 天内交易额的 5% · 二级推荐（好友推荐的好友）：2% · 双方均可获得 200 积分注册奖励</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>合规说明</div>
                  <p className="text-[11px]">本平台用户成长中心为"用户成长激励与会员权益体系研究方向"演示页面，所有积分/等级/奖励/任务/活动数据均为 mock 占位。本平台不构成对任何资产收益的合规承诺。严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险表述。具体会员权益请以平台规则为准。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'mission' && drawer.payload && (() => {
        const m = MISSIONS.find((x) => x.id === drawer.payload);
        if (!m) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>任务详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-base font-semibold" style={{ color: BRAND.text }}>{m.title}</div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{m.desc}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>分类</div>
                    <div style={{ color: BRAND.text }}>{m.category}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>类型</div>
                    <div style={{ color: BRAND.text }}>{MISSION_TYPE_LABELS[m.type]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>截止</div>
                    <div style={{ color: BRAND.text }}>{m.deadline}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>状态</div>
                    <div style={{ color: BRAND.text }}>{MISSION_STATUS_LABELS[m.status]}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: BRAND.textSub }}>进度</span>
                    <span style={{ color: BRAND.primary }}>{m.progress}/{m.total}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                    <div className="h-full" style={{ width: `${(m.progress / m.total) * 100}%`, backgroundColor: BRAND.primary }} />
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>奖励</div>
                  <div className="text-xl font-bold" style={{ color: BRAND.primary }}>+{m.reward} 积分 · +{m.exp} 经验</div>
                </div>
                {m.status === 'claimable' && (
                  <button onClick={() => { alert(`已领取任务奖励：+${m.reward} 积分`); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即领取</button>
                )}
                {m.status === 'in_progress' && (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>任务进行中</button>
                )}
                {m.status === 'claimed' && (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.success, border: `1px solid ${BRAND.success}40` }}>已领取 ✓</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'redeem' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>积分兑换</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>可用积分</div>
                <div className="text-3xl font-bold" style={{ color: BRAND.primary }}>{kpi.availablePoints.toLocaleString()}</div>
              </div>
              {[
                { name: '现货手续费 9 折券（7 天）', cost: 200, icon: 'Coins' },
                { name: '专属客服 30 天', cost: 500, icon: 'MessageCircle' },
                { name: '研究分析报告月卡', cost: 800, icon: 'FileText' },
                { name: 'VIP4 体验券（30 天）', cost: 2000, icon: 'Crown' },
                { name: '夏季限定数字藏品', cost: 5000, icon: 'Sparkles' },
                { name: '生日礼包（价值 $100）', cost: 1000, icon: 'Heart' },
              ].map((r, i) => {
                const canAfford = kpi.availablePoints >= r.cost;
                return (
                  <div key={i} className="p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                      <Gift size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: BRAND.text }}>{r.name}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>需要 {r.cost} 积分</div>
                    </div>
                    <button disabled={!canAfford} onClick={() => { if (canAfford) { alert(`已兑换：${r.name}`); closeDrawer(); } }} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: canAfford ? BRAND.primary : BRAND.cardElevated, color: canAfford ? '#000' : BRAND.textMute, border: `1px solid ${canAfford ? BRAND.primary : BRAND.border}` }}>
                      兑换
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'referral' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>邀请好友</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-6 rounded-lg text-center" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                <QrCode size={120} style={{ color: BRAND.text, margin: '0 auto' }} />
                <div className="text-[10px] mt-2 font-mono" style={{ color: BRAND.textSub }}>https://zsdex.com/r/U2Y8F4</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                <div className="text-sm font-medium mb-2" style={{ color: BRAND.text }}>奖励规则</div>
                <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
                  <li>· 好友通过您的链接注册并完成 KYC：双方各得 200 积分</li>
                  <li>· 好友 30 天内交易额 5% 返佣给您</li>
                  <li>· 二级推荐（好友邀请的好友）：2% 返佣</li>
                  <li>· 好友升至 VIP4：您额外得 1,000 积分</li>
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: '#000' }}>复制链接</button>
                <button className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>分享微信</button>
                <button className="py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>分享 Twitter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'benefit' && drawer.payload && (() => {
        const b = BENEFITS.find((x) => x.id === drawer.payload);
        if (!b) return null;
        const catColor = {
          fee: BRAND.warning,
          service: BRAND.info,
          event: BRAND.primary,
          airdrop: BRAND.success,
          badge: '#A855F7',
          access: BRAND.danger,
          support: BRAND.amber,
        }[b.category];
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>权益详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-base font-semibold" style={{ color: BRAND.text }}>{b.name}</div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{b.desc}</div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>权益价值</div>
                  <div className="text-2xl font-bold" style={{ color: catColor }}>{b.value}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>分类</div>
                    <div style={{ color: BRAND.text }}>{BENEFIT_CATEGORY_LABELS[b.category]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>解锁等级</div>
                    <div style={{ color: TIER_COLORS[b.tier] }}>{TIER_LABELS[b.tier]}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40`, color: BRAND.primary }}>
                  · 权益自动随等级升级解锁 · 升级历史可在"历史记录"中查询
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {drawer.open && drawer.type === 'activity' && drawer.payload && (() => {
        const a = ACTIVITIES.find((x) => x.id === drawer.payload);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>活动详情</h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-base font-semibold" style={{ color: BRAND.text }}>{a.title}</div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{a.desc}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>分类</div>
                    <div style={{ color: BRAND.text }}>{a.category}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>状态</div>
                    <div style={{ color: BRAND.text }}>{ACTIVITY_STATUS_LABELS[a.status]}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>开始</div>
                    <div style={{ color: BRAND.text }}>{a.start}</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div style={{ color: BRAND.textMute }}>结束</div>
                    <div style={{ color: BRAND.text }}>{a.end}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>奖励</div>
                  <div className="text-xl font-bold" style={{ color: BRAND.primary }}>{a.reward.toLocaleString()} 积分</div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>已 {a.participants.toLocaleString()} 人参与</div>
                </div>
                {a.status === 'live' && (
                  <button onClick={() => { alert(`已报名活动：${a.title}`); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>立即参与</button>
                )}
                {a.status === 'upcoming' && (
                  <button onClick={() => { alert(`已设置提醒：${a.title}`); closeDrawer(); }} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>设置提醒</button>
                )}
                {a.status === 'ended' && (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}>活动已结束</button>
                )}
                {a.status === 'sold_out' && (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}>已满员</button>
                )}
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
      <div className="w-full max-w-md h-full overflow-y-auto pg-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
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
