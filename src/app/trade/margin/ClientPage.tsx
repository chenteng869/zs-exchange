'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  Clock,
  BarChart3,
  AlertTriangle,
  Gauge,
  Shield,
  Wallet,
  Landmark,
  Percent,
  CalendarClock,
  ChevronUp,
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
import {
  generateOrderBook,
  generateTrades,
} from '@/lib/orderbook-mock';

// ==================== Mock可借入资产列表 ====================
const BORROWABLE_ASSETS = [
  { asset: 'USDT', rate: '0.015%', available: '5,000,000', icon: '$' },
  { asset: 'BTC', rate: '0.025%', available: '1,200', icon: '\u20BF' },
  { asset: 'ETH', rate: '0.020%', available: '18,500', icon: '\u039E' },
];

// ==================== 使用模拟数据生成器 ====================
const BASE_PRICE = 67234.56;
const MOCK_ORDER_BOOK = generateOrderBook(BASE_PRICE, 20);

// ==================== Mock价格走势数据 ====================
const generateChartData = () => {
  const data = [];
  let basePrice = 67000;
  for (let i = 0; i < 50; i++) {
    basePrice += (Math.random() - 0.48) * 300;
    data.push({
      time: `${i}:00`,
      price: parseFloat(basePrice.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
    });
  }
  return data;
};

const CHART_DATA = generateChartData();

// ==================== 模拟最近成交记录 (20条) ====================
const MOCK_RECENT_TRADES = generateTrades(20, BASE_PRICE);

// ==================== 时间周期选项 ====================
const TIME_PERIODS = ['1m', '5m', '15m', '1H', '4H', '1D'];

// ==================== 杠杆选项 ====================
const LEVERAGE_OPTIONS = [2, 3, 5, 10];

export default function MarginTradePage() {
  // ==================== 状态管理 ====================
  const [selectedPair] = useState('BTC/USDT');
  const [currentPrice] = useState(BASE_PRICE);
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [timePeriod, setTimePeriod] = useState('1H');
  // 杠杆特有状态
  const [leverage, setLeverage] = useState(3);
  const [marginMode, setMarginMode] = useState<'isolated' | 'cross'>('isolated');
  const [borrowAsset, setBorrowAsset] = useState('USDT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRepayment, setShowRepayment] = useState(false);

  // ==================== 计算预估总价、保证金与强平价 ====================
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

  // ==================== 计算当前保证金率 ====================
  const currentMarginRate = useMemo(() => {
    return ((1 / leverage) * 100).toFixed(2);
  }, [leverage]);

  // ==================== 快捷百分比按钮处理 ====================
  const handlePercentageClick = (percent: number) => {
    const availableBalance = 10;
    const targetAmount = (availableBalance * percent) / 100;
    setAmount(targetAmount.toFixed(6));
  };

  // ==================== 下单提交 ====================
  const handleSubmitOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  // ==================== 风险率计算 ====================
  const riskRate = useMemo(() => {
    const baseRisk = (1 / leverage) * 100;
    const fluctuation = Math.random() * 40 - 10;
    return Math.min(Math.max(baseRisk + fluctuation, 25), 150).toFixed(1);
  }, [leverage]);

  // ==================== 风险等级判断 ====================
  const riskLevel = useMemo(() => {
    const rate = parseFloat(riskRate);
    if (rate < 80) return { label: '安全', color: 'text-emerald-500', barColor: '#10B981' };
    if (rate < 120) return { label: '警告', color: 'text-yellow-500', barColor: '#F59E0B' };
    return { label: '危险', color: 'text-red-500', barColor: '#EF4444' };
  }, [riskRate]);

  // ==================== 模拟还款计划数据 ====================
  const repaymentSchedule = useMemo(() => {
    if (!amount || (!price && orderType === 'limit')) return [];
    const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price);
    const borrowAmount = orderPrice * parseFloat(amount);
    const dailyRate = 0.0002;
    return Array.from({ length: 5 }, (_, i) => {
      const days = (i + 1) * 7;
      const interest = borrowAmount * dailyRate * days;
      return {
        period: `第${i + 1}期`,
        date: new Date(Date.now() + days * 86400000).toLocaleDateString('zh-CN'),
        principal: borrowAmount,
        interest: parseFloat(interest.toFixed(2)),
        total: parseFloat((borrowAmount + interest).toFixed(2)),
      };
    });
  }, [amount, price, orderType, currentPrice]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== 萨摩亚合规提示条 ==================== */}
        <div className="bg-brand-500/8 border-b border-brand-500/15">
          <div className="max-w-[1600px] mx-auto px-4 py-1.5 flex items-center justify-center gap-2">
            <Shield size={13} className="text-brand-500" />
            <span className="text-[11px] text-brand-500 font-medium">
              萨摩亚持牌合规 · 杠杆交易受监管保护 · 最高可借10倍
            </span>
          </div>
        </div>

        {/* ==================== 顶部工具栏 (48px) ==================== */}
        <header className="h-12 bg-deep-800 border-b border-white/5 sticky top-[96px] z-40">
          <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
            {/* 左侧：交易对选择器 */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-deep-900 rounded border border-white/10 hover:border-white/20 transition-colors">
                <span className="font-semibold text-text-primary text-sm tabular-nums">{selectedPair}</span>
                <ChevronDown size={14} className="text-text-muted" />
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-brand-500/15 text-brand-500 rounded font-medium">
                  杠杆
                </span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-text-muted">当前价</span>
                <span className={`font-mono font-semibold tabular-nums ${currentPrice >= 67000 ? 'text-emerald-500' : 'text-red-500'}`}>
                  ${currentPrice.toLocaleString()}
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
            {/* ==================== 左侧栏：订单簿 + 杠杆功能区 ==================== */}
            <div className="col-span-3 space-y-4">
              {/* 借入资产选择区 */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Landmark size={14} className="text-brand-500" />
                  <h3 className="text-xs font-medium text-text-primary">借入资产</h3>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BORROWABLE_ASSETS.map((asset) => (
                    <button
                      key={asset.asset}
                      onClick={() => setBorrowAsset(asset.asset)}
                      className={`p-2 rounded border transition-all duration-150 text-center ${
                        borrowAsset === asset.asset
                          ? 'border-brand-500/60 bg-brand-500/10'
                          : 'border-white/5 bg-deep-900/50 hover:border-white/10'
                      }`}
                    >
                      <div className="text-base mb-0.5">{asset.icon}</div>
                      <div className={`text-[11px] font-medium ${borrowAsset === asset.asset ? 'text-brand-500' : 'text-text-secondary'}`}>
                        {asset.asset}
                      </div>
                      <div className="text-[9px] text-yellow-500 mt-0.5">{asset.rate}/日</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 逐仓/全仓模式切换 */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wallet size={14} className="text-brand-500" />
                  <h3 className="text-xs font-medium text-text-primary">保证金模式</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMarginMode('isolated')}
                    className={`flex-1 py-2 text-[11px] font-medium rounded transition-all duration-150 border ${
                      marginMode === 'isolated'
                        ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                        : 'border-white/10 text-text-secondary hover:border-white/20 bg-deep-900/30'
                    }`}
                  >
                    逐仓
                  </button>
                  <button
                    onClick={() => setMarginMode('cross')}
                    className={`flex-1 py-2 text-[11px] font-medium rounded transition-all duration-150 border ${
                      marginMode === 'cross'
                        ? 'border-brand-500/60 bg-brand-500/10 text-brand-500'
                        : 'border-white/10 text-text-secondary hover:border-white/20 bg-deep-900/30'
                    }`}
                  >
                    全仓
                  </button>
                </div>
              </div>

              {/* 杠杆选择器 */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Gauge size={13} />
                    杠杆倍数
                  </label>
                  <span className="text-sm font-bold text-brand-500 font-mono tabular-nums">{leverage}x</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {LEVERAGE_OPTIONS.map((lev) => (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      className={`py-1.5 text-xs font-semibold rounded transition-all duration-150 ${
                        leverage === lev
                          ? 'bg-brand-500 text-white'
                          : 'bg-deep-900/50 text-text-secondary hover:text-text-primary border border-white/5'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-deep-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              {/* 风险率进度条 (三色) */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-text-muted" />
                    <span className="text-[11px] text-text-muted">风险率</span>
                  </div>
                  <span className={`text-xs font-bold font-mono tabular-nums ${riskLevel.color}`}>
                    {riskRate}% · {riskLevel.label}
                  </span>
                </div>
                {/* 三色进度条 */}
                <div className="relative w-full h-2 bg-deep-900 rounded-full overflow-hidden">
                  {/* 绿色段 (<80%) */}
                  <div className="absolute left-0 top-0 h-full bg-emerald-500" style={{ width: '26.67%' }} />
                  {/* 黄色段 (80%-120%) */}
                  <div className="absolute top-0 h-full bg-yellow-500" style={{ left: '26.67%', width: '40%' }} />
                  {/* 红色段 (>120%) */}
                  <div className="absolute top-0 h-full bg-red-500" style={{ right: '0', width: '33.33%' }} />
                  {/* 当前值指示器 */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-deep-900 transition-all duration-300"
                    style={{ left: `calc(${Math.min(parseFloat(riskRate), 150)}% - 6px)` }}
                  />
                </div>
                {/* 图例 */}
                <div className="flex justify-between mt-1.5 text-[9px] text-text-muted">
                  <span>0%</span>
                  <span className="text-emerald-500">80% 安全</span>
                  <span className="text-yellow-500">120% 警告</span>
                  <span className="text-red-500">危险</span>
                </div>
              </div>

              {/* 订单簿 Order Book */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                    <BarChart3 size={13} />
                    订单簿
                  </h3>
                  <span className="text-[10px] text-text-muted">深度</span>
                </div>

                {/* 列标题 */}
                <div className="grid grid-cols-3 gap-2 px-3 py-1 bg-deep-900/50 text-[10px] text-text-muted font-medium">
                  <span>价格</span>
                  <span className="text-right tabular-nums">数量</span>
                  <span className="text-right tabular-nums">累计</span>
                </div>

                {/* 卖盘 (红色) */}
                <div className="max-h-[140px] overflow-y-auto">
                  {[...MOCK_ORDER_BOOK.asks].reverse().map((ask, i) => (
                    <div
                      key={`ask-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1 text-[11px] relative hover:bg-white/[0.03] transition-colors"
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
                <div className="px-3 py-1.5 bg-deep-900/80 border-y border-white/5">
                  <div className={`text-center font-bold font-mono text-sm tabular-nums ${currentPrice >= 67000 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ${currentPrice.toLocaleString()}
                  </div>
                </div>

                {/* 买盘 (绿色) */}
                <div className="max-h-[140px] overflow-y-auto">
                  {MOCK_ORDER_BOOK.bids.map((bid, i) => (
                    <div
                      key={`bid-${i}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1 text-[11px] relative hover:bg-white/[0.03] transition-colors"
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
                      <linearGradient id="colorPriceMargin" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, '价格']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#7C3AED"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPriceMargin)"
                    />
                  </AreaChart>
                </div>
              </div>

              {/* 最近成交记录 */}
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
                <div className="divide-y divide-white/[0.03] max-h-[260px] overflow-y-auto">
                  {MOCK_RECENT_TRADES.slice(0, 16).map((trade, idx) => (
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

              {/* 还款计划预览 (折叠区) */}
              <div className="bg-deep-800/50 border border-white/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowRepayment(!showRepayment)}
                  className="w-full px-3 py-2.5 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-text-muted" />
                    <span className="text-xs font-medium text-text-primary">还款计划预览</span>
                  </div>
                  <ChevronUp size={14} className={`text-text-muted transition-transform duration-200 ${showRepayment ? '' : 'rotate-180'}`} />
                </button>

                {showRepayment && repaymentSchedule.length > 0 && (
                  <div>
                    {/* 表头 */}
                    <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-deep-900/50 text-[10px] text-text-muted font-medium">
                      <span>期数</span>
                      <span>还款日期</span>
                      <span className="text-right tabular-nums">累计利息</span>
                      <span className="text-right tabular-nums">应还总额</span>
                    </div>
                    {/* 还款列表 */}
                    <div className="divide-y divide-white/[0.03] max-h-[200px] overflow-y-auto">
                      {repaymentSchedule.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-2 text-xs hover:bg-white/[0.02] transition-colors">
                          <span className="text-brand-500 font-medium">{item.period}</span>
                          <span className="text-text-secondary">{item.date}</span>
                          <span className="text-right text-yellow-500 font-mono tabular-nums">{item.interest.toFixed(2)} USDT</span>
                          <span className="text-right text-text-primary font-bold font-mono tabular-nums">{item.total.toFixed(2)} USDT</span>
                        </div>
                      ))}
                    </div>
                    {/* 汇总 */}
                    <div className="px-3 py-2 bg-deep-900/30 border-t border-white/5 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">借款本金</span>
                        <span className="font-mono tabular-nums">{repaymentSchedule[0]?.principal.toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">第5期累计利息</span>
                        <span className="font-mono text-yellow-500 tabular-nums">{repaymentSchedule[repaymentSchedule.length - 1]?.interest.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </div>
                )}

                {!showRepayment && (
                  <div className="p-4 text-center text-text-muted text-xs">
                    输入价格和数量后查看还款计划
                  </div>
                )}
              </div>
            </div>

            {/* ==================== 下单面板 (≈300px，含杠杆功能) ==================== */}
            <div className="col-span-3">
              <div className="bg-deep-800/50 border border-white/5 rounded-lg p-4">
                {/* 买入/卖出 Tab切换 */}
                <div className="flex mb-4 bg-deep-900/50 rounded p-0.5">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'buy'
                        ? 'border border-emerald-600 text-emerald-500 bg-emerald-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    买入 (做多)
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-150 ${
                      orderSide === 'sell'
                        ? 'border border-red-600 text-red-500 bg-red-500/5'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    卖出 (做空)
                  </button>
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
                    <label className="block text-[11px] text-text-muted mb-1.5">价格 ({borrowAsset})</label>
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

                {/* 杠杆交易信息显示 */}
                {(price || orderType === 'market') && amount && (
                  <div className="mb-4 space-y-2">
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
                    <div className="p-3 bg-red-500/5 border border-red-500/15 rounded border-dashed">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={13} className="text-red-500" />
                        <span className="text-xs font-medium text-red-500">预估强平价</span>
                      </div>
                      <div className="text-base font-bold font-mono text-red-500 tabular-nums">$ {liquidationPrice}</div>
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
                  {orderSide === 'buy' ? '买入做多' : '卖出做空'}
                </Button>

                {/* 可用余额 */}
                <p className="mt-3 text-[11px] text-text-muted text-center">
                  可用: <span className="font-mono tabular-nums">10,000.00 USDT</span> · 已借: <span className="font-mono tabular-nums">0.00 USDT</span>
                </p>
              </div>

              {/* 借贷利率信息栏 */}
              <div className="mt-4 bg-deep-800/50 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Percent size={14} className="text-brand-500" />
                  <h3 className="text-xs font-medium text-text-primary">借贷利率</h3>
                </div>
                <div className="space-y-1.5">
                  {BORROWABLE_ASSETS.map((asset) => (
                    <div
                      key={asset.asset}
                      className={`flex items-center justify-between p-2 rounded transition-colors ${
                        borrowAsset === asset.asset ? 'bg-brand-500/5 border border-brand-500/15' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{asset.icon}</span>
                        <span className={`text-xs font-medium ${borrowAsset === asset.asset ? 'text-brand-500' : 'text-text-secondary'}`}>
                          {asset.asset}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-yellow-500 tabular-nums">{asset.rate}/天</div>
                        <div className="text-[10px] text-text-muted">可借: {asset.available}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
