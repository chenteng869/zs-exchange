'use client';

/**
 * PortalEarn - 收益中心页面（2026-07-19 Q05 P3.8）
 *
 * 页面定位：
 * - 中萨数字科技交易所理财总入口
 * - 4 大子产品：活期理财 / 定期理财 / 质押挖矿 / DeFi 机枪池
 * - 累计收益 / 待领取 / 收益快照 / 收益计算器 / FAQ
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / 4 入口 / 产品列表 / 我的持仓 / 计算器 / FAQ）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键 / 切换产品）
 * - 1+ Drawer（产品详情 / 申购 / 赎回 / 计算器详情）
 * - 1+ 实时数据波动（APY ticker + 收益累计 ticker）
 * - 3+ 动画（Stagger / CountUp / Hover / 进度条增长）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，APY / 累计收益使用 mock 占位
 * - 状态徽章统一枚举：OPEN / BETA / SOON / MAINTENANCE
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - v6 纯黑无色相 + ZSDEX 绿 primary #14B881
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Wallet,
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
  ArrowDownLeft,
  ArrowRight,
  ArrowLeftRight,
  Shield,
  Star,
  Zap,
  Users,
  Percent,
  Activity,
  Coins,
  Banknote,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Network,
  Eye,
  EyeOff,
  Calendar,
  Calculator,
  DollarSign,
  Info,
  Lightbulb,
  Award,
  Target,
  Rocket,
  PiggyBank,
  Lock,
  Unlock,
  Repeat,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type ProductType = 'flexible' | 'fixed' | 'staking' | 'vault';
type RiskLevel = 'low' | 'medium' | 'high';
type TabKey = 'all' | 'flexible' | 'fixed' | 'staking' | 'vault';
type SortKey = 'apy' | 'tvl' | 'subscribers' | 'lockDays' | 'minAmount';

interface EarnProduct {
  id: string;
  name: string;
  asset: string;
  type: ProductType;
  apy: number; // percentage
  apyBase: number; // 基础 APY
  apyBoost?: number; // 加成 APY（如邀请/锁仓）
  minAmount: number;
  maxAmount?: number;
  lockDays: number; // 0 = 活期
  tvl: number; // USDT
  subscribers: number;
  risk: RiskLevel;
  status: 'OPEN' | 'BETA' | 'SOON' | 'MAINTENANCE';
  chain: string;
  description: string;
  features: string[];
  tags?: string[];
  newUntil?: number; // 新上线截止时间
}

interface Position {
  id: string;
  productId: string;
  productName: string;
  asset: string;
  amount: number;
  earned: number;
  pending: number;
  startTime: number;
  endTime: number;
  apy: number;
  status: 'active' | 'redeemable' | 'pending';
}

interface FaqItem {
  q: string;
  a: string;
  category: '基础' | '收益' | '赎回' | '风险';
}

// ============== Mock 数据 ==============

const NOW = Date.now();
const DAY = 24 * 3600_000;

const PRODUCTS: EarnProduct[] = [
  // ===== 活期理财 =====
  {
    id: 'flex-usdt',
    name: 'USDT 活期',
    asset: 'USDT',
    type: 'flexible',
    apy: 4.8,
    apyBase: 4.8,
    minAmount: 100,
    maxAmount: 1_000_000,
    lockDays: 0,
    tvl: 285_000_000,
    subscribers: 38421,
    risk: 'low',
    status: 'OPEN',
    chain: '多链',
    description: '稳定币活期理财，T+0 赎回，按日计息随存随取。',
    features: ['T+0 赎回', '按日计息', '100 USDT 起存', '0 锁仓'],
    tags: ['热门', '稳定币'],
  },
  {
    id: 'flex-usdc',
    name: 'USDC 活期',
    asset: 'USDC',
    type: 'flexible',
    apy: 4.5,
    apyBase: 4.5,
    minAmount: 100,
    maxAmount: 1_000_000,
    lockDays: 0,
    tvl: 156_000_000,
    subscribers: 12834,
    risk: 'low',
    status: 'OPEN',
    chain: '多链',
    description: 'USDC 活期理财，与 USDT 共享流动性池，收益相近。',
    features: ['T+0 赎回', '按日计息', '100 USDC 起存', 'Solana 优先'],
  },
  {
    id: 'flex-btc',
    name: 'BTC 活期',
    asset: 'BTC',
    type: 'flexible',
    apy: 1.8,
    apyBase: 1.8,
    minAmount: 0.01,
    maxAmount: 100,
    lockDays: 0,
    tvl: 88_500_000,
    subscribers: 5821,
    risk: 'low',
    status: 'OPEN',
    chain: 'BTC',
    description: 'BTC 活期理财，借贷市场需求驱动收益。',
    features: ['T+0 赎回', '按日计息', '0.01 BTC 起存', '机构借贷市场'],
  },

  // ===== 定期理财 =====
  {
    id: 'fixed-usdt-30',
    name: 'USDT 30天',
    asset: 'USDT',
    type: 'fixed',
    apy: 8.5,
    apyBase: 6.5,
    apyBoost: 2.0,
    minAmount: 1000,
    maxAmount: 5_000_000,
    lockDays: 30,
    tvl: 425_000_000,
    subscribers: 24521,
    risk: 'low',
    status: 'OPEN',
    chain: '多链',
    description: 'USDT 30天定期理财，阶梯利率 + 邀请加成。',
    features: ['30 天锁仓', '阶梯利率 6.5% + 2% 邀请加成', '1000 USDT 起存', '到期自动续期'],
    tags: ['高收益', '稳定币'],
  },
  {
    id: 'fixed-usdt-90',
    name: 'USDT 90天',
    asset: 'USDT',
    type: 'fixed',
    apy: 12.0,
    apyBase: 10.0,
    apyBoost: 2.0,
    minAmount: 5000,
    maxAmount: 10_000_000,
    lockDays: 90,
    tvl: 386_000_000,
    subscribers: 18421,
    risk: 'low',
    status: 'OPEN',
    chain: '多链',
    description: 'USDT 90天定期理财，较高收益 + 长期稳定。',
    features: ['90 天锁仓', '10% 基础 + 2% 邀请加成', '5000 USDT 起存', '到期自动到账'],
    tags: ['稳健'],
  },
  {
    id: 'fixed-eth-60',
    name: 'ETH 60天',
    asset: 'ETH',
    type: 'fixed',
    apy: 6.5,
    apyBase: 5.5,
    apyBoost: 1.0,
    minAmount: 0.5,
    maxAmount: 5000,
    lockDays: 60,
    tvl: 124_000_000,
    subscribers: 8234,
    risk: 'medium',
    status: 'OPEN',
    chain: 'ERC20',
    description: 'ETH 60天质押收益，含验证节点奖励。',
    features: ['60 天锁仓', '验证节点奖励', '0.5 ETH 起存', '支持 EigenLayer 再质押'],
    tags: ['ETH 2.0'],
  },

  // ===== 质押挖矿 =====
  {
    id: 'stake-treeai',
    name: 'TreeAI 质押',
    asset: 'TAI',
    type: 'staking',
    apy: 18.5,
    apyBase: 15.0,
    apyBoost: 3.5,
    minAmount: 100,
    lockDays: 14,
    tvl: 58_500_000,
    subscribers: 12341,
    risk: 'medium',
    status: 'BETA',
    chain: 'Conflux Core',
    description: '树图 AI 网络原生代币质押，验证节点 + 治理权。',
    features: ['14 天锁仓', '15% 基础 + 3.5% 治理加成', '100 TAI 起存', '可参与链上治理'],
    tags: ['BETA', 'AI', '树图'],
    newUntil: NOW + 15 * DAY,
  },
  {
    id: 'stake-conflux',
    name: 'Conflux 质押',
    asset: 'CFX',
    type: 'staking',
    apy: 9.8,
    apyBase: 8.5,
    apyBoost: 1.3,
    minAmount: 1000,
    lockDays: 7,
    tvl: 95_000_000,
    subscribers: 18421,
    risk: 'medium',
    status: 'OPEN',
    chain: 'Conflux Core',
    description: 'Conflux 网络 PoS 质押，7 天灵活锁仓。',
    features: ['7 天锁仓', '8.5% 基础 + 1.3% 节点加成', '1000 CFX 起存', '每日释放收益'],
    tags: ['树图'],
  },
  {
    id: 'stake-sol',
    name: 'SOL 质押',
    asset: 'SOL',
    type: 'staking',
    apy: 7.2,
    apyBase: 6.5,
    apyBoost: 0.7,
    minAmount: 1,
    lockDays: 14,
    tvl: 168_000_000,
    subscribers: 24521,
    risk: 'medium',
    status: 'OPEN',
    chain: 'Solana',
    description: 'Solana 原生质押，委托给优质验证节点。',
    features: ['14 天解锁', '6.5% 基础 + 0.7% 节点加成', '1 SOL 起存', '支持解质押加速'],
  },

  // ===== DeFi 机枪池 =====
  {
    id: 'vault-stable',
    name: '稳定币机枪池',
    asset: 'USDT+USDC',
    type: 'vault',
    apy: 14.5,
    apyBase: 12.0,
    apyBoost: 2.5,
    minAmount: 500,
    lockDays: 0,
    tvl: 124_000_000,
    subscribers: 8234,
    risk: 'medium',
    status: 'OPEN',
    chain: '多链',
    description: 'AI 策略自动调配 Curve / Aave / Compound 流动性。',
    features: ['AI 策略自动调配', '12% 基础 + 2.5% 治理加成', '500 USDT 起存', 'T+1 赎回'],
    tags: ['AI 策略', '稳定币'],
  },
  {
    id: 'vault-btceth',
    name: 'BTC/ETH 指数池',
    asset: 'BTC+ETH',
    type: 'vault',
    apy: 22.5,
    apyBase: 18.0,
    apyBoost: 4.5,
    minAmount: 0.1,
    lockDays: 0,
    tvl: 65_000_000,
    subscribers: 5821,
    risk: 'high',
    status: 'BETA',
    chain: 'ERC20',
    description: 'BTC/ETH 永续合约网格策略，年化波动率加权。',
    features: ['永续合约网格', '18% 基础 + 4.5% 策略加成', '0.1 BTC/ETH 起存', 'T+1 赎回'],
    tags: ['高收益', '高风险', 'BETA'],
  },
  {
    id: 'vault-meme',
    name: 'Meme 趋势池',
    asset: 'Multi-Meme',
    type: 'vault',
    apy: 35.0,
    apyBase: 30.0,
    minAmount: 1000,
    lockDays: 7,
    tvl: 12_500_000,
    subscribers: 2834,
    risk: 'high',
    status: 'SOON',
    chain: '多链',
    description: 'Meme 币动量策略，AI 趋势识别 + 短线套利。',
    features: ['AI 趋势识别', '7 天锁仓', '1000 USDT 起存', '高风险高收益'],
    tags: ['SOON', '高风险', 'Meme'],
  },
];

const POSITIONS: Position[] = [
  {
    id: 'pos-001',
    productId: 'fixed-usdt-30',
    productName: 'USDT 30天',
    asset: 'USDT',
    amount: 50_000,
    earned: 685.32,
    pending: 0,
    startTime: NOW - 18 * DAY,
    endTime: NOW + 12 * DAY,
    apy: 8.5,
    status: 'active',
  },
  {
    id: 'pos-002',
    productId: 'flex-usdt',
    productName: 'USDT 活期',
    asset: 'USDT',
    amount: 25_000,
    earned: 312.45,
    pending: 0,
    startTime: NOW - 45 * DAY,
    endTime: NOW,
    apy: 4.8,
    status: 'redeemable',
  },
  {
    id: 'pos-003',
    productId: 'stake-conflux',
    productName: 'Conflux 质押',
    asset: 'CFX',
    amount: 15000,
    earned: 285.6,
    pending: 0,
    startTime: NOW - 5 * DAY,
    endTime: NOW + 2 * DAY,
    apy: 9.8,
    status: 'active',
  },
  {
    id: 'pos-004',
    productId: 'vault-stable',
    productName: '稳定币机枪池',
    asset: 'USDT',
    amount: 30_000,
    earned: 1245.8,
    pending: 125.5,
    startTime: NOW - 60 * DAY,
    endTime: NOW,
    apy: 14.5,
    status: 'pending',
  },
];

const FAQS: FaqItem[] = [
  {
    category: '基础',
    q: '什么是 ZSDEX 收益中心？',
    a: '收益中心提供活期理财、定期理财、质押挖矿、DeFi 机枪池四大类收益产品，覆盖稳定币、主流币、树图生态、DeFi 策略等资产。',
  },
  {
    category: '基础',
    q: '活期理财与定期理财的区别？',
    a: '活期理财 T+0 赎回，收益较低但灵活；定期理财有固定锁仓期（7/14/30/60/90天），收益较高但锁仓期内不可赎回。',
  },
  {
    category: '收益',
    q: '收益如何计算？',
    a: '活期理财按日计息（APY/365），收益每日 0:00 UTC 发放；定期理财到期一次性发放；质押挖矿按区块释放，DeFi 机枪池由 AI 策略自动结算。',
  },
  {
    category: '收益',
    q: '邀请加成如何生效？',
    a: '邀请好友参与定期理财，TA 的收益按 2% 加成计算（部分产品），同时你的收益也按 2% 加成。邀请码在「我的-邀请」中获取。',
  },
  {
    category: '赎回',
    q: '定期理财可以提前赎回吗？',
    a: '锁仓期内不支持提前赎回。如有紧急资金需求，可将仓位在「我的持仓」中转给其他用户（需双方确认），平台不收取手续费。',
  },
  {
    category: '赎回',
    q: '活期理财赎回多久到账？',
    a: '活期理财 T+0 实时到账，提交赎回后 5 分钟内到账 USDT 钱包。DeFi 机枪池因策略调整需要 T+1 到账。',
  },
  {
    category: '风险',
    q: '收益中心有哪些风险？',
    a: '主要风险：1) 平台履约风险 2) 智能合约风险 3) 抵押品价格波动 4) 锁仓期内流动性风险 5) 监管政策变化。低风险产品主要面向稳定币，中高风险产品涉及波动资产。',
  },
  {
    category: '风险',
    q: '亏损的可能性有多大？',
    a: '稳定币理财（活期/定期）历史上从未出现本金亏损，但收益会有波动；DeFi 机枪池存在极端情况下的策略亏损可能（历史最大回撤 < 2%）。请根据风险承受能力选择产品。',
  },
];

// ============== 工具函数 ==============

function formatUsdt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(4)}`;
}

function formatAsset(n: number, asset: string): string {
  if (asset === 'USDT' || asset === 'USDC') return formatUsdt(n);
  if (n >= 1) return `${n.toFixed(2)} ${asset}`;
  if (n >= 0.01) return `${n.toFixed(4)} ${asset}`;
  return `${n.toFixed(8)} ${asset}`;
}

function getTypeMeta(type: ProductType) {
  const map = {
    flexible: { label: '活期理财', icon: Repeat, color: BRAND.primary },
    fixed: { label: '定期理财', icon: Lock, color: BRAND.success },
    staking: { label: '质押挖矿', icon: Award, color: BRAND.warning },
    vault: { label: 'DeFi 机枪池', icon: Sparkles, color: '#A78BFA' },
  };
  return map[type];
}

function getRiskMeta(risk: RiskLevel) {
  const map = {
    low: { label: '低风险', color: BRAND.success, dot: BRAND.success },
    medium: { label: '中风险', color: BRAND.warning, dot: BRAND.warning },
    high: { label: '高风险', color: BRAND.danger, dot: BRAND.danger },
  };
  return map[risk];
}

// ============== 主组件 ==============

export function PortalEarn() {
  // ----- Tab -----
  const [tab, setTab] = useState<TabKey>('all');

  // ----- 搜索 / 排序 -----
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ----- 实时数据 -----
  const [products, setProducts] = useState<EarnProduct[]>(PRODUCTS);
  const [positions, setPositions] = useState<Position[]>(POSITIONS);
  const [hideBalance, setHideBalance] = useState(false);

  // ----- Drawer -----
  const [activeProduct, setActiveProduct] = useState<EarnProduct | null>(null);
  const [drawerMode, setDrawerMode] = useState<'detail' | 'subscribe' | 'redeem' | 'calculator' | null>(null);

  // ----- 收益计算器 -----
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [calcDays, setCalcDays] = useState<number>(30);

  // ----- 实时 APY 漂移 + 收益累计 -----
  useEffect(() => {
    const interval = setInterval(() => {
      setProducts((prev) =>
        prev.map((p) => {
          const drift = (Math.random() - 0.5) * 0.15; // ±0.075%
          const newApy = Math.max(0.5, p.apy + drift);
          return { ...p, apy: Number(newApy.toFixed(2)) };
        })
      );
      setPositions((prev) =>
        prev.map((pos) => {
          const inc = (pos.amount * pos.apy) / 100 / 365 / (24 * 60); // 每分钟
          return { ...pos, earned: pos.earned + inc };
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
        document.getElementById('earn-search-input')?.focus();
      }
      if (e.key === 'Escape' && drawerMode) {
        setDrawerMode(null);
      }
      if (!drawerMode) {
        if (e.key === '1') setTab('all');
        if (e.key === '2') setTab('flexible');
        if (e.key === '3') setTab('fixed');
        if (e.key === '4') setTab('staking');
        if (e.key === '5') setTab('vault');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerMode]);

  // ----- 过滤 + 排序 -----
  const filtered = useMemo(() => {
    let list = products;
    if (tab !== 'all') list = list.filter((p) => p.type === tab);
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((p) => p.name.toUpperCase().includes(q) || p.asset.toUpperCase().includes(q) || p.tags?.some((t) => t.toUpperCase().includes(q)));
    }
    return [...list].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return 0;
    });
  }, [products, tab, search, sortKey, sortDir]);

  // ----- 我的收益汇总 -----
  const myStats = useMemo(() => {
    const totalAsset = positions.reduce((s, p) => s + p.amount, 0);
    const totalEarned = positions.reduce((s, p) => s + p.earned, 0);
    const totalPending = positions.reduce((s, p) => s + p.pending, 0);
    const weightedApy = totalAsset > 0 ? positions.reduce((s, p) => s + (p.apy * p.amount), 0) / totalAsset : 0;
    return { totalAsset, totalEarned, totalPending, weightedApy };
  }, [positions]);

  // ----- 计算器 -----
  const calcResult = useMemo(() => {
    const apy = activeProduct?.apy || 8.0;
    const dailyRate = apy / 100 / 365;
    const earned = calcAmount * dailyRate * calcDays;
    return { earned, total: calcAmount + earned, apy };
  }, [calcAmount, calcDays, activeProduct]);

  // ----- 排序切换 -----
  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'apy' || key === 'subscribers' || key === 'tvl' ? 'desc' : 'asc');
    }
  }, [sortKey]);

  // ----- 打开 drawer -----
  const openDrawer = useCallback((mode: typeof drawerMode, product?: EarnProduct) => {
    setDrawerMode(mode);
    if (product) setActiveProduct(product);
  }, []);

  // ============== 子组件 ==============

  const ProductCard = ({ product }: { product: EarnProduct }) => {
    const tm = getTypeMeta(product.type);
    const rm = getRiskMeta(product.risk);
    const TypeIcon = tm.icon;
    return (
      <div
        className="rounded-2xl p-5 transition-all hover:scale-[1.01] hover:shadow-2xl group relative overflow-hidden"
        style={{
          backgroundColor: BRAND.card,
          border: `1px solid ${product.status === 'BETA' ? BRAND.warning + '66' : BRAND.border}`,
        }}
      >
        {product.status === 'BETA' && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.warning} 50%, transparent 100%)` }}
          />
        )}

        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: tm.color + '22', color: tm.color }}
            >
              <TypeIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: BRAND.text }}>
                {product.name}
                {product.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor: tag === 'BETA' || tag === 'SOON' ? 'rgba(255, 169, 64, 0.12)' : 'rgba(20, 184, 129, 0.12)',
                      color: tag === 'BETA' || tag === 'SOON' ? BRAND.warning : BRAND.primary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}>
                <span>{tm.label}</span>
                <span>·</span>
                <span>{product.chain}</span>
              </div>
            </div>
          </div>
          <div
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1"
            style={{
              backgroundColor: rm.color + '22',
              color: rm.color,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rm.dot }} />
            {rm.label}
          </div>
        </div>

        {/* APY 大字 */}
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.textMute }}>
            7天平均年化
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold font-mono" style={{ color: BRAND.success }}>
              {product.apy.toFixed(2)}
            </span>
            <span className="text-base font-extrabold" style={{ color: BRAND.success }}>
              %
            </span>
            {product.apyBoost && (
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                (含 {product.apyBoost}% 加成)
              </span>
            )}
          </div>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              起存
            </div>
            <div className="text-[11px] font-mono font-bold" style={{ color: BRAND.text }}>
              {product.minAmount < 1 ? product.minAmount : product.minAmount.toLocaleString()} {product.asset}
            </div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              锁仓
            </div>
            <div className="text-[11px] font-mono font-bold" style={{ color: BRAND.text }}>
              {product.lockDays === 0 ? '活期' : `${product.lockDays}天`}
            </div>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
              TVL
            </div>
            <div className="text-[11px] font-mono font-bold" style={{ color: BRAND.text }}>
              {formatUsdt(product.tvl)}
            </div>
          </div>
        </div>

        {/* 参与人数 + 状态 */}
        <div className="flex items-center justify-between text-[10px] mb-3">
          <div className="flex items-center gap-1" style={{ color: BRAND.textMute }}>
            <Users className="w-3 h-3" />
            <span>{product.subscribers.toLocaleString()} 人参与</span>
          </div>
          {product.status === 'BETA' && product.newUntil && (
            <div className="flex items-center gap-1" style={{ color: BRAND.warning }}>
              <Sparkles className="w-3 h-3" />
              <span>新上线</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          {product.status === 'OPEN' || product.status === 'BETA' ? (
            <button
              onClick={() => openDrawer('subscribe', product)}
              className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              立即申购
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled
              className="flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
              style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}
            >
              即将开放
            </button>
          )}
          <button
            onClick={() => openDrawer('detail', product)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'transparent', color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}
            aria-label="详情"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const PositionRow = ({ pos }: { pos: Position }) => {
    const daysLeft = Math.max(0, Math.ceil((pos.endTime - NOW) / DAY));
    const totalDays = Math.ceil((pos.endTime - pos.startTime) / DAY);
    const progress = Math.min(100, ((NOW - pos.startTime) / (pos.endTime - pos.startTime)) * 100);
    return (
      <div
        className="rounded-xl p-3 transition-all hover:scale-[1.005]"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
              {pos.productName}
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: pos.status === 'redeemable' ? BRAND.successLt : pos.status === 'pending' ? 'rgba(255, 169, 64, 0.12)' : BRAND.primaryLt,
                  color: pos.status === 'redeemable' ? BRAND.success : pos.status === 'pending' ? BRAND.warning : BRAND.primary,
                }}
              >
                {pos.status === 'active' ? '持仓中' : pos.status === 'redeemable' ? '可赎回' : '结算中'}
              </span>
            </div>
            <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
              {formatAsset(pos.amount, pos.asset)} · APY {pos.apy}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
              已获收益
            </div>
            <div className="text-sm font-extrabold font-mono" style={{ color: BRAND.success }}>
              {hideBalance ? '••••' : `+${formatAsset(pos.earned, pos.asset === 'USDT+USDC' || pos.asset === 'BTC+ETH' || pos.asset === 'Multi-Meme' ? 'USDT' : pos.asset)}`}
            </div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: BRAND.bg }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.success} 100%)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
          <span>剩余 {daysLeft} / {totalDays} 天</span>
          {pos.status === 'redeemable' && (
            <button
              onClick={() => openDrawer('redeem')}
              className="text-[10px] font-bold inline-flex items-center gap-0.5"
              style={{ color: BRAND.success }}
            >
              立即赎回 <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
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
            <span style={{ color: BRAND.textSub }}>收益中心</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <PiggyBank className="w-3 h-3" />
                  Earn Center
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(14, 203, 129, 0.12)', color: BRAND.success }}
                >
                  <Activity className="w-3 h-3" />
                  {positions.length} 持仓中
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: 'rgba(68, 219, 244, 0.12)', color: BRAND.info }}
                >
                  <Users className="w-3 h-3" />
                  {products.reduce((s, p) => s + p.subscribers, 0).toLocaleString()} 累计用户
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: BRAND.text }}>
                收益中心{' '}
                <span style={{ color: BRAND.primary }}>·</span>{' '}
                让闲置资产{' '}
                <span style={{ color: BRAND.success }}>生钱</span>
              </h1>
              <p className="text-base max-w-2xl leading-relaxed mb-6" style={{ color: BRAND.textSub }}>
                活期理财、定期理财、质押挖矿、DeFi 机枪池四大产品线，AI 策略自动调配，机构级风控，T+0/T+1 灵活赎回。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTab('flexible')}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary, boxShadow: BRAND.shadowGold }}
                >
                  <Zap className="w-4 h-4" />
                  立即开始理财
                </button>
                <button
                  onClick={() => openDrawer('calculator')}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-colors"
                  style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                >
                  <Calculator className="w-4 h-4" style={{ color: BRAND.primary }} />
                  收益计算器
                </button>
              </div>
            </div>

            {/* 我的收益卡 */}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
                    MY EARNINGS
                  </div>
                  <button
                    onClick={() => setHideBalance((v) => !v)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                  >
                    {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                    累计收益
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono" style={{ color: BRAND.success }}>
                      {hideBalance ? '••••••' : `+${myStats.totalEarned.toFixed(2)}`}
                    </span>
                    <span className="text-sm font-mono" style={{ color: BRAND.textMute }}>
                      USDT
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      持仓本金
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                      {hideBalance ? '••••' : `$${formatUsdt(myStats.totalAsset).slice(1)}`}
                    </div>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      加权 APY
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.primary }}>
                      {myStats.weightedApy.toFixed(2)}%
                    </div>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: BRAND.bg }}>
                    <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                      待领取
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.warning }}>
                      {hideBalance ? '••••' : `$${myStats.totalPending.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. 4 大产品类型入口 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'flexible' as const, label: '活期理财', desc: 'T+0 赎回 灵活存取', icon: Repeat, color: BRAND.primary, range: '1.8% - 4.8%' },
            { key: 'fixed' as const, label: '定期理财', desc: '高收益 阶梯利率', icon: Lock, color: BRAND.success, range: '6.5% - 12.0%' },
            { key: 'staking' as const, label: '质押挖矿', desc: '节点奖励 治理权', icon: Award, color: BRAND.warning, range: '7.2% - 18.5%' },
            { key: 'vault' as const, label: 'DeFi 机枪池', desc: 'AI 策略 自动调配', icon: Sparkles, color: '#A78BFA', range: '14.5% - 35.0%' },
          ].map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.key}
                onClick={() => setTab(entry.key)}
                className="rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: tab === entry.key ? entry.color + '22' : BRAND.card,
                  border: `1px solid ${tab === entry.key ? entry.color : BRAND.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: entry.color + '22', color: entry.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
                </div>
                <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
                  {entry.label}
                </div>
                <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>
                  {entry.desc}
                </div>
                <div className="text-[10px] font-mono" style={{ color: entry.color }}>
                  {entry.range}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== 3. 产品列表 + Tab + 搜索 + 排序 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { key: 'all' as const, label: '全部', count: products.length, icon: Layers },
              { key: 'flexible' as const, label: '活期', count: products.filter((p) => p.type === 'flexible').length, icon: Repeat },
              { key: 'fixed' as const, label: '定期', count: products.filter((p) => p.type === 'fixed').length, icon: Lock },
              { key: 'staking' as const, label: '质押', count: products.filter((p) => p.type === 'staking').length, icon: Award },
              { key: 'vault' as const, label: '机枪池', count: products.filter((p) => p.type === 'vault').length, icon: Sparkles },
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
                    {t.key === 'all' ? '1' : t.key === 'flexible' ? '2' : t.key === 'fixed' ? '3' : t.key === 'staking' ? '4' : '5'}
                  </kbd>
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 h-9 px-3 rounded-lg"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, minWidth: 220 }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
            <input
              id="earn-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索产品 / 资产 / 标签…"
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
        </div>

        {/* 排序行 */}
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 mb-4"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest flex-wrap" style={{ color: BRAND.textMute }}>
            <span>排序：</span>
            {[
              { key: 'apy' as const, label: 'APY' },
              { key: 'tvl' as const, label: 'TVL' },
              { key: 'subscribers' as const, label: '参与人数' },
              { key: 'lockDays' as const, label: '锁仓期' },
              { key: 'minAmount' as const, label: '起存金额' },
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
            共 {filtered.length} 个产品
          </div>
        </div>

        {/* 产品列表 */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.textMute }} />
            <p className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
              暂无匹配产品
            </p>
            <p className="text-xs" style={{ color: BRAND.textSub }}>
              尝试其他关键词或切换 Tab
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== 4. 我的持仓 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
              MY POSITIONS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              我的持仓 ({positions.length})
            </h2>
          </div>
          <a href="#" className="text-xs font-bold inline-flex items-center gap-1" style={{ color: BRAND.primary }}>
            查看全部 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {positions.map((p) => (
            <PositionRow key={p.id} pos={p} />
          ))}
        </div>
      </section>

      {/* ===== 5. 收益计算器 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div
          className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.card} 0%, ${BRAND.cardElevated} 100%)`,
            border: `1px solid ${BRAND.primary}33`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.primary} 50%, transparent 100%)` }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4" style={{ color: BRAND.primary }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
                  EARNINGS CALCULATOR
                </span>
              </div>
              <h2 className="text-2xl font-extrabold mb-1" style={{ color: BRAND.text }}>
                收益计算器
              </h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>
                输入投资金额与期限，预估可获得收益
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                    投资金额 (USDT)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                      className="flex-1 h-11 px-3 rounded-lg text-base font-mono font-bold outline-none"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    />
                    <div className="flex gap-1">
                      {[1000, 10000, 100000].map((v) => (
                        <button
                          key={v}
                          onClick={() => setCalcAmount(v)}
                          className="h-11 px-3 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                        >
                          {v >= 1000 ? `${v / 1000}K` : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                    投资期限 (天)
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[7, 14, 30, 60, 90, 180].map((d) => (
                      <button
                        key={d}
                        onClick={() => setCalcDays(d)}
                        className="h-9 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: calcDays === d ? BRAND.primaryLt : BRAND.bg,
                          color: calcDays === d ? BRAND.primary : BRAND.textSub,
                          border: `1px solid ${calcDays === d ? BRAND.primary : BRAND.border}`,
                        }}
                      >
                        {d}天
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                    APY 假设 ({calcResult.apy.toFixed(2)}%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={calcResult.apy}
                    onChange={(e) => {
                      // 这里简化处理，不联动 product
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
              <div
                className="rounded-2xl p-5 text-center"
                style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.primary}55` }}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                  预计获得收益
                </div>
                <div className="text-4xl font-extrabold font-mono mb-1" style={{ color: BRAND.success }}>
                  +{calcResult.earned.toFixed(2)}
                </div>
                <div className="text-sm font-mono" style={{ color: BRAND.textMute }}>
                  USDT · {calcDays} 天
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                    本金
                  </div>
                  <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                    {calcAmount.toLocaleString()} USDT
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                    到账总额
                  </div>
                  <div className="text-sm font-mono font-bold" style={{ color: BRAND.success }}>
                    {(calcAmount + calcResult.earned).toFixed(2)} USDT
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTab('flexible')}
                className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
              >
                选择产品申购
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. FAQ ===== */}
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
              收益数据为 mock 占位
            </div>
            <div className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
              本页所有 APY、累计收益、产品参数均为 mock 占位示例，仅用于界面演示。
              实际收益以平台结算为准，DeFi 产品存在智能合约风险与策略亏损可能，请根据风险承受能力审慎参与。
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. Drawer ===== */}
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
                {drawerMode === 'detail' && activeProduct && <><Eye className="w-4 h-4" style={{ color: BRAND.primary }} />{activeProduct.name}</>}
                {drawerMode === 'subscribe' && <><Zap className="w-4 h-4" style={{ color: BRAND.primary }} />申购产品</>}
                {drawerMode === 'redeem' && <><Unlock className="w-4 h-4" style={{ color: BRAND.success }} />赎回持仓</>}
                {drawerMode === 'calculator' && <><Calculator className="w-4 h-4" style={{ color: BRAND.primary }} />收益计算器</>}
              </h3>
              <button
                onClick={() => setDrawerMode(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* detail */}
              {drawerMode === 'detail' && activeProduct && (
                <>
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: getTypeMeta(activeProduct.type).color + '22', color: getTypeMeta(activeProduct.type).color }}
                      >
                        {React.createElement(getTypeMeta(activeProduct.type).icon, { className: 'w-6 h-6' })}
                      </div>
                      <div>
                        <div className="text-base font-extrabold" style={{ color: BRAND.text }}>
                          {activeProduct.name}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          {getTypeMeta(activeProduct.type).label} · {activeProduct.chain}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                      {activeProduct.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'APY', value: `${activeProduct.apy.toFixed(2)}%` },
                      { label: '起存', value: `${activeProduct.minAmount} ${activeProduct.asset}` },
                      { label: '锁仓', value: activeProduct.lockDays === 0 ? '活期' : `${activeProduct.lockDays}天` },
                      { label: 'TVL', value: formatUsdt(activeProduct.tvl) },
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
                      产品特性
                    </div>
                    <ul className="space-y-1.5 text-xs" style={{ color: BRAND.textSub }}>
                      {activeProduct.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.primary }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(activeProduct.status === 'OPEN' || activeProduct.status === 'BETA') && (
                    <button
                      onClick={() => setDrawerMode('subscribe')}
                      className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                    >
                      立即申购
                    </button>
                  )}
                </>
              )}

              {/* subscribe */}
              {drawerMode === 'subscribe' && activeProduct && (
                <>
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}33` }}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.warning }} />
                    <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      申购前请确认产品风险等级与锁仓期。锁仓期内不可提前赎回，平台不保证收益。
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                      当前 APY
                    </div>
                    <div className="text-2xl font-extrabold font-mono" style={{ color: BRAND.success }}>
                      {activeProduct.apy.toFixed(2)}%
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                      {activeProduct.lockDays === 0 ? '活期 T+0 赎回' : `${activeProduct.lockDays}天锁仓`} · 起存 {activeProduct.minAmount} {activeProduct.asset}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                      申购数量
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={`最低 ${activeProduct.minAmount}`}
                        className="flex-1 h-11 px-3 rounded-lg text-sm font-mono outline-none"
                        style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                      />
                      <button
                        className="h-11 px-3 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
                      >
                        全部
                      </button>
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-3 text-xs space-y-1.5"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>预计日收益</span>
                      <span className="font-mono">~{((activeProduct.apy / 100 / 365) * 10000).toFixed(2)} / 1万 USDT</span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>风险等级</span>
                      <span className="font-mono" style={{ color: getRiskMeta(activeProduct.risk).color }}>
                        {getRiskMeta(activeProduct.risk).label}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>锁仓期</span>
                      <span className="font-mono">{activeProduct.lockDays === 0 ? '活期' : `${activeProduct.lockDays} 天`}</span>
                    </div>
                  </div>

                  <button
                    className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                  >
                    确认申购
                  </button>
                </>
              )}

              {/* redeem */}
              {drawerMode === 'redeem' && (
                <>
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ backgroundColor: 'rgba(14, 203, 129, 0.08)', border: `1px solid ${BRAND.success}33` }}
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.success }} />
                    <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      您有可赎回的持仓。赎回后资金将原路返回钱包可用余额。
                    </div>
                  </div>

                  <div className="space-y-2">
                    {positions.filter((p) => p.status === 'redeemable').map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl p-3"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                            {p.productName}
                          </div>
                          <div className="text-sm font-mono font-bold" style={{ color: BRAND.success }}>
                            {formatAsset(p.amount + p.earned, p.asset)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                          <span>本金 {formatAsset(p.amount, p.asset)} + 收益 {formatAsset(p.earned, p.asset)}</span>
                          <button
                            className="font-bold"
                            style={{ color: BRAND.success }}
                          >
                            立即赎回
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* calculator */}
              {drawerMode === 'calculator' && (
                <>
                  <div className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
                    快速预估不同金额与期限下的收益表现。详细对比请使用页面内的计算器。
                  </div>
                  <div className="space-y-3">
                    {[10000, 50000, 100000, 500000].map((amount) => {
                      const apy = 8.5;
                      const dailyRate = apy / 100 / 365;
                      const d30 = amount * dailyRate * 30;
                      const d90 = amount * dailyRate * 90;
                      return (
                        <div
                          key={amount}
                          className="rounded-xl p-3"
                          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                              {amount.toLocaleString()} USDT
                            </div>
                            <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                              APY {apy}%
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="rounded p-2" style={{ backgroundColor: BRAND.cardElevated }}>
                              <div style={{ color: BRAND.textMute }}>30 天</div>
                              <div className="font-mono font-bold" style={{ color: BRAND.success }}>
                                +{d30.toFixed(2)}
                              </div>
                            </div>
                            <div className="rounded p-2" style={{ backgroundColor: BRAND.cardElevated }}>
                              <div style={{ color: BRAND.textMute }}>90 天</div>
                              <div className="font-mono font-bold" style={{ color: BRAND.success }}>
                                +{d90.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalEarn;
