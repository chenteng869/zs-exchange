'use client';
/**
 * IDO 模块首页 - 新币发射台
 */
import Link from 'next/link';
import {
  Rocket, Flame, Clock, Star, ChevronRight, TrendingUp, Users, Calendar, Award, Target,
} from 'lucide-react';
import { getIDOProjects } from '@/lib/h5-mock';

export default function H5IdoHomePage() {
  const projects = getIDOProjects();
  const ongoing = projects.filter(p => p.status === 'ongoing');
  const upcoming = projects.filter(p => p.status === 'upcoming');
  const totalRaise = projects.reduce((s, p) => s + parseInt(p.raise.replace(/,/g, '') || '0'), 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(217, 119, 6, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Rocket size={18} color="#FCD535" />
            <span style={{ fontSize: 14, color: '#FDE68A', fontWeight: 600 }}>LaunchPad 新币发射</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(252, 213, 53, 0.25)', color: '#FCD535', fontWeight: 700 }}>🔥 HOT</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 12 }}>已上线项目 · 累计募集</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{projects.length}</div>
              <div style={{ fontSize: 10, color: '#FDE68A' }}>项目</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>${totalRaise.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#FDE68A' }}>募集额</div>
            </div>
          </div>
        </div>
      </div>

      {/* 子入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: Rocket,    label: 'IDO 列表',     color: '#F0B90B', href: '/h5/ido/list' },
          { icon: Target,    label: '参与认购',     color: '#A78BFA', href: '/h5/ido/participate' },
          { icon: Award,     label: '我的认购',     color: '#34D399', href: '/h5/ido/my' },
          { icon: TrendingUp,label: '项目进度',     color: '#F472B6', href: '/h5/ido/projects' },
        ].map(e => {
          const Icon = e.icon;
          return (
            <Link key={e.label} href={e.href} style={{ background: `linear-gradient(135deg, ${e.color}20 0%, rgba(21, 34, 74, 0.70) 100%)`, border: `1px solid ${e.color}30`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={e.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>点击进入</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 进行中 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Flame size={12} color="#F472B6" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>认购进行中</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>{ongoing.length} 个项目</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {ongoing.map(p => (
          <Link key={p.id} href={`/h5/ido/detail/${p.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', border: '1px solid rgba(244, 114, 182, 0.20)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.20)', color: '#F472B6', fontWeight: 600 }}>进行中</span>
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{p.symbol} · {p.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(127, 137, 184, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)' }} />
                </div>
                <span style={{ fontSize: 10, color: '#F0B90B', fontWeight: 600 }}>{p.progress}%</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#7B89B8' }}>募集</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FCD535' }}>${p.raise}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 即将开始 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Clock size={12} color="#38BDF8" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>即将开始</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map(p => (
          <Link key={p.id} href={`/h5/ido/detail/${p.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', border: '1px solid rgba(56, 189, 248, 0.20)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{p.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Calendar size={9} />{p.startTime}
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 600, marginTop: 4, display: 'inline-block' }}>即将开始</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
