'use client';

import { useState } from 'react';
import {
  Minus,
  TrendingUp,
  Info,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

export default function H5DefiRemovePage() {
  const [percent, setPercent] = useState(50);
  const lpAmount = (0.4521 * percent / 100).toFixed(4);
  const ethAmt = (0.2500 * percent / 100).toFixed(4);
  const usdtAmt = (878.20 * percent / 100).toFixed(2);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>移除流动性</span>
      </div>

      {/* 当前持仓 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>当前 LP 持仓</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#F8FAFC',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          0.4521 UNI-V2
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <Mini label="池子份额" value="0.0012%" />
          <Mini label="价值"     value="$1,254.32" />
          <Mini label="累计收益" value="+$134.56" color="#34D399" />
        </div>
      </div>

      {/* 移除比例 */}
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
          <span style={{ fontSize: 12, color: '#7B89B8' }}>移除比例</span>
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

      {/* 预计获得 */}
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
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>预计获得</span>
        </div>

        <TokenLine icon="Ξ" iconBg="linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)" symbol="ETH" amount={ethAmt} usd={`$${(parseFloat(ethAmt) * 3512.80).toFixed(2)}`} />
        <TokenLine icon="T" iconBg="linear-gradient(135deg, #34D399 0%, #10B981 100%)" symbol="USDT" amount={usdtAmt} usd={`$${usdtAmt}`} last />
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
        <InfoRow label="销毁 LP"  value={`${lpAmount} UNI-V2`} />
        <InfoRow label="Gas 费用" value="~$3.20" />
        <InfoRow label="到账时间" value="即时" last />
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(240, 185, 11, 0.10)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Info size={14} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          移除流动性将按当前池子比例返还两种代币；部分移除可保留 LP 继续赚取收益。
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
        <CheckCircle2 size={16} strokeWidth={2.5} /> 确认移除
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

function TokenLine({
  icon,
  iconBg,
  symbol,
  amount,
  usd,
  last,
}: {
  icon: string;
  iconBg: string;
  symbol: string;
  amount: string;
  usd: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: '#fff',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#7B89B8' }}>{symbol}</div>
        <div style={{ fontSize: 10, color: '#7B89B8' }}>≈ {usd}</div>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#F8FAFC',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {amount}
      </div>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
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
      <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
