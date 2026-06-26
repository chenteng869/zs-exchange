'use client';
import { useState } from 'react';
import {
  Gamepad2, Trophy, Users, Star, ChevronRight, Play, Crown, Sparkles, Flame, Zap, Target, Gift,
} from 'lucide-react';
import { getGames, getTournaments, getAchievements } from '@/lib/h5-mock';

export default function H5GameHubPage() {
  const games = getGames();
  const tournaments = getTournaments();
  const achievements = getAchievements();
  const featured = games.filter(g => g.featured);
  const liveTour = tournaments.find(t => t.status === 'live');
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Gamepad2 size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>游戏中心</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA', fontWeight: 600 }}>GameFi</span>
      </div>

      {/* 大数据卡 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid rgba(167, 139, 250, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Sparkles size={12} color="#A78BFA" />
          <span style={{ fontSize: 11, color: '#7B89B8' }}>我的游戏数据</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#F0B90B' }}>{games.length}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>已玩游戏</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#34D399' }}>{unlocked}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>解锁成就</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#A78BFA' }}>1,580</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>ZS 奖励</div>
          </div>
        </div>
      </div>

      {/* 4 入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: Gamepad2, label: '游戏库',   color: '#A78BFA' },
          { icon: Trophy,   label: '锦标赛',   color: '#F0B90B' },
          { icon: Target,   label: '成就',     color: '#34D399' },
          { icon: Users,    label: '好友',     color: '#38BDF8' },
        ].map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
              <Icon size={20} color={it.color} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 11, color: '#F8FAFC' }}>{it.label}</div>
            </div>
          );
        })}
      </div>

      {/* 直播锦标赛 */}
      {liveTour && (
        <div style={{ background: 'linear-gradient(180deg, rgba(244, 114, 182, 0.18) 0%, rgba(219, 39, 119, 0.18) 100%)', borderRadius: 16, padding: 14, marginBottom: 12, border: '1px solid rgba(244, 114, 182, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Flame size={12} color="#F472B6" />
            <span style={{ fontSize: 11, color: '#F472B6', fontWeight: 600 }}>LIVE 直播中</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>{liveTour.participants}/{liveTour.maxParticipants}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: liveTour.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{liveTour.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{liveTour.name}</div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>奖池 {liveTour.prizePool}</div>
            </div>
            <ChevronRight size={16} color="#F472B6" />
          </div>
        </div>
      )}

      {/* 推荐游戏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Crown size={12} color="#F0B90B" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>精选推荐</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {featured.map(g => (
          <div key={g.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 80, background: g.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative' }}>
              {g.emoji}
              {g.hot && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#F472B6', color: '#0F1B3D', fontWeight: 700 }}>HOT</span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{g.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Star size={10} color="#F0B90B" fill="#F0B90B" />
                <span style={{ fontSize: 10, color: '#7B89B8' }}>{g.rating}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#34D399' }}>{g.players}人</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 热门游戏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Zap size={12} color="#38BDF8" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>热门游戏</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>查看全部 ›</span>
      </div>
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 16, overflow: 'hidden' }}>
        {games.slice(0, 4).map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', padding: 12, borderTop: i === 0 ? 'none' : '1px solid rgba(127, 137, 184, 0.1)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: g.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginRight: 10 }}>{g.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{g.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{g.developer} · {g.size}</div>
            </div>
            <Play size={14} color="#A78BFA" />
          </div>
        ))}
      </div>
    </div>
  );
}
