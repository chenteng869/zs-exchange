'use client';
import { useState } from 'react';
import { Tag, ChevronRight, Check, Gift, Percent, Truck, Clock } from 'lucide-react';
import { getCoupons } from '@/lib/h5-mock';

const TYPE_MAP = {
  all:       { label: '全部',  color: '#F0B90B' },
  unused:    { label: '未使用',color: '#34D399' },
  used:      { label: '已使用',color: '#7B89B8' },
  expired:   { label: '已过期',color: '#F472B6' },
};

const TYPE_ICON = {
  discount: Percent,
  cash:     Gift,
  shipping: Truck,
};

const TYPE_LABEL = {
  discount: '折扣',
  cash:     '满减',
  shipping: '运费',
};

export default function H5ShopCouponsPage() {
  const [tab, setTab] = useState<keyof typeof TYPE_MAP>('all');
  const coupons = getCoupons();
  const filtered = tab === 'all' ? coupons : coupons.filter(c => c.status === tab);
  const unused = coupons.filter(c => c.status === 'unused').length;
  const totalValue = coupons.filter(c => c.status === 'unused').reduce((s, c) => s + (parseInt(c.value.replace(/[^\d]/g, '') || '0') || 0), 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <Tag size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>优惠券</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B' }}>{unused} 张</span>
      </div>

      {/* 概览 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(244, 114, 182, 0.10) 100%)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid rgba(240, 185, 11, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Gift size={20} color="#F0B90B" />
          <div style={{ marginLeft: 10 }}>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>优惠券总值</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0B90B' }}>¥{totalValue}+</div>
          </div>
          <button style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            领券中心 <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '0 4px' }}>
        {Object.entries(TYPE_MAP).map(([k, v]) => {
          const active = tab === k;
          return (
            <button key={k} onClick={() => setTab(k as keyof typeof TYPE_MAP)} style={{ background: 'transparent', border: 'none', color: active ? '#F0B90B' : '#7B89B8', fontSize: 12, fontWeight: active ? 700 : 400, padding: '8px 0', borderBottom: active ? '2px solid #F0B90B' : '2px solid transparent', cursor: 'pointer' }}>{v.label}</button>
          );
        })}
      </div>

      {/* 券列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <Tag size={48} color="#7B89B8" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: '#C9D1E2' }}>暂无优惠券</div>
          </div>
        ) : filtered.map(c => {
          const Icon = TYPE_ICON[c.type];
          const isUnused = c.status === 'unused';
          return (
            <div key={c.id} style={{ display: 'flex', background: isUnused ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.20) 0%, rgba(244, 114, 182, 0.15) 100%)' : 'linear-gradient(135deg, rgba(127, 137, 184, 0.10) 0%, rgba(127, 137, 184, 0.05) 100%)', borderRadius: 12, overflow: 'hidden', border: isUnused ? '1px solid rgba(240, 185, 11, 0.3)' : '1px solid rgba(127, 137, 184, 0.1)', opacity: c.status === 'expired' ? 0.5 : 1 }}>
              <div style={{ width: 100, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px dashed rgba(127, 137, 184, 0.3)' }}>
                <Icon size={20} color={isUnused ? '#F0B90B' : '#7B89B8'} />
                <div style={{ fontSize: 18, fontWeight: 800, color: isUnused ? '#F0B90B' : '#7B89B8', marginTop: 4, textAlign: 'center' }}>{c.value}</div>
                <div style={{ fontSize: 9, color: isUnused ? '#FCD535' : '#7B89B8', marginTop: 2 }}>{TYPE_LABEL[c.type]}</div>
              </div>
              <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isUnused ? '#F8FAFC' : '#7B89B8' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: isUnused ? '#C9D1E2' : '#7B89B8', marginTop: 4 }}>适用范围：{c.scope}</div>
                  <div style={{ fontSize: 10, color: isUnused ? '#C9D1E2' : '#7B89B8', marginTop: 2 }}>使用门槛：{c.minSpend}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#7B89B8' }}>
                    <Clock size={9} />{c.expiresAt} 到期
                  </div>
                  {isUnused ? (
                    <button style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      去使用 <ChevronRight size={10} />
                    </button>
                  ) : (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: c.status === 'used' ? '#34D399' : '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {c.status === 'used' && <><Check size={10} />已使用</>}
                      {c.status === 'expired' && '已过期'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
