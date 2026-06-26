'use client';
/**
 * H5 跟单交易 v1
 *  - Hero：我的跟单统计 + 收益曲线
 *  - 3 个分类 tab：推荐大师 / 我的跟单 / 我的跟随者
 *  - 6 位大师榜：头像/称号/收益/夏普/胜率/跟随人数/跟单按钮
 *  - 当前跟单仓位
 *  - 跟单历史
 *  - 风险提示
 */
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Users, Crown, Star, TrendingUp, ChevronRight,
  ShieldAlert, Filter, Sparkles, Copy, BadgeCheck, ChevronUp,
  ChevronDown, Zap, Heart, MoreHorizontal,
} from 'lucide-react';

const MY_STATS = [
  { label: '累计收益',   val: '+38.6%',  color: '#34D399' },
  { label: '跟随大师',   val: '5',       color: '#FCD535' },
  { label: '本月收益',   val: '+8.2%',   color: '#38BDF8' },
  { label: '最大回撤',   val: '-5.4%',   color: '#F472B6' },
];

const TABS = [
  { key: 'rec',  label: '推荐大师',  icon: Crown },
  { key: 'mine', label: '我的跟单',  icon: Copy },
  { key: 'fol',  label: '我的跟随者', icon: Users },
];

const TRADERS = [
  { id: 't1', rank: 1, name: 'K神 · 量化王',  tag: '趋势大师',  ytd: '+186%', m30: '+24%', sharpe: '3.24', win: 72, copy: 12480, aum: '2.4M', color: '#F0B90B', verified: true, badge: '🏆 季度冠军' },
  { id: 't2', rank: 2, name: 'AlphaHunter',  tag: '套利专家',  ytd: '+148%', m30: '+19%', sharpe: '2.86', win: 68, copy: 8920,  aum: '1.8M', color: '#A78BFA', verified: true, badge: '⭐ 热门' },
  { id: 't3', rank: 3, name: '小雅 AI Lab',  tag: 'AI 量化',    ytd: '+218%', m30: '+32%', sharpe: '3.68', win: 70, copy: 15240, aum: '3.2M', color: '#F472B6', verified: true, badge: '🤖 AI 引擎' },
  { id: 't4', rank: 4, name: 'ETH 之光',     tag: '稳健型',    ytd: '+92%',  m30: '+11%', sharpe: '2.18', win: 78, copy: 5680,  aum: '920K', color: '#34D399', verified: true, badge: '🛡️ 低回撤' },
  { id: 't5', rank: 5, name: 'DeFi 矿工',   tag: '挖矿型',    ytd: '+76%',  m30: '+8%',  sharpe: '1.92', win: 84, copy: 4280,  aum: '760K', color: '#22D3EE', verified: false, badge: '💎 稳定' },
  { id: 't6', rank: 6, name: 'MEME 之王',   tag: '高Beta',    ytd: '+318%', m30: '+58%', sharpe: '2.42', win: 58, copy: 18920, aum: '1.2M', color: '#FB923C', verified: true, badge: '🚀 激进' },
];

// 7 日收益曲线
const EQUITY = [100, 102, 104, 103, 106, 108, 110, 112, 114, 116, 118, 121, 124, 126, 128, 130, 132, 134, 138.6];

const MY_COPIES = [
  { trader: 'K神 · 量化王',  amt: '500 USDT', ytd: '+42.8%', status: '跟随中', color: '#F0B90B', since: '32 天' },
  { trader: 'AlphaHunter',  amt: '300 USDT', ytd: '+28.4%', status: '跟随中', color: '#A78BFA', since: '18 天' },
  { trader: 'ETH 之光',     amt: '200 USDT', ytd: '+15.2%', status: '跟随中', color: '#34D399', since: '52 天' },
];

const COPY_HISTORY = [
  { time: '06-23 14:32', trader: 'K神 · 量化王',  action: '跟单',  pair: 'BTC/USDT',  amt: '500',  pnl: '+186',  win: true },
  { time: '06-22 09:18', trader: 'AlphaHunter',  action: '跟单',  pair: 'ETH/USDT',  amt: '300',  pnl: '+72',   win: true },
  { time: '06-21 16:42', trader: 'ETH 之光',     action: '止盈',  pair: 'SOL/USDT',  amt: '200',  pnl: '+124',  win: true },
  { time: '06-20 11:15', trader: 'K神 · 量化王',  action: '止损',  pair: 'INJ/USDT',  amt: '100',  pnl: '-32',   win: false },
  { time: '06-19 20:08', trader: 'AlphaHunter',  action: '跟单',  pair: 'OP/USDT',   amt: '150',  pnl: '+18',   win: true },
];

