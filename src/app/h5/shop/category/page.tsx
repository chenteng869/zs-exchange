'use client';
import { useState } from 'react';
import { Grid3x3, Star, ChevronRight, ShoppingBag, Filter } from 'lucide-react';
import { getShopProducts } from '@/lib/h5-mock';

const CATEGORIES = [
  { id: 'all',      name: '全部',  emoji: '🛍️', color: '#F472B6' },
  { id: 'physical', name: '实物',  emoji: '📦', color: '#38BDF8' },
  { id: 'digital',  name: '数字',  emoji: '💎', color: '#A78BFA' },
  { id: 'service',  name: '服务',  emoji: '🎓', color: '#F0B90B' },
  { id: 'gift',     name: '礼品',  emoji: '🎁', color: '#F472B6' },
];

const SORTS = [
  { k: 'default', label: '综合' },
  { k: 'sold',    label: '销量' },
  { k: 'price',   label: '价格' },
  { k: 'new',     label: '最新' },
];

export default function H5ShopCategoryPage() {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('default');
  const all = getShopProducts();
  const list = cat === 'all' ? all : all.filter(p => p.category === cat);
  const sorted = [...list].sort((a, b) => {
    if (sort === 'sold') return b.sold - a.sold;
    if (sort === 'price') return parseInt(a.price) - parseInt(b.price);
    if (sort === 'new') return (b.new ? 1 : 0) - (a.new ? 1 : 0);
    return 0;
  });

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <Grid3x3 size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>商品分类</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.15)', color: '#F472B6' }}>{list.length} 件</span>
      </div>

      {/* 横向分类 */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, paddingBottom: 4 }}>
        {CATEGORIES.map(c => {
          const active = cat === c.id;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 10, background: active ? `${c.color}25` : 'rgba(26, 36, 86, 0.45)', border: active ? `1px solid ${c.color}` : '1px solid rgba(127, 137, 184, 0.12)', color: active ? c.color : '#7B89B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <span style={{ fontSize: 14 }}>{c.emoji}</span>{c.name}
            </button>
          );
        })}
      </div>

      {/* 排序 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '8px 12px', background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 10 }}>
        {SORTS.map(s => {
          const active = sort === s.k;
          return (
            <button key={s.k} onClick={() => setSort(s.k)} style={{ background: 'transparent', border: 'none', color: active ? '#F472B6' : '#7B89B8', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer' }}>{s.label}</button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7B89B8' }}>
          <Filter size={11} />筛选
        </div>
      </div>

      {/* 商品网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {sorted.map(p => (
          <div key={p.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 100, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative' }}>
              {p.emoji}
              {p.hot && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#F472B6', color: '#0F1B3D', fontWeight: 700 }}>HOT</span>}
              {p.new && <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#A78BFA', color: '#0F1B3D', fontWeight: 700 }}>NEW</span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F472B6' }}>¥{p.price}</span>
                {p.originalPrice && <span style={{ fontSize: 10, color: '#7B89B8', textDecoration: 'line-through' }}>¥{p.originalPrice}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#7B89B8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Star size={9} color="#F0B90B" fill="#F0B90B" />{p.rating}</span>
                <span>已售 {p.sold}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
