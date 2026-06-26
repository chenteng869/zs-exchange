'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import Table, { Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { MOCK_TICKERS } from '@/lib/mock-data';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 筛选Tab类型 ====================
type FilterTab = 'all' | 'USDT' | 'USDC' | 'BTC' | 'ETH';

// ==================== 排序字段类型 ====================
type SortField = 'symbol' | 'price' | 'change24h' | 'volume24h';
type SortOrder = 'asc' | 'desc';

// ==================== 筛选Tab配置 ====================
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'USDT', label: 'USDT' },
  { key: 'USDC', label: 'USDC' },
  { key: 'BTC', label: 'BTC' },
  { key: 'ETH', label: 'ETH' },
];

export default function MarketsPage() {
  // ==================== 状态管理 ====================
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // ==================== 数据筛选与排序逻辑 ====================
  const filteredAndSortedData = useMemo(() => {
    let data = [...MOCK_TICKERS];

    // 按交易对类型筛选
    if (activeFilter !== 'all') {
      data = data.filter((ticker) => ticker.quoteAsset === activeFilter);
    }

    // 按名称搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (ticker) =>
          ticker.symbol.toLowerCase().includes(query) ||
          ticker.baseAsset.toLowerCase().includes(query)
      );
    }

    // 排序处理
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change24h':
          comparison = a.change24h - b.change24h;
          break;
        case 'volume24h':
          comparison = a.volume24h - b.volume24h;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [activeFilter, searchQuery, sortField, sortOrder]);

  // ==================== 切换排序 ====================
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // ==================== 格式化价格显示 ====================
  const formatPrice = (price: number): string => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
  };

  // ==================== 格式化成交量显示 ====================
  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== 页面标题区域 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                全球市场行情
              </h1>
              <p className="text-text-secondary text-base">
                实时追踪 500+ 交易对价格动态，掌握市场脉搏
              </p>
            </div>
            {/* 萨摩亚持牌徽章 */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/60 bg-samoa/10">
              <span className="text-lg">🇼🇸</span>
              <span className="text-sm font-medium text-samoa">萨摩亚持牌交易所</span>
            </div>
          </div>
        </motion.section>

        {/* ==================== 筛选工具栏 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="max-w-[1400px] mx-auto px-4 lg:px-6 mb-6"
        >
          <div className="bg-white border border-[#EAECEF] rounded-xl p-4 md:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* 左侧：筛选Tab + 搜索框 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                {/* Tab切换器 */}
                <div className="flex items-center gap-1 bg-deep-900 rounded-lg p-1">
                  <Filter size={16} className="text-text-muted ml-2" />
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        activeFilter === tab.key
                          ? 'bg-brand-500 text-white shadow-glow-purple'
                          : 'text-text-secondary hover:text-text-primary hover:bg-deep-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 搜索框 */}
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索交易对..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#EAECEF] rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* 右侧：排序按钮组 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-text-muted mr-2">排序:</span>
                {[
                  { field: 'volume24h' as SortField, label: '成交量' },
                  { field: 'change24h' as SortField, label: '涨跌幅' },
                  { field: 'price' as SortField, label: '价格' },
                  { field: 'symbol' as SortField, label: '名称' },
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      sortField === field
                        ? 'bg-brand-500/20 text-brand-500 border border-brand-500/40'
                        : 'text-text-secondary hover:text-text-primary border border-transparent hover:border-[#EAECEF]'
                    }`}
                  >
                    {label}
                    <ArrowUpDown size={12} />
                    {sortField === field && (
                      <span className="text-[10px]">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 结果统计 */}
            <div className="mt-4 pt-4 border-t border-deep-700/50 flex items-center justify-between">
              <span className="text-sm text-text-muted">
                共 <span className="text-brand-500 font-semibold">{filteredAndSortedData.length}</span> 个交易对
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-brand-500 hover:text-brand-light transition-colors"
                >
                  清除搜索
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* ==================== 行情表格区域 ==================== */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16"
        >
          <Table striped>
            <Thead>
              <Tr isZebra={false}>
                <Th className="w-16">#</Th>
                <Th>名称</Th>
                <Th className="text-right">最新价</Th>
                <Th className="text-right cursor-pointer hover:text-brand-500 transition-colors" onClick={() => handleSort('change24h')}>
                  <div className="flex items-center justify-end gap-1">
                    24h涨跌幅
                    {sortField === 'change24h' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </Th>
                <Th className="text-right cursor-pointer hover:text-brand-500 transition-colors hidden md:table-cell" onClick={() => handleSort('volume24h')}>
                  <div className="flex items-center justify-end gap-1">
                    24h成交量
                    {sortField === 'volume24h' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </Th>
                <Th className="w-28 text-center">操作</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredAndSortedData.map((ticker, index) => (
                <motion.tr
                  key={ticker.symbol}
                  variants={staggerItem}
                  className="transition-colors duration-150 hover:bg-deep-800/50"
                >
                  <Td className="text-text-muted">{index + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      {/* 币种图标占位符 */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {ticker.baseAsset.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">
                          {ticker.baseAsset}
                        </div>
                        <div className="text-xs text-text-muted">
                          {ticker.baseAsset}/{ticker.quoteAsset}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right font-mono font-medium text-text-primary">
                    {formatPrice(ticker.price)}
                  </Td>
                  <Td className={`text-right font-mono font-medium ${ticker.change24h >= 0 ? 'text-success' : 'text-danger'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {ticker.change24h >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {Math.abs(ticker.change24h).toFixed(2)}%
                    </div>
                  </Td>
                  <Td className="text-right font-mono text-text-secondary hidden md:table-cell">
                    {formatVolume(ticker.volume24h)}
                  </Td>
                  <Td className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="!px-3 !py-1 !text-xs"
                    >
                      交易
                    </Button>
                  </Td>
                </motion.tr>
              ))}
            </Tbody>
          </Table>

          {/* 空状态提示 */}
          {filteredAndSortedData.length === 0 && (
            <motion.div
              variants={fadeInUp}
              className="text-center py-16"
            >
              <div className="text-5xl mb-4 text-brand-500 font-bold">--</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                未找到匹配的交易对
              </h3>
              <p className="text-text-secondary mb-6">
                尝试调整筛选条件或搜索关键词
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
              >
                重置筛选
              </Button>
            </motion.div>
          )}
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
