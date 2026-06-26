'use client';
import { useState } from 'react';
import {
  Image as ImageIcon, ChevronRight, TrendingUp, TrendingDown, Flame, Search, Filter,
  Eye, Heart, BadgeCheck, Sparkles,
} from 'lucide-react';
import { getNftCollections } from '@/lib/h5-mock';

const CATEGORY_MAP = {
  all:    { label: '全部',  color: '#7B89B8' },
  art:    { label: '艺术',  color: '#A78BFA' },
  music:  { label: '音乐',  color: '#22D3EE' },
  game:   { label: '游戏',  color: '#F472B6' },
  sport:  { label: '体育',  color: '#F0B90B' },
  ip:     { label: 'IP',    color: '#34D399' },
  domain: { label: '域名',  color: '#FCD535' },
};

export default function H5NftMarketPage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const [tab, setTab] = useState<'hot' | 'new' | 'price'>('hot');
  const collections = getNftCollections();
  const filtered = cat === 'all' ? collections : collections.filter(c => c.category === cat);

  const stats = {
    volume24h: '4,820 ETH',
    sales: '12,840',
    users: '32,150',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <ImageIcon size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>NFT 市场</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA', fontWeight: 600 }}>Marketplace</span>
      </div>

      {/* 平台数据 */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #4C1D95 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Sparkles size={14} color="#FCD535" />
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>NFT 生态数据</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>24h 交易量</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.volume24h}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>销售笔数</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.sales}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>活跃用户</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.users}</div></div>
        </div>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索合集/创作者" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(CATEGORY_MAP).map(([k, v]) => (
          <button key={k} onClick={() => setCat(k as keyof typeof CATEGORY_MAP)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: cat === k ? v.color : 'rgba(148, 163, 184, 0.20)', background: cat === k ? `${v.color}20` : 'transparent', color: cat === k ? v.color : '#7B89B8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 排序 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 11 }}>
        {[
          { v: 'hot', label: '热门' },
          { v: 'new', label: '最新' },
          { v: 'price', label: '高价' },
        ].map(t => (
          <span key={t.v} onClick={() => setTab(t.v as 'hot' | 'new' | 'price')}
            style={{ color: tab === t.v ? '#F8FAFC' : '#7B89B8', fontWeight: tab === t.v ? 700 : 500, cursor: 'pointer', borderBottom: tab === t.v ? '2px solid #F0B90B' : 'none', paddingBottom: 4 }}>
            {t.label}
          </span>
        ))}
      </div>

      {/* 收藏品卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {filtered.map(c => (
          <a key={c.id} href={`/h5/nft/detail/${c.id}`} style={{ display: 'block', background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none' }}>
            <div style={{ width: '100%', aspectRatio: '1', background: c.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative' }}>
              {c.emoji}
              {c.hot && (
                <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.90)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Flame size={9} /> HOT
                </div>
              )}
              {c.verified && (
                <div style={{ position: 'absolute', top: 6, left: 6, padding: 2, borderRadius: '50%', background: 'rgba(15, 27, 61, 0.80)' }}>
                  <BadgeCheck size={14} color="#38BDF8" />
                </div>
              )}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${CATEGORY_MAP[c.category].color}26`, color: CATEGORY_MAP[c.category].color, fontWeight: 700 }}>{CATEGORY_MAP[c.category].label}</span>
                <span style={{ fontSize: 10, color: c.change.startsWith('+') ? '#34D399' : '#F472B6', fontWeight: 700 }}>{c.change}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                <span style={{ color: '#7B89B8' }}>地板价</span>
                <span style={{ color: '#FCD535', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{c.floorPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, marginTop: 2 }}>
                <span style={{ color: '#7B89B8' }}>24h 交易量</span>
                <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.volume}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
