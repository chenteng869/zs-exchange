// gen-institution-step1.js - P3.47 PortalInstitution.tsx 第一部分
// header + imports + types + mock data + tools + styles + main component + tab routing

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'portal-preview', 'PortalInstitution.tsx');

// ============================================================
// 1. HEADER
// ============================================================
const HEADER = String.raw`/**
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

`;

// ============================================================
// 2. 工具函数
// ============================================================
const TOOLS = String.raw`
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

`;

// ============================================================
// 3. MOCK DATA（占位 - 将在 step2 中填充）
// ============================================================
const MOCK_PLACEHOLDER = String.raw`
// ============================================================
// Mock Data（请在 step2 中填充）
// ============================================================

const INSTITUTIONS: Institution[] = [];
const KYB_APPLICATIONS: KybApplication[] = [];
const PB_TRADES: PbTrade[] = [];
const CREDIT_LINES: CreditLine[] = [];
const BLOCK_TRADES: BlockTrade[] = [];
const LIQUIDITY_SHARES: LiquidityShare[] = [];
const INST_REPORTS: InstReport[] = [];
const HEDGE_INTERFACES: HedgeInterface[] = [];
const MM_PARTNERSHIPS: MmPartnership[] = [];
const API_CREDENTIALS: ApiCredential[] = [];

`;

// ============================================================
// 4. STYLES + MAIN COMPONENT + TAB ROUTING
// ============================================================
const MAIN = String.raw`
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

`;

// 写入文件
const fullContent = HEADER + TOOLS + MOCK_PLACEHOLDER + MAIN;
fs.writeFileSync(filePath, fullContent, 'utf8');

const bytes = Buffer.byteLength(fullContent, 'utf8');
const lines = fullContent.split('\n').length;
console.log('OK step1 written');
console.log('  Bytes:', bytes);
console.log('  Lines:', lines);
