'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, RefreshCw } from 'lucide-react';
import {
  walletApi,
  type WalletBalance,
  type WalletDeposit,
  type WalletTransfer,
  type WalletWithdrawal,
} from '@/lib/api/wallet';

type Filter = 'all' | 'deposit' | 'withdraw' | 'transfer';

type WalletHistoryRow = {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  currency: string;
  amount: string;
  status: string;
  time: string;
  detail?: string | null;
};

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'deposit', label: '充值' },
  { key: 'withdraw', label: '提现' },
  { key: 'transfer', label: '划转' },
];

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
}

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: unknown): string {
  return toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function formatTime(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusText(status: string): string {
  if (['credited', 'completed', 'success'].includes(status)) return '已完成';
  if (['failed', 'cancelled', 'rejected'].includes(status)) return '失败';
  if (status === 'processing') return '处理中';
  if (status === 'confirming') return '确认中';
  return '待处理';
}

function statusColor(status: string): string {
  const text = statusText(status);
  if (text === '已完成') return '#34D399';
  if (text === '失败') return '#F472B6';
  return '#FCD535';
}

function buildRows(
  depositsByCurrency: Array<{ currency: string; items: WalletDeposit[] }>,
  withdrawalsByCurrency: Array<{ currency: string; items: WalletWithdrawal[] }>,
  transfersByCurrency: Array<{ currency: string; items: WalletTransfer[] }>,
): WalletHistoryRow[] {
  const deposits = depositsByCurrency.flatMap(({ currency, items }) =>
    items.map((item) => ({
      id: `deposit-${item.id}`,
      type: 'deposit' as const,
      currency,
      amount: item.amount,
      status: item.status,
      time: item.createdAt || item.confirmedAt || '',
      detail: item.txHash,
    })),
  );

  const withdrawals = withdrawalsByCurrency.flatMap(({ currency, items }) =>
    items.map((item) => ({
      id: `withdraw-${item.id}`,
      type: 'withdraw' as const,
      currency,
      amount: item.amount,
      status: item.status,
      time: item.createdAt || item.updatedAt || '',
      detail: item.destinationAddress || item.txHash,
    })),
  );

  const transfers = transfersByCurrency.flatMap(({ currency, items }) =>
    items.map((item) => ({
      id: `transfer-${item.id}`,
      type: 'transfer' as const,
      currency,
      amount: item.amount,
      status: item.status,
      time: item.createdAt || item.completedAt || '',
      detail: `${item.fromAccount} -> ${item.toAccount}`,
    })),
  );

  return [...deposits, ...withdrawals, ...transfers].sort((a, b) => {
    return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
  });
}

export default function H5HistoryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [rows, setRows] = useState<WalletHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!hasAuthToken()) {
      setBalances([]);
      setRows([]);
      setError('请先登录后查看真实资金流水');
      setLoading(false);
      return;
    }

    try {
      const nextBalances = await walletApi.getBalances();
      const currencies = Array.from(new Set(nextBalances.map((item) => item.currency))).filter(Boolean);
      const historyCurrencies = currencies.length > 0 ? currencies : ['USDT'];

      const [depositPages, withdrawalPages, transferPages] = await Promise.all([
        Promise.all(
          historyCurrencies.map(async (currency) => ({
            currency,
            items: (await walletApi.getDeposits(currency)).list,
          })),
        ),
        Promise.all(
          historyCurrencies.map(async (currency) => ({
            currency,
            items: (await walletApi.getWithdrawals(currency)).list,
          })),
        ),
        Promise.all(
          historyCurrencies.map(async (currency) => ({
            currency,
            items: (await walletApi.getTransfers(currency)).list,
          })),
        ),
      ]);

      setBalances(nextBalances);
      setRows(buildRows(depositPages, withdrawalPages, transferPages));
    } catch (e: any) {
      setBalances([]);
      setRows([]);
      setError(e?.message || '资金流水加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const list = useMemo(() => {
    if (filter === 'deposit') return rows.filter((item) => item.type === 'deposit');
    if (filter === 'withdraw') return rows.filter((item) => item.type === 'withdraw');
    if (filter === 'transfer') return rows.filter((item) => item.type === 'transfer');
    return rows;
  }, [filter, rows]);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>资金历史</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
            {balances.length > 0 ? `${balances.length} 个真实币种账户` : '充值 / 提现 / 划转真实 API 记录'}
          </div>
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(56, 189, 248, 0.26)',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="刷新资金历史"
        >
          <RefreshCw size={15} />
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

      {error && (
        <div
          style={{
            background: 'rgba(240, 185, 11, 0.10)',
            border: '1px solid rgba(240, 185, 11, 0.24)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            color: '#FCD535',
            fontSize: 12,
          }}
        >
          {error}
          {error.includes('登录') && (
            <Link href="/h5/login" style={{ color: '#38BDF8', marginLeft: 8, fontWeight: 700 }}>
              去登录
            </Link>
          )}
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
        <div style={{ padding: '10px 14px', fontSize: 11, color: '#7B89B8', borderBottom: '1px solid rgba(148, 163, 184, 0.10)' }}>
          真实 API 流水
        </div>
        {loading ? (
          <EmptyLine text="正在加载资金流水..." />
        ) : list.length === 0 ? (
          <EmptyLine text="暂无对应资金流水" />
        ) : (
          list.map((tx, index) => <HistoryRow key={tx.id} tx={tx} isLast={index === list.length - 1} />)
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div style={{ padding: 14, color: '#7B89B8', fontSize: 12 }}>{text}</div>;
}

function HistoryRow({ tx, isLast }: { tx: WalletHistoryRow; isLast: boolean }) {
  const isDeposit = tx.type === 'deposit';
  const isTransfer = tx.type === 'transfer';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottom: isLast ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: isTransfer
            ? 'rgba(56, 189, 248, 0.15)'
            : isDeposit ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isTransfer ? (
          <ArrowLeftRight size={14} color="#38BDF8" />
        ) : isDeposit ? (
          <ArrowDownToLine size={14} color="#34D399" />
        ) : (
          <ArrowUpFromLine size={14} color="#F472B6" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>
          {isTransfer ? '划转' : isDeposit ? '充值' : '提现'} {tx.currency}
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
          {formatTime(tx.time)}
          {tx.detail ? ` · ${String(tx.detail).slice(0, 12)}...` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 13,
            color: isTransfer ? '#38BDF8' : isDeposit ? '#34D399' : '#F472B6',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isTransfer ? '' : isDeposit ? '+' : '-'}{formatAmount(tx.amount)}
        </div>
        <div style={{ fontSize: 10, color: statusColor(tx.status), marginTop: 2 }}>
          {statusText(tx.status)}
        </div>
      </div>
    </div>
  );
}
