/**
 * PortalAdvisor - 智能投顾与策略订阅中心 (2026-07-20 Q05 P3.46)
 *
 * 页面定位：
 * - 中萨数字科技交易所 智能投顾与策略订阅中心
 * - 智能投顾（Robo/Human/Hybrid） / 策略订阅 / 信号分发 / 跟单 / 回测 / 风险分析 / 资产配置 / 执行 / 订阅者 / 报告
 * - 与 P3.40 量化策略 + P3.45 资产组合 形成 "策略-组合-投顾" AI 闭环
 * - 与 P3.41 链上资产溯源 + P3.42 跨链互操作 + P3.43 流动性再质押 + P3.44 RWA 资产 + P3.45 资产组合 + P3.46 智能投顾 形成
 *   "链上资产→跨链→再质押→现实资产→组合配置→策略订阅→智能投顾" 全栈智能投顾能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / 投顾 / 策略 / 信号 / 回测 / 配置 / 跟单 / 风险 / 执行 / 订阅者 / 报告 / 帮助
 *
 * 合规约束：
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 * - 历史业绩不预示未来表现
 * - 投顾与策略订阅为技术能力演示，定性为"研究 / 工具 / 辅助"型能力，非投资建议
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

type Tab = 'overview' | 'advisor' | 'strategy' | 'signal' | 'backtest' | 'allocation' | 'follow' | 'risk' | 'execution' | 'subscriber' | 'report' | 'help';
type SortBy = 'name' | 'aum' | 'return' | 'sharpe' | 'subscribers' | 'minInvestment';

type AdvisorType = 'robo' | 'human' | 'hybrid' | 'index' | 'thematic' | 'esg';
type AdvisorStatus = 'active' | 'paused' | 'beta' | 'deprecated';

interface Advisor {
  id: string;
  name: string;
  description: string;
  type: AdvisorType;
  avatar: string;
  iconBg: string;
  iconColor: string;
  status: AdvisorStatus;
  aum: number;
  subscribers: number;
  newSubs7d: number;
  churn7d: number;
  netFlow7d: number;
  minInvestment: number;
  managementFee: number;
  performanceFee: number;
  inceptionDate: string;
  strategyCount: number;
  portfolioCount: number;
  region: string;
  language: string[];
  certifications: string[];
  ytdReturn: number;
  return1m: number;
  return3m: number;
  return12m: number;
  returnSinceInception: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  alpha: number;
  winRate: number;
  avgHoldDays: number;
  rebalanceFreq: string;
  benchmark: string;
  tags: string[];
  rating: number;
  reviews: number;
  manager: string;
  managerTitle: string;
  highlights: string[];
  statusColor: string;
}

interface Signal {
  id: string;
  advisorId: string;
  advisorName: string;
  name: string;
  description: string;
  type: 'buy' | 'sell' | 'rebalance' | 'alert' | 'close' | 'hedge';
  asset: string;
  chain: string;
  price: number;
  target: number;
  stopLoss: number;
  confidence: number;
  urgency: 'immediate' | 'high' | 'normal' | 'low';
  publishedAt: string;
  expiredAt: string;
  followers: number;
  executed: number;
  successRate: number;
  avgReturn: number;
  status: 'live' | 'pending' | 'closed' | 'expired' | 'cancelled';
  channel: ('app' | 'email' | 'sms' | 'webhook' | 'telegram' | 'discord')[];
  tags: string[];
  statusColor: string;
}

interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  period: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalEquity: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  maxDrawdown: number;
  maxDrawdownDays: number;
  volatility: number;
  beta: number;
  alpha: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  exposure: number;
  benchmarkReturn: number;
  alphaVsBenchmark: number;
  status: 'completed' | 'running' | 'failed' | 'pending';
  engine: string;
  slippage: number;
  commission: number;
  statusColor: string;
}

interface Subscriber {
  id: string;
  username: string;
  email: string;
  avatar: string;
  tier: 'free' | 'basic' | 'pro' | 'vip' | 'institutional';
  invested: number;
  pnl: number;
  pnlPct: number;
  subscribedAt: string;
  lastActive: string;
  advisorsCount: number;
  signalsFollowed: number;
  autoFollow: boolean;
  riskProfile: 'conservative' | 'balanced' | 'aggressive' | 'speculative';
  region: string;
  status: 'active' | 'paused' | 'churned' | 'trial';
  statusColor: string;
}

interface Allocation {
  id: string;
  advisorId: string;
  category: string;
  current: number;
  target: number;
  drift: number;
  asset: string;
  chain: string;
  expectedReturn: number;
  risk: number;
  liquidity: 'high' | 'medium' | 'low';
  rebalanceAction: 'buy' | 'sell' | 'hold';
  notes: string;
}

interface Execution {
  id: string;
  signalId: string;
  advisorId: string;
  advisorName: string;
  asset: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price: number;
  filled: number;
  avgPrice: number;
  fee: number;
  feeCurrency: string;
  total: number;
  pnl: number;
  pnlPct: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'failed';
  venue: string;
  chain: string;
  txHash: string;
  executedAt: string;
  latency: number;
  slippage: number;
  statusColor: string;
}

interface ReportAD {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'attribution' | 'risk' | 'tax' | 'compliance' | 'investor_letter' | 'fact_sheet';
  period: string;
  generatedAt: string;
  size: number;
  pages: number;
  format: 'pdf' | 'xlsx' | 'csv' | 'html';
  author: string;
  recipients: number;
  status: 'ready' | 'generating' | 'scheduled' | 'delivered' | 'failed';
  downloadUrl: string;
  tags: string[];
  statusColor: string;
}

interface FollowRecord {
  id: string;
  followerId: string;
  followerName: string;
  advisorId: string;
  advisorName: string;
  allocation: number;
  copyMode: 'proportional' | 'fixed' | 'risk_matched' | 'reverse';
  stopLoss: number;
  takeProfit: number;
  startedAt: string;
  pnl: number;
  pnlPct: number;
  trades: number;
  status: 'running' | 'paused' | 'stopped' | 'error';
  statusColor: string;
}

interface RiskAlert {
  id: string;
  advisorId: string;
  advisorName: string;
  type: 'drawdown' | 'concentration' | 'leverage' | 'liquidity' | 'correlation' | 'compliance' | 'volatility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy: string;
  resolved: boolean;
  action: string;
  statusColor: string;
}

// ============================================================
// Mock 数据
// ============================================================

const ADVISORS: Advisor[] = [
  {
    id: 'adv-001',
    name: 'ZSDEX 智能平衡 Robo 投顾',
    description: '基于风险平价与 Black-Litterman 模型的自动化资产配置，覆盖 8 大类资产、12 条公链，支持动态再平衡与税务感知交易。',
    type: 'robo', avatar: '🤖', iconBg: 'rgba(20,184,129,0.12)', iconColor: BRAND.primary, status: 'active',
    aum: 1_240_000_000, subscribers: 48_652, newSubs7d: 1284, churn7d: 32, netFlow7d: 18_500_000,
    minInvestment: 100, managementFee: 0.5, performanceFee: 10, inceptionDate: '2023-04-12',
    strategyCount: 18, portfolioCount: 6, region: 'Global', language: ['zh', 'en', 'ja'],
    certifications: ['CFA Level III', 'FRM', 'CAIA'],
    ytdReturn: 18.7, return1m: 2.3, return3m: 7.8, return12m: 24.5, returnSinceInception: 86.4,
    sharpe: 1.85, sortino: 2.41, maxDrawdown: -8.2, volatility: 12.4, beta: 0.78, alpha: 4.2,
    winRate: 64.5, avgHoldDays: 42, rebalanceFreq: '每周', benchmark: '60/40 Crypto-Stable Index',
    tags: ['平衡型', '低费率', '自动化', '多链'], rating: 4.7, reviews: 8_642,
    manager: '李文博（首席量化官）', managerTitle: '10+ 年全球资产配置经验，前顶级机构投资组合经理',
    highlights: ['多链多资产一站式配置', '风险预算动态调整', '税务感知交易', '周度策略报告自动推送'],
    statusColor: BRAND.success,
  },
  {
    id: 'adv-002',
    name: '主动成长策略（人工 + AI 辅助）',
    description: '由 4 位资深基金经理与 AI 信号引擎协同运作的主动管理组合，专注高质量 crypto 资产 + RWA 收益叠加 + 量化对冲。',
    type: 'hybrid', avatar: '👨‍💼', iconBg: 'rgba(255,169,64,0.12)', iconColor: '#FFA940', status: 'active',
    aum: 685_000_000, subscribers: 12_487, newSubs7d: 386, churn7d: 18, netFlow7d: 12_400_000,
    minInvestment: 10_000, managementFee: 1.2, performanceFee: 20, inceptionDate: '2022-09-21',
    strategyCount: 9, portfolioCount: 4, region: 'Global', language: ['zh', 'en'],
    certifications: ['CFA', 'CPA', 'CFP'],
    ytdReturn: 32.4, return1m: 4.8, return3m: 14.2, return12m: 38.6, returnSinceInception: 142.8,
    sharpe: 1.62, sortino: 2.18, maxDrawdown: -15.4, volatility: 22.6, beta: 1.12, alpha: 6.8,
    winRate: 58.2, avgHoldDays: 28, rebalanceFreq: '每日审视 / 周度调仓', benchmark: 'BTC + ETH Equal Weight',
    tags: ['主动', '高 alpha', '高波动', 'RWA 增强'], rating: 4.6, reviews: 3_215,
    manager: '陈思源（基金经理）', managerTitle: '前对冲基金 PM，专注 crypto 自营与多策略组合',
    highlights: ['人工 + AI 双引擎', 'RWA 现实资产收益叠加', '周度策略会议公开纪要', '1 对 1 季度投顾沟通'],
    statusColor: BRAND.success,
  },
  {
    id: 'adv-003',
    name: '稳健收益型（低波动 Robo）',
    description: '针对保守型投资者的低波动组合，主配稳定币 + LST/LRT + 短债 RWA，辅以动态对冲与跨基差套利。',
    type: 'robo', avatar: '🛡️', iconBg: 'rgba(14,203,129,0.12)', iconColor: BRAND.success, status: 'active',
    aum: 920_000_000, subscribers: 76_842, newSubs7d: 2_148, churn7d: 86, netFlow7d: 22_800_000,
    minInvestment: 100, managementFee: 0.3, performanceFee: 5, inceptionDate: '2023-02-08',
    strategyCount: 12, portfolioCount: 5, region: 'Global', language: ['zh', 'en', 'ko'],
    certifications: ['CFA', 'FRM'],
    ytdReturn: 9.4, return1m: 0.8, return3m: 2.4, return12m: 11.2, returnSinceInception: 32.6,
    sharpe: 2.84, sortino: 4.21, maxDrawdown: -2.1, volatility: 4.2, beta: 0.18, alpha: 1.4,
    winRate: 78.6, avgHoldDays: 18, rebalanceFreq: '每日', benchmark: '3-Month T-Bill',
    tags: ['保守', '稳定币', '低波动', '年化目标历史区间'], rating: 4.8, reviews: 14_287,
    manager: '王欣然（量化研究员）', managerTitle: '前固定收益量化团队负责人，专注低风险 crypto 收益策略',
    highlights: ['历史最大回撤 < 3%', '稳定币 + LST 双层缓冲', '短债 RWA 收益增强', '每日自动再平衡'],
    statusColor: BRAND.success,
  },
  {
    id: 'adv-004',
    name: 'DeFi 收益聚合（高收益 Robo）',
    description: '聚焦 DeFi 协议聚合收益，自动路由最优流动性挖矿 / 借贷 / 杠杆挖矿 / 永续对冲组合，兼顾收益与风险控制。',
    type: 'robo', avatar: '💎', iconBg: 'rgba(179,112,255,0.12)', iconColor: '#B370FF', status: 'active',
    aum: 425_000_000, subscribers: 24_682, newSubs7d: 624, churn7d: 48, netFlow7d: 8_400_000,
    minInvestment: 500, managementFee: 0.8, performanceFee: 15, inceptionDate: '2023-06-15',
    strategyCount: 24, portfolioCount: 8, region: 'Global', language: ['zh', 'en'],
    certifications: ['DefiLlama Verified', 'CertiK Audited'],
    ytdReturn: 28.6, return1m: 3.4, return3m: 11.2, return12m: 36.8, returnSinceInception: 96.2,
    sharpe: 1.42, sortino: 1.88, maxDrawdown: -18.4, volatility: 28.6, beta: 1.24, alpha: 5.6,
    winRate: 62.4, avgHoldDays: 14, rebalanceFreq: '每日 2 次', benchmark: 'DeFi Pulse Index',
    tags: ['DeFi', '高收益', '高波动', '聚合'], rating: 4.5, reviews: 5_842,
    manager: '赵子龙（DeFi 策略师）', managerTitle: 'DeFi 协议早期参与者，专注收益聚合与风险控制',
    highlights: ['覆盖 32 个 DeFi 协议', '自动路由最优收益', '智能合约风险审计', '实时风险监控'],
    statusColor: BRAND.success,
  },
  {
    id: 'adv-005',
    name: 'ESG 影响力投资主题',
    description: '聚焦环保、社会责任与可持续金融主题的加密资产投资组合，优先配置碳信用、清洁能源算力、绿色债券 RWA。',
    type: 'esg', avatar: '🌱', iconBg: 'rgba(115,209,61,0.12)', iconColor: '#73D13D', status: 'beta',
    aum: 86_000_000, subscribers: 4_215, newSubs7d: 184, churn7d: 12, netFlow7d: 1_200_000,
    minInvestment: 1_000, managementFee: 0.8, performanceFee: 12, inceptionDate: '2024-03-22',
    strategyCount: 7, portfolioCount: 3, region: 'Global', language: ['zh', 'en'],
    certifications: ['PRI Signatory', 'B-Corp'],
    ytdReturn: 14.2, return1m: 1.6, return3m: 5.4, return12m: 18.6, returnSinceInception: 28.4,
    sharpe: 1.68, sortino: 2.24, maxDrawdown: -7.8, volatility: 14.2, beta: 0.86, alpha: 3.2,
    winRate: 60.2, avgHoldDays: 56, rebalanceFreq: '月度', benchmark: 'MSCI ESG Crypto Index',
    tags: ['ESG', '碳中和', '影响力', '主题'], rating: 4.4, reviews: 826,
    manager: '林雪婷（ESG 投资负责人）', managerTitle: '前 ESG 评级机构分析师，专注可持续金融',
    highlights: ['碳信用资产配置', '清洁能源算力投资', '绿色债券 RWA', 'ESG 影响力报告'],
    statusColor: BRAND.amber,
  },
  {
    id: 'adv-006',
    name: 'Crypto 指数增强（被动 + Alpha 叠加）',
    description: '跟踪 Top 50 crypto 资产市值加权指数，叠加量化 alpha 信号与 RWA 收益增强，提供 beta + alpha 的双层收益。',
    type: 'index', avatar: '📊', iconBg: 'rgba(68,219,244,0.12)', iconColor: BRAND.info, status: 'active',
    aum: 1_580_000_000, subscribers: 92_486, newSubs7d: 3_284, churn7d: 124, netFlow7d: 32_400_000,
    minInvestment: 50, managementFee: 0.2, performanceFee: 8, inceptionDate: '2022-11-10',
    strategyCount: 15, portfolioCount: 4, region: 'Global', language: ['zh', 'en', 'ja', 'ko'],
    certifications: ['Index Admin License'],
    ytdReturn: 22.4, return1m: 2.8, return3m: 9.6, return12m: 28.4, returnSinceInception: 118.6,
    sharpe: 1.52, sortino: 2.04, maxDrawdown: -12.4, volatility: 18.6, beta: 0.96, alpha: 2.8,
    winRate: 56.4, avgHoldDays: 32, rebalanceFreq: '每月', benchmark: 'CCi50 Index',
    tags: ['指数', '被动', '低成本', '高流动性'], rating: 4.6, reviews: 18_486,
    manager: '孙明远（指数投资总监）', managerTitle: '前全球指数公司量化研究员，专注 crypto 指数编制',
    highlights: ['跟踪误差 < 1%', 'alpha 叠加 2-4%', '费率 0.2% 起', '高流动性月调仓'],
    statusColor: BRAND.success,
  },
];

const SIGNALS: Signal[] = [
  { id: 'sig-001', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', name: 'ETH/BTC 比率突破阻力位 - 加仓信号', description: 'ETH/BTC 比率突破 0.052 阻力位，链上活跃地址数 +18%，建议加仓 ETH 现货与 LST。', type: 'buy', asset: 'ETH', chain: 'Ethereum', price: 3245.6, target: 3850, stopLoss: 2980, confidence: 86, urgency: 'high', publishedAt: '2026-07-20 09:32:18', expiredAt: '2026-07-22 09:32:18', followers: 4_286, executed: 3_842, successRate: 72.4, avgReturn: 8.6, status: 'live', channel: ['app', 'email', 'webhook', 'telegram'], tags: ['趋势', 'ETH', '高置信'], statusColor: BRAND.success },
  { id: 'sig-002', advisorId: 'adv-002', advisorName: '主动成长策略', name: 'SOL 链上 TVL 创新高 - 战略性加仓', description: 'Solana 链上 TVL 突破 18B USDT，活跃开发者数 +42%，RWA 协议部署加速。', type: 'buy', asset: 'SOL', chain: 'Solana', price: 184.2, target: 240, stopLoss: 165, confidence: 78, urgency: 'normal', publishedAt: '2026-07-20 08:18:42', expiredAt: '2026-07-23 08:18:42', followers: 2_842, executed: 2_184, successRate: 68.2, avgReturn: 12.4, status: 'live', channel: ['app', 'email', 'telegram'], tags: ['基本面', 'SOL', 'TVL'], statusColor: BRAND.success },
  { id: 'sig-003', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', name: '稳定币占比突破 18% - 风险预警', description: '市场稳定币占比突破 18%，USDT/USDC 流入加速，建议降低风险资产敞口 5%。', type: 'alert', asset: 'PORTFOLIO', chain: 'Multi', price: 0, target: 0, stopLoss: 0, confidence: 92, urgency: 'high', publishedAt: '2026-07-20 10:15:32', expiredAt: '2026-07-20 18:15:32', followers: 8_642, executed: 7_284, successRate: 84.6, avgReturn: 0, status: 'live', channel: ['app', 'email', 'sms', 'webhook'], tags: ['风险', '稳定币', '再平衡'], statusColor: BRAND.warning },
  { id: 'sig-004', advisorId: 'adv-003', advisorName: '稳健收益型', name: 'LRT 收益率突破 12% APY - 增配信号', description: 'ezETH / weETH 等 LRT 协议 APY 突破 12%，restaking 收益叠加，配置吸引力上升。', type: 'buy', asset: 'LRT-BUNDLE', chain: 'Ethereum', price: 1.0245, target: 1.085, stopLoss: 1.005, confidence: 81, urgency: 'normal', publishedAt: '2026-07-20 07:45:18', expiredAt: '2026-07-22 07:45:18', followers: 6_842, executed: 5_824, successRate: 76.4, avgReturn: 5.8, status: 'live', channel: ['app', 'email', 'webhook'], tags: ['LRT', '再质押', '收益'], statusColor: BRAND.success },
  { id: 'sig-005', advisorId: 'adv-002', advisorName: '主动成长策略', name: 'BTC 短期超买 - 部分止盈', description: 'BTC RSI 突破 78，融资利率走高，建议对 30% 仓位进行部分止盈。', type: 'sell', asset: 'BTC', chain: 'Bitcoin', price: 68_245, target: 72_000, stopLoss: 65_000, confidence: 74, urgency: 'normal', publishedAt: '2026-07-20 06:32:18', expiredAt: '2026-07-21 06:32:18', followers: 1_842, executed: 1_284, successRate: 64.2, avgReturn: 4.6, status: 'live', channel: ['app', 'email', 'telegram', 'discord'], tags: ['技术面', 'BTC', '止盈'], statusColor: BRAND.primary },
  { id: 'sig-006', advisorId: 'adv-004', advisorName: 'DeFi 收益聚合', name: 'Aave V3 USDC 供给 APY 突破 6.8%', description: 'Aave V3 Ethereum USDC 供给 APY 突破 6.8%，利用率达 92%，建议提高 USDC 供给比例。', type: 'rebalance', asset: 'USDC', chain: 'Ethereum', price: 1.0001, target: 1.0001, stopLoss: 0.9995, confidence: 88, urgency: 'immediate', publishedAt: '2026-07-20 11:08:42', expiredAt: '2026-07-20 23:08:42', followers: 3_286, executed: 2_842, successRate: 82.4, avgReturn: 1.2, status: 'live', channel: ['app', 'webhook'], tags: ['DeFi', '稳定币', '借贷'], statusColor: BRAND.success },
];

const BACKTEST_RESULTS: BacktestResult[] = [
  { id: 'bt-001', strategyId: 'strat-001', strategyName: '多链多资产风险平价 (v3.2)', period: '2023-01-01 ~ 2026-07-20', startDate: '2023-01-01', endDate: '2026-07-20', initialCapital: 1_000_000, finalEquity: 2_142_000, totalReturn: 114.2, annualizedReturn: 28.4, sharpe: 1.86, sortino: 2.42, calmar: 1.94, maxDrawdown: -14.6, maxDrawdownDays: 42, volatility: 14.6, beta: 0.82, alpha: 4.6, winRate: 64.8, totalTrades: 1_284, avgWin: 4.2, avgLoss: -2.4, profitFactor: 2.18, exposure: 0.86, benchmarkReturn: 78.4, alphaVsBenchmark: 35.8, status: 'completed', engine: 'ZSDEX Quant Engine v3.2', slippage: 0.05, commission: 0.10, statusColor: BRAND.success },
  { id: 'bt-002', strategyId: 'strat-002', strategyName: 'LRT 收益聚合 (v2.4)', period: '2024-01-01 ~ 2026-07-20', startDate: '2024-01-01', endDate: '2026-07-20', initialCapital: 500_000, finalEquity: 924_000, totalReturn: 84.8, annualizedReturn: 32.4, sharpe: 2.12, sortino: 2.84, calmar: 2.18, maxDrawdown: -8.2, maxDrawdownDays: 28, volatility: 15.2, beta: 0.68, alpha: 5.8, winRate: 72.4, totalTrades: 642, avgWin: 3.8, avgLoss: -1.8, profitFactor: 2.84, exposure: 0.92, benchmarkReturn: 42.6, alphaVsBenchmark: 42.2, status: 'completed', engine: 'ZSDEX Quant Engine v3.2', slippage: 0.03, commission: 0.08, statusColor: BRAND.success },
  { id: 'bt-003', strategyId: 'strat-003', strategyName: 'BTC 趋势跟踪 (v4.0)', period: '2022-01-01 ~ 2026-07-20', startDate: '2022-01-01', endDate: '2026-07-20', initialCapital: 1_000_000, finalEquity: 2_840_000, totalReturn: 184.0, annualizedReturn: 38.6, sharpe: 1.42, sortino: 1.88, calmar: 1.62, maxDrawdown: -24.8, maxDrawdownDays: 86, volatility: 28.4, beta: 1.18, alpha: 6.4, winRate: 52.4, totalTrades: 486, avgWin: 8.4, avgLoss: -4.2, profitFactor: 1.84, exposure: 0.74, benchmarkReturn: 124.6, alphaVsBenchmark: 59.4, status: 'completed', engine: 'ZSDEX Quant Engine v3.2', slippage: 0.06, commission: 0.12, statusColor: BRAND.success },
  { id: 'bt-004', strategyId: 'strat-004', strategyName: '跨链套利 (v1.8)', period: '2024-06-01 ~ 2026-07-20', startDate: '2024-06-01', endDate: '2026-07-20', initialCapital: 800_000, finalEquity: 1_186_000, totalReturn: 48.2, annualizedReturn: 21.4, sharpe: 2.84, sortino: 4.12, calmar: 3.24, maxDrawdown: -4.2, maxDrawdownDays: 14, volatility: 7.6, beta: 0.42, alpha: 3.8, winRate: 84.6, totalTrades: 4_286, avgWin: 1.2, avgLoss: -0.6, profitFactor: 3.42, exposure: 0.96, benchmarkReturn: 28.4, alphaVsBenchmark: 19.8, status: 'completed', engine: 'ZSDEX Quant Engine v3.2', slippage: 0.02, commission: 0.04, statusColor: BRAND.success },
  { id: 'bt-005', strategyId: 'strat-005', strategyName: 'AI 信号驱动多因子 (v2.0)', period: '2025-01-01 ~ 2026-07-20', startDate: '2025-01-01', endDate: '2026-07-20', initialCapital: 1_500_000, finalEquity: 2_184_000, totalReturn: 45.6, annualizedReturn: 26.8, sharpe: 1.68, sortino: 2.18, calmar: 1.84, maxDrawdown: -10.4, maxDrawdownDays: 32, volatility: 16.2, beta: 0.92, alpha: 4.2, winRate: 60.2, totalTrades: 2_184, avgWin: 3.2, avgLoss: -1.8, profitFactor: 2.12, exposure: 0.84, benchmarkReturn: 32.4, alphaVsBenchmark: 13.2, status: 'running', engine: 'ZSDEX Quant Engine v3.2 + GLM-4V', slippage: 0.04, commission: 0.08, statusColor: '#FFA940' },
];

const SUBSCRIBERS: Subscriber[] = [
  { id: 'sub-001', username: 'investor_alpha', email: 'alpha@example.com', avatar: '🅰️', tier: 'institutional', invested: 12_500_000, pnl: 1_840_000, pnlPct: 14.7, subscribedAt: '2023-04-12', lastActive: '2026-07-20 10:24:18', advisorsCount: 6, signalsFollowed: 84, autoFollow: true, riskProfile: 'balanced', region: 'Asia-Pacific', status: 'active', statusColor: BRAND.success },
  { id: 'sub-002', username: 'whale_2024', email: 'whale@example.com', avatar: '🐋', tier: 'vip', invested: 6_800_000, pnl: 982_000, pnlPct: 14.4, subscribedAt: '2024-01-08', lastActive: '2026-07-20 11:42:32', advisorsCount: 4, signalsFollowed: 56, autoFollow: true, riskProfile: 'aggressive', region: 'North America', status: 'active', statusColor: BRAND.success },
  { id: 'sub-003', username: 'crypto_lover_88', email: 'lover88@example.com', avatar: '💎', tier: 'pro', invested: 485_000, pnl: 62_400, pnlPct: 12.8, subscribedAt: '2024-06-21', lastActive: '2026-07-20 09:18:42', advisorsCount: 3, signalsFollowed: 32, autoFollow: true, riskProfile: 'balanced', region: 'Europe', status: 'active', statusColor: BRAND.success },
  { id: 'sub-004', username: 'risk_averse_user', email: 'conservative@example.com', avatar: '🛡️', tier: 'basic', invested: 84_000, pnl: 8_240, pnlPct: 9.8, subscribedAt: '2024-09-12', lastActive: '2026-07-19 18:42:18', advisorsCount: 2, signalsFollowed: 18, autoFollow: false, riskProfile: 'conservative', region: 'Asia-Pacific', status: 'active', statusColor: BRAND.success },
  { id: 'sub-005', username: 'defi_maximalist', email: 'defi@example.com', avatar: '🌐', tier: 'pro', invested: 286_000, pnl: -18_400, pnlPct: -6.4, subscribedAt: '2024-03-18', lastActive: '2026-07-20 08:24:18', advisorsCount: 2, signalsFollowed: 42, autoFollow: true, riskProfile: 'aggressive', region: 'Europe', status: 'paused', statusColor: '#FFA940' },
  { id: 'sub-006', username: 'robo_fan', email: 'robo@example.com', avatar: '🤖', tier: 'free', invested: 12_400, pnl: 1_240, pnlPct: 10.0, subscribedAt: '2025-12-08', lastActive: '2026-07-20 10:42:18', advisorsCount: 1, signalsFollowed: 8, autoFollow: false, riskProfile: 'conservative', region: 'Asia-Pacific', status: 'trial', statusColor: BRAND.primary },
  { id: 'sub-007', username: 'fund_manager_pro', email: 'pm@example.com', avatar: '👔', tier: 'institutional', invested: 28_400_000, pnl: 4_240_000, pnlPct: 14.9, subscribedAt: '2023-02-14', lastActive: '2026-07-20 11:24:32', advisorsCount: 8, signalsFollowed: 124, autoFollow: true, riskProfile: 'balanced', region: 'Global', status: 'active', statusColor: BRAND.success },
];

const ALLOCATIONS: Allocation[] = [
  { id: 'alc-001', advisorId: 'adv-001', category: '主流币', current: 32, target: 30, drift: 2, asset: 'BTC + ETH Bundle', chain: 'Multi', expectedReturn: 18.4, risk: 14.2, liquidity: 'high', rebalanceAction: 'sell', notes: 'BTC 占比 6% 超出目标 4%' },
  { id: 'alc-002', advisorId: 'adv-001', category: '稳定币', current: 18, target: 20, drift: -2, asset: 'USDC + USDT Bundle', chain: 'Multi', expectedReturn: 4.8, risk: 0.4, liquidity: 'high', rebalanceAction: 'buy', notes: '稳定币占比低于目标 2%' },
  { id: 'alc-003', advisorId: 'adv-001', category: 'LST/LRT', current: 22, target: 22, drift: 0, asset: 'ezETH + weETH + rETH', chain: 'Ethereum', expectedReturn: 9.6, risk: 6.8, liquidity: 'high', rebalanceAction: 'hold', notes: '符合目标' },
  { id: 'alc-004', advisorId: 'adv-001', category: 'DeFi', current: 12, target: 12, drift: 0, asset: 'Aave + Compound + Curve LP', chain: 'Multi', expectedReturn: 12.4, risk: 8.2, liquidity: 'high', rebalanceAction: 'hold', notes: '符合目标' },
  { id: 'alc-005', advisorId: 'adv-001', category: 'RWA', current: 8, target: 10, drift: -2, asset: '短债 RWA + 碳信用', chain: 'Ethereum', expectedReturn: 7.2, risk: 2.4, liquidity: 'medium', rebalanceAction: 'buy', notes: 'RWA 占比低于目标' },
  { id: 'alc-006', advisorId: 'adv-001', category: 'NFT', current: 4, target: 3, drift: 1, asset: '蓝筹 NFT Index', chain: 'Ethereum', expectedReturn: 14.2, risk: 24.6, liquidity: 'low', rebalanceAction: 'sell', notes: 'NFT 占比超出目标 1%' },
  { id: 'alc-007', advisorId: 'adv-001', category: '衍生品对冲', current: 4, target: 3, drift: 1, asset: 'BTC 永续空头对冲', chain: 'Multi', expectedReturn: 0, risk: 4.2, liquidity: 'high', rebalanceAction: 'hold', notes: '对冲头寸' },
];

const EXECUTIONS: Execution[] = [
  { id: 'exe-001', signalId: 'sig-001', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', asset: 'ETH', side: 'buy', type: 'market', quantity: 1_250, price: 3245.6, filled: 1_250, avgPrice: 3246.2, fee: 162.32, feeCurrency: 'USDC', total: 4_057_750, pnl: 0, pnlPct: 0, status: 'filled', venue: 'ZSDEX Spot', chain: 'Ethereum', txHash: '0x4a8f...c821', executedAt: '2026-07-20 09:33:42', latency: 86, slippage: 0.018, statusColor: BRAND.success },
  { id: 'exe-002', signalId: 'sig-002', advisorId: 'adv-002', advisorName: '主动成长策略', asset: 'SOL', side: 'buy', type: 'limit', quantity: 8_400, price: 184.0, filled: 8_400, avgPrice: 184.18, fee: 309.42, feeCurrency: 'USDC', total: 1_547_112, pnl: 0, pnlPct: 0, status: 'filled', venue: 'ZSDEX Spot', chain: 'Solana', txHash: '5xYz...8aP3', executedAt: '2026-07-20 08:24:18', latency: 124, slippage: 0.010, statusColor: BRAND.success },
  { id: 'exe-003', signalId: 'sig-005', advisorId: 'adv-002', advisorName: '主动成长策略', asset: 'BTC', side: 'sell', type: 'limit', quantity: 12.5, price: 68_500, filled: 12.5, avgPrice: 68_420, fee: 213.81, feeCurrency: 'USDC', total: 855_250, pnl: 84_625, pnlPct: 9.8, status: 'filled', venue: 'ZSDEX Spot', chain: 'Bitcoin', txHash: 'bc1q...m9x4', executedAt: '2026-07-20 06:42:18', latency: 142, slippage: 0.012, statusColor: BRAND.success },
  { id: 'exe-004', signalId: 'sig-006', advisorId: 'adv-004', advisorName: 'DeFi 收益聚合', asset: 'USDC', side: 'buy', type: 'market', quantity: 1_500_000, price: 1.0001, filled: 1_500_000, avgPrice: 1.0001, fee: 375.02, feeCurrency: 'USDC', total: 1_500_150, pnl: 0, pnlPct: 0, status: 'filled', venue: 'Aave V3', chain: 'Ethereum', txHash: '0xc4e...7d91', executedAt: '2026-07-20 11:08:42', latency: 64, slippage: 0.000, statusColor: BRAND.success },
  { id: 'exe-005', signalId: 'sig-001', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', asset: 'ezETH', side: 'buy', type: 'market', quantity: 850, price: 1.0245, filled: 600, avgPrice: 1.0248, fee: 153.72, feeCurrency: 'ETH', total: 615.0, pnl: 0, pnlPct: 0, status: 'partial', venue: 'Balancer', chain: 'Ethereum', txHash: '0x82b...a3f4', executedAt: '2026-07-20 09:34:18', latency: 184, slippage: 0.030, statusColor: '#FFA940' },
];

const REPORTS_AD: ReportAD[] = [
  { id: 'rpt-001', name: '智能投顾 Q2 2026 业绩归因报告', description: 'Q2 整体业绩、各策略贡献、风险归因、持仓调整归因与未来展望', type: 'attribution', period: 'Q2 2026', generatedAt: '2026-07-08 18:00:00', size: 4_240_000, pages: 86, format: 'pdf', author: '李文博', recipients: 12_486, status: 'ready', downloadUrl: '#', tags: ['季度', '归因', '合规'], statusColor: BRAND.success },
  { id: 'rpt-002', name: '6 月组合再平衡报告', description: '6 月组合配置偏离度分析、再平衡触发、执行、税务影响', type: 'performance', period: '2026-06', generatedAt: '2026-07-01 09:00:00', size: 2_840_000, pages: 48, format: 'pdf', author: '王欣然', recipients: 18_284, status: 'delivered', downloadUrl: '#', tags: ['月度', '再平衡'], statusColor: BRAND.primary },
  { id: 'rpt-003', name: '2026 H1 风险监控报告', description: '上半年风险敞口、VaR、压力测试、合规检查、风险事件', type: 'risk', period: 'H1 2026', generatedAt: '2026-07-15 14:00:00', size: 5_640_000, pages: 124, format: 'pdf', author: '陈思源', recipients: 4_286, status: 'ready', downloadUrl: '#', tags: ['半年度', '风险', '合规'], statusColor: BRAND.success },
  { id: 'rpt-004', name: '投资人大字版周报 #28', description: '本周业绩、持仓变动、关注事件、Q&A', type: 'investor_letter', period: '2026-W28', generatedAt: '2026-07-19 18:00:00', size: 1_240_000, pages: 12, format: 'pdf', author: '李文博', recipients: 86_284, status: 'ready', downloadUrl: '#', tags: ['周报', '投资人'], statusColor: BRAND.success },
  { id: 'rpt-005', name: 'AI 信号驱动多因子回测报告', description: 'AI 多因子模型近 18 月回测详细分析、归因与压力测试', type: 'performance', period: '2025-01-01 ~ 2026-07-20', generatedAt: '2026-07-20 06:00:00', size: 8_240_000, pages: 186, format: 'pdf', author: '赵子龙', recipients: 2_184, status: 'generating', downloadUrl: '#', tags: ['回测', 'AI', '多因子'], statusColor: '#FFA940' },
  { id: 'rpt-006', name: '投顾合规自查月报 (内部)', description: '本月合规自查、KYT 筛查、KYC 更新、利益冲突检查', type: 'compliance', period: '2026-06', generatedAt: '2026-07-05 10:00:00', size: 3_240_000, pages: 64, format: 'pdf', author: '林雪婷', recipients: 24, status: 'delivered', downloadUrl: '#', tags: ['月度', '合规', '内部'], statusColor: BRAND.primary },
  { id: 'rpt-007', name: '税务事件季度报告', description: '本季度已实现损益、税务事件、未实现损益、税务计算', type: 'tax', period: 'Q2 2026', generatedAt: '2026-07-10 16:00:00', size: 2_640_000, pages: 56, format: 'xlsx', author: '王欣然', recipients: 12_486, status: 'ready', downloadUrl: '#', tags: ['季度', '税务'], statusColor: BRAND.success },
  { id: 'rpt-008', name: 'Fact Sheet 7 月', description: '本月各投顾业绩概览、AUM、订阅人数、关键指标', type: 'fact_sheet', period: '2026-07', generatedAt: '2026-07-20 06:00:00', size: 1_840_000, pages: 18, format: 'pdf', author: '孙明远', recipients: 86_284, status: 'ready', downloadUrl: '#', tags: ['月度', '概览'], statusColor: BRAND.success },
];

const FOLLOW_RECORDS: FollowRecord[] = [
  { id: 'flw-001', followerId: 'sub-001', followerName: 'investor_alpha', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', allocation: 8_400_000, copyMode: 'proportional', stopLoss: 0.10, takeProfit: 0.50, startedAt: '2024-02-12', pnl: 1_240_000, pnlPct: 14.8, trades: 286, status: 'running', statusColor: BRAND.success },
  { id: 'flw-002', followerId: 'sub-002', followerName: 'whale_2024', advisorId: 'adv-002', advisorName: '主动成长策略', allocation: 4_200_000, copyMode: 'proportional', stopLoss: 0.15, takeProfit: 0.80, startedAt: '2024-04-18', pnl: 686_000, pnlPct: 16.3, trades: 184, status: 'running', statusColor: BRAND.success },
  { id: 'flw-003', followerId: 'sub-003', followerName: 'crypto_lover_88', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', allocation: 285_000, copyMode: 'proportional', stopLoss: 0.08, takeProfit: 0.40, startedAt: '2024-08-12', pnl: 38_400, pnlPct: 13.5, trades: 142, status: 'running', statusColor: BRAND.success },
  { id: 'flw-004', followerId: 'sub-005', followerName: 'defi_maximalist', advisorId: 'adv-004', advisorName: 'DeFi 收益聚合', allocation: 186_000, copyMode: 'proportional', stopLoss: 0.20, takeProfit: 1.00, startedAt: '2024-06-24', pnl: -12_400, pnlPct: -6.7, trades: 96, status: 'paused', statusColor: '#FFA940' },
  { id: 'flw-005', followerId: 'sub-007', followerName: 'fund_manager_pro', advisorId: 'adv-002', advisorName: '主动成长策略', allocation: 18_400_000, copyMode: 'risk_matched', stopLoss: 0.12, takeProfit: 0.60, startedAt: '2023-08-12', pnl: 2_840_000, pnlPct: 15.4, trades: 426, status: 'running', statusColor: BRAND.success },
];

const RISK_ALERTS: RiskAlert[] = [
  { id: 'ral-001', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', type: 'drawdown', severity: 'medium', message: '组合近 7 日回撤 4.2%，接近 5% 预警阈值', metric: '7d_drawdown', value: -4.2, threshold: -5.0, triggeredAt: '2026-07-20 08:32:18', acknowledged: true, acknowledgedBy: '李文博', resolved: false, action: '已自动降低风险敞口 3%', statusColor: '#FFA940' },
  { id: 'ral-002', advisorId: 'adv-002', advisorName: '主动成长策略', type: 'concentration', severity: 'low', message: 'SOL 持仓占比达 18%，超出单资产 15% 上限', metric: 'single_asset_pct', value: 18.4, threshold: 15.0, triggeredAt: '2026-07-20 06:18:42', acknowledged: true, acknowledgedBy: '陈思源', resolved: true, action: '已部分止盈并分散至 12%', statusColor: BRAND.primary },
  { id: 'ral-003', advisorId: 'adv-004', advisorName: 'DeFi 收益聚合', type: 'leverage', severity: 'medium', message: 'Aave 借贷利用率达 88%，接近 92% 警戒线', metric: 'utilization', value: 88.4, threshold: 92.0, triggeredAt: '2026-07-20 10:42:18', acknowledged: false, acknowledgedBy: '', resolved: false, action: '监控中，准备减仓 5%', statusColor: '#FFA940' },
  { id: 'ral-004', advisorId: 'adv-001', advisorName: 'ZSDEX 智能平衡 Robo 投顾', type: 'volatility', severity: 'low', message: '组合 30 日波动率升至 14.6%，高于历史均值', metric: 'vol_30d', value: 14.6, threshold: 14.0, triggeredAt: '2026-07-19 18:24:18', acknowledged: true, acknowledgedBy: '王欣然', resolved: true, action: '正常范围，无需调整', statusColor: BRAND.info },
];

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

function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KB`;
  return `${n} B`;
}

function statusBadge(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: '运行中', color: BRAND.success, bg: 'rgba(14,203,129,0.12)' },
    paused: { label: '已暂停', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    beta: { label: 'Beta', color: BRAND.amber, bg: BRAND.amberLt },
    deprecated: { label: '已下线', color: BRAND.danger, bg: 'rgba(246,70,93,0.10)' },
    live: { label: '推送中', color: BRAND.success, bg: 'rgba(14,203,129,0.12)' },
    pending: { label: '待执行', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    closed: { label: '已平仓', color: BRAND.textMute, bg: 'rgba(112,112,112,0.08)' },
    expired: { label: '已过期', color: BRAND.textMute, bg: 'rgba(112,112,112,0.08)' },
    cancelled: { label: '已取消', color: BRAND.textMute, bg: 'rgba(112,112,112,0.08)' },
    completed: { label: '已完成', color: BRAND.success, bg: 'rgba(14,203,129,0.12)' },
    running: { label: '运行中', color: BRAND.primary, bg: 'rgba(20,184,129,0.12)' },
    failed: { label: '失败', color: BRAND.danger, bg: 'rgba(246,70,93,0.10)' },
    filled: { label: '已成交', color: BRAND.success, bg: 'rgba(14,203,129,0.12)' },
    partial: { label: '部分成交', color: BRAND.amber, bg: BRAND.amberLt },
    rejected: { label: '已拒绝', color: BRAND.danger, bg: 'rgba(246,70,93,0.10)' },
    ready: { label: '已就绪', color: BRAND.success, bg: 'rgba(14,203,129,0.12)' },
    generating: { label: '生成中', color: BRAND.amber, bg: BRAND.amberLt },
    scheduled: { label: '已计划', color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' },
    delivered: { label: '已交付', color: BRAND.primary, bg: 'rgba(20,184,129,0.12)' },
    churned: { label: '已流失', color: BRAND.textMute, bg: 'rgba(112,112,112,0.08)' },
    trial: { label: '试用中', color: BRAND.primary, bg: 'rgba(20,184,129,0.12)' },
    stopped: { label: '已停止', color: BRAND.textMute, bg: 'rgba(112,112,112,0.08)' },
    error: { label: '异常', color: BRAND.danger, bg: 'rgba(246,70,93,0.10)' },
  };
  return map[status] || { label: status, color: BRAND.textSub, bg: 'rgba(176,176,176,0.10)' };
}

function severityColor(s: string): string {
  const map: Record<string, string> = {
    low: BRAND.info,
    medium: BRAND.amber,
    high: BRAND.warning,
    critical: BRAND.danger,
  };
  return map[s] || BRAND.textSub;
}

const ADVISOR_TYPE_LABEL: Record<AdvisorType, string> = {
  robo: 'Robo 智能投顾', human: '人工投顾', hybrid: '混合投顾', index: '指数投顾', thematic: '主题投顾', esg: 'ESG 投顾',
};

// ============================================================
// 主组件
// ============================================================

export function PortalAdvisor() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AdvisorType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AdvisorStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('aum');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawerAdvisor, setDrawerAdvisor] = useState<Advisor | null>(null);
  const [drawerSignal, setDrawerSignal] = useState<Signal | null>(null);
  const [drawerBacktest, setDrawerBacktest] = useState<BacktestResult | null>(null);
  const [drawerSubscriber, setDrawerSubscriber] = useState<Subscriber | null>(null);
  const [drawerExecution, setDrawerExecution] = useState<Execution | null>(null);
  const [drawerReport, setDrawerReport] = useState<ReportAD | null>(null);
  const [drawerFollow, setDrawerFollow] = useState<FollowRecord | null>(null);
  const [drawerAllocation, setDrawerAllocation] = useState<Allocation | null>(null);
  const [drawerRisk, setDrawerRisk] = useState<RiskAlert | null>(null);
  const [drawerSubscribe, setDrawerSubscribe] = useState<Advisor | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const kpis = useMemo(() => {
    const totalAum = ADVISORS.reduce((s, a) => s + a.aum, 0);
    const totalSubs = ADVISORS.reduce((s, a) => s + a.subscribers, 0);
    const netFlow = ADVISORS.reduce((s, a) => s + a.netFlow7d, 0);
    const liveSignals = SIGNALS.filter((s) => s.status === 'live').length;
    return { totalAum, totalSubs, netFlow, liveSignals };
  }, []);

  const filtered = useMemo(() => {
    let arr = ADVISORS.slice();
    if (filterType !== 'all') arr = arr.filter((a) => a.type === filterType);
    if (filterStatus !== 'all') arr = arr.filter((a) => a.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
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
        const el = document.getElementById('advisor-search') as HTMLInputElement | null;
        el?.focus();
      }
      if (e.key === 'Escape') {
        setDrawerAdvisor(null);
        setDrawerSignal(null);
        setDrawerBacktest(null);
        setDrawerSubscriber(null);
        setDrawerExecution(null);
        setDrawerReport(null);
        setDrawerFollow(null);
        setDrawerAllocation(null);
        setDrawerRisk(null);
        setDrawerSubscribe(null);
        setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '总览', icon: <Gauge className="w-4 h-4" /> },
    { id: 'advisor', label: '投顾', icon: <Brain className="w-4 h-4" /> },
    { id: 'strategy', label: '策略', icon: <Target className="w-4 h-4" /> },
    { id: 'signal', label: '信号', icon: <Zap className="w-4 h-4" /> },
    { id: 'backtest', label: '回测', icon: <History className="w-4 h-4" /> },
    { id: 'allocation', label: '配置', icon: <PieChart className="w-4 h-4" /> },
    { id: 'follow', label: '跟单', icon: <Copy className="w-4 h-4" /> },
    { id: 'risk', label: '风险', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'execution', label: '执行', icon: <Activity className="w-4 h-4" /> },
    { id: 'subscriber', label: '订阅者', icon: <Users className="w-4 h-4" /> },
    { id: 'report', label: '报告', icon: <FileText className="w-4 h-4" /> },
    { id: 'help', label: '帮助', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const KpiCard = ({ label, value, change, icon, color }: { label: string; value: string; change?: number; icon: React.ReactNode; color: string }) => (
    <div className="rounded-xl p-4 border transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs" style={{ color: BRAND.textSub }}>{label}</div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color === BRAND.primary ? 'rgba(20,184,129,0.12)' : 'rgba(255,169,64,0.12)', color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: BRAND.text }}>{value}</div>
      {change !== undefined && (
        <div className="text-xs mt-1" style={{ color: change >= 0 ? BRAND.success : BRAND.danger }}>
          {formatPct(change)}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes advisor-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes advisor-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes advisor-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes advisor-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes advisor-bar { from { width: 0; } to { width: var(--bar-w, 100%); } }
        @keyframes advisor-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .advisor-stagger > * { animation: advisor-fade-in 0.4s ease both; }
        .advisor-stagger > *:nth-child(1) { animation-delay: 0.05s; }
        .advisor-stagger > *:nth-child(2) { animation-delay: 0.10s; }
        .advisor-stagger > *:nth-child(3) { animation-delay: 0.15s; }
        .advisor-stagger > *:nth-child(4) { animation-delay: 0.20s; }
        .advisor-stagger > *:nth-child(5) { animation-delay: 0.25s; }
        .advisor-stagger > *:nth-child(6) { animation-delay: 0.30s; }
        .advisor-stagger > *:nth-child(7) { animation-delay: 0.35s; }
        .advisor-stagger > *:nth-child(8) { animation-delay: 0.40s; }
        .advisor-stagger > *:nth-child(9) { animation-delay: 0.45s; }
        .advisor-stagger > *:nth-child(10) { animation-delay: 0.50s; }
        .advisor-stagger > *:nth-child(11) { animation-delay: 0.55s; }
        .advisor-stagger > *:nth-child(12) { animation-delay: 0.60s; }
        .advisor-pulse { animation: advisor-pulse 2s ease-in-out infinite; }
        .advisor-shimmer {
          background: linear-gradient(90deg, transparent, rgba(20,184,129,0.08), transparent);
          background-size: 200% 100%;
          animation: advisor-shimmer 2.5s linear infinite;
        }
        .advisor-slide-in { animation: advisor-slide-in 0.3s ease-out; }
        .advisor-bar { animation: advisor-bar 0.8s ease-out; }
        .advisor-float { animation: advisor-float 3s ease-in-out infinite; }
      `}</style>

      <section className="px-6 md:px-12 pt-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-sm px-2 py-0.5 rounded-md" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
              Q05 · P3.46
            </span>
            <span className="text-sm" style={{ color: BRAND.textSub }}>智能投顾与策略订阅中心</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>
            智能投顾与策略订阅中心
          </h1>
          <p className="text-base max-w-3xl mb-6" style={{ color: BRAND.textSub }}>
            覆盖 Robo 智能投顾 / 人工混合投顾 / 指数 / 主题 / ESG 五大投顾能力栈，
            提供策略订阅、信号分发、跟单配置、回测验证、风险监控、资产配置、执行记录、订阅者管理、定期报告全链路能力。
            与 P3.40 量化策略 + P3.45 资产组合 共同构成"策略-组合-投顾"AI 闭环。
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>
              历史业绩不预示未来表现
            </span>
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>
              投顾 / 策略 / 信号仅作技术能力演示
            </span>
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(176,176,176,0.10)', color: BRAND.textSub }}>
              非投资建议
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 advisor-stagger">
          <KpiCard label="在管资产 (AUM)" value={formatUsd(kpis.totalAum + tick * 100_000)} change={2.4} icon={<DollarSign className="w-4 h-4" />} color={BRAND.primary} />
          <KpiCard label="活跃订阅者" value={formatInt(kpis.totalSubs + tick * 2)} change={1.8} icon={<Users className="w-4 h-4" />} color={BRAND.primary} />
          <KpiCard label="7 日净流入" value={formatUsd(kpis.netFlow + tick * 10_000)} change={3.6} icon={<TrendingUp className="w-4 h-4" />} color={BRAND.success} />
          <KpiCard label="实时信号数" value={formatInt(kpis.liveSignals)} change={0.4} icon={<Zap className="w-4 h-4" />} color={BRAND.amber} />
        </div>
      </section>

      <section className="px-6 md:px-12 pb-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 border-b" style={{ borderColor: BRAND.border }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm flex items-center gap-2 transition-all"
              style={{
                color: tab === t.id ? BRAND.primary : BRAND.textSub,
                borderBottom: tab === t.id ? `2px solid ${BRAND.primary}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
            <input
              id="advisor-search"
              type="text"
              placeholder="搜索投顾 / 策略 / 信号 / 标签  (按 / 聚焦)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}>
            <option value="all">全部类型</option>
            <option value="robo">Robo 智能投顾</option>
            <option value="human">人工投顾</option>
            <option value="hybrid">混合投顾</option>
            <option value="index">指数投顾</option>
            <option value="thematic">主题投顾</option>
            <option value="esg">ESG 投顾</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}>
            <option value="all">全部状态</option>
            <option value="active">运行中</option>
            <option value="paused">已暂停</option>
            <option value="beta">Beta</option>
            <option value="deprecated">已下线</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}>
            <option value="aum">按 AUM 排序</option>
            <option value="subscribers">按订阅人数</option>
            <option value="ytdReturn">按 YTD 收益</option>
            <option value="sharpe">按 Sharpe</option>
            <option value="minInvestment">按起投金额</option>
            <option value="name">按名称</option>
          </select>
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 text-sm rounded-lg flex items-center gap-1" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}>
            {sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {sortDir === 'asc' ? '升序' : '降序'}
          </button>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && <OverviewTab onAdvisor={setDrawerAdvisor} onSignal={setDrawerSignal} onSubscribe={setDrawerSubscribe} />}
          {tab === 'advisor' && <AdvisorTab advisors={filtered} onSelect={setDrawerAdvisor} onSubscribe={setDrawerSubscribe} />}
          {tab === 'strategy' && <StrategyTab advisors={ADVISORS} onSelect={setDrawerAdvisor} />}
          {tab === 'signal' && <SignalTab signals={SIGNALS} onSelect={setDrawerSignal} />}
          {tab === 'backtest' && <BacktestTab results={BACKTEST_RESULTS} onSelect={setDrawerBacktest} />}
          {tab === 'allocation' && <AllocationTab allocations={ALLOCATIONS} onSelect={setDrawerAllocation} />}
          {tab === 'follow' && <FollowTab records={FOLLOW_RECORDS} onSelect={setDrawerFollow} />}
          {tab === 'risk' && <RiskTab alerts={RISK_ALERTS} onSelect={setDrawerRisk} />}
          {tab === 'execution' && <ExecutionTab executions={EXECUTIONS} onSelect={setDrawerExecution} />}
          {tab === 'subscriber' && <SubscriberTab subscribers={SUBSCRIBERS} onSelect={setDrawerSubscriber} />}
          {tab === 'report' && <ReportTab reports={REPORTS_AD} onSelect={setDrawerReport} />}
          {tab === 'help' && <HelpTab onOpen={() => setHelpOpen(true)} />}
        </div>
      </section>

      {drawerAdvisor && <AdvisorDrawer advisor={drawerAdvisor} onClose={() => setDrawerAdvisor(null)} onSubscribe={() => { setDrawerSubscribe(drawerAdvisor); setDrawerAdvisor(null); }} />}
      {drawerSignal && <SignalDrawer signal={drawerSignal} onClose={() => setDrawerSignal(null)} />}
      {drawerBacktest && <BacktestDrawer result={drawerBacktest} onClose={() => setDrawerBacktest(null)} />}
      {drawerSubscriber && <SubscriberDrawer subscriber={drawerSubscriber} onClose={() => setDrawerSubscriber(null)} />}
      {drawerExecution && <ExecutionDrawer execution={drawerExecution} onClose={() => setDrawerExecution(null)} />}
      {drawerReport && <ReportDrawer report={drawerReport} onClose={() => setDrawerReport(null)} />}
      {drawerFollow && <FollowDrawer record={drawerFollow} onClose={() => setDrawerFollow(null)} />}
      {drawerAllocation && <AllocationDrawer allocation={drawerAllocation} onClose={() => setDrawerAllocation(null)} />}
      {drawerRisk && <RiskDrawer alert={drawerRisk} onClose={() => setDrawerRisk(null)} />}
      {drawerSubscribe && <SubscribeDrawer advisor={drawerSubscribe} onClose={() => setDrawerSubscribe(null)} />}
      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

// ============================================================
// TAB 1: 总览
// ============================================================
function OverviewTab({ onAdvisor, onSignal, onSubscribe }: { onAdvisor: (a: Advisor) => void; onSignal: (s: Signal) => void; onSubscribe: (a: Advisor) => void }) {
  return (
    <div className="space-y-6 advisor-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center advisor-float" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND.text }}>AI 投顾 · 策略订阅 · 跟单 一体化平台</h3>
            <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>
              平台聚合 6 大投顾能力栈（Robo / 人工 / 混合 / 指数 / 主题 / ESG）、18+ 量化策略、5 个独立回测引擎、6 条信号分发通道、12 万+ 订阅用户、累计在管资产 49 亿美元。
              所有投顾 / 策略 / 信号均支持一键订阅、自动跟单、税务感知交易、风险监控。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[{ l: '投顾数', v: '6', c: BRAND.primary }, { l: '策略数', v: '85+', c: BRAND.success }, { l: '回测引擎', v: '5', c: BRAND.amber }, { l: '信号通道', v: '6', c: BRAND.info }].map((x, i) => (
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
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>推荐投顾</h3>
          <span className="text-xs" style={{ color: BRAND.textSub }}>基于您的风险偏好匹配</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADVISORS.slice(0, 3).map((a) => (
            <div key={a.id} onClick={() => onAdvisor(a)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: a.iconBg, color: a.iconColor }}>{a.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{a.name}</div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>{ADVISOR_TYPE_LABEL[a.type]}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(a.status).bg, color: statusBadge(a.status).color }}>{statusBadge(a.status).label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div style={{ color: BRAND.textSub }}>AUM</div><div className="font-medium" style={{ color: BRAND.text }}>{formatUsd(a.aum)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>YTD 收益</div><div className="font-medium" style={{ color: a.ytdReturn >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(a.ytdReturn)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>订阅者</div><div className="font-medium" style={{ color: BRAND.text }}>{formatInt(a.subscribers)}</div></div>
                <div><div style={{ color: BRAND.textSub }}>Sharpe</div><div className="font-medium" style={{ color: BRAND.text }}>{a.sharpe.toFixed(2)}</div></div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onSubscribe(a); }} className="w-full mt-3 py-1.5 text-xs rounded-md" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>一键订阅</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>实时信号流</h3>
          <span className="text-xs advisor-pulse" style={{ color: BRAND.success }}>● LIVE</span>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          {SIGNALS.slice(0, 4).map((s, i) => (
            <div key={s.id} onClick={() => onSignal(s)} className="flex items-center gap-3 p-3 cursor-pointer transition-all" style={{ borderTop: i > 0 ? `1px solid ${BRAND.border}` : 'none' }}>
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: s.type === 'buy' ? 'rgba(14,203,129,0.12)' : s.type === 'sell' ? 'rgba(246,70,93,0.10)' : 'rgba(255,169,64,0.12)' }}>
                {s.type === 'buy' ? <TrendingUp className="w-4 h-4" style={{ color: BRAND.success }} /> : s.type === 'sell' ? <TrendingDown className="w-4 h-4" style={{ color: BRAND.danger }} /> : <Bell className="w-4 h-4" style={{ color: BRAND.amber }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: BRAND.text }}>{s.name}</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>{s.advisorName} · {s.asset} · {s.publishedAt.split(' ')[1]}</div>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: BRAND.primary }}>置信 {s.confidence}%</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>{formatInt(s.followers)} 订阅</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4" style={{ color: BRAND.amber }} />
          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>智能投顾市场洞察</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs" style={{ color: BRAND.textSub }}>
          <div>· 全球智能投顾 AUM 已突破 2.4 万亿美元，年复合增速 28%</div>
          <div>· 加密资产 Robo 投顾渗透率从 2023 年 2.4% 升至 2026 年 14.8%</div>
          <div>· 跟随策略订阅用户平均胜率比自营用户高 14%，最大回撤低 22%</div>
          <div>· 多策略组合配置 vs 单策略配置，Sharpe 平均高 0.42</div>
          <div>· 自动再平衡 vs 手动再平衡，年化收益平均高 1.8%</div>
          <div>· 投顾 + 跟单 + 税务感知组合，比纯现货 + 持币策略多 4-8% 净收益</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 2: 投顾列表
// ============================================================
function AdvisorTab({ advisors, onSelect, onSubscribe }: { advisors: Advisor[]; onSelect: (a: Advisor) => void; onSubscribe: (a: Advisor) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 advisor-stagger">
      {advisors.map((a) => {
        const sb = statusBadge(a.status);
        return (
          <div key={a.id} className="rounded-xl p-5 border transition-all cursor-pointer" style={{ background: BRAND.bgCard, borderColor: BRAND.border }} onClick={() => onSelect(a)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl" style={{ background: a.iconBg, color: a.iconColor }}>{a.avatar}</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.name}</div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>{ADVISOR_TYPE_LABEL[a.type]}</div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
            </div>
            <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{a.description}</p>
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div><div style={{ color: BRAND.textSub }}>AUM</div><div className="font-semibold" style={{ color: BRAND.text }}>{formatUsd(a.aum)}</div></div>
              <div><div style={{ color: BRAND.textSub }}>订阅者</div><div className="font-semibold" style={{ color: BRAND.text }}>{formatInt(a.subscribers)}</div></div>
              <div><div style={{ color: BRAND.textSub }}>YTD</div><div className="font-semibold" style={{ color: a.ytdReturn >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(a.ytdReturn)}</div></div>
              <div><div style={{ color: BRAND.textSub }}>Sharpe</div><div className="font-semibold" style={{ color: BRAND.text }}>{a.sharpe.toFixed(2)}</div></div>
              <div><div style={{ color: BRAND.textSub }}>最大回撤</div><div className="font-semibold" style={{ color: BRAND.danger }}>{formatPct(a.maxDrawdown)}</div></div>
              <div><div style={{ color: BRAND.textSub }}>起投</div><div className="font-semibold" style={{ color: BRAND.text }}>${a.minInvestment.toLocaleString()}</div></div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {a.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{t}</span>
              ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); onSubscribe(a); }} className="w-full py-1.5 text-xs rounded-md" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>订阅 / 跟单</button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB 3: 策略
// ============================================================
function StrategyTab({ advisors, onSelect }: { advisors: Advisor[]; onSelect: (a: Advisor) => void }) {
  return (
    <div className="space-y-6 advisor-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5" style={{ color: BRAND.primary }} />
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>策略市场（85+ 策略）</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>
          平台聚合 8 大类核心策略、85+ 衍生策略、5 大回测引擎，支持策略筛选、对比、回测验证、一键跟单。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ l: '趋势跟踪', c: BRAND.primary, n: 12 }, { l: '均值回归', c: BRAND.success, n: 8 }, { l: '套利', c: BRAND.amber, n: 14 }, { l: 'DCA 定投', c: BRAND.info, n: 6 }, { l: '风险平价', c: '#B370FF', n: 5 }, { l: '多因子', c: '#FF85C0', n: 9 }, { l: 'AI 驱动', c: '#73D13D', n: 11 }, { l: '网格做市', c: '#FFC53D', n: 10 }].map((s, i) => (
            <div key={i} className="rounded-lg p-3 cursor-pointer transition-all" style={{ background: 'rgba(20,184,129,0.05)', border: `1px solid ${BRAND.border}` }}>
              <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{s.l}</div>
              <div className="text-xs" style={{ color: s.c }}>{s.n} 个策略</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>热门策略 TOP 8</h3>
        <div className="space-y-2">
          {[{ n: 'BTC 趋势跟踪 v4.0', pnl: 38.6, subs: 12842, sharpe: 1.42, dd: -24.8 }, { n: 'LRT 收益聚合 v2.4', pnl: 32.4, subs: 8642, sharpe: 2.12, dd: -8.2 }, { n: '多链多资产风险平价 v3.2', pnl: 28.4, subs: 18486, sharpe: 1.86, dd: -14.6 }, { n: 'AI 信号驱动多因子 v2.0', pnl: 26.8, subs: 4286, sharpe: 1.68, dd: -10.4 }, { n: '跨链套利 v1.8', pnl: 21.4, subs: 6842, sharpe: 2.84, dd: -4.2 }, { n: 'ETH LST 收益增强 v1.4', pnl: 18.2, subs: 4284, sharpe: 2.42, dd: -6.4 }, { n: 'RWA 短债收益 v1.2', pnl: 12.4, subs: 3284, sharpe: 3.24, dd: -2.4 }, { n: '稳定币理财 v2.0', pnl: 8.6, subs: 12486, sharpe: 4.84, dd: -1.2 }].map((s, i) => (
            <div key={i} onClick={() => onSelect(advisors[0])} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all" style={{ background: 'rgba(20,184,129,0.05)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: i < 3 ? BRAND.primary : BRAND.bgCardHover, color: i < 3 ? BRAND.onPrimary : BRAND.textSub }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: BRAND.text }}>{s.n}</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>订阅 {formatInt(s.subs)} · Sharpe {s.sharpe.toFixed(2)} · 最大回撤 {formatPct(s.dd)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold" style={{ color: BRAND.success }}>{formatPct(s.pnl)}</div>
                <div className="text-xs" style={{ color: BRAND.textSub }}>年化</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB 4: 信号
// ============================================================
function SignalTab({ signals, onSelect }: { signals: Signal[]; onSelect: (s: Signal) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5" style={{ color: BRAND.amber }} />
        <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>实时信号流</h3>
        <span className="text-xs advisor-pulse" style={{ color: BRAND.success }}>● LIVE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 advisor-stagger">
        {signals.map((s) => {
          const sb = statusBadge(s.status);
          return (
            <div key={s.id} onClick={() => onSelect(s)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: s.type === 'buy' ? 'rgba(14,203,129,0.12)' : s.type === 'sell' ? 'rgba(246,70,93,0.12)' : 'rgba(255,169,64,0.12)', color: s.type === 'buy' ? BRAND.success : s.type === 'sell' ? BRAND.danger : BRAND.amber }}>
                  {s.type === 'buy' ? '买入' : s.type === 'sell' ? '卖出' : s.type === 'rebalance' ? '再平衡' : '告警'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
                <span className="text-xs" style={{ color: BRAND.textSub }}>置信 {s.confidence}%</span>
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{s.name}</div>
              <p className="text-xs mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{s.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: BRAND.textSub }}>{s.advisorName} · {s.asset}</span>
                <span style={{ color: BRAND.primary }}>{formatInt(s.followers)} 跟单</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB 5: 回测
// ============================================================
function BacktestTab({ results, onSelect }: { results: BacktestResult[]; onSelect: (b: BacktestResult) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(20,184,129,0.05)' }}>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>策略名称</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>回测区间</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>总收益</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>年化</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>Sharpe</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>最大回撤</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>胜率</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>状态</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((b) => {
            const sb = statusBadge(b.status);
            return (
              <tr key={b.id} className="cursor-pointer transition-all" style={{ borderTop: `1px solid ${BRAND.border}` }} onClick={() => onSelect(b)}>
                <td className="p-3" style={{ color: BRAND.text }}>{b.strategyName}</td>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{b.period}</td>
                <td className="p-3 text-right font-medium" style={{ color: b.totalReturn >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(b.totalReturn)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{formatPct(b.annualizedReturn)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{b.sharpe.toFixed(2)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.danger }}>{formatPct(b.maxDrawdown)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{b.winRate.toFixed(1)}%</td>
                <td className="p-3 text-right"><span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span></td>
                <td className="p-3 text-right"><ChevronRight className="w-4 h-4 inline" style={{ color: BRAND.textMute }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 6: 配置
// ============================================================
function AllocationTab({ allocations, onSelect }: { allocations: Allocation[]; onSelect: (a: Allocation) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 advisor-stagger">
      {allocations.map((a) => (
        <div key={a.id} onClick={() => onSelect(a)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.category}</div>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: a.rebalanceAction === 'buy' ? 'rgba(14,203,129,0.12)' : a.rebalanceAction === 'sell' ? 'rgba(246,70,93,0.12)' : 'rgba(176,176,176,0.10)', color: a.rebalanceAction === 'buy' ? BRAND.success : a.rebalanceAction === 'sell' ? BRAND.danger : BRAND.textSub }}>
              {a.rebalanceAction === 'buy' ? '需加仓' : a.rebalanceAction === 'sell' ? '需减仓' : '保持'}
            </span>
          </div>
          <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{a.asset} · {a.chain}</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(176,176,176,0.10)' }}>
              <div className="h-full advisor-bar" style={{ width: `${Math.min(100, a.current * 2.5)}%`, background: a.drift > 0 ? BRAND.danger : a.drift < 0 ? BRAND.success : BRAND.primary }} />
            </div>
            <div className="text-xs" style={{ color: BRAND.text }}>{a.current}%</div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: BRAND.textSub }}>目标 {a.target}% · 偏离 {a.drift > 0 ? '+' : ''}{a.drift}%</span>
            <span style={{ color: a.expectedReturn >= 0 ? BRAND.success : BRAND.danger }}>预期 {formatPct(a.expectedReturn)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 7: 跟单
// ============================================================
function FollowTab({ records, onSelect }: { records: FollowRecord[]; onSelect: (f: FollowRecord) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(20,184,129,0.05)' }}>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>订阅者</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>跟单投顾</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>跟单金额</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>跟单模式</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>盈亏</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>盈亏 %</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>交易笔数</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>状态</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const sb = statusBadge(r.status);
            return (
              <tr key={r.id} className="cursor-pointer transition-all" style={{ borderTop: `1px solid ${BRAND.border}` }} onClick={() => onSelect(r)}>
                <td className="p-3" style={{ color: BRAND.text }}>{r.followerName}</td>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{r.advisorName}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{formatUsd(r.allocation)}</td>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{r.copyMode === 'proportional' ? '按比例' : r.copyMode === 'fixed' ? '固定金额' : r.copyMode === 'risk_matched' ? '风险匹配' : '反向'}</td>
                <td className="p-3 text-right font-medium" style={{ color: r.pnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(r.pnl)}</td>
                <td className="p-3 text-right" style={{ color: r.pnlPct >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(r.pnlPct)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{r.trades}</td>
                <td className="p-3 text-right"><span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span></td>
                <td className="p-3 text-right"><ChevronRight className="w-4 h-4 inline" style={{ color: BRAND.textMute }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 8: 风险
// ============================================================
function RiskTab({ alerts, onSelect }: { alerts: RiskAlert[]; onSelect: (r: RiskAlert) => void }) {
  return (
    <div className="space-y-2 advisor-stagger">
      {alerts.map((r) => {
        const sevColor = severityColor(r.severity);
        return (
          <div key={r.id} onClick={() => onSelect(r)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${sevColor}20`, color: sevColor }}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: `${sevColor}20`, color: sevColor }}>{r.severity === 'critical' ? '严重' : r.severity === 'high' ? '高' : r.severity === 'medium' ? '中' : '低'}</span>
                  <span className="text-sm font-medium" style={{ color: BRAND.text }}>{r.type === 'drawdown' ? '回撤预警' : r.type === 'concentration' ? '集中度预警' : r.type === 'leverage' ? '杠杆预警' : r.type === 'liquidity' ? '流动性预警' : r.type === 'correlation' ? '相关性预警' : r.type === 'compliance' ? '合规预警' : '波动率预警'}</span>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{r.advisorName}</span>
                </div>
                <p className="text-sm mb-2" style={{ color: BRAND.textSub }}>{r.message}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: BRAND.textSub }}>
                  <span>当前 {r.metric} = {r.value}</span>
                  <span>阈值 {r.threshold}</span>
                  <span>触发 {r.triggeredAt.split(' ')[1]}</span>
                  {r.acknowledged ? <span style={{ color: BRAND.success }}>已确认 · {r.acknowledgedBy}</span> : <span style={{ color: BRAND.warning }}>待确认</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: BRAND.textMute }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB 9: 执行
// ============================================================
function ExecutionTab({ executions, onSelect }: { executions: Execution[]; onSelect: (e: Execution) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(20,184,129,0.05)' }}>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>时间</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>投顾</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>资产</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>方向</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>数量</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>均价</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>金额</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>状态</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {executions.map((e) => {
            const sb = statusBadge(e.status);
            return (
              <tr key={e.id} className="cursor-pointer transition-all" style={{ borderTop: `1px solid ${BRAND.border}` }} onClick={() => onSelect(e)}>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{e.executedAt.split(' ')[1]}</td>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{e.advisorName}</td>
                <td className="p-3 font-medium" style={{ color: BRAND.text }}>{e.asset}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: e.side === 'buy' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)', color: e.side === 'buy' ? BRAND.success : BRAND.danger }}>
                    {e.side === 'buy' ? '买入' : '卖出'}
                  </span>
                </td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{formatInt(e.filled)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>${e.avgPrice.toFixed(e.avgPrice < 10 ? 4 : 2)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>${e.total.toLocaleString()}</td>
                <td className="p-3 text-right"><span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span></td>
                <td className="p-3 text-right"><ChevronRight className="w-4 h-4 inline" style={{ color: BRAND.textMute }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 10: 订阅者
// ============================================================
function SubscriberTab({ subscribers, onSelect }: { subscribers: Subscriber[]; onSelect: (s: Subscriber) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(20,184,129,0.05)' }}>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>用户</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>等级</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>投资额</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>盈亏</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>收益</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>跟单投顾</th>
            <th className="text-left p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>风险偏好</th>
            <th className="text-right p-3 text-xs font-medium" style={{ color: BRAND.textSub }}>状态</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((s) => {
            const sb = statusBadge(s.status);
            return (
              <tr key={s.id} className="cursor-pointer transition-all" style={{ borderTop: `1px solid ${BRAND.border}` }} onClick={() => onSelect(s)}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.avatar}</span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: BRAND.text }}>{s.username}</div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>{s.region}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>
                    {s.tier === 'institutional' ? '机构' : s.tier === 'vip' ? 'VIP' : s.tier === 'pro' ? 'Pro' : s.tier === 'basic' ? '基础' : '免费'}
                  </span>
                </td>
                <td className="p-3 text-right font-medium" style={{ color: BRAND.text }}>{formatUsd(s.invested)}</td>
                <td className="p-3 text-right font-medium" style={{ color: s.pnl >= 0 ? BRAND.success : BRAND.danger }}>{formatUsd(s.pnl)}</td>
                <td className="p-3 text-right" style={{ color: s.pnlPct >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(s.pnlPct)}</td>
                <td className="p-3 text-right" style={{ color: BRAND.text }}>{s.advisorsCount}</td>
                <td className="p-3 text-xs" style={{ color: BRAND.textSub }}>{s.riskProfile === 'conservative' ? '保守' : s.riskProfile === 'balanced' ? '平衡' : s.riskProfile === 'aggressive' ? '激进' : '投机'}</td>
                <td className="p-3 text-right"><span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span></td>
                <td className="p-3 text-right"><ChevronRight className="w-4 h-4 inline" style={{ color: BRAND.textMute }} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// TAB 11: 报告
// ============================================================
function ReportTab({ reports, onSelect }: { reports: ReportAD[]; onSelect: (r: ReportAD) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 advisor-stagger">
      {reports.map((r) => {
        const sb = statusBadge(r.status);
        return (
          <div key={r.id} onClick={() => onSelect(r)} className="rounded-xl p-4 border cursor-pointer transition-all" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-medium" style={{ color: BRAND.text }}>{r.name}</div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
            </div>
            <p className="text-xs mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{r.description}</p>
            <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textSub }}>
              <span>{r.period}</span><span>·</span>
              <span>{r.pages} 页</span><span>·</span>
              <span>{formatBytes(r.size)}</span><span>·</span>
              <span>{r.format.toUpperCase()}</span>
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
    <div className="space-y-4 advisor-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-5 h-5" style={{ color: BRAND.primary }} />
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>智能投顾与策略订阅 · 帮助中心</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>以下为常见问题解答、快捷键指南、合规说明与平台能力概览。</p>
        <button onClick={onOpen} className="px-4 py-2 rounded-md text-sm" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>打开完整帮助</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { q: '如何订阅一个投顾？', a: '点击任意投顾卡片的"订阅"按钮，配置起投金额、风险偏好、跟单模式后即可启用。订阅后自动跟单需在设置中开启。' },
          { q: '跟单模式有什么区别？', a: '按比例（按投顾仓位比例跟单）/ 固定金额（按固定金额分配）/ 风险匹配（按用户风险偏好缩放）/ 反向（反向跟单）。' },
          { q: '信号和投顾的关系？', a: '投顾运行多策略生成信号，信号经风控审核后推送至订阅者，支持自动 / 手动两种执行模式。' },
          { q: '回测数据可靠吗？', a: '回测基于 ZSDEX Quant Engine v3.2 + GLM-4V 模型，使用历史公开数据，按 0.05% 滑点 + 0.10% 手续费建模；历史业绩不预示未来表现。' },
          { q: '如何关闭自动再平衡？', a: '在"配置" Tab 中选择对应组合，点击"暂停再平衡"按钮，或在投顾详情中关闭自动再平衡开关。' },
          { q: '税务报告何时生成？', a: '系统每季度自动生成税务事件报告，用户可在"报告" Tab 下载；年度终了前会自动汇总全年报告。' },
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
              <kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>{x.k}</kbd>
              <span style={{ color: BRAND.textSub }}>{x.d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>合规说明</div>
        <ul className="text-xs space-y-1" style={{ color: BRAND.textSub }}>
          <li>· 平台所有投顾 / 策略 / 信号 / 回测数据仅作技术能力演示，不构成投资建议</li>
          <li>· 历史业绩基于内部估算口径，不预示未来表现</li>
          <li>· 投顾与策略订阅为辅助工具，不承诺收益 / 保本 / 刚兑 / 稳赚 / 担保</li>
          <li>· 投顾服务区域为合规研究方向示例，定性为研究 / 工具 / 辅助</li>
          <li>· 平台持续开展合规自查、KYT 筛查、KYC 更新、利益冲突检查</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// 通用 Drawer 容器（fixed 右侧滑入）
// ============================================================
function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ background: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold truncate" style={{ color: BRAND.text }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-1" style={{ color: BRAND.textSub }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} className="ml-3 p-2 rounded-lg hover:scale-110 transition-transform" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <X size={16} style={{ color: BRAND.textSub }} />
      </button>
    </div>
  );
}

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}></div>
      <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto advisor-slide-in" style={{ background: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
        {children}
      </div>
    </div>
  );
}

function DrawerKv({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] mb-1" style={{ color: BRAND.textSub }}>{label}</div>
      <div className="text-sm font-bold tabular-nums truncate" style={{ color: color || BRAND.text }}>{value}</div>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
      <h3 className="text-xs font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h3>
      {children}
    </div>
  );
}


function AdvisorDrawer({ advisor, onClose, onSubscribe }: { advisor: Advisor; onClose: () => void; onSubscribe?: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={advisor.name} subtitle={ADVISOR_TYPE_LABEL[advisor.type] + ' · ' + advisor.manager} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: advisor.iconBg, color: advisor.iconColor }}>{advisor.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{advisor.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{advisor.manager} · {advisor.managerTitle}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: statusBadge(advisor.status).bg, color: statusBadge(advisor.status).color }}>{statusBadge(advisor.status).label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>⭐ {advisor.rating.toFixed(1)} ({formatInt(advisor.reviews)})</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{advisor.region}</span>
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: BRAND.textSub }}>{advisor.description}</p>
        <div>
          <div className="text-[10px] font-semibold mb-1" style={{ color: BRAND.textSub }}>资质 / 认证</div>
          <div className="flex flex-wrap gap-1.5">
            {advisor.certifications.map((c, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{c}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold mb-1" style={{ color: BRAND.textSub }}>能力标签</div>
          <div className="flex flex-wrap gap-1.5">
            {advisor.tags.map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>#{t}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="AUM" value={formatUsd(advisor.aum)} color={BRAND.primary} />
          <DrawerKv label="订阅者" value={formatInt(advisor.subscribers)} />
          <DrawerKv label="7D 新增" value={'+' + formatInt(advisor.newSubs7d)} color={BRAND.success} />
          <DrawerKv label="7D 流出" value={formatInt(advisor.churn7d)} color={BRAND.danger} />
          <DrawerKv label="7D 净流入" value={formatUsd(advisor.netFlow7d)} color={advisor.netFlow7d >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="起投金额" value={formatUsd(advisor.minInvestment)} />
          <DrawerKv label="管理费" value={(advisor.managementFee * 100).toFixed(2) + '%'} />
          <DrawerKv label="业绩报酬" value={(advisor.performanceFee * 100).toFixed(2) + '%'} />
        </div>
        <DrawerSection title="业绩归因 · 风险调整">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>YTD:</span> <span style={{ color: advisor.ytdReturn >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(advisor.ytdReturn)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>1M:</span> <span style={{ color: advisor.return1m >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(advisor.return1m)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>3M:</span> <span style={{ color: advisor.return3m >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(advisor.return3m)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>12M:</span> <span style={{ color: advisor.return12m >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(advisor.return12m)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>成立以来:</span> <span style={{ color: advisor.returnSinceInception >= 0 ? BRAND.success : BRAND.danger }}>{formatPct(advisor.returnSinceInception)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>Sharpe:</span> <span style={{ color: BRAND.text }}>{advisor.sharpe.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>Sortino:</span> <span style={{ color: BRAND.text }}>{advisor.sortino.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>最大回撤:</span> <span style={{ color: BRAND.danger }}>{(advisor.maxDrawdown * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>波动率:</span> <span style={{ color: BRAND.text }}>{(advisor.volatility * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>Beta:</span> <span style={{ color: BRAND.text }}>{advisor.beta.toFixed(2)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>Alpha:</span> <span style={{ color: BRAND.success }}>{(advisor.alpha * 100).toFixed(2)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>胜率:</span> <span style={{ color: BRAND.text }}>{(advisor.winRate * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>平均持仓:</span> <span style={{ color: BRAND.text }}>{advisor.avgHoldDays} 天</span></div>
            <div><span style={{ color: BRAND.textSub }}>再平衡:</span> <span style={{ color: BRAND.text }}>{advisor.rebalanceFreq}</span></div>
            <div><span style={{ color: BRAND.textSub }}>基准:</span> <span style={{ color: BRAND.text }}>{advisor.benchmark}</span></div>
            <div><span style={{ color: BRAND.textSub }}>策略数:</span> <span style={{ color: BRAND.text }}>{advisor.strategyCount}</span></div>
            <div><span style={{ color: BRAND.textSub }}>组合数:</span> <span style={{ color: BRAND.text }}>{advisor.portfolioCount}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="亮点摘要">
          <ul className="space-y-1.5 text-[12px]" style={{ color: BRAND.textSub }}>
            {advisor.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 mt-1 shrink-0" style={{ color: BRAND.primary }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
        <div className="flex items-center gap-2 pt-2">
          <button onClick={() => onSubscribe ? onSubscribe() : null} className="flex-1 py-2.5 text-sm rounded-lg font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>一键订阅</button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg" style={{ background: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>关闭</button>
        </div>
        <p className="text-[10px]" style={{ color: BRAND.textMute }}>提示：历史业绩不预示未来表现，订阅前请阅读风险揭示。</p>
      </div>
    </DrawerShell>
  );
}


function SignalDrawer({ signal, onClose }: { signal: Signal; onClose: () => void }) {
  const typeColor = signal.type === 'buy' ? BRAND.success : signal.type === 'sell' ? BRAND.danger : BRAND.amber;
  const typeBg = signal.type === 'buy' ? 'rgba(14,203,129,0.12)' : signal.type === 'sell' ? 'rgba(246,70,93,0.10)' : 'rgba(255,169,64,0.12)';
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={signal.name} subtitle={signal.publishedAt + ' · ' + signal.advisorName} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: typeBg, color: typeColor }}>
            {signal.type === 'buy' ? <TrendingUp className="w-6 h-6" /> : signal.type === 'sell' ? <TrendingDown className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{signal.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{signal.asset} · 策略 {signal.strategyId}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: typeBg, color: typeColor }}>{signal.type.toUpperCase()}</span>
        </div>
        <p className="text-sm" style={{ color: BRAND.textSub }}>{signal.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="置信度" value={signal.confidence + '%'} color={BRAND.primary} />
          <DrawerKv label="强度" value={signal.strength.toFixed(2)} />
          <DrawerKv label="目标价" value={'$' + signal.targetPrice.toFixed(4)} color={BRAND.success} />
          <DrawerKv label="止损价" value={'$' + signal.stopLoss.toFixed(4)} color={BRAND.danger} />
          <DrawerKv label="订阅者" value={formatInt(signal.followers)} />
          <DrawerKv label="跟单执行" value={formatInt(signal.executions)} color={BRAND.success} />
          <DrawerKv label="胜率" value={(signal.winRate * 100).toFixed(1) + '%'} />
          <DrawerKv label="状态" value={statusBadge(signal.status).label} color={statusBadge(signal.status).color} />
        </div>
        <DrawerSection title="信号技术指标">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>信号通道:</span> <span style={{ color: BRAND.text }}>{signal.channel}</span></div>
            <div><span style={{ color: BRAND.textSub }}>信号类型:</span> <span style={{ color: BRAND.text }}>{signal.signalType}</span></div>
            <div><span style={{ color: BRAND.textSub }}>时间框架:</span> <span style={{ color: BRAND.text }}>{signal.timeframe}</span></div>
            <div><span style={{ color: BRAND.textSub }}>风险评分:</span> <span style={{ color: signal.riskScore >= 7 ? BRAND.danger : signal.riskScore >= 4 ? BRAND.amber : BRAND.success }}>{signal.riskScore}/10</span></div>
            <div><span style={{ color: BRAND.textSub }}>建议仓位:</span> <span style={{ color: BRAND.text }}>{(signal.suggestedSize * 100).toFixed(1)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>预计持仓:</span> <span style={{ color: BRAND.text }}>{signal.expectedHoldingDays} 天</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="触发原因 / 模型输入">
          <div className="space-y-1 text-[11px]" style={{ color: BRAND.textSub }}>
            {signal.triggers.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="数据 / 模型引用">
          <div className="space-y-1 text-[11px] font-mono" style={{ color: BRAND.textSub }}>
            {Object.entries(signal.dataSources).map(([k, v], i) => (
              <div key={i} className="flex items-center justify-between">
                <span>{k}</span>
                <span className="truncate ml-2" style={{ color: BRAND.text }}>{v}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


function BacktestDrawer({ result, onClose }: { result: BacktestResult; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={'回测 · ' + result.strategyName} subtitle={result.periodStart + ' ~ ' + result.periodEnd} onClose={onClose} />
      <div className="p-4 space-y-4">
        <p className="text-sm" style={{ color: BRAND.textSub }}>{result.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="总收益" value={formatPct(result.totalReturn)} color={result.totalReturn >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="年化" value={formatPct(result.annualized)} color={result.annualized >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="基准收益" value={formatPct(result.benchmark)} color={BRAND.textSub} />
          <DrawerKv label="Alpha" value={formatPct(result.alpha)} color={BRAND.success} />
          <DrawerKv label="Sharpe" value={result.sharpe.toFixed(2)} />
          <DrawerKv label="Sortino" value={result.sortino.toFixed(2)} />
          <DrawerKv label="最大回撤" value={formatPct(result.maxDrawdown)} color={BRAND.danger} />
          <DrawerKv label="波动率" value={formatPct(result.volatility)} />
          <DrawerKv label="胜率" value={(result.winRate * 100).toFixed(1) + '%'} />
          <DrawerKv label="盈亏比" value={result.profitLossRatio.toFixed(2)} />
          <DrawerKv label="总交易" value={formatInt(result.totalTrades)} />
          <DrawerKv label="持仓周期" value={result.avgHoldDays + ' 天'} />
        </div>
        <DrawerSection title="回测环境">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>初始资金:</span> <span style={{ color: BRAND.text }}>{formatUsd(result.initialCapital)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>最终资产:</span> <span style={{ color: BRAND.text }}>{formatUsd(result.finalEquity)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>滑点假设:</span> <span style={{ color: BRAND.text }}>{(result.slippage * 100).toFixed(3)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>手续费:</span> <span style={{ color: BRAND.text }}>{(result.feeRate * 100).toFixed(3)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>数据源:</span> <span style={{ color: BRAND.text }}>{result.dataSource}</span></div>
            <div><span style={{ color: BRAND.textSub }}>回测引擎:</span> <span style={{ color: BRAND.text }}>{result.engine}</span></div>
            <div><span style={{ color: BRAND.textSub }}>夏普 RF:</span> <span style={{ color: BRAND.text }}>{(result.riskFreeRate * 100).toFixed(2)}%</span></div>
            <div><span style={{ color: BRAND.textSub }}>基准:</span> <span style={{ color: BRAND.text }}>{result.benchmarkIndex}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="收益分布">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div><span style={{ color: BRAND.textSub }}>最大单日盈利:</span> <span style={{ color: BRAND.success }}>{formatPct(result.bestDay)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>最大单日亏损:</span> <span style={{ color: BRAND.danger }}>{formatPct(result.worstDay)}</span></div>
            <div><span style={{ color: BRAND.textSub }}>最长连盈:</span> <span style={{ color: BRAND.success }}>{result.maxConsecutiveWins} 次</span></div>
            <div><span style={{ color: BRAND.textSub }}>最长连亏:</span> <span style={{ color: BRAND.danger }}>{result.maxConsecutiveLosses} 次</span></div>
          </div>
        </DrawerSection>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,169,64,0.08)', border: '1px solid rgba(255,169,64,0.25)' }}>
          <div className="text-[11px] font-semibold mb-1" style={{ color: BRAND.amber }}>⚠ 回测局限性提示</div>
          <p className="text-[10px]" style={{ color: BRAND.textSub }}>回测基于历史公开数据 + 0.05% 滑点 + 0.10% 手续费建模；不包含极端行情、滑点扩大、流动性骤降等场景；历史业绩不预示未来表现。</p>
        </div>
      </div>
    </DrawerShell>
  );
}


function SubscriberDrawer({ subscriber, onClose }: { subscriber: Subscriber; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={subscriber.name} subtitle={subscriber.tier + ' · ' + subscriber.region} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: subscriber.iconBg, color: subscriber.iconColor }}>{subscriber.avatar}</div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{subscriber.name}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>UID {subscriber.uid} · 订阅 {subscriber.advisorCount} 个投顾</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: subscriber.tier === '钻石' ? 'rgba(20,184,129,0.15)' : BRAND.bgCardHover, color: subscriber.tier === '钻石' ? BRAND.primary : BRAND.textSub }}>{subscriber.tier}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="AUM" value={formatUsd(subscriber.aum)} color={BRAND.primary} />
          <DrawerKv label="累计收益" value={formatUsd(subscriber.totalPnl)} color={subscriber.totalPnl >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="收益贡献" value={formatPct(subscriber.pnlContrib)} color={BRAND.success} />
          <DrawerKv label="跟单次数" value={formatInt(subscriber.followCount)} />
          <DrawerKv label="执行率" value={(subscriber.executionRate * 100).toFixed(1) + '%'} />
          <DrawerKv label="胜率" value={(subscriber.winRate * 100).toFixed(1) + '%'} />
          <DrawerKv label="最大回撤" value={formatPct(subscriber.maxDrawdown)} color={BRAND.danger} />
          <DrawerKv label="风险偏好" value={subscriber.riskPreference} />
        </div>
        <DrawerSection title="订阅的投顾">
          <div className="space-y-1.5 text-[12px]">
            {subscriber.advisors.map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: BRAND.text }}>{a}</span>
                <span className="text-[10px]" style={{ color: BRAND.textSub }}>订阅中</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="偏好 / 标签">
          <div className="flex flex-wrap gap-1.5">
            {subscriber.preferences.map((p, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{p}</span>
            ))}
          </div>
        </DrawerSection>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span style={{ color: BRAND.textSub }}>注册时间:</span> <span style={{ color: BRAND.text }}>{subscriber.joinedAt}</span></div>
          <div><span style={{ color: BRAND.textSub }}>最后活跃:</span> <span style={{ color: BRAND.text }}>{subscriber.lastActive}</span></div>
          <div><span style={{ color: BRAND.textSub }}>KYC 等级:</span> <span style={{ color: BRAND.text }}>{subscriber.kycLevel}</span></div>
          <div><span style={{ color: BRAND.textSub }}>渠道:</span> <span style={{ color: BRAND.text }}>{subscriber.channel}</span></div>
        </div>
      </div>
    </DrawerShell>
  );
}


function ExecutionDrawer({ execution, onClose }: { execution: Execution; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={execution.id} subtitle={execution.advisorName + ' · ' + execution.asset} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: execution.side === 'buy' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.10)', color: execution.side === 'buy' ? BRAND.success : BRAND.danger }}>
            {execution.side === 'buy' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{execution.side.toUpperCase()} {execution.amount} {execution.asset}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>@{execution.price} · 成交时间 {execution.executedAt}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(execution.status).bg, color: statusBadge(execution.status).color }}>{statusBadge(execution.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="成交价" value={'$' + execution.price.toFixed(4)} />
          <DrawerKv label="数量" value={execution.amount.toString()} />
          <DrawerKv label="成交额" value={formatUsd(execution.value)} color={BRAND.primary} />
          <DrawerKv label="手续费" value={formatUsd(execution.fee)} color={BRAND.amber} />
          <DrawerKv label="滑点" value={formatPct(execution.slippage)} color={BRAND.danger} />
          <DrawerKv label="Gas" value={formatUsd(execution.gas)} />
          <DrawerKv label="信号 ID" value={execution.signalId} color={BRAND.textSub} />
          <DrawerKv label="执行模式" value={execution.mode} />
        </div>
        <DrawerSection title="执行链路">
          <div className="space-y-1.5 text-[11px] font-mono" style={{ color: BRAND.textSub }}>
            <div className="flex justify-between"><span>信号发布</span><span style={{ color: BRAND.text }}>{execution.signalPublishedAt}</span></div>
            <div className="flex justify-between"><span>风控审核</span><span style={{ color: BRAND.text }}>{execution.riskCheckAt}</span></div>
            <div className="flex justify-between"><span>订单创建</span><span style={{ color: BRAND.text }}>{execution.orderCreatedAt}</span></div>
            <div className="flex justify-between"><span>链上确认</span><span style={{ color: BRAND.text }}>{execution.confirmedAt}</span></div>
            <div className="flex justify-between"><span>链</span><span style={{ color: BRAND.text }}>{execution.chain}</span></div>
            <div className="flex justify-between"><span>DEX</span><span style={{ color: BRAND.text }}>{execution.dex}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="Tx Hash">
          <div className="font-mono text-[10px] break-all" style={{ color: BRAND.text }}>{execution.txHash}</div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


function ReportDrawer({ report, onClose }: { report: ReportAD; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={report.title} subtitle={report.type + ' · ' + report.period} onClose={onClose} />
      <div className="p-4 space-y-4">
        <p className="text-sm" style={{ color: BRAND.textSub }}>{report.summary}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="覆盖投顾" value={formatInt(report.advisorCount)} />
          <DrawerKv label="策略数" value={formatInt(report.strategyCount)} />
          <DrawerKv label="净收益" value={formatUsd(report.netPnl)} color={report.netPnl >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="胜率" value={(report.winRate * 100).toFixed(1) + '%'} />
          <DrawerKv label="AUM 增长" value={formatUsd(report.aumGrowth)} color={BRAND.success} />
          <DrawerKv label="订阅增长" value={'+' + formatInt(report.subscriberGrowth)} color={BRAND.success} />
          <DrawerKv label="页数" value={String(report.pages)} />
          <DrawerKv label="数据点" value={formatInt(report.dataPoints)} />
        </div>
        <DrawerSection title="Top 3 投顾">
          <ul className="space-y-1.5 text-[12px]" style={{ color: BRAND.text }}>
            {report.topAdvisors.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <Trophy className="w-3 h-3" style={{ color: BRAND.primary }} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
        <DrawerSection title="报告章节">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
            {report.sections.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <FileText className="w-3 h-3" style={{ color: BRAND.textSub }} />
                <span style={{ color: BRAND.textSub }}>{s}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span style={{ color: BRAND.textSub }}>发布时间:</span> <span style={{ color: BRAND.text }}>{report.publishedAt}</span></div>
          <div><span style={{ color: BRAND.textSub }}>生成耗时:</span> <span style={{ color: BRAND.text }}>{report.generationMs} ms</span></div>
        </div>
        <button className="w-full py-2.5 text-sm rounded-lg font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>下载报告 PDF</button>
      </div>
    </DrawerShell>
  );
}


function FollowDrawer({ record, onClose }: { record: FollowRecord; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={record.id} subtitle={record.advisorName + ' · ' + record.subscriber} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: record.mode === 'auto' ? 'rgba(20,184,129,0.12)' : 'rgba(68,219,244,0.12)', color: record.mode === 'auto' ? BRAND.primary : BRAND.info }}>
            {record.mode === 'auto' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>跟单记录</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>模式 {record.modeLabel} · 风险匹配 {record.riskMatch}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: statusBadge(record.status).bg, color: statusBadge(record.status).color }}>{statusBadge(record.status).label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="跟单金额" value={formatUsd(record.followAmount)} color={BRAND.primary} />
          <DrawerKv label="当前市值" value={formatUsd(record.currentValue)} />
          <DrawerKv label="浮动盈亏" value={formatUsd(record.pnl)} color={record.pnl >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="收益率" value={formatPct(record.pnlPct)} color={record.pnlPct >= 0 ? BRAND.success : BRAND.danger} />
          <DrawerKv label="信号 ID" value={record.signalId} color={BRAND.textSub} />
          <DrawerKv label="资产" value={record.asset} />
          <DrawerKv label="开始时间" value={record.startAt} />
          <DrawerKv label="耗时" value={record.duration} />
        </div>
        <DrawerSection title="跟单执行明细">
          <div className="space-y-1 text-[11px]" style={{ color: BRAND.textSub }}>
            <div className="flex justify-between"><span>跟单倍率:</span><span style={{ color: BRAND.text }}>{record.scale.toFixed(2)}x</span></div>
            <div className="flex justify-between"><span>实际仓位:</span><span style={{ color: BRAND.text }}>{(record.actualSize * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between"><span>滑点:</span><span style={{ color: BRAND.danger }}>{formatPct(record.slippage)}</span></div>
            <div className="flex justify-between"><span>手续费:</span><span style={{ color: BRAND.amber }}>{formatUsd(record.fee)}</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


function AllocationDrawer({ allocation, onClose }: { allocation: Allocation; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={allocation.advisorName + ' · 配置方案'} subtitle={allocation.riskLevel + ' · 目标年化 ' + formatPct(allocation.targetReturn)} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="AUM" value={formatUsd(allocation.totalAum)} color={BRAND.primary} />
          <DrawerKv label="预期年化" value={formatPct(allocation.expectedReturn)} color={BRAND.success} />
          <DrawerKv label="预期波动" value={formatPct(allocation.expectedVol)} />
          <DrawerKv label="再平衡" value={allocation.rebalanceFreq} />
        </div>
        <DrawerSection title="资产配置">
          <div className="space-y-2">
            {allocation.assets.map((a, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span style={{ color: BRAND.text }}>{a.symbol} · {a.name}</span>
                  <span style={{ color: BRAND.primary }}>{(a.weight * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
                  <div className="h-full rounded-full" style={{ width: (a.weight * 100) + '%', background: BRAND.primary }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] mt-0.5" style={{ color: BRAND.textMute }}>
                  <span>{a.category} · {a.chain}</span>
                  <span>预期 {formatPct(a.expectedReturn)}</span>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="策略分布">
          <div className="space-y-1 text-[12px]">
            {allocation.strategies.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: BRAND.text }}>{s.name}</span>
                <span style={{ color: BRAND.primary }}>{(s.weight * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="风险预算">
          <div className="space-y-1 text-[11px]" style={{ color: BRAND.textSub }}>
            <div className="flex justify-between"><span>VaR 95%:</span><span style={{ color: BRAND.danger }}>{formatPct(allocation.var95)}</span></div>
            <div className="flex justify-between"><span>CVaR 95%:</span><span style={{ color: BRAND.danger }}>{formatPct(allocation.cvar95)}</span></div>
            <div className="flex justify-between"><span>最大回撤预算:</span><span style={{ color: BRAND.danger }}>{formatPct(allocation.maxDrawdownBudget)}</span></div>
            <div className="flex justify-between"><span>Beta 预算:</span><span style={{ color: BRAND.text }}>{allocation.betaBudget.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>集中度上限:</span><span style={{ color: BRAND.text }}>{(allocation.concentrationLimit * 100).toFixed(0)}%</span></div>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


function RiskDrawer({ alert, onClose }: { alert: RiskAlert; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={alert.title} subtitle={alert.advisorName + ' · ' + alert.detectedAt} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: severityColor(alert.severity).bg, color: severityColor(alert.severity).color }}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{alert.title}</div>
            <div className="text-xs" style={{ color: BRAND.textSub }}>{alert.category} · {alert.riskType}</div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: severityColor(alert.severity).bg, color: severityColor(alert.severity).color }}>{alert.severity.toUpperCase()}</span>
        </div>
        <p className="text-sm" style={{ color: BRAND.textSub }}>{alert.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DrawerKv label="影响 AUM" value={formatUsd(alert.impactAum)} color={BRAND.primary} />
          <DrawerKv label="影响用户" value={formatInt(alert.affectedUsers)} color={BRAND.amber} />
          <DrawerKv label="预估损失" value={formatUsd(alert.estimatedLoss)} color={BRAND.danger} />
          <DrawerKv label="风险评分" value={alert.riskScore + '/100'} color={severityColor(alert.severity).color} />
          <DrawerKv label="状态" value={statusBadge(alert.status).label} color={statusBadge(alert.status).color} />
          <DrawerKv label="检测时间" value={alert.detectedAt} />
          <DrawerKv label="响应时间" value={alert.responseMs + ' ms'} />
          <DrawerKv label="处置人" value={alert.assignee} />
        </div>
        <DrawerSection title="风险来源">
          <ul className="space-y-1 text-[11px]" style={{ color: BRAND.textSub }}>
            {alert.sources.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.amber }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
        <DrawerSection title="建议处置">
          <ul className="space-y-1 text-[11px]" style={{ color: BRAND.textSub }}>
            {alert.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.success }} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>
        <div className="rounded-xl p-3" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
          <div className="text-[10px] font-semibold mb-1" style={{ color: BRAND.textSub }}>监控指标</div>
          <div className="space-y-1 text-[11px]">
            {Object.entries(alert.metrics).map(([k, v], i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: BRAND.textSub }}>{k}</span>
                <span style={{ color: BRAND.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}


function SubscribeDrawer({ advisor, onClose }: { advisor: Advisor; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={'订阅 · ' + advisor.name} subtitle={ADVISOR_TYPE_LABEL[advisor.type]} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background: 'rgba(20,184,129,0.05)', border: '1px solid ' + BRAND.border }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: advisor.iconBg, color: advisor.iconColor }}>{advisor.avatar}</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{advisor.name}</div>
              <div className="text-xs" style={{ color: BRAND.textSub }}>AUM {formatUsd(advisor.aum)} · 订阅者 {formatInt(advisor.subscribers)}</div>
            </div>
          </div>
        </div>
        <DrawerSection title="订阅设置">
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>起投金额</span><span style={{ color: BRAND.text }}>{formatUsd(advisor.minInvestment)}</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>管理费</span><span style={{ color: BRAND.text }}>{(advisor.managementFee * 100).toFixed(2)}% / 年</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>业绩报酬</span><span style={{ color: BRAND.text }}>{(advisor.performanceFee * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>再平衡频率</span><span style={{ color: BRAND.text }}>{advisor.rebalanceFreq}</span></div>
            <div className="flex justify-between"><span style={{ color: BRAND.textSub }}>默认风险</span><span style={{ color: BRAND.text }}>{advisor.riskProfile}</span></div>
          </div>
        </DrawerSection>
        <DrawerSection title="跟单模式">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg p-2 cursor-pointer" style={{ background: 'rgba(20,184,129,0.10)', border: '1px solid ' + BRAND.primary, color: BRAND.text }}>按比例</div>
            <div className="rounded-lg p-2 cursor-pointer" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>固定金额</div>
            <div className="rounded-lg p-2 cursor-pointer" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>风险匹配</div>
            <div className="rounded-lg p-2 cursor-pointer" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>反向跟单</div>
          </div>
        </DrawerSection>
        <DrawerSection title="风险提示">
          <p className="text-[11px]" style={{ color: BRAND.textSub }}>智能投顾与策略订阅为辅助工具，不构成投资建议。历史业绩不预示未来表现，订阅前请阅读风险揭示书并评估自身风险承受能力。</p>
        </DrawerSection>
        <div className="flex items-center gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-lg font-semibold" style={{ background: BRAND.primary, color: BRAND.onPrimary }}>确认订阅</button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg" style={{ background: BRAND.bgCard, color: BRAND.text, border: '1px solid ' + BRAND.border }}>取消</button>
        </div>
      </div>
    </DrawerShell>
  );
}


function HelpDrawer({ onClose }: { onClose: () => void }) {
  const faq = [
    { q: '如何订阅一个投顾？', a: '点击任意投顾卡片的"订阅"按钮，配置起投金额、风险偏好、跟单模式后即可启用。订阅后自动跟单需在设置中开启。' },
    { q: '跟单模式有什么区别？', a: '按比例（按投顾仓位比例跟单）/ 固定金额（按固定金额分配）/ 风险匹配（按用户风险偏好缩放）/ 反向（反向跟单）。' },
    { q: '信号和投顾的关系？', a: '投顾运行多策略生成信号，信号经风控审核后推送至订阅者，支持自动 / 手动两种执行模式。' },
    { q: '回测数据可靠吗？', a: '回测基于 ZSDEX Quant Engine v3.2 + GLM-4V 模型，使用历史公开数据，按 0.05% 滑点 + 0.10% 手续费建模；历史业绩不预示未来表现。' },
    { q: '如何关闭自动再平衡？', a: '在"配置" Tab 中选择对应组合，点击"暂停再平衡"按钮，或在投顾详情中关闭自动再平衡开关。' },
    { q: '税务报告何时生成？', a: '系统每季度自动生成税务事件报告，用户可在"报告" Tab 下载；年度终了前会自动汇总全年报告。' },
    { q: '如何选择合适的投顾？', a: '根据自身风险偏好（A 保守 / B 稳健 / C 平衡 / D 进取 / E 激进）+ 投资目标（保值 / 增值 / 高弹性）+ 投资期限（短期 / 中期 / 长期）综合判断。' },
    { q: '订阅后可以随时取消吗？', a: '可以，在投顾详情页"取消订阅"即可。已产生的管理费按实际持有天数计算，业绩报酬按已实现部分计提。' },
  ];
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title="智能投顾与策略订阅 · 帮助中心" subtitle="常见问题 / 快捷键 / 合规说明" onClose={onClose} />
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
            <li>· 平台所有投顾 / 策略 / 信号 / 回测数据仅作技术能力演示，不构成投资建议</li>
            <li>· 历史业绩基于内部模型计算，不预示未来表现</li>
            <li>· 投顾与策略订阅为辅助工具，不承诺收益 / 保本 / 刚兑 / 稳赚 / 担保</li>
            <li>· 投顾服务区域为合规研究方向示例，定性为研究 / 工具 / 辅助</li>
            <li>· 平台持续开展合规自查、KYB 尽调、KYC 更新、利用冲突检查</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


function KpiCard({ label, value, icon, idx, positive }: { label: string; value: string; icon: React.ReactNode; idx: number; positive?: boolean }) {
  const color = positive === true ? BRAND.success : positive === false ? BRAND.danger : BRAND.primary;
  return (
    <div className={`p-3 rounded-xl advisor-stagger advisor-stagger-${idx} hover:scale-105 transition-transform cursor-pointer`} style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div style={{ color }}>{icon}</div>
        <div className="text-[10px]" style={{ color: BRAND.textSub }}>{label}</div>
      </div>
      <div className="text-base font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}


