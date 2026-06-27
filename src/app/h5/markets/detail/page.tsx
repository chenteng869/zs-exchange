'use client';

/**
 * H5 行情详情页（K线 + 深度 + 成交）
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Star, Share2, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { marketApi, fmtChange, fmtPrice, fmtVolume, type MarketTicker, type OrderBook } from '@/lib/api/market';
import { PAIR_MAP, TOP20_PAIRS, type H5Pair } from '@/lib/h5/top20-pairs';

type RawKline = Array<number | string>;

interface DetailPair extends H5Pair {
  price: string;
  change: string;
  up: boolean;
  high: string;
  low: string;
  volume: string;
}

interface KlineBar {
  open: number;
  high: number;
  low: number;
  close: number;
}

function toApiSymbol(symbol: string) {
  return symbol.replace('/', '');
}

function normalizeSymbol(symbol: string | null) {
  if (!symbol) return 'BTC/USDT';
  if (symbol.includes('/')) return symbol.toUpperCase();
  if (symbol.toUpperCase().endsWith('USDT')) return `${symbol.slice(0, -4).toUpperCase()}/USDT`;
  return symbol.toUpperCase();
}

function fallbackPair(symbol: string): H5Pair {
  const [base = 'BTC', quote = 'USDT'] = symbol.split('/');
  return {
    symbol,
    base,
    quote,
    name: base,
    hot: false,
    emoji: base.slice(0, 1),
    color: '#38BDF8',
  };
}

function toDetailPair(pair: H5Pair, ticker: MarketTicker | null): DetailPair {
  const lastPrice = Number.parseFloat(String(ticker?.lastPrice ?? '0'));
  const changeSource = ticker?.changePercent24h ?? ticker?.change24h ?? '0';
  const changeValue = Number.parseFloat(String(changeSource));
  const changed = fmtChange(Number.isFinite(changeValue) ? changeValue : 0);
  const quoteVolume = Number.parseFloat(String(ticker?.quoteVolume24h || 0));
  const baseVolume = Number.parseFloat(String(ticker?.volume24h || 0));
  const volumeValue = quoteVolume || baseVolume * (Number.isFinite(lastPrice) ? lastPrice : 0);

  if (!ticker || ticker.error || !Number.isFinite(lastPrice) || lastPrice <= 0) {
    return {
      ...pair,
      price: '--',
      change: '--',
      up: true,
      high: '--',
      low: '--',
      volume: '--',
    };
  }

  return {
    ...pair,
    price: fmtPrice(ticker.lastPrice),
    change: changed.text,
    up: changed.up,
    high: fmtPrice(ticker.high24h || ticker.lastPrice),
    low: fmtPrice(ticker.low24h || ticker.lastPrice),
    volume: fmtVolume(volumeValue),
  };
}

function intervalForApi(tf: string) {
  if (tf === '1H') return '1h';
  if (tf === '4H') return '4h';
  if (tf === '1D') return '1d';
  if (tf === '1W') return '1w';
  return tf;
}

function parseKline(row: RawKline): KlineBar | null {
  const open = Number(row[1]);
  const high = Number(row[2]);
  const low = Number(row[3]);
  const close = Number(row[4]);

  if (![open, high, low, close].every(Number.isFinite)) return null;
  return { open, high, low, close };
}

function scaleBarHeight(bar: KlineBar, bars: KlineBar[]) {
  const min = Math.min(...bars.map((item) => item.low));
  const max = Math.max(...bars.map((item) => item.high));
  const range = Math.max(max - min, max * 0.001, 1);
  const ownRange = Math.max(bar.high - bar.low, range * 0.08);
  return Math.max(20, Math.min(150, (ownRange / range) * 150));
}

export default function H5MarketDetailPage() {
  const searchParams = useSearchParams();
  const [tf, setTf] = useState('1H');
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [kline, setKline] = useState<KlineBar[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  const symbol = normalizeSymbol(searchParams.get('symbol'));
  const apiSymbol = toApiSymbol(symbol);
  const pairMeta = PAIR_MAP[symbol] ?? TOP20_PAIRS.find((pair) => pair.symbol === symbol) ?? fallbackPair(symbol);
  const pair = useMemo(() => toDetailPair(pairMeta, ticker), [pairMeta, ticker]);

  useEffect(() => {
    let alive = true;

    async function loadDetail() {
      const [nextTicker, nextKlines, nextOrderBook] = await Promise.all([
        marketApi.getTicker(apiSymbol).catch(() => null),
        marketApi.getKlines(apiSymbol, intervalForApi(tf), 60).catch(() => []),
        marketApi.getOrderBook(apiSymbol, 20).catch(() => null),
      ]);

      if (!alive) return;
      setTicker(nextTicker);
      setKline((nextKlines as RawKline[]).map(parseKline).filter((bar): bar is KlineBar => Boolean(bar)));
      setOrderBook(nextOrderBook);
    }

    loadDetail();

    return () => {
      alive = false;
    };
  }, [apiSymbol, tf]);

  const depthRows = useMemo(() => {
    const asks = (orderBook?.asks ?? []).slice(0, 3).map(([price, amount]) => ({ p: fmtPrice(price), a: String(amount), side: 'sell' }));
    const bids = (orderBook?.bids ?? []).slice(0, 2).map(([price, amount]) => ({ p: fmtPrice(price), a: String(amount), side: 'buy' }));
    return [...asks, ...bids];
  }, [orderBook]);

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>{pair.symbol}</span>
          <ChevronDown size={14} color="#7B89B8" />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(148, 163, 184, 0.10)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              color: '#B4C0E0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Star size={14} />
          </button>
          <button
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(148, 163, 184, 0.10)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              color: '#B4C0E0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bell size={14} />
          </button>
          <button
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(148, 163, 184, 0.10)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              color: '#B4C0E0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* 价格信息卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18, padding: 16, marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: pair.up
              ? 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(244, 114, 182, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 30, fontWeight: 800, color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pair.price}
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>USDT</span>
            <span
              style={{
                fontSize: 12, color: pair.up ? '#34D399' : '#F472B6', fontWeight: 600, marginLeft: 4,
              }}
            >
              {pair.up ? <TrendingUp size={12} style={{ verticalAlign: 'middle' }} /> : <TrendingDown size={12} style={{ verticalAlign: 'middle' }} />}
              {' '}{pair.change}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            <Cell label="24h 最高" value={pair.high} color="#34D399" />
            <Cell label="24h 最低" value={pair.low} color="#F472B6" />
            <Cell label="24h 成交" value={pair.volume} />
            <Cell label="流通市值" value="--" />
          </div>
        </div>
      </div>

      {/* 时间周期 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['1m', '5m', '15m', '1H', '4H', '1D', '1W'].map((t) => {
          const active = (t === '1H' && tf === '1H') || t === tf;
          return (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* K线图占位 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12,
          height: 220,
        }}
      >
        <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 6 }}>K线 {tf}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
          {kline.slice(-20).map((k, i) => {
            const isUp = k.close >= k.open;
            const h = scaleBarHeight(k, kline);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: '70%',
                    height: h,
                    background: isUp
                      ? 'linear-gradient(180deg, #34D399 0%, #10B981 100%)'
                      : 'linear-gradient(180deg, #F472B6 0%, #EF4444 100%)',
                    borderRadius: 1,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7B89B8', marginTop: 4 }}>
          <span>06-01</span><span>06-15</span><span>06-30</span>
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12,
        }}
      >
        <Link
          href={`/h5/trade?symbol=${encodeURIComponent(pair.symbol)}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}
        >
          买入
        </Link>
        <Link
          href={`/h5/trade?symbol=${encodeURIComponent(pair.symbol)}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}
        >
          卖出
        </Link>
        <Link
          href="/h5/trade/futures"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}
        >
          永续
        </Link>
      </div>

      {/* 委托/成交 Tab */}
      <div
        style={{
          display: 'flex', gap: 4, marginBottom: 12,
          background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, padding: 4,
        }}
      >
        {['委托', '成交', '介绍'].map((t, i) => {
          const active = i === 0;
          return (
            <button
              key={t}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* API 盘口数据 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        {depthRows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              padding: '6px 14px', fontSize: 12,
              background: row.side === 'sell' ? 'rgba(244, 114, 182, 0.05)' : 'rgba(52, 211, 153, 0.05)',
            }}
          >
            <div
              style={{
                color: row.side === 'sell' ? '#F472B6' : '#34D399',
                fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              }}
            >
              {row.p}
            </div>
            <div
              style={{
                textAlign: 'right', color: '#F8FAFC',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {row.a}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div
        style={{
          fontSize: 12, color: color || '#fff', fontWeight: 600, marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
