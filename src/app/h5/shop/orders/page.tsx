'use client';
import { useState } from 'react';
import { Package, Search, ChevronRight, Filter } from 'lucide-react';
import { getShopOrders } from '@/lib/h5-mock';

const STATUS_MAP = {
  all:       { label: '全部',  color: '#7B89B8' },
  pending:   { label: '待付款',color: '#F0B90B' },
  paid:      { label: '待发货',color: '#38BDF8' },
  shipped:   { label: '待收货',color: '#A78BFA' },
  completed: { label: '已完成',color: '#34D399' },
  cancelled: { label: '已取消',color: '#7B89B8' },
  refunding: { label: '退款中',color: '#F472B6' },
};

export default function H5ShopOrdersPage() {
  const [tab, setTab] = useState<keyof typeof STATUS_MAP>('all');
  const orders = getShopOrders();
  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);
  const counts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    paid:      orders.filter(o => o.status === 'paid').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Package size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>我的订单</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#7B89B8" />
          <Filter size={16} color="#A78BFA" />
        </span>
      </div>

      {/* 状态卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { k: 'pending', label: '待付款', count: counts.pending, color: '#F0B90B' },
          { k: 'paid',    label: '待发货', count: counts.paid,    color: '#38BDF8' },
          { k: 'shipped', label: '待收货', count: counts.shipped, color: '#A78BFA' },
          { k: 'review',  label: '待评价', count: 2,             color: '#F472B6' },
        ].map(it => (
          <div key={it.k} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '14px 8px', textAlign: 'center', position: 'relative' }}>
            {it.count > 0 && <span style={{ position: 'absolute', top: 6, right: 8, background: '#F472B6', color: '#0F1B3D', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{it.count}</span>}
            <div style={{ fontSize: 20, fontWeight: 700, color: it.color }}>{it.count}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{it.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '0 4px', overflowX: 'auto' }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const active = tab === k;
          return (
            <button key={k} onClick={() => setTab(k as keyof typeof STATUS_MAP)} style={{ background: 'transparent', border: 'none', color: active ? '#A78BFA' : '#7B89B8', fontSize: 12, fontWeight: active ? 700 : 400, padding: '8px 0', borderBottom: active ? '2px solid #A78BFA' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 订单列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <Package size={48} color="#7B89B8" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: '#C9D1E2' }}>暂无订单</div>
          </div>
        ) : filtered.map(o => {
          const s = STATUS_MAP[o.status];
          return (
            <div key={o.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#7B89B8' }}>订单号 {o.id}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${s.color}25`, color: s.color, fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: o.product.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{o.product.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product.name}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>×{o.qty} · {o.payMethod}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{o.createdAt}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F472B6' }}>¥{o.total}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                {o.status === 'pending' && <button style={{ background: 'transparent', border: '1px solid rgba(127, 137, 184, 0.3)', color: '#7B89B8', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>取消</button>}
                {o.status === 'shipped' && <button style={{ background: 'transparent', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38BDF8', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>查看物流</button>}
                {o.status === 'pending' && <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>付款</button>}
                {o.status === 'shipped' && <button style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', color: '#0F1B3D', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>确认收货</button>}
                {o.status === 'completed' && <button style={{ background: 'transparent', border: '1px solid rgba(52, 211, 153, 0.4)', color: '#34D399', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>评价</button>}
                <button style={{ background: 'transparent', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#A78BFA', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  详情<ChevronRight size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
