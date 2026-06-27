'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  Clock,
  BarChart3,
  AlertTriangle,
  Gauge,
  Shield,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { useTickerData, useKlineData, useOrderBook, useRecentTrades } from '@/hooks/useMarketData';
import { perpApi } from '@/lib/api/perp';

// ==================== 时间周期选项 ====================
const TIME_PERIODS = ['1m', '5m', '15m', '1H', '4H', '1D'];
const INTERVAL_MAP: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' };

// ==================== 杠杆选项 (合约标准档位) ====================
const LEVERAGE_OPTIONS = [2, 5, 10, 20, 50, 100];

export default function FuturesTradePage() {
  // ==================== 状态管理 ====================
  const [selectedPair] = useState('BTCUSDT');
  const displayPair = 'BTC/USDT';
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timePeriod, setTimePeriod] = useState('1H');
  // 合约特有状态
  const [leverage, setLeverage] = useState(20);
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==================== 真实数据 ====================
  const { ticker } = useTickerData(selectedPair, 3000);
  const { klines } = useKlineData(selectedPair, INTERVAL_MAP[timePeriod], 50, 10000);
  const MOCK_ORDER_BOOK = useOrderBook(selectedPair, 2000);
  const MOCK_RECENT_TRADES = useRecentTrades(selectedPair, 20, 3000);

  const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const priceUp = ticker ? parseFloat(ticker.changePercent24h) >= 0 : true;
  const CHART_DATA = klines.map((k) => ({ time: k.time, price: parseFloat(k.close), volume: parseFloat(k.volume) }));

  // 初始化限价价格
  useEffect(() => {
    if (ticker && !price) setPrice(parseFloat(ticker.lastPrice).toFixed(2));
  }, [ticker?.lastPrice]);

  // ==================== 计算预估总价与保证金 ====================
  const { estimatedTotal, marginRequired, liquidationPrice } = useMemo(() => {
    if (!amount || (!price && orderType === 'limit')) {
      return { estimatedTotal: '0.00', marginRequired: '0.00', liquidationPrice: '0.00' };
    }

    const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price);
    const total = orderPrice * parseFloat(amount);
    const margin = total / leverage;
    const liqPrice = orderSide === 'buy'
      ? orderPrice * (1 - 0.9 / leverage)
      : orderPrice * (1 + 0.9 / leverage);

    return {
      estimatedTotal: total.toFixed(2),
      marginRequired: margin.toFixed(2),
      liquidationPrice: liqPrice.toFixed(2),
    };
  }, [price, amount, orderType, leverage, orderSide, currentPrice]);

  // ==================== 计算保证金率 ====================
  const marginRate = useMemo(() => {
    return ((1 / leverage) * 100).toFixed(2);
  }, [leverage]);

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
      await perpApi.placeOrder({
        symbol: selectedPair,
        side: orderSide,
        type: orderType,
        quantity: amount,
        price: orderType === 'limit' ? price : undefined,
        leverage,
        marginMode,
      });
    } catch {
      // error silently logged
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== 高杠杆警告判断 ====================
  const isHighLeverage = leverage >= 50;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== 顶部工具栏 (48px) ==================== */}
        <header className="h-12 bg-deep-800 border-b border-white/5 sticky top-[72px] z-40">
          <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
            {/* 左侧：交易对选择器 */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-deep-900 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="font-semibold text-text-primary text-sm tabular-nums">{displayPair}</span>
                <ChevronDown size={14} className="text-text-muted" />
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-brand-500/15 text-brand-500 rounded font-medium">
                  永续
                </span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-text-muted">标记价</span>
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
                <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-deep-900/50 text-[10px] text-text-muted font-medium">
                  <span>价格(USDT)</span>
                  <span className="text-right tabular-nums">数量(BTC)</span>
                  <span className="text-right tabular-nums">累计</span>
                </div>

                {/* 卖盘 (红色) */}
                <div className="max-h-[180px] overflow-y-auto">
                  {[...MOCK_ORDER_BOOK.asks].reverse().map((ask, i) => (
                    <div
                      key={`ask-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-white/[0.03] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-red-500/8"
                        style={{ width: `${((MOCK_ORDER_BOOK.asks.length - i) / MOCK_ORDER_BOOK.asks.length) * 100}%` }}
                      />
                      <span className="text-red-500 font-mono relative z-10 tabular-nums">{ask.price.toFixed(2)}</span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">{ask.amount.toFixed(4)}</span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">{ask.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* 当前价横条 */}
                <div className="px-3 py-2 bg-deep-900/80 border-y border-white/5">
                  <div className={`text-center font-bold font-mono text-base tabular-nums ${priceUp ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${currentPrice ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
                  </div>
                </div>

                {/* 买盘 (绿色) */}
                <div className="max-h-[180px] overflow-y-auto">
                  {MOCK_ORDER_BOOK.bids.map((bid, i) => (
                    <div
                      key={`bid-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-xs relative hover:bg-white/[0.03] transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/8"
                        style={{ width: `${((MOCK_ORDER_BOOK.bids.length - i) / MOCK_ORDER_BOOK.bids.length) * 100}%` }}
                      />
                      <span className="text-emerald-500 font-mono relative z-10 tabular-nums">{bid.price.toFixed(2)}</span>
                      <span className="text-right text-text-secondary font-mono relative z-10 tabular-nums">{bid.amount.toFixed(4)}</span>
                      <span className="text-right text-text-muted font-mono relative z-10 tabular-nums">{bid.total.toFixed(2)}</span>
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
                      <linearGradient id="colorPriceFutures" x1="0" y1="0" x2="0" y2="1">
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
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => [`$${Number(value).toLocaleString()}`, '价格']}
                    />
                    {/* 强平价格水平虚线 */}
                    {amount && (price || orderType === 'market') && (
                      <ReferenceLine
                        y={parseFloat(liquidationPrice)}
                        stroke="#EF4444"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{
                          value: `强平 $${liquidationPrice}`,
                          position: 'right',
                          fill: '#EF4444',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#7C3AED"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPriceFutures)"
                    />
                  </AreaChart>
                </div>
              </div>

              {/* 最近成交记录 Recent Trades */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <Clock size={14} />
                    最近成交
                  </h3>
                  <span className="text-[10px] text-text-muted">实时</span>
                </div>

                {/* 表头 */}
                <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-deep-900/50 text-[10px] text-text-muted font-medium">
                  <span>时间</span>
                  <span>价格(USDT)</span>
                  <span className="text-right tabular-nums">数量(BTC)</span>
                  <span className="text-right">方向</span>
                </div>

                {/* 成交列表 */}
                <div className="divide-y divide-white/[0.03] max-h-[280px] overflow-y-auto">
                  {MOCK_RECENT_TRADES.slice(0, 18).map((trade, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs hover:bg-white/[0.02] transition-colors">
                      <span className="text-text-muted font-mono tabular-nums">{trade.time}</span>
                      <span className={`font-mono font-medium tabular-nums ${trade.side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trade.price.toFixed(2)}
                      </span>
                      <span className="text-right text-text-secondary font-mono tabular-nums">{trade.amount.toFixed(4)}</span>
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

            {/* ==================== 下单面板 (≈300px，含合约功能) ==================== */}
            <div className="col-span-3 space-y-4">
              {/* 开多/开空 Tab切换 */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-4">
                <div className="flex mb-4 bg-deep-900/50 rounded p-0.5">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'buy'
                        ? 'border border-emerald-600 text-emerald-500 bg-emerald-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    开多
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'sell'
                        ? 'border border-red-600 text-red-500 bg-red-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    开空
                  </button>
                </div>

                {/* 逐仓/全仓模式切换 */}
                <div className="mb-4 p-3 bg-deep-900/30 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wallet size={13} className="text-text-muted" />
                    <label className="text-[11px] text-text-muted">保证金模式</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMarginMode('isolated')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-all duration-150 border ${
                        marginMode === 'isolated'
                          ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                          : 'border-white/10 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      逐仓
                    </button>
                    <button
                      onClick={() => setMarginMode('cross')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-all duration-150 border ${
                        marginMode === 'cross'
                          ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                          : 'border-white/10 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      全仓
                    </button>
                  </div>
                </div>

                {/* 杠杆选择器 (2x ~ 100x) */}
                <div className="mb-4 p-3 bg-deep-900/30 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <Gauge size={13} />
                      杠杆倍数
                    </label>
                    <span className={`text-sm font-bold font-mono tabular-nums ${isHighLeverage ? 'text-red-500' : 'text-brand-500'}`}>
                      {leverage}x
                    </span>
                  </div>
                  {/* 杠杆滑块 */}
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer mb-2 ${
                      isHighLeverage ? 'accent-red-500' : 'accent-brand-500'
                    }`}
                  />
                  {/* 常用杠杆快捷按钮 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {LEVERAGE_OPTIONS.map((lev) => (
                      <button
                        key={lev}
                        onClick={() => setLeverage(lev)}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
                          leverage === lev
                            ? isHighLeverage && lev >= 50
                              ? 'bg-red-600 text-white'
                              : 'bg-brand-500 text-white'
                            : 'bg-deep-800/50 text-text-secondary hover:text-text-primary border border-white/5'
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>
                  {/* 高杠杆风险提示 */}
                  {isHighLeverage && (
                    <div className="mt-2 p-2 bg-red-500/8 border border-red-500/15 rounded flex items-start gap-1.5">
                      <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-red-500 leading-tight">
                        高杠杆风险: {leverage}x 杠杆将显著增加强平风险
                      </span>
                    </div>
                  )}
                </div>

                {/* 保证金率显示 */}
                <div className="mb-4 p-3 bg-deep-900/30 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Shield size={13} />
                      初始保证金率
                    </div>
                    <span className="font-mono font-medium text-warning tabular-nums">{marginRate}%</span>
                  </div>
                </div>

                {/* 订单类型选择 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all duration-150 ${
                      orderType === 'limit'
                        ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                        : 'border-white/10 text-text-secondary hover:border-white/20'
                    }`}
                  >
                    限价
                  </button>
                  <button
                    onClick={() => setOrderType('market')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all duration-150 ${
                      orderType === 'market'
                        ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                        : 'border-white/10 text-text-secondary hover:border-white/20'
                    }`}
                  >
                    市价
                  </button>
                </div>

                {/* 价格输入框 */}
                {orderType === 'limit' && (
                  <div className="mb-3">
                    <label className="block text-[11px] text-text-muted mb-1.5">价格 (USDT)</label>
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
                  <label className="block text-[11px] text-text-muted mb-1.5">数量 (BTC)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="输入数量"
                    className="!py-2 !text-sm font-mono tabular-nums"
                  />
                </div>

                {/* 百分比快捷按钮 */}
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

                {/* 合约特有信息显示区 */}
                {(price || orderType === 'market') && amount && (
                  <div className="mb-4 space-y-2">
                    {/* 预估总价值 & 保证金 */}
                    <div className="p-3 bg-deep-900/50 rounded">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">合约价值</span>
                        <span className="text-text-primary font-mono tabular-nums">≈ {estimatedTotal} USDT</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">所需保证金 ({leverage}x)</span>
                        <span className="font-mono font-medium tabular-nums">{marginRequired} USDT</span>
                      </div>
                    </div>

                    {/* 强平价格预警 (红色虚线样式) */}
                    <div className="p-3 bg-red-500/5 border border-red-500/15 rounded border-dashed">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={13} className="text-red-500" />
                        <span className="text-xs font-medium text-red-500">预估强平价</span>
                      </div>
                      <div className="text-base font-bold font-mono text-red-500 tabular-nums">$ {liquidationPrice}</div>
                      <div className="mt-1 text-[10px] text-text-muted">
                        {orderSide === 'buy' ? '做多' : '做空'} · {leverage}x杠杆
                      </div>
                    </div>
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
                  {orderSide === 'buy' ? '开多 (买入)' : '开空 (卖出)'}
                </Button>

                {/* 可用余额 */}
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
