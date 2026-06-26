'use client';
import { useState } from 'react';
import {
  Headphones, Play, Clock, Search, Filter, ChevronRight, Mic, Crown, Calendar,
} from 'lucide-react';

interface Podcast {
  id: string; title: string; cover: string; emoji: string; host: string; hostAvatar: string;
  category: 'defi' | 'nft' | 'web3' | 'interview' | 'news'; episodes: number; subscribers: number; latest: string; duration: string;
  description: string;
}

const PODCASTS: Podcast[] = [
  { id: 'P-001', title: 'Web3 早知道',     cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '📰', host: '晨间财经',  hostAvatar: '晨', category: 'news',      episodes: 248, subscribers: 124800, latest: '第 248 期',  duration: '45 分钟', description: '每日早间 Web3 资讯速递' },
  { id: 'P-002', title: 'DeFi 深度对话',   cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '💚', host: 'DeFi 教练', hostAvatar: 'D', category: 'defi',      episodes: 86,  subscribers: 84200,  latest: '第 86 期',   duration: '60 分钟', description: '深度解析 DeFi 协议与机制' },
  { id: 'P-003', title: 'NFT 大佬说',     cover: 'linear-gradient(135deg, #A78BFA 0%, #DB2777 100%)', emoji: '💎', host: 'NFT 玩家',  hostAvatar: 'N', category: 'nft',       episodes: 124, subscribers: 64820,  latest: '第 124 期',  duration: '50 分钟', description: 'NFT 投资与收藏经验分享' },
  { id: 'P-004', title: 'Vitalik 解密',    cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '⚡', host: 'ZK 研究员', hostAvatar: 'Z', category: 'interview', episodes: 32,  subscribers: 48200,  latest: '第 32 期',   duration: '90 分钟', description: '以太坊核心开发者专访' },
  { id: 'P-005', title: 'Web3 创业故事',   cover: 'linear-gradient(135deg, #F472B6 0%, #B45309 100%)', emoji: '🚀', host: '老李',     hostAvatar: '李', category: 'web3',      episodes: 58,  subscribers: 38420,  latest: '第 58 期',   duration: '70 分钟', description: '对话 Web3 创业者' },
];

const CATEGORY_MAP = {
  all:       { label: '全部',  color: '#7B89B8' },
  news:      { label: '资讯',  color: '#38BDF8' },
  defi:      { label: 'DeFi', color: '#34D399' },
  nft:       { label: 'NFT',  color: '#A78BFA' },
  interview: { label: '专访',  color: '#F0B90B' },
  web3:      { label: 'Web3', color: '#F472B6' },
};

export default function H5ContentPodcastsPage() {
  const [cat, setCat] = useState<keyof typeof CATEGORY_MAP>('all');
  const filtered = cat === 'all' ? PODCASTS : PODCASTS.filter(p => p.category === cat);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Headphones size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>播客</span>
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索播客" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(CATEGORY_MAP).map(([k, v]) => (
          <button key={k} onClick={() => setCat(k as keyof typeof CATEGORY_MAP)}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: cat === k ? v.color : 'rgba(148, 163, 184, 0.20)', background: cat === k ? `${v.color}20` : 'transparent', color: cat === k ? v.color : '#7B89B8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 播客列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => {
          const c = CATEGORY_MAP[p.category];
          return (
            <div key={p.id} style={{ display: 'flex', gap: 10, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: 12, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative', flexShrink: 0 }}>
                {p.emoji}
                <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={14} color="#0F1B3D" fill="#0F1B3D" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${c.color}26`, color: c.color, fontWeight: 700 }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 6 }}>{p.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#7B89B8', marginTop: 'auto' }}>
                  <span>{p.host}</span>
                  <span>·</span>
                  <span>{p.episodes} 期</span>
                  <span>·</span>
                  <span>{(p.subscribers / 1000).toFixed(1)}K 订阅</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 最新一期 */}
      <div style={{ marginTop: 14, padding: 12, background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(167, 139, 250, 0.30)', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Mic size={14} color="#A78BFA" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>最新播出</span>
        </div>
        {PODCASTS.slice(0, 3).map((p, i) => (
          <a key={p.id} href={`/h5/content/podcast/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.06)', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.latest}: {p.title}</div>
              <div style={{ fontSize: 9, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock size={9} />{p.duration}
              </div>
            </div>
            <ChevronRight size={14} color="#7B89B8" />
          </a>
        ))}
      </div>
    </div>
  );
}
