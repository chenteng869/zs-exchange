'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  walletApi,
  type WalletBalance,
  type WalletDeposit,
  type WalletWithdrawal,
} from '@/lib/api/wallet';

type WalletTxRow = {
  id: string;
  type: 'deposit' | 'withdraw';
  currency: string;
  amount: string;
  status: string;
  time: string;
  hash?: string | null;
};

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  borderRadius: 16,
};

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: unknown, digits = 8): string {
  const num = toNumber(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatUsdt(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusText(status: string): string {
  if (['credited', 'completed', 'success'].includes(status)) return '成功';
  if (['failed', 'cancelled', 'rejected'].includes(status)) return '失败';
  if (status === 'processing') return '处理中';
  return '待处理';
}

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
}

function mergeTransactions(
  depositsByCurrency: Array<{ currency: string; items: WalletDeposit[] }>,
  withdrawalsByCurrency: Array<{ currency: string; items: WalletWithdrawal[] }>,
): WalletTxRow[] {
  const depositRows = depositsByCurrency.flatMap(({ currency, items }) =>
    items.map((item) => ({
      id: `deposit-${item.id}`,
      type: 'deposit' as const,
      currency,
      amount: item.amount,
      status: item.status,
      time: item.createdAt || item.confirmedAt || '',
      hash: item.txHash,
    })),
  );

  const withdrawalRows = withdrawalsByCurrency.flatMap(({ currency, items }) =>
    items.map((item) => ({
      id: `withdraw-${item.id}`,
      type: 'withdraw' as const,
      currency,
      amount: item.amount,
      status: item.status,
      time: item.createdAt || item.updatedAt || '',
      hash: item.txHash,
    })),
  );

  return [...depositRows, ...withdrawalRows].sort((a, b) => {
    return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
  });
}

export default function H5WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [txs, setTxs] = useState<WalletTxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!hasAuthToken()) {
      setBalances([]);
      setTxs([]);
      setError('请先登录后查看真实钱包资产');
      setLoading(false);
      return;
    }

    try {
      const nextBalances = await walletApi.getBalances();
      const currencies = Array.from(new Set(nextBalances.map((item) => item.currency))).filter(Boolean);
      const historyCurrencies = currencies.length > 0 ? currencies : ['USDT'];

      const [depositPages, withdrawalPages] = await Promise.all([
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
      ]);

      setBalances(nextBalances);
      setTxs(mergeTransactions(depositPages, withdrawalPages).slice(0, 3));
    } catch (e: any) {
      setBalances([]);
      setTxs([]);
      setError(e?.message || '钱包信息加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const usdtAvailable = useMemo(() => {
    const stableCurrencies = new Set(['USDT', 'USDC', 'USD']);
    return balances
      .filter((item) => stableCurrencies.has(item.currency))
      .reduce((sum, item) => sum + toNumber(item.available), 0);
  }, [balances]);

  const assetRows = balances.length > 0 ? balances : [];

  return (
    <div style={{ padding: '12px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(30, 64, 175, 0.30), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>现货钱包可用资产</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>真实余额来自 /api/v1/wallet/balances</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={loadWallet}
              disabled={loading}
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="刷新钱包"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="显示或隐藏余额"
            >
              {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16, position: 'relative' }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {showBalance ? formatUsdt(usdtAvailable) : '****.**'}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>USDT</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
          {[
            { icon: ArrowDownToLine, label: '充值', href: '/h5/wallet/deposit', color: '#38BDF8' },
            { icon: ArrowUpFromLine, label: '提现', href: '/h5/wallet/withdraw', color: '#A78BFA' },
            { icon: ArrowLeftRight, label: '划转', href: '/h5/wallet/transfer', color: '#F472B6' },
            { icon: Clock, label: '历史', href: '/h5/wallet/history', color: '#FCD535' },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <Link
                key={btn.label}
                href={btn.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 0',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon size={14} color={btn.color} />
                {btn.label}
              </Link>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ ...CARD_STYLE, padding: 12, marginBottom: 12, color: '#FCD535', fontSize: 12, lineHeight: 1.6 }}>
          {error}
          {error.includes('登录') && (
            <Link href="/h5/login" style={{ color: '#38BDF8', marginLeft: 8, fontWeight: 700 }}>
              去登录
            </Link>
          )}
        </div>
      )}

      <div style={{ ...CARD_STYLE, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: MapPin, label: '地址', href: '/h5/wallet/address', color: '#38BDF8' },
            { icon: ShieldCheck, label: '安全', href: '/h5/wallet/security', color: '#34D399' },
            { icon: Wallet, label: '现货', href: '/h5/assets', color: '#FCD535' },
            { icon: ArrowLeftRight, label: '划转', href: '/h5/wallet/transfer', color: '#A78BFA' },
          ].map((entry) => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.label}
                href={entry.href}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '6px 0', textDecoration: 'none' }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${entry.color}26`,
                    border: `1px solid ${entry.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color={entry.color} />
                </div>
                <span style={{ fontSize: 11, color: '#B4C0E0' }}>{entry.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <SectionTitle title="我的币种" />

      <div style={{ ...CARD_STYLE, overflow: 'hidden', marginBottom: 12 }}>
        {loading ? (
          <EmptyLine text="正在加载真实余额..." />
        ) : assetRows.length === 0 ? (
          <EmptyLine text="暂无真实余额记录" />
        ) : (
          assetRows.map((asset, index) => (
            <div
              key={asset.id || asset.currency}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 14,
                borderBottom: index < assetRows.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0F1B3D',
                  flexShrink: 0,
                }}
              >
                {asset.currency.slice(0, 3)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{asset.currency}</div>
                <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
                  冻结 {showBalance ? formatAmount(asset.frozen) : '****'} / 锁定 {showBalance ? formatAmount(asset.locked) : '****'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {showBalance ? formatAmount(asset.available) : '****'}
                </div>
                <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>可用</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>最近记录</span>
          <Link href="/h5/wallet/history" style={{ fontSize: 12, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            全部 <ChevronRight size={12} />
          </Link>
        </div>
        {loading ? (
          <EmptyLine text="正在加载交易记录..." />
        ) : txs.length === 0 ? (
          <EmptyLine text="暂无充值或提现记录" />
        ) : (
          txs.map((tx, index) => <TransactionRow key={tx.id} tx={tx} isLast={index === txs.length - 1} />)
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: 'linear-gradient(180deg, #38BDF8 0%, #1E40AF 100%)', boxShadow: '0 0 6px rgba(56, 189, 248, 0.50)' }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div style={{ padding: 14, color: '#7B89B8', fontSize: 12 }}>{text}</div>;
}

function TransactionRow({ tx, isLast }: { tx: WalletTxRow; isLast: boolean }) {
  const isDeposit = tx.type === 'deposit';
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
          background: isDeposit ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isDeposit ? <ArrowDownToLine size={14} color="#34D399" /> : <ArrowUpFromLine size={14} color="#F472B6" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
          {isDeposit ? '充值' : '提现'} {tx.currency}
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{formatTime(tx.time)}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, color: isDeposit ? '#34D399' : '#F472B6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {isDeposit ? '+' : '-'}{formatAmount(tx.amount)} {tx.currency}
        </div>
        <div style={{ fontSize: 10, color: statusText(tx.status) === '成功' ? '#34D399' : '#FCD535', marginTop: 2 }}>
          {statusText(tx.status)}
        </div>
      </div>
    </div>
  );
}
