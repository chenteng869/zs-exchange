'use client';

import {
  Sprout,
  Gift,
  Calendar,
  TrendingUp,
  Wallet,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getDefiPools } from '@/lib/h5-mock';

export default function H5DefiFarmPage() {
  const pools = getDefiPools().filter((p) => p.risk !== 'high');
  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>流动性挖矿</span>
      </div>

      {/* 头部 Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(167, 139, 250, 0.20) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(167, 139, 250, 0.30)',
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
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} color="#A78BFA" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC' }}>流动性挖矿奖励</span>
          </div>
          <div style={{ fontSize: 12, color: '#B4C0E0', lineHeight: 1.6, marginBottom: 10 }}>
            提供流动性即得 LP + ZS 双重奖励，年化最高 45%
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Mini label="全网 TVL"  value="$24.5M" />
            <Mini label="挖矿人数"  value="3,842" />
            <Mini label="累计发放"  value="$2.1M ZS" />
          </div>
        </div>
      </div>

      {/* 我的挖矿 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.30)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Wallet size={14} color="#34D399" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>我的挖矿</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <Mini label="挖矿中"     value="3 池" />
          <Mini label="待领奖励"   value="+125.6 ZS" color="#34D399" />
          <Mini label="挖矿收益"   value="+$3,452" color="#FCD535" />
        </div>
        <button
          style={{
            width: '100%',
            marginTop: 12,
            padding: '10px 0',
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
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
          <CheckCircle2 size={14} /> 一键领取全部奖励
        </button>
      </div>

      {/* 矿池列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 8px' }}>
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>矿池列表</span>
        <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 'auto' }}>按 APY 排序</span>
      </div>

      {pools.map((p, i) => (
        <FarmItem
          key={p.id}
          name={p.name}
          tokens={p.tokens}
          apy={p.apy}
          tvl={p.tvl}
          bonus="+8.5%"
          risk={p.risk}
          isHot={i < 2}
          last={i === pools.length - 1}
        />
      ))}

      <div style={{ height: 20 }} />
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
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

function FarmItem({
  name,
  tokens,
  apy,
  tvl,
  bonus,
  risk,
  isHot,
  last,
}: {
  name: string;
  tokens: string;
  apy: string;
  tvl: string;
  bonus: string;
  risk: 'low' | 'mid' | 'high';
  isHot: boolean;
  last: boolean;
}) {
  const color = risk === 'low' ? '#34D399' : '#F0B90B';
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 14,
        marginBottom: last ? 0 : 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isHot && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
            color: '#0F1B3D',
            fontWeight: 800,
          }}
        >
          HOT
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sprout size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{name}</span>
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 3,
                background: `${color}26`,
                color,
                fontWeight: 700,
              }}
            >
              {risk === 'low' ? '低风险' : '中风险'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
            {tokens} · TVL {tvl}
          </div>
        </div>
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
        <Mini label="基础 APY" value={apy} color="#34D399" />
        <Mini label="ZS 加成"  value={bonus} color="#FCD535" />
        <Mini label="总 APY"   value={`${(parseFloat(apy) + parseFloat(bonus.replace('+', ''))).toFixed(1)}%`} color="#FCD535" />
      </div>

      <button
        style={{
          width: '100%',
          marginTop: 10,
          padding: '8px 0',
          background: 'rgba(167, 139, 250, 0.20)',
          border: '1px solid rgba(167, 139, 250, 0.35)',
          color: '#A78BFA',
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        立即挖矿
      </button>
    </div>
  );
}
