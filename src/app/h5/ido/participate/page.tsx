'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Rocket, Wallet, Info, ShieldCheck, ChevronRight, ArrowLeft, Award, AlertCircle, TrendingUp,
} from 'lucide-react';
import { getIdoById } from '@/lib/h5-mock';

function Form() {
  const sp = useSearchParams();
  const id = sp.get('id') || 'IDO-001';
  const project = getIdoById(id);

  const [tierIdx, setTierIdx] = useState(0);
  const [amount, setAmount] = useState('500');

  if (!project) return <div style={{ padding: 20, color: '#7B89B8' }}>项目不存在</div>;
  const tier = project.tiers[tierIdx];
  const numAmt = parseFloat(amount) || 0;
  const tokens = (numAmt / parseFloat(tier.price.replace('$', ''))).toFixed(2);
  const ratio = (numAmt / parseFloat(tier.allocation.replace(/[^\d.]/g, '')) * 100).toFixed(1);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <a href={`/h5/ido/detail/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7B89B8', textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> 返回项目
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>参与 IDO</span>
      </div>

      {/* 项目信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.40) 0%, rgba(23, 37, 84, 0.40) 100%)', border: '1px solid rgba(240, 185, 11, 0.30)', borderRadius: 14, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#0F1B3D' }}>{project.logo}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{project.name}</div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{project.symbol} · {project.price} · {project.network}</div>
        </div>
      </div>

      {/* 档位选择 */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>选择认购档位</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {project.tiers.map((t, i) => (
          <button key={i} onClick={() => setTierIdx(i)}
            style={{ padding: 12, background: tierIdx === i ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.20) 0%, rgba(252, 213, 53, 0.10) 100%)' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid', borderColor: tierIdx === i ? '#F0B90B' : 'rgba(148, 163, 184, 0.12)', borderRadius: 12, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: i === 0 ? '#34D39926' : i === 1 ? '#38BDF826' : i === 2 ? '#F0B90B26' : '#A78BFA26', color: i === 0 ? '#34D399' : i === 1 ? '#38BDF8' : i === 2 ? '#F0B90B' : '#A78BFA', fontSize: 11, fontWeight: 700 }}>{t.name}</span>
              <span style={{ fontSize: 10, color: '#7B89B8' }}>需持仓 {t.minHold}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#FCD535' }}>{t.price}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7B89B8' }}>
              <span>配额度 {t.allocation}</span>
              <span>已售 {t.soldPct}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* 认购数量 */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>认购金额 (USDT)</div>
      <div style={{ padding: 14, background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8', marginBottom: 8 }}>
          <span>投入</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Wallet size={11} /> 余额 32,456.78 USDT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 24, fontWeight: 700, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>USDT</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map(p => (
            <button key={p} style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: 'rgba(240, 185, 11, 0.08)', border: '1px solid rgba(240, 185, 11, 0.20)', color: '#FCD535', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      {/* 预计获得 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(240, 185, 11, 0.30)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <TrendingUp size={14} color="#FCD535" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>预计获得</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>获得代币</span>
          <span style={{ color: '#FCD535', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{tokens} {project.symbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>占档位配比</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{ratio}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8' }}>释放规则</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{project.vesting}</span>
        </div>
      </div>

      {/* 风险提示 */}
      <div style={{ display: 'flex', gap: 8, padding: 10, background: 'rgba(240, 185, 11, 0.08)', border: '1px solid rgba(240, 185, 11, 0.20)', borderRadius: 10, marginBottom: 14 }}>
        <AlertCircle size={14} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>IDO 认购存在市场风险，请根据自身风险承受能力谨慎参与；代币价格可能低于认购价，导致本金损失。</div>
      </div>

      {/* 同意条款 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={10} color="#0F1B3D" />
        </div>
        <span style={{ fontSize: 11, color: '#7B89B8' }}>我已阅读并同意 <span style={{ color: '#FCD535' }}>《IDO 认购协议》</span></span>
      </div>

      <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', color: '#0F1B3D', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)' }}>
        <Rocket size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 确认认购
      </button>
    </div>
  );
}

export default function H5IdoParticipatePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: '#7B89B8' }}>加载中...</div>}>
      <Form />
    </Suspense>
  );
}
