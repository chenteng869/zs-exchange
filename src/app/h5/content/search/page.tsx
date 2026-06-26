'use client';
import { useState } from 'react';
import {
  Search, Hash, TrendingUp, FileText, Video, Headphones, Radio, Newspaper, X, Filter,
} from 'lucide-react';

const TABS = [
  { v: 'all',       label: '全部',  icon: Search,  color: '#38BDF8' },
  { v: 'article',   label: '文章',  icon: FileText,color: '#34D399' },
  { v: 'video',     label: '视频',  icon: Video,   color: '#A78BFA' },
  { v: 'live',      label: '直播',  icon: Radio,   color: '#F472B6' },
  { v: 'podcast',   label: '播客',  icon: Headphones, color: '#F0B90B' },
];

interface Result {
  type: 'article' | 'video' | 'live' | 'podcast' | 'topic';
  title: string;
  desc: string;
  meta: string;
  emoji: string;
  color: string;
  hot?: boolean;
}

const RESULTS: Result[] = [
  { type: 'article', title: 'BTC 突破 7 万美元：减半行情正式启动？',     desc: '比特币现货 ETF 持续净流入，机构资金加速进场', meta: '12,480 阅读 · 2 小时前',     emoji: '📈', color: '#F0B90B', hot: true },
  { type: 'video',   title: 'BTC 行情分析：减半前最后机会？',            desc: '老李说币 · 12:35',                          meta: '12.4K 播放 · VIP',          emoji: '🎬', color: '#F0B90B' },
  { type: 'live',    title: 'BTC 实时行情解盘',                            desc: '老李说币 · 进行中',                          meta: '8,420 观看 · LIVE',         emoji: '📊', color: '#F0B90B' },
  { type: 'podcast', title: 'BTC 减半行情分析 + 三大热点板块',             desc: 'Web3 早知道 · 第 248 期',                     meta: '8.4K 播放 · 45 分钟',        emoji: '🎙️', color: '#F0B90B' },
  { type: 'topic',   title: '#BTC减半行情',                                desc: '讨论比特币减半后的市场走势',                  meta: '12,480 帖 · 24,820 关注',    emoji: '📈', color: '#F0B90B', hot: true },
  { type: 'article', title: '新手必看：BTC 投资入门 7 步走',               desc: '从钱包选择到交易所开户',                     meta: '5,420 阅读 · 2 天前',        emoji: '🌱', color: '#34D399' },
  { type: 'article', title: 'BTC 与黄金：避险资产之争',                    desc: '宏观环境下的资产配置',                        meta: '4,820 阅读 · 3 天前',        emoji: '🥇', color: '#FCD535' },
];

const HOT_SEARCHES = ['BTC 减半', 'ZK Rollup', 'ETF 获批', 'DeFi Summer', 'Solana 生态', 'GameFi 赛季', 'NFTFi', 'RWA'];
const HISTORY = ['ETH 行情', '空投教程', '币安', 'Layer2'];

export default function H5ContentSearchPage() {
  const [keyword, setKeyword] = useState('BTC');
  const [tab, setTab] = useState<string>('all');
  const filtered = tab === 'all' ? RESULTS : RESULTS.filter(r => r.type === tab);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <Search size={16} color="#38BDF8" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>搜索</span>
      </div>

      {/* 搜索框 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.80) 0%, rgba(21, 34, 74, 0.80) 100%)', border: '1px solid rgba(56, 189, 248, 0.40)', borderRadius: 12, marginBottom: 14 }}>
        <Search size={14} color="#38BDF8" />
        <input value={keyword} onChange={e => setKeyword(e.target.value)} autoFocus
          placeholder="搜索内容/视频/直播/话题..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 14, fontFamily: 'inherit' }} />
        {keyword && <button onClick={() => setKeyword('')} style={{ background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer' }}><X size={14} /></button>}
        <button style={{ padding: '4px 12px', background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer' }}>搜索</button>
      </div>

      {keyword === '' ? (
        <>
          {/* 搜索历史 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>搜索历史</span>
              <button style={{ background: 'transparent', border: 'none', color: '#7B89B8', fontSize: 10, cursor: 'pointer' }}>清空</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {HISTORY.map(h => (
                <span key={h} style={{ padding: '5px 10px', background: 'rgba(15, 27, 61, 0.50)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, color: '#B4C0E0', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} color="#7B89B8" />{h}
                </span>
              ))}
            </div>
          </div>
          {/* 热搜 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <TrendingUp size={13} color="#F472B6" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>热搜榜</span>
            </div>
            <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, overflow: 'hidden' }}>
              {HOT_SEARCHES.map((h, i) => (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderTop: i === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.06)' }}>
                  <span style={{ width: 18, fontSize: 14, fontWeight: 800, color: i < 3 ? '#F472B6' : '#7B89B8', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{h}</span>
                  {i < 3 && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.20)', color: '#F472B6', fontWeight: 700 }}>HOT</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 类型 Tab */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.v} onClick={() => setTab(t.v)}
                  style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: tab === t.v ? t.color : 'rgba(148, 163, 184, 0.20)', background: tab === t.v ? `${t.color}20` : 'transparent', color: tab === t.v ? t.color : '#7B89B8', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon size={11} /> {t.label}
                </button>
              );
            })}
          </div>
          {/* 搜索结果 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: `linear-gradient(135deg, ${r.color} 0%, ${r.color}80 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{r.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {r.hot && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.20)', color: '#F472B6', fontWeight: 700 }}>HOT</span>}
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${r.color}26`, color: r.color, fontWeight: 700 }}>{r.type === 'article' ? '文章' : r.type === 'video' ? '视频' : r.type === 'live' ? '直播' : r.type === 'podcast' ? '播客' : '话题'}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8' }}>{r.desc}</div>
                  <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 4 }}>{r.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { Clock } from 'lucide-react';
