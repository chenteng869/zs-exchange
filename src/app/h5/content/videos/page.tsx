'use client';
import { useState } from 'react';
import {
  Play, Eye, Heart, Clock, Search, Filter, Crown, ChevronRight, Sparkles,
} from 'lucide-react';
import { getVideos } from '@/lib/h5-mock';

const CATEGORY_MAP = {
  all:       { label: '全部',   color: '#7B89B8' },
  news:      { label: '资讯',   color: '#38BDF8' },
  tutorial:  { label: '教程',   color: '#34D399' },
  interview: { label: '专访',   color: '#A78BFA' },
  fun:       { label: '娱乐',   color: '#F472B6' },
};

export default function H5ContentVideosPage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const videos = getVideos();
  const filtered = cat === 'all' ? videos : videos.filter(v => v.category === cat);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Play size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>短视频</span>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索视频" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(CATEGORY_MAP).map(([k, v]) => (
          <button key={k} onClick={() => setCat(k as keyof typeof CATEGORY_MAP)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: cat === k ? v.color : 'rgba(148, 163, 184, 0.20)', background: cat === k ? `${v.color}20` : 'transparent', color: cat === k ? v.color : '#7B89B8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 视频网格 2 列 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {filtered.map(v => (
          <a key={v.id} href={`/h5/content/video/${v.id}`} style={{ display: 'block', background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: v.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, position: 'relative' }}>
              {v.emoji}
              <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 4, background: 'rgba(15, 27, 61, 0.80)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={9} />{v.duration}
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.20)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={18} color="#fff" fill="#fff" />
                </div>
              </div>
              {v.vip && (
                <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', borderRadius: 4, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Crown size={9} /> VIP
                </div>
              )}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 6, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{v.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#7B89B8' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{v.authorAvatar}</div>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.author}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Eye size={9} />{(v.views / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
