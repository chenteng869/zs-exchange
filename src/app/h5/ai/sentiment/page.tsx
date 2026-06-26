'use client';
/** H5 AI 情绪分析 - 4 合一：F&G 仪表盘 + 历史曲线 + 多空比 + 舆情云 + AI 实时点评 */
import { useEffect, useState } from 'react';
import { Activity, MessageCircle, TrendingUp, TrendingDown, Sparkles, RefreshCw } from 'lucide-react';

// F&G 等级
function getFGLevel(v: number): { label: string; color: string; bg: string } {
  if (v < 25) return { label: '极度恐惧', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  if (v < 45) return { label: '恐惧',     color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' };
  if (v < 55) return { label: '中性',     color: '#FCD535', bg: 'rgba(252, 213, 53, 0.15)' };
  if (v < 75) return { label: '贪婪',     color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' };
  return { label: '极度贪婪', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
}

const HOT_WORDS = [
  { text: '减半行情',  weight: 28, color: '#F472B6' },
  { text: 'ETF 通过',  weight: 24, color: '#F0B90B' },
  { text: '降息预期',  weight: 22, color: '#38BDF8' },
  { text: 'BTC 突破',  weight: 20, color: '#34D399' },
  { text: 'MEME 轮动', weight: 18, color: '#A78BFA' },
  { text: 'L2 爆发',   weight: 16, color: '#22D3EE' },
  { text: 'AI 板块',   weight: 15, color: '#EC4899' },
  { text: 'RWA',       weight: 14, color: '#FB923C' },
  { text: '链上数据',  weight: 12, color: '#84CC16' },
  { text: '巨鲸增持',  weight: 10, color: '#06B6D4' },
];

const AI_COMMENTS = [
  'BTC 突破 7w 关键位，多空分歧加大。链上巨鲸地址增持 12,580 枚，短线偏多。',
  'SOL 24h 资金净流入 +$2.3 亿，社群讨论热度上升 47%，情绪指标进入贪婪区间。',
  'MEME 板块轮动加速，PEPE/WIF 关注度爆表。注意高位回调风险，建议仓位控制在 30% 以内。',
  '美 CPI 数据低于预期，市场风险偏好回升。AI 量化模型上调 BTC 短期评级至「买入」。',
];

export default function H5AISentimentPage() {
  const [fg, setFg] = useState(68);
  const [longPct, setLongPct] = useState(58);
  const [commentIdx, setCommentIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setFg((v) => Math.max(20, Math.min(90, v + (Math.random() - 0.5) * 4)));
      setLongPct((v) => Math.max(35, Math.min(75, v + (Math.random() - 0.5) * 3)));
      setCommentIdx((i) => (i + 1) % AI_COMMENTS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const lv = getFGLevel(fg);

  return (
    <div style={{ padding: '12px 0' }}>
      {/* ===== 1. Fear & Greed 仪表盘 ===== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(244,114,182,0.20) 0%, rgba(236,72,153,0.05) 100%)',
          border: `1px solid ${lv.color}50`,
          borderRadius: 16,
          padding: 18,
          marginBottom: 14,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
          <Activity size={14} color={lv.color} />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>Fear & Greed 指数</span>
          <RefreshCw size={10} color="#7B89B8" style={{ marginLeft: 6 }} />
        </div>
        {/* 仪表盘 SVG */}
        <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 280 }}>
          <defs>
            <linearGradient id="fgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#EF4444" />
              <stop offset="25%"  stopColor="#F472B6" />
              <stop offset="50%"  stopColor="#FCD535" />
              <stop offset="75%"  stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#fgGrad)" strokeWidth="14" strokeLinecap="round" />
          {/* 指针 */}
          <line
            x1="100" y1="100"
            x2={100 + 60 * Math.cos(Math.PI - (fg / 100) * Math.PI)}
            y2={100 - 60 * Math.sin(Math.PI - (fg / 100) * Math.PI)}
            stroke="#fff" strokeWidth="3" strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="#fff" />
        </svg>
        <div style={{ fontSize: 38, color: lv.color, fontWeight: 800, marginTop: -10 }}>{Math.round(fg)}</div>
        <div style={{ display: 'inline-block', fontSize: 12, padding: '4px 14px', borderRadius: 12, background: lv.bg, color: lv.color, fontWeight: 700, marginTop: 4 }}>
          {lv.label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7B89B8', marginTop: 12, padding: '0 8px' }}>
          <span>0 极度恐惧</span>
          <span>50 中性</span>
          <span>100 极度贪婪</span>
        </div>
      </div>

      {/* ===== 2. 7 日历史曲线 ===== */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 12 }}>7 日历史走势</div>
        <svg viewBox="0 0 320 80" style={{ width: '100%', height: 80 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts = [42, 38, 45, 52, 48, 58, 68];
            const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * 320) / 6} ${80 - v}`).join(' ');
            const area = path + ` L 320 80 L 0 80 Z`;
            return (
              <>
                <path d={area} fill="url(#lineGrad)" />
                <path d={path} fill="none" stroke="#F472B6" strokeWidth="2.5" />
                {pts.map((v, i) => (
                  <circle key={i} cx={(i * 320) / 6} cy={80 - v} r="3" fill="#F472B6" />
                ))}
              </>
            );
          })()}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7B89B8' }}>
          {['6/18', '6/19', '6/20', '6/21', '6/22', '6/23', '6/24'].map((d) => <span key={d}>{d}</span>)}
        </div>
      </div>

      {/* ===== 3. 多空比饼图 ===== */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 12 }}>多空持仓比</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 饼图 */}
          <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, flexShrink: 0 }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="14" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="#34D399" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${(longPct / 100) * 251} 251`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.6s' }}
            />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <TrendingUp size={12} color="#34D399" />
              <span style={{ fontSize: 11, color: '#7B89B8' }}>多头</span>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#34D399', fontWeight: 800 }}>{Math.round(longPct)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingDown size={12} color="#F472B6" />
              <span style={{ fontSize: 11, color: '#7B89B8' }}>空头</span>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#F472B6', fontWeight: 800 }}>{Math.round(100 - longPct)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 4. 舆情热词云 ===== */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <MessageCircle size={12} color="#38BDF8" />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>24h 舆情热词</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          {HOT_WORDS.map((w) => (
            <span
              key={w.text}
              style={{
                fontSize: 11 + w.weight * 0.4,
                color: w.color,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 10,
                background: `${w.color}18`,
                border: `1px solid ${w.color}30`,
                cursor: 'pointer',
              }}
            >
              {w.text}
            </span>
          ))}
        </div>
      </div>

      {/* ===== 5. AI 实时点评 ===== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)',
          border: '1px solid rgba(167, 139, 250, 0.40)',
          borderRadius: 14, padding: 14, marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Sparkles size={12} color="#A78BFA" />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>AI 实时点评</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#A78BFA' }}>每 5s 更新</span>
        </div>
        <div
          key={commentIdx}
          style={{
            fontSize: 12, color: '#E9D5FF', lineHeight: 1.7, padding: 12,
            background: 'rgba(255,255,255,0.05)', borderRadius: 10,
            animation: 'fadeIn 0.5s ease',
          }}
        >
          {AI_COMMENTS[commentIdx]}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
