'use client';
import { useState } from 'react';
import {
  Minus, Wallet, Info, AlertCircle, Check, ArrowDown, TrendingDown, Coins,
} from 'lucide-react';
import { getDexPools } from '@/lib/h5-mock';

export default function H5DexRemovePage() {
  const [pct, setPct] = useState(50);
  const pools = getDexPools();
  const pool = pools[0];
  const myLP = '1,866.21';
  const myValue = '$1,250.00';
  const removeLP = (parseFloat(myLP.replace(/,/g, '')) * pct / 100).toFixed(2);
  const ethGet = (1.0 * pct / 100).toFixed(6);
  const usdtGet = (3512.80 * pct / 100).toFixed(2);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <Minus size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>移除流动性</span>
      </div>

      {/* 池信息 + 我的 */}
      <div style={{ background: 'linear-gradient(135deg, #DB2777 0%, #BE185D 50%, #831843 100%)', borderRadius: 16, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244, 114, 182, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0F1B3D' }}>{pool.token0.slice(0, 2)}</div>
            <div style={{ position: 'absolute', right: -10, top: 0, width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', border: '2px solid #831843' }}>{pool.token1.slice(0, 2)}</div>
          </div>
          <div style={{ flex: 1, marginLeft: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{pool.pair}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.70)' }}>我的 LP {myLP}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>我的份额价值</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FCD535', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{myValue}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>池占比</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>0.0026%</div>
          </div>
        </div>
      </div>

      {/* 移除数量滑块 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>移除数量</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#F472B6' }}>{pct}%</span>
        </div>
        <input type="range" min={0} max={100} value={pct} onChange={e => setPct(parseInt(e.target.value))}
          style={{ width: '100%', height: 6, borderRadius: 3, appearance: 'none', background: `linear-gradient(90deg, #F472B6 0%, #F472B6 ${pct}%, rgba(15, 27, 61, 0.60) ${pct}%, rgba(15, 27, 61, 0.60) 100%)`, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {[25, 50, 75, 100].map(n => (
            <button key={n} onClick={() => setPct(n)} style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: pct === n ? 'rgba(244, 114, 182, 0.20)' : 'rgba(15, 27, 61, 0.40)', border: '1px solid', borderColor: pct === n ? '#F472B6' : 'rgba(148, 163, 184, 0.20)', color: pct === n ? '#F472B6' : '#7B89B8', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{n}%</button>
          ))}
        </div>
      </div>

      {/* 将获得 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Coins size={13} color="#FCD535" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>将获得</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 10, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0F1B3D' }}>{pool.token0.slice(0, 2)}</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>{ethGet} {pool.token0}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#FCD535', fontWeight: 600 }}>≈ ${(parseFloat(ethGet) * 3512.80).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{pool.token1.slice(0, 2)}</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>{usdtGet} {pool.token1}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#FCD535', fontWeight: 600 }}>≈ ${usdtGet}</span>
        </div>
      </div>

      {/* 详情 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>销毁 LP</span>
          <span style={{ color: '#F472B6', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{removeLP} LP</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>价格影响</span>
          <span style={{ color: '#34D399', fontWeight: 600 }}>&lt; 0.01%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>预计收到</span>
          <span style={{ color: '#FCD535', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${(parseFloat(usdtGet) + parseFloat(ethGet) * 3512.80).toFixed(2)}</span>
        </div>
      </div>

      <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', color: '#0F1B3D', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(244, 114, 182, 0.30)' }}>
        <Minus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 确认移除 {pct}%
      </button>
    </div>
  );
}
