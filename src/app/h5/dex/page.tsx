'use client';
/**
 * DEX 模块首页 - 去中心化交易
 */
import Link from 'next/link';
import {
  ArrowLeftRight, Droplet, Layers, TrendingUp, ChevronRight, BarChart3, Zap, ShieldCheck, Coins,
} from 'lucide-react';
import { getDexPools } from '@/lib/h5-mock';

export default function H5DexHomePage() {
  const pools = getDexPools();
  const totalTvl = pools.reduce((s, p) => s + parseFloat(p.tvl.replace(/[$M,]/g, '')), 0);
  const total24 = pools.reduce((s, p) => s + parseFloat(p.volume24h.replace(/[$M,]/g, '')), 0);

  const SUB = [
    { icon: ArrowLeftRight, label: 'Swap 兑换', color: '#22D3EE', href: '/h5/dex/trade' },
    { icon: Layers,         label: '流动性池',  color: '#38BDF8', href: '/h5/dex/yield' },
    { icon: PlusIcon,       label: '添加流动性', color: '#A78BFA', href: '/h5/dex/add' },
    { icon: MinusIcon,      label: '移除流动性', color: '#F472B6', href: '/h5/dex/remove' },
    { icon: TrendingUp,     label: '收益农场',  color: '#F0B90B', href: '/h5/dex/yield' },
    { icon: BarChart3,      label: 'K 线图表',  color: '#34D399', href: '/h5/dex/trade' },
  ];

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0E7490 0%, #0891B2 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(8, 145, 178, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(34, 211, 238, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ArrowLeftRight size={18} color="#22D3EE" />
            <span style={{ fontSize: 14, color: '#A5F3FC', fontWeight: 600 }}>DEX 去中心化交易</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 211, 238, 0.20)', color: '#22D3EE' }}>AMM</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 12 }}>总 TVL · 24h 交易量</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>${totalTvl.toFixed(0)}M</div>
              <div style={{ fontSize: 10, color: '#A5F3FC' }}>TVL</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>${total24.toFixed(0)}M</div>
              <div style={{ fontSize: 10, color: '#A5F3FC' }}>24h 量</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 子入口 3×2 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 16, padding: '14px 8px', marginBottom: 12, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SUB.map(e => {
            const Icon = e.icon;
            return (
              <Link key={e.label} href={e.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '6px 0', textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${e.color}25`, border: `1px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={e.color} />
                </div>
                <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 500 }}>{e.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 流动性池 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Droplet size={12} color="#22D3EE" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门池子</span>
        <Link href="/h5/dex/yield" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pools.slice(0, 5).map(p => (
          <Link key={p.id} href={`/h5/dex/pool/${p.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg, #22D3EE 0%, #0E7490 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0F1B3D' }}>{p.token0[0]}</div>
              <div style={{ position: 'absolute', top: 0, left: 18, width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', border: '2px solid #0F1B3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0F1B3D' }}>{p.token1[0]}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{p.token0}/{p.token1}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>TVL {p.tvl} · 24h {p.volume24h}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399' }}>{p.apr}</div>
              <div style={{ fontSize: 9, color: '#7B89B8' }}>APR</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 安全保障 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(4, 120, 87, 0.10) 100%)', borderRadius: 12, border: '1px solid rgba(52, 211, 153, 0.25)' }}>
        <ShieldCheck size={20} color="#34D399" />
        <div>
          <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>审计合约 · 安全保障</div>
          <div style={{ fontSize: 10, color: '#A7F3D0', marginTop: 2 }}>已通过 Certik · SlowMist 审计</div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: { size?: number; color?: string }) {
  return <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
function MinusIcon(props: { size?: number; color?: string }) {
  return <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke={props.color || '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
