'use client';
import { useState } from 'react';
import { Award, Crown, Sparkles, Star, ChevronRight, Lock, Check, Gift, Zap, Trophy } from 'lucide-react';
import { getAchievements } from '@/lib/h5-mock';

const RARITY_MAP = {
  common:    { label: '普通',   color: '#7B89B8', bg: 'rgba(127, 137, 184, 0.15)' },
  rare:      { label: '稀有',   color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  epic:      { label: '史诗',   color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
  legendary: { label: '传说',   color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)' },
};

const RARITY_FILTERS = {
  all:       { label: '全部',     color: '#A78BFA' },
  common:    { label: '普通',     color: '#7B89B8' },
  rare:      { label: '稀有',     color: '#38BDF8' },
  epic:      { label: '史诗',     color: '#A78BFA' },
  legendary: { label: '传说',     color: '#F0B90B' },
};

export default function H5GameAchievementsPage() {
  const [filter, setFilter] = useState<keyof typeof RARITY_FILTERS>('all');
  const list = getAchievements();
  const filtered = filter === 'all' ? list : list.filter(a => a.rarity === filter);
  const unlocked = list.filter(a => a.unlocked).length;
  const totalReward = list.filter(a => a.unlocked).reduce((s, a) => s + parseInt(a.reward.replace(/[^\d]/g, '') || '0'), 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Award size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>成就系统</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' }}>{unlocked}/{list.length}</span>
      </div>

      {/* 进度概览 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.18) 0%, rgba(124, 58, 237, 0.10) 100%)', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid rgba(167, 139, 250, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Crown size={16} color="#A78BFA" />
          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>成就进度</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#A78BFA' }}>{Math.round((unlocked / list.length) * 100)}%</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>总完成度</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F0B90B' }}>{unlocked}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>已解锁</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#34D399' }}>{totalReward.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>ZS 奖励</div>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(127, 137, 184, 0.15)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ width: `${(unlocked / list.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #A78BFA 0%, #F0B90B 100%)' }} />
        </div>
      </div>

      {/* 稀有度筛选 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
        {Object.entries(RARITY_FILTERS).map(([k, v]) => {
          const active = filter === k;
          return (
            <button key={k} onClick={() => setFilter(k as keyof typeof RARITY_FILTERS)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, background: active ? `${v.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${v.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? v.color : '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 成就列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(a => {
          const r = RARITY_MAP[a.rarity];
          return (
            <div key={a.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14, border: a.unlocked ? `1px solid ${r.color}50` : '1px solid rgba(127, 137, 184, 0.12)', opacity: a.unlocked ? 1 : 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 14, background: a.unlocked ? r.bg : 'rgba(127, 137, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative' }}>
                  {a.unlocked ? a.emoji : <Lock size={24} color="#7B89B8" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{a.name}</span>
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: r.bg, color: r.color, fontWeight: 600 }}>{r.label}</span>
                    {a.unlocked && <Check size={11} color="#34D399" />}
                  </div>
                  <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{a.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(127, 137, 184, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${a.progress}%`, height: '100%', background: r.color }} />
                    </div>
                    <span style={{ fontSize: 10, color: r.color, fontWeight: 600 }}>{a.progress}%</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#F0B90B' }}>
                    <Gift size={11} color="#F0B90B" />{a.reward}
                  </div>
                  {a.date && <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 4 }}>{a.date}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
