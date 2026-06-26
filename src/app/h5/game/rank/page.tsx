'use client';
import { useState } from 'react';
import { Trophy, Crown, Medal, Star, TrendingUp, TrendingDown, ChevronRight, Award, Zap, Flame } from 'lucide-react';

const RANK_TYPES = {
  all:    { label: '总榜',   color: '#F0B90B' },
  weekly: { label: '周榜',   color: '#38BDF8' },
  monthly:{ label: '月榜',   color: '#A78BFA' },
  earning:{ label: '收益榜', color: '#34D399' },
};

const TOP3 = [
  { rank: 1, name: 'CryptoMaster88', avatar: '👑', score: 28420, change: 'up',   badge: '🏆' },
  { rank: 2, name: 'PixelGamer',     avatar: '⚔️', score: 24820, change: 'up',   badge: '🥈' },
  { rank: 3, name: 'MetaFarmer',     avatar: '🌾', score: 22640, change: 'down', badge: '🥉' },
];

const RANKS = [
  { rank: 4,  name: 'CardKing',       avatar: '🃏', score: 19840, change: 'up' },
  { rank: 5,  name: '太空旅客',       avatar: '🚀', score: 18620, change: 'up' },
  { rank: 6,  name: 'ZombieHunter',   avatar: '🧟', score: 17480, change: 'down' },
  { rank: 7,  name: 'PuzzlePro',      avatar: '🧩', score: 16240, change: 'same' },
  { rank: 8,  name: '星际迷航者',     avatar: '🌌', score: 15120, change: 'up' },
  { rank: 9,  name: 'BTC战士',        avatar: '🟠', score: 14820, change: 'down' },
  { rank: 10, name: 'GameFiHero',     avatar: '🦸', score: 13640, change: 'up' },
  { rank: 11, name: '潮汐玩家',       avatar: '🌊', score: 12480, change: 'same' },
  { rank: 12, name: 'NinjaTrader',    avatar: '🥷', score: 11240, change: 'up' },
];

export default function H5GameRankPage() {
  const [type, setType] = useState<keyof typeof RANK_TYPES>('all');

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Trophy size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>排行榜</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B' }}>实时</span>
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {Object.entries(RANK_TYPES).map(([k, v]) => {
          const active = type === k;
          return (
            <button key={k} onClick={() => setType(k as keyof typeof RANK_TYPES)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: active ? `${v.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${v.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? v.color : '#7B89B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 我的排名 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(252, 213, 53, 0.10) 100%)', borderRadius: 14, padding: 12, marginBottom: 12, border: '1px solid rgba(240, 185, 11, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Crown size={16} color="#F0B90B" style={{ marginRight: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>我的排名</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0B90B', marginTop: 2 }}>#128</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>积分</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#FCD535', marginTop: 2 }}>8,420</div>
          </div>
          <div style={{ marginLeft: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUp size={10} /> 12
          </div>
        </div>
      </div>

      {/* TOP 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {TOP3.map((p, i) => (
          <div key={p.rank} style={{ background: i === 0 ? 'linear-gradient(180deg, rgba(240, 185, 11, 0.18) 0%, rgba(252, 213, 53, 0.05) 100%)' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, textAlign: 'center', border: i === 0 ? '1px solid rgba(240, 185, 11, 0.35)' : '1px solid rgba(127, 137, 184, 0.12)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{p.badge}</div>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: ['#F0B90B', '#C0C0C0', '#CD7F32'][i], margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{p.avatar}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#F0B90B' : i === 1 ? '#C9D1E2' : '#F472B6', marginTop: 4 }}>{p.score.toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2, fontSize: 10 }}>
              {p.change === 'up' && <TrendingUp size={10} color="#34D399" />}
              {p.change === 'down' && <TrendingDown size={10} color="#F472B6" />}
              <span style={{ color: p.change === 'up' ? '#34D399' : p.change === 'down' ? '#F472B6' : '#7B89B8' }}>#{p.rank}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 完整列表 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, overflow: 'hidden' }}>
        {RANKS.map((p, i) => (
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', padding: 12, borderTop: i === 0 ? 'none' : '1px solid rgba(127, 137, 184, 0.08)' }}>
            <div style={{ width: 28, fontSize: 13, fontWeight: 700, color: p.rank <= 3 ? '#F0B90B' : '#7B89B8', marginRight: 10 }}>{p.rank}</div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, #38BDF8 0%, #A78BFA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: 10 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                {p.change === 'up' && <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: 2 }}><TrendingUp size={10} /> 上升</span>}
                {p.change === 'down' && <span style={{ color: '#F472B6', display: 'flex', alignItems: 'center', gap: 2 }}><TrendingDown size={10} /> 下降</span>}
                {p.change === 'same' && <span style={{ color: '#7B89B8' }}>持平</span>}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F0B90B' }}>{p.score.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
