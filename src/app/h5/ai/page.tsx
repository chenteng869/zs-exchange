'use client';
/**
 * H5 AI 中心首页 v1
 *  - Hero: ZS-AI 引擎 + 4 项核心数据
 *  - 8 大子模块 4×2（金/青/紫/粉/绿/橙/蓝/红）
 *  - AI 推荐策略 横向滚动
 *  - AI 实时动态 流
 */
import Link from 'next/link';
import {
  Sparkles, Brain, LineChart, BarChart3, Activity, MessageSquare,
  FileText, ShieldCheck, Target, ArrowRight, TrendingUp, Zap,
  Bot, ChevronRight,
} from 'lucide-react';

const STATS = [
  { label: '已服务用户',  value: '128,560',  icon: Activity,  color: '#38BDF8' },
  { label: '今日信号',    value: '342',      icon: Zap,       color: '#F0B90B' },
  { label: '累计收益',    value: '+186%',    icon: TrendingUp,color: '#34D399' },
  { label: 'AI 在线率',   value: '99.97%',   icon: Bot,       color: '#A78BFA' },
];

const AI_MODULES = [
  { id: 'quant',     label: 'AI 量化分析', sub: '策略 / 回测 / 跟单',   color: '#F0B90B', bg: 'linear-gradient(135deg, rgba(240,185,11,0.20), rgba(252,213,53,0.05))', icon: LineChart,    href: '/h5/ai/quant',     hot: true },
  { id: 'sentiment', label: 'AI 情绪分析', sub: 'F&G / 多空 / 舆情',   color: '#F472B6', bg: 'linear-gradient(135deg, rgba(244,114,182,0.20), rgba(236,72,153,0.05))',  icon: Activity,     href: '/h5/ai/sentiment', hot: true },
  { id: 'advisor',   label: 'AI 投顾',     sub: '风险测评 / 资产配置', color: '#38BDF8', bg: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(125,211,252,0.05))',  icon: Brain,        href: '/h5/ai/advisor' },
  { id: 'analyze',   label: 'AI 行情解读', sub: '异动 / 趋势预测',     color: '#A78BFA', bg: 'linear-gradient(135deg, rgba(167,139,250,0.20), rgba(139,92,246,0.05))',  icon: BarChart3,    href: '/h5/ai/analyze' },
  { id: 'chat',      label: 'AI 智能客服', sub: '7×24 实时对话',       color: '#22D3EE', bg: 'linear-gradient(135deg, rgba(34,211,238,0.20), rgba(6,182,212,0.05))',   icon: MessageSquare,href: '/h5/ai/chat' },
  { id: 'content',   label: 'AI 内容生成', sub: '研报 / 摘要',         color: '#34D399', bg: 'linear-gradient(135deg, rgba(52,211,153,0.20), rgba(34,197,94,0.05))',   icon: FileText,     href: '/h5/ai/content' },
  { id: 'risk',      label: 'AI 风控审计', sub: '合约 / 链上扫描',     color: '#FB923C', bg: 'linear-gradient(135deg, rgba(251,146,60,0.20), rgba(217,119,6,0.05))',   icon: ShieldCheck,  href: '/h5/ai/risk' },
  { id: 'signal',    label: 'AI 选币信号', sub: 'NLP / 异动推送',       color: '#EC4899', bg: 'linear-gradient(135deg, rgba(236,72,153,0.20), rgba(244,114,182,0.05))',  icon: Target,       href: '/h5/ai/signal' },
];

const TOP_STRATEGIES = [
  { name: 'BTC 趋势跟踪 v3.2',  ytd: '+182%', sharpe: '2.84', mdd: '-8.5%',  users: '5842', color: '#F0B90B' },
  { name: 'ETH 均值回归 α',     ytd: '+138%', sharpe: '2.21', mdd: '-12.3%', users: '3217', color: '#A78BFA' },
  { name: 'SOL 网格套利',       ytd: '+96%',  sharpe: '1.92', mdd: '-6.8%',  users: '2156', color: '#22D3EE' },
  { name: 'AI 选币 Top10',      ytd: '+218%', sharpe: '3.12', mdd: '-18.2%', users: '7894', color: '#F472B6' },
];

