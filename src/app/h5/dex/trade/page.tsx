'use client';
import { useState } from 'react';
import {
  Repeat, ChevronRight, TrendingUp, BarChart3, Droplets, Coins, ArrowLeftRight, Plus, Flame, Search, Filter,
} from 'lucide-react';
import { getDexPools } from '@/lib/h5-mock';

export default function H5DexTradePage() {
  const [tab, setTab] = useState<'pools' | 'pairs'>('pools');
  const pools = getDexPools();

  const stats = {
    tvl: '$145.7M',
    volume24h: '$37.6M',
    pairs: 86,
    apr: '18.5%',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#22D3EE', borderRadius: 2 }} />
        <Repeat size={16} color="#22D3EE" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>DEX 交易</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 211, 238, 0.15)', color: '#22D3EE', fontWeight: 600 }}>AMM</span>
      </div>

      {/* 平台数据 */}
      <div style={{ background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 50%, #155E75 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34, 211, 238, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <BarChart3 size={14} color="#FCD535" />
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>ZS DEX 数据</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>总锁仓</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.tvl}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>24h 量</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.volume24h}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>交易对</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.pairs}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>平均 APR</div><div style={{ fontSize: 14, fontWeight: 800, color: '#34D399', marginTop: 2 }}>{stats.apr}</div></div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: ArrowLeftRight, label: '兑换',     color: '#22D3EE', href: '/h5/defi/swap' },
          { icon: Plus,           label: '添加流动性', color: '#34D399', href: '/h5/dex/add' },
          { icon: Droplets,       label: '挖矿',     color: '#F0B90B', href: '/h5/dex/yield' },
          { icon: Coins,          label: '我的流动性', color: '#A78BFA', href: '/h5/dex/pool/DXP-001' },
        ].map((it, i) => {
          const Icon = it.icon;
          return (
            <a key={i} href={it.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${it.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={it.color} />
              </div>
              <span style={{ fontSize: 10, color: '#F8FAFC', fontWeight: 600 }}>{it.label}</span>
            </a>
          );
        })}
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          { v: 'pools', label: '流动性池' },
          { v: 'pairs', label: '交易对' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'pools' | 'pairs')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid', borderColor: tab === t.v ? '#22D3EE' : 'rgba(148, 163, 184, 0.20)', background: tab === t.v ? 'rgba(34, 211, 238, 0.15)' : 'transparent', color: tab === t.v ? '#22D3EE' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索交易对" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 池列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pools.map(p => (
          <a key={p.id} href={`/h5/dex/pool/${p.id}`} style={{ display: 'block', padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0F1B3D' }}>{p.token0.slice(0, 2)}</div>
                <div style={{ position: 'absolute', right: -8, top: 0, width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', border: '2px solid #131E45' }}>{p.token1.slice(0, 2)}</div>
              </div>
              <div style={{ flex: 1, marginLeft: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{p.pair}</span>
                  {p.apr.includes('24') || p.apr.includes('32') ? <Flame size={11} color="#F472B6" /> : null}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>手续费 {p.fees}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#34D399' }}>{p.apr}</div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>APR</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 8, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 8 }}>
              <div><div style={{ fontSize: 9, color: '#7B89B8' }}>TVL</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>{p.tvl}</div></div>
              <div><div style={{ fontSize: 9, color: '#7B89B8' }}>24h 量</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>{p.volume24h}</div></div>
              <div><div style={{ fontSize: 9, color: '#7B89B8' }}>7d 量</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>{p.volume7d}</div></div>
            </div>
            {parseFloat(p.myShare) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: 8, background: 'rgba(34, 211, 238, 0.10)', borderRadius: 8, fontSize: 11 }}>
                <span style={{ color: '#22D3EE' }}>我的流动性 {p.myLiquidity}</span>
                <span style={{ color: '#7B89B8' }}>占比 {p.myShare}</span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
