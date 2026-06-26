'use client';

import { useState } from 'react';
import {
  TrendingDown,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Wallet,
} from 'lucide-react';

export default function H5StakeUnstakePage() {
  const [percent, setPercent] = useState(50);
  const staked = 2.5000;
  const unstakeAmt = (staked * percent / 100).toFixed(4);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>解除质押</span>
      </div>

      {/* 当前质押 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Lock size={12} color="#FCD535" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>当前质押 (锁仓中)</span>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#F8FAFC',
            fontVariantNumeric: 'tabular-nums',
            marginTop: 2,
          }}
        >
          2.5000 <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>ETH</span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <Mini label="价值"   value="$8,782" />
          <Mini label="累计收益" value="+0.024 ETH" color="#34D399" />
          <Mini label="解锁日期" value="07-15" color="#FCD535" />
        </div>
      </div>

      {/* 比例 */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>解除比例</span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#FCD535',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {percent}%
          </span>
        </div>
        <div style={{ position: 'relative', height: 6, marginBottom: 12 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(148, 163, 184, 0.20)',
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)',
              borderRadius: 3,
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => setPercent(parseInt(e.target.value))}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => setPercent(p)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                background: percent === p ? 'rgba(240, 185, 11, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: '1px solid',
                borderColor: percent === p ? '#F0B90B' : 'rgba(148, 163, 184, 0.20)',
                color: percent === p ? '#FCD535' : '#7B89B8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* 详情 */}
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
          <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>解除详情</span>
        </div>
        <InfoRow label="解除数量"   value={`${unstakeAmt} ETH`} />
        <InfoRow label="未结收益"   value="0.024 ETH" color="#34D399" />
        <InfoRow label="预计到账"   value={`~ 3 天后`} />
        <InfoRow label="解锁罚息"   value="0%" color="#34D399" last />
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(244, 114, 182, 0.08)',
          border: '1px solid rgba(244, 114, 182, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <AlertCircle size={14} color="#F472B6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          解除质押后资金将进入待解锁状态，3 天后自动到账到现货账户。锁仓期内无法交易/转账。
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
        <CheckCircle2 size={16} strokeWidth={2.5} /> 确认解除
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div
        style={{
          fontSize: 13,
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
