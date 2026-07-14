'use client';

/**
 * H5 交易页 v3 — 后端 API 轮询（国内可用，不依赖 Binance WS）
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, ChevronDown, Copy, Crown, BarChart3, Activity, Loader2 } from 'lucide-react';
import {
  type Candle,
  type PeriodKey,
  PERIODS,
  sma as ma,
} from '@/lib/shared';
import type { KlineInterval } from '@/lib/market/kline';
import { PAIR_MAP, TOP20_PAIRS } from '@/lib/h5/top20-pairs';
import { ConnectionStatus } from './ConnectionStatus';
import { KLineChart } from './KLineChart';
import { spotApi } from '@/lib/api/spot';
import { useTickerData, useKlineData } from '@/hooks/useMarketData';

// =============================================================================
// PeriodKey ↔ API interval 映射
// =============================================================================
const PERIOD_TO_INTERVAL: Record<PeriodKey, string> = {
  '1m':  '1m',
  '5m':  '5m',
  '15m': '15m',
  '1H':  '1h',
  '4H':  '4h',
  '1D':  '1d',
};

// =============================================================================
// 主组件
// =============================================================================

export default function H5Trade() {
  const params = useSearchParams();
  const urlSymbol = params.get('symbol') || 'BTC/USDT';
  const symbol = PAIR_MAP[urlSymbol] ? urlSymbol : 'BTC/USDT';
  const pairMeta = PAIR_MAP[symbol];

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('15m');
  const [showMA, setShowMA] = useState({ ma5: true, ma10: true, ma20: true, ma60: false });

  // H5 symbol 'BTC/USDT' → API symbol 'BTCUSDT'
  const apiSymbol = symbol.replace('/', '');
  const limit = PERIODS.find((p) => p.key === period)?.count ?? 100;

  // === 后端 API 轮询（替代 Binance WS）===
  const { ticker, loading: tickerLoading } = useTickerData(apiSymbol, 3000);
  const { klines, loading } = useKlineData(apiSymbol, PERIOD_TO_INTERVAL[period], limit, 10000);

  // KlineBar → Candle
  const history: Candle[] = useMemo(() => klines.map((k) => ({
    time:   k.openTime,
    open:   parseFloat(k.open),
    high:   parseFloat(k.high),
    low:    parseFloat(k.low),
    close:  parseFloat(k.close),
    volume: parseFloat(k.volume),
  })), [klines]);

  const loadError = null;

  // 头部价
  const lastPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const last24hChange = ticker ? parseFloat(ticker.changePercent24h) : 0;
  const high24h = ticker ? parseFloat(ticker.high24h) : 0;
  const low24h = ticker ? parseFloat(ticker.low24h) : 0;
  const trendUp = last24hChange >= 0;

  // 同步最新价到下单输入（限价模式）
  useEffect(() => {
    if (orderType === 'limit' && lastPrice > 0) {
      setPrice(lastPrice.toString());
    }
  }, [lastPrice, orderType]);

  // === MA ===
  const candles = history;
  const ma5  = useMemo(() => showMA.ma5  ? ma(candles, 5)  : [], [candles, showMA.ma5]);
  const ma10 = useMemo(() => showMA.ma10 ? ma(candles, 10) : [], [candles, showMA.ma10]);
  const ma20 = useMemo(() => showMA.ma20 ? ma(candles, 20) : [], [candles, showMA.ma20]);
  const ma60 = useMemo(() => showMA.ma60 ? ma(candles, 60) : [], [candles, showMA.ma60]);

  // 综合状态（兼容 ConnectionStatus 组件）
  const status = tickerLoading ? 'connecting' : ticker ? 'online' : 'offline';
  const offline = status === 'offline';
  const base = symbol.split('/')[0];

  const submitSpotOrder = async () => {
    setOrderError('');
    setOrderMessage('');

    if (offline) {
      setOrderError('行情连接断开，暂不允许提交订单');
      return;
    }

    if (orderType === 'market') {
      setOrderError('后端当前未开放市价单，请先使用限价单');
      return;
    }

    const amountNum = Number(amount);
    const priceNum = Number(price);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setOrderError('请输入有效数量');
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setOrderError('请输入有效限价');
      return;
    }

    setSubmitting(true);
    try {
      const order = await spotApi.placeOrder({
        symbol,
        side,
        type: orderType,
        quantity: amount,
        price,
      });
      setOrderMessage(`订单已提交：${order.status}${order.matched ? '，已撮合成交' : ''}`);
      setAmount('');
    } catch (e: any) {
      setOrderError(e?.message || '订单提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 交易对选择栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 4px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pairMeta && (
            <span style={{ fontSize: 18, color: pairMeta.color }}>{pairMeta.emoji}</span>
          )}
          <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>{base}</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>/USDT</span>
          <ChevronDown size={14} color="#7B89B8" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ConnectionStatus status={status} />
          {ticker && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: trendUp ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                color: trendUp ? '#34D399' : '#F472B6',
                fontWeight: 600,
              }}
            >
              {last24hChange >= 0 ? '+' : ''}{last24hChange.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* 跟单交易入口 */}
      <Link
        href="/h5/trade/copy"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 10,
          background: 'linear-gradient(135deg, rgba(240,185,11,0.18) 0%, rgba(167,139,250,0.08) 100%)',
          border: '1px solid rgba(240,185,11,0.30)',
          borderRadius: 10, textDecoration: 'none',
        }}
      >
        <Crown size={14} color="#F0B90B" />
        <span style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>跟单交易 · 跟随大师躺赚</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(240,185,11,0.30)', color: '#F0B90B', fontWeight: 800 }}>+38.6%</span>
        <Copy size={11} color="#F0B90B" />
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
        <Link
          href="/h5/trade/orders"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(56,189,248,0.24)',
            background: 'rgba(56,189,248,0.10)',
            color: '#38BDF8',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Activity size={13} />
          当前委托
        </Link>
        <Link
          href="/h5/trade/history"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(240,185,11,0.24)',
            background: 'rgba(240,185,11,0.10)',
            color: '#FCD535',
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <BarChart3 size={13} />
          历史订单
        </Link>
      </div>

      {/* 价格大数字卡 */}
      <div
        style={{
          background: trendUp
            ? 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)'
            : 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: trendUp
              ? 'radial-gradient(circle, rgba(52, 211, 153, 0.30) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(244, 114, 182, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', position: 'relative' }}>
          当前价格 · 实时
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginTop: 4,
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#fff',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {lastPrice > 0 ? lastPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>
            USDT
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            marginTop: 14,
            position: 'relative',
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>24h 最高</div>
            <div style={{ fontSize: 13, color: '#34D399', fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {high24h > 0 ? high24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
            </div>
          </div>
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>24h 最低</div>
            <div style={{ fontSize: 13, color: '#F472B6', fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {low24h > 0 ? low24h.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* K 线图（真实数据） */}
      <KLineChart
        candles={candles}
        ma5={ma5}
        ma10={ma10}
        ma20={ma20}
        ma60={ma60}
        showMA={showMA}
        onToggleMA={(k) => setShowMA({ ...showMA, [k]: !showMA[k] })}
        period={period}
        onPeriod={setPeriod}
        trendUp={trendUp}
        loading={loading}
        loadError={loadError}
      />

      {/* 下单面板 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          opacity: offline ? 0.55 : 1,
        }}
      >
        {/* 买/卖 Tab */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setSide('buy')}
            disabled={offline}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: side === 'buy' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: side === 'buy' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700,
              cursor: offline ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <TrendingUp size={14} /> 买入
          </button>
          <button
            onClick={() => setSide('sell')}
            disabled={offline}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: side === 'sell' ? 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: side === 'sell' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700,
              cursor: offline ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <TrendingDown size={14} /> 卖出
          </button>
        </div>

        {/* 限价/市价 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {(['limit', 'market'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              disabled={offline}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8,
                background: orderType === t ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: orderType === t ? '#38BDF8' : '#7B89B8',
                border: 'none', fontSize: 12, fontWeight: 600,
                cursor: offline ? 'not-allowed' : 'pointer',
              }}
            >
              {t === 'limit' ? '限价' : '市价'}
            </button>
          ))}
        </div>

        {/* 价格输入 */}
        {orderType === 'limit' && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#7B89B8', marginBottom: 4 }}>价格 (USDT)</div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={offline}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(15, 27, 61, 0.50)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                borderRadius: 10, color: '#F8FAFC', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* 数量输入 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#7B89B8', marginBottom: 4 }}>数量 ({base})</div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={offline}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(15, 27, 61, 0.50)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: 10, color: '#F8FAFC', fontSize: 14,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
          {['25%', '50%', '75%', '100%'].map((p) => (
            <button
              key={p}
              disabled={offline}
              style={{
                padding: '6px 0', borderRadius: 6,
                background: 'rgba(148, 163, 184, 0.10)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                color: '#B4C0E0', fontSize: 11,
                cursor: offline ? 'not-allowed' : 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {orderError && (
          <TradeNotice color="#FCD535" icon={<AlertCircle size={14} color="#FCD535" />}>
            {orderError}
          </TradeNotice>
        )}

        {orderMessage && (
          <TradeNotice color="#34D399" icon={<CheckCircle2 size={14} color="#34D399" />}>
            {orderMessage}
          </TradeNotice>
        )}

        <button
          onClick={submitSpotOrder}
          disabled={offline || submitting}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
            background: side === 'buy'
              ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
              : 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: offline || submitting ? 'not-allowed' : 'pointer',
            boxShadow: side === 'buy' ? '0 4px 16px rgba(52, 211, 153, 0.30)' : '0 4px 16px rgba(244, 114, 182, 0.30)',
            opacity: offline || submitting ? 0.5 : 1,
          }}
        >
          {submitting ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" />提交中</span> : offline ? '连接已断开，请稍候' : `${side === 'buy' ? '买入' : '卖出'} ${base}`}
        </button>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function TradeNotice({ children, icon, color }: { children: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 10,
        border: `1px solid ${color === '#34D399' ? 'rgba(52, 211, 153, 0.26)' : 'rgba(240, 185, 11, 0.24)'}`,
        background: color === '#34D399' ? 'rgba(52, 211, 153, 0.10)' : 'rgba(240, 185, 11, 0.10)',
        color,
        fontSize: 11,
        lineHeight: 1.5,
        marginBottom: 10,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
