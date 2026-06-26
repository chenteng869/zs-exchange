'use client';
/**
 * H5 福建老酒 - 商品详情
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Heart, Share2, Star, ShoppingCart, Truck, ShieldCheck, RotateCcw, Crown } from 'lucide-react';
import FujianWinePurchase from '@/components/h5/FujianWinePurchase';

const PRODUCT = {
  id: '1',
  name: '福建老酒·369（经典款）',
  subtitle: '千年传承 · 古法酿造 · 陶坛窖藏',
  price: 369,
  originalPrice: 499,
  sales: 1250,
  rating: 4.9,
  reviewCount: 286,
  image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600&h=600&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=400&fit=crop',
  ],
  description: `福建老酒，源自唐代宗年间，距今已有一千二百余年历史。相传由唐代酿酒大师杜康后人南迁至闽地，结合当地气候与水土，独创这套酿造工艺。

我们坚持"古法酿造，陶坛窖藏"的传统工艺，甄选优质糯米、红色曲米、山泉水为原料，历经三十六道工序，至少三年窖藏方能出厂。

每一瓶福建老酒，都是时间的艺术，都是匠人的心血。它承载着千年的文化底蕴，也承载着我们对品质的不懈追求。`,
  specs: [
    { name: '品牌', value: '福建老酒' },
    { name: '产地', value: '福建福州' },
    { name: '净含量', value: '500ml/瓶' },
    { name: '酒精度', value: '15%vol' },
    { name: '原料', value: '糯米、红曲米、山泉水' },
    { name: '保质期', value: '10年' },
  ],
  services: ['顺丰包邮', '破损包赔', '7天无理由', '正品保证'],
};

export default function H5ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', paddingBottom: 80 }}>
      {/* 顶部导航 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.95)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(10px)' }}>
        <Link href="/h5/shop" style={{ color: '#F8FAFC' }}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </Link>
        <span style={{ flex: 1, fontSize: 16, color: '#F8FAFC', fontWeight: 700 }}>商品详情</span>
        <button onClick={() => setIsFavorite(!isFavorite)} style={{ border: 'none', background: 'none', padding: 4 }}>
          <Heart size={20} color={isFavorite ? '#EF4444' : '#94A3B8'} fill={isFavorite ? '#EF4444' : 'none'} />
        </button>
        <button style={{ border: 'none', background: 'none', padding: 4 }}>
          <Share2 size={20} color="#94A3B8" />
        </button>
      </div>

      {/* 商品图片 */}
      <div style={{ position: 'relative', background: '#1E293B' }}>
        <img src={PRODUCT.images[activeImage]} alt={PRODUCT.name} style={{ width: '100%', aspectRatio: 1 }} />
        <div style={{ position: 'absolute', bottom: 10, left: 50, transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {PRODUCT.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              style={{
                width: 40, height: 40, borderRadius: 8, overflow: 'hidden', border: '2px solid',
                borderColor: activeImage === i ? '#D2691E' : 'transparent',
              }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </div>

      {/* 商品信息 */}
      <div style={{ padding: '14px', background: '#0F172A' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 24, color: '#FCD535', fontWeight: 800 }}>¥{PRODUCT.price}</span>
          <span style={{ fontSize: 14, color: '#64748B', textDecoration: 'line-through' }}>¥{PRODUCT.originalPrice}</span>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 600 }}>
            省 ¥{PRODUCT.originalPrice - PRODUCT.price}
          </span>
        </div>
        <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
          {PRODUCT.name}
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>
          {PRODUCT.subtitle}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} color="#FCD535" fill="#FCD535" />
            <span>{PRODUCT.rating}</span>
            <span>({PRODUCT.reviewCount})</span>
          </div>
          <div>已售 {PRODUCT.sales}+</div>
          <div style={{ marginLeft: 'auto', padding: '2px 6px', borderRadius: 4, background: 'rgba(240,185,11,0.15)', color: '#F0B90B', fontWeight: 600 }}>
            会员专享
          </div>
        </div>
      </div>

      {/* 服务保障 */}
      <div style={{ margin: '0 14px 14px', display: 'flex', gap: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {PRODUCT.services.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck size={14} color="#34D399" />
            <span style={{ fontSize: 11, color: '#E2E8F0' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* 链上购买 */}
      <div style={{ margin: '0 14px 14px' }}>
        <FujianWinePurchase priceTier={PRODUCT.price as 369 | 699} productName={PRODUCT.name} />
      </div>

      {/* 商品参数 */}
      <div style={{ margin: '0 14px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px', fontSize: 14, color: '#F8FAFC', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          商品参数
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 0' }}>
            {PRODUCT.specs.map((spec, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#64748B', width: 70 }}>{spec.name}</span>
                <span style={{ fontSize: 12, color: '#E2E8F0' }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 商品详情 */}
      <div style={{ margin: '0 14px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px', fontSize: 14, color: '#F8FAFC', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          商品详情
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {PRODUCT.description}
          </div>
        </div>
      </div>

      {/* 底部购买栏 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1E293B', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/h5/shop/cart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
            <ShoppingCart size={22} color="#94A3B8" />
            <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>购物车</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Heart size={22} color="#94A3B8" />
            <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>收藏</span>
          </div>
        </div>
        <button style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(210,105,30,0.2)', color: '#D2691E', fontSize: 14, fontWeight: 700 }}>
          加入购物车
        </button>
        <button style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #D2691E, #F0B90B)', color: '#fff', fontSize: 14, fontWeight: 700 }}>
          立即购买
        </button>
      </div>
    </div>
  );
}
