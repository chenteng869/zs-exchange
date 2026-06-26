'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Clock, BarChart3, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useTickerData, useKlineData, useOrderBook, useRecentTrades } from '@/hooks/useMarketData';
import { spotApi } from '@/lib/api/spot';

const TIME_PERIODS = ['1m', '5m', '15m', '1H', '4H', '1D'];
const INTERVAL_MAP: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' };

export default function SpotTradePage() {
  const [selectedPair] = useState('BTCUSDT');
  const displayPair = 'BTC/USDT';

  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timePeriod, setTimePeriod] = useState('1H');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── 真实数据 ──────────────────────────────────────────────────────────────
  const { ticker } = useTickerData(selectedPair, 3000);
  const { klines } = useKlineData(selectedPair, INTERVAL_MAP[timePeriod], 50, 10000);
  const orderBook = useOrderBook(selectedPair, 2000);
  const recentTrades = useRecentTrades(selectedPair, 20, 3000);

  const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const priceUp = ticker ? parseFloat(ticker.changePercent24h) >= 0 : true;

  // 初始化限价价格
  useEffect(() => {
    if (ticker && !price) setPrice(parseFloat(ticker.lastPrice).toFixed(2));
  }, [ticker?.lastPrice]);

  const chartData = klines.map((k) => ({
    time: k.time,
    price: parseFloat(k.close),
    volume: parseFloat(k.volume),
  }));

  // ── 计算 ─────────────────────────────────────────────────────────────────
  const estimatedTotal = useMemo(() => {
    const p = orderType === 'market' ? currentPrice : parseFloat(price);
    if (!p || !amount) return '0.00';
    return (p * parseFloat(amount)).toFixed(2);
  }, [price, amount, orderType, currentPrice]);

  const handlePercentageClick = (pct: number) => {
    const bal = 10;  // TODO: 接真实余额
    setAmount(((bal * pct) / 100).toFixed(6));
  };

  // ── 下单 ─────────────────────────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    setSubmitMsg(null);
    try {
      await spotApi.placeOrder({
        symbol: selectedPair,
        side: orderSide,
        type: orderType,
        quantity: amount,
        price: orderType === 'limit' ? price : undefined,
      });
      setSubmitMsg({ type: 'ok', text: '下单成功' });
      setAmount('');
    } catch (e: any) {
      setSubmitMsg({ type: 'err', text: e.message || '下单失败' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitMsg(null), 3000);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-[72px]">
        {/* 顶部工具栏 */}
        <header className="h-12 bg-deep-800 border-b border-white/5 sticky top-[72px] z-40">
          <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-deep-900 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="font-semibold text-text-primary text-sm tabular-nums">{displayPair}</span>
                <ChevronDown size={14} className="text-text-muted" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-text-muted">当前价</span>
                {ticker ? (
                  <span className={`font-mono font-semibold tabular-nums ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                ) : <span className="text-text-muted animate-pulse">—</span>}
                {ticker && (
                  <span className={`text-xs ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    {parseFloat(ticker.changePercent24h) >= 0 ? '+' : ''}{parseFloat(ticker.changePercent24h).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {TIME_PERIODS.map((p) => (
                <button key={p} onClick={() => setTimePeriod(p)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timePeriod === p ? 'bg-deep-700 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-deep-800'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="grid grid-cols-12 gap-4">
            {/* 订单簿 */}
            <div className="col-span-3">
              <div className="bg-deep-800/50 border border-white/5 rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5"><BarChart3 size={14} />订单簿</h3>
                  <span className="text-[10px] text-text-muted">深度</span>
                </div>
                <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-[#F7F8FA]/50 text-[10px] text-text-muted font-medium">
                  <span>价格(USDT)</span><span className="text-right">数量(BTC)</span><span className="text-right">累计</span>
                </div>
                {/* 卖盘 */}
                <div className="max-h-[200px] overflow-y-auto">
                  {(orderBook.asks.length > 0 ? [...orderBook.asks].reverse() : Array(10).fill(null)).map((ask, i) => (
                    <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-[#F7F8FA] transition-colors">
                      {ask && <div className="absolute inset-y-0 right-0 bg-red-500/8" style={{ width: `${(ask.total / (orderBook.asks[orderBook.asks.length-1]?.total || 1)) * 100}%` }} />}
                      <span className="text-red-500 font-mono relative z-10 tabular-nums">{ask ? ask.price.toFixed(2) : '—'}</span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">{ask ? ask.amount.toFixed(4) : '—'}</span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">{ask ? ask.total.toFixed(2) : '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 bg-deep-900/80 border-y border-white/5">
                  <div className={`text-center font-bold font-mono text-base tabular-nums ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${currentPrice ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
                  </div>
                </div>
                {/* 买盘 */}
                <div className="max-h-[200px] overflow-y-auto">
                  {(orderBook.bids.length > 0 ? orderBook.bids : Array(10).fill(null)).map((bid, i) => (
                    <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-[#F7F8FA] transition-colors">
                      {bid && <div className="absolute inset-y-0 right-0 bg-emerald-500/8" style={{ width: `${(bid.total / (orderBook.bids[orderBook.bids.length-1]?.total || 1)) * 100}%` }} />}
                      <span className="text-emerald-500 font-mono relative z-10 tabular-nums">{bid ? bid.price.toFixed(2) : '—'}</span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">{bid ? bid.amount.toFixed(4) : '—'}</span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">{bid ? bid.total.toFixed(2) : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* K线图 + 最近成交 */}
            <div className="col-span-6 space-y-4">
              <div className="bg-deep-900 border border-white/5 rounded-lg overflow-hidden min-h-[400px]">
                <div className="p-4 h-[360px]">
                  {chartData.length > 0 ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPriceSpot" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #EAECEF', borderRadius: '6px', color: '#1E2329', fontSize: '12px', padding: '8px 12px' }}
                        formatter={(v: number) => [`$${Number(v).toLocaleString()}`, '价格']} />
                      <Area type="monotone" dataKey="price" stroke="#7C3AED" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPriceSpot)" />
                    </AreaChart>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-text-muted" />
                    </div>
                  )}
                </div>
              </div>

              {/* 最近成交 */}
              <div className="bg-white/50 border border-[#EAECEF] rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#EAECEF] flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5"><Clock size={14} />最近成交</h3>
                  <span className="text-[10px] text-text-muted">实时</span>
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-[#F7F8FA]/50 text-[10px] text-text-muted font-medium">
                  <span>时间</span><span>价格(USDT)</span><span className="text-right">数量(BTC)</span><span className="text-right">方向</span>
                </div>
                <div className="divide-y divide-[#EAECEF] max-h-[320px] overflow-y-auto">
                  {recentTrades.slice(0, 20).map((t, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs hover:bg-[#F7F8FA] transition-colors">
                      <span className="text-text-muted font-mono tabular-nums">{t.time}</span>
                      <span className={`font-mono font-medium tabular-nums ${t.side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>{t.price.toFixed(2)}</span>
                      <span className="text-right text-text-secondary font-mono tabular-nums">{t.amount.toFixed(4)}</span>
                      <span className="text-right flex items-center justify-end gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.side === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`[font-size:10px] ${t.side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>{t.side === 'buy' ? '买' : '卖'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 下单面板 */}
            <div className="col-span-3">
              <div className="bg-white/50 border border-[#EAECEF] rounded-lg p-4">
                <div className="flex mb-4 bg-[#F7F8FA]/50 rounded p-0.5">
                  {(['buy', 'sell'] as const).map((s) => (
                    <button key={s} onClick={() => setOrderSide(s)}
                      className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${orderSide === s ? (s === 'buy' ? 'border border-emerald-600 text-emerald-500 bg-emerald-500/5' : 'border border-red-600 text-red-500 bg-red-500/5') : 'text-text-secondary hover:text-text-primary'}`}>
                      {s === 'buy' ? '买入' : '卖出'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  {(['limit', 'market'] as const).map((t) => (
                    <button key={t} onClick={() => setOrderType(t)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all duration-150 ${orderType === t ? 'border-brand-500/60 bg-brand-500/10 text-brand-500' : 'border-[#EAECEF] text-text-secondary'}`}>
                      {t === 'limit' ? '限价' : '市价'}
                    </button>
                  ))}
                </div>
                {orderType === 'limit' && (
                  <div className="mb-3">
                    <label className="block text-[11px] text-text-muted mb-1.5">价格 (USDT)</label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="输入价格" className="!py-2 !text-sm font-mono tabular-nums" />
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-[11px] text-text-muted mb-1.5">数量 (BTC)</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="输入数量" className="!py-2 !text-sm font-mono tabular-nums" />
                </div>
                <div className="flex gap-2 mb-4">
                  {[25, 50, 75, 100].map((pct) => (
                    <button key={pct} onClick={() => handlePercentageClick(pct)}
                      className="flex-1 py-1.5 text-xs font-medium text-text-secondary bg-deep-900/50 rounded hover:bg-deep-800 hover:text-text-primary transition-colors border border-white/5">
                      {pct}%
                    </button>
                  ))}
                </div>
                {amount && (price || orderType === 'market') && (
                  <div className="mb-4 p-3 bg-[#F7F8FA]/50 rounded">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">预估总额</span>
                      <span className="text-text-primary font-mono tabular-nums">≈ {estimatedTotal} USDT</span>
                    </div>
                  </div>
                )}
                {submitMsg && (
                  <div className={`mb-3 px-3 py-2 rounded text-xs font-medium text-center ${submitMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {submitMsg.text}
                  </div>
                )}
                <Button variant="primary" size="lg" isLoading={isSubmitting} disabled={isSubmitting} onClick={handleSubmitOrder}
                  className={`w-full !py-3 !text-sm !font-semibold ${orderSide === 'buy' ? '!bg-emerald-600 hover:!bg-emerald-700 !from-transparent !to-transparent !shadow-none' : '!bg-red-600 hover:!bg-red-700 !from-transparent !to-transparent !shadow-none'}`}>
                  {orderSide === 'buy' ? '买入 BTC' : '卖出 BTC'}
                </Button>
                <p className="mt-3 text-[11px] text-text-muted text-center">
                  可用: <span className="font-mono tabular-nums">10,000.00 USDT</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
