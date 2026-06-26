'use client';

import { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  Search,
  Lock,
  Wallet,
  Check,
  Sparkles,
  ChevronRight,
  Filter,
  Calendar,
  Percent,
} from 'lucide-react';
import { getSavingsProducts } from '@/lib/h5-mock';

export default function H5SavingsProductsPage() {
  const all = getSavingsProducts();
  const [tab, setTab] = useState<'all' | 'flexible' | 'fixed'>('all');
  const [keyword, setKeyword] = useState('');

  const filtered = all.filter((p) => {
    if (tab !== 'all' && p.type !== tab) return false;
    if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase()) && !p.symbol.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>理财产品超市</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 'auto' }}>
          {all.length} 款产品
        </span>
      </div>

      {/* 头部 Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.30)',
          borderRadius: 18,
          padding: 16,
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
            <Sparkles size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>新手专享</span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#F8FAFC',
              lineHeight: 1.4,
              marginTop: 4,
            }}
          >
            首存 1,000 USDT 享
            <span style={{ color: '#FCD535' }}> +8% </span>
            加息券
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>
            活动至 06-30 23:59 · 老用户可邀请好友参与
          </div>
        </div>
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
          placeholder="搜索产品 / 币种"
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

      {/* 类型 Tab */}
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
          { key: 'all',      label: '全部' },
          { key: 'flexible', label: '活期' },
          { key: 'fixed',    label: '定期' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'all' | 'flexible' | 'fixed')}
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
      {filtered.length === 0 ? (
        <div
          style={{
            padding: 40,
            background:
              'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 16,
            textAlign: 'center',
            color: '#7B89B8',
            fontSize: 12,
          }}
        >
          暂无匹配产品
        </div>
      ) : (
        filtered.map((p) => <ProductCard key={p.id} product={p} />)
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

function ProductCard({ product: p }: { product: ReturnType<typeof getSavingsProducts>[0] }) {
  const color = p.type === 'flexible' ? '#34D399' : '#F0B90B';
  return (
    <div
      style={{
        padding: 14,
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        marginBottom: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {p.status === 'soldout' && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(244, 114, 182, 0.20)',
            color: '#F472B6',
            fontWeight: 700,
          }}
        >
          已售罄
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#0F1B3D',
          }}
        >
          {p.symbol.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.name}</span>
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 3,
                background: p.type === 'flexible' ? 'rgba(52, 211, 153, 0.20)' : 'rgba(240, 185, 11, 0.20)',
                color: p.type === 'flexible' ? '#34D399' : '#FCD535',
                fontWeight: 700,
              }}
            >
              {p.type === 'flexible' ? '活期' : `${p.duration}天定期`}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
            {p.minAmount} 起存 · {p.totalQuota}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>
            {p.apy}
          </div>
          <div style={{ fontSize: 9, color: '#7B89B8' }}>年化</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {p.features.map((f) => (
          <span
            key={f}
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(56, 189, 248, 0.10)',
              color: '#38BDF8',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Check size={10} /> {f}
          </span>
        ))}
      </div>

      <button
        style={{
          width: '100%',
          padding: '8px 0',
          background: p.status === 'soldout'
            ? 'rgba(148, 163, 184, 0.10)'
            : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          color: p.status === 'soldout' ? '#7B89B8' : '#0F1B3D',
          fontSize: 12,
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: p.status === 'soldout' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {p.status === 'soldout' ? '已售罄' : '立即申购'}
        {p.status !== 'soldout' && <ChevronRight size={14} />}
      </button>
    </div>
  );
}
