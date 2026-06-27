'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { spotApi, type SpotOrder } from '@/lib/api/spot';

type Filter = 'all' | 'buy' | 'sell';
type Notice = { type: 'success' | 'error'; text: string } | null;

const HISTORY_STATUSES = ['filled', 'cancelled', 'rejected', 'expired'] as const;
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'buy', label: '买入' },
  { key: 'sell', label: '卖出' },
];

function getStoredToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
}

function parseNumber(value: string | number | null | undefined) {
  const num = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function formatDecimal(value: string | number | null | undefined, digits = 8) {
  const num = parseNumber(value);
  if (num === 0) return '0';
  return num
    .toLocaleString('en-US', { maximumFractionDigits: digits })
    .replace(/\.0+$/, '');
}

function formatTime(value: string | number | null | undefined) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusLabel(status: string) {
  if (status === 'filled') return '已成交';
  if (status === 'cancelled') return '已取消';
  if (status === 'rejected') return '已拒绝';
  if (status === 'expired') return '已过期';
  return status;
}

function statusColor(status: string) {
  if (status === 'filled') return '#34D399';
  if (status === 'cancelled') return '#7B89B8';
  if (status === 'rejected') return '#F472B6';
  if (status === 'expired') return '#FCD535';
  return '#7B89B8';
}

function orderAmount(order: SpotOrder) {
  return order.amount ?? order.quantity ?? '0';
}

function filledAmount(order: SpotOrder) {
  return order.filledAmount ?? order.filledQty ?? '0';
}

function orderTotal(order: SpotOrder) {
  const executed = parseNumber(order.executedValue);
  if (executed > 0) return executed;

  const price = parseNumber(order.price);
  const filled = parseNumber(filledAmount(order));
  const amount = filled > 0 ? filled : parseNumber(orderAmount(order));
  return price * amount;
}

function sortByTimeDesc(a: SpotOrder, b: SpotOrder) {
  const left = a.closedAt ?? a.updatedAt ?? a.createdAt ?? 0;
  const right = b.closedAt ?? b.updatedAt ?? b.createdAt ?? 0;
  return new Date(right).getTime() - new Date(left).getTime();
}

export default function H5TradeHistoryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const loadOrders = useCallback(async () => {
    const token = getStoredToken();
    setAuthChecked(true);
    setIsAuthed(Boolean(token));

    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const pages = await Promise.all(
        HISTORY_STATUSES.map((status) => spotApi.getOrders({ status, page: 1, pageSize: 50 })),
      );
      const merged = new Map<string, SpotOrder>();
      pages.flatMap((page) => page.list).forEach((order) => merged.set(order.id, order));
      setOrders(Array.from(merged.values()).sort(sortByTimeDesc));
      setNotice({ type: 'success', text: '历史订单已同步到最新状态' });
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || '历史订单加载失败' });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const list = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((order) => order.side === filter);
  }, [filter, orders]);

  const filledCount = useMemo(
    () => orders.filter((order) => order.status === 'filled' || parseNumber(filledAmount(order)) > 0).length,
    [orders],
  );

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>历史订单</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
            已成交 {filledCount} 笔 · 共 {orders.length} 条
          </div>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          aria-label="刷新历史订单"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(148, 163, 184, 0.16)',
            background: 'rgba(148, 163, 184, 0.10)',
            color: '#B4C0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {FILTERS.map((tab) => {
          const active = tab.key === filter;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                background: active ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {notice && notice.type === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '9px 10px',
            borderRadius: 10,
            border: '1px solid rgba(240, 185, 11, 0.24)',
            background: 'rgba(240, 185, 11, 0.10)',
            color: '#FCD535',
            fontSize: 11,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          <AlertCircle size={14} />
          <span>{notice.text}</span>
        </div>
      )}

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {!authChecked || loading ? (
          <StatePanel icon={<Loader2 size={18} className="animate-spin" />} text="正在加载历史订单..." />
        ) : !isAuthed ? (
          <LoginPanel />
        ) : list.length === 0 ? (
          <StatePanel icon={<CheckCircle2 size={18} />} text="暂无历史订单" />
        ) : (
          list.map((order, index) => (
            <OrderRow key={order.id} order={order} isLast={index === list.length - 1} />
          ))
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function OrderRow({ order, isLast }: { order: SpotOrder; isLast: boolean }) {
  const sideIsBuy = order.side === 'buy';
  const total = orderTotal(order);
  const filled = parseNumber(filledAmount(order));
  const displayAmount = filled > 0 ? filledAmount(order) : orderAmount(order);

  return (
    <div
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: sideIsBuy ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)',
                color: sideIsBuy ? '#34D399' : '#F472B6',
                fontWeight: 700,
              }}
            >
              {sideIsBuy ? '买入' : '卖出'}
            </span>
            <span style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 700 }}>{order.symbol}</span>
          </div>
          <div style={{ color: '#7B89B8', fontSize: 10 }}>{formatTime(order.closedAt ?? order.updatedAt ?? order.createdAt)}</div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: statusColor(order.status), fontSize: 11, fontWeight: 700 }}>
            {statusLabel(order.status)}
          </div>
          <div style={{ color: '#7B89B8', fontSize: 10, marginTop: 4 }}>
            {order.type || order.orderType || 'limit'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
        <Cell label="价格" value={order.price ? formatDecimal(order.price, 8) : '市价'} />
        <Cell label={filled > 0 ? '成交数量' : '委托数量'} value={formatDecimal(displayAmount, 8)} align="right" />
        <Cell label={total > 0 ? '金额' : '金额'} value={total > 0 ? formatDecimal(total, 4) : '--'} align="right" highlight />
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  align = 'left',
  highlight = false,
}: {
  label: string;
  value: string;
  align?: 'left' | 'right';
  highlight?: boolean;
}) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
      <div
        style={{
          color: highlight ? '#FCD535' : '#F8FAFC',
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatePanel({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#7B89B8', fontSize: 13 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );
}

function LoginPanel() {
  return (
    <div style={{ padding: 26, textAlign: 'center' }}>
      <div style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>需要登录后查看历史订单</div>
      <div style={{ color: '#7B89B8', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
        登录后可同步真实订单状态和成交记录。
      </div>
      <Link
        href="/h5/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 120,
          padding: '9px 14px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#0F1B3D',
          fontSize: 12,
          fontWeight: 800,
          textDecoration: 'none',
        }}
      >
        去登录
      </Link>
    </div>
  );
}
