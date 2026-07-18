'use client';

/**
 * PortalMarket - 行情中心（2026-07-19 Q05 P3.3）
 *
 * 页面定位：
 * - 中萨数字科技交易所行情总览
 * - 6 大分类：热搜 / 涨幅 / 跌幅 / 成交额 / 树图生态 / 自选
 * - 30+ 主流币种，含 mock 价格 ticker 与 sparkline 趋势
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 + 卡片 #141414 + ZSDEX 绿 primary
 * - 至少 5 个区块（Hero / Ticker / KPI / Tabs / 行情表 / Drawer）
 * - 至少 5 项交互（搜索 / 排序 / Tab / 自选 / Drawer / 快捷键）
 * - 1+ Drawer（币种详情）
 * - 1+ 实时数据波动（价格 ticker 2-5s 漂移）
 * - 3+ 动画（Stagger / CountUp / Hover / 涨跌色闪）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，mock 占位价格/成交额
 * - 不出现地区监管类词汇
 * - 状态徽章统一枚举
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
  DollarSign,
  BarChart3,
  Globe2,
  Leaf,
  Plus,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  Sparkles,
  Eye,
  Layers,
  Info,
} from 'lucide-react';
import { BRAND } from './brand';

// ============== 类型 ==============

type TabKey = 'hot' | 'gainers' | 'losers' | 'volume' | 'treegraph' | 'watchlist';
type SortKey = 'rank' | 'name' | 'price' | 'change' | 'volume' | 'spark';
type SortDir = 'asc' | 'desc';

interface Coin {
  symbol: string;
  name: string;
  pair: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
  isTreeGraph: boolean;
  rank: number;
}

// ============== Mock 数据（不接真实 API）==============

const COINS: Coin[] = [
  { symbol: 'BTC', name: 'Bitcoin', pair: 'BTC/USDT', price: 96800, change24h: 2.34, volume24h: 28_500_000_000, marketCap: 1_910_000_000_000, sparkline: [95000, 95300, 95800, 96200, 95900, 96500, 96800], isTreeGraph: false, rank: 1 },
  { symbol: 'ETH', name: 'Ethereum', pair: 'ETH/USDT', price: 3450, change24h: 3.12, volume24h: 14_200_000_000, marketCap: 415_000_000_000, sparkline: [3300, 3320, 3380, 3400, 3420, 3440, 3450], isTreeGraph: false, rank: 2 },
  { symbol: 'USDT', name: 'Tether', pair: 'USDT/CNY', price: 7.21, change24h: 0.01, volume24h: 65_000_000_000, marketCap: 118_000_000_000, sparkline: [7.20, 7.21, 7.21, 7.22, 7.21, 7.20, 7.21], isTreeGraph: false, rank: 3 },
  { symbol: 'BNB', name: 'BNB', pair: 'BNB/USDT', price: 720, change24h: 1.56, volume24h: 1_800_000_000, marketCap: 105_000_000_000, sparkline: [710, 712, 715, 718, 716, 719, 720], isTreeGraph: false, rank: 4 },
  { symbol: 'SOL', name: 'Solana', pair: 'SOL/USDT', price: 178, change24h: 5.23, volume24h: 3_400_000_000, marketCap: 83_000_000_000, sparkline: [165, 168, 172, 170, 174, 176, 178], isTreeGraph: false, rank: 5 },
  { symbol: 'XRP', name: 'XRP', pair: 'XRP/USDT', price: 2.45, change24h: -1.23, volume24h: 4_200_000_000, marketCap: 138_000_000_000, sparkline: [2.50, 2.48, 2.46, 2.49, 2.47, 2.46, 2.45], isTreeGraph: false, rank: 6 },
  { symbol: 'ADA', name: 'Cardano', pair: 'ADA/USDT', price: 0.98, change24h: -2.45, volume24h: 1_100_000_000, marketCap: 35_000_000_000, sparkline: [1.02, 1.01, 1.00, 0.99, 0.99, 0.98, 0.98], isTreeGraph: false, rank: 7 },
  { symbol: 'DOGE', name: 'Dogecoin', pair: 'DOGE/USDT', price: 0.32, change24h: 8.12, volume24h: 2_700_000_000, marketCap: 47_000_000_000, sparkline: [0.28, 0.29, 0.30, 0.31, 0.30, 0.31, 0.32], isTreeGraph: false, rank: 8 },
  { symbol: 'AVAX', name: 'Avalanche', pair: 'AVAX/USDT', price: 38.5, change24h: 4.21, volume24h: 820_000_000, marketCap: 15_000_000_000, sparkline: [36, 36.5, 37, 37.5, 37.8, 38.2, 38.5], isTreeGraph: false, rank: 9 },
  { symbol: 'TRX', name: 'TRON', pair: 'TRX/USDT', price: 0.26, change24h: 0.85, volume24h: 480_000_000, marketCap: 22_000_000_000, sparkline: [0.255, 0.256, 0.258, 0.259, 0.260, 0.260, 0.260], isTreeGraph: false, rank: 10 },
  { symbol: 'DOT', name: 'Polkadot', pair: 'DOT/USDT', price: 7.85, change24h: -3.12, volume24h: 320_000_000, marketCap: 11_000_000_000, sparkline: [8.1, 8.0, 7.95, 7.92, 7.88, 7.86, 7.85], isTreeGraph: false, rank: 11 },
  { symbol: 'MATIC', name: 'Polygon', pair: 'MATIC/USDT', price: 0.55, change24h: 2.78, volume24h: 290_000_000, marketCap: 5_400_000_000, sparkline: [0.52, 0.53, 0.54, 0.54, 0.55, 0.55, 0.55], isTreeGraph: false, rank: 12 },
  { symbol: 'LINK', name: 'Chainlink', pair: 'LINK/USDT', price: 23.5, change24h: 1.92, volume24h: 410_000_000, marketCap: 14_700_000_000, sparkline: [22.8, 23.0, 23.1, 23.2, 23.3, 23.4, 23.5], isTreeGraph: false, rank: 13 },
  { symbol: 'UNI', name: 'Uniswap', pair: 'UNI/USDT', price: 14.2, change24h: -0.85, volume24h: 180_000_000, marketCap: 8_500_000_000, sparkline: [14.4, 14.3, 14.3, 14.2, 14.2, 14.2, 14.2], isTreeGraph: false, rank: 14 },
  { symbol: 'LTC', name: 'Litecoin', pair: 'LTC/USDT', price: 128, change24h: 1.32, volume24h: 380_000_000, marketCap: 9_500_000_000, sparkline: [125, 126, 126, 127, 127, 128, 128], isTreeGraph: false, rank: 15 },
  // 树图生态
  { symbol: 'TREEG', name: 'TreeGraph', pair: 'TREEG/USDT', price: 1.85, change24h: 12.45, volume24h: 85_000_000, marketCap: 1_850_000_000, sparkline: [1.6, 1.65, 1.7, 1.72, 1.78, 1.82, 1.85], isTreeGraph: true, rank: 16 },
  { symbol: 'TWT', name: 'TreeGraph Wallet', pair: 'TWT/USDT', price: 0.42, change24h: 6.78, volume24h: 32_000_000, marketCap: 420_000_000, sparkline: [0.38, 0.39, 0.40, 0.40, 0.41, 0.42, 0.42], isTreeGraph: true, rank: 17 },
  { symbol: 'TGFI', name: 'TreeGraph Finance', pair: 'TGFI/USDT', price: 2.32, change24h: -2.14, volume24h: 18_000_000, marketCap: 232_000_000, sparkline: [2.4, 2.38, 2.36, 2.35, 2.34, 2.33, 2.32], isTreeGraph: true, rank: 18 },
  { symbol: 'TGNS', name: 'TreeGraph Name Service', pair: 'TGNS/USDT', price: 0.85, change24h: 4.56, volume24h: 12_000_000, marketCap: 85_000_000, sparkline: [0.80, 0.81, 0.82, 0.83, 0.84, 0.84, 0.85], isTreeGraph: true, rank: 19 },
  { symbol: 'TGDA', name: 'TreeGraph DAO', pair: 'TGDA/USDT', price: 5.62, change24h: -4.85, volume24h: 24_000_000, marketCap: 562_000_000, sparkline: [5.9, 5.85, 5.80, 5.75, 5.70, 5.65, 5.62], isTreeGraph: true, rank: 20 },
  // 更多主流
  { symbol: 'ATOM', name: 'Cosmos', pair: 'ATOM/USDT', price: 8.92, change24h: 2.12, volume24h: 145_000_000, marketCap: 3_500_000_000, sparkline: [8.7, 8.75, 8.80, 8.85, 8.88, 8.90, 8.92], isTreeGraph: false, rank: 21 },
  { symbol: 'XLM', name: 'Stellar', pair: 'XLM/USDT', price: 0.42, change24h: 0.95, volume24h: 92_000_000, marketCap: 12_000_000_000, sparkline: [0.41, 0.415, 0.418, 0.420, 0.420, 0.420, 0.420], isTreeGraph: false, rank: 22 },
  { symbol: 'ALGO', name: 'Algorand', pair: 'ALGO/USDT', price: 0.38, change24h: -1.45, volume24h: 56_000_000, marketCap: 3_100_000_000, sparkline: [0.39, 0.385, 0.382, 0.38, 0.379, 0.38, 0.38], isTreeGraph: false, rank: 23 },
  { symbol: 'NEAR', name: 'NEAR Protocol', pair: 'NEAR/USDT', price: 5.45, change24h: 7.21, volume24h: 240_000_000, marketCap: 5_900_000_000, sparkline: [5.0, 5.1, 5.2, 5.25, 5.30, 5.40, 5.45], isTreeGraph: false, rank: 24 },
  { symbol: 'APT', name: 'Aptos', pair: 'APT/USDT', price: 9.85, change24h: 3.56, volume24h: 185_000_000, marketCap: 4_800_000_000, sparkline: [9.4, 9.5, 9.6, 9.7, 9.75, 9.80, 9.85], isTreeGraph: false, rank: 25 },
  { symbol: 'ARB', name: 'Arbitrum', pair: 'ARB/USDT', price: 0.92, change24h: -2.78, volume24h: 165_000_000, marketCap: 3_800_000_000, sparkline: [0.95, 0.94, 0.93, 0.925, 0.92, 0.92, 0.92], isTreeGraph: false, rank: 26 },
  { symbol: 'OP', name: 'Optimism', pair: 'OP/USDT', price: 2.15, change24h: 1.85, volume24h: 110_000_000, marketCap: 2_400_000_000, sparkline: [2.10, 2.11, 2.12, 2.13, 2.14, 2.14, 2.15], isTreeGraph: false, rank: 27 },
  { symbol: 'IMX', name: 'Immutable', pair: 'IMX/USDT', price: 1.78, change24h: 4.32, volume24h: 78_000_000, marketCap: 2_200_000_000, sparkline: [1.68, 1.70, 1.72, 1.74, 1.75, 1.77, 1.78], isTreeGraph: false, rank: 28 },
  { symbol: 'SUI', name: 'Sui', pair: 'SUI/USDT', price: 3.42, change24h: 6.45, volume24h: 320_000_000, marketCap: 9_100_000_000, sparkline: [3.2, 3.25, 3.30, 3.32, 3.35, 3.40, 3.42], isTreeGraph: false, rank: 29 },
  { symbol: 'SEI', name: 'Sei', pair: 'SEI/USDT', price: 0.48, change24h: -3.12, volume24h: 95_000_000, marketCap: 2_800_000_000, sparkline: [0.50, 0.49, 0.485, 0.48, 0.48, 0.48, 0.48], isTreeGraph: false, rank: 30 },
];

// ============== 子组件：资金流向行 ==============

function FlowRow({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: BRAND.textSub }}>{label}</span>
      <span
        className="font-mono font-bold"
        style={{ color: up ? BRAND.success : BRAND.danger }}
      >
        {value}
      </span>
    </div>
  );
}

// ============== 主组件 ==============

export function PortalMarket() {
  // ----- 实时价格波动（mock 占位） -----
  const [coins, setCoins] = useState<Coin[]>(COINS);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCoins((prev) =>
        prev.map((c) => {
          const drift = (Math.random() - 0.5) * 0.006; // ±0.3% per tick
          const newPrice = Math.max(0.0001, c.price * (1 + drift));
          // Sparkline 推进
          const newSpark = [...c.sparkline.slice(1), newPrice];
          return { ...c, price: newPrice, sparkline: newSpark };
        })
      );
      setLastUpdate(Date.now());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // ----- Tab 切换 -----
  const [tab, setTab] = useState<TabKey>('hot');

  // ----- 搜索 / 排序 -----
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ----- 自选 -----
  const [watchlist, setWatchlist] = useState<Set<string>>(
    new Set(['BTC', 'ETH', 'SOL', 'TREEG'])
  );
  const toggleWatch = (symbol: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  // ----- 详情 Drawer -----
  const [drawerCoin, setDrawerCoin] = useState<Coin | null>(null);

  // ----- 搜索 Drawer -----
  const [searchOpen, setSearchOpen] = useState(false);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setDrawerCoin(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  // ----- 表格过滤 + 排序 -----
  const tableData = useMemo(() => {
    let list = coins;

    // Tab 过滤
    if (tab === 'hot') list = list.slice(0, 10);
    else if (tab === 'gainers') list = [...list].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
    else if (tab === 'losers') list = [...list].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
    else if (tab === 'volume') list = [...list].sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
    else if (tab === 'treegraph') list = list.filter((c) => c.isTreeGraph);
    else if (tab === 'watchlist') list = list.filter((c) => watchlist.has(c.symbol));

    // 搜索过滤
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
    }

    // 排序
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'change') cmp = a.change24h - b.change24h;
      else if (sortKey === 'volume') cmp = a.volume24h - b.volume24h;
      else if (sortKey === 'rank') cmp = a.rank - b.rank;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [coins, tab, searchQuery, sortKey, sortDir, watchlist]);

  // ----- KPI 数据（基于 coins 实时计算） -----
  const kpis = useMemo(() => {
    const totalCap = coins.reduce((sum, c) => sum + c.marketCap, 0);
    const totalVolume = coins.reduce((sum, c) => sum + c.volume24h, 0);
    const gainers = coins.filter((c) => c.change24h > 0).length;
    const losers = coins.filter((c) => c.change24h < 0).length;
    return {
      totalCap,
      totalVolume,
      activeCoins: coins.length,
      gainers,
      losers,
    };
  }, [coins]);

  const [kpiKey, setKpiKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKpiKey((k) => k + 1), 7000);
    return () => clearInterval(t);
  }, []);

  // ----- 排序点击处理 -----
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'change' || key === 'price' || key === 'volume' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero ===== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 0%, ${BRAND.primaryLt}, transparent 50%), radial-gradient(circle at 70% 100%, rgba(20, 184, 129, 0.05), transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: BRAND.textMute }}>
            <a href="/portal-preview" className="hover:text-primary transition-colors">
              首页
            </a>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: BRAND.textSub }}>行情</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <div
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded mb-4"
                style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
              >
                <BarChart3 className="w-3 h-3" />
                行情中心 · MARKET
              </div>
              <h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
                style={{ color: BRAND.text }}
              >
                实时数字资产
                <span style={{ color: BRAND.primary }}>·</span>
                行情总览
              </h1>
              <p className="text-base max-w-2xl leading-relaxed mb-6" style={{ color: BRAND.textSub }}>
                覆盖 30+ 主流币种与树图生态资产，提供热搜榜、涨幅榜、跌幅榜、成交额榜等多维度数据。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-xs"
                  style={{
                    backgroundColor: BRAND.card,
                    color: BRAND.textSub,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
                  最近更新：<span className="font-mono">{formatTime(lastUpdate)}</span>
                </div>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-xs"
                  style={{
                    backgroundColor: BRAND.card,
                    color: BRAND.textMute,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  搜索币种
                  <kbd
                    className="text-[10px] px-1 rounded font-mono"
                    style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}` }}
                  >
                    /
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. 4 大 KPI 卡（CountUp） ===== */}
      <section
        className="sticky top-16 z-30"
        style={{
          backgroundColor: BRAND.card,
          borderTop: `1px solid ${BRAND.border}`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: '总市值', value: kpis.totalCap, prefix: '$', short: true },
            { icon: Activity, label: '24h 成交额', value: kpis.totalVolume, prefix: '$', short: true },
            { icon: Layers, label: '活跃币种', value: kpis.activeCoins, suffix: ' 个' },
            { icon: TrendingUp, label: '上涨 / 下跌', value: kpis.gainers, suffix: ` / ${kpis.losers}` },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>
                    {kpi.label}
                  </div>
                  <CountUp
                    key={kpiKey + '-' + i}
                    value={kpi.value}
                    prefix={kpi.prefix}
                    suffix={kpi.suffix}
                    short={kpi.short}
                    className="text-lg font-extrabold"
                    style={{ color: BRAND.text }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 3. 6 大分类 Tab + 搜索/排序 ===== */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'hot' as TabKey, label: '热搜榜', icon: Sparkles },
              { key: 'gainers' as TabKey, label: '涨幅榜', icon: TrendingUp },
              { key: 'losers' as TabKey, label: '跌幅榜', icon: TrendingDown },
              { key: 'volume' as TabKey, label: '成交额榜', icon: BarChart3 },
              { key: 'treegraph' as TabKey, label: '树图生态', icon: Leaf },
              { key: 'watchlist' as TabKey, label: '自选', icon: Star, badge: watchlist.size },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? BRAND.primaryLt : BRAND.card,
                    color: isActive ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${isActive ? BRAND.primary : BRAND.border}`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {t.badge !== undefined && t.badge > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5"
                      style={{
                        backgroundColor: isActive ? BRAND.primary : BRAND.bgAlt,
                        color: isActive ? BRAND.onPrimary : BRAND.textMute,
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 h-10 rounded-lg flex-1 md:flex-initial md:w-64"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索币种名称 / 符号"
                className="flex-1 outline-none bg-transparent text-xs"
                style={{ color: BRAND.text }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setSortKey('rank');
                setSortDir('asc');
              }}
              className="px-3 h-10 rounded-lg text-xs inline-flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
              title="重置排序"
            >
              <Filter className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
        </div>
      </section>

      {/* ===== 4. 行情表 ===== */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {/* 表头 */}
          <div
            className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold tracking-widest uppercase"
            style={{
              backgroundColor: BRAND.bg,
              color: BRAND.textMute,
              borderBottom: `1px solid ${BRAND.border}`,
            }}
          >
            <div className="col-span-1 cursor-pointer" onClick={() => handleSort('rank')}>
              <SortLabel active={sortKey === 'rank'} dir={sortDir}>
                #
              </SortLabel>
            </div>
            <div className="col-span-3 cursor-pointer" onClick={() => handleSort('name')}>
              <SortLabel active={sortKey === 'name'} dir={sortDir}>
                币种
              </SortLabel>
            </div>
            <div className="col-span-2 text-right cursor-pointer" onClick={() => handleSort('price')}>
              <SortLabel active={sortKey === 'price'} dir={sortDir} align="right">
                价格
              </SortLabel>
            </div>
            <div className="col-span-2 text-right cursor-pointer" onClick={() => handleSort('change')}>
              <SortLabel active={sortKey === 'change'} dir={sortDir} align="right">
                24h 涨跌
              </SortLabel>
            </div>
            <div className="col-span-2 text-right cursor-pointer" onClick={() => handleSort('volume')}>
              <SortLabel active={sortKey === 'volume'} dir={sortDir} align="right">
                24h 成交额
              </SortLabel>
            </div>
            <div className="col-span-2 text-right">趋势 / 操作</div>
          </div>

          {tableData.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.textMute }} />
              <p className="text-sm" style={{ color: BRAND.textMute }}>
                {tab === 'watchlist' ? '暂无自选币种，点击星标添加' : '未找到匹配的币种'}
              </p>
            </div>
          ) : (
            <div>
              {tableData.map((c, idx) => (
                <CoinRow
                  key={c.symbol}
                  coin={c}
                  idx={idx}
                  isWatched={watchlist.has(c.symbol)}
                  onToggleWatch={() => toggleWatch(c.symbol)}
                  onClick={() => setDrawerCoin(c)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 5. 市场洞察 + 树图专区 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 市场情绪 */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
                style={{ color: BRAND.textMute }}
              >
                <Zap className="w-3 h-3" />
                市场情绪
              </div>
              <div
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(14, 203, 129, 0.12)',
                  color: BRAND.success,
                }}
              >
                看多
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-extrabold" style={{ color: BRAND.success }}>
                68
              </div>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                / 100
              </div>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden mb-3"
              style={{ backgroundColor: BRAND.bg }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: '68%', backgroundColor: BRAND.success }}
              />
            </div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>
              基于 24h 涨跌家数、成交额变化、波动率综合计算
            </div>
          </div>

          {/* 树图生态专区 */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${BRAND.card} 0%, rgba(14, 203, 129, 0.05) 100%)`,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
                style={{ color: BRAND.textMute }}
              >
                <Leaf className="w-3 h-3" style={{ color: BRAND.success }} />
                树图公链生态
              </div>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ backgroundColor: 'rgba(14, 203, 129, 0.12)', color: BRAND.success }}
              >
                BETA
              </span>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
              5 个树图生态资产
            </div>
            <div className="text-xs mb-3" style={{ color: BRAND.textMute }}>
              总市值 $3.1B，24h 成交额 $171M
            </div>
            <a
              href="/portal-preview/discover"
              className="text-xs font-bold inline-flex items-center gap-1"
              style={{ color: BRAND.success }}
            >
              查看树图专区
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {/* 资金流向 */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-1.5"
              style={{ color: BRAND.textMute }}
            >
              <Globe2 className="w-3 h-3" />
              24h 资金流向
            </div>
            <div className="space-y-2">
              <FlowRow label="主流币" value="+12.5%" up />
              <FlowRow label="DeFi" value="+8.3%" up />
              <FlowRow label="Meme" value="+15.7%" up />
              <FlowRow label="L2 / 新公链" value="-3.2%" />
              <FlowRow label="稳定币" value="+0.1%" up />
            </div>
            <div className="text-[10px] mt-3" style={{ color: BRAND.textMute }}>
              占比按成交额估算
            </div>
          </div>
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
                行情数据为占位估算
              </div>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                本页所展示的价格、成交额、市值等数据为 mock 占位示例，仅用于界面演示。实际交易请以真实行情接口为准。
                数字资产价格波动较大，请理性投资。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. CTA 引导 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.card} 100%)`,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          <div>
            <h3 className="text-lg font-bold mb-1" style={{ color: BRAND.text }}>
              查看实时行情，开始交易
            </h3>
            <p className="text-xs" style={{ color: BRAND.textSub }}>
              注册后即可查看完整深度行情、K 线与交易功能
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/auth/register"
              className="px-5 h-10 inline-flex items-center text-sm font-bold rounded-lg"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              立即注册
              <ChevronRight className="w-4 h-4 ml-1" />
            </a>
            <a
              href="/portal-preview/buy-crypto"
              className="px-5 h-10 inline-flex items-center text-sm font-semibold rounded-lg"
              style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              买币 →
            </a>
          </div>
        </div>
      </section>

      {/* ===== Search Drawer ===== */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl shadow-2xl"
            style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}` }}
            >
              <Search className="w-5 h-5" style={{ color: BRAND.textMute }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索币种名称或符号（BTC、ETH、树图…）"
                className="flex-1 outline-none bg-transparent text-sm"
                style={{ color: BRAND.text }}
              />
              <kbd
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: BRAND.bgAlt,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.textMute,
                }}
              >
                Esc
              </kbd>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto custom-scrollbar">
              {coins
                .filter(
                  (c) =>
                    !searchQuery ||
                    c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 8)
                .map((c) => (
                  <button
                    key={c.symbol}
                    onClick={() => {
                      setSearchOpen(false);
                      setDrawerCoin(c);
                    }}
                    className="w-full text-left rounded-lg p-3 flex items-center gap-3 transition-colors"
                    style={{ backgroundColor: BRAND.bg }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.primaryLt)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      {c.symbol.slice(0, 3)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                        {c.name} <span style={{ color: BRAND.textMute }}>· {c.symbol}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                        {c.pair}
                      </div>
                    </div>
                    <div
                      className="text-xs font-mono font-bold"
                      style={{ color: c.change24h >= 0 ? BRAND.success : BRAND.danger }}
                    >
                      {c.change24h >= 0 ? '+' : ''}
                      {c.change24h.toFixed(2)}%
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 币种详情 Drawer ===== */}
      {drawerCoin && (
        <CoinDrawer
          coin={drawerCoin}
          isWatched={watchlist.has(drawerCoin.symbol)}
          onToggleWatch={() => toggleWatch(drawerCoin.symbol)}
          onClose={() => setDrawerCoin(null)}
        />
      )}
    </div>
  );
}

// ============== 子组件 ==============

function CoinRow({
  coin,
  idx,
  isWatched,
  onToggleWatch,
  onClick,
}: {
  coin: Coin;
  idx: number;
  isWatched: boolean;
  onToggleWatch: () => void;
  onClick: () => void;
}) {
  const isUp = coin.change24h >= 0;
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-12 gap-2 px-5 py-3 text-sm cursor-pointer transition-colors animate-fadeInUp"
      style={{
        borderBottom: idx === 0 ? 'none' : `1px solid ${BRAND.border}`,
        animationDelay: `${idx * 30}ms`,
        animationFillMode: 'both',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div className="col-span-1 text-xs" style={{ color: BRAND.textMute }}>
        {coin.rank}
      </div>
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{
            backgroundColor: coin.isTreeGraph ? 'rgba(14, 203, 129, 0.12)' : BRAND.primaryLt,
            color: coin.isTreeGraph ? BRAND.success : BRAND.primary,
          }}
        >
          {coin.symbol.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: BRAND.text }}>
            {coin.name} <span style={{ color: BRAND.textMute }}>· {coin.symbol}</span>
          </div>
          <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>
            {coin.pair}
            {coin.isTreeGraph && (
              <span
                className="ml-1.5 text-[9px] px-1 py-0.5 rounded font-bold"
                style={{ backgroundColor: 'rgba(14, 203, 129, 0.12)', color: BRAND.success }}
              >
                树图
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-2 text-right text-xs font-mono font-bold" style={{ color: BRAND.text }}>
        {formatPrice(coin.price, 'USDT')}
      </div>
      <div
        className="col-span-2 text-right text-xs font-bold inline-flex items-center justify-end gap-1"
        style={{ color: isUp ? BRAND.success : BRAND.danger }}
      >
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}
        {coin.change24h.toFixed(2)}%
      </div>
      <div className="col-span-2 text-right text-xs font-mono" style={{ color: BRAND.textSub }}>
        ${formatShort(coin.volume24h)}
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1.5">
        <Sparkline data={coin.sparkline} up={isUp} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatch();
          }}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
          style={{
            backgroundColor: isWatched ? BRAND.primaryLt : BRAND.bg,
            color: isWatched ? BRAND.primary : BRAND.textMute,
            border: `1px solid ${isWatched ? BRAND.primary : BRAND.border}`,
          }}
          aria-label={isWatched ? '取消自选' : '加入自选'}
        >
          <Star className="w-3.5 h-3.5" fill={isWatched ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={up ? BRAND.success : BRAND.danger}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortLabel({
  active,
  dir,
  children,
  align = 'left',
}: {
  active: boolean;
  dir: SortDir;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
    >
      {children}
      {active ? (
        dir === 'asc' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </span>
  );
}

function CoinDrawer({
  coin,
  isWatched,
  onToggleWatch,
  onClose,
}: {
  coin: Coin;
  isWatched: boolean;
  onToggleWatch: () => void;
  onClose: () => void;
}) {
  const isUp = coin.change24h >= 0;
  const high = Math.max(...coin.sparkline);
  const low = Math.min(...coin.sparkline);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: BRAND.overlay }}
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 h-full w-full max-w-xl overflow-y-auto custom-scrollbar animate-slideInRight"
        style={{ backgroundColor: BRAND.card, borderLeft: `1px solid ${BRAND.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: BRAND.card, borderBottom: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: coin.isTreeGraph ? 'rgba(14, 203, 129, 0.12)' : BRAND.primaryLt,
                color: coin.isTreeGraph ? BRAND.success : BRAND.primary,
              }}
            >
              {coin.symbol.slice(0, 3)}
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>
                {coin.name}{' '}
                <span style={{ color: BRAND.textMute }}>· {coin.symbol}</span>
              </h2>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                {coin.pair} · 市值排名 #{coin.rank}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 当前价 + 涨跌 */}
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <div className="text-3xl font-extrabold font-mono" style={{ color: BRAND.text }}>
                {formatPrice(coin.price, 'USDT')}
              </div>
              <div
                className="text-sm font-bold inline-flex items-center gap-1"
                style={{ color: isUp ? BRAND.success : BRAND.danger }}
              >
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isUp ? '+' : ''}
                {coin.change24h.toFixed(2)}%
              </div>
            </div>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>
              24h 区间：高 ${high.toFixed(2)} · 低 ${low.toFixed(2)}
            </div>
          </div>

          {/* 大型 sparkline */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-1.5"
              style={{ color: BRAND.textMute }}
            >
              <Activity className="w-3 h-3" />
              7 周期价格趋势（占位估算）
            </div>
            <BigSparkline data={coin.sparkline} up={isUp} />
          </div>

          {/* 关键指标 */}
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3"
              style={{ color: BRAND.textMute }}
            >
              关键指标
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '24h 成交额', value: `$${formatShort(coin.volume24h)}` },
                { label: '总市值', value: `$${formatShort(coin.marketCap)}` },
                { label: '流通量', value: formatShort(coin.marketCap / coin.price) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-sm font-extrabold" style={{ color: BRAND.primary }}>
                    {s.value}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 币种信息 */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center gap-1.5"
              style={{ color: BRAND.textMute }}
            >
              <Info className="w-3 h-3" />
              币种信息
            </div>
            <div className="space-y-2 text-xs">
              <InfoRow label="所属生态" value={coin.isTreeGraph ? '树图公链生态' : '主流公链'} />
              <InfoRow label="交易对" value={coin.pair} />
              <InfoRow label="计价单位" value="USDT" />
              <InfoRow
                label="24h 状态"
                value={
                  isUp
                    ? `上涨 +${coin.change24h.toFixed(2)}%`
                    : `下跌 ${coin.change24h.toFixed(2)}%`
                }
                color={isUp ? BRAND.success : BRAND.danger}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleWatch}
              className="flex-1 px-4 h-11 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: isWatched ? BRAND.card : BRAND.primaryLt,
                color: isWatched ? BRAND.text : BRAND.primary,
                border: `1px solid ${isWatched ? BRAND.border : BRAND.primary}`,
              }}
            >
              {isWatched ? (
                <>
                  <Check className="w-4 h-4" />
                  已加入自选
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  加入自选
                </>
              )}
            </button>
            <button
              disabled
              className="flex-1 px-4 h-11 rounded-lg text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              去交易 →
            </button>
          </div>

          <div
            className="rounded-lg p-3 text-[10px] flex items-start gap-2"
            style={{
              backgroundColor: 'rgba(255, 169, 64, 0.08)',
              color: BRAND.warning,
              border: `1px solid rgba(255, 169, 64, 0.2)`,
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              数字资产价格波动较大，请理性投资。交易功能需要先完成 KYC 与登录。本页所展示的数据为 mock 占位。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 480;
  const h = 100;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={`spark-grad-${up ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? BRAND.success : BRAND.danger} stopOpacity="0.3" />
          <stop offset="100%" stopColor={up ? BRAND.success : BRAND.danger} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#spark-grad-${up ? 'up' : 'down'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={up ? BRAND.success : BRAND.danger}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: BRAND.textMute }}>{label}</span>
      <span className="font-semibold" style={{ color: color || BRAND.text }}>
        {value}
      </span>
    </div>
  );
}

// ============== CountUp 组件 ==============

function CountUp({
  value,
  duration = 1200,
  prefix = '',
  suffix = '',
  short = false,
  className,
  style,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  short?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {short && display >= 10000 ? formatShort(display) : Math.round(display).toLocaleString()}
      {suffix}
    </span>
  );
}

// ============== Helpers ==============

function formatPrice(price: number, unit: string): string {
  if (unit === 'CNY') return `¥${price.toFixed(4)}`;
  if (price >= 1000) return `$${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatShort(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export default PortalMarket;
