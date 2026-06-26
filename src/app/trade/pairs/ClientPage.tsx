'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  ArrowUpDown,
  Filter,
  ChevronRight,
  BarChart3,
  Coins,
  Scale,
  Sparkles,
  Trophy,
  X,
  GitCompareArrows,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { MOCK_TICKERS } from '@/lib/mock-data';

// ==================== 左侧分类树配置 ====================
const CATEGORIES = [
  { id: 'hot', label: '热门', icon: Flame, color: 'text-danger' },
  { id: 'spot', label: '现货', icon: Coins, color: 'text-success' },
  { id: 'futures', label: '合约', icon: BarChart3, color: 'text-brand-500' },
  { id: 'margin', label: '杠杆', icon: Scale, color: 'text-warning' },
  { id: 'new', label: '新上线', icon: Sparkles, color: 'text-info' },
  { id: 'gainers', label: '涨幅榜', icon: Trophy, color: 'text-samoa' },
];

// ==================== 排序选项 ====================
const SORT_OPTIONS = [
  { key: 'default', label: '默认' },
  { key: 'priceAsc', label: '价格↑' },
  { key: 'priceDesc', label: '价格↓' },
  { key: 'changeDesc', label: '涨跌幅↓' },
  { key: 'changeAsc', label: '涨跌幅↑' },
  { key: 'volumeDesc', label: '成交量↓' },
  { key: 'nameAsc', label: '名称A-Z' },
];

// 格式化大数字
const formatLargeNumber = (num: number): string => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

