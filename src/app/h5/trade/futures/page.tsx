'use client';

/**
 * H5 永续合约交易页 — 真实后端数据
 */

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, TrendingDown, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { useTickerData } from '@/hooks/useMarketData';
import { perpApi } from '@/lib/api/perp';

const LEVERAGES = [10, 20, 50, 100, 125];

function H5FuturesPageInner() {
  const searchParams = useSearchParams();
  const h5Symbol = searchParams.get('symbol') ?? 'BTC/USDT';
  const apiSymbol = h5Symbol.replace('/', '');   // 'BTC/USDT' → 'BTCUSDT'
  const baseCoin = h5Symbol.split('/')[0];

  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(20);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── 真实行情 ────────────────────────────────────────────────────────────────
  const { ticker, loading } = useTickerData(apiSymbol, 3000);
  const markPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const pct = ticker ? parseFloat(ticker.changePercent24h) : 0;
  const priceUp = pct >= 0;

  // 初始化限价价格
  useEffect(() => {
    if (ticker && !price) setPrice(parseFloat(ticker.lastPrice).toFixed(2));
  }, [ticker?.lastPrice]);

  // 预估强平价（简化公式：逐仓）
  const liqPrice = useMemo(() => {
    const p = orderType === 'market' ? markPrice : parseFloat(price) || 0;
    if (!p) return '—';
    const liq = side === 'long' ? p * (1 - 0.9 / leverage) : p * (1 + 0.9 / leverage);
    return liq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [price, orderType, markPrice, leverage, side]);

  // ── 下单 ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    setSubmitMsg(null);
    try {
      await perpApi.placeOrder({
        symbol: apiSymbol,
        side: side === 'long' ? 'buy' : 'sell',
        type: orderType,
        quantity: amount,
        price: orderType === 'limit' ? price : undefined,
        leverage,
        marginMode: 'isolated',
      });
      setSubmitMsg({ type: 'ok', text: '下单成功 ✓' });
      setAmount('');
    } catch (e: any) {
      setSubmitMsg({ type: 'err', text: e.message || '下单失败' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMsg(null), 3000);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 顶部信息栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>{h5Symbol}</span>
          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.20)', color: '#A78BFA', fontWeight: 700 }}>永续</span>
          <ChevronDown size={14} color="#7B89B8" />
          {loading && <Loader2 size={12} color="#F0B90B" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>
        <div style={{ fontSize: 13, color: priceUp ? '#34D399' : '#F472B6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
        </div>
      </div>

      {/* 价格大卡 */}
      <div style={{
        background: side === 'long'
          ? 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)'
          : 'linear-gradient(135deg, #7F1D1D 0%, #7C2D12 100%)',
        borderRadius: 18, padding: 18, marginBottom: 12, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>标记价格 (Mark)</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {markPrice ? markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>USDT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
          <Cell label="指数价格" value={ticker ? parseFloat(ticker.lastPrice).toFixed(2) : '—'} color="rgba(255,255,255,0.85)" />
          <Cell label="资金费率" value={ticker?.fundingRate ? `${(parseFloat(ticker.fundingRate) * 100).toFixed(4)}%` : '—'} color="#FCD535" />
          <Cell label="24H最高" value={ticker?.high24h ? parseFloat(ticker.high24h).toFixed(2) : '—'} color="rgba(255,255,255,0.85)" />
          <Cell label="24H最低" value={ticker?.low24h ? parseFloat(ticker.low24h).toFixed(2) : '—'} color="rgba(255,255,255,0.85)" />
        </div>
      </div>

      {/* K线占位 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(26,36,86,0.55) 0%, rgba(21,34,74,0.70) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 16, padding: 14, marginBottom: 12,
        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7B89B8', fontSize: 12,
      }}>
        📈 K线 + 持仓量 + 深度图（即将接入）
      </div>

      {/* 杠杆选择 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(26,36,86,0.55) 0%, rgba(21,34,74,0.70) 100%)',
        border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 14, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>杠杆倍数</span>
          <span style={{ fontSize: 13, color: '#FCD535', fontWeight: 700 }}>{leverage}x</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {LEVERAGES.map((l) => (
            <button key={l} onClick={() => setLeverage(l)} style={{
              padding: '8px 0', borderRadius: 8,
              background: l === leverage ? 'rgba(252,213,53,0.20)' : 'rgba(148,163,184,0.08)',
              border: l === leverage ? '1px solid rgba(252,213,53,0.40)' : '1px solid rgba(148,163,184,0.10)',
              color: l === leverage ? '#FCD535' : '#B4C0E0',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{l}x</button>
          ))}
        </div>
      </div>

      {/* 买/卖 + 下单 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(26,36,86,0.55) 0%, rgba(21,34,74,0.70) 100%)',
        border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 14, marginBottom: 12,
      }}>
        {/* 做多/做空 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setSide('long')} style={{
            padding: '12px 0', borderRadius: 10, border: 'none',
            background: side === 'long' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'rgba(148,163,184,0.10)',
            color: side === 'long' ? '#fff' : '#7B89B8',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <TrendingUp size={14} /> 做多
          </button>
          <button onClick={() => setSide('short')} style={{
            padding: '12px 0', borderRadius: 10, border: 'none',
            background: side === 'short' ? 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)' : 'rgba(148,163,184,0.10)',
            color: side === 'short' ? '#fff' : '#7B89B8',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <TrendingDown size={14} /> 做空
          </button>
        </div>

        {/* 限价/市价 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {(['limit', 'market'] as const).map((t) => (
            <button key={t} onClick={() => setOrderType(t)} style={{
              flex: 1, padding: '6px 0', borderRadius: 8,
              background: orderType === t ? 'rgba(56,189,248,0.20)' : 'transparent',
              color: orderType === t ? '#38BDF8' : '#7B89B8',
              border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {t === 'limit' ? '限价' : '市价'}
            </button>
          ))}
        </div>

        {orderType === 'limit' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#7B89B8', marginBottom: 4 }}>委托价 (USDT)</div>
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(15,27,61,0.50)', border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: 10, color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }} />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#7B89B8' }}>数量</span>
            <span style={{ fontSize: 11, color: '#7B89B8' }}>可用: <span style={{ color: '#FCD535' }}>5,000.00 USDT</span></span>
          </div>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{
            width: '100%', padding: '10px 14px',
            background: 'rgba(15,27,61,0.50)', border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 10, color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
          {['25%', '50%', '75%', 'MAX'].map((p, i) => (
            <button key={p} onClick={() => setAmount(((5000 * [0.25, 0.5, 0.75, 1][i]) / (markPrice || 1)).toFixed(6))} style={{
              padding: '6px 0', borderRadius: 6,
              background: 'rgba(148,163,184,0.10)', border: '1px solid rgba(148,163,184,0.18)',
              color: '#B4C0E0', fontSize: 11, cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>

        {/* 风险提示 */}
        <div style={{
          background: 'rgba(244,114,182,0.10)', border: '1px solid rgba(244,114,182,0.20)',
          borderRadius: 8, padding: 8, marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertCircle size={12} color="#F472B6" />
          <span style={{ fontSize: 11, color: '#B4C0E0' }}>
            {leverage}x 杠杆, 预估强平价 ≈ {liqPrice} USDT
          </span>
        </div>

        {/* 提交反馈 */}
        {submitMsg && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 12, fontWeight: 600, textAlign: 'center',
            background: submitMsg.type === 'ok' ? 'rgba(52,211,153,0.12)' : 'rgba(244,114,182,0.12)',
            color: submitMsg.type === 'ok' ? '#34D399' : '#F472B6',
            border: `1px solid ${submitMsg.type === 'ok' ? 'rgba(52,211,153,0.25)' : 'rgba(244,114,182,0.25)'}`,
          }}>
            {submitMsg.text}
          </div>
        )}

        <button onClick={handleSubmit} disabled={isSubmitting} style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: isSubmitting ? 'rgba(148,163,184,0.20)' : side === 'long'
            ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
            : 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
          boxShadow: side === 'long' ? '0 4px 16px rgba(52,211,153,0.30)' : '0 4px 16px rgba(244,114,182,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {isSubmitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {side === 'long' ? '做多' : '做空'} {baseCoin}
        </button>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

export default function H5FuturesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: '#7B89B8' }}>加载中...</div>}>
      <H5FuturesPageInner />
    </Suspense>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
