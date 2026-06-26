﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTicker } from '@/hooks/useTicker';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';
import { fadeIn } from '@/lib/animations';

// ==================== 价格格式化 ====================
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  if (price >= 0.01) {
    return price.toFixed(4);
  }
  return price.toFixed(6);
}

// ==================== 单个 Ticker 项组件 ====================
interface TickerItemProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  changePercent24h: number;
  index: number;
}

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 5.2 章「行情区」
// 卡片 #131A2E / 上涨 #16C784 / 下跌 #EA3943 / 币种名 #F8FAFC / 价格 #FFFFFF
function TickerItem({ symbol, baseAsset, quoteAsset, price, changePercent24h, index }: TickerItemProps) {
  const { displayValue, direction, isAnimating } = usePriceAnimation(price, {
    duration: 400,
    decimals: price >= 1 ? 2 : 4,
  });

  const isPositive = changePercent24h >= 0;

  // 闪烁效果 class
  const flashClass =
    isAnimating && direction !== 'none'
      ? direction === 'up'
        ? 'animate-flash-green'
        : 'animate-flash-red'
      : '';

  return (
    <Link
      key={`${symbol}-${index}`}
      href={`/trade/spot?symbol=${symbol}`}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors group ${flashClass}`}
      style={{
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(22, 119, 255, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* 名称 */}
      <span
        className="text-xs sm:text-sm font-semibold transition-colors"
        style={{ color: '#F8FAFC' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#38BDF8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#F8FAFC';
        }}
      >
        {baseAsset}
        <span style={{ color: '#94A3B8' }} className="mx-0.5">/</span>
        <span style={{ color: '#94A3B8' }}>{quoteAsset}</span>
      </span>

      {/* 价格 - 带动画 */}
      <span
        className="text-xs sm:text-sm font-mono tabular-nums transition-colors duration-200"
        style={{
          color: isAnimating && direction === 'up'
            ? '#16C784'
            : isAnimating && direction === 'down'
              ? '#EA3943'
              : '#FFFFFF',
        }}
      >
        ${formatPrice(displayValue)}
      </span>

      {/* 涨跌幅 */}
      <span
        className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
        style={{
          color: isPositive ? '#16C784' : '#EA3943',
          background: isPositive
            ? 'rgba(22, 199, 132, 0.12)'
            : 'rgba(234, 57, 67, 0.12)',
        }}
      >
        {isPositive ? '+' : ''}
        {changePercent24h.toFixed(2)}%
      </span>
    </Link>
  );
}

// ==================== 主组件 ====================
export default function TickerTapeLive() {
  const { tickers, isLoading } = useTicker({ interval: 1000 });

  // 复制一份用于无缝滚动
  const scrollItems = useMemo(() => [...tickers, ...tickers], [tickers]);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="w-full py-2.5 overflow-hidden"
      style={{
        background: '#131A2E',
        borderBottom: '1px solid #2A3556',
      }}
    >
      {/* 内联样式：滚动动画 + 闪烁动画 */}
      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes flash-green {
          0% {
            background-color: rgba(22, 199, 132, 0.20);
          }
          100% {
            background-color: transparent;
          }
        }
        @keyframes flash-red {
          0% {
            background-color: rgba(234, 57, 67, 0.20);
          }
          100% {
            background-color: transparent;
          }
        }
        .animate-flash-green {
          animation: flash-green 500ms ease-out;
        }
        .animate-flash-red {
          animation: flash-red 500ms ease-out;
        }
      `}</style>

      {/* 连接状态指示器 */}
      <div className="flex items-center gap-2 px-3 mb-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isLoading ? 'animate-pulse' : ''
          }`}
          style={{
            background: isLoading ? '#F59E0B' : '#16C784',
          }}
        />
        <span
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{ color: '#94A3B8' }}
        >
          {isLoading ? 'Connecting...' : 'Live'}
        </span>
      </div>

      {/* 滚动内容 */}
      <div className="ticker-track flex items-center gap-6 whitespace-nowrap w-max px-2">
        {scrollItems.map((ticker, index) => (
          <TickerItem
            key={`${ticker.symbol}-${index}`}
            symbol={ticker.symbol}
            baseAsset={ticker.baseAsset}
            quoteAsset={ticker.quoteAsset}
            price={ticker.price}
            changePercent24h={ticker.changePercent24h}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
