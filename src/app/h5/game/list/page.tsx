'use client';
import { useState } from 'react';
import {
  Gamepad2, Search, Filter, Star, Users, ChevronRight, Play, Crown, Flame, Zap, Sparkles,
} from 'lucide-react';
import { getGames } from '@/lib/h5-mock';

const CATEGORY_MAP = {
  all:      { label: '全部',   color: '#7B89B8' },
  rpg:      { label: 'RPG',    color: '#F0B90B' },
  strategy: { label: '策略',   color: '#A78BFA' },
  casual:   { label: '休闲',   color: '#34D399' },
  puzzle:   { label: '益智',   color: '#22D3EE' },
  fps:      { label: 'FPS',    color: '#F472B6' },
  sport:    { label: '体育',   color: '#38BDF8' },
};

export default function H5GameListPage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const [sort, setSort] = useState<'hot' | 'new' | 'rating'>('hot');
  const games = getGames();
  const filtered = cat === 'all' ? games : games.filter(g => g.category === cat);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Gamepad2 size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>游戏库</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' }}>{games.length} 款</span>
      </div>

      {/* 搜索 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Search size={14} color="#7B89B8" />
        <span style={{ flex: 1, fontSize: 12, color: '#7B89B8' }}>搜索游戏 / 厂商</span>
        <Filter size={14} color="#A78BFA" />
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
        {Object.entries(CATEGORY_MAP).map(([k, v]) => {
          const active = cat === k;
          return (
            <button key={k} onClick={() => setCat(k as keyof typeof CATEGORY_MAP)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: active ? `${v.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${v.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? v.color : '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 排序 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 11 }}>
        {[
          { k: 'hot',    label: '热门',  icon: Flame },
          { k: 'new',    label: '最新',  icon: Sparkles },
          { k: 'rating', label: '评分',  icon: Star },
        ].map(it => {
          const Icon = it.icon;
          const active = sort === it.k;
          return (
            <button key={it.k} onClick={() => setSort(it.k as 'hot' | 'new' | 'rating')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: active ? '#A78BFA' : '#7B89B8', cursor: 'pointer' }}>
              <Icon size={11} color={active ? '#A78BFA' : '#7B89B8'} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>

      {/* 游戏列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(g => (
          <div key={g.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, background: g.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative', flexShrink: 0 }}>
              {g.emoji}
              {g.hot && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#F472B6', color: '#0F1B3D', fontWeight: 700 }}>HOT</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{g.name}</span>
                {g.reward && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B', fontWeight: 600 }}>PLLAY</span>}
              </div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{g.developer}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 10, color: '#7B89B8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={10} color="#F0B90B" fill="#F0B90B" />{g.rating}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Users size={10} color="#38BDF8" />{g.players.toLocaleString()}</span>
                <span>{g.size}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {g.chains.map(c => <span key={c} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' }}>{c}</span>)}
              </div>
            </div>
            <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Play size={10} /> 玩
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
