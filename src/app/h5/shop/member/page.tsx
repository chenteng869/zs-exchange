'use client';
/**
 * H5 福建老酒 - 会员中心
 */
import Link from 'next/link';
import { ChevronRight, Crown, Star, Gift, TrendingUp, Wallet, ShieldCheck, Phone } from 'lucide-react';

const MEMBER_INFO = {
  name: '张三',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
  level: 'V3',
  levelName: '高级合伙人',
  totalOrders: 28,
  totalSpent: 18650,
  points: 3680,
  coupons: 5,
  joinDate: '2024-03-15',
};

const LEVEL_BENEFITS = [
  { level: 'V1', name: '初级合伙人', discount: '95折', points: '1倍积分', coupon: '每月1张', color: '#94A3B8' },
  { level: 'V2', name: '中级合伙人', discount: '9折', points: '1.5倍积分', coupon: '每月3张', color: '#22D3EE' },
  { level: 'V3', name: '高级合伙人', discount: '85折', points: '2倍积分', coupon: '每月5张', color: '#A78BFA' },
  { level: 'V4', name: '战略合伙人', discount: '8折', points: '3倍积分', coupon: '每月10张', color: '#F0B90B' },
];

const BENEFITS = [
  { icon: TrendingUp, title: '专属折扣', desc: '全场商品享85折优惠', color: '#F0B90B' },
  { icon: Gift, title: '生日礼包', desc: '生日当月赠送精美礼品', color: '#F472B6' },
  { icon: Wallet, title: '积分兑换', desc: '积分可兑换商品或优惠券', color: '#34D399' },
  { icon: ShieldCheck, title: '优先发货', desc: '订单优先处理，极速发货', color: '#22D3EE' },
];

const ORDER_STATS = [
  { label: '待付款', count: 2 },
  { label: '待发货', count: 1 },
  { label: '待收货', count: 3 },
  { label: '已完成', count: 22 },
];

export default function H5MemberPage() {
  return (
    <div style={{ padding: '12px', paddingBottom: 80, background: '#0F172A', minHeight: '100vh' }}>
      {/* 顶部标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Link href="/h5/shop" style={{ color: '#F8FAFC' }}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </Link>
        <span style={{ fontSize: 17, color: '#F8FAFC', fontWeight: 700 }}>会员中心</span>
      </div>

      {/* 会员卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F0B90B 100%)',
        borderRadius: 16, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 100, opacity: 0.1 }}>👑</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={MEMBER_INFO.avatar} alt={MEMBER_INFO.name} style={{ width: 60, height: 60, borderRadius: 30, border: '3px solid rgba(255,255,255,0.3)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, color: '#fff', fontWeight: 700 }}>{MEMBER_INFO.name}</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }}>
                {MEMBER_INFO.level} · {MEMBER_INFO.levelName}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
              入会时间：{MEMBER_INFO.joinDate}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, color: '#FCD535', fontWeight: 800 }}>{MEMBER_INFO.points}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>积分</div>
              </div>
              <div>
                <div style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>{MEMBER_INFO.coupons}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>优惠券</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 订单状态 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {ORDER_STATS.map((item, i) => (
          <Link key={i} href="/h5/shop/orders" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 4px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 20, color: '#FCD535', fontWeight: 800 }}>{item.count}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{item.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 会员权益 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 10 }}>会员权益</div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', padding: '14px',
                borderBottom: i < BENEFITS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${b.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={b.color} />
                </div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{b.desc}</div>
                </div>
                <ChevronRight size={16} color="#64748B" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 等级权益对比 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>等级权益</span>
          <Link href="#" style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'none' }}>查看全部</Link>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {LEVEL_BENEFITS.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderBottom: i < LEVEL_BENEFITS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              background: l.level === 'V3' ? 'rgba(167,139,250,0.1)' : 'transparent',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${l.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: l.color }}>
                {l.level}
              </div>
              <div style={{ flex: 1, marginLeft: 10 }}>
                <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{l.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: l.color, fontWeight: 600 }}>{l.discount}</div>
                  <div style={{ color: '#64748B', marginTop: 1 }}>折扣</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: l.color, fontWeight: 600 }}>{l.points}</div>
                  <div style={{ color: '#64748B', marginTop: 1 }}>积分</div>
                </div>
              </div>
              {l.level === 'V3' && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#A78BFA', color: '#fff', fontWeight: 600, marginLeft: 8 }}>当前</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 会员统计 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 10 }}>我的数据</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>累计消费</div>
            <div style={{ fontSize: 20, color: '#FCD535', fontWeight: 800 }}>¥{MEMBER_INFO.totalSpent.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>订单总数</div>
            <div style={{ fontSize: 20, color: '#A78BFA', fontWeight: 800 }}>{MEMBER_INFO.totalOrders} 单</div>
          </div>
        </div>
      </div>

      {/* 设置入口 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {[
          { icon: Phone, label: '联系客服' },
          { icon: ShieldCheck, label: '账号安全' },
          { icon: Gift, label: '优惠券中心' },
          { icon: Crown, label: '会员协议' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '14px',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <Icon size={18} color="#94A3B8" />
              <span style={{ flex: 1, marginLeft: 12, fontSize: 13, color: '#E2E8F0' }}>{item.label}</span>
              <ChevronRight size={16} color="#64748B" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
