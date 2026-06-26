'use client';

import Link from 'next/link';
import { MOCK_TICKERS } from '@/lib/mock-data';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// 热门交易对 (取前12个)
const HOT_PAIRS = MOCK_TICKERS.slice(0, 12);

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

// 简单的sparkline SVG生成
function Sparkline({ change }: { change: number }) {
  const isUp = change >= 0;
  const color = isUp ? '#16C784' : '#EA3943';
  // 根据涨跌幅生成不同的路径
  const points = isUp
    ? '0,30 8,25 16,28 24,18 32,22 40,10 48,15 56,5'
    : '0,5 8,12 16,8 24,18 32,14 40,25 48,20 56,30';

  return (
    <svg width="60" height="35" viewBox="0 0 60 35" className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 5.2 章「行情区」
// 背景 #131A2E / 卡片 #131A2E / 上涨 #16C784 / 下跌 #EA3943
// 币种名称 #F8FAFC / 价格 #FFFFFF / 成交量 #94A3B8
export default function MarketOverview() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 relative"
      style={{ background: 'transparent' }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-6xl mx-auto"
      >
        {/* 标题 */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-2"
              style={{ color: '#F8FAFC' }}
            >
              市场概览
            </h2>
            <p className="text-lg" style={{ color: '#94A3B8' }}>
              实时热门交易对行情
            </p>
          </div>
          <Link
            href="/trade/pairs"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: '#38BDF8' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#38BDF8';
            }}
          >
            查看全部 →
          </Link>
        </motion.div>

        {/* 自定义深色表格 */}
        <motion.div
          variants={staggerItem}
          className="rounded-xl overflow-hidden"
          style={{
            background: '#131A2E',
            border: '1px solid #2A3556',
          }}
        >
          {/* 表头 */}
          <div
            className="grid grid-cols-5 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: '#101729',
              color: '#94A3B8',
              borderBottom: '1px solid #2A3556',
            }}
          >
            <div>交易对</div>
            <div className="text-right">最新价</div>
            <div className="text-right">24h涨跌</div>
            <div className="text-right">24h成交量</div>
            <div className="text-right">走势</div>
          </div>

          {/* 表格行 */}
          {HOT_PAIRS.map((row, idx) => (
            <Link
              key={row.symbol}
              href={`/trade/spot?symbol=${row.symbol}`}
              className="grid grid-cols-5 gap-4 px-6 py-4 transition-colors items-center"
              style={{
                borderBottom:
                  idx < HOT_PAIRS.length - 1 ? '1px solid rgba(30, 41, 59, 0.5)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(22, 119, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* 交易对 */}
              <div>
                <span
                  className="font-semibold transition-colors"
                  style={{ color: '#F8FAFC' }}
                >
                  {row.baseAsset}
                </span>
                <span style={{ color: '#94A3B8' }} className="mx-1">/</span>
                <span className="text-sm" style={{ color: '#94A3B8' }}>
                  {row.quoteAsset}
                </span>
              </div>

              {/* 最新价 */}
              <div
                className="text-right font-mono font-medium tabular-nums"
                style={{ color: '#FFFFFF' }}
              >
                ${formatPrice(row.price)}
              </div>

              {/* 24h涨跌 */}
              <div
                className="text-right inline-flex items-center justify-end gap-1 font-mono text-sm font-semibold"
                style={{ color: row.change24h >= 0 ? '#16C784' : '#EA3943' }}
              >
                {row.change24h >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {row.change24h >= 0 ? '+' : ''}
                {row.change24h.toFixed(2)}%
              </div>

              {/* 24h成交量 */}
              <div
                className="text-right font-mono text-sm tabular-nums"
                style={{ color: '#94A3B8' }}
              >
                {formatVolume(row.volume24h)}
              </div>

              {/* 走势 */}
              <div className="text-right">
                <Sparkline change={row.change24h} />
              </div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
