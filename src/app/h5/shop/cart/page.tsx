'use client';
import { useState } from 'react';
import {
  ShoppingCart, Trash2, Minus, Plus, ChevronRight, ShoppingBag, Tag,
} from 'lucide-react';
import { getShopProducts } from '@/lib/h5-mock';

interface CartItem {
  id: string;
  productId: string;
  qty: number;
  selected: boolean;
}

const INIT: CartItem[] = [
  { id: 'C-1', productId: 'SP-001', qty: 1, selected: true },
  { id: 'C-2', productId: 'SP-005', qty: 1, selected: true },
  { id: 'C-3', productId: 'SP-004', qty: 2, selected: false },
];

export default function H5ShopCartPage() {
  const products = getShopProducts();
  const [items, setItems] = useState<CartItem[]>(INIT);
  const [coupon, setCoupon] = useState('新人专享 9 折');
  const [editing, setEditing] = useState(false);

  const list = items.map(i => ({ ...i, product: products.find(p => p.id === i.productId)! })).filter(i => i.product);
  const selected = list.filter(i => i.selected);
  const totalQty = selected.reduce((s, i) => s + i.qty, 0);
  const totalPrice = selected.reduce((s, i) => s + parseFloat(i.product.price) * i.qty, 0);
  const discount = totalPrice * 0.1;
  const finalPrice = totalPrice - discount;

  const updateQty = (id: string, delta: number) => {
    setItems(items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const toggle = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };
  const remove = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };
  const allSelected = items.length > 0 && items.every(i => i.selected);
  const toggleAll = () => {
    setItems(items.map(i => ({ ...i, selected: !allSelected })));
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <ShoppingCart size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>购物车</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.15)', color: '#F472B6' }}>{items.length} 件</span>
      </div>

      {/* 优惠提示 */}
      {selected.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(252, 213, 53, 0.05) 100%)', borderRadius: 12, padding: 10, marginBottom: 12, border: '1px solid rgba(240, 185, 11, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={14} color="#F0B90B" />
          <span style={{ fontSize: 12, color: '#FCD535' }}>{coupon}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>已减 ¥{discount.toFixed(2)}</span>
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="#7B89B8" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, color: '#C9D1E2', marginBottom: 6 }}>购物车空空如也</div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>去逛逛商城吧</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(it => (
            <div key={it.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 10, opacity: it.selected ? 1 : 0.6 }}>
              <button onClick={() => toggle(it.id)} style={{ width: 20, height: 20, borderRadius: 10, background: it.selected ? 'linear-gradient(135deg, #F472B6 0%, #F0B90B 100%)' : 'transparent', border: it.selected ? 'none' : '1.5px solid #7B89B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {it.selected && <span style={{ color: '#0F1B3D', fontSize: 10, fontWeight: 700 }}>✓</span>}
              </button>
              <div style={{ width: 60, height: 60, borderRadius: 10, background: it.product.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{it.product.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product.name}</div>
                <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{it.product.tags.join(' · ')}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F472B6' }}>¥{it.product.price}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateQty(it.id, -1)} style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(127, 137, 184, 0.15)', border: 'none', color: '#F8FAFC', cursor: 'pointer' }}>
                      <Minus size={10} style={{ margin: '0 auto' }} />
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', minWidth: 18, textAlign: 'center' }}>{it.qty}</span>
                    <button onClick={() => updateQty(it.id, 1)} style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(244, 114, 182, 0.2)', border: 'none', color: '#F472B6', cursor: 'pointer' }}>
                      <Plus size={10} style={{ margin: '0 auto' }} />
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => remove(it.id)} style={{ background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 猜你喜欢 */}
      {list.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 0 8px' }}>
            <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>猜你喜欢</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>换一批 ›</span>
          </div>
          <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 8, background: products[2].cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{products[2].emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{products[2].name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F472B6', marginTop: 4 }}>¥{products[2].price}</div>
            </div>
            <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700 }}>加购</button>
          </div>
        </>
      )}

      {/* 底部结算 */}
      {list.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(15, 27, 61, 0.95)', backdropFilter: 'blur(20px)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(127, 137, 184, 0.15)' }}>
          <button onClick={toggleAll} style={{ width: 20, height: 20, borderRadius: 10, background: allSelected ? 'linear-gradient(135deg, #F472B6 0%, #F0B90B 100%)' : 'transparent', border: allSelected ? 'none' : '1.5px solid #7B89B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {allSelected && <span style={{ color: '#0F1B3D', fontSize: 10, fontWeight: 700 }}>✓</span>}
          </button>
          <span style={{ fontSize: 12, color: '#F8FAFC' }}>全选</span>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>合计 <span style={{ fontSize: 18, fontWeight: 700, color: '#F472B6' }}>¥{finalPrice.toFixed(2)}</span></div>
            <div style={{ fontSize: 9, color: '#7B89B8' }}>已优惠 ¥{discount.toFixed(2)}</div>
          </div>
          <button style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}>
            结算 ({totalQty})
          </button>
        </div>
      )}
    </div>
  );
}
