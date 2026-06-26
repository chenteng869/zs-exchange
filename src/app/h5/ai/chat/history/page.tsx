'use client';
/**
 * H5 AI 对话历史页 v1
 *  - 顶部统计：今日 / 本周 / 累计 / AI 用时
 *  - 搜索框
 *  - 4 个分类 tab
 *  - 对话列表：标题 + 首条消息预览 + 时间 + 消息数 + 收藏/删除
 *  - 快速提示词入口
 */
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Search, MessageSquare, Sparkles, Star, Trash2,
  Filter, Plus, Bot, ChevronRight, Zap, BarChart3, ShieldCheck,
  TrendingUp, Clock,
} from 'lucide-react';

const STATS = [
  { label: '今日对话',  val: '8',   color: '#F0B90B' },
  { label: '本周',      val: '32',  color: '#38BDF8' },
  { label: '累计',      val: '184', color: '#A78BFA' },
  { label: 'AI 用时',   val: '4.2h',color: '#34D399' },
];

const TABS = [
  { key: 'all',       label: '全部',     icon: MessageSquare },
  { key: 'fav',       label: '收藏',     icon: Star },
  { key: 'trade',     label: '交易',     icon: TrendingUp },
  { key: 'analysis',  label: '分析',     icon: BarChart3 },
];

const CONVOS = [
  { id: 'c1', title: 'BTC 现在能买吗？',           preview: '当前 BTC 报价 $68,420，24h +2.3%。短线震荡偏多…',     time: '12:42',  count: 6,  tag: 'analysis', fav: true,  category: '行情' },
  { id: 'c2', title: '如何开通永续合约？',         preview: '开通合约步骤：1. 完成 KYC 二级认证 2. 划转 USDT…',  time: '11:18',  count: 12, tag: 'trade',    fav: false, category: '教程' },
  { id: 'c3', title: '今日热门币种推荐',           preview: '今日热门 TOP 3：SOL +8.4% / PEPE +12.1% / TON…',   time: '10:35',  count: 4,  tag: 'analysis', fav: true,  category: '选币' },
  { id: 'c4', title: 'OTC 单笔限额多少？',         preview: 'OTC 单笔限额：基础用户 ¥100-¥50,000…',              time: '昨天',   count: 8,  tag: 'all',      fav: false, category: '账户' },
  { id: 'c5', title: 'ETH 链上数据怎么看？',       preview: 'ETH 活跃地址 + 资金费率 + 现货溢价三因子…',         time: '昨天',   count: 14, tag: 'analysis', fav: false, category: '链上' },
  { id: 'c6', title: '止损止盈怎么设置？',         preview: '建议使用 OCO 单（One-Cancels-Other）…',            time: '前天',   count: 6,  tag: 'trade',    fav: true,  category: '教程' },
  { id: 'c7', title: 'DeFi 流动性挖矿风险？',      preview: '主要风险：无常损失 / 智能合约漏洞 / 协议监管…',    time: '06-21',  count: 10, tag: 'all',      fav: false, category: 'DeFi' },
  { id: 'c8', title: 'AI 量化策略对比',            preview: 'BTC 趋势 v3.2 vs ETH 均值回归 α 历史回测对比…',     time: '06-20',  count: 22, tag: 'analysis', fav: true,  category: 'AI' },
  { id: 'c9', title: 'KYC 二级认证资料',           preview: '需要准备：身份证正反面 + 手持照片 + 地址证明…',     time: '06-19',  count: 5,  tag: 'all',      fav: false, category: '账户' },
  { id: 'c10', title: 'P2P 出金安全吗？',         preview: 'P2P 出金风险：商家资质 / 资金冻结 / 实名验证…',     time: '06-18',  count: 9,  tag: 'trade',    fav: false, category: '出金' },
];

const QUICK_PROMPTS = [
  { icon: TrendingUp,   text: 'BTC 短线怎么看',  color: '#F0B90B' },
  { icon: BarChart3,    text: '今日热门币',        color: '#A78BFA' },
  { icon: ShieldCheck,  text: '如何设置止损',      color: '#34D399' },
  { icon: Zap,          text: 'DeFi 收益排行',     color: '#38BDF8' },
];

