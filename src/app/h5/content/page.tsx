'use client';
/**
 * Content 模块首页 - 资讯 / 视频 / 直播 / 播客
 */
import Link from 'next/link';
import {
  Newspaper, Play, Radio, Headphones, ChevronRight, Hash, Search, Flame, Sparkles, Eye, Heart, MessageCircle,
} from 'lucide-react';
import { getContentArticles, getLiveRooms, getVideos, getTopics } from '@/lib/h5-mock';

export default function H5ContentHomePage() {
  const articles = getContentArticles();
  const videos = getVideos();
  const lives = getLiveRooms();
  const topics = getTopics();
  const live = lives.find(l => l.status === 'live');
  const hot = articles.filter(a => a.hot);
  const pinned = articles.filter(a => a.pinned);
  const hotTopics = topics.filter(t => t.hot);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(29, 78, 216, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Newspaper size={18} color="#38BDF8" />
            <span style={{ fontSize: 14, color: '#BAE6FD', fontWeight: 600 }}>内容中心</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.20)', color: '#38BDF8' }}>资讯 · 视频 · 直播 · 播客</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 12 }}>文章 · 视频 · 直播</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{articles.length}</div>
              <div style={{ fontSize: 10, color: '#BAE6FD' }}>文章</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>{videos.length}</div>
              <div style={{ fontSize: 10, color: '#BAE6FD' }}>视频</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#F472B6' }}>{lives.length}</div>
              <div style={{ fontSize: 10, color: '#BAE6FD' }}>直播</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 个子入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: Newspaper,  label: '资讯',  color: '#38BDF8', href: '/h5/content/feed' },
          { icon: Play,       label: '视频',  color: '#F472B6', href: '/h5/content/videos' },
          { icon: Radio,      label: '直播',  color: '#F0B90B', href: '/h5/content/live' },
          { icon: Headphones, label: '播客',  color: '#A78BFA', href: '/h5/content/podcasts' },
        ].map(e => {
          const Icon = e.icon;
          return (
            <Link key={e.label} href={e.href} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '14px 8px', textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>
                <Icon size={26} color={e.color} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{e.label}</div>
            </Link>
          );
        })}
      </div>

      {/* 直播中 */}
      {live && (
        <Link href={`/h5/content/live/${live.id}`} style={{ display: 'block', background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.20) 0%, rgba(219, 39, 119, 0.15) 100%)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid rgba(244, 114, 182, 0.40)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Radio size={12} color="#F472B6" />
            <span style={{ fontSize: 11, color: '#F472B6', fontWeight: 700 }}>📡 正在直播</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={9} />{live.viewers.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: live.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{live.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{live.title}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>主播 {live.host}</div>
            </div>
            <ChevronRight size={16} color="#F472B6" />
          </div>
        </Link>
      )}

      {/* 热门文章 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Flame size={12} color="#F472B6" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门资讯</span>
        <Link href="/h5/content/feed" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {hot.slice(0, 3).map(a => (
          <Link key={a.id} href={`/h5/content/article/${a.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 8, background: a.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{a.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 10, color: '#7B89B8' }}>
                <span>{a.author}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Eye size={9} />{a.views.toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Heart size={9} />{a.likes}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 热门话题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Hash size={12} color="#A78BFA" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门话题</span>
        <Link href="/h5/content/topics" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {hotTopics.map(t => (
          <Link key={t.id} href="/h5/content/topics" style={{ background: `${t.color}20`, border: `1px solid ${t.color}40`, borderRadius: 14, padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>{t.emoji}</span>
            <span style={{ fontSize: 11, color: t.color, fontWeight: 600 }}>{t.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
