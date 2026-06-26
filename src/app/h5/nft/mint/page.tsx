'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles, ChevronRight, ArrowLeft, Wallet, Coins, Fuel, Zap, AlertCircle, ShieldCheck, Check,
} from 'lucide-react';
import { getNftById, getNftCollections } from '@/lib/h5-mock';

function Form() {
  const sp = useSearchParams();
  const id = sp.get('id') || 'NFT-001';
  const collection = getNftById(id);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState(0);

  if (!collection) return <div style={{ padding: 20, color: '#7B89B8' }}>合集不存在</div>;

  const all = getNftCollections();
  const mintPrice = '0.08';
  const gasFee = '0.002';
  const total = (qty * parseFloat(mintPrice) + parseFloat(gasFee)).toFixed(4);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <a href="/h5/nft/market" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7B89B8', textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> 返回
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#A78BFA', borderRadius: 2 }} />
        <Sparkles size={16} color="#A78BFA" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>铸造 NFT</span>
      </div>

      {/* 当前选择 */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #4C1D95 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: collection.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{collection.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{collection.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>{collection.symbol} · {collection.chain}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FCD535', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{mintPrice} ETH / 个</div>
          </div>
        </div>
      </div>

      {/* 选择合集 */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>切换合集</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {all.slice(0, 5).map((c, i) => (
          <button key={c.id} onClick={() => setSelected(i)}
            style={{ flexShrink: 0, width: 80, padding: 8, background: selected === i ? 'rgba(167, 139, 250, 0.15)' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid', borderColor: selected === i ? '#A78BFA' : 'rgba(148, 163, 184, 0.12)', borderRadius: 10, cursor: 'pointer' }}>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, background: c.cover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 6 }}>{c.emoji}</div>
            <div style={{ fontSize: 10, color: '#F8FAFC', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.symbol}</div>
          </button>
        ))}
      </div>

      {/* 数量 */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>铸造数量</div>
      <div style={{ padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167, 139, 250, 0.20)', border: 'none', color: '#A78BFA', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>-</button>
          <input value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 24, fontWeight: 700, textAlign: 'center', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }} />
          <button onClick={() => setQty(Math.min(10, qty + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167, 139, 250, 0.20)', border: 'none', color: '#A78BFA', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {[1, 3, 5, 10].map(n => (
            <button key={n} onClick={() => setQty(n)} style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: qty === n ? 'rgba(167, 139, 250, 0.20)' : 'rgba(15, 27, 61, 0.40)', border: '1px solid', borderColor: qty === n ? '#A78BFA' : 'rgba(148, 163, 184, 0.20)', color: qty === n ? '#A78BFA' : '#7B89B8', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{n}</button>
          ))}
        </div>
      </div>

      {/* 费用明细 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>铸造价格</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(qty * parseFloat(mintPrice)).toFixed(4)} ETH</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 4 }}><Fuel size={11} /> Gas 费用</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{gasFee} ETH</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8', fontWeight: 700 }}>总计</span>
          <span style={{ color: '#FCD535', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{total} ETH</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.20)', borderRadius: 10, marginBottom: 14 }}>
        <AlertCircle size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>铸造 NFT 需要支付 Gas 费用，请确保钱包有足够 ETH 余额；铸造成功后 NFT 将自动转入您的钱包。</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={10} color="#fff" />
        </div>
        <span style={{ fontSize: 11, color: '#7B89B8' }}>我已了解铸造相关风险</span>
      </div>

      <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(167, 139, 250, 0.30)' }}>
        <Sparkles size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 确认铸造 {qty} 个
      </button>
    </div>
  );
}

export default function H5NftMintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: '#7B89B8' }}>加载中...</div>}>
      <Form />
    </Suspense>
  );
}
