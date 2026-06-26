'use client';
/**
 * Game 模块首页 - GameFi 游戏中心
 */
import Link from 'next/link';
import {
  Gamepad2, Trophy, Users, ChevronRight, Flame, Sparkles, Star, Crown, Award, Target,
} from 'lucide-react';
import { getGames, getTournaments, getAchievements } from '@/lib/h5-mock';

export default function H5GameHomePage() {
  const games = getGames();
  const tournaments = getTournaments();
  const achievements = getAchievements();
  const featured = games.filter(g => g.featured);
  const hot = games.filter(g => g.hot);
  const unlocked = achievements.filter(a => a.unlocked).length;
  const totalPrize = tournaments.reduce((s, t) => s + parseInt(t.prizePool.replace(/[$,]/g, '')), 0);
  const live = tournaments.find(t => t.status === 'live');

  const SUB = [
    { icon: Gamepad2, label: '游戏中心', color: '#A78BFA', href: '/h5/game/hub' },
    { icon: Trophy,   label: '排行榜',   color: '#F0B90B', href: '/h5/game/rank' },
    { icon: Target,   label: '锦标赛',   color: '#F472B6', href: '/h5/game/tournaments' },
    { icon: Award,    label: '成就',     color: '#34D399', href: '/h5/game/achievements' },
    { icon: Users,    label: '好友',     color: '#38BDF8', href: '/h5/game/friends' },
    { icon: Sparkles, label: '我的道具', color: '#22D3EE', href: '/h5/game/inventory' },
  ];

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(167, 139, 250, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Gamepad2 size={18} color="#A78BFA" />
            <span style={{ fontSize: 14, color: '#DDD6FE', fontWeight: 600 }}>GameFi 游戏中心</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(167, 139, 250, 0.20)', color: '#A78BFA' }}>Play to Earn</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 12 }}>已玩游戏 · 累计奖池</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{games.length}</div>
              <div style={{ fontSize: 10, color: '#DDD6FE' }}>款游戏</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>${(totalPrize/1000).toFixed(0)}K</div>
              <div style={{ fontSize: 10, color: '#DDD6FE' }}>奖池</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399' }}>{unlocked}</div>
              <div style={{ fontSize: 10, color: '#DDD6FE' }}>成就</div>
            </div>
          </div>
        </div>
      </div>

      {/* 直播锦标赛 */}
      {live && (
        <Link href={`/h5/game/tournament/${live.id}`} style={{ display: 'block', background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.20) 0%, rgba(219, 39, 119, 0.15) 100%)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid rgba(244, 114, 182, 0.40)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Flame size={12} color="#F472B6" />
            <span style={{ fontSize: 11, color: '#F472B6', fontWeight: 700 }}>🔥 LIVE</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>{live.participants}/{live.maxParticipants}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: live.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{live.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{live.name}</div>
              <div style={{ fontSize: 11, color: '#FCD535', fontWeight: 700, marginTop: 2 }}>{live.prizePool}</div>
            </div>
            <ChevronRight size={16} color="#F472B6" />
          </div>
        </Link>
      )}

      {/* 6 子入口 3×2 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 16, padding: '14px 8px', marginBottom: 12, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SUB.map(e => {
            const Icon = e.icon;
            return (
              <Link key={e.label} href={e.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '6px 0', textDecoration: 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${e.color}25`, border: `1px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={e.color} />
                </div>
                <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 500 }}>{e.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 精选游戏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <Crown size={12} color="#F0B90B" />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>精选游戏</span>
        <Link href="/h5/game/list" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {hot.slice(0, 4).map(g => (
          <Link key={g.id} href={`/h5/game/game/${g.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
            <div style={{ height: 90, background: g.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
              {g.emoji}
              {g.hot && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, padding: '1px 5px', borderRadius: 3, background: '#F472B6', color: '#0F1B3D', fontWeight: 700 }}>HOT</span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: '#7B89B8' }}>
                <Star size={9} color="#F0B90B" fill="#F0B90B" />{g.rating} · {g.players.toLocaleString()}人
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
