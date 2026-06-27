'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  Clock,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useTickerData, useKlineData, useOrderBook, useRecentTrades } from '@/hooks/useMarketData';
import { spotApi } from '@/lib/api/spot';

// ==================== 时间周期选项 ====================
const TIME_PERIODS = ['1m', '5m', '15m', '1H', '4H', '1D'];
const INTERVAL_MAP: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' };

export default function SpotTradePage() {
  // ==================== 状态管理 ====================
  const [selectedPair] = useState('BTCUSDT');
  const displayPair = 'BTC/USDT';
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timePeriod, setTimePeriod] = useState('1H');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== 真实数据 ====================
  const { ticker } = useTickerData(selectedPair, 3000);
  const { klines } = useKlineData(selectedPair, INTERVAL_MAP[timePeriod], 50, 10000);
  const MOCK_ORDER_BOOK = useOrderBook(selectedPair, 2000);
  const MOCK_RECENT_TRADES = useRecentTrades(selectedPair, 20, 3000);

  const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const priceUp = ticker ? parseFloat(ticker.changePercent24h) >= 0 : true;
  const CHART_DATA = klines.map((k) => ({ time: k.time, price: parseFloat(k.close), volume: parseFloat(k.volume) }));

  useEffect(() => {
    if (ticker && !price) setPrice(parseFloat(ticker.lastPrice).toFixed(2));
  }, [ticker?.lastPrice]);

  // ==================== 计算预估总价 ====================
  const estimatedTotal = useMemo(() => {
    const p = orderType === 'market' ? currentPrice : parseFloat(price);
    if (!p || !amount) return '0.00';
    return (p * parseFloat(amount)).toFixed(2);
  }, [price, amount, orderType, currentPrice]);

  // ==================== 快捷百分比按钮处理 ====================
  const handlePercentageClick = (percent: number) => {
    const availableBalance = 10;
    const targetAmount = (availableBalance * percent) / 100;
    setAmount(targetAmount.toFixed(6));
  };

  // ==================== 下单提交 ====================
  const handleSubmitOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSubmitting(true);
    try {
      await spotApi.placeOrder({
        symbol: selectedPair,
        side: orderSide,
        type: orderType,
        quantity: amount,
        price: orderType === 'limit' ? price : undefined,
      });
    } catch {
      // error silently logged
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-[72px]">
        {/* ==================== 顶部工具栏 (48px) ==================== */}
        <header className="h-12 bg-deep-800 border-b border-white/5 sticky top-[72px] z-40">
          <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
            {/* 左侧：交易对选择器 */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-deep-900 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="font-semibold text-text-primary text-sm tabular-nums">{displayPair}</span>
                <ChevronDown size={14} className="text-text-muted" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-text-muted">当前价</span>
                <span className={`font-mono font-semibold tabular-nums ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${currentPrice ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
                </span>
              </div>
            </div>

            {/* 右侧：时间周期按钮组 */}
            <div className="flex gap-1">
              {TIME_PERIODS.map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    timePeriod === period
                      ? 'bg-deep-700 text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-deep-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ==================== 主交易区域布局 ==================== */}
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="grid grid-cols-12 gap-4">
            {/* ==================== 订单簿 (w-64 ≈ 260px) ==================== */}
            <div className="col-span-3">
              <div className="bg-deep-800/50 border border-white/5 rounded-lg overflow-hidden">
                {/* 表头 */}
                <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <BarChart3 size={14} />
                    订单簿
                  </h3>
                  <span className="text-[10px] text-text-muted">深度</span>
                </div>

                {/* 列标题 */}
                <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-[#F7F8FA]/50 text-[10px] text-text-muted font-medium">
                  <span>价格(USDT)</span>
                  <span className="text-right tabular-nums">数量(BTC)</span>
                  <span className="text-right tabular-nums">累计</span>
                </div>

                {/* 卖盘 (红色，从高价到低价) */}
                <div className="max-h-[200px] overflow-y-auto">
                  {[...MOCK_ORDER_BOOK.asks].reverse().map((ask, i) => (
                    <div
                      key={`ask-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-[#F7F8FA] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-red-500/8"
                        style={{ width: `${((MOCK_ORDER_BOOK.asks.length - i) / MOCK_ORDER_BOOK.asks.length) * 100}%` }}
                      />
                      <span className="text-red-500 font-mono relative z-10 tabular-nums">
                        {ask.price.toFixed(2)}
                      </span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">
                        {ask.amount.toFixed(4)}
                      </span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">
                        {ask.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 当前价横条 */}
                <div className="px-3 py-2 bg-deep-900/80 border-y border-white/5">
                  <div className={`text-center font-bold font-mono text-base tabular-nums ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${currentPrice ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
                  </div>
                </div>

                {/* 买盘 (绿色，从低价到高价) */}
                <div className="max-h-[200px] overflow-y-auto">
                  {MOCK_ORDER_BOOK.bids.map((bid, i) => (
                    <div
                      key={`bid-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-[#F7F8FA] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/8"
                        style={{ width: `${((MOCK_ORDER_BOOK.bids.length - i) / MOCK_ORDER_BOOK.bids.length) * 100}%` }}
                      />
                      <span className="text-emerald-500 font-mono relative z-10 tabular-nums">
                        {bid.price.toFixed(2)}
                      </span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">
                        {bid.amount.toFixed(4)}
                      </span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">
                        {bid.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ==================== 中间区域：K线图 + 最近成交 ==================== */}
            <div className="col-span-6 space-y-4">
              {/* K线图表区域 (最小高度400px) */}
              <div className="bg-deep-900 border border-white/5 rounded-lg overflow-hidden min-h-[400px]">
                <div className="p-4 h-[360px]">
                  <AreaChart data={CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPriceSpot" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="time"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #EAECEF',
                        borderRadius: '6px',
                        color: '#1E2329',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => [`$${Number(value).toLocaleString()}`, '价格']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#7C3AED"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPriceSpot)"
                    />
                  </AreaChart>
                </div>
              </div>

              {/* 最近成交记录 Recent Trades */}
              <div className="bg-white/50 border border-[#EAECEF] rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-[#EAECEF] flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <Clock size={14} />
                    最近成交
                  </h3>
                  <span className="text-[10px] text-text-muted">实时</span>
                </div>

                {/* 表头 */}
                <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-[#F7F8FA]/50 text-[10px] text-text-muted font-medium">
                  <span>时间</span>
                  <span>价格(USDT)</span>
                  <span className="text-right tabular-nums">数量(BTC)</span>
                  <span className="text-right">方向</span>
                </div>

                {/* 成交列表 (至少15条) */}
                <div className="divide-y divide-[#EAECEF] max-h-[320px] overflow-y-auto">
                  {MOCK_RECENT_TRADES.slice(0, 20).map((trade, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs hover:bg-[#F7F8FA] transition-colors"
                    >
                      <span className="text-text-muted font-mono tabular-nums">
                        {trade.time}
                      </span>
                      <span className={`font-mono font-medium tabular-nums ${trade.side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trade.price.toFixed(2)}
                      </span>
                      <span className="text-right text-text-secondary font-mono tabular-nums">
                        {trade.amount.toFixed(4)}
                      </span>
                      <span className="text-right flex items-center justify-end gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${trade.side === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`[font-size:10px] ${trade.side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {trade.side === 'buy' ? '买' : '卖'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ==================== 下单面板 (≈300px) ==================== */}
            <div className="col-span-3">
              <div className="bg-white/50 border border-[#EAECEF] rounded-lg p-4">
                {/* 买入/卖出 Tab切换 */}
                <div className="flex mb-4 bg-[#F7F8FA]/50 rounded p-0.5">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'buy'
                        ? 'border border-emerald-600 text-emerald-500 bg-emerald-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    买入
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'sell'
                        ? 'border border-red-600 text-red-500 bg-red-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    卖出
                  </button>
                </div>

                {/* 订单类型选择 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all duration-150 ${
                      orderType === 'limit'
                        ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                        : 'border-[#EAECEF] text-text-secondary hover:border-[#EAECEF]'
                      }`}
                    >
                      限价
                    </button>
                    <button
                      onClick={() => setOrderType('market')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all duration-150 ${
                        orderType === 'market'
                          ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                          : 'border-[#EAECEF] text-text-secondary hover:border-[#EAECEF]'
                    }`}
                  >
                    市价
                  </button>
                </div>

                {/* 价格输入框 */}
                {orderType === 'limit' && (
                  <div className="mb-3">
                    <label className="block text-[11px] text-text-muted mb-1.5">
                      价格 (USDT)
                    </label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="输入价格"
                      className="!py-2 !text-sm font-mono tabular-nums"
                    />
                  </div>
                )}

                {/* 数量输入框 */}
                <div className="mb-3">
                  <label className="block text-[11px] text-text-muted mb-1.5">
                    数量 (BTC)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="输入数量"
                    className="!py-2 !text-sm font-mono tabular-nums"
                  />
                </div>

                {/* 百分比快捷按钮 (横排) */}
                <div className="flex gap-2 mb-4">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => handlePercentageClick(percent)}
                      className="flex-1 py-1.5 text-xs font-medium text-text-secondary bg-deep-900/50 rounded hover:bg-deep-800 hover:text-text-primary transition-colors border border-white/5"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                {/* 预估总额显示 */}
                {(price || orderType === 'market') && amount && (
                  <div className="mb-4 p-3 bg-[#F7F8FA]/50 rounded">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">预估总额</span>
                      <span className="text-text-primary font-mono tabular-nums">≈ {estimatedTotal} USDT</span>
                    </div>
                    {orderType === 'market' && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-text-muted">市场价格</span>
                        <span className="text-text-primary font-mono tabular-nums">${currentPrice ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 提交按钮 (买入绿色 / 卖出红色) */}
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={handleSubmitOrder}
                  className={`w-full !py-3 !text-sm !font-semibold ${
                    orderSide === 'buy'
                      ? '!bg-emerald-600 hover:!bg-emerald-700 !from-transparent !to-transparent !shadow-none'
                      : '!bg-red-600 hover:!bg-red-700 !from-transparent !to-transparent !shadow-none'
                  }`}
                >
                  {orderSide === 'buy' ? '买入 BTC' : '卖出 BTC'}
                </Button>

                {/* 可用余额 */}
                <p className="mt-3 text-[11px] text-text-muted text-center">
                  可用: <span className="font-mono tabular-nums">10,000.000000 USDT</span>
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
