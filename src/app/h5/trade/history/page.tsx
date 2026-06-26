'use client';

/**
 * H5 历史成交页
 */
import { useState } from 'react';
import { getOrders } from '@/lib/h5-mock';

type Filter = 'all' | 'buy' | 'sell';

export default function H5TradeHistoryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const orders = getOrders();

  let list = orders.filter((o) => o.status === 'filled' || o.status === 'partial');
  if (filter === 'buy')  list = list.filter((o) => o.type === 'buy');
  if (filter === 'sell') list = list.filter((o) => o.type === 'sell');

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>历史成交</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { k: 'all',  l: '全部' },
          { k: 'buy',  l: '买入' },
          { k: 'sell', l: '卖出' },
        ].map((t) => {
          const active = t.k === filter;
          return (
            <button
              key={t.k}
              onClick={() => setFilter(t.k as Filter)}
              style={{
                padding: '6px 14px', borderRadius: 16,
                background: active ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
              }}
            >
              {t.l}
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
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: '10px 14px', fontSize: 11, color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div>时间 / 交易对</div>
          <div style={{ textAlign: 'right' }}>价格 / 数量</div>
          <div style={{ textAlign: 'right' }}>总额</div>
        </div>

        {list.map((o, i) => {
          const total = (parseFloat(o.price.replace(/,/g, '')) * parseFloat(o.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 });
          return (
            <div
              key={o.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                padding: '12px 14px', fontSize: 12,
                borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>{o.time}</div>
                <div
                  style={{
                    color: o.type === 'buy' ? '#34D399' : '#F472B6',
                    fontWeight: 600, marginTop: 2,
                  }}
                >
                  {o.type === 'buy' ? '买' : '卖'} {o.pair}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>{o.price}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {o.amount}
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#FCD535', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {total}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}