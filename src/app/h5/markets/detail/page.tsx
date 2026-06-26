'use client';

/**
 * H5 行情详情页（带 K线 + 深度 + 成交）
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Star, Share2, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { getQuotePairs, getKline } from '@/lib/h5-mock';

export default function H5MarketDetailPage() {
  const [tf, setTf] = useState('1H');
  const pair = getQuotePairs()[0];
  const kline = getKline('BTC/USDT');

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
            <Cell label="流通市值" value="¥1.32T" />
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
                background: tf === t ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: tf === t ? '#38BDF8' : '#7B89B8',
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
            const h = ((k.high - k.low) / 1000) * 2 + 20;
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

      {/* 模拟盘口数据 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        {[
          { p: '67,860',  a: '0.85', side: 'sell' },
          { p: '67,855',  a: '1.20', side: 'sell' },
          { p: '67,850',  a: '2.30', side: 'sell' },
          { p: '67,845',  a: '0.50', side: 'buy' },
          { p: '67,842',  a: '1.50', side: 'buy' },
        ].map((row, i) => (
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