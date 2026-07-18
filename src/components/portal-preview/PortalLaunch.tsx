'use client';

/**
 * PortalLaunch - Launchpad 页面（2026-07-19 Q05 P3.7）
 *
 * 页面定位：
 * - 中萨数字科技交易所新币发行 Launchpad 入口
 * - 6 大子模块：进行中项目 / 即将开始 / 已结束回顾 / 申购规则 / FAQ / 项目方入驻
 * - 实时申购进度 + 倒计时 + 阶梯额度（KYC 等级）+ 收益倍数展示
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / 进行中 / 即将开始 / 已结束 / 规则 / FAQ / 入驻）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键 / 切换状态）
 * - 1+ Drawer（项目详情 / 申购流程 / 规则详情）
 * - 1+ 实时数据波动（申购进度 ticker 2-5s 漂移 + 倒计时秒级）
 * - 3+ 动画（Stagger / CountUp / Hover / 进度条增长）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，申购进度 / 收益倍数 / 倒计时使用 mock 占位
 * - 状态徽章统一枚举：OPEN / BETA / SOON / MAINTENANCE / ENDED
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - v6 纯黑无色相 + ZSDEX 绿 primary #14B881
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Rocket,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Filter,
  Layers,
  CircleDot,
  CircleDashed,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Star,
  Zap,
  Users,
  Percent,
  Activity,
  Calendar,
  Award,
  HelpCircle,
  BookOpen,
  Network,
  Eye,
  EyeOff,
  Coins,
  ArrowRight,
  Keyboard,
  RefreshCw,
  Send,
  Globe2,
  Briefcase,
  Info,
  Lightbulb,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type ProjectStatus = 'OPEN' | 'SOON' | 'UPCOMING' | 'ENDED' | 'BETA';
type SortKey = 'progress' | 'allocation' | 'apy' | 'startTime' | 'subscribers';
type SortDir = 'asc' | 'desc';
type TabKey = 'live' | 'upcoming' | 'ended' | 'all';

interface Project {
  id: string;
  name: string;
  ticker: string;
  category: 'Layer1' | 'Layer2' | 'DeFi' | 'AI' | 'GameFi' | 'Infrastructure' | 'SocialFi';
  status: ProjectStatus;
  startTime: number; // ms epoch
  endTime: number; // ms epoch
  totalRaise: number; // USDT
  totalSubscribed: number; // USDT
  maxPerUser: number; // USDT
  minPerUser: number; // USDT
  tokenPrice: number; // USDT per token
  fdv: number; // fully diluted valuation
  vestingMonths: number;
  immediateUnlockPct: number;
  chain: 'Conflux Core' | 'ERC20' | 'BSC' | 'Solana';
  kycLevel: 'basic' | 'full' | 'institution';
  subscribers: number;
  description: string;
  highlights: string[];
  apy?: number; // 预期收益倍数
  finalReturn?: number; // 已结束项目实际收益
  allocationPct?: number; // 实际中签率
}

interface Rule {
  level: string;
  icon: React.ElementType;
  minKyc: string;
  maxAllocation: string;
  features: string[];
  status: 'OPEN' | 'BETA' | 'SOON';
  color: string;
}

interface FaqItem {
  q: string;
  a: string;
  category: '流程' | '额度' | '解锁' | '风险';
}

// ============== Mock 数据 ==============

const NOW = Date.now();
const HOUR = 3600_000;
const DAY = 24 * HOUR;

const PROJECTS: Project[] = [
  // ===== 进行中 =====
  {
    id: 'proj-nebula',
    name: 'Nebula Protocol',
    ticker: 'NEBU',
    category: 'DeFi',
    status: 'OPEN',
    startTime: NOW - 2 * HOUR,
    endTime: NOW + 2 * HOUR,
    totalRaise: 2_000_000,
    totalSubscribed: 1_285_400,
    maxPerUser: 5000,
    minPerUser: 100,
    tokenPrice: 0.025,
    fdv: 25_000_000,
    vestingMonths: 12,
    immediateUnlockPct: 20,
    chain: 'Conflux Core',
    kycLevel: 'basic',
    subscribers: 4521,
    description: '去中心化衍生品协议，提供亚毫秒级永续合约撮合，AI 驱动的清算引擎与零滑点深度。',
    highlights: ['AI 清算引擎', '亚毫秒撮合', '零滑点深度', 'Conflux Core 生态'],
    apy: 4.5,
  },
  {
    id: 'proj-treeai',
    name: 'TreeGraph AI',
    ticker: 'TAI',
    category: 'AI',
    status: 'OPEN',
    startTime: NOW - 4 * HOUR,
    endTime: NOW + 6 * HOUR,
    totalRaise: 5_000_000,
    totalSubscribed: 2_834_500,
    maxPerUser: 10000,
    minPerUser: 200,
    tokenPrice: 0.085,
    fdv: 85_000_000,
    vestingMonths: 18,
    immediateUnlockPct: 10,
    chain: 'Conflux Core',
    kycLevel: 'full',
    subscribers: 12834,
    description: '树图公链原生 AI 推理网络，支持链上 AI 智能体协作与训练数据确权。',
    highlights: ['链上 AI 推理', '智能体协作', '数据确权', '树图原生'],
    apy: 6.2,
  },

  // ===== 即将开始 =====
  {
    id: 'proj-zlink',
    name: 'Z-Link Layer',
    ticker: 'ZLK',
    category: 'Layer2',
    status: 'SOON',
    startTime: NOW + 2 * DAY,
    endTime: NOW + 4 * DAY,
    totalRaise: 3_500_000,
    totalSubscribed: 0,
    maxPerUser: 3000,
    minPerUser: 50,
    tokenPrice: 0.045,
    fdv: 45_000_000,
    vestingMonths: 9,
    immediateUnlockPct: 30,
    chain: 'ERC20',
    kycLevel: 'basic',
    subscribers: 0,
    description: '基于零知识证明的跨链互操作协议，支持异构链资产与消息的秒级跨链。',
    highlights: ['ZK 跨链', '异构互操作', '秒级到账', 'EVM 兼容'],
    apy: 3.8,
  },
  {
    id: 'proj-quantum',
    name: 'Quantum Bridge',
    ticker: 'QBM',
    category: 'Infrastructure',
    status: 'UPCOMING',
    startTime: NOW + 5 * DAY,
    endTime: NOW + 7 * DAY,
    totalRaise: 8_000_000,
    totalSubscribed: 0,
    maxPerUser: 20000,
    minPerUser: 500,
    tokenPrice: 0.18,
    fdv: 180_000_000,
    vestingMonths: 24,
    immediateUnlockPct: 5,
    chain: 'Solana',
    kycLevel: 'full',
    subscribers: 0,
    description: '抗量子加密跨链桥，融合 NIST 后量子算法与阈值签名，面向机构级资产转移。',
    highlights: ['后量子加密', '机构级', '阈值签名', '多签共识'],
    apy: 5.2,
  },
  {
    id: 'proj-aether',
    name: 'Aether Game',
    ticker: 'AETH',
    category: 'GameFi',
    status: 'UPCOMING',
    startTime: NOW + 10 * DAY,
    endTime: NOW + 12 * DAY,
    totalRaise: 1_500_000,
    totalSubscribed: 0,
    maxPerUser: 2000,
    minPerUser: 30,
    tokenPrice: 0.012,
    fdv: 12_000_000,
    vestingMonths: 6,
    immediateUnlockPct: 40,
    chain: 'BSC',
    kycLevel: 'basic',
    subscribers: 0,
    description: 'AAA 级链上开放世界游戏，Play-to-Own 经济模型与跨游戏资产互通。',
    highlights: ['Play-to-Own', 'AAA 画质', '跨游戏资产', '电竞生态'],
    apy: 8.5,
  },

  // ===== 已结束 =====
  {
    id: 'proj-ocean',
    name: 'Ocean DeFi',
    ticker: 'OCN',
    category: 'DeFi',
    status: 'ENDED',
    startTime: NOW - 30 * DAY,
    endTime: NOW - 25 * DAY,
    totalRaise: 3_000_000,
    totalSubscribed: 3_000_000,
    maxPerUser: 5000,
    minPerUser: 100,
    tokenPrice: 0.04,
    fdv: 40_000_000,
    vestingMonths: 12,
    immediateUnlockPct: 20,
    chain: 'Conflux Core',
    kycLevel: 'basic',
    subscribers: 8412,
    description: '海洋主题收益聚合协议，整合多链流动性挖矿与自动复利策略。',
    highlights: ['多链挖矿', '自动复利', '收益聚合'],
    finalReturn: 3.2,
    allocationPct: 18,
  },
  {
    id: 'proj-matrix',
    name: 'Matrix Security',
    ticker: 'MTS',
    category: 'Infrastructure',
    status: 'ENDED',
    startTime: NOW - 60 * DAY,
    endTime: NOW - 55 * DAY,
    totalRaise: 5_000_000,
    totalSubscribed: 5_000_000,
    maxPerUser: 8000,
    minPerUser: 200,
    tokenPrice: 0.12,
    fdv: 120_000_000,
    vestingMonths: 18,
    immediateUnlockPct: 10,
    chain: 'ERC20',
    kycLevel: 'full',
    subscribers: 6234,
    description: '链上监控与威胁情报协议，实时识别钓鱼合约、闪电贷攻击与异常转账。',
    highlights: ['实时监控', '威胁情报', '攻击预警'],
    finalReturn: 4.8,
    allocationPct: 24,
  },
  {
    id: 'proj-social',
    name: 'SocialFi Hub',
    ticker: 'SOCL',
    category: 'SocialFi',
    status: 'ENDED',
    startTime: NOW - 90 * DAY,
    endTime: NOW - 85 * DAY,
    totalRaise: 2_000_000,
    totalSubscribed: 2_000_000,
    maxPerUser: 3000,
    minPerUser: 50,
    tokenPrice: 0.022,
    fdv: 22_000_000,
    vestingMonths: 9,
    immediateUnlockPct: 30,
    chain: 'BSC',
    kycLevel: 'basic',
    subscribers: 9123,
    description: '去中心化社交图谱协议，社交数据所有权归用户，支持创作者经济与内容货币化。',
    highlights: ['数据主权', '创作者经济', '社交图谱'],
    finalReturn: 2.1,
    allocationPct: 12,
  },
];

const RULES: Rule[] = [
  {
    level: '基础认证',
    icon: Shield,
    minKyc: '基础 KYC',
    maxAllocation: '≤ 3,000 USDT',
    features: ['单项目额度上限 3,000 USDT', '可参与 SOON 阶段项目', '锁仓期结束后自由交易'],
    status: 'OPEN',
    color: BRAND.primary,
  },
  {
    level: '完整认证',
    icon: CheckCircle2,
    minKyc: '完整 KYC + 视频',
    maxAllocation: '≤ 30,000 USDT',
    features: ['单项目额度上限 30,000 USDT', '可参与全部项目阶段', '优先参与 BETA 内测'],
    status: 'OPEN',
    color: BRAND.success,
  },
  {
    level: '机构客户',
    icon: Briefcase,
    minKyc: 'KYB + 合规协议',
    maxAllocation: '定制额度',
    features: ['定制化额度与价格', '专属交易顾问', '场外大宗同步服务', '优先分配稀缺额度'],
    status: 'BETA',
    color: BRAND.warning,
  },
];

const FAQS: FaqItem[] = [
  {
    category: '流程',
    q: '如何参与 ZSDEX Launchpad 申购？',
    a: '完成对应等级 KYC → 在 Launchpad 页面选择项目 → 锁定 USDT 申购额度 → 项目结束后分配额度 → 解锁后可在交易区交易。',
  },
  {
    category: '流程',
    q: '申购订单的有效期是多久？',
    a: '申购窗口通常为 2-5 天（视项目而定），窗口结束后统一分配额度。逾期未支付的申购额度自动释放。',
  },
  {
    category: '额度',
    q: '申购额度是按项目还是按周期计算？',
    a: '单项目独立计算。同一 KYC 等级下，每个项目都有自己的额度上限。机构客户可申请跨项目合并额度。',
  },
  {
    category: '额度',
    q: '申购未中签的金额如何处理？',
    a: '未中签部分会在申购窗口结束后的 24 小时内全额退回 USDT 钱包可用余额。',
  },
  {
    category: '解锁',
    q: '中签的代币什么时候可以交易？',
    a: '中签后立即解锁比例（通常 5-40%）可即时交易，剩余部分按月线性释放。锁仓期内可在「我的持仓」中查看释放进度。',
  },
  {
    category: '解锁',
    q: '锁仓期未结束可以提前转出吗？',
    a: '不可以。锁仓期内代币不可转账/交易/提现，到期自动解锁。紧急赎回请联系客服，机构客户可申请定制方案。',
  },
  {
    category: '风险',
    q: 'Launchpad 项目的风险有哪些？',
    a: '主要包括：1) 项目方履约风险 2) 代币价格波动 3) 锁仓期内无法变现 4) 智能合约风险 5) 监管政策变化。请根据风险承受能力审慎参与。',
  },
  {
    category: '风险',
    q: '如何评估一个 Launchpad 项目？',
    a: '建议从团队背景、技术架构、生态合作、代币经济模型、解锁曲线、社区活跃度等维度评估。本平台已对项目方进行初步尽调。',
  },
];

// ============== 工具函数 ==============

function formatNumber(n: number, decimals = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals || 1)}K`;
  return n.toFixed(decimals);
}

function formatUsdt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M USDT`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K USDT`;
  if (n >= 1) return `${n.toFixed(0)} USDT`;
  return `${n.toFixed(2)} USDT`;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}天 ${hours}时 ${mins}分`;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============== 主组件 ==============

export function PortalLaunch() {
  // ----- Tab -----
  const [tab, setTab] = useState<TabKey>('live');

  // ----- 搜索 / 排序 -----
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('progress');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ----- 实时数据 -----
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [hideAllocation, setHideAllocation] = useState(false);
  const [now, setNow] = useState<number>(NOW);

  // ----- Drawer -----
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [drawerMode, setDrawerMode] = useState<'detail' | 'subscribe' | 'rules' | 'apply' | null>(null);

  // ----- 倒计时 + 申购进度 ticker -----
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setProjects((prev) =>
        prev.map((p) => {
          if (p.status === 'OPEN' && p.totalSubscribed < p.totalRaise) {
            const inc = 5000 + Math.random() * 15000;
            return { ...p, totalSubscribed: Math.min(p.totalRaise, p.totalSubscribed + inc), subscribers: p.subscribers + Math.floor(Math.random() * 5) };
          }
          return p;
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/' && !drawerMode) {
        e.preventDefault();
        const el = document.getElementById('launch-search-input');
        el?.focus();
      }
      if (e.key === 'Escape' && drawerMode) {
        setDrawerMode(null);
      }
      if (e.key === '1' && !drawerMode) setTab('live');
      if (e.key === '2' && !drawerMode) setTab('upcoming');
      if (e.key === '3' && !drawerMode) setTab('ended');
      if (e.key === '4' && !drawerMode) setTab('all');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerMode]);

  // ----- 过滤 + 排序 -----
  const filtered = useMemo(() => {
    let list = projects;
    // Tab 过滤
    if (tab === 'live') list = list.filter((p) => p.status === 'OPEN');
    else if (tab === 'upcoming') list = list.filter((p) => p.status === 'SOON' || p.status === 'UPCOMING');
    else if (tab === 'ended') list = list.filter((p) => p.status === 'ENDED');

    // 搜索
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((p) => p.ticker.includes(q) || p.name.toUpperCase().includes(q) || p.category.includes(q));
    }

    // 排序
    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'progress': va = a.totalSubscribed / a.totalRaise; vb = b.totalSubscribed / b.totalRaise; break;
        case 'allocation': va = a.maxPerUser; vb = b.maxPerUser; break;
        case 'apy': va = a.apy || 0; vb = b.apy || 0; break;
        case 'startTime': va = a.startTime; vb = b.startTime; break;
        case 'subscribers': va = a.subscribers; vb = b.subscribers; break;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [projects, tab, search, sortKey, sortDir]);

  // ----- 汇总 -----
  const stats = useMemo(() => {
    const live = projects.filter((p) => p.status === 'OPEN');
    const totalLiveRaise = live.reduce((s, p) => s + p.totalRaise, 0);
    const totalLiveSubscribed = live.reduce((s, p) => s + p.totalSubscribed, 0);
    const totalSubscribers = projects.reduce((s, p) => s + p.subscribers, 0);
    const endedWithReturn = projects.filter((p) => p.finalReturn);
    const avgReturn = endedWithReturn.length > 0 ? endedWithReturn.reduce((s, p) => s + (p.finalReturn || 0), 0) / endedWithReturn.length : 0;
    return { liveCount: live.length, totalLiveRaise, totalLiveSubscribed, totalSubscribers, avgReturn, totalProjects: projects.length };
  }, [projects]);

  // ----- 排序切换 -----
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  // ----- 打开 drawer -----
  const openDrawer = useCallback((mode: typeof drawerMode, project?: Project) => {
    setDrawerMode(mode);
    if (project) setActiveProject(project);
  }, []);

  // ----- Hero 倒计时（下一个即将开始） -----
  const nextUpcoming = useMemo(() => {
    return projects.filter((p) => p.status === 'SOON' || p.status === 'UPCOMING').sort((a, b) => a.startTime - b.startTime)[0];
  }, [projects]);
  const heroCountdown = nextUpcoming ? Math.max(0, nextUpcoming.startTime - now) : 0;

  // ============== 子组件 ==============

  const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    const map: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
      OPEN: { label: '申购中', color: BRAND.success, bg: 'rgba(14, 203, 129, 0.12)', icon: CircleDot },
      SOON: { label: '即将开始', color: BRAND.info, bg: 'rgba(68, 219, 244, 0.12)', icon: Clock },
      UPCOMING: { label: '预热中', color: BRAND.warning, bg: 'rgba(255, 169, 64, 0.12)', icon: Sparkles },
      ENDED: { label: '已结束', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)', icon: CheckCircle2 },
      BETA: { label: '内测', color: BRAND.purple, bg: 'rgba(124, 58, 237, 0.12)', icon: Activity },
    };
    const s = map[status];
    const Icon = s.icon;
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase"
        style={{ backgroundColor: s.bg, color: s.color }}
      >
        <Icon className="w-2.5 h-2.5" />
        {s.label}
      </span>
    );
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const progress = (project.totalSubscribed / project.totalRaise) * 100;
    const remaining = project.totalRaise - project.totalSubscribed;
    const timeLeft = project.status === 'OPEN' ? project.endTime - now : project.startTime - now;
    const timeText = project.status === 'OPEN' ? `结束倒计时: ${formatTimeLeft(timeLeft)}` : `开始倒计时: ${formatTimeLeft(timeLeft)}`;
    return (
      <div
        className="rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-2xl group relative overflow-hidden"
        style={{
          backgroundColor: BRAND.card,
          border: `1px solid ${project.status === 'OPEN' ? BRAND.primary + '66' : BRAND.border}`,
        }}
      >
        {project.status === 'OPEN' && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.primary} 50%, transparent 100%)` }}
          />
        )}

        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              {project.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="text-base font-extrabold" style={{ color: BRAND.text }}>
                {project.name}
              </div>
              <div className="text-[11px] flex items-center gap-2" style={{ color: BRAND.textMute }}>
                <span>{project.ticker}</span>
                <span>·</span>
                <span>{project.category}</span>
                <span>·</span>
                <span>{project.chain}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* 描述 */}
        <p className="text-xs leading-relaxed mb-3" style={{ color: BRAND.textSub }}>
          {project.description}
        </p>

        {/* 关键指标 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              代币价格
            </div>
            <div className="text-xs font-mono font-bold" style={{ color: BRAND.text }}>
              ${project.tokenPrice.toFixed(project.tokenPrice < 0.1 ? 4 : 2)}
            </div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              FDV
            </div>
            <div className="text-xs font-mono font-bold" style={{ color: BRAND.text }}>
              ${formatNumber(project.fdv)}M
            </div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              锁仓 / 即解锁
            </div>
            <div className="text-xs font-mono font-bold" style={{ color: BRAND.text }}>
              {project.vestingMonths}m / {project.immediateUnlockPct}%
            </div>
          </div>
        </div>

        {/* 申购进度（仅 OPEN） */}
        {project.status === 'OPEN' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span style={{ color: BRAND.textMute }}>申购进度</span>
              <span className="font-mono font-bold" style={{ color: BRAND.primary }}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, progress)}%`, background: `linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.success} 100%)` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1 font-mono" style={{ color: BRAND.textMute }}>
              <span>已申购 {formatUsdt(project.totalSubscribed)}</span>
              <span>剩余 {formatUsdt(remaining)}</span>
            </div>
          </div>
        )}

        {/* 已结束收益 */}
        {project.status === 'ENDED' && project.finalReturn && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(14, 203, 129, 0.08)', border: `1px solid ${BRAND.success}33` }}>
              <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.success }}>
                最终收益
              </div>
              <div className="text-sm font-extrabold font-mono" style={{ color: BRAND.success }}>
                {project.finalReturn.toFixed(1)}x
              </div>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
              <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                实际中签
              </div>
              <div className="text-sm font-extrabold font-mono" style={{ color: BRAND.text }}>
                {project.allocationPct}%
              </div>
            </div>
          </div>
        )}

        {/* 倒计时 */}
        {(project.status === 'OPEN' || project.status === 'SOON' || project.status === 'UPCOMING') && (
          <div
            className="rounded-lg p-2 flex items-center justify-between text-[11px] mb-3"
            style={{ backgroundColor: BRAND.bg }}
          >
            <div className="flex items-center gap-1.5" style={{ color: BRAND.warning }}>
              <Clock className="w-3 h-3" />
              <span className="font-bold">{timeText}</span>
            </div>
            <div className="font-mono" style={{ color: BRAND.textMute }}>
              {project.subscribers.toLocaleString()} 人
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2">
          {project.status === 'OPEN' ? (
            <button
              onClick={() => openDrawer('subscribe', project)}
              className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              立即申购
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : project.status === 'SOON' || project.status === 'UPCOMING' ? (
            <button
              onClick={() => openDrawer('subscribe', project)}
              className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}66` }}
            >
              预约申购
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => openDrawer('detail', project)}
              className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'transparent', color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              查看回顾
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => openDrawer('detail', project)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'transparent', color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}
            aria-label="详情"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ============== 渲染 ==============

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero ===== */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${BRAND.primary}22 0%, transparent 50%), radial-gradient(circle at 80% 60%, ${BRAND.success}11 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: BRAND.textMute }}>
            <a href="/portal-preview" className="hover:text-primary transition-colors">
              首页
            </a>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: BRAND.textSub }}>Launchpad</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Rocket className="w-3 h-3" />
                  Launchpad
                </span>
                <StatusBadge status="BETA" />
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(68, 219, 244, 0.12)', color: BRAND.info }}
                >
                  <Activity className="w-3 h-3" />
                  {stats.totalSubscribers.toLocaleString()} 累计参与者
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: BRAND.text }}>
                ZSDEX{' '}
                <span style={{ color: BRAND.primary }}>Launchpad</span>
              </h1>
              <p className="text-base max-w-2xl leading-relaxed mb-6" style={{ color: BRAND.textSub }}>
                高潜力早期项目优先申购通道，机构级尽调 + 阶梯额度 + 锁仓释放。
                {stats.liveCount > 0 ? `当前 ${stats.liveCount} 个项目正在申购中。` : '当前无进行中项目，敬请期待下一期。'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTab('live')}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary, boxShadow: BRAND.shadowGold }}
                >
                  <Zap className="w-4 h-4" />
                  立即申购
                </button>
                <button
                  onClick={() => openDrawer('apply')}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-colors"
                  style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                >
                  <Briefcase className="w-4 h-4" style={{ color: BRAND.primary }} />
                  项目方入驻
                </button>
                <button
                  onClick={() => openDrawer('rules')}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-colors"
                  style={{ backgroundColor: 'transparent', color: BRAND.textSub }}
                >
                  <BookOpen className="w-4 h-4" />
                  申购规则
                </button>
              </div>
            </div>

            {/* 倒计时卡 */}
            {nextUpcoming ? (
              <div className="lg:col-span-5">
                <div
                  className="rounded-3xl p-6 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.card} 0%, ${BRAND.cardElevated} 100%)`,
                    border: `1px solid ${BRAND.primary}55`,
                    boxShadow: `0 0 0 1px ${BRAND.primary}22, 0 24px 48px -12px rgba(0,0,0,0.75)`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.primary} 50%, transparent 100%)` }}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
                      NEXT · 下一期
                    </div>
                    <StatusBadge status={nextUpcoming.status} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      {nextUpcoming.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-base font-extrabold" style={{ color: BRAND.text }}>
                        {nextUpcoming.name}
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                        {nextUpcoming.ticker} · {nextUpcoming.category} · ${nextUpcoming.tokenPrice.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-4 text-center"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                      距离开始
                    </div>
                    <div className="text-2xl font-extrabold font-mono" style={{ color: BRAND.primary }}>
                      {formatTimeLeft(heroCountdown)}
                    </div>
                  </div>
                  <button
                    onClick={() => openDrawer('subscribe', nextUpcoming)}
                    className="w-full mt-3 h-10 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}66` }}
                  >
                    预约申购 · 不错过
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ===== 2. KPI 汇总 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '历史项目', value: stats.totalProjects, suffix: '个', icon: Rocket, color: BRAND.primary },
            { label: '累计参与', value: stats.totalSubscribers, suffix: '人', icon: Users, color: BRAND.info },
            { label: '本期募集', value: formatUsdt(stats.totalLiveRaise), icon: Coins, color: BRAND.warning, isText: true },
            { label: '历史平均收益', value: stats.avgReturn.toFixed(1), suffix: 'x', icon: TrendingUp, color: BRAND.success, isFloat: true },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl p-4 transition-all hover:scale-[1.02]"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.textMute }}>
                  <Icon className="w-3 h-3" style={{ color: kpi.color }} />
                  {kpi.label}
                </div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: BRAND.text }}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  {kpi.suffix && <span className="text-sm ml-1" style={{ color: BRAND.textMute }}>{kpi.suffix}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 3. Tab + 搜索 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { key: 'live' as const, label: '申购中', count: projects.filter((p) => p.status === 'OPEN').length, icon: Zap },
              { key: 'upcoming' as const, label: '即将开始', count: projects.filter((p) => p.status === 'SOON' || p.status === 'UPCOMING').length, icon: Clock },
              { key: 'ended' as const, label: '已结束', count: projects.filter((p) => p.status === 'ENDED').length, icon: CheckCircle2 },
              { key: 'all' as const, label: '全部', count: projects.length, icon: Layers },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-all shrink-0"
                  style={{
                    backgroundColor: active ? BRAND.primaryLt : 'transparent',
                    color: active ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span
                    className="text-[9px] font-mono px-1 rounded"
                    style={{ backgroundColor: active ? BRAND.primary + '22' : BRAND.bg, color: active ? BRAND.primary : BRAND.textMute }}
                  >
                    {t.count}
                  </span>
                  <kbd
                    className="text-[9px] px-1 rounded font-mono"
                    style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
                  >
                    {t.key === 'live' ? '1' : t.key === 'upcoming' ? '2' : t.key === 'ended' ? '3' : '4'}
                  </kbd>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 h-9 px-3 rounded-lg"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, minWidth: 200 }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
              <input
                id="launch-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项目 / 类别…"
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: BRAND.text }}
              />
              <kbd
                className="text-[9px] px-1 rounded font-mono"
                style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
              >
                /
              </kbd>
            </div>
            <button
              onClick={() => setHideAllocation((v) => !v)}
              className="h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
            >
              {hideAllocation ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hideAllocation ? '显示额度' : '隐藏额度'}
            </button>
          </div>
        </div>

        {/* 排序行 */}
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 mb-4"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.textMute }}>
            <span>排序：</span>
            {[
              { key: 'progress' as const, label: '申购进度' },
              { key: 'allocation' as const, label: '单笔额度' },
              { key: 'apy' as const, label: '预期收益' },
              { key: 'subscribers' as const, label: '参与人数' },
              { key: 'startTime' as const, label: '开始时间' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSort(s.key)}
                className="inline-flex items-center gap-0.5 transition-colors"
                style={{ color: sortKey === s.key ? BRAND.primary : BRAND.textMute }}
              >
                {s.label}
                {sortKey === s.key && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
            共 {filtered.length} 个项目
          </div>
        </div>

        {/* 项目列表 */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.textMute }} />
            <p className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
              暂无匹配项目
            </p>
            <p className="text-xs" style={{ color: BRAND.textSub }}>
              尝试其他关键词或切换 Tab
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== 4. 申购规则说明 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
              ALLOCATION TIERS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              申购额度阶梯
            </h2>
          </div>
          <button
            onClick={() => openDrawer('rules')}
            className="text-xs font-bold inline-flex items-center gap-1"
            style={{ color: BRAND.primary }}
          >
            查看完整规则 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.level}
                className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: rule.color + '22', color: rule.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <StatusBadge status={rule.status} />
                </div>
                <div className="text-base font-extrabold mb-1" style={{ color: BRAND.text }}>
                  {rule.level}
                </div>
                <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>
                  要求：{rule.minKyc}
                </div>
                <div
                  className="rounded-lg p-2 mb-3"
                  style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                    单项目额度
                  </div>
                  <div className="text-sm font-extrabold font-mono" style={{ color: rule.color }}>
                    {rule.maxAllocation}
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs" style={{ color: BRAND.textSub }}>
                  {rule.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: rule.color }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 5. FAQ ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
              FAQ
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              常见问题
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FAQS.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  {f.category}
                </span>
              </div>
              <div className="text-sm font-bold mb-1.5 flex items-start gap-2" style={{ color: BRAND.text }}>
                <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                {f.q}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 6. 项目方入驻 CTA ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.card} 0%, ${BRAND.primaryLt} 100%)`,
            border: `1px solid ${BRAND.primary}55`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.primary} 50%, transparent 100%)` }}
          />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5" style={{ color: BRAND.primary }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
                  FOR PROJECTS
                </span>
              </div>
              <h3 className="text-2xl font-extrabold mb-2" style={{ color: BRAND.text }}>
                准备好发行您的项目了吗？
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.textSub }}>
                ZSDEX Launchpad 为优质项目提供完整发行服务：智能合约部署、投资者分配、锁仓释放、上线交易。
                机构级尽调 + 全球分发网络 + 持续生态支持。
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '合作项目', value: '24+' },
                  { label: '募集总额', value: '$58M' },
                  { label: '平均超额', value: '8.4x' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.30)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      {s.label}
                    </div>
                    <div className="text-sm font-extrabold font-mono" style={{ color: BRAND.primary }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-4 flex flex-col gap-2">
              <button
                onClick={() => openDrawer('apply')}
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
              >
                <Send className="w-4 h-4" />
                立即提交申请
              </button>
              <button
                onClick={() => openDrawer('rules')}
                className="w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'transparent', color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                <BookOpen className="w-4 h-4" />
                查看合作手册
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. 安全提示条 ===== */}
      <section
        className="py-6"
        style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255, 169, 64, 0.12)', color: BRAND.warning }}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
              Launchpad 数据为 mock 占位
            </div>
            <div className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
              本页所有项目信息、申购进度、倒计时、收益倍数均为 mock 占位示例，仅用于界面演示。
              实际项目以官方公告与平台尽调报告为准。数字资产投资存在风险，请根据自身风险承受能力审慎参与。
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. Drawer：项目详情 / 申购 / 规则 / 入驻 ===== */}
      {drawerMode && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawerMode(null)}
        >
          <div
            className="w-full max-w-lg h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4 z-10"
              style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                {drawerMode === 'detail' && activeProject ? <><Eye className="w-4 h-4" style={{ color: BRAND.primary }} />{activeProject.name}</> : null}
                {drawerMode === 'subscribe' && <><Zap className="w-4 h-4" style={{ color: BRAND.primary }} />{activeProject?.status === 'OPEN' ? '立即申购' : '预约申购'}</>}
                {drawerMode === 'rules' && <><BookOpen className="w-4 h-4" style={{ color: BRAND.primary }} />申购规则说明</>}
                {drawerMode === 'apply' && <><Briefcase className="w-4 h-4" style={{ color: BRAND.primary }} />项目方入驻申请</>}
              </h3>
              <button
                onClick={() => setDrawerMode(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* detail */}
              {drawerMode === 'detail' && activeProject && (
                <>
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        {activeProject.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-base font-extrabold" style={{ color: BRAND.text }}>
                          {activeProject.name}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          {activeProject.ticker} · {activeProject.category} · {activeProject.chain}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <StatusBadge status={activeProject.status} />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                      {activeProject.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '代币价格', value: `$${activeProject.tokenPrice.toFixed(4)}` },
                      { label: 'FDV', value: `$${formatNumber(activeProject.fdv)}M` },
                      { label: '募集总额', value: formatUsdt(activeProject.totalRaise) },
                      { label: '单笔额度', value: `${activeProject.minPerUser} - ${activeProject.maxPerUser} USDT` },
                      { label: '锁仓期', value: `${activeProject.vestingMonths} 个月` },
                      { label: '即解锁', value: `${activeProject.immediateUnlockPct}%` },
                    ].map((it) => (
                      <div key={it.label} className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                          {it.label}
                        </div>
                        <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                          {it.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                      项目亮点
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {activeProject.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="rounded-lg p-2 flex items-center gap-1.5 text-xs"
                          style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}
                        >
                          <Sparkles className="w-3 h-3 shrink-0" style={{ color: BRAND.primary }} />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeProject.status === 'OPEN' && (
                    <button
                      onClick={() => setDrawerMode('subscribe')}
                      className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                    >
                      立即申购 {activeProject.ticker}
                    </button>
                  )}
                </>
              )}

              {/* subscribe */}
              {drawerMode === 'subscribe' && activeProject && (
                <>
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}33` }}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.warning }} />
                    <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      申购需完成对应等级 KYC。未中签部分将在申购窗口结束后 24 小时内退回 USDT 钱包。
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        {activeProject.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                          {activeProject.name}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          ${activeProject.tokenPrice.toFixed(4)} / {activeProject.ticker}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <div style={{ color: BRAND.textMute }}>最低</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.text }}>
                          {activeProject.minPerUser} USDT
                        </div>
                      </div>
                      <div>
                        <div style={{ color: BRAND.textMute }}>最高</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.text }}>
                          {activeProject.maxPerUser} USDT
                        </div>
                      </div>
                      <div>
                        <div style={{ color: BRAND.textMute }}>KYC</div>
                        <div className="font-bold" style={{ color: BRAND.primary }}>
                          {activeProject.kycLevel === 'basic' ? '基础' : activeProject.kycLevel === 'full' ? '完整' : '机构'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                      申购数量 (USDT)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={`${activeProject.minPerUser} - ${activeProject.maxPerUser}`}
                        className="flex-1 h-10 px-3 rounded-lg text-sm outline-none font-mono"
                        style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                      />
                      <button
                        className="h-10 px-3 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
                      >
                        全部
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {[25, 50, 75, 100].map((p) => (
                        <button
                          key={p}
                          className="flex-1 h-7 rounded-md text-[11px] font-bold"
                          style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-3 text-xs space-y-1.5"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>预计获得</span>
                      <span className="font-mono">-- {activeProject.ticker}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>即解锁</span>
                      <span className="font-mono">{activeProject.immediateUnlockPct}%</span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>锁仓释放</span>
                      <span className="font-mono">{activeProject.vestingMonths - 1} 个月线性</span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>平台手续费</span>
                      <span className="font-mono">0%</span>
                    </div>
                  </div>

                  <button
                    className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                  >
                    {activeProject.status === 'OPEN' ? '确认申购' : '预约申购'}
                  </button>
                  <div className="text-[10px] text-center" style={{ color: BRAND.textMute }}>
                    提交即表示同意《Launchpad 申购协议》与《风险揭示书》
                  </div>
                </>
              )}

              {/* rules */}
              {drawerMode === 'rules' && (
                <>
                  <div className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                    ZSDEX Launchpad 采用阶梯额度机制，根据用户 KYC 等级分配不同申购上限。
                    所有项目均需完成智能合约审计、团队背景尽调与代币经济模型审核。
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                      申购流程
                    </div>
                    <ol className="space-y-2 text-xs" style={{ color: BRAND.textSub }}>
                      {[
                        '完成对应等级 KYC 实名认证',
                        '锁定 USDT 申购额度（资金冻结在钱包）',
                        '申购窗口结束后系统随机分配',
                        '中签者获得代币（含即解锁部分）',
                        '未中签者金额 24 小时内自动退回',
                        '锁仓期内代币按月线性释放',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                          >
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                      重要条款
                    </div>
                    <ul className="space-y-1.5 text-xs" style={{ color: BRAND.textSub }}>
                      {[
                        '单项目申购额度按 KYC 等级独立计算',
                        '申购订单在窗口结束前可撤销',
                        '中签结果基于哈希随机数 + 持仓权重',
                        '锁仓期内不可转账/提现/交易',
                        '项目方需缴纳 5% 履约保证金',
                      ].map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* apply */}
              {drawerMode === 'apply' && (
                <>
                  <div className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                    提交项目方入驻申请，我们的 BD 团队会在 3 个工作日内联系您。
                  </div>
                  {[
                    { label: '项目名称', placeholder: 'Project Name' },
                    { label: '联系人邮箱', placeholder: 'bd@example.com' },
                    { label: '项目官网', placeholder: 'https://' },
                    { label: '募集规模 (USDT)', placeholder: '1,000,000' },
                    { label: '计划上线网络', placeholder: 'Conflux Core / ERC20' },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                        {f.label}
                      </label>
                      <input
                        placeholder={f.placeholder}
                        className="w-full h-10 px-3 rounded-lg text-xs outline-none"
                        style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                      项目简介
                    </label>
                    <textarea
                      placeholder="团队 / 技术 / 生态合作 / 代币经济..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    />
                  </div>
                  <button
                    className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                  >
                    提交申请
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalLaunch;
