'use client';
/**
 * H5 IDO 释放时间表 v1
 *  - Hero：总认购 / 已释放 / 待释放 / 下一个解锁倒计时
 *  - 4 个分类 tab：可领 / 进行中 / 即将解锁 / 已完成
 *  - 项目卡片：项目名 + 释放进度条 + 解锁时间表
 *  - 时间轴：横向里程碑 TGE / Cliff / 线性释放
 *  - 一键领取按钮
 *  - 释放规则说明
 */
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Calendar, Clock, Sparkles, Rocket, Gift, ChevronRight,
  CheckCircle2, Circle, Lock, Unlock, Coins, TrendingUp, Zap,
  ChevronDown, ChevronUp, Bell,
} from 'lucide-react';

const MY_STATS = [
  { label: '总认购额',   val: '6,800 USDT', color: '#F0B90B' },
  { label: '已释放',     val: '5,068',      sub: '¥价值 ¥68,420', color: '#34D399' },
  { label: '待释放',     val: '21,580',     sub: '预计 ¥292,360', color: '#38BDF8' },
  { label: '下一解锁',   val: '3天 14时',   sub: '07-01 12:00',    color: '#A78BFA' },
];

const TABS = [
  { key: 'avail',   label: '可领取',     count: 1 },
  { key: 'active',  label: '释放中',     count: 4 },
  { key: 'soon',    label: '即将解锁',   count: 2 },
  { key: 'done',    label: '已完成',     count: 1 },
];

const PROJECTS = [
  {
    id: 'P001', name: 'ZS Chain',     sym: 'ZSC',  logo: '⛓️',
    invested: 1000, tokens: 41666, claimed: 4166,  pending: 37500,
    progress: 10, nextUnlock: '3 天后', nextAmount: 4166, color: '#F0B90B',
    cliff: 'TGE 0%', start: '已 Cliff', status: 'active', nextPct: 10,
    schedule: [
      { time: '06-05 12:00', event: 'TGE 解锁',     pct: 10, amt: 4166,  done: true },
      { time: '07-05 12:00', event: '第一次释放',   pct: 10, amt: 4166,  done: false, next: true },
      { time: '08-05 12:00', event: '第二次释放',   pct: 10, amt: 4166,  done: false },
      { time: '09-05 12:00', event: '第三次释放',   pct: 10, amt: 4166,  done: false },
      { time: '10-05 12:00', event: '第四次释放',   pct: 10, amt: 4166,  done: false },
      { time: '12-05 12:00', event: '完全解锁',     pct: 50, amt: 20834, done: false, final: true },
    ],
  },
  {
    id: 'P002', name: 'MetaWorld',   sym: 'MW',   logo: '🌐',
    invested: 500,  tokens: 22727, claimed: 11363, pending: 11364,
    progress: 50, nextUnlock: '14 天后', nextAmount: 11364, color: '#A78BFA',
    cliff: 'TGE 25%', start: '已 Cliff', status: 'active', nextPct: 50,
    schedule: [
      { time: '06-10 12:00', event: 'TGE 解锁',     pct: 25, amt: 5681,  done: true },
      { time: '06-25 12:00', event: '第一次释放',   pct: 25, amt: 5681,  done: true },
      { time: '07-10 12:00', event: '第二次释放',   pct: 25, amt: 5681,  done: false, next: true },
      { time: '08-10 12:00', event: '完全解锁',     pct: 25, amt: 5684,  done: false, final: true },
    ],
  },
  {
    id: 'P003', name: 'GameVerse',   sym: 'GVR',  logo: '🎮',
    invested: 300,  tokens: 3750,  claimed: 375,   pending: 3375,
    progress: 10, nextUnlock: '7 天后', nextAmount: 375, color: '#F472B6',
    cliff: 'TGE 10%', start: '已 Cliff', status: 'active', nextPct: 10,
    schedule: [
      { time: '06-15 12:00', event: 'TGE 解锁',     pct: 10, amt: 375,   done: true },
      { time: '06-30 12:00', event: '第一次释放',   pct: 10, amt: 375,   done: false, next: true },
      { time: '07-15 12:00', event: '第二次释放',   pct: 10, amt: 375,   done: false },
      { time: '08-15 12:00', event: '完全解锁',     pct: 70, amt: 2625,  done: false, final: true },
    ],
  },
  {
    id: 'P004', name: 'DeBank Pro',  sym: 'DBP',  logo: '🏦',
    invested: 5000, tokens: 25000, claimed: 25000, pending: 0,
    progress: 100, nextUnlock: '已完成', nextAmount: 0, color: '#34D399',
    cliff: 'TGE 100%', start: '已 Cliff', status: 'done', nextPct: 0,
    schedule: [
      { time: '05-20 12:00', event: 'TGE 100% 解锁', pct: 100, amt: 25000, done: true, final: true },
    ],
  },
  {
    id: 'P005', name: 'ZK Rollup',   sym: 'ZKR',  logo: '🔒',
    invested: 0, tokens: 8000, claimed: 0, pending: 8000,
    progress: 0, nextUnlock: '5 天后开始', nextAmount: 0, color: '#22D3EE',
    cliff: 'TGE 0%', start: 'TGE 06-29', status: 'soon', nextPct: 0,
    schedule: [
      { time: '06-29 12:00', event: 'TGE Cliff 结束', pct: 0,  amt: 0,     done: false, next: true },
      { time: '07-29 12:00', event: '第一次释放',     pct: 25, amt: 2000,  done: false },
      { time: '08-29 12:00', event: '第二次释放',     pct: 25, amt: 2000,  done: false },
      { time: '10-29 12:00', event: '完全解锁',       pct: 50, amt: 4000,  done: false, final: true },
    ],
  },
];

