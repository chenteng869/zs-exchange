'use client';
import { useState } from 'react';
import {
  Users, Search, UserPlus, MessageCircle, Crown, Star, Gamepad2, ChevronRight, Heart, Zap, Trophy, X,
} from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  level: number;
  game: string;
  status: 'online' | 'playing' | 'idle' | 'offline';
  power: number;
  vip: boolean;
  recent?: string;
}

const FRIENDS: Friend[] = [
  { id: 'F-1', name: 'CryptoMaster',  avatar: '👑', online: true,  level: 85, game: 'Pixel Warriors', status: 'playing',  power: 28420, vip: true,  recent: '刚刚' },
  { id: 'F-2', name: 'PixelGamer',    avatar: '⚔️', online: true,  level: 72, game: 'Crypto Cards',   status: 'online',   power: 22640, vip: true,  recent: '5 分钟' },
  { id: 'F-3', name: 'MetaFarmer',    avatar: '🌾', online: true,  level: 68, game: 'Meta Farm',      status: 'playing',  power: 19840, vip: false, recent: '刚刚' },
  { id: 'F-4', name: '太空旅客',      avatar: '🚀', online: true,  level: 55, game: 'Space Mining',   status: 'online',   power: 16240, vip: false, recent: '1 小时' },
  { id: 'F-5', name: 'ZombieHunter',  avatar: '🧟', online: false, level: 48, game: 'Zombie Run',     status: 'offline',  power: 14240, vip: false, recent: '昨天' },
  { id: 'F-6', name: 'PuzzlePro',     avatar: '🧩', online: true,  level: 42, game: 'Puzzle Master',  status: 'idle',     power: 12480, vip: false, recent: '30 分钟' },
  { id: 'F-7', name: 'CardKing',      avatar: '🃏', online: false, level: 38, game: 'Crypto Cards',   status: 'offline',  power: 11240, vip: true,  recent: '3 天前' },
  { id: 'F-8', name: 'NinjaTrader',   avatar: '🥷', online: true,  level: 35, game: 'Pixel Warriors', status: 'online',   power: 10240, vip: false, recent: '20 分钟' },
];

const STATUS_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  online:  { color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', label: '在线' },
  playing: { color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)', label: '游戏中' },
  idle:    { color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)',  label: '挂机' },
  offline: { color: '#7B89B8', bg: 'rgba(127, 137, 184, 0.15)', label: '离线' },
};

const TABS_MAP = { all: '全部', online: '在线', playing: '游戏中', vip: 'VIP' } as const;
type TabKey = keyof typeof TABS_MAP;

const TABS: { k: TabKey; label: string; count: number }[] = [
  { k: 'all',     label: '全部',    count: 8 },
  { k: 'online',  label: '在线',    count: 5 },
  { k: 'playing', label: '游戏中',  count: 2 },
  { k: 'vip',     label: 'VIP',     count: 3 },
];

export default function H5GameFriendsPage() {
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const filtered = FRIENDS.filter(f => {
    if (tab === 'online' && !f.online) return false;
    if (tab === 'playing' && f.status !== 'playing') return false;
    if (tab === 'vip' && !f.vip) return false;
    if (search && !f.name.includes(search)) return false;
    return true;
  });
  const onlineCount = FRIENDS.filter(f => f.online).length;

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <Users size={16} color="#38BDF8" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>好友</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>{onlineCount} 在线</span>
      </div>

      {/* 概览卡 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(30, 64, 175, 0.10) 100%)', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid rgba(56, 189, 248, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={28} color="#38BDF8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>好友总数</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC' }}>{FRIENDS.length}</div>
          </div>
          <button style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #22D3EE 100%)', color: '#0F1B3D', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserPlus size={12} /> 添加
          </button>
        </div>
      </div>

      {/* 搜索 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Search size={14} color="#7B89B8" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索好友" style={{ flex: 1, background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: 12, outline: 'none' }} />
        {search && <X size={12} color="#7B89B8" onClick={() => setSearch('')} style={{ cursor: 'pointer' }} />}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {TABS.map(t => {
          const active = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k as keyof typeof TABS_MAP)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(26, 36, 86, 0.45)', border: active ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(127, 137, 184, 0.12)', color: active ? '#38BDF8' : '#7B89B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {t.label}
              <span style={{ fontSize: 10, opacity: 0.7 }}>({t.count})</span>
            </button>
          );
        })}
      </div>

      {/* 好友列表 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, overflow: 'hidden' }}>
        {filtered.map((f, i) => {
          const s = STATUS_COLOR[f.status];
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: 12, borderTop: i === 0 ? 'none' : '1px solid rgba(127, 137, 184, 0.08)' }}>
              <div style={{ position: 'relative', marginRight: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: 'linear-gradient(135deg, #38BDF8 0%, #A78BFA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{f.avatar}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: s.color, border: '2px solid #0F1B3D' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  {f.vip && <Crown size={11} color="#F0B90B" />}
                  <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Lv.{f.level}</span>
                  <span>·</span>
                  <span style={{ color: '#38BDF8' }}>{f.game}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button style={{ background: 'rgba(56, 189, 248, 0.15)', border: 'none', color: '#38BDF8', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <MessageCircle size={14} />
                </button>
                <button style={{ background: 'rgba(244, 114, 182, 0.15)', border: 'none', color: '#F472B6', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <Gamepad2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