export default function H5AIChatHistoryPage() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const filtered = CONVOS.filter((c) => {
    if (tab === 'fav' && !c.fav) return false;
    if (tab === 'trade' && c.tag !== 'trade') return false;
    if (tab === 'analysis' && c.tag !== 'analysis') return false;
    if (q && !c.title.toLowerCase().includes(q.toLowerCase()) && !c.preview.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

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
        <Link href="/h5/ai/chat" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7B89B8', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 12 }}>返回</span>
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>对话历史</div>
        <Link
          href="/h5/ai/chat"
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #A78BFA, #F472B6)', color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}
        >
          <Plus size={10} /> 新对话
        </Link>
      </div>

      {/* Hero 统计 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 50%, #831843 100%)',
          borderRadius: 16, padding: 14, marginBottom: 14, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.40) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #A78BFA, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, color: '#F8FAFC', fontWeight: 800 }}>ZS-AI 对话记录</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>本地 30 天 · 云端永久</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, position: 'relative' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: s.color, fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 搜索框 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'rgba(148, 163, 184, 0.08)', border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12, marginBottom: 10,
        }}
      >
        <Search size={14} color="#7B89B8" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索历史对话"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, minWidth: 0 }}
        />
        {q && (
          <button onClick={() => setQ('')} style={{ background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer', fontSize: 11 }}>清除</button>
        )}
      </div>

      {/* 分类 tab */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '0 4px', overflowX: 'auto' }}>
        <Filter size={12} color="#7B89B8" />
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 11, padding: '5px 12px', borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: active ? 'rgba(167,139,250,0.20)' : 'rgba(26,36,86,0.50)',
                border: active ? '1px solid rgba(167,139,250,0.40)' : '1px solid rgba(148,163,184,0.10)',
                color: active ? '#A78BFA' : '#7B89B8',
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon size={10} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 快速提示词（仅 all tab） */}
      {tab === 'all' && !q && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
            <Sparkles size={11} color="#FCD535" /> 推荐提问
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {QUICK_PROMPTS.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.text}
                  href="/h5/ai/chat"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px',
                    background: `${p.color}15`, border: `1px solid ${p.color}30`,
                    borderRadius: 10, textDecoration: 'none',
                  }}
                >
                  <Icon size={14} color={p.color} />
                  <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 600 }}>{p.text}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 对话列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#7B89B8', fontSize: 12 }}>
            <MessageSquare size={32} color="#7B89B8" style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>暂无对话记录</div>
          </div>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            style={{
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 12, padding: 12, position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(167,139,250,0.30), rgba(244,114,182,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="#A78BFA" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  {c.fav && <Star size={11} color="#FCD535" fill="#FCD535" />}
                </div>
                <div style={{ fontSize: 10, color: '#B4C0E0', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.preview}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(148,163,184,0.15)', color: '#7B89B8' }}>{c.category}</span>
                  <span style={{ fontSize: 9, color: '#7B89B8' }}>{c.count} 条消息</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: '#7B89B8' }}>{c.time}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.06)' }}>
              <Link
                href="/h5/ai/chat"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  padding: '6px 0', borderRadius: 8, textDecoration: 'none',
                  background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)',
                  color: '#A78BFA', fontSize: 10, fontWeight: 700,
                }}
              >
                继续对话 <ChevronRight size={10} />
              </Link>
              <button
                style={{
                  width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.10)',
                  borderRadius: 8, color: c.fav ? '#FCD535' : '#7B89B8', cursor: 'pointer',
                }}
                aria-label="收藏"
              >
                <Star size={12} fill={c.fav ? '#FCD535' : 'transparent'} />
              </button>
              <button
                style={{
                  width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(244,114,182,0.10)', border: '1px solid rgba(244,114,182,0.20)',
                  borderRadius: 8, color: '#F472B6', cursor: 'pointer',
                }}
                aria-label="删除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 12px', background: 'rgba(148,163,184,0.05)', borderRadius: 10 }}>
        <Clock size={11} color="#7B89B8" />
        <span style={{ fontSize: 10, color: '#7B89B8', lineHeight: 1.5 }}>对话内容仅保存 30 天，过期请开启云端同步</span>
      </div>
    </div>
  );
}
