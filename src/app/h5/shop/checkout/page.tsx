'use client';
import { useState } from 'react';
import {
  CreditCard, MapPin, Tag, ChevronRight, Wallet, Smartphone, Banknote, Bitcoin, Check, Shield, ShoppingBag,
} from 'lucide-react';
import { getShopProducts } from '@/lib/h5-mock';

export default function H5ShopCheckoutPage() {
  const products = getShopProducts();
  const items = [
    { productId: 'SP-001', qty: 1 },
    { productId: 'SP-005', qty: 1 },
  ];
  const list = items.map(i => ({ ...i, product: products.find(p => p.id === i.productId)! }));
  const subtotal = list.reduce((s, i) => s + parseFloat(i.product.price) * i.qty, 0);
  const shipping = 0;
  const discount = 200;
  const final = subtotal - discount + shipping;

  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat' | 'usdt' | 'card'>('alipay');

  const addresses = [
    { id: 'A-1', name: '张先生', phone: '138****8888', area: '上海市浦东新区世纪大道 100 号', tag: '家', default: true },
  ];

  return (
    <div style={{ padding: '12px', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <CreditCard size={16} color="#F0B90B" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>订单结算</span>
      </div>

      {/* 收货地址 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <MapPin size={12} color="#F0B90B" />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>收货地址</span>
        </div>
        {addresses.map(a => (
          <div key={a.id} style={{ background: 'rgba(240, 185, 11, 0.05)', border: '1px solid rgba(240, 185, 11, 0.2)', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{a.name}</span>
              <span style={{ fontSize: 12, color: '#C9D1E2' }}>{a.phone}</span>
              {a.default && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(240, 185, 11, 0.15)', color: '#F0B90B', fontWeight: 600 }}>默认</span>}
              <ChevronRight size={14} color="#7B89B8" style={{ marginLeft: 'auto' }} />
            </div>
            <div style={{ fontSize: 12, color: '#C9D1E2', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.15)', color: '#F472B6', fontWeight: 600, flexShrink: 0, marginTop: 2 }}>{a.tag}</span>
              {a.area}
            </div>
          </div>
        ))}
      </div>

      {/* 商品列表 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <ShoppingBag size={12} color="#F472B6" />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>商品列表 ({list.length})</span>
        </div>
        {list.map(it => (
          <div key={it.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(127, 137, 184, 0.08)' }}>
            <div style={{ width: 50, height: 50, borderRadius: 8, background: it.product.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{it.product.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>×{it.qty}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F472B6' }}>¥{(parseFloat(it.product.price) * it.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* 优惠 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center' }}>
        <Tag size={14} color="#F0B90B" />
        <span style={{ fontSize: 12, color: '#F8FAFC', marginLeft: 8 }}>优惠券</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#FCD535', fontWeight: 600 }}>满 1000 减 100</span>
        <ChevronRight size={14} color="#7B89B8" style={{ marginLeft: 4 }} />
      </div>

      {/* 配送 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#F8FAFC' }}>配送方式</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#34D399', fontWeight: 600 }}>顺丰包邮</span>
      </div>

      {/* 支付方式 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Wallet size={12} color="#34D399" />
          <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>支付方式</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { k: 'alipay', icon: Smartphone, label: '支付宝',  color: '#38BDF8' },
            { k: 'wechat', icon: Smartphone, label: '微信支付',color: '#34D399' },
            { k: 'usdt',   icon: Bitcoin,    label: 'USDT',    color: '#F0B90B' },
            { k: 'card',   icon: Banknote,   label: '银行卡',  color: '#A78BFA' },
          ].map(it => {
            const Icon = it.icon;
            const active = payMethod === it.k;
            return (
              <button key={it.k} onClick={() => setPayMethod(it.k as 'alipay' | 'wechat' | 'usdt' | 'card')} style={{ background: active ? `${it.color}20` : 'rgba(127, 137, 184, 0.08)', border: active ? `1.5px solid ${it.color}` : '1.5px solid rgba(127, 137, 184, 0.15)', borderRadius: 10, padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={18} color={it.color} />
                <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{it.label}</span>
                {active && <Check size={12} color={it.color} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 金额明细 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>商品金额</span>
          <span style={{ color: '#F8FAFC' }}>¥{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>运费</span>
          <span style={{ color: '#34D399' }}>¥0.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>优惠</span>
          <span style={{ color: '#FCD535' }}>-¥{discount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14, fontWeight: 700, borderTop: '1px solid rgba(127, 137, 184, 0.15)' }}>
          <span style={{ color: '#F8FAFC' }}>实付</span>
          <span style={{ color: '#F472B6', fontSize: 18 }}>¥{final.toFixed(2)}</span>
        </div>
      </div>

      {/* 安全保障 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, fontSize: 10, color: '#7B89B8' }}>
        <Shield size={11} color="#34D399" />
        <span>交易由 ZS 担保，安全保障</span>
      </div>

      {/* 底部提交 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(15, 27, 61, 0.95)', backdropFilter: 'blur(20px)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(127, 137, 184, 0.15)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>实付</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F472B6' }}>¥{final.toFixed(2)}</div>
        </div>
        <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700 }}>
          提交订单
        </button>
      </div>
    </div>
  );
}