export default function PairsPage() {
  const router = useRouter();

  // ==================== 状态管理 ====================
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('hot');
  const [sortBy, setSortBy] = useState('default');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]); // 批量对比选中的交易对

  // 从localStorage加载收藏
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zs_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // localStorage不可用时忽略
    }
  }, []);

  // 保存收藏到localStorage
  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      try {
        localStorage.setItem('zs_favorites', JSON.stringify(next));
      } catch {
        // 忽略
      }
      return next;
    });
  };

  // 切换对比选择
  const toggleCompare = (symbol: string) => {
    setCompareList((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      if (prev.length >= 3) return prev; // 最多选3个
      return [...prev, symbol];
    });
  };

  // ==================== 根据分类筛选 + 搜索 + 排序 ====================
  const filteredTickers = useMemo(() => {
    let result = [...MOCK_TICKERS];

    // 分类筛选
    switch (activeCategory) {
      case 'hot':
        result = result.filter(
          (t) =>
            ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'].includes(t.symbol)
        );
        break;
      case 'spot':
        result = result.filter((t) => t.quoteAsset === 'USDT' || t.quoteAsset === 'USD');
        break;
      case 'futures':
        result = result.filter((t) =>
          ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'ADAUSDT'].includes(t.symbol)
        );
        break;
      case 'margin':
        result = result.filter((t) =>
          ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].includes(t.symbol)
        );
        break;
      case 'new':
        result = result.slice(-8);
        break;
      case 'gainers':
        result = [...result].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
        break;
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.baseAsset.toLowerCase().includes(q) ||
          t.quoteAsset.toLowerCase().includes(q)
      );
    }

    // 排序
    switch (sortBy) {
      case 'priceAsc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'changeDesc':
        result.sort((a, b) => b.change24h - a.change24h);
        break;
      case 'changeAsc':
        result.sort((a, b) => a.change24h - b.change24h);
        break;
      case 'volumeDesc':
        result.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'nameAsc':
        result.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
    }

    return result;
  }, [searchQuery, activeCategory, sortBy]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== 页面标题区 ==================== */}
        <motion.header
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="bg-deep-800 border-b border-deep-700"
        >
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-text-primary">全部交易对</h1>
                <p className="text-sm text-text-muted mt-1">
                  共 {filteredTickers.length} 个交易对 · 实时行情更新
                </p>
              </div>
              {/* 对比模式提示 */}
              {compareList.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/30 rounded-lg">
                  <GitCompareArrows size={14} className="text-brand-500" />
                  <span className="text-xs text-brand-500 font-medium">
                    已选 {compareList.length}/3 个交易对
                  </span>
                  <button onClick={() => setCompareList([])} className="ml-1 hover:text-danger transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* ==================== 主内容区域 ==================== */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ==================== 左侧：分类树 ==================== */}
            <motion.aside variants={staggerItem} className="lg:col-span-2">
              <div className="bg-deep-800 border border-deep-700 rounded-xl p-3 sticky top-[130px]">
                <nav className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeCategory === cat.id
                          ? 'bg-brand-500/10 text-brand-500 border border-brand-500/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-deep-700'
                      }`}
                    >
                      <cat.icon size={16} className={`${activeCategory === cat.id ? 'text-brand-500' : cat.color}`} />
                      {cat.label}
                      {activeCategory === cat.id && <ChevronRight size={14} className="ml-auto" />}
                    </button>
                  ))}
                </nav>
                {/* 收藏快捷入口 */}
                <div className="mt-4 pt-3 border-t border-deep-700">
                  <button
                    onClick={() => setActiveCategory('favorites')}
                    className={`w-flex w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeCategory === 'favorites'
                        ? 'bg-samoa/10 text-samoa border border-samoa/30'
                        : 'text-text-secondary hover:text-text-primary hover:bg-deep-700'
                    }`}
                  >
                    <Star size={16} className={activeCategory === 'favorites' ? 'text-samoa' : 'text-text-muted'} />
                    我的收藏
                    {favorites.length > 0 && (
                      <span className="ml-auto text-xs bg-samoa/20 text-samoa px-1.5 py-0.5 rounded-full">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* ==================== 右侧：表格区域 ==================== */}
            <motion.div variants={staggerItem} className="lg:col-span-10 space-y-4">
              {/* 搜索 + 筛选栏 */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 搜索框 */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索交易对 (如 BTC、ETH)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-deep-800 border border-deep-700 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  />
                </div>

                {/* 排序选择器 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-9 pr-8 py-2.5 bg-deep-800 border border-deep-700 rounded-lg text-sm text-text-primary focus:border-brand-500 focus:outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* 交易对表格 */}
              <div className="bg-deep-800 border border-deep-700 rounded-xl overflow-hidden">
                {/* 表头 */}
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-deep-900 text-xs text-text-muted font-medium border-b border-deep-700">
                  <span className="col-span-3">交易对</span>
                  <span className="col-span-2 text-right">最新价</span>
                  <span className="col-span-2 text-right">24h涨跌</span>
                  <span className="col-span-2 text-right">24h成交量</span>
                  <span className="col-span-2 text-right hidden sm:block">市值</span>
                  <span className="col-span-1 text-center">操作</span>
                </div>

                {/* 表格内容 */}
                <div className="divide-y divide-deep-700/50 max-h-[600px] overflow-y-auto">
                  {filteredTickers.map((ticker) => (
                    <div
                      key={ticker.symbol}
                      className={`grid grid-cols-12 gap-3 px-4 py-3 text-sm hover:bg-deep-700/30 transition-colors cursor-pointer ${
                        compareList.includes(ticker.symbol) ? 'bg-brand-500/5' : ''
                      }`}
                      onClick={() => router.push(`/trade/${ticker.symbol}`)}
                    >
                      {/* 交易对名称 */}
                      <div className="col-span-3 flex items-center gap-2">
                        {/* 复选框 - 用于批量对比 */}
                        <input
                          type="checkbox"
                          checked={compareList.includes(ticker.symbol)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCompare(ticker.symbol);
                          }}
                          className="w-3.5 h-3.5 rounded border-deep-500 accent-brand-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {/* 币种图标 */}
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary/30 to-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-500 shrink-0">
                          {ticker.baseAsset.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{ticker.baseAsset}</div>
                          <div className="text-[10px] text-text-muted">{ticker.quoteAsset}</div>
                        </div>
                        {/* 收藏星标 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(ticker.symbol);
                          }}
                          className="ml-auto shrink-0"
                        >
                          <Star
                            size={14}
                            className={
                              favorites.includes(ticker.symbol)
                                ? 'fill-samoa text-samoa'
                                : 'text-text-muted hover:text-samoa transition-colors'
                            }
                          />
                        </button>
                      </div>

                      {/* 最新价 */}
                      <div className="col-span-2 text-right font-mono font-medium text-text-primary">
                        ${ticker.price.toLocaleString(undefined, {
                          minimumFractionDigits: ticker.price >= 100 ? 2 : ticker.price >= 1 ? 4 : 6,
                          maximumFractionDigits: ticker.price >= 100 ? 2 : ticker.price >= 1 ? 4 : 6,
                        })}
                      </div>

                      {/* 24h涨跌 */}
                      <div className="col-span-2 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-sm ${
                            ticker.change24h >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {ticker.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {ticker.change24h >= 0 ? '+' : ''}
                          {ticker.change24h.toFixed(2)}%
                        </span>
                      </div>

                      {/* 24h成交量 */}
                      <div className="col-span-2 text-right font-mono text-text-secondary text-xs">
                        {formatLargeNumber(ticker.volume24h)}
                      </div>

                      {/* 市值 */}
                      <div className="col-span-2 text-right font-mono text-text-muted text-xs hidden sm:block">
                        {formatLargeNumber(ticker.marketCap ?? 0)}
                      </div>

                      {/* 操作按钮 */}
                      <div className="col-span-1 text-center">
                        <Button variant="primary" size="sm" className="!px-3 !py-1 !text-xs" onClick={(e) => e.stopPropagation()}>
                          交易
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* 空状态 */}
                  {filteredTickers.length === 0 && (
                    <div className="py-12 text-center">
                      <Filter size={32} className="mx-auto text-text-muted mb-3" />
                      <p className="text-text-muted text-sm">未找到匹配的交易对</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setActiveCategory('hot');
                        }}
                        className="mt-2 text-sm text-brand-500 hover:underline"
                      >
                        清除筛选条件
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部统计信息 */}
              <div className="flex items-center justify-between text-xs text-text-muted px-1">
                <span>显示 {filteredTickers.length} 个交易对</span>
                <span>共 {MOCK_TICKERS.length} 个交易对可用</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
