'use client';

import Link from 'next/link';
import { MOCK_TICKERS } from '@/lib/mock-data';
import { fadeIn } from '@/lib/animations';
import { motion } from 'framer-motion';

// 取Top20用于滚动展示
const TOP_TICKERS = MOCK_TICKERS.slice(0, 20);

// 复制一份用于无缝滚动
const SCROLL_ITEMS = [...TOP_TICKERS, ...TOP_TICKERS];

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

export default function TickerTape() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="w-full bg-[#F7F8FA] border-b border-[#EAECEF] py-2.5 overflow-hidden"
    >
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
      `}</style>

      <div className="ticker-track flex items-center gap-6 whitespace-nowrap w-max px-2">
        {SCROLL_ITEMS.map((ticker, index) => (
          <Link
            key={`${ticker.symbol}-${index}`}
            href={`/trade/spot?symbol=${ticker.symbol}`}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-deep-700/50 transition-colors group"
          >
            {/* 名称 */}
            <span className="text-xs sm:text-sm font-semibold text-text-primary group-hover:text-brand-light transition-colors">
              {ticker.baseAsset}
              <span className="text-text-muted mx-0.5">/</span>
              <span className="text-text-secondary">{ticker.quoteAsset}</span>
            </span>
            {/* 价格 */}
            <span className="text-xs sm:text-sm font-mono text-text-primary">
              ${formatPrice(ticker.price)}
            </span>
            {/* 涨跌幅 */}
            <span
              className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                ticker.change24h >= 0
                  ? 'text-samoa bg-success/12'
                  : 'text-danger bg-danger/12'
              }`}
            >
              {ticker.change24h >= 0 ? '+' : ''}
              {ticker.change24h.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
