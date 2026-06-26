'use client';
/**
 * H5 福建老酒 - 渠道中心
 */
import Link from 'next/link';
import { Users, TrendingUp, Gift, ChevronRight, ArrowUpRight, Wallet, Star } from 'lucide-react';

const TEAM_MEMBERS = [
  { id: 1, name: '张*明', avatar: 'https://placehold.co/40x40/3B82F6/fff?text=张', level: 'V3', joinDate: '2024-03-15', sales: 128, status: 'active' },
  { id: 2, name: '李*华', avatar: 'https://placehold.co/40x40/10B981/fff?text=李', level: 'V2', joinDate: '2024-04-20', sales: 86, status: 'active' },
  { id: 3, name: '王*芳', avatar: 'https://placehold.co/40x40/F59E0B/fff?text=王', level: 'V2', joinDate: '2024-05-08', sales: 72, status: 'active' },
  { id: 4, name: '陈*强', avatar: 'https://placehold.co/40x40/EF4444/fff?text=陈', level: 'V1', joinDate: '2024-06-01', sales: 35, status: 'active' },
  { id: 5, name: '刘*燕', avatar: 'https://placehold.co/40x40/8B5CF6/fff?text=刘', level: 'V1', joinDate: '2024-06-10', sales: 23, status: 'inactive' },
];

const CHANNEL_LEVELS = [
  { level: 'V1', name: '初级合伙人', req: '累计销售 10 瓶', rate: '5%', color: '#94A3B8' },
  { level: 'V2', name: '中级合伙人', req: '累计销售 50 瓶', rate: '8%', color: '#22D3EE' },
  { level: 'V3', name: '高级合伙人', req: '累计销售 200 瓶', rate: '12%', color: '#A78BFA' },
  { level: 'V4', name: '战略合伙人', req: '累计销售 1000 瓶', rate: '15%', color: '#F0B90B' },
];

export default function H5ChannelPage() {
  return (
    <div style={{ padding: '12px', paddingBottom: 80, background: '#0F172A', minHeight: '100vh' }}>
      {/* 顶部标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Link href="/h5/shop" style={{ color: '#F8FAFC' }}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </Link>
        <span style={{ fontSize: 17, color: '#F8FAFC', fontWeight: 700 }}>渠道中心</span>
      </div>

      {/* 我的等级卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F0B90B 100%)',
        borderRadius: 16, padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 80, opacity: 0.1 }}>👑</div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={24} color="#FCD535" fill="#FCD535" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>我的等级</div>
              <div style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>V3 · 高级合伙人</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>128</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>累计销售(瓶)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#FCD535', fontWeight: 800 }}>12%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>分润比例</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#fff', fontWeight: 800 }}>18</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>团队人数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷数据 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Wallet size={16} color="#34D399" />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>累计分润</span>
          </div>
          <div style={{ fontSize: 22, color: '#34D399', fontWeight: 800 }}>¥8,650</div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
            <ArrowUpRight size={10} color="#10B981" style={{ display: 'inline' }} /> 本月 +¥2,340
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Users size={16} color="#A78BFA" />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>我的团队</span>
          </div>
          <div style={{ fontSize: 22, color: '#A78BFA', fontWeight: 800 }}>18 人</div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
            本月新增 5 人
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 10 }}>常用功能</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: Gift, label: '邀请好友', color: '#F472B6' },
            { icon: Wallet, label: '分润明细', color: '#34D399', href: '/h5/shop/profits' },
            { icon: Users, label: '团队管理', color: '#A78BFA' },
            { icon: TrendingUp, label: '业绩报表', color: '#F0B90B' },
          ].map((item, i) => {
            const Icon = item.icon;
            const content = (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={item.color} />
                </div>
                <span style={{ fontSize: 11, color: '#E2E8F0' }}>{item.label}</span>
              </div>
            );
            return item.href ? (
              <Link key={i} href={item.href} style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                {content}
              </Link>
            ) : (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* 渠道等级 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>渠道等级</span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>共 4 级</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {CHANNEL_LEVELS.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderBottom: i < CHANNEL_LEVELS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: l.level === 'V3' ? 'rgba(210,105,30,0.15)' : 'transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: `${l.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: l.color,
              }}>
                {l.level}
              </div>
              <div style={{ flex: 1, marginLeft: 12 }}>
                <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{l.req}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, color: l.color, fontWeight: 700 }}>{l.rate}</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>分润比例</div>
              </div>
              {l.level === 'V3' && (
                <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#D2691E', color: '#fff', fontWeight: 600 }}>
                  当前
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 团队成员 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>团队成员</span>
          <Link href="#" style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            查看全部 <ChevronRight size={14} />
          </Link>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {TEAM_MEMBERS.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderBottom: i < TEAM_MEMBERS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <img src={m.avatar} alt={m.name} style={{ width: 36, height: 36, borderRadius: 18 }} />
              <div style={{ flex: 1, marginLeft: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{m.name}</span>
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.2)', color: '#A78BFA', fontWeight: 600 }}>
                    {m.level}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>加入 {m.joinDate} · 销售 {m.sales} 瓶</div>
              </div>
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                background: m.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                color: m.status === 'active' ? '#10B981' : '#64748B',
              }}>
                {m.status === 'active' ? '活跃' : '待激活'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
