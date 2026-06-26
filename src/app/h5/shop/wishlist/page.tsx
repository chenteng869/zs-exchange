'use client';
/**
 * H5 商城收藏夹 v1
 *  - Hero：收藏数 + 总价 + 降价提醒数
 *  - 3 个 tab：商品 / 店铺 / 已下架
 *  - 网格商品卡：图片占位 + 价格 + 涨跌 + 收藏 / 加购 / 删除
 *  - 降价提醒横幅
 *  - 编辑模式（多选 + 批量操作）
 */
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Heart, ShoppingCart, X, Filter, Bell, Trash2,
  Search, ChevronRight, Edit3, Check, TrendingDown, TrendingUp,
  Share2, Star, MoreHorizontal, Plus,
} from 'lucide-react';

const STATS = [
  { label: '收藏数',   val: '24',   color: '#F472B6' },
  { label: '总价',     val: '¥3,860', color: '#F0B90B' },
  { label: '降价提醒', val: '3',    color: '#34D399' },
  { label: '已下架',   val: '2',    color: '#7B89B8' },
];

const TABS = [
  { key: 'goods',  label: '商品', count: 24 },
  { key: 'shop',   label: '店铺', count: 8 },
  { key: 'gone',   label: '已下架', count: 2 },
];

const GOODS = [
  { id: '1', name: 'AirPods Pro 2 主动降噪',  shop: 'Apple 官方', price: 1899,  oldPrice: 1999, drop: 100, stock: 12, hot: true,  cat: '数码', emoji: '🎧' },
  { id: '2', name: 'NVIDIA RTX 4070 显卡',    shop: '数码严选',   price: 4599,  oldPrice: 5299, drop: 700, stock:  3, hot: false, cat: '数码', emoji: '🖥️' },
  { id: '3', name: 'Sony WH-1000XM5 头戴',     shop: 'Sony 旗舰店', price: 2399, oldPrice: 2899, drop: 500, stock: 28, hot: true,  cat: '数码', emoji: '🎧' },
  { id: '4', name: '限量版 ZS 公仔 25cm',       shop: 'ZS 商城官方', price: 199,  oldPrice: 299,  drop: 100, stock:  0, hot: false, cat: '潮玩', emoji: '🧸', gone: true },
  { id: '5', name: '机械键盘 87 键 红轴',       shop: '外设之家',   price: 499,   oldPrice: 599,  drop: 100, stock: 56, hot: false, cat: '外设', emoji: '⌨️' },
  { id: '6', name: '小米 14 Pro 钛金属 16+512', shop: '小米官方',   price: 5999,  oldPrice: 6499, drop: 500, stock: 18, hot: true,  cat: '手机', emoji: '📱' },
  { id: '7', name: 'iPad Air M2 256G',          shop: 'Apple 官方',  price: 4799,  oldPrice: 4799, drop:   0, stock:  9, hot: false, cat: '平板', emoji: '📱' },
  { id: '8', name: 'Switch OLED 白色',          shop: '任天堂官方',  price: 2399,  oldPrice: 2599, drop: 200, stock: 14, hot: false, cat: '游戏', emoji: '🎮' },
  { id: '9', name: 'MacBook Pro 14 M3',         shop: 'Apple 官方',  price: 14999, oldPrice: 14999, drop: 0, stock:  4, hot: true, cat: '电脑', emoji: '💻' },
];

const SHOPS = [
  { id: 's1', name: 'Apple 官方',  avatar: '🍎', total: 4, amount: 22097, items: 4, badge: '自营' },
  { id: 's2', name: '数码严选',    avatar: '💻', total: 1, amount: 4599,  items: 1, badge: '金牌' },
  { id: 's3', name: 'Sony 旗舰店', avatar: '🎧', total: 1, amount: 2399,  items: 1, badge: '自营' },
  { id: 's4', name: 'ZS 商城官方', avatar: '🛍️', total: 1, amount: 199,   items: 1, badge: '官方' },
  { id: 's5', name: '外设之家',    avatar: '⌨️', total: 1, amount: 499,   items: 1, badge: '金牌' },
  { id: 's6', name: '小米官方',    avatar: '📱', total: 1, amount: 5999,  items: 1, badge: '自营' },
];

