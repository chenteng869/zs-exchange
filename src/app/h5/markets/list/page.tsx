'use client';

/**
 * H5 行情分类列表页
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Flame, Star } from 'lucide-react';
import { marketApi, fmtChange, fmtPrice, fmtVolume, type MarketTicker } from '@/lib/api/market';
import { TOP20_PAIRS, type H5Pair } from '@/lib/h5/top20-pairs';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'usdt', label: 'USDT' },
  { key: 'btc', label: 'BTC' },
  { key: 'eth', label: 'ETH' },
  { key: 'stable', label: '稳定币' },
  { key: 'meme', label: 'Meme' },
  { key: 'defi', label: 'DeFi' },
  { key: 'layer2', label: 'Layer 2' },
];

type SortKey = 'default' | 'gainers' | 'losers' | 'volume';

interface MarketRow extends H5Pair {
  price: string;
  change: string;
  up: boolean;
  volume: string;
  high: string;
  low: string;
  volumeValue: number;
  changeValue: number;
  unavailable: boolean;
}

function toApiSymbol(symbol: string) {
  return symbol.replace('/', '');
}

function emptyRow(pair: H5Pair): MarketRow {
  return {
    ...pair,
    price: '--',
    change: '--',
    up: true,
    volume: '--',
    high: '--',
    low: '--',
    volumeValue: 0,
    changeValue: 0,
    unavailable: true,
  };
}

function tickerToRow(pair: H5Pair, ticker: MarketTicker): MarketRow {
  const lastPrice = Number(ticker.lastPrice);
  const changeSource = ticker.changePercent24h ?? ticker.change24h ?? '0';
  const changeValue = Number.parseFloat(String(changeSource));
  const quoteVolume = Number.parseFloat(String(ticker.quoteVolume24h || 0));
  const baseVolume = Number.parseFloat(String(ticker.volume24h || 0));
  const volumeValue = quoteVolume || baseVolume * (Number.isFinite(lastPrice) ? lastPrice : 0);
  const changed = fmtChange(Number.isFinite(changeValue) ? changeValue : 0);

  if (ticker.error || !Number.isFinite(lastPrice) || lastPrice <= 0) {
    return emptyRow(pair);
  }

  return {
    ...pair,
    price: fmtPrice(ticker.lastPrice),
    change: changed.text,
    up: changed.up,
    volume: fmtVolume(volumeValue),
    high: fmtPrice(ticker.high24h || ticker.lastPrice),
    low: fmtPrice(ticker.low24h || ticker.lastPrice),
    volumeValue,
    changeValue,
    unavailable: false,
  };
}

function inCategory(pair: MarketRow, cat: string) {
  if (cat === 'all') return true;
  if (cat === 'usdt') return pair.quote === 'USDT';
  if (cat === 'btc') return pair.base === 'BTC' || pair.quote === 'BTC';
  if (cat === 'eth') return pair.base === 'ETH' || pair.quote === 'ETH';
  if (cat === 'stable') return ['USDC', 'FDUSD', 'DAI', 'TUSD'].includes(pair.base);
  if (cat === 'meme') return ['DOGE', 'PEPE', 'SHIB'].includes(pair.base);
  if (cat === 'defi') return ['UNI', 'LINK', 'AAVE'].includes(pair.base);
  if (cat === 'layer2') return ['ARB', 'OP', 'MATIC'].includes(pair.base);
  return true;
}

export default function H5MarketsListPage() {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<SortKey>('default');
  const [rows, setRows] = useState<MarketRow[]>(() => TOP20_PAIRS.map(emptyRow));

  useEffect(() => {
    let alive = true;

    async function loadMarketRows() {
      const nextRows = await Promise.all(
        TOP20_PAIRS.map(async (pair) => {
          try {
            const ticker = await marketApi.getTicker(toApiSymbol(pair.symbol));
            return tickerToRow(pair, ticker);
          } catch {
            return emptyRow(pair);
          }
        }),
      );

      if (alive) setRows(nextRows);
    }

    loadMarketRows();

    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    let next = rows.filter((p) => inCategory(p, cat));

    if (sort === 'gainers') next = next.filter((p) => p.up && !p.unavailable).sort((a, b) => b.changeValue - a.changeValue);
    if (sort === 'losers') next = next.filter((p) => !p.up && !p.unavailable).sort((a, b) => a.changeValue - b.changeValue);
    if (sort === 'volume') next = [...next].sort((a, b) => b.volumeValue - a.volumeValue);

    return next;
  }, [cat, rows, sort]);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>行情列表</span>
      </div>

      {/* 分类标签 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map((c) => {
          const active = c.key === cat;
          return (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              style={{
                padding: '6px 14px', borderRadius: 16, whiteSpace: 'nowrap', flexShrink: 0,
                background: active ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* 排序 */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12,
          background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, padding: 4,
        }}
      >
        {[
          { k: 'default', l: '默认' },
          { k: 'gainers', l: '涨幅榜' },
          { k: 'losers', l: '跌幅榜' },
          { k: 'volume', l: '成交榜' },
        ].map((s) => {
          const active = s.k === sort;
          return (
            <button
              key={s.k}
              onClick={() => setSort(s.k as SortKey)}
              style={{
                padding: '6px 0', borderRadius: 8,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {s.l}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px',
            padding: '10px 14px', fontSize: 11, color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div>交易对</div>
          <div style={{ textAlign: 'right' }}>价格</div>
          <div style={{ textAlign: 'right' }}>24h</div>
        </div>
        {list.map((p, i) => (
          <Link
            key={p.symbol}
            href={`/h5/markets/detail?symbol=${encodeURIComponent(p.symbol)}`}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 80px',
              padding: '12px 14px', fontSize: 13,
              borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              alignItems: 'center', textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} color="#7B89B8" />
                <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{p.symbol}</span>
                {p.hot && <Flame size={10} color="#F472B6" fill="#F472B6" />}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>成交 {p.volume}</div>
            </div>
            <div
              style={{
                textAlign: 'right', color: '#F8FAFC', fontWeight: 500,
                fontSize: 12, fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.price}
            </div>
            <div
              style={{
                textAlign: 'right', fontWeight: 600, fontSize: 12,
                color: p.up ? '#34D399' : '#F472B6',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
              }}
            >
              {p.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {p.change}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
