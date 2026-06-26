'use client';
/**
 * OTC 模块首页 - 法币交易
 */
import Link from 'next/link';
import {
  Handshake, ShieldCheck, ChevronRight, Users, CheckCircle2, Star, MessageCircle, Banknote,
} from 'lucide-react';
import { getOtcMerchants } from '@/lib/h5-mock';

export default function H5OtcHomePage() {
  const merchants = getOtcMerchants();
  const online = merchants.filter(m => m.online);
  const diamond = merchants.filter(m => m.vipLevel === 'diamond');

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(4, 120, 87, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Handshake size={18} color="#34D399" />
            <span style={{ fontSize: 14, color: '#A7F3D0', fontWeight: 600 }}>OTC 法币交易</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.20)', color: '#34D399', fontWeight: 600 }}>
              <ShieldCheck size={9} style={{ display: 'inline', marginRight: 2 }} />担保
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 12 }}>在线商家 · 完成率</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{online.length}</div>
              <div style={{ fontSize: 10, color: '#A7F3D0' }}>在线</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>99.5%</div>
              <div style={{ fontSize: 10, color: '#A7F3D0' }}>平均完成率</div>
            </div>
          </div>
        </div>
      </div>

      {/* 主操作 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Link href="/h5/otc/buy" style={{ background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.30) 0%, rgba(4, 120, 87, 0.20) 100%)', border: '1px solid rgba(52, 211, 153, 0.40)', borderRadius: 14, padding: 16, textAlign: 'center', textDecoration: 'none' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
          <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 2 }}>我要买币</div>
          <div style={{ fontSize: 10, color: '#A7F3D0' }}>USDT / BTC / ETH</div>
        </Link>
        <Link href="/h5/otc/sell" style={{ background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.30) 0%, rgba(219, 39, 119, 0.20) 100%)', border: '1px solid rgba(244, 114, 182, 0.40)', borderRadius: 14, padding: 16, textAlign: 'center', textDecoration: 'none' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>💸</div>
          <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 2 }}>我要卖币</div>
          <div style={{ fontSize: 10, color: '#FBCFE8' }}>出售给商家</div>
        </Link>
      </div>

      {/* 子入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: Users,        label: 'OTC 市场',   color: '#34D399', href: '/h5/otc/market' },
          { icon: Banknote,     label: '我的订单',   color: '#A78BFA', href: '/h5/otc/orders' },
          { icon: ShieldCheck,  label: '担保交易',   color: '#38BDF8', href: '/h5/otc/market' },
          { icon: MessageCircle,label: '联系客服',   color: '#F0B90B', href: '/h5/otc/chat' },
        ].map(e => {
          const Icon = e.icon;
          return (
            <Link key={e.label} href={e.href} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${e.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={e.color} />
              </div>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{e.label}</div>
            </Link>
          );
        })}
      </div>

      {/* 认证商家 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #34D399 0%, #10B981 100%)', borderRadius: 2 }} />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>认证商家</span>
        <Link href="/h5/otc/market" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {merchants.slice(0, 4).map(m => {
          const vipColor = m.vipLevel === 'diamond' ? '#22D3EE' : m.vipLevel === 'platinum' ? '#A78BFA' : m.vipLevel === 'gold' ? '#F0B90B' : '#7B89B8';
          const vipLabel = m.vipLevel === 'diamond' ? '💎 钻石' : m.vipLevel === 'platinum' ? '💠 铂金' : m.vipLevel === 'gold' ? '🥇 黄金' : '普通';
          return (
            <Link key={m.id} href={`/h5/otc/merchant/${m.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: `linear-gradient(135deg, ${vipColor} 0%, #0F1B3D 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#0F1B3D' }}>{m.avatar}</div>
                {m.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, background: '#34D399', border: '2px solid #0F1B3D' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{m.name}</span>
                  {m.verified && <CheckCircle2 size={11} color="#38BDF8" />}
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${vipColor}20`, color: vipColor, fontWeight: 600 }}>{vipLabel}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={9} color="#F0B90B" fill="#F0B90B" />{m.rating}</span>
                  <span>{m.completedOrders.toLocaleString()} 单</span>
                  <span style={{ color: '#34D399' }}>{m.completionRate}</span>
                </div>
              </div>
              <ChevronRight size={14} color="#7B89B8" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
