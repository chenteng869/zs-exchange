'use client';
/**
 * DeFi 模块首页 - 链上金融总览
 */
import Link from 'next/link';
import {
  Leaf, TrendingUp, Coins, Droplet, Sprout, Layers, ChevronRight, ArrowDownToLine, ArrowUpFromLine, Repeat, Banknote, Zap,
} from 'lucide-react';
import { getDefiPools, getStakePools } from '@/lib/h5-mock';

export default function H5DefiHomePage() {
  const pools = getDefiPools();
  const stakes = getStakePools();
  const totalTvl = pools.reduce((s, p) => s + parseFloat(p.tvl.replace(/[$M,]/g, '')), 0);
  const avgApy = (pools.reduce((s, p) => s + parseFloat(p.apy.replace('%', '')), 0) / pools.length).toFixed(2);

  const SUB_ENTRIES = [
    { icon: Droplet,  label: 'Swap 兑换',  color: '#22D3EE', href: '/h5/defi/swap' },
    { icon: Layers,    label: '流动性池',    color: '#38BDF8', href: '/h5/defi/pools' },
    { icon: PlusIcon,  label: '添加流动性',  color: '#A78BFA', href: '/h5/defi/add' },
    { icon: MinusIcon, label: '移除流动性',  color: '#F472B6', href: '/h5/defi/remove' },
    { icon: Sprout,    label: 'Farm 挖矿',  color: '#34D399', href: '/h5/defi/farm' },
    { icon: Coins,     label: '质押',        color: '#F0B90B', href: '/h5/defi/stake' },
    { icon: TrendingUp,label: '收益',        color: '#22D3EE', href: '/h5/defi/earn' },
    { icon: Banknote,  label: '我的头寸',    color: '#A78BFA', href: '/h5/defi/positions' },
  ];

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* 顶部 hero */}
      <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(6, 78, 59, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Leaf size={18} color="#34D399" />
            <span style={{ fontSize: 14, color: '#A7F3D0', fontWeight: 600 }}>DeFi 链上金融</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.20)', color: '#34D399' }}>链上</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', marginBottom: 12 }}>总 TVL · 平均 APY</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>${totalTvl.toFixed(0)}M</div>
              <div style={{ fontSize: 10, color: '#A7F3D0' }}>TVL</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>{avgApy}%</div>
              <div style={{ fontSize: 10, color: '#A7F3D0' }}>平均 APY</div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 个子功能入口 4×2 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 16, padding: '14px 8px', marginBottom: 12, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SUB_ENTRIES.map(e => {
            const Icon = e.icon;
            return (
              <Link key={e.label} href={e.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '6px 0', textDecoration: 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${e.color}25`, border: `1px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={e.color} />
                </div>
                <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 500 }}>{e.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 热门池子 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #34D399 0%, #10B981 100%)', borderRadius: 2 }} />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门流动性池</span>
        <Link href="/h5/defi/pools" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        {pools.slice(0, 4).map((p, i) => (
          <Link key={p.id} href={`/h5/defi/pool/${p.id}`} style={{ display: 'flex', alignItems: 'center', padding: 12, borderTop: i === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.06)', textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(34, 211, 238, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: 10 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>TVL {p.tvl} · 24h {p.volume24h}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399' }}>{p.apy}</div>
              <div style={{ fontSize: 9, color: p.risk === 'low' ? '#34D399' : p.risk === 'mid' ? '#F0B90B' : '#F472B6' }}>风险{p.risk === 'low' ? '低' : p.risk === 'mid' ? '中' : '高'}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 质押池 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #F0B90B 0%, #B45309 100%)', borderRadius: 2 }} />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门 PoS 质押</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {stakes.slice(0, 4).map(s => (
          <div key={s.id} style={{ background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, border: '1px solid rgba(240, 185, 11, 0.20)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0F1B3D' }}>{s.icon}</div>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{s.symbol}</div>
            </div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>{s.network}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#F0B90B' }}>{s.apy}</span>
              <span style={{ fontSize: 9, color: '#7B89B8' }}>APY</span>
            </div>
          </div>
        ))}
      </div>

      {/* 我的资产入口 */}
      <Link href="/h5/defi/positions" style={{ display: 'flex', alignItems: 'center', padding: 14, background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.18) 0%, rgba(124, 58, 237, 0.10) 100%)', borderRadius: 14, border: '1px solid rgba(167, 139, 250, 0.30)', textDecoration: 'none', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167, 139, 250, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Banknote size={20} color="#A78BFA" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>我的 DeFi 头寸</div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>查看流动性挖矿、Farm、质押持仓</div>
        </div>
        <ChevronRight size={16} color="#A78BFA" />
      </Link>
    </div>
  );
}

function PlusIcon(props: { size?: number; color?: string }) {
  return <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
function MinusIcon(props: { size?: number; color?: string }) {
  return <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
