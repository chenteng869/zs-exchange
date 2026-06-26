'use client';

/**
 * H5 当前委托页
 */
import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { getOrders } from '@/lib/h5-mock';

type Filter = 'all' | 'open' | 'filled' | 'cancelled';

export default function H5OrdersPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const orders = getOrders();

  let list = orders;
  if (filter === 'open')      list = orders.filter((o) => o.status === 'pending' || o.status === 'partial');
  if (filter === 'filled')    list = orders.filter((o) => o.status === 'filled');
  if (filter === 'cancelled') list = orders.filter((o) => o.status === 'cancelled');

  const statusColor = (s: string) => {
    if (s === 'filled')   return '#34D399';
    if (s === 'partial')  return '#FCD535';
    if (s === 'pending')  return '#38BDF8';
    if (s === 'cancelled')return '#F472B6';
    return '#7B89B8';
  };

  const statusLabel = (s: string) => {
    if (s === 'filled')   return '已成交';
    if (s === 'partial')  return '部分成交';
    if (s === 'pending')  return '挂单中';
    if (s === 'cancelled')return '已撤单';
    return s;
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>当前委托</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { k: 'all',       l: '全部' },
          { k: 'open',      l: '挂单中' },
          { k: 'filled',    l: '已成交' },
          { k: 'cancelled', l: '已撤单' },
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
                border: 'none', fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
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
        {list.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#7B89B8', fontSize: 13 }}>
            暂无委托
          </div>
        ) : (
          list.map((o, i) => (
            <div
              key={o.id}
              style={{
                padding: 14,
                borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: o.type === 'buy' ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)',
                      color: o.type === 'buy' ? '#34D399' : '#F472B6',
                      fontWeight: 700,
                    }}
                  >
                    {o.type === 'buy' ? '买入' : '卖出'}
                  </span>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{o.pair}</span>
                </div>
                <span style={{ fontSize: 11, color: statusColor(o.status), fontWeight: 600 }}>
                  ● {statusLabel(o.status)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
                <Cell label="价格" value={o.price} />
                <Cell label="数量" value={o.amount} />
                <Cell label="已成交" value={o.filled} />
                <Cell label="类型" value={o.orderType === 'limit' ? '限价' : '市价'} />
              </div>

              {o.status === 'pending' || o.status === 'partial' ? (
                <button
                  style={{
                    width: '100%', padding: '6px 0', borderRadius: 8,
                    background: 'rgba(244, 114, 182, 0.15)',
                    border: '1px solid rgba(244, 114, 182, 0.30)',
                    color: '#F472B6', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  <X size={11} /> 撤单
                </button>
              ) : (
                <div style={{ fontSize: 10, color: '#7B89B8', textAlign: 'right' }}>{o.time}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}