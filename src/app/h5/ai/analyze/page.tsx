'use client';
/** H5 AI 行情解读 - 异动监控 + 趋势预测 */
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Zap, Activity } from 'lucide-react';

const ALERTS = [
  { time: '12:34:21', coin: 'BTC/USDT', change: '+2.34%', price: '$68,420', type: 'up',   reason: '突破关键阻力 68,000，量能放大 3.2x', color: '#34D399' },
  { time: '12:28:08', coin: 'SOL/USDT', change: '+8.42%', price: '$158.6',  type: 'up',   reason: '生态 TVL 单日 +$1.2 亿，巨鲸地址增持',  color: '#F0B90B' },
  { time: '12:15:55', coin: 'PEPE/USDT',change: '+12.1%', price: '$0.000012', type: 'up', reason: 'MEME 板块轮动，社区讨论度爆表',         color: '#F472B6' },
  { time: '11:58:30', coin: 'ARB/USDT', change: '-5.21%', price: '$0.842',   type: 'down', reason: '链上交易量下降，套利资金撤离',           color: '#F472B6' },
  { time: '11:42:11', coin: 'TON/USDT', change: '+5.20%', price: '$7.85',    type: 'up',   reason: 'Telegram 生态合作利好，机构增持',       color: '#38BDF8' },
];

const PREDICTIONS = [
  { coin: 'BTC',  signal: '看多', confidence: 78, target: '$72,000', stop: '$66,800', color: '#34D399' },
  { coin: 'ETH',  signal: '震荡', confidence: 62, target: '$3,800',  stop: '$3,420',  color: '#FCD535' },
  { coin: 'SOL',  signal: '看多', confidence: 84, target: '$175',    stop: '$148',    color: '#34D399' },
  { coin: 'BNB',  signal: '看空', confidence: 56, target: '$580',    stop: '$640',    color: '#F472B6' },
  { coin: 'DOGE', signal: '观望', confidence: 45, target: '$0.155',  stop: '$0.138',  color: '#7B89B8' },
];

export default function H5AIAnalyzePage() {
  return (
    <div style={{ padding: '12px 0' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.20) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid rgba(167,139,250,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(167,139,250,0.4)' }}>
            <BarChart3 size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 行情解读</div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>异动监控 · 趋势预测 · 智能提醒</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: '今日异动', value: '186', color: '#F0B90B' },
            { label: 'AI 命中',  value: '74%', color: '#34D399' },
            { label: '订阅用户', value: '12.5K', color: '#A78BFA' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: s.color, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 异动监控流 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
        <Zap size={12} color="#F0B90B" />
        <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>实时异动</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'rgba(244,114,182,0.20)', color: '#F472B6' }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {ALERTS.map((a, i) => (
          <div
            key={i}
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderLeft: `3px solid ${a.color}`,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: '#7B89B8', fontFamily: 'monospace' }}>{a.time}</span>
              {a.type === 'up' ? <TrendingUp size={12} color="#34D399" /> : <TrendingDown size={12} color="#F472B6" />}
              <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{a.coin}</span>
              <span style={{ fontSize: 12, color: a.color, fontWeight: 800 }}>{a.change}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8' }}>{a.price}</span>
            </div>
            <div style={{ fontSize: 11, color: '#C9D1E2' }}>{a.reason}</div>
          </div>
        ))}
      </div>

      {/* AI 趋势预测 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
        <Activity size={12} color="#A78BFA" />
        <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>AI 趋势预测</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#7B89B8' }}>未来 24h</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PREDICTIONS.map((p) => (
          <div
            key={p.coin}
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 12, padding: 12,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800, width: 50 }}>{p.coin}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: p.color, padding: '2px 6px', borderRadius: 5, background: `${p.color}20`, fontWeight: 700 }}>{p.signal}</span>
                <span style={{ fontSize: 10, color: '#7B89B8' }}>信心 {p.confidence}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.20)' }}>
                <div style={{ width: `${p.confidence}%`, height: '100%', borderRadius: 2, background: p.color }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#34D399' }}>目标 {p.target}</div>
              <div style={{ fontSize: 10, color: '#F472B6' }}>止损 {p.stop}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
