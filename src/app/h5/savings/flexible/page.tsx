'use client';

import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  CheckCircle2,
  Sparkles,
  Calendar,
  Percent,
} from 'lucide-react';
import { getSavingsProducts } from '@/lib/h5-mock';

export default function H5SavingsFlexiblePage() {
  const products = getSavingsProducts().filter((p) => p.type === 'flexible');
  const [selected, setSelected] = useState(products[0].id);
  const sp = products.find((p) => p.id === selected)!;
  const [amount, setAmount] = useState('1000.00');

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>活期理财</span>
        <span
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(52, 211, 153, 0.20)',
            color: '#34D399',
            fontWeight: 700,
            marginLeft: 'auto',
          }}
        >
          随存随取
        </span>
      </div>

      {/* 总览卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PiggyBank size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>活期总资产</span>
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#FCD535',
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4,
            }}
          >
            $12,456.78
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
            昨日收益 +$1.65 · 平均 APY 4.50%
          </div>
        </div>
      </div>

      {/* 产品选择 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 8px' }}>
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>活期产品</span>
      </div>

      {products.map((p) => {
        const active = p.id === selected;
        return (
          <div
            key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              padding: 14,
              background: active
                ? 'linear-gradient(180deg, rgba(52, 211, 153, 0.18) 0%, rgba(21, 34, 74, 0.70) 100%)'
                : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: `1px solid ${active ? 'rgba(52, 211, 153, 0.40)' : 'rgba(148, 163, 184, 0.12)'}`,
              borderRadius: 14,
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {p.symbol.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
                  {p.minAmount} 起存 · 总额 {p.sold}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>{p.apy}</div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>7日年化</div>
              </div>
            </div>
            {active && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {p.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34D399',
                      fontWeight: 600,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 申购 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>存入数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Wallet size={11} /> 余额 32,456.78 {sp.symbol}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{sp.symbol}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map((pct) => (
            <button
              key={pct}
              style={{
                flex: 1,
                padding: '4px 0',
                borderRadius: 6,
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.20)',
                color: '#34D399',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {pct}
            </button>
          ))}
        </div>
      </div>

      {/* 预计 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.30)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <InfoRow label="预计年收益" value={(parseFloat(amount) * 0.045).toFixed(2) + ' ' + sp.symbol} color="#34D399" />
        <InfoRow label="预计月收益" value={(parseFloat(amount) * 0.045 / 12).toFixed(2) + ' ' + sp.symbol} color="#FCD535" />
        <InfoRow label="预计日收益" value={(parseFloat(amount) * 0.045 / 365).toFixed(2) + ' ' + sp.symbol} last />
      </div>

      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
          color: '#0F1B3D',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(52, 211, 153, 0.30)',
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.5} /> 立即存入
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function InfoRow({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: 12,
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <span style={{ color: '#7B89B8' }}>{label}</span>
      <span style={{ color: color || '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
