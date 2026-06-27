'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';
import { spotApi, type SpotOrder } from '@/lib/api/spot';

type Filter = 'all' | 'open' | 'pending' | 'partial';
type Notice = { type: 'success' | 'error'; text: string } | null;

const ACTIVE_STATUSES = ['open', 'pending', 'partial'] as const;
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '挂单中' },
  { key: 'pending', label: '待处理' },
  { key: 'partial', label: '部分成交' },
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
  if (status === 'open') return '挂单中';
  if (status === 'pending') return '待处理';
  if (status === 'partial') return '部分成交';
  return status;
}

function statusColor(status: string) {
  if (status === 'partial') return '#FCD535';
  if (status === 'open') return '#38BDF8';
  if (status === 'pending') return '#A78BFA';
  return '#7B89B8';
}

function orderAmount(order: SpotOrder) {
  return order.amount ?? order.quantity ?? '0';
}

function filledAmount(order: SpotOrder) {
  return order.filledAmount ?? order.filledQty ?? '0';
}

function remainingAmount(order: SpotOrder) {
  const explicit = order.remainingAmount;
  if (explicit != null) return explicit;
  return Math.max(parseNumber(orderAmount(order)) - parseNumber(filledAmount(order)), 0).toString();
}

function orderTotal(order: SpotOrder) {
  const price = parseNumber(order.price);
  const amount = parseNumber(orderAmount(order));
  return price * amount;
}

function sortByTimeDesc(a: SpotOrder, b: SpotOrder) {
  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
}

export default function H5OrdersPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [orders, setOrders] = useState<SpotOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [cancellingId, setCancellingId] = useState('');

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
        ACTIVE_STATUSES.map((status) => spotApi.getOrders({ status, page: 1, pageSize: 50 })),
      );
      const merged = new Map<string, SpotOrder>();
      pages.flatMap((page) => page.list).forEach((order) => merged.set(order.id, order));
      setOrders(Array.from(merged.values()).sort(sortByTimeDesc));
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || '当前委托加载失败' });
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
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const cancelOrder = async (orderId: string) => {
    setNotice(null);
    setCancellingId(orderId);
    try {
      await spotApi.cancelOrder(orderId);
      setNotice({ type: 'success', text: '撤单已提交，委托状态已刷新' });
      await loadOrders();
    } catch (error: any) {
      setNotice({ type: 'error', text: error?.message || '撤单失败，请稍后重试' });
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>当前委托</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>真实订单簿状态 · 支持撤单</div>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          aria-label="刷新当前委托"
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
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
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '9px 10px',
            borderRadius: 10,
            border: notice.type === 'success' ? '1px solid rgba(52, 211, 153, 0.26)' : '1px solid rgba(240, 185, 11, 0.24)',
            background: notice.type === 'success' ? 'rgba(52, 211, 153, 0.10)' : 'rgba(240, 185, 11, 0.10)',
            color: notice.type === 'success' ? '#34D399' : '#FCD535',
            fontSize: 11,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {notice.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
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
          <StatePanel icon={<Loader2 size={18} className="animate-spin" />} text="正在加载当前委托..." />
        ) : !isAuthed ? (
          <LoginPanel />
        ) : list.length === 0 ? (
          <StatePanel text="暂无当前委托" />
        ) : (
          list.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              isLast={index === list.length - 1}
              cancelling={cancellingId === order.id}
              onCancel={() => cancelOrder(order.id)}
            />
          ))
        )}
      </div>

      <div style={{ fontSize: 10, color: '#7B89B8', textAlign: 'right', marginTop: 10 }}>
        共 {list.length} 条当前委托
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function OrderCard({
  order,
  isLast,
  cancelling,
  onCancel,
}: {
  order: SpotOrder;
  isLast: boolean;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const sideIsBuy = order.side === 'buy';
  const amount = orderAmount(order);
  const filled = filledAmount(order);
  const remaining = remainingAmount(order);
  const total = orderTotal(order);

  return (
    <div
      style={{
        padding: 14,
        borderBottom: isLast ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>{order.symbol}</span>
          <span style={{ fontSize: 10, color: '#7B89B8' }}>{order.type || order.orderType || 'limit'}</span>
        </div>
        <span style={{ fontSize: 11, color: statusColor(order.status), fontWeight: 700 }}>
          ● {statusLabel(order.status)}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
        <Cell label="委托价格" value={order.price ? formatDecimal(order.price, 8) : '市价'} />
        <Cell label="委托数量" value={formatDecimal(amount, 8)} />
        <Cell label="已成交" value={formatDecimal(filled, 8)} />
        <Cell label="剩余数量" value={formatDecimal(remaining, 8)} />
        <Cell label="委托额" value={total > 0 ? `${formatDecimal(total, 4)} USDT` : '--'} />
        <Cell label="时间" value={formatTime(order.createdAt)} />
      </div>

      <button
        onClick={onCancel}
        disabled={cancelling}
        style={{
          width: '100%',
          padding: '7px 0',
          borderRadius: 9,
          background: 'rgba(244, 114, 182, 0.15)',
          border: '1px solid rgba(244, 114, 182, 0.30)',
          color: '#F472B6',
          fontSize: 11,
          fontWeight: 700,
          cursor: cancelling ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          opacity: cancelling ? 0.65 : 1,
        }}
      >
        {cancelling ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        {cancelling ? '撤单中' : '撤单'}
      </button>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
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
      <div style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>需要登录后查看委托</div>
      <div style={{ color: '#7B89B8', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
        登录后可查看真实订单，并执行撤单操作。
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
