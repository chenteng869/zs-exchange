'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  walletApi,
  type WalletAccountBalances,
  type WalletAccountKey,
  type WalletBalance,
} from '@/lib/api/wallet';

const FALLBACK_CURRENCIES = ['USDT', 'BTC', 'ETH'];

const EMPTY_ACCOUNT_BALANCES: WalletAccountBalances = {
  spot: '0',
  fund: '0',
  futures: '0',
};

const ACCOUNTS: Array<{
  key: WalletAccountKey;
  label: string;
  icon: typeof Wallet;
  color: string;
}> = [
  { key: 'spot', label: '现货账户', icon: Wallet, color: '#38BDF8' },
  { key: 'fund', label: '理财账户', icon: PiggyBank, color: '#FCD535' },
  { key: 'futures', label: '合约账户', icon: TrendingUp, color: '#F472B6' },
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

function getAccountLabel(key: WalletAccountKey): string {
  return ACCOUNTS.find((account) => account.key === key)?.label || key;
}

function upsertBalance(list: WalletBalance[], balance: WalletBalance): WalletBalance[] {
  const index = list.findIndex((item) => item.currency === balance.currency);
  if (index === -1) return [balance, ...list];

  const next = [...list];
  next[index] = balance;
  return next;
}

export default function H5TransferPage() {
  const [from, setFrom] = useState<WalletAccountKey>('spot');
  const [to, setTo] = useState<WalletAccountKey>('fund');
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [accountBalances, setAccountBalances] = useState<WalletAccountBalances>(EMPTY_ACCOUNT_BALANCES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadBalances = useCallback(
    async (options: { preserveMessage?: boolean } = {}) => {
      setLoading(true);
      setError('');
      if (!options.preserveMessage) setMessage('');

      if (!hasAuthToken()) {
        setBalances([]);
        setAccountBalances(EMPTY_ACCOUNT_BALANCES);
        setError('请先登录后查看划转余额');
        setLoading(false);
        return;
      }

      try {
        const [nextBalances, transferOverview] = await Promise.all([
          walletApi.getBalances(),
          walletApi.getTransfers(currency),
        ]);

        setBalances(nextBalances);
        setAccountBalances(transferOverview.accountBalances || EMPTY_ACCOUNT_BALANCES);

        if (nextBalances.length > 0 && !nextBalances.some((item) => item.currency === currency)) {
          setCurrency(nextBalances[0].currency);
        }
      } catch (e: any) {
        setBalances([]);
        setAccountBalances(EMPTY_ACCOUNT_BALANCES);
        setError(e?.message || '余额加载失败');
      } finally {
        setLoading(false);
      }
    },
    [currency],
  );

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const selectedBalance = useMemo(
    () => balances.find((item) => item.currency === currency) || null,
    [balances, currency],
  );

  const currencyOptions = useMemo(() => {
    const fromBalances = balances.map((item) => item.currency);
    return Array.from(new Set([...fromBalances, ...FALLBACK_CURRENCIES]));
  }, [balances]);

  const availableByAccount = useMemo<WalletAccountBalances>(
    () => ({
      ...accountBalances,
      spot: selectedBalance?.available || accountBalances.spot || '0',
    }),
    [accountBalances, selectedBalance],
  );

  const fromAvailable = toNumber(availableByAccount[from]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const setMax = () => {
    setAmount(fromAvailable > 0 ? String(fromAvailable) : '');
  };

  const submitTransfer = async () => {
    setError('');
    setMessage('');

    if (!hasAuthToken()) {
      setError('请先登录后发起划转');
      return;
    }

    if (from === to) {
      setError('转出账户和转入账户不能相同');
      return;
    }

    const amountNum = toNumber(amount);
    if (amountNum <= 0) {
      setError('请输入有效划转数量');
      return;
    }

    if (amountNum > fromAvailable) {
      setError('划转数量不能大于转出账户可用余额');
      return;
    }

    setSubmitting(true);
    try {
      const result = await walletApi.createTransfer({
        fromAccount: from,
        toAccount: to,
        currency,
        amount: amount.trim(),
      });

      if (result.accountBalances) {
        setAccountBalances(result.accountBalances);
      }
      if (result.spotBalance) {
        setBalances((prev) => upsertBalance(prev, result.spotBalance!));
      }

      setAmount('');
      setMessage(
        `划转成功：${formatAmount(result.amount)} ${result.currency} 已从${getAccountLabel(from)}转入${getAccountLabel(to)}`,
      );
      await loadBalances({ preserveMessage: true });
    } catch (e: any) {
      setError(e?.message || '划转失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>账户划转</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>现货、理财、合约账户走后端划转流水</div>
        </div>
        <button
          onClick={() => loadBalances()}
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
          aria-label="刷新余额"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>
      </div>

      <AccountSelector
        label="从"
        activeKey={from}
        onChange={setFrom}
        accounts={ACCOUNTS}
        balance={`可用: ${formatAmount(availableByAccount[from])} ${currency}`}
      />

      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
        <button
          onClick={swap}
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(252, 213, 53, 0.30)',
            zIndex: 2,
          }}
          aria-label="交换账户"
        >
          <ArrowLeftRight size={18} color="#0F1B3D" />
        </button>
      </div>

      <AccountSelector
        label="到"
        activeKey={to}
        onChange={setTo}
        accounts={ACCOUNTS}
        balance={`可用: ${formatAmount(availableByAccount[to])} ${currency}`}
      />

      <Panel>
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>选择币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {currencyOptions.map((item) => {
            const active = item === currency;
            return (
              <button
                key={item}
                onClick={() => setCurrency(item)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: active ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                  border: active ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                  color: active ? '#38BDF8' : '#B4C0E0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>划转数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>
            转出可用: <span style={{ color: '#FCD535', fontWeight: 600 }}>{formatAmount(fromAvailable)} {currency}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px 14px',
              background: 'rgba(15, 27, 61, 0.50)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: 10,
              color: '#F8FAFC',
              fontSize: 18,
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={setMax}
            type="button"
            style={{
              width: 58,
              borderRadius: 10,
              border: '1px solid rgba(252, 213, 53, 0.32)',
              background: 'rgba(252, 213, 53, 0.12)',
              color: '#FCD535',
              fontWeight: 700,
            }}
          >
            MAX
          </button>
        </div>
      </Panel>

      {error && (
        <Notice color="#FCD535" icon={<AlertCircle size={16} color="#FCD535" />}>
          {error}
          {error.includes('登录') && (
            <Link href="/h5/login" style={{ color: '#38BDF8', marginLeft: 8, fontWeight: 700 }}>
              去登录
            </Link>
          )}
        </Notice>
      )}

      {message && (
        <Notice color="#34D399" icon={<CheckCircle2 size={16} color="#34D399" />}>
          {message}
        </Notice>
      )}

      <Notice color="#B4C0E0" icon={<AlertCircle size={16} color="#FCD535" />}>
        现货账户同步更新交易余额，理财和合约账户由后端划转流水计算可用余额。
      </Notice>

      <button
        onClick={submitTransfer}
        disabled={loading || submitting}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: loading || submitting ? 'rgba(148, 163, 184, 0.28)' : 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: loading || submitting ? '#7B89B8' : '#0F1B3D',
          fontSize: 16,
          fontWeight: 700,
          cursor: loading || submitting ? 'not-allowed' : 'pointer',
          boxShadow: loading || submitting ? 'none' : '0 4px 16px rgba(252, 213, 53, 0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? '划转中' : '确认划转'}
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

type Account = (typeof ACCOUNTS)[number];

function AccountSelector({
  label,
  activeKey,
  onChange,
  accounts,
  balance,
}: {
  label: string;
  activeKey: WalletAccountKey;
  onChange: (key: WalletAccountKey) => void;
  accounts: Account[];
  balance: string;
}) {
  return (
    <Panel>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#7B89B8' }}>{balance}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {accounts.map((account) => {
          const Icon = account.icon;
          const active = account.key === activeKey;
          return (
            <button
              key={account.key}
              onClick={() => onChange(account.key)}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 12,
                background: active ? `${account.color}26` : 'rgba(148, 163, 184, 0.06)',
                border: active ? `1px solid ${account.color}50` : '1px solid rgba(148, 163, 184, 0.10)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon size={14} color={active ? account.color : '#7B89B8'} />
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? account.color : '#B4C0E0' }}>
                {account.label}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Notice({ children, color, icon }: { children: ReactNode; color: string; icon: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '11px 12px',
        borderRadius: 12,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        color,
        fontSize: 12,
        lineHeight: 1.5,
        marginBottom: 12,
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div>{children}</div>
    </div>
  );
}
