/**
 * PortalYield - 流动性挖矿与收益聚合中心 (2026-07-21 Q05 P3.49)
 *
 * 页面定位：
 * - 中萨数字科技交易所 流动性挖矿与收益聚合中心
 * - 挖矿活动 / 流动性池 / 双币挖矿 / LP 挖矿 / 质押 / 收益聚合器 / 加速卡 / 推荐奖励 / 锁仓 / 收益历史 / 等级权益 / 帮助
 * - 与 P3.43 流动性再质押 + P3.45 资产组合 + P3.46 智能投顾 形成 "质押-组合-投顾-收益聚合" 完整收益能力栈
 * - 与 P3.40 量化策略 + P3.41 链上资产 + P3.42 跨链互操作 + P3.43 流动性再质押 + P3.44 RWA + P3.45 资产组合 + P3.46 智能投顾 + P3.47 机构服务 + P3.48 开发者门户 + P3.49 流动性挖矿 形成
 *   "策略-资产-跨链-质押-RWA-组合-投顾-机构-开发者-挖矿" 全栈收益与生态能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 挖矿 / 池 / 双币 / LP / 质押 / 聚合 / 加速 / 推荐 / 锁仓 / 历史 / 帮助
 *
 * 合规约束：
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 * - 收益为浮动收益，过往业绩不预示未来表现
 * - 挖矿与收益聚合为技术能力演示，定性为"研究 / 工具 / 辅助"型能力
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search, X, Filter, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft,
  Sparkles, Star, Heart, Bookmark, Flag, Tag, Tags, Eye, EyeOff, Plus, Minus,
  MoreHorizontal, MoreVertical, Menu, HelpCircle, Book, BookOpen, Lightbulb, GraduationCap,
  Coins, CircleDollarSign, DollarSign, Gem, PiggyBank, Handshake, Banknote, Wallet, CreditCard, Receipt,
  Droplet, Droplets, Sprout, Leaf, Beaker, FlaskConical, TestTube, TestTubes,
  TrendingUp as Trend, Activity, Zap, Flame, Rocket, Sparkle, Wand2,
  Layers, Box, Boxes, GitBranch, GitCommit, GitMerge, GitFork, Network, Workflow,
  Award, Crown, Trophy, Medal, Gift, Ticket, Percent, Hash, FunctionSquare, Sigma,
  Lock, Key, Unlock, Shield, ShieldCheck, ShieldAlert, ShieldOff, ShieldQuestion,
  CheckCircle2, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info,
  Users, User, UserCheck, UserPlus, UserMinus, Crown as King, Building, Building2,
  Mail, Bell, BellRing, Send, MessageCircle, MessageSquare, Phone, Share2,
  History, RotateCcw, RotateCw, Repeat, RefreshCw, Calendar, Clock, Timer, Hourglass, CalendarDays, CalendarCheck,
  Settings, Wrench, Hammer, Plug, Power, PowerOff, Cpu, Server, Database, Cloud,
  PlayCircle, PauseCircle, StopCircle, Edit, Trash2, Save, Folder, FolderOpen, Archive, Inbox,
  FileText, FileCheck, FilePlus, FileMinus, FileCode, FileJson, FileBarChart, FilePieChart, FileLineChart,
  ListChecks, ListFilter, ListTree, ClipboardList, ClipboardCheck,
  Target, Crosshair, Compass, Map, MapPin, Scroll, Stamp, Gavel, Scale, Calculator,
  ChartLine, ChartBar, ChartPie, ChartColumn, ChartNoAxesColumn, BarChart3, PieChart, LineChart, ChartSpline,
  Sun, Moon, CloudMoon, Sunrise, Sunset, Gauge, Mic, Video,
  Link, Link2, Unlink, ExternalLink, Copy, Check, Download, Upload, Webhook, Code, Terminal,
  Newspaper, Notebook, NotebookText, NotebookPen, ScrollText,
} from 'lucide-react';
import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

type Tab = 'overview' | 'farm' | 'pool' | 'dual' | 'lpfarm' | 'stake' | 'vault' | 'boost' | 'ref' | 'lock' | 'history' | 'help';
type SortBy = 'name' | 'apr' | 'tvl' | 'volume' | 'updated';

type FarmStatus = 'active' | 'upcoming' | 'ended' | 'paused';
type FarmType = 'single' | 'lp' | 'dual' | 'lock' | 'vault';

type PoolStatus = 'active' | 'warming' | 'paused' | 'deprecated';
type PoolRisk = 'low' | 'medium' | 'high' | 'extreme';

type DualStatus = 'active' | 'upcoming' | 'ended';
type LpStatus = 'active' | 'rewarded' | 'deprecated' | 'imbalanced';

type StakeType = 'flexible' | 'locked_30' | 'locked_90' | 'locked_180' | 'locked_365';
type StakeStatus = 'active' | 'unstaking' | 'expired' | 'slashed';

type VaultStrategy = 'stable' | 'balanced' | 'aggressive' | 'delta_neutral' | 'yield_curve';
type VaultStatus = 'active' | 'paused' | 'winding_down';

type BoostType = 'apr' | 'multiplier' | 'drop' | 'fee_discount' | 'capacity';
type BoostRarity = 'common' | 'rare' | 'epic' | 'legendary';

type RefTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

type LockPeriod = '7d' | '30d' | '90d' | '180d' | '365d';
type LockStatus = 'active' | 'unlocking' | 'claimed' | 'forfeited';

type HistoryType = 'reward' | 'claim' | 'deposit' | 'withdraw' | 'lock' | 'unlock' | 'boost' | 'ref_bonus';

interface FarmActivity {
  id: string;
  name: string;
  type: FarmType;
  status: FarmStatus;
  tokenA: string;
  tokenB?: string;
  apr: number;
  aprBoosted: number;
  tvl: number;
  tvlCap: number;
  stakers: number;
  myStake: number;
  myEarned: number;
  startAt: string;
  endAt: string;
  harvestable: boolean;
  risk: PoolRisk;
  description: string;
  tags: string[];
}

interface LiquidityPool {
  id: string;
  pair: string;
  tokenA: string;
  tokenB: string;
  status: PoolStatus;
  risk: PoolRisk;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  reserveA: number;
  reserveB: number;
  myLP: number;
  myShare: number;
  feeTier: number;
  createdAt: string;
  priceImpact: number;
  tags: string[];
}

interface DualFarm {
  id: string;
  name: string;
  tokenA: string;
  tokenB: string;
  status: DualStatus;
  aprA: number;
  aprB: number;
  totalApr: number;
  tvl: number;
  stakers: number;
  duration: number;
  myStake: number;
  myEarnedA: number;
  myEarnedB: number;
  startAt: string;
  endAt: string;
  description: string;
  risk: PoolRisk;
}

interface LpFarm {
  id: string;
  pair: string;
  pool: string;
  status: LpStatus;
  baseApr: number;
  rewardApr: number;
  totalApr: number;
  tvl: number;
  myLPValue: number;
  myEarned: number;
  impermanentLoss: number;
  volume24h: number;
  rewardToken: string;
  updatedAt: string;
  description: string;
  imbalanced: boolean;
}

interface StakeRecord {
  id: string;
  token: string;
  type: StakeType;
  status: StakeStatus;
  amount: number;
  apr: number;
  earned: number;
  pending: number;
  startAt: string;
  endAt: string;
  unlockAt: string;
  canUnstake: boolean;
  earlyFee: number;
  apy: number;
  validator: string;
}

interface YieldVault {
  id: string;
  name: string;
  strategy: VaultStrategy;
  status: VaultStatus;
  tvl: number;
  apy: number;
  apy7d: number;
  apy30d: number;
  sharpe: number;
  drawdown: number;
  myDeposit: number;
  myEarned: number;
  risk: PoolRisk;
  protocols: string[];
  rebalanceFreq: string;
  description: string;
  inception: string;
}

interface BoostItem {
  id: string;
  name: string;
  type: BoostType;
  rarity: BoostRarity;
  value: number;
  used: boolean;
  expiresAt: string;
  source: string;
  description: string;
  applicableTo: string[];
  acquiredAt: string;
  stackable: boolean;
}

interface RefReward {
  id: string;
  referee: string;
  tier: RefTier;
  volume: number;
  commission: number;
  rate: number;
  status: 'pending' | 'paid' | 'clawed_back';
  createdAt: string;
  paidAt?: string;
  source: string;
  note: string;
}

interface LockStake {
  id: string;
  pool: string;
  period: LockPeriod;
  status: LockStatus;
  amount: number;
  apr: number;
  bonus: number;
  earned: number;
  startAt: string;
  endAt: string;
  unlockAt: string;
  canClaim: boolean;
  earlyExitFee: number;
  vesting: string;
}

interface YieldHistory {
  id: string;
  type: HistoryType;
  source: string;
  amount: number;
  token: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  txHash: string;
  apr: number;
  note: string;
}

// ============================================================
// 工具函数
// ============================================================

function formatUsd(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(0);
}

function formatPct(n: number, digits = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(digits) + '%';
}

function formatInt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toString();
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(2) + ' KB';
  return n + ' B';
}

function statusBadge(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: '进行中', color: BRAND.success, bg: BRAND.successLt },
    upcoming: { label: '即将开始', color: BRAND.info, bg: BRAND.infoLt },
    ended: { label: '已结束', color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' },
    paused: { label: '暂停', color: BRAND.amber, bg: BRAND.amberLt },
    warming: { label: '预热中', color: BRAND.info, bg: BRAND.infoLt },
    deprecated: { label: '已弃用', color: BRAND.danger, bg: BRAND.dangerLt },
    rewarded: { label: '奖励中', color: BRAND.success, bg: BRAND.successLt },
    imbalanced: { label: '比例失衡', color: BRAND.amber, bg: BRAND.amberLt },
    flexible: { label: '活期', color: BRAND.info, bg: BRAND.infoLt },
    locked_30: { label: '30 天', color: BRAND.primary, bg: BRAND.primaryLt },
    locked_90: { label: '90 天', color: BRAND.primary, bg: BRAND.primaryLt },
    locked_180: { label: '180 天', color: BRAND.success, bg: BRAND.successLt },
    locked_365: { label: '365 天', color: BRAND.success, bg: BRAND.successLt },
    unstaking: { label: '解锁中', color: BRAND.amber, bg: BRAND.amberLt },
    expired: { label: '已到期', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    slashed: { label: '已惩罚', color: BRAND.danger, bg: BRAND.dangerLt },
    stable: { label: '稳健', color: BRAND.success, bg: BRAND.successLt },
    balanced: { label: '均衡', color: BRAND.info, bg: BRAND.infoLt },
    aggressive: { label: '激进', color: BRAND.amber, bg: BRAND.amberLt },
    delta_neutral: { label: 'Delta 中性', color: BRAND.primary, bg: BRAND.primaryLt },
    yield_curve: { label: '收益曲线', color: BRAND.success, bg: BRAND.successLt },
    winding_down: { label: '赎回中', color: BRAND.amber, bg: BRAND.amberLt },
    apr: { label: 'APR 提升', color: BRAND.primary, bg: BRAND.primaryLt },
    multiplier: { label: '多倍奖励', color: BRAND.success, bg: BRAND.successLt },
    drop: { label: '空投加成', color: BRAND.info, bg: BRAND.infoLt },
    fee_discount: { label: '手续费折扣', color: BRAND.amber, bg: BRAND.amberLt },
    capacity: { label: '容量扩容', color: BRAND.success, bg: BRAND.successLt },
    common: { label: '普通', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    rare: { label: '稀有', color: BRAND.info, bg: BRAND.infoLt },
    epic: { label: '史诗', color: BRAND.primary, bg: BRAND.primaryLt },
    legendary: { label: '传说', color: BRAND.amber, bg: BRAND.amberLt },
    bronze: { label: '青铜', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    silver: { label: '白银', color: BRAND.info, bg: BRAND.infoLt },
    gold: { label: '黄金', color: BRAND.amber, bg: BRAND.amberLt },
    platinum: { label: '铂金', color: BRAND.primary, bg: BRAND.primaryLt },
    diamond: { label: '钻石', color: BRAND.success, bg: BRAND.successLt },
    low: { label: '低风险', color: BRAND.success, bg: BRAND.successLt },
    medium: { label: '中风险', color: BRAND.amber, bg: BRAND.amberLt },
    high: { label: '高风险', color: BRAND.warning, bg: BRAND.warningLt },
    extreme: { label: '极高风险', color: BRAND.danger, bg: BRAND.dangerLt },
    unlocking: { label: '解锁中', color: BRAND.amber, bg: BRAND.amberLt },
    claimed: { label: '已领取', color: BRAND.success, bg: BRAND.successLt },
    forfeited: { label: '已放弃', color: BRAND.danger, bg: BRAND.dangerLt },
    pending: { label: '待处理', color: BRAND.amber, bg: BRAND.amberLt },
    paid: { label: '已发放', color: BRAND.success, bg: BRAND.successLt },
    clawed_back: { label: '已追回', color: BRAND.danger, bg: BRAND.dangerLt },
    completed: { label: '已完成', color: BRAND.success, bg: BRAND.successLt },
    failed: { label: '失败', color: BRAND.danger, bg: BRAND.dangerLt },
    reward: { label: '奖励', color: BRAND.success, bg: BRAND.successLt },
    claim: { label: '领取', color: BRAND.primary, bg: BRAND.primaryLt },
    deposit: { label: '存入', color: BRAND.info, bg: BRAND.infoLt },
    withdraw: { label: '提取', color: BRAND.amber, bg: BRAND.amberLt },
    lock: { label: '锁仓', color: BRAND.primary, bg: BRAND.primaryLt },
    unlock: { label: '解锁', color: BRAND.success, bg: BRAND.successLt },
    boost: { label: '加速', color: BRAND.amber, bg: BRAND.amberLt },
    ref_bonus: { label: '推荐奖励', color: BRAND.success, bg: BRAND.successLt },
  };
  return map[status] || { label: status, color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' };
}

function severityColor(s: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    low: { color: BRAND.success, bg: BRAND.successLt },
    medium: { color: BRAND.amber, bg: BRAND.amberLt },
    high: { color: BRAND.warning, bg: BRAND.warningLt },
    extreme: { color: BRAND.danger, bg: BRAND.dangerLt },
  };
  return map[s] || { color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) + '…' : s;
}

const RISK_COLOR: Record<PoolRisk, string> = {
  low: BRAND.success,
  medium: BRAND.amber,
  high: BRAND.warning,
  extreme: BRAND.danger,
};

const TOKEN_COLOR: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', USDC: '#2775CA', BNB: '#F0B90B',
  SOL: '#14F195', MATIC: '#8247E5', ARB: '#28A0F0', OP: '#FF0420', ZSDX: '#14B881',
  ZSDG: '#FFA940', DAI: '#F5AC37', LINK: '#2A5ADA', UNI: '#FF007A', AAVE: '#B6509E',
};

const STRATEGY_ICON: Record<VaultStrategy, string> = {
  stable: '稳',
  balanced: '衡',
  aggressive: '进',
  delta_neutral: '中',
  yield_curve: '曲',
};

const TIER_MULT: Record<RefTier, number> = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  platinum: 2.0,
  diamond: 3.0,
};

// ============================================================
// Mock 数据
// ============================================================

// ============================================================
// Mock 数据 - 流动性挖矿与收益聚合
// ============================================================

const FARMS: FarmActivity[] = [
  { id: 'FARM-001', name: 'ZSDX 单币灵活挖矿', type: 'single', status: 'active', tokenA: 'ZSDX', apr: 28.4, aprBoosted: 42.6, tvl: 48_000_000, tvlCap: 80_000_000, stakers: 6840, myStake: 12_500, myEarned: 184.6, startAt: '2026-05-01', endAt: '2026-12-31', harvestable: true, risk: 'low', description: 'ZSDX 平台代币单币灵活挖矿，零无常损失，收益每日发放。', tags: ['热门', '灵活', '低风险'] },
  { id: 'FARM-002', name: 'USDT 稳定币理财', type: 'single', status: 'active', tokenA: 'USDT', apr: 8.6, aprBoosted: 12.4, tvl: 86_000_000, tvlCap: 100_000_000, stakers: 12_480, myStake: 0, myEarned: 0, startAt: '2026-04-15', endAt: '2027-04-15', harvestable: true, risk: 'low', description: 'USDT 稳定币理财，APR 8-12%，按日计息，到期赎回。', tags: ['稳健', '保流动性', '日结'] },
  { id: 'FARM-003', name: 'ETH 2.0 质押', type: 'single', status: 'active', tokenA: 'ETH', apr: 14.2, aprBoosted: 18.8, tvl: 32_000_000, tvlCap: 50_000_000, stakers: 2860, myStake: 4_200, myEarned: 86.4, startAt: '2026-03-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'ETH 2.0 网络原生质押，APR 14-19%，T+7 解锁。', tags: ['主流', '中风险'] },
  { id: 'FARM-004', name: 'BTC 链上质押', type: 'single', status: 'active', tokenA: 'BTC', apr: 6.4, aprBoosted: 9.2, tvl: 24_000_000, tvlCap: 40_000_000, stakers: 1840, myStake: 0.6, myEarned: 0.012, startAt: '2026-05-10', endAt: '2027-01-10', harvestable: true, risk: 'medium', description: 'BTC 链上质押 / Babylon 协议桥接，APR 6-10%，收益每 7 日发放。', tags: ['BTC', '中风险'] },
  { id: 'FARM-005', name: 'ZSDX 90 天锁仓挖矿', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 48.6, aprBoosted: 64.8, tvl: 18_000_000, tvlCap: 25_000_000, stakers: 1280, myStake: 0, myEarned: 0, startAt: '2026-06-01', endAt: '2026-08-31', harvestable: false, risk: 'medium', description: 'ZSDX 90 天锁仓挖矿，APR 48-65%，到期一次性发放，提前解锁扣除 30% 本金。', tags: ['锁仓', '高收益'] },
  { id: 'FARM-006', name: 'SOL 流动性质押', type: 'single', status: 'active', tokenA: 'SOL', apr: 18.4, aprBoosted: 24.6, tvl: 14_000_000, tvlCap: 30_000_000, stakers: 3640, myStake: 120, myEarned: 2.84, startAt: '2026-04-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'SOL 流动性质押（jitoSOL / mSOL 等），APR 18-25%，T+1 解锁。', tags: ['SOL', '流动性质押'] },
  { id: 'FARM-007', name: 'ARB 跨链质押', type: 'single', status: 'active', tokenA: 'ARB', apr: 22.6, aprBoosted: 32.4, tvl: 8_600_000, tvlCap: 15_000_000, stakers: 1240, myStake: 0, myEarned: 0, startAt: '2026-05-20', endAt: '2026-11-20', harvestable: true, risk: 'medium', description: 'ARB Layer2 跨链质押，APR 22-32%，T+3 解锁。', tags: ['L2', '跨链'] },
  { id: 'FARM-008', name: 'BNB 链质押', type: 'single', status: 'active', tokenA: 'BNB', apr: 12.4, aprBoosted: 16.8, tvl: 6_400_000, tvlCap: 12_000_000, stakers: 1840, myStake: 0, myEarned: 0, startAt: '2026-04-10', endAt: '2026-10-10', harvestable: true, risk: 'medium', description: 'BNB 链原生质押，APR 12-17%，弹性周期。', tags: ['BNB', '弹性'] },
  { id: 'FARM-009', name: 'USDC 90 天期', type: 'lock', status: 'upcoming', tokenA: 'USDC', apr: 14.8, aprBoosted: 18.4, tvl: 0, tvlCap: 50_000_000, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-07-25', endAt: '2026-10-23', harvestable: false, risk: 'low', description: 'USDC 90 天期锁仓，APR 14-19%，保流动性稳定币理财。', tags: ['稳定币', '即将开始'] },
  { id: 'FARM-010', name: 'MATIC 流动性质押', type: 'single', status: 'active', tokenA: 'MATIC', apr: 16.2, aprBoosted: 22.4, tvl: 4_200_000, tvlCap: 10_000_000, stakers: 860, myStake: 0, myEarned: 0, startAt: '2026-05-15', endAt: '2026-12-15', harvestable: true, risk: 'medium', description: 'MATIC 网络流动性质押，APR 16-22%。', tags: ['L2', '流动性质押'] },
  { id: 'FARM-011', name: 'ZSDX 180 天超长锁仓', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 86.4, aprBoosted: 124.6, tvl: 8_400_000, tvlCap: 12_000_000, stakers: 480, myStake: 0, myEarned: 0, startAt: '2026-04-01', endAt: '2026-09-30', harvestable: false, risk: 'high', description: 'ZSDX 180 天超长锁仓，APR 86-125%，高收益伴随高风险，30% 提前解锁罚没。', tags: ['超长锁仓', '高收益', '高风险'] },
  { id: 'FARM-012', name: 'OP Layer2 质押', type: 'single', status: 'active', tokenA: 'OP', apr: 20.4, aprBoosted: 28.6, tvl: 3_200_000, tvlCap: 8_000_000, stakers: 640, myStake: 0, myEarned: 0, startAt: '2026-06-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'Optimism Layer2 质押，APR 20-29%。', tags: ['L2', 'OP'] },
  { id: 'FARM-013', name: 'AVAX 雪崩质押', type: 'single', status: 'paused', tokenA: 'AVAX', apr: 14.6, aprBoosted: 18.2, tvl: 2_400_000, tvlCap: 6_000_000, stakers: 320, myStake: 0, myEarned: 0, startAt: '2026-03-15', endAt: '2026-09-15', harvestable: true, risk: 'medium', description: 'AVAX 雪崩协议质押（当前暂停，升级中），APR 14-19%。', tags: ['暂停', '升级中'] },
  { id: 'FARM-014', name: 'ZSDX 30 天短期', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 32.4, aprBoosted: 42.8, tvl: 6_800_000, tvlCap: 10_000_000, stakers: 1860, myStake: 0, myEarned: 0, startAt: '2026-06-15', endAt: '2026-07-15', harvestable: false, risk: 'low', description: 'ZSDX 30 天短期锁仓，APR 32-43%。', tags: ['短期', '锁仓'] },
  { id: 'FARM-015', name: 'LINK 链下质押', type: 'single', status: 'active', tokenA: 'LINK', apr: 12.6, aprBoosted: 16.4, tvl: 1_800_000, tvlCap: 4_000_000, stakers: 240, myStake: 0, myEarned: 0, startAt: '2026-05-20', endAt: '2026-11-20', harvestable: true, risk: 'medium', description: 'LINK 预言机节点质押，APR 12-17%。', tags: ['预言机'] },
  { id: 'FARM-016', name: 'DOT 平行链插槽', type: 'single', status: 'ended', tokenA: 'DOT', apr: 18.4, aprBoosted: 24.2, tvl: 0, tvlCap: 0, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-01-15', endAt: '2026-04-15', harvestable: true, risk: 'medium', description: 'DOT 平行链插槽质押（已结束），APR 18-25%。', tags: ['已结束', 'DOT'] },
  { id: 'FARM-017', name: 'AAVE 借贷挖矿', type: 'single', status: 'active', tokenA: 'AAVE', apr: 16.8, aprBoosted: 22.4, tvl: 2_200_000, tvlCap: 5_000_000, stakers: 460, myStake: 0, myEarned: 0, startAt: '2026-05-25', endAt: '2026-11-25', harvestable: true, risk: 'medium', description: 'AAVE 借贷协议存款挖矿，APR 16-23%。', tags: ['DeFi', '借贷'] },
  { id: 'FARM-018', name: 'UNI 治理挖矿', type: 'single', status: 'upcoming', tokenA: 'UNI', apr: 24.4, aprBoosted: 32.6, tvl: 0, tvlCap: 4_000_000, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-07-25', endAt: '2026-10-23', harvestable: false, risk: 'medium', description: 'UNI 治理代币挖矿（即将开始），APR 24-33%。', tags: ['即将开始', '治理'] },
];

const POOLS: LiquidityPool[] = [
  { id: 'POOL-001', pair: 'ZSDX/USDT', tokenA: 'ZSDX', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 28_000_000, volume24h: 86_000_000, fees24h: 28_400, apr: 42.6, reserveA: 8_400_000, reserveB: 19_600_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-01-15', priceImpact: 0.06, tags: ['平台对', '主流'] },
  { id: 'POOL-002', pair: 'ETH/USDT', tokenA: 'ETH', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 64_000_000, volume24h: 248_000_000, fees24h: 184_000, apr: 28.4, reserveA: 18_400, reserveB: 45_600_000, myLP: 8_400, myShare: 0.013, feeTier: 0.05, createdAt: '2025-12-01', priceImpact: 0.04, tags: ['主流对', '深度好'] },
  { id: 'POOL-003', pair: 'BTC/USDT', tokenA: 'BTC', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 86_000_000, volume24h: 320_000_000, fees24h: 248_000, apr: 24.6, reserveA: 1_280, reserveB: 84_800_000, myLP: 12_400, myShare: 0.014, feeTier: 0.05, createdAt: '2025-11-10', priceImpact: 0.03, tags: ['主流对', '深度好'] },
  { id: 'POOL-004', pair: 'SOL/USDT', tokenA: 'SOL', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 18_000_000, volume24h: 86_000_000, fees24h: 64_000, apr: 64.8, reserveA: 86_400, reserveB: 14_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-02-20', priceImpact: 0.12, tags: ['高波动'] },
  { id: 'POOL-005', pair: 'BNB/USDT', tokenA: 'BNB', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 14_000_000, volume24h: 48_000_000, fees24h: 32_000, apr: 32.4, reserveA: 24_600, reserveB: 14_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-03-01', priceImpact: 0.08, tags: ['BNB 链'] },
  { id: 'POOL-006', pair: 'USDC/USDT', tokenA: 'USDC', tokenB: 'USDT', status: 'active', risk: 'low', tvl: 42_000_000, volume24h: 124_000_000, fees24h: 8_400, apr: 8.6, reserveA: 21_000_000, reserveB: 21_000_000, myLP: 0, myShare: 0, feeTier: 0.01, createdAt: '2025-10-15', priceImpact: 0.01, tags: ['稳定对', '极低风险'] },
  { id: 'POOL-007', pair: 'DAI/USDC', tokenA: 'DAI', tokenB: 'USDC', status: 'active', risk: 'low', tvl: 18_000_000, volume24h: 64_000_000, fees24h: 4_800, apr: 6.4, reserveA: 9_000_000, reserveB: 9_000_000, myLP: 0, myShare: 0, feeTier: 0.01, createdAt: '2025-09-20', priceImpact: 0.01, tags: ['稳定对', '极低风险'] },
  { id: 'POOL-008', pair: 'ARB/USDT', tokenA: 'ARB', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 8_400_000, volume24h: 32_000_000, fees24h: 24_000, apr: 56.4, reserveA: 4_200_000, reserveB: 4_200_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-04-15', priceImpact: 0.14, tags: ['L2', '高波动'] },
  { id: 'POOL-009', pair: 'OP/USDT', tokenA: 'OP', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 4_800_000, volume24h: 18_000_000, fees24h: 14_000, apr: 48.6, reserveA: 2_400_000, reserveB: 2_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-05-01', priceImpact: 0.16, tags: ['L2', '高波动'] },
  { id: 'POOL-010', pair: 'ZSDX/ETH', tokenA: 'ZSDX', tokenB: 'ETH', status: 'active', risk: 'medium', tvl: 12_400_000, volume24h: 24_000_000, fees24h: 18_000, apr: 38.4, reserveA: 3_600_000, reserveB: 2_400, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-04-01', priceImpact: 0.08, tags: ['平台对'] },
  { id: 'POOL-011', pair: 'MATIC/USDT', tokenA: 'MATIC', tokenB: 'USDT', status: 'warming', risk: 'high', tvl: 2_400_000, volume24h: 8_400_000, fees24h: 6_400, apr: 42.6, reserveA: 1_800_000, reserveB: 2_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-07-10', priceImpact: 0.18, tags: ['预热中'] },
  { id: 'POOL-012', pair: 'LINK/ETH', tokenA: 'LINK', tokenB: 'ETH', status: 'active', risk: 'medium', tvl: 4_200_000, volume24h: 8_400_000, fees24h: 6_400, apr: 32.4, reserveA: 84_000, reserveB: 640, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-03-15', priceImpact: 0.10, tags: ['DeFi'] },
];

const DUALS: DualFarm[] = [
  { id: 'DUAL-001', name: 'ZSDX/USDT 双币理财', tokenA: 'ZSDX', tokenB: 'USDT', status: 'active', aprA: 48.4, aprB: 12.6, totalApr: 61.0, tvl: 18_000_000, stakers: 1860, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-06-15', endAt: '2026-07-15', description: 'ZSDX/USDT 双币理财，30 天期，年化 48+12 = 61%，到期按 USDT 结算。', risk: 'medium' },
  { id: 'DUAL-002', name: 'ETH/BTC 双币', tokenA: 'ETH', tokenB: 'BTC', status: 'active', aprA: 24.6, aprB: 18.4, totalApr: 43.0, tvl: 24_000_000, stakers: 1240, duration: 14, myStake: 4_200, myEarnedA: 0.04, myEarnedB: 0.002, startAt: '2026-07-05', endAt: '2026-07-19', description: 'ETH/BTC 14 天双币理财，年化 24+18 = 43%，按较低收益币种结算。', risk: 'medium' },
  { id: 'DUAL-003', name: 'SOL/USDC 双币', tokenA: 'SOL', tokenB: 'USDC', status: 'active', aprA: 64.8, aprB: 8.4, totalApr: 73.2, tvl: 8_400_000, stakers: 480, duration: 21, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-07-01', endAt: '2026-07-22', description: 'SOL/USDC 21 天双币理财，年化 64+8 = 73%，高收益伴随高波动。', risk: 'high' },
  { id: 'DUAL-004', name: 'BNB/DAI 双币', tokenA: 'BNB', tokenB: 'DAI', status: 'active', aprA: 32.4, aprB: 6.4, totalApr: 38.8, tvl: 4_200_000, stakers: 240, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-06-20', endAt: '2026-07-20', description: 'BNB/DAI 30 天双币理财，年化 32+6 = 38%。', risk: 'medium' },
  { id: 'DUAL-005', name: 'ARB/OP 双币', tokenA: 'ARB', tokenB: 'OP', status: 'upcoming', aprA: 56.4, aprB: 48.6, totalApr: 105.0, tvl: 0, stakers: 0, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-07-25', endAt: '2026-08-24', description: 'ARB/OP 30 天双币理财（即将开始），年化 56+48 = 105%。', risk: 'high' },
  { id: 'DUAL-006', name: 'ZSDX/ETH 双币', tokenA: 'ZSDX', tokenB: 'ETH', status: 'ended', aprA: 38.4, aprB: 24.6, totalApr: 63.0, tvl: 0, stakers: 0, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-05-15', endAt: '2026-06-14', description: 'ZSDX/ETH 30 天双币理财（已结束），年化 38+24 = 63%。', risk: 'medium' },
];

const LP_FARMS: LpFarm[] = [
  { id: 'LPF-001', pair: 'ZSDX/USDT', pool: 'POOL-001', status: 'rewarded', baseApr: 18.4, rewardApr: 24.2, totalApr: 42.6, tvl: 28_000_000, myLPValue: 8_400, myEarned: 124.6, impermanentLoss: -2.4, volume24h: 86_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ZSDX/USDT LP 挖矿，年化 42.6%，无常损失 -2.4%。', imbalanced: false },
  { id: 'LPF-002', pair: 'ETH/USDT', pool: 'POOL-002', status: 'rewarded', baseApr: 12.4, rewardApr: 16.0, totalApr: 28.4, tvl: 64_000_000, myLPValue: 12_400, myEarned: 86.4, impermanentLoss: -1.2, volume24h: 248_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ETH/USDT LP 挖矿，年化 28.4%，深度好，无常损失低。', imbalanced: false },
  { id: 'LPF-003', pair: 'BTC/USDT', pool: 'POOL-003', status: 'rewarded', baseApr: 10.2, rewardApr: 14.4, totalApr: 24.6, tvl: 86_000_000, myLPValue: 12_400, myEarned: 64.8, impermanentLoss: -0.8, volume24h: 320_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'BTC/USDT LP 挖矿，年化 24.6%。', imbalanced: false },
  { id: 'LPF-004', pair: 'SOL/USDT', pool: 'POOL-004', status: 'rewarded', baseApr: 28.6, rewardApr: 36.2, totalApr: 64.8, tvl: 18_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 86_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'SOL/USDT LP 挖矿，年化 64.8%（高波动）。', imbalanced: false },
  { id: 'LPF-005', pair: 'BNB/USDT', pool: 'POOL-005', status: 'rewarded', baseApr: 14.2, rewardApr: 18.2, totalApr: 32.4, tvl: 14_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 48_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'BNB/USDT LP 挖矿，年化 32.4%。', imbalanced: false },
  { id: 'LPF-006', pair: 'USDC/USDT', pool: 'POOL-006', status: 'rewarded', baseApr: 4.2, rewardApr: 4.4, totalApr: 8.6, tvl: 42_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 124_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'USDC/USDT 稳定对 LP，年化 8.6%，无常损失几乎为零。', imbalanced: false },
  { id: 'LPF-007', pair: 'DAI/USDC', pool: 'POOL-007', status: 'rewarded', baseApr: 3.2, rewardApr: 3.2, totalApr: 6.4, tvl: 18_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 64_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'DAI/USDC 稳定对 LP，年化 6.4%。', imbalanced: false },
  { id: 'LPF-008', pair: 'ARB/USDT', pool: 'POOL-008', status: 'rewarded', baseApr: 24.2, rewardApr: 32.2, totalApr: 56.4, tvl: 8_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 32_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ARB/USDT LP 挖矿，年化 56.4%（L2 风险）。', imbalanced: false },
  { id: 'LPF-009', pair: 'OP/USDT', pool: 'POOL-009', status: 'rewarded', baseApr: 20.4, rewardApr: 28.2, totalApr: 48.6, tvl: 4_800_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 18_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'OP/USDT LP 挖矿，年化 48.6%。', imbalanced: false },
  { id: 'LPF-010', pair: 'ZSDX/ETH', pool: 'POOL-010', status: 'rewarded', baseApr: 18.4, rewardApr: 20.0, totalApr: 38.4, tvl: 12_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 24_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ZSDX/ETH LP 挖矿，年化 38.4%。', imbalanced: false },
  { id: 'LPF-011', pair: 'MATIC/USDT', pool: 'POOL-011', status: 'rewarded', baseApr: 18.2, rewardApr: 24.4, totalApr: 42.6, tvl: 2_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 8_400_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'MATIC/USDT LP 挖矿（预热中），年化 42.6%。', imbalanced: false },
  { id: 'LPF-012', pair: 'LINK/ETH', pool: 'POOL-012', status: 'imbalanced', baseApr: 14.2, rewardApr: 18.2, totalApr: 32.4, tvl: 4_200_000, myLPValue: 0, myEarned: 0, impermanentLoss: -8.4, volume24h: 8_400_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'LINK/ETH LP 挖矿（比例失衡），年化 32.4%。', imbalanced: true },
  { id: 'LPF-013', pair: 'AVAX/USDT', pool: '-', status: 'deprecated', baseApr: 0, rewardApr: 0, totalApr: 0, tvl: 0, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 0, rewardToken: '-', updatedAt: '2026-06-15', description: 'AVAX/USDT LP（已弃用），不再接受新存款。', imbalanced: false },
  { id: 'LPF-014', pair: 'DOT/USDT', pool: '-', status: 'deprecated', baseApr: 0, rewardApr: 0, totalApr: 0, tvl: 0, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 0, rewardToken: '-', updatedAt: '2026-05-10', description: 'DOT/USDT LP（已弃用），用户可继续提取。', imbalanced: false },
];

const STAKES: StakeRecord[] = [
  { id: 'STK-001', token: 'ZSDX', type: 'flexible', status: 'active', amount: 12_500, apr: 28.4, earned: 184.6, pending: 1.24, startAt: '2026-05-15', endAt: '-', unlockAt: '即时', canUnstake: true, earlyFee: 0, apy: 28.4, validator: 'zsdex-validator-1' },
  { id: 'STK-002', token: 'ETH', type: 'locked_90', status: 'active', amount: 4_200, apr: 14.2, earned: 86.4, pending: 0.48, startAt: '2026-04-20', endAt: '2026-07-19', unlockAt: '2026-07-19 12:00', canUnstake: false, earlyFee: 0.15, apy: 14.2, validator: 'eth2-validator-pool' },
  { id: 'STK-003', token: 'SOL', type: 'flexible', status: 'active', amount: 120, apr: 18.4, earned: 2.84, pending: 0.014, startAt: '2026-06-01', endAt: '-', unlockAt: '即时', canUnstake: true, earlyFee: 0, apy: 18.4, validator: 'jito-sol-validator' },
  { id: 'STK-004', token: 'ZSDX', type: 'locked_30', status: 'active', amount: 8_400, apr: 32.4, earned: 124.6, pending: 0.84, startAt: '2026-06-20', endAt: '2026-07-20', unlockAt: '2026-07-20 12:00', canUnstake: false, earlyFee: 0.10, apy: 32.4, validator: 'zsdex-validator-2' },
  { id: 'STK-005', token: 'BTC', type: 'locked_180', status: 'active', amount: 0.6, apr: 6.4, earned: 0.012, pending: 0.0001, startAt: '2026-05-10', endAt: '2026-11-06', unlockAt: '2026-11-06 12:00', canUnstake: false, earlyFee: 0.20, apy: 6.4, validator: 'babylon-btc-validator' },
  { id: 'STK-006', token: 'ZSDX', type: 'locked_365', status: 'active', amount: 24_000, apr: 124.6, earned: 1248.4, pending: 6.84, startAt: '2026-04-01', endAt: '2027-04-01', unlockAt: '2027-04-01 12:00', canUnstake: false, earlyFee: 0.30, apy: 124.6, validator: 'zsdex-validator-3' },
  { id: 'STK-007', token: 'USDT', type: 'flexible', status: 'unstaking', amount: 4_800, apr: 8.6, earned: 0, pending: 0, startAt: '2026-05-15', endAt: '2026-07-21', unlockAt: '2026-07-23 12:00', canUnstake: false, earlyFee: 0, apy: 8.6, validator: 'usdt-stable-pool' },
  { id: 'STK-008', token: 'AVAX', type: 'locked_30', status: 'expired', amount: 24, apr: 14.6, earned: 0.86, pending: 0, startAt: '2026-05-15', endAt: '2026-06-14', unlockAt: '2026-06-15 12:00', canUnstake: true, earlyFee: 0.10, apy: 14.6, validator: 'avax-validator' },
];

const VAULTS: YieldVault[] = [
  { id: 'VLT-001', name: '稳定币聚合器 USDC', strategy: 'stable', status: 'active', tvl: 86_000_000, apy: 12.4, apy7d: 12.6, apy30d: 11.8, sharpe: 4.2, drawdown: 0.4, myDeposit: 8_400, myEarned: 184.6, risk: 'low', protocols: ['Aave', 'Compound', 'Curve'], rebalanceFreq: '每日', description: '聚合 Aave + Compound + Curve 等稳定币协议，自动再平衡，年化 11-13%。', inception: '2025-08-01' },
  { id: 'VLT-002', name: '蓝筹币均衡组合', strategy: 'balanced', status: 'active', tvl: 64_000_000, apy: 28.4, apy7d: 32.6, apy30d: 26.2, sharpe: 2.4, drawdown: 8.6, myDeposit: 4_200, myEarned: 124.8, risk: 'medium', protocols: ['Uniswap V3', 'Balancer', 'Pendle'], rebalanceFreq: '每周', description: 'BTC + ETH 蓝筹币均衡组合，结合 Uniswap V3 / Balancer / Pendle 等协议，年化 24-32%。', inception: '2025-09-15' },
  { id: 'VLT-003', name: 'Delta 中性做市', strategy: 'delta_neutral', status: 'active', tvl: 28_000_000, apy: 18.6, apy7d: 19.2, apy30d: 17.8, sharpe: 3.6, drawdown: 2.4, myDeposit: 0, myEarned: 0, risk: 'medium', protocols: ['Perpetual', 'Hedge', 'Gmx'], rebalanceFreq: '每 4 小时', description: '永续合约对冲 + 做市策略，Delta 中性，年化 17-20%。', inception: '2025-12-10' },
  { id: 'VLT-004', name: '收益曲线套利', strategy: 'yield_curve', status: 'active', tvl: 18_000_000, apy: 24.6, apy7d: 25.4, apy30d: 22.8, sharpe: 2.8, drawdown: 4.6, myDeposit: 0, myEarned: 0, risk: 'medium', protocols: ['Pendle', 'Element', 'Convex'], rebalanceFreq: '每 3 天', description: '跨协议收益曲线套利（Pendle + Element + Convex），年化 22-26%。', inception: '2026-01-20' },
  { id: 'VLT-005', name: '激进收益组合', strategy: 'aggressive', status: 'paused', tvl: 8_400_000, apy: 64.8, apy7d: 0, apy30d: 58.4, sharpe: 1.2, drawdown: 24.6, myDeposit: 0, myEarned: 0, risk: 'high', protocols: ['Leveraged', 'LST', 'Loop'], rebalanceFreq: '每日', description: '杠杆 + LST + Loop 循环策略（暂停新进），年化 50-80%，高波动。', inception: '2025-10-15' },
];

const BOOSTS: BoostItem[] = [
  { id: 'BST-001', name: 'ZSDX 持币加速卡', type: 'apr', rarity: 'epic', value: 1.5, used: false, expiresAt: '2026-08-15', source: '活动奖励', description: 'ZSDX 单币挖矿加速 50%，持币 ≥ 5,000 ZSDX 可叠加。', applicableTo: ['FARM-001', 'FARM-005', 'FARM-011', 'FARM-014'], acquiredAt: '2026-07-01', stackable: true },
  { id: 'BST-002', name: '新用户加速券', type: 'apr', rarity: 'rare', value: 1.2, used: false, expiresAt: '2026-08-31', source: '新人礼包', description: '任意单币挖矿加速 20%，有效期 60 天。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-003', 'FARM-004'], acquiredAt: '2026-07-15', stackable: true },
  { id: 'BST-003', name: 'LP 多倍奖励卡', type: 'multiplier', rarity: 'legendary', value: 2.0, used: false, expiresAt: '2026-08-01', source: '交易竞赛', description: '指定 LP 池奖励 2 倍，30 天有效。', applicableTo: ['LPF-001', 'LPF-002', 'LPF-003'], acquiredAt: '2026-07-10', stackable: false },
  { id: 'BST-004', name: '空投加成券', type: 'drop', rarity: 'rare', value: 1.3, used: false, expiresAt: '2026-09-30', source: '空投活动', description: '空投奖励加成 30%，叠加空投池使用。', applicableTo: ['POOL-001', 'POOL-002', 'POOL-003'], acquiredAt: '2026-07-20', stackable: true },
  { id: 'BST-005', name: '手续费 5 折券', type: 'fee_discount', rarity: 'common', value: 0.5, used: true, expiresAt: '2026-07-25', source: '周签到', description: '所有存取手续费 5 折，已使用。', applicableTo: ['FARM-001', 'FARM-002'], acquiredAt: '2026-07-10', stackable: false },
  { id: 'BST-006', name: '容量扩容卡', type: 'capacity', rarity: 'epic', value: 2.0, used: false, expiresAt: '2026-08-15', source: 'VIP 权益', description: '个人 TVL 上限扩容 2 倍，钻石 VIP 专享。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-005'], acquiredAt: '2026-07-01', stackable: false },
  { id: 'BST-007', name: '加速卡 1.1 倍', type: 'apr', rarity: 'common', value: 1.1, used: false, expiresAt: '2026-08-20', source: '每日任务', description: '通用挖矿加速 10%。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-003'], acquiredAt: '2026-07-20', stackable: true },
  { id: 'BST-008', name: '稀有加速卡 1.4 倍', type: 'apr', rarity: 'rare', value: 1.4, used: false, expiresAt: '2026-08-10', source: '推荐奖励', description: '推荐获得，挖矿加速 40%。', applicableTo: ['FARM-001', 'FARM-003', 'FARM-005'], acquiredAt: '2026-07-15', stackable: true },
];

const REFS: RefReward[] = [
  { id: 'REF-001', referee: '0xA1B2...C3D4', tier: 'gold', volume: 248_000, commission: 1240, rate: 0.005, status: 'paid', createdAt: '2026-06-15', paidAt: '2026-07-15', source: '现货交易', note: '6 月现货交易返佣' },
  { id: 'REF-002', referee: '0xE5F6...A7B8', tier: 'silver', volume: 86_000, commission: 258, rate: 0.003, status: 'paid', createdAt: '2026-06-18', paidAt: '2026-07-15', source: '合约交易', note: '6 月合约交易返佣' },
  { id: 'REF-003', referee: '0xC9D0...E1F2', tier: 'platinum', volume: 1_240_000, commission: 12400, rate: 0.010, status: 'paid', createdAt: '2026-06-20', paidAt: '2026-07-15', source: '大客户综合', note: '大客户综合返佣' },
  { id: 'REF-004', referee: '0xA3B4...C5D6', tier: 'bronze', volume: 12_400, commission: 12.4, rate: 0.001, status: 'pending', createdAt: '2026-07-18', source: '现货交易', note: '7 月待结算' },
  { id: 'REF-005', referee: '0xE7F8...A9B0', tier: 'gold', volume: 184_000, commission: 920, rate: 0.005, status: 'pending', createdAt: '2026-07-19', source: '挖矿奖励', note: '7 月挖矿返佣待发放' },
  { id: 'REF-006', referee: '0xC1D2...E3F4', tier: 'silver', volume: 48_000, commission: 144, rate: 0.003, status: 'paid', createdAt: '2026-05-20', paidAt: '2026-06-15', source: '现货交易', note: '5 月现货返佣' },
  { id: 'REF-007', referee: '0xA5B6...C7D8', tier: 'diamond', volume: 4_800_000, commission: 72000, rate: 0.015, status: 'pending', createdAt: '2026-07-20', source: '机构大客户', note: '机构综合返佣（待审）' },
  { id: 'REF-008', referee: '0xE9F0...A1B2', tier: 'bronze', volume: 8_400, commission: 0, rate: 0.001, status: 'clawed_back', createdAt: '2026-04-10', source: '异常交易', note: '异常交易，返佣已追回' },
];

const LOCKS: LockStake[] = [
  { id: 'LCK-001', pool: 'ZSDX 365 天期', period: '365d', status: 'active', amount: 24_000, apr: 124.6, bonus: 1848.4, earned: 1248.4, startAt: '2026-04-01', endAt: '2027-04-01', unlockAt: '2027-04-01 12:00', canClaim: false, earlyExitFee: 0.30, vesting: '到期一次性释放' },
  { id: 'LCK-002', pool: 'ZSDX 90 天期', period: '90d', status: 'active', amount: 18_000, apr: 48.6, bonus: 720, earned: 486.4, startAt: '2026-05-15', endAt: '2026-08-13', unlockAt: '2026-08-13 12:00', canClaim: false, earlyExitFee: 0.20, vesting: '到期一次性释放' },
  { id: 'LCK-003', pool: 'ZSDX 180 天期', period: '180d', status: 'active', amount: 8_400, apr: 86.4, bonus: 1248.6, earned: 624.8, startAt: '2026-04-15', endAt: '2026-10-12', unlockAt: '2026-10-12 12:00', canClaim: false, earlyExitFee: 0.25, vesting: '到期一次性释放' },
  { id: 'LCK-004', pool: 'USDT 90 天期', period: '90d', status: 'unlocking', amount: 12_000, apr: 14.8, bonus: 360, earned: 184.6, startAt: '2026-04-20', endAt: '2026-07-19', unlockAt: '2026-07-21 12:00', canClaim: true, earlyExitFee: 0.15, vesting: '已到期，待领取' },
  { id: 'LCK-005', pool: 'ZSDX 30 天期', period: '30d', status: 'active', amount: 4_800, apr: 32.4, bonus: 124, earned: 84.6, startAt: '2026-06-20', endAt: '2026-07-20', unlockAt: '2026-07-20 12:00', canClaim: false, earlyExitFee: 0.10, vesting: '到期一次性释放' },
  { id: 'LCK-006', pool: 'ZSDX 7 天快锁', period: '7d', status: 'active', amount: 2_400, apr: 18.4, bonus: 12.4, earned: 8.4, startAt: '2026-07-14', endAt: '2026-07-21', unlockAt: '2026-07-21 12:00', canClaim: false, earlyExitFee: 0.05, vesting: '到期一次性释放' },
  { id: 'LCK-007', pool: 'ZSDX 90 天期', period: '90d', status: 'claimed', amount: 6_000, apr: 48.6, bonus: 480, earned: 486.4, startAt: '2026-03-15', endAt: '2026-06-13', unlockAt: '2026-06-13 12:00', canClaim: true, earlyExitFee: 0.20, vesting: '已领取' },
  { id: 'LCK-008', pool: 'ZSDX 180 天期', period: '180d', status: 'forfeited', amount: 4_000, apr: 0, bonus: 0, earned: 0, startAt: '2026-01-10', endAt: '2026-07-08', unlockAt: '2026-05-10 12:00', canClaim: false, earlyExitFee: 0.30, vesting: '提前解锁，本金扣除 30%' },
];

const HISTORIES: YieldHistory[] = [
  { id: 'HST-001', type: 'reward', source: 'FARM-001 ZSDX 单币', amount: 1.24, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xa1b2c3d4...', apr: 28.4, note: '每日挖矿奖励发放' },
  { id: 'HST-002', type: 'claim', source: 'FARM-001 ZSDX 单币', amount: 124.6, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 14:24', txHash: '0xb2c3d4e5...', apr: 28.4, note: '手动领取累积奖励' },
  { id: 'HST-003', type: 'reward', source: 'LPF-002 ETH/USDT', amount: 0.014, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xc3d4e5f6...', apr: 28.4, note: 'LP 挖矿每日奖励' },
  { id: 'HST-004', type: 'deposit', source: 'FARM-001 ZSDX 单币', amount: 4_800, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 09:14', txHash: '0xd4e5f6a7...', apr: 28.4, note: '新增存款 4,800 ZSDX' },
  { id: 'HST-005', type: 'lock', source: 'LCK-001 ZSDX 365 天期', amount: 24_000, token: 'ZSDX', status: 'completed', createdAt: '2026-04-01 12:00', txHash: '0xe5f6a7b8...', apr: 124.6, note: '365 天锁仓，APR 124.6%' },
  { id: 'HST-006', type: 'withdraw', source: 'FARM-005 ZSDX 90 天锁仓', amount: 18_000, token: 'ZSDX', status: 'completed', createdAt: '2026-05-15 12:00', txHash: '0xf6a7b8c9...', apr: 48.6, note: '90 天锁仓存款' },
  { id: 'HST-007', type: 'boost', source: 'BST-003 LP 多倍奖励', amount: 86.4, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 14:24', txHash: '0xa7b8c9d0...', apr: 0, note: 'LP 多倍奖励加成' },
  { id: 'HST-008', type: 'ref_bonus', source: '推荐奖励 REF-003', amount: 12_400, token: 'USDT', status: 'completed', createdAt: '2026-07-15 12:00', txHash: '0xb8c9d0e1...', apr: 0, note: '大客户综合返佣发放' },
  { id: 'HST-009', type: 'reward', source: 'DUAL-002 ETH/BTC', amount: 0.04, token: 'ETH', status: 'completed', createdAt: '2026-07-19 12:00', txHash: '0xc9d0e1f2...', apr: 24.6, note: '双币理财到期发放' },
  { id: 'HST-010', type: 'reward', source: 'VLT-001 稳定币聚合器', amount: 12.4, token: 'USDC', status: 'completed', createdAt: '2026-07-21 08:00', txHash: '0xd0e1f2a3...', apr: 12.4, note: '聚合器每日收益' },
  { id: 'HST-011', type: 'claim', source: 'LCK-007 ZSDX 90 天期', amount: 6_486.4, token: 'ZSDX', status: 'completed', createdAt: '2026-06-13 12:00', txHash: '0xe1f2a3b4...', apr: 48.6, note: '90 天锁仓到期领取' },
  { id: 'HST-012', type: 'unlock', source: 'STK-007 USDT 灵活', amount: 4_800, token: 'USDT', status: 'pending', createdAt: '2026-07-21 14:00', txHash: '0xf2a3b4c5...', apr: 8.6, note: '解锁中，T+2 到账' },
  { id: 'HST-013', type: 'reward', source: 'LPF-006 USDC/USDT', amount: 0.84, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xa3b4c5d6...', apr: 8.6, note: '稳定对 LP 奖励' },
  { id: 'HST-014', type: 'reward', source: 'DUAL-001 ZSDX/USDT', amount: 84.6, token: 'ZSDX', status: 'failed', createdAt: '2026-07-20 14:24', txHash: '0xb4c5d6e7...', apr: 48.4, note: '交易滑点过高，已回滚' },
  { id: 'HST-015', type: 'boost', source: 'BST-001 ZSDX 持币加速', amount: 18.4, token: 'ZSDX', status: 'completed', createdAt: '2026-07-15 12:00', txHash: '0xc5d6e7f8...', apr: 0, note: 'ZSDX 持币加速加成' },
];


// ============================================================
// 样式
// ============================================================

const STYLES = `
.yd-stagger > * { animation: yd-fade-in .4s ease-out both; }
.yd-stagger > *:nth-child(1) { animation-delay: 0ms; }
.yd-stagger > *:nth-child(2) { animation-delay: 50ms; }
.yd-stagger > *:nth-child(3) { animation-delay: 100ms; }
.yd-stagger > *:nth-child(4) { animation-delay: 150ms; }
.yd-stagger > *:nth-child(5) { animation-delay: 200ms; }
.yd-stagger > *:nth-child(6) { animation-delay: 250ms; }
.yd-stagger > *:nth-child(7) { animation-delay: 300ms; }
.yd-stagger > *:nth-child(8) { animation-delay: 350ms; }
.yd-stagger > *:nth-child(9) { animation-delay: 400ms; }

@keyframes yd-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes yd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
@keyframes yd-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes yd-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes yd-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes yd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes yd-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes yd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes yd-coin { 0%, 100% { transform: translateY(0) rotateY(0); } 50% { transform: translateY(-8px) rotateY(180deg); } }
@keyframes yd-grow { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes yd-flash { 0%, 100% { background-position: 0 0; } 50% { background-position: 8px 0; } }

.yd-pulse { animation: yd-pulse 2s ease-in-out infinite; }
.yd-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(20,184,129,0.15) 50%, transparent 100%); background-size: 200% 100%; animation: yd-shimmer 2.5s linear infinite; }
.yd-slide-in { animation: yd-slide-in .35s ease-out; }
.yd-bar { transform-origin: left; animation: yd-bar .8s ease-out; }
.yd-float { animation: yd-float 3s ease-in-out infinite; }
.yd-blink { animation: yd-blink 1s steps(2) infinite; }
.yd-spin { animation: yd-spin 4s linear infinite; }
.yd-coin { animation: yd-coin 2.5s ease-in-out infinite; }
.yd-grow { animation: yd-grow .6s ease-out both; }
`;

function KpiCard({ label, value, sub, icon, color, pulse }: { label: string; value: string; sub?: string; icon: React.ReactNode; color?: string; pulse?: boolean }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs" style={{ color: BRAND.textSub }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (color || BRAND.primary) + '20', color: color || BRAND.primary }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: BRAND.text }}>{value}</div>
      {sub && <div className="text-[11px]" style={{ color: pulse ? BRAND.success : BRAND.textMute }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export function PortalYield() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<PoolRisk | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('apr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [drawerFarm, setDrawerFarm] = useState<FarmActivity | null>(null);
  const [drawerPool, setDrawerPool] = useState<LiquidityPool | null>(null);
  const [drawerDual, setDrawerDual] = useState<DualFarm | null>(null);
  const [drawerLp, setDrawerLp] = useState<LpFarm | null>(null);
  const [drawerStake, setDrawerStake] = useState<StakeRecord | null>(null);
  const [drawerVault, setDrawerVault] = useState<YieldVault | null>(null);
  const [drawerBoost, setDrawerBoost] = useState<BoostItem | null>(null);
  const [drawerRef, setDrawerRef] = useState<RefReward | null>(null);
  const [drawerLock, setDrawerLock] = useState<LockStake | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<YieldHistory | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [liveTvl, setLiveTvl] = useState(0);
  const [liveEarned, setLiveEarned] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setLiveTvl(t => t + Math.floor(Math.random() * 80000) + 20000), 3000);
    const t2 = setInterval(() => setLiveEarned(e => e + Math.random() * 2.4), 4000);
    setLiveTvl(248_000_000);
    setLiveEarned(1284.6);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[data-yd-search]');
        el?.focus();
      } else if (e.key === 'Escape') {
        setDrawerFarm(null); setDrawerPool(null); setDrawerDual(null); setDrawerLp(null);
        setDrawerStake(null); setDrawerVault(null); setDrawerBoost(null); setDrawerRef(null);
        setDrawerLock(null); setDrawerHistory(null); setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '总览', icon: <Gauge className="w-3.5 h-3.5" /> },
    { key: 'farm', label: '挖矿', icon: <Sprout className="w-3.5 h-3.5" /> },
    { key: 'pool', label: '流动性池', icon: <Droplets className="w-3.5 h-3.5" /> },
    { key: 'dual', label: '双币挖矿', icon: <Beaker className="w-3.5 h-3.5" /> },
    { key: 'lpfarm', label: 'LP 挖矿', icon: <Coins className="w-3.5 h-3.5" /> },
    { key: 'stake', label: '质押', icon: <Lock className="w-3.5 h-3.5" /> },
    { key: 'vault', label: '聚合器', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'boost', label: '加速卡', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'ref', label: '推荐奖励', icon: <Gift className="w-3.5 h-3.5" /> },
    { key: 'lock', label: '锁仓', icon: <Key className="w-3.5 h-3.5" /> },
    { key: 'history', label: '收益历史', icon: <History className="w-3.5 h-3.5" /> },
    { key: 'help', label: '帮助', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen p-4 md:p-6" style={{ background: BRAND.bg, color: BRAND.text }}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="rounded-2xl p-5 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center yd-float" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}>
                <Sprout className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: BRAND.text }}>流动性挖矿与收益聚合中心</h1>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>P3.49</span>
                </div>
                <p className="text-sm" style={{ color: BRAND.textSub }}>
                  平台聚合 18 挖矿活动 / 12 流动性池 / 6 双币挖矿 / 14 LP 挖矿 / 5 收益聚合器 / 80+ 加速卡 / 5 推荐等级。TVL $2.48 亿，APR 5-186%，
                  月发放奖励 $18.6M，5 档权益等级。覆盖单币质押 / LP 挖矿 / 双币 / 锁仓 / 收益聚合 / 推荐激励 / 加速加成全链路。
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[11px]" style={{ color: BRAND.textSub }}>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCardHover }}>
                  <span className="w-1.5 h-1.5 rounded-full yd-blink" style={{ background: BRAND.success }}></span>
                  <span>TVL {formatUsd(liveTvl)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCardHover }}>
                  <Coins className="w-3 h-3" style={{ color: BRAND.primary }} />
                  <span>已赚 $1,284.6</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 yd-stagger">
              <KpiCard label="总 TVL" value="$2.48亿" sub="30d +18.4%" icon={<DollarSign className="w-4 h-4" />} color={BRAND.primary} pulse />
              <KpiCard label="挖矿活动" value="18" sub="进行中 12 / 即将 4 / 已结束 2" icon={<Sprout className="w-4 h-4" />} color={BRAND.success} />
              <KpiCard label="平均 APR" value="42.8%" sub="最高 186% / 最低 5.2%" icon={<Percent className="w-4 h-4" />} color={BRAND.amber} />
              <KpiCard label="流动性池" value="12" sub="活跃 10 / 预热 2" icon={<Droplets className="w-4 h-4" />} color={BRAND.info} />
              <KpiCard label="活跃用户" value="28,640" sub="30d +4,820" icon={<Users className="w-4 h-4" />} color={BRAND.primary} />
              <KpiCard label="月发放奖励" value="$18.6M" sub="USD 等值 / 7d +12%" icon={<Gift className="w-4 h-4" />} color={BRAND.success} />
            </div>
          </div>

          <div className="rounded-2xl p-2 border flex flex-wrap gap-1" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all" style={{ background: tab === t.key ? BRAND.primaryLt : 'transparent', color: tab === t.key ? BRAND.primary : BRAND.textSub, border: tab === t.key ? '1px solid ' + BRAND.primary : '1px solid transparent' }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl p-5 border min-h-[600px]" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            {tab === 'overview' && <OverviewTab onFarm={setDrawerFarm} onPool={setDrawerPool} onVault={setDrawerVault} onBoost={setDrawerBoost} />}
            {tab === 'farm' && <FarmTab onSelect={setDrawerFarm} />}
            {tab === 'pool' && <PoolTab onSelect={setDrawerPool} />}
            {tab === 'dual' && <DualTab onSelect={setDrawerDual} />}
            {tab === 'lpfarm' && <LpFarmTab onSelect={setDrawerLp} />}
            {tab === 'stake' && <StakeTab onSelect={setDrawerStake} />}
            {tab === 'vault' && <VaultTab onSelect={setDrawerVault} />}
            {tab === 'boost' && <BoostTab onSelect={setDrawerBoost} />}
            {tab === 'ref' && <RefTab onSelect={setDrawerRef} />}
            {tab === 'lock' && <LockTab onSelect={setDrawerLock} />}
            {tab === 'history' && <HistoryTab onSelect={setDrawerHistory} />}
            {tab === 'help' && <HelpTab onOpen={() => setHelpOpen(true)} />}
          </div>
        </div>

        {drawerFarm && <FarmDrawer f={drawerFarm} onClose={() => setDrawerFarm(null)} />}
        {drawerPool && <PoolDrawer p={drawerPool} onClose={() => setDrawerPool(null)} />}
        {drawerDual && <DualDrawer d={drawerDual} onClose={() => setDrawerDual(null)} />}
        {drawerLp && <LpDrawer l={drawerLp} onClose={() => setDrawerLp(null)} />}
        {drawerStake && <StakeDrawer s={drawerStake} onClose={() => setDrawerStake(null)} />}
        {drawerVault && <VaultDrawer v={drawerVault} onClose={() => setDrawerVault(null)} />}
        {drawerBoost && <BoostDrawer b={drawerBoost} onClose={() => setDrawerBoost(null)} />}
        {drawerRef && <RefDrawer r={drawerRef} onClose={() => setDrawerRef(null)} />}
        {drawerLock && <LockDrawer l={drawerLock} onClose={() => setDrawerLock(null)} />}
        {drawerHistory && <HistoryDrawer h={drawerHistory} onClose={() => setDrawerHistory(null)} />}
        {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
      </div>
    </>
  );
}


// ============================================================
// Drawer 通用组件
// ============================================================
function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ background: BRAND.bg, borderBottom: '1px solid ' + BRAND.border }}>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold truncate" style={{ color: BRAND.text }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-1" style={{ color: BRAND.textSub }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} className="ml-3 p-2 rounded-lg hover:scale-110 transition-transform" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
        <X size={16} style={{ color: BRAND.textSub }} />
      </button>
    </div>
  );
}

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}></div>
      <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto yd-slide-in" style={{ background: BRAND.bg, borderLeft: '1px solid ' + BRAND.border }}>
        {children}
      </div>
    </div>
  );
}

function DrawerKv({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
      <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>{label}</div>
      <div className="text-sm font-bold tabular-nums truncate" style={{ color: color || BRAND.text }}>{value}</div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
      <h3 className="text-xs font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h3>
      {children}
    </div>
  );
}

function TokenIcon({ token, size = 40 }: { token: string; size?: number }) {
  const c = TOKEN_COLOR[token] || BRAND.primary;
  return (
    <div className="rounded-lg flex items-center justify-center font-bold text-xs" style={{ width: size, height: size, background: c + '20', color: c, border: '1px solid ' + c + '40' }}>
      {token.substring(0, 3)}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
      <div className="h-full yd-bar" style={{ width: pct + '%', background: color || BRAND.primary }}></div>
    </div>
  );
}

// ============================================================
// TAB 1: Overview 总览
// ============================================================
function OverviewTab({ onFarm, onPool, onVault, onBoost }: { onFarm: (f: FarmActivity) => void; onPool: (p: LiquidityPool) => void; onVault: (v: YieldVault) => void; onBoost: (b: BoostItem) => void }) {
  const featuredFarms = FARMS.filter(f => f.status === 'active').slice(0, 4);
  const featuredPools = POOLS.filter(p => p.status === 'active').slice(0, 4);
  const featuredVaults = VAULTS.filter(v => v.status === 'active');
  const featuredBoosts = BOOSTS.filter(b => !b.used).slice(0, 4);

  return (
    <div className="space-y-4 yd-stagger">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="我的挖矿" value="$12,500" sub="ZSDX 单币 · 灵活" icon={<Sprout className="w-4 h-4" />} color={BRAND.primary} />
        <KpiCard label="累计收益" value="$1,284.6" sub="30d +184.6 USDT" icon={<Coins className="w-4 h-4" />} color={BRAND.success} pulse />
        <KpiCard label="锁仓资产" value="$48,000" sub="365 天期 24K / 90 天期 18K" icon={<Key className="w-4 h-4" />} color={BRAND.amber} />
        <KpiCard label="我的等级" value="黄金 V4" sub="30d +$1,248 距铂金 12K" icon={<Crown className="w-4 h-4" />} color={BRAND.amber} />
      </div>

      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Flame className="w-4 h-4" style={{ color: BRAND.amber }} />热门挖矿活动
          </h3>
          <span className="text-[10px]" style={{ color: BRAND.textMute }}>按 TVL 排序</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {featuredFarms.map(f => (
            <button key={f.id} onClick={() => onFarm(f)} className="rounded-lg p-3 text-left transition-all hover:scale-[1.02]" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
              <div className="flex items-center gap-2 mb-2">
                <TokenIcon token={f.tokenA} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: BRAND.text }}>{f.name}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>TVL {formatUsd(f.tvl)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tabular-nums" style={{ color: BRAND.primary }}>{f.aprBoosted.toFixed(1)}%</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(f.status).bg, color: statusBadge(f.status).color }}>{statusBadge(f.status).label}</span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>加速后年化</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Droplets className="w-4 h-4" style={{ color: BRAND.info }} />深度流动性池
            </h3>
          </div>
          <div className="space-y-2">
            {featuredPools.map(p => (
              <button key={p.id} onClick={() => onPool(p)} className="w-full rounded-lg p-2.5 flex items-center gap-3 transition-all hover:scale-[1.01] text-left" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
                <div className="flex -space-x-2">
                  <TokenIcon token={p.tokenA} size={28} />
                  <TokenIcon token={p.tokenB} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{p.pair}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>TVL {formatUsd(p.tvl)} · 24h 量 {formatUsd(p.volume24h)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.apr.toFixed(1)}%</div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>APR</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
              <Layers className="w-4 h-4" style={{ color: BRAND.success }} />收益聚合器
            </h3>
          </div>
          <div className="space-y-2">
            {featuredVaults.map(v => (
              <button key={v.id} onClick={() => onVault(v)} className="w-full rounded-lg p-2.5 flex items-center gap-3 transition-all hover:scale-[1.01] text-left" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold" style={{ background: BRAND.primaryLt, color: BRAND.primary, border: '1px solid ' + BRAND.primary + '40' }}>{STRATEGY_ICON[v.strategy]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{v.name}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>{statusBadge(v.strategy).label} · TVL {formatUsd(v.tvl)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.success }}>{v.apy.toFixed(1)}%</div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>APY</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
            <Zap className="w-4 h-4" style={{ color: BRAND.amber }} />可用加速卡
          </h3>
          <span className="text-[10px]" style={{ color: BRAND.textMute }}>点击查看详情</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featuredBoosts.map(b => (
            <button key={b.id} onClick={() => onBoost(b)} className="rounded-lg p-3 text-left transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, ' + statusBadge(b.rarity).bg + ' 0%, ' + BRAND.bgCard + ' 100%)', border: '1px solid ' + statusBadge(b.rarity).color + '40' }}>
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-4 h-4 yd-coin" style={{ color: statusBadge(b.rarity).color }} />
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: statusBadge(b.rarity).bg, color: statusBadge(b.rarity).color }}>{statusBadge(b.rarity).label}</span>
              </div>
              <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{b.name}</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: statusBadge(b.rarity).color }}>{b.value}x</div>
              <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{statusBadge(b.type).label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: Farm 挖矿
// ============================================================
function FarmTab({ onSelect }: { onSelect: (f: FarmActivity) => void }) {
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState<PoolRisk | 'all'>('all');
  const [status, setStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('apr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let arr = FARMS.filter(f => (q === '' || f.name.toLowerCase().includes(q.toLowerCase()) || f.tokenA.toLowerCase().includes(q.toLowerCase())));
    if (risk !== 'all') arr = arr.filter(f => f.risk === risk);
    if (status !== 'all') arr = arr.filter(f => f.status === status);
    arr.sort((a, b) => {
      const va = a[sortBy === 'updated' ? 'endAt' : sortBy as keyof FarmActivity] as any;
      const vb = b[sortBy === 'updated' ? 'endAt' : sortBy as keyof FarmActivity] as any;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [q, risk, status, sortBy, sortDir]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border flex flex-wrap items-center gap-2" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <Search className="w-3.5 h-3.5" style={{ color: BRAND.textSub }} />
          <input data-yd-search type="text" placeholder="搜索挖矿活动 / 代币" value={q} onChange={e => setQ(e.target.value)} className="bg-transparent border-none outline-none text-xs flex-1" style={{ color: BRAND.text }} />
          {q && <button onClick={() => setQ('')}><X className="w-3 h-3" style={{ color: BRAND.textSub }} /></button>}
        </div>
        <select value={risk} onChange={e => setRisk(e.target.value as any)} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border, color: BRAND.text }}>
          <option value="all">全部风险</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border, color: BRAND.text }}>
          <option value="all">全部状态</option>
          <option value="active">进行中</option>
          <option value="upcoming">即将开始</option>
          <option value="paused">暂停</option>
          <option value="ended">已结束</option>
        </select>
        <div className="flex items-center gap-1">
          {(['apr', 'tvl', 'name', 'updated'] as SortBy[]).map(s => (
            <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortDir('desc'); } }} className="px-2 py-1 rounded text-[10px]" style={{ background: sortBy === s ? BRAND.primaryLt : 'transparent', color: sortBy === s ? BRAND.primary : BRAND.textSub, border: '1px solid ' + (sortBy === s ? BRAND.primary : BRAND.border) }}>
              {s === 'apr' ? 'APR' : s === 'tvl' ? 'TVL' : s === 'name' ? '名称' : '时间'}
              {sortBy === s && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-3">活动</div>
          <div className="col-span-1 text-right">APR</div>
          <div className="col-span-1 text-right">加速</div>
          <div className="col-span-2 text-right">TVL</div>
          <div className="col-span-1 text-right">参与</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        <div className="divide-y" style={{ borderColor: BRAND.border }}>
          {filtered.map(f => (
            <button key={f.id} onClick={() => onSelect(f)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <TokenIcon token={f.tokenA} size={28} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: BRAND.text }}>{f.name}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>{f.tokenA}{f.tokenB ? '/' + f.tokenB : ''} · {statusBadge(f.type).label}</div>
                </div>
              </div>
              <div className="col-span-1 text-right text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>{f.apr.toFixed(1)}%</div>
              <div className="col-span-1 text-right text-sm font-bold tabular-nums" style={{ color: BRAND.success }}>{f.aprBoosted.toFixed(1)}%</div>
              <div className="col-span-2 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{formatUsd(f.tvl)}<div className="text-[10px]" style={{ color: BRAND.textMute }}>上限 {formatUsd(f.tvlCap)}</div></div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{formatInt(f.stakers)}</div>
              <div className="col-span-2 flex flex-wrap gap-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(f.status).bg, color: statusBadge(f.status).color }}>{statusBadge(f.status).label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: severityColor(f.risk).bg, color: severityColor(f.risk).color }}>{statusBadge(f.risk).label}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: f.status === 'active' ? BRAND.primary : BRAND.bgCardHover, color: f.status === 'active' ? BRAND.onPrimary : BRAND.textMute }}>
                  {f.status === 'active' ? '立即挖矿' : f.status === 'upcoming' ? '订阅提醒' : f.status === 'ended' ? '查看历史' : '已暂停'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-center" style={{ color: BRAND.textMute }}>共 {filtered.length} 个挖矿活动 · APR / TVL 数据为浮动值，仅作技术演示</div>
    </div>
  );
}


// ============================================================
// TAB 3: Pool 流动性池
// ============================================================
function PoolTab({ onSelect }: { onSelect: (p: LiquidityPool) => void }) {
  const [q, setQ] = useState('');
  const [risk, setRisk] = useState<PoolRisk | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('tvl');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let arr = POOLS.filter(p => (q === '' || p.pair.toLowerCase().includes(q.toLowerCase())));
    if (risk !== 'all') arr = arr.filter(p => p.risk === risk);
    arr.sort((a, b) => {
      const va = a[sortBy as keyof LiquidityPool] as any;
      const vb = b[sortBy as keyof LiquidityPool] as any;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [q, risk, sortBy, sortDir]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border flex flex-wrap items-center gap-2" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <Search className="w-3.5 h-3.5" style={{ color: BRAND.textSub }} />
          <input type="text" placeholder="搜索池对" value={q} onChange={e => setQ(e.target.value)} className="bg-transparent border-none outline-none text-xs flex-1" style={{ color: BRAND.text }} />
        </div>
        <select value={risk} onChange={e => setRisk(e.target.value as any)} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border, color: BRAND.text }}>
          <option value="all">全部风险</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
        </select>
        <div className="flex items-center gap-1">
          {(['apr', 'tvl', 'volume'] as SortBy[]).map(s => (
            <button key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortDir('desc'); } }} className="px-2 py-1 rounded text-[10px]" style={{ background: sortBy === s ? BRAND.primaryLt : 'transparent', color: sortBy === s ? BRAND.primary : BRAND.textSub, border: '1px solid ' + (sortBy === s ? BRAND.primary : BRAND.border) }}>
              {s === 'apr' ? 'APR' : s === 'tvl' ? 'TVL' : '24h 量'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 yd-stagger">
        {filtered.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} className="rounded-xl p-4 text-left transition-all hover:scale-[1.02]" style={{ background: BRAND.bgCardHover, border: '1px solid ' + BRAND.border }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex -space-x-2">
                <TokenIcon token={p.tokenA} size={32} />
                <TokenIcon token={p.tokenB} size={32} />
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: severityColor(p.risk).bg, color: severityColor(p.risk).color }}>{statusBadge(p.risk).label}</span>
            </div>
            <div className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>{p.pair}</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>TVL</div><div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.tvl)}</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>24h 量</div><div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.volume24h)}</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>APR</div><div className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{p.apr.toFixed(1)}%</div></div>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.tags.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>#{t}</span>)}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute, borderTop: '1px solid ' + BRAND.border }}>
              <span>费率 {(p.feeTier * 100).toFixed(2)}%</span>
              <span>冲击 {p.priceImpact.toFixed(2)}%</span>
              <span>储备 {formatInt(p.reserveA)}/{formatInt(p.reserveB)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB 4: Dual 双币挖矿
// ============================================================
function DualTab({ onSelect }: { onSelect: (d: DualFarm) => void }) {
  const filtered = DUALS;
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.primary + '40' }}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5" style={{ color: BRAND.primary }} />
          <div className="flex-1 text-[11px]" style={{ color: BRAND.textSub }}>
            双币理财到期按"较低收益"币种结算（如 ZSDX/USDT 双币到期收到 USDT）。高 APR 伴随结算方向风险，请评估后参与。
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 yd-stagger">
        {filtered.map(d => (
          <button key={d.id} onClick={() => onSelect(d)} className="rounded-xl p-4 text-left transition-all hover:scale-[1.01]" style={{ background: BRAND.bgCardHover, border: '1px solid ' + BRAND.border }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{d.name}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(d.status).bg, color: statusBadge(d.status).color }}>{statusBadge(d.status).label}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCard }}>
                <TokenIcon token={d.tokenA} size={20} />
                <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{d.tokenA}</span>
                <span className="text-[10px]" style={{ color: BRAND.primary }}>{d.aprA.toFixed(1)}%</span>
              </div>
              <span style={{ color: BRAND.textMute }}>+</span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCard }}>
                <TokenIcon token={d.tokenB} size={20} />
                <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{d.tokenB}</span>
                <span className="text-[10px]" style={{ color: BRAND.info }}>{d.aprB.toFixed(1)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>总年化</div><div className="text-lg font-bold tabular-nums" style={{ color: BRAND.primary }}>{d.totalApr.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>TVL</div><div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(d.tvl)}</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>参与</div><div className="text-xs font-bold tabular-nums" style={{ color: BRAND.text }}>{formatInt(d.stakers)}</div></div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-2" style={{ color: BRAND.textMute, borderTop: '1px solid ' + BRAND.border }}>
              <span>周期 {d.duration} 天</span>
              <span>风险 {statusBadge(d.risk).label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB 5: LpFarm LP 挖矿
// ============================================================
function LpFarmTab({ onSelect }: { onSelect: (l: LpFarm) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border" style={{ background: 'rgba(255,169,64,0.05)', borderColor: BRAND.amber + '40' }}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: BRAND.amber }} />
          <div className="flex-1 text-[11px]" style={{ color: BRAND.textSub }}>
            LP 挖矿存在无常损失（IL）风险，币价波动越大 IL 越高。稳定币对 IL 接近 0，跨币对 IL 显著。
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-3">池对</div>
          <div className="col-span-1 text-right">基础</div>
          <div className="col-span-1 text-right">奖励</div>
          <div className="col-span-1 text-right">总年化</div>
          <div className="col-span-2 text-right">TVL</div>
          <div className="col-span-1 text-right">IL</div>
          <div className="col-span-1">状态</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        <div className="yd-stagger">
          {LP_FARMS.map(l => (
            <button key={l.id} onClick={() => onSelect(l)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className="flex -space-x-2">
                  <TokenIcon token={l.pair.split('/')[0]} size={24} />
                  <TokenIcon token={l.pair.split('/')[1]} size={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{l.pair}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>奖励 {l.rewardToken}</div>
                </div>
              </div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{l.baseApr.toFixed(1)}%</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.info }}>+{l.rewardApr.toFixed(1)}%</div>
              <div className="col-span-1 text-right text-sm font-bold tabular-nums" style={{ color: BRAND.primary }}>{l.totalApr.toFixed(1)}%</div>
              <div className="col-span-2 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{formatUsd(l.tvl)}</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: l.impermanentLoss < -3 ? BRAND.danger : l.impermanentLoss < 0 ? BRAND.amber : BRAND.textMute }}>{l.impermanentLoss === 0 ? '-' : l.impermanentLoss.toFixed(1) + '%'}</div>
              <div className="col-span-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(l.status).bg, color: statusBadge(l.status).color }}>{statusBadge(l.status).label}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: l.status === 'rewarded' ? BRAND.primary : l.status === 'imbalanced' ? BRAND.amber : BRAND.bgCardHover, color: l.status === 'rewarded' ? BRAND.onPrimary : l.status === 'imbalanced' ? BRAND.onPrimary : BRAND.textMute }}>
                  {l.status === 'rewarded' ? '添加 LP' : l.status === 'imbalanced' ? '查看详情' : l.status === 'deprecated' ? '仅提取' : '已停止'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 6: Stake 质押
// ============================================================
function StakeTab({ onSelect }: { onSelect: (s: StakeRecord) => void }) {
  const totals = useMemo(() => {
    const t = STAKES.reduce((acc, s) => ({ amount: acc.amount + s.amount, earned: acc.earned + s.earned, pending: acc.pending + s.pending }), { amount: 0, earned: 0, pending: 0 });
    return t;
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 yd-stagger">
        <KpiCard label="我的总质押" value={formatInt(totals.amount) + ' 代币'} sub="8 个活跃记录" icon={<Lock className="w-4 h-4" />} color={BRAND.primary} />
        <KpiCard label="累计收益" value={formatUsd(totals.earned)} sub="已发放 / 已领取" icon={<Coins className="w-4 h-4" />} color={BRAND.success} pulse />
        <KpiCard label="待领收益" value={totals.pending.toFixed(3)} sub="下次发放 04:00 UTC" icon={<Hourglass className="w-4 h-4" />} color={BRAND.amber} />
        <KpiCard label="平均 APR" value="36.4%" sub="加权平均" icon={<Percent className="w-4 h-4" />} color={BRAND.info} />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-2">代币 / 类型</div>
          <div className="col-span-1 text-right">数量</div>
          <div className="col-span-1 text-right">APR</div>
          <div className="col-span-1 text-right">已赚</div>
          <div className="col-span-1 text-right">待领</div>
          <div className="col-span-2">解锁</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        <div className="yd-stagger">
          {STAKES.map(s => (
            <button key={s.id} onClick={() => onSelect(s)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                <TokenIcon token={s.token} size={28} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{s.token}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textSub }}>{statusBadge(s.type).label}</div>
                </div>
              </div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{s.amount.toLocaleString()}</div>
              <div className="col-span-1 text-right text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{s.apr.toFixed(1)}%</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.success }}>{s.earned.toFixed(3)}</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.amber }}>{s.pending.toFixed(3)}</div>
              <div className="col-span-2 text-[10px]" style={{ color: BRAND.textSub }}>
                {s.canUnstake ? '即时' : s.unlockAt}
                {s.earlyFee > 0 && <div style={{ color: BRAND.danger }}>提前解押 {(s.earlyFee * 100).toFixed(0)}% 费</div>}
              </div>
              <div className="col-span-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(s.status).bg, color: statusBadge(s.status).color }}>{statusBadge(s.status).label}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: s.canUnstake ? BRAND.primary : BRAND.bgCardHover, color: s.canUnstake ? BRAND.onPrimary : BRAND.textMute }}>
                  {s.canUnstake ? '领取 / 解押' : '等待解锁'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 7: Vault 聚合器
// ============================================================
function VaultTab({ onSelect }: { onSelect: (v: YieldVault) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border" style={{ background: 'rgba(68,219,244,0.05)', borderColor: BRAND.info + '40' }}>
        <div className="flex items-start gap-2">
          <Layers className="w-4 h-4 mt-0.5" style={{ color: BRAND.info }} />
          <div className="flex-1 text-[11px]" style={{ color: BRAND.textSub }}>
            收益聚合器自动调度多协议（Uniswap + Aave + Compound + Curve + Pendle 等），按策略再平衡。历史业绩不预示未来表现。
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 yd-stagger">
        {VAULTS.map(v => (
          <button key={v.id} onClick={() => onSelect(v)} className="rounded-xl p-4 text-left transition-all hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, ' + BRAND.bgCardHover + ' 0%, ' + BRAND.bgCard + ' 100%)', border: '1px solid ' + BRAND.border }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold yd-float" style={{ background: BRAND.primaryLt, color: BRAND.primary, border: '1px solid ' + BRAND.primary + '40' }}>{STRATEGY_ICON[v.strategy]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{v.name}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(v.strategy).bg, color: statusBadge(v.strategy).color }}>{statusBadge(v.strategy).label}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textSub }}>运行 {v.inception} · 调仓 {v.rebalanceFreq}</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(v.status).bg, color: statusBadge(v.status).color }}>{statusBadge(v.status).label}</span>
            </div>
            <p className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>{v.description}</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>APY</div><div className="text-base font-bold tabular-nums" style={{ color: BRAND.primary }}>{v.apy.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>7d</div><div className="text-xs tabular-nums" style={{ color: BRAND.text }}>{v.apy7d.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>30d</div><div className="text-xs tabular-nums" style={{ color: BRAND.text }}>{v.apy30d.toFixed(1)}%</div></div>
              <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>夏普</div><div className="text-xs tabular-nums" style={{ color: BRAND.success }}>{v.sharpe.toFixed(2)}</div></div>
            </div>
            <div className="flex items-center justify-between mb-2 text-[10px]">
              <span style={{ color: BRAND.textMute }}>TVL {formatUsd(v.tvl)} · 回撤 {v.drawdown.toFixed(1)}%</span>
              <span style={{ color: BRAND.textMute }}>风险 {statusBadge(v.risk).label}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {v.protocols.map((p, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{p}</span>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB 8: Boost 加速卡
// ============================================================
function BoostTab({ onSelect }: { onSelect: (b: BoostItem) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 yd-stagger">
        <KpiCard label="持卡数量" value="8" sub="已用 1 / 未用 7" icon={<Zap className="w-4 h-4" />} color={BRAND.primary} />
        <KpiCard label="最高倍率" value="2.0x" sub="LP 多倍奖励卡" icon={<Sparkles className="w-4 h-4" />} color={BRAND.amber} />
        <KpiCard label="加速叠加" value="5 张可叠加" sub="APR / DROP / 通用类" icon={<Layers className="w-4 h-4" />} color={BRAND.info} />
        <KpiCard label="即将过期" value="2 张" sub="30 天内" icon={<Hourglass className="w-4 h-4" />} color={BRAND.danger} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 yd-stagger">
        {BOOSTS.map(b => (
          <button key={b.id} onClick={() => onSelect(b)} className="rounded-xl p-4 text-left transition-all hover:scale-105 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, ' + statusBadge(b.rarity).bg + ' 0%, ' + BRAND.bgCard + ' 100%)', border: '1px solid ' + statusBadge(b.rarity).color + '60' }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: statusBadge(b.rarity).color, filter: 'blur(20px)' }}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <Zap className="w-8 h-8 yd-coin" style={{ color: statusBadge(b.rarity).color }} />
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: statusBadge(b.rarity).bg, color: statusBadge(b.rarity).color }}>{statusBadge(b.rarity).label}</span>
                  {b.used && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(112,112,112,0.10)', color: BRAND.textMute }}>已使用</span>}
                </div>
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{b.name}</div>
              <div className="text-2xl font-bold tabular-nums mb-2" style={{ color: statusBadge(b.rarity).color }}>{b.value}x</div>
              <div className="text-[10px] mb-2" style={{ color: BRAND.textSub }}>{b.description}</div>
              <div className="flex items-center justify-between text-[10px] pt-2" style={{ borderTop: '1px solid ' + BRAND.border, color: BRAND.textMute }}>
                <span>类型 {statusBadge(b.type).label}</span>
                <span>到期 {b.expiresAt}</span>
              </div>
              {b.stackable && (
                <div className="mt-2 text-[10px] flex items-center gap-1" style={{ color: BRAND.success }}>
                  <CheckCircle className="w-3 h-3" />可叠加
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB 9: Ref 推荐奖励
// ============================================================
function RefTab({ onSelect }: { onSelect: (r: RefReward) => void }) {
  const total = REFS.reduce((a, b) => a + b.commission, 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 yd-stagger">
        <KpiCard label="累计返佣" value={formatUsd(total)} sub="5 个等级 / 8 条记录" icon={<Gift className="w-4 h-4" />} color={BRAND.primary} pulse />
        <KpiCard label="我的等级" value="黄金 V3" sub="返佣 0.5% / 30d" icon={<Crown className="w-4 h-4" />} color={BRAND.amber} />
        <KpiCard label="待发放" value={formatUsk(73920)} sub="3 条待结算" icon={<Hourglass className="w-4 h-4" />} color={BRAND.info} />
        <KpiCard label="已发放" value={formatUsd(14080)} sub="5 条已结算" icon={<CheckCircle className="w-4 h-4" />} color={BRAND.success} />
      </div>

      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>推荐等级权益</h3>
        <div className="grid grid-cols-5 gap-2 yd-stagger">
          {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as RefTier[]).map(t => (
            <div key={t} className="rounded-lg p-3 text-center" style={{ background: statusBadge(t).bg, border: '1px solid ' + statusBadge(t).color + '40' }}>
              <Crown className="w-5 h-5 mx-auto mb-1" style={{ color: statusBadge(t).color }} />
              <div className="text-xs font-semibold" style={{ color: statusBadge(t).color }}>{statusBadge(t).label}</div>
              <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>{TIER_MULT[t].toFixed(1)}x 倍率</div>
              <div className="text-[10px] tabular-nums" style={{ color: BRAND.text }}>{(TIER_MULT[t] * 0.1).toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-3">被推荐人</div>
          <div className="col-span-2">等级</div>
          <div className="col-span-2 text-right">成交量</div>
          <div className="col-span-1 text-right">费率</div>
          <div className="col-span-2 text-right">返佣</div>
          <div className="col-span-1">状态</div>
          <div className="col-span-1 text-right">操作</div>
        </div>
        <div className="yd-stagger">
          {REFS.map(r => (
            <button key={r.id} onClick={() => onSelect(r)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: BRAND.primaryLt, color: BRAND.primary, border: '1px solid ' + BRAND.primary + '40' }}><User className="w-3.5 h-3.5" /></div>
                <div className="min-w-0">
                  <div className="text-xs font-mono truncate" style={{ color: BRAND.text }}>{r.referee}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>{r.source}</div>
                </div>
              </div>
              <div className="col-span-2"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(r.tier).bg, color: statusBadge(r.tier).color }}>{statusBadge(r.tier).label} · {(r.rate * 100).toFixed(2)}%</span></div>
              <div className="col-span-2 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{formatUsd(r.volume)}</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.textMute }}>{(r.rate * 100).toFixed(2)}%</div>
              <div className="col-span-2 text-right text-xs font-bold tabular-nums" style={{ color: BRAND.success }}>{formatUsd(r.commission)}</div>
              <div className="col-span-1"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(r.status).bg, color: statusBadge(r.status).color }}>{statusBadge(r.status).label}</span></div>
              <div className="col-span-1 text-right text-[10px]" style={{ color: BRAND.textMute }}>{r.createdAt}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatUsk(n: number): string {
  return formatUsd(n);
}


// ============================================================
// TAB 10: Lock 锁仓
// ============================================================
function LockTab({ onSelect }: { onSelect: (l: LockStake) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.primary + '40' }}>
        <div className="flex items-start gap-2">
          <Key className="w-4 h-4 mt-0.5" style={{ color: BRAND.primary }} />
          <div className="flex-1 text-[11px]" style={{ color: BRAND.textSub }}>
            锁仓周期越长，APR / 加速加成越高。提前解锁将按 5%-30% 不等比例扣除本金，罚没部分归保险池。
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-3">池子</div>
          <div className="col-span-1 text-right">数量</div>
          <div className="col-span-1 text-right">APR</div>
          <div className="col-span-1 text-right">已赚</div>
          <div className="col-span-2">到期</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-1 text-right">提前解锁</div>
          <div className="col-span-1 text-right">操作</div>
        </div>
        <div className="yd-stagger">
          {LOCKS.map(l => (
            <button key={l.id} onClick={() => onSelect(l)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-3 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: BRAND.text }}>{l.pool}</div>
                <div className="text-[10px]" style={{ color: BRAND.textSub }}>周期 {l.period} · {l.vesting}</div>
              </div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.text }}>{l.amount.toLocaleString()}</div>
              <div className="col-span-1 text-right text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{l.apr.toFixed(1)}%</div>
              <div className="col-span-1 text-right text-xs tabular-nums" style={{ color: BRAND.success }}>{l.earned.toFixed(1)}</div>
              <div className="col-span-2 text-[10px]" style={{ color: BRAND.textSub }}>{l.endAt}</div>
              <div className="col-span-2"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(l.status).bg, color: statusBadge(l.status).color }}>{statusBadge(l.status).label}</span></div>
              <div className="col-span-1 text-right text-[10px] tabular-nums" style={{ color: l.earlyExitFee > 0 ? BRAND.danger : BRAND.textMute }}>{(l.earlyExitFee * 100).toFixed(0)}%</div>
              <div className="col-span-1 text-right">
                <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: l.canClaim ? BRAND.success : BRAND.bgCardHover, color: l.canClaim ? BRAND.onPrimary : BRAND.textMute }}>
                  {l.canClaim ? '领取' : '锁定中'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 11: History 收益历史
// ============================================================
function HistoryTab({ onSelect }: { onSelect: (h: YieldHistory) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = useMemo(() => filter === 'all' ? HISTORIES : HISTORIES.filter(h => h.type === filter), [filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'reward', 'claim', 'deposit', 'withdraw', 'lock', 'unlock', 'boost', 'ref_bonus'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: filter === t ? BRAND.primaryLt : BRAND.bgCardHover, color: filter === t ? BRAND.primary : BRAND.textSub, border: '1px solid ' + (filter === t ? BRAND.primary : BRAND.border) }}>
            {t === 'all' ? '全部' : statusBadge(t).label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold" style={{ color: BRAND.textSub, borderBottom: '1px solid ' + BRAND.border, background: BRAND.bgCard }}>
          <div className="col-span-1">ID</div>
          <div className="col-span-1">类型</div>
          <div className="col-span-3">来源</div>
          <div className="col-span-2 text-right">数量</div>
          <div className="col-span-2">时间</div>
          <div className="col-span-1">状态</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        <div className="yd-stagger">
          {filtered.map(h => (
            <button key={h.id} onClick={() => onSelect(h)} className="w-full grid grid-cols-12 gap-2 px-4 py-2.5 text-left items-center transition-all hover:scale-[1.005]" style={{ borderTop: '1px solid ' + BRAND.border }}>
              <div className="col-span-1 text-[10px] font-mono" style={{ color: BRAND.textMute }}>{h.id}</div>
              <div className="col-span-1"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(h.type).bg, color: statusBadge(h.type).color }}>{statusBadge(h.type).label}</span></div>
              <div className="col-span-3 min-w-0">
                <div className="text-xs truncate" style={{ color: BRAND.text }}>{h.source}</div>
                <div className="text-[10px] font-mono truncate" style={{ color: BRAND.textMute }}>{h.txHash}</div>
              </div>
              <div className="col-span-2 text-right text-xs font-bold tabular-nums" style={{ color: statusBadge(h.type).color }}>{h.type === 'withdraw' || h.type === 'claim' || h.type === 'unlock' ? '-' : '+'}{h.amount.toLocaleString()} {h.token}</div>
              <div className="col-span-2 text-[10px]" style={{ color: BRAND.textSub }}>{h.createdAt}</div>
              <div className="col-span-1"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBadge(h.status).bg, color: statusBadge(h.status).color }}>{statusBadge(h.status).label}</span></div>
              <div className="col-span-2 text-right text-[10px]" style={{ color: BRAND.primary }}>查看详情 →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 12: Help 帮助
// ============================================================
function HelpTab({ onOpen }: { onOpen: () => void }) {
  const faqs = [
    { q: '什么是流动性挖矿？', a: '流动性挖矿指将代币存入智能合约提供流动性，获得交易手续费分成 + 平台代币奖励的收益方式。年化为浮动值，不构成收益承诺。' },
    { q: 'APR 与 APY 区别？', a: 'APR（年化利率）单利计算，APY（年化收益率）按复利累计。聚合器通常按 APY 展示，需注意再投频率假设。' },
    { q: '什么是无常损失（IL）？', a: 'LP 持仓相对单边持仓的潜在损失，源于池内资产比例再平衡。稳定币对 IL 接近 0，跨币对 IL 显著（>5%）。' },
    { q: '双币理财如何结算？', a: '到期按收益较低币种结算（如 ZSDX/USDT 双币到 USDT）。若 ZSDX 表现弱于 USDT，到期本金+收益均按 USDT 计价。' },
    { q: '锁仓提前解锁会怎样？', a: '按周期扣除 5%-30% 本金作为解锁罚没，罚没部分归保险池用于赔付平台风险事件。已发收益不受影响。' },
    { q: '加速卡如何使用？', a: '在挖矿活动页面点击"使用加速卡"，对当前持仓叠加。可叠加的卡可同时使用，但同类型只生效最高倍率。' },
    { q: '推荐奖励何时发放？', a: '月度结算，次月 15 日发放。被推荐人交易后产生的手续费按等级返佣比例（0.1%-1.5%）发放到推荐人账户。' },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4 border" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.bgCard + ' 100%)', borderColor: BRAND.primary + '40' }}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6" style={{ color: BRAND.primary }} />
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>挖矿与收益聚合常见问题</h3>
        </div>
        <p className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>以下内容为技术能力说明，不构成投资建议。挖矿 / 流动性 / 收益聚合均为高风险活动，请评估自身风险承受能力后参与。</p>
        <button onClick={onOpen} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>打开帮助中心</button>
      </div>

      <div className="space-y-2 yd-stagger">
        {faqs.map((f, i) => (
          <details key={i} className="rounded-xl p-4 border" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
            <summary className="cursor-pointer text-sm font-semibold flex items-center justify-between" style={{ color: BRAND.text }}>
              <span className="flex items-center gap-2"><Lightbulb className="w-4 h-4" style={{ color: BRAND.amber }} />{f.q}</span>
              <ChevronRight className="w-4 h-4" style={{ color: BRAND.textSub }} />
            </summary>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: BRAND.textSub }}>{f.a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-xl p-4 border grid grid-cols-1 md:grid-cols-3 gap-3" style={{ background: BRAND.bgCardHover, borderColor: BRAND.border }}>
        <div className="rounded-lg p-3" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <BookOpen className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
          <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>挖矿入门指南</div>
          <p className="text-[10px]" style={{ color: BRAND.textSub }}>了解单币挖矿 / LP 挖矿 / 双币 / 锁仓 / 聚合器等基础概念。</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <Shield className="w-5 h-5 mb-2" style={{ color: BRAND.amber }} />
          <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>风险提示</div>
          <p className="text-[10px]" style={{ color: BRAND.textSub }}>无常损失 / 智能合约 / 市场波动 / 锁仓流动性等风险说明。</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <Calculator className="w-5 h-5 mb-2" style={{ color: BRAND.info }} />
          <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>收益计算器</div>
          <p className="text-[10px]" style={{ color: BRAND.textSub }}>输入本金 / 周期 / APR 自动计算预期收益（仅供参考）。</p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// DRAWER 1: Farm
// ============================================================
function FarmDrawer({ f, onClose }: { f: FarmActivity; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={f.name} subtitle={f.id + ' · ' + statusBadge(f.type).label} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <TokenIcon token={f.tokenA} size={56} />
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{f.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{f.tokenA}{f.tokenB ? ' / ' + f.tokenB : ''} · {statusBadge(f.status).label}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {f.tags.map((t, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>#{t}</span>)}
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: BRAND.textSub }}>{f.description}</p>

        <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: BRAND.textSub }}>基础年化</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: BRAND.text }}>{f.apr.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: BRAND.textSub }}>加速后年化</span>
            <span className="text-2xl font-bold tabular-nums yd-float" style={{ color: BRAND.primary }}>{f.aprBoosted.toFixed(2)}%</span>
          </div>
          <div className="text-[10px]" style={{ color: BRAND.textMute }}>可叠加加速卡以获得更高收益</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="TVL" value={formatUsd(f.tvl)} color={BRAND.primary} />
          <DrawerKv label="TVL 上限" value={formatUsd(f.tvlCap)} />
          <DrawerKv label="参与人数" value={formatInt(f.stakers)} color={BRAND.success} />
          <DrawerKv label="风险等级" value={statusBadge(f.risk).label} color={severityColor(f.risk).color} />
          <DrawerKv label="开始" value={f.startAt} />
          <DrawerKv label="结束" value={f.endAt} />
          <DrawerKv label="可领取" value={f.harvestable ? '是' : '否'} color={f.harvestable ? BRAND.success : BRAND.textMute} />
          <DrawerKv label="活动 ID" value={f.id} />
        </div>

        {f.myStake > 0 && (
          <DrawerSection title="我的持仓">
            <div className="grid grid-cols-3 gap-3">
              <DrawerKv label="我的存入" value={f.myStake.toLocaleString() + ' ' + f.tokenA} color={BRAND.primary} />
              <DrawerKv label="累计收益" value={f.myEarned.toLocaleString() + ' ' + f.tokenA} color={BRAND.success} />
              <DrawerKv label="待领取" value="0.86" color={BRAND.amber} />
            </div>
          </DrawerSection>
        )}

        <DrawerSection title="操作区">
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }} disabled={f.status !== 'active'}>立即存入</button>
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.bgCard, color: BRAND.text, border: '1px solid ' + BRAND.border }}>使用加速卡</button>
          </div>
        </DrawerSection>

        <DrawerSection title="风险与提示">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 收益为浮动值，过往业绩不预示未来表现；</li>
            <li>· APR 数据每 60 秒刷新，实际收益以链上结算为准；</li>
            <li>· 智能合约风险由审计机构评估，但不排除极端情况；</li>
            <li>· 活动到期未提取将自动结算至钱包。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 2: Pool
// ============================================================
function PoolDrawer({ p, onClose }: { p: LiquidityPool; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={p.pair} subtitle={p.id + ' · 流动性池'} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <TokenIcon token={p.tokenA} size={48} />
            <TokenIcon token={p.tokenB} size={48} />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{p.pair}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>费率 {(p.feeTier * 100).toFixed(2)}% · 风险 {statusBadge(p.risk).label}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {p.tags.map((t, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>#{t}</span>)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="TVL" value={formatUsd(p.tvl)} color={BRAND.primary} />
          <DrawerKv label="24h 量" value={formatUsd(p.volume24h)} color={BRAND.success} />
          <DrawerKv label="24h 手续费" value={formatUsd(p.fees24h)} color={BRAND.amber} />
          <DrawerKv label="APR" value={p.apr.toFixed(2) + '%'} color={BRAND.primary} />
          <DrawerKv label="储备 A" value={formatInt(p.reserveA) + ' ' + p.tokenA} />
          <DrawerKv label="储备 B" value={formatInt(p.reserveB) + ' ' + p.tokenB} />
          <DrawerKv label="价格冲击" value={p.priceImpact.toFixed(2) + '%'} color={p.priceImpact > 0.1 ? BRAND.amber : BRAND.success} />
          <DrawerKv label="创建时间" value={p.createdAt} />
        </div>

        {p.myLP > 0 && (
          <DrawerSection title="我的 LP 持仓">
            <div className="grid grid-cols-3 gap-3">
              <DrawerKv label="LP 价值" value={formatUsd(p.myLP)} color={BRAND.primary} />
              <DrawerKv label="份额" value={(p.myShare * 100).toFixed(4) + '%'} />
              <DrawerKv label="累计收益" value="84.6 USDT" color={BRAND.success} />
            </div>
          </DrawerSection>
        )}

        <DrawerSection title="池子状态">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>状态：</span><span style={{ color: statusBadge(p.status).color }}>{statusBadge(p.status).label}</span></div>
            <div><span style={{ color: BRAND.textSub }}>创建：</span><span style={{ color: BRAND.text }}>{p.createdAt}</span></div>
            <div><span style={{ color: BRAND.textSub }}>深度评级：</span><span style={{ color: BRAND.success }}>{p.tvl > 50_000_000 ? 'A+' : p.tvl > 20_000_000 ? 'A' : 'B'}</span></div>
            <div><span style={{ color: BRAND.textSub }}>无常损失评估：</span><span style={{ color: p.risk === 'low' ? BRAND.success : p.risk === 'medium' ? BRAND.amber : BRAND.danger }}>{p.risk === 'low' ? '低' : p.risk === 'medium' ? '中' : '高'}</span></div>
          </div>
        </DrawerSection>

        <DrawerSection title="操作区">
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>添加流动性</button>
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.bgCard, color: BRAND.text, border: '1px solid ' + BRAND.border }}>兑换</button>
          </div>
        </DrawerSection>

        <DrawerSection title="风险与提示">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 流动性池存在无常损失（IL）风险，币价波动越大 IL 越高；</li>
            <li>· 池子深度决定交易冲击，深度越深冲击越小；</li>
            <li>· 稳定币对 IL 接近 0，跨币对 IL 显著（&gt;5%）；</li>
            <li>· 实际收益 = 手续费分成 + 平台奖励 - IL。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 3: Dual
// ============================================================
function DualDrawer({ d, onClose }: { d: DualFarm; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={d.name} subtitle={d.id + ' · 双币理财'} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TokenIcon token={d.tokenA} size={40} />
          <span className="text-2xl font-bold" style={{ color: BRAND.textSub }}>+</span>
          <TokenIcon token={d.tokenB} size={40} />
          <div className="flex-1 ml-2">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{d.tokenA} / {d.tokenB}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>周期 {d.duration} 天 · 风险 {statusBadge(d.risk).label}</div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(d.status).bg, color: statusBadge(d.status).color }}>{statusBadge(d.status).label}</span>
        </div>

        <p className="text-sm" style={{ color: BRAND.textSub }}>{d.description}</p>

        <div className="rounded-xl p-3 grid grid-cols-2 gap-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.infoLt + ' 100%)' }}>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>{d.tokenA} 年化</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{d.aprA.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>{d.tokenB} 年化</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: BRAND.info }}>{d.aprB.toFixed(2)}%</div>
          </div>
          <div className="col-span-2 pt-2" style={{ borderTop: '1px solid ' + BRAND.border }}>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>合计年化</div>
            <div className="text-3xl font-bold tabular-nums yd-float" style={{ color: BRAND.success }}>{d.totalApr.toFixed(2)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="TVL" value={formatUsd(d.tvl)} color={BRAND.primary} />
          <DrawerKv label="参与" value={formatInt(d.stakers)} color={BRAND.success} />
          <DrawerKv label="周期" value={d.duration + ' 天'} />
          <DrawerKv label="结算方向" value={d.tokenB} color={BRAND.amber} />
          <DrawerKv label="开始" value={d.startAt} />
          <DrawerKv label="结束" value={d.endAt} />
        </div>

        {d.myStake > 0 && (
          <DrawerSection title="我的持仓">
            <div className="grid grid-cols-3 gap-3">
              <DrawerKv label="本金" value={d.myStake.toLocaleString() + ' ' + d.tokenA} />
              <DrawerKv label={d.tokenA + ' 收益'} value={d.myEarnedA.toString()} color={BRAND.primary} />
              <DrawerKv label={d.tokenB + ' 收益'} value={d.myEarnedB.toString()} color={BRAND.info} />
            </div>
          </DrawerSection>
        )}

        <DrawerSection title="结算规则">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 到期按 <span style={{ color: BRAND.amber, fontWeight: 600 }}>{d.tokenB}</span> 结算（收益较低币种）；</li>
            <li>· 本金 + 收益均以 {d.tokenB} 计价发放；</li>
            <li>· 若 {d.tokenA} 表现弱于 {d.tokenB}，投资者承担换汇损失；</li>
            <li>· 提前赎回按 0.5% 扣除手续费（仅在极端情况下）。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 4: Lp
// ============================================================
function LpDrawer({ l, onClose }: { l: LpFarm; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={l.pair + ' LP'} subtitle={l.id + ' · LP 挖矿'} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <TokenIcon token={l.pair.split('/')[0]} size={48} />
            <TokenIcon token={l.pair.split('/')[1]} size={48} />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{l.pair} LP 挖矿</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>关联池 {l.pool} · 奖励 {l.rewardToken}</div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(l.status).bg, color: statusBadge(l.status).color }}>{statusBadge(l.status).label}</span>
        </div>

        <p className="text-sm" style={{ color: BRAND.textSub }}>{l.description}</p>

        <div className="rounded-xl p-3 grid grid-cols-3 gap-2" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.infoLt + ' 100%)' }}>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>基础 APR</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: BRAND.text }}>{l.baseApr.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>奖励 APR</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: BRAND.info }}>+{l.rewardApr.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>总年化</div>
            <div className="text-xl font-bold tabular-nums yd-float" style={{ color: BRAND.primary }}>{l.totalApr.toFixed(2)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="TVL" value={formatUsd(l.tvl)} color={BRAND.primary} />
          <DrawerKv label="24h 量" value={formatUsd(l.volume24h)} color={BRAND.success} />
          <DrawerKv label="无常损失" value={l.impermanentLoss === 0 ? '-' : l.impermanentLoss.toFixed(2) + '%'} color={l.impermanentLoss < -3 ? BRAND.danger : l.impermanentLoss < 0 ? BRAND.amber : BRAND.textMute} />
          <DrawerKv label="更新" value={l.updatedAt} />
        </div>

        {l.myLPValue > 0 && (
          <DrawerSection title="我的 LP 持仓">
            <div className="grid grid-cols-3 gap-3">
              <DrawerKv label="LP 价值" value={formatUsd(l.myLPValue)} color={BRAND.primary} />
              <DrawerKv label="累计收益" value={l.myEarned.toFixed(2) + ' ' + l.rewardToken} color={BRAND.success} />
              <DrawerKv label="持仓 IL" value={l.impermanentLoss.toFixed(2) + '%'} color={l.impermanentLoss < 0 ? BRAND.danger : BRAND.success} />
            </div>
          </DrawerSection>
        )}

        <DrawerSection title="操作区">
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }} disabled={l.status !== 'rewarded'}>添加 LP</button>
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.bgCard, color: BRAND.text, border: '1px solid ' + BRAND.border }}>提取 LP</button>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 5: Stake
// ============================================================
function StakeDrawer({ s, onClose }: { s: StakeRecord; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={s.token + ' 质押'} subtitle={s.id + ' · ' + statusBadge(s.type).label} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <TokenIcon token={s.token} size={56} />
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{s.token} 质押</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{statusBadge(s.type).label} · 验证人 {s.validator}</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(s.status).bg, color: statusBadge(s.status).color }}>{statusBadge(s.status).label}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: BRAND.textSub }}>APR</span>
            <span className="text-2xl font-bold tabular-nums yd-float" style={{ color: BRAND.primary }}>{s.apr.toFixed(2)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="存入数量" value={s.amount.toLocaleString() + ' ' + s.token} color={BRAND.primary} />
          <DrawerKv label="累计收益" value={s.earned.toFixed(4) + ' ' + s.token} color={BRAND.success} />
          <DrawerKv label="待领收益" value={s.pending.toFixed(4) + ' ' + s.token} color={BRAND.amber} />
          <DrawerKv label="APY" value={s.apy.toFixed(2) + '%'} color={BRAND.info} />
          <DrawerKv label="开始" value={s.startAt} />
          <DrawerKv label="结束" value={s.endAt} />
          <DrawerKv label="解锁时间" value={s.unlockAt} />
          <DrawerKv label="提前解押" value={s.earlyFee > 0 ? (s.earlyFee * 100).toFixed(0) + '%' : '允许'} color={s.earlyFee > 0 ? BRAND.danger : BRAND.success} />
        </div>

        <DrawerSection title="验证人">
          <div className="text-[11px]" style={{ color: BRAND.textSub }}>
            <div>节点：<span style={{ color: BRAND.text }}>{s.validator}</span></div>
            <div>状态：<span style={{ color: BRAND.success }}>活跃 · 在线率 99.8%</span></div>
            <div>佣金率：<span style={{ color: BRAND.text }}>5%</span></div>
          </div>
        </DrawerSection>

        <DrawerSection title="操作区">
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>领取收益</button>
            <button className="px-3 py-2 rounded-lg text-xs font-semibold" disabled={!s.canUnstake} style={{ background: s.canUnstake ? BRAND.danger : BRAND.bgCardHover, color: s.canUnstake ? BRAND.onPrimary : BRAND.textMute }}>{s.canUnstake ? '解押' : '等待解锁'}</button>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 6: Vault
// ============================================================
function VaultDrawer({ v, onClose }: { v: YieldVault; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={v.name} subtitle={v.id + ' · ' + statusBadge(v.strategy).label + '策略'} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold yd-float" style={{ background: BRAND.primaryLt, color: BRAND.primary, border: '1px solid ' + BRAND.primary + '40' }}>{STRATEGY_ICON[v.strategy]}</div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{v.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>策略 {statusBadge(v.strategy).label} · 调仓 {v.rebalanceFreq}</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(v.status).bg, color: statusBadge(v.status).color }}>{statusBadge(v.status).label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: severityColor(v.risk).bg, color: severityColor(v.risk).color }}>{statusBadge(v.risk).label}</span>
            </div>
          </div>
        </div>

        <p className="text-sm" style={{ color: BRAND.textSub }}>{v.description}</p>

        <div className="rounded-xl p-3 grid grid-cols-2 gap-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.successLt + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>APY</div>
            <div className="text-3xl font-bold tabular-nums yd-float" style={{ color: BRAND.success }}>{v.apy.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>夏普比率</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: BRAND.primary }}>{v.sharpe.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="TVL" value={formatUsd(v.tvl)} color={BRAND.primary} />
          <DrawerKv label="7d APY" value={v.apy7d.toFixed(2) + '%'} color={BRAND.info} />
          <DrawerKv label="30d APY" value={v.apy30d.toFixed(2) + '%'} color={BRAND.success} />
          <DrawerKv label="最大回撤" value={v.drawdown.toFixed(2) + '%'} color={BRAND.danger} />
          <DrawerKv label="运行时间" value={v.inception + ' 至今'} />
          <DrawerKv label="调仓频率" value={v.rebalanceFreq} />
          <DrawerKv label="我的存入" value={formatUsd(v.myDeposit)} color={BRAND.primary} />
          <DrawerKv label="我的收益" value={formatUsd(v.myEarned)} color={BRAND.success} />
        </div>

        <DrawerSection title="底层协议">
          <div className="flex flex-wrap gap-1.5">
            {v.protocols.map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{p}</span>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="策略说明">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 聚合器自动调度多协议，按 {v.rebalanceFreq} 频率再平衡；</li>
            <li>· 历史业绩不预示未来表现，APY 浮动；</li>
            <li>· 智能合约风险由审计机构评估；</li>
            <li>· 提取 T+1 到账，无锁仓期限制。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 7: Boost
// ============================================================
function BoostDrawer({ b, onClose }: { b: BoostItem; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={b.name} subtitle={b.id + ' · ' + statusBadge(b.rarity).label} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center yd-coin" style={{ background: statusBadge(b.rarity).bg, color: statusBadge(b.rarity).color, border: '1px solid ' + statusBadge(b.rarity).color + '40' }}>
            <Zap className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{b.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{statusBadge(b.type).label} · 来源 {b.source}</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(b.rarity).bg, color: statusBadge(b.rarity).color }}>{statusBadge(b.rarity).label}</span>
              {b.used && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(112,112,112,0.10)', color: BRAND.textMute }}>已使用</span>}
              {b.stackable && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: BRAND.successLt, color: BRAND.success }}>可叠加</span>}
            </div>
          </div>
        </div>

        <p className="text-sm" style={{ color: BRAND.textSub }}>{b.description}</p>

        <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, ' + statusBadge(b.rarity).bg + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>效果倍率</div>
          <div className="text-5xl font-bold tabular-nums yd-float" style={{ color: statusBadge(b.rarity).color }}>{b.value}x</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="类型" value={statusBadge(b.type).label} color={statusBadge(b.type).color} />
          <DrawerKv label="稀有度" value={statusBadge(b.rarity).label} color={statusBadge(b.rarity).color} />
          <DrawerKv label="状态" value={b.used ? '已使用' : '未使用'} color={b.used ? BRAND.textMute : BRAND.success} />
          <DrawerKv label="叠加" value={b.stackable ? '可叠加' : '独占'} color={b.stackable ? BRAND.success : BRAND.amber} />
          <DrawerKv label="获得时间" value={b.acquiredAt} />
          <DrawerKv label="到期时间" value={b.expiresAt} color={BRAND.amber} />
          <DrawerKv label="来源" value={b.source} />
          <DrawerKv label="加速卡 ID" value={b.id} />
        </div>

        <DrawerSection title="适用活动">
          <div className="flex flex-wrap gap-1.5">
            {b.applicableTo.map((a, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{a}</span>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="使用规则">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 在适用活动页面点击"使用加速卡"即可生效；</li>
            <li>· {b.stackable ? '本卡可与其他卡叠加使用；' : '本卡为独占卡，同一活动只能使用一张；'}</li>
            <li>· 使用后立即生效，到期自动失效；</li>
            <li>· 加速效果不改变 APR 上限 / 风险等级。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 8: Ref
// ============================================================
function RefDrawer({ r, onClose }: { r: RefReward; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={'推荐返佣 · ' + r.id} subtitle={r.referee + ' · ' + statusBadge(r.tier).label} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: statusBadge(r.tier).bg, color: statusBadge(r.tier).color, border: '1px solid ' + statusBadge(r.tier).color + '40' }}>
            <Crown className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold font-mono" style={{ color: BRAND.text }}>{r.referee}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>推荐等级 {statusBadge(r.tier).label} · 费率 {(r.rate * 100).toFixed(2)}%</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(r.status).bg, color: statusBadge(r.status).color }}>{statusBadge(r.status).label}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.successLt + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: BRAND.textSub }}>本次返佣</span>
            <span className="text-2xl font-bold tabular-nums yd-float" style={{ color: BRAND.success }}>{formatUsd(r.commission)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="被推荐人成交量" value={formatUsd(r.volume)} color={BRAND.primary} />
          <DrawerKv label="返佣费率" value={(r.rate * 100).toFixed(2) + '%'} color={BRAND.info} />
          <DrawerKv label="返佣金额" value={formatUsd(r.commission)} color={BRAND.success} />
          <DrawerKv label="等级" value={statusBadge(r.tier).label} color={statusBadge(r.tier).color} />
          <DrawerKv label="创建时间" value={r.createdAt} />
          <DrawerKv label="发放时间" value={r.paidAt || '待发放'} color={r.paidAt ? BRAND.success : BRAND.amber} />
          <DrawerKv label="来源" value={r.source} />
          <DrawerKv label="状态" value={statusBadge(r.status).label} color={statusBadge(r.status).color} />
        </div>

        <DrawerSection title="备注">
          <p className="text-[11px]" style={{ color: BRAND.textSub }}>{r.note}</p>
        </DrawerSection>

        <DrawerSection title="推荐机制">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 返佣按被推荐人手续费计算，按等级倍率加成；</li>
            <li>· 月度结算，次月 15 日发放至钱包；</li>
            <li>· 异常交易返佣将自动追回；</li>
            <li>· 推荐链接可通过个人中心"邀请好友"获取。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 9: Lock
// ============================================================
function LockDrawer({ l, onClose }: { l: LockStake; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={l.pool} subtitle={l.id + ' · ' + l.period} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: BRAND.primaryLt, color: BRAND.primary, border: '1px solid ' + BRAND.primary + '40' }}>
            <Key className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{l.pool}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>周期 {l.period} · {l.vesting}</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(l.status).bg, color: statusBadge(l.status).color }}>{statusBadge(l.status).label}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: BRAND.textSub }}>锁仓年化</span>
            <span className="text-2xl font-bold tabular-nums yd-float" style={{ color: BRAND.primary }}>{l.apr.toFixed(2)}%</span>
          </div>
          <div className="text-[10px]" style={{ color: BRAND.textMute }}>含平台奖励加成</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="锁仓数量" value={l.amount.toLocaleString() + ' ZSDX'} color={BRAND.primary} />
          <DrawerKv label="累计收益" value={l.earned.toFixed(2) + ' ZSDX'} color={BRAND.success} />
          <DrawerKv label="奖励加成" value={l.bonus.toFixed(2) + ' ZSDX'} color={BRAND.info} />
          <DrawerKv label="提前解锁" value={(l.earlyExitFee * 100).toFixed(0) + '%'} color={l.earlyExitFee > 0 ? BRAND.danger : BRAND.success} />
          <DrawerKv label="开始" value={l.startAt} />
          <DrawerKv label="结束" value={l.endAt} />
          <DrawerKv label="解锁时间" value={l.unlockAt} />
          <DrawerKv label="可领取" value={l.canClaim ? '是' : '否'} color={l.canClaim ? BRAND.success : BRAND.textMute} />
        </div>

        <DrawerSection title="锁仓进度">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: BRAND.textSub }}>已过 {Math.round((new Date(l.endAt).getTime() - new Date(l.startAt).getTime()) / (1000 * 60 * 60 * 24))} 天周期</span>
              <span style={{ color: BRAND.primary }}>{l.status === 'active' ? '锁定中' : l.status === 'unlocking' ? '已到期' : l.status === 'claimed' ? '已领取' : '已放弃'}</span>
            </div>
            <ProgressBar value={l.status === 'active' ? 60 : 100} max={100} color={l.status === 'claimed' ? BRAND.success : BRAND.primary} />
          </div>
        </DrawerSection>

        <DrawerSection title="解锁规则">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 锁仓到期后释放 {l.vesting}；</li>
            <li>· 提前解锁将扣除 {(l.earlyExitFee * 100).toFixed(0)}% 本金作为罚没；</li>
            <li>· 罚没部分归保险池，用于平台风险事件赔付；</li>
            <li>· 已发收益不受解锁影响。</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 10: History
// ============================================================
function HistoryDrawer({ h, onClose }: { h: YieldHistory; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={h.source} subtitle={h.id + ' · ' + statusBadge(h.type).label} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: statusBadge(h.type).bg, color: statusBadge(h.type).color, border: '1px solid ' + statusBadge(h.type).color + '40' }}>
            {h.type === 'reward' ? <Coins className="w-6 h-6" /> :
              h.type === 'claim' ? <Download className="w-6 h-6" /> :
              h.type === 'deposit' ? <Upload className="w-6 h-6" /> :
              h.type === 'withdraw' ? <Download className="w-6 h-6" /> :
              h.type === 'lock' ? <Key className="w-6 h-6" /> :
              h.type === 'unlock' ? <Unlock className="w-6 h-6" /> :
              h.type === 'boost' ? <Zap className="w-6 h-6" /> :
              <Gift className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{h.source}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{statusBadge(h.type).label} · {h.createdAt}</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: statusBadge(h.status).bg, color: statusBadge(h.status).color }}>{statusBadge(h.status).label}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: 'linear-gradient(135deg, ' + statusBadge(h.type).bg + ' 0%, ' + BRAND.bgCard + ' 100%)' }}>
          <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>金额</div>
          <div className="text-3xl font-bold tabular-nums yd-float" style={{ color: statusBadge(h.type).color }}>{(h.type === 'withdraw' || h.type === 'claim' || h.type === 'unlock' ? '-' : '+') + h.amount.toLocaleString() + ' ' + h.token}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="类型" value={statusBadge(h.type).label} color={statusBadge(h.type).color} />
          <DrawerKv label="金额" value={h.amount.toLocaleString() + ' ' + h.token} color={statusBadge(h.type).color} />
          <DrawerKv label="代币" value={h.token} />
          <DrawerKv label="APR" value={h.apr > 0 ? h.apr.toFixed(2) + '%' : '-'} color={BRAND.primary} />
          <DrawerKv label="时间" value={h.createdAt} />
          <DrawerKv label="状态" value={statusBadge(h.status).label} color={statusBadge(h.status).color} />
          <DrawerKv label="来源" value={h.source} />
          <DrawerKv label="记录 ID" value={h.id} />
        </div>

        <DrawerSection title="交易哈希">
          <div className="font-mono text-[10px] break-all p-2 rounded" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{h.txHash}</div>
        </DrawerSection>

        <DrawerSection title="备注">
          <p className="text-[11px]" style={{ color: BRAND.textSub }}>{h.note}</p>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 11: Help 帮助中心
// ============================================================
function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title="帮助中心" subtitle="流动性挖矿与收益聚合" onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, ' + BRAND.primaryLt + ' 0%, ' + BRAND.bgCard + ' 100%)', border: '1px solid ' + BRAND.primary + '40' }}>
          <HelpCircle className="w-8 h-8 mb-2" style={{ color: BRAND.primary }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: BRAND.text }}>流动性挖矿与收益聚合中心</h3>
          <p className="text-[12px] leading-relaxed" style={{ color: BRAND.textSub }}>
            本中心聚合单币挖矿、流动性池 LP 挖矿、双币理财、收益聚合器、加速加成、推荐奖励、锁仓、收益历史等全链路收益能力。
            所有数据为链上模拟 + 静态数据展示，定性为"研究 / 工具 / 辅助"型能力演示。
          </p>
        </div>

        <DrawerSection title="核心概念">
          <ul className="text-[12px] space-y-2" style={{ color: BRAND.text }}>
            <li><strong style={{ color: BRAND.primary }}>APR</strong>：Annual Percentage Rate，单利年化。</li>
            <li><strong style={{ color: BRAND.primary }}>APY</strong>：Annual Percentage Yield，复利年化。</li>
            <li><strong style={{ color: BRAND.primary }}>IL</strong>：Impermanent Loss，无常损失（LP 持仓相对单边持仓的潜在损失）。</li>
            <li><strong style={{ color: BRAND.primary }}>TVL</strong>：Total Value Locked，总锁仓价值。</li>
            <li><strong style={{ color: BRAND.primary }}>双币理财</strong>：到期按收益较低币种结算。</li>
            <li><strong style={{ color: BRAND.primary }}>锁仓</strong>：固定周期，提前解锁扣除 5-30% 本金。</li>
            <li><strong style={{ color: BRAND.primary }}>聚合器</strong>：跨协议自动调度，按策略再平衡。</li>
          </ul>
        </DrawerSection>

        <DrawerSection title="风险提示">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 收益为浮动值，过往业绩不预示未来表现；</li>
            <li>· 智能合约风险由审计机构评估但不排除极端情况；</li>
            <li>· 无常损失（IL）可能导致 LP 持仓价值低于单边持仓；</li>
            <li>· 锁仓产品存在流动性风险，提前解锁将扣除本金；</li>
            <li>· 聚合器策略依赖底层协议正常运行；</li>
            <li>· 双币理财存在结算方向风险，到期按弱势币种计价；</li>
            <li>· 平台不为任何收益做担保，请审慎评估风险承受能力。</li>
          </ul>
        </DrawerSection>

        <DrawerSection title="与 P3.43 / P3.45 / P3.46 联动">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· <strong style={{ color: BRAND.primary }}>P3.43 流动性再质押</strong>：底层资产可复投到本中心获取多层收益；</li>
            <li>· <strong style={{ color: BRAND.primary }}>P3.45 资产组合</strong>：组合配置中部分权重可指向本中心的聚合器；</li>
            <li>· <strong style={{ color: BRAND.primary }}>P3.46 智能投顾</strong>：AI 投顾策略可推荐本中心的挖矿 / 锁仓 / 聚合器；</li>
            <li>· <strong style={{ color: BRAND.primary }}>完整收益栈</strong>：质押 → 组合 → 投顾 → 收益聚合。</li>
          </ul>
        </DrawerSection>

        <DrawerSection title="联系支持">
          <div className="text-[12px] space-y-1" style={{ color: BRAND.textSub }}>
            <div>· 在线客服：7×24 小时</div>
            <div>· 工单系统：support@zsdex.example</div>
            <div>· 紧急通道：仅限账户安全类问题</div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

