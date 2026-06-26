'use client';

/**
 * H5 钱包地址管理
 */
import { useState } from 'react';
import { Copy, Plus, Trash2, MapPin, Star } from 'lucide-react';

interface AddressItem {
  id: string;
  symbol: string;
  network: string;
  address: string;
  tag?: string;
  remark: string;
  primary: boolean;
}

const MOCK_ADDRESSES: AddressItem[] = [
  { id: '1', symbol: 'BTC',  network: 'BTC',   address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', remark: '冷钱包', primary: true },
  { id: '2', symbol: 'ETH',  network: 'ERC20', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', remark: '主钱包', primary: true },
  { id: '3', symbol: 'USDT', network: 'TRC20', address: 'TKzx9m8Fh4nKLr5Jh7pCxVcRqP3VYhM4Nx', tag: '1002003', remark: '日常使用', primary: false },
  { id: '4', symbol: 'SOL',  network: 'SOL',   address: '7EYnhQoAG7X8eGfJq8L3XkV8mTqLp9kRhAQqB6h5BszV', remark: 'Solana 钱包', primary: true },
];

export default function H5AddressPage() {
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? MOCK_ADDRESSES : MOCK_ADDRESSES.filter((a) => a.symbol === filter);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>钱包地址</span>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8,
            background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
            border: 'none', color: '#0F1B3D', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={12} /> 新增
        </button>
      </div>

      {/* 币种筛选 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['all', 'BTC', 'ETH', 'USDT', 'SOL'].map((s) => {
          const active = s === filter;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 16,
                background: active ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none', fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {s === 'all' ? '全部' : s}
            </button>
          );
        })}
      </div>

      {/* 地址列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((a) => (
          <div
            key={a.id}
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: a.primary ? '1px solid rgba(252, 213, 53, 0.30)' : '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16,
              padding: 14,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#0F1B3D',
                  }}
                >
                  {a.symbol}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {a.symbol} · {a.network}
                    {a.primary && <Star size={11} color="#FCD535" fill="#FCD535" />}
                  </div>
                  <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{a.remark}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15, 27, 61, 0.50)',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MapPin size={12} color="#38BDF8" style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: '#B4C0E0',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {a.address}
                {a.tag && <span style={{ color: '#FCD535' }}> / {a.tag}</span>}
              </span>
              <button
                style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Copy size={12} color="#38BDF8" />
              </button>
              <button
                style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: 'rgba(244, 114, 182, 0.15)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={12} color="#F472B6" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}