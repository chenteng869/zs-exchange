'use client';
/**
 * H5 AI 投顾 - 风险测评 v1
 *  - Hero 介绍
 *  - 10 道精心设计的题目（投资经验 / 风险偏好 / 资金 / 投资期限 / 目标等）
 *  - 进度条 + 步骤指示
 *  - 结果页：风险等级 / 评分 / 投资风格 / 推荐资产配置 / 推荐策略 / 历史回测
 *  - 重新测试 + 应用配置
 */
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowLeft, Brain, ChevronRight, Sparkles, Target, TrendingUp,
  ShieldCheck, Zap, Award, RefreshCw, PieChart, BarChart3,
  CheckCircle2, ChevronLeft,
} from 'lucide-react';

const QUESTIONS = [
  {
    id: 1, category: '基础', title: '您的年龄范围？',
    desc: '年龄是评估投资期限与风险承受力的基础',
    options: [
      { label: '18-25 岁',  score: 4, desc: '投资期限长' },
      { label: '26-35 岁',  score: 3, desc: '较强风险偏好' },
      { label: '36-50 岁',  score: 2, desc: '稳健为主' },
      { label: '51 岁以上', score: 1, desc: '保守为主' },
    ],
  },
  {
    id: 2, category: '基础', title: '您的年收入范围（人民币）？',
    desc: '年收入决定可投资规模与损失容忍度',
    options: [
      { label: '10 万以下',   score: 1, desc: '风险承受低' },
      { label: '10-30 万',   score: 2, desc: '中等承受' },
      { label: '30-100 万',  score: 3, desc: '较高承受' },
      { label: '100 万以上',  score: 4, desc: '强承受' },
    ],
  },
  {
    id: 3, category: '经验', title: '您的加密货币投资经验？',
    desc: '影响对市场波动的判断与策略选择',
    options: [
      { label: '未投资过',       score: 1, desc: '完全新手' },
      { label: '< 1 年',         score: 2, desc: '初步了解' },
      { label: '1-3 年',         score: 3, desc: '熟悉市场' },
      { label: '3 年以上',       score: 4, desc: '深度玩家' },
    ],
  },
  {
    id: 4, category: '经验', title: '您对衍生品（合约/期权）了解吗？',
    desc: '衍生品风险高，需匹配专业度',
    options: [
      { label: '不了解',  score: 1, desc: '仅限现货' },
      { label: '了解未操作', score: 2, desc: '仅观察' },
      { label: '少量操作', score: 3, desc: '基础策略' },
      { label: '深度玩家', score: 4, desc: '高频套保' },
    ],
  },
  {
    id: 5, category: '风险', title: '可承受的最大回撤？',
    desc: '这是评估您风险承受力的核心',
    options: [
      { label: '5% 以内',   score: 1, desc: '极度保守' },
      { label: '5-15%',     score: 2, desc: '稳健' },
      { label: '15-30%',    score: 3, desc: '积极' },
      { label: '30% 以上',  score: 4, desc: '激进' },
    ],
  },
  {
    id: 6, category: '风险', title: '投资亏损 30% 时的反应？',
    desc: '测试极端行情下的心理承受力',
    options: [
      { label: '立即全部卖出',     score: 1, desc: '风险厌恶' },
      { label: '卖出部分止损',     score: 2, desc: '风险中性' },
      { label: '持有观望',         score: 3, desc: '风险偏好' },
      { label: '加仓抄底',         score: 4, desc: '风险激进' },
    ],
  },
  {
    id: 7, category: '期限', title: '这笔资金的投资期限？',
    desc: '影响流动性需求与策略选择',
    options: [
      { label: '< 1 个月',    score: 1, desc: '高流动性' },
      { label: '1-6 个月',    score: 2, desc: '中短期' },
      { label: '6 个月-2 年', score: 3, desc: '中期' },
      { label: '2 年以上',    score: 4, desc: '长期' },
    ],
  },
  {
    id: 8, category: '目标', title: '投资首要目标？',
    desc: '决定收益与风险的优先级',
    options: [
      { label: '资产保值，跑赢通胀', score: 1, desc: '稳健为先' },
      { label: '稳定收益，年化 8-20%', score: 2, desc: '稳中求进' },
      { label: '高收益，年化 20-50%', score: 3, desc: '积极收益' },
      { label: '最大化收益',     score: 4, desc: '激进收益' },
    ],
  },
  {
    id: 9, category: '流动性', title: '是否需要频繁取用？',
    desc: '影响资产配置中的稳定币比例',
    options: [
      { label: '需要随时取用', score: 1, desc: '高流动性' },
      { label: '偶尔需要',     score: 2, desc: '中流动性' },
      { label: '基本不动',     score: 3, desc: '低流动性' },
      { label: '完全不动',     score: 4, desc: '零流动性' },
    ],
  },
  {
    id: 10, category: '综合', title: '请选择一个最贴近的画像：',
    desc: '综合评估您的投资风格',
    options: [
      { label: 'A. 我宁可少赚也不亏',           score: 1, desc: '保守型' },
      { label: 'B. 接受 10% 波动换 5-15% 收益', score: 2, desc: '稳健型' },
      { label: 'C. 接受 25% 波动换 25-50% 收益', score: 3, desc: '平衡型' },
      { label: 'D. 接受 50% 波动换翻倍可能',   score: 4, desc: '激进型' },
    ],
  },
];

