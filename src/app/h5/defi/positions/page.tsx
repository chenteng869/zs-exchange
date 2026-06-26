'use client';

import {
  Layers,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Plus,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { getDefiPositions } from '@/lib/h5-mock';

export default function H5DefiPositionsPage() {
  const positions = getDefiPositions();
  const totalValue = positions.reduce((s, p) => s + parseFloat(p.shareValue.replace(/[$,]/g, '')), 0);
  const totalPnl = positions.reduce((s, p) => s + parseFloat(p.pnl.replace(/[+$,]/g, '')), 0);
  const totalPnlPct = ((totalPnl / (totalValue - totalPnl)) * 100).toFixed(2);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>DeFi 持仓</span>
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
            background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>DeFi 持仓总价值</div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#FCD535',
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4,
            }}
          >
            ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Mini label="累计收益" value={`+$${totalPnl.toFixed(2)}`} color="#34D399" />
            <Mini label="总收益率" value={`+${totalPnlPct}%`} color="#34D399" />
            <Mini label="活跃仓位" value={`${positions.length}`} color="#38BDF8" />
          </div>
        </div>
      </div>

      {/* 4 池摘要 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {[
          { label: '总价值',  value: `$${(totalValue/1000).toFixed(1)}K`, color: '#FCD535' },
          { label: '盈利',    value: '3', color: '#34D399' },
          { label: '亏损',    value: '1', color: '#F472B6' },
          { label: '平均 APY',value: '12.3%', color: '#38BDF8' },
        ].map((it) => (
          <div
            key={it.label}
            style={{
              padding: 10,
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: it.color,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {it.value}
            </div>
            <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{it.label}</div>
          </div>
        ))}
      </div>

      {/* 列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 8px' }}>
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>持仓明细</span>
      </div>

      {positions.map((p) => {
        const isUp = !p.pnl.startsWith('-');
        return (
          <div
            key={p.id}
            style={{
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${p.iconColor} 0%, ${p.iconColor}cc 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.poolName}</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: isUp ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)',
                      color: isUp ? '#34D399' : '#F472B6',
                      fontWeight: 700,
                    }}
                  >
                    {p.pnlPct}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
                  {p.tokens} · 持仓 {p.days} 天
                </div>
              </div>
              {isUp ? (
                <TrendingUp size={16} color="#34D399" />
              ) : (
                <TrendingDown size={16} color="#F472B6" />
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                padding: 10,
                background: 'rgba(15, 27, 61, 0.40)',
                borderRadius: 10,
              }}
            >
              <Mini label="持仓价值" value={p.shareValue} />
              <Mini label="LP 数量"  value={p.myShare} />
              <Mini label="累计收益" value={p.pnl} color={isUp ? '#34D399' : '#F472B6'} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: 'rgba(52, 211, 153, 0.20)',
                  border: '1px solid rgba(52, 211, 153, 0.30)',
                  color: '#34D399',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <BarChart3 size={12} /> 领取奖励
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: 'rgba(56, 189, 248, 0.20)',
                  border: '1px solid rgba(56, 189, 248, 0.30)',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Plus size={12} /> 加仓
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ height: 20 }} />
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#7B89B8' }}>{label}</div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: color || '#F8FAFC',
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
