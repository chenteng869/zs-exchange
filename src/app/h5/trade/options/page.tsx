'use client';

/**
 * H5 期权交易页
 */
import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, Calendar } from 'lucide-react';
import { getQuotePairs } from '@/lib/h5-mock';

const STRIKES = [
  { price: '65,000', type: 'call', premium: '2,150', change: '+12%' },
  { price: '67,000', type: 'call', premium: '1,580', change: '+8%' },
  { price: '68,000', type: 'call', premium: '980',   change: '+5%' },
  { price: '70,000', type: 'call', premium: '420',   change: '+2%' },
  { price: '65,000', type: 'put',  premium: '320',   change: '-3%' },
  { price: '67,000', type: 'put',  premium: '780',   change: '-6%' },
  { price: '68,000', type: 'put',  premium: '1,250', change: '-9%' },
  { price: '70,000', type: 'put',  premium: '2,180', change: '-15%' },
];

export default function H5OptionsPage() {
  const [pair] = useState(getQuotePairs()[0]);
  const [tab, setTab] = useState<'call' | 'put'>('call');
  const [expiry, setExpiry] = useState('7天');

  const list = STRIKES.filter((s) => s.type === tab);

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>{pair.symbol} 期权</span>
          <ChevronDown size={14} color="#7B89B8" />
        </div>
        <span
          style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(252, 213, 53, 0.20)', color: '#FCD535', fontWeight: 700,
          }}
        >
          欧式
        </span>
      </div>

      {/* 标的资产价 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18, padding: 18, marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>BTC 当前价</div>
          <div
            style={{
              fontSize: 28, fontWeight: 800, color: '#fff',
              fontVariantNumeric: 'tabular-nums', marginTop: 2,
            }}
          >
            {pair.price}
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12,
              color: pair.up ? '#34D399' : '#F472B6',
            }}
          >
            {pair.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {pair.change}
          </div>
        </div>
      </div>

      {/* 行使类型 + 到期日 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setTab('call')}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: tab === 'call' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: tab === 'call' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <TrendingUp size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 看涨
          </button>
          <button
            onClick={() => setTab('put')}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: tab === 'put' ? 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: tab === 'put' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <TrendingDown size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 看跌
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Calendar size={12} color="#7B89B8" />
          <span style={{ fontSize: 11, color: '#7B89B8' }}>到期日</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {['1天', '7天', '30天', '90天'].map((d) => (
            <button
              key={d}
              onClick={() => setExpiry(d)}
              style={{
                padding: '6px 0', borderRadius: 8,
                background: d === expiry ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.08)',
                border: d === expiry ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(148, 163, 184, 0.10)',
                color: d === expiry ? '#38BDF8' : '#B4C0E0',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 期权列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: tab === 'call'
              ? 'linear-gradient(180deg, #34D399 0%, #10B981 100%)'
              : 'linear-gradient(180deg, #F472B6 0%, #EF4444 100%)',
            boxShadow: '0 0 6px ' + (tab === 'call' ? 'rgba(52, 211, 153, 0.50)' : 'rgba(244, 114, 182, 0.50)'),
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
          {tab === 'call' ? '看涨期权' : '看跌期权'} (Call / Put)
        </span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '10px 14px', fontSize: 11, color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div>行权价</div>
          <div style={{ textAlign: 'right' }}>权利金 (USDT)</div>
          <div style={{ textAlign: 'right' }}>24h 涨跌</div>
        </div>
        {list.map((s, i) => (
          <div
            key={`${s.type}-${s.price}-${i}`}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '12px 14px', fontSize: 13,
              borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {s.price}
            </div>
            <div style={{ textAlign: 'right', color: '#FCD535', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {s.premium}
            </div>
            <div
              style={{
                textAlign: 'right', fontWeight: 600,
                color: s.change.startsWith('+') ? '#34D399' : '#F472B6',
              }}
            >
              {s.change}
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: tab === 'call'
            ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
            : 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}
      >
        立即购买 {tab === 'call' ? '看涨' : '看跌'} 期权
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}