const AI_FEED = [
  { time: '12:34:21', text: 'AI 量化发出 BTC 多头信号 · 强度 87',   color: '#34D399' },
  { time: '12:32:08', text: '情绪指数由 62 上升至 68 · 贪婪区间',   color: '#F472B6' },
  { time: '12:30:55', text: 'AI 投顾为 3821 位用户调仓 · 稳健型',   color: '#38BDF8' },
  { time: '12:28:11', text: '异动监控：SOL 5 分钟涨幅 +4.2%',        color: '#A78BFA' },
  { time: '12:25:40', text: 'AI 客服累计处理 12,860 轮对话',          color: '#22D3EE' },
];

export default function H5AIPage() {
  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* ===== Hero ===== */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 40%, #831843 100%)',
          borderRadius: 18,
          padding: 20,
          marginBottom: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(76, 29, 149, 0.40)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, transparent 70%)',
            animation: 'aiPulse 4s ease-in-out infinite',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(167, 139, 250, 0.6)',
              }}
            >
              <Brain size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 20, color: '#F8FAFC', fontWeight: 800, letterSpacing: 0.5 }}>ZS-AI 中心</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>引擎 v3.2 · 8 大智能模块 · 7×24 在线</div>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 10,
                background: 'rgba(52, 211, 153, 0.25)',
                color: '#34D399',
                fontWeight: 700,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              ONLINE
            </span>
          </div>

          {/* 4 项数据 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '10px 6px',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Icon size={12} color={s.color} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 8 大 AI 子模块 4×2 ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 2px' }}>
        <Sparkles size={14} color="#A78BFA" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>AI 矩阵</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>8 大智能模块</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
        {AI_MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              style={{
                position: 'relative',
                background: m.bg,
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14,
                padding: '14px 6px 10px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'transform 0.2s',
              }}
            >
              {m.hot && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    fontSize: 8,
                    padding: '1px 4px',
                    borderRadius: 4,
                    background: '#F472B6',
                    color: '#0F1B3D',
                    fontWeight: 800,
                  }}
                >
                  HOT
                </span>
              )}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `${m.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${m.color}30`,
                }}
              >
                <Icon size={20} color={m.color} />
              </div>
              <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{m.label}</div>
              <div style={{ fontSize: 8, color: '#7B89B8', textAlign: 'center', lineHeight: 1.2 }}>{m.sub}</div>
            </Link>
          );
        })}
      </div>

      {/* ===== AI 推荐策略 横向滚动 ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 2px' }}>
        <LineChart size={14} color="#F0B90B" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>AI 推荐策略</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>左右滑动 →</span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '4px 2px 8px',
          marginBottom: 18,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {TOP_STRATEGIES.map((s) => (
          <Link
            key={s.name}
            href="/h5/ai/quant"
            style={{
              flex: '0 0 200px',
              scrollSnapAlign: 'start',
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: `1px solid ${s.color}30`,
              borderRadius: 14,
              padding: 14,
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>{s.name}</span>
            </div>
            <div style={{ fontSize: 22, color: '#34D399', fontWeight: 800, marginBottom: 6 }}>{s.ytd}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7B89B8' }}>
              <span>夏普 {s.sharpe}</span>
              <span>回撤 {s.mdd}</span>
              <span>{s.users} 人</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ===== AI 实时动态 ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 2px' }}>
        <Activity size={14} color="#F472B6" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>AI 实时动态</span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 8,
            background: 'rgba(244, 114, 182, 0.20)',
            color: '#F472B6',
            fontWeight: 700,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: 3, background: '#F472B6', animation: 'blink 1.5s ease-in-out infinite' }} />
          LIVE
        </span>
      </div>
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 14,
          padding: 4,
        }}
      >
        {AI_FEED.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 10px',
              borderBottom: i < AI_FEED.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: f.color,
                boxShadow: `0 0 6px ${f.color}`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10, color: '#7B89B8', fontFamily: 'monospace', flexShrink: 0 }}>{f.time}</span>
            <span style={{ fontSize: 12, color: '#F8FAFC' }}>{f.text}</span>
            <ChevronRight size={12} color="#7B89B8" style={{ marginLeft: 'auto' }} />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes aiPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
