'use client';

/**
 * H5 理财产品页
 */
import { useState } from 'react';
import { PiggyBank, ChevronRight } from 'lucide-react';
import { getDefiPools } from '@/lib/h5-mock';

type Filter = 'all' | 'low' | 'mid' | 'high';

export default function H5EarnPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const pools = getDefiPools();

  let list = pools;
  if (filter !== 'all') list = pools.filter((p) => p.risk === filter);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>理财产品</span>
      </div>

      {/* 风险筛选 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { k: 'all',  l: '全部',   color: '#38BDF8' },
          { k: 'low',  l: '低风险', color: '#34D399' },
          { k: 'mid',  l: '中风险', color: '#FCD535' },
          { k: 'high', l: '高风险', color: '#F472B6' },
        ].map((t) => {
          const active = t.k === filter;
          return (
            <button
              key={t.k}
              onClick={() => setFilter(t.k as Filter)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                background: active ? `${t.color}26` : 'rgba(148, 163, 184, 0.10)',
                border: active ? `1px solid ${t.color}50` : '1px solid rgba(148, 163, 184, 0.10)',
                color: active ? t.color : '#B4C0E0',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {/* 产品列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((p) => {
          const riskColor = p.risk === 'low' ? '#34D399' : p.risk === 'mid' ? '#FCD535' : '#F472B6';
          const riskLabel = p.risk === 'low' ? '低风险' : p.risk === 'mid' ? '中风险' : '高风险';
          return (
            <div
              key={p.id}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 16, padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `${riskColor}26`, border: `1px solid ${riskColor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{p.tokens}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 18, fontWeight: 800, color: '#FCD535',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {p.apy}
                  </div>
                  <div style={{ fontSize: 9, color: '#7B89B8' }}>年化收益</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                <div
                  style={{
                    background: 'rgba(15, 27, 61, 0.50)', borderRadius: 8, padding: 8,
                  }}
                >
                  <div style={{ fontSize: 10, color: '#7B89B8' }}>TVL</div>
                  <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, marginTop: 2 }}>{p.tvl}</div>
                </div>
                <div
                  style={{
                    background: 'rgba(15, 27, 61, 0.50)', borderRadius: 8, padding: 8,
                  }}
                >
                  <div style={{ fontSize: 10, color: '#7B89B8' }}>24h 交易</div>
                  <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, marginTop: 2 }}>{p.volume24h}</div>
                </div>
                <div
                  style={{
                    background: 'rgba(15, 27, 61, 0.50)', borderRadius: 8, padding: 8,
                  }}
                >
                  <div style={{ fontSize: 10, color: '#7B89B8' }}>风险</div>
                  <div style={{ fontSize: 12, color: riskColor, fontWeight: 600, marginTop: 2 }}>{riskLabel}</div>
                </div>
              </div>

              <button
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                  border: 'none', color: '#0F1B3D', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                立即申购
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}