export default function H5IdoVestingPage() {
  const [tab, setTab] = useState('active');
  const [expanded, setExpanded] = useState<string | null>('P001');

  const filtered = useMemo(() => {
    return PROJECTS.filter((p) => {
      if (tab === 'avail')  return p.progress > 0 && p.progress < 100 && p.schedule.some((s) => s.next);
      if (tab === 'active') return p.status === 'active' && p.progress < 100;
      if (tab === 'soon')   return p.status === 'soon' || p.schedule[0]?.next;
      if (tab === 'done')   return p.status === 'done' || p.progress >= 100;
      return true;
    });
  }, [tab]);

  const totalAvail = PROJECTS.reduce((s, p) => s + (p.schedule.find((x) => x.next)?.amt || 0), 0);
  const totalClaimed = PROJECTS.reduce((s, p) => s + p.claimed, 0);
  const totalPending = PROJECTS.reduce((s, p) => s + p.pending, 0);
  const totalTokens = PROJECTS.reduce((s, p) => s + p.tokens, 0);
  const overallPct = Math.round((totalClaimed / totalTokens) * 100);

  return (
    <div style={{ padding: '12px 0', paddingBottom: 90 }}>
      {/* 顶部导航 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 10,
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(15,27,61,0.85)', backdropFilter: 'blur(12px)', borderRadius: 10,
        }}
      >
        <Link href="/h5/ido/my" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7B89B8', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 12 }}>返回</span>
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>释放时间表</div>
        <Bell size={16} color="#7B89B8" style={{ cursor: 'pointer' }} />
      </div>

      {/* Hero 总览 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.20) 0%, rgba(76,29,149,0.08) 100%)',
          border: '1px solid rgba(167,139,250,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.40) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #A78BFA, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(167,139,250,0.50)' }}>
              <Calendar size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>整体释放进度</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, color: '#A78BFA', fontWeight: 800 }}>{overallPct}%</span>
                <span style={{ fontSize: 10, color: '#7B89B8' }}>已解锁 {totalClaimed.toLocaleString()} / {totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {/* 进度条 */}
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ width: `${overallPct}%`, height: '100%', background: 'linear-gradient(90deg, #A78BFA 0%, #F472B6 100%)', transition: 'width 0.6s' }} />
          </div>
          {/* 4 项统计 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {MY_STATS.map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 一键领取（若有） */}
      {totalAvail > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(240,185,11,0.20) 0%, rgba(252,213,53,0.05) 100%)',
            border: '1px solid rgba(240,185,11,0.40)',
            borderRadius: 10,
          }}
        >
          <Gift size={16} color="#F0B90B" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>有 {totalAvail.toLocaleString()} 代币可领取</div>
            <div style={{ fontSize: 9, color: '#7B89B8' }}>点击右下方按钮一键领取</div>
          </div>
          <Link
            href="#"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '6px 12px', borderRadius: 8,
              background: 'linear-gradient(135deg, #F0B90B, #FCD535)', color: '#0F1B3D',
              fontSize: 11, fontWeight: 800, textDecoration: 'none',
            }}
          >
            <Zap size={11} color="#0F1B3D" /> 领取
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, padding: '0 4px' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                background: active ? 'rgba(167,139,250,0.20)' : 'transparent',
                border: active ? '1px solid rgba(167,139,250,0.40)' : '1px solid transparent',
                color: active ? '#A78BFA' : '#7B89B8',
                fontWeight: active ? 700 : 500,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {t.label}
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: active ? 'rgba(167,139,250,0.30)' : 'rgba(148,163,184,0.15)' }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* 项目卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((p) => {
          const open = expanded === p.id;
          const nextItem = p.schedule.find((s) => s.next);
          return (
            <div
              key={p.id}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14, overflow: 'hidden',
              }}
            >
              <div
                onClick={() => setExpanded(open ? null : p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}80)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    boxShadow: `0 4px 12px ${p.color}50`,
                  }}
                >
                  {p.logo}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 800 }}>{p.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(148,163,184,0.15)', color: '#B4C0E0' }}>{p.sym}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>总认购 {p.invested} USDT · {p.tokens.toLocaleString()} {p.sym}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: p.color, fontWeight: 800 }}>{p.progress}%</div>
                  <div style={{ fontSize: 9, color: '#7B89B8' }}>{p.cliff}</div>
                </div>
                {open ? <ChevronUp size={14} color="#7B89B8" /> : <ChevronDown size={14} color="#7B89B8" />}
              </div>

              {/* 进度条 */}
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: `linear-gradient(90deg, ${p.color} 0%, ${p.color}80 100%)` }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
                  <span style={{ color: '#7B89B8' }}>已领 {p.claimed.toLocaleString()}</span>
                  <span style={{ color: '#7B89B8' }}>待领 {p.pending.toLocaleString()}</span>
                </div>
              </div>

              {/* 展开的时间轴 */}
              {open && (
                <div style={{ padding: '0 12px 12px' }}>
                  {/* 下一解锁卡片 */}
                  {nextItem && (
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${p.color}25 0%, ${p.color}05 100%)`,
                        border: `1px solid ${p.color}50`,
                        borderRadius: 10, padding: 10, marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Unlock size={12} color={p.color} />
                        <span style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>下一解锁</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>{p.nextUnlock}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 800 }}>{nextItem.amt.toLocaleString()}</span>
                        <span style={{ fontSize: 10, color: '#7B89B8' }}>{p.sym} · 占总量 {nextItem.pct}%</span>
                      </div>
                    </div>
                  )}

                  {/* 时间轴 */}
                  <div style={{ position: 'relative', paddingLeft: 20 }}>
                    {/* 竖线 */}
                    <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'rgba(148,163,184,0.15)' }} />
                    {p.schedule.map((s, i) => {
                      const isDone = s.done;
                      const isNext = s.next;
                      const isFinal = s.final;
                      return (
                        <div key={i} style={{ position: 'relative', paddingBottom: i < p.schedule.length - 1 ? 12 : 0 }}>
                          <div
                            style={{
                              position: 'absolute', left: -16, top: 2,
                              width: 18, height: 18, borderRadius: '50%',
                              background: isDone ? `${p.color}30` : isNext ? `linear-gradient(135deg, ${p.color}, ${p.color}80)` : 'rgba(148,163,184,0.15)',
                              border: isNext ? `2px solid ${p.color}` : '1px solid rgba(148,163,184,0.20)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isNext ? `0 0 8px ${p.color}80` : 'none',
                            }}
                          >
                            {isDone
                              ? <CheckCircle2 size={10} color={p.color} />
                              : isNext
                                ? <Unlock size={10} color="#fff" />
                                : <Lock size={10} color="#7B89B8" />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: isDone ? '#7B89B8' : isNext ? p.color : '#F8FAFC', fontWeight: isNext ? 700 : 500, textDecoration: isDone ? 'line-through' : 'none' }}>{s.event}</span>
                            {isFinal && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(167,139,250,0.20)', color: '#A78BFA' }}>终</span>}
                            {isNext && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: `${p.color}30`, color: p.color, fontWeight: 700 }}>即将</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#7B89B8' }}>
                            <Clock size={9} />
                            <span>{s.time}</span>
                            <span style={{ color: isDone ? p.color : '#7B89B8', fontWeight: isNext ? 700 : 500 }}>· {s.pct}% ({s.amt.toLocaleString()})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 释放规则说明 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12, padding: 12, marginTop: 14,
        }}
      >
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={12} color="#FCD535" /> 释放规则
        </div>
        {[
          { i: 1, t: 'TGE 解锁',   d: '上线即解锁 10-25% 初始流通量' },
          { i: 2, t: 'Cliff 期',    d: '锁仓期 0-90 天，期间不释放' },
          { i: 3, t: '线性释放',    d: '按月等比释放，1-2 年内完全解锁' },
          { i: 4, t: '到期归零',    d: '完全解锁后无需再操作' },
        ].map((r) => (
          <div key={r.i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(56,189,248,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#38BDF8', fontWeight: 800, flexShrink: 0 }}>{r.i}</div>
            <div>
              <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>{r.t}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 1, lineHeight: 1.4 }}>{r.d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
