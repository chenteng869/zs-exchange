'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { getStakePools } from '@/lib/h5-mock';

function StakeForm() {
  const sp = useSearchParams();
  const id = sp.get('id') || 'SK-001';
  const p = getStakePools().find((x) => x.id === id) || getStakePools()[0];
  const [amount, setAmount] = useState('0.5000');
  const [days, setDays] = useState(p.lockDays || 30);

  const apy = parseFloat(p.apy);
  const reward = ((parseFloat(amount) * apy / 100 * days) / 365).toFixed(6);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>质押 {p.symbol}</span>
      </div>

      {/* 池信息 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          {p.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.name}</div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
            {p.network} · 最低 {p.minStake}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>{p.apy}</div>
          <div style={{ fontSize: 9, color: '#7B89B8' }}>APY</div>
        </div>
      </div>

      {/* 数量 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>质押数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Wallet size={11} /> 余额 12.456 {p.symbol}
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
              fontSize: 26,
              fontWeight: 700,
              fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>{p.symbol}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map((pct) => (
            <button
              key={pct}
              style={{
                flex: 1,
                padding: '4px 0',
                borderRadius: 6,
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.20)',
                color: '#38BDF8',
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

      {/* 锁仓期 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={12} color="#7B89B8" />
            <span style={{ fontSize: 12, color: '#7B89B8' }}>锁仓周期</span>
          </div>
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 600 }}>
            {days} 天
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90, 180, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                background: days === d ? 'rgba(240, 185, 11, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: '1px solid',
                borderColor: days === d ? '#F0B90B' : 'rgba(148, 163, 184, 0.20)',
                color: days === d ? '#FCD535' : '#7B89B8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {d}天
            </button>
          ))}
        </div>
      </div>

      {/* 预计收益 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <TrendingUp size={14} color="#34D399" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>预计收益</span>
        </div>
        <InfoRow label="年化 APY"    value={p.apy} color="#FCD535" />
        <InfoRow label="预计奖励"    value={`${reward} ${p.symbol}`} color="#34D399" />
        <InfoRow label="解锁日期"    value={new Date(Date.now() + days * 86400 * 1000).toISOString().slice(0, 10)} last />
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Info size={14} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          质押期间资产不可交易/转账，到期后自动解锁到现货账户；提前赎回需 3 天等待期。
        </div>
      </div>

      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
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
          boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.5} /> 确认质押
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

export default function H5StakeStakePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: '#7B89B8' }}>加载中...</div>}>
      <StakeForm />
    </Suspense>
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
