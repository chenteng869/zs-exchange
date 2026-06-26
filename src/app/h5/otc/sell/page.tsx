'use client';
import { useState } from 'react';
import {
  Handshake, ChevronRight, BadgeCheck, Star, Clock, ArrowLeft, Wallet, AlertCircle, ShieldCheck, TrendingDown, Coins,
} from 'lucide-react';
import { getOtcMerchants } from '@/lib/h5-mock';

const PAYMENT_COLOR = { '银行转账': '#38BDF8', '支付宝': '#22D3EE', '微信': '#34D399', 'PayPal': '#A78BFA', '对公账户': '#FCD535' };

export default function H5OtcSellPage() {
  const [amount, setAmount] = useState('1000');
  const merchants = getOtcMerchants().filter(m => m.online).slice(0, 4);

  const numAmt = parseFloat(amount) || 0;
  const rate = 7.15;
  const cny = (numAmt * rate).toFixed(2);
  const cnyNum = parseFloat(cny);
  const fee = (cnyNum * 0.001).toFixed(2);
  const actual = (cnyNum - parseFloat(fee)).toFixed(2);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      <a href="/h5/otc/market" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7B89B8', textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> 返回集市
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#F472B6', borderRadius: 2 }} />
        <TrendingDown size={16} color="#F472B6" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>卖币 (OTC)</span>
      </div>

      {/* 当前价格 */}
      <div style={{ background: 'linear-gradient(135deg, #DB2777 0%, #BE185D 50%, #831843 100%)', borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244, 114, 182, 0.40) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>USDT 当前卖价</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD535', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>¥ {rate}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(244, 114, 182, 0.20)', color: '#F472B6', fontWeight: 700 }}>-0.05%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)', marginTop: 4 }}>高于市场 0.3%</div>
          </div>
        </div>
      </div>

      {/* 卖出数量 */}
      <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B89B8', marginBottom: 8 }}>
          <span>卖出数量 (USDT)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Wallet size={11} /> 余额 12,456.78 USDT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 24, fontWeight: 700, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>USDT</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map(p => (
            <button key={p} onClick={() => setAmount(p === 'MAX' ? '12456.78' : ((parseFloat(p) / 100) * 12456.78).toFixed(2))} style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.20)', color: '#F472B6', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      {/* 预计获得 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(244, 114, 182, 0.30)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Coins size={13} color="#F472B6" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>预计获得</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>卖出总金额</span>
          <span style={{ color: '#FCD535', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>¥{cny}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ color: '#7B89B8' }}>手续费 (0.1%)</span>
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>¥{fee}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
          <span style={{ color: '#7B89B8', fontWeight: 700 }}>实收</span>
          <span style={{ color: '#F472B6', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>¥{actual}</span>
        </div>
      </div>

      {/* 商家选择 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>选择商家</span>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(244, 114, 182, 0.15)', color: '#F472B6' }}>{merchants.length} 家</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {merchants.map((m, i) => (
          <div key={m.id} style={{ padding: 12, background: i === 0 ? 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid', borderColor: i === 0 ? '#F472B6' : 'rgba(148, 163, 184, 0.12)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{m.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{m.name}</span>
                  {m.verified && <BadgeCheck size={11} color="#38BDF8" />}
                </div>
                <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>买入 {m.completedOrders.toLocaleString()} · {m.completionRate}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD535' }}>¥{rate}</div>
                <div style={{ fontSize: 9, color: '#34D399' }}><Clock size={9} style={{ display: 'inline', verticalAlign: -1 }} /> {m.avgReleaseTime}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {m.paymentMethods.map(p => (
                <span key={p} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${PAYMENT_COLOR[p as keyof typeof PAYMENT_COLOR] || '#7B89B8'}26`, color: PAYMENT_COLOR[p as keyof typeof PAYMENT_COLOR] || '#7B89B8', fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, background: 'rgba(244, 114, 182, 0.08)', border: '1px solid rgba(244, 114, 182, 0.20)', borderRadius: 10, marginBottom: 14 }}>
        <AlertCircle size={14} color="#F472B6" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>卖币流程：商家下单 → 您收款 → 确认放币 → USDT 划转给商家。收到款项后再放币，避免资金损失。</div>
      </div>

      <button style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', color: '#0F1B3D', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(244, 114, 182, 0.30)' }}>
        <Handshake size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> 立即卖出
      </button>
    </div>
  );
}
