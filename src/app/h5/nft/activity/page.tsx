'use client';
import { useState } from 'react';
import {
  Activity, Tag, ArrowRightLeft, Flame, Sparkles, BarChart3, Calendar,
} from 'lucide-react';

const ACTIVITY_TYPES = {
  all:      { label: '全部', color: '#7B89B8' },
  sale:     { label: '销售', color: '#34D399' },
  list:     { label: '挂单', color: '#38BDF8' },
  transfer: { label: '转移', color: '#A78BFA' },
  mint:     { label: '铸造', color: '#F0B90B' },
};

export default function H5NftActivityPage() {
  const [tab, setTab] = useState<keyof typeof ACTIVITY_TYPES>('all');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  const records = [
    { id: '1', type: 'sale',     text: '出售',  nft: 'CyberPunk 2078 #1024', price: '1.2 ETH',  from: '0xab...cd', to: '0xff...ee', time: '5 分钟前' },
    { id: '2', type: 'list',     text: '挂单',  nft: 'AI Punks #3568',       price: '0.35 ETH', from: '0x12...34', to: '-',         time: '12 分钟前' },
    { id: '3', type: 'sale',     text: '出售',  nft: 'NBA Top Shot #892',     price: '120 USDC', from: '0xff...ee', to: '0x99...88', time: '23 分钟前' },
    { id: '4', type: 'mint',     text: '铸造',  nft: 'Meta Warriors #5012',   price: '180 MATIC',from: '-',         to: '0x77...66', time: '1 小时前' },
    { id: '5', type: 'transfer', text: '转移',  nft: 'Music Genesis #128',    price: '-',         from: '0xaa...bb', to: '0x55...44', time: '2 小时前' },
    { id: '6', type: 'sale',     text: '出售',  nft: 'Pixel Pets #8800',      price: '0.08 ETH', from: '0xdd...cc', to: '0x33...22', time: '3 小时前' },
    { id: '7', type: 'list',     text: '挂单',  nft: 'BNB Domain Club #88',   price: '50 USDC',  from: '0x22...11', to: '-',         time: '5 小时前' },
    { id: '8', type: 'sale',     text: '出售',  nft: 'ZS Genesis #42',        price: '5.5 ETH',  from: '0x44...55', to: '0x66...77', time: '6 小时前' },
  ];

  const stats = {
    volume: '4,820 ETH',
    sales: '12,840',
    users: '32,150',
    avgPrice: '0.38 ETH',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Activity size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>NFT 活动</span>
      </div>

      {/* 数据统计 */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #4C1D95 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <BarChart3 size={14} color="#FCD535" />
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>市场活动统计</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>交易量</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.volume}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>销售数</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.sales}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>用户数</div><div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.users}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>均价</div><div style={{ fontSize: 14, fontWeight: 800, color: '#FCD535', marginTop: 2 }}>{stats.avgPrice}</div></div>
        </div>
      </div>

      {/* 周期切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', alignSelf: 'flex-start', maxWidth: 240 }}>
        {[
          { v: '24h', label: '24h' },
          { v: '7d', label: '7 天' },
          { v: '30d', label: '30 天' },
        ].map(t => (
          <button key={t.v} onClick={() => setPeriod(t.v as '24h' | '7d' | '30d')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: period === t.v ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' : 'transparent', color: period === t.v ? '#fff' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 类型筛选 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k as keyof typeof ACTIVITY_TYPES)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: tab === k ? v.color : 'rgba(148, 163, 184, 0.20)', background: tab === k ? `${v.color}20` : 'transparent', color: tab === k ? v.color : '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 活动列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {records.filter(r => tab === 'all' || r.type === tab).map(r => {
          const c = ACTIVITY_TYPES[r.type as keyof typeof ACTIVITY_TYPES];
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r.type === 'sale' ? <ArrowRightLeft size={16} color={c.color} /> : r.type === 'list' ? <Tag size={16} color={c.color} /> : r.type === 'mint' ? <Sparkles size={16} color={c.color} /> : <ArrowRightLeft size={16} color={c.color} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${c.color}26`, color: c.color, fontWeight: 700 }}>{c.label}</span>
                  <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nft}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'monospace' }}>{r.from}</span>
                  {r.to !== '-' && <><span>→</span><span style={{ fontFamily: 'monospace' }}>{r.to}</span></>}
                  <span style={{ marginLeft: 'auto' }}>{r.time}</span>
                </div>
              </div>
              {r.price !== '-' && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: r.type === 'sale' ? '#34D399' : c.color, fontVariantNumeric: 'tabular-nums' }}>{r.price}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
