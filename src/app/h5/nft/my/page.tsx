'use client';
import { useState } from 'react';
import {
  Image as ImageIcon, ChevronRight, TrendingUp, TrendingDown, Eye, Heart, Tag, BarChart3, Wallet,
} from 'lucide-react';
import { getNftCollections } from '@/lib/h5-mock';

export default function H5NftMyPage() {
  const [tab, setTab] = useState<'all' | 'listed' | 'unlisted'>('all');
  const collections = getNftCollections();
  // 模拟我拥有的 NFT
  const myNfts = collections.slice(0, 4).flatMap((c, ci) => [
    { id: `${c.id}-01`, collection: c, tokenId: '#1024', price: c.floorPrice, status: 'unlisted', acquired: '2026-06-15' },
    { id: `${c.id}-02`, collection: c, tokenId: '#3568', price: c.floorPrice, status: 'listed', acquired: '2026-05-20' },
  ]);

  const stats = {
    total: 12,
    listed: 4,
    value: '8.42 ETH',
    change: '+12.5%',
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <ImageIcon size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>我的 NFT</span>
      </div>

      {/* 资产大卡 */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #4C1D95 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Wallet size={12} color="rgba(255,255,255,0.70)" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>NFT 总估值</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums' }}>{stats.value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <TrendingUp size={12} color="#34D399" />
          <span style={{ fontSize: 11, color: '#34D399', fontWeight: 700 }}>{stats.change} (7d)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>总持有</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.total} 个</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>已挂单</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>{stats.listed} 个</div></div>
          <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>合集数</div><div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>4</div></div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.12)' }}>
        {[
          { v: 'all', label: '全部' },
          { v: 'listed', label: '已挂单' },
          { v: 'unlisted', label: '未挂单' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as 'all' | 'listed' | 'unlisted')}
            style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: tab === t.v ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' : 'transparent', color: tab === t.v ? '#fff' : '#7B89B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 网格 2 列 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {myNfts.filter(n => tab === 'all' || n.status === tab).map(n => (
          <a key={n.id} href={`/h5/nft/detail/${n.collection.id}`} style={{ display: 'block', background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none' }}>
            <div style={{ width: '100%', aspectRatio: '1', background: n.collection.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative' }}>
              {n.collection.emoji}
              {n.status === 'listed' && (
                <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.90)', color: '#0F1B3D', fontSize: 9, fontWeight: 700 }}>出售中</div>
              )}
            </div>
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>{n.collection.name}</div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginBottom: 6 }}>{n.tokenId}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#7B89B8' }}>地板价</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#FCD535' }}>{n.price}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
