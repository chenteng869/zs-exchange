'use client';

import { useState } from 'react';
import {
  Gift,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Download,
  Coins,
  ArrowDownToLine,
} from 'lucide-react';
import { getStakePools } from '@/lib/h5-mock';

interface RewardItem {
  id: string;
  pool: string;
  symbol: string;
  amount: string;
  value: string;
  time: string;
  apy: string;
}

export default function H5StakeRewardsPage() {
  const pools = getStakePools().filter((p) => p.status === 'active');
  const [tab, setTab] = useState<'all' | 'claimable' | 'claimed'>('all');

  const rewards: RewardItem[] = [
    { id: 'R-001', pool: 'ETH 2.0',     symbol: 'ETH',  amount: '0.02450',  value: '$86.05',   time: '2026-06-24', apy: '4.82%',   },
    { id: 'R-002', pool: 'SOL 质押',    symbol: 'SOL',  amount: '2.4520',   value: '$447.20',  time: '2026-06-24', apy: '6.85%',   },
    { id: 'R-003', pool: 'DOT Nominator',symbol:'DOT',  amount: '1.2500',   value: '$9.20',    time: '2026-06-23', apy: '14.20%',  },
    { id: 'R-004', pool: 'BNB Chain',   symbol: 'BNB',  amount: '0.0250',   value: '$15.20',   time: '2026-06-22', apy: '5.12%',   },
  ];

  const totalClaim = rewards.reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalValue = rewards.reduce((s, r) => s + parseFloat(r.value.replace('$', '')), 0);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>质押收益</span>
        <button
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(56, 189, 248, 0.10)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38BDF8',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Download size={12} /> 导出
        </button>
      </div>

      {/* 收益总览 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gift size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>待领取收益</span>
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
            ${totalValue.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
            ≈ {totalClaim.toFixed(4)} (混合币种)
          </div>
          <button
            style={{
              width: '100%',
              marginTop: 14,
              padding: '10px 0',
              background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
              color: '#0F1B3D',
              fontSize: 13,
              fontWeight: 800,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <ArrowDownToLine size={14} /> 一键全部领取
          </button>
        </div>
      </div>

      {/* 4 池卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {pools.slice(0, 4).map((p) => (
          <div
            key={p.id}
            style={{
              padding: 12,
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {p.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{p.symbol}</span>
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700, marginLeft: 'auto' }}>{p.apy}</span>
            </div>
            <div style={{ fontSize: 10, color: '#7B89B8' }}>待领 0.0245</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>
              $86.05
            </div>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        {[
          { key: 'all',       label: '全部' },
          { key: 'claimable', label: '待领取' },
          { key: 'claimed',   label: '已领取' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'all' | 'claimable' | 'claimed')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 8,
              border: 'none',
              background: tab === t.key ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
              color: tab === t.key ? '#38BDF8' : '#7B89B8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {rewards.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderBottom: i < rewards.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Coins size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{r.pool}</span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'rgba(34, 211, 238, 0.20)',
                    color: '#22D3EE',
                    fontWeight: 700,
                  }}
                >
                  APY {r.apy}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} /> {r.time}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', fontVariantNumeric: 'tabular-nums' }}>
                +{r.amount} {r.symbol}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8' }}>{r.value}</div>
            </div>
            <button
              style={{
                padding: '5px 10px',
                background: 'rgba(240, 185, 11, 0.20)',
                border: '1px solid rgba(240, 185, 11, 0.35)',
                color: '#FCD535',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CheckCircle2 size={10} /> 领取
            </button>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