const PROFILES = [
  {
    name: '保守型', tag: 'C1', min: 10, max: 17, color: '#34D399',
    desc: '以资产保值为首要目标，波动容忍度低',
    return: '5-15%',   mdd: '< 8%',
    alloc: [
      { name: 'USDT 稳定币', pct: 50, color: '#94A3B8' },
      { name: 'BTC',         pct: 20, color: '#F0B90B' },
      { name: 'ETH',         pct: 15, color: '#A78BFA' },
      { name: 'DeFi 稳定池', pct: 15, color: '#22D3EE' },
    ],
    strategies: ['USDT 理财 8-12%', 'Curve 3pool 稳定池', '币安宝活期'],
    ai: ['保守型 AI 投顾', '低风险 DeFi 套利'],
  },
  {
    name: '稳健型', tag: 'C2', min: 17, max: 25, color: '#22D3EE',
    desc: '追求稳定收益，能接受适度波动',
    return: '12-25%',  mdd: '8-15%',
    alloc: [
      { name: 'BTC',     pct: 35, color: '#F0B90B' },
      { name: 'ETH',     pct: 25, color: '#A78BFA' },
      { name: '稳定币',  pct: 20, color: '#94A3B8' },
      { name: '主流山寨', pct: 15, color: '#38BDF8' },
      { name: 'DeFi',    pct:  5, color: '#22D3EE' },
    ],
    strategies: ['BTC/ETH 定投', 'ETH PoS 质押 4%', 'SOL/AVAX 主流轮动'],
    ai: ['趋势跟踪 v3.2', 'AI 选币 Top10', '跟单 K神 + ETH 之光'],
  },
  {
    name: '平衡型', tag: 'C3', min: 25, max: 32, color: '#38BDF8',
    desc: '兼顾收益与风险，注重长期复合增长',
    return: '20-40%',  mdd: '15-25%',
    alloc: [
      { name: 'BTC',     pct: 30, color: '#F0B90B' },
      { name: 'ETH',     pct: 25, color: '#A78BFA' },
      { name: '山寨币',  pct: 20, color: '#F472B6' },
      { name: 'DeFi',    pct: 15, color: '#22D3EE' },
      { name: '稳定币',  pct: 10, color: '#94A3B8' },
    ],
    strategies: ['AI 选币 Top10', 'DeFi Yield 8-15%', '小市值轮动 20%'],
    ai: ['AI 选币 Top10', 'DeFi Yield Hunter', '小雅 AI Lab 跟单'],
  },
  {
    name: '积极型', tag: 'C4', min: 32, max: 38, color: '#F472B6',
    desc: '追求高收益，能承受较大波动',
    return: '35-80%',  mdd: '25-40%',
    alloc: [
      { name: 'BTC',       pct: 25, color: '#F0B90B' },
      { name: 'ETH',       pct: 20, color: '#A78BFA' },
      { name: '高 Beta 山寨', pct: 25, color: '#F472B6' },
      { name: 'MEME/NFT',  pct: 15, color: '#FB923C' },
      { name: 'DeFi/IEO',  pct: 15, color: '#22D3EE' },
    ],
    strategies: ['AI 选币激进版', 'MEME 龙头捕捉', 'IDO 一级打新'],
    ai: ['MEME 之王跟单', 'AI 量化 32% 月收益', 'IEO 抢购'],
  },
  {
    name: '激进型', tag: 'C5', min: 38, max: 41, color: '#FB923C',
    desc: '高波动高回报，需严格风控',
    return: '60-200%+', mdd: '40-70%',
    alloc: [
      { name: 'BTC',         pct: 20, color: '#F0B90B' },
      { name: '山寨币',      pct: 30, color: '#F472B6' },
      { name: 'MEME/新币',    pct: 25, color: '#FB923C' },
      { name: '合约杠杆',    pct: 15, color: '#F0B90B' },
      { name: '稳定币预备金', pct: 10, color: '#94A3B8' },
    ],
    strategies: ['合约高频 5x', 'MEME 一日游', '新币土狗挖矿'],
    ai: ['合约大师跟单', 'MEME 之王 58%/月', '高 Beta 轮动'],
  },
];

