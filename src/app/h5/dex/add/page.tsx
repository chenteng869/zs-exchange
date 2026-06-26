'use client';
import { useState } from 'react';
import {
  Plus, ArrowDown, Wallet, Info, TrendingUp, AlertCircle, Zap, ChevronDown, Check,
} from 'lucide-react';
import { getDexPools } from '@/lib/h5-mock';

export default function H5DexAddPage() {
  const [pct1, setPct1] = useState(50);
  const [pct2, setPct2] = useState(50);
  const [amt1, setAmt1] = useState('1.0');
  const [amt2, setAmt2] = useState('3512.80');
  const pools = getDexPools();
  const pool = pools[0];

  const setQuick = (p: number) => {
    setPct1(p);
    setPct2(p);
  };

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#34D399', borderRadius: 2 }} />
        <Plus size={16} color="#34D399" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>添加流动性</span>
      </div>

      {/* 池信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.40) 0%, rgba(23, 37, 84, 0.40) 100%)', border: '1px solid rgba(34, 211, 238, 0.30)', borderRadius: 14, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0F1B3D' }}>{pool.token0.slice(0, 2)}</div>
          <div style={{ position: 'absolute', right: -10, top: 0, width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', border: '2px solid #131E45' }}>{pool.token1.slice(0, 2)}</div>
        </div>
        <div style={{ flex: 1, marginLeft: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{pool.pair}</div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>APR {pool.apr} · TVL {pool.tvl}</div>
        </div>
        <button style={{ padding: '6px 10px', background: 'rgba(34, 211, 238, 0.20)', border: '1px solid rgba(34, 211, 238, 0.40)', color: '#22D3EE', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          切换 <ChevronDown size={12} />
        </button>
      </div>

      {/* 输入框 1 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8', marginBottom: 6 }}>
          <span>投入</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Wallet size={11} /> 余额 12.456 {pool.token0}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amt1} onChange={e => setAmt1(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 24, fontWeight: 700, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }} />
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(240, 185, 11, 0.20)', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0F1B3D' }}>{pool.token0.slice(0, 2)}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{pool.token0}</span>
          </button>
        </div>
      </div>

      {/* 加号 */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(15, 27, 61, 0.80)', border: '2px solid rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={14} color="#22D3EE" />
        </div>
      </div>

      {/* 输入框 2 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8', marginBottom: 6 }}>
          <span>投入</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Wallet size={11} /> 余额 32,456.78 {pool.token1}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amt2} onChange={e => setAmt2(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 24, fontWeight: 700, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }} />
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(52, 211, 153, 0.20)', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{pool.token1.slice(0, 2)}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{pool.token1}</span>
          </button>
        </div>
      </div>

      {/* 快捷比例 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {['25%', '50%', '75%', 'MAX'].map(p => (
          <button key={p} onClick={() => setQuick(parseInt(p))} style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.20)', color: '#22D3EE', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
        ))}
      </div>

      {/* 详情 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Info size={13} color="#22D3EE" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>添加详情</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>汇率</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>1 {pool.token0} = 3,512.80 {pool.token1}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>价格影响</span>
          <span style={{ color: '#34D399', fontWeight: 600 }}>&lt; 0.01%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>将获得 LP</span>
          <span style={{ color: '#FCD535', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>1,866.21 LP</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>池占比</span>
          <span style={{ color: '#22D3EE', fontWeight: 600 }}>{pct1 < 0.01 ? '~ 0%' : (pct1 * 0.001).toFixed(4) + '%'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.20)', borderRadius: 10, marginBottom: 14 }}>
        <Zap size={14} color="#22D3EE" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>添加流动性将获得 LP Token，凭 LP 凭证可随时赎回池中份额并获取手续费分成。</div>
      </div>

      <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', color: '#0F1B3D', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(52, 211, 153, 0.30)' }}>
        <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 添加流动性
      </button>
    </div>
  );
}
