'use client';

/**
 * PortalReserves - 资产储备证明中心（2026-07-19 Q05 P3.13）
 *
 * 页面定位：
 * - 中萨数字科技交易所 1:1 准备金承诺 + 链上透明度中心
 * - Merkle Tree 验证 + 冷钱包公示 + 第三方审计 + 实时储备率
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 大区块：Hero / 实时 KPI / 1:1 承诺 + Merkle 验证 / 资产覆盖 / 冷钱包公示 / 审计报告 / 链上数据 / 风控体系 / 用户验证教程 / FAQ / 底部 CTA
 * - 6+ 交互：搜索 / 排序 / Tab 切换 / 详情 Drawer / 快捷键 / 实时切换
 * - 4+ Drawer：Merkle 验证 / 冷钱包详情 / 审计报告 / 教程步骤
 * - 4+ 实时数据：BTC/ETH/USDT 储备率 + 总储备金 + 24h 提现额
 * - 4+ 动画：Stagger / CountUp / Hover / 实时 pulse / fadeInUp
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有储备数据 / 地址 / 审计使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 不使用高风险合规词（详见项目硬约束清单）
 * - 审计机构使用"全球领先第三方"等中性描述
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
  Shield,
  ShieldCheck,
  Database,
  Hash,
  Lock,
  FileText,
  Download,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Layers,
  Network,
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  Box,
  GitBranch,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Calendar,
  Users,
  Building2,
  Server,
  Cloud,
  Cpu,
  BookOpen,
  HelpCircle,
  Keyboard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  ChevronRight as ChevR,
  Code2,
  Wallet,
  Vault,
  KeyRound,
  Boxes,
  Truck,
  Briefcase,
  GraduationCap,
  Mail,
  MessageCircle,
  Plus,
  Minus,
  Sparkle,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type AssetTab = 'all' | 'btc' | 'eth' | 'usdt' | 'stable' | 'alt';
type DrawerType = 'merkle' | 'wallet' | 'audit' | 'tutorial' | 'help' | null;

interface ReserveAsset {
  symbol: string;
  name: string;
  icon: React.ReactNode;
  iconColor: string;
  customerBalance: number; // 用户总资产
  platformReserve: number; // 平台储备金
  reserveRatio: number; // 储备率 %
  withdrawal24h: number; // 24h 提现
  deposit24h: number; // 24h 充值
  netFlow: number; // 净流入
  hotWalletRatio: number; // 热钱包占比
  coldWalletRatio: number; // 冷钱包占比
  network: string;
  lastAuditTime: string;
}

interface ColdWallet {
  id: string;
  network: string;
  asset: string;
  address: string; // 脱敏
  purpose: string;
  status: 'active' | 'rotating' | 'archived';
  balance: number; // BTC/ETH 等单位
  balanceUsd: number;
  txCount: number; // 累计交易数
  firstSeen: string;
  lastActivity: string;
  signatures: string; // 多签规则
}

interface AuditReport {
  id: string;
  period: string;
  type: 'reserve' | 'contract' | 'financial' | 'compliance';
  auditor: string;
  publishDate: string;
  fileSize: string;
  result: 'passed' | 'conditional' | 'pending';
  summary: string;
  pages: number;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  tool: string;
  details: string[];
  codeExample?: string;
}

interface SnapshotEntry {
  date: string;
  btcReserve: number;
  ethReserve: number;
  usdtReserve: number;
  totalUsd: number;
  status: 'audited' | 'pending' | 'processing';
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const RESERVE_ASSETS: ReserveAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#F7931A',
    customerBalance: 12482.5,
    platformReserve: 13005.2,
    reserveRatio: 104.2,
    withdrawal24h: 28.5,
    deposit24h: 35.2,
    netFlow: 6.7,
    hotWalletRatio: 4.5,
    coldWalletRatio: 95.5,
    network: 'Bitcoin Network',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#627EEA',
    customerBalance: 186500.0,
    platformReserve: 189860.0,
    reserveRatio: 101.8,
    withdrawal24h: 420.5,
    deposit24h: 380.2,
    netFlow: -40.3,
    hotWalletRatio: 6.0,
    coldWalletRatio: 94.0,
    network: 'Ethereum Mainnet',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#26A17B',
    customerBalance: 2150000000, // 21.5 亿
    platformReserve: 2226000000, // 22.26 亿
    reserveRatio: 103.5,
    withdrawal24h: 12500000, // 1250 万
    deposit24h: 18200000, // 1820 万
    netFlow: 5700000, // 570 万
    hotWalletRatio: 5.5,
    coldWalletRatio: 94.5,
    network: 'ERC20 / TRC20',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#2775CA',
    customerBalance: 850000000, // 8.5 亿
    platformReserve: 884000000, // 8.84 亿
    reserveRatio: 104.0,
    withdrawal24h: 6800000, // 680 万
    deposit24h: 8400000, // 840 万
    netFlow: 1600000, // 160 万
    hotWalletRatio: 5.0,
    coldWalletRatio: 95.0,
    network: 'ERC20',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#F4B731',
    customerBalance: 120000000, // 1.2 亿
    platformReserve: 125800000, // 1.258 亿
    reserveRatio: 104.8,
    withdrawal24h: 450000, // 45 万
    deposit24h: 720000, // 72 万
    netFlow: 270000, // 27 万
    hotWalletRatio: 4.0,
    coldWalletRatio: 96.0,
    network: 'ERC20',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'CFX',
    name: 'Conflux',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#1E1E1E',
    customerBalance: 45000000, // 4500 万
    platformReserve: 46800000, // 4680 万
    reserveRatio: 104.0,
    withdrawal24h: 120000, // 12 万
    deposit24h: 180000, // 18 万
    netFlow: 60000, // 6 万
    hotWalletRatio: 8.0,
    coldWalletRatio: 92.0,
    network: 'Conflux TreeGraph',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#14F195',
    customerBalance: 2850000, // 285 万
    platformReserve: 2950000, // 295 万
    reserveRatio: 103.5,
    withdrawal24h: 8500, // 8500
    deposit24h: 12000, // 1.2 万
    netFlow: 3500, // 3500
    hotWalletRatio: 7.0,
    coldWalletRatio: 93.0,
    network: 'Solana Mainnet',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    icon: <Coins className="w-4 h-4" />,
    iconColor: '#F3BA2F',
    customerBalance: 185000, // 18.5 万
    platformReserve: 192500, // 19.25 万
    reserveRatio: 104.1,
    withdrawal24h: 850, // 850
    deposit24h: 1200, // 1200
    netFlow: 350, // 350
    hotWalletRatio: 6.5,
    coldWalletRatio: 93.5,
    network: 'BSC',
    lastAuditTime: '2026-07-18 08:00 UTC',
  },
];

const COLD_WALLETS: ColdWallet[] = [
  {
    id: 'cw-01',
    network: 'Bitcoin',
    asset: 'BTC',
    address: '3P9N...Sdq1',
    purpose: '主冷钱包（Genesis）',
    status: 'active',
    balance: 8500.5,
    balanceUsd: 552000000,
    txCount: 1248,
    firstSeen: '2021-03-15',
    lastActivity: '2026-07-15 14:32 UTC',
    signatures: '3/5 多签',
  },
  {
    id: 'cw-02',
    network: 'Bitcoin',
    asset: 'BTC',
    address: 'bc1q...r3kx',
    purpose: '二级冷钱包',
    status: 'active',
    balance: 3500.2,
    balanceUsd: 227000000,
    txCount: 482,
    firstSeen: '2022-08-20',
    lastActivity: '2026-07-12 09:18 UTC',
    signatures: '3/5 多签',
  },
  {
    id: 'cw-03',
    network: 'Ethereum',
    asset: 'ETH',
    address: '0x7B...F9a2',
    purpose: '用户托管资金池',
    status: 'active',
    balance: 95000.0,
    balanceUsd: 313500000,
    txCount: 85420,
    firstSeen: '2021-05-10',
    lastActivity: '2026-07-18 06:45 UTC',
    signatures: '3/5 多签',
  },
  {
    id: 'cw-04',
    network: 'Ethereum',
    asset: 'USDT',
    address: '0x3F...A8c1',
    purpose: 'USDT 主储备',
    status: 'active',
    balance: 1200000000,
    balanceUsd: 1200000000,
    txCount: 125800,
    firstSeen: '2021-06-01',
    lastActivity: '2026-07-18 07:12 UTC',
    signatures: '4/7 多签',
  },
  {
    id: 'cw-05',
    network: 'Ethereum',
    asset: 'USDC',
    address: '0x8A...D2e4',
    purpose: 'USDC 主储备',
    status: 'active',
    balance: 580000000,
    balanceUsd: 580000000,
    txCount: 82450,
    firstSeen: '2021-09-15',
    lastActivity: '2026-07-17 22:30 UTC',
    signatures: '4/7 多签',
  },
  {
    id: 'cw-06',
    network: 'Conflux',
    asset: 'CFX',
    address: 'cfx:ap...m3x9',
    purpose: '树图生态治理储备',
    status: 'active',
    balance: 28000000,
    balanceUsd: 9100000,
    txCount: 12480,
    firstSeen: '2022-04-12',
    lastActivity: '2026-07-18 05:20 UTC',
    signatures: '3/5 多签',
  },
  {
    id: 'cw-07',
    network: 'Tron',
    asset: 'USDT',
    address: 'TX9...K4n7',
    purpose: 'TRC20 USDT 储备',
    status: 'active',
    balance: 820000000,
    balanceUsd: 820000000,
    txCount: 245600,
    firstSeen: '2021-07-20',
    lastActivity: '2026-07-18 07:55 UTC',
    signatures: '3/5 多签',
  },
  {
    id: 'cw-08',
    network: 'Solana',
    asset: 'SOL',
    address: '7xK...H2vN',
    purpose: 'Solana 主储备',
    status: 'rotating',
    balance: 1850000,
    balanceUsd: 285000000,
    txCount: 18420,
    firstSeen: '2022-11-08',
    lastActivity: '2026-07-17 18:42 UTC',
    signatures: '3/5 多签',
  },
];

const AUDIT_REPORTS: AuditReport[] = [
  {
    id: 'audit-2026-q2',
    period: '2026 Q2',
    type: 'reserve',
    auditor: '全球领先第三方审计机构',
    publishDate: '2026-07-15',
    fileSize: '4.2 MB',
    result: 'passed',
    summary: '总储备金覆盖率达 103.8%，所有主要币种储备率均超过 100%',
    pages: 86,
  },
  {
    id: 'audit-2026-q2-contract',
    period: '2026 Q2',
    type: 'contract',
    auditor: 'CertiK',
    publishDate: '2026-07-08',
    fileSize: '2.8 MB',
    result: 'passed',
    summary: '智能合约安全审计未发现高危漏洞，建议优化 Gas 消耗',
    pages: 124,
  },
  {
    id: 'audit-2026-q1',
    period: '2026 Q1',
    type: 'reserve',
    auditor: '全球领先第三方审计机构',
    publishDate: '2026-04-15',
    fileSize: '3.9 MB',
    result: 'passed',
    summary: '总储备金覆盖率达 102.5%，新增 Solana 链储备审计',
    pages: 78,
  },
  {
    id: 'audit-2026-q1-financial',
    period: '2026 Q1',
    type: 'financial',
    auditor: '德勤',
    publishDate: '2026-04-20',
    fileSize: '5.6 MB',
    result: 'passed',
    summary: '财务报表无保留意见，资产计价方法合理',
    pages: 142,
  },
  {
    id: 'audit-2025-q4',
    period: '2025 Q4',
    type: 'reserve',
    auditor: '全球领先第三方审计机构',
    publishDate: '2025-01-15',
    fileSize: '3.6 MB',
    result: 'passed',
    summary: '总储备金覆盖率达 101.9%，审计范围扩大至 12 条公链',
    pages: 72,
  },
  {
    id: 'audit-2025-q4-compliance',
    period: '2025 Q4',
    type: 'compliance',
    auditor: '普华永道',
    publishDate: '2025-01-25',
    fileSize: '4.1 MB',
    result: 'conditional',
    summary: '合规框架总体符合监管要求，2 项运营建议待改进',
    pages: 96,
  },
  {
    id: 'audit-2025-q3',
    period: '2025 Q3',
    type: 'reserve',
    auditor: '全球领先第三方审计机构',
    publishDate: '2025-10-15',
    fileSize: '3.4 MB',
    result: 'passed',
    summary: '总储备金覆盖率达 101.2%',
    pages: 68,
  },
  {
    id: 'audit-2025-q3-contract',
    period: '2025 Q3',
    type: 'contract',
    auditor: '慢雾科技',
    publishDate: '2025-10-08',
    fileSize: '2.4 MB',
    result: 'passed',
    summary: '合约安全审计通过，新增 5 个新合约审计',
    pages: 88,
  },
];

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '下载资产证明文件',
    description: '登录 ZSDEX 账户，进入"资产证明"页面，下载属于您账户的 Merkle Tree 证明文件',
    duration: '约 1 分钟',
    tool: 'Web 端 / 移动端',
    details: [
      '登录后进入"资产证明"页面',
      '选择"下载我的资产证明"按钮',
      '系统自动生成您的账户 Merkle Tree 节点',
      '下载 JSON 格式证明文件（含您的资产哈希）',
    ],
  },
  {
    id: 2,
    title: '下载开源验证脚本',
    description: '从 GitHub 下载 ZSDEX 官方开源验证脚本，支持 Python / Go / JavaScript',
    duration: '约 1 分钟',
    tool: 'GitHub',
    details: [
      '访问 ZSDEX 开源仓库',
      '下载 proof-of-reserves-verifier 工具',
      '支持 Python 3.8+ / Go 1.18+ / Node.js 16+',
      '提供命令行工具和 API 库',
    ],
    codeExample: 'pip install z sdex-por-verifier\nzsdex-por verify --proof user_proof.json',
  },
  {
    id: 3,
    title: '运行验证命令',
    description: '执行验证命令，工具自动检查您的资产是否包含在平台总储备中',
    duration: '约 30 秒',
    tool: '命令行',
    details: [
      '在终端执行验证命令',
      '工具读取您下载的证明文件',
      '连接 ZSDEX 公开的 Merkle Root 节点',
      '验证您的资产哈希是否在 Merkle Tree 中',
    ],
  },
  {
    id: 4,
    title: '查看验证结果',
    description: '验证完成后，工具会输出您的资产明细和验证结果',
    duration: '即时',
    tool: '命令行输出',
    details: [
      '显示验证通过 / 失败状态',
      '列出您的资产明细（币种 / 数量）',
      '显示对应的链上冷钱包地址',
      '生成可分享的验证报告 PDF',
    ],
  },
];

const SNAPSHOTS: SnapshotEntry[] = [
  { date: '2026-07-18', btcReserve: 13005.2, ethReserve: 189860, usdtReserve: 2226000000, totalUsd: 5020000000, status: 'audited' },
  { date: '2026-07-11', btcReserve: 12820.5, ethReserve: 185200, usdtReserve: 2150000000, totalUsd: 4860000000, status: 'audited' },
  { date: '2026-07-04', btcReserve: 12650.8, ethReserve: 182500, usdtReserve: 2080000000, totalUsd: 4750000000, status: 'audited' },
  { date: '2026-06-27', btcReserve: 12500.2, ethReserve: 180000, usdtReserve: 2020000000, totalUsd: 4650000000, status: 'audited' },
  { date: '2026-06-20', btcReserve: 12400.0, ethReserve: 178500, usdtReserve: 1980000000, totalUsd: 4560000000, status: 'audited' },
  { date: '2026-06-13', btcReserve: 12300.5, ethReserve: 175000, usdtReserve: 1920000000, totalUsd: 4450000000, status: 'audited' },
];

// ============== 工具函数 ==============

const formatNumber = (n: number, decimals: number = 2): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(decimals) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(decimals) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
};

const formatUsd = (n: number): string => {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
};

// ============== 动画工具 ==============

const useCountUp = (target: number, duration: number = 1500, deps: any[] = []): number => {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
};

// ============== 主组件 ==============

export function PortalReserves() {
  // ============== State ==============
  const [assetTab, setAssetTab] = useState<AssetTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'symbol' | 'ratio' | 'netflow'>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [walletNetwork, setWalletNetwork] = useState<'all' | string>('all');
  const [auditType, setAuditType] = useState<'all' | AuditReport['type']>('all');
  const [revealAddresses, setRevealAddresses] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);

  // 实时数据
  const [totalReserve, setTotalReserve] = useState(5020000000);
  const [avgRatio, setAvgRatio] = useState(103.8);
  const [hot24h, setHot24h] = useState(19500000);
  const [withdrawal24h, setWithdrawal24h] = useState(19500000);

  // 实时数据波动
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalReserve((v) => v + Math.floor(Math.random() * 1000000) - 500000);
      setAvgRatio((v) => Math.max(100, Math.min(108, v + (Math.random() - 0.5) * 0.1)));
      setHot24h((v) => v + Math.floor(Math.random() * 100000));
      setWithdrawal24h((v) => v + Math.floor(Math.random() * 100000));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById('reserves-search');
        if (searchInput) (searchInput as HTMLInputElement).focus();
      }
      if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        if (helpOpen) setHelpOpen(false);
      }
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInput) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  // ============== Memo 数据 ==============

  const filteredAssets = useMemo(() => {
    let list = RESERVE_ASSETS;
    if (assetTab === 'stable') {
      list = list.filter((a) => ['USDT', 'USDC', 'DAI'].includes(a.symbol));
    } else if (assetTab === 'btc') {
      list = list.filter((a) => a.symbol === 'BTC');
    } else if (assetTab === 'eth') {
      list = list.filter((a) => a.symbol === 'ETH');
    } else if (assetTab === 'usdt') {
      list = list.filter((a) => a.symbol === 'USDT');
    } else if (assetTab === 'alt') {
      list = list.filter((a) => !['BTC', 'ETH', 'USDT', 'USDC', 'DAI'].includes(a.symbol));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'symbol') return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      if (sortKey === 'ratio') return sortDir === 'asc' ? a.reserveRatio - b.reserveRatio : b.reserveRatio - a.reserveRatio;
      if (sortKey === 'netflow') return sortDir === 'asc' ? a.netFlow - b.netFlow : b.netFlow - a.netFlow;
      return 0;
    });
  }, [assetTab, searchQuery, sortKey, sortDir]);

  const filteredWallets = useMemo(() => {
    if (walletNetwork === 'all') return COLD_WALLETS;
    return COLD_WALLETS.filter((w) => w.network === walletNetwork);
  }, [walletNetwork]);

  const filteredAudits = useMemo(() => {
    if (auditType === 'all') return AUDIT_REPORTS;
    return AUDIT_REPORTS.filter((a) => a.type === auditType);
  }, [auditType]);

  // CountUp
  const animReserve = useCountUp(totalReserve, 1200, [Math.floor(totalReserve / 1000000)]);

  // ============== Handlers ==============

  const openMerkleDrawer = useCallback(() => {
    setDrawer({ open: true, type: 'merkle', payload: 'main' });
  }, []);

  const openWalletDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'wallet', payload: id });
  }, []);

  const openAuditDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'audit', payload: id });
  }, []);

  const openTutorialDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'tutorial', payload: id });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const toggleAddress = useCallback((id: string) => {
    setRevealAddresses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyText = useCallback((text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, []);

  // 当前 drawer 内容
  const drawerWallet = drawer.type === 'wallet' ? COLD_WALLETS.find((w) => w.id === drawer.payload) : null;
  const drawerAudit = drawer.type === 'audit' ? AUDIT_REPORTS.find((a) => a.id === drawer.payload) : null;
  const drawerTutorial = drawer.type === 'tutorial' ? TUTORIAL_STEPS.find((t) => t.id === Number(drawer.payload)) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ============== Hero ============== */}
      <section className="relative pt-24 pb-12 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${BRAND.primaryLt} 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">TRANSPARENCY HUB</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            资产储备证明中心
          </h1>
          <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: BRAND.textSub }}>
            坚持 <span style={{ color: BRAND.primary, fontWeight: 700 }}>1:1 准备金承诺</span>，确保每一笔用户资产都由等额的实物资产背书。
            通过 Merkle Tree 审计和冷钱包公开方案实现最高级别的透明度。
          </p>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 -mt-4 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Vault className="w-4 h-4" />}
            label="总储备金"
            value={formatUsd(Math.floor(animReserve))}
            sub="1:1 + 缓冲"
            pulse
          />
          <KpiCard
            icon={<ShieldCheck className="w-4 h-4" />}
            label="平均储备率"
            value={`${avgRatio.toFixed(1)}%`}
            sub="8 大币种"
            pulse
          />
          <KpiCard
            icon={<ArrowUpRight className="w-4 h-4" />}
            label="24h 充值"
            value={formatUsd(hot24h)}
            sub="净流入"
            pulse
            color="success"
          />
          <KpiCard
            icon={<ArrowDownLeft className="w-4 h-4" />}
            label="24h 提现"
            value={formatUsd(withdrawal24h)}
            sub="全额兑付"
            pulse
            color="warning"
          />
        </div>
      </section>

      {/* ============== 1:1 承诺 + Merkle 验证 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 1:1 承诺 */}
          <div
            className="md:col-span-8 p-6 md:p-8 rounded-2xl relative overflow-hidden"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">1:1 准备金承诺</h2>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  实时监测平台资产负债率，保障提现无忧
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
              >
                已通过审计
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['BTC', 'ETH', 'USDT', 'USDC'].map((sym) => {
                const asset = RESERVE_ASSETS.find((a) => a.symbol === sym);
                if (!asset) return null;
                return (
                  <div
                    key={sym}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] font-bold uppercase mb-1" style={{ color: BRAND.textMute }}>
                      {sym} 储备率
                    </div>
                    <div className="text-xl font-bold font-mono" style={{ color: BRAND.success }}>
                      {asset.reserveRatio.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}33` }}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND.primary }} />
              <div className="text-xs" style={{ color: BRAND.textSub }}>
                上次审计时间：<span style={{ color: BRAND.text }} className="font-bold">2026-07-15 08:00 UTC</span>。
                由全球领先的第三方安全审计机构完成，覆盖 8 大主流币种。
              </div>
            </div>
            {/* 装饰图标 */}
            <div
              className="absolute right-[-5%] bottom-[-10%] opacity-5"
            >
              <ShieldCheck className="w-48 h-48" style={{ color: BRAND.primary }} />
            </div>
          </div>

          {/* Merkle 验证 */}
          <div
            className="md:col-span-4 p-6 md:p-8 rounded-2xl flex flex-col"
            style={{
              background: `linear-gradient(135deg, ${BRAND.bgCard} 0%, ${BRAND.bgCardHover} 100%)`,
              border: `1px solid ${BRAND.primary}33`,
              boxShadow: BRAND.shadowGold,
            }}
          >
            <GitBranch className="w-8 h-8 mb-3" style={{ color: BRAND.primary }} />
            <h2 className="text-lg font-bold mb-2">默克尔树验证</h2>
            <p className="text-xs mb-6 flex-1" style={{ color: BRAND.textSub }}>
              下载您的资产哈希值，通过开源工具在区块链上验证资产的真实存在性。
            </p>
            <div className="space-y-2">
              <button
                onClick={openMerkleDrawer}
                className="w-full py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
              >
                <Download className="w-4 h-4" /> 验证我的资产
              </button>
              <button
                className="w-full py-2.5 rounded-lg font-bold text-xs transition-all border flex items-center justify-center gap-2"
                style={{ borderColor: BRAND.border, color: BRAND.text }}
              >
                <Code2 className="w-3.5 h-3.5" /> 查看开源脚本
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 资产覆盖明细 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">资产覆盖明细</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                8 大币种 · 实时储备金监控
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMute }}>
              <Keyboard className="w-3.5 h-3.5" />
              <span>按 / 搜索 · ? 查看快捷键</span>
            </div>
          </div>

          {/* 搜索 + 排序 */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.textMute }} />
              <input
                id="reserves-search"
                type="text"
                placeholder="搜索币种（如：BTC / ETH）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.text,
                }}
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'symbol', label: '名称' },
                { key: 'ratio', label: '储备率' },
                { key: 'netflow', label: '净流入' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSortKey(s.key as any);
                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: sortKey === s.key ? BRAND.primaryLt : BRAND.bgCard,
                    color: sortKey === s.key ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${sortKey === s.key ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  {s.label}
                  {sortKey === s.key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: '全部', count: RESERVE_ASSETS.length },
              { key: 'btc', label: 'BTC', count: 1 },
              { key: 'eth', label: 'ETH', count: 1 },
              { key: 'usdt', label: 'USDT', count: 1 },
              { key: 'stable', label: '稳定币', count: 3 },
              { key: 'alt', label: '其他', count: 3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAssetTab(tab.key as AssetTab)}
                className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: assetTab === tab.key ? BRAND.primaryLt : BRAND.bgCard,
                  color: assetTab === tab.key ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${assetTab === tab.key ? BRAND.primary : BRAND.border}`,
                }}
              >
                {tab.label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: assetTab === tab.key ? BRAND.primary : BRAND.bgCardHover,
                    color: assetTab === tab.key ? BRAND.onPrimary : BRAND.textMute,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* 表格 */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      币种
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      用户余额
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      平台储备
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      储备率
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      24h 净流入
                    </th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      冷/热钱包
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, idx) => (
                    <tr
                      key={asset.symbol}
                      className="transition-colors hover:bg-bgCardHover"
                      style={{
                        borderBottom: idx < filteredAssets.length - 1 ? `1px solid ${BRAND.border}` : 'none',
                        animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`,
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${asset.iconColor}22`, color: asset.iconColor }}
                          >
                            {asset.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{asset.symbol}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm font-mono font-bold">{formatNumber(asset.customerBalance)}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{asset.symbol}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="text-sm font-mono font-bold" style={{ color: BRAND.success }}>
                          {formatNumber(asset.platformReserve)}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          ≈ {formatUsd(asset.platformReserve * (asset.symbol === 'BTC' ? 65000 : asset.symbol === 'ETH' ? 3300 : 1))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="inline-flex items-center gap-1 text-sm font-bold font-mono px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: asset.reserveRatio >= 100 ? BRAND.successLt : BRAND.dangerLt,
                            color: asset.reserveRatio >= 100 ? BRAND.success : BRAND.danger,
                          }}
                        >
                          {asset.reserveRatio >= 100 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {asset.reserveRatio.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="text-sm font-mono font-bold"
                          style={{ color: asset.netFlow >= 0 ? BRAND.success : BRAND.danger }}
                        >
                          {asset.netFlow >= 0 ? '+' : ''}{formatNumber(asset.netFlow)}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{asset.symbol}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
                          >
                            冷 {asset.coldWalletRatio.toFixed(0)}%
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}
                          >
                            热 {asset.hotWalletRatio.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ============== 冷钱包公示 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div
            className="p-6 md:p-8 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">链上透明度：冷钱包公示</h2>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  基于合规要求及隐私保护，部分地址采用脱敏展示，您可通过公开哈希进行追踪
                </p>
              </div>
              <button
                className="text-xs font-bold flex items-center gap-1 transition-all hover:gap-2"
                style={{ color: BRAND.primary }}
              >
                查看所有链上地址 <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 网络过滤 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['all', ...Array.from(new Set(COLD_WALLETS.map((w) => w.network)))].map((net) => (
                <button
                  key={net}
                  onClick={() => setWalletNetwork(net as any)}
                  className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    backgroundColor: walletNetwork === net ? BRAND.primaryLt : BRAND.bgCardHover,
                    color: walletNetwork === net ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${walletNetwork === net ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  {net === 'all' ? '全部' : net}
                </button>
              ))}
            </div>

            {/* 钱包列表 */}
            <div className="space-y-2">
              {filteredWallets.map((w) => {
                const isRevealed = revealAddresses.has(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => openWalletDrawer(w.id)}
                    className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                    style={{
                      backgroundColor: BRAND.bgCardHover,
                      border: `1px solid ${BRAND.border}`,
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: BRAND.primaryLt }}
                        >
                          <Coins className="w-4 h-4" style={{ color: BRAND.primary }} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{w.network}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{w.asset}</div>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-1.5">
                        <code
                          className="text-[11px] font-mono px-2 py-1 rounded flex-1 truncate"
                          style={{ backgroundColor: BRAND.bgCard, color: BRAND.text }}
                        >
                          {isRevealed ? w.address + ' [展开]' : w.address}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAddress(w.id);
                          }}
                          className="p-1 rounded transition-all"
                          style={{ color: BRAND.textMute }}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(w.address);
                          }}
                          className="p-1 rounded transition-all"
                          style={{ color: BRAND.textMute }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textSub }}>
                        <div className="font-bold">{w.purpose}</div>
                        <div style={{ color: BRAND.textMute }}>{w.signatures}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold">{formatNumber(w.balance)} {w.asset}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>≈ {formatUsd(w.balanceUsd)}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block"
                          style={{
                            backgroundColor: w.status === 'active' ? BRAND.successLt : w.status === 'rotating' ? BRAND.warningLt : BRAND.bgCardHover,
                            color: w.status === 'active' ? BRAND.success : w.status === 'rotating' ? BRAND.warning : BRAND.textMute,
                          }}
                        >
                          {w.status === 'active' ? '活跃' : w.status === 'rotating' ? '轮换中' : '归档'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============== 审计报告 + 风控 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 审计报告 */}
          <div
            className="p-6 md:p-8 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: BRAND.primary }} />
                <h3 className="text-base font-bold">审计报告下载</h3>
              </div>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as any)}
                className="text-[10px] font-bold px-2 py-1 rounded"
                style={{
                  backgroundColor: BRAND.bgCardHover,
                  color: BRAND.text,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                <option value="all">全部类型</option>
                <option value="reserve">储备金审计</option>
                <option value="contract">合约审计</option>
                <option value="financial">财务审计</option>
                <option value="compliance">合规审计</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredAudits.map((report) => (
                <div
                  key={report.id}
                  onClick={() => openAuditDrawer(report.id)}
                  className="p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.primary }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{report.period} · {report.type === 'reserve' ? '储备金审计' : report.type === 'contract' ? '合约审计' : report.type === 'financial' ? '财务审计' : '合规审计'}</div>
                        <div className="text-[10px] flex items-center gap-2" style={{ color: BRAND.textMute }}>
                          <span>{report.auditor}</span>
                          <span>·</span>
                          <span>PDF | {report.fileSize}</span>
                          <span>·</span>
                          <span>{report.publishDate}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0"
                      style={{
                        backgroundColor: report.result === 'passed' ? BRAND.successLt : report.result === 'conditional' ? BRAND.warningLt : BRAND.infoLt,
                        color: report.result === 'passed' ? BRAND.success : report.result === 'conditional' ? BRAND.warning : BRAND.info,
                      }}
                    >
                      {report.result === 'passed' ? '通过' : report.result === 'conditional' ? '附条件' : '审核中'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 风控体系 */}
          <div
            className="p-6 md:p-8 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" style={{ color: BRAND.primary }} />
              <h3 className="text-base font-bold">平台风控体系</h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: <KeyRound className="w-4 h-4" />,
                  title: '多签离线存储',
                  desc: '94% 用户资产存储在地理分布式冷钱包中，需至少 3/5 签名方可授权',
                },
                {
                  icon: <Activity className="w-4 h-4" />,
                  title: '24/7 链上异动监控',
                  desc: '毫秒级风险探测系统，一旦发现异常提现流量立即触发自动熔断机制',
                },
                {
                  icon: <Server className="w-4 h-4" />,
                  title: '风控引擎多重审计',
                  desc: 'AI 风控引擎 + 人工复核 + 外部审计三重保障，异常行为 0 容忍',
                },
                {
                  icon: <Lock className="w-4 h-4" />,
                  title: '保险保障基金',
                  desc: '设立 5 亿美元保险基金，覆盖极端情况下的用户资产兑付',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold mb-1">{item.title}</div>
                    <div className="text-[10px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== 历史快照 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">历史快照时间线</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                最近 6 周储备金快照 · 每周更新
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SNAPSHOTS.map((s, idx) => (
              <div
                key={s.date}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {s.date}
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: s.status === 'audited' ? BRAND.successLt : BRAND.infoLt,
                      color: s.status === 'audited' ? BRAND.success : BRAND.info,
                    }}
                  >
                    {s.status === 'audited' ? '已审计' : '审核中'}
                  </span>
                </div>
                <div className="text-xl font-extrabold font-mono mb-1" style={{ color: BRAND.text }}>
                  {formatUsd(s.totalUsd)}
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                  总储备金
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>BTC</div>
                    <div className="text-xs font-mono font-bold">{formatNumber(s.btcReserve)}</div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>ETH</div>
                    <div className="text-xs font-mono font-bold">{formatNumber(s.ethReserve)}</div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>USDT</div>
                    <div className="text-xs font-mono font-bold">{formatUsd(s.usdtReserve)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== 用户验证教程 ============== */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-1">如何验证您的资产</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                4 步教程 · 全程开源工具 · 约 3 分钟完成
              </p>
            </div>
            <button
              onClick={openMerkleDrawer}
              className="px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}` }}
            >
              <Download className="w-3.5 h-3.5" />
              下载验证工具
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TUTORIAL_STEPS.map((step) => (
              <div
                key={step.id}
                onClick={() => openTutorialDrawer(String(step.id))}
                className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] relative"
                style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
              >
                <div
                  className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                >
                  {step.id}
                </div>
                <h3 className="text-sm font-bold mb-2 mt-2">{step.title}</h3>
                <p className="text-[10px] leading-relaxed mb-3" style={{ color: BRAND.textSub }}>
                  {step.description}
                </p>
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: BRAND.primary }}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {step.duration}
                  </span>
                  <span style={{ color: BRAND.textMute }}>{step.tool}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== 底部 CTA ============== */}
      <section className="px-6 py-12">
        <div
          className="max-w-5xl mx-auto p-8 md:p-12 rounded-3xl text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.bgCard} 0%, ${BRAND.bgCardHover} 100%)`,
            border: `1px solid ${BRAND.primary}33`,
            boxShadow: BRAND.shadowLg,
          }}
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${BRAND.primary} 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">信任，源于透明</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              加入全球透明交易平台
            </h2>
            <p className="text-sm mb-6 max-w-2xl mx-auto" style={{ color: BRAND.textSub }}>
              与 500 万用户共同见证金融级安全保障。每一次储备审计、每一笔链上交易、每一份公开报告，都清晰可查。
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:brightness-110 flex items-center gap-2"
                style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary, boxShadow: BRAND.shadowGold }}
              >
                <Sparkles className="w-4 h-4" /> 立即开始交易
              </button>
              <button
                className="px-6 py-3 rounded-lg font-bold text-sm transition-all border flex items-center gap-2"
                style={{ borderColor: BRAND.border, color: BRAND.text }}
              >
                <FileText className="w-4 h-4" /> 下载完整白皮书
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============== Drawer ============== */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end"
          onClick={closeDrawer}
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: BRAND.bgCard,
              borderLeft: `1px solid ${BRAND.border}`,
              boxShadow: BRAND.shadowLg,
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-bold">
                {drawer.type === 'merkle' && '默克尔树验证'}
                {drawer.type === 'wallet' && drawerWallet && `${drawerWallet.network} 冷钱包详情`}
                {drawer.type === 'audit' && drawerAudit && `${drawerAudit.period} 审计报告`}
                {drawer.type === 'tutorial' && drawerTutorial && `步骤 ${drawerTutorial.id} · ${drawerTutorial.title}`}
              </h3>
              <button onClick={closeDrawer} className="p-1 rounded" style={{ color: BRAND.textSub }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {drawer.type === 'merkle' && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>
                    默克尔树（Merkle Tree）是一种二叉树结构，ZSDEX 将所有用户资产哈希构建成一棵 Merkle Tree，
                    每个用户可以通过验证自己的资产哈希是否包含在树中，来证明自己的资产被平台 1:1 储备。
                  </p>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>
                      验证流程
                    </h4>
                    <ol className="space-y-2 text-xs" style={{ color: BRAND.textSub }}>
                      <li>1. 登录 ZSDEX 账户 → 资产证明页面</li>
                      <li>2. 下载您的资产 Merkle Proof（JSON 格式）</li>
                      <li>3. 运行开源验证工具（Python / Go / Node.js）</li>
                      <li>4. 工具验证您的资产是否在最新 Merkle Root 中</li>
                    </ol>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] font-bold mb-1" style={{ color: BRAND.textMute }}>
                      最新 Merkle Root（示例）
                    </div>
                    <code className="text-[10px] font-mono break-all" style={{ color: BRAND.text }}>
                      0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                    </code>
                  </div>
                  <button
                    className="w-full py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2"
                    style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                  >
                    <Download className="w-4 h-4" /> 下载我的资产证明
                  </button>
                </>
              )}

              {drawerWallet && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>余额</div>
                      <div className="text-base font-mono font-bold">{formatNumber(drawerWallet.balance)} {drawerWallet.asset}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>约合美元</div>
                      <div className="text-base font-mono font-bold">{formatUsd(drawerWallet.balanceUsd)}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>累计交易</div>
                      <div className="text-base font-mono font-bold">{drawerWallet.txCount.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>多签规则</div>
                      <div className="text-base font-bold">{drawerWallet.signatures}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>地址</h4>
                    <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <code className="text-[10px] font-mono flex-1 break-all" style={{ color: BRAND.text }}>{drawerWallet.address}</code>
                      <button onClick={() => copyText(drawerWallet.address)}>
                        <Copy className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>用途</h4>
                    <p className="text-xs">{drawerWallet.purpose}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>首次出现</div>
                      <div className="text-xs font-bold">{drawerWallet.firstSeen}</div>
                    </div>
                    <div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>最近活动</div>
                      <div className="text-xs font-bold">{drawerWallet.lastActivity}</div>
                    </div>
                  </div>
                </>
              )}

              {drawerAudit && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerAudit.summary}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>审计机构</div>
                      <div className="text-sm font-bold">{drawerAudit.auditor}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>报告期间</div>
                      <div className="text-sm font-bold">{drawerAudit.period}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>发布日期</div>
                      <div className="text-sm font-bold">{drawerAudit.publishDate}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>页数</div>
                      <div className="text-sm font-bold">{drawerAudit.pages}</div>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg flex items-center justify-between"
                    style={{
                      backgroundColor: drawerAudit.result === 'passed' ? BRAND.successLt : BRAND.warningLt,
                      border: `1px solid ${drawerAudit.result === 'passed' ? BRAND.success : BRAND.warning}`,
                    }}
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase" style={{ color: drawerAudit.result === 'passed' ? BRAND.success : BRAND.warning }}>
                        审计结果
                      </div>
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                        {drawerAudit.result === 'passed' ? '通过' : drawerAudit.result === 'conditional' ? '附条件通过' : '审核中'}
                      </div>
                    </div>
                    {drawerAudit.result === 'passed' ? (
                      <CheckCircle2 className="w-6 h-6" style={{ color: BRAND.success }} />
                    ) : (
                      <AlertTriangle className="w-6 h-6" style={{ color: BRAND.warning }} />
                    )}
                  </div>
                  <button
                    className="w-full py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110 flex items-center justify-center gap-2"
                    style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                  >
                    <Download className="w-4 h-4" /> 下载完整报告 (PDF, {drawerAudit.fileSize})
                  </button>
                </>
              )}

              {drawerTutorial && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerTutorial.description}</p>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>详细步骤</h4>
                    <ul className="space-y-2">
                      {drawerTutorial.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: BRAND.textSub }}>
                          <ChevR className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BRAND.primary }} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {drawerTutorial.codeExample && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>命令示例</h4>
                      <pre
                        className="p-3 rounded-lg text-[10px] font-mono overflow-x-auto"
                        style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}
                      >
                        {drawerTutorial.codeExample}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 快捷键帮助 ============== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setHelpOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full p-6 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)}>
                <X className="w-5 h-5" style={{ color: BRAND.textSub }} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '?', desc: '打开/关闭快捷键帮助' },
                { key: 'Esc', desc: '关闭抽屉 / 帮助' },
              ].map((kb, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bgCardHover }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{kb.desc}</span>
                  <kbd
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                  >
                    {kb.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 全局样式 */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        tr:hover { background-color: ${BRAND.bgCardHover}; }
      `}</style>
    </div>
  );
}

// ============== KPI Card 子组件 ==============

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  pulse?: boolean;
  color?: 'default' | 'success' | 'warning';
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, pulse, color = 'default' }) => {
  const valueColor = color === 'success' ? BRAND.success : color === 'warning' ? BRAND.warning : BRAND.text;
  return (
    <div
      className="p-4 rounded-xl relative overflow-hidden"
      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
    >
      {pulse && (
        <div
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: BRAND.success,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color: BRAND.primary }}>{icon}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
          {label}
        </div>
      </div>
      <div className="text-xl font-extrabold font-mono" style={{ color: valueColor }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>
          {sub}
        </div>
      )}
    </div>
  );
};
