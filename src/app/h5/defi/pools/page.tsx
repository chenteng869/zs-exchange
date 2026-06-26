'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Star, ChevronRight, Droplets, Filter } from 'lucide-react';
import { getDefiPools, DefiPool } from '@/lib/h5-mock';

export default function H5DefiPoolsPage() {
  const all = getDefiPools();
  const [tab, setTab] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [keyword, setKeyword] = useState('');

  const filtered = all.filter((p) => {
    if (tab !== 'all' && p.risk !== tab) return false;
    if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase()) && !p.tokens.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>流动性池</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 'auto' }}>
          共 {all.length} 个池
        </span>
      </div>

      {/* 搜索 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14,
          marginBottom: 12,
        }}
      >
        <Search size={16} color="#7B89B8" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索池名称 / 代币"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
        <Filter size={16} color="#7B89B8" />
      </div>

      {/* 风险 Tab */}
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
          { key: 'all',  label: '全部' },
          { key: 'low',  label: '低风险' },
          { key: 'mid',  label: '中风险' },
          { key: 'high', label: '高风险' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'all' | 'low' | 'mid' | 'high')}
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
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>
            暂无匹配的池
          </div>
        ) : (
          filtered.map((p, i) => <PoolItem key={p.id} pool={p} last={i === filtered.length - 1} />)
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

const COLORS: Record<DefiPool['risk'], string> = {
  low: '#34D399',
  mid: '#F0B90B',
  high: '#F472B6',
};

const RISK_TEXT: Record<DefiPool['risk'], string> = {
  low: '低风险',
  mid: '中风险',
  high: '高风险',
};

function PoolItem({ pool, last }: { pool: DefiPool; last: boolean }) {
  const color = COLORS[pool.risk];
  return (
    <Link
      href={`/h5/defi/pool/${pool.id}`}
      style={{
        display: 'block',
        padding: 14,
        textDecoration: 'none',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${color}26`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Droplets size={20} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{pool.name}</span>
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
              {RISK_TEXT[pool.risk]}
            </span>
            <Star size={11} color="#7B89B8" />
          </div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
            {pool.tokens} · TVL {pool.tvl}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#34D399',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pool.apy}
          </div>
          <div style={{ fontSize: 9, color: '#7B89B8' }}>24h 量 {pool.volume24h}</div>
        </div>
        <ChevronRight size={14} color="#7B89B8" />
      </div>
    </Link>
  );
}
