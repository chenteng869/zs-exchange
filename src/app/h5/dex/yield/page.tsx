'use client';
import { useState } from 'react';
import {
  Coins, Sparkles, TrendingUp, ChevronRight, Filter, BarChart3, Award, Calendar, Activity,
} from 'lucide-react';
import { getDexPools } from '@/lib/h5-mock';

export default function H5DexYieldPage() {
  const [tab, setTab] = useState<'all' | 'mine' | 'reward'>('mine');
  const pools = getDexPools();

  const totalReward = 1240.50;
  const aprs = [
    { date: '06-24', amount: 18.20 },
    { date: '06-23', amount: 17.50 },
    { date: '06-22', amount: 19.10 },
    { date: '06-21', amount: 16.80 },
    { date: '06-20', amount: 18.90 },
    { date: '06-19', amount: 17.20 },
    { date: '06-18', amount: 18.50 },
  ];
  const maxApr = Math.max(...aprs.map(a => a.amount));

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Coins size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>流动性挖矿</span>
      </div>

      {/* 收益大卡 */}
      <div style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #B45309 50%, #78350F 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(252, 213, 53, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Sparkles size={12} color="#FCD535" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>累计挖矿收益 (USDT)</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums', position: 'relative' }}>${totalReward.toFixed(2)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, position: 'relative' }}>
          <TrendingUp size={12} color="#34D399" />
          <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>+$126.20 (7d)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.10)', position: 'relative' }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>挖矿中</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>2 个</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>总流动性</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>$2,800</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>年化收益</div><div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginTop: 2 }}>$486</div></div>
        </div>
      </div>

      {/* 7日收益图表 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color="#FCD535" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>7 日收益</span>
          </div>
          <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>+$126.20</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {aprs.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: `${(d.amount / maxApr) * 100}%`, background: 'linear-gradient(180deg, #FCD535 0%, #F0B90B 100%)', borderRadius: 4, minHeight: 8, position: 'relative' }}>
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#FCD535', fontWeight: 700, whiteSpace: 'nowrap' }}>${d.amount}</span>
              </div>
              <span style={{ fontSize: 9, color: '#7B89B8' }}>{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'mine', label: '我的挖矿' },
          { v: 'reward', label: '收益记录' },
          { v: 'all', label: '可挖矿池' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'mine' | 'reward' | 'all')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 我的挖矿 */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pools.slice(0, 3).map(p => (
            <div key={p.id} style={{ padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(240, 185, 11, 0.20)', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0F1B3D' }}>{p.token0.slice(0, 2)}</div>
                  <div style={{ position: 'absolute', right: -8, top: 0, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', border: '2px solid #131E45' }}>{p.token1.slice(0, 2)}</div>
                </div>
                <div style={{ flex: 1, marginLeft: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{p.pair}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>已挖矿 32 天</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FCD535' }}>{p.apr}</div>
                  <div style={{ fontSize: 9, color: '#7B89B8' }}>APR</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 8, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 8 }}>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>本金</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>{p.myLiquidity}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>待领</div><div style={{ fontSize: 11, fontWeight: 700, color: '#34D399' }}>{p.id === 'DXP-001' ? '$28.50' : p.id === 'DXP-002' ? '$15.20' : '$8.40'}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>已领</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>{p.id === 'DXP-001' ? '$486.20' : p.id === 'DXP-002' ? '$220.50' : '$96.80'}</div></div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button style={{ flex: 1, padding: '8px 0', background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.30)', color: '#22D3EE', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>查看</button>
                <button style={{ flex: 2, padding: '8px 0', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 8, cursor: 'pointer' }}>领取收益</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 收益记录 */}
      {tab === 'reward' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { date: '2026-06-24 10:30', pool: 'ETH/USDT', amount: '18.20', token: 'USDT', status: 'success' },
            { date: '2026-06-23 10:30', pool: 'ETH/USDT', amount: '17.50', token: 'USDT', status: 'success' },
            { date: '2026-06-22 10:30', pool: 'BTC/USDT', amount: '8.20',  token: 'USDT', status: 'success' },
            { date: '2026-06-22 09:15', pool: 'ZS/USDT',  amount: '12.50', token: 'ZS',   status: 'success' },
            { date: '2026-06-21 10:30', pool: 'ETH/USDT', amount: '16.80', token: 'USDT', status: 'success' },
            { date: '2026-06-21 09:00', pool: 'BTC/USDT', amount: '7.50',  token: 'USDT', status: 'claimed' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(240, 185, 11, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={14} color="#FCD535" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{r.pool} 挖矿奖励</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{r.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>+{r.amount} {r.token}</div>
                <div style={{ fontSize: 9, color: r.status === 'success' ? '#34D399' : '#7B89B8', marginTop: 2 }}>{r.status === 'success' ? '已发放' : '已领取'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 可挖矿池 */}
      {tab === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pools.map(p => (
            <a key={p.id} href={`/h5/dex/pool/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, textDecoration: 'none' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0F1B3D' }}>{p.token0.slice(0, 2)}</div>
                <div style={{ position: 'absolute', right: -8, top: 0, width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', border: '2px solid #131E45' }}>{p.token1.slice(0, 2)}</div>
              </div>
              <div style={{ flex: 1, marginLeft: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{p.pair}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>TVL {p.tvl}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FCD535' }}>{p.apr}</div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>APR</div>
              </div>
              <ChevronRight size={14} color="#7B89B8" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
