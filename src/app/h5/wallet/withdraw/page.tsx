'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, ScanLine } from 'lucide-react';
import { walletApi, type WalletBalance } from '@/lib/api/wallet';

const FALLBACK_CURRENCIES = ['USDT', 'BTC', 'ETH'];
const NETWORKS = ['TRC20', 'ERC20', 'BEP20'];

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

export default function H5WithdrawPage() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('TRC20');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadBalances = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!hasAuthToken()) {
      setBalances([]);
      setError('请先登录后发起提现');
      setLoading(false);
      return;
    }

    try {
      const nextBalances = await walletApi.getBalances();
      setBalances(nextBalances);
      if (nextBalances.length > 0 && !nextBalances.some((item) => item.currency === currency)) {
        setCurrency(nextBalances[0].currency);
      }
    } catch (e: any) {
      setBalances([]);
      setError(e?.message || '余额加载失败');
    } finally {
      setLoading(false);
    }
  }, [currency]);

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

  const available = toNumber(selectedBalance?.available);
  const fee = currency === 'USDT' ? 1 : 0;
  const receiveAmount = Math.max(toNumber(amount) - fee, 0);

  const setPercentAmount = (percent: number) => {
    if (!selectedBalance) return;
    const value = available * percent;
    setAmount(value > 0 ? value.toFixed(currency === 'USDT' ? 2 : 8).replace(/\.?0+$/, '') : '');
  };

  const submitWithdrawal = async () => {
    setError('');
    setMessage('');

    if (!hasAuthToken()) {
      setError('请先登录后发起提现');
      return;
    }

    if (!address.trim()) {
      setError('请输入提现地址');
      return;
    }

    const amountNum = toNumber(amount);
    if (amountNum <= 0) {
      setError('请输入有效提现数量');
      return;
    }

    if (selectedBalance && amountNum > available) {
      setError('提现数量不能大于可用余额');
      return;
    }

    setSubmitting(true);
    try {
      const withdrawal = await walletApi.createWithdrawal({
        currency,
        address: address.trim(),
        amount,
        memo: `${network} withdrawal from H5`,
      });
      setMessage(`提现申请已提交，状态：${withdrawal.status}`);
      setAmount('');
      await loadBalances();
    } catch (e: any) {
      setError(e?.message || '提现提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>数字资产提现</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>真实提交到 /api/v1/wallet/withdrawals</div>
        </div>
        <button
          onClick={loadBalances}
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

      <Panel>
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {currencyOptions.map((item) => {
            const active = item === currency;
            return (
              <button
                key={item}
                onClick={() => setCurrency(item)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: active ? 'rgba(244, 114, 182, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                  border: active ? '1px solid rgba(244, 114, 182, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                  color: active ? '#F472B6' : '#B4C0E0',
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
      </Panel>

      <Panel>
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现网络</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {NETWORKS.map((item) => {
            const active = item === network;
            return (
              <button
                key={item}
                onClick={() => setNetwork(item)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  background: active ? 'rgba(244, 114, 182, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                  border: active ? '1px solid rgba(244, 114, 182, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                  color: active ? '#F472B6' : '#B4C0E0',
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
      </Panel>

      <Panel>
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现地址</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="请输入或粘贴提现地址"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 14px',
              background: 'rgba(15, 27, 61, 0.50)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: 10,
              color: '#F8FAFC',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            style={{
              width: 42,
              padding: '10px 0',
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.30)',
              color: '#38BDF8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="扫码输入地址"
          >
            <ScanLine size={16} />
          </button>
        </div>
      </Panel>

      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>提现数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>
            可用: <span style={{ color: '#FCD535' }}>{formatAmount(available)} {currency}</span>
          </span>
        </div>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={`最小数量以后台币种配置为准`}
          inputMode="decimal"
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(15, 27, 61, 0.50)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 10,
            color: '#F8FAFC',
            fontSize: 16,
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
          {[
            { label: '25%', value: 0.25 },
            { label: '50%', value: 0.5 },
            { label: '75%', value: 0.75 },
            { label: 'MAX', value: 1 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setPercentAmount(item.value)}
              type="button"
              style={{
                padding: '6px 0',
                borderRadius: 6,
                background: 'rgba(148, 163, 184, 0.10)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                color: '#B4C0E0',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel compact>
        <RowItem label="网络手续费" value={currency === 'USDT' ? '约 1.00 USDT' : '以后台配置为准'} />
        <RowItem label="预计到账" value={`${formatAmount(receiveAmount)} ${currency}`} />
        <RowItem label="到账时间" value="链上确认后处理" />
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
        请仔细核对提现地址，提现申请提交后会锁定对应可用余额。当前 H5 已接真实提现 API，是否放行由后端账户权限和风控配置决定。
      </Notice>

      <button
        onClick={submitWithdrawal}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: submitting ? 'default' : 'pointer',
          boxShadow: '0 4px 16px rgba(244, 114, 182, 0.30)',
          opacity: submitting ? 0.72 : 1,
        }}
      >
        {submitting ? '提交中...' : '提交提现申请'}
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Panel({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: compact ? 12 : 16,
        padding: compact ? 12 : 14,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Notice({ children, icon, color }: { children: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        background: color === '#34D399' ? 'rgba(52, 211, 153, 0.10)' : 'linear-gradient(180deg, rgba(240, 185, 11, 0.10) 0%, rgba(21, 34, 74, 0.50) 100%)',
        border: `1px solid ${color === '#34D399' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(240, 185, 11, 0.25)'}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        display: 'flex',
        gap: 10,
        color,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
