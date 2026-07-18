'use client';

/**
 * PortalWallet - 钱包总览（2026-07-19 Q05 P3.5）
 *
 * 页面定位：
 * - 中萨数字科技交易所钱包总览入口
 * - 6 个子模块：总资产 / 充值 / 提现 / 资金流水 / 地址管理 / 安全中心
 * - 多币种余额 + 资产分布 + 充值网络 + 最近流水
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / 快捷 / 资产分布 / 多币种 / 充值网络 / 流水 / 安全）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键 / 隐藏小额）
 * - 1+ Drawer（资产详情 / 充值网络 / 提现说明）
 * - 1+ 实时数据波动（余额估值 ticker 2-5s 漂移）
 * - 3+ 动画（Stagger / CountUp / Hover / 涨跌色闪）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，余额/价格使用 mock 占位
 * - 状态徽章统一枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Wallet,
  Plus,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  Info,
  Copy,
  Shield,
  Clock,
  RefreshCw,
  Send,
  Download,
  BookOpen,
  Activity,
  Percent,
  CircleDot,
  CircleDashed,
  CheckCircle2,
  Globe2,
  Network,
  Bitcoin,
  Coins,
  Keyboard,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type AssetCategory = 'major' | 'stable' | 'defi' | 'layer2' | 'meme' | 'treegraph' | 'other';
type SortKey = 'rank' | 'name' | 'balance' | 'valueUsdt' | 'change' | 'allocation';
type SortDir = 'asc' | 'desc';
type FilterKey = 'all' | AssetCategory;
type TimeRange = '24h' | '7d' | '30d' | 'all';

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  priceUsdt: number;
  change24h: number;
  allocation: number; // 占比 %
  category: AssetCategory;
  available: number;
  frozen: number;
  rank: number;
  networks: string[];
}

interface FlowRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'transfer' | 'reward';
  asset: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  network: string;
  time: string;
  hash?: string;
}

// ============== Mock 数据（不接真实 API）==============

const ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.4523, priceUsdt: 96800, change24h: 2.34, allocation: 32.5, category: 'major', available: 0.4523, frozen: 0, rank: 1, networks: ['BTC', 'Lightning'] },
  { symbol: 'ETH', name: 'Ethereum', balance: 5.823, priceUsdt: 3450, change24h: 3.12, allocation: 14.9, category: 'major', available: 5.0, frozen: 0.823, rank: 2, networks: ['ERC20', 'Layer2'] },
  { symbol: 'USDT', name: 'Tether', balance: 28500, priceUsdt: 1.0, change24h: 0.01, allocation: 21.1, category: 'stable', available: 25000, frozen: 3500, rank: 3, networks: ['ERC20', 'TRC20', 'Conflux Core', 'BSC'] },
  { symbol: 'USDC', name: 'USD Coin', balance: 8500, priceUsdt: 1.0, change24h: -0.01, allocation: 6.3, category: 'stable', available: 8500, frozen: 0, rank: 4, networks: ['ERC20', 'Solana'] },
  { symbol: 'BNB', name: 'BNB', balance: 12.5, priceUsdt: 720, change24h: 1.56, allocation: 0.7, category: 'major', available: 12.5, frozen: 0, rank: 5, networks: ['BEP20'] },
  { symbol: 'SOL', name: 'Solana', balance: 85, priceUsdt: 178, change24h: 5.23, allocation: 1.1, category: 'major', available: 80, frozen: 5, rank: 6, networks: ['Solana'] },
  { symbol: 'TREEG', name: 'TreeGraph', balance: 5200, priceUsdt: 1.85, change24h: 12.45, allocation: 7.1, category: 'treegraph', available: 5000, frozen: 200, rank: 7, networks: ['Conflux Core'] },
  { symbol: 'CFX', name: 'Conflux', balance: 12000, priceUsdt: 0.18, change24h: 4.85, allocation: 1.6, category: 'treegraph', available: 11000, frozen: 1000, rank: 8, networks: ['Conflux Core'] },
  { symbol: 'UNI', name: 'Uniswap', balance: 145, priceUsdt: 14.2, change24h: -0.85, allocation: 1.5, category: 'defi', available: 145, frozen: 0, rank: 9, networks: ['ERC20'] },
  { symbol: 'LINK', name: 'Chainlink', balance: 285, priceUsdt: 23.5, change24h: 1.92, allocation: 5.0, category: 'defi', available: 285, frozen: 0, rank: 10, networks: ['ERC20'] },
  { symbol: 'AVAX', name: 'Avalanche', balance: 78, priceUsdt: 38.5, change24h: 4.21, allocation: 2.2, category: 'layer2', available: 78, frozen: 0, rank: 11, networks: ['C-Chain'] },
  { symbol: 'MATIC', name: 'Polygon', balance: 3200, priceUsdt: 0.55, change24h: 2.78, allocation: 1.3, category: 'layer2', available: 3200, frozen: 0, rank: 12, networks: ['Polygon'] },
  { symbol: 'ARB', name: 'Arbitrum', balance: 580, priceUsdt: 0.92, change24h: -2.78, allocation: 0.4, category: 'layer2', available: 580, frozen: 0, rank: 13, networks: ['Arbitrum One'] },
  { symbol: 'OP', name: 'Optimism', balance: 420, priceUsdt: 2.15, change24h: 1.85, allocation: 0.7, category: 'layer2', available: 420, frozen: 0, rank: 14, networks: ['Optimism'] },
  { symbol: 'DOGE', name: 'Dogecoin', balance: 8500, priceUsdt: 0.32, change24h: 8.12, allocation: 2.0, category: 'meme', available: 8500, frozen: 0, rank: 15, networks: ['Dogecoin'] },
  { symbol: 'PEPE', name: 'Pepe', balance: 285000000, priceUsdt: 0.0000123, change24h: 12.45, allocation: 0.3, category: 'meme', available: 285000000, frozen: 0, rank: 16, networks: ['ERC20'] },
  { symbol: 'SHIB', name: 'Shiba Inu', balance: 5200000, priceUsdt: 0.0000245, change24h: -3.45, allocation: 0.1, category: 'meme', available: 5200000, frozen: 0, rank: 17, networks: ['ERC20'] },
  { symbol: 'DOT', name: 'Polkadot', balance: 285, priceUsdt: 7.85, change24h: -3.12, allocation: 1.7, category: 'layer2', available: 285, frozen: 0, rank: 18, networks: ['Polkadot'] },
];

const FLOWS: FlowRecord[] = [
  { id: 'F-2026-0719-001', type: 'deposit', asset: 'USDT', amount: 5000, status: 'success', network: 'TRC20', time: '2026-07-19 14:32' },
  { id: 'F-2026-0719-002', type: 'trade', asset: 'BTC', amount: -0.0125, status: 'success', network: 'Spot', time: '2026-07-19 11:15' },
  { id: 'F-2026-0719-003', type: 'withdraw', asset: 'ETH', amount: -1.5, status: 'pending', network: 'ERC20', time: '2026-07-19 09:48' },
  { id: 'F-2026-0718-004', type: 'reward', asset: 'TREEG', amount: 25.5, status: 'success', network: 'Earn', time: '2026-07-18 23:00' },
  { id: 'F-2026-0718-005', type: 'transfer', asset: 'USDC', amount: -2000, status: 'success', network: 'Internal', time: '2026-07-18 18:20' },
  { id: 'F-2026-0718-006', type: 'deposit', asset: 'BTC', amount: 0.15, status: 'success', network: 'BTC', time: '2026-07-18 15:42' },
  { id: 'F-2026-0718-007', type: 'trade', asset: 'ETH', amount: 0.5, status: 'success', network: 'Spot', time: '2026-07-18 13:08' },
  { id: 'F-2026-0717-008', type: 'withdraw', asset: 'USDT', amount: -1500, status: 'failed', network: 'ERC20', time: '2026-07-17 22:15' },
];

const NETWORKS = [
  { key: 'conflux', label: 'Conflux Core', desc: '树图公链主网，约 1 分钟到账', fee: '0 CFX', time: '~1 min', status: 'OPEN' as const },
  { key: 'erc20', label: 'ERC20 (Ethereum)', desc: '以太坊主网，约 5-15 分钟到账', fee: '~$3.5', time: '~5-15 min', status: 'OPEN' as const },
  { key: 'trc20', label: 'TRC20 (Tron)', desc: '波场主网，约 2 分钟到账', fee: '1 TRX', time: '~2 min', status: 'OPEN' as const },
  { key: 'bsc', label: 'BSC (BEP20)', desc: '币安智能链，约 3 分钟到账', fee: '~$0.8', time: '~3 min', status: 'OPEN' as const },
  { key: 'solana', label: 'Solana', desc: 'Solana 主网，约 30 秒到账', fee: '~$0.01', time: '~30s', status: 'OPEN' as const },
  { key: 'lightning', label: 'Bitcoin Lightning', desc: '闪电网络，即时到账', fee: '< $0.01', time: '~instant', status: 'BETA' as const },
];

// ============== 子组件 ==============

function QuickAction({
  icon: Icon,
  label,
  desc,
  href,
  status,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  status?: keyof typeof STATUS;
}) {
  const s = status ? STATUS[status] : null;
  return (
    <a
      href={href}
      className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] block group"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {s && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
            style={{ backgroundColor: s.bg, color: s.color }}
          >
            {s.label}
          </span>
        )}
      </div>
      <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
        {label}
      </div>
      <div className="text-[10px]" style={{ color: BRAND.textMute }}>
        {desc}
      </div>
    </a>
  );
}

function NetworkRow({
  net,
  selected,
  onClick,
}: {
  net: typeof NETWORKS[number];
  selected: boolean;
  onClick: () => void;
}) {
  const s = STATUS[net.status];
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-3 flex items-center justify-between text-left transition-all"
      style={{
        backgroundColor: selected ? BRAND.primaryLt : BRAND.card,
        border: `1px solid ${selected ? BRAND.primary : BRAND.border}`,
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: selected ? BRAND.primary : BRAND.bgAlt, color: selected ? BRAND.onPrimary : BRAND.textMute }}
        >
          <Network className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold" style={{ color: BRAND.text }}>
              {net.label}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.label}
            </span>
          </div>
          <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>
            {net.desc}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className="text-[10px] font-mono" style={{ color: BRAND.textSub }}>
          {net.time}
        </div>
        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
          {net.fee}
        </div>
      </div>
    </button>
  );
}

function FlowRow({ flow }: { flow: FlowRecord }) {
  const typeMap = {
    deposit: { icon: ArrowDownLeft, color: BRAND.success, label: '充值' },
    withdraw: { icon: ArrowUpRight, color: BRAND.warning, label: '提现' },
    trade: { icon: ArrowLeftRight, color: BRAND.info, label: '交易' },
    transfer: { icon: ArrowLeftRight, color: BRAND.textSub, label: '转账' },
    reward: { icon: Sparkles, color: BRAND.primary, label: '奖励' },
  };
  const t = typeMap[flow.type];
  const Icon = t.icon;
  const statusMap = {
    success: { color: BRAND.success, label: '成功', Icon: CheckCircle2 },
    pending: { color: BRAND.warning, label: '处理中', Icon: CircleDashed },
    failed: { color: BRAND.danger, label: '失败', Icon: AlertTriangle },
  };
  const st = statusMap[flow.status];
  const StatusIcon = st.Icon;
  return (
    <div
      className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs hover:bg-opacity-50 transition-colors"
      style={{ borderBottom: `1px solid ${BRAND.borderLt}` }}
    >
      <div className="col-span-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${t.color}22`, color: t.color }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="col-span-3">
        <div className="font-bold" style={{ color: BRAND.text }}>
          {t.label}
        </div>
        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
          {flow.network}
        </div>
      </div>
      <div className="col-span-3 text-right font-mono font-bold" style={{ color: flow.amount < 0 ? BRAND.text : BRAND.success }}>
        {flow.amount > 0 ? '+' : ''}
        {flow.amount < 0.01 ? flow.amount.toFixed(8) : flow.amount.toFixed(4)} {flow.asset}
      </div>
      <div className="col-span-2 text-right">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5"
          style={{ backgroundColor: `${st.color}22`, color: st.color }}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          {st.label}
        </span>
      </div>
      <div className="col-span-3 text-right text-[10px] font-mono" style={{ color: BRAND.textMute }}>
        {flow.time}
      </div>
    </div>
  );
}

function AllocationBar({ segments }: { segments: { name: string; pct: number; color: string }[] }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: BRAND.bg }}>
      {segments.map((s, i) => (
        <div
          key={i}
          className="h-full"
          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
          title={`${s.name} ${s.pct}%`}
        />
      ))}
    </div>
  );
}

// ============== 主组件 ==============

export function PortalWallet() {
  // ----- 状态 -----
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [hideBalance, setHideBalance] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedNet, setSelectedNet] = useState<string>('conflux');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [drawerMode, setDrawerMode] = useState<'deposit' | 'withdraw' | 'asset' | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ----- 实时估值漂移 -----
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prev) =>
        prev.map((a) => {
          const drift = (Math.random() - 0.5) * 0.003;
          return { ...a, priceUsdt: Math.max(0.0000001, a.priceUsdt * (1 + drift)) };
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
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (drawerMode) setDrawerMode(null);
        else if (document.activeElement === searchInputRef.current) searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerMode]);

  // ----- 过滤 + 排序 -----
  const filtered = useMemo(() => {
    let list = assets;
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((a) => a.symbol.includes(q) || a.name.toUpperCase().includes(q));
    }
    if (filter !== 'all') {
      list = list.filter((a) => a.category === filter);
    }
    const sorted = [...list].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return 0;
    });
    return sorted;
  }, [assets, search, filter, sortKey, sortDir]);

  // ----- 汇总 -----
  const totalValueUsdt = useMemo(
    () => assets.reduce((s, a) => s + a.balance * a.priceUsdt, 0),
    [assets]
  );
  const totalAvailable = useMemo(
    () => assets.reduce((s, a) => s + a.available * a.priceUsdt, 0),
    [assets]
  );
  const totalFrozen = useMemo(
    () => assets.reduce((s, a) => s + a.frozen * a.priceUsdt, 0),
    [assets]
  );
  const change24h = useMemo(() => {
    const weighted = assets.reduce((s, a) => {
      const value = a.balance * a.priceUsdt;
      return s + (a.change24h * value) / 100;
    }, 0);
    return totalValueUsdt > 0 ? (weighted / totalValueUsdt) * 100 : 0;
  }, [assets, totalValueUsdt]);
  const pnl24hUsdt = useMemo(() => (change24h / 100) * totalValueUsdt, [change24h, totalValueUsdt]);

  // ----- 资产分布 -----
  const allocation = useMemo(() => {
    const segMap: Record<string, { name: string; pct: number; color: string }> = {
      major: { name: '主流币', pct: 0, color: BRAND.primary },
      stable: { name: '稳定币', pct: 0, color: BRAND.info },
      defi: { name: 'DeFi', pct: 0, color: '#8B5CF6' },
      layer2: { name: 'L2', pct: 0, color: BRAND.warning },
      meme: { name: 'Meme', pct: 0, color: '#EC4899' },
      treegraph: { name: '树图生态', pct: 0, color: BRAND.success },
      other: { name: '其他', pct: 0, color: BRAND.textMute },
    };
    const total = totalValueUsdt || 1;
    for (const a of assets) {
      const v = a.balance * a.priceUsdt;
      const seg = segMap[a.category];
      seg.pct += (v / total) * 100;
    }
    return Object.values(segMap).filter((s) => s.pct > 0.01).sort((a, b) => b.pct - a.pct);
  }, [assets, totalValueUsdt]);

  // ----- 操作 -----
  const openDrawer = useCallback((mode: typeof drawerMode, asset?: Asset) => {
    setDrawerMode(mode);
    if (asset) setActiveAsset(asset);
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const fmtUsdt = (v: number) => {
    if (hideBalance) return '••••••';
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(4);
    return v.toFixed(8);
  };

  const fmtCny = (v: number) => {
    if (hideBalance) return '••••••';
    return (v * 7.21).toFixed(2);
  };

  // ============== 渲染 ==============

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero：总资产 + 24h 涨跌 ===== */}
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
            backgroundImage: `radial-gradient(circle at 25% 25%, ${BRAND.primary}11 0%, transparent 50%), radial-gradient(circle at 75% 60%, ${BRAND.success}08 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  钱包总览
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
                  {assets.length} 个币种 · 6 充值网络
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: BRAND.text }}>
                资产总览
              </h1>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                实时资产估值、余额分布、资金流水与链上记录
              </p>
            </div>
            <button
              onClick={() => setHideBalance((v) => !v)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-bold transition-colors"
              style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {hideBalance ? '显示余额' : '隐藏余额'}
            </button>
          </div>

          {/* 总资产卡片 */}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                  总资产估值
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl md:text-4xl font-extrabold font-mono" style={{ color: BRAND.text }}>
                    {fmtUsdt(totalValueUsdt)}
                  </span>
                  <span className="text-sm font-mono" style={{ color: BRAND.textMute }}>
                    USDT
                  </span>
                </div>
                <div className="text-xs font-mono" style={{ color: BRAND.textMute }}>
                  ≈ ¥{fmtCny(totalValueUsdt)} CNY
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                  24h 涨跌
                </div>
                <div
                  className="text-2xl font-extrabold font-mono flex items-center gap-1.5"
                  style={{ color: change24h >= 0 ? BRAND.success : BRAND.danger }}
                >
                  {change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {change24h >= 0 ? '+' : ''}
                  {change24h.toFixed(2)}%
                </div>
                <div
                  className="text-xs font-mono"
                  style={{ color: pnl24hUsdt >= 0 ? BRAND.success : BRAND.danger }}
                >
                  {pnl24hUsdt >= 0 ? '+' : ''}
                  {fmtUsdt(pnl24hUsdt)} USDT
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                  可用余额
                </div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: BRAND.text }}>
                  {fmtUsdt(totalAvailable)}
                </div>
                <div className="text-xs font-mono" style={{ color: BRAND.textMute }}>
                  USDT
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                  冻结余额
                </div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: BRAND.warning }}>
                  {fmtUsdt(totalFrozen)}
                </div>
                <div className="text-xs font-mono" style={{ color: BRAND.textMute }}>
                  USDT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. 快捷操作 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => openDrawer('deposit')}
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
            style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
          >
            <ArrowDownLeft className="w-5 h-5 mb-2" />
            <div className="text-sm font-bold mb-0.5">充值</div>
            <div className="text-[10px] opacity-90">6 主流网络</div>
          </button>
          <button
            onClick={() => openDrawer('withdraw')}
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
          >
            <ArrowUpRight className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold mb-0.5">提现</div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>2FA + 地址簿</div>
          </button>
          <a
            href="#"
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] block"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <ArrowLeftRight className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>兑换</div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>币币互转</div>
          </a>
          <a
            href="#"
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] block"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <BookOpen className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>资金流水</div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>最近 30 天</div>
          </a>
          <a
            href="#"
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] block"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <Network className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>地址管理</div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>白名单 / 备注</div>
          </a>
          <a
            href="#"
            className="rounded-2xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98] block"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <Shield className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>安全中心</div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>2FA / KYC</div>
          </a>
        </div>
      </section>

      {/* ===== 3. 资产分布 + 充值网络 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 资产分布 */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
                  ALLOCATION
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: BRAND.text }}>
                  资产分布
                </h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                按 USDT 估值
              </span>
            </div>
            <AllocationBar segments={allocation} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {allocation.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span style={{ color: BRAND.textSub }}>{s.name}</span>
                  <span className="ml-auto font-mono font-bold" style={{ color: BRAND.text }}>
                    {s.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 充值网络 */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
                  DEPOSIT NETWORKS
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: BRAND.text }}>
                  充值网络
                </h2>
              </div>
              <button
                onClick={() => openDrawer('deposit')}
                className="text-[10px] font-bold inline-flex items-center gap-1"
                style={{ color: BRAND.primary }}
              >
                充值详情 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {NETWORKS.map((n) => (
                <NetworkRow
                  key={n.key}
                  net={n}
                  selected={selectedNet === n.key}
                  onClick={() => setSelectedNet(n.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. 多币种余额表 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
              ASSETS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              资产列表
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-2 h-9 px-3 rounded-lg"
              style={{
                backgroundColor: BRAND.card,
                border: `1px solid ${searchFocused ? BRAND.primary : BRAND.border}`,
                minWidth: 180,
              }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="搜索币种…"
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
        </div>

        {/* 分类 Tab */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: '全部', icon: Layers },
            { key: 'major' as const, label: '主流币', icon: Bitcoin },
            { key: 'stable' as const, label: '稳定币', icon: Coins },
            { key: 'defi' as const, label: 'DeFi', icon: Activity },
            { key: 'layer2' as const, label: 'L2', icon: Globe2 },
            { key: 'meme' as const, label: 'Meme', icon: Sparkles },
            { key: 'treegraph' as const, label: '树图生态', icon: Network },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0"
                style={{
                  backgroundColor: active ? BRAND.primaryLt : 'transparent',
                  color: active ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
                }}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 资产表 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div
            className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute, borderBottom: `1px solid ${BRAND.border}` }}
          >
            <button onClick={() => toggleSort('rank')} className="col-span-1 text-left flex items-center gap-1 hover:text-white">
              #
              {sortKey === 'rank' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button onClick={() => toggleSort('name')} className="col-span-2 text-left flex items-center gap-1 hover:text-white">
              资产
              {sortKey === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button onClick={() => toggleSort('balance')} className="col-span-2 text-right flex items-center justify-end gap-1 hover:text-white">
              余额
              {sortKey === 'balance' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button onClick={() => toggleSort('valueUsdt')} className="col-span-2 text-right flex items-center justify-end gap-1 hover:text-white">
              估值 (USDT)
              {sortKey === 'valueUsdt' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button onClick={() => toggleSort('change')} className="col-span-1 text-right flex items-center justify-end gap-1 hover:text-white">
              24h
              {sortKey === 'change' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button onClick={() => toggleSort('allocation')} className="col-span-1 text-right hidden md:flex items-center justify-end gap-1 hover:text-white">
              占比
              {sortKey === 'allocation' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <div className="col-span-3 text-right">操作</div>
          </div>
          <div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND.textMute }} />
                <p className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>未找到匹配资产</p>
                <p className="text-xs" style={{ color: BRAND.textSub }}>尝试其他关键词或切换分类</p>
              </div>
            ) : (
              filtered.map((a, idx) => {
                const value = a.balance * a.priceUsdt;
                return (
                  <div
                    key={a.symbol}
                    className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs hover:bg-opacity-50 transition-colors"
                    style={{ borderBottom: `1px solid ${BRAND.borderLt}`, backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  >
                    <div className="col-span-1 font-mono font-bold" style={{ color: BRAND.textMute }}>
                      {a.rank}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        {a.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: BRAND.text }}>{a.symbol}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.name}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold" style={{ color: BRAND.text }}>
                      {hideBalance ? '••••' : a.balance < 0.01 ? a.balance.toFixed(8) : a.balance < 1 ? a.balance.toFixed(4) : a.balance.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold" style={{ color: BRAND.text }}>
                      {fmtUsdt(value)}
                    </div>
                    <div
                      className="col-span-1 text-right font-mono font-bold"
                      style={{ color: a.change24h >= 0 ? BRAND.success : BRAND.danger }}
                    >
                      {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
                    </div>
                    <div className="col-span-1 text-right font-mono hidden md:block" style={{ color: BRAND.textSub }}>
                      {a.allocation.toFixed(1)}%
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDrawer('deposit', a)}
                        className="h-7 px-2.5 rounded-md text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
                      >
                        <ArrowDownLeft className="w-3 h-3" />充
                      </button>
                      <button
                        onClick={() => openDrawer('withdraw', a)}
                        className="h-7 px-2.5 rounded-md text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95"
                        style={{ backgroundColor: 'transparent', color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                      >
                        <ArrowUpRight className="w-3 h-3" />提
                      </button>
                      <button
                        onClick={() => openDrawer('asset', a)}
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: 'transparent', color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}
                        aria-label="详情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="text-[10px] mt-2 flex items-center gap-1.5" style={{ color: BRAND.textMute }}>
          <Info className="w-3 h-3" />
          共 {filtered.length} 个资产 · 按 <kbd className="font-mono" style={{ backgroundColor: BRAND.bgAlt, padding: '0 4px', borderRadius: 2, border: `1px solid ${BRAND.border}` }}>/</kbd> 聚焦搜索 · <kbd className="font-mono" style={{ backgroundColor: BRAND.bgAlt, padding: '0 4px', borderRadius: 2, border: `1px solid ${BRAND.border}` }}>Esc</kbd> 关闭
        </div>
      </section>

      {/* ===== 5. 资金流水 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: BRAND.textMute }}>
              RECENT FLOWS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>最近资金流水</h2>
          </div>
          <a href="#" className="text-xs font-bold inline-flex items-center gap-1" style={{ color: BRAND.primary }}>
            查看全部 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div
            className="grid grid-cols-12 gap-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute, borderBottom: `1px solid ${BRAND.border}` }}
          >
            <div className="col-span-1">类型</div>
            <div className="col-span-3">操作 / 网络</div>
            <div className="col-span-3 text-right">数量</div>
            <div className="col-span-2 text-right">状态</div>
            <div className="col-span-3 text-right">时间</div>
          </div>
          <div>
            {FLOWS.map((f) => (
              <FlowRow key={f.id} flow={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. 安全提示条 ===== */}
      <section
        className="py-6"
        style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(255, 169, 64, 0.12)', color: BRAND.warning }}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
                资产数据为 mock 占位
              </div>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                本页所有余额、价格、流水均为 mock 占位示例，仅用于界面演示。实际资产以链上余额与撮合系统结算为准。
                请妥善保管私钥、开启 2FA、设置地址白名单，警惕钓鱼网站和社工攻击。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. Drawer：充值/提现/资产详情 ===== */}
      {drawerMode && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawerMode(null)}
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4"
              style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}
            >
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                {drawerMode === 'deposit' ? '充值' : drawerMode === 'withdraw' ? '提现' : '资产详情'} {activeAsset ? `· ${activeAsset.symbol}` : ''}
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
              {drawerMode === 'deposit' && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                    选择网络
                  </div>
                  <div className="space-y-2">
                    {NETWORKS.map((n) => (
                      <NetworkRow
                        key={n.key}
                        net={n}
                        selected={selectedNet === n.key}
                        onClick={() => setSelectedNet(n.key)}
                      />
                    ))}
                  </div>
                  <div
                    className="rounded-xl p-4 text-center"
                    style={{ backgroundColor: BRAND.bg, border: `1px dashed ${BRAND.border}` }}
                  >
                    <div className="w-32 h-32 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
                      <div className="text-3xl font-extrabold" style={{ color: BRAND.bg }}>QR</div>
                    </div>
                    <div className="text-[10px] font-mono break-all" style={{ color: BRAND.textMute }}>
                      cfx:aanv7g1m9b8s6f5d4g3h2j1k0l9m8n7b6v5c4x3z
                    </div>
                    <button
                      className="mt-3 inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    >
                      <Copy className="w-3 h-3" />
                      复制地址
                    </button>
                  </div>
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}33` }}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.warning }} />
                    <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      请仅向该地址转入同网络资产。跨链或错误网络转入将不可恢复。最小充值金额 0.0001 BTC，到账需 2 个区块确认。
                    </div>
                  </div>
                </>
              )}

              {drawerMode === 'withdraw' && (
                <>
                  <div
                    className="rounded-xl p-3 flex items-start gap-2"
                    style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}33` }}
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.warning }} />
                    <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                      提现需开启 2FA 与邮箱验证。大额提现可能需要人工审核，预计 1-4 小时内到账。
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                      提现地址
                    </label>
                    <input
                      placeholder="输入或选择已保存地址"
                      className="w-full h-10 px-3 rounded-lg text-xs outline-none"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: BRAND.textMute }}>
                      提现数量
                    </label>
                    <div className="flex gap-2">
                      <input
                        placeholder="0.00"
                        className="flex-1 h-10 px-3 rounded-lg text-xs outline-none"
                        style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                      />
                      <button
                        className="h-10 px-3 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
                      >
                        全部
                      </button>
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3 text-xs"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex justify-between mb-1" style={{ color: BRAND.textSub }}>
                      <span>网络费</span>
                      <span className="font-mono">~$3.5</span>
                    </div>
                    <div className="flex justify-between mb-1" style={{ color: BRAND.textSub }}>
                      <span>预计到账</span>
                      <span className="font-mono">~5-15 分钟</span>
                    </div>
                    <div className="flex justify-between" style={{ color: BRAND.textSub }}>
                      <span>每日限额</span>
                      <span className="font-mono">10 BTC</span>
                    </div>
                  </div>
                  <button
                    className="w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                  >
                    提交提现
                  </button>
                </>
              )}

              {drawerMode === 'asset' && activeAsset && (
                <>
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        {activeAsset.symbol.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-base font-extrabold" style={{ color: BRAND.text }}>{activeAsset.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{activeAsset.symbol} · {activeAsset.category}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>总余额</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.text }}>
                          {hideBalance ? '••••' : activeAsset.balance.toFixed(4)} {activeAsset.symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>可用</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.text }}>
                          {hideBalance ? '••••' : activeAsset.available.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>冻结</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.warning }}>
                          {hideBalance ? '••••' : activeAsset.frozen.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>估值</div>
                        <div className="font-mono font-bold" style={{ color: BRAND.text }}>
                          {fmtUsdt(activeAsset.balance * activeAsset.priceUsdt)} USDT
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.textMute }}>
                      支持网络
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAsset.networks.map((n) => (
                        <span
                          key={n}
                          className="text-[10px] font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setDrawerMode('deposit')}
                      className="h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                    >
                      充值
                    </button>
                    <button
                      onClick={() => setDrawerMode('withdraw')}
                      className="h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: 'transparent', border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                    >
                      提现
                    </button>
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

export default PortalWallet;
