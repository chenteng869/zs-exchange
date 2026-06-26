'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  FileText,
  CheckCircle2,
  History,
  Receipt,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 订单类型定义 ====================
type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled';
type OrderSide = 'buy' | 'sell';
type OrderDirection = 'open' | 'close'; // 开仓/平仓
type OrderType = 'limit' | 'market';

interface Order {
  id: string;
  time: string;
  pair: string;
  side: OrderSide;
  direction: OrderDirection;
  orderType: OrderType;
  price: number;
  amount: number;
  filled: number; // 已成交数量
  total: number; // 成交额
  status: OrderStatus;
}

// ==================== Mock订单数据 (15条以上) ====================
const MOCK_ORDERS: Order[] = [
  { id: 'ORD-20240609-001', time: '2024-06-09 14:32:18', pair: 'BTCUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 67200.00, amount: 0.05, filled: 0.05, total: 3360.00, status: 'filled' },
  { id: 'ORD-20240609-002', time: '2024-06-09 13:45:22', pair: 'ETHUSDT', side: 'sell', direction: 'close', orderType: 'market', price: 3456.78, amount: 1.2, filled: 1.2, total: 4148.14, status: 'filled' },
  { id: 'ORD-20240609-003', time: '2024-06-09 12:18:05', pair: 'SOLUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 170.50, amount: 10, filled: 6.5, total: 1108.25, status: 'partial' },
  { id: 'ORD-20240609-004', time: '2024-06-09 11:02:44', pair: 'BNBUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 585.00, amount: 2, filled: 0, total: 0, status: 'pending' },
  { id: 'ORD-20240609-005', time: '2024-06-09 10:30:11', pair: 'XRPUSDT', side: 'sell', direction: 'close', orderType: 'market', price: 0.5234, amount: 5000, filled: 5000, total: 2617.00, status: 'filled' },
  { id: 'ORD-20240609-009', time: '2024-06-08 22:15:33', pair: 'BTCUSDT', side: 'sell', direction: 'close', orderType: 'limit', price: 68500.00, amount: 0.03, filled: 0, total: 0, status: 'cancelled' },
  { id: 'ORD-20240609-006', time: '2024-06-08 20:48:19', pair: 'ADAUSDT', side: 'buy', direction: 'open', orderType: 'market', price: 0.4567, amount: 10000, filled: 10000, total: 4567.00, status: 'filled' },
  { id: 'ORD-20240609-007', time: '2024-06-08 18:22:07', pair: 'DOGEUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 0.1200, amount: 50000, filled: 50000, total: 6000.00, status: 'filled' },
  { id: 'ORD-20240609-008', time: '2024-06-08 16:55:42', pair: 'AVAXUSDT', side: 'sell', direction: 'close', orderType: 'limit', price: 36.20, amount: 20, filled: 12, total: 434.40, status: 'partial' },
  { id: 'ORD-20240609-010', time: '2024-06-08 14:10:28', pair: 'LINKUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 14.30, amount: 30, filled: 0, total: 0, status: 'pending' },
  { id: 'ORD-20240609-011', time: '2024-06-08 11:38:55', pair: 'DOTUSDT', side: 'sell', direction: 'close', orderType: 'market', price: 7.95, amount: 50, filled: 50, total: 397.50, status: 'filled' },
  { id: 'ORD-20240609-012', time: '2024-06-07 23:45:16', pair: 'BTCUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 65800.00, amount: 0.08, filled: 0.08, total: 5264.00, status: 'filled' },
  { id: 'ORD-20240609-013', time: '2024-06-07 21:12:39', pair: 'ETHUSDT', side: 'buy', direction: 'open', orderType: 'market', price: 3400.00, amount: 2, filled: 2, total: 6800.00, status: 'filled' },
  { id: 'ORD-20240609-014', time: '2024-06-07 18:28:51', pair: 'SOLUSDT', side: 'sell', direction: 'close', orderType: 'limit', price: 178.90, amount: 5, filled: 3, total: 536.70, status: 'partial' },
  { id: 'ORD-20240609-015', time: '2024-06-07 15:04:23', pair: 'MATICUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 0.5600, amount: 5000, filled: 5000, total: 2800.00, status: 'filled' },
  { id: 'ORD-20240609-016', time: '2024-06-07 12:41:08', pair: 'UNIUSDT', side: 'sell', direction: 'close', orderType: 'market', price: 9.95, amount: 40, filled: 40, total: 398.00, status: 'filled' },
  { id: 'ORD-20240609-017', time: '2024-06-06 20:17:44', pair: 'ATOMUSDT', side: 'buy', direction: 'open', orderType: 'limit', price: 8.60, amount: 60, filled: 0, total: 0, status: 'cancelled' },
];

// ==================== Tab配置 ====================
const ORDER_TABS = [
  { key: 'current', label: '当前委托', icon: Clock },
  { key: 'history', label: '历史订单', icon: History },
  { key: 'trades', label: '成交记录', icon: FileText },
  { key: 'flow', label: '资产流水', icon: Receipt },
] as const;

// ==================== 状态标签样式映射 ====================
const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: '委托中', className: 'bg-warning/15 text-warning border border-warning/30' },
  partial: { label: '部分成交', className: 'bg-info/15 text-info border border-info/30' },
  filled: { label: '已成交', className: 'bg-success/15 text-success border border-success/30' },
  cancelled: { label: '已取消', className: 'bg-deep-700 text-text-muted border border-deep-600' },
};

// ==================== 订单行子组件 ====================
function OrderRow({ order }: { order: Order }) {
  const statusInfo = STATUS_CONFIG[order.status];
  const priceStr = order.price.toLocaleString(undefined, {
    minimumFractionDigits: order.price >= 100 ? 2 : 4,
    maximumFractionDigits: order.price >= 100 ? 2 : 4,
  });
  const amountStr = order.amount % 1 === 0 ? String(order.amount) : order.amount.toFixed(4);

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm hover:bg-deep-700/20 transition-colors items-center">
      {/* 时间 */}
      <div className="col-span-2 text-text-muted text-xs font-mono">
        {order.time.split(' ')[1]}
        <div className="text-[10px] text-text-muted/60">{order.time.split(' ')[0]}</div>
      </div>
      {/* 交易对 */}
      <div className="col-span-1 font-medium text-text-primary text-xs">
        {order.pair.replace('USDT', '')}
      </div>
      {/* 类型 (买/卖) */}
      <div className="col-span-1 text-center">
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${order.side === 'buy' ? 'text-success' : 'text-danger'}`}>
          {order.side === 'buy' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
          {order.side === 'buy' ? '买' : '卖'}
        </span>
      </div>
      {/* 方向 (开/平) */}
      <div className="col-span-1 text-center">
        <span className="text-xs text-text-secondary">{order.direction === 'open' ? '开仓' : '平仓'}</span>
      </div>
      {/* 价格 */}
      <div className="col-span-1 text-right font-mono text-text-primary text-xs">${priceStr}</div>
      {/* 数量 */}
      <div className="col-span-1 text-right font-mono text-text-secondary text-xs">
        {amountStr}
        {order.filled > 0 && order.filled < order.amount && (
          <div className="text-[10px] text-info">/{order.filled}</div>
        )}
      </div>
      {/* 成交额 */}
      <div className="col-span-2 text-right font-mono text-text-primary text-xs">
        {order.total > 0 ? `$${order.total.toLocaleString()}` : '-'}
      </div>
      {/* 状态标签 */}
      <div className="col-span-2 text-right">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
      </div>
      {/* 操作按钮 */}
      <div className="col-span-2 flex items-center justify-center gap-1.5">
        {(order.status === 'pending' || order.status === 'partial') && (
          <Button variant="outline" size="sm" className="!px-2 !py-1 !text-[10px]">撤销</Button>
        )}
        {order.status === 'filled' && (
          <Button variant="ghost" size="sm" className="!px-2 !py-1 !text-[10px]">详情</Button>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  // ==================== 状态管理 ====================
  const [activeTab, setActiveTab] = useState<string>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPair, setFilterPair] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ==================== 根据Tab筛选订单 ====================
  const filteredOrders = useMemo(() => {
    let result = [...MOCK_ORDERS];

    // 按Tab类型筛选
    switch (activeTab) {
      case 'current':
        result = result.filter((o) => o.status === 'pending' || o.status === 'partial');
        break;
      case 'history':
        result = result.filter((o) => ['filled', 'cancelled'].includes(o.status));
        break;
      case 'trades':
        result = result.filter((o) => o.filled > 0);
        break;
      case 'flow':
        break; // 显示全部
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.pair.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }

    // 交易对筛选
    if (filterPair) {
      result = result.filter((o) => o.pair === filterPair);
    }

    // 状态筛选
    if (filterStatus !== 'all') {
      result = result.filter((o) => o.status === filterStatus);
    }

    return result;
  }, [activeTab, searchQuery, filterPair, filterStatus]);

  // ==================== 汇总统计 ====================
  const stats = useMemo(() => {
    const todayOrders = MOCK_ORDERS.filter((o) =>
      o.time.startsWith('2024-06-09')
    );
    const todayFilled = todayOrders.filter((o) => o.status === 'filled' || o.status === 'partial');
    return {
      todayCount: todayFilled.length,
      todayTotal: todayFilled.reduce((sum, o) => sum + o.total, 0),
      pnl: 128.56, // 模拟盈亏
    };
  }, []);

  // 获取所有可用交易对用于筛选
  const availablePairs = [...new Set(MOCK_ORDERS.map((o) => o.pair))];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== 页面标题区 ==================== */}
        <motion.header
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="bg-deep-800 border-b border-deep-700"
        >
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-5">
            <h1 className="text-xl font-bold text-text-primary">我的订单</h1>
            <p className="text-sm text-text-muted mt-1">管理您的交易订单与资产流水</p>
          </div>
        </motion.header>

        {/* ==================== 主内容区域 ==================== */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6"
        >
          {/* ==================== 汇总统计卡片行 ==================== */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-deep-800 border border-deep-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-brand-500" />
              </div>
              <div>
                <div className="text-xs text-text-muted">今日成交笔数</div>
                <div className="text-xl font-bold text-text-primary">{stats.todayCount} 笔</div>
              </div>
            </div>
            <div className="bg-deep-800 border border-deep-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-success" />
              </div>
              <div>
                <div className="text-xs text-text-muted">今日总成交额</div>
                <div className="text-xl font-bold text-text-primary">≈ ${stats.todayTotal.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-deep-800 border border-deep-700 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stats.pnl >= 0 ? 'bg-success/15' : 'bg-danger/15'} flex items-center justify-center shrink-0`}>
                {stats.pnl >= 0 ? (
                  <TrendingUp size={20} className="text-success" />
                ) : (
                  <TrendingDown size={20} className="text-danger" />
                )}
              </div>
              <div>
                <div className="text-xs text-text-muted">预估盈亏</div>
                <div className={`text-xl font-bold ${stats.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== 订单Tab切换 + 筛选栏 ==================== */}
          <motion.div variants={staggerItem} className="space-y-4 mb-6">
            {/* Tab导航 */}
            <div className="flex gap-1 bg-deep-800 rounded-xl p-1 border border-deep-700 overflow-x-auto">
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-brand-500 text-white shadow-glow-purple'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 搜索与筛选栏 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索订单号或交易对..."
                  className="w-full pl-10 pr-4 py-2.5 bg-deep-800 border border-deep-700 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                />
              </div>

              {/* 交易对筛选 */}
              <select
                value={filterPair}
                onChange={(e) => setFilterPair(e.target.value)}
                className="px-3 py-2.5 bg-deep-800 border border-deep-700 rounded-lg text-sm text-text-primary focus:border-brand-500 focus:outline-none cursor-pointer appearance-none pr-8"
              >
                <option value="">全部交易对</option>
                {availablePairs.map((pair) => (
                  <option key={pair} value={pair}>
                    {pair}
                  </option>
                ))}
              </select>

              {/* 状态筛选 */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-deep-800 border border-deep-700 rounded-lg text-sm text-text-primary focus:border-brand-500 focus:outline-none cursor-pointer appearance-none pr-8"
              >
                <option value="all">全部状态</option>
                <option value="pending">委托中</option>
                <option value="partial">部分成交</option>
                <option value="filled">已成交</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </motion.div>

          {/* ==================== 订单表格 ==================== */}
          <motion.div variants={staggerItem} className="bg-deep-800 border border-deep-700 rounded-xl overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-deep-900 text-xs text-text-muted font-medium border-b border-deep-700 hidden md:grid">
              <span className="col-span-2">时间</span>
              <span className="col-span-1">交易对</span>
              <span className="col-span-1 text-center">类型</span>
              <span className="col-span-1 text-center">方向</span>
              <span className="col-span-1 text-right">价格</span>
              <span className="col-span-1 text-right">数量</span>
              <span className="col-span-1 text-right">成交额</span>
              <span className="col-span-2 text-right">状态</span>
              <span className="col-span-2 text-center">操作</span>
            </div>

            {/* 表格内容 */}
            <div className="divide-y divide-deep-700/50 max-h-[520px] overflow-y-auto">
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}

              {/* 空状态 */}
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center">
                  <Filter size={32} className="mx-auto text-text-muted mb-3" />
                  <p className="text-text-muted text-sm">暂无匹配的订单记录</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-text-muted mt-4 px-1">
            <span>共 {filteredOrders.length} 条记录</span>
            <span>数据仅供参考 · 非真实交易数据</span>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
