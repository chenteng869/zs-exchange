'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import {
  walletApi,
  type WalletAccountBalances,
  type WalletAccountKey,
  type WalletBalance,
} from '@/lib/api/wallet';

type Tab = 'all' | WalletAccountKey;

const EMPTY_ACCOUNT_BALANCES: WalletAccountBalances = {
  spot: '0',
  fund: '0',
  futures: '0',
};

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
}

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: unknown): string {
  return toNumber(String(value ?? 0)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function getAccountValue(tab: Tab, balance: WalletBalance, accountBalances: WalletAccountBalances): string {
  if (tab === 'fund') return accountBalances.fund || '0';
  if (tab === 'futures') return accountBalances.futures || '0';
  return balance.available;
}

export default function H5Assets() {
  const [tab, setTab] = useState<Tab>('all');
  const [showBalance, setShowBalance] = useState(true);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [accountBalancesByCurrency, setAccountBalancesByCurrency] = useState<Record<string, WalletAccountBalances>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadAssets() {
      setLoading(true);
      setApiError('');

      if (!hasAuthToken()) {
        if (!alive) return;
        setBalances([]);
        setAccountBalancesByCurrency({});
        setApiError('登录后可查看真实资产');
        setLoading(false);
        return;
      }

      try {
        const nextBalances = await walletApi.getBalances();
        const accountEntries = await Promise.all(
          nextBalances.map(async (item) => {
            const overview = await walletApi.getTransfers(item.currency);
            return [item.currency, overview.accountBalances || EMPTY_ACCOUNT_BALANCES] as const;
          }),
        );

        if (!alive) return;
        setBalances(nextBalances);
        setAccountBalancesByCurrency(Object.fromEntries(accountEntries));
      } catch (error: any) {
        if (!alive) return;
        setBalances([]);
        setAccountBalancesByCurrency({});
        setApiError(error?.message || '余额加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAssets();

    return () => {
      alive = false;
    };
  }, []);

  const assets = useMemo(() => {
    return balances
      .map((item) => {
        const accountBalances = accountBalancesByCurrency[item.currency] || EMPTY_ACCOUNT_BALANCES;
        const amount = getAccountValue(tab, item, accountBalances);
        return {
          symbol: item.currency,
          name: item.currency,
          amount,
          value: amount,
          accountBalances,
        };
      })
      .filter((item) => tab === 'all' || toNumber(item.amount) > 0);
  }, [accountBalancesByCurrency, balances, tab]);

  const totalValue = balances.reduce((sum, item) => sum + toNumber(item.balance), 0);
  const todayPnl = 0;

  return (
    <div style={{ padding: 12 }}>
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
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>总资产估值(USDT)</div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', padding: 2, display: 'flex' }}
            aria-label="显示或隐藏资产"
          >
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, position: 'relative' }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {showBalance ? totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '****.****'}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>USDT</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, position: 'relative' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)' }}>今日盈亏</span>
          <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>+{todayPnl.toFixed(2)} USDT</span>
        </div>

        {apiError && (
          <div style={{ marginBottom: 12, color: '#FCD535', fontSize: 11, position: 'relative' }}>
            {apiError}
            {apiError.includes('登录') && (
              <Link href="/h5/login" style={{ color: '#38BDF8', marginLeft: 8, fontWeight: 700 }}>
                去登录
              </Link>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
          {[
            { icon: ArrowDownToLine, label: '充值', href: '/h5/wallet/deposit', color: '#38BDF8' },
            { icon: ArrowUpFromLine, label: '提现', href: '/h5/wallet/withdraw', color: '#A78BFA' },
            { icon: ArrowLeftRight, label: '划转', href: '/h5/wallet/transfer', color: '#F472B6' },
            { icon: Settings, label: '管理', href: '/h5/assets/manage', color: '#FCD535' },
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
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  textDecoration: 'none',
                }}
              >
                <Icon size={14} color={btn.color} />
                {btn.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[
          { k: 'all', l: '全部' },
          { k: 'spot', l: '现货' },
          { k: 'fund', l: '理财' },
          { k: 'futures', l: '合约' },
        ].map((item) => {
          const active = item.k === tab;
          return (
            <button
              key={item.k}
              onClick={() => setTab(item.k as Tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {item.l}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 14, color: '#7B89B8', fontSize: 12 }}>正在加载真实资产...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: 14, color: '#7B89B8', fontSize: 12 }}>暂无真实资产记录</div>
        ) : (
          assets.map((asset, index) => (
            <div
              key={asset.symbol}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 14,
                borderBottom: index < assets.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
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
                {asset.symbol.slice(0, 3)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{asset.symbol}</div>
                <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
                  {formatAmount(asset.amount)} {asset.symbol}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {showBalance ? formatAmount(asset.value) : '****'}
                  <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 4 }}>{asset.symbol}</span>
                </div>
                <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>
                  {tab === 'all' ? '现货' : tab === 'fund' ? '理财' : tab === 'futures' ? '合约' : '现货'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