export default function H5TradeCopyPage() {
  const [tab, setTab] = useState('rec');

  // 7 日收益折线 SVG
  const W = 320, H = 60, pad = 4;
  const minY = Math.min(...EQUITY);
  const maxY = Math.max(...EQUITY);
  const sx = (i: number) => pad + (i * (W - pad * 2)) / (EQUITY.length - 1);
  const sy = (v: number) => H - pad - ((v - minY) / (maxY - minY)) * (H - pad * 2);
  const path = EQUITY.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  const fill = `${path} L ${sx(EQUITY.length - 1).toFixed(1)} ${H - pad} L ${sx(0).toFixed(1)} ${H - pad} Z`;

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
        <Link href="/h5/trade" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7B89B8', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 12 }}>返回</span>
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>跟单交易</div>
        <Filter size={16} color="#7B89B8" style={{ cursor: 'pointer' }} />
        <MoreHorizontal size={16} color="#7B89B8" style={{ cursor: 'pointer' }} />
      </div>

      {/* Hero 我的统计 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #831843 100%)',
          borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,185,11,0.50) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #F0B90B, #FCD535)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(240,185,11,0.50)' }}>
              <Crown size={18} color="#0F1B3D" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>我的跟单</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, color: '#F0B90B', fontWeight: 800 }}>+38.6%</span>
                <span style={{ fontSize: 10, color: '#34D399' }}>↗ 7 日</span>
              </div>
            </div>
          </div>
          {/* 收益曲线 */}
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60, marginBottom: 8 }}>
            <defs>
              <linearGradient id="cfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#F0B90B" stopOpacity="0.50" />
                <stop offset="100%" stopColor="#F0B90B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fill} fill="url(#cfill)" />
            <path d={path} fill="none" stroke="#F0B90B" strokeWidth="1.5" />
            {EQUITY.map((v, i) => (
              <circle key={i} cx={sx(i)} cy={sy(v)} r="2" fill="#FCD535" />
            ))}
          </svg>
          {/* 4 项统计 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {MY_STATS.map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '0 4px' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, fontSize: 12, padding: '8px 0', borderRadius: 12, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: active ? 'rgba(240,185,11,0.20)' : 'rgba(26,36,86,0.50)',
                border: active ? '1px solid rgba(240,185,11,0.40)' : '1px solid rgba(148,163,184,0.10)',
                color: active ? '#F0B90B' : '#7B89B8',
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 推荐大师列表 */}
      {tab === 'rec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 顶部筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px', overflowX: 'auto' }}>
            {['全部', '趋势', '套利', 'AI 量化', 'DeFi', 'MEME'].map((f, i) => (
              <span
                key={f}
                style={{
                  fontSize: 10, padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                  background: i === 0 ? 'rgba(240,185,11,0.20)' : 'rgba(26,36,86,0.50)',
                  border: i === 0 ? '1px solid rgba(240,185,11,0.40)' : '1px solid rgba(148,163,184,0.10)',
                  color: i === 0 ? '#F0B90B' : '#7B89B8',
                  fontWeight: i === 0 ? 700 : 500,
                }}
              >
                {f}
              </span>
            ))}
          </div>

          {TRADERS.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14, padding: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `linear-gradient(135deg, ${t.color}, ${t.color}80)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${t.color}50`,
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#0F1B3D', fontWeight: 800 }}>{t.name.charAt(0)}</span>
                  {t.rank <= 3 && (
                    <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: t.rank === 1 ? '#FCD535' : t.rank === 2 ? '#C0C0C0' : '#CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={8} color="#0F1B3D" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 800 }}>{t.name}</span>
                    {t.verified && <BadgeCheck size={12} color="#38BDF8" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: `${t.color}25`, color: t.color, fontWeight: 700 }}>{t.tag}</span>
                    <span style={{ fontSize: 9, color: '#7B89B8' }}>{t.badge}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>{t.ytd}</div>
                  <div style={{ fontSize: 9, color: '#7B89B8' }}>年化</div>
                </div>
              </div>
              {/* 4 项指标 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 10, marginBottom: 10 }}>
                <div><span style={{ color: '#7B89B8' }}>夏普</span> <span style={{ color: '#FCD535', fontWeight: 700, marginLeft: 4 }}>{t.sharpe}</span></div>
                <div><span style={{ color: '#7B89B8' }}>胜率</span> <span style={{ color: '#38BDF8', fontWeight: 700, marginLeft: 4 }}>{t.win}%</span></div>
                <div><span style={{ color: '#7B89B8' }}>规模</span> <span style={{ color: '#A78BFA', fontWeight: 700, marginLeft: 4 }}>{t.aum}</span></div>
                <div><span style={{ color: '#7B89B8' }}>30日</span> <span style={{ color: '#34D399', fontWeight: 700, marginLeft: 4 }}>{t.m30}</span></div>
              </div>
              {/* 跟单 + 详情 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                <Users size={11} color="#7B89B8" />
                <span style={{ fontSize: 10, color: '#7B89B8' }}>{t.copy.toLocaleString()} 人跟随</span>
                <Link
                  href="#"
                  style={{
                    marginLeft: 'auto', padding: '4px 10px', borderRadius: 8,
                    background: 'rgba(148,163,184,0.10)', color: '#B4C0E0',
                    fontSize: 10, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  详情
                </Link>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 12px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #F0B90B, #FCD535)', color: '#0F1B3D',
                    fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                  }}
                >
                  <Copy size={10} color="#0F1B3D" /> 跟单
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 我的跟单 */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MY_COPIES.map((m, i) => (
            <div
              key={i}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14, padding: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${m.color}, ${m.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={16} color="#0F1B3D" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{m.trader}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>跟随 {m.since} · {m.amt}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, color: '#34D399', fontWeight: 800 }}>{m.ytd}</div>
                  <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.20)', color: '#34D399' }}>{m.status}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                <Link
                  href="#"
                  style={{
                    flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8,
                    background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.25)',
                    color: '#38BDF8', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  调整仓位
                </Link>
                <button
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8,
                    background: 'rgba(244,114,182,0.10)', border: '1px solid rgba(244,114,182,0.25)',
                    color: '#F472B6', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  停止跟单
                </button>
              </div>
            </div>
          ))}

          {/* 跟单历史 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="#FCD535" /> 跟单历史
            </div>
            {COPY_HISTORY.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: h.win ? 'rgba(52,211,153,0.20)' : 'rgba(244,114,182,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {h.win
                    ? <ChevronUp size={14} color="#34D399" />
                    : <ChevronDown size={14} color="#F472B6" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>{h.trader}</div>
                  <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 1 }}>{h.time} · {h.action} {h.pair} · {h.amt}U</div>
                </div>
                <div style={{ fontSize: 12, color: h.win ? '#34D399' : '#F472B6', fontWeight: 700 }}>
                  {h.win ? '+' : ''}{h.pnl}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 我的跟随者 */}
      {tab === 'fol' && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 14, padding: 24, textAlign: 'center',
          }}
        >
          <Users size={48} color="#7B89B8" style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 4 }}>暂未成为大师</div>
          <div style={{ fontSize: 11, color: '#7B89B8', lineHeight: 1.6, marginBottom: 12 }}>
            申请成为带单大师<br />
            分享你的交易信号获得分润
          </div>
          <Link
            href="#"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #F0B90B, #FCD535)', color: '#0F1B3D',
              fontSize: 12, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(240,185,11,0.40)',
            }}
          >
            <Zap size={12} color="#0F1B3D" /> 申请成为大师
          </Link>
        </div>
      )}

      {/* 风险提示 */}
      <div
        style={{
          background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.20)',
          borderRadius: 12, padding: 12, marginTop: 14,
        }}
      >
        <div style={{ fontSize: 12, color: '#F472B6', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShieldAlert size={12} /> 跟单风险
        </div>
        <div style={{ fontSize: 10, color: '#B4C0E0', lineHeight: 1.6 }}>
          跟单交易有市场风险，大师过往业绩不代表未来表现。平台收取 10% 收益分成，请根据自身风险承受能力合理配置。
        </div>
      </div>
    </div>
  );
}
