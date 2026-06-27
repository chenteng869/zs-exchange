'use client';

/**
 * H5 交易页 v3 — 后端 API 轮询（国内可用，不依赖 Binance WS）
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, ChevronDown, Copy, Crown, BarChart3, Activity, Loader2, Maximize2 } from 'lucide-react';
import {
  type Candle,
  type PeriodKey,
  PERIODS,
  sma as ma,
  fmtPrice,
  fmtTimeByPeriod,
} from '@/lib/shared';
import type { KlineInterval } from '@/lib/market/kline';
import { PAIR_MAP, TOP20_PAIRS } from '@/lib/h5/top20-pairs';
import { ConnectionStatus } from './ConnectionStatus';
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

      {/* K 线图（真实 Binance OHLC） */}
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
        symbol={symbol}
        trendUp={trendUp}
        loading={loading}
        loadError={loadError}
        status={status}
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

// =============================================================================
// KLineChart 子组件
// =============================================================================

interface KLineProps {
  candles: Candle[];
  ma5:  (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  ma60: (number | null)[];
  showMA: { ma5: boolean; ma10: boolean; ma20: boolean; ma60: boolean };
  onToggleMA: (k: 'ma5' | 'ma10' | 'ma20' | 'ma60') => void;
  period: PeriodKey;
  onPeriod: (p: PeriodKey) => void;
  symbol: string;
  trendUp: boolean;
  loading: boolean;
  loadError: string | null;
  status: 'connecting' | 'online' | 'offline';
}

function KLineChart({ candles, ma5, ma10, ma20, ma60, showMA, onToggleMA, period, onPeriod, symbol, trendUp, loading, loadError, status }: KLineProps) {
  const W = 320, H = 220;
  const padL = 8, padR = 56, padT = 12, padB = 18;
  const cw = W - padL - padR;
  const ch = H - padT - padB;
  const volH = 36;
  const priceH = ch - volH - 4;

  const ready = !loading && !loadError && candles.length > 0;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
      }}
    >
      {/* 顶部：周期切换 + 工具按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriod(p.key)}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
              background: period === p.key ? 'rgba(240,185,11,0.20)' : 'rgba(148, 163, 184, 0.05)',
              border: period === p.key ? '1px solid rgba(240,185,11,0.40)' : '1px solid transparent',
              color: period === p.key ? '#F0B90B' : '#7B89B8',
              fontWeight: period === p.key ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <BarChart3 size={12} color="#7B89B8" style={{ cursor: 'pointer' }} />
          <Activity size={12} color="#7B89B8" style={{ cursor: 'pointer' }} />
          <Maximize2 size={12} color="#7B89B8" style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* MA 指标切换 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 10, color: '#7B89B8' }}>
        <span>指标：</span>
        {([
          { k: 'ma5',  label: 'MA5',  color: '#FCD535' },
          { k: 'ma10', label: 'MA10', color: '#A78BFA' },
          { k: 'ma20', label: 'MA20', color: '#38BDF8' },
          { k: 'ma60', label: 'MA60', color: '#F472B6' },
        ] as const).map((m) => (
          <button
            key={m.k}
            onClick={() => onToggleMA(m.k as any)}
            style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
              background: showMA[m.k as keyof typeof showMA] ? `${m.color}25` : 'rgba(148,163,184,0.05)',
              border: `1px solid ${showMA[m.k as keyof typeof showMA] ? m.color : 'rgba(148,163,184,0.20)'}`,
              color: showMA[m.k as keyof typeof showMA] ? m.color : '#7B89B8',
              fontWeight: showMA[m.k as keyof typeof showMA] ? 700 : 500,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* K 线 SVG / 骨架屏 / 错误 / 断线 */}
      {loadError && (
        <div style={{ padding: 32, textAlign: 'center', color: '#F472B6', fontSize: 12 }}>
          K 线加载失败：{loadError}
        </div>
      )}

      {!loadError && loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>
          正在拉取历史 K 线…
        </div>
      )}

      {!loadError && !loading && candles.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>
          暂无数据
        </div>
      )}

      {ready && (
        <KLineSvg
          candles={candles}
          ma5={ma5} ma10={ma10} ma20={ma20} ma60={ma60}
          showMA={showMA}
          period={period}
          trendUp={trendUp}
          W={W} H={H} padL={padL} padR={padR} padT={padT} padB={padB}
          volH={volH} priceH={priceH} cw={cw}
        />
      )}

      {/* 底部 K 线数据：开/高/低/收 */}
      {ready && candles.length > 0 && (() => {
        const last = candles[candles.length - 1];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8, fontSize: 9 }}>
            {[
              { l: '开',  v: last.open,  c: '#7B89B8' },
              { l: '高',  v: last.high,  c: '#34D399' },
              { l: '低',  v: last.low,   c: '#F472B6' },
              { l: '收',  v: last.close, c: trendUp ? '#34D399' : '#F472B6' },
            ].map((d) => (
              <div key={d.l} style={{ background: 'rgba(148,163,184,0.05)', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                <div style={{ color: '#7B89B8', fontSize: 8 }}>{d.l}</div>
                <div style={{ color: d.c, fontWeight: 700, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{fmtPrice(d.v)}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// =============================================================================
// KLineSvg（独立子组件，K 线数据准备就绪后才挂载）
// =============================================================================

interface KLineSvgProps {
  candles: Candle[];
  ma5:  (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  ma60: (number | null)[];
  showMA: { ma5: boolean; ma10: boolean; ma20: boolean; ma60: boolean };
  period: PeriodKey;
  trendUp: boolean;
  W: number; H: number;
  padL: number; padR: number; padT: number; padB: number;
  volH: number; priceH: number; cw: number;
}

function KLineSvg({ candles, ma5, ma10, ma20, ma60, showMA, period, trendUp, W, H, padL, padR, padT, volH, priceH, cw }: KLineSvgProps) {
  const highs = candles.map((c) => c.high);
  const lows  = candles.map((c) => c.low);
  const maxP = Math.max(...highs);
  const minP = Math.min(...lows);
  const padR2 = (maxP - minP) * 0.05 || maxP * 0.005;
  const yMax = maxP + padR2;
  const yMin = minP - padR2;
  const yRange = yMax - yMin || 1;

  const candleW = cw / candles.length;
  const bodyW = Math.max(candleW * 0.65, 1);
  const xCenter = (i: number) => padL + i * candleW + candleW / 2;
  const yPrice  = (p: number) => padT + priceH - ((p - yMin) / yRange) * priceH;

  const maxV = Math.max(...candles.map((c) => c.volume)) || 1;
  const yVol = (v: number) => padT + priceH + 4 + (volH - (v / maxV) * volH);

  const maPath = (arr: (number | null)[]) => {
    const segs: string[] = [];
    let started = false;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v == null) { started = false; continue; }
      const x = xCenter(i).toFixed(1);
      const y = yPrice(v).toFixed(1);
      segs.push(`${started ? 'L' : 'M'} ${x} ${y}`);
      started = true;
    }
    return segs.join(' ') || '';
  };

  const priceTicks: number[] = [];
  for (let i = 0; i <= 4; i++) priceTicks.push(yMin + (yRange * i) / 4);

  const xTickIdxs: number[] = [];
  for (let i = 0; i < 5; i++) xTickIdxs.push(Math.floor((candles.length - 1) * (i / 4)));

  const last = candles[candles.length - 1];
  const lastY = yPrice(last.close);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      {/* 网格 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={padL} y1={padT + (priceH * i) / 4}
          x2={W - padR} y2={padT + (priceH * i) / 4}
          stroke="rgba(148, 163, 184, 0.08)" strokeWidth="0.5" strokeDasharray="2 2"
        />
      ))}

      {/* Y 轴价格 */}
      {priceTicks.map((p, i) => (
        <text
          key={i}
          x={W - padR + 4}
          y={yPrice(p) + 3}
          fontSize="8"
          fill="#7B89B8"
          textAnchor="start"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {fmtPrice(p)}
        </text>
      ))}

      {/* 蜡烛 */}
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? '#34D399' : '#F472B6';
        const top = yPrice(Math.max(c.open, c.close));
        const bot = yPrice(Math.min(c.open, c.close));
        const bodyH = Math.max(bot - top, 0.5);
        return (
          <g key={i}>
            <line x1={xCenter(i)} y1={yPrice(c.high)} x2={xCenter(i)} y2={yPrice(c.low)} stroke={color} strokeWidth="0.8" />
            <rect x={xCenter(i) - bodyW / 2} y={top} width={bodyW} height={bodyH} fill={color} />
          </g>
        );
      })}

      {/* 成交量 */}
      {candles.map((c, i) => {
        const up = c.close >= c.open;
        const color = up ? 'rgba(52,211,153,0.55)' : 'rgba(244,114,182,0.55)';
        return (
          <rect key={`v${i}`} x={xCenter(i) - bodyW / 2} y={yVol(c.volume)} width={bodyW} height={(c.volume / maxV) * volH} fill={color} />
        );
      })}

      {/* MA 折线 */}
      {showMA.ma5  && <path d={maPath(ma5)}  fill="none" stroke="#FCD535" strokeWidth="1" />}
      {showMA.ma10 && <path d={maPath(ma10)} fill="none" stroke="#A78BFA" strokeWidth="1" />}
      {showMA.ma20 && <path d={maPath(ma20)} fill="none" stroke="#38BDF8" strokeWidth="1" />}
      {showMA.ma60 && <path d={maPath(ma60)} fill="none" stroke="#F472B6" strokeWidth="1" />}

      {/* 当前价横线 + 标签 */}
      <line x1={padL} y1={lastY} x2={W - padR} y2={lastY} stroke={trendUp ? '#34D399' : '#F472B6'} strokeWidth="0.6" strokeDasharray="3 2" />
      <rect x={W - padR + 1} y={lastY - 7} width={padR - 2} height={14} fill={trendUp ? '#34D399' : '#F472B6'} rx="2" />
      <text x={W - padR + 3} y={lastY + 3} fontSize="9" fill="#0F1B3D" fontWeight="800" textAnchor="start" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
        {fmtPrice(last.close)}
      </text>

      {/* X 轴时间 */}
      {xTickIdxs.map((i, k) => (
        <text key={k} x={xCenter(i)} y={H - 4} fontSize="8" fill="#7B89B8" textAnchor="middle">
          {fmtTimeByPeriod(candles[i].time, period)}
        </text>
      ))}
    </svg>
  );
}
