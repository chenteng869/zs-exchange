'use client';

import { useState, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OrderHistoryItem {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_market' | 'stop_limit';
  quantity: string;
  filledQty: string;
  price: string;
  avgFillPrice?: string;
  status: 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
  marginMode?: 'isolated' | 'cross';
  leverage?: number;
  stopPrice?: string;
  takeProfit?: string;
  stopLoss?: string;
  fee?: string;
  realizedPnl?: string;
  createdAt: number;
  updatedAt: number;
}

interface OrderHistoryProps {
  orders?: OrderHistoryItem[];
  activeOrders?: OrderHistoryItem[];
  onCancel?: (orderId: string) => void;
  onCancelAll?: (symbol?: string) => void;
  loading?: boolean;
  symbol?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  open: { label: '挂单中', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  partial: { label: '部分成交', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  filled: { label: '已成交', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  cancelled: { label: '已取消', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
  rejected: { label: '已拒绝', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export default function OrderHistory({
  orders = defaultOrders,
  activeOrders = defaultActiveOrders,
  onCancel,
  onCancelAll,
  loading = false,
  symbol,
}: OrderHistoryProps) {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [filter, setFilter] = useState({
    side: 'all',
    type: 'all',
    status: 'all',
  });
  const [dateRange, setDateRange] = useState('7d');

  const filteredActive = useMemo(() => {
    return activeOrders.filter(o => {
      if (filter.side !== 'all' && o.side !== filter.side) return false;
      if (filter.type !== 'all' && o.type !== filter.type) return false;
      return true;
    });
  }, [activeOrders, filter]);

  const filteredHistory = useMemo(() => {
    return orders.filter(o => {
      if (filter.side !== 'all' && o.side !== filter.side) return false;
      if (filter.type !== 'all' && o.type !== filter.type) return false;
      if (filter.status !== 'all' && o.status !== filter.status) return false;
      return true;
    });
  }, [orders, filter]);

  const displayOrders = tab === 'active' ? filteredActive : filteredHistory;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(71, 85, 105, 0.3)' }}>
        <TabButton active={tab === 'active'} onClick={() => setTab('active')}>
          当前委托
          <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
            ({activeOrders.length})
          </span>
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          历史委托
        </TabButton>
      </div>

      <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filter.side}
          onChange={e => setFilter(f => ({ ...f, side: e.target.value }))}
          style={selectStyle}
        >
          <option value="all">全部方向</option>
          <option value="buy">买入</option>
          <option value="sell">卖出</option>
        </select>

        <select
          value={filter.type}
          onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          style={selectStyle}
        >
          <option value="all">全部类型</option>
          <option value="limit">限价单</option>
          <option value="market">市价单</option>
          <option value="stop_limit">限价止损</option>
          <option value="stop_market">市价止损</option>
        </select>

        {tab === 'history' && (
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            style={selectStyle}
          >
            <option value="all">全部状态</option>
            <option value="filled">已成交</option>
            <option value="cancelled">已取消</option>
            <option value="rejected">已拒绝</option>
          </select>
        )}

        {tab === 'active' && activeOrders.length > 0 && (
          <button
            onClick={() => onCancelAll && onCancelAll(symbol)}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            全部撤销
          </button>
        )}
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>加载中...</div>
        ) : displayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
            <Clock size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              {tab === 'active' ? '暂无当前委托' : '暂无历史委托'}
            </p>
          </div>
        ) : (
          displayOrders.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              isActive={tab === 'active'}
              onCancel={onCancel}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        color: active ? '#F8FAFC' : '#64748B',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

function OrderRow({
  order,
  isActive,
  onCancel,
}: {
  order: OrderHistoryItem;
  isActive: boolean;
  onCancel?: (id: string) => void;
}) {
  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const isBuy = order.side === 'buy';
  const [expanded, setExpanded] = useState(false);

  const fillPercent = parseFloat(order.filledQty) / parseFloat(order.quantity) * 100;

  return (
    <div
      style={{
        padding: 12,
        borderBottom: '1px solid rgba(71, 85, 105, 0.2)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 13 }}>{order.symbol}</span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: 11, fontWeight: 600,
              color: isBuy ? '#10B981' : '#EF4444',
            }}>
              {isBuy ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {isBuy ? '开多' : '开空'}
            </span>
            {order.leverage && (
              <span style={{ color: '#64748B', fontSize: 10, padding: '1px 4px', background: 'rgba(100,116,139,0.2)', borderRadius: 3 }}>
                {order.leverage}x
              </span>
            )}
          </div>
          <div style={{ color: '#64748B', fontSize: 11 }}>
            {typeLabel(order.type)}
            {order.clientOrderId && ` · ${order.clientOrderId}`}
          </div>
        </div>

        <div>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>价格</div>
          <div style={{ color: '#F8FAFC', fontSize: 13 }}>{order.price}</div>
        </div>

        <div>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>数量/已成交</div>
          <div style={{ color: '#F8FAFC', fontSize: 13 }}>
            {order.filledQty} / {order.quantity}
          </div>
          {isActive && order.status === 'partial' && (
            <div style={{ marginTop: 4, height: 3, background: 'rgba(71, 85, 105, 0.3)', borderRadius: 2 }}>
              <div style={{ width: `${fillPercent}%`, height: '100%', background: '#8B5CF6', borderRadius: 2 }} />
            </div>
          )}
        </div>

        <div>
          <span style={{
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            background: status.bg,
            color: status.color,
          }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          {isActive && (order.status === 'open' || order.status === 'partial') && (
            <button
              onClick={e => {
                e.stopPropagation();
                onCancel && onCancel(order.id);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              撤销
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(71, 85, 105, 0.2)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <DetailItem label="订单ID" value={order.id} />
          <DetailItem label="创建时间" value={new Date(order.createdAt).toLocaleString()} />
          <DetailItem label="更新时间" value={new Date(order.updatedAt).toLocaleString()} />
          <DetailItem label="手续费" value={order.fee || '-'} />
          {order.avgFillPrice && <DetailItem label="成交均价" value={order.avgFillPrice} />}
          {order.realizedPnl && (
            <DetailItem
              label="已实现盈亏"
              value={`${parseFloat(order.realizedPnl) >= 0 ? '+' : ''}${order.realizedPnl}`}
              color={parseFloat(order.realizedPnl) >= 0 ? '#10B981' : '#EF4444'}
            />
          )}
          {order.stopPrice && <DetailItem label="触发价" value={order.stopPrice} />}
          {order.takeProfit && <DetailItem label="止盈价" value={order.takeProfit} />}
          {order.stopLoss && <DetailItem label="止损价" value={order.stopLoss} />}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color || '#F8FAFC', fontSize: 12, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    market: '市价单',
    limit: '限价单',
    stop_market: '市价止损',
    stop_limit: '限价止损',
  };
  return map[type] || type;
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(71, 85, 105, 0.5)',
  background: 'rgba(15, 23, 42, 0.8)',
  color: '#F8FAFC',
  fontSize: 12,
  cursor: 'pointer',
};

const defaultActiveOrders: OrderHistoryItem[] = [
  {
    id: 'order_001',
    clientOrderId: 'my-order-1',
    symbol: 'BTCUSDT',
    side: 'buy',
    type: 'limit',
    quantity: '0.5',
    filledQty: '0',
    price: '44000',
    status: 'open',
    marginMode: 'isolated',
    leverage: 20,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'order_002',
    symbol: 'ETHUSDT',
    side: 'sell',
    type: 'limit',
    quantity: '5.0',
    filledQty: '2.0',
    price: '3600',
    avgFillPrice: '3605',
    status: 'partial',
    marginMode: 'cross',
    leverage: 10,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 1800000,
  },
];

const defaultOrders: OrderHistoryItem[] = [
  {
    id: 'order_h001',
    symbol: 'BTCUSDT',
    side: 'buy',
    type: 'market',
    quantity: '0.5',
    filledQty: '0.5',
    price: '45000',
    avgFillPrice: '45000.50',
    status: 'filled',
    marginMode: 'isolated',
    leverage: 20,
    fee: '9.00',
    realizedPnl: '0',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'order_h002',
    symbol: 'ETHUSDT',
    side: 'sell',
    type: 'limit',
    quantity: '10.0',
    filledQty: '0',
    price: '3700',
    status: 'cancelled',
    marginMode: 'cross',
    leverage: 10,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 100000000,
  },
  {
    id: 'order_h003',
    symbol: 'SOLUSDT',
    side: 'buy',
    type: 'stop_limit',
    quantity: '100',
    filledQty: '0',
    price: '150',
    stopPrice: '145',
    status: 'rejected',
    marginMode: 'isolated',
    leverage: 5,
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
];
