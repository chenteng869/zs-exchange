'use client';
import { useState } from 'react';
import {
  Handshake, ChevronRight, BadgeCheck, Star, Clock, Search, Filter, TrendingUp, ShieldCheck, Users, MessageCircle, Zap,
} from 'lucide-react';
import { getOtcMerchants } from '@/lib/h5-mock';

const VIP_COLOR = { diamond: '#A78BFA', platinum: '#38BDF8', gold: '#FCD535', normal: '#7B89B8' };
const VIP_LABEL = { diamond: '钻石', platinum: '白金', gold: '黄金', normal: '普通' };

export default function H5OtcMarketPage() {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const merchants = getOtcMerchants();

  const stats = {
    merchants: 8240,
    volume24h: '$12.5M',
    orders: 45280,
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#34D399', borderRadius: 2 }} />
        <Handshake size={16} color="#34D399" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>OTC 集市</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', fontWeight: 600 }}>P2P</span>
      </div>

      {/* 平台数据 */}
      <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 238, 0.30) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ShieldCheck size={14} color="#FCD535" />
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>OTC 平台担保</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>商家数</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.merchants.toLocaleString()}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>24h 交易</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.volume24h}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>累计订单</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{stats.orders.toLocaleString()}</div></div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: TrendingUp,    label: '买币',  color: '#34D399', href: '/h5/otc/buy' },
          { icon: Zap,           label: '卖币',  color: '#F472B6', href: '/h5/otc/sell' },
          { icon: Users,         label: '我的订单', color: '#38BDF8', href: '/h5/otc/orders' },
          { icon: MessageCircle, label: '客服',  color: '#A78BFA', href: '/h5/otc/chat' },
        ].map((it, i) => {
          const Icon = it.icon;
          return (
            <a key={i} href={it.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${it.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={it.color} />
              </div>
              <span style={{ fontSize: 10, color: '#F8FAFC', fontWeight: 600 }}>{it.label}</span>
            </a>
          );
        })}
      </div>

      {/* 买卖 Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'buy', label: '我要买币' },
          { v: 'sell', label: '我要卖币' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'buy' | 'sell')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', background: tab === t.v ? (t.v === 'buy' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)') : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Search size={12} color="#7B89B8" />
          <input placeholder="搜索商家" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, fontFamily: 'inherit' }} />
        </div>
        <button style={{ padding: '0 10px', background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)', color: '#7B89B8', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 商家列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {merchants.filter(m => m.online).map(m => (
          <a key={m.id} href={`/h5/otc/merchant/${m.id}`} style={{ display: 'block', padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
                <div style={{ position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: '50%', background: '#34D399', border: '2px solid #131E45' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{m.name}</span>
                  {m.verified && <BadgeCheck size={12} color="#38BDF8" />}
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${VIP_COLOR[m.vipLevel]}26`, color: VIP_COLOR[m.vipLevel], fontWeight: 700 }}>{VIP_LABEL[m.vipLevel]}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>完成 {m.completedOrders.toLocaleString()}</span>
                  <span>·</span>
                  <span>{m.completionRate}</span>
                  <span>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={9} color="#FCD535" />{m.rating}</span>
                </div>
              </div>
              <ChevronRight size={14} color="#7B89B8" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 8, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 8, fontSize: 10 }}>
              <div>
                <div style={{ color: '#7B89B8' }}>价格</div>
                <div style={{ color: tab === 'buy' ? '#FCD535' : '#F472B6', fontWeight: 700, fontSize: 12 }}>¥{tab === 'buy' ? '7.18' : '7.15'}</div>
              </div>
              <div>
                <div style={{ color: '#7B89B8' }}>限额</div>
                <div style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 11 }}>1K-50K</div>
              </div>
              <div>
                <div style={{ color: '#7B89B8' }}>放币</div>
                <div style={{ color: '#34D399', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={9} />{m.avgReleaseTime}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
