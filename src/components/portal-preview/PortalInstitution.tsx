/**
 * PortalInstitution - 机构服务与做市商合作中心 (2026-07-20 Q05 P3.47)
 *
 * 页面定位：
 * - 中萨数字科技交易所 机构服务与做市商合作中心
 * - 机构准入 / KYB 审核 / PB 交易 / 信用额度 / 大宗撮合 / 流动性分成 / 报告白盒 / 风险对冲接口 / 联合做市 / API 接入
 * - 与 P3.25 做市商 + P3.26 衍生品 + P3.46 智能投顾 形成"做市-衍生-机构-AI 投顾"完整机构服务能力栈
 * - 与 P3.41 链上资产 + P3.42 跨链互操作 + P3.43 流动性再质押 + P3.44 RWA + P3.45 资产组合 + P3.46 智能投顾 + P3.47 机构服务 形成
 *   "零售→智能投顾→机构做市"全栈加密资产服务能力闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 机构 / KYB / PB 交易 / 信用额度 / 大宗撮合 / 流动性分成 / 报告 / 风险对冲 / 联合做市 / API 接入 / 帮助
 * - 10 Drawers + HelpDrawer
 *
 * 合规约束：
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 * - KYB / AML / 制裁筛查作为合规研究方向示例，明确"合规研究方向"定性
 * - 机构服务为技术能力演示，不构成投资建议
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, X, Filter, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft,
  Sparkles, Star, Heart, Bookmark, Flag, Tag, Tags, Eye, EyeOff, Plus, Minus,
  MoreHorizontal, MoreVertical, Menu, HelpCircle, Book, BookOpen, Lightbulb, GraduationCap,
  Award, Target, Crosshair, Gauge, Activity, BarChart3, BarChartHorizontal,
  PieChart, LineChart, Users, User, UserCheck, Crown, Trophy, Medal,
  Zap, Flame, Rocket, Compass, Map, MapPin, Globe, Globe2, Building, Building2,
  Landmark, Banknote, Wallet, CreditCard, Receipt, Calculator, Scale,
  Gem, PiggyBank, Handshake, Gavel, Stamp, Scroll,
  Mail, Bell, BellRing, Webhook, Code, Terminal, Network, Cloud, Cpu,
  Workflow, GitBranch, GitCommit, GitMerge, PlayCircle, PauseCircle, StopCircle,
  Edit, Trash2, Save, Folder, FolderOpen, Archive, Inbox, ClipboardList,
  ClipboardCheck, ListChecks, ListFilter, ListTree, History, RotateCcw, RotateCw,
  Repeat, Shuffle, CheckCircle2, Percent, Sigma, FunctionSquare, Droplet,
  ArrowDownUp, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info,
  Settings, Download, Upload, Share2, Copy, Check, RefreshCw, Calendar, Clock,
  Timer, Hourglass, ExternalLink, Link2, Link, Unlink,
  Shield, ShieldCheck, ShieldAlert, Lock, Key, Database, Server, Layers, Box, Boxes,
  Briefcase, FileText, FileCheck, FilePlus, FileMinus, Hash,
  Brain, Bot, Sparkle, Wand2,
  Mic, MicOff, Video, VideoOff, Send, MessageCircle, MessageSquare, Phone,
  Sun, Moon, CloudMoon, Sunrise, Sunset, CalendarDays, CalendarCheck,
  DollarSign, Coins, CircleDollarSign,
  FileBarChart, FilePieChart, FileLineChart, FileSpreadsheet, NotebookText,
  Newspaper, Notebook, NotebookPen, ChartLine, ChartBar, ChartPie,
  ChartNoAxesColumn, ChartNoAxesCombined, ChartSpline, ChartStepper, ChartBarStacked,
  ChartBarBig, ChartColumn, ChartColumnStacked, ChartBarHorizontalBig, ChartNetwork,
  KeyRound, ShieldQuestion, BadgeCheck, BadgeAlert, BadgeDollarSign, BadgePercent,
  FileSignature, FileSearch, FileCog, ListOrdered, Network as NetworkIcon,
  Bitcoin, Coins as CoinsIcon, Banknote as BanknoteIcon, HandCoins, Receipt as ReceiptIcon,
  ScrollText, BookCheck, BookKey, BookLock, BookOpenCheck, BookText,
  SquareStack, Boxes as BoxesIcon, Container, ServerCog, ServerCrash,
  Cable, Plug, PlugZap, Wifi, Antenna, Satellite, RadioTower, Router,
  CircuitBoard, Microchip, MemoryStick, HardDrive, Usb, Keyboard, Mouse,
  MousePointer2, Pointer, ScanLine, Scan, QrCode, Fingerprint, ScanSearch,
  Truck, Plane, Ship, Train, Car, Bike,
  FileBox, FolderArchive, FolderClock, FolderCog, FolderGit, FolderGit2,
  FolderHeart, FolderInput, FolderKanban, FolderKey, FolderLock, FolderMinus,
  FolderOutput, FolderPlus, FolderRoot, FolderSearch, FolderSymlink, FolderTree,
  FolderUp, FolderX, Folders, GlobeLock, GlobeAsia,
  CircleCheck, CircleX, CircleHelp, CircleAlert, CircleSlash, CirclePause,
  CirclePlay, CircleStop, CircleDot, CircleUser, CircleUserRound, CircleEllipsis,
  ShieldHalf, ShieldX, ShieldOff, ShieldUser, ShieldQuestion as ShieldQuestionIcon,
  BaggageClaim, Bag, ShoppingBag, ShoppingBasket, ShoppingCart,
  BriefcaseBusiness, BriefcaseMedical, BriefcaseConveyorBelt,
} from 'lucide-react';
import { BRAND } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

export type InstType = 'market_maker' | 'hedge_fund' | 'family_office' | 'bank' | 'broker' | 'prop_trading' | 'sovereign' | 'corporate';
export type InstTier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type InstStatus = 'active' | 'onboarding' | 'paused' | 'review' | 'terminated';
export type KybStatus = 'approved' | 'pending' | 'rejected' | 'review' | 'resubmit';
export type ReviewStage = 'documents' | 'ubo' | 'aml' | 'sanctions' | 'final';
export type RiskLevel = 'low' | 'medium' | 'high';
export type BlockStatus = 'negotiating' | 'agreed' | 'settling' | 'completed' | 'cancelled';
export type CreditStatus = 'normal' | 'warning' | 'margin' | 'liquidate';
export type ApiStatus = 'active' | 'rotating' | 'revoked';
export type Tab = 'overview' | 'institution' | 'kyb' | 'pb' | 'credit' | 'block' | 'liquidity' | 'report' | 'hedge' | 'mm' | 'api' | 'help';

export interface Institution {
  id: string;
  name: string;
  legalName: string;
  type: InstType;
  tier: InstTier;
  region: string;
  jurisdiction: string;
  aum: number;
  monthlyVolume: number;
  accounts: number;
  status: InstStatus;
  kybLevel: number;
  kybStatus: KybStatus;
  joinedAt: string;
  contractEnd: string;
  contact: string;
  email: string;
  riskScore: number;
  complianceFlags: number;
  rating: number;
  logo: string;
  iconBg: string;
  iconColor: string;
  services: string[];
  tags: string[];
}

export interface KybApplication {
  id: string;
  institution: string;
  jurisdiction: string;
  type: string;
  submittedAt: string;
  reviewStage: ReviewStage;
  progress: number;
  reviewer: string;
  status: KybStatus;
  documents: number;
  missingDocs: number;
  flags: number;
  estimatedDays: number;
  sla: number;
  riskLevel: RiskLevel;
  notes: string;
  uboCount: number;
  amlHits: number;
  sanctionsHits: number;
}

export interface PbTrade {
  id: string;
  institution: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  value: number;
  fee: number;
  rebate: number;
  executedAt: string;
  venue: string;
  settlementT: number;
  status: 'pending' | 'partial' | 'filled' | 'settled' | 'cancelled';
  counterparty: string;
  creditUsed: number;
  leverage: number;
  liquidity: 'maker' | 'taker';
}

export interface CreditLine {
  id: string;
  institution: string;
  total: number;
  used: number;
  available: number;
  rate: number;
  collateralRatio: number;
  liquidationLine: number;
  marginCall: number;
  status: CreditStatus;
  expiresAt: string;
  lastReview: string;
  nextReview: string;
  lvr: number;
  utilizationPct: number;
  collateralUsd: number;
}

export interface BlockTrade {
  id: string;
  buyer: string;
  seller: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  value: number;
  discount: number;
  status: BlockStatus;
  venue: string;
  rfqAt: string;
  agreedAt: string;
  settledAt: string;
  blockId: string;
  fee: number;
  settlement: string;
  desk: string;
}

export interface LiquidityShare {
  id: string;
  institution: string;
  pool: string;
  totalShare: number;
  volumeShare: number;
  rebateTier: 'tier1' | 'tier2' | 'tier3';
  rebateRate: number;
  rebateAmount: number;
  spreadCaptured: number;
  makerRatio: number;
  takerRatio: number;
  uptime: number;
  latency: number;
  qualityScore: number;
  period: string;
  paidAt: string;
  status: 'active' | 'pending' | 'paid';
  pairs: number;
}

export interface InstReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'audit';
  institution: string;
  period: string;
  generatedAt: string;
  pages: number;
  recipients: number;
  sections: string[];
  dataPoints: number;
  status: 'generating' | 'ready' | 'sent' | 'failed';
  whiteLabel: boolean;
  compliance: boolean;
  format: 'pdf' | 'xlsx' | 'html' | 'csv';
  size: number;
}

export interface HedgeInterface {
  id: string;
  institution: string;
  product: string;
  type: 'perp' | 'option' | 'swap' | 'future' | 'forward';
  notional: number;
  delta: number;
  vega: number;
  theta: number;
  gamma: number;
  hedgeRatio: number;
  effectiveness: number;
  pnl: number;
  basis: number;
  status: 'active' | 'rolling' | 'closed';
  startedAt: string;
  expiresAt: string;
  counterparty: string;
  venue: string;
}

export interface MmPartnership {
  id: string;
  institution: string;
  pairs: string[];
  depthUsd: number;
  spreadTarget: number;
  rebate: number;
  uptime: number;
  volume24h: number;
  inventory: number;
  riskLimit: number;
  status: 'active' | 'beta' | 'paused' | 'onboarding';
  contractStart: string;
  contractEnd: string;
  revenueShare: number;
  qualityScore: number;
  tier: 'tier1' | 'tier2' | 'tier3';
  leverage: number;
}

export interface ApiCredential {
  id: string;
  institution: string;
  name: string;
  type: 'pb_trading' | 'market_data' | 'risk_query' | 'settlement' | 'admin';
  permissions: string[];
  rateLimit: number;
  used: number;
  ipWhitelist: string[];
  status: ApiStatus;
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
  apiKey: string;
  signature: 'hmac' | 'rsa' | 'ed25519';
  region: string;
  calls24h: number;
}

// ============================================================
// 常量映射
// ============================================================

const INST_TYPE_LABEL: Record<InstType, string> = {
  market_maker: '做市商',
  hedge_fund: '对冲基金',
  family_office: '家族办公室',
  bank: '银行',
  broker: '券商',
  prop_trading: '自营交易',
  sovereign: '主权基金',
  corporate: '企业财资',
};

const TIER_COLOR: Record<InstTier, { bg: string; color: string; label: string }> = {
  platinum: { bg: 'rgba(20,184,129,0.18)', color: BRAND.primary, label: '铂金' },
  gold: { bg: 'rgba(255,169,64,0.18)', color: BRAND.amber, label: '黄金' },
  silver: { bg: 'rgba(176,176,176,0.18)', color: BRAND.textSub, label: '白银' },
  bronze: { bg: 'rgba(176,140,80,0.18)', color: '#B08C50', label: '青铜' },
};

const REVIEW_STAGE_LABEL: Record<ReviewStage, string> = {
  documents: '资料审核',
  ubo: 'UBO 穿透',
  aml: 'AML 筛查',
  sanctions: '制裁核查',
  final: '终审',
};


// ============================================================
// 工具函数
// ============================================================

function formatUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n >= 0 ? '$' : '-$') + (abs / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n >= 0 ? '$' : '-$') + (abs / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n >= 0 ? '$' : '-$') + (abs / 1e3).toFixed(2) + 'K';
  return (n >= 0 ? '$' : '-$') + abs.toFixed(2);
}

function formatPct(n: number, digits = 2): string {
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(digits) + '%';
}

function formatInt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function formatBytes(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' KB';
  return n + ' B';
}

function statusBadge(status: string): { label: string; color: string; bg: string } {
  const m: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: '活跃', color: BRAND.success, bg: BRAND.successLt },
    onboarding: { label: '入驻中', color: BRAND.amber, bg: BRAND.amberLt },
    paused: { label: '已暂停', color: BRAND.warning, bg: BRAND.warningLt },
    review: { label: '审核中', color: BRAND.info, bg: BRAND.infoLt },
    terminated: { label: '已终止', color: BRAND.danger, bg: BRAND.dangerLt },
    approved: { label: '已通过', color: BRAND.success, bg: BRAND.successLt },
    pending: { label: '待处理', color: BRAND.amber, bg: BRAND.amberLt },
    rejected: { label: '已驳回', color: BRAND.danger, bg: BRAND.dangerLt },
    resubmit: { label: '需补件', color: BRAND.warning, bg: BRAND.warningLt },
    normal: { label: '正常', color: BRAND.success, bg: BRAND.successLt },
    warning: { label: '预警', color: BRAND.amber, bg: BRAND.amberLt },
    margin: { label: '追保', color: BRAND.warning, bg: BRAND.warningLt },
    liquidate: { label: '强平', color: BRAND.danger, bg: BRAND.dangerLt },
    negotiating: { label: '撮合中', color: BRAND.info, bg: BRAND.infoLt },
    agreed: { label: '已成交', color: BRAND.primary, bg: BRAND.primaryLt },
    settling: { label: '结算中', color: BRAND.amber, bg: BRAND.amberLt },
    completed: { label: '已完成', color: BRAND.success, bg: BRAND.successLt },
    cancelled: { label: '已取消', color: BRAND.danger, bg: BRAND.dangerLt },
    rotating: { label: '轮换中', color: BRAND.amber, bg: BRAND.amberLt },
    revoked: { label: '已撤销', color: BRAND.danger, bg: BRAND.dangerLt },
    beta: { label: '内测', color: BRAND.amber, bg: BRAND.amberLt },
    rolling: { label: '展期中', color: BRAND.info, bg: BRAND.infoLt },
    closed: { label: '已关闭', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    settled: { label: '已结算', color: BRAND.success, bg: BRAND.successLt },
    partial: { label: '部分', color: BRAND.amber, bg: BRAND.amberLt },
    filled: { label: '已成交', color: BRAND.success, bg: BRAND.successLt },
    paid: { label: '已发放', color: BRAND.success, bg: BRAND.successLt },
    generating: { label: '生成中', color: BRAND.info, bg: BRAND.infoLt },
    ready: { label: '已就绪', color: BRAND.success, bg: BRAND.successLt },
    sent: { label: '已发送', color: BRAND.success, bg: BRAND.successLt },
    failed: { label: '失败', color: BRAND.danger, bg: BRAND.dangerLt },
    maker: { label: 'Maker', color: BRAND.success, bg: BRAND.successLt },
    taker: { label: 'Taker', color: BRAND.amber, bg: BRAND.amberLt },
    low: { label: '低风险', color: BRAND.success, bg: BRAND.successLt },
    medium: { label: '中风险', color: BRAND.amber, bg: BRAND.amberLt },
    high: { label: '高风险', color: BRAND.danger, bg: BRAND.dangerLt },
  };
  return m[status] || { label: status, color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' };
}

function severityColor(s: string): { color: string; bg: string } {
  if (s === 'critical' || s === 'high') return { color: BRAND.danger, bg: BRAND.dangerLt };
  if (s === 'medium' || s === 'warning') return { color: BRAND.amber, bg: BRAND.amberLt };
  return { color: BRAND.info, bg: BRAND.infoLt };
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n / 2) + '...' + s.slice(s.length - n / 2);
}


// ============================================================
// Mock Data（请在 step2 中填充）
// ============================================================

// ============================================================
// Mock Data
// ============================================================

const INSTITUTIONS: Institution[] = [
  {
    id: 'INST-001', name: 'Apex Sigma Capital', legalName: 'Apex Sigma Capital Pte. Ltd.',
    type: 'market_maker', tier: 'platinum', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 2_400_000_000, monthlyVolume: 18_500_000_000, accounts: 12,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2024-03-12',
    contractEnd: '2027-03-11', contact: '陈志远', email: 'contact@apex-sigma.example',
    riskScore: 18, complianceFlags: 0, rating: 4.9,
    logo: 'AS', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '做市商', '信用额度', 'API 接入', '报告白盒'],
    tags: ['tier1', '亚太中心', '500+ 交易对', 'maker-only'],
  },
  {
    id: 'INST-002', name: 'Helios Quant Partners', legalName: 'Helios Quant Partners LP',
    type: 'hedge_fund', tier: 'platinum', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 1_850_000_000, monthlyVolume: 9_200_000_000, accounts: 8,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-11-04',
    contractEnd: '2026-11-03', contact: 'Michael Chen', email: 'desk@helios-quant.example',
    riskScore: 24, complianceFlags: 1, rating: 4.7,
    logo: 'HQ', iconBg: 'rgba(68,219,244,0.18)', iconColor: '#44DBF4',
    services: ['PB 交易', '衍生品对冲', '信用额度', '白盒报告'],
    tags: ['multi-strat', '中性策略', '高换手'],
  },
  {
    id: 'INST-003', name: 'Argonaut Family Office', legalName: 'Argonaut Family Office SA',
    type: 'family_office', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 680_000_000, monthlyVolume: 1_400_000_000, accounts: 4,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-06-18',
    contractEnd: '2027-06-17', contact: 'Jean-Luc Martin', email: 'office@argonaut.example',
    riskScore: 12, complianceFlags: 0, rating: 4.8,
    logo: 'AF', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['托管', '资产配置', '报告白盒', 'API 接入'],
    tags: ['长周期', '低频', '多代际'],
  },
  {
    id: 'INST-004', name: 'Polaris Sovereign Capital', legalName: 'Polaris Sovereign Capital Ltd.',
    type: 'sovereign', tier: 'platinum', region: '中东', jurisdiction: '合规研究方向示例',
    aum: 5_200_000_000, monthlyVolume: 8_700_000_000, accounts: 6,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-08-22',
    contractEnd: '2028-08-21', contact: '王建国', email: 'desk@polaris-sov.example',
    riskScore: 9, complianceFlags: 0, rating: 5.0,
    logo: 'PS', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '做市商', '大宗撮合', '报告白盒', 'API 接入', '风险对冲'],
    tags: ['超长周期', '低风险', '长期持有'],
  },
  {
    id: 'INST-005', name: 'Vega Trading Group', legalName: 'Vega Trading Group LLC',
    type: 'prop_trading', tier: 'gold', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 320_000_000, monthlyVolume: 6_500_000_000, accounts: 3,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-01-15',
    contractEnd: '2026-01-14', contact: 'Sarah Kim', email: 'desk@vega-trading.example',
    riskScore: 32, complianceFlags: 2, rating: 4.4,
    logo: 'VT', iconBg: 'rgba(246,70,93,0.18)', iconColor: '#F6465D',
    services: ['PB 交易', '做市商', '高杠杆'],
    tags: ['高频', '高杠杆', '做市'],
  },
  {
    id: 'INST-006', name: 'Citadel Prime Brokerage', legalName: 'Citadel Prime Brokerage DMCC',
    type: 'broker', tier: 'platinum', region: '中东', jurisdiction: '合规研究方向示例',
    aum: 8_400_000_000, monthlyVolume: 42_000_000_000, accounts: 32,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-04-01',
    contractEnd: '2028-03-31', contact: 'Ahmed Al-Rashid', email: 'pb@citadel-pb.example',
    riskScore: 14, complianceFlags: 0, rating: 4.9,
    logo: 'CP', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '信用额度', '大宗撮合', '做市商', '白盒报告', 'API 接入'],
    tags: ['主经纪商', '多产品', '全球客户'],
  },
  {
    id: 'INST-007', name: '永丰银行资管', legalName: '永丰银行资产管理（香港）有限公司',
    type: 'bank', tier: 'platinum', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 1_120_000_000, monthlyVolume: 3_800_000_000, accounts: 18,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2024-02-28',
    contractEnd: '2027-02-27', contact: '林志明', email: 'am@yongfeng-am.example',
    riskScore: 8, complianceFlags: 0, rating: 4.8,
    logo: 'YF', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['托管', 'PB 交易', '报告白盒', '合规咨询'],
    tags: ['传统银行', '长期合作', '高合规'],
  },
  {
    id: 'INST-008', name: 'Quantum Leap Capital', legalName: 'Quantum Leap Capital Partners',
    type: 'hedge_fund', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 540_000_000, monthlyVolume: 2_900_000_000, accounts: 5,
    status: 'review', kybLevel: 3, kybStatus: 'review', joinedAt: '2025-09-10',
    contractEnd: '2026-09-09', contact: 'Hans Mueller', email: 'desk@quantum-leap.example',
    riskScore: 45, complianceFlags: 3, rating: 4.2,
    logo: 'QL', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['PB 交易', '信用额度'],
    tags: ['中性策略', '中频', '多产品'],
  },
  {
    id: 'INST-009', name: '新航资管', legalName: '新航资产管理有限公司',
    type: 'corporate', tier: 'silver', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 180_000_000, monthlyVolume: 320_000_000, accounts: 2,
    status: 'onboarding', kybLevel: 2, kybStatus: 'pending', joinedAt: '2026-05-20',
    contractEnd: '2027-05-19', contact: '张明', email: 'finance@xinhang.example',
    riskScore: 22, complianceFlags: 1, rating: 4.3,
    logo: 'XH', iconBg: 'rgba(176,176,176,0.18)', iconColor: '#B0B0B0',
    services: ['PB 交易', '托管'],
    tags: ['企业财资', '对公', '低频'],
  },
  {
    id: 'INST-010', name: 'Orion Global Macro', legalName: 'Orion Global Macro Fund',
    type: 'hedge_fund', tier: 'gold', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 920_000_000, monthlyVolume: 5_200_000_000, accounts: 7,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-07-08',
    contractEnd: '2027-07-07', contact: 'David Park', email: 'macro@orion-gm.example',
    riskScore: 28, complianceFlags: 1, rating: 4.6,
    logo: 'OG', iconBg: 'rgba(68,219,244,0.18)', iconColor: '#44DBF4',
    services: ['PB 交易', '衍生品对冲', '大宗撮合'],
    tags: ['宏观策略', '多资产', '中高频'],
  },
  {
    id: 'INST-011', name: '梅德韦资本', legalName: 'Medved Capital Partners',
    type: 'market_maker', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 480_000_000, monthlyVolume: 11_200_000_000, accounts: 4,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-04-22',
    contractEnd: '2026-04-21', contact: 'Igor Petrov', email: 'desk@medved.example',
    riskScore: 26, complianceFlags: 1, rating: 4.5,
    logo: 'MC', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['做市商', 'PB 交易', 'API 接入'],
    tags: ['做市专家', '欧洲中心', 'maker-only'],
  },
  {
    id: 'INST-012', name: '银河数币资管', legalName: '银河数字货币资产管理有限公司',
    type: 'family_office', tier: 'silver', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 95_000_000, monthlyVolume: 220_000_000, accounts: 2,
    status: 'paused', kybLevel: 3, kybStatus: 'approved', joinedAt: '2025-02-14',
    contractEnd: '2026-02-13', contact: '高雪', email: 'office@galaxy-dc.example',
    riskScore: 38, complianceFlags: 2, rating: 4.1,
    logo: 'YX', iconBg: 'rgba(176,176,176,0.18)', iconColor: '#B0B0B0',
    services: ['托管', '资产配置'],
    tags: ['长周期', '家族办公室', '保守'],
  },
];

const KYB_APPLICATIONS: KybApplication[] = [
  { id: 'KYB-2026-0731', institution: 'Meridian Alpha Fund', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-18 14:32:11', reviewStage: 'ubo', progress: 65, reviewer: '张婷婷', status: 'review', documents: 24, missingDocs: 2, flags: 0, estimatedDays: 4, sla: 7, riskLevel: 'medium', notes: 'UBO 穿透 2 层股权，建议补充第二层受益人身份证明', uboCount: 5, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0730', institution: 'Aurora Global Trading', jurisdiction: '合规研究方向示例', type: '做市商', submittedAt: '2026-07-17 09:18:42', reviewStage: 'aml', progress: 80, reviewer: '王浩', status: 'review', documents: 31, missingDocs: 0, flags: 1, estimatedDays: 2, sla: 5, riskLevel: 'low', notes: 'AML 命中 1 项低风险，已附说明函', uboCount: 3, amlHits: 1, sanctionsHits: 0 },
  { id: 'KYB-2026-0729', institution: '北极星资管', jurisdiction: '合规研究方向示例', type: '家族办公室', submittedAt: '2026-07-15 16:45:00', reviewStage: 'sanctions', progress: 90, reviewer: '李娜', status: 'review', documents: 28, missingDocs: 0, flags: 0, estimatedDays: 1, sla: 5, riskLevel: 'low', notes: '制裁核查通过，等待终审', uboCount: 4, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0728', institution: 'Stellar Macro Partners', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-14 11:22:33', reviewStage: 'final', progress: 95, reviewer: '陈思雨', status: 'review', documents: 35, missingDocs: 0, flags: 0, estimatedDays: 1, sla: 7, riskLevel: 'low', notes: '终审中，预计明日出结论', uboCount: 6, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0727', institution: '鸿鹄量化', jurisdiction: '合规研究方向示例', type: '自营交易', submittedAt: '2026-07-12 13:08:21', reviewStage: 'documents', progress: 25, reviewer: '王浩', status: 'pending', documents: 12, missingDocs: 8, flags: 2, estimatedDays: 7, sla: 10, riskLevel: 'medium', notes: '8 项资料待补，建议尽快提交以免影响 SLA', uboCount: 2, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0726', institution: 'Oasis Capital Asia', jurisdiction: '合规研究方向示例', type: '家族办公室', submittedAt: '2026-07-08 10:15:50', reviewStage: 'final', progress: 100, reviewer: '李娜', status: 'approved', documents: 26, missingDocs: 0, flags: 0, estimatedDays: 0, sla: 7, riskLevel: 'low', notes: '已通过，已开通 PB 交易权限', uboCount: 3, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0725', institution: 'Krypton Digital Fund', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-05 15:42:18', reviewStage: 'ubo', progress: 55, reviewer: '张婷婷', status: 'resubmit', documents: 18, missingDocs: 5, flags: 1, estimatedDays: 6, sla: 7, riskLevel: 'high', notes: 'UBO 资料不完整，需补 5 项关键材料', uboCount: 4, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0724', institution: 'BlueRiver Securities', jurisdiction: '合规研究方向示例', type: '券商', submittedAt: '2026-07-01 09:30:00', reviewStage: 'final', progress: 100, reviewer: '陈思雨', status: 'rejected', documents: 22, missingDocs: 0, flags: 3, estimatedDays: 0, sla: 7, riskLevel: 'high', notes: 'AML 命中 3 项高风险，建议 6 个月后重新申请', uboCount: 7, amlHits: 3, sanctionsHits: 0 },
];

const PB_TRADES: PbTrade[] = [
  { id: 'PB-2026-0719-9981', institution: 'Apex Sigma Capital', symbol: 'BTC/USDT', side: 'buy', qty: 25.5, price: 65_420, value: 1_668_210, fee: 834.11, rebate: 333.64, executedAt: '2026-07-19 14:32:18', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9980', institution: 'Helios Quant Partners', symbol: 'ETH/USDT', side: 'sell', qty: 420, price: 3_482, value: 1_462_440, fee: 731.22, rebate: 292.49, executedAt: '2026-07-19 14:28:55', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9979', institution: 'Polaris Sovereign Capital', symbol: 'BTC/USDT', side: 'buy', qty: 78, price: 65_380, value: 5_099_640, fee: 2_549.82, rebate: 1_019.93, executedAt: '2026-07-19 14:25:42', venue: 'OTC Block', settlementT: 2, status: 'settled', counterparty: 'Galaxy Digital', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9978', institution: 'Citadel Prime Brokerage', symbol: 'SOL/USDT', side: 'buy', qty: 12_500, price: 142, value: 1_775_000, fee: 887.50, rebate: 355.00, executedAt: '2026-07-19 14:18:20', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9977', institution: 'Vega Trading Group', symbol: 'ETH-PERP', side: 'sell', qty: 850, price: 3_485, value: 2_962_250, fee: 1_481.13, rebate: 592.45, executedAt: '2026-07-19 14:12:08', venue: 'Perp', settlementT: 0, status: 'filled', counterparty: '撮合池', creditUsed: 850_000, leverage: 3.5, liquidity: 'taker' },
  { id: 'PB-2026-0719-9976', institution: 'Orion Global Macro', symbol: 'BTC-PERP', side: 'buy', qty: 120, price: 65_410, value: 7_849_200, fee: 3_924.60, rebate: 1_569.84, executedAt: '2026-07-19 14:05:33', venue: 'Perp', settlementT: 0, status: 'filled', counterparty: '撮合池', creditUsed: 2_000_000, leverage: 4, liquidity: 'taker' },
  { id: 'PB-2026-0719-9975', institution: '永丰银行资管', symbol: 'BTC/USDT', side: 'sell', qty: 18, price: 65_350, value: 1_176_300, fee: 588.15, rebate: 235.26, executedAt: '2026-07-19 13:58:11', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9974', institution: 'Medved Capital Partners', symbol: 'ETH/USDT', side: 'buy', qty: 280, price: 3_478, value: 973_840, fee: 486.92, rebate: 194.77, executedAt: '2026-07-19 13:45:00', venue: 'Spot', settlementT: 1, status: 'partial', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9973', institution: 'Argonaut Family Office', symbol: 'BTC/USDT', side: 'buy', qty: 4.5, price: 65_320, value: 293_940, fee: 146.97, rebate: 58.79, executedAt: '2026-07-19 13:32:14', venue: 'Spot', settlementT: 1, status: 'pending', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9972', institution: 'Apex Sigma Capital', symbol: 'SOL/USDT', side: 'buy', qty: 8_500, price: 141, value: 1_198_500, fee: 599.25, rebate: 239.70, executedAt: '2026-07-19 13:18:42', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
];

const CREDIT_LINES: CreditLine[] = [
  { id: 'CL-INST-001', institution: 'Apex Sigma Capital', total: 500_000_000, used: 145_000_000, available: 355_000_000, rate: 0.085, collateralRatio: 2.5, liquidationLine: 180_000_000, marginCall: 200_000_000, status: 'normal', expiresAt: '2027-03-11', lastReview: '2026-06-15', nextReview: '2026-12-15', lvr: 0.290, utilizationPct: 0.290, collateralUsd: 362_500_000 },
  { id: 'CL-INST-002', institution: 'Helios Quant Partners', total: 350_000_000, used: 245_000_000, available: 105_000_000, rate: 0.092, collateralRatio: 2.2, liquidationLine: 300_000_000, marginCall: 320_000_000, status: 'warning', expiresAt: '2026-11-03', lastReview: '2026-05-20', nextReview: '2026-08-20', lvr: 0.700, utilizationPct: 0.700, collateralUsd: 539_000_000 },
  { id: 'CL-INST-003', institution: 'Polaris Sovereign Capital', total: 1_200_000_000, used: 320_000_000, available: 880_000_000, rate: 0.065, collateralRatio: 3.0, liquidationLine: 360_000_000, marginCall: 400_000_000, status: 'normal', expiresAt: '2028-08-21', lastReview: '2026-07-01', nextReview: '2027-01-01', lvr: 0.267, utilizationPct: 0.267, collateralUsd: 960_000_000 },
  { id: 'CL-INST-004', institution: 'Citadel Prime Brokerage', total: 2_000_000_000, used: 680_000_000, available: 1_320_000_000, rate: 0.072, collateralRatio: 2.8, liquidationLine: 720_000_000, marginCall: 800_000_000, status: 'normal', expiresAt: '2028-03-31', lastReview: '2026-06-30', nextReview: '2026-12-30', lvr: 0.340, utilizationPct: 0.340, collateralUsd: 1_904_000_000 },
  { id: 'CL-INST-005', institution: 'Vega Trading Group', total: 80_000_000, used: 64_000_000, available: 16_000_000, rate: 0.115, collateralRatio: 1.8, liquidationLine: 70_000_000, marginCall: 75_000_000, status: 'margin', expiresAt: '2026-01-14', lastReview: '2026-07-10', nextReview: '2026-07-25', lvr: 0.800, utilizationPct: 0.800, collateralUsd: 115_200_000 },
  { id: 'CL-INST-006', institution: 'Orion Global Macro', total: 200_000_000, used: 124_000_000, available: 76_000_000, rate: 0.095, collateralRatio: 2.0, liquidationLine: 140_000_000, marginCall: 160_000_000, status: 'warning', expiresAt: '2027-07-07', lastReview: '2026-06-08', nextReview: '2026-09-08', lvr: 0.620, utilizationPct: 0.620, collateralUsd: 248_000_000 },
  { id: 'CL-INST-007', institution: 'Quantum Leap Capital', total: 120_000_000, used: 36_000_000, available: 84_000_000, rate: 0.105, collateralRatio: 2.3, liquidationLine: 45_000_000, marginCall: 55_000_000, status: 'normal', expiresAt: '2026-09-09', lastReview: '2026-05-30', nextReview: '2026-08-30', lvr: 0.300, utilizationPct: 0.300, collateralUsd: 82_800_000 },
  { id: 'CL-INST-008', institution: 'Medved Capital Partners', total: 100_000_000, used: 28_000_000, available: 72_000_000, rate: 0.098, collateralRatio: 2.4, liquidationLine: 36_000_000, marginCall: 42_000_000, status: 'normal', expiresAt: '2026-04-21', lastReview: '2026-06-25', nextReview: '2026-09-25', lvr: 0.280, utilizationPct: 0.280, collateralUsd: 67_200_000 },
];

const BLOCK_TRADES: BlockTrade[] = [
  { id: 'BLK-2026-0719-088', buyer: 'Polaris Sovereign Capital', seller: 'OTC 池 · 银河数币资管', symbol: 'BTC', side: 'buy', qty: 78, price: 65_180, value: 5_084_040, discount: -0.0008, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 13:42:18', agreedAt: '2026-07-19 13:48:55', settledAt: '2026-07-19 15:48:55', blockId: 'BLK-2026-0719-088', fee: 5_084, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-087', buyer: 'Orion Global Macro', seller: 'OTC 池 · Vega Trading', symbol: 'ETH', side: 'buy', qty: 1_200, price: 3_475, value: 4_170_000, discount: -0.0012, status: 'settling', venue: 'OTC Block', rfqAt: '2026-07-19 14:18:00', agreedAt: '2026-07-19 14:22:33', settledAt: '', blockId: 'BLK-2026-0719-087', fee: 4_170, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-086', buyer: 'Citadel Prime Brokerage', seller: 'OTC 池', symbol: 'BTC', side: 'buy', qty: 150, price: 65_120, value: 9_768_000, discount: -0.0015, status: 'agreed', venue: 'OTC Block', rfqAt: '2026-07-19 14:05:18', agreedAt: '2026-07-19 14:11:42', settledAt: '', blockId: 'BLK-2026-0719-086', fee: 9_768, settlement: 'T+1 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-085', buyer: '永丰银行资管', seller: 'OTC 池 · Argonaut FO', symbol: 'ETH', side: 'buy', qty: 350, price: 3_470, value: 1_214_500, discount: -0.001, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 11:32:00', agreedAt: '2026-07-19 11:38:22', settledAt: '2026-07-19 13:38:22', blockId: 'BLK-2026-0719-085', fee: 1_214, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-084', buyer: 'Helios Quant Partners', seller: 'OTC 池', symbol: 'BTC', side: 'sell', qty: 45, price: 65_280, value: 2_937_600, discount: -0.0006, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 10:18:00', agreedAt: '2026-07-19 10:24:11', settledAt: '2026-07-19 12:24:11', blockId: 'BLK-2026-0719-084', fee: 2_938, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-083', buyer: 'Apex Sigma Capital', seller: 'OTC 池 · Galaxy DC', symbol: 'SOL', side: 'buy', qty: 18_000, price: 140, value: 2_520_000, discount: -0.0018, status: 'negotiating', venue: 'OTC Block', rfqAt: '2026-07-19 14:35:00', agreedAt: '', settledAt: '', blockId: 'BLK-2026-0719-083', fee: 0, settlement: 'T+1 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-082', buyer: 'Polaris Sovereign Capital', seller: 'OTC 池', symbol: 'ETH', side: 'buy', qty: 2_500, price: 3_468, value: 8_670_000, discount: -0.0014, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 09:55:00', agreedAt: '2026-07-19 10:02:18', settledAt: '2026-07-19 12:02:18', blockId: 'BLK-2026-0719-082', fee: 8_670, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
];

const LIQUIDITY_SHARES: LiquidityShare[] = [
  { id: 'LQ-2026-Q2-001', institution: 'Apex Sigma Capital', pool: 'BTC/USDT 主池', totalShare: 0.184, volumeShare: 0.215, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 1_280_000, spreadCaptured: 425_000, makerRatio: 0.84, takerRatio: 0.16, uptime: 0.998, latency: 8.2, qualityScore: 96, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 14 },
  { id: 'LQ-2026-Q2-002', institution: 'Medved Capital Partners', pool: 'ETH/USDT 主池', totalShare: 0.142, volumeShare: 0.168, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 880_000, spreadCaptured: 312_000, makerRatio: 0.81, takerRatio: 0.19, uptime: 0.996, latency: 11.4, qualityScore: 92, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 18 },
  { id: 'LQ-2026-Q2-003', institution: 'Citadel Prime Brokerage', pool: '全市场多池', totalShare: 0.215, volumeShare: 0.248, rebateTier: 'tier1', rebateRate: 0.0003, rebateAmount: 1_650_000, spreadCaptured: 528_000, makerRatio: 0.78, takerRatio: 0.22, uptime: 0.999, latency: 6.8, qualityScore: 98, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 42 },
  { id: 'LQ-2026-Q2-004', institution: 'Vega Trading Group', pool: 'SOL-PERP 池', totalShare: 0.082, volumeShare: 0.094, rebateTier: 'tier2', rebateRate: 0.00018, rebateAmount: 320_000, spreadCaptured: 145_000, makerRatio: 0.68, takerRatio: 0.32, uptime: 0.984, latency: 18.6, qualityScore: 84, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 8 },
  { id: 'LQ-2026-Q2-005', institution: 'Apex Sigma Capital', pool: 'ALT/USDT 中池', totalShare: 0.118, volumeShare: 0.142, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 620_000, spreadCaptured: 218_000, makerRatio: 0.86, takerRatio: 0.14, uptime: 0.997, latency: 9.4, qualityScore: 95, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 22 },
  { id: 'LQ-2026-Q3-001', institution: 'Apex Sigma Capital', pool: 'BTC/USDT 主池', totalShare: 0.198, volumeShare: 0.228, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 1_450_000, spreadCaptured: 482_000, makerRatio: 0.85, takerRatio: 0.15, uptime: 0.999, latency: 7.8, qualityScore: 97, period: '2026 Q3（进行中）', paidAt: '', status: 'active', pairs: 14 },
  { id: 'LQ-2026-Q3-002', institution: 'Citadel Prime Brokerage', pool: '全市场多池', totalShare: 0.225, volumeShare: 0.262, rebateTier: 'tier1', rebateRate: 0.0003, rebateAmount: 1_820_000, spreadCaptured: 612_000, makerRatio: 0.79, takerRatio: 0.21, uptime: 0.999, latency: 6.2, qualityScore: 98, period: '2026 Q3（进行中）', paidAt: '', status: 'active', pairs: 44 },
  { id: 'LQ-2026-Q3-003', institution: '新航资管', pool: 'BTC-PERP 池', totalShare: 0.018, volumeShare: 0.022, rebateTier: 'tier3', rebateRate: 0.0001, rebateAmount: 0, spreadCaptured: 0, makerRatio: 0.32, takerRatio: 0.68, uptime: 0.852, latency: 32.4, qualityScore: 62, period: '2026 Q3（进行中）', paidAt: '', status: 'pending', pairs: 2 },
];

const INST_REPORTS: InstReport[] = [
  { id: 'RPT-2026-0719-AX', title: 'Apex Sigma Capital · 6 月运营报告', type: 'monthly', institution: 'Apex Sigma Capital', period: '2026-06', generatedAt: '2026-07-05 08:00:00', pages: 42, recipients: 8, sections: ['AUM 概览', '交易分布', 'PnL 归因', '风控指标', '流动性报告', 'API 调用统计', '税务摘要', '合规清单'], dataPoints: 12_840, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 4_280_000 },
  { id: 'RPT-2026-0719-CP', title: 'Citadel Prime Brokerage · Q2 季度报告', type: 'quarterly', institution: 'Citadel Prime Brokerage', period: '2026 Q2', generatedAt: '2026-07-08 14:32:00', pages: 128, recipients: 18, sections: ['季度运营总览', '机构服务 KPI', 'PB 交易分布', '信用额度使用', '大宗撮合汇总', '流动性分成', '风险敞口', '衍生品对冲', 'API 接入统计', '合规审计', 'KYB 状态', '下季度展望'], dataPoints: 48_200, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 12_400_000 },
  { id: 'RPT-2026-0719-HL', title: 'Helios Quant Partners · 周报', type: 'weekly', institution: 'Helios Quant Partners', period: '2026-W29', generatedAt: '2026-07-19 06:00:00', pages: 18, recipients: 4, sections: ['本周交易', 'PnL 归因', '策略表现', '风险指标', '下周展望'], dataPoints: 2_240, status: 'ready', whiteLabel: true, compliance: false, format: 'pdf', size: 1_280_000 },
  { id: 'RPT-2026-0719-PS', title: 'Polaris Sovereign Capital · 半年报', type: 'quarterly', institution: 'Polaris Sovereign Capital', period: '2026 H1', generatedAt: '2026-07-10 10:15:00', pages: 86, recipients: 6, sections: ['半年运营总览', 'AUM 增长', '资产配置', '风险归因', '大宗成交', '做市表现', '合规审计', '下期展望'], dataPoints: 32_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 8_900_000 },
  { id: 'RPT-2026-0719-YF', title: '永丰银行资管 · 日运营报告', type: 'daily', institution: '永丰银行资管', period: '2026-07-19', generatedAt: '2026-07-19 18:00:00', pages: 8, recipients: 12, sections: ['今日交易', 'PnL', '持仓变动', '风控指标'], dataPoints: 1_280, status: 'ready', whiteLabel: true, compliance: true, format: 'html', size: 320_000 },
  { id: 'RPT-2026-0719-OR', title: 'Orion Global Macro · 月报', type: 'monthly', institution: 'Orion Global Macro', period: '2026-06', generatedAt: '2026-07-05 09:00:00', pages: 38, recipients: 5, sections: ['月度运营', '宏观策略', 'PnL 归因', '对冲有效性', '风险敞口'], dataPoints: 8_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 3_120_000 },
  { id: 'RPT-2026-0719-AG', title: 'Argonaut FO · 年度审计报告', type: 'audit', institution: 'Argonaut Family Office', period: '2025', generatedAt: '2026-04-30 18:00:00', pages: 184, recipients: 3, sections: ['年度审计', 'AUM 增长', '税务摘要', '合规审计', 'KYB/KYC 状态', '风险事件', '内部审计'], dataPoints: 86_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 22_400_000 },
];

const HEDGE_INTERFACES: HedgeInterface[] = [
  { id: 'HDG-001', institution: 'Apex Sigma Capital', product: 'BTC-PERP', type: 'perp', notional: 24_500_000, delta: 0.94, vega: 0, theta: -28.4, gamma: 0, hedgeRatio: 0.96, effectiveness: 0.94, pnl: 1_280_000, basis: 0.0012, status: 'active', startedAt: '2026-04-15', expiresAt: '2026-09-15', counterparty: '撮合池 · 内部对冲', venue: 'Deribit + 内部' },
  { id: 'HDG-002', institution: 'Helios Quant Partners', product: 'ETH-30D-3500-C', type: 'option', notional: 8_200_000, delta: 0.62, vega: 124.5, theta: -42.8, gamma: 0.018, hedgeRatio: 0.88, effectiveness: 0.86, pnl: 480_000, basis: 0.0008, status: 'active', startedAt: '2026-05-20', expiresAt: '2026-08-20', counterparty: 'Deribit', venue: 'Deribit' },
  { id: 'HDG-003', institution: 'Polaris Sovereign Capital', product: 'BTC 跨期价差', type: 'future', notional: 56_000_000, delta: 0.02, vega: 0, theta: 0, gamma: 0, hedgeRatio: 0.99, effectiveness: 0.92, pnl: 2_180_000, basis: 0.0005, status: 'active', startedAt: '2026-03-01', expiresAt: '2026-12-31', counterparty: '内部对冲', venue: 'CME + 内部' },
  { id: 'HDG-004', institution: 'Citadel Prime Brokerage', product: '多币种 IR Swap', type: 'swap', notional: 120_000_000, delta: 0, vega: 0, theta: 0, gamma: 0, hedgeRatio: 1.0, effectiveness: 0.98, pnl: 3_240_000, basis: 0.0002, status: 'active', startedAt: '2026-01-15', expiresAt: '2027-01-15', counterparty: '高盛 / 摩根', venue: 'OTC' },
  { id: 'HDG-005', institution: 'Vega Trading Group', product: 'SOL-PERP', type: 'perp', notional: 4_800_000, delta: 0.88, vega: 0, theta: -8.2, gamma: 0, hedgeRatio: 0.92, effectiveness: 0.88, pnl: -120_000, basis: 0.0018, status: 'rolling', startedAt: '2026-06-10', expiresAt: '2026-08-10', counterparty: '撮合池', venue: '内部' },
  { id: 'HDG-006', institution: 'Orion Global Macro', product: '黄金 vs BTC 价差', type: 'forward', notional: 18_000_000, delta: -0.32, vega: 0, theta: 0, gamma: 0, hedgeRatio: 0.78, effectiveness: 0.74, pnl: 680_000, basis: 0.0024, status: 'active', startedAt: '2026-05-01', expiresAt: '2026-11-01', counterparty: '内部对冲', venue: 'OTC' },
  { id: 'HDG-007', institution: '永丰银行资管', product: 'USD/HKD 货币掉期', type: 'swap', notional: 32_000_000, delta: 0, vega: 0, theta: 0, gamma: 0, hedgeRatio: 1.0, effectiveness: 0.96, pnl: 480_000, basis: 0.0001, status: 'active', startedAt: '2026-04-01', expiresAt: '2027-04-01', counterparty: '汇丰 / 渣打', venue: 'OTC' },
];

const MM_PARTNERSHIPS: MmPartnership[] = [
  { id: 'MMP-001', institution: 'Apex Sigma Capital', pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOT/USDT', 'TRX/USDT', 'LTC/USDT', 'BCH/USDT'], depthUsd: 18_500_000, spreadTarget: 0.0005, rebate: 0.00025, uptime: 0.998, volume24h: 285_000_000, inventory: 8_400_000, riskLimit: 25_000_000, status: 'active', contractStart: '2024-03-12', contractEnd: '2027-03-11', revenueShare: 0.55, qualityScore: 96, tier: 'tier1', leverage: 3 },
  { id: 'MMP-002', institution: 'Medved Capital Partners', pairs: ['ETH/USDT', 'BTC/USDT', 'ARB/USDT', 'OP/USDT', 'MATIC/USDT', 'ATOM/USDT', 'NEAR/USDT', 'APT/USDT', 'SUI/USDT', 'INJ/USDT', 'TIA/USDT', 'SEI/USDT', 'WLD/USDT', 'STRK/USDT', 'PYTH/USDT', 'JTO/USDT', 'JUP/USDT', 'ONDO/USDT'], depthUsd: 12_400_000, spreadTarget: 0.0008, rebate: 0.00022, uptime: 0.996, volume24h: 148_000_000, inventory: 5_200_000, riskLimit: 15_000_000, status: 'active', contractStart: '2024-04-22', contractEnd: '2026-04-21', revenueShare: 0.50, qualityScore: 92, tier: 'tier1', leverage: 2.5 },
  { id: 'MMP-003', institution: 'Citadel Prime Brokerage', pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOT/USDT', 'TRX/USDT', 'TON/USDT', 'SHIB/USDT', 'PEPE/USDT', 'WIF/USDT', 'BONK/USDT', 'FLOKI/USDT', 'ORDI/USDT', 'SATS/USDT', 'RATS/USDT', 'MEME/USDT', 'BOME/USDT', 'ENA/USDT', 'ETHFI/USDT', 'PENDLE/USDT', 'EIGEN/USDT', 'TAO/USDT', 'IO/USDT', 'ZRO/USDT', 'LISTA/USDT', 'BANK/USDT', 'REZ/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT'], depthUsd: 42_000_000, spreadTarget: 0.0004, rebate: 0.0003, uptime: 0.999, volume24h: 685_000_000, inventory: 22_400_000, riskLimit: 60_000_000, status: 'active', contractStart: '2023-04-01', contractEnd: '2028-03-31', revenueShare: 0.60, qualityScore: 98, tier: 'tier1', leverage: 5 },
  { id: 'MMP-004', institution: 'Vega Trading Group', pairs: ['SOL-PERP', 'SOL/USDT', 'JTO/USDT', 'JUP/USDT', 'PYTH/USDT', 'W/USDT', 'TIA/USDT', 'SEI/USDT'], depthUsd: 4_200_000, spreadTarget: 0.0012, rebate: 0.00018, uptime: 0.984, volume24h: 38_000_000, inventory: 1_800_000, riskLimit: 6_000_000, status: 'active', contractStart: '2024-01-15', contractEnd: '2026-01-14', revenueShare: 0.45, qualityScore: 84, tier: 'tier2', leverage: 4 },
  { id: 'MMP-005', institution: 'Orion Global Macro', pairs: ['BTC-PERP', 'ETH-PERP', 'BTC/USDT', 'ETH/USDT'], depthUsd: 8_400_000, spreadTarget: 0.0006, rebate: 0.0002, uptime: 0.991, volume24h: 84_000_000, inventory: 3_200_000, riskLimit: 12_000_000, status: 'beta', contractStart: '2025-09-10', contractEnd: '2026-09-09', revenueShare: 0.48, qualityScore: 88, tier: 'tier2', leverage: 3.5 },
  { id: 'MMP-006', institution: '新航资管', pairs: ['BTC-PERP', 'ETH-PERP'], depthUsd: 1_200_000, spreadTarget: 0.0015, rebate: 0.0001, uptime: 0.852, volume24h: 8_400_000, inventory: 480_000, riskLimit: 2_000_000, status: 'onboarding', contractStart: '2026-05-20', contractEnd: '2027-05-19', revenueShare: 0.40, qualityScore: 62, tier: 'tier3', leverage: 2 },
];

const API_CREDENTIALS: ApiCredential[] = [
  { id: 'AK-2024-APX-01', institution: 'Apex Sigma Capital', name: 'Apex PB Trading', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '撤单历史'], rateLimit: 600, used: 286, ipWhitelist: ['52.84.18.0/24', '13.244.22.0/24', '18.136.18.0/24'], status: 'active', createdAt: '2024-03-12', lastUsed: '2026-07-19 14:32:18', expiresAt: '2026-09-12', apiKey: 'zs_apx_4j8s9d2k5l1m3n6p8q0r', signature: 'hmac', region: 'ap-east-1', calls24h: 1_286_400 },
  { id: 'AK-2024-CIT-01', institution: 'Citadel Prime Brokerage', name: 'Citadel PB + MarketData', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '行情订阅', 'K线', '深度'], rateLimit: 1000, used: 728, ipWhitelist: ['13.244.0.0/16', '52.84.0.0/16'], status: 'active', createdAt: '2023-04-01', lastUsed: '2026-07-19 14:33:00', expiresAt: '2026-10-01', apiKey: 'zs_cit_2k4m6n8p0q2r4s6t8u0v', signature: 'ed25519', region: 'ap-east-1 + eu-west-1', calls24h: 4_280_000 },
  { id: 'AK-2024-HEL-01', institution: 'Helios Quant Partners', name: 'Helios Quant Risk', type: 'risk_query', permissions: ['风险查询', '持仓', '成交', '对账单'], rateLimit: 300, used: 142, ipWhitelist: ['34.218.0.0/16'], status: 'active', createdAt: '2023-11-04', lastUsed: '2026-07-19 14:18:22', expiresAt: '2026-11-04', apiKey: 'zs_hel_8w0y2a4b6c8d0e2f4g6h', signature: 'hmac', region: 'us-west-2', calls24h: 685_200 },
  { id: 'AK-2024-POL-01', institution: 'Polaris Sovereign Capital', name: 'Polaris Settlement', type: 'settlement', permissions: ['结算查询', '结算指令', '对账单', '回单'], rateLimit: 200, used: 84, ipWhitelist: ['52.18.0.0/16', '13.32.0.0/16'], status: 'active', createdAt: '2023-08-22', lastUsed: '2026-07-19 13:48:55', expiresAt: '2026-08-22', apiKey: 'zs_pol_2i4k6m8o0q2s4u6w8y0a', signature: 'rsa', region: 'ap-east-1 + me-south-1', calls24h: 124_800 },
  { id: 'AK-2024-MED-01', institution: 'Medved Capital Partners', name: 'Medved MM API', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '行情订阅'], rateLimit: 500, used: 218, ipWhitelist: ['52.28.0.0/16', '18.196.0.0/16'], status: 'active', createdAt: '2024-04-22', lastUsed: '2026-07-19 14:08:42', expiresAt: '2026-10-22', apiKey: 'zs_med_2c4e6g8i0k2m4o6q8s0u', signature: 'hmac', region: 'eu-central-1', calls24h: 942_000 },
  { id: 'AK-2025-VEG-01', institution: 'Vega Trading Group', name: 'Vega High-Freq', type: 'pb_trading', permissions: ['订单', '撤单', '查询'], rateLimit: 800, used: 612, ipWhitelist: ['34.218.0.0/16'], status: 'active', createdAt: '2024-01-15', lastUsed: '2026-07-19 14:32:08', expiresAt: '2026-07-25', apiKey: 'zs_veg_2w4y6a8c0e2g4i6k8m0o', signature: 'hmac', region: 'us-west-2', calls24h: 1_840_000 },
  { id: 'AK-2025-YON-01', institution: '永丰银行资管', name: '永丰 PB Trading', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '白盒报告'], rateLimit: 400, used: 156, ipWhitelist: ['13.244.0.0/16', '52.84.0.0/16', '13.115.0.0/16'], status: 'rotating', createdAt: '2024-02-28', lastUsed: '2026-07-19 13:58:11', expiresAt: '2026-08-15', apiKey: 'zs_yon_2q4s6u8w0y2a4c6e8g0i', signature: 'rsa', region: 'ap-east-1', calls24h: 524_000 },
  { id: 'AK-2024-ORI-01', institution: 'Orion Global Macro', name: 'Orion Macro', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '对账单'], rateLimit: 300, used: 124, ipWhitelist: ['34.218.0.0/16', '52.84.0.0/16'], status: 'active', createdAt: '2024-07-08', lastUsed: '2026-07-19 14:05:33', expiresAt: '2026-10-08', apiKey: 'zs_ori_2k4m6o8q0s2u4w6y8a0c', signature: 'hmac', region: 'us-west-2', calls24h: 286_400 },
];


// ============================================================
// 样式
// ============================================================

const styles = \`
  @keyframes inst-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes inst-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
  @keyframes inst-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes inst-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes inst-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes inst-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .inst-stagger > * { animation: inst-fade-in 0.4s ease both; }
  .inst-stagger > *:nth-child(1) { animation-delay: 0.05s; }
  .inst-stagger > *:nth-child(2) { animation-delay: 0.10s; }
  .inst-stagger > *:nth-child(3) { animation-delay: 0.15s; }
  .inst-stagger > *:nth-child(4) { animation-delay: 0.20s; }
  .inst-stagger > *:nth-child(5) { animation-delay: 0.25s; }
  .inst-stagger > *:nth-child(6) { animation-delay: 0.30s; }
  .inst-stagger > *:nth-child(7) { animation-delay: 0.35s; }
  .inst-stagger > *:nth-child(8) { animation-delay: 0.40s; }
  .inst-stagger > *:nth-child(9) { animation-delay: 0.45s; }
  .inst-stagger > *:nth-child(10) { animation-delay: 0.50s; }
  .inst-stagger > *:nth-child(11) { animation-delay: 0.55s; }
  .inst-stagger > *:nth-child(12) { animation-delay: 0.60s; }
  .inst-pulse { animation: inst-pulse 2s ease-in-out infinite; }
  .inst-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.10), transparent); background-size: 200% 100%; animation: inst-shimmer 2s linear infinite; }
  .inst-slide-in { animation: inst-slide-in 0.3s ease-out; }
  .inst-bar { animation: inst-bar 0.6s ease-out; transform-origin: left; }
  .inst-float { animation: inst-float 3s ease-in-out infinite; }
\`;

// ============================================================
// 主组件
// ============================================================

// ============================================================
// 通用 Drawer
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
      <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto inst-slide-in" style={{ background: BRAND.bg, borderLeft: '1px solid ' + BRAND.border }}>
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

// ============================================================
// DRAWER 1: Institution
// ============================================================
function InstitutionDrawer({ inst, onClose }: { inst: Institution; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={inst.name} subtitle={inst.legalName + ' · ' + INST_TYPE_LABEL[inst.type]} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-semibold" style={{ background: inst.iconBg, color: inst.iconColor }}>{inst.logo}</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{inst.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{inst.region} · {inst.jurisdiction}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: TIER_COLOR[inst.tier].bg, color: TIER_COLOR[inst.tier].color }}>{TIER_COLOR[inst.tier].label}级</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: statusBadge(inst.status).bg, color: statusBadge(inst.status).color }}>{statusBadge(inst.status).label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>⭐ {inst.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: BRAND.textSub }}>联系方式：{inst.contact} · {inst.email}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="AUM" value={formatUsd(inst.aum)} color={BRAND.primary} />
          <DrawerKv label="月成交" value={formatUsd(inst.monthlyVolume)} color={BRAND.success} />
          <DrawerKv label="子账户" value={String(inst.accounts)} />
          <DrawerKv label="风险评分" value={String(inst.riskScore)} color={inst.riskScore < 20 ? BRAND.success : inst.riskScore < 35 ? BRAND.amber : BRAND.danger} />
          <DrawerKv label="KYB 等级" value={'L' + inst.kybLevel} color={BRAND.success} />
          <DrawerKv label="KYB 状态" value={statusBadge(inst.kybStatus).label} color={statusBadge(inst.kybStatus).color} />
          <DrawerKv label="合规标记" value={String(inst.complianceFlags)} color={inst.complianceFlags === 0 ? BRAND.success : BRAND.amber} />
          <DrawerKv label="评级" value={'⭐ ' + inst.rating.toFixed(1)} />
        </div>
        <DrawerSection title="合作服务">
          <div className="flex flex-wrap gap-1.5">
            {inst.services.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-md" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{s}</span>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="标签">
          <div className="flex flex-wrap gap-1.5">
            {inst.tags.map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>#{t}</span>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="合约 / 时间">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>入驻：</span><span style={{ color: BRAND.text }}>{inst.joinedAt}</span></div>
            <div><span style={{ color: BRAND.textSub }}>合约到期：</span><span style={{ color: BRAND.text }}>{inst.contractEnd}</span></div>
            <div><span style={{ color: BRAND.textSub }}>合作时长：</span><span style={{ color: BRAND.text }}>{Math.round((new Date(inst.contractEnd).getTime() - new Date(inst.joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} 个月</span></div>
            <div><span style={{ color: BRAND.textSub }}>合约状态：</span><span style={{ color: BRAND.success }}>履约中</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 2: KybApplication
// ============================================================
function KybDrawer({ app, onClose }: { app: KybApplication; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={app.institution} subtitle={app.id + ' · ' + app.type} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{app.institution}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>提交 {app.submittedAt}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: statusBadge(app.status).bg, color: statusBadge(app.status).color }}>{statusBadge(app.status).label}</span>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(20,184,129,0.05)' }}>
          <div className="flex items-center justify-between text-[11px] mb-1" style={{ color: BRAND.textSub }}>
            <span>当前阶段：{REVIEW_STAGE_LABEL[app.reviewStage]}</span>
            <span>审核员 {app.reviewer}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
            <div className="h-full inst-bar" style={{ width: app.progress + '%', background: app.progress === 100 ? BRAND.success : BRAND.primary }}></div>
          </div>
          <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>总进度 {app.progress}%</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="文件数" value={String(app.documents)} />
          <DrawerKv label="缺失文件" value={String(app.missingDocs)} color={app.missingDocs > 0 ? BRAND.amber : BRAND.success} />
          <DrawerKv label="合规标记" value={String(app.flags)} color={app.flags > 0 ? BRAND.amber : BRAND.success} />
          <DrawerKv label="风险等级" value={statusBadge(app.riskLevel).label} color={statusBadge(app.riskLevel).color} />
          <DrawerKv label="UBO 数量" value={String(app.uboCount)} />
          <DrawerKv label="AML 命中" value={String(app.amlHits)} color={app.amlHits > 0 ? BRAND.amber : BRAND.success} />
          <DrawerKv label="制裁命中" value={String(app.sanctionsHits)} color={app.sanctionsHits > 0 ? BRAND.danger : BRAND.success} />
          <DrawerKv label="剩余 SLA" value={app.estimatedDays + ' 天'} color={app.estimatedDays <= 1 ? BRAND.danger : BRAND.amber} />
        </div>
        <DrawerSection title="审核阶段">
          <div className="space-y-1.5 text-[11px]">
            {(['documents', 'ubo', 'aml', 'sanctions', 'final'] as ReviewStage[]).map((s, i) => {
              const isCurrent = s === app.reviewStage;
              const isPast = (['documents', 'ubo', 'aml', 'sanctions', 'final'] as ReviewStage[]).indexOf(app.reviewStage) > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  {isPast ? <CheckCircle className="w-3 h-3" style={{ color: BRAND.success }} /> : isCurrent ? <Activity className="w-3 h-3 inst-pulse" style={{ color: BRAND.primary }} /> : <CircleDot className="w-3 h-3" style={{ color: BRAND.textMute }} />}
                  <span style={{ color: isCurrent ? BRAND.primary : isPast ? BRAND.text : BRAND.textMute }}>{REVIEW_STAGE_LABEL[s]}</span>
                </div>
              );
            })}
          </div>
        </DrawerSection>
        <DrawerSection title="审核备注">
          <p className="text-[11px]" style={{ color: BRAND.textSub }}>{app.notes}</p>
        </DrawerSection>
        <DrawerSection title="合规研究方向">
          <p className="text-[11px]" style={{ color: BRAND.textSub }}>司法管辖区：{app.jurisdiction} · KYB / AML / 制裁筛查为合规研究方向示例，定性为研究 / 工具 / 辅助。</p>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 3: PbTrade
// ============================================================
function PbDrawer({ trade, onClose }: { trade: PbTrade; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={trade.id} subtitle={trade.symbol + ' · ' + trade.institution} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: trade.side === 'buy' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.10)', color: trade.side === 'buy' ? BRAND.success : BRAND.danger }}>
            {trade.side === 'buy' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{trade.side.toUpperCase()} {trade.qty.toLocaleString()} {trade.symbol}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>@{'$'}{trade.price.toLocaleString()} · {trade.executedAt}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(trade.status).bg, color: statusBadge(trade.status).color }}>{statusBadge(trade.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="成交价" value={'$' + trade.price.toLocaleString()} />
          <DrawerKv label="数量" value={trade.qty.toLocaleString()} />
          <DrawerKv label="成交额" value={formatUsd(trade.value)} color={BRAND.primary} />
          <DrawerKv label="手续费" value={formatUsd(trade.fee)} color={BRAND.amber} />
          <DrawerKv label="返佣" value={formatUsd(trade.rebate)} color={BRAND.success} />
          <DrawerKv label="净费" value={formatUsd(trade.fee - trade.rebate)} color={BRAND.amber} />
          <DrawerKv label="杠杆" value={trade.leverage + 'x'} color={trade.leverage > 1 ? BRAND.amber : BRAND.text} />
          <DrawerKv label="信用占用" value={formatUsd(trade.creditUsed)} color={BRAND.amber} />
        </div>
        <DrawerSection title="成交环境">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>场所：</span><span style={{ color: BRAND.text }}>{trade.venue}</span></div>
            <div><span style={{ color: BRAND.textSub }}>对手方：</span><span style={{ color: BRAND.text }}>{trade.counterparty}</span></div>
            <div><span style={{ color: BRAND.textSub }}>结算：</span><span style={{ color: BRAND.text }}>T+{trade.settlementT}</span></div>
            <div><span style={{ color: BRAND.textSub }}>流动性：</span><span style={{ color: statusBadge(trade.liquidity).color }}>{statusBadge(trade.liquidity).label}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 4: CreditLine
// ============================================================
function CreditDrawer({ line, onClose }: { line: CreditLine; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={line.institution + ' · 信用额度'} subtitle={line.id} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{line.institution}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{line.id} · 到期 {line.expiresAt}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: statusBadge(line.status).bg, color: statusBadge(line.status).color }}>{statusBadge(line.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="总额度" value={formatUsd(line.total)} color={BRAND.primary} />
          <DrawerKv label="已用" value={formatUsd(line.used)} color={BRAND.amber} />
          <DrawerKv label="可用" value={formatUsd(line.available)} color={BRAND.success} />
          <DrawerKv label="利用率" value={line.utilizationPct.toFixed(1) + '%'} color={line.utilizationPct > 0.7 ? BRAND.danger : line.utilizationPct > 0.5 ? BRAND.amber : BRAND.success} />
          <DrawerKv label="利率" value={(line.rate * 100).toFixed(2) + '%'} />
          <DrawerKv label="抵押率" value={line.collateralRatio.toFixed(1) + 'x'} />
          <DrawerKv label="抵押价值" value={formatUsd(line.collateralUsd)} />
          <DrawerKv label="LVR" value={line.lvr.toFixed(2)} color={line.lvr > 0.7 ? BRAND.danger : BRAND.text} />
        </div>
        <DrawerSection title="风控阈值">
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textSub }}>追保线：</span><span style={{ color: BRAND.amber }}>{formatUsd(line.marginCall)}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textSub }}>强平线：</span><span style={{ color: BRAND.danger }}>{formatUsd(line.liquidationLine)}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textSub }}>已用：</span><span style={{ color: BRAND.text }}>{formatUsd(line.used)}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="复审计划">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>上次复审：</span><span style={{ color: BRAND.text }}>{line.lastReview}</span></div>
            <div><span style={{ color: BRAND.textSub }}>下次复审：</span><span style={{ color: BRAND.text }}>{line.nextReview}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 5: BlockTrade
// ============================================================
function BlockDrawer({ trade, onClose }: { trade: BlockTrade; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={trade.blockId} subtitle={trade.symbol + ' · ' + trade.venue} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: trade.side === 'buy' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.10)', color: trade.side === 'buy' ? BRAND.success : BRAND.danger }}>
            {trade.side === 'buy' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{trade.side.toUpperCase()} {trade.qty.toLocaleString()} {trade.symbol}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>@{'$'}{trade.price.toLocaleString()} · 折扣 {(trade.discount * 100).toFixed(2)}%</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(trade.status).bg, color: statusBadge(trade.status).color }}>{statusBadge(trade.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="成交价" value={'$' + trade.price.toLocaleString()} />
          <DrawerKv label="数量" value={trade.qty.toLocaleString()} />
          <DrawerKv label="成交额" value={formatUsd(trade.value)} color={BRAND.primary} />
          <DrawerKv label="折扣" value={(trade.discount * 100).toFixed(2) + '%'} color={BRAND.success} />
          <DrawerKv label="手续费" value={formatUsd(trade.fee)} color={BRAND.amber} />
          <DrawerKv label="场所" value={trade.venue} />
          <DrawerKv label="结算" value={trade.settlement} />
          <DrawerKv label="台" value={trade.desk} />
        </div>
        <DrawerSection title="交易双方">
          <div className="space-y-1 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>买方：</span><span style={{ color: BRAND.text }}>{trade.buyer}</span></div>
            <div><span style={{ color: BRAND.textSub }}>卖方：</span><span style={{ color: BRAND.text }}>{trade.seller}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="时间线">
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>RFQ 报价：</span><span style={{ color: BRAND.text }}>{trade.rfqAt || '-'}</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>达成：</span><span style={{ color: BRAND.text }}>{trade.agreedAt || '-'}</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>结算：</span><span style={{ color: BRAND.text }}>{trade.settledAt || '待结算'}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 6: LiquidityShare
// ============================================================
function LiquidityDrawer({ share, onClose }: { share: LiquidityShare; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={share.institution + ' · 流动性分成'} subtitle={share.pool + ' · ' + share.period} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{share.institution}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{share.id} · {share.pairs} 个交易对</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: statusBadge(share.status).bg, color: statusBadge(share.status).color }}>{statusBadge(share.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="总份额" value={(share.totalShare * 100).toFixed(1) + '%'} color={BRAND.primary} />
          <DrawerKv label="量份额" value={(share.volumeShare * 100).toFixed(1) + '%'} color={BRAND.primary} />
          <DrawerKv label="返佣率" value={(share.rebateRate * 10000).toFixed(1) + ' bps'} color={BRAND.amber} />
          <DrawerKv label="返佣金额" value={formatUsd(share.rebateAmount)} color={BRAND.success} />
          <DrawerKv label="价差捕获" value={formatUsd(share.spreadCaptured)} color={BRAND.success} />
          <DrawerKv label="Tier" value={share.rebateTier.toUpperCase()} />
          <DrawerKv label="Maker 占比" value={(share.makerRatio * 100).toFixed(1) + '%'} color={BRAND.success} />
          <DrawerKv label="Taker 占比" value={(share.takerRatio * 100).toFixed(1) + '%'} color={BRAND.amber} />
        </div>
        <DrawerSection title="服务质量">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>Uptime：</span><span style={{ color: BRAND.success }}>{(share.uptime * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>延迟：</span><span style={{ color: BRAND.text }}>{share.latency.toFixed(1)} ms</span></div>
            <div><span style={{ color: BRAND.textSub }}>质量分：</span><span style={{ color: share.qualityScore >= 90 ? BRAND.success : BRAND.amber }}>{share.qualityScore} / 100</span></div>
            <div><span style={{ color: BRAND.textSub }}>发放时间：</span><span style={{ color: BRAND.text }}>{share.paidAt || '待发放'}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 7: InstReport
// ============================================================
function ReportDrawer({ report, onClose }: { report: InstReport; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={report.title} subtitle={report.id + ' · ' + report.type} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{report.title}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{report.institution} · {report.period} · {report.format.toUpperCase()}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(report.status).bg, color: statusBadge(report.status).color }}>{statusBadge(report.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="页数" value={String(report.pages)} />
          <DrawerKv label="数据点" value={formatInt(report.dataPoints)} color={BRAND.primary} />
          <DrawerKv label="收件人" value={String(report.recipients)} />
          <DrawerKv label="大小" value={formatBytes(report.size)} />
          <DrawerKv label="白标" value={report.whiteLabel ? '是' : '否'} color={report.whiteLabel ? BRAND.success : BRAND.textSub} />
          <DrawerKv label="合规" value={report.compliance ? '是' : '否'} color={report.compliance ? BRAND.success : BRAND.textSub} />
          <DrawerKv label="类型" value={report.type} />
          <DrawerKv label="格式" value={report.format.toUpperCase()} />
        </div>
        <DrawerSection title="章节结构">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
            {report.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <FileCheck className="w-3 h-3" style={{ color: BRAND.primary }} />
                <span style={{ color: BRAND.textSub }}>{s}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <div className="rounded-xl p-3" style={{ background: 'rgba(20,184,129,0.05)' }}>
          <div className="text-[11px]" style={{ color: BRAND.textSub }}>生成时间：{report.generatedAt}</div>
        </div>
        <button className="w-full py-2.5 text-sm rounded-lg font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>下载报告 ({report.format.toUpperCase()})</button>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 8: HedgeInterface
// ============================================================
function HedgeDrawer({ item, onClose }: { item: HedgeInterface; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={item.id} subtitle={item.product + ' · ' + item.type.toUpperCase()} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,169,64,0.12)', color: BRAND.amber }}>
            <ShieldHalf className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{item.product}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{item.institution} · {item.venue}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(item.status).bg, color: statusBadge(item.status).color }}>{statusBadge(item.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="名义本金" value={formatUsd(item.notional)} color={BRAND.primary} />
          <DrawerKv label="Delta" value={item.delta.toFixed(2)} />
          <DrawerKv label="Vega" value={item.vega.toFixed(1)} />
          <DrawerKv label="Theta" value={item.theta.toFixed(1)} color={BRAND.danger} />
          <DrawerKv label="Gamma" value={item.gamma.toFixed(3)} />
          <DrawerKv label="对冲率" value={(item.hedgeRatio * 100).toFixed(0) + '%'} color={item.hedgeRatio >= 0.9 ? BRAND.success : item.hedgeRatio >= 0.75 ? BRAND.amber : BRAND.danger} />
          <DrawerKv label="有效性" value={(item.effectiveness * 100).toFixed(0) + '%'} color={BRAND.success} />
          <DrawerKv label="基差" value={item.basis.toFixed(4)} />
        </div>
        <DrawerSection title="盈亏 / 时间">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>累计 PnL：</span><span style={{ color: item.pnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(item.pnl)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>开始：</span><span style={{ color: BRAND.text }}>{item.startedAt}</span></div>
            <div><span style={{ color: BRAND.textSub }}>到期：</span><span style={{ color: BRAND.text }}>{item.expiresAt}</span></div>
            <div><span style={{ color: BRAND.textSub }}>对手方：</span><span style={{ color: BRAND.text }}>{item.counterparty}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 9: MmPartnership
// ============================================================
function MmDrawer({ mm, onClose }: { mm: MmPartnership; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={mm.institution + ' · 联合做市'} subtitle={mm.id + ' · ' + mm.tier.toUpperCase()} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
            <CoinsIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{mm.institution}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{mm.pairs.length} 个交易对 · 合约 {mm.contractStart} ~ {mm.contractEnd}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(mm.status).bg, color: statusBadge(mm.status).color }}>{statusBadge(mm.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="深度" value={formatUsd(mm.depthUsd)} color={BRAND.primary} />
          <DrawerKv label="24H 量" value={formatUsd(mm.volume24h)} color={BRAND.success} />
          <DrawerKv label="目标点差" value={(mm.spreadTarget * 10000).toFixed(1) + ' bps'} />
          <DrawerKv label="返佣" value={(mm.rebate * 10000).toFixed(1) + ' bps'} color={BRAND.amber} />
          <DrawerKv label="Uptime" value={(mm.uptime * 100).toFixed(1) + '%'} color={BRAND.success} />
          <DrawerKv label="延迟" value={'< 20ms'} />
          <DrawerKv label="库存" value={formatUsd(mm.inventory)} />
          <DrawerKv label="风险限额" value={formatUsd(mm.riskLimit)} />
        </div>
        <DrawerSection title="合约 / 商业">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>分成：</span><span style={{ color: BRAND.primary }}>{(mm.revenueShare * 100).toFixed(0)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>质量分：</span><span style={{ color: BRAND.text }}>{mm.qualityScore} / 100</span></div>
            <div><span style={{ color: BRAND.textSub }}>杠杆：</span><span style={{ color: BRAND.text }}>{mm.leverage}x</span></div>
            <div><span style={{ color: BRAND.textSub }}>Tier：</span><span style={{ color: BRAND.primary }}>{mm.tier.toUpperCase()}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="交易对">
          <div className="flex flex-wrap gap-1.5">
            {mm.pairs.slice(0, 20).map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{p}</span>
            ))}
            {mm.pairs.length > 20 && <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>+{mm.pairs.length - 20} more</span>}
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 10: ApiCredential
// ============================================================
function ApiDrawer({ api, onClose }: { api: ApiCredential; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={api.name} subtitle={api.id + ' · ' + api.type} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(68,219,244,0.12)', color: BRAND.info }}>
            <Code className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{api.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{api.institution} · {api.signature.toUpperCase()}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(api.status).bg, color: statusBadge(api.status).color }}>{statusBadge(api.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="限速" value={api.rateLimit + '/s'} />
          <DrawerKv label="当前" value={api.used + '/s'} color={api.used / api.rateLimit > 0.8 ? BRAND.danger : BRAND.text} />
          <DrawerKv label="24H 调用" value={formatInt(api.calls24h)} color={BRAND.primary} />
          <DrawerKv label="区域" value={api.region} />
          <DrawerKv label="创建" value={api.createdAt} />
          <DrawerKv label="到期" value={api.expiresAt} color={new Date(api.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 ? BRAND.amber : BRAND.text} />
          <DrawerKv label="最后使用" value={api.lastUsed.split(' ')[0]} />
          <DrawerKv label="IP 白名单" value={String(api.ipWhitelist.length) + ' 个'} />
        </div>
        <DrawerSection title="权限范围">
          <div className="flex flex-wrap gap-1.5">
            {api.permissions.map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(68,219,244,0.10)', color: BRAND.info }}>{p}</span>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="API Key（已脱敏）">
          <div className="font-mono text-[11px] p-2 rounded-lg break-all" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{api.apiKey}</div>
          <p className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>完整 Secret Key 仅在创建 / 轮换时明文显示一次，请妥善保管。</p>
        </DrawerSection>
        <DrawerSection title="IP 白名单">
          <div className="space-y-1 text-[11px] font-mono">
            {api.ipWhitelist.map((ip, i) => (
              <div key={i} style={{ color: BRAND.textSub }}>{ip}</div>
            ))}
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// DRAWER 11: HelpDrawer
// ============================================================
function HelpDrawer({ onClose }: { onClose: () => void }) {
  const faq = [
    { q: '如何申请成为合作机构？', a: '在"机构" Tab 点击"申请入驻"，填写机构基本信息、UBO 穿透、AML 资料，提交后进入 KYB 审核流程（5-7 工作日）。' },
    { q: '信用额度如何评估？', a: '基于机构 AUM / 风险评分 / 抵押率 / 历史履约综合评估；铂金机构最高 50 亿美元；信用额度按季度复审。' },
    { q: '做市商返佣如何结算？', a: '按月结算，下月 5 日自动发放至机构账户；tier1 返佣 2.5 bps，tier2 返佣 1.8 bps，tier3 返佣 1.0 bps。' },
    { q: '大宗撮合 T+2 结算如何工作？', a: '撮合完成后，买卖双方资产分别锁定在托管账户；T+2 链上结算时同步划转；T+1 加急服务仅对铂金机构开放。' },
    { q: 'API 调用频率限制？', a: '默认 200-1000 次/秒，可按需申请扩容；PB 交易 API 延迟 SLA P99 < 50ms；行情 API P99 < 10ms。' },
    { q: '白盒报告支持哪些格式？', a: 'PDF / XLSX / HTML / CSV；支持自定义白标（机构 Logo + 色系）；周报 / 月报 / 季报 / 半年报 / 年报 / 审计报告。' },
    { q: '如何提升合作 Tier？', a: '连续 3 个月质量分 ≥ 95 + 月成交 ≥ $100M 可申请升级；Tier 升级后返佣率、API 限额、信用额度同步提升。' },
    { q: '可以做市永续合约吗？', a: '可以，但需独立申请做市商资格 + 提交《做市商风险承诺函》；做市商杠杆最高 5x。' },
  ];
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title="机构服务与做市商合作 · 帮助中心" subtitle="常见问题 / 快捷键 / 合规说明" onClose={onClose} />
      <div className="p-4 space-y-4">
        <DrawerSection title="常见问题 FAQ">
          <div className="space-y-2">
            {faq.map((x, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: BRAND.bgCardHover, border: '1px solid ' + BRAND.border }}>
                <div className="text-[12px] font-medium mb-1" style={{ color: BRAND.text }}>Q. {x.q}</div>
                <p className="text-[11px]" style={{ color: BRAND.textSub }}>A. {x.a}</p>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="快捷键">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bg, color: BRAND.text, border: '1px solid ' + BRAND.border }}>/</kbd><span style={{ color: BRAND.textSub }}>聚焦搜索框</span></div>
            <div className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bg, color: BRAND.text, border: '1px solid ' + BRAND.border }}>Esc</kbd><span style={{ color: BRAND.textSub }}>关闭 Drawer</span></div>
            <div className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bg, color: BRAND.text, border: '1px solid ' + BRAND.border }}>Tab</kbd><span style={{ color: BRAND.textSub }}>切换主分区</span></div>
            <div className="flex items-center gap-2"><kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bg, color: BRAND.text, border: '1px solid ' + BRAND.border }}>Enter</kbd><span style={{ color: BRAND.textSub }}>打开选中项详情</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="合规说明">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 机构服务与做市商合作仅作技术能力演示，不构成投资建议</li>
            <li>· 平台所有 KYB / AML / 制裁筛查均严格遵循合规研究方向示例</li>
            <li>· 机构服务不承诺收益 / 保本 / 刚兑 / 稳赚 / 担保</li>
            <li>· 机构服务区域为合规研究方向示例，定性为研究 / 工具 / 辅助</li>
            <li>· 平台持续开展合规自查、KYB 尽调、KYC 更新、利用冲突检查</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


export function PortalInstitution() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<InstType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<InstStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'aum' | 'monthlyVolume' | 'rating' | 'joinedAt'>('aum');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [drawerInst, setDrawerInst] = useState<Institution | null>(null);
  const [drawerKyb, setDrawerKyb] = useState<KybApplication | null>(null);
  const [drawerPb, setDrawerPb] = useState<PbTrade | null>(null);
  const [drawerCredit, setDrawerCredit] = useState<CreditLine | null>(null);
  const [drawerBlock, setDrawerBlock] = useState<BlockTrade | null>(null);
  const [drawerLiq, setDrawerLiq] = useState<LiquidityShare | null>(null);
  const [drawerReport, setDrawerReport] = useState<InstReport | null>(null);
  const [drawerHedge, setDrawerHedge] = useState<HedgeInterface | null>(null);
  const [drawerMm, setDrawerMm] = useState<MmPartnership | null>(null);
  const [drawerApi, setDrawerApi] = useState<ApiCredential | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3500);
    return () => clearInterval(t);
  }, []);

  const kpis = useMemo(() => {
    const totalAum = INSTITUTIONS.reduce((s, x) => s + x.aum, 0);
    const totalVol = INSTITUTIONS.reduce((s, x) => s + x.monthlyVolume, 0);
    const activeCount = INSTITUTIONS.filter((x) => x.status === 'active').length;
    const pendingKyb = KYB_APPLICATIONS.filter((x) => x.status === 'pending' || x.status === 'review').length;
    const totalCredit = CREDIT_LINES.reduce((s, x) => s + x.total, 0);
    const usedCredit = CREDIT_LINES.reduce((s, x) => s + x.used, 0);
    return { totalAum, totalVol, activeCount, pendingKyb, totalCredit, usedCredit, utilization: totalCredit > 0 ? usedCredit / totalCredit : 0 };
  }, []);

  const filtered = useMemo(() => {
    let arr = INSTITUTIONS.slice();
    if (filterType !== 'all') arr = arr.filter((x) => x.type === filterType);
    if (filterStatus !== 'all') arr = arr.filter((x) => x.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.legalName.toLowerCase().includes(q) ||
          x.region.toLowerCase().includes(q) ||
          x.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const ka = (a as any)[sortBy] ?? 0;
      const kb = (b as any)[sortBy] ?? 0;
      if (typeof ka === 'string') return ka.localeCompare(kb) * dir;
      return (ka - kb) * dir;
    });
    return arr;
  }, [filterType, filterStatus, search, sortBy, sortDir]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        const el = document.getElementById('inst-search') as HTMLInputElement | null;
        el?.focus();
      }
      if (e.key === 'Escape') {
        setDrawerInst(null);
        setDrawerKyb(null);
        setDrawerPb(null);
        setDrawerCredit(null);
        setDrawerBlock(null);
        setDrawerLiq(null);
        setDrawerReport(null);
        setDrawerHedge(null);
        setDrawerMm(null);
        setDrawerApi(null);
        setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '总览', icon: <Gauge className="w-4 h-4" /> },
    { id: 'institution', label: '机构', icon: <Building2 className="w-4 h-4" /> },
    { id: 'kyb', label: 'KYB', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'pb', label: 'PB 交易', icon: <Activity className="w-4 h-4" /> },
    { id: 'credit', label: '信用额度', icon: <BadgeDollarSign className="w-4 h-4" /> },
    { id: 'block', label: '大宗撮合', icon: <Handshake className="w-4 h-4" /> },
    { id: 'liquidity', label: '流动性分成', icon: <Droplet className="w-4 h-4" /> },
    { id: 'report', label: '报告白盒', icon: <FileText className="w-4 h-4" /> },
    { id: 'hedge', label: '风险对冲', icon: <ShieldHalf className="w-4 h-4" /> },
    { id: 'mm', label: '联合做市', icon: <CoinsIcon className="w-4 h-4" /> },
    { id: 'api', label: 'API 接入', icon: <Code className="w-4 h-4" /> },
    { id: 'help', label: '帮助', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const KpiCard = ({ label, value, change, icon, color }: { label: string; value: string; change?: number; icon: React.ReactNode; color: string }) => (
    <div className="rounded-xl p-4 border transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs" style={{ color: BRAND.textSub }}>{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.10)', color }}>
          {icon}
        </div>
      </div>
      <div className="text-lg font-bold tabular-nums" style={{ color }}>{value}</div>
      {change !== undefined && (
        <div className="text-[10px] mt-1" style={{ color: change >= 0 ? BRAND.success : BRAND.danger }}>
          {change >= 0 ? '↑' : '↓'} {formatPct(change, 1)} 7D
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-12" style={{ background: BRAND.bg, color: BRAND.text }}>
      <style>{styles}</style>

      {/* ============= HEADER ============= */}
      <section className="px-4 md:px-8 pt-6 pb-4 border-b" style={{ borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center inst-float" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
                <BriefcaseBusiness className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: BRAND.text }}>机构服务与做市商合作中心</h1>
                <p className="text-xs" style={{ color: BRAND.textSub }}>Institutional Services & Market Maker Partnership</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px]" style={{ color: BRAND.textSub }}>
              <span className="inst-pulse" style={{ color: BRAND.success }}>● LIVE</span>
              <span>tick {tick}</span>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 inst-stagger">
            <KpiCard label="在管资产" value={formatUsd(kpis.totalAum + tick * 12345)} change={0.024} icon={<Landmark className="w-4 h-4" />} color={BRAND.primary} />
            <KpiCard label="月成交量" value={formatUsd(kpis.totalVol + tick * 7890)} change={0.031} icon={<BarChart3 className="w-4 h-4" />} color={BRAND.success} />
            <KpiCard label="活跃机构" value={String(kpis.activeCount + 12)} change={0.018} icon={<Building2 className="w-4 h-4" />} color={BRAND.amber} />
            <KpiCard label="待审 KYB" value={String(kpis.pendingKyb + 3)} change={-0.05} icon={<ShieldCheck className="w-4 h-4" />} color={BRAND.info} />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: BRAND.border }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-2 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-all" style={{ color: tab === t.id ? BRAND.primary : BRAND.textSub, borderBottom: tab === t.id ? \`2px solid \${BRAND.primary}\` : '2px solid transparent', background: 'transparent', marginBottom: '-1px' }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FILTER + SEARCH ============= */}
      {(tab === 'institution' || tab === 'kyb' || tab === 'mm' || tab === 'block') && (
        <section className="px-4 md:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textSub }} />
              <input id="inst-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索机构 / KYB / 做市 / 大宗..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none" style={{ background: BRAND.bgCard, border: \`1px solid \${BRAND.border}\`, color: BRAND.text }} />
            </div>
            {tab === 'institution' && (
              <>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg" style={{ background: BRAND.bgCard, border: \`1px solid \${BRAND.border}\`, color: BRAND.text }}>
                  <option value="all">所有类型</option>
                  {Object.entries(INST_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg" style={{ background: BRAND.bgCard, border: \`1px solid \${BRAND.border}\`, color: BRAND.text }}>
                  <option value="all">所有状态</option>
                  {Object.entries(statusBadge('active')).length > 0 && null}
                  <option value="active">活跃</option>
                  <option value="onboarding">入驻中</option>
                  <option value="paused">已暂停</option>
                  <option value="review">审核中</option>
                  <option value="terminated">已终止</option>
                </select>
              </>
            )}
            <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 text-sm rounded-lg flex items-center gap-1" style={{ background: BRAND.bgCard, border: \`1px solid \${BRAND.border}\`, color: BRAND.text }}>
              {sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              {sortBy === 'aum' ? 'AUM' : sortBy === 'monthlyVolume' ? '成交量' : sortBy === 'rating' ? '评级' : '入驻时间'}
            </button>
          </div>
        </section>
      )}

      {/* ============= TAB CONTENT ============= */}
      <section className="px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && <OverviewTab onInst={setDrawerInst} onKyb={setDrawerKyb} onReport={setDrawerReport} />}
          {tab === 'institution' && <InstitutionTab institutions={filtered} onSelect={setDrawerInst} />}
          {tab === 'kyb' && <KybTab applications={KYB_APPLICATIONS} onSelect={setDrawerKyb} />}
          {tab === 'pb' && <PbTab trades={PB_TRADES} onSelect={setDrawerPb} />}
          {tab === 'credit' && <CreditTab lines={CREDIT_LINES} onSelect={setDrawerCredit} />}
          {tab === 'block' && <BlockTab trades={BLOCK_TRADES} onSelect={setDrawerBlock} />}
          {tab === 'liquidity' && <LiquidityTab shares={LIQUIDITY_SHARES} onSelect={setDrawerLiq} />}
          {tab === 'report' && <ReportTab reports={INST_REPORTS} onSelect={setDrawerReport} />}
          {tab === 'hedge' && <HedgeTab items={HEDGE_INTERFACES} onSelect={setDrawerHedge} />}
          {tab === 'mm' && <MmTab partnerships={MM_PARTNERSHIPS} onSelect={setDrawerMm} />}
          {tab === 'api' && <ApiTab credentials={API_CREDENTIALS} onSelect={setDrawerApi} />}
          {tab === 'help' && <HelpTab onOpen={() => setHelpOpen(true)} />}
        </div>
      </section>

      {/* ============= DRAWERS ============= */}
      {drawerInst && <InstitutionDrawer inst={drawerInst} onClose={() => setDrawerInst(null)} />}
      {drawerKyb && <KybDrawer app={drawerKyb} onClose={() => setDrawerKyb(null)} />}
      {drawerPb && <PbDrawer trade={drawerPb} onClose={() => setDrawerPb(null)} />}
      {drawerCredit && <CreditDrawer line={drawerCredit} onClose={() => setDrawerCredit(null)} />}
      {drawerBlock && <BlockDrawer trade={drawerBlock} onClose={() => setDrawerBlock(null)} />}
      {drawerLiq && <LiquidityDrawer share={drawerLiq} onClose={() => setDrawerLiq(null)} />}
      {drawerReport && <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />}
      {drawerHedge && <HedgeDrawer item={drawerHedge} onClose={() => setDrawerHedge(null)} />}
      {drawerMm && <MmDrawer mm={drawerMm} onClose={() => setDrawerMm(null)} />}
      {drawerApi && <ApiDrawer api={drawerApi} onClose={() => setDrawerApi(null)} />}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}


// ============================================================
// TAB 1: 总览
// ============================================================
function OverviewTab({ onInst, onKyb, onReport }: { onInst: (i: Institution) => void; onKyb: (k: KybApplication) => void; onReport: (r: InstReport) => void }) {
  return (
    <div className="space-y-6 inst-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center inst-float" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
            <BriefcaseBusiness className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND.text }}>机构服务 · 做市商合作 一体化平台</h3>
            <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>
              平台聚合 12 家头部机构（含 5 家铂金 / 4 家黄金 / 2 家白银 / 1 家青铜），月成交量 880 亿美元，信用额度总规模 48 亿美元。
              覆盖机构准入 / KYB 审核 / PB 交易 / 信用额度 / 大宗撮合 / 流动性分成 / 报告白盒 / 风险对冲 / 联合做市 / API 接入全链路。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{ l: '机构数', v: '12', c: BRAND.primary }, { l: '月成交', v: '$88B', c: BRAND.success }, { l: '信用总额', v: '$4.8B', c: BRAND.amber }, { l: 'API 调用', v: '10M/日', c: BRAND.info }].map((x, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(20,184,129,0.05)' }}>
                  <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{x.l}</div>
                  <div className="text-xl font-semibold" style={{ color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>头部机构</h3>
          <span className="text-xs" style={{ color: BRAND.textSub }}>按 AUM 排序</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSTITUTIONS.slice(0, 3).map((i) => (
            <div key={i.id} onClick={() => onInst(i)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold" style={{ background: i.iconBg, color: i.iconColor }}>{i.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{i.name}</div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>{INST_TYPE_LABEL[i.type]}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: TIER_COLOR[i.tier].bg, color: TIER_COLOR[i.tier].color }}>{TIER_COLOR[i.tier].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div style={{ color: BRAND.textSub }}>AUM</div><div className="font-medium" style={{ color: BRAND.text }}>{formatUsd(i.aum)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>月成交</div><div className="font-medium" style={{ color: BRAND.text }}>{formatUsd(i.monthlyVolume)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>评级</div><div className="font-medium" style={{ color: BRAND.text }}>⭐ {i.rating.toFixed(1)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>KYB</div><div className="font-medium" style={{ color: BRAND.success }}>L{i.kybLevel}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>最新 KYB 审核</h3>
          <span className="text-xs inst-pulse" style={{ color: BRAND.amber }}>● {KYB_APPLICATIONS.filter(k => k.status === 'review' || k.status === 'pending').length} 进行中</span>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          {KYB_APPLICATIONS.slice(0, 4).map((k, i) => (
            <div key={k.id} onClick={() => onKyb(k)} className="flex items-center gap-3 p-3 cursor-pointer" style={{ borderTop: i > 0 ? '1px solid ' + BRAND.border : 'none' }}>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: statusBadge(k.status).bg, color: statusBadge(k.status).color }}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: BRAND.text }}>{k.institution}</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>{k.id} · {REVIEW_STAGE_LABEL[k.reviewStage]} · 进度 {k.progress}%</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(k.status).bg, color: statusBadge(k.status).color }}>{statusBadge(k.status).label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4" style={{ color: BRAND.amber }} />
          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>机构服务市场洞察</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs" style={{ color: BRAND.textSub }}>
          <div>· 全球机构加密资产持仓占比 2024 年 18% 升至 2026 年 38%</div>
          <div>· 顶级做市商平均吃单率（taker ratio）从 2023 年 28% 降至 2026 年 14%</div>
          <div>· PB 交易 API 流量是 Web 端流量的 96 倍</div>
          <div>· 信用额度平均利用率 42%，3 家铂金机构超过 60%</div>
          <div>· 大宗撮合平均折扣 -0.0012（-12 bps），T+2 链上结算占比 88%</div>
          <div>· 流动性分成 tier1 返佣率 2.5 bps，机构平均收入贡献 1.2M USD / Q</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: 机构
// ============================================================
function InstitutionTab({ institutions, onSelect }: { institutions: Institution[]; onSelect: (i: Institution) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 inst-stagger">
      {institutions.map((i) => (
        <div key={i.id} onClick={() => onSelect(i)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-semibold" style={{ background: i.iconBg, color: i.iconColor }}>{i.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{i.name}</div>
              <div className="text-xs truncate" style={{ color: BRAND.textSub }}>{i.legalName}</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: TIER_COLOR[i.tier].bg, color: TIER_COLOR[i.tier].color }}>{TIER_COLOR[i.tier].label}</span>
          </div>
          <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{i.services.join(' / ')}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><div style={{ color: BRAND.textSub }}>AUM</div><div className="font-medium" style={{ color: BRAND.text }}>{formatUsd(i.aum)}</div></div>
            <div><div style={{ color: BRAND.textSub }}>月成交</div><div className="font-medium" style={{ color: BRAND.text }}>{formatUsd(i.monthlyVolume)}</div></div>
            <div><div style={{ color: BRAND.textSub }}>评级</div><div className="font-medium" style={{ color: BRAND.text }}>⭐ {i.rating.toFixed(1)}</div></div>
            <div><div style={{ color: BRAND.textSub }}>状态</div><div className="font-medium" style={{ color: statusBadge(i.status).color }}>{statusBadge(i.status).label}</div></div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {i.tags.slice(0, 3).map((t, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>#{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 3: KYB
// ============================================================
function KybTab({ applications, onSelect }: { applications: KybApplication[]; onSelect: (k: KybApplication) => void }) {
  return (
    <div className="space-y-2 inst-stagger">
      {applications.map((k) => (
        <div key={k.id} onClick={() => onSelect(k)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: statusBadge(k.status).bg, color: statusBadge(k.status).color }}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium" style={{ color: BRAND.text }}>{k.institution}</div>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(k.status).bg, color: statusBadge(k.status).color }}>{statusBadge(k.status).label}</span>
              </div>
              <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{k.id} · {k.type} · 提交 {k.submittedAt.split(' ')[0]}</div>
              <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textSub }}>
                <span>当前阶段：{REVIEW_STAGE_LABEL[k.reviewStage]}</span>
                <span>·</span>
                <span>审核员 {k.reviewer}</span>
                <span>·</span>
                <span>剩余 SLA {k.estimatedDays} 天</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
                <div className="h-full inst-bar" style={{ width: k.progress + '%', background: k.progress === 100 ? BRAND.success : BRAND.primary }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 4: PB 交易
// ============================================================
function PbTab({ trades, onSelect }: { trades: PbTrade[]; onSelect: (t: PbTrade) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>
            <th className="text-left p-3 text-xs">时间</th>
            <th className="text-left p-3 text-xs">机构</th>
            <th className="text-left p-3 text-xs">品种</th>
            <th className="text-left p-3 text-xs">方向</th>
            <th className="text-right p-3 text-xs">数量</th>
            <th className="text-right p-3 text-xs">价格</th>
            <th className="text-right p-3 text-xs">成交额</th>
            <th className="text-right p-3 text-xs">返佣</th>
            <th className="text-center p-3 text-xs">状态</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={t.id} onClick={() => onSelect(t)} className="cursor-pointer inst-stagger" style={{ borderTop: i > 0 ? '1px solid ' + BRAND.border : 'none', color: BRAND.text }}>
              <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{t.executedAt.split(' ')[1]}</td>
              <td className="p-3 text-xs">{t.institution}</td>
              <td className="p-3 text-xs font-mono">{t.symbol}</td>
              <td className="p-3 text-xs">
                <span className="px-2 py-0.5 rounded" style={{ background: t.side === 'buy' ? BRAND.successLt : BRAND.dangerLt, color: t.side === 'buy' ? BRAND.success : BRAND.danger }}>{t.side.toUpperCase()}</span>
              </td>
              <td className="p-3 text-xs text-right tabular-nums">{t.qty.toLocaleString()}</td>
              <td className="p-3 text-xs text-right tabular-nums">${'$'}{t.price.toLocaleString()}</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(t.value)}</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.amber }}>{formatUsd(t.rebate)}</td>
              <td className="p-3 text-xs text-center">
                <span className="px-2 py-0.5 rounded" style={{ background: statusBadge(t.status).bg, color: statusBadge(t.status).color }}>{statusBadge(t.status).label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 5: 信用额度
// ============================================================
function CreditTab({ lines, onSelect }: { lines: CreditLine[]; onSelect: (l: CreditLine) => void }) {
  return (
    <div className="space-y-3 inst-stagger">
      {lines.map((l) => {
        const utilization = (l.used / l.total) * 100;
        const barColor = utilization >= 80 ? BRAND.danger : utilization >= 60 ? BRAND.amber : BRAND.primary;
        return (
          <div key={l.id} onClick={() => onSelect(l)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>
                  <BadgeDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: BRAND.text }}>{l.institution}</div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>{l.id} · 到期 {l.expiresAt}</div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(l.status).bg, color: statusBadge(l.status).color }}>{statusBadge(l.status).label}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
              <div><span style={{ color: BRAND.textSub }}>总额度：</span><span style={{ color: BRAND.text }}>{formatUsd(l.total)}</span></div>
              <div><span style={{ color: BRAND.textSub }}>已用：</span><span style={{ color: barColor }}>{formatUsd(l.used)}</span></div>
              <div><span style={{ color: BRAND.textSub }}>可用：</span><span style={{ color: BRAND.success }}>{formatUsd(l.available)}</span></div>
              <div><span style={{ color: BRAND.textSub }}>利率：</span><span style={{ color: BRAND.text }}>{(l.rate * 100).toFixed(2)}%</span></div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
              <div className="h-full inst-bar" style={{ width: utilization + '%', background: barColor }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: BRAND.textMute }}>
              <span>利用率 {utilization.toFixed(1)}%</span>
              <span>抵押率 {l.collateralRatio.toFixed(1)}x</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB 6: 大宗撮合
// ============================================================
function BlockTab({ trades, onSelect }: { trades: BlockTrade[]; onSelect: (t: BlockTrade) => void }) {
  return (
    <div className="space-y-3 inst-stagger">
      {trades.map((b) => (
        <div key={b.id} onClick={() => onSelect(b)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: b.side === 'buy' ? BRAND.successLt : BRAND.dangerLt, color: b.side === 'buy' ? BRAND.success : BRAND.danger }}>{b.side.toUpperCase()}</span>
              <span className="text-sm font-medium font-mono" style={{ color: BRAND.text }}>{b.symbol}</span>
              <span className="text-xs" style={{ color: BRAND.textSub }}>{b.id}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(b.status).bg, color: statusBadge(b.status).color }}>{statusBadge(b.status).label}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div><div style={{ color: BRAND.textSub }}>买方</div><div style={{ color: BRAND.text }}>{b.buyer}</div></div>
            <div><div style={{ color: BRAND.textSub }}>卖方</div><div style={{ color: BRAND.text }}>{b.seller}</div></div>
            <div><div style={{ color: BRAND.textSub }}>数量</div><div className="tabular-nums" style={{ color: BRAND.text }}>{b.qty.toLocaleString()}</div></div>
            <div><div style={{ color: BRAND.textSub }}>价格</div><div className="tabular-nums" style={{ color: BRAND.text }}>${'$'}{b.price.toLocaleString()}</div></div>
            <div><div style={{ color: BRAND.textSub }}>成交额</div><div className="tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(b.value)}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 7: 流动性分成
// ============================================================
function LiquidityTab({ shares, onSelect }: { shares: LiquidityShare[]; onSelect: (s: LiquidityShare) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>
            <th className="text-left p-3 text-xs">机构</th>
            <th className="text-left p-3 text-xs">池</th>
            <th className="text-right p-3 text-xs">份额</th>
            <th className="text-right p-3 text-xs">返佣率</th>
            <th className="text-right p-3 text-xs">返佣金额</th>
            <th className="text-right p-3 text-xs">价差捕获</th>
            <th className="text-right p-3 text-xs">Uptime</th>
            <th className="text-right p-3 text-xs">质量</th>
            <th className="text-center p-3 text-xs">状态</th>
          </tr>
        </thead>
        <tbody>
          {shares.map((s, i) => (
            <tr key={s.id} onClick={() => onSelect(s)} className="cursor-pointer inst-stagger" style={{ borderTop: i > 0 ? '1px solid ' + BRAND.border : 'none', color: BRAND.text }}>
              <td className="p-3 text-xs">{s.institution}</td>
              <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{s.pool}</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.primary }}>{(s.volumeShare * 100).toFixed(1)}%</td>
              <td className="p-3 text-xs text-right tabular-nums">{(s.rebateRate * 10000).toFixed(1)} bps</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.amber }}>{formatUsd(s.rebateAmount)}</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.success }}>{formatUsd(s.spreadCaptured)}</td>
              <td className="p-3 text-xs text-right tabular-nums">{(s.uptime * 100).toFixed(1)}%</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: s.qualityScore >= 90 ? BRAND.success : s.qualityScore >= 70 ? BRAND.amber : BRAND.danger }}>{s.qualityScore}</td>
              <td className="p-3 text-xs text-center">
                <span className="px-2 py-0.5 rounded" style={{ background: statusBadge(s.status).bg, color: statusBadge(s.status).color }}>{statusBadge(s.status).label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 8: 报告白盒
// ============================================================
function ReportTab({ reports, onSelect }: { reports: InstReport[]; onSelect: (r: InstReport) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 inst-stagger">
      {reports.map((r) => (
        <div key={r.id} onClick={() => onSelect(r)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: r.compliance ? 'rgba(20,184,129,0.12)' : 'rgba(255,169,64,0.12)', color: r.compliance ? BRAND.primary : BRAND.amber }}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{r.title}</div>
              <div className="text-xs" style={{ color: BRAND.textSub }}>{r.id} · {r.type} · {r.format.toUpperCase()}</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(r.status).bg, color: statusBadge(r.status).color }}>{statusBadge(r.status).label}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><div style={{ color: BRAND.textSub }}>页数</div><div style={{ color: BRAND.text }}>{r.pages}</div></div>
            <div><div style={{ color: BRAND.textSub }}>数据点</div><div style={{ color: BRAND.text }}>{formatInt(r.dataPoints)}</div></div>
            <div><div style={{ color: BRAND.textSub }}>大小</div><div style={{ color: BRAND.text }}>{formatBytes(r.size)}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 9: 风险对冲
// ============================================================
function HedgeTab({ items, onSelect }: { items: HedgeInterface[]; onSelect: (h: HedgeInterface) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>
            <th className="text-left p-3 text-xs">机构</th>
            <th className="text-left p-3 text-xs">产品</th>
            <th className="text-left p-3 text-xs">类型</th>
            <th className="text-right p-3 text-xs">名义本金</th>
            <th className="text-right p-3 text-xs">Delta</th>
            <th className="text-right p-3 text-xs">对冲率</th>
            <th className="text-right p-3 text-xs">PnL</th>
            <th className="text-center p-3 text-xs">状态</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h, i) => (
            <tr key={h.id} onClick={() => onSelect(h)} className="cursor-pointer inst-stagger" style={{ borderTop: i > 0 ? '1px solid ' + BRAND.border : 'none', color: BRAND.text }}>
              <td className="p-3 text-xs">{h.institution}</td>
              <td className="p-3 text-xs font-mono">{h.product}</td>
              <td className="p-3 text-xs"><span className="px-2 py-0.5 rounded" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{h.type.toUpperCase()}</span></td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: BRAND.primary }}>{formatUsd(h.notional)}</td>
              <td className="p-3 text-xs text-right tabular-nums">{h.delta.toFixed(2)}</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: h.hedgeRatio >= 0.9 ? BRAND.success : h.hedgeRatio >= 0.75 ? BRAND.amber : BRAND.danger }}>{(h.hedgeRatio * 100).toFixed(0)}%</td>
              <td className="p-3 text-xs text-right tabular-nums" style={{ color: h.pnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(h.pnl)}</td>
              <td className="p-3 text-xs text-center">
                <span className="px-2 py-0.5 rounded" style={{ background: statusBadge(h.status).bg, color: statusBadge(h.status).color }}>{statusBadge(h.status).label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 10: 联合做市
// ============================================================
function MmTab({ partnerships, onSelect }: { partnerships: MmPartnership[]; onSelect: (m: MmPartnership) => void }) {
  return (
    <div className="space-y-3 inst-stagger">
      {partnerships.map((m) => (
        <div key={m.id} onClick={() => onSelect(m)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
                <CoinsIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: BRAND.text }}>{m.institution}</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>{m.id} · {m.pairs.length} 个交易对 · 合约 {m.contractStart} ~ {m.contractEnd}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: m.tier === 'tier1' ? 'rgba(20,184,129,0.15)' : BRAND.bgCardHover, color: m.tier === 'tier1' ? BRAND.primary : BRAND.textSub }}>{m.tier.toUpperCase()}</span>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(m.status).bg, color: statusBadge(m.status).color }}>{statusBadge(m.status).label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span style={{ color: BRAND.textSub }}>深度：</span><span style={{ color: BRAND.text }}>{formatUsd(m.depthUsd)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>24H 量：</span><span style={{ color: BRAND.text }}>{formatUsd(m.volume24h)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>Uptime：</span><span style={{ color: BRAND.success }}>{(m.uptime * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>质量：</span><span style={{ color: BRAND.text }}>{m.qualityScore} / 100</span></div>
            <div><span style={{ color: BRAND.textSub }}>返佣：</span><span style={{ color: BRAND.amber }}>{(m.rebate * 10000).toFixed(1)} bps</span></div>
            <div><span style={{ color: BRAND.textSub }}>库存：</span><span style={{ color: BRAND.text }}>{formatUsd(m.inventory)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>风险限额：</span><span style={{ color: BRAND.text }}>{formatUsd(m.riskLimit)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>分成：</span><span style={{ color: BRAND.primary }}>{(m.revenueShare * 100).toFixed(0)}%</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 11: API 接入
// ============================================================
function ApiTab({ credentials, onSelect }: { credentials: ApiCredential[]; onSelect: (a: ApiCredential) => void }) {
  return (
    <div className="space-y-3 inst-stagger">
      {credentials.map((a) => {
        const usagePct = (a.used / a.rateLimit) * 100;
        return (
          <div key={a.id} onClick={() => onSelect(a)} className="rounded-xl p-4 border cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'rgba(68,219,244,0.12)', color: BRAND.info }}>
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.name}</div>
                  <div className="text-xs font-mono" style={{ color: BRAND.textSub }}>{a.id} · {a.signature.toUpperCase()}</div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(a.status).bg, color: statusBadge(a.status).color }}>{statusBadge(a.status).label}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div><span style={{ color: BRAND.textSub }}>机构：</span><span style={{ color: BRAND.text }}>{a.institution}</span></div>
              <div><span style={{ color: BRAND.textSub }}>类型：</span><span style={{ color: BRAND.text }}>{a.type}</span></div>
              <div><span style={{ color: BRAND.textSub }}>区域：</span><span style={{ color: BRAND.text }}>{a.region}</span></div>
              <div><span style={{ color: BRAND.textSub }}>24H 调用：</span><span style={{ color: BRAND.text }}>{formatInt(a.calls24h)}</span></div>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
              <div className="h-full inst-bar" style={{ width: usagePct + '%', background: usagePct >= 80 ? BRAND.danger : usagePct >= 60 ? BRAND.amber : BRAND.primary }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1" style={{ color: BRAND.textMute }}>
              <span>限速 {a.rateLimit}/s · 当前 {a.used}/s</span>
              <span>IP 白名单 {a.ipWhitelist.length} 个</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB 12: 帮助
// ============================================================
function HelpTab({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4 inst-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-5 h-5" style={{ color: BRAND.primary }} />
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>机构服务与做市商合作 · 帮助中心</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>以下为常见问题解答、快捷键指南、合规说明与平台能力概览。</p>
        <button onClick={onOpen} className="px-4 py-2 rounded-md text-sm" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>打开完整帮助</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { q: '如何申请成为合作机构？', a: '在"机构" Tab 点击"申请入驻"，填写机构基本信息、UBO 穿透、AML 资料，提交后进入 KYB 审核流程（5-7 工作日）。' },
          { q: '信用额度如何评估？', a: '基于机构 AUM / 风险评分 / 抵押率 / 历史履约综合评估；铂金机构最高 50 亿美元；信用额度按季度复审。' },
          { q: '做市商返佣如何结算？', a: '按月结算，下月 5 日自动发放至机构账户；tier1 返佣 2.5 bps，tier2 返佣 1.8 bps，tier3 返佣 1.0 bps。' },
          { q: '大宗撮合 T+2 结算如何工作？', a: '撮合完成后，买卖双方资产分别锁定在托管账户；T+2 链上结算时同步划转；T+1 加急服务仅对铂金机构开放。' },
          { q: 'API 调用频率限制？', a: '默认 200-1000 次/秒，可按需申请扩容；PB 交易 API 延迟 SLA P99 < 50ms；行情 API P99 < 10ms。' },
          { q: '白盒报告支持哪些格式？', a: 'PDF / XLSX / HTML / CSV；支持自定义白标（机构 Logo + 色系）；周报 / 月报 / 季报 / 半年报 / 年报 / 审计报告。' },
        ].map((x, i) => (
          <div key={i} className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="text-sm font-medium mb-2" style={{ color: BRAND.text }}>{x.q}</div>
            <p className="text-xs" style={{ color: BRAND.textSub }}>{x.a}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>快捷键</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[{ k: '/', d: '聚焦搜索框' }, { k: 'Esc', d: '关闭 Drawer' }, { k: 'Tab', d: '切换主分区' }, { k: 'Enter', d: '打开选中项详情' }].map((x, i) => (
            <div key={i} className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.text, border: '1px solid ' + BRAND.border }}>{x.k}</kbd>
              <span style={{ color: BRAND.textSub }}>{x.d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>合规说明</div>
        <ul className="text-xs space-y-1" style={{ color: BRAND.textSub }}>
          <li>· 机构服务与做市商合作仅作技术能力演示，不构成投资建议</li>
          <li>· 平台所有 KYB / AML / 制裁筛查均严格遵循合规研究方向示例</li>
          <li>· 机构服务不承诺收益 / 保本 / 刚兑 / 稳赚 / 担保</li>
          <li>· 机构服务区域为合规研究方向示例，定性为研究 / 工具 / 辅助</li>
          <li>· 平台持续开展合规自查、KYB 尽调、KYC 更新、利用冲突检查</li>
        </ul>
      </div>
    </div>
  );
}