export default function H5ShopWishlistPage() {
  const [tab, setTab] = useState('goods');
  const [edit, setEdit] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  const toggleSel = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };

  const filteredGoods = GOODS.filter((g) => {
    if (tab === 'gone' && !g.gone) return false;
    if (tab === 'goods' && g.gone) return false;
    if (q && !g.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '12px 0', paddingBottom: 90 }}>
      {/* 顶部导航 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 10,
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(15,27,61,0.85)', backdropFilter: 'blur(12px)', borderRadius: 10,
        }}
      >
        <Link href="/h5/shop" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7B89B8', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span style={{ fontSize: 12 }}>返回</span>
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>我的收藏</div>
        {edit ? (
          <button
            onClick={() => { setEdit(false); setSelected(new Set()); }}
            style={{ background: 'transparent', border: 'none', color: '#F0B90B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            完成
          </button>
        ) : (
          <button
            onClick={() => setEdit(true)}
            style={{ background: 'transparent', border: 'none', color: '#7B89B8', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Edit3 size={11} /> 编辑
          </button>
        )}
      </div>

      {/* Hero 统计 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(244,114,182,0.05) 100%)',
          border: '1px solid rgba(244,114,182,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.40) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #EC4899, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(244,114,182,0.40)' }}>
            <Heart size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>我的收藏夹</div>
            <div style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 800 }}>心仪好物 24 件</div>
          </div>
          <Link
            href="#"
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
              color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Bell size={10} /> 降价提醒 3
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, position: 'relative' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: s.color, fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 搜索框 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'rgba(148, 163, 184, 0.08)', border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: 12, marginBottom: 10,
        }}
      >
        <Search size={14} color="#7B89B8" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索收藏夹"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 12, minWidth: 0 }}
        />
        <Filter size={14} color="#7B89B8" style={{ cursor: 'pointer' }} />
      </div>

      {/* 降价提醒横幅 */}
      {tab === 'goods' && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(34,197,94,0.05) 100%)',
            border: '1px solid rgba(52,211,153,0.30)',
            borderRadius: 10,
          }}
        >
          <TrendingDown size={14} color="#34D399" />
          <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>3 件商品已降价</span>
          <span style={{ fontSize: 10, color: '#7B89B8' }}>最高降 ¥700</span>
          <Link href="#" style={{ marginLeft: 'auto', fontSize: 10, color: '#34D399', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            查看 <ChevronRight size={10} />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, padding: '0 4px' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 12, padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
                background: active ? 'rgba(244,114,182,0.20)' : 'transparent',
                border: active ? '1px solid rgba(244,114,182,0.40)' : '1px solid transparent',
                color: active ? '#F472B6' : '#7B89B8',
                fontWeight: active ? 700 : 500,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {t.label}
              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: active ? 'rgba(244,114,182,0.30)' : 'rgba(148,163,184,0.15)' }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* 商品网格 */}
      {(tab === 'goods' || tab === 'gone') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {filteredGoods.map((g) => {
            const sel = selected.has(g.id);
            return (
              <div
                key={g.id}
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                  border: sel ? '1px solid rgba(244,114,182,0.50)' : '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: 12, overflow: 'hidden', position: 'relative',
                  opacity: g.gone ? 0.5 : 1,
                }}
              >
                {/* 复选框（编辑模式） */}
                {edit && (
                  <div
                    onClick={() => toggleSel(g.id)}
                    style={{
                      position: 'absolute', top: 8, left: 8, zIndex: 5,
                      width: 20, height: 20, borderRadius: '50%',
                      background: sel ? 'linear-gradient(135deg, #F472B6, #EC4899)' : 'rgba(0,0,0,0.40)',
                      border: sel ? 'none' : '1.5px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    {sel && <Check size={12} color="#fff" />}
                  </div>
                )}
                {/* 图片占位 */}
                <div
                  style={{
                    width: '100%', aspectRatio: '1 / 1',
                    background: `linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.10) 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', fontSize: 40,
                  }}
                >
                  {g.emoji}
                  {g.hot && !g.gone && (
                    <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'linear-gradient(135deg, #F472B6, #EC4899)', color: '#fff', fontWeight: 800 }}>
                      HOT
                    </div>
                  )}
                  {g.drop > 0 && !g.gone && (
                    <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(52,211,153,0.90)', color: '#0F1B3D', fontWeight: 800 }}>
                      ↓ ¥{g.drop}
                    </div>
                  )}
                  {g.gone && (
                    <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(127,127,127,0.90)', color: '#fff', fontWeight: 800 }}>
                      已下架
                    </div>
                  )}
                </div>
                {/* 信息 */}
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 30 }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{g.shop}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 14, color: g.gone ? '#7B89B8' : '#F0B90B', fontWeight: 800 }}>¥{g.price}</span>
                    {g.drop > 0 && (
                      <span style={{ fontSize: 9, color: '#7B89B8', textDecoration: 'line-through' }}>¥{g.oldPrice}</span>
                    )}
                  </div>
                  {!g.gone && (
                    <div style={{ fontSize: 9, color: g.stock < 5 ? '#F472B6' : '#7B89B8', marginTop: 2 }}>
                      {g.stock < 5 ? `仅剩 ${g.stock} 件` : `库存 ${g.stock}`}
                    </div>
                  )}
                </div>
                {!edit && !g.gone && (
                  <div
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Heart size={12} color="#F472B6" fill="#F472B6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 店铺列表 */}
      {tab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHOPS.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 12,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.30), rgba(168,85,247,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {s.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{s.name}</span>
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(240,185,11,0.20)', color: '#F0B90B', fontWeight: 700 }}>{s.badge}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>共 {s.items} 件收藏 · ¥{s.amount.toLocaleString()}</div>
              </div>
              <Link
                href={`/h5/shop/merchant/${s.id}`}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.30)',
                  color: '#38BDF8', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                }}
              >
                进入店铺
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 编辑模式底部操作条 */}
      {edit && selected.size > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
            padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(15, 27, 61, 0.95)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(148, 163, 184, 0.12)',
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 50,
          }}
        >
          <span style={{ fontSize: 11, color: '#7B89B8' }}>已选 {selected.size} 件</span>
          <button
            style={{
              marginLeft: 'auto', padding: '8px 14px', borderRadius: 10,
              background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.30)',
              color: '#38BDF8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}
          >
            <ShoppingCart size={11} /> 加购
          </button>
          <button
            style={{
              padding: '8px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, #F472B6, #EC4899)', color: '#fff',
              fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}
          >
            <Trash2 size={11} /> 取消收藏
          </button>
        </div>
      )}

      {!edit && tab !== 'shop' && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
            padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(15, 27, 61, 0.95)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(148, 163, 184, 0.12)',
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 50,
          }}
        >
          <Link
            href="#"
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, textDecoration: 'none',
              background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.30)',
              color: '#38BDF8', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <Share2 size={12} /> 分享清单
          </Link>
          <Link
            href="/h5/shop/cart"
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, textDecoration: 'none',
              background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
              color: '#0F1B3D', fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              boxShadow: '0 4px 12px rgba(240,185,11,0.40)',
            }}
          >
            <ShoppingCart size={12} color="#0F1B3D" /> 全部加入购物车
          </Link>
        </div>
      )}
    </div>
  );
}
