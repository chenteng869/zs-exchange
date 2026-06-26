'use client';
import { useState } from 'react';
import {
  Rocket, ChevronRight, Calendar, TrendingUp, Filter, Search, Award, BarChart3,
} from 'lucide-react';
import { getIdoProjects } from '@/lib/h5-mock';

const CATEGORIES = ['全部', '元宇宙', 'Layer2', 'AI', 'GameFi', 'DePIN', 'RWA'];

export default function H5IdoProjectsPage() {
  const [cat, setCat] = useState('全部');
  const projects = getIdoProjects();
  const filtered = cat === '全部' ? projects : projects.filter(p => p.category === cat);

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'ended' || p.status === 'soldout').length,
    avgRoi: '+186%',
    successRate: '94%',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <BarChart3 size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>项目库</span>
      </div>

      {/* 平台数据 */}
      <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Award size={14} color="#FCD535" />
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>ZS Launchpad 平台数据</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>已上项目</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.total}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>已结束</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.completed}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>平均收益</div><div style={{ fontSize: 16, fontWeight: 800, color: '#34D399', marginTop: 2 }}>{stats.avgRoi}</div></div>
          <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)' }}>成功率</div><div style={{ fontSize: 16, fontWeight: 800, color: '#FCD535', marginTop: 2 }}>{stats.successRate}</div></div>
        </div>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', marginBottom: 10 }}>
        <Search size={12} color="#7B89B8" />
        <input placeholder="搜索项目名称/代码" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        <Filter size={12} color="#7B89B8" />
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: cat === c ? '#F0B90B' : 'rgba(148, 163, 184, 0.20)', background: cat === c ? 'rgba(240, 185, 11, 0.15)' : 'transparent', color: cat === c ? '#FCD535' : '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 项目网格 2 列 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {filtered.map(p => (
          <a key={p.id} href={`/h5/ido/detail/${p.id}`} style={{ display: 'block', padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, textDecoration: 'none' }}>
            <div style={{ width: '100%', aspectRatio: '1.5', borderRadius: 10, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#0F1B3D', marginBottom: 8 }}>{p.logo}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 6 }}>{p.symbol} · {p.category}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>价格</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD535' }}>{p.price}</div>
              </div>
              <div style={{ padding: '2px 6px', borderRadius: 4, background: p.status === 'live' ? 'rgba(52, 211, 153, 0.15)' : p.status === 'upcoming' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)', color: p.status === 'live' ? '#34D399' : p.status === 'upcoming' ? '#38BDF8' : '#7B89B8', fontSize: 9, fontWeight: 700 }}>
                {p.status === 'live' ? '认购中' : p.status === 'upcoming' ? '即将开始' : p.status === 'ended' ? '已结束' : '已售罄'}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
