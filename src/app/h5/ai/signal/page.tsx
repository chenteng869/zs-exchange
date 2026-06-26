'use client';
/** H5 AI 选币信号 - NLP 选币 + 异动信号流 */
import { Target, TrendingUp, TrendingDown, Minus, Sparkles, Filter, Bell } from 'lucide-react';
import Link from 'next/link';

const SIGNALS = [
  { time: '12:42', coin: 'INJ/USDT',  action: 'buy',  price: '$24.8',  strength: 92, reason: 'AI 舆情爆点 + 链上异动 + 巨鲸增持',     color: '#34D399' },
  { time: '12:35', coin: 'OP/USDT',   action: 'sell', price: '$2.42',  strength: 78, reason: '高位钝化 + 多空比失衡 67/33',             color: '#F472B6' },
  { time: '12:28', coin: 'WIF/USDT',  action: 'buy',  price: '$2.18',  strength: 85, reason: 'MEME 板块轮动 + 社区讨论度 +320%',         color: '#34D399' },
  { time: '12:18', coin: 'APT/USDT',  action: 'hold', price: '$8.42',  strength: 56, reason: '震荡区间，建议观望等待突破',               color: '#FCD535' },
  { time: '12:08', coin: 'TON/USDT',  action: 'buy',  price: '$7.85',  strength: 88, reason: 'Telegram 生态合作 + 机构增持 + 技术突破', color: '#34D399' },
  { time: '11:58', coin: 'ARB/USDT',  action: 'sell', price: '$0.842', strength: 72, reason: '链上交易量下降 + 套利资金撤离',           color: '#F472B6' },
  { time: '11:45', coin: 'PEPE/USDT', action: 'buy',  price: '$0.0000124', strength: 81, reason: 'MEME 龙头 + 关注度爆表 + 历史新高',     color: '#34D399' },
];

const FILTER_TAGS = ['全部', '买入', '卖出', '观望', '大单异动', '社交舆情'];

export default function H5AISignalPage() {
  return (
    <div style={{ padding: '12px 0' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.20) 0%, rgba(244,114,182,0.05) 100%)',
          border: '1px solid rgba(236,72,153,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #EC4899, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(236,72,153,0.4)' }}>
          <Target size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 选币信号</div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>NLP 舆情 + 链上异动 + 技术形态</div>
        </div>
        <Bell size={16} color="#F472B6" />
      </div>

      {/* 4 项数据 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: '今日信号',  value: '342',   color: '#F0B90B' },
          { label: '胜率',      value: '74%',   color: '#34D399' },
          { label: '平均收益',  value: '+8.4%', color: '#F472B6' },
          { label: '订阅人数',  value: '12.5K', color: '#A78BFA' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: '10px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: s.color, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px', overflowX: 'auto' }}>
        <Filter size={12} color="#7B89B8" />
        {FILTER_TAGS.map((t, i) => (
          <span
            key={t}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 10, cursor: 'pointer', flexShrink: 0,
              background: i === 0 ? 'rgba(236,72,153,0.20)' : 'rgba(26,36,86,0.50)',
              border: i === 0 ? '1px solid rgba(236,72,153,0.40)' : '1px solid rgba(148,163,184,0.10)',
              color: i === 0 ? '#F472B6' : '#7B89B8',
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* 信号流 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SIGNALS.map((s, i) => {
          const Action = s.action === 'buy' ? TrendingUp : s.action === 'sell' ? TrendingDown : Minus;
          const actionText = s.action === 'buy' ? '买入' : s.action === 'sell' ? '卖出' : '观望';
          return (
            <Link
              key={i}
              href={`/h5/ai/signal/${i}`}
              style={{
                display: 'block',
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 12, padding: 12,
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: '#7B89B8', fontFamily: 'monospace' }}>{s.time}</span>
                <span
                  style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 800,
                    background: `${s.color}25`, color: s.color,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <Action size={10} />
                  {actionText}
                </span>
                <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 800 }}>{s.coin}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#7B89B8' }}>{s.price}</span>
              </div>
              <div style={{ fontSize: 11, color: '#C9D1E2', marginBottom: 8 }}>{s.reason}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={10} color="#EC4899" />
                <span style={{ fontSize: 10, color: '#7B89B8' }}>AI 强度</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.20)' }}>
                  <div style={{ width: `${s.strength}%`, height: '100%', borderRadius: 2, background: s.color }} />
                </div>
                <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.strength}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
