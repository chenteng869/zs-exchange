'use client';
import {
  ShoppingBag, Search, ChevronRight, ShoppingCart, Flame, Sparkles, Star, Crown, Gift, Zap, Heart,
} from 'lucide-react';
import { getShopProducts } from '@/lib/h5-mock';

const CATEGORIES = [
  { id: 'physical', name: '实物',  emoji: '📦', color: '#38BDF8' },
  { id: 'digital',  name: '数字',  emoji: '💎', color: '#A78BFA' },
  { id: 'service',  name: '服务',  emoji: '🎓', color: '#F0B90B' },
  { id: 'gift',     name: '礼品',  emoji: '🎁', color: '#F472B6' },
];

export default function H5ShopHomePage() {
  const products = getShopProducts();
  const hot = products.filter(p => p.hot);
  const newP = products.filter(p => p.new);
  const featured = products.slice(0, 4);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <ShoppingBag size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>商城</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="#7B89B8" />
          <ShoppingCart size={16} color="#F8FAFC" />
        </span>
      </div>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 50%, #F472B6 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Crown size={14} color="#0F1B3D" />
            <span style={{ fontSize: 12, color: '#0F1B3D', fontWeight: 700 }}>618 限时特惠</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F1B3D', lineHeight: 1.3 }}>VIP 会员<br />1 年 7 折</div>
          <div style={{ fontSize: 11, color: 'rgba(15, 27, 61, 0.7)', marginTop: 4 }}>全场满 1000 减 100，新人 9 折</div>
          <button style={{ marginTop: 10, background: '#0F1B3D', color: '#FCD535', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>立即抢购 ›</button>
        </div>
        <div style={{ position: 'absolute', right: -20, top: -10, fontSize: 120, opacity: 0.25 }}>🛍️</div>
      </div>

      {/* 分类 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {CATEGORIES.map(c => (
          <div key={c.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{c.emoji}</div>
            <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 600 }}>{c.name}</div>
          </div>
        ))}
      </div>

      {/* 热门 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Flame size={12} color="#F472B6" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>人气热销</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>查看全部 ›</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {hot.slice(0, 4).map(p => (
          <div key={p.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 90, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative' }}>
              {p.emoji}
              <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#F472B6', color: '#0F1B3D', fontWeight: 700 }}>HOT</span>
              {p.discount && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#0F1B3D', color: '#FCD535', fontWeight: 700 }}>{p.discount}折</span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F472B6' }}>¥{p.price}</span>
                {p.originalPrice && <span style={{ fontSize: 10, color: '#7B89B8', textDecoration: 'line-through' }}>¥{p.originalPrice}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9, color: '#7B89B8' }}>
                <Star size={9} color="#F0B90B" fill="#F0B90B" />{p.rating} · 已售 {p.sold}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新品 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Sparkles size={12} color="#A78BFA" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>新品上架</span>
      </div>
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
        {newP.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: 8, borderRadius: 8 }}>
            <div style={{ width: 50, height: 50, borderRadius: 8, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginRight: 10 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{p.description}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F472B6', marginTop: 4 }}>¥{p.price}</div>
            </div>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA', fontWeight: 700 }}>NEW</span>
          </div>
        ))}
      </div>

      {/* 为你推荐 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Heart size={12} color="#F472B6" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>为你推荐</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {featured.map(p => (
          <div key={p.id} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 64, height: 64, borderRadius: 10, background: p.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>{p.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} color="#F0B90B" fill="#F0B90B" />{p.rating} · {p.seller}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F472B6' }}>¥{p.price}</span>
                {p.originalPrice && <span style={{ fontSize: 10, color: '#7B89B8', textDecoration: 'line-through' }}>¥{p.originalPrice}</span>}
              </div>
            </div>
            <ChevronRight size={14} color="#7B89B8" />
          </div>
        ))}
      </div>
    </div>
  );
}
