'use client';

import { useState } from 'react';
import {
  Coins,
  TrendingUp,
  Lock,
  Wallet,
  Plus,
  ArrowDown,
  Info,
  CheckCircle2,
  Gift,
  Calendar,
} from 'lucide-react';

export default function H5DefiStakePage() {
  const [token, setToken] = useState('ETH');
  const [amount, setAmount] = useState('0.5000');
  const [days, setDays] = useState(30);

  const apyMap: Record<string, string> = { ETH: '4.82%', SOL: '6.85%', DOT: '14.20%', BNB: '5.12%' };
  const balanceMap: Record<string, string> = { ETH: '12.456 ETH', SOL: '128.5 SOL', DOT: '120 DOT', BNB: '15.234 BNB' };
  const apy = apyMap[token] || '5.00%';
  const reward = ((parseFloat(amount) * parseFloat(apy) / 100 * days) / 365).toFixed(6);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>单币质押</span>
      </div>

      {/* 收益卡 */}
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
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gift size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>当前年化 (APY)</span>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#FCD535',
              fontVariantNumeric: 'tabular-nums',
              marginTop: 4,
            }}
          >
            {apy}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
            每日结算 · T+1 到账
          </div>
        </div>
      </div>

      {/* 选币 */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>选择币种</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {['ETH', 'SOL', 'DOT', 'BNB'].map((t) => (
            <button
              key={t}
              onClick={() => setToken(t)}
              style={{
                padding: 10,
                borderRadius: 12,
                background: token === t ? 'rgba(240, 185, 11, 0.20)' : 'rgba(15, 27, 61, 0.40)',
                border: `1px solid ${token === t ? '#F0B90B' : 'rgba(148, 163, 184, 0.12)'}`,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#fff',
                  margin: '0 auto 4px',
                }}
              >
                {t.charAt(0)}
              </div>
              <div style={{ fontSize: 11, color: token === t ? '#FCD535' : '#F8FAFC', fontWeight: 600 }}>
                {t}
              </div>
              <div style={{ fontSize: 9, color: '#7B89B8' }}>{apyMap[t]}</div>
            </button>
          ))}
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
            <Wallet size={11} /> {balanceMap[token]}
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
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{token}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map((p) => (
            <button
              key={p}
              style={{
                flex: 1,
                padding: '4px 0',
                borderRadius: 6,
                background: 'rgba(240, 185, 11, 0.08)',
                border: '1px solid rgba(240, 185, 11, 0.20)',
                color: '#FCD535',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 锁仓 */}
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
          <span style={{ fontSize: 12, color: '#7B89B8' }}>锁仓周期</span>
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Calendar size={11} /> {days} 天
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

      {/* 收益预估 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <TrendingUp size={12} color="#34D399" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>预计收益</span>
        </div>
        <InfoRow label="年化 APY"    value={apy} color="#FCD535" />
        <InfoRow label="预计奖励"    value={`${reward} ${token}`} color="#34D399" />
        <InfoRow label="解锁日期"    value={new Date(Date.now() + days * 86400 * 1000).toISOString().slice(0, 10)} last />
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
