'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, ChevronLeft, Star, Zap, Gift, Lock, ChevronRight, Trophy } from 'lucide-react';

const memberLevels = [
  { level: 'LV1', name: '普通会员', color: '#94A3B8', min: 0, max: 999, discount: 0, fee: 0.2, icon: '🥉' },
  { level: 'LV2', name: '白银会员', color: '#C0C0C0', min: 1000, max: 4999, discount: 5, fee: 0.18, icon: '🥈' },
  { level: 'LV3', name: '黄金会员', color: '#FCD535', min: 5000, max: 19999, discount: 10, fee: 0.15, icon: '🥇' },
  { level: 'LV4', name: '铂金会员', color: '#E5E4E2', min: 20000, max: 49999, discount: 15, fee: 0.12, icon: '💎' },
  { level: 'LV5', name: '钻石会员', color: '#38BDF8', min: 50000, max: 99999, discount: 20, fee: 0.1, icon: '💠' },
  { level: 'LV6', name: '皇冠会员', color: '#F0B90B', min: 100000, max: null, discount: 25, fee: 0.08, icon: '👑' },
];

const benefits: Record<string, string[]> = {
  LV1: ['基础交易功能', '每日签到', '基础客服'],
  LV2: ['LV1权益', '手续费9.5折', '专属客服', '优先提现'],
  LV3: ['LV2权益', '手续费9折', '生日礼包', '专属活动', 'VIP通道'],
  LV4: ['LV3权益', '手续费8.5折', '专属理财顾问', '定制服务'],
  LV5: ['LV4权益', '1对1顾问', '优先上币权', '线下活动邀请'],
  LV6: ['LV5权益', '专属客户经理', '董事会列席权', '定制权益'],
};

const mockUser = { level: 'LV3', points: 8500, nextNeed: 11500 };

export default function H5Member() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'levels' | 'points' | 'benefits'>('levels');
  const current = memberLevels.find(l => l.level === mockUser.level)!;
  const next = memberLevels.find(l => l.min > mockUser.points);
  const progress = next ? (mockUser.points / next.min) * 100 : 100;

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* 顶部栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#F8FAFC', padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC' }}>会员中心</span>
      </div>

      {/* 当前等级卡片 */}
      <div style={{
        background: `linear-gradient(135deg, ${current.color}22, ${current.color}44)`,
        border: `1px solid ${current.color}55`,
        borderRadius: 16, padding: 18, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 40 }}>{current.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>{current.name}</div>
            <div style={{ fontSize: 12, color: '#7B89B8', marginTop: 2 }}>当前等级</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: current.color }}>{mockUser.points.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>积分</div>
          </div>
        </div>
        {next && (
          <>
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 6, background: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: current.color, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8', marginTop: 6 }}>
              <span>{current.name}</span>
              <span>距{next.name}还需 {mockUser.nextNeed.toLocaleString()} 积分</span>
            </div>
          </>
        )}
      </div>

      {/* 统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '当前折扣', value: `${current.discount}%`, color: '#34D399' },
          { label: '手续费率', value: `${(current.fee * 100).toFixed(1)}%`, color: '#38BDF8' },
          { label: '积分排名', value: 'Top 15%', color: '#FCD535' },
        ].map(item => (
          <div key={item.label} style={{ background: 'rgba(148,163,184,0.08)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'levels' as const, label: '等级', icon: Trophy },
          { key: 'points' as const, label: '积分', icon: Star },
          { key: 'benefits' as const, label: '权益', icon: Zap },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? 'linear-gradient(135deg, #38BDF8, #1E40AF)' : 'rgba(148,163,184,0.08)',
              color: activeTab === tab.key ? '#fff' : '#7B89B8', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* 等级列表 */}
      {activeTab === 'levels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memberLevels.map(lvl => {
            const isCurrent = lvl.level === mockUser.level;
            const isNext = lvl.level === next?.level;
            return (
              <div key={lvl.level} style={{
                background: isCurrent ? `${lvl.color}15` : 'rgba(148,163,184,0.06)',
                border: `1px solid ${isCurrent ? lvl.color + '50' : 'rgba(148,163,184,0.12)'}`,
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{lvl.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{lvl.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: lvl.color + '25', color: lvl.color, fontWeight: 700 }}>{lvl.level}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
                      {lvl.min.toLocaleString()} ~ {lvl.max?.toLocaleString() || '∞'} 积分
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>{lvl.discount}%折扣</div>
                    <div style={{ fontSize: 11, color: '#7B89B8' }}>手续费{(lvl.fee * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {isCurrent && <div style={{ marginTop: 8, fontSize: 11, color: lvl.color, textAlign: 'center' }}>✦ 当前等级</div>}
                {isNext && <div style={{ marginTop: 8, fontSize: 11, color: '#38BDF8', textAlign: 'center' }}>▲ 下一等级</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* 积分 */}
      {activeTab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { action: '交易手续费返积分', amount: '+150', time: '05-13 14:30', type: 'earn' },
            { action: '每日签到', amount: '+10', time: '05-13 09:00', type: 'earn' },
            { action: '兑换VIP特权', amount: '-500', time: '05-12 18:20', type: 'spend' },
            { action: '邀请用户奖励', amount: '+1000', time: '05-11 10:00', type: 'earn' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(148,163,184,0.06)', borderRadius: 12, padding: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: item.type === 'earn' ? 'rgba(52,211,153,0.15)' : 'rgba(244,114,182,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.type === 'earn' ? <Gift size={16} color="#34D399" /> : <Star size={16} color="#F472B6" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{item.action}</div>
                <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{item.time}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.type === 'earn' ? '#34D399' : '#F472B6' }}>{item.amount}</div>
            </div>
          ))}
        </div>
      )}

      {/* 权益 */}
      {activeTab === 'benefits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {memberLevels.map(lvl => {
            const isCurrent = lvl.level === mockUser.level;
            const isUnlocked = memberLevels.findIndex(l => l.level === lvl.level) <= memberLevels.findIndex(l => l.level === mockUser.level);
            return (
              <div key={lvl.level} style={{
                background: isCurrent ? `${lvl.color}12` : 'rgba(148,163,184,0.06)',
                border: `1px solid ${isCurrent ? lvl.color + '40' : 'rgba(148,163,184,0.10)'}`,
                borderRadius: 12, padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{lvl.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{lvl.name}</span>
                  {!isUnlocked && <Lock size={14} color="#7B89B8" />}
                  {isCurrent && <span style={{ marginLeft: 'auto', fontSize: 11, color: lvl.color, fontWeight: 700 }}>当前</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {benefits[lvl.level].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: isUnlocked ? '#B4C0E0' : '#4B5563' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: isUnlocked ? '#34D399' : '#4B5563' }} />
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
