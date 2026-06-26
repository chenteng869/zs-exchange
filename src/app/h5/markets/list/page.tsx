'use client';

/**
 * H5 行情分类列表页
 */
import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Flame, Star } from 'lucide-react';
import { getQuotePairs } from '@/lib/h5-mock';

const CATEGORIES = [
  { key: 'all',     label: '全部' },
  { key: 'usdt',    label: 'USDT' },
  { key: 'btc',     label: 'BTC' },
  { key: 'eth',     label: 'ETH' },
  { key: 'stable',  label: '稳定币' },
  { key: 'meme',    label: 'Meme' },
  { key: 'defi',    label: 'DeFi' },
  { key: 'layer2',  label: 'Layer 2' },
];

export default function H5MarketsListPage() {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'default' | 'gainers' | 'losers' | 'volume'>('default');
  const pairs = getQuotePairs();

  let list = [...pairs];
  if (sort === 'gainers') list = list.filter((p) => p.up).sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
  if (sort === 'losers')  list = list.filter((p) => !p.up).sort((a, b) => parseFloat(a.change) - parseFloat(b.change));
  if (sort === 'volume')  list = list.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));

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
          { k: 'default',  l: '默认' },
          { k: 'gainers',  l: '涨幅榜' },
          { k: 'losers',   l: '跌幅榜' },
          { k: 'volume',   l: '成交榜' },
        ].map((s) => {
          const active = s.k === sort;
          return (
            <button
              key={s.k}
              onClick={() => setSort(s.k as any)}
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