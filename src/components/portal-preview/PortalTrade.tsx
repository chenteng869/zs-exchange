'use client';

/**
 * PortalTrade - 交易大厅（2026-07-19 Q05 P3.4）
 *
 * 页面定位：
 * - 中萨数字科技交易所交易入口主页
 * - 6 大交易类型：现货交易 / 合约交易 / 策略交易 / 模拟交易 / 交易规则 / 费率说明
 * - 8+ 主流交易对 + 实时 ticker 漂移
 *
 * L4 工业级设计标准：
 * - 暗色背景 v6 纯黑无色相（#000000 + 卡片 #141414）
 * - ZSDEX 品牌绿 primary #14B881
 * - 至少 5 个区块（Hero / 6 类型入口 / KPI / 交易对表 / 规则速查 / 风险提示）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键 / 自选）
 * - 1+ Drawer（交易对详情）
 * - 1+ 实时数据波动（ticker 2-5s 漂移）
 * - 3+ 动画（Stagger / CountUp / Hover / 涨跌色闪）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，价格/成交额/持仓量/资金费率使用 mock 占位
 * - 状态徽章统一枚举：OPEN / BETA / SOON
 * - 不修改旧官网 / 旧 H5 / disabled pages
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Activity,
  BarChart3,
  Globe2,
  Plus,
  Check,
  AlertTriangle,
  Zap,
  Sparkles,
  Eye,
  Layers,
  Info,
  BookOpen,
  Calculator,
  FlaskConical,
  Briefcase,
  LineChart,
  Wallet,
  ArrowLeftRight,
  Clock,
  Percent,
  Shield,
  Keyboard,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type ProductType = 'spot' | 'futures' | 'strategy' | 'demo' | 'rules' | 'fees';
type AssetClass = 'major' | 'defi' | 'meme' | 'layer2' | 'stable';
type SortKey = 'rank' | 'pair' | 'last' | 'change' | 'volume' | 'funding' | 'oi';
type SortDir = 'asc' | 'desc';
type FilterKey = 'all' | 'major' | 'defi' | 'meme' | 'layer2' | 'stable';

interface TradingPair {
  symbol: string;
  base: string;
  quote: string;
  pair: string;
  last: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  fundingRate: number;
  openInterest: number;
  assetClass: AssetClass;
  rank: number;
}

// ============== Mock 数据（不接真实 API）==============

const PAIRS: TradingPair[] = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', pair: 'BTC/USDT', last: 96800, change24h: 2.34, volume24h: 28_500_000_000, high24h: 97200, low24h: 95100, fundingRate: 0.0100, openInterest: 18_500_000_000, assetClass: 'major', rank: 1 },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', pair: 'ETH/USDT', last: 3450, change24h: 3.12, volume24h: 14_200_000_000, high24h: 3490, low24h: 3320, fundingRate: 0.0092, openInterest: 8_200_000_000, assetClass: 'major', rank: 2 },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', pair: 'BNB/USDT', last: 720, change24h: 1.56, volume24h: 1_800_000_000, high24h: 728, low24h: 708, fundingRate: 0.0085, openInterest: 920_000_000, assetClass: 'major', rank: 3 },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', pair: 'SOL/USDT', last: 178, change24h: 5.23, volume24h: 3_400_000_000, high24h: 182, low24h: 165, fundingRate: 0.0112, openInterest: 1_500_000_000, assetClass: 'major', rank: 4 },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', pair: 'XRP/USDT', last: 2.45, change24h: -1.23, volume24h: 4_200_000_000, high24h: 2.52, low24h: 2.42, fundingRate: 0.0078, openInterest: 1_100_000_000, assetClass: 'major', rank: 5 },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', pair: 'DOGE/USDT', last: 0.32, change24h: 8.12, volume24h: 2_700_000_000, high24h: 0.34, low24h: 0.28, fundingRate: 0.0125, openInterest: 620_000_000, assetClass: 'meme', rank: 6 },
  { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT', pair: 'ADA/USDT', last: 0.98, change24h: -2.45, volume24h: 1_100_000_000, high24h: 1.02, low24h: 0.97, fundingRate: 0.0068, openInterest: 480_000_000, assetClass: 'major', rank: 7 },
  { symbol: 'AVAXUSDT', base: 'AVAX', quote: 'USDT', pair: 'AVAX/USDT', last: 38.5, change24h: 4.21, volume24h: 820_000_000, high24h: 39.2, low24h: 36.0, fundingRate: 0.0095, openInterest: 320_000_000, assetClass: 'layer2', rank: 8 },
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT', pair: 'LINK/USDT', last: 23.5, change24h: 1.92, volume24h: 410_000_000, high24h: 24.0, low24h: 22.8, fundingRate: 0.0082, openInterest: 180_000_000, assetClass: 'defi', rank: 9 },
  { symbol: 'UNIUSDT', base: 'UNI', quote: 'USDT', pair: 'UNI/USDT', last: 14.2, change24h: -0.85, volume24h: 180_000_000, high24h: 14.5, low24h: 14.0, fundingRate: 0.0072, openInterest: 95_000_000, assetClass: 'defi', rank: 10 },
  { symbol: 'MATICUSDT', base: 'MATIC', quote: 'USDT', pair: 'MATIC/USDT', last: 0.55, change24h: 2.78, volume24h: 290_000_000, high24h: 0.57, low24h: 0.52, fundingRate: 0.0080, openInterest: 120_000_000, assetClass: 'layer2', rank: 11 },
  { symbol: 'DOTUSDT', base: 'DOT', quote: 'USDT', pair: 'DOT/USDT', last: 7.85, change24h: -3.12, volume24h: 320_000_000, high24h: 8.12, low24h: 7.78, fundingRate: 0.0065, openInterest: 140_000_000, assetClass: 'layer2', rank: 12 },
  { symbol: 'LTCUSDT', base: 'LTC', quote: 'USDT', pair: 'LTC/USDT', last: 128, change24h: 1.32, volume24h: 380_000_000, high24h: 130, low24h: 125, fundingRate: 0.0070, openInterest: 165_000_000, assetClass: 'major', rank: 13 },
  { symbol: 'USDCUSDT', base: 'USDC', quote: 'USDT', pair: 'USDC/USDT', last: 1.0, change24h: 0.01, volume24h: 5_200_000_000, high24h: 1.001, low24h: 0.999, fundingRate: 0.0001, openInterest: 280_000_000, assetClass: 'stable', rank: 14 },
  { symbol: 'PEPEUSDT', base: 'PEPE', quote: 'USDT', pair: 'PEPE/USDT', last: 0.0000123, change24h: 12.45, volume24h: 1_500_000_000, high24h: 0.0000138, low24h: 0.0000105, fundingRate: 0.0185, openInterest: 380_000_000, assetClass: 'meme', rank: 15 },
  { symbol: 'ARBUSDT', base: 'ARB', quote: 'USDT', pair: 'ARB/USDT', last: 0.92, change24h: -2.78, volume24h: 165_000_000, high24h: 0.96, low24h: 0.91, fundingRate: 0.0075, openInterest: 78_000_000, assetClass: 'layer2', rank: 16 },
];

// ============== 子组件 ==============

function StatBadge({ label, value, status }: { label: string; value: string; status?: keyof typeof STATUS }) {
  const s = status ? STATUS[status] : null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.textMute }}>
        {label}
      </span>
      {s && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      )}
    </div>
  );
}

function ProductCard({
  type,
  title,
  desc,
  status,
  features,
  icon: Icon,
}: {
  type: ProductType;
  title: string;
  desc: string;
  status: keyof typeof STATUS;
  features: string[];
  icon: React.ElementType;
}) {
  const s = STATUS[status];
  return (
    <div
      className="rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND.primary} 50%, transparent 100%)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      </div>
      <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
        {title}
      </h3>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: BRAND.textSub }}>
        {desc}
      </p>
      <ul className="space-y-1.5 mb-4">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: BRAND.textSub }}>
            <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: BRAND.success }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        className="w-full h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
        style={{
          backgroundColor: status === 'OPEN' ? BRAND.primaryContainer : 'transparent',
          color: status === 'OPEN' ? BRAND.onPrimary : BRAND.textSub,
          border: status === 'OPEN' ? 'none' : `1px solid ${BRAND.border}`,
        }}
      >
        {status === 'OPEN' ? '立即进入' : status === 'BETA' ? '申请内测' : '查看详情'}
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  change,
  trend,
}: {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const color = trend === 'up' ? BRAND.success : trend === 'down' ? BRAND.danger : BRAND.textMute;
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-xl font-extrabold font-mono" style={{ color: BRAND.text }}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
            {unit}
          </span>
        )}
      </div>
      {change && (
        <div className="text-[10px] font-mono font-bold flex items-center gap-0.5" style={{ color }}>
          {trend === 'up' && <TrendingUp className="w-2.5 h-2.5" />}
          {trend === 'down' && <TrendingDown className="w-2.5 h-2.5" />}
          {change}
        </div>
      )}
    </div>
  );
}

function MiniSpark({ values, positive }: { values: number[]; positive: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? BRAND.success : BRAND.danger}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PriceFlash({ value, prev }: { value: number; prev: number }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (value > prev) setFlash('up');
    else if (value < prev) setFlash('down');
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [value, prev]);
  return (
    <span
      className="font-mono font-bold transition-colors duration-300"
      style={{
        color: flash === 'up' ? BRAND.success : flash === 'down' ? BRAND.danger : BRAND.text,
      }}
    >
      {value < 1 ? value.toFixed(7) : value.toFixed(2)}
    </span>
  );
}

function RuleRow({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div
      className="rounded-xl p-3 flex items-start gap-3"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold mb-0.5" style={{ color: BRAND.text }}>
          {title}
        </div>
        <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

// ============== 主组件 ==============

export function PortalTrade() {
  // ----- 状态 -----
  const [pairs, setPairs] = useState<TradingPair[]>(PAIRS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['BTCUSDT', 'ETHUSDT']));
  const [activePair, setActivePair] = useState<TradingPair | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ----- 实时 ticker 漂移 -----
  useEffect(() => {
    const interval = setInterval(() => {
      setPairs((prev) =>
        prev.map((p) => {
          const drift = (Math.random() - 0.5) * 0.004; // ±0.2%
          const newLast = Math.max(0.0000001, p.last * (1 + drift));
          return { ...p, last: newLast };
        })
      );
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/' && !drawerOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
        else if (document.activeElement === searchInputRef.current) searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // ----- 过滤 + 排序 -----
  const filtered = useMemo(() => {
    let list = pairs;
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((p) => p.pair.includes(q) || p.base.includes(q));
    }
    if (filter !== 'all') {
      list = list.filter((p) => p.assetClass === filter);
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
  }, [pairs, search, filter, sortKey, sortDir]);

  // ----- KPI 计算 -----
  const totalVolume = useMemo(() => pairs.reduce((s, p) => s + p.volume24h, 0), [pairs]);
  const totalOI = useMemo(() => pairs.reduce((s, p) => s + p.openInterest, 0), [pairs]);
  const gainersCount = useMemo(() => pairs.filter((p) => p.change24h > 0).length, [pairs]);
  const losersCount = useMemo(() => pairs.filter((p) => p.change24h < 0).length, [pairs]);
  const avgFunding = useMemo(() => pairs.reduce((s, p) => s + p.fundingRate, 0) / pairs.length, [pairs]);

  // ----- 操作 -----
  const toggleWatch = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }, []);

  const openDrawer = useCallback((pair: TradingPair) => {
    setActivePair(pair);
    setDrawerOpen(true);
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  // ============== 渲染 ==============

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero 区 ===== */}
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
            backgroundImage: `radial-gradient(circle at 20% 20%, ${BRAND.primary}11 0%, transparent 50%), radial-gradient(circle at 80% 60%, ${BRAND.primary}08 0%, transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              交易大厅
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: BRAND.textMute }}>
              6 大交易类型 · 16 主流交易对
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: BRAND.text }}>
            进入交易大厅
          </h1>
          <p className="text-sm md:text-base max-w-2xl mb-6" style={{ color: BRAND.textSub }}>
            从现货到合约、从模拟到策略，覆盖个人与机构全部交易场景。所有数据为 mock 占位示例，请以实际交易接口为准。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#pairs"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              查看交易对 <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="/portal-preview/spot-guide"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: 'transparent', border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <BookOpen className="w-4 h-4" />
              新手教学
            </a>
          </div>
        </div>
      </section>

      {/* ===== 2. 6 大交易类型入口 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              PRODUCTS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              6 大交易类型
            </h2>
          </div>
          <a
            href="/portal-preview/fees"
            className="text-xs font-bold inline-flex items-center gap-1"
            style={{ color: BRAND.primary }}
          >
            查看费率 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProductCard
            type="spot"
            title="现货交易"
            desc="以即时价格买卖数字资产，支持限价/市价/止损单"
            status="OPEN"
            features={['限价 / 市价 / 止损单', 'T+0 交割', '0.1% 基础费率', '主流币全覆盖']}
            icon={ArrowLeftRight}
          />
          <ProductCard
            type="futures"
            title="合约交易"
            desc="永续合约与交割合约，支持多空双向与杠杆交易"
            status="OPEN"
            features={['永续 + 交割合约', '1-100x 杠杆', '资金费率每 8h', '强平保护机制']}
            icon={LineChart}
          />
          <ProductCard
            type="strategy"
            title="策略交易"
            desc="网格 / 定投 / 马丁 / 套利，一键启动自动化交易"
            status="BETA"
            features={['现货网格', '合约网格', '定投计划', '马丁格尔']}
            icon={Calculator}
          />
          <ProductCard
            type="demo"
            title="模拟交易"
            desc="零风险练习交易环境，10 万 USDT 模拟金"
            status="OPEN"
            features={['10 万 USDT 模拟金', '实时模拟撮合', '完整 K 线', '策略回测']}
            icon={FlaskConical}
          />
          <ProductCard
            type="rules"
            title="交易规则"
            desc="交易时间、撮合规则、强平机制、风险说明"
            status="OPEN"
            features={['交易时间', '撮合优先级', '强平机制', '限价规则']}
            icon={BookOpen}
          />
          <ProductCard
            type="fees"
            title="费率说明"
            desc="VIP 等级、手续费折扣、提币费率、资金费率"
            status="OPEN"
            features={['VIP 等级体系', 'Maker / Taker 费率', '提币费率', '资金费率']}
            icon={Percent}
          />
        </div>
      </section>

      {/* ===== 3. 实时 KPI 看板 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="24H 平台总成交"
            value={`${(totalVolume / 1_000_000_000).toFixed(2)}B`}
            unit="USDT"
            change="+12.4%"
            trend="up"
          />
          <KpiCard
            label="全网持仓量"
            value={`${(totalOI / 1_000_000_000).toFixed(2)}B`}
            unit="USDT"
            change="+5.8%"
            trend="up"
          />
          <KpiCard
            label="上涨 / 下跌"
            value={`${gainersCount} / ${losersCount}`}
            change={gainersCount > losersCount ? '多头占优' : '空头占优'}
            trend={gainersCount > losersCount ? 'up' : 'down'}
          />
          <KpiCard
            label="平均资金费率"
            value={(avgFunding * 100).toFixed(4)}
            unit="%"
            change={avgFunding >= 0 ? '多头付费' : '空头付费'}
            trend={avgFunding >= 0 ? 'up' : 'down'}
          />
        </div>
      </section>

      {/* ===== 4. 交易对表（核心） ===== */}
      <section id="pairs" className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              TRADING PAIRS
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              交易对行情
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 搜索框 */}
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
                placeholder="搜索交易对…"
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
            { key: 'major' as const, label: '主流币', icon: BarChart3 },
            { key: 'defi' as const, label: 'DeFi', icon: Activity },
            { key: 'meme' as const, label: 'Meme', icon: Sparkles },
            { key: 'layer2' as const, label: 'L2', icon: Globe2 },
            { key: 'stable' as const, label: '稳定币', icon: Shield },
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

        {/* 行情表 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {/* 表头 */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
            style={{
              backgroundColor: BRAND.bgAlt,
              color: BRAND.textMute,
              borderBottom: `1px solid ${BRAND.border}`,
            }}
          >
            <button
              onClick={() => toggleSort('rank')}
              className="col-span-1 text-left flex items-center gap-1 hover:text-white transition-colors"
            >
              #
              {sortKey === 'rank' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('pair')}
              className="col-span-2 text-left flex items-center gap-1 hover:text-white transition-colors"
            >
              交易对
              {sortKey === 'pair' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('last')}
              className="col-span-2 text-right flex items-center justify-end gap-1 hover:text-white transition-colors"
            >
              最新价
              {sortKey === 'last' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('change')}
              className="col-span-1 text-right flex items-center justify-end gap-1 hover:text-white transition-colors"
            >
              24h
              {sortKey === 'change' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('volume')}
              className="col-span-2 text-right hidden md:flex items-center justify-end gap-1 hover:text-white transition-colors"
            >
              24h 成交
              {sortKey === 'volume' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('funding')}
              className="col-span-1 text-right hidden lg:flex items-center justify-end gap-1 hover:text-white transition-colors"
            >
              资金费率
              {sortKey === 'funding' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <button
              onClick={() => toggleSort('oi')}
              className="col-span-1 text-right hidden lg:flex items-center justify-end gap-1 hover:text-white transition-colors"
            >
              持仓量
              {sortKey === 'oi' && (sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
            </button>
            <div className="col-span-2 text-right">操作</div>
          </div>

          {/* 表体 */}
          <div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: BRAND.textMute }} />
                <p className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>
                  暂无匹配交易对
                </p>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  尝试其他关键词或切换分类
                </p>
              </div>
            ) : (
              filtered.map((p, idx) => {
                const watched = watchlist.has(p.symbol);
                const positive = p.change24h >= 0;
                return (
                  <div
                    key={p.symbol}
                    className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs hover:bg-opacity-50 transition-colors cursor-pointer"
                    style={{
                      borderBottom: `1px solid ${BRAND.borderLt}`,
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                    onClick={() => openDrawer(p)}
                  >
                    <div className="col-span-1 font-mono font-bold" style={{ color: BRAND.textMute }}>
                      {p.rank}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        {p.base.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: BRAND.text }}>
                          {p.base}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          {p.quote}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <PriceFlash value={p.last} prev={p.last} />
                    </div>
                    <div
                      className="col-span-1 text-right font-mono font-bold"
                      style={{ color: positive ? BRAND.success : BRAND.danger }}
                    >
                      {positive ? '+' : ''}
                      {p.change24h.toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right font-mono hidden md:block" style={{ color: BRAND.textSub }}>
                      ${(p.volume24h / 1_000_000_000).toFixed(2)}B
                    </div>
                    <div
                      className="col-span-1 text-right font-mono hidden lg:block"
                      style={{ color: p.fundingRate >= 0 ? BRAND.success : BRAND.danger }}
                    >
                      {(p.fundingRate * 100).toFixed(4)}%
                    </div>
                    <div className="col-span-1 text-right font-mono hidden lg:block" style={{ color: BRAND.textSub }}>
                      ${(p.openInterest / 1_000_000_000).toFixed(2)}B
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatch(p.symbol);
                        }}
                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: watched ? BRAND.warningLt : 'transparent',
                          color: watched ? BRAND.warning : BRAND.textMute,
                          border: `1px solid ${watched ? BRAND.warning : BRAND.border}`,
                        }}
                        aria-label={watched ? '移除自选' : '加入自选'}
                      >
                        <Star className="w-3.5 h-3.5" fill={watched ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(p);
                        }}
                        className="h-7 px-2.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                        style={{
                          backgroundColor: BRAND.primaryLt,
                          color: BRAND.primary,
                          border: `1px solid ${BRAND.primary}33`,
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        详情
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
          共 {filtered.length} 个交易对 · 按 <kbd className="font-mono" style={{ backgroundColor: BRAND.bgAlt, padding: '0 4px', borderRadius: 2, border: `1px solid ${BRAND.border}` }}>/</kbd> 聚焦搜索 · <kbd className="font-mono" style={{ backgroundColor: BRAND.bgAlt, padding: '0 4px', borderRadius: 2, border: `1px solid ${BRAND.border}` }}>Esc</kbd> 关闭
        </div>
      </section>

      {/* ===== 5. 板块强弱 + 交易技巧 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 板块强弱 */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div
                  className="text-[10px] font-bold tracking-widest uppercase mb-1"
                  style={{ color: BRAND.textMute }}
                >
                  SECTOR HEAT
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: BRAND.text }}>
                  板块强弱
                </h2>
              </div>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                24h 涨跌幅均值
              </span>
            </div>
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              {[
                { name: 'Meme', value: '+8.45%', up: true, width: 84 },
                { name: 'L2 / 新公链', value: '+3.21%', up: true, width: 48 },
                { name: 'DeFi', value: '+1.85%', up: true, width: 32 },
                { name: '主流币', value: '+1.32%', up: true, width: 24 },
                { name: '稳定币', value: '+0.01%', up: true, width: 4 },
                { name: 'AI / 模块化', value: '-1.12%', up: false, width: 18 },
                { name: '隐私币', value: '-2.45%', up: false, width: 32 },
                { name: 'NFT / GameFi', value: '-4.85%', up: false, width: 56 },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: BRAND.text }}>
                      {s.name}
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: s.up ? BRAND.success : BRAND.danger }}
                    >
                      {s.value}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: BRAND.bg }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.width}%`,
                        backgroundColor: s.up ? BRAND.success : BRAND.danger,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 交易技巧 */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div
                  className="text-[10px] font-bold tracking-widest uppercase mb-1"
                  style={{ color: BRAND.textMute }}
                >
                  PRO TIPS
                </div>
                <h2 className="text-lg font-extrabold" style={{ color: BRAND.text }}>
                  交易技巧速览
                </h2>
              </div>
              <a
                href="/portal-preview/spot-guide"
                className="text-[10px] font-bold inline-flex items-center gap-1"
                style={{ color: BRAND.primary }}
              >
                完整教学 <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2">
              {[
                {
                  icon: Shield,
                  title: '设置止损',
                  desc: '下单时同步设置止损单，控制下行风险；建议单笔亏损不超过本金 1-2%。',
                },
                {
                  icon: BarChart3,
                  title: '关注资金费率',
                  desc: '资金费率显著偏离 0 时警惕市场情绪极端，多空持仓不对称往往预示反转。',
                },
                {
                  icon: Activity,
                  title: '分散持仓',
                  desc: '不要将所有资金集中于单一币种或单一杠杆倍数，分散配置降低组合波动。',
                },
                {
                  icon: Clock,
                  title: '避开低流动性时段',
                  desc: '凌晨时段主流币流动性下降，价差扩大、滑点升高，非必要不开仓。',
                },
              ].map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex items-start gap-3"
                    style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold mb-0.5" style={{ color: BRAND.text }}>
                        {t.title}
                      </div>
                      <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                        {t.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. 交易规则速查 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              QUICK REFERENCE
            </div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND.text }}>
              交易规则速查
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RuleRow
            icon={Clock}
            title="交易时间"
            desc="数字资产 7×24 小时不间断交易，节假日不休息。法币通道与 OTC 大宗按合作方时间开放。"
          />
          <RuleRow
            icon={ArrowUpDown}
            title="撮合优先级"
            desc="价格优先 + 时间优先。相同价格按挂单时间先后成交；市价单按对手方最优价格成交。"
          />
          <RuleRow
            icon={AlertTriangle}
            title="强平机制"
            desc="合约账户权益跌至维持保证金以下时触发强平。系统采用分摊机制，最新价/标记价取较高者。"
          />
          <RuleRow
            icon={Percent}
            title="费率与 VIP"
            desc="现货基础费率 Maker 0.1% / Taker 0.1%。持仓量与交易量达到 VIP 等级可享 0.05% 起的折扣。"
          />
          <RuleRow
            icon={Shield}
            title="风控保护"
            desc="异常波动熔断、限价规则、大额持仓预警、连环爆仓保护、风险准备金等。"
          />
          <RuleRow
            icon={Keyboard}
            title="快捷键"
            desc="/ 聚焦搜索 · Esc 关闭抽屉 · 表格行点击查看详情 · 自选按钮快速加入/移除自选。"
          />
        </div>
      </section>

      {/* ===== 6. 风险提示条 ===== */}
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
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
                交易数据为 mock 占位估算
              </div>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                本页所展示的价格、成交额、持仓量、资金费率等数据为 mock 占位示例，仅用于界面演示。实际交易请以真实行情接口与撮合系统为准。数字资产价格波动较大，合约交易存在强平风险，请理性投资，做好风控。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. Drawer：交易对详情 ===== */}
      {drawerOpen && activePair && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div
              className="sticky top-0 flex items-center justify-between px-5 py-4"
              style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  {activePair.base.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                    {activePair.pair}
                  </div>
                  <div className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}>
                    <span className="font-mono">{activePair.symbol}</span>
                    <span>·</span>
                    <span>USDT 永续</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="p-5 space-y-4">
              {/* 价格区 */}
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.textMute }}>
                  最新价
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold font-mono" style={{ color: BRAND.text }}>
                    {activePair.last < 1 ? activePair.last.toFixed(7) : activePair.last.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono" style={{ color: BRAND.textMute }}>
                    USDT
                  </span>
                </div>
                <div
                  className="text-sm font-mono font-bold flex items-center gap-1"
                  style={{ color: activePair.change24h >= 0 ? BRAND.success : BRAND.danger }}
                >
                  {activePair.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {activePair.change24h >= 0 ? '+' : ''}
                  {activePair.change24h.toFixed(2)}% (24h)
                </div>
              </div>

              {/* 24h 统计 */}
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: BRAND.textMute }}
                >
                  24H 统计
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>
                      24h 最高
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.success }}>
                      {activePair.high24h < 1 ? activePair.high24h.toFixed(7) : activePair.high24h.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>
                      24h 最低
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.danger }}>
                      {activePair.low24h < 1 ? activePair.low24h.toFixed(7) : activePair.low24h.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>
                      24h 成交
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                      ${(activePair.volume24h / 1_000_000_000).toFixed(2)}B
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>
                      持仓量
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                      ${(activePair.openInterest / 1_000_000_000).toFixed(2)}B
                    </div>
                  </div>
                </div>
              </div>

              {/* 资金费率 */}
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.textMute }}>
                    资金费率
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}
                  >
                    每 8h
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-xl font-mono font-extrabold"
                    style={{ color: activePair.fundingRate >= 0 ? BRAND.success : BRAND.danger }}
                  >
                    {(activePair.fundingRate * 100).toFixed(4)}%
                  </span>
                  <span className="text-[10px]" style={{ color: BRAND.textMute }}>
                    {activePair.fundingRate >= 0 ? '多头付费' : '空头付费'}
                  </span>
                </div>
              </div>

              {/* 风险提示 */}
              <div
                className="rounded-xl p-3 flex items-start gap-2"
                style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}33` }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.warning }} />
                <div className="text-[11px] leading-relaxed" style={{ color: BRAND.textSub }}>
                  以上数据均为 mock 占位示例，仅用于界面演示。实际交易请以真实行情接口与撮合系统为准，请做好风险控制。
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  className="h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                >
                  立即买入
                </button>
                <button
                  className="h-11 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'transparent', border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                >
                  加入自选
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalTrade;
