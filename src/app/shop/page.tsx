'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  Award,
  Droplets,
  ChevronLeft,
  ChevronRight,
  Heart,
  Zap,
  Crown,
  Gift,
  Wine,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface Product {
  id: number;
  name: string;
  price: number;
  sales: string;
  tag?: string;
  tagColor?: string;
  category: string;
  image: string;
}

const products: Product[] = [
  {
    id: 1,
    name: '福建老酒·369（经典款）',
    price: 369,
    sales: '1250+',
    tag: '热销',
    tagColor: '#E8A317',
    category: '369',
    image: '🍶',
  },
  {
    id: 2,
    name: '福建老酒·369（礼盒装）',
    price: 399,
    sales: '860+',
    tag: '推荐',
    tagColor: '#F0B90B',
    category: '369',
    image: '🎁',
  },
  {
    id: 3,
    name: '福建老酒·699（珍藏款）',
    price: 699,
    sales: '420+',
    tag: '珍藏',
    tagColor: '#D4A853',
    category: '699',
    image: '🏺',
  },
  {
    id: 4,
    name: '福建老酒·699（VIP尊享）',
    price: 799,
    sales: '180+',
    tag: 'VIP',
    tagColor: '#B8860B',
    category: '699',
    image: '👑',
  },
  {
    id: 5,
    name: '企业定制·坛装',
    price: 1299,
    sales: '65+',
    tag: '定制',
    tagColor: '#CD853F',
    category: 'custom',
    image: '🫖',
  },
  {
    id: 6,
    name: '企业定制·礼盒',
    price: 1999,
    sales: '28+',
    tag: '限量',
    tagColor: '#8B4513',
    category: 'custom',
    image: '📦',
  },
  {
    id: 7,
    name: '酒具套装',
    price: 199,
    sales: '350+',
    category: 'peripheral',
    image: '🍷',
  },
  {
    id: 8,
    name: '收藏证书',
    price: 99,
    sales: '720+',
    category: 'peripheral',
    image: '📜',
  },
];

const categories = [
  { id: 'all', name: '全部' },
  { id: '369', name: '369元档' },
  { id: '699', name: '699元档' },
  { id: 'custom', name: '企业定制' },
  { id: 'peripheral', name: '周边产品' },
];

const sellingPoints = [
  { icon: Droplets, title: '古法酿造', desc: '传承千年工艺，纯粮固态发酵' },
  { icon: Award, title: '年份珍藏', desc: '陶坛窖藏，岁月沉淀醇香' },
  { icon: Shield, title: '品质保证', desc: 'ISO认证，每瓶均可溯源' },
  { icon: Truck, title: '全国配送', desc: '顺丰包邮，破损包赔' },
];

const reviews = [
  {
    id: 1,
    name: '陈先生',
    avatar: '👨‍💼',
    rating: 5,
    content: '口感醇厚，回味悠长，不愧是福建老酒的经典款。送礼自饮两相宜，包装也很精致！',
    date: '2024-12-15',
  },
  {
    id: 2,
    name: '林女士',
    avatar: '👩‍🎨',
    rating: 5,
    content: '买给父亲的生日礼物，老爷子喝了赞不绝口。说是比他年轻时候喝的味道还正宗。',
    date: '2024-12-10',
  },
  {
    id: 3,
    name: '王总',
    avatar: '🧑‍💼',
    rating: 5,
    content: '企业定制了50坛，客户反馈非常好。坛身刻字很精致，彰显企业文化底蕴。',
    date: '2024-12-05',
  },
  {
    id: 4,
    name: '张阿姨',
    avatar: '👵',
    rating: 5,
    content: '女儿说这个酒养生，给我买了两箱。每天小酌一杯，睡眠都好了很多。',
    date: '2024-11-28',
  },
];

