'use client';
import { useState } from 'react';
import {
  Handshake, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, MessageCircle, RefreshCw, Filter,
} from 'lucide-react';
import { getOtcOrders } from '@/lib/h5-mock';

const STATUS_MAP = {
  pending:   { label: '待付款',  color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)', icon: Clock },
  paid:      { label: '已付款',  color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', icon: CheckCircle2 },
  released:  { label: '已完成',  color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', icon: CheckCircle2 },
  cancelled: { label: '已取消',  color: '#7B89B8', bg: 'rgba(148, 163, 184, 0.15)', icon: XCircle },
  appealing: { label: '申诉中',  color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)', icon: AlertCircle },
};

export default function H5OtcOrdersPage() {
  const [tab, setTab] = useState<'all' | 'pending' | 'released'>('all');
  const orders = getOtcOrders();

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
    released: orders.filter(o => o.status === 'released').length,
    volume: orders.reduce((acc, o) => acc + parseFloat(o.total), 0).toFixed(0),
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <a href="/h5/otc/market" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7B89B8', textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> 返回集市
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#34D399', borderRadius: 2 }} />
        <Handshake size={16} color="#34D399" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>我的 OTC 订单</span>
      </div>

      {/* 统计 */}
      <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 238, 0.30) 0%, transparent 70%)' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginBottom: 4 }}>累计成交 (CNY)</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums', position: 'relative' }}>¥ {stats.volume}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>总订单</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.total}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>进行中</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F0B90B', marginTop: 2 }}>{stats.pending}</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>已完成</div><div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', marginTop: 2 }}>{stats.released}</div></div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'all', label: '全部' },
          { v: 'pending', label: '进行中' },
          { v: 'released', label: '已完成' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'all' | 'pending' | 'released')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'transparent', color: tab === t.v ? '#0F1B3D' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
        <button style={{ padding: '6px 8px', background: 'transparent', color: '#7B89B8', border: 'none', cursor: 'pointer' }}>
          <Filter size={14} />
        </button>
      </div>

      {/* 订单列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.filter(o => tab === 'all' || (tab === 'pending' ? (o.status === 'pending' || o.status === 'paid' || o.status === 'appealing') : o.status === tab)).map(o => {
          const s = STATUS_MAP[o.status];
          const Icon = s.icon;
          return (
            <div key={o.id} style={{ padding: 12, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: '#7B89B8', fontFamily: 'monospace' }}>#{o.id}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 700 }}>
                  <Icon size={10} /> {s.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: o.type === 'buy' ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: o.type === 'buy' ? '#34D399' : '#F472B6' }}>{o.type === 'buy' ? '买' : '卖'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{o.amount} {o.asset}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>单价 ¥{o.price} · {o.merchant}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>¥{o.total}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#7B89B8', padding: '6px 0', borderTop: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <span>下单 {o.createdAt}</span>
                <span>{o.expiresIn !== '已完成' && o.expiresIn !== '已取消' && o.expiresIn !== '待放币' && o.expiresIn !== '申诉中' ? <span style={{ color: '#F0B90B' }}>剩余 {o.expiresIn}</span> : o.expiresIn}</span>
              </div>
              {(o.status === 'pending' || o.status === 'paid') && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button style={{ flex: 1, padding: '8px 0', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.30)', color: '#38BDF8', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <MessageCircle size={11} /> 聊天
                  </button>
                  <button style={{ flex: 1, padding: '8px 0', background: 'rgba(240, 185, 11, 0.15)', border: '1px solid rgba(240, 185, 11, 0.30)', color: '#F0B90B', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <RefreshCw size={11} /> {o.status === 'pending' ? '去付款' : '确认放币'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
