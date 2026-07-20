/**
 * PortalPortfolio - 资产组合与配置中心 (2026-07-20 Q05 P3.45)
 *
 * 页面定位：
 * - 中萨数字科技交易所 资产组合与配置中心
 * - 多链钱包聚合 / 资产组合 / 配置管理 / 自动再平衡 / 盈亏分析 / 税务报告 / 风险敞口 / 智能策略
 * - 与 P3.41 链上资产溯源 + P3.42 跨链互操作 + P3.43 流动性再质押 + P3.44 RWA 资产 形成
 *   "链上资产→跨链→再质押→现实资产→组合配置→再平衡→税务" 全栈资产管理能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 组合 / 资产 / 配置 / 再平衡 / 盈亏 / 税务 / 风险 / 策略 / 基准 / 报表 / 帮助
 *
 * 合规约束：
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 * - 历史业绩不预示未来表现
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search, X, Filter, Layers, Box, Boxes, Database, Server,
  Coins, CircleDollarSign, DollarSign, Banknote, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft,
  ArrowLeftRight, ArrowUpDown, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ExternalLink, Link2, Link, Unlink, Globe, Shield, ShieldCheck, ShieldAlert,
  Lock, Key, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, Activity,
  BarChart3, PieChart, LineChart, Users, User, UserCheck, Building, Building2,
  Landmark, Vault, Briefcase, FileText, FileCheck, FilePlus, FileMinus, Hash,
  Tag, Tags, Calendar, Clock, Timer, Hourglass, Sparkles, Star, Heart, Zap,
  Flame, Rocket, Compass, Map, MapPin, Eye, EyeOff, Plus, Minus, RefreshCw,
  Settings, Download, Upload, Share2, Copy, Check, MoreHorizontal, MoreVertical,
  Menu, HelpCircle, Book, BookOpen, Lightbulb, GraduationCap, Award, Target,
  Crosshair, Gauge, Package, PackageOpen, Truck, Ship, Plane, Send, Wallet,
  CreditCard, Receipt, Calculator, Scale, Umbrella, Home, Trees, Mountain,
  Gem, PiggyBank, Handshake, Gavel, Stamp, Scroll, Mail, Bell, BellRing, Webhook,
  Code, Terminal, Network, Cloud, CloudOff, Cpu, Workflow, GitBranch, GitCommit,
  GitMerge, PlayCircle, PauseCircle, StopCircle, Edit, Trash2, Save, Folder,
  FolderOpen, Archive, Inbox, ClipboardList, ClipboardCheck, ListChecks, ListFilter,
  ListTree, History, RotateCcw, RotateCw, Repeat, Shuffle, Cross, CheckCircle2,
  ArrowDownUp, Percent, Sigma, FunctionSquare, Droplet, Droplets, Wallet2, WalletCards,
  CandlestickChart, AreaChart, ChartLine, ChartBar, ChartPie, ChartScatter,
  ArrowDownNarrow, ArrowUpNarrow, ArrowUpFromLine, ArrowDownToLine, Split, Combine,
  GitFork, ListOrdered, ListPlus, ListMinus, ListX, Table, Table2, TableProperties,
  PanelTop, PanelLeft, LayoutGrid, LayoutList, LayoutTemplate, Newspaper, Notebook,
  NotebookPen, NotebookText, FileSpreadsheet, FileBarChart, FilePieChart, FileLineChart,
  Files, Bookmark, Bookmarks, Flag, FlagTriangleRight, FlagOff, Milestone, Route,
  Waypoints, CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight, Maximize2,
  Minimize2, Expand, Shrink, Move, MousePointer, MousePointerClick, Hand, HandCoins,
  HandHeart, HandHelping, HandMetal, Crown, Trophy, Medal, Sparkle, PartyPopper,
  Confetti, Cake, CakeSlice, Cookie, Candy, Apple, Cherry, Citrus, Grape, Banana,
  Pizza, Salad, Soup, Utensils, UtensilsCrossed, Coffee, Beer, Wine, Milk, Egg,
  EggFried, Sandwich, Popcorn, Shell, Bird, Cat, Dog, Fish, FishSymbol, Rabbit,
  Squirrel, Turtle, Bug, BugOff, PawPrint, Rat, Snail, Spider, Swords, Axe, Bomb,
  Skull, Ghost, Smile, Frown, Meh, Laugh, Annoyed, Angry, Kiss, ThumbsDown, ThumbsUp,
  Pointer, PointerOff, Touchpad, TouchpadOff, Keyboard, KeyboardOff, KeyRound, KeySquare,
  Unlock, Fingerprint, Scan, ScanFace, ScanLine, QrCode, Nfc, Bluetooth, BluetoothOff,
  BluetoothSearching, Wifi, WifiOff, WifiHigh, WifiLow, WifiZero, Signal, SignalHigh,
  SignalLow, SignalMedium, SignalZero, Antenna, Satellite, SatelliteDish, Cast, Cable,
  Usb, Plug, PlugZap, Power, PowerOff, Battery, BatteryCharging, BatteryFull, BatteryLow,
  BatteryMedium, BatteryWarning, Flashlight, Lamp, LampDesk, LampFloor, LampWallDown,
  LampWallUp, CeilingLight, CeilingFan, Fan, AirVent, Heater, Airplay, Projector, Tv,
  TvMinimal, Speaker, Mic, Camera, Video, Aperture, Image, ImageOff, Images, Frame,
  Crop, Palette, Brush, Eraser, Pencil, PencilRuler, Pen, PenLine, PenSquare, PenTool,
  Highlighter, Marker, Type, Pilcrow, Heading1, Heading2, Heading3, Bold, Italic,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, IndentIncrease,
  IndentDecrease, List, ListStart, ListEnd, Quote, Code2, Binary, Regex, Variable, Pi,
  PiSquare, Omega, Infinity, Euro, PoundSterling, JapaneseYen, ChineseYen, RussianRuble,
  Bitcoin, BadgeDollarSign, BadgePercent, BadgeCheck, BadgeAlert, BadgeInfo, BadgeHelp,
  BadgeX, BarChart, BarChartHorizontal, BarChart4, ChartColumn, ChartColumnStacked,
  ChartBarStacked, ChartBarBig, ChartBarDecreasing, ChartBarIncreasing, ChartBarHorizontal,
  ChartBarHorizontalBig, ChartCandlestick, ChartGantt, ChartNetwork, ChartNoAxesColumn,
  ChartNoAxesColumnDecreasing, ChartNoAxesColumnIncreasing, ChartNoAxesCombined, ChartSpline,
  ChartStepper, Histogram, Octagon, OctagonAlert, OctagonPause, OctagonX, Hexagon, Pentagon,
  Square, SquareCheck, SquareCheckBig, SquareDashed, SquareDashedBottom, SquareDot,
  SquareEqual, SquareMinus, SquarePen, SquarePlus, SquareRoundCorner, SquareSlash,
  SquareSplitHorizontal, SquareSplitVertical, SquareStack, SquareTerminal, SquareUser,
  SquareUserRound, SquareX, Circle, CircleAlert, CircleArrowDown, CircleArrowLeft,
  CircleArrowOutDownLeft, CircleArrowOutDownRight, CircleArrowOutUpLeft, CircleArrowOutUpRight,
  CircleArrowRight, CircleArrowUp, CircleCheck, CircleCheckBig, CircleChevronDown,
  CircleChevronLeft, CircleChevronRight, CircleChevronUp, CircleDashed, CircleDivide,
  CircleDot, CircleEllipsis, CircleEqual, CircleFadingArrowUp, CircleFadingPlus,
  CircleGauge, CircleHelp, CircleMinus, CirclePause, CirclePercent, CirclePlay, CirclePlus,
  CirclePower, CircleSlash, CircleStop, CircleUser, CircleUserRound, CircleX, Triangle,
  TriangleAlert, TriangleRight, Diamond, DiamondPercent, DiamondPlus, Sun, SunDim, SunMedium,
  SunMoon, SunSnow, Moon, MoonStar, CloudMoon, CloudRain, CloudRainWind, CloudSnow,
  CloudLightning, CloudHail, CloudFog, CloudSun, Cloudy, Rainbow, Tornado, Wind,
  WindArrowDown, Navigation, Navigation2, NavigationOff, MapPinOff, MapPlus, MapMinus,
  Globe2, Earth, MountainSnow, TreeDeciduous, TreePine, TreePalm, Flower, Flower2, Leaf,
  Frown as FrownIcon, LockKeyhole, LockKeyholeOpen, LockOpen, ReceiptText,
} from 'lucide-react';
import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

type Tab = 'overview' | 'portfolio' | 'assets' | 'allocation' | 'rebalance' | 'pnl' | 'tax' | 'risk' | 'strategy' | 'benchmark' | 'reports' | 'help';
type SortBy = 'name' | 'value' | 'change24h' | 'pnl' | 'sharpe' | 'risk' | 'allocation';

type AssetCategory = 'crypto' | 'defi' | 'lrt' | 'lst' | 'stable' | 'rwa' | 'nft' | 'derivative' | 'equity' | 'bond' | 'commodity';
type ChainName = 'Ethereum' | 'Arbitrum' | 'Optimism' | 'Base' | 'Polygon' | 'BSC' | 'Avalanche' | 'Solana' | 'TON' | 'zkSync' | 'Linea' | 'Scroll' | 'Mantle' | 'Bitcoin' | 'Tron' | 'Aptos' | 'Sui' | 'Starknet';

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  chain: ChainName;
  iconColor: string;
  iconBg: string;
  amount: number;
  price: number;
  value: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
  allocationPct: number;
  targetAllocation: number;
  wallet: string;
  walletType: 'cex' | 'wallet' | 'vault' | 'exchange';
  apy: number;
  dailyIncome: number;
  lastActivity: string;
  staking: boolean;
  lockupDays: number;
  riskScore: number;
  liquidity: 'high' | 'medium' | 'low';
  taxLotId: string;
  acquiredDate: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string;
  type: 'balanced' | 'aggressive' | 'conservative' | 'income' | 'speculative' | 'index';
  totalValue: number;
  costBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlYtd: number;
  pnlAll: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  alpha: number;
  assetCount: number;
  chainCount: number;
  walletCount: number;
  rebalanceFreq: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';
  lastRebalance: string;
  nextRebalance: string;
  benchmark: string;
  benchmarkPerf: number;
  perfVsBenchmark: number;
  inceptionDate: string;
  status: 'active' | 'paused' | 'closed' | 'rebalancing';
  riskProfile: string;
  targetReturn: number;
  statusColor: string;
}

interface AllocationSlice {
  category: AssetCategory;
  label: string;
  value: number;
  pct: number;
  target: number;
  deviation: number;
  color: string;
  assetCount: number;
}

interface RebalanceAction {
  id: string;
  portfolioId: string;
  trigger: 'drift' | 'schedule' | 'manual' | 'risk' | 'opportunity';
  timestamp: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
  fromAsset: string;
  fromAmount: number;
  fromValue: number;
  toAsset: string;
  toAmount: number;
  toValue: number;
  expectedImpact: number;
  fees: number;
  taxImpact: number;
  slippage: number;
  approvals: number;
  approvedBy: string;
  reason: string;
  statusColor: string;
}

interface PnlRecord {
  id: string;
  portfolioId: string;
  date: string;
  type: 'realized' | 'unrealized' | 'dividend' | 'staking' | 'airdrop' | 'fee' | 'gas' | 'reward';
  asset: string;
  amount: number;
  value: number;
  pnl: number;
  pnlPct: number;
  txHash: string;
  chain: ChainName;
  taxLot: string;
  description: string;
  holdingPeriod: 'short' | 'long';
  washSale: boolean;
}

interface TaxEvent {
  id: string;
  year: number;
  quarter: number;
  type: 'capital_gain_short' | 'capital_gain_long' | 'ordinary_income' | 'staking_income' | 'airdrop' | 'mining' | 'interest' | 'dividend' | 'royalty';
  asset: string;
  proceeds: number;
  costBasis: number;
  gain: number;
  taxDue: number;
  jurisdiction: string;
  status: 'pending' | 'reported' | 'paid' | 'amended';
  formType: '1099-B' | '1099-DIV' | '1099-INT' | '8949' | 'Schedule D' | 'W-2' | 'K-1';
  reportDate: string;
  dueDate: string;
  description: string;
  statusColor: string;
}

interface RiskMetric {
  id: string;
  portfolioId: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  description: string;
  change24h: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  history: number[];
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean_reversion' | 'dca' | 'rebalance' | 'risk_parity' | 'kelly' | 'black_litterman' | 'cppi';
  status: 'active' | 'paused' | 'draft' | 'archived';
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  backtestPeriod: string;
  backtestReturn: number;
  backtestSharpe: number;
  backtestMaxDd: number;
  liveReturn: number;
  liveSharpe: number;
  liveMaxDd: number;
  assetCount: number;
  rebalanceFreq: string;
  parameters: { key: string; value: string }[];
  constraints: string[];
  riskLimits: { key: string; value: string }[];
  statusColor: string;
  iconColor: string;
  iconBg: string;
}

interface Benchmark {
  id: string;
  name: string;
  description: string;
  type: 'index' | 'category' | 'custom';
  composition: string[];
  currentValue: number;
  return24h: number;
  return7d: number;
  return30d: number;
  returnYtd: number;
  return1y: number;
  return3y: number;
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
  inceptionDate: string;
  methodology: string;
  rebalanceFreq: string;
  constituents: number;
  marketCap: number;
  aum: number;
  publisher: string;
  trackingError: number;
  expenseRatio: number;
  color: string;
  iconBg: string;
}

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'tax' | 'risk' | 'compliance' | 'audit' | 'investor' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  format: 'pdf' | 'csv' | 'xlsx' | 'json' | 'html';
  lastGenerated: string;
  nextScheduled: string;
  recipients: number;
  size: number;
  status: 'scheduled' | 'generating' | 'ready' | 'delivered' | 'failed';
  template: string;
  pages: number;
  version: string;
  statusColor: string;
}

// ============================================================
// 常量
// ============================================================

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  crypto: '主流币', defi: 'DeFi', lrt: 'LRT', lst: 'LST', stable: '稳定币',
  rwa: 'RWA', nft: 'NFT', derivative: '衍生品', equity: '股权', bond: '债券', commodity: '商品',
};

const CATEGORY_COLORS: Record<AssetCategory, string> = {
  crypto: '#FFA940', defi: '#0ECB81', lrt: '#B370FF', lst: '#5DCFFF', stable: '#44DBF4',
  rwa: '#FFC53D', nft: '#FF7A7A', derivative: '#FF85C0', equity: '#9254DE', bond: '#73D13D', commodity: '#FFD666',
};

const RISK_COLORS = {
  low: BRAND.success, medium: '#FFA940', high: '#FF7A7A', critical: '#FF4D4F',
};

const PORTFOLIO_STATUS_BADGE: Record<Portfolio['status'], { label: string; color: string }> = {
  active: { label: '运行中', color: BRAND.success },
  paused: { label: '已暂停', color: BRAND.textMuted },
  closed: { label: '已关闭', color: BRAND.textMuted },
  rebalancing: { label: '再平衡中', color: BRAND.primary },
};

const REBALANCE_STATUS_BADGE: Record<RebalanceAction['status'], { label: string; color: string }> = {
  pending: { label: '待执行', color: BRAND.textMuted },
  approved: { label: '已批准', color: BRAND.primary },
  executing: { label: '执行中', color: '#FFA940' },
  completed: { label: '已完成', color: BRAND.success },
  failed: { label: '失败', color: BRAND.danger },
  cancelled: { label: '已取消', color: BRAND.textMuted },
};

const STRATEGY_STATUS_BADGE: Record<Strategy['status'], { label: string; color: string }> = {
  active: { label: '运行中', color: BRAND.success },
  paused: { label: '已暂停', color: BRAND.textMuted },
  draft: { label: '草稿', color: '#FFA940' },
  archived: { label: '已归档', color: BRAND.textMuted },
};

const REPORT_STATUS_BADGE: Record<Report['status'], { label: string; color: string }> = {
  scheduled: { label: '已计划', color: BRAND.textMuted },
  generating: { label: '生成中', color: '#FFA940' },
  ready: { label: '已就绪', color: BRAND.success },
  delivered: { label: '已交付', color: BRAND.primary },
  failed: { label: '失败', color: BRAND.danger },
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
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function truncateHash(hash: string, len = 8): string {
  if (!hash) return '';
  if (hash.length <= len * 2 + 3) return hash;
  return `${hash.slice(0, len)}…${hash.slice(-len)}`;
}

function riskColor(score: number): string {
  if (score < 30) return BRAND.success;
  if (score < 60) return '#FFA940';
  if (score < 80) return '#FF7A7A';
  return '#FF4D4F';
}

function allocationColor(pct: number, target: number): string {
  const dev = Math.abs(pct - target);
  if (dev < 2) return BRAND.success;
  if (dev < 5) return '#FFA940';
  return '#FF7A7A';
}

function shortAddr(addr: string, len = 6): string {
  if (!addr) return '';
  if (addr.length <= len * 2 + 3) return addr;
  return `${addr.slice(0, len)}…${addr.slice(-len)}`;
}

// ============================================================
// Mock 数据
// ============================================================

const PORTFOLIOS: Portfolio[] = [
  { id: 'pf-001', name: '核心卫星配置组合', description: '60% 主流币 + 25% DeFi + 10% LRT + 5% RWA 卫星策略', type: 'balanced', totalValue: 8420000, costBasis: 6200000, unrealizedPnl: 2220000, realizedPnl: 484000, pnl24h: 84200, pnl7d: 218400, pnl30d: 642000, pnlYtd: 1842000, pnlAll: 2704000, sharpe: 1.84, sortino: 2.42, maxDrawdown: -12.4, volatility: 18.2, beta: 0.84, alpha: 4.2, assetCount: 18, chainCount: 8, walletCount: 6, rebalanceFreq: 'weekly', lastRebalance: '2026-07-13T10:00:00Z', nextRebalance: '2026-07-20T10:00:00Z', benchmark: 'cm100', benchmarkPerf: 24.8, perfVsBenchmark: 4.2, inceptionDate: '2024-08-15', status: 'active', riskProfile: '稳健成长', targetReturn: 28, statusColor: BRAND.success },
  { id: 'pf-002', name: '高收益 DeFi 组合', description: '40% LRT + 30% DeFi 挖矿 + 20% 稳定币理财 + 10% 流动性', type: 'aggressive', totalValue: 4280000, costBasis: 3200000, unrealizedPnl: 1080000, realizedPnl: 284000, pnl24h: 18420, pnl7d: 84000, pnl30d: 184000, pnlYtd: 1080000, pnlAll: 1364000, sharpe: 1.42, sortino: 1.84, maxDrawdown: -18.4, volatility: 24.8, beta: 1.12, alpha: 6.8, assetCount: 14, chainCount: 6, walletCount: 4, rebalanceFreq: 'daily', lastRebalance: '2026-07-19T20:00:00Z', nextRebalance: '2026-07-20T20:00:00Z', benchmark: 'defi_index', benchmarkPerf: 38.4, perfVsBenchmark: 6.8, inceptionDate: '2024-06-20', status: 'rebalancing', riskProfile: '积极进取', targetReturn: 42, statusColor: BRAND.primary },
  { id: 'pf-003', name: '稳定币理财组合', description: '50% USDC 理财 + 30% USDT 收益 + 20% DAI 国债', type: 'conservative', totalValue: 6280000, costBasis: 6000000, unrealizedPnl: 280000, realizedPnl: 184000, pnl24h: 1842, pnl7d: 12840, pnl30d: 52800, pnlYtd: 218000, pnlAll: 464000, sharpe: 4.2, sortino: 6.8, maxDrawdown: -0.4, volatility: 1.2, beta: 0.04, alpha: 4.8, assetCount: 8, chainCount: 5, walletCount: 3, rebalanceFreq: 'monthly', lastRebalance: '2026-07-01T10:00:00Z', nextRebalance: '2026-08-01T10:00:00Z', benchmark: 'stable_index', benchmarkPerf: 6.4, perfVsBenchmark: 0.4, inceptionDate: '2024-01-10', status: 'active', riskProfile: '保守稳健', targetReturn: 8, statusColor: BRAND.success },
  { id: 'pf-004', name: 'RWA 现实资产组合', description: '40% 国债 RWA + 30% 不动产 RWA + 20% 碳信用 + 10% 黄金', type: 'income', totalValue: 3840000, costBasis: 3400000, unrealizedPnl: 440000, realizedPnl: 84000, pnl24h: 4284, pnl7d: 18420, pnl30d: 84000, pnlYtd: 384000, pnlAll: 524000, sharpe: 2.84, sortino: 4.2, maxDrawdown: -4.2, volatility: 8.4, beta: 0.24, alpha: 6.2, assetCount: 12, chainCount: 3, walletCount: 2, rebalanceFreq: 'quarterly', lastRebalance: '2026-04-01T10:00:00Z', nextRebalance: '2026-10-01T10:00:00Z', benchmark: 'rwa_index', benchmarkPerf: 12.4, perfVsBenchmark: 2.4, inceptionDate: '2024-09-05', status: 'active', riskProfile: '稳健收益', targetReturn: 14, statusColor: BRAND.success },
  { id: 'pf-005', name: '山寨币猎手组合', description: '30% Layer1 + 30% Layer2 + 20% Meme + 20% AI 概念', type: 'speculative', totalValue: 1840000, costBasis: 2400000, unrealizedPnl: -560000, realizedPnl: 184000, pnl24h: 84200, pnl7d: -42000, pnl30d: -184000, pnlYtd: 184000, pnlAll: -376000, sharpe: 0.42, sortino: 0.68, maxDrawdown: -42.4, volatility: 84.2, beta: 1.84, alpha: -8.4, assetCount: 24, chainCount: 6, walletCount: 4, rebalanceFreq: 'weekly', lastRebalance: '2026-07-13T10:00:00Z', nextRebalance: '2026-07-20T10:00:00Z', benchmark: 'cm100', benchmarkPerf: 24.8, perfVsBenchmark: -16.4, inceptionDate: '2025-01-20', status: 'paused', riskProfile: '高波动', targetReturn: 60, statusColor: BRAND.textMuted },
  { id: 'pf-006', name: '指数跟投组合', description: '100% 跟随 CM100 加密市场指数', type: 'index', totalValue: 2480000, costBasis: 2000000, unrealizedPnl: 480000, realizedPnl: 84000, pnl24h: 18420, pnl7d: 42000, pnl30d: 184000, pnlYtd: 484000, pnlAll: 564000, sharpe: 1.62, sortino: 2.18, maxDrawdown: -16.8, volatility: 22.4, beta: 0.98, alpha: 0.4, assetCount: 100, chainCount: 12, walletCount: 1, rebalanceFreq: 'monthly', lastRebalance: '2026-07-01T10:00:00Z', nextRebalance: '2026-08-01T10:00:00Z', benchmark: 'cm100', benchmarkPerf: 24.8, perfVsBenchmark: 0.4, inceptionDate: '2024-03-12', status: 'active', riskProfile: '市场基准', targetReturn: 24, statusColor: BRAND.success },
];

const PORTFOLIO_ASSETS: PortfolioAsset[] = [
  { id: 'pa-001', symbol: 'ETH', name: 'Ethereum', category: 'crypto', chain: 'Ethereum', iconColor: '#627EEA', iconBg: 'rgba(98,126,234,0.12)', amount: 1242, price: 3842, value: 4771764, costBasis: 2480 * 1242, unrealizedPnl: 4771764 - 2480 * 1242, unrealizedPnlPct: ((3842 - 2480) / 2480) * 100, realizedPnl: 84000, allocationPct: 56.7, targetAllocation: 60, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 4.2, dailyIncome: 549, lastActivity: '2026-07-19T18:42:00Z', staking: true, lockupDays: 0, riskScore: 42, liquidity: 'high', taxLotId: 'lot-001', acquiredDate: '2024-08-15' },
  { id: 'pa-002', symbol: 'UNI', name: 'Uniswap', category: 'defi', chain: 'Ethereum', iconColor: '#FF007A', iconBg: 'rgba(255,0,122,0.12)', amount: 18420, price: 12.4, value: 228408, costBasis: 8.2 * 18420, unrealizedPnl: 228408 - 8.2 * 18420, unrealizedPnlPct: ((12.4 - 8.2) / 8.2) * 100, realizedPnl: 18400, allocationPct: 2.7, targetAllocation: 3, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-15T10:00:00Z', staking: false, lockupDays: 0, riskScore: 64, liquidity: 'high', taxLotId: 'lot-002', acquiredDate: '2024-09-10' },
  { id: 'pa-003', symbol: 'AAVE', name: 'Aave', category: 'defi', chain: 'Ethereum', iconColor: '#B6509E', iconBg: 'rgba(182,80,158,0.12)', amount: 1842, price: 184, value: 338928, costBasis: 92 * 1842, unrealizedPnl: 338928 - 92 * 1842, unrealizedPnlPct: ((184 - 92) / 92) * 100, realizedPnl: 18420, allocationPct: 4.0, targetAllocation: 4, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-18T14:00:00Z', staking: false, lockupDays: 0, riskScore: 58, liquidity: 'high', taxLotId: 'lot-003', acquiredDate: '2024-10-05' },
  { id: 'pa-004', symbol: 'weETH', name: 'Wrapped eETH', category: 'lrt', chain: 'Ethereum', iconColor: '#5DCFFF', iconBg: 'rgba(93,207,255,0.12)', amount: 384, price: 4124, value: 1583616, costBasis: 3280 * 384, unrealizedPnl: 1583616 - 3280 * 384, unrealizedPnlPct: ((4124 - 3280) / 3280) * 100, realizedPnl: 0, allocationPct: 18.8, targetAllocation: 20, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 5.4, dailyIncome: 234, lastActivity: '2026-07-19T12:00:00Z', staking: true, lockupDays: 7, riskScore: 38, liquidity: 'high', taxLotId: 'lot-004', acquiredDate: '2025-01-15' },
  { id: 'pa-005', symbol: 'USDC', name: 'USD Coin', category: 'stable', chain: 'Ethereum', iconColor: '#2775CA', iconBg: 'rgba(39,117,202,0.12)', amount: 420000, price: 1, value: 420000, costBasis: 420000, unrealizedPnl: 0, unrealizedPnlPct: 0, realizedPnl: 8420, allocationPct: 5.0, targetAllocation: 5, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 5.8, dailyIncome: 67, lastActivity: '2026-07-19T20:00:00Z', staking: false, lockupDays: 0, riskScore: 8, liquidity: 'high', taxLotId: 'lot-005', acquiredDate: '2025-02-01' },
  { id: 'pa-006', symbol: 'USDS', name: 'Sky Dollar', category: 'stable', chain: 'Ethereum', iconColor: '#1AAB9B', iconBg: 'rgba(26,171,155,0.12)', amount: 280000, price: 1, value: 280000, costBasis: 280000, unrealizedPnl: 0, unrealizedPnlPct: 0, realizedPnl: 1840, allocationPct: 3.3, targetAllocation: 3, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 8.4, dailyIncome: 64, lastActivity: '2026-07-19T18:00:00Z', staking: false, lockupDays: 0, riskScore: 12, liquidity: 'high', taxLotId: 'lot-006', acquiredDate: '2025-03-10' },
  { id: 'pa-007', symbol: 'BUIDL', name: 'BlackRock USD', category: 'rwa', chain: 'Ethereum', iconColor: '#FFC53D', iconBg: 'rgba(255,197,61,0.12)', amount: 220000, price: 1, value: 220000, costBasis: 220000, unrealizedPnl: 0, unrealizedPnlPct: 0, realizedPnl: 0, allocationPct: 2.6, targetAllocation: 3, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 4.84, dailyIncome: 29, lastActivity: '2026-07-19T20:00:00Z', staking: false, lockupDays: 0, riskScore: 18, liquidity: 'medium', taxLotId: 'lot-007', acquiredDate: '2025-04-20' },
  { id: 'pa-008', symbol: 'ARB', name: 'Arbitrum', category: 'crypto', chain: 'Arbitrum', iconColor: '#28A0F0', iconBg: 'rgba(40,160,240,0.12)', amount: 184000, price: 1.24, value: 228160, costBasis: 0.84 * 184000, unrealizedPnl: 228160 - 0.84 * 184000, unrealizedPnlPct: ((1.24 - 0.84) / 0.84) * 100, realizedPnl: 8420, allocationPct: 2.7, targetAllocation: 2, wallet: '0x842d...B2C3', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-17T10:00:00Z', staking: true, lockupDays: 0, riskScore: 52, liquidity: 'high', taxLotId: 'lot-008', acquiredDate: '2024-11-10' },
  { id: 'pa-009', symbol: 'OP', name: 'Optimism', category: 'crypto', chain: 'Optimism', iconColor: '#FF0420', iconBg: 'rgba(255,4,32,0.12)', amount: 84000, price: 2.42, value: 203280, costBasis: 1.84 * 84000, unrealizedPnl: 203280 - 1.84 * 84000, unrealizedPnlPct: ((2.42 - 1.84) / 1.84) * 100, realizedPnl: 4200, allocationPct: 2.4, targetAllocation: 2, wallet: '0x842d...B2C3', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-16T14:00:00Z', staking: true, lockupDays: 0, riskScore: 56, liquidity: 'high', taxLotId: 'lot-009', acquiredDate: '2024-11-15' },
  { id: 'pa-010', symbol: 'cbBTC', name: 'Coinbase BTC', category: 'crypto', chain: 'Base', iconColor: '#F7931A', iconBg: 'rgba(247,147,26,0.12)', amount: 4.2, price: 124000, value: 520800, costBasis: 64000 * 4.2, unrealizedPnl: 520800 - 64000 * 4.2, unrealizedPnlPct: ((124000 - 64000) / 64000) * 100, realizedPnl: 0, allocationPct: 6.2, targetAllocation: 5, wallet: '0xC1dD...C3D4', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-19T10:00:00Z', staking: false, lockupDays: 0, riskScore: 28, liquidity: 'high', taxLotId: 'lot-010', acquiredDate: '2025-06-01' },
  { id: 'pa-011', symbol: 'SOL', name: 'Solana', category: 'crypto', chain: 'Solana', iconColor: '#14F195', iconBg: 'rgba(20,241,149,0.12)', amount: 1240, price: 184, value: 228160, costBasis: 124 * 1240, unrealizedPnl: 228160 - 124 * 1240, unrealizedPnlPct: ((184 - 124) / 124) * 100, realizedPnl: 0, allocationPct: 2.7, targetAllocation: 2, wallet: '5xYZ...Q1R2', walletType: 'wallet', apy: 7.2, dailyIncome: 45, lastActivity: '2026-07-19T16:00:00Z', staking: true, lockupDays: 0, riskScore: 64, liquidity: 'high', taxLotId: 'lot-011', acquiredDate: '2025-05-20' },
  { id: 'pa-012', symbol: 'jitoSOL', name: 'Jito Staked SOL', category: 'lst', chain: 'Solana', iconColor: '#84CCAB', iconBg: 'rgba(132,204,171,0.12)', amount: 840, price: 198, value: 166320, costBasis: 142 * 840, unrealizedPnl: 166320 - 142 * 840, unrealizedPnlPct: ((198 - 142) / 142) * 100, realizedPnl: 0, allocationPct: 2.0, targetAllocation: 2, wallet: '5xYZ...Q1R2', walletType: 'wallet', apy: 8.4, dailyIncome: 38, lastActivity: '2026-07-19T18:00:00Z', staking: true, lockupDays: 3, riskScore: 48, liquidity: 'high', taxLotId: 'lot-012', acquiredDate: '2025-07-10' },
  { id: 'pa-013', symbol: 'LDO', name: 'Lido DAO', category: 'lrt', chain: 'Ethereum', iconColor: '#F69988', iconBg: 'rgba(246,153,136,0.12)', amount: 18420, price: 1.84, value: 33902, costBasis: 2.4 * 18420, unrealizedPnl: 33902 - 2.4 * 18420, unrealizedPnlPct: ((1.84 - 2.4) / 2.4) * 100, realizedPnl: -18420, allocationPct: 0.4, targetAllocation: 1, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-10T10:00:00Z', staking: false, lockupDays: 0, riskScore: 72, liquidity: 'high', taxLotId: 'lot-013', acquiredDate: '2024-12-01' },
  { id: 'pa-014', symbol: 'MATIC', name: 'Polygon', category: 'crypto', chain: 'Polygon', iconColor: '#8247E5', iconBg: 'rgba(130,71,229,0.12)', amount: 124000, price: 0.84, value: 104160, costBasis: 1.24 * 124000, unrealizedPnl: 104160 - 1.24 * 124000, unrealizedPnlPct: ((0.84 - 1.24) / 1.24) * 100, realizedPnl: 18420, allocationPct: 1.2, targetAllocation: 1, wallet: '0xD4dD...D4E5', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-18T10:00:00Z', staking: true, lockupDays: 0, riskScore: 58, liquidity: 'high', taxLotId: 'lot-014', acquiredDate: '2024-10-15' },
  { id: 'pa-015', symbol: 'LINK', name: 'Chainlink', category: 'defi', chain: 'Ethereum', iconColor: '#2A5ADA', iconBg: 'rgba(42,90,218,0.12)', amount: 4200, price: 18.4, value: 77280, costBasis: 12.4 * 4200, unrealizedPnl: 77280 - 12.4 * 4200, unrealizedPnlPct: ((18.4 - 12.4) / 12.4) * 100, realizedPnl: 4200, allocationPct: 0.9, targetAllocation: 1, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-15T10:00:00Z', staking: false, lockupDays: 0, riskScore: 52, liquidity: 'high', taxLotId: 'lot-015', acquiredDate: '2024-10-20' },
  { id: 'pa-016', symbol: 'GMX', name: 'GMX', category: 'derivative', chain: 'Arbitrum', iconColor: '#2D2DFF', iconBg: 'rgba(45,45,255,0.12)', amount: 1842, price: 32, value: 58944, costBasis: 42 * 1842, unrealizedPnl: 58944 - 42 * 1842, unrealizedPnlPct: ((32 - 42) / 42) * 100, realizedPnl: 0, allocationPct: 0.7, targetAllocation: 1, wallet: '0x842d...B2C3', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-12T10:00:00Z', staking: false, lockupDays: 0, riskScore: 68, liquidity: 'medium', taxLotId: 'lot-016', acquiredDate: '2025-01-10' },
  { id: 'pa-017', symbol: 'PAXG', name: 'PAX Gold', category: 'commodity', chain: 'Ethereum', iconColor: '#FFD666', iconBg: 'rgba(255,214,102,0.12)', amount: 18, price: 2840, value: 51120, costBasis: 1840 * 18, unrealizedPnl: 51120 - 1840 * 18, unrealizedPnlPct: ((2840 - 1840) / 1840) * 100, realizedPnl: 0, allocationPct: 0.6, targetAllocation: 1, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-19T10:00:00Z', staking: false, lockupDays: 0, riskScore: 18, liquidity: 'medium', taxLotId: 'lot-017', acquiredDate: '2025-08-15' },
  { id: 'pa-018', symbol: 'ONDO', name: 'Ondo Finance', category: 'rwa', chain: 'Ethereum', iconColor: '#1F2937', iconBg: 'rgba(31,41,55,0.12)', amount: 18420, price: 1.24, value: 22840, costBasis: 0.84 * 18420, unrealizedPnl: 22840 - 0.84 * 18420, unrealizedPnlPct: ((1.24 - 0.84) / 0.84) * 100, realizedPnl: 1840, allocationPct: 0.3, targetAllocation: 0, wallet: '0x742d...A1B2', walletType: 'wallet', apy: 0, dailyIncome: 0, lastActivity: '2026-07-19T20:00:00Z', staking: false, lockupDays: 0, riskScore: 64, liquidity: 'medium', taxLotId: 'lot-018', acquiredDate: '2025-09-10' },
];

const ALLOCATION: AllocationSlice[] = [
  { category: 'crypto', label: '主流币', value: 5820000, pct: 69.1, target: 70, deviation: -0.9, color: CATEGORY_COLORS.crypto, assetCount: 5 },
  { category: 'defi', label: 'DeFi', value: 644616, pct: 7.7, target: 8, deviation: -0.3, color: CATEGORY_COLORS.defi, assetCount: 3 },
  { category: 'lrt', label: 'LRT', value: 1617518, pct: 19.2, target: 20, deviation: -0.8, color: CATEGORY_COLORS.lrt, assetCount: 2 },
  { category: 'stable', label: '稳定币', value: 700000, pct: 8.3, target: 8, deviation: 0.3, color: CATEGORY_COLORS.stable, assetCount: 2 },
  { category: 'rwa', label: 'RWA', value: 242840, pct: 2.9, target: 3, deviation: -0.1, color: CATEGORY_COLORS.rwa, assetCount: 2 },
  { category: 'lst', label: 'LST', value: 166320, pct: 2.0, target: 2, deviation: 0, color: CATEGORY_COLORS.lst, assetCount: 1 },
  { category: 'commodity', label: '商品', value: 51120, pct: 0.6, target: 1, deviation: -0.4, color: CATEGORY_COLORS.commodity, assetCount: 1 },
  { category: 'derivative', label: '衍生品', value: 58944, pct: 0.7, target: 1, deviation: -0.3, color: CATEGORY_COLORS.derivative, assetCount: 1 },
];

const REBALANCE_ACTIONS: RebalanceAction[] = [
  { id: 'rb-001', portfolioId: 'pf-001', trigger: 'drift', timestamp: '2026-07-19T20:00:00Z', status: 'completed', fromAsset: 'ETH', fromAmount: 24, fromValue: 92208, toAsset: 'weETH', toAmount: 22, toValue: 90728, expectedImpact: 0.4, fees: 184, taxImpact: 0, slippage: 0.04, approvals: 2, approvedBy: '系统 + 用户', reason: 'ETH 配置从 56.7% 漂移到目标 60% 之外，触发再平衡', statusColor: BRAND.success },
  { id: 'rb-002', portfolioId: 'pf-002', trigger: 'opportunity', timestamp: '2026-07-19T18:00:00Z', status: 'executing', fromAsset: 'USDC', fromAmount: 50000, fromValue: 50000, toAsset: 'USDS', toAmount: 50000, toValue: 50000, expectedImpact: 0.8, fees: 24, taxImpact: 0, slippage: 0.02, approvals: 1, approvedBy: '系统', reason: 'USDS 收益从 5.8% 上调至 8.4%，触发机会型再平衡', statusColor: '#FFA940' },
  { id: 'rb-003', portfolioId: 'pf-001', trigger: 'schedule', timestamp: '2026-07-13T10:00:00Z', status: 'completed', fromAsset: 'USDC', fromAmount: 8000, fromValue: 8000, toAsset: 'ETH', toAmount: 2.1, toValue: 8068, expectedImpact: 0.1, fees: 42, taxImpact: 0, slippage: 0.01, approvals: 1, approvedBy: '系统', reason: '周度定期再平衡，调整稳币比例', statusColor: BRAND.success },
  { id: 'rb-004', portfolioId: 'pf-004', trigger: 'risk', timestamp: '2026-07-12T14:00:00Z', status: 'completed', fromAsset: 'BUIDL', fromAmount: 10000, fromValue: 10000, toAsset: 'USDS', toAmount: 10000, toValue: 10000, expectedImpact: -0.2, fees: 12, taxImpact: 0, slippage: 0.01, approvals: 1, approvedBy: '系统', reason: 'RWA 国债利率波动，触发风险型再平衡', statusColor: BRAND.success },
  { id: 'rb-005', portfolioId: 'pf-001', trigger: 'drift', timestamp: '2026-07-19T14:00:00Z', status: 'pending', fromAsset: 'MATIC', fromAmount: 24000, fromValue: 20160, toAsset: 'ETH', toAmount: 5.2, toValue: 19978, expectedImpact: 0.2, fees: 84, taxImpact: 0, slippage: 0.04, approvals: 0, approvedBy: '-', reason: 'MATIC 配置从 1.5% 漂移到 1.2%，触发再平衡', statusColor: BRAND.textMuted },
  { id: 'rb-006', portfolioId: 'pf-002', trigger: 'manual', timestamp: '2026-07-18T16:00:00Z', status: 'approved', fromAsset: 'UNI', fromAmount: 1842, fromValue: 22840, toAsset: 'AERO', toAmount: 18420, toValue: 22840, expectedImpact: 0.6, fees: 42, taxImpact: 184, slippage: 0.05, approvals: 1, approvedBy: '用户', reason: '用户手动调整：UNI → AERO 切换', statusColor: BRAND.primary },
  { id: 'rb-007', portfolioId: 'pf-001', trigger: 'opportunity', timestamp: '2026-07-19T10:00:00Z', status: 'failed', fromAsset: 'ETH', fromAmount: 12, fromValue: 46104, toAsset: 'weETH', toAmount: 11, toValue: 45364, expectedImpact: 0.3, fees: 0, taxImpact: 0, slippage: 0, approvals: 1, approvedBy: '系统', reason: '链上 LRT 协议拥堵，Gas 超限，3 次重试后放弃', statusColor: BRAND.danger },
  { id: 'rb-008', portfolioId: 'pf-006', trigger: 'schedule', timestamp: '2026-07-01T10:00:00Z', status: 'completed', fromAsset: 'CM100', fromAmount: 248, fromValue: 24800, toAsset: 'CM100', toAmount: 252, toValue: 25200, expectedImpact: 0.2, fees: 0, taxImpact: 0, slippage: 0, approvals: 0, approvedBy: '系统', reason: '指数月度再平衡（季度调样）', statusColor: BRAND.success },
];

const PNL_RECORDS: PnlRecord[] = [
  { id: 'pnl-001', portfolioId: 'pf-001', date: '2026-07-19T18:00:00Z', type: 'unrealized', asset: 'ETH', amount: 12, value: 46104, pnl: 46104, pnlPct: 1.0, txHash: '0xabc...123', chain: 'Ethereum', taxLot: 'lot-001', description: 'ETH 价格变动 +1.0%', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-002', portfolioId: 'pf-001', date: '2026-07-19T16:00:00Z', type: 'staking', asset: 'weETH', amount: 0.024, value: 99, pnl: 99, pnlPct: 0.006, txHash: '0xdef...456', chain: 'Ethereum', taxLot: 'lot-004', description: 'weETH 质押收益（每日）', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-003', portfolioId: 'pf-001', date: '2026-07-19T12:00:00Z', type: 'realized', asset: 'UNI', amount: 1842, value: 22840, pnl: 7720, pnlPct: 51.0, txHash: '0xghi...789', chain: 'Ethereum', taxLot: 'lot-002', description: 'UNI 部分止盈 1842 枚', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-004', portfolioId: 'pf-001', date: '2026-07-18T20:00:00Z', type: 'airdrop', asset: 'ARB', amount: 184, value: 228, pnl: 228, pnlPct: 0, txHash: '0xjkl...012', chain: 'Arbitrum', taxLot: 'airdrop-001', description: 'Arbitrum 生态空投', holdingPeriod: 'short', washSale: false },
  { id: 'pnl-005', portfolioId: 'pf-001', date: '2026-07-18T14:00:00Z', type: 'fee', asset: 'ETH', amount: 0.024, value: 92, pnl: -92, pnlPct: -0.02, txHash: '0xmno...345', chain: 'Ethereum', taxLot: 'gas-001', description: 'Gas 费 0.024 ETH', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-006', portfolioId: 'pf-001', date: '2026-07-17T18:00:00Z', type: 'reward', asset: 'jitoSOL', amount: 0.018, value: 3.6, pnl: 3.6, pnlPct: 0.002, txHash: '0xpqr...678', chain: 'Solana', taxLot: 'reward-001', description: 'Jito 质押 MEV 奖励', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-007', portfolioId: 'pf-001', date: '2026-07-15T10:00:00Z', type: 'dividend', asset: 'BUIDL', amount: 184, value: 184, pnl: 184, pnlPct: 0.084, txHash: '0xstu...901', chain: 'Ethereum', taxLot: 'div-001', description: 'BUIDL 国债利息分配（月度）', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-008', portfolioId: 'pf-001', date: '2026-07-10T10:00:00Z', type: 'realized', asset: 'LDO', amount: 18420, value: 33902, pnl: -10318, pnlPct: -23.3, txHash: '0xvwx...234', chain: 'Ethereum', taxLot: 'lot-013', description: 'LDO 止损 18420 枚', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-009', portfolioId: 'pf-002', date: '2026-07-19T20:00:00Z', type: 'unrealized', asset: 'eETH', amount: 0, value: 0, pnl: 8420, pnlPct: 0.4, txHash: '-', chain: 'Ethereum', taxLot: 'lot-e001', description: 'eETH 价格 +0.4%', holdingPeriod: 'long', washSale: false },
  { id: 'pnl-010', portfolioId: 'pf-002', date: '2026-07-19T18:00:00Z', type: 'staking', asset: 'ETHx', amount: 0.012, value: 49, pnl: 49, pnlPct: 0.005, txHash: '0xeth...stk', chain: 'Ethereum', taxLot: 'stk-001', description: 'ETHx 质押收益', holdingPeriod: 'long', washSale: false },
];

const TAX_EVENTS: TaxEvent[] = [
  { id: 'tx-001', year: 2026, quarter: 3, type: 'staking_income', asset: 'weETH', proceeds: 8420, costBasis: 0, gain: 8420, taxDue: 2526, jurisdiction: 'US-WA', status: 'pending', formType: '1099-DIV', reportDate: '2026-07-31', dueDate: '2026-10-15', description: 'Q3 质押收益累计 USD', statusColor: BRAND.textMuted },
  { id: 'tx-002', year: 2026, quarter: 3, type: 'airdrop', asset: 'ARB', proceeds: 1842, costBasis: 0, gain: 1842, taxDue: 552, jurisdiction: 'US-WA', status: 'pending', formType: '1099-MISC', reportDate: '2026-07-31', dueDate: '2026-10-15', description: 'Q3 空投收益 USD', statusColor: BRAND.textMuted },
  { id: 'tx-003', year: 2026, quarter: 2, type: 'capital_gain_long', asset: 'UNI', proceeds: 22840, costBasis: 15120, gain: 7720, taxDue: 1158, jurisdiction: 'US-WA', status: 'reported', formType: '8949', reportDate: '2026-06-30', dueDate: '2026-10-15', description: 'Q2 UNI 部分止盈长期资本利得', statusColor: BRAND.primary },
  { id: 'tx-004', year: 2026, quarter: 2, type: 'capital_gain_long', asset: 'LDO', proceeds: 33902, costBasis: 44220, gain: -10318, taxDue: 0, jurisdiction: 'US-WA', status: 'reported', formType: '8949', reportDate: '2026-06-30', dueDate: '2026-10-15', description: 'Q2 LDO 止损（资本亏损可抵减）', statusColor: BRAND.primary },
  { id: 'tx-005', year: 2026, quarter: 2, type: 'interest', asset: 'BUIDL', proceeds: 2184, costBasis: 0, gain: 2184, taxDue: 655, jurisdiction: 'US-WA', status: 'reported', formType: '1099-INT', reportDate: '2026-06-30', dueDate: '2026-10-15', description: 'Q2 BUIDL 国债利息', statusColor: BRAND.primary },
  { id: 'tx-006', year: 2025, quarter: 4, type: 'capital_gain_long', asset: 'AAVE', proceeds: 184200, costBasis: 92400, gain: 91800, taxDue: 13770, jurisdiction: 'US-WA', status: 'paid', formType: '8949', reportDate: '2025-12-31', dueDate: '2026-04-15', description: '2025 Q4 AAVE 减仓', statusColor: BRAND.success },
  { id: 'tx-007', year: 2025, quarter: 3, type: 'capital_gain_short', asset: 'SOL', proceeds: 84200, costBasis: 67200, gain: 17000, taxDue: 5100, jurisdiction: 'US-WA', status: 'paid', formType: '8949', reportDate: '2025-09-30', dueDate: '2026-04-15', description: '2025 Q3 SOL 短期交易', statusColor: BRAND.success },
];

const RISK_METRICS: RiskMetric[] = [
  { id: 'rm-001', portfolioId: 'pf-001', name: 'VaR 95% (1日)', value: -2.84, unit: '%', threshold: -5, status: 'normal', description: '组合 95% 置信度 1 日损失上限', change24h: 0.04, trend: 'stable', color: BRAND.success, history: [3.2, 3.1, 2.9, 2.8, 2.84, 2.8, 2.84] },
  { id: 'rm-002', portfolioId: 'pf-001', name: '最大回撤', value: -12.4, unit: '%', threshold: -20, status: 'normal', description: '历史最大峰值到谷底跌幅', change24h: 0, trend: 'stable', color: BRAND.success, history: [10, 11, 12, 12.4, 12.4, 12.4, 12.4] },
  { id: 'rm-003', portfolioId: 'pf-001', name: '波动率（年化）', value: 18.2, unit: '%', threshold: 30, status: 'normal', description: '组合收益年化标准差', change24h: -0.4, trend: 'down', color: BRAND.success, history: [20, 19, 19, 18.5, 18.4, 18.3, 18.2] },
  { id: 'rm-004', portfolioId: 'pf-001', name: 'Beta（vs CM100）', value: 0.84, unit: '', threshold: 1.2, status: 'normal', description: '相对 CM100 指数的市场风险敞口', change24h: 0.02, trend: 'stable', color: BRAND.success, history: [0.85, 0.84, 0.84, 0.84, 0.84, 0.84, 0.84] },
  { id: 'rm-005', portfolioId: 'pf-001', name: '集中度风险', value: 56.7, unit: '%', threshold: 70, status: 'warning', description: '单一资产（ETH）持仓占比', change24h: 1.2, trend: 'up', color: '#FFA940', history: [55, 55.5, 56, 56.2, 56.5, 56.5, 56.7] },
  { id: 'rm-006', portfolioId: 'pf-001', name: '流动性风险', value: 4.2, unit: 'h', threshold: 24, status: 'normal', description: '组合 95% 变现所需时间', change24h: 0, trend: 'stable', color: BRAND.success, history: [4.2, 4.2, 4.2, 4.2, 4.2, 4.2, 4.2] },
  { id: 'rm-007', portfolioId: 'pf-001', name: '相关性风险', value: 0.62, unit: '', threshold: 0.8, status: 'normal', description: '组合内资产平均相关性', change24h: -0.01, trend: 'down', color: BRAND.success, history: [0.65, 0.64, 0.63, 0.62, 0.62, 0.62, 0.62] },
  { id: 'rm-008', portfolioId: 'pf-001', name: 'Smart Contract 风险', value: 0.04, unit: '%', threshold: 0.5, status: 'normal', description: '协议被攻击累计损失 / 组合规模', change24h: 0, trend: 'stable', color: BRAND.success, history: [0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04] },
  { id: 'rm-009', portfolioId: 'pf-002', name: 'LRT 协议风险', value: 8.4, unit: '%', threshold: 20, status: 'warning', description: 'LRT 协议 EigenLayer 风险评分', change24h: 0.2, trend: 'up', color: '#FFA940', history: [7, 7.5, 8, 8, 8.2, 8.3, 8.4] },
  { id: 'rm-010', portfolioId: 'pf-001', name: '税务风险敞口', value: 184200, unit: 'USD', threshold: 500000, status: 'normal', description: '未实现应税事件累计金额', change24h: 8420, trend: 'up', color: BRAND.success, history: [170, 172, 178, 180, 182, 183, 184.2] },
];

const STRATEGIES: Strategy[] = [
  { id: 'st-001', name: '核心卫星策略', description: '60% 核心仓位（BTC/ETH）+ 40% 卫星轮动（DeFi/LRT）', type: 'risk_parity', status: 'active', expectedReturn: 28, expectedRisk: 18, sharpeRatio: 1.84, maxDrawdown: -12.4, winRate: 64, backtestPeriod: '2021-2024 (4年)', backtestReturn: 184, backtestSharpe: 1.62, backtestMaxDd: -28.4, liveReturn: 32.4, liveSharpe: 1.84, liveMaxDd: -12.4, assetCount: 18, rebalanceFreq: '周度', parameters: [{ key: '核心权重', value: '60%' }, { key: '卫星权重', value: '40%' }, { key: '再平衡触发', value: '周度 + 漂移 > 5%' }], constraints: ['单一资产不超过 25%', '稳定币占比不低于 5%', '协议 TVL > 1B'], riskLimits: [{ key: '最大回撤', value: '-25%' }, { key: 'VaR 95%', value: '-5% (1日)' }, { key: 'Beta 上限', value: '1.2' }], statusColor: BRAND.success, iconColor: BRAND.primary, iconBg: 'rgba(20,184,129,0.12)' },
  { id: 'st-002', name: 'DeFi 收益聚合', description: 'LRT + Stablecoin 理财 + 借贷协议多策略聚合', type: 'rebalance', status: 'active', expectedReturn: 14, expectedRisk: 6, sharpeRatio: 2.4, maxDrawdown: -4.2, winRate: 84, backtestPeriod: '2022-2024 (2年)', backtestReturn: 38, backtestSharpe: 2.1, backtestMaxDd: -6.2, liveReturn: 16.8, liveSharpe: 2.4, liveMaxDd: -4.2, assetCount: 8, rebalanceFreq: '日度', parameters: [{ key: 'LRT 权重', value: '50%' }, { key: 'Stable 理财', value: '30%' }, { key: '借贷协议', value: '20%' }, { key: '收益再投资', value: '日度复利' }], constraints: ['仅 Top 10 协议', '审计覆盖率 100%', 'Bug Bounty > $1M'], riskLimits: [{ key: '智能合约风险', value: '< 0.5%' }, { key: '脱锚风险', value: '< 0.2%' }, { key: '流动性储备', value: '> 30%' }], statusColor: BRAND.success, iconColor: '#0ECB81', iconBg: 'rgba(14,203,129,0.12)' },
  { id: 'st-003', name: '动量轮动策略', description: '基于 30 日动量排名，每周轮动 Top 5 资产', type: 'momentum', status: 'active', expectedReturn: 42, expectedRisk: 28, sharpeRatio: 1.42, maxDrawdown: -22.4, winRate: 58, backtestPeriod: '2020-2024 (4年)', backtestReturn: 624, backtestSharpe: 1.28, backtestMaxDd: -34.2, liveReturn: 48.4, liveSharpe: 1.42, liveMaxDd: -22.4, assetCount: 12, rebalanceFreq: '周度', parameters: [{ key: '动量窗口', value: '30 日' }, { key: '持仓数量', value: '5' }, { key: '止损线', value: '-15%' }], constraints: ['仅交易 Top 50 资产', '单资产最大持仓 25%', '总仓位不超过 80%'], riskLimits: [{ key: '最大回撤', value: '-30%' }, { key: '最大持仓', value: '25%' }, { key: '止损线', value: '-15%' }], statusColor: BRAND.success, iconColor: '#FFA940', iconBg: 'rgba(255,169,64,0.12)' },
  { id: 'st-004', name: '均值回归策略', description: '基于 RSI + 布林带指标，超卖反弹 / 超买回调', type: 'mean_reversion', status: 'paused', expectedReturn: 22, expectedRisk: 14, sharpeRatio: 1.62, maxDrawdown: -16.8, winRate: 62, backtestPeriod: '2021-2024 (3年)', backtestReturn: 184, backtestSharpe: 1.42, backtestMaxDd: -22.4, liveReturn: 18.4, liveSharpe: 1.28, liveMaxDd: -16.8, assetCount: 8, rebalanceFreq: '日度', parameters: [{ key: 'RSI 阈值', value: '30 / 70' }, { key: '布林带窗口', value: '20 日' }, { key: '持仓周期', value: '平均 5 日' }], constraints: ['仅交易 BTC/ETH 主流币', '杠杆不超过 1x', '止损线 -8%'], riskLimits: [{ key: '最大回撤', value: '-20%' }, { key: '单笔最大亏损', value: '-8%' }], statusColor: BRAND.textMuted, iconColor: '#5DCFFF', iconBg: 'rgba(93,207,255,0.12)' },
  { id: 'st-005', name: 'DCA 定投策略', description: '每周固定金额分批建仓 BTC/ETH', type: 'dca', status: 'active', expectedReturn: 18, expectedRisk: 24, sharpeRatio: 0.84, maxDrawdown: -42.4, winRate: 78, backtestPeriod: '2018-2024 (6年)', backtestReturn: 184, backtestSharpe: 0.78, backtestMaxDd: -52.4, liveReturn: 24.8, liveSharpe: 0.84, liveMaxDd: -42.4, assetCount: 4, rebalanceFreq: '周度', parameters: [{ key: '每周投入', value: 'USD 5,000' }, { key: '标的', value: 'BTC 50% + ETH 50%' }, { key: '执行时间', value: '周一 10:00 UTC' }], constraints: ['不择时', '持续执行 4 年+', '总投入上限 USD 1M'], riskLimits: [{ key: '单期最大', value: 'USD 5,000' }, { key: '总仓位', value: '不超过 60%' }], statusColor: BRAND.success, iconColor: '#B370FF', iconBg: 'rgba(179,112,255,0.12)' },
  { id: 'st-006', name: '风险平价策略', description: '基于风险贡献度等权配置 BTC/ETH/LRT/Stable', type: 'risk_parity', status: 'draft', expectedReturn: 24, expectedRisk: 12, sharpeRatio: 2.0, maxDrawdown: -10.4, winRate: 72, backtestPeriod: '2022-2024 (2年)', backtestReturn: 84, backtestSharpe: 1.84, backtestMaxDd: -12.4, liveReturn: 0, liveSharpe: 0, liveMaxDd: 0, assetCount: 4, rebalanceFreq: '月度', parameters: [{ key: '协方差窗口', value: '90 日' }, { key: '风险预算', value: '等权' }, { key: '杠杆上限', value: '1.2x' }], constraints: ['仅主流币 + LRT', '不允许合约'], riskLimits: [{ key: '最大回撤', value: '-15%' }, { key: '波动率', value: '< 15%' }], statusColor: '#FFA940', iconColor: '#44DBF4', iconBg: 'rgba(68,219,244,0.12)' },
];

const BENCHMARKS: Benchmark[] = [
  { id: 'bm-001', name: 'CM100 加密市场指数', description: 'Top 100 加密资产加权指数，按市值权重', type: 'index', composition: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', '...'], currentValue: 1842.4, return24h: 2.4, return7d: 4.8, return30d: 12.4, returnYtd: 24.8, return1y: 124.2, return3y: 384.2, volatility: 24.2, sharpe: 1.42, maxDrawdown: -34.2, inceptionDate: '2018-01-01', methodology: 'Modified Market Cap Weight', rebalanceFreq: '月度', constituents: 100, marketCap: 3200000000000, aum: 0, publisher: 'Coin Metrics', trackingError: 0, expenseRatio: 0, color: '#FFA940', iconBg: 'rgba(255,169,64,0.12)' },
  { id: 'bm-002', name: 'DeFi Pulse 指数', description: 'Top 30 DeFi 协议代币加权指数', type: 'category', composition: ['UNI', 'AAVE', 'MKR', 'CRV', 'LDO', 'SNX', 'COMP', 'BAL', 'YFI', 'SUSHI', '...'], currentValue: 1248.4, return24h: 1.8, return7d: 6.4, return30d: 18.4, returnYtd: 38.4, return1y: 184.2, return3y: 624.2, volatility: 32.4, sharpe: 1.62, maxDrawdown: -42.4, inceptionDate: '2020-09-01', methodology: 'TVL-Weighted + Liquidity Cap', rebalanceFreq: '季度', constituents: 30, marketCap: 184000000000, aum: 0, publisher: 'DeFi Pulse', trackingError: 0, expenseRatio: 0, color: '#0ECB81', iconBg: 'rgba(14,203,129,0.12)' },
  { id: 'bm-003', name: 'LRT 流动性质押指数', description: 'Top 10 LST/LRT 协议代币加权指数', type: 'category', composition: ['weETH', 'ezETH', 'rETH', 'cbETH', 'stETH', 'jitoSOL', 'mSOL', 'bSOL', 'JOE', '...'], currentValue: 2842.4, return24h: 0.8, return7d: 2.4, return30d: 8.4, returnYtd: 18.4, return1y: 84.2, return3y: 184.2, volatility: 14.2, sharpe: 1.84, maxDrawdown: -18.4, inceptionDate: '2023-04-01', methodology: 'TVL-Weighted + Slashing Risk Adjusted', rebalanceFreq: '月度', constituents: 10, marketCap: 48000000000, aum: 0, publisher: 'LRT Watch', trackingError: 0, expenseRatio: 0, color: '#B370FF', iconBg: 'rgba(179,112,255,0.12)' },
  { id: 'bm-004', name: '稳定币理财基准', description: 'USDC/USDT/DAI 国债理财平均年化', type: 'category', composition: ['USDC T-Bill', 'USDT T-Bill', 'DAI Savings', 'sDAI', 'BUIDL'], currentValue: 6.84, return24h: 0.018, return7d: 0.13, return30d: 0.56, returnYtd: 6.84, return1y: 5.84, return3y: 4.84, volatility: 0.4, sharpe: 14.2, maxDrawdown: 0, inceptionDate: '2023-01-01', methodology: 'Equal-Weighted Avg APY', rebalanceFreq: '日度', constituents: 5, marketCap: 184000000000, aum: 0, publisher: 'RWA.xyz', trackingError: 0, expenseRatio: 0, color: '#44DBF4', iconBg: 'rgba(68,219,244,0.12)' },
  { id: 'bm-005', name: 'RWA 现实资产指数', description: 'Top 20 RWA 协议代币 + 资产支持代币加权', type: 'category', composition: ['ONDO', 'MKR', 'CFG', 'MPL', 'POL', 'GFI', 'TRU', 'CPOOL', 'BUIDL', '...'], currentValue: 1242.4, return24h: 0.4, return7d: 1.8, return30d: 4.8, returnYtd: 12.4, return1y: 42.4, return3y: 184.2, volatility: 8.4, sharpe: 1.62, maxDrawdown: -14.2, inceptionDate: '2023-09-01', methodology: 'TVL + AUM Weighted', rebalanceFreq: '季度', constituents: 20, marketCap: 28000000000, aum: 0, publisher: 'RWA.xyz', trackingError: 0, expenseRatio: 0, color: '#FFC53D', iconBg: 'rgba(255,197,61,0.12)' },
  { id: 'bm-006', name: 'BTC 价格指数', description: 'BTC 单币种价格参考', type: 'index', composition: ['BTC'], currentValue: 124000, return24h: 1.8, return7d: 4.2, return30d: 8.4, returnYtd: 84.2, return1y: 184.2, return3y: 384.2, volatility: 32.4, sharpe: 1.42, maxDrawdown: -42.4, inceptionDate: '2010-01-01', methodology: 'Spot Price Index', rebalanceFreq: '实时', constituents: 1, marketCap: 2400000000000, aum: 0, publisher: 'Coin Metrics', trackingError: 0, expenseRatio: 0, color: '#F7931A', iconBg: 'rgba(247,147,26,0.12)' },
];

const REPORTS: Report[] = [
  { id: 'rp-001', name: '组合日报', description: '每日组合表现、交易记录、收益汇总', type: 'performance', frequency: 'daily', format: 'pdf', lastGenerated: '2026-07-20T00:00:00Z', nextScheduled: '2026-07-21T00:00:00Z', recipients: 1, size: 248, status: 'ready', template: 'daily-performance-v3', pages: 12, version: 'v3.2', statusColor: BRAND.success },
  { id: 'rp-002', name: '周度策略报告', description: '策略表现归因、再平衡记录、基准对比', type: 'performance', frequency: 'weekly', format: 'pdf', lastGenerated: '2026-07-13T09:00:00Z', nextScheduled: '2026-07-20T09:00:00Z', recipients: 1, size: 1024, status: 'delivered', template: 'weekly-strategy-v2', pages: 24, version: 'v2.4', statusColor: BRAND.primary },
  { id: 'rp-003', name: '月度税务报告', description: '应税事件汇总、资本利得、税务计算', type: 'tax', frequency: 'monthly', format: 'csv', lastGenerated: '2026-06-30T20:00:00Z', nextScheduled: '2026-07-31T20:00:00Z', recipients: 1, size: 184, status: 'ready', template: 'monthly-tax-v4', pages: 8, version: 'v4.1', statusColor: BRAND.success },
  { id: 'rp-004', name: '年度税务报告（8949）', description: 'IRS Form 8949 完整年度资本利得报告', type: 'tax', frequency: 'annual', format: 'pdf', lastGenerated: '2026-01-31T20:00:00Z', nextScheduled: '2027-01-31T20:00:00Z', recipients: 3, size: 2048, status: 'ready', template: 'annual-8949-v2', pages: 48, version: 'v2.0', statusColor: BRAND.success },
  { id: 'rp-005', name: '风险敞口月报', description: 'VaR / CVaR / Stress Test / 风险归因', type: 'risk', frequency: 'monthly', format: 'pdf', lastGenerated: '2026-06-30T20:00:00Z', nextScheduled: '2026-07-31T20:00:00Z', recipients: 1, size: 1024, status: 'ready', template: 'monthly-risk-v3', pages: 32, version: 'v3.0', statusColor: BRAND.success },
  { id: 'rp-006', name: '投资人季报', description: '机构投资人组合季报，含业绩归因', type: 'investor', frequency: 'quarterly', format: 'pdf', lastGenerated: '2026-06-30T20:00:00Z', nextScheduled: '2026-09-30T20:00:00Z', recipients: 5, size: 4096, status: 'ready', template: 'quarterly-investor-v2', pages: 64, version: 'v2.1', statusColor: BRAND.success },
  { id: 'rp-007', name: '合规审计报告', description: '反洗钱 / KYC / 监管合规自评报告', type: 'compliance', frequency: 'quarterly', format: 'pdf', lastGenerated: '2026-06-30T20:00:00Z', nextScheduled: '2026-09-30T20:00:00Z', recipients: 2, size: 2048, status: 'ready', template: 'compliance-audit-v1', pages: 48, version: 'v1.4', statusColor: BRAND.success },
  { id: 'rp-008', name: '链上交易明细', description: '所有链上交易原始数据导出', type: 'custom', frequency: 'on_demand', format: 'csv', lastGenerated: '2026-07-19T20:00:00Z', nextScheduled: '-', recipients: 1, size: 4096, status: 'ready', template: 'tx-export-v1', pages: 0, version: 'v1.0', statusColor: BRAND.success },
];

// ============================================================
// 组件实现
// ============================================================

export default function PortalPortfolio() {
  // === Tab 与搜索 ===
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterChain, setFilterChain] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('value');
  const [drawer, setDrawer] = useState<{ open: boolean; type: string | null; payload: any }>({ open: false, type: null, payload: null });

  // === KPI 实时数据 ===
  const [kpi, setKpi] = useState({
    totalAum: 27140000,
    totalPortfolios: 6,
    totalAssets: 18,
    totalWallets: 6,
    totalChains: 8,
    totalUnrealizedPnl: 3944000,
    totalRealizedPnl: 1238000,
    pnl24h: 152366,
    pnlYtd: 4192000,
    averageSharpe: 2.0,
    averageDrawdown: -17.4,
    rebalanceCount30d: 184,
    rebalanceSuccessRate: 96.4,
    pendingRebalances: 2,
    taxEventsYtd: 18,
    taxDueYtd: 24260,
    auditCoverage: 100,
  });

  // === 实时数据波动 ===
  useEffect(() => {
    const timer = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalAum: prev.totalAum + Math.floor(Math.random() * 20000) - 10000,
        totalUnrealizedPnl: prev.totalUnrealizedPnl + Math.floor(Math.random() * 12000) - 6000,
        totalRealizedPnl: prev.totalRealizedPnl + Math.floor(Math.random() * 200),
        pnl24h: prev.pnl24h + Math.floor(Math.random() * 2000) - 1000,
        averageSharpe: Math.max(1, Math.min(3, prev.averageSharpe + (Math.random() - 0.5) * 0.04)),
        averageDrawdown: Math.max(-30, Math.min(-5, prev.averageDrawdown + (Math.random() - 0.5) * 0.2)),
        rebalanceCount30d: prev.rebalanceCount30d + (Math.random() > 0.7 ? 1 : 0),
        pendingRebalances: Math.max(0, Math.min(10, prev.pendingRebalances + (Math.random() > 0.8 ? 1 : Math.random() > 0.5 ? -1 : 0))),
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // === 键盘快捷键 ===
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('portfolio-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setDrawer({ open: false, type: null, payload: null });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // === 过滤 & 排序 ===
  const filteredAssets = useMemo(() => {
    let list = [...PORTFOLIO_ASSETS];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.symbol.toLowerCase().includes(s) || a.name.toLowerCase().includes(s) || a.chain.toLowerCase().includes(s));
    }
    if (filterCategory !== 'all') list = list.filter((a) => a.category === filterCategory);
    if (filterChain !== 'all') list = list.filter((a) => a.chain === filterChain);
    switch (sortBy) {
      case 'value': list.sort((a, b) => b.value - a.value); break;
      case 'change24h': list.sort((a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct); break;
      case 'pnl': list.sort((a, b) => b.unrealizedPnl - a.unrealizedPnl); break;
      case 'allocation': list.sort((a, b) => b.allocationPct - a.allocationPct); break;
      case 'risk': list.sort((a, b) => b.riskScore - a.riskScore); break;
      default: break;
    }
    return list;
  }, [search, filterCategory, filterChain, sortBy]);

  // === 抽屉控制 ===
  const openDrawer = useCallback((type: string, payload: any) => {
    setDrawer({ open: true, type, payload });
  }, []);
  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  return (
    <div className="min-h-screen pa-page" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pa-stagger-1 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-stagger-2 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-stagger-3 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-stagger-4 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-stagger-5 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pa-stagger-6 { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pa-stagger-1 { animation: pa-stagger-1 0.4s ease-out both; }
        .pa-stagger-2 { animation: pa-stagger-2 0.4s ease-out 0.05s both; }
        .pa-stagger-3 { animation: pa-stagger-3 0.4s ease-out 0.1s both; }
        .pa-stagger-4 { animation: pa-stagger-4 0.4s ease-out 0.15s both; }
        .pa-stagger-5 { animation: pa-stagger-5 0.4s ease-out 0.2s both; }
        .pa-stagger-6 { animation: pa-stagger-6 0.4s ease-out 0.25s both; }
        @keyframes pa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .pa-pulse { animation: pa-pulse 2s ease-in-out infinite; }
        @keyframes pa-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
        .pa-shimmer { background: linear-gradient(90deg, transparent 0%, ${BRAND.primary}10 50%, transparent 100%); background-size: 400px 100%; animation: pa-shimmer 3s linear infinite; }
        @keyframes pa-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .pa-slide-in { animation: pa-slide-in 0.3s ease-out; }
        @keyframes pa-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .pa-bar { animation: pa-bar 0.6s ease-out; transform-origin: left; }
        @keyframes pa-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .pa-float { animation: pa-float 3s ease-in-out infinite; }
      `}</style>

      {/* === Hero === */}
      <section className="px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 pa-stagger-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,184,129,0.12)' }}>
                <Wallet size={24} style={{ color: BRAND.primary }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: BRAND.text }}>资产组合与配置中心</h1>
                <p className="text-sm" style={{ color: BRAND.textMuted }}>Portfolio & Allocation Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>技术研究 + 合规研究方向</span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>6 个组合</span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>8 条公链</span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>18 个资产</span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(176,176,176,0.10)', color: BRAND.textMuted }}>实时组合 / 实时再平衡 / 实时盈亏</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-3xl pa-stagger-2" style={{ color: BRAND.textSub }}>
            整合多链钱包（Ethereum / Arbitrum / Optimism / Base / Polygon / BSC / Solana / TON / Bitcoin 等），
            提供 <strong style={{ color: BRAND.text }}>{PORTFOLIOS.length}</strong> 个组合、<strong style={{ color: BRAND.text }}>{PORTFOLIO_ASSETS.length}</strong> 个资产、
            <strong style={{ color: BRAND.text }}>{STRATEGIES.length}</strong> 个策略、<strong style={{ color: BRAND.text }}>{BENCHMARKS.length}</strong> 个基准、<strong style={{ color: BRAND.text }}>{REPORTS.length}</strong> 个报表。
            支持多链资产聚合 / 配置管理 / 自动再平衡 / 盈亏归因 / 税务报告 / 风险敞口 / 智能策略 / 业绩归因 全栈资产管理能力。
          </p>
        </div>
      </section>

      {/* === KPI Cards === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard label="总 AUM" value={formatUsd(kpi.totalAum)} icon={<Wallet size={14} />} idx={1} />
          <KpiCard label="总组合" value={`${kpi.totalPortfolios}`} icon={<Briefcase size={14} />} idx={2} />
          <KpiCard label="总资产" value={`${kpi.totalAssets}`} icon={<Coins size={14} />} idx={3} />
          <KpiCard label="公链" value={`${kpi.totalChains}`} icon={<Network size={14} />} idx={4} />
          <KpiCard label="未实现盈亏" value={formatUsd(kpi.totalUnrealizedPnl)} icon={<TrendingUp size={14} />} idx={5} positive={kpi.totalUnrealizedPnl > 0} />
          <KpiCard label="YTD 收益" value={formatUsd(kpi.pnlYtd)} icon={<Award size={14} />} idx={6} positive />
          <KpiCard label="平均 Sharpe" value={kpi.averageSharpe.toFixed(2)} icon={<Gauge size={14} />} idx={7} />
          <KpiCard label="30D 再平衡" value={`${kpi.rebalanceCount30d}`} icon={<RefreshCw size={14} />} idx={8} />
        </div>
      </section>

      {/* === Real-time Strip === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto pa-stagger-3 p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: BRAND.primary }}>
              <span className="w-1.5 h-1.5 rounded-full pa-pulse" style={{ backgroundColor: BRAND.primary }}></span>
              LIVE
            </span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>总 AUM: <strong style={{ color: BRAND.text }}>{formatUsd(kpi.totalAum)}</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>24h PnL: <strong style={{ color: kpi.pnl24h >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(kpi.pnl24h)}</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>Sharpe: <strong style={{ color: BRAND.text }}>{kpi.averageSharpe.toFixed(2)}</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>最大回撤: <strong style={{ color: BRAND.text }}>{kpi.averageDrawdown.toFixed(1)}%</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>再平衡成功率: <strong style={{ color: BRAND.success }}>{kpi.rebalanceSuccessRate}%</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>待执行: <strong style={{ color: BRAND.text }}>{kpi.pendingRebalances}</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>YTD 税务: <strong style={{ color: BRAND.text }}>{formatUsd(kpi.taxDueYtd)}</strong></span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>·</span>
            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>审计覆盖: <strong style={{ color: BRAND.success }}>{kpi.auditCoverage}%</strong></span>
          </div>
        </div>
      </section>

      {/* === Search & Filter === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 pa-stagger-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input id="portfolio-search-input" type="text" placeholder="搜索资产 / 组合 / 策略 / 基准 / 报表 ... 按 / 键聚焦" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
            <option value="value">按持仓价值</option>
            <option value="change24h">按 24h 涨跌</option>
            <option value="pnl">按盈亏金额</option>
            <option value="allocation">按配置比例</option>
            <option value="risk">按风险评分</option>
          </select>
        </div>
      </section>

      {/* === Tab Bar === */}
      <section className="px-6 pb-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto pa-stagger-5">
          {([
            { k: 'overview', l: '总览', i: <LayoutGrid size={14} /> },
            { k: 'portfolio', l: '组合', i: <Briefcase size={14} /> },
            { k: 'assets', l: '资产', i: <Coins size={14} /> },
            { k: 'allocation', l: '配置', i: <PieChart size={14} /> },
            { k: 'rebalance', l: '再平衡', i: <RefreshCw size={14} /> },
            { k: 'pnl', l: '盈亏', i: <TrendingUp size={14} /> },
            { k: 'tax', l: '税务', i: <Receipt size={14} /> },
            { k: 'risk', l: '风险', i: <Shield size={14} /> },
            { k: 'strategy', l: '策略', i: <Target size={14} /> },
            { k: 'benchmark', l: '基准', i: <BarChart3 size={14} /> },
            { k: 'reports', l: '报表', i: <FileText size={14} /> },
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
          {tab === 'overview' && renderOverview()}
          {tab === 'portfolio' && renderPortfolio()}
          {tab === 'assets' && renderAssets()}
          {tab === 'allocation' && renderAllocation()}
          {tab === 'rebalance' && renderRebalance()}
          {tab === 'pnl' && renderPnl()}
          {tab === 'tax' && renderTax()}
          {tab === 'risk' && renderRisk()}
          {tab === 'strategy' && renderStrategy()}
          {tab === 'benchmark' && renderBenchmark()}
          {tab === 'reports' && renderReports()}
          {tab === 'help' && renderHelp()}
        </div>
      </section>

      {/* === Drawer === */}
      {drawer.open && drawer.type && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}></div>
          <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto pa-slide-in" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            {drawer.type === 'portfolio' && <PortfolioDrawer p={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'asset' && <AssetDrawer a={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'rebalance' && <RebalanceDrawer r={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'pnl' && <PnlDrawer p={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'tax' && <TaxDrawer t={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'risk' && <RiskDrawer r={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'strategy' && <StrategyDrawer s={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'benchmark' && <BenchmarkDrawer b={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'report' && <ReportDrawer r={drawer.payload} onClose={closeDrawer} />}
            {drawer.type === 'help' && <HelpDrawer h={drawer.payload} onClose={closeDrawer} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 1. 总览 Tab
// ============================================================
function renderOverview() {
  const total = PORTFOLIOS.length;
  const totalAum = kpi.totalAum;
  const totalPnl = kpi.totalUnrealizedPnl + kpi.totalRealizedPnl;
  const avgSharpe = kpi.averageSharpe;
  const winner = [...PORTFOLIOS].sort((a, b) => b.pnlYtd - a.pnlYtd)[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: '总资产价值', v: formatUsd(totalAum), s: '组合贡献' + PORTFOLIO_ASSETS.length + ' 资产', c: BRAND.primary },
          { l: '总浮动盈亏', v: formatUsd(totalPnl), s: '未实现 ' + formatUsd(kpi.totalUnrealizedPnl) + ' + 已实现 ' + formatUsd(kpi.totalRealizedPnl), c: BRAND.success },
          { l: '平均 Sharpe', v: avgSharpe.toFixed(2), s: '风险调整后收益', c: BRAND.primary },
          { l: '冠军组合', v: winner.name, s: 'YTD 收益 ' + formatUsd(winner.pnlYtd), c: BRAND.success },
        ].map((c, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-2" style={{ color: BRAND.textMuted }}>{c.l}</div>
            <div className="text-xl font-bold mb-1 tabular-nums" style={{ color: c.c }}>{c.v}</div>
            <div className="text-[10px]" style={{ color: BRAND.textSub }}>{c.s}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>组合表现 TOP 6</h3>
          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>YTD 排序</span>
        </div>
        <div className="space-y-2">
          {[...PORTFOLIOS].sort((a, b) => b.pnlYtd - a.pnlYtd).map((p, i) => (
            <div key={p.id} onClick={() => openDrawer('portfolio', p)} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:scale-[1.01] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <span className="text-xs font-bold w-6" style={{ color: i === 0 ? BRAND.success : i === total - 1 ? BRAND.danger : BRAND.textMuted }}>#{i + 1}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{p.name}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.type} / {p.chainCount} 链 / 资产 {p.assetCount} / Sharpe {p.sharpe.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold tabular-nums" style={{ color: p.pnlYtd >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(p.pnlYtd)}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>YTD</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold tabular-nums" style={{ color: p.perfVsBenchmark >= 0 ? BRAND.success : BRAND.danger }}>{(p.perfVsBenchmark * 100).toFixed(2)}%</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>vs {p.benchmark}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>资产类别分布</h3>
          <div className="space-y-2">
            {ALLOCATION_SLICES.filter(s => s.type === 'category').map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: BRAND.text }}>{s.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{s.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                  <div className="h-full pa-bar" style={{ width: s.percentage + '%', backgroundColor: s.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>多链资产分布</h3>
          <div className="space-y-2">
            {ALLOCATION_SLICES.filter(s => s.type === 'chain').map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: BRAND.text }}>{s.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{s.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                  <div className="h-full pa-bar" style={{ width: s.percentage + '%', backgroundColor: BRAND.primary }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. 组合 Tab
// ============================================================
function renderPortfolio() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>所有组合 ({PORTFOLIOS.length})</h3>
        <span className="text-[10px]" style={{ color: BRAND.textMuted }}>点击组合查看详情</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTFOLIOS.map((p) => (
          <div key={p.id} onClick={() => openDrawer('portfolio', p)} className="p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.name}</div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: p.statusColor + '20', color: p.statusColor }}>{p.status}</span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: BRAND.textMuted }}>{p.description}</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>总价值</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>{formatUsd(p.totalValue)}</div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>成本</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.textSub }}>{formatUsd(p.costBasis)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>未实现盈亏</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: p.unrealizedPnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(p.unrealizedPnl)}</div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>YTD</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: p.pnlYtd >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(p.pnlYtd)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMuted }}>
              <span>链 {p.chainCount} / 资产 {p.assetCount}</span>
              <span>Sharpe {p.sharpe.toFixed(2)}</span>
            </div>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
              <div className="h-full pa-bar" style={{ width: (p.unrealizedPnl / p.costBasis * 100) + '%', backgroundColor: p.unrealizedPnl >= 0 ? BRAND.success : BRAND.danger }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. 资产 Tab
// ============================================================
function renderAssets() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 pa-stagger-1">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCategory(filterCategory === c ? 'all' : c)} className="px-3 py-1 rounded text-xs" style={{ backgroundColor: filterCategory === c ? BRAND.primaryLt : BRAND.card, color: filterCategory === c ? BRAND.primary : BRAND.textSub, border: `1px solid ${filterCategory === c ? BRAND.primary : BRAND.border}` }}>{c === 'all' ? '全部' : c}</button>
        ))}
        <span className="text-[10px] ml-2" style={{ color: BRAND.textMuted }}>· 链筛选</span>
        {CHAINS.map((c) => (
          <button key={c} onClick={() => setFilterChain(filterChain === c ? 'all' : c)} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: filterChain === c ? BRAND.primaryLt : BRAND.card, color: filterChain === c ? BRAND.primary : BRAND.textSub, border: `1px solid ${filterChain === c ? BRAND.primary : BRAND.border}` }}>{c === 'all' ? '全链' : c}</button>
        ))}
      </div>
      <div className="p-3 rounded-xl overflow-x-auto" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px]" style={{ color: BRAND.textMuted, borderBottom: `1px solid ${BRAND.border}` }}>
              <th className="text-left p-2">资产</th>
              <th className="text-left p-2">类别</th>
              <th className="text-left p-2">链</th>
              <th className="text-right p-2">数量</th>
              <th className="text-right p-2">价格</th>
              <th className="text-right p-2">价值</th>
              <th className="text-right p-2">配置</th>
              <th className="text-right p-2">未实现盈亏</th>
              <th className="text-right p-2">24h</th>
              <th className="text-right p-2">风险</th>
              <th className="text-center p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((a) => (
              <tr key={a.id} className="hover:bg-white/5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: a.iconBg, color: a.iconColor }}>{a.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{a.symbol}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2 text-[10px]" style={{ color: BRAND.textSub }}>{a.category}</td>
                <td className="p-2 text-[10px]" style={{ color: BRAND.textSub }}>{a.chain}</td>
                <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{a.amount.toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{a.price.toFixed(4)}</td>
                <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatUsd(a.value)}</td>
                <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{a.allocationPct.toFixed(1)}%</td>
                <td className="p-2 text-right tabular-nums" style={{ color: a.unrealizedPnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(a.unrealizedPnl)}</td>
                <td className="p-2 text-right tabular-nums" style={{ color: a.change24h >= 0 ? BRAND.success : BRAND.danger }}>{(a.change24h * 100).toFixed(2)}%</td>
                <td className="p-2 text-right">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: a.riskScore >= 7 ? 'rgba(239,68,68,0.12)' : a.riskScore >= 4 ? 'rgba(234,179,8,0.12)' : 'rgba(20,184,129,0.12)', color: a.riskScore >= 7 ? BRAND.danger : a.riskScore >= 4 ? BRAND.warning : BRAND.success }}>{a.riskScore}</span>
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => openDrawer('asset', a)} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>共 {filteredAssets.length} 项资产</div>
    </div>
  );
}

// ============================================================
// 4. 配置 Tab
// ============================================================
function renderAllocation() {
  const cat = ALLOCATION_SLICES.filter(s => s.type === 'category');
  const chain = ALLOCATION_SLICES.filter(s => s.type === 'chain');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>资产类别配置</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              {cat.map((s, i) => {
                const cum = cat.slice(0, i).reduce((a, c) => a + c.percentage, 0);
                return (
                  <div key={s.id} className="absolute inset-0" style={{ background: `conic-gradient(${s.color} ${cum}% ${cum + s.percentage}%, ${BRAND.border} ${cum + s.percentage}% 100%)`, borderRadius: '50%', mask: 'radial-gradient(circle, transparent 30%, black 31%)' }}></div>
                );
              })}
            </div>
            <div className="flex-1 space-y-1">
              {cat.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <span style={{ color: BRAND.text }}>{s.label}</span>
                  </div>
                  <span className="tabular-nums" style={{ color: BRAND.textSub }}>{s.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>多链配置</h3>
          <div className="space-y-2">
            {chain.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: BRAND.text }}>{s.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: BRAND.primary }}>{s.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                  <div className="h-full pa-bar" style={{ width: s.percentage + '%', backgroundColor: s.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>目标配置 vs 当前配置</h3>
        <div className="space-y-3">
          {cat.map((s) => {
            const drift = s.percentage - (s.target || s.percentage);
            return (
              <div key={s.id} className="p-2 rounded" style={{ backgroundColor: BRAND.cardHover }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{s.label}</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span style={{ color: BRAND.textMuted }}>目标: {s.target?.toFixed(1)}%</span>
                    <span style={{ color: BRAND.text }}>当前: {s.percentage.toFixed(1)}%</span>
                    <span style={{ color: Math.abs(drift) > 2 ? BRAND.warning : BRAND.success }}>偏移: {drift >= 0 ? '+' : ''}{drift.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                  <div className="absolute h-full" style={{ left: '0', width: s.target + '%', backgroundColor: BRAND.textMuted, opacity: 0.4 }}></div>
                  <div className="absolute h-full pa-bar" style={{ left: '0', width: s.percentage + '%', backgroundColor: s.color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 5. 再平衡 Tab
// ============================================================
function renderRebalance() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: '30D 再平衡队列', v: kpi.rebalanceCount30d, c: BRAND.primary },
          { l: '成功率', v: kpi.rebalanceSuccessRate + '%', c: BRAND.success },
          { l: '待执行', v: kpi.pendingRebalances, c: BRAND.warning },
          { l: '健康度', v: '98.7%', c: BRAND.success },
        ].map((c, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>再平衡操作记录 ({REBALANCE_ACTIONS.length})</h3>
        <div className="space-y-2">
          {REBALANCE_ACTIONS.map((r) => (
            <div key={r.id} onClick={() => openDrawer('rebalance', r)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{r.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: r.statusColor + '20', color: r.statusColor }}>{r.status}</span>
                  <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.type}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.timestamp}</div>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textSub }}>
                <span>{r.portfolio}</span>
                <span>·</span>
                <span>{r.trigger}</span>
                <span>·</span>
                <span>用户 {r.user}</span>
                <span>·</span>
                <span style={{ color: r.slippagePct < 0.1 ? BRAND.success : BRAND.warning }}>滑点 {r.slippagePct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 6. 盈亏 Tab
// ============================================================
function renderPnl() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: '未实现盈亏', v: formatUsd(kpi.totalUnrealizedPnl), c: BRAND.success },
          { l: '已实现盈亏', v: formatUsd(kpi.totalRealizedPnl), c: BRAND.success },
          { l: '24h PnL', v: formatUsd(kpi.pnl24h), c: kpi.pnl24h >= 0 ? BRAND.success : BRAND.danger },
          { l: 'YTD', v: formatUsd(kpi.pnlYtd), c: BRAND.success },
        ].map((c, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>盈亏时间线 ({PNL_RECORDS.length})</h3>
        <div className="space-y-2">
          {PNL_RECORDS.map((p) => (
            <div key={p.id} onClick={() => openDrawer('pnl', p)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{p.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: p.statusColor + '20', color: p.statusColor }}>{p.status}</span>
                  <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.period}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.timestamp}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span style={{ color: BRAND.textMuted }}>收益:</span> <span style={{ color: BRAND.success }}>{formatUsd(p.pnl)}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>费用:</span> <span style={{ color: BRAND.text }}>{formatUsd(p.fees)}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>成本:</span> <span style={{ color: BRAND.text }}>{formatUsd(p.costBasis)}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>贡献:</span> <span style={{ color: BRAND.text }}>{p.contributors} 资产</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 7. 税务 Tab
// ============================================================
function renderTax() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'YTD 税务事件', v: kpi.taxEventsYtd, c: BRAND.primary },
          { l: 'YTD 应税', v: formatUsd(kpi.taxDueYtd), c: BRAND.warning },
          { l: '已支付税', v: formatUsd(18640), c: BRAND.success },
          { l: '待支付税', v: formatUsd(5620), c: BRAND.warning },
        ].map((c, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>税务事件记录 ({TAX_EVENTS.length})</h3>
        <div className="space-y-2">
          {TAX_EVENTS.map((t) => (
            <div key={t.id} onClick={() => openDrawer('tax', t)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{t.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: t.statusColor + '20', color: t.statusColor }}>{t.status}</span>
                  <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{t.type}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{t.timestamp}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span style={{ color: BRAND.textMuted }}>资产:</span> <span style={{ color: BRAND.text }}>{t.asset}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>税前:</span> <span style={{ color: t.gainPreTax >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(t.gainPreTax)}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>应税:</span> <span style={{ color: BRAND.text }}>{formatUsd(t.taxDue)}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>管辖区:</span> <span style={{ color: BRAND.text }}>{t.jurisdiction}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 8. 风险 Tab
// ============================================================
function renderRisk() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: '平均 VaR 95%', v: '-4.2%', c: BRAND.warning },
          { l: '平均 CVaR 99%', v: '-7.8%', c: BRAND.danger },
          { l: '平均最大回撤', v: kpi.averageDrawdown.toFixed(1) + '%', c: BRAND.danger },
          { l: '平均波动率', v: '24.6%', c: BRAND.warning },
        ].map((c, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
            <div className="text-lg font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>风险指标 ({RISK_METRICS.length})</h3>
        <div className="space-y-2">
          {RISK_METRICS.map((r) => (
            <div key={r.id} onClick={() => openDrawer('risk', r)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: r.statusColor + '20', color: r.statusColor }}>{r.status}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.category} / {r.timestamp}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span style={{ color: BRAND.textMuted }}>当前:</span> <span style={{ color: BRAND.text }}>{r.value}{r.unit}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>阈值:</span> <span style={{ color: BRAND.warning }}>{r.threshold}{r.unit}</span></div>
                <div><span style={{ color: BRAND.textMuted }}>超出:</span> <span style={{ color: r.breached ? BRAND.danger : BRAND.success }}>{r.breached ? '是' : '否'} {r.breachPct.toFixed(1)}%</span></div>
                <div><span style={{ color: BRAND.textMuted }}>所属:</span> <span style={{ color: BRAND.text }}>{r.portfolio}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 9. 策略 Tab
// ============================================================
function renderStrategy() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>策略库存 ({STRATEGIES.length})</h3>
        <span className="text-[10px]" style={{ color: BRAND.textMuted }}>点击策略查看详情</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STRATEGIES.map((s) => (
          <div key={s.id} onClick={() => openDrawer('strategy', s)} className="p-4 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.statusColor + '20', color: s.statusColor }}>{s.status}</span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: BRAND.textMuted }}>{s.description}</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>YTD 收益</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: s.ytdReturn >= 0 ? BRAND.success : BRAND.danger }}>{(s.ytdReturn * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>Sharpe</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.text }}>{s.sharpe.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>最大回撤</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: BRAND.danger }}>{(s.maxDrawdown * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {s.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 10. 基准 Tab
// ============================================================
function renderBenchmark() {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>基准对比 ({BENCHMARKS.length})</h3>
        <div className="space-y-2">
          {BENCHMARKS.map((b) => (
            <div key={b.id} onClick={() => openDrawer('benchmark', b)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{b.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: b.statusColor + '20', color: b.statusColor }}>{b.type}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>链 {b.chains} / 资产 {b.assets}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div><span style={{ color: BRAND.textMuted }}>1M:</span> <span style={{ color: b.perf1m >= 0 ? BRAND.success : BRAND.danger }}>{(b.perf1m * 100).toFixed(2)}%</span></div>
                <div><span style={{ color: BRAND.textMuted }}>3M:</span> <span style={{ color: b.perf3m >= 0 ? BRAND.success : BRAND.danger }}>{(b.perf3m * 100).toFixed(2)}%</span></div>
                <div><span style={{ color: BRAND.textMuted }}>YTD:</span> <span style={{ color: b.perfYtd >= 0 ? BRAND.success : BRAND.danger }}>{(b.perfYtd * 100).toFixed(2)}%</span></div>
                <div><span style={{ color: BRAND.textMuted }}>流动性:</span> <span style={{ color: BRAND.text }}>{b.liquidity}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 11. 报表 Tab
// ============================================================
function renderReports() {
  return (
    <div className="space-y-3">
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>报表库存 ({REPORTS.length})</h3>
        <div className="space-y-2">
          {REPORTS.map((r) => (
            <div key={r.id} onClick={() => openDrawer('report', r)} className="p-3 rounded cursor-pointer hover:scale-[1.005] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={14} style={{ color: BRAND.primary }} />
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: r.statusColor + '20', color: r.statusColor }}>{r.status}</span>
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{r.format.toUpperCase()} / {r.pages} 页</div>
              </div>
              <p className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{r.description}</p>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textSub }}>
                <span>类型: {r.type}</span>
                <span>·</span>
                <span>频率: {r.frequency}</span>
                <span>·</span>
                <span>版本: {r.version}</span>
                <span>·</span>
                <span>最近生成: {r.lastGenerated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 12. 帮助 Tab
// ============================================================
function renderHelp() {
  const faqs = [
    { q: '如何创建新组合？', a: '点击组合 -> 新建组合 -> 填写名称 / 类型 / 风险角色 -> 确认' },
    { q: '如何定制目标配置？', a: '点击组合 -> 编辑配置 -> 设置类别 / 链 / 区域百分比 -> 确认' },
    { q: '如何设置再平衡？', a: '点击组合 -> 再平衡 -> 设置频率 / 阈值 / 时间窗 -> 启动' },
    { q: '如何导出报表？', a: '报表 -> 选择报表 -> 点击导出 -> 选择格式 / 范围' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>快速入门</h3>
          <div className="space-y-2">
            {[
              { i: '1', t: '选择组合', d: '或创建新组合' },
              { i: '2', t: '设置目标配置', d: '按类别 / 链 / 区域' },
              { i: '3', t: '启动监控', d: '系统实时跟踪偏移' },
              { i: '4', t: '定期再平衡', d: '手动或自动' },
            ].map((s) => (
              <div key={s.i} onClick={() => openDrawer('help', { q: s.t, a: s.d })} className="p-2 rounded cursor-pointer hover:scale-[1.01] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
                <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{s.i}. {s.t}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>常见问题</h3>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} onClick={() => openDrawer('help', f)} className="p-2 rounded cursor-pointer hover:scale-[1.01] transition-transform" style={{ backgroundColor: BRAND.cardHover }}>
                <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{f.q}</div>
                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>认证与开发资源</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { l: 'API 文档', v: '/api/v1/portfolio' },
            { l: 'WebSocket', v: 'wss://.../ws/portfolio' },
            { l: 'SDK', v: '@zsdex/portfolio-sdk' },
            { l: 'GitHub', v: 'zsdex/portfolio-service' },
          ].map((r, i) => (
            <div key={i} className="p-2 rounded" style={{ backgroundColor: BRAND.cardHover }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{r.l}</div>
              <div className="text-[10px] font-mono" style={{ color: BRAND.text }}>{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Drawer 组件
// ============================================================
function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
      <div>
        <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{title}</h2>
        {subtitle && <p className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-2 rounded-lg hover:scale-110 transition-transform" style={{ backgroundColor: BRAND.card }}>
        <X size={16} style={{ color: BRAND.textMuted }} />
      </button>
    </div>
  );
}

function PortfolioDrawer({ p, onClose }: { p: Portfolio; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={p.name} subtitle={p.description} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: '总价值', v: formatUsd(p.totalValue), c: BRAND.text },
            { l: '成本', v: formatUsd(p.costBasis), c: BRAND.textSub },
            { l: '未实现盈亏', v: formatUsd(p.unrealizedPnl), c: p.unrealizedPnl >= 0 ? BRAND.success : BRAND.danger },
            { l: '已实现盈亏', v: formatUsd(p.realizedPnl), c: BRAND.success },
            { l: '24h PnL', v: formatUsd(p.pnl24h), c: p.pnl24h >= 0 ? BRAND.success : BRAND.danger },
            { l: '7D', v: formatUsd(p.pnl7d), c: p.pnl7d >= 0 ? BRAND.success : BRAND.danger },
            { l: '30D', v: formatUsd(p.pnl30d), c: p.pnl30d >= 0 ? BRAND.success : BRAND.danger },
            { l: 'YTD', v: formatUsd(p.pnlYtd), c: p.pnlYtd >= 0 ? BRAND.success : BRAND.danger },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>风险调整指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
            <div><span style={{ color: BRAND.textMuted }}>Sharpe:</span> <span style={{ color: BRAND.text }}>{p.sharpe.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>Sortino:</span> <span style={{ color: BRAND.text }}>{p.sortino.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>最大回撤:</span> <span style={{ color: BRAND.danger }}>{(p.maxDrawdown * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textMuted }}>Beta:</span> <span style={{ color: BRAND.text }}>{p.beta.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>Alpha:</span> <span style={{ color: BRAND.success }}>{(p.alpha * 100).toFixed(2)}%</span></div>
            <div><span style={{ color: BRAND.textMuted }}>波动率:</span> <span style={{ color: BRAND.text }}>{(p.volatility * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textMuted }}>链:</span> <span style={{ color: BRAND.text }}>{p.chainCount}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>资产:</span> <span style={{ color: BRAND.text }}>{p.assetCount}</span></div>
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>再平衡</h3>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><span style={{ color: BRAND.textMuted }}>频率:</span> <span style={{ color: BRAND.text }}>{p.rebalanceFreq}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>最近完成:</span> <span style={{ color: BRAND.text }}>{p.lastRebalance}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>下一次:</span> <span style={{ color: BRAND.text }}>{p.nextRebalance}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>基准:</span> <span style={{ color: BRAND.text }}>{p.benchmark}</span></div>
            <div><span style={{ color: BRAND.textMuted }}>vs 基准:</span> <span style={{ color: p.perfVsBenchmark >= 0 ? BRAND.success : BRAND.danger }}>{(p.perfVsBenchmark * 100).toFixed(2)}%</span></div>
            <div><span style={{ color: BRAND.textMuted }}>目标收益:</span> <span style={{ color: BRAND.text }}>{(p.targetReturn * 100).toFixed(1)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDrawer({ a, onClose }: { a: PortfolioAsset; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={a.symbol + ' / ' + a.name} subtitle={a.category + ' · ' + a.chain} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: '价格', v: '$' + a.price.toFixed(4), c: BRAND.text },
            { l: '数量', v: a.amount.toLocaleString(), c: BRAND.text },
            { l: '市值/仓位', v: formatUsd(a.value), c: BRAND.primary },
            { l: '配置比', v: a.allocationPct.toFixed(1) + '%', c: BRAND.primary },
            { l: '未实现盈亏', v: formatUsd(a.unrealizedPnl), c: a.unrealizedPnl >= 0 ? BRAND.success : BRAND.danger },
            { l: '24h', v: (a.change24h * 100).toFixed(2) + '%', c: a.change24h >= 0 ? BRAND.success : BRAND.danger },
            { l: '7D', v: (a.change7d * 100).toFixed(2) + '%', c: a.change7d >= 0 ? BRAND.success : BRAND.danger },
            { l: '风险评分', v: a.riskScore.toString(), c: a.riskScore >= 7 ? BRAND.danger : a.riskScore >= 4 ? BRAND.warning : BRAND.success },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>仓位 / 链上结构</h3>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>成本:</span> <span className="font-mono" style={{ color: BRAND.text }}>{truncate(a.costBasis, 12)}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>标准:</span> <span style={{ color: BRAND.text }}>{a.standard}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>Token:</span> <span className="font-mono" style={{ color: BRAND.text }}>{truncate(a.contracts.token, 18)}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>金库:</span> <span className="font-mono" style={{ color: BRAND.text }}>{truncate(a.contracts.vault, 18)}</span></div>
            <div className="flex items-center justify-between"><span style={{ color: BRAND.textMuted }}>托管:</span> <span className="font-mono" style={{ color: BRAND.text }}>{truncate(a.contracts.custody, 18)}</span></div>
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>资产描述</h3>
          <p className="text-[10px] leading-relaxed" style={{ color: BRAND.textSub }}>{a.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {a.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RebalanceDrawer({ r, onClose }: { r: RebalanceAction; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={'再平衡 ' + r.id} subtitle={r.type + ' · ' + r.portfolio} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '状态', v: r.status, c: r.statusColor },
            { l: '触发原因', v: r.trigger, c: BRAND.text },
            { l: '用户/自动', v: r.user, c: BRAND.text },
            { l: '时间', v: r.timestamp, c: BRAND.text },
            { l: '目标偏移', v: (r.driftBefore * 100).toFixed(2) + '%', c: BRAND.warning },
            { l: '调整后', v: (r.driftAfter * 100).toFixed(2) + '%', c: BRAND.success },
            { l: '滑点', v: r.slippagePct + '%', c: r.slippagePct < 0.1 ? BRAND.success : BRAND.warning },
            { l: '费用', v: formatUsd(r.gasFee), c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PnlDrawer({ p, onClose }: { p: PnlRecord; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={'盈亏记录 ' + p.id} subtitle={p.period} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '收益', v: formatUsd(p.pnl), c: BRAND.success },
            { l: '费用', v: formatUsd(p.fees), c: BRAND.text },
            { l: '成本', v: formatUsd(p.costBasis), c: BRAND.text },
            { l: '市值', v: formatUsd(p.marketValue), c: BRAND.text },
            { l: '贡献资产', v: p.contributors + '', c: BRAND.text },
            { l: '贡献数', v: p.contributionCount + '', c: BRAND.text },
            { l: '状态', v: p.status, c: p.statusColor },
            { l: '时间', v: p.timestamp, c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>贡献资产</h3>
          <div className="space-y-1">
            {p.contributorsList.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.cardHover }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: BRAND.textMuted }}>#{i + 1}</span>
                  <span className="text-xs font-semibold" style={{ color: BRAND.text }}>{c.symbol}</span>
                </div>
                <div className="text-right text-[10px]">
                  <div className="font-mono" style={{ color: BRAND.text }}>{formatUsd(c.pnl)}</div>
                  <div style={{ color: BRAND.textMuted }}>贡献 {(c.contributionPct * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxDrawer({ t, onClose }: { t: TaxEvent; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={'税务事件 ' + t.id} subtitle={t.type} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '资产', v: t.asset, c: BRAND.text },
            { l: '交易类型', v: t.type, c: BRAND.text },
            { l: '税前收益', v: formatUsd(t.gainPreTax), c: t.gainPreTax >= 0 ? BRAND.success : BRAND.danger },
            { l: '应税', v: formatUsd(t.taxDue), c: BRAND.warning },
            { l: '持有期', v: t.holdingPeriodDays + ' 天', c: BRAND.text },
            { l: '是否短期', v: t.shortTerm ? '短' : '长', c: BRAND.text },
            { l: '是否抵免', v: t.deductible ? '是' : '否', c: t.deductible ? BRAND.success : BRAND.text },
            { l: '状态', v: t.status, c: t.statusColor },
            { l: '管辖区', v: t.jurisdiction, c: BRAND.text },
            { l: '时间', v: t.timestamp, c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>报告与自动化</h3>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>表单:</span> <span className="font-mono" style={{ color: BRAND.text }}>{t.form}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>报告状态:</span> <span style={{ color: BRAND.text }}>{t.reportStatus}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskDrawer({ r, onClose }: { r: RiskMetric; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={r.name} subtitle={r.category} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '当前', v: r.value + r.unit, c: BRAND.text },
            { l: '阈值', v: r.threshold + r.unit, c: BRAND.warning },
            { l: '超出', v: r.breachPct.toFixed(1) + '%', c: r.breached ? BRAND.danger : BRAND.success },
            { l: '状态', v: r.status, c: r.statusColor },
            { l: '所属组合', v: r.portfolio, c: BRAND.text },
            { l: '时间', v: r.timestamp, c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StrategyDrawer({ s, onClose }: { s: Strategy; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={s.name} subtitle={s.description} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '类型', v: s.type, c: BRAND.text },
            { l: '状态', v: s.status, c: s.statusColor },
            { l: 'YTD', v: (s.ytdReturn * 100).toFixed(2) + '%', c: s.ytdReturn >= 0 ? BRAND.success : BRAND.danger },
            { l: '1M', v: (s.return1m * 100).toFixed(2) + '%', c: s.return1m >= 0 ? BRAND.success : BRAND.danger },
            { l: '3M', v: (s.return3m * 100).toFixed(2) + '%', c: s.return3m >= 0 ? BRAND.success : BRAND.danger },
            { l: '12M', v: (s.return12m * 100).toFixed(2) + '%', c: s.return12m >= 0 ? BRAND.success : BRAND.danger },
            { l: 'Sharpe', v: s.sharpe.toFixed(2), c: BRAND.text },
            { l: 'Sortino', v: s.sortino.toFixed(2), c: BRAND.text },
            { l: '最大回撤', v: (s.maxDrawdown * 100).toFixed(1) + '%', c: BRAND.danger },
            { l: 'Beta', v: s.beta.toFixed(2), c: BRAND.text },
            { l: 'Alpha', v: (s.alpha * 100).toFixed(2) + '%', c: BRAND.success },
            { l: 'Win Rate', v: (s.winRate * 100).toFixed(1) + '%', c: BRAND.success },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>策略详情</h3>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>ID:</span> <span className="font-mono" style={{ color: BRAND.text }}>{s.id}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>开始日:</span> <span style={{ color: BRAND.text }}>{s.inceptionDate}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>管理费率:</span> <span style={{ color: BRAND.text }}>{(s.managementFee * 100).toFixed(2)}%</span></div>
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>业绩扣除:</span> <span style={{ color: BRAND.text }}>{(s.performanceFee * 100).toFixed(1)}%</span></div>
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>策略标签</h3>
          <div className="flex flex-wrap gap-1">
            {s.tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchmarkDrawer({ b, onClose }: { b: Benchmark; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={b.name} subtitle={b.type + ' · ' + b.symbol} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '类型', v: b.type, c: BRAND.text },
            { l: '状态', v: b.status, c: b.statusColor },
            { l: '资产数', v: b.assets + '', c: BRAND.text },
            { l: '链数', v: b.chains + '', c: BRAND.text },
            { l: '1M', v: (b.perf1m * 100).toFixed(2) + '%', c: b.perf1m >= 0 ? BRAND.success : BRAND.danger },
            { l: '3M', v: (b.perf3m * 100).toFixed(2) + '%', c: b.perf3m >= 0 ? BRAND.success : BRAND.danger },
            { l: '6M', v: (b.perf6m * 100).toFixed(2) + '%', c: b.perf6m >= 0 ? BRAND.success : BRAND.danger },
            { l: 'YTD', v: (b.perfYtd * 100).toFixed(2) + '%', c: b.perfYtd >= 0 ? BRAND.success : BRAND.danger },
            { l: '12M', v: (b.perf12m * 100).toFixed(2) + '%', c: b.perf12m >= 0 ? BRAND.success : BRAND.danger },
            { l: 'All', v: (b.perfAll * 100).toFixed(2) + '%', c: b.perfAll >= 0 ? BRAND.success : BRAND.danger },
            { l: '流动性', v: b.liquidity, c: BRAND.text },
            { l: '费率', v: (b.fee * 100).toFixed(2) + '%', c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportDrawer({ r, onClose }: { r: Report; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={r.name} subtitle={r.description} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '类型', v: r.type, c: BRAND.text },
            { l: '频率', v: r.frequency, c: BRAND.text },
            { l: '格式', v: r.format.toUpperCase(), c: BRAND.text },
            { l: '状态', v: r.status, c: r.statusColor },
            { l: '页数', v: r.pages + '', c: BRAND.text },
            { l: '文件大小', v: r.size + ' KB', c: BRAND.text },
            { l: '版本', v: r.version, c: BRAND.text },
            { l: '收件人数', v: r.recipients + '', c: BRAND.text },
            { l: '最近生成', v: r.lastGenerated, c: BRAND.text },
            { l: '下次调度', v: r.nextScheduled, c: BRAND.text },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMuted }}>{c.l}</div>
              <div className="text-xs font-bold tabular-nums" style={{ color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>模板与操作</h3>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>模板:</span> <span className="font-mono" style={{ color: BRAND.text }}>{r.template}</span></div>
            <div className="flex items-center gap-2"><span style={{ color: BRAND.textMuted }}>ID:</span> <span className="font-mono" style={{ color: BRAND.text }}>{r.id}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpDrawer({ h, onClose }: { h: { q: string; a: string }; onClose: () => void }) {
  return (
    <div>
      <DrawerHeader title={h.q} subtitle="帮助详情" onClose={onClose} />
      <div className="p-4 space-y-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>详细说明</h3>
          <p className="text-[10px] leading-relaxed" style={{ color: BRAND.textSub }}>{h.a}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>关联认证</h3>
          <p className="text-[10px] leading-relaxed" style={{ color: BRAND.textSub }}>API: /api/v1/portfolio/help | WebSocket: wss://.../ws/portfolio | SDK: @zsdex/portfolio-sdk</p>
        </div>
      </div>
    </div>
  );
}
  );
}

// === KPI Card ===
function KpiCard({ label, value, icon, idx, positive }: { label: string; value: string; icon: React.ReactNode; idx: number; positive?: boolean }) {
  return (
    <div className={`p-3 rounded-xl pa-stagger-${idx} hover:scale-105 transition-transform cursor-pointer`} style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div style={{ color: positive === true ? BRAND.success : positive === false ? BRAND.danger : BRAND.primary }}>{icon}</div>
        <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{label}</div>
      </div>
      <div className="text-base font-bold tabular-nums" style={{ color: positive === true ? BRAND.success : positive === false ? BRAND.danger : BRAND.text }}>{value}</div>
    </div>
  );
}
