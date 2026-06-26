'use client';
import { useState } from 'react';
import {
  Video, Eye, Users, Crown, Calendar, Filter, Search, Heart, Mic, Radio, Sparkles, ChevronRight,
} from 'lucide-react';
import { getLiveRooms } from '@/lib/h5-mock';

const CATEGORY_MAP = {
  all:      { label: '全部',   color: '#7B89B8' },
  trading:  { label: '行情',   color: '#F0B90B' },
  chat:     { label: '聊天',   color: '#38BDF8' },
  ama:      { label: 'AMA',   color: '#A78BFA' },
  music:    { label: '音乐',   color: '#F472B6' },
  game:     { label: '游戏',   color: '#34D399' },
};

const STATUS_COLOR = { live: '#F472B6', upcoming: '#38BDF8', ended: '#7B89B8' };
const STATUS_LABEL = { live: '直播中', upcoming: '即将开始', ended: '已结束' };

export default function H5ContentLivePage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const [tab, setTab] = useState<'live' | 'upcoming' | 'ended'>('live');
  const rooms = getLiveRooms();
  const filtered = rooms.filter(r => r.status === tab).filter(r => cat === 'all' || r.category === cat);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <Radio size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>直播</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.15)', color: '#F472B6', fontWeight: 600 }}>{rooms.filter(r => r.status === 'live').length} 场进行中</span>
      </div>

      {/* 状态 Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'live', label: '🔴 直播中' },
          { v: 'upcoming', label: '⏰ 即将开始' },
          { v: 'ended', label: '已结束' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'live' | 'upcoming' | 'ended')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)' : 'transparent', color: tab === t.v ? '#fff' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
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

      {/* 直播列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <a key={r.id} href={`/h5/content/live/${r.id}`} style={{ display: 'block', background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none' }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: r.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, position: 'relative' }}>
              {r.emoji}
              {r.status === 'live' && (
                <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 4, background: '#F472B6', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} /> LIVE
                </div>
              )}
              {r.vip && (
                <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 6px', borderRadius: 4, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Crown size={9} /> VIP
                </div>
              )}
              {r.status === 'live' && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(15, 27, 61, 0.80)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={10} />{r.viewers.toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {r.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(148, 163, 184, 0.15)', color: '#7B89B8' }}>#{t}</span>)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>{r.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#7B89B8' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{r.hostAvatar}</div>
                <span>{r.host}</span>
                <span>·</span>
                <span>{r.startTime}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
