'use client';

/**
 * H5 P2P 交易页
 */
import { useState } from 'react';
import { Users, ShieldCheck, Clock, Check } from 'lucide-react';

const P2P_ADS = [
  { id: '1', trader: 'OTC_Trader_01',  rating: '99.5%', orders: 1234, side: 'sell', price: '7.18',  available: '50,000',  pay: ['银行卡', '支付宝'],  time: '5分钟' },
  { id: '2', trader: 'Samoa_OTC_Pro',  rating: '99.8%', orders: 856,  side: 'sell', price: '7.19',  available: '30,000',  pay: ['银行卡', '微信'],     time: '10分钟' },
  { id: '3', trader: 'Crypto_Express',  rating: '98.2%', orders: 542,  side: 'buy',  price: '7.15',  available: '20,000',  pay: ['支付宝', '微信'],   time: '5分钟' },
  { id: '4', trader: 'ZS_P2P_Trader',  rating: '99.9%', orders: 2341, side: 'sell', price: '7.20',  available: '100,000', pay: ['银行卡', '支付宝', '微信'], time: '3分钟' },
];

export default function H5P2PPage() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const list = P2P_ADS.filter((a) => a.side === side);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>P2P 法币交易</span>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
          商家担保,资金安全,多支付方式
        </div>
      </div>

      {/* 买/卖 Tab */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setSide('buy')}
          style={{
            padding: '12px 0', borderRadius: 12, border: 'none',
            background: side === 'buy' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'rgba(148, 163, 184, 0.10)',
            color: side === 'buy' ? '#fff' : '#7B89B8',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          买入 USDT
        </button>
        <button
          onClick={() => setSide('sell')}
          style={{
            padding: '12px 0', borderRadius: 12, border: 'none',
            background: side === 'sell' ? 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)' : 'rgba(148, 163, 184, 0.10)',
            color: side === 'sell' ? '#fff' : '#7B89B8',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          卖出 USDT
        </button>
      </div>

      {/* 安全提示 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(52, 211, 153, 0.10) 0%, rgba(21, 34, 74, 0.50) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          borderRadius: 12, padding: 10, marginBottom: 12,
          display: 'flex', gap: 8, alignItems: 'center',
        }}
      >
        <ShieldCheck size={16} color="#34D399" />
        <span style={{ fontSize: 12, color: '#B4C0E0' }}>平台担保交易,卖家无法放币时平台介入</span>
      </div>

      {/* 广告列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((ad) => (
          <div
            key={ad.id}
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16, padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                  }}
                >
                  {ad.trader.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{ad.trader}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#34D399' }}>● {ad.rating}</span>
                    <span style={{ fontSize: 10, color: '#7B89B8' }}>{ad.orders} 单</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '3px 8px', borderRadius: 8,
                  background: ad.side === 'buy' ? 'rgba(34, 211, 238, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                  color: ad.side === 'buy' ? '#22D3EE' : '#F472B6',
                  fontSize: 10, fontWeight: 700,
                }}
              >
                {ad.side === 'buy' ? '收购' : '出售'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: side === 'buy' ? '#F472B6' : '#34D399', fontVariantNumeric: 'tabular-nums' }}>
                  ¥{ad.price}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>单价 (CNY)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  ¥{ad.available}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>可交易</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {ad.pay.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 600,
                  }}
                >
                  {p}
                </span>
              ))}
              <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 4 }}>
                <Clock size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                {ad.time} 内付款
              </span>
            </div>

            <button
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                background: side === 'buy'
                  ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
                  : 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <Check size={12} /> {side === 'buy' ? '买入 USDT' : '卖出 USDT'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
