'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface CommissionRecord {
  id: string;
  date: string;
  friend: string;
  pair: string;
  volume: string;
  rate: string;
  commission: string;
  type: 'spot' | 'futures';
}

export default function H5ProfileCommissionPage() {
  const [filter, setFilter] = useState<'all' | 'spot' | 'futures'>('all');

  const records: CommissionRecord[] = [
    { id: 'CR-001', date: '06-24 14:32', friend: 'u***88', pair: 'BTC/USDT', volume: '12,500.00', rate: '30%', commission: '8.45',   type: 'spot'    },
    { id: 'CR-002', date: '06-24 11:20', friend: 'k***21', pair: 'ETH/USDT', volume: '8,200.00',  rate: '30%', commission: '5.62',   type: 'futures' },
    { id: 'CR-003', date: '06-24 09:15', friend: 'z***09', pair: 'SOL/USDT', volume: '4,500.00',  rate: '30%', commission: '3.21',   type: 'spot'    },
    { id: 'CR-004', date: '06-23 22:05', friend: 'm***77', pair: 'BTC/USDT', volume: '32,400.00', rate: '30%', commission: '24.18',  type: 'futures' },
    { id: 'CR-005', date: '06-23 16:40', friend: 'l***64', pair: 'DOGE/USDT',volume: '1,200.00',  rate: '30%', commission: '0.85',   type: 'spot'    },
    { id: 'CR-006', date: '06-23 14:22', friend: 'a***12', pair: 'ETH/USDT', volume: '5,800.00',  rate: '30%', commission: '4.12',   type: 'futures' },
    { id: 'CR-007', date: '06-22 18:33', friend: 'y***45', pair: 'BNB/USDT', volume: '2,100.00',  rate: '30%', commission: '1.49',   type: 'spot'    },
  ];

  const filtered = filter === 'all' ? records : records.filter((r) => r.type === filter);

  const totalCommission = records.reduce((s, r) => s + parseFloat(r.commission), 0);
  const todayCommission = records
    .filter((r) => r.date.startsWith('06-24'))
    .reduce((s, r) => s + parseFloat(r.commission), 0);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>返佣记录</span>
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

      {/* 概览卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <DollarSign size={16} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>累计返佣 (USDT)</span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#FCD535',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalCommission.toFixed(2)}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Mini label="今日返佣" value={todayCommission.toFixed(2)} unit="USDT" color="#34D399" />
            <Mini label="本月返佣" value="186.42" unit="USDT" color="#38BDF8" />
            <Mini label="返佣率" value="30%" color="#F0B90B" />
          </div>
        </div>
      </div>

      {/* 趋势图(简化) */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} color="#34D399" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>近 7 日趋势</span>
          </div>
          <span style={{ fontSize: 10, color: '#34D399', fontWeight: 600 }}>+18.6%</span>
        </div>
        <Sparkline data={[45, 52, 38, 65, 72, 88, 95]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#7B89B8' }}>
          <span>06-18</span><span>06-20</span><span>06-22</span><span>06-24</span>
        </div>
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'all',     label: '全部' },
          { key: 'spot',    label: '现货' },
          { key: 'futures', label: '合约' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as 'all' | 'spot' | 'futures')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === t.key ? '#38BDF8' : 'rgba(148,163,184,0.20)',
              background: filter === t.key ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: filter === t.key ? '#38BDF8' : '#7B89B8',
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
        {filtered.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: r.type === 'futures' ? 'rgba(244, 114, 182, 0.20)' : 'rgba(56, 189, 248, 0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {r.type === 'futures' ? (
                <TrendingUp size={14} color="#F472B6" />
              ) : (
                <ArrowUpRight size={14} color="#38BDF8" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                  {r.pair}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: r.type === 'futures' ? 'rgba(244, 114, 182, 0.20)' : 'rgba(56, 189, 248, 0.20)',
                    color: r.type === 'futures' ? '#F472B6' : '#38BDF8',
                    fontWeight: 700,
                  }}
                >
                  {r.type === 'futures' ? '合约' : '现货'}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
                {r.date} · 来自 {r.friend} · 交易额 ¥{r.volume}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#34D399',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{r.commission}
              </div>
              <div style={{ fontSize: 9, color: '#7B89B8' }}>返佣率 {r.rate}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Mini({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div style={{ marginTop: 2 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 36;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.50" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#spark-grad)" />
      <polyline points={points} fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
