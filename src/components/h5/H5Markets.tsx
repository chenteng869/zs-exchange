'use client';

/**
 * H5 行情页 — 后端 API 轮询（国内可用）
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { useTickersData, fmtPrice } from '@/hooks/useMarketData';
import { TOP20_PAIRS } from '@/lib/h5/top20-pairs';

type Filter = 'all' | 'hot' | 'gainers' | 'losers';

export default function H5Markets() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const apiSymbols = useMemo(() => TOP20_PAIRS.map((p) => p.symbol.replace('/', '')), []);
  const { tickers, loading } = useTickersData(apiSymbols, 4000);

  const viewPairs = useMemo(() => TOP20_PAIRS.map((p) => {
    const apiSym = p.symbol.replace('/', '');
    const t = tickers.get(apiSym);
    if (!t) return { ...p, price: null, pct: null, volume: null, up: true };
    const pct = parseFloat(t.changePercent24h);
    const vol = parseFloat(t.volume24h) * parseFloat(t.lastPrice);
    const volStr = vol >= 1e8 ? `${(vol / 1e8).toFixed(2)}亿` : vol >= 1e4 ? `${(vol / 1e4).toFixed(0)}万` : vol.toFixed(0);
    return {
      ...p,
      price: fmtPrice(parseFloat(t.lastPrice)),
      pct,
      volume: volStr,
      up: pct >= 0,
    };
  }), [tickers]);

  let list = viewPairs;
  if (filter === 'hot')     list = list.filter((p) => p.hot);
  if (filter === 'gainers') list = list.filter((p) => p.pct !== null && p.up);
  if (filter === 'losers')  list = list.filter((p) => p.pct !== null && !p.up);
  if (search)               list = list.filter((p) => p.symbol.toLowerCase().includes(search.toLowerCase()));

  const btc = tickers.get('BTCUSDT');
  const totalVol = Array.from(tickers.values()).reduce(
    (s, t) => s + parseFloat(t.quoteVolume24h || '0'),
    0,
  );
  const fmtBig = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${v.toFixed(0)}`;

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部数据条 */}
      <div style={{
        background: 'linear-gradient(135deg,#1E40AF 0%,#1E3A8A 50%,#172554 100%)',
        borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,.30) 0%,transparent 70%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.70)' }}>BTC 价格</div>
              <span style={{ fontSize: 10, color: loading ? '#F0B90B' : '#34D399', display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: loading ? '#F0B90B' : '#34D399', display: 'inline-block' }} />
                {loading ? '加载中' : '实时'}
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {btc ? `$${parseFloat(btc.lastPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.70)' }}>Top20 24h 成交</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399', marginTop: 2 }}>
              {totalVol > 0 ? fmtBig(totalVol) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 12, marginBottom: 12 }}>
        <Search size={16} color="#7B89B8" />
        <input type="text" placeholder="🔍 搜索币种" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 13 }} />
      </div>

      {/* 筛选 Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['all','hot','gainers','losers'] as const).map((k) => {
          const labels = { all: '全部', hot: '热门', gainers: '涨幅', losers: '跌幅' };
          const active = k === filter;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '6px 14px', borderRadius: 16,
              background: active ? 'linear-gradient(135deg,#F0B90B 0%,#FCD535 100%)' : 'rgba(148,163,184,.10)',
              color: active ? '#0F1B3D' : '#B4C0E0', border: 'none', fontSize: 12,
              fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{labels[k]}</button>
          );
        })}
      </div>

      {/* 币种列表 */}
      <div style={{ background: 'linear-gradient(180deg,rgba(26,36,86,.55) 0%,rgba(21,34,74,.70) 100%)', border: '1px solid rgba(148,163,184,.12)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px', padding: '10px 14px', fontSize: 11, color: '#7B89B8', borderBottom: '1px solid rgba(148,163,184,.10)' }}>
          <div>交易对</div><div style={{ textAlign: 'right' }}>价格</div><div style={{ textAlign: 'right' }}>24h</div>
        </div>
        {list.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>暂无匹配交易对</div>
        )}
        {list.map((p, i) => {
          const pctStr = p.pct !== null ? `${p.pct >= 0 ? '+' : ''}${p.pct!.toFixed(2)}%` : '—';
          return (
            <Link key={p.symbol} href={`/h5/trade?symbol=${encodeURIComponent(p.symbol)}`} style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 80px', padding: '12px 14px', fontSize: 13,
              borderBottom: i < list.length - 1 ? '1px solid rgba(148,163,184,.06)' : 'none',
              alignItems: 'center', textDecoration: 'none',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{p.symbol}</span>
                  {p.hot && <Flame size={11} color="#F472B6" fill="#F472B6" />}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>成交 {p.volume ?? '—'}</div>
              </div>
              <div style={{ textAlign: 'right', color: '#F8FAFC', fontWeight: 500, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                {p.price ?? '—'}
              </div>
              <div style={{ textAlign: 'right', color: p.up ? '#34D399' : '#F472B6', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                {p.pct !== null && (p.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
                {pctStr}
              </div>
            </Link>
          );
        })}
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
