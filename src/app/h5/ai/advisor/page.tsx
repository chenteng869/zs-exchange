'use client';
/** H5 AI 投顾 - 风险测评 + 资产配置 */
import { useState } from 'react';
import Link from 'next/link';
import { Brain, CheckCircle2, ChevronRight, Award, TrendingUp, Shield, Sparkles } from 'lucide-react';

const QUESTIONS = [
  { q: '您的投资经验？', opts: ['无经验', '1 年以内', '1-3 年', '3 年以上'] },
  { q: '可承受的最大回撤？', opts: ['5% 以内', '5-15%', '15-30%', '30% 以上'] },
  { q: '投资期限偏好？', opts: ['随时赎回', '1 个月内', '1-6 个月', '6 个月以上'] },
  { q: '年收入范围？', opts: ['10 万以下', '10-30 万', '30-100 万', '100 万以上'] },
];

const PORTFOLIOS = [
  { name: '稳健型', risk: '低',  color: '#34D399', alloc: [{ name: 'BTC', pct: 20 }, { name: 'ETH', pct: 25 }, { name: '稳定币', pct: 45 }, { name: 'DeFi', pct: 10 }] },
  { name: '平衡型', risk: '中',  color: '#38BDF8', alloc: [{ name: 'BTC', pct: 30 }, { name: 'ETH', pct: 30 }, { name: '山寨币', pct: 20 }, { name: '稳定币', pct: 20 }] },
  { name: '进取型', risk: '高',  color: '#F472B6', alloc: [{ name: 'BTC', pct: 25 }, { name: 'ETH', pct: 25 }, { name: '山寨币', pct: 35 }, { name: 'NFT/GameFi', pct: 15 }] },
];

export default function H5AIAdvisorPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const pick = (i: number) => {
    const next = [...answers, i];
    setAnswers(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const portfolio = PORTFOLIOS[Math.min(2, Math.floor(answers.reduce((s, a) => s + a, 0) / QUESTIONS.length / 1.5))];

  return (
    <div style={{ padding: '12px 0' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.20) 0%, rgba(125,211,252,0.05) 100%)',
          border: '1px solid rgba(56,189,248,0.30)',
          borderRadius: 16,
          padding: 16, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #38BDF8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(56,189,248,0.4)' }}>
          <Brain size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 智能投顾</div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>1 分钟测评 · 定制专属资产配置</div>
        </div>
        <Link
          href="/h5/ai/advisor/test"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, padding: '6px 12px', borderRadius: 10,
            background: 'linear-gradient(135deg, #A78BFA, #F472B6)', color: '#fff',
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(167,139,250,0.40)',
          }}
        >
          <Sparkles size={11} /> 深度测评 →
        </Link>
      </div>

      {!done ? (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 14, padding: 18,
          }}
        >
          {/* 进度条 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= step ? 'linear-gradient(90deg, #38BDF8, #2563EB)' : 'rgba(148,163,184,0.20)',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 4 }}>第 {step + 1} / {QUESTIONS.length} 题</div>
          <div style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 700, marginBottom: 20 }}>{QUESTIONS[step].q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUESTIONS[step].opts.map((o, i) => (
              <button
                key={o}
                onClick={() => pick(i)}
                style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(56,189,248,0.10)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  color: '#F8FAFC', fontSize: 13, textAlign: 'left',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: 11, background: 'rgba(56,189,248,0.20)', color: '#38BDF8', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {o}
                <ChevronRight size={14} color="#7B89B8" style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 测评结果 */}
          <div
            style={{
              background: `linear-gradient(135deg, ${portfolio.color}30 0%, ${portfolio.color}08 100%)`,
              border: `1px solid ${portfolio.color}50`,
              borderRadius: 16, padding: 20, marginBottom: 14, textAlign: 'center',
            }}
          >
            <Award size={36} color={portfolio.color} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 12, color: '#7B89B8' }}>AI 测评结果</div>
            <div style={{ fontSize: 24, color: portfolio.color, fontWeight: 800, margin: '4px 0' }}>{portfolio.name} 投资者</div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>风险偏好 · {portfolio.risk}</div>
          </div>

          {/* 资产配置饼图 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 14, padding: 18, marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 14 }}>推荐资产配置</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <svg viewBox="0 0 100 100" style={{ width: 100, height: 100, flexShrink: 0, transform: 'rotate(-90deg)' }}>
                {(() => {
                  let acc = 0;
                  return portfolio.alloc.map((a) => {
                    const dash = (a.pct / 100) * 251;
                    const offset = (acc / 100) * 251;
                    acc += a.pct;
                    return (
                      <circle
                        key={a.name}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={portfolio.color}
                        strokeWidth="14"
                        strokeDasharray={`${dash} 251`}
                        strokeDashoffset={-offset}
                        opacity={0.4 + (1 - a.pct / 50) * 0.5}
                      />
                    );
                  });
                })()}
              </svg>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {portfolio.alloc.map((a) => (
                  <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: portfolio.color, opacity: 0.4 + (1 - a.pct / 50) * 0.5 }} />
                    <span style={{ fontSize: 11, color: '#F8FAFC', flex: 1 }}>{a.name}</span>
                    <span style={{ fontSize: 12, color: portfolio.color, fontWeight: 700 }}>{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI 操作按钮 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                flex: 1, padding: '14px', borderRadius: 12,
                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.30)',
                color: '#38BDF8', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Shield size={14} /> 重新测评
            </button>
            <button
              onClick={() => { setStep(0); setAnswers([]); setDone(false); }}
              style={{
                flex: 2, padding: '14px', borderRadius: 12,
                background: 'linear-gradient(135deg, #38BDF8, #2563EB)', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(56,189,248,0.4)',
              }}
            >
              <TrendingUp size={14} /> 一键跟投配置
            </button>
          </div>
        </>
      )}
    </div>
  );
}
