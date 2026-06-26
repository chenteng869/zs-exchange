'use client';
import { useState } from 'react';
import {
  Package, Search, Filter, Star, ChevronRight, Shield, Sword, Coins, Zap, Crown, Heart, Sparkles,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'currency';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  qty: number;
  game: string;
  value: string;
  level?: number;
  equipped?: boolean;
}

const ITEMS: InventoryItem[] = [
  { id: 'I-01', name: '传奇之剑',     emoji: '⚔️', type: 'weapon',     rarity: 'legendary', qty: 1,  game: 'Pixel Warriors', value: '2.5 ETH', level: 50, equipped: true },
  { id: 'I-02', name: '紫金战甲',     emoji: '🛡️', type: 'armor',      rarity: 'epic',      qty: 1,  game: 'Pixel Warriors', value: '1.2 ETH', level: 45, equipped: true },
  { id: 'I-03', name: '黄金头盔',     emoji: '👑', type: 'armor',      rarity: 'rare',      qty: 1,  game: 'Pixel Warriors', value: '0.8 ETH', level: 40 },
  { id: 'I-04', name: '治疗药水',     emoji: '🧪', type: 'consumable', rarity: 'common',    qty: 86, game: 'Pixel Warriors', value: '5 ZS' },
  { id: 'I-05', name: '传说卡牌包',   emoji: '🃏', type: 'consumable', rarity: 'legendary', qty: 3,  game: 'Crypto Cards',   value: '0.5 ETH' },
  { id: 'I-06', name: '稀有卡牌包',   emoji: '🎴', type: 'consumable', rarity: 'rare',      qty: 12, game: 'Crypto Cards',   value: '0.1 ETH' },
  { id: 'I-07', name: '农场加速器',   emoji: '⚡', type: 'consumable', rarity: 'common',    qty: 24, game: 'Meta Farm',      value: '2 ZS' },
  { id: 'I-08', name: '稀有矿镐',     emoji: '⛏️', type: 'weapon',     rarity: 'epic',      qty: 1,  game: 'Space Mining',   value: '1.5 ETH', level: 30 },
  { id: 'I-09', name: '宇宙燃料',     emoji: '🚀', type: 'material',   rarity: 'rare',      qty: 128,game: 'Space Mining',   value: '0.05 ETH' },
  { id: 'I-10', name: '疫苗',         emoji: '💉', type: 'consumable', rarity: 'common',    qty: 18, game: 'Zombie Run',     value: '3 ZS' },
  { id: 'I-11', name: 'ZS 代币',      emoji: '🪙', type: 'currency',   rarity: 'common',    qty: 1580,game: '通用',         value: '1,580 ZS' },
  { id: 'I-12', name: 'NFT 盲盒',     emoji: '📦', type: 'consumable', rarity: 'epic',      qty: 2,  game: '通用',           value: '0.3 ETH' },
];

const TYPE_MAP = {
  all:         { label: '全部',     color: '#A78BFA' },
  weapon:      { label: '武器',     color: '#F472B6' },
  armor:       { label: '防具',     color: '#38BDF8' },
  consumable:  { label: '消耗品',   color: '#F0B90B' },
  material:    { label: '材料',     color: '#34D399' },
  currency:    { label: '货币',     color: '#22D3EE' },
};

const RARITY_MAP = {
  common:    { label: '普通',   color: '#7B89B8' },
  rare:      { label: '稀有',   color: '#38BDF8' },
  epic:      { label: '史诗',   color: '#A78BFA' },
  legendary: { label: '传说',   color: '#F0B90B' },
};

export default function H5GameInventoryPage() {
  const [type, setType] = useState<keyof typeof TYPE_MAP>('all');
  const filtered = type === 'all' ? ITEMS : ITEMS.filter(i => i.type === type);
  const totalValue = ITEMS.reduce((s, i) => s + (i.equipped ? 1 : 0), 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Package size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>道具背包</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' }}>{ITEMS.length} 件</span>
      </div>

      {/* 概览 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.18) 0%, rgba(124, 58, 237, 0.10) 100%)', borderRadius: 14, padding: 12, marginBottom: 12, border: '1px solid rgba(167, 139, 250, 0.35)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(167, 139, 250, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={22} color="#A78BFA" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>装备中</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#A78BFA' }}>{totalValue} 件</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>总价值</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F0B90B' }}>~7.05 ETH</div>
        </div>
      </div>

      {/* 搜索 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Search size={14} color="#7B89B8" />
        <span style={{ flex: 1, fontSize: 12, color: '#7B89B8' }}>搜索道具 / 游戏</span>
        <Filter size={14} color="#A78BFA" />
      </div>

      {/* 类型 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
        {Object.entries(TYPE_MAP).map(([k, v]) => {
          const active = type === k;
          return (
            <button key={k} onClick={() => setType(k as keyof typeof TYPE_MAP)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: active ? `${v.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${v.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? v.color : '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 物品网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {filtered.map(it => {
          const r = RARITY_MAP[it.rarity];
          return (
            <div key={it.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 10, textAlign: 'center', border: it.equipped ? `1px solid ${r.color}` : '1px solid rgba(127, 137, 184, 0.12)', position: 'relative' }}>
              {it.equipped && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, padding: '1px 4px', borderRadius: 3, background: '#34D399', color: '#0F1B3D', fontWeight: 700 }}>ON</span>}
              <div style={{ width: 50, height: 50, borderRadius: 10, background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 6px' }}>{it.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
              <div style={{ fontSize: 9, color: r.color, fontWeight: 600, marginTop: 2 }}>{r.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4, fontSize: 9, color: '#7B89B8' }}>
                {it.level && <span>Lv.{it.level}</span>}
                {it.qty > 1 && <span style={{ color: '#F0B90B', fontWeight: 600 }}>×{it.qty}</span>}
              </div>
              <div style={{ fontSize: 10, color: '#F0B90B', fontWeight: 600, marginTop: 2 }}>{it.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