export default function ShopHomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentReview, setCurrentReview] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      <Navbar />

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          paddingTop: '120px',
          paddingBottom: '100px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #1A0F0A 0%, #2D1810 30%, #0F172A 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 168, 83, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '8%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.10) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(212, 168, 83, 0.15)',
                  border: '1px solid rgba(212, 168, 83, 0.30)',
                  marginBottom: '24px',
                }}
              >
                <Wine size={14} style={{ color: '#D4A853' }} />
                <span style={{ fontSize: '13px', color: '#D4A853', fontWeight: 500 }}>
                  传承千年 · 酿造经典
                </span>
              </div>

              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 800,
                  lineHeight: '1.2',
                  marginBottom: '20px',
                  background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 50%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                福建老酒
                <br />
                ·千年传承·
              </h1>

              <p
                style={{
                  fontSize: '18px',
                  color: '#94A3B8',
                  lineHeight: '1.8',
                  marginBottom: '40px',
                  maxWidth: '480px',
                }}
              >
                一瓶老酒，一段历史，一份传承。源自福建千年酿酒工艺，
                甄选优质糯米，古法酿造，陶坛窖藏，历久弥香。
              </p>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '16px 40px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)',
                    color: '#1A0F0A',
                    boxShadow: '0 8px 24px rgba(212, 168, 83, 0.40)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(212, 168, 83, 0.50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 168, 83, 0.40)';
                  }}
                >
                  立即购买
                </button>
                <button
                  style={{
                    padding: '16px 32px',
                    fontSize: '15px',
                    fontWeight: 500,
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 168, 83, 0.40)',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#D4A853',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                    e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.40)';
                  }}
                >
                  了解更多
                </button>
              </div>

              <div style={{ display: 'flex', gap: '40px', marginTop: '48px' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#FCD535' }}>1000+</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>年酿造历史</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#FCD535' }}>50万+</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>忠实客户</div>
                </div>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#FCD535' }}>99.8%</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>好评率</div>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212, 168, 83, 0.20) 0%, transparent 60%)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  fontSize: '280px',
                  filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.40))',
                  animation: 'float 3s ease-in-out infinite',
                }}
              >
                🍶
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: '20px',
                  bottom: '40px',
                  fontSize: '140px',
                  filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.30))',
                  animation: 'float 3s ease-in-out infinite',
                  animationDelay: '0.5s',
                }}
              >
                🏺
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selling Points */}
      <section style={{ padding: '80px 0', background: '#0F172A' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {sellingPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  style={{
                    padding: '32px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.50) 0%, rgba(15, 23, 42, 0.80) 100%)',
                    border: '1px solid rgba(212, 168, 83, 0.15)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.40)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(212, 168, 83, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.20) 0%, rgba(240, 185, 11, 0.10) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <Icon size={28} style={{ color: '#D4A853' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC', marginBottom: '8px' }}>
                    {point.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6' }}>
                    {point.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section style={{ padding: '80px 0', background: '#0F172A' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#F8FAFC',
                marginBottom: '12px',
              }}
            >
              精选臻品
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B' }}>
              每一瓶都是岁月的馈赠，每一口都是匠心的结晶
            </p>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '48px',
              flexWrap: 'wrap',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '10px 28px',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeCategory === cat.id
                    ? 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)'
                    : 'rgba(30, 41, 59, 0.80)',
                  color: activeCategory === cat.id ? '#1A0F0A' : '#94A3B8',
                  boxShadow: activeCategory === cat.id
                    ? '0 4px 16px rgba(212, 168, 83, 0.30)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                    e.currentTarget.style.color = '#D4A853';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.80)';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.60) 0%, rgba(15, 23, 42, 0.90) 100%)',
                  border: '1px solid rgba(212, 168, 83, 0.15)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div
                  style={{
                    position: 'relative',
                    height: '240px',
                    background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.08) 0%, rgba(15, 23, 42, 0.50) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontSize: '120px',
                      transition: 'transform 0.3s ease',
                      transform: hoveredProduct === product.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {product.image}
                  </div>
                  {product.tag && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: product.tagColor || '#D4A853',
                        color: '#1A0F0A',
                      }}
                    >
                      {product.tag}
                    </span>
                  )}
                  <button
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'rgba(15, 23, 42, 0.60)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      opacity: hoveredProduct === product.id ? 1 : 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.20)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.60)';
                    }}
                  >
                    <Heart size={18} style={{ color: '#EF4444' }} />
                  </button>
                </div>

                <div style={{ padding: '24px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#F8FAFC',
                      marginBottom: '12px',
                    }}
                  >
                    {product.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#D4A853' }}>¥</span>
                      <span
                        style={{
                          fontSize: '28px',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {product.price}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
                      <Zap size={12} style={{ color: '#F0B90B' }} />
                      已售 {product.sales}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 168, 83, 0.40)',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: '#D4A853',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.40)';
                      }}
                    >
                      <ShoppingCart size={14} />
                      加入购物车
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)',
                        color: '#1A0F0A',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 168, 83, 0.40)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      立即购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section
        style={{
          padding: '100px 0',
          background: 'linear-gradient(180deg, #0F172A 0%, #1A0F0A 50%, #0F172A 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-20px',
                  right: '20px',
                  bottom: '20px',
                  borderRadius: '20px',
                  border: '2px solid rgba(212, 168, 83, 0.30)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  padding: '60px 40px',
                  background: 'linear-gradient(135deg, rgba(26, 36, 86, 0.80) 0%, rgba(26, 15, 10, 0.90) 100%)',
                  border: '1px solid rgba(212, 168, 83, 0.20)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '100px', marginBottom: '20px' }}>🏛️</div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '8px',
                  }}
                >
                  始于公元 766 年
                </div>
                <div style={{ fontSize: '16px', color: '#64748B' }}>
                  千年传承 · 匠心酿造
                </div>
              </div>
            </div>

            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#D4A853',
                  letterSpacing: '2px',
                  marginBottom: '16px',
                }}
              >
                品牌故事
              </span>
              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: '24px',
                  lineHeight: '1.3',
                }}
              >
                千年酒韵，
                <br />
                一脉相承
              </h2>
              <div style={{ fontSize: '15px', color: '#94A3B8', lineHeight: '2', marginBottom: '24px' }}>
                <p style={{ marginBottom: '16px' }}>
                  福建老酒，源自唐代宗年间，距今已有一千二百余年历史。
                  相传由唐代酿酒大师杜康后人南迁至闽地，结合当地气候与水土，
                  独创这套酿造工艺。
                </p>
                <p style={{ marginBottom: '16px' }}>
                  我们坚持"古法酿造，陶坛窖藏"的传统工艺，甄选优质糯米、
                  红色曲米、山泉水为原料，历经三十六道工序，
                  至少三年窖藏方能出厂。
                </p>
                <p>
                  每一瓶福建老酒，都是时间的艺术，都是匠人的心血。
                  它承载着千年的文化底蕴，也承载着我们对品质的不懈追求。
                </p>
              </div>
              <button
                style={{
                  padding: '14px 32px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 168, 83, 0.40)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#D4A853',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                  e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.40)';
                }}
              >
                了解更多历史
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section style={{ padding: '80px 0', background: '#0F172A' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
              用户评价
            </h2>
            <p style={{ fontSize: '16px', color: '#64748B' }}>
              来自50万+用户的真实好评
            </p>
          </div>

          <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
            <button
              onClick={prevReview}
              style={{
                position: 'absolute',
                left: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1px solid rgba(212, 168, 83, 0.30)',
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.80)',
                color: '#D4A853',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.80)';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.30)';
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <div
              style={{
                borderRadius: '20px',
                padding: '48px',
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.60) 0%, rgba(15, 23, 42, 0.90) 100%)',
                border: '1px solid rgba(212, 168, 83, 0.20)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                {reviews[currentReview].avatar}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px' }}>
                {[...Array(reviews[currentReview].rating)].map((_, i) => (
                  <Star key={i} size={18} fill="#FCD535" style={{ color: '#FCD535' }} />
                ))}
              </div>
              <p
                style={{
                  fontSize: '18px',
                  color: '#E2E8F0',
                  lineHeight: '1.8',
                  marginBottom: '24px',
                  fontStyle: 'italic',
                }}
              >
                "{reviews[currentReview].content}"
              </p>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>
                  {reviews[currentReview].name}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  {reviews[currentReview].date}
                </div>
              </div>
            </div>

            <button
              onClick={nextReview}
              style={{
                position: 'absolute',
                right: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1px solid rgba(212, 168, 83, 0.30)',
                cursor: 'pointer',
                background: 'rgba(15, 23, 42, 0.80)',
                color: '#D4A853',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.80)';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.30)';
              }}
            >
              <ChevronRight size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  style={{
                    width: index === currentReview ? '32px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: index === currentReview
                      ? 'linear-gradient(90deg, #FCD535 0%, #D4A853 100%)'
                      : 'rgba(100, 116, 139, 0.40)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '100px 0',
          background: 'linear-gradient(135deg, #1A0F0A 0%, #2D1810 50%, #1A0F0A 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.50) 50%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.50) 50%, transparent 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            fontSize: '120px',
            opacity: 0.05,
          }}
        >
          🍶
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '8%',
            fontSize: '100px',
            opacity: 0.05,
          }}
        >
          🏺
        </div>

        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center relative z-10">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '24px',
              background: 'rgba(212, 168, 83, 0.15)',
              border: '1px solid rgba(212, 168, 83, 0.30)',
              marginBottom: '28px',
            }}
          >
            <Crown size={16} style={{ color: '#FCD535' }} />
            <span style={{ fontSize: '14px', color: '#FCD535', fontWeight: 500 }}>
              VIP 会员专享
            </span>
          </div>

          <h2
            style={{
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: '1.3',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 50%, #B8860B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            立即加入会员
            <br />
            享专属优惠
          </h2>

          <p style={{ fontSize: '18px', color: '#94A3B8', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            新会员注册即送100元优惠券，享会员专属价、生日礼包、
            积分兑换等多重好礼。更多精彩，等你来发现！
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              style={{
                padding: '18px 48px',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #FCD535 0%, #D4A853 100%)',
                color: '#1A0F0A',
                boxShadow: '0 8px 24px rgba(212, 168, 83, 0.40)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(212, 168, 83, 0.50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 168, 83, 0.40)';
              }}
            >
              <Gift size={20} />
              免费加入会员
            </button>
            <button
              style={{
                padding: '18px 36px',
                fontSize: '15px',
                fontWeight: 500,
                borderRadius: '12px',
                border: '1px solid rgba(212, 168, 83, 0.40)',
                cursor: 'pointer',
                background: 'transparent',
                color: '#D4A853',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 168, 83, 0.10)';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.60)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.40)';
              }}
            >
              查看会员权益
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '56px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FCD535' }}>100元</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>新人礼包</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(212, 168, 83, 0.20)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FCD535' }}>9.5折</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>会员专享价</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(212, 168, 83, 0.20)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FCD535' }}>2倍</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>积分加速</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(212, 168, 83, 0.20)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FCD535' }}>专属</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>生日好礼</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
