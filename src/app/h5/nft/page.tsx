'use client';
/**
 * NFT 模块首页 - 数字藏品市场
 */
import Link from 'next/link';
import {
  ImageIcon, Sparkles, Crown, Flame, ChevronRight, Heart, TrendingUp, Tag, Award,
} from 'lucide-react';
import { getNftCollections } from '@/lib/h5-mock';

export default function H5NftHomePage() {
  const cols = getNftCollections();
  const featured = cols.filter(c => c.verified);
  const hot = cols.filter(c => c.hot);
  const totalVol = cols.reduce((s, c) => s + parseFloat(c.volume.replace(/[$M,]/g, '')), 0);

  const CATS = [
    { id: 'art',    label: '艺术',   emoji: '🎨', color: '#F472B6' },
    { id: 'music',  label: '音乐',   emoji: '🎵', color: '#A78BFA' },
    { id: 'game',   label: '游戏',   emoji: '🎮', color: '#34D399' },
    { id: 'sport',  label: '体育',   emoji: '⚽', color: '#38BDF8' },
    { id: 'ip',     label: 'IP',     emoji: '🌟', color: '#F0B90B' },
    { id: 'domain', label: '域名',   emoji: '🌐', color: '#22D3EE' },
  ];

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #581C87 0%, #7C3AED 50%, #0F1B3D 100%)', borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.40)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'radial-gradient(circle, rgba(244, 114, 182, 0.30) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ImageIcon size={18} color="#F472B6" />
            <span style={{ fontSize: 14, color: '#FBCFE8', fontWeight: 600 }}>NFT 数字藏品</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.20)', color: '#F472B6' }}>链上</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', marginBottom: 12 }}>藏品总量 · 24h 交易额</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{cols.length * 10000}+</div>
              <div style={{ fontSize: 10, color: '#FBCFE8' }}>藏品</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535' }}>${totalVol.toFixed(0)}M</div>
              <div style={{ fontSize: 10, color: '#FBCFE8' }}>交易额</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 分类入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {CATS.map(c => (
          <Link key={c.id} href={`/h5/nft/market?cat=${c.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, padding: '14px 8px', textAlign: 'center', textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
            <div style={{ fontSize: 30, marginBottom: 4 }}>{c.emoji}</div>
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{c.label}</div>
          </Link>
        ))}
      </div>

      {/* 子入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { icon: Tag,      label: 'NFT 市场',     color: '#A78BFA', href: '/h5/nft/market' },
          { icon: Sparkles, label: 'Mint 铸造',    color: '#F472B6', href: '/h5/nft/mint' },
          { icon: Heart,    label: '我的 NFT',     color: '#F0B90B', href: '/h5/nft/my' },
          { icon: TrendingUp,label: '活动记录',    color: '#38BDF8', href: '/h5/nft/activity' },
        ].map(e => {
          const Icon = e.icon;
          return (
            <Link key={e.label} href={e.href} style={{ background: `linear-gradient(135deg, ${e.color}20 0%, rgba(21, 34, 74, 0.70) 100%)`, border: `1px solid ${e.color}30`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={e.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>点击进入</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 热门藏品 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px 0 8px' }}>
        <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #F472B6 0%, #DB2777 100%)', borderRadius: 2 }} />
        <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>热门藏品</span>
        <Link href="/h5/nft/market" style={{ marginLeft: 'auto', fontSize: 11, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
          查看全部 <ChevronRight size={11} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {hot.slice(0, 4).map(c => (
          <Link key={c.id} href={`/h5/nft/detail/${c.id}`} style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', border: '1px solid rgba(148, 163, 184, 0.10)' }}>
            <div style={{ height: 100, background: `linear-gradient(135deg, ${c.cover.includes('#F472B6') ? '#F472B6, #DB2777' : '#A78BFA, #7C3AED'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
              {c.emoji}
              {c.verified && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, padding: '2px 5px', borderRadius: 3, background: 'rgba(56, 189, 248, 0.20)', color: '#38BDF8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Award size={8} /> 认证
              </span>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F0B90B' }}>{c.floorPrice}</span>
                <span style={{ fontSize: 10, color: parseFloat(c.change) >= 0 ? '#34D399' : '#F472B6', marginLeft: 'auto' }}>{c.change}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
