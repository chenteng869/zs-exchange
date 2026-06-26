'use client';
/**
 * H5 福建老酒商城首页
 */
import Link from 'next/link';
import {
  ShoppingBag, Search, ChevronRight, Star, Flame, Sparkles, Crown, Tag, ShoppingCart, Heart,
  Gift, Users, Wallet,
} from 'lucide-react';

const PRODUCTS = [
  { id: '1', name: '福建老酒·369（经典款）', price: 369, originalPrice: 499, image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop', sales: 1250, hot: true, tag: '热销' },
  { id: '2', name: '福建老酒·369（礼盒装）', price: 469, originalPrice: 599, image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop', sales: 860, hot: true, tag: '礼盒' },
  { id: '3', name: '福建老酒·699（珍藏款）', price: 699, originalPrice: 899, image: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?w=400&h=400&fit=crop', sales: 520, new: true, tag: '新品' },
  { id: '4', name: '福建老酒·699（VIP尊享）', price: 999, originalPrice: 1299, image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&h=400&fit=crop', sales: 230, tag: '尊享' },
  { id: '5', name: '企业定制·坛装', price: 1999, originalPrice: 2599, image: 'https://images.unsplash.com/photo-1602206909280-86bd11e420e0?w=400&h=400&fit=crop', sales: 89, tag: '定制' },
  { id: '6', name: '企业定制·礼盒', price: 1299, originalPrice: 1699, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop', sales: 156, tag: '定制' },
  { id: '7', name: '酒具套装', price: 199, originalPrice: 299, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop', sales: 3200, tag: '周边' },
  { id: '8', name: '收藏证书', price: 99, originalPrice: 199, image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', sales: 780, tag: '周边' },
];

const CATS = [
  { id: 'all', name: '全部', emoji: '🍶', color: '#D2691E' },
  { id: 'c369', name: '369元档', emoji: '🥃', color: '#F0B90B' },
  { id: 'c699', name: '699元档', emoji: '🏺', color: '#EC4899' },
  { id: 'custom', name: '企业定制', emoji: '🎁', color: '#A78BFA' },
];

const QUICK_ENTRIES = [
  { icon: ShoppingCart, label: '购物车', color: '#F0B90B', href: '/h5/shop/cart' },
  { icon: Gift, label: '优惠券', color: '#F472B6', href: '/h5/shop/coupons' },
  { icon: Users, label: '渠道中心', color: '#EC4899', href: '/h5/shop/channel' },
  { icon: Wallet, label: '分润明细', color: '#34D399', href: '/h5/shop/profits' },
];

export default function H5FujianShopPage() {
  const hotProducts = PRODUCTS.filter(p => p.hot);

  return (
    <div style={{ padding: '12px', paddingBottom: 80, background: '#0F172A', minHeight: '100vh' }}>
      {/* 顶部搜索栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={16} color="#94A3B8" />
          <span style={{ fontSize: 13, color: '#64748B' }}>搜索老酒 / 品类 / 品牌</span>
        </div>
        <Link href="/h5/shop/cart" style={{ position: 'relative' }}>
          <ShoppingCart size={22} color="#F8FAFC" />
          <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 10, background: '#EF4444', color: '#fff', borderRadius: 8, padding: '1px 5px', fontWeight: 700 }}>3</span>
        </Link>
      </div>

      {/* Hero Banner - 福建老酒主题 */}
      <div style={{
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 40%, #D2691E 70%, #F0B90B 100%)',
        borderRadius: 18, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(139, 69, 19, 0.50)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 100, opacity: 0.15 }}>🍶</div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>🍶</span>
            <span style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>福建老酒</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700 }}>首发</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 14, lineHeight: 1.5 }}>
            千年传承 · 古法酿造 · 陶坛窖藏
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FCD535' }}>¥369</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>起 / 瓶</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>50万+</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>用户信赖</div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷入口 4×1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {QUICK_ENTRIES.map((e, i) => {
          const Icon = e.icon;
          return (
            <Link key={i} href={e.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', borderRadius: 12, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${e.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={e.color} />
              </div>
              <span style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 500 }}>{e.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 分类标签 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {CATS.map(c => (
          <button key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: c.id === 'all' ? 'linear-gradient(135deg, #D2691E, #F0B90B)' : 'rgba(255,255,255,0.06)',
            color: c.id === 'all' ? '#fff' : '#CBD5E1', fontSize: 12, fontWeight: 600,
          }}>
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      {/* 爆款推荐 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} color="#F97316" />
            <span style={{ fontSize: 15, color: '#F8FAFC', fontWeight: 700 }}>爆款推荐</span>
            <span style={{ fontSize: 10, color: '#F97316', background: 'rgba(249,115,22,0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>HOT</span>
          </div>
          <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#94A3B8', textDecoration: 'none' }}>
            更多 <ChevronRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PRODUCTS.slice(0, 4).map(p => (
            <Link key={p.id} href={`/h5/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#1E293B' }}>
                  <img src={p.image} alt={p.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.tag && (
                    <span style={{
                      position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4, background: '#EF4444', color: '#fff',
                    }}>
                      {p.tag}
                    </span>
                  )}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500, marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 16, color: '#FCD535', fontWeight: 800 }}>¥{p.price}</span>
                      <span style={{ fontSize: 10, color: '#64748B', textDecoration: 'line-through', marginLeft: 4 }}>¥{p.originalPrice}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>已售 {p.sales}+</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 精选臻品 - 全部商品 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Sparkles size={16} color="#A78BFA" />
          <span style={{ fontSize: 15, color: '#F8FAFC', fontWeight: 700 }}>精选臻品</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PRODUCTS.map(p => (
            <Link key={p.id} href={`/h5/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#1E293B' }}>
                  <img src={p.image} alt={p.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.tag && (
                    <span style={{
                      position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4,
                      background: p.hot ? '#EF4444' : p.new ? '#10B981' : '#6366F1',
                      color: '#fff',
                    }}>
                      {p.tag}
                    </span>
                  )}
                  <button style={{
                    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
                    background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart size={14} color="#fff" />
                  </button>
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500, marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 32 }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 16, color: '#FCD535', fontWeight: 800 }}>¥{p.price}</span>
                      <span style={{ fontSize: 10, color: '#64748B', textDecoration: 'line-through', marginLeft: 4 }}>¥{p.originalPrice}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>已售 {p.sales}+</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 底部加载更多 */}
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B', fontSize: 12 }}>
        — 已经到底啦 —
      </div>
    </div>
  );
}
