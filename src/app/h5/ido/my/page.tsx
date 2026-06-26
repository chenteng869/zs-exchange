'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Rocket, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Award, Calendar, Coins,
} from 'lucide-react';
import { getIdoProjects } from '@/lib/h5-mock';

const STATUS_MAP = {
  pending:   { label: '待开始',  color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  active:    { label: '认购中',  color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)' },
  success:   { label: '已中签',  color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  failed:    { label: '未中签',  color: '#7B89B8', bg: 'rgba(148, 163, 184, 0.15)' },
  released:  { label: '已释放',  color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
};

export default function H5IdoMyPage() {
  const [tab, setTab] = useState<'all' | 'active' | 'success' | 'released'>('all');
  const projects = getIdoProjects();
  // 模拟我的认购记录
  const records = projects.slice(0, 4).map((p, i) => ({
    id: `MY-IDO-${i + 1}`,
    project: p,
    tier: p.tiers[i % p.tiers.length],
    invested: ['500', '1000', '300', '5000'][i],
    allocated: ['500', '1000', '300', '5000'][i],
    tokens: ['22727', '2500', '375', '4166'][i],
    received: ['5681', '500', '0', '0'][i],
    status: ['active', 'success', 'success', 'released'][i] as 'active' | 'success' | 'released' | 'failed' | 'pending',
    date: ['2026-06-22', '2026-06-20', '2026-06-15', '2026-06-05'][i],
  }));

  const stats = {
    invested: '$6,800',
    allocated: '$6,800',
    received: '$1,820',
    pending: '$4,980',
    count: records.length,
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Rocket size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>我的认购</span>
        <Link
          href="/h5/ido/vesting"
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 10px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(167,139,250,0.20), rgba(244,114,182,0.10))',
            border: '1px solid rgba(167,139,250,0.40)',
            color: '#A78BFA', fontSize: 11, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <Calendar size={11} /> 释放时间表
        </Link>
      </div>

      {/* 统计大卡 */}
      <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>累计认购</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{stats.invested}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>已释放价值</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{stats.received}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>认购项目</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.count}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>待释放</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.pending}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>中签率</div><div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginTop: 2 }}>75%</div></div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'all', label: '全部' },
          { v: 'active', label: '认购中' },
          { v: 'success', label: '已中签' },
          { v: 'released', label: '已释放' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'all' | 'active' | 'success' | 'released')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {records.filter(r => tab === 'all' || r.status === tab).map(r => {
          const s = STATUS_MAP[r.status];
          return (
            <div key={r.id} style={{ padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#0F1B3D' }}>{r.project.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{r.project.name}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: s.bg, color: s.color, fontWeight: 700 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{r.tier.name}档 · {r.date}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 10, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 8 }}>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>认购</div><div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>${r.invested}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>获配</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FCD535', marginTop: 2 }}>{r.tokens} {r.project.symbol}</div></div>
                <div><div style={{ fontSize: 9, color: '#7B89B8' }}>已释放</div><div style={{ fontSize: 12, fontWeight: 700, color: '#34D399', marginTop: 2 }}>{r.received}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
