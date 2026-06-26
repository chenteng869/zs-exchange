'use client';
/** H5 AI 量化分析 - 策略广场 + 业绩曲线 */
import Link from 'next/link';
import { LineChart, TrendingUp, Users, ChevronRight, Filter, Crown, Star } from 'lucide-react';

const STRATEGIES = [
  { rank: 1, name: 'BTC 趋势跟踪 v3.2',  author: 'QuantLab Pro',  ytd: '+182%', m30: '+24%', sharpe: '2.84', mdd: '-8.5%',  users: 5842, color: '#F0B90B', tag: '热门',   win: '71' },
  { rank: 2, name: 'ETH 均值回归 α',     author: 'AlphaSeeker',   ytd: '+138%', m30: '+18%', sharpe: '2.21', mdd: '-12.3%', users: 3217, color: '#A78BFA', tag: '稳健',   win: '64' },
  { rank: 3, name: 'AI 选币 Top10',      author: 'ZS-AI 引擎',     ytd: '+218%', m30: '+32%', sharpe: '3.12', mdd: '-18.2%', users: 7894, color: '#F472B6', tag: 'AI',     win: '68' },
  { rank: 4, name: 'SOL 网格套利',       author: 'GridMaster',     ytd: '+96%',  m30: '+11%', sharpe: '1.92', mdd: '-6.8%',  users: 2156, color: '#22D3EE', tag: '低回撤', win: '82' },
  { rank: 5, name: 'DeFi 流动性挖矿',    author: 'YieldHunter',    ytd: '+74%',  m30: '+8%',  sharpe: '1.68', mdd: '-4.2%',  users: 1685, color: '#34D399', tag: '稳定',   win: '89' },
  { rank: 6, name: '山寨币轮动策略',     author: 'AltRotator',     ytd: '+156%', m30: '+22%', sharpe: '2.45', mdd: '-22.1%', users: 2954, color: '#FB923C', tag: '激进',   win: '58' },
];

export default function H5AIQuantPage() {
  return (
    <div style={{ padding: '12px 0' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(240,185,11,0.20) 0%, rgba(252,213,53,0.05) 100%)',
          border: '1px solid rgba(240,185,11,0.30)',
          borderRadius: 16,
          padding: 16, marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #F0B90B, #FCD535)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(240,185,11,0.4)' }}>
            <LineChart size={20} color="#0F1B3D" />
          </div>
          <div>
            <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 量化策略广场</div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>策略 · 回测 · 一键跟单</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: '在售策略', value: '186',  color: '#F0B90B' },
            { label: '累计跟单', value: '28,640', color: '#34D399' },
            { label: '本年最高', value: '+218%', color: '#F472B6' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: s.color, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
        <Filter size={12} color="#7B89B8" />
        {['全部', '热门', '稳健', 'AI', '低回撤'].map((t, i) => (
          <span
            key={t}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 10, cursor: 'pointer',
              background: i === 0 ? 'rgba(240,185,11,0.20)' : 'rgba(26,36,86,0.50)',
              border: i === 0 ? '1px solid rgba(240,185,11,0.40)' : '1px solid rgba(148,163,184,0.10)',
              color: i === 0 ? '#FCD535' : '#7B89B8',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* 策略列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STRATEGIES.map((s) => (
          <Link
            key={s.rank}
            href={`/h5/ai/quant/strategy/${s.rank}`}
            style={{
              display: 'block',
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 14,
              padding: 14,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.rank === 1 ? 'linear-gradient(135deg, #FCD535, #F0B90B)' :
                              s.rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #888)' :
                              s.rank === 3 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
                              `${s.color}25`,
                  color: s.rank <= 3 ? '#0F1B3D' : s.color,
                }}
              >
                {s.rank <= 3 ? <Crown size={14} color="#0F1B3D" /> : s.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{s.name}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${s.color}25`, color: s.color, fontWeight: 700 }}>{s.tag}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>by {s.author}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>{s.ytd}</div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>年化</div>
              </div>
            </div>
            {/* 迷你 sparkline */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 30, marginBottom: 8 }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const h = 8 + Math.abs(Math.sin(i * 0.6 + s.rank)) * 22 + (s.rank === 1 ? 4 : 0);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: h, borderRadius: 2,
                      background: `linear-gradient(180deg, ${s.color} 0%, ${s.color}40 100%)`,
                    }}
                  />
                );
              })}
            </div>
            {/* 指标 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 10 }}>
              <div><span style={{ color: '#7B89B8' }}>30日</span> <span style={{ color: '#34D399', fontWeight: 700, marginLeft: 4 }}>{s.m30}</span></div>
              <div><span style={{ color: '#7B89B8' }}>夏普</span> <span style={{ color: '#FCD535', fontWeight: 700, marginLeft: 4 }}>{s.sharpe}</span></div>
              <div><span style={{ color: '#7B89B8' }}>回撤</span> <span style={{ color: '#F472B6', fontWeight: 700, marginLeft: 4 }}>{s.mdd}</span></div>
              <div><span style={{ color: '#7B89B8' }}>胜率</span> <span style={{ color: '#38BDF8', fontWeight: 700, marginLeft: 4 }}>{s.win}%</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              <Users size={11} color="#7B89B8" />
              <span style={{ fontSize: 10, color: '#7B89B8' }}>{s.users.toLocaleString()} 人跟单</span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #F0B90B, #FCD535)', color: '#0F1B3D', fontSize: 11, fontWeight: 700 }}>
                <Star size={10} color="#0F1B3D" /> 跟单
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
