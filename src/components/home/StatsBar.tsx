'use client';

import { MOCK_STATS_BAR } from '@/lib/mock-data';
import { fadeIn } from '@/lib/animations';
import { motion } from 'framer-motion';

function formatPrice(price: number): string {
  if (price >= 1_000_000_000_000) {
    return `$${(price / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (price >= 1_000_000_000) {
    return `$${(price / 1_000_000_000).toFixed(2)}B`;
  }
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(price < 1 ? 4 : 2)}`;
}

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 5.2 章「行情区」
// 背景 #131A2E / 卡片 #131A2E / 上涨 #16C784 / 下跌 #EA3943
// 币种名称 #F8FAFC / 价格 #FFFFFF / 成交量 #94A3B8
export default function StatsBar() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="w-full py-3 overflow-x-auto"
      style={{
        background: '#131A2E',
        borderTop: '1px solid #2A3556',
        borderBottom: '1px solid #2A3556',
      }}
    >
      <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-16 min-w-max px-4">
        {/* BTC */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: '#94A3B8' }}
          >
            BTC
          </span>
          <span
            className="text-sm font-mono font-semibold whitespace-nowrap"
            style={{ color: '#FFFFFF' }}
          >
            {formatPrice(MOCK_STATS_BAR[0].price)}
          </span>
          <span
            className="text-xs font-mono font-semibold whitespace-nowrap"
            style={{
              color: MOCK_STATS_BAR[0].change24h >= 0 ? '#16C784' : '#EA3943',
            }}
          >
            {MOCK_STATS_BAR[0].change24h >= 0 ? '+' : ''}
            {MOCK_STATS_BAR[0].change24h.toFixed(2)}%
          </span>
        </div>

        <div className="w-px h-4" style={{ background: '#2A3556' }} />

        {/* ETH */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: '#94A3B8' }}
          >
            ETH
          </span>
          <span
            className="text-sm font-mono font-semibold whitespace-nowrap"
            style={{ color: '#FFFFFF' }}
          >
            {formatPrice(MOCK_STATS_BAR[1].price)}
          </span>
          <span
            className="text-xs font-mono font-semibold whitespace-nowrap"
            style={{
              color: MOCK_STATS_BAR[1].change24h >= 0 ? '#16C784' : '#EA3943',
            }}
          >
            {MOCK_STATS_BAR[1].change24h >= 0 ? '+' : ''}
            {MOCK_STATS_BAR[1].change24h.toFixed(2)}%
          </span>
        </div>

        <div className="w-px h-4" style={{ background: '#2A3556' }} />

        {/* 总市值 */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: '#94A3B8' }}
          >
            总市值
          </span>
          <span
            className="text-sm font-mono font-semibold whitespace-nowrap"
            style={{ color: '#FFFFFF' }}
          >
            {MOCK_STATS_BAR[2].marketCap}
          </span>
        </div>

        <div className="w-px h-4" style={{ background: '#2A3556' }} />

        {/* BTC主导率 (模拟数据) */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: '#94A3B8' }}
          >
            BTC主导率
          </span>
          <span
            className="text-sm font-mono font-semibold whitespace-nowrap"
            style={{ color: '#16C784' }}
          >
            52.8%
          </span>
        </div>

        <div
          className="w-px h-4 hidden sm:block"
          style={{ background: '#2A3556' }}
        />

        {/* 24h成交量 */}
        <div className="hidden sm:flex items-center gap-3">
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: '#94A3B8' }}
          >
            24h成交量
          </span>
          <span
            className="text-sm font-mono font-semibold whitespace-nowrap"
            style={{ color: '#FFFFFF' }}
          >
            $89.7B
          </span>
        </div>
      </div>
    </motion.div>
  );
}
