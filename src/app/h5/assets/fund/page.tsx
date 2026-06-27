'use client';

/**
 * H5 理财资产页
 */
import { PiggyBank, TrendingUp, Wallet, ChevronRight } from 'lucide-react';

const FUND_PRODUCTS = [
  { id: 'F1', name: 'USDT 活期',  symbol: 'USDT', apy: '4.5%',  amount: '8,000.00',  days: '活期',     income: '12.34' },
  { id: 'F2', name: 'BTC 30天锁仓',symbol: 'BTC',  apy: '8.2%',  amount: '0.5000',     days: '30天',     income: '0.0005' },
  { id: 'F3', name: 'ETH 90天理财',symbol: 'ETH',  apy: '12.5%', amount: '5.0000',     days: '90天',     income: '0.0234' },
  { id: 'F4', name: 'SOL 7天短期',symbol: 'SOL',  apy: '15.8%', amount: '50.0000',    days: '7天',      income: '0.0123' },
];

export default function H5FundPage() {
  const totalIncome = FUND_PRODUCTS.reduce((s, p) => s + parseFloat(p.income), 0);
  const totalValue = FUND_PRODUCTS.reduce((s, p) => {
    const a = parseFloat(p.amount.replace(/,/g, ''));
    return s + (p.symbol === 'USDT' ? a : a * 100); // 简单估值
  }, 0);

  return (
    <div style={{ padding: '12px' }}>
      {/* 资产总览 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          borderRadius: 18, padding: 18, marginBottom: 12,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(240, 185, 11, 0.30)',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <PiggyBank size={14} color="rgba(15, 27, 61, 0.70)" />
            <span style={{ fontSize: 12, color: 'rgba(15, 27, 61, 0.70)' }}>理财总资产 (USDT)</span>
          </div>
          <div
            style={{
              fontSize: 32, fontWeight: 800, color: '#0F1B3D',
              fontVariantNumeric: 'tabular-nums', marginBottom: 6,
            }}
          >
            {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(15, 27, 61, 0.70)' }}>
            <TrendingUp size={12} />
            <span>累计收益: <span style={{ color: '#0F1B3D', fontWeight: 700 }}>+{totalIncome.toFixed(4)} USDT</span></span>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: '理财产品', href: '/h5/assets/earn', color: '#FCD535' },
            { label: '我的持仓', href: '/h5/assets/fund', color: '#34D399' },
            { label: '资金划转', href: '/h5/wallet/transfer', color: '#38BDF8' },
          ].map((item) => (
            <button
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderRadius: 10,
                background: `${item.color}26`, border: `1px solid ${item.color}40`,
                color: item.color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Wallet size={12} /> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 持仓列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #FCD535 0%, #F0B90B 100%)',
            boxShadow: '0 0 6px rgba(252, 213, 53, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>我的理财</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 4 }}>{FUND_PRODUCTS.length} 项</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 12,
        }}
      >
        {FUND_PRODUCTS.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', padding: 14, gap: 12,
              borderBottom: i < FUND_PRODUCTS.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#0F1B3D',
              }}
            >
              {p.symbol.slice(0, 3)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: 'rgba(252, 213, 53, 0.15)', color: '#FCD535', fontWeight: 600,
                  }}
                >
                  {p.apy} 年化
                </span>
                <span style={{ fontSize: 10, color: '#7B89B8' }}>{p.days}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {p.amount}
              </div>
              <div style={{ fontSize: 11, color: '#34D399', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                +{p.income}
              </div>
            </div>
            <ChevronRight size={14} color="#7B89B8" />
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}