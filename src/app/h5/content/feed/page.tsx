'use client';
import { useState } from 'react';
import {
  Newspaper, Eye, Heart, MessageCircle, Share2, Bookmark, Search, Filter,
  Flame, TrendingUp, Clock, ChevronRight, Pin, Sparkles, Award,
} from 'lucide-react';
import { getContentArticles } from '@/lib/h5-mock';

const CATEGORY_MAP = {
  all:      { label: '全部',   color: '#7B89B8' },
  news:     { label: '快讯',   color: '#38BDF8' },
  analysis: { label: '分析',   color: '#F0B90B' },
  tutorial: { label: '教程',   color: '#34D399' },
  interview:{ label: '专访',   color: '#A78BFA' },
  event:    { label: '活动',   color: '#F472B6' },
};

export default function H5ContentFeedPage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const articles = getContentArticles();
  const filtered = cat === 'all' ? articles : articles.filter(a => a.category === cat);
  const pinned = filtered.find(a => a.pinned);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <Newspaper size={16} color="#38BDF8" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>资讯</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 600 }}>News</span>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索文章/作者" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
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

      {/* 置顶文章 */}
      {pinned && cat === 'all' && (
        <a href={`/h5/content/article/${pinned.id}`} style={{ display: 'block', padding: 0, background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)', borderRadius: 16, marginBottom: 12, overflow: 'hidden', textDecoration: 'none', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 50%, #F0B90B 100%)' }} />
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Pin size={10} /> 置顶
              </span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.30)', color: '#F472B6', fontWeight: 700 }}>{pinned.tag}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, lineHeight: 1.4 }}>{pinned.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5, marginBottom: 10 }}>{pinned.excerpt}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>
              <span>{pinned.author}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{pinned.views.toLocaleString()}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={10} />{pinned.likes}</span>
            </div>
          </div>
        </a>
      )}

      {/* 文章列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.filter(a => !a.pinned).map(a => {
          const c = CATEGORY_MAP[a.category];
          return (
            <a key={a.id} href={`/h5/content/article/${a.id}`} style={{ display: 'block', padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 80, height: 80, borderRadius: 10, background: a.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{a.emoji}</div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${c.color}26`, color: c.color, fontWeight: 700 }}>{c.label}</span>
                    {a.hot && <Flame size={10} color="#F472B6" />}
                    {a.tag && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700 }}>{a.tag}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 4, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                    <span>{a.author}</span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Eye size={9} />{a.views.toLocaleString()}</span>
                    <span>·</span>
                    <span>{a.time}</span>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
