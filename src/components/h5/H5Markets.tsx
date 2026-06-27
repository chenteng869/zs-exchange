'use client';

/**
 * H5 行情页 v3 — 后端 API 轮询（国内可用，不依赖 Binance WS）
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { useTickersData } from '@/hooks/useMarketData';
import { TOP20_PAIRS } from '@/lib/h5/top20-pairs';
import { ConnectionStatus } from './ConnectionStatus';

type Filter = 'all' | 'hot' | 'gainers' | 'losers';

export default function H5Markets() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // 用后端 API 轮询 Top 20（替代 Binance WS）
  const apiSymbols = useMemo(() => TOP20_PAIRS.map((p) => p.symbol.replace('/', '')), []);
  const { tickers: rawTickers, loading } = useTickersData(apiSymbols, 4000);

  // 派生 status，兼容 ConnectionStatus 组件
  const status = loading ? 'connecting' : rawTickers.size > 0 ? 'online' : 'offline';

  // 将后端 ticker 转换成行情视图
  const viewPairs = useMemo(() => TOP20_PAIRS.map((p) => {
    const t = rawTickers.get(p.symbol.replace('/', ''));
    if (!t) return { ...p, view: null };
    const pct = parseFloat(t.changePercent24h);
    const price = parseFloat(t.lastPrice);
    const vol = parseFloat(t.quoteVolume24h || '0');
    const fmtVol = vol >= 1e9 ? `$${(vol / 1e9).toFixed(2)}B` : vol >= 1e6 ? `$${(vol / 1e6).toFixed(2)}M` : `$${vol.toFixed(0)}`;
    const up = pct >= 0;
    return {
      ...p,
      view: {
        price: price.toLocaleString('en-US', { minimumFractionDigits: price < 1 ? 4 : 2, maximumFractionDigits: price < 1 ? 6 : 2 }),
        change: `${up ? '+' : ''}${pct.toFixed(2)}%`,
        up,
        volume: fmtVol,
      },
    };
  }), [rawTickers]);

  let list = viewPairs;
  if (filter === 'hot')     list = list.filter((p) => p.hot);
  if (filter === 'gainers') list = list.filter((p) => p.view?.up === true);
  if (filter === 'losers')  list = list.filter((p) => p.view?.up === false);
  if (search)               list = list.filter((p) => p.symbol.toLowerCase().includes(search.toLowerCase()));

  // 全局数据条：BTC 价 + 24h 总成交额
  const btcTicker = rawTickers.get('BTCUSDT');
  const totalQuoteVol = Array.from(rawTickers.values()).reduce(
    (sum, t) => sum + parseFloat(t.quoteVolume24h || '0'),
    0,
  );
  const fmtBig = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${v.toFixed(0)}`);

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部数据条 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>BTC 价格</div>
              <ConnectionStatus status={status} size="sm" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {btcTicker ? `$${parseFloat(btcTicker.lastPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>Top20 24h 成交</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399', marginTop: 2 }}>
              {totalQuoteVol > 0 ? fmtBig(totalQuoteVol) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 断线提示 banner（决策 A） */}
      {status === 'offline' && (
        <div style={{ marginBottom: 12 }}>
          <ConnectionStatus status={status} size="lg" />
        </div>
      )}

      {/* 搜索框 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Search size={16} color="#7B89B8" />
        <input
          type="text"
          placeholder="🔍 搜索币种"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: 13,
          }}
        />
      </div>

      {/* 筛选 Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { key: 'all',     label: '全部' },
          { key: 'hot',     label: '热门' },
          { key: 'gainers', label: '涨幅' },
          { key: 'losers',  label: '跌幅' },
        ].map((t) => {
          const active = t.key === filter;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as Filter)}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                background: active
                  ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)'
                  : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 币种列表 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* 列表头 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px 80px',
            padding: '10px 14px',
            fontSize: 11,
            color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div>交易对</div>
          <div style={{ textAlign: 'right' }}>价格</div>
          <div style={{ textAlign: 'right' }}>24h</div>
        </div>

        {list.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>
            暂无匹配交易对
          </div>
        )}

        {list.map((p, i) => {
          const v = p.view;
          const price = v?.price ?? '—';
          const change = v?.change ?? '—';
          const up = v?.up ?? true;
          const vol = v?.volume ?? '—';
          const disabled = status !== 'online';

          return (
            <Link
              key={p.symbol}
              href={disabled ? '#' : `/h5/trade?symbol=${encodeURIComponent(p.symbol)}`}
              onClick={(e) => disabled && e.preventDefault()}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 80px',
                padding: '12px 14px',
                fontSize: 13,
                borderBottom: i < list.length - 1
                  ? '1px solid rgba(148, 163, 184, 0.06)'
                  : 'none',
                alignItems: 'center',
                textDecoration: 'none',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{p.symbol}</span>
                  {p.hot && <Flame size={11} color="#F472B6" fill="#F472B6" />}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>成交 {vol}</div>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#F8FAFC',
                  fontWeight: 500,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {price}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: up ? '#34D399' : '#F472B6',
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 2,
                }}
              >
                {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {change}
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
