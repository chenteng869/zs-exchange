'use client';
import { useState } from 'react';
import {
  Rocket, Clock, CheckCircle2, TrendingUp, Users, Flame,
  ChevronRight, Bell, Filter, Search, Globe, Zap,
} from 'lucide-react';
import { getIdoProjects } from '@/lib/h5-mock';

const STATUS_MAP = {
  live:     { label: '进行中', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  upcoming: { label: '即将开始', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  ended:    { label: '已结束', color: '#7B89B8', bg: 'rgba(148, 163, 184, 0.15)' },
  soldout:  { label: '已售罄', color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)' },
};

export default function H5IdoListPage() {
  const [tab, setTab] = useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const projects = getIdoProjects();
  const filtered = tab === 'all' ? projects : projects.filter(p => p.status === tab);

  const stats = {
    totalRaise: '$44.5M',
    liveCount: projects.filter(p => p.status === 'live').length,
    upcomingCount: projects.filter(p => p.status === 'upcoming').length,
    participants: '50,800+',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Rocket size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>IDO 首发</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B', fontWeight: 600 }}>Launchpad</span>
      </div>

      {/* 统计大卡 */}
      <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginBottom: 4 }}>本期平台总募资</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>{stats.totalRaise}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>进行中</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.liveCount} 个</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>即将开始</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.upcomingCount} 个</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>参与人次</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.participants}</div></div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'all', label: '全部' },
          { v: 'live', label: '进行中' },
          { v: 'upcoming', label: '即将开始' },
          { v: 'ended', label: '已结束' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'all' | 'live' | 'upcoming' | 'ended')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 搜索/筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索项目" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Bell size={14} />
        </button>
      </div>

      {/* 项目卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => {
          const s = STATUS_MAP[p.status];
          return (
            <a key={p.id} href={`/h5/ido/detail/${p.id}`} style={{ display: 'block', padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 16, textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#0F1B3D' }}>{p.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.name}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(15, 27, 61, 0.60)', color: '#7B89B8' }}>{p.symbol}</span>
                    {p.hot && <Flame size={11} color="#F472B6" />}
                  </div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ padding: '1px 5px', borderRadius: 3, background: s.bg, color: s.color, fontWeight: 700 }}>{s.label}</span>
                    <span>·</span>
                    <span>{p.category}</span>
                    <span>·</span>
                    <Globe size={9} />
                    <span>{p.network}</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#7B89B8" />
              </div>
              <div style={{ fontSize: 11, color: '#B4C0E0', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</div>
              {/* 进度条 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7B89B8', marginBottom: 4 }}>
                  <span>募集进度</span>
                  <span style={{ color: '#FCD535', fontWeight: 700 }}>{p.soldPct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(15, 27, 61, 0.60)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${p.soldPct}%`, height: '100%', background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>募集</div><div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{p.totalRaise}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>价格</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FCD535' }}>{p.price}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>参与</div><div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{p.participants > 0 ? p.participants.toLocaleString() : '-'}</div></div>
              </div>
            </a>
          );
        })}
      </div>

      {/* 我的认购入口 */}
      <a href="/h5/ido/my" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(240, 185, 11, 0.30)', borderRadius: 16, marginTop: 12, textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(240, 185, 11, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={16} color="#F0B90B" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>我的 IDO 认购</div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>查看我的认购记录 / 释放进度</div>
        </div>
        <ChevronRight size={16} color="#7B89B8" />
      </a>
    </div>
  );
}
