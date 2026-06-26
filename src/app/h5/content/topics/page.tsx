'use client';
import { useState } from 'react';
import {
  Hash, TrendingUp, Users, MessageCircle, Flame, Sparkles, Search, ChevronRight, Pin,
} from 'lucide-react';
import { getTopics } from '@/lib/h5-mock';

export default function H5ContentTopicsPage() {
  const [tab, setTab] = useState<'hot' | 'follow' | 'all'>('hot');
  const topics = getTopics();

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Hash size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>话题广场</span>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', marginBottom: 10 }}>
        <Search size={12} color="#7B89B8" />
        <input placeholder="搜索话题" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'hot', label: '🔥 热门' },
          { v: 'follow', label: '已关注' },
          { v: 'all', label: '全部' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'hot' | 'follow' | 'all')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 话题列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map((t, i) => (
          <div key={t.id} style={{ padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid', borderColor: t.hot ? `${t.color}40` : 'rgba(148, 163, 184, 0.12)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
            {t.hot && <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', borderRadius: '0 0 0 10px', background: t.color, color: '#0F1B3D', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}><Flame size={10} /> HOT</div>}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}80 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {t.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: t.color }}>{t.name}</span>
                </div>
                <div style={{ fontSize: 11, color: '#B4C0E0', marginBottom: 8, lineHeight: 1.5 }}>{t.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: '#7B89B8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MessageCircle size={10} />{t.posts.toLocaleString()} 帖</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} />{t.followers.toLocaleString()} 关注</span>
                </div>
              </div>
              <button style={{ padding: '5px 12px', background: t.hot ? `linear-gradient(135deg, ${t.color} 0%, ${t.color}80 100%)` : 'rgba(15, 27, 61, 0.50)', color: t.hot ? '#0F1B3D' : '#7B89B8', border: 'none', borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, height: 28, alignSelf: 'center' }}>
                {t.hot ? '关注' : '已关注'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
