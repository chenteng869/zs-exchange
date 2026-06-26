'use client';

import { useState } from 'react';
import {
  History,
  Plus,
  Minus,
  Repeat,
  Gift,
  TrendingUp,
  TrendingDown,
  Check,
  Clock,
  Download,
} from 'lucide-react';
import { getDefiRewards, DefiReward } from '@/lib/h5-mock';

const TYPE_MAP: Record<DefiReward['type'], { label: string; color: string; icon: React.ElementType }> = {
  add:      { label: '添加',     color: '#34D399', icon: Plus },
  remove:   { label: '移除',     color: '#F472B6', icon: Minus },
  harvest:  { label: '领取奖励', color: '#FCD535', icon: Gift },
  swap:     { label: '兑换',     color: '#A78BFA', icon: Repeat },
};

export default function H5DefiHistoryPage() {
  const all = getDefiRewards();
  const [tab, setTab] = useState<'all' | DefiReward['type']>('all');

  const filtered = tab === 'all' ? all : all.filter((r) => r.type === tab);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>DeFi 收益历史</span>
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
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.30)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: '#7B89B8' }}>累计 DeFi 收益 (近 30 天)</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#34D399',
            fontVariantNumeric: 'tabular-nums',
            marginTop: 4,
          }}
        >
          +$1,576.69
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <Mini label="添加流动性"  value="5 次"  color="#34D399" />
          <Mini label="领取奖励"   value="12 次" color="#FCD535" />
          <Mini label="兑换"       value="8 次"  color="#A78BFA" />
        </div>
      </div>

      {/* 筛选 */}
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
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'all',      label: '全部' },
          { key: 'add',      label: '添加' },
          { key: 'remove',   label: '移除' },
          { key: 'harvest',  label: '奖励' },
          { key: 'swap',     label: '兑换' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'all' | DefiReward['type'])}
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
              whiteSpace: 'nowrap',
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
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <History size={32} color="#7B89B8" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#7B89B8' }}>暂无记录</div>
          </div>
        ) : (
          filtered.map((r, i) => <HistoryItem key={r.id} reward={r} last={i === filtered.length - 1} />)
        )}
      </div>

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

function HistoryItem({ reward, last }: { reward: DefiReward; last: boolean }) {
  const t = TYPE_MAP[reward.type];
  const Icon = t.icon;
  const isPositive = !reward.amount.startsWith('-') && !reward.value.startsWith('-');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${t.color}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={t.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{t.label} · {reward.pool}</span>
          {reward.status === 'success' ? (
            <Check size={11} color="#34D399" />
          ) : reward.status === 'pending' ? (
            <Clock size={11} color="#F0B90B" />
          ) : null}
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
          {reward.date} · {reward.token}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isPositive ? '#34D399' : '#F472B6',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {reward.value}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#7B89B8',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {reward.amount} {reward.token}
        </div>
      </div>
    </div>
  );
}