function getProfile(score: number) {
  return PROFILES.find((p) => score >= p.min && score < p.max) || PROFILES[0];
}

export default function H5AIAdvisorTestPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const score = useMemo(() => answers.reduce((s, a) => s + a, 0), [answers]);
  const profile = getProfile(score);
  const progress = (answers.length / QUESTIONS.length) * 100;

  const pick = (i: number) => {
    setSelected(i);
    setTimeout(() => {
      const next = [...answers, i];
      setAnswers(next);
      setSelected(null);
      if (next.length >= QUESTIONS.length) {
        setDone(true);
      } else {
        setStep(step + 1);
      }
    }, 320);
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setDone(false);
    setSelected(null);
  };

  const q = QUESTIONS[step];

  return (
    <div style={{ padding: '12px 0', paddingBottom: 60 }}>
      {/* 顶部导航 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 10,
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(15,27,61,0.85)', backdropFilter: 'blur(12px)', borderRadius: 10,
        }}
      >
        <Link href="/h5/ai/advisor" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7B89B8', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 12 }}>返回</span>
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>风险测评</div>
        {done ? (
          <button onClick={reset} style={{ background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            <RefreshCw size={12} /> <span style={{ fontSize: 11 }}>重测</span>
          </button>
        ) : (
          <span style={{ fontSize: 10, color: '#7B89B8' }}>{answers.length}/{QUESTIONS.length}</span>
        )}
      </div>

      {!done && q && (
        <>
          {/* 进度条 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#7B89B8' }}>测评进度</div>
              <div style={{ fontSize: 11, color: '#F0B90B', fontWeight: 700 }}>{answers.length} / {QUESTIONS.length}</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`, height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)',
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 8px rgba(240,185,11,0.50)',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(56,189,248,0.20)', color: '#38BDF8' }}>{q.category}</span>
              <span style={{ fontSize: 10, color: '#7B89B8' }}>预计 2 分钟</span>
            </div>
          </div>

          {/* 题目 */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(125,211,252,0.05) 100%)',
              border: '1px solid rgba(56,189,248,0.30)',
              borderRadius: 16, padding: 16, marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #38BDF8, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>第 {step + 1} 题</span>
            </div>
            <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800, lineHeight: 1.4, marginBottom: 6 }}>{q.title}</div>
            <div style={{ fontSize: 11, color: '#7B89B8', lineHeight: 1.5 }}>{q.desc}</div>
          </div>

          {/* 选项 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((o, i) => {
              const sel = selected === i;
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={selected !== null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                    background: sel
                      ? 'linear-gradient(135deg, rgba(240,185,11,0.25) 0%, rgba(252,213,53,0.10) 100%)'
                      : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                    border: sel
                      ? '1px solid rgba(240,185,11,0.50)'
                      : '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 12, textAlign: 'left', cursor: selected === null ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: sel ? 'linear-gradient(135deg, #F0B90B, #FCD535)' : 'rgba(148,163,184,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {sel ? <CheckCircle2 size={14} color="#0F1B3D" /> : <span style={{ fontSize: 10, color: '#7B89B8', fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: sel ? '#FCD535' : '#F8FAFC', fontWeight: 700 }}>{o.label}</div>
                    <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{o.desc}</div>
                  </div>
                  <ChevronRight size={14} color={sel ? '#FCD535' : '#7B89B8'} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 结果 */}
      {done && (
        <>
          {/* Hero 评分 */}
          <div
            style={{
              background: `linear-gradient(135deg, ${profile.color}30 0%, ${profile.color}08 100%)`,
              border: `1px solid ${profile.color}50`,
              borderRadius: 16, padding: 18, marginBottom: 14, textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${profile.color}50 0%, transparent 70%)` }} />
            <div style={{ position: 'relative' }}>
              <Award size={32} color={profile.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 11, color: '#7B89B8' }}>您的投资风格</div>
              <div style={{ fontSize: 32, color: profile.color, fontWeight: 800, margin: '4px 0' }}>
                {profile.name}
              </div>
              <div style={{ display: 'inline-block', fontSize: 10, padding: '2px 10px', borderRadius: 6, background: `${profile.color}30`, color: profile.color, fontWeight: 700, marginBottom: 8 }}>
                {profile.tag} · 评分 {score} / 40
              </div>
              <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>{profile.desc}</div>
            </div>
          </div>

          {/* 4 项关键指标 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { label: '预期年化', val: profile.return,   icon: TrendingUp,   color: '#34D399' },
              { label: '预期回撤', val: profile.mdd,       icon: ShieldCheck,  color: '#F472B6' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={m.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#7B89B8' }}>{m.label}</div>
                    <div style={{ fontSize: 14, color: m.color, fontWeight: 800 }}>{m.val}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 推荐资产配置 */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 12, padding: 12, marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <PieChart size={12} color={profile.color} /> 推荐资产配置
            </div>
            {/* 横向条 */}
            <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              {profile.alloc.map((a, i) => (
                <div key={i} style={{ width: `${a.pct}%`, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#0F1B3D', fontWeight: 800 }}>
                  {a.pct}%
                </div>
              ))}
            </div>
            {profile.alloc.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color }} />
                <span style={{ fontSize: 11, color: '#F8FAFC', flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 11, color: profile.color, fontWeight: 700 }}>{a.pct}%</span>
              </div>
            ))}
          </div>

          {/* 推荐策略 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Target size={12} color="#38BDF8" /> 推荐策略
              </div>
              {profile.strategies.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
                  <CheckCircle2 size={10} color="#34D399" />
                  <span style={{ fontSize: 10, color: '#B4C0E0' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} color="#A78BFA" /> AI 推荐
              </div>
              {profile.ai.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
                  <Zap size={10} color="#FCD535" />
                  <span style={{ fontSize: 10, color: '#B4C0E0' }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <button
              onClick={reset}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: 'rgba(148,163,184,0.10)', border: '1px solid rgba(148,163,184,0.20)',
                color: '#B4C0E0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <RefreshCw size={12} /> 重新测试
            </button>
            <Link
              href="/h5/ai/advisor"
              style={{
                flex: 2, padding: '12px 0', borderRadius: 12, textDecoration: 'none',
                background: `linear-gradient(135deg, ${profile.color} 0%, ${profile.color}80 100%)`,
                color: '#0F1B3D', fontSize: 13, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                boxShadow: `0 4px 12px ${profile.color}50`,
              }}
            >
              <Sparkles size={12} color="#0F1B3D" /> 应用此配置
            </Link>
          </div>

          {/* 风险提示 */}
          <div
            style={{
              background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.20)',
              borderRadius: 12, padding: 12,
            }}
          >
            <div style={{ fontSize: 12, color: '#F472B6', fontWeight: 700, marginBottom: 6 }}>⚠️ 免责声明</div>
            <div style={{ fontSize: 10, color: '#B4C0E0', lineHeight: 1.6 }}>
              本测评基于您提供的信息，结果仅供参考。投资有风险，过往业绩不代表未来表现。请根据自身实际情况谨慎决策。
            </div>
          </div>
        </>
      )}
    </div>
  );
}
