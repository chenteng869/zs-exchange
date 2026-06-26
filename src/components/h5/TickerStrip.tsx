'use client';

/**
 * H5 热门行情横滑条 — 后端 API 轮询（国内可用）
 */

import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import { useTickersData, fmtPrice } from '@/hooks/useMarketData';
import { getHotPairs, type H5Pair } from '@/lib/h5/top20-pairs';

interface TickerStripProps {
  pairs?: readonly H5Pair[];
  title?: string;
}

export function TickerStrip({ pairs, title = '热门行情' }: TickerStripProps) {
  const list = pairs ?? getHotPairs();
  // H5 symbol 'BTC/USDT' → API symbol 'BTCUSDT'
  const apiSymbols = list.map((p) => p.symbol.replace('/', ''));
  const { tickers, loading } = useTickersData(apiSymbols, 4000);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
        <Flame size={14} color="#F472B6" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{title}</span>
        {/* 连接状态指示 */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, color: loading ? '#F0B90B' : '#34D399',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: loading ? '#F0B90B' : '#34D399',
            animation: loading ? 'pulse 1s infinite' : undefined,
          }} />
          {loading ? '加载中' : '连接中'}
        </span>
        <Link href="/h5/markets" style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 2,
          fontSize: 10, color: '#7B89B8', textDecoration: 'none',
        }}>
          全部 <ChevronRight size={10} />
        </Link>
      </div>

      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px 8px',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
      }}>
        {list.map((p) => {
          const apiSym = p.symbol.replace('/', '');
          const t = tickers.get(apiSym);
          const lastPrice = t ? parseFloat(t.lastPrice) : null;
          const pct = t ? parseFloat(t.changePercent24h) : null;
          const up = pct !== null ? pct >= 0 : true;
          const color = up ? '#34D399' : '#F472B6';

          return (
            <Link
              key={p.symbol}
              href={`/h5/trade?symbol=${encodeURIComponent(p.symbol)}`}
              style={{
                flex: '0 0 120px', scrollSnapAlign: 'start', display: 'block',
                padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
                background: 'linear-gradient(180deg, rgba(26,36,86,0.55) 0%, rgba(21,34,74,0.70) 100%)',
                border: '1px solid rgba(148,163,184,0.10)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: -8, right: -8, fontSize: 26, opacity: 0.18, color: p.color }}>
                {p.emoji}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>{p.base}</span>
                <span style={{ fontSize: 9, color: '#7B89B8' }}>/USDT</span>
              </div>
              <div style={{ fontSize: 15, color: '#F8FAFC', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums', position: 'relative', minHeight: 18 }}>
                {lastPrice !== null ? fmtPrice(lastPrice) : <span style={{ color: '#7B89B8' }}>—</span>}
              </div>
              <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2, position: 'relative', minHeight: 14 }}>
                {pct !== null
                  ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
                  : <span style={{ color: '#7B89B8' }}>…</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
