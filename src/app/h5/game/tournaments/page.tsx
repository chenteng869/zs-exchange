'use client';
import { useState } from 'react';
import {
  Trophy, Users, Clock, ChevronRight, Flame, Sparkles, Calendar, Coins, Award, Crown,
} from 'lucide-react';
import { getTournaments, getGames } from '@/lib/h5-mock';

const STATUS_MAP = {
  all:         { label: '全部',     color: '#7B89B8' },
  registering: { label: '报名中',   color: '#38BDF8' },
  live:        { label: '进行中',   color: '#F472B6' },
  ended:       { label: '已结束',   color: '#7B89B8' },
};

export default function H5GameTournamentsPage() {
  const [status, setStatus] = useState<keyof typeof STATUS_MAP>('all');
  const tournaments = getTournaments();
  const games = getGames();
  const filtered = status === 'all' ? tournaments : tournaments.filter(t => t.status === status);
  const live = tournaments.find(t => t.status === 'live');
  const totalPrize = tournaments.reduce((s, t) => s + parseInt(t.prizePool.replace(/[$,]/g, '')), 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Trophy size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>锦标赛</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B' }}>奖池 ${totalPrize.toLocaleString()}</span>
      </div>

      {/* 进行中大卡 */}
      {live && (
        <div style={{ background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.20) 0%, rgba(219, 39, 119, 0.20) 100%)', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid rgba(244, 114, 182, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Flame size={12} color="#F472B6" />
            <span style={{ fontSize: 11, color: '#F472B6', fontWeight: 600 }}>🔥 进行中</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#7B89B8' }}>
              <Users size={10} /> {live.participants}/{live.maxParticipants}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 60, height: 60, borderRadius: 12, background: live.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{live.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{live.name}</div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{live.game}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F0B90B' }}>{live.prizePool}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>{live.fee}</span>
              </div>
            </div>
            <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>观看</button>
          </div>
          <div style={{ height: 4, background: 'rgba(127, 137, 184, 0.15)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ width: `${(live.participants / live.maxParticipants) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)' }} />
          </div>
        </div>
      )}

      {/* 状态分类 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const active = status === k;
          return (
            <button key={k} onClick={() => setStatus(k as keyof typeof STATUS_MAP)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: active ? `${v.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${v.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? v.color : '#7B89B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(t => {
          const ratio = t.participants / t.maxParticipants;
          const stColor = STATUS_MAP[t.status].color;
          return (
            <div key={t.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: t.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{t.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{t.game} · 主办 {t.host}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#F0B90B', fontWeight: 700 }}>
                      <Coins size={11} color="#F0B90B" />{t.prizePool}
                    </span>
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: `${stColor}25`, color: stColor, fontWeight: 600 }}>{STATUS_MAP[t.status].label}</span>
                    <span style={{ fontSize: 10, color: '#7B89B8' }}>{t.fee}</span>
                  </div>
                </div>
                <ChevronRight size={16} color="#7B89B8" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Users size={11} color="#7B89B8" />
                <span style={{ fontSize: 10, color: '#7B89B8' }}>{t.participants} / {t.maxParticipants}</span>
                <div style={{ flex: 1, height: 4, background: 'rgba(127, 137, 184, 0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${ratio * 100}%`, height: '100%', background: stColor }} />
                </div>
                <span style={{ fontSize: 10, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Calendar size={10} />{t.startTime.slice(5)